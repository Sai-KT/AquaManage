# AquaManage — Local Full-Stack Architecture & Migration Audit

**Document:** `docs/LOCAL_FULLSTACK_AUDIT.md`  
**Project:** College DTI (Design Thinking and Innovation) — Smart Campus Water Management  
**Branch:** `feature/local-fullstack-dti`  
**Date:** October 2026  

---

## 1. Executive Summary & Objective

AquaManage is a college Design Thinking and Innovation (DTI) project addressing water resource monitoring, leak detection, and maintenance workflows on an educational campus (modeled on IIIT Hinjewadi). The existing React 19 frontend features three distinct portals:
1. **Student Portal:** Leak reporting with multimedia attachments, submission history, and harvesting awareness.
2. **Administrator Portal:** Executive KPI overview, interactive campus GIS map, work order assignment, tank level telemetry gauges, and alert monitoring.
3. **Maintenance Staff Portal:** Priority-ranked task queue, status progression (`pending` → `in_progress` → `resolved`), and technician work note logging.

**Migration Objective:**
Preserve 100% of the developed React 19 visual design, component tree, and user experience while transitioning from the remote Supabase cloud backend to a fully local, offline **Node.js + Express.js + MySQL 8.x** architecture (`aqua_manage_local`).

---

## 2. Existing Repository Audit & Dependencies

### 2.1 Technology Matrix
- **Frontend Framework:** React `19.2.7`, ReactDOM `19.2.7`
- **Routing:** React Router DOM `7.18.1`
- **Build & Development Server:** Vite `8.1.1`
- **Mapping:** Leaflet `1.9.4`, React-Leaflet `5.0.0`
- **Data Visualization:** Chart.js `4.5.1`, React-Chartjs-2 `5.3.1`
- **Icons:** Lucide React `1.27.0`
- **Linter:** Oxlint `1.71.0` (0 errors)
- **Target Backend:** Node.js, Express.js `4.x`, `mysql2/promise`, `bcrypt`, `express-session`, `express-mysql-session`, `cors`, `multer`, `dotenv`
- **Target Database:** MySQL Community Server (`localhost:3306`, database: `aqua_manage_local`)

### 2.2 Component & Module Inventory

| Module / Component | Path | Current Status | Migration Action |
| :--- | :--- | :--- | :--- |
| **Auth Provider** | `src/context/AuthContext.jsx` | Uses `sessionStorage` + Supabase Auth / hardcoded fallback | Connect `login()` and `loginStudent()` to `POST /api/auth/login`. Keep `sessionStorage` and idle timeout intact. |
| **Protected Routes** | `src/components/ProtectedRoute.jsx` | Fully Functional | Preserved as-is (checks `user.role`). |
| **Student Reporting** | `src/pages/student/ReportIssue.jsx` | Throws error if `.env` lacks Supabase keys | Redirect to `POST /api/student/reports` with multipart local file upload. |
| **Student Reports** | `src/pages/student/MyReports.jsx` | Reads Supabase or 2 static mock reports | Connect to `GET /api/student/reports` and `GET /api/student/reports/:id/history`. |
| **Student Harvesting** | `src/pages/student/Harvesting.jsx` | Reads Supabase or mock tanks/stats | Connect to `GET /api/water/tanks` and `GET /api/dashboard/stats`. |
| **Admin Dashboard** | `src/pages/admin/Dashboard.jsx` | Hybrid: queries overview; hardcoded quick link `leakReportsInProgress()` | Connect to `GET /api/dashboard/stats`; calculate dynamic in-progress count. |
| **Admin Reports** | `src/pages/admin/LeakReports.jsx` | Supabase or mock; assignment mutates state only | Connect to `GET /api/admin/reports` and `PATCH /api/admin/reports/:id/assign`. |
| **Admin Alerts** | `src/pages/admin/Alerts.jsx` | Reads Supabase or static `mockAlerts` | Connect to `GET /api/admin/alerts` and `PATCH /api/admin/alerts/mark-read`. |
| **Admin Map View** | `src/pages/admin/MapView.jsx` | Leaflet map with hardcoded campus pins | Preserved; loads tank levels and active issues from local backend. |
| **Admin Water Usage** | `src/pages/admin/WaterUsage.jsx` | Reads static `waterUsageByZone` | Connect to `GET /api/water/usage` (seeded MySQL records). |
| **Admin Harvesting** | `src/pages/admin/Harvesting.jsx` | Reads static `tankData` & `harvestingTrend` | Connect to `GET /api/water/tanks` and seeded daily metrics. |
| **Admin Analytics** | `src/pages/admin/Analytics.jsx` | Reads static `analyticsData` | Connect to `GET /api/water/analytics` demonstration dataset. |
| **Maintenance Queue**| `src/pages/maintenance/TaskQueue.jsx` | Supabase or static; status/log updates in state | Connect to `GET /api/maintenance/tasks`, `PATCH /api/maintenance/tasks/:id/status`, and `POST /api/maintenance/tasks/:id/logs`. |
| **Maintenance Done** | `src/pages/maintenance/CompletedTasks.jsx` | Supabase or 2 fallback tasks | Connect to `GET /api/maintenance/completed`. |

---

## 3. Data Contracts & UI Schema Expectations

Existing React components expect specific payload properties that must be preserved:
- **Complaint Identifier:** `id` as string (e.g., `'LK-001'`, `'LK-002'`).
- **Statuses:** `'pending'`, `'in_progress'`, `'resolved'`.
- **Priorities:** `'critical'`, `'high'`, `'medium'`, `'low'`.
- **Reporter:** `reporter` or `reporter_name`.
- **Location:** `location` or `location_detail`, and `zone`.
- **Work Logs:** Array of strings or objects (`note`, `technician_name`, `created_at`).
- **Tank Records:** `id` (int), `name` (string), `capacity` (int), `current` (int), `status` (`'good'|'warning'|'critical'`).

---

## 4. Backend & Database Architecture Plan

1. **Express Server:** Listening on `http://localhost:4000/api` with CORS for `http://localhost:5173`.
2. **Vite Proxy:** Configured in `vite.config.js` to proxy `/api` calls directly to port `4000`.
3. **MySQL Database:** `aqua_manage_local` containing:
   - `users`: User authentication, roles, identifiers.
   - `leak_reports`: Persistent complaints with status, priority, and assignments.
   - `report_history`: Auditable event logs for each ticket.
   - `tanks`: Demonstration storage records with calculated statuses.
   - `water_usage`: Daily/weekly zone consumption readings.
   - `alerts`: Active notices derived from system activity.
4. **File Storage:** Local upload directory `backend/uploads/` with Multer validation (images only, max 5MB).
