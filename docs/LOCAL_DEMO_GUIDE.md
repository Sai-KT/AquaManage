# AquaManage — Local Faculty Demonstration Guide

A step-by-step guide for presenting AquaManage to college faculty, reviewers, and evaluators in a local offline environment.

---

## 1. Prerequisites & Environment Check

Before beginning the demonstration, ensure the following local services are running on your macOS system:

1. **MySQL Community Server**: Must be running locally on `127.0.0.1:3306`.
   ```bash
   mysql -u root -p -e "SHOW DATABASES LIKE 'aqua_manage_local';"
   ```
2. **Node.js**: Version 18+ (tested on Node v20/v26).
3. **No Cloud Dependency**: AquaManage operates entirely offline against the local MySQL instance (`aqua_manage_local`). No cloud hosting or external internet connection is required.

---

## 2. Verified Local Startup Commands

### Step A: Start the Complete Application
From the project root directory, run:
```bash
npm run dev:all
```
This single command concurrently starts:
- **Express Backend API**: `http://localhost:4000`
- **React + Vite Frontend**: `http://localhost:5173` (or `http://localhost:5174` if port 5173 is occupied)

### Step B: Verify Backend Health
Open a terminal and verify:
```bash
curl http://localhost:4000/api/health
```
Expected response:
```json
{"success":true,"status":"healthy","service":"AquaManage Local API","database":{"connected":true,"name":"aqua_manage_local"}}
```

---

## 3. Demonstration Accounts & Portal URLs

For security and privacy, actual passwords are intentionally not printed in public documentation. They are documented in your local private [`LOGIN_CREDENTIALS.md`](file:///Users/mrugmaythere/work/DTIL/AquaManage/LOGIN_CREDENTIALS.md).

| Role | Portal Login URL | Demo Account Identifier | Primary Feature to Demonstrate |
| :--- | :--- | :--- | :--- |
| **Administrator** | `http://localhost:5174/login/admin` | `director@iiit.ac.in` | Campus Overview, Student Registration, Technician Assignment |
| **Student** | `http://localhost:5174/login/student` | `STU-2024-001` (Arjun Mehta) | Submitting Leak Complaints, My Reports, Reopen Feature |
| **Maintenance** | `http://localhost:5174/login/maintenance` | `EMP-01` (Ram Kumar) | Technician Task Queue, Adding Work Logs, Resolving Issues |

---

## 4. Recommended 5–7 Minute Step-by-Step Demonstration Script

Follow this sequential workflow to showcase the complete application lifecycle across all three portals:

### Phase 1: Administrator Overview & Student Registration (2 minutes)
1. Navigate to `http://localhost:5174/login/admin`.
2. Sign in as **Prof. A. Kulkarni** (Director).
3. **Show Dashboard**: Point out the live telemetry metrics (Total Complaints, Active Leaks, Resolved Leaks, and Tank storage levels) sourced directly from MySQL.
4. **Demonstrate Student Management**:
   - In the sidebar, click **Student Management**.
   - Click **Add Student**.
   - Enter fictional student details (e.g., Name: *Kavita Sharma*, ID: *STU-2024-010*, Department: *Computer Engineering*, Email: *kavita@student.iiit.ac.in*).
   - Click **Create Student**. Show that the new student appears immediately in the table.
5. In the top-right profile avatar, click **Sign Out**.

### Phase 2: Student Login, Profile & Issue Reporting (2 minutes)
1. Navigate to `http://localhost:5174/login/student`.
2. Sign in as **Arjun Mehta** (`STU-2024-001`).
3. **Demonstrate Student Profile**:
   - Click the profile avatar in the header to view Arjun's details.
   - Click **Manage Profile & Security**.
   - Show that department and email can be updated, and password can be changed securely.
4. **Submit a Leak Complaint**:
   - Click **Report an Issue** in the navigation bar.
   - Choose issue category: *Pipe Leak* or *Tap Wastage*.
   - Location: *Academic Block A, 2nd Floor Corridor*.
   - Description: *Continuous water leakage from tap fitting causing water accumulation on floor.*
   - Click **Submit Report**.
5. **View My Reports**:
   - The UI automatically navigates to **My Reports**.
   - Point out the newly created complaint ticket (e.g., `LK-015`) with initial status *Submitted*.
6. Sign out from the Student portal.

### Phase 3: Administrator Assignment (1 minute)
1. Sign back in to the **Administrator Portal** (`/login/admin`).
2. Click **Leak Reports** in the sidebar.
3. Locate Arjun Mehta's new ticket.
4. Click **Assign Staff** and select **Ram Kumar** (`EMP-01`).
5. Notice the status badge immediately updates to *Assigned*.
6. Sign out from the Admin portal.

### Phase 4: Maintenance Work & Resolution (1.5 minutes)
1. Navigate to `http://localhost:5174/login/maintenance`.
2. Sign in as **Ram Kumar** (`EMP-01`).
3. Show the **Active Task Queue**: Arjun's ticket appears specifically in Ram's queue.
4. Click **Start Work**: status transitions to *In Progress*.
5. Click **Add Work Log**: enter *"Replaced worn washer and Teflon tape on fitting."*
6. Click **Mark Resolved**: status transitions to *Resolved*.
7. Sign out from Maintenance.

### Phase 5: Student Reopening & Persistence Verification (1.5 minutes)
1. Sign back in to the **Student Portal** as **Arjun Mehta** (`STU-2024-001`).
2. Open **My Reports**. Observe that the ticket now displays *Resolved*.
3. **Feature 02 (Reopen Complaint)**:
   - Click **"Still Not Fixed? Reopen Complaint"**.
   - Enter reason: *"Water pressure dropped initially, but joint started leaking again after 10 minutes."*
   - Click **Confirm Reopen**.
   - Point out that the ticket status is now *Reopened*, the previous repair history is preserved, and the ticket is back in the admin review queue.
4. **Demonstrate Restart Persistence**:
   - Refresh the browser page (`Cmd+R` / `F5`).
   - Observe that the ticket remains in the exact *Reopened* state with complete history intact.

---

## 5. MySQL Data Persistence Verification

To demonstrate to evaluators that data is truly saved in local MySQL rather than in-memory state:
```bash
mysql -u root -p aqua_manage_local -e "
SELECT id, student_id, location, status, created_at FROM leak_reports ORDER BY created_at DESC LIMIT 3;
SELECT report_id, action, notes, created_at FROM report_history ORDER BY created_at DESC LIMIT 4;
"
```
The output shows the permanent records and audit trail events stored in MySQL.

---

## 6. Honest Scope & Telemetry Clarification

- **Water Telemetry & Tank Levels**: The tanks and water usage records shown in the dashboard represent local database records (`tanks` and `water_usage` tables). They provide a realistic demonstration of campus water consumption and harvesting capacity. As a college DTI demonstration, there are no live physical IoT sensor hardware connections.
- **File Attachments**: Uploaded complaint evidence photos/videos and profile pictures are safely stored on the local disk under `backend/uploads/`.

---

## 7. Safe Shutdown Instructions

When the demonstration session is complete, cleanly stop the application:
1. In the terminal where `npm run dev:all` is running, press `Ctrl + C`.
2. The processes will release their ports (`4000` and `5174`) and close all MySQL connection pools gracefully.
