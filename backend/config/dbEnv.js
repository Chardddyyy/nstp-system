const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');

function getDbConfig(options) {
  options = options || {};
  var config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };
  if (options.includeDatabase !== false) {
    config.database = process.env.DB_NAME || 'nstp_system';
  }
  if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))) {
    const caPath = path.join(__dirname, 'ca.pem');
    if (fs.existsSync(caPath)) {
      config.ssl = {
        ca: fs.readFileSync(caPath),
        rejectUnauthorized: false
      };
    } else {
      config.ssl = { rejectUnauthorized: false };
    }
  }
  return config;
}

module.exports = { getDbConfig };
