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

  // Row 10: Tracks (ROTC, LTS, CWTS)
  [3, 9, 15, 21].forEach((semStart) => {
    worksheet.mergeCells(10, semStart, 10, semStart + 1);
    worksheet.getCell(10, semStart).value = 'ROTC';

    worksheet.mergeCells(10, semStart + 2, 10, semStart + 3);
    worksheet.getCell(10, semStart + 2).value = 'LTS';

    worksheet.mergeCells(10, semStart + 4, 10, semStart + 5);
    worksheet.getCell(10, semStart + 4).value = 'CWTS';
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
    sem1: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    sem2: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    summer: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
    graduates: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } }
  };

  const isOnly1stSemBatch = String(batchYear).includes('1st Sem');

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

    const g1Str = String(st.final_grade_1 || st.grade_sem1 || (st.semester === '1st Semester' ? st.final_grade : '') || st.midterm_grade || '').trim();
    const g2Str = String(st.final_grade_2 || st.grade_sem2 || (st.semester === '2nd Semester' ? st.final_grade : '') || '').trim();

    const num1 = parseFloat(g1Str);
    const isFailed1 = num1 > 3.0 || g1Str.includes('5.0') || g1Str.toUpperCase().includes('FAIL') || g1Str.toUpperCase().includes('INC') || g1Str.toUpperCase().includes('DRP');
    const isPass1 = (!isNaN(num1) && num1 >= 1.0 && num1 <= 3.0 && !isFailed1) || g1Str.toLowerCase() === 'passed';

    const num2 = parseFloat(g2Str);
    const isFailed2 = num2 > 3.0 || g2Str.includes('5.0') || g2Str.toUpperCase().includes('FAIL') || g2Str.toUpperCase().includes('INC') || g2Str.toUpperCase().includes('DRP');
    const isPass2 = (!isNaN(num2) && num2 >= 1.0 && num2 <= 3.0 && !isFailed2) || g2Str.toLowerCase() === 'passed';

    const has2ndSemFlag = st.has_2nd_sem !== false && st.has_2nd_sem !== 0;
    const isSem2Enrolled = has2ndSemFlag && Boolean(g2Str) && g2Str !== '-';

    if (isSem2Enrolled) {
      statsMatrix.sem2[targetDept][genKey] += 1;

      // Graduates: Tanging ang may markang 1.00 hanggang 3.00 sa 2nd sem (at walang bagsak/INC/DRP) ang mabibilang sa graduates
      if (isPass1 && isPass2 && !isFailed1 && !isFailed2) {
        statsMatrix.graduates[targetDept][genKey] += 1;
      }
    }
  });

  // Campus Data Row in Row 12 (Contiguous after Row 11 Headers)
  const dataRowIdx = 12;
  const dataRow = worksheet.getRow(dataRowIdx);
  dataRow.height = 22;

  dataRow.getCell(1).value = 'CAVITE STATE UNIVERSITY - NAIC';
  dataRow.getCell(2).value = 'PUBLIC';

  // 1st Sem: ROTC M/F, LTS M/F, CWTS M/F
  dataRow.getCell(3).value = statsMatrix.sem1.ROTC.m;
  dataRow.getCell(4).value = statsMatrix.sem1.ROTC.f;
  dataRow.getCell(5).value = statsMatrix.sem1.LTS.m;
  dataRow.getCell(6).value = statsMatrix.sem1.LTS.f;
  dataRow.getCell(7).value = statsMatrix.sem1.CWTS.m;
  dataRow.getCell(8).value = statsMatrix.sem1.CWTS.f;

  // 2nd Sem: ROTC M/F, LTS M/F, CWTS M/F
  dataRow.getCell(9).value = statsMatrix.sem2.ROTC.m;
  dataRow.getCell(10).value = statsMatrix.sem2.ROTC.f;
  dataRow.getCell(11).value = statsMatrix.sem2.LTS.m;
  dataRow.getCell(12).value = statsMatrix.sem2.LTS.f;
  dataRow.getCell(13).value = statsMatrix.sem2.CWTS.m;
  dataRow.getCell(14).value = statsMatrix.sem2.CWTS.f;

  // Summer: ROTC M/F, LTS M/F, CWTS M/F
  dataRow.getCell(15).value = statsMatrix.summer.ROTC.m;
  dataRow.getCell(16).value = statsMatrix.summer.ROTC.f;
  dataRow.getCell(17).value = statsMatrix.summer.LTS.m;
  dataRow.getCell(18).value = statsMatrix.summer.LTS.f;
  dataRow.getCell(19).value = statsMatrix.summer.CWTS.m;
  dataRow.getCell(20).value = statsMatrix.summer.CWTS.f;

  // Graduates: ROTC M/F, LTS M/F, CWTS M/F
  dataRow.getCell(21).value = statsMatrix.graduates.ROTC.m;
  dataRow.getCell(22).value = statsMatrix.graduates.ROTC.f;
  dataRow.getCell(23).value = statsMatrix.graduates.LTS.m;
  dataRow.getCell(24).value = statsMatrix.graduates.LTS.f;
  dataRow.getCell(25).value = statsMatrix.graduates.CWTS.m;
  dataRow.getCell(26).value = statsMatrix.graduates.CWTS.f;

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

  // Row 13: TOTAL SUMMARY ROW
  const totalRowIdx = 13;
  const totalRow = worksheet.getRow(totalRowIdx);
  totalRow.height = 22;
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(2).value = 'PUBLIC';

  for (let c = 3; c <= 26; c++) {
    totalRow.getCell(c).value = dataRow.getCell(c).value;
    totalRow.getCell(c).font = { name: 'Arial', size: 9, bold: true };
    totalRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(c).border = thinBorder;
    totalRow.getCell(c).fill = subHeaderFill;
  }
  totalRow.getCell(1).font = { name: 'Arial', size: 9, bold: true };
  totalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  totalRow.getCell(1).border = thinBorder;
  totalRow.getCell(1).fill = subHeaderFill;
  totalRow.getCell(2).font = { name: 'Arial', size: 9, bold: true };
  totalRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
  totalRow.getCell(2).border = thinBorder;
  totalRow.getCell(2).fill = subHeaderFill;

  // 5. Signatories Footer (Row 16)
  const sigRow = 16;
  worksheet.getCell(`A${sigRow}`).value = 'Prepared by: NSTP Department Coordinator';
  worksheet.getCell(`A${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  worksheet.getCell(`J${sigRow}`).value = 'Verified by: Campus NSTP Director';
  worksheet.getCell(`J${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  worksheet.getCell(`T${sigRow}`).value = 'Approved: Campus Administrator';
  worksheet.getCell(`T${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

  return workbook;
}

import { downloadChedFormBPdf, downloadChedFormAPdf, downloadAnnualForm2APdf, downloadGradesSheetPdf, downloadAttendanceMatrixPdf, downloadDailyAttendancePdf } from './chedPdfGenerator';

export { downloadChedFormBPdf, downloadChedFormAPdf, downloadAnnualForm2APdf, downloadGradesSheetPdf, downloadAttendanceMatrixPdf, downloadDailyAttendancePdf };

/**
 * Helper to trigger file download in browser from ExcelJS Buffer
 */
export function saveExcelBuffer(buffer, fileName) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Trigger download of Form 2-B as Excel (.xlsx)
 */
export async function downloadChedFormBExcel(batchOrYear, studentList = null, dept = 'All') {
  let year = typeof batchOrYear === 'object' ? (batchOrYear.year || '2026-2027') : (batchOrYear || '2026-2027');
  const students = studentList || (typeof batchOrYear === 'object' ? (batchOrYear.data?.studentData || batchOrYear.studentData || []) : []);
  const workbook = await generateChedFormBWorkbook(students, year, dept);
  const buffer = await workbook.xlsx.writeBuffer();
  const cleanDept = dept && dept !== 'All' ? `_${dept}` : '';
  saveExcelBuffer(buffer, `CHED_NSTP_Form_2-B${cleanDept}_${year.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Trigger download of Form 2-A as Excel (.xlsx)
 */
export async function downloadChedFormAExcel(batchOrYear, studentList = null, dept = 'All') {
  let year = typeof batchOrYear === 'object' ? (batchOrYear.year || '2026-2027') : (batchOrYear || '2026-2027');
  const students = studentList || (typeof batchOrYear === 'object' ? (batchOrYear.data?.studentData || batchOrYear.studentData || []) : []);
  const workbook = await generateChedFormAWorkbook(students, year, dept);
  const buffer = await workbook.xlsx.writeBuffer();
  saveExcelBuffer(buffer, `OSDS_NSTP_Form_2-A_Summary_${year.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Trigger download of Grades Sheet (Annual or Semester) as Excel (.xlsx)
 */
export async function downloadGradesSheetExcel({
  students = [],
  gradesMap = {},
  isAnnualView = false,
  selectedSchoolYear = '2026-2027',
  selectedSemester = '1st Semester',
  selectedDepartment = 'CWTS',
  selectedSection = 'All',
  getAnnualStudentInfo = null
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CvSU Naic NSTP System';
  const worksheet = workbook.addWorksheet(isAnnualView ? 'Annual Grades' : 'Semester Grades');

  const title = isAnnualView
    ? `OFFICIAL NSTP ANNUAL GRADE MASTERLIST (A.Y. ${selectedSchoolYear})`
    : `OFFICIAL NSTP GRADE ENCODING SHEET — ${selectedSemester.toUpperCase()} (A.Y. ${selectedSchoolYear})`;

  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'CAVITE STATE UNIVERSITY - NAIC CAMPUS';
  worksheet.getCell('A1').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF064E3B' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = title;
  worksheet.getCell('A2').font = { name: 'Arial', size: 10, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:H3');
  worksheet.getCell('A3').value = `Department: ${selectedDepartment} | Section: ${selectedSection} | Export Date: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A3').font = { name: 'Arial', size: 9, italic: true };
  worksheet.getCell('A3').alignment = { horizontal: 'center' };

  const headerRow = worksheet.getRow(5);
  if (isAnnualView) {
    headerRow.values = ['No.', 'Student ID', 'Full Student Name', 'Track', 'Section', '1st Sem Grade', '2nd Sem Grade', 'Annual Final Rating', 'Remarks'];
  } else {
    headerRow.values = ['No.', 'Student ID', 'Full Student Name', 'Track', 'Section', 'Final Grade', 'Remarks', 'Status'];
  }

  headerRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF064E3B' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  let rowNum = 6;
  students.forEach((st, idx) => {
    const sid = st.studentId || st.id;
    const name = (st.name || `${st.lastName || ''}, ${st.firstName || ''}`).toUpperCase();
    const row = worksheet.getRow(rowNum);

    if (isAnnualView && getAnnualStudentInfo) {
      const info = getAnnualStudentInfo(sid);
      row.values = [
        idx + 1,
        st.studentId || 'N/A',
        name,
        st.department || selectedDepartment,
        st.nstp_section || st.section || '-',
        info.g1 || '-',
        info.g2 || '-',
        info.finalRating || '-',
        info.overallRemarks || 'Pending'
      ];
    } else {
      const g = gradesMap[sid] || {};
      const finalGrade = g.final_grade || '-';
      const remarks = g.remarks || (finalGrade && finalGrade !== '-' ? (Number(finalGrade) <= 3.0 ? 'Passed' : 'Failed') : 'Pending');
      row.values = [
        idx + 1,
        st.studentId || 'N/A',
        name,
        st.department || selectedDepartment,
        st.nstp_section || st.section || '-',
        finalGrade,
        remarks,
        finalGrade && finalGrade !== '-' ? 'Graded' : 'Pending'
      ];
    }

    row.font = { name: 'Arial', size: 9 };
    row.alignment = { vertical: 'middle' };
    rowNum++;
  });

  worksheet.columns = [
    { width: 6 },
    { width: 16 },
    { width: 34 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
    { width: 16 }
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const fileLabel = isAnnualView ? `NSTP_Annual_Grades_${selectedDepartment}` : `NSTP_Grades_${selectedSemester.replace(/\s+/g, '_')}_${selectedDepartment}`;
  saveExcelBuffer(buffer, `${fileLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Trigger download of Master Attendance Matrix as Excel (.xlsx)
 */
export async function downloadAttendanceMatrixExcel({
  studentMatrixList = [],
  daysArray = [],
  selectedDept = 'CWTS',
  _selectedSchoolYear = '2026-2027'
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CvSU Naic NSTP System';
  const worksheet = workbook.addWorksheet('Attendance Matrix');

  const activeDays = daysArray.length > 0 ? daysArray : Array.from({ length: 15 }, (_, i) => `Day ${i + 1}`);

  worksheet.mergeCells('A1:V1');
  worksheet.getCell('A1').value = `OFFICIAL MASTER ATTENDANCE LEDGER (DAY 1 TO DAY 15) — ${selectedDept} TRACK`;
  worksheet.getCell('A1').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF064E3B' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  const headerRow = worksheet.getRow(4);
  headerRow.values = [
    'No.',
    'Student ID',
    'Student Name',
    'Dept',
    'Section',
    ...activeDays.map((_, i) => `D${i + 1}`),
    'Present',
    'Absent',
    'Status'
  ];

  headerRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF064E3B' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  let rowNum = 5;
  studentMatrixList.forEach((st, idx) => {
    const row = worksheet.getRow(rowNum);
    const dayChars = activeDays.map(d => {
      const s = st.dayStatuses?.[d];
      if (s === 'Present') return 'P';
      if (s === 'Late') return 'L';
      if (s === 'Excused') return 'E';
      if (s === 'Absent') return 'A';
      return '-';
    });

    row.values = [
      idx + 1,
      st.studentId || 'N/A',
      (st.name || `${st.lastName || ''}, ${st.firstName || ''}`).toUpperCase(),
      st.department || selectedDept,
      st.gradeAndSection || st.section || '-',
      ...dayChars,
      st.presentCount || 0,
      st.absentCount || 0,
      st.isAtRisk ? 'WARNING (AT-RISK / 3+ ABSENCES)' : (st.absentCount === 0 ? 'GOOD STANDING' : `${st.absentCount} ABSENCES`)
    ];

    row.font = { name: 'Arial', size: 9 };
    rowNum++;
  });

  worksheet.columns = [
    { width: 6 },
    { width: 16 },
    { width: 32 },
    { width: 10 },
    { width: 12 },
    ...activeDays.map(() => ({ width: 5 })),
    { width: 10 },
    { width: 10 },
    { width: 30 }
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  saveExcelBuffer(buffer, `NSTP_Master_Attendance_Matrix_${selectedDept}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Trigger download of Daily Attendance Log as Excel (.xlsx)
 */
export async function downloadDailyAttendanceExcel({
  records = [],
  selectedDay = 'Day 1',
  selectedDept = 'All'
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CvSU Naic NSTP System';
  const worksheet = workbook.addWorksheet('Daily Attendance');

  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = `DAILY ATTENDANCE LOG — ${selectedDay.toUpperCase()} (${selectedDept})`;
  worksheet.getCell('A1').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF064E3B' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  const headerRow = worksheet.getRow(3);
  headerRow.values = ['No.', 'Student Number', 'Full Student Name', 'Track', 'Section', 'Time In', 'Time Out', 'Status'];
  headerRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF064E3B' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  let rowNum = 4;
  records.forEach((r, idx) => {
    const row = worksheet.getRow(rowNum);
    row.values = [
      idx + 1,
      r.studentId || r.student_id || 'N/A',
      (r.name || r.student_name || 'N/A').toUpperCase(),
      r.department || r.nstp_dept || 'CWTS',
      r.section || r.grade_section || '-',
      r.timeIn || r.time_in || '-',
      r.timeOut || r.time_out || '-',
      r.status || 'Present'
    ];
    row.font = { name: 'Arial', size: 9 };
    rowNum++;
  });

  worksheet.columns = [
    { width: 6 },
    { width: 18 },
    { width: 34 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 18 }
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  saveExcelBuffer(buffer, `NSTP_Daily_Attendance_${selectedDay.replace(/\s+/g, '_')}_${selectedDept}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Backward compatibility functions
 */
export async function downloadChedFormat(batchOrYear, studentList = null, dept = 'All') {
  return downloadChedFormBPdf(batchOrYear, studentList, dept);
}

export async function downloadChedFormA(batchOrYear, studentList = null, dept = 'All') {
  return downloadChedFormAPdf(batchOrYear, studentList, dept);
}

