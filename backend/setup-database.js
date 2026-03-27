const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3307, // Your MySQL port
  user: 'root',
  password: '' // XAMPP default
};

async function setupDatabase() {
  try {
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Create database (using query instead of execute for USE)
    console.log('Creating database nstp_system...');
    await connection.query('CREATE DATABASE IF NOT EXISTS nstp_system');
    console.log('Database created/verified.');
    
    // Use the database
    await connection.query('USE nstp_system');
    console.log('Using database nstp_system');
    
    // Create tables
    console.log('Creating tables...');
    
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'instructor') NOT NULL,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        avatar VARCHAR(50) DEFAULT 'default',
        profilePicture TEXT,
        phone VARCHAR(50),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ users table created');
    
    // Students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        studentId VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        department ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
        status ENUM('Active', 'Inactive', 'Completed') DEFAULT 'Active',
        semester VARCHAR(50),
        schoolYear VARCHAR(50),
        contactNumber VARCHAR(50),
        address TEXT,
        profilePicture TEXT,
        gender ENUM('Male', 'Female'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ students table created');
    
    // Add missing columns if table already exists (for backward compatibility)
    try {
      await connection.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS profilePicture TEXT`);
      await connection.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS gender ENUM('Male', 'Female')`);
      await connection.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(10)`);
      await connection.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS program VARCHAR(100)`);
      await connection.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS year VARCHAR(20)`);
      console.log('✓ Updated students table schema');
    } catch (alterError) {
      console.log('✓ Students schema up to date');
    }
    
    // Reports table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        department ENUM('ROTC', 'CWTS', 'LTS', 'NSTP Office'),
        status ENUM('Draft', 'Submitted', 'Reviewed') DEFAULT 'Draft',
        due_date DATE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ reports table created');
    
    // Report submissions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS report_submissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        report_id INT NOT NULL,
        instructor_id INT NOT NULL,
        content TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ report_submissions table created');
    
    // Conversations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        participant_1_id INT NOT NULL,
        participant_2_id INT NOT NULL,
        last_message TEXT,
        last_message_time TIMESTAMP,
        unread_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_2_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ conversations table created');
    
    // Messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id VARCHAR(255) NOT NULL,
        sender_id INT NOT NULL,
        text TEXT,
        type VARCHAR(50) DEFAULT 'text',
        image_url LONGTEXT,
        file_url LONGTEXT,
        file_name VARCHAR(255),
        audio_url LONGTEXT,
        duration VARCHAR(50),
        reactions JSON,
        edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ messages table created');
    
    // Calls table for voice/video calls
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS calls (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id VARCHAR(255) NOT NULL,
        caller_id INT NOT NULL,
        receiver_id INT NOT NULL,
        call_type ENUM('voice', 'video') DEFAULT 'voice',
        status ENUM('ringing', 'connected', 'ended', 'declined', 'missed') DEFAULT 'ringing',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        connected_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        duration INT DEFAULT 0,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ calls table created');
    
    // Update existing table schema if needed
    try {
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN type VARCHAR(50) DEFAULT 'text'`);
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN image_url LONGTEXT`);
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN file_url LONGTEXT`);
      await connection.execute(`ALTER TABLE messages MODIFY COLUMN audio_url LONGTEXT`);
      await connection.execute(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url MEDIUMTEXT`);
      await connection.execute(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)`);
      await connection.execute(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_url MEDIUMTEXT`);
      await connection.execute(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration VARCHAR(50)`);
      console.log('✓ Updated messages table schema');
    } catch (alterError) {
      console.log('✓ Schema up to date');
    }
    
    // Enrollments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        department ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
        studentId VARCHAR(50),
        contactNumber VARCHAR(50),
        birthDate DATE,
        gender ENUM('Male', 'Female'),
        address TEXT,
        program VARCHAR(20),
        section VARCHAR(20),
        yearLevel VARCHAR(20),
        emergencyContact VARCHAR(255),
        emergencyNumber VARCHAR(50),
        status ENUM('Pending', 'Approved', 'Declined') DEFAULT 'Pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INT,
        reviewed_at TIMESTAMP,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ enrollments table created');
    
    // Archived years table for batch management
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS archived_years (
        id INT PRIMARY KEY AUTO_INCREMENT,
        year INT NOT NULL,
        students INT DEFAULT 0,
        reports INT DEFAULT 0,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSON,
        UNIQUE KEY unique_year (year)
      )
    `);
    console.log('✓ archived_years table created');
    
    // Current batch tracking
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS current_batch (
        id INT PRIMARY KEY DEFAULT 1,
        year INT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ current_batch table created');
    
    // Insert default users
    console.log('Inserting default users...');
    const defaultUsers = [
      { id: 1, email: 'admin@cvsu.edu.ph', password: 'admin123', role: 'admin', name: 'Admin User', department: 'NSTP Office' },
      { id: 2, email: 'cwts@cvsu.edu.ph', password: 'cwts123', role: 'instructor', name: 'CWTS Instructor', department: 'CWTS' },
      { id: 3, email: 'lts@cvsu.edu.ph', password: 'lts123', role: 'instructor', name: 'LTS Instructor', department: 'LTS' },
      { id: 4, email: 'rotc@cvsu.edu.ph', password: 'rotc123', role: 'instructor', name: 'ROTC Instructor', department: 'ROTC' }
    ];
    
    for (const user of defaultUsers) {
      await connection.execute(
        `INSERT INTO users (id, email, password, role, name, department, avatar) 
         VALUES (?, ?, ?, ?, ?, ?, 'default')
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), department = VALUES(department)`,
        [user.id, user.email, user.password, user.role, user.name, user.department]
      );
    }
    console.log('✓ Default users inserted');
    
    console.log('\n✅ Database setup complete!');
    console.log('\nDefault login credentials:');
    console.log('  admin@cvsu.edu.ph / admin123 (Admin)');
    console.log('  cwts@cvsu.edu.ph / cwts123 (Instructor)');
    console.log('  lts@cvsu.edu.ph / lts123 (Instructor)');
    console.log('  rotc@cvsu.edu.ph / rotc123 (Instructor)');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure MySQL is running on MAMP/XAMPP');
      console.log('Check that port 8889 is correct for your MySQL server');
    }
    process.exit(1);
  }
}

setupDatabase();
