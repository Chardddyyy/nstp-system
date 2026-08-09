const mysql = require('mysql2/promise');
const { getDbConfig } = require('./dbEnv');

const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,         // Fits Aiven/Render DB connection limits (max 10-20 connections)
  queueLimit: 1000,            // Queue requests without dropping or failing
  connectTimeout: 15000,       // 15s connection timeout
  enableKeepAlive: true,       // prevent connection drops on idle
  keepAliveInitialDelay: 10000 // send TCP keepalive every 10s
});

module.exports = pool;
