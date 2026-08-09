import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'

// Auto-reload page when new deployment replaces chunk assets (prevents 404 chunk load errors)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });

  document.addEventListener('contextmenu', (e) => e.preventDefault());

  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
      ((e.ctrlKey || e.metaKey) && ['U', 'u', 'S', 's'].includes(e.key))
    ) {
      e.preventDefault();
      return false;
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
