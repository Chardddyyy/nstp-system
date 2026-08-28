import ExcelJS from 'exceljs';

/**
 * Fetch and convert local or URL image into Base64 for ExcelJS embedding
 */
async function getLogoBase64(filename) {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const fullPath = `${cleanBase}${filename.replace(/^\//, '')}`;
    const response = await fetch(fullPath);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string' && result.includes(',')) {
          resolve(result.split(',')[1]);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`Could not load logo (${filename}):`, err);
    return null;
  }
}

/**
 * GENERATE FORM B: Detailed Student Masterlist (1-Page Width Landscape)
 */
export async function generateChedFormBWorkbook(students = [], batchYear = '2024-2025', deptFilter = 'All') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CvSU Naic NSTP System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('CHED NSTP Form 2-B', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3
      }
    }
  });

  // 1. Embed Logos in Header (CHED at B1, CvSU at N1)
  const chedLogoBase64 = await getLogoBase64('ched-logo.png');
  const cvsuLogoBase64 = await getLogoBase64('cvsu.png');

  if (chedLogoBase64) {
    try {
      const chedImgId = workbook.addImage({
        base64: chedLogoBase64,
        extension: 'png'
      });
      worksheet.addImage(chedImgId, {
        tl: { col: 1.1, row: 0.1 },
        ext: { width: 68, height: 68 }
      });
    } catch (e) {
      console.warn('CHED logo embed notice:', e);
    }
  }

  if (cvsuLogoBase64) {
    try {
      const cvsuImgId = workbook.addImage({
        base64: cvsuLogoBase64,
        extension: 'png'
      });
      worksheet.addImage(cvsuImgId, {
        tl: { col: 13.1, row: 0.1 },
        ext: { width: 68, height: 68 }
      });
    } catch (e) {
      console.warn('CvSU logo embed notice:', e);
    }
  }

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2EFDA' } // Institutional soft green
  };

  const subHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' } // Light gray
  };

  // 2. Set Column Widths
  worksheet.columns = [
    { key: 'col1', width: 6 },   // A: No.
    { key: 'col2', width: 16 },  // B: Student No.
    { key: 'col3', width: 18 },  // C: Surname
    { key: 'col4', width: 18 },  // D: First Name
    { key: 'col5', width: 16 },  // E: Middle Name
    { key: 'col6', width: 14 },  // F: Program
    { key: 'col7', width: 9 },   // G: Sex
    { key: 'col8', width: 14 },  // H: Birthdate
    { key: 'col9', width: 15 },  // I: Street/Brgy
    { key: 'col10', width: 10 }, // J: (Merged Brgy)
    { key: 'col11', width: 14 }, // K: Municipality/City
    { key: 'col12', width: 10 }, // L: (Merged City)
    { key: 'col13', width: 14 }, // M: Province
    { key: 'col14', width: 16 }, // N: Contact Number
    { key: 'col15', width: 28 }  // O: Email Address
  ];

  // 3. Institutional Top Titles (Rows 1 to 3)
  worksheet.mergeCells('A1:O1');
  worksheet.getCell('A1').value = 'Republic of the Philippines';
  worksheet.getCell('A1').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:O2');
  worksheet.getCell('A2').value = 'Office of the President';
  worksheet.getCell('A2').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:O3');
  worksheet.getCell('A3').value = 'Commission on Higher Education';
  worksheet.getCell('A3').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  // Form Title (Row 5 & 6)
  worksheet.mergeCells('A5:O5');
  const isSecondSem = String(batchYear).includes('2nd');
  worksheet.getCell('A5').value = isSecondSem ? 'NSTP 2 ENROLLMENT LIST' : 'NSTP 1 ENROLLMENT LIST';
  worksheet.getCell('A5').font = { name: 'Arial', size: 11, bold: true };
  worksheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A6:O6');
  worksheet.getCell('A6').value = `Academic Year: ${batchYear}`;
  worksheet.getCell('A6').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

  // Institutional Info (Rows 8 & 9)
  const nstpComponentLabel = deptFilter === 'All' ? 'CWTS / ROTC / LTS' : deptFilter;
  worksheet.getCell('A8').value = 'Name of HEI: Cavite State University - Naic';
  worksheet.getCell('A8').font = { name: 'Arial', size: 9, bold: true };
  worksheet.getCell('M8').value = 'Region: 4A - CALABARZON';
  worksheet.getCell('M8').font = { name: 'Arial', size: 9, bold: true };

  worksheet.getCell('A9').value = 'Address: Bucana Malaki, Naic, Cavite';
  worksheet.getCell('A9').font = { name: 'Arial', size: 9, bold: true };
  worksheet.getCell('M9').value = `NSTP Components: ${nstpComponentLabel}`;
  worksheet.getCell('M9').font = { name: 'Arial', size: 9, bold: true };

  // 4. Build Table Headers (Rows 11 and 12)
  worksheet.mergeCells('A11:A12');
  worksheet.getCell('A11').value = 'No.';

  worksheet.mergeCells('B11:B12');
  worksheet.getCell('B11').value = 'Student No.';

  worksheet.mergeCells('C11:E11');
  worksheet.getCell('C11').value = 'Student Name';
  worksheet.getCell('C12').value = 'Surname';
  worksheet.getCell('D12').value = 'First Name';
  worksheet.getCell('E12').value = 'Middle Name';

  worksheet.mergeCells('F11:F12');
  worksheet.getCell('F11').value = 'Program';

  worksheet.mergeCells('G11:G12');
  worksheet.getCell('G11').value = 'Sex';

  worksheet.mergeCells('H11:H12');
  worksheet.getCell('H11').value = 'Birthdate';

  worksheet.mergeCells('I11:M11');
  worksheet.getCell('I11').value = 'Address';

  worksheet.mergeCells('I12:J12');
  worksheet.getCell('I12').value = 'Street/Barangay';

  worksheet.mergeCells('K12:L12');
  worksheet.getCell('K12').value = 'Municipality/City';

  worksheet.getCell('M12').value = 'Province';

  worksheet.mergeCells('N11:N12');
  worksheet.getCell('N11').value = 'Contact Number';

  worksheet.mergeCells('O11:O12');
  worksheet.getCell('O11').value = 'Email Address';

  // Apply Styling to Rows 11 and 12
  for (let r = 11; r <= 12; r++) {
    const row = worksheet.getRow(r);
    row.height = 22;
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { name: 'Arial', size: r === 11 ? 9 : 8.5, bold: true };
      cell.fill = r === 11 ? headerFill : subHeaderFill;
    }
  }

  // 5. Populate Student Data (Row 13 onwards)
  const startRow = 13;
  (students || []).forEach((st, idx) => {
    const currentRow = startRow + idx;
    const row = worksheet.getRow(currentRow);
    row.height = 20;

    let surname = st.lastName || '';
    let firstName = st.firstName || '';
    let middleName = st.middleName || '';

    if (!surname && st.name && st.name.includes(',')) {
      const parts = st.name.split(',');
      surname = parts[0].trim();
      const firstParts = (parts[1] || '').trim().split(/\s+/);
      firstName = firstParts[0] || '';
      middleName = firstParts.slice(1).join(' ') || '';
    } else if (!surname && st.name) {
      const nameTokens = st.name.trim().split(/\s+/);
      surname = nameTokens[nameTokens.length - 1] || '';
      firstName = nameTokens.slice(0, -1).join(' ') || '';
    }

    let street = st.street || st.barangay || '';
    let municipality = st.municipality || st.city || '';
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
      if (!isNaN(d)) birthdate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      else birthdate = String(st.birthDate);
    } else if (st.birthMonth && st.birthDay && st.birthYear) {
      birthdate = `${st.birthMonth}/${st.birthDay}/${st.birthYear}`;
    }

    const sexVal = (st.sex || st.gender || 'Male').toUpperCase().startsWith('F') ? 'F' : 'M';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = st.studentId || st.student_no || '';
    row.getCell(3).value = surname;
    row.getCell(4).value = firstName;
    row.getCell(5).value = middleName;
    row.getCell(6).value = st.program || st.course || 'BSIT';
    row.getCell(7).value = sexVal;
    row.getCell(8).value = birthdate;
    row.getCell(9).value = street;
    worksheet.mergeCells(`I${currentRow}:J${currentRow}`);
    row.getCell(11).value = municipality;
    worksheet.mergeCells(`K${currentRow}:L${currentRow}`);
    row.getCell(13).value = province;
    row.getCell(14).value = st.contactNumber || st.contact_no || '';
    row.getCell(15).value = st.email || '';

    // Apply borders and alignments to every cell in data row
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.font = { name: 'Arial', size: 9 };
      const isLeft = [3, 4, 5, 9, 11, 13].includes(c);
      cell.alignment = {
        horizontal: isLeft ? 'left' : 'center',
        vertical: 'middle',
        wrapText: true
      };
    }
  });

  // 6. Signatories Footer
  const sigRow = startRow + (students || []).length + 2;
  worksheet.getCell(`A${sigRow}`).value = 'Prepared by: NSTP Department Coordinator';
  worksheet.getCell(`A${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  worksheet.getCell(`F${sigRow}`).value = 'Certified Correct: Campus NSTP Director';
  worksheet.getCell(`F${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  worksheet.getCell(`L${sigRow}`).value = 'Approved: Campus Administrator';
  worksheet.getCell(`L${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  return workbook;
}

/**
 * GENERATE FORM A: Summary Number of Enrollment & Graduates of NSTP (Fit to 1 Page)
 */
export async function generateChedFormAWorkbook(students = [], batchYear = '2024-2025', _deptFilter = 'All') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CvSU Naic NSTP System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('OSDS-NSTP Form 2-A', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3
      }
    }
  });

  // 1. Embed Logos (CvSU at A1, CHED at Y1)
  const cvsuLogoBase64 = await getLogoBase64('cvsu.png');
  const chedLogoBase64 = await getLogoBase64('ched-logo.png');

  if (cvsuLogoBase64) {
    try {
      const cvsuImgId = workbook.addImage({
        base64: cvsuLogoBase64,
        extension: 'png'
      });
      worksheet.addImage(cvsuImgId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: 62, height: 62 }
      });
    } catch (e) {
      console.warn('CvSU logo embed notice:', e);
    }
  }

  if (chedLogoBase64) {
    try {
      const chedImgId = workbook.addImage({
        base64: chedLogoBase64,
        extension: 'png'
      });
      worksheet.addImage(chedImgId, {
        tl: { col: 24.1, row: 0.1 },
        ext: { width: 62, height: 62 }
      });
    } catch (e) {
      console.warn('CHED logo embed notice:', e);
    }
  }

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2EFDA' } // Soft green
  };

  const subHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' }
  };

  // Set Column Widths (A to Z / 1 to 26)
  worksheet.columns = [
    { key: 'col1', width: 32 },  // A: HEI Name
    { key: 'col2', width: 20 },  // B: Classification
    ...Array.from({ length: 24 }, (_, i) => ({ key: `col${i + 3}`, width: 8.5 })) // C to Z
  ];

  // 2. Institutional Header (Rows 1 to 3)
  worksheet.mergeCells('A1:Z1');
  worksheet.getCell('A1').value = 'Republic of the Philippines';
  worksheet.getCell('A1').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:Z2');
  worksheet.getCell('A2').value = 'Office of the President';
  worksheet.getCell('A2').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:Z3');
  worksheet.getCell('A3').value = 'Commission on Higher Education';
  worksheet.getCell('A3').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  // Form Title (Rows 5 & 6)
  worksheet.mergeCells('A5:Z5');
  worksheet.getCell('A5').value = 'SUMMARY NUMBER OF ENROLLMENT AND GRADUATES OF NSTP';
  worksheet.getCell('A5').font = { name: 'Arial', size: 11, bold: true };
  worksheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A6:F6');
  worksheet.getCell('A6').value = `Academic Year: ${batchYear}`;
  worksheet.getCell('A6').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A6').alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells('W6:Z6');
  worksheet.getCell('W6').value = 'Region: 4A - CALABARZON';
  worksheet.getCell('W6').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('W6').alignment = { horizontal: 'right', vertical: 'middle' };

  // 3. Header Matrix (Rows 8 to 11)
  // Row 8
  worksheet.mergeCells('A8:A11');
  worksheet.getCell('A8').value = 'NAME OF HEI/CAMPUS';

  worksheet.mergeCells('B8:B11');
  worksheet.getCell('B8').value = 'Classification\n(Private/Public)';

  worksheet.mergeCells('C8:T8');
  worksheet.getCell('C8').value = 'ENROLLMENT';

  worksheet.mergeCells('U8:Z8');
  worksheet.getCell('U8').value = 'GRADUATES';

  // Row 9
  worksheet.mergeCells('C9:H9');
  worksheet.getCell('C9').value = '1st Sem.';

  worksheet.mergeCells('I9:N9');
  worksheet.getCell('I9').value = '2nd Sem.';

  worksheet.mergeCells('O9:T9');
  worksheet.getCell('O9').value = 'Summer';

  worksheet.mergeCells('U9:Z9');
  worksheet.getCell('U9').value = '';

  // Row 10: Tracks (ROTC, CWTS, LTS)
  [3, 9, 15, 21].forEach((semStart) => {
    worksheet.mergeCells(10, semStart, 10, semStart + 1);
    worksheet.getCell(10, semStart).value = 'ROTC';

    worksheet.mergeCells(10, semStart + 2, 10, semStart + 3);
    worksheet.getCell(10, semStart + 2).value = 'CWTS';

    worksheet.mergeCells(10, semStart + 4, 10, semStart + 5);
    worksheet.getCell(10, semStart + 4).value = 'LTS';
  });

  // Row 11: Gender (M, F)
  for (let c = 3; c <= 26; c += 2) {
    worksheet.getCell(11, c).value = 'M';
    worksheet.getCell(11, c + 1).value = 'F';
  }

  // Style Header Matrix (Rows 8 to 11)
  for (let r = 8; r <= 11; r++) {
    const row = worksheet.getRow(r);
    row.height = 20;
    for (let c = 1; c <= 26; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { name: 'Arial', size: r === 8 ? 9 : 8.5, bold: true };
      cell.fill = r === 8 ? headerFill : subHeaderFill;
    }
  }

  // 4. Calculate Aggregate Statistics
  const statsMatrix = {
    sem1: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } },
    sem2: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } },
    summer: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } },
    graduates: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } }
  };

  (students || []).forEach((st) => {
    const sexRaw = (st.sex || st.gender || 'Male').toUpperCase();
    const genKey = sexRaw.startsWith('F') ? 'f' : 'm';
    const deptRaw = (st.department || '').toUpperCase();
    let targetDept = null;
    if (deptRaw.includes('ROTC')) targetDept = 'ROTC';
    else if (deptRaw.includes('CWTS')) targetDept = 'CWTS';
    else if (deptRaw.includes('LTS')) targetDept = 'LTS';

    if (!targetDept) return;

    statsMatrix.sem1[targetDept][genKey] += 1;
    statsMatrix.sem2[targetDept][genKey] += 1;
    statsMatrix.graduates[targetDept][genKey] += 1;
  });

  // Default Campus Row in Row 14 (or 15)
  const dataRowIdx = 14;
  const dataRow = worksheet.getRow(dataRowIdx);
  dataRow.height = 22;

  dataRow.getCell(1).value = 'CAVITE STATE UNIVERSITY - NAIC';
  dataRow.getCell(2).value = 'PUBLIC';

  // 1st Sem
  dataRow.getCell(3).value = statsMatrix.sem1.ROTC.m;
  dataRow.getCell(4).value = statsMatrix.sem1.ROTC.f;
  dataRow.getCell(5).value = statsMatrix.sem1.CWTS.m;
  dataRow.getCell(6).value = statsMatrix.sem1.CWTS.f;
  dataRow.getCell(7).value = statsMatrix.sem1.LTS.m;
  dataRow.getCell(8).value = statsMatrix.sem1.LTS.f;

  // 2nd Sem
  dataRow.getCell(9).value = statsMatrix.sem2.ROTC.m;
  dataRow.getCell(10).value = statsMatrix.sem2.ROTC.f;
  dataRow.getCell(11).value = statsMatrix.sem2.CWTS.m;
  dataRow.getCell(12).value = statsMatrix.sem2.CWTS.f;
  dataRow.getCell(13).value = statsMatrix.sem2.LTS.m;
  dataRow.getCell(14).value = statsMatrix.sem2.LTS.f;

  // Summer
  dataRow.getCell(15).value = statsMatrix.summer.ROTC.m;
  dataRow.getCell(16).value = statsMatrix.summer.ROTC.f;
  dataRow.getCell(17).value = statsMatrix.summer.CWTS.m;
  dataRow.getCell(18).value = statsMatrix.summer.CWTS.f;
  dataRow.getCell(19).value = statsMatrix.summer.LTS.m;
  dataRow.getCell(20).value = statsMatrix.summer.LTS.f;

  // Graduates
  dataRow.getCell(21).value = statsMatrix.graduates.ROTC.m;
  dataRow.getCell(22).value = statsMatrix.graduates.ROTC.f;
  dataRow.getCell(23).value = statsMatrix.graduates.CWTS.m;
  dataRow.getCell(24).value = statsMatrix.graduates.CWTS.f;
  dataRow.getCell(25).value = statsMatrix.graduates.LTS.m;
  dataRow.getCell(26).value = statsMatrix.graduates.LTS.f;

  // Apply Borders & Styling to Data Row
  for (let c = 1; c <= 26; c++) {
    const cell = dataRow.getCell(c);
    cell.border = thinBorder;
    cell.font = { name: 'Arial', size: 9 };
    cell.alignment = {
      horizontal: c <= 2 ? 'left' : 'center',
      vertical: 'middle'
    };
  }

  // 5. Signatories Footer
  const sigRow = 17;
  worksheet.getCell(`A${sigRow}`).value = 'Prepared by: NSTP Department Coordinator';
  worksheet.getCell(`A${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  worksheet.getCell(`J${sigRow}`).value = 'Verified by: Campus NSTP Director';
  worksheet.getCell(`J${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  worksheet.getCell(`T${sigRow}`).value = 'Approved: Campus Administrator';
  worksheet.getCell(`T${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  return workbook;
}

/**
 * Trigger browser download of Form B Excel file with full formatting and embedded logos
 */
export async function downloadChedFormat(batchOrYear, studentList = null, dept = 'All') {
  let yearStr = '2024-2025';
  let students = [];

  if (typeof batchOrYear === 'string') {
    yearStr = batchOrYear;
    students = studentList || [];
  } else if (batchOrYear && typeof batchOrYear === 'object') {
    yearStr = batchOrYear.year || '2024-2025';
    students = batchOrYear.data?.studentData || batchOrYear.studentData || studentList || [];
  }

  if (dept !== 'All') {
    students = students.filter(s => (s.department || '').toUpperCase() === dept.toUpperCase());
  }

  const workbook = await generateChedFormBWorkbook(students, yearStr, dept);
  const safeLabel = String(yearStr).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `CHED_NSTP_Form_B_${dept !== 'All' ? dept : 'ALL'}_${safeLabel}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Trigger browser download of Form A Excel file with full formatting and embedded logos
 */
export async function downloadChedFormA(batchOrYear, studentList = null, dept = 'All') {
  let yearStr = '2024-2025';
  let students = [];

  if (typeof batchOrYear === 'string') {
    yearStr = batchOrYear;
    students = studentList || [];
  } else if (batchOrYear && typeof batchOrYear === 'object') {
    yearStr = batchOrYear.year || '2024-2025';
    students = batchOrYear.data?.studentData || batchOrYear.studentData || studentList || [];
  }

  const workbook = await generateChedFormAWorkbook(students, yearStr, dept);
  const safeLabel = String(yearStr).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `OSDS-NSTP-Form-2-A_Summary_${dept !== 'All' ? dept : 'ALL'}_${safeLabel}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
