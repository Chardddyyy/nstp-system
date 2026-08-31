import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { X, Camera, CheckCircle2, AlertCircle, RefreshCw, Users, FileSpreadsheet, Download, Calendar } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import { downloadDailyAttendancePdf } from '../utils/chedPdfGenerator';
import { downloadDailyAttendanceExcel } from '../utils/chedExportGenerator';
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

export function AttendanceScannerModal({ isOpen, onClose, currentDepartment = 'All', currentUser = null }) {
  const { showToast } = useAuth();
  const [selectedDay, setSelectedDay] = useState('Day 1');
  const [activityName, setActivityName] = useState('NSTP Field Activity');
  const [scanType, setScanType] = useState('TIME_IN'); // 'TIME_IN' | 'TIME_OUT'
  const [manualInput, setManualInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // { type: 'success' | 'already' | 'error', message: '' }
  const [sessionLogs, setSessionLogs] = useState([]);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'

  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  const fullActivityTitle = `${selectedDay} - ${activityName.trim() || 'NSTP Session'}`;

  const handleProcessScan = useCallback(async (rawCode) => {
    if (!rawCode || isProcessingRef.current) return;
    isProcessingRef.current = true;
    const cleanCode = rawCode.trim();

    // Enforce Rule: Student CANNOT Time Out without a valid Time In for this day
    const existingCache = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
    const hasTimeIn = sessionLogs.some(l => (
      (String(l.student_id) === cleanCode || l.student?.studentId === cleanCode || l.student?.nstp_serial_id === cleanCode || l.student?.qr_token === cleanCode) &&
      l.day === selectedDay &&
      l.scan_type === 'TIME_IN'
    )) || existingCache.some(r => (
      String(r.student_id) === cleanCode &&
      (r.activity_name || '').includes(selectedDay) &&
      r.scan_type === 'TIME_IN'
    ));

    if (scanType === 'TIME_OUT' && !hasTimeIn) {
      playScanBeep(false);
      setScanStatus({
        type: 'error',
        message: `⚠️ Bawal mag-Time Out: Kailangan munang mag-Time In bago mag-Time Out para sa ${selectedDay}.`
      });
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
      return;
    }

    try {
      const res = await attendanceAPI.scan({
        tokenOrId: cleanCode,
        activity_name: fullActivityTitle,
        scan_type: scanType
      });

      if (res.already_scanned) {
        playScanBeep(false);
        setLastScannedStudent(res.student);
        setScanStatus({
          type: 'already',
          message: res.message || `Already ${scanType === 'TIME_IN' ? 'timed-in' : 'timed-out'} for ${selectedDay}`
        });
      } else if (res.success) {
        playScanBeep(true);
        setLastScannedStudent(res.student);
        setScanStatus({
          type: 'success',
          message: scanType === 'TIME_OUT'
            ? `🟢 Time Out complete! Present status verified for ${selectedDay}.`
            : `🟡 Time In recorded! Student must Time Out to complete attendance for ${selectedDay}.`
        });

        // Prepend to session logs
        setSessionLogs((prev) => [
          {
            ...res.record,
            student: res.student,
            day: selectedDay,
            student_id: res.student?.studentId || res.record?.student_id || cleanCode,
            student_name: res.student?.name || `${res.student?.firstName || ''} ${res.student?.lastName || ''}`.trim() || res.record?.student_name,
            department: res.student?.department || res.record?.department || 'CWTS',
            section: res.student?.section || res.record?.section || '',
            scan_type: scanType,
            status: scanType === 'TIME_OUT' ? 'Present' : 'Timed In',
            time: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
          },
          ...prev
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
      }, 1500); // 1.5s cooldown to prevent repeated scans of the same card
    }
  }, [fullActivityTitle, scanType, selectedDay, sessionLogs]);

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

      const html5QrCode = new Html5Qrcode('qr-reader-video-box');
      scannerRef.current = html5QrCode;

      // Ultra-Fast instant scan configuration with native hardware acceleration
      const config = {
        fps: 25, // High frame rate for instant detection
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
          useBarCodeDetectorIfSupported: true // Native hardware-accelerated BarcodeDetector
        }
      };

      await html5QrCode.start(
        { 
          facingMode: cameraFacing
        },
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

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, startCamera, stopCamera]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleProcessScan(manualInput.trim());
      setManualInput('');
    }
  };

  const [isSaved, setIsSaved] = useState(false);

  // Save Record into Attendance Tracker and Database
  const handleSaveRecord = async () => {
    if (sessionLogs.length === 0) {
      showToast('Walang attendee sa kasalukuyang session list. I-scan muna ang mga student ID.', 'warning');
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
      
      // Group session logs by student ID to verify both TIME_IN and TIME_OUT
      const studentMap = {};
      sessionLogs.forEach(log => {
        const sid = String(log.student_id || log.student?.studentId || '').trim();
        if (!sid) return;
        if (!studentMap[sid]) {
          studentMap[sid] = {
            student: log.student,
            student_id: sid,
            student_name: log.student_name || log.student?.name || `${log.student?.lastName || ''}, ${log.student?.firstName || ''}`.trim(),
            department: log.department || log.student?.department || 'CWTS',
            section: log.section || log.student?.section || '',
            hasTimeIn: false,
            hasTimeOut: false,
            timeInTime: null,
            timeOutTime: null
          };
        }
        if (log.scan_type === 'TIME_IN') {
          studentMap[sid].hasTimeIn = true;
          studentMap[sid].timeInTime = log.time;
        }
        if (log.scan_type === 'TIME_OUT') {
          studentMap[sid].hasTimeOut = true;
          studentMap[sid].timeOutTime = log.time;
        }
      });

      // Also check existing cache for matching TIME_IN / TIME_OUT for this selectedDay
      existing.forEach(rec => {
        const sid = String(rec.student_id);
        if (studentMap[sid] && (rec.activity_name || '').includes(selectedDay)) {
          if (rec.scan_type === 'TIME_IN') studentMap[sid].hasTimeIn = true;
          if (rec.scan_type === 'TIME_OUT') studentMap[sid].hasTimeOut = true;
        }
      });

      const recordsToPersist = [];
      Object.values(studentMap).forEach(st => {
        const isCompletePresent = st.hasTimeIn && st.hasTimeOut;
        if (st.hasTimeIn) {
          recordsToPersist.push({
            student_id: st.student_id,
            student_name: st.student_name,
            department: st.department,
            section: st.section,
            activity_name: fullActivityTitle,
            scan_type: 'TIME_IN',
            scanned_at: new Date().toISOString(),
            status: isCompletePresent ? 'Present' : 'Timed In'
          });
        }
        if (st.hasTimeOut) {
          recordsToPersist.push({
            student_id: st.student_id,
            student_name: st.student_name,
            department: st.department,
            section: st.section,
            activity_name: fullActivityTitle,
            scan_type: 'TIME_OUT',
            scanned_at: new Date().toISOString(),
            status: 'Present'
          });
        }
      });

      // Save directly to the MySQL database via backend batch-save API
      await attendanceAPI.batchSave(recordsToPersist).catch(err => console.warn('API batchSave notice:', err));

      const fullyPresentCount = Object.values(studentMap).filter(st => st.hasTimeIn && st.hasTimeOut).length;
      const incompleteCount = Object.values(studentMap).filter(st => st.hasTimeIn && !st.hasTimeOut).length;

      // Merge and deduplicate client-side cache
      const merged = [
        ...recordsToPersist,
        ...existing.filter(e => !(
          recordsToPersist.some(n => String(n.student_id) === String(e.student_id) && String(n.scan_type) === String(e.scan_type) && (e.activity_name || '').includes(selectedDay))
        ))
      ];

      localStorage.setItem('nstp_cached_attendance_records', JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('nstp_attendance_updated'));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      showToast(`Na-save ang attendance (${fullyPresentCount} Present, ${incompleteCount} Timed In) para sa ${selectedDay}!`, 'success');
    } catch (err) {
      console.error('Error saving record:', err);
      showToast('Failed to save record. Please try again.', 'error');
    }
  };

  // 1-Click PDF Attendance Export
  const handleExportToPdf = async () => {
    if (sessionLogs.length === 0) {
      showToast('Walang attendee sa kasalukuyang session list. I-scan muna ang mga student ID.', 'warning');
      return;
    }
    try {
      await downloadDailyAttendancePdf({
        records: sessionLogs,
        selectedDay,
        selectedDept: currentUser?.department || currentDepartment || 'All'
      });
    } catch (err) {
      console.error('Failed to export daily attendance PDF:', err);
      showToast('Failed to export attendance PDF. Please try again.', 'error');
    }
  };

  // Export Session to Excel (.xlsx)
  const handleExportToExcel = async () => {
    if (sessionLogs.length === 0) return;
    try {
      await downloadDailyAttendanceExcel({
        records: sessionLogs,
        selectedDay,
        selectedDept: currentUser?.department || currentDepartment || 'All'
      });
    } catch (err) {
      console.error('Failed to export daily attendance Excel:', err);
      showToast('Failed to export attendance Excel. Please try again.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Live QR Attendance Scanner</h3>
              <p className="text-xs text-emerald-200 font-medium">Automatic check-in and 1-click attendance recording (Day 1 - Day 15)</p>
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

        {/* Activity & Scan Settings */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            
            {/* Day Selector (Day 1 to Day 15) */}
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-900 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-700" />
                <span>Attendance Day</span>
              </label>
              <select
                id="scanner-attendance-day"
                name="attendanceDay"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-2 bg-white rounded-xl border-2 border-emerald-600 font-black text-emerald-950 text-xs focus:outline-none cursor-pointer shadow-xs"
              >
                {ATTENDANCE_DAYS.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Activity Input */}
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="scanner-activity-name" className="block text-[10px] font-black uppercase text-slate-500 mb-1">Session / Activity Name</label>
              <input
                type="text"
                id="scanner-activity-name"
                name="activityName"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g. Tree Planting, Drill, Lecture..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Scan Type Toggle */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Attendance Type</label>
              <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScanType('TIME_IN')}
                  className={`px-3 py-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer ${
                    scanType === 'TIME_IN' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🟢 Time In
                </button>
                <button
                  type="button"
                  onClick={() => setScanType('TIME_OUT')}
                  className={`px-3 py-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer ${
                    scanType === 'TIME_OUT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🔴 Time Out
                </button>
              </div>
            </div>

            {/* Camera Switcher */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Camera</label>
              <button
                type="button"
                onClick={() => setCameraFacing(f => f === 'environment' ? 'user' : 'environment')}
                className="px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{cameraFacing === 'environment' ? 'Rear' : 'Front'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scanner + Live Output Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50">
          
          {/* Left Column: Live Camera Box with Centered Targeting Viewfinder */}
          <div className="flex flex-col items-center justify-start space-y-3">
            <div className="w-full aspect-square max-w-[320px] bg-black rounded-3xl overflow-hidden relative shadow-2xl border-2 border-emerald-600 flex items-center justify-center group">
              {/* Raw Video Box from html5-qrcode */}
              <div id="qr-reader-video-box" className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_#qr-shaded-region]:!hidden [&_#qr-shaded-region_*]:!hidden"></div>

              {/* Suppress html5-qrcode default white corner box overlays */}
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
                <div className="relative w-[190px] h-[190px] sm:w-[210px] sm:h-[210px] flex items-center justify-center">
                  
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
                  <span>Fit QR inside box</span>
                </div>
              </div>
            </div>

            {/* Manual ID Input Fallback */}
            <form onSubmit={handleManualSubmit} className="w-full max-w-[320px] flex gap-2">
              <input
                type="text"
                id="scanner-manual-input"
                name="manualStudentId"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type Student ID..."
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              <div className={`p-4 rounded-2xl border-2 transition-all animate-fade-in ${
                scanStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  : scanStatus.type === 'already'
                    ? 'bg-amber-50 border-amber-500 text-amber-950'
                    : 'bg-rose-50 border-rose-500 text-rose-950'
              }`}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  {scanStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <p className="font-black text-xs sm:text-sm">{scanStatus.message}</p>
                </div>

                {lastScannedStudent && (
                  <div className="mt-2 pt-2 border-t border-black/10 flex items-center gap-3">
                    <div className="w-12 h-14 bg-white rounded-lg border overflow-hidden shrink-0 shadow-xs">
                      {lastScannedStudent.registration_photo || lastScannedStudent.registrationPhoto || lastScannedStudent.photo ? (
                        <img 
                          src={lastScannedStudent.registration_photo || lastScannedStudent.registrationPhoto || lastScannedStudent.photo} 
                          alt="Student" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-[9px] font-black text-slate-500">
                          PHOTO
                        </div>
                      )}
                    </div>
                    <div className="text-xs leading-tight">
                      <p className="font-black text-slate-900 text-sm">
                        {lastScannedStudent.name || `${lastScannedStudent.firstName || ''} ${lastScannedStudent.lastName || ''}`}
                      </p>
                      <p className="text-slate-600 font-mono text-[11px] mt-0.5">
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
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>{selectedDay} Attendees ({sessionLogs.length})</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500">{scanType}</span>
              </div>

              <div className="max-h-[160px] overflow-y-auto space-y-1.5 my-2 no-scrollbar">
                {sessionLogs.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-6 font-medium">
                    No scans in this session yet. Point the camera at a student's NSTP ID card.
                  </p>
                ) : (
                  sessionLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-slate-900">
                          {log.student_name || log.student?.name || log.student_id}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {log.student_id} • {log.department} ({log.day || selectedDay})
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {log.time || new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Action Toolbar: Save Record & Optional Excel Export */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSessionLogs([])}
                  disabled={sessionLogs.length === 0}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer disabled:opacity-40"
                >
                  Clear List
                </button>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Export Attendance PDF & Excel Buttons */}
                  <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={handleExportToPdf}
                      disabled={sessionLogs.length === 0}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      title="Export as PDF File"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>PDF (.pdf)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportToExcel}
                      disabled={sessionLogs.length === 0}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      title="Export as Excel File"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Excel (.xlsx)</span>
                    </button>
                  </div>

                  {/* Primary Save Record Button */}
                  <button
                    type="button"
                    onClick={handleSaveRecord}
                    disabled={sessionLogs.length === 0}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>{isSaved ? 'Saved!' : `Save (${selectedDay})`}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AttendanceScannerModal;
