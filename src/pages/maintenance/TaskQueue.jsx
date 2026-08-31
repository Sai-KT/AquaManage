import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import HeroBanner from '../../components/HeroBanner';
import Topbar from '../../components/Topbar';
import { CheckCircle, Clock, MapPin, MessageSquare, ChevronDown, ChevronUp, Wrench, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { maintenanceTasks as defaultTasks } from '../../data/mockData';
import maintenanceService from '../../services/maintenanceService';

const priorityColors = {
  critical: { bg: 'var(--red-100)', color: 'var(--red-600)', border: 'var(--red-500)' },
  high:     { bg: '#fef3c7', color: '#92400e', border: 'var(--amber-500)' },
  medium:   { bg: 'var(--teal-100)', color: '#075985', border: 'var(--teal-500)' },
  low:      { bg: 'var(--navy-100)', color: 'var(--navy-600)', border: 'var(--navy-400)' },
};

function TaskCard({ task, onStatusChange, onAddLog }) {
  const [open, setOpen] = useState(false);
  const [logInput, setLogInput] = useState('');
  const [logs, setLogs] = useState(task.workLog || []);
  const [status, setStatus] = useState(task.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const pc = priorityColors[task.priority] || priorityColors.medium;

  const handleAddLog = async () => {
    if (!logInput.trim()) return;
    const note = logInput.trim();
    setLogs(prev => [...prev, `${note} (Just now)`]);
    setLogInput('');
    if (onAddLog) await onAddLog(task.id, note);
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatus(newStatus);
    setIsUpdating(true);
    if (onStatusChange) await onStatusChange(task.id, newStatus);
    setIsUpdating(false);
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

          {/* Attached Media Evidence */}
          {(task.photo || task.video) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {task.photo && (
                <a href={task.photo} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--navy-100)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600 }}>
                    <ImageIcon size={14} style={{ color: 'var(--teal-600)' }} /> View Attached Photo
                  </div>
                </a>
              )}
              {task.video && (
                <a href={task.video} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--navy-100)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600 }}>
                    📹 View Attached Video
                  </div>
                </a>
              )}
            </div>
          )}

          <div className="divider" />

          {/* Update Status */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 8 }}>Update Status</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {statusOptions.map((s) => (
                <button
                  key={s}
                  disabled={isUpdating}
                  className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStatusUpdate(s)}
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddLog}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskQueue() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(defaultTasks);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const res = await maintenanceService.getAssignedTasks(user);
    if (res && res.success && res.tasks) {
      setTasks(res.tasks);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadTasks(true);
  }, [user]);

  const handleStatusChange = async (reportId, newStatus) => {
    await maintenanceService.updateStatus(reportId, newStatus, user);
    if (newStatus === 'resolved') {
      setTasks(prev => prev.filter(t => t.id !== reportId));
    }
  };

  const handleAddLog = async (reportId, note) => {
    await maintenanceService.addWorkLogNote(reportId, note, user);
  };

  const critical = tasks.filter(t => t.priority === 'critical');
  const other = tasks.filter(t => t.priority !== 'critical');

  return (
    <div className="app-layout">
      <Sidebar role="maintenance" />
      <div className="main-content">
        <Topbar title="Task Queue" subtitle="Your assigned maintenance tasks" />
        <div className="page-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <HeroBanner role="maintenance" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setIsRefreshing(true); loadTasks(false); }}
              disabled={isRefreshing || isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
              <span>Refresh Tasks</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="card empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <CheckCircle size={44} style={{ color: 'var(--green-600)', margin: '0 auto 12px' }} />
              <h4>All Clear!</h4>
              <p style={{ color: 'var(--navy-500)' }}>No pending maintenance tasks in your queue right now.</p>
            </div>
          ) : (
            <>
              {critical.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--red-600)', fontWeight: 700, fontSize: '0.875rem' }}>
                    🚨 Critical — Immediate Action Required ({critical.length})
                  </div>
                  {critical.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onStatusChange={handleStatusChange}
                      onAddLog={handleAddLog}
                    />
                  ))}
                </div>
              )}

              {other.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--navy-600)', fontWeight: 700, fontSize: '0.875rem' }}>
                    <Clock size={14} /> Standard Tasks ({other.length})
                  </div>
                  {other.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onStatusChange={handleStatusChange}
                      onAddLog={handleAddLog}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
