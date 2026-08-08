import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent Inspect Element, Right Click, and DevTools Shortcuts
if (typeof window !== 'undefined') {
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
