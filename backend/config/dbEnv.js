const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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
  return config;
}

module.exports = { getDbConfig };
