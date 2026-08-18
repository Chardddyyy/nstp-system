import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CheckCircle2, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { attendanceAPI } from '../services/api';


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

export function AttendanceScannerModal({ isOpen, onClose, currentDepartment: _currentDepartment = 'All' }) {
  const [activityName, setActivityName] = useState('NSTP General Session');
  const [scanType, setScanType] = useState('TIME_IN'); // 'TIME_IN' | 'TIME_OUT'
  const [manualInput, setManualInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // { type: 'success' | 'already' | 'error', message: '' }
  const [sessionLogs, setSessionLogs] = useState([]);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'

  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  const handleProcessScan = useCallback(async (rawCode) => {
    if (!rawCode || isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const res = await attendanceAPI.scan({
        tokenOrId: rawCode.trim(),
        activity_name: activityName,
        scan_type: scanType
      });

      if (res.already_scanned) {
        playScanBeep(false);
        setLastScannedStudent(res.student);
        setScanStatus({
          type: 'already',
          message: res.message || 'Already scanned for this session'
        });
      } else if (res.success) {
        playScanBeep(true);
        setLastScannedStudent(res.student);
        setScanStatus({
          type: 'success',
          message: res.message || 'Attendance logged successfully!'
        });

        // Prepend to session logs
        setSessionLogs((prev) => [
          {
            ...res.record,
            student: res.student,
            time: new Date().toLocaleTimeString()
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
  }, [activityName, scanType]);

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

      const config = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
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
              <p className="text-xs text-emerald-200 font-medium">Instant scannable check-in for NSTP cadets and trainees</p>
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
            {/* Activity Input */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Session / Activity Name</label>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g. Orientation Drill, Tree Planting..."
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
                <span>{cameraFacing === 'environment' ? 'Rear / Main' : 'Front / Webcam'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scanner + Live Output Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50">
          
          {/* Left Column: Live Camera Box */}
          <div className="flex flex-col items-center justify-start space-y-3">
            <div className="w-full aspect-square max-w-[320px] bg-black rounded-3xl overflow-hidden relative shadow-lg border-2 border-emerald-600 flex items-center justify-center">
              <div id="qr-reader-video-box" className="w-full h-full object-cover"></div>
            </div>

            {/* Manual ID Input Fallback */}
            <form onSubmit={handleManualSubmit} className="w-full max-w-[320px] flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type Student ID manually..."
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
                        Serial: {lastScannedStudent.nstp_serial_id || 'N/A'}
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
                  <span>Session Attendees ({sessionLogs.length})</span>
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
                          {log.student?.name || log.student_name || log.student_id}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {log.student_id} • {log.department}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {log.time || new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSessionLogs([])}
                  disabled={sessionLogs.length === 0}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer disabled:opacity-40"
                >
                  Clear Session List
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AttendanceScannerModal;
