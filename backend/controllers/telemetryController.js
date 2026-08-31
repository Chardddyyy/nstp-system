/**
 * Telemetry & System Status Controller
 * Handles visitor counters, ping telemetry, and health checks
 */

const fs = require('fs');
const path = require('path');
const ApiResponse = require('../utils/apiResponse');
const { catchAsync } = require('../middleware/errorHandler');
const pool = require('../config/database');

const TELEMETRY_FILE = path.join(__dirname, '../visitors_telemetry.json');

// In-memory active visitors map
const activeClients = new Map();

// Helper to load telemetry from JSON file
const loadTelemetry = () => {
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      return JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
    }
  } catch (_) {}
  return { totalVisitors: 100, lastUpdated: new Date().toISOString() };
};

// Helper to save telemetry
const saveTelemetry = (data) => {
  try {
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
};

/**
 * Ping from client to record active session
 */
const pingTelemetry = catchAsync(async (req, res) => {
  const clientId = req.body.clientId || req.ip || `client_${Date.now()}`;
  const now = Date.now();

  activeClients.set(clientId, now);

  // Clean stale clients older than 30 seconds
  for (const [id, timestamp] of activeClients.entries()) {
    if (now - timestamp > 30000) {
      activeClients.delete(id);
    }
  }

  const telemetry = loadTelemetry();
  telemetry.totalVisitors = (telemetry.totalVisitors || 0) + 1;
  telemetry.lastUpdated = new Date().toISOString();
  saveTelemetry(telemetry);

  return ApiResponse.success(res, {
    activeOnlineCount: Math.max(1, activeClients.size),
    totalVisitors: telemetry.totalVisitors
  }, 'Telemetry ping recorded');
});

/**
 * Get Telemetry Stats & User/Student Counts
 */
const getTelemetryStats = catchAsync(async (req, res) => {
  const telemetry = loadTelemetry();

  // Fast count query
  const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users').catch(() => [[{ count: 0 }]]);
  const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM students').catch(() => [[{ count: 0 }]]);

  return ApiResponse.success(res, {
    totalVisitors: telemetry.totalVisitors || 120,
    activeOnlineCount: Math.max(1, activeClients.size),
    totalUsers: (userCount[0]?.count || 0) + (studentCount[0]?.count || 0),
    totalRegisteredUsers: (userCount[0]?.count || 0) + (studentCount[0]?.count || 0)
  }, 'Telemetry stats retrieved');
});

module.exports = {
  pingTelemetry,
  getTelemetryStats
};
