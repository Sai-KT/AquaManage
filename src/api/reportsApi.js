import { supabase, isSupabaseConfigured } from '../services/supabase';
import { validation } from './validation';
import { authorization } from './authorization';
import { myReports, recentReports } from '../data/mockData';

export const reportsApi = {
  /**
   * Create a new complaint / leak report
   */
  async createReport({ type, zone, location, description, photoUrl, videoUrl, user }) {
    const val = validation.complaintReport({ type, zone, location, description });
    if (!val.isValid) {
      return { success: false, error: val.errorMessage };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const verifiedUser = authData?.user;

        let priority = 'medium';
        if (type === 'Pipe Burst') priority = 'critical';
        else if (type === 'Pipe Leak' || type === 'Overflow') priority = 'high';
        else if (type === 'Tap Wastage') priority = 'medium';
        else priority = 'low';

        let zoneId = zone.toLowerCase().replace(/[^a-z0-9]/g, '');
        const { data: zoneData } = await supabase
          .from('campus_zones')
          .select('id')
          .ilike('name', zone)
          .maybeSingle();
        if (zoneData?.id) zoneId = zoneData.id;

        const payload = {
          type,
          zone_id: zoneId,
          location_detail: location || `${zone} — Campus Area`,
          description: description.trim(),
          reporter_name: verifiedUser?.user_metadata?.name || user?.name || 'Student',
          reporter_id: verifiedUser?.id || (user?.id?.length > 20 ? user.id : null),
          photo_url: photoUrl || null,
          video_url: videoUrl || null,
          status: 'pending',
          priority,
        };

        const { data, error } = await supabase
          .from('leak_reports')
          .insert([payload])
          .select('*')
          .single();

        if (error) throw error;

        return { success: true, report: data, reportId: data.id };
      } catch (err) {
        console.warn('[reportsApi] createReport database error:', err.message);
        return { success: false, error: err.message };
      }
    }

    const fallbackId = `LK-0${Math.floor(10 + Math.random() * 90)}`;
    return {
      success: true,
      reportId: fallbackId,
      report: { id: fallbackId, type, zone, location, description, status: 'pending' },
    };
  },

  /**
   * Get all reports (Admin & Maintenance)
   */
  async getAllReports(user, filters = {}) {
    const auth = authorization.requireRole(user, ['admin', 'maintenance']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('leak_reports').select('*, campus_zones(name)');

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.priority && filters.priority !== 'all') {
          query = query.eq('priority', filters.priority);
        }
        if (filters.assignedTo) {
          query = query.eq('assigned_to', filters.assignedTo);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        return { success: true, reports: data };
      } catch (err) {
        console.warn('[reportsApi] getAllReports error:', err.message);
      }
    }

    return { success: true, reports: recentReports };
  },

  /**
   * Get reports submitted by current student
   */
  async getStudentReports(user) {
    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const verifiedUser = authData?.user;

        let query = supabase.from('leak_reports').select('*');

        if (verifiedUser?.id) {
          query = query.or(`reporter_id.eq.${verifiedUser.id},reporter_name.eq.${verifiedUser.user_metadata?.name || user.name}`);
        } else if (user.name) {
          query = query.ilike('reporter_name', `%${user.name}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        return { success: true, reports: data };
      } catch (err) {
        console.warn('[reportsApi] getStudentReports error:', err.message);
      }
    }

    return { success: true, reports: myReports };
  },

  /**
   * Update report status (Maintenance & Admin)
   */
  async updateReportStatus({ reportId, status, user }) {
    const auth = authorization.requireRole(user, ['admin', 'maintenance']);
    if (!auth.authorized) return { success: false, error: auth.error };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = { status, updated_at: new Date().toISOString() };
        if (status === 'resolved') {
          payload.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('leak_reports')
          .update(payload)
          .eq('id', reportId)
          .select('*')
          .single();

        if (error) throw error;
        return { success: true, report: data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, message: `Report ${reportId} marked as ${status}.` };
  },
};

export default reportsApi;
