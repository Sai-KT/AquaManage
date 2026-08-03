import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import HeroBanner from '../../components/HeroBanner';
import Topbar from '../../components/Topbar';
import { CheckCircle, Clock, MapPin, MessageSquare, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { maintenanceTasks } from '../../data/mockData';

const priorityColors = {
  critical: { bg: 'var(--red-100)', color: 'var(--red-600)', border: 'var(--red-500)' },
  high:     { bg: '#fef3c7', color: '#92400e', border: 'var(--amber-500)' },
  medium:   { bg: 'var(--teal-100)', color: '#075985', border: 'var(--teal-500)' },
  low:      { bg: 'var(--navy-100)', color: 'var(--navy-600)', border: 'var(--navy-400)' },
};

function TaskCard({ task }) {
  const [open, setOpen] = useState(false);
  const [logInput, setLogInput] = useState('');
  const [logs, setLogs] = useState(task.workLog);
  const [status, setStatus] = useState(task.status);
  const pc = priorityColors[task.priority] || priorityColors.medium;

  const addLog = () => {
    if (!logInput.trim()) return;
    setLogs([...logs, logInput.trim()]);
    setLogInput('');
  };

  const statusOptions = ['pending', 'in_progress', 'resolved'];

  return (
    <div className="task-card" style={{ borderLeft: `4px solid ${pc.border}` }}>
      <div className="task-card-header" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: pc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Wrench size={18} style={{ color: pc.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--teal-700)' }}>{task.id}</span>
            <span className={`badge ${task.priority}`}>{task.priority}</span>
            <span className={`badge ${status}`}>{status.replace('_', ' ')}</span>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--navy-800)', fontSize: '0.9375rem' }}>{task.type}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--navy-400)', marginTop: 3 }}>
            <MapPin size={12} /> {task.location}
          </div>
        </div>
        <div style={{ color: 'var(--navy-400)' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {open && (
        <div className="task-card-body">
          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 6 }}>Issue Description</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--navy-600)', lineHeight: 1.6 }}>{task.description}</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8125rem', color: 'var(--navy-400)' }}>
              <span>📅 Reported: {task.date}</span>
              <span>👤 By: {task.reporter}</span>
            </div>
          </div>

          <div className="divider" />

          {/* Update Status */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 8 }}>Update Status</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {statusOptions.map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatus(s)}
                  style={{ textTransform: 'capitalize', fontSize: '0.8125rem' }}
                >
                  {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Work Log */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={13} /> Work Log ({logs.length} entries)
            </div>
            {logs.length > 0 && (
              <ul className="work-log-list">
                {logs.map((l, i) => (
                  <li key={i}>
                    <CheckCircle size={13} style={{ color: 'var(--green-500)', flexShrink: 0, marginTop: 2 }} />
                    {l}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add a work note (e.g. 'Temporary patch applied')..."
                value={logInput}
                onChange={(e) => setLogInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLog()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={addLog}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskQueue() {
  const critical = maintenanceTasks.filter(t => t.priority === 'critical');
  const other = maintenanceTasks.filter(t => t.priority !== 'critical');

  return (
    <div className="app-layout">
      <Sidebar role="maintenance" />
      <div className="main-content">
        <Topbar title="Task Queue" subtitle="Your assigned maintenance tasks" />
        <div className="page-body">
          <HeroBanner role="maintenance" />

          {critical.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--red-600)', fontWeight: 700, fontSize: '0.875rem' }}>
                🚨 Critical — Immediate Action Required
              </div>
              {critical.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          )}

          {other.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--navy-600)', fontWeight: 700, fontSize: '0.875rem' }}>
                <Clock size={14} /> Standard Tasks
              </div>
              {other.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
