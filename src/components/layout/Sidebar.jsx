import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  Calendar, User, LogOut, Shield, X, FileCheck, Archive, RotateCcw, Lock
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
  const auth = useAuth() || {};
  const viewingArchive = archiveMode || auth.viewingArchive || false;
  const archiveViewData = auth.archiveViewData || null;
  const setViewingArchive = auth.setViewingArchive || (() => {});
  const setArchiveViewData = auth.setArchiveViewData || (() => {});

  const isAdmin = user?.role === 'admin';
  const dashPath = isAdmin ? '/admin/dashboard' : '/instructor/dashboard';
  const colors = DEPT_COLORS[user?.department] || DEPT_COLORS.Admin;

  function go(path) {
    navigate(path);
    onClose();
  }

  function handleExitArchive() {
    setViewingArchive(false);
    setArchiveViewData(null);
    navigate(dashPath);
    onClose();
  }

  function navClass(path) {
    const active = location.pathname === path;
    return `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
      active 
        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-emerald-950 font-black shadow-md shadow-amber-950/30' 
        : 'text-emerald-100/90 hover:bg-emerald-800/60 hover:text-white font-semibold hover:translate-x-1'
    }`;
  }

  function lockedNavClass() {
    return 'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors opacity-45 cursor-not-allowed bg-black/15 text-gray-300/70 border border-white/5 select-none';
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

      <aside className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-2xl border-r border-emerald-800/50 z-50 transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-5 border-b border-emerald-800/60 shrink-0">
          {isAdmin ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700/60">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs scale-110" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-sm leading-tight text-white tracking-tight">CvSU Naic NSTP</h1>
                  <span className="inline-block text-[10px] font-extrabold uppercase text-amber-300 tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 mt-0.5">
                    Admin Portal
                  </span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="lg:hidden p-1.5 hover:bg-emerald-800 rounded-xl text-emerald-200 hover:text-white transition-colors cursor-pointer">
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
              <button type="button" onClick={onClose} className="lg:hidden p-1.5 hover:bg-emerald-800 rounded-xl text-emerald-200 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {/* Archived Batch Active Indicator in Sidebar */}
          {viewingArchive && (
            <div className="mb-3 p-3 rounded-2xl bg-amber-400/15 border border-amber-400/35 text-amber-300 shadow-inner">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Archive Mode</span>
                </span>
                <span className="text-[10px] bg-amber-400/25 text-amber-200 px-1.5 py-0.5 rounded-full font-black border border-amber-400/30">
                  Active
                </span>
              </div>
              <p className="text-xs font-black text-white truncate mb-2.5">
                Batch {archiveViewData?.year || 'Historical'}
              </p>
              <button
                type="button"
                onClick={handleExitArchive}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 rounded-xl text-[11px] font-black transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Exit Archive Batch</span>
              </button>
            </div>
          )}

          {/* Nav Items */}
          <button type="button" onClick={() => go(dashPath)} className={navClass(dashPath)}>
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
            {viewingArchive && <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-extrabold">Archive</span>}
          </button>

          <button type="button" onClick={() => go('/students')} className={navClass('/students')}>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5" />
              <span>{isAdmin ? 'Students' : 'My Students'}</span>
            </div>
            {viewingArchive && <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-extrabold">Archive</span>}
          </button>

          <button type="button" onClick={() => go('/reports')} className={navClass('/reports')}>
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5" />
              <span>Reports</span>
            </div>
            {viewingArchive && <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-extrabold">Archive</span>}
          </button>

          <button type="button" onClick={() => go('/calendar')} className={navClass('/calendar')}>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5" />
              <span>Calendar</span>
            </div>
            {viewingArchive && <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-extrabold">Archive</span>}
          </button>

          {/* Letter Formats — Locked in Archive Mode, accessible only in Current Batch */}
          <button
            type="button"
            onClick={() => { if (!viewingArchive) go('/letter-formats'); }}
            disabled={viewingArchive}
            title={viewingArchive ? 'Letter Formats is locked in Archive Mode (Current Batch only)' : 'Letter Formats & Templates'}
            className={viewingArchive ? lockedNavClass() : navClass('/letter-formats')}
          >
            <div className="flex items-center space-x-3">
              <FileCheck className="w-5 h-5" />
              <span>Letter Formats</span>
            </div>
            {viewingArchive && (
              <span className="flex items-center gap-1 text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-black border border-rose-500/30">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            )}
          </button>

          {/* Messages — Locked in Archive Mode, accessible only in Current Batch */}
          <button
            type="button"
            onClick={() => { if (!viewingArchive) go('/chat'); }}
            disabled={viewingArchive}
            title={viewingArchive ? 'Messages is locked in Archive Mode (Current Batch only)' : 'Messages & Chat'}
            className={viewingArchive ? lockedNavClass() : navClass('/chat')}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </div>
            {viewingArchive && (
              <span className="flex items-center gap-1 text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-black border border-rose-500/30">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            )}
          </button>

          {/* Profile — Locked in Archive Mode, accessible only in Current Batch */}
          <button
            type="button"
            onClick={() => { if (!viewingArchive) go('/profile'); }}
            disabled={viewingArchive}
            title={viewingArchive ? 'Profile is locked in Archive Mode (Current Batch only)' : 'User Profile'}
            className={viewingArchive ? lockedNavClass() : navClass('/profile')}
          >
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </div>
            {viewingArchive && (
              <span className="flex items-center gap-1 text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-black border border-rose-500/30">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            )}
          </button>
        </div>

        {/* Logout Footer */}
        <div className="p-4 border-t border-emerald-800/60 bg-emerald-950/40 shrink-0">
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
