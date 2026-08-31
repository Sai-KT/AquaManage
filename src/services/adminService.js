import { supabase, isSupabaseConfigured } from './supabase';
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
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Fetch counts from leak_reports
        const { data: allReports } = await supabase
          .from('leak_reports')
          .select('id, status, priority, created_at');

        const reportsList = allReports || [];
        const activeLeaks = reportsList.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
        const pendingIssues = reportsList.filter(r => r.status === 'pending').length;
        const resolvedIssues = reportsList.filter(r => r.status === 'resolved').length;

        // 2. Fetch tanks
        const { data: tanks } = await supabase
          .from('tanks')
          .select('*')
          .order('id', { ascending: true });

        // 3. Fetch latest harvesting log
        const { data: harvestLog } = await supabase
          .from('harvesting_logs')
          .select('*')
          .order('record_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 4. Fetch unread alerts count
        const { count: unreadAlertsCount } = await supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);

        const stats = {
          activeLeaks: activeLeaks || mockStats.activeLeaks,
          waterSavedToday: harvestLog?.litres_collected || mockStats.waterSavedToday,
          alertsToday: unreadAlertsCount ?? mockStats.alertsToday,
          resolvedIssues: resolvedIssues || mockStats.resolvedIssues,
          pendingIssues: pendingIssues || mockStats.pendingIssues,
          harvestingEfficiency: harvestLog?.efficiency_percentage || mockStats.harvestingEfficiency,
        };

        const formattedTanks = (tanks || []).map(t => ({
          id: t.id,
          name: t.name,
          capacity: t.capacity_litres,
          current: t.current_litres,
          status: t.status,
        }));

        return {
          success: true,
          stats,
          tanks: formattedTanks.length > 0 ? formattedTanks : mockTanks,
          harvestingTrend: mockTrend,
          waterUsageByZone: mockZones,
        };
      } catch (err) {
        console.warn('[adminService] getDashboardOverview failed, using fallback:', err.message);
      }
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
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('leak_reports')
          .select('*, campus_zones(name)')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(r => ({
            id: r.id,
            type: r.type,
            location: r.location_detail,
            zone: r.campus_zones?.name || r.zone_id || 'Academic Block',
            reporter: r.reporter_name || 'Student',
            status: r.status,
            priority: r.priority,
            description: r.description,
            assignedTo: r.assigned_name || null,
            photo: r.photo_url,
            video: r.video_url,
            date: new Date(r.created_at).toISOString().split('T')[0],
          }));
          return { success: true, reports: formatted };
        }
      } catch (err) {
        console.warn('[adminService] getLeakReports error:', err.message);
      }
    }

    return { success: true, reports: mockReports };
  },

  // ── 3. Update Report Status ───────────────────────────────────────────────
  async updateReportStatus(reportId, newStatus) {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        if (newStatus === 'resolved') {
          payload.resolved_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('leak_reports')
          .update(payload)
          .eq('id', reportId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // ── 4. Assign Report to Staff ─────────────────────────────────────────────
  async assignReport(reportId, technicianName) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('leak_reports')
          .update({
            assigned_name: technicianName,
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        if (error) throw error;

        // Log work log entry
        await supabase.from('work_logs').insert([{
          report_id: reportId,
          note: `Assigned to ${technicianName} by Admin`,
          technician_name: technicianName,
        }]);

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // ── 5. Alerts & Notifications ─────────────────────────────────────────────
  async getAlerts() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;
        if (data && data.length > 0) {
          return {
            success: true,
            alerts: data.map(a => ({
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
        console.warn('[adminService] getAlerts error:', err.message);
      }
    }

    return { success: true, alerts: mockAlerts };
  },

  // ── 6. Maintenance Staff ──────────────────────────────────────────────────
  async getMaintenanceStaff() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'maintenance')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          return { success: true, staff: data.map(s => s.name) };
        }
      } catch (err) {
        console.warn('[adminService] getMaintenanceStaff error:', err.message);
      }
    }

    return { success: true, staff: ['Ram Kumar', 'Suresh Babu', 'Mohan Das', 'Vijay Patil', 'Anil Sharma'] };
  },

  // ── 7. Registered Students & Users ────────────────────────────────────────
  async getStudents() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) return { success: true, students: data };
      } catch (err) {
        console.warn('[adminService] getStudents error:', err.message);
      }
    }

    return { success: true, students: [] };
  },
};

export default adminService;
