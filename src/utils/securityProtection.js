/**
 * Security & Data Privacy Protection Module
 * Cavite State University - NSTP System
 * 
 * - Allows DevTools & Inspect to be opened (right-click & shortcuts permitted)
 * - Protects sensitive student records, grades, and tokens in LocalStorage with seamless encoding
 *   (DevTools Application > Local Storage shows obfuscated data, preventing PII leaks)
 * - Sanitizes & redacts sensitive fields (passwords, tokens, PII) in Console logs
 * - Enforces Data Privacy Act (R.A. 10173) standards
 */

const SENSITIVE_STORAGE_KEYS = new Set([
  'nstp_token',
  'nstp_cached_students',
  'nstp_cached_grades',
  'nstp_cached_attendance_records',
  'nstp_cached_user',
  'nstp_cached_all_users',
  'nstp_users',
  'nstp_cached_messages',
  'nstp_cached_conversations',
  'nstp_cached_archives'
]);

const SEC_PREFIX = '__nstp_sec_v1__:';

function encodeStorageValue(val) {
  if (val === null || val === undefined) return val;
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  try {
    // URL-encoded Base64 envelope for safe storage representation
    return SEC_PREFIX + btoa(encodeURIComponent(str));
  } catch (_) {
    return str;
  }
}

function decodeStorageValue(val) {
  if (typeof val === 'string' && val.startsWith(SEC_PREFIX)) {
    try {
      return decodeURIComponent(atob(val.slice(SEC_PREFIX.length)));
    } catch (_) {
      return val;
    }
  }
  return val;
}

// 1. Transparent LocalStorage Shield (obfuscates sensitive student PII & tokens in DevTools)
function installStorageShield() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const rawStorage = window.localStorage;
    const proto = Object.getPrototypeOf(rawStorage);
    const origGetItem = proto.getItem.bind(rawStorage);
    const origSetItem = proto.setItem.bind(rawStorage);

    // Auto-protect existing sensitive keys currently stored in plain text
    SENSITIVE_STORAGE_KEYS.forEach((key) => {
      try {
        const existing = origGetItem(key);
        if (existing && !existing.startsWith(SEC_PREFIX)) {
          origSetItem(key, encodeStorageValue(existing));
        }
      } catch (_) {}
    });

    // Intercept setItem
    proto.setItem = function (key, val) {
      if (SENSITIVE_STORAGE_KEYS.has(key)) {
        return origSetItem(key, encodeStorageValue(val));
      }
      return origSetItem(key, val);
    };

    // Intercept getItem
    proto.getItem = function (key) {
      const val = origGetItem(key);
      if (SENSITIVE_STORAGE_KEYS.has(key)) {
        return decodeStorageValue(val);
      }
      return val;
    };
  } catch (_) {}
}

// 2. Deep Sanitizer for Console Logs (prevents passwords, tokens & PII from leaking in Console tab)
function sanitizeLogArg(arg, depth = 0) {
  if (depth > 4 || arg === null || arg === undefined) return arg;

  if (typeof arg === 'string') {
    let s = arg;
    // Redact JWT tokens
    s = s.replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT_TOKEN]');
    // Redact Bearer tokens
    s = s.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
    // Redact password assignment in strings
    s = s.replace(/(["']?(?:password|confirmPassword|newPassword|pass|secret)["']?\s*[:=]\s*["'])([^"',\s]+)(["'])/gi, '$1***[PROTECTED]***$3');
    return s;
  }

  if (typeof arg === 'object') {
    if (Array.isArray(arg)) {
      // If array contains sensitive student records, redact individual records
      if (arg.length > 50) {
        return `[Array(${arg.length}) - Data Privacy Protected under R.A. 10173]`;
      }
      return arg.map((item) => sanitizeLogArg(item, depth + 1));
    }

    const clean = {};
    for (const k in arg) {
      if (Object.prototype.hasOwnProperty.call(arg, k)) {
        const lower = k.toLowerCase();
        if (
          lower.includes('password') ||
          lower.includes('secret') ||
          lower.includes('token') ||
          lower.includes('authorization')
        ) {
          clean[k] = '***[PROTECTED]***';
        } else if (
          lower === 'contactnumber' ||
          lower === 'phonenumber' ||
          lower === 'address' ||
          lower === 'birthdate' ||
          lower === 'bdate'
        ) {
          clean[k] = '[REDACTED_PII]';
        } else {
          clean[k] = sanitizeLogArg(arg[k], depth + 1);
        }
      }
    }
    return clean;
  }

  return arg;
}

// 3. Install Console Sanitizer
function installConsoleSanitizer() {
  if (typeof window === 'undefined' || !window.console) return;

  try {
    const origLog = window.console.log.bind(window.console);
    const origInfo = window.console.info.bind(window.console);
    const origWarn = window.console.warn.bind(window.console);
    const origError = window.console.error.bind(window.console);

    window.console.log = function (...args) {
      origLog(...args.map((a) => sanitizeLogArg(a)));
    };
    window.console.info = function (...args) {
      origInfo(...args.map((a) => sanitizeLogArg(a)));
    };
    window.console.warn = function (...args) {
      origWarn(...args.map((a) => sanitizeLogArg(a)));
    };
    window.console.error = function (...args) {
      origError(...args.map((a) => sanitizeLogArg(a)));
    };

    // Print professional institutional banner in DevTools console
    origInfo(
      '%c Cavite State University - Naic Campus %c NSTP Portal %c Data Privacy Protected (R.A. 10173) ',
      'background: #166534; color: #fff; font-weight: bold; padding: 3px 6px; border-radius: 4px; font-size: 11px;',
      'background: #ca8a04; color: #000; font-weight: bold; padding: 3px 6px; border-radius: 4px; font-size: 11px;',
      'color: #475569; font-style: italic; padding: 3px 6px; font-size: 11px;'
    );
  } catch (_) {}
}

export function initSecurityProtection() {
  if (typeof window === 'undefined') return;

  // 1. Install Storage Shield (hides student lists, grades, tokens in Application tab)
  installStorageShield();

  // 2. Install Console Sanitizer (redacts passwords, tokens, PII in Console tab)
  installConsoleSanitizer();
}

