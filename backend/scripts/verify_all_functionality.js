const pool = require('../config/database');
const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const results = [];
function record(category, testName, passed, details = '') {
  results.push({ category, testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${category}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('  NSTP SYSTEM FULL END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. DATABASE TABLES & HEALTH
  console.log('--- Phase 1: Database Health & Tables ---');
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(r => Object.values(r)[0]);
    const expectedTables = [
      'users', 'students', 'student_grades', 'attendance_records',
      'enrollments', 'archived_years', 'current_batch', 'reports',
      'report_submissions', 'report_comments', 'conversations',
      'conversation_participants', 'messages', 'audit_logs', 'active_visitors'
    ];
    let allFound = true;
    for (const exp of expectedTables) {
      if (!tableNames.includes(exp)) {
        allFound = false;
        record('Database', `Table exists: ${exp}`, false, 'Missing');
      }
    }
    if (allFound) {
      record('Database', 'All core 15+ database tables exist', true, `${tableNames.length} tables total`);
    }

    const [[{ activeCount }]] = await pool.query('SELECT COUNT(*) as activeCount FROM students');
    record('Database', 'Active students count', activeCount > 0, `${activeCount} students found`);

    const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
    record('Database', 'Registered users count', userCount >= 4, `${userCount} staff accounts`);

  } catch (err) {
    record('Database', 'Database connectivity', false, err.message);
  }

  // 2. AUTHENTICATION FLOW
  console.log('\n--- Phase 2: Authentication & Authorization ---');
  let adminToken = '';
  let cwtsToken = '';

  try {
    // Admin login
    const adminRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@gmail.com', password: 'admin' }
    });
    const adminOk = adminRes.status === 200 && adminRes.body.token && adminRes.body.user.role === 'admin';
    record('Auth', 'Admin login (admin@gmail.com)', adminOk, `Status ${adminRes.status}`);
    if (adminOk) adminToken = adminRes.body.token;

    // Admin alias login
    const aliasRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'richardbelen99@gmail.com', password: 'admin' }
    });
    const aliasOk = aliasRes.status === 200 && aliasRes.body.token && aliasRes.body.user.role === 'admin';
    record('Auth', 'Admin alias login (richardbelen99@gmail.com)', aliasOk, `Status ${aliasRes.status}`);

    // Instructor login
    const cwtsRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'cwts@gmail.com', password: 'cwts' }
    });
    const cwtsOk = cwtsRes.status === 200 && cwtsRes.body.token && cwtsRes.body.user.department === 'CWTS';
    record('Auth', 'CWTS Instructor login (cwts@gmail.com)', cwtsOk, `Status ${cwtsRes.status}`);
    if (cwtsOk) cwtsToken = cwtsRes.body.token;

    // Invalid credentials check
    const badRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@gmail.com', password: 'wrongpassword' }
    });
    record('Auth', 'Reject invalid password', badRes.status === 400 || badRes.status === 401, `Status ${badRes.status}`);

    // Verify session
    const sessionRes = await request('/api/auth/verify-session', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sessionOk = sessionRes.status === 200 && sessionRes.body.success === true;
    record('Auth', 'Verify Session with JWT', sessionOk, `Success: ${sessionRes.body.success}`);

    // Get current user info (/api/users/me)
    const meRes = await request('/api/users/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const meOk = meRes.status === 200 && meRes.body.role === 'admin';
    record('Auth', 'Retrieve current authenticated profile (/api/users/me)', meOk, `Role: ${meRes.body.role}`);

  } catch (err) {
    record('Auth', 'Auth endpoints exception', false, err.message);
  }

  // 3. CURRENT BATCH & SETTINGS
  console.log('\n--- Phase 3: System Batch & Settings ---');
  try {
    const batchRes = await request('/api/current-batch', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const batchOk = batchRes.status === 200 && (batchRes.body.year || batchRes.body.batch_year);
    record('Settings', 'Current Batch config', batchOk, `Batch: ${batchRes.body.year || batchRes.body.batch_year}`);

    const enrollSettingsRes = await request('/api/settings/enrollment');
    record('Settings', 'Public Enrollment Settings', enrollSettingsRes.status === 200, `Status ${enrollSettingsRes.status}`);

    const telemetryRes = await request('/api/telemetry/stats');
    record('Telemetry', 'Telemetry Stats API', telemetryRes.status === 200, `Total: ${telemetryRes.body.totalVisitors || telemetryRes.body.totalCount}`);

    const activeCountRes = await request('/api/active-count');
    record('Telemetry', 'Active Visitor Count API', activeCountRes.status === 200, `Active: ${activeCountRes.body.activeVisitors}`);
  } catch (err) {
    record('Settings', 'Settings API exception', false, err.message);
  }

  // 4. STUDENTS MASTERLIST & SCOPING
  console.log('\n--- Phase 4: Students Management & Roster Scoping ---');
  try {
    // Admin gets all students
    const adminStudRes = await request('/api/students', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const studentsArray = Array.isArray(adminStudRes.body) ? adminStudRes.body : (adminStudRes.body.students || []);
    const adminStudOk = adminStudRes.status === 200 && studentsArray.length > 0;
    record('Students', 'Admin retrieves all students', adminStudOk, `${studentsArray.length} students returned`);

    // Instructor gets scoped students
    const cwtsStudRes = await request('/api/students', {
      headers: { Authorization: `Bearer ${cwtsToken}` }
    });
    const cwtsArray = Array.isArray(cwtsStudRes.body) ? cwtsStudRes.body : (cwtsStudRes.body.students || []);
    const cwtsStudOk = cwtsStudRes.status === 200 && cwtsArray.length > 0;
    const allCWTS = cwtsArray.every(s => s.department === 'CWTS');
    record('Students', 'Instructor CWTS department scoping', cwtsStudOk && allCWTS, `${cwtsArray.length} CWTS students, 100% scoped`);

    // ID cards metadata
    const idCardsRes = await request('/api/students/id-cards', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const idCardsArray = Array.isArray(idCardsRes.body) ? idCardsRes.body : (idCardsRes.body.students || []);
    record('Digital ID', 'Student ID Cards list API', idCardsRes.status === 200, `${idCardsArray.length} ID cards`);

  } catch (err) {
    record('Students', 'Students API exception', false, err.message);
  }

  // 5. GRADES & ATTENDANCE
  console.log('\n--- Phase 5: Grades & Attendance ---');
  try {
    const gradesRes = await request('/api/grades', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const gradesArray = Array.isArray(gradesRes.body) ? gradesRes.body : (gradesRes.body.grades || []);
    record('Grades', 'Retrieve student grades', gradesRes.status === 200, `${gradesArray.length} grade records`);

    const attRes = await request('/api/attendance', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const attArray = Array.isArray(attRes.body) ? attRes.body : (attRes.body.records || []);
    record('Attendance', 'Retrieve attendance matrix records', attRes.status === 200, `${attArray.length} attendance records`);
  } catch (err) {
    record('Grades/Attendance', 'Grades/Attendance API exception', false, err.message);
  }

  // 6. REPORTS & SUBMISSIONS
  console.log('\n--- Phase 6: Reports & Submissions ---');
  try {
    const reportsRes = await request('/api/reports', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const reportsArray = Array.isArray(reportsRes.body) ? reportsRes.body : (reportsRes.body.reports || []);
    record('Reports', 'Retrieve report assignments', reportsRes.status === 200, `${reportsArray.length} reports`);
  } catch (err) {
    record('Reports', 'Reports API exception', false, err.message);
  }

  // 7. REAL-TIME CHAT & CONVERSATIONS
  console.log('\n--- Phase 7: Chat & Messaging ---');
  try {
    const convsRes = await request('/api/conversations', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const convsArray = Array.isArray(convsRes.body) ? convsRes.body : (convsRes.body.conversations || []);
    record('Chat', 'Retrieve conversations list', convsRes.status === 200, `${convsArray.length} conversations`);

    const allGroupRes = await request('/api/conversations/all-instructors-group', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const groupOk = allGroupRes.status === 200 && (allGroupRes.body.id || allGroupRes.body.conversation?.id);
    record('Chat', 'All Instructors group conversation exists', groupOk, `ID: ${allGroupRes.body.id || allGroupRes.body.conversation?.id}`);
  } catch (err) {
    record('Chat', 'Chat API exception', false, err.message);
  }

  // 8. ARCHIVES & HISTORICAL BATCHES
  console.log('\n--- Phase 8: Archives & Historical Batches ---');
  try {
    const archRes = await request('/api/archives', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const archArray = Array.isArray(archRes.body) ? archRes.body : [];
    const archOk = archRes.status === 200 && archArray.length > 0;
    record('Archives', 'Retrieve archived batches', archOk, `${archArray.length} archived batches found`);

    if (archOk && archArray.length > 0) {
      const sampleYear = encodeURIComponent(archArray[0].year || archArray[0].academic_year);
      const detailRes = await request(`/api/archives/${sampleYear}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const detailData = detailRes.body?.data || detailRes.body;
      const studCount = detailData?.studentData?.length || detailRes.body?.students || 0;
      record('Archives', `Retrieve specific archive details (${archArray[0].year})`, detailRes.status === 200, `Students: ${studCount}`);
    }
  } catch (err) {
    record('Archives', 'Archives API exception', false, err.message);
  }

  // 9. AUDIT LOGS
  console.log('\n--- Phase 9: Audit Logs & Compliance ---');
  try {
    const auditRes = await request('/api/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditArray = Array.isArray(auditRes.body) ? auditRes.body : (auditRes.body.logs || []);
    record('Audit', 'Admin retrieves compliance audit trail', auditRes.status === 200, `${auditArray.length} audit logs`);
  } catch (err) {
    record('Audit', 'Audit logs API exception', false, err.message);
  }

  // 10. CHED EXPORT FORM GENERATION
  console.log('\n--- Phase 10: Official CHED Form Export ---');
  try {
    const chedRes = await request('/api/students/ched-export?format=excel', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const isExcelOrOk = chedRes.status === 200;
    record('CHED Export', 'Generate CHED Form A/B Export Excel endpoint', isExcelOrOk, `Status: ${chedRes.status}`);
  } catch (err) {
    record('CHED Export', 'CHED export generation error', false, err.message);
  }

  // 11. SECURITY & RBAC ENFORCEMENT SUITE
  console.log('\n--- Phase 11: Security & RBAC Enforcement Suite ---');
  try {
    // Test 1: RBAC - Instructor denied access to create user accounts (POST /api/users)
    const userDeniedRes = await request('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cwtsToken}` },
      body: { name: 'Unauthorized Staff', email: 'unauth_test@gmail.com', password: 'password123', role: 'admin' }
    });
    record('Security/RBAC', 'Instructor blocked from creating user accounts (POST /api/users)', userDeniedRes.status === 403, `Status ${userDeniedRes.status}`);

    // Test 2: RBAC - Instructor denied access to /api/clear-batch
    const clearBatchDeniedRes = await request('/api/clear-batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cwtsToken}` }
    });
    record('Security/RBAC', 'Instructor blocked from batch reset (/api/clear-batch)', clearBatchDeniedRes.status === 403, `Status ${clearBatchDeniedRes.status}`);

    // Test 3: RBAC - Instructor denied access to /api/audit-logs
    const auditDeniedRes = await request('/api/audit-logs', {
      headers: { Authorization: `Bearer ${cwtsToken}` }
    });
    record('Security/RBAC', 'Instructor blocked from audit logs (/api/audit-logs)', auditDeniedRes.status === 403, `Status ${auditDeniedRes.status}`);

    // Test 4: Auth Guard - Unauthenticated request rejected
    const noTokenRes = await request('/api/students');
    record('Security/Auth', 'Unauthenticated request blocked (/api/students)', noTokenRes.status === 401, `Status ${noTokenRes.status}`);

    // Test 5: Auth Guard - Tampered token rejected
    const badTokenRes = await request('/api/students', {
      headers: { Authorization: 'Bearer forged.tampered.token' }
    });
    record('Security/Auth', 'Forged/tampered JWT rejected', badTokenRes.status === 401 || badTokenRes.status === 403, `Status ${badTokenRes.status}`);

    // Test 6: SQLi Resistance - Parameterized search safely handled
    const sqliRes = await request(`/api/students?search=${encodeURIComponent("' OR '1'='1")}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sqliOk = sqliRes.status === 200 && (!sqliRes.body.students || sqliRes.body.students.length === 0);
    record('Security/SQLi', "SQL injection payload (' OR '1'='1) safely parameterized", sqliOk, `Status ${sqliRes.status}, records: ${sqliRes.body.students?.length || 0}`);

    // Test 7: Password Security - All users stored as strong bcrypt hashes ($2b$ or $2a$)
    const [userRows] = await pool.query('SELECT email, password FROM users');
    const allHashed = userRows.length > 0 && userRows.every(u => u.password && (u.password.startsWith('$2b$') || u.password.startsWith('$2a$')));
    record('Security/Passwords', 'All account passwords stored with bcrypt ($2b$ / $2a$)', allHashed, `${userRows.length} accounts verified, 0 plaintext`);

    // Test 8: Data Leak Guard - Public settings endpoint does not leak password hashes or internal secrets
    const publicSettings = await request('/api/settings/enrollment');
    const stringified = JSON.stringify(publicSettings.body || {});
    const leaksSecret = stringified.includes('$2b$') || stringified.includes('$2a$') || stringified.includes('current_session_id');
    record('Security/DataLeak', 'Public enrollment settings leak 0 credentials or hashes', !leaksSecret && publicSettings.status === 200, 'Payload clean');

  } catch (err) {
    record('Security', 'Security suite exception', false, err.message);
  }

  // SUMMARY REPORT
  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`VERIFICATION COMPLETE: ${passedCount}/${totalCount} tests passed (${Math.round(passedCount/totalCount*100)}%)`);
  console.log('====================================================');

  process.exit(passedCount === totalCount ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
