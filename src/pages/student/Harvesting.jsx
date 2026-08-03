import React from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import TankGauge from '../../components/TankGauge';
import { CloudRain, AlertTriangle, Info } from 'lucide-react';
import { tankData, campusStats } from '../../data/mockData';

export default function StudentHarvesting() {
  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Harvesting Status" subtitle="Current campus water harvesting health" />
        <div className="page-body">
          <div className="page-header">
            <h2>Campus Water Status</h2>
            <p>Read-only view of current rainwater harvesting system performance.</p>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--teal-100)', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--teal-300)' }}>
            <Info size={18} style={{ color: 'var(--teal-700)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--teal-800)', lineHeight: 1.6 }}>
              <strong>Today:</strong> We've harvested <strong>{(campusStats.waterSavedToday / 1000).toFixed(1)}kL</strong> of rainwater — 
              that's {campusStats.harvestingEfficiency}% of our daily target. 
              Every drop saved reduces our dependency on municipal supply!
            </p>
          </div>

          <div className="dash-grid-2" style={{ marginBottom: 24 }}>
            {[
              { label: 'Harvested Today', value: `${(campusStats.waterSavedToday / 1000).toFixed(1)} kL`, icon: '💧', color: 'var(--teal-700)', bg: 'var(--teal-100)' },
              { label: 'Efficiency', value: `${campusStats.harvestingEfficiency}%`, icon: '📊', color: 'var(--green-700)', bg: 'var(--green-100)' },
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {tankData.map((t) => <TankGauge key={t.id} tank={t} />)}
            </div>
          </div>

          {tankData.some(t => t.status === 'critical') && (
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
