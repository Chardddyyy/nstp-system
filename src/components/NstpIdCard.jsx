import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Shield, Users, GraduationCap } from 'lucide-react';
import { formatGradeAndSection } from '../utils/gradeSection';
import {
  DEMO_COORDINATOR_SIGNATURE_SVG,
  COORDINATOR_NAME,
  COORDINATOR_TITLE,
  COORDINATOR_INSTITUTION
} from '../utils/signatureAssets';

export function NstpIdCard({ student }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  const studentName = (
    student.name ||
    `${student.lastName || ''}, ${student.firstName || ''} ${student.middleName ? student.middleName.charAt(0) + '.' : ''}${student.suffix ? ' ' + student.suffix : ''}`
  ).trim().toUpperCase() || 'STUDENT NAME';

  const dept = (student.department || 'CWTS').toUpperCase();
  const matriculationNo = student.nstp_serial_id || `NSTP-${dept}-2026-00001`;
  const qrToken = student.qr_token || matriculationNo;
  const photoUrl = student.id_photo_2x2 || student.idPhoto2x2 || student.photo || student.profilePicture || student.registration_photo || student.registrationPhoto || null;
  const studentSection = student.section 
    ? (student.section.toLowerCase().startsWith('section') ? student.section : `Section ${student.section}`)
    : formatGradeAndSection(student);
  const emergencyName = student.emergencyContact || student.emergencyName || 'Emergency Contact';
  const emergencyContact = student.emergencyNumber || student.contactNumber || '09000000000';

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
  const nameLen = studentName.length;
  const nameFontSizeClass = nameLen > 32 
    ? 'text-[5.5px] leading-[1.1]' 
    : nameLen > 22 
    ? 'text-[6.5px] leading-[1.15]' 
    : 'text-[7.8px] leading-tight';

  return (
    <div className="id-card-portrait relative w-[53.98mm] h-[85.6mm] bg-white rounded-xl shadow-md border-2 border-emerald-900 overflow-hidden flex flex-col justify-between text-slate-900 select-none box-border">
      {/* Background CvSU Watermark */}
      <img
        src={`${import.meta.env.BASE_URL}cvsu.png`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 m-auto w-32 h-32 object-contain opacity-[0.05] pointer-events-none select-none z-0"
      />

      {/* Top Header with Lanyard Slot, CvSU Logo, Title & Department Badge */}
      <div className="bg-emerald-900 text-white px-2 pt-1 pb-1 border-b border-amber-400 relative z-10 shrink-0">
        {/* Lanyard Hole Cutout Bar */}
        <div className="w-9 h-1 bg-slate-950/80 rounded-full mx-auto mb-1 border border-white/20"></div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <img 
              src={`${import.meta.env.BASE_URL}cvsu.png`} 
              alt="CvSU Logo" 
              className="w-5 h-5 object-contain bg-white rounded-full p-0.5 shrink-0 shadow-xs" 
            />
            <div className="leading-tight truncate">
              <h4 className="text-[6.2px] font-black uppercase tracking-tight text-white leading-none">CAVITE STATE UNIVERSITY</h4>
              <p className="text-[5px] text-amber-300 font-bold tracking-wider leading-tight mt-0.5">NAIC CAMPUS • NSTP</p>
            </div>
          </div>
          <span className="text-[6.2px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/60 shrink-0">
            {dept}
          </span>
        </div>
      </div>

      {/* Main Content Body (Balanced Spacing & Clean Hierarchy) */}
      <div className="px-2 py-1 flex flex-col items-center flex-1 justify-between text-center relative z-10">
        
        {/* 2x2 Photo Box */}
        <div className="w-[19mm] h-[20mm] bg-slate-50 rounded-lg border-1.5 border-emerald-900 ring-1 ring-amber-400/80 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative mt-0.5">
          {photoUrl ? (
            <img src={photoUrl} alt={studentName} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-1">
              <DeptIcon className="w-4 h-4 text-emerald-800/60 mx-auto mb-0.5" />
              <span className="text-[4.5px] font-bold text-slate-400 block leading-tight">2x2 PHOTO</span>
            </div>
          )}
        </div>

        {/* Student Name */}
        <div className="w-full mt-0.5 px-0.5 min-h-[4.5mm] flex flex-col items-center justify-center">
          <h3 className={`font-black text-slate-900 uppercase break-words text-center ${nameFontSizeClass}`}>
            {studentName}
          </h3>
          <p className="text-[4.5px] font-extrabold text-emerald-800 uppercase tracking-widest leading-tight mt-0.5">
            STUDENT
          </p>
        </div>

        {/* Key Info Pill (Student ID & Section) */}
        <div className="w-full bg-slate-100/90 rounded-md px-1.5 py-0.5 grid grid-cols-2 gap-1 text-left border border-slate-200/80">
          <div>
            <span className="text-[4.2px] font-bold text-slate-500 uppercase block">STUDENT NO.</span>
            <span className="text-[6px] font-black text-slate-900 font-mono leading-tight block">{student.studentId || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[4.2px] font-bold text-slate-500 uppercase block">SECTION</span>
            <span className="text-[6px] font-black text-emerald-900 font-mono leading-tight block truncate">{studentSection}</span>
          </div>
        </div>

        {/* Matriculation Number Bar */}
        <div className="w-full bg-teal-50 border border-teal-300/80 rounded-md py-0.5 px-1">
          <span className="text-[4.2px] font-black text-teal-800 uppercase tracking-wider block leading-none">MATRICULATION NO.</span>
          <span className="text-[6.2px] font-black text-emerald-950 font-mono tracking-tight leading-tight block mt-0.5">{matriculationNo}</span>
        </div>

        {/* High Resolution QR Code */}
        <div className="flex flex-col items-center justify-center my-0.5">
          <div className="w-[16mm] h-[16mm] bg-white rounded-md border border-emerald-900/60 p-0.5 flex items-center justify-center shadow-2xs">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Attendance QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse rounded"></div>
            )}
          </div>
          <span className="text-[4.2px] font-bold text-slate-600 font-mono tracking-tight mt-0.5">{matriculationNo}</span>
        </div>

        {/* Emergency Contact Single-Line Strip */}
        <div className="w-full bg-slate-50 border border-slate-200/60 px-1 py-0.5 rounded text-[4.5px] text-center leading-tight text-slate-700">
          <span className="font-bold text-slate-900">Emergency Contact:</span> {emergencyName} ({emergencyContact})
        </div>

        {/* NSTP Coordinator Signature Area (With Demo E-Signature & FN MI. LN) */}
        <div className="w-full pt-0.5 flex flex-col items-center justify-center">
          {/* Demo E-Signature Graphic above name */}
          <div className="h-[5.5mm] w-28 flex items-center justify-center -mb-1">
            <img 
              src={DEMO_COORDINATOR_SIGNATURE_SVG} 
              alt="Coordinator E-Signature" 
              className="h-full w-full object-contain pointer-events-none" 
            />
          </div>
          
          {/* Signatory Name */}
          <p className="text-[5.5px] font-black text-slate-900 uppercase tracking-wide border-t border-slate-400/80 px-4 pt-0.5 leading-none">
            {COORDINATOR_NAME}
          </p>
          <p className="text-[4.2px] font-bold text-slate-600 uppercase mt-0.5 leading-none">{COORDINATOR_TITLE}</p>
          <p className="text-[3.8px] text-slate-500 leading-none">{COORDINATOR_INSTITUTION}</p>
        </div>

      </div>

      {/* Card Footer Strip */}
      <div className="bg-emerald-950 text-amber-300 px-2 py-0.5 text-[5px] font-black flex items-center justify-between uppercase tracking-wider border-t border-amber-400 relative z-10 shrink-0">
        <span className="font-mono truncate">{currentTheme.label}</span>
        <span className="text-[4.8px] text-amber-200 font-mono shrink-0 ml-1">AY 2026-2027</span>
      </div>
    </div>
  );
}

export default NstpIdCard;
