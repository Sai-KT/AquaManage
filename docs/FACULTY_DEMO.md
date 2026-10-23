# AquaManage — College DTI Faculty Demonstration Script

**Project Title:** AquaManage — IoT-Enabled Campus Water Resource Management & Leak Resolution  
**Subject:** DTI — Design Thinking & Innovation  
**Presentation Duration:** 5–7 Minutes  
**Demonstration Mode:** 100% Offline Local Demonstration (React + Express + MySQL)  

---

## 1. Demonstration Outline & Timing

```
[0:00 - 1:00]  Problem Context & Design Thinking Empathy Phase
[1:00 - 2:00]  Architecture & Three-Portal Overview
[2:00 - 3:00]  Live Workflow Step 1: Student Issue Submission
[3:00 - 4:00]  Live Workflow Step 2: Admin Dashboard & Staff Assignment
[4:00 - 5:00]  Live Workflow Step 3: Maintenance Execution & Resolution
[5:00 - 6:00]  Live Workflow Step 4: Verification in MySQL Database
[6:00 - 7:00]  Q&A & Technical Discussion (React → Express → MySQL)
```

---

## 2. Minute-by-Minute Faculty Script

### [0:00 - 1:00] Part 1: The Campus Problem
> *"Good morning professors. During our campus observation phase for Design Thinking & Innovation, we identified that thousands of litres of treated water are lost daily on college campuses due to unreported pipe leakages, broken tap washers, and tank overflows. Complaints currently rely on informal WhatsApp messages or physical register entries that get lost without accountability. AquaManage addresses this with a centralized, closed-loop software solution connecting Students, Administrators, and Maintenance Technicians."*

### [1:00 - 2:00] Part 2: Architecture & Roles
> *"AquaManage is structured into three dedicated portals:*
> 1. ***Student Portal:*** *Enables any student or faculty member to report leaks with location details and media attachments in under 30 seconds.*
> 2. ***Administrator Portal:*** *Gives facilities heads an executive bird's-eye view of campus water levels, live leak counts, and allows instant work delegation.*
> 3. ***Maintenance Portal:*** *Gives on-ground plumbers and technicians a prioritized work queue where they log repair notes and close tickets.*
> *Crucially, our system operates completely locally without paid cloud subscriptions. The React 19 frontend communicates with a local Node.js Express API that persists every single record into an offline MySQL database."*

### [2:00 - 3:00] Part 3: Live Demo — Student Submits a Complaint
1. Open browser tab: `http://localhost:5173/login/student`.
2. Login as:
   - **Student Name:** `Arjun Mehta`
   - **IRN / PRN:** `STU-2024-001`
3. Click **"Report Issue"** in the sidebar.
4. Fill in the form:
   - **Issue Type:** `Pipe Leak`
   - **Campus Zone:** `Academic Block`
   - **Specific Location:** `Ground Floor Corridor — Outside Lab 102`
   - **Description:** `Water is continuously spraying from an overhead PVC pipe joint onto the floor.`
5. Click **"Submit Incident Report"**.
6. Show the success banner: *"Complaint submitted successfully and recorded in MySQL (Ticket ID: LK-009)"*.
7. Navigate to **"My Reports"** and point out that the status is **"Pending"** with a live tracking stepper.

### [3:00 - 4:00] Part 4: Live Demo — Administrator Assigns the Ticket
1. Open new incognito window (or tab): `http://localhost:5173/login/admin`.
2. Login as:
   - **Email:** `director@iiit.ac.in`
   - **Password:** `Director@99`
3. Show the **Admin Dashboard**:
   - Point out that **"Active Leaks"** immediately reflects the newly submitted ticket.
   - Point out the **Tank Levels** and **Water Saved Today** cards.
4. In sidebar, click **"Leak Reports"**.
5. Locate the newly created complaint `LK-009`.
6. Click **"Assign"** button next to it.
7. Select **"Ram Kumar"** (Maintenance Staff) and confirm assignment.
8. Point out that the ticket status instantly transitions from **"Pending"** to **"In Progress"**.

### [4:00 - 5:00] Part 5: Live Demo — Maintenance Staff Resolves the Ticket
1. Open third browser window: `http://localhost:5173/login/maintenance`.
2. Login as:
   - **Employee ID:** `EMP-01`
   - **Password:** `Maint@1234`
3. View the **Task Queue**:
   - Ticket `LK-009` appears at the top of Ram Kumar's queue!
4. Expand the task card:
   - In the work note box, enter: `Replaced cracked elbow joint with new PVC fitting and pressurized line. Leak arrested.`
   - Click **"Add Log Note"**.
5. In the status dropdown, switch status to **"Resolved"**.
6. Open **"Completed Tasks"** in sidebar and show that `LK-009` is now recorded in completed history.

### [5:00 - 6:00] Part 6: Database Verification in MySQL Workbench
1. Switch to **MySQL Workbench** (or open terminal and run `npm run db:verify`).
2. Run the audit query from `backend/database/verify.sql`:
   ```sql
   SELECT id, category, location, status, reporter_name, assigned_name, resolved_at
   FROM leak_reports
   WHERE id = 'LK-009';
   ```
3. Show the faculty:
   - `status`: `resolved`
   - `assigned_name`: `Ram Kumar`
   - `resolved_at`: Current timestamp
4. Run the history timeline query:
   ```sql
   SELECT actor_name, action, new_status, notes, created_at
   FROM report_history
   WHERE report_id = 'LK-009'
   ORDER BY created_at ASC;
   ```
5. Show the three recorded stages:
   1. `Arjun Mehta` reported ticket.
   2. `Prof. A. Kulkarni` assigned to Ram Kumar.
   3. `Ram Kumar` logged fix note and resolved ticket.
6. Emphasize to faculty:
   > *"Every state change was executed within a single database transaction in MySQL. No data was faked in React state, and restarting the browser or server preserves the exact resolution history."*

### [6:00 - 7:00] Part 7: Technical Explanation & Faculty Q&A
- **Q: How does the frontend communicate with MySQL?**
  - *Answer:* The React 19 frontend sends REST requests (`fetch`) to `/api/*`. The Vite development proxy forwards these to the Express.js server running on port 4000. Express uses `mysql2/promise` with parameterized queries and transaction blocks to safely query MySQL.
- **Q: Are student sessions secure?**
  - *Answer:* Yes. Authentication uses server-side sessions with HTTP-only cookies and bcrypt password hashing. Frontend route guards are backed by server-side authorization middleware (`requireRole('admin')`).
- **Q: What about water tank readings?**
  - *Answer:* In this phase of the DTI project, tank telemetry and daily consumption are database-backed demonstration records stored in the `tanks` and `water_usage` tables, ready for integration with microcontroller hardware (like ESP8266 or ultrasonic sensors) in future work.
