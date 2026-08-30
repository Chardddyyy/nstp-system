import jsPDF from 'jspdf';

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
  let yearStr = '2025-2026';
  let students = [];

  if (typeof batchOrYear === 'string') {
    yearStr = batchOrYear;
    students = studentList || [];
  } else if (batchOrYear && typeof batchOrYear === 'object') {
    yearStr = batchOrYear.year || '2025-2026';
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

  const isSecondSem = String(yearStr).toLowerCase().includes('2nd');
  const formTitle = isSecondSem ? 'NSTP 2 ENROLLMENT LIST' : 'NSTP 1 ENROLLMENT LIST';
  const deptLabel = dept === 'All' ? 'CWTS / ROTC / LTS' : dept;

  const cols = [
    { key: 'no', title: 'No.', w: 8, align: 'center' },
    { key: 'studentId', title: 'Student No.', w: 22, align: 'center' },
    { key: 'lastName', title: 'Surname', w: 24, align: 'left' },
    { key: 'firstName', title: 'First Name', w: 24, align: 'left' },
    { key: 'middleName', title: 'Middle Name', w: 22, align: 'left' },
    { key: 'program', title: 'Program', w: 16, align: 'center' },
    { key: 'sex', title: 'Sex', w: 9, align: 'center' },
    { key: 'birthDate', title: 'Birthdate', w: 18, align: 'center' },
    { key: 'street', title: 'Street / Brgy', w: 29, align: 'left' },
    { key: 'municipality', title: 'Municipality', w: 22, align: 'left' },
    { key: 'province', title: 'Province', w: 20, align: 'left' },
    { key: 'contactNumber', title: 'Contact No.', w: 24, align: 'center' },
    { key: 'email', title: 'Email Address', w: 39, align: 'left' }
  ];

  const leftMargin = 10;
  const topMargin = 8;
  const bottomMargin = 18;
  const pageHeight = 210;

  function renderHeader(_pageNum) {
    // Header Logos
    if (chedLogo) {
      try { doc.addImage(chedLogo, 'PNG', leftMargin + 2, topMargin, 16, 16); } catch (_) {}
    }
    if (cvsuLogo) {
      try { doc.addImage(cvsuLogo, 'PNG', 287 - 18, topMargin, 16, 16); } catch (_) {}
    }

    // Top Institutional Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Republic of the Philippines', 148.5, topMargin + 3, { align: 'center' });
    doc.text('Office of the President', 148.5, topMargin + 6.5, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setTextColor(6, 78, 59);
    doc.text('COMMISSION ON HIGHER EDUCATION', 148.5, topMargin + 10.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.text(formTitle, 148.5, topMargin + 15, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Academic Year: ${yearStr}`, 148.5, topMargin + 19, { align: 'center' });

    // Institutional Details
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Name of HEI: Cavite State University - Naic', leftMargin, topMargin + 24);
    doc.text('Address: Bucana Malaki, Naic, Cavite', leftMargin, topMargin + 28);

    doc.text('Region: 4A - CALABARZON', 205, topMargin + 24);
    doc.text(`NSTP Components: ${deptLabel}`, 205, topMargin + 28);

    // Table Header Top Group Box
    const tableTop = topMargin + 31;
    doc.setFillColor(226, 239, 218); // Soft green #E2EFDA
    doc.rect(leftMargin, tableTop, 277, 10, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    let x = leftMargin;
    cols.forEach(col => {
      doc.rect(x, tableTop, col.w, 10);
      const textX = col.align === 'center' ? x + (col.w / 2) : x + 1.5;
      doc.text(col.title, textX, tableTop + 6, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      x += col.w;
    });

    return tableTop + 10;
  }

  let currentY = renderHeader(1);
  const rowHeight = 6.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  students.forEach((st, idx) => {
    if (currentY + rowHeight > (pageHeight - bottomMargin)) {
      doc.addPage('a4', 'landscape');
      currentY = renderHeader(doc.internal.getNumberOfPages());
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
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
      studentId: st.studentId || st.id || '',
      lastName: surname,
      firstName: firstName,
      middleName: middleName,
      program: st.program || st.course || 'BSIT',
      sex: (st.sex || st.gender || 'M').toUpperCase().startsWith('F') ? 'F' : 'M',
      birthDate: birthdate,
      street: st.street || st.address || '',
      municipality: st.municipality || st.city || 'Naic',
      province: st.province || 'Cavite',
      contactNumber: st.contactNumber || st.contact_no || '',
      email: st.email || ''
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

  // Signatories Section
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

  doc.text('Prepared by:', leftMargin, currentY);
  doc.text('Certified Correct:', 110, currentY);
  doc.text('Approved:', 215, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text('NSTP Department Coordinator', leftMargin, currentY + 4.5);
  doc.text('Campus NSTP Director', 110, currentY + 4.5);
  doc.text('Campus Administrator', 215, currentY + 4.5);

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

  const statsMatrix = {
    sem1: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    sem2: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    summer: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    graduates: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } }
  };

  const isOnly1stSemBatch = String(yearStr).includes('1st Sem');

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

  // Total Summary Row (Matching Excel Row 13)
  const totalY = dataY + dataRowHeight;
  doc.setFillColor(243, 244, 246);
  doc.rect(leftMargin, totalY, totalTableWidth, dataRowHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.rect(leftMargin, totalY, colW.hei, dataRowHeight);
  doc.text('TOTAL', leftMargin + 2, totalY + 5.2);

  doc.rect(leftMargin + colW.hei, totalY, colW.class, dataRowHeight);
  doc.text('PUBLIC', leftMargin + colW.hei + (colW.class / 2), totalY + 5.2, { align: 'center' });

  let totalColX = leftMargin + colW.hei + colW.class;
  dataValues.forEach(val => {
    doc.rect(totalColX, totalY, singleGenWidth, dataRowHeight);
    doc.text(String(val), totalColX + (singleGenWidth / 2), totalY + 5.2, { align: 'center' });
    totalColX += singleGenWidth;
  });

  // Signatories
  const sigY = totalY + dataRowHeight + 14;
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

