import { supabase, isSupabaseConfigured } from '../services/supabase';
import { validation } from './validation';
import { authorization } from './authorization';
import { initialMaintenanceTasks, pastActivityLogs } from '../data/mockData';

export const maintenanceApi = {
  /**
   * Get maintenance assigned tasks
   */
  async getTasks(user) {
    const auth = authorization.requireRole(user, ['maintenance', 'admin']);
    if (!auth.authorized) return { success: false, error: auth.error };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('leak_reports')
          .select('*, work_logs(*)')
          .order('priority', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          return { success: true, tasks: data };
        }
      } catch (err) {
        console.warn('[maintenanceApi] getTasks error:', err.message);
      }
    }

    return { success: true, tasks: initialMaintenanceTasks };
  },

  /**
   * Add a maintenance work log note
   */
  async addWorkLog({ reportId, note, technicianName, user }) {
    const auth = authorization.requireRole(user, ['maintenance', 'admin']);
    if (!auth.authorized) return { success: false, error: auth.error };

    const val = validation.workLog({ reportId, note, technicianName });
    if (!val.isValid) return { success: false, error: val.errorMessage };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          report_id: reportId,
          note: note.trim(),
          technician_name: technicianName || user?.name || 'Technician',
          technician_id: user?.id?.length > 20 ? user.id : null,
        };

        const { data, error } = await supabase
          .from('work_logs')
          .insert([payload])
          .select('*')
          .single();

        if (error) throw error;

        // Also update report updated_at
        await supabase
          .from('leak_reports')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', reportId);

        return { success: true, workLog: data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return {
      success: true,
      workLog: {
        id: Date.now(),
        report_id: reportId,
        note,
        technician_name: technicianName || user?.name || 'Technician',
        created_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Fetch recent maintenance activity logs
   */
  async getActivityLogs() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('work_logs')
          .select('*, leak_reports(type, location_detail)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        if (data) return { success: true, logs: data };
      } catch (err) {
        console.warn('[maintenanceApi] getActivityLogs error:', err.message);
      }
    }

    return { success: true, logs: pastActivityLogs };
  },
};

export default maintenanceApi;
