# AquaManage — Backend and Database Reliability Audit & Maintenance Report

## 1. Executive Summary & Existing Architecture
AquaManage is a college Design Thinking and Innovation (DTI) application created to monitor campus water leakage complaints and water resource storage.

### Technology Stack
- **Frontend**: React 18 + Vite (Vanilla CSS design system, Lucide React icons, React Router DOM v6).
- **Backend**: Node.js + Express.js REST API with CORS credentials handling.
- **Session Layer**: Server-side session store using `express-session` backed by `express-mysql-session` persisting active sessions into the MySQL `sessions` table.
- **Database**: Local MySQL Community Server (database: `aqua_manage_local`), accessed via `mysql2/promise` connection pool (`127.0.0.1:3306`, user: `aquamanage_app`).
- **Security**: Role-Based Access Control (RBAC) supporting `admin`, `maintenance`, and `student` roles, with bcrypt password hashing (10 salt rounds) and session fixation regeneration.

```
┌─────────────────────────────────┐
│     React 18 + Vite Client      │ (Port 5173 / 5174)
└───────────────┬─────────────────┘
                │ HTTP + withCredentials (Cookie: connect.sid)
┌───────────────▼─────────────────┐
│      Express 4.x REST API       │ (Port 4000)
│  (Auth, Sessions, RBAC Guards)  │
└───────────────┬─────────────────┘
                │ mysql2 connection pool (Parameterized SQL)
┌───────────────▼─────────────────┐
│     Local MySQL 8.x Server      │ (Port 3306, aqua_manage_local)
│ (users, leak_reports, history,  │
│  tanks, water_usage, sessions)  │
└─────────────────────────────────┘
```

---

## 2. Database Schema & Table Relationships

The database `aqua_manage_local` is structured around 7 relational tables:

```
 users (id [PK], student_id, employee_id, role, email, password_hash, is_active, avatar_url)
   │
   ├──< leak_reports (id [PK], report_id [UK], student_id [FK->users.id], assigned_to [FK->users.id],
   │                  title, description, location, zone, priority, status, created_at, resolved_at)
   │      │
   │      └──< report_history (id [PK], report_id [FK->leak_reports.id], actor_id [FK->users.id],
   │                           action, notes, previous_status, new_status, created_at)
   │
   └──< alerts (id [PK], title, message, type, is_read, created_at)

 tanks (id [PK], name, capacity_liters, current_level_liters, status, last_reading_at)
 water_usage (id [PK], zone_name, consumption_liters, recorded_date)
 sessions (session_id [PK], expires, data)
```

### Referential Integrity Constraints
- `leak_reports.student_id` references `users(id)` with `ON DELETE SET NULL`.
- `leak_reports.assigned_to` references `users(id)` with `ON DELETE SET NULL`.
- `report_history.report_id` references `leak_reports(id)` with `ON DELETE CASCADE`.
- `report_history.actor_id` references `users(id)` with `ON DELETE SET NULL`.

---

## 3. Feature-to-API & Database Mapping

| Portal / Domain | Feature | API Endpoint & Method | Underlying MySQL Tables & Operations |
| :--- | :--- | :--- | :--- |
| **Auth** | Multi-Role Login | `POST /api/auth/login` | `users` (`SELECT ... WHERE student_id = ? OR email = ?`), `sessions` (`INSERT/UPDATE`) |
| **Auth** | Current Session User | `GET /api/auth/me` | `users` (`SELECT id, name, role... WHERE id = ?`), `sessions` |
| **Auth** | Logout | `POST /api/auth/logout` | `sessions` (`DELETE WHERE session_id = ?`) |
| **Student** | Submit Leak Complaint | `POST /api/student/reports` | Transaction: `leak_reports` (`INSERT`), `report_history` (`INSERT`) |
| **Student** | Student's My Reports | `GET /api/student/reports` | `leak_reports` (`SELECT ... WHERE student_id = ? ORDER BY created_at DESC`) |
| **Student** | Complaint Audit History | `GET /api/student/reports/:id/history`| `report_history` (`SELECT ... WHERE report_id = ? ORDER BY created_at ASC`) |
| **Student** | Reopen Resolved Report | `POST /api/student/reports/:id/reopen` | Transaction (`SELECT ... FOR UPDATE`): `leak_reports` (`UPDATE status='reopened'`), `report_history` (`INSERT`), `alerts` (`INSERT`) |
| **Student** | Get Profile | `GET /api/student/profile` | `users` (`SELECT name, email, department, student_id, avatar_url WHERE id = ?`) |
| **Student** | Update Profile | `PATCH /api/student/profile` | `users` (`UPDATE department = ?, email = ? WHERE id = ?`) |
| **Student** | Change Password | `POST /api/student/profile/change-password` | `users` (`SELECT password_hash`, `UPDATE password_hash = ? WHERE id = ?`), `sessions` (`DELETE`) |
| **Student** | Upload Avatar | `POST /api/student/profile/avatar` | `users` (`UPDATE avatar_url = ? WHERE id = ?`) |
| **Student** | Delete Avatar | `DELETE /api/student/profile/avatar` | `users` (`UPDATE avatar_url = NULL WHERE id = ?`) |
| **Admin** | All Leak Reports | `GET /api/admin/reports` | `leak_reports` + `users` (`SELECT ... LEFT JOIN users ON ...`) |
| **Admin** | Assign Maintenance Staff | `PATCH /api/admin/reports/:id/assign` | Transaction: `leak_reports` (`UPDATE assigned_to = ?, status = 'assigned'`), `report_history` (`INSERT`) |
| **Admin** | Direct Status Update | `PATCH /api/admin/reports/:id/status` | Transaction: `leak_reports` (`UPDATE status = ?`), `report_history` (`INSERT`) |
| **Admin** | Maintenance Directory | `GET /api/admin/maintenance-staff` | `users` (`SELECT name, employee_id WHERE role = 'maintenance'`) |
| **Admin** | Student Directory | `GET /api/admin/students` | `users` (`SELECT id, name, student_id, department, email, created_at WHERE role = 'student'`) |
| **Admin** | Register New Student | `POST /api/admin/students` | `users` (`INSERT INTO users (name, student_id, department, email, password_hash, role)`) |
| **Admin** | Delete Student Account | `DELETE /api/admin/students/:id` | `users` (`DELETE FROM users WHERE id = ? AND role = 'student'`) |
| **Admin** | System Alerts | `GET /api/admin/alerts` | `alerts` (`SELECT ... ORDER BY created_at DESC`) |
| **Admin** | Mark Alerts Read | `PATCH /api/admin/alerts/mark-read` | `alerts` (`UPDATE alerts SET is_read = 1`) |
| **Maintenance** | Assigned Task Queue | `GET /api/maintenance/tasks` | `leak_reports` (`SELECT ... WHERE assigned_to = ? AND status IN ('assigned', 'in_progress')`) |
| **Maintenance** | Completed Tasks History | `GET /api/maintenance/completed` | `leak_reports` (`SELECT ... WHERE assigned_to = ? AND status = 'resolved'`) |
| **Maintenance** | Update Task Status | `PATCH /api/maintenance/tasks/:id/status` | Transaction: `leak_reports` (`UPDATE status = ?`), `report_history` (`INSERT`) |
| **Maintenance** | Add Work Log Note | `POST /api/maintenance/tasks/:id/logs` | `report_history` (`INSERT INTO report_history (action='note_added')`) |
| **Telemetry** | Dashboard Statistics | `GET /api/dashboard/stats` | Aggregated `leak_reports` (`COUNT(*) GROUP BY status`) + `tanks` |
| **Telemetry** | Water Harvesting Tanks | `GET /api/water/harvesting` | `tanks` (`SELECT ... ORDER BY id ASC`) |
| **Telemetry** | Campus Water Usage | `GET /api/water/usage` | `water_usage` (`SELECT ... ORDER BY recorded_date DESC`) |

---

## 4. Issues Identified & Corrective Actions Applied

| Issue Description | Severity | Root Cause | Affected Component | Corrective Action Applied |
| :--- | :--- | :--- | :--- | :--- |
| **Mock data masking API failures in Admin Reports & Alerts** | High | `adminService.js` caught exceptions and returned `mockReports`, `mockAlerts`, or mock staff arrays instead of truthful failure states. | `src/services/adminService.js` | Removed fallback mock data from `getLeakReports()`, `getAlerts()`, and `getMaintenanceStaff()`. Returned accurate `{ success: false, error: err.message, reports: [] }`. |
| **Mock tickets masking Maintenance API failures** | High | `maintenanceService.js` caught network/API errors and returned `mockTasks` instead of reporting failure. | `src/services/maintenanceService.js` | Removed `mockTasks` fallback. Returned `{ success: false, error: err.message, tasks: [] }`. |
| **Component initial state flashing mock data** | Medium | `TaskQueue.jsx`, `LeakReports.jsx`, and `Alerts.jsx` initialized React state with `defaultTasks`, `defaultReports`, and `defaultAlerts`. | `src/pages/maintenance/TaskQueue.jsx`, `src/pages/admin/LeakReports.jsx`, `src/pages/admin/Alerts.jsx` | Removed mock imports; initialized state to empty arrays (`[]`), ensuring truthful loading and data display strictly from MySQL. |
| **Missing return statement in Student Harvesting Service** | Medium | `studentService.getHarvestingStatus()` lacked return statements outside the successful response block, returning `undefined` upon failure. | `src/services/studentService.js` | Added explicit error return objects with empty arrays and failure messaging. |
| **Buffer conversion in Test Runner helper** | Low | Test runner helper `request()` checked `typeof body === 'object'` which coerced Node.js `Buffer` multipart data into JSON strings. | `backend/tests/run-tests.js` | Updated condition to `!(options.body instanceof FormData || Buffer.isBuffer(options.body))`, enabling clean multipart payload delivery for file/avatar tests. |

---

## 5. Authentication, Security & Data Persistence Audit

1. **Student Login Validation**:
   - Secure Student ID lookup against `users` table where `role = 'student'` and `is_active = 1`.
   - Strong password verification with `bcrypt.compare`.
   - Explicit rejection of invalid passwords, unregistered IDs, and inactive accounts.
2. **Session Regeneration & Security**:
   - `req.session.regenerate()` executes on successful login to prevent session fixation attacks.
   - Session data persisted in MySQL `sessions` table.
   - On logout, `req.session.destroy()` purges the active session from MySQL.
3. **Cross-Role Authorization Enforcement**:
   - Role guard middleware (`requireRole('admin')`, `requireRole('maintenance')`, `requireRole('student')`) protects each respective route group.
   - Students cannot call Admin or Maintenance endpoints (returns HTTP 403).
   - Maintenance technicians cannot access admin report queues or other technician tasks (returns HTTP 403).
4. **Student Account & Data Isolation**:
   - Server-side student identity is strictly derived from `req.session.user.id`.
   - In `studentController.getMyReports`, complaints are filtered by `WHERE lr.student_id = ?`.
   - Cross-student access attempts to view, reopen, or inspect another student's report return HTTP 403.
5. **Data Persistence Across Restarts**:
   - All complaint submissions, assignments, work logs, resolutions, student profile updates, and newly created student records write to permanent MySQL tables.
   - Verified that server shutdown, backend restart, and page refresh preserve all records intact without data loss or corruption.

---

## 6. Test Isolation Approach & Results

### Isolation Strategy
To prevent corrupting or altering real faculty demonstration accounts (e.g., student IDs `STU-001` through `STU-005`):
- All automated integration tests generate dedicated test entities prefixed with `TEST-STU-...` or `TEST-ADM-...`.
- Complaints and audit history generated during test runs are tracked and surgically cleaned up in the test runner's teardown block.
- Zero blanket `DELETE` or `TRUNCATE` queries are executed.
- `aqua_manage_local` baseline records remain completely intact.

### Automated Test Suite Execution Summary
- Command: `npm run test:backend`
- Framework: Node.js native test harness (`backend/tests/run-tests.js`)
- Result: **84 of 84 tests passed (100% pass rate)**.
  - Phase 1: Environment & Database Pool Connection (4 checks) — PASSED
  - Phase 2: Schema, Tables & Referential Integrity (12 checks) — PASSED
  - Phase 3: Authentication & Multi-Role Security (14 checks) — PASSED
  - Phase 4: Student Portal & Profile Management (15 checks) — PASSED
  - Phase 5: Admin Workflow Checks (3 checks) — PASSED
  - Phase 6: Maintenance Workflow & Authorization (8 checks) — PASSED
  - Phase 7: Reopen Complaint Lifecycle Checks (Feature 02) (13 checks) — PASSED
  - Phase 8: Dashboard & Telemetry Checks (3 checks) — PASSED
  - Phase 9: Admin-Controlled Student Registration (Feature 03) (12 checks) — PASSED

---

## 7. Reliable Local Startup Instructions

### Prerequisites
- macOS with MySQL Community Server running on `127.0.0.1:3306`.
- Node.js 18+ and npm installed.

### 1. Database Verification
Ensure the MySQL database `aqua_manage_local` exists and has the required schema:
```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'aqua_manage_local';"
```

### 2. Backend Startup
In a terminal window:
```bash
cd backend
npm install
node src/server.js
```
The backend initializes on `http://localhost:4000`.

### 3. Frontend Startup
In a separate terminal window:
```bash
npm install
npm run dev
```
The frontend dev server initializes on `http://localhost:5173` (or `5174` if 5173 is occupied).

### 4. Running Verification Tests
To run the automated backend test suite safely against the local database:
```bash
npm run test:backend
```

---

## 8. Known Limitations & College DTI Scope Notes
- **Simulated Water Telemetry**: Water usage time-series and tank level sensor records are maintained in local MySQL tables (`tanks`, `water_usage`) and seeded for demonstration purposes. There are no live physical IoT sensor hardware connections.
- **Local Storage Architecture**: All file uploads (leak photos, videos, and avatars) are stored in the local filesystem under `backend/uploads/` rather than cloud S3/blob buckets, matching the local offline project requirements.
