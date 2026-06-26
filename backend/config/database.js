const mysql = require('mysql2/promise');
const { getDbConfig } = require('./dbEnv');

const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 50,   // supports ~1 000 concurrent requests queuing in batches of 50
  queueLimit: 500,       // reject after 500 queued so the server stays responsive under DoS
  connectTimeout: 10000, // 10 s — fail fast instead of hanging forever
});

module.exports = pool;
