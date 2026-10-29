const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

function toEnrollmentTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|[\s,.\-\/()#])([a-zñà-öø-ÿ])/gi, (match) => match.toUpperCase())
    .replace(/\b(ii|iii|iv|vi|vii|viii|ix|x)\b/gi, (roman) => roman.toUpperCase())
    .replace(/\b(jr|sr)\b/gi, (sfx) => sfx.charAt(0).toUpperCase() + sfx.slice(1).toLowerCase());
}

function normalizeStudent(st) {
  if (!st || typeof st !== 'object') return st;

  const lName = toEnrollmentTitleCase(st.lastName || st.last_name || '');
  const fName = toEnrollmentTitleCase(st.firstName || st.first_name || '');
  const mName = toEnrollmentTitleCase(st.middleName || st.middle_name || '');
  const sfx = (st.suffix || '').trim();

  let formattedName = '';
  if (st.name && typeof st.name === 'string') {
    formattedName = toEnrollmentTitleCase(st.name);
  } else if (lName && fName) {
    formattedName = `${lName}, ${fName}${mName ? ' ' + mName : ''}${sfx ? ' ' + sfx : ''}`.trim();
  }

  const street = toEnrollmentTitleCase(st.street || '');
  const municipality = toEnrollmentTitleCase(st.municipality || '');
  const province = toEnrollmentTitleCase(st.province || '');
  let address = toEnrollmentTitleCase(st.address || st.homeAddress || '');
  if (!address && (street || municipality || province)) {
    address = [street, municipality, province].filter(Boolean).join(', ');
  }

  return {
    ...st,
    name: formattedName || st.name,
    fullName: formattedName || st.fullName || st.name,
    student_name: formattedName || st.student_name || st.name,
    lastName: lName || st.lastName,
    firstName: fName || st.firstName,
    middleName: mName || st.middleName,
    suffix: sfx || st.suffix,
    program: String(st.program || st.course || '').toUpperCase(),
    course: String(st.course || st.program || '').toUpperCase(),
    department: String(st.department || st.nstpComponent || '').toUpperCase(),
    nstpComponent: String(st.nstpComponent || st.department || '').toUpperCase(),
    section: String(st.section || '').toUpperCase(),
    nstp_section: String(st.nstp_section || st.section || '').toUpperCase(),
    email: String(st.email || '').trim().toLowerCase(),
    street: street || st.street,
    municipality: municipality || st.municipality,
    province: province || st.province,
    address: address || st.address,
    emergencyContact: toEnrollmentTitleCase(st.emergencyContact || st.emergencyName || ''),
    emergencyName: toEnrollmentTitleCase(st.emergencyName || st.emergencyContact || ''),
    bloodType: String(st.bloodType || st.blood_type || '').toUpperCase(),
    gender: toEnrollmentTitleCase(st.gender || st.sex || ''),
    sex: toEnrollmentTitleCase(st.sex || st.gender || ''),
    civilStatus: toEnrollmentTitleCase(st.civilStatus || st.civil_status || ''),
    citizenship: toEnrollmentTitleCase(st.citizenship || ''),
    religion: toEnrollmentTitleCase(st.religion || ''),
    status: toEnrollmentTitleCase(st.status || 'Active'),
    registeredVoter: toEnrollmentTitleCase(st.registeredVoter || st.registered_voter || st.isVoter || '')
  };
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nstp_system',
    port: process.env.DB_PORT || 3306
  });

  console.log('🔄 Connected to database. Normalizing student and archive text casing...');

  // 1. Normalize active students
  const [students] = await conn.execute('SELECT * FROM students');
  console.log(`Found ${students.length} students in active roster. Updating...`);

  let studentUpdates = 0;
  for (const s of students) {
    const norm = normalizeStudent(s);
    await conn.execute(
      `UPDATE students SET
        name = ?,
        firstName = ?,
        lastName = ?,
        middleName = ?,
        program = ?,
        department = ?,
        section = ?,
        email = ?,
        address = ?,
        street = ?,
        municipality = ?,
        province = ?,
        emergencyContact = ?,
        bloodType = ?,
        gender = ?,
        civilStatus = ?
      WHERE id = ?`,
      [
        norm.name,
        norm.firstName,
        norm.lastName,
        norm.middleName,
        norm.program,
        norm.department,
        norm.section,
        norm.email,
        norm.address,
        norm.street,
        norm.municipality,
        norm.province,
        norm.emergencyContact,
        norm.bloodType,
        norm.gender,
        norm.civilStatus,
        s.id
      ]
    );
    studentUpdates++;
  }
  console.log(`✅ Successfully updated casing for ${studentUpdates} enrolled students.`);

  // 2. Normalize archived_years data
  const [archives] = await conn.execute('SELECT id, year, data FROM archived_years');
  console.log(`Found ${archives.length} archived year batches. Updating studentData JSON...`);

  let archiveUpdates = 0;
  for (const a of archives) {
    if (!a.data) continue;
    let parsed;
    try {
      parsed = typeof a.data === 'string' ? JSON.parse(a.data) : a.data;
    } catch {
      continue;
    }

    let modified = false;
    if (parsed && Array.isArray(parsed.studentData)) {
      parsed.studentData = parsed.studentData.map(st => normalizeStudent(st));
      modified = true;
    }
    if (parsed && Array.isArray(parsed.students)) {
      parsed.students = parsed.students.map(st => normalizeStudent(st));
      modified = true;
    }

    if (modified) {
      await conn.execute('UPDATE archived_years SET data = ? WHERE id = ?', [
        JSON.stringify(parsed),
        a.id
      ]);
      archiveUpdates++;
    }
  }
  console.log(`✅ Successfully updated casing for ${archiveUpdates} archived batches.`);

  // 3. Normalize enrollments table if any
  const [enrollments] = await conn.execute('SELECT id, student_name, firstName, lastName, middleName, street, municipality, province, emergencyContact, email, program, department, section FROM enrollments');
  let enrollUpdates = 0;
  for (const e of enrollments) {
    const lName = toEnrollmentTitleCase(e.lastName);
    const fName = toEnrollmentTitleCase(e.firstName);
    const mName = toEnrollmentTitleCase(e.middleName);
    const sName = toEnrollmentTitleCase(e.student_name);
    const street = toEnrollmentTitleCase(e.street);
    const mun = toEnrollmentTitleCase(e.municipality);
    const prov = toEnrollmentTitleCase(e.province);
    const emerg = toEnrollmentTitleCase(e.emergencyContact);
    const email = String(e.email || '').trim().toLowerCase();
    const prog = String(e.program || '').toUpperCase();
    const dept = String(e.department || '').toUpperCase();
    const sec = String(e.section || '').toUpperCase();

    await conn.execute(
      `UPDATE enrollments SET
        student_name = ?,
        firstName = ?,
        lastName = ?,
        middleName = ?,
        street = ?,
        municipality = ?,
        province = ?,
        emergencyContact = ?,
        email = ?,
        program = ?,
        department = ?,
        section = ?
      WHERE id = ?`,
      [sName, fName, lName, mName, street, mun, prov, emerg, email, prog, dept, sec, e.id]
    );
    enrollUpdates++;
  }
  console.log(`✅ Successfully updated casing for ${enrollUpdates} pending enrollment records.`);

  await conn.end();
  console.log('🎉 Casing normalization completed successfully.');
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
