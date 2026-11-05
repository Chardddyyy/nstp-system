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

// 4. Sources Tab Anti-Debugger Protection & DevTools Detection Guard
function installSourcesAntiDebugger() {
  if (typeof window === 'undefined') return;

  const antiDebuggerTrap = function () {
    try {
      (function () {
        return false;
      }['constructor']('debugger')['call']());
    } catch (_) { }
  };

  const showDevToolsWarning = (show) => {
    try {
      const bannerId = '__nstp_inspect_security_shield';
      let banner = document.getElementById(bannerId);
      if (show) {
        if (!banner && document.body) {
          banner = document.createElement('div');
          banner.id = bannerId;
          banner.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(15,23,42,0.98);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:99999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;padding:24px;-webkit-user-select:none;user-select:none;">
              <div style="width:64px;height:64px;border-radius:20px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:18px;box-shadow:0 10px 25px -5px rgba(239,68,68,0.3);">
                🛡️
              </div>
              <h2 style="font-size:22px;font-weight:900;letter-spacing:-0.02em;margin:0 0 10px;color:#f8fafc;">
                Inspection & Developer Tools Restricted
              </h2>
              <p style="font-size:13.5px;color:#94a3b8;max-width:460px;line-height:1.6;margin:0 0 20px;">
                In compliance with Republic Act No. 10173 (Data Privacy Act of 2012) and Cavite State University - Naic IT Security Policies, viewing, inspecting, or tampering with source code, system elements, or student data is prohibited.
              </p>
              <div style="font-size:12px;font-weight:700;color:#34d399;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);padding:8px 18px;border-radius:12px;">
                Please close Developer Tools / Inspect to continue
              </div>
            </div>
          `;
          document.body.appendChild(banner);
        }
      } else {
        if (banner && banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
      }
    } catch (_) { }
  };

  // Run periodic debugger guard
  try {
    setInterval(antiDebuggerTrap, 800);
  } catch (_) { }

  // Detect DevTools open by window geometry threshold or debugger pause timing
  try {
    setInterval(() => {
      const dw = window.outerWidth - window.innerWidth;
      const dh = window.outerHeight - window.innerHeight;
      const isGeometryOpen = dw > 160 || dh > 160;

      const t0 = performance.now();
      antiDebuggerTrap();
      const isTimingOpen = (performance.now() - t0) > 100;

      const isDevToolsOpen = isGeometryOpen || isTimingOpen;

      if (isDevToolsOpen) {
        if (window.console && typeof window.console.clear === 'function') {
          window.console.clear();
        }
        showDevToolsWarning(true);
      } else {
        showDevToolsWarning(false);
      }
    }, 1000);
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
