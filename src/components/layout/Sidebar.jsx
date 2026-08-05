import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  Calendar, User, LogOut, Shield, X,
} from 'lucide-react';

const DEPT_COLORS = {
  CWTS:  { bg: 'bg-blue-500',  text: 'text-white' },
  LTS:   { bg: 'bg-yellow-500', text: 'text-white' },
  ROTC:  { bg: 'bg-red-500',   text: 'text-white' },
  Admin: { bg: 'bg-green-600', text: 'text-white' },
};

export default function Sidebar({ open, onClose, onLogout, user, archiveMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const dashPath = isAdmin ? '/admin/dashboard' : '/instructor/dashboard';
  const colors = DEPT_COLORS[user?.department] || DEPT_COLORS.Admin;

  function go(path) {
    navigate(path);
    onClose();
  }

  function navClass(path) {
    const active = location.pathname === path;
    return `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
      active ? 'bg-gradient-to-r from-emerald-600 to-green-700 font-bold shadow-md shadow-emerald-950/30' : 'hover:bg-green-700/60 font-medium hover:translate-x-1'
    }`;
  }

  function archiveNavClass() {
    return `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
      archiveMode ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'
    }`;
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 bg-green-800 text-white shadow-xl z-50 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-6 border-b border-green-700">
          {isAdmin ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-9 h-9 object-contain flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="font-bold text-sm leading-tight text-white">CvSU Naic NSTP</h1>
                  <p className="text-xs text-green-200">Admin Control Panel</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="lg:hidden p-1 hover:bg-green-700 rounded text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Shield className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base leading-tight">Cavite State University Naic</h1>
                <p className="text-xs text-green-200 truncate">{user?.department} Instructor</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1">
          <button type="button" onClick={() => go(dashPath)}
            disabled={archiveMode}
            className={isAdmin ? (archiveMode
              ? 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg opacity-40 cursor-not-allowed'
              : navClass(dashPath))
              : navClass(dashPath)}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button type="button" onClick={() => go('/students')} className={navClass('/students')}>
            <Users className="w-5 h-5" />
            <span>{isAdmin ? 'Students' : 'My Students'}</span>
          </button>

          <button type="button" onClick={() => go('/reports')} className={navClass('/reports')}>
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>

          <button type="button"
            onClick={() => { if (!archiveMode) go('/chat'); }}
            disabled={archiveMode}
            className={archiveMode ? archiveNavClass() : navClass('/chat')}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>

          <button type="button"
            onClick={() => { if (!archiveMode) go('/calendar'); }}
            disabled={archiveMode}
            className={archiveMode ? archiveNavClass() : navClass('/calendar')}
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </button>

          <button type="button"
            onClick={() => { if (!archiveMode) go('/profile'); }}
            disabled={archiveMode}
            className={archiveMode ? archiveNavClass() : navClass('/profile')}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button type="button" onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-rose-900/40 hover:text-rose-200 transition-all duration-200 text-rose-300 font-semibold active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
