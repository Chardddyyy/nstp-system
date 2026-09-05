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

// In-memory active visitors map and unique visitor IDs set
const activeClients = new Map();
const uniqueVisitorsSet = new Set();

// Helper to load telemetry from JSON file
const loadTelemetry = () => {
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      const data = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
      if (Array.isArray(data.visitors)) {
        data.visitors.forEach(id => {
          if (id && !String(id).startsWith('vis_test_') && !String(id).startsWith('std_')) {
            uniqueVisitorsSet.add(String(id));
          }
        });
      }
      return data;
    }
  } catch (_) {}
  return { visitors: Array.from(uniqueVisitorsSet), totalCount: uniqueVisitorsSet.size, lastUpdated: new Date().toISOString() };
};

// Helper to save telemetry
const saveTelemetry = () => {
  try {
    const data = {
      visitors: Array.from(uniqueVisitorsSet),
      totalCount: uniqueVisitorsSet.size,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
};

loadTelemetry();

/**
 * Ping from client to record active session and genuine unique device
 */
const pingTelemetry = catchAsync(async (req, res) => {
  const visitorId = req.body.visitorId || req.body.visitor_id || req.body.clientId;
  const cleanId = visitorId ? String(visitorId).slice(0, 48) : null;
  const sessionId = req.body.sessionId || cleanId || req.ip || `client_${Date.now()}`;
  const now = Date.now();

  activeClients.set(sessionId, now);

  // Clean stale clients older than 30 seconds
  for (const [id, timestamp] of activeClients.entries()) {
    if (now - timestamp > 30000) {
      activeClients.delete(id);
    }
  }

  const isGenuine = cleanId && !cleanId.startsWith('std_') && !cleanId.startsWith('enr_') && !cleanId.startsWith('usr_') && !cleanId.startsWith('audit_') && !cleanId.startsWith('vis_test_');
  if (isGenuine && !uniqueVisitorsSet.has(cleanId)) {
    uniqueVisitorsSet.add(cleanId);
    saveTelemetry();
  }

  return ApiResponse.success(res, {
    activeOnlineCount: Math.max(1, activeClients.size),
    totalVisitors: Math.max(1, uniqueVisitorsSet.size)
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
