import { useAuth } from '../context/AuthContext';
import { X, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PUBLIC_ROUTES = ['/', '/enrollment', '/login'];

function RealtimeToastStack() {
  const { user, toasts, dismissToast } = useAuth();
  const location = useLocation();

  if (!user || !toasts?.length) return null;
  if (PUBLIC_ROUTES.includes(location.pathname)) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[9999] pointer-events-none p-4 gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-emerald-900/95 text-white border border-emerald-500/40 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 max-w-xs w-auto animate-fade-in backdrop-blur-md"
          role="alert"
        >
          <div className="flex-shrink-0 w-6 h-6 bg-amber-400 text-emerald-950 rounded-lg flex items-center justify-center font-bold">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-xs text-white truncate">{toast.title}</p>
            <p className="text-emerald-100 text-[11px] font-medium truncate mt-0.5">{toast.message}</p>
          </div>
          <button type="button"
            onClick={() => dismissToast(toast.id)}
            className="flex-shrink-0 text-emerald-200 hover:text-white p-1 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default RealtimeToastStack;
