/**
 * SMS Dispatcher Service (DISABLED)
 * SMS notifications have been decommissioned for this system.
 * All functions are no-op stubs to ensure zero network requests and prevent crashes.
 */

function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) {
    return { local: digits, international: '63' + digits.slice(1) };
  }
  if (digits.length === 12 && digits.startsWith('639')) {
    return { local: '0' + digits.slice(2), international: digits };
  }
  return null;
}

async function sendSms() {
  return { success: false, skipped: true, reason: 'SMS notifications disabled' };
}

async function notifyInstructors() {
  return [];
}

module.exports = {
  sendSms,
  notifyInstructors,
  normalizePhoneNumber
};
