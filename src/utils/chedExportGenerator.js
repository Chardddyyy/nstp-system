import * as XLSX from 'xlsx';

export function generateChedFormBWorkbook(students = [], batchYear = '2024-2025', deptFilter = 'All') {
  const dataRows = (students || []).map((st, idx) => {
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

    let street = st.street || '';
    let municipality = st.municipality || '';
    let province = st.province || '';

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
    } else if (st.birthMonth && st.birthDay && st.birthYear) {
      birthdate = `${st.birthMonth}/${st.birthDay}/${st.birthYear}`;
    }

    const sexVal = (st.sex || st.gender || 'Male').toUpperCase().startsWith('F') ? 'Female' : 'Male';

    return [
      idx + 1,
      st.studentId || '',
      surname,
      firstName,
      middleName,
      st.program || st.course || 'BSIT',
      sexVal,
      birthdate,
      street,
      municipality,
      province,
      st.contactNumber || '',
      st.email || ''
    ];
  });

  const nstpComponentLabel = deptFilter === 'All' ? 'CWTS / ROTC / LTS' : deptFilter;
  const isSecondSem = String(batchYear).includes('2nd');

  const aoaB = [
    ['Republic of the Philippines'],
    ['Office of the President'],
    ['Commission on Higher Education'],
    [],
    [isSecondSem ? 'NSTP 2 Enrollment List' : 'NSTP 1 Enrollment List'],
    [`Academic Year: ${batchYear}`],
    [],
    ['Name of HEI: Cavite State University - Naic', '', '', '', '', '', '', 'Region: 4A - CALABARZON'],
    ['Address: Bucana Malaki, Naic, Cavite', '', '', '', '', '', '', `NSTP Components: ${nstpComponentLabel}`],
    [],
    ['No.', 'Student No.', 'Student Name', '', '', 'Program', 'Sex', 'Birthdate', 'Address', '', '', 'Contact Number', 'Email Address'],
    ['', '', 'Surname', 'First Name', 'Middle Name', '', '', '', 'Street/Barangay', 'Municipality/City', 'Province', '', ''],
    ...dataRows,
    [],
    ['Prepared by: NSTP Department Coordinator', '', '', '', 'Certified Correct by: Campus NSTP Director', '', '', '', 'Approved by: Campus Administrator']
  ];

  const wsB = XLSX.utils.aoa_to_sheet(aoaB);

  // Set centered columns
  wsB['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 }
  ];

  wsB['!rows'] = [
    { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 10 },
    { hpt: 24 }, { hpt: 20 }, { hpt: 10 },
    { hpt: 20 }, { hpt: 20 }, { hpt: 10 },
    { hpt: 22 }, { hpt: 22 }
  ];

  wsB['!merges'] = [
    { s: { r: 4, c: 0 }, e: { r: 4, c: 12 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 12 } },
    { s: { r: 10, c: 0 }, e: { r: 11, c: 0 } },
    { s: { r: 10, c: 1 }, e: { r: 11, c: 1 } },
    { s: { r: 10, c: 2 }, e: { r: 10, c: 4 } },
    { s: { r: 10, c: 5 }, e: { r: 11, c: 5 } },
    { s: { r: 10, c: 6 }, e: { r: 11, c: 6 } },
    { s: { r: 10, c: 7 }, e: { r: 11, c: 7 } },
    { s: { r: 10, c: 8 }, e: { r: 10, c: 10 } },
    { s: { r: 10, c: 11 }, e: { r: 11, c: 11 } },
    { s: { r: 10, c: 12 }, e: { r: 11, c: 12 } }
  ];

  // Apply thin borders and centering to all data and header cells
  const rangeB = XLSX.utils.decode_range(wsB['!ref'] || 'A1:M14');
  for (let R = 10; R <= rangeB.e.r - 2; ++R) {
    for (let C = 0; C <= 12; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!wsB[cellAddress]) {
        wsB[cellAddress] = { t: 's', v: '' };
      }
      const isCenter = [0, 1, 5, 6, 7, 11].includes(C);
      wsB[cellAddress].s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        },
        alignment: {
          horizontal: isCenter ? 'center' : 'left',
          vertical: 'center',
          wrapText: true
        }
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsB, 'CHED NSTP Form B');
  return wb;
}

export function generateChedFormAWorkbook(students = [], batchYear = '2024-2025', deptFilter = 'All') {
  const statsMatrix = {
    sem1: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } },
    sem2: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } },
    summer: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } },
    graduates: { ROTC: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 }, LTS: { m: 0, f: 0 } }
  };

  (students || []).forEach(st => {
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

  const aoaA = [
    ['Republic of the Philippines'],
    ['Office of the President'],
    ['Commission on Higher Education'],
    [],
    ['SUMMARY NUMBER OF ENROLLMENT AND GRADUATES OF NSTP'],
    [`Academic Year: ${batchYear}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Region: 4A - CALABARZON'],
    [],
    ['NAME OF HEI/CAMPUS', 'Classification (Private/Public)', 'ENROLLMENT', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'GRADUATES', '', '', '', '', ''],
    ['', '', '1st Sem.', '', '', '', '', '', '2nd Sem.', '', '', '', '', '', 'Summer', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', 'ROTC', '', 'CWTS', '', 'LTS', '', 'ROTC', '', 'CWTS', '', 'LTS', '', 'ROTC', '', 'CWTS', '', 'LTS', '', 'ROTC', '', 'CWTS', '', 'LTS', ''],
    ['', '', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F'],
    [
      'Cavite State University - Naic',
      'PUBLIC',
      statsMatrix.sem1.ROTC.m, statsMatrix.sem1.ROTC.f,
      statsMatrix.sem1.CWTS.m, statsMatrix.sem1.CWTS.f,
      statsMatrix.sem1.LTS.m, statsMatrix.sem1.LTS.f,
      statsMatrix.sem2.ROTC.m, statsMatrix.sem2.ROTC.f,
      statsMatrix.sem2.CWTS.m, statsMatrix.sem2.CWTS.f,
      statsMatrix.sem2.LTS.m, statsMatrix.sem2.LTS.f,
      statsMatrix.summer.ROTC.m, statsMatrix.summer.ROTC.f,
      statsMatrix.summer.CWTS.m, statsMatrix.summer.CWTS.f,
      statsMatrix.summer.LTS.m, statsMatrix.summer.LTS.f,
      statsMatrix.graduates.ROTC.m, statsMatrix.graduates.ROTC.f,
      statsMatrix.graduates.CWTS.m, statsMatrix.graduates.CWTS.f,
      statsMatrix.graduates.LTS.m, statsMatrix.graduates.LTS.f
    ],
    [],
    [],
    ['Prepared by: NSTP Department Coordinator', '', '', '', '', '', '', '', 'Verified by: Campus NSTP Director', '', '', '', '', '', '', '', 'Approved by: Campus Administrator']
  ];

  const wsA = XLSX.utils.aoa_to_sheet(aoaA);

  wsA['!cols'] = [
    { wch: 34 },
    { wch: 22 },
    ...Array(24).fill({ wch: 9 })
  ];

  wsA['!rows'] = [
    { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 10 },
    { hpt: 24 }, { hpt: 20 }, { hpt: 10 },
    { hpt: 22 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 },
    { hpt: 24 }
  ];

  wsA['!merges'] = [
    { s: { r: 4, c: 0 }, e: { r: 4, c: 25 } },
    { s: { r: 7, c: 0 }, e: { r: 10, c: 0 } },
    { s: { r: 7, c: 1 }, e: { r: 10, c: 1 } },
    { s: { r: 7, c: 2 }, e: { r: 7, c: 19 } },
    { s: { r: 7, c: 20 }, e: { r: 7, c: 25 } },
    { s: { r: 8, c: 2 }, e: { r: 8, c: 7 } },
    { s: { r: 8, c: 8 }, e: { r: 8, c: 13 } },
    { s: { r: 8, c: 14 }, e: { r: 8, c: 19 } },
    { s: { r: 8, c: 20 }, e: { r: 8, c: 25 } },
    { s: { r: 9, c: 2 }, e: { r: 9, c: 3 } },
    { s: { r: 9, c: 4 }, e: { r: 9, c: 5 } },
    { s: { r: 9, c: 6 }, e: { r: 9, c: 7 } },
    { s: { r: 9, c: 8 }, e: { r: 9, c: 9 } },
    { s: { r: 9, c: 10 }, e: { r: 9, c: 11 } },
    { s: { r: 9, c: 12 }, e: { r: 9, c: 13 } },
    { s: { r: 9, c: 14 }, e: { r: 9, c: 15 } },
    { s: { r: 9, c: 16 }, e: { r: 9, c: 17 } },
    { s: { r: 9, c: 18 }, e: { r: 9, c: 19 } },
    { s: { r: 9, c: 20 }, e: { r: 9, c: 21 } },
    { s: { r: 9, c: 22 }, e: { r: 9, c: 23 } },
    { s: { r: 9, c: 24 }, e: { r: 9, c: 25 } }
  ];

  // Apply borders to all header and data cells for Form A
  for (let R = 7; R <= 11; ++R) {
    for (let C = 0; C <= 25; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!wsA[cellAddress]) {
        wsA[cellAddress] = { t: 's', v: '' };
      }
      wsA[cellAddress].s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true
        }
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsA, 'OSDS-NSTP Form 2-A');
  return wb;
}

export function downloadChedFormat(batchOrYear, studentList = null, dept = 'All') {
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

  const wb = generateChedFormBWorkbook(students, yearStr, dept);
  const safeLabel = String(yearStr).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `CHED_NSTP_Form_B_${dept !== 'All' ? dept : 'ALL'}_${safeLabel}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function downloadChedFormA(batchOrYear, studentList = null, dept = 'All') {
  let yearStr = '2024-2025';
  let students = [];

  if (typeof batchOrYear === 'string') {
    yearStr = batchOrYear;
    students = studentList || [];
  } else if (batchOrYear && typeof batchOrYear === 'object') {
    yearStr = batchOrYear.year || '2024-2025';
    students = batchOrYear.data?.studentData || batchOrYear.studentData || studentList || [];
  }

  const wb = generateChedFormAWorkbook(students, yearStr, dept);
  const safeLabel = String(yearStr).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `OSDS-NSTP-Form-2-A_Summary_${dept !== 'All' ? dept : 'ALL'}_${safeLabel}.xlsx`;
  XLSX.writeFile(wb, filename);
}
