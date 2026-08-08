const mysql = require('mysql2/promise');
const { getDbConfig } = require('./dbEnv');

const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 50,         // supports concurrent requests
  queueLimit: 500,             // queue up to 500 requests
  connectTimeout: 10000,       // 10s connection timeout
  enableKeepAlive: true,       // prevent connection drops on idle
  keepAliveInitialDelay: 10000 // send TCP keepalive every 10s
});

module.exports = pool;
