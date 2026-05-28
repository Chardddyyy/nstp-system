const API_URL = 'http://localhost:3001/api';

// basic api helper
async function apiCall(endpoint, options) {
  var url = API_URL + endpoint;
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

  var response = await fetch(url, config);

  if (!response.ok) {
    var error = await response.json().catch(function() { return {}; });
    if ((response.status === 403 || response.status === 401) && token) {
      localStorage.removeItem('nstp_token');
      localStorage.removeItem('nstp_user');
      // Dispatch event so App.jsx handles logout via React Router (no hard page reload).
      // The flag prevents multiple polls from firing this more than once per session.
      if (!window.__nstp_session_expired__) {
        window.__nstp_session_expired__ = true;
        window.dispatchEvent(new CustomEvent('nstp-session-expired'));
      }
    }
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// Auth
export function loginUser(email, password) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email, password: password })
  });
}

// Users
export function getUsers() {
  return apiCall('/users');
}

export function getMe() {
  return apiCall('/users/me');
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

export function submitReport(id, content) {
  return apiCall('/reports/' + id + '/submit', {
    method: 'POST',
    body: JSON.stringify({ content: content })
  });
}

export function deleteReport(id) {
  return apiCall('/reports/' + id, {
    method: 'DELETE'
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

export function createGroup(name, participants) {
  return apiCall('/conversations/group', {
    method: 'POST',
    body: JSON.stringify({ name: name, participants: participants })
  });
}

export function getMessages(id, limit) {
  var url = '/conversations/' + id + '/messages';
  if (limit) url = url + '?limit=' + limit;
  return apiCall(url);
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
  return apiCall('/calls/' + id + '/answer', {
    method: 'PUT'
  });
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
  changePassword: changePassword
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
  delete: deleteReport
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
  delete: deleteConversation
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
