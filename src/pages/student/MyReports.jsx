import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import {
  CheckCircle,
  Clock,
  Loader,
  AlertTriangle,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  RotateCcw,
  History,
  X,
} from 'lucide-react';
import studentService from '../../services/studentService';

const steps = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

function getStepIndex(status) {
  if (status === 'pending' || status === 'reopened') return 1;
  if (status === 'in_progress') return 2;
  if (status === 'resolved') return 3;
  return 0;
}

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reopen Modal state
  const [reopenModalReport, setReopenModalReport] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenError, setReopenError] = useState('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  // Audit history state
  const [expandedHistories, setExpandedHistories] = useState({});
  const [historyData, setHistoryData] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  const fetchReports = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError('');
    try {
      const res = await studentService.getMyReports(user);
      if (res && res.success) {
        setReports(res.reports || []);
      } else {
        setError(res?.error || 'Failed to load your reports.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading reports.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(true);
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReports(false);
  };

  const openReopenModal = (report) => {
    setReopenModalReport(report);
    setReopenReason('');
    setReopenError('');
  };

  const closeReopenModal = () => {
    if (isSubmittingReopen) return;
    setReopenModalReport(null);
    setReopenReason('');
    setReopenError('');
  };

  const handleConfirmReopen = async (e) => {
    e.preventDefault();
    if (!reopenModalReport) return;

    const trimmed = reopenReason.trim();
    if (trimmed.length < 10) {
      setReopenError('Please explain why the issue is not fixed (at least 10 characters required).');
      return;
    }
    if (trimmed.length > 500) {
      setReopenError('Reopening reason cannot exceed 500 characters.');
      return;
    }

    setIsSubmittingReopen(true);
    setReopenError('');

    try {
      const res = await studentService.reopenReport(reopenModalReport.id, trimmed);
      if (res && res.success) {
        setSuccessMessage(
          `Complaint ${reopenModalReport.id} reopened successfully. The administrator will review it for reassignment.`
        );
        closeReopenModal();
        // Refresh complaint list from MySQL
        await fetchReports(false);
        // Refresh history cache for this report if loaded
        if (expandedHistories[reopenModalReport.id]) {
          await loadHistory(reopenModalReport.id);
        }
      } else {
        setReopenError(res?.error || 'Failed to reopen complaint. Please try again.');
      }
    } catch (err) {
      setReopenError(err.message || 'An unexpected error occurred while reopening the complaint.');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const toggleHistory = async (reportId) => {
    const isCurrentlyExpanded = !!expandedHistories[reportId];
    setExpandedHistories((prev) => ({
      ...prev,
      [reportId]: !isCurrentlyExpanded,
    }));

    if (!isCurrentlyExpanded && !historyData[reportId]) {
      await loadHistory(reportId);
    }
  };

  const loadHistory = async (reportId) => {
    setLoadingHistory((prev) => ({ ...prev, [reportId]: true }));
    try {
      const res = await studentService.getReportHistory(reportId);
      if (res && res.success) {
        setHistoryData((prev) => ({ ...prev, [reportId]: res.history || [] }));
      }
    } catch (err) {
      console.error('Failed to load history for report:', reportId, err);
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const formatActionName = (action) => {
    switch (action) {
      case 'created':
      case 'reported':
        return 'Complaint Submitted';
      case 'assigned':
        return 'Assigned to Maintenance';
      case 'work_note':
        return 'Maintenance Progress Note';
      case 'status_update':
        return 'Status Updated';
      case 'resolved':
        return 'Marked Resolved';
      case 'reopened':
        return 'Complaint Reopened by Student';
      default:
        return action.replace('_', ' ');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="My Reports" subtitle="Track the status of your water issue submissions" />
        <div className="page-body">
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2>My Reports</h2>
                <p>
                  {isLoading
                    ? 'Loading your reports...'
                    : `You have submitted ${reports.length} report${reports.length === 1 ? '' : 's'}. Click any card to see full details.`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Refresh Reports"
                >
                  <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/student/report')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={15} /> Report New Issue
                </button>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--green-100)',
                color: 'var(--green-800)',
                border: '1px solid var(--green-300)',
                borderRadius: 10,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} style={{ color: 'var(--green-600)', flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green-700)', padding: 4 }}
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--red-100)',
                color: 'var(--red-700)',
                borderRadius: 10,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[1, 2].map((n) => (
                <div key={n} className="card" style={{ padding: '28px', opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 80, height: 24, borderRadius: 6, background: 'var(--navy-200)', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: 100, height: 24, borderRadius: 12, background: 'var(--navy-200)', animation: 'pulse 1.5s infinite' }} />
                  </div>
                  <div style={{ width: '40%', height: 20, borderRadius: 6, background: 'var(--navy-200)', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '90%', height: 16, borderRadius: 6, background: 'var(--navy-100)', marginBottom: 20, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <Loader size={24} className="spin-icon" style={{ color: 'var(--teal-600)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="card empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <AlertTriangle size={44} style={{ color: 'var(--teal-600)', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '1.125rem', marginBottom: 6 }}>No reports yet</h4>
              <p style={{ color: 'var(--navy-500)', maxWidth: 360, margin: '0 auto 20px' }}>
                You haven't submitted any water leakage or wastage reports yet. Spot a leak on campus?
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => navigate('/student/report')}
              >
                <Plus size={14} /> Report an Issue Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {reports.map((report) => {
                const currentStep = getStepIndex(report.status);
                const isResolved = report.status === 'resolved';
                const isReopened = report.status === 'reopened';
                const isHistoryOpen = !!expandedHistories[report.id];
                const historyList = historyData[report.id] || [];
                const isLoadingHist = !!loadingHistory[report.id];

                return (
                  <div key={report.id} className="card">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: 'var(--teal-700)',
                              background: 'var(--teal-100)',
                              padding: '3px 10px',
                              borderRadius: 6,
                            }}
                          >
                            {report.id}
                          </span>
                          <span className={`badge ${report.status}`}>{report.status.replace('_', ' ')}</span>
                          {report.priority && (
                            <span className={`badge ${report.priority}`}>{report.priority}</span>
                          )}
                        </div>
                        <h3 style={{ marginBottom: 4 }}>{report.type}</h3>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--navy-400)' }}>
                          📍 {report.location} &nbsp;·&nbsp; 📅 {report.date}
                        </div>
                      </div>
                      {isResolved && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-600)', fontWeight: 600, fontSize: '0.875rem' }}>
                          <CheckCircle size={18} /> Resolved
                        </div>
                      )}
                      {isReopened && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c2410c', fontWeight: 600, fontSize: '0.875rem' }}>
                          <RotateCcw size={16} /> Reopened
                        </div>
                      )}
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--navy-600)', marginBottom: 20, lineHeight: 1.6 }}>
                      {report.description}
                    </p>

                    {/* Attached Media */}
                    {(report.photo || report.video) && (
                      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        {report.photo && (
                          <a href={report.photo} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                background: 'var(--navy-100)',
                                borderRadius: 8,
                                fontSize: '0.75rem',
                                color: 'var(--navy-700)',
                                fontWeight: 600,
                              }}
                            >
                              <ImageIcon size={14} style={{ color: 'var(--teal-600)' }} /> View Attached Photo
                            </div>
                          </a>
                        )}
                        {report.video && (
                          <a href={report.video} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                background: 'var(--navy-100)',
                                borderRadius: 8,
                                fontSize: '0.75rem',
                                color: 'var(--navy-700)',
                                fontWeight: 600,
                              }}
                            >
                              📹 View Attached Video
                            </div>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Status Steps */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }}>
                      {steps.map((step, i) => (
                        <React.Fragment key={step}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                marginBottom: 6,
                                background:
                                  i < currentStep
                                    ? 'var(--green-500)'
                                    : i === currentStep
                                    ? isReopened
                                      ? '#f97316'
                                      : 'var(--teal-500)'
                                    : 'var(--navy-100)',
                                color: i <= currentStep ? '#fff' : 'var(--navy-400)',
                                boxShadow: i === currentStep ? '0 0 0 4px rgba(14,165,233,0.2)' : 'none',
                                transition: 'all 0.3s ease',
                                zIndex: 1,
                                position: 'relative',
                              }}
                            >
                              {i < currentStep ? (
                                <CheckCircle size={16} />
                              ) : i === currentStep ? (
                                isReopened ? <RotateCcw size={14} /> : <Loader size={14} />
                              ) : (
                                i + 1
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                textAlign: 'center',
                                color:
                                  i < currentStep
                                    ? 'var(--green-600)'
                                    : i === currentStep
                                    ? isReopened
                                      ? '#c2410c'
                                      : 'var(--teal-600)'
                                    : 'var(--navy-400)',
                              }}
                            >
                              {step === 'Under Review' && isReopened ? 'Under Review (Reopened)' : step}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div
                              style={{
                                height: 2,
                                flex: 1,
                                marginBottom: 28,
                                background: i < currentStep ? 'var(--green-400)' : 'var(--navy-200)',
                                transition: 'background 0.3s ease',
                              }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Status Message Banners */}
                    {isReopened ? (
                      <div
                        style={{
                          marginTop: 16,
                          padding: '12px 16px',
                          background: '#fff7ed',
                          border: '1.5px solid #fdba74',
                          borderRadius: 8,
                          fontSize: '0.8125rem',
                          color: '#9a3412',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <AlertTriangle size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
                        <div>
                          <strong>Reopened — Waiting for administrator review:</strong> Your complaint has returned to the administrator for review and reassignment to maintenance staff.
                        </div>
                      </div>
                    ) : report.status !== 'resolved' ? (
                      <div
                        style={{
                          marginTop: 16,
                          padding: '10px 14px',
                          background: 'var(--teal-100)',
                          borderRadius: 8,
                          fontSize: '0.8125rem',
                          color: 'var(--teal-700)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Clock size={14} />
                        Expected response within 24 hours. Thank you for your patience!
                      </div>
                    ) : null}

                    {/* Card Actions Footer */}
                    <div
                      style={{
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: '1px solid var(--navy-100)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}
                        onClick={() => toggleHistory(report.id)}
                      >
                        <History size={14} />
                        <span>{isHistoryOpen ? 'Hide History & Timeline' : 'View History & Activity'}</span>
                      </button>

                      {/* Rule B: Reopen button appears ONLY when status is resolved */}
                      {isResolved && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#fff7ed',
                            color: '#c2410c',
                            border: '1.5px solid #f97316',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            padding: '7px 14px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ffedd5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff7ed';
                          }}
                          onClick={() => openReopenModal(report)}
                        >
                          <RotateCcw size={14} />
                          <span>Still Not Fixed? Reopen Complaint</span>
                        </button>
                      )}
                    </div>

                    {/* Expandable Chronological Activity / History Panel */}
                    {isHistoryOpen && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: '16px',
                          background: 'var(--navy-50, #f8fafc)',
                          borderRadius: 8,
                          border: '1px solid var(--navy-200)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--navy-800)' }}>
                            Chronological Activity History
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--navy-400)' }}>
                            {historyList.length} recorded event{historyList.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {isLoadingHist ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 8, color: 'var(--navy-500)', fontSize: '0.8125rem' }}>
                            <Loader size={16} className="spin-icon" />
                            <span>Loading complaint history...</span>
                          </div>
                        ) : historyList.length === 0 ? (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--navy-500)', margin: 0 }}>
                            No detailed history records logged yet.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {historyList.map((evt, idx) => (
                              <div
                                key={evt.id || idx}
                                style={{
                                  padding: '10px 14px',
                                  background: evt.action === 'reopened' ? '#fff7ed' : '#ffffff',
                                  border: evt.action === 'reopened' ? '1px solid #fdba74' : '1px solid var(--navy-200)',
                                  borderRadius: 6,
                                  fontSize: '0.8125rem',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                                  <span style={{ fontWeight: 700, color: evt.action === 'reopened' ? '#c2410c' : 'var(--navy-800)' }}>
                                    {evt.action === 'reopened' && '⚠️ '}
                                    {formatActionName(evt.action)}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--navy-400)' }}>
                                    {new Date(evt.created_at).toLocaleString([], {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })}
                                  </span>
                                </div>
                                {evt.actor_name && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', marginBottom: evt.notes ? 4 : 0 }}>
                                    By: {evt.actor_name}
                                  </div>
                                )}
                                {evt.notes && (
                                  <div style={{ fontSize: '0.8125rem', color: 'var(--navy-700)', lineHeight: 1.5 }}>
                                    {evt.action === 'reopened' ? <strong>Reopening Reason: </strong> : null}
                                    {evt.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          <div
            style={{
              marginTop: 24,
              padding: '20px 24px',
              background: 'var(--green-50)',
              borderRadius: 16,
              border: '1px solid var(--green-200)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--green-800)', marginBottom: 4 }}>See another issue on campus?</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--green-700)' }}>Help keep IIIT water systems efficient — every report counts!</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/student/report')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* Reopening Modal Dialog */}
      {reopenModalReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReopenModal();
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              padding: 0,
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--navy-100)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff7ed',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#ffedd5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c2410c',
                  }}
                >
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#9a3412' }}>Reopen Complaint</h3>
                  <div style={{ fontSize: '0.75rem', color: '#c2410c' }}>
                    Reference: {reopenModalReport.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReopenModal}
                disabled={isSubmittingReopen}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--navy-400)',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmReopen} style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--navy-600)', marginBottom: 18, lineHeight: 1.5 }}>
                Is this issue still unresolved? Tell us what went wrong so maintenance can review it again.
              </p>

              {/* Read-only Information Pills */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 18,
                  padding: '12px 14px',
                  background: 'var(--navy-50, #f8fafc)',
                  borderRadius: 8,
                  border: '1px solid var(--navy-200)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--navy-400)', fontWeight: 700 }}>
                    Location
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--navy-700)', marginTop: 2 }}>
                    {reopenModalReport.location}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--navy-400)', fontWeight: 700 }}>
                    Previous Status
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--green-700)', marginTop: 2 }}>
                    Resolved
                  </div>
                </div>
              </div>

              {/* Reopening Reason Field */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="reopen-reason-input"
                  style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: 6 }}
                >
                  Reason for Reopening <span style={{ color: 'var(--red-500)' }}>*</span>
                </label>
                <textarea
                  id="reopen-reason-input"
                  rows={4}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: reopenError ? '1.5px solid var(--red-500)' : '1.5px solid var(--navy-300)',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  placeholder="Explain why this issue is still unresolved (e.g., tap is still leaking after technician repair)..."
                  value={reopenReason}
                  onChange={(e) => {
                    setReopenReason(e.target.value);
                    if (reopenError) setReopenError('');
                  }}
                  disabled={isSubmittingReopen}
                  maxLength={500}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.75rem' }}>
                  <span style={{ color: reopenReason.trim().length < 10 ? 'var(--amber-600)' : 'var(--green-600)' }}>
                    {reopenReason.trim().length < 10
                      ? `Minimum 10 characters required (${10 - reopenReason.trim().length} more needed)`
                      : 'Requirement met'}
                  </span>
                  <span style={{ color: 'var(--navy-400)' }}>
                    {reopenReason.trim().length} / 500 characters
                  </span>
                </div>
              </div>

              {/* Error Message inside modal */}
              {reopenError && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--red-100)',
                    color: 'var(--red-700)',
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{reopenError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeReopenModal}
                  disabled={isSubmittingReopen}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    boxShadow: '0 2px 10px rgba(234, 88, 12, 0.3)',
                    border: 'none',
                  }}
                  disabled={isSubmittingReopen || reopenReason.trim().length < 10 || reopenReason.trim().length > 500}
                >
                  {isSubmittingReopen ? (
                    <>
                      <Loader size={14} className="spin-icon" /> Reopening...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} /> Confirm Reopening
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
