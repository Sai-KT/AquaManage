import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, Lock, User, Eye, EyeOff,
  Droplets, AlertCircle, ArrowRight,
  Activity, Server, Database, Wifi
} from 'lucide-react';

// Animated floating particle component
function Particle({ style }) {
  return <div style={style} />;
}

const systemStatus = [
  { icon: Activity, label: 'Water Monitoring', status: 'Online'  },
  { icon: Server,   label: 'Data Pipeline',    status: 'Active'  },
  { icon: Database, label: 'Database',          status: 'Synced'  },
  { icon: Wifi,     label: 'Sensor Network',   status: 'Live'    },
];

// Generate static particles (stable, no random re-renders)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left:  `${(i * 37 + 11) % 100}%`,
  top:   `${(i * 53 + 7)  % 100}%`,
  size:  (i % 3 === 0) ? 3 : (i % 3 === 1) ? 2 : 1.5,
  delay: `${(i * 0.4) % 3}s`,
  dur:   `${4 + (i % 4)}s`,
  opacity: (i % 4 === 0) ? 0.5 : 0.25,
}));

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = login('admin', email, password);
    setLoading(false);
    if (result.success) navigate('/admin/dashboard');
    else setError(result.error);
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="admin-login-page" style={{
      minHeight: '100vh', minHeight: '100dvh', display: 'flex',
      fontFamily: "'Inter', sans-serif",
      background: '#010804',
      width: '100%', maxWidth: '100vw', overflowX: 'hidden',
    }}>

      {/* ════════════════════════════════════════════════
          LEFT PANEL — Atmospheric brand + system status
      ════════════════════════════════════════════════ */}
      <div className="admin-login-left" style={{
        flex: '0 0 50%',
        background: 'linear-gradient(155deg, #010e07 0%, #021407 35%, #031a0a 65%, #020f06 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0',
        position: 'relative', overflow: 'hidden',
        borderRight: '1px solid rgba(16,185,129,0.1)',
      }}>

        {/* Animated scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(16,185,129,0.012) 3px, rgba(16,185,129,0.012) 4px)',
          pointerEvents: 'none',
        }} />

        {/* Hexagonal grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, zIndex: 0 }}>
          <defs>
            <pattern id="hexL" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
              <polygon points="30,2 56,16 56,36 30,50 4,36 4,16" fill="none" stroke="#10b981" strokeWidth="0.7"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexL)"/>
        </svg>

        {/* Floating particles */}
        {PARTICLES.map(p => (
          <div key={p.id} style={{
            position: 'absolute', zIndex: 0,
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: '#34d399',
            opacity: p.opacity,
            animation: `floatUp ${p.dur} ease-in-out ${p.delay} infinite`,
          }} />
        ))}

        {/* Large central glow */}
        <div style={{
          position: 'absolute', left: '50%', top: '42%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 40%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 36px',
          borderBottom: '1px solid rgba(16,185,129,0.08)',
          position: 'relative', zIndex: 1,
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(16,185,129,0.4)' }}>
              <Droplets size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fff', letterSpacing: '-0.2px' }}>I2IT AquaManage</div>
              <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Admin Command Centre</div>
            </div>
          </div>
          {/* Live clock */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(52,211,153,0.8)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.5px' }}>{timeStr}</div>
            <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.3px' }}>{dateStr}</div>
          </div>
        </div>

        {/* ── Central hero ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', position: 'relative', zIndex: 1 }}>

          {/* Concentric ring animation around shield */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            {/* Outer pulsing ring */}
            <div style={{
              position: 'absolute', inset: -28, borderRadius: '50%',
              border: '1px solid rgba(16,185,129,0.15)',
              animation: 'ringPulse 3s ease-in-out infinite',
            }} />
            {/* Mid ring */}
            <div style={{
              position: 'absolute', inset: -16, borderRadius: '50%',
              border: '1px solid rgba(16,185,129,0.2)',
              animation: 'ringPulse 3s ease-in-out 0.5s infinite',
            }} />
            {/* Shield container */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 70%)',
              border: '1.5px solid rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 60px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <Shield size={44} style={{ color: '#34d399' }} strokeWidth={1.5} />
            </div>
          </div>

          {/* Clearance badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 4, padding: '4px 12px', marginBottom: 16,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'blink 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#34d399', letterSpacing: '2px', textTransform: 'uppercase' }}>Clearance Required</span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', lineHeight: 1.15, textAlign: 'center', margin: '0 0 12px' }}>
            Administration<br />
            <span style={{ background: 'linear-gradient(90deg,#34d399,#6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              & Facilities Control
            </span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.32)', textAlign: 'center', lineHeight: 1.7, maxWidth: 320 }}>
            This portal is restricted to authorised I2IT campus facilities officers and water system administrators only.
          </p>
        </div>

        {/* ── System status panel ── */}
        <div style={{
          margin: '0 24px 24px',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: 12, overflow: 'hidden',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(52,211,153,0.6)', letterSpacing: '1px', textTransform: 'uppercase' }}>System Status</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {systemStatus.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderRight: i % 2 === 0 ? '1px solid rgba(16,185,129,0.07)' : 'none',
                borderBottom: i < 2 ? '1px solid rgba(16,185,129,0.07)' : 'none',
              }}>
                <s.icon size={11} style={{ color: 'rgba(52,211,153,0.5)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2px' }}>{s.label}</div>
                </div>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.5px' }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT PANEL — Premium login form
      ════════════════════════════════════════════════ */}
      <div className="admin-login-right" style={{
        flex: 1,
        background: '#010a05',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px',
        position: 'relative', overflow: 'hidden',
        width: '100%', maxWidth: '100vw', boxSizing: 'border-box',
      }}>
        {/* Subtle corner glows */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>

          {/* Form header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: 5, padding: '5px 11px', marginBottom: 20,
            }}>
              <Lock size={9} style={{ color: '#34d399' }} />
              <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#34d399', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Secure Admin Access</span>
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.7px', margin: '0 0 10px', lineHeight: 1.1 }}>
              Sign In
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.27)', margin: 0, lineHeight: 1.6 }}>
              Enter your authorised credentials to access the campus water management control panel.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Official Email
                </label>
                {activeField === 'email' && (
                  <span style={{ fontSize: '0.5625rem', color: 'rgba(52,211,153,0.6)', fontWeight: 600 }}>● ACTIVE</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <User size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: activeField === 'email' ? '#34d399' : 'rgba(255,255,255,0.16)', transition: 'color 0.2s' }} />
                <input
                  type="text" placeholder="" value={email}
                  onChange={e => setEmail(e.target.value)} required autoFocus
                  onFocus={() => setActiveField('email')} onBlur={() => setActiveField(null)}
                  style={{
                    width: '100%', padding: '12px 13px 12px 38px',
                    background: activeField === 'email' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.025)',
                    border: `1.5px solid ${activeField === 'email' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 8, color: '#fff', fontSize: '0.875rem',
                    outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', caretColor: '#34d399',
                    letterSpacing: '0.1px',
                  }}
                />
                {email && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
                )}
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Password
                </label>
                {activeField === 'pwd' && (
                  <span style={{ fontSize: '0.5625rem', color: 'rgba(52,211,153,0.6)', fontWeight: 600 }}>● ACTIVE</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: activeField === 'pwd' ? '#34d399' : 'rgba(255,255,255,0.16)', transition: 'color 0.2s' }} />
                <input
                  type={showPwd ? 'text' : 'password'} placeholder="" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  onFocus={() => setActiveField('pwd')} onBlur={() => setActiveField(null)}
                  style={{
                    width: '100%', padding: '12px 40px 12px 38px',
                    background: activeField === 'pwd' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.025)',
                    border: `1.5px solid ${activeField === 'pwd' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 8, color: '#fff', fontSize: '0.875rem',
                    outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', caretColor: '#34d399',
                  }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4 }}>
                  {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                {password && (
                  <div style={{ position: 'absolute', right: 38, top: '50%', transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '11px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.16)', borderRadius: 8, marginBottom: 20, fontSize: '0.8rem', color: '#f87171', lineHeight: 1.5 }}>
                <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Authentication failed. Invalid credentials — please verify and try again.</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading
                  ? 'rgba(16,185,129,0.15)'
                  : 'linear-gradient(135deg, #065f46, #059669, #10b981)',
                border: loading ? '1px solid rgba(16,185,129,0.15)' : 'none',
                borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                transition: 'all 0.22s ease', letterSpacing: '0.3px',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'; }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Authenticating...
                </>
              ) : (
                <>Authenticate &amp; Enter <ArrowRight size={14} /></>
              )}
            </button>


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
              onClick={() => navigate('/login/maintenance')}
              style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Maintenance Login
            </button>
          </div>

          {/* Security footer */}
          <div style={{ marginTop: 24 }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.12), transparent)', marginBottom: 16 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={9} style={{ color: 'rgba(52,211,153,0.45)' }} />
                <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.3px' }}>256-bit encrypted session</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 5px #10b981' }} />
                <span style={{ fontSize: '0.625rem', color: 'rgba(52,211,153,0.5)', fontWeight: 600, letterSpacing: '0.3px' }}>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes ringPulse {
          0%,100% { transform: scale(1);   opacity: 0.6; }
          50%      { transform: scale(1.08); opacity: 0.25; }
        }
        @keyframes floatUp {
          0%,100% { transform: translateY(0) scale(1); opacity: var(--op, 0.3); }
          50%     { transform: translateY(-18px) scale(1.3); opacity: 0.08; }
        }
      `}</style>
    </div>
  );
}
