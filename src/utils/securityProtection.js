/**
 * Security & Anti-Inspection Protection Module
 * Cavite State University - NSTP System
 * 
 * - Disables Right-Click Context Menu across all browsers
 * - Blocks DevTools & View-Source shortcuts (F12, Ctrl/Cmd+Shift/Option+I, J, C, K, E, U, S)
 * - Completely silences and purges console output (no sensitive logs/tokens/errors visible)
 * - Prevents element/asset dragging to reveal source URLs
 * - Continuous console scrubbing
 */

export function initSecurityProtection() {
  if (typeof window === 'undefined') return;

  const blockEvent = (e) => {
    if (!e) return false;
    try {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    } catch (_) {}
    return false;
  };

  // 1. Disable Right-Click Context Menu globally
  window.addEventListener('contextmenu', blockEvent, { capture: true, passive: false });
  document.addEventListener('contextmenu', blockEvent, { capture: true, passive: false });

  // 2. Disable DevTools, View Source, and Inspect Element Keyboard Shortcuts
  const onKeyDown = (e) => {
    const isCtrlOrCmd = Boolean(e.ctrlKey || e.metaKey);
    const isShiftOrAlt = Boolean(e.shiftKey || e.altKey);
    const key = (e.key || '').toLowerCase();
    const code = e.code || '';
    const keyCode = e.keyCode || e.which;

    // F12 key (Windows/Linux/Mac)
    if (key === 'f12' || code === 'F12' || keyCode === 123) {
      return blockEvent(e);
    }

    // Ctrl/Cmd + Shift/Alt/Option + [I, J, C, K, E, P, S]
    // Blocks DevTools, Console, Inspector Element Picker, Network, Command Palette
    if (isCtrlOrCmd && (isShiftOrAlt || e.altKey || e.shiftKey)) {
      if (
        key === 'i' || key === 'j' || key === 'c' || key === 'k' || key === 'e' || key === 'p' || key === 's' ||
        code === 'KeyI' || code === 'KeyJ' || code === 'KeyC' || code === 'KeyK' || code === 'KeyE' || code === 'KeyP' || code === 'KeyS' ||
        keyCode === 73 || keyCode === 74 || keyCode === 67 || keyCode === 75 || keyCode === 69 || keyCode === 80 || keyCode === 83
      ) {
        return blockEvent(e);
      }
    }

    // Ctrl/Cmd + U (View Source), Ctrl/Cmd + S (Save Page)
    if (isCtrlOrCmd && !isShiftOrAlt) {
      if (
        key === 'u' || key === 's' ||
        code === 'KeyU' || code === 'KeyS' ||
        keyCode === 85 || keyCode === 83
      ) {
        return blockEvent(e);
      }
    }
  };

  window.addEventListener('keydown', onKeyDown, { capture: true, passive: false });
  document.addEventListener('keydown', onKeyDown, { capture: true, passive: false });

  // 3. Disable Dragging of Images, Canvases, and Links
  const onDragStart = (e) => {
    const tag = e.target && e.target.nodeName ? e.target.nodeName.toUpperCase() : '';
    if (tag === 'IMG' || tag === 'CANVAS' || tag === 'A' || tag === 'VIDEO') {
      blockEvent(e);
    }
  };
  window.addEventListener('dragstart', onDragStart, { capture: true });
  document.addEventListener('dragstart', onDragStart, { capture: true });

  // 4. Silence and Scrub Console to ensure NO sensitive data/errors/objects are visible
  const silenceConsole = () => {
    const noop = () => {};
    const methods = [
      'log', 'info', 'warn', 'error', 'debug', 'table', 'trace',
      'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd',
      'time', 'timeEnd', 'timeLog', 'count', 'assert', 'profile', 'profileEnd'
    ];

    if (window.console) {
      methods.forEach((fn) => {
        try {
          if (window.console[fn] !== noop) {
            window.console[fn] = noop;
            try {
              Object.defineProperty(window.console, fn, {
                value: noop,
                writable: true,
                configurable: true
              });
            } catch (_) {}
          }
        } catch (_) {}
      });

      try {
        window.console.clear();
      } catch (_) {}
    }
  };

  // Run immediately
  silenceConsole();

  // Continuous scrubbing every second to keep Console completely blank
  setInterval(silenceConsole, 1000);
}
