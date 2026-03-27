const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'nstp_system'
};

async function setupGroupChat() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Setting up group chat support...');
    
    // Add is_group column to conversations table
    try {
      await connection.execute(`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE`);
      console.log('✓ Added is_group column to conversations');
    } catch (e) {
      console.log('✓ is_group column already exists or error:', e.message);
    }
    
    // Add group_name column to conversations table
    try {
      await connection.execute(`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_name VARCHAR(255)`);
      console.log('✓ Added group_name column to conversations');
    } catch (e) {
      console.log('✓ group_name column already exists or error:', e.message);
    }
    
    // Create conversation_participants table for many-to-many relationship
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS conversation_participants (
          id INT PRIMARY KEY AUTO_INCREMENT,
          conversation_id VARCHAR(255) NOT NULL,
          user_id INT NOT NULL,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_participant (conversation_id, user_id)
        )
      `);
      console.log('✓ Created conversation_participants table');
    } catch (e) {
      console.log('✗ Error creating conversation_participants table:', e.message);
    }
    
    // Create default group chat "All Instructors" if it doesn't exist
    const groupId = 'group-all-instructors';
    const [existingGroup] = await connection.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [groupId]
    );
    
    if (existingGroup.length === 0) {
      // Create the group conversation
      await connection.execute(
        `INSERT INTO conversations (id, participant_1_id, participant_2_id, is_group, group_name, last_message, last_message_time) 
         VALUES (?, 1, 1, TRUE, 'All Instructors', 'Welcome to the group chat!', NOW())`,
        [groupId]
      );
      console.log('✓ Created All Instructors group chat');
      
      // Add all instructors and admin as participants
      const [users] = await connection.execute('SELECT id FROM users WHERE role IN ("admin", "instructor")');
      
      for (const user of users) {
        await connection.execute(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
          [groupId, user.id]
        );
      }
      console.log(`✓ Added ${users.length} participants to group chat`);
    } else {
      console.log('✓ All Instructors group chat already exists');
    }
    
    await connection.end();
    console.log('\n✅ Group chat setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Group chat setup failed:', error.message);
    process.exit(1);
  }
}

setupGroupChat();
