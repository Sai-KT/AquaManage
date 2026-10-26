# AquaManage — Smart Campus Water Resource Management & Leak Resolution

> **College DTI (Design Thinking & Innovation) Project**  
> A full-stack, locally hosted campus water resource monitoring, crowdsourced leak reporting, and maintenance workflow platform.

---

## 1. Project Overview & DTI Context

### The Problem
On educational campuses (such as engineering and university complexes), thousands of litres of treated municipal and borewell water are lost daily due to unobserved pipe bursts, slow faucet leaks, and overhead tank overflows. Conventional complaint channels (WhatsApp groups or paper registers) suffer from lack of accountability, zero resolution tracking, and delayed maintenance responses.

### The Solution
**AquaManage** provides a closed-loop digital ecosystem connecting students, campus administrators, and maintenance personnel on a single platform:
- **Crowdsourced Student Reporting:** Students photograph and report leaks with geolocation in under 30 seconds.
- **Administrative Transparency:** Facility managers view campus-wide water tank levels, monitor active leaks, and assign work orders in real time.
- **Maintenance Accountability:** Plumbers and technicians receive priority-sorted tasks, log repair notes, and mark tickets resolved with auditable timestamps.

---

## 2. Technology Stack

- **Frontend:** React 19 (`^19.2.7`), React Router DOM v7 (`^7.18.1`), Vite 8 (`^8.1.1`)
- **Styling:** Custom CSS design system (dark/light mode support, responsive layout)
- **Data Visualization & GIS:** Chart.js, React-Chartjs-2, Leaflet & React-Leaflet
- **Backend API:** Node.js, Express.js 4.x
- **Database:** MySQL 8.x Community Server (database: `aqua_manage_local`, InnoDB, utf8mb4)
- **Database Driver:** `mysql2/promise` with connection pooling and transactions
- **Authentication & Security:** bcrypt password hashing, server-side express-session, HTTP-only cookies
- **Local File Uploads:** Multer (multipart storage under `backend/uploads/`)

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────┐
│               React 19 Frontend (Vite)                │
│             http://localhost:5173                      │
│                                                        │
│  [Student Portal]    [Admin Portal]    [Maint Portal]  │
│  /student/*          /admin/*          /maintenance/*  │
└──────────────────────────┬─────────────────────────────┘
                           │ (Vite Proxy: /api & /uploads)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Express.js REST API                      │
│             http://localhost:4000                      │
│                                                        │
│  AuthRoutes   StudentRoutes   AdminRoutes   MaintRoutes │
│  DashboardRoutes    WaterRoutes    Multer File Storage │
└──────────────────────────┬─────────────────────────────┘
                           │ (mysql2 connection pool)
                           ▼
┌────────────────────────────────────────────────────────┐
│               MySQL 8.x Local Database                 │
│                 aqua_manage_local                      │
│                                                        │
│  [users]   [leak_reports]   [report_history]   [tanks] │
│  [water_usage]        [alerts]       [sessions]        │
└────────────────────────────────────────────────────────┘
```

---

## 4. Quick Local Setup

### 1. Configure MySQL Database Password
Open `backend/.env` and enter your local MySQL root password:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_ROOT_PASSWORD_HERE
DB_NAME=aqua_manage_local
```

### 2. Run Database Migration & Seeding
From the repository root:
```bash
# 1. Create database and tables
npm run db:schema

# 2. Seed demonstration accounts, tanks, and historical data
npm run db:seed

# 3. Verify records
npm run db:verify
```

### 3. Start the Full Application
```bash
npm run dev:all
```
This concurrently starts:
- **Express Backend:** [http://localhost:4000](http://localhost:4000)
- **Vite React Frontend:** [http://localhost:5173](http://localhost:5173)

---

## 5. Demonstration Accounts

| Role | Username / ID | Password | Portal URL |
| :--- | :--- | :--- | :--- |
| **Director / Admin** | `director@iiit.ac.in` | `Director@99` | [http://localhost:5173/login/admin](http://localhost:5173/login/admin) |
| **HoD / Admin** | `hod@iiit.ac.in` | `HoD@Admin2024` | [http://localhost:5173/login/admin](http://localhost:5173/login/admin) |
| **Maintenance Technician** | `EMP-01` | `Maint@1234` | [http://localhost:5173/login/maintenance](http://localhost:5173/login/maintenance) |
| **Student A (Arjun Mehta)** | `STU-2024-001` | `Student@123` | [http://localhost:5173/login/student](http://localhost:5173/login/student) |
| **Student B (Priya Singh)** | `STU-2024-002` | `Student@456` | [http://localhost:5173/login/student](http://localhost:5173/login/student) |

---

## 6. Project Documentation Index

Detailed architectural and operational documentation is located in `/docs`:
- [LOCAL_FULLSTACK_AUDIT.md](file:///Users/mrugmaythere/work/DTIL/AquaManage/docs/LOCAL_FULLSTACK_AUDIT.md) — Initial codebase inspection, dependencies, and audit findings.
- [DATABASE_DESIGN.md](file:///Users/mrugmaythere/work/DTIL/AquaManage/docs/DATABASE_DESIGN.md) — MySQL schema, ER diagram, foreign keys, and indexes.
- [API_REFERENCE.md](file:///Users/mrugmaythere/work/DTIL/AquaManage/docs/API_REFERENCE.md) — REST endpoint specifications, payloads, status codes, and permissions.
- [LOCAL_SETUP.md](file:///Users/mrugmaythere/work/DTIL/AquaManage/docs/LOCAL_SETUP.md) — Complete environment configuration and troubleshooting steps.
- [FACULTY_DEMO.md](file:///Users/mrugmaythere/work/DTIL/AquaManage/docs/FACULTY_DEMO.md) — 5–7 minute script for faculty presentation.
- [TEST_RESULTS.md](file:///Users/mrugmaythere/work/DTIL/AquaManage/docs/TEST_RESULTS.md) — Automated verification report and test results.

---

## 7. Verification Queries (MySQL Workbench)
```sql
USE `aqua_manage_local`;

-- Check all complaints and current statuses
SELECT id, category, location, priority, status, reporter_name, assigned_name
FROM leak_reports
ORDER BY created_at DESC;

-- View audit lifecycle history
SELECT report_id, actor_name, action, new_status, notes, created_at
FROM report_history
ORDER BY created_at DESC;
```
