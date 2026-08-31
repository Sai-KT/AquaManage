import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure Multer storage for image & video uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// GET /api/reports — List all reports with optional filters
router.get('/', (req, res) => {
  const { status, zone, priority, search } = req.query;
  let query = 'SELECT * FROM leak_reports WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (zone && zone !== 'all') {
    query += ' AND zone = ?';
    params.push(zone);
  }
  if (priority && priority !== 'all') {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (search) {
    query += ' AND (id LIKE ? OR type LIKE ? OR location LIKE ? OR reporter LIKE ? OR description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const reports = db.prepare(query).all(...params);
    // Attach work logs to each report
    const getLogs = db.prepare('SELECT note, created_at FROM work_logs WHERE report_id = ? ORDER BY created_at ASC');
    const enriched = reports.map(r => ({
      ...r,
      workLog: getLogs.all(r.id).map(l => l.note),
    }));

    res.json({ success: true, reports: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/:id — Single report with full work logs
router.get('/:id', (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM leak_reports WHERE id = ?').get(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    const logs = db.prepare('SELECT id, note, created_at FROM work_logs WHERE report_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ success: true, report: { ...report, workLogs: logs } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports — Create a new leak report (Supports multipart or JSON)
router.post('/', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
  const { type, location, zone, reporter, description, priority } = req.body;

  if (!type || !zone || !description) {
    return res.status(400).json({ success: false, error: 'Type, zone, and description are required fields.' });
  }

  try {
    // Generate next report ID
    const countResult = db.prepare('SELECT COUNT(*) as count FROM leak_reports').get();
    const nextNum = (countResult.count + 1).toString().padStart(3, '0');
    const id = `LK-${nextNum}`;
    const today = new Date().toISOString().split('T')[0];

    const photoUrl = req.files?.photo?.[0] ? `/uploads/${req.files.photo[0].filename}` : null;
    const videoUrl = req.files?.video?.[0] ? `/uploads/${req.files.video[0].filename}` : null;

    db.prepare(`
      INSERT INTO leak_reports (id, type, location, zone, reporter, date, status, priority, description, photo_url, video_url)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).run(
      id,
      type,
      location || `${zone} — Campus Area`,
      zone,
      reporter || 'Student',
      today,
      priority || 'medium',
      description,
      photoUrl,
      videoUrl
    );

    // Create an automated alert for the new leak report
    db.prepare(`
      INSERT INTO alerts (type, icon, title, message, time_ago, is_read)
      VALUES (?, ?, ?, ?, 'Just now', 0)
    `).run(
      priority === 'critical' ? 'critical' : 'warning',
      priority === 'critical' ? 'AlertTriangle' : 'Droplets',
      `New Report: ${id} (${type})`,
      `${description.slice(0, 80)}... Location: ${location || zone}`
    );

    res.status(201).json({
      success: true,
      report: {
        id,
        type,
        location: location || `${zone} — Campus Area`,
        zone,
        reporter: reporter || 'Student',
        date: today,
        status: 'pending',
        priority: priority || 'medium',
        description,
        photo_url: photoUrl,
        video_url: videoUrl,
        workLog: [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/reports/:id — Update status, priority, or assignee
router.patch('/:id', (req, res) => {
  const { status, priority, assigned_to } = req.body;
  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (priority) {
    updates.push('priority = ?');
    params.push(priority);
  }
  if (assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    params.push(assigned_to);
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update.' });
  }

  params.push(req.params.id);

  try {
    const result = db.prepare(`UPDATE leak_reports SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    const updated = db.prepare('SELECT * FROM leak_reports WHERE id = ?').get(req.params.id);
    res.json({ success: true, report: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/:id/work-log — Add a maintenance work log note
router.post('/:id/work-log', (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({ success: false, error: 'Work log note cannot be empty.' });
  }

  try {
    db.prepare('INSERT INTO work_logs (report_id, note) VALUES (?, ?)').run(req.params.id, note.trim());
    const logs = db.prepare('SELECT note FROM work_logs WHERE report_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ success: true, workLog: logs.map(l => l.note) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
