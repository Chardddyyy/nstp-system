const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'nstp_system'
};

async function fixMessagesSchema() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Fixing messages table schema...');
    
    // Check current column types
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM messages WHERE Field IN ('image_url', 'file_url', 'audio_url')
    `);
    
    console.log('Current columns:', columns.map(c => `${c.Field}: ${c.Type}`));
    
    // Alter columns to LONGTEXT if needed
    try {
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN image_url LONGTEXT`);
      console.log('✓ image_url updated to LONGTEXT');
    } catch (e) {
      console.log('✗ image_url update failed:', e.message);
    }
    
    try {
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN file_url LONGTEXT`);
      console.log('✓ file_url updated to LONGTEXT');
    } catch (e) {
      console.log('✗ file_url update failed:', e.message);
    }
    
    try {
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN audio_url LONGTEXT`);
      console.log('✓ audio_url updated to LONGTEXT');
    } catch (e) {
      console.log('✗ audio_url update failed:', e.message);
    }
    
    // Verify changes
    const [updatedColumns] = await connection.execute(`
      SHOW COLUMNS FROM messages WHERE Field IN ('image_url', 'file_url', 'audio_url')
    `);
    
    console.log('\nUpdated columns:', updatedColumns.map(c => `${c.Field}: ${c.Type}`));
    
    await connection.end();
    console.log('\n✅ Schema fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    process.exit(1);
  }
}

fixMessagesSchema();
