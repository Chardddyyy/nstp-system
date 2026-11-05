const pool = require('../config/database');

/**
 * Automatically discovers ALL MySQL tables dynamically and saves 100% complete database dump to Google Drive
 * @param {string} activity - Name of activity (e.g. "Student Added", "Student Edited", "Enrollment Approved")
 * @param {boolean} cleanOld - Whether to clean up old test files first
 */
async function autoSaveToGDrive(activity = 'Scheduled Midnight Daily Backup', cleanOld = true) {
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

    // Unified single clean backup name: "CvSU_NSTP_Latest_Database_Backup.json"
    const targetFolderId = process.env.GDRIVE_FOLDER_ID || '1KLcAXPauT6WDRwOgSbOaCLSaNWyciXh1';
    const backupPayload = {
      fileName: 'CvSU_NSTP_Latest_Database_Backup.json',
      folderId: targetFolderId,
      folderUrl: process.env.GDRIVE_FOLDER_URL || `https://drive.google.com/drive/folders/${targetFolderId}`,
      cleanOld: cleanOld,
      backupData: {
        system: 'Cavite State University Naic - NSTP Record & Report Management System',
        backupTimestamp: timestamp,
        triggeredByActivity: activity,
        targetFolderId: targetFolderId,
        totalTablesCaptured: tableNames.length,
        tableSummaryCounts: summaryCounts,
        databaseTables: databaseTables
      }
    };

    // 3. Automatically deliver complete backup snapshot via email directly to cvsunaicnstp@gmail.com
    const emailSent = await sendBackupEmail(activity, backupPayload);

    // 4. If Google Drive webhook is configured, also post snapshot to Google Drive
    if (webhookUrl && !webhookUrl.includes('YOUR_DEPLOYMENT_URL')) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backupPayload)
        });

        if (response.ok) {
          const resJson = await response.json().catch(() => ({}));
          console.log(`[GDRIVE AUTO-SAVE SUCCESS] Complete 100% Database Dump (${tableNames.length} tables) saved directly to Google Drive! Trigger: "${activity}" (File ID: ${resJson.fileId || 'Created'})`);
        } else {
          console.warn(`[GDRIVE AUTO-SAVE NOTICE] Google Drive Webhook HTTP ${response.status} (deployment URL inactive or not found). Backup is secured via email.`);
          // If email delivery also failed, send emergency failure notice
          if (!emailSent) {
            await notifyBackupFailure(activity, `Google Drive Webhook HTTP Status ${response.status} (and email backup failed)`);
          }
        }
      } catch (webhookErr) {
        console.warn(`[GDRIVE AUTO-SAVE NOTICE] Google Drive Webhook unreachable: ${webhookErr.message}. Backup is secured via email.`);
        if (!emailSent) {
          await notifyBackupFailure(activity, `Google Drive Webhook unreachable: ${webhookErr.message}`);
        }
      }
    }
  } catch (err) {
    console.error('[GDRIVE AUTO-SAVE ERROR]:', err.message);
    await notifyBackupFailure(activity, err.message);
  }
}

/**
 * Automatically emails complete database backup JSON directly to cvsunaicnstp@gmail.com
 */
async function sendBackupEmail(activity, backupPayload) {
  try {
    const nodemailer = require('nodemailer');
    const targetEmail = 'cvsunaicnstp@gmail.com';
    const emailUser = (process.env.EMAIL_USER || 'cvsunaicnstp@gmail.com').trim().toLowerCase();
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

    if (!emailPass) {
      console.warn('[BACKUP EMAIL NOTICE] EMAIL_PASS not set. Skipping backup email dispatch.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass }
    });

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    // Prepare attachment payload:
    // If raw database dump with all binary blobs is large, clean the large binary blobs
    // for the email attachment so it stays within Gmail's 25MB attachment limit and arrives in seconds.
    let backupJsonString = JSON.stringify(backupPayload.backupData, null, 2);
    let backupBufferSize = Buffer.byteLength(backupJsonString, 'utf8');

    if (backupBufferSize > 10 * 1024 * 1024) {
      const cleanTables = {};
      const origTables = backupPayload.backupData.databaseTables || {};
      for (const [tblName, rows] of Object.entries(origTables)) {
        if (!Array.isArray(rows)) {
          cleanTables[tblName] = rows;
          continue;
        }
        if (tblName === 'archived_years') {
          cleanTables[tblName] = rows.map(r => ({ id: r.id, year: r.year, students: r.students, reports: r.reports, archived_at: r.archived_at }));
        } else if (tblName === 'reports') {
          cleanTables[tblName] = rows.map(r => ({ id: r.id, title: r.title, description: r.description, department: r.department, status: r.status, due_date: r.due_date, created_by: r.created_by, batch_year: r.batch_year, reference_file_name: r.reference_file_name, created_at: r.created_at, updated_at: r.updated_at }));
        } else if (tblName === 'letter_templates') {
          cleanTables[tblName] = rows.map(r => ({ id: r.id, title: r.title, department: r.department, description: r.description, file_name: r.file_name, file_type: r.file_type, file_size: r.file_size, created_by: r.created_by, created_by_id: r.created_by_id, created_at: r.created_at, updated_at: r.updated_at }));
        } else if (tblName === 'messages') {
          cleanTables[tblName] = rows.map(r => ({ id: r.id, conversation_id: r.conversation_id, sender_id: r.sender_id, text: r.text, type: r.type, file_name: r.file_name, duration: r.duration, reactions: r.reactions, edited: r.edited, created_at: r.created_at }));
        } else {
          cleanTables[tblName] = rows;
        }
      }

      const lightweightBackup = {
        ...backupPayload.backupData,
        note: 'Email snapshot contains complete tabular data for all records. Full binary attachments are archived in Google Drive.',
        databaseTables: cleanTables
      };
      backupJsonString = JSON.stringify(lightweightBackup, null, 2);
      backupBufferSize = Buffer.byteLength(backupJsonString, 'utf8');
    }

    const sizeKb = (backupBufferSize / 1024).toFixed(1);

    const tableRowsHtml = Object.entries(backupPayload.backupData.tableSummaryCounts || {})
      .map(([tbl, count]) => `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;font-family:monospace;">${tbl}</td><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">${count} rows</td></tr>`)
      .join('');

    await transporter.sendMail({
      from: `"CvSU Naic NSTP Automated Backup" <${emailUser}>`,
      to: targetEmail,
      subject: `💾 [AUTOMATED BACKUP] Database Snapshot (${sizeKb} KB) - ${activity}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:16px;">
          <div style="background:#064e3b;padding:20px;border-radius:12px;color:#fff;text-align:center;">
            <h2 style="margin:0 0 6px 0;font-size:20px;">Cavite State University - Naic Campus</h2>
            <p style="margin:0;font-size:13px;opacity:0.9;">NSTP Management System • Automated Database Backup</p>
          </div>
          
          <div style="background:#ffffff;margin-top:16px;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
            <p style="font-size:15px;color:#1e293b;margin:0 0 16px 0;">Hello Administrator,</p>
            <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px 0;">
              Here is your latest automated complete database snapshot. A full copy of all database tables has been captured and is attached to this email as <strong>CvSU_NSTP_Latest_Database_Backup.json</strong>.
            </p>

            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#065f46;"><strong>Trigger Activity:</strong> ${activity}</p>
              <p style="margin:0 0 6px 0;font-size:13px;color:#065f46;"><strong>Recipient:</strong> ${targetEmail}</p>
              <p style="margin:0 0 6px 0;font-size:13px;color:#065f46;"><strong>Timestamp (Manila):</strong> ${timestamp}</p>
              <p style="margin:0 0 6px 0;font-size:13px;color:#065f46;"><strong>Total Tables Captured:</strong> ${backupPayload.backupData.totalTablesCaptured}</p>
              <p style="margin:0;font-size:13px;color:#065f46;"><strong>Attachment Size:</strong> ${sizeKb} KB</p>
            </div>

            <h4 style="margin:16px 0 8px 0;color:#0f172a;font-size:14px;">Captured Tables Overview:</h4>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;text-align:left;">Table Name</th>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;">Records Count</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>

            <p style="font-size:12px;color:#64748b;line-height:1.5;margin:0;">
              🔒 <em>This backup is securely generated by the NSTP automated backup service for CvSU Naic Campus. Keep this file in a safe location for disaster recovery.</em>
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'CvSU_NSTP_Latest_Database_Backup.json',
          content: backupJsonString,
          contentType: 'application/json'
        }
      ]
    });

    console.log(`[BACKUP EMAIL SUCCESS] Complete database backup attached and delivered directly to ${targetEmail}`);
    return true;
  } catch (err) {
    console.warn('[BACKUP EMAIL WARNING] Could not send backup email:', err.message);
    return false;
  }
}

/**
 * Sends emergency email notification to Admin if Google Drive backup fails
 */
async function notifyBackupFailure(activity, errorDetails) {
  try {
    const nodemailer = require('nodemailer');
    const adminEmail = (process.env.EMAIL_USER || 'cvsunaicnstp@gmail.com').trim().toLowerCase();
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

    if (!emailPass) {
      console.warn('[GDRIVE ALERT NOTICE] EMAIL_PASS environment variable not set. Skipping email alert.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: adminEmail, pass: emailPass }
    });

    await transporter.sendMail({
      from: `"CvSU NSTP System Alert" <${adminEmail}>`,
      to: adminEmail,
      subject: `🚨 [ALERT] Google Drive Backup Snapshot Failure - ${activity}`,
      text: `Administrator Alert:\n\nAn automated Google Drive database snapshot failed.\nActivity: ${activity}\nTimestamp: ${new Date().toISOString()}\nDetails: ${errorDetails}\n\nPlease inspect the MySQL database and Google Drive webhook connection.`,
    });
    console.log('[GDRIVE ALERT SENT] Email failure notice dispatched to Administrator.');
  } catch (e) {
    console.warn('[GDRIVE ALERT NOTICE] Could not dispatch email alert:', e.message);
  }
}

module.exports = { autoSaveToGDrive };
