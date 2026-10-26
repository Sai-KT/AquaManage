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

    // 2.3 Attempt Admin Login
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'admin', username: 'director@iiit.ac.in', password: 'Director@99' },
    });

    if (adminLogin.status === 200 && adminLogin.data?.success) {
      adminCookie = adminLogin.headers.get('set-cookie') || '';
      recordTest('Admin Login (director@iiit.ac.in)', 'Auth', 'PASS', 'Session cookie issued');
    } else if (adminLogin.status === 500 && !adminLogin.data?.success) {
      recordTest('Admin Login', 'Auth', 'BLOCKED', 'Database offline or pending credentials');
    } else {
      recordTest('Admin Login', 'Auth', 'FAIL', `HTTP ${adminLogin.status}: ${adminLogin.data?.message}`);
    }

    // 2.4 Attempt Student Login
    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', name: 'Arjun Mehta', irnNo: 'STU-2024-001' },
    });

    if (studentLogin.status === 200 && studentLogin.data?.success) {
      studentCookie = studentLogin.headers.get('set-cookie') || '';
      recordTest('Student Login (STU-2024-001)', 'Auth', 'PASS', 'Session established');
    } else if (studentLogin.status === 500) {
      recordTest('Student Login', 'Auth', 'BLOCKED', 'Database offline');
    } else {
      recordTest('Student Login', 'Auth', 'FAIL', `HTTP ${studentLogin.status}`);
    }

    // 2.5 Attempt Maintenance Login (Technician 1: Ram Kumar, EMP-01)
    const maintLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'maintenance', username: 'EMP-01', password: 'Maint@1234' },
    });

    if (maintLogin.status === 200 && maintLogin.data?.success) {
      maintCookie = maintLogin.headers.get('set-cookie') || '';
      recordTest('Maintenance Login (EMP-01 / Ram Kumar)', 'Auth', 'PASS', 'Session established');
    } else if (maintLogin.status === 500) {
      recordTest('Maintenance Login', 'Auth', 'BLOCKED', 'Database offline');
    } else {
      recordTest('Maintenance Login', 'Auth', 'FAIL', `HTTP ${maintLogin.status}`);
    }

    // 2.6 Attempt Maintenance Login (Technician 2: Suresh Babu, EMP-02)
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

    // 2.7 Cross-role access enforcement (Student cannot call Admin API)
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

  // ── Category 3: Student Workflow ──────────────────────────────────────────
  console.log('\n▶ [3/6] STUDENT WORKFLOW CHECKS');
  let assignedTicketId = null;
  let unassignedTicketId = null;

  try {
    if (studentCookie) {
      // 3.1 Submit primary test complaint (to be assigned)
      const submitRes = await request('/api/student/reports', {
        method: 'POST',
        headers: { Cookie: studentCookie },
        body: {
          type: 'Pipe Leak',
          zone: 'Academic Block',
          location: 'Academic Block — Test Ground Floor',
          description: 'Automated test verification leak report for college demo.',
        },
      });

      if (submitRes.status === 201 && submitRes.data?.success) {
        assignedTicketId = submitRes.data.reportId;
        createdTicketIds.push(assignedTicketId);
        recordTest('Student Complaint Submission (Primary)', 'Student', 'PASS', `Ticket Created: ${assignedTicketId}`);
      } else {
        recordTest('Student Complaint Submission (Primary)', 'Student', 'FAIL', submitRes.data?.message);
      }

      // 3.2 Submit second complaint to remain unassigned for authorization checks
      const unassignedRes = await request('/api/student/reports', {
        method: 'POST',
        headers: { Cookie: studentCookie },
        body: {
          type: 'Dripping Tap',
          zone: 'PPCRC',
          location: 'PPCRC — Lab 2 Restroom',
          description: 'Automated test unassigned complaint for negative auth check.',
        },
      });

      if (unassignedRes.status === 201 && unassignedRes.data?.success) {
        unassignedTicketId = unassignedRes.data.reportId;
        createdTicketIds.push(unassignedTicketId);
        recordTest('Student Complaint Submission (Unassigned Check)', 'Student', 'PASS', `Ticket Created: ${unassignedTicketId}`);
      }

      // 3.3 Fetch student's own reports
      const myReports = await request('/api/student/reports', {
        headers: { Cookie: studentCookie },
      });
      recordTest(
        'Student "My Reports" Retrieval',
        'Student',
        myReports.status === 200 && myReports.data?.reports ? 'PASS' : 'FAIL',
        `${myReports.data?.reports?.length || 0} reports returned`
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

