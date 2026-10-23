import apiClient from './apiClient';
import {
  campusStats as mockStats,
  tankData as mockTanks,
  harvestingTrend as mockTrend,
  waterUsageByZone as mockZones,
  leakReports as mockReports,
  alerts as mockAlerts,
} from '../data/mockData';

export const adminService = {
  // ── 1. Dashboard Overview Stats ─────────────────────────────────────────────
  async getDashboardOverview() {
    try {
      const res = await apiClient.get('/dashboard/stats');
      if (res && res.success && res.stats) {
        return {
          success: true,
          stats: res.stats,
          tanks: res.tanks && res.tanks.length > 0 ? res.tanks : mockTanks,
          harvestingTrend: mockTrend,
          waterUsageByZone: mockZones,
        };
      }
    } catch (err) {
      console.warn('[adminService] getDashboardOverview API failed, using fallback:', err.message);
    }

    return {
      success: true,
      stats: mockStats,
      tanks: mockTanks,
      harvestingTrend: mockTrend,
      waterUsageByZone: mockZones,
    };
  },

  // ── 2. All Leak Reports ───────────────────────────────────────────────────
  async getLeakReports() {
    try {
      const res = await apiClient.get('/admin/reports');
      if (res && res.success && res.reports) {
        return { success: true, reports: res.reports };
      }
    } catch (err) {
      console.warn('[adminService] getLeakReports API failed, using fallback:', err.message);
    }

    return { success: true, reports: mockReports };
  },

  // ── 3. Update Report Status ───────────────────────────────────────────────
  async updateReportStatus(reportId, newStatus) {
    try {
      const res = await apiClient.patch(`/admin/reports/${reportId}/status`, {
        status: newStatus,
      });
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── 4. Assign Report to Staff ─────────────────────────────────────────────
  async assignReport(reportId, technicianName) {
    try {
      const res = await apiClient.patch(`/admin/reports/${reportId}/assign`, {
        technicianName,
      });
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── 5. Alerts & Notifications ─────────────────────────────────────────────
  async getAlerts() {
    try {
      const res = await apiClient.get('/admin/alerts');
      if (res && res.success && res.alerts) {
        return { success: true, alerts: res.alerts };
      }
    } catch (err) {
      console.warn('[adminService] getAlerts API failed, using fallback:', err.message);
    }

    return { success: true, alerts: mockAlerts };
  },

  async markAllAlertsRead() {
    try {
      await apiClient.patch('/admin/alerts/mark-read');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ── 6. Maintenance Staff ──────────────────────────────────────────────────
  async getMaintenanceStaff() {
    try {
      const res = await apiClient.get('/admin/maintenance-staff');
      if (res && res.success && res.staff) {
        return { success: true, staff: res.staff };
      }
    } catch (err) {
      console.warn('[adminService] getMaintenanceStaff API failed, using fallback:', err.message);
    }

    return { success: true, staff: ['Ram Kumar', 'Suresh Babu', 'Mohan Das', 'Vijay Patil', 'Anil Sharma'] };
  },

  // ── 7. Registered Students & Users ────────────────────────────────────────
  async getStudents() {
    return { success: true, students: [] };
  },
};

export default adminService;
