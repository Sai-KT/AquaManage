import React from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { CheckCircle } from 'lucide-react';

const completed = [
  { id: 'LK-004', type: 'Overflow', location: 'Tank C — Overflow Point', date: '2026-07-25', resolvedDate: '2026-07-25', workDone: 'Overflow valve tightened and drainage cleared.' },
  { id: 'LK-008', type: 'Pipe Leak', location: 'Block B — 1st Floor Corridor', date: '2026-07-23', resolvedDate: '2026-07-24', workDone: 'Pipe joint re-soldered and sealed.' },
];

export default function CompletedTasks() {
  return (
    <div className="app-layout">
      <Sidebar role="maintenance" />
      <div className="main-content">
        <Topbar title="Completed Tasks" subtitle="History of resolved maintenance work" />
        <div className="page-body">
          <div className="page-header">
            <h2>Completed Tasks</h2>
            <p>All issues you've resolved. {completed.length} completed tasks this week.</p>
          </div>

          {completed.map((t) => (
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
                  <div style={{ fontSize: '0.875rem', color: 'var(--navy-600)', padding: '8px 12px', background: 'var(--green-50)', borderRadius: 8, borderLeft: '3px solid var(--green-400)' }}>
                    <strong>Work done:</strong> {t.workDone}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
