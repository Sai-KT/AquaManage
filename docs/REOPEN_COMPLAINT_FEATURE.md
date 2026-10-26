# AQUAMANAGE — FEATURE 02: REOPEN A RESOLVED COMPLAINT

## 1. Feature Purpose and Overview
In campus water infrastructure management, physical repairs can occasionally be incomplete, temporary, or inadequate. For example, a technician may replace a washer on a washroom tap and mark the complaint **Resolved**, but under peak morning water pressure, the tap may continue leaking.

Previously, a student had to file an entirely new complaint, resulting in duplicate tickets, loss of repair history, and fractured maintenance metrics.

The **Reopen Complaint** feature extends the AquaManage complaint lifecycle to allow the original student reporter to reopen their resolved complaint with an explanatory reason. The existing ticket reference is preserved, previous technician logs and resolution timestamps remain intact, and the issue seamlessly returns to the administrator's review queue for reassignment and a secondary maintenance cycle.

---

## 2. When a Student Can Reopen a Complaint
A student may reopen a complaint under the following conditions:
1. **Authenticated Session:** The caller must hold an active server-side session with role `'student'`.
2. **Report Ownership (Rule A):** The complaint must permanently belong to the authenticated student (`leak_reports.student_id = req.session.user.id`).
3. **Resolved-Only State (Rule B):** The current status of the complaint in MySQL must be strictly `'resolved'`. Complaints in `'reported'`, `'pending'`, `'in_progress'`, or already `'reopened'` status cannot be reopened.
4. **Mandatory Reason (Rule D):** The student must provide a descriptive explanation (10 to 500 characters) detailing why the issue remains unresolved.

---

## 3. Student-Only Ownership & Authorization Restrictions
- **Zero Cross-Student Access:** Student A cannot reopen Student B's complaint by manipulating the report ID in the client request. Report ownership is verified using row-level database checks (`student_id = ?`) inside a transactional lock. Any violation returns `403 Forbidden`.
- **Role Isolation:** Neither Administrators nor Maintenance staff can trigger the student reopening endpoint (`POST /api/student/reports/:id/reopen`). The endpoint is guarded by `requireAuth` and `requireRole('student')`.
- **Private Data Protection:** Unauthorized users attempting to query or reopen another student's report receive an authorization error without leaking sensitive report contents or internal repair notes.

---

## 4. Reason Validation Rules
Reopening submissions are validated both on the client side (with live character counter and immediate feedback) and on the server side:
- **Minimum Length:** 10 characters (excluding leading and trailing whitespace).
- **Maximum Length:** 500 characters.
- **Sanitization:** Leading and trailing whitespace trimmed; text is treated purely as string data in parameterized SQL queries (no raw HTML rendering).
- **Rejection Responses:** Submitting an empty, whitespace-only, or too-short reason returns `400 Bad Request` with an explicit guidance message.

---

## 5. Complaint Status Transitions & Lifecycle

### Normal Lifecycle:
```
reported (pending) ───[Admin Assigns]───> assigned ───[Tech Starts]───> in_progress ───[Tech Resolves]───> resolved
```

### Reopening & Secondary Maintenance Lifecycle:
```
resolved ───[Student Reopens with Reason]───> reopened
   │
   ├───> [Admin Reassigns to Tech]───> assigned ───> in_progress ───> resolved
                                                                          │
                                                                          └───> [Repeat Reopening if needed]
```

---

## 6. MySQL Database Schema Changes
To natively support the reopened complaint state while maintaining full backward compatibility with existing records:

### Alteration Applied to `aqua_manage_local`:
```sql
ALTER TABLE leak_reports
  MODIFY COLUMN status ENUM('reported','assigned','in_progress','resolved','reopened')
  NOT NULL DEFAULT 'reported';
```

- **Database Safety:** Safe modification preserving all existing rows.
- **`report_history` Compatibility:** The columns `previous_status` and `new_status` in `report_history` are `VARCHAR(50)`, requiring no schema changes.
- **Active Record Preservation:** The schema baseline in `backend/database/schema.sql` was synchronized with the new ENUM definition for all future fresh setups.

---

## 7. Reopening API Specification

### Endpoint
`POST /api/student/reports/:id/reopen`

### Request Headers
```http
Content-Type: application/json
Cookie: connect.sid=<session_cookie>
```

### Request Body
```json
{
  "reason": "Water is still leaking steadily under the sink pipe despite initial technician repair."
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Complaint reopened successfully. It has returned to the administrator for review and reassignment.",
  "data": {
    "id": "LK-001",
    "status": "reopened",
    "reopenedAt": "2026-10-26T11:45:00.000Z"
  }
}
```

### Error Responses
- `400 Bad Request`: Reason missing, under 10 characters, or over 500 characters.
- `401 Unauthorized`: No active server-side session.
- `403 Forbidden`: Authenticated user is not a student or is not the original reporter.
- `404 Not Found`: Report ID does not exist in `leak_reports`.
- `409 Conflict`: Complaint is not in `'resolved'` status (e.g., currently pending or already reopened).
- `500 Internal Server Error`: Server failure (automatically rolled back).

---

## 8. Database Transaction & Row-Level Locking Behavior
To prevent race conditions, repeated rapid button clicks, or inconsistent states:
1. **Transaction Initialization:** Initiates `withTransaction(async (conn) => { ... })`.
2. **Pessimistic Row Lock:** Executes:
   ```sql
   SELECT id, student_id, reporter_name, location, zone_name, status
   FROM leak_reports
   WHERE id = ? FOR UPDATE;
   ```
3. **State & Ownership Verification:** Confirms `report.student_id === user.id` and `report.status === 'resolved'`. If another request succeeded milliseconds earlier, the second request sees `status !== 'resolved'` and fails immediately with `409 Conflict`.
4. **State Transition & Active Field Reset:**
   ```sql
   UPDATE leak_reports
   SET status = 'reopened',
       assigned_to = NULL,
       assigned_name = NULL,
       assigned_at = NULL,
       resolved_at = NULL,
       updated_at = NOW()
   WHERE id = ?;
   ```
5. **Audit History Insertion:**
   ```sql
   INSERT INTO report_history (
     report_id, actor_id, actor_name, action, previous_status, new_status, notes
   ) VALUES (?, ?, ?, 'reopened', 'resolved', 'reopened', ?);
   ```
6. **Administrator Alert Generation:**
   ```sql
   INSERT INTO alerts (type, icon, title, message, is_read, target_role)
   VALUES ('warning', 'AlertTriangle', ?, ?, FALSE, 'admin');
   ```
7. **Commit & Rollback:** The entire transaction is atomically committed. If any query fails, all updates are automatically rolled back.

---

## 9. Administrator Portal Reassignment Workflow
1. **Reports Listing & Filtering:**
   - Reopened complaints appear in `All Reports`, `Active`, and `Pending` queues.
   - Dedicated filter option: `<option value="reopened">Reopened</option>`.
   - Distinctive Amber badge: `REOPENED`.
   - Expanded row displays a callout showing:
     - ⚠️ Reopened Complaint banner.
     - Student's exact reopening reason.
2. **Assignment Mechanism:**
   - The administrator clicks **Assign to Staff** / **Reassign to Staff**.
   - Admin selects a maintenance employee (e.g., Suresh Babu).
   - Backend transitions complaint from `reopened` to `assigned`, updating `assigned_to`, `assigned_name`, and timestamp while recording the reassignment in `report_history`.

---

## 10. Maintenance Portal Resolution Workflow
1. **Technician Isolation While Reopened:**
   - While `status = 'reopened'`, active assignment fields are `NULL`.
   - The complaint is invisible to maintenance technicians until an admin explicitly reassigns it.
2. **Task Queue Pickup After Reassignment:**
   - The newly assigned technician sees the reopened ticket in their **Task Queue**.
   - The ticket displays the student's original description, the reopening reason, and all previous maintenance logs in chronological order.
3. **Repair & Re-resolution:**
   - Technician updates status to `in_progress`.
   - Technician logs progress notes (e.g., `"Replaced faulty secondary washer and verified under pressure"`).
   - Technician marks task as `resolved`.
   - The latest `resolved_at` timestamp is set, and a new resolution event is recorded in `report_history`.

---

## 11. History Preservation Across Multiple Cycles
All events across every repair and reopening cycle are permanently recorded under the same complaint ID:
- **Event 1:** Complaint Submitted (Student)
- **Event 2:** Assigned to Technician 1 (Admin)
- **Event 3:** Work Note by Technician 1 (Maintenance)
- **Event 4:** Marked Resolved (Technician 1)
- **Event 5:** Reopened by Student with Reason (Student)
- **Event 6:** Reassigned to Technician 2 (Admin)
- **Event 7:** Work Note by Technician 2 (Maintenance)
- **Event 8:** Marked Resolved (Technician 2)

Students can inspect this entire chronological history directly in **My Reports** by clicking **View History & Activity**.

---

## 12. Dashboard & Telemetry Aggregations
- **Active Leaks Counter:** Includes `reported`, `pending`, `assigned`, `in_progress`, and `reopened` complaints.
- **Resolved Issues Counter:** Reflects complaints that are *currently* resolved (`status = 'resolved'`). Once reopened, a complaint immediately decrements from resolved counts and increments active counts.
- **No Double Counting:** Each complaint is counted exactly once based on its current `leak_reports.status`.

---

## 13. Automated Test Verification Results
The test suite in `backend/tests/run-tests.js` was executed against the local MySQL database with **63 test checks across 8 categories**:

| Category | Checks | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| 1. Infrastructure & Health | 2 | 2 | 0 | PASS |
| 2. Authentication & Security | 10 | 10 | 0 | PASS |
| 3. Student Workflow & Identity Persistence | 8 | 8 | 0 | PASS |
| 4. Student Profile Management (Feature 01) | 14 | 14 | 0 | PASS |
| 5. Admin Workflow & Assignment | 3 | 3 | 0 | PASS |
| 6. Maintenance Workflow & Authorization | 9 | 9 | 0 | PASS |
| **7. Reopen Resolved Complaint Lifecycle (Feature 02)** | **12** | **12** | **0** | **PASS** |
| 8. Telemetry & Dashboard Analytics | 4 | 4 | 0 | PASS |
| **Post-Test Data Sanitization** | 1 | 1 | 0 | PASS |
| **Total** | **63** | **63** | **0** | **100% PASS** |

### Key Feature 02 Automated Verifications:
- `Rule A & Security: Anonymous Reopening Rejected` -> `PASS` (HTTP 401)
- `Rule A & Security: Non-Student Role Barred from Reopening` -> `PASS` (HTTP 403)
- `Rule A: Student Ownership Protection (Student B barred from Student A ticket)` -> `PASS` (HTTP 403)
- `Rule B: Reopen Rejection for Non-Resolved Report (Pending Ticket)` -> `PASS` (HTTP 409)
- `Rule D: Empty Reopening Reason Rejection` -> `PASS` (HTTP 400)
- `Rule D: Short Reopening Reason Rejection (<10 chars)` -> `PASS` (HTTP 400)
- `Rule D: Excessively Long Reason Rejection (>500 chars)` -> `PASS` (HTTP 400)
- `Rule C & E: Successful Reopening & MySQL State Transition` -> `PASS` (HTTP 200, status `reopened`, active assignment reset, history logged)
- `Rule B & Concurrency: Duplicate Reopening Attempt Rejection` -> `PASS` (HTTP 409)
- `Admin Review: Reopened Complaint Listed in Administrator Queue` -> `PASS` (HTTP 200)
- `Admin Reassignment: Reopened Complaint Reassigned to Maintenance Staff` -> `PASS` (HTTP 200)
- `Maintenance Second Cycle: Reassigned Tech Completes Secondary Repair & Resolution` -> `PASS` (HTTP 200)
- `Rule G: Repeat Reopening Cycle Supported & Multi-Cycle History Retained` -> `PASS` (HTTP 200, 2 reopening events preserved)

---

## 14. Manual Demonstration Procedure

### Prerequisites
1. Local stack running via `npm run dev:all`.
2. Frontend accessible at `http://localhost:5174` (or active Vite port).
3. Backend accessible at `http://localhost:4000`.

### Step-by-Step Walkthrough
1. **Student Submits Complaint:**
   - Log in as Student (`STU-2024-001` / `Student@123`).
   - Navigate to **Report Issue** and submit a complaint (e.g., "Tap Leak in Academic Block").
   - Note the generated complaint ID (e.g., `LK-001`).
2. **Admin Assigns Complaint:**
   - In another browser tab/window, log in as Administrator (`director@iiit.ac.in` / `Director@99`).
   - Open **Leak Reports**, locate `LK-001`, and click **Assign to Staff** -> select `Ram Kumar`.
3. **Maintenance Resolves Complaint:**
   - Log in as Maintenance (`EMP-01` / `Maint@1234`).
   - Under **Active Tasks**, locate `LK-001`, set status to **In Progress**, add a work note, and click **Mark Resolved**.
4. **Student Reopens Complaint:**
   - Return to the Student portal under **My Reports**.
   - Notice the status badge is **Resolved** with a green checkmark.
   - Click the button **Still Not Fixed? Reopen Complaint**.
   - In the modal dialog, observe read-only reference pills, enter the reason:
     `"Tap continues to leak from the base joint when turned on."` (>= 10 chars).
   - Click **Confirm Reopening**.
   - Observe immediate success confirmation:
     - Badge changes to **REOPENED**.
     - Info banner appears: *"Reopened — Waiting for administrator review: Your complaint has returned to the administrator for review and reassignment..."*
     - Click **View History & Activity** to see the chronological audit trail containing the previous resolution and the new reopening event with reason.
5. **Admin Reassigns Reopened Complaint:**
   - Return to Admin portal.
   - Filter by **Reopened** or find `LK-001` with amber badge.
   - Expand `LK-001` to view the student's reopening reason.
   - Click **Reassign to Staff** -> select `Suresh Babu`.
6. **Maintenance Second Repair:**
   - Log in as `Suresh Babu` (`EMP-02` / `Maint@1234`).
   - View `LK-001` in Task Queue with all historical logs and reopening explanation.
   - Update to **In Progress** and **Mark Resolved**.
7. **Verification of Repeat Reopening (Rule G):**
   - In Student portal, `LK-001` now displays **Resolved**.
   - Student can reopen again if needed or confirm resolution.

---

## 15. Known Limitations & Design Boundaries
1. **Single Active Resolution Timestamp:** The `leak_reports.resolved_at` field reflects only the *most recent* resolution timestamp. All prior resolution timestamps are permanently preserved in `report_history`.
2. **Direct Manual Reassignment Required:** In accordance with design principles, reopened tickets are not automatically reassigned by algorithm; campus administrators must review the reopening reason and select the appropriate technician.
3. **Local Scope:** Designed and verified for the local AquaManage architecture (`aqua_manage_local`). No cloud deployment or third-party messaging queues are required.
