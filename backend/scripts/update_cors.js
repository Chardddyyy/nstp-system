require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateAllCors() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const corCwtsPath = path.join(__dirname, '../../public/id-photos/cor-cwts.jpg');
  const corRotcPath = path.join(__dirname, '../../public/id-photos/cor-rotc.jpg');
  const corLtsPath = path.join(__dirname, '../../public/id-photos/cor-lts.jpg');

  const corCwtsBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(corCwtsPath).toString('base64');
  const corRotcBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(corRotcPath).toString('base64');
  const corLtsBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(corLtsPath).toString('base64');

  function getCorForDept(dept) {
    const d = String(dept || '').toUpperCase();
    if (d.includes('ROTC')) return corRotcBase64;
    if (d.includes('LTS')) return corLtsBase64;
    return corCwtsBase64;
  }

  // 1. Update active students
  const [students] = await pool.execute('SELECT id, name, department FROM students ORDER BY id ASC');
  for (const s of students) {
    const cor = getCorForDept(s.department);
    await pool.execute(
      'UPDATE students SET registration_photo = ?, reg_form = ? WHERE id = ?',
      [cor, cor, s.id]
    );
  }
  console.log(`Updated authentic Certificate of Registration (COR) for all ${students.length} active students.`);

  // 2. Update pending enrollments
  const [enrollments] = await pool.execute('SELECT id, student_name, department FROM enrollments ORDER BY id ASC');
  for (const e of enrollments) {
    const cor = getCorForDept(e.department);
    await pool.execute(
      'UPDATE enrollments SET registration_photo = ?, reg_form = ? WHERE id = ?',
      [cor, cor, e.id]
    );
  }
  console.log(`Updated authentic Certificate of Registration (COR) for all ${enrollments.length} pending enrollment students.`);

  process.exit(0);
}

updateAllCors().catch(console.error);
