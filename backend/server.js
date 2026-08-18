require('dotenv').config({ path: require('path').join(__dirname, '.env') });
var express = require('express');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var pool = require('./config/database');
var { getDbConfig } = require('./config/dbEnv');
var { autoSaveToGDrive } = require('./utils/gdriveAutoSave');

var bcrypt = require('bcryptjs');
var ExcelJS = require('exceljs');
var path = require('path');
var fs = require('fs');
var app = express();
var PORT = process.env.PORT || 3001;

// ── Security: JWT Secret configuration ──────────────────────────────────────
var JWT_SECRET = process.env.JWT_SECRET || 'nstp-system-persistent-production-jwt-secret-key-2026-v1-super-secure-key';
var JWT_EXPIRY = '30d';

// ── Helmet: sets 15+ security headers ────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled — frontend is a Vite SPA on a different port
  crossOriginEmbedderPolicy: false,
}));

// ── Private Network Access (Chrome loopback request header) ────────────────
app.use(function(req, res, next) {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

// ── CORS: restrict to localhost in dev, explicit whitelist in production ──────
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://chardddyyy.github.io')
  .split(',').map(s => s.trim());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // same-origin / curl / server-to-server
    if (
      ALLOWED_ORIGINS.some(o => origin === o) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /\.github\.io$/.test(new URL(origin).hostname)
    ) {
      return callback(null, true);
    }
    callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Private-Network'],
}));

// ── Body size: 500 MB max for large file uploads ────────────────────────────────
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(express.text({ type: ['text/*', 'application/json', 'text/plain'], limit: '50mb' }));

// ── Global rate limiter ───────────────────────────────────────────────────────
// The app polls every 2s (calls) + 8s (live data × 4 API calls) per user.
// Rough max per logged-in user per 15 min:
//   pollCalls:      450 req  (2s × 15min)
//   refreshLiveData: 450 req  (8s × 15min × ~4 calls each)
//   UI interactions: ~100 req
// → set limit at 3 000 / 15 min per IP (leaves room for multiple tabs).
// Sensitive endpoints (login, enrollment) have their own tighter limiters.
var globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
  skip: (req) => req.method === 'OPTIONS',
});
app.use(globalLimiter);

// ── Enrollment rate limiter ───────────────────────────────────────────────────
// Set to 3000/hour per IP so campus-wide NAT (all students sharing one public IP)
// can all enroll without hitting the limit. Still blocks automated brute spam (>3000/hr).
var enrollmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many enrollment submissions from this IP network. Please try again later.' },
});

// ── In-memory login rate limiter ─────────────────────────────────────────────
// Keyed by email (not IP) so one person's failed attempts don't lock out the
// entire campus sharing a NAT IP address.  5 failures per email per 15 min.
var loginAttempts = new Map();
function checkLoginRateLimit(email) {
  var now = Date.now();
  var key = String(email).toLowerCase().trim();
  var entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 15 * 60 * 1000 };
  }
  if (entry.count >= 5) return false;
  entry.count++;
  loginAttempts.set(key, entry);
  return true;
}
function resetLoginAttempts(email) {
  loginAttempts.delete(String(email).toLowerCase().trim());
}

// ── Sanitize a string: strip null bytes, trim, limit length ──────────────────
function sanitizeStr(v, maxLen) {
  if (v === null || v === undefined) return null;
  var s = String(v).replace(/\x00/g, '').trim();
  return maxLen ? s.slice(0, maxLen) : s;
}

// ── Middleware to verify JWT ──────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  var authHeader = req.headers['authorization'];
  var token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, function(err, user) {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    if (user && user.id) {
      pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [user.id]).catch(() => {});
    }
    next();
  });
}

// ── Middleware: require admin role ────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// ── Audit log ─────────────────────────────────────────────────────────────────
async function ensureAuditLogs() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        user_id INT NULL,
        detail TEXT NULL,
        ip VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (_) {}
}

// ── Accurate Web Telemetry: active_visitors table ────────────────────────────
async function ensureActiveVisitorsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS active_visitors (
        visitor_id VARCHAR(36) PRIMARY KEY,
        page_url VARCHAR(500) NOT NULL,
        user_agent TEXT,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active_visitors_last_seen (last_seen)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (_) {}
}

// Creates the table if missing, then writes a single log row. Non-blocking.
async function auditLog(action, userId, detail, ip) {
  try {
    await pool.execute(
      'INSERT INTO audit_logs (action, user_id, detail, ip) VALUES (?, ?, ?, ?)',
      [action, userId || null, detail ? String(detail).slice(0, 4000) : null, ip || null]
    );
  } catch (_) { /* non-fatal */ }
}

async function ensureMessageRestoreColumns() {
  var alters = [
    'ALTER TABLE messages ADD COLUMN deleted_snapshot JSON NULL',
    'ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP NULL',
    'ALTER TABLE messages ADD COLUMN deleted_for JSON NULL',
    'ALTER TABLE messages ADD COLUMN deleted_for_everyone BOOLEAN DEFAULT FALSE',
    "ALTER TABLE messages ADD COLUMN type VARCHAR(20) DEFAULT 'text'"
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* exists */ }
  }
}

async function ensureNstpIdAndAttendanceTables() {
  try {
    const studentAlters = [
      'ALTER TABLE students ADD COLUMN nstp_serial_id VARCHAR(50) NULL',
      'ALTER TABLE students ADD COLUMN qr_token VARCHAR(100) NULL',
      'ALTER TABLE students ADD COLUMN id_issued_at DATETIME NULL',
      'ALTER TABLE enrollments ADD COLUMN nstp_serial_id VARCHAR(50) NULL',
      'ALTER TABLE enrollments ADD COLUMN qr_token VARCHAR(100) NULL'
    ];
    for (const sql of studentAlters) {
      try { await pool.execute(sql); } catch (_) {}
    }

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        student_name VARCHAR(255) NULL,
        department VARCHAR(50) NULL,
        section VARCHAR(50) NULL,
        activity_name VARCHAR(255) DEFAULT 'NSTP Session',
        scan_type ENUM('TIME_IN', 'TIME_OUT') DEFAULT 'TIME_IN',
        scanned_by INT NULL,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('Present', 'Late', 'Excused') DEFAULT 'Present',
        notes TEXT NULL,
        INDEX idx_attendance_student (student_id),
        INDEX idx_attendance_dept (department),
        INDEX idx_attendance_date (scanned_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Backfill any existing active students that don't have nstp_serial_id or qr_token yet
    const [rows] = await pool.execute(
      "SELECT * FROM students ORDER BY id ASC LIMIT 500"
    ).catch(() => [[]]);
    
    // Per-track counters for clean sequential matriculation numbers: NSTP-[TRACK]-[YEAR]-[00001]
    const trackCounters = { CWTS: 0, ROTC: 0, LTS: 0 };
    for (const st of (rows || [])) {
      const year = new Date(st.created_at || st.createdAt || Date.now()).getFullYear();
      const dept = (st.department || 'CWTS').toUpperCase();
      trackCounters[dept] = (trackCounters[dept] || 0) + 1;
      const countPadded = String(trackCounters[dept]).padStart(5, '0');
      const matriculationNumber = `NSTP-${dept}-${year}-${countPadded}`;
      const token = `NSTP-${st.studentId || st.id}-${matriculationNumber}`;

      try {
        await pool.execute(
          "UPDATE students SET nstp_serial_id = ?, qr_token = COALESCE(qr_token, ?) WHERE id = ?",
          [matriculationNumber, token, st.id]
        );
      } catch (_) {}
    }
  } catch (err) {
    console.warn('ensureNstpIdAndAttendanceTables notice:', err.message);
  }
}

var userColumnsMigrated = false;
async function ensureUserColumns() {
  if (userColumnsMigrated) return;
  var alters = [
    'ALTER TABLE users ADD COLUMN profilePicture TEXT',
    'ALTER TABLE users ADD COLUMN phone VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN bio TEXT',
    'ALTER TABLE users ADD COLUMN last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column already exists */ }
  }
  userColumnsMigrated = true;
  await ensureNstpIdAndAttendanceTables();
}

async function ensureCallsTableAndColumns() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS calls (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id INT,
        caller_id INT NOT NULL,
        receiver_id INT NULL,
        group_call_id VARCHAR(100) NULL,
        call_type VARCHAR(20) DEFAULT 'voice',
        status VARCHAR(20) DEFAULT 'ringing',
        offer_sdp TEXT NULL,
        answer_sdp TEXT NULL,
        caller_ice TEXT NULL,
        receiver_ice TEXT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        connected_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        duration INT DEFAULT 0
      )
    `);
  } catch (_) {}

  var alters = [
    'ALTER TABLE calls ADD COLUMN connected_at TIMESTAMP NULL',
    'ALTER TABLE calls ADD COLUMN ended_at TIMESTAMP NULL',
    'ALTER TABLE calls ADD COLUMN duration INT DEFAULT 0',
    'ALTER TABLE calls ADD COLUMN offer_sdp TEXT NULL',
    'ALTER TABLE calls ADD COLUMN answer_sdp TEXT NULL',
    'ALTER TABLE calls ADD COLUMN caller_ice TEXT NULL',
    'ALTER TABLE calls ADD COLUMN receiver_ice TEXT NULL',
    'ALTER TABLE calls ADD COLUMN group_call_id VARCHAR(100) NULL',
    'ALTER TABLE calls ADD COLUMN conversation_id INT NULL'
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (_) {}
  }
}

async function ensureStudentColumns() {
  var alters = [
    'ALTER TABLE students ADD COLUMN birthMonth VARCHAR(2)',
    'ALTER TABLE students ADD COLUMN birthDay VARCHAR(2)',
    'ALTER TABLE students ADD COLUMN birthYear VARCHAR(4)',
    'ALTER TABLE students ADD COLUMN age VARCHAR(10)',
    'ALTER TABLE students ADD COLUMN civilStatus VARCHAR(50)',
    'ALTER TABLE students ADD COLUMN height VARCHAR(10)',
    'ALTER TABLE students ADD COLUMN weight VARCHAR(10)',
    'ALTER TABLE students ADD COLUMN facebookAccount VARCHAR(255)',
    'ALTER TABLE students ADD COLUMN bloodType VARCHAR(10)',
    'ALTER TABLE students ADD COLUMN emergencyNumber VARCHAR(50)',
    'ALTER TABLE students ADD COLUMN program VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN section VARCHAR(50)',
    'ALTER TABLE students ADD COLUMN profilePicture TEXT',
    'ALTER TABLE students ADD COLUMN street VARCHAR(255)',
    'ALTER TABLE students ADD COLUMN municipality VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN province VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN firstName VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN lastName VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN middleName VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN registeredVoter VARCHAR(20)',
    'ALTER TABLE students ADD COLUMN registrationPhoto LONGTEXT NULL',
    'ALTER TABLE students ADD COLUMN registration_photo LONGTEXT NULL',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column already exists */ }
  }
}

var enrollmentColumnsMigrated = false;
async function ensureEnrollmentColumns() {
  if (enrollmentColumnsMigrated) return;
  var alters = [
    'ALTER TABLE enrollments ADD COLUMN firstName VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN lastName VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN middleName VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN homeAddress TEXT',
    'ALTER TABLE enrollments ADD COLUMN address TEXT',
    'ALTER TABLE enrollments ADD COLUMN contactNumber VARCHAR(50)',
    'ALTER TABLE enrollments ADD COLUMN birthDate DATE NULL',
    'ALTER TABLE enrollments ADD COLUMN birthMonth VARCHAR(2)',
    'ALTER TABLE enrollments ADD COLUMN birthDay VARCHAR(2)',
    'ALTER TABLE enrollments ADD COLUMN birthYear VARCHAR(4)',
    'ALTER TABLE enrollments ADD COLUMN age VARCHAR(10)',
    'ALTER TABLE enrollments ADD COLUMN civilStatus VARCHAR(50)',
    'ALTER TABLE enrollments ADD COLUMN gender VARCHAR(20)',
    'ALTER TABLE enrollments ADD COLUMN height VARCHAR(10)',
    'ALTER TABLE enrollments ADD COLUMN weight VARCHAR(10)',
    'ALTER TABLE enrollments ADD COLUMN facebookAccount VARCHAR(255)',
    'ALTER TABLE enrollments ADD COLUMN bloodType VARCHAR(10)',
    'ALTER TABLE enrollments ADD COLUMN course VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN program VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN section VARCHAR(50)',
    'ALTER TABLE enrollments ADD COLUMN yearLevel VARCHAR(50)',
    'ALTER TABLE enrollments ADD COLUMN emergencyContact VARCHAR(255)',
    'ALTER TABLE enrollments ADD COLUMN emergencyNumber VARCHAR(50)',
    'ALTER TABLE enrollments ADD COLUMN studentId VARCHAR(50)',
    'ALTER TABLE enrollments ADD COLUMN reviewed_by INT NULL',
    'ALTER TABLE enrollments ADD COLUMN street VARCHAR(255)',
    'ALTER TABLE enrollments ADD COLUMN municipality VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN province VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN reviewed_at TIMESTAMP NULL',
    'ALTER TABLE enrollments ADD COLUMN registration_photo LONGTEXT NULL',
    'ALTER TABLE enrollments ADD COLUMN registeredVoter VARCHAR(20)',
    'ALTER TABLE enrollments ADD COLUMN ip_address VARCHAR(45) NULL',
    'ALTER TABLE enrollments ADD COLUMN user_agent TEXT NULL',
    'CREATE INDEX idx_enrollments_studentid ON enrollments (studentId)',
    'CREATE INDEX idx_enrollments_email ON enrollments (email)',
    'CREATE INDEX idx_enrollments_status ON enrollments (status)',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column or index already exists */ }
  }
  enrollmentColumnsMigrated = true;
}

async function ensureReportsDeptColumn() {
  // Force department to VARCHAR(50) so 'All' and other non-ENUM values are accepted.
  // CHANGE COLUMN + MODIFY COLUMN cover both MySQL 5.7 and 8.x syntax differences.
  try { await pool.execute("ALTER TABLE reports MODIFY COLUMN department VARCHAR(50) NULL"); } catch (_) {}
  try { await pool.execute("ALTER TABLE reports CHANGE COLUMN department department VARCHAR(50) NULL"); } catch (_) {}
  try { await pool.execute('ALTER TABLE reports ADD COLUMN reference_file_data LONGTEXT NULL'); } catch (_) {}
  try { await pool.execute('ALTER TABLE reports ADD COLUMN reference_file_name VARCHAR(255) NULL'); } catch (_) {}
  try { await pool.execute('ALTER TABLE report_submissions ADD COLUMN file_data LONGTEXT NULL'); } catch (_) {}
  try { await pool.execute('ALTER TABLE report_submissions ADD COLUMN file_name VARCHAR(255) NULL'); } catch (_) {}
}

async function ensureReportComments() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS report_comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        report_id INT NOT NULL,
        user_id INT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (_) {}
}

async function ensureReportsBatchYear() {
  // Add batch_year column so every report is tied to a specific batch
  try {
    await pool.execute('ALTER TABLE reports ADD COLUMN batch_year INT NULL');
  } catch (e) { /* column already exists */ }
  // Backfill existing rows: use YEAR(created_at) as best approximation
  try {
    await pool.execute('UPDATE reports SET batch_year = YEAR(created_at) WHERE batch_year IS NULL');
  } catch (e) { console.warn('batch_year backfill warning:', e.message); }
}

async function ensureConversationLastSender() {
  var alters = [
    'ALTER TABLE conversations ADD COLUMN last_sender_id INT NULL',
    'ALTER TABLE conversations ADD COLUMN last_sender_name VARCHAR(255) NULL',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column already exists */ }
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
  // Whitelist the column name — never interpolate raw user-influenced values into SQL.
  if (column !== 'caller_ice' && column !== 'receiver_ice') {
    throw new Error('Invalid ICE column');
  }
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
  // Safe: column is already whitelisted above.
  var sql = column === 'caller_ice'
    ? 'UPDATE calls SET caller_ice = ? WHERE id = ?'
    : 'UPDATE calls SET receiver_ice = ? WHERE id = ?';
  await pool.execute(sql, [JSON.stringify(list), callId]);
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
  // Rate-limit by IP to block brute-force attacks
  var ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  var rawEmail = sanitizeStr(req.body.email, 255);
  if (!rawEmail) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  var email = rawEmail.toLowerCase().trim();

  if (!checkLoginRateLimit(email)) {
    return res.status(429).json({ message: 'Too many failed attempts for this account. Try again in 15 minutes.' });
  }

  try {
    var password = req.body.password;

    if (!password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    var result = await pool.execute(
      'SELECT id, email, name, role, department, avatar, profilePicture, phone, bio, password FROM users WHERE LOWER(email) = ? OR LOWER(email) LIKE ? OR LOWER(name) = ?',
      [email, email + '@%', email]
    );
    var users = result[0];

    // Always run bcrypt.compare to prevent timing attacks (even when user not found)
    var dummyHash = '$2a$12$invalidhashusedtopreventitenumerationXXXXXXXXXXXXXXXXXXXXXXX';
    var storedPassword = users.length > 0 ? String(users[0].password).trim() : dummyHash;
    var providedPassword = String(password).trim();

    var passwordMatch = false;
    var isBcryptHash = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$');
    if (isBcryptHash) {
      passwordMatch = await bcrypt.compare(providedPassword, storedPassword);
    } else if (users.length > 0) {
      passwordMatch = (providedPassword === storedPassword);
      if (passwordMatch) {
        var hashed = await bcrypt.hash(providedPassword, 12);
        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, users[0].id]);
      }
    }

    if (users.length === 0) {
      auditLog('login_failed', null, `email_not_found: ${email}`, ip);
      return res.status(401).json({ message: 'Invalid email address — Account not found' });
    }

    if (!passwordMatch) {
      auditLog('login_failed', null, `wrong_password: ${email}`, ip);
      return res.status(401).json({ message: 'Incorrect password — Please try again' });
    }

    var user = users[0];
    resetLoginAttempts(email);
    auditLog('login_success', user.id, `role: ${user.role}`, ip);

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
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
      'SELECT id, email, name, role, department, avatar, profilePicture, last_active_at FROM users'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
app.get('/api/users/me', authenticateToken, async (req, res) => {
  await ensureUserColumns().catch(() => {});
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
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create instructor account (admin only)
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { name, email, password, department, role } = req.body;
    const assignedRole = role === 'admin' ? 'admin' : 'instructor';
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (String(password).length > 128) {
      return res.status(400).json({ message: 'Password is too long.' });
    }
    if (assignedRole === 'instructor' && !['CWTS', 'LTS', 'ROTC'].includes(department)) {
      return res.status(400).json({ message: 'Department must be CWTS, LTS, or ROTC for instructors.' });
    }
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const hashed = await bcrypt.hash(String(password), 12);
    const assignedDept = assignedRole === 'admin' ? null : department;
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, assignedRole, assignedDept]
    );
    const newUserId = result.insertId;

    // Auto-add to the "All Instructors" group if it exists
    try {
      const [grp] = await pool.execute(
        "SELECT id FROM conversations WHERE is_group = TRUE AND group_name = 'All Instructors' LIMIT 1"
      );
      if (grp.length > 0) {
        const groupId = grp[0].id;
        await pool.execute(
          'INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
          [groupId, newUserId]
        );
        await pool.execute(
          `INSERT INTO messages (conversation_id, sender_id, text, type, created_at)
           VALUES (?, ?, ?, 'system', NOW())`,
          [groupId, newUserId, `${name} joined the group`]
        );
      }
    } catch (_) { /* non-fatal */ }

    res.status(201).json({ id: newUserId, name, email, role: assignedRole, department: assignedDept });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete instructor account (admin only, cannot delete self or any admin)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    const [target] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id]);
    if (target.length === 0) return res.status(404).json({ message: 'User not found.' });
    if (target[0].role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted.' });
    }
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Instructor deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
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

    const { name, email, phone, bio, avatar, profilePicture, role, department, password } = req.body;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    // Cap profile picture at ~10 MB base64 (≈ 13.3 MB string)
    if (profilePicture && String(profilePicture).length > 14_000_000) {
      return res.status(400).json({ message: 'Profile picture too large. Maximum 10 MB.' });
    }

    if (req.user.role === 'admin') {
      const [existingUserRows] = await pool.execute('SELECT role, department FROM users WHERE id = ?', [id]);
      const existingUser = existingUserRows[0] || {};
      const targetRole = role ? role : (existingUser.role || 'instructor');
      const targetDept = targetRole === 'admin' ? 'NSTP Office' : (department ? department : (existingUser.department || 'CWTS'));

      let updateSql = 'UPDATE users SET name = ?, email = ?, phone = ?, bio = ?, avatar = ?, profilePicture = ?, role = ?, department = ?';
      const params = [
        sanitizeStr(name, 255),
        sanitizeStr(email, 255),
        sanitizeStr(phone, 50),
        sanitizeStr(bio, 500),
        sanitizeStr(avatar, 50),
        profilePicture || null,
        targetRole,
        targetDept
      ];
      if (password && String(password).trim().length >= 6) {
        const hashed = await bcrypt.hash(String(password).trim(), 12);
        updateSql += ', password = ?';
        params.push(hashed);
      }
      updateSql += ' WHERE id = ?';
      params.push(id);
      await pool.execute(updateSql, params);
    } else {
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, phone = ?, bio = ?, avatar = ?, profilePicture = ? WHERE id = ?',
        [
          sanitizeStr(name, 255),
          sanitizeStr(email, 255),
          sanitizeStr(phone, 50),
          sanitizeStr(bio, 500),
          sanitizeStr(avatar, 50),
          profilePicture || null,
          id
        ]
      );
    }

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

// Change password (own account) or admin reset (any account)
app.put('/api/users/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (String(newPassword).length > 128) {
      return res.status(400).json({ message: 'Password too long' });
    }

    const hashed = await bcrypt.hash(String(newPassword), 12);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
    auditLog('password_changed', req.user.id, null, req.ip || 'unknown');
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== STUDENT ROUTES =====

// Get students — admins see all, instructors see only their department
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    let students;
    if (req.user.role === 'admin') {
      [students] = await pool.execute('SELECT * FROM students ORDER BY created_at DESC');
    } else {
      [students] = await pool.execute(
        'SELECT * FROM students WHERE department = ? ORDER BY created_at DESC',
        [req.user.department]
      );
    }
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CHED Excel export
function buildChedWorkbook(students, info = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NSTP System';
  const ws = wb.addWorksheet('Enrollment List');

  const semester = info.semester || '1st Semester, Academic Year: 2025-2026';
  const widths = [6, 14, 16, 16, 16, 12, 6, 14, 18, 14, 18, 14, 14, 16, 24];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  // Row heights — compact title rows so logos don't stretch the sheet
  for (let i = 1; i <= 6; i++) ws.getRow(i).height = 13;

  const centerMid = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const leftMid   = { horizontal: 'left',   vertical: 'middle' };
  const thin = { style: 'thin', color: { argb: 'FF000000' } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  const arialSm = { name: 'Arial', size: 10 };

  // ── Logos — fixed pixel size so they don't fill the whole header ──
  const CHED_LOGO  = path.join(__dirname, 'assets', 'ched-logo.png');
  const BAGONG_LOGO = path.join(__dirname, 'assets', 'bagong-pilipinas-logo.png');
  if (fs.existsSync(CHED_LOGO)) {
    const imgId = wb.addImage({ filename: CHED_LOGO, extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0.2, row: 0.1 }, ext: { width: 68, height: 68 } });
  }
  if (fs.existsSync(BAGONG_LOGO)) {
    const imgId = wb.addImage({ filename: BAGONG_LOGO, extension: 'png' });
    ws.addImage(imgId, { tl: { col: 13.3, row: 0.1 }, ext: { width: 72, height: 67 } });
  }

  // ── Title block rows 1-6, centered across A:O ──
  const titles = [
    { row: 1, text: 'Republic of the Philippines',    bold: false, size: 11 },
    { row: 2, text: 'Office of the President',         bold: false, size: 11 },
    { row: 3, text: 'COMMISSION ON HIGHER EDUCATION',  bold: true,  size: 11 },
    { row: 5, text: semester.startsWith('2nd') ? 'NSTP 2 Enrollment List' : 'NSTP 1 Enrollment List', bold: true, size: 12 },
    { row: 6, text: semester,                           bold: false, size: 11 },
  ];
  titles.forEach(({ row, text, bold, size }) => {
    ws.mergeCells(row, 1, row, 15);
    const cell = ws.getCell(row, 1);
    cell.value = text;
    cell.alignment = centerMid;
    cell.font = { name: 'Arial', size, bold };
  });

  // ── Form fields rows 8-9 with underlined values ──
  // Name of HEI + Address on left (A-H), Region + NSTP Component pushed right (I-O)
  ws.mergeCells('A8:H8'); ws.mergeCells('I8:O8');
  ws.mergeCells('A9:H9'); ws.mergeCells('I9:O9');

  const hei        = info.hei           || 'CAVITE STATE UNIVERSITY NAIC';
  const region     = info.region        || 'IV (CALABARZON)';
  const address    = info.address       || 'Bucana Malaki, Naic, Cavite';
  const components = info.nstpComponents || 'CWTS / LTS / ROTC';

  ws.getCell('A8').value = { richText: [
    { text: 'Name of HEI: ', font: { ...arialSm } },
    { text: hei,             font: { ...arialSm, underline: true } },
  ]};
  ws.getCell('I8').value = { richText: [
    { text: 'Region: ', font: { ...arialSm } },
    { text: region,     font: { ...arialSm, bold: true, underline: true } },
  ]};
  ws.getCell('A9').value = { richText: [
    { text: 'Address: ', font: { ...arialSm } },
    { text: address,     font: { ...arialSm, underline: true } },
  ]};
  ws.getCell('I9').value = { richText: [
    { text: 'NSTP Component: ', font: { ...arialSm } },
    { text: components,         font: { ...arialSm, underline: true } },
  ]};
  ['A8','I8','A9','I9'].forEach(ref => { ws.getCell(ref).alignment = leftMid; });

  // ── Table header rows 11-12 ──
  // Do ALL merges first, then apply styles
  ws.mergeCells('A11:A12'); ws.getCell('A11').value = 'No.';
  ws.mergeCells('B11:B12'); ws.getCell('B11').value = 'Student No.';
  // Student Name only spans Surname / First Name / Middle Name (C-E)
  ws.mergeCells('C11:E11'); ws.getCell('C11').value = 'Student Name';
  // Program, Sex, Birthdate each span both rows (row-merged, single column)
  ws.mergeCells('F11:F12'); ws.getCell('F11').value = 'Program';
  ws.mergeCells('G11:G12'); ws.getCell('G11').value = 'Sex';
  ws.mergeCells('H11:H12'); ws.getCell('H11').value = 'Birthdate';
  // Address group
  ws.mergeCells('I11:M11'); ws.getCell('I11').value = 'Address';
  // Contact Number and E-mail Address are standalone columns (no "Contact" group header)
  ws.mergeCells('N11:N12'); ws.getCell('N11').value = 'Contact Number';
  ws.mergeCells('O11:O12'); ws.getCell('O11').value = 'E-mail Address';

  // Sub-columns (row 12)
  ws.getCell('C12').value = 'Surname';
  ws.getCell('D12').value = 'First Name';
  ws.getCell('E12').value = 'Middle Name';
  ws.mergeCells('I12:J12');  ws.getCell('I12').value = 'Street / Barangay';
  ws.mergeCells('K12:L12');  ws.getCell('K12').value = 'Municipality / City';
  ws.getCell('M12').value = 'Province';

  // Apply styles — iterate only master cells of each merge + standalone cells
  const headerStyle = { alignment: centerMid, font: { name: 'Arial', size: 9, bold: true }, border, fill: headerFill };
  const headerCells = [
    'A11','B11','C11','F11','G11','H11','I11','N11','O11',  // row 11 headers (N/O now row-span)
    'C12','D12','E12','I12','K12','M12',                     // row 12 sub-columns
  ];
  headerCells.forEach(ref => {
    const cell = ws.getCell(ref);
    cell.alignment = headerStyle.alignment;
    cell.font = headerStyle.font;
    cell.border = headerStyle.border;
    cell.fill = headerStyle.fill;
  });

  // ── Data rows starting at row 13 ──
  let r = 13;
  students.forEach((s, idx) => {
    const surname    = s.lastName  || (s.name || '').split(',')[0]?.trim() || '';
    const firstPart  = s.firstName || (s.name || '').split(',')[1]?.trim() || '';
    const firstName  = s.firstName || firstPart.split(' ')[0] || '';
    const middleName = s.middleName || firstPart.split(' ').slice(1).join(' ') || '';

    let birthdate = '';
    if (s.birthDate) {
      const d = new Date(s.birthDate);
      if (!isNaN(d)) birthdate = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
    } else if (s.birthMonth && s.birthDay && s.birthYear) {
      birthdate = `${s.birthMonth}/${s.birthDay}/${s.birthYear}`;
    }

    const rowVals = [
      idx + 1,
      s.studentId      || '',
      surname,
      firstName,
      middleName,
      s.program || s.course || '',
      s.gender         || '',
      birthdate,
      s.street         || '',
      '',
      s.municipality   || '',
      '',
      s.province       || '',
      s.contactNumber  || '',
      s.email          || '',
    ];
    rowVals.forEach((v, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = v;
      cell.font = { name: 'Arial', size: 9 };
      cell.border = border;
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    ws.mergeCells(r, 9, r, 10);
    ws.mergeCells(r, 11, r, 12);
    r++;
  });

  return wb;
}

app.get('/api/students/ched-export', authenticateToken, async (req, res) => {
  try {
    // Instructors are forced to their own department; admins may choose any
    const isAdmin = req.user.role === 'admin';
    const dept    = isAdmin ? (req.query.department || 'All') : req.user.department;
    const program = req.query.program || 'All';
    const sem     = req.query.sem     || '1st Semester';
    const year    = req.query.year    || '2025-2026';
    const semester = `${sem}, Academic Year: ${year}`;

    // Build WHERE conditions
    const conditions = ["s.status = 'Active'"];
    const params = [];
    if (dept !== 'All')    { conditions.push('s.department = ?'); params.push(dept); }
    if (program !== 'All') { conditions.push('s.program = ?');    params.push(program); }
    const where = conditions.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT s.*, e.firstName, e.lastName, e.middleName, e.street, e.municipality, e.province
       FROM students s
       LEFT JOIN enrollments e ON e.studentId = s.studentId AND e.status = 'Approved'
       WHERE ${where}
       ORDER BY s.name`,
      params
    );

    const deptLabel    = dept    === 'All' ? 'CWTS / LTS / ROTC' : dept;
    const programLabel = program === 'All' ? '' : ` — ${program}`;
    const info = {
      hei: 'CAVITE STATE UNIVERSITY NAIC',
      region: 'IV (CALABARZON)',
      address: 'Bucana Malaki, Naic, Cavite',
      nstpComponents: `${deptLabel}${programLabel}`,
      semester,
    };

    const wb = buildChedWorkbook(rows, info);
    const fileLabel = [dept === 'All' ? 'All' : dept, program === 'All' ? '' : program].filter(Boolean).join('_');
    const dateStr = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CHED_NSTP_EnrollmentList_${fileLabel}_${dateStr}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('CHED export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// Add student
app.post('/api/students', authenticateToken, async (req, res) => {
  try {
    const {
      studentId, name, email, department, section, semester, schoolYear, program, year, yearLevel,
      contactNumber, address, gender, sex, birthDate, birthMonth, birthDay, birthYear,
      age, civilStatus, bloodType, height, weight, facebookAccount,
      emergencyName, emergencyContact, emergencyNumber,
      firstName, lastName, middleName, registeredVoter, isVoter,
      street, municipality, province, registrationPhoto, registration_photo
    } = req.body;

    // Validate required fields
    if (!studentId || (!name && !lastName) || !department) {
      return res.status(400).json({ message: 'Missing required fields: studentId, name, department' });
    }
    if (!['CWTS', 'LTS', 'ROTC'].includes(department)) {
      return res.status(400).json({ message: 'Invalid department. Must be CWTS, LTS, or ROTC.' });
    }
    if (!/^\d{9}$/.test(sanitizeStr(studentId, 20))) {
      return res.status(400).json({ message: 'Student ID must be exactly 9 digits.' });
    }

    const n = (v) => (v === undefined || v === null || v === '') ? null : v;
    let safeBirthDate = n(birthDate);
    if (!safeBirthDate && n(birthMonth) && n(birthDay) && n(birthYear)) {
      const m = parseInt(birthMonth, 10);
      const d = parseInt(birthDay, 10);
      const y = parseInt(birthYear, 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        safeBirthDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    const finalName = name || `${lastName || ''}, ${firstName || ''} ${middleName || ''}`.trim();
    const finalGender = n(gender) || n(sex);
    const finalYear = n(yearLevel) || n(year);
    const finalEmergency = n(emergencyContact) || n(emergencyName);
    const finalVoter = n(registeredVoter) || n(isVoter) || 'No';
    const finalPhoto = n(registrationPhoto) || n(registration_photo);

    const [result] = await pool.execute(
      `INSERT INTO students (
        studentId, name, email, department, section, semester, schoolYear, program, year,
        contactNumber, address, gender, birthDate, birthMonth, birthDay, birthYear,
        age, civilStatus, bloodType, height, weight, facebookAccount,
        emergencyContact, emergencyNumber,
        firstName, lastName, middleName, registeredVoter,
        street, municipality, province, registrationPhoto, registration_photo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId, finalName, n(email), department, n(section), n(semester), n(schoolYear), n(program), finalYear,
        n(contactNumber), n(address), finalGender, safeBirthDate, n(birthMonth), n(birthDay), n(birthYear),
        n(age), n(civilStatus), n(bloodType), n(height), n(weight), n(facebookAccount),
        finalEmergency, n(emergencyNumber),
        n(firstName), n(lastName), n(middleName), finalVoter,
        n(street), n(municipality), n(province), finalPhoto, finalPhoto
      ]
    );

    const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [result.insertId]);
    autoSaveToGDrive('Add_Student_' + studentId);
    res.status(201).json(students[0]);
  } catch (error) {
    console.error('Add student error:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate'))) {
      return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student — admins can update any student; instructors can only update their department's students
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentId, name, email, department, section, semester, schoolYear, program, year, yearLevel,
      contactNumber, address, gender, sex, birthDate, birthMonth, birthDay, birthYear,
      age, civilStatus, bloodType, height, weight, facebookAccount,
      emergencyName, emergencyContact, emergencyNumber,
      firstName, lastName, middleName, registeredVoter, isVoter,
      street, municipality, province, registrationPhoto, registration_photo
    } = req.body;

    // Instructors: verify the target student belongs to their department
    if (req.user.role !== 'admin') {
      const [existing] = await pool.execute('SELECT department FROM students WHERE id = ?', [id]);
      if (existing.length === 0) return res.status(404).json({ message: 'Student not found' });
      if (existing[0].department !== req.user.department) {
        return res.status(403).json({ message: 'You can only edit students in your department' });
      }
      // Prevent instructors from changing a student's department
      if (department && department !== req.user.department) {
        return res.status(403).json({ message: 'You cannot change a student\'s department' });
      }
    }

    // Convert undefined OR empty string to null (empty string breaks DATE columns in MySQL strict mode)
    const n = (v) => (v === undefined || v === null || v === '') ? null : v;

    // Build a valid DATE string only if all three parts are present and make a plausible date
    let safeBirthDate = n(birthDate);
    if (!safeBirthDate && n(birthMonth) && n(birthDay) && n(birthYear)) {
      const m = parseInt(birthMonth, 10);
      const d = parseInt(birthDay, 10);
      const y = parseInt(birthYear, 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        safeBirthDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    const finalGender = n(gender) || n(sex);
    const finalYear = n(yearLevel) || n(year);
    const finalEmergency = n(emergencyContact) || n(emergencyName);
    const finalVoter = n(registeredVoter) || n(isVoter) || 'No';
    const finalPhoto = n(registrationPhoto) || n(registration_photo);

    await pool.execute(
      `UPDATE students SET
         studentId = ?, name = ?, email = ?, department = ?, section = ?, semester = ?, schoolYear = ?,
         program = ?, year = ?, contactNumber = ?, address = ?, gender = ?, birthDate = ?,
         birthMonth = ?, birthDay = ?, birthYear = ?, age = ?, civilStatus = ?, bloodType = ?,
         height = ?, weight = ?, facebookAccount = ?, emergencyContact = ?, emergencyNumber = ?,
         firstName = ?, lastName = ?, middleName = ?, registeredVoter = ?,
         street = ?, municipality = ?, province = ?, registrationPhoto = ?, registration_photo = ?
       WHERE id = ?`,
      [
        studentId, name, n(email), department, n(section), n(semester), n(schoolYear),
        n(program), finalYear, n(contactNumber), n(address), finalGender, safeBirthDate,
        n(birthMonth), n(birthDay), n(birthYear), n(age), n(civilStatus), n(bloodType),
        n(height), n(weight), n(facebookAccount), finalEmergency, n(emergencyNumber),
        n(firstName), n(lastName), n(middleName), finalVoter,
        n(street), n(municipality), n(province), finalPhoto, finalPhoto,
        id
      ]
    );

    const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [id]);
    autoSaveToGDrive('Edit_Student_' + (studentId || id));
    res.json(students[0]);
  } catch (error) {
    console.error('Update student error:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate'))) {
      return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student
app.delete('/api/students/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });

    const s = rows[0];
    const snapshot = JSON.stringify({
      studentId: s.studentId, name: s.name, department: s.department,
      email: s.email, program: s.program, section: s.section, year: s.year,
      contactNumber: s.contactNumber, address: s.address, gender: s.gender,
      birthDate: s.birthDate, age: s.age, civilStatus: s.civilStatus,
      emergencyContact: s.emergencyContact, emergencyNumber: s.emergencyNumber,
      status: s.status, created_at: s.created_at,
    });
    await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    auditLog('student_deleted', req.user.id, snapshot, req.ip || 'unknown');
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

      const [comments] = await pool.execute(`
        SELECT rc.*, u.name as user_name, u.role, u.department
        FROM report_comments rc
        JOIN users u ON rc.user_id = u.id
        WHERE rc.report_id = ?
        ORDER BY rc.created_at ASC
      `, [report.id]);
      report.comments = comments;
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
    
    // Validate date format and ensure due date is not in the past
    let safeDueDate = null;
    if (due_date && due_date !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(due_date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (due_date < todayStr) {
        return res.status(400).json({ message: 'Due date cannot be in the past. Please select today or a future date.' });
      }
      safeDueDate = due_date;
    }
    
    // Convert undefined to null for optional fields
    const safeDescription = description !== undefined ? description : null;
    
    const { reference_file_data, reference_file_name } = req.body;
    const safeRefData = reference_file_data || null;
    const safeRefName = reference_file_name || null;

    // Stamp the report with the current active batch year
    const [batchRows] = await pool.execute('SELECT year FROM current_batch WHERE id = 1');
    const batchYear = batchRows.length > 0 ? batchRows[0].year : new Date().getFullYear();

    const [result] = await pool.execute(
      'INSERT INTO reports (title, description, department, due_date, created_by, reference_file_data, reference_file_name, batch_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, safeDescription, department, safeDueDate, req.user.id, safeRefData, safeRefName, batchYear]
    );

    const [reports] = await pool.execute('SELECT * FROM reports WHERE id = ?', [result.insertId]);
    reports[0].submissions = [];
    res.status(201).json(reports[0]);
  } catch (error) {
    console.error('Add report error:', error.message, error.code);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report (admin only)
app.put('/api/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, department, due_date, status } = req.body;
    
    if (due_date && due_date !== '') {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (due_date < todayStr) {
        return res.status(400).json({ message: 'Due date cannot be in the past. Please select today or a future date.' });
      }
    }

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
    
    const { file_data, file_name } = req.body;
    if (existing.length > 0) {
      // Update existing submission
      await pool.execute(
        'UPDATE report_submissions SET content = ?, file_data = ?, file_name = ? WHERE report_id = ? AND instructor_id = ?',
        [content, file_data || null, file_name || null, id, req.user.id]
      );
    } else {
      // Create new submission
      await pool.execute(
        'INSERT INTO report_submissions (report_id, instructor_id, content, file_data, file_name) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, content, file_data || null, file_name || null]
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

// Delete report (admin only)
app.delete('/api/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM reports WHERE id = ?', [id]);
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to report
app.post('/api/reports/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    const [result] = await pool.execute(
      'INSERT INTO report_comments (report_id, user_id, text) VALUES (?, ?, ?)',
      [id, req.user.id, text.trim()]
    );
    const [rows] = await pool.execute(
      `SELECT rc.*, u.name as user_name, u.role, u.department
       FROM report_comments rc
       JOIN users u ON rc.user_id = u.id
       WHERE rc.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== CONVERSATION & MESSAGE ROUTES =====

// Helper to auto-ensure all admin/instructor users are in the "All Instructors" group chat
async function ensureAllInstructorsGroup() {
  try {
    let [rows] = await pool.execute(
      "SELECT id FROM conversations WHERE is_group = TRUE AND (group_name = 'All Instructors' OR group_name LIKE '%Instructor%') LIMIT 1"
    );
    let groupId;
    if (rows.length > 0) {
      groupId = rows[0].id;
    } else {
      groupId = 'group-all-instructors';
      try {
        await pool.execute(
          "INSERT INTO conversations (id, is_group, group_name) VALUES (?, TRUE, 'All Instructors')",
          [groupId]
        );
      } catch (_) {}
    }
    const [staff] = await pool.execute("SELECT id FROM users WHERE role IN ('admin','instructor')");
    for (const s of staff) {
      await pool.execute(
        'INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
        [groupId, s.id]
      );
    }
    return groupId;
  } catch (err) {
    console.warn('ensureAllInstructorsGroup warning:', err?.message);
  }
}

// Get all conversations for current user
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'instructor') {
      await ensureAllInstructorsGroup();
    }

    // Get one-on-one conversations
    const [directConversations] = await pool.execute(`
      SELECT c.*,
        u1.name as participant_1_name, u1.profilePicture as participant_1_picture,
        u2.name as participant_2_name, u2.profilePicture as participant_2_picture,
        ls.name as last_sender_name,
        FALSE as is_group
      FROM conversations c
      JOIN users u1 ON c.participant_1_id = u1.id
      JOIN users u2 ON c.participant_2_id = u2.id
      LEFT JOIN users ls ON c.last_sender_id = ls.id
      WHERE (c.participant_1_id = ? OR c.participant_2_id = ?) AND (c.is_group = FALSE OR c.is_group IS NULL)
      ORDER BY c.last_message_time DESC
    `, [req.user.id, req.user.id]);

    // Get group conversations where user is a participant
    const [groupConversations] = await pool.execute(`
      SELECT c.*,
        NULL as participant_1_name, NULL as participant_1_picture,
        NULL as participant_2_name, NULL as participant_2_picture,
        ls.name as last_sender_name,
        c.is_group, c.group_name
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN users ls ON c.last_sender_id = ls.id
      WHERE cp.user_id = ? AND c.is_group = TRUE
      ORDER BY c.last_message_time DESC
    `, [req.user.id]);

    // Format direct conversations and deduplicate by partner ID
    const seenPartners = new Set();
    const formattedDirectConversations = [];

    for (const c of directConversations) {
      const isUserParticipant1 = c.participant_1_id === req.user.id;
      const partnerId = isUserParticipant1 ? c.participant_2_id : c.participant_1_id;
      const otherParticipantName = isUserParticipant1 ? c.participant_2_name : c.participant_1_name;

      if (!seenPartners.has(partnerId)) {
        seenPartners.add(partnerId);
        formattedDirectConversations.push({
          ...c,
          with: otherParticipantName,
          participants: [c.participant_1_id, c.participant_2_id],
          isGroup: false
        });
      }
    }

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
    const u1 = Number(req.user.id);
    const u2 = Number(withUserId);

    if (!u2 || isNaN(u2)) {
      return res.status(400).json({ message: 'Invalid target user' });
    }

    // Check if direct conversation already exists between u1 and u2
    const [existing] = await pool.execute(
      'SELECT * FROM conversations WHERE (is_group = FALSE OR is_group IS NULL) AND ((participant_1_id = ? AND participant_2_id = ?) OR (participant_1_id = ? AND participant_2_id = ?))',
      [u1, u2, u2, u1]
    );

    if (existing.length > 0) {
      const [otherUsers] = await pool.execute('SELECT id, name FROM users WHERE id = ?', [u2]);
      return res.json({
        ...existing[0],
        with: otherUsers[0]?.name || 'Unknown',
        participants: [existing[0].participant_1_id, existing[0].participant_2_id]
      });
    }

    // Create new direct conversation
    const convId = [u1, u2].sort((a, b) => a - b).join('-');
    await pool.execute(
      'INSERT INTO conversations (id, is_group, participant_1_id, participant_2_id) VALUES (?, FALSE, ?, ?)',
      [convId, u1, u2]
    );

    const [newConvs] = await pool.execute('SELECT * FROM conversations WHERE id = ?', [convId]);
    const [otherUsers] = await pool.execute('SELECT id, name FROM users WHERE id = ?', [u2]);

    res.status(201).json({
      ...newConvs[0],
      with: otherUsers[0]?.name || 'Unknown',
      participants: [u1, u2]
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create the stable "All Instructors" group (idempotent)
app.get('/api/conversations/all-instructors-group', authenticateToken, async (req, res) => {
  try {
    const groupId = await ensureAllInstructorsGroup();
    res.json({ id: groupId, groupName: 'All Instructors' });
  } catch (error) {
    console.error('Get/create All Instructors group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a user to an existing group conversation + post a system "joined" message
app.post('/api/conversations/:id/add-participant', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    // Verify group exists
    const [conv] = await pool.execute('SELECT id, group_name FROM conversations WHERE id = ? AND is_group = TRUE', [id]);
    if (conv.length === 0) return res.status(404).json({ message: 'Group not found' });

    // Add participant (ignore if already a member)
    await pool.execute(
      'INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
      [id, userId]
    );

    // Get the new user's name for the system message
    const [userRows] = await pool.execute('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRows[0]?.name || 'Someone';

    // Post a system message so everyone in the group sees the "joined" notification
    await pool.execute(
      `INSERT INTO messages (conversation_id, sender_id, text, type, created_at)
       VALUES (?, ?, ?, 'system', NOW())`,
      [id, userId, `${userName} joined the group`]
    );

    res.json({ message: 'Participant added', conversationId: id, userId });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    let { id } = req.params;
    let targetConvIds = [id];
    let isAuthorized = false;

    // Handle synthetic direct conversation IDs like "1-2"
    if (typeof id === 'string' && id.includes('-') && !isNaN(parseInt(id.split('-')[0]))) {
      const parts = id.split('-').map(p => parseInt(p));
      const u1 = parts[0];
      const u2 = parts[1];
      if (req.user.id === u1 || req.user.id === u2) {
        isAuthorized = true;
      }
      const [convs] = await pool.execute(
        'SELECT id FROM conversations WHERE (participant_1_id = ? AND participant_2_id = ?) OR (participant_1_id = ? AND participant_2_id = ?)',
        [u1, u2, u2, u1]
      );
      if (convs.length > 0) {
        targetConvIds = Array.from(new Set([id, `${u1}-${u2}`, `${u2}-${u1}`, ...convs.map(c => String(c.id))]));
      } else {
        targetConvIds = Array.from(new Set([id, `${u1}-${u2}`, `${u2}-${u1}`]));
      }
    } else {
      // Normal integer or string group ID check
      const [conversationCheck] = await pool.execute(
        'SELECT is_group, participant_1_id, participant_2_id FROM conversations WHERE id = ?',
        [id]
      );
      
      if (conversationCheck.length > 0 && conversationCheck[0].is_group) {
        const [participants] = await pool.execute(
          'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
          [id, req.user.id]
        );
        isAuthorized = participants.length > 0;
      } else if (conversationCheck.length > 0) {
        const p1 = conversationCheck[0].participant_1_id;
        const p2 = conversationCheck[0].participant_2_id;
        if (req.user.id === p1 || req.user.id === p2) {
          isAuthorized = true;
          if (p1 && p2) {
            targetConvIds = Array.from(new Set([id, `${p1}-${p2}`, `${p2}-${p1}`]));
          }
        }
      } else {
        const [conversations] = await pool.execute(
          'SELECT * FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
          [id, req.user.id, req.user.id]
        );
        isAuthorized = conversations.length > 0;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 100, 200);

    const placeholders = targetConvIds.map(() => '?').join(',');
    const [messages] = await pool.execute(`
      SELECT * FROM (
        SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id IN (${placeholders})
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      ) latest
      ORDER BY latest.created_at ASC
    `, targetConvIds);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit message
app.put('/api/conversations/:conversationId/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { text } = req.body;

    // Verify user is part of this conversation (supports both DMs and group chats)
    const [convRows] = await pool.execute('SELECT is_group FROM conversations WHERE id = ?', [conversationId]);
    if (convRows.length === 0) return res.status(404).json({ message: 'Conversation not found' });
    let isAuthorized = false;
    if (convRows[0].is_group) {
      const [p] = await pool.execute('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [conversationId, req.user.id]);
      isAuthorized = p.length > 0;
    } else {
      const [d] = await pool.execute('SELECT 1 FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)', [conversationId, req.user.id, req.user.id]);
      isAuthorized = d.length > 0;
    }

    if (!isAuthorized) {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/Remove reaction
app.post('/api/conversations/:conversationId/messages/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    // Validate emoji: must be a non-empty string ≤ 8 characters (covers all multi-codepoint emoji)
    if (!emoji || typeof emoji !== 'string' || emoji.trim().length === 0 || emoji.length > 8) {
      return res.status(400).json({ message: 'Invalid emoji' });
    }

    // Verify user is part of this conversation (DM or group)
    if (!(await userCanAccessConversation(conversationId, userId))) {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
app.post('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let targetConvId = id;
    const { text, type, image_url, file_url, file_name, audio_url, duration } = req.body;

    // Reject oversized text messages (64 KB is more than enough for any real message)
    if (text && String(text).length > 65536) {
      return res.status(400).json({ message: 'Message text is too long (max 64 KB).' });
    }

    let isAuthorized = false;

    // Handle synthetic direct conversation IDs like "1-2"
    if (typeof id === 'string' && id.includes('-') && !isNaN(parseInt(id.split('-')[0]))) {
      const parts = id.split('-').map(p => parseInt(p));
      const u1 = parts[0];
      const u2 = parts[1];
      if (req.user.id === u1 || req.user.id === u2) {
        isAuthorized = true;
      }
      const [existing] = await pool.execute(
        'SELECT id FROM conversations WHERE (participant_1_id = ? AND participant_2_id = ?) OR (participant_1_id = ? AND participant_2_id = ?)',
        [u1, u2, u2, u1]
      );
      if (existing.length > 0) {
        targetConvId = existing[0].id;
      } else {
        const sortedId = [u1, u2].sort((a, b) => a - b).join('-');
        await pool.execute(
          'INSERT INTO conversations (id, is_group, participant_1_id, participant_2_id) VALUES (?, FALSE, ?, ?)',
          [sortedId, u1, u2]
        );
        targetConvId = sortedId;
      }
    } else {
      // Check if this is a group conversation
      const [conversationCheck] = await pool.execute(
        'SELECT is_group FROM conversations WHERE id = ?',
        [id]
      );

      if (conversationCheck.length > 0 && conversationCheck[0].is_group) {
        const [participants] = await pool.execute(
          'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
          [id, req.user.id]
        );
        isAuthorized = participants.length > 0;
      } else {
        const [conversations] = await pool.execute(
          'SELECT * FROM conversations WHERE id = ? AND (participant_1_id = ? OR participant_2_id = ?)',
          [id, req.user.id, req.user.id]
        );
        isAuthorized = conversations.length > 0;
      }
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
      [targetConvId, req.user.id, safeText, safeType, safeImageUrl, safeFileUrl, safeFileName, safeAudioUrl, safeDuration]
    );

    // Update conversation last message
    const lastMessagePreview = safeText || 
      (safeType === 'image' ? '📷 Image' : 
       safeType === 'file' ? `📎 ${safeFileName || 'File'}` : 
       safeType === 'voice' ? '🎤 Voice message' : 'Message');

    try {
      await pool.execute(
        'UPDATE conversations SET last_message = ?, last_message_time = NOW(), last_sender_id = ? WHERE id = ?',
        [lastMessagePreview, req.user.id, targetConvId]
      );
    } catch (e) {
      await pool.execute(
        'UPDATE conversations SET last_message = ?, last_message_time = NOW() WHERE id = ?',
        [lastMessagePreview, targetConvId]
      );
    }
    
    const [messages] = await pool.execute(`
      SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);

    res.status(201).json(messages[0]);
  } catch (error) {
    console.error('Send message error:', error.sqlMessage || error.message, error.code);
    if (error.code === 'ER_NET_PACKET_TOO_LARGE' || (error.message && error.message.includes('packet'))) {
      return res.status(413).json({ message: 'Image is too large. Please send a smaller image.' });
    }
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
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

// Clear all messages in a conversation (keeps conversation, clears last_message preview)
app.delete('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isAuthorized = await userCanAccessConversation(id, req.user.id);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await pool.execute('DELETE FROM messages WHERE conversation_id = ?', [id]);
    await pool.execute(
      'UPDATE conversations SET last_message = NULL, last_message_time = NULL, last_sender_id = NULL WHERE id = ?',
      [id]
    );
    res.json({ message: 'Messages cleared' });
  } catch (error) {
    console.error('Clear messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== CALL MANAGEMENT =====

// Get incoming calls for current user (must be before /:id route)
app.get('/api/calls/incoming', authenticateToken, async (req, res) => {
  try {
    const [calls] = await pool.execute(
      `SELECT c.*, u.name as caller_name, conv.participant_1_id, conv.participant_2_id, conv.is_group, conv.group_name
       FROM calls c
       JOIN users u ON c.caller_id = u.id
       JOIN conversations conv ON c.conversation_id = conv.id
       WHERE c.receiver_id = ? AND c.status = 'ringing' AND c.ended_at IS NULL`,
      [req.user.id]
    );
    res.json(calls);
  } catch (error) {
    console.error('Get incoming calls error:', error);
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
    const [callers] = await pool.execute('SELECT name FROM users WHERE id = ?', [caller_id]);
    const caller_name = callers[0]?.name || 'Unknown';

    // Group call: create one call record per other participant, share a group_call_id
    if (conversation.is_group) {
      // Ensure group_call_id column exists
      try { await pool.execute('ALTER TABLE calls ADD COLUMN group_call_id VARCHAR(36) NULL'); } catch (_) {}

      const [participantRows] = await pool.execute(
        'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
        [conversation_id]
      );
      const others = participantRows.map(r => r.user_id).filter(id => id !== caller_id);
      if (others.length === 0) {
        return res.status(400).json({ message: 'No other participants in group.' });
      }

      const groupCallId = `grp-${Date.now()}-${caller_id}`;
      const callIds = [];

      for (const receiver_id of others) {
        // Cancel any existing ringing call with this receiver
        await pool.execute(
          `UPDATE calls SET status='ended', ended_at=NOW() WHERE status='ringing' AND ended_at IS NULL AND caller_id=? AND receiver_id=?`,
          [caller_id, receiver_id]
        );
        const [result] = await pool.execute(
          `INSERT INTO calls (conversation_id, caller_id, receiver_id, call_type, status, group_call_id, started_at)
           VALUES (?, ?, ?, ?, 'ringing', ?, NOW())`,
          [conversation_id, caller_id, receiver_id, call_type, groupCallId]
        );
        callIds.push(result.insertId);
      }

      return res.status(201).json({
        id: callIds[0],
        group_call_id: groupCallId,
        call_ids: callIds,
        conversation_id,
        caller_id,
        caller_name,
        call_type,
        is_group: true,
        status: 'ringing'
      });
    }

    const receiver_id = conversation.participant_1_id === caller_id
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    // Auto-clean stale calls: ringing > 2 min or connected > 3 hours are considered abandoned
    await pool.execute(
      `UPDATE calls SET status='ended', ended_at=NOW()
       WHERE ended_at IS NULL AND (
         (status='ringing'   AND started_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)) OR
         (status='connected' AND started_at < DATE_SUB(NOW(), INTERVAL 3 HOUR))
       )`
    );

    // Check if caller is already in a live call (ringing ≤ 2 min or connected ≤ 3 h)
    const [callerBusy] = await pool.execute(
      `SELECT id FROM calls WHERE status IN ('connected','ringing') AND ended_at IS NULL
       AND (caller_id = ? OR receiver_id = ?) LIMIT 1`,
      [caller_id, caller_id]
    );
    if (callerBusy.length > 0) {
      return res.status(409).json({ message: 'You are already in a call.' });
    }

    // Check if receiver is already in a live call
    const [receiverBusy] = await pool.execute(
      `SELECT id FROM calls WHERE status IN ('connected','ringing') AND ended_at IS NULL
       AND (caller_id = ? OR receiver_id = ?) LIMIT 1`,
      [receiver_id, receiver_id]
    );
    if (receiverBusy.length > 0) {
      return res.status(409).json({ message: 'User is currently busy on another call.' });
    }

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

    res.status(201).json({
      id: result.insertId,
      conversation_id,
      caller_id,
      receiver_id,
      caller_name,
      call_type,
      status: 'ringing'
    });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// Answer a call (accepts POST & PUT, allows answering any active call)
app.all('/api/calls/:id/answer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.json({ message: 'Call connected', call_id: id });
    }

    try {
      await pool.execute(
        'UPDATE calls SET status = "connected", connected_at = NOW() WHERE id = ?',
        [id]
      );
    } catch (_) {
      try {
        await pool.execute(
          'UPDATE calls SET status = "connected" WHERE id = ?',
          [id]
        );
      } catch (_) {}
    }

    return res.json({ message: 'Call connected', call_id: id });
  } catch (error) {
    console.error('Answer call error:', error);
    return res.json({ message: 'Call connected', call_id: req.params.id });
  }
});

// Decline/End a call
app.put('/api/calls/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rawStatus = req.body.status;
    const validCallStatuses = ['ended', 'declined', 'missed'];
    const status = validCallStatuses.includes(rawStatus) ? rawStatus : 'ended';

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

    // Group call: if only 1 participant remains connected, they are alone — end their call too
    if (call.group_call_id) {
      const [remaining] = await pool.execute(
        `SELECT id FROM calls WHERE group_call_id = ? AND status = 'connected' AND id != ?`,
        [call.group_call_id, id]
      );
      if (remaining.length === 1) {
        await pool.execute(
          `UPDATE calls SET status = 'ended', ended_at = NOW() WHERE id = ?`,
          [remaining[0].id]
        );
      }
    }

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
    res.status(500).json({ message: 'Server error' });
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

app.all('/api/calls/:id/webrtc/offer', authenticateToken, async (req, res) => {
  try {
    const call = await getCallForUser(req.params.id, req.user.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    await pool.execute(
      'UPDATE calls SET offer_sdp = ? WHERE id = ?',
      [req.body.sdp, req.params.id]
    );
    res.json({ message: 'Offer saved' });
  } catch (error) {
    console.error('Save offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.all('/api/calls/:id/webrtc/answer', authenticateToken, async (req, res) => {
  try {
    const call = await getCallForUser(req.params.id, req.user.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    await pool.execute(
      'UPDATE calls SET answer_sdp = ? WHERE id = ?',
      [req.body.sdp, req.params.id]
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

// Update current batch (admin only)
app.put('/api/current-batch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.body.year, 10);
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ message: 'Invalid batch year.' });
    }

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

// Clear all students and reports (admin only)
app.post('/api/clear-batch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Archiving is handled by POST /api/archives before this is called.
    // This route only clears the live tables for the new batch.
    await pool.execute('DELETE FROM report_submissions');
    await pool.execute('DELETE FROM reports');
    await pool.execute('DELETE FROM students');
    res.json({ message: 'Batch cleared' });
  } catch (error) {
    console.error('Clear batch error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get all enrollments
app.get('/api/enrollments', authenticateToken, async (req, res) => {
  await ensureEnrollmentColumns().catch(() => {});
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

// ── In-Memory Concurrency Queue for High-Load Enrollments ────────────────────
var MAX_CONCURRENT_ENROLLMENTS = 25;
var activeEnrollmentCount = 0;
var enrollmentTaskQueue = [];

function enqueueEnrollmentTask(taskFn) {
  return new Promise((resolve, reject) => {
    const wrappedTask = () => {
      activeEnrollmentCount++;
      taskFn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeEnrollmentCount--;
          if (enrollmentTaskQueue.length > 0) {
            const nextTask = enrollmentTaskQueue.shift();
            nextTask();
          }
        });
    };

    if (activeEnrollmentCount < MAX_CONCURRENT_ENROLLMENTS) {
      wrappedTask();
    } else {
      enrollmentTaskQueue.push(wrappedTask);
    }
  });
}

// Submit enrollment
app.post('/api/enrollments', enrollmentLimiter, async (req, res) => {
  // Ensure all required columns exist (runs once, then cached)
  await ensureEnrollmentColumns().catch(() => {});
  try {
    // ── Server-side input validation ──────────────────────────────────────
    const body = req.body || {};
    const required = ['firstName', 'lastName', 'studentId', 'email', 'contactNumber',
      'program', 'yearLevel', 'section', 'nstpComponent',
      'birthMonth', 'birthDay', 'birthYear', 'age', 'civilStatus', 'emergencyContact', 'emergencyNumber'];
    for (const field of required) {
      if (!body[field] || !String(body[field]).trim()) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }
    const sidRaw = sanitizeStr(body.studentId, 20).trim();
    const sidDigits = sidRaw.replace(/\D/g, '');
    const sid = (sidDigits.length >= 8 && sidDigits.length <= 12) ? sidDigits : sidRaw;
    if (!/^\d{8,12}$/.test(sid)) {
      return res.status(400).json({ message: 'Student ID must be between 8 and 12 digits (e.g. 202410123)' });
    }

    // Block troll / fake / spam student numbers
    const trollPatterns = [
      '01234567', '12345678', '23456789', '34567890',
      '98765432', '87654321', '76543210',
      '123456789', '987654321', '1234567890', '0987654321',
      '11223344', '12121212', '123123123', '10101010', '01010101'
    ];
    if (
      /^(\d)\1+$/.test(sid) ||
      trollPatterns.some(p => sid.includes(p)) ||
      /^0{3,}/.test(sid) ||
      /0{6,}$/.test(sid) ||
      (!sid.startsWith('20') && !sid.startsWith('19'))
    ) {
      return res.status(400).json({ message: 'Invalid Student ID: Please enter a valid, authentic CvSU Student Number (e.g., 202410001).' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    let contactDigits = String(body.contactNumber || '').replace(/\D/g, '');
    if (contactDigits.length === 12 && contactDigits.startsWith('63')) contactDigits = '0' + contactDigits.slice(2);
    if (!/^\d{11}$/.test(contactDigits)) {
      return res.status(400).json({ message: 'Contact Number must be 11 digits (e.g. 09171234567)' });
    }

    let emerDigits = String(body.emergencyNumber || '').replace(/\D/g, '');
    if (emerDigits.length === 12 && emerDigits.startsWith('63')) emerDigits = '0' + emerDigits.slice(2);
    if (!/^\d{11}$/.test(emerDigits)) {
      return res.status(400).json({ message: 'Emergency Number must be 11 digits (e.g. 09181234567)' });
    }

    const validComponents = ['CWTS', 'LTS', 'ROTC'];
    if (!validComponents.includes(body.nstpComponent)) {
      return res.status(400).json({ message: 'Invalid NSTP component' });
    }
    // Block duplicate pending enrollment for the same student ID or email
    try {
      const [dupCheck] = await pool.execute(
        "SELECT id FROM enrollments WHERE (studentId = ? OR email = ?) AND status = 'Pending'",
        [sid, sanitizeStr(body.email, 100).trim()]
      );
      if (dupCheck && dupCheck.length > 0) {
        return res.status(409).json({ message: 'An enrollment for this Student ID or Email is already pending review.' });
      }
    } catch (_) { /* table check fallback */ }
    // ──────────────────────────────────────────────────────────────────────

    const {
      firstName, lastName, middleName, fullName,
      studentId, email, contactNumber,
      birthDate, birthMonth, birthDay, birthYear,
      age, civilStatus, gender, sex,
      height, weight, facebookAccount, bloodType,
      homeAddress, address, street, municipality, province,
      program, section, yearLevel, nstpComponent,
      emergencyContact, emergencyNumber, emergencyName,
      registrationPhoto, registeredVoter, isVoter, recaptchaToken
    } = req.body;

    // Anti-Troll Security: Rate Limit by IP Address (Max 4 submissions per 15 minutes)
    const clientIp = String(req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 500);

    // Optional Google reCAPTCHA v2 Token Verification with Google API
    if (recaptchaToken) {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6Lc4LX4tAAAAAFucDfFzbLrrG7Sg6CsO8M5amlsF';
      try {
        const gRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(recaptchaToken)}&remoteip=${encodeURIComponent(clientIp)}`, { method: 'POST' });
        const gData = await gRes.json();
        if (gData && gData.success === false) {
          console.warn('Google reCAPTCHA verification failed:', gData);
        }
      } catch (gErr) {
        console.warn('Google reCAPTCHA siteverify error:', gErr.message);
      }
    }

    try {
      const [recentAttempts] = await pool.execute(
        `SELECT COUNT(*) as cnt FROM enrollments WHERE (ip_address = ? OR email = ?) AND submitted_at > NOW() - INTERVAL 15 MINUTE`,
        [clientIp, String(email).trim().toLowerCase()]
      );
      if (recentAttempts[0]?.cnt >= 4) {
        return res.status(429).json({ message: 'Security Protection: Too many enrollment attempts from this device/IP. Please wait 15 minutes.' });
      }
    } catch (_) {}

    // Email format validation (accepts both institutional and personal emails)
    const emailClean = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({ message: 'Invalid Email Address: Please enter a valid email address.' });
    }

    const name = fullName || `${lastName || ''}, ${firstName || ''} ${middleName || ''}`.trim();
    const finalGender = gender || sex;
    const finalAddress = street ? `${street}, ${municipality || ''}, ${province || ''}`.replace(/, ,/g, ',').replace(/,\s*$/, '') : (homeAddress || address);
    const finalEmergencyContact = emergencyName || emergencyContact;
    const finalVoter = registeredVoter || isVoter || 'No';

    let finalBirthDate = null;
    if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(String(birthDate))) {
      finalBirthDate = String(birthDate);
    } else if (birthYear && birthMonth && birthDay) {
      const m = String(birthMonth).padStart(2, '0');
      const d = String(birthDay).padStart(2, '0');
      const y = String(birthYear).trim();
      if (/^\d{4}$/.test(y) && /^\d{2}$/.test(m) && /^\d{2}$/.test(d)) {
        finalBirthDate = `${y}-${m}-${d}`;
      }
    }

    // Cap photo at ~5 MB base64 (≈ 6.7 MB string)
    if (registrationPhoto && String(registrationPhoto).length > 7_000_000) {
      return res.status(400).json({ message: 'Registration photo is too large. Maximum 5 MB.' });
    }
    const photo = registrationPhoto || null;

    let insertId = await enqueueEnrollmentTask(async () => {
      try {
        const [result] = await pool.execute(
          `INSERT INTO enrollments
           (student_name, firstName, lastName, middleName, email, department, studentId, contactNumber,
            birthDate, birthMonth, birthDay, birthYear, age, civilStatus,
            gender, height, weight, facebookAccount, bloodType, address,
            street, municipality, province,
            program, section, yearLevel, emergencyContact, emergencyNumber, status, registration_photo, registeredVoter, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name || null, firstName, lastName, middleName || null, String(email).trim(), nstpComponent || 'CWTS', sid, contactDigits,
            finalBirthDate, birthMonth || null, birthDay || null, birthYear || null, age || null, civilStatus || null,
            finalGender || null, height || null, weight || null, facebookAccount || null, bloodType || null, finalAddress || null,
            street || null, municipality || null, province || null,
            program, section, yearLevel, finalEmergencyContact || null, emerDigits, 'Pending', photo, finalVoter, clientIp, userAgent
          ]
        );
        return result.insertId;
      } catch (insertErr) {
        console.warn('Full enrollment insert warning:', insertErr.message);
        if (insertErr.code === 'ER_DUP_ENTRY' || insertErr.errno === 1062) {
          const err = new Error('An enrollment record with this Student ID or Email already exists.');
          err.status = 409;
          throw err;
        }
        // Self-healing fallback insert with core columns
        const [fbResult] = await pool.execute(
          `INSERT INTO enrollments (student_name, firstName, lastName, email, department, studentId, contactNumber, program, section, yearLevel, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
          [name || `${lastName}, ${firstName}`, firstName, lastName, email, nstpComponent || 'CWTS', studentId, contactNumber, program, section, yearLevel]
        );
        return fbResult.insertId;
      }
    });

    res.status(201).json({
      id: insertId,
      student_name: name || null,
      firstName, lastName,
      middleName: middleName || null,
      email,
      department: nstpComponent || 'CWTS',
      studentId,
      contactNumber,
      program,
      section,
      yearLevel,
      registeredVoter: finalVoter,
      status: 'Pending',
      submitted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Submit enrollment error:', error);
    if (error.status === 409 || error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({ message: 'An enrollment record with this Student ID or Email already exists.' });
    }
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND'))) {
      return res.status(503).json({
        message: 'Cloud Database Connection Error (ENOTFOUND): Unable to reach Aiven Cloud MySQL database. Please log into console.aiven.io to verify your MySQL service is POWERED ON, or set DB_HOST=127.0.0.1 in backend/.env to use local database.'
      });
    }
    if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED'))) {
      return res.status(503).json({
        message: 'Database Connection Refused: MySQL server is not accepting connections. Please check your DB_PORT and firewall settings.'
      });
    }
    res.status(500).json({ message: error.message || 'Failed to submit enrollment' });
  }
});

// Update enrollment status
app.put('/api/enrollments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Approved', 'Declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await pool.execute(
      'UPDATE enrollments SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [status, req.user.id, id]
    );
    auditLog(`enrollment_${status.toLowerCase()}`, req.user.id, `enrollment_id: ${id}`, req.ip || 'unknown');

    // If approved, create student record (skip if already exists)
    if (status === 'Approved') {
      const [enrollments] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [id]);
      const enrollment = enrollments[0];
      
      try {
        // Check if student with this ID already exists
        const [existingStudents] = await pool.execute(
          'SELECT id FROM students WHERE studentId = ?',
          [enrollment.studentId]
        );
        
        if (existingStudents.length === 0) {
          // Build birthdate from separate fields if available
          let birthDate = enrollment.birthDate;
          if (!birthDate && enrollment.birthMonth && enrollment.birthDay && enrollment.birthYear) {
            birthDate = `${enrollment.birthYear}-${enrollment.birthMonth.padStart(2, '0')}-${enrollment.birthDay.padStart(2, '0')}`;
          }
          
          await pool.execute(
            `INSERT INTO students (
              studentId, name, email, department, status,
              section, year, program, address, contactNumber,
              gender, birthDate, birthMonth, birthDay, birthYear,
              age, civilStatus, height, weight,
              bloodType, facebookAccount, emergencyContact, emergencyNumber,
              street, municipality, province,
              firstName, lastName, middleName, registeredVoter,
              registrationPhoto, registration_photo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              enrollment.studentId,
              enrollment.student_name,
              enrollment.email,
              enrollment.department,
              'Active',
              enrollment.section,
              enrollment.yearLevel,
              enrollment.program,
              enrollment.homeAddress || enrollment.address || null,
              enrollment.contactNumber,
              enrollment.gender || enrollment.sex || null,
              birthDate,
              enrollment.birthMonth || null,
              enrollment.birthDay   || null,
              enrollment.birthYear  || null,
              enrollment.age        || null,
              enrollment.civilStatus || null,
              enrollment.height     || null,
              enrollment.weight     || null,
              enrollment.bloodType  || null,
              enrollment.facebookAccount || null,
              enrollment.emergencyContact || enrollment.emergencyName || null,
              enrollment.emergencyNumber || null,
              enrollment.street        || null,
              enrollment.municipality  || null,
              enrollment.province      || null,
              enrollment.firstName     || null,
              enrollment.lastName      || null,
              enrollment.middleName    || null,
              enrollment.registeredVoter || 'No',
              enrollment.registration_photo || enrollment.registrationPhoto || null,
              enrollment.registration_photo || enrollment.registrationPhoto || null,
            ]
          );
        }

        // Generate and assign unique NSTP Matriculation Number: NSTP-[TRACK]-[YEAR]-[00001]
        const year = new Date().getFullYear();
        const dept = (enrollment.department || 'CWTS').toUpperCase();
        const [trackRows] = await pool.execute(
          'SELECT COUNT(*) as count FROM students WHERE department = ?',
          [dept]
        ).catch(() => [[{ count: 0 }]]);
        const trackCount = ((trackRows && trackRows[0]?.count) || 0) + 1;
        const countPadded = String(trackCount).padStart(5, '0');
        const matriculationNumber = `NSTP-${dept}-${year}-${countPadded}`;
        const token = `NSTP-${enrollment.studentId}-${matriculationNumber}`;

        await pool.execute(
          `UPDATE students SET nstp_serial_id = COALESCE(nstp_serial_id, ?), qr_token = COALESCE(qr_token, ?), id_issued_at = COALESCE(id_issued_at, NOW()) WHERE studentId = ?`,
          [matriculationNumber, token, enrollment.studentId]
        ).catch(() => {});

        await pool.execute(
          `UPDATE enrollments SET nstp_serial_id = COALESCE(nstp_serial_id, ?), qr_token = COALESCE(qr_token, ?) WHERE id = ?`,
          [matriculationNumber, token, id]
        ).catch(() => {});

      } catch (insertError) {
        console.error('Error inserting student:', insertError);
        throw insertError;
      }
    }

    const [updated] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ATTENDANCE & BATCH NSTP ID CARD ENDPOINTS ─────────────────────────────────

// GET active students with ID Card details for single/batch A4 printing
app.get('/api/students/id-cards', authenticateToken, async (req, res) => {
  try {
    const { department, section } = req.query;
    let query = "SELECT * FROM students WHERE (status IS NULL OR status = 'Active')";
    const params = [];

    // Enforce instructor isolation
    if (req.user.role === 'instructor') {
      query += ' AND department = ?';
      params.push(req.user.department);
    } else if (department && department !== 'All') {
      query += ' AND department = ?';
      params.push(department);
    }

    if (section && section !== 'All') {
      query += ' AND section = ?';
      params.push(section);
    }

    const [students] = await pool.execute(query, params);

    // Auto-fill missing serials or qr_tokens on-the-fly
    const enriched = (students || []).map((st) => {
      const yr = new Date(st.created_at || st.createdAt || Date.now()).getFullYear();
      const dep = (st.department || 'CWTS').toUpperCase();
      const padded = String(st.studentId || st.id || '0000').slice(-4);
      const serial = st.nstp_serial_id || `NSTP-${yr}-${dep}-${padded}`;
      const token = st.qr_token || `NSTP-${st.studentId || st.id}-${String(st.id || '0').padStart(4, '0')}`;
      return {
        ...st,
        nstp_serial_id: serial,
        qr_token: token,
      };
    });

    // Safe in-memory sorting by name
    enriched.sort((a, b) => {
      const nameA = (a.lastName || a.name || '').toLowerCase();
      const nameB = (b.lastName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching student ID cards:', err);
    res.status(500).json({ message: 'Failed to fetch student ID cards', error: err.message });
  }
});

// POST scan attendance via QR code token or student ID
app.post('/api/attendance/scan', authenticateToken, async (req, res) => {
  try {
    const { tokenOrId, activity_name, scan_type, notes } = req.body;
    if (!tokenOrId || !tokenOrId.trim()) {
      return res.status(400).json({ message: 'QR Code or Student ID is required' });
    }

    const cleanInput = tokenOrId.trim();

    // Look up student by qr_token, studentId, or nstp_serial_id
    let [students] = await pool.execute(
      `SELECT * FROM students WHERE qr_token = ? OR studentId = ? OR nstp_serial_id = ? LIMIT 1`,
      [cleanInput, cleanInput, cleanInput]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'No student found matching this QR code / ID' });
    }

    const student = students[0];

    // Check instructor department permission
    if (req.user.role === 'instructor' && student.department !== req.user.department) {
      return res.status(403).json({ 
        message: `Unauthorized: Student belongs to ${student.department}, but your account is assigned to ${req.user.department}` 
      });
    }

    const actName = activity_name && activity_name.trim() ? activity_name.trim() : 'NSTP General Session';
    const sType = scan_type === 'TIME_OUT' ? 'TIME_OUT' : 'TIME_IN';

    // Check if already scanned today for this exact activity and scan_type
    const [existing] = await pool.execute(
      `SELECT * FROM attendance_records 
       WHERE student_id = ? 
         AND activity_name = ? 
         AND scan_type = ? 
         AND DATE(scanned_at) = CURDATE() 
       ORDER BY scanned_at DESC LIMIT 1`,
      [student.studentId, actName, sType]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        already_scanned: true,
        message: `${student.name || student.studentId} has already ${sType === 'TIME_IN' ? 'timed-in' : 'timed-out'} today at ${new Date(existing[0].scanned_at).toLocaleTimeString()}`,
        student,
        record: existing[0]
      });
    }

    // Insert new attendance record
    const [insertResult] = await pool.execute(
      `INSERT INTO attendance_records (
        student_id, student_name, department, section,
        activity_name, scan_type, scanned_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Present', ?)`,
      [
        student.studentId,
        student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        student.department,
        student.section,
        actName,
        sType,
        req.user.id,
        notes || null
      ]
    );

    const [savedRecord] = await pool.execute(
      'SELECT * FROM attendance_records WHERE id = ?',
      [insertResult.insertId]
    );

    auditLog('attendance_scanned', req.user.id, `student: ${student.studentId}, activity: ${actName}`, req.ip || 'unknown');

    res.status(201).json({
      success: true,
      message: `Attendance logged successfully for ${student.name || student.studentId}`,
      student,
      record: savedRecord[0]
    });
  } catch (err) {
    console.error('Error scanning attendance:', err);
    res.status(500).json({ message: 'Server error processing attendance scan' });
  }
});

// GET attendance history/logs
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { department, section, activity_name, date, limit } = req.query;
    let query = `
      SELECT 
        a.*, 
        s.program, s.year, s.registration_photo, s.photo
      FROM attendance_records a
      LEFT JOIN students s ON s.studentId = a.student_id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'instructor') {
      query += ' AND a.department = ?';
      params.push(req.user.department);
    } else if (department && department !== 'All') {
      query += ' AND a.department = ?';
      params.push(department);
    }

    if (section && section !== 'All') {
      query += ' AND a.section = ?';
      params.push(section);
    }

    if (activity_name && activity_name !== 'All') {
      query += ' AND a.activity_name = ?';
      params.push(activity_name);
    }

    if (date) {
      query += ' AND DATE(a.scanned_at) = ?';
      params.push(date);
    }

    query += ' ORDER BY a.scanned_at DESC';

    const rowLimit = parseInt(limit, 10) || 500;
    query += ` LIMIT ${rowLimit}`;

    const [records] = await pool.execute(query, params);
    res.json(records);
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    res.status(500).json({ message: 'Failed to fetch attendance logs' });
  }
});

// DELETE single attendance record
app.delete('/api/attendance/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let query = 'DELETE FROM attendance_records WHERE id = ?';
    const params = [id];

    if (req.user.role === 'instructor') {
      query += ' AND department = ?';
      params.push(req.user.department);
    }

    const [result] = await pool.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found or unauthorized' });
    }

    auditLog('attendance_deleted', req.user.id, `record_id: ${id}`, req.ip || 'unknown');
    res.json({ message: 'Attendance record deleted' });
  } catch (err) {
    console.error('Error deleting attendance record:', err);
    res.status(500).json({ message: 'Failed to delete attendance record' });
  }
});

// ARCHIVE/BATCH MANAGEMENT ENDPOINTS

// GET all archived years (with instructor department isolation)
app.get('/api/archives', authenticateToken, async (req, res) => {
  try {
    const [archives] = await pool.execute(
      'SELECT * FROM archived_years ORDER BY year DESC'
    ).catch(() => [[]]);

    const isInstructor = req.user && req.user.role === 'instructor';
    const instructorDept = req.user?.department;

    res.json((archives || []).map(archive => {
      var parsedData = null;
      if (archive.data) {
        try { parsedData = JSON.parse(archive.data); } catch (e) { parsedData = null; }
      }

      let students = archive.students || 0;
      let reports = archive.reports || 0;

      if (isInstructor && instructorDept && parsedData) {
        const sData = parsedData.studentData || [];
        const rData = parsedData.reportData || [];
        const deptStudents = sData.filter(s => s.department === instructorDept);
        const deptReports = rData.filter(r => r.department === 'All' || r.department === instructorDept);
        students = deptStudents.length;
        reports = deptReports.length;
        parsedData = {
          ...parsedData,
          students: deptStudents.length,
          reports: deptReports.length,
          cwts: instructorDept === 'CWTS' ? deptStudents.length : 0,
          lts: instructorDept === 'LTS' ? deptStudents.length : 0,
          rotc: instructorDept === 'ROTC' ? deptStudents.length : 0,
        };
      }

      return {
        ...archive,
        students,
        reports,
        data: parsedData
      };
    }));
  } catch (error) {
    console.error('Get archives error:', error);
    res.json([]);
  }
});

// GET specific archived year with full data (isolated per instructor department & includes letterData)
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
    const parsedData = archive.data ? JSON.parse(archive.data) : null;

    // Use the stored snapshot
    const snapshotReports = parsedData?.reportData || (Array.isArray(parsedData?.reports) ? parsedData.reports : null);
    const snapshotStudents = parsedData?.studentData || (Array.isArray(parsedData?.students) ? parsedData.students : null);
    const snapshotLetters = parsedData?.letterData || (Array.isArray(parsedData?.letterTemplates) ? parsedData.letterTemplates : []);

    let finalStudents = snapshotStudents || [];
    let finalReports = snapshotReports || [];
    let finalLetters = snapshotLetters || [];

    if (snapshotReports === null) {
      // Query live tables if snapshot was not saved
      const [students] = await pool.execute(
        `SELECT studentId, name, department, status, program FROM students
         WHERE schoolYear LIKE ? OR schoolYear IS NULL OR schoolYear = ''
         ORDER BY name`,
        [`${year}%`]
      );

      const [reports] = await pool.execute(
        `SELECT r.id, r.title, LEFT(r.description, 300) AS description, r.department, r.status, r.due_date,
                u.name AS created_by_name,
                (SELECT COUNT(*) FROM report_submissions WHERE report_id = r.id) AS submission_count
         FROM reports r
         LEFT JOIN users u ON r.created_by = u.id
         WHERE r.batch_year = ? OR (r.batch_year IS NULL AND YEAR(r.created_at) = ?)
         ORDER BY r.created_at DESC`,
        [year, year]
      );
      finalStudents = students;
      finalReports = reports;
    }

    const isInstructor = req.user && req.user.role === 'instructor';
    const instructorDept = req.user?.department;

    if (isInstructor && instructorDept) {
      finalStudents = finalStudents.filter(s => s.department === instructorDept);
      finalReports = finalReports.filter(r => r.department === 'All' || r.department === instructorDept);
      finalLetters = finalLetters.filter(l => l.department === 'All' || l.department === instructorDept);
    }

    const cwtsCount = finalStudents.filter(s => s.department === 'CWTS').length;
    const ltsCount = finalStudents.filter(s => s.department === 'LTS').length;
    const rotcCount = finalStudents.filter(s => s.department === 'ROTC').length;

    res.json({
      ...archive,
      students: finalStudents.length,
      reports: finalReports.length,
      cwts: cwtsCount,
      lts: ltsCount,
      rotc: rotcCount,
      data: parsedData,
      studentData: finalStudents,
      reportData: finalReports,
      letterData: finalLetters
    });
  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST archive batch (admin and instructors can snapshot)
app.post('/api/archives', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { year, letterTemplates } = req.body;
    const archiveYear = parseInt(year, 10) || new Date().getFullYear();

    // Get current stats
    const [studentCount] = await pool.execute(
      'SELECT COUNT(*) as count, department FROM students WHERE status != "Inactive" GROUP BY department'
    );

    const [reportCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM reports WHERE YEAR(created_at) = ?',
      [archiveYear]
    );

    // Snapshot minimal student fields
    const [studentDataRaw] = await pool.execute(
      `SELECT studentId, name, department, status, program FROM students WHERE status != "Inactive" ORDER BY name`
    );
    const studentData = studentDataRaw;

    // Snapshot minimal report fields
    const [reportDataRaw] = await pool.execute(
      `SELECT r.id, r.title, LEFT(r.description, 300) AS description, r.department, r.status, r.due_date,
              u.name AS created_by_name,
              (SELECT COUNT(*) FROM report_submissions WHERE report_id = r.id) AS submission_count
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.batch_year = ? OR (r.batch_year IS NULL AND YEAR(r.created_at) = ?)
       ORDER BY r.created_at DESC`,
      [archiveYear, archiveYear]
    );
    const reportData = reportDataRaw;

    // Snapshot letter templates
    const letterData = Array.isArray(letterTemplates) ? letterTemplates : [];

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
        archiveYear,
        totalStudents,
        reportCount[0].count,
        JSON.stringify({
          year: archiveYear, students: totalStudents, cwts, lts, rotc, reports: reportCount[0].count,
          studentData, reportData, letterData
        })
      ]
    );

    if (req.user.role === 'admin') {
      await pool.execute(
        `INSERT INTO current_batch (id, year) VALUES (1, ?)
         ON DUPLICATE KEY UPDATE year = ?`,
        [archiveYear + 1, archiveYear + 1]
      );
    }
    
    res.json({ 
      message: `Batch ${archiveYear} archived successfully`, 
      year: archiveYear,
      students: totalStudents,
      reports: reportCount[0].count
    });
  } catch (error) {
    console.error('Archive batch error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// DELETE archived year (admin only)
app.delete('/api/archives/:year', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { year } = req.params;
    await pool.execute('DELETE FROM archived_years WHERE year = ?', [year]);
    res.json({ message: `Batch ${year} deleted from archives` });
  } catch (error) {
    console.error('Delete archive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Audit log viewer — admin only
app.get('/api/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const [logs] = await pool.execute(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT ${limit}`
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Real-time Active Sessions & Telemetry Tracking ────────────────────────────
var activeSessions = new Map(); // sessionId -> { visitorId, user, page, lastSeen, ip }
var totalUniqueVisitors = new Set(); // persistent unique visitor IDs in memory
var visitorLogFile = path.join(__dirname, 'visitors_telemetry.json');

// Load stored visitors telemetry on server startup
try {
  if (fs.existsSync(visitorLogFile)) {
    var rawData = fs.readFileSync(visitorLogFile, 'utf8');
    var parsed = JSON.parse(rawData);
    if (Array.isArray(parsed.visitors)) {
      parsed.visitors.forEach(function(id) { totalUniqueVisitors.add(id); });
    }
  }
} catch (e) {
  console.warn('[Telemetry] Error reading visitors file:', e.message);
}

function saveTelemetry() {
  try {
    fs.writeFileSync(visitorLogFile, JSON.stringify({
      visitors: Array.from(totalUniqueVisitors),
      updatedAt: new Date().toISOString()
    }, null, 2));
  } catch (e) { /* ignore */ }
}

// Clean up stale sessions (> 25s since last ping) every 10 seconds
setInterval(function() {
  var now = Date.now();
  for (var entry of activeSessions.entries()) {
    var sid = entry[0];
    var data = entry[1];
    if (now - data.lastSeen > 25000) {
      activeSessions.delete(sid);
    }
  }
}, 10000);

// ── Production-Grade Accurate Custom Web Telemetry Endpoints ────────────────

// POST /api/track — Heartbeat ping (Inserts new visitor or updates last_seen = NOW())
app.post('/api/track', async function(req, res) {
  try {
    var data = req.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) { data = {}; }
    }
    var visitor_id = data && data.visitor_id;
    var page_url = (data && data.page_url) || req.headers.referer || '/';
    var user_agent = (data && data.user_agent) || req.headers['user-agent'] || 'Unknown';

    if (!visitor_id) {
      return res.status(400).json({ error: 'visitor_id is required' });
    }

    var query = `
      INSERT INTO active_visitors (visitor_id, page_url, user_agent, last_seen)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        page_url = VALUES(page_url),
        user_agent = VALUES(user_agent),
        last_seen = NOW()
    `;

    await pool.execute(query, [
      String(visitor_id).slice(0, 36),
      String(page_url).slice(0, 500),
      String(user_agent).slice(0, 1000)
    ]);

    res.json({ success: true, message: 'Heartbeat recorded' });
  } catch (error) {
    console.error('[Telemetry] Track error:', error.message);
    res.status(500).json({ error: 'Failed to record heartbeat' });
  }
});

// POST /api/track/exit — Beacon API instant departure handler
app.post('/api/track/exit', async function(req, res) {
  try {
    var data = req.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) { data = {}; }
    }
    var visitor_id = data && data.visitor_id;

    if (visitor_id) {
      // Instantly set last_seen to 1 minute in the past so visitor drops off the 30s active count window
      await pool.execute(
        `UPDATE active_visitors
         SET last_seen = NOW() - INTERVAL 1 MINUTE
         WHERE visitor_id = ?`,
        [String(visitor_id).slice(0, 36)]
      );
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[Telemetry] Exit error:', error.message);
    res.status(200).send('OK'); // Always return 200 for Beacon exit
  }
});

// GET /api/active-count — Query active visitors within last 30 seconds & total visitors
app.get('/api/active-count', async function(req, res) {
  try {
    var activeQuery = `SELECT COUNT(*) AS activeVisitors FROM active_visitors WHERE last_seen >= NOW() - INTERVAL 30 SECOND`;
    var totalQuery = `SELECT COUNT(*) AS totalVisitors FROM active_visitors`;

    var [activeRows] = await pool.execute(activeQuery);
    var [totalRows] = await pool.execute(totalQuery);

    var activeVisitors = (activeRows[0] && activeRows[0].activeVisitors) || 0;
    var totalVisitors = (totalRows[0] && totalRows[0].totalVisitors) || 0;

    res.json({
      activeVisitors: activeVisitors,
      totalVisitors: totalVisitors,
      windowSeconds: 30,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Telemetry] Active count error:', error.message);
    res.status(500).json({ error: 'Failed to get visitor counts' });
  }
});

// Heartbeat ping endpoint (Public)
app.post('/api/telemetry/ping', function(req, res) {
  var body = req.body || {};
  var sessionId = body.sessionId;
  var visitorId = body.visitorId;
  var user = body.user;
  var page = body.page;

  if (!sessionId || !visitorId) {
    return res.status(400).json({ message: 'Missing session/visitor identity' });
  }

  var isNewVisitor = !totalUniqueVisitors.has(visitorId);
  totalUniqueVisitors.add(visitorId);
  if (isNewVisitor) {
    saveTelemetry();
  }

  activeSessions.set(sessionId, {
    visitorId: visitorId,
    user: user || null,
    page: page || '/',
    lastSeen: Date.now(),
    ip: req.ip
  });

  res.json({ success: true, totalVisitors: totalUniqueVisitors.size, activeOnlineCount: activeSessions.size });
});

// Telemetry statistics and real-time active user list (Public)
app.get('/api/telemetry/stats', async function(req, res) {
  try {
    var now = Date.now();
    var activeList = [];
    var seenUserEmails = new Set();

    for (var entry of activeSessions.entries()) {
      var sid = entry[0];
      var data = entry[1];
      if (now - data.lastSeen <= 25000) {
        var name = 'Guest Visitor';
        var role = 'Guest / Student Visitor';
        var isAuth = false;
        var email = null;
        var avatar = null;

        if (data.user && data.user.name) {
          name = data.user.name;
          role = data.user.role ? (data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1)) : 'User';
          if (data.user.program) role += ' (' + data.user.program + ')';
          isAuth = true;
          email = data.user.email;
          avatar = data.user.avatar || null;
        }

        if (email && seenUserEmails.has(email)) continue;
        if (email) seenUserEmails.add(email);

        activeList.push({
          id: sid,
          name: name,
          role: role,
          page: data.page,
          isAuth: isAuth,
          lastActiveSec: Math.max(0, Math.floor((now - data.lastSeen) / 1000))
        });
      }
    }

    var studentRows = await pool.query('SELECT COUNT(*) as count FROM students').then(function(r) { return r[0]; }).catch(function() { return [{ count: 0 }]; });
    var userRows = await pool.query('SELECT COUNT(*) as count FROM users').then(function(r) { return r[0]; }).catch(function() { return [{ count: 0 }]; });

    var dbStudents = (studentRows[0] && studentRows[0].count) || 0;
    var dbUsers = (userRows[0] && userRows[0].count) || 0;
    var totalRegisteredUsers = dbStudents + dbUsers;
    var totalUsageCount = Math.max(totalRegisteredUsers, totalUniqueVisitors.size);
    var activeOnlineCount = Math.max(activeSessions.size, activeList.length);

    res.json({
      totalVisitors: totalUsageCount,
      totalRegisteredUsers: totalRegisteredUsers,
      totalUsers: totalRegisteredUsers > 0 ? totalRegisteredUsers : totalUsageCount,
      totalStudents: dbStudents,
      activeOnlineCount: activeOnlineCount,
      activeUsers: activeList
    });
  } catch (err) {
    console.error('Telemetry stats error:', err);
    res.status(500).json({ message: 'Error retrieving telemetry' });
  }
});

app.get('/api/health', async (req, res) => {
  var dbCfg = getDbConfig();
  try {
    await pool.execute('SELECT 1');
    res.json({
      status: 'OK',
      database: 'Connected',
      dbHost: dbCfg.host,
      dbPort: dbCfg.port,
      dbName: dbCfg.database
    });
  } catch (error) {
    res.status(503).json({
      status: 'Unavailable',
      message: 'Database connection failed: ' + (error.message || 'Unable to connect to MySQL'),
      code: error.code || 'DB_ERROR',
      dbHost: dbCfg.host,
      dbPort: dbCfg.port,
      dbName: dbCfg.database
    });
  }
});

// Comprehensive System & Database Health Check Endpoint
app.get('/api/system/health', authenticateToken, async (req, res) => {
  try {
    const [[usersCnt]] = await pool.execute('SELECT COUNT(*) as cnt FROM users');
    const [[studentsCnt]] = await pool.execute('SELECT COUNT(*) as cnt FROM students');
    const [[enrollmentsCnt]] = await pool.execute('SELECT COUNT(*) as cnt FROM enrollments');
    const [[reportsCnt]] = await pool.execute('SELECT COUNT(*) as cnt FROM reports');
    const [[pendingCnt]] = await pool.execute('SELECT COUNT(*) as cnt FROM enrollments WHERE status = "Pending"');

    res.json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        usersCount: usersCnt?.cnt || 0,
        studentsCount: studentsCnt?.cnt || 0,
        pendingEnrollmentsCount: pendingCnt?.cnt || 0,
        totalEnrollmentsCount: enrollmentsCnt?.cnt || 0,
        reportsCount: reportsCnt?.cnt || 0,
      },
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        nodeVersion: process.version
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'Unhealthy', error: err.message });
  }
});

// Global error handling middleware
app.use(function(err, req, res, next) {
  console.error('Unhandled server error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// ── Health Check Endpoints for Render Deployment ──────────────────────────────
app.get('/', function(req, res) {
  res.status(200).json({ status: 'online', service: 'CvSU Naic NSTP API Server', version: '1.0.0' });
});

app.get('/api/ping', function(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  var db = getDbConfig();

  // Start listening immediately so Render health checks pass on boot
  app.listen(PORT, '0.0.0.0', function() {
    console.log('Server running on port ' + PORT);
    console.log('API available at http://localhost:' + PORT + '/api and http://127.0.0.1:' + PORT + '/api');
  });

  let dbConnected = false;
  try {
    await pool.execute('SELECT 1');
    console.log('Database connected: ' + db.host + ':' + db.port + '/' + db.database);
    dbConnected = true;
    try { await pool.execute('SET GLOBAL max_allowed_packet = 67108864'); } catch (_) {}
  } catch (err) {
    console.error('Database connection warning (server started in degraded mode):', err.message);
  }

  if (dbConnected) {
    console.log('Running schema migrations...');
    await Promise.all([
      ensureAuditLogs(),
      ensureActiveVisitorsTable(),
      ensureCallsTableAndColumns(),
      ensureMessageRestoreColumns(),
      ensureConversationSchema(),
      ensureWebRTCColumns(),
      ensureUserColumns(),
      ensureStudentColumns(),
      ensureEnrollmentColumns(),
      ensureReportsDeptColumn(),
      ensureReportsBatchYear(),
      ensureReportComments(),
      ensureConversationLastSender()
    ]).catch(function(err) {
      console.warn('Schema migration warning:', err.message);
    });
    console.log('Migrations complete.');

    // Hash any plain-text passwords left in the users table
    try {
      const [allUsers] = await pool.execute('SELECT id, password FROM users');
      for (const u of allUsers) {
        const pw = String(u.password || '');
        if (!pw.startsWith('$2a$') && !pw.startsWith('$2b$') && !pw.startsWith('$2y$')) {
          const hashed = await bcrypt.hash(pw, 12);
          await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, u.id]);
          console.log(`Hashed plain-text password for user id=${u.id}`);
        }
      }
      // Self-healing: ensure admin account always retains role='admin' and NSTP Office department
      try {
        await pool.execute("UPDATE users SET role = 'admin', department = 'NSTP Office' WHERE email = 'admin@cvsu.edu.ph'");
      } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('Password hash migration warning:', e.message);
    }
  }
}

startServer();
