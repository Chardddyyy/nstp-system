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

  const batchMap = new Map();
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

      // Standardize semester name
      let semester = '1st Semester';
      const semUpper = (rawSemesterAdmitted || '').toUpperCase();
      if (semUpper.includes('SECOND') || semUpper === '2') {
        semester = '2nd Semester';
      } else if (semUpper.includes('SUMMER') || semUpper.includes('MID')) {
        semester = 'Midyear';
      }

      const schoolYear = rawYearAdmitted.trim();
      const batchKey = `${schoolYear} ${semester}`;

      if (!batchMap.has(batchKey)) {
        batchMap.set(batchKey, {
          schoolYear,
          semester,
          batchKey,
          students: []
        });
      }

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

      batchMap.get(batchKey).students.push({
        studentId: studentNumber,
        name: fullName,
        firstName,
        lastName,
        middleName: middleName === '.' ? '' : middleName,
        suffix,
        email: finalEmail,
        schoolYear,
        semester,
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
  console.log(`Total distinct batches found: ${batchMap.size}`);

  // Sort batches chronologically
  const sortedBatchKeys = Array.from(batchMap.keys()).sort((a, b) => {
    const parseKey = (str) => {
      const matchYear = str.match(/(\d{4})/);
      const startYear = matchYear ? parseInt(matchYear[1], 10) : 0;
      let semRank = 1;
      if (str.includes('2nd')) semRank = 2;
      else if (str.includes('Midyear') || str.includes('Summer')) semRank = 3;
      return startYear * 10 + semRank;
    };
    return parseKey(a) - parseKey(b);
  });

  const ACTIVE_BATCH_KEY = '2024-2025 1st Semester';
  let activeBatchStudents = [];
  const archivedBatches = [];

  for (const bKey of sortedBatchKeys) {
    const bData = batchMap.get(bKey);
    const students = bData.students;

    // Group students by course
    const courseMap = {};
    for (const s of students) {
      if (!courseMap[s.course]) courseMap[s.course] = [];
      courseMap[s.course].push(s);
    }

    let cwtsCount = 0;
    let rotcCount = 0;
    let ltsCount = 0;

    // Proportional 60% CWTS, 25% ROTC, 15% LTS distribution per course
    for (const [courseName, courseStudents] of Object.entries(courseMap)) {
      const N = courseStudents.length;
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

      // Department counters for sections
      let deptSecCount = { CWTS: 0, ROTC: 0, LTS: 0 };

      courseStudents.forEach((student, idx) => {
        let dept = 'CWTS';
        if (idx < nCWTS) {
          dept = 'CWTS';
          cwtsCount++;
        } else if (idx < nCWTS + nROTC) {
          dept = 'ROTC';
          rotcCount++;
        } else {
          dept = 'LTS';
          ltsCount++;
        }

        deptSecCount[dept]++;
        const secIndex = Math.ceil(deptSecCount[dept] / 40); // 40 students per section
        const sectionLetter = String.fromCharCode(64 + Math.min(secIndex, 26)); // A, B, C...

        student.department = dept;
        student.section = `1-${sectionLetter}`;
        student.nstp_section = `${dept}-${secIndex}`;
      });
    }

    if (bKey === ACTIVE_BATCH_KEY) {
      students.forEach(s => s.status = 'Active');
      activeBatchStudents = students;
      console.log(`[ACTIVE BATCH] ${bKey}: ${students.length} students (CWTS: ${cwtsCount}, ROTC: ${rotcCount}, LTS: ${ltsCount})`);
    } else {
      students.forEach(s => s.status = 'Completed');
      archivedBatches.push({
        year: bKey,
        studentsCount: students.length,
        cwts: cwtsCount,
        rotc: rotcCount,
        lts: ltsCount,
        students
      });
      console.log(`[ARCHIVED] ${bKey}: ${students.length} students (CWTS: ${cwtsCount}, ROTC: ${rotcCount}, LTS: ${ltsCount})`);
    }
  }

  // 1. POPULATE ACTIVE STUDENTS TABLE (2024-2025 1st Semester)
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
  console.log(`Successfully inserted ${activeCountRes[0].count} active students into students table!`);

  // Ensure current_batch table is set to 2024-2025 1st Semester
  await pool.query(`
    INSERT INTO current_batch (id, year, semester, start_date, end_date) 
    VALUES (1, '2024-2025 1st Semester', '1st Semester', '2024-08-15', '2024-12-20')
    ON DUPLICATE KEY UPDATE 
    year = '2024-2025 1st Semester', 
    semester = '1st Semester',
    updated_at = NOW()
  `);
  console.log('Current batch set to 2024-2025 1st Semester in database.');

  // 2. POPULATE ARCHIVED YEARS TABLE
  console.log('\n--- INSERTING HISTORICAL BATCHES INTO ARCHIVED_YEARS TABLE ---');
  await pool.query('TRUNCATE TABLE archived_years');
  console.log('Cleared existing rows from archived_years table.');

  for (const arch of archivedBatches) {
    const archiveData = {
      year: arch.year,
      students: arch.studentsCount,
      cwts: arch.cwts,
      lts: arch.lts,
      rotc: arch.rotc,
      reports: 0,
      studentData: arch.students,
      reportData: [],
      letterData: []
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
