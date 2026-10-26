# 🔐 AquaManage — Demonstration Login Credentials

This document contains the verified demonstration login credentials for all three portals in the AquaManage system. All accounts are stored locally in MySQL (`aqua_manage_local`) with **bcrypt-hashed passwords** and authenticated via secure server-side sessions.

---

## 🌐 Portal Navigation Summary

| Portal | URL Path | Primary Identifier | Intended Users |
| :--- | :--- | :--- | :--- |
| **Student Portal** | `/login/student` | Student ID / IRN No. | Campus students submitting & tracking water issues |
| **Administrator Portal** | `/login/admin` | Email or Employee ID | College directors, HoDs, and estate managers |
| **Maintenance Portal** | `/login/maintenance` | Employee ID or Email | Plumbing and field maintenance technicians |

> **Local Web App URL:** `http://localhost:5174` (or active local Vite port)  
> **Backend API URL:** `http://localhost:4000`

---

## 1. 🎓 Student Portal (`student`)

Students can submit water leakage reports, view persistent complaint histories, update their profile, and reopen unresolved complaints.

| Full Name | Student ID / IRN | Password | Department | Email | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Arjun Mehta** | `STU-2024-001` | `Student@123` | Computer Engineering | `arjun@student.iiit.ac.in` | **Primary demo student** (has submitted reports) |
| **Priya Singh** | `STU-2024-002` | `Student@456` | Information Technology | `priya@student.iiit.ac.in` | **Secondary demo student** (for account isolation tests) |
| **Mrugmay** | `IRN-101` | `Student@123` | Civil Engineering | `mrugmay@student.iiit.ac.in` | General student account |
| **Raj** | `INR3421324` | `Student@123` | General | `inr3421324@student.iiit.ac.in` | Test account |
| **Sai** | `INR31435123` | `Student@123` | General | `inr31435123@student.iiit.ac.in` | Test account |

### Student Portal Features:
- **Submit Complaint:** Attach photo/video, location, zone, and description.
- **My Reports:** View complaint status timeline (`Submitted` → `Under Review` → `In Progress` → `Resolved`).
- **Feature 02 (Reopen Complaint):** Click *"Still Not Fixed? Reopen Complaint"* on resolved complaints to trigger a second repair cycle.
- **Feature 01 (Student Profile):** Manage department, email address, and change password securely.

---

## 2. 🏛️ Administrator Portal (`admin`)

Administrators have high-level campus oversight: reviewing reports, assigning maintenance staff, monitoring water tanks, and reviewing reopened complaints.

| Full Name | Role / Title | Username / Email | Employee ID | Password | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Prof. A. Kulkarni** | Campus Director | `director@iiit.ac.in` | `DIR-01` | `Director@99` | **Primary administrator account** |
| **Dr. R. Sharma** | Head of Department | `hod@iiit.ac.in` | `HOD-01` | `HoD@Admin2024` | Secondary administrator account |

*Login supports either the Email address or Employee ID.*

### Administrator Portal Features:
- **Dashboard:** Campus water metrics, active leak counters, rainwater harvesting efficiency.
- **Leak Reports Queue:** Filter by `All`, `Active`, `Pending`, `In Progress`, `Reopened`, and `Resolved`.
- **Assignment System:** Assign/reassign technicians to new and reopened complaints.
- **Interactive Campus Map:** Real-time visual pins showing leak locations and severity across campus zones.
- **CSV Data Export:** Export filtered complaint records.

---

## 3. 🛠️ Maintenance Portal (`maintenance`)

Maintenance staff track assigned work orders, update task statuses, log technician notes, and mark repairs as resolved.

| Full Name | Employee ID | Password | Email | Assigned Role |
| :--- | :--- | :--- | :--- | :--- |
| **Ram Kumar** | `EMP-01` | `Maint@1234` | `ram.kumar@staff.iiit.ac.in` | Senior Plumbing Technician |
| **Suresh Babu** | `EMP-02` | `Maint@1234` | `suresh.babu@staff.iiit.ac.in` | General Maintenance Staff |
| **Mohan Das** | `EMP-03` | `Maint@1234` | `mohan.das@staff.iiit.ac.in` | Water Infrastructure Specialist |

*Login supports either the Employee ID (e.g., `EMP-01`) or Email address.*

### Maintenance Portal Features:
- **Active Task Queue:** Displays tasks specifically assigned to the logged-in technician.
- **Work Logging:** Add detailed repair notes and replacement part records.
- **Task Progression:** Move tasks from `Assigned` → `In Progress` → `Resolved`.
- **Completed Tasks History:** View chronological maintenance records.

---

## 🧪 End-to-End Demonstration Workflow

To demonstrate the full lifecycle of AquaManage to faculty or reviewers:

1. **Step 1 (Student Submission):**  
   Sign in as **Arjun Mehta** (`STU-2024-001` / `Student@123`). Submit a new leak report in Academic Block.
2. **Step 2 (Admin Review & Assignment):**  
   Sign in as **Prof. A. Kulkarni** (`director@iiit.ac.in` / `Director@99`). Locate the new report under **Leak Reports** and assign it to **Ram Kumar** (`EMP-01`).
3. **Step 3 (Maintenance Repair):**  
   Sign in as **Ram Kumar** (`EMP-01` / `Maint@1234`). Locate the task in **Active Tasks**, update status to **In Progress**, add a work log, and mark it **Resolved**.
4. **Step 4 (Student Reopening):**  
   Return to **Arjun Mehta's** portal. Observe the **Resolved** status. Click **"Still Not Fixed? Reopen Complaint"**, enter a reason, and confirm. Status transitions to **Reopened**.
5. **Step 5 (Admin Reassignment):**  
   In Admin portal, observe the amber **Reopened** badge and student reason. Reassign the ticket to **Suresh Babu** (`EMP-02`).
6. **Step 6 (Second Resolution):**  
   Sign in as **Suresh Babu** (`EMP-02` / `Maint@1234`), complete the secondary repair, and mark it **Resolved**.

---

## 🛡️ Security & Storage Details

- **Database:** Local MySQL (`aqua_manage_local` on port 3306).
- **Password Encryption:** Bcrypt with 10 salt rounds (no plain-text passwords stored in the database).
- **Session Architecture:** Server-side Express sessions stored securely in MySQL table `sessions`.
- **Authorization:** Strict role-based middleware (`requireAuth`, `requireRole('student')`, `requireRole('admin')`, `requireRole('maintenance')`).
