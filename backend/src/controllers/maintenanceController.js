import { query, withTransaction } from '../config/database.js';

export const maintenanceController = {
  /**
   * Get active tasks assigned to the maintenance technician
   */
  async getAssignedTasks(req, res, next) {
    try {
      const user = req.session.user;

      const tasks = await query(
        `SELECT r.id, r.category AS type, r.location, r.zone_name AS zone,
                r.priority, r.status, r.description, r.reporter_name AS reporter,
                r.photo_url AS photo, r.video_url AS video, r.created_at
         FROM leak_reports r
         WHERE r.status != 'resolved'
           AND (r.assigned_to = ? OR r.assigned_name LIKE ? OR r.assigned_to IS NULL)
         ORDER BY FIELD(r.priority, 'critical', 'high', 'medium', 'low'), r.created_at ASC`,
        [user.id, `%${user.name}%`]
      );

      // Fetch work logs for each task
      const reportIds = tasks.map((t) => t.id);
      let logsByReport = {};

      if (reportIds.length > 0) {
        const placeholders = reportIds.map(() => '?').join(',');
        const logs = await query(
          `SELECT report_id, actor_name, notes, created_at
           FROM report_history
           WHERE report_id IN (${placeholders})
           ORDER BY created_at ASC`,
          reportIds
        );

        for (const log of logs) {
          if (!logsByReport[log.report_id]) logsByReport[log.report_id] = [];
          const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          logsByReport[log.report_id].push(`${log.notes} (${log.actor_name}, ${time})`);
        }
      }

      const formatted = tasks.map((t) => ({
        id: t.id,
        type: t.type,
        location: t.location,
        zone: t.zone,
        priority: t.priority,
        status: t.status === 'reported' ? 'pending' : t.status,
        description: t.description,
        reporter: t.reporter || 'Student',
        date: new Date(t.created_at).toISOString().split('T')[0],
        photo: t.photo,
        video: t.video,
        workLog: logsByReport[t.id] || [],
      }));

      return res.json({
        success: true,
        tasks: formatted,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get resolved / completed tasks history
   */
  async getCompletedTasks(req, res, next) {
    try {
      const user = req.session.user;

      const completed = await query(
        `SELECT r.id, r.category AS type, r.location, r.photo_url AS photo,
                r.video_url AS video, r.created_at, r.resolved_at
         FROM leak_reports r
         WHERE r.status = 'resolved'
           AND (r.assigned_to = ? OR r.assigned_name LIKE ? OR ? = 'admin')
         ORDER BY r.resolved_at DESC
         LIMIT 30`,
        [user.id, `%${user.name}%`, user.role]
      );

      // Fetch latest note for each resolved task
      const formatted = await Promise.all(
        completed.map(async (r) => {
          const lastLog = await query(
            'SELECT notes FROM report_history WHERE report_id = ? ORDER BY created_at DESC LIMIT 1',
            [r.id]
          );
          return {
            id: r.id,
            type: r.type,
            location: r.location,
            date: new Date(r.created_at).toISOString().split('T')[0],
            resolvedDate: r.resolved_at ? new Date(r.resolved_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            workDone: lastLog[0]?.notes || 'Issue resolved and verified by maintenance staff.',
            photo: r.photo,
            video: r.video,
          };
        })
      );

      return res.json({
        success: true,
        tasks: formatted,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update maintenance task status (in_progress, resolved)
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const techUser = req.session.user;

      const validTransitions = ['in_progress', 'resolved', 'pending'];
      if (!validTransitions.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status requested.' });
      }

      await withTransaction(async (conn) => {
        let sql = `
          UPDATE leak_reports
          SET status = ?,
              updated_at = NOW()
        `;
        const params = [status];

        if (status === 'resolved') {
          sql += ', resolved_at = NOW()';
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await conn.query(sql, params);

        // Record work log in audit history
        await conn.query(
          `INSERT INTO report_history (
             report_id, actor_id, actor_name, action, new_status, notes
           ) VALUES (?, ?, ?, 'status_update', ?, ?)`,
          [id, techUser.id, techUser.name, status, `Status updated to ${status.replace('_', ' ')} by ${techUser.name}`]
        );

        if (status === 'resolved') {
          await conn.query(
            `INSERT INTO alerts (type, icon, title, message, target_role)
             VALUES ('info', 'CheckCircle', ?, ?, 'admin')`,
            [`Issue ${id} Resolved`, `Issue ${id} was marked resolved by ${techUser.name}.`]
          );
        }
      });

      return res.json({
        success: true,
        data: { id, status },
        message: `Task ${id} status successfully updated to ${status}.`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add a technician progress note to the work log
   */
  async addWorkLog(req, res, next) {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const techUser = req.session.user;

      if (!note || !note.trim()) {
        return res.status(400).json({ success: false, message: 'Work log note cannot be empty.' });
      }

      const log = await withTransaction(async (conn) => {
        const [insertRes] = await conn.query(
          `INSERT INTO report_history (
             report_id, actor_id, actor_name, action, notes
           ) VALUES (?, ?, ?, 'work_note', ?)`,
          [id, techUser.id, techUser.name, note.trim()]
        );

        await conn.query('UPDATE leak_reports SET updated_at = NOW() WHERE id = ?', [id]);

        return {
          id: insertRes.insertId,
          reportId: id,
          note: note.trim(),
          technicianName: techUser.name,
          createdAt: new Date().toISOString(),
        };
      });

      return res.status(201).json({
        success: true,
        workLog: log,
        message: 'Work note added to report history.',
      });
    } catch (error) {
      next(error);
    }
  },
};

export default maintenanceController;
