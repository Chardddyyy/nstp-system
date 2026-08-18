import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon, Plus, X, Pencil,
  ChevronRight, ChevronLeft, Menu, CheckCircle, AlertCircle, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';

function Calendar() {
  const { user, logout, pushNotification } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('nstp_calendar_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '' });
  
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

  const todayStr = formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const isPastDay = (day) => {
    if (!day) return false;
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dateStr < todayStr;
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

  const handleSaveEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    
    if (editingEvent) {
      const updatedEvents = events.map(e => {
        if (e.id === editingEvent.id) {
          return {
            ...e,
            title: newEvent.title.trim(),
            date: newEvent.date,
            description: newEvent.description.trim(),
            isEdited: true,
            editedAt: new Date().toISOString(),
            lastModifiedBy: user?.name
          };
        }
        return e;
      });

      setEvents(updatedEvents);
      localStorage.setItem('nstp_calendar_events', JSON.stringify(updatedEvents));

      // Push real-time notification
      if (typeof pushNotification === 'function') {
        pushNotification({
          title: 'Calendar Event Updated',
          message: `Event "${newEvent.title.trim()}" was updated for ${newEvent.date} (Edited)`,
          type: 'calendar',
          link: '/calendar',
        });
      }

      setNewEvent({ title: '', date: '', description: '' });
      setEditingEvent(null);
      setShowAddEventModal(false);
    } else {
      const event = {
        id: Date.now(),
        title: newEvent.title.trim(),
        date: newEvent.date,
        description: newEvent.description.trim(),
        type: 'event',
        createdBy: user?.name,
        isEdited: false
      };

      const updated = [...events, event];
      setEvents(updated);
      localStorage.setItem('nstp_calendar_events', JSON.stringify(updated));

      // Push real-time notification
      if (typeof pushNotification === 'function') {
        pushNotification({
          title: 'New Calendar Activity',
          message: `New activity "${newEvent.title.trim()}" scheduled for ${newEvent.date}`,
          type: 'calendar',
          link: '/calendar',
        });
      }

      setNewEvent({ title: '', date: '', description: '' });
      setShowAddEventModal(false);
    }
  };

  const openEditEventModal = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title || '',
      date: event.date || '',
      description: event.description || ''
    });
    setSelectedDate(null);
    setShowAddEventModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('nstp_calendar_events', JSON.stringify(updatedEvents));
  };

  const changeMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  // Get user avatar display
  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50 overflow-hidden flex flex-col">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 p-2 sm:p-3 lg:p-5 ${sidebarOpen ? 'lg:ml-64' : ''}`}>

        {/* Hero Header Card - Unified CvSU Naic Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-2 sm:mb-6 w-full">
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
                <h1 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate leading-tight">
                  <span className="hidden sm:inline">NSTP Activity Calendar</span>
                  <span className="sm:hidden">Activity Calendar</span>
                </h1>
                <p className="text-emerald-200 text-[10px] sm:text-xs lg:text-sm font-medium truncate mt-0.5">
                  <span className="hidden sm:inline">{isAdmin ? 'Schedule & organize campus events' : 'View official NSTP activities'}</span>
                  <span className="sm:hidden">{isAdmin ? 'Schedule events' : 'NSTP Activities'}</span>
                </p>
              </div>
            </div>
            {isAdmin && (
              <button type="button"
                onClick={() => setShowAddEventModal(true)}
                className="flex items-center space-x-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-[11px] sm:text-sm cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-950" />
                <span>Add Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Calendar Component — fills remaining viewport height */}
        <div className="flex-1 bg-white rounded-xl shadow-md p-2 sm:p-3 lg:p-5 flex flex-col overflow-hidden min-h-0">
          <div className="flex-shrink-0 flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-1">
              <button type="button"
                
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button"
                
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 min-h-0"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'auto repeat(6, 1fr)', gap: '3px' }}
          >
            {[
              { full: 'Sun', short: 'S' },
              { full: 'Mon', short: 'M' },
              { full: 'Tue', short: 'T' },
              { full: 'Wed', short: 'W' },
              { full: 'Thu', short: 'T' },
              { full: 'Fri', short: 'F' },
              { full: 'Sat', short: 'S' },
            ].map(day => (
              <div key={day.full} className="text-center font-medium text-gray-500 text-xs py-1">
                <span className="sm:hidden">{day.short}</span>
                <span className="hidden sm:inline">{day.full}</span>
              </div>
            ))}

            {getDaysInMonth(currentDate).map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day === new Date().getDate() &&
                             currentDate.getMonth() === new Date().getMonth() &&
                             currentDate.getFullYear() === new Date().getFullYear();
              const past = isPastDay(day);

              return (
                <div
                  key={index}
                  className={`p-1 sm:p-1.5 border rounded transition-colors overflow-hidden ${
                    !day ? 'border-transparent' : past ? 'bg-gray-100/80 border-gray-200 hover:bg-emerald-50/50 cursor-pointer opacity-80' : 'hover:bg-gray-50 cursor-pointer border-gray-200'
                  } ${isToday ? '!bg-blue-50 !border-blue-300' : ''}`}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-semibold mb-0.5 flex items-center justify-between ${isToday ? 'text-blue-600' : past ? 'text-gray-500' : 'text-gray-700'}`}>
                        <span>{day}</span>
                        {past && dayEvents.length > 0 && (
                          <span className="text-[9px] text-gray-400 font-normal">Past</span>
                        )}
                      </div>
                      <div className="space-y-0.5 hidden sm:block">
                        {dayEvents.slice(0, 2).map((event, idx) => (
                          <div
                            key={idx}
                            className={`text-[10px] px-1 py-0.5 rounded truncate ${
                              event.type === 'holiday'
                                ? 'bg-red-100 text-red-700'
                                : past
                                  ? 'bg-gray-200/90 text-gray-700 border border-gray-300/60'
                                  : 'bg-green-100 text-green-700'
                            }`}
                            title={`${event.title}${past ? ' (Past Event - Read Only)' : ''}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-gray-400">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="sm:hidden mt-0.5 flex flex-wrap gap-0.5">
                          {dayEvents.slice(0, 2).map((event, idx) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full inline-block ${
                                event.type === 'holiday' ? 'bg-red-400' : past ? 'bg-gray-400' : 'bg-green-400'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Day Events Modal */}
        {selectedDate && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setSelectedDate(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Read-Only Notice Banner for Past Days */}
              {isPastDay(selectedDate) && (
                <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-[11px] font-bold text-amber-900 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Past Event Record (Read-Only)
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase font-black">View Only</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(/\d+,/, `${selectedDate},`)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {getEventsForDate(selectedDate).length === 0
                      ? 'No scheduled events on this day'
                      : `${getEventsForDate(selectedDate).length} event${getEventsForDate(selectedDate).length !== 1 ? 's' : ''} listed`}
                  </p>
                </div>
                <button type="button"
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Event list */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-400 text-xs font-semibold text-center py-8">No events recorded for this date.</p>
                ) : (
                  getEventsForDate(selectedDate).map((event, idx) => (
                    <div key={idx} className={`p-3.5 rounded-2xl border transition-all ${
                      event.type === 'holiday'
                        ? 'bg-red-50/60 border-red-200/80'
                        : isPastDay(selectedDate)
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-emerald-50/60 border-emerald-200/80'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                            event.type === 'holiday' ? 'bg-red-500' : isPastDay(selectedDate) ? 'bg-gray-400' : 'bg-emerald-600'
                          }`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-black text-gray-900">{event.title}</p>
                              {event.isEdited && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                  ✏️ Edited
                                </span>
                              )}
                              {isPastDay(selectedDate) && (
                                <span className="text-[9px] bg-gray-200 text-gray-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Past</span>
                              )}
                              {event.type === 'holiday' && (
                                <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Official Holiday</span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-line font-medium leading-relaxed">{event.description}</p>
                            )}
                            {event.createdBy && (
                              <p className="text-[11px] text-gray-400 font-semibold mt-1.5">Organized by {event.createdBy}</p>
                            )}
                          </div>
                        </div>

                        {/* Allow edit & delete ONLY if event is NOT in the past */}
                        {event.createdBy && isAdmin && !isPastDay(selectedDate) && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button"
                              onClick={() => openEditEventModal(event)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                              title="Edit event"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button type="button"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                              title="Delete event"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/80 shrink-0">
                {isPastDay(selectedDate) ? (
                  <p className="text-xs text-gray-500 font-medium text-center flex items-center justify-center gap-1.5 py-1">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Past events are locked for record-keeping and cannot be modified or deleted.</span>
                  </p>
                ) : (
                  isAdmin && (
                    <button type="button"
                      onClick={() => {
                        const pad = (n) => String(n).padStart(2, '0');
                        const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(selectedDate)}`;
                        setEditingEvent(null);
                        setNewEvent({ title: '', date: dateStr, description: '' });
                        setSelectedDate(null);
                        setShowAddEventModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Event for this Day
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Event Modal */}
        {showAddEventModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => { setShowAddEventModal(false); setEditingEvent(null); }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-emerald-100/80 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {editingEvent ? 'Edit Calendar Event' : 'Add New Event'}
                    </h3>
                    <p className="text-emerald-200 text-xs font-medium">
                      {editingEvent ? 'Update scheduled activity details (will show Edited badge)' : 'Schedule activity or announcement'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddEventModal(false); setEditingEvent(null); }}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Event Title *</label>
                  <input
                    type="text"
                    id="event-title"
                    name="eventTitle"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                    placeholder="Enter event title..."
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Scheduled Date *</label>
                  <input
                    type="date"
                    id="event-date"
                    name="eventDate"
                    value={newEvent.date}
                    min={todayStr}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Description <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    id="event-description"
                    name="eventDescription"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    rows={3}
                    autoComplete="off"
                    placeholder="Add details, instructions or notes about this event..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none resize-none font-medium"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddEventModal(false); setEditingEvent(null); }}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  disabled={!newEvent.title.trim() || !newEvent.date}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingEvent ? 'Update Event' : 'Add Event'}
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
