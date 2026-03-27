import { useAuth } from '../App';
import { 
  LayoutDashboard, Users, FileText, MessageSquare, 
  LogOut, User, ChevronLeft, Calendar as CalendarIcon, Plus, X,
  ChevronRight, ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';

// Avatar options for display
const AVATAR_OPTIONS = {
  default: { color: 'bg-gray-400', icon: '👤' },
  green: { color: 'bg-green-500', icon: '🎓' },
  blue: { color: 'bg-blue-500', icon: '👨‍🏫' },
  purple: { color: 'bg-purple-500', icon: '👩‍🏫' },
  red: { color: 'bg-red-500', icon: '👮' },
  yellow: { color: 'bg-yellow-500', icon: '⭐' },
};

function Calendar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('nstp_calendar_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });
  const [notification, setNotification] = useState(null);
  
  // Philippine Holidays 2024-2030
  const philippineHolidays = [
    // 2024
    { date: '2024-01-01', title: "New Year's Day", type: 'holiday' },
    { date: '2024-02-10', title: 'Chinese New Year', type: 'holiday' },
    { date: '2024-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday' },
    { date: '2024-03-28', title: 'Maundy Thursday', type: 'holiday' },
    { date: '2024-03-29', title: 'Good Friday', type: 'holiday' },
    { date: '2024-03-30', title: 'Black Saturday', type: 'holiday' },
    { date: '2024-04-09', title: 'Araw ng Kagitingan', type: 'holiday' },
    { date: '2024-05-01', title: 'Labor Day', type: 'holiday' },
    { date: '2024-06-12', title: 'Independence Day', type: 'holiday' },
    { date: '2024-08-26', title: 'National Heroes Day', type: 'holiday' },
    { date: '2024-11-30', title: 'Bonifacio Day', type: 'holiday' },
    { date: '2024-12-25', title: 'Christmas Day', type: 'holiday' },
    { date: '2024-12-30', title: 'Rizal Day', type: 'holiday' },
    
    // 2025
    { date: '2025-01-01', title: "New Year's Day", type: 'holiday' },
    { date: '2025-01-29', title: 'Chinese New Year', type: 'holiday' },
    { date: '2025-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday' },
    { date: '2025-04-17', title: 'Maundy Thursday', type: 'holiday' },
    { date: '2025-04-18', title: 'Good Friday', type: 'holiday' },
    { date: '2025-04-19', title: 'Black Saturday', type: 'holiday' },
    { date: '2025-04-09', title: 'Araw ng Kagitingan', type: 'holiday' },
    { date: '2025-05-01', title: 'Labor Day', type: 'holiday' },
    { date: '2025-06-12', title: 'Independence Day', type: 'holiday' },
    { date: '2025-08-25', title: 'National Heroes Day', type: 'holiday' },
    { date: '2025-11-30', title: 'Bonifacio Day', type: 'holiday' },
    { date: '2025-12-25', title: 'Christmas Day', type: 'holiday' },
    { date: '2025-12-30', title: 'Rizal Day', type: 'holiday' },
    
    // 2026
    { date: '2026-01-01', title: "New Year's Day", type: 'holiday' },
    { date: '2026-02-17', title: 'Chinese New Year', type: 'holiday' },
    { date: '2026-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday' },
    { date: '2026-04-02', title: 'Maundy Thursday', type: 'holiday' },
    { date: '2026-04-03', title: 'Good Friday', type: 'holiday' },
    { date: '2026-04-04', title: 'Black Saturday', type: 'holiday' },
    { date: '2026-04-09', title: 'Araw ng Kagitingan', type: 'holiday' },
    { date: '2026-05-01', title: 'Labor Day', type: 'holiday' },
    { date: '2026-06-12', title: 'Independence Day', type: 'holiday' },
    { date: '2026-08-31', title: 'National Heroes Day', type: 'holiday' },
    { date: '2026-11-30', title: 'Bonifacio Day', type: 'holiday' },
    { date: '2026-12-25', title: 'Christmas Day', type: 'holiday' },
    { date: '2026-12-30', title: 'Rizal Day', type: 'holiday' },
    
    // 2027
    { date: '2027-01-01', title: "New Year's Day", type: 'holiday' },
    { date: '2027-02-06', title: 'Chinese New Year', type: 'holiday' },
    { date: '2027-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday' },
    { date: '2027-03-25', title: 'Maundy Thursday', type: 'holiday' },
    { date: '2027-03-26', title: 'Good Friday', type: 'holiday' },
    { date: '2027-03-27', title: 'Black Saturday', type: 'holiday' },
    { date: '2027-04-09', title: 'Araw ng Kagitingan', type: 'holiday' },
    { date: '2027-05-01', title: 'Labor Day', type: 'holiday' },
    { date: '2027-06-12', title: 'Independence Day', type: 'holiday' },
    { date: '2027-08-30', title: 'National Heroes Day', type: 'holiday' },
    { date: '2027-11-30', title: 'Bonifacio Day', type: 'holiday' },
    { date: '2027-12-25', title: 'Christmas Day', type: 'holiday' },
    { date: '2027-12-30', title: 'Rizal Day', type: 'holiday' },
    
    // 2028
    { date: '2028-01-01', title: "New Year's Day", type: 'holiday' },
    { date: '2028-01-26', title: 'Chinese New Year', type: 'holiday' },
    { date: '2028-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday' },
    { date: '2028-04-13', title: 'Maundy Thursday', type: 'holiday' },
    { date: '2028-04-14', title: 'Good Friday', type: 'holiday' },
    { date: '2028-04-15', title: 'Black Saturday', type: 'holiday' },
    { date: '2028-04-09', title: 'Araw ng Kagitingan', type: 'holiday' },
    { date: '2028-05-01', title: 'Labor Day', type: 'holiday' },
    { date: '2028-06-12', title: 'Independence Day', type: 'holiday' },
    { date: '2028-08-28', title: 'National Heroes Day', type: 'holiday' },
    { date: '2028-11-30', title: 'Bonifacio Day', type: 'holiday' },
    { date: '2028-12-25', title: 'Christmas Day', type: 'holiday' },
    { date: '2028-12-30', title: 'Rizal Day', type: 'holiday' },
    
    // 2029
    { date: '2029-01-01', title: "New Year's Day", type: 'holiday' },
    { date: '2029-02-12', title: 'Chinese New Year', type: 'holiday' },
    { date: '2029-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday' },
    { date: '2029-03-29', title: 'Maundy Thursday', type: 'holiday' },
    { date: '2029-03-30', title: 'Good Friday', type: 'holiday' },
    { date: '2029-03-31', title: 'Black Saturday', type: 'holiday' },
    { date: '2029-04-09', title: 'Araw ng Kagitingan', type: 'holiday' },
    { date: '2029-05-01', title: 'Labor Day', type: 'holiday' },
    { date: '2029-06-12', title: 'Independence Day', type: 'holiday' },
    { date: '2029-08-27', title: 'National Heroes Day', type: 'holiday' },
    { date: '2029-11-30', title: 'Bonifacio Day', type: 'holiday' },
    { date: '2029-12-25', title: 'Christmas Day', type: 'holiday' },
    { date: '2029-12-30', title: 'Rizal Day', type: 'holiday' },
    
    // 2030
    { date: '2030-01-01', title: "New Year's Day", type: 'holiday' },
    { date: '2030-02-03', title: 'Chinese New Year', type: 'holiday' },
    { date: '2030-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday' },
    { date: '2030-04-18', title: 'Maundy Thursday', type: 'holiday' },
    { date: '2030-04-19', title: 'Good Friday', type: 'holiday' },
    { date: '2030-04-20', title: 'Black Saturday', type: 'holiday' },
    { date: '2030-04-09', title: 'Araw ng Kagitingan', type: 'holiday' },
    { date: '2030-05-01', title: 'Labor Day', type: 'holiday' },
    { date: '2030-06-12', title: 'Independence Day', type: 'holiday' },
    { date: '2030-08-26', title: 'National Heroes Day', type: 'holiday' },
    { date: '2030-11-30', title: 'Bonifacio Day', type: 'holiday' },
    { date: '2030-12-25', title: 'Christmas Day', type: 'holiday' },
    { date: '2030-12-30', title: 'Rizal Day', type: 'holiday' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), date);
    const holidays = philippineHolidays.filter(h => h.date === dateStr);
    
    // Only instructors can see admin-added events
    const customEvents = isInstructor || isAdmin 
      ? events.filter(e => e.date === dateStr)
      : events.filter(e => e.date === dateStr && e.type === 'holiday'); // Students only see holidays
    
    return [...holidays, ...customEvents];
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    
    const event = {
      id: Date.now(),
      title: newEvent.title,
      date: newEvent.date,
      type: 'event',
      createdBy: user?.name
    };
    
    setEvents([...events, event]);
    localStorage.setItem('nstp_calendar_events', JSON.stringify([...events, event]));
    setNewEvent({ title: '', date: '' });
    setShowAddEventModal(false);
    setNotification({ type: 'success', message: 'Event added successfully!' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteEvent = (eventId) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('nstp_calendar_events', JSON.stringify(updatedEvents));
    setNotification({ type: 'success', message: 'Event deleted successfully!' });
    setTimeout(() => setNotification(null), 3000);
  };

  const changeMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-green-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6" />
          <span className="font-bold">Calendar</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-green-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
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
            <CalendarIcon className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg">National Service Training Program</h1>
              <p className="text-xs text-green-200">Calendar</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              (user?.role === 'admin' && location.pathname === '/admin/dashboard') || 
              (user?.role === 'instructor' && location.pathname === '/instructor/dashboard') 
              ? 'bg-green-700' : 'hover:bg-green-700/50'
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
            <span>Students</span>
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-green-700"
          >
            <CalendarIcon className="w-5 h-5" />
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
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Calendar</h1>
              <p className="text-gray-600">
                {isAdmin ? 'Manage events and holidays' : 'View calendar and events'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowAddEventModal(true)}
              className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              <span>Add Event</span>
            </button>
          )}
        </div>

        {/* Calendar Component */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-medium text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}
            
            {getDaysInMonth(currentDate).map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day === new Date().getDate() && 
                             currentDate.getMonth() === new Date().getMonth() && 
                             currentDate.getFullYear() === new Date().getFullYear();
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors ${
                    day ? 'hover:bg-gray-50' : ''
                  } ${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                              event.type === 'holiday' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">
                Events for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} {selectedDate}
              </h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'holiday' ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <span className="text-sm font-medium">{event.title}</span>
                        {event.createdBy && (
                          <span className="text-xs text-gray-500 block">by {event.createdBy}</span>
                        )}
                      </div>
                    </div>
                    {event.createdBy && isAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-gray-500 text-sm">No events for this date.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Event Modal */}
        {showAddEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Add Event</h3>
                <button 
                  onClick={() => setShowAddEventModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddEvent}
                  disabled={!newEvent.title.trim() || !newEvent.date}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Calendar;
