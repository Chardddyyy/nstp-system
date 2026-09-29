import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  Calendar, User, LogOut, Shield, X, FileCheck, Archive, RotateCcw, Lock, ExternalLink
} from 'lucide-react';

const GDRIVE_URL = 'https://drive.google.com/drive/folders/19yefzA-HIg7TqBe74PlpH_bJn1KzXnsX?dmr=1&ec=wgc-drive-%5Bmodule%5D-goto';

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

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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
    return `w-full min-h-[46px] flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer select-none ${
      active 
        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-emerald-950 font-black shadow-md shadow-amber-950/30' 
        : 'text-emerald-100/90 hover:bg-emerald-800/60 hover:text-white font-semibold hover:translate-x-1'
    }`;
  }

  function lockedNavClass() {
    return 'w-full min-h-[46px] flex items-center justify-between px-4 py-3 rounded-xl transition-colors opacity-45 cursor-not-allowed bg-black/15 text-gray-300/70 border border-white/5 select-none';
  }

  return (
    <>
      {/* Overlay - clicking outside sidebar closes it on all screen sizes */}
      {open && (
        <div
          className="fixed inset-0 bg-emerald-950/70 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-72 sm:w-80 md:w-64 lg:w-72 bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-2xl border-r border-emerald-800/50 z-50 transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-800/60 shrink-0">
          {isAdmin ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700/60">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs scale-110" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-xs sm:text-sm leading-tight text-white tracking-tight">CvSU - Naic Campus</h1>
                  <span className="inline-block text-[9px] sm:text-[10px] font-extrabold uppercase text-amber-300 tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 mt-0.5">
                    Admin Portal
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-emerald-800/80 rounded-xl text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="Close Navigation Menu"
                aria-label="Close Navigation Menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${colors.bg} rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-white/20`}>
                  <Shield className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-xs sm:text-sm leading-tight text-white tracking-tight">CvSU - Naic Campus</h1>
                  <span className="inline-block text-[9px] sm:text-[10px] font-extrabold uppercase text-amber-300 tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 mt-0.5 truncate max-w-full">
                    {user?.department === 'ROTC' ? 'ROTC Training Staff' : `${user?.department} Facilitator`}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-emerald-800/80 rounded-xl text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="Close Navigation Menu"
                aria-label="Close Navigation Menu"
              >
                <X className="w-6 h-6" />
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
          </button>

          <button type="button" onClick={() => go('/students')} className={navClass('/students')}>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5" />
              <span>{isAdmin ? 'Students' : 'My Students'}</span>
            </div>
          </button>

          <button type="button" onClick={() => go('/reports')} className={navClass('/reports')}>
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5" />
              <span>Reports</span>
            </div>
          </button>

          <button type="button" onClick={() => go('/calendar')} className={navClass('/calendar')}>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5" />
              <span>Calendar</span>
            </div>
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

          {/* Google Drive — Admin Only (Direct link to Google Drive) */}
          {isAdmin && (
            <a
              href={GDRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              title="CvSU NSTP Google Drive Repository"
              className={`w-full min-h-[46px] flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer select-none group ${
                location.pathname === '/admin/google-drive'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-emerald-950 font-black shadow-md shadow-amber-950/30'
                  : 'text-emerald-100/90 hover:bg-emerald-800/60 hover:text-white font-semibold hover:translate-x-1'
              }`}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 shrink-0 drop-shadow-xs" viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.1z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d"/>
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc"/>
                  <path d="m73.4 26.5-13.25-22.95c-.8-1.4-1.95-2.5-3.3-3.3l-13.2 22.8 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
                <span>Google Drive</span>
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                location.pathname === '/admin/google-drive'
                  ? 'bg-emerald-950/20 text-emerald-950 border-emerald-950/30'
                  : 'bg-emerald-800/80 group-hover:bg-emerald-700 text-emerald-200 group-hover:text-white border-emerald-700/50'
              }`}>
                <span>Drive</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          )}


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
            className="w-full min-h-[44px] flex items-center justify-center space-x-3 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/30 transition-all duration-200 font-bold active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
