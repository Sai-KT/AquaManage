import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/harvesting/summary
router.get('/summary', (req, res) => {
  try {
    const tanks = db.prepare('SELECT capacity, current FROM tanks').all();
    const totalCap = tanks.reduce((s, t) => s + t.capacity, 0);
    const totalCur = tanks.reduce((s, t) => s + t.current, 0);

    res.json({
      success: true,
      summary: {
        waterSavedToday: 12400,
        harvestingEfficiency: 87,
        avgTankFill: Math.round((totalCur / totalCap) * 100),
        monthlyTotal: 340000,
        totalCapacity: totalCap,
        totalCurrent: totalCur,
      },
      weeklyTrend: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        collected: [8200, 9400, 7800, 11200, 12400, 10800, 9600],
        target: [10000, 10000, 10000, 10000, 10000, 10000, 10000],
      },
      monthlyTrend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        collected: [220000, 185000, 310000, 420000, 380000, 295000, 340000],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
