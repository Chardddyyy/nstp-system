import { useAuth } from '../context/AuthContext';
import { archivesAPI } from '../services/api';
import ScrollToTopButton from '../components/ScrollToTopButton';
import Sidebar from '../components/layout/Sidebar';
import {
  Users, FileText, MessageSquare,
  User, Shield,
  BookOpen, Bell, Calendar, X, CheckCircle, AlertCircle, Trash2, CheckSquare, Square,
  BarChart3, PieChart, Archive, RotateCcw, History, ChevronDown, ChevronUp, Menu, MailOpen, Search, Clock, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { getEnrollmentSchedule, saveEnrollmentSchedule, calculateEnrollmentStatus } from '../utils/enrollmentSchedule';

const OFFICIAL_PROGRAMS = ['BSIT', 'BSCS', 'BSFAS', 'BSHM', 'BSBA', 'BEED Science', 'BSED'];

// Avatar options for display
const AVATAR_OPTIONS = {
  default: { color: 'bg-gray-400', icon: '👤' },
  green: { color: 'bg-green-500', icon: '🎓' },
  blue: { color: 'bg-blue-500', icon: '👨‍🏫' },
  purple: { color: 'bg-purple-500', icon: '👩‍🏫' },
  red: { color: 'bg-red-500', icon: '👮' },
  yellow: { color: 'bg-yellow-500', icon: '⭐' },
};

function AdminDashboard() {
  const { user, logout, clearBatchData, students, reports, allUsers, pendingEnrollments, approveEnrollment, declineEnrollment, refreshData, archivedYears, currentBatch, notifications, setNotifications, viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  
  // Enrollment Timed Schedule & Portal Control
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState(() => getEnrollmentSchedule());
  const [scheduleStatus, setScheduleStatus] = useState(() => calculateEnrollmentStatus());

  useEffect(() => {
    const handleScheduleChange = (e) => {
      if (e.detail) {
        setScheduleStatus(e.detail);
        setScheduleConfig(e.detail.schedule);
      }
    };
    window.addEventListener('nstp_enrollment_schedule_changed', handleScheduleChange);
    return () => window.removeEventListener('nstp_enrollment_schedule_changed', handleScheduleChange);
  }, []);

  const handleSaveSchedule = (newConfig) => {
    const updatedStatus = saveEnrollmentSchedule(newConfig);
    setScheduleConfig(newConfig);
    setScheduleStatus(updatedStatus);
    showNotif('success', `Enrollment Schedule Saved: Portal is ${updatedStatus.isOpen ? 'OPEN' : 'CLOSED'}`);
  };

  const quickForceOpen = () => {
    handleSaveSchedule({ ...scheduleConfig, mode: 'FORCE_OPEN' });
  };

  const quickForceClose = () => {
    handleSaveSchedule({ ...scheduleConfig, mode: 'FORCE_CLOSE' });
  };

  const _quickSetAuto = () => {
    handleSaveSchedule({ ...scheduleConfig, mode: 'AUTO' });
  };
  
  // Close notification panel when clicking outside
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
  
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProgramAnalytics, setShowProgramAnalytics] = useState(false);
  const [showNewBatchConfirm, setShowNewBatchConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showArchiveDetails, setShowArchiveDetails] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [photoViewer, setPhotoViewer] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showInstructorList, setShowInstructorList] = useState(false);
  // Online Enrollment Portal Status Switch (stored in localStorage)
  const [_enrollmentOpen, _setEnrollmentOpen] = useState(() => {
    const saved = localStorage.getItem('nstp_enrollment_open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const _toggleEnrollmentStatus = () => {
    const next = !_enrollmentOpen;
    _setEnrollmentOpen(next);
    localStorage.setItem('nstp_enrollment_open', JSON.stringify(next));
    setNotification({
      type: 'success',
      message: `Online Enrollment is now ${next ? 'OPEN' : 'CLOSED'}`
    });
    setTimeout(() => setNotification(null), 3000);
  };
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [selectedComponentFilter, setSelectedComponentFilter] = useState('ALL');
  const [analyticsViewMode, setAnalyticsViewMode] = useState('chart');

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };
  
  // All hooks must be called before any early return
  // Calculate statistics from actual data
  const stats = useMemo(() => ({
    totalStudents: students.length,
    cwtsStudents: students.filter(s => s.department === 'CWTS').length,
    ltsStudents: students.filter(s => s.department === 'LTS').length,
    rotcStudents: students.filter(s => s.department === 'ROTC').length,
    totalInstructors: allUsers.filter(u => u.role === 'instructor').length,
    pendingReports: reports.filter(r => !r.submissions || r.submissions.length === 0).length,
    unreadMessages: (notifications || []).filter(n => n.type === 'message' && !n.read).length
  }), [students, allUsers, reports, notifications]);


  const displayStats = viewingArchive && archiveViewData ? (() => {
    const sd = archiveViewData.studentData || [];
    const cwts = archiveViewData.data?.cwts ?? (sd.filter(s => s.department === 'CWTS').length || 0);
    const lts  = archiveViewData.data?.lts  ?? (sd.filter(s => s.department === 'LTS').length  || 0);
    const rotc = archiveViewData.data?.rotc ?? (sd.filter(s => s.department === 'ROTC').length || 0);
    return {
      totalStudents: archiveViewData.students || sd.length,
      cwtsStudents: cwts, ltsStudents: lts, rotcStudents: rotc,
      totalInstructors: 0, pendingReports: 0, unreadMessages: 0
    };
  })() : stats;

  const currentStats = useMemo(() => ({
    total: displayStats.totalStudents,
    cwts: displayStats.cwtsStudents,
    lts: displayStats.ltsStudents,
    rotc: displayStats.rotcStudents,
    completionRate: displayStats.totalStudents > 0 ? Math.round(((viewingArchive && archiveViewData ? archiveViewData.completed : students.filter(s => s.status === 'completed').length) / displayStats.totalStudents) * 100) : 0
  }), [displayStats, viewingArchive, archiveViewData, students]);

  const programDeptStats = useMemo(() => {
    const source = viewingArchive && archiveViewData?.studentData ? archiveViewData.studentData : students;
    return OFFICIAL_PROGRAMS.map(prog => {
      const list = source.filter(s => (s.program || '').trim().toLowerCase() === prog.toLowerCase());
      return {
        program: prog,
        total: list.length,
        cwts: list.filter(s => s.department === 'CWTS').length,
        lts:  list.filter(s => s.department === 'LTS').length,
        rotc: list.filter(s => s.department === 'ROTC').length,
      };
    }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);
  }, [students, viewingArchive, archiveViewData]);

  // Show loading while user context resolves
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
    const newNotifications = (notifications || []).map(n => {
      if (n.id === notification.id) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(newNotifications);
    
    // Navigate to the link
    if (notification.link && notification.link !== '#') {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
    setSelectedNotifications([]);
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  
  // Archive current year and start new batch
  const handleNewBatch = () => {
    setShowNewBatchConfirm(true);
    setConfirmText('');
  };
  
  const confirmNewBatch = async () => {
    if (confirmText.toLowerCase() !== 'confirm') {
      showNotif('error', 'You must type "confirm" exactly to proceed with creating a new batch.');
      return;
    }

    try {
      await archivesAPI.create({
        year: parseInt(currentBatch),
        data: {
          cwts: stats.cwtsStudents,
          lts: stats.ltsStudents,
          rotc: stats.rotcStudents
        }
      });

      await clearBatchData();
      await refreshData();

      setShowNewBatchConfirm(false);
      setConfirmText('');

      showNotif('success', `Batch ${currentBatch} archived successfully. New batch started with cleared records.`);
    } catch (error) {
      console.error('Archive batch error:', error);
      showNotif('error', 'Failed to archive batch. Please try again.');
    }
  };

  // View archived batch data — fetch detailed student/report data
  const handleViewBatch = async (yearData) => {
    setShowArchiveModal(false);
    try {
      const detailed = await archivesAPI.getByYear(yearData.year);
      setArchiveViewData({
        ...yearData,
        studentData: detailed.studentData || [],
        reportData: detailed.reportData || []
      });
    } catch {
      setArchiveViewData({ ...yearData, studentData: [], reportData: [] });
    }
    setViewingArchive(true);
  };

  // Delete archived batch
  const handleDeleteArchivedBatch = (yearToDelete) => {
    showConfirm(
      `Delete Batch ${yearToDelete} from archives? This cannot be undone.`,
      async () => {
        try {
          await archivesAPI.delete(yearToDelete);
          await refreshData();
          showNotif('success', `Batch ${yearToDelete} deleted from archives.`);
        } catch (error) {
          console.error('Delete archive error:', error);
          showNotif('error', 'Failed to delete archive. Please try again.');
        }
      }
    );
  };

  // Return to current batch view
  const handleBackToCurrent = () => {
    setViewingArchive(false);
    setArchiveViewData(null);
  };


  // Empty activities and messages

  // Get user avatar display
  const getUserAvatar = () => {
    if (user?.profilePicture) {
      return (
        <img 
          src={user.profilePicture} 
          alt="Profile" 
          className="w-10 h-10 object-cover rounded-full"
        />
      );
    }
    const avatar = AVATAR_OPTIONS[user?.avatar || 'default'] || AVATAR_OPTIONS.default;
    return (
      <div className={`w-10 h-10 ${avatar.color} rounded-full flex items-center justify-center text-lg`}>
        {avatar.icon}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 page-enter">

      {/* Centered notification toast */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-sm w-full mx-4 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {notification.type === 'success'
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="flex-1">{notification.message}</span>
            <button type="button" onClick={() => setNotification(null)} className="text-white/80 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Centered confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-start gap-3 mb-5">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-800 text-sm font-medium">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button"
                
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button type="button"
                
                onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
        archiveMode={viewingArchive}
      />

      {/* Main Content */}
      <main className={`min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50 transition-all duration-300 ease-in-out p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Previous Report Header - Show when viewing archive */}
        {viewingArchive && archiveViewData && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-3xl p-4 sm:p-5 mb-6 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Archive className="w-6 h-6 text-amber-600" />
                <div>
                  <h2 className="text-lg font-black text-amber-900">Previous Report - Batch {archiveViewData.year}</h2>
                  <p className="text-xs text-amber-700 font-medium">Viewing archived batch data. Editing is read-only.</p>
                </div>
              </div>
              <button type="button"
                onClick={handleBackToCurrent}
                className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-4 py-2 rounded-2xl text-xs font-black transition-all shadow-md flex items-center space-x-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Back to Current</span>
              </button>
            </div>
          </div>
        )}

        {/* Hero Header - Scaled & Compact Mobile Layout */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-6">
          <div className="flex justify-between items-center gap-1.5 sm:gap-3 relative z-10">
            <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
              <button type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 sm:p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h1 className="text-[11px] sm:text-2xl font-black tracking-tight text-white truncate">
                    {viewingArchive ? `Batch ${archiveViewData?.year}` : 'Admin Dashboard'}
                  </h1>
                </div>
                <p className="text-emerald-200 text-[9px] sm:text-sm font-medium truncate mt-0.5">
                  {viewingArchive ? 'Archived Data' : `Welcome, ${user?.name || 'Admin'} 👋`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Notification Bell & Interactive Dropdown Panel */}
              <div className="relative notification-container">
                <button type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 sm:p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl sm:rounded-2xl transition-colors cursor-pointer shrink-0"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-amber-400 text-emerald-950 text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center border border-emerald-950 shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifications && (
                  <div
                    className="notification-dropdown absolute right-0 mt-3 w-[min(26rem,90vw)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] text-gray-900 overflow-hidden animate-fade-in"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <div className="p-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                      <div className="flex items-center space-x-2">
                        <button type="button"
                          onClick={handleSelectAll}
                          title={selectedNotifications.length === (notifications || []).length && notifications.length > 0 ? 'Deselect all' : 'Select all'}
                          className="text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {selectedNotifications.length === (notifications || []).length && notifications.length > 0
                            ? <CheckSquare className="w-4 h-4 text-emerald-600" />
                            : <Square className="w-4 h-4" />}
                        </button>
                        <h3 className="font-extrabold text-xs sm:text-sm text-gray-900">Notifications ({unreadCount} new)</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button type="button"
                          onClick={handleMarkAllRead}
                          disabled={
                            selectedNotifications.length > 0
                              ? !(notifications || []).some(n => selectedNotifications.some(sid => notificationIdsMatch(sid, n.id)) && !n.read)
                              : (notifications || []).every(n => n.read)
                          }
                          className="text-emerald-700 hover:text-emerald-800 disabled:opacity-30 transition-colors cursor-pointer"
                          title={selectedNotifications.length > 0 ? "Mark selected as read" : "Mark all as read"}
                        >
                          <MailOpen className="w-4 h-4" />
                        </button>
                        <button type="button"
                          onClick={handleDeleteSelected}
                          disabled={selectedNotifications.length === 0}
                          className="text-rose-600 hover:text-rose-700 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Delete selected"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button type="button"
                          onClick={() => { setShowNotifications(false); setSelectedNotifications([]); }}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="p-6 text-center text-gray-400 text-xs font-medium">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-800" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isSelected = selectedNotifications.some(sid => notificationIdsMatch(sid, n.id));
                          return (
                            <div
                              key={n.id}
                              className={`p-3 transition-colors flex items-start space-x-2.5 ${
                                !n.read ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-gray-50'
                              }`}
                            >
                              <button type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectNotification(n.id);
                                }}
                                className="mt-0.5 shrink-0 text-gray-400 hover:text-emerald-600 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-300" />
                                )}
                              </button>
                              <div
                                className="flex-1 cursor-pointer min-w-0"
                                onClick={() => handleNotificationItemClick(n)}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className={`text-xs font-bold truncate ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                    {n.title}
                                  </h4>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {!n.read && (
                                      <button type="button"
                                        onClick={(e) => handleMarkOneRead(e, n.id)}
                                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                        title="Mark as read"
                                      >
                                        <MailOpen className="w-3 h-3" />
                                      </button>
                                    )}
                                    <span className="text-[10px] text-gray-400 font-medium">{n.time}</span>
                                  </div>
                                </div>
                                <p className={`text-xs mt-0.5 line-clamp-2 ${n.read ? 'text-gray-500 font-normal' : 'text-gray-700 font-medium'}`}>
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile - Displays Avatar, Name, & Role on Mobile */}
              <button type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-1 sm:space-x-3 bg-emerald-800/80 hover:bg-emerald-700/90 text-white px-2 sm:px-3.5 py-1 sm:py-2 rounded-xl sm:rounded-2xl border border-emerald-700/60 shadow-md transition-all cursor-pointer shrink-0 min-w-0"
              >
                <div className="shrink-0">
                  {getUserAvatar()}
                </div>
                <div className="block text-left min-w-0 overflow-hidden">
                  <p className="font-bold text-[9px] sm:text-xs text-white leading-tight truncate max-w-[70px] sm:max-w-none">{user?.name || 'Admin'}</p>
                  <p className="text-[7px] sm:text-[10px] text-amber-300 font-semibold uppercase tracking-wider truncate">Admin</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Cards - 3 Side-by-Side on Cellphone */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-3 sm:mb-6">
          <div
            className="bg-gradient-to-r from-emerald-700 to-green-800 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            onClick={() => setShowInstructorList(true)}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-emerald-100 text-[8px] sm:text-xs font-medium uppercase tracking-wider truncate">Instructors</p>
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.totalInstructors} <span className="text-[8px] font-normal hidden sm:inline">Active</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-emerald-800 font-semibold transition-all shrink-0">View &rarr;</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-r from-amber-600 to-yellow-600 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            onClick={() => navigate('/reports')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-amber-100 text-[8px] sm:text-xs font-medium uppercase tracking-wider truncate">Reports</p>
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.pendingReports} <span className="text-[8px] font-normal hidden sm:inline">Pending</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-amber-800 font-semibold transition-all shrink-0">Review &rarr;</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            onClick={() => navigate('/chat')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-blue-100 text-[8px] sm:text-xs font-medium uppercase tracking-wider truncate">Messages</p>
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.unreadMessages} <span className="text-[8px] font-normal hidden sm:inline">Unread</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-blue-800 font-semibold transition-all shrink-0">Open &rarr;</span>
            </div>
          </div>
        </div>

        {/* Interactive Analytics & Program Distribution Panel */}
        <div className={`rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 transition-all ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${showProgramAnalytics ? 'mb-5 pb-4 border-b border-gray-100' : ''}`}>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  📊
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">CvSU Naic Analytics &amp; Program Distribution</h3>
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="bg-emerald-700 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-2xs ml-auto sm:ml-2">
                  Total Active Students: {displayStats.totalStudents}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Interactive student enrollment metrics across degree programs and NSTP components</p>
            </div>

            {/* Interactive View Toggles & Component Filter & Hide Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProgramAnalytics(!showProgramAnalytics)}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                {showProgramAnalytics ? (
                  <>
                    <ChevronUp className="w-4 h-4 text-emerald-700" />
                    <span>Hide Analytics</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-emerald-700" />
                    <span>Show Analytics</span>
                  </>
                )}
              </button>

              {showProgramAnalytics && (
                <>
                  {/* Component Filters */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('CWTS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'CWTS' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      CWTS
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('LTS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'LTS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      LTS
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('ROTC')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'ROTC' ? 'bg-rose-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      ROTC
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setAnalyticsViewMode('chart')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${analyticsViewMode === 'chart' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Chart
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsViewMode('grid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${analyticsViewMode === 'grid' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Grid
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {showProgramAnalytics && (
            <>
              {/* Component Ratio Stacked Bar Visual */}
              <div className="mb-5 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2">
                  <span>Component Enrollment Ratio</span>
                  <span>Total Active: {displayStats.totalStudents}</span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                  {displayStats.totalStudents > 0 ? (
                    <>
                      <div
                        style={{ width: `${(displayStats.cwtsStudents / displayStats.totalStudents) * 100}%` }}
                        className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer"
                        title={`CWTS: ${displayStats.cwtsStudents} (${Math.round((displayStats.cwtsStudents / displayStats.totalStudents) * 100)}%)`}
                        onClick={() => setSelectedComponentFilter('CWTS')}
                      />
                      <div
                        style={{ width: `${(displayStats.ltsStudents / displayStats.totalStudents) * 100}%` }}
                        className="bg-purple-500 hover:opacity-90 transition-all cursor-pointer"
                        title={`LTS: ${displayStats.ltsStudents} (${Math.round((displayStats.ltsStudents / displayStats.totalStudents) * 100)}%)`}
                        onClick={() => setSelectedComponentFilter('LTS')}
                      />
                      <div
                        style={{ width: `${(displayStats.rotcStudents / displayStats.totalStudents) * 100}%` }}
                        className="bg-rose-500 hover:opacity-90 transition-all cursor-pointer"
                        title={`ROTC: ${displayStats.rotcStudents} (${Math.round((displayStats.rotcStudents / displayStats.totalStudents) * 100)}%)`}
                        onClick={() => setSelectedComponentFilter('ROTC')}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-gray-300 h-full flex items-center justify-center text-[10px] text-gray-500">No data</div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs pt-2 font-medium">
                  <span className="text-emerald-700">🟢 CWTS: {displayStats.cwtsStudents} ({displayStats.totalStudents > 0 ? Math.round((displayStats.cwtsStudents / displayStats.totalStudents) * 100) : 0}%)</span>
                  <span className="text-purple-700">🟣 LTS: {displayStats.ltsStudents} ({displayStats.totalStudents > 0 ? Math.round((displayStats.ltsStudents / displayStats.totalStudents) * 100) : 0}%)</span>
                  <span className="text-rose-700">🔴 ROTC: {displayStats.rotcStudents} ({displayStats.totalStudents > 0 ? Math.round((displayStats.rotcStudents / displayStats.totalStudents) * 100) : 0}%)</span>
                </div>
              </div>

              {/* MODE 1: HORIZONTAL CHARTS VIEW */}
              {analyticsViewMode === 'chart' ? (
                <div className="space-y-3 animate-fade-in">
                  {programDeptStats.map(item => {
                    const displayedCount = selectedComponentFilter === 'CWTS' ? item.cwts : selectedComponentFilter === 'LTS' ? item.lts : selectedComponentFilter === 'ROTC' ? item.rotc : item.total;
                    const maxVal = Math.max(...programDeptStats.map(p => selectedComponentFilter === 'CWTS' ? p.cwts : selectedComponentFilter === 'LTS' ? p.lts : selectedComponentFilter === 'ROTC' ? p.rotc : p.total), 1);
                    const percent = Math.round((displayedCount / maxVal) * 100);
                    const sharePercent = displayStats.totalStudents > 0 ? Math.round((displayedCount / displayStats.totalStudents) * 100) : 0;

                    return (
                      <div
                        key={item.program}
                        className="bg-gray-50/80 hover:bg-emerald-50/40 border border-gray-200/70 hover:border-emerald-300 rounded-xl p-3.5 transition-all duration-200 group cursor-pointer"
                        onClick={() => navigate('/students')}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">{item.program}</span>
                            <span className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              {sharePercent}% of total
                            </span>
                          </div>
                          <span className="text-sm font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-100 shadow-2xs">
                            {displayedCount} students
                          </span>
                        </div>

                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex shadow-inner mb-2">
                          {selectedComponentFilter === 'ALL' ? (
                            item.total > 0 ? (
                              <>
                                <div
                                  style={{ width: `${(item.cwts / item.total) * 100}%` }}
                                  className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer"
                                  title={`CWTS: ${item.cwts}`}
                                />
                                <div
                                  style={{ width: `${(item.lts / item.total) * 100}%` }}
                                  className="bg-purple-500 hover:opacity-90 transition-all cursor-pointer"
                                  title={`LTS: ${item.lts}`}
                                />
                                <div
                                  style={{ width: `${(item.rotc / item.total) * 100}%` }}
                                  className="bg-rose-500 hover:opacity-90 transition-all cursor-pointer"
                                  title={`ROTC: ${item.rotc}`}
                                />
                              </>
                            ) : (
                              <div className="w-full bg-gray-300 h-full flex items-center justify-center text-[9px] text-gray-500">0 enrolled</div>
                            )
                          ) : (
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                selectedComponentFilter === 'CWTS' ? 'bg-emerald-600' :
                                selectedComponentFilter === 'LTS'  ? 'bg-purple-600' :
                                'bg-rose-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          )}
                        </div>

                        {selectedComponentFilter === 'ALL' && (
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span className="text-emerald-700 font-medium">CWTS: {item.cwts}</span>
                            <span className="text-purple-700 font-medium">LTS: {item.lts}</span>
                            <span className="text-rose-700 font-medium">ROTC: {item.rotc}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* MODE 2: INTERACTIVE GRID BADGE VIEW */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 animate-fade-in">
                  {programDeptStats.map(item => {
                    const count = selectedComponentFilter === 'CWTS' ? item.cwts : selectedComponentFilter === 'LTS' ? item.lts : selectedComponentFilter === 'ROTC' ? item.rotc : item.total;
                    return (
                      <div
                        key={item.program}
                        className="bg-gray-50 hover:bg-emerald-50/60 border border-gray-200/80 hover:border-emerald-300 rounded-xl p-3 flex items-center justify-between transition-all duration-150 group cursor-pointer"
                        onClick={() => navigate('/students')}
                      >
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-900 truncate mr-2">{item.program}</span>
                        <span className="text-sm font-black text-gray-900 group-hover:text-emerald-700 bg-white group-hover:bg-emerald-100 px-2 py-0.5 rounded-lg shadow-2xs shrink-0 transition-colors">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pending Enrollments Section with Enrollment Switch */}
        {!viewingArchive && (
          <div className="bg-white rounded-2xl shadow-md p-3.5 sm:p-6 mb-3 sm:mb-5 border border-emerald-100/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center flex-shrink-0">
                  <Users className="w-5 h-5 mr-2 text-amber-600" />
                  Pending Enrollments
                  <span className="ml-2 text-xs sm:text-sm font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    {enrollmentSearch.trim()
                      ? `${pendingEnrollments.filter(e => {
                          const q = enrollmentSearch.toLowerCase();
                          return (e.fullName || '').toLowerCase().includes(q)
                            || (e.studentId || '').toLowerCase().includes(q)
                            || (e.email || '').toLowerCase().includes(q)
                            || (e.nstpComponent || '').toLowerCase().includes(q)
                            || (e.program || '').toLowerCase().includes(q);
                        }).length} of ${pendingEnrollments.length}`
                      : pendingEnrollments.length}
                  </span>
                </h3>

                {/* Admin Timed Enrollment Schedule & Switch Button */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer border shrink-0 ${
                      scheduleStatus.isOpen
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 active:scale-95'
                        : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 active:scale-95'
                    }`}
                    title="Configure automatic date/time opening and closing schedule for enrollment"
                  >
                    <span className={`w-2 h-2 rounded-full ${scheduleStatus.isOpen ? 'bg-amber-300 animate-ping' : 'bg-white'}`}></span>
                    <span>{scheduleStatus.isOpen ? 'Portal OPEN' : 'Portal CLOSED'}</span>
                    <Clock className="w-3.5 h-3.5 ml-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(true)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Set Date &amp; Time Schedule</span>
                  </button>
                </div>
              </div>
              {pendingEnrollments.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, email…"
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                  {enrollmentSearch && (
                    <button type="button" onClick={() => setEnrollmentSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {pendingEnrollments.length > 0 ? (() => {
              const q = enrollmentSearch.trim().toLowerCase();
              const filtered = q
                ? pendingEnrollments.filter(e =>
                    (e.fullName || '').toLowerCase().includes(q)
                    || (e.studentId || '').toLowerCase().includes(q)
                    || (e.email || '').toLowerCase().includes(q)
                    || (e.nstpComponent || '').toLowerCase().includes(q)
                    || (e.program || '').toLowerCase().includes(q)
                  )
                : pendingEnrollments;
              return filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No results for "<span className="font-medium">{enrollmentSearch}</span>"</p>
                  <button type="button" onClick={() => setEnrollmentSearch('')} className="mt-2 text-xs text-yellow-600 hover:underline">Clear search</button>
                </div>
              ) : (
              <>
                {/* ── Mobile: card list ── */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {filtered.map((enrollment) => {
                    const deptColor =
                      enrollment.nstpComponent === 'CWTS' ? 'bg-green-100 text-green-700' :
                      enrollment.nstpComponent === 'LTS'  ? 'bg-purple-100 text-purple-700' :
                      enrollment.nstpComponent === 'ROTC' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700';
                    return (
                      <div
                        key={enrollment.id}
                        className="p-3 hover:bg-green-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedEnrollment(enrollment)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{enrollment.fullName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{enrollment.studentId} · {enrollment.yearLevel} · Sec {enrollment.section || '-'}</p>
                            <p className="text-xs text-gray-400 truncate">{enrollment.email}</p>
                          </div>
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${deptColor}`}>
                            {enrollment.nstpComponent || '—'}
                          </span>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button type="button"
                            
                            onClick={() => showConfirm(`Approve enrollment for ${enrollment.fullName}?`, async () => { try { await approveEnrollment(enrollment.id); } catch {} })}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button type="button"
                            
                            onClick={() => showConfirm(`Decline enrollment for ${enrollment.fullName}?`, async () => { try { await declineEnrollment(enrollment.id); } catch {} })}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                          <button type="button"
                            
                            onClick={() => setSelectedEnrollment(enrollment)}
                            className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Desktop: table ── */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NSTP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((enrollment) => (
                        <tr
                          key={enrollment.id}
                          className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedEnrollment(enrollment)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{enrollment.studentId}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{enrollment.fullName}</p>
                            <p className="text-xs text-gray-500">{enrollment.email}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{enrollment.section || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{enrollment.yearLevel}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              enrollment.nstpComponent === 'CWTS' ? 'bg-green-100 text-green-700' :
                              enrollment.nstpComponent === 'LTS'  ? 'bg-purple-100 text-purple-700' :
                              enrollment.nstpComponent === 'ROTC' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {enrollment.nstpComponent || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button type="button"
                                
                                onClick={() => showConfirm(`Approve enrollment for ${enrollment.fullName}?`, async () => { try { await approveEnrollment(enrollment.id); } catch {} })}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button type="button"
                                
                                onClick={() => showConfirm(`Decline enrollment for ${enrollment.fullName}?`, async () => { try { await declineEnrollment(enrollment.id); } catch {} })}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ); })() : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No pending enrollment applications at this time.</p>
                <p className="text-sm mt-1">New student enrollments will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Component Enrollment Comparison (Multi-Year Analytics) */}
        <div className={`rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 transition-all ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Cavite State University Naic Component Enrollment Comparison</h3>
                <p className="text-xs text-gray-500 mt-0.5">Historical and active student enrollment comparison across academic batch years</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center border border-emerald-200/80 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              {showAnalytics ? (
                <><ChevronUp className="w-4 h-4 mr-1" /> Hide Analytics</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-1" /> View Analytics</>
              )}
            </button>
          </div>
          
          {showAnalytics && (
            <div className="animate-fade-in">
              {/* Legend & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-gray-50/80 rounded-xl border border-gray-200/60">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Components Legend</span>
                <div className="flex items-center space-x-5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3.5 h-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md shadow-xs"></div>
                    <span className="text-xs text-gray-700 font-bold">CWTS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3.5 h-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md shadow-xs"></div>
                    <span className="text-xs text-gray-700 font-bold">LTS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3.5 h-3.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-md shadow-xs"></div>
                    <span className="text-xs text-gray-700 font-bold">ROTC</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart — Fitted 100% on Mobile */}
              <div className="w-full space-y-3 sm:space-y-4">
                {[...archivedYears.filter(y => y.year !== parseInt(currentBatch)).map(y => ({ 
                  year: y.year, 
                  cwts: y.data?.cwts || y.cwts || 0, 
                  lts: y.data?.lts || y.lts || 0, 
                  rotc: y.data?.rotc || y.rotc || 0 
                })), 
                  { year: parseInt(currentBatch), cwts: currentStats.cwts, lts: currentStats.lts, rotc: currentStats.rotc }
                ].sort((a, b) => a.year - b.year).map((data) => {
                  const maxVal = Math.max(data.cwts || 0, data.lts || 0, data.rotc || 0, 100);
                  const totalForYear = (data.cwts || 0) + (data.lts || 0) + (data.rotc || 0);

                  return (
                    <div key={data.year} className="bg-gray-50/70 hover:bg-emerald-50/40 border border-gray-200/60 hover:border-emerald-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all duration-200 group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-emerald-800 transition-colors">Batch Year {data.year}</span>
                          {data.year === parseInt(currentBatch) && (
                            <span className="text-[9px] sm:text-[10px] bg-emerald-700 text-white font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase">Active</span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                          {totalForYear} total
                        </span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {/* CWTS Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 sm:w-12 text-[10px] sm:text-xs font-bold text-emerald-800 shrink-0">CWTS</span>
                          <div className="flex-1 bg-gray-200/80 rounded-full h-4 sm:h-6 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-end pr-1.5 sm:pr-2.5 transition-all duration-500 shadow-xs"
                              style={{ width: `${(data.cwts / maxVal) * 100}%`, minWidth: data.cwts > 0 ? '20px' : '0' }}
                            >
                              {data.cwts > 0 && <span className="text-[9px] sm:text-xs text-white font-black">{data.cwts}</span>}
                            </div>
                          </div>
                        </div>
                        {/* LTS Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 sm:w-12 text-[10px] sm:text-xs font-bold text-purple-800 shrink-0">LTS</span>
                          <div className="flex-1 bg-gray-200/80 rounded-full h-4 sm:h-6 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-end pr-1.5 sm:pr-2.5 transition-all duration-500 shadow-xs"
                              style={{ width: `${(data.lts / maxVal) * 100}%`, minWidth: data.lts > 0 ? '20px' : '0' }}
                            >
                              {data.lts > 0 && <span className="text-[9px] sm:text-xs text-white font-black">{data.lts}</span>}
                            </div>
                          </div>
                        </div>
                        {/* ROTC Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 sm:w-12 text-[10px] sm:text-xs font-bold text-rose-800 shrink-0">ROTC</span>
                          <div className="flex-1 bg-gray-200/80 rounded-full h-4 sm:h-6 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full flex items-center justify-end pr-1.5 sm:pr-2.5 transition-all duration-500 shadow-xs"
                              style={{ width: `${(data.rotc / maxVal) * 100}%`, minWidth: data.rotc > 0 ? '20px' : '0' }}
                            >
                              {data.rotc > 0 && <span className="text-[9px] sm:text-xs text-white font-black">{data.rotc}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>



        {/* Batch Management - Hide when viewing archive */}
        {!viewingArchive && (
          <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl shadow-md p-3 sm:p-6 mb-3 sm:mb-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Archive className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Batch Management</h3>
                  <p className="text-green-100">Current Batch: <span className="font-semibold text-white">{currentBatch}</span></p>
                  <p className="text-green-200 text-sm mt-1">
                    {students.length} students • {reports.length} reports
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:items-center sm:space-x-3">
                <button type="button"
                  
                  onClick={() => setShowArchiveModal(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <History className="w-5 h-5" />
                  <span>View Archive</span>
                </button>
                <button type="button"
                  
                  onClick={handleNewBatch}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Start New Batch</span>
                </button>
              </div>
            </div>
            <p className="text-green-200 text-sm mt-4">
              * Starting a new batch will archive all current student data and reports for {currentBatch}, then clear them for the new batch.
            </p>
          </div>
        )}

        {/* Archive Modal - Glassmorphic Batch Selection */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowArchiveModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-emerald-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Archived Student Batches</h3>
                    <p className="text-emerald-200 text-xs font-medium">Select a historical batch to inspect or delete</p>
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

              {/* Batch List Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3 max-h-[60vh]">
                {archivedYears.length === 0 ? (
                  <div className="text-center py-10">
                    <History className="w-12 h-12 text-emerald-200 mx-auto mb-2 opacity-50" />
                    <p className="text-gray-500 font-bold text-sm">No archived batches found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archivedYears.sort((a, b) => b.year - a.year).map((year) => (
                      <div
                        key={year.year}
                        className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/80 hover:bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-gray-200/80 hover:border-emerald-300 transition-all gap-3 shadow-2xs group"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            {year.year}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-emerald-950">Batch {year.year}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                {year.students} Students
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

                          <button
                            type="button"
                            onClick={() => handleDeleteArchivedBatch(year.year)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:border-red-300"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
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

        {/* New Batch Confirmation Modal */}
        {showNewBatchConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-3 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Archive className="w-6 h-6 mr-2 text-red-600" />
                  Start New Batch
                </h3>
                <button type="button"
                  
                  onClick={() => setShowNewBatchConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-medium mb-2">⚠️ Warning: This action cannot be undone</p>
                  <p className="text-sm text-yellow-700">
                    You are about to archive batch <strong>{currentBatch}</strong> and start a new batch. 
                    All current student records ({students.length}) and reports ({reports.length}) will be 
                    moved to the archive and cleared from the system.
                  </p>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "confirm" to proceed:
                </label>
                <input
                  type="text"
                  id="confirm-batch"
                  name="confirmBatch"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type confirm here..."
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNewBatch(); } }}
                />
              </div>
              
              <div className="flex space-x-3">
                <button type="button"
                  
                  onClick={() => setShowNewBatchConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button type="button"
                  
                  onClick={confirmNewBatch}
                  disabled={confirmText.toLowerCase() !== 'confirm'}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors"
                >
                  Start New Batch
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Enrollment Detail Modal */}
        {selectedEnrollment && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in" onClick={() => setSelectedEnrollment(null)}>
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-green-800 text-white rounded-t-2xl sm:rounded-t-xl flex-shrink-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">{selectedEnrollment.fullName}</h3>
                  <p className="text-xs text-green-200 mt-0.5">{selectedEnrollment.studentId} · {selectedEnrollment.nstpComponent}</p>
                </div>
                <button type="button" onClick={() => setSelectedEnrollment(null)} className="p-1.5 hover:bg-green-700 rounded-lg transition-colors flex-shrink-0 ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">

                {/* Registration Photo — full width, top */}
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Registration Form Photo
                  </p>
                  {selectedEnrollment.registration_photo ? (
                    <div>
                      <img
                        src={selectedEnrollment.registration_photo}
                        alt="Registration form"
                        className="w-full max-h-64 sm:max-h-80 object-contain rounded-lg border border-gray-200 bg-gray-50 cursor-zoom-in"
                        onClick={() => setPhotoViewer(selectedEnrollment.registration_photo)}
                      />
                      <p className="text-xs text-gray-400 mt-1 text-center">Tap to view full size</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-amber-700">No registration form photo submitted</p>
                    </div>
                  )}
                </div>

                {/* Details — label/value rows, compact */}
                <div className="p-3 space-y-4">

                  {/* Personal */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Personal</p>
                    <div className="space-y-1.5">
                      {[
                        ['Full Name', selectedEnrollment.fullName],
                        ['Student ID', selectedEnrollment.studentId],
                        ['Email', selectedEnrollment.email],
                        ['Contact', selectedEnrollment.contactNumber],
                        ['Address', selectedEnrollment.address],
                        ['Facebook', selectedEnrollment.facebookAccount || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between items-start gap-3 text-sm">
                          <span className="text-gray-400 text-xs flex-shrink-0 w-20">{label}</span>
                          <span className="font-medium text-gray-800 text-xs text-right break-all">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Academic */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Academic</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Program', selectedEnrollment.program],
                        ['Section', selectedEnrollment.section || '—'],
                        ['Year Level', selectedEnrollment.yearLevel],
                        ['NSTP', selectedEnrollment.nstpComponent],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-gray-800">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Demographic */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Demographic</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Birth Date', selectedEnrollment.birthDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(selectedEnrollment.birthDate)) : '—'],
                        ['Age', selectedEnrollment.age || '—'],
                        ['Gender', selectedEnrollment.gender || '—'],
                        ['Civil Status', selectedEnrollment.civilStatus || '—'],
                        ['Height', selectedEnrollment.height ? `${selectedEnrollment.height} cm` : '—'],
                        ['Weight', selectedEnrollment.weight ? `${selectedEnrollment.weight} kg` : '—'],
                        ['Blood Type', selectedEnrollment.bloodType || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-gray-800">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Name', selectedEnrollment.emergencyContact],
                        ['Number', selectedEnrollment.emergencyNumber],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-gray-800">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status + date */}
                  <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs">
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-semibold">{selectedEnrollment.status || 'Pending'}</span>
                    <span className="text-gray-400">Submitted {new Date(selectedEnrollment.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Sticky action buttons */}
              <div className="flex-shrink-0 border-t bg-white p-3 grid grid-cols-3 gap-2">
                <button type="button"
                  
                  onClick={() => showConfirm(`Approve enrollment for ${selectedEnrollment.fullName}?`, async () => { try { await approveEnrollment(selectedEnrollment.id); setSelectedEnrollment(null); } catch {} })}
                  className="col-span-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button type="button"
                  
                  onClick={() => showConfirm(`Decline enrollment for ${selectedEnrollment.fullName}?`, async () => { try { await declineEnrollment(selectedEnrollment.id); setSelectedEnrollment(null); } catch {} })}
                  className="col-span-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
                <button type="button"
                  
                  onClick={() => setSelectedEnrollment(null)}
                  className="col-span-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Full-screen photo lightbox */}
        {photoViewer && (
          <div
            className="fixed inset-0 bg-black z-[9999] flex flex-col"
            onClick={() => setPhotoViewer(null)}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/70">
              <span className="text-white text-sm font-medium">Registration Form</span>
              <button type="button"
                
                onClick={() => setPhotoViewer(null)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-auto p-2" onClick={e => e.stopPropagation()}>
              <img
                src={photoViewer}
                alt="Registration form"
                className="max-w-full max-h-full object-contain rounded"
                style={{ touchAction: 'pinch-zoom' }}
              />
            </div>
          </div>
        )}

        {/* Archive Detail View Modal */}
        {showArchiveDetails && archiveViewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowArchiveDetails(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-green-800 text-white p-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold flex items-center">
                  <Archive className="w-5 h-5 mr-2" />
                  Batch {archiveViewData.year} Archive Details
                </h3>
                <button type="button"
                  
                  onClick={() => setShowArchiveDetails(false)}
                  className="p-1 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">
                {/* Archive Summary */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-amber-800 mb-3">Archive Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">{archiveViewData.students || 0}</p>
                      <p className="text-sm text-gray-600">Total Students</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-green-600">{archiveViewData.cwts || 0}</p>
                      <p className="text-sm text-gray-600">CWTS</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-purple-600">{archiveViewData.lts || 0}</p>
                      <p className="text-sm text-gray-600">LTS</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-red-600">{archiveViewData.rotc || 0}</p>
                      <p className="text-sm text-gray-600">ROTC</p>
                    </div>
                  </div>
                </div>

                {/* Student Information Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Student Information
                  </h4>
                  {archiveViewData.studentData && archiveViewData.studentData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Student ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Program</th>
                            <th className="px-4 py-2 text-left">Component</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archiveViewData.studentData.map((student, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="px-4 py-2">{student.studentId}</td>
                              <td className="px-4 py-2">{student.name}</td>
                              <td className="px-4 py-2">{student.program}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  student.department === 'CWTS' ? 'bg-green-100 text-green-700' :
                                  student.department === 'LTS' ? 'bg-purple-100 text-purple-700' :
                                  student.department === 'ROTC' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {student.department}
                                </span>
                              </td>
                              <td className="px-4 py-2">{student.status || 'Completed'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Student details not available in archive</p>
                  )}
                </div>

                {/* Report Details Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Report Details
                  </h4>
                  {archiveViewData.reportData && archiveViewData.reportData.length > 0 ? (
                    <div className="space-y-3">
                      {archiveViewData.reportData.map((report, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">{report.title}</h5>
                            <span className={`px-2 py-1 rounded text-xs ${
                              report.department === 'CWTS' ? 'bg-green-100 text-green-700' :
                              report.department === 'LTS' ? 'bg-purple-100 text-purple-700' :
                              report.department === 'ROTC' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {report.department}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {report.due_date && <span>Due: {new Date(report.due_date).toLocaleDateString()}</span>}
                            <span>{report.submission_count ?? report.submissions?.length ?? 0} submission(s)</span>
                            {report.created_by_name && <span>By: {report.created_by_name}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Report details not available in archive</p>
                  )}
                </div>

                {/* Archive Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Archive Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Batch Year:</span> {archiveViewData.year}</p>
                    <p><span className="font-medium">Total Reports:</span> {archiveViewData.reports || 0}</p>
                    <p><span className="font-medium">Archived Date:</span> {archiveViewData.archivedAt ? new Date(archiveViewData.archivedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex space-x-3">
                <button type="button"
                  
                  onClick={() => setShowArchiveDetails(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button type="button"
                  
                  onClick={() => {
                    setShowArchiveDetails(false);
                    handleBackToCurrent();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Back to Current
                </button>
              </div>
            </div>
          </div>
        )}
      {/* Instructor List Modal */}
      {showInstructorList && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowInstructorList(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Instructors & Admin
              </h3>
              <button type="button" onClick={() => setShowInstructorList(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {allUsers.filter(u => u.role === 'instructor' || u.role === 'admin').length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found.</p>
              ) : (
                allUsers.filter(u => u.role === 'instructor' || u.role === 'admin').map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        u.role === 'admin' ? 'bg-gray-700' :
                        u.department === 'CWTS' ? 'bg-green-600' :
                        u.department === 'LTS'  ? 'bg-purple-600' :
                        'bg-red-600'
                      }`}>
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.role === 'admin' ? 'Admin' : `${u.department} Instructor`}</p>
                      </div>
                    </div>
                    {u.role === 'instructor' && (
                      <button
                        type="button"
                        onClick={() => { setShowInstructorList(false); navigate('/chat'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

        {/* Admin Enrollment Timed Schedule Modal */}
        {scheduleModalOpen && (
          <div className="fixed inset-0 bg-emerald-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in" onClick={() => setScheduleModalOpen(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-4 sm:p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Enrollment Schedule Settings</h3>
                    <p className="text-emerald-200 text-xs font-medium">Set opening date, time, &amp; auto-close schedule</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                {/* Current Live Status Banner */}
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
                  scheduleStatus.isOpen 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${scheduleStatus.isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">{scheduleStatus.headline}</p>
                      <p className="text-[11px] font-medium opacity-90 mt-0.5">{scheduleStatus.subtext}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-white rounded-lg border shadow-2xs shrink-0">
                    {scheduleConfig.mode}
                  </span>
                </div>

                {/* Control Mode Options */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Operation Mode</label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleConfig(prev => ({ ...prev, mode: 'AUTO' }))}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer ${
                        scheduleConfig.mode === 'AUTO'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      🕒 Auto Timed
                    </button>
                    <button
                      type="button"
                      onClick={quickForceOpen}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer ${
                        scheduleConfig.mode === 'FORCE_OPEN'
                          ? 'bg-green-600 text-white border-green-600 shadow-md'
                          : 'bg-gray-50 text-green-700 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      🟢 Force Open
                    </button>
                    <button
                      type="button"
                      onClick={quickForceClose}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer ${
                        scheduleConfig.mode === 'FORCE_CLOSE'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-gray-50 text-rose-700 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      🔴 Force Close
                    </button>
                  </div>
                </div>

                {/* Opening Date & Time */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    📅 Opening Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleConfig.openAt || ''}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, openAt: e.target.value }))}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Leave empty to open immediately when Auto Timed mode is selected.</p>
                </div>

                {/* Closing Date & Time */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    ⌛ Automatic Closing Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleConfig.closeAt || ''}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, closeAt: e.target.value }))}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Enrollment will automatically close when this date and time is reached.</p>
                </div>

                {/* Announcement Notice */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    📢 Student Notice / Announcement Text
                  </label>
                  <input
                    type="text"
                    value={scheduleConfig.customNotice || ''}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, customNotice: e.target.value }))}
                    placeholder="e.g. Online Enrollment for Academic Year 2026-2027 is now open."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={quickForceOpen}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Open Now
                  </button>
                  <button
                    type="button"
                    onClick={quickForceClose}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Close Now
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveSchedule(scheduleConfig);
                      setScheduleModalOpen(false);
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
                  >
                    Save &amp; Apply Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <ScrollToTopButton />
    </div>
  );
}

export default AdminDashboard;
