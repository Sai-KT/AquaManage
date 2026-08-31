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

    // Validate inputs
    if (!type || !zone || !description || description.trim().length < 10) {
      return {
        success: false,
        error: 'Please provide a valid issue type, campus zone, and description of at least 10 characters.',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      const errMsg = 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in .env. Please add them to persist reports.';
      console.error('[studentService]', errMsg);
      return {
        success: false,
        error: errMsg,
      };
    }

    // Upload files if attached
    if (photoFile) {
      photoUrl = await this.uploadMedia(photoFile, 'photos');
    }
    if (videoFile) {
      videoUrl = await this.uploadMedia(videoFile, 'videos');
    }

    try {
      // Securely retrieve the authenticated user session
      const { data: authData } = await supabase.auth.getUser();
      const verifiedAuthUser = authData?.user;

      // Auto-assign priority based on issue category
      let priority = 'medium';
      if (type === 'Pipe Burst') priority = 'critical';
      else if (type === 'Pipe Leak' || type === 'Overflow') priority = 'high';
      else if (type === 'Tap Wastage') priority = 'medium';
      else priority = 'low';

      // Robust zone_id resolution matching campus_zones primary keys
      const ZONE_MAPPING = {
        'academic block': 'academic',
        'academic': 'academic',
        'ppcrc': 'ppcrc',
        'mithila hostel': 'mithila',
        'mithila': 'mithila',
        'vikramshila hostel': 'vikramshila',
        'vikramshila': 'vikramshila',
        'canteen': 'canteen',
        'campus garden': 'garden',
        'garden': 'garden',
      };
      const cleanZoneKey = (zone || '').trim().toLowerCase();
      let zoneId = ZONE_MAPPING[cleanZoneKey] || null;

      if (!zoneId) {
        const { data: zoneData } = await supabase
          .from('campus_zones')
          .select('id')
          .ilike('name', zone)
          .maybeSingle();
        if (zoneData?.id) zoneId = zoneData.id;
      }

      const reporterId = verifiedAuthUser?.id || (user?.id && user.id.length > 20 && user.id.includes('-') ? user.id : null);
      const reporterName = verifiedAuthUser?.user_metadata?.name || user?.name || 'Student';

      const payload = {
        type,
        zone_id: zoneId,
        location_detail: location || `${zone} — Campus Area`,
        description: description.trim(),
        reporter_name: reporterName,
        reporter_id: reporterId,
        photo_url: photoUrl,
        video_url: videoUrl,
        status: 'pending',
        priority,
      };

      console.log('[studentService] Inserting report into Supabase table "leak_reports":', payload);

      const { data, error } = await supabase
        .from('leak_reports')
        .insert([payload])
        .select('id, type, location_detail, zone_id, status, priority, created_at')
        .single();

      if (error) {
        console.error('[studentService] Supabase insert failed:', error);
        throw error;
      }

      console.log('[studentService] Report created successfully with ID:', data.id);

      // Add automated system alert for technicians/admins
      try {
        await supabase.from('alerts').insert([{
          type: priority === 'critical' ? 'critical' : 'warning',
          icon: priority === 'critical' ? 'AlertTriangle' : 'Droplets',
          title: `New Report: ${data.id} (${type})`,
          message: `${description.slice(0, 80)}... Location: ${location || zone}`,
        }]);
      } catch (e) {
        // non-fatal alert insert
      }

      return {
        success: true,
        reportId: data.id,
        data,
      };
    } catch (err) {
      console.error('[studentService] Exception during report submission:', err);
      return {
        success: false,
        error: err.message || 'Database error while saving report to Supabase.',
      };
    }
  },

  // ── 4. Fetch Student's Submitted Reports ────────────────────────────────────
  async getMyReports(user) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const verifiedAuthUser = authData?.user;

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

        // Filter securely by authenticated UUID or verified student metadata
        if (verifiedAuthUser?.id) {
          query = query.or(`reporter_id.eq.${verifiedAuthUser.id},reporter_name.eq.${verifiedAuthUser.user_metadata?.name || user?.name}`);
        } else if (user?.id && user.id.length > 20) {
          query = query.or(`reporter_id.eq.${user.id},reporter_name.eq.${user.name}`);
        } else if (user?.name) {
          query = query.ilike('reporter_name', `%${user.name}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
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
