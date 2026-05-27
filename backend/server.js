require('dotenv').config({ path: require('path').join(__dirname, '.env') });
var express = require('express');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var pool = require('./config/database');
var { getDbConfig } = require('./config/dbEnv');

var app = express();
var PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  var authHeader = req.headers['authorization'];
  var token = null;
  if (authHeader) {
    var parts = authHeader.split(' ');
    if (parts.length === 2) {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, 'your-secret-key', function(err, user) {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

async function ensureMessageRestoreColumns() {
  var alters = [
    'ALTER TABLE messages ADD COLUMN deleted_snapshot JSON NULL',
    'ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP NULL',
    'ALTER TABLE messages ADD COLUMN deleted_for JSON NULL',
    'ALTER TABLE messages ADD COLUMN deleted_for_everyone BOOLEAN DEFAULT FALSE'
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* exists */ }
  }
}

async function ensureWebRTCColumns() {
  var alters = [
    'ALTER TABLE calls ADD COLUMN offer_sdp MEDIUMTEXT NULL',
    'ALTER TABLE calls ADD COLUMN answer_sdp MEDIUMTEXT NULL',
    'ALTER TABLE calls ADD COLUMN caller_ice JSON NULL',
    'ALTER TABLE calls ADD COLUMN receiver_ice JSON NULL'
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* exists */ }
  }
}

async function getCallForUser(callId, userId) {
  const [calls] = await pool.execute(
    'SELECT * FROM calls WHERE id = ? AND (caller_id = ? OR receiver_id = ?)',
    [callId, userId, userId]
  );
  return calls.length > 0 ? calls[0] : null;
}

async function appendCallIce(callId, column, candidate) {
  const [rows] = await pool.execute(
    'SELECT caller_ice, receiver_ice FROM calls WHERE id = ?',
    [callId]
  );
  if (rows.length === 0) return;
  var list = [];
  var raw = rows[0][column];
  if (raw) {
    try {
      list = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }
  }
  list.push(candidate);
  await pool.execute(
    'UPDATE calls SET ' + column + ' = ? WHERE id = ?',
    [JSON.stringify(list), callId]
  );
}

async function ensureBatchTables() {
  try {
    await pool.execute(`
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
  } catch (e) { /* exists */ }
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS current_batch (
        id INT PRIMARY KEY DEFAULT 1,
        year INT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (e) { /* exists */ }
}

async function ensureConversationSchema() {
  var alters = [
    'ALTER TABLE conversations MODIFY COLUMN participant_1_id INT NULL',
    'ALTER TABLE conversations MODIFY COLUMN participant_2_id INT NULL',
    'ALTER TABLE conversations ADD COLUMN is_group BOOLEAN DEFAULT FALSE',
    'ALTER TABLE conversations ADD COLUMN group_name VARCHAR(255) NULL',
    'ALTER TABLE conversations ADD COLUMN created_by INT NULL'
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* exists */ }
  }
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (e) { /* ignore */ }
}

function parseDeletedFor(deletedFor) {
  if (!deletedFor) return [];
  try {
    var parsed = typeof deletedFor === 'string' ? JSON.parse(deletedFor) : deletedFor;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function userCanAccessConversation(conversationId, userId) {
  const [conversationCheck] = await pool.execute(
    'SELECT is_group FROM conversations WHERE id = ?',
    [conversationId]
  );
  if (conversationCheck.length === 0) return false;

  if (conversationCheck[0].is_group) {
    const [participants] = await pool.execute(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );
    return participants.length > 0;
  }

  const [conversations] = await pool.execute(
    'SELECT 1 FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
    [conversationId, userId, userId]
  );
  return conversations.length > 0;
}

// ===== AUTH ROUTES =====

// Login
app.post('/api/auth/login', async function(req, res) {
  try {
    var email = req.body.email;
    var password = req.body.password;
    
    console.log('Received login request:', { email: email, passwordLength: password ? password.length : 0, body: req.body });
    
    var result = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    var users = result[0];

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    var user = users[0];
    
    var providedPassword = String(password).trim();
    var storedPassword = String(user.password).trim();
    
    console.log('Login attempt:', { 
      email: email, 
      providedPassword: providedPassword, 
      storedPassword: storedPassword,
      match: providedPassword === storedPassword
    });
    
    if (providedPassword !== storedPassword) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        profilePicture: user.profilePicture,
        phone: user.phone,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== USER ROUTES =====

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role, department, avatar, profilePicture FROM users'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role, department, avatar, profilePicture, phone, bio FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only allow users to update their own profile (or admin can update anyone)
    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, email, phone, bio, avatar, profilePicture } = req.body;
    
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, phone = ?, bio = ?, avatar = ?, profilePicture = ? WHERE id = ?',
      [name, email, phone, bio, avatar, profilePicture, id]
    );

    const [updatedUsers] = await pool.execute(
      'SELECT id, email, name, role, department, avatar, profilePicture, phone, bio FROM users WHERE id = ?',
      [id]
    );

    res.json(updatedUsers[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password - stores as plain text (no hashing)
app.put('/api/users/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Store password as plain text (no hashing)
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== STUDENT ROUTES =====

// Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT * FROM students ORDER BY created_at DESC');
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add student
app.post('/api/students', authenticateToken, async (req, res) => {
  try {
    const { studentId, name, email, department, section, semester, schoolYear, program, year, contactNumber, address, gender, birthDate, age, civilStatus, bloodType, height, weight, facebookAccount, emergencyName, emergencyNumber, birthMonth, birthDay, birthYear } = req.body;
    
    // Validate required fields
    if (!studentId || !name || !department) {
      return res.status(400).json({ message: 'Missing required fields: studentId, name, department' });
    }
    
    // Build birthDate from separate fields if not provided directly
    let safeBirthDate = birthDate;
    if (!safeBirthDate && birthMonth && birthDay && birthYear) {
      safeBirthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
    }
    const safeEmail = email !== undefined ? email : null;
    const safeSection = section !== undefined ? section : null;
    const safeSemester = semester !== undefined ? semester : null;
    const safeSchoolYear = schoolYear !== undefined ? schoolYear : null;
    const safeProgram = program !== undefined ? program : null;
    const safeYear = year !== undefined ? year : null;
    const safeContactNumber = contactNumber !== undefined ? contactNumber : null;
    const safeAddress = address !== undefined ? address : null;
    const safeGender = gender !== undefined ? gender : null;
    // safeBirthDate already declared above
    const safeAge = age !== undefined ? age : null;
    const safeCivilStatus = civilStatus !== undefined ? civilStatus : null;
    const safeBloodType = bloodType !== undefined ? bloodType : null;
    const safeHeight = height !== undefined ? height : null;
    const safeWeight = weight !== undefined ? weight : null;
    const safeFacebookAccount = facebookAccount !== undefined ? facebookAccount : null;
    const safeEmergencyName = emergencyName !== undefined ? emergencyName : null;
    const safeEmergencyNumber = emergencyNumber !== undefined ? emergencyNumber : null;
    
    const [result] = await pool.execute(
      'INSERT INTO students (studentId, name, email, department, section, semester, schoolYear, program, year, contactNumber, address, gender, birthDate, age, civilStatus, bloodType, height, weight, facebookAccount, emergencyContact, emergencyNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [studentId, name, safeEmail, department, safeSection, safeSemester, safeSchoolYear, safeProgram, safeYear, safeContactNumber, safeAddress, safeGender, safeBirthDate, safeAge, safeCivilStatus, safeBloodType, safeHeight, safeWeight, safeFacebookAccount, safeEmergencyName, safeEmergencyNumber]
    );

    const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json(students[0]);
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Server error', error: error.message, sql: error.sql });
  }
});

// Update student
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, name, email, department, section, semester, schoolYear, program, year, contactNumber, address, gender, birthDate, age, civilStatus, bloodType, height, weight, facebookAccount, emergencyName, emergencyNumber } = req.body;
    
    // Convert undefined to null for optional fields
    const safeEmail = email !== undefined ? email : null;
    const safeSection = section !== undefined ? section : null;
    const safeSemester = semester !== undefined ? semester : null;
    const safeSchoolYear = schoolYear !== undefined ? schoolYear : null;
    const safeProgram = program !== undefined ? program : null;
    const safeYear = year !== undefined ? year : null;
    const safeContactNumber = contactNumber !== undefined ? contactNumber : null;
    const safeAddress = address !== undefined ? address : null;
    const safeGender = gender !== undefined ? gender : null;
    const safeBirthDate = birthDate !== undefined ? birthDate : null;
    const safeAge = age !== undefined ? age : null;
    const safeCivilStatus = civilStatus !== undefined ? civilStatus : null;
    const safeBloodType = bloodType !== undefined ? bloodType : null;
    const safeHeight = height !== undefined ? height : null;
    const safeWeight = weight !== undefined ? weight : null;
    const safeFacebookAccount = facebookAccount !== undefined ? facebookAccount : null;
    const safeEmergencyName = emergencyName !== undefined ? emergencyName : null;
    const safeEmergencyNumber = emergencyNumber !== undefined ? emergencyNumber : null;
    
    await pool.execute(
      'UPDATE students SET studentId = ?, name = ?, email = ?, department = ?, section = ?, semester = ?, schoolYear = ?, program = ?, year = ?, contactNumber = ?, address = ?, gender = ?, birthDate = ?, age = ?, civilStatus = ?, bloodType = ?, height = ?, weight = ?, facebookAccount = ?, emergencyContact = ?, emergencyNumber = ? WHERE id = ?',
      [studentId, name, safeEmail, department, safeSection, safeSemester, safeSchoolYear, safeProgram, safeYear, safeContactNumber, safeAddress, safeGender, safeBirthDate, safeAge, safeCivilStatus, safeBloodType, safeHeight, safeWeight, safeFacebookAccount, safeEmergencyName, safeEmergencyNumber, id]
    );

    const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [id]);
    res.json(students[0]);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete student
app.delete('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== REPORT ROUTES =====

// Get all reports
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const [reports] = await pool.execute(`
      SELECT r.*, u.name as created_by_name 
      FROM reports r 
      LEFT JOIN users u ON r.created_by = u.id 
      ORDER BY r.created_at DESC
    `);
    
    // Get submissions for each report
    for (let report of reports) {
      const [submissions] = await pool.execute(`
        SELECT rs.*, u.name as instructor_name, u.department 
        FROM report_submissions rs 
        JOIN users u ON rs.instructor_id = u.id 
        WHERE rs.report_id = ?
      `, [report.id]);
      report.submissions = submissions;
    }
    
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add report
app.post('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { title, description, department, due_date } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Validate date format if provided
    let safeDueDate = null;
    if (due_date && due_date !== '') {
      // Check if date is valid (YYYY-MM-DD format)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(due_date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      // Validate the date is reasonable (between 2020 and 3000)
      const year = parseInt(due_date.split('-')[0]);
      if (year < 2020 || year > 3000) {
        return res.status(400).json({ message: 'Invalid year. Year must be between 2020 and 3000' });
      }
      safeDueDate = due_date;
    }
    
    // Convert undefined to null for optional fields
    const safeDescription = description !== undefined ? description : null;
    
    console.log('Adding report:', { title, department, due_date: safeDueDate, userId: req.user.id });
    
    const [result] = await pool.execute(
      'INSERT INTO reports (title, description, department, due_date, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, safeDescription, department, safeDueDate, req.user.id]
    );

    const [reports] = await pool.execute('SELECT * FROM reports WHERE id = ?', [result.insertId]);
    reports[0].submissions = [];
    res.status(201).json(reports[0]);
  } catch (error) {
    console.error('Add report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update report
app.put('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, department, due_date, status } = req.body;
    
    await pool.execute(
      'UPDATE reports SET title = ?, description = ?, department = ?, due_date = ?, status = ? WHERE id = ?',
      [title, description, department, due_date, status, id]
    );

    const [reports] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);
    res.json(reports[0]);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit report
app.post('/api/reports/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Check if already submitted
    const [existing] = await pool.execute(
      'SELECT * FROM report_submissions WHERE report_id = ? AND instructor_id = ?',
      [id, req.user.id]
    );
    
    if (existing.length > 0) {
      // Update existing submission
      await pool.execute(
        'UPDATE report_submissions SET content = ? WHERE report_id = ? AND instructor_id = ?',
        [content, id, req.user.id]
      );
    } else {
      // Create new submission
      await pool.execute(
        'INSERT INTO report_submissions (report_id, instructor_id, content) VALUES (?, ?, ?)',
        [id, req.user.id, content]
      );
    }
    
    // Update report status
    await pool.execute(
      'UPDATE reports SET status = ? WHERE id = ?',
      ['Submitted', id]
    );

    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete report
app.delete('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM reports WHERE id = ?', [id]);
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== CONVERSATION & MESSAGE ROUTES =====

// Get all conversations for current user
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    // Get one-on-one conversations
    const [directConversations] = await pool.execute(`
      SELECT c.*, 
        u1.name as participant_1_name, u1.profilePicture as participant_1_picture,
        u2.name as participant_2_name, u2.profilePicture as participant_2_picture,
        FALSE as is_group
      FROM conversations c
      JOIN users u1 ON c.participant_1_id = u1.id
      JOIN users u2 ON c.participant_2_id = u2.id
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?) AND (c.is_group = FALSE OR c.is_group IS NULL)
      ORDER BY c.last_message_time DESC
    `, [req.user.id, req.user.id]);

    // Get group conversations where user is a participant
    const [groupConversations] = await pool.execute(`
      SELECT c.*, 
        NULL as participant_1_name, NULL as participant_1_picture,
        NULL as participant_2_name, NULL as participant_2_picture,
        c.is_group, c.group_name
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ? AND c.is_group = TRUE
      ORDER BY c.last_message_time DESC
    `, [req.user.id]);

    // Format direct conversations
    const formattedDirectConversations = directConversations.map(c => {
      const isUserParticipant1 = c.participant_1_id === req.user.id;
      const otherParticipantName = isUserParticipant1 ? c.participant_2_name : c.participant_1_name;
      return {
        ...c,
        with: otherParticipantName,
        participants: [c.participant_1_id, c.participant_2_id],
        isGroup: false
      };
    });

    // Format group conversations
    const formattedGroupConversations = await Promise.all(groupConversations.map(async c => {
      // Get all participants for this group
      const [participants] = await pool.execute(`
        SELECT u.id, u.name, u.profilePicture, u.role
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ?
      `, [c.id]);
      
      return {
        ...c,
        with: c.group_name,
        isGroup: true,
        groupName: c.group_name,
        participants: participants.map(p => p.id),
        participantDetails: participants
      };
    }));

    // Combine and sort by last message time
    const allConversations = [...formattedDirectConversations, ...formattedGroupConversations]
      .sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0));

    res.json(allConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or get conversation
app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const { withUserId } = req.body;
    
    // Create conversation ID from both user IDs (sorted)
    const ids = [req.user.id, withUserId].sort();
    const conversationId = ids.join('-');
    
    // Check if conversation exists
    const [existing] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    );
    
    if (existing.length > 0) {
      // Get other participant info for existing conversation
      const [otherUsers] = await pool.execute(
        'SELECT id, name FROM users WHERE id = ?',
        [withUserId]
      );
      const otherParticipantName = otherUsers[0]?.name || 'Unknown';
      
      return res.json({
        ...existing[0],
        with: otherParticipantName,
        participants: [existing[0].participant_1_id, existing[0].participant_2_id]
      });
    }
    
    // Create new conversation
    await pool.execute(
      'INSERT INTO conversations (id, participant_1_id, participant_2_id) VALUES (?, ?, ?)',
      [conversationId, ids[0], ids[1]]
    );
    
    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    );
    
    // Get other participant info
    const [otherUsers] = await pool.execute(
      'SELECT id, name FROM users WHERE id = ?',
      [withUserId]
    );
    const otherParticipantName = otherUsers[0]?.name || 'Unknown';
    
    const newConversation = conversations[0];
    
    res.status(201).json({
      ...newConversation,
      with: otherParticipantName,
      participants: [newConversation.participant_1_id, newConversation.participant_2_id]
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group conversation
app.post('/api/conversations/group', authenticateToken, async (req, res) => {
  try {
    const { name, participants } = req.body;
    
    if (!name || !participants || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({ message: 'Group name and at least 2 participants required' });
    }
    
    // Generate unique group ID
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create group conversation
    await pool.execute(
      'INSERT INTO conversations (id, is_group, group_name, created_by) VALUES (?, TRUE, ?, ?)',
      [groupId, name, req.user.id]
    );
    
    // Add all participants
    for (const participantId of participants) {
      await pool.execute(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
        [groupId, participantId]
      );
    }
    
    // Return created conversation
    res.status(201).json({
      id: groupId,
      isGroup: true,
      groupName: name,
      name: name,
      participants: participants,
      created_by: req.user.id
    });
  } catch (error) {
    console.error('Create group conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Support both integer IDs and string IDs (like "1-2" or "group-all-instructors")
    const conversationId = id;
    
    // Check if this is a group conversation
    const [conversationCheck] = await pool.execute(
      'SELECT is_group FROM conversations WHERE id = ?',
      [conversationId]
    );
    
    let isAuthorized = false;
    
    if (conversationCheck.length > 0 && conversationCheck[0].is_group) {
      // For group chats, check if user is a participant
      const [participants] = await pool.execute(
        'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [conversationId, req.user.id]
      );
      isAuthorized = participants.length > 0;
    } else {
      // For direct chats, check if user is participant_1 or participant_2
      const [conversations] = await pool.execute(
        'SELECT * FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
        [conversationId, req.user.id, req.user.id]
      );
      isAuthorized = conversations.length > 0;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }
    
    const [messages] = await pool.execute(`
      SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [conversationId]);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Edit message
app.put('/api/conversations/:conversationId/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { text } = req.body;
    
    // Verify user is part of this conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
      [conversationId, req.user.id, req.user.id]
    );
    
    if (conversations.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Verify user owns this message
    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE id = ? AND conversation_id = ?',
      [messageId, conversationId]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (messages[0].sender_id !== req.user.id) {
      return res.status(403).json({ message: 'Can only edit your own messages' });
    }
    
    // Don't allow editing of voice/file/image messages
    if (messages[0].type && messages[0].type !== 'text') {
      return res.status(400).json({ message: 'Cannot edit this type of message' });
    }
    
    // Update message
    await pool.execute(
      'UPDATE messages SET text = ?, edited = 1 WHERE id = ?',
      [text, messageId]
    );
    
    // Get updated message
    const [updated] = await pool.execute(`
      SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageId]);
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add/Remove reaction
app.post('/api/conversations/:conversationId/messages/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    
    // Verify user is part of this conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
      [conversationId, userId, userId]
    );
    
    if (conversations.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Get current reactions
    const [messages] = await pool.execute(
      'SELECT reactions FROM messages WHERE id = ? AND conversation_id = ?',
      [messageId, conversationId]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Parse reactions or create new
    let reactions = {};
    if (messages[0].reactions) {
      try {
        reactions = JSON.parse(messages[0].reactions);
      } catch (e) {
        reactions = {};
      }
    }
    
    // Toggle reaction
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }
    
    const userIndex = reactions[emoji].indexOf(userId);
    if (userIndex === -1) {
      // Add reaction
      reactions[emoji].push(userId);
    } else {
      // Remove reaction
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }
    
    // Save reactions
    await pool.execute(
      'UPDATE messages SET reactions = ? WHERE id = ?',
      [JSON.stringify(reactions), messageId]
    );
    
    res.json({ reactions });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message
app.post('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, type, image_url, file_url, file_name, audio_url, duration } = req.body;
    
    // Check if this is a group conversation
    const [conversationCheck] = await pool.execute(
      'SELECT is_group FROM conversations WHERE id = ?',
      [id]
    );
    
    let isAuthorized = false;
    
    if (conversationCheck.length > 0 && conversationCheck[0].is_group) {
      // For group chats, check if user is a participant
      const [participants] = await pool.execute(
        'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [id, req.user.id]
      );
      isAuthorized = participants.length > 0;
    } else {
      // For direct chats, check if user is participant_1 or participant_2
      const [conversations] = await pool.execute(
        'SELECT * FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
        [id, req.user.id, req.user.id]
      );
      isAuthorized = conversations.length > 0;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Convert undefined to null for optional fields
    const safeType = type || 'text';
    const safeText = text !== undefined ? text : null;
    const safeImageUrl = image_url !== undefined ? image_url : null;
    const safeFileUrl = file_url !== undefined ? file_url : null;
    const safeFileName = file_name !== undefined ? file_name : null;
    const safeAudioUrl = audio_url !== undefined ? audio_url : null;
    const safeDuration = duration !== undefined ? duration : null;
    
    // Insert message with all possible fields
    const [result] = await pool.execute(
      `INSERT INTO messages (conversation_id, sender_id, text, type, image_url, file_url, file_name, audio_url, duration) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, safeText, safeType, safeImageUrl, safeFileUrl, safeFileName, safeAudioUrl, safeDuration]
    );
    
    // Update conversation last message
    const lastMessagePreview = safeText || 
      (safeType === 'image' ? '📷 Image' : 
       safeType === 'file' ? `📎 ${safeFileName || 'File'}` : 
       safeType === 'voice' ? '🎤 Voice message' : 'Message');
    
    await pool.execute(
      'UPDATE conversations SET last_message = ?, last_message_time = NOW() WHERE id = ?',
      [lastMessagePreview, id]
    );
    
    const [messages] = await pool.execute(`
      SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);

    res.status(201).json(messages[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete message (for me / for everyone)
app.delete('/api/conversations/:conversationId/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { forEveryone } = req.query;
    const userId = req.user.id;
    
    // Check if this is a group conversation
    const [conversationCheck] = await pool.execute(
      'SELECT is_group FROM conversations WHERE id = ?',
      [conversationId]
    );
    
    let isAuthorized = false;
    
    if (conversationCheck.length > 0 && conversationCheck[0].is_group) {
      // For group chats, check if user is a participant
      const [participants] = await pool.execute(
        'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [conversationId, userId]
      );
      isAuthorized = participants.length > 0;
    } else {
      // For direct chats, check if user is participant_1 or participant_2
      const [conversations] = await pool.execute(
        'SELECT * FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
        [conversationId, userId, userId]
      );
      isAuthorized = conversations.length > 0;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to delete messages in this conversation' });
    }
    
    // Get the message to verify ownership for "delete for everyone"
    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE id = ? AND conversation_id = ?',
      [messageId, conversationId]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const message = messages[0];
    
    // Handle delete for everyone
    if (forEveryone === 'true') {
      // Only the sender can delete for everyone
      if (message.sender_id !== userId) {
        return res.status(403).json({ message: 'Only the sender can delete for everyone' });
      }

      var snapshot = JSON.stringify({
        text: message.text,
        type: message.type || 'text',
        image_url: message.image_url,
        file_url: message.file_url,
        file_name: message.file_name,
        audio_url: message.audio_url,
        duration: message.duration
      });
      
      // Mark as deleted for everyone; keep snapshot so it can be restored
      await pool.execute(
        `UPDATE messages 
         SET text = '[deleted]', 
             type = 'deleted', 
             image_url = NULL, 
             file_url = NULL, 
             file_name = NULL, 
             audio_url = NULL,
             deleted_for_everyone = TRUE,
             deleted_snapshot = ?,
             deleted_at = NOW()
         WHERE id = ?`,
        [snapshot, messageId]
      );
      
      res.json({ message: 'Message deleted for everyone', forEveryone: true });
    } else {
      // Delete for me only - add user to deleted_for array
      let deletedFor = [];
      if (message.deleted_for) {
        try {
          deletedFor = JSON.parse(message.deleted_for);
        } catch (e) {
          deletedFor = [];
        }
      }
      
      if (!deletedFor.includes(userId)) {
        deletedFor.push(userId);
      }
      
      await pool.execute(
        'UPDATE messages SET deleted_for = ? WHERE id = ?',
        [JSON.stringify(deletedFor), messageId]
      );
      
      res.json({ message: 'Message deleted for you', forEveryone: false });
    }
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Restore a deleted message (for me or for everyone)
app.put('/api/conversations/:conversationId/messages/:messageId/restore', authenticateToken, async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const userId = req.user.id;

    if (!(await userCanAccessConversation(conversationId, userId))) {
      return res.status(403).json({ message: 'Not authorized to restore messages in this conversation' });
    }

    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE id = ? AND conversation_id = ?',
      [messageId, conversationId]
    );

    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = messages[0];
    const deletedForEveryone = message.deleted_for_everyone === 1 || message.deleted_for_everyone === true;
    const deletedFor = parseDeletedFor(message.deleted_for);
    const hiddenForMe = deletedFor.includes(userId);

    if (!deletedForEveryone && !hiddenForMe) {
      return res.status(400).json({ message: 'Message is not deleted' });
    }

    if (deletedForEveryone) {
      if (message.sender_id !== userId) {
        return res.status(403).json({ message: 'Only the sender can restore a message deleted for everyone' });
      }

      var snapshot = null;
      if (message.deleted_snapshot) {
        try {
          snapshot = typeof message.deleted_snapshot === 'string'
            ? JSON.parse(message.deleted_snapshot)
            : message.deleted_snapshot;
        } catch (e) {
          snapshot = null;
        }
      }

      if (!snapshot) {
        return res.status(400).json({ message: 'Cannot restore — original content was not saved' });
      }

      await pool.execute(
        `UPDATE messages SET
          text = ?,
          type = ?,
          image_url = ?,
          file_url = ?,
          file_name = ?,
          audio_url = ?,
          duration = ?,
          deleted_for_everyone = FALSE,
          deleted_snapshot = NULL,
          deleted_at = NULL
         WHERE id = ?`,
        [
          snapshot.text || '',
          snapshot.type || 'text',
          snapshot.image_url || null,
          snapshot.file_url || null,
          snapshot.file_name || null,
          snapshot.audio_url || null,
          snapshot.duration || null,
          messageId
        ]
      );
    } else {
      const nextDeletedFor = deletedFor.filter(function(id) { return id !== userId; });
      await pool.execute(
        'UPDATE messages SET deleted_for = ? WHERE id = ?',
        [nextDeletedFor.length > 0 ? JSON.stringify(nextDeletedFor) : null, messageId]
      );
    }

    const [restored] = await pool.execute(`
      SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageId]);

    res.json(restored[0]);
  } catch (error) {
    console.error('Restore message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete conversation
app.delete('/api/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if this is a group conversation
    const [conversationCheck] = await pool.execute(
      'SELECT is_group, group_name FROM conversations WHERE id = ?',
      [id]
    );

    if (conversationCheck.length > 0 && conversationCheck[0].is_group) {
      return res.status(400).json({
        message: 'Group chats cannot be deleted. Use Clear Chat to remove messages from your view, or restore individual messages.'
      });
    }
    
    const isAuthorized = await userCanAccessConversation(id, req.user.id);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await pool.execute('DELETE FROM conversations WHERE id = ?', [id]);
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== CALL MANAGEMENT =====

// Get call status (caller/receiver polling)
app.get('/api/calls/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [calls] = await pool.execute(
      `SELECT c.*, u.name as caller_name
       FROM calls c
       JOIN users u ON c.caller_id = u.id
       WHERE c.id = ? AND (c.caller_id = ? OR c.receiver_id = ?)`,
      [id, req.user.id, req.user.id]
    );
    if (calls.length === 0) {
      return res.status(404).json({ message: 'Call not found' });
    }
    res.json(calls[0]);
  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Initiate a call
app.post('/api/calls', authenticateToken, async (req, res) => {
  try {
    const { conversation_id, call_type } = req.body;
    const caller_id = req.user.id;
    
    if (!(await userCanAccessConversation(conversation_id, caller_id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [conversation_id]
    );
    
    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const conversation = conversations[0];
    if (conversation.is_group) {
      return res.status(400).json({
        message: 'Calls work in direct chats only. Start a private message first.'
      });
    }

    const receiver_id = conversation.participant_1_id === caller_id
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    await pool.execute(
      `UPDATE calls SET status = 'ended', ended_at = NOW()
       WHERE status = 'ringing' AND ended_at IS NULL
       AND ((caller_id = ? AND receiver_id = ?) OR (caller_id = ? AND receiver_id = ?))`,
      [caller_id, receiver_id, receiver_id, caller_id]
    );
    
    // Create call record
    const [result] = await pool.execute(
      `INSERT INTO calls (conversation_id, caller_id, receiver_id, call_type, status, started_at) 
       VALUES (?, ?, ?, ?, 'ringing', NOW())`,
      [conversation_id, caller_id, receiver_id, call_type]
    );
    
    // Get caller info
    const [callers] = await pool.execute('SELECT name FROM users WHERE id = ?', [caller_id]);
    const caller_name = callers[0]?.name || 'Unknown';
    
    res.status(201).json({
      call_id: result.insertId,
      conversation_id,
      caller_id,
      receiver_id,
      caller_name,
      call_type,
      status: 'ringing'
    });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get incoming calls for current user
app.get('/api/calls/incoming', authenticateToken, async (req, res) => {
  try {
    const [calls] = await pool.execute(
      `SELECT c.*, u.name as caller_name, conv.participant_1_id, conv.participant_2_id
       FROM calls c
       JOIN users u ON c.caller_id = u.id
       JOIN conversations conv ON c.conversation_id = conv.id
       WHERE c.receiver_id = ? AND c.status = 'ringing' AND c.ended_at IS NULL`,
      [req.user.id]
    );
    res.json(calls);
  } catch (error) {
    console.error('Get incoming calls error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Answer a call
app.put('/api/calls/:id/answer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify this user is the receiver
    const [calls] = await pool.execute(
      'SELECT * FROM calls WHERE id = ? AND receiver_id = ? AND status = "ringing"',
      [id, req.user.id]
    );
    
    if (calls.length === 0) {
      return res.status(404).json({ message: 'Call not found or already ended' });
    }
    
    await pool.execute(
      'UPDATE calls SET status = "connected", connected_at = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Call connected', call_id: id });
  } catch (error) {
    console.error('Answer call error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Decline/End a call
app.put('/api/calls/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ended', 'declined', 'missed'
    
    // Verify user is part of this call
    const [calls] = await pool.execute(
      'SELECT * FROM calls WHERE id = ? AND (caller_id = ? OR receiver_id = ?)',
      [id, req.user.id, req.user.id]
    );
    
    if (calls.length === 0) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    const call = calls[0];
    
    // Calculate duration if call was connected
    let duration = 0;
    if (call.connected_at) {
      duration = Math.floor((Date.now() - new Date(call.connected_at).getTime()) / 1000);
    }
    
    await pool.execute(
      'UPDATE calls SET status = ?, ended_at = NOW(), duration = ? WHERE id = ?',
      [status || 'ended', duration, id]
    );
    
    // Send system message about call result
    const finalStatus = status || 'ended';
    let messageText = '';
    
    const callLabel = call.call_type === 'video' ? 'Video call' : 'Voice call';
    let durationStr = '';
    if (duration > 0) {
      const hours = Math.floor(duration / 3600);
      const mins = Math.floor((duration % 3600) / 60);
      const secs = duration % 60;
      if (hours > 0) {
        durationStr = `${hours} hr ${mins} min ${secs} sec`;
      } else if (mins > 0) {
        durationStr = `${mins} min ${secs} sec`;
      } else {
        durationStr = `${secs} sec`;
      }
    }

    if (finalStatus === 'missed') {
      messageText = `📞 Missed ${callLabel.toLowerCase()}`;
    } else if (finalStatus === 'declined') {
      messageText = `📞 ${callLabel} declined`;
    } else if (duration > 0) {
      messageText = `📞 ${callLabel} ended • ${durationStr}`;
    } else {
      messageText = `📞 ${callLabel} ended`;
    }
    
    // Insert call log message
    await pool.execute(
      `INSERT INTO messages (conversation_id, sender_id, text, type, created_at) 
       VALUES (?, ?, ?, 'system', NOW())`,
      [call.conversation_id, call.caller_id, messageText]
    );
    
    res.json({ 
      message: 'Call ended', 
      call_id: id, 
      status: finalStatus,
      duration 
    });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// WebRTC signaling for calls
app.get('/api/calls/:id/webrtc', authenticateToken, async (req, res) => {
  try {
    const call = await getCallForUser(req.params.id, req.user.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    res.json({
      offer_sdp: call.offer_sdp,
      answer_sdp: call.answer_sdp,
      caller_ice: call.caller_ice,
      receiver_ice: call.receiver_ice,
      call_type: call.call_type,
      status: call.status
    });
  } catch (error) {
    console.error('Get WebRTC signaling error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/calls/:id/webrtc/offer', authenticateToken, async (req, res) => {
  try {
    const call = await getCallForUser(req.params.id, req.user.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    if (call.caller_id !== req.user.id) {
      return res.status(403).json({ message: 'Only caller can send offer' });
    }
    await pool.execute(
      'UPDATE calls SET offer_sdp = ? WHERE id = ?',
      [JSON.stringify(req.body.sdp), req.params.id]
    );
    res.json({ message: 'Offer saved' });
  } catch (error) {
    console.error('Save offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/calls/:id/webrtc/answer', authenticateToken, async (req, res) => {
  try {
    const call = await getCallForUser(req.params.id, req.user.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    if (call.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Only receiver can send answer' });
    }
    await pool.execute(
      'UPDATE calls SET answer_sdp = ? WHERE id = ?',
      [JSON.stringify(req.body.sdp), req.params.id]
    );
    res.json({ message: 'Answer saved' });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/calls/:id/webrtc/ice', authenticateToken, async (req, res) => {
  try {
    const call = await getCallForUser(req.params.id, req.user.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    const column = call.caller_id === req.user.id ? 'caller_ice' : 'receiver_ice';
    await appendCallIce(req.params.id, column, req.body.candidate);
    res.json({ message: 'ICE candidate saved' });
  } catch (error) {
    console.error('Save ICE error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== BATCH MANAGEMENT ROUTES =====

// Get all archived years
app.get('/api/archived-years', authenticateToken, async (req, res) => {
  try {
    const [archives] = await pool.execute('SELECT * FROM archived_years ORDER BY year DESC');
    res.json(archives);
  } catch (error) {
    console.error('Get archived years error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add archived year
app.post('/api/archived-years', authenticateToken, async (req, res) => {
  try {
    const { year, students, reports, data } = req.body;
    
    await pool.execute(
      'INSERT INTO archived_years (year, students, reports, data) VALUES (?, ?, ?, ?)',
      [year, students, reports, JSON.stringify(data)]
    );
    
    const [archives] = await pool.execute('SELECT * FROM archived_years WHERE year = ?', [year]);
    res.status(201).json(archives[0]);
  } catch (error) {
    console.error('Add archived year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete archived year
app.delete('/api/archived-years/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;
    await pool.execute('DELETE FROM archived_years WHERE year = ?', [year]);
    res.json({ message: 'Archived year deleted' });
  } catch (error) {
    console.error('Delete archived year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current batch
app.get('/api/current-batch', authenticateToken, async (req, res) => {
  try {
    const [batches] = await pool.execute('SELECT * FROM current_batch WHERE id = 1');
    res.json(batches[0] || { year: new Date().getFullYear() });
  } catch (error) {
    console.error('Get current batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current batch
app.put('/api/current-batch', authenticateToken, async (req, res) => {
  try {
    const { year } = req.body;
    
    // Check if exists
    const [existing] = await pool.execute('SELECT * FROM current_batch WHERE id = 1');
    
    if (existing.length > 0) {
      await pool.execute('UPDATE current_batch SET year = ? WHERE id = 1', [year]);
    } else {
      await pool.execute('INSERT INTO current_batch (id, year) VALUES (1, ?)', [year]);
    }
    
    res.json({ year, message: 'Batch updated' });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all students and reports (for new batch)
app.post('/api/clear-batch', authenticateToken, async (req, res) => {
  try {
    // Archive current data first
    const [students] = await pool.execute('SELECT * FROM students');
    const [reports] = await pool.execute('SELECT * FROM reports');
    
    const currentYear = new Date().getFullYear();
    
    await pool.execute(
      'INSERT INTO archived_years (year, students, reports, data) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE students = students + ?, reports = reports + ?',
      [currentYear, students.length, reports.length, JSON.stringify({ students, reports }), students.length, reports.length]
    );
    
    // Clear tables
    await pool.execute('DELETE FROM students');
    await pool.execute('DELETE FROM reports');
    await pool.execute('DELETE FROM report_submissions');
    
    res.json({ message: 'Batch cleared and archived' });
  } catch (error) {
    console.error('Clear batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all enrollments
app.get('/api/enrollments', authenticateToken, async (req, res) => {
  try {
    const [enrollments] = await pool.execute(`
      SELECT e.*, u.name as reviewed_by_name
      FROM enrollments e
      LEFT JOIN users u ON e.reviewed_by = u.id
      ORDER BY e.submitted_at DESC
    `);
    
    // Map database fields to frontend expected fields
    const mappedEnrollments = enrollments.map(e => ({
      ...e,
      fullName: e.student_name,
      nstpComponent: e.department,
      course: e.program,
      yearLevel: e.yearLevel
    }));
    
    res.json(mappedEnrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit enrollment
app.post('/api/enrollments', async (req, res) => {
  try {
    console.log('📥 Enrollment request received:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { 
      firstName, lastName, middleName, fullName,
      studentId, email, contactNumber,
      birthDate, birthMonth, birthDay, birthYear,
      age, civilStatus, gender, sex,
      height, weight, facebookAccount, bloodType,
      homeAddress, address,
      program, section, yearLevel, nstpComponent,
      emergencyContact, emergencyNumber, emergencyName
    } = req.body;
    
    console.log('✅ Fields extracted successfully');
    
    const name = fullName || `${lastName || ''}, ${firstName || ''} ${middleName || ''}`.trim();
    const finalGender = gender || sex;
    const finalAddress = homeAddress || address;
    const finalEmergencyContact = emergencyName || emergencyContact;
    
    console.log('Executing database insert with:', {
      name, firstName, lastName, middleName, email, nstpComponent, studentId, contactNumber,
      birthDate, program, section, yearLevel
    });
    
    const [result] = await pool.execute(
      `INSERT INTO enrollments 
       (student_name, firstName, lastName, middleName, email, department, studentId, contactNumber, 
        birthDate, birthMonth, birthDay, birthYear, age, civilStatus,
        gender, height, weight, facebookAccount, bloodType, address, 
        program, section, yearLevel, emergencyContact, emergencyNumber, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, firstName, lastName, middleName, email, nstpComponent || 'CWTS', studentId, contactNumber, 
        birthDate, birthMonth, birthDay, birthYear, age, civilStatus,
        finalGender, height, weight, facebookAccount, bloodType, finalAddress, 
        program, section, yearLevel, finalEmergencyContact, emergencyNumber, 'Pending'
      ]
    );

    console.log('✅ Insert successful, ID:', result.insertId);

    const [enrollments] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [result.insertId]);
    console.log('✅ Enrollment fetched:', enrollments[0]);
    
    res.status(201).json(enrollments[0]);
  } catch (error) {
    console.error('❌ Submit enrollment error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Decline enrollment
app.put('/api/enrollments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Approving enrollment:', { id, status });
    
    await pool.execute(
      'UPDATE enrollments SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [status, req.user.id, id]
    );

    // If approved, create student record (skip if already exists)
    if (status === 'Approved') {
      const [enrollments] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [id]);
      const enrollment = enrollments[0];
      
      console.log('Creating student from enrollment:', enrollment);
      
      try {
        // Check if student with this ID already exists
        const [existingStudents] = await pool.execute(
          'SELECT id FROM students WHERE studentId = ?',
          [enrollment.studentId]
        );
        
        if (existingStudents.length > 0) {
          console.log('Student with ID ' + enrollment.studentId + ' already exists, skipping creation');
        } else {
          // Build birthdate from separate fields if available
          let birthDate = enrollment.birthDate;
          if (!birthDate && enrollment.birthMonth && enrollment.birthDay && enrollment.birthYear) {
            birthDate = `${enrollment.birthYear}-${enrollment.birthMonth.padStart(2, '0')}-${enrollment.birthDay.padStart(2, '0')}`;
          }
          
          await pool.execute(
            `INSERT INTO students (
              studentId, name, email, department, status,
              section, year, program, address, contactNumber,
              gender, birthDate, age, civilStatus, height, weight,
              bloodType, facebookAccount, emergencyContact, emergencyNumber
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              enrollment.studentId, enrollment.student_name, enrollment.email, enrollment.department, 'Active',
              enrollment.section, enrollment.yearLevel, enrollment.program, enrollment.address, enrollment.contactNumber,
              enrollment.gender || enrollment.sex || null,
              birthDate,
              enrollment.age || null,
              enrollment.civilStatus || null,
              enrollment.height || null,
              enrollment.weight || null,
              enrollment.bloodType || null,
              enrollment.facebookAccount || null,
              enrollment.emergencyContact || enrollment.emergencyName || null,
              enrollment.emergencyNumber || null
            ]
          );
          console.log('Student created successfully with full demographic data');
        }
      } catch (insertError) {
        console.error('Error inserting student:', insertError);
        throw insertError;
      }
    }

    const [updated] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message, sql: error.sql });
  }
});

// ===== MESSAGE RECORD ENROLLMENT REPORT SYSTEM =====

// MESSAGES ENDPOINTS

// GET all messages
app.get('/api/messages', async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT * FROM messages ORDER BY date_sent DESC'
    );
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST add new message
app.post('/api/messages', async (req, res) => {
  try {
    const { sender_name, receiver_name, message_content } = req.body;
    
    // Validate input
    if (!sender_name || !receiver_name || !message_content) {
      return res.status(400).json({ 
        message: 'Missing required fields: sender_name, receiver_name, message_content' 
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO messages (sender_name, receiver_name, message_content) VALUES (?, ?, ?)',
      [sender_name, receiver_name, message_content]
    );

    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE id = ?', 
      [result.insertId]
    );
    
    res.status(201).json(messages[0]);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update message
app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_name, receiver_name, message_content } = req.body;
    
    // Validate input
    if (!sender_name || !receiver_name || !message_content) {
      return res.status(400).json({ 
        message: 'Missing required fields: sender_name, receiver_name, message_content' 
      });
    }
    
    await pool.execute(
      'UPDATE messages SET sender_name = ?, receiver_name = ?, message_content = ? WHERE id = ?',
      [sender_name, receiver_name, message_content, id]
    );

    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE id = ?', 
      [id]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(messages[0]);
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ENROLLMENT ENDPOINTS

// GET all enrollment records
app.get('/api/enrollment', async (req, res) => {
  try {
    const [enrollment] = await pool.execute(
      'SELECT * FROM enrollment ORDER BY enrollment_date DESC'
    );
    res.json(enrollment);
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST add new enrollment
app.post('/api/enrollment', async (req, res) => {
  try {
    const { student_name, course, year_level } = req.body;
    
    // Validate input
    if (!student_name || !course || !year_level) {
      return res.status(400).json({ 
        message: 'Missing required fields: student_name, course, year_level' 
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO enrollment (student_name, course, year_level) VALUES (?, ?, ?)',
      [student_name, course, year_level]
    );

    const [enrollment] = await pool.execute(
      'SELECT * FROM enrollment WHERE id = ?', 
      [result.insertId]
    );
    
    res.status(201).json(enrollment[0]);
  } catch (error) {
    console.error('Add enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update enrollment
app.put('/api/enrollment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_name, course, year_level } = req.body;
    
    // Validate input
    if (!student_name || !course || !year_level) {
      return res.status(400).json({ 
        message: 'Missing required fields: student_name, course, year_level' 
      });
    }
    
    await pool.execute(
      'UPDATE enrollment SET student_name = ?, course = ?, year_level = ? WHERE id = ?',
      [student_name, course, year_level, id]
    );

    const [enrollment] = await pool.execute(
      'SELECT * FROM enrollment WHERE id = ?', 
      [id]
    );
    
    if (enrollment.length === 0) {
      return res.status(404).json({ message: 'Enrollment record not found' });
    }
    
    res.json(enrollment[0]);
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ARCHIVE/BATCH MANAGEMENT ENDPOINTS

// GET all archived years
app.get('/api/archives', authenticateToken, async (req, res) => {
  try {
    const [archives] = await pool.execute(
      'SELECT * FROM archived_years ORDER BY year DESC'
    );
    res.json(archives.map(archive => ({
      ...archive,
      data: archive.data
        ? (typeof archive.data === 'string' ? JSON.parse(archive.data) : archive.data)
        : null
    })));
  } catch (error) {
    console.error('Get archives error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET specific archived year with full data
app.get('/api/archives/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;
    
    // Get archive summary
    const [archives] = await pool.execute(
      'SELECT * FROM archived_years WHERE year = ?',
      [year]
    );
    
    if (archives.length === 0) {
      return res.status(404).json({ message: 'Archive not found' });
    }
    
    const archive = archives[0];
    
    // Get students for this batch
    const [students] = await pool.execute(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM report_submissions rs 
         JOIN reports r ON rs.report_id = r.id 
         WHERE r.department = s.department) as submissions
      FROM students s 
      WHERE s.schoolYear LIKE ?
      ORDER BY s.name`,
      [`${year}%`]
    );
    
    // Get reports for this batch
    const [reports] = await pool.execute(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM report_submissions WHERE report_id = r.id) as submission_count,
        u.name as created_by_name
      FROM reports r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.created_at >= ? AND r.created_at <= ?
      ORDER BY r.created_at DESC`,
      [`${year}-01-01`, `${year}-12-31`]
    );
    
    res.json({
      ...archive,
      data: archive.data
        ? (typeof archive.data === 'string' ? JSON.parse(archive.data) : archive.data)
        : null,
      studentData: students,
      reportData: reports
    });
  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST archive current batch (admin only)
app.post('/api/archives', authenticateToken, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { year } = req.body;
    
    // Get current stats
    const [studentCount] = await pool.execute(
      'SELECT COUNT(*) as count, department FROM students WHERE status != "Inactive" GROUP BY department'
    );
    
    const [reportCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM reports WHERE YEAR(created_at) = ?',
      [year]
    );
    
    const totalStudents = studentCount.reduce((sum, row) => sum + row.count, 0);
    const cwts = studentCount.find(r => r.department === 'CWTS')?.count || 0;
    const lts = studentCount.find(r => r.department === 'LTS')?.count || 0;
    const rotc = studentCount.find(r => r.department === 'ROTC')?.count || 0;
    
    // Insert or update archive
    await pool.execute(
      `INSERT INTO archived_years (year, students, reports, data) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       students = VALUES(students), 
       reports = VALUES(reports), 
       data = VALUES(data)`,
      [
        year,
        totalStudents,
        reportCount[0].count,
        JSON.stringify({ year, students: totalStudents, cwts, lts, rotc, reports: reportCount[0].count })
      ]
    );
    
    // Update current batch
    await pool.execute(
      `INSERT INTO current_batch (id, year) VALUES (1, ?)
       ON DUPLICATE KEY UPDATE year = ?`,
      [year + 1, year + 1]
    );
    
    res.json({ 
      message: `Batch ${year} archived successfully`, 
      year,
      students: totalStudents,
      reports: reportCount[0].count
    });
  } catch (error) {
    console.error('Archive batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE archived year (admin only)
app.delete('/api/archives/:year', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { year } = req.params;
    
    await pool.execute('DELETE FROM archived_years WHERE year = ?', [year]);
    
    res.json({ message: `Batch ${year} deleted from archives` });
  } catch (error) {
    console.error('Delete archive error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET current batch info
app.get('/api/current-batch', authenticateToken, async (req, res) => {
  try {
    const [batches] = await pool.execute('SELECT * FROM current_batch WHERE id = 1');
    
    if (batches.length === 0) {
      return res.json({ year: new Date().getFullYear() });
    }
    
    res.json(batches[0]);
  } catch (error) {
    console.error('Get current batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Not connected', error: error.message });
  }
});

Promise.all([
  ensureMessageRestoreColumns(),
  ensureConversationSchema(),
  ensureWebRTCColumns(),
  ensureBatchTables()
]).catch(function(err) {
  console.warn('Schema migration:', err.message);
});

app.listen(PORT, async function() {
  var db = getDbConfig();
  console.log('Server running on port ' + PORT);
  console.log('API available at http://localhost:' + PORT + '/api');
  try {
    await pool.execute('SELECT 1');
    console.log('Database connected: ' + db.host + ':' + db.port + '/' + db.database);
  } catch (err) {
    console.error('Database NOT connected:', err.message);
    console.error('Start XAMPP MySQL, then run: cd backend && npm run setup-db');
  }
});
