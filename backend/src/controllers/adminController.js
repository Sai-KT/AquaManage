import bcrypt from 'bcrypt';
import { query, withTransaction } from '../config/database.js';

export const adminController = {
  /**
   * Get all leak reports with optional status filtering
   */
  async getAllReports(req, res, next) {
    try {
      const { status } = req.query;

      let sql = `
        SELECT r.id, r.category AS type, r.location, r.zone_name AS zone,
               r.reporter_name AS reporter, r.assigned_name AS assignedTo,
               r.status, r.priority, r.description, r.photo_url AS photo,
               r.video_url AS video,
               COALESCE(r.reported_at, r.created_at) AS created_at,
               r.reported_at,
               r.resolved_at,
               (SELECT notes FROM report_history WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS latest_note,
               (SELECT action FROM report_history WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS latest_action
        FROM leak_reports r
      `;
      const params = [];

      if (status === 'active') {
        sql += ' WHERE r.status IN ("reported", "assigned", "in_progress", "reopened")';
      } else if (status === 'pending') {
        sql += ' WHERE r.status IN ("reported", "pending", "reopened")';
      } else if (status === 'in_progress') {
        sql += ' WHERE r.status = "in_progress"';
      } else if (status === 'resolved') {
        sql += ' WHERE r.status = "resolved"';
      } else if (status === 'reopened') {
        sql += ' WHERE r.status = "reopened"';
      }

      sql += ' ORDER BY r.created_at DESC';

      const reports = await query(sql, params);

      const formatted = reports.map((r) => {
        const rawDate = r.created_at || r.reported_at;
        const d = rawDate ? new Date(rawDate) : new Date();
        const isValidDate = !isNaN(d.getTime());
        return {
          ...r,
          status: r.status === 'reported' ? 'pending' : r.status,
          created_at: isValidDate ? d.toISOString() : r.created_at,
          date: isValidDate ? d.toISOString().split('T')[0] : (r.date || ''),
          time: isValidDate ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
        };
      });

      return res.json({
        success: true,
        reports: formatted,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get active maintenance staff members
   */
  async getMaintenanceStaff(req, res, next) {
    try {
      const staff = await query(
        `SELECT id, full_name AS name, employee_id, email
         FROM users
         WHERE role = 'maintenance' AND is_active = TRUE
         ORDER BY full_name ASC`
      );

      return res.json({
        success: true,
        staff: staff.map((s) => s.name),
        staffDetails: staff,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign a complaint to a maintenance technician
   */
  async assignReport(req, res, next) {
    try {
      const { id } = req.params;
      const adminUser = req.session.user;

      let techId = req.body.technicianId || req.body.assignedTo;
      let techName = req.body.technicianName || req.body.staffName;

      if (!techName && techId) {
        const techRows = await query(
          'SELECT id, full_name FROM users WHERE (id = ? OR employee_id = ?) AND role = "maintenance" LIMIT 1',
          [techId, String(techId)]
        );
        if (techRows.length > 0) {
          techId = techRows[0].id;
          techName = techRows[0].full_name;
        }
      } else if (!techId && techName) {
        const techRows = await query(
          'SELECT id, full_name FROM users WHERE (full_name = ? OR employee_id = ?) AND role = "maintenance" LIMIT 1',
          [techName, techName]
        );
        techId = techRows[0]?.id || null;
      }

      if (!techName) {
        return res.status(400).json({ success: false, message: 'Technician name or valid staff ID is required.' });
      }

      await withTransaction(async (conn) => {
        // Fetch current status
        const [currentRows] = await conn.query('SELECT status FROM leak_reports WHERE id = ? FOR UPDATE', [id]);
        if (currentRows.length === 0) {
          throw new Error(`Report "${id}" not found.`);
        }
        const prevStatus = currentRows[0].status;

        // 1. Update report
        const [updateRes] = await conn.query(
          `UPDATE leak_reports
           SET assigned_to = ?,
               assigned_name = ?,
               status = 'assigned',
               assigned_at = NOW(),
               updated_at = NOW()
           WHERE id = ?`,
          [techId, techName, id]
        );

        if (updateRes.affectedRows === 0) {
          throw new Error(`Report "${id}" not found.`);
        }

        // 2. Insert audit log
        await conn.query(
          `INSERT INTO report_history (
             report_id, actor_id, actor_name, action, previous_status, new_status, notes
           ) VALUES (?, ?, ?, 'assigned', ?, 'assigned', ?)`,
          [id, adminUser?.id || null, adminUser?.name || 'Admin', prevStatus, `Assigned to ${techName} by Admin`]
        );

        // 3. System alert for the maintenance tech
        await conn.query(
          `INSERT INTO alerts (type, icon, title, message, target_role)
           VALUES ('info', 'Wrench', ?, ?, 'maintenance')`,
          [`Ticket Assigned: ${id}`, `Ticket ${id} was assigned to ${techName}.`]
        );
      });

      return res.json({
        success: true,
        data: {
          id,
          assigned_to: techId,
          assigned_name: techName,
          status: 'assigned',
        },
        message: `Report ${id} successfully assigned to ${techName}.`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update report status directly
   */
  async updateReportStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminUser = req.session.user;

      const validStatuses = ['pending', 'reported', 'in_progress', 'resolved', 'reopened'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status requested.' });
      }

      const dbStatus = status === 'pending' ? 'reported' : status;

      await withTransaction(async (conn) => {
        let sql = 'UPDATE leak_reports SET status = ?, updated_at = NOW()';
        const params = [dbStatus];

        if (status === 'resolved') {
          sql += ', resolved_at = NOW()';
        }
        sql += ' WHERE id = ?';
        params.push(id);

        await conn.query(sql, params);

        await conn.query(
          `INSERT INTO report_history (
             report_id, actor_id, actor_name, action, new_status, notes
           ) VALUES (?, ?, ?, 'status_update', ?, ?)`,
          [id, adminUser?.id || null, adminUser?.name || 'Admin', status, `Status changed to ${status} by Admin.`]
        );
      });

      return res.json({ success: true, message: `Report status updated to ${status}.` });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all system alerts
   */
  async getAlerts(req, res, next) {
    try {
      const alerts = await query(
        `SELECT id, type, icon, title, message, is_read AS 'read', created_at
         FROM alerts
         ORDER BY created_at DESC
         LIMIT 30`
      );

      const formatted = alerts.map((a) => ({
        ...a,
        time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      return res.json({ success: true, alerts: formatted });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all alerts as read
   */
  async markAllAlertsRead(req, res, next) {
    try {
      await query('UPDATE alerts SET is_read = TRUE');
      return res.json({ success: true, message: 'All alerts marked as read.' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all registered student accounts (admin only)
   */
  async getStudents(req, res, next) {
    try {
      const students = await query(
        `SELECT id, full_name, student_id, email, department, role, is_active, created_at, updated_at
         FROM users
         WHERE role = 'student'
         ORDER BY created_at DESC, id DESC`
      );

      const formatted = students.map((s) => ({
        ...s,
        is_active: Boolean(s.is_active),
      }));

      return res.json({
        success: true,
        count: formatted.length,
        students: formatted,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Register a new student account (admin only)
   */
  async createStudent(req, res, next) {
    try {
      const {
        full_name,
        student_id,
        department,
        email,
        password,
        confirmPassword,
      } = req.body || {};

      // 1. Mandatory input presence & type validation
      if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full Name is required and cannot be blank.',
        });
      }

      if (!student_id || typeof student_id !== 'string' || !student_id.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required and cannot be blank.',
        });
      }

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required and cannot be blank.',
        });
      }

      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Initial password is required.',
        });
      }

      if (confirmPassword === undefined || confirmPassword === null) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation is required.',
        });
      }

      // 2. Normalize inputs
      const cleanFullName = full_name.trim();
      const cleanStudentId = student_id.trim().toUpperCase();
      const cleanEmail = email.trim().toLowerCase();
      const cleanDept = typeof department === 'string' && department.trim() ? department.trim() : 'General';

      // 3. Length & Format Validations
      if (cleanFullName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Full Name cannot exceed 100 characters.',
        });
      }

      if (cleanStudentId.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Student ID cannot exceed 50 characters.',
        });
      }

      if (cleanDept.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Department cannot exceed 100 characters.',
        });
      }

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address (e.g. rahul@example.edu).',
        });
      }

      // Password confirmation match
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Initial password and password confirmation do not match.',
        });
      }

      // Password length check (minimum 8 characters, maximum 72 bytes for bcrypt safe limit)
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Initial password must be at least 8 characters long.',
        });
      }

      if (Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({
          success: false,
          message: 'Password exceeds maximum length supported by hashing standard (72 bytes).',
        });
      }

      // 4. Check uniqueness: Student ID
      const existingStudentId = await query(
        'SELECT id FROM users WHERE UPPER(student_id) = ? LIMIT 1',
        [cleanStudentId]
      );
      if (existingStudentId.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This Student ID is already registered.',
        });
      }

      // 5. Check uniqueness: Email
      const existingEmail = await query(
        'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
        [cleanEmail]
      );
      if (existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This email address is already associated with an account.',
        });
      }

      // 6. Secure Password Hashing
      const password_hash = await bcrypt.hash(password, 10);

      // 7. Parameterized Insert into users
      let insertResult;
      try {
        insertResult = await query(
          `INSERT INTO users (
             full_name, email, student_id, employee_id, department, password_hash, role, is_active
           ) VALUES (?, ?, ?, NULL, ?, ?, 'student', 1)`,
          [cleanFullName, cleanEmail, cleanStudentId, cleanDept, password_hash]
        );
      } catch (dbErr) {
        // Handle MySQL duplicate key error (ER_DUP_ENTRY / 1062) for concurrent collisions
        if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
          const errMsg = (dbErr.message || '').toLowerCase();
          if (errMsg.includes('student_id')) {
            return res.status(409).json({
              success: false,
              message: 'This Student ID is already registered.',
            });
          }
          if (errMsg.includes('email')) {
            return res.status(409).json({
              success: false,
              message: 'This email address is already associated with an account.',
            });
          }
          return res.status(409).json({
            success: false,
            message: 'A user account with these unique credentials already exists.',
          });
        }
        throw dbErr;
      }

      const newUserId = insertResult.insertId;

      return res.status(201).json({
        success: true,
        message: 'Student account created successfully. The student can now log in using their Student ID and initial password.',
        student: {
          id: newUserId,
          full_name: cleanFullName,
          student_id: cleanStudentId,
          department: cleanDept,
          email: cleanEmail,
          role: 'student',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default adminController;
