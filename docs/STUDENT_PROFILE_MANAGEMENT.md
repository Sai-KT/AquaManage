# AquaManage — Feature 01: Complete Student Profile Management

## 1. Feature Purpose

The **Student Profile Management** feature enables authenticated campus students to:
- Access a dedicated, intuitive **My Profile** interface within the Student Portal (`/student/profile`).
- View their registered institutional identity (Full Name, Student ID, Role, Account Status) as verified, read-only records.
- Safely update permitted academic and contact fields (**Department / Branch** and **Email address**) with permanent MySQL persistence.
- Change their login password securely using `bcrypt` verification of their current credentials, with automatic session invalidation upon success.
- Maintain persistent complaint history linked to their permanent internal database user ID (`users.id`), guaranteeing that profile and password changes never delete, disconnect, or alter previously submitted reports.

---

## 2. Profile Field Specification

| Field | Type | Storage Column | Mutability | Validation Rules |
|---|---|---|---|---|
| **Full Name** | String | `users.full_name` | **Read-Only** | Institutional record; prevents identity spoofing |
| **Student ID / IRN** | String | `users.student_id` | **Read-Only** | Unique college matriculation identifier |
| **Portal Role** | Enum | `users.role` | **Read-Only** | Fixed to `student` |
| **Account Status** | Boolean | `users.is_active` | **Read-Only** | Must be active (`1`) to authenticate |
| **Department / Branch** | String | `users.department` | **Editable** | Nullable string, max 100 chars, trimmed |
| **College Email** | String | `users.email` | **Editable** | Valid format (`name@domain.edu`), unique, max 100 chars |
| **Registration Date** | Timestamp | `users.created_at` | **Read-Only** | System-generated audit timestamp |

---

## 3. Frontend Architecture & Routing

- **Route**: `/student/profile`
- **Component**: [`src/pages/student/StudentProfile.jsx`](file:///Users/mrugmaythere/work/DTIL/AquaManage/src/pages/student/StudentProfile.jsx)
- **Route Guard**: Wrapped in `<ProtectedRoute requiredRole="student">` in [`src/App.jsx`](file:///Users/mrugmaythere/work/DTIL/AquaManage/src/App.jsx). Non-students and unauthenticated visitors are redirected to `/login/student`.
- **Navigation Integration**:
  - **Sidebar**: Added dedicated `ACCOUNT` navigation category with `My Profile` entry in [`src/components/Sidebar.jsx`](file:///Users/mrugmaythere/work/DTIL/AquaManage/src/components/Sidebar.jsx).
  - **Command Palette**: Searchable quick action `p-stud-profile` in [`src/components/Topbar.jsx`](file:///Users/mrugmaythere/work/DTIL/AquaManage/src/components/Topbar.jsx).
  - **Profile Modal**: Quick action button `"Manage Student Profile & Security"` in [`src/components/ProfileModal.jsx`](file:///Users/mrugmaythere/work/DTIL/AquaManage/src/components/ProfileModal.jsx).
- **Client State Synchronization**: Calling `updateCurrentUser({ email, department })` updates memory and `sessionStorage` in [`src/context/AuthContext.jsx`](file:///Users/mrugmaythere/work/DTIL/AquaManage/src/context/AuthContext.jsx) without forcing page reloads.

---

## 4. Backend API Endpoints

### 4.1 Retrieve Student Profile
- **Method / Endpoint**: `GET /api/student/profile`
- **Middleware**: `requireAuth`, `requireRole('student')`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "profile": {
      "id": 6,
      "full_name": "Arjun Mehta",
      "student_id": "STU-2024-001",
      "email": "arjun@student.iiit.ac.in",
      "department": "Computer Engineering",
      "role": "student",
      "is_active": true,
      "created_at": "2026-10-26T10:00:00.000Z",
      "updated_at": "2026-10-26T11:20:00.000Z"
    }
  }
  ```
- **Security**: Omits `password_hash` and internal secrets.

### 4.2 Update Permitted Profile Details
- **Method / Endpoint**: `PATCH /api/student/profile`
- **Middleware**: `requireAuth`, `requireRole('student')`
- **Payload**:
  ```json
  {
    "email": "arjun.new@student.iiit.ac.in",
    "department": "Computer Engineering & AI"
  }
  ```
- **Validation**:
  - Rejects attempts to modify protected fields (`id`, `student_id`, `role`, `password`, `is_active`, `full_name`) with `400 Bad Request`.
  - Validates email regex and column length.
  - Enforces database-level email uniqueness (`409 Conflict` if assigned to another user).
  - Parameterized update queries:
    ```sql
    UPDATE users 
    SET email = COALESCE(?, email),
        department = COALESCE(?, department),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND role = 'student'
    ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "profile": { ... }
  }
  ```

### 4.3 Change Login Password
- **Method / Endpoint**: `POST /api/student/profile/change-password`
- **Middleware**: `requireAuth`, `requireRole('student')`
- **Payload**:
  ```json
  {
    "currentPassword": "<CURRENT_PASSWORD>",
    "newPassword": "<NEW_PASSWORD>",
    "confirmPassword": "<NEW_PASSWORD>"
  }
  ```
- **Validation & Process**:
  1. Compares `currentPassword` against stored `password_hash` via `bcrypt.compare`. Returns `401 Unauthorized` if invalid.
  2. Ensures `newPassword === confirmPassword` and length is between 8 and 128 characters.
  3. Rejects new password if identical to current password (`400 Bad Request`).
  4. Hashes new password using `bcrypt.hash(newPassword, 10)` and updates MySQL.
  5. Destroys active Express session (`req.session.destroy`) and clears `aquamanage_sid` / `connect.sid` cookies.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully. Please sign in again with your new password."
  }
  ```

---

## 5. Security & Student Isolation Guarantees

1. **Session-Bound Identity**:
   All database queries target `WHERE id = ? AND role = 'student'` using `req.session.user.id`. The server never trusts client-supplied user IDs or role parameters.
2. **Account Isolation**:
   Student A can neither inspect nor mutate Student B's profile. Direct API calls by Student B attempting cross-account modification are barred by session constraints.
3. **Cross-Role Separation**:
   Administrators and maintenance technicians calling `/api/student/profile` are rejected with `403 Forbidden` (`requireRole('student')`).
4. **Complaint Preservation**:
   Complaints in `leak_reports` foreign-key reference `users.id`. Changing email, department, or password modifies attributes in the existing `users` row without altering primary keys or report references.

---

## 6. Database Schema & Migration Requirements

The feature introduces a nullable `department` column to the `users` table:
```sql
ALTER TABLE users 
ADD COLUMN department VARCHAR(100) NULL AFTER employee_id;
```
- Recorded in [`backend/database/schema.sql`](file:///Users/mrugmaythere/work/DTIL/AquaManage/backend/database/schema.sql).
- Automatically seeded for demonstration student accounts in [`backend/database/seed.js`](file:///Users/mrugmaythere/work/DTIL/AquaManage/backend/database/seed.js).

---

## 7. Manual Verification Instructions

1. **Log in as Student A**:
   - URL: `http://localhost:5174/login/student`
   - Student ID: `STU-2024-001`
   - Password: `Student@123`
2. **Access Profile Page**:
   - Click **My Profile** in the left sidebar under the **ACCOUNT** section, or click **Manage Student Profile & Security** inside the user avatar popover.
   - Verify that **Arjun Mehta**, **STU-2024-001**, and **Computer Engineering** are displayed.
3. **Edit Profile Details**:
   - Click **Edit Details**.
   - Change department to `Software Systems & AI` and update email address.
   - Click **Save Changes**. Verify success alert appears and topbar/sidebar reflect the updated values immediately.
4. **Verify Persistence Across Logout**:
   - Log out from the student portal.
   - Refresh the browser and log back in using `STU-2024-001`.
   - Navigate to `/student/profile`; verify the newly saved department and email are restored from MySQL.
5. **Verify Complaint Association**:
   - Click **My Reports** in the sidebar.
   - Verify that previously submitted reports remain listed with their statuses.
6. **Change Password**:
   - On the profile page, enter the current password (`Student@123`), enter a new password (min 8 characters), and confirm it.
   - Click **Update Password & Re-login**.
   - Verify success notification and automatic redirect to `/login/student`.
   - Confirm that the old password fails authentication, and the new password logs in successfully.

---

## 8. Known Limitations & College DTI Scope

- **Single Active Session**: Changing password terminates the student's current Express session. Because sessions are managed via MySQL session store, secondary devices are invalidated when their active cookies expire.
- **Institutional Names**: Student full names remain administrator-assigned and read-only to prevent student name spoofing during faculty demonstrations.
