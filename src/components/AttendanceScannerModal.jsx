import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, Camera, CheckCircle2, AlertCircle, RefreshCw, Users, Calendar, 
  Clock, ShieldCheck, ArrowRight, ArrowLeft, Search, Check, AlertTriangle, 
  Sparkles, UserCheck, ShieldAlert
} from 'lucide-react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Web Audio API Beep Generator (100% self-contained sound effect)
function playScanBeep(success = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (_) {
    // Non-fatal audio fallback
  }
}

const ATTENDANCE_DAYS = Array.from({ length: 15 }, (_, i) => `Day ${i + 1}`);

function checkIsLate(startTimeStr, graceMinutes = 15) {
  if (!startTimeStr) return false;
  const now = new Date();
  const [startHour, startMin] = startTimeStr.split(':').map(Number);
  if (isNaN(startHour) || isNaN(startMin)) return false;

  // Cutoff includes up to the 59th second of the grace minute
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin + Number(graceMinutes), 59, 999);
  return now.getTime() > cutoff.getTime();
}

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getCutoffTime12h(startTimeStr, graceMinutes = 15) {
  if (!startTimeStr) return '';
  const [h, m] = startTimeStr.split(':').map(Number);
  if (isNaN(h)) return '';
  const totalMin = h * 60 + m + Number(graceMinutes);
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  const ampm = endH >= 12 ? 'PM' : 'AM';
  const hour12 = endH % 12 || 12;
  return `${hour12}:${String(endM).padStart(2, '0')} ${ampm}`;
}

export function AttendanceScannerModal({ 
  isOpen, 
  onClose, 
  currentDepartment = 'All', 
  currentUser = null,
  students: propStudents = []
}) {
  const { showToast } = useAuth();

  // Workflow step: 1 = Session Setup, 2 = Live Scanner & Roster
  const [step, setStep] = useState(1);

  // Session Configuration State (Step 1)
  const [selectedDay, setSelectedDay] = useState('Day 1');
  const [activityName, setActivityName] = useState('NSTP Field Session');
  const [sessionStartTime, setSessionStartTime] = useState('08:00'); // '08:00' default
  const [gracePeriod, setGracePeriod] = useState(15); // minutes (0, 10, 15, 30)

  // Scanner & Live Session State (Step 2)
  const [scanType, setScanType] = useState('TIME_IN'); // 'TIME_IN' | 'TIME_OUT'
  const [manualInput, setManualInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // { type: 'success' | 'late' | 'already' | 'error', message: '' }
  const [sessionLogs, setSessionLogs] = useState([]);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [isSaved, setIsSaved] = useState(false);
  const [pastAttendanceRecords, setPastAttendanceRecords] = useState([]);

  // Excuse Student Modal State
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [excuseSearch, setExcuseSearch] = useState('');
  const [selectedStudentToExcuse, setSelectedStudentToExcuse] = useState(null);
  const [excuseReason, setExcuseReason] = useState('Medical reason / illness with excuse letter');
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);

  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  const fullActivityTitle = `${selectedDay} - ${activityName.trim() || 'NSTP Session'}`;

  // Filter students eligible for this instructor's department
  const availableStudents = useMemo(() => {
    let list = propStudents && propStudents.length > 0 ? propStudents : [];
    if (list.length === 0) {
      try {
        const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
        if (Array.isArray(cached) && cached.length > 0) list = cached;
      } catch (_) {}
    }
    const targetDept = (currentDepartment && currentDepartment !== 'All' && currentDepartment !== 'NSTP Office')
      ? currentDepartment
      : (currentUser?.department && ['CWTS', 'ROTC', 'LTS'].includes(currentUser.department) ? currentUser.department : null);

    if (targetDept) {
      const deptUpper = targetDept.toUpperCase();
      return list.filter(s => {
        const d = (s.department || s.component || s.nstp_program || s.program || '').toUpperCase();
        return d === deptUpper || d.includes(deptUpper);
      });
    }
    return list;
  }, [propStudents, currentDepartment, currentUser]);

  // Filtered students for Excuse Picker
  const filteredStudentsForExcuse = useMemo(() => {
    if (!excuseSearch.trim()) return availableStudents.slice(0, 15);
    const q = excuseSearch.toLowerCase().trim();
    return availableStudents.filter(s => {
      const name = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
      const id = String(s.studentId || s.id || '').toLowerCase();
      const sec = (s.section || '').toLowerCase();
      return name.includes(q) || id.includes(q) || sec.includes(q);
    }).slice(0, 20);
  }, [availableStudents, excuseSearch]);

  // Reset to Step 1 when modal opens and auto-select first available unconducted day
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setScanStatus(null);
      setLastScannedStudent(null);
      setIsSaved(false);
      setSessionLogs([]);

      let isMounted = true;
      attendanceAPI.getRecords({ limit: 5000 })
        .then(recs => {
          if (isMounted && Array.isArray(recs)) {
            setPastAttendanceRecords(recs);
          }
        })
        .catch(() => {});

      return () => { isMounted = false; };
    }
  }, [isOpen]);

  // Track completed/conducted days for this instructor's department
  const targetDept = useMemo(() => {
    return (currentDepartment && currentDepartment !== 'All' && currentDepartment !== 'NSTP Office')
      ? currentDepartment
      : (currentUser?.department && ['CWTS', 'ROTC', 'LTS'].includes(currentUser.department) ? currentUser.department : 'CWTS');
  }, [currentDepartment, currentUser]);

  const completedDays = useMemo(() => {
    const conducted = new Set();
    let allRecords = pastAttendanceRecords;
    if (!allRecords || allRecords.length === 0) {
      try {
        allRecords = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
      } catch (_) {
        allRecords = [];
      }
    }

    const deptUpper = (targetDept || '').toUpperCase();
    allRecords.forEach(r => {
      const rDept = (r.department || '').toUpperCase();
      if (!deptUpper || rDept === deptUpper || rDept.includes(deptUpper)) {
        const act = (r.activity_name || r.day || '').trim();
        ATTENDANCE_DAYS.forEach((d) => {
          const regex = new RegExp(`(^|[^a-zA-Z0-9])(${d}|${d.replace(' ', '')}|${d.replace('Day ', 'D')})([^a-zA-Z0-9]|$)`, 'i');
          if (regex.test(act)) {
            conducted.add(d);
          }
        });
      }
    });
    return conducted;
  }, [pastAttendanceRecords, targetDept]);

  // Auto-switch to first available unconducted day if current selectedDay is already completed
  useEffect(() => {
    if (isOpen) {
      if (completedDays.has(selectedDay)) {
        const firstAvailable = ATTENDANCE_DAYS.find(d => !completedDays.has(d));
        if (firstAvailable) {
          setSelectedDay(firstAvailable);
        }
      }
    }
  }, [isOpen, completedDays, selectedDay]);

  // Handle QR code scanning process
  const handleProcessScan = useCallback(async (rawCode) => {
    if (!rawCode || isProcessingRef.current) return;
    isProcessingRef.current = true;
    const cleanCode = rawCode.trim();

    // Enforce Rule: Student CANNOT Time Out without a valid Time In for this day
    const existingCache = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
    const hasTimeIn = sessionLogs.some(l => (
      (String(l.student_id) === cleanCode || l.student?.studentId === cleanCode || l.student?.nstp_serial_id === cleanCode || l.student?.qr_token === cleanCode) &&
      (l.day === selectedDay || (l.activity_name || '').includes(selectedDay)) &&
      (l.scan_type === 'TIME_IN' || l.status === 'Late' || l.status === 'Timed In' || l.status === 'Incomplete')
    )) || existingCache.some(r => (
      String(r.student_id) === cleanCode &&
      (r.activity_name || '').includes(selectedDay) &&
      r.scan_type === 'TIME_IN'
    ));

    if (scanType === 'TIME_OUT' && !hasTimeIn) {
      playScanBeep(false);
      setScanStatus({
        type: 'error',
        message: `⚠️ Cannot Time Out: Student must first Time In before Timing Out for ${selectedDay}.`
      });
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
      return;
    }

    // Check if scanning TIME_IN and calculate lateness against scheduled session start time
    const isLateNow = scanType === 'TIME_IN' ? checkIsLate(sessionStartTime, gracePeriod) : false;

    try {
      const res = await attendanceAPI.scan({
        tokenOrId: cleanCode,
        activity_name: fullActivityTitle,
        scan_type: scanType,
        is_late: isLateNow,
        session_start_time: sessionStartTime
      });

      if (res.already_scanned) {
        playScanBeep(false);
        setLastScannedStudent(res.student);
        setScanStatus({
          type: 'already',
          message: res.message || `Already ${scanType === 'TIME_IN' ? 'timed in' : 'timed out'} for ${selectedDay}`
        });
      } else if (res.success) {
        playScanBeep(true);
        setLastScannedStudent(res.student);

        // Check if student was previously late on Time In in this session
        const previousLate = sessionLogs.some(l => (
          (String(l.student_id) === cleanCode || l.student?.studentId === cleanCode) &&
          (l.status === 'Late' || l.is_late)
        ));
        const finalStudentIsLate = isLateNow || previousLate || res.is_late;

        let statusText = 'Timed In';
        if (scanType === 'TIME_IN') {
          statusText = finalStudentIsLate ? 'Late' : 'Timed In';
          setScanStatus({
            type: finalStudentIsLate ? 'late' : 'success',
            message: finalStudentIsLate
              ? `⚠️ LATE: Timed in at ${new Date().toLocaleTimeString()} (Cutoff: ${getCutoffTime12h(sessionStartTime, gracePeriod)}). Recorded as Late for ${selectedDay}.`
              : `🟢 ON-TIME: Time In recorded at ${new Date().toLocaleTimeString()}! Student must Time Out to complete session.`
          });
        } else {
          statusText = finalStudentIsLate ? 'Late' : 'Present';
          setScanStatus({
            type: 'success',
            message: finalStudentIsLate
              ? `🟠 Time Out complete! Status: LATE (Late time-in) for ${selectedDay}.`
              : `🟢 Time Out complete! Status: PRESENT for ${selectedDay}.`
          });
        }

        // Prepend to session logs
        setSessionLogs((prev) => [
          {
            ...res.record,
            student: res.student,
            day: selectedDay,
            student_id: res.student?.studentId || res.record?.student_id || cleanCode,
            student_name: res.student?.name || `${res.student?.firstName || ''} ${res.student?.lastName || ''}`.trim() || res.record?.student_name,
            department: res.student?.department || res.record?.department || currentDepartment || 'CWTS',
            section: res.student?.section || res.record?.section || '',
            scan_type: scanType,
            status: statusText,
            is_late: finalStudentIsLate,
            time: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
          },
          ...prev.filter(p => !(String(p.student_id) === cleanCode && p.scan_type === scanType && p.day === selectedDay))
        ]);
      }
    } catch (err) {
      playScanBeep(false);
      setScanStatus({
        type: 'error',
        message: err.message || 'No matching student found for this QR code.'
      });
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500); // Cooldown to avoid duplicate burst reads
    }
  }, [fullActivityTitle, scanType, selectedDay, sessionLogs, sessionStartTime, gracePeriod, currentDepartment]);

  // Stop QR Camera Scanner
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
  }, []);

  // Start QR Camera Scanner
  const startCamera = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }

      const container = document.getElementById('qr-reader-video-box');
      if (!container) return;

      const html5QrCode = new Html5Qrcode('qr-reader-video-box');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 25,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.floor(minEdge * 0.72);
          return {
            width: Math.max(180, Math.min(edgeSize, 250)),
            height: Math.max(180, Math.min(edgeSize, 250))
          };
        },
        aspectRatio: 1.0,
        disableFlip: cameraFacing === 'environment',
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await html5QrCode.start(
        { facingMode: cameraFacing },
        config,
        (decodedText) => {
          if (!isProcessingRef.current) {
            handleProcessScan(decodedText);
          }
        },
        () => {}
      );
    } catch (err) {
      console.warn('Camera start error:', err);
    }
  }, [cameraFacing, handleProcessScan]);

  // Control Camera strictly on Step 2
  useEffect(() => {
    if (isOpen && step === 2) {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, step, startCamera, stopCamera]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleProcessScan(manualInput.trim());
      setManualInput('');
    }
  };

  // Excuse Student confirmation handler
  const handleConfirmExcuse = async () => {
    if (!selectedStudentToExcuse) return;
    setIsSubmittingExcuse(true);
    try {
      const cleanId = String(selectedStudentToExcuse.studentId || selectedStudentToExcuse.id).trim();
      await attendanceAPI.scan({
        tokenOrId: cleanId,
        activity_name: fullActivityTitle,
        scan_type: 'EXCUSED',
        notes: excuseReason
      });

      playScanBeep(true);
      setSessionLogs(prev => [
        {
          id: Date.now() + Math.random(),
          student: selectedStudentToExcuse,
          day: selectedDay,
          student_id: cleanId,
          student_name: selectedStudentToExcuse.name || `${selectedStudentToExcuse.firstName || ''} ${selectedStudentToExcuse.lastName || ''}`.trim(),
          department: selectedStudentToExcuse.department || currentDepartment || 'CWTS',
          section: selectedStudentToExcuse.section || '',
          scan_type: 'EXCUSED',
          status: 'Excused',
          notes: excuseReason,
          time: new Date().toLocaleTimeString(),
          date: new Date().toLocaleDateString()
        },
        ...prev.filter(l => String(l.student_id) !== cleanId)
      ]);

      showToast(`${selectedStudentToExcuse.name || cleanId} marked as EXCUSED for ${selectedDay}!`, 'success');
      setShowExcuseModal(false);
      setSelectedStudentToExcuse(null);
    } catch (err) {
      console.error('Failed to excuse student:', err);
      showToast(err.message || 'Error recording excuse status.', 'error');
    } finally {
      setIsSubmittingExcuse(false);
    }
  };

  // Save Record into Attendance Tracker and Database
  const handleSaveRecord = async () => {
    if (sessionLogs.length === 0) {
      showToast('No attendees in current session list. Please scan student IDs first.', 'warning');
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
      
      // Group session logs by student ID to determine final attendance statuses
      const studentMap = {};
      sessionLogs.forEach(log => {
        const sid = String(log.student_id || log.student?.studentId || '').trim();
        if (!sid) return;
        if (!studentMap[sid]) {
          studentMap[sid] = {
            student: log.student,
            student_id: sid,
            student_name: log.student_name || log.student?.name || `${log.student?.lastName || ''}, ${log.student?.firstName || ''}`.trim(),
            department: log.department || log.student?.department || currentDepartment || 'CWTS',
            section: log.section || log.student?.section || '',
            hasTimeIn: false,
            hasTimeOut: false,
            isExcused: false,
            isLate: false,
            timeInTime: null,
            timeOutTime: null,
            notes: log.notes || ''
          };
        }
        if (log.scan_type === 'EXCUSED' || log.status === 'Excused') {
          studentMap[sid].isExcused = true;
          studentMap[sid].notes = log.notes || 'Excused absence';
        }
        if (log.scan_type === 'TIME_IN') {
          studentMap[sid].hasTimeIn = true;
          studentMap[sid].timeInTime = log.time;
          if (log.status === 'Late' || log.is_late) {
            studentMap[sid].isLate = true;
          }
        }
        if (log.scan_type === 'TIME_OUT') {
          studentMap[sid].hasTimeOut = true;
          studentMap[sid].timeOutTime = log.time;
          if (log.status === 'Late' || log.is_late) {
            studentMap[sid].isLate = true;
          }
        }
      });

      // Cross-check existing cache for matching records
      existing.forEach(rec => {
        const sid = String(rec.student_id);
        if (studentMap[sid] && (rec.activity_name || '').includes(selectedDay)) {
          if (rec.scan_type === 'TIME_IN') {
            studentMap[sid].hasTimeIn = true;
            if (rec.status === 'Late') studentMap[sid].isLate = true;
          }
          if (rec.scan_type === 'TIME_OUT') studentMap[sid].hasTimeOut = true;
          if (rec.scan_type === 'EXCUSED') studentMap[sid].isExcused = true;
        }
      });

      const recordsToPersist = [];
      Object.values(studentMap).forEach(st => {
        if (st.isExcused) {
          recordsToPersist.push({
            student_id: st.student_id,
            student_name: st.student_name,
            department: st.department,
            section: st.section,
            activity_name: fullActivityTitle,
            scan_type: 'EXCUSED',
            scanned_at: new Date().toISOString(),
            status: 'Excused',
            notes: st.notes || 'Excused absence'
          });
          return;
        }

        // If student has both TIME_IN and TIME_OUT:
        // Present if on time, Late if late on time-in
        if (st.hasTimeIn && st.hasTimeOut) {
          const finalStatus = st.isLate ? 'Late' : 'Present';
          recordsToPersist.push({
            student_id: st.student_id,
            student_name: st.student_name,
            department: st.department,
            section: st.section,
            activity_name: fullActivityTitle,
            scan_type: 'TIME_OUT',
            scanned_at: new Date().toISOString(),
            status: finalStatus,
            notes: st.isLate ? 'Late attendance' : 'Complete attendance'
          });
        } else if (st.hasTimeIn && !st.hasTimeOut) {
          // TIME_IN ONLY (did not time out): Incomplete (INC)
          recordsToPersist.push({
            student_id: st.student_id,
            student_name: st.student_name,
            department: st.department,
            section: st.section,
            activity_name: fullActivityTitle,
            scan_type: 'TIME_IN',
            scanned_at: new Date().toISOString(),
            status: 'Incomplete',
            notes: st.isLate ? 'Incomplete (Late Time-In, No Time-Out)' : 'Incomplete (Timed in only, no Time-Out)'
          });
        }
      });

      // Save directly to the MySQL database via backend batch-save API
      await attendanceAPI.batchSave(recordsToPersist).catch(err => console.warn('API batchSave notice:', err));

      const presentCount = recordsToPersist.filter(r => r.status === 'Present').length;
      const lateCount = recordsToPersist.filter(r => r.status === 'Late').length;
      const incompleteCount = recordsToPersist.filter(r => r.status === 'Incomplete').length;
      const excusedCount = recordsToPersist.filter(r => r.status === 'Excused').length;

      // Merge and deduplicate client-side cache
      const merged = [
        ...recordsToPersist,
        ...existing.filter(e => !(
          recordsToPersist.some(n => String(n.student_id) === String(e.student_id) && (e.activity_name || '').includes(selectedDay))
        ))
      ];

      localStorage.setItem('nstp_cached_attendance_records', JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('nstp_attendance_updated'));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      // Immediately add persisted records to pastAttendanceRecords so this day is locked
      setPastAttendanceRecords(prev => [...prev, ...recordsToPersist]);

      showToast(`Attendance saved for ${selectedDay}: ${presentCount} Present, ${lateCount} Late, ${incompleteCount} Incomplete, ${excusedCount} Excused!`, 'success');
    } catch (err) {
      console.error('Error saving record:', err);
      showToast('Failed to save record. Please try again.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        
        {/* Header with Stepper Progress */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              {step === 1 ? <Clock className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black leading-tight">
                  {step === 1 ? 'Configure Attendance Session' : 'Live QR Attendance Scanner'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">
                {step === 1 
                  ? 'Set class day, activity title, and scheduled start time' 
                  : `${selectedDay} • ${activityName} (Start: ${formatTime12h(sessionStartTime)})`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: SESSION SETUP SCREEN                                         */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4 sm:space-y-6">
            
            {/* Step 1 Introduction Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-600">
                <p className="font-extrabold text-slate-800 text-sm">Before scanning student IDs:</p>
                <p className="mt-0.5">
                  Set the session Day (Day 1 - 15), activity title, and <b>scheduled class start time</b>. The system automatically marks students as <b>Late (L)</b> if they scan Time In after the scheduled cutoff time (+ grace period).
                </p>
              </div>
            </div>

            {/* Attendance Day & Start Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Field 1: Attendance Day Selection */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>1. Attendance Day</span>
                </label>
                <select
                  id="setup-attendance-day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border-2 border-emerald-600 font-black text-emerald-950 text-sm focus:outline-none focus:bg-white cursor-pointer"
                >
                  {ATTENDANCE_DAYS.map((day) => {
                    const isCompleted = completedDays.has(day);
                    return (
                      <option 
                        key={day} 
                        value={day} 
                        disabled={isCompleted}
                        className={isCompleted ? 'text-slate-400 bg-slate-100 font-normal italic' : 'text-emerald-950 font-bold'}
                      >
                        {day} {isCompleted ? '— (Conducted / Closed)' : '— (Available)'}
                      </option>
                    );
                  })}
                </select>
                {completedDays.has(selectedDay) ? (
                  <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1 mt-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{selectedDay} has already been conducted for {targetDept}. This session is locked.</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium">Select an open session from Day 1 to Day 15</p>
                )}
              </div>

              {/* Field 2: Scheduled Start Time ("Oras ng Pasok") */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="setup-start-time" className="block text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>2. Scheduled Start Time</span>
                  </label>
                  <span className="text-xs font-black font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {formatTime12h(sessionStartTime)}
                  </span>
                </div>

                <input
                  type="time"
                  id="setup-start-time"
                  value={sessionStartTime}
                  onChange={(e) => setSessionStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-300 font-black text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                  {['07:00', '07:30', '08:00', '08:30', '13:00'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSessionStartTime(t)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        sessionStartTime === t ? 'bg-emerald-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {formatTime12h(t)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const hh = String(d.getHours()).padStart(2, '0');
                      const mm = String(d.getMinutes()).padStart(2, '0');
                      setSessionStartTime(`${hh}:${mm}`);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-all cursor-pointer"
                  >
                    Current Time
                  </button>
                </div>
              </div>
            </div>

            {/* Field 3: Activity / Topic Name (Clean input without suggestions) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label htmlFor="setup-activity-name" className="block text-xs font-black uppercase text-slate-700">
                3. Session / Activity Title
              </label>
              <input
                type="text"
                id="setup-activity-name"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g., Community Profiling, Tree Planting, Seminar..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
              />
              <p className="text-[10px] text-slate-400 font-medium">Specify the topic or field activity for {selectedDay}</p>
            </div>

            {/* Field 4: Grace Period / Lateness Cutoff */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>4. Lateness Grace Period</span>
                </label>
                <span className="text-[11px] font-bold text-amber-700">
                  Late Cutoff: <b>{getCutoffTime12h(sessionStartTime, gracePeriod)}</b>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { mins: 0, label: 'Strict (0 min)', desc: 'Late immediately after start time' },
                  { mins: 10, label: '+10 mins', desc: '10 minutes grace period' },
                  { mins: 15, label: '+15 mins (Standard)', desc: '15 minutes grace period' },
                  { mins: 30, label: '+30 mins', desc: '30 minutes grace period' }
                ].map(opt => (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => setGracePeriod(opt.mins)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      gracePeriod === opt.mins
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <p className={`text-xs font-black ${gracePeriod === opt.mins ? 'text-emerald-900' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Lateness Summary Card */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="space-y-0.5">
                <p className="font-black text-slate-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Session Policy:</span>
                </p>
                <p className="text-slate-600 text-[11px]">
                  Class Start: <b>{formatTime12h(sessionStartTime)}</b> • Cutoff: <b>{getCutoffTime12h(sessionStartTime, gracePeriod)}</b>. Students timing in after cutoff will be marked as <b>Late (L)</b>.
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] font-black text-emerald-900 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  {fullActivityTitle}
                </span>
              </div>
            </div>

            {/* Bottom Button to Proceed to Step 2 */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              {completedDays.has(selectedDay) ? (
                <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Please select an available session day to start scanning.</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Ready to configure and open scanner for <b>{selectedDay}</b>
                </p>
              )}
              <button
                type="button"
                disabled={completedDays.has(selectedDay)}
                onClick={() => {
                  if (completedDays.has(selectedDay)) {
                    showToast?.(`${selectedDay} has already been conducted. Please select another day.`, 'error');
                    return;
                  }
                  setStep(2);
                }}
                className={`w-full sm:w-auto px-6 py-3 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  completedDays.has(selectedDay)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                    : 'bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white active:scale-95 cursor-pointer'
                }`}
              >
                <span>Proceed to QR Scanner (Step 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: LIVE SCANNER & REAL-TIME ATTENDANCE SCREEN                   */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* Active Session Info Strip */}
            <div className="p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-black text-[11px] shadow-2xs">
                  {selectedDay}
                </span>
                <span className="font-extrabold text-slate-800 text-xs truncate max-w-[200px] sm:max-w-xs">
                  {activityName}
                </span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                  Start: {formatTime12h(sessionStartTime)} (Cutoff: {getCutoffTime12h(sessionStartTime, gracePeriod)})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Excuse Student Action Button */}
                <button
                  type="button"
                  onClick={() => setShowExcuseModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-black text-[10.5px] sm:text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-300/60 shadow-2xs"
                  title="Mark student as officially Excused"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Excuse Student (E)</span>
                </button>

                {/* Back to Setup Button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-[10.5px] sm:text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Edit session title, day, or start time"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Setup</span>
                </button>
              </div>
            </div>

            {/* Scan Controls Bar */}
            <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-500">Scan Mode:</span>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setScanType('TIME_IN')}
                    className={`px-3 py-1 rounded-lg font-black text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      scanType === 'TIME_IN' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>🟢 Time In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanType('TIME_OUT')}
                    className={`px-3 py-1 rounded-lg font-black text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      scanType === 'TIME_OUT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>🔴 Time Out</span>
                  </button>
                </div>
              </div>

              {/* Camera Switcher */}
              <button
                type="button"
                onClick={() => setCameraFacing(f => f === 'environment' ? 'user' : 'environment')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{cameraFacing === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
              </button>
            </div>

            {/* Scanner + Live Output Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-100/60">
              
              {/* Left Column: Live Camera Box with Centered Targeting Viewfinder */}
              <div className="flex flex-col items-center justify-start space-y-2.5">
                <div className="w-full aspect-square max-w-[310px] bg-black rounded-3xl overflow-hidden relative shadow-2xl border-2 border-emerald-600 flex items-center justify-center group">
                  {/* Raw Video Box from html5-qrcode */}
                  <div id="qr-reader-video-box" className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_#qr-shaded-region]:!hidden [&_#qr-shaded-region_*]:!hidden"></div>

                  <style>{`
                    #qr-reader-video-box #qr-shaded-region,
                    #qr-reader-video-box #qr-shaded-region > div {
                      display: none !important;
                      visibility: hidden !important;
                      opacity: 0 !important;
                      border: none !important;
                    }
                  `}</style>

                  {/* Centered High-Tech Viewfinder Target Frame Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] flex items-center justify-center">
                      
                      {/* Glowing 4-Corner Brackets */}
                      <div className="absolute -top-1.5 -left-1.5 w-6 h-6 sm:w-7 sm:h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-7 sm:h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 sm:w-7 sm:h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]"></div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 sm:w-7 sm:h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]"></div>
                      
                      {/* Inner Dashed Frame */}
                      <div className="w-full h-full border border-dashed border-emerald-300/40 rounded-2xl bg-emerald-500/5"></div>

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-laser-scan drop-shadow-[0_0_8px_#34d399]"></div>
                    </div>

                    {/* Guidance Pill Badge */}
                    <div className="mt-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs border border-emerald-500/50 text-[10px] sm:text-[11px] font-black text-emerald-300 tracking-wide uppercase shadow-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Scan QR Code on NSTP ID</span>
                    </div>
                  </div>
                </div>

                {/* Manual ID Input Fallback */}
                <form onSubmit={handleManualSubmit} className="w-full max-w-[310px] flex gap-2">
                  <input
                    type="text"
                    id="scanner-manual-input"
                    name="manualStudentId"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type Student ID number..."
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Submit
                  </button>
                </form>
              </div>

              {/* Right Column: Scan Result & Live Attendance Feed */}
              <div className="space-y-3 flex flex-col justify-between">
                
                {/* Scan Status Toast Card */}
                {scanStatus && (
                  <div className={`p-3.5 rounded-2xl border-2 transition-all animate-fade-in ${
                    scanStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                      : scanStatus.type === 'late'
                        ? 'bg-amber-50 border-amber-500 text-amber-950'
                        : scanStatus.type === 'already'
                          ? 'bg-blue-50 border-blue-400 text-blue-950'
                          : 'bg-rose-50 border-rose-500 text-rose-950'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {scanStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : scanStatus.type === 'late' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <p className="font-black text-xs">{scanStatus.message}</p>
                    </div>

                    {lastScannedStudent && (
                      <div className="mt-2 pt-2 border-t border-black/10 flex items-center gap-2.5">
                        <div className="w-10 h-12 bg-white rounded-lg border overflow-hidden shrink-0 shadow-xs">
                          {lastScannedStudent.registration_photo || lastScannedStudent.registrationPhoto || lastScannedStudent.photo ? (
                            <img 
                              src={lastScannedStudent.registration_photo || lastScannedStudent.registrationPhoto || lastScannedStudent.photo} 
                              alt="Student" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-[8px] font-black text-slate-500">
                              PHOTO
                            </div>
                          )}
                        </div>
                        <div className="text-xs leading-tight min-w-0">
                          <p className="font-black text-slate-900 text-xs truncate">
                            {lastScannedStudent.name || `${lastScannedStudent.firstName || ''} ${lastScannedStudent.lastName || ''}`}
                          </p>
                          <p className="text-slate-600 font-mono text-[10px] mt-0.5">
                            {lastScannedStudent.studentId} • {lastScannedStudent.department} {lastScannedStudent.section ? `(Sec ${lastScannedStudent.section})` : ''}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-800 mt-0.5">
                            Serial: {lastScannedStudent.nstp_serial_id || 'N/A'} • <span className="bg-emerald-200 text-emerald-950 px-1 rounded">{selectedDay}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Scanned Session Roster */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>{selectedDay} Attendees ({sessionLogs.length})</span>
                    </h4>
                    <span className="text-[10px] font-bold font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {scanType}
                    </span>
                  </div>

                  {/* Attendees List */}
                  <div className="max-h-[160px] overflow-y-auto space-y-1.5 my-2 no-scrollbar">
                    {sessionLogs.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="font-bold">No students scanned in this session yet.</p>
                        <p className="text-[10px] mt-0.5 text-slate-400">Point the camera at an NSTP ID QR code or click 'Excuse Student'.</p>
                      </div>
                    ) : (
                      sessionLogs.map((log, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-black text-slate-900 truncate">
                              {log.student_name || log.student?.name || log.student_id}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              {log.student_id} • {log.department} {log.section ? `(${log.section})` : ''}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {log.status === 'Excused' || log.scan_type === 'EXCUSED' ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-black text-[9px] border border-blue-300">
                                Excused (E)
                              </span>
                            ) : log.status === 'Late' || log.is_late ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-[9px] border border-amber-300">
                                Late (L)
                              </span>
                            ) : log.status === 'Present' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[9px] border border-emerald-300">
                                Present (P)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-black text-[9px] border border-amber-200">
                                Timed In
                              </span>
                            )}
                            <span className="text-[9.5px] font-mono text-slate-400">
                              {log.time}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Primary Save Attendance Session Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-400">
                      * Students with Time-In only (no Time-Out) will be saved as <b>Incomplete</b>.
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveRecord}
                      disabled={sessionLogs.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>{isSaved ? 'Saved to DB!' : `Save Attendance (${selectedDay})`}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* SUB-MODAL: EXCUSE STUDENT                                            */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {showExcuseModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 animate-slide-up flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 leading-tight">Excuse Student for {selectedDay}</h4>
                    <p className="text-[10px] text-blue-700 font-bold">Mark student as officially Excused (with excuse letter / permission)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExcuseModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Student Search & Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase">Select Student:</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={excuseSearch}
                    onChange={(e) => setExcuseSearch(e.target.value)}
                    placeholder="Search by Student Name or Student ID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {/* Student Selection List */}
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                  {filteredStudentsForExcuse.length === 0 ? (
                    <p className="p-3 text-center text-slate-400 text-xs font-medium">No students found matching search.</p>
                  ) : (
                    filteredStudentsForExcuse.map(st => {
                      const sid = String(st.studentId || st.id || '').trim();
                      const isSelected = selectedStudentToExcuse && String(selectedStudentToExcuse.studentId || selectedStudentToExcuse.id) === sid;
                      return (
                        <div
                          key={sid}
                          onClick={() => setSelectedStudentToExcuse(st)}
                          className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-950 font-bold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="font-black">{st.name || `${st.firstName || ''} ${st.lastName || ''}`}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{sid} • {st.department} {st.section ? `(Sec ${st.section})` : ''}</p>
                          </div>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-blue-600 font-bold">Select</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Student Confirmation Card */}
              {selectedStudentToExcuse && (
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <div>
                    <p className="font-black text-blue-950">{selectedStudentToExcuse.name || `${selectedStudentToExcuse.firstName || ''} ${selectedStudentToExcuse.lastName || ''}`}</p>
                    <p className="text-[10px] text-blue-700 font-mono">{selectedStudentToExcuse.studentId} • {selectedStudentToExcuse.department}</p>
                  </div>
                </div>
              )}

              {/* Excuse Reason / Notes Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase">Reason for Absence / Excuse Notes:</label>
                
                {/* Reason Presets */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {[
                    'Medical reason / illness with excuse letter',
                    'Official university competition / representation',
                    'Family emergency / bereavement',
                    'Approved academic engagement'
                  ].map(rs => (
                    <button
                      key={rs}
                      type="button"
                      onClick={() => setExcuseReason(rs)}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-colors cursor-pointer ${
                        excuseReason === rs ? 'bg-blue-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {rs}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  placeholder="Type complete excuse details or reference notes..."
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Confirm Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExcuseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmExcuse}
                  disabled={!selectedStudentToExcuse || isSubmittingExcuse}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-200" />
                  <span>{isSubmittingExcuse ? 'Saving...' : 'Confirm & Mark Excused (E)'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AttendanceScannerModal;
