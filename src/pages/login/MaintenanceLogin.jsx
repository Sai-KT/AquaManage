import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HardHat, Lock, User, Eye, EyeOff,
  Droplets, AlertCircle, ArrowRight,
  Wrench, ClipboardList, CheckSquare
} from 'lucide-react';

export default function MaintenanceLogin() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  React.useEffect(() => {
    if (user && user.role === 'maintenance') {
      navigate('/maintenance/tasks', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const result = login('maintenance', empId, password);
    setLoading(false);
    if (result.success) navigate('/maintenance/tasks');
    else setError(result.error);
  };

  return (
    <div className="maintenance-login-page" style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      fontFamily: "'Inter', sans-serif",
      background: '#0e0900',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
    }}>

      {/* ── Full-page diagonal hazard stripes (very subtle) ── */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'repeating-linear-gradient(55deg, #f59e0b 0px, #f59e0b 10px, transparent 10px, transparent 30px)',
        pointerEvents: 'none',
      }} />

      {/* ── Background amber glow blobs ── */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* ══════════════════════════════════════════
          TOP BANNER — Full-width amber header
      ══════════════════════════════════════════ */}
      <div className="maintenance-banner" style={{
        width: '100%',
        background: 'linear-gradient(135deg, #451a00 0%, #78350f 40%, #92400e 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.25)',
        padding: '0',
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Banner inner gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)', pointerEvents: 'none' }} />

        {/* Diagonal lines on banner */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'repeating-linear-gradient(55deg, #fbbf24 0px, #fbbf24 1px, transparent 1px, transparent 22px)', pointerEvents: 'none' }} />

        {/* Bottom amber glow line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #fbbf24 30%, #f59e0b 70%, transparent)' }} />

        <div className="maintenance-banner-inner" style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '36px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Brand + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* HardHat icon */}
            <div style={{
              width: 70, height: 70, borderRadius: 20,
              background: 'rgba(251,191,36,0.15)',
              border: '1.5px solid rgba(251,191,36,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 24px rgba(245,158,11,0.2)',
            }}>
              <HardHat size={34} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets size={14} color="#fff" />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(251,191,36,0.7)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>I2IT AquaManage</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.6px', margin: '0 0 4px', lineHeight: 1.1 }}>
                Maintenance Staff Portal
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                Field operations access for authorised maintenance personnel
              </p>
            </div>
          </div>

          {/* Right: Capability chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {[
              { icon: ClipboardList, label: 'Work Orders'   },
              { icon: Wrench,        label: 'Field Repairs' },
              { icon: CheckSquare,   label: 'Mark Resolved' },
            ].map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(251,191,36,0.15)',
                borderRadius: 8, padding: '6px 12px',
              }}>
                <c.icon size={12} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BOTTOM — Login form area
      ══════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative', zIndex: 1,
      }}>
        <div className="maintenance-card-box" style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(245,158,11,0.035)',
          border: '1px solid rgba(245,158,11,0.12)',
          borderRadius: 18, padding: '40px 40px',
          boxShadow: '0 24px 72px rgba(0,0,0,0.6)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle top bar on card */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)' }} />

          <div style={{ marginBottom: 30 }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(245,158,11,0.55)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
              Staff Authentication
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: '0 0 6px' }}>Sign In to Continue</h2>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.28)', margin: 0 }}>Use your assigned employee credentials</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Employee ID */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.38)', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Employee ID
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: focusedField === 'emp' ? '#fbbf24' : 'rgba(255,255,255,0.18)', transition: 'color 0.2s' }} />
                <input
                  type="text" placeholder="" value={empId}
                  onChange={e => setEmpId(e.target.value)} required autoFocus
                  onFocus={() => setFocusedField('emp')} onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%', padding: '12px 13px 12px 40px',
                    background: focusedField === 'emp' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${focusedField === 'emp' ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: '#fff', fontSize: '0.9rem',
                    outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', caretColor: '#fbbf24',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 26 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.38)', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: focusedField === 'pwd' ? '#fbbf24' : 'rgba(255,255,255,0.18)', transition: 'color 0.2s' }} />
                <input
                  type={showPwd ? 'text' : 'password'} placeholder="" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  onFocus={() => setFocusedField('pwd')} onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%', padding: '12px 40px 12px 40px',
                    background: focusedField === 'pwd' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${focusedField === 'pwd' ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: '#fff', fontSize: '0.9rem',
                    outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', caretColor: '#fbbf24',
                  }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', padding: 4 }}>
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.17)', borderRadius: 9, marginBottom: 18, fontSize: '0.8rem', color: '#f87171' }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg,#d97706,#f59e0b)',
                border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 18px rgba(245,158,11,0.22)', transition: 'all 0.22s ease',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 26px rgba(245,158,11,0.38)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(245,158,11,0.22)'; }}
            >
              {loading
                ? <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Verifying...</>
                : <>Access Maintenance Portal <ArrowRight size={15} /></>}
            </button>

            {/* Demo Credentials Hint */}
            <div style={{
              marginTop: 18, padding: '10px 12px',
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                Demo: <code style={{ color: '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 4 }}>EMP-01</code> / <code style={{ color: '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 4 }}>Maint@1234</code>
              </div>
              <button
                type="button"
                onClick={() => { setEmpId('EMP-01'); setPassword('Maint@1234'); }}
                style={{
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 5, color: '#fbbf24', fontSize: '0.65rem', fontWeight: 700,
                  padding: '3px 8px', cursor: 'pointer',
                }}
              >
                Auto-fill
              </button>
            </div>
          </form>

          {/* Portal Switcher */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>Switch portal:</span>
            <button
              onClick={() => navigate('/login/student')}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', marginRight: 12 }}
            >
              Student Login
            </button>
            <button
              onClick={() => navigate('/login/admin')}
              style={{ background: 'none', border: 'none', color: '#34d399', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Admin Login
            </button>
          </div>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.13)' }}>I2IT Hinjewadi · Field Ops</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px rgba(245,158,11,0.7)' }} />
              <span style={{ fontSize: '0.6875rem', color: 'rgba(245,158,11,0.5)', fontWeight: 600 }}>Online</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
