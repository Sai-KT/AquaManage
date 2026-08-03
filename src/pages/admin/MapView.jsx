import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import CampusMap from '../../components/CampusMap';
import { Map, Droplets, AlertTriangle, ChevronRight, Building } from 'lucide-react';
import { mapPins, i2itBuildings } from '../../data/mockData';

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
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>I2IT Campus Map</h2>
                <p>Interactive map of I2IT Hinjewadi campus. Click any pin for details. Buildings, leak pins, and tank levels shown.</p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/admin/reports?status=active')}
              >
                <AlertTriangle size={14} /> View Active Issues
              </button>
            </div>
          </div>

          {/* Buildings quick reference */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {i2itBuildings.map((b) => (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                background: b.color + '18', border: `1px solid ${b.color}44`,
                fontSize: '0.8125rem', fontWeight: 600, color: b.color,
              }}>
                <Building size={13} />
                {b.name}
                <span style={{ fontWeight: 400, color: b.color + 'aa', fontSize: '0.75rem' }}>· {b.floors}F</span>
              </div>
            ))}
          </div>

          {/* Legend + Stats */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <div className="map-legend">
              <div className="map-legend-item"><div className="legend-dot leak" />Issue Reported ({leakPins.length})</div>
              <div className="map-legend-item"><div className="legend-dot harvest" />Harvesting Tank ({harvestPins.length})</div>
              <div className="map-legend-item">
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green-500)', border: '2px dashed var(--green-500)' }} />
                Campus Boundary
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <span className="badge critical">{leakPins.filter(p=>p.priority==='critical').length} Critical</span>
              <span className="badge in_progress">{leakPins.filter(p=>p.status==='in_progress').length} In Progress</span>
              <span className="badge pending">{leakPins.filter(p=>p.status==='pending').length} Pending</span>
            </div>
          </div>

          <CampusMap height={520} />

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
