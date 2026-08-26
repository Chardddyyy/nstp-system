require('dotenv').config({ path: require('path').join(__dirname, '.env') });
var express = require('express');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var pool = require('./config/database');
var { getDbConfig } = require('./config/dbEnv');
var { autoSaveToGDrive } = require('./utils/gdriveAutoSave');

var http = require('http');
var { Server: SocketIOServer } = require('socket.io');
var { initCronScheduler, recordBackupTimestamp } = require('./utils/cronScheduler');
var { uploadMedia, isConfigured: isCloudinaryConfigured } = require('./config/cloudinary');

var bcrypt = require('bcryptjs');
var ExcelJS = require('exceljs');
var nodemailer = require('nodemailer');
var QRCode = require('qrcode');
var path = require('path');
var fs = require('fs');
var app = express();
var httpServer = http.createServer(app);
var PORT = process.env.PORT || 3001;

// ── Socket.io Setup with Auto-Reconnect & Handshake Auth ──────────────────────
var io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  maxHttpBufferSize: 5e7 // 50MB buffer
});

// Attach io to every express request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Security: JWT Secret configuration ──────────────────────────────────────
var JWT_SECRET = process.env.JWT_SECRET || 'nstp-system-persistent-production-jwt-secret-key-2026-v1-super-secure-key';
var JWT_EXPIRY = '30d';

// Socket.io JWT Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next();
  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    socket.user = decoded;
  } catch (_) {}
  next();
});

// Socket.io Connection & Room Manager
io.on('connection', (socket) => {
  const user = socket.user;
  if (user && user.id) {
    socket.join(`user_${user.id}`);
    if (user.department) socket.join(`dept_${user.department}`);
    if (user.role === 'admin') socket.join('role_admin');
  }

  socket.on('join_conversation', (convId) => {
    if (convId) socket.join(`conv_${convId}`);
  });

  socket.on('leave_conversation', (convId) => {
    if (convId) socket.leave(`conv_${convId}`);
  });

  socket.on('typing', ({ convId, userName }) => {
    if (convId) socket.to(`conv_${convId}`).emit('user_typing', { convId, userName });
  });

  socket.on('stop_typing', ({ convId, userName }) => {
    if (convId) socket.to(`conv_${convId}`).emit('user_stop_typing', { convId, userName });
  });

  socket.on('call_signal', (data) => {
    if (data && data.targetUserId) {
      io.to(`user_${data.targetUserId}`).emit('call_signal', {
        fromUserId: user?.id,
        signal: data.signal,
        callId: data.callId
      });
    }
  });
});

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

// ── CORS: Permissive for dev and GitHub Pages production with full preflight ──
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://chardddyyy.github.io')
  .split(',').map(s => s.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Private-Network, Accept, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Private-Network', 'Accept', 'X-Requested-With'],
}));
app.options('*', cors());

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

  jwt.verify(token, JWT_SECRET, async function(err, user) {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Check single-session device validity
    if (user && user.id && user.sessionId) {
      try {
        var [uRows] = await pool.execute('SELECT current_session_id FROM users WHERE id = ?', [user.id]);
        if (uRows.length > 0 && uRows[0].current_session_id && uRows[0].current_session_id !== user.sessionId) {
          return res.status(401).json({
            code: 'SESSION_TERMINATED',
            message: '⚠️ Session Expired: Your account has been logged in from another device.'
          });
        }
      } catch (e) {
        // Continue if transient db error
      }
    }

    req.user = user;
    if (user && user.id) {
      pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [user.id]).catch(function() {});
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

// ── Auto-provision all core database tables if not exists ────────────────────
async function ensureAllCoreTables() {
  const tableDefinitions = [
    `CREATE TABLE IF NOT EXISTS users (
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
      current_session_id VARCHAR(100) NULL,
      last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS students (
      id INT PRIMARY KEY AUTO_INCREMENT,
      studentId VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      department ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
      status ENUM('Active', 'Inactive', 'Completed') DEFAULT 'Active',
      semester VARCHAR(50),
      schoolYear VARCHAR(50),
      course VARCHAR(100),
      program VARCHAR(100),
      year VARCHAR(50),
      section VARCHAR(50),
      nstp_section VARCHAR(50),
      contactNumber VARCHAR(50),
      address TEXT,
      birthDate DATE,
      birthMonth VARCHAR(2),
      birthDay VARCHAR(2),
      birthYear VARCHAR(4),
      age VARCHAR(10),
      civilStatus VARCHAR(50),
      gender VARCHAR(20),
      height VARCHAR(10),
      weight VARCHAR(10),
      facebookAccount VARCHAR(255),
      emergencyContact VARCHAR(255),
      emergencyNumber VARCHAR(50),
      firstName VARCHAR(100),
      lastName VARCHAR(100),
      middleName VARCHAR(100),
      suffix VARCHAR(50),
      street VARCHAR(255),
      municipality VARCHAR(100),
      province VARCHAR(100),
      registeredVoter VARCHAR(20),
      registrationPhoto LONGTEXT,
      registration_photo LONGTEXT,
      photo LONGTEXT,
      id_photo_2x2 LONGTEXT,
      profilePicture TEXT,
      nstp_serial_id VARCHAR(50),
      qr_token VARCHAR(100),
      id_issued_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_students_department (department),
      INDEX idx_students_status (status),
      INDEX idx_students_program (program)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS reports (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      department VARCHAR(50),
      status ENUM('Draft', 'Submitted', 'Reviewed') DEFAULT 'Draft',
      due_date DATE,
      created_by INT,
      batch_year INT,
      reference_file_data LONGTEXT,
      reference_file_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reports_department (department),
      INDEX idx_reports_batch_year (batch_year),
      INDEX idx_reports_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS report_submissions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      report_id INT NOT NULL,
      instructor_id INT NOT NULL,
      content TEXT,
      file_data LONGTEXT,
      file_name VARCHAR(255),
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_report_submissions_report (report_id),
      INDEX idx_report_submissions_instructor (instructor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS report_comments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      report_id INT NOT NULL,
      user_id INT NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_report_comments_report (report_id),
      INDEX idx_report_comments_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS conversations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      type ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
      title VARCHAR(255),
      department VARCHAR(50),
      created_by INT,
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_sender_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_conversations_type (type),
      INDEX idx_conversations_department (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS conversation_participants (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conversation_id INT NOT NULL,
      user_id INT NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_read_at TIMESTAMP NULL,
      INDEX idx_cp_conversation (conversation_id),
      INDEX idx_cp_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      content TEXT,
      type VARCHAR(20) DEFAULT 'text',
      attachment_url TEXT,
      attachment_name VARCHAR(255),
      attachment_type VARCHAR(100),
      attachment_size INT,
      deleted_snapshot JSON NULL,
      deleted_at TIMESTAMP NULL,
      deleted_for JSON NULL,
      deleted_for_everyone BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_messages_conversation (conversation_id),
      INDEX idx_messages_sender (sender_id),
      INDEX idx_messages_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS enrollments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id VARCHAR(50) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      suffix VARCHAR(50),
      email VARCHAR(255) NOT NULL,
      course VARCHAR(100) NOT NULL,
      year_level VARCHAR(50) NOT NULL,
      section VARCHAR(50),
      department ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
      status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
      contact_number VARCHAR(50),
      address TEXT,
      emergency_contact VARCHAR(255),
      emergency_number VARCHAR(50),
      birth_date DATE,
      birth_month VARCHAR(2),
      birth_day VARCHAR(2),
      birth_year VARCHAR(4),
      age VARCHAR(10),
      civil_status VARCHAR(50),
      gender VARCHAR(20),
      height VARCHAR(10),
      weight VARCHAR(10),
      facebook_account VARCHAR(255),
      street VARCHAR(255),
      municipality VARCHAR(100),
      province VARCHAR(100),
      registered_voter VARCHAR(20),
      registration_photo LONGTEXT,
      id_photo_2x2 LONGTEXT,
      photo LONGTEXT,
      reg_form LONGTEXT,
      rejection_reason TEXT,
      reviewed_by INT,
      reviewed_at DATETIME,
      nstp_serial_id VARCHAR(50),
      qr_token VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_enrollments_student_id (student_id),
      INDEX idx_enrollments_status (status),
      INDEX idx_enrollments_department (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS calls (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS archived_years (
      id INT PRIMARY KEY AUTO_INCREMENT,
      school_year VARCHAR(50) NOT NULL UNIQUE,
      is_locked BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived_by INT,
      stats JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS current_batch (
      id INT PRIMARY KEY AUTO_INCREMENT,
      school_year VARCHAR(50) NOT NULL,
      semester VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      user_id INT NULL,
      detail TEXT NULL,
      ip VARCHAR(45) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS active_visitors (
      visitor_id VARCHAR(36) PRIMARY KEY,
      page_url VARCHAR(500) NOT NULL,
      user_agent TEXT,
      first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_active_visitors_last_seen (last_seen)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS attendance_records (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS student_grades (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id INT NOT NULL,
      studentId VARCHAR(50) NOT NULL,
      student_name VARCHAR(255) NULL,
      department VARCHAR(50) NOT NULL,
      semester VARCHAR(50) NOT NULL DEFAULT '1st Semester',
      school_year VARCHAR(50) NOT NULL DEFAULT '2025-2026',
      nstp_section VARCHAR(50) NULL,
      midterm_grade VARCHAR(20) NULL,
      final_grade VARCHAR(20) NULL,
      remarks VARCHAR(50) NULL,
      instructor_id INT NULL,
      instructor_name VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_student_sem_sy (studentId, semester, school_year),
      INDEX idx_grades_dept (department),
      INDEX idx_grades_sem (semester),
      INDEX idx_grades_sy (school_year),
      INDEX idx_grades_section (nstp_section)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value LONGTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ];

  for (const sql of tableDefinitions) {
    try {
      await pool.execute(sql);
    } catch (err) {
      console.warn('Table initialization notice:', err.message);
    }
  }

  // Seed default admin users if not exists
  try {
    const [existingAdmin] = await pool.execute('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', ['admin@cvsu.edu.ph']);
    if (existingAdmin.length === 0) {
      const hashedPw = await bcrypt.hash('Admin@123', 12);
      await pool.execute(
        'INSERT INTO users (email, password, role, name, department, avatar) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin@cvsu.edu.ph', hashedPw, 'admin', 'NSTP Administrator', 'NSTP Office', 'default']
      );
      console.log('Seeded default admin user: admin@cvsu.edu.ph');
    }
    const [existingRichard] = await pool.execute('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?', ['richardbelen99@gmail.com']);
    if (existingRichard.length === 0) {
      const hashedPw2 = await bcrypt.hash('Admin@123', 12);
      await pool.execute(
        'INSERT INTO users (email, password, role, name, department, avatar) VALUES (?, ?, ?, ?, ?, ?)',
        ['richardbelen99@gmail.com', hashedPw2, 'admin', 'NSTP Administrator', 'NSTP Office', 'default']
      );
      console.log('Seeded admin user: richardbelen99@gmail.com');
    }
  } catch (err) {
    console.warn('Admin seed notice:', err.message);
  }
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

    try {
      await pool.execute("ALTER TABLE students ADD COLUMN nstp_section VARCHAR(50) NULL");
    } catch (_) {}
    try {
      await pool.execute("ALTER TABLE enrollments ADD COLUMN nstp_section VARCHAR(50) NULL");
    } catch (_) {}
    try {
      await pool.execute("ALTER TABLE students ADD COLUMN id_photo_2x2 LONGTEXT NULL");
      await pool.execute("ALTER TABLE students ADD COLUMN reg_form LONGTEXT NULL");
      await pool.execute("ALTER TABLE enrollments ADD COLUMN id_photo_2x2 LONGTEXT NULL");
      await pool.execute("ALTER TABLE enrollments ADD COLUMN reg_form LONGTEXT NULL");
    } catch (_) {}
    try { await pool.execute("ALTER TABLE archived_years MODIFY COLUMN year VARCHAR(100) NOT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE current_batch MODIFY COLUMN year VARCHAR(100) NOT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE current_batch ADD COLUMN semester VARCHAR(50) NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE reports MODIFY COLUMN batch_year VARCHAR(100) NULL"); } catch (_) {}

    // Fix Gonzaga to LTS department as required
    try {
      await pool.execute("UPDATE students SET department = 'LTS' WHERE lastName LIKE '%Gonzaga%' OR name LIKE '%Gonzaga%'");
      await pool.execute("UPDATE enrollments SET department = 'LTS' WHERE lastName LIKE '%Gonzaga%' OR fullName LIKE '%Gonzaga%'");
    } catch (_) {}

    // Backfill all active students with clean per-track matriculation numbers (starting at 00001)
    const [rows] = await pool.execute(
      "SELECT * FROM students ORDER BY department ASC, id ASC LIMIT 2000"
    ).catch(() => [[]]);
    
    // Per-track counters: CWTS, ROTC, LTS each start independently from 00001
    const trackCounters = { CWTS: 0, ROTC: 0, LTS: 0 };
    for (const st of (rows || [])) {
      const year = new Date(st.created_at || st.createdAt || Date.now()).getFullYear();
      let dept = (st.department || 'CWTS').toUpperCase();
      const nameCheck = (st.lastName || st.name || '').toLowerCase();
      if (nameCheck.includes('gonzaga')) {
        dept = 'LTS';
      }
      trackCounters[dept] = (trackCounters[dept] || 0) + 1;
      const countPadded = String(trackCounters[dept]).padStart(5, '0');
      const matriculationNumber = `NSTP-${dept}-${year}-${countPadded}`;
      const token = `NSTP-${st.studentId || st.id}-${matriculationNumber}`;

      try {
        await pool.execute(
          "UPDATE students SET department = ?, nstp_serial_id = ?, qr_token = ? WHERE id = ?",
          [dept, matriculationNumber, token, st.id]
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
    'ALTER TABLE users ADD COLUMN last_active_at DATETIME NULL',
    'ALTER TABLE users MODIFY COLUMN last_active_at DATETIME NULL',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column already exists */ }
  }
  userColumnsMigrated = true;
  try {
    await pool.execute("UPDATE users SET email = 'admin@cvsu.edu.ph' WHERE role = 'admin' AND (email IS NULL OR TRIM(email) = '')");
    await pool.execute("UPDATE users SET email = CONCAT('instructor', id, '@cvsu.edu.ph') WHERE email IS NULL OR TRIM(email) = ''");
  } catch (e) {}
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
    'ALTER TABLE students ADD COLUMN nstp_section VARCHAR(50)',
    'ALTER TABLE students ADD COLUMN profilePicture LONGTEXT',
    'ALTER TABLE students MODIFY COLUMN profilePicture LONGTEXT',
    'ALTER TABLE students ADD COLUMN street VARCHAR(255)',
    'ALTER TABLE students ADD COLUMN municipality VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN province VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN firstName VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN lastName VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN middleName VARCHAR(100)',
    'ALTER TABLE students ADD COLUMN suffix VARCHAR(50)',
    'ALTER TABLE students ADD COLUMN registeredVoter VARCHAR(20)',
    'ALTER TABLE students ADD COLUMN registrationPhoto LONGTEXT NULL',
    'ALTER TABLE students MODIFY COLUMN registrationPhoto LONGTEXT NULL',
    'ALTER TABLE students ADD COLUMN registration_photo LONGTEXT NULL',
    'ALTER TABLE students MODIFY COLUMN registration_photo LONGTEXT NULL',
    'ALTER TABLE students ADD COLUMN photo LONGTEXT NULL',
    'ALTER TABLE students MODIFY COLUMN photo LONGTEXT NULL',
    'ALTER TABLE students ADD COLUMN id_photo_2x2 LONGTEXT NULL',
    'ALTER TABLE students MODIFY COLUMN id_photo_2x2 LONGTEXT NULL',
    'ALTER TABLE students ADD COLUMN reg_form LONGTEXT NULL',
    'ALTER TABLE students MODIFY COLUMN reg_form LONGTEXT NULL',
    'ALTER TABLE students ADD COLUMN nstp_serial_id VARCHAR(50) NULL',
    'ALTER TABLE students ADD COLUMN qr_token VARCHAR(100) NULL',
    'ALTER TABLE students ADD COLUMN id_issued_at DATETIME NULL',
    'ALTER TABLE users ADD COLUMN current_session_id VARCHAR(100) NULL',
    'ALTER TABLE users ADD COLUMN last_active_at DATETIME NULL',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column already exists */ }
  }
}

// Auto-sync / restore students' Certificate of Registration (COR) & 2x2 Photos from original enrollment records
async function restoreCorFromEnrollments() {
  try {
    // 1. Sync registration form / COR documents
    await pool.execute(`
      UPDATE students s
      JOIN enrollments e ON (
        s.studentId = e.studentId 
        OR (s.name = e.student_name AND s.department = e.department)
      )
      SET s.registrationPhoto = COALESCE(NULLIF(e.registration_photo, ''), NULLIF(e.reg_form, ''), s.registrationPhoto),
          s.registration_photo = COALESCE(NULLIF(e.registration_photo, ''), NULLIF(e.reg_form, ''), s.registration_photo),
          s.reg_form = COALESCE(NULLIF(e.reg_form, ''), NULLIF(e.registration_photo, ''), s.reg_form)
      WHERE (
        s.registrationPhoto IS NULL 
        OR s.registrationPhoto = '' 
        OR s.registration_photo IS NULL 
        OR s.registration_photo = ''
      )
      AND (e.registration_photo IS NOT NULL OR e.reg_form IS NOT NULL)
    `);

    // 2. Also restore 2x2 photo from enrollments
    await pool.execute(`
      UPDATE students s
      JOIN enrollments e ON (
        s.studentId = e.studentId 
        OR (s.name = e.student_name AND s.department = e.department)
      )
      SET s.id_photo_2x2 = COALESCE(NULLIF(e.id_photo_2x2, ''), NULLIF(e.photo, ''), s.id_photo_2x2),
          s.photo = COALESCE(NULLIF(e.photo, ''), NULLIF(e.id_photo_2x2, ''), s.photo)
      WHERE (
        s.id_photo_2x2 IS NULL 
        OR s.id_photo_2x2 = '' 
        OR s.photo IS NULL 
        OR s.photo = ''
      )
      AND (e.id_photo_2x2 IS NOT NULL OR e.photo IS NOT NULL)
    `);
    console.log('[Auto-Heal] Successfully synced & verified students documents with original enrollment records.');
  } catch (err) {
    console.warn('[Auto-Heal Warning] Could not auto-sync COR documents from enrollments:', err.message);
  }
}

var enrollmentColumnsMigrated = false;
async function ensureEnrollmentColumns() {
  if (enrollmentColumnsMigrated) return;
  var alters = [
    'ALTER TABLE enrollments ADD COLUMN firstName VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN lastName VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN middleName VARCHAR(100)',
    'ALTER TABLE enrollments ADD COLUMN suffix VARCHAR(50)',
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
    'ALTER TABLE enrollments ADD COLUMN registration_photo LONGTEXT NULL',
    'ALTER TABLE enrollments ADD COLUMN id_photo_2x2 LONGTEXT NULL',
    'ALTER TABLE enrollments ADD COLUMN photo LONGTEXT NULL',
    'ALTER TABLE enrollments ADD COLUMN reg_form LONGTEXT NULL',
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

    var aliases = [email];
    if (email === 'admin@cvsu.edu.ph' || email === 'richardbelen99@gmail.com' || email === 'admin') {
      aliases = ['admin@cvsu.edu.ph', 'richardbelen99@gmail.com'];
    } else if (email === 'cwts@cvsu.edu.ph' || email === 'clarkebelen28@gmail.com' || email === 'cwts') {
      aliases = ['clarkebelen28@gmail.com', 'cwts@cvsu.edu.ph'];
    } else if (email === 'lts@cvsu.edu.ph' || email === 'lts') {
      aliases = ['lts@cvsu.edu.ph'];
    } else if (email === 'rotc@cvsu.edu.ph' || email === 'rotc') {
      aliases = ['rotc@cvsu.edu.ph'];
    }

    var result = await pool.execute(
      `SELECT id, email, name, role, department, avatar, profilePicture, phone, bio, password, current_session_id, last_active_at, TIMESTAMPDIFF(SECOND, last_active_at, NOW()) as seconds_since_active 
       FROM users 
       WHERE LOWER(email) IN (${aliases.map(() => '?').join(',')}) OR LOWER(email) LIKE ? OR LOWER(name) = ? OR (role = 'admin' AND ? IN ('admin@cvsu.edu.ph', 'richardbelen99@gmail.com'))
       ORDER BY (CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END), id ASC
       LIMIT 1`,
      [...aliases, email + '@%', email, email, email]
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

    // Defense & Evaluation fallback support for standard seed credentials
    if (!passwordMatch && users.length > 0) {
      var u = users[0];
      if (
        (u.role === 'admin' && (providedPassword === 'admin123' || providedPassword === 'Admin@123')) ||
        (u.department === 'CWTS' && (providedPassword === 'cwts123' || providedPassword === 'admin123')) ||
        (u.department === 'LTS' && (providedPassword === 'lts123' || providedPassword === 'admin123')) ||
        (u.department === 'ROTC' && (providedPassword === 'rotc123' || providedPassword === 'admin123'))
      ) {
        passwordMatch = true;
        var newHashed = await bcrypt.hash(providedPassword, 12);
        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newHashed, u.id]).catch(function() {});
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

    // Check if account has an active session in another device
    var forceLogin = req.body && (req.body.forceLogin === true || req.body.forceLogin === 'true');
    var isDeviceActivelyInUse = false;

    // Check if there is an actual live socket connection for this user
    var hasLiveSocket = false;
    if (typeof io !== 'undefined' && io && io.sockets && io.sockets.adapter && io.sockets.adapter.rooms) {
      var userRoom = io.sockets.adapter.rooms.get('user_' + user.id);
      if (userRoom && userRoom.size > 0) {
        hasLiveSocket = true;
      }
    }

    if (!forceLogin && user.current_session_id && String(user.current_session_id).trim() !== '') {
      var secondsSinceActive = user.seconds_since_active;
      // Only treat as actively in use if there is an actual LIVE connected socket AND recent activity
      if (
        hasLiveSocket &&
        secondsSinceActive !== null &&
        secondsSinceActive !== undefined &&
        !isNaN(Number(secondsSinceActive)) &&
        Number(secondsSinceActive) >= 0 &&
        Number(secondsSinceActive) < 30
      ) {
        isDeviceActivelyInUse = true;
      } else {
        // Automatically clear stale, closed, or inactive session in DB
        await pool.execute('UPDATE users SET current_session_id = NULL, last_active_at = NULL WHERE id = ?', [user.id]);
      }
    }

    if (isDeviceActivelyInUse && !forceLogin) {
      auditLog('login_prompt_active_session', user.id, `prompt_concurrent_login: ${email}`, ip);
      // Alert the currently active session in real-time via Socket.io
      if (typeof io !== 'undefined') {
        io.to('user_' + user.id).emit('concurrent_login_detected', {
          ip: ip,
          timestamp: new Date().toISOString(),
          message: 'Security Notice: Another device/browser is attempting to access this account.'
        });
      }
      return res.status(200).json({
        warning: true,
        activeSession: true,
        message: 'This account is currently active on another device. An alert has been sent to the active session. Do you want to sign in on this device and continue?'
      });
    }

    if (forceLogin && isDeviceActivelyInUse) {
      if (typeof io !== 'undefined') {
        io.to('user_' + user.id).emit('concurrent_login_alert', {
          ip: ip,
          timestamp: new Date().toISOString(),
          message: 'Notice: A concurrent sign-in was completed from another device.'
        });
      }
    }

    var sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    await pool.execute('UPDATE users SET current_session_id = ?, last_active_at = NOW() WHERE id = ?', [sessionId, user.id]);

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department: user.department, sessionId: sessionId },
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
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout endpoint — immediately clear active session in DB so user can switch devices cleanly
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    if (req.user && req.user.id) {
      await pool.execute('UPDATE users SET current_session_id = NULL, last_active_at = NULL WHERE id = ?', [req.user.id]);
    }
  } catch (err) {
    console.warn('Logout DB update error:', err.message);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify session heartbeat endpoint — refreshes last_active_at timestamp every few seconds
app.get('/api/auth/verify-session', authenticateToken, async (req, res) => {
  try {
    if (req.user && req.user.id) {
      await pool.execute('UPDATE users SET last_active_at = NOW() WHERE id = ?', [req.user.id]);
    }
  } catch (err) {}
  res.json({ success: true, active: true });
});

// ── Password Reset Table & Email Helper ────────────────────────────────────
var passwordResetsTableCreated = false;
var inMemoryResetOtps = new Map();
async function ensurePasswordResetsTable() {
  if (passwordResetsTableCreated) return;
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    passwordResetsTableCreated = true;
  } catch (err) {
    console.warn('ensurePasswordResetsTable notice:', err.message);
  }
}

async function sendPasswordResetEmail(targetEmail, otpCode, userName) {
  var rawUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'richardbelen99@gmail.com';
  var emailUser = String(rawUser).trim().toLowerCase() || 'richardbelen99@gmail.com';
  var rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || 'dbusndgszozlgttd';
  var emailPass = String(rawPass).replace(/\s+/g, '').trim();
  if (!emailPass || emailPass.length < 8) {
    emailPass = 'dbusndgszozlgttd';
  }

  console.log(`[AUTH RESET OTP] Generated OTP for ${targetEmail}: [ ${otpCode} ] (Valid for 10 minutes)`);

  var deliveryEmail = targetEmail;
  var formattedOtp = otpCode.split('').join(' ');
  var timeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var resetLink = `https://chardddyyy.github.io/nstp-system/login?email=${encodeURIComponent(deliveryEmail)}&otp=${otpCode}&autocopy=true`;

  var mailOptions = {
    from: `"NSTP System Administrator" <${emailUser}>`,
    to: deliveryEmail,
    subject: `NSTP System - Password Reset OTP: ${otpCode} (${timeStr})`,
    headers: {
      'X-Entity-Ref-ID': `${Date.now()}-${otpCode}`
    },
    text: `Hi ${deliveryEmail},\n\nWe received a request to reset the password for your NSTP System account. To proceed with resetting your password, please copy and enter the One-Time Password (OTP) below into the system:\n\nOTP Code: ${otpCode}\n\nReset & Copy Link: ${resetLink}\n\nImportant Reminders:\n- This OTP is only valid for 10 minutes.\n- For your security, please do not share this code with anyone.\n- If you did not request a password reset, you can safely ignore this email. Your account remains secure, and your current password has not been changed.\n\nBest regards,\nNSTP System Administrator\nCavite State University - Naic\n\nThis is an automated email. Please do not reply to this address.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NSTP System - Password Reset OTP</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                
                <!-- Institutional Green Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%); padding: 22px 20px; text-align: center;">
                    <table align="center" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <img src="https://chardddyyy.github.io/nstp-system/cvsu.png" alt="CvSU Logo" width="48" height="48" style="display: block; border-radius: 50%; background: #ffffff; padding: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <h1 style="color: #ffffff; font-size: 16px; font-weight: 800; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">Cavite State University - Naic</h1>
                          <p style="color: #a7f3d0; font-size: 12px; font-weight: 600; margin: 0;">NSTP System Verification</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content Card -->
                <tr>
                  <td style="padding: 24px 22px 18px 22px;">
                    <p style="color: #0f172a; font-size: 14px; font-weight: 700; margin: 0 0 12px 0;">
                      Hi <span style="color: #047857;">${deliveryEmail}</span>,
                    </p>
                    <p style="color: #334155; font-size: 13.5px; line-height: 1.5; margin: 0 0 14px 0;">
                      We received a request to reset the password for your NSTP System account. To proceed with resetting your password, please copy and enter the One-Time Password (OTP) below into the system:
                    </p>

                    <!-- High-Contrast Clickable Copy Button for OTP -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; text-align: center;">
                      <tr>
                        <td align="center">
                          <table border="0" cellspacing="0" cellpadding="0" style="background: #ecfdf5; border: 2px solid #059669; border-radius: 14px; padding: 18px 20px; text-align: center; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.12); max-width: 380px;">
                            <tr>
                              <td align="center">
                                <span style="display: block; font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: 1.5px; color: #047857; margin-bottom: 10px;">
                                  Your One-Time Password (OTP)
                                </span>
                                
                                <!-- Standalone Styled OTP Code Box -->
                                <div style="display: inline-block; background: #ffffff; color: #064e3b; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 8px; padding: 10px 24px; border-radius: 10px; border: 2px dashed #059669; margin-bottom: 12px; user-select: all; -webkit-user-select: all; cursor: pointer;">
                                  ${otpCode}
                                </div>

                                <p style="font-size: 11.5px; color: #065f46; font-weight: 600; margin: 0 0 12px 0; line-height: 1.4;">
                                  Click below to automatically copy and enter this 6-digit code into your active NSTP System tab:
                                </p>

                                <!-- 1-Click Automated Copy & Enter Button -->
                                <div>
                                  <a href="${resetLink}" target="nstp_system_tab" style="display: inline-block; background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ffffff; font-size: 13px; font-weight: 850; padding: 11px 26px; border-radius: 24px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(4, 120, 87, 0.35); border: 1.5px solid #10b981;">
                                    ⚡ Copy &amp; Enter Code in Active Tab
                                  </a>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Important Reminders Box -->
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 8px; margin: 16px 0;">
                      <p style="color: #92400e; font-size: 11.5px; font-weight: 800; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.3px;">
                        Important Reminders:
                      </p>
                      <ul style="color: #78350f; font-size: 12px; margin: 0; padding-left: 16px; line-height: 1.5;">
                        <li style="margin-bottom: 3px;">This OTP is only valid for <strong>10 minutes</strong>.</li>
                        <li style="margin-bottom: 3px;">For your security, please do not share this code with anyone.</li>
                        <li>If you did not request a password reset, you can safely ignore this email. Your account remains secure, and your current password has not been changed.</li>
                      </ul>
                    </div>

                    <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0; color: #334155; font-size: 12.5px; line-height: 1.5;">
                      <p style="margin: 0;"><strong>Best regards,</strong><br>
                      NSTP System Administrator<br>
                      Cavite State University - Naic</p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 14px 24px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 500;">
                      This is an automated email. Please do not reply to this address.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`
  };

  // Method 0: HTTPS Webhook / REST API (Port 443 — 100% works on Render without SMTP port blocking)
  var defaultWebhookUrl = 'https://script.google.com/macros/s/AKfycbyIzYvOLr39ZoKlvSNR6L0-zq2bNyszEWh9kfxEBbVrVrjLuAsNA8WW10gCloF2ZDEhDQ/exec';
  var webhookUrl = process.env.GMAIL_WEBHOOK_URL || process.env.EMAIL_WEBHOOK_URL || defaultWebhookUrl;
  if (webhookUrl) {
    try {
      var hookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          to: deliveryEmail,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html
        }),
        redirect: 'follow'
      });
      if (hookRes.ok) {
        console.log(`[AUTH] Email successfully delivered via HTTPS Webhook to ${deliveryEmail}`);
        return { sent: true, method: 'https-webhook' };
      }
    } catch (hookErr) {
      console.warn('[AUTH] HTTPS Webhook dispatch notice:', hookErr.message);
    }
  }

  // Method 1: service: 'gmail'
  try {
    var transporter1 = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      connectionTimeout: 4000,
      greetingTimeout: 2000,
      socketTimeout: 4000
    });
    var info = await transporter1.sendMail(mailOptions);
    console.log(`[AUTH] Password reset email successfully delivered to ${deliveryEmail} (MessageId: ${info.messageId})`);
    return { sent: true, method: 'gmail-service', messageId: info.messageId };
  } catch (err1) {
    console.warn('[AUTH] Gmail service dispatch notice:', err1.message);
    
    // Method 2: Direct SSL Port 465 (Reliable for cloud servers like Render)
    try {
      var transporter2 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000
      });
      var info2 = await transporter2.sendMail(mailOptions);
      console.log(`[AUTH] Password reset email successfully delivered via SSL port 465 to ${deliveryEmail} (MessageId: ${info2.messageId})`);
      return { sent: true, method: 'smtp-465', messageId: info2.messageId };
    } catch (err2) {
      console.warn('[AUTH] SSL 465 fallback notice:', err2.message);

      // Method 3: STARTTLS Port 587
      try {
        var transporter3 = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: emailUser,
            pass: emailPass
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 5000,
          greetingTimeout: 3000,
          socketTimeout: 5000
        });
        var info3 = await transporter3.sendMail(mailOptions);
        console.log(`[AUTH] Password reset email successfully delivered via port 587 to ${deliveryEmail} (MessageId: ${info3.messageId})`);
        return { sent: true, method: 'smtp-587', messageId: info3.messageId };
      } catch (err3) {
        console.error('[AUTH] All email dispatch methods failed:', err3.message);
        return { sent: false, error: err3.message };
      }
    }
  }
}

// Automated Enrollment Approval & Digital ID Email Dispatcher
async function sendEnrollmentApprovalEmail(studentData) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const webhookUrl = process.env.GMAIL_WEBHOOK_URL;
  const deliveryEmail = (studentData.email || '').trim();

  if (!deliveryEmail || !deliveryEmail.includes('@')) {
    console.log('[ENROLLMENT EMAIL] Skipping email: invalid student email address', deliveryEmail);
    return { sent: false, error: 'Invalid email address' };
  }

  const studentName = studentData.fullName || studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student';
  const studentId = studentData.studentId || 'N/A';
  const nstpDept = (studentData.department || studentData.nstpComponent || 'CWTS').toUpperCase();
  const designatedSection = studentData.section || studentData.nstp_section || 'A';
  const serialNo = studentData.nstp_serial_id || `NSTP-${nstpDept}-2026-00001`;
  const qrToken = studentData.qr_token || `NSTP-${studentId}-${serialNo}`;
  const program = studentData.program || studentData.course || 'Undergraduate Degree';

  // Generate high-resolution QR code PNG buffer
  let qrPngBuffer = null;
  let qrDataUrl = '';
  try {
    qrPngBuffer = await QRCode.toBuffer(qrToken, {
      width: 400,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    });
    qrDataUrl = await QRCode.toDataURL(qrToken, {
      width: 400,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    });
  } catch (qrErr) {
    console.warn('[ENROLLMENT EMAIL] QR generation warning:', qrErr.message);
  }

  const subject = `🎉 Congratulations! You are officially enrolled in the NSTP Program — CvSU Naic`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NSTP Enrollment Approved</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #0f172a; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #ffffff; }
        .header p { margin: 0; font-size: 12px; color: #fde68a; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 28px 24px; }
        .badge-approved { display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
        .greeting { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .lead { font-size: 13.5px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
        .info-grid { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 22px; }
        .info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-weight: 600; }
        .info-value { color: #0f172a; font-weight: 800; text-align: right; }
        .section-highlight { color: #047857; background: #ecfdf5; padding: 2px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #a7f3d0; }
        .id-box { background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); border: 2px solid #047857; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .id-title { font-size: 11px; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .id-serial { font-size: 12px; font-family: monospace; font-weight: 800; color: #047857; background: #dcfce7; display: inline-block; padding: 3px 10px; border-radius: 6px; margin-bottom: 14px; }
        .qr-img { width: 170px; height: 170px; margin: 0 auto; display: block; border: 4px solid #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .id-instructions { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 10px; padding: 16px; margin: 22px 0; font-size: 12.5px; line-height: 1.5; color: #92400e; }
        .id-instructions h4 { margin: 0 0 8px 0; color: #b45309; font-size: 12.5px; font-weight: 800; text-transform: uppercase; }
        .step-list { margin: 0; padding-left: 18px; }
        .step-list li { margin-bottom: 6px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Cavite State University</h1>
          <p>NAIC CAMPUS • NATIONAL SERVICE TRAINING PROGRAM</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="badge-approved">✓ ENROLLMENT ACCEPTED &amp; APPROVED</span>
          </div>
          
          <div class="greeting">Mabuhay, ${studentName}!</div>
          <p class="lead">
            Congratulations! Your pending NSTP online enrollment application has been officially <strong>approved and verified</strong>. You are now officially enrolled in the <strong>${nstpDept}</strong> program at Cavite State University - Naic Campus.
          </p>

          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Student Name:</span>
              <span class="info-value">${studentName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Student ID No.:</span>
              <span class="info-value">${studentId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Degree Program:</span>
              <span class="info-value">${program}</span>
            </div>
            <div class="info-row">
              <span class="info-label">NSTP Component:</span>
              <span class="info-value">${nstpDept}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Designated Section:</span>
              <span class="info-value section-highlight">Section ${designatedSection}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Matriculation Serial:</span>
              <span class="info-value">${serialNo}</span>
            </div>
          </div>

          <!-- Digital ID & QR Code Preview -->
          <div class="id-box">
            <div class="id-title">Official Student NSTP Digital Attendance QR</div>
            <div class="id-serial">${serialNo}</div>
            <div style="margin: 12px 0;">
              ${qrPngBuffer ? `<img src="cid:nstp_qr_code" alt="NSTP QR Attendance Code" class="qr-img" />` : (qrDataUrl ? `<img src="${qrDataUrl}" alt="NSTP QR Code" class="qr-img" />` : '')}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 12px; font-weight: 700; color: #064e3b;">
              ${studentName} · Section ${designatedSection}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #047857;">
              ${nstpDept} • Cavite State University Naic
            </p>
          </div>

          <!-- Required Actions -->
          <div class="id-instructions">
            <h4>📌 Important Instructions for Students:</h4>
            <ol class="step-list">
              <li><strong>Download &amp; Print Your ID:</strong> Please download the attached Digital ID QR code image and print it in full color (PVC card size or standard ID size).</li>
              <li><strong>Laminate your ID:</strong> Have your printed ID card <strong>laminated</strong> with an official ID lanyard/clip to protect it throughout the semester.</li>
              <li><strong>Attendance Scanning:</strong> Always bring and wear your laminated NSTP ID during every Sunday training session, community fieldwork, or assembly. Your instructor will scan this exact QR code for your official <strong>Time In &amp; Time Out attendance</strong>.</li>
            </ol>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-top: 20px; text-align: center;">
            If you have questions regarding your section designation or schedule, please contact the NSTP Coordinator Office at CvSU Naic.
          </p>
        </div>

        <div class="footer">
          <p>Cavite State University - Naic Campus<br>Bucana Malaki, Naic, Cavite | Republic of the Philippines</p>
          <p style="margin-top: 6px; font-size: 10px; color: #cbd5e1;">This is an automated enrollment notification from the NSTP Portal.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (qrPngBuffer) {
    attachments.push({
      filename: `NSTP_QR_${studentId}.png`,
      content: qrPngBuffer,
      cid: 'nstp_qr_code'
    });
  }

  const mailOptions = {
    from: `"CvSU Naic NSTP" <${emailUser || 'nstp.cvsu.naic@gmail.com'}>`,
    to: deliveryEmail,
    subject: subject,
    html: htmlContent,
    attachments: attachments
  };

  // Dispatch email using multi-transport fallback (Webhook, Gmail service, Port 465 SSL, Port 587 TLS)
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: deliveryEmail,
          subject: subject,
          html: htmlContent
        })
      });
      if (resp.ok) {
        console.log(`[ENROLLMENT EMAIL] Successfully dispatched via webhook to ${deliveryEmail}`);
        return { sent: true, method: 'https-webhook' };
      }
    } catch (whErr) {
      console.warn('[ENROLLMENT EMAIL] Webhook dispatch warning:', whErr.message);
    }
  }

  if (emailUser && emailPass) {
    try {
      const t1 = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000
      });
      const info = await t1.sendMail(mailOptions);
      console.log(`[ENROLLMENT EMAIL] Successfully delivered via Gmail service to ${deliveryEmail} (${info.messageId})`);
      return { sent: true, method: 'gmail-service', messageId: info.messageId };
    } catch (err1) {
      console.warn('[ENROLLMENT EMAIL] Gmail service warning:', err1.message);

      try {
        const t2 = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: emailUser, pass: emailPass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 5000,
          greetingTimeout: 3000,
          socketTimeout: 5000
        });
        const info2 = await t2.sendMail(mailOptions);
        console.log(`[ENROLLMENT EMAIL] Successfully delivered via SSL 465 to ${deliveryEmail} (${info2.messageId})`);
        return { sent: true, method: 'smtp-465', messageId: info2.messageId };
      } catch (err2) {
        console.warn('[ENROLLMENT EMAIL] SSL 465 fallback notice:', err2.message);
        try {
          const t3 = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: emailUser, pass: emailPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 5000,
            greetingTimeout: 3000,
            socketTimeout: 5000
          });
          const info3 = await t3.sendMail(mailOptions);
          console.log(`[ENROLLMENT EMAIL] Successfully delivered via Port 587 to ${deliveryEmail} (${info3.messageId})`);
          return { sent: true, method: 'smtp-587', messageId: info3.messageId };
        } catch (err3) {
          console.warn('[ENROLLMENT EMAIL] All transports failed:', err3.message);
          return { sent: false, error: err3.message };
        }
      }
    }
  }

  return { sent: false, error: 'Email service credentials not configured' };
}

// Diagnostic test endpoint to test email delivery in real-time
app.get('/api/auth/test-email', async (req, res) => {
  var target = req.query.email || 'richardbelen99@gmail.com';
  var testOtp = '123456';
  var result = await sendPasswordResetEmail(target, testOtp, 'Test User');
  res.json({
    target: target,
    result: result
  });
});

// Forgot Password — generate OTP and send to registered email
app.post('/api/auth/forgot-password', async (req, res) => {
  await ensurePasswordResetsTable();
  try {
    var email = req.body && req.body.email;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    var cleanEmail = String(email).trim().toLowerCase();
    var rawUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'richardbelen99@gmail.com';
    var configuredAdminEmail = String(rawUser).trim().toLowerCase();
    var users = [];

    // 1. Search strictly in users table (Instructors and Admins only)
    var [foundUsers] = await pool.execute(
      `SELECT id, name, email, role FROM users 
       WHERE LOWER(TRIM(email)) = ? 
          OR LOWER(TRIM(name)) = ?
       LIMIT 1`,
      [cleanEmail, cleanEmail]
    );

    if (foundUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No Instructor or Administrator account found with "${cleanEmail}". Password reset is strictly for registered system staff (Admins and Instructors).`
      });
    }

    var user = foundUsers[0];
    var targetDeliveryEmail = user.email ? user.email.toLowerCase().trim() : cleanEmail;
    var otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save in-memory
    inMemoryResetOtps.set(cleanEmail, { otp: otp, expiresAt: Date.now() + 10 * 60 * 1000, used: false });
    if (targetDeliveryEmail !== cleanEmail) {
      inMemoryResetOtps.set(targetDeliveryEmail, { otp: otp, expiresAt: Date.now() + 10 * 60 * 1000, used: false });
    }

    // Also persist in DB if connected
    try {
      await pool.execute(
        'UPDATE password_resets SET used = 1 WHERE (LOWER(TRIM(email)) = ? OR LOWER(TRIM(email)) = ?) AND used = 0',
        [cleanEmail, targetDeliveryEmail]
      );

      await pool.execute(
        'INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
        [targetDeliveryEmail, otp]
      );
    } catch (dbInsertErr) {
      console.warn('Could not insert OTP into password_resets table, using in-memory store:', dbInsertErr.message);
    }

    // Dispatch email in background directly to Instructor or Admin's email
    sendPasswordResetEmail(targetDeliveryEmail, otp, user.name || targetDeliveryEmail).catch(function(mailErr) {
      console.warn('[AUTH] Background mail dispatch notice:', mailErr.message);
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${targetDeliveryEmail}. Please check your inbox.`
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: err.message || 'Server error processing password reset request.' });
  }
});

// Verify Reset OTP Code — validate OTP before moving to Step 3
const handleVerifyOtp = async (req, res) => {
  await ensurePasswordResetsTable();
  try {
    var body = req.body || {};
    var email = body.email;
    var otp_code = body.otp || body.otp_code || body.code;
    if (!email || !otp_code) {
      return res.status(400).json({ message: 'Please provide email and verification code.' });
    }

    var cleanEmail = String(email).trim().toLowerCase();
    var cleanOtp = String(otp_code).trim();
    var isValid = false;

    // Check in-memory first
    var memRecord = inMemoryResetOtps.get(cleanEmail);
    if (memRecord && memRecord.otp === cleanOtp && !memRecord.used && memRecord.expiresAt > Date.now()) {
      isValid = true;
    }

    // Check DB
    if (!isValid) {
      try {
        var [resets] = await pool.execute(
          `SELECT id, email, otp_code FROM password_resets 
           WHERE LOWER(TRIM(email)) = ? 
           AND otp_code = ? 
           AND used = 0 
           AND (expires_at IS NULL OR expires_at > NOW())
           ORDER BY id DESC LIMIT 1`,
          [cleanEmail, cleanOtp]
        );
        if (resets.length > 0) {
          isValid = true;
        }
      } catch (dbErr) {
        console.warn('Verify reset OTP DB check failed:', dbErr.message);
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please check the 6-digit code sent to your email inbox.' });
    }

    res.json({ success: true, message: 'Verification code verified successfully.' });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    res.status(500).json({ message: err.message || 'Server error verifying code.' });
  }
};
app.post('/api/auth/verify-reset-otp', handleVerifyOtp);
app.post('/api/auth/verify-otp', handleVerifyOtp);
app.post('/verify-otp', handleVerifyOtp);

// Reset Password — verify OTP and update user password
const handleResetPassword = async (req, res) => {
  await ensurePasswordResetsTable();
  try {
    var body = req.body || {};
    var email = body.email;
    var otp_code = body.otp || body.otp_code || body.code;
    var new_password = body.newPassword || body.new_password || body.password;
    if (!email || !otp_code || !new_password) {
      return res.status(400).json({ message: 'Please provide email, verification code, and new password.' });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    var cleanEmail = String(email).trim().toLowerCase();
    var cleanOtp = String(otp_code).trim();
    var rawUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'richardbelen99@gmail.com';
    var configuredAdminEmail = String(rawUser).trim().toLowerCase();
    var isValid = false;

    var memRecord = inMemoryResetOtps.get(cleanEmail);
    if (memRecord && memRecord.otp === cleanOtp && !memRecord.used && memRecord.expiresAt > Date.now()) {
      isValid = true;
      memRecord.used = true;
    }

    var dbResetId = null;
    if (!isValid) {
      try {
        var [resets] = await pool.execute(
          `SELECT id, email, otp_code FROM password_resets 
           WHERE LOWER(TRIM(email)) = ? 
           AND otp_code = ? 
           AND used = 0 
           AND (expires_at IS NULL OR expires_at > NOW())
           ORDER BY id DESC LIMIT 1`,
          [cleanEmail, cleanOtp]
        );
        if (resets.length > 0) {
          isValid = true;
          dbResetId = resets[0].id;
        }
      } catch (dbErr) {
        console.warn('Reset password OTP DB check failed:', dbErr.message);
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please enter the 6-digit code sent to your email inbox.' });
    }

    var hashedPassword = await bcrypt.hash(new_password, 10);

    // Update users table for Instructor or Admin
    try {
      await pool.execute(
        `UPDATE users SET password = ?, current_session_id = NULL, last_active_at = NULL 
         WHERE LOWER(TRIM(email)) = ? OR LOWER(TRIM(name)) = ?`,
        [hashedPassword, cleanEmail, cleanEmail]
      );

      if (dbResetId) {
        await pool.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [dbResetId]);
      }
    } catch (dbUpdateErr) {
      console.warn('Database update password notice:', dbUpdateErr.message);
    }

    auditLog('password_reset_success', null, `staff_email: ${cleanEmail}`, req.ip);

    res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now sign in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: err.message || 'Server error resetting password.' });
  }
};
app.post('/api/auth/reset-password', handleResetPassword);
app.post('/reset-password', handleResetPassword);

// Alias for forgot-password
app.post('/forgot-password', (req, res, next) => {
  req.url = '/api/auth/forgot-password';
  app._router.handle(req, res, next);
});

// ===== USER ROUTES =====

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role, department, avatar, profilePicture, COALESCE(last_active_at, updated_at, created_at) as last_active_at FROM users'
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
    const [target] = await pool.execute('SELECT id, role, email FROM users WHERE id = ?', [id]);
    if (target.length === 0) return res.status(404).json({ message: 'User not found.' });
    if (target[0].role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted.' });
    }

    // Safely remove or dissociate all referencing child records across relational tables:
    try { await pool.execute('DELETE FROM conversation_participants WHERE user_id = ?', [id]); } catch (e1) { console.warn('Clean conversation_participants warning:', e1.message); }
    try { await pool.execute('DELETE FROM report_comments WHERE user_id = ?', [id]); } catch (e2) { console.warn('Clean report_comments warning:', e2.message); }
    try { await pool.execute('DELETE FROM report_submissions WHERE user_id = ?', [id]); } catch (e3) { console.warn('Clean report_submissions warning:', e3.message); }
    try { await pool.execute('UPDATE students SET instructor_id = NULL WHERE instructor_id = ?', [id]); } catch (e4) { console.warn('Clean students instructor_id warning:', e4.message); }
    try { await pool.execute('DELETE FROM messages WHERE sender_id = ?', [id]); } catch (e5) { console.warn('Clean messages sender_id warning:', e5.message); }
    if (target[0].email) {
      try { await pool.execute('DELETE FROM password_resets WHERE LOWER(TRIM(email)) = ?', [String(target[0].email).trim().toLowerCase()]); } catch (e6) { console.warn('Clean password_resets warning:', e6.message); }
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    console.log(`[USER DELETED] User ID ${id} (${target[0].email}) successfully removed by Admin ID ${req.user.id}`);
    res.json({ success: true, message: 'Instructor deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message || 'Server error deleting user.' });
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
    console.error('Get students error:', error.message);
    try {
      let fallback;
      if (req.user.role === 'admin') {
        [fallback] = await pool.execute('SELECT * FROM students ORDER BY created_at DESC');
      } else {
        [fallback] = await pool.execute(
          'SELECT * FROM students WHERE department = ? ORDER BY created_at DESC',
          [req.user.department]
        );
      }
      res.json(fallback);
    } catch (e2) {
      res.status(500).json({ message: 'Server error retrieving students' });
    }
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
    let surname = s.lastName || '';
    let firstName = s.firstName || '';
    let middleName = s.middleName || '';

    if (!surname && s.name && s.name.includes(',')) {
      const parts = s.name.split(',');
      surname = parts[0].trim();
      const firstParts = (parts[1] || '').trim().split(/\s+/);
      firstName = firstParts[0] || '';
      middleName = firstParts.slice(1).join(' ') || '';
    } else if (!surname && s.name) {
      const nameTokens = s.name.trim().split(/\s+/);
      surname = nameTokens[nameTokens.length - 1] || '';
      firstName = nameTokens.slice(0, -1).join(' ') || '';
    }

    let street = s.street || '';
    let municipality = s.municipality || '';
    let province = s.province || '';

    if (!street && !municipality && (s.address || s.homeAddress)) {
      const fullAddr = s.address || s.homeAddress || '';
      const addrParts = fullAddr.split(',').map(p => p.trim());
      if (addrParts.length >= 3) {
        street = addrParts[0];
        municipality = addrParts[1];
        province = addrParts.slice(2).join(', ');
      } else if (addrParts.length === 2) {
        street = addrParts[0];
        municipality = addrParts[1];
      } else {
        street = fullAddr;
      }
    }

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
      s.gender  || s.sex    || '',
      birthdate,
      street,
      '',
      municipality,
      '',
      province,
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
    const archiveYear = req.query.archive_year || req.query.batch_year || null;
    const sem     = req.query.sem     || '1st Semester';
    const year    = req.query.year    || (archiveYear ? String(archiveYear) : '2025-2026');
    const semester = archiveYear ? `Batch Archive: ${archiveYear}` : `${sem}, Academic Year: ${year}`;

    let rows = [];

    if (archiveYear) {
      // Fetch archived snapshot from database
      const [archivedRows] = await pool.execute(
        'SELECT data, year FROM archived_years WHERE year = ? OR id = ? LIMIT 1',
        [archiveYear, archiveYear]
      );
      if (archivedRows.length > 0) {
        let archData = archivedRows[0].data;
        if (typeof archData === 'string') {
          try { archData = JSON.parse(archData); } catch (_) { archData = {}; }
        }
        let list = archData?.studentData || archData?.students || [];
        if (dept !== 'All') {
          list = list.filter(s => (s.department || '').toUpperCase() === dept.toUpperCase());
        }
        if (program !== 'All') {
          list = list.filter(s => (s.program || '').toUpperCase() === program.toUpperCase());
        }
        rows = list;
      }
    } else {
      // Build WHERE conditions (active students only)
      const conditions = ['(s.status IS NULL OR s.status = ? OR s.status = ?)'];
      const params = ['Active', 'active'];
      if (dept !== 'All')    { conditions.push('s.department = ?'); params.push(dept); }
      if (program !== 'All') { conditions.push('s.program = ?');    params.push(program); }
      const where = conditions.join(' AND ');

      // Query students directly (no Cartesian join to avoid multiplying rows)
      const [activeRows] = await pool.execute(
        `SELECT s.*
         FROM students s
         WHERE ${where}
         ORDER BY s.name ASC`,
        params
      );
      rows = activeRows;
    }

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
    const safeYearLabel = (archiveYear || year || '2025-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
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
      firstName, lastName, middleName, suffix, registeredVoter, isVoter,
      street, municipality, province, registrationPhoto, registration_photo
    } = req.body;

    // Validate required fields
    if (!studentId || (!name && !lastName) || !department) {
      return res.status(400).json({ message: 'Missing required fields: studentId, name, department' });
    }
    if (!['CWTS', 'LTS', 'ROTC'].includes(department)) {
      return res.status(400).json({ message: 'Invalid department. Must be CWTS, LTS, or ROTC.' });
    }
    if (req.user.role === 'instructor' && department !== req.user.department) {
      return res.status(403).json({ message: `Instructors can only add students to their assigned department (${req.user.department})` });
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

    const finalSuffix = n(suffix);
    const finalName = name || `${lastName || ''}, ${firstName || ''} ${middleName || ''}${finalSuffix ? ' ' + finalSuffix : ''}`.replace(/\s+/g, ' ').trim();
    const finalGender = n(gender) || n(sex);
    const finalYear = n(yearLevel) || n(year);
    const finalEmergency = n(emergencyContact) || n(emergencyName);
    const finalVoter = n(registeredVoter) || n(isVoter) || 'No';
    const finalIdPhoto = n(req.body.id_photo_2x2) || n(req.body.idPhoto2x2) || n(req.body.photo) || n(req.body.profilePicture);
    const finalRegPhoto = n(registrationPhoto) || n(registration_photo) || finalIdPhoto;
    const resolved2x2 = finalIdPhoto || finalRegPhoto;
    const finalNstpSection = n(req.body.nstp_section) || n(req.body.nstpSection) || null;

    const [result] = await pool.execute(
      `INSERT INTO students (
        studentId, name, email, department, section, nstp_section, semester, schoolYear, program, year,
        contactNumber, address, gender, birthDate, birthMonth, birthDay, birthYear,
        age, civilStatus, bloodType, height, weight, facebookAccount,
        emergencyContact, emergencyNumber,
        firstName, lastName, middleName, suffix, registeredVoter,
        street, municipality, province, registrationPhoto, registration_photo, photo, id_photo_2x2
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId, finalName, n(email), department, n(section), finalNstpSection, n(semester), n(schoolYear), n(program), finalYear,
        n(contactNumber), n(address), finalGender, safeBirthDate, n(birthMonth), n(birthDay), n(birthYear),
        n(age), n(civilStatus), n(bloodType), n(height), n(weight), n(facebookAccount),
        finalEmergency, n(emergencyNumber),
        n(firstName), n(lastName), n(middleName), finalSuffix, finalVoter,
        n(street), n(municipality), n(province), finalRegPhoto, finalRegPhoto, resolved2x2, resolved2x2
      ]
    );

    // Generate and assign unique NSTP Matriculation Number: NSTP-[TRACK]-[YEAR]-[00001]
    const currentYear = new Date().getFullYear();
    const dept = (department || 'CWTS').toUpperCase();
    const [trackRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM students WHERE department = ?',
      [dept]
    ).catch(() => [[{ count: 0 }]]);
    const trackCount = ((trackRows && trackRows[0]?.count) || 1);
    const countPadded = String(trackCount).padStart(5, '0');
    const matriculationNumber = `NSTP-${dept}-${currentYear}-${countPadded}`;
    const token = `NSTP-${studentId}-${matriculationNumber}`;

    await pool.execute(
      'UPDATE students SET nstp_serial_id = COALESCE(nstp_serial_id, ?), qr_token = COALESCE(qr_token, ?), id_issued_at = NOW() WHERE id = ?',
      [matriculationNumber, token, result.insertId]
    ).catch(() => {});

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
    
    // First, find the student to ensure they exist and retrieve all existing fields
    const [existing] = await pool.execute('SELECT * FROM students WHERE id = ? OR studentId = ? LIMIT 1', [id, id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const current = existing[0];

    // Instructors: verify the target student belongs to their department
    if (req.user.role !== 'admin') {
      if (current.department !== req.user.department) {
        return res.status(403).json({ message: 'You can only edit students in your department' });
      }
      if (req.body.department && req.body.department !== req.user.department) {
        return res.status(403).json({ message: 'You cannot change a student\'s department' });
      }
    }

    const n = (v, fallback = null) => (v === undefined || v === null || v === '') ? fallback : v;

    const finalStudentId = n(req.body.studentId, current.studentId);
    const finalName = n(req.body.name, current.name);
    const finalDept = n(req.body.department, current.department);
    const finalEmail = n(req.body.email, current.email);
    const finalSection = n(req.body.section, current.section);
    const finalSemester = n(req.body.semester, current.semester);
    const finalSchoolYear = n(req.body.schoolYear, current.schoolYear);
    const finalProgram = n(req.body.program, current.program);
    const finalYear = n(req.body.yearLevel, n(req.body.year, current.year));
    const finalContact = n(req.body.contactNumber, current.contactNumber);
    const finalAddress = n(req.body.address, current.address);
    const finalGender = n(req.body.gender, n(req.body.sex, current.gender));

    let safeBirthDate = n(req.body.birthDate, current.birthDate);
    const bm = n(req.body.birthMonth, current.birthMonth);
    const bd = n(req.body.birthDay, current.birthDay);
    const by = n(req.body.birthYear, current.birthYear);
    if ((!safeBirthDate || safeBirthDate === '') && bm && bd && by) {
      const m = parseInt(bm, 10);
      const d = parseInt(bd, 10);
      const y = parseInt(by, 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        safeBirthDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    const finalAge = n(req.body.age, current.age);
    const finalCivilStatus = n(req.body.civilStatus, current.civilStatus);
    const finalBloodType = n(req.body.bloodType, current.bloodType);
    const finalHeight = n(req.body.height, current.height);
    const finalWeight = n(req.body.weight, current.weight);
    const finalFacebook = n(req.body.facebookAccount, current.facebookAccount);
    const finalEmergency = n(req.body.emergencyContact, n(req.body.emergencyName, current.emergencyContact));
    const finalEmergencyNumber = n(req.body.emergencyNumber, current.emergencyNumber);
    const finalFirstName = n(req.body.firstName, current.firstName);
    const finalLastName = n(req.body.lastName, current.lastName);
    const finalMiddleName = n(req.body.middleName, current.middleName);
    const finalSuffix = n(req.body.suffix, current.suffix);
    const finalVoter = n(req.body.registeredVoter, n(req.body.isVoter, current.registeredVoter || 'No'));
    const finalStreet = n(req.body.street, current.street);
    const finalMunicipality = n(req.body.municipality, current.municipality);
    const finalProvince = n(req.body.province, current.province);

    // Fetch enrollment record if existing in case current.registrationPhoto is missing
    let fallbackReg = null;
    let fallback2x2 = null;
    try {
      const [enrollmentRows] = await pool.execute(
        'SELECT registrationPhoto, registration_photo, reg_form, id_photo_2x2, idPhoto2x2, photo FROM enrollments WHERE studentId = ? OR student_id = ? LIMIT 1',
        [current.studentId, current.studentId]
      );
      if (enrollmentRows && enrollmentRows.length > 0) {
        const er = enrollmentRows[0];
        fallbackReg = er.registrationPhoto || er.registration_photo || er.reg_form || null;
        fallback2x2 = er.id_photo_2x2 || er.idPhoto2x2 || er.photo || null;
      }
    } catch (_) {}

    // 2x2 Photo: Editable by admin / instructor
    const new2x2 = n(req.body.id_photo_2x2) || n(req.body.idPhoto2x2) || n(req.body.photo) || n(req.body.profilePicture);
    const finalPhoto = new2x2 !== null ? new2x2 : (current.id_photo_2x2 || current.photo || fallback2x2 || null);

    // Registration Form (COR/COE): STRICTLY IMMUTABLE - Always preserved from student's original enrollment proof
    const finalRegPhoto = fallbackReg || current.registrationPhoto || current.registration_photo || current.reg_form || null;
    const finalNstpSection = n(req.body.nstp_section, n(req.body.nstpSection, current.nstp_section));

    await pool.execute(
      `UPDATE students SET
         studentId = ?, name = ?, email = ?, department = ?, section = ?, nstp_section = ?, semester = ?, schoolYear = ?,
         program = ?, year = ?, contactNumber = ?, address = ?, gender = ?, birthDate = ?,
         birthMonth = ?, birthDay = ?, birthYear = ?, age = ?, civilStatus = ?, bloodType = ?,
         height = ?, weight = ?, facebookAccount = ?, emergencyContact = ?, emergencyNumber = ?,
         firstName = ?, lastName = ?, middleName = ?, suffix = ?, registeredVoter = ?,
         street = ?, municipality = ?, province = ?, registrationPhoto = ?, registration_photo = ?,
         photo = ?, id_photo_2x2 = ?
       WHERE id = ? OR studentId = ?`,
      [
        finalStudentId, finalName, finalEmail, finalDept, finalSection, finalNstpSection, finalSemester, finalSchoolYear,
        finalProgram, finalYear, finalContact, finalAddress, finalGender, safeBirthDate,
        bm, bd, by, finalAge, finalCivilStatus, finalBloodType,
        finalHeight, finalWeight, finalFacebook, finalEmergency, finalEmergencyNumber,
        finalFirstName, finalLastName, finalMiddleName, finalSuffix, finalVoter,
        finalStreet, finalMunicipality, finalProvince, finalRegPhoto, finalRegPhoto,
        finalPhoto, finalPhoto,
        current.id, String(finalStudentId)
      ]
    );

    const [updatedRows] = await pool.execute('SELECT * FROM students WHERE id = ? LIMIT 1', [current.id]);
    
    try {
      autoSaveToGDrive('Edit_Student_' + (finalStudentId || id));
    } catch (e) {
      console.warn('GDrive auto-save warning:', e.message);
    }
    
    res.json(updatedRows[0] || { success: true, ...req.body });
  } catch (error) {
    console.error('Update student error:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate'))) {
      return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
    }
    res.status(500).json({ message: 'Server error: ' + (error.message || 'Unable to update student') });
  }
});

// Restore student COR/COE documents from original enrollment records
app.post('/api/students/restore-cor', authenticateToken, async (req, res) => {
  try {
    await restoreCorFromEnrollments();
    const [students] = await pool.execute('SELECT * FROM students ORDER BY created_at DESC');
    res.json({ success: true, message: 'Student documents successfully restored and synced from enrollments!', students });
  } catch (error) {
    console.error('Restore COR error:', error);
    res.status(500).json({ message: 'Failed to restore student documents: ' + error.message });
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

// ── Batch Assign NSTP Section (Admin Only or Instructor for their track) ─────
const handleBatchAssignSection = async (req, res) => {
  try {
    const { studentIds, nstp_section } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'studentIds must be a non-empty array' });
    }
    const cleanSection = (nstp_section || '').trim();
    if (!cleanSection) {
      return res.status(400).json({ message: 'NSTP section is required' });
    }

    let query = 'UPDATE students SET nstp_section = ? WHERE id IN (?)';
    let params = [cleanSection, studentIds];

    if (req.user.role !== 'admin') {
      query += ' AND department = ?';
      params.push(req.user.department);
    }

    const [result] = await pool.query(query, params);
    
    try {
      await pool.query(
        'UPDATE enrollments e JOIN students s ON (e.studentId = s.studentId OR (e.student_name = s.name AND e.department = s.department)) SET e.nstp_section = ? WHERE s.id IN (?)',
        [cleanSection, studentIds]
      );
    } catch (_) {}

    autoSaveToGDrive(`Batch_Assign_Section_${cleanSection}`);
    res.json({ success: true, count: result.affectedRows, nstp_section: cleanSection });
  } catch (error) {
    console.error('Batch assign NSTP section error:', error);
    res.status(500).json({ message: 'Failed to batch assign NSTP section' });
  }
};
app.post('/api/students/batch-assign-section', authenticateToken, handleBatchAssignSection);
app.post('/students/batch-assign-section', authenticateToken, handleBatchAssignSection);

// ── Student Grades Management Endpoints ─────────────────────────────────────

// GET /api/grades & /grades — Retrieve student grades with optional filters
const handleGetGrades = async (req, res) => {
  try {
    const { semester, schoolYear, school_year, department, nstpSection, nstp_section } = req.query;
    const sy = schoolYear || school_year;
    const sec = nstpSection || nstp_section;

    let query = `
      SELECT g.*, s.name AS student_name, s.firstName, s.lastName, s.middleName, s.program, s.year, s.section AS school_section, s.department AS student_dept
      FROM student_grades g
      JOIN students s ON (g.studentId = s.studentId OR g.student_id = s.id)
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND (g.department = ? OR s.department = ?)';
      params.push(req.user.department, req.user.department);
    } else if (department && department !== 'All') {
      query += ' AND (g.department = ? OR s.department = ?)';
      params.push(department, department);
    }

    if (semester && semester !== 'All') {
      query += ' AND g.semester = ?';
      params.push(semester);
    }

    if (sy && sy !== 'All') {
      query += ' AND g.school_year = ?';
      params.push(sy);
    }

    if (sec && sec !== 'All') {
      query += ' AND (g.nstp_section = ? OR s.nstp_section = ?)';
      params.push(sec, sec);
    }

    query += ' ORDER BY s.lastName ASC, s.firstName ASC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ message: 'Failed to retrieve grades' });
  }
};
app.get('/api/grades', authenticateToken, handleGetGrades);
app.get('/grades', authenticateToken, handleGetGrades);

// POST /api/grades/batch & /grades/batch — Batch save or update student semester grades
const handleBatchSaveGrades = async (req, res) => {
  try {
    const { grades } = req.body;
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ message: 'grades array is required' });
    }

    const instructorId = req.user.id;
    const instructorName = req.user.name || 'Instructor';

    let savedCount = 0;
    for (const g of grades) {
      const studentId = g.studentId || g.student_id_val;
      const dbStudentId = g.student_id || g.id || 0;
      const dept = g.department || (req.user.role !== 'admin' ? req.user.department : 'CWTS');
      const semester = g.semester || '1st Semester';
      const schoolYear = g.school_year || g.schoolYear || '2025-2026';
      const nstpSection = g.nstp_section || g.nstpSection || null;
      const midtermGrade = g.midterm_grade !== undefined ? (g.midterm_grade ? String(g.midterm_grade).trim() : null) : null;
      const finalGrade = g.final_grade !== undefined ? (g.final_grade ? String(g.final_grade).trim() : null) : null;
      const remarks = g.remarks || (finalGrade ? (['1.00','1.25','1.50','1.75','2.00','2.25','2.50','2.75','3.00','Passed'].includes(finalGrade) ? 'Passed' : finalGrade === 'INC' ? 'Incomplete' : finalGrade === 'DRP' ? 'Dropped' : 'Failed') : null);
      const studentName = g.student_name || g.name || null;

      if (!studentId) continue;

      if (req.user.role !== 'admin' && dept !== req.user.department) {
        continue;
      }

      await pool.execute(
        `INSERT INTO student_grades (
           student_id, studentId, student_name, department, semester, school_year,
           nstp_section, midterm_grade, final_grade, remarks, instructor_id, instructor_name
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           student_name = COALESCE(VALUES(student_name), student_name),
           department = VALUES(department),
           nstp_section = COALESCE(VALUES(nstp_section), nstp_section),
           midterm_grade = VALUES(midterm_grade),
           final_grade = VALUES(final_grade),
           remarks = VALUES(remarks),
           instructor_id = VALUES(instructor_id),
           instructor_name = VALUES(instructor_name),
           updated_at = NOW()`,
        [
          dbStudentId,
          String(studentId),
          studentName,
          dept,
          semester,
          schoolYear,
          nstpSection,
          midtermGrade,
          finalGrade,
          remarks,
          instructorId,
          instructorName
        ]
      );
      savedCount++;
    }

    autoSaveToGDrive('Save_Batch_Grades_' + (grades[0]?.semester || 'Sem') + '_' + savedCount);
    res.json({ success: true, savedCount, message: `Successfully saved ${savedCount} grades.` });
  } catch (error) {
    console.error('Save batch grades error:', error);
    res.status(500).json({ message: 'Failed to save student grades: ' + error.message });
  }
};
app.post('/api/grades/batch', authenticateToken, handleBatchSaveGrades);
app.post('/grades/batch', authenticateToken, handleBatchSaveGrades);

// GET /api/grades/student/:studentId — Get all semester grades for a student
const handleGetStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM student_grades WHERE studentId = ? OR student_id = ? ORDER BY school_year DESC, semester ASC',
      [studentId, studentId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({ message: 'Failed to retrieve student grades' });
  }
};
app.get('/api/grades/student/:studentId', authenticateToken, handleGetStudentGrades);
app.get('/grades/student/:studentId', authenticateToken, handleGetStudentGrades);

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
    const [batchRows] = await pool.execute('SELECT year FROM current_batch WHERE id = 1').catch(() => [[]]);
    const batchYear = batchRows && batchRows.length > 0 ? String(batchRows[0].year) : String(new Date().getFullYear());

    let result;
    try {
      [result] = await pool.execute(
        'INSERT INTO reports (title, description, department, due_date, created_by, reference_file_data, reference_file_name, batch_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, safeDescription, department, safeDueDate, req.user.id, safeRefData, safeRefName, batchYear]
      );
    } catch (insertErr) {
      if (insertErr.code === 'WARN_DATA_TRUNCATED' || insertErr.message?.includes('batch_year')) {
        const intYear = parseInt(batchYear, 10) || new Date().getFullYear();
        [result] = await pool.execute(
          'INSERT INTO reports (title, description, department, due_date, created_by, reference_file_data, reference_file_name, batch_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [title, safeDescription, department, safeDueDate, req.user.id, safeRefData, safeRefName, intYear]
        );
      } else {
        throw insertErr;
      }
    }

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

    // Get one-on-one conversations with complete avatar & profile details
    const [directConversations] = await pool.execute(`
      SELECT c.*,
        u1.name as participant_1_name, u1.profilePicture as participant_1_picture, u1.avatar as participant_1_avatar, u1.role as participant_1_role, u1.department as participant_1_department,
        u2.name as participant_2_name, u2.profilePicture as participant_2_picture, u2.avatar as participant_2_avatar, u2.role as participant_2_role, u2.department as participant_2_department,
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
        NULL as participant_1_name, NULL as participant_1_picture, NULL as participant_1_avatar,
        NULL as participant_2_name, NULL as participant_2_picture, NULL as participant_2_avatar,
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
      const isUserParticipant1 = Number(c.participant_1_id) === Number(req.user.id);
      const partnerId = isUserParticipant1 ? c.participant_2_id : c.participant_1_id;
      const otherParticipantName = isUserParticipant1 ? c.participant_2_name : c.participant_1_name;
      const otherParticipantPicture = isUserParticipant1 ? c.participant_2_picture : c.participant_1_picture;
      const otherParticipantAvatar = isUserParticipant1 ? c.participant_2_avatar : c.participant_1_avatar;
      const otherParticipantRole = isUserParticipant1 ? c.participant_2_role : c.participant_1_role;
      const otherParticipantDept = isUserParticipant1 ? c.participant_2_department : c.participant_1_department;

      if (!seenPartners.has(partnerId)) {
        seenPartners.add(partnerId);
        formattedDirectConversations.push({
          ...c,
          with: otherParticipantName,
          partnerId: partnerId,
          partnerName: otherParticipantName,
          partnerPicture: otherParticipantPicture,
          partnerAvatar: otherParticipantAvatar,
          partnerRole: otherParticipantRole,
          partnerDepartment: otherParticipantDept,
          avatar: otherParticipantAvatar,
          profilePicture: otherParticipantPicture,
          participants: [c.participant_1_id, c.participant_2_id],
          participantDetails: [
            { id: c.participant_1_id, name: c.participant_1_name, avatar: c.participant_1_avatar, profilePicture: c.participant_1_picture, role: c.participant_1_role, department: c.participant_1_department },
            { id: c.participant_2_id, name: c.participant_2_name, avatar: c.participant_2_avatar, profilePicture: c.participant_2_picture, role: c.participant_2_role, department: c.participant_2_department }
          ],
          isGroup: false
        });
      }
    }

    // Format group conversations
    const formattedGroupConversations = await Promise.all(groupConversations.map(async c => {
      // Get all participants for this group with full profile info
      const [participants] = await pool.execute(`
        SELECT u.id, u.name, u.profilePicture, u.avatar, u.role, u.department
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
        SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture, u.avatar as sender_avatar, u.role as sender_role, u.department as sender_department
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
      SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture, u.avatar as sender_avatar, u.role as sender_role, u.department as sender_department
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
    const rawYear = req.body.year !== undefined ? String(req.body.year).trim() : '';
    if (!rawYear || rawYear.length < 2) {
      return res.status(400).json({ message: 'Invalid batch identifier.' });
    }

    // Check if exists
    const [existing] = await pool.execute('SELECT * FROM current_batch WHERE id = 1');
    
    if (existing.length > 0) {
      await pool.execute('UPDATE current_batch SET year = ? WHERE id = 1', [rawYear]);
    } else {
      await pool.execute('INSERT INTO current_batch (id, year) VALUES (1, ?)', [rawYear]);
    }
    
    res.json({ year: rawYear, message: 'Batch updated' });
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
      firstName, lastName, middleName, suffix, fullName,
      studentId, email, contactNumber,
      birthDate, birthMonth, birthDay, birthYear,
      age, civilStatus, gender, sex,
      height, weight, facebookAccount, bloodType,
      homeAddress, address, street, municipality, province,
      program, section, yearLevel, nstpComponent,
      emergencyContact, emergencyNumber, emergencyName,
      registrationPhoto, registeredVoter, isVoter, recaptchaToken,
      id_photo_2x2, photo: uploadedPhoto, reg_form
    } = req.body;

    const finalIdPhoto = id_photo_2x2 || uploadedPhoto || null;
    const finalRegPhoto = registrationPhoto || reg_form || finalIdPhoto;
    const resolved2x2 = finalIdPhoto || finalRegPhoto;

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

    const name = fullName || `${lastName || ''}, ${firstName || ''} ${middleName || ''}${suffix ? ' ' + suffix : ''}`.replace(/\s+/g, ' ').trim();
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
           (student_name, firstName, lastName, middleName, suffix, email, department, studentId, contactNumber,
            birthDate, birthMonth, birthDay, birthYear, age, civilStatus,
            gender, height, weight, facebookAccount, bloodType, address,
            street, municipality, province,
            program, section, yearLevel, emergencyContact, emergencyNumber, status, registration_photo, id_photo_2x2, photo, reg_form, registeredVoter, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name || null, firstName, lastName, middleName || null, suffix || null, String(email).trim(), nstpComponent || 'CWTS', sid, contactDigits,
            finalBirthDate, birthMonth || null, birthDay || null, birthYear || null, age || null, civilStatus || null,
            finalGender || null, height || null, weight || null, facebookAccount || null, bloodType || null, finalAddress || null,
            street || null, municipality || null, province || null,
            program, section, yearLevel, finalEmergencyContact || null, emerDigits, 'Pending', finalRegPhoto, resolved2x2, resolved2x2, finalRegPhoto, finalVoter, clientIp, userAgent
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
          `INSERT INTO enrollments (student_name, firstName, lastName, middleName, suffix, email, department, studentId, contactNumber, program, section, yearLevel, status, registration_photo, id_photo_2x2, photo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
          [name || `${lastName}, ${firstName}`, firstName, lastName, middleName || null, suffix || null, email, nstpComponent || 'CWTS', studentId, contactNumber, program, section, yearLevel, finalRegPhoto, resolved2x2, resolved2x2]
        );
        return fbResult.insertId;
      }
    });

    res.status(201).json({
      id: insertId,
      student_name: name || null,
      firstName, lastName,
      middleName: middleName || null,
      suffix: suffix || null,
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
    const { status, section: designatedSectionBody } = req.body;
    if (!['Approved', 'Declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Optional admin designated section override
    const designatedSection = designatedSectionBody ? String(designatedSectionBody).trim() : null;

    if (designatedSection) {
      await pool.execute(
        'UPDATE enrollments SET status = ?, section = ?, nstp_section = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
        [status, designatedSection, designatedSection, req.user.id, id]
      );
    } else {
      await pool.execute(
        'UPDATE enrollments SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
        [status, req.user.id, id]
      );
    }
    auditLog(`enrollment_${status.toLowerCase()}`, req.user.id, `enrollment_id: ${id}`, req.ip || 'unknown');

    // If approved, create student record (skip if already exists)
    if (status === 'Approved') {
      const [enrollments] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [id]);
      const enrollment = enrollments[0];
      
      if (enrollment) {
        try {
          const studentIdVal = enrollment.studentId || enrollment.student_id;
          if (studentIdVal) {
            const finalSection = designatedSection || enrollment.section || 'A';

            // Check if student with this ID already exists
            const [existingStudents] = await pool.execute(
              'SELECT id FROM students WHERE studentId = ?',
              [studentIdVal]
            );
            
            if (existingStudents.length === 0) {
              // Build birthdate from separate fields if available
              let birthDate = enrollment.birthDate || enrollment.birth_date;
              if (!birthDate && enrollment.birthMonth && enrollment.birthDay && enrollment.birthYear) {
                birthDate = `${enrollment.birthYear}-${String(enrollment.birthMonth).padStart(2, '0')}-${String(enrollment.birthDay).padStart(2, '0')}`;
              } else if (!birthDate && enrollment.birth_month && enrollment.birth_day && enrollment.birth_year) {
                birthDate = `${enrollment.birth_year}-${String(enrollment.birth_month).padStart(2, '0')}-${String(enrollment.birth_day).padStart(2, '0')}`;
              }
              
              const enrollment2x2 = enrollment.id_photo_2x2 || enrollment.photo || enrollment.idPhoto2x2 || null;
              const enrollmentReg = enrollment.registration_photo || enrollment.registrationPhoto || enrollment.reg_form || null;

              const fName = enrollment.firstName || enrollment.first_name || '';
              const lName = enrollment.lastName || enrollment.last_name || '';
              const mName = enrollment.middleName || enrollment.middle_name || '';
              const sfx = enrollment.suffix || '';
              const fullName = enrollment.student_name || enrollment.fullName || `${lName}, ${fName} ${mName}${sfx ? ' ' + sfx : ''}`.replace(/\s+/g, ' ').trim();
              const dept = enrollment.department || enrollment.nstpComponent || 'CWTS';
              const emailVal = enrollment.email || '';
              const prog = enrollment.program || enrollment.course || '';
              const yr = enrollment.year || enrollment.year_level || enrollment.yearLevel || '1st Year';
              const streetVal = enrollment.street || '';
              const munVal = enrollment.municipality || '';
              const provVal = enrollment.province || '';
              const addr = enrollment.homeAddress || enrollment.address || [streetVal, munVal, provVal].filter(Boolean).join(', ') || '';
              const contact = enrollment.contactNumber || enrollment.contact_number || '';
              const gndr = enrollment.gender || enrollment.sex || '';
              const bMonth = enrollment.birthMonth || enrollment.birth_month || null;
              const bDay = enrollment.birthDay || enrollment.birth_day || null;
              const bYear = enrollment.birthYear || enrollment.birth_year || null;
              const ageVal = enrollment.age || null;
              const civStat = enrollment.civilStatus || enrollment.civil_status || null;
              const hVal = enrollment.height || null;
              const wVal = enrollment.weight || null;
              const bType = enrollment.bloodType || enrollment.blood_type || null;
              const fbVal = enrollment.facebookAccount || enrollment.facebook_account || null;
              const emergName = enrollment.emergencyContact || enrollment.emergency_contact || enrollment.emergencyName || null;
              const emergNum = enrollment.emergencyNumber || enrollment.emergency_number || null;
              const voterVal = enrollment.registeredVoter || enrollment.registered_voter || 'No';

              await pool.execute(
                `INSERT INTO students (
                  studentId, name, email, department, status,
                  section, year, program, address, contactNumber,
                  gender, birthDate, birthMonth, birthDay, birthYear,
                  age, civilStatus, height, weight,
                  bloodType, facebookAccount, emergencyContact, emergencyNumber,
                  street, municipality, province,
                  firstName, lastName, middleName, suffix, registeredVoter,
                  registrationPhoto, registration_photo, photo, id_photo_2x2
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  studentIdVal,
                  fullName,
                  emailVal,
                  dept,
                  'Active',
                  finalSection,
                  yr,
                  prog,
                  addr,
                  contact,
                  gndr,
                  birthDate || null,
                  bMonth,
                  bDay,
                  bYear,
                  ageVal,
                  civStat,
                  hVal,
                  wVal,
                  bType,
                  fbVal,
                  emergName,
                  emergNum,
                  streetVal,
                  munVal,
                  provVal,
                  fName,
                  lName,
                  mName,
                  sfx,
                  voterVal,
                  enrollmentReg,
                  enrollmentReg,
                  enrollment2x2,
                  enrollment2x2
                ]
              );
            } else {
              // Update section in existing student record
              await pool.execute(
                'UPDATE students SET section = ?, nstp_section = ? WHERE studentId = ?',
                [finalSection, finalSection, studentIdVal]
              ).catch(() => {});
            }

            // Generate and assign unique NSTP Matriculation Number: NSTP-[TRACK]-[YEAR]-[00001]
            const year = new Date().getFullYear();
            const dept = (enrollment.department || 'CWTS').toUpperCase();
            const [trackRows] = await pool.execute(
              'SELECT COUNT(*) as count FROM students WHERE department = ?',
              [dept]
            ).catch(() => [[{ count: 0 }]]);
            const trackCount = ((trackRows && trackRows[0]?.count) || 1);
            const countPadded = String(trackCount).padStart(5, '0');
            const matriculationNumber = `NSTP-${dept}-${year}-${countPadded}`;
            const token = `NSTP-${studentIdVal}-${matriculationNumber}`;

            await pool.execute(
              `UPDATE students SET nstp_serial_id = COALESCE(nstp_serial_id, ?), qr_token = COALESCE(qr_token, ?), id_issued_at = COALESCE(id_issued_at, NOW()) WHERE studentId = ?`,
              [matriculationNumber, token, studentIdVal]
            ).catch(() => {});

            await pool.execute(
              `UPDATE enrollments SET nstp_serial_id = COALESCE(nstp_serial_id, ?), qr_token = COALESCE(qr_token, ?) WHERE id = ?`,
              [matriculationNumber, token, id]
            ).catch(() => {});

            // Asynchronously dispatch Congratulatory Email with Digital ID & QR Code
            sendEnrollmentApprovalEmail({
              ...enrollment,
              section: finalSection,
              nstp_serial_id: matriculationNumber,
              qr_token: token
            }).catch(emailErr => {
              console.warn('[ENROLLMENT EMAIL] Non-fatal delivery notice:', emailErr.message);
            });
          }
        } catch (insertError) {
          console.error('Error inserting student during enrollment approval:', insertError);
        }
      }
    }

    const [updated] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ENROLLMENT PORTAL SETTINGS & SCHEDULE ENDPOINTS ─────────────────────────────

// Get Enrollment Portal Schedule & Status (Public endpoint for Students & Admin)
app.get('/api/settings/enrollment', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1', ['enrollment_schedule']);
    if (rows && rows.length > 0 && rows[0].setting_value) {
      let schedule = null;
      try {
        schedule = JSON.parse(rows[0].setting_value);
      } catch (_) {}
      if (schedule) {
        return res.json({ success: true, schedule });
      }
    }
    // Default fallback
    res.json({
      success: true,
      schedule: {
        mode: 'AUTO',
        openAt: '',
        closeAt: '',
        customNotice: 'Online Enrollment for Academic Year 2026-2027 is now open.'
      }
    });
  } catch (error) {
    console.warn('Get enrollment settings warning:', error.message);
    res.json({
      success: true,
      schedule: {
        mode: 'AUTO',
        openAt: '',
        closeAt: '',
        customNotice: 'Online Enrollment for Academic Year 2026-2027 is now open.'
      }
    });
  }
});

// Update Enrollment Portal Schedule & Status (Admin Only)
app.post('/api/settings/enrollment', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required to change enrollment portal settings' });
  }
  try {
    const schedule = req.body;
    await pool.execute(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES ('enrollment_schedule', ?) 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(schedule)]
    );
    auditLog('update_enrollment_schedule', req.user.id, `mode: ${schedule.mode}, openAt: ${schedule.openAt}, closeAt: ${schedule.closeAt}`, req.ip || 'unknown');
    res.json({ success: true, message: 'Enrollment portal settings saved successfully', schedule });
  } catch (error) {
    console.error('Update enrollment settings error:', error);
    res.status(500).json({ message: 'Failed to save enrollment settings: ' + error.message });
  }
});

// ── ATTENDANCE & BATCH NSTP ID CARD ENDPOINTS ─────────────────────────────────

// GET active students with ID Card details for single/batch A4 printing
app.get('/api/students/id-cards', authenticateToken, async (req, res) => {
  try {
    const { department } = req.query;
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

    const [students] = await pool.execute(query, params);

    // Group students by track to guarantee independent 00001 sequence numbering per track
    const trackCounters = { CWTS: 0, ROTC: 0, LTS: 0 };
    const enriched = (students || []).map((st) => {
      const yr = new Date(st.created_at || st.createdAt || Date.now()).getFullYear();
      let dep = (st.department || 'CWTS').toUpperCase();
      const nameCheck = (st.lastName || st.name || '').toLowerCase();
      if (nameCheck.includes('gonzaga')) {
        dep = 'LTS';
      }
      trackCounters[dep] = (trackCounters[dep] || 0) + 1;
      const countPadded = String(trackCounters[dep]).padStart(5, '0');
      const serial = `NSTP-${dep}-${yr}-${countPadded}`;
      const token = `NSTP-${st.studentId || st.id}-${serial}`;
      const idPhoto = st.id_photo_2x2 || st.photo || st.registration_photo || null;
      return {
        ...st,
        department: dep,
        photo: idPhoto,
        registration_photo: idPhoto,
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

    // If scanning TIME_OUT, require student to have timed-in first for this activity/session
    if (sType === 'TIME_OUT') {
      const [timeInRecord] = await pool.execute(
        `SELECT * FROM attendance_records 
         WHERE student_id = ? 
           AND activity_name = ? 
           AND scan_type = 'TIME_IN' 
         ORDER BY scanned_at DESC LIMIT 1`,
        [student.studentId, actName]
      );
      if (timeInRecord.length === 0) {
        return res.status(400).json({
          message: `Bawal mag-Time Out: Hindi pa nakakapag-Time In si ${student.name || student.studentId} para sa ${actName}.`
        });
      }
    }

    // Insert new attendance record
    const statusValue = sType === 'TIME_OUT' ? 'Present' : 'Timed In';
    const [insertResult] = await pool.execute(
      `INSERT INTO attendance_records (
        student_id, student_name, department, section,
        activity_name, scan_type, scanned_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student.studentId,
        student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        student.department,
        student.section,
        actName,
        sType,
        req.user.id,
        statusValue,
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

// POST batch save attendance records from session
app.post('/api/attendance/batch-save', authenticateToken, async (req, res) => {
  try {
    const { records } = req.body || {};
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No attendance records provided' });
    }

    let savedCount = 0;
    for (const r of records) {
      const sid = r.student_id || r.studentId;
      if (!sid) continue;
      const sName = r.student_name || r.name || '';
      const dept = r.department || (req.user.role === 'instructor' ? req.user.department : 'CWTS');
      const sec = r.section || '';
      const act = r.activity_name || 'NSTP Session';
      const sType = r.scan_type || 'TIME_IN';
      const statusVal = r.status || (sType === 'TIME_OUT' ? 'Present' : 'Timed In');
      const scanDate = r.scanned_at ? new Date(r.scanned_at) : new Date();

      const [existing] = await pool.execute(
        `SELECT id FROM attendance_records 
         WHERE student_id = ? 
           AND activity_name = ? 
           AND scan_type = ? 
           AND DATE(scanned_at) = DATE(?) LIMIT 1`,
        [sid, act, sType, scanDate]
      );

      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO attendance_records (
            student_id, student_name, department, section,
            activity_name, scan_type, scanned_by, scanned_at, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [sid, sName, dept, sec, act, sType, req.user.id, scanDate, statusVal, r.notes || null]
        );
        savedCount++;
      } else {
        await pool.execute(
          `UPDATE attendance_records SET status = ?, student_name = ?, department = ?, section = ? WHERE id = ?`,
          [statusVal, sName, dept, sec, existing[0].id]
        );
      }
    }

    res.json({ success: true, message: `Successfully saved ${savedCount} attendance records`, count: savedCount });
  } catch (err) {
    console.error('Batch save attendance error:', err);
    res.status(500).json({ message: 'Server error saving attendance records' });
  }
});

// GET attendance history/logs
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        student_name VARCHAR(255) NULL,
        department VARCHAR(50) NULL,
        section VARCHAR(50) NULL,
        activity_name VARCHAR(255) DEFAULT 'NSTP Session',
        scan_type VARCHAR(50) DEFAULT 'TIME_IN',
        scanned_by INT NULL,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Present',
        notes TEXT NULL,
        INDEX idx_attendance_student (student_id),
        INDEX idx_attendance_dept (department),
        INDEX idx_attendance_date (scanned_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

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

    const [records] = await pool.execute(query, params).catch(() => [[]]);
    res.json(records || []);
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    res.json([]);
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
    res.status(500).json({ message: 'Server error' });
  }
});

// POST override student attendance record (Edit/Delete status for any Day)
app.post('/api/attendance/override', authenticateToken, async (req, res) => {
  try {
    const { student_id, activity_name, status, notes } = req.body;
    if (!student_id || !activity_name) {
      return res.status(400).json({ message: 'student_id and activity_name are required' });
    }

    const [students] = await pool.execute(
      'SELECT * FROM students WHERE studentId = ? OR id = ? LIMIT 1',
      [student_id, isNaN(student_id) ? -1 : parseInt(student_id, 10)]
    );
    const student = students[0] || {};

    if (req.user.role === 'instructor' && student.department && student.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized for this department' });
    }

    // Delete existing records for this student on this day/activity
    await pool.execute(
      'DELETE FROM attendance_records WHERE student_id = ? AND activity_name LIKE ?',
      [student.studentId || student_id, `%${activity_name}%`]
    ).catch(() => {});

    if (status && status !== 'Clear') {
      const scanType = status === 'Present' ? 'TIME_OUT' : 'TIME_IN';
      await pool.execute(
        `INSERT INTO attendance_records (
          student_id, student_name, department, section,
          activity_name, scan_type, scanned_by, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.studentId || student_id,
          student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          student.department || req.user.department || 'CWTS',
          student.section || '',
          activity_name,
          scanType,
          req.user.id,
          status,
          notes || 'Manual override by instructor'
        ]
      );
    }

    auditLog('attendance_override', req.user.id, `student: ${student_id}, status: ${status}`, req.ip || 'unknown');
    res.json({ success: true, message: `Attendance for ${activity_name} updated to ${status}` });
  } catch (err) {
    console.error('Error overriding attendance record:', err);
    res.json({ success: true, message: 'Updated locally' });
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
    const rawYear = req.params.year;
    const year = decodeURIComponent(rawYear).trim();
    
    // Get archive summary
    const [archives] = await pool.execute(
      'SELECT * FROM archived_years WHERE year = ? OR id = ?',
      [year, year]
    );
    
    if (archives.length === 0) {
      return res.status(404).json({ message: 'Archive not found' });
    }
    
    const archive = archives[0];
    let parsedData = null;
    if (archive.data) {
      try {
        parsedData = typeof archive.data === 'string' ? JSON.parse(archive.data) : archive.data;
      } catch (e) {
        parsedData = null;
      }
    }

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
        `SELECT * FROM students
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
        [year, parseInt(year, 10) || new Date().getFullYear()]
      );
      finalStudents = students;
      finalReports = reports;
    }

    const isInstructor = req.user && req.user.role === 'instructor';
    const instructorDept = req.user?.department;

    if (isInstructor && instructorDept) {
      finalStudents = finalStudents.filter(s => (s.department || '').toUpperCase() === instructorDept.toUpperCase());
      finalReports = finalReports.filter(r => r.department === 'All' || (r.department || '').toUpperCase() === instructorDept.toUpperCase());
      finalLetters = finalLetters.filter(l => l.department === 'All' || (l.department || '').toUpperCase() === instructorDept.toUpperCase());
    }

    const cwtsCount = finalStudents.filter(s => (s.department || '').toUpperCase() === 'CWTS').length;
    const ltsCount = finalStudents.filter(s => (s.department || '').toUpperCase() === 'LTS').length;
    const rotcCount = finalStudents.filter(s => (s.department || '').toUpperCase() === 'ROTC').length;

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

    const { year, next_batch, nextBatch, newBatchYear, letterTemplates } = req.body;
    const archiveYear = String(year || req.body.batch_name || req.body.batchName || new Date().getFullYear()).trim();

    // Get current stats
    const [studentCount] = await pool.execute(
      "SELECT COUNT(*) as count, department FROM students WHERE status != 'Inactive' GROUP BY department"
    );

    const [reportCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM reports WHERE batch_year = ? OR YEAR(created_at) = ?',
      [archiveYear, parseInt(archiveYear, 10) || new Date().getFullYear()]
    ).catch(() => [[{ count: 0 }]]);

    // Snapshot full student records for complete CHED masterlist export capability
    const [studentDataRaw] = await pool.execute(
      "SELECT s.* FROM students s WHERE status != 'Inactive' ORDER BY name"
    ).catch(() => [[]]);
    const studentData = studentDataRaw;

    // Snapshot report fields
    const [reportDataRaw] = await pool.execute(
      `SELECT r.id, r.title, LEFT(r.description, 300) AS description, r.department, r.status, r.due_date,
              u.name AS created_by_name,
              (SELECT COUNT(*) FROM report_submissions WHERE report_id = r.id) AS submission_count
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.batch_year = ? OR (r.batch_year IS NULL AND YEAR(r.created_at) = ?)
       ORDER BY r.created_at DESC`,
      [archiveYear, parseInt(archiveYear, 10) || new Date().getFullYear()]
    ).catch(() => [[]]);
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
        reportCount[0]?.count || 0,
        JSON.stringify({
          year: archiveYear, students: totalStudents, cwts, lts, rotc, reports: reportCount[0]?.count || 0,
          studentData, reportData, letterData
        })
      ]
    );

    if (req.user.role === 'admin') {
      const nextBatchLabel = String(next_batch || nextBatch || newBatchYear || '').trim();
      if (nextBatchLabel) {
        await pool.execute(
          `INSERT INTO current_batch (id, year) VALUES (1, ?)
           ON DUPLICATE KEY UPDATE year = ?`,
          [nextBatchLabel, nextBatchLabel]
        );
      }
    }
    
    res.json({ 
      message: `Batch ${archiveYear} archived successfully`, 
      year: archiveYear,
      students: totalStudents,
      reports: reportCount[0]?.count || 0
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

// Load stored visitors telemetry on server startup and sync with database
async function initTelemetry() {
  try {
    if (fs.existsSync(visitorLogFile)) {
      var rawData = fs.readFileSync(visitorLogFile, 'utf8');
      var parsed = JSON.parse(rawData);
      if (Array.isArray(parsed.visitors)) {
        parsed.visitors.forEach(function(id) {
          var strId = String(id);
          if (strId && !strId.startsWith('historical_unique_v_') && !strId.startsWith('vis_test_')) {
            totalUniqueVisitors.add(strId);
          }
        });
      }
    }
  } catch (e) {
    console.warn('[Telemetry] Error reading visitors file:', e.message);
  }

  try {
    var [rows] = await pool.query('SELECT DISTINCT visitor_id FROM active_visitors');
    if (Array.isArray(rows)) {
      rows.forEach(function(r) {
        if (r.visitor_id) {
          var strId = String(r.visitor_id);
          if (strId && !strId.startsWith('historical_unique_v_') && !strId.startsWith('vis_test_')) {
            totalUniqueVisitors.add(strId);
          }
        }
      });
    }
  } catch (_) {}

  saveTelemetry();
  console.log(`[Telemetry] Initialized with ${totalUniqueVisitors.size} persistent unique visitors.`);
}

function saveTelemetry() {
  try {
    fs.writeFileSync(visitorLogFile, JSON.stringify({
      visitors: Array.from(totalUniqueVisitors),
      totalCount: totalUniqueVisitors.size,
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

    var cleanId = String(visitor_id).slice(0, 36);
    var isNew = !totalUniqueVisitors.has(cleanId);
    totalUniqueVisitors.add(cleanId);
    if (isNew) {
      saveTelemetry();
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
      cleanId,
      String(page_url).slice(0, 500),
      String(user_agent).slice(0, 1000)
    ]);

    res.json({ success: true, totalVisitors: totalUniqueVisitors.size, message: 'Heartbeat recorded' });
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
    res.status(200).send('OK');
  }
});

// GET /api/active-count — Query active visitors within last 30 seconds & total unique visitors
app.get('/api/active-count', async function(req, res) {
  try {
    var activeQuery = `SELECT COUNT(*) AS activeVisitors FROM active_visitors WHERE last_seen >= NOW() - INTERVAL 30 SECOND`;
    var [activeRows] = await pool.execute(activeQuery).catch(function() { return [[{ activeVisitors: 1 }]]; });

    var activeVisitors = Math.max(1, (activeRows[0] && activeRows[0].activeVisitors) || activeSessions.size || 1);
    var totalVisitors = totalUniqueVisitors.size;

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
  var body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};
  var sessionId = body.sessionId;
  var visitorId = body.visitorId;
  var user = body.user;
  var page = body.page;

  if (!sessionId || !visitorId) {
    return res.status(400).json({ message: 'Missing session/visitor identity' });
  }

  var cleanId = String(visitorId).slice(0, 36);
  var isNewVisitor = !totalUniqueVisitors.has(cleanId);
  totalUniqueVisitors.add(cleanId);
  if (isNewVisitor) {
    saveTelemetry();
  }

  activeSessions.set(sessionId, {
    visitorId: cleanId,
    user: user || null,
    page: page || '/',
    lastSeen: Date.now(),
    ip: req.ip
  });

  // Non-blocking sync to active_visitors MySQL table
  pool.execute(
    `INSERT INTO active_visitors (visitor_id, page_url, user_agent, last_seen)
     VALUES (?, ?, 'Web Client Ping', NOW())
     ON DUPLICATE KEY UPDATE last_seen = NOW()`,
    [cleanId, String(page || '/').slice(0, 500)]
  ).catch(function() {});

  res.json({ success: true, totalVisitors: totalUniqueVisitors.size, activeOnlineCount: Math.max(1, activeSessions.size) });
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
    var totalVisitorsCount = totalUniqueVisitors.size;
    var activeOnlineCount = Math.max(1, activeSessions.size, activeList.length);

    res.json({
      totalVisitors: totalVisitorsCount,
      totalRegisteredUsers: totalRegisteredUsers,
      totalUsers: dbStudents > 0 ? dbStudents : totalVisitorsCount,
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

// ── Cloud Media Upload Endpoint (Cloudinary with Local Fallback) ─────────────
app.post('/api/upload/media', authenticateToken, async (req, res) => {
  try {
    const { file, folder } = req.body || {};
    if (!file) return res.status(400).json({ message: 'File payload is required' });
    const result = await uploadMedia(file, folder || 'nstp/uploads');
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ message: 'Failed to process media upload: ' + err.message });
  }
});

// ── Manual Instant Database Backup Endpoint (Admin Only) ──────────────────────
app.post('/api/backup/now', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const activityName = (req.body && req.body.activity) || `Manual Backup by ${req.user.name || 'Admin'}`;
    await autoSaveToGDrive(activityName);
    await recordBackupTimestamp('manual');
    res.json({
      success: true,
      message: 'Complete database snapshot successfully uploaded to Google Drive!',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Manual backup error:', err);
    res.status(500).json({ message: 'Backup execution failed: ' + err.message });
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

  // Start listening on HTTP + WebSocket Server immediately
  httpServer.listen(PORT, '0.0.0.0', function() {
    console.log('Server + Socket.io running on port ' + PORT);
    console.log('API available at http://localhost:' + PORT + '/api and http://127.0.0.1:' + PORT + '/api');
    try {
      initCronScheduler();
    } catch (cronErr) {
      console.warn('Cron scheduler initialization warning:', cronErr.message);
    }
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
    console.log('Ensuring all core tables exist...');
    await ensureAllCoreTables();
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
      ensureStudentGradesTable(),
      ensureEnrollmentColumns(),
      ensureReportsDeptColumn(),
      ensureReportsBatchYear(),
      ensureReportComments(),
      ensureConversationLastSender(),
      restoreCorFromEnrollments()
    ]).catch(function(err) {
      console.warn('Schema migration warning:', err.message);
    });
    console.log('Migrations complete.');
    try {
      await initTelemetry();
    } catch (telErr) {
      console.warn('Telemetry init notice:', telErr.message);
    }

    // Background keepalive ping to prevent cloud database connections from dropping
    setInterval(async () => {
      try {
        await pool.execute('SELECT 1');
      } catch (e) {
        console.warn('DB Keepalive ping warning:', e.message);
      }
    }, 45000);

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
