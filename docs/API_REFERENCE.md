# AquaManage — REST API Reference Specification

**Base URL:** `http://localhost:4000/api` (or relative `/api` via Vite development proxy)  
**Authentication:** HTTP-only Server-Side Session Cookies (`connect.sid` / `aquamanage_sid`)  
**Data Format:** `application/json` (or `multipart/form-data` for file uploads)  

---

## 1. System Health

### `GET /api/health`
Check the operational status of the Express server and MySQL connection pool.

- **Role:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "service": "AquaManage Local API",
  "database": {
    "connected": true,
    "name": "aqua_manage_local",
    "host": "127.0.0.1",
    "details": "Database connection verified successfully."
  },
  "timestamp": "2026-10-23T09:00:00.000Z"
}
```
- **Error Response (503 Service Unavailable):**
```json
{
  "success": false,
  "status": "degraded",
  "database": { "connected": false, "details": "Access denied for user 'root'@'localhost'" }
}
```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/login`
Authenticate as Admin, Maintenance Staff, or Student.

- **Role:** Public
- **Request Body (Admin):**
```json
{
  "role": "admin",
  "username": "director@iiit.ac.in",
  "password": "Director@99"
}
```
- **Request Body (Maintenance):**
```json
{
  "role": "maintenance",
  "username": "EMP-01",
  "password": "Maint@1234"
}
```
- **Request Body (Student):**
```json
{
  "role": "student",
  "name": "Arjun Mehta",
  "irnNo": "STU-2024-001",
  "password": "Student@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Prof. A. Kulkarni",
    "role": "admin",
    "email": "director@iiit.ac.in",
    "employee_id": "DIR-01",
    "username": "director@iiit.ac.in"
  },
  "message": "Successfully authenticated as admin."
}
```
- **Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

### `GET /api/auth/me`
Retrieve active authenticated user profile.

- **Role:** Authenticated (Any)
- **Response (200 OK):** User profile object.
- **Error (401 Unauthorized):** `{ "success": false, "message": "No active session." }`

### `POST /api/auth/logout`
Destroys the server session and clears session cookie.

- **Role:** Authenticated
- **Response (200 OK):** `{ "success": true, "message": "Logged out successfully." }`

---

## 3. Student Complaints (`/api/student`)

### `POST /api/student/reports`
Submit a new campus water leakage or wastage complaint. Supports multipart photo/video evidence.

- **Role:** `student`, `admin`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `type` (string, required): e.g. `'Pipe Leak'`, `'Pipe Burst'`, `'Tap Wastage'`
  - `zone` (string, required): e.g. `'Academic Block'`, `'Mithila Hostel'`
  - `location` (string, optional): Specific area description
  - `description` (string, required): Minimum 10 characters
  - `photo` (file, optional): JPEG/PNG/WebP, max 5MB
  - `video` (file, optional): MP4/WebM, max 5MB
- **Response (201 Created):**
```json
{
  "success": true,
  "reportId": "LK-009",
  "data": {
    "id": "LK-009",
    "reportReference": "REF-2026-009",
    "type": "Pipe Leak",
    "location": "Academic Block — 2nd Floor Corridor",
    "zone": "Academic Block",
    "priority": "high",
    "status": "reported",
    "photoUrl": "/uploads/leak_evidence-1718293847.jpg"
  },
  "message": "Complaint submitted successfully and recorded in MySQL."
}
```

### `GET /api/student/reports`
Retrieve all complaints submitted by the authenticated student.

- **Role:** `student`, `admin`
- **Response (200 OK):**
```json
{
  "success": true,
  "reports": [
    {
      "id": "LK-001",
      "type": "Pipe Leak",
      "location": "Academic Block — Ground Floor Washroom",
      "zone": "Academic Block",
      "status": "in_progress",
      "priority": "high",
      "description": "Water dripping from overhead pipe.",
      "photo": null,
      "date": "2026-10-20"
    }
  ]
}
```

### `GET /api/student/reports/:id/history`
Retrieve the timeline of status updates and work logs for a specific complaint.

- **Role:** `student`, `admin`, `maintenance`
- **Response (200 OK):**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "report_id": "LK-001",
      "actor_name": "Arjun Mehta",
      "action": "reported",
      "previous_status": null,
      "new_status": "reported",
      "notes": "Complaint submitted by student.",
      "created_at": "2026-10-20 09:30:00"
    },
    {
      "id": 2,
      "report_id": "LK-001",
      "actor_name": "Prof. A. Kulkarni",
      "action": "assigned",
      "previous_status": "reported",
      "new_status": "assigned",
      "notes": "Assigned to Ram Kumar (EMP-01)",
      "created_at": "2026-10-20 10:15:00"
    }
  ]
}
```

---

## 4. Admin Management (`/api/admin`)

### `GET /api/admin/reports`
Retrieve all campus complaints.

- **Role:** `admin`
- **Query Parameters:** `?status=all|active|pending|in_progress|resolved`
- **Response (200 OK):** Array of formatted complaint objects.

### `GET /api/admin/maintenance-staff`
List all active maintenance staff for ticket delegation.

- **Role:** `admin`
- **Response (200 OK):**
```json
{
  "success": true,
  "staff": ["Ram Kumar", "Suresh Babu", "Mohan Das"]
}
```

### `PATCH /api/admin/reports/:id/assign`
Assign an open ticket to a technician.

- **Role:** `admin`
- **Request Body:**
```json
{
  "technicianName": "Ram Kumar",
  "technicianId": 3
}
```
- **Response (200 OK):** `{ "success": true, "message": "Ticket LK-002 assigned to Ram Kumar." }`

### `PATCH /api/admin/reports/:id/status`
Manually change ticket status.

- **Role:** `admin`
- **Request Body:** `{ "status": "resolved" }`

### `GET /api/admin/alerts` & `PATCH /api/admin/alerts/mark-read`
Fetch and acknowledge alerts.

---

## 5. Maintenance Operations (`/api/maintenance`)

### `GET /api/maintenance/tasks`
Fetch open/assigned tasks for the logged-in technician.

- **Role:** `maintenance`, `admin`
- **Response (200 OK):** Array of tasks with attached work logs and photos.

### `PATCH /api/maintenance/tasks/:id/status`
Advance task status (`in_progress` &rarr; `resolved`).

- **Role:** `maintenance`, `admin`
- **Request Body:** `{ "status": "resolved" }`
- **Response (200 OK):** `{ "success": true, "message": "Task LK-001 status successfully updated to resolved." }`

### `POST /api/maintenance/tasks/:id/logs`
Add an progress note.

- **Role:** `maintenance`, `admin`
- **Request Body:** `{ "note": "Replaced faulty valve with new brass fitting." }`
- **Response (201 Created):** `{ "success": true, "workLog": {...} }`

### `GET /api/maintenance/completed`
Retrieve history of resolved tasks.

---

## 6. Dashboard & Water Telemetry (`/api/dashboard`, `/api/water`)

### `GET /api/dashboard/stats`
Live aggregated statistics queried directly from MySQL tables.

- **Role:** Public / Authenticated
- **Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalComplaints": 8,
    "activeLeaks": 5,
    "pendingIssues": 2,
    "inProgressIssues": 3,
    "resolvedIssues": 3,
    "waterSavedToday": 10900,
    "alertsToday": 3,
    "harvestingEfficiency": 87
  },
  "tanks": [...]
}
```

### `GET /api/water/tanks`
Water storage tanks and fill percentages.

### `PATCH /api/water/tanks/:id`
Update tank current fill level (validates `current_level <= capacity`).

### `GET /api/water/usage`
Campus zone consumption records.
