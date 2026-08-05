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

  // Get component color based on department
  const getComponentColor = () => {
    switch(user?.department) {
      case 'ROTC': return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200', gradient: 'from-red-600 to-red-700' };
      case 'LTS': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-600 to-purple-700' };
      default: return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-600 to-green-700' };
    }
  };

  const colors = getComponentColor();

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
    <div className="min-h-screen bg-gray-50 page-enter">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 p-2 sm:p-4 lg:p-6 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-3 sm:mb-5 gap-4">
          <div className="flex items-start gap-2">
            <button type="button"
              
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">{user?.department} Dashboard</h2>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full lg:w-auto justify-end">
            {/* Notification Container */}
            <div className="relative notification-container">
              <button type="button"
                
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-800"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown — same design as AdminDashboard */}
              {showNotifications && (
                <div
                  className="notification-dropdown absolute right-0 mt-2 w-[min(24rem,90vw)] bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button type="button"
                        
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
                      <button type="button"
                        onClick={handleMarkAllRead}
                        disabled={
                          selectedNotifications.length > 0
                            ? !(notifications || []).some(n => selectedNotifications.some(sid => notificationIdsMatch(sid, n.id)) && !n.read)
                            : (notifications || []).every(n => n.read)
                        }
                        className="text-blue-600 hover:text-blue-700 disabled:opacity-30 transition-colors"
                        title={selectedNotifications.length > 0 ? "Mark selected as read" : "Mark all as read"}
                      >
                        <MailOpen className="w-5 h-5" />
                      </button>
                      <button type="button"
                        
                        onClick={handleDeleteSelected}
                        disabled={selectedNotifications.length === 0}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-30"
                        title="Delete selected"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button type="button"
                        
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
                          <button type="button"
                            
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
                              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                {!notification.read && (
                                  <button type="button"
                                    
                                    onClick={(e) => handleMarkOneRead(e, notification.id)}
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                    title="Mark as read"
                                  >
                                    <MailOpen className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <span className="text-xs text-gray-400">{notification.time}</span>
                              </div>
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
            <Link to="/profile" className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow w-full sm:w-auto justify-center">
              {getUserAvatar()}
              <div className="hidden sm:block">
                <p className="font-medium text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.department} Instructor</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Students</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
              </div>
              <div className={`w-9 h-9 sm:w-12 sm:h-12 ${colors.bg} rounded-xl flex items-center justify-center shadow-inner`}>
                <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
              </div>
            </div>
            <div className="hidden sm:block mt-3">
              <div className="flex items-center text-xs text-emerald-600 font-medium mb-1">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                <span>Active Department Students</span>
              </div>
              <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Pending Messages</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-900 mt-1">{stats.pendingMessages}</p>
              </div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="hidden sm:block mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Status</span>
                <span className={`font-medium ${stats.pendingMessages > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{stats.pendingMessages > 0 ? 'Unread Messages' : 'All Read'}</span>
              </div>
              <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: stats.pendingMessages > 0 ? '100%' : '0%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Pending Reports</p>
                <p className="text-xl sm:text-3xl font-bold text-orange-900 mt-1">{stats.pendingReports}</p>
              </div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="hidden sm:block mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Action</span>
                <span className={`font-medium ${stats.pendingReports > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>{stats.pendingReports > 0 ? 'Submission Required' : 'Up to Date'}</span>
              </div>
              <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: stats.pendingReports > 0 ? '100%' : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* My Students */}
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                My Students
              </h3>
              <Link to="/students" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.studentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      student.status === 'Active' ? 'bg-green-100 text-green-700' : 
                      student.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status || 'Active'}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{student.hours} hrs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Recent Reports
              </h3>
            </div>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-800">{report.title}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      report.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                      report.status === 'Submitted' ? 'bg-blue-100 text-blue-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{report.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <ScrollToTopButton />
    </div>
  );
}

export default InstructorDashboard;
