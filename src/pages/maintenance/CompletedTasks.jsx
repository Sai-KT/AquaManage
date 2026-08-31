import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { CheckCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import maintenanceService from '../../services/maintenanceService';

export default function CompletedTasks() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const res = await maintenanceService.getCompletedTasks(user);
    if (res && res.success && res.tasks) {
      setCompleted(res.tasks);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadTasks(true);
  }, [user]);

  return (
    <div className="app-layout">
      <Sidebar role="maintenance" />
      <div className="main-content">
        <Topbar title="Completed Tasks" subtitle="History of resolved maintenance work" />
        <div className="page-body">
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2>Completed Tasks</h2>
                <p>All issues resolved on campus. {completed.length} completed tasks recorded.</p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { setIsRefreshing(true); loadTasks(false); }}
                disabled={isRefreshing || isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
                <span>Refresh History</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1, 2].map(n => (
                <div key={n} className="card" style={{ padding: '24px', opacity: 0.7 }}>
                  <div style={{ width: 100, height: 20, borderRadius: 6, background: 'var(--navy-200)', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '60%', height: 16, borderRadius: 6, background: 'var(--navy-100)', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '85%', height: 32, borderRadius: 8, background: 'var(--green-50)', animation: 'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : completed.length === 0 ? (
            <div className="card empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <CheckCircle size={44} style={{ color: 'var(--teal-600)', margin: '0 auto 12px' }} />
              <h4>No completed tasks yet</h4>
              <p style={{ color: 'var(--navy-500)' }}>When you resolve issues from your task queue, they will appear here.</p>
            </div>
          ) : (
            completed.map((t) => (
              <div key={t.id} className="card" style={{ marginBottom: 14, borderLeft: '4px solid var(--green-400)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={18} style={{ color: 'var(--green-600)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--teal-700)' }}>{t.id}</span>
                      <span className="badge resolved">Resolved</span>
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--navy-800)' }}>{t.type}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--navy-400)', marginBottom: 10 }}>📍 {t.location} · Resolved {t.resolvedDate}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--navy-600)', padding: '8px 12px', background: 'var(--green-50)', borderRadius: 8, borderLeft: '3px solid var(--green-400)', marginBottom: (t.photo || t.video) ? 10 : 0 }}>
                      <strong>Work done:</strong> {t.workDone}
                    </div>
                    {(t.photo || t.video) && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                        {t.photo && (
                          <a href={t.photo} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--navy-100)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600 }}>
                              <ImageIcon size={13} style={{ color: 'var(--teal-600)' }} /> Photo Evidence
                            </div>
                          </a>
                        )}
                        {t.video && (
                          <a href={t.video} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--navy-100)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600 }}>
                              📹 Video Evidence
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
