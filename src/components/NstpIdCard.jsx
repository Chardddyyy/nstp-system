import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Shield, Users, GraduationCap } from 'lucide-react';

export function NstpIdCard({ student, side = 'both' }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  const studentName = (
    student.name ||
    `${student.lastName || ''}, ${student.firstName || ''} ${student.middleName ? student.middleName.charAt(0) + '.' : ''}`
  ).trim().toUpperCase() || 'STUDENT NAME';

  const dept = (student.department || 'CWTS').toUpperCase();
  const serialId = student.nstp_serial_id || `NSTP-2026-${dept}-${String(student.studentId || student.id || '0000').slice(-4)}`;
  const qrToken = student.qr_token || serialId;
  const photoUrl = student.registration_photo || student.registrationPhoto || student.photo || null;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(qrToken, {
      width: 250,
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
      primary: 'bg-emerald-800',
      border: 'border-emerald-600',
      badge: 'bg-emerald-700 text-white',
      accent: 'text-emerald-900',
      label: 'CIVIC WELFARE TRAINING SERVICE',
      icon: Users
    },
    ROTC: {
      primary: 'bg-rose-900',
      border: 'border-rose-700',
      badge: 'bg-rose-800 text-white',
      accent: 'text-rose-950',
      label: "RESERVE OFFICERS' TRAINING CORPS",
      icon: Shield
    },
    LTS: {
      primary: 'bg-purple-900',
      border: 'border-purple-700',
      badge: 'bg-purple-800 text-white',
      accent: 'text-purple-950',
      label: 'LITERACY TRAINING SERVICE',
      icon: GraduationCap
    }
  };

  const currentTheme = deptColors[dept] || deptColors.CWTS;
  const DeptIcon = currentTheme.icon;

  const renderFront = () => (
    <div className="id-card-front relative w-[85.6mm] h-[53.98mm] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border">
      {/* Card Header */}
      <div className={`${currentTheme.primary} text-white px-2.5 py-1.5 flex items-center justify-between border-b-2 border-amber-400`}>
        <div className="flex items-center gap-1.5">
          <img 
            src={`${import.meta.env.BASE_URL}cvsu.png`} 
            alt="CvSU Logo" 
            className="w-6 h-6 object-contain bg-white rounded-full p-0.5" 
          />
          <div className="leading-tight">
            <h4 className="text-[7.5px] font-black uppercase tracking-tight text-white">CAVITE STATE UNIVERSITY</h4>
            <p className="text-[6.5px] text-amber-300 font-bold tracking-wider">NAIC CAMPUS • NSTP</p>
          </div>
        </div>
        <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/30 border border-white/20">
          {dept}
        </span>
      </div>

      {/* Body Info */}
      <div className="px-2.5 py-1 flex gap-2.5 items-center flex-1">
        {/* Photo Box */}
        <div className="w-[19mm] h-[23mm] bg-slate-100 rounded-lg border-2 border-slate-300 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
          {photoUrl ? (
            <img src={photoUrl} alt={studentName} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-1">
              <DeptIcon className="w-6 h-6 text-slate-400 mx-auto mb-0.5" />
              <span className="text-[6px] font-bold text-slate-400">2x2 PHOTO</span>
            </div>
          )}
        </div>

        {/* Student Details */}
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-[6.5px] font-extrabold text-slate-400 uppercase tracking-wider">Student Name</p>
          <h3 className="text-[9.5px] font-black text-slate-900 uppercase truncate leading-tight mt-0.5">
            {studentName}
          </h3>

          <div className="grid grid-cols-2 gap-1 mt-1">
            <div>
              <p className="text-[6px] font-extrabold text-slate-400 uppercase">Student No.</p>
              <p className="text-[8px] font-black text-slate-900 font-mono">{student.studentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[6px] font-extrabold text-slate-400 uppercase">Program / Section</p>
              <p className="text-[8px] font-black text-slate-800 truncate font-mono">
                {student.program || 'BS'} {student.section ? `Sec ${student.section}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[5.5px] font-extrabold text-slate-400 uppercase">NSTP Serial ID</p>
              <p className="text-[7.5px] font-black text-emerald-950 font-mono tracking-tight">{serialId}</p>
            </div>
            <div className="text-right">
              <span className="text-[6.5px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                VALID: 2025-2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Stripe */}
      <div className="bg-slate-900 text-white px-2.5 py-1 text-[6.5px] font-black flex items-center justify-between uppercase tracking-wider">
        <span className="text-amber-400 font-mono">{currentTheme.label}</span>
        <span className="text-[6px] opacity-75">OFFICIAL CADET ID</span>
      </div>
    </div>
  );

  const renderBack = () => (
    <div className="id-card-back relative w-[85.6mm] h-[53.98mm] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border p-2">
      {/* Top Notice */}
      <div className="text-center border-b border-slate-200 pb-1">
        <h5 className="text-[7.5px] font-black uppercase text-emerald-950 tracking-tight">
          NATIONAL SERVICE TRAINING PROGRAM
        </h5>
        <p className="text-[5.5px] text-slate-500 font-bold">R.A. 9163 • CAVITE STATE UNIVERSITY NAIC</p>
      </div>

      {/* QR Code & Emergency Grid */}
      <div className="flex items-center gap-2 flex-1 py-1">
        {/* Scannable Attendance QR Code */}
        <div className="w-[20mm] h-[20mm] bg-white rounded-lg border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Attendance QR Code" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-slate-100 animate-pulse rounded"></div>
          )}
        </div>

        {/* Info & Cadet Agreement */}
        <div className="flex-1 min-w-0 text-[6.5px] leading-tight space-y-1">
          <p className="text-slate-600 font-medium text-[5.8px] leading-tight">
            This card is non-transferable and must be presented during all official NSTP drills, seminars, and community service activities.
          </p>
          
          <div className="bg-slate-50 p-1 rounded border border-slate-100 text-[6px]">
            <p className="font-bold text-slate-700">
              Emergency Contact: <span className="font-normal text-slate-900">{student.emergencyContact || student.emergencyName || 'Parent / Guardian'}</span>
            </p>
            <p className="font-bold text-slate-700 mt-0.5">
              Contact No.: <span className="font-mono text-slate-900">{student.emergencyNumber || student.contactNumber || 'N/A'}</span>
            </p>
            {student.bloodType && (
              <p className="font-bold text-slate-700 mt-0.5">
                Blood Type: <span className="font-black text-rose-700">{student.bloodType}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Signatures Footer */}
      <div className="pt-1 border-t border-slate-200 flex items-end justify-between text-[6px]">
        <div className="text-left">
          <p className="font-mono font-bold text-slate-400">{serialId}</p>
        </div>
        <div className="text-center">
          <div className="w-16 border-b border-slate-400 mx-auto mb-0.5"></div>
          <p className="font-bold text-[5.5px] text-slate-700 uppercase">NSTP Director / Coordinator</p>
        </div>
      </div>
    </div>
  );

  if (side === 'front') return renderFront();
  if (side === 'back') return renderBack();

  return (
    <div className="id-card-pair flex flex-wrap items-center gap-2">
      {renderFront()}
      {renderBack()}
    </div>
  );
}

export default NstpIdCard;
