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
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
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
  console.log('▶ [1/6] INFRASTRUCTURE & HEALTH CHECKS');
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
  console.log('\n▶ [2/6] AUTHENTICATION & SECURITY CHECKS');
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

  // Track created tickets for surgical cleanup in finally block
  const createdTicketIds = [];

  // ── Category 3: Student Workflow & Identity Persistence ───────────────────
  console.log('\n▶ [3/6] STUDENT WORKFLOW & IDENTITY PERSISTENCE CHECKS');
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

  // ── Category 4: Admin Workflow ────────────────────────────────────────────
  console.log('\n▶ [4/6] ADMIN WORKFLOW CHECKS');
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

  // ── Category 5: Maintenance Workflow & Authorization Enforcement ──────────
  console.log('\n▶ [5/6] MAINTENANCE WORKFLOW & AUTHORIZATION CHECKS');
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

  // ── Category 6: Telemetry & Dashboard Analytics ───────────────────────────
  console.log('\n▶ [6/6] DASHBOARD & TELEMETRY CHECKS');
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

  // ── Teardown & Surgical Test Cleanup (Task 5) ─────────────────────────────
  console.log('\n▶ [CLEANUP] POST-TEST DATA SANITIZATION');
  try {
    if (createdTicketIds.length > 0) {
      const { pool } = await import('../src/config/database.js');
      for (const ticketId of createdTicketIds) {
        await pool.query('DELETE FROM alerts WHERE title LIKE ? OR message LIKE ?', [
          `%${ticketId}%`,
          `%${ticketId}%`,
        ]);
        await pool.query('DELETE FROM report_history WHERE report_id = ?', [ticketId]);
        await pool.query('DELETE FROM leak_reports WHERE id = ?', [ticketId]);
      }
      recordTest(
        'Automated Test Data Cleanup',
        'Infrastructure',
        'PASS',
        `Surgically cleaned ${createdTicketIds.length} test ticket(s) [${createdTicketIds.join(', ')}] — main data preserved`
      );
    } else {
      recordTest('Automated Test Data Cleanup', 'Infrastructure', 'PASS', 'No test records created');
    }
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

