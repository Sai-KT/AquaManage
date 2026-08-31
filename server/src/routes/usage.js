import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/usage/zones
router.get('/zones', (req, res) => {
  try {
    const rows = db.prepare('SELECT zone, daily, weekly, monthly FROM zone_usage').all();
    const labels = rows.map(r => r.zone);
    const daily = rows.map(r => r.daily);
    const weekly = rows.map(r => r.weekly);
    const monthly = rows.map(r => r.monthly);

    res.json({
      success: true,
      data: {
        labels,
        daily,
        weekly,
        monthly,
      },
      hourlyPattern: {
        labels: ['5am','7am','9am','11am','1pm','3pm','5pm','7pm','9pm','11pm'],
        data: [480, 1200, 3800, 4200, 5100, 3600, 4800, 6200, 3400, 820],
      },
      analytics: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        usage: [620000, 580000, 710000, 850000, 790000, 730000, 840000],
        harvested: [220000, 185000, 310000, 420000, 380000, 295000, 340000],
        leaksReported: [8, 5, 12, 9, 14, 11, 7],
        leaksResolved: [6, 5, 10, 8, 12, 10, 5],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
