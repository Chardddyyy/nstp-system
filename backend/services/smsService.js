/**
 * SMS Dispatcher Service for CvSU Naic NSTP System
 * Handles automated SMS notifications to instructors for:
 * 1. Admin Chat Messages
 * 2. Assigned Reports & Compliance Requirements
 * 3. Calendar Events
 * 4. New Instructor Account Creation Welcome SMS
 */

const https = require('https');
const http = require('http');
const pool = require('../config/database');

// Ensure sms_notifications_log table exists
let tableChecked = false;
async function ensureSmsLogTable() {
  if (tableChecked) return;
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sms_notifications_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_phone VARCHAR(50) NOT NULL,
        recipient_name VARCHAR(255),
        event_type VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        provider VARCHAR(50) DEFAULT 'LOG',
        error_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    tableChecked = true;
  } catch (err) {
    console.warn('[SMS Dispatcher] Table check notice:', err.message);
  }
}

/**
 * Standardize Philippine mobile numbers to E.164 and local formats
 * e.g. "0917 123 4567" -> { local: "09171234567", intl: "+639171234567", numeric: "639171234567" }
 */
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('09') && digits.length === 11) {
    return {
      local: digits,
      intl: '+63' + digits.slice(1),
      numeric: '63' + digits.slice(1)
    };
  } else if (digits.startsWith('639') && digits.length === 12) {
    return {
      local: '0' + digits.slice(2),
      intl: '+' + digits,
      numeric: digits
    };
  } else if (digits.length >= 10) {
    return {
      local: digits,
      intl: '+' + digits,
      numeric: digits
    };
  }
  return null;
}

/**
 * Send an SMS via Semaphore (Philippine SMS gateway)
 */
async function sendViaSemaphore(phoneObj, message) {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  if (!apiKey) return null;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      apikey: apiKey,
      number: phoneObj.local,
      message: message,
      sendername: process.env.SEMAPHORE_SENDER_NAME || 'CvSU-NSTP'
    });

    const req = https.request('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ provider: 'SEMAPHORE', response: data });
        } else {
          reject(new Error(`Semaphore HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('Semaphore request timeout')); });
    req.write(postData);
    req.end();
  });
}

/**
 * Send an SMS via Webhook (Google Apps Script or custom SMS Gateway)
 */
async function sendViaWebhook(phoneObj, message, eventType) {
  const webhookUrl = process.env.SMS_WEBHOOK_URL;
  if (!webhookUrl) return null;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      recipient: phoneObj.local,
      recipientIntl: phoneObj.intl,
      message: message,
      eventType: eventType,
      timestamp: new Date().toISOString()
    });

    const client = webhookUrl.startsWith('https') ? https : http;
    const req = client.request(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ provider: 'WEBHOOK', response: data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('SMS Webhook timeout')); });
    req.write(postData);
    req.end();
  });
}

/**
 * Dispatch an SMS to a single recipient with persistent database logging
 */
async function sendSms({ to, recipientName = '', message, eventType = 'NOTIFICATION' }) {
  await ensureSmsLogTable();
  const phoneObj = normalizePhoneNumber(to);

  if (!phoneObj) {
    console.warn(`[SMS Dispatcher] ⚠️ Invalid phone number "${to}" for recipient: ${recipientName}`);
    return { success: false, error: 'Invalid phone number format' };
  }

  let providerUsed = 'CONSOLE_LOG';
  let deliveryStatus = 'SENT';
  let errorMsg = null;

  try {
    // 1. Try Semaphore if configured
    let result = await sendViaSemaphore(phoneObj, message).catch(err => {
      console.warn('[SMS Dispatcher] Semaphore attempt error:', err.message);
      return null;
    });

    // 2. Try Webhook if configured and Semaphore not used
    if (!result) {
      result = await sendViaWebhook(phoneObj, message, eventType).catch(err => {
        console.warn('[SMS Dispatcher] Webhook attempt error:', err.message);
        return null;
      });
    }

    if (result) {
      providerUsed = result.provider;
    }

    console.log(`[SMS Dispatcher] 📱 SMS dispatched to [${recipientName || 'Instructor'}] (${phoneObj.local}) [${eventType} via ${providerUsed}]: "${message}"`);
  } catch (err) {
    deliveryStatus = 'FAILED';
    errorMsg = err.message;
    console.error(`[SMS Dispatcher] ❌ Failed to dispatch SMS to ${phoneObj.local}:`, err.message);
  }

  // Persist to audit log table
  try {
    await pool.execute(
      `INSERT INTO sms_notifications_log (recipient_phone, recipient_name, event_type, message, status, provider, error_details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [phoneObj.local, recipientName || null, eventType, message, deliveryStatus, providerUsed, errorMsg]
    );
  } catch (logErr) {
    console.warn('[SMS Dispatcher] Failed to write to sms_notifications_log:', logErr.message);
  }

  return { success: deliveryStatus === 'SENT', phone: phoneObj.local, provider: providerUsed };
}

/**
 * Dispatch SMS to multiple instructors in parallel (non-blocking)
 */
async function notifyInstructors({ userIds = null, department = null, message, eventType }) {
  try {
    let sql = "SELECT id, name, phone, department FROM users WHERE role = 'instructor' AND phone IS NOT NULL AND phone != ''";
    const params = [];

    if (Array.isArray(userIds) && userIds.length > 0) {
      sql += ` AND id IN (${userIds.map(() => '?').join(',')})`;
      params.push(...userIds);
    } else if (department && department !== 'All Tracks' && department !== 'All' && department !== 'all') {
      sql += ' AND (department = ? OR department IS NULL)';
      params.push(department);
    }

    const [instructors] = await pool.query(sql, params);
    if (!instructors || instructors.length === 0) {
      console.log(`[SMS Dispatcher] No instructor phone numbers found for ${eventType} (dept: ${department || 'All'})`);
      return [];
    }

    console.log(`[SMS Dispatcher] Found ${instructors.length} instructors to notify for ${eventType}`);
    const results = [];
    for (const inst of instructors) {
      if (inst.phone) {
        // Fire asynchronously
        sendSms({
          to: inst.phone,
          recipientName: inst.name,
          message: message,
          eventType: eventType
        }).then(r => results.push(r)).catch(() => {});
      }
    }
    return results;
  } catch (err) {
    console.error('[SMS Dispatcher] notifyInstructors query error:', err.message);
    return [];
  }
}

module.exports = {
  sendSms,
  notifyInstructors,
  normalizePhoneNumber
};
