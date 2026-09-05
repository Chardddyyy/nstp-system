import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { initSecurityProtection } from './utils/securityProtection';

// Initialize full inspect, shortcut, and anti-debugging protection
initSecurityProtection();

// Auto-reload page when new deployment replaces chunk assets (prevents 404 chunk load errors)
if (typeof window !== 'undefined') {
  window.name = 'nstp_system_tab';
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });

  // Universal Textfield Enhancement: Globally disable suggestions, autocomplete, and autocorrection
  const sanitizeField = (el) => {
    if (!el || !el.tagName) return;
    const tag = el.tagName.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      if (!['button', 'submit', 'checkbox', 'radio', 'file', 'image', 'hidden'].includes(type)) {
        if (!el.hasAttribute('autocomplete') || el.getAttribute('autocomplete') === 'on' || el.getAttribute('autocomplete') === 'username') {
          el.setAttribute('autocomplete', type === 'password' ? 'new-password' : 'off');
        }
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('autocapitalize', 'none');
        el.setAttribute('spellcheck', 'false');
        el.setAttribute('data-lpignore', 'true');
        el.setAttribute('data-form-type', 'other');
      }
    }
  };

  document.addEventListener('focusin', (e) => sanitizeField(e.target), true);

  const sweepInputs = () => {
    document.querySelectorAll('input, textarea').forEach(sanitizeField);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sweepInputs);
  } else {
    sweepInputs();
  }

  try {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              sanitizeField(node);
              if (node.querySelectorAll) {
                node.querySelectorAll('input, textarea').forEach(sanitizeField);
              }
            }
          });
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
