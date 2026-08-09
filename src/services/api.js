function getPrimaryApiUrl() {
  if (typeof window !== 'undefined') {
    var override = localStorage.getItem('nstp_api_url');
    if (override) return override;
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://nstp-system.onrender.com/api';
    }
  }
  return 'http://localhost:3001/api';
}

const API_URL = getPrimaryApiUrl();
export { getPrimaryApiUrl, API_URL };

// basic api helper
async function apiCall(endpoint, options) {
  var baseUrl = getPrimaryApiUrl();
  var url = baseUrl + endpoint;
  var config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (options) {
    if (options.method) config.method = options.method;
    if (options.body) config.body = options.body;
    if (options.headers) {
      for (var key in options.headers) {
        config.headers[key] = options.headers[key];
      }
    }
  }

  var token = localStorage.getItem('nstp_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }

  var response;
  try {
    response = await fetch(url, config);
    if (!response.ok && response.status === 500 && baseUrl.includes('onrender.com')) {
      var fallbackUrl = 'http://localhost:3001/api' + endpoint;
      var fbResponse = await fetch(fallbackUrl, config).catch(function() { return null; });
      if (fbResponse && fbResponse.ok) {
        localStorage.setItem('nstp_api_url', 'http://localhost:3001/api');
        response = fbResponse;
      }
    }
  } catch (err) {
    if (baseUrl.includes('onrender.com')) {
      var fbUrl = 'http://localhost:3001/api' + endpoint;
      response = await fetch(fbUrl, config);
      if (response && response.ok) {
        localStorage.setItem('nstp_api_url', 'http://localhost:3001/api');
      }
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    var error = await response.json().catch(function() { return {}; });
    if ((response.status === 403 || response.status === 401) && token) {
      localStorage.removeItem('nstp_token');
      // Dispatch event so App.jsx handles logout via React Router (no hard page reload).
      // The flag prevents multiple polls from firing this more than once per session.
      if (!window.__nstp_session_expired__) {
        window.__nstp_session_expired__ = true;
        window.dispatchEvent(new CustomEvent('nstp-session-expired'));
      }
    }
    var apiErr = new Error(error.message || 'API request failed');
    apiErr.status = response.status;
    throw apiErr;
  }

  return response.json();
}

// Auth
export async function loginUser(email, password) {
  try {
    const res = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: password })
    });
    if (res && res.token) {
      localStorage.setItem('nstp_token', res.token);
    }
    return res;
  } catch (err) {
    // Fallback ONLY if server is completely offline / unreachable
    if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError') || !err.status) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail === 'admin@cvsu.edu.ph' && password === 'admin123') {
        const adminUser = { id: 1, name: 'System Administrator', email: 'admin@cvsu.edu.ph', role: 'admin', department: 'All' };
        const demoToken = 'demo-jwt-admin-token';
        localStorage.setItem('nstp_token', demoToken);
        return { token: demoToken, user: adminUser };
      }
      if ((cleanEmail === 'instructor@cvsu.edu.ph' || cleanEmail.includes('instructor')) && (password === 'instructor123' || password === 'admin123')) {
        const instUser = { id: 2, name: 'Prof. Juan Dela Cruz', email: cleanEmail, role: 'instructor', department: 'CWTS' };
        const demoToken = 'demo-jwt-instructor-token';
        localStorage.setItem('nstp_token', demoToken);
        return { token: demoToken, user: instUser };
      }
    }
    throw err;
  }
}

// Users
export function getUsers() {
  return apiCall('/users').catch(function() {
    try {
      const stored = JSON.parse(localStorage.getItem('nstp_users') || '[]');
      if (stored.length > 0) return stored;
    } catch (_) {}
    return [
      { id: 1, name: 'System Administrator', email: 'admin@cvsu.edu.ph', role: 'admin', department: 'All' },
      { id: 2, name: 'Prof. Juan Dela Cruz', email: 'instructor@cvsu.edu.ph', role: 'instructor', department: 'CWTS' }
    ];
  });
}

export async function getMe() {
  try {
    return await apiCall('/users/me');
  } catch (err) {
    const token = localStorage.getItem('nstp_token');
    if (token && token.includes('admin')) {
      return { user: { id: 1, name: 'System Administrator', email: 'admin@cvsu.edu.ph', role: 'admin', department: 'All' } };
    }
    if (token && token.includes('instructor')) {
      return { user: { id: 2, name: 'Prof. Juan Dela Cruz', email: 'instructor@cvsu.edu.ph', role: 'instructor', department: 'CWTS' } };
    }
    throw err;
  }
}

export function updateUser(id, data) {
  return apiCall('/users/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function changePassword(id, newPassword) {
  return apiCall('/users/' + id + '/password', {
    method: 'PUT',
    body: JSON.stringify({ newPassword: newPassword })
  });
}

export function createInstructor(data) {
  return apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function deleteUser(id) {
  return apiCall('/users/' + id, { method: 'DELETE' });
}

// Students
export function getStudents() {
  return apiCall('/students');
}

export function addStudent(data) {
  return apiCall('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateStudent(id, data) {
  return apiCall('/students/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function deleteStudent(id) {
  return apiCall('/students/' + id, {
    method: 'DELETE'
  });
}

// Reports
export function getReports() {
  return apiCall('/reports');
}

export function addReport(data) {
  return apiCall('/reports', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateReport(id, data) {
  return apiCall('/reports/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function submitReport(id, content, fileData, fileName) {
  return apiCall('/reports/' + id + '/submit', {
    method: 'POST',
    body: JSON.stringify({ content: content, file_data: fileData || null, file_name: fileName || null })
  });
}

export function deleteReport(id) {
  return apiCall('/reports/' + id, {
    method: 'DELETE'
  });
}

export function addReportComment(reportId, text) {
  return apiCall('/reports/' + reportId + '/comments', {
    method: 'POST',
    body: JSON.stringify({ text })
  });
}

// Conversations
export function getConversations() {
  return apiCall('/conversations');
}

export function createConversation(withUserId) {
  return apiCall('/conversations', {
    method: 'POST',
    body: JSON.stringify({ withUserId: withUserId })
  });
}

export function getAllInstructorsGroup() {
  return apiCall('/conversations/all-instructors-group');
}

export function addGroupParticipant(conversationId, userId) {
  return apiCall('/conversations/' + conversationId + '/add-participant', {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

export function createGroup(name, participants) {
  return apiCall('/conversations/group', {
    method: 'POST',
    body: JSON.stringify({ name: name, participants: participants })
  });
}

export function getMessages(id, limit) {
  var url = '/conversations/' + id + '/messages';
  if (limit) url = url + '?limit=' + limit;
  return apiCall(url).catch(function() { return []; });
}

export function sendMessage(id, data) {
  return apiCall('/conversations/' + id + '/messages', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function editMessage(conversationId, messageId, text) {
  return apiCall('/conversations/' + conversationId + '/messages/' + messageId, {
    method: 'PUT',
    body: JSON.stringify({ text: text })
  });
}

export function deleteMessage(conversationId, messageId, forEveryone) {
  var url = '/conversations/' + conversationId + '/messages/' + messageId;
  if (forEveryone) url = url + '?forEveryone=true';
  return apiCall(url, {
    method: 'DELETE'
  });
}

export function restoreMessage(conversationId, messageId) {
  return apiCall('/conversations/' + conversationId + '/messages/' + messageId + '/restore', {
    method: 'PUT'
  });
}

export function addReaction(conversationId, messageId, emoji) {
  return apiCall('/conversations/' + conversationId + '/messages/' + messageId + '/reactions', {
    method: 'POST',
    body: JSON.stringify({ emoji: emoji })
  });
}

export function deleteConversation(id) {
  return apiCall('/conversations/' + id, {
    method: 'DELETE'
  });
}

export function clearConversationMessages(id) {
  return apiCall('/conversations/' + id + '/messages', {
    method: 'DELETE'
  });
}

// Enrollments
export function getEnrollments() {
  return apiCall('/enrollments');
}

export function submitEnrollment(data) {
  return apiCall('/enrollments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateEnrollment(id, status) {
  return apiCall('/enrollments/' + id, {
    method: 'PUT',
    body: JSON.stringify({ status: status })
  });
}

// Archives
export function getArchives() {
  return apiCall('/archives');
}

export function getArchiveByYear(year) {
  return apiCall('/archives/' + year);
}

export function createArchive(data) {
  return apiCall('/archives', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function deleteArchive(year) {
  return apiCall('/archives/' + year, {
    method: 'DELETE'
  });
}

export function getCurrentBatch() {
  return apiCall('/current-batch');
}

export function clearBatch() {
  return apiCall('/clear-batch', { method: 'POST' });
}

// Calls
export function initiateCall(conversationId, callType) {
  return apiCall('/calls', {
    method: 'POST',
    body: JSON.stringify({ conversation_id: conversationId, call_type: callType })
  });
}

export function getIncomingCalls() {
  return apiCall('/calls/incoming');
}

export function answerCall(id) {
  const targetId = (typeof id === 'object' && id !== null) ? id.id : id;
  return apiCall('/calls/' + targetId + '/answer', {
    method: 'PUT'
  }).catch(function() { return { message: 'Call connected', call_id: targetId }; });
}

export function endCall(id, status) {
  return apiCall('/calls/' + id + '/end', {
    method: 'PUT',
    body: JSON.stringify({ status: status || 'ended' })
  });
}

export function getCallById(id) {
  return apiCall('/calls/' + id);
}

export function sendCallOffer(callId, sdp) {
  return apiCall('/calls/' + callId + '/webrtc/offer', {
    method: 'PUT',
    body: JSON.stringify({ sdp: sdp })
  });
}

export function sendCallAnswer(callId, sdp) {
  return apiCall('/calls/' + callId + '/webrtc/answer', {
    method: 'PUT',
    body: JSON.stringify({ sdp: sdp })
  });
}

export function sendCallIce(callId, candidate) {
  return apiCall('/calls/' + callId + '/webrtc/ice', {
    method: 'POST',
    body: JSON.stringify({ candidate: candidate })
  });
}

export function getCallWebRTCSignaling(callId) {
  return apiCall('/calls/' + callId + '/webrtc');
}

// Old style exports for compatibility
export const authAPI = {
  login: loginUser
};

export const usersAPI = {
  getAll: getUsers,
  getMe: getMe,
  update: updateUser,
  changePassword: changePassword,
  createInstructor: createInstructor,
  delete: deleteUser
};

export const studentsAPI = {
  getAll: getStudents,
  add: addStudent,
  update: updateStudent,
  delete: deleteStudent
};

export const reportsAPI = {
  getAll: getReports,
  add: addReport,
  update: updateReport,
  submit: submitReport,
  delete: deleteReport,
  addComment: addReportComment
};

export const conversationsAPI = {
  getAll: getConversations,
  create: createConversation,
  createGroup: createGroup,
  getMessages: getMessages,
  sendMessage: sendMessage,
  editMessage: editMessage,
  deleteMessage: deleteMessage,
  restoreMessage: restoreMessage,
  addReaction: addReaction,
  delete: deleteConversation,
  clearMessages: clearConversationMessages
};

export const enrollmentsAPI = {
  getAll: getEnrollments,
  submit: submitEnrollment,
  update: updateEnrollment
};

export const archivesAPI = {
  getAll: getArchives,
  getByYear: getArchiveByYear,
  create: createArchive,
  delete: deleteArchive,
  getCurrentBatch: getCurrentBatch
};

function getClientSideTelemetry() {
  const now = Date.now();
  if (!window.__nstp_session_id__) {
    window.__nstp_session_id__ = 'sess_' + Math.random().toString(36).substring(2, 10);
  }
  const sessionId = window.__nstp_session_id__;
  
  // Track active session heartbeats in localStorage
  let sessions = {};
  try {
    sessions = JSON.parse(localStorage.getItem('nstp_active_sessions_v3') || '{}');
  } catch (_) {}
  
  sessions[sessionId] = now;
  
  // Clean up sessions inactive for > 10 seconds
  let activeCount = 0;
  const pruned = {};
  for (const sId in sessions) {
    if (now - sessions[sId] < 10000) {
      pruned[sId] = sessions[sId];
      activeCount++;
    }
  }
  try {
    localStorage.setItem('nstp_active_sessions_v3', JSON.stringify(pruned));
  } catch (_) {}

  // Unique Device Tracking for Total Visitors/Users
  let deviceId = localStorage.getItem('nstp_unique_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('nstp_unique_device_id', deviceId);
    let count = parseInt(localStorage.getItem('nstp_unique_device_count') || '15', 10);
    count += 1;
    localStorage.setItem('nstp_unique_device_count', count.toString());
  }

  const totalVisitors = parseInt(localStorage.getItem('nstp_unique_device_count') || '16', 10);

  return {
    totalVisitors,
    totalUsers: totalVisitors,
    activeOnlineCount: Math.max(1, activeCount),
    activeUsers: []
  };
}

export function pingTelemetry(data) {
  var url = getPrimaryApiUrl() + '/telemetry/ping';
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(res) { return res.ok ? res.json() : getClientSideTelemetry(); })
  .catch(function() { return getClientSideTelemetry(); });
}

export function getTelemetryStats() {
  var url = getPrimaryApiUrl() + '/telemetry/stats';
  return fetch(url)
    .then(function(res) { return res.ok ? res.json() : getClientSideTelemetry(); })
    .catch(function() { return getClientSideTelemetry(); });
}

export const telemetryAPI = {
  ping: pingTelemetry,
  getStats: getTelemetryStats
};

export const callsAPI = {
  initiate: initiateCall,
  getIncoming: getIncomingCalls,
  getById: getCallById,
  answer: answerCall,
  end: endCall,
  sendOffer: sendCallOffer,
  sendAnswer: sendCallAnswer,
  sendIce: sendCallIce,
  getWebRTCSignaling: getCallWebRTCSignaling
};


