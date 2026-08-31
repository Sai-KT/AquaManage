import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/tanks — List all water tanks
router.get('/', (req, res) => {
  try {
    const tanks = db.prepare('SELECT * FROM tanks ORDER BY id ASC').all();
    const summary = {
      totalCapacity: tanks.reduce((sum, t) => sum + t.capacity, 0),
      totalCurrent: tanks.reduce((sum, t) => sum + t.current, 0),
      criticalCount: tanks.filter(t => t.status === 'critical').length,
      warningCount: tanks.filter(t => t.status === 'warning').length,
    };
    res.json({ success: true, tanks, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tanks/:id
router.get('/:id', (req, res) => {
  try {
    const tank = db.prepare('SELECT * FROM tanks WHERE id = ?').get(req.params.id);
    if (!tank) return res.status(404).json({ success: false, error: 'Tank not found' });
    res.json({ success: true, tank });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tanks/:id/telemetry — Update water level in real time
router.post('/:id/telemetry', (req, res) => {
  const { current } = req.body;
  if (current === undefined || typeof current !== 'number') {
    return res.status(400).json({ success: false, error: 'Numeric current fill value is required.' });
  }

  try {
    const tank = db.prepare('SELECT * FROM tanks WHERE id = ?').get(req.params.id);
    if (!tank) return res.status(404).json({ success: false, error: 'Tank not found' });

    const pct = Math.round((current / tank.capacity) * 100);
    let newStatus = 'good';
    if (pct < 30) newStatus = 'critical';
    else if (pct < 60) newStatus = 'warning';

    db.prepare('UPDATE tanks SET current = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(Math.min(tank.capacity, Math.max(0, current)), newStatus, req.params.id);

    const updated = db.prepare('SELECT * FROM tanks WHERE id = ?').get(req.params.id);
    res.json({ success: true, tank: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
