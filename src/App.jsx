import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { AuthContext } from './context/AuthContext';
import RealtimeToastStack from './components/RealtimeToastStack';
import IncomingCallOverlay from './components/IncomingCallOverlay';
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
import { authAPI, usersAPI, studentsAPI, reportsAPI, conversationsAPI, enrollmentsAPI, archivesAPI, callsAPI, clearBatch, pingTelemetry } from './services/api';

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

  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

const POLL_INTERVAL_MS = 8000;

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

  const baselineReady = useRef(false);
  const seenEnrollmentIds = useRef(new Set());
  const seenSubmissionKeys = useRef(new Set());
  const seenReportIds = useRef(new Set());
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
    const interval = setInterval(sendPing, 8000);
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
    }, 1000);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  function resetRealtimeBaseline() {
    baselineReady.current = false;
    seenEnrollmentIds.current = new Set();
    seenSubmissionKeys.current = new Set();
    seenReportIds.current = new Set();
    seenConvLastMessageTime.current = {};
  }

  function seedRealtimeBaseline(pending, reportsList, convList, currentUser) {
    pending.forEach(e => seenEnrollmentIds.current.add(e.id));

    reportsList.forEach(report => {
      if (currentUser.role === 'instructor' && report.department === currentUser.department) {
        seenReportIds.current.add(report.id);
      }
      (report.submissions || []).forEach(sub => {
        seenSubmissionKeys.current.add(`${report.id}-${sub.instructor_id}-${sub.id}`);
      });
    });

    convList.forEach(conv => {
      if (conv.last_message_time) {
        seenConvLastMessageTime.current[conv.id] = String(conv.last_message_time);
      }
    });

    baselineReady.current = true;
  }

  function detectRealtimeChanges(pending, reportsList, convList, currentUser) {
    if (!baselineReady.current || !currentUser) return;

    if (currentUser.role === 'admin') {
      pending.forEach(enrollment => {
        if (!seenEnrollmentIds.current.has(enrollment.id)) {
          seenEnrollmentIds.current.add(enrollment.id);
          const enrollName = enrollment.student_name || enrollment.firstName || 'A student';
          pushNotification({
            title: 'New Enrollment',
            message: `${enrollName} submitted an enrollment application`,
            type: 'enrollment',
            link: '/admin/dashboard',
          });
        }
      });

      reportsList.forEach(report => {
        (report.submissions || []).forEach(sub => {
          const subKey = `${report.id}-${sub.instructor_id}-${sub.id}`;
          if (!seenSubmissionKeys.current.has(subKey)) {
            seenSubmissionKeys.current.add(subKey);
            pushNotification({
              title: 'New Report Submission',
              message: `Report "${report.title || 'Untitled'}" was submitted`,
              type: 'report',
              link: '/reports',
            });
          }
        });
      });
    }

    if (currentUser.role === 'instructor') {
      reportsList.forEach(report => {
        if (report.department === currentUser.department && !seenReportIds.current.has(report.id)) {
          seenReportIds.current.add(report.id);
          pushNotification({
            title: 'New Report Assignment',
            message: `New report: ${report.title || 'Untitled'}`,
            type: 'report',
            link: '/reports',
          });
        }
      });
    }
  }

  async function checkConversationMessages(convList, currentUser) {
    if (!baselineReady.current || !currentUser) return;

    for (const conv of convList) {
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
      const [reportsData, conversationsData, usersData] = await Promise.all([
        reportsAPI.getAll().catch(() => []),
        conversationsAPI.getAll().catch(() => []),
        usersAPI.getAll().catch(() => [])
      ]);
      setReports(reportsData);
      setConversations(conversationsData);
      if (usersData && usersData.length > 0) {
        setUsers(usersData);
      }

      let pending = pendingEnrollments;
      if (user.role === 'admin') {
        const enrollmentsData = await enrollmentsAPI.getAll();
        pending = enrollmentsData.filter(e => e.status === 'Pending');
        setPendingEnrollments(pending);
      }

      if (!baselineReady.current) {
        seedRealtimeBaseline(pending, reportsData, conversationsData, user);
      } else {
        detectRealtimeChanges(pending, reportsData, conversationsData, user);
        await checkConversationMessages(conversationsData, user);
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
    localStorage.setItem(getNotificationStorageKey(user.role), JSON.stringify(notifications));
  }, [notifications, user]);

  // Real-time polling while logged in
  useEffect(() => {
    if (!user || loading) return;
    refreshLiveData();
    const interval = setInterval(refreshLiveData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // Poll for incoming/outgoing calls every 2 seconds
  useEffect(() => {
    if (!user) return;

    async function pollCalls() {
      try {
        const incomingList = await callsAPI.getIncoming();
        setIncomingCall(incomingList.length > 0 ? incomingList[0] : null);

        if (outgoingCallIdRef.current) {
          const outgoing = await callsAPI.getById(outgoingCallIdRef.current);
          setOutgoingCallStatus(outgoing.status);
        }
      } catch { /* ignore poll errors */ }
    }

    pollCalls();
    const callInterval = setInterval(pollCalls, 2000);
    return () => clearInterval(callInterval);
  }, [user]);

  function registerOutgoingCall(callId) {
    outgoingCallIdRef.current = callId;
    setOutgoingCallStatus('ringing');
  }

  function clearOutgoingCall() {
    outgoingCallIdRef.current = null;
    setOutgoingCallStatus(null);
  }

  async function declineIncomingCall(callId) {
    try {
      await callsAPI.end(callId, 'declined');
    } catch (e) {
      console.warn('Decline call failed:', e);
    }
    setIncomingCall(null);
  }

  async function answerIncomingCall(call) {
    try {
      await callsAPI.answer(call.id);
      setIncomingCall(null);
      setPendingAnsweredCall(call);
      window.dispatchEvent(new CustomEvent('nstp-call-answered', { detail: call }));
    } catch (e) {
      console.error('Answer call failed:', e);
    }
  }

  // Handle session expiry — api.js dispatches this event so React Router can
  // navigate to /login without a hard reload, preserving any open form state.
  useEffect(() => {
    function onSessionExpired() {
      window.__nstp_session_expired__ = true;
      const banner = document.createElement('div');
      banner.id = 'session-expired-banner';
      banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
        'background:#dc2626', 'color:#fff', 'text-align:center',
        'padding:14px 16px', 'font-size:15px', 'font-weight:600',
        'box-shadow:0 2px 8px rgba(0,0,0,.35)',
      ].join(';');
      banner.textContent = 'Your session has expired. Please log in again.';
      document.body.appendChild(banner);
      setTimeout(() => {
        document.getElementById('session-expired-banner')?.remove();
      }, 5000);
      setUser(null);
      setLoading(false);
    }
    window.addEventListener('nstp-session-expired', onSessionExpired);
    return () => window.removeEventListener('nstp-session-expired', onSessionExpired);
  }, []);

  // Restore session from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('nstp_token');
    if (token) {
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
        usersAPI.getAll(),
        studentsAPI.getAll(),
        reportsAPI.getAll(),
        enrollmentsAPI.getAll().catch(() => []),
        conversationsAPI.getAll().catch(() => []),
        archivesAPI.getAll().catch(() => []),
        archivesAPI.getCurrentBatch().catch(() => ({ year: new Date().getFullYear() })),
      ]);

      setUsers(usersData);
      setStudents(studentsData);
      setReports(reportsData);
      setPendingEnrollments(enrollmentsData.filter(e => e.status === 'Pending'));
      setConversations(conversationsData);
      setArchivedYears(archivesData);
      setCurrentBatch(batchData.year.toString());

      const messageResults = await Promise.all(
        conversationsData.map(conv =>
          conversationsAPI.getMessages(conv.id)
            .then(msgs => ({ id: conv.id, msgs }))
            .catch(() => ({ id: conv.id, msgs: [] }))
        )
      );
      const messagesData = Object.fromEntries(messageResults.map(r => [r.id, r.msgs]));
      setMessages(messagesData);

      const activeUser = currentUser || user;
      if (activeUser) {
        resetRealtimeBaseline();
        seedRealtimeBaseline(
          enrollmentsData.filter(e => e.status === 'Pending'),
          reportsData,
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

  async function login(email, password) {
    try {
      const response = await authAPI.login(email, password);
      if (!response.token) return { success: false, message: 'Invalid server response' };
      window.__nstp_session_expired__ = false;
      localStorage.setItem('nstp_token', response.token);
      setUser(response.user);
      await loadAllData(response.user);
      return { success: true, role: response.user.role };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Invalid email or password' };
    }
  }

  function logout() {
    localStorage.removeItem('nstp_token');
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
    setStudents(prev => prev.map(s => s.id === id ? updated : s));
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

  async function approveEnrollmentFunc(id) {
    const updated = await enrollmentsAPI.update(id, 'Approved');
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
    await conversationsAPI.deleteMessage(conversationId, messageId, forEveryone);

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
    const conversation = await conversationsAPI.create(withUser.id);
    if (!conversations.some(c => c.id === conversation.id)) {
      setConversations(prev => [conversation, ...prev]);
      setMessages(prev => ({ ...prev, [conversation.id]: [] }));
    }
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
      if (c.isGroup && Array.isArray(c.participants)) return c.participants.includes(user.id);
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
    students, reports, conversations: userConversations, messages, pendingEnrollments,
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
        <IncomingCallOverlay />
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
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
