# AquaManage — Feature 03: Admin-Controlled Student Registration & Account Management

## 1. Feature Overview
AquaManage is a campus water-telemetry and leak-management system built for college demonstration and institutional deployment. Previously, student accounts could only be created by modifying backend seed scripts or manually running raw SQL queries in MySQL.

**Feature 03: Admin-Controlled Student Registration** introduces a secure, database-backed administrative interface directly inside the **Admin Portal** that allows administrators to:
1. Inspect all registered campus students in a centralized directory.
2. Search and filter students by Full Name, Student ID, Department, and Active Status.
3. Register new student accounts with initial login credentials via a validated modal dialog.
4. Persist newly created students immediately into the local MySQL database with bcrypt-hashed passwords.
5. Enable immediate student login via `/login/student` without requiring server restarts, manual approvals, or code modifications.

---

## 2. Administrator Navigation & Entry Points

Administrators can navigate to **Student Management** via two entry points in the Admin Portal:

1. **Admin Profile / Account Area (Preferred Navigation)**:
   - Click the administrator user card or profile avatar in the **Topbar** or **Sidebar**.
   - The **ProfileModal** opens displaying system administrator credentials.
   - Under **Quick Shortcuts**, click **"Student Management"** (marked with a green `Users` icon).
   - The modal automatically closes and routes directly to `/admin/students`.

2. **Admin Sidebar Navigation**:
   - In the persistent Admin Sidebar under the **MANAGEMENT** section.
   - Click **"Student Management"** (positioned alongside "Leak Reports").
   - Routes to `/admin/students` with active route highlighting.

Both routes are protected by client-side `<ProtectedRoute requiredRole="admin">` and backend Express session middleware (`requireAuth` and `requireRole('admin')`).

---

## 3. Registered Students Directory (`/admin/students`)

The `/admin/students` page provides a streamlined view of student accounts:

### Summary Cards
- **Total Registered Students**: Live count of all accounts with `role = 'student'` in MySQL.
- **Active Accounts**: Count of accounts currently eligible to log in (`is_active = 1`).
- **Academic Departments**: Distinct count of campus branches represented.

### Filter & Search Bar
- **Real-Time Search**: Instant client-side filtering across Full Name, Student ID, and Email.
- **Department Filter**: Dropdown filter for the 3 official college departments (Computer Engineering (Comp), Information Technology (IT), Electronics and Telecommunication (ENTC)).
- **Status Filter**: Toggle between All Status, Active Only, and Inactive Only.

### Student Table Columns
| Column | Description |
| :--- | :--- |
| **Student ID** | Permanent campus identifier (e.g. `STU-2024-001`, `STU-2024-003`) in monospace badge. Newly created students display an animated green `NEW` chip. |
| **Full Name** | Student full name with two-letter initial avatar circle. |
| **Department** | Academic branch or department name. |
| **Email** | Validated campus email address with `mailto:` link. |
| **Status** | Status pill badge (`Active` green or `Inactive` red). |
| **Registered On** | Formatted registration date (e.g., `Oct 27, 2026`). |

---

## 4. Add Student Workflow & Form Specifications

Clicking **"+ Add Student"** opens a modal dialog (`#add-student-btn`):

### Form Inputs & Validation Rules
1. **Full Name** (`full_name`):
   - Type: Text input (`#student-full-name`).
   - Required, auto-trimmed, max 100 characters.
   - Rejects blank or empty input.
2. **Student ID** (`student_id`):
   - Type: Text input (`#student-id-input`).
   - Required, auto-trimmed and converted to uppercase (e.g., `STU-2024-003`).
   - Max 50 characters. Must be globally unique in `users.student_id`.
3. **Department** (`department`):
   - Type: Dropdown selection with custom text fallback if "Other" is selected.
   - Defaults to established campus engineering departments.
4. **Email Address** (`email`):
   - Type: Email input (`#student-email-input`).
   - Required, lowercased, validated by standard email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
   - Max 100 characters. Must be globally unique in `users.email`.
5. **Initial Password** (`password`):
   - Type: Password input (`#student-init-pwd`).
   - Minimum 8 characters. Maximum 72 bytes (safe bcrypt input limit).
   - Plaintext password is NEVER logged, stored, or returned in API responses.
6. **Confirm Password** (`confirmPassword`):
   - Type: Password input (`#student-confirm-pwd`).
   - Must match `password` character-for-character. Live status indicator confirms matching status.

### Form Submission & Error Handling
- **Double-Submission Prevention**: The "Create Student" button displays a spinner and is disabled during submission.
- **Duplicate Student ID**: Backend detects duplicate key and returns HTTP 409: `"This Student ID is already registered."`.
- **Duplicate Email**: Backend detects duplicate key and returns HTTP 409: `"This email address is already associated with an account."`.
- **Success Feedback**: Closes modal, refreshes table, highlights newly created student, and displays confirmation banner:
  > *"Student account created successfully. The student can now log in using their Student ID and initial password."*

---

## 5. Backend Architecture & REST APIs

### Endpoint 1: List Students
- **Route**: `GET /api/admin/students`
- **Protection**: Session authenticated (`requireAuth`) + Role authorization (`requireRole('admin')`).
- **Database Query**:
  ```sql
  SELECT id, full_name, student_id, email, department, role, is_active, created_at, updated_at
  FROM users
  WHERE role = 'student'
  ORDER BY created_at DESC, id DESC;
  ```
- **Security**: Password hashes and employee identifiers are strictly excluded from the query.
- **Response** (`HTTP 200 OK`):
  ```json
  {
    "success": true,
    "count": 8,
    "students": [
      {
        "id": 62,
        "full_name": "Kavita Patel",
        "student_id": "STU-2024-003",
        "email": "kavita.patel@student.iiit.ac.in",
        "department": "Information Technology",
        "role": "student",
        "is_active": true,
        "created_at": "2026-10-27T05:40:00.000Z"
      }
    ]
  }
  ```

### Endpoint 2: Register Student
- **Route**: `POST /api/admin/students`
- **Protection**: Session authenticated (`requireAuth`) + Role authorization (`requireRole('admin')`).
- **Request Body**:
  ```json
  {
    "full_name": "Kavita Patel",
    "student_id": "STU-2024-003",
    "department": "Information Technology",
    "email": "kavita.patel@student.iiit.ac.in",
    "password": "<initial-password>",
    "confirmPassword": "<initial-password>"
  }
  ```
- **Backend Processing**:
  1. Validates presence and formatting of all required fields.
  2. Normalizes `student_id` to uppercase and `email` to lowercase.
  3. Pre-checks uniqueness in `users` table for both `student_id` and `email`.
  4. Hashes initial password with `bcrypt.hash(password, 10)`.
  5. Inserts parameterized record into MySQL:
     ```sql
     INSERT INTO users (
       full_name, email, student_id, employee_id, department, password_hash, role, is_active
     ) VALUES (?, ?, ?, NULL, ?, ?, 'student', 1);
     ```
  6. Catches MySQL `ER_DUP_ENTRY` (errno 1062) for concurrent race-condition safety.
- **Response** (`HTTP 201 Created`):
  ```json
  {
    "success": true,
    "message": "Student account created successfully. The student can now log in using their Student ID and initial password.",
    "student": {
      "id": 62,
      "full_name": "Kavita Patel",
      "student_id": "STU-2024-003",
      "department": "Information Technology",
      "email": "kavita.patel@student.iiit.ac.in",
      "role": "student",
      "is_active": true,
      "created_at": "2026-10-27T05:40:00.000Z"
    }
  }
  ```

### Endpoint 3: Completely Delete Student
- **Route**: `DELETE /api/admin/students/:id`
- **Protection**: Session authenticated (`requireAuth`) + Role authorization (`requireRole('admin')`).
- **Path Parameter**: `:id` — Database integer ID or alphanumeric `student_id`.
- **Security Check**: Restricts deletion strictly to accounts with `role = 'student'` (prevents accidental deletion of administrators or maintenance personnel).
- **Backend Processing**:
  1. Locates user by integer ID or `student_id`. Returns `HTTP 404` if not found.
  2. Verifies account role is `student`. Returns `HTTP 403` if non-student.
  3. Executes atomic MySQL transaction:
     - Invalidates active sessions in MySQL `sessions` table.
     - Permanently removes record from `users` table.
     - Preserves historical campus work orders safely via `ON DELETE SET NULL` on `leak_reports.student_id`.
- **Response** (`HTTP 200 OK`):
  ```json
  {
    "success": true,
    "message": "Student account for Kavita Patel (STU-2024-003) has been completely deleted.",
    "deletedStudent": {
      "id": 62,
      "full_name": "Kavita Patel",
      "student_id": "STU-2024-003"
    }
  }
  ```

---

## 6. Student Login & Lifecycle Integration

Newly created accounts integrate seamlessly with all existing AquaManage student subsystems:

1. **Student Login (`/login/student`)**:
   - The student visits `/login/student`.
   - Enters their registered `student_id` (e.g., `STU-2024-003`) and the initial password set by the admin.
   - `authController.login` queries `users` with `UPPER(student_id) = ? AND role = 'student'`, evaluates the bcrypt hash, and generates an authenticated Express session with `req.session.user`.
2. **Student Profile (`/student/profile`)**:
   - The student can inspect their registered credentials in **My Profile**.
   - `student_id` is locked as permanent read-only.
   - The student can update permitted fields (Email, Department) and change their initial password via the established Feature 01 password change workflow.
3. **Complaint Submission (`/student/report`)**:
   - The new student submits water leak or wastage complaints.
   - The backend records `leak_reports.student_id = req.session.user.id` (referencing the auto-increment primary key in `users`).
4. **Complaint Persistence & Account Isolation**:
   - Complaints remain permanently tied to the student's database account across logout, server reboots, and future logins.
   - Other students (e.g. `STU-2024-001`) are strictly isolated and cannot view or alter the new student's reports.

---

## 7. Automated Test Suite Verification

The feature is verified by automated test checks in `backend/tests/run-tests.js`:

```bash
npm run test:backend
```

### Test Results Breakdown (76 Total Checks, 76 Passed)
- **Category 1**: Infrastructure & MySQL Connectivity (2/2 Passed)
- **Category 2**: Universal Authentication & Role Enforcement (8/8 Passed)
- **Category 3**: Student Workflow & Complaint Identity Persistence (8/8 Passed)
- **Category 4**: Student Profile Management & Bcrypt Security (14/14 Passed)
- **Category 5**: Admin Workflow & Report Assignment (3/3 Passed)
- **Category 6**: Maintenance Task Queue & Technician Execution (8/8 Passed)
- **Category 7**: Reopen Resolved Complaint Multi-Cycle Engine (12/12 Passed)
- **Category 8**: Telemetry & Dashboard Analytics (3/3 Passed)
- **Category 9**: Admin-Controlled Student Registration (17/17 Passed):
  - `Admin Student Directory Listing (GET /api/admin/students)`: HTTP 200, credentials excluded.
  - `Security: Unauthorized Student Listing Barred`: 401 for anonymous, 403 for student/maintenance.
  - `Validation: Mandatory Fields & Password Rules`: 400 for missing name, ID, bad email, short password (<8), mismatch.
  - `Security: Unauthorized Student Creation Barred`: 401 for anonymous, 403 for student/maintenance.
  - `Admin Registers New Student Account`: HTTP 201, user stored in MySQL with active status and bcrypt hash.
  - `Uniqueness: Duplicate Student ID Rejected`: HTTP 409 Conflict with descriptive message.
  - `Uniqueness: Duplicate Email Rejected`: HTTP 409 Conflict with descriptive message.
  - `Student Login Security: Invalid Password Rejected`: HTTP 401.
  - `Newly Registered Student Successful Login`: HTTP 200, valid session issued.
  - `Student Profile Integration`: Verified name, department, email, role.
  - `New Student Complaint Submission`: Stored with permanent `users.id` foreign key.
  - `Complaint Persistence Across Logout & Re-login`: Ticket recovered from MySQL after session teardown.
  - `Bidirectional Account Isolation`: Complaint visibility strictly segregated between students.
  - `Automated Post-Test Data Sanitization`: Test student and test tickets cleanly removed; demonstration records preserved.

---

## 8. Manual Faculty Demonstration Walkthrough

Follow these steps to demonstrate the feature to faculty or evaluators:

1. **Log in as Administrator**:
   - URL: `http://localhost:5174/login/admin`
   - Email: `director@iiit.ac.in`
   - Password: `Password@123`
2. **Access Student Management**:
   - Click the Admin profile card in the Topbar/Sidebar, then click **"Student Management"** under Quick Shortcuts.
   - Alternatively, click **"Student Management"** under MANAGEMENT in the left sidebar.
3. **Inspect the Directory**:
   - Observe the total registered student count and the table of existing students (`STU-2024-001`, `STU-2024-002`, etc.).
   - Type in the search bar to filter by name or department.
4. **Register a New Student**:
   - Click the green **"+ Add Student"** button.
   - Enter:
     - **Full Name**: `Rahul Sharma`
     - **Student ID**: `STU-2024-005`
     - **Department**: `Computer Engineering`
     - **Email Address**: `rahul.sharma@student.iiit.ac.in`
     - **Initial Password**: `DemoPass@123`
     - **Confirm Password**: `DemoPass@123`
   - Click **"Create Student"**.
   - Notice the green confirmation banner and the new student highlighted in the table with a `NEW` badge.
5. **Verify Duplicate Prevention**:
   - Click **"+ Add Student"** again and attempt to register `STU-2024-005`.
   - Observe the immediate error: *"This Student ID is already registered."*
6. **Log in as the New Student**:
   - Log out of Admin (`End Session` in Profile Modal).
   - Go to `http://localhost:5174/login/student`.
   - Enter Student ID: `STU-2024-005` and Password: `DemoPass@123`.
   - Notice that the Student Portal opens immediately!
7. **Verify Profile & Reporting**:
   - Click **"My Profile"** (`/student/profile`): Observe `Rahul Sharma`, `STU-2024-005`, and `Computer Engineering`.
   - Click **"Report an Issue"** (`/student/report`): Submit a test complaint.
   - Click **"My Reports"** (`/student/myreports`): Verify the complaint is saved.
   - Log out and log back in: The complaint is still there, backed permanently by MySQL!

---

## 9. Known Limitations & Architectural Scope
- **No Cloud Services**: The feature runs 100% locally on Node.js Express + local MySQL (`aqua_manage_local`) without requiring internet access or cloud services.
- **Demonstration Scope**: Administrative student creation is designed for institutional management and college DTI evaluation. Bulk CSV student import and self-signup workflows were intentionally omitted to maintain strict role separation and prevent unauthorized student account creation.
