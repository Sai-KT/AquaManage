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
               r.video_url AS video, r.created_at, r.resolved_at,
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

      const formatted = reports.map((r) => ({
        ...r,
        status: r.status === 'reported' ? 'pending' : r.status,
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
};

export default adminController;
