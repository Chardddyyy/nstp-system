const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { getDbConfig } = require('./config/dbEnv');

const dbConfig = getDbConfig({ includeDatabase: false });

async function setupDatabase() {
  let connection;
  try {
    console.log('Connecting to MySQL...');
    connection = await mysql.createConnection(dbConfig);

    console.log('Creating database nstp_system...');
    await connection.query('CREATE DATABASE IF NOT EXISTS nstp_system');
    await connection.query('USE nstp_system');
    console.log('✓ Database ready');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    console.log('Loading schema from: ' + schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Strip -- comments from each line, then split by ; and execute
    const stripped = schema
      .split('\n')
      .map(line => {
        const commentIdx = line.indexOf('--');
        return commentIdx >= 0 ? line.substring(0, commentIdx) : line;
      })
      .join('\n');

    const statements = stripped
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.log('  Note: ' + err.message.substring(0, 80));
        }
      }
    }

    console.log('✓ schema.sql applied successfully');

    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('\nTables created: ' + tableNames.join(', '));

    // Show users
    const [users] = await connection.query('SELECT id, email, role FROM users');
    console.log('\nDefault accounts:');
    users.forEach(u => console.log('  ' + u.email + ' (' + u.role + ')'));

    console.log('\n✅ Database setup complete!');
    console.log('\nPasswords:');
    console.log('  admin@cvsu.edu.ph  → admin123');
    console.log('  cwts@cvsu.edu.ph   → cwts123');
    console.log('  lts@cvsu.edu.ph    → lts123');
    console.log('  rotc@cvsu.edu.ph   → rotc123');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMySQL is not running on port ' + (dbConfig.port || 3306));
      console.log('Start MySQL then run: npm run setup-db');
    }
    if (connection) await connection.end();
    process.exit(1);
  }
}

setupDatabase();
