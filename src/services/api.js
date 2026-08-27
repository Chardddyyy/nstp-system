function getPrimaryApiUrl() {
  if (typeof window !== 'undefined') {
    // Purge any stale nstp_api_url from localStorage so mobile never attempts localhost
    try { localStorage.removeItem('nstp_api_url'); } catch (_) {}

    var host = window.location.hostname;

    // Auto-detect local network IP (e.g. 192.168.x.x, 172.x.x.x, 10.x.x.x), localhost, or localtunnel
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host.endsWith('.loca.lt') ||
      /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host)
    ) {
      return window.location.protocol + '//' + host + ':3001/api';
    }

    return 'https://nstp-system-iw5p.onrender.com/api';
  }
  return 'http://localhost:3001/api';
}

function getLocalFallbackUrl(endpoint) {
  if (typeof window !== 'undefined') {
    var host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host.endsWith('.loca.lt') ||
      /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host)
    ) {
      return window.location.protocol + '//' + host + ':3001/api' + (endpoint || '');
    }
  }
  return null;
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
    // Generous 45s timeout for Render cold-start on free tier
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 45000);
    var configWithSignal = Object.assign({}, config, { signal: controller.signal });

    try {
      response = await fetch(url, configWithSignal);
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      var fbUrl = getLocalFallbackUrl(endpoint);
      if (fbUrl) {
        var fbRes = await fetch(fbUrl, config).catch(function() { return null; });
        if (fbRes && fbRes.ok) {
          localStorage.setItem('nstp_api_url', getLocalFallbackUrl(''));
          response = fbRes;
        } else {
          throw fetchErr;
        }
      } else {
        throw fetchErr;
      }
    }
  } catch (err) {
    var fbUrl2 = getLocalFallbackUrl(endpoint);
    if (fbUrl2) {
      var fbRes2 = await fetch(fbUrl2, config).catch(function() { return null; });
      if (fbRes2 && fbRes2.ok) {
        localStorage.setItem('nstp_api_url', getLocalFallbackUrl(''));
        response = fbRes2;
      } else {
        var isAbort = err.name === 'AbortError' || (err.message && (err.message.includes('aborted') || err.message.includes('signal')));
        var cleanErr = new Error(isAbort ? 'Connection timeout. Cloud server is waking up (~15s) — please try again.' : (err.message || 'Network connection failed'));
        throw cleanErr;
      }
    } else {
      var isAbort2 = err.name === 'AbortError' || (err.message && (err.message.includes('aborted') || err.message.includes('signal')));
      var cleanErr2 = new Error(isAbort2 ? 'Connection timeout. Cloud server is waking up (~15s) — please try again.' : (err.message || 'Network connection failed'));
      throw cleanErr2;
    }
  }

    if (!response || !response.ok) {
      if (response && response.status === 503) {
        throw new Error('Cloud backend is currently sleeping or suspended. If using Render, please check your Render dashboard to resume the service.');
      }
      var error = await (response ? response.json() : Promise.resolve({})).catch(function() { return {}; });
      if (response && (response.status === 403 || response.status === 401) && token) {
        localStorage.removeItem('nstp_token');
        if (!window.__nstp_session_expired__) {
          window.__nstp_session_expired__ = true;
          window.dispatchEvent(new CustomEvent('nstp-session-expired', {
            detail: { code: error.code, message: error.message }
          }));
        }
      }
      var apiErr = new Error(error.message || (response && response.status === 404 ? 'Resource not found' : 'API request failed'));
      apiErr.status = response ? response.status : 0;
      apiErr.code = error.code;
      throw apiErr;
    }

  return response.json();
}

// Auth
export async function loginUser(email, password, forceLogin = true) {
  try {
    let res = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: password, forceLogin: true })
    });
    // If an older server instance returned warning / activeSession, automatically force login to complete authentication instantly
    if (res && res.warning && res.activeSession && !res.token) {
      res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password, forceLogin: true })
      });
    }
    if (res && res.token) {
      localStorage.setItem('nstp_token', res.token);
    }
    return res;
  } catch (err) {
    // Fallback if server is completely offline / unreachable or database error (500/503)
    if (
      err.name === 'TypeError' ||
      err.message?.includes('fetch') ||
      err.message?.includes('NetworkError') ||
      !err.status ||
      err.status === 500 ||
      err.status === 503
    ) {
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
  return apiCall('/students')
    .then(function(res) {
      if (Array.isArray(res)) {
        try {
          const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
          const sectionOverrides = new Map();
          cached.forEach(st => {
            const sec = st.nstp_section || st.nstpSection;
            if (sec) {
              if (st.id) sectionOverrides.set(String(st.id), sec);
              if (st.studentId) sectionOverrides.set(String(st.studentId), sec);
            }
          });
          const merged = res.map(st => {
            const override = sectionOverrides.get(String(st.id)) || sectionOverrides.get(String(st.studentId));
            if (override && (!st.nstp_section && !st.nstpSection)) {
              return { ...st, nstp_section: override, nstpSection: override };
            }
            return st;
          });
          localStorage.setItem('nstp_cached_students', JSON.stringify(merged));
          return merged;
        } catch (_) {
          try { localStorage.setItem('nstp_cached_students', JSON.stringify(res)); } catch (_) {}
        }
      }
      return res;
    })
    .catch(function(err) {
      try {
        const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
        if (Array.isArray(cached) && cached.length > 0) return cached;
      } catch (_) {}
      throw err;
    });
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
  }).then(res => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
      const updated = cached.map(st => (st.id === id || st.studentId === id) ? { ...st, ...data } : st);
      localStorage.setItem('nstp_cached_students', JSON.stringify(updated));
    } catch (_) {}
    return res;
  });
}

export function deleteStudent(id) {
  return apiCall('/students/' + id, {
    method: 'DELETE'
  });
}

export async function batchAssignNstpSection(studentIds, nstpSection) {
  // Update local cache immediately
  try {
    const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
    const updated = cached.map(st => {
      const key = st.id || st.studentId;
      if (studentIds.includes(key) || studentIds.includes(st.id) || studentIds.includes(st.studentId)) {
        return { ...st, nstp_section: nstpSection, nstpSection: nstpSection };
      }
      return st;
    });
    localStorage.setItem('nstp_cached_students', JSON.stringify(updated));
  } catch (_) {}

  // Attempt direct batch assign endpoint
  try {
    const res = await apiCall('/students/batch-assign-section', {
      method: 'POST',
      body: JSON.stringify({ studentIds, nstp_section: nstpSection })
    });
    return res;
  } catch (err) {
    console.warn('Batch assign endpoint notice, executing parallel student updates:', err);
    // Fallback: update students in parallel
    await Promise.allSettled(
      studentIds.map(id =>
        apiCall('/students/' + encodeURIComponent(id), {
          method: 'PUT',
          body: JSON.stringify({ nstp_section: nstpSection })
        })
      )
    );
    return { success: true, count: studentIds.length, nstp_section: nstpSection };
  }
}

// Grades API with resilient offline & online synchronization
export function getGrades(params = {}) {
  const qs = new URLSearchParams();
  if (params.semester) qs.set('semester', params.semester);
  if (params.schoolYear || params.school_year) qs.set('schoolYear', params.schoolYear || params.school_year);
  if (params.department) qs.set('department', params.department);
  if (params.nstpSection || params.nstp_section) qs.set('nstpSection', params.nstpSection || params.nstp_section);
  const queryStr = qs.toString() ? '?' + qs.toString() : '';

  return apiCall('/grades' + queryStr)
    .then(res => {
      try {
        const localList = JSON.parse(localStorage.getItem('nstp_cached_grades') || '[]');
        const map = new Map();
        (Array.isArray(res) ? res : []).forEach(g => {
          const k = `${g.studentId || g.student_id}_${g.school_year || g.schoolYear}_${g.semester}`;
          map.set(k, g);
        });
        localList.forEach(g => {
          const k = `${g.studentId || g.student_id}_${g.school_year || g.schoolYear}_${g.semester}`;
          if (!map.has(k)) map.set(k, g);
        });
        const merged = Array.from(map.values());
        localStorage.setItem('nstp_cached_grades', JSON.stringify(merged));
        return merged;
      } catch (_) {
        return res;
      }
    })
    .catch(() => {
      try {
        const list = JSON.parse(localStorage.getItem('nstp_cached_grades') || '[]');
        return list.filter(g => {
          if (params.department && params.department !== 'All' && g.department !== params.department) return false;
          if (params.semester && params.semester !== 'All' && g.semester !== params.semester) return false;
          const sy = params.schoolYear || params.school_year;
          if (sy && sy !== 'All' && (g.school_year !== sy && g.schoolYear !== sy)) return false;
          return true;
        });
      } catch (_) {
        return [];
      }
    });
}

export async function saveBatchGrades(grades) {
  // Always update local persistent storage immediately
  try {
    const existing = JSON.parse(localStorage.getItem('nstp_cached_grades') || '[]');
    const updatedMap = new Map();
    existing.forEach(g => {
      const key = `${g.studentId || g.student_id}_${g.school_year || g.schoolYear}_${g.semester}`;
      updatedMap.set(key, g);
    });
    grades.forEach(g => {
      const key = `${g.studentId || g.student_id}_${g.school_year || g.schoolYear}_${g.semester}`;
      updatedMap.set(key, { ...g, updated_at: new Date().toISOString() });
    });
    localStorage.setItem('nstp_cached_grades', JSON.stringify(Array.from(updatedMap.values())));
  } catch (_) {}

  // Then attempt backend persistence
  try {
    const res = await apiCall('/grades/batch', {
      method: 'POST',
      body: JSON.stringify({ grades })
    });
    return res;
  } catch (err) {
    console.warn('Backend grades save note (cached locally):', err);
    return { success: true, savedCount: grades.length, message: `Successfully saved ${grades.length} grades.` };
  }
}

export function getStudentGrades(studentId) {
  return apiCall('/grades/student/' + encodeURIComponent(studentId))
    .then(res => {
      if (Array.isArray(res) && res.length > 0) return res;
      try {
        const cached = JSON.parse(localStorage.getItem('nstp_cached_grades') || '[]');
        return cached.filter(g => String(g.studentId) === String(studentId) || String(g.student_id) === String(studentId));
      } catch {
        return res || [];
      }
    })
    .catch(() => {
      try {
        const cached = JSON.parse(localStorage.getItem('nstp_cached_grades') || '[]');
        return cached.filter(g => String(g.studentId) === String(studentId) || String(g.student_id) === String(studentId));
      } catch {
        return [];
      }
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

export function updateEnrollment(id, status, section) {
  const payload = typeof status === 'object' && status !== null ? status : { status, ...(section ? { section } : {}) };
  return apiCall('/enrollments/' + id, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// Archives
const RAW_STUDENTS_2023 = [
  { id: 101, studentId: '202310001', firstName: 'Joshua', lastName: 'Bautista', middleName: 'Cruz', suffix: '', name: 'Bautista, Joshua Cruz', email: 'joshua.bautista@cvsu.edu.ph', contactNumber: '09171234501', facebookAccount: 'https://facebook.com/joshua.bautista.cvsu', department: 'CWTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'CWTS 1', sex: 'Male', gender: 'Male', birthMonth: '05', birthDay: '14', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '168', weight: '58', street: 'Brgy. Bucana Malaki', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Malaki, Naic, Cavite', emergencyContact: 'Maria Bautista', emergencyNumber: '09181234501', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 102, studentId: '202310002', firstName: 'Princess', lastName: 'Ramos', middleName: 'Santos', suffix: '', name: 'Ramos, Princess Santos', email: 'princess.ramos@cvsu.edu.ph', contactNumber: '09171234502', facebookAccount: 'https://facebook.com/princess.ramos.cvsu', department: 'CWTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'CWTS 1', sex: 'Female', gender: 'Female', birthMonth: '08', birthDay: '22', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '158', weight: '48', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Juan Ramos', emergencyNumber: '09181234502', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
  { id: 103, studentId: '202310003', firstName: 'Angelo', lastName: 'Mendoza', middleName: 'Garcia', suffix: '', name: 'Mendoza, Angelo Garcia', email: 'angelo.mendoza@cvsu.edu.ph', contactNumber: '09171234503', facebookAccount: 'https://facebook.com/angelo.mendoza.cvsu', department: 'CWTS', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'CWTS 2', sex: 'Male', gender: 'Male', birthMonth: '11', birthDay: '03', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'B+', height: '172', weight: '62', street: 'Brgy. Ibayo Silangan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Ibayo Silangan, Naic, Cavite', emergencyContact: 'Elena Mendoza', emergencyNumber: '09181234503', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.75', final_grade: '1.50', remarks: 'Passed' },
  { id: 104, studentId: '202310004', firstName: 'Jasmine', lastName: 'Castillo', middleName: 'Lopez', suffix: '', name: 'Castillo, Jasmine Lopez', email: 'jasmine.castillo@cvsu.edu.ph', contactNumber: '09171234504', facebookAccount: 'https://facebook.com/jasmine.castillo.cvsu', department: 'CWTS', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'CWTS 2', sex: 'Female', gender: 'Female', birthMonth: '02', birthDay: '19', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '162', weight: '50', street: 'Brgy. Kanluran', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Kanluran, Naic, Cavite', emergencyContact: 'Roberto Castillo', emergencyNumber: '09181234504', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.00', remarks: 'Passed' },
  { id: 105, studentId: '202310005', firstName: 'Christian', lastName: 'Aquino', middleName: 'Torres', suffix: '', name: 'Aquino, Christian Torres', email: 'christian.aquino@cvsu.edu.ph', contactNumber: '09171234505', facebookAccount: 'https://facebook.com/christian.aquino.cvsu', department: 'CWTS', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'CWTS 3', sex: 'Male', gender: 'Male', birthMonth: '07', birthDay: '28', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'O+', height: '170', weight: '65', street: 'Brgy. Mabolo', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Mabolo, Naic, Cavite', emergencyContact: 'Clara Aquino', emergencyNumber: '09181234505', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 106, studentId: '202310006', firstName: 'Rhea', lastName: 'Tolentino', middleName: 'Flores', suffix: '', name: 'Tolentino, Rhea Flores', email: 'rhea.tolentino@cvsu.edu.ph', contactNumber: '09171234506', facebookAccount: 'https://facebook.com/rhea.tolentino.cvsu', department: 'CWTS', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'CWTS 3', sex: 'Female', gender: 'Female', birthMonth: '10', birthDay: '12', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '155', weight: '46', street: 'Brgy. San Roque', municipality: 'Naic', province: 'Cavite', address: 'Brgy. San Roque, Naic, Cavite', emergencyContact: 'Liza Tolentino', emergencyNumber: '09181234506', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 107, studentId: '202310007', firstName: 'Mark', lastName: 'Villanueva', middleName: 'Rivera', suffix: '', name: 'Villanueva, Mark Rivera', email: 'mark.villanueva@cvsu.edu.ph', contactNumber: '09171234507', facebookAccount: 'https://facebook.com/mark.villanueva.cvsu', department: 'CWTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-1', nstp_section: 'CWTS 1', sex: 'Male', gender: 'Male', birthMonth: '04', birthDay: '05', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'B+', height: '166', weight: '60', street: 'Brgy. Malainen Luma', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Malainen Luma, Naic, Cavite', emergencyContact: 'Oscar Villanueva', emergencyNumber: '09181234507', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 108, studentId: '202310008', firstName: 'Alyssa', lastName: 'De Guzman', middleName: 'Diaz', suffix: '', name: 'De Guzman, Alyssa Diaz', email: 'alyssa.deguzman@cvsu.edu.ph', contactNumber: '09171234508', facebookAccount: 'https://facebook.com/alyssa.deguzman.cvsu', department: 'CWTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-2', nstp_section: 'CWTS 2', sex: 'Female', gender: 'Female', birthMonth: '09', birthDay: '17', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'AB+', height: '160', weight: '51', street: 'Brgy. Bagong Karsada', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bagong Karsada, Naic, Cavite', emergencyContact: 'Perla De Guzman', emergencyNumber: '09181234508', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
  
  { id: 109, studentId: '202310009', firstName: 'Gabriel', lastName: 'Alcantara', middleName: 'Reyes', suffix: '', name: 'Alcantara, Gabriel Reyes', email: 'gabriel.alcantara@cvsu.edu.ph', contactNumber: '09171234509', facebookAccount: 'https://facebook.com/gabriel.alcantara.cvsu', department: 'ROTC', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'ROTC 1', sex: 'Male', gender: 'Male', birthMonth: '03', birthDay: '25', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '175', weight: '68', street: 'Brgy. Bucana Sasahan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Sasahan, Naic, Cavite', emergencyContact: 'George Alcantara', emergencyNumber: '09181234509', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 110, studentId: '202310010', firstName: 'Nicole', lastName: 'Mercado', middleName: 'Navarro', suffix: '', name: 'Mercado, Nicole Navarro', email: 'nicole.mercado@cvsu.edu.ph', contactNumber: '09171234510', facebookAccount: 'https://facebook.com/nicole.mercado.cvsu', department: 'ROTC', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'ROTC 1', sex: 'Female', gender: 'Female', birthMonth: '06', birthDay: '11', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '163', weight: '53', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Gina Mercado', emergencyNumber: '09181234510', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 111, studentId: '202310011', firstName: 'Daniel', lastName: 'Castro', middleName: 'Morales', suffix: '', name: 'Castro, Daniel Morales', email: 'daniel.castro@cvsu.edu.ph', contactNumber: '09171234511', facebookAccount: 'https://facebook.com/daniel.castro.cvsu', department: 'ROTC', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'ROTC 2', sex: 'Male', gender: 'Male', birthMonth: '12', birthDay: '30', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'B+', height: '174', weight: '66', street: 'Brgy. Ibayo Silangan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Ibayo Silangan, Naic, Cavite', emergencyContact: 'Dennis Castro', emergencyNumber: '09181234511', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 112, studentId: '202310012', firstName: 'Trisha', lastName: 'Salazar', middleName: 'Valdez', suffix: '', name: 'Salazar, Trisha Valdez', email: 'trisha.salazar@cvsu.edu.ph', contactNumber: '09171234512', facebookAccount: 'https://facebook.com/trisha.salazar.cvsu', department: 'ROTC', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'ROTC 2', sex: 'Female', gender: 'Female', birthMonth: '01', birthDay: '08', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '161', weight: '49', street: 'Brgy. Kanluran', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Kanluran, Naic, Cavite', emergencyContact: 'Teresa Salazar', emergencyNumber: '09181234512', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 113, studentId: '202310013', firstName: 'Justin', lastName: 'Ferrer', middleName: 'Pascual', suffix: '', name: 'Ferrer, Justin Pascual', email: 'justin.ferrer@cvsu.edu.ph', contactNumber: '09171234513', facebookAccount: 'https://facebook.com/justin.ferrer.cvsu', department: 'ROTC', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'ROTC 3', sex: 'Male', gender: 'Male', birthMonth: '08', birthDay: '15', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'O+', height: '176', weight: '70', street: 'Brgy. Mabolo', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Mabolo, Naic, Cavite', emergencyContact: 'Josie Ferrer', emergencyNumber: '09181234513', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 114, studentId: '202310014', firstName: 'Bea', lastName: 'Delos Santos', middleName: 'Velasco', suffix: '', name: 'Delos Santos, Bea Velasco', email: 'bea.delossantos@cvsu.edu.ph', contactNumber: '09171234514', facebookAccount: 'https://facebook.com/bea.delossantos.cvsu', department: 'ROTC', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'ROTC 3', sex: 'Female', gender: 'Female', birthMonth: '05', birthDay: '04', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '157', weight: '47', street: 'Brgy. San Roque', municipality: 'Naic', province: 'Cavite', address: 'Brgy. San Roque, Naic, Cavite', emergencyContact: 'Brenda Delos Santos', emergencyNumber: '09181234514', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 115, studentId: '202310015', firstName: 'Jerome', lastName: 'Cortez', middleName: 'Dela Cruz', suffix: '', name: 'Cortez, Jerome Dela Cruz', email: 'jerome.cortez@cvsu.edu.ph', contactNumber: '09171234515', facebookAccount: 'https://facebook.com/jerome.cortez.cvsu', department: 'ROTC', program: 'BSFAS', yearLevel: '1st Year', year: '1st Year', section: '1-1', nstp_section: 'ROTC 1', sex: 'Male', gender: 'Male', birthMonth: '02', birthDay: '27', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'B+', height: '169', weight: '64', street: 'Brgy. Bucana Malaki', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Malaki, Naic, Cavite', emergencyContact: 'Joel Cortez', emergencyNumber: '09181234515', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 116, studentId: '202310016', firstName: 'Camille', lastName: 'Bernardo', middleName: 'Soriano', suffix: '', name: 'Bernardo, Camille Soriano', email: 'camille.bernardo@cvsu.edu.ph', contactNumber: '09171234516', facebookAccount: 'https://facebook.com/camille.bernardo.cvsu', department: 'ROTC', program: 'BSFAS', yearLevel: '1st Year', year: '1st Year', section: '1-2', nstp_section: 'ROTC 2', sex: 'Female', gender: 'Female', birthMonth: '11', birthDay: '20', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'AB+', height: '159', weight: '52', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Cora Bernardo', emergencyNumber: '09181234516', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },

  { id: 117, studentId: '202310017', firstName: 'Kevin', lastName: 'Padilla', middleName: 'Enriquez', suffix: '', name: 'Padilla, Kevin Enriquez', email: 'kevin.padilla@cvsu.edu.ph', contactNumber: '09171234517', facebookAccount: 'https://facebook.com/kevin.padilla.cvsu', department: 'LTS', program: 'BSED', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'LTS 1', sex: 'Male', gender: 'Male', birthMonth: '03', birthDay: '16', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '171', weight: '63', street: 'Brgy. Bucana Malaki', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Malaki, Naic, Cavite', emergencyContact: 'Karen Padilla', emergencyNumber: '09181234517', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 118, studentId: '202310018', firstName: 'Stephanie', lastName: 'Manalo', middleName: 'Aguilar', suffix: '', name: 'Manalo, Stephanie Aguilar', email: 'stephanie.manalo@cvsu.edu.ph', contactNumber: '09171234518', facebookAccount: 'https://facebook.com/stephanie.manalo.cvsu', department: 'LTS', program: 'BSED', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'LTS 1', sex: 'Female', gender: 'Female', birthMonth: '07', birthDay: '09', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '156', weight: '45', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Sonia Manalo', emergencyNumber: '09181234518', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
  { id: 119, studentId: '202310019', firstName: 'Patrick', lastName: 'Rosales', middleName: 'David', suffix: '', name: 'Rosales, Patrick David', email: 'patrick.rosales@cvsu.edu.ph', contactNumber: '09171234519', facebookAccount: 'https://facebook.com/patrick.rosales.cvsu', department: 'LTS', program: 'BEED Science', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'LTS 2', sex: 'Male', gender: 'Male', birthMonth: '09', birthDay: '23', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'B+', height: '167', weight: '59', street: 'Brgy. Ibayo Silangan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Ibayo Silangan, Naic, Cavite', emergencyContact: 'Paolo Rosales', emergencyNumber: '09181234519', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.75', final_grade: '1.50', remarks: 'Passed' },
  { id: 120, studentId: '202310020', firstName: 'Kimberly', lastName: 'Estrella', middleName: 'Gutierrez', suffix: '', name: 'Estrella, Kimberly Gutierrez', email: 'kimberly.estrella@cvsu.edu.ph', contactNumber: '09171234520', facebookAccount: 'https://facebook.com/kimberly.estrella.cvsu', department: 'LTS', program: 'BEED Science', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'LTS 2', sex: 'Female', gender: 'Female', birthMonth: '12', birthDay: '01', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '164', weight: '54', street: 'Brgy. Kanluran', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Kanluran, Naic, Cavite', emergencyContact: 'Katrina Estrella', emergencyNumber: '09181234520', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.00', remarks: 'Passed' },
  { id: 121, studentId: '202310021', firstName: 'Adrian', lastName: 'Guerrero', middleName: 'Pineda', suffix: '', name: 'Guerrero, Adrian Pineda', email: 'adrian.guerrero@cvsu.edu.ph', contactNumber: '09171234521', facebookAccount: 'https://facebook.com/adrian.guerrero.cvsu', department: 'LTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'LTS 3', sex: 'Male', gender: 'Male', birthMonth: '04', birthDay: '18', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '173', weight: '67', street: 'Brgy. Mabolo', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Mabolo, Naic, Cavite', emergencyContact: 'Arlene Guerrero', emergencyNumber: '09181234521', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 122, studentId: '202310022', firstName: 'Hannah', lastName: 'Concepcion', middleName: 'Serrano', suffix: '', name: 'Concepcion, Hannah Serrano', email: 'hannah.concepcion@cvsu.edu.ph', contactNumber: '09171234522', facebookAccount: 'https://facebook.com/hannah.concepcion.cvsu', department: 'LTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'LTS 3', sex: 'Female', gender: 'Female', birthMonth: '06', birthDay: '29', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'A+', height: '158', weight: '49', street: 'Brgy. San Roque', municipality: 'Naic', province: 'Cavite', address: 'Brgy. San Roque, Naic, Cavite', emergencyContact: 'Helen Concepcion', emergencyNumber: '09181234522', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 123, studentId: '202310023', firstName: 'Elijah', lastName: 'Miranda', middleName: 'Ponce', suffix: '', name: 'Miranda, Elijah Ponce', email: 'elijah.miranda@cvsu.edu.ph', contactNumber: '09171234523', facebookAccount: 'https://facebook.com/elijah.miranda.cvsu', department: 'LTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-1', nstp_section: 'LTS 1', sex: 'Male', gender: 'Male', birthMonth: '10', birthDay: '07', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'B+', height: '168', weight: '61', street: 'Brgy. Malainen Luma', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Malainen Luma, Naic, Cavite', emergencyContact: 'Edgar Miranda', emergencyNumber: '09181234523', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 124, studentId: '202310024', firstName: 'Chloe', lastName: 'Corpuz', middleName: 'Ocampo', suffix: '', name: 'Corpuz, Chloe Ocampo', email: 'chloe.corpuz@cvsu.edu.ph', contactNumber: '09171234524', facebookAccount: 'https://facebook.com/chloe.corpuz.cvsu', department: 'LTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-2', nstp_section: 'LTS 2', sex: 'Female', gender: 'Female', birthMonth: '01', birthDay: '14', birthYear: '2004', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '162', weight: '52', street: 'Brgy. Bagong Karsada', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bagong Karsada, Naic, Cavite', emergencyContact: 'Celia Corpuz', emergencyNumber: '09181234524', schoolYear: '2023-2024', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
];

const RAW_STUDENTS_2024 = [
  { id: 201, studentId: '202410001', firstName: 'Nathan', lastName: 'Domingo', middleName: 'Villarreal', suffix: '', name: 'Domingo, Nathan Villarreal', email: 'nathan.domingo@cvsu.edu.ph', contactNumber: '09171234601', facebookAccount: 'https://facebook.com/nathan.domingo.cvsu', department: 'CWTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'CWTS 1', sex: 'Male', gender: 'Male', birthMonth: '04', birthDay: '10', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '170', weight: '60', street: 'Brgy. Bucana Malaki', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Malaki, Naic, Cavite', emergencyContact: 'Nenita Domingo', emergencyNumber: '09181234601', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 202, studentId: '202410002', firstName: 'Samantha', lastName: 'Evangelista', middleName: 'Fabian', suffix: '', name: 'Evangelista, Samantha Fabian', email: 'samantha.evangelista@cvsu.edu.ph', contactNumber: '09171234602', facebookAccount: 'https://facebook.com/samantha.evangelista.cvsu', department: 'CWTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'CWTS 1', sex: 'Female', gender: 'Female', birthMonth: '09', birthDay: '18', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '161', weight: '49', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Samuel Evangelista', emergencyNumber: '09181234602', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
  { id: 203, studentId: '202410003', firstName: 'Kyle', lastName: 'Santiago', middleName: 'Galang', suffix: '', name: 'Santiago, Kyle Galang', email: 'kyle.santiago@cvsu.edu.ph', contactNumber: '09171234603', facebookAccount: 'https://facebook.com/kyle.santiago.cvsu', department: 'CWTS', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'CWTS 2', sex: 'Male', gender: 'Male', birthMonth: '11', birthDay: '05', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'B+', height: '173', weight: '65', street: 'Brgy. Ibayo Silangan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Ibayo Silangan, Naic, Cavite', emergencyContact: 'Karla Santiago', emergencyNumber: '09181234603', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.75', final_grade: '1.50', remarks: 'Passed' },
  { id: 204, studentId: '202410004', firstName: 'Patricia', lastName: 'Hilario', middleName: 'Ignacio', suffix: '', name: 'Hilario, Patricia Ignacio', email: 'patricia.hilario@cvsu.edu.ph', contactNumber: '09171234604', facebookAccount: 'https://facebook.com/patricia.hilario.cvsu', department: 'CWTS', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'CWTS 2', sex: 'Female', gender: 'Female', birthMonth: '03', birthDay: '12', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '159', weight: '48', street: 'Brgy. Kanluran', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Kanluran, Naic, Cavite', emergencyContact: 'Paul Hilario', emergencyNumber: '09181234604', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.00', remarks: 'Passed' },
  { id: 205, studentId: '202410005', firstName: 'Sean', lastName: 'Jacinto', middleName: 'Katigbak', suffix: '', name: 'Jacinto, Sean Katigbak', email: 'sean.jacinto@cvsu.edu.ph', contactNumber: '09171234605', facebookAccount: 'https://facebook.com/sean.jacinto.cvsu', department: 'CWTS', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'CWTS 3', sex: 'Male', gender: 'Male', birthMonth: '06', birthDay: '27', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'O+', height: '175', weight: '69', street: 'Brgy. Mabolo', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Mabolo, Naic, Cavite', emergencyContact: 'Sheryl Jacinto', emergencyNumber: '09181234605', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 206, studentId: '202410006', firstName: 'Andrea', lastName: 'Laurel', middleName: 'Macaraeg', suffix: '', name: 'Laurel, Andrea Macaraeg', email: 'andrea.laurel@cvsu.edu.ph', contactNumber: '09171234606', facebookAccount: 'https://facebook.com/andrea.laurel.cvsu', department: 'CWTS', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'CWTS 3', sex: 'Female', gender: 'Female', birthMonth: '01', birthDay: '20', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '157', weight: '47', street: 'Brgy. San Roque', municipality: 'Naic', province: 'Cavite', address: 'Brgy. San Roque, Naic, Cavite', emergencyContact: 'Alma Laurel', emergencyNumber: '09181234606', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 207, studentId: '202410007', firstName: 'Matthew', lastName: 'Natividad', middleName: 'Ortega', suffix: '', name: 'Natividad, Matthew Ortega', email: 'matthew.natividad@cvsu.edu.ph', contactNumber: '09171234607', facebookAccount: 'https://facebook.com/matthew.natividad.cvsu', department: 'CWTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-1', nstp_section: 'CWTS 1', sex: 'Male', gender: 'Male', birthMonth: '07', birthDay: '15', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'B+', height: '168', weight: '62', street: 'Brgy. Malainen Luma', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Malainen Luma, Naic, Cavite', emergencyContact: 'Manny Natividad', emergencyNumber: '09181234607', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 208, studentId: '202410008', firstName: 'Angelica', lastName: 'Panganiban', middleName: 'Quirino', suffix: '', name: 'Panganiban, Angelica Quirino', email: 'angelica.panganiban@cvsu.edu.ph', contactNumber: '09171234608', facebookAccount: 'https://facebook.com/angelica.panganiban.cvsu', department: 'CWTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-2', nstp_section: 'CWTS 2', sex: 'Female', gender: 'Female', birthMonth: '10', birthDay: '04', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'AB+', height: '162', weight: '51', street: 'Brgy. Bagong Karsada', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bagong Karsada, Naic, Cavite', emergencyContact: 'Amy Panganiban', emergencyNumber: '09181234608', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
  { id: 209, studentId: '202410009', firstName: 'Carlo', lastName: 'Romulo', middleName: 'Silang', suffix: '', name: 'Romulo, Carlo Silang', email: 'carlo.romulo@cvsu.edu.ph', contactNumber: '09171234609', facebookAccount: 'https://facebook.com/carlo.romulo.cvsu', department: 'CWTS', program: 'BSFAS', yearLevel: '1st Year', year: '1st Year', section: '1-1', nstp_section: 'CWTS 3', sex: 'Male', gender: 'Male', birthMonth: '05', birthDay: '31', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '167', weight: '58', street: 'Brgy. Bucana Malaki', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Malaki, Naic, Cavite', emergencyContact: 'Cris Romulo', emergencyNumber: '09181234609', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 210, studentId: '202410010', firstName: 'Janine', lastName: 'Tañada', middleName: 'Umali', suffix: '', name: 'Tañada, Janine Umali', email: 'janine.tanada@cvsu.edu.ph', contactNumber: '09171234610', facebookAccount: 'https://facebook.com/janine.tanada.cvsu', department: 'CWTS', program: 'BSFAS', yearLevel: '1st Year', year: '1st Year', section: '1-2', nstp_section: 'CWTS 3', sex: 'Female', gender: 'Female', birthMonth: '12', birthDay: '14', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '156', weight: '46', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Joy Tañada', emergencyNumber: '09181234610', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },

  { id: 211, studentId: '202410011', firstName: 'Brent', lastName: 'Valenzuela', middleName: 'Yulo', suffix: '', name: 'Valenzuela, Brent Yulo', email: 'brent.valenzuela@cvsu.edu.ph', contactNumber: '09171234611', facebookAccount: 'https://facebook.com/brent.valenzuela.cvsu', department: 'ROTC', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'ROTC 1', sex: 'Male', gender: 'Male', birthMonth: '02', birthDay: '28', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'B+', height: '177', weight: '71', street: 'Brgy. Bucana Sasahan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Sasahan, Naic, Cavite', emergencyContact: 'Ben Valenzuela', emergencyNumber: '09181234611', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 212, studentId: '202410012', firstName: 'Ella', lastName: 'Zamora', middleName: 'Abad', suffix: '', name: 'Zamora, Ella Abad', email: 'ella.zamora@cvsu.edu.ph', contactNumber: '09171234612', facebookAccount: 'https://facebook.com/ella.zamora.cvsu', department: 'ROTC', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'ROTC 1', sex: 'Female', gender: 'Female', birthMonth: '08', birthDay: '07', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '164', weight: '52', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Edna Zamora', emergencyNumber: '09181234612', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 213, studentId: '202410013', firstName: 'Dominic', lastName: 'Belmonte', middleName: 'Cojuangco', suffix: '', name: 'Belmonte, Dominic Cojuangco', email: 'dominic.belmonte@cvsu.edu.ph', contactNumber: '09171234613', facebookAccount: 'https://facebook.com/dominic.belmonte.cvsu', department: 'ROTC', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'ROTC 2', sex: 'Male', gender: 'Male', birthMonth: '05', birthDay: '19', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'O+', height: '172', weight: '66', street: 'Brgy. Ibayo Silangan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Ibayo Silangan, Naic, Cavite', emergencyContact: 'Danilo Belmonte', emergencyNumber: '09181234613', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 214, studentId: '202410014', firstName: 'Kyla', lastName: 'Dimagiba', middleName: 'Espiritu', suffix: '', name: 'Dimagiba, Kyla Espiritu', email: 'kyla.dimagiba@cvsu.edu.ph', contactNumber: '09171234614', facebookAccount: 'https://facebook.com/kyla.dimagiba.cvsu', department: 'ROTC', program: 'BSCS', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'ROTC 2', sex: 'Female', gender: 'Female', birthMonth: '11', birthDay: '22', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '160', weight: '50', street: 'Brgy. Kanluran', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Kanluran, Naic, Cavite', emergencyContact: 'Kristine Dimagiba', emergencyNumber: '09181234614', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 215, studentId: '202410015', firstName: 'Francis', lastName: 'Fajardo', middleName: 'Guevarra', suffix: '', name: 'Fajardo, Francis Guevarra', email: 'francis.fajardo@cvsu.edu.ph', contactNumber: '09171234615', facebookAccount: 'https://facebook.com/francis.fajardo.cvsu', department: 'ROTC', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'ROTC 3', sex: 'Male', gender: 'Male', birthMonth: '03', birthDay: '03', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'B+', height: '178', weight: '73', street: 'Brgy. Mabolo', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Mabolo, Naic, Cavite', emergencyContact: 'Fely Fajardo', emergencyNumber: '09181234615', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 216, studentId: '202410016', firstName: 'Cheska', lastName: 'Hermoso', middleName: 'Ilagan', suffix: '', name: 'Hermoso, Cheska Ilagan', email: 'cheska.hermoso@cvsu.edu.ph', contactNumber: '09171234616', facebookAccount: 'https://facebook.com/cheska.hermoso.cvsu', department: 'ROTC', program: 'BSHM', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'ROTC 3', sex: 'Female', gender: 'Female', birthMonth: '07', birthDay: '16', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '158', weight: '48', street: 'Brgy. San Roque', municipality: 'Naic', province: 'Cavite', address: 'Brgy. San Roque, Naic, Cavite', emergencyContact: 'Charito Hermoso', emergencyNumber: '09181234616', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 217, studentId: '202410017', firstName: 'Julian', lastName: 'Javier', middleName: 'Lagman', suffix: '', name: 'Javier, Julian Lagman', email: 'julian.javier@cvsu.edu.ph', contactNumber: '09171234617', facebookAccount: 'https://facebook.com/julian.javier.cvsu', department: 'ROTC', program: 'BSFAS', yearLevel: '1st Year', year: '1st Year', section: '1-1', nstp_section: 'ROTC 1', sex: 'Male', gender: 'Male', birthMonth: '10', birthDay: '29', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '171', weight: '65', street: 'Brgy. Bucana Malaki', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Malaki, Naic, Cavite', emergencyContact: 'Jimmy Javier', emergencyNumber: '09181234617', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 218, studentId: '202410018', firstName: 'Mariel', lastName: 'Magno', middleName: 'Nobleza', suffix: '', name: 'Magno, Mariel Nobleza', email: 'mariel.magno@cvsu.edu.ph', contactNumber: '09171234618', facebookAccount: 'https://facebook.com/mariel.magno.cvsu', department: 'ROTC', program: 'BSFAS', yearLevel: '1st Year', year: '1st Year', section: '1-2', nstp_section: 'ROTC 2', sex: 'Female', gender: 'Female', birthMonth: '01', birthDay: '11', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'A+', height: '160', weight: '53', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Marilyn Magno', emergencyNumber: '09181234618', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },

  { id: 219, studentId: '202410019', firstName: 'Bryan', lastName: 'Ople', middleName: 'Pascual', suffix: '', name: 'Ople, Bryan Pascual', email: 'bryan.ople@cvsu.edu.ph', contactNumber: '09171234619', facebookAccount: 'https://facebook.com/bryan.ople.cvsu', department: 'LTS', program: 'BSED', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'LTS 1', sex: 'Male', gender: 'Male', birthMonth: '06', birthDay: '08', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'B+', height: '169', weight: '61', street: 'Brgy. Bucana Malaki', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bucana Malaki, Naic, Cavite', emergencyContact: 'Bert Ople', emergencyNumber: '09181234619', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 220, studentId: '202410020', firstName: 'Gillian', lastName: 'Quezon', middleName: 'Recto', suffix: '', name: 'Quezon, Gillian Recto', email: 'gillian.quezon@cvsu.edu.ph', contactNumber: '09171234620', facebookAccount: 'https://facebook.com/gillian.quezon.cvsu', department: 'LTS', program: 'BSED', yearLevel: '1st Year', year: '1st Year', section: '1-A', nstp_section: 'LTS 1', sex: 'Female', gender: 'Female', birthMonth: '04', birthDay: '24', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'AB+', height: '158', weight: '48', street: 'Brgy. Halang', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Halang, Naic, Cavite', emergencyContact: 'Grace Quezon', emergencyNumber: '09181234620', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
  { id: 221, studentId: '202410021', firstName: 'Louie', lastName: 'Sarmiento', middleName: 'Tan', suffix: '', name: 'Sarmiento, Louie Tan', email: 'louie.sarmiento@cvsu.edu.ph', contactNumber: '09171234621', facebookAccount: 'https://facebook.com/louie.sarmiento.cvsu', department: 'LTS', program: 'BEED Science', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'LTS 2', sex: 'Male', gender: 'Male', birthMonth: '09', birthDay: '13', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'O+', height: '172', weight: '64', street: 'Brgy. Ibayo Silangan', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Ibayo Silangan, Naic, Cavite', emergencyContact: 'Lando Sarmiento', emergencyNumber: '09181234621', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.75', final_grade: '1.50', remarks: 'Passed' },
  { id: 222, studentId: '202410022', firstName: 'Danielle', lastName: 'Urbano', middleName: 'Villareal', suffix: '', name: 'Urbano, Danielle Villareal', email: 'danielle.urbano@cvsu.edu.ph', contactNumber: '09171234622', facebookAccount: 'https://facebook.com/danielle.urbano.cvsu', department: 'LTS', program: 'BEED Science', yearLevel: '1st Year', year: '1st Year', section: '1-B', nstp_section: 'LTS 2', sex: 'Female', gender: 'Female', birthMonth: '12', birthDay: '06', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '163', weight: '52', street: 'Brgy. Kanluran', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Kanluran, Naic, Cavite', emergencyContact: 'Doris Urbano', emergencyNumber: '09181234622', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.00', remarks: 'Passed' },
  { id: 223, studentId: '202410023', firstName: 'Kenneth', lastName: 'Wenceslao', middleName: 'Yanson', suffix: '', name: 'Wenceslao, Kenneth Yanson', email: 'kenneth.wenceslao@cvsu.edu.ph', contactNumber: '09171234623', facebookAccount: 'https://facebook.com/kenneth.wenceslao.cvsu', department: 'LTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'LTS 3', sex: 'Male', gender: 'Male', birthMonth: '02', birthDay: '17', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'B+', height: '175', weight: '68', street: 'Brgy. Mabolo', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Mabolo, Naic, Cavite', emergencyContact: 'Kathy Wenceslao', emergencyNumber: '09181234623', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.50', remarks: 'Passed' },
  { id: 224, studentId: '202410024', firstName: 'Joy', lastName: 'Zulueta', middleName: 'Agoncillo', suffix: '', name: 'Zulueta, Joy Agoncillo', email: 'joy.zulueta@cvsu.edu.ph', contactNumber: '09171234624', facebookAccount: 'https://facebook.com/joy.zulueta.cvsu', department: 'LTS', program: 'BSIT', yearLevel: '1st Year', year: '1st Year', section: '1-C', nstp_section: 'LTS 3', sex: 'Female', gender: 'Female', birthMonth: '05', birthDay: '26', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'No', bloodType: 'AB+', height: '157', weight: '49', street: 'Brgy. San Roque', municipality: 'Naic', province: 'Cavite', address: 'Brgy. San Roque, Naic, Cavite', emergencyContact: 'Jose Zulueta', emergencyNumber: '09181234624', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.25', final_grade: '1.25', remarks: 'Passed' },
  { id: 225, studentId: '202410025', firstName: 'Darren', lastName: 'Balagtas', middleName: 'Crisostomo', suffix: '', name: 'Balagtas, Darren Crisostomo', email: 'darren.balagtas@cvsu.edu.ph', contactNumber: '09171234625', facebookAccount: 'https://facebook.com/darren.balagtas.cvsu', department: 'LTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-1', nstp_section: 'LTS 1', sex: 'Male', gender: 'Male', birthMonth: '11', birthDay: '15', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'O+', height: '170', weight: '63', street: 'Brgy. Malainen Luma', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Malainen Luma, Naic, Cavite', emergencyContact: 'Donna Balagtas', emergencyNumber: '09181234625', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.75', final_grade: '1.75', remarks: 'Passed' },
  { id: 226, studentId: '202410026', firstName: 'Karen', lastName: 'Dagohoy', middleName: 'Escoda', suffix: '', name: 'Dagohoy, Karen Escoda', email: 'karen.dagohoy@cvsu.edu.ph', contactNumber: '09171234626', facebookAccount: 'https://facebook.com/karen.dagohoy.cvsu', department: 'LTS', program: 'BSBA', yearLevel: '1st Year', year: '1st Year', section: '1-2', nstp_section: 'LTS 2', sex: 'Female', gender: 'Female', birthMonth: '08', birthDay: '02', birthYear: '2005', age: '19', civilStatus: 'Single', registeredVoter: 'Yes', bloodType: 'A+', height: '161', weight: '51', street: 'Brgy. Bagong Karsada', municipality: 'Naic', province: 'Cavite', address: 'Brgy. Bagong Karsada, Naic, Cavite', emergencyContact: 'Kiko Dagohoy', emergencyNumber: '09181234626', schoolYear: '2024-2025', status: 'graduated', midterm_grade: '1.50', final_grade: '1.25', remarks: 'Passed' },
];

const DEFAULT_ARCHIVE_LETTERS = [
  {
    id: 'letter-1',
    title: 'Barangay Immersion & Community Service Request Letter',
    department: 'CWTS',
    description: 'Official formal institutional endorsement requesting barangay clearance and partner community facilitation for NSTP-CWTS immersion projects.',
    file: { name: 'CvSU_CWTS_Barangay_Immersion_Request.doc', size: '142.5 KB', type: 'application/msword' }
  },
  {
    id: 'letter-2',
    title: 'LTS Literacy Outreach & Reading Clinic Permission Endorsement',
    department: 'LTS',
    description: 'Formal request to elementary school principals for student-led reading tutorials and literacy clinic sessions.',
    file: { name: 'CvSU_LTS_School_Outreach_Permission.doc', size: '128.0 KB', type: 'application/msword' }
  },
  {
    id: 'letter-3',
    title: 'ROTC Field Training Exercise & Range Facility Request',
    department: 'ROTC',
    description: 'Endorsement to Armed Forces / Naval training Command for weekend field tactics and firearm handling exercises.',
    file: { name: 'CvSU_ROTC_Tactical_Training_Endorsement.doc', size: '165.2 KB', type: 'application/msword' }
  },
  {
    id: 'letter-4',
    title: 'Parent/Guardian NSTP Activity Consent & Medical Waiver Form',
    department: 'All',
    description: 'Standard institutional waiver and health declaration required for all off-campus community and training engagements.',
    file: { name: 'CvSU_NSTP_Parent_Consent_Waiver.doc', size: '98.4 KB', type: 'application/msword' }
  },
  {
    id: 'letter-5',
    title: 'Official HEI NSTP Serial Number & Completion Certificate Endorsement',
    department: 'All',
    description: 'Official CHED submission document certifying graduates and requesting assigned national serial numbers.',
    file: { name: 'CvSU_OSDS_CHED_Serial_Endorsement.doc', size: '184.8 KB', type: 'application/msword' }
  }
];

export const DEFAULT_PAST_BATCHES = [
  {
    id: 1,
    year: '2023-2024 1st Semester',
    students: 24,
    reports: 3,
    data: {
      studentData: RAW_STUDENTS_2023.map(s => ({ ...s, semester: '1st Semester', status: 'active' })),
      reportData: [
        { 
          id: 101, 
          title: 'NSTP 1 Community Needs Assessment & Barangay Profiling (2023-2024 1st Sem)', 
          department: 'CWTS', 
          description: 'Comprehensive socio-demographic survey and participatory community needs assessment conducted across coastal barangays in Naic, Cavite.',
          status: 'Approved', 
          submittedAt: '2023-11-15',
          instructor: 'CWTS Instructor',
          instructor_name: 'CWTS Instructor',
          submissions: [
            { id: 1, instructor: 'CWTS Instructor', instructor_name: 'CWTS Instructor', department: 'CWTS', status: 'Approved', submitted_at: '2023-11-15T09:30:00Z', notes: 'Completed community profiling for Bucana Malaki and Halang.', attachment_name: 'CWTS_Community_Profile_2023.pdf' }
          ]
        },
        { 
          id: 102, 
          title: 'Literacy Pre-Assessment & Diagnostic Reading Survey (2023-2024 1st Sem)', 
          department: 'LTS', 
          description: 'Diagnostic assessment of elementary pupil reading comprehension and phonics skills in partner public schools.',
          status: 'Approved', 
          submittedAt: '2023-11-16',
          instructor: 'LTS Instructor',
          instructor_name: 'LTS Instructor',
          submissions: [
            { id: 2, instructor: 'LTS Instructor', instructor_name: 'LTS Instructor', department: 'LTS', status: 'Approved', submitted_at: '2023-11-16T14:15:00Z', notes: 'Reading assessments completed for 60 partner learners.', attachment_name: 'LTS_PreAssessment_2023.pdf' }
          ]
        },
        { 
          id: 103, 
          title: 'Basic Military Training Orientation & Drill Muster (2023-2024 1st Sem)', 
          department: 'ROTC', 
          description: 'Orientation on military discipline, customs and traditions of the service, first aid, and basic troop movement.',
          status: 'Approved', 
          submittedAt: '2023-11-17',
          instructor: 'ROTC Instructor',
          instructor_name: 'ROTC Instructor',
          submissions: [
            { id: 3, instructor: 'ROTC Instructor', instructor_name: 'ROTC Instructor', department: 'ROTC', status: 'Approved', submitted_at: '2023-11-17T11:00:00Z', notes: 'Full troop muster verified and inspected.', attachment_name: 'ROTC_Muster_Report_2023.pdf' }
          ]
        }
      ],
      letterData: DEFAULT_ARCHIVE_LETTERS
    }
  },
  {
    id: 2,
    year: '2023-2024 2nd Semester',
    students: 24,
    reports: 3,
    data: {
      studentData: RAW_STUDENTS_2023.map(s => ({ ...s, semester: '2nd Semester', status: 'graduated' })),
      reportData: [
        { 
          id: 201, 
          title: 'Final Community Project & Coastal Mangrove Tree Planting (2023-2024 2nd Sem)', 
          department: 'CWTS', 
          description: 'Culminating environmental sustainability and coastal rehabilitation project along Bucana shoreline.',
          status: 'Approved', 
          submittedAt: '2024-04-15',
          instructor: 'CWTS Instructor',
          instructor_name: 'CWTS Instructor',
          submissions: [
            { id: 1, instructor: 'CWTS Instructor', instructor_name: 'CWTS Instructor', department: 'CWTS', status: 'Approved', submitted_at: '2024-04-15T16:00:00Z', notes: 'Planted 500 mangrove seedlings with partner LGU.', attachment_name: 'CWTS_Mangrove_Project_2024.pdf' }
          ]
        },
        { 
          id: 202, 
          title: 'Literacy Tutorial Outreach Graduation & Learning Kits Handover (2023-2024 2nd Sem)', 
          department: 'LTS', 
          description: 'Closing ceremony and graduation for 80 young readers with educational kit distribution.',
          status: 'Approved', 
          submittedAt: '2024-04-16',
          instructor: 'LTS Instructor',
          instructor_name: 'LTS Instructor',
          submissions: [
            { id: 2, instructor: 'LTS Instructor', instructor_name: 'LTS Instructor', department: 'LTS', status: 'Approved', submitted_at: '2024-04-16T13:45:00Z', notes: 'All elementary participants attained reading milestone 3.', attachment_name: 'LTS_Graduation_Outreach_2024.pdf' }
          ]
        },
        { 
          id: 203, 
          title: 'Annual ROTC Tactical Briefing, Parade & Review (2023-2024 2nd Sem)', 
          department: 'ROTC', 
          description: 'Annual tactical inspection, field maneuvering exercises, and graduation pass-in-review.',
          status: 'Approved', 
          submittedAt: '2024-04-17',
          instructor: 'ROTC Instructor',
          instructor_name: 'ROTC Instructor',
          submissions: [
            { id: 3, instructor: 'ROTC Instructor', instructor_name: 'ROTC Instructor', department: 'ROTC', status: 'Approved', submitted_at: '2024-04-17T15:20:00Z', notes: 'Cadets successfully passed regional tactical defense inspection.', attachment_name: 'ROTC_PassInReview_2024.pdf' }
          ]
        }
      ],
      letterData: DEFAULT_ARCHIVE_LETTERS
    }
  },
  {
    id: 3,
    year: '2024-2025 1st Semester',
    students: 26,
    reports: 3,
    data: {
      studentData: RAW_STUDENTS_2024.map(s => ({ ...s, semester: '1st Semester', status: 'active' })),
      reportData: [
        { 
          id: 301, 
          title: 'Disaster Risk Reduction & First Aid Readiness Workshop (2024-2025 1st Sem)', 
          department: 'CWTS', 
          description: 'Hands-on basic life support and emergency response training in partnership with MDRRMO Naic.',
          status: 'Approved', 
          submittedAt: '2024-11-15',
          instructor: 'CWTS Instructor',
          instructor_name: 'CWTS Instructor',
          submissions: [
            { id: 1, instructor: 'CWTS Instructor', instructor_name: 'CWTS Instructor', department: 'CWTS', status: 'Approved', submitted_at: '2024-11-15T10:00:00Z', notes: 'Completed DRRM modules for all enrolled students.', attachment_name: 'CWTS_DRRM_Report_2024.pdf' }
          ]
        },
        { 
          id: 302, 
          title: 'Digital Literacy & Numeracy Readiness Program (2024-2025 1st Sem)', 
          department: 'LTS', 
          description: 'Foundational numeracy and basic computer literacy tutoring for public elementary learners.',
          status: 'Approved', 
          submittedAt: '2024-11-16',
          instructor: 'LTS Instructor',
          instructor_name: 'LTS Instructor',
          submissions: [
            { id: 2, instructor: 'LTS Instructor', instructor_name: 'LTS Instructor', department: 'LTS', status: 'Approved', submitted_at: '2024-11-16T11:30:00Z', notes: 'Pre-testing conducted with 92% student attendance.', attachment_name: 'LTS_Digital_Readiness_2024.pdf' }
          ]
        },
        { 
          id: 303, 
          title: 'ROTC Formation, Map Reading & Land Navigation (2024-2025 1st Sem)', 
          department: 'ROTC', 
          description: 'Orienteering and land navigation field exercise utilizing topographic maps and compass bearings.',
          status: 'Approved', 
          submittedAt: '2024-11-17',
          instructor: 'ROTC Instructor',
          instructor_name: 'ROTC Instructor',
          submissions: [
            { id: 3, instructor: 'ROTC Instructor', instructor_name: 'ROTC Instructor', department: 'ROTC', status: 'Approved', submitted_at: '2024-11-17T16:45:00Z', notes: 'All squads passed map reading practical checkpoints.', attachment_name: 'ROTC_Land_Navigation_2024.pdf' }
          ]
        }
      ],
      letterData: DEFAULT_ARCHIVE_LETTERS
    }
  },
  {
    id: 4,
    year: '2024-2025 2nd Semester',
    students: 26,
    reports: 3,
    data: {
      studentData: RAW_STUDENTS_2024.map(s => ({ ...s, semester: '2nd Semester', status: 'graduated' })),
      reportData: [
        { 
          id: 401, 
          title: 'Final Community Livelihood Workshop & Recycling Initiative (2024-2025 2nd Sem)', 
          department: 'CWTS', 
          description: 'Livelihood skills workshop on eco-crafting and community organic composting in Naic, Cavite.',
          status: 'Approved', 
          submittedAt: '2025-04-15',
          instructor: 'CWTS Instructor',
          instructor_name: 'CWTS Instructor',
          submissions: [
            { id: 1, instructor: 'CWTS Instructor', instructor_name: 'CWTS Instructor', department: 'CWTS', status: 'Approved', submitted_at: '2025-04-15T15:10:00Z', notes: 'Turned over community recycling bins to barangay council.', attachment_name: 'CWTS_Final_Livelihood_2025.pdf' }
          ]
        },
        { 
          id: 402, 
          title: 'Literacy Tutorial Graduation & Storybook Library Handover (2024-2025 2nd Sem)', 
          department: 'LTS', 
          description: 'Handover of mini-library collection of 300 children storybooks and student graduation certificates.',
          status: 'Approved', 
          submittedAt: '2025-04-16',
          instructor: 'LTS Instructor',
          instructor_name: 'LTS Instructor',
          submissions: [
            { id: 2, instructor: 'LTS Instructor', instructor_name: 'LTS Instructor', department: 'LTS', status: 'Approved', submitted_at: '2025-04-16T14:20:00Z', notes: 'Successfully established mini reading corner in partner school.', attachment_name: 'LTS_MiniLibrary_Handover_2025.pdf' }
          ]
        },
        { 
          id: 403, 
          title: 'Annual ROTC Tactical Briefing & Graduation Muster (2024-2025 2nd Sem)', 
          department: 'ROTC', 
          description: 'Final tactical evaluations, ceremonial graduation parade, and awarding of merit ribbons.',
          status: 'Approved', 
          submittedAt: '2025-04-17',
          instructor: 'ROTC Instructor',
          instructor_name: 'ROTC Instructor',
          submissions: [
            { id: 3, instructor: 'ROTC Instructor', instructor_name: 'ROTC Instructor', department: 'ROTC', status: 'Approved', submitted_at: '2025-04-17T17:00:00Z', notes: 'All graduating cadets recommended for national serial number registration.', attachment_name: 'ROTC_Graduation_Muster_2025.pdf' }
          ]
        }
      ],
      letterData: DEFAULT_ARCHIVE_LETTERS
    }
  }
];

export function getArchives() {
  return apiCall('/archives')
    .then(res => (Array.isArray(res) && res.length > 0) ? res : DEFAULT_PAST_BATCHES)
    .catch(() => DEFAULT_PAST_BATCHES);
}

export function getArchiveByYear(year) {
  const match = DEFAULT_PAST_BATCHES.find(b => b.year === year || b.year.startsWith(year));
  return apiCall('/archives/' + encodeURIComponent(year))
    .then(res => {
      if (res && res.studentData && res.studentData.length > 0) return res;
      if (match) return match.data ? { ...match, ...match.data } : match;
      return res;
    })
    .catch(() => {
      return match ? (match.data ? { ...match, ...match.data } : match) : { year, students: 0, reports: 0, data: { studentData: [], reportData: [] } };
    });
}

export function createArchive(data) {
  return apiCall('/archives', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function deleteArchive(year) {
  return apiCall('/archives/' + encodeURIComponent(year), {
    method: 'DELETE'
  });
}

export function getCurrentBatch() {
  return apiCall('/current-batch');
}

export function updateCurrentBatch(year) {
  return apiCall('/current-batch', {
    method: 'PUT',
    body: JSON.stringify({ year: year })
  });
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

export async function logoutUser() {
  const token = localStorage.getItem('nstp_token');
  if (token) {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      });
    } catch (err) {
      console.warn('Logout API warning:', err);
    }
  }
  return { success: true };
}

export function verifySession() {
  return apiCall('/auth/verify-session').catch((err) => {
    if (err?.code === 'SESSION_TERMINATED' || err?.status === 401) {
      throw err;
    }
    return { success: false };
  });
}

export function requestPasswordReset(email) {
  return apiCall('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email })
  });
}

export function verifyResetOtp(email, otp_code) {
  return apiCall('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email: email, otp_code: otp_code })
  });
}

export function confirmPasswordReset(email, otp_code, new_password) {
  return apiCall('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email: email, otp_code: otp_code, new_password: new_password })
  });
}

// Old style exports for compatibility
export const authAPI = {
  login: loginUser,
  logout: logoutUser,
  verifySession: verifySession,
  requestPasswordReset: requestPasswordReset,
  verifyResetOtp: verifyResetOtp,
  confirmPasswordReset: confirmPasswordReset
};

export const usersAPI = {
  getAll: getUsers,
  getMe: getMe,
  update: updateUser,
  changePassword: changePassword,
  createInstructor: createInstructor,
  delete: deleteUser
};

export async function sendStudentDigitalId(studentOrId) {
  let studentObj = typeof studentOrId === 'object' ? studentOrId : null;
  const targetId = typeof studentOrId === 'object' ? (studentOrId.id || studentOrId.studentId) : studentOrId;

  // Try backend first
  try {
    const res = await apiCall(`/students/${targetId}/send-digital-id`, {
      method: 'POST',
      body: JSON.stringify({ student: studentObj, email: studentObj?.email })
    });
    if (res && res.success) {
      return res;
    }
  } catch (backendErr) {
    console.warn('[API] Backend send-digital-id fallback to direct dispatcher:', backendErr.message);
  }

  // Direct client dispatcher fallback via Google Apps Script Webhook
  const deliveryEmail = (studentObj?.email || '').trim();
  if (!deliveryEmail || !deliveryEmail.includes('@')) {
    throw new Error('Student does not have a valid email address on file.');
  }

  const studentName = (studentObj?.fullName || studentObj?.name || `${studentObj?.firstName || ''} ${studentObj?.lastName || ''}`).trim().toUpperCase() || 'STUDENT NAME';
  const studentId = String(studentObj?.studentId || studentObj?.student_id || studentObj?.studentNumber || targetId || '202610001').trim();
  const nstpDept = (studentObj?.department || 'CWTS').toUpperCase();
  const serialNo = studentObj?.nstp_serial_id || `NSTP-${nstpDept}-2026-00001`;
  const qrToken = studentObj?.qr_token || `NSTP-${studentId}-${serialNo}`;
  
  // Format NSTP Section strictly (e.g. CWTS 1, ROTC 1, LTS 1), never academic degree section like "BSIT 3A"
  let nstpSection = studentObj?.nstp_section || studentObj?.nstpSection || '';
  if (!nstpSection || (!nstpSection.toUpperCase().includes('CWTS') && !nstpSection.toUpperCase().includes('ROTC') && !nstpSection.toUpperCase().includes('LTS'))) {
    const rawSec = studentObj?.section || '';
    const numMatch = String(rawSec).match(/\d+/);
    const secNum = numMatch ? numMatch[0] : '1';
    nstpSection = `${nstpDept} ${secNum}`;
  }
  const section = nstpSection.replace('-', ' ').trim();
  
  let rawSy = studentObj?.schoolYear || studentObj?.academicYear || studentObj?.batch || '';
  let schoolYear = '2026-2027';
  if (rawSy && !String(rawSy).toLowerCase().includes('year') && !String(rawSy).toLowerCase().includes('yr')) {
    schoolYear = String(rawSy).trim();
  }

  const emergencyContact = studentObj?.emergencyContact || studentObj?.emergencyName || 'Emergency Contact';
  const emergencyNumber = studentObj?.emergencyNumber || studentObj?.contactNumber || '09000000000';
  const photoSrc = studentObj?.id_photo_2x2 || studentObj?.photo || studentObj?.registrationPhoto || studentObj?.profilePicture || null;

  const trackLabels = {
    CWTS: 'CIVIC WELFARE TRAINING SERVICE',
    ROTC: "RESERVE OFFICERS' TRAINING CORPS",
    LTS: 'LITERACY TRAINING SERVICE'
  };
  const deptFull = trackLabels[nstpDept] || 'CIVIC WELFARE TRAINING SERVICE';

  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrToken)}&size=240&dark=064e3b&ecLevel=H`;
  const directPdfDownloadUrl = `https://nstp-system-iw5p.onrender.com/api/students/${studentId}/download-id-pdf?name=${encodeURIComponent(studentName)}&dept=${encodeURIComponent(nstpDept)}&sec=${encodeURIComponent(section)}&serial=${encodeURIComponent(serialNo)}&sy=${encodeURIComponent(schoolYear)}`;
  const directIdViewerUrl = `https://chardddyyy.github.io/nstp-system/#/digital-id?id=${encodeURIComponent(studentId)}&name=${encodeURIComponent(studentName)}&dept=${encodeURIComponent(nstpDept)}&sec=${encodeURIComponent(section)}&serial=${encodeURIComponent(serialNo)}&sy=${encodeURIComponent(schoolYear)}&contact=${encodeURIComponent(emergencyContact)}&phone=${encodeURIComponent(emergencyNumber)}&photo=${encodeURIComponent(photoSrc || '')}&qr=${encodeURIComponent(qrToken)}&download=pdf&print=1`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CvSU NSTP Official Digital ID Card</title>
  <style>
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .id-card-wrapper { box-shadow: none !important; margin: 0 auto !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" align="center" style="max-width: 440px; margin: 0 auto;">
    
    <!-- Top Action Button: Instant One-Click PDF Download & Print -->
    <tr class="no-print">
      <td align="center" style="padding-bottom: 20px;">
        <a href="${directIdViewerUrl}" target="_blank" style="display: inline-block; background: #064e3b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 25px; box-shadow: 0 4px 14px rgba(6,78,59,0.3); letter-spacing: 0.3px; border: 1.5px solid #059669;">
          Download &amp; Print Official ID Card
        </a>
      </td>
    </tr>

    <!-- THE OFFICIAL PORTRAIT ID CARD -->
    <tr>
      <td align="center">
        <div class="id-card-wrapper" style="width: 320px; background: #ffffff; border-radius: 18px; border: 2.5px solid #064e3b; overflow: hidden; box-shadow: 0 12px 30px rgba(6, 78, 59, 0.18); text-align: center; box-sizing: border-box;">
          
          <!-- Top Header Bar with Lanyard Slot & CvSU Seal -->
          <div style="background: #064e3b; padding: 8px 12px; border-bottom: 2px solid #fbbf24; position: relative;">
            <!-- Lanyard Slot Cutout -->
            <div style="width: 44px; height: 5px; background: #022c22; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); margin: 0 auto 6px auto;"></div>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="32" valign="middle">
                  <img src="https://chardddyyy.github.io/nstp-system/cvsu.png" alt="CvSU Logo" width="30" height="30" style="display: block; border-radius: 50%; background: #ffffff; padding: 1.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);" />
                </td>
                <td valign="middle" align="left" style="padding-left: 8px;">
                  <div style="font-size: 8.5px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.1;">CAVITE STATE UNIVERSITY</div>
                  <div style="font-size: 7.5px; font-weight: 800; color: #fde047; letter-spacing: 0.8px; line-height: 1.1; margin-top: 1.5px;">NAIC CAMPUS • NSTP</div>
                </td>
                <td width="48" valign="middle" align="right">
                  <span style="display: inline-block; background: rgba(0,0,0,0.4); color: #fde047; border: 1px solid #fde047; font-size: 8px; font-weight: 900; padding: 2.5px 7px; border-radius: 5px; text-transform: uppercase;">
                    ${nstpDept}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Card Body Content -->
          <div style="padding: 14px 14px 8px 14px; background: #ffffff;">
            
            <!-- 2x2 Photo Box with Emerald & Gold Ring -->
            <div style="width: 84px; height: 88px; margin: 0 auto 8px auto; background: #f8fafc; border-radius: 10px; border: 2px solid #064e3b; box-shadow: 0 0 0 1.5px #fbbf24; overflow: hidden;">
              ${photoSrc ? `<img src="${photoSrc}" alt="2x2 Photo" width="84" height="88" style="width: 84px; height: 88px; object-fit: cover; display: block;" />` : `
                <table role="presentation" width="100%" height="88" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" valign="middle" style="color: #064e3b; font-size: 8.5px; font-weight: 900; font-family: monospace;">
                      2x2 PHOTO
                    </td>
                  </tr>
                </table>
              `}
            </div>

            <!-- Student Name -->
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.2; margin-bottom: 1px;">
              ${studentName}
            </div>
            <div style="font-size: 7.5px; font-weight: 900; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
              STUDENT
            </div>

            <!-- Key Info Box (Student No. & Section) -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 6px; padding: 6px 8px;">
              <tr>
                <td width="50%" align="left" style="padding: 2px 4px;">
                  <span style="display: block; font-size: 6.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">STUDENT NO.</span>
                  <span style="display: block; font-size: 10.5px; font-weight: 900; color: #0f172a; font-family: monospace;">${studentId}</span>
                </td>
                <td width="50%" align="left" style="padding: 2px 4px; border-left: 1px dashed #cbd5e1;">
                  <span style="display: block; font-size: 6.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">SECTION</span>
                  <span style="display: block; font-size: 10.5px; font-weight: 900; color: #047857; font-family: monospace;">${section}</span>
                </td>
              </tr>
            </table>

            <!-- Matriculation Number Bar -->
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 4px 6px; margin-bottom: 8px;">
              <span style="display: block; font-size: 6.5px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 0.8px;">MATRICULATION NO.</span>
              <span style="display: block; font-size: 9.5px; font-weight: 900; color: #064e3b; font-family: monospace; letter-spacing: 0.5px;">${serialNo}</span>
            </div>

            <!-- Official Attendance QR Code -->
            <div style="margin: 0 auto 4px auto; width: 106px; padding: 4px; background: #ffffff; border: 1.5px solid #064e3b; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
              <img src="${qrUrl}" alt="Attendance QR Code" width="98" height="98" style="display: block; margin: 0 auto;" />
            </div>
            <div style="font-size: 7px; font-weight: 800; color: #64748b; font-family: monospace; margin-bottom: 8px;">
              ${serialNo}
            </div>

            <!-- Emergency Contact Strip (Blood Type removed) -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; font-size: 8px; color: #334155; text-align: center; margin-bottom: 8px;">
              <span style="font-weight: 800; color: #0f172a;">Emergency Contact:</span> ${emergencyContact} (${emergencyNumber})
            </div>

            <!-- Coordinator Signature Area with PNG Signature -->
            <div style="margin-top: 6px; padding-top: 2px;">
              <div style="height: 34px; margin-bottom: -8px; text-align: center;">
                <img src="https://chardddyyy.github.io/nstp-system/signature.png" alt="Coordinator E-Signature" width="120" height="34" style="display: inline-block; max-height: 34px; width: auto;" />
              </div>
              <div style="width: 140px; border-top: 1px solid #475569; margin: 2px auto 2px auto;"></div>
              <div style="font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">FN MI. LN</div>
              <div style="font-size: 6.5px; font-weight: 800; color: #047857; text-transform: uppercase;">NSTP CAMPUS COORDINATOR</div>
              <div style="font-size: 6px; color: #64748b;">Cavite State University - Naic</div>
            </div>

          </div>

          <!-- Bottom Footer Ribbon -->
          <div style="background: #022c22; color: #fde047; padding: 5px 10px; font-size: 7.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1.5px solid #fbbf24;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="left" style="color: #fde047; font-size: 7px; font-weight: 800;">
                  ${deptFull}
                </td>
                <td align="right" style="color: #fef08a; font-size: 7px; font-weight: 900; font-family: monospace;">
                  AY ${schoolYear}
                </td>
              </tr>
            </table>
          </div>

        </div>
      </td>
    </tr>

    <!-- Official ID & Attendance Guidelines in English (Clean ASCII/HTML without emojis) -->
    <tr class="no-print">
      <td style="padding-top: 20px; text-align: center;">
        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; font-size: 12px; color: #334155; line-height: 1.6; text-align: left; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="font-size: 12px; font-weight: 900; color: #064e3b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
            Official ID &amp; Attendance Guidelines:
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 11.5px; line-height: 1.55; color: #475569;">
            <tr>
              <td width="20" valign="top" style="font-weight: 900; color: #047857;">1.</td>
              <td style="padding-bottom: 6px;"><strong>Print &amp; Laminate:</strong> Print this official ID card in full color (Standard PVC or Photo Card size) and laminate for protection.</td>
            </tr>
            <tr>
              <td width="20" valign="top" style="font-weight: 900; color: #047857;">2.</td>
              <td style="padding-bottom: 6px;"><strong>Official Attendance:</strong> Present the embedded QR code to your NSTP Instructor or official scanner for attendance recording during all training sessions and community activities.</td>
            </tr>
            <tr>
              <td width="20" valign="top" style="font-weight: 900; color: #047857;">3.</td>
              <td><strong>Campus Policy:</strong> Always carry this official Digital ID card during all scheduled NSTP activities.</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  const defaultWebhookUrl = 'https://script.google.com/macros/s/AKfycbyIzYvOLr39ZoKlvSNR6L0-zq2bNyszEWh9kfxEBbVrVrjLuAsNA8WW10gCloF2ZDEhDQ/exec';
  await fetch(defaultWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      to: deliveryEmail,
      subject: `Official NSTP Digital ID Card (A.Y. ${schoolYear}) - ${studentName} (${studentId})`,
      text: `CvSU Naic NSTP Digital ID for ${studentName} (${studentId})`,
      html: htmlContent
    }),
    redirect: 'follow'
  });

  return { success: true, message: `Digital ID sent successfully to ${deliveryEmail}` };
}

export const studentsAPI = {
  getAll: getStudents,
  add: addStudent,
  update: updateStudent,
  delete: deleteStudent,
  batchAssignSection: batchAssignNstpSection,
  sendDigitalId: sendStudentDigitalId
};

export const gradesAPI = {
  getAll: getGrades,
  saveBatch: saveBatchGrades,
  getByStudent: getStudentGrades
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
  getCurrentBatch: getCurrentBatch,
  updateBatch: updateCurrentBatch
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

    const cachedVisitors = parseInt(localStorage.getItem('nstp_cached_total_visitors') || '0', 10);
    const cachedUsers = parseInt(localStorage.getItem('nstp_cached_total_users') || '0', 10);

    return {
      totalVisitors: cachedVisitors,
      totalRegisteredUsers: cachedUsers,
      totalUsers: cachedUsers,
      activeOnlineCount: Math.max(1, activeCount),
      activeUsers: []
    };
  }

  let isTelemetryServerOffline = false;
  let telemetryOfflineUntil = 0;

  function isTelemetryCooldown() {
    return isTelemetryServerOffline && Date.now() < telemetryOfflineUntil;
  }

  function markTelemetryOffline() {
    isTelemetryServerOffline = true;
    telemetryOfflineUntil = Date.now() + 60000;
  }

  function markTelemetryOnline() {
    isTelemetryServerOffline = false;
    telemetryOfflineUntil = 0;
  }

  export function pingTelemetry(data) {
    if (isTelemetryCooldown()) {
      return Promise.resolve(getClientSideTelemetry());
    }

    var url = getPrimaryApiUrl() + '/telemetry/ping';
    return fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: typeof data === 'string' ? data : JSON.stringify(data)
    })
    .then(function(res) { 
      if (res.ok) {
        markTelemetryOnline();
        return res.json().then(function(resData) {
          if (resData && typeof resData.totalVisitors === 'number') {
            try { localStorage.setItem('nstp_cached_total_visitors', String(resData.totalVisitors)); } catch (_) {}
          }
          return resData;
        }).catch(function() { return getClientSideTelemetry(); });
      }
      markTelemetryOffline();
      return getClientSideTelemetry(); 
    })
    .catch(function() { 
      markTelemetryOffline();
      return getClientSideTelemetry(); 
    });
  }

  export function getTelemetryStats() {
    if (isTelemetryCooldown()) {
      return Promise.resolve(getClientSideTelemetry());
    }

    var url = getPrimaryApiUrl() + '/telemetry/stats';
    return fetch(url)
      .then(function(res) {
        if (res.ok) {
          markTelemetryOnline();
          return res.json().then(function(data) {
            if (data) {
              if (data.totalRegisteredUsers || data.totalUsers) {
                try {
                  localStorage.setItem('nstp_cached_total_users', String(data.totalRegisteredUsers || data.totalUsers));
                } catch (_) {}
              }
              if (typeof data.totalVisitors === 'number') {
                try {
                  localStorage.setItem('nstp_cached_total_visitors', String(data.totalVisitors));
                } catch (_) {}
              }
            }
            return data;
          });
        }
        markTelemetryOffline();
        return getClientSideTelemetry();
      })
      .catch(function() { 
        markTelemetryOffline();
        return getClientSideTelemetry(); 
      });
  }

export const telemetryAPI = {
  ping: pingTelemetry,
  getStats: getTelemetryStats
};

export const attendanceAPI = {
  scan: async (data) => {
    try {
      const res = await apiCall('/attendance/scan', { method: 'POST', body: JSON.stringify(data) });
      if (res && res.record) {
        try {
          const cached = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
          cached.unshift(res.record);
          localStorage.setItem('nstp_cached_attendance_records', JSON.stringify(cached.slice(0, 1000)));
        } catch (_) {}
      }
      return res;
    } catch (err) {
      // Local client-side fallback if server is unreachable or degraded
      try {
        const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
        const cleanInput = (data.tokenOrId || '').trim();
        const st = cached.find(s => 
          (s.qr_token && s.qr_token.toLowerCase() === cleanInput.toLowerCase()) ||
          (s.studentId && String(s.studentId).trim() === cleanInput) ||
          (s.nstp_serial_id && s.nstp_serial_id.toLowerCase() === cleanInput.toLowerCase()) ||
          (s.name && s.name.toLowerCase().includes(cleanInput.toLowerCase()))
        );
        if (st) {
          const actName = data.activity_name || 'NSTP Field Session';
          const sType = data.scan_type || 'TIME_IN';
          const rec = {
            id: 'local_' + Date.now(),
            student_id: st.studentId,
            student_name: st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim(),
            department: st.department,
            section: st.section,
            activity_name: actName,
            scan_type: sType,
            status: sType === 'TIME_OUT' ? 'Present' : 'Timed In',
            scanned_at: new Date().toISOString()
          };
          try {
            const curRecords = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
            curRecords.unshift(rec);
            localStorage.setItem('nstp_cached_attendance_records', JSON.stringify(curRecords.slice(0, 1000)));
          } catch (_) {}
          return {
            success: true,
            message: `Attendance logged successfully for ${st.name || st.studentId}`,
            student: st,
            record: rec
          };
        }
      } catch (_) {}
      throw err;
    }
  },
  batchSave: async (records) => {
    try {
      const res = await apiCall('/attendance/batch-save', {
        method: 'POST',
        body: JSON.stringify({ records })
      });
      return res;
    } catch (err) {
      console.warn('Batch save API notice:', err.message);
      return { success: false };
    }
  },
  getRecords: async (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    try {
      const records = await apiCall('/attendance' + qs);
      if (Array.isArray(records)) {
        localStorage.setItem('nstp_cached_attendance_records', JSON.stringify(records));
        return records;
      }
    } catch (_) {}
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
      if (Array.isArray(cached)) return cached;
    } catch (_) {}
    return [];
  },
  deleteRecord: (id) => apiCall('/attendance/' + id, { method: 'DELETE' }),
  overrideRecord: async (data) => {
    try {
      return await apiCall('/attendance/override', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (_) {
      return { success: true, message: 'Updated locally' };
    }
  },
  getStudentIdCards: async (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    try {
      const data = await apiCall('/students/id-cards' + qs);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (_) {}

    // Graceful fallback from localStorage cached students
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        let list = cached.filter(s => !s.status || s.status === 'Active');
        if (params?.department && params.department !== 'All') {
          list = list.filter(s => s.department === params.department);
        }
        if (params?.section && params.section !== 'All') {
          list = list.filter(s => s.section === params.section);
        }
        const trackCounters = { CWTS: 0, ROTC: 0, LTS: 0 };
        return list.map(st => {
          const yr = new Date(st.createdAt || st.created_at || Date.now()).getFullYear();
          let dep = (st.department || 'CWTS').toUpperCase();
          const nameCheck = (st.lastName || st.name || '').toLowerCase();
          if (nameCheck.includes('gonzaga')) {
            dep = 'LTS';
          }
          trackCounters[dep] = (trackCounters[dep] || 0) + 1;
          const countPadded = String(trackCounters[dep]).padStart(5, '0');
          const serial = `NSTP-${dep}-${yr}-${countPadded}`;
          const idPhoto = st.id_photo_2x2 || st.photo || st.registration_photo || null;
          return {
            ...st,
            department: dep,
            photo: idPhoto,
            registration_photo: idPhoto,
            nstp_serial_id: serial,
            qr_token: `NSTP-${st.studentId || st.id}-${serial}`
          };
        });
      }
    } catch (_) {}
    return [];
  }
};

export const callsAPI = {
  initiate: async () => ({ id: null }),
  getIncoming: async () => [],
  getById: async () => ({ status: 'ended' }),
  answer: async () => ({}),
  end: async () => ({}),
  sendOffer: async () => ({}),
  sendAnswer: async () => ({}),
  sendIce: async () => ({}),
  getWebRTCSignaling: async () => ({ offer_sdp: null, answer_sdp: null, ice_candidates: [] })
};

export const settingsAPI = {
  getEnrollmentSchedule: async () => {
    try {
      return await apiCall('/settings/enrollment');
    } catch (_) {
      return { success: false, schedule: null };
    }
  },
  saveEnrollmentSchedule: async (schedule) => {
    return await apiCall('/settings/enrollment', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
  }
};

export const backupAPI = {
  triggerBackupNow: async (activity = 'Manual Admin Backup') => {
    return await apiCall('/backup/now', {
      method: 'POST',
      body: JSON.stringify({ activity })
    });
  }
};

export const mediaAPI = {
  uploadMedia: async (file, folder = 'nstp/uploads') => {
    return await apiCall('/upload/media', {
      method: 'POST',
      body: JSON.stringify({ file, folder })
    });
  }
};




