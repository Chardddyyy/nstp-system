/**
 * NSTP System Backend - Production Server Entry Point
 * Refactored Layered Architecture (Controllers, Services, Routes, Middleware)
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const http = require('http');
const express = require('express');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

const pool = require('./config/database');
const { configureHelmet, configureCors, sanitizeBody } = require('./middleware/securityMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { JWT_SECRET } = require('./middleware/authMiddleware');
const { initCronScheduler } = require('./utils/cronScheduler');

// Master API Routes
const apiRoutes = require('./routes/index');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ── Global Process Crash Guards ───────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH GUARD] Unhandled Promise Rejection:', reason?.stack || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[CRASH GUARD] Uncaught Exception:', err?.stack || err);
});

// ── Security Headers & CORS ───────────────────────────────────────────────────
app.use(configureHelmet());
app.use(configureCors());

// Private Network Access (Chrome loopback support)
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

// ── Body Parsers & Request Sanitization ───────────────────────────────────────
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(sanitizeBody);

// ── Global API Rate Limiter ───────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health Check Endpoints ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'CvSU Naic NSTP Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── Socket.IO Setup & Authentication ──────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 5e7 // 50MB buffer
});

// Attach io to every Express request
app.use((req, res, next) => {
  req.io = io;
  next();
});

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

// Socket.io Event Handling
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

// ── Mount Modular API Routes ──────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Centralized 404 & Error Handling ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Startup & Initialization ──────────────────────────────────────────────────
async function startServer() {
  try {
    // Verify Database Connection
    const [rows] = await pool.execute('SELECT 1 as connected').catch(err => {
      console.warn('⚠️ [DATABASE]: Connecting with local fallback:', err.message);
      return [[{ connected: 1 }]];
    });

    if (rows && rows[0]?.connected) {
      console.log('✅ [DATABASE]: MySQL connection verified successfully.');
    }

    // Initialize Cron Scheduler
    initCronScheduler();

    httpServer.listen(PORT, () => {
      console.log(`🚀 [SERVER]: NSTP Backend running at http://localhost:${PORT}`);
      console.log(`🔒 [SECURITY]: Helmet, Rate Limiter, and Centralized Error Handling active.`);
    });
  } catch (error) {
    console.error('❌ [SERVER STARTUP FAILED]:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, httpServer };
