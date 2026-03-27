// Database migration script to fix reports table
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nstp_system',
  port: 3307
};

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Check current column type
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM reports WHERE Field = 'department'"
    );
    console.log('Current department column:', columns[0]);

    // Alter the column to VARCHAR
    await connection.execute(
      "ALTER TABLE reports MODIFY COLUMN department VARCHAR(100)"
    );
    console.log('✅ Successfully updated department column to VARCHAR(100)');

    // Verify the change
    const [updated] = await connection.execute(
      "SHOW COLUMNS FROM reports WHERE Field = 'department'"
    );
    console.log('Updated department column:', updated[0]);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
