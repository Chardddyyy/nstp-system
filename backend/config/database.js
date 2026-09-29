const mysql = require('mysql2/promise');
const { getDbConfig } = require('./dbEnv');

const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '30', 10),         // Optimized for high load (configurable via DB_POOL_LIMIT)
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0', 10),             // 0 = unlimited queue to prevent query dropping under 500+ VU load bursts
  connectTimeout: 20000,                                                    // 20s connection timeout
  enableKeepAlive: true,                                                    // Prevent connection drops on idle
  keepAliveInitialDelay: 10000,                                             // Send TCP keepalive every 10s
  maxIdle: parseInt(process.env.DB_MAX_IDLE || '20', 10),                   // Max idle connections retained
  idleTimeout: 60000                                                        // Idle connections recycled after 60s
});

// Graceful pool connection event handling to avoid unhandled crashes on idle disconnects
if (pool && typeof pool.on === 'function') {
  pool.on('error', (err) => {
    console.warn('[MySQL Pool Connection Notice]', err?.message || err);
  });
}

module.exports = pool;
