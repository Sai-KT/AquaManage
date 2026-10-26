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
      const user = req.session.user;

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

      const reporterId = user?.id || null;
      const reporterName = user?.name || req.body.reporterName || 'Student';
      const locDetail = location || `${zone} — Campus Area`;

      const result = await withTransaction(async (conn) => {
        // 1. Determine next report ID (LK-XXX)
        const [maxRow] = await conn.query('SELECT COUNT(*) AS total FROM leak_reports');
        const nextNum = (maxRow[0]?.total || 0) + 1;
        const reportId = `LK-${String(nextNum).padStart(3, '0')}`;
        const reportRef = `REF-2026-${String(nextNum).padStart(3, '0')}`;

        // 2. Insert into leak_reports
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
      const user = req.session.user;
      const reports = await query(
        `SELECT id, category AS type, location AS location_detail, zone_name AS zone,
                status, priority, description, photo_url, video_url, created_at, resolved_at
         FROM leak_reports
         WHERE student_id = ? OR reporter_name = ?
         ORDER BY created_at DESC`,
        [user.id, user.name]
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
      const user = req.session.user;

      // Student ownership check: students can only view history of their own reports
      if (user.role === 'student') {
        const owner = await query(
          'SELECT student_id, reporter_name FROM leak_reports WHERE id = ?',
          [id]
        );
        if (owner.length === 0) {
          return res.status(404).json({ success: false, message: 'Report not found.' });
        }
        const isOwner =
          (owner[0].student_id && owner[0].student_id === user.id) ||
          (owner[0].reporter_name && owner[0].reporter_name.toLowerCase() === user.name.toLowerCase());
        if (!isOwner) {
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
};

export default studentController;
