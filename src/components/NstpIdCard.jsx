import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Shield, Users, GraduationCap } from 'lucide-react';
import { formatGradeAndSection } from '../utils/gradeSection';

export function NstpIdCard({ student }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  const studentName = (
    student.name ||
    `${student.lastName || ''}, ${student.firstName || ''} ${student.middleName ? student.middleName.charAt(0) + '.' : ''}`
  ).trim().toUpperCase() || 'STUDENT NAME';

  const dept = (student.department || 'CWTS').toUpperCase();
  const matriculationNo = student.nstp_serial_id || `NSTP-${dept}-2026-00001`;
  const qrToken = student.qr_token || matriculationNo;
  const photoUrl = student.registration_photo || student.registrationPhoto || student.photo || null;
  const gradeAndSection = formatGradeAndSection(student);
  const emergencyName = student.emergencyContact || student.emergencyName || 'Richard Belen';
  const emergencyContact = student.emergencyNumber || student.contactNumber || '09858337254';
  const bloodType = student.bloodType || 'O';

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(qrToken, {
      width: 260,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    }).then((url) => {
      if (isMounted) setQrDataUrl(url);
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [qrToken]);

  const deptColors = {
    CWTS: {
      label: 'CIVIC WELFARE TRAINING SERVICE',
      icon: Users
    },
    ROTC: {
      label: "RESERVE OFFICERS' TRAINING CORPS",
      icon: Shield
    },
    LTS: {
      label: 'LITERACY TRAINING SERVICE',
      icon: GraduationCap
    }
  };

  const currentTheme = deptColors[dept] || deptColors.CWTS;
  const DeptIcon = currentTheme.icon;

  return (
    <div className="id-card-portrait relative w-[53.98mm] h-[85.6mm] bg-white rounded-xl shadow-md border-2 border-emerald-900 overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border">
      {/* Background CvSU Watermark */}
      <img
        src={`${import.meta.env.BASE_URL}cvsu.png`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 m-auto w-36 h-36 object-contain opacity-[0.06] pointer-events-none select-none z-0"
      />

      {/* Top Header with Lanyard Slot, CvSU Logo, Title & Department Badge */}
      <div className="bg-emerald-900 text-white px-2 pt-1 pb-1.5 border-b-2 border-amber-400 relative z-10">
        {/* Lanyard Hole Cutout Bar */}
        <div className="w-10 h-1.5 bg-slate-950/90 rounded-full mx-auto mb-1 border border-white/20 shadow-inner"></div>

        <div className="flex items-center gap-1.5">
          <img 
            src={`${import.meta.env.BASE_URL}cvsu.png`} 
            alt="CvSU Logo" 
            className="w-6 h-6 object-contain bg-white rounded-full p-0.5 shrink-0 shadow-xs" 
          />
          <div className="leading-tight flex-1 min-w-0">
            <h4 className="text-[6.5px] font-black uppercase tracking-tight text-white leading-none">CAVITE STATE UNIVERSITY</h4>
            <p className="text-[5.2px] text-amber-300 font-bold tracking-wider leading-tight mt-0.5">NAIC CAMPUS • NSTP</p>
          </div>
          <span className="text-[6.5px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/50">
            {dept}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-2 py-1 flex flex-col items-center flex-1 justify-between text-center relative z-10">
        {/* 2x2 Photo Frame with Double Green & Gold Bezel */}
        <div className="w-[20mm] h-[22mm] bg-slate-50 rounded-xl border-2 border-emerald-900 ring-1.5 ring-amber-400/90 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative my-0.5">
          {photoUrl ? (
            <img src={photoUrl} alt={studentName} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-1">
              <DeptIcon className="w-5 h-5 text-emerald-800/50 mx-auto mb-0.5" />
              <span className="text-[5px] font-bold text-slate-400 block leading-tight">2x2 PHOTO</span>
            </div>
          )}
        </div>

        {/* Student Name */}
        <div className="w-full">
          <p className="text-[5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">STUDENT NAME</p>
          <h3 className="text-[8px] font-black text-slate-900 uppercase truncate leading-tight mt-0.5">
            {studentName}
          </h3>
        </div>

        {/* Student No. & Grade & Section Pill Box */}
        <div className="w-full bg-slate-200/80 rounded-lg px-1.5 py-0.5 grid grid-cols-2 gap-1 text-left">
          <div>
            <p className="text-[4.5px] font-bold text-slate-500 uppercase">STUDENT NO.</p>
            <p className="text-[6.5px] font-black text-slate-900 font-mono leading-tight">{student.studentId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[4.5px] font-bold text-slate-500 uppercase">GRADE &amp; SECTION</p>
            <p className="text-[6.5px] font-black text-emerald-900 font-mono leading-tight">{gradeAndSection}</p>
          </div>
        </div>

        {/* Matriculation Number Pill Box */}
        <div className="w-full bg-[#ccfbf1] border border-teal-300/80 rounded-lg py-0.5 px-1.5">
          <p className="text-[4.8px] font-black text-teal-900 uppercase tracking-wider leading-none">MATRICULATION NUMBER</p>
          <p className="text-[6.8px] font-black text-emerald-950 font-mono tracking-tight leading-tight mt-0.5">{matriculationNo}</p>
        </div>

        {/* Academic Year Label Above QR */}
        <p className="text-[4.8px] font-bold text-slate-600 leading-none">AY 2025-2026</p>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-[17mm] h-[17mm] bg-white rounded-lg border border-emerald-900 p-0.5 flex items-center justify-center shadow-2xs">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Attendance QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse rounded"></div>
            )}
          </div>
          <p className="text-[4.5px] font-bold text-slate-600 font-mono tracking-tight mt-0.5">{matriculationNo}</p>
        </div>

        {/* Emergency Contacts Pill Box */}
        <div className="w-full bg-slate-200/80 px-1.5 py-0.5 rounded-lg text-[5px] text-left leading-tight">
          <p className="font-black text-slate-800 text-[5.2px] uppercase mb-0.5">EMERGENCY CONTACTS</p>
          <p className="text-slate-700">
            <span className="font-bold">Emergency:</span> <span className="font-medium text-slate-900">{emergencyName}</span>
          </p>
          <p className="text-slate-700">
            <span className="font-bold">Contact No:</span> <span className="font-mono text-slate-900">{emergencyContact}</span>
          </p>
          <p className="text-slate-700">
            <span className="font-bold">Blood Type:</span> <span className="font-bold text-rose-700">{bloodType}</span>
          </p>
        </div>

        {/* NSTP Coordinator Signature Area */}
        <div className="w-full text-[4.8px] leading-tight">
          <p className="font-black text-slate-900 uppercase">NSTP COORDINATOR</p>
          <p className="text-[4.2px] text-slate-500">Cavite State University Naic</p>
        </div>
      </div>

      {/* Card Footer Strip */}
      <div className="bg-emerald-950 text-amber-300 px-2 py-1 text-[5.5px] font-black flex items-center justify-between uppercase tracking-wider border-t border-amber-400 relative z-10">
        <span className="font-mono">{currentTheme.label}</span>
        <span className="text-[5px] text-amber-200 font-mono">AY 2025-2026</span>
      </div>
    </div>
  );
}

export default NstpIdCard;

