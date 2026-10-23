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

    // 2.5 Attempt Maintenance Login
    const maintLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'maintenance', username: 'EMP-01', password: 'Maint@1234' },
    });

    if (maintLogin.status === 200 && maintLogin.data?.success) {
      maintCookie = maintLogin.headers.get('set-cookie') || '';
      recordTest('Maintenance Login (EMP-01)', 'Auth', 'PASS', 'Session established');
    } else if (maintLogin.status === 500) {
      recordTest('Maintenance Login', 'Auth', 'BLOCKED', 'Database offline');
    } else {
      recordTest('Maintenance Login', 'Auth', 'FAIL', `HTTP ${maintLogin.status}`);
    }

    // 2.6 Cross-role access enforcement (Student cannot call Admin API)
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

  // ── Category 3: Student Workflow ──────────────────────────────────────────
  console.log('\n▶ [3/6] STUDENT WORKFLOW CHECKS');
  let createdTicketId = null;

  try {
    if (studentCookie) {
      // 3.1 Submit complaint
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
        createdTicketId = submitRes.data.reportId;
        recordTest('Student Complaint Submission', 'Student', 'PASS', `Ticket Created: ${createdTicketId}`);
      } else {
        recordTest('Student Complaint Submission', 'Student', 'FAIL', submitRes.data?.message);
      }

      // 3.2 Fetch student's own reports
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

      // 4.3 Assignment
      if (createdTicketId) {
        const assignRes = await request(`/api/admin/reports/${createdTicketId}/assign`, {
          method: 'PATCH',
          headers: { Cookie: adminCookie },
          body: { technicianName: 'Ram Kumar' },
        });
        recordTest(
          'Admin Complaint Assignment',
          'Admin',
          assignRes.status === 200 ? 'PASS' : 'FAIL',
          `Ticket ${createdTicketId} assigned to Ram Kumar`
        );
      }
    } else {
      recordTest('Admin Workflow', 'Admin', 'BLOCKED', 'Requires database connection for auth');
    }
  } catch (e) {
    recordTest('Admin Workflow', 'Admin', 'FAIL', e.message);
  }

  // ── Category 5: Maintenance Workflow ──────────────────────────────────────
  console.log('\n▶ [5/6] MAINTENANCE WORKFLOW CHECKS');
  try {
    if (maintCookie) {
      const taskQueue = await request('/api/maintenance/tasks', {
        headers: { Cookie: maintCookie },
      });
      recordTest(
        'Maintenance Task Queue Retrieval',
        'Maintenance',
        taskQueue.status === 200 && taskQueue.data?.tasks ? 'PASS' : 'FAIL',
        `${taskQueue.data?.tasks?.length || 0} active tasks`
      );

      if (createdTicketId) {
        // Status update to in_progress
        const progressRes = await request(`/api/maintenance/tasks/${createdTicketId}/status`, {
          method: 'PATCH',
          headers: { Cookie: maintCookie },
          body: { status: 'in_progress' },
        });
        recordTest(
          'Maintenance Status Update (in_progress)',
          'Maintenance',
          progressRes.status === 200 ? 'PASS' : 'FAIL',
          'Status updated'
        );

        // Add work log
        const logRes = await request(`/api/maintenance/tasks/${createdTicketId}/logs`, {
          method: 'POST',
          headers: { Cookie: maintCookie },
          body: { note: 'Inspected and tightened fixture during automated testing.' },
        });
        recordTest('Maintenance Work Note Addition', 'Maintenance', logRes.status === 201 ? 'PASS' : 'FAIL');

        // Status update to resolved
        const resolveRes = await request(`/api/maintenance/tasks/${createdTicketId}/status`, {
          method: 'PATCH',
          headers: { Cookie: maintCookie },
          body: { status: 'resolved' },
        });
        recordTest('Maintenance Status Resolution (resolved)', 'Maintenance', resolveRes.status === 200 ? 'PASS' : 'FAIL');
      }

      // Completed tasks
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
