import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import CampusMap from '../../components/CampusMap';
import { Map, Droplets, AlertTriangle, ChevronRight, Building } from 'lucide-react';
import { mapPins, i2itBuildings } from '../../data/mockData';
import campusImg from '../../assets/campus.jpg';

export default function MapView() {
  const navigate = useNavigate();
  const leakPins    = mapPins.filter((p) => p.type === 'leak');
  const harvestPins = mapPins.filter((p) => p.type === 'harvesting');

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar title="Campus Map — I2IT Hinjewadi" subtitle="Live view of all issues and tanks across I2IT campus" />
        <div className="page-body">

          {/* ── Campus Photo Hero Background ─────────────────────────── */}
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            marginBottom: 24,
            minHeight: 220,
            boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Background Image */}
            <img
              src={campusImg}
              alt="I2IT Campus — Hinjewadi"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 30%',
                display: 'block',
              }}
            />

            {/* Gradient overlay so text is readable */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(2,10,6,0.82) 0%, rgba(2,19,7,0.68) 50%, rgba(6,30,18,0.55) 100%)',
            }} />

            {/* Content on top of photo */}
            <div style={{ position: 'relative', zIndex: 1, padding: '28px 28px 24px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                    }}>
                      <Map size={18} color="#fff" />
                    </div>
                    <h2 style={{ color: '#fff', margin: 0, fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.4px' }}>I2IT Campus Map</h2>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0, maxWidth: 480, lineHeight: 1.5 }}>
                    Interactive map of I2IT Hinjewadi campus. Click any pin for details.
                    Buildings, leak pins, and tank levels shown.
                  </p>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate('/admin/reports?status=active')}
                  style={{
                    background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)',
                    color: '#f87171', borderRadius: 8, flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={14} /> View Active Issues
                </button>
              </div>

              {/* Buildings quick reference */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {i2itBuildings.map((b) => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20,
                    background: b.color + '22',
                    border: `1px solid ${b.color}55`,
                    backdropFilter: 'blur(6px)',
                    fontSize: '0.8125rem', fontWeight: 600, color: '#fff',
                  }}>
                    <Building size={12} style={{ color: b.color }} />
                    {b.name}
                    <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>· {b.floors}F</span>
                  </div>
                ))}
              </div>

              {/* Legend + status badges */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    Issue Reported ({leakPins.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0ea5e9', flexShrink: 0 }} />
                    Harvesting Tank ({harvestPins.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: 'transparent', border: '2px dashed #10b981', flexShrink: 0 }} />
                    Campus Boundary
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 20, padding: '3px 10px', fontSize: '0.6875rem', fontWeight: 700 }}>
                    {leakPins.filter(p=>p.priority==='critical').length} Critical
                  </span>
                  <span style={{ background: 'rgba(14,165,233,0.2)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.35)', borderRadius: 20, padding: '3px 10px', fontSize: '0.6875rem', fontWeight: 700 }}>
                    {leakPins.filter(p=>p.status==='in_progress').length} In Progress
                  </span>
                  <span style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 20, padding: '3px 10px', fontSize: '0.6875rem', fontWeight: 700 }}>
                    {leakPins.filter(p=>p.status==='pending').length} Pending
                  </span>
                </div>
              </div>
            </div>
          </div>

          <CampusMap height={window.innerWidth < 768 ? 340 : 520} />

          {/* Tables below map */}
          <div style={{ marginTop: 24 }}>
            <div className="dash-grid-2">
              {/* Active Issues */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <AlertTriangle size={16} style={{ color: 'var(--red-500)' }} /> Active Issues on Map
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/admin/reports?status=active')}
                  >
                    View All <ChevronRight size={13} />
                  </button>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Location</th><th>Priority</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {leakPins.map((pin) => (
                        <tr
                          key={pin.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate('/admin/reports?status=active')}
                        >
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--teal-700)', fontWeight: 700 }}>
                            {pin.label.split(':')[0]}
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>{pin.location}</td>
                          <td><span className={`badge ${pin.priority}`}>{pin.priority}</span></td>
                          <td><span className={`badge ${pin.status}`}>{pin.status?.replace('_', ' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Harvesting Tanks */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Droplets size={16} style={{ color: 'var(--teal-600)' }} /> Harvesting Tanks on Map
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/admin/harvesting')}
                  >
                    Details <ChevronRight size={13} />
                  </button>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Tank / Building</th><th>Location</th><th>Fill Level</th></tr>
                    </thead>
                    <tbody>
                      {harvestPins.map((pin) => (
                        <tr
                          key={pin.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate('/admin/harvesting')}
                        >
                          <td style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{pin.label}</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>{pin.location}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar" style={{ width: 70, height: 6 }}>
                                <div
                                  className={`progress-fill ${pin.level > 60 ? 'green' : pin.level > 30 ? 'amber' : 'red'}`}
                                  style={{ width: `${pin.level}%` }}
                                />
                              </div>
                              <span style={{
                                fontSize: '0.8125rem', fontWeight: 700,
                                color: pin.level > 60 ? 'var(--green-600)' : pin.level > 30 ? 'var(--amber-500)' : 'var(--red-600)',
                              }}>
                                {pin.level}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
