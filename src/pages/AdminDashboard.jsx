import { useAuth } from '../App';
import { archivesAPI } from '../services/api';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  LogOut, User, TrendingUp, Shield,
  BookOpen, Bell, Calendar, X, CheckCircle, AlertCircle, Trash2, CheckSquare, Square,
  BarChart3, Archive, RotateCcw, History, ChevronDown, ChevronUp, Menu
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

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
  const { user, logout, clearBatchData, students, reports, allUsers, messages, conversations, pendingEnrollments, approveEnrollment, declineEnrollment, refreshData, archivedYears, currentBatch, notifications, setNotifications, viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  
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
  const [selectedYear, setSelectedYear] = useState(null);
  const [showNewBatchConfirm, setShowNewBatchConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showArchiveDetails, setShowArchiveDetails] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };
  
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

  // Mark all as read
  function handleMarkAllRead() {
    const newNotifications = (notifications || []).map(n => {
      return { ...n, read: true };
    });
    setNotifications(newNotifications);
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

  // Calculate statistics from actual data - memoized for performance
  const stats = useMemo(() => ({
    totalStudents: students.length,
    cwtsStudents: students.filter(s => s.department === 'CWTS').length,
    ltsStudents: students.filter(s => s.department === 'LTS').length,
    rotcStudents: students.filter(s => s.department === 'ROTC').length,
    totalInstructors: allUsers.filter(u => u.role === 'instructor').length,
    // Pending reports = reports created by admin that don't have submissions yet
    pendingReports: reports.filter(r => !r.submissions || r.submissions.length === 0).length,
    unreadMessages: (notifications || []).filter(n => n.type === 'message' && !n.read).length
  }), [students, allUsers, reports, notifications]);

  // Calculate current year stats for comparison (after stats is defined)
  const currentYear = new Date().getFullYear();
  const previousYearData = useMemo(() => archivedYears.find(y => y.year === currentYear - 1) || archivedYears[archivedYears.length - 1], [archivedYears, currentYear]);
  
  // Use archived stats when viewing archive, otherwise use current stats
  const displayStats = viewingArchive && archiveViewData ? (() => {
    const sd = archiveViewData.studentData || [];
    const cwts = archiveViewData.data?.cwts ?? (sd.filter(s => s.department === 'CWTS').length || 0);
    const lts  = archiveViewData.data?.lts  ?? (sd.filter(s => s.department === 'LTS').length  || 0);
    const rotc = archiveViewData.data?.rotc ?? (sd.filter(s => s.department === 'ROTC').length || 0);
    return {
      totalStudents: archiveViewData.students || sd.length,
      cwtsStudents: cwts,
      ltsStudents: lts,
      rotcStudents: rotc,
      totalInstructors: 0,
      pendingReports: 0,
      unreadMessages: 0
    };
  })() : stats;
  
  const currentStats = useMemo(() => ({
    total: displayStats.totalStudents,
    cwts: displayStats.cwtsStudents,
    lts: displayStats.ltsStudents,
    rotc: displayStats.rotcStudents,
    completionRate: displayStats.totalStudents > 0 ? Math.round(((viewingArchive && archiveViewData ? archiveViewData.completed : students.filter(s => s.status === 'completed').length) / displayStats.totalStudents) * 100) : 0
  }), [displayStats, viewingArchive, archiveViewData, students]);
  
  const yearOverYearChange = useMemo(() => ({
    total: currentStats.total - (previousYearData?.students || 0),
    cwts: currentStats.cwts - (previousYearData?.cwts || 0),
    lts: currentStats.lts - (previousYearData?.lts || 0),
    rotc: currentStats.rotc - (previousYearData?.rotc || 0)
  }), [currentStats, previousYearData]);
  
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
    } catch (e) {
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
  const recentActivities = [];
  const recentMessages = [];

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
    <div className="min-h-screen bg-gray-50">

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-start gap-3 mb-5">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-800 text-sm font-medium">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 bg-green-800 text-white shadow-xl z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-green-700">
          <div className="flex items-center space-x-3 text-white">
            <span className="text-xl font-bold">National Service Training Program</span>
            
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            type="button"
            onClick={() => { navigate('/admin/dashboard'); setSidebarOpen(false); }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              viewingArchive ? 'opacity-40 cursor-not-allowed' :
              location.pathname === '/admin/dashboard' ? 'bg-green-700' : 'hover:bg-green-700/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/students'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/students' ? 'bg-green-700' : 'hover:bg-green-700/50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Students</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/reports'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/reports' ? 'bg-green-700' : 'hover:bg-green-700/50'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button
            type="button"
            onClick={() => { if (!viewingArchive) { navigate('/chat'); setSidebarOpen(false); } }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${viewingArchive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>
          <button
            type="button"
            onClick={() => { if (!viewingArchive) { navigate('/calendar'); setSidebarOpen(false); } }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${viewingArchive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'}`}
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => { if (!viewingArchive) { navigate('/profile'); setSidebarOpen(false); } }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${viewingArchive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'}`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ease-in-out p-4 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Previous Report Header - Show when viewing archive */}
        {viewingArchive && archiveViewData && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Archive className="w-6 h-6 text-amber-600" />
                <div>
                  <h2 className="text-lg font-bold text-amber-800">Previous Report - Batch {archiveViewData.year}</h2>
                  <p className="text-sm text-amber-600">Viewing archived data. Editing is disabled.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBackToCurrent}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Back to Current</span>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                {viewingArchive ? `Batch ${archiveViewData?.year} Records` : 'Admin Dashboard'}
              </h1>
              <p className="text-gray-600">
                {viewingArchive ? 'Viewing archived batch data' : `Welcome back, ${user?.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full lg:w-auto justify-end">
            {/* Notification Bell */}
            <div className="relative notification-container">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div
                  className="notification-dropdown absolute right-0 mt-2 w-[min(24rem,90vw)] bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        title={selectedNotifications.length === (notifications || []).length && notifications.length > 0 ? 'Deselect all' : 'Select all'}
                        className="text-gray-400 hover:text-green-600 transition-colors"
                      >
                        {selectedNotifications.length === (notifications || []).length && notifications.length > 0
                          ? <CheckSquare className="w-5 h-5 text-green-600" />
                          : <Square className="w-5 h-5" />}
                      </button>
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        disabled={selectedNotifications.length === 0}
                        className="text-red-600 hover:text-red-700 disabled:opacity-30"
                        title="Delete selected"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNotifications(false); setSelectedNotifications([]); }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-gray-500 text-center">No notifications</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 flex items-start space-x-3 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectNotification(notification.id);
                            }}
                            className="mt-1 shrink-0"
                          >
                            {selectedNotifications.some(function(sid) { return notificationIdsMatch(sid, notification.id); }) ? (
                              <CheckSquare className="w-5 h-5 text-green-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleNotificationItemClick(notification)}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-400">{notification.time}</span>
                            </div>
                            <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <span className="inline-block mt-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow w-full sm:w-auto justify-center"
            >
              {getUserAvatar()}
              <div className="hidden sm:block">
                <p className="font-medium text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-500">Administrator</p>
              </div>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-md ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-800">{displayStats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span>{viewingArchive ? 'Archived total' : 'Total enrolled students'}</span>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-md ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">CWTS Students</p>
                <p className="text-3xl font-bold text-gray-800">{displayStats.cwtsStudents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span>{displayStats.totalStudents > 0 ? Math.round(displayStats.cwtsStudents/displayStats.totalStudents*100) : 0}% of total</span>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-md ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">LTS Students</p>
                <p className="text-3xl font-bold text-gray-800">{displayStats.ltsStudents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span>{displayStats.totalStudents > 0 ? Math.round(displayStats.ltsStudents/displayStats.totalStudents*100) : 0}% of total</span>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-md ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">ROTC Students</p>
                <p className="text-3xl font-bold text-gray-800">{displayStats.rotcStudents}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span>{displayStats.totalStudents > 0 ? Math.round(displayStats.rotcStudents/displayStats.totalStudents*100) : 0}% of total</span>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-xl shadow-md text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Total Instructors</p>
                <p className="text-2xl font-bold">{stats.totalInstructors}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-md text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-yellow-100 text-sm">Pending Reports</p>
                <p className="text-2xl font-bold">{stats.pendingReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-md text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Unread Messages</p>
                <p className="text-2xl font-bold">{stats.unreadMessages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Enrollments Section */}
        {!viewingArchive && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-yellow-600" />
                Pending Enrollments ({pendingEnrollments.length})
              </h3>
            </div>
            {pendingEnrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name with Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program (ROTC/LTS/CWTS)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEnrollments.map((enrollment) => (
                      <tr 
                        key={enrollment.id} 
                        className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedEnrollment(enrollment)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{enrollment.studentId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{enrollment.fullName}</p>
                            <p className="text-sm text-gray-500">{enrollment.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.section || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.yearLevel}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            enrollment.nstpComponent === 'CWTS' ? 'bg-green-100 text-green-700' :
                            enrollment.nstpComponent === 'LTS' ? 'bg-purple-100 text-purple-700' :
                            enrollment.nstpComponent === 'ROTC' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {enrollment.nstpComponent || 'Not Set'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={async () => { try { await approveEnrollment(enrollment.id); } catch (e) {} }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={async () => { try { await declineEnrollment(enrollment.id); } catch (e) {} }}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No pending enrollment applications at this time.</p>
                <p className="text-sm mt-1">New student enrollments will appear here.</p>
              </div>
            )}
          </div>
        )}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Cavite State University Naic Component Enrollment Comparison
            </h3>
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
            >
              {showAnalytics ? (
                <><ChevronUp className="w-4 h-4 mr-1" /> Hide Analytics</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-1" /> View Analytics</>
              )}
            </button>
          </div>
          
          {showAnalytics && (
            <>
              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-700 font-medium">CWTS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-sm text-gray-700 font-medium">LTS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-700 font-medium">ROTC</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  {/* Current Year + Archived Years - filter out current batch from archive to avoid duplicates */}
                  {[...archivedYears.filter(y => y.year !== parseInt(currentBatch)).map(y => ({ 
                    year: y.year, 
                    cwts: y.data?.cwts || y.cwts || 0, 
                    lts: y.data?.lts || y.lts || 0, 
                    rotc: y.data?.rotc || y.rotc || 0 
                  })), 
                    { year: parseInt(currentBatch), cwts: currentStats.cwts, lts: currentStats.lts, rotc: currentStats.rotc }
                  ].sort((a, b) => a.year - b.year).map((data) => {
                    const maxVal = Math.max(data.cwts || 0, data.lts || 0, data.rotc || 0, 100);
                    return (
                      <div key={data.year} className="mb-6">
                        <div className="flex items-center mb-2">
                          <span className="w-16 text-sm font-bold text-gray-700">{data.year}</span>
                        </div>
                        <div className="space-y-2 ml-16">
                          {/* CWTS Bar */}
                          <div className="flex items-center">
                            <span className="w-12 text-xs text-gray-500">CWTS</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                style={{ width: `${(data.cwts / maxVal) * 100}%`, minWidth: data.cwts > 0 ? '30px' : '0' }}
                              >
                                {data.cwts > 0 && <span className="text-xs text-white font-medium">{data.cwts}</span>}
                              </div>
                            </div>
                          </div>
                          {/* LTS Bar */}
                          <div className="flex items-center">
                            <span className="w-12 text-xs text-gray-500">LTS</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                style={{ width: `${(data.lts / maxVal) * 100}%`, minWidth: data.lts > 0 ? '30px' : '0' }}
                              >
                                {data.lts > 0 && <span className="text-xs text-white font-medium">{data.lts}</span>}
                              </div>
                            </div>
                          </div>
                          {/* ROTC Bar */}
                          <div className="flex items-center">
                            <span className="w-12 text-xs text-gray-500">ROTC</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-red-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                style={{ width: `${(data.rotc / maxVal) * 100}%`, minWidth: data.rotc > 0 ? '30px' : '0' }}
                              >
                                {data.rotc > 0 && <span className="text-xs text-white font-medium">{data.rotc}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Table */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Enrollment Summary by Year</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Year</th>
                        <th className="px-4 py-2 text-center font-medium text-green-600">CWTS</th>
                        <th className="px-4 py-2 text-center font-medium text-purple-600">LTS</th>
                        <th className="px-4 py-2 text-center font-medium text-red-600">ROTC</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Total</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Highest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...archivedYears.filter(y => y.year !== parseInt(currentBatch)).map(y => ({ 
                        year: y.year, 
                        cwts: y.data?.cwts || y.cwts || 0, 
                        lts: y.data?.lts || y.lts || 0, 
                        rotc: y.data?.rotc || y.rotc || 0 
                      })), 
                        { year: parseInt(currentBatch), cwts: currentStats.cwts, lts: currentStats.lts, rotc: currentStats.rotc }
                      ].sort((a, b) => b.year - a.year).map((data) => {
                        const total = (data.cwts || 0) + (data.lts || 0) + (data.rotc || 0);
                        const maxComponent = Math.max(data.cwts || 0, data.lts || 0, data.rotc || 0);
                        const highest = data.cwts === maxComponent ? 'CWTS' : data.lts === maxComponent ? 'LTS' : 'ROTC';
                        return (
                          <tr key={data.year} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{data.year}</td>
                            <td className="px-4 py-3 text-center text-green-600 font-medium">{data.cwts || 0}</td>
                            <td className="px-4 py-3 text-center text-purple-600 font-medium">{data.lts || 0}</td>
                            <td className="px-4 py-3 text-center text-red-600 font-medium">{data.rotc || 0}</td>
                            <td className="px-4 py-3 text-center text-gray-800 font-bold">{(data.cwts || 0) + (data.lts || 0) + (data.rotc || 0)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                highest === 'CWTS' ? 'bg-green-100 text-green-700' :
                                highest === 'LTS' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {highest}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Batch Management - Hide when viewing archive */}
        {!viewingArchive && (
          <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl shadow-md p-6 mb-8 text-white">
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
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <History className="w-5 h-5" />
                  <span>View Archive</span>
                </button>
                <button
                  type="button"
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

        {/* Archive Modal - Simple List View */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <History className="w-6 h-6 mr-2 text-green-600" />
                  Select Batch to View
                </h3>
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {archivedYears.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No archived data yet</p>
                ) : (
                  <div className="space-y-3">
                    {archivedYears.sort((a, b) => b.year - a.year).map((year) => (
                      <div key={year.year} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-4 gap-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">Batch {year.year}</h4>
                          <p className="text-sm text-gray-500">{year.students} students • {year.reports} reports</p>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewBatch(year)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            View Batch
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteArchivedBatch(year.year)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
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
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Batch Confirmation Modal */}
        {showNewBatchConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Archive className="w-6 h-6 mr-2 text-red-600" />
                  Start New Batch
                </h3>
                <button
                  type="button"
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
                <button
                  type="button"
                  onClick={() => setShowNewBatchConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-green-800 text-white p-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Student Enrollment Details
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedEnrollment(null)}
                  className="p-1 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Student ID:</span> <span className="font-medium">{selectedEnrollment.studentId}</span></div>
                    <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{selectedEnrollment.fullName}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedEnrollment.email}</span></div>
                    <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{selectedEnrollment.contactNumber}</span></div>
                    <div><span className="text-gray-500">Address:</span> <span className="font-medium">{selectedEnrollment.address}</span></div>
                    <div><span className="text-gray-500">Facebook:</span> <span className="font-medium">{selectedEnrollment.facebookAccount || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Academic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Program:</span> <span className="font-medium">{selectedEnrollment.program}</span></div>
                    <div><span className="text-gray-500">Section:</span> <span className="font-medium">{selectedEnrollment.section}</span></div>
                    <div><span className="text-gray-500">Year Level:</span> <span className="font-medium">{selectedEnrollment.yearLevel}</span></div>
                    <div><span className="text-gray-500">NSTP Component:</span> <span className="font-medium">{selectedEnrollment.nstpComponent}</span></div>
                  </div>
                </div>

                {/* Demographic Information */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Demographic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Birth Date:</span> <span className="font-medium">{selectedEnrollment.birthDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(selectedEnrollment.birthDate)) : '-'}</span></div>
                    <div><span className="text-gray-500">Age:</span> <span className="font-medium">{selectedEnrollment.age}</span></div>
                    <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{selectedEnrollment.gender}</span></div>
                    <div><span className="text-gray-500">Civil Status:</span> <span className="font-medium">{selectedEnrollment.civilStatus}</span></div>
                    <div><span className="text-gray-500">Height:</span> <span className="font-medium">{selectedEnrollment.height || 'N/A'}</span></div>
                    <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{selectedEnrollment.weight || 'N/A'}</span></div>
                    <div><span className="text-gray-500">Blood Type:</span> <span className="font-medium">{selectedEnrollment.bloodType || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Emergency Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Contact Person:</span> <span className="font-medium">{selectedEnrollment.emergencyContact}</span></div>
                    <div><span className="text-gray-500">Contact Number:</span> <span className="font-medium">{selectedEnrollment.emergencyNumber}</span></div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 text-sm">Status:</span>
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">
                        {selectedEnrollment.status || 'Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Submitted: {new Date(selectedEnrollment.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={async () => {
                    try { await approveEnrollment(selectedEnrollment.id); } catch (e) {}
                    setSelectedEnrollment(null);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try { await declineEnrollment(selectedEnrollment.id); } catch (e) {}
                    setSelectedEnrollment(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5 mr-2" />
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEnrollment(null)}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Archive Detail View Modal */}
        {showArchiveDetails && archiveViewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-green-800 text-white p-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold flex items-center">
                  <Archive className="w-5 h-5 mr-2" />
                  Batch {archiveViewData.year} Archive Details
                </h3>
                <button
                  type="button"
                  onClick={() => setShowArchiveDetails(false)}
                  className="p-1 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Archive Summary */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-amber-800 mb-3">Archive Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-600">{archiveViewData.students || 0}</p>
                      <p className="text-sm text-gray-600">Total Students</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-600">{archiveViewData.cwts || 0}</p>
                      <p className="text-sm text-gray-600">CWTS</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-purple-600">{archiveViewData.lts || 0}</p>
                      <p className="text-sm text-gray-600">LTS</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-red-600">{archiveViewData.rotc || 0}</p>
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
                <button
                  type="button"
                  onClick={() => setShowArchiveDetails(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
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
      </main>
    </div>
  );
}

export default AdminDashboard;
