import apiClient from './apiClient';
import { maintenanceTasks as mockTasks } from '../data/mockData';

export const maintenanceService = {
  // ── 1. Fetch Assigned Tasks for Maintenance Staff ─────────────────────────
  async getAssignedTasks(_user) {
    try {
      const res = await apiClient.get('/maintenance/tasks');
      if (res && res.success && res.tasks) {
        return { success: true, tasks: res.tasks };
      }
    } catch (err) {
      console.warn('[maintenanceService] getAssignedTasks API unavailable, using fallback:', err.message);
    }

    return { success: true, tasks: mockTasks };
  },

  // ── 2. Fetch Completed/Resolved Tasks ─────────────────────────────────────
  async getCompletedTasks(_user) {
    try {
      const res = await apiClient.get('/maintenance/completed');
      if (res && res.success && res.tasks) {
        return { success: true, tasks: res.tasks };
      }
    } catch (err) {
      console.warn('[maintenanceService] getCompletedTasks error:', err.message);
    }

    return { success: true, tasks: [] };
  },

  // ── 3. Update Maintenance Status ──────────────────────────────────────────
  async updateStatus(reportId, newStatus, _user) {
    try {
      const res = await apiClient.patch(`/maintenance/tasks/${reportId}/status`, {
        status: newStatus,
      });
      return { success: true, data: res };
    } catch (err) {
      console.error('[maintenanceService] updateStatus error:', err);
      return { success: false, error: err.message };
    }
  },

  // ── 4. Add Progress Note to Work Log ──────────────────────────────────────
  async addWorkLogNote(reportId, note, _user) {
    if (!note || !note.trim()) {
      return { success: false, error: 'Note cannot be empty.' };
    }

    try {
      const res = await apiClient.post(`/maintenance/tasks/${reportId}/logs`, {
        note: note.trim(),
      });
      return { success: true, workLog: res.workLog };
    } catch (err) {
      console.error('[maintenanceService] addWorkLogNote error:', err);
      return { success: false, error: err.message };
    }
  },
};

export default maintenanceService;
