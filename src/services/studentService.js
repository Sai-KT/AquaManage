import { supabase, isSupabaseConfigured } from './supabase';
import {
  tankData as mockTanks,
  campusStats as mockStats,
  myReports as mockMyReports,
  campusZones as mockZones,
  issueTypes as mockIssueTypes
} from '../data/mockData';

export const studentService = {
  // ── 1. Fetch Campus Zones ──────────────────────────────────────────────────
  async getCampusZones() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('campus_zones')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          return { success: true, data: data.map(z => z.name) };
        }
      } catch (err) {
        console.warn('[studentService] Failed to load zones from Supabase, using fallback:', err.message);
      }
    }
    return { success: true, data: mockZones };
  },

  // ── 2. Upload Media Evidence to Storage Bucket ─────────────────────────────
  async uploadMedia(file, folder = 'photos') {
    if (!file || !isSupabaseConfigured || !supabase) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('leak-evidence')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('[studentService] Media upload failed:', error.message);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('leak-evidence')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.warn('[studentService] Media upload exception:', err.message);
      return null;
    }
  },

  // ── 3. Submit Leak Incident Report ─────────────────────────────────────────
  async submitReport({ type, zone, location, description, photoFile, videoFile, user }) {
    let photoUrl = null;
    let videoUrl = null;

    // Upload files if Supabase is active
    if (photoFile) {
      photoUrl = await this.uploadMedia(photoFile, 'photos');
    }
    if (videoFile) {
      videoUrl = await this.uploadMedia(videoFile, 'videos');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Find zone_id from zone name
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
          description,
          reporter_name: user?.name || 'Student',
          reporter_id: user?.id && user.id.includes('-') && user.id.length > 20 ? user.id : null,
          photo_url: photoUrl,
          video_url: videoUrl,
          status: 'pending',
          priority: 'medium',
        };

        const { data, error } = await supabase
          .from('leak_reports')
          .insert([payload])
          .select('id, type, location_detail, zone_id, status, created_at')
          .single();

        if (error) throw error;

        // Also add automated alert
        try {
          await supabase.from('alerts').insert([{
            type: 'warning',
            icon: 'Droplets',
            title: `New Report: ${data.id} (${type})`,
            message: `${description.slice(0, 80)}... Location: ${location || zone}`,
          }]);
        } catch (e) {
          // ignore alert insert failure
        }

        return {
          success: true,
          reportId: data.id,
          data,
        };
      } catch (err) {
        console.warn('[studentService] Supabase report insert failed, generating fallback:', err.message);
      }
    }

    // Fallback if Supabase not configured
    const fallbackId = `LK-0${Math.floor(10 + Math.random() * 90)}`;
    return {
      success: true,
      reportId: fallbackId,
    };
  },

  // ── 4. Fetch Student's Submitted Reports ────────────────────────────────────
  async getMyReports(user) {
    if (isSupabaseConfigured && supabase && user) {
      try {
        let query = supabase
          .from('leak_reports')
          .select(`
            id,
            type,
            location_detail,
            zone_id,
            reporter_name,
            reporter_id,
            status,
            priority,
            description,
            photo_url,
            video_url,
            created_at,
            resolved_at
          `);

        // Filter by user ID if valid UUID, or reporter_name
        if (user.id && user.id.length > 20) {
          query = query.or(`reporter_id.eq.${user.id},reporter_name.eq.${user.name}`);
        } else if (user.name) {
          query = query.ilike('reporter_name', `%${user.name}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(r => ({
            id: r.id,
            type: r.type,
            location: r.location_detail,
            zone: r.zone_id,
            status: r.status,
            priority: r.priority,
            description: r.description,
            photo: r.photo_url,
            video: r.video_url,
            date: new Date(r.created_at).toISOString().split('T')[0],
          }));
          return { success: true, reports: formatted };
        }
      } catch (err) {
        console.warn('[studentService] Failed to load student reports from Supabase:', err.message);
      }
    }

    return { success: true, reports: mockMyReports };
  },

  // ── 5. Fetch Rainwater Harvesting Status & Tank Levels ─────────────────────
  async getHarvestingStatus() {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch tanks
        const { data: tanks, error: tanksErr } = await supabase
          .from('tanks')
          .select('id, name, capacity_litres, current_litres, status')
          .order('id', { ascending: true });

        if (tanksErr) throw tanksErr;

        // Fetch today's harvesting log
        const { data: harvestLog } = await supabase
          .from('harvesting_logs')
          .select('*')
          .order('record_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const formattedTanks = (tanks || []).map(t => ({
          id: t.id,
          name: t.name,
          capacity: t.capacity_litres,
          current: t.current_litres,
          status: t.status,
        }));

        const totalCapacity = formattedTanks.reduce((s, t) => s + t.capacity, 0);
        const totalCurrent = formattedTanks.reduce((s, t) => s + t.current, 0);

        const stats = {
          waterSavedToday: harvestLog?.litres_collected || mockStats.waterSavedToday,
          harvestingEfficiency: harvestLog?.efficiency_percentage || mockStats.harvestingEfficiency,
          totalCapacity,
          totalCurrent,
        };

        return {
          success: true,
          tanks: formattedTanks.length > 0 ? formattedTanks : mockTanks,
          stats,
        };
      } catch (err) {
        console.warn('[studentService] Failed to fetch harvesting status from Supabase:', err.message);
      }
    }

    return {
      success: true,
      tanks: mockTanks,
      stats: mockStats,
    };
  },
};

export default studentService;
