import jsPDF from 'jspdf';
import { gradesAPI } from '../services/api';

/**
 * Fetch and convert image into Base64 Data URL for jsPDF embedding
 * Supports multiple candidate paths and fallbacks (canvas rendering + fetch blob)
 */
async function getLogoDataUrl(filenames) {
  const names = Array.isArray(filenames) ? filenames : [filenames];
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  for (const name of names) {
    const cleanName = String(name).replace(/^\//, '');
    const candidateUrls = [
      `${cleanBase}${cleanName}`,
      `/${cleanName}`,
      `./${cleanName}`,
      `https://chardddyyy.github.io/nstp-system/${cleanName}`
    ];

    for (const url of candidateUrls) {
      // 1. Try Image -> Canvas PNG encoder (most reliable across browsers & handles formatting)
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width || 120;
              canvas.height = img.naturalHeight || img.height || 120;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const res = canvas.toDataURL('image/png');
              resolve(res);
            } catch (canvasErr) {
              reject(canvasErr);
            }
          };
          img.onerror = () => reject(new Error(`Failed loading img: ${url}`));
          img.src = url;
        });

        if (dataUrl && dataUrl.startsWith('data:image/png')) {
          return dataUrl;
        }
      } catch (_) {}

      // 2. Fallback: Fetch blob -> FileReader
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const readerResult = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
          if (readerResult && typeof readerResult === 'string' && readerResult.startsWith('data:image/')) {
            return readerResult;
          }
        }
      } catch (_) {}
    }
  }

  return null;
}

/**
 * Helper to truncate text safely for cell width
 */
function fitText(doc, text, maxWidth) {
  const str = String(text ?? '');
  if (!str) return '';
  if (doc.getTextWidth(str) <= maxWidth) return str;
  let truncated = str;
  while (truncated.length > 1 && doc.getTextWidth(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. OFFICIAL CHED OSDS-NSTP FORM 2-B PDF (Landscape A4 NSTP Enrollment List)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function downloadChedFormBPdf(batchOrYear, studentList = null, dept = 'All') {
  let yearStr = '2026-2027';
  let students = [];

  if (typeof batchOrYear === 'string') {
    yearStr = batchOrYear;
    students = studentList || [];
  } else if (batchOrYear && typeof batchOrYear === 'object') {
    yearStr = batchOrYear.year || '2026-2027';
    students = batchOrYear.data?.studentData || batchOrYear.studentData || studentList || [];
  }

  if (dept !== 'All') {
    students = students.filter(s => (s.department || '').toUpperCase() === dept.toUpperCase());
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const chedLogo = await getLogoDataUrl(['ched-logo.png', 'ched_logo.png', 'ched.png']);
  const cvsuLogo = await getLogoDataUrl(['cvsu.png', 'cvsu-logo.png', 'cvsunaiccampus.png']);

  const isSecondSem = String(yearStr).toLowerCase().includes('2nd') || String(yearStr).toLowerCase().includes('second');
  const formTitle = isSecondSem ? 'NSTP 2 ENROLLMENT LIST' : 'NSTP 1 ENROLLMENT LIST';
  const deptLabel = dept === 'All' ? 'CWTS / ROTC / LTS' : dept;

  const cols = [
    { key: 'no', w: 8, align: 'center' },
    { key: 'studentId', w: 22, align: 'center' },
    { key: 'lastName', w: 22, align: 'left' },
    { key: 'firstName', w: 22, align: 'left' },
    { key: 'middleName', w: 20, align: 'left' },
    { key: 'program', w: 16, align: 'center' },
    { key: 'sex', w: 9, align: 'center' },
    { key: 'birthDate', w: 18, align: 'center' },
    { key: 'street', w: 28, align: 'left' },
    { key: 'municipality', w: 22, align: 'left' },
    { key: 'province', w: 18, align: 'left' },
    { key: 'contactNumber', w: 23, align: 'center' },
    { key: 'email', w: 49, align: 'left' }
  ];

  const leftMargin = 10;
  const topMargin = 8;
  const bottomMargin = 18;
  const pageHeight = 210;

  function renderHeader(_pageNum) {
    // Header Logos (CHED at top-left, CvSU at top-right)
    if (chedLogo) {
      try { doc.addImage(chedLogo, 'PNG', leftMargin + 2, topMargin, 16, 16); } catch (_) {}
    }
    if (cvsuLogo) {
      try { doc.addImage(cvsuLogo, 'PNG', 287 - 18, topMargin, 16, 16); } catch (_) {}
    }

    // Top Institutional Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Republic of the Philippines', 148.5, topMargin + 3, { align: 'center' });
    doc.text('Office of the President', 148.5, topMargin + 6.8, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(6, 78, 59);
    doc.text('COMMISSION ON HIGHER EDUCATION', 148.5, topMargin + 11, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(formTitle, 148.5, topMargin + 15.5, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Academic Year: ${yearStr}`, 148.5, topMargin + 20, { align: 'center' });

    // Institutional Details Bar (matching Excel Rows 8 & 9)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Name of HEI: Cavite State University - Naic', leftMargin, topMargin + 25);
    doc.text('Address: Bucana Malaki, Naic, Cavite', leftMargin, topMargin + 29);

    doc.text('Region: 4A - CALABARZON', 215, topMargin + 25);
    doc.text(`NSTP Components: ${deptLabel}`, 215, topMargin + 29);

    // ── 2-TIER TABLE HEADER (EXACT MATCH TO EXCEL ROWS 11 & 12) ──
    const tableTop = topMargin + 32;
    const tier1H = 6;
    const tier2H = 5.5;
    const totalHeaderH = tier1H + tier2H; // 11.5mm

    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);

    // 1. Tier 1 Group Box Fill (Soft Green #E2EFDA)
    doc.setFillColor(226, 239, 218);
    doc.rect(leftMargin, tableTop, 277, totalHeaderH, 'F');

    // 2. Tier 2 Sub-Headers Box Fill (Light Gray #F2F2F2)
    doc.setFillColor(242, 242, 242);
    doc.rect(40, tableTop + tier1H, 64, tier2H, 'F');
    doc.rect(147, tableTop + tier1H, 68, tier2H, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    // Draw Tier 1 Full-Height Merged Header Cells:
    // No. (x=10, w=8, h=11.5)
    doc.rect(10, tableTop, 8, totalHeaderH);
    doc.text('No.', 10 + 4, tableTop + 7, { align: 'center' });

    // Student No. (x=18, w=22, h=11.5)
    doc.rect(18, tableTop, 22, totalHeaderH);
    doc.text('Student No.', 18 + 11, tableTop + 7, { align: 'center' });

    // Student Name Group (x=40, w=64, h=6)
    doc.rect(40, tableTop, 64, tier1H);
    doc.text('Student Name', 40 + 32, tableTop + 4.2, { align: 'center' });

    // Program (x=104, w=16, h=11.5)
    doc.rect(104, tableTop, 16, totalHeaderH);
    doc.text('Program', 104 + 8, tableTop + 7, { align: 'center' });

    // Sex (x=120, w=9, h=11.5)
    doc.rect(120, tableTop, 9, totalHeaderH);
    doc.text('Sex', 120 + 4.5, tableTop + 7, { align: 'center' });

    // Birthdate (x=129, w=18, h=11.5)
    doc.rect(129, tableTop, 18, totalHeaderH);
    doc.text('Birthdate', 129 + 9, tableTop + 7, { align: 'center' });

    // Address Group (x=147, w=68, h=6)
    doc.rect(147, tableTop, 68, tier1H);
    doc.text('Address', 147 + 34, tableTop + 4.2, { align: 'center' });

    // Contact Number (x=215, w=23, h=11.5)
    doc.rect(215, tableTop, 23, totalHeaderH);
    doc.text('Contact Number', 215 + 11.5, tableTop + 7, { align: 'center' });

    // Email Address (x=238, w=49, h=11.5)
    doc.rect(238, tableTop, 49, totalHeaderH);
    doc.text('Email Address', 238 + 24.5, tableTop + 7, { align: 'center' });

    // Draw Tier 2 Sub-Headers:
    doc.setFontSize(6.5);
    // Surname (x=40, w=22)
    doc.rect(40, tableTop + tier1H, 22, tier2H);
    doc.text('Surname', 40 + 11, tableTop + tier1H + 3.8, { align: 'center' });

    // First Name (x=62, w=22)
    doc.rect(62, tableTop + tier1H, 22, tier2H);
    doc.text('First Name', 62 + 11, tableTop + tier1H + 3.8, { align: 'center' });

    // Middle Name (x=84, w=20)
    doc.rect(84, tableTop + tier1H, 20, tier2H);
    doc.text('Middle Name', 84 + 10, tableTop + tier1H + 3.8, { align: 'center' });

    // Street / Barangay (x=147, w=28)
    doc.rect(147, tableTop + tier1H, 28, tier2H);
    doc.text('Street / Barangay', 147 + 14, tableTop + tier1H + 3.8, { align: 'center' });

    // Municipality / City (x=175, w=22)
    doc.rect(175, tableTop + tier1H, 22, tier2H);
    doc.text('Municipality / City', 175 + 11, tableTop + tier1H + 3.8, { align: 'center' });

    // Province (x=197, w=18)
    doc.rect(197, tableTop + tier1H, 18, tier2H);
    doc.text('Province', 197 + 9, tableTop + tier1H + 3.8, { align: 'center' });

    return tableTop + totalHeaderH;
  }

  let currentY = renderHeader(1);
  const rowHeight = 5.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  students.forEach((st, idx) => {
    if (currentY + rowHeight > (pageHeight - bottomMargin)) {
      doc.addPage('a4', 'landscape');
      currentY = renderHeader(doc.internal.getNumberOfPages());
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
    }

    let surname = st.lastName || '';
    let firstName = st.firstName || '';
    let middleName = st.middleName || '';
    if (!surname && st.name && st.name.includes(',')) {
      const parts = st.name.split(',');
      surname = parts[0].trim();
      const rest = (parts[1] || '').trim().split(/\s+/);
      firstName = rest[0] || '';
      middleName = rest.slice(1).join(' ') || '';
    } else if (!surname && st.name) {
      const parts = st.name.trim().split(/\s+/);
      surname = parts[parts.length - 1] || '';
      firstName = parts.slice(0, -1).join(' ') || '';
    }

    let street = st.street || st.barangay || '';
    let municipality = st.municipality || st.city || 'Naic';
    let province = st.province || 'Cavite';

    if (!street && !municipality && (st.address || st.homeAddress)) {
      const fullAddr = st.address || st.homeAddress || '';
      const addrParts = fullAddr.split(',').map(p => p.trim());
      if (addrParts.length >= 3) {
        street = addrParts[0];
        municipality = addrParts[1];
        province = addrParts.slice(2).join(', ');
      } else if (addrParts.length === 2) {
        street = addrParts[0];
        municipality = addrParts[1];
      } else {
        street = fullAddr;
      }
    }

    let birthdate = '';
    if (st.birthDate) {
      const d = new Date(st.birthDate);
      if (!isNaN(d.getTime())) {
        birthdate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
      } else {
        birthdate = String(st.birthDate).slice(0, 10);
      }
    } else if (st.birthMonth && st.birthDay && st.birthYear) {
      birthdate = `${String(st.birthMonth).padStart(2, '0')}/${String(st.birthDay).padStart(2, '0')}/${st.birthYear}`;
    }

    const rowData = {
      no: String(idx + 1),
      studentId: st.studentId || st.student_no || st.id || '',
      lastName: surname,
      firstName: firstName,
      middleName: middleName,
      program: st.program || st.course || 'BSIT',
      sex: (st.sex || st.gender || 'M').toUpperCase().startsWith('F') ? 'F' : 'M',
      birthDate: birthdate,
      street: street,
      municipality: municipality,
      province: province,
      contactNumber: st.contactNumber || st.contact_no || '',
      email: st.email || ''
    };

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, currentY, col.w, rowHeight);
      const val = fitText(doc, rowData[col.key] ?? '', col.w - 2.5);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(val, textX, currentY + 3.9, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    currentY += rowHeight;
  });

  // Signatories Section matching Excel (3 columns)
  const sigHeight = 18;
  if (currentY + sigHeight > (pageHeight - 12)) {
    doc.addPage('a4', 'landscape');
    currentY = topMargin + 12;
  } else {
    currentY += 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  doc.text('Prepared by: NSTP Department Coordinator', leftMargin, currentY);
  doc.text('Certified Correct: Campus NSTP Director', 104, currentY);
  doc.text('Approved: Campus Administrator', 215, currentY);

  // Add Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Official CHED OSDS-NSTP Form 2-B • Cavite State University - Naic • Page ${i} of ${totalPages}`,
      148.5,
      204,
      { align: 'center' }
    );
  }

  const safeLabel = String(yearStr).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `CHED_NSTP_Form_2-B_${dept !== 'All' ? dept : 'ALL'}_${safeLabel}.pdf`;
  doc.save(filename);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. OFFICIAL CHED OSDS-NSTP FORM 2-A PDF (Summary Matrix of Enrollees & Grads)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function downloadChedFormAPdf(batchOrYear, studentList = null, dept = 'All') {
  let yearStr = '2025-2026';
  let students = [];

  if (typeof batchOrYear === 'string') {
    yearStr = batchOrYear;
    students = studentList || [];
  } else if (batchOrYear && typeof batchOrYear === 'object') {
    yearStr = batchOrYear.year || '2025-2026';
    students = batchOrYear.data?.studentData || batchOrYear.studentData || studentList || [];
  }

  // Enrich with latest database grades if not already embedded
  const needsGrades = students.some(s => s.final_grade_1 === undefined && s.final_grade_2 === undefined);
  if (needsGrades) {
    try {
      const records = await gradesAPI.getAll();
      const gMap = {};
      (records || []).forEach(r => {
        const sid = String(r.studentId || r.student_id || '').trim();
        const sem = String(r.semester || '').trim();
        if (sid && sem) gMap[`${sid}_${sem}`] = r.final_grade;
      });
      students = students.map(s => {
        const sid = String(s.studentId || s.student_id || s.id || '').trim();
        const g1 = s.final_grade_1 || gMap[`${sid}_1st Semester`] || (s.semester === '1st Semester' ? s.final_grade : '');
        const g2 = s.final_grade_2 || gMap[`${sid}_2nd Semester`] || (s.semester === '2nd Semester' ? s.final_grade : '');
        return {
          ...s,
          final_grade_1: g1,
          final_grade_2: g2,
          has_2nd_sem: s.has_2nd_sem !== undefined ? s.has_2nd_sem : Boolean(g2 && g2 !== '-')
        };
      });
    } catch (_) {}
  }

  const statsMatrix = {
    sem1: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    sem2: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    summer: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    graduates: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } }
  };

  const yearStrLower = String(yearStr || '').toLowerCase();
  const is1stSemExplicit = yearStrLower.includes('1st') || yearStrLower.includes('first');
  const is2ndSemExplicit = yearStrLower.includes('2nd') || yearStrLower.includes('second');
  const isAnnualExplicit = yearStrLower.includes('annual') || yearStrLower.includes('whole') || yearStrLower.includes('full');

  const isOnly1stSemBatch = is1stSemExplicit || (!is2ndSemExplicit && !isAnnualExplicit && (students || []).every(st => !st.final_grade_2 && (!st.semester || st.semester === '1st Semester')));

  (students || []).forEach((st) => {
    const sexRaw = (st.sex || st.gender || 'Male').toUpperCase();
    const genKey = sexRaw.startsWith('F') ? 'f' : 'm';
    const deptRaw = (st.department || '').toUpperCase();
    let targetDept = null;
    if (deptRaw.includes('ROTC')) targetDept = 'ROTC';
    else if (deptRaw.includes('LTS')) targetDept = 'LTS';
    else if (deptRaw.includes('CWTS')) targetDept = 'CWTS';

    if (!targetDept) return;

    // 1st Semester Enrollees: All enrolled students in cohort
    statsMatrix.sem1[targetDept][genKey] += 1;

    if (isOnly1stSemBatch) {
      // If purely 1st semester batch, 2nd sem and graduates are not yet applicable (0)
      return;
    }

    const g2Str = String(st.final_grade_2 || st.grade_sem2 || (st.semester === '2nd Semester' ? st.final_grade : '') || '').trim();
    const num2 = parseFloat(g2Str);
    const isFailed2 = num2 > 3.0 || g2Str.includes('5.0') || g2Str.toUpperCase().includes('FAIL') || g2Str.toUpperCase().includes('INC') || g2Str.toUpperCase().includes('DRP');
    const isPass2 = (!isNaN(num2) && num2 >= 1.0 && num2 <= 3.0 && !isFailed2) || g2Str.toLowerCase() === 'passed';

    const has2ndSemFlag = st.has_2nd_sem !== false && st.has_2nd_sem !== 0;
    const isSem2Enrolled = has2ndSemFlag && Boolean(g2Str) && g2Str !== '-';

    if (isSem2Enrolled) {
      statsMatrix.sem2[targetDept][genKey] += 1;

      // Graduates: Nakabase LAMANG sa 2nd semester grade (1.00 hanggang 3.00 lamang, bawal ang 5.00/INC/DRP)
      if (isPass2 && !isFailed2) {
        statsMatrix.graduates[targetDept][genKey] += 1;
      }
    }
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const chedLogo = await getLogoDataUrl(['ched-logo.png', 'ched_logo.png', 'ched.png']);
  const cvsuLogo = await getLogoDataUrl(['cvsu.png', 'cvsu-logo.png', 'cvsunaiccampus.png']);

  const leftMargin = 10;
  const topMargin = 10;

  // Header Logos
  if (chedLogo) {
    try { doc.addImage(chedLogo, 'PNG', leftMargin + 4, topMargin, 18, 18); } catch (_) {}
  }
  if (cvsuLogo) {
    try { doc.addImage(cvsuLogo, 'PNG', 287 - 22, topMargin, 18, 18); } catch (_) {}
  }

  // Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Republic of the Philippines', 148.5, topMargin + 3, { align: 'center' });
  doc.text('Office of the President', 148.5, topMargin + 7, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(6, 78, 59);
  doc.text('COMMISSION ON HIGHER EDUCATION', 148.5, topMargin + 11.5, { align: 'center' });

  doc.setFontSize(11);
  doc.text('OSDS-NSTP Form 2-A (SUMMARY NUMBER OF ENROLLMENT AND GRADUATES OF NSTP)', 148.5, topMargin + 16.5, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Academic Year: ${yearStr}`, 148.5, topMargin + 21, { align: 'center' });

  // Institutional Info Row
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Name of HEI: CAVITE STATE UNIVERSITY - NAIC', leftMargin, topMargin + 28);
  doc.text('Classification: PUBLIC', 120, topMargin + 28);
  doc.text('Region: 4A - CALABARZON', 220, topMargin + 28);

  // ── 3-TIER DEMOGRAPHIC MATRIX TABLE ──
  const tableTop = topMargin + 32;
  const totalTableWidth = 277;

  const colW = {
    hei: 55,
    class: 22,
    block: 50
  };

  doc.setFillColor(226, 239, 218); // Soft green #E2EFDA
  doc.rect(leftMargin, tableTop, totalTableWidth, 8, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  // Level 1 Headers
  doc.rect(leftMargin, tableTop, colW.hei, 18);
  doc.text('HIGHER EDUCATION\nINSTITUTION (HEI)', leftMargin + (colW.hei / 2), tableTop + 8, { align: 'center' });

  doc.rect(leftMargin + colW.hei, tableTop, colW.class, 18);
  doc.text('CLASSIFICATION', leftMargin + colW.hei + (colW.class / 2), tableTop + 10, { align: 'center' });

  const periods = [
    { title: 'FIRST SEMESTER', x: leftMargin + colW.hei + colW.class },
    { title: 'SECOND SEMESTER', x: leftMargin + colW.hei + colW.class + colW.block },
    { title: 'SUMMER TERM', x: leftMargin + colW.hei + colW.class + (colW.block * 2) },
    { title: 'NUMBER OF GRADUATES', x: leftMargin + colW.hei + colW.class + (colW.block * 3) }
  ];

  periods.forEach(p => {
    doc.rect(p.x, tableTop, colW.block, 6);
    doc.text(p.title, p.x + (colW.block / 2), tableTop + 4.2, { align: 'center' });

    // Level 2 Subheaders: ROTC, LTS, CWTS
    const compW = colW.block / 3;
    const comps = ['ROTC', 'LTS', 'CWTS'];
    comps.forEach((c, idx) => {
      const cx = p.x + (idx * compW);
      doc.rect(cx, tableTop + 6, compW, 6);
      doc.text(c, cx + (compW / 2), tableTop + 10.2, { align: 'center' });

      // Level 3 Subheaders: M, F
      const genW = compW / 2;
      doc.rect(cx, tableTop + 12, genW, 6);
      doc.text('M', cx + (genW / 2), tableTop + 16, { align: 'center' });
      doc.rect(cx + genW, tableTop + 12, genW, 6);
      doc.text('F', cx + genW + (genW / 2), tableTop + 16, { align: 'center' });
    });
  });

  // Data Row
  const dataY = tableTop + 18;
  const dataRowHeight = 8;

  doc.rect(leftMargin, dataY, colW.hei, dataRowHeight);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CAVITE STATE UNIVERSITY - NAIC', leftMargin + 2, dataY + 5.2);

  doc.rect(leftMargin + colW.hei, dataY, colW.class, dataRowHeight);
  doc.text('PUBLIC', leftMargin + colW.hei + (colW.class / 2), dataY + 5.2, { align: 'center' });

  // Render Numbers into Grid (ROTC, LTS, CWTS)
  const dataValues = [
    // 1st Sem
    statsMatrix.sem1.ROTC.m, statsMatrix.sem1.ROTC.f,
    statsMatrix.sem1.LTS.m, statsMatrix.sem1.LTS.f,
    statsMatrix.sem1.CWTS.m, statsMatrix.sem1.CWTS.f,
    // 2nd Sem
    statsMatrix.sem2.ROTC.m, statsMatrix.sem2.ROTC.f,
    statsMatrix.sem2.LTS.m, statsMatrix.sem2.LTS.f,
    statsMatrix.sem2.CWTS.m, statsMatrix.sem2.CWTS.f,
    // Summer
    statsMatrix.summer.ROTC.m, statsMatrix.summer.ROTC.f,
    statsMatrix.summer.LTS.m, statsMatrix.summer.LTS.f,
    statsMatrix.summer.CWTS.m, statsMatrix.summer.CWTS.f,
    // Graduates
    statsMatrix.graduates.ROTC.m, statsMatrix.graduates.ROTC.f,
    statsMatrix.graduates.LTS.m, statsMatrix.graduates.LTS.f,
    statsMatrix.graduates.CWTS.m, statsMatrix.graduates.CWTS.f
  ];

  const singleGenWidth = colW.block / 6;
  let startColX = leftMargin + colW.hei + colW.class;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  dataValues.forEach(val => {
    doc.rect(startColX, dataY, singleGenWidth, dataRowHeight);
    doc.text(String(val), startColX + (singleGenWidth / 2), dataY + 5.2, { align: 'center' });
    startColX += singleGenWidth;
  });

  // Signatories
  const sigY = dataY + dataRowHeight + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  doc.text('Prepared by:', leftMargin, sigY);
  doc.text('Verified by:', 110, sigY);
  doc.text('Approved:', 215, sigY);

  doc.setFont('helvetica', 'normal');
  doc.text('NSTP Department Coordinator', leftMargin, sigY + 5);
  doc.text('Campus NSTP Director', 110, sigY + 5);
  doc.text('Campus Administrator', 215, sigY + 5);

  // Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Official CHED OSDS-NSTP Form 2-A Summary Matrix • Cavite State University - Naic • Academic Year ${yearStr}`,
    148.5,
    202,
    { align: 'center' }
  );

  const safeLabel = String(yearStr).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `OSDS-NSTP-Form-2-A_Summary_${dept !== 'All' ? dept : 'ALL'}_${safeLabel}.pdf`;
  doc.save(filename);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. OFFICIAL OSDS-NSTP FORM 2-A ANNUAL GRADES MASTERLIST PDF
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function downloadAnnualForm2APdf({
  students = [],
  selectedSchoolYear = '2025-2026',
  selectedDept = 'All',
  getAnnualStudentInfo = () => ({ g1: '', g2: '', finalRating: '', overallRemarks: '' }),
  currentUser = null
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const chedLogo = await getLogoDataUrl(['ched-logo.png', 'ched_logo.png', 'ched.png']);
  const cvsuLogo = await getLogoDataUrl(['cvsu.png', 'cvsu-logo.png', 'cvsunaiccampus.png']);

  const deptLabel = selectedDept !== 'All' ? selectedDept : 'CWTS / LTS / ROTC';
  const leftMargin = 10;
  const topMargin = 8;
  const bottomMargin = 18;
  const pageHeight = 210;

  const cols = [
    { key: 'no', title: 'No.', w: 8, align: 'center' },
    { key: 'studentId', title: 'Student No.', w: 22, align: 'center' },
    { key: 'name', title: 'Student Full Name', w: 42, align: 'left' },
    { key: 'program', title: 'Course', w: 16, align: 'center' },
    { key: 'sex', title: 'Sex', w: 9, align: 'center' },
    { key: 'section', title: 'NSTP Sec', w: 16, align: 'center' },
    { key: 'contactNumber', title: 'Contact No.', w: 24, align: 'center' },
    { key: 'email', title: 'Email Address', w: 42, align: 'left' },
    { key: 'g1', title: '1st Sem', w: 16, align: 'center' },
    { key: 'g2', title: '2nd Sem', w: 16, align: 'center' },
    { key: 'finalRating', title: 'Rating', w: 16, align: 'center' },
    { key: 'remarks', title: 'Remarks', w: 50, align: 'left' }
  ];

  function renderHeader() {
    if (chedLogo) {
      try { doc.addImage(chedLogo, 'PNG', leftMargin + 2, topMargin, 16, 16); } catch (_) {}
    }
    if (cvsuLogo) {
      try { doc.addImage(cvsuLogo, 'PNG', 287 - 18, topMargin, 16, 16); } catch (_) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Republic of the Philippines', 148.5, topMargin + 3, { align: 'center' });
    doc.text('Office of the President', 148.5, topMargin + 6.5, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setTextColor(6, 78, 59);
    doc.text('COMMISSION ON HIGHER EDUCATION', 148.5, topMargin + 10.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.text('OSDS-NSTP Form 2-A (ANNUAL GRADE MASTERLIST & RATINGS)', 148.5, topMargin + 15, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Academic Year: ${selectedSchoolYear} • Annual Report`, 148.5, topMargin + 19, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Name of HEI: Cavite State University - Naic', leftMargin, topMargin + 24);
    doc.text('Address: Bucana Malaki, Naic, Cavite', leftMargin, topMargin + 28);

    doc.text('Region: 4A - CALABARZON', 205, topMargin + 24);
    doc.text(`NSTP Component: ${deptLabel}`, 205, topMargin + 28);

    const tableTop = topMargin + 31;
    doc.setFillColor(226, 239, 218);
    doc.rect(leftMargin, tableTop, 277, 9, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, tableTop, col.w, 9);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(col.title, textX, tableTop + 5.5, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    return tableTop + 9;
  }

  let currentY = renderHeader();
  const rowHeight = 6.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  students.forEach((st, idx) => {
    if (currentY + rowHeight > (pageHeight - bottomMargin)) {
      doc.addPage('a4', 'landscape');
      currentY = renderHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
    }

    const sid = st.studentId || st.id;
    const { g1, g2, finalRating, overallRemarks } = getAnnualStudentInfo(sid);

    let fullName = st.name || '';
    if (!fullName) {
      const parts = [st.lastName, st.firstName, st.middleName].filter(Boolean);
      fullName = parts.join(', ');
    }

    const rowData = {
      no: String(idx + 1),
      studentId: st.studentId || st.id || '',
      name: fullName,
      program: st.program || st.course || 'BSIT',
      sex: (st.sex || st.gender || 'M').toUpperCase().startsWith('F') ? 'F' : 'M',
      section: st.nstp_section || st.section || 'A',
      contactNumber: st.contactNumber || '',
      email: st.email || '',
      g1: g1 || '-',
      g2: g2 || '-',
      finalRating: finalRating !== '-' ? finalRating : '-',
      remarks: overallRemarks || 'Incomplete'
    };

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, currentY, col.w, rowHeight);
      const val = fitText(doc, rowData[col.key] ?? '', col.w - 2.5);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(val, textX, currentY + 4.2, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    currentY += rowHeight;
  });

  // Signatures
  const sigHeight = 16;
  if (currentY + sigHeight > (pageHeight - 12)) {
    doc.addPage('a4', 'landscape');
    currentY = topMargin + 10;
  } else {
    currentY += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  doc.text('Prepared & Certified Correct:', leftMargin, currentY);
  doc.text('Verified by:', 110, currentY);
  doc.text('Approved:', 215, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(currentUser?.name ? `${currentUser.name} (Instructor)` : 'NSTP Faculty Instructor', leftMargin, currentY + 4.5);
  doc.text('Campus NSTP Director', 110, currentY + 4.5);
  doc.text('Campus Administrator', 215, currentY + 4.5);

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Official OSDS-NSTP Form 2-A Annual Grade Masterlist • Cavite State University - Naic • Page ${i} of ${totalPages}`,
      148.5,
      204,
      { align: 'center' }
    );
  }

  const deptTag = selectedDept !== 'All' ? selectedDept : 'ALL';
  const filename = `OSDS-NSTP-Form-2-A_Grades_${deptTag}_${selectedSchoolYear}.pdf`;
  doc.save(filename);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. OFFICIAL SEMESTER / ANNUAL GRADES SHEET PDF
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function downloadGradesSheetPdf({
  students = [],
  selectedSchoolYear = '2025-2026',
  selectedSemester = '1st Semester',
  selectedDept = 'All',
  gradesMap = {},
  isAnnualView = false,
  getAnnualStudentInfo = () => ({ g1: '', g2: '', finalRating: '', overallRemarks: '' }),
  currentUser = null
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const chedLogo = await getLogoDataUrl(['ched-logo.png', 'ched_logo.png', 'ched.png']);
  const cvsuLogo = await getLogoDataUrl(['cvsu.png', 'cvsu-logo.png', 'cvsunaiccampus.png']);

  const deptLabel = selectedDept !== 'All' ? selectedDept : 'ALL TRACKS (CWTS / LTS / ROTC)';
  const leftMargin = 10;
  const topMargin = 8;
  const bottomMargin = 18;
  const pageHeight = 210;

  const cols = isAnnualView ? [
    { key: 'no', title: 'No.', w: 8, align: 'center' },
    { key: 'studentId', title: 'Student No.', w: 22, align: 'center' },
    { key: 'name', title: 'Full Student Name', w: 42, align: 'left' },
    { key: 'department', title: 'Track', w: 16, align: 'center' },
    { key: 'program', title: 'Degree', w: 16, align: 'center' },
    { key: 'section', title: 'Sec', w: 12, align: 'center' },
    { key: 'nstpSection', title: 'NSTP Sec', w: 16, align: 'center' },
    { key: 'g1', title: '1st Sem', w: 18, align: 'center' },
    { key: 'g2', title: '2nd Sem', w: 18, align: 'center' },
    { key: 'finalRating', title: 'Annual Rating', w: 22, align: 'center' },
    { key: 'remarks', title: 'Overall Remarks', w: 87, align: 'left' }
  ] : [
    { key: 'no', title: 'No.', w: 8, align: 'center' },
    { key: 'studentId', title: 'Student No.', w: 22, align: 'center' },
    { key: 'name', title: 'Full Student Name', w: 45, align: 'left' },
    { key: 'department', title: 'Track', w: 16, align: 'center' },
    { key: 'program', title: 'Degree', w: 16, align: 'center' },
    { key: 'section', title: 'Sec', w: 12, align: 'center' },
    { key: 'nstpSection', title: 'NSTP Sec', w: 16, align: 'center' },
    { key: 'midterm', title: 'Midterm', w: 20, align: 'center' },
    { key: 'finalGrade', title: 'Final Grade', w: 22, align: 'center' },
    { key: 'remarks', title: 'Remarks', w: 100, align: 'left' }
  ];

  function renderHeader() {
    if (chedLogo) {
      try { doc.addImage(chedLogo, 'PNG', leftMargin + 2, topMargin, 16, 16); } catch (_) {}
    }
    if (cvsuLogo) {
      try { doc.addImage(cvsuLogo, 'PNG', 287 - 18, topMargin, 16, 16); } catch (_) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Republic of the Philippines', 148.5, topMargin + 3, { align: 'center' });
    doc.text('CAVITE STATE UNIVERSITY - NAIC CAMPUS', 148.5, topMargin + 6.5, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setTextColor(6, 78, 59);
    doc.text('NATIONAL SERVICE TRAINING PROGRAM (NSTP)', 148.5, topMargin + 10.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.text(isAnnualView ? 'OFFICIAL ANNUAL GRADES & RATINGS MASTERLIST' : `OFFICIAL GRADES REPORT — ${selectedSemester.toUpperCase()}`, 148.5, topMargin + 15, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Academic Year: ${selectedSchoolYear} • Department: ${deptLabel}`, 148.5, topMargin + 19, { align: 'center' });

    const tableTop = topMargin + 24;
    doc.setFillColor(226, 239, 218);
    doc.rect(leftMargin, tableTop, 277, 8, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, tableTop, col.w, 8);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(col.title, textX, tableTop + 5.2, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    return tableTop + 8;
  }

  let currentY = renderHeader();
  const rowHeight = 6.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  students.forEach((st, idx) => {
    if (currentY + rowHeight > (pageHeight - bottomMargin)) {
      doc.addPage('a4', 'landscape');
      currentY = renderHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
    }

    const sid = st.studentId || st.id;
    const { g1, g2, finalRating, overallRemarks } = getAnnualStudentInfo(sid);
    const g = gradesMap[sid] || {};

    let fullName = st.name || '';
    if (!fullName) {
      const parts = [st.lastName, st.firstName, st.middleName].filter(Boolean);
      fullName = parts.join(', ');
    }

    const rowData = isAnnualView ? {
      no: String(idx + 1),
      studentId: st.studentId || '',
      name: fullName,
      department: st.department || '',
      program: st.program || '',
      section: st.section || '',
      nstpSection: st.nstp_section || '',
      g1: g1 || '-',
      g2: g2 || '-',
      finalRating: finalRating !== '-' ? finalRating : '-',
      remarks: overallRemarks || '-'
    } : {
      no: String(idx + 1),
      studentId: st.studentId || '',
      name: fullName,
      department: st.department || '',
      program: st.program || '',
      section: st.section || '',
      nstpSection: st.nstp_section || '',
      midterm: g.midterm_grade || '-',
      finalGrade: g.final_grade || '-',
      remarks: g.remarks || (g.final_grade && parseFloat(g.final_grade) <= 3.0 ? 'Passed' : (g.final_grade ? 'Failed' : 'Pending'))
    };

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, currentY, col.w, rowHeight);
      const val = fitText(doc, rowData[col.key] ?? '', col.w - 2.5);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(val, textX, currentY + 4.2, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    currentY += rowHeight;
  });

  // Signatures
  const sigHeight = 16;
  if (currentY + sigHeight > (pageHeight - 12)) {
    doc.addPage('a4', 'landscape');
    currentY = topMargin + 10;
  } else {
    currentY += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  doc.text('Submitted & Certified Correct by:', leftMargin, currentY);
  doc.text('Verified by:', 110, currentY);
  doc.text('Approved by:', 215, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(currentUser?.name ? `${currentUser.name} (Instructor)` : 'NSTP Faculty Instructor', leftMargin, currentY + 4.5);
  doc.text('Campus NSTP Director', 110, currentY + 4.5);
  doc.text('Campus Administrator', 215, currentY + 4.5);

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Official CvSU Naic NSTP Grades Ledger • Academic Year ${selectedSchoolYear} • Page ${i} of ${totalPages}`,
      148.5,
      204,
      { align: 'center' }
    );
  }

  const deptTag = selectedDept !== 'All' ? selectedDept : 'ALL';
  const termTag = isAnnualView ? 'Annual' : selectedSemester.replace(/\s+/g, '_');
  const filename = `CvSU_NSTP_Grades_${deptTag}_${termTag}_${selectedSchoolYear}.pdf`;
  doc.save(filename);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. OFFICIAL MASTER ATTENDANCE MATRIX PDF (Day 1 - Day 15)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function downloadAttendanceMatrixPdf({
  studentMatrixList = [],
  selectedDept = 'All',
  daysArray = []
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const chedLogo = await getLogoDataUrl(['ched-logo.png', 'ched_logo.png', 'ched.png']);
  const cvsuLogo = await getLogoDataUrl(['cvsu.png', 'cvsu-logo.png', 'cvsunaiccampus.png']);

  const leftMargin = 8;
  const topMargin = 7;
  const bottomMargin = 16;
  const pageHeight = 210;

  const activeDays = daysArray.length > 0 ? daysArray : Array.from({ length: 15 }, (_, i) => `Day ${i + 1}`);
  const dayColWidth = 6.4; // 15 x 6.4 = 96mm

  const cols = [
    { key: 'no', title: 'No.', w: 7, align: 'center' },
    { key: 'studentId', title: 'Student ID', w: 20, align: 'center' },
    { key: 'name', title: 'Student Name', w: 46, align: 'left' },
    { key: 'dept', title: 'Dept', w: 12, align: 'center' },
    { key: 'sec', title: 'Section', w: 16, align: 'center' },
    ...activeDays.map((d, i) => ({ key: `day_${d}`, title: `D${i + 1}`, w: dayColWidth, align: 'center', rawDay: d })),
    { key: 'present', title: 'Pres', w: 12, align: 'center' },
    { key: 'absent', title: 'Abs', w: 12, align: 'center' },
    { key: 'status', title: 'Status', w: 60, align: 'left' }
  ];

  const totalTableWidth = cols.reduce((sum, c) => sum + c.w, 0);

  function renderHeader() {
    if (chedLogo) {
      try { doc.addImage(chedLogo, 'PNG', leftMargin + 2, topMargin, 14, 14); } catch (_) {}
    }
    if (cvsuLogo) {
      try { doc.addImage(cvsuLogo, 'PNG', 289 - 16, topMargin, 14, 14); } catch (_) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Republic of the Philippines • Cavite State University - Naic Campus', 148.5, topMargin + 2.5, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setTextColor(6, 78, 59);
    doc.text('NATIONAL SERVICE TRAINING PROGRAM (NSTP)', 148.5, topMargin + 6.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.text(`OFFICIAL MASTER ATTENDANCE LEDGER (DAY 1 TO DAY 15) — ${selectedDept} TRACK`, 148.5, topMargin + 10.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 148.5, topMargin + 14.5, { align: 'center' });

    const tableTop = topMargin + 17;
    doc.setFillColor(226, 239, 218);
    doc.rect(leftMargin, tableTop, totalTableWidth, 7.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, tableTop, col.w, 7.5);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1;
      doc.text(col.title, textX, tableTop + 5, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    return tableTop + 7.5;
  }

  let currentY = renderHeader();
  const rowHeight = 5.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);

  studentMatrixList.forEach((st, idx) => {
    if (currentY + rowHeight > (pageHeight - bottomMargin)) {
      doc.addPage('a4', 'landscape');
      currentY = renderHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
    }

    const rowData = {
      no: String(idx + 1),
      studentId: st.studentId || 'N/A',
      name: (st.name || `${st.lastName || ''}, ${st.firstName || ''}`).toUpperCase(),
      dept: st.department || selectedDept,
      sec: st.gradeAndSection || st.section || '-',
      present: String(st.presentCount || 0),
      absent: String(st.absentCount || 0),
      status: st.isAtRisk ? 'WARNING (AT-RISK / 3+ ABSENCES)' : (st.absentCount === 0 ? 'GOOD STANDING' : `${st.absentCount} ABSENCES`)
    };

    activeDays.forEach(d => {
      const s = st.dayStatuses?.[d];
      let char = '-';
      if (s === 'Present') char = 'P';
      else if (s === 'Late') char = 'L';
      else if (s === 'Excused') char = 'E';
      else if (s === 'Incomplete') char = 'INC';
      else if (s === 'Absent') char = 'A';
      rowData[`day_${d}`] = char;
    });

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, currentY, col.w, rowHeight);
      const val = fitText(doc, rowData[col.key] ?? '', col.w - 1.5);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1;
      doc.text(val, textX, currentY + 4, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    currentY += rowHeight;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Official Master Attendance Ledger • Cavite State University - Naic • Page ${i} of ${totalPages}`,
      148.5,
      204,
      { align: 'center' }
    );
  }

  const fileName = `NSTP_Master_Attendance_Matrix_${selectedDept}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 6. OFFICIAL DAILY ATTENDANCE SCANNER LOG PDF
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function downloadDailyAttendancePdf({
  records = [],
  selectedDay = 'Day 1',
  selectedDept = 'All'
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const chedLogo = await getLogoDataUrl(['ched-logo.png', 'ched_logo.png', 'ched.png']);
  const cvsuLogo = await getLogoDataUrl(['cvsu.png', 'cvsu-logo.png', 'cvsunaiccampus.png']);

  const leftMargin = 12;
  const topMargin = 10;
  const bottomMargin = 18;
  const pageHeight = 297;

  const cols = [
    { key: 'no', title: 'No.', w: 8, align: 'center' },
    { key: 'studentId', title: 'Student Number', w: 26, align: 'center' },
    { key: 'name', title: 'Full Student Name', w: 56, align: 'left' },
    { key: 'department', title: 'Track', w: 16, align: 'center' },
    { key: 'section', title: 'Sec', w: 12, align: 'center' },
    { key: 'timeIn', title: 'Time In', w: 20, align: 'center' },
    { key: 'timeOut', title: 'Time Out', w: 20, align: 'center' },
    { key: 'status', title: 'Status', w: 28, align: 'center' }
  ];

  function renderHeader() {
    if (chedLogo) {
      try { doc.addImage(chedLogo, 'PNG', leftMargin + 2, topMargin, 16, 16); } catch (_) {}
    }
    if (cvsuLogo) {
      try { doc.addImage(cvsuLogo, 'PNG', 198 - 18, topMargin, 16, 16); } catch (_) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Republic of the Philippines', 105, topMargin + 3, { align: 'center' });
    doc.text('CAVITE STATE UNIVERSITY - NAIC CAMPUS', 105, topMargin + 7, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(6, 78, 59);
    doc.text('NATIONAL SERVICE TRAINING PROGRAM (NSTP)', 105, topMargin + 11.5, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`DAILY ATTENDANCE LOG — ${selectedDay.toUpperCase()}`, 105, topMargin + 16.5, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Department: ${selectedDept} • Date: ${new Date().toLocaleDateString()}`, 105, topMargin + 21, { align: 'center' });

    const tableTop = topMargin + 26;
    doc.setFillColor(226, 239, 218);
    doc.rect(leftMargin, tableTop, 186, 8, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, tableTop, col.w, 8);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(col.title, textX, tableTop + 5.2, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    return tableTop + 8;
  }

  let currentY = renderHeader();
  const rowHeight = 6.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  records.forEach((r, idx) => {
    if (currentY + rowHeight > (pageHeight - bottomMargin)) {
      doc.addPage('a4', 'portrait');
      currentY = renderHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
    }

    const rowData = {
      no: String(idx + 1),
      studentId: r.studentId || r.student_id || '',
      name: r.name || `${r.lastName || ''}, ${r.firstName || ''}`.trim(),
      department: r.department || selectedDept,
      section: r.section || r.nstp_section || '-',
      timeIn: r.timeIn || r.time_in || 'Present',
      timeOut: r.timeOut || r.time_out || '-',
      status: (r.status || 'Present').toUpperCase()
    };

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, currentY, col.w, rowHeight);
      const val = fitText(doc, rowData[col.key] ?? '', col.w - 2);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(val, textX, currentY + 4.2, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    currentY += rowHeight;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Official NSTP Daily Attendance Log • Page ${i} of ${totalPages}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const fileName = `NSTP_Attendance_${selectedDay.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

