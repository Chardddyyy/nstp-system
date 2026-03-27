import { useAuth } from '../App';
import { 
  LayoutDashboard, Users, FileText, MessageSquare, 
  LogOut, User, ChevronLeft, Calendar, Menu, ChevronRight, Bell, CheckCircle, Trash2, X, CheckSquare, Square
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const { user, logout, students, reports, conversations } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('nstp_instructor_notifications');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'New student registration', message: 'A new student has registered in your department', time: '5 min ago', read: false, type: 'student' },
      { id: 2, title: 'Report submission', message: 'Student Juan Dela Cruz submitted a report', time: '1 hour ago', read: false, type: 'report' },
      { id: 3, title: 'System update', message: 'System maintenance scheduled for tonight', time: '2 hours ago', read: true, type: 'system' }
    ];
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  
  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('nstp_instructor_notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notification-container')) {
        setShowNotifications(false);
        setDeleteMode(false);
        setSelectedNotifications([]);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedNotifications([]);
  };
  
  const toggleNotificationSelection = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };
  
  const selectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };
  
  const deleteSelectedNotifications = () => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
    setDeleteMode(false);
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    
    // Navigate based on type
    if (notification.type === 'student') {
      navigate('/students');
    } else if (notification.type === 'report') {
      navigate('/reports');
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

  // Statistics based on instructor's students
  const stats = {
    totalStudents: myStudents.length,
    activeStudents: myStudents.filter(s => s.status === 'Active').length,
    pendingReports: pendingReports.length,
    completedHours: myStudents.reduce((acc, s) => acc + (parseInt(s.hours) || 0), 0),
    unreadMessages: 0
  };

  // Get recent students and reports
  const recentStudents = myStudents.slice(0, 5);
  const recentReports = myReports.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-green-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6" />
          <span className="font-bold">{user?.department} Dashboard</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-green-700 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-green-800 text-white shadow-xl z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-green-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
              <Shield className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <h1 className="font-bold text-lg">Cavite State University Naic</h1>
              <p className="text-xs text-green-200">{user?.department} Instructor</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => navigate('/instructor/dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/instructor/dashboard' ? 'bg-green-700' : 'hover:bg-green-700/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/students')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>My Students</span>
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>
          <button 
            onClick={() => navigate('/calendar')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 p-4 lg:p-8 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
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
              <button 
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
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {!deleteMode ? (
                          <>
                            <button 
                              onClick={toggleDeleteMode}
                              className="text-sm text-red-600 hover:text-red-700"
                              title="Delete notifications"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={selectAllNotifications}
                              className="text-sm text-gray-600 hover:text-gray-800"
                              title="Select all"
                            >
                              {selectedNotifications.length === notifications.length ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                            <button 
                              onClick={deleteSelectedNotifications}
                              disabled={selectedNotifications.length === 0}
                              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="Delete selected"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={toggleDeleteMode}
                              className="text-sm text-gray-600 hover:text-gray-800"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-gray-500">No notifications</p>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          onClick={() => !deleteMode && handleNotificationClick(notification)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-start space-x-3 ${
                            !notification.read ? 'bg-blue-50' : ''
                          } ${deleteMode ? 'cursor-default' : ''}`}
                        >
                          {deleteMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNotificationSelection(notification.id);
                              }}
                              className="mt-1"
                            >
                              {selectedNotifications.includes(notification.id) ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-400">{notification.time}</span>
                            </div>
                            <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            {!notification.read && !deleteMode && (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
              </div>
              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <Users className={`w-6 h-6 ${colors.text}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+8 new this month</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Students</p>
                <p className="text-3xl font-bold text-gray-800">{stats.activeStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span>{stats.totalStudents > 0 ? Math.round(stats.activeStudents/stats.totalStudents*100) : 0}% completion rate</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Reports</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pendingReports}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-red-500">
              <span>Needs attention</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Students */}
          <div className="bg-white rounded-xl shadow-md p-6">
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
          <div className="bg-white rounded-xl shadow-md p-6">
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
    </div>
  );
}

export default InstructorDashboard;
