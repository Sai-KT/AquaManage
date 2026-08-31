import { supabase, isSupabaseConfigured } from './supabase';
import { maintenanceTasks as mockTasks } from '../data/mockData';

export const maintenanceService = {
  // ── 1. Fetch Assigned Tasks for Maintenance Staff ─────────────────────────
  async getAssignedTasks(user) {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('leak_reports')
          .select('*, campus_zones(name), work_logs(id, note, technician_name, created_at)')
          .neq('status', 'resolved')
          .order('priority', { ascending: false });

        if (user?.name) {
          // Show tasks assigned to technician or open pending/in_progress tasks
          query = query.or(`assigned_name.ilike.%${user.name}%,assigned_to.eq.${user.id || ''},status.in.(pending,in_progress)`);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(r => ({
            id: r.id,
            type: r.type,
            location: r.location_detail || `${r.campus_zones?.name || 'Campus'}`,
            zone: r.campus_zones?.name || r.zone_id,
            priority: r.priority || 'medium',
            status: r.status,
            description: r.description,
            reporter: r.reporter_name || 'Student',
            date: new Date(r.created_at).toISOString().split('T')[0],
            photo: r.photo_url,
            video: r.video_url,
            workLog: (r.work_logs || []).map(w => `${w.note} (${w.technician_name || 'Staff'}, ${new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`),
          }));
          return { success: true, tasks: formatted };
        }
      } catch (err) {
        console.warn('[maintenanceService] getAssignedTasks error:', err.message);
      }
    }

    return { success: true, tasks: mockTasks };
  },

  // ── 2. Fetch Completed/Resolved Tasks ─────────────────────────────────────
  async getCompletedTasks(user) {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('leak_reports')
          .select('*, campus_zones(name), work_logs(id, note, technician_name, created_at)')
          .eq('status', 'resolved')
          .order('resolved_at', { ascending: false })
          .limit(25);

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(r => {
            const lastLog = (r.work_logs && r.work_logs.length > 0)
              ? r.work_logs[r.work_logs.length - 1].note
              : 'Issue resolved and verified by maintenance team.';

            return {
              id: r.id,
              type: r.type,
              location: r.location_detail || `${r.campus_zones?.name || 'Campus'}`,
              date: new Date(r.created_at).toISOString().split('T')[0],
              resolvedDate: r.resolved_at ? new Date(r.resolved_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              workDone: lastLog,
              photo: r.photo_url,
              video: r.video_url,
            };
          });
          return { success: true, tasks: formatted };
        }
      } catch (err) {
        console.warn('[maintenanceService] getCompletedTasks error:', err.message);
      }
    }

    const fallbackCompleted = [
      { id: 'LK-004', type: 'Overflow', location: 'Tank C — Overflow Point', date: '2026-07-25', resolvedDate: '2026-07-25', workDone: 'Overflow valve tightened and drainage cleared.' },
      { id: 'LK-008', type: 'Pipe Leak', location: 'Block B — 1st Floor Corridor', date: '2026-07-23', resolvedDate: '2026-07-24', workDone: 'Pipe joint re-soldered and sealed.' },
    ];
    return { success: true, tasks: fallbackCompleted };
  },

  // ── 3. Update Maintenance Status ──────────────────────────────────────────
  async updateStatus(reportId, newStatus, user) {
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

        // Add auto work log
        await supabase.from('work_logs').insert([{
          report_id: reportId,
          note: `Status updated to ${newStatus.replace('_', ' ')}`,
          technician_name: user?.name || 'Technician',
          technician_id: user?.id && user.id.length > 20 ? user.id : null,
        }]);

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // ── 4. Add Progress Note to Work Log ──────────────────────────────────────
  async addWorkLogNote(reportId, note, user) {
    if (!note || !note.trim()) {
      return { success: false, error: 'Note cannot be empty.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('work_logs')
          .insert([{
            report_id: reportId,
            note: note.trim(),
            technician_name: user?.name || 'Technician',
            technician_id: user?.id && user.id.length > 20 ? user.id : null,
          }])
          .select('*')
          .single();

        if (error) throw error;

        // Touch report updated_at
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
        note: note.trim(),
        technician_name: user?.name || 'Technician',
        created_at: new Date().toISOString(),
      },
    };
  },
};

export default maintenanceService;
