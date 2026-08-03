import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import AlertPanel from '../../components/AlertPanel';
import { Bell, CheckCheck, Settings, ChevronLeft } from 'lucide-react';
import { alerts } from '../../data/mockData';

export default function Alerts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type') || 'all';

  const [filter, setFilter] = useState(urlType);
  const [alertList, setAlertList] = useState(alerts);
  const unread = alertList.filter((a) => !a.read).length;

  const filtered = filter === 'all'
    ? alertList
    : filter === 'unread'
      ? alertList.filter((a) => !a.read)
      : alertList.filter((a) => a.type === filter);

  const markAllRead = () => {
    setAlertList(prev => prev.map(a => ({ ...a, read: true })));
  };

  const thresholds = [
    { label: 'Tank Level Critical Threshold', value: '25%',    icon: '💧' },
    { label: 'Usage Spike Alert (% above avg)', value: '+30%', icon: '📈' },
    { label: 'Daily Harvest Below Target',      value: '70%',  icon: '🌧️' },
    { label: 'Leak Report Auto-Escalation',     value: '24 hrs', icon: '⚠️' },
  ];

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar title="Alerts & Notifications" subtitle="Real-time system alerts and notifications" />
        <div className="page-body">

          <button
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate('/admin/dashboard')}
          >
            <ChevronLeft size={14} /> Back to Dashboard
          </button>

          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>Alerts</h2>
                <p>System-generated alerts for threshold breaches, usage spikes, and new issue reports.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark All Read
              </button>
            </div>
          </div>

          <div className="dash-grid-21">
            {/* Alerts Panel */}
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { key: 'all',      label: `All (${alertList.length})` },
                  { key: 'unread',   label: `Unread (${unread})` },
                  { key: 'critical', label: 'Critical' },
                  { key: 'warning',  label: 'Warnings' },
                  { key: 'info',     label: 'Info' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="card" style={{ padding: 0 }}>
                {filtered.length > 0
                  ? (
                    <div className="alert-list">
                      {filtered.map((alert) => {
                        const iconMap = {
                          AlertTriangle: '⚠️', Droplets: '💧', CloudRain: '🌧️',
                          CheckCircle: '✅', AlertCircle: '🔔', Thermometer: '🌡️',
                        };
                        return (
                          <div
                            key={alert.id}
                            className={`alert-item ${!alert.read ? 'unread' : ''}`}
                            onClick={() => setAlertList(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a))}
                          >
                            <div className={`alert-icon ${alert.type}`}>
                              <span style={{ fontSize: '0.875rem' }}>{iconMap[alert.icon] || '🔔'}</span>
                            </div>
                            <div className="alert-content">
                              <div className="alert-title">{alert.title}</div>
                              <div className="alert-message">{alert.message}</div>
                              <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center' }}>
                                <div className="alert-time">{alert.time}</div>
                                {alert.type === 'critical' && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ fontSize: '0.6875rem', padding: '2px 8px', background: 'var(--red-100)', color: 'var(--red-600)', borderRadius: 6 }}
                                    onClick={(e) => { e.stopPropagation(); navigate('/admin/reports?status=active'); }}
                                  >
                                    View Issue →
                                  </button>
                                )}
                                {alert.type === 'warning' && alert.title.includes('Hostel') && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ fontSize: '0.6875rem', padding: '2px 8px', background: 'var(--amber-100)', color: '#92400e', borderRadius: 6 }}
                                    onClick={(e) => { e.stopPropagation(); navigate('/admin/usage'); }}
                                  >
                                    View Usage →
                                  </button>
                                )}
                              </div>
                            </div>
                            {!alert.read && <div className="alert-unread-dot" />}
                          </div>
                        );
                      })}
                    </div>
                  )
                  : (
                    <div className="empty-state">
                      <Bell size={40} />
                      <h4>No alerts in this category</h4>
                    </div>
                  )
                }
              </div>
            </div>

            {/* Config Panel */}
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <div className="card-title"><Settings size={16} /> Alert Thresholds</div>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--navy-500)', marginBottom: 16, lineHeight: 1.6 }}>
                  Configure when the system triggers automatic alerts for I2IT campus.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {thresholds.map((t) => (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: '1.25rem' }}>{t.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: 2 }}>{t.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--navy-400)' }}>Current threshold</div>
                      </div>
                      <div
                        style={{ fontWeight: 700, color: 'var(--green-700)', background: 'var(--green-100)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8125rem', cursor: 'pointer' }}
                      >
                        {t.value}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16, width: '100%' }}>
                  <Settings size={13} /> Edit Thresholds
                </button>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Bell size={16} /> Quick Navigation</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {[
                    { label: 'View All Active Issues', path: '/admin/reports?status=active', color: 'var(--red-600)', bg: 'var(--red-100)' },
                    { label: 'Harvesting Status',      path: '/admin/harvesting',            color: 'var(--teal-700)', bg: 'var(--teal-100)' },
                    { label: 'Water Usage Analytics',  path: '/admin/usage',                 color: 'var(--green-700)', bg: 'var(--green-100)' },
                    { label: 'Campus Map',             path: '/admin/map',                   color: 'var(--navy-700)', bg: 'var(--navy-100)' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: item.bg, color: item.color, fontWeight: 600, fontSize: '0.8125rem', textAlign: 'left' }}
                    >
                      {item.label} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
