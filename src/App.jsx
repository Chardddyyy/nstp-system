import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, createContext, useContext, useEffect, useRef, useCallback } from 'react';

// Dynamically determine basename based on current pathname
const BASE_PATH = (() => {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/nstp-system/')) {
    return '/nstp-system/';
  }
  return import.meta.env.BASE_URL || '/';
})();
import RealtimeToastStack from './components/RealtimeToastStack';
import IncomingCallOverlay from './components/IncomingCallOverlay';
import { hasAllInstructorsGroup, ensureAllInstructorsGroup } from './utils/ensureGroupChat';
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
import { authAPI, usersAPI, studentsAPI, reportsAPI, conversationsAPI, enrollmentsAPI, archivesAPI, callsAPI, clearBatch } from './services/api';

export var AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Defined OUTSIDE App so its function reference never changes between App re-renders.
// If it were inside App, every polling update would create a new ProtectedRoute reference,
// causing React to unmount+remount all page children and reset every modal/form state.
function ProtectedRoute(props) {
  var children = props.children;
  var allowedRoles = props.allowedRoles;
  var auth = useContext(AuthContext);
  var loading = auth.loading;
  var user = auth.user;

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

  if (allowedRoles) {
    var hasRole = false;
    for (var i = 0; i < allowedRoles.length; i++) {
      if (allowedRoles[i] === user.role) {
        hasRole = true;
        break;
      }
    }
    if (!hasRole) {
      return <Navigate to="/" />;
    }
  }

  return children;
}

function App() {
  var [user, setUser] = useState(null);
  var [users, setUsers] = useState([]);
  var [students, setStudents] = useState([]);
  var [pendingEnrollments, setPendingEnrollments] = useState([]);
  var [reports, setReports] = useState([]);
  var [conversations, setConversations] = useState([]);
  var [messages, setMessages] = useState({});
  var [archivedYears, setArchivedYears] = useState([]);
  var [currentBatch, setCurrentBatch] = useState(new Date().getFullYear().toString());
  var [viewingArchive, setViewingArchive] = useState(false);
  var [archiveViewData, setArchiveViewData] = useState(null);
  var [loading, setLoading] = useState(true);
  var [notifications, setNotifications] = useState([]);
  var [toasts, setToasts] = useState([]);
  var [incomingCall, setIncomingCall] = useState(null);
  var [pendingAnsweredCall, setPendingAnsweredCall] = useState(null);
  var [outgoingCallStatus, setOutgoingCallStatus] = useState(null);
  var outgoingCallIdRef = useRef(null);

  var baselineReady = useRef(false);
  var seenEnrollmentIds = useRef(new Set());
  var seenSubmissionKeys = useRef(new Set());
  var seenReportIds = useRef(new Set());
  var seenConvLastMessageTime = useRef({});
  var POLL_INTERVAL_MS = 8000;

  function getNotificationStorageKey(role) {
    return role === 'admin' ? 'nstp_admin_notifications' : 'nstp_instructor_notifications';
  }

  var pushNotification = useCallback(function(notif) {
    var item = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 11),
      time: 'Just now',
      read: false,
      title: notif.title,
      message: notif.message,
      type: notif.type || 'system',
      link: notif.link || '#'
    };

    setNotifications(function(prev) {
      var next = [item];
      for (var i = 0; i < prev.length; i++) {
        next.push(prev[i]);
      }
      return next.slice(0, 50);
    });

    setToasts(function(prev) {
      var next = [item];
      for (var j = 0; j < prev.length; j++) {
        next.push(prev[j]);
      }
      return next.slice(0, 5);
    });

    if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(item.title, { body: item.message });
      } catch { /* ignore */ }
    }

    setTimeout(function() {
      setToasts(function(prev) {
        return prev.filter(function(t) { return t.id !== item.id; });
      });
    }, 6000);
  }, []);

  var dismissToast = useCallback(function(toastId) {
    setToasts(function(prev) {
      return prev.filter(function(t) { return t.id !== toastId; });
    });
  }, []);

  function resetRealtimeBaseline() {
    baselineReady.current = false;
    seenEnrollmentIds.current = new Set();
    seenSubmissionKeys.current = new Set();
    seenReportIds.current = new Set();
    seenConvLastMessageTime.current = {};
  }

  function seedRealtimeBaseline(pending, reportsList, convList, currentUser) {
    for (var i = 0; i < pending.length; i++) {
      seenEnrollmentIds.current.add(pending[i].id);
    }
    for (var r = 0; r < reportsList.length; r++) {
      var report = reportsList[r];
      if (currentUser.role === 'instructor' && report.department === currentUser.department) {
        seenReportIds.current.add(report.id);
      }
      var subs = report.submissions || [];
      for (var s = 0; s < subs.length; s++) {
        seenSubmissionKeys.current.add(report.id + '-' + subs[s].instructor_id + '-' + subs[s].id);
      }
    }
    for (var c = 0; c < convList.length; c++) {
      if (convList[c].last_message_time) {
        seenConvLastMessageTime.current[convList[c].id] = String(convList[c].last_message_time);
      }
    }
    baselineReady.current = true;
  }

  function detectRealtimeChanges(pending, reportsList, convList, currentUser) {
    if (!baselineReady.current || !currentUser) return;

    if (currentUser.role === 'admin') {
      for (var i = 0; i < pending.length; i++) {
        var enrollment = pending[i];
        if (!seenEnrollmentIds.current.has(enrollment.id)) {
          seenEnrollmentIds.current.add(enrollment.id);
          var enrollName = enrollment.student_name || enrollment.firstName || 'A student';
          pushNotification({
            title: 'New Enrollment',
            message: enrollName + ' submitted an enrollment application',
            type: 'enrollment',
            link: '/admin/dashboard'
          });
        }
      }

      for (var r = 0; r < reportsList.length; r++) {
        var report = reportsList[r];
        var subs = report.submissions || [];
        for (var s = 0; s < subs.length; s++) {
          var subKey = report.id + '-' + subs[s].instructor_id + '-' + subs[s].id;
          if (!seenSubmissionKeys.current.has(subKey)) {
            seenSubmissionKeys.current.add(subKey);
            pushNotification({
              title: 'New Report Submission',
              message: 'Report "' + (report.title || 'Untitled') + '" was submitted',
              type: 'report',
              link: '/reports'
            });
          }
        }
      }
    }

    if (currentUser.role === 'instructor') {
      for (var ir = 0; ir < reportsList.length; ir++) {
        var instReport = reportsList[ir];
        if (instReport.department === currentUser.department && !seenReportIds.current.has(instReport.id)) {
          seenReportIds.current.add(instReport.id);
          pushNotification({
            title: 'New Report Assignment',
            message: 'New report: ' + (instReport.title || 'Untitled'),
            type: 'report',
            link: '/reports'
          });
        }
      }
    }
  }

  async function checkConversationMessages(convList, currentUser) {
    if (!baselineReady.current || !currentUser) return;

    for (var i = 0; i < convList.length; i++) {
      var conv = convList[i];
      var currTime = conv.last_message_time ? String(conv.last_message_time) : null;
      var prevTime = seenConvLastMessageTime.current[conv.id];

      if (currTime && prevTime && currTime !== prevTime) {
        var lastMsg = conv.last_message || '';
        var isOwnMessage = conv.last_sender_id === currentUser.id;

        if (!isOwnMessage && lastMsg) {
          var senderName = conv.last_sender_name || conv.with || 'Someone';
          var preview = lastMsg.startsWith('data:') ? 'Sent a file'
                      : lastMsg.startsWith('📸') ? 'Sent a photo'
                      : lastMsg.startsWith('🎤') ? 'Sent a voice message'
                      : lastMsg.startsWith('📎') ? 'Sent a file'
                      : lastMsg;
          if (preview.length > 80) preview = preview.slice(0, 80) + '…';
          pushNotification({
            title: 'New Message',
            message: senderName + ': ' + preview,
            type: 'message',
            link: '/chat'
          });
        }

        try {
          var msgs = await conversationsAPI.getMessages(conv.id);
          if (msgs.length > 0) {
            // Capture convId and fetchedMsgs in block scope so the setMessages
            // callback always closes over THIS iteration's values, not whichever
            // value `conv`/`msgs` (var-scoped) end up with after the loop advances.
            (function(convId, fetchedMsgs) {
              setMessages(function(prev) {
                var next = {};
                for (var key in prev) {
                  next[key] = prev[key];
                }
                // Merge polled messages with any locally-added messages that
                // haven't been confirmed by the server yet (sent in the last 10s).
                // This prevents a polling cycle from temporarily removing a just-sent
                // message from the UI before the next poll includes it.
                var local = prev[convId] || [];
                var fetchedIds = new Set(fetchedMsgs.map(function(m) { return String(m.id); }));
                var cutoff = Date.now() - 10000; // keep local-only msgs < 10s old
                var localOnly = local.filter(function(m) {
                  return !fetchedIds.has(String(m.id)) &&
                    new Date(m.created_at || 0).getTime() > cutoff;
                });
                next[convId] = fetchedMsgs.concat(localOnly);
                return next;
              });
            })(conv.id, msgs);
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

  async function mergeAllInstructorsGroup(usersData, conversationsData, currentUser) {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'instructor')) {
      return conversationsData;
    }
    if (hasAllInstructorsGroup(conversationsData)) {
      return conversationsData;
    }
    var groupChat = await ensureAllInstructorsGroup(usersData, currentUser);
    if (!groupChat) return conversationsData;
    var merged = [groupChat];
    for (var i = 0; i < conversationsData.length; i++) {
      merged.push(conversationsData[i]);
    }
    setConversations(merged);
    setMessages(function(prev) {
      var next = {};
      for (var key in prev) {
        next[key] = prev[key];
      }
      if (!next[groupChat.id]) {
        next[groupChat.id] = [];
      }
      return next;
    });
    return merged;
  }

  async function refreshLiveData() {
    if (!user || window.__nstp_session_expired__) return;
    try {
      var reportsData = await reportsAPI.getAll();
      setReports(reportsData);

      var usersData = users;
      if (!usersData.length) {
        usersData = await usersAPI.getAll();
        setUsers(usersData);
      }

      var conversationsData = await conversationsAPI.getAll();
      conversationsData = await mergeAllInstructorsGroup(usersData, conversationsData, user);
      setConversations(conversationsData);

      var pending = pendingEnrollments;
      if (user.role === 'admin') {
        var enrollmentsData = await enrollmentsAPI.getAll();
        pending = [];
        for (var i = 0; i < enrollmentsData.length; i++) {
          if (enrollmentsData[i].status === 'Pending') {
            pending.push(enrollmentsData[i]);
          }
        }
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
  useEffect(function() {
    if (!user) return;
    var saved = localStorage.getItem(getNotificationStorageKey(user.role));
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(function() {});
    }
  }, [user]);

  useEffect(function() {
    if (!user) return;
    localStorage.setItem(getNotificationStorageKey(user.role), JSON.stringify(notifications));
  }, [notifications, user]);

  // Real-time polling while logged in
  useEffect(function() {
    if (!user || loading) return;

    refreshLiveData();
    var interval = setInterval(refreshLiveData, POLL_INTERVAL_MS);
    return function() {
      clearInterval(interval);
    };
  }, [user, loading]);

  // Poll for incoming/outgoing calls
  useEffect(function() {
    if (!user) return;

    async function pollCalls() {
      try {
        var incomingList = await callsAPI.getIncoming();
        if (incomingList.length > 0) {
          setIncomingCall(incomingList[0]);
        } else {
          setIncomingCall(null);
        }

        if (outgoingCallIdRef.current) {
          var outgoing = await callsAPI.getById(outgoingCallIdRef.current);
          setOutgoingCallStatus(outgoing.status);
        }
      } catch {
        /* ignore poll errors */
      }
    }

    pollCalls();
    var callInterval = setInterval(pollCalls, 2000);
    return function() {
      clearInterval(callInterval);
    };
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

  // Handle session expiry: api.js dispatches this event instead of hard-reloading the page.
  // This lets React Router navigate to login smoothly without destroying any open form.
  useEffect(function() {
    function onSessionExpired() {
      window.__nstp_session_expired__ = true;
      // Show a visible banner so the user knows why they were redirected,
      // instead of silently "going back" with no explanation.
      var banner = document.createElement('div');
      banner.id = 'session-expired-banner';
      banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
        'background:#dc2626', 'color:#fff', 'text-align:center',
        'padding:14px 16px', 'font-size:15px', 'font-weight:600',
        'box-shadow:0 2px 8px rgba(0,0,0,.35)'
      ].join(';');
      banner.textContent = 'Your session has expired. Please log in again.';
      document.body.appendChild(banner);
      setTimeout(function() {
        var el = document.getElementById('session-expired-banner');
        if (el) el.remove();
      }, 5000);
      setUser(null);
      setLoading(false);
      // ProtectedRoute will redirect to /login automatically when user becomes null.
    }
    window.addEventListener('nstp-session-expired', onSessionExpired);
    return function() {
      window.removeEventListener('nstp-session-expired', onSessionExpired);
    };
  }, []);

  // Load user from token on mount
  useEffect(function() {
    var token = localStorage.getItem('nstp_token');
    if (token) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Load current user data
  async function loadCurrentUser() {
    try {
      var userData = await usersAPI.getMe();
      setUser(userData);
      await loadAllData(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      // api.js handles 401/403 (dispatches nstp-session-expired event + clears token).
      // Only set loading=false here; do NOT clear the token for 500/network errors.
      setLoading(false);
    }
  }

  // Load all data from API — fire independent requests in parallel then wait
  async function loadAllData(currentUser) {
    try {
      // All six requests fire at the same time instead of waiting one by one.
      var results = await Promise.all([
        usersAPI.getAll(),
        studentsAPI.getAll(),
        reportsAPI.getAll(),
        enrollmentsAPI.getAll(),
        conversationsAPI.getAll(),
        archivesAPI.getAll().catch(function() { return []; }),
        archivesAPI.getCurrentBatch().catch(function() { return { year: new Date().getFullYear() }; })
      ]);
      var usersData        = results[0];
      var studentsData     = results[1];
      var reportsData      = results[2];
      var enrollmentsData  = results[3];
      var conversationsData = results[4];
      var archivesData     = results[5];
      var batchData        = results[6];

      setUsers(usersData);
      setStudents(studentsData);
      setReports(reportsData);

      var pending = [];
      for (var i = 0; i < enrollmentsData.length; i++) {
        if (enrollmentsData[i].status === 'Pending') {
          pending.push(enrollmentsData[i]);
        }
      }
      setPendingEnrollments(pending);

      var activeUser = currentUser || user;
      conversationsData = await mergeAllInstructorsGroup(usersData, conversationsData, activeUser);
      setConversations(conversationsData);
      setArchivedYears(archivesData);
      setCurrentBatch(batchData.year.toString());

      // Load messages for all conversations in parallel (not one by one)
      var messagePromises = conversationsData.map(function(conv) {
        return conversationsAPI.getMessages(conv.id)
          .then(function(msgs) { return { id: conv.id, msgs: msgs }; })
          .catch(function() { return { id: conv.id, msgs: [] }; });
      });
      var messageResults = await Promise.all(messagePromises);
      var messagesData = {};
      for (var p = 0; p < messageResults.length; p++) {
        messagesData[messageResults[p].id] = messageResults[p].msgs;
      }
      setMessages(messagesData);

      if (activeUser) {
        resetRealtimeBaseline();
        seedRealtimeBaseline(pending, reportsData, conversationsData, activeUser);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      var response = await authAPI.login(email, password);
      if (response.token) {
        window.__nstp_session_expired__ = false; // reset flag for new session
        localStorage.setItem('nstp_token', response.token);
        setUser(response.user);
        await loadAllData(response.user);
        return { success: true, role: response.user.role };
      } else {
        return { success: false, message: 'Invalid server response' };
      }
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
    try {
      var updated = await usersAPI.update(user.id, updatedData);
      setUser(updated);
      var usersData = await usersAPI.getAll();
      setUsers(usersData);
      return updated;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async function changeUserPassword(newPassword) {
    try {
      await usersAPI.changePassword(user.id, newPassword);
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Student management
  async function addStudentFunc(student) {
    try {
      var newStudent = await studentsAPI.add(student);
      var studentsData = await studentsAPI.getAll();
      setStudents(studentsData);
      return newStudent;
    } catch (error) {
      console.error('Add student error:', error);
      throw error;
    }
  }

  async function updateStudentFunc(id, data) {
    try {
      var updated = await studentsAPI.update(id, data);
      setStudents(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id === id) {
            newArr.push(updated);
          } else {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });
      return updated;
    } catch (error) {
      console.error('Update student error:', error);
      throw error;
    }
  }

  async function deleteStudentFunc(id) {
    try {
      await studentsAPI.delete(id);
      setStudents(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id !== id) {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });
    } catch (error) {
      console.error('Delete student error:', error);
      throw error;
    }
  }

  // Enrollment management
  async function submitEnrollmentFunc(enrollment) {
    try {
      var newEnrollment = await enrollmentsAPI.submit(enrollment);
      setPendingEnrollments(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          newArr.push(prev[i]);
        }
        newArr.push(newEnrollment);
        return newArr;
      });
      return newEnrollment;
    } catch (error) {
      console.error('Submit enrollment error:', error);
      throw error;
    }
  }

  async function approveEnrollmentFunc(id) {
    try {
      var updated = await enrollmentsAPI.update(id, 'Approved');
      setPendingEnrollments(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id !== id) {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });
      var studentsData = await studentsAPI.getAll();
      setStudents(studentsData);
      return updated;
    } catch (error) {
      console.error('Approve enrollment error:', error);
      throw error;
    }
  }

  async function declineEnrollmentFunc(id) {
    try {
      await enrollmentsAPI.update(id, 'Declined');
      setPendingEnrollments(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id !== id) {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });
    } catch (error) {
      console.error('Decline enrollment error:', error);
      throw error;
    }
  }

  // Report management
  async function addReportFunc(report) {
    try {
      var newReport = await reportsAPI.add(report);
      var reportsData = await reportsAPI.getAll();
      setReports(reportsData);
      return newReport;
    } catch (error) {
      console.error('Add report error:', error);
      throw error;
    }
  }

  async function updateReportFunc(id, data) {
    try {
      var updated = await reportsAPI.update(id, data);
      setReports(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id === id) {
            newArr.push(updated);
          } else {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });
      return updated;
    } catch (error) {
      console.error('Update report error:', error);
      throw error;
    }
  }

  async function deleteReportFunc(id) {
    try {
      await reportsAPI.delete(id);
      setReports(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id !== id) {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });
    } catch (error) {
      console.error('Delete report error:', error);
      throw error;
    }
  }

  async function submitReportFunc(reportId, submission) {
    try {
      await reportsAPI.submit(reportId, submission.content, submission.attachment?.data, submission.attachment?.name);
      var reportsData = await reportsAPI.getAll();
      setReports(reportsData);
    } catch (error) {
      console.error('Submit report error:', error);
      throw error;
    }
  }

  async function editMessageFunc(conversationId, messageId, newText) {
    try {
      var updated = await conversationsAPI.editMessage(conversationId, messageId, newText);
      
      setMessages(function(prev) {
        var newObj = {};
        for (var key in prev) {
          if (key === conversationId) {
            var newMsgs = [];
            for (var i = 0; i < prev[key].length; i++) {
              if (prev[key][i].id === messageId) {
                var copied = {};
                for (var prop in prev[key][i]) {
                  copied[prop] = prev[key][i][prop];
                }
                copied.text = newText;
                copied.edited = 1;
                newMsgs.push(copied);
              } else {
                newMsgs.push(prev[key][i]);
              }
            }
            newObj[key] = newMsgs;
          } else {
            newObj[key] = prev[key];
          }
        }
        return newObj;
      });
      
      return updated;
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  }

  async function deleteMessageFunc(conversationId, messageId, forEveryone) {
    if (forEveryone === undefined) forEveryone = false;
    try {
      await conversationsAPI.deleteMessage(conversationId, messageId, forEveryone);
      
      setMessages(function(prev) {
        var newObj = {};
        for (var key in prev) {
          if (key === conversationId) {
            var newMsgs = [];
            for (var i = 0; i < prev[key].length; i++) {
              if (prev[key][i].id === messageId) {
                var copied = {};
                for (var prop in prev[key][i]) {
                  copied[prop] = prev[key][i][prop];
                }
                copied.deleted_for_everyone = forEveryone;
                copied.deletedForEveryone = forEveryone;
                copied.type = forEveryone ? 'deleted' : copied.type;
                if (forEveryone) {
                  copied.text = '[deleted]';
                } else {
                  var deletedFor = [];
                  if (copied.deleted_for) {
                    try {
                      deletedFor = typeof copied.deleted_for === 'string'
                        ? JSON.parse(copied.deleted_for)
                        : copied.deleted_for;
                    } catch {
                      deletedFor = [];
                    }
                  }
                  if (user && deletedFor.indexOf(user.id) < 0) {
                    deletedFor.push(user.id);
                  }
                  copied.deleted_for = JSON.stringify(deletedFor);
                  copied.deletedForMe = true;
                }
                newMsgs.push(copied);
              } else {
                newMsgs.push(prev[key][i]);
              }
            }
            newObj[key] = newMsgs;
          } else {
            newObj[key] = prev[key];
          }
        }
        return newObj;
      });
      
      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  async function restoreMessageFunc(conversationId, messageId) {
    try {
      var restored = await conversationsAPI.restoreMessage(conversationId, messageId);

      setMessages(function(prev) {
        var newObj = {};
        for (var key in prev) {
          if (key === conversationId) {
            var newMsgs = [];
            for (var i = 0; i < prev[key].length; i++) {
              if (prev[key][i].id === messageId) {
                newMsgs.push(restored);
              } else {
                newMsgs.push(prev[key][i]);
              }
            }
            newObj[key] = newMsgs;
          } else {
            newObj[key] = prev[key];
          }
        }
        return newObj;
      });

      return restored;
    } catch (error) {
      console.error('Restore message error:', error);
      throw error;
    }
  }

  async function addReactionFunc(conversationId, messageId, emoji) {
    try {
      var result = await conversationsAPI.addReaction(conversationId, messageId, emoji);
      
      setMessages(function(prev) {
        var newObj = {};
        for (var key in prev) {
          if (key === conversationId) {
            var newMsgs = [];
            for (var i = 0; i < prev[key].length; i++) {
              if (prev[key][i].id === messageId) {
                var copied = {};
                for (var prop in prev[key][i]) {
                  copied[prop] = prev[key][i][prop];
                }
                copied.reactions = result.reactions;
                newMsgs.push(copied);
              } else {
                newMsgs.push(prev[key][i]);
              }
            }
            newObj[key] = newMsgs;
          } else {
            newObj[key] = prev[key];
          }
        }
        return newObj;
      });
      
      return result;
    } catch (error) {
      console.error('Add reaction error:', error);
      throw error;
    }
  }

  async function addReportCommentFunc(reportId, comment) {
    try {
      const saved = await reportsAPI.addComment(reportId, comment.text);
      setReports(function(prev) {
        return prev.map(function(r) {
          if (r.id !== reportId) return r;
          return { ...r, comments: [...(r.comments || []), saved] };
        });
      });
      return saved;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  // Chat functions
  async function startConversationFunc(withUser) {
    try {
      var conversation = await conversationsAPI.create(withUser.id);
      var exists = false;
      for (var i = 0; i < conversations.length; i++) {
        if (conversations[i].id === conversation.id) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        setConversations(function(prev) {
          var newArr = [conversation];
          for (var j = 0; j < prev.length; j++) {
            newArr.push(prev[j]);
          }
          return newArr;
        });
        setMessages(function(prev) {
          var newObj = {};
          for (var key in prev) {
            newObj[key] = prev[key];
          }
          newObj[conversation.id] = [];
          return newObj;
        });
      }
      return conversation;
    } catch (error) {
      console.error('Start conversation error:', error);
      throw error;
    }
  }

  async function createGroupChatFunc(name, participantIds) {
    try {
      var conversation = await conversationsAPI.createGroup(name, participantIds);
      var exists = false;
      for (var i = 0; i < conversations.length; i++) {
        if (conversations[i].id === conversation.id) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        setConversations(function(prev) {
          var newArr = [conversation];
          for (var j = 0; j < prev.length; j++) {
            newArr.push(prev[j]);
          }
          return newArr;
        });
        setMessages(function(prev) {
          var newObj = {};
          for (var key in prev) {
            newObj[key] = prev[key];
          }
          newObj[conversation.id] = [];
          return newObj;
        });
      }
      return conversation;
    } catch (error) {
      console.error('Create group chat error:', error);
      throw error;
    }
  }

  async function sendMessageFunc(conversationId, message) {
    try {
      var msgType = message.type ? message.type : 'text';
      var newMsg = await conversationsAPI.sendMessage(conversationId, {
        text: message.text,
        type: msgType,
        image_url: message.imageUrl,
        file_url: message.fileUrl,
        file_name: message.fileName,
        audio_url: message.audioUrl,
        duration: message.duration
      });
      var msgWithTime = {};
      for (var prop in newMsg) {
        msgWithTime[prop] = newMsg[prop];
      }
      var date = new Date(newMsg.created_at);
      msgWithTime.time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (newMsg.sender_id != null) {
        msgWithTime.senderId = newMsg.sender_id;
        msgWithTime.sender_id = newMsg.sender_id;
      } else if (user) {
        msgWithTime.senderId = user.id;
        msgWithTime.sender_id = user.id;
      }

      setMessages(function(prev) {
        var newObj = {};
        for (var key in prev) {
          newObj[key] = prev[key];
        }
        var existing = prev[conversationId] ? prev[conversationId] : [];
        var newArr = [];
        for (var i = 0; i < existing.length; i++) {
          newArr.push(existing[i]);
        }
        newArr.push(msgWithTime);
        newObj[conversationId] = newArr;
        return newObj;
      });

      setConversations(function(prev) {
        // Build the same preview text the backend uses so the sidebar
        // updates immediately for the sender without waiting for a poll.
        var msgType = message.type || 'text';
        var preview = message.text;
        if (!preview || preview.trim() === '') {
          if (msgType === 'image') preview = '📸 Photo';
          else if (msgType === 'file') preview = '📎 ' + (message.fileName || 'File');
          else if (msgType === 'voice') preview = '🎤 Voice message';
          else preview = 'Message';
        }
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id === conversationId) {
            var copied = {};
            for (var prop in prev[i]) {
              copied[prop] = prev[i][prop];
            }
            copied.last_message = preview;
            copied.last_message_time = new Date().toISOString();
            newArr.push(copied);
          } else {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });

      return msgWithTime;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async function deleteConversationFunc(conversationId) {
    try {
      await conversationsAPI.delete(conversationId);
      setConversations(function(prev) {
        var newArr = [];
        for (var i = 0; i < prev.length; i++) {
          if (prev[i].id !== conversationId) {
            newArr.push(prev[i]);
          }
        }
        return newArr;
      });
      setMessages(function(prev) {
        var newObj = {};
        for (var key in prev) {
          if (key !== conversationId) {
            newObj[key] = prev[key];
          }
        }
        return newObj;
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }

  function clearMessagesFunc(conversationId) {
    setMessages(function(prev) {
      var newObj = {};
      for (var key in prev) {
        newObj[key] = prev[key];
      }
      newObj[conversationId] = [];
      return newObj;
    });
  }

  function getUserConversations() {
    if (!user) return [];
    var result = [];
    for (var i = 0; i < conversations.length; i++) {
      var c = conversations[i];
      if (c.participant_1_id === user.id || c.participant_2_id === user.id) {
        result.push(c);
      } else if (c.isGroup && c.participants) {
        for (var j = 0; j < c.participants.length; j++) {
          if (c.participants[j] === user.id) {
            result.push(c);
            break;
          }
        }
      }
    }
    return result;
  }

  async function clearBatchData() {
    await clearBatch();
    setStudents([]);
    setReports([]);
  }

  var contextValue = {
    user: user, login: login, logout: logout, updateUser: updateUserData, changePassword: changeUserPassword, allUsers: users,
    students: students, reports: reports, conversations: getUserConversations(), messages: messages, pendingEnrollments: pendingEnrollments,
    archivedYears: archivedYears, currentBatch: currentBatch,
    viewingArchive: viewingArchive, archiveViewData: archiveViewData,
    setViewingArchive: setViewingArchive, setArchiveViewData: setArchiveViewData,
    addStudent: addStudentFunc, updateStudent: updateStudentFunc, deleteStudent: deleteStudentFunc,
    addReport: addReportFunc, updateReport: updateReportFunc, deleteReport: deleteReportFunc, submitReport: submitReportFunc, addReportComment: addReportCommentFunc,
    startConversation: startConversationFunc, createGroupChat: createGroupChatFunc, sendMessage: sendMessageFunc, getUserConversations: getUserConversations, editMessage: editMessageFunc, addReaction: addReactionFunc, deleteMessage: deleteMessageFunc, restoreMessage: restoreMessageFunc,
    deleteConversation: deleteConversationFunc, clearMessages: clearMessagesFunc,
    clearBatchData: clearBatchData, submitEnrollment: submitEnrollmentFunc, approveEnrollment: approveEnrollmentFunc, declineEnrollment: declineEnrollmentFunc,
    loading: loading, refreshData: loadAllData, refreshLiveData: refreshLiveData,
    notifications: notifications, setNotifications: setNotifications, pushNotification: pushNotification,
    toasts: toasts, dismissToast: dismissToast,
    incomingCall: incomingCall, outgoingCallStatus: outgoingCallStatus,
    pendingAnsweredCall: pendingAnsweredCall, setPendingAnsweredCall: setPendingAnsweredCall,
    registerOutgoingCall: registerOutgoingCall, clearOutgoingCall: clearOutgoingCall,
    answerIncomingCall: answerIncomingCall, declineIncomingCall: declineIncomingCall
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
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Profile /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
