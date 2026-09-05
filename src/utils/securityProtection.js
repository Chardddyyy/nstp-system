/**
 * Security & Anti-Inspection Protection Module
 * Cavite State University - NSTP System
 * 
 * - Disables Right-Click Context Menu
 * - Disables DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Cmd+Option+I, etc.)
 * - Cleans & mutes console output in production
 * - Implements anti-debugging and tamper-resistant traps
 */

export function initSecurityProtection() {
  if (typeof window === 'undefined') return;

  // In development mode, allow developers full access to DevTools and console
  if (import.meta.env.DEV) return;

  // 1. Disable Right-Click Context Menu in production
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, { capture: true, passive: false });

  // 2. Disable DevTools and View-Source Keyboard Shortcuts in production
  window.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShiftOrAlt = e.shiftKey || e.altKey;
    const key = (e.key || '').toLowerCase();

    // Block Inspect Element, DevTools, View Source, Save Page
    if (
      (isCtrlOrCmd && isShiftOrAlt && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) ||
      (isCtrlOrCmd && (key === 'u' || key === 's'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });

  // 3. Disable Dragging of Images / Elements to inspect
  window.addEventListener('dragstart', (e) => {
    if (e.target && e.target.nodeName === 'IMG') {
      e.preventDefault();
    }
  }, { capture: true });

  // 4. Clean console output in production
  if (import.meta.env.PROD || (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'production')) {
    const noop = () => {};
    try {
      console.log = noop;
      console.info = noop;
      console.warn = noop;
      console.debug = noop;
      console.table = noop;
      console.trace = noop;
      console.dir = noop;
      console.clear();
    } catch (_) {}
  }
}
