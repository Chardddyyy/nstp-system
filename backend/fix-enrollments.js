const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nstp_system',
  port: 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function fixEnrollmentsTable() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connected to database: nstp_system');

    // Check current columns
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'enrollments' AND TABLE_SCHEMA = 'nstp_system'"
    );
    console.log('Current columns:', columns.map(c => c.COLUMN_NAME));

    // Add missing columns
    const missingColumns = [
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

    const existingColumnNames = columns.map(c => c.COLUMN_NAME);

    for (const col of missingColumns) {
      if (!existingColumnNames.includes(col.name)) {
        try {
          await connection.execute(`ALTER TABLE enrollments ADD COLUMN ${col.name} ${col.type}`);
          console.log(`✓ Added ${col.name} column`);
        } catch (error) {
          console.error(`✗ Error adding ${col.name}:`, error.message);
        }
      } else {
        console.log(`✓ ${col.name} already exists`);
      }
    }

    // Verify final columns
    const [finalColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'enrollments' AND TABLE_SCHEMA = 'nstp_system'"
    );
    console.log('\nFinal columns:', finalColumns.map(c => c.COLUMN_NAME).join(', '));

    console.log('\n✅ Database fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

fixEnrollmentsTable();
