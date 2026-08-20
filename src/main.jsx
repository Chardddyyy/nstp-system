import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { initSecurityProtection } from './utils/securityProtection';

// Initialize full inspect, shortcut, and anti-debugging protection
initSecurityProtection();

// Auto-reload page when new deployment replaces chunk assets (prevents 404 chunk load errors)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
