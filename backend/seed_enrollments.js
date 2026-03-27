const mysql = require('mysql2/promise');

async function seed() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: 'nstp_system'
  });

  const students = [
    { name: 'Juan Dela Cruz', email: 'juan.delacruz@email.com', dept: 'CWTS', id: '202300001', phone: '09123456789', birth: '2000-05-15', gender: 'Male', address: '123 Main St, Manila', course: 'BSIT', year: '1st Year', emergency: 'Maria Dela Cruz', emergencyPhone: '09987654321' },
    { name: 'Maria Santos', email: 'maria.santos@email.com', dept: 'LTS', id: '202300002', phone: '09123456790', birth: '2001-08-22', gender: 'Female', address: '456 Oak St, Quezon City', course: 'BSCS', year: '2nd Year', emergency: 'Pedro Santos', emergencyPhone: '09987654322' },
    { name: 'Pedro Reyes', email: 'pedro.reyes@email.com', dept: 'ROTC', id: '202300003', phone: '09123456791', birth: '1999-03-10', gender: 'Male', address: '789 Pine St, Makati', course: 'BSBA', year: '3rd Year', emergency: 'Ana Reyes', emergencyPhone: '09987654323' },
    { name: 'Ana Garcia', email: 'ana.garcia@email.com', dept: 'CWTS', id: '202300004', phone: '09123456792', birth: '2002-11-05', gender: 'Female', address: '321 Elm St, Pasig', course: 'BSHM', year: '1st Year', emergency: 'Jose Garcia', emergencyPhone: '09987654324' },
    { name: 'Jose Mendoza', email: 'jose.mendoza@email.com', dept: 'LTS', id: '202300005', phone: '09123456793', birth: '2000-07-18', gender: 'Male', address: '654 Maple St, Taguig', course: 'BEED', year: '2nd Year', emergency: 'Teresa Mendoza', emergencyPhone: '09987654325' },
    { name: 'Teresa Bautista', email: 'teresa.bautista@email.com', dept: 'ROTC', id: '202300006', phone: '09123456794', birth: '2001-01-25', gender: 'Female', address: '987 Cedar St, Mandaluyong', course: 'BSED', year: '4th Year', emergency: 'Ricardo Bautista', emergencyPhone: '09987654326' },
    { name: 'Ricardo Tan', email: 'ricardo.tan@email.com', dept: 'CWTS', id: '202300007', phone: '09123456795', birth: '1998-09-30', gender: 'Male', address: '147 Birch St, Pasay', course: 'BSFAS', year: '3rd Year', emergency: 'Elena Tan', emergencyPhone: '09987654327' },
    { name: 'Elena Lim', email: 'elena.lim@email.com', dept: 'LTS', id: '202300008', phone: '09123456796', birth: '2002-04-12', gender: 'Female', address: '258 Willow St, Caloocan', course: 'BSIT', year: '1st Year', emergency: 'Robert Lim', emergencyPhone: '09987654328' },
    { name: 'Robert Chan', email: 'robert.chan@email.com', dept: 'ROTC', id: '202300009', phone: '09123456797', birth: '1999-12-08', gender: 'Male', address: '369 Spruce St, Malabon', course: 'BSCS', year: '2nd Year', emergency: 'Jennifer Chan', emergencyPhone: '09987654329' },
    { name: 'Jennifer Cruz', email: 'jennifer.cruz@email.com', dept: 'CWTS', id: '202300010', phone: '09123456798', birth: '2001-06-20', gender: 'Female', address: '741 Aspen St, Navotas', course: 'BSBA', year: '3rd Year', emergency: 'Michael Cruz', emergencyPhone: '09987654330' }
  ];

  for (const s of students) {
    try {
      await pool.execute(
        'INSERT INTO enrollments (student_name, email, department, studentId, contactNumber, birthDate, gender, address, yearLevel, emergencyContact, emergencyNumber, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending")',
        [s.name, s.email, s.dept, s.id, s.phone, s.birth, s.gender, s.address, s.year, s.emergency, s.emergencyPhone]
      );
      console.log('Added:', s.name);
    } catch (err) {
      console.error('Error adding', s.name + ':', err.message);
    }
  }
  
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM enrollments WHERE status = "Pending"');
  console.log('\nTotal Pending Enrollments:', rows[0].count);
  process.exit(0);
}

seed().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
