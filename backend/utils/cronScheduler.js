const cron = require('node-cron');
const { autoSaveToGDrive } = require('./gdriveAutoSave');
const pool = require('../config/database');

/**
 * Initializes automated background cron schedules
 */
function initCronScheduler() {
  // 1. Midnight Daily Automated Complete Database Dump (00:00 every day)
  // Format: second(optional) minute hour day month day-of-week
  // '0 0 * * *' = at 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] ⏰ Running automated midnight database backup to Google Drive...');
    try {
      await autoSaveToGDrive('Scheduled Midnight Daily Backup');
      await recordBackupTimestamp('daily_midnight');
      console.log('[CRON]  Automated midnight backup completed successfully.');
    } catch (err) {
      console.error('[CRON] ❌ Error running midnight backup:', err.message);
    }
  }, {
    timezone: 'Asia/Manila'
  });

  // 2. Active Session Cleanup every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await pool.execute(
        'DELETE FROM active_visitors WHERE last_seen < NOW() - INTERVAL 1 HOUR'
      ).catch(() => {});
    } catch (_) {}
  });

  console.log('[CRON] Automated scheduler active: Daily midnight backup (00:00 Asia/Manila) registered.');
}

async function recordBackupTimestamp(type = 'manual') {
  try {
    const timestamp = new Date().toISOString();
    await pool.execute(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
      [`last_backup_${type}`, timestamp]
    );
  } catch (err) {
    console.warn('[CRON] Warning recording backup timestamp:', err.message);
  }
}

module.exports = {
  initCronScheduler,
  recordBackupTimestamp
};
