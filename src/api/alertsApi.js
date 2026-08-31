import { supabase, isSupabaseConfigured } from '../services/supabase';
import { alerts as initialAlerts } from '../data/mockData';

export const alertsApi = {
  /**
   * Get active alerts for current role
   */
  async getAlerts(userRole = 'student') {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('alerts').select('*');

        if (userRole && userRole !== 'admin') {
          query = query.or(`target_role.is.null,target_role.eq.${userRole}`);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

        if (error) throw error;
        if (data && data.length > 0) {
          return {
            success: true,
            alerts: data.map((a) => ({
              id: a.id,
              type: a.type,
              icon: a.icon || 'Droplets',
              title: a.title,
              message: a.message,
              time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: a.is_read,
            })),
          };
        }
      } catch (err) {
        console.warn('[alertsApi] getAlerts error:', err.message);
      }
    }

    return { success: true, alerts: initialAlerts };
  },

  /**
   * Mark alert as read
   */
  async markAsRead(alertId) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('alerts').update({ is_read: true }).eq('id', alertId);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  /**
   * Mark all alerts as read
   */
  async markAllAsRead() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },
};

export default alertsApi;
