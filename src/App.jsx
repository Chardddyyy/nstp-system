import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { AuthContext } from './context/AuthContext';
import RealtimeToastStack from './components/RealtimeToastStack';
import { authAPI, usersAPI, studentsAPI, reportsAPI, conversationsAPI, enrollmentsAPI, archivesAPI, callsAPI, clearBatch, pingTelemetry } from './services/api';
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

const BASE_PATH = (() => {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/nstp-system/')) return '/nstp-system/';
  return import.meta.env.BASE_URL || '/';
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

function getNotificationStorageKey(role) {
  return role === 'admin' ? 'nstp_admin_notifications' : 'nstp_instructor_notifications';
}

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [reports, setReports] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [archivedYears, setArchivedYears] = useState([]);

  // Live Auto-Update & Auto-Restart Detection (Brave Mobile Cache Buster)
  useEffect(() => {
    let currentVersion = localStorage.getItem('nstp_app_version') || null;
    const getVUrl = () => `${BASE_PATH}version.json?t=${Date.now()}`;

    const checkVersion = () => {
      fetch(getVUrl(), { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } })
        .then(res => res.json())
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
    const checkInterval = setInterval(checkVersion, 12000);
    return () => clearInterval(checkInterval);
  }, []);
  const [currentBatch, setCurrentBatch] = useState(new Date().getFullYear().toString());
  const [viewingArchive, setViewingArchive] = useState(false);
  const [archiveViewData, setArchiveViewData] = useState(null);
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
  const seenStudentIds = useRef(new Set());
  const seenConvLastMessageTime = useRef({});

  // Global Realtime Telemetry Heartbeat Ping
  useEffect(() => {
    let sid = sessionStorage.getItem('nstp_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem('nstp_session_id', sid);
    }

    let vid = localStorage.getItem('nstp_visitor_id');
    if (!vid) {
      vid = 'vid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('nstp_visitor_id', vid);
    }

    const sendPing = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      pingTelemetry({
        sessionId: sid,
        visitorId: vid,
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
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      time: 'Just now',
      read: false,
      title: notif.title,
      message: notif.message,
      type: notif.type || 'system',
      link: notif.link || '#',
    };

    setNotifications(prev => [item, ...prev].slice(0, 50));
    setToasts(prev => [item, ...prev].slice(0, 5));

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(item.title, { body: item.message }); } catch { /* ignore */ }
    }

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== item.id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
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
        pushNotification({
          title: 'New Online Enrollment',
          message: `${payload.enrollment.name || payload.enrollment.studentId || 'A student'} submitted an enrollment application`,
          type: 'enrollment',
          link: '/admin/dashboard'
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
    seenStudentIds.current = new Set();
    seenConvLastMessageTime.current = {};
  }

  function seedRealtimeBaseline(pending, reportsList, convList, studentsList, currentUser) {
    const safePending = Array.isArray(pending) ? pending : [];
    const safeStudents = Array.isArray(studentsList) ? studentsList : [];
    const safeReports = Array.isArray(reportsList) ? reportsList : [];
    const safeConvs = Array.isArray(convList) ? convList : [];

    safePending.forEach(e => { if (e && e.id) seenEnrollmentIds.current.add(e.id); });
    safeStudents.forEach(s => { if (s && s.id) seenStudentIds.current.add(s.id); });

    safeReports.forEach(report => {
      if (!report) return;
      if (currentUser && currentUser.role === 'instructor' && (report.department === 'All' || report.department === currentUser.department)) {
        if (report.id) seenReportIds.current.add(report.id);
      }
      (Array.isArray(report.submissions) ? report.submissions : []).forEach(sub => {
        if (sub) seenSubmissionKeys.current.add(`${report.id}-${sub.instructor_id}-${sub.id}`);
      });
    });

    safeConvs.forEach(conv => {
      if (conv && conv.id && conv.last_message_time) {
        seenConvLastMessageTime.current[conv.id] = String(conv.last_message_time);
      }
    });

    baselineReady.current = true;
  }

  function detectRealtimeChanges(pending, reportsList, convList, studentsList, currentUser) {
    if (!baselineReady.current || !currentUser) return;

    const safePending = Array.isArray(pending) ? pending : [];
    const safeStudents = Array.isArray(studentsList) ? studentsList : [];
    const safeReports = Array.isArray(reportsList) ? reportsList : [];

    if (currentUser.role === 'admin') {
      // 1. New Pending Enrollments
      safePending.forEach(enrollment => {
        if (!enrollment || !enrollment.id) return;
        if (!seenEnrollmentIds.current.has(enrollment.id)) {
          seenEnrollmentIds.current.add(enrollment.id);
          const enrollName = enrollment.student_name || enrollment.fullName || enrollment.firstName || 'A student';
          pushNotification({
            title: 'New Enrollment Application',
            message: `${enrollName} submitted an enrollment application (${enrollment.department || 'NSTP'})`,
            type: 'enrollment',
            link: '/admin/dashboard',
          });
        }
      });

      // 2. New Report Submissions by Instructors
      safeReports.forEach(report => {
        if (!report) return;
        (Array.isArray(report.submissions) ? report.submissions : []).forEach(sub => {
          if (!sub) return;
          const subKey = `${report.id}-${sub.instructor_id}-${sub.id}`;
          if (!seenSubmissionKeys.current.has(subKey)) {
            seenSubmissionKeys.current.add(subKey);
            pushNotification({
              title: 'New Report Submission',
              message: `Report "${report.title || 'Untitled'}" was submitted by ${sub.instructor || sub.department || 'an instructor'}`,
              type: 'report',
              link: '/reports',
            });
          }
        });
      });
    }

    if (currentUser.role === 'instructor') {
      // 1. Check for newly approved/enrolled students assigned to this instructor's department (e.g. ROTC, CWTS, LTS)
      safeStudents.forEach(student => {
        if (!student || !student.id) return;
        if (!seenStudentIds.current.has(student.id)) {
          seenStudentIds.current.add(student.id);
          const studentDept = student.department || student.nstp_component || '';
          if (studentDept === currentUser.department) {
            const studentName = student.name || student.student_name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'New Student';
            pushNotification({
              title: `New ${currentUser.department} Student Enrolled`,
              message: `${studentName} was assigned to ${currentUser.department} class roster`,
              type: 'student',
              link: '/students',
            });
          }
        }
      });

      // 2. Check for newly created report assignments targeting All or this department
      safeReports.forEach(report => {
        if (!report || !report.id) return;
        const isTargetDept = report.department === 'All' || report.department === currentUser.department;
        if (isTargetDept && !seenReportIds.current.has(report.id)) {
          seenReportIds.current.add(report.id);
          pushNotification({
            title: report.department === 'All' ? 'New General Report Assignment' : `New ${report.department} Report Assignment`,
            message: `Admin assigned: "${report.title || 'Untitled'}" (${report.department === 'All' ? 'All Departments' : report.department})`,
            type: 'report',
            link: '/reports',
          });
        }
      });
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
            title: 'New Message',
            message: `${senderName}: ${preview}`,
            type: 'message',
            link: '/chat',
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
      const [reportsData, conversationsData, usersData, studentsData] = await Promise.all([
        reportsAPI.getAll().catch(() => null),
        conversationsAPI.getAll().catch(() => null),
        usersAPI.getAll().catch(() => null),
        studentsAPI.getAll().catch(() => null)
      ]);

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

      if (!baselineReady.current) {
        seedRealtimeBaseline(pending, activeReports, activeConvs, activeStudents, user);
      } else {
        detectRealtimeChanges(pending, activeReports, activeConvs, activeStudents, user);
        await checkConversationMessages(activeConvs, user);
      }
    } catch (error) {
      console.warn('Live refresh failed:', error);
    }
  }

  // Load notifications from storage when user logs in
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(getNotificationStorageKey(user.role));
    try {
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch {
      setNotifications([]);
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);



  useEffect(() => {
    if (!user) return;
    safeSetStorage(getNotificationStorageKey(user.role), notifications);
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
      const [
        usersData, studentsData, reportsData, enrollmentsData,
        conversationsData, archivesData, batchData,
      ] = await Promise.all([
        usersAPI.getAll().catch(() => null),
        studentsAPI.getAll().catch(() => null),
        reportsAPI.getAll().catch(() => null),
        enrollmentsAPI.getAll().catch(() => null),
        conversationsAPI.getAll().catch(() => null),
        archivesAPI.getAll().catch(() => null),
        archivesAPI.getCurrentBatch().catch(() => null),
      ]);

      if (usersData && Array.isArray(usersData)) {
        setUsers(usersData);
        safeSetStorage('nstp_cached_all_users', usersData);
      }
      if (studentsData && Array.isArray(studentsData)) setStudents(studentsData);
      if (reportsData && Array.isArray(reportsData)) setReports(reportsData);
      if (enrollmentsData && Array.isArray(enrollmentsData)) setPendingEnrollments(enrollmentsData.filter(e => e.status === 'Pending'));
      if (archivesData && Array.isArray(archivesData)) setArchivedYears(archivesData);
      if (batchData?.year) setCurrentBatch(batchData.year.toString());

      if (conversationsData && Array.isArray(conversationsData)) {
        setConversations(conversationsData);
        safeSetStorage('nstp_cached_conversations', conversationsData);

        const messageResults = await Promise.all(
          conversationsData.map(conv =>
            conversationsAPI.getMessages(conv.id)
              .then(msgs => ({ id: conv.id, msgs }))
              .catch(() => null)
          )
        );
        const validResults = messageResults.filter(Boolean);
        if (validResults.length > 0) {
          setMessages(prev => {
            const next = { ...prev };
            validResults.forEach(r => {
              if (r.msgs && Array.isArray(r.msgs)) next[r.id] = r.msgs;
            });
            safeSetStorage('nstp_cached_messages', next);
            return next;
          });
        }
      }

      const activeUser = currentUser || user;
      if (activeUser && conversationsData && Array.isArray(conversationsData)) {
        resetRealtimeBaseline();
        seedRealtimeBaseline(
          (enrollmentsData || []).filter(e => e?.status === 'Pending'),
          reportsData || [],
          conversationsData,
          activeUser
        );
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password, forceLogin = true) {
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
    setUser(null);
    setUsers([]);
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
    const updated = await conversationsAPI.editMessage(conversationId, messageId, newText);
    updateMessageInState(conversationId, messageId, m => ({ ...m, text: newText, edited: 1 }));
    return updated;
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
    await conversationsAPI.delete(conversationId);
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setMessages(prev => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }

  async function clearMessagesFunc(conversationId) {
    setMessages(prev => ({ ...prev, [conversationId]: [] }));
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, last_message: null, last_message_time: null, last_sender_id: null } : c
    ));
    try {
      await conversationsAPI.clearMessages(conversationId);
    } catch (err) {
      console.error('Failed to clear messages on server:', err);
    }
  }

  const getUserConversations = useCallback(() => {
    if (!user) return [];
    return conversations.filter(c => {
      if (c.participant_1_id === user.id || c.participant_2_id === user.id) return true;
      const isGroup = c.isGroup || c.is_group;
      if (isGroup) {
        const groupName = c.groupName || c.group_name || c.name || '';
        if (groupName === 'All Instructors' || groupName.includes('Instructor')) return true;
        if (Array.isArray(c.participants) && c.participants.includes(user.id)) return true;
        return true; // Any group chat retrieved for user is valid
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
    notifications, setNotifications, pushNotification,
    toasts, dismissToast,
    incomingCall, outgoingCallStatus,
    pendingAnsweredCall, setPendingAnsweredCall,
    registerOutgoingCall, clearOutgoingCall,
    answerIncomingCall, declineIncomingCall,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <BrowserRouter basename={BASE_PATH}>
        <RealtimeToastStack />
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
