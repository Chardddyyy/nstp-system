const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');

function getDbConfig(options) {
  options = options || {};
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  if (options.includeDatabase !== false) {
    config.database = process.env.DB_NAME || 'nstp_system';
  }

  // Parse connection URI if DATABASE_URL or MYSQL_URL is provided (Standard Cloud / Railway / Self-hosted)
  const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (connectionUri && typeof connectionUri === 'string' && connectionUri.trim() !== '') {
    try {
      const parsed = new URL(connectionUri);
      config.host = parsed.hostname;
      if (parsed.port) {
        config.port = parseInt(parsed.port, 10);
      }
      if (parsed.username) {
        config.user = decodeURIComponent(parsed.username);
      }
      if (parsed.password) {
        config.password = decodeURIComponent(parsed.password);
      }
      if (options.includeDatabase !== false && parsed.pathname && parsed.pathname.length > 1) {
        config.database = decodeURIComponent(parsed.pathname.slice(1));
      }
      if (parsed.searchParams.get('ssl-mode') || parsed.searchParams.get('ssl')) {
        config.ssl = { rejectUnauthorized: false };
      }
    } catch (_) {}
  }

  const useSsl = process.env.DB_SSL === 'true' || Boolean(config.ssl);

  if (useSsl) {
    const envCaCert = process.env.DB_CA_CERT;
    const caPath = path.join(__dirname, 'ca.pem');

    if (envCaCert && envCaCert.trim() !== '') {
      config.ssl = {
        ca: envCaCert,
        rejectUnauthorized: false
      };
    } else if (fs.existsSync(caPath)) {
      try {
        config.ssl = {
          ca: fs.readFileSync(caPath),
          rejectUnauthorized: false
        };
      } catch (_) {
        config.ssl = { rejectUnauthorized: false };
      }
    } else {
      config.ssl = { rejectUnauthorized: false };
    }
  }

  return config;
}

module.exports = { getDbConfig };
