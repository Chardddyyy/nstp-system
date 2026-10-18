import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  Calendar, User, LogOut, Shield, X, FileCheck, Archive, RotateCcw, Lock, HardDrive
} from 'lucide-react';

const GDRIVE_URL = 'https://drive.google.com/drive/folders/1lWSgMdKMBD8148A_wFb6UufFgmloD4e3';

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

  const [readTick, setReadTick] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleReadEvent = () => setReadTick(t => t + 1);
    window.addEventListener('nstp_conversation_read', handleReadEvent);
    window.addEventListener('nstp_chat_message', handleReadEvent);
    window.addEventListener('storage', handleReadEvent);
    return () => {
      window.removeEventListener('nstp_conversation_read', handleReadEvent);
      window.removeEventListener('nstp_chat_message', handleReadEvent);
      window.removeEventListener('storage', handleReadEvent);
    };
  }, []);

  const totalUnreadMessages = useMemo(() => {
    void readTick;
    if (!user) return 0;
    const currentUserId = String(user.id || user._id || '');
    const isCurrentlyOnChat = location.pathname === '/chat';

    // 1. Read conversations map
    let readMap = {};
    if (typeof window !== 'undefined') {
      try {
        readMap = JSON.parse(localStorage.getItem(`nstp_read_conversations_${user.id}`) || '{}');
      } catch {}
    }

    const activeChatId = isCurrentlyOnChat && typeof window !== 'undefined'
      ? (localStorage.getItem('nstp_active_chat') || null)
      : null;

    // 2. Identify all conversations the current user actually belongs to
    const userConvIdSet = new Set();
    if (Array.isArray(auth.conversations)) {
      auth.conversations.forEach(c => {
        if (c && c.id) userConvIdSet.add(String(c.id));
      });
    }

    const isUserConversation = (convIdStr) => {
      if (!convIdStr) return false;
      if (userConvIdSet.has(convIdStr)) return true;
      if (convIdStr.startsWith('group-')) return true;
      const parts = convIdStr.split('-');
      if (parts.length === 2 && (parts[0] === currentUserId || parts[1] === currentUserId)) {
        return true;
      }
      return false;
    };

    // 3. Count unread message notifications strictly for this user's conversations
    const notifCount = (auth.notifications || []).filter(n => {
      const isMsg = n.type === 'message' || Boolean(n.conversationId);
      if (!isMsg || n.read) return false;

      // Exclude own messages
      const senderId = String(n.senderId || n.sender_id || '');
      if (senderId && senderId === currentUserId) return false;

      // Exclude conversations user is not a participant in
      const cId = n.conversationId ? String(n.conversationId) : null;
      if (cId && !isUserConversation(cId)) return false;

      // If user is currently looking at this active chat, don't count it as unread
      if (isCurrentlyOnChat && activeChatId && cId === String(activeChatId)) return false;

      // If marked as read in readMap
      if (cId && readMap[cId]) {
        const lastRead = new Date(readMap[cId]).getTime();
        const notifTime = new Date(n.createdAt || n.time || 0).getTime();
        if (lastRead > 0 && notifTime > 0 && notifTime <= lastRead) {
          return false;
        }
      }

      return true;
    }).length;

    // 4. Count in-memory messages strictly for this user's conversations
    let storeCount = 0;
    if (auth.messages && typeof window !== 'undefined') {
      try {
        Object.entries(auth.messages).forEach(([convId, msgList]) => {
          const convIdStr = String(convId);
          // Strictly skip conversations that do NOT belong to this user!
          if (!isUserConversation(convIdStr)) return;

          // If user is currently looking at this active chat, don't count it as unread
          if (isCurrentlyOnChat && activeChatId && convIdStr === String(activeChatId)) return;

          if (!Array.isArray(msgList)) return;
          const lastReadTime = readMap[convIdStr] ? new Date(readMap[convIdStr]).getTime() : 0;

          msgList.forEach(m => {
            if (m.type === 'deleted' || m.is_deleted) return;
            const sId = String(m.sender_id || m.senderId || '');
            if (!sId || sId === currentUserId) return; // Own message

            const mTime = new Date(m.created_at || m.timestamp || 0).getTime();
            if (mTime > lastReadTime) {
              storeCount++;
            }
          });
        });
      } catch {}
    }

    return Math.max(notifCount, storeCount);
  }, [auth.notifications, auth.messages, auth.conversations, user, location.pathname, readTick]);

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

  function handleOpenGoogleDrive(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();

    // Open Google Drive in a new tab
    const driveWin = window.open(GDRIVE_URL, '_blank');

    if (driveWin) {
      let redirected = false;
      const doRedirect = () => {
        if (redirected) return;
        redirected = true;
        navigate(dashPath);
      };

      // Periodic check if the Google Drive tab was closed
      const checkTimer = setInterval(() => {
        try {
          if (driveWin.closed) {
            clearInterval(checkTimer);
            window.removeEventListener('focus', onWindowFocus);
            doRedirect();
          }
        } catch (_) {
          clearInterval(checkTimer);
        }
      }, 400);

      // Also listen for window focus when user returns from the closed tab
      const onWindowFocus = () => {
        setTimeout(() => {
          try {
            if (!driveWin || driveWin.closed) {
              clearInterval(checkTimer);
              window.removeEventListener('focus', onWindowFocus);
              doRedirect();
            }
          } catch (_) {}
        }, 200);
      };

      window.addEventListener('focus', onWindowFocus);

      // Clean up after 30 minutes
      setTimeout(() => {
        clearInterval(checkTimer);
        window.removeEventListener('focus', onWindowFocus);
      }, 30 * 60 * 1000);
    } else {
      navigate('/admin/google-drive');
    }
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

          {/* Google Drive — Admin Only (Direct link to Google Drive) — Locked in Archive Mode */}
          {isAdmin && (
            viewingArchive ? (
              <button
                type="button"
                disabled
                title="Google Drive is locked in Archive Mode (Current Batch only)"
                className={lockedNavClass()}
              >
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-5 h-5" />
                  <span>Google Drive</span>
                </div>
                <span className="flex items-center gap-1 text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-black border border-rose-500/30">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Locked</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenGoogleDrive}
                title="Open Google Drive (Directs to Dashboard when closed)"
                className={navClass('/admin/google-drive')}
              >
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-5 h-5" />
                  <span>Google Drive</span>
                </div>
              </button>
            )
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
            {viewingArchive ? (
              <span className="flex items-center gap-1 text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-black border border-rose-500/30">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            ) : totalUnreadMessages > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs animate-pulse">
                {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
              </span>
            ) : null}
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
          <button type="button" onClick={() => setShowLogoutConfirm(true)}
            className="w-full min-h-[44px] flex items-center justify-center space-x-3 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/30 transition-all duration-200 font-bold active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 text-gray-900 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-center text-gray-900 mb-1">
              Confirm Sign Out
            </h3>
            <p className="text-xs sm:text-sm text-center text-gray-500 mb-5">
              Are you sure you want to log out of your account?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onClose();
                  if (typeof onLogout === 'function') {
                    onLogout();
                  }
                }}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-md shadow-rose-950/20 cursor-pointer active:scale-95"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
