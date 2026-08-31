import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/alerts — List all alerts
router.get('/', (req, res) => {
  try {
    const alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
    const formatted = alerts.map(a => ({
      ...a,
      read: Boolean(a.is_read),
    }));
    res.json({ success: true, alerts: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/alerts/:id/read — Mark single alert as read
router.patch('/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts/mark-all-read — Mark all alerts as read
router.post('/mark-all-read', (req, res) => {
  try {
    db.prepare('UPDATE alerts SET is_read = 1').run();
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
