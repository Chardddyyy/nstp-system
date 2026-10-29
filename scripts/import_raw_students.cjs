const fs = require('fs');
const readline = require('readline');
const mysql = require('../backend/node_modules/mysql2/promise');

async function importStudents() {
  console.log('--- STARTING STUDENT DATA IMPORT PER BATCH ---');
  const sqlFilePath = '/Users/Chardddddyyyyy/Desktop/enrollstudentinformation.sql';

  if (!fs.existsSync(sqlFilePath)) {
    console.error('File not found:', sqlFilePath);
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'nstp_system',
    waitForConnections: true,
    connectionLimit: 10
  });

  console.log('Connecting to MySQL database nstp_system...');
  await pool.query('SELECT 1');
  console.log('Database connected successfully.');

  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  // Map of schoolYear -> array of students
  const yearCohorts = new Map();
  const seenStudentIds = new Set();
  const emailSet = new Set();

  let lineCount = 0;
  let skippedRows = 0;

  for await (const line of rl) {
    lineCount++;
    const trimmed = line.trim();
    if (!trimmed.startsWith('(')) continue;

    let inQuote = false;
    let currentVal = '';
    const values = [];
    let escape = false;

    for (let i = 1; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (escape) {
        currentVal += char;
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === "'") {
        inQuote = !inQuote;
        continue;
      }
      if (char === ',' && !inQuote) {
        values.push(currentVal.trim());
        currentVal = '';
        continue;
      }
      if (char === ')' && !inQuote) {
        values.push(currentVal.trim());
        break;
      }
      currentVal += char;
    }

    if (values.length >= 19) {
      const [
        rawStudentNumber, rawFirstName, rawLastName, rawMiddleName, rawSuffix,
        rawStreet, rawBarangay, rawMunicipality, rawProvince, rawDateOfBirth,
        rawGender, rawReligion, rawCitizenship, rawStatus, rawGuardian,
        rawMobilePhone, rawYearAdmitted, rawSemesterAdmitted, rawCourse
      ] = values.map(v => v.replace(/^'|'$/g, '').trim());

      const studentNumber = rawStudentNumber.trim();
      const firstName = rawFirstName.trim();
      const lastName = rawLastName.trim();
      const middleName = rawMiddleName.trim();
      const suffix = rawSuffix.trim();

      // Skip test/garbage records
      if ((firstName === 'm' && lastName === 'm') || !studentNumber || studentNumber === '0') {
        skippedRows++;
        continue;
      }

      // Deduplicate studentNumber
      if (seenStudentIds.has(studentNumber)) {
        skippedRows++;
        continue;
      }
      seenStudentIds.add(studentNumber);

      // Only import 2012 up to present
      const yearMatch = (rawYearAdmitted || '').match(/^(\d{4})/);
      if (!yearMatch || parseInt(yearMatch[1], 10) < 2012) {
        skippedRows++;
        continue;
      }

      const schoolYear = rawYearAdmitted.trim();

      // Format Date of Birth
      let birthDate = null;
      let birthYear = '';
      let birthMonth = '';
      let birthDay = '';
      let age = '';

      if (rawDateOfBirth && rawDateOfBirth !== '0000-00-00') {
        const parts = rawDateOfBirth.split('-');
        if (parts.length === 3 && parts[0] !== '0000') {
          birthDate = rawDateOfBirth;
          birthYear = parts[0];
          birthMonth = parts[1];
          birthDay = parts[2];
          const calculatedAge = new Date().getFullYear() - parseInt(parts[0], 10);
          if (calculatedAge >= 15 && calculatedAge <= 65) {
            age = String(calculatedAge);
          }
        }
      }

      // Format Gender
      let gender = 'Male';
      const gUpper = (rawGender || '').toUpperCase();
      if (gUpper.startsWith('F')) {
        gender = 'Female';
      } else if (gUpper.startsWith('M')) {
        gender = 'Male';
      }

      // Format Civil Status
      let civilStatus = 'Single';
      const statUpper = (rawStatus || '').toUpperCase();
      if (statUpper.includes('MARRIED')) civilStatus = 'Married';
      else if (statUpper.includes('WIDOW')) civilStatus = 'Widowed';

      // Full Name
      const nameParts = [lastName + ','];
      if (firstName) nameParts.push(firstName);
      if (middleName && middleName !== '.' && middleName.length > 0) nameParts.push(middleName);
      if (suffix) nameParts.push(suffix);
      const fullName = nameParts.join(' ').replace(/\s+/g, ' ').trim();

      // Clean address
      const addressParts = [rawStreet, rawBarangay, rawMunicipality, rawProvince].filter(p => p && p.trim() !== '' && p !== 'N/A');
      const address = addressParts.join(', ');

      // Base email
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      let baseEmail = `${cleanFirst}.${cleanLast}@cvsu.edu.ph`;
      if (!cleanFirst && !cleanLast) {
        baseEmail = `student${studentNumber}@cvsu.edu.ph`;
      }
      let finalEmail = baseEmail;
      let emailCounter = 2;
      while (emailSet.has(finalEmail)) {
        finalEmail = `${cleanFirst}.${cleanLast}${emailCounter}@cvsu.edu.ph`;
        emailCounter++;
      }
      emailSet.add(finalEmail);

      const course = rawCourse || 'BSIT';

      if (!yearCohorts.has(schoolYear)) {
        yearCohorts.set(schoolYear, []);
      }

      yearCohorts.get(schoolYear).push({
        studentId: studentNumber,
        name: fullName,
        firstName,
        lastName,
        middleName: middleName === '.' ? '' : middleName,
        suffix,
        email: finalEmail,
        schoolYear,
        course,
        program: course,
        year: '1st Year',
        contactNumber: rawMobilePhone || '',
        address,
        street: rawStreet || '',
        municipality: rawMunicipality || 'NAIC',
        province: rawProvince || 'CAVITE',
        birthDate,
        birthMonth,
        birthDay,
        birthYear,
        age,
        civilStatus,
        gender,
        emergencyContact: rawGuardian || '',
        emergencyNumber: rawMobilePhone || '',
        religion: rawReligion || '',
        citizenship: rawCitizenship || 'FILIPINO'
      });
    }
  }

  console.log(`Parsed ${lineCount} SQL lines. Total unique students found (>= 2012): ${seenStudentIds.size}`);
  console.log(`Distinct school years found: ${yearCohorts.size}`);

  // Sort school years chronologically
  const sortedYears = Array.from(yearCohorts.keys()).sort((a, b) => {
    const yA = parseInt(a.slice(0, 4), 10) || 0;
    const yB = parseInt(b.slice(0, 4), 10) || 0;
    return yA - yB;
  });

  // Assign track distribution (60% CWTS, 25% ROTC, 15% LTS) per course for each cohort
  for (const year of sortedYears) {
    const students = yearCohorts.get(year);
    const courseMap = {};
    for (const s of students) {
      if (!courseMap[s.course]) courseMap[s.course] = [];
      courseMap[s.course].push(s);
    }

    for (const [cName, list] of Object.entries(courseMap)) {
      const N = list.length;
      let nCWTS, nROTC, nLTS;
      if (N >= 3) {
        nCWTS = Math.round(N * 0.60);
        nROTC = Math.max(1, Math.round(N * 0.25));
        nLTS = Math.max(1, N - nCWTS - nROTC);
        nCWTS = N - nROTC - nLTS;
      } else if (N === 2) {
        nCWTS = 1;
        nROTC = 1;
        nLTS = 0;
      } else {
        nCWTS = 1;
        nROTC = 0;
        nLTS = 0;
      }

      const deptSecCount = { CWTS: 0, ROTC: 0, LTS: 0 };
      list.forEach((s, idx) => {
        let dept = 'CWTS';
        if (idx < nCWTS) dept = 'CWTS';
        else if (idx < nCWTS + nROTC) dept = 'ROTC';
        else dept = 'LTS';

        deptSecCount[dept]++;
        const secIndex = Math.ceil(deptSecCount[dept] / 40);
        const secLetter = String.fromCharCode(64 + Math.min(secIndex, 26));

        s.department = dept;
        s.section = `1-${secLetter}`;
        s.nstp_section = `${dept}-${secIndex}`;
      });
    }
  }

  // Active batch is: 2026-2027 1st Semester
  const ACTIVE_BATCH_KEY = '2026-2027 1st Semester';
  let activeBatchStudents = [];
  const archivedBatches = [];

  // Generate 1st Semester and 2nd Semester for EVERY school year
  for (const year of sortedYears) {
    const baseStudents = yearCohorts.get(year);

    // 1. 1st Semester
    const sem1Key = `${year} 1st Semester`;
    const sem1Students = baseStudents.map(s => ({
      ...s,
      semester: '1st Semester'
    }));

    // 2. 2nd Semester (Identical data to 1st Semester, per user request)
    const sem2Key = `${year} 2nd Semester`;
    const sem2Students = baseStudents.map(s => ({
      ...s,
      semester: '2nd Semester'
    }));

    // Handle 1st Semester
    if (sem1Key === ACTIVE_BATCH_KEY) {
      sem1Students.forEach(s => s.status = 'Active');
      activeBatchStudents = sem1Students;
      const cwts = sem1Students.filter(s => s.department === 'CWTS').length;
      const rotc = sem1Students.filter(s => s.department === 'ROTC').length;
      const lts = sem1Students.filter(s => s.department === 'LTS').length;
      console.log(`[ACTIVE BATCH] ${sem1Key}: ${sem1Students.length} students (CWTS: ${cwts}, ROTC: ${rotc}, LTS: ${lts})`);
    } else {
      sem1Students.forEach(s => s.status = 'Completed');
      const cwts = sem1Students.filter(s => s.department === 'CWTS').length;
      const rotc = sem1Students.filter(s => s.department === 'ROTC').length;
      const lts = sem1Students.filter(s => s.department === 'LTS').length;
      archivedBatches.push({
        year: sem1Key,
        studentsCount: sem1Students.length,
        cwts, rotc, lts,
        students: sem1Students
      });
      console.log(`[ARCHIVED] ${sem1Key}: ${sem1Students.length} students (CWTS: ${cwts}, ROTC: ${rotc}, LTS: ${lts})`);
    }

    // Handle 2nd Semester (always archived)
    sem2Students.forEach(s => s.status = 'Completed');
    const cwts2 = sem2Students.filter(s => s.department === 'CWTS').length;
    const rotc2 = sem2Students.filter(s => s.department === 'ROTC').length;
    const lts2 = sem2Students.filter(s => s.department === 'LTS').length;
    archivedBatches.push({
      year: sem2Key,
      studentsCount: sem2Students.length,
      cwts: cwts2, rotc: rotc2, lts: lts2,
      students: sem2Students
    });
    console.log(`[ARCHIVED] ${sem2Key}: ${sem2Students.length} students (CWTS: ${cwts2}, ROTC: ${rotc2}, LTS: ${lts2}) [Mirrored 1st Sem Data]`);
  }

  // 1. POPULATE ACTIVE STUDENTS TABLE (2026-2027 1st Semester)
  console.log('\n--- INSERTING ACTIVE BATCH INTO STUDENTS TABLE ---');
  await pool.query('TRUNCATE TABLE students');
  console.log('Cleared existing rows from students table.');

  const studentColumns = [
    'studentId', 'name', 'firstName', 'lastName', 'middleName', 'suffix',
    'email', 'department', 'status', 'semester', 'schoolYear', 'course',
    'program', 'year', 'section', 'nstp_section', 'contactNumber', 'address',
    'street', 'municipality', 'province', 'birthDate', 'birthMonth',
    'birthDay', 'birthYear', 'age', 'civilStatus', 'gender',
    'emergencyContact', 'emergencyNumber'
  ];

  const CHUNK_SIZE = 50;
  for (let i = 0; i < activeBatchStudents.length; i += CHUNK_SIZE) {
    const chunk = activeBatchStudents.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => `(${studentColumns.map(() => '?').join(', ')})`).join(', ');
    const values = [];

    for (const s of chunk) {
      for (const col of studentColumns) {
        values.push(s[col] !== undefined ? s[col] : null);
      }
    }

    const query = `INSERT INTO students (${studentColumns.join(', ')}) VALUES ${placeholders}`;
    await pool.query(query, values);
  }

  const [activeCountRes] = await pool.query('SELECT count(*) as count FROM students');
  console.log(`Successfully inserted ${activeCountRes[0].count} active students for batch ${ACTIVE_BATCH_KEY} into students table!`);

  // Ensure current_batch table is set to 2026-2027 1st Semester
  await pool.query(`
    INSERT INTO current_batch (id, year, semester, start_month, end_month, start_date, end_date) 
    VALUES (1, '2026-2027 1st Semester', '1st Semester', '2026-08', '2026-12', '2026-08-15', '2026-12-20')
    ON DUPLICATE KEY UPDATE 
    year = '2026-2027 1st Semester', 
    semester = '1st Semester',
    start_month = '2026-08',
    end_month = '2026-12',
    start_date = '2026-08-15',
    end_date = '2026-12-20',
    updated_at = NOW()
  `);
  console.log('Current batch set to 2026-2027 1st Semester in database.');

  // 2. POPULATE ARCHIVED YEARS TABLE
  console.log('\n--- INSERTING HISTORICAL BATCHES INTO ARCHIVED_YEARS TABLE ---');
  await pool.query('TRUNCATE TABLE archived_years');
  console.log('Cleared existing rows from archived_years table.');

  for (const arch of archivedBatches) {
    const isFirstSem = arch.year.includes('1st Sem');
    const startYearMatch = arch.year.match(/(\d{4})/);
    const startYr = startYearMatch ? parseInt(startYearMatch[1], 10) : 2024;
    const startMonth = isFirstSem ? `${startYr}-08` : `${startYr + 1}-01`;
    const endMonth = isFirstSem ? `${startYr}-12` : `${startYr + 1}-05`;

    const archiveData = {
      year: arch.year,
      students: arch.studentsCount,
      cwts: arch.cwts,
      lts: arch.lts,
      rotc: arch.rotc,
      reports: 0,
      studentData: arch.students,
      reportData: [],
      letterData: [],
      start_month: startMonth,
      end_month: endMonth,
      calendar_start_date: `${startMonth}-15`,
      calendar_end_date: `${endMonth}-20`
    };

    await pool.query(
      'INSERT INTO archived_years (year, students, reports, data) VALUES (?, ?, ?, ?)',
      [arch.year, arch.studentsCount, 0, JSON.stringify(archiveData)]
    );
  }

  const [archCountRes] = await pool.query('SELECT count(*) as count FROM archived_years');
  console.log(`Successfully inserted ${archCountRes[0].count} archived batches into archived_years table!`);

  console.log('\n--- DATA IMPORT COMPLETED SUCCESSFULLY ---');
  await pool.end();
}

importStudents().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
