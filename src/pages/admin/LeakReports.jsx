import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import {
  AlertTriangle,
  Download,
  Search,
  Eye,
  UserCheck,
  ChevronLeft,
  X,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import adminService from '../../services/adminService';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function LeakReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting state: default is date descending (newest first)
  const [sortField, setSortField] = useState('date'); // 'date' | 'priority' | 'id'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

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

  const loadData = async () => {
    setIsLoading(true);
    const [reportsRes, staffRes] = await Promise.all([
      adminService.getLeakReports(),
      adminService.getMaintenanceStaff(),
    ]);
    if (reportsRes && reportsRes.success && reportsRes.reports) {
      setReports(reportsRes.reports);
    } else {
      setReports([]);
    }
    if (staffRes && staffRes.success && staffRes.staff) {
      setStaffList(staffRes.staff);
    } else {
      setStaffList([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync filter to URL
  const handleStatusChange = (val) => {
    setStatusFilter(val);
    if (val !== 'all') setSearchParams({ status: val });
    else setSearchParams({});
  };

  // Resolve "active" = pending + in_progress + reopened
  const matchesStatus = (r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return r.status === 'pending' || r.status === 'in_progress' || r.status === 'reopened';
    if (statusFilter === 'pending') return r.status === 'pending' || r.status === 'reopened';
    return r.status === statusFilter;
  };

  // Helpers for date and time parsing and formatting
  const getTimeValue = (report) => {
    const val = report.created_at || report.reported_at || report.date;
    if (!val) return 0;
    const time = new Date(val).getTime();
    return isNaN(time) ? 0 : time;
  };

  const formatDisplayDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).split('T')[0] || String(val);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDisplayTime = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && (val.includes('AM') || val.includes('PM'))) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleColumnSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const filtered = reports
    .filter(matchesStatus)
    .filter((r) => priorityFilter === 'all' || r.priority === priorityFilter)
    .filter((r) => zoneFilter === 'all' || r.zone === zoneFilter)
    .filter((r) =>
      !search ||
      (r.id && r.id.toLowerCase().includes(search.toLowerCase())) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase())) ||
      (r.reporter && r.reporter.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortField === 'date') {
        const tA = getTimeValue(a);
        const tB = getTimeValue(b);
        if (tA !== tB) {
          return sortOrder === 'asc' ? tA - tB : tB - tA;
        }
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      }
      if (sortField === 'priority') {
        const pA = PRIORITY_ORDER[a.priority] ?? 9;
        const pB = PRIORITY_ORDER[b.priority] ?? 9;
        if (pA !== pB) {
          return sortOrder === 'asc' ? pB - pA : pA - pB;
        }
        return getTimeValue(b) - getTimeValue(a);
      }
      if (sortField === 'id') {
        const cmp = (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return 0;
    });

  const zones = [...new Set(reports.map((r) => r.zone))];

  const getTitle = () => {
    if (statusFilter === 'active') return `Active Leak Reports (${filtered.length})`;
    if (statusFilter === 'resolved') return `Resolved Issues (${filtered.length})`;
    if (statusFilter === 'pending') return `Pending Reports (${filtered.length})`;
    if (statusFilter === 'in_progress') return `In-Progress Issues (${filtered.length})`;
    if (statusFilter === 'reopened') return `Reopened Complaints (${filtered.length})`;
    return 'All Leak Reports';
  };

  const handleAssign = async (reportId) => {
    if (!assignStaff) return;
    await adminService.assignReport(reportId, assignStaff);
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, assignedTo: assignStaff, status: 'in_progress' } : r)
    );
    setAssignModal(null);
    setAssignStaff('');
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    await adminService.updateReportStatus(reportId, newStatus);
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
    );
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Report ID', 'Type', 'Location', 'Zone', 'Reporter', 'Date', 'Time', 'Priority', 'Status', 'Assigned Staff', 'Description'];
    const rows = filtered.map(r => [
      `"${r.id || ''}"`,
      `"${(r.type || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.zone || '').replace(/"/g, '""')}"`,
      `"${(r.reporter || '').replace(/"/g, '""')}"`,
      `"${formatDisplayDate(r.created_at || r.reported_at || r.date)}"`,
      `"${formatDisplayTime(r.time || r.created_at || r.reported_at || '')}"`,
      `"${r.priority || ''}"`,
      `"${r.status || ''}"`,
      `"${(r.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `iiit_leak_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar title="Leak Reports — IIIT Campus" subtitle="All reported water issues" />
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
                <p>Manage and track all water issue reports across IIIT campus. Assign to maintenance staff as needed.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={loadData}
                  disabled={isLoading}
                  title="Refresh Reports"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                  title="Download CSV export of currently filtered leak reports"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="stat-cards-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Reports',  value: reports.length,                                                      color: 'teal',  filter: 'all'         },
              { label: 'Active',         value: reports.filter(r => r.status !== 'resolved').length,                 color: 'red',   filter: 'active'      },
              { label: 'Pending',        value: reports.filter(r => r.status === 'pending').length,                  color: 'amber', filter: 'pending'     },
              { label: 'In Progress',    value: reports.filter(r => r.status === 'in_progress').length,              color: 'teal',  filter: 'in_progress' },
              { label: 'Reopened',       value: reports.filter(r => r.status === 'reopened').length,                 color: 'amber', filter: 'reopened'    },
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
              <option value="reopened">Reopened</option>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 8, padding: '2px 8px', border: '1.5px solid var(--navy-200)' }}>
              <ArrowUpDown size={14} style={{ color: 'var(--navy-400)', flexShrink: 0 }} />
              <select
                className="form-select"
                value={`${sortField}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortField(field);
                  setSortOrder(order);
                }}
                title="Sort leak reports by date, time, priority, or ID"
                style={{ border: 'none', background: 'transparent', padding: '6px 4px', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="date_desc">Sort: Date & Time (Newest First)</option>
                <option value="date_asc">Sort: Date & Time (Oldest First)</option>
                <option value="priority_desc">Sort: Priority (High → Low)</option>
                <option value="priority_asc">Sort: Priority (Low → High)</option>
                <option value="id_asc">Sort: ID (Ascending)</option>
                <option value="id_desc">Sort: ID (Descending)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleColumnSort('id')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      title="Click to sort by ID"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>ID</span>
                        {sortField === 'id' ? (
                          sortOrder === 'asc' ? <ArrowUp size={12} style={{ color: 'var(--teal-600)' }} /> : <ArrowDown size={12} style={{ color: 'var(--teal-600)' }} />
                        ) : (
                          <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Reporter</th>
                    <th
                      onClick={() => handleColumnSort('date')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      title="Click to sort by Date and Time"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>Date & Time</span>
                        {sortField === 'date' ? (
                          sortOrder === 'desc' ? <ArrowDown size={13} style={{ color: 'var(--teal-600)' }} /> : <ArrowUp size={13} style={{ color: 'var(--teal-600)' }} />
                        ) : (
                          <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleColumnSort('priority')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      title="Click to sort by Priority"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>Priority</span>
                        {sortField === 'priority' ? (
                          sortOrder === 'desc' ? <ArrowDown size={13} style={{ color: 'var(--teal-600)' }} /> : <ArrowUp size={13} style={{ color: 'var(--teal-600)' }} />
                        ) : (
                          <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
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
                        <td style={{ verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--navy-700)', whiteSpace: 'nowrap' }}>
                              📅 {formatDisplayDate(r.created_at || r.reported_at || r.date)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--navy-400)', whiteSpace: 'nowrap' }}>
                              🕐 {formatDisplayTime(r.time || r.created_at || r.reported_at) || '—'}
                            </span>
                          </div>
                        </td>
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
                            {r.status === 'reopened' && (
                              <div style={{
                                padding: '12px 16px',
                                background: '#fff7ed',
                                border: '1.5px solid #fb923c',
                                borderRadius: 8,
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                              }}>
                                <AlertTriangle size={18} style={{ color: '#ea580c', flexShrink: 0, marginTop: 2 }} />
                                <div>
                                  <div style={{ fontWeight: 700, color: '#c2410c', fontSize: '0.875rem', marginBottom: 2 }}>
                                    ⚠️ Reopened Complaint — Requires Reassignment
                                  </div>
                                  <div style={{ fontSize: '0.8125rem', color: '#7c2d12', lineHeight: 1.5 }}>
                                    <strong>Student Reopening Reason:</strong> {r.latest_note || 'Issue remains unresolved after previous maintenance repair.'}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#9a3412', marginTop: 4 }}>
                                    Assign this complaint to a technician below to initiate another maintenance cycle.
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="responsive-grid-3" style={{ marginBottom: 16 }}>
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
                {staffList.map(s => <option key={s} value={s}>{s}</option>)}
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
