import { useAuth } from '../context/AuthContext';
import ScrollToTopButton from '../components/ScrollToTopButton';
import Sidebar from '../components/layout/Sidebar';
import {
  Users, FileText, MessageSquare,
  User, Calendar, Menu, Bell, CheckCircle, Trash2, X, CheckSquare, Square, TrendingUp, MailOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Avatar options for display
const AVATAR_OPTIONS = {
  default: { color: 'bg-gray-400', icon: '👤' },
  green: { color: 'bg-green-500', icon: '🎓' },
  blue: { color: 'bg-blue-500', icon: '👨‍🏫' },
  purple: { color: 'bg-purple-500', icon: '👩‍🏫' },
  red: { color: 'bg-red-500', icon: '👮' },
  yellow: { color: 'bg-yellow-500', icon: '⭐' },
};

function InstructorDashboard() {
  const { user, logout, students, reports, conversations, messages, notifications, setNotifications } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);

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
    
    // Navigate based on type
    if (notification.type === 'student') {
      navigate('/students');
    } else if (notification.type === 'report') {
      navigate('/reports');
    } else if (notification.type === 'message') {
      navigate('/chat');
    } else if (notification.link && notification.link !== '#') {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



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

  // Get instructor's department students only
  const myStudents = students.filter(s => s.department === user?.department);
  const myReports = reports.filter(r => r.department === 'All' || r.department === user?.department);
  const pendingReports = myReports.filter(r => !(r.submissions && r.submissions.some(sub => sub.instructor === user?.name)));

  // Count unread messages across all conversations
  const readConversations = (() => {
    try { return JSON.parse(localStorage.getItem('nstp_read_conversations') || '{}'); }
    catch { return {}; }
  })();

  const pendingMessages = conversations.reduce((total, conv) => {
    const convMessages = messages[conv.id] || [];
    const lastReadTime = readConversations[conv.id] || 0;
    return total + convMessages.filter(msg => {
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
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Hero Header - Unified CvSU Naic Aesthetics */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-6 w-full">
          <div className="flex flex-row items-center justify-between gap-1.5 sm:gap-3 relative z-10 w-full">
            <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
              <button type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 sm:p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>

              <div className="w-6 h-6 sm:w-9 sm:h-9 bg-white rounded-lg sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-[11px] sm:text-lg lg:text-xl font-black tracking-tight text-white truncate">
                  <span className="hidden sm:inline">{user?.department} Instructor Portal</span>
                  <span className="sm:hidden">{user?.department} Portal</span>
                </h2>
                <p className="text-emerald-200 text-[9px] sm:text-xs lg:text-sm font-medium truncate mt-0.5">Welcome, {user?.name || 'Instructor'} 👋</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Notification Container */}
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

              {/* User Profile Button - Compact Avatar on Mobile, Full Pill on Desktop */}
              <Link 
                to="/profile" 
                className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-800/90 hover:bg-emerald-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-emerald-600/60 shadow-md transition-all cursor-pointer shrink-0 min-w-0"
                title="View Profile"
              >
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full overflow-hidden border border-emerald-400/60 shadow-xs">
                  {getUserAvatar()}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-extrabold text-[11px] sm:text-xs text-white leading-tight truncate max-w-[90px] sm:max-w-none">{user?.name || 'Instructor'}</p>
                  <p className="text-[10px] sm:text-[11px] text-amber-300 font-black uppercase tracking-wider whitespace-nowrap leading-tight">{user?.department ? `${user.department} Instructor` : 'Instructor'}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Cards - 3 Side-by-Side on Cellphone */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-3 sm:mb-6">
          <div
            className="bg-gradient-to-r from-emerald-700 to-green-800 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            onClick={() => navigate('/students')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-emerald-100 text-[8px] sm:text-xs font-medium uppercase tracking-wider truncate">Students</p>
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.totalStudents} <span className="text-[8px] font-normal hidden sm:inline">Active</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-emerald-800 font-semibold transition-all shrink-0">View &rarr;</span>
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
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.pendingMessages} <span className="text-[8px] font-normal hidden sm:inline">Unread</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-blue-800 font-semibold transition-all shrink-0">Open &rarr;</span>
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
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        student.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                        student.status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {student.status || 'Active'}
                      </span>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">{student.hours || 0} hrs</p>
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
      </main>
      <ScrollToTopButton />
    </div>
  );
}

export default InstructorDashboard;
