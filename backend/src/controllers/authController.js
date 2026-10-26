import bcrypt from 'bcrypt';
import { query } from '../config/database.js';

export const authController = {
  /**
   * Universal Login Endpoint (Admin, Maintenance, Student)
   */
  async login(req, res, next) {
    try {
      const { role, username, password, name, irnNo, studentId, employeeId, email } = req.body;

      if (!role || !['admin', 'maintenance', 'student'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or missing user role (must be admin, maintenance, or student).',
        });
      }

      let user = null;

      // ── A. Admin Authentication ───────────────────────────────────────────
      if (role === 'admin') {
        const cleanEmail = (email || username || '').trim().toLowerCase();
        if (!cleanEmail || !password) {
          return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const users = await query(
          'SELECT * FROM users WHERE LOWER(email) = ? AND role = "admin" AND is_active = TRUE LIMIT 1',
          [cleanEmail]
        );

        if (users.length === 0) {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials or account inactive.' });
        }

        user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
      }

      // ── B. Maintenance Authentication ─────────────────────────────────────
      else if (role === 'maintenance') {
        const cleanEmpId = (employeeId || username || '').trim().toUpperCase();
        if (!cleanEmpId || !password) {
          return res.status(400).json({ success: false, message: 'Employee ID and password are required.' });
        }

        const users = await query(
          'SELECT * FROM users WHERE UPPER(employee_id) = ? AND role = "maintenance" AND is_active = TRUE LIMIT 1',
          [cleanEmpId]
        );

        if (users.length === 0) {
          return res.status(401).json({ success: false, message: 'Invalid maintenance employee ID or account inactive.' });
        }

        user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid employee ID or password.' });
        }
      }

      // ── C. Student Authentication ─────────────────────────────────────────
      else if (role === 'student') {
        const cleanStudentId = (studentId || irnNo || username || '').trim().toUpperCase();
        const cleanName = (name || cleanStudentId).trim();

        if (!cleanStudentId) {
          return res.status(400).json({ success: false, message: 'Student ID / IRN No. is required.' });
        }

        // Check if student exists in database
        const users = await query(
          'SELECT * FROM users WHERE (UPPER(student_id) = ? OR LOWER(email) = ?) AND role = "student" LIMIT 1',
          [cleanStudentId, `${cleanStudentId.toLowerCase()}@student.iiit.ac.in`]
        );

        if (users.length > 0) {
          user = users[0];
          // If password was provided, verify it; otherwise allow instant demo student login
          if (password) {
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
              return res.status(401).json({ success: false, message: 'Invalid student password.' });
            }
          }
        } else {
          // Dynamic student registration for college demo
          const defaultHash = await bcrypt.hash(password || 'Student@123', 10);
          const result = await query(
            `INSERT INTO users (full_name, email, student_id, password_hash, role)
             VALUES (?, ?, ?, ?, 'student')`,
            [cleanName || cleanStudentId, `${cleanStudentId.toLowerCase()}@student.iiit.ac.in`, cleanStudentId, defaultHash]
          );

          user = {
            id: result.insertId,
            full_name: cleanName || cleanStudentId,
            email: `${cleanStudentId.toLowerCase()}@student.iiit.ac.in`,
            student_id: cleanStudentId,
            employee_id: null,
            role: 'student',
          };
        }
      }

      // ── Establish Session ──────────────────────────────────────────────────
      const safeUserData = {
        id: user.id,
        name: user.full_name,
        role: user.role,
        email: user.email,
        student_id: user.student_id,
        employee_id: user.employee_id,
        username: user.email || user.employee_id || user.student_id,
      };

      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.user = safeUserData;
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          return res.json({
            success: true,
            user: safeUserData,
            data: safeUserData,
            message: `Successfully authenticated as ${user.role}.`,
          });
        });
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Current Session Profile
   */
  async getCurrentUser(req, res) {
    if (req.session && req.session.user) {
      return res.json({
        success: true,
        user: req.session.user,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'No active session.',
    });
  },

  /**
   * Logout Endpoint
   */
  async logout(req, res, next) {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('aquamanage_sid');
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: 'Logged out successfully.' });
      });
    } else {
      res.clearCookie('aquamanage_sid');
      return res.json({ success: true, message: 'Already logged out.' });
    }
  },
};

export default authController;
