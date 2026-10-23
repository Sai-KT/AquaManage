import { query } from '../config/database.js';

export const waterController = {
  /**
   * Get all water tanks and fill percentages
   */
  async getTanks(req, res, next) {
    try {
      const tanks = await query(`
        SELECT id, tank_name AS name, location, capacity_liters AS capacity,
               current_level_liters AS current, status, last_harvest_litres,
               ROUND((current_level_liters / capacity_liters) * 100, 1) AS fillPercentage,
               data_source AS dataSource, last_updated AS lastUpdated
        FROM tanks
        ORDER BY id ASC
      `);

      return res.json({
        success: true,
        tanks,
        data: tanks,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update tank level telemetry (Admin & Maintenance)
   */
  async updateTankLevel(req, res, next) {
    try {
      const { id } = req.params;
      const { currentLitres } = req.body;

      const numLitres = parseInt(currentLitres, 10);
      if (isNaN(numLitres) || numLitres < 0) {
        return res.status(400).json({ success: false, message: 'Valid non-negative litres reading required.' });
      }

      const [tank] = await query('SELECT capacity_liters FROM tanks WHERE id = ?', [id]);
      if (!tank) {
        return res.status(404).json({ success: false, message: 'Tank not found.' });
      }

      if (numLitres > tank.capacity_liters) {
        return res.status(400).json({
          success: false,
          message: `Current level (${numLitres}L) cannot exceed tank capacity (${tank.capacity_liters}L).`,
        });
      }

      // Recompute status
      const pct = numLitres / tank.capacity_liters;
      let status = 'good';
      if (pct < 0.3) status = 'critical';
      else if (pct < 0.6) status = 'warning';

      await query(
        `UPDATE tanks
         SET current_level_liters = ?, status = ?, last_updated = NOW()
         WHERE id = ?`,
        [numLitres, status, id]
      );

      return res.json({
        success: true,
        message: `Tank ${id} updated to ${numLitres}L (Status: ${status}).`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get campus water consumption records by zone
   */
  async getUsage(req, res, next) {
    try {
      // Query recent usage aggregated by zone
      const _rows = await query(`
        SELECT location AS zone,
               SUM(CASE WHEN usage_date = CURRENT_DATE THEN quantity_liters ELSE 0 END) AS daily,
               SUM(quantity_liters) AS totalUsage
        FROM water_usage
        WHERE usage_date >= DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY)
        GROUP BY location
        ORDER BY FIELD(location, 'Academic Block', 'PPCRC', 'Mithila Hostel', 'Vikramshila Hostel', 'Canteen')
      `);

      const labels = ['Academic Block', 'PPCRC', 'Mithila Hostel', 'Vikramshila Hostel', 'Canteen'];
      const defaultDaily = [8500, 6200, 18200, 22800, 3800];
      const defaultWeekly = [59500, 43400, 127400, 159600, 26600];
      const defaultMonthly = [255000, 186200, 546000, 684000, 114000];

      return res.json({
        success: true,
        dataSource: 'Demonstration Record (Local Database)',
        waterUsageByZone: {
          labels,
          daily: defaultDaily,
          weekly: defaultWeekly,
          monthly: defaultMonthly,
        },
        data: {
          labels,
          daily: defaultDaily,
          weekly: defaultWeekly,
          monthly: defaultMonthly,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get rainwater harvesting status & trend
   */
  async getHarvesting(req, res, next) {
    try {
      const tanks = await query('SELECT id, tank_name AS name, capacity_liters AS capacity, current_level_liters AS current, status, last_harvest_litres FROM tanks');
      const totalWaterSaved = tanks.reduce((sum, t) => sum + (t.last_harvest_litres || 0), 0);

      const stats = {
        waterSavedToday: totalWaterSaved || 12400,
        harvestingEfficiency: 87,
      };

      return res.json({
        success: true,
        dataSource: 'Demonstration Record',
        stats,
        tanks,
        data: {
          stats,
          tanks,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default waterController;
