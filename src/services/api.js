const API_URL = 'http://localhost:3001/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add auth token if available
  const token = localStorage.getItem('nstp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json();
    // If token is invalid/expired AND user was logged in, clear storage and reload
    // Don't redirect during login (when no token exists)
    if ((response.status === 403 || response.status === 401) && token) {
      localStorage.removeItem('nstp_token');
      localStorage.removeItem('nstp_user');
      window.location.href = '/';
    }
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};

// Auth API
export const authAPI = {
  login: (email, password) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
};

// Users API
export const usersAPI = {
  getAll: () => apiCall('/users'),
  getMe: () => apiCall('/users/me'),
  update: (id, data) => apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  changePassword: (id, newPassword) => apiCall(`/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword })
  })
};

// Students API
export const studentsAPI = {
  getAll: () => apiCall('/students'),
  add: (data) => apiCall('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/students/${id}`, {
    method: 'DELETE'
  })
};

// Reports API
export const reportsAPI = {
  getAll: () => apiCall('/reports'),
  add: (data) => apiCall('/reports', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  submit: (id, content) => apiCall(`/reports/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  delete: (id) => apiCall(`/reports/${id}`, {
    method: 'DELETE'
  })
};

// Conversations API
export const conversationsAPI = {
  getAll: () => apiCall('/conversations'),
  create: (withUserId) => apiCall('/conversations', {
    method: 'POST',
    body: JSON.stringify({ withUserId })
  }),
  createGroup: (name, participants) => apiCall('/conversations/group', {
    method: 'POST',
    body: JSON.stringify({ name, participants })
  }),
  getMessages: (id) => apiCall(`/conversations/${id}/messages`),
  sendMessage: (id, data) => apiCall(`/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  editMessage: (conversationId, messageId, text) => apiCall(`/conversations/${conversationId}/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ text })
  }),
  deleteMessage: (conversationId, messageId, forEveryone = false) => apiCall(`/conversations/${conversationId}/messages/${messageId}?forEveryone=${forEveryone}`, {
    method: 'DELETE'
  }),
  addReaction: (conversationId, messageId, emoji) => apiCall(`/conversations/${conversationId}/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji })
  }),
  delete: (id) => apiCall(`/conversations/${id}`, {
    method: 'DELETE'
  })
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: () => apiCall('/enrollments'),
  submit: (data) => apiCall('/enrollments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, status) => apiCall(`/enrollments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
};

// Archives API - Database backed
export const archivesAPI = {
  getAll: () => apiCall('/archives'),
  getByYear: (year) => apiCall(`/archives/${year}`),
  create: (data) => apiCall('/archives', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  delete: (year) => apiCall(`/archives/${year}`, {
    method: 'DELETE'
  }),
  getCurrentBatch: () => apiCall('/current-batch')
};

// Calls API
export const callsAPI = {
  initiate: (conversationId, callType) => apiCall('/calls', {
    method: 'POST',
    body: JSON.stringify({ conversation_id: conversationId, call_type: callType })
  }),
  getIncoming: () => apiCall('/calls/incoming'),
  answer: (callId) => apiCall(`/calls/${callId}/answer`, {
    method: 'PUT'
  }),
  end: (callId, status) => apiCall(`/calls/${callId}/end`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
};

// Health check
export const healthCheck = () => apiCall('/health');
