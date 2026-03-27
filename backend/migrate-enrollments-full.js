const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'nstp_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function migrateEnrollments() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connected to database: nstp_system');

    // Add all missing columns to enrollments table
    const columns = [
      { name: 'studentId', type: 'VARCHAR(50)' },
      { name: 'contactNumber', type: 'VARCHAR(50)' },
      { name: 'birthDate', type: 'DATE' },
      { name: 'gender', type: "ENUM('Male', 'Female')" },
      { name: 'address', type: 'TEXT' },
      { name: 'program', type: 'VARCHAR(20)' },
      { name: 'section', type: 'VARCHAR(20)' },
      { name: 'yearLevel', type: 'VARCHAR(20)' },
      { name: 'emergencyContact', type: 'VARCHAR(255)' },
      { name: 'emergencyNumber', type: 'VARCHAR(50)' }
    ];

    for (const col of columns) {
      try {
        await connection.execute(`
          ALTER TABLE enrollments 
          ADD COLUMN ${col.name} ${col.type}
        `);
        console.log(`Added ${col.name} column to enrollments table`);
      } catch (error) {
        if (error.message.includes('Duplicate column') || error.message.includes('already exists')) {
          console.log(`${col.name} column already exists in enrollments table`);
        } else {
          throw error;
        }
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

migrateEnrollments();
