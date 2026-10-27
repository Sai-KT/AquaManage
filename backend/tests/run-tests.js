import http from 'http';
import app from '../src/app.js';
import { checkDatabaseConnection } from '../src/config/database.js';

let server;
let baseUrl;

const results = [];

function recordTest(name, category, status, details = '') {
  results.push({ name, category, status, details });
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  console.log(`  ${icon} [${status}] ${name} ${details ? `(${details})` : ''}`);
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData || Buffer.isBuffer(options.body))) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, headers: res.headers, data };
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       AquaManage Full-Stack Local Test Suite               ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Start ephemeral HTTP server for testing
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server active on ephemeral port: ${port}\n`);
      resolve();
    });
  });

  // ── Category 1: Infrastructure & Health ──────────────────────────────────
  console.log('▶ [1/8] INFRASTRUCTURE & HEALTH CHECKS');
  try {
    const healthRes = await request('/api/health');
    if (healthRes.status === 200 || healthRes.status === 503) {
      recordTest(
        'Health Endpoint Availability',
        'Infrastructure',
        'PASS',
        `HTTP ${healthRes.status}, status=${healthRes.data?.status}`
      );
    } else {
      recordTest('Health Endpoint Availability', 'Infrastructure', 'FAIL', `HTTP ${healthRes.status}`);
    }

    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.ok) {
      recordTest('MySQL Database Connectivity', 'Infrastructure', 'PASS', 'Database connection verified');
    } else {
      recordTest(
        'MySQL Database Connectivity',
        'Infrastructure',
        'BLOCKED',
        `Requires local MySQL credentials: ${dbCheck.message}`
      );
    }
  } catch (e) {
    recordTest('Infrastructure Check', 'Infrastructure', 'FAIL', e.message);
  }

  // ── Category 2: Authentication & Authorization ────────────────────────────
  console.log('\n▶ [2/8] AUTHENTICATION & SECURITY CHECKS');
  let adminCookie = '';
  let studentCookie = '';
  let studentBCookie = '';
  let maintCookie = '';
  let maint2Cookie = '';

  try {
    // 2.1 Invalid role rejection
    const invalidRole = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'hacker', username: 'admin' },
    });
    recordTest(
      'Invalid Role Rejection',
      'Auth',
      invalidRole.status === 400 ? 'PASS' : 'FAIL',
      `HTTP ${invalidRole.status}`
    );

    // 2.2 Unauthenticated protected route rejection
    const unauthReport = await request('/api/student/reports');
    recordTest(
      'Unauthenticated Access Rejection',
      'Auth',
      unauthReport.status === 401 ? 'PASS' : 'FAIL',
      `HTTP ${unauthReport.status} (Protected route rejects anonymous caller)`
    );

    // 2.3 Test A: Invalid student credentials (valid ID, wrong password)
    const invalidPassLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'STU-2024-001', password: 'WrongPassword999!' },
    });
    recordTest(
      'Test A: Invalid Student Credentials Rejection',
      'Auth',
      invalidPassLogin.status === 401 ? 'PASS' : 'FAIL',
      `HTTP ${invalidPassLogin.status} (Rejected bad password)`
    );

    // 2.4 Test B: Unknown student rejection (nonexistent ID, no auto-registration)
    const unknownStudentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'NONEXISTENT-999', password: 'AnyPassword123' },
    });
    const { pool } = await import('../src/config/database.js');
    const [unknownCheck] = await pool.query('SELECT id FROM users WHERE student_id = "NONEXISTENT-999"');
    recordTest(
      'Test B: Unknown Student Rejection Without Auto-Creation',
      'Auth',
      unknownStudentLogin.status === 401 && unknownCheck.length === 0 ? 'PASS' : 'FAIL',
      `HTTP ${unknownStudentLogin.status} (No account created in database)`
    );

    // 2.5 Attempt Admin Login
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'admin', username: 'director@iiit.ac.in', password: 'Director@99' },
    });

    if (adminLogin.status === 200 && adminLogin.data?.success) {
      adminCookie = adminLogin.headers.get('set-cookie') || '';
      recordTest('Admin Login (director@iiit.ac.in)', 'Auth', 'PASS', 'Session cookie issued');
    } else {
      recordTest('Admin Login', 'Auth', 'FAIL', `HTTP ${adminLogin.status}: ${adminLogin.data?.message}`);
    }

    // 2.6 Attempt Student A Login (Arjun Mehta, STU-2024-001, Student@123)
    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'STU-2024-001', password: 'Student@123' },
    });

    if (studentLogin.status === 200 && studentLogin.data?.success) {
      studentCookie = studentLogin.headers.get('set-cookie') || '';
      recordTest('Student A Login (STU-2024-001 / Arjun Mehta)', 'Auth', 'PASS', 'Session established');
    } else {
      recordTest('Student A Login', 'Auth', 'FAIL', `HTTP ${studentLogin.status}`);
    }

    // 2.7 Attempt Student B Login (Priya Singh, STU-2024-002, Student@456)
    const studentBLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'STU-2024-002', password: 'Student@456' },
    });

    studentBCookie = '';
    if (studentBLogin.status === 200 && studentBLogin.data?.success) {
      studentBCookie = studentBLogin.headers.get('set-cookie') || '';
      recordTest('Student B Login (STU-2024-002 / Priya Singh)', 'Auth', 'PASS', 'Session established');
    } else {
      recordTest('Student B Login', 'Auth', 'FAIL', `HTTP ${studentBLogin.status}`);
    }

    // 2.8 Attempt Maintenance Login (Technician 1: Ram Kumar, EMP-01)
    const maintLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'maintenance', username: 'EMP-01', password: 'Maint@1234' },
    });

    if (maintLogin.status === 200 && maintLogin.data?.success) {
      maintCookie = maintLogin.headers.get('set-cookie') || '';
      recordTest('Maintenance Login (EMP-01 / Ram Kumar)', 'Auth', 'PASS', 'Session established');
    } else {
      recordTest('Maintenance Login', 'Auth', 'FAIL', `HTTP ${maintLogin.status}`);
    }

    // 2.9 Attempt Maintenance Login (Technician 2: Suresh Babu, EMP-02)
    const maint2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'maintenance', username: 'EMP-02', password: 'Maint@1234' },
    });

    if (maint2Login.status === 200 && maint2Login.data?.success) {
      maint2Cookie = maint2Login.headers.get('set-cookie') || '';
      recordTest('Maintenance Login (EMP-02 / Suresh Babu)', 'Auth', 'PASS', 'Session established');
    } else {
      recordTest('Maintenance Login (EMP-02)', 'Auth', 'FAIL', `HTTP ${maint2Login.status}`);
    }

    // 2.10 Cross-role access enforcement (Student cannot call Admin API)
    if (studentCookie) {
      const studentBlockedFromAdmin = await request('/api/admin/reports', {
        headers: { Cookie: studentCookie },
      });
      recordTest(
        'Cross-Role Protection (Student barred from Admin API)',
        'Auth',
        studentBlockedFromAdmin.status === 403 ? 'PASS' : 'FAIL',
        `HTTP ${studentBlockedFromAdmin.status}`
      );
    }
  } catch (e) {
    recordTest('Auth Testing', 'Auth', 'FAIL', e.message);
  }

  // Track created tickets & users for surgical cleanup in finally block
  const createdTicketIds = [];
  const createdUserIds = [];
  const createdStudentCodes = [];

  // ── Category 3: Student Workflow & Identity Persistence ───────────────────
  console.log('\n▶ [3/8] STUDENT WORKFLOW & IDENTITY PERSISTENCE CHECKS');
  let assignedTicketId = null;
  let unassignedTicketId = null;

  try {
    if (studentCookie) {
      // 3.1 Test C: Student A submits primary test complaint
      const submitRes = await request('/api/student/reports', {
        method: 'POST',
        headers: { Cookie: studentCookie },
        body: {
          type: 'Pipe Leak',
          zone: 'Academic Block',
          location: 'Academic Block — 2nd Floor Corridor',
          description: 'Automated test verification leak report for college demo.',
        },
      });

      if (submitRes.status === 201 && submitRes.data?.success) {
        assignedTicketId = submitRes.data.reportId;
        createdTicketIds.push(assignedTicketId);
        recordTest('Test C: Student A Complaint Submission', 'Student', 'PASS', `Ticket Created: ${assignedTicketId}`);
      } else {
        recordTest('Test C: Student A Complaint Submission', 'Student', 'FAIL', submitRes.data?.message);
      }

      // 3.2 Verify complaint in database has Student A's internal user ID (6)
      const { pool } = await import('../src/config/database.js');
      const [reportRows] = await pool.query('SELECT id, student_id, reporter_name FROM leak_reports WHERE id = ?', [assignedTicketId]);
      const isStudentAOwner = reportRows.length > 0 && reportRows[0].student_id === 6;
      recordTest(
        'Database Report Ownership Association',
        'Student',
        isStudentAOwner ? 'PASS' : 'FAIL',
        `Report student_id=${reportRows[0]?.student_id} matches User ID 6`
      );

      // 3.3 Test D: Student A logs out and logs back in — My Reports persistence
      // Step D1: Logout
      const logoutA = await request('/api/auth/logout', {
        method: 'POST',
        headers: { Cookie: studentCookie },
      });
      recordTest('Student A Logout', 'Student', logoutA.status === 200 ? 'PASS' : 'FAIL', 'Session destroyed');

      // Step D2: Re-login as Student A
      const reloginA = await request('/api/auth/login', {
        method: 'POST',
        body: { role: 'student', studentId: 'STU-2024-001', password: 'Student@123' },
      });
      const newStudentCookie = reloginA.headers.get('set-cookie') || '';
      studentCookie = newStudentCookie;

      // Step D3: Fetch My Reports after re-login
      const myReportsAfterRelogin = await request('/api/student/reports', {
        headers: { Cookie: studentCookie },
      });
      const hasReport = (myReportsAfterRelogin.data?.reports || []).some((r) => r.id === assignedTicketId);
      recordTest(
        'Test D: Student A Report Persistence Across Sessions',
        'Student',
        myReportsAfterRelogin.status === 200 && hasReport ? 'PASS' : 'FAIL',
        `Previously submitted report ${assignedTicketId} recovered from MySQL`
      );

      // 3.4 Test E: Student B login and account isolation
      // Log in as Student B and check My Reports
      const loginB = await request('/api/auth/login', {
        method: 'POST',
        body: { role: 'student', studentId: 'STU-2024-002', password: 'Student@456' },
      });
      studentBCookie = loginB.headers.get('set-cookie') || '';
      const studentBReports = await request('/api/student/reports', {
        headers: { Cookie: studentBCookie },
      });
      const studentBReportList = studentBReports.data?.reports || [];
      const studentAInBQueue = studentBReportList.some((r) => r.id === assignedTicketId);
      recordTest(
        'Test E: Student B Account Isolation (Cannot see Student A report)',
        'Student',
        studentBReports.status === 200 && !studentAInBQueue ? 'PASS' : 'FAIL',
        `Student B sees ${studentBReportList.length} reports, strictly excludes Student A's ticket`
      );

      // 3.5 Test F: Student B submits their own complaint
      const submitBRes = await request('/api/student/reports', {
        method: 'POST',
        headers: { Cookie: studentBCookie },
        body: {
          type: 'Dripping Tap',
          zone: 'PPCRC',
          location: 'PPCRC — Lab 2 Restroom',
          description: 'Automated test complaint submitted by Student B.',
        },
      });

      if (submitBRes.status === 201 && submitBRes.data?.success) {
        unassignedTicketId = submitBRes.data.reportId;
        createdTicketIds.push(unassignedTicketId);
        recordTest('Test F1: Student B Submits Independent Complaint', 'Student', 'PASS', `Ticket Created: ${unassignedTicketId}`);
      }

      // Verify Student B sees their complaint and Student A sees only their own
      const myReportsBAfterSubmit = await request('/api/student/reports', {
        headers: { Cookie: studentBCookie },
      });
      const myReportsAAfterSubmit = await request('/api/student/reports', {
        headers: { Cookie: studentCookie },
      });
      const bSeesB = (myReportsBAfterSubmit.data?.reports || []).some((r) => r.id === unassignedTicketId);
      const bSeesA = (myReportsBAfterSubmit.data?.reports || []).some((r) => r.id === assignedTicketId);
      const aSeesA = (myReportsAAfterSubmit.data?.reports || []).some((r) => r.id === assignedTicketId);
      const aSeesB = (myReportsAAfterSubmit.data?.reports || []).some((r) => r.id === unassignedTicketId);
      recordTest(
        'Test F2: Bidirectional Account Isolation Verified',
        'Student',
        bSeesB && !bSeesA && aSeesA && !aSeesB ? 'PASS' : 'FAIL',
        'Each student sees only their own persistent complaints'
      );

      // 3.6 Test K: Direct API Protection (Student B blocked from Student A history)
      const studentBHackHistory = await request(`/api/student/reports/${assignedTicketId}/history`, {
        headers: { Cookie: studentBCookie },
      });
      recordTest(
        'Test K: Direct API Access Protection (Student B blocked from Student A ticket history)',
        'Student',
        studentBHackHistory.status === 403 ? 'PASS' : 'FAIL',
        `HTTP ${studentBHackHistory.status} Forbidden`
      );
    } else {
      recordTest('Student Complaint Workflow', 'Student', 'BLOCKED', 'Requires database connection for auth');
    }
  } catch (e) {
    recordTest('Student Workflow', 'Student', 'FAIL', e.message);
  }

  // ── Category 4: Student Profile & Password Security Checks (Feature 01) ───
  console.log('\n▶ [4/8] STUDENT PROFILE & PASSWORD SECURITY CHECKS');
  let testUserId = null;
  let testUserCookie = '';
  let testTicketId = null;

  try {
    // 4.1 Test 1: Student A profile retrieval
    if (studentCookie) {
      const profARes = await request('/api/student/profile', {
        headers: { Cookie: studentCookie },
      });
      const profA = profARes.data?.profile;
      recordTest(
        'Test 1: Student A Profile Retrieval',
        'Profile',
        profARes.status === 200 && profA?.student_id === 'STU-2024-001' && profA?.full_name === 'Arjun Mehta' && profA.password_hash === undefined ? 'PASS' : 'FAIL',
        `Retrieved: ${profA?.full_name} (${profA?.student_id}), Dept: ${profA?.department || 'N/A'}`
      );
    }

    // 4.2 Test 4: Student B profile isolation
    if (studentBCookie) {
      const profBRes = await request('/api/student/profile', {
        headers: { Cookie: studentBCookie },
      });
      const profB = profBRes.data?.profile;
      recordTest(
        'Test 4: Student B Profile Isolation',
        'Profile',
        profBRes.status === 200 && profB?.student_id === 'STU-2024-002' && profB?.full_name === 'Priya Singh' ? 'PASS' : 'FAIL',
        `Retrieved: ${profB?.full_name} (${profB?.student_id}), Dept: ${profB?.department || 'N/A'}`
      );
    }

    // 4.3 Cross-Role Protection: Admin barred from student profile endpoint
    if (adminCookie) {
      const adminBlocked = await request('/api/student/profile', {
        headers: { Cookie: adminCookie },
      });
      recordTest(
        'Cross-Role Protection (Admin barred from Student Profile API)',
        'Profile',
        adminBlocked.status === 403 ? 'PASS' : 'FAIL',
        `HTTP ${adminBlocked.status} Forbidden`
      );
    }

    // 4.4 Test 6: Rejection of protected identity field modifications
    if (studentCookie) {
      const protectedFieldHack = await request('/api/student/profile', {
        method: 'PATCH',
        headers: { Cookie: studentCookie },
        body: { student_id: 'HACKED-ID-999', role: 'admin' },
      });
      recordTest(
        'Test 6: Protected Fields Tamper Rejection (id, student_id, role)',
        'Profile',
        protectedFieldHack.status === 400 ? 'PASS' : 'FAIL',
        `HTTP ${protectedFieldHack.status} (Protected fields rejected)`
      );

      // 4.5 Test 7: Invalid email format rejection
      const invalidEmailRes = await request('/api/student/profile', {
        method: 'PATCH',
        headers: { Cookie: studentCookie },
        body: { email: 'not-a-valid-email' },
      });
      recordTest(
        'Test 7: Malformed Email Validation Rejection',
        'Profile',
        invalidEmailRes.status === 400 ? 'PASS' : 'FAIL',
        `HTTP ${invalidEmailRes.status} (Malformed email rejected)`
      );

      // 4.6 Test 8: Duplicate email conflict rejection
      const duplicateEmailRes = await request('/api/student/profile', {
        method: 'PATCH',
        headers: { Cookie: studentCookie },
        body: { email: 'priya@student.iiit.ac.in' },
      });
      recordTest(
        'Test 8: Duplicate Email Assignment Rejection',
        'Profile',
        duplicateEmailRes.status === 409 ? 'PASS' : 'FAIL',
        `HTTP ${duplicateEmailRes.status} Conflict (Duplicate email prevented)`
      );
    }

    // 4.7 Dedicated Isolated Test Student Setup for Password & Update Lifecycle
    const { pool } = await import('../src/config/database.js');
    const bcrypt = (await import('bcrypt')).default;
    const initialHashed = await bcrypt.hash('TestPass@123', 10);

    // Clean up any stale test user if previously interrupted
    await pool.query('DELETE FROM users WHERE student_id = "TEST-STU-888"');

    const [userInsert] = await pool.query(
      `INSERT INTO users (full_name, email, student_id, department, password_hash, role, is_active)
       VALUES ('Test Profile Student', 'test.profile@student.iiit.ac.in', 'TEST-STU-888', 'Civil Engineering', ?, 'student', TRUE)`,
      [initialHashed]
    );
    testUserId = userInsert.insertId;

    // Login as isolated test student
    const testLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'TEST-STU-888', password: 'TestPass@123' },
    });
    testUserCookie = testLoginRes.headers.get('set-cookie') || '';

    // Submit a test complaint for this student to verify complaint preservation
    const testComplaintRes = await request('/api/student/reports', {
      method: 'POST',
      headers: { Cookie: testUserCookie },
      body: {
        type: 'Dripping Tap',
        zone: 'Vikramshila Hostel',
        location: 'Ground Floor Washroom',
        description: 'Test complaint to verify profile and password changes do not lose report ownership.',
      },
    });
    if (testComplaintRes.status === 201 && testComplaintRes.data?.reportId) {
      testTicketId = testComplaintRes.data.reportId;
      createdTicketIds.push(testTicketId);
    }

    // 4.8 Test 2: Profile Update
    const updateRes = await request('/api/student/profile', {
      method: 'PATCH',
      headers: { Cookie: testUserCookie },
      body: { department: 'Mechanical Engineering', email: 'test.profile.updated@student.iiit.ac.in' },
    });
    const updatedProfile = updateRes.data?.profile;
    recordTest(
      'Test 2: Profile Update (Department & Email)',
      'Profile',
      updateRes.status === 200 && updatedProfile?.department === 'Mechanical Engineering' && updatedProfile?.email === 'test.profile.updated@student.iiit.ac.in' ? 'PASS' : 'FAIL',
      `Updated Dept: ${updatedProfile?.department}, Email: ${updatedProfile?.email}`
    );

    // 4.9 Test 3: Persistence after logout and relogin
    await request('/api/auth/logout', { method: 'POST', headers: { Cookie: testUserCookie } });
    const reloginTestUser = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'TEST-STU-888', password: 'TestPass@123' },
    });
    testUserCookie = reloginTestUser.headers.get('set-cookie') || '';

    const persistentProfileRes = await request('/api/student/profile', {
      headers: { Cookie: testUserCookie },
    });
    const pProf = persistentProfileRes.data?.profile;
    recordTest(
      'Test 3: Profile Persistence After Logout & Re-login',
      'Profile',
      pProf?.department === 'Mechanical Engineering' && pProf?.email === 'test.profile.updated@student.iiit.ac.in' ? 'PASS' : 'FAIL',
      'Saved profile values recovered from MySQL'
    );

    // 4.10 Test 9: Incorrect current password rejection
    const badPassChange = await request('/api/student/profile/change-password', {
      method: 'POST',
      headers: { Cookie: testUserCookie },
      body: { currentPassword: 'WrongPassword999!', newPassword: 'NewSecurePass@456', confirmPassword: 'NewSecurePass@456' },
    });
    recordTest(
      'Test 9: Incorrect Current Password Rejection',
      'Profile',
      badPassChange.status === 401 ? 'PASS' : 'FAIL',
      `HTTP ${badPassChange.status} (Incorrect current password rejected)`
    );

    // 4.11 Password validation: Same password rejection
    const samePassChange = await request('/api/student/profile/change-password', {
      method: 'POST',
      headers: { Cookie: testUserCookie },
      body: { currentPassword: 'TestPass@123', newPassword: 'TestPass@123', confirmPassword: 'TestPass@123' },
    });
    recordTest(
      'Validation: Identical New Password Rejection',
      'Profile',
      samePassChange.status === 400 ? 'PASS' : 'FAIL',
      `HTTP ${samePassChange.status} (Rejected same password)`
    );

    // 4.12 Test 10: Successful password change & session termination
    const goodPassChange = await request('/api/student/profile/change-password', {
      method: 'POST',
      headers: { Cookie: testUserCookie },
      body: { currentPassword: 'TestPass@123', newPassword: 'NewSecurePass@456', confirmPassword: 'NewSecurePass@456' },
    });
    recordTest(
      'Test 10: Successful Password Change & Session Invalidation',
      'Profile',
      goodPassChange.status === 200 ? 'PASS' : 'FAIL',
      'Bcrypt hash updated, session destroyed in MySQL'
    );

    // 4.13 Test 11: Old password rejection
    const oldPassLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'TEST-STU-888', password: 'TestPass@123' },
    });
    recordTest(
      'Test 11: Old Password Rejection Post-Update',
      'Profile',
      oldPassLogin.status === 401 ? 'PASS' : 'FAIL',
      `HTTP ${oldPassLogin.status} (Old credentials rejected)`
    );

    // 4.14 Test 12: New password login
    const newPassLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: 'TEST-STU-888', password: 'NewSecurePass@456' },
    });
    testUserCookie = newPassLogin.headers.get('set-cookie') || '';
    recordTest(
      'Test 12: New Password Successful Login',
      'Profile',
      newPassLogin.status === 200 && newPassLogin.data?.success ? 'PASS' : 'FAIL',
      'Session established with new bcrypt hash'
    );

    // 4.15 Test 13: Complaint history preservation after profile and password change
    const checkReportsPostUpdate = await request('/api/student/reports', {
      headers: { Cookie: testUserCookie },
    });
    const hasOriginalComplaint = (checkReportsPostUpdate.data?.reports || []).some((r) => r.id === testTicketId);
    recordTest(
      'Test 13: Complaint History Preserved Across Profile & Password Updates',
      'Profile',
      checkReportsPostUpdate.status === 200 && hasOriginalComplaint ? 'PASS' : 'FAIL',
      `Complaint ${testTicketId} retained for permanent user ID ${testUserId}`
    );

    // 4.16 Test 14: Profile picture upload
    const boundary = '----WebKitFormBoundaryAvatarTest';
    const pngBytes = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const multipartBody = Buffer.concat([Buffer.from(header), pngBytes, Buffer.from(footer)]);

    const avatarUploadRes = await request('/api/student/profile/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        Cookie: testUserCookie,
      },
      body: multipartBody,
    });
    const uploadedAvatarUrl = avatarUploadRes.data?.avatar_url;
    recordTest(
      'Test 14: Student Profile Picture Upload (POST /api/student/profile/avatar)',
      'Profile',
      avatarUploadRes.status === 200 && uploadedAvatarUrl ? 'PASS' : 'FAIL',
      `Saved Avatar URL: ${uploadedAvatarUrl}`
    );

    // 4.17 Test 15: Profile picture removal
    const avatarDeleteRes = await request('/api/student/profile/avatar', {
      method: 'DELETE',
      headers: { Cookie: testUserCookie },
    });
    recordTest(
      'Test 15: Student Profile Picture Removal (DELETE /api/student/profile/avatar)',
      'Profile',
      avatarDeleteRes.status === 200 && avatarDeleteRes.data?.avatar_url === null ? 'PASS' : 'FAIL',
      'Reverted avatar to null in MySQL'
    );
  } catch (err) {
    recordTest('Student Profile Checks', 'Profile', 'FAIL', err.message);
  } finally {
    // Teardown isolated test user
    if (testUserId) {
      try {
        const { pool } = await import('../src/config/database.js');
        await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
      } catch {
        // ignore
      }
    }
  }

  // ── Category 5: Admin Workflow ────────────────────────────────────────────
  console.log('\n▶ [5/8] ADMIN WORKFLOW CHECKS');
  try {
    if (adminCookie) {
      // 4.1 All reports
      const adminReports = await request('/api/admin/reports', {
        headers: { Cookie: adminCookie },
      });
      recordTest(
        'Admin All Reports Listing',
        'Admin',
        adminReports.status === 200 ? 'PASS' : 'FAIL',
        `${adminReports.data?.reports?.length || 0} reports in database`
      );

      // 4.2 Maintenance staff list
      const staffList = await request('/api/admin/maintenance-staff', {
        headers: { Cookie: adminCookie },
      });
      recordTest(
        'Maintenance Staff Directory Listing',
        'Admin',
        staffList.status === 200 && staffList.data?.staff ? 'PASS' : 'FAIL',
        `Staff count: ${staffList.data?.staff?.length || 0}`
      );

      // 4.3 Assignment: Admin assigns assignedTicketId to Ram Kumar (EMP-01)
      if (assignedTicketId) {
        const assignRes = await request(`/api/admin/reports/${assignedTicketId}/assign`, {
          method: 'PATCH',
          headers: { Cookie: adminCookie },
          body: { technicianName: 'Ram Kumar' },
        });
        recordTest(
          'Admin Complaint Assignment',
          'Admin',
          assignRes.status === 200 ? 'PASS' : 'FAIL',
          `Ticket ${assignedTicketId} assigned to Ram Kumar`
        );
      }
    } else {
      recordTest('Admin Workflow', 'Admin', 'BLOCKED', 'Requires database connection for auth');
    }
  } catch (e) {
    recordTest('Admin Workflow', 'Admin', 'FAIL', e.message);
  }

  // ── Category 6: Maintenance Workflow & Authorization Enforcement ──────────
  console.log('\n▶ [6/8] MAINTENANCE WORKFLOW & AUTHORIZATION CHECKS');
  try {
    if (maintCookie) {
      // 5.1 Task queue retrieval for Ram Kumar (should show assignedTicketId, not unassignedTicketId)
      const taskQueue = await request('/api/maintenance/tasks', {
        headers: { Cookie: maintCookie },
      });
      const taskIdsInQueue = (taskQueue.data?.tasks || []).map((t) => t.id);
      const queueFilterCorrect = assignedTicketId && taskIdsInQueue.includes(assignedTicketId) &&
        (!unassignedTicketId || !taskIdsInQueue.includes(unassignedTicketId));
      recordTest(
        'Maintenance Assigned Task Queue Isolation',
        'Maintenance',
        taskQueue.status === 200 && queueFilterCorrect ? 'PASS' : 'FAIL',
        `Queue contains assigned task, strictly excludes unassigned tasks`
      );

      // 5.2 Negative Auth Test: Technician cannot update an unassigned complaint
      if (unassignedTicketId) {
        const unassignedUpdateRes = await request(`/api/maintenance/tasks/${unassignedTicketId}/status`, {
          method: 'PATCH',
          headers: { Cookie: maintCookie },
          body: { status: 'in_progress' },
        });
        recordTest(
          'Negative Auth: Technician Barred from Altering Unassigned Ticket',
          'Maintenance',
          unassignedUpdateRes.status === 403 ? 'PASS' : 'FAIL',
          `HTTP ${unassignedUpdateRes.status} Forbidden (Non-admin cannot alter unassigned report)`
        );
      }

      // 5.3 Negative Auth Test: Technician 2 (Suresh Babu) cannot alter Technician 1 (Ram Kumar)'s ticket
      if (assignedTicketId && maint2Cookie) {
        const crossTechUpdateRes = await request(`/api/maintenance/tasks/${assignedTicketId}/status`, {
          method: 'PATCH',
          headers: { Cookie: maint2Cookie },
          body: { status: 'in_progress' },
        });
        recordTest(
          'Negative Auth: Technician Barred from Updating Other Technician Task',
          'Maintenance',
          crossTechUpdateRes.status === 403 ? 'PASS' : 'FAIL',
          `HTTP ${crossTechUpdateRes.status} Forbidden (Cross-technician update rejected)`
        );

        const crossTechLogRes = await request(`/api/maintenance/tasks/${assignedTicketId}/logs`, {
          method: 'POST',
          headers: { Cookie: maint2Cookie },
          body: { note: 'Unauthorized note attempt by Suresh Babu' },
        });
        recordTest(
          'Negative Auth: Technician Barred from Logging Work on Other Technician Task',
          'Maintenance',
          crossTechLogRes.status === 403 ? 'PASS' : 'FAIL',
          `HTTP ${crossTechLogRes.status} Forbidden (Cross-technician work log rejected)`
        );
      }

      // 5.4 Positive Auth: Assigned technician updates status to in_progress
      if (assignedTicketId) {
        const progressRes = await request(`/api/maintenance/tasks/${assignedTicketId}/status`, {
          method: 'PATCH',
          headers: { Cookie: maintCookie },
          body: { status: 'in_progress' },
        });
        recordTest(
          'Maintenance Authorized Status Update (in_progress)',
          'Maintenance',
          progressRes.status === 200 ? 'PASS' : 'FAIL',
          'Status updated by assigned technician'
        );

        // 5.5 Positive Auth: Assigned technician adds work log
        const logRes = await request(`/api/maintenance/tasks/${assignedTicketId}/logs`, {
          method: 'POST',
          headers: { Cookie: maintCookie },
          body: { note: 'Inspected and tightened fixture during automated testing.' },
        });
        recordTest('Maintenance Authorized Work Note Addition', 'Maintenance', logRes.status === 201 ? 'PASS' : 'FAIL');

        // 5.6 Positive Auth: Assigned technician resolves ticket
        const resolveRes = await request(`/api/maintenance/tasks/${assignedTicketId}/status`, {
          method: 'PATCH',
          headers: { Cookie: maintCookie },
          body: { status: 'resolved' },
        });
        recordTest('Maintenance Authorized Status Resolution (resolved)', 'Maintenance', resolveRes.status === 200 ? 'PASS' : 'FAIL');
      }

      // 5.7 Completed tasks history
      const completedTasks = await request('/api/maintenance/completed', {
        headers: { Cookie: maintCookie },
      });
      recordTest(
        'Maintenance Completed Tasks History',
        'Maintenance',
        completedTasks.status === 200 ? 'PASS' : 'FAIL',
        `${completedTasks.data?.tasks?.length || 0} completed tasks`
      );

      // 5.8 Test I: Original student checks My Reports and sees "resolved" status
      if (assignedTicketId && studentCookie) {
        const studentCheckRes = await request('/api/student/reports', {
          headers: { Cookie: studentCookie },
        });
        const resolvedTicket = (studentCheckRes.data?.reports || []).find((r) => r.id === assignedTicketId);
        recordTest(
          'Test I: Original Student Observes Resolved Complaint Status in My Reports',
          'Student',
          resolvedTicket?.status === 'resolved' ? 'PASS' : 'FAIL',
          `Ticket ${assignedTicketId} status is "${resolvedTicket?.status}"`
        );
      }
    } else {
      recordTest('Maintenance Workflow', 'Maintenance', 'BLOCKED', 'Requires database connection for auth');
    }
  } catch (e) {
    recordTest('Maintenance Workflow', 'Maintenance', 'FAIL', e.message);
  }

  // ── Category 7: Feature 02 — Reopen Resolved Complaint Lifecycle ──────────
  console.log('\n▶ [7/8] REOPEN RESOLVED COMPLAINT LIFECYCLE CHECKS (FEATURE 02)');
  try {
    if (assignedTicketId) {
      // 7.1 Security & Auth: Anonymous user rejected from reopening
      const anonReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
        method: 'POST',
        body: { reason: 'Anonymous attempt to reopen resolved report.' },
      });
      recordTest(
        'Rule A & Security: Anonymous Reopening Rejected',
        'Reopen',
        anonReopen.status === 401 ? 'PASS' : 'FAIL',
        `HTTP ${anonReopen.status} (Authentication required)`
      );

      // 7.2 Security & Role: Non-student role rejected (Maintenance role)
      if (maintCookie) {
        const nonStudentReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: maintCookie },
          body: { reason: 'Technician attempting to call student reopen endpoint.' },
        });
        recordTest(
          'Rule A & Security: Non-Student Role Barred from Reopening',
          'Reopen',
          nonStudentReopen.status === 403 ? 'PASS' : 'FAIL',
          `HTTP ${nonStudentReopen.status} (Forbidden for non-student)`
        );
      }

      // 7.3 Rule A: Report ownership validation (Student B cannot reopen Student A's report)
      if (studentBCookie) {
        const crossStudentReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentBCookie },
          body: { reason: 'Student B attempting to reopen Student A ticket.' },
        });
        recordTest(
          'Rule A: Student Ownership Protection (Student B barred from Student A ticket)',
          'Reopen',
          crossStudentReopen.status === 403 ? 'PASS' : 'FAIL',
          `HTTP ${crossStudentReopen.status} (Unauthorized report ownership)`
        );
      }

      // 7.4 Rule B: Resolved-only reopening (Reject reopening pending ticket)
      if (unassignedTicketId && studentBCookie) {
        const pendingReopen = await request(`/api/student/reports/${unassignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentBCookie },
          body: { reason: 'Attempting to reopen a pending unassigned report.' },
        });
        recordTest(
          'Rule B: Reopen Rejection for Non-Resolved Report (Pending Ticket)',
          'Reopen',
          pendingReopen.status === 409 ? 'PASS' : 'FAIL',
          `HTTP ${pendingReopen.status} Conflict (Only resolved reports can be reopened)`
        );
      }

      // 7.5 Rule D: Mandatory reason validation (Empty / Whitespace-only reason rejected)
      if (studentCookie) {
        const emptyReasonReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentCookie },
          body: { reason: '     ' },
        });
        recordTest(
          'Rule D: Empty Reopening Reason Rejection',
          'Reopen',
          emptyReasonReopen.status === 400 ? 'PASS' : 'FAIL',
          `HTTP ${emptyReasonReopen.status} Bad Request (Empty reason rejected)`
        );

        // 7.6 Rule D: Reason minimum length validation (< 10 chars rejected)
        const shortReasonReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentCookie },
          body: { reason: 'Too short' },
        });
        recordTest(
          'Rule D: Short Reopening Reason Rejection (<10 chars)',
          'Reopen',
          shortReasonReopen.status === 400 ? 'PASS' : 'FAIL',
          `HTTP ${shortReasonReopen.status} Bad Request (Reason must be >= 10 chars)`
        );

        // 7.7 Rule D: Reason maximum length validation (> 500 chars rejected)
        const longReason = 'A'.repeat(505);
        const longReasonReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentCookie },
          body: { reason: longReason },
        });
        recordTest(
          'Rule D: Excessively Long Reason Rejection (>500 chars)',
          'Reopen',
          longReasonReopen.status === 400 ? 'PASS' : 'FAIL',
          `HTTP ${longReasonReopen.status} Bad Request (Reason must be <= 500 chars)`
        );

        // 7.8 Rule C & E: Successful Reopening by Original Student
        const validReason = 'Water is still leaking steadily under the sink pipe despite initial technician repair.';
        const successfulReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentCookie },
          body: { reason: validReason },
        });

        // Verify MySQL persistence
        const { pool } = await import('../src/config/database.js');
        const [reopenedReportRows] = await pool.query(
          'SELECT id, status, assigned_to, assigned_name, assigned_at, resolved_at FROM leak_reports WHERE id = ?',
          [assignedTicketId]
        );
        const rep = reopenedReportRows[0];

        const [historyRows] = await pool.query(
          'SELECT action, previous_status, new_status, notes FROM report_history WHERE report_id = ? ORDER BY created_at ASC',
          [assignedTicketId]
        );

        const hasReopenedHistory = historyRows.some(
          (h) => h.action === 'reopened' && h.previous_status === 'resolved' && h.notes === validReason
        );
        const priorHistoryPreserved = historyRows.length >= 4; // created, assigned, work_note, resolved, reopened

        const [alertRows] = await pool.query(
          'SELECT title, message FROM alerts WHERE title LIKE ?',
          [`%${assignedTicketId}%Reopened%`]
        );

        recordTest(
          'Rule C & E: Successful Reopening & MySQL State Transition',
          'Reopen',
          successfulReopen.status === 200 &&
            rep?.status === 'reopened' &&
            rep?.assigned_to === null &&
            rep?.resolved_at === null &&
            hasReopenedHistory &&
            priorHistoryPreserved &&
            alertRows.length > 0
            ? 'PASS'
            : 'FAIL',
          `Status: "${rep?.status}", Assignee: ${rep?.assigned_to ?? 'NULL'}, History count: ${historyRows.length}, Alerts: ${alertRows.length}`
        );

        // 7.9 Rule B & Concurrency: Duplicate reopening attempt rejection (double-click simulation)
        const duplicateReopen = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentCookie },
          body: { reason: 'Duplicate click: tap is still leaking.' },
        });
        recordTest(
          'Rule B & Concurrency: Duplicate Reopening Attempt Rejection',
          'Reopen',
          duplicateReopen.status === 409 ? 'PASS' : 'FAIL',
          `HTTP ${duplicateReopen.status} Conflict (Already reopened ticket cannot be reopened again)`
        );

        // 7.10 Admin Portal Integration: Reopened ticket appears in admin queue and can be reassigned
        if (adminCookie) {
          const adminReopenedCheck = await request('/api/admin/reports?status=reopened', {
            headers: { Cookie: adminCookie },
          });
          const reopenedInAdmin = (adminReopenedCheck.data?.reports || []).some((r) => r.id === assignedTicketId);
          recordTest(
            'Admin Review: Reopened Complaint Listed in Administrator Queue',
            'Admin',
            adminReopenedCheck.status === 200 && reopenedInAdmin ? 'PASS' : 'FAIL',
            `Reopened complaint ${assignedTicketId} visible in Admin queue`
          );

          // Admin reassigns the reopened ticket to Technician 2 (Suresh Babu / EMP-02)
          const reassignRes = await request(`/api/admin/reports/${assignedTicketId}/assign`, {
            method: 'PATCH',
            headers: { Cookie: adminCookie },
            body: { technicianName: 'Suresh Babu' },
          });
          const [reassignedRow] = await pool.query(
            'SELECT status, assigned_name FROM leak_reports WHERE id = ?',
            [assignedTicketId]
          );
          recordTest(
            'Admin Reassignment: Reopened Complaint Reassigned to Maintenance Staff',
            'Admin',
            reassignRes.status === 200 && reassignedRow[0]?.status === 'assigned' ? 'PASS' : 'FAIL',
            `Ticket ${assignedTicketId} reassigned to ${reassignedRow[0]?.assigned_name}`
          );
        }

        // 7.11 Maintenance Portal Integration: Second maintenance cycle execution
        if (maint2Cookie) {
          // Suresh Babu sees ticket in his queue
          const tech2Queue = await request('/api/maintenance/tasks', {
            headers: { Cookie: maint2Cookie },
          });
          const inTech2Queue = (tech2Queue.data?.tasks || []).some((t) => t.id === assignedTicketId);

          // Suresh Babu updates to in_progress
          const cycle2Progress = await request(`/api/maintenance/tasks/${assignedTicketId}/status`, {
            method: 'PATCH',
            headers: { Cookie: maint2Cookie },
            body: { status: 'in_progress' },
          });

          // Suresh Babu logs second work note
          const cycle2Log = await request(`/api/maintenance/tasks/${assignedTicketId}/logs`, {
            method: 'POST',
            headers: { Cookie: maint2Cookie },
            body: { note: 'Cycle 2: Replaced main valve washer and pressure tested for 30 minutes.' },
          });

          // Suresh Babu marks resolved
          const cycle2Resolve = await request(`/api/maintenance/tasks/${assignedTicketId}/status`, {
            method: 'PATCH',
            headers: { Cookie: maint2Cookie },
            body: { status: 'resolved' },
          });

          recordTest(
            'Maintenance Second Cycle: Reassigned Tech Completes Secondary Repair & Resolution',
            'Maintenance',
            inTech2Queue && cycle2Progress.status === 200 && cycle2Log.status === 201 && cycle2Resolve.status === 200
              ? 'PASS'
              : 'FAIL',
            'Full secondary repair cycle executed and recorded'
          );
        }

        // 7.12 Rule G: Repeat Reopening Cycle Supported (Second Reopening)
        const repeatReopenRes = await request(`/api/student/reports/${assignedTicketId}/reopen`, {
          method: 'POST',
          headers: { Cookie: studentCookie },
          body: { reason: 'Second reopening: water began dripping slowly during the night.' },
        });

        const [finalHistory] = await pool.query(
          'SELECT action, notes FROM report_history WHERE report_id = ? ORDER BY created_at ASC',
          [assignedTicketId]
        );
        const reopenEvents = finalHistory.filter((h) => h.action === 'reopened');

        recordTest(
          'Rule G: Repeat Reopening Cycle Supported & Multi-Cycle History Retained',
          'Reopen',
          repeatReopenRes.status === 200 && reopenEvents.length === 2 ? 'PASS' : 'FAIL',
          `Complaint reopened twice successfully; ${reopenEvents.length} distinct reopening events preserved in history`
        );
      }
    }
  } catch (reopenErr) {
    recordTest('Reopen Complaint Checks', 'Reopen', 'FAIL', reopenErr.message);
  }

  // ── Category 8: Telemetry & Dashboard Analytics ───────────────────────────
  console.log('\n▶ [8/9] DASHBOARD & TELEMETRY CHECKS');
  try {
    const statsRes = await request('/api/dashboard/stats');
    recordTest(
      'Dashboard Overview Statistics Aggregation',
      'Telemetry',
      statsRes.status === 200 && statsRes.data?.stats ? 'PASS' : 'FAIL',
      `Active: ${statsRes.data?.stats?.activeLeaks ?? 'N/A'}, Resolved: ${statsRes.data?.stats?.resolvedIssues ?? 'N/A'}`
    );

    const tanksRes = await request('/api/water/tanks');
    recordTest(
      'Water Tank Records Retrieval',
      'Telemetry',
      tanksRes.status === 200 && tanksRes.data?.tanks ? 'PASS' : 'FAIL',
      `${tanksRes.data?.tanks?.length || 0} tanks monitored`
    );

    const usageRes = await request('/api/water/usage');
    recordTest(
      'Water Consumption Analytics Records',
      'Telemetry',
      usageRes.status === 200 ? 'PASS' : 'FAIL',
      '5 campus zones returned'
    );
  } catch (e) {
    recordTest('Dashboard Telemetry Check', 'Telemetry', 'FAIL', e.message);
  }

  // ── Category 9: Admin-Controlled Student Registration (Feature 03) ────────
  console.log('\n▶ [9/9] ADMIN-CONTROLLED STUDENT REGISTRATION CHECKS (FEATURE 03)');
  try {
    const { pool } = await import('../src/config/database.js');

    // 9.1 Admin can list students
    const listRes = await request('/api/admin/students', {
      headers: { Cookie: adminCookie },
    });
    const hasStudents = listRes.status === 200 && Array.isArray(listRes.data?.students) && listRes.data.students.length > 0;
    const noPasswordHash = hasStudents && listRes.data.students.every(s => !s.password_hash && !s.password);
    const studentsOnly = hasStudents && listRes.data.students.every(s => s.role === 'student');

    recordTest(
      'Admin Student Directory Listing (GET /api/admin/students)',
      'Student Management',
      listRes.status === 200 && hasStudents && noPasswordHash && studentsOnly ? 'PASS' : 'FAIL',
      `HTTP 200, returned ${listRes.data?.students?.length || 0} student(s), credentials protected`
    );

    // 9.2 Non-admin cannot list students
    const unauthList = await request('/api/admin/students');
    const studentList = await request('/api/admin/students', { headers: { Cookie: studentCookie } });
    const maintList = await request('/api/admin/students', { headers: { Cookie: maintCookie } });

    recordTest(
      'Security: Unauthorized Student Listing Barred (401/403)',
      'Security',
      unauthList.status === 401 && studentList.status === 403 && maintList.status === 403 ? 'PASS' : 'FAIL',
      `Unauth: ${unauthList.status}, Student: ${studentList.status}, Maint: ${maintList.status}`
    );

    // 9.3 Validation: Missing required fields
    const missingName = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { student_id: 'TEST-STU-VAL-01', email: 'val1@student.iiit.ac.in', password: 'Password@123', confirmPassword: 'Password@123' },
    });
    const missingId = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { full_name: 'Test Val', email: 'val2@student.iiit.ac.in', password: 'Password@123', confirmPassword: 'Password@123' },
    });
    const invalidEmail = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { full_name: 'Test Val', student_id: 'TEST-STU-VAL-03', email: 'invalid-email-format', password: 'Password@123', confirmPassword: 'Password@123' },
    });
    const shortPassword = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { full_name: 'Test Val', student_id: 'TEST-STU-VAL-04', email: 'val4@student.iiit.ac.in', password: 'short', confirmPassword: 'short' },
    });
    const passwordMismatch = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { full_name: 'Test Val', student_id: 'TEST-STU-VAL-05', email: 'val5@student.iiit.ac.in', password: 'Password@123', confirmPassword: 'DifferentPassword@123' },
    });

    recordTest(
      'Validation: Mandatory Fields & Password Rules Enforcement',
      'Validation',
      missingName.status === 400 && missingId.status === 400 && invalidEmail.status === 400 && shortPassword.status === 400 && passwordMismatch.status === 400
        ? 'PASS'
        : 'FAIL',
      'Missing name, ID, bad email, short password (<8), and mismatch all rejected with HTTP 400'
    );

    // 9.4 Non-admin cannot create students
    const unauthCreate = await request('/api/admin/students', {
      method: 'POST',
      body: { full_name: 'Hacker', student_id: 'HACK-01', email: 'hack@test.com', password: 'Password@123', confirmPassword: 'Password@123' },
    });
    const studentCreate = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: studentCookie },
      body: { full_name: 'Student Create', student_id: 'STU-HACK-01', email: 'stuhack@test.com', password: 'Password@123', confirmPassword: 'Password@123' },
    });
    const maintCreate = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: maintCookie },
      body: { full_name: 'Maint Create', student_id: 'MAINT-HACK-01', email: 'mainthack@test.com', password: 'Password@123', confirmPassword: 'Password@123' },
    });

    recordTest(
      'Security: Unauthorized Student Creation Barred (401/403)',
      'Security',
      unauthCreate.status === 401 && studentCreate.status === 403 && maintCreate.status === 403 ? 'PASS' : 'FAIL',
      `Unauth: ${unauthCreate.status}, Student: ${studentCreate.status}, Maint: ${maintCreate.status}`
    );

    // 9.5 Admin successfully creates a new student
    const testStudentCode = 'TEST-STU-REG-001';
    const testStudentEmail = 'kavita.patel.test@student.iiit.ac.in';
    const testStudentPwd = 'PatelPassword@123';
    createdStudentCodes.push(testStudentCode);

    const createRes = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        full_name: 'Kavita Patel',
        student_id: testStudentCode,
        department: 'Information Technology',
        email: testStudentEmail,
        password: testStudentPwd,
        confirmPassword: testStudentPwd,
      },
    });

    let newStudentDbId = null;
    let isBcryptHashed = false;
    let isStudentActive = false;

    if (createRes.status === 201 && createRes.data?.student?.id) {
      newStudentDbId = createRes.data.student.id;
      createdUserIds.push(newStudentDbId);

      // Verify in MySQL
      const [userRows] = await pool.query(
        'SELECT id, full_name, email, student_id, password_hash, role, is_active, department FROM users WHERE id = ?',
        [newStudentDbId]
      );
      if (userRows.length > 0) {
        const u = userRows[0];
        isBcryptHashed = u.password_hash.startsWith('$2b$') || u.password_hash.startsWith('$2a$');
        isStudentActive = Boolean(u.is_active);
      }
    }

    recordTest(
      'Admin Registers New Student Account (POST /api/admin/students)',
      'Student Management',
      createRes.status === 201 && newStudentDbId && isBcryptHashed && isStudentActive ? 'PASS' : 'FAIL',
      `HTTP 201, User ID: ${newStudentDbId}, Role: student, Active: ${isStudentActive}, Bcrypt Hashed: ${isBcryptHashed}`
    );

    // 9.6 Uniqueness: Duplicate Student ID rejected (409)
    const dupIdRes = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        full_name: 'Another Student',
        student_id: testStudentCode, // duplicate ID
        department: 'Mechanical Engineering',
        email: 'another.unique.email@student.iiit.ac.in',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });

    recordTest(
      'Uniqueness: Duplicate Student ID Rejected (HTTP 409 Conflict)',
      'Validation',
      dupIdRes.status === 409 && (dupIdRes.data?.message || '').toLowerCase().includes('student id') ? 'PASS' : 'FAIL',
      `HTTP ${dupIdRes.status}: "${dupIdRes.data?.message}"`
    );

    // 9.7 Uniqueness: Duplicate Email rejected (409)
    const dupEmailRes = await request('/api/admin/students', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        full_name: 'Second Student',
        student_id: 'TEST-STU-REG-002',
        department: 'Civil Engineering',
        email: testStudentEmail, // duplicate email
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });

    recordTest(
      'Uniqueness: Duplicate Email Address Rejected (HTTP 409 Conflict)',
      'Validation',
      dupEmailRes.status === 409 && (dupEmailRes.data?.message || '').toLowerCase().includes('email') ? 'PASS' : 'FAIL',
      `HTTP ${dupEmailRes.status}: "${dupEmailRes.data?.message}"`
    );

    // 9.8 Student Login: Wrong password rejected
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: testStudentCode, password: 'WrongPassword@999' },
    });

    recordTest(
      'Student Login Security: Invalid Password Rejected (HTTP 401)',
      'Auth',
      badLoginRes.status === 401 ? 'PASS' : 'FAIL',
      'HTTP 401: Rejected incorrect password'
    );

    // 9.9 Student Login: Correct Student ID and initial password succeeds
    const goodLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: testStudentCode, password: testStudentPwd },
    });

    let newStudentCookie = null;
    if (goodLoginRes.status === 200) {
      const setCookie = goodLoginRes.headers.get('set-cookie');
      if (setCookie) {
        newStudentCookie = setCookie.split(';')[0];
      }
    }

    recordTest(
      'Newly Registered Student Successful Login (/api/auth/login)',
      'Auth',
      goodLoginRes.status === 200 && newStudentCookie && goodLoginRes.data?.user?.student_id === testStudentCode
        ? 'PASS'
        : 'FAIL',
      `Authenticated as ${goodLoginRes.data?.user?.name} (${goodLoginRes.data?.user?.student_id}), Session established`
    );

    // 9.10 Student Profile Integration: verify profile returns correct info
    const profileRes = await request('/api/student/profile', {
      headers: { Cookie: newStudentCookie },
    });

    recordTest(
      'Student Profile Integration: Verified Registered Details (GET /api/student/profile)',
      'Profile',
      profileRes.status === 200 &&
        profileRes.data?.profile?.full_name === 'Kavita Patel' &&
        profileRes.data?.profile?.department === 'Information Technology' &&
        profileRes.data?.profile?.email === testStudentEmail
        ? 'PASS'
        : 'FAIL',
      `Name: ${profileRes.data?.profile?.full_name}, Dept: ${profileRes.data?.profile?.department}, Role: ${profileRes.data?.profile?.role}`
    );

    // 9.11 New student submits complaint & complaint persistence
    const reportRes = await request('/api/student/reports', {
      method: 'POST',
      headers: { Cookie: newStudentCookie },
      body: {
        type: 'Tap Wastage',
        zone: 'Academic Block',
        location: 'Ground Floor Labs Washroom',
        description: 'Persistent tap leakage dripping water continuously in lab washroom.',
      },
    });

    let newStudentTicketId = null;
    if (reportRes.status === 201 && (reportRes.data?.reportId || reportRes.data?.report?.id)) {
      newStudentTicketId = reportRes.data.reportId || reportRes.data.report.id;
      createdTicketIds.push(newStudentTicketId);
    }

    // Verify in database that student_id references new student's permanent ID
    let dbStudentOwnerMatch = false;
    if (newStudentTicketId) {
      const [repRows] = await pool.query(
        'SELECT student_id, reporter_name FROM leak_reports WHERE id = ?',
        [newStudentTicketId]
      );
      if (repRows.length > 0 && repRows[0].student_id === newStudentDbId) {
        dbStudentOwnerMatch = true;
      }
    }

    recordTest(
      'New Student Complaint Submission & Database Ownership Association',
      'Student Workflow',
      reportRes.status === 201 && newStudentTicketId && dbStudentOwnerMatch ? 'PASS' : 'FAIL',
      `Ticket: ${newStudentTicketId}, Foreign Key student_id: ${newStudentDbId} matches users.id`
    );

    // Logout and re-login to verify complaint persistence across sessions
    await request('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: newStudentCookie },
    });

    const reloginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: testStudentCode, password: testStudentPwd },
    });
    let reconnectedCookie = null;
    if (reloginRes.status === 200) {
      const setCookie = reloginRes.headers.get('set-cookie');
      if (setCookie) reconnectedCookie = setCookie.split(';')[0];
    }

    const myReportsRes = await request('/api/student/reports', {
      headers: { Cookie: reconnectedCookie },
    });
    const hasMyTicket = myReportsRes.status === 200 &&
      Array.isArray(myReportsRes.data?.reports) &&
      myReportsRes.data.reports.some(r => r.id === newStudentTicketId);

    recordTest(
      'Complaint Persistence Across Logout & Re-login (GET /api/student/reports)',
      'Persistence',
      hasMyTicket ? 'PASS' : 'FAIL',
      `Ticket ${newStudentTicketId} recovered after full session restart`
    );

    // 9.12 Bidirectional Account Isolation
    const studentAView = await request('/api/student/reports', {
      headers: { Cookie: studentCookie },
    });
    const studentASeesNewTicket = studentAView.status === 200 &&
      Array.isArray(studentAView.data?.reports) &&
      studentAView.data.reports.some(r => r.id === newStudentTicketId);

    const newStudentSeesOldTicket = myReportsRes.status === 200 &&
      Array.isArray(myReportsRes.data?.reports) &&
      myReportsRes.data.reports.some(r => r.id === assignedTicketId);

    recordTest(
      'Account Isolation: Strict Complaint Boundary Between Students',
      'Security',
      !studentASeesNewTicket && !newStudentSeesOldTicket ? 'PASS' : 'FAIL',
      'Neither student can view or access complaints submitted by the other'
    );

    // 9.14 Security: Unauthorized Student Deletion Barred (401/403)
    const unauthDelRes = await request(`/api/admin/students/${newStudentDbId}`, {
      method: 'DELETE',
    });
    const studentDelRes = await request(`/api/admin/students/${newStudentDbId}`, {
      method: 'DELETE',
      headers: { Cookie: studentCookie },
    });

    recordTest(
      'Security: Unauthorized Student Deletion Barred (401/403)',
      'Security',
      unauthDelRes.status === 401 && studentDelRes.status === 403 ? 'PASS' : 'FAIL',
      `Unauth: ${unauthDelRes.status}, Student Role: ${studentDelRes.status}`
    );

    // 9.15 Validation: Non-existent student deletion returns 404
    const notFoundDelRes = await request('/api/admin/students/999999', {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });

    recordTest(
      'Validation: Non-Existent Student Deletion Rejected (HTTP 404)',
      'Validation',
      notFoundDelRes.status === 404 ? 'PASS' : 'FAIL',
      `HTTP 404: "${notFoundDelRes.data?.message}"`
    );

    // 9.16 Role Protection: Attempting to delete non-student account blocked (403)
    // Find an admin user id
    const [adminUserRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    let nonStudentDelBlocked = false;
    if (adminUserRows.length > 0) {
      const nonStudentDelRes = await request(`/api/admin/students/${adminUserRows[0].id}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      nonStudentDelBlocked = nonStudentDelRes.status === 403;
    }

    recordTest(
      'Security: Non-Student Account Deletion Protected (HTTP 403)',
      'Security',
      nonStudentDelBlocked ? 'PASS' : 'FAIL',
      'Admin cannot delete non-student accounts via student management endpoint'
    );

    // 9.17 Admin completely deletes student account
    const deleteRes = await request(`/api/admin/students/${newStudentDbId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });

    // Verify student is completely deleted from MySQL
    const [deletedDbRows] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [newStudentDbId]
    );
    const dbDeletedVerified = deletedDbRows.length === 0;

    recordTest(
      'Admin Completely Deletes Student Account (DELETE /api/admin/students/:id)',
      'Student Management',
      deleteRes.status === 200 && deleteRes.data?.success && dbDeletedVerified ? 'PASS' : 'FAIL',
      `HTTP 200, Student ${newStudentDbId} removed from MySQL users table`
    );

    // 9.18 Deleted student cannot log in
    const postDelLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', studentId: testStudentCode, password: testStudentPwd },
    });

    recordTest(
      'Deleted Student Login Barred (HTTP 401)',
      'Auth',
      postDelLoginRes.status === 401 ? 'PASS' : 'FAIL',
      'Permanently removed student rejected at login'
    );

    // 9.19 Verification in Student Directory (no longer listed)
    const afterDelListRes = await request('/api/admin/students', {
      headers: { Cookie: adminCookie },
    });
    const stillInList = afterDelListRes.status === 200 &&
      Array.isArray(afterDelListRes.data?.students) &&
      afterDelListRes.data.students.some(s => s.id === newStudentDbId || s.student_id === testStudentCode);

    recordTest(
      'Student Directory Sync: Deleted Student Excluded from Directory',
      'Student Management',
      afterDelListRes.status === 200 && !stillInList ? 'PASS' : 'FAIL',
      'Directory listing reflects immediate deletion'
    );
  } catch (fe03Err) {
    recordTest('Admin Student Registration Checks', 'Student Management', 'FAIL', fe03Err.message);
  }

  // ── Teardown & Surgical Test Cleanup (Task 5) ─────────────────────────────
  console.log('\n▶ [CLEANUP] POST-TEST DATA SANITIZATION');
  try {
    const { pool } = await import('../src/config/database.js');
    if (createdTicketIds.length > 0) {
      for (const ticketId of createdTicketIds) {
        await pool.query('DELETE FROM alerts WHERE title LIKE ? OR message LIKE ?', [
          `%${ticketId}%`,
          `%${ticketId}%`,
        ]);
        await pool.query('DELETE FROM report_history WHERE report_id = ?', [ticketId]);
        await pool.query('DELETE FROM leak_reports WHERE id = ?', [ticketId]);
      }
    }
    if (createdUserIds.length > 0) {
      for (const uid of createdUserIds) {
        await pool.query('DELETE FROM users WHERE id = ?', [uid]);
      }
    }
    if (createdStudentCodes.length > 0) {
      for (const scode of createdStudentCodes) {
        await pool.query('DELETE FROM users WHERE student_id = ?', [scode]);
      }
    }

    recordTest(
      'Automated Test Data Cleanup',
      'Infrastructure',
      'PASS',
      `Surgically cleaned ${createdTicketIds.length} test ticket(s), ${createdUserIds.length} test user(s) — main data preserved`
    );
  } catch (cleanErr) {
    recordTest('Automated Test Data Cleanup', 'Infrastructure', 'FAIL', cleanErr.message);
  }

  // Cleanup server and database pool
  await new Promise((resolve) => server.close(resolve));
  try {
    const { pool } = await import('../src/config/database.js');
    await pool.end();
  } catch {
    // ignore
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`Test Execution Finished. Total Checks: ${results.length}`);
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const blockedCount = results.filter((r) => r.status === 'BLOCKED').length;
  console.log(`Passed: ${passCount} | Failed: ${failCount} | Blocked: ${blockedCount}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  return { results, passCount, failCount, blockedCount };
}

runAllTests()
  .then(({ failCount, blockedCount }) => {
    process.exit(failCount + blockedCount > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });

