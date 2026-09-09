import { useAuth } from '../context/AuthContext';
import { archivesAPI, DEFAULT_PAST_BATCHES } from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import AttendanceScannerModal from '../components/AttendanceScannerModal';
import StudentAttendanceMatrixModal from '../components/StudentAttendanceMatrixModal';
import {
  Users, FileText, MessageSquare,
  User, Calendar, Menu, Bell, CheckCircle, AlertCircle, Trash2, X, CheckSquare, Square, TrendingUp, MailOpen,
  Archive, History, FileCheck, RotateCcw, Camera
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import { getAvatarSrc } from '../utils/avatars';

function InstructorDashboard() {
  const { 
    user, 
    logout, 
    students = [], 
    reports = [], 
    conversations = [], 
    messages = {}, 
    notifications = [], 
    setNotifications,
    currentBatch = '2026-2027 1st Semester',
    viewingArchive = false,
    setViewingArchive = () => {},
    archiveViewData = null,
    setArchiveViewData = () => {}
  } = useAuth() || {};
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showAttendanceScanner, setShowAttendanceScanner] = useState(false);
  const [showAttendanceMatrix, setShowAttendanceMatrix] = useState(false);

  // Archives state for instructor
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showArchiveDetails, setShowArchiveDetails] = useState(false);
  const [archivedYears, setArchivedYears] = useState(() => DEFAULT_PAST_BATCHES);

  const loadArchivedYears = async () => {
    try {
      const data = await archivesAPI.getAll();
      setArchivedYears(Array.isArray(data) && data.length > 0 ? data : DEFAULT_PAST_BATCHES);
    } catch {
      setArchivedYears(DEFAULT_PAST_BATCHES);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && user.role === 'instructor') {
        loadArchivedYears();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user]);

  const handleOpenArchiveModal = () => {
    loadArchivedYears();
    setShowArchiveModal(true);
  };

  const handleViewBatch = (batch) => {
    setShowArchiveModal(false);
    // Strictly filter student and report data to instructor's department only
    const existingStudentData = (batch.data?.studentData || batch.studentData || [])
      .filter(s => s && s.department === user?.department);
    const existingReportData = (batch.data?.reportData || batch.reportData || [])
      .filter(r => r && (r.department === 'All' || r.department === user?.department));
    const existingLetterData = batch.data?.letterData || batch.letterData || [];

    setArchiveViewData({
      ...batch,
      studentData: existingStudentData,
      reportData: existingReportData,
      letterData: existingLetterData
    });
    setViewingArchive(true);

    archivesAPI.getByYear(batch.year).then((full) => {
      const sData = (full.studentData || full.data?.studentData || [])
        .filter(s => s && s.department === user?.department);
      const rData = (full.reportData || full.data?.reportData || [])
        .filter(r => r && (r.department === 'All' || r.department === user?.department));
      const lData = full.letterData || full.data?.letterData || [];
      setArchiveViewData((prev) => ({
        ...prev,
        ...batch,
        studentData: sData,
        reportData: rData,
        letterData: lData
      }));
    }).catch(() => {});
  };

  const handleBackToCurrent = () => {
    setViewingArchive(false);
    setArchiveViewData(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!showNotifications) return;
      if (e.target.closest('.notification-container')) return;
      setShowNotifications(false);
      setSelectedNotifications([]);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);
  
  // Get instructor's department students only (switches to archive batch when viewingArchive is true)
  const myStudents = useMemo(() => {
    if (viewingArchive && archiveViewData?.studentData) {
      return (archiveViewData.studentData || []).filter(s => s && s.department === user?.department);
    }
    return (students || []).filter(s => s && s.department === user?.department);
  }, [viewingArchive, archiveViewData, students, user?.department]);

  const myReports = useMemo(() => {
    if (viewingArchive && archiveViewData?.reportData) {
      return (archiveViewData.reportData || []).filter(r => r && (r.department === 'All' || r.department === user?.department));
    }
    return (reports || []).filter(r => r && (r.department === 'All' || r.department === user?.department));
  }, [viewingArchive, archiveViewData, reports, user?.department]);

  // Check if user is loaded - after all hooks
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const unreadCount = (notifications || []).filter(n => !n.read).length;
  
  function notificationIdsMatch(a, b) {
    return String(a) === String(b);
  }

  function handleSelectNotification(id) {
    setSelectedNotifications(function(prev) {
      const has = prev.some(function(nId) { return notificationIdsMatch(nId, id); });
      if (has) {
        return prev.filter(function(nId) { return !notificationIdsMatch(nId, id); });
      }
      return prev.concat([id]);
    });
  }
  
  function handleSelectAll(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const list = notifications || [];
    setSelectedNotifications(function(prev) {
      const allSelected = list.length > 0 && list.every(function(n) {
        return prev.some(function(sid) { return notificationIdsMatch(sid, n.id); });
      });
      if (allSelected) return [];
      return list.map(function(n) { return n.id; });
    });
  }
  
  function handleDeleteSelected(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const selectedSet = new Set(selectedNotifications.map(function(id) { return String(id); }));
    setNotifications(function(prev) {
      return (prev || []).filter(function(n) {
        return !selectedSet.has(String(n.id));
      });
    });
    setSelectedNotifications([]);
  }

  function handleMarkAllRead(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setNotifications(function(prev) {
      if (selectedNotifications.length > 0) {
        return (prev || []).map(function(n) {
          const isSelected = selectedNotifications.some(function(sid) {
            return notificationIdsMatch(sid, n.id);
          });
          return isSelected ? { ...n, read: true } : n;
        });
      }
      return (prev || []).map(function(n) { return { ...n, read: true }; });
    });
    setSelectedNotifications([]);
  }

  function handleMarkOneRead(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(function(prev) {
      return (prev || []).map(function(n) {
        return notificationIdsMatch(n.id, id) ? { ...n, read: true } : n;
      });
    });
  }

  // Handle notification click
  function handleNotificationItemClick(notification) {
    // Mark as read
    const newNotifications = notifications.map(n => {
      if (n.id === notification.id) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(newNotifications);
    
    // Navigate based on type with deep-link query
    if (notification.type === 'student' || notification.type === 'grade') {
      const q = notification.studentName ? `?search=${encodeURIComponent(notification.studentName)}` : '';
      navigate(`/students${q}`);
    } else if (notification.type === 'report') {
      const q = notification.reportId ? `?reportId=${notification.reportId}` : (notification.reportTitle ? `?search=${encodeURIComponent(notification.reportTitle)}` : '');
      navigate(`/reports${q}`);
    } else if (notification.type === 'message') {
      const q = notification.conversationId ? `?convId=${notification.conversationId}` : '';
      navigate(`/chat${q}`);
    } else if (notification.link && notification.link !== '#') {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };



  // Get user avatar display
  const getUserAvatar = () => {
    return (
      <img 
        src={getAvatarSrc(user?.avatar, user?.profilePicture)} 
        alt="Profile" 
        className="w-10 h-10 object-cover rounded-full shadow-xs border border-emerald-600/30"
      />
    );
  };



  const pendingReports = myReports.filter(r => !(r.submissions && r.submissions.some(sub => sub && sub.instructor === user?.name)));

  // Count unread messages across all conversations
  const readConversations = (() => {
    try { return JSON.parse(localStorage.getItem('nstp_read_conversations') || '{}'); }
    catch { return {}; }
  })();

  const pendingMessages = (conversations || []).reduce((total, conv) => {
    if (!conv) return total;
    const convMessages = (messages && messages[conv.id]) || [];
    const lastReadTime = readConversations[conv.id] || 0;
    return total + convMessages.filter(msg => {
      if (!msg) return false;
      const msgTime = new Date(msg.created_at || 0).getTime();
      const isOwn = msg.senderId === user?.id || msg.sender_id === user?.id;
      const isSystem = msg.type === 'system' || msg.message_type === 'system';
      return msgTime > lastReadTime && !isOwn && !isSystem;
    }).length;
  }, 0);

  // Statistics based on instructor's students
  const stats = {
    totalStudents: myStudents.length,
    pendingMessages,
    pendingReports: pendingReports.length,
    completedHours: myStudents.reduce((acc, s) => acc + (parseInt(s.hours) || 0), 0),
  };

  // Get recent students and reports
  const recentStudents = myStudents.slice(0, 5);
  const recentReports = myReports.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50 page-enter">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
        archiveMode={viewingArchive}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Previous Report Header - Show when viewing archive (Exact matching Admin design) */}
        {viewingArchive && archiveViewData && (
          <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-3 sm:mb-6 backdrop-blur-md shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0 border border-amber-400/50">
                  <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-lg font-black text-amber-950 truncate">
                    Viewing Archive: Batch {archiveViewData.year} ({user?.department})
                  </h2>
                  <p className="text-[11px] sm:text-xs text-amber-800/90 font-medium truncate">
                    Historical records preserved for your {user?.department} students.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowArchiveDetails(true)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold px-3 py-1.5 sm:py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Summary</span>
                </button>
                <button
                  type="button"
                  onClick={handleBackToCurrent}
                  className="bg-emerald-800 hover:bg-emerald-900 text-emerald-100 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  <span>Back to Current</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Header - Unified CvSU Naic Aesthetics */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-6 w-full">
          <div className="flex flex-row items-center justify-between gap-1.5 sm:gap-3 relative z-10 w-full">
            <div className="flex items-center space-x-1.5 sm:space-x-3.5 min-w-0 flex-1">
              <button type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 sm:p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer active:scale-95 shadow-xs"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-8 h-8 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs scale-105" />
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h2 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white leading-tight truncate">
                  {viewingArchive ? `Batch ${archiveViewData?.year} (${user?.department})` : (
                    <>
                      <span className="hidden sm:inline">{user?.department} Instructor Portal</span>
                      <span className="sm:hidden">{user?.department} Portal</span>
                    </>
                  )}
                </h2>
                <p className="text-emerald-200 text-[9.5px] xs:text-[10.5px] sm:text-xs lg:text-sm font-medium truncate mt-0.5 max-w-full">
                  {viewingArchive ? `Archived Records • ${user?.department} Department` : `Welcome, ${user?.name || 'Instructor'} 👋`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* Notification Container */}
              <div className="relative notification-container">
                <button type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 sm:p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl sm:rounded-2xl transition-colors cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-amber-400 text-emerald-950 text-[8.5px] sm:text-[10px] font-black rounded-full flex items-center justify-center border border-emerald-950 shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div
                    className="notification-dropdown fixed sm:absolute inset-x-2 sm:inset-auto right-2 sm:right-0 mt-1 sm:mt-3 w-auto sm:w-80 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] text-gray-900 overflow-hidden animate-fade-in"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/90">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button type="button"
                          onClick={handleSelectAll}
                          title={selectedNotifications.length === (notifications || []).length && notifications.length > 0 ? 'Deselect all' : 'Select all'}
                          className="text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {selectedNotifications.length === (notifications || []).length && notifications.length > 0
                            ? <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                            : <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                        <h3 className="font-extrabold text-[11px] sm:text-xs text-gray-900">Notifications ({unreadCount} new)</h3>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-1.5">
                        <button type="button"
                          onClick={handleMarkAllRead}
                          disabled={
                            selectedNotifications.length > 0
                              ? !(notifications || []).some(n => selectedNotifications.some(sid => notificationIdsMatch(sid, n.id)) && !n.read)
                              : (notifications || []).every(n => n.read)
                          }
                          className="text-emerald-700 hover:text-emerald-800 disabled:opacity-30 transition-colors cursor-pointer p-0.5"
                          title={selectedNotifications.length > 0 ? "Mark selected as read" : "Mark all as read"}
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                        </button>
                        <button type="button"
                          onClick={handleDeleteSelected}
                          disabled={selectedNotifications.length === 0}
                          className="text-rose-600 hover:text-rose-700 disabled:opacity-30 transition-colors cursor-pointer p-0.5"
                          title="Delete selected"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button"
                          onClick={() => { setShowNotifications(false); setSelectedNotifications([]); }}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[38vh] sm:max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="p-4 text-center text-gray-400 text-xs font-medium">
                          <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-emerald-800" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-2 sm:p-2.5 transition-colors flex items-start space-x-1.5 sm:space-x-2 ${
                              !notification.read ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-gray-50'
                            }`}
                          >
                            <button type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectNotification(notification.id);
                              }}
                              className="mt-0.5 shrink-0 text-gray-400 hover:text-emerald-600 cursor-pointer"
                            >
                              {selectedNotifications.some(sid => notificationIdsMatch(sid, notification.id)) ? (
                                <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
                              )}
                            </button>
                            <div
                              className="flex-1 cursor-pointer min-w-0"
                              onClick={() => handleNotificationItemClick(notification)}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <h4 className={`text-[11px] sm:text-xs font-bold truncate ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1 shrink-0">
                                  {!notification.read && (
                                    <button type="button"
                                      onClick={(e) => handleMarkOneRead(e, notification.id)}
                                      className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                      title="Mark as read"
                                    >
                                      <MailOpen className="w-3 h-3" />
                                    </button>
                                  )}
                                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">{notification.time}</span>
                                </div>
                              </div>
                              <p className={`text-[10px] sm:text-xs mt-0.5 line-clamp-1 sm:line-clamp-2 ${notification.read ? 'text-gray-500 font-normal' : 'text-gray-700 font-medium'}`}>
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Button - Full Display on Mobile & Desktop */}
              <Link 
                to="/profile" 
                className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-800/90 hover:bg-emerald-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-emerald-600/60 shadow-md transition-all cursor-pointer shrink-0 min-w-0"
                title="View Profile"
              >
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full overflow-hidden border border-emerald-400/60 shadow-xs">
                  {getUserAvatar()}
                </div>
                <div className="text-left min-w-0 flex flex-col justify-center">
                  <p className="font-extrabold text-[10.5px] sm:text-xs text-white leading-tight truncate max-w-[70px] xs:max-w-[100px] sm:max-w-none">{user?.name || 'Instructor'}</p>
                  <p className="text-[8.5px] sm:text-[10px] text-amber-300 font-black uppercase tracking-wider whitespace-nowrap leading-tight">{user?.department ? `${user.department} Instructor` : 'Instructor'}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Attendance QR Scanner Action Banner ────────────────────── */}
        <div className="bg-white rounded-xl sm:rounded-3xl p-2.5 sm:p-4 shadow-sm border border-emerald-100/90 mb-3 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-xs sm:shadow-md shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">Field Attendance Tools</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Quick QR token scanner & attendance matrix</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowAttendanceScanner(true)}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 text-white font-bold text-[10.5px] sm:text-xs rounded-lg sm:rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
              <span>Live QR Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAttendanceMatrix(true)}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 text-white font-bold text-[10.5px] sm:text-xs rounded-lg sm:rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer border border-blue-600/50 whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200" />
              <span>Attendance &amp; Absences</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Cards Grid (3 Clean Cards - Side by Side on Mobile) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-3 sm:mb-6">
          <div
            className="bg-gradient-to-r from-emerald-700 to-green-800 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between min-w-0"
            onClick={() => navigate('/students')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-emerald-100 text-[7.5px] xs:text-[9px] sm:text-xs font-bold uppercase tracking-wider truncate">Students</p>
                  <p className="text-[11px] xs:text-xs sm:text-xl font-black text-white leading-tight mt-0.5">{stats.totalStudents} <span className="text-[8px] font-normal hidden sm:inline">Active</span></p>
                </div>
              </div>
              <span className="hidden xs:inline-block text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-emerald-800 font-semibold transition-all shrink-0">View &rarr;</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between min-w-0"
            onClick={() => navigate('/chat')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-blue-100 text-[7.5px] xs:text-[9px] sm:text-xs font-bold uppercase tracking-wider truncate">Messages</p>
                  <p className="text-[11px] xs:text-xs sm:text-xl font-black text-white leading-tight mt-0.5">{stats.pendingMessages} <span className="text-[8px] font-normal hidden sm:inline">Unread</span></p>
                </div>
              </div>
              <span className="hidden xs:inline-block text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-blue-800 font-semibold transition-all shrink-0">Open &rarr;</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-r from-amber-600 to-yellow-600 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between min-w-0"
            onClick={() => navigate('/reports')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-amber-100 text-[7.5px] xs:text-[9px] sm:text-xs font-bold uppercase tracking-wider truncate">Reports</p>
                  <p className="text-[11px] xs:text-xs sm:text-xl font-black text-white leading-tight mt-0.5">{stats.pendingReports} <span className="text-[8px] font-normal hidden sm:inline">Pending</span></p>
                </div>
              </div>
              <span className="hidden xs:inline-block text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-amber-800 font-semibold transition-all shrink-0">Review &rarr;</span>
            </div>
          </div>
        </div>

        {/* Content Section Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* My Students Card */}
          <div className="bg-white rounded-2xl shadow-md border border-emerald-100/60 p-3 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
              <h3 className="text-xs sm:text-base font-extrabold text-gray-900 flex items-center min-w-0 truncate mr-1">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs sm:text-sm mr-1.5 sm:mr-2 shadow-2xs shrink-0">
                  🎓
                </div>
                <span className="truncate">My {user?.department || ''} Students</span>
              </h3>
              <Link to="/students" className="text-emerald-700 hover:text-emerald-800 text-[11px] sm:text-xs font-extrabold flex items-center gap-1 active:scale-95 transition-all shrink-0">
                <span>View All</span>
                <span>&rarr;</span>
              </Link>
            </div>
            <div className="space-y-2">
              {recentStudents.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No enrolled students assigned yet.</p>
              ) : (
                recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50/80 hover:bg-emerald-50/40 rounded-xl border border-gray-200/60 transition-all group">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                        {(student.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-gray-900 truncate group-hover:text-emerald-800 transition-colors">{student.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium truncate">{student.studentId} • {student.program || 'NSTP'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Reports Card */}
          <div className="bg-white rounded-2xl shadow-md border border-emerald-100/60 p-3 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
              <h3 className="text-xs sm:text-base font-extrabold text-gray-900 flex items-center min-w-0 truncate mr-1">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs sm:text-sm mr-1.5 sm:mr-2 shadow-2xs shrink-0">
                  📄
                </div>
                <span className="truncate">Recent Department Reports</span>
              </h3>
              <Link to="/reports" className="text-amber-800 hover:text-amber-900 text-[11px] sm:text-xs font-extrabold flex items-center gap-1 active:scale-95 transition-all shrink-0">
                <span>Open Reports</span>
                <span>&rarr;</span>
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentReports.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No recent report submissions.</p>
              ) : (
                recentReports.map((report) => (
                  <div key={report.id} className="p-2.5 sm:p-3 bg-gray-50/80 hover:bg-amber-50/40 rounded-xl border border-gray-200/60 transition-all group">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-extrabold text-xs sm:text-sm text-gray-900 truncate group-hover:text-amber-900 transition-colors">{report.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        report.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                        report.status === 'Submitted' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                        'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                      <span>Submitted: {report.date || 'Recently'}</span>
                      <span className="text-amber-800 font-bold">{user?.department} Component</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Batch Management & Department Archive Section - Matching Admin Design */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-2xl shadow-md p-4 sm:p-6 mt-4 sm:mt-6 text-white border border-emerald-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <Archive className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-black text-white leading-tight">
                  {user?.department || 'Department'} Batch Archives &amp; Management
                </h3>
                <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-0.5">
                  Current Active Batch: <span className="font-bold text-amber-300">A.Y. {currentBatch}</span>
                </p>
                <p className="text-emerald-200/80 text-[11px] sm:text-xs mt-1 font-medium">
                  {students.length} students enrolled • {reports.length} reports filed • {archivedYears.length} historical batches
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:items-center sm:space-x-3">
              <button
                type="button"
                onClick={handleOpenArchiveModal}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                <span>View {user?.department} Archives</span>
              </button>
            </div>
          </div>
          <p className="text-emerald-200/90 text-xs mt-3.5 pt-3 border-t border-white/10 font-medium">
            * Historical student batches, letter templates, and department reports are preserved for auditing and accreditation.
          </p>
        </div>

        {/* Archive Modal - Historical Department Batches */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowArchiveModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-emerald-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">{user?.department} Archived Batches</h3>
                    <p className="text-emerald-200 text-xs font-medium">Select a historical batch for your component</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto space-y-3 max-h-[60vh]">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-600">Archived Academic Batches</span>
                </div>

                {archivedYears.length === 0 ? (
                  <div className="text-center py-10">
                    <History className="w-12 h-12 text-emerald-200 mx-auto mb-2 opacity-50" />
                    <p className="text-gray-500 font-bold text-sm">No archived batches found for {user?.department}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...archivedYears].sort((a, b) => {
                      const getSortKey = (item) => {
                        const str = String(item?.year || item || '');
                        const matchYear = str.match(/(\d{4})/);
                        const startYear = matchYear ? parseInt(matchYear[1], 10) : 0;
                        let semRank = 0;
                        if (str.includes('1st')) semRank = 1;
                        else if (str.includes('2nd')) semRank = 2;
                        else if (str.includes('Summer')) semRank = 3;
                        return { startYear, semRank };
                      };
                      const kA = getSortKey(a);
                      const kB = getSortKey(b);
                      if (kA.startYear !== kB.startYear) return kB.startYear - kA.startYear;
                      return kA.semRank - kB.semRank;
                    }).map((year) => {
                      // Calculate strictly department students count for this batch
                      const sList = year.studentData || year.data?.studentData;
                      const deptStudentsCount = Array.isArray(sList) && sList.length > 0
                        ? sList.filter(s => s.department === user?.department).length
                        : (year.data?.[(user?.department || '').toLowerCase()] ?? Math.max(1, Math.round((year.students || 0) / 3)));

                      return (
                        <div
                          key={year.year}
                          className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/80 hover:bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-gray-200/80 hover:border-emerald-300 transition-all gap-3 shadow-2xs group"
                        >
                          <div className="flex items-center space-x-3.5">
                            <div>
                              <h4 className="text-base font-black text-emerald-950">Batch {year.year}</h4>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                  {deptStudentsCount} {user?.department} Students
                                </span>
                                <span className="text-[11px] font-bold text-gray-500">
                                  • {year.reports} Reports
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleViewBatch(year)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                            >
                              View Batch
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Detail View Modal for Instructor - Identical to Admin Design with strict department access */}
        {showArchiveDetails && archiveViewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowArchiveDetails(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-emerald-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 rounded-t-xl z-20 shadow-md">
                <h3 className="text-base sm:text-lg font-bold flex items-center">
                  <Archive className="w-5 h-5 mr-2 text-amber-300" />
                  {user?.department} Batch {archiveViewData.year} Archive Details
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowArchiveDetails(false)}
                    className="p-1 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer text-emerald-200 hover:text-white ml-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">
                {/* Archive Summary - Component Specific */}
                {(() => {
                  const stList = (archiveViewData?.studentData || []).filter(s => s && s.department === user?.department);
                  const totalStudents = stList.length;
                  const yrStr = String(archiveViewData?.year || '');
                  const is1stSemOnly = yrStr.toLowerCase().includes('1st') || (!yrStr.toLowerCase().includes('2nd') && stList.every(s => !s.final_grade_2 && s.semester === '1st Semester'));

                  // Detailed student evaluation function synchronized with StudentManagement
                  const evalStudent = (student) => {
                    const g1 = String(student.final_grade_1 || student.grade_sem1 || (student.semester === '1st Semester' ? student.final_grade : '') || '').trim();
                    const g2 = String(student.final_grade_2 || student.grade_sem2 || (student.semester === '2nd Semester' ? student.final_grade : '') || '').trim();
                    const rawFinal = String(student.final_grade || student.grade || '').trim();
                    const rawStatus = String(student.status || '').toLowerCase().trim();
                    const rawRemarks = String(student.remarks || '').trim().toLowerCase();

                    // Check for failure: explicitly failed status, or failed remark, or 5.00 grade in the relevant semester
                    const isExplicitFailed = rawStatus === 'failed' || rawRemarks === 'failed' || rawFinal === '5.00' ||
                      (is1stSemOnly ? g1 === '5.00' : (g2 === '5.00' || g1 === '5.00'));

                    // Check for drop
                    const isExplicitDropped = rawStatus === 'dropped' || rawRemarks === 'dropped' || rawFinal === 'drp' ||
                      (is1stSemOnly ? g1 === 'DRP' : (g2 === 'DRP' || g1 === 'DRP'));

                    // Check for incomplete
                    const isExplicitInc = rawStatus === 'incomplete' || rawRemarks === 'incomplete' || rawFinal === 'inc' ||
                      (is1stSemOnly ? g1 === 'INC' : (g2 === 'INC' || rawFinal === 'INC'));

                    if (isExplicitFailed) {
                      return { isPass: false, isFail: true, isInc: false, isDrp: false, displayGrade: '5.00', badgeText: 'FAILED', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300' };
                    }
                    if (isExplicitDropped) {
                      return { isPass: false, isFail: false, isInc: false, isDrp: true, displayGrade: 'DRP', badgeText: 'DROPPED', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300' };
                    }
                    if (isExplicitInc) {
                      return { isPass: false, isFail: false, isInc: true, isDrp: false, displayGrade: 'INC', badgeText: 'INCOMPLETE', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' };
                    }

                    const gradeToCheck = is1stSemOnly ? (g1 || rawFinal) : (g2 || rawFinal || g1);
                    const n = parseFloat(gradeToCheck);
                    const isPassingGrade = !isNaN(n) && n >= 1.0 && n <= 3.0;

                    if (isPassingGrade) {
                      return {
                        isPass: true,
                        isFail: false,
                        isInc: false,
                        isDrp: false,
                        displayGrade: gradeToCheck,
                        badgeText: is1stSemOnly ? 'PASSED (1ST SEM)' : 'GRADUATED',
                        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      };
                    }

                    return {
                      isPass: false,
                      isFail: false,
                      isInc: false,
                      isDrp: false,
                      displayGrade: gradeToCheck || '-',
                      badgeText: String(student.status || 'Active').toUpperCase(),
                      badgeColor: 'bg-gray-100 text-gray-700 border-gray-200'
                    };
                  };

                  const evaluated = stList.map(s => ({ ...s, ev: evalStudent(s) }));
                  const passCount = evaluated.filter(s => s.ev.isPass).length;
                  const failCount = evaluated.filter(s => s.ev.isFail).length;
                  const incCount = evaluated.filter(s => s.ev.isInc).length;
                  const dropCount = evaluated.filter(s => s.ev.isDrp).length;

                  return (
                    <div className="space-y-4">
                      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
                          <div>
                            <h4 className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-wider">
                              {user?.department} {is1stSemOnly ? 'Enrollees & Semestral Completion' : 'Enrollees & Graduates'} Summary
                            </h4>
                            <p className="text-[11px] sm:text-xs text-amber-800 font-medium">Official verified demographic distribution for your component</p>
                          </div>
                          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-200/90 text-amber-950 border border-amber-300 shadow-2xs">
                            {archiveViewData?.year || 'Academic Year'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
                          <div className="bg-white rounded-xl p-3 sm:p-4 border border-amber-100 shadow-2xs flex flex-col justify-between">
                            <div>
                              <p className="text-xl sm:text-2xl font-black text-emerald-700">{totalStudents}</p>
                              <p className="text-xs font-bold text-gray-700">{user?.department} Enrollees</p>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-1">Total Registered</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 sm:p-4 border border-amber-100 shadow-2xs flex flex-col justify-between">
                            <div>
                              <p className="text-xl sm:text-2xl font-black text-emerald-600">{passCount}</p>
                              <p className="text-xs font-bold text-gray-700">{is1stSemOnly ? 'Passed (1st Sem)' : 'Passed (Graduated)'}</p>
                            </div>
                            <p className="text-[11px] text-emerald-700 font-extrabold mt-1">
                              {totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0}% Pass Rate
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 sm:p-4 border border-amber-100 shadow-2xs flex flex-col justify-between">
                            <div>
                              <p className="text-xl sm:text-2xl font-black text-amber-600">{incCount}</p>
                              <p className="text-xs font-bold text-gray-700">Incomplete (INC)</p>
                            </div>
                            <p className="text-[11px] text-amber-700 font-extrabold mt-1">Make-Up Pending</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 sm:p-4 border border-amber-100 shadow-2xs flex flex-col justify-between">
                            <div>
                              <p className="text-xl sm:text-2xl font-black text-rose-600">{failCount + dropCount}</p>
                              <p className="text-xs font-bold text-gray-700">Failed / Dropped</p>
                            </div>
                            <p className="text-[11px] text-rose-700 font-extrabold mt-1">
                              {failCount} Failed • {dropCount} Dropped
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Student Information Section - Only Instructor's Students */}
                      <div>
                        <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center justify-between">
                          <span className="flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            {user?.department} Student Records &amp; Official Grades
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            {evaluated.length} Students Listed
                          </span>
                        </h4>
                        {evaluated.length > 0 ? (
                          <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full text-xs">
                              <thead className="bg-emerald-950 text-white font-bold">
                                <tr>
                                  <th className="px-3 py-2.5 text-center w-10">#</th>
                                  <th className="px-3 py-2.5 text-left">Student ID</th>
                                  <th className="px-3 py-2.5 text-left">Name</th>
                                  <th className="px-3 py-2.5 text-left">Program</th>
                                  <th className="px-3 py-2.5 text-center">Track</th>
                                  <th className="px-3 py-2.5 text-center">Final Grade</th>
                                  <th className="px-3 py-2.5 text-center">Official Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {evaluated.map((student, idx) => (
                                  <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                                    <td className="px-3 py-2.5 text-center text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                                    <td className="px-3 py-2.5 font-mono font-bold text-gray-700">{student.studentId}</td>
                                    <td className="px-3 py-2.5 font-semibold text-gray-900">{student.name}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{student.program}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                        student.department === 'CWTS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                        student.department === 'LTS' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                        student.department === 'ROTC' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {student.department}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                                        student.ev.isFail ? 'text-rose-700 bg-rose-50 border border-rose-200' :
                                        student.ev.isInc ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                                        student.ev.isDrp ? 'text-purple-700 bg-purple-50 border border-purple-200' :
                                        student.ev.isPass ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' :
                                        'text-gray-600'
                                      }`}>
                                        {student.ev.displayGrade}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-black border ${student.ev.badgeColor}`}>
                                        {student.ev.badgeText}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4 text-xs">No {user?.department} students recorded in this batch</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Report Details Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    {user?.department} Reports &amp; Documentation
                  </h4>
                  {archiveViewData.reportData && archiveViewData.reportData.length > 0 ? (
                    <div className="space-y-3">
                      {archiveViewData.reportData.map((report, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">{report.title}</h5>
                            <span className="px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-800 font-bold">
                              {report.department}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {report.due_date && <span>Due: {new Date(report.due_date).toLocaleDateString()}</span>}
                            <span>{report.submission_count ?? report.submissions?.length ?? 0} submission(s)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-xs">No {user?.department} reports recorded in this batch</p>
                  )}
                </div>

                {/* Calendar & Activities Schedule Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Academic &amp; Training Calendar Schedule
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowArchiveDetails(false);
                        navigate('/calendar');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Calendar Page &rarr;</span>
                    </button>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(() => {
                      const yr = String(archiveViewData?.year || '');
                      const events = yr.includes('2023-2024')
                        ? (yr.includes('1st Semester')
                            ? [
                                { date: '2023-09-02', title: 'NSTP 1 General Orientation & Plenary', desc: 'Institutional NSTP orientation at CvSU Naic Gymnasium.', dept: 'All' },
                                { date: '2023-10-07', title: 'CWTS Community Needs Assessment Field Visit', desc: 'Participatory community profiling in Brgy. Bucana & Halang.', dept: 'CWTS' },
                                { date: '2023-10-14', title: 'LTS Diagnostic Reading Assessment', desc: 'Diagnostic literacy pre-assessment for elementary schools.', dept: 'LTS' },
                                { date: '2023-10-21', title: 'ROTC Midterm Drill & Muster', desc: 'Inspection and formation testing by AFP Reservist Command.', dept: 'ROTC' },
                                { date: '2023-11-11', title: 'NSTP 1 Midterm Evaluation & Submission', desc: 'Documentation milestone progress audit.', dept: 'All' },
                                { date: '2023-12-09', title: '1st Semester Culminating Project Defense', desc: 'Departmental presentation of community project outputs.', dept: 'All' },
                              ]
                            : [
                                { date: '2024-02-10', title: 'NSTP 2 Resumption & Project Briefing', desc: 'Community engagement and project mobilization.', dept: 'All' },
                                { date: '2024-03-02', title: 'CWTS Mangrove Planting & Coastal Rehabilitation', desc: '500 mangrove seedlings planted along Bucana shoreline.', dept: 'CWTS' },
                                { date: '2024-03-16', title: 'LTS Reading Clinic & Storybook Distribution', desc: 'Remedial reading tutorials and learning kit handover.', dept: 'LTS' },
                                { date: '2024-03-23', title: 'ROTC Field Tactics & Land Navigation Exercise', desc: 'Field orienteering and compass movement simulation.', dept: 'ROTC' },
                                { date: '2024-04-13', title: 'Final Project Culmination & Document Audit', desc: 'Verification of community portfolios and grade requirements.', dept: 'All' },
                                { date: '2024-04-27', title: 'NSTP Passing-in-Review & Recognition Ceremony', desc: 'Formal graduation muster and certificate awarding ceremony.', dept: 'All' },
                              ])
                        : (yr.includes('1st Semester')
                            ? [
                                { date: '2024-09-07', title: 'NSTP 1 General Orientation & Briefing', desc: 'Academic orientation and program assignments.', dept: 'All' },
                                { date: '2024-10-05', title: 'CWTS Barangay Profiling & Immersion Preparation', desc: 'Coordination meeting with Barangay officials of Bucana.', dept: 'CWTS' },
                                { date: '2024-10-12', title: 'LTS Literacy Pre-Assessment in Partner School', desc: 'Diagnostic phonics and numeracy evaluation.', dept: 'LTS' },
                                { date: '2024-10-19', title: 'ROTC Troop Muster & Ceremonial Formations', desc: 'Basic military customs, discipline, and troop movement drill.', dept: 'ROTC' },
                                { date: '2024-11-09', title: 'NSTP 1 Midterm Evaluation & Defense', desc: 'Mid-term documentation audit and project status verification.', dept: 'All' },
                                { date: '2024-11-23', title: 'Community Disaster Preparedness Clinic', desc: 'Emergency response simulations in partnership with MDRRMO.', dept: 'All' },
                              ]
                            : [
                                { date: '2025-02-08', title: 'NSTP 2 Resumption & Community Deployment', desc: 'Deployment to designated partner barangays in Naic.', dept: 'All' },
                                { date: '2025-03-01', title: 'CWTS Community Waste Management Drive', desc: 'Solid waste management and segregation training.', dept: 'CWTS' },
                                { date: '2025-03-15', title: 'LTS Supplementary Literacy Tutorials', desc: 'Remedial reading and numeracy enhancement classes.', dept: 'LTS' },
                                { date: '2025-03-22', title: 'ROTC Basic Marksmanship & Drill Practical', desc: 'Weapon assembly, safety inspection, and marksmanship fundamentals.', dept: 'ROTC' },
                                { date: '2025-04-12', title: 'Community Immersion Final Showcase', desc: 'Portfolio evaluation and partner barangay sign-off.', dept: 'All' },
                                { date: '2025-04-26', title: 'NSTP Graduation & Ceremonial Muster', desc: 'Formal graduation and awarding of serial certificates.', dept: 'All' },
                              ]);

                      const deptEvents = events.filter(e => e.dept === 'All' || e.dept === user?.department);

                      return deptEvents.map((evt, idx) => (
                        <div key={idx} className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md font-mono">{evt.date}</span>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{evt.dept}</span>
                            </div>
                            <h5 className="font-black text-gray-900 text-xs leading-tight mb-1">{evt.title}</h5>
                            <p className="text-[11px] text-gray-600 line-clamp-2">{evt.desc}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowArchiveDetails(false)}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Camera QR Attendance Scanner Modal */}
        <AttendanceScannerModal
          isOpen={showAttendanceScanner}
          onClose={() => setShowAttendanceScanner(false)}
          currentDepartment={user?.department || 'CWTS'}
          currentUser={user}
          students={students}
        />

        {/* 15-Day Attendance Matrix Modal */}
        {showAttendanceMatrix && (
          <StudentAttendanceMatrixModal
            isOpen={showAttendanceMatrix}
            onClose={() => setShowAttendanceMatrix(false)}
            students={students}
            currentUser={user}
            currentDepartment={user?.department || 'CWTS'}
          />
        )}


      </main>
    </div>
  );
}

export default InstructorDashboard;

