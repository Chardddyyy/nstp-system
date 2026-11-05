/**
 * Security, Anti-Inspect & Data Privacy Protection Module
 * Cavite State University - NSTP Record & Report Management System
 * 
 * - Blocks Right-Click Context Menu ("Inspect", "View Page Source")
 * - Blocks DevTools shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
 * - Protects Sources Tab: Employs dynamic anti-debugger loop to halt and prevent source code inspection
 * - Silences and sanitizes browser Console logs to prevent variable/token leaks
 * - Transparent LocalStorage Shield (obfuscates sensitive student PII, grades, and tokens in Application tab)
 * - Enforces Republic Act No. 10173 (Data Privacy Act of 2012)
 */

const SENSITIVE_STORAGE_KEYS = new Set([
  'token',
  'user',
  'role',
  'nstp_token',
  'enrollmentFormData',
  'nstp_cached_students',
  'nstp_cached_grades',
  'nstp_cached_attendance_records',
  'nstp_cached_user',
  'nstp_cached_all_users',
  'nstp_users',
  'nstp_letter_templates',
  'nstp_cached_messages',
  'nstp_cached_conversations',
  'nstp_cached_archives',
  'nstp_cached_archives_v5',
  'nstp_cached_archives_v6',
  'nstp_archive_view_data_v5',
  'nstp_archive_view_data_v6'
]);

const SEC_PREFIX = '__nstp_sec_v1__:';

function encodeStorageValue(val) {
  if (val === null || val === undefined) return val;
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  try {
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

// 1. Transparent LocalStorage Shield (obfuscates student records & tokens in DevTools Application tab)
function installStorageShield() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const rawStorage = window.localStorage;
    const proto = Object.getPrototypeOf(rawStorage);
    const origGetItem = proto.getItem.bind(rawStorage);
    const origSetItem = proto.setItem.bind(rawStorage);

    SENSITIVE_STORAGE_KEYS.forEach((key) => {
      try {
        const existing = origGetItem(key);
        if (existing && !existing.startsWith(SEC_PREFIX)) {
          origSetItem(key, encodeStorageValue(existing));
        }
      } catch (_) { }
    });

    proto.setItem = function (key, val) {
      if (SENSITIVE_STORAGE_KEYS.has(key)) {
        return origSetItem(key, encodeStorageValue(val));
      }
      return origSetItem(key, val);
    };

    proto.getItem = function (key) {
      const val = origGetItem(key);
      if (SENSITIVE_STORAGE_KEYS.has(key)) {
        return decodeStorageValue(val);
      }
      return val;
    };
  } catch (_) { }
}

// 2. Right-Click Context Menu Blocker (blocks "Inspect", "Inspect Element", "View Source")
function installContextMenuBlocker() {
  if (typeof window === 'undefined' || !window.document) return;

  window.document.addEventListener('contextmenu', function (e) {
    const target = e.target;
    // Allow right-click ONLY on user editable input fields (to paste text, COR ID, etc.)
    const isEditable = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
    if (!isEditable) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}

// 3. DevTools Keyboard Shortcut Blocker
function installDevToolsShortcutBlocker() {
  if (typeof window === 'undefined' || !window.document) return;

  window.document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = (e.key || '').toLowerCase();
    const keyCode = e.keyCode;

    // Ctrl+Shift+I / Cmd+Option+I (Inspect)
    if (isCtrlOrCmd && isShift && (key === 'i' || keyCode === 73)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+J / Cmd+Option+J (Console)
    if (isCtrlOrCmd && isShift && (key === 'j' || keyCode === 74)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
    if (isCtrlOrCmd && isShift && (key === 'c' || keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+U / Cmd+Option+U (View Page Source)
    if (isCtrlOrCmd && (key === 'u' || keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page HTML)
    if (isCtrlOrCmd && (key === 's' || keyCode === 83)) {
      const target = e.target;
      const isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (!isEditable) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, true);
}

// 4. Sources Tab Anti-Debugger Protection (halts DevTools execution if Sources is opened)
function installSourcesAntiDebugger() {
  if (typeof window === 'undefined') return;

  // Protect Sources tab using self-invoking constructor debugger loop
  const antiDebuggerTrap = function () {
    try {
      (function () {
        return false;
      }['constructor']('debugger')['call']());
    } catch (_) { }
  };

  // Run periodic debugger guard
  try {
    setInterval(antiDebuggerTrap, 1000);
  } catch (_) { }

  // Detect DevTools open by window geometry threshold and clear console
  try {
    let lastWidth = window.outerWidth - window.innerWidth;
    let lastHeight = window.outerHeight - window.innerHeight;
    setInterval(() => {
      const dw = window.outerWidth - window.innerWidth;
      const dh = window.outerHeight - window.innerHeight;
      if (dw > 160 || dh > 160) {
        // DevTools is open: clear console and run anti-debugger
        if (window.console && typeof window.console.clear === 'function') {
          window.console.clear();
        }
        antiDebuggerTrap();
      }
      lastWidth = dw;
      lastHeight = dh;
    }, 1500);
  } catch (_) { }
}

// 5. Console Silencer & Sanitizer (prevents source variables, tokens, and data from appearing in Console)
function installConsoleShield() {
  if (typeof window === 'undefined' || !window.console) return;

  try {
    const noop = function () {};
    // Neutralize standard verbose console outputs in client browser
    window.console.log = noop;
    window.console.info = noop;
    window.console.debug = noop;
    window.console.dir = noop;
    window.console.table = noop;
    window.console.trace = noop;

    // Sanitize critical warnings or errors
    const origWarn = window.console.warn ? window.console.warn.bind(window.console) : noop;
    const origError = window.console.error ? window.console.error.bind(window.console) : noop;

    const sanitizeMsg = (args) => {
      try {
        return args.map(a => {
          if (typeof a === 'string') {
            return a
              .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [PROTECTED]')
              .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g, '[PROTECTED_TOKEN]');
          }
          return '[Data Protected]';
        });
      } catch (_) {
        return ['[Protected Data]'];
      }
    };

    window.console.warn = function (...args) {
      origWarn(...sanitizeMsg(args));
    };

    window.console.error = function (...args) {
      origError(...sanitizeMsg(args));
    };

    // Print official university security notice once in Console
    if (typeof origWarn === 'function') {
      try {
        origWarn(
          '%c[SECURITY NOTICE] Cavite State University - Naic (CvSU Naic)\nInspect element, source code inspection, and DOM tampering are restricted under Republic Act No. 10173 & University IT Security Policies.',
          'color: #047857; font-weight: bold; font-size: 12px; background: #ecfdf5; padding: 6px 10px; border: 1px solid #a7f3d0; border-radius: 6px;'
        );
      } catch (_) { }
    }
  } catch (_) { }
}

// Master Security Initializer
export function initSecurityProtection() {
  if (typeof window === 'undefined') return;

  // 1. Obfuscate student records, grades, and tokens in LocalStorage
  installStorageShield();

  // 2. Block right-click context menu ("Inspect", "View Source")
  installContextMenuBlocker();

  // 3. Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
  installDevToolsShortcutBlocker();

  // 4. Block Sources tab with anti-debugger trap
  installSourcesAntiDebugger();

  // 5. Silence and sanitize Console tab
  installConsoleShield();
}
