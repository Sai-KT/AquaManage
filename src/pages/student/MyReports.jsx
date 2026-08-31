import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { CheckCircle, Clock, Loader, AlertTriangle, Plus } from 'lucide-react';
import { myReports } from '../../data/mockData';

const steps = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

function getStepIndex(status) {
  if (status === 'pending')     return 1;
  if (status === 'in_progress') return 2;
  if (status === 'resolved')    return 3;
  return 0;
}

export default function MyReports() {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="My Reports" subtitle="Track the status of your water issue submissions" />
        <div className="page-body">
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>My Reports</h2>
                <p>You have submitted {myReports.length} reports. Click any card to see full details.</p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/student/report')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} /> Report New Issue
              </button>
            </div>
          </div>

          {myReports.length === 0 ? (
            <div className="card empty-state">
              <AlertTriangle size={40} />
              <h4>No reports yet</h4>
              <p>You haven't submitted any issues yet.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => navigate('/student/report')}
              >
                <Plus size={14} /> Report an Issue
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {myReports.map((report) => {
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

                    <p style={{ fontSize: '0.875rem', color: 'var(--navy-600)', marginBottom: 24, lineHeight: 1.6 }}>
                      {report.description}
                    </p>

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
          <div style={{ marginTop: 24, padding: '20px 24px', background: 'var(--green-50)', borderRadius: 16, border: '1px solid var(--green-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
