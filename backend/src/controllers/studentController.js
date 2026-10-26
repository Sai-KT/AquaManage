import bcrypt from 'bcrypt';
import { query, withTransaction } from '../config/database.js';

export const studentController = {
  /**
   * Submit a new leak/water issue complaint
   */
  async submitReport(req, res, next) {
    try {
      const type = req.body.type || req.body.category;
      const zone = req.body.zone || req.body.zone_name || 'Academic Block';
      const location = req.body.location || req.body.location_detail;
      const description = req.body.description;
      const user = req.session?.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in as a student to submit a report.',
        });
      }

      if (!type || !zone || !description || description.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Please provide issue type, campus zone, and a description of at least 10 characters.',
        });
      }

      // Handle uploaded files
      const photoFile = req.files?.photo?.[0];
      const videoFile = req.files?.video?.[0];
      const photoUrl = photoFile ? `/uploads/${photoFile.filename}` : null;
      const videoUrl = videoFile ? `/uploads/${videoFile.filename}` : null;

      // Auto-assign priority based on severity
      let priority = 'medium';
      if (type === 'Pipe Burst') priority = 'critical';
      else if (type === 'Pipe Leak' || type === 'Overflow') priority = 'high';
      else if (type === 'Tap Wastage') priority = 'medium';
      else priority = 'low';

      const reporterId = user.id;
      const reporterName = user.name || 'Student';
      const locDetail = location || `${zone} — Campus Area`;

      const result = await withTransaction(async (conn) => {
        // 1. Determine next report ID (LK-XXX) safely without collision
        const [rows] = await conn.query('SELECT id FROM leak_reports ORDER BY CAST(SUBSTRING(id, 4) AS UNSIGNED) DESC LIMIT 1');
        let nextNum = 1;
        if (rows.length > 0 && rows[0].id) {
          const match = rows[0].id.match(/LK-(\d+)/);
          if (match) {
            nextNum = parseInt(match[1], 10) + 1;
          }
        }
        const reportId = `LK-${String(nextNum).padStart(3, '0')}`;
        const reportRef = `REF-2026-${String(nextNum).padStart(3, '0')}`;

        // 2. Insert into leak_reports with authenticated student's permanent database ID
        await conn.query(
          `INSERT INTO leak_reports (
             id, report_reference, student_id, reporter_name, location, zone_name,
             description, category, priority, status, photo_url, video_url
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'reported', ?, ?)`,
          [
            reportId, reportRef, reporterId, reporterName, locDetail, zone,
            description.trim(), type, priority, photoUrl, videoUrl,
          ]
        );

        // 3. Insert audit history event
        await conn.query(
          `INSERT INTO report_history (
             report_id, actor_id, actor_name, action, previous_status, new_status, notes
           ) VALUES (?, ?, ?, 'reported', NULL, 'reported', ?)`,
          [reportId, reporterId, reporterName, 'Complaint submitted by student.']
        );

        // 4. Create automated system alert for Admin/Maintenance
        await conn.query(
          `INSERT INTO alerts (type, icon, title, message, is_read, target_role)
           VALUES (?, ?, ?, ?, FALSE, 'admin')`,
          [
            priority === 'critical' ? 'critical' : 'warning',
            priority === 'critical' ? 'AlertTriangle' : 'Droplets',
            `New Report: ${reportId} (${type})`,
            `${description.slice(0, 80)}... Location: ${locDetail}`,
          ]
        );

        return {
          id: reportId,
          reportReference: reportRef,
          type,
          location: locDetail,
          zone,
          priority,
          status: 'reported',
          photoUrl,
          videoUrl,
        };
      });

      return res.status(201).json({
        success: true,
        reportId: result.id,
        data: result,
        message: 'Complaint submitted successfully and recorded in MySQL.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all reports submitted by the logged-in student
   */
  async getMyReports(req, res, next) {
    try {
      const user = req.session?.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No active session.',
        });
      }

      // Strictly filter by student's permanent database user ID
      const reports = await query(
        `SELECT id, category AS type, location AS location_detail, zone_name AS zone,
                status, priority, description, photo_url, video_url, created_at, resolved_at
         FROM leak_reports
         WHERE student_id = ?
         ORDER BY created_at DESC`,
        [user.id]
      );

      // Format for frontend MyReports.jsx
      const formatted = reports.map((r) => ({
        id: r.id,
        type: r.type,
        location: r.location_detail,
        zone: r.zone,
        status: r.status === 'reported' ? 'pending' : r.status, // Map to frontend 'pending'
        priority: r.priority,
        description: r.description,
        photo: r.photo_url,
        video: r.video_url,
        date: new Date(r.created_at).toISOString().split('T')[0],
      }));

      return res.json({
        success: true,
        reports: formatted,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get audit history/timeline for a specific report
   */
  async getReportHistory(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.session?.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No active session.',
        });
      }

      // Student ownership check: students can only view history of their own reports
      if (user.role === 'student') {
        const owner = await query(
          'SELECT student_id FROM leak_reports WHERE id = ?',
          [id]
        );
        if (owner.length === 0) {
          return res.status(404).json({ success: false, message: 'Report not found.' });
        }
        if (owner[0].student_id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are only authorized to view history for your own reports.',
          });
        }
      }

      const history = await query(
        `SELECT id, report_id, actor_name, action, previous_status, new_status, notes, created_at
         FROM report_history
         WHERE report_id = ?
         ORDER BY created_at ASC`,
        [id]
      );

      return res.json({
        success: true,
        history,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get authenticated student's profile
   */
  async getProfile(req, res, next) {
    try {
      const user = req.session?.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No active session.',
        });
      }

      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Profile management is restricted to students.',
        });
      }

      const rows = await query(
        `SELECT id, full_name, email, student_id, department, role, is_active, created_at, updated_at
         FROM users
         WHERE id = ? AND role = 'student'
         LIMIT 1`,
        [user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found.',
        });
      }

      const profile = rows[0];
      if (!profile.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Student account is inactive.',
        });
      }

      return res.json({
        success: true,
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          student_id: profile.student_id,
          email: profile.email,
          department: profile.department || '',
          role: profile.role,
          is_active: Boolean(profile.is_active),
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update authenticated student's profile (permitted fields: email, department)
   */
  async updateProfile(req, res, next) {
    try {
      const user = req.session?.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No active session.',
        });
      }

      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Profile management is restricted to students.',
        });
      }

      // Security check: reject attempts to tamper with protected fields
      const disallowedFields = ['id', 'student_id', 'role', 'password_hash', 'password', 'is_active', 'full_name'];
      const attemptedDisallowed = Object.keys(req.body).filter((field) => disallowedFields.includes(field));
      if (attemptedDisallowed.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Modification of protected identity fields (${attemptedDisallowed.join(', ')}) is strictly prohibited.`,
        });
      }

      const { email, department } = req.body;
      if (email === undefined && department === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one permitted field to update (email, department).',
        });
      }

      let cleanEmail = undefined;
      if (email !== undefined) {
        if (typeof email !== 'string') {
          return res.status(400).json({ success: false, message: 'Email must be a valid text string.' });
        }
        cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address (e.g., student@college.edu).',
          });
        }
        if (cleanEmail.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'Email address cannot exceed 100 characters.',
          });
        }

        // Check uniqueness across users table
        const existing = await query(
          'SELECT id FROM users WHERE LOWER(email) = ? AND id != ? LIMIT 1',
          [cleanEmail, user.id]
        );
        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'This email address is already assigned to another account.',
          });
        }
      }

      let cleanDept = undefined;
      if (department !== undefined) {
        if (typeof department !== 'string') {
          return res.status(400).json({ success: false, message: 'Department must be a valid text string.' });
        }
        cleanDept = department.trim();
        if (cleanDept.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'Department cannot exceed 100 characters.',
          });
        }
      }

      // Parameterized update
      await query(
        `UPDATE users 
         SET email = COALESCE(?, email),
             department = COALESCE(?, department),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND role = 'student'`,
        [cleanEmail !== undefined ? cleanEmail : null, cleanDept !== undefined ? cleanDept : null, user.id]
      );

      // Fetch fresh updated record
      const updatedRows = await query(
        `SELECT id, full_name, email, student_id, department, role, is_active, created_at, updated_at
         FROM users
         WHERE id = ? AND role = 'student'
         LIMIT 1`,
        [user.id]
      );

      const updated = updatedRows[0];

      // Keep active session in sync
      if (req.session.user) {
        if (cleanEmail !== undefined) req.session.user.email = cleanEmail;
        if (cleanDept !== undefined) req.session.user.department = cleanDept;
        req.session.save();
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        profile: {
          id: updated.id,
          full_name: updated.full_name,
          student_id: updated.student_id,
          email: updated.email,
          department: updated.department || '',
          role: updated.role,
          is_active: Boolean(updated.is_active),
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change Student Password
   */
  async changePassword(req, res, next) {
    try {
      const user = req.session?.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No active session.',
        });
      }

      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Password change is restricted to student accounts.',
        });
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password, new password, and confirmation password are all required.',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation password do not match.',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long.',
        });
      }

      if (newPassword.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'New password exceeds maximum length (128 characters).',
        });
      }

      // Fetch current password hash from database
      const rows = await query(
        'SELECT id, password_hash, is_active FROM users WHERE id = ? AND role = "student" LIMIT 1',
        [user.id]
      );

      if (rows.length === 0 || !rows[0].is_active) {
        return res.status(404).json({
          success: false,
          message: 'Student account not found or inactive.',
        });
      }

      const studentRecord = rows[0];

      // Verify current password
      const isCurrentValid = await bcrypt.compare(currentPassword, studentRecord.password_hash);
      if (!isCurrentValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      // Ensure new password is not identical to current
      const isSameAsCurrent = await bcrypt.compare(newPassword, studentRecord.password_hash);
      if (isSameAsCurrent) {
        return res.status(400).json({
          success: false,
          message: 'New password cannot be the same as your current password.',
        });
      }

      // Hash new password using bcrypt
      const newHash = await bcrypt.hash(newPassword, 10);

      // Update password_hash in database
      await query(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "student"',
        [newHash, user.id]
      );

      // Invalidate current session to require re-authentication
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('aquamanage_sid');
        res.clearCookie('connect.sid');
        return res.json({
          success: true,
          message: 'Password updated successfully. Please sign in again with your new password.',
        });
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reopen a previously resolved complaint (Feature 02)
   */
  async reopenReport(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = req.session?.user;

      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No active session.',
        });
      }

      if (user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only students can reopen complaints.',
        });
      }

      // Validate reason (10 to 500 chars)
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid reason for reopening the complaint.',
        });
      }

      const cleanReason = reason.trim();
      if (cleanReason.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Reopening reason must be at least 10 characters long explaining why the issue is not fixed.',
        });
      }

      if (cleanReason.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Reopening reason cannot exceed 500 characters.',
        });
      }

      const result = await withTransaction(async (conn) => {
        // Retrieve and lock report row
        const [rows] = await conn.query(
          'SELECT id, student_id, reporter_name, location, zone_name, status FROM leak_reports WHERE id = ? FOR UPDATE',
          [id]
        );

        if (rows.length === 0) {
          const err = new Error('Complaint not found.');
          err.statusCode = 404;
          throw err;
        }

        const report = rows[0];

        // Ownership validation: only original student reporter can reopen
        if (report.student_id !== user.id) {
          const err = new Error('Access denied: You are only authorized to reopen complaints submitted by your account.');
          err.statusCode = 403;
          throw err;
        }

        // Status validation: complaint must be currently 'resolved'
        if (report.status !== 'resolved') {
          const err = new Error(`Cannot reopen complaint. Only resolved complaints can be reopened (current status: "${report.status}").`);
          err.statusCode = 409;
          throw err;
        }

        // 1. Update report status to reopened and clear active assignment/resolution
        await conn.query(
          `UPDATE leak_reports
           SET status = 'reopened',
               assigned_to = NULL,
               assigned_name = NULL,
               assigned_at = NULL,
               resolved_at = NULL,
               updated_at = NOW()
           WHERE id = ?`,
          [id]
        );

        // 2. Insert audit event into report_history
        await conn.query(
          `INSERT INTO report_history (
             report_id, actor_id, actor_name, action, previous_status, new_status, notes
           ) VALUES (?, ?, ?, 'reopened', 'resolved', 'reopened', ?)`,
          [id, user.id, user.name || 'Student', cleanReason]
        );

        // 3. Create administrator alert
        await conn.query(
          `INSERT INTO alerts (type, icon, title, message, is_read, target_role)
           VALUES ('warning', 'AlertTriangle', ?, ?, FALSE, 'admin')`,
          [
            `Complaint ${id} Reopened`,
            `Complaint ${id} (${report.location}) was reopened by student ${user.name || 'Student'}. Reason: ${cleanReason.slice(0, 100)}`,
          ]
        );

        return {
          id,
          status: 'reopened',
          reopenedAt: new Date().toISOString(),
        };
      });

      return res.json({
        success: true,
        message: 'Complaint reopened successfully. It has returned to the administrator for review and reassignment.',
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

export default studentController;
