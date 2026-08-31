import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { CheckCircle, Clock, Loader, AlertTriangle, Plus, RefreshCw, Image as ImageIcon } from 'lucide-react';
import studentService from '../../services/studentService';

const steps = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

function getStepIndex(status) {
  if (status === 'pending')     return 1;
  if (status === 'in_progress') return 2;
  if (status === 'resolved')    return 3;
  return 0;
}

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
                  {isLoading ? 'Loading your reports...' : `You have submitted ${reports.length} report${reports.length === 1 ? '' : 's'}. Click any card to see full details.`}
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

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--red-100)', color: 'var(--red-700)', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
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
                return (
                  <div key={report.id} className="card">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 700,
                            color: 'var(--teal-700)', background: 'var(--teal-100)',
                            padding: '3px 10px', borderRadius: 6,
                          }}>
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
                      {report.status === 'resolved' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-600)', fontWeight: 600, fontSize: '0.875rem' }}>
                          <CheckCircle size={18} /> Resolved
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--navy-100)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600 }}>
                              <ImageIcon size={14} style={{ color: 'var(--teal-600)' }} /> View Attached Photo
                            </div>
                          </a>
                        )}
                        {report.video && (
                          <a href={report.video} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--navy-100)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600 }}>
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
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 700, marginBottom: 6,
                              background: i < currentStep ? 'var(--green-500)' : i === currentStep ? 'var(--teal-500)' : 'var(--navy-100)',
                              color: i <= currentStep ? '#fff' : 'var(--navy-400)',
                              boxShadow: i === currentStep ? '0 0 0 4px rgba(14,165,233,0.2)' : 'none',
                              transition: 'all 0.3s ease',
                              zIndex: 1, position: 'relative',
                            }}>
                              {i < currentStep
                                ? <CheckCircle size={16} />
                                : i === currentStep
                                  ? <Loader size={14} />
                                  : i + 1
                              }
                            </div>
                            <span style={{
                              fontSize: '0.6875rem', fontWeight: 600, textAlign: 'center',
                              color: i < currentStep ? 'var(--green-600)' : i === currentStep ? 'var(--teal-600)' : 'var(--navy-400)',
                            }}>
                              {step}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div style={{
                              height: 2, flex: 1, marginBottom: 28,
                              background: i < currentStep ? 'var(--green-400)' : 'var(--navy-200)',
                              transition: 'background 0.3s ease',
                            }} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {report.status !== 'resolved' && (
                      <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--teal-100)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--teal-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={14} />
                        Expected response within 24 hours. Thank you for your patience!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          <div style={{ marginTop: 24, padding: '20px 24px', background: 'var(--green-50)', borderRadius: 16, border: '1px solid var(--green-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
    </div>
  );
}
