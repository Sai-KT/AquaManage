import { supabase, isSupabaseConfigured } from '../services/supabase';
import { validation } from './validation';
import { authorization } from './authorization';
import { initialMaintenanceStaff, zoneData } from '../data/mockData';

export const adminApi = {
  /**
   * Assign a complaint ticket to a maintenance technician
   */
  async assignTicket({ reportId, technicianId, technicianName, user }) {
    const auth = authorization.requireRole(user, ['admin']);
    if (!auth.authorized) return { success: false, error: auth.error };

    const val = validation.ticketAssignment({ reportId, assignedName: technicianName });
    if (!val.isValid) return { success: false, error: val.errorMessage };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('leak_reports')
          .update({
            assigned_to: technicianId && technicianId.length > 20 ? technicianId : null,
            assigned_name: technicianName,
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId)
          .select('*')
          .single();

        if (error) throw error;

        // Log work log entry for assignment
        await supabase.from('work_logs').insert([{
          report_id: reportId,
          note: `Assigned to ${technicianName} by Admin`,
          technician_name: technicianName,
        }]);

        return { success: true, report: data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, message: `Ticket ${reportId} assigned to ${technicianName}.` };
  },

  /**
   * Get all maintenance staff members
   */
  async getStaff(user) {
    const auth = authorization.requireRole(user, ['admin']);
    if (!auth.authorized) return { success: false, error: auth.error };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'maintenance')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          return { success: true, staff: data };
        }
      } catch (err) {
        console.warn('[adminApi] getStaff error:', err.message);
      }
    }

    return { success: true, staff: initialMaintenanceStaff };
  },

  /**
   * Get all campus zones
   */
  async getZones() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('campus_zones')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) return { success: true, zones: data };
      } catch (err) {
        console.warn('[adminApi] getZones error:', err.message);
      }
    }
    return { success: true, zones: zoneData };
  },
};

export default adminApi;
