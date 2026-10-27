import apiClient from './apiClient';
import {
  tankData as mockTanks,
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

  },

  // ── 5. Fetch Student Profile ───────────────────────────────────────────────
  async getProfile() {
    try {
      const res = await apiClient.get('/student/profile');
      if (res && res.success) {
        return { success: true, profile: res.profile };
      }
      return { success: false, error: res?.message || 'Failed to load profile.' };
    } catch (err) {
      console.error('[studentService] getProfile error:', err.message);
      return { success: false, error: err.message || 'Unable to load student profile from server.' };
    }
  },

  // ── 6. Update Student Profile (email, department) ───────────────────────────
  async updateProfile(updates) {
    try {
      const res = await apiClient.patch('/student/profile', updates);
      if (res && res.success) {
        return { success: true, message: res.message, profile: res.profile };
      }
      return { success: false, error: res?.message || 'Failed to update profile.' };
    } catch (err) {
      console.error('[studentService] updateProfile error:', err.message);
      return { success: false, error: err.message || 'Unable to save profile updates.' };
    }
  },

  // ── 7. Change Student Password ─────────────────────────────────────────────
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    try {
      const res = await apiClient.post('/student/profile/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (res && res.success) {
        return { success: true, message: res.message };
      }
      return { success: false, error: res?.message || 'Failed to change password.' };
    } catch (err) {
      console.error('[studentService] changePassword error:', err.message);
      return { success: false, error: err.message || 'Unable to update password.' };
    }
  },

  // ── 7b. Upload Student Profile Picture ─────────────────────────────────────
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiClient.upload('/student/profile/avatar', formData);
      if (res && res.success) {
        return { success: true, message: res.message, avatar_url: res.avatar_url };
      }
      return { success: false, error: res?.message || 'Failed to upload profile picture.' };
    } catch (err) {
      console.error('[studentService] uploadAvatar error:', err.message);
      return { success: false, error: err.message || 'Unable to upload profile picture.' };
    }
  },

  // ── 7c. Remove Student Profile Picture ─────────────────────────────────────
  async deleteAvatar() {
    try {
      const res = await apiClient.delete('/student/profile/avatar');
      if (res && res.success) {
        return { success: true, message: res.message, avatar_url: null };
      }
      return { success: false, error: res?.message || 'Failed to remove profile picture.' };
    } catch (err) {
      console.error('[studentService] deleteAvatar error:', err.message);
      return { success: false, error: err.message || 'Unable to remove profile picture.' };
    }
  },

  // ── 8. Reopen a Resolved Complaint (Feature 02) ────────────────────────────
  async reopenReport(reportId, reason) {
    try {
      const res = await apiClient.post(`/student/reports/${reportId}/reopen`, {
        reason: reason?.trim(),
      });
      if (res && res.success) {
        return {
          success: true,
          message: res.message,
          data: res.data,
        };
      }
      return {
        success: false,
        error: res?.message || 'Failed to reopen complaint.',
      };
    } catch (err) {
      console.error('[studentService] reopenReport error:', err.message);
      return {
        success: false,
        error: err.message || 'Unable to reopen complaint. Please try again.',
      };
    }
  },

  // ── 9. Fetch Complaint Audit History ───────────────────────────────────────
  async getReportHistory(reportId) {
    try {
      const res = await apiClient.get(`/student/reports/${reportId}/history`);
      if (res && res.success) {
        return {
          success: true,
          history: res.history || [],
        };
      }
      return {
        success: false,
        error: res?.message || 'Failed to load report history.',
        history: [],
      };
    } catch (err) {
      console.error('[studentService] getReportHistory error:', err.message);
      return {
        success: false,
        error: err.message || 'Unable to load complaint history.',
        history: [],
      };
    }
  },
};

export default studentService;
