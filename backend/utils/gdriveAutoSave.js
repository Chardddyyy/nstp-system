const pool = require('../config/database');

/**
 * Automatically discovers ALL MySQL tables dynamically and saves 100% complete database dump to Google Drive
 * @param {string} activity - Name of activity (e.g. "Student Added", "Student Edited", "Enrollment Approved")
 * @param {boolean} cleanOld - Whether to clean up old test files first
 */
async function autoSaveToGDrive(activity = 'System Activity', cleanOld = false) {
  const webhookUrl = process.env.GDRIVE_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.trim() === '' || webhookUrl.includes('YOUR_DEPLOYMENT_URL')) {
    return;
  }

  try {
    // 1. Dynamically discover ALL tables in MySQL database
    const [tablesResult] = await pool.execute('SHOW TABLES');
    const tableNames = tablesResult.map(r => Object.values(r)[0]);

    const databaseTables = {};
    const summaryCounts = {};

    // 2. Fetch 100% of data rows from EVERY single table
    for (const tableName of tableNames) {
      try {
        const [rows] = await pool.execute(`SELECT * FROM \`${tableName}\``);
        databaseTables[tableName] = rows;
        summaryCounts[tableName] = rows.length;
      } catch (err) {
        databaseTables[tableName] = [];
        summaryCounts[tableName] = 0;
      }
    }

    const timestamp = new Date().toISOString();
    const cleanActivity = activity.replace(/[^a-zA-Z0-9_-]/g, '_');

    const backupPayload = {
      fileName: `CvSU_NSTP_Complete_Database_Dump_${cleanActivity}_${timestamp.slice(0, 10)}`,
      folderId: '1MDK7wfYmKICAzEgFMNlI8iHR2zMwibZI',
      cleanOld: cleanOld,
      backupData: {
        system: 'Cavite State University Naic - NSTP Record & Report Management System',
        backupTimestamp: timestamp,
        triggeredByActivity: activity,
        totalTablesCaptured: tableNames.length,
        tableSummaryCounts: summaryCounts,
        databaseTables: databaseTables
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupPayload)
    });

    if (response.ok) {
      const resJson = await response.json().catch(() => ({}));
      console.log(`[GDRIVE AUTO-SAVE SUCCESS] Complete 100% Database Dump (${tableNames.length} tables) saved directly to Google Drive! Trigger: "${activity}" (File ID: ${resJson.fileId || 'Created'})`);
    } else {
      console.warn(`[GDRIVE AUTO-SAVE WARNING] Webhook HTTP status ${response.status}`);
      await notifyBackupFailure(activity, `Google Drive Webhook HTTP Status ${response.status}`);
    }
  } catch (err) {
    console.error('[GDRIVE AUTO-SAVE ERROR]:', err.message);
    await notifyBackupFailure(activity, err.message);
  }
}

/**
 * Sends emergency email notification to Admin if Google Drive backup fails
 */
async function notifyBackupFailure(activity, errorDetails) {
  try {
    const nodemailer = require('nodemailer');
    const adminEmail = process.env.EMAIL_USER || 'richardbelen99@gmail.com';
    const emailPass = process.env.EMAIL_PASS || 'dbusndgszozlgttd';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: adminEmail, pass: emailPass }
    });

    await transporter.sendMail({
      from: `"CvSU NSTP System Alert" <${adminEmail}>`,
      to: adminEmail,
      subject: `🚨 [ALERT] Google Drive Backup Snapshot Failure - ${activity}`,
      text: `Administrator Alert:\n\nAn automated Google Drive database snapshot failed.\nActivity: ${activity}\nTimestamp: ${new Date().toISOString()}\nDetails: ${errorDetails}\n\nPlease inspect the Aiven MySQL database and Google Drive webhook connection.`,
    });
    console.log('[GDRIVE ALERT SENT] Email failure notice dispatched to Administrator.');
  } catch (e) {
    console.warn('[GDRIVE ALERT NOTICE] Could not dispatch email alert:', e.message);
  }
}

module.exports = { autoSaveToGDrive };
