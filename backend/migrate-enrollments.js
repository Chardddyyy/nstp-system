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

    // Add program column to enrollments table
    try {
      await connection.execute(`
        ALTER TABLE enrollments 
        ADD COLUMN program VARCHAR(20) AFTER address
      `);
      console.log('Added program column to enrollments table');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('program column already exists in enrollments table');
      } else {
        throw error;
      }
    }

    // Add section column to enrollments table
    try {
      await connection.execute(`
        ALTER TABLE enrollments 
        ADD COLUMN section VARCHAR(20) AFTER program
      `);
      console.log('Added section column to enrollments table');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('section column already exists in enrollments table');
      } else {
        throw error;
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
