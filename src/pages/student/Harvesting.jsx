import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import TankGauge from '../../components/TankGauge';
import { CloudRain, AlertTriangle, Info, RefreshCw, Loader } from 'lucide-react';
import studentService from '../../services/studentService';

export default function StudentHarvesting() {
  const [tanks, setTanks] = useState([]);
  const [stats, setStats] = useState({ waterSavedToday: 12400, harvestingEfficiency: 87 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchHarvestingData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError('');
    try {
      const res = await studentService.getHarvestingStatus();
      if (res && res.success) {
        setTanks(res.tanks || []);
        if (res.stats) setStats(res.stats);
      } else {
        setError(res?.error || 'Failed to load harvesting data.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred loading tank levels.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHarvestingData(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHarvestingData(false);
  };

  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Harvesting Status" subtitle="Current campus water harvesting health" />
        <div className="page-body">
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2>Campus Water Status</h2>
                <p>Read-only view of current rainwater harvesting system performance.</p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                title="Refresh Tank Levels"
              >
                <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
                <span>Refresh Telemetry</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--red-100)', color: 'var(--red-700)', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ padding: '14px 18px', background: 'var(--teal-100)', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--teal-300)' }}>
            <Info size={18} style={{ color: 'var(--teal-700)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--teal-800)', lineHeight: 1.6 }}>
              <strong>Today:</strong> We've harvested <strong>{(stats.waterSavedToday / 1000).toFixed(1)}kL</strong> of rainwater — 
              that's {stats.harvestingEfficiency}% of our daily target. 
              Every drop saved reduces our dependency on municipal supply!
            </p>
          </div>

          <div className="dash-grid-2" style={{ marginBottom: 24 }}>
            {[
              { label: 'Harvested Today', value: `${(stats.waterSavedToday / 1000).toFixed(1)} kL`, icon: '💧', color: 'var(--teal-700)', bg: 'var(--teal-100)' },
              { label: 'Efficiency', value: `${stats.harvestingEfficiency}%`, icon: '📊', color: 'var(--green-700)', bg: 'var(--green-100)' },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: '24px 28px', border: `1px solid ${s.bg}` }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.875rem', color: s.color, opacity: 0.8, marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><CloudRain size={17} style={{ color: 'var(--teal-600)' }} /> Tank Levels</div>
            </div>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10, color: 'var(--navy-500)' }}>
                <Loader size={20} className="spin-icon" style={{ color: 'var(--teal-600)' }} />
                <span>Reading live sensor telemetry...</span>
              </div>
            ) : (
              <div className="responsive-grid-4">
                {tanks.map((t) => <TankGauge key={t.id} tank={t} />)}
              </div>
            )}
          </div>

          {tanks.some(t => t.status === 'critical') && (
            <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--red-100)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--red-500)' }}>
              <AlertTriangle size={18} style={{ color: 'var(--red-600)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--red-700)' }}>
                <strong>Notice:</strong> One or more tanks are critically low. Maintenance has been notified.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
