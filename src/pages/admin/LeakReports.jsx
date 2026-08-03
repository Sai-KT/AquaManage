import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { AlertTriangle, Filter, Download, Search, Eye, UserCheck, ChevronLeft, X } from 'lucide-react';
import { leakReports } from '../../data/mockData';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const MAINTENANCE_STAFF = ['Ram Kumar', 'Suresh Babu', 'Mohan Das', 'Vijay Patil', 'Anil Sharma'];

export default function LeakReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState(leakReports);

  // Read initial filter from URL params (e.g. ?status=active or ?status=pending)
  const urlStatus = searchParams.get('status') || 'all';
  const [statusFilter, setStatusFilter]   = useState(() => {
    if (urlStatus === 'active') return 'active';
    if (urlStatus === 'resolved') return 'resolved';
    if (urlStatus === 'pending') return 'pending';
    if (urlStatus === 'in_progress') return 'in_progress';
    return 'all';
  });
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [zoneFilter, setZoneFilter]         = useState('all');
  const [search, setSearch]                 = useState('');
  const [expanded, setExpanded]             = useState(null);
  const [assignModal, setAssignModal]       = useState(null); // report id
  const [assignStaff, setAssignStaff]       = useState('');

  // Sync filter to URL
  const handleStatusChange = (val) => {
    setStatusFilter(val);
    if (val !== 'all') setSearchParams({ status: val });
    else setSearchParams({});
  };

  // Resolve "active" = pending + in_progress
  const matchesStatus = (r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return r.status === 'pending' || r.status === 'in_progress';
    return r.status === statusFilter;
  };

  const filtered = reports
    .filter(matchesStatus)
    .filter((r) => priorityFilter === 'all' || r.priority === priorityFilter)
    .filter((r) => zoneFilter === 'all' || r.zone === zoneFilter)
    .filter((r) =>
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const zones = [...new Set(leakReports.map((r) => r.zone))];

  const getTitle = () => {
    if (statusFilter === 'active') return `Active Leak Reports (${filtered.length})`;
    if (statusFilter === 'resolved') return `Resolved Issues (${filtered.length})`;
    if (statusFilter === 'pending') return `Pending Reports (${filtered.length})`;
    if (statusFilter === 'in_progress') return `In-Progress Issues (${filtered.length})`;
    return 'All Leak Reports';
  };

  const handleAssign = (reportId) => {
    if (!assignStaff) return;
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, assignedTo: assignStaff, status: 'in_progress' } : r)
    );
    setAssignModal(null);
    setAssignStaff('');
  };

  const handleStatusUpdate = (reportId, newStatus) => {
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
    );
  };

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar title="Leak Reports — I2IT Campus" subtitle="All reported water issues" />
        <div className="page-body">

          {/* Back to Dashboard if coming from a drilldown */}
          {(urlStatus && urlStatus !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('/admin/dashboard')}
            >
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
          )}

          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>{getTitle()}</h2>
                <p>Manage and track all water issue reports across I2IT campus. Assign to maintenance staff as needed.</p>
              </div>
              <button className="btn btn-secondary btn-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Summary strip */}
          <div className="stat-cards-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Reports',  value: reports.length,                                                      color: 'teal',  filter: 'all'         },
              { label: 'Active',         value: reports.filter(r => r.status !== 'resolved').length,                 color: 'red',   filter: 'active'      },
              { label: 'Pending',        value: reports.filter(r => r.status === 'pending').length,                  color: 'amber', filter: 'pending'     },
              { label: 'In Progress',    value: reports.filter(r => r.status === 'in_progress').length,              color: 'teal',  filter: 'in_progress' },
              { label: 'Resolved',       value: reports.filter(r => r.status === 'resolved').length,                 color: 'green', filter: 'resolved'    },
              { label: 'Critical',       value: reports.filter(r => r.priority === 'critical').length,               color: 'red',   filter: null          },
            ].map((s) => (
              <div
                key={s.label}
                className={`stat-card ${s.color}`}
                style={{ cursor: s.filter ? 'pointer' : 'default', outline: statusFilter === s.filter ? '2px solid var(--green-500)' : 'none' }}
                onClick={() => s.filter && handleStatusChange(s.filter)}
              >
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: '7px 12px', border: '1.5px solid var(--navy-200)', flex: 1, maxWidth: 300 }}>
              <Search size={14} style={{ color: 'var(--navy-400)', flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, location, reporter..."
                style={{ border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--navy-700)', width: '100%', background: 'transparent' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy-400)', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
            <select className="form-select" value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active (All)</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="form-select" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
              <option value="all">All Zones</option>
              {zones.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Reporter</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td><strong style={{ color: 'var(--teal-700)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{r.id}</strong></td>
                        <td>{r.type}</td>
                        <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.location}</td>
                        <td>{r.reporter}</td>
                        <td style={{ color: 'var(--navy-400)', fontSize: '0.8125rem' }}>{r.date}</td>
                        <td><span className={`badge ${r.priority}`}>{r.priority}</span></td>
                        <td>
                          <span className={`badge ${r.status}`}>{r.status.replace('_', ' ')}</span>
                        </td>
                        <td style={{ color: r.assignedTo ? 'var(--navy-700)' : 'var(--navy-300)', fontSize: '0.8125rem' }}>
                          {r.assignedTo || '— Unassigned'}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              title="View Details"
                              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              onClick={() => { setAssignModal(r.id); setAssignStaff(r.assignedTo || ''); }}
                            >
                              <UserCheck size={12} /> {r.assignedTo ? 'Reassign' : 'Assign'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expanded === r.id && (
                        <tr>
                          <td colSpan={9} style={{ background: 'var(--green-50)', padding: '20px 24px', borderBottom: '2px solid var(--green-200)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 16 }}>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--navy-700)', lineHeight: 1.6 }}>{r.description}</p>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 6 }}>Zone / Building</div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--navy-700)', fontWeight: 600 }}>{r.zone}</p>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--navy-500)', marginTop: 4 }}>{r.location}</p>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 6 }}>Update Status</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {['pending', 'in_progress', 'resolved'].map((st) => (
                                    <button
                                      key={st}
                                      className={`btn btn-sm ${r.status === st ? 'btn-primary' : 'btn-secondary'}`}
                                      style={{ justifyContent: 'flex-start', textTransform: 'capitalize' }}
                                      onClick={() => handleStatusUpdate(r.id, st)}
                                    >
                                      {st.replace('_', ' ')}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--green-200)' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => { setAssignModal(r.id); setAssignStaff(r.assignedTo || ''); }}
                              >
                                <UserCheck size={13} /> {r.assignedTo ? 'Reassign to Staff' : 'Assign to Staff'}
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => navigate('/admin/map')}
                              >
                                View on Map
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <AlertTriangle size={40} />
                          <h4>No reports match your filters</h4>
                          <p>Try adjusting the status or priority filters above.</p>
                          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { handleStatusChange('all'); setPriorityFilter('all'); setSearch(''); }}>
                            Clear Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3>Assign to Maintenance Staff</h3>
              <button onClick={() => setAssignModal(null)} className="btn btn-secondary btn-sm btn-icon"><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--navy-500)', marginBottom: 16 }}>
              Assigning issue <strong style={{ color: 'var(--teal-700)', fontFamily: 'monospace' }}>{assignModal}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Select Staff Member</label>
              <select className="form-select" value={assignStaff} onChange={e => setAssignStaff(e.target.value)}>
                <option value="">-- Choose staff --</option>
                {MAINTENANCE_STAFF.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleAssign(assignModal)} disabled={!assignStaff}>
                Assign
              </button>
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
