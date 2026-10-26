import apiClient from './apiClient';
import {
  tankData as mockTanks,
  campusStats as mockStats,
  campusZones as mockZones,
} from '../data/mockData';

export const studentService = {
  // ── 1. Fetch Campus Zones ──────────────────────────────────────────────────
  async getCampusZones() {
    return { success: true, data: mockZones };
  },

  // ── 2. Submit Leak Incident Report ─────────────────────────────────────────
  async submitReport({ type, zone, location, description, photoFile, videoFile, user }) {
    if (!type || !zone || !description || description.trim().length < 10) {
      return {
        success: false,
        error: 'Please provide a valid issue type, campus zone, and description of at least 10 characters.',
      };
    }

    try {
      // Prepare multipart form data for file uploads
      const formData = new FormData();
      formData.append('type', type);
      formData.append('zone', zone);
      formData.append('location', location || `${zone} — Campus Area`);
      formData.append('description', description.trim());
      formData.append('reporterName', user?.name || 'Student');
      formData.append('reporterId', user?.id || '');

      if (photoFile) {
        formData.append('photo', photoFile);
      }
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const res = await apiClient.upload('/student/reports', formData);

      if (res && res.success) {
        return {
          success: true,
          reportId: res.reportId,
          data: res.data,
        };
      }

      return {
        success: false,
        error: res?.message || 'Failed to submit complaint.',
      };
    } catch (err) {
      console.error('[studentService] submitReport error:', err);
      return {
        success: false,
        error: err.message || 'Error communicating with local server.',
      };
    }
  },

  // ── 3. Fetch Student's Submitted Reports ────────────────────────────────────
  async getMyReports(_user) {
    try {
      const res = await apiClient.get('/student/reports');
      if (res && res.success) {
        return { success: true, reports: res.reports || [] };
      }
      return { success: false, error: res?.message || 'Failed to load reports', reports: [] };
    } catch (err) {
      console.error('[studentService] getMyReports error:', err.message);
      return { success: false, error: err.message || 'Unable to load reports from server.', reports: [] };
    }
  },

  // ── 4. Fetch Rainwater Harvesting Status & Tank Levels ─────────────────────
  async getHarvestingStatus() {
    try {
      const res = await apiClient.get('/water/harvesting');
      if (res && res.success) {
        const formattedTanks = (res.tanks || []).map((t) => ({
          id: t.id,
          name: t.name || t.tank_name,
          capacity: t.capacity || t.capacity_liters,
          current: t.current || t.current_level_liters,
          status: t.status,
        }));

        const totalCapacity = formattedTanks.reduce((s, t) => s + t.capacity, 0);
        const totalCurrent = formattedTanks.reduce((s, t) => s + t.current, 0);

        return {
          success: true,
          tanks: formattedTanks.length > 0 ? formattedTanks : mockTanks,
          stats: {
            ...res.stats,
            totalCapacity,
            totalCurrent,
          },
        };
      }
    } catch (err) {
      console.warn('[studentService] getHarvestingStatus error:', err.message);
    }

    return {
      success: true,
      tanks: mockTanks,
      stats: mockStats,
    };
  },
};

export default studentService;
