const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'nstp_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function migrateTables() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database');

    // ===== STUDENTS TABLE =====
    console.log('\n--- Checking students table ---');
    const [sectionCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'section'
    `);

    if (sectionCheck.length === 0) {
      console.log('Adding section column...');
      await connection.execute(`ALTER TABLE students ADD COLUMN section VARCHAR(10)`);
      console.log('✓ section column added');
    } else {
      console.log('✓ section column already exists');
    }

    // Check if program column exists
    const [programCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'program'
    `);

    if (programCheck.length === 0) {
      console.log('Adding program column...');
      await connection.execute(`ALTER TABLE students ADD COLUMN program VARCHAR(100)`);
      console.log('✓ program column added');
    } else {
      console.log('✓ program column already exists');
    }

    // Check if year column exists
    const [yearCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'year'
    `);

    if (yearCheck.length === 0) {
      console.log('Adding year column...');
      await connection.execute(`ALTER TABLE students ADD COLUMN year VARCHAR(20)`);
      console.log('✓ year column added');
    } else {
      console.log('✓ year column already exists');
    }

    // Check if status column exists (we might need to drop it)
    const [statusCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'status'
    `);

    if (statusCheck.length > 0) {
      console.log('Status column exists - keeping for backward compatibility');
    }

    // Check if course column exists (we might need to migrate data from it)
    const [courseCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'course'
    `);

    if (courseCheck.length > 0) {
      console.log('Course column exists - migrating data to program column...');
      await connection.execute(`
        UPDATE students 
        SET program = COALESCE(program, course) 
        WHERE program IS NULL AND course IS NOT NULL
      `);
      console.log('✓ Migrated course data to program column');
    }

    console.log('\n--- Checking enrollments table ---');

    // Check if enrollments table exists and has required columns
    const [enrollSectionCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'section'
    `);

    if (enrollSectionCheck.length === 0) {
      console.log('Adding section column to enrollments...');
      await connection.execute(`ALTER TABLE enrollments ADD COLUMN section VARCHAR(10)`);
      console.log('✓ section column added to enrollments');
    } else {
      console.log('✓ section column exists in enrollments');
    }

    const [enrollProgramCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'program'
    `);

    if (enrollProgramCheck.length === 0) {
      console.log('Adding program column to enrollments...');
      await connection.execute(`ALTER TABLE enrollments ADD COLUMN program VARCHAR(100)`);
      console.log('✓ program column added to enrollments');
    } else {
      console.log('✓ program column exists in enrollments');
    }

    // Check if course column exists in enrollments (migrate to program)
    const [enrollCourseCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'course'
    `);

    if (enrollCourseCheck.length > 0) {
      console.log('Course column exists in enrollments - migrating to program...');
      await connection.execute(`
        UPDATE enrollments 
        SET program = COALESCE(program, course) 
        WHERE program IS NULL AND course IS NOT NULL
      `);
      console.log('✓ Migrated course data to program column in enrollments');
    }

    console.log('\n✓ All migrations completed successfully!');
    connection.release();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateTables();
