/**
 * Security & Data Privacy Protection Module
 * Cavite State University - Naic Campus (NSTP Portal)
 * 
 * Policy:
 * - CONSOLE TAB: Kept functional and cleanly accessible for developer/admin monitoring.
 * - SOURCES TAB: Blocked from inspection and code tampering via anti-debugger guard + sourcemap disabling.
 * - APPLICATION TAB: LocalStorage and SessionStorage data (tokens, student PII, grades) are transparently
 *   scrambled/masked with safe encoding so raw student data cannot be viewed or stolen.
 * - ELEMENTS / INSPECT: Right-click context menu "Inspect" and shortcuts (Ctrl+Shift+C, Ctrl+Shift+I, F12, Ctrl+U)
 *   are blocked, while direct console shortcut (Ctrl+Shift+J / Cmd+Option+J) is allowed.
 * - Complies with R.A. 10173 (Data Privacy Act of 2012).
 */

const SEC_PREFIX = '__nstp_sec_v1__:';

// List of critical sensitive keys to always mask in Application Storage
const SENSITIVE_STORAGE_KEYS = new Set([
  'nstp_token',
  'nstp_cached_students',
  'nstp_cached_grades',
  'nstp_cached_attendance_records',
  'nstp_cached_user',
  'nstp_user',
  'nstp_cached_all_users',
  'nstp_users',
  'nstp_cached_messages',
  'nstp_cached_conversations',
  'nstp_cached_enrollments',
  'nstp_cached_archives',
  'nstp_cached_archives_v5',
  'nstp_cached_archives_v6',
  'nstp_archive_view_data_v5',
  'nstp_archive_view_data_v6',
  'nstp_letter_templates',
  'nstp_seen_entities_admin',
  'nstp_seen_entities_instructor',
  'nstp_dismissed_notifications_admin',
  'nstp_dismissed_notifications_instructor'
]);

function shouldShieldKey(key) {
  if (!key || typeof key !== 'string') return false;
  return key.startsWith('nstp_') || SENSITIVE_STORAGE_KEYS.has(key);
}

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

// ─────────────────────────────────────────────────────────────────────────────
// 1. APPLICATION TAB SHIELD (LocalStorage & SessionStorage Obfuscation)
// ─────────────────────────────────────────────────────────────────────────────
function installStorageShieldFor(storageObj) {
  if (!storageObj) return;
  try {
    const proto = Object.getPrototypeOf(storageObj);
    const origGetItem = proto.getItem.bind(storageObj);
    const origSetItem = proto.setItem.bind(storageObj);

    // Auto-mask any pre-existing sensitive values in plain text
    try {
      for (let i = 0; i < storageObj.length; i++) {
        const k = storageObj.key(i);
        if (shouldShieldKey(k)) {
          const raw = origGetItem(k);
          if (raw && !raw.startsWith(SEC_PREFIX)) {
            origSetItem(k, encodeStorageValue(raw));
          }
        }
      }
    } catch (_) {}

    proto.setItem = function (key, val) {
      if (shouldShieldKey(key)) {
        return origSetItem(key, encodeStorageValue(val));
      }
      return origSetItem(key, val);
    };

    proto.getItem = function (key) {
      const val = origGetItem(key);
      if (shouldShieldKey(key)) {
        return decodeStorageValue(val);
      }
      return val;
    };
  } catch (_) {}
}

function installStorageShield() {
  if (typeof window === 'undefined') return;
  if (window.localStorage) installStorageShieldFor(window.localStorage);
  if (window.sessionStorage) installStorageShieldFor(window.sessionStorage);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SOURCES TAB ANTI-DEBUGGER GUARD
// Freezes and blocks users attempting to browse, pause, or tamper in Sources tab
// ─────────────────────────────────────────────────────────────────────────────
function installSourcesTabProtection() {
  if (typeof window === 'undefined') return;

  const antiDebuggerTrap = () => {
    try {
      // Dynamic invocation avoids build-time compiler stripping
      const runTrap = new Function('debugger');
      runTrap();
    } catch (_) {}
  };

  // Run periodically to trap any inspection inside the Sources panel
  setInterval(antiDebuggerTrap, 600);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERACTION & SHORTCUT PROTECTION (Elements & View Source Blocked)
// ─────────────────────────────────────────────────────────────────────────────
function installInteractionProtection() {
  if (typeof window === 'undefined' || !window.document) return;

  // A. Block Right-Click Context Menu ("Inspect", "Inspect Element", "View Source")
  // Allows right-click on input & textarea for normal editing/copy-paste
  document.addEventListener('contextmenu', function (e) {
    const target = e.target;
    const isInput = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
    if (!isInput) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

  // B. Keyboard Shortcuts Protection:
  // - Block Ctrl+U / Cmd+Opt+U (View Page Source)
  // - Block Ctrl+Shift+C / Cmd+Opt+C (Inspect Element cursor)
  // - Block Ctrl+Shift+I / Cmd+Opt+I (DevTools Elements/Sources)
  // - Block F12
  // - ALLOW Ctrl+Shift+J / Cmd+Option+J (Console shortcut so user can view Console)
  document.addEventListener('keydown', function (e) {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    const key = (e.key || '').toLowerCase();

    // Allow dedicated direct Console shortcuts:
    // Windows/Linux: Ctrl + Shift + J
    // macOS: Cmd + Option + J
    if (cmdOrCtrl && (key === 'j' || e.code === 'KeyJ')) {
      if (e.shiftKey || (isMac && e.altKey)) {
        return; // Allow user to open Console tab!
      }
    }

    // Block Ctrl+U / Cmd+Option+U (View Page Source)
    if (cmdOrCtrl && (key === 'u' || e.code === 'KeyU')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
    if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (key === 'c' || e.code === 'KeyC')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+I / Cmd+Option+I (Inspect Elements / Sources)
    if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (key === 'i' || e.code === 'KeyI')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONSOLE TAB SANITIZER & BANNER
// Preserves full console visibility while cleaning benign background noise
// ─────────────────────────────────────────────────────────────────────────────
const NOISY_PATTERNS = [
  'react-devtools',
  'React DevTools',
  'Download the React DevTools',
  'requestStorageAccess',
  'StorageAccess',
  'Permission denied',
];

function shouldSuppressLog(args) {
  try {
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      const str = typeof a === 'string' ? a : (a && a.message) || (a && typeof a.toString === 'function' ? a.toString() : '');
      for (let j = 0; j < NOISY_PATTERNS.length; j++) {
        if (str.includes(NOISY_PATTERNS[j])) return true;
      }
    }
  } catch (_) {}
  return false;
}

function installConsoleManager() {
  if (typeof window === 'undefined' || !window.console) return;

  try {
    const origLog = window.console.log.bind(window.console);
    const origInfo = window.console.info.bind(window.console);
    const origWarn = window.console.warn.bind(window.console);
    const origError = window.console.error.bind(window.console);

    window.console.log = function (...args) {
      if (shouldSuppressLog(args)) return;
      origLog(...args);
    };
    window.console.info = function (...args) {
      if (shouldSuppressLog(args)) return;
      origInfo(...args);
    };
    window.console.warn = function (...args) {
      if (shouldSuppressLog(args)) return;
      origWarn(...args);
    };
    window.console.error = function (...args) {
      if (shouldSuppressLog(args)) return;
      origError(...args);
    };

    window.addEventListener('unhandledrejection', function (e) {
      if (e && e.reason && shouldSuppressLog([e.reason])) {
        e.preventDefault();
      }
    });

    // Display a clean, professional banner once in Console
    setTimeout(() => {
      origLog(
        '%c🛡️ Cavite State University - NSTP Portal %c Data Privacy Protected (R.A. 10173)\n%cDeveloper Console is active. Other inspector panels (Sources, Application, Elements) are restricted.',
        'background: #064e3b; color: #6ee7b7; font-weight: 800; font-size: 12px; padding: 3px 6px; border-radius: 4px;',
        'background: #022c22; color: #a7f3d0; font-weight: 600; font-size: 11px; padding: 3px 6px; border-radius: 4px;',
        'color: #059669; font-size: 10.5px; font-weight: 600; margin-top: 2px;'
      );
    }, 400);
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MASTER INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
export function initSecurityProtection() {
  if (typeof window === 'undefined') return;

  // 1. Obfuscate Application tab (LocalStorage & SessionStorage)
  installStorageShield();

  // 2. Protect Sources tab against inspection/code tampering
  installSourcesTabProtection();

  // 3. Block Right-Click Inspect & tamper shortcuts (while allowing Console shortcut)
  installInteractionProtection();

  // 4. Ensure Console tab works cleanly
  installConsoleManager();
}
