require('dotenv').config({ path: require('path').join(__dirname, '.env') });
var express = require('express');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var pool = require('./config/database');
var { getDbConfig } = require('./config/dbEnv');

var bcrypt = require('bcryptjs');
var app = express();
var PORT = process.env.PORT || 3001;

// ── Security: fail fast if JWT secret is the known-weak default ──────────────
var JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'nstp-secret-key-change-in-production' || JWT_SECRET.length < 32) {
  console.warn('[SECURITY] JWT_SECRET is missing or too weak. Using a generated fallback for this session. Set a strong 64-char random secret in backend/.env before deploying.');
  // Deterministic per-process secret so restarts during dev don't immediately log everyone out
  JWT_SECRET = require('crypto').randomBytes(64).toString('hex');
}
var JWT_EXPIRY = '8h'; // was 30d — reduced to 8 hours for security

// ── Helmet: sets 15+ security headers ────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled — frontend is a Vite SPA on a different port
  crossOriginEmbedderPolicy: false,
}));

// ── CORS: restrict to localhost in dev, explicit whitelist in production ──────
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
  .split(',').map(s => s.trim());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // same-origin / curl / server-to-server
    if (ALLOWED_ORIGINS.some(o => origin === o) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body size: 20 MB max (base64 of a 10 MB image ≈ 13.3 MB) ────────────────
// Was 200 MB — that size allows trivial DoS/DDoS via large payload attacks.
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

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

// ── Enrollment rate limiter: 10 submissions / hour per IP ────────────────────
var enrollmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Too many enrollment submissions from this IP. Please try again later.' },
});

// ── In-memory login rate limiter: 5 failures / 15 min per IP ─────────────────
// Was 10 — reduced to 5 to limit brute-force window.
var loginAttempts = new Map();
function checkLoginRateLimit(ip) {
  var now = Date.now();
  var entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 15 * 60 * 1000 };
  }
  if (entry.count >= 5) return false;
  entry.count++;
  loginAttempts.set(ip, entry);
  return true;
}
function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
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
// Creates the table if missing, then writes a single log row. Non-blocking.
async function auditLog(action, userId, detail, ip) {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        action VARCHAR(100) NOT NULL,
        user_id INT,
        detail TEXT,
        ip VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.execute(
      'INSERT INTO audit_logs (action, user_id, detail, ip) VALUES (?, ?, ?, ?)',
      [action, userId || null, detail ? String(detail).slice(0, 1000) : null, ip || null]
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

var userColumnsMigrated = false;
async function ensureUserColumns() {
  if (userColumnsMigrated) return;
  var alters = [
    'ALTER TABLE users ADD COLUMN profilePicture TEXT',
    'ALTER TABLE users ADD COLUMN phone VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN bio TEXT',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column already exists */ }
  }
  userColumnsMigrated = true;
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
    'ALTER TABLE enrollments ADD COLUMN reviewed_at TIMESTAMP NULL',
    'ALTER TABLE enrollments ADD COLUMN registration_photo LONGTEXT NULL',
  ];
  for (var i = 0; i < alters.length; i++) {
    try { await pool.execute(alters[i]); } catch (e) { /* column already exists */ }
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
  if (!checkLoginRateLimit(ip)) {
    return res.status(429).json({ message: 'Too many failed attempts. Try again in 15 minutes.' });
  }

  try {
    var email = sanitizeStr(req.body.email, 255);
    var password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    var result = await pool.execute(
      'SELECT id, email, name, role, department, avatar, profilePicture, phone, bio, password FROM users WHERE email = ?',
      [email]
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

    if (users.length === 0 || !passwordMatch) {
      auditLog('login_failed', null, `email: ${email}`, ip);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    var user = users[0];
    resetLoginAttempts(ip);
    auditLog('login_success', user.id, `role: ${user.role}`, ip);

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
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
        const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        await pool.execute(
          `INSERT INTO messages (id, conversation_id, sender_id, text, type, created_at)
           VALUES (?, ?, ?, ?, 'system', NOW())`,
          [msgId, groupId, newUserId, `${name} joined the group`]
        );
      }
    } catch (_) { /* non-fatal */ }

    res.status(201).json({ id: newUserId, name, email, role: assignedRole, department: assignedDept });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete instructor account (admin only, cannot delete self or other admins)
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

    const { name, email, phone, bio, avatar, profilePicture } = req.body;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    // Cap profile picture at ~10 MB base64 (≈ 13.3 MB string)
    if (profilePicture && String(profilePicture).length > 14_000_000) {
      return res.status(400).json({ message: 'Profile picture too large. Maximum 10 MB.' });
    }

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

    const [result] = await pool.execute(
      'INSERT INTO students (studentId, name, email, department, section, semester, schoolYear, program, year, contactNumber, address, gender, birthDate, birthMonth, birthDay, birthYear, age, civilStatus, bloodType, height, weight, facebookAccount, emergencyContact, emergencyNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [studentId, name, n(email), department, n(section), n(semester), n(schoolYear), n(program), n(year), n(contactNumber), n(address), n(gender), safeBirthDate, n(birthMonth), n(birthDay), n(birthYear), n(age), n(civilStatus), n(bloodType), n(height), n(weight), n(facebookAccount), n(emergencyName), n(emergencyNumber)]
    );

    const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json(students[0]);
  } catch (error) {
    console.error('Add student error:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate'))) {
      return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
    }
    res.status(500).json({ message: error.sqlMessage || error.message || 'Server error' });
  }
});

// Update student
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, name, email, department, section, semester, schoolYear, program, year, contactNumber, address, gender, birthDate, birthMonth, birthDay, birthYear, age, civilStatus, bloodType, height, weight, facebookAccount, emergencyName, emergencyNumber } = req.body;

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

    await pool.execute(
      'UPDATE students SET studentId = ?, name = ?, email = ?, department = ?, section = ?, semester = ?, schoolYear = ?, program = ?, year = ?, contactNumber = ?, address = ?, gender = ?, birthDate = ?, birthMonth = ?, birthDay = ?, birthYear = ?, age = ?, civilStatus = ?, bloodType = ?, height = ?, weight = ?, facebookAccount = ?, emergencyContact = ?, emergencyNumber = ? WHERE id = ?',
      [studentId, name, n(email), department, n(section), n(semester), n(schoolYear), n(program), n(year), n(contactNumber), n(address), n(gender), safeBirthDate, n(birthMonth), n(birthDay), n(birthYear), n(age), n(civilStatus), n(bloodType), n(height), n(weight), n(facebookAccount), n(emergencyName), n(emergencyNumber), id]
    );

    const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [id]);
    res.json(students[0]);
  } catch (error) {
    console.error('Update student error:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate'))) {
      return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
    }
    res.status(500).json({ message: error.sqlMessage || error.message || 'Server error' });
  }
});

// Delete student
app.delete('/api/students/:id', authenticateToken, async (req, res) => {
  // Only admins can delete students
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT studentId, name FROM students WHERE id = ?', [id]);
    await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    const ip = req.ip || 'unknown';
    auditLog('student_deleted', req.user.id, `studentId: ${rows[0]?.studentId}, name: ${rows[0]?.name}`, ip);
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
    
    // Validate date format if provided
    let safeDueDate = null;
    if (due_date && due_date !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(due_date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
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
    console.error('Add report error:', error.sqlMessage || error.message, error.code);
    res.status(500).json({ message: error.sqlMessage || error.message || 'Server error' });
  }
});

// Update report (admin only)
app.put('/api/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
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

// Get all conversations for current user
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
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
    
    // Create conversation ID from both user IDs sorted numerically.
    // Must use a numeric comparator — the default sort() is lexicographic
    // and would mis-sort IDs like [2, 12] → "12-2" ≠ "2-12".
    const ids = [Number(req.user.id), Number(withUserId)].sort(function(a, b) { return a - b; });
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create the stable "All Instructors" group (idempotent)
app.get('/api/conversations/all-instructors-group', authenticateToken, async (req, res) => {
  try {
    // Find existing group
    const [rows] = await pool.execute(
      "SELECT id, group_name FROM conversations WHERE is_group = TRUE AND group_name = 'All Instructors' LIMIT 1"
    );
    if (rows.length > 0) return res.json({ id: rows[0].id, groupName: rows[0].group_name });

    // None found — create it with all current admins + instructors
    const [staff] = await pool.execute("SELECT id FROM users WHERE role IN ('admin','instructor')");
    if (staff.length < 1) return res.status(404).json({ message: 'No staff found' });

    const groupId = `group-all-instructors-${Date.now()}`;
    await pool.execute(
      'INSERT INTO conversations (id, is_group, group_name, created_by) VALUES (?, TRUE, ?, ?)',
      [groupId, 'All Instructors', req.user.id]
    );
    for (const s of staff) {
      await pool.execute(
        'INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
        [groupId, s.id]
      );
    }
    res.status(201).json({ id: groupId, groupName: 'All Instructors' });
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
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await pool.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, text, type, created_at)
       VALUES (?, ?, ?, ?, 'system', NOW())`,
      [msgId, id, userId, `${userName} joined the group`]
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
    
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);

    const [messages] = await pool.execute(`
      SELECT * FROM (
        SELECT m.*, u.name as sender_name, u.profilePicture as sender_picture
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?
      ) latest
      ORDER BY latest.created_at ASC
    `, [conversationId, limit]);

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
    res.status(500).json({ message: 'Server error' });
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
    
    try {
      await pool.execute(
        'UPDATE conversations SET last_message = ?, last_message_time = NOW(), last_sender_id = ? WHERE id = ?',
        [lastMessagePreview, req.user.id, id]
      );
    } catch (e) {
      await pool.execute(
        'UPDATE conversations SET last_message = ?, last_message_time = NOW() WHERE id = ?',
        [lastMessagePreview, id]
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
    res.status(500).json({ message: error.sqlMessage || error.message || 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
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
      [req.body.sdp, req.params.id]
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

// Clear all students and reports (admin only)
app.post('/api/clear-batch', authenticateToken, requireAdmin, async (req, res) => {
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
    const sid = sanitizeStr(body.studentId, 20);
    if (!/^\d{9}$/.test(sid)) {
      return res.status(400).json({ message: 'Student ID must be exactly 9 digits' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    const contact = sanitizeStr(body.contactNumber, 20);
    if (!/^\d{11}$/.test(contact)) {
      return res.status(400).json({ message: 'Contact Number must be exactly 11 digits' });
    }
    const emerNum = sanitizeStr(body.emergencyNumber, 20);
    if (!/^\d{11}$/.test(emerNum)) {
      return res.status(400).json({ message: 'Emergency Number must be exactly 11 digits' });
    }
    const validComponents = ['CWTS', 'LTS', 'ROTC'];
    if (!validComponents.includes(body.nstpComponent)) {
      return res.status(400).json({ message: 'Invalid NSTP component' });
    }
    // ──────────────────────────────────────────────────────────────────────

    const {
      firstName, lastName, middleName, fullName,
      studentId, email, contactNumber,
      birthDate, birthMonth, birthDay, birthYear,
      age, civilStatus, gender, sex,
      height, weight, facebookAccount, bloodType,
      homeAddress, address,
      program, section, yearLevel, nstpComponent,
      emergencyContact, emergencyNumber, emergencyName,
      registrationPhoto
    } = req.body;

    const name = fullName || `${lastName || ''}, ${firstName || ''} ${middleName || ''}`.trim();
    const finalGender = gender || sex;
    const finalAddress = homeAddress || address;
    const finalEmergencyContact = emergencyName || emergencyContact;
    const photo = registrationPhoto || null;

    const [result] = await pool.execute(
      `INSERT INTO enrollments
       (student_name, firstName, lastName, middleName, email, department, studentId, contactNumber,
        birthDate, birthMonth, birthDay, birthYear, age, civilStatus,
        gender, height, weight, facebookAccount, bloodType, address,
        program, section, yearLevel, emergencyContact, emergencyNumber, status, registration_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name || null, firstName, lastName, middleName || null, email, nstpComponent || 'CWTS', studentId, contactNumber,
        birthDate || null, birthMonth || null, birthDay || null, birthYear || null, age || null, civilStatus || null,
        finalGender || null, height || null, weight || null, facebookAccount || null, bloodType || null, finalAddress || null,
        program, section, yearLevel, finalEmergencyContact || null, emergencyNumber, 'Pending', photo
      ]
    );

    const [enrollments] = await pool.execute('SELECT * FROM enrollments WHERE id = ?', [result.insertId]);
    res.status(201).json(enrollments[0]);
  } catch (error) {
    console.error('❌ Submit enrollment error:', error.message, error.code);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Decline enrollment
app.put('/api/enrollments/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Approved', 'Declined', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== MESSAGE RECORD ENROLLMENT REPORT SYSTEM =====

// MESSAGES ENDPOINTS

// GET all messages
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT * FROM messages ORDER BY date_sent DESC'
    );
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add new message
app.post('/api/messages', authenticateToken, async (req, res) => {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update message
app.put('/api/messages/:id', authenticateToken, async (req, res) => {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// ENROLLMENT ENDPOINTS

// GET all enrollment records
app.get('/api/enrollment', authenticateToken, async (req, res) => {
  try {
    const [enrollment] = await pool.execute(
      'SELECT * FROM enrollment ORDER BY enrollment_date DESC'
    );
    res.json(enrollment);
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add new enrollment
app.post('/api/enrollment', authenticateToken, async (req, res) => {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update enrollment
app.put('/api/enrollment/:id', authenticateToken, async (req, res) => {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// ARCHIVE/BATCH MANAGEMENT ENDPOINTS

// GET all archived years
app.get('/api/archives', authenticateToken, async (req, res) => {
  try {
    const [archives] = await pool.execute(
      'SELECT * FROM archived_years ORDER BY year DESC'
    );
    res.json(archives.map(archive => {
      var parsedData = null;
      if (archive.data) {
        try { parsedData = JSON.parse(archive.data); } catch (e) { parsedData = null; }
      }
      return {
        ...archive,
        data: parsedData
      };
    }));
  } catch (error) {
    console.error('Get archives error:', error);
    res.status(500).json({ message: 'Server error' });
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
    const parsedData = archive.data ? JSON.parse(archive.data) : null;

    // Use the stored snapshot if it exists and has report records
    if (parsedData && Array.isArray(parsedData.reportData)) {
      return res.json({
        ...archive,
        data: parsedData,
        studentData: parsedData.studentData || [],
        reportData: parsedData.reportData || []
      });
    }

    // No snapshot yet — query live tables using batch_year (preferred) or YEAR(created_at) fallback
    const [students] = await pool.execute(
      `SELECT s.* FROM students s WHERE s.schoolYear LIKE ? ORDER BY s.name`,
      [`${year}%`]
    );

    const [reports] = await pool.execute(
      `SELECT r.*,
        (SELECT COUNT(*) FROM report_submissions WHERE report_id = r.id) as submission_count,
        u.name as created_by_name
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.batch_year = ? OR (r.batch_year IS NULL AND YEAR(r.created_at) = ?)
       ORDER BY r.created_at DESC`,
      [year, year]
    );

    // Auto-save snapshot so future views don't need the live tables
    try {
      const newData = {
        ...(parsedData || {}),
        studentData: students,
        reportData: reports
      };
      await pool.execute(
        'UPDATE archived_years SET data = ? WHERE year = ?',
        [JSON.stringify(newData), year]
      );
    } catch (e) { /* non-fatal */ }

    res.json({
      ...archive,
      data: parsedData,
      studentData: students,
      reportData: reports
    });
  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({ message: 'Server error' });
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

    // Snapshot full student records for this batch
    const [studentData] = await pool.execute(
      `SELECT * FROM students WHERE status != "Inactive" ORDER BY name`
    );

    // Snapshot full report records — match by batch_year first, fall back to YEAR(created_at)
    const [reportData] = await pool.execute(
      `SELECT r.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM report_submissions WHERE report_id = r.id) as submission_count
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.batch_year = ? OR (r.batch_year IS NULL AND YEAR(r.created_at) = ?)
       ORDER BY r.created_at DESC`,
      [year, year]
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
        JSON.stringify({
          year, students: totalStudents, cwts, lts, rotc, reports: reportCount[0].count,
          studentData, reportData
        })
      ]
    );
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
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Test database connection
// Audit log viewer — admin only
app.get('/api/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const [logs] = await pool.execute(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT ?`,
      [limit]
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/health', async (req, res) => {
  // Don't expose DB version or stack info in production
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'OK' });
  } catch (error) {
    res.status(503).json({ status: 'Unavailable' });
  }
});

async function startServer() {
  var db = getDbConfig();
  try {
    await pool.execute('SELECT 1');
    console.log('Database connected: ' + db.host + ':' + db.port + '/' + db.database);
    // Raise packet limit so base64 images/files fit (64 MB)
    try { await pool.execute('SET GLOBAL max_allowed_packet = 67108864'); } catch (_) {}
  } catch (err) {
    console.error('Database NOT connected:', err.message);
    console.error('Start XAMPP MySQL, then run: cd backend && npm run setup-db');
    process.exit(1);
  }

  console.log('Running schema migrations...');
  await Promise.all([
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
  } catch (e) {
    console.warn('Password hash migration warning:', e.message);
  }

  app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
    console.log('API available at http://localhost:' + PORT + '/api');
  });
}

startServer();
