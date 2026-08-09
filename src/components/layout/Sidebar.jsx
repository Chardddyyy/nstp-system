import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  Calendar, User, LogOut, Shield, X, FileCheck
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
      active 
        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-emerald-950 font-black shadow-md shadow-amber-950/30' 
        : 'text-emerald-100/90 hover:bg-emerald-800/60 hover:text-white font-semibold hover:translate-x-1'
    }`;
  }

  function archiveNavClass() {
    return `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
      archiveMode ? 'opacity-40 cursor-not-allowed text-emerald-200/50' : 'text-emerald-100/90 hover:bg-emerald-800/60'
    }`;
  }

  return (
    <>
      {/* Overlay - clicking outside sidebar closes it on all screen sizes */}
      {open && (
        <div
          className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xs z-40"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-2xl border-r border-emerald-800/50 z-50 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-6 border-b border-emerald-800/60">
          {isAdmin ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5 shrink-0 shadow-md backdrop-blur-xs overflow-hidden">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-sm leading-tight text-white tracking-tight">CvSU Naic NSTP</h1>
                  <span className="inline-block text-[10px] font-extrabold uppercase text-amber-300 tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 mt-0.5">
                    Admin Portal
                  </span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="lg:hidden p-1.5 hover:bg-emerald-800 rounded-xl text-emerald-200 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${colors.bg} rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-white/20`}>
                  <Shield className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-xs leading-tight text-white tracking-tight">CvSU Naic NSTP</h1>
                  <span className="inline-block text-[10px] font-extrabold uppercase text-amber-300 tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 mt-0.5 truncate max-w-full">
                    {user?.department} Instructor
                  </span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="lg:hidden p-1.5 hover:bg-emerald-800 rounded-xl text-emerald-200 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1.5">
          <button type="button" onClick={() => go(dashPath)}
            disabled={archiveMode}
            className={isAdmin ? (archiveMode
              ? 'w-full flex items-center space-x-3 px-4 py-3 rounded-xl opacity-40 cursor-not-allowed text-emerald-200/50'
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
            onClick={() => { if (!archiveMode) go('/letter-formats'); }}
            disabled={archiveMode}
            className={archiveMode ? archiveNavClass() : navClass('/letter-formats')}
          >
            <FileCheck className="w-5 h-5" />
            <span>Letter Formats</span>
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-800/60 bg-emerald-950/40">
          <button type="button" onClick={onLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/30 transition-all duration-200 font-bold active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
