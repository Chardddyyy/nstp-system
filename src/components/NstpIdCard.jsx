import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Shield, Users, GraduationCap } from 'lucide-react';
import { formatGradeAndSection } from '../utils/gradeSection';

export function NstpIdCard({ student, side = 'both' }) {
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
      accent: 'bg-emerald-800 text-white',
      badge: 'bg-emerald-700 text-white',
      label: 'CIVIC WELFARE TRAINING SERVICE',
      icon: Users
    },
    ROTC: {
      accent: 'bg-emerald-900 text-white',
      badge: 'bg-rose-800 text-white',
      label: "RESERVE OFFICERS' TRAINING CORPS",
      icon: Shield
    },
    LTS: {
      accent: 'bg-emerald-900 text-white',
      badge: 'bg-purple-800 text-white',
      label: 'LITERACY TRAINING SERVICE',
      icon: GraduationCap
    }
  };

  const currentTheme = deptColors[dept] || deptColors.CWTS;
  const DeptIcon = currentTheme.icon;

  // ── PORTRAIT FRONT OF ID (53.98mm × 85.6mm) ─────────────────────────────
  const renderFront = () => (
    <div className="id-card-front relative w-[53.98mm] h-[85.6mm] bg-white rounded-xl shadow-md border-2 border-emerald-900 overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border">
      {/* Top Header with CvSU Logo on the Left */}
      <div className="bg-emerald-900 text-white px-2 py-1.5 border-b-2 border-amber-400">
        <div className="flex items-center gap-1.5">
          <img 
            src={`${import.meta.env.BASE_URL}cvsu.png`} 
            alt="CvSU Logo" 
            className="w-7 h-7 object-contain bg-white rounded-full p-0.5 shrink-0 shadow-xs" 
          />
          <div className="leading-tight flex-1 min-w-0">
            <h4 className="text-[6.8px] font-black uppercase tracking-tight text-white leading-none">CAVITE STATE UNIVERSITY</h4>
            <p className="text-[5.5px] text-amber-300 font-bold tracking-wider leading-tight mt-0.5">NAIC CAMPUS • NSTP</p>
          </div>
          <span className="text-[6.5px] font-black uppercase px-1 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/40">
            {dept}
          </span>
        </div>
      </div>

      {/* Main Student Information in Portrait */}
      <div className="px-2 py-1.5 flex flex-col items-center flex-1 justify-around text-center">
        {/* 2x2 Photo Box */}
        <div className="w-[22mm] h-[24mm] bg-slate-50 rounded-lg border-2 border-emerald-800 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
          {photoUrl ? (
            <img src={photoUrl} alt={studentName} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-1">
              <DeptIcon className="w-6 h-6 text-emerald-800/50 mx-auto mb-0.5" />
              <span className="text-[5.5px] font-bold text-slate-400 block leading-tight">2x2 PHOTO</span>
            </div>
          )}
        </div>

        {/* Student Name */}
        <div className="w-full mt-1">
          <p className="text-[5.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Student Name</p>
          <h3 className="text-[8.5px] font-black text-emerald-950 uppercase truncate leading-tight mt-0.5">
            {studentName}
          </h3>
        </div>

        {/* Student Details Grid */}
        <div className="w-full bg-slate-50 rounded-lg p-1 border border-slate-200 grid grid-cols-2 gap-1 text-left mt-1">
          <div>
            <p className="text-[5px] font-bold text-slate-500 uppercase">Student No.</p>
            <p className="text-[7px] font-black text-slate-900 font-mono">{student.studentId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[5px] font-bold text-slate-500 uppercase">Grade &amp; Section</p>
            <p className="text-[7px] font-black text-emerald-900 font-mono">{gradeAndSection}</p>
          </div>
        </div>

        {/* Matriculation Number */}
        <div className="w-full bg-emerald-50 rounded-lg py-1 px-1.5 border border-emerald-200 mt-1">
          <p className="text-[5px] font-black text-emerald-800 uppercase tracking-wider">Matriculation Number</p>
          <p className="text-[7.2px] font-black text-emerald-950 font-mono tracking-tight">{matriculationNo}</p>
        </div>
      </div>

      {/* Card Footer Stripe */}
      <div className="bg-emerald-950 text-white px-2 py-1 text-[5.8px] font-black flex items-center justify-between uppercase tracking-wider border-t border-amber-400">
        <span className="text-amber-300 font-mono">{currentTheme.label}</span>
        <span className="text-[5px] opacity-80">AY 2025-2026</span>
      </div>
    </div>
  );

  // ── PORTRAIT BACK OF ID (53.98mm × 85.6mm) ──────────────────────────────
  const renderBack = () => (
    <div className="id-card-back relative w-[53.98mm] h-[85.6mm] bg-white rounded-xl shadow-md border-2 border-emerald-900 overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border p-2 text-center">
      {/* Top Title */}
      <div className="border-b border-emerald-800/30 pb-1">
        <h5 className="text-[6.8px] font-black uppercase text-emerald-950 tracking-tight">
          NATIONAL SERVICE TRAINING PROGRAM
        </h5>
        <p className="text-[5px] text-slate-500 font-bold">R.A. 9163 • CAVITE STATE UNIVERSITY</p>
      </div>

      {/* Scannable Attendance QR Code */}
      <div className="my-1 flex flex-col items-center justify-center">
        <div className="w-[24mm] h-[24mm] bg-white rounded-lg border-2 border-emerald-800 p-1 flex items-center justify-center shadow-xs">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Attendance QR Code" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-slate-100 animate-pulse rounded"></div>
          )}
        </div>
        <p className="text-[5.5px] font-bold text-emerald-900 mt-1 font-mono tracking-tight">{matriculationNo}</p>
      </div>

      {/* Emergency Contact Box */}
      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[5.8px] text-left leading-tight space-y-0.5">
        <p className="font-bold text-slate-700">
          Emergency: <span className="font-normal text-slate-900">{student.emergencyContact || student.emergencyName || 'Parent / Guardian'}</span>
        </p>
        <p className="font-bold text-slate-700">
          Contact No: <span className="font-mono text-slate-900">{student.emergencyNumber || student.contactNumber || 'N/A'}</span>
        </p>
        {student.bloodType && (
          <p className="font-bold text-slate-700">
            Blood Type: <span className="font-black text-rose-700">{student.bloodType}</span>
          </p>
        )}
      </div>

      {/* Coordinator Signature Section */}
      <div className="pt-1.5 border-t border-slate-200 text-[5.5px]">
        <div className="w-20 border-b border-slate-600 mx-auto mb-0.5"></div>
        <p className="font-black text-slate-800 uppercase">NSTP Coordinator</p>
        <p className="text-[4.8px] text-slate-500">Cavite State University Naic</p>
      </div>
    </div>
  );

  if (side === 'front') return renderFront();
  if (side === 'back') return renderBack();

  return (
    <div className="id-card-pair flex flex-wrap items-center justify-center gap-2">
      {renderFront()}
      {renderBack()}
    </div>
  );
}

export default NstpIdCard;
