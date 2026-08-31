import { supabase, isSupabaseConfigured } from '../services/supabase';
import { tankData, campusStats, weeklyUsageData, hourlyUsageData } from '../data/mockData';

export const waterApi = {
  /**
   * Get live tank telemetry
   */
  async getTanks() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tanks')
          .select('*, campus_zones(name)')
          .order('id', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          return {
            success: true,
            tanks: data.map((t) => ({
              id: t.id,
              name: t.name,
              capacity: t.capacity_litres,
              current: t.current_litres,
              status: t.status,
              zone: t.campus_zones?.name,
            })),
          };
        }
      } catch (err) {
        console.warn('[waterApi] getTanks error:', err.message);
      }
    }
    return { success: true, tanks: tankData };
  },

  /**
   * Update tank level telemetry
   */
  async updateTankLevel({ tankId, currentLitres, user }) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tanks')
          .update({ current_litres: currentLitres, last_reading_at: new Date().toISOString() })
          .eq('id', tankId)
          .select('*')
          .single();

        if (error) throw error;
        return { success: true, tank: data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true, tank: { id: tankId, current: currentLitres } };
  },

  /**
   * Get campus harvesting & usage summary
   */
  async getSummary() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: harvestLog } = await supabase
          .from('harvesting_logs')
          .select('*')
          .order('record_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: tanks } = await supabase.from('tanks').select('capacity_litres, current_litres');

        const totalCapacity = (tanks || []).reduce((s, t) => s + (t.capacity_litres || 0), 0);
        const totalCurrent = (tanks || []).reduce((s, t) => s + (t.current_litres || 0), 0);

        return {
          success: true,
          stats: {
            waterSavedToday: harvestLog?.litres_collected || campusStats.waterSavedToday,
            harvestingEfficiency: harvestLog?.efficiency_percentage || campusStats.harvestingEfficiency,
            activeLeaksCount: campusStats.activeLeaksCount,
            totalCapacity: totalCapacity || campusStats.totalCapacity,
            totalCurrent: totalCurrent || campusStats.totalCurrent,
          },
          weeklyUsage: weeklyUsageData,
          hourlyUsage: hourlyUsageData,
        };
      } catch (err) {
        console.warn('[waterApi] getSummary error:', err.message);
      }
    }

    return {
      success: true,
      stats: campusStats,
      weeklyUsage: weeklyUsageData,
      hourlyUsage: hourlyUsageData,
    };
  },
};

export default waterApi;
