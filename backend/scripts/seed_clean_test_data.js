require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const connection = await pool.getConnection();

  // Load sample 2x2 photos (neat hair, white collared shirt, white background)
  const idPhotosDir = path.join(__dirname, '../../public/id-photos');
  const male1Base64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(idPhotosDir, 'male-1.jpg')).toString('base64');
  const male2Base64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(idPhotosDir, 'male-2.jpg')).toString('base64');
  const female1Base64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(idPhotosDir, 'female-1.jpg')).toString('base64');
  const female2Base64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(idPhotosDir, 'female-2.jpg')).toString('base64');
  const malePhotos = [male1Base64, male2Base64];
  const femalePhotos = [female1Base64, female2Base64];

  try {
    console.log('--- STARTING CLEAN TEST SEEDING ---');

    // 1. Verify archived_years count before doing anything
    const [archBefore] = await connection.execute('SELECT COUNT(*) as count FROM archived_years');
    console.log('Archived batches before (must NOT change):', archBefore[0].count);

    // 2. Disable foreign key checks for atomic current batch wipe & repopulate
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Clean up duplicate user 6 if exists
    await connection.execute('DELETE FROM conversation_participants WHERE user_id = 6');
    await connection.execute('DELETE FROM users WHERE id = 6');

    // Ensure 4 official test users
    await connection.execute(`
      UPDATE users SET email = 'admin@gmail.com', name = 'NSTP Administrator', role = 'admin', department = 'NSTP Office', avatar = 'avatar-4' WHERE id = 1
    `);
    await connection.execute(`
      UPDATE users SET email = 'cwts@gmail.com', name = 'CWTS Instructor', role = 'instructor', department = 'CWTS', avatar = 'avatar-2' WHERE id = 2
    `);
    await connection.execute(`
      UPDATE users SET email = 'lts@gmail.com', name = 'LTS Instructor', role = 'instructor', department = 'LTS', avatar = 'avatar-6' WHERE id = 3
    `);
    await connection.execute(`
      UPDATE users SET email = 'rotc@gmail.com', name = 'ROTC Instructor', role = 'instructor', department = 'ROTC', avatar = 'avatar-8' WHERE id = 4
    `);

    // 3. Clear all messages & reset conversations
    await connection.execute('TRUNCATE TABLE messages');
    await connection.execute('TRUNCATE TABLE calls');
    // Clear direct conversations, keep only group-all-instructors
    await connection.execute("DELETE FROM conversations WHERE id != 'group-all-instructors'");
    await connection.execute("DELETE FROM conversation_participants WHERE conversation_id != 'group-all-instructors'");
    await connection.execute(`
      UPDATE conversations 
      SET last_message = NULL, last_message_time = NULL, last_sender_id = NULL, last_sender_name = NULL, unread_count = 0
    `);

    // Ensure all 4 users are participants in group-all-instructors
    for (let uId = 1; uId <= 4; uId++) {
      const [pCheck] = await connection.execute(
        'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        ['group-all-instructors', uId]
      );
      if (pCheck.length === 0) {
        await connection.execute(
          'INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES (?, ?, NOW())',
          ['group-all-instructors', uId]
        );
      }
    }

    // 4. Wipe current batch students, enrollments, reports, grades, attendance
    await connection.execute('TRUNCATE TABLE students');
    await connection.execute('TRUNCATE TABLE enrollments');
    await connection.execute('TRUNCATE TABLE reports');
    await connection.execute('TRUNCATE TABLE report_submissions');
    await connection.execute('TRUNCATE TABLE report_comments');
    await connection.execute('TRUNCATE TABLE student_grades');
    await connection.execute('TRUNCATE TABLE attendance_records');

    console.log('Cleared current batch data and messages.');

    // 5. Insert 7 PENDING ENROLLMENT students with FULL DETAILS
    const pendingStudents = [
      {
        firstName: 'John Carlo',
        lastName: 'Mendoza',
        middleName: 'Villanueva',
        suffix: '',
        studentId: '202610041',
        email: 'johncarlo.mendoza@cvsu.edu.ph',
        department: 'CWTS',
        contactNumber: '09174561234',
        address: 'Blk 12 Lot 4, Ciudad Nuevo, Barangay Sabang, Naic, Cavite',
        street: 'Blk 12 Lot 4, Ciudad Nuevo',
        municipality: 'Naic',
        province: 'Cavite',
        birthDate: '2006-04-12',
        birthMonth: '04',
        birthDay: '12',
        birthYear: '2006',
        age: '20',
        civilStatus: 'Single',
        gender: 'Male',
        height: '170 cm',
        weight: '64 kg',
        bloodType: 'O+',
        facebookAccount: 'facebook.com/johncarlo.mendoza.official',
        course: 'Bachelor of Science in Information Technology',
        program: 'BS Information Technology',
        section: '1-A',
        yearLevel: '1st Year',
        emergencyContact: 'Maria Mendoza (Mother)',
        emergencyNumber: '09187654321',
        registeredVoter: 'Yes',
        nstp_section: 'CWTS 1',
        submitted_at: '2026-08-25 08:30:00'
      },
      {
        firstName: 'Alyssa Mae',
        lastName: 'Bautista',
        middleName: 'Del Rosario',
        suffix: '',
        studentId: '202610042',
        email: 'alyssamae.bautista@cvsu.edu.ph',
        department: 'LTS',
        contactNumber: '09289876543',
        address: 'Purok 2, Coastal Road, Barangay Bucana Malaki, Naic, Cavite',
        street: 'Purok 2, Coastal Road',
        municipality: 'Naic',
        province: 'Cavite',
        birthDate: '2006-09-18',
        birthMonth: '09',
        birthDay: '18',
        birthYear: '2006',
        age: '19',
        civilStatus: 'Single',
        gender: 'Female',
        height: '158 cm',
        weight: '50 kg',
        bloodType: 'A+',
        facebookAccount: 'facebook.com/alyssa.bautista.naic',
        course: 'Bachelor of Secondary Education - English',
        program: 'BSEd English',
        section: '1-A',
        yearLevel: '1st Year',
        emergencyContact: 'Ronaldo Bautista (Father)',
        emergencyNumber: '09298761234',
        registeredVoter: 'Yes',
        nstp_section: 'LTS 1',
        submitted_at: '2026-08-26 10:15:00'
      },
      {
        firstName: 'Rodel Christian',
        lastName: 'Aquino',
        middleName: 'Mercado',
        suffix: 'Jr.',
        studentId: '202610043',
        email: 'rodel.aquino@cvsu.edu.ph',
        department: 'ROTC',
        contactNumber: '09391122334',
        address: 'Phase 3, Villa Apolonia, Barangay Halang, Naic, Cavite',
        street: 'Phase 3, Villa Apolonia',
        municipality: 'Naic',
        province: 'Cavite',
        birthDate: '2005-11-28',
        birthMonth: '11',
        birthDay: '28',
        birthYear: '2005',
        age: '20',
        civilStatus: 'Single',
        gender: 'Male',
        height: '175 cm',
        weight: '68 kg',
        bloodType: 'B+',
        facebookAccount: 'facebook.com/rodel.aquino.jr',
        course: 'Bachelor of Science in Computer Science',
        program: 'BS Computer Science',
        section: '1-B',
        yearLevel: '1st Year',
        emergencyContact: 'Rodel Aquino Sr. (Father)',
        emergencyNumber: '09395544332',
        registeredVoter: 'Yes',
        nstp_section: 'ROTC 1',
        submitted_at: '2026-08-27 13:40:00'
      },
      {
        firstName: 'Princess Diane',
        lastName: 'Soriano',
        middleName: 'Pascual',
        suffix: '',
        studentId: '202610044',
        email: 'princessdiane.soriano@cvsu.edu.ph',
        department: 'CWTS',
        contactNumber: '09456789012',
        address: 'Sitio Kawayan, Barangay Muzon, Naic, Cavite',
        street: 'Sitio Kawayan',
        municipality: 'Naic',
        province: 'Cavite',
        birthDate: '2006-01-05',
        birthMonth: '01',
        birthDay: '05',
        birthYear: '2006',
        age: '20',
        civilStatus: 'Single',
        gender: 'Female',
        height: '162 cm',
        weight: '53 kg',
        bloodType: 'O+',
        facebookAccount: 'facebook.com/princess.soriano.diane',
        course: 'Bachelor of Science in Hospitality Management',
        program: 'BS Hospitality Management',
        section: '1-A',
        yearLevel: '1st Year',
        emergencyContact: 'Luzviminda Soriano (Mother)',
        emergencyNumber: '09459988776',
        registeredVoter: 'No',
        nstp_section: 'CWTS 2',
        submitted_at: '2026-08-28 11:20:00'
      },
      {
        firstName: 'Christian Dave',
        lastName: 'Tolentino',
        middleName: 'Alvarez',
        suffix: '',
        studentId: '202610045',
        email: 'christiandave.tolentino@cvsu.edu.ph',
        department: 'ROTC',
        contactNumber: '09562345678',
        address: 'Barangay Latoria, Naic, Cavite',
        street: 'Main Highway, Barangay Latoria',
        municipality: 'Naic',
        province: 'Cavite',
        birthDate: '2005-08-14',
        birthMonth: '08',
        birthDay: '14',
        birthYear: '2005',
        age: '21',
        civilStatus: 'Single',
        gender: 'Male',
        height: '172 cm',
        weight: '65 kg',
        bloodType: 'AB+',
        facebookAccount: 'facebook.com/cdave.tolentino',
        course: 'Bachelor of Science in Business Management',
        program: 'BS Business Management',
        section: '1-B',
        yearLevel: '1st Year',
        emergencyContact: 'Edgardo Tolentino (Father)',
        emergencyNumber: '09568877665',
        registeredVoter: 'Yes',
        nstp_section: 'ROTC 2',
        submitted_at: '2026-08-29 14:05:00'
      },
      {
        firstName: 'Kimberly Joy',
        lastName: 'Ramos',
        middleName: 'Castillo',
        suffix: '',
        studentId: '202610046',
        email: 'kimberlyjoy.ramos@cvsu.edu.ph',
        department: 'CWTS',
        contactNumber: '09663456789',
        address: 'Purok 4, Barangay Balsahan, Naic, Cavite',
        street: 'Purok 4',
        municipality: 'Naic',
        province: 'Cavite',
        birthDate: '2006-07-22',
        birthMonth: '07',
        birthDay: '22',
        birthYear: '2006',
        age: '20',
        civilStatus: 'Single',
        gender: 'Female',
        height: '155 cm',
        weight: '47 kg',
        bloodType: 'B+',
        facebookAccount: 'facebook.com/kim.ramos.naic',
        course: 'Bachelor of Science in Information Technology',
        program: 'BS Information Technology',
        section: '1-C',
        yearLevel: '1st Year',
        emergencyContact: 'Rowena Ramos (Mother)',
        emergencyNumber: '09667788990',
        registeredVoter: 'Yes',
        nstp_section: 'CWTS 1',
        submitted_at: '2026-08-30 09:50:00'
      },
      {
        firstName: 'Gabriel',
        lastName: 'Navarro',
        middleName: 'Ignacio',
        suffix: '',
        studentId: '202610047',
        email: 'gabriel.navarro@cvsu.edu.ph',
        department: 'ROTC',
        contactNumber: '09774567890',
        address: 'Barangay San Roque, Naic, Cavite',
        street: 'Rizal Extension St.',
        municipality: 'Naic',
        province: 'Cavite',
        birthDate: '2005-12-03',
        birthMonth: '12',
        birthDay: '03',
        birthYear: '2005',
        age: '20',
        civilStatus: 'Single',
        gender: 'Male',
        height: '178 cm',
        weight: '71 kg',
        bloodType: 'O+',
        facebookAccount: 'facebook.com/gabriel.navarro.official',
        course: 'Bachelor of Science in Computer Science',
        program: 'BS Computer Science',
        section: '1-A',
        yearLevel: '1st Year',
        emergencyContact: 'Teresa Navarro (Mother)',
        emergencyNumber: '09778899001',
        registeredVoter: 'Yes',
        nstp_section: 'ROTC 1',
        submitted_at: '2026-08-31 16:10:00'
      }
    ];

    for (let pIdx = 0; pIdx < pendingStudents.length; pIdx++) {
      const p = pendingStudents[pIdx];
      const studentName = `${p.firstName} ${p.middleName ? p.middleName.charAt(0) + '. ' : ''}${p.lastName}${p.suffix ? ' ' + p.suffix : ''}`;
      const isFemale = p.gender === 'Female';
      const photoUri = isFemale ? femalePhotos[pIdx % femalePhotos.length] : malePhotos[pIdx % malePhotos.length];

      await connection.execute(`
        INSERT INTO enrollments (
          student_name, firstName, lastName, middleName, suffix, email, department,
          studentId, contactNumber, homeAddress, address, street, municipality, province,
          birthDate, birthMonth, birthDay, birthYear, age, civilStatus, gender,
          height, weight, bloodType, facebookAccount, course, program, section,
          yearLevel, emergencyContact, emergencyNumber, registeredVoter, status,
          nstp_section, submitted_at, id_photo_2x2, photo, registration_photo
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'Pending',
          ?, ?, ?, ?, ?
        )
      `, [
        studentName, p.firstName, p.lastName, p.middleName, p.suffix, p.email, p.department,
        p.studentId, p.contactNumber, p.address, p.address, p.street, p.municipality, p.province,
        p.birthDate, p.birthMonth, p.birthDay, p.birthYear, p.age, p.civilStatus, p.gender,
        p.height, p.weight, p.bloodType, p.facebookAccount, p.course, p.program, p.section,
        p.yearLevel, p.emergencyContact, p.emergencyNumber, p.registeredVoter,
        p.nstp_section, p.submitted_at, photoUri, photoUri, photoUri
      ]);
    }
    console.log(`Inserted ${pendingStudents.length} pending enrollment students.`);

    // 6. Insert 38 ACTIVE STUDENTS with FULL DETAILS (CWTS: 16, ROTC: 14, LTS: 8)
    const firstNamesMale = [
      'Angelo', 'Christian', 'Daniel', 'Jerome', 'Mark Anthony', 'Joshua', 'Kevin', 'Adrian',
      'Gabriel', 'John Paul', 'Kenneth', 'Justin', 'Nathaniel', 'Ezekiel', 'Bryan', 'Vincent',
      'Dominic', 'Carl', 'Francis', 'Patrick'
    ];
    const firstNamesFemale = [
      'Angelica', 'Bea', 'Catherine', 'Danielle', 'Erika', 'Fatima', 'Geline', 'Hazel',
      'Irish', 'Jasmine', 'Kimberly', 'Lorraine', 'Mary Grace', 'Nicole', 'Patricia', 'Queenie',
      'Rochelle', 'Stephanie', 'Trisha', 'Veronica'
    ];
    const lastNames = [
      'Cruz', 'Santos', 'Reyes', 'Bautista', 'Del Rosario', 'Garcia', 'Mendoza', 'Torres',
      'Flores', 'Castillo', 'Villanueva', 'Ramos', 'Castro', 'Rivera', 'Aquino', 'Marquez',
      'Tolentino', 'Salazar', 'Navarro', 'Soriano', 'Mercado', 'Dela Cruz', 'Hernandez', 'Corpuz',
      'Domingo', 'Valdez', 'Morales', 'Pascual', 'Manalo', 'Alcantara', 'Serrano', 'Padilla',
      'De Leon', 'Magno', 'Espiritu', 'Ferrer', 'Ignacio', 'Lim'
    ];
    const middleNames = [
      'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Castillo',
      'Villanueva', 'Ramos', 'Bautista', 'Aquino', 'Tolentino', 'Salazar', 'Navarro', 'Soriano'
    ];
    const barangaysNaic = [
      'Bucana Malaki', 'Bucana Sasahan', 'Bagong Karsada', 'Balsahan', 'Halang', 'Humbac',
      'Ibayo Silangan', 'Ibayo Estacion', 'Kanluran', 'Labac', 'Latoria', 'Malainen Bago',
      'Malainen Luma', 'Molino', 'Muzon', 'San Roque', 'Sabang', 'Timalan Balsahan', 'Timalan Concepcion'
    ];
    const programsList = [
      { name: 'BS Information Technology', course: 'Bachelor of Science in Information Technology' },
      { name: 'BS Computer Science', course: 'Bachelor of Science in Computer Science' },
      { name: 'BS Hospitality Management', course: 'Bachelor of Science in Hospitality Management' },
      { name: 'BS Business Management', course: 'Bachelor of Science in Business Management' },
      { name: 'BSEd English', course: 'Bachelor of Secondary Education - Major in English' }
    ];

    const enrolledStudents = [];
    // 38 total: CWTS = 16, ROTC = 14, LTS = 8
    const deptAllocations = [
      ...Array(16).fill('CWTS'),
      ...Array(14).fill('ROTC'),
      ...Array(8).fill('LTS')
    ];

    for (let i = 0; i < 38; i++) {
      const isMale = i % 2 === 0;
      const firstName = isMale 
        ? firstNamesMale[i % firstNamesMale.length] 
        : firstNamesFemale[i % firstNamesFemale.length];
      const lastName = lastNames[i % lastNames.length];
      const middleName = middleNames[i % middleNames.length];
      const dept = deptAllocations[i];
      const idNum = 202610001 + i;
      const studentId = String(idNum);
      const studentName = `${firstName} ${middleName.charAt(0)}. ${lastName}`;
      const progObj = programsList[i % programsList.length];
      const bgy = barangaysNaic[i % barangaysNaic.length];
      const street = `Purok ${(i % 6) + 1}, ${bgy}`;
      const address = `${street}, Naic, Cavite`;
      const birthMonthNum = ((i % 12) + 1).toString().padStart(2, '0');
      const birthDayNum = ((i % 28) + 1).toString().padStart(2, '0');
      const birthYearNum = String(2005 + (i % 3));
      const birthDate = `${birthYearNum}-${birthMonthNum}-${birthDayNum}`;
      const age = String(2026 - parseInt(birthYearNum, 10));
      const nstpSec = `${dept} ${(i % 2) + 1}`;
      const schoolSec = `1-${['A', 'B', 'C'][i % 3]}`;
      const email = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@cvsu.edu.ph`;
      const bloodTypes = ['O+', 'A+', 'B+', 'AB+'];
      const bloodType = bloodTypes[i % bloodTypes.length];
      const phone = `09${(15 + (i % 80)).toString().padStart(2, '0')}${(1000000 + (i * 24321) % 8999999).toString().slice(0, 7)}`;
      const emerPhone = `09${(20 + (i % 70)).toString().padStart(2, '0')}${(2000000 + (i * 31415) % 8999999).toString().slice(0, 7)}`;
      const height = `${154 + (i % 24)} cm`;
      const weight = `${48 + (i % 30)} kg`;
      const serialId = `NSTP-2026-${dept}-${String(i + 1).padStart(4, '0')}`;
      const qrToken = `QR-${studentId}-${dept}`;

      enrolledStudents.push({
        studentId,
        name: studentName,
        firstName,
        lastName,
        middleName,
        email,
        department: dept,
        status: 'Active',
        semester: '1st Semester',
        schoolYear: '2026-2027',
        course: progObj.course,
        program: progObj.name,
        year: '1st Year',
        section: schoolSec,
        contactNumber: phone,
        address,
        street,
        municipality: 'Naic',
        province: 'Cavite',
        birthDate,
        birthMonth: birthMonthNum,
        birthDay: birthDayNum,
        birthYear: birthYearNum,
        age,
        civilStatus: 'Single',
        gender: isMale ? 'Male' : 'Female',
        height,
        weight,
        bloodType,
        facebookAccount: `facebook.com/${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase()}`,
        emergencyContact: `${isMale ? 'Lourdes' : 'Antonio'} ${lastName} (Parent)`,
        emergencyNumber: emerPhone,
        registeredVoter: i % 3 === 0 ? 'No' : 'Yes',
        nstp_section: nstpSec,
        nstp_serial_id: serialId,
        qr_token: qrToken
      });
    }

    for (let sIdx = 0; sIdx < enrolledStudents.length; sIdx++) {
      const s = enrolledStudents[sIdx];
      const isFemale = s.gender === 'Female';
      const photoUri = isFemale ? femalePhotos[sIdx % femalePhotos.length] : malePhotos[sIdx % malePhotos.length];

      const [res] = await connection.execute(`
        INSERT INTO students (
          studentId, name, firstName, lastName, middleName, email, department,
          status, semester, schoolYear, course, program, year, section,
          contactNumber, address, street, municipality, province, birthDate,
          birthMonth, birthDay, birthYear, age, civilStatus, gender, height,
          weight, bloodType, facebookAccount, emergencyContact, emergencyNumber,
          registeredVoter, nstp_section, nstp_serial_id, qr_token,
          id_photo_2x2, photo, registration_photo
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          'Active', '1st Semester', '2026-2027', ?, ?, '1st Year', ?,
          ?, ?, ?, ?, 'Cavite', ?,
          ?, ?, ?, ?, 'Single', ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        )
      `, [
        s.studentId, s.name, s.firstName, s.lastName, s.middleName, s.email, s.department,
        s.course, s.program, s.section,
        s.contactNumber, s.address, s.street, s.municipality, s.birthDate,
        s.birthMonth, s.birthDay, s.birthYear, s.age, s.gender, s.height,
        s.weight, s.bloodType, s.facebookAccount, s.emergencyContact, s.emergencyNumber,
        s.registeredVoter, s.nstp_section, s.nstp_serial_id, s.qr_token,
        photoUri, photoUri, photoUri
      ]);

      const insertedStudentDbId = res.insertId;

      // Seed Student Grade row
      const instructorMap = {
        CWTS: { id: 2, name: 'CWTS Instructor' },
        LTS: { id: 3, name: 'LTS Instructor' },
        ROTC: { id: 4, name: 'ROTC Instructor' }
      };
      const inst = instructorMap[s.department];
      const gradesPool = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25];
      const midtermGrade = gradesPool[insertedStudentDbId % gradesPool.length];
      const finalGrade = gradesPool[(insertedStudentDbId + 1) % gradesPool.length];

      await connection.execute(`
        INSERT INTO student_grades (
          student_id, studentId, student_name, department, semester,
          school_year, nstp_section, midterm_grade, final_grade, remarks,
          instructor_id, instructor_name
        ) VALUES (
          ?, ?, ?, ?, '1st Semester',
          '2026-2027', ?, ?, ?, 'Passed',
          ?, ?
        )
      `, [
        insertedStudentDbId, s.studentId, s.name, s.department,
        s.nstp_section, midtermGrade, finalGrade,
        inst.id, inst.name
      ]);

      // Seed an attendance record
      await connection.execute(`
        INSERT INTO attendance_records (
          student_id, student_name, department, section,
          activity_name, scan_type, scanned_by, scanned_at, status, notes
        ) VALUES (
          ?, ?, ?, ?,
          'NSTP General Orientation 2026', 'QR', ?, NOW(), 'Present', 'Verified on-site'
        )
      `, [
        insertedStudentDbId, s.name, s.department, s.nstp_section, inst.id
      ]);
    }
    console.log(`Inserted ${enrolledStudents.length} active students with grades & attendance.`);

    // 7. Insert REPORTS (5 General, 6 ROTC, 3 CWTS, 1 LTS = 15 reports)
    const reportsList = [
      // 5 General Reports (department = 'All')
      {
        title: 'NSTP 1 Institutional Orientation & Attendance Masterlist',
        description: 'Consolidated attendance report and general student registration roster for the opening plenary orientation of AY 2026-2027.',
        department: 'All',
        status: 'Reviewed',
        dueDate: '2026-09-15',
        sub: { instId: 2, content: 'CWTS masterlist verified with 16 registered students present during orientation.' }
      },
      {
        title: 'Midterm Community Immersion Feasibility & Safety Assessment',
        description: 'Comprehensive risk assessment and safety protocols submission for upcoming fieldwork in partner barangays of Naic.',
        department: 'All',
        status: 'Submitted',
        dueDate: '2026-10-15',
        sub: { instId: 4, content: 'ROTC safety and medic personnel assigned for community drill zones.' }
      },
      {
        title: 'First Semester Disaster Risk Reduction (DRRM) Training Summary',
        description: 'Documentation and photo narrative of hands-on CPR, fire prevention, and emergency triage drills conducted with Naic MDRRMO.',
        department: 'All',
        status: 'Submitted',
        dueDate: '2026-11-05',
        sub: { instId: 3, content: 'LTS student volunteers completed basic life support triage orientation.' }
      },
      {
        title: 'Form A & Form B Official Master Completion Roll (CHED Endorsement)',
        description: 'Pre-final verification of enrollment numbers, serial IDs, and instructor grade books for CHED and Regional Office submission.',
        department: 'All',
        status: 'Draft',
        dueDate: '2026-12-10',
        sub: null
      },
      {
        title: 'NSTP Annual PASS-IN-REVIEW & Culminating Plenary Plan',
        description: 'Program flow, guest dignitaries coordination, and ceremony layout for the joint culmination exercises at the CvSU Naic Gymnasium.',
        department: 'All',
        status: 'Draft',
        dueDate: '2026-12-18',
        sub: null
      },

      // 6 ROTC Reports (department = 'ROTC')
      {
        title: 'ROTC Opening Muster, Formation & Uniform Compliance Audit',
        description: 'First battalion parade muster, headcount verification, and compliance check of cadets with official BDA uniform specifications.',
        department: 'ROTC',
        status: 'Reviewed',
        dueDate: '2026-09-20',
        sub: { instId: 4, content: '14 cadets mustered with 100% complete uniform accessories and identification cards.' }
      },
      {
        title: 'Marksmanship Fundamentals & Range Safety Compliance Report',
        description: 'Dry-fire rehearsal assessment, weapon handling protocol verification, and safety clearing audit conducted at Naic tactical grounds.',
        department: 'ROTC',
        status: 'Reviewed',
        dueDate: '2026-10-02',
        sub: { instId: 4, content: 'Cadets achieved satisfactory scores on mechanical training and firearm disassembly/assembly.' }
      },
      {
        title: 'ROTC Midterm Tactical March & Compass Orienteering Evaluation',
        description: 'Field navigation exercise across designated checkpoints in coastal Naic to test team communication and azimuth compass bearings.',
        department: 'ROTC',
        status: 'Submitted',
        dueDate: '2026-10-25',
        sub: { instId: 4, content: 'Squad navigation exercises executed smoothly without medical casualties.' }
      },
      {
        title: 'Civil-Military Operations (CMO) Coastal Defense Simulation',
        description: 'Joint simulation drill on shoreline defense, community evacuation assistance, and search-and-rescue communication protocols.',
        department: 'ROTC',
        status: 'Submitted',
        dueDate: '2026-11-12',
        sub: { instId: 4, content: 'Coastal reconnaissance report compiled with tactical defense logs.' }
      },
      {
        title: 'Annual Tactical Inspection (ATI) Rehearsal & Platoon Formations',
        description: 'Full dress rehearsal for the upcoming AFP Reserve Command inspection including manual of arms and military ceremonies.',
        department: 'ROTC',
        status: 'Draft',
        dueDate: '2026-11-28',
        sub: null
      },
      {
        title: 'ROTC Commandant Final Cadre Performance & Merit Ratings',
        description: 'Cadet officers and enlisted ranks leadership evaluation, demerit clearance, and final physical fitness test (PFT) scores.',
        department: 'ROTC',
        status: 'Draft',
        dueDate: '2026-12-15',
        sub: null
      },

      // 3 CWTS Reports (department = 'CWTS')
      {
        title: 'CWTS Barangay Community Profiling & Needs Assessment Survey',
        description: 'Comprehensive baseline survey conducted across partner barangays (Bucana Malaki, Halang, Balsahan) on solid waste and health.',
        department: 'CWTS',
        status: 'Reviewed',
        dueDate: '2026-09-28',
        sub: { instId: 2, content: 'Completed survey of 120 households; priority identified is coastal waste segregation and youth tutoring.' }
      },
      {
        title: 'Cavite Shoreline Coastal Cleanup & Waste Segregation Audit',
        description: 'Environmental sanitation drive along Naic coastline resulting in collection and categorization of recyclable and residual plastics.',
        department: 'CWTS',
        status: 'Submitted',
        dueDate: '2026-10-22',
        sub: { instId: 2, content: 'Retrieved 34 sacks of non-biodegradable waste in coordination with MENRO Naic.' }
      },
      {
        title: 'Community Livelihood Skills Transfer & Organic Composting Workshop',
        description: 'Hands-on livelihood seminar on household container gardening, food preservation, and organic enzyme composting for mothers.',
        department: 'CWTS',
        status: 'Draft',
        dueDate: '2026-11-20',
        sub: null
      },

      // 1 LTS Report (department = 'LTS')
      {
        title: 'Adopted Elementary School Reading Literacy Screening & Diagnostic Portfolio',
        description: 'Pre-test reading assessment of Grade 2 and 3 pupils in partner public schools using Phil-IRI diagnostic reading tools.',
        department: 'LTS',
        status: 'Submitted',
        dueDate: '2026-10-18',
        sub: { instId: 3, content: 'Screened 45 pupils across 2 public elementary schools; personalized remedial tutoring modules prepared.' }
      }
    ];

    for (const r of reportsList) {
      const [rRes] = await connection.execute(`
        INSERT INTO reports (
          title, description, department, status, due_date, created_by, batch_year, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, 1, '2026-2027 1st Semester', NOW(), NOW()
        )
      `, [r.title, r.description, r.department, r.status, r.dueDate]);

      const reportId = rRes.insertId;

      if (r.sub) {
        await connection.execute(`
          INSERT INTO report_submissions (
            report_id, instructor_id, content, submitted_at
          ) VALUES (
            ?, ?, ?, NOW()
          )
        `, [reportId, r.sub.instId, r.sub.content]);

        // Add a comment
        await connection.execute(`
          INSERT INTO report_comments (
            report_id, user_id, text, created_at
          ) VALUES (
            ?, 1, 'Received and validated by NSTP Admin. Documentation is complete.', NOW()
          )
        `, [reportId]);
      }
    }
    console.log(`Inserted ${reportsList.length} reports (5 General, 6 ROTC, 3 CWTS, 1 LTS).`);

    // 8. Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 9. Verify final counts
    const [archAfter] = await connection.execute('SELECT COUNT(*) as count FROM archived_years');
    const [stuAfter] = await connection.execute('SELECT COUNT(*) as count FROM students');
    const [enrAfter] = await connection.execute('SELECT COUNT(*) as count FROM enrollments');
    const [repAfter] = await connection.execute('SELECT COUNT(*) as count FROM reports');
    const [msgAfter] = await connection.execute('SELECT COUNT(*) as count FROM messages');
    const [usersAfter] = await connection.execute('SELECT id, email, name, role, department, avatar FROM users');

    console.log('=== VERIFICATION SUMMARY ===');
    console.log('Archived batches (UNTOUCHED):', archAfter[0].count, '(was', archBefore[0].count, ')');
    console.log('Active students in Student Management:', stuAfter[0].count, '(expected 38)');
    console.log('Pending students in Enrollments:', enrAfter[0].count, '(expected 7)');
    console.log('Reports count:', repAfter[0].count, '(expected 15)');
    console.log('Messages count in DB:', msgAfter[0].count, '(expected 0 - clean)');
    console.log('Official users in DB:', usersAfter);

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedData().catch(console.error);
