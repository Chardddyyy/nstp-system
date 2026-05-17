import { useAuth } from '../App';
import { X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function RealtimeToastStack() {
  const { user, toasts, dismissToast } = useAuth();
  const navigate = useNavigate();

  if (!user || !toasts?.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white border border-green-200 shadow-xl rounded-xl p-4 flex gap-3"
          role="alert"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
            <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{toast.message}</p>
            {toast.link && (
              <button
                type="button"
                onClick={() => {
                  navigate(toast.link);
                  dismissToast(toast.id);
                }}
                className="mt-2 text-xs font-medium text-green-700 hover:text-green-900 underline"
              >
                View
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default RealtimeToastStack;
