const mysql = require('mysql2/promise');
const { getDbConfig } = require('./dbEnv');

const dbConfig = getDbConfig();
const isAiven = Boolean(dbConfig.isAiven);
delete dbConfig.isAiven;

// For Aiven Free Tier (max 20 connections), cap default pool limit to 10 to prevent ER_CON_COUNT_ERROR
const defaultPoolLimit = isAiven ? 10 : 30;
const defaultMaxIdle = isAiven ? 8 : 20;

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || String(defaultPoolLimit), 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0', 10),             // 0 = unlimited queue to prevent query dropping under load
  connectTimeout: 20000,                                                    // 20s connection timeout
  enableKeepAlive: true,                                                    // Prevent connection drops on idle
  keepAliveInitialDelay: 10000,                                             // Send TCP keepalive every 10s
  maxIdle: parseInt(process.env.DB_MAX_IDLE || String(defaultMaxIdle), 10), // Max idle connections retained
  idleTimeout: 60000                                                        // Idle connections recycled after 60s
});

// Graceful pool connection event handling to avoid unhandled crashes on idle disconnects
if (pool && typeof pool.on === 'function') {
  pool.on('error', (err) => {
    console.warn('[MySQL Pool Connection Notice]', err?.message || err);
  });
}

module.exports = pool;
