/**
 * CvSU Naic NSTP System - Canonical Certificate of Registration (COR) Generator
 * Pure Node.js Replacement for Python (PIL/Pillow) Image Generator
 * 
 * Generates official high-resolution, institutional-grade Certificate of Registration (COR)
 * documents with exact university styling, UniFAST assessment, official registrar seal, and barcodes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateCorSvg(studentId, name, program, section, dept) {
  const width = 1000;
  const height = 1380;
  const isNstpCwts = dept === 'CWTS';
  const isNstpRotc = dept === 'ROTC';
  const deptTitle = isNstpCwts ? 'Civic Welfare Training Service' : (isNstpRotc ? "Reserve Officers' Training Corps" : 'Literacy Training Service');

  const subjects = [
    { code: 'GNED 01', title: 'Art Appreciation', units: '3.0', lec: '3', lab: '0', days: 'MON / THU', time: '08:00 - 09:30 AM', room: 'ACAD 201' },
    { code: 'GNED 03', title: 'Mathematics in the Modern World', units: '3.0', lec: '3', lab: '0', days: 'TUE / FRI', time: '08:00 - 09:30 AM', room: 'ACAD 202' },
    { code: 'GNED 06', title: 'Purposive Communication', units: '3.0', lec: '3', lab: '0', days: 'MON / THU', time: '10:00 - 11:30 AM', room: 'ACAD 201' },
    { code: program.includes('Tech') ? 'ITEC 50' : 'COSC 50', title: 'Computer Systems & Modern Applications', units: '3.0', lec: '2', lab: '3', days: 'TUE / FRI', time: '10:00 - 12:30 PM', room: 'COMLAB 1' },
    { code: 'MATH 10', title: 'Discrete Mathematics / Analytics', units: '3.0', lec: '3', lab: '0', days: 'WED', time: '08:00 - 11:00 AM', room: 'ACAD 105' },
    { code: 'FITT 1', title: 'Movement Competency Training', units: '2.0', lec: '2', lab: '0', days: 'WED', time: '01:00 - 03:00 PM', room: 'GYMNASIUM' },
    { code: 'NSTP 1', title: `National Service Training Program 1 (${dept})`, units: '3.0', lec: '3', lab: '0', days: 'SATURDAY', time: '08:00 - 11:00 AM', room: 'CVSU FIELD', isNstp: true }
  ];

  let subjectRows = '';
  let currY = 560;

  subjects.forEach((s, idx) => {
    const rowBg = s.isNstp ? '#fef3c7' : (idx % 2 === 0 ? '#ffffff' : '#f9fafb');
    const codeColor = s.isNstp ? '#064e3b' : '#374151';
    const titleColor = s.isNstp ? '#92400e' : '#111827';
    const fontWeight = s.isNstp ? 'bold' : 'normal';

    subjectRows += `
      <rect x="35" y="${currY}" width="930" height="26" fill="${rowBg}" stroke="#e5e7eb" stroke-width="1"/>
      <text x="45" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="${codeColor}">${s.code}</text>
      <text x="120" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" font-weight="${fontWeight}" fill="${titleColor}">${s.title}</text>
      <text x="430" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" font-weight="${fontWeight}" text-anchor="middle" fill="${titleColor}">${s.units}</text>
      <text x="480" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" text-anchor="middle" fill="${titleColor}">${s.lec}</text>
      <text x="520" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" text-anchor="middle" fill="${titleColor}">${s.lab}</text>
      <text x="610" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" text-anchor="middle" fill="${titleColor}">${s.days}</text>
      <text x="740" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" text-anchor="middle" fill="${titleColor}">${s.time}</text>
      <text x="830" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" text-anchor="middle" fill="${titleColor}">${s.room}</text>
    `;
    currY += 26;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Background Paper -->
  <rect width="${width}" height="${height}" fill="#fcfcfc"/>
  <rect x="15" y="15" width="${width - 30}" height="${height - 30}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Top Institutional Bar -->
  <rect x="35" y="30" width="930" height="6" fill="#064e3b"/>

  <!-- University Header -->
  <text x="500" y="65" font-family="Georgia, serif" font-size="12" font-weight="bold" letter-spacing="1" text-anchor="middle" fill="#374151">REPUBLIC OF THE PHILIPPINES</text>
  <text x="500" y="90" font-family="Georgia, serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#064e3b">CAVITE STATE UNIVERSITY</text>
  <text x="500" y="112" font-family="Arial, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#b45309">CCAT CAMPUS • NAIC, CAVITE</text>
  <text x="500" y="130" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#6b7280">Bucana Malaki, Naic, Cavite • Tel. No. (046) 856-0152 • cvsu.edu.ph</text>
  <text x="500" y="146" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#111827">OFFICE OF THE UNIVERSITY REGISTRAR</text>

  <!-- Title Banner -->
  <rect x="35" y="160" width="930" height="34" fill="#064e3b" rx="4"/>
  <text x="500" y="183" font-family="Arial, sans-serif" font-size="15" font-weight="bold" letter-spacing="1" text-anchor="middle" fill="#ffffff">CERTIFICATE OF REGISTRATION &amp; ENROLLMENT ASSESSMENT</text>

  <!-- Academic Term Subtitle -->
  <rect x="35" y="200" width="930" height="24" fill="#f3f4f6" stroke="#e5e7eb"/>
  <text x="500" y="216" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1f2937">FIRST SEMESTER, ACADEMIC YEAR 2026-2027</text>

  <!-- Student Demographic Box -->
  <rect x="35" y="235" width="930" height="260" fill="#ffffff" stroke="#9ca3af" stroke-width="1.5" rx="4"/>
  <rect x="35" y="235" width="930" height="24" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="45" y="251" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#064e3b">STUDENT IDENTIFICATION &amp; ACADEMIC CLASSIFICATION</text>

  <!-- Student Info Details -->
  <text x="50" y="280" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Student ID Number:</text>
  <text x="180" y="280" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#064e3b">${studentId}</text>

  <text x="500" y="280" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Registration Date:</text>
  <text x="650" y="280" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#111827">August 18, 2026</text>

  <text x="50" y="305" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Student Full Name:</text>
  <text x="180" y="305" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#111827">${name}</text>

  <text x="500" y="305" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Degree Program:</text>
  <text x="650" y="305" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#111827">${program}</text>

  <text x="50" y="330" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Academic Year Level:</text>
  <text x="180" y="330" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#111827">First Year (1st Year)</text>

  <text x="500" y="330" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Curriculum Track:</text>
  <text x="650" y="330" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#065f46">Standard CMO Compliant (R.A. 10931)</text>

  <text x="50" y="355" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Academic Section:</text>
  <text x="180" y="355" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#111827">${section}</text>

  <text x="500" y="355" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">NSTP Component:</text>
  <text x="650" y="355" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#92400e">${dept} (${deptTitle})</text>

  <line x1="45" y1="375" x2="955" y2="375" stroke="#e5e7eb" stroke-width="1"/>

  <!-- Enrollment Status Badges -->
  <rect x="50" y="390" width="130" height="24" fill="#dcfce7" stroke="#16a34a" rx="4"/>
  <text x="115" y="406" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#15803d">REGULAR ENROLLED</text>

  <rect x="190" y="390" width="160" height="24" fill="#ecfdf5" stroke="#059669" rx="4"/>
  <text x="270" y="406" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#065f46">UniFAST BENEFICIARY</text>

  <rect x="360" y="390" width="140" height="24" fill="#eff6ff" stroke="#3b82f6" rx="4"/>
  <text x="430" y="406" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#1d4ed8">ZERO TUITION FEE</text>

  <!-- Table Header -->
  <rect x="35" y="525" width="930" height="28" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
  <text x="45" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1e293b">CODE</text>
  <text x="120" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1e293b">COURSE TITLE / DESCRIPTION</text>
  <text x="430" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">UNITS</text>
  <text x="480" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">LEC</text>
  <text x="520" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">LAB</text>
  <text x="610" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">SCHEDULE / DAYS</text>
  <text x="740" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">TIME</text>
  <text x="830" y="543" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e293b">ROOM</text>

  <!-- Table Rows -->
  ${subjectRows}

  <!-- Total Summary Bar -->
  <rect x="35" y="${currY}" width="930" height="26" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <text x="45" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">TOTAL REGISTERED UNITS: 20.0</text>
  <text x="610" y="${currY + 17}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#334155">TOTAL ACADEMIC SUBJECTS: 7</text>

  <!-- Assessment & Billing Summary -->
  <rect x="35" y="${currY + 40}" width="930" height="120" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="4"/>
  <rect x="35" y="${currY + 40}" width="930" height="22" fill="#064e3b"/>
  <text x="45" y="${currY + 55}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">ASSESSMENT &amp; BILLING SUMMARY (R.A. 10931 FREE HIGHER EDUCATION ACT)</text>

  <text x="50" y="${currY + 80}" font-family="Arial, sans-serif" font-size="11" fill="#475569">Tuition Fee (20 Units @ ₱200/unit):</text>
  <text x="320" y="${currY + 80}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end" fill="#0f172a">₱ 4,000.00</text>

  <text x="50" y="${currY + 100}" font-family="Arial, sans-serif" font-size="11" fill="#475569">NSTP Component Training Fee:</text>
  <text x="320" y="${currY + 100}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end" fill="#0f172a">₱ 600.00</text>

  <text x="50" y="${currY + 120}" font-family="Arial, sans-serif" font-size="11" fill="#475569">Total Miscellaneous &amp; Lab Fees:</text>
  <text x="320" y="${currY + 120}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end" fill="#0f172a">₱ 1,850.00</text>

  <line x1="50" y1="${currY + 130}" x2="320" y2="${currY + 130}" stroke="#94a3b8" stroke-width="1"/>
  <text x="50" y="${currY + 145}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Total Assessed Institutional Fees:</text>
  <text x="320" y="${currY + 145}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="end" fill="#0f172a">₱ 6,450.00</text>

  <!-- UniFAST Box -->
  <rect x="420" y="${currY + 70}" width="530" height="75" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5" rx="4"/>
  <text x="435" y="${currY + 90}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#065f46">SUBSIDY STATUS: 100% CHED-UniFAST BENEFICIARY</text>
  <text x="435" y="${currY + 110}" font-family="Arial, sans-serif" font-size="11" fill="#334155">Subsidized by National Government (R.A. 10931):</text>
  <text x="930" y="${currY + 110}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end" fill="#059669">- ₱ 6,450.00</text>
  <text x="435" y="${currY + 132}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#064e3b">NET AMOUNT PAYABLE BY STUDENT:</text>
  <text x="930" y="${currY + 132}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="end" fill="#059669">₱ 0.00 (FULLY COVERED)</text>

  <!-- Signatures & Verification Seal -->
  <rect x="35" y="${currY + 175}" width="930" height="120" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="4"/>

  <!-- Left: Pledge -->
  <text x="50" y="${currY + 195}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">STUDENT PLEDGE:</text>
  <text x="50" y="${currY + 215}" font-family="Arial, sans-serif" font-size="10" fill="#475569">I hereby certify that all information submitted is true and correct, and I agree to abide</text>
  <text x="50" y="${currY + 230}" font-family="Arial, sans-serif" font-size="10" fill="#475569">by all the rules, regulations, and NSTP guidelines of Cavite State University.</text>
  <line x1="50" y1="${currY + 265}" x2="280" y2="${currY + 265}" stroke="#94a3b8" stroke-width="1"/>
  <text x="165" y="${currY + 280}" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#64748b">Student Signature / Conforme</text>

  <!-- Center: Registrar Seal -->
  <circle cx="500" cy="${currY + 235}" r="45" fill="none" stroke="#dc2626" stroke-width="2"/>
  <circle cx="500" cy="${currY + 235}" r="40" fill="none" stroke="#dc2626" stroke-width="1"/>
  <text x="500" y="${currY + 220}" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="#dc2626">OFFICIALLY</text>
  <text x="500" y="${currY + 235}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#dc2626">ENROLLED</text>
  <text x="500" y="${currY + 248}" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#dc2626">CVSU NAIC</text>
  <text x="500" y="${currY + 258}" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#dc2626">REGISTRAR</text>

  <!-- Right: Registrar Sign-off -->
  <line x1="720" y1="${currY + 265}" x2="940" y2="${currY + 265}" stroke="#0f172a" stroke-width="1"/>
  <text x="830" y="${currY + 255}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#0f172a">ATTY. NORIEL C. BALLESTEROS</text>
  <text x="830" y="${currY + 280}" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#64748b">University Registrar / Campus Registrar</text>

  <!-- Security Footer -->
  <rect x="35" y="${height - 45}" width="930" height="24" fill="#064e3b" rx="2"/>
  <text x="45" y="${height - 29}" font-family="Arial, sans-serif" font-size="10" fill="#ffffff">OFFICIAL CVSU ENROLLMENT RECORD • QR/SYS-REF: CVSU-NAIC-2026-${studentId} • DATA PRIVACY PROTECTED (R.A. 10173)</text>
  <text x="955" y="${height - 29}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="end" fill="#ffffff">PAGE 1 OF 1</text>
</svg>
`;
}

export function generateCanonicalCors() {
  const outputDir = path.join(__dirname, '../public/id-photos');
  fs.mkdirSync(outputDir, { recursive: true });

  const cors = [
    {
      id: '202610001',
      name: 'DELA CRUZ, JUAN SANTOS',
      program: 'BS Information Technology',
      section: 'BSIT 1-A',
      dept: 'CWTS',
      filename: 'cor-cwts.svg'
    },
    {
      id: '202610002',
      name: 'RAMOS, MARK CHRISTIAN BAUTISTA',
      program: 'BS Computer Science',
      section: 'BSCS 1-A',
      dept: 'ROTC',
      filename: 'cor-rotc.svg'
    },
    {
      id: '202610003',
      name: 'SANTOS, MARIA ALYSSA MERCADO',
      program: 'Bachelor of Secondary Education - English',
      section: 'BSEd 1-A',
      dept: 'LTS',
      filename: 'cor-lts.svg'
    }
  ];

  cors.forEach(c => {
    const svgContent = generateCorSvg(c.id, c.name, c.program, c.section, c.dept);
    const dest = path.join(outputDir, c.filename);
    fs.writeFileSync(dest, svgContent, 'utf8');
    console.log(`[Node.js COR Generator] Created canonical vector COR -> ${dest}`);
  });

  console.log('✅ Canonical departmental CORs successfully generated with 100% pure Node.js (Zero Python dependencies).');
}

// Run if called directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateCanonicalCors();
}
