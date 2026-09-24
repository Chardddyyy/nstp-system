import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AuthContext } from './context/AuthContext';
import { authAPI, usersAPI, studentsAPI, reportsAPI, conversationsAPI, enrollmentsAPI, archivesAPI, callsAPI, calendarAPI, clearBatch, pingTelemetry, getPersistentVisitorId, DEFAULT_PAST_BATCHES } from './services/api';
import { initSocket, disconnectSocket } from './services/socket';

// Direct Page Imports for Guaranteed 0-404 Deployments across all devices
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentManagement from './pages/StudentManagement';
import Reports from './pages/Reports';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import Enrollment from './pages/Enrollment';
import LetterFormats from './pages/LetterFormats';
import DigitalIdViewer from './pages/DigitalIdViewer';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

const BASE_PATH = (() => {
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/nstp-system')) return '/nstp-system';
  const envBase = import.meta.env.BASE_URL || '/';
  return envBase === '/' ? '' : envBase.replace(/\/$/, '');
})();

const BASE_URL_WITH_SLASH = BASE_PATH ? (BASE_PATH.endsWith('/') ? BASE_PATH : BASE_PATH + '/') : '/';

// Auto-normalize GitHub Pages hash routes or direct ID query links before router starts
(() => {
  try {
    const l = window.location;
    const hash = l.hash || '';
    if (hash.startsWith('#/digital-id') || hash.startsWith('#/id-card') || hash.startsWith('#/enrollment') || hash.startsWith('#/login')) {
      const hashContent = hash.slice(2);
      const [routePart, queryPart] = hashContent.split('?');
      const target = `${BASE_URL_WITH_SLASH}${routePart}${queryPart ? '?' + queryPart : ''}`;
      window.history.replaceState(null, null, target);
    } else if (l.search && (l.search.includes('view=digital-id') || l.search.includes('page=digital-id') || (l.search.includes('id=') && (l.search.includes('dept=') || l.search.includes('download='))))) {
      if (!l.pathname.includes('/digital-id')) {
        const cleanSearch = l.search.replace('view=digital-id&', '').replace('page=digital-id&', '');
        window.history.replaceState(null, null, `${BASE_URL_WITH_SLASH}digital-id${cleanSearch}`);
      }
    }
  } catch (_) {}
})();

// Defined OUTSIDE App so its reference never changes between re-renders, preventing
// React from unmounting+remounting page children on every polling tick.
function ProtectedRoute({ children, allowedRoles }) {
  const { loading, user } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'} replace />;
  }
  return children;
}

const POLL_INTERVAL_MS = 8000;

function safeSetStorage(key, value) {
  try {
    if (key === 'nstp_cached_messages' && value && typeof value === 'object') {
      const sanitized = {};
      for (const convId in value) {
        if (Array.isArray(value[convId])) {
          sanitized[convId] = value[convId].slice(-30).map(msg => {
            const copy = { ...msg };
            if (copy.imageUrl?.startsWith('data:')) copy.imageUrl = null;
            if (copy.image_url?.startsWith('data:')) copy.image_url = null;
            if (copy.file_url?.startsWith('data:')) copy.file_url = null;
            return copy;
          });
        }
      }
      localStorage.setItem(key, JSON.stringify(sanitized));
    } else {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`[Storage] Storage quota exceeded for ${key}, skipping local cache:`, e);
  }
}

function getNotificationStorageKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const role = userOrRole.role || 'user';
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_notifications_${role}${uid}`;
  }
  const role = userOrRole || 'admin';
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_notifications_${role}${uid}`;
}

function getDismissedStorageKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const role = userOrRole.role || 'user';
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_dismissed_notifications_${role}${uid}`;
  }
  const role = userOrRole || 'admin';
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_dismissed_notifications_${role}${uid}`;
}

function getSeenEntitiesStorageKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const role = userOrRole.role || 'user';
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_seen_entities_${role}${uid}`;
  }
  const role = userOrRole || 'admin';
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_seen_entities_${role}${uid}`;
}

function GlobalKeyboardManager() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleToggle = () => setShowShortcuts(prev => !prev);
    window.addEventListener('nstp:toggle-shortcuts', handleToggle);
    return () => window.removeEventListener('nstp:toggle-shortcuts', handleToggle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle shortcuts guide: Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Context Guard: If focused in an input, textarea, select, or contentEditable, do not trigger single-key shortcuts
      const activeTag = document.activeElement?.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' || document.activeElement?.isContentEditable;

      // Question mark '?' when not typing
      if (!isInput && e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Quick Search Focus: Ctrl+K / Cmd+K or '/' when not typing
      if (((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) || (!isInput && e.key === '/')) {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search" i], input[type="search"], input[placeholder*="search" i], input[name*="search" i]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select?.();
        }
        return;
      }

      // Navigation hotkeys with Alt modifier (only when logged in)
      if (user && e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          e.preventDefault();
          navigate(user.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard');
        } else if (key === 's') {
          e.preventDefault();
          navigate('/students');
        } else if (key === 'r') {
          e.preventDefault();
          navigate('/reports');
        } else if (key === 'c') {
          e.preventDefault();
          navigate('/chat');
        } else if (key === 'l') {
          e.preventDefault();
          navigate('/calendar');
        } else if (key === 'f' && user.role === 'admin') {
          e.preventDefault();
          navigate('/letter-formats');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, navigate]);

  return (
    <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('nstp_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [users, setUsers] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_all_users') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [
      { id: 1, name: 'NSTP Administrator', email: 'admin@gmail.com', role: 'admin', department: 'NSTP Office', avatar: 'avatar-4' },
      { id: 2, name: 'CWTS Instructor', email: 'cwts@gmail.com', role: 'instructor', department: 'CWTS', avatar: 'avatar-2' },
      { id: 3, name: 'LTS Instructor', email: 'lts@gmail.com', role: 'instructor', department: 'LTS', avatar: 'avatar-6' },
      { id: 4, name: 'ROTC Instructor', email: 'rotc@gmail.com', role: 'instructor', department: 'ROTC', avatar: 'avatar-8' },
    ];
  });
  const [students, setStudents] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
  const [pendingEnrollments, setPendingEnrollments] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_enrollments') || '[]');
      if (Array.isArray(cached)) return cached.filter(e => e.status === 'Pending');
    } catch {}
    return [];
  });
  const [reports, setReports] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_reports') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
  const [conversations, setConversations] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_conversations') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [
      {
        id: 'group-all-instructors',
        isGroup: true,
        is_group: 1,
        groupName: 'All Instructors',
        group_name: 'All Instructors',
        with: 'All Instructors',
        participants: [1, 2, 3, 4],
        last_message: 'Thank you everyone. Please keep student attendance and grade submissions updated.',
        last_message_time: new Date().toISOString()
      },
      {
        id: '1-2',
        isGroup: false,
        is_group: 0,
        participant_1_id: 1,
        participant_2_id: 2,
        with: 'CWTS Instructor',
        partnerName: 'CWTS Instructor',
        partnerId: 2,
        last_message: 'Good day Sir! All immersion sites in Naic have been coordinated with the barangay chairpersons.',
        last_message_time: new Date().toISOString()
      },
      {
        id: '1-3',
        isGroup: false,
        is_group: 0,
        participant_1_id: 1,
        participant_2_id: 3,
        with: 'LTS Instructor',
        partnerName: 'LTS Instructor',
        partnerId: 3,
        last_message: 'Everything is set for the Saturday assessment workshop, Sir. Materials are prepared.',
        last_message_time: new Date().toISOString()
      },
      {
        id: '1-4',
        isGroup: false,
        is_group: 0,
        participant_1_id: 1,
        participant_2_id: 4,
        with: 'ROTC Instructor',
        partnerName: 'ROTC Instructor',
        partnerId: 4,
        last_message: 'Confirmed, Sir. The cadet officers and cadre instructors are ready on the parade grounds.',
        last_message_time: new Date().toISOString()
      }
    ];
  });
  const [messages, setMessages] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_messages') || '{}');
      if (cached && typeof cached === 'object') return cached;
    } catch {}
    return {};
  });
  const [archivedYears, setArchivedYears] = useState(() => {
    try {
      localStorage.removeItem('nstp_cached_archives');
      localStorage.removeItem('nstp_cached_archives_v5');
      const cached = JSON.parse(localStorage.getItem('nstp_cached_archives_v6') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        const hasCounts = cached.every(a => a.cwts != null || a.lts != null || a.rotc != null || (a.data?.cwts != null));
        if (!hasCounts) {
          localStorage.removeItem('nstp_cached_archives_v6');
          return DEFAULT_PAST_BATCHES;
        }
        return cached;
      }
      return DEFAULT_PAST_BATCHES;
    } catch {
      return DEFAULT_PAST_BATCHES;
    }
  });

  // Live Auto-Update & Auto-Restart Detection (Brave Mobile Cache Buster)
  useEffect(() => {
    // Sanitize any stale dummy grades from previous local sessions
    try {
      const rawGrades = localStorage.getItem('nstp_cached_grades');
      if (rawGrades && rawGrades.includes('202310496')) {
        const parsed = JSON.parse(rawGrades);
        const cleaned = parsed.filter(g => String(g.studentId || g.student_id) !== '202310496' && Number(g.student_id) !== 41);
        localStorage.setItem('nstp_cached_grades', JSON.stringify(cleaned));
      }
    } catch (_) {}

    let currentVersion = localStorage.getItem('nstp_app_version') || null;
    const getVUrl = () => `${BASE_URL_WITH_SLASH}version.json?t=${Date.now()}`;

    const checkVersion = () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      fetch(getVUrl(), { 
        cache: 'no-store', 
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } 
      })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data?.version) {
            if (!currentVersion) {
              currentVersion = data.version;
              localStorage.setItem('nstp_app_version', data.version);
            } else if (data.version !== currentVersion) {
              console.log('⚡ New system update detected:', data.version, 'Purging cache & restarting...');
              localStorage.setItem('nstp_app_version', data.version);
              
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }

              // Purge stale application caches on new release
              try {
                Object.keys(localStorage).forEach(k => {
                  if (k.startsWith('nstp_cached_')) {
                    localStorage.removeItem(k);
                  }
                });
              } catch (_) {}

              const banner = document.createElement('div');
              banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#059669;color:#fff;text-align:center;padding:12px 16px;font-weight:bold;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
              banner.textContent = '⚡ System Update Deployed! Auto-restarting webpage...';
              document.body.appendChild(banner);

              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }
        })
        .catch(() => {});
    };

    checkVersion();
    const checkInterval = setInterval(checkVersion, 30000);
    return () => clearInterval(checkInterval);
  }, []);
  const [currentBatch, setCurrentBatch] = useState('2026-2027 1st Semester');

  // Desktop Display Zoom Scale (25% zoom out = 75% crisp scale)
  const [displayZoom, setDisplayZoomState] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_display_zoom');
      if (saved && saved !== '78%' && saved !== '100%') return saved;
      return '75%';
    } catch (_) {
      return '75%';
    }
  });

  const setDisplayZoom = useCallback((newZoom) => {
    const clean = String(newZoom || '75%').trim();
    setDisplayZoomState(clean);
    try {
      localStorage.setItem('nstp_display_zoom', clean);
      const numeric = clean.includes('%') ? String(parseFloat(clean) / 100) : clean;
      document.documentElement.style.setProperty('--app-zoom', numeric);
      if (typeof window !== 'undefined') {
        document.documentElement.style.zoom = '';
        if (window.innerWidth >= 768) {
          document.body.style.zoom = numeric;
        } else {
          document.body.style.zoom = '0.90';
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const zoomVal = displayZoom || '75%';
      const numeric = zoomVal.includes('%') ? String(parseFloat(zoomVal) / 100) : zoomVal;
      document.documentElement.style.setProperty('--app-zoom', numeric);
      // Ensure html has no conflicting zoom rule
      document.documentElement.style.zoom = '';
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 768) {
          document.body.style.zoom = numeric;
        } else {
          document.body.style.zoom = '0.90';
        }
      }
    } catch (_) {}
  }, [displayZoom]);

  // Active Batch Calendar & Academic Semester Coverage Range
  const [currentBatchRange, setCurrentBatchRangeState] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_active_batch_range');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      startMonth: '2026-08',
      endMonth: '2026-12',
      startDate: '2026-08-01',
      endDate: '2026-12-31'
    };
  });

  const updateActiveBatchRange = useCallback((rangeObj) => {
    if (!rangeObj) return;
    const startM = rangeObj.startMonth || rangeObj.start_month || '2026-08';
    const endM = rangeObj.endMonth || rangeObj.end_month || '2026-12';
    const startD = rangeObj.startDate || rangeObj.start_date || `${startM}-01`;
    const endD = rangeObj.endDate || rangeObj.end_date || `${endM}-30`;
    const normalized = {
      startMonth: startM,
      endMonth: endM,
      startDate: startD,
      endDate: endD
    };
    setCurrentBatchRangeState(normalized);
    try {
      localStorage.setItem('nstp_active_batch_range', JSON.stringify(normalized));
    } catch (_) {}
  }, []);

  const [viewingArchive, setViewingArchiveState] = useState(() => {
    try {
      return localStorage.getItem('nstp_viewing_archive') === 'true';
    } catch {
      return false;
    }
  });
  const [archiveViewData, setArchiveViewDataState] = useState(() => {
    try {
      localStorage.removeItem('nstp_archive_view_data');
      localStorage.removeItem('nstp_archive_view_data_v5');
      const saved = localStorage.getItem('nstp_archive_view_data_v6');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setViewingArchive = useCallback((val) => {
    setViewingArchiveState(Boolean(val));
    try {
      if (val) {
        localStorage.setItem('nstp_viewing_archive', 'true');
      } else {
        localStorage.removeItem('nstp_viewing_archive');
      }
    } catch {}
  }, []);

  const setArchiveViewData = useCallback((data) => {
    setArchiveViewDataState(data);
    try {
      if (data) {
        localStorage.setItem('nstp_archive_view_data_v6', JSON.stringify(data));
      } else {
        localStorage.removeItem('nstp_archive_view_data_v6');
        localStorage.removeItem('nstp_archive_view_data_v5');
        localStorage.removeItem('nstp_archive_view_data');
      }
    } catch {}
  }, []);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [pendingAnsweredCall, setPendingAnsweredCall] = useState(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState(null);
  const outgoingCallIdRef = useRef(null);
  const handledCallIdsRef = useRef(new Set());

  const baselineReady = useRef(false);
  const seenEnrollmentIds = useRef(new Set());
  const seenSubmissionKeys = useRef(new Set());
  const seenReportIds = useRef(new Set());
  const seenReportVersions = useRef({});
  const seenReportReminders = useRef(new Set());
  const seenStudentIds = useRef(new Set());
  const seenConvLastMessageTime = useRef({});
  const seenEventIds = useRef(new Set());
  const seenEventVersions = useRef({});
  const seenEventReminders = useRef(new Set());
  const seenLetterIds = useRef(new Set());
  const seenFacultyUserIds = useRef(new Set());

  // Global Realtime Telemetry Heartbeat Ping
  useEffect(() => {
    let sid = sessionStorage.getItem('nstp_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem('nstp_session_id', sid);
    }

    let vid = getPersistentVisitorId();

    const sendPing = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      pingTelemetry({
        sessionId: sid,
        visitorId: vid,
        deviceId: vid,
        user: user ? {
          name: user.name,
          role: user.role,
          email: user.email,
          program: user.program || user.department,
          avatar: user.avatar
        } : null,
        page: window.location.pathname
      });
    };

    sendPing();
    const interval = setInterval(sendPing, 25000);
    return () => clearInterval(interval);
  }, [user]);

  const pushNotification = useCallback((notif) => {
    if (!notif) return;
    const notifKey = notif.id || notif.key || (
      notif.enrollmentId ? `enrollment-${notif.enrollmentId}` :
      notif.reportId ? `report-${notif.reportId}` :
      notif.conversationId ? `conv-${notif.conversationId}` :
      `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    );

    // Check if user previously dismissed or deleted this notification/entity
    if (user) {
      try {
        const dismissKey = getDismissedStorageKey(user);
        const dismissed = new Set(JSON.parse(localStorage.getItem(dismissKey) || '[]').map(String));
        if (
          dismissed.has(String(notifKey)) ||
          (notif.enrollmentId && dismissed.has(`enrollment-${notif.enrollmentId}`)) ||
          (notif.reportId && dismissed.has(`report-${notif.reportId}`)) ||
          (notif.conversationId && dismissed.has(`conv-${notif.conversationId}`))
        ) {
          return; // Previously dismissed by user; never recreate
        }
      } catch {}
    }

    const item = {
      id: notifKey,
      time: notif.time || 'Just now',
      read: false,
      title: notif.title,
      message: notif.message,
      type: notif.type || 'system',
      link: notif.link || '#',
      enrollmentId: notif.enrollmentId || null,
      studentName: notif.studentName || null,
      reportId: notif.reportId || null,
      reportTitle: notif.reportTitle || null,
      conversationId: notif.conversationId || null,
      senderName: notif.senderName || null,
    };

    setNotifications(prev => {
      // Prevent duplicate notification for same entity key
      if (prev.some(n => String(n.id) === String(notifKey))) return prev;
      return [item, ...prev].slice(0, 50);
    });

    if (typeof Notification !== 'undefined') {
      const showDeviceAlert = () => {
        const notificationOptions = {
          body: item.message,
          icon: `${import.meta.env.BASE_URL}icons/icon-192x192.png`,
          badge: `${import.meta.env.BASE_URL}icons/icon-192x192.png`,
          tag: String(item.id),
          data: { link: item.link || '/' },
        };

        if ('serviceWorker' in navigator) {
          Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
          ])
            .then(reg => reg.showNotification(item.title, notificationOptions))
            .catch(() => {
              try { new Notification(item.title, notificationOptions); } catch (_) {}
            });
        } else {
          try { new Notification(item.title, notificationOptions); } catch (_) {}
        }
      };

      if (Notification.permission === 'granted') {
        showDeviceAlert();
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') showDeviceAlert();
        }).catch(() => {});
      }
    }
  }, [user]);

  // Expose device notification tester function on window for device diagnostics
  useEffect(() => {
    window.testDeviceNotification = (title = 'NSTP System Notification', message = 'Device push notifications are working properly on your device!') => {
      pushNotification({
        title,
        message,
        type: 'system',
        link: '/admin/dashboard'
      });
      return 'Test notification triggered!';
    };
  }, [pushNotification]);

  const deleteNotifications = useCallback((idsToDelete) => {
    const idSet = new Set((Array.isArray(idsToDelete) ? idsToDelete : [idsToDelete]).map(String));
    
    // Save to persistent dismissed registry for this user
    if (user) {
      const dismissKey = getDismissedStorageKey(user);
      try {
        const existing = JSON.parse(localStorage.getItem(dismissKey) || '[]');
        const dismissed = new Set(existing.map(String));
        notifications.forEach(n => {
          if (idSet.has(String(n.id))) {
            dismissed.add(String(n.id));
            if (n.enrollmentId) dismissed.add(`enrollment-${n.enrollmentId}`);
            if (n.reportId) dismissed.add(`report-${n.reportId}`);
            if (n.conversationId) dismissed.add(`conv-${n.conversationId}`);
          }
        });
        idSet.forEach(id => dismissed.add(String(id)));
        safeSetStorage(dismissKey, Array.from(dismissed).slice(-500));
      } catch {}
    }

    setNotifications(prev => (prev || []).filter(n => !idSet.has(String(n.id))));
  }, [user, notifications]);

  const markAllNotificationsRead = useCallback((idsToMark = null) => {
    setNotifications(prev => {
      if (Array.isArray(idsToMark) && idsToMark.length > 0) {
        const idSet = new Set(idsToMark.map(String));
        return (prev || []).map(n => idSet.has(String(n.id)) ? { ...n, read: true } : n);
      }
      return (prev || []).map(n => ({ ...n, read: true }));
    });
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const showToast = useCallback((message, type = 'info', title = null) => {
    const defaultTitle = type === 'success' ? 'Success' : type === 'error' ? 'Notice' : type === 'warning' ? 'Warning' : 'Information';
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toastItem = {
      id: toastId,
      title: title || defaultTitle,
      message: typeof message === 'string' ? message : (message?.message || 'Operation notification'),
      type
    };

    setToasts(prev => [toastItem, ...prev].slice(0, 3));

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);
  }, []);

  // ── Real-Time WebSockets (Socket.io) Instant Dispatcher ────────────────────
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = initSocket();
    if (!socket) return;

    // 1. Instant Real-time Chat Messages (0ms latency without waiting for 8s polling)
    const handleChatMessage = (payload) => {
      if (!payload || !payload.conversationId || !payload.message) return;
      const { conversationId, message } = payload;
      setMessages(prev => {
        const existing = prev[conversationId] || [];
        if (existing.some(m => m.id === message.id)) return prev;
        return {
          ...prev,
          [conversationId]: [...existing, message]
        };
      });
      window.dispatchEvent(new CustomEvent('nstp_socket_chat_message', { detail: payload }));

      // Dispatch instant device notification if message is from another person
      const isOwnMessage = (message.senderId === user.id) || (message.sender_id === user.id);
      if (!isOwnMessage) {
        const senderName = message.senderName || message.sender_name || 'Someone';
        let preview = message.text || message.message || '';
        if (preview.startsWith('data:')) preview = 'Sent an attachment';
        else if (preview.startsWith('📸')) preview = 'Sent a photo';
        else if (preview.startsWith('🎤')) preview = 'Sent a voice message';
        else if (preview.startsWith('📎')) preview = 'Sent a file';
        if (preview.length > 80) preview = preview.slice(0, 80) + '…';

        pushNotification({
          id: `msg-${message.id || Date.now()}`,
          title: `New Message from ${senderName}`,
          message: preview || 'Sent you a message',
          type: 'message',
          link: '/chat',
          conversationId,
          senderName
        });
      }
    };

    // 2. Instant Attendance Scanned Sync
    const handleAttendanceScanned = (payload) => {
      window.dispatchEvent(new CustomEvent('nstp_attendance_updated', { detail: payload }));
      if (user.role === 'admin' || (payload.student && payload.student.department === user.department)) {
        pushNotification({
          title: 'Live Attendance Logged',
          message: `${payload.student?.name || payload.studentId || 'A student'} logged attendance (${payload.record?.activity_name || 'NSTP Session'})`,
          type: 'attendance',
          link: '/students'
        });
      }
    };

    // 3. Instant New Enrollment Notification (Admin)
    const handleNewEnrollment = (payload) => {
      if (user.role === 'admin' && payload?.enrollment) {
        setPendingEnrollments(prev => [payload.enrollment, ...prev]);
        const enrollName = payload.enrollment.name || payload.enrollment.fullName || payload.enrollment.studentId || 'A student';
        pushNotification({
          title: 'New Online Enrollment',
          message: `${enrollName} submitted an enrollment application`,
          type: 'enrollment',
          link: '/admin/dashboard',
          enrollmentId: payload.enrollment.id,
          studentName: enrollName
        });
      }
    };

    // 4. Instant Incoming Call Alert
    const handleIncomingCall = (payload) => {
      if (payload?.call) {
        setIncomingCall(payload.call);
      }
    };

    const handleCallEnded = (payload) => {
      if (payload?.callId) {
        setIncomingCall(null);
        setOutgoingCallStatus(null);
      }
    };

    socket.on('chat:message', handleChatMessage);
    socket.on('attendance:scanned', handleAttendanceScanned);
    socket.on('enrollment:new', handleNewEnrollment);
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('chat:message', handleChatMessage);
      socket.off('attendance:scanned', handleAttendanceScanned);
      socket.off('enrollment:new', handleNewEnrollment);
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ended', handleCallEnded);
    };
  }, [user, pushNotification]);

  function resetRealtimeBaseline() {
    baselineReady.current = false;
    seenEnrollmentIds.current = new Set();
    seenSubmissionKeys.current = new Set();
    seenReportIds.current = new Set();
    seenReportVersions.current = {};
    seenReportReminders.current = new Set();
    seenStudentIds.current = new Set();
    seenConvLastMessageTime.current = {};
    seenEventIds.current = new Set();
    seenEventVersions.current = {};
    seenEventReminders.current = new Set();
    seenLetterIds.current = new Set();
    seenFacultyUserIds.current = new Set();
  }

  function seedRealtimeBaseline(pending, reportsList, convList, studentsList, usersList, calendarList, lettersList, currentUser) {
    const safePending = Array.isArray(pending) ? pending : [];
    const safeStudents = Array.isArray(studentsList) ? studentsList : [];
    const safeReports = Array.isArray(reportsList) ? reportsList : [];
    const safeConvs = Array.isArray(convList) ? convList : [];
    const safeUsers = Array.isArray(usersList) ? usersList : [];
    const safeEvents = Array.isArray(calendarList) ? calendarList : [];
    const safeLetters = Array.isArray(lettersList) ? lettersList : [];

    safePending.forEach(e => { if (e && e.id) seenEnrollmentIds.current.add(e.id); });
    safeStudents.forEach(s => { if (s && s.id) seenStudentIds.current.add(s.id); });

    safeReports.forEach(report => {
      if (!report || !report.id) return;
      seenReportIds.current.add(report.id);
      seenReportVersions.current[report.id] = `${report.title || ''}__${report.deadline || ''}__${report.description || ''}__${report.updated_at || ''}`;
      (Array.isArray(report.submissions) ? report.submissions : []).forEach(sub => {
        if (sub) seenSubmissionKeys.current.add(`${report.id}-${sub.instructor_id}-${sub.id}`);
      });
    });

    safeConvs.forEach(conv => {
      if (conv && conv.id && conv.last_message_time) {
        seenConvLastMessageTime.current[conv.id] = String(conv.last_message_time);
      }
    });

    safeUsers.forEach(u => {
      if (u && u.id && (u.role === 'instructor' || u.role === 'admin')) {
        seenFacultyUserIds.current.add(u.id);
      }
    });

    safeEvents.forEach(ev => {
      if (ev && ev.id) {
        seenEventIds.current.add(ev.id);
        seenEventVersions.current[ev.id] = `${ev.title || ''}__${ev.date || ''}__${ev.time || ''}__${ev.location || ''}`;
      }
    });

    safeLetters.forEach(l => {
      if (l && l.id) seenLetterIds.current.add(l.id);
    });

    // Persist seen IDs to storage so next login doesn't duplicate existing records
    if (currentUser) {
      try {
        const seenPayload = {
          enrollments: Array.from(seenEnrollmentIds.current).slice(-500),
          submissions: Array.from(seenSubmissionKeys.current).slice(-500),
          reports: Array.from(seenReportIds.current).slice(-500),
          students: Array.from(seenStudentIds.current).slice(-500)
        };
        safeSetStorage(getSeenEntitiesStorageKey(currentUser), seenPayload);
      } catch {}
    }

    baselineReady.current = true;
  }

  function detectRealtimeChanges(pending, reportsList, convList, studentsList, usersList, calendarList, lettersList, currentUser) {
    if (!baselineReady.current || !currentUser) return;

    const safePending = Array.isArray(pending) ? pending : [];
    const safeStudents = Array.isArray(studentsList) ? studentsList : [];
    const safeReports = Array.isArray(reportsList) ? reportsList : [];
    const safeUsers = Array.isArray(usersList) ? usersList : [];
    const safeEvents = Array.isArray(calendarList) ? calendarList : [];
    const safeLetters = Array.isArray(lettersList) ? lettersList : [];

    // Load dismissed keys to ensure dismissed notifications are never recreated
    let dismissedSet = new Set();
    try {
      const dismissKey = getDismissedStorageKey(currentUser);
      dismissedSet = new Set(JSON.parse(localStorage.getItem(dismissKey) || '[]').map(String));
    } catch {}

    let newlySeen = false;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // ── 1. Admin Specific Notifications ─────────────────────────────────────
    if (currentUser.role === 'admin') {
      // New Pending Enrollments
      safePending.forEach(enrollment => {
        if (!enrollment || !enrollment.id) return;
        const eKey = `enrollment-${enrollment.id}`;
        if (dismissedSet.has(String(enrollment.id)) || dismissedSet.has(eKey)) {
          seenEnrollmentIds.current.add(enrollment.id);
          return;
        }
        if (!seenEnrollmentIds.current.has(enrollment.id)) {
          seenEnrollmentIds.current.add(enrollment.id);
          newlySeen = true;
          const enrollName = enrollment.student_name || enrollment.fullName || enrollment.firstName || 'A student';
          pushNotification({
            id: eKey,
            title: 'New Enrollment Application',
            message: `${enrollName} submitted an enrollment application (${enrollment.department || 'NSTP'})`,
            type: 'enrollment',
            link: '/admin/dashboard',
            enrollmentId: enrollment.id,
            studentName: enrollName
          });
        }
      });

      // New Report Submissions by Instructors
      safeReports.forEach(report => {
        if (!report) return;
        (Array.isArray(report.submissions) ? report.submissions : []).forEach(sub => {
          if (!sub) return;
          const subKey = `${report.id}-${sub.instructor_id}-${sub.id}`;
          if (dismissedSet.has(subKey) || dismissedSet.has(`report-${report.id}`)) {
            seenSubmissionKeys.current.add(subKey);
            return;
          }
          if (!seenSubmissionKeys.current.has(subKey)) {
            seenSubmissionKeys.current.add(subKey);
            newlySeen = true;
            pushNotification({
              id: `submission-${subKey}`,
              title: 'New Report Submission',
              message: `Report "${report.title || 'Untitled'}" was submitted by ${sub.instructor || sub.department || 'an instructor'}`,
              type: 'report',
              link: '/reports',
              reportId: report.id,
              reportTitle: report.title
            });
          }
        });
      });
    }

    // ── 2. Instructor Specific Notifications ─────────────────────────────────
    if (currentUser.role === 'instructor') {
      // Check for newly approved/enrolled students assigned to this instructor's department
      safeStudents.forEach(student => {
        if (!student || !student.id) return;
        const sKey = `student-${student.id}`;
        if (dismissedSet.has(String(student.id)) || dismissedSet.has(sKey)) {
          seenStudentIds.current.add(student.id);
          return;
        }
        if (!seenStudentIds.current.has(student.id)) {
          seenStudentIds.current.add(student.id);
          newlySeen = true;
          const studentDept = student.department || student.nstp_component || '';
          if (studentDept === currentUser.department) {
            const studentName = student.name || student.student_name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'New Student';
            pushNotification({
              id: sKey,
              title: `New ${currentUser.department} Student Enrolled`,
              message: `${studentName} was assigned to ${currentUser.department} class roster`,
              type: 'student',
              link: '/students',
              studentName
            });
          }
        }
      });
    }

    // ── 3. Reports Notifications (New, Edited, 1-Day Deadline Reminder) ────────
    safeReports.forEach(report => {
      if (!report || !report.id) return;
      const isTargetDept = report.department === 'All' || report.department === currentUser.department || currentUser.role === 'admin';
      if (!isTargetDept) return;

      const rKey = `report-${report.id}`;
      if (dismissedSet.has(String(report.id)) || dismissedSet.has(rKey)) {
        seenReportIds.current.add(report.id);
        return;
      }

      const currentVer = `${report.title || ''}__${report.deadline || ''}__${report.description || ''}__${report.updated_at || ''}`;

      // A. New Report Assignment
      if (!seenReportIds.current.has(report.id)) {
        seenReportIds.current.add(report.id);
        seenReportVersions.current[report.id] = currentVer;
        newlySeen = true;
        pushNotification({
          id: rKey,
          title: report.department === 'All' ? 'New General Report Assignment' : `New ${report.department} Report Assignment`,
          message: `Admin assigned: "${report.title || 'Untitled'}" (${report.department === 'All' ? 'All Departments' : report.department})`,
          type: 'report',
          link: '/reports',
          reportId: report.id,
          reportTitle: report.title
        });
      } else {
        // B. Report Edited / Modified
        const prevVer = seenReportVersions.current[report.id];
        if (prevVer && prevVer !== currentVer) {
          seenReportVersions.current[report.id] = currentVer;
          pushNotification({
            id: `report-edit-${report.id}-${Date.now()}`,
            title: 'Report Updated',
            message: `Report "${report.title || 'Untitled'}" details or instructions were updated.`,
            type: 'report',
            link: '/reports',
            reportId: report.id,
            reportTitle: report.title
          });
        }
      }

      // C. 1-Day Before Deadline Reminder
      if (report.deadline) {
        const dStr = String(report.deadline).slice(0, 10);
        if (dStr === tomorrow) {
          const remindKey = `report-deadline-${report.id}-${dStr}`;
          if (!seenReportReminders.current.has(remindKey) && !dismissedSet.has(remindKey)) {
            seenReportReminders.current.add(remindKey);
            pushNotification({
              id: remindKey,
              title: 'Upcoming Report Deadline Tomorrow',
              message: `Reminder: Report "${report.title || 'Untitled'}" is due tomorrow (${dStr})!`,
              type: 'report',
              link: '/reports',
              reportId: report.id,
              reportTitle: report.title
            });
          }
        }
      }
    });

    // ── 4. Calendar Notifications (New, Edited, 1-Day Before Reminder) ─────────
    safeEvents.forEach(ev => {
      if (!ev || !ev.id) return;
      const evKey = `event-${ev.id}`;
      if (dismissedSet.has(String(ev.id)) || dismissedSet.has(evKey)) {
        seenEventIds.current.add(ev.id);
        return;
      }

      const evVer = `${ev.title || ''}__${ev.date || ''}__${ev.time || ''}__${ev.location || ''}`;

      // A. New Calendar Event
      if (!seenEventIds.current.has(ev.id)) {
        seenEventIds.current.add(ev.id);
        seenEventVersions.current[ev.id] = evVer;
        pushNotification({
          id: evKey,
          title: 'New Calendar Event Added',
          message: `"${ev.title || 'New Event'}" scheduled on ${ev.date || 'upcoming date'}.`,
          type: 'calendar',
          link: '/calendar'
        });
      } else {
        // B. Calendar Event Edited
        const prevVer = seenEventVersions.current[ev.id];
        if (prevVer && prevVer !== evVer) {
          seenEventVersions.current[ev.id] = evVer;
          pushNotification({
            id: `event-edit-${ev.id}-${Date.now()}`,
            title: 'Calendar Event Updated',
            message: `Event "${ev.title || 'Untitled'}" schedule or details have been updated.`,
            type: 'calendar',
            link: '/calendar'
          });
        }
      }

      // C. 1-Day Before Calendar Event Reminder
      if (ev.date) {
        const evDateStr = String(ev.date).slice(0, 10);
        if (evDateStr === tomorrow) {
          const remindKey = `event-remind-${ev.id}-${evDateStr}`;
          if (!seenEventReminders.current.has(remindKey) && !dismissedSet.has(remindKey)) {
            seenEventReminders.current.add(remindKey);
            pushNotification({
              id: remindKey,
              title: 'Upcoming Calendar Event Tomorrow',
              message: `Reminder: "${ev.title || 'Event'}" is happening tomorrow (${evDateStr})!`,
              type: 'calendar',
              link: '/calendar'
            });
          }
        }
      }
    });

    // ── 5. Format Letter Notifications (New Format Letter Added) ───────────────
    safeLetters.forEach(letter => {
      if (!letter || !letter.id) return;
      const lKey = `letter-${letter.id}`;
      if (!seenLetterIds.current.has(letter.id)) {
        seenLetterIds.current.add(letter.id);
        if (!dismissedSet.has(lKey)) {
          pushNotification({
            id: lKey,
            title: 'New Letter Format Available',
            message: `Official format template "${letter.title || 'New Letter'}" has been added.`,
            type: 'system',
            link: '/letter-formats'
          });
        }
      }
    });

    // ── 6. Faculty Notifications (New Instructor or Admin Added) ───────────────
    safeUsers.forEach(u => {
      if (!u || !u.id) return;
      if (u.id === currentUser.id) return;
      if (u.role === 'instructor' || u.role === 'admin') {
        const uKey = `user-${u.id}`;
        if (!seenFacultyUserIds.current.has(u.id)) {
          seenFacultyUserIds.current.add(u.id);
          if (!dismissedSet.has(uKey)) {
            const isInstructor = u.role === 'instructor';
            pushNotification({
              id: uKey,
              title: isInstructor ? 'New Instructor Registered' : 'New Administrator Added',
              message: `${u.name || 'New Faculty'} was registered as ${isInstructor ? (u.department || 'NSTP') + ' Instructor' : 'System Administrator'}.`,
              type: 'system',
              link: currentUser.role === 'admin' ? '/admin/dashboard' : '/chat'
            });
          }
        }
      }
    });

    if (newlySeen && currentUser) {
      try {
        const seenPayload = {
          enrollments: Array.from(seenEnrollmentIds.current).slice(-500),
          submissions: Array.from(seenSubmissionKeys.current).slice(-500),
          reports: Array.from(seenReportIds.current).slice(-500),
          students: Array.from(seenStudentIds.current).slice(-500)
        };
        safeSetStorage(getSeenEntitiesStorageKey(currentUser), seenPayload);
      } catch {}
    }
  }

  async function checkConversationMessages(convList, currentUser) {
    if (!baselineReady.current || !currentUser) return;
    const safeConvs = Array.isArray(convList) ? convList : [];

    for (const conv of safeConvs) {
      const currTime = conv.last_message_time ? String(conv.last_message_time) : null;
      const prevTime = seenConvLastMessageTime.current[conv.id];

      if (currTime && prevTime && currTime !== prevTime) {
        const lastMsg = conv.last_message || '';
        const isOwnMessage = conv.last_sender_id === currentUser.id;

        if (!isOwnMessage && lastMsg) {
          const senderName = conv.last_sender_name || conv.with || 'Someone';
          let preview = lastMsg.startsWith('data:') ? 'Sent a file'
            : lastMsg.startsWith('📸') ? 'Sent a photo'
            : lastMsg.startsWith('🎤') ? 'Sent a voice message'
            : lastMsg.startsWith('📎') ? 'Sent a file'
            : lastMsg;
          if (preview.length > 80) preview = preview.slice(0, 80) + '…';
          pushNotification({
            id: `msg-poll-${conv.id}-${currTime}`,
            title: 'New Message',
            message: `${senderName}: ${preview}`,
            type: 'message',
            link: '/chat',
            conversationId: conv.id,
            senderName
          });
        }

        try {
          const msgs = await conversationsAPI.getMessages(conv.id);
          if (msgs.length > 0) {
            const convId = conv.id;
            setMessages(prev => {
              const local = prev[convId] || [];
              const fetchedIds = new Set(msgs.map(m => String(m.id)));
              const cutoff = Date.now() - 10000;
              const localOnly = local.filter(m =>
                !fetchedIds.has(String(m.id)) &&
                new Date(m.created_at || 0).getTime() > cutoff
              );
              return { ...prev, [convId]: [...msgs, ...localOnly] };
            });
          }
        } catch {
          console.warn('Failed to refresh messages for conversation', conv.id);
        }
      }

      if (currTime) {
        seenConvLastMessageTime.current[conv.id] = currTime;
      }
    }
  }

  async function refreshLiveData() {
    if (!user || window.__nstp_session_expired__) return;
    try {
      const [reportsData, conversationsData, usersData, studentsData, eventsData] = await Promise.all([
        reportsAPI.getAll().catch(() => null),
        conversationsAPI.getAll().catch(() => null),
        usersAPI.getAll().catch(() => null),
        studentsAPI.getAll().catch(() => null),
        calendarAPI.getEvents().catch(() => null)
      ]);

      let lettersData = null;
      try {
        lettersData = JSON.parse(localStorage.getItem('nstp_letter_templates') || 'null');
      } catch {}

      if (reportsData && Array.isArray(reportsData)) setReports(reportsData);
      if (usersData && Array.isArray(usersData) && usersData.length > 0) {
        setUsers(usersData);
        safeSetStorage('nstp_cached_all_users', usersData);
      }
      if (studentsData && Array.isArray(studentsData)) {
        setStudents(studentsData);
      }

      if (conversationsData && Array.isArray(conversationsData)) {
        setConversations(conversationsData);
        safeSetStorage('nstp_cached_conversations', conversationsData);
      }

      let pending = pendingEnrollments;
      if (user.role === 'admin') {
        const enrollmentsData = await enrollmentsAPI.getAll().catch(() => null);
        if (enrollmentsData && Array.isArray(enrollmentsData)) {
          pending = enrollmentsData.filter(e => e.status === 'Pending');
          setPendingEnrollments(pending);
        }
      }

      const activeConvs = (conversationsData && Array.isArray(conversationsData)) ? conversationsData : conversations;
      const activeReports = (reportsData && Array.isArray(reportsData)) ? reportsData : reports;
      const activeStudents = (studentsData && Array.isArray(studentsData)) ? studentsData : students;
      const activeUsers = (usersData && Array.isArray(usersData)) ? usersData : users;
      const activeEvents = (eventsData && Array.isArray(eventsData)) ? eventsData : [];
      const activeLetters = (lettersData && Array.isArray(lettersData)) ? lettersData : [];

      if (!baselineReady.current) {
        seedRealtimeBaseline(pending, activeReports, activeConvs, activeStudents, activeUsers, activeEvents, activeLetters, user);
      } else {
        detectRealtimeChanges(pending, activeReports, activeConvs, activeStudents, activeUsers, activeEvents, activeLetters, user);
        await checkConversationMessages(activeConvs, user);
      }
    } catch (error) {
      console.warn('Live refresh failed:', error);
    }
  }

  const notificationsLoadedUserRef = useRef(null);

  // Load notifications from storage when user logs in
  useEffect(() => {
    if (!user) {
      notificationsLoadedUserRef.current = null;
      return;
    }
    const key = getNotificationStorageKey(user);
    const legacyKey = user.role === 'admin' ? 'nstp_admin_notifications' : 'nstp_instructor_notifications';
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    let loaded = [];
    try {
      loaded = saved ? JSON.parse(saved) : [];
    } catch {
      loaded = [];
    }
    setNotifications(Array.isArray(loaded) ? loaded : []);
    notificationsLoadedUserRef.current = user.id;

    // Load seen entity IDs from storage so existing items are never re-notified
    try {
      const seenData = JSON.parse(localStorage.getItem(getSeenEntitiesStorageKey(user)) || '{}');
      (seenData.enrollments || []).forEach(id => seenEnrollmentIds.current.add(id));
      (seenData.submissions || []).forEach(k => seenSubmissionKeys.current.add(k));
      (seenData.reports || []).forEach(id => seenReportIds.current.add(id));
      (seenData.students || []).forEach(id => seenStudentIds.current.add(id));
    } catch {}

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  // Persist notifications to storage ONLY AFTER they have been loaded for this active user
  useEffect(() => {
    if (!user || notificationsLoadedUserRef.current !== user.id) return;
    safeSetStorage(getNotificationStorageKey(user), notifications);
  }, [notifications, user]);

  // Real-time polling while logged in
  useEffect(() => {
    if (!user || loading) return;
    refreshLiveData();
    const interval = setInterval(refreshLiveData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);



  function registerOutgoingCall(callId) {
    outgoingCallIdRef.current = callId;
    setOutgoingCallStatus('ringing');
  }

  function clearOutgoingCall() {
    outgoingCallIdRef.current = null;
    setOutgoingCallStatus(null);
  }

  async function declineIncomingCall(callId) {
    if (callId) handledCallIdsRef.current.add(String(callId));
    setIncomingCall(null);
    try {
      await callsAPI.end(callId, 'declined');
    } catch (e) {
      console.warn('Decline call failed:', e);
    }
  }

  async function answerIncomingCall(call) {
    const targetId = (typeof call === 'object' && call !== null) ? call.id : call;
    if (targetId) handledCallIdsRef.current.add(String(targetId));
    
    // Immediately dismiss incoming call overlay & stop ringtone synchronously
    setIncomingCall(null);
    setPendingAnsweredCall(call);
    window.dispatchEvent(new CustomEvent('nstp-call-answered', { detail: call }));

    if (targetId) {
      try {
        await callsAPI.answer(targetId);
      } catch (e) {
        console.warn('Answer call warning:', e);
      }
    }
  }

  // Handle session expiry — api.js dispatches this event so React Router can
  // navigate to /login without a hard reload, preserving any open form state.
  useEffect(() => {
    function onSessionExpired(e) {
      window.__nstp_session_expired__ = true;
      localStorage.removeItem('nstp_token');
      localStorage.removeItem('nstp_cached_user');
      const banner = document.createElement('div');
      banner.id = 'session-expired-banner';
      banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
        'background:#b91c1c', 'color:#fff', 'text-align:center',
        'padding:14px 16px', 'font-size:14px', 'font-weight:700',
        'box-shadow:0 4px 14px rgba(0,0,0,.45)',
      ].join(';');
      banner.textContent = e?.detail?.message || '⚠️ Your session has been terminated because your account was logged in on another device.';
      document.body.appendChild(banner);
      setTimeout(() => {
        document.getElementById('session-expired-banner')?.remove();
      }, 7000);
      setUser(null);
      setLoading(false);
      const loginUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/login';
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = loginUrl;
      }
    }
    window.addEventListener('nstp-session-expired', onSessionExpired);
    return () => window.removeEventListener('nstp-session-expired', onSessionExpired);
  }, []);

  // Restore session & data from stored cache on mount INSTANTLY (0ms)
  useEffect(() => {
    try {
      if (!localStorage.getItem('nstp_fresh_clean_messages_v2')) {
        localStorage.removeItem('nstp_cached_messages');
        localStorage.removeItem('nstp_read_conversations');
        localStorage.setItem('nstp_fresh_clean_messages_v2', 'true');
      }
    } catch (_) {}

    const token = localStorage.getItem('nstp_token');
    const cachedUser = localStorage.getItem('nstp_cached_user');
    const cachedAllUsers = localStorage.getItem('nstp_cached_all_users');
    const cachedConvs = localStorage.getItem('nstp_cached_conversations');
    const cachedMsgs = localStorage.getItem('nstp_cached_messages');

    if (token) {
      if (cachedUser) {
        try { setUser(JSON.parse(cachedUser)); } catch {}
      }
      if (cachedAllUsers) {
        try { setUsers(JSON.parse(cachedAllUsers)); } catch {}
      }
      const cachedStudents = localStorage.getItem('nstp_cached_students');
      if (cachedStudents) {
        try { setStudents(JSON.parse(cachedStudents)); } catch {}
      }
      const cachedEnrollments = localStorage.getItem('nstp_cached_enrollments');
      if (cachedEnrollments) {
        try {
          const parsed = JSON.parse(cachedEnrollments);
          if (Array.isArray(parsed)) setPendingEnrollments(parsed.filter(e => e.status === 'Pending'));
        } catch {}
      }
      if (cachedConvs) {
        try { setConversations(JSON.parse(cachedConvs)); } catch {}
      }
      if (cachedMsgs) {
        try { setMessages(JSON.parse(cachedMsgs)); } catch {}
      }
      setLoading(false);
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCurrentUser() {
    try {
      const userData = await usersAPI.getMe();
      setUser(userData);
      safeSetStorage('nstp_cached_user', userData);
      setLoading(false);
      await loadAllData(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      setLoading(false);
    }
  }

  async function loadAllData(currentUser) {
    try {
      const activeUser = currentUser || user;
      const isAdmin = activeUser?.role === 'admin';

      // 1. Users / Instructors (update immediately)
      usersAPI.getAll().then(usersData => {
        if (usersData && Array.isArray(usersData) && usersData.length > 0) {
          setUsers(usersData);
          safeSetStorage('nstp_cached_all_users', usersData);
        }
      }).catch(err => console.warn('Users load error:', err));

      // 2. Students (update immediately)
      studentsAPI.getAll().then(studentsData => {
        if (studentsData && Array.isArray(studentsData)) {
          setStudents(studentsData);
          safeSetStorage('nstp_cached_students', studentsData);
        }
      }).catch(err => console.warn('Students load error:', err));

      // 3. Enrollments / Pending (update immediately for Admin)
      if (isAdmin) {
        enrollmentsAPI.getAll().then(enrollmentsData => {
          if (enrollmentsData && Array.isArray(enrollmentsData)) {
            setPendingEnrollments(enrollmentsData.filter(e => e.status === 'Pending'));
            safeSetStorage('nstp_cached_enrollments', enrollmentsData);
          }
        }).catch(err => console.warn('Enrollments load error:', err));
      }

      // 4. Conversations & Messages (update immediately)
      conversationsAPI.getAll().then(conversationsData => {
        if (conversationsData && Array.isArray(conversationsData) && conversationsData.length > 0) {
          setConversations(conversationsData);
          safeSetStorage('nstp_cached_conversations', conversationsData);

          // Fetch messages asynchronously in background
          conversationsData.forEach(conv => {
            conversationsAPI.getMessages(conv.id)
              .then(msgs => {
                if (Array.isArray(msgs)) {
                  setMessages(prev => {
                    const next = { ...prev, [conv.id]: msgs };
                    safeSetStorage('nstp_cached_messages', next);
                    return next;
                  });
                }
              })
              .catch(() => {});
          });

          if (activeUser) {
            resetRealtimeBaseline();
            seedRealtimeBaseline([], [], conversationsData, [], activeUser);
          }
        }
      }).catch(err => console.warn('Conversations load error:', err));

      // 5. Reports (update immediately)
      reportsAPI.getAll().then(reportsData => {
        if (reportsData && Array.isArray(reportsData)) {
          setReports(reportsData);
          safeSetStorage('nstp_cached_reports', reportsData);
        }
      }).catch(err => console.warn('Reports load error:', err));

      // 6. Archives & Batch (update immediately)
      archivesAPI.getAll().then(archivesData => {
        if (archivesData && Array.isArray(archivesData) && archivesData.length > 0) {
          setArchivedYears(archivesData);
          safeSetStorage('nstp_cached_archives_v6', archivesData);
        } else {
          setArchivedYears(DEFAULT_PAST_BATCHES);
          safeSetStorage('nstp_cached_archives_v6', DEFAULT_PAST_BATCHES);
        }
      }).catch(err => {
        console.warn('Archives load error:', err);
        setArchivedYears(DEFAULT_PAST_BATCHES);
      });

      archivesAPI.getCurrentBatch().then(batchData => {
        setCurrentBatch(batchData?.year ? batchData.year.toString() : '2026-2027 1st Semester');
        if (batchData && (batchData.start_month || batchData.end_month || batchData.startMonth || batchData.endMonth)) {
          updateActiveBatchRange({
            startMonth: batchData.start_month || batchData.startMonth,
            endMonth: batchData.end_month || batchData.endMonth,
            startDate: batchData.start_date || batchData.startDate,
            endDate: batchData.end_date || batchData.endDate
          });
        }
      }).catch(err => console.warn('Batch load error:', err));

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password, _forceLogin = true) {
    try {
      let response = await authAPI.login(email, password, true);
      if (response && response.warning && response.activeSession && !response.token) {
        response = await authAPI.login(email, password, true);
      }
      if (!response || !response.token) return { success: false, message: response?.message || 'Invalid server response' };
      window.__nstp_session_expired__ = false;
      safeSetStorage('nstp_token', response.token);
      safeSetStorage('nstp_cached_user', response.user);
      setUser(response.user);

      // Restore full cached state immediately for instant 0ms screen rendering
      try {
        const cachedStudents = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
        if (Array.isArray(cachedStudents) && cachedStudents.length > 0) setStudents(cachedStudents);
        const cachedAllUsers = JSON.parse(localStorage.getItem('nstp_cached_all_users') || '[]');
        if (Array.isArray(cachedAllUsers) && cachedAllUsers.length > 0) setUsers(cachedAllUsers);
        const cachedEnrollments = JSON.parse(localStorage.getItem('nstp_cached_enrollments') || '[]');
        if (Array.isArray(cachedEnrollments) && cachedEnrollments.length > 0) {
          setPendingEnrollments(cachedEnrollments.filter(e => e.status === 'Pending'));
        }
        const cachedConvs = JSON.parse(localStorage.getItem('nstp_cached_conversations') || '[]');
        if (Array.isArray(cachedConvs) && cachedConvs.length > 0) setConversations(cachedConvs);
        const cachedMsgs = JSON.parse(localStorage.getItem('nstp_cached_messages') || '{}');
        if (cachedMsgs && typeof cachedMsgs === 'object' && Object.keys(cachedMsgs).length > 0) setMessages(cachedMsgs);
      } catch (_) {}

      setLoading(false);
      // Load all data in background so login transitions instantly on mobile devices
      loadAllData(response.user).catch(err => console.warn('Background data load error:', err));
      return { success: true, role: response.user.role };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Invalid email or password' };
    }
  }

  async function logout() {
    try {
      await authAPI.logout();
    } catch (_) {}
    localStorage.removeItem('nstp_token');
    localStorage.removeItem('nstp_cached_user');
    if (user) {
      safeSetStorage(getNotificationStorageKey(user), notifications);
    }
    notificationsLoadedUserRef.current = null;
    setUser(null);
    setUsers([
      { id: 1, name: 'NSTP Administrator', email: 'admin@gmail.com', role: 'admin', department: 'NSTP Office', avatar: 'avatar-4' },
      { id: 2, name: 'CWTS Instructor', email: 'cwts@gmail.com', role: 'instructor', department: 'CWTS', avatar: 'avatar-2' },
      { id: 3, name: 'LTS Instructor', email: 'lts@gmail.com', role: 'instructor', department: 'LTS', avatar: 'avatar-6' },
      { id: 4, name: 'ROTC Instructor', email: 'rotc@gmail.com', role: 'instructor', department: 'ROTC', avatar: 'avatar-8' },
    ]);
    setStudents([]);
    setPendingEnrollments([]);
    setReports([]);
    setConversations([]);
    setMessages({});
    setNotifications([]);
    setToasts([]);
    setIncomingCall(null);
    clearOutgoingCall();
    resetRealtimeBaseline();
  }

  async function updateUserData(updatedData) {
    const updated = await usersAPI.update(user.id, updatedData);
    setUser(updated);
    const usersData = await usersAPI.getAll();
    setUsers(usersData);
    return updated;
  }

  async function changeUserPassword(newPassword) {
    await usersAPI.changePassword(user.id, newPassword);
    return true;
  }

  // ── Student management ────────────────────────────────────────────────────────

  async function addStudentFunc(student) {
    const newStudent = await studentsAPI.add(student);
    const studentsData = await studentsAPI.getAll();
    setStudents(studentsData);
    return newStudent;
  }

  async function updateStudentFunc(id, data) {
    const updated = await studentsAPI.update(id, data);
    setStudents(prev => prev.map(s => {
      const match = (s.id && String(s.id) === String(id)) || (s.studentId && String(s.studentId) === String(id));
      return match ? { ...s, ...updated } : s;
    }));
    return updated;
  }

  async function deleteStudentFunc(id) {
    await studentsAPI.delete(id);
    setStudents(prev => prev.filter(s => s.id !== id));
  }

  // ── Enrollment management ─────────────────────────────────────────────────────

  async function submitEnrollmentFunc(enrollment) {
    const newEnrollment = await enrollmentsAPI.submit(enrollment);
    setPendingEnrollments(prev => [...prev, newEnrollment]);
    return newEnrollment;
  }

  async function approveEnrollmentFunc(id, designatedSection) {
    const updated = await enrollmentsAPI.update(id, 'Approved', designatedSection);
    setPendingEnrollments(prev => prev.filter(e => e.id !== id));
    const studentsData = await studentsAPI.getAll();
    setStudents(studentsData);
    return updated;
  }

  async function declineEnrollmentFunc(id) {
    await enrollmentsAPI.update(id, 'Declined');
    setPendingEnrollments(prev => prev.filter(e => e.id !== id));
  }

  // ── Report management ─────────────────────────────────────────────────────────

  async function addReportFunc(report) {
    const newReport = await reportsAPI.add(report);
    const reportsData = await reportsAPI.getAll();
    setReports(reportsData);
    return newReport;
  }

  async function updateReportFunc(id, data) {
    const updated = await reportsAPI.update(id, data);
    setReports(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  }

  async function deleteReportFunc(id) {
    await reportsAPI.delete(id);
    setReports(prev => prev.filter(r => r.id !== id));
  }

  async function submitReportFunc(reportId, submission) {
    await reportsAPI.submit(
      reportId,
      submission.content,
      submission.attachment?.data,
      submission.attachment?.name
    );
    const reportsData = await reportsAPI.getAll();
    setReports(reportsData);
  }

  // ── Message management ────────────────────────────────────────────────────────

  function updateMessageInState(conversationId, messageId, updater) {
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m =>
        m.id === messageId ? updater(m) : m
      ),
    }));
  }

  async function editMessageFunc(conversationId, messageId, newText) {
    let prevHistory = [];
    const currentList = messages[conversationId] || [];
    const targetMsg = currentList.find(m => m.id === messageId);
    if (targetMsg) {
      try {
        const raw = targetMsg.edit_history || targetMsg.editHistory;
        prevHistory = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? [...raw] : []);
      } catch (_) { prevHistory = []; }
      const oldText = targetMsg.text || targetMsg.content || '';
      if (oldText && oldText !== newText) {
        prevHistory.push({
          text: oldText,
          edited_at: new Date().toISOString()
        });
      }
    }
    
    // 1. Optimistically update local message state immediately
    updateMessageInState(conversationId, messageId, m => ({ 
      ...m, 
      text: newText, 
      content: newText, 
      edited: 1,
      edit_history: prevHistory,
      editHistory: prevHistory
    }));

    try {
      const updated = await conversationsAPI.editMessage(conversationId, messageId, newText);
      if (updated) {
        updateMessageInState(conversationId, messageId, m => ({
          ...m,
          ...updated,
          edit_history: updated.edit_history || prevHistory,
          editHistory: updated.edit_history || prevHistory
        }));
      }
      return updated;
    } catch (err) {
      console.error('API editMessage error:', err);
    }
  }

  async function deleteMessageFunc(conversationId, messageId, forEveryone = false) {
    // 1. Optimistically update local message state IMMEDIATELY (0ms instant response)
    updateMessageInState(conversationId, messageId, m => {
      if (forEveryone) {
        return { ...m, deleted_for_everyone: true, deletedForEveryone: true, type: 'deleted', text: '[deleted]' };
      }
      let deletedFor = [];
      if (m.deleted_for) {
        try {
          deletedFor = typeof m.deleted_for === 'string' ? JSON.parse(m.deleted_for) : m.deleted_for;
        } catch { deletedFor = []; }
      }
      if (user && !deletedFor.includes(user.id)) deletedFor.push(user.id);
      return { ...m, deleted_for: JSON.stringify(deletedFor), deletedForMe: true };
    });

    // 2. Perform backend API deletion asynchronously in background
    try {
      await conversationsAPI.deleteMessage(conversationId, messageId, forEveryone);
    } catch (err) {
      console.error('API deleteMessage error:', err);
    }

    return { success: true };
  }

  async function restoreMessageFunc(conversationId, messageId) {
    const restored = await conversationsAPI.restoreMessage(conversationId, messageId);
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m => m.id === messageId ? restored : m),
    }));
    return restored;
  }

  async function addReactionFunc(conversationId, messageId, emoji) {
    const result = await conversationsAPI.addReaction(conversationId, messageId, emoji);
    updateMessageInState(conversationId, messageId, m => ({ ...m, reactions: result.reactions }));
    return result;
  }

  async function addReportCommentFunc(reportId, comment) {
    const saved = await reportsAPI.addComment(reportId, comment.text);
    setReports(prev =>
      prev.map(r => r.id !== reportId ? r : { ...r, comments: [...(r.comments || []), saved] })
    );
    return saved;
  }

  // ── Chat management ───────────────────────────────────────────────────────────

  async function startConversationFunc(withUser) {
    if (!withUser?.id) return null;
    const targetUserId = Number(withUser.id);

    const existing = conversations.find(c =>
      !c.isGroup && !c.is_group && (
        Number(c.participant_1_id) === targetUserId ||
        Number(c.participant_2_id) === targetUserId ||
        c.participants?.includes(targetUserId) ||
        c.with === withUser.name
      )
    );

    if (existing) {
      return existing;
    }

    const conversation = await conversationsAPI.create(targetUserId);
    setConversations(prev => {
      if (prev.some(c => String(c.id) === String(conversation.id))) return prev;
      return [conversation, ...prev];
    });
    setMessages(prev => ({ ...prev, [conversation.id]: prev[conversation.id] || [] }));
    return conversation;
  }

  async function createGroupChatFunc(name, participantIds) {
    const conversation = await conversationsAPI.createGroup(name, participantIds);
    if (!conversations.some(c => c.id === conversation.id)) {
      setConversations(prev => [conversation, ...prev]);
      setMessages(prev => ({ ...prev, [conversation.id]: [] }));
    }
    return conversation;
  }

  async function sendMessageFunc(conversationId, message) {
    const msgType = message.type || 'text';
    const newMsg = await conversationsAPI.sendMessage(conversationId, {
      text: message.text,
      type: msgType,
      image_url: message.imageUrl,
      file_url: message.fileUrl,
      file_name: message.fileName,
      audio_url: message.audioUrl,
      duration: message.duration,
    });

    const msgWithTime = {
      ...newMsg,
      time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: newMsg.sender_id ?? user?.id,
      sender_id: newMsg.sender_id ?? user?.id,
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), msgWithTime],
    }));

    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      let preview = message.text;
      if (!preview || !preview.trim()) {
        if (msgType === 'image') preview = '📸 Photo';
        else if (msgType === 'file') preview = `📎 ${message.fileName || 'File'}`;
        else if (msgType === 'voice') preview = '🎤 Voice message';
        else preview = 'Message';
      }
      return { ...c, last_message: preview, last_message_time: new Date().toISOString() };
    }));

    return msgWithTime;
  }

  async function deleteConversationFunc(conversationId) {
    try {
      await conversationsAPI.delete(conversationId);
    } catch (err) {
      console.warn('Delete conversation API notice:', err.message);
    }
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId);
      safeSetStorage('nstp_cached_conversations', updated);
      return updated;
    });
    setMessages(prev => {
      const next = { ...prev };
      delete next[conversationId];
      safeSetStorage('nstp_cached_messages', next);
      return next;
    });
  }

  async function clearMessagesFunc(conversationId) {
    setMessages(prev => {
      const next = { ...prev, [conversationId]: [] };
      safeSetStorage('nstp_cached_messages', next);
      return next;
    });
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === conversationId ? { ...c, last_message: null, last_message_time: null, last_sender_id: null } : c
      );
      safeSetStorage('nstp_cached_conversations', updated);
      return updated;
    });
    try {
      await conversationsAPI.clearMessages(conversationId);
    } catch (err) {
      console.error('Failed to clear messages on server:', err);
    }
  }

  const getUserConversations = useCallback(() => {
    if (!user) return [];
    const uid = String(user.id ?? '');
    return (conversations || []).filter(c => {
      if (!c) return false;
      const p1 = String(c.participant_1_id ?? '');
      const p2 = String(c.participant_2_id ?? '');
      if (uid && (p1 === uid || p2 === uid)) return true;
      const isGroup = Boolean(c.isGroup || c.is_group || String(c.id).startsWith('group-') || c.groupName || c.group_name);
      if (isGroup) {
        if (Array.isArray(c.participants) && c.participants.length > 0) {
          return c.participants.some(p => String(p) === uid);
        }
        return true;
      }
      return false;
    });
  }, [conversations, user]);

  async function clearBatchData() {
    await clearBatch();
    setStudents([]);
    setReports([]);
  }

  const userConversations = useMemo(() => getUserConversations(), [getUserConversations]);

  const contextValue = {
    user, login, logout, updateUser: updateUserData, changePassword: changeUserPassword, allUsers: users,
    students, setStudents, reports, conversations: userConversations, messages, pendingEnrollments,
    archivedYears, currentBatch,
    viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData,
    addStudent: addStudentFunc, updateStudent: updateStudentFunc, deleteStudent: deleteStudentFunc,
    addReport: addReportFunc, updateReport: updateReportFunc, deleteReport: deleteReportFunc,
    submitReport: submitReportFunc, addReportComment: addReportCommentFunc,
    startConversation: startConversationFunc, createGroupChat: createGroupChatFunc,
    sendMessage: sendMessageFunc, getUserConversations, editMessage: editMessageFunc,
    addReaction: addReactionFunc, deleteMessage: deleteMessageFunc, restoreMessage: restoreMessageFunc,
    deleteConversation: deleteConversationFunc, clearMessages: clearMessagesFunc,
    clearBatchData, submitEnrollment: submitEnrollmentFunc,
    approveEnrollment: approveEnrollmentFunc, declineEnrollment: declineEnrollmentFunc,
    loading, refreshData: loadAllData, refreshLiveData,
    notifications, setNotifications, pushNotification, deleteNotifications, markAllNotificationsRead,
    toasts, dismissToast, showToast,
    incomingCall, outgoingCallStatus,
    pendingAnsweredCall, setPendingAnsweredCall,
    registerOutgoingCall, clearOutgoingCall,
    answerIncomingCall, declineIncomingCall,
    displayZoom, setDisplayZoom,
    currentBatchRange, setCurrentBatchRange: setCurrentBatchRangeState,
    updateActiveBatchRange,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <BrowserRouter basename={BASE_PATH}>
        <GlobalKeyboardManager />
        {/* Global Floating Toast Notifications Container */}
        <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform animate-in slide-in-from-top-3 fade-in ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/50 text-white shadow-emerald-950/40'
                  : toast.type === 'error'
                  ? 'bg-rose-950/95 border-rose-500/50 text-white shadow-rose-950/40'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/95 border-amber-500/50 text-white shadow-amber-950/40'
                  : 'bg-slate-950/95 border-slate-700/60 text-white shadow-slate-950/40'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {(!toast.type || toast.type === 'info' || toast.type === 'system') && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-white leading-tight">{toast.title}</h4>
                <p className="text-[11px] sm:text-xs text-gray-200/90 leading-snug mt-0.5">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-xs mx-auto">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-gray-800">Loading NSTP System...</p>
              <p className="text-xs text-gray-500 mt-1">CvSU Naic Campus</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/digital-id" element={<DigitalIdViewer />} />
            <Route path="/id-card" element={<DigitalIdViewer />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorDashboard /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><StudentManagement /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Reports /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Chat /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Calendar /></ProtectedRoute>} />
            <Route path="/letter-formats" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><LetterFormats /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Profile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'} replace /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/instructor" element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
