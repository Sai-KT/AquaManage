import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, User, Droplets, CheckCircle,
  CloudRain, FileText, ArrowRight, Leaf, Star,
  IdCard, AlertCircle
} from 'lucide-react';

const features = [
  { icon: FileText,    title: 'Report Issues',      desc: 'Spot a leak or overflow? Report it in seconds from anywhere on campus' },
  { icon: CheckCircle, title: 'Track Your Reports', desc: 'See live status updates as maintenance resolves your reported issues' },
  { icon: CloudRain,   title: 'Harvesting Status',  desc: 'Check real-time rainwater harvesting levels across I2IT buildings' },
];

const campusStats = [
  { value: '2.4M', label: 'Litres Saved',    icon: Droplets },
  { value: '87%',  label: 'Efficiency',       icon: Leaf     },
  { value: '48',   label: 'Issues Resolved',  icon: CheckCircle },
];

export default function StudentLogin() {
  const navigate = useNavigate();
  const { user, loginStudent } = useAuth();
  const [name, setName] = useState('');
  const [irnNo, setIrnNo] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user && user.role === 'student') {
      navigate('/student/report', { replace: true });
    }
  }, [user, navigate]);

  const handleContinue = (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name (compulsory).');
      return;
    }
    if (!irnNo.trim()) {
      setError('Please enter your IRN No. (compulsory).');
      return;
    }
    setError('');
    loginStudent(name, irnNo);
    navigate('/student/report');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ─────── LEFT PANEL — Friendly student branding ─────── */}
      <div style={{
        flex: '1 1 55%',
        background: 'linear-gradient(145deg, #020d18 0%, #061a2e 40%, #0a2540 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated water ripple orbs */}
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          top: -120, left: -120,
          background: 'radial-gradient(circle, rgba(14,165,233,0.13) 0%, transparent 65%)',
          animation: 'floatOrb 7s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 350, height: 350, borderRadius: '50%',
          bottom: -80, right: -60,
          background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 65%)',
          animation: 'floatOrb 9s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', width: 180, height: 180, borderRadius: '50%',
          top: '55%', right: '8%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
          animation: 'floatOrb 5s ease-in-out infinite 2s',
        }} />

        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.14, backgroundImage: 'radial-gradient(rgba(14,165,233,0.55) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />

        {/* Wave decoration at bottom */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.12 }} viewBox="0 0 800 120" fill="none">
          <path d="M0 60C133 20 267 100 400 60C533 20 667 100 800 60V120H0V60Z" fill="#38bdf8" />
          <path d="M0 80C133 40 267 110 400 80C533 40 667 110 800 80V120H0V80Z" fill="#34d399" />
        </svg>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Animated logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 52 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 28px rgba(14,165,233,0.45)',
              animation: 'logoBounce 2.5s ease-in-out infinite',
              cursor: 'pointer',
            }}>
              <Droplets size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.4px' }}>I2IT AquaManage</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 2 }}>Campus Water System</div>
            </div>
          </div>

          {/* Student badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.22)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 22,
          }}>
            <Star size={10} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Student &amp; Staff Portal</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: '2.625rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px', margin: '0 0 18px' }}>
            Be the Change<br />
            <span style={{ background: 'linear-gradient(90deg, #38bdf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Save Campus Water
            </span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.75, maxWidth: 400, marginBottom: 44 }}>
            Every report counts. Help I2IT campus stay water-efficient by reporting leaks, tracking repairs, and staying informed.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 44 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={15} style={{ color: '#38bdf8' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.36)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Public campus stats */}
          <div style={{ display: 'flex', gap: 14 }}>
            {campusStats.map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '14px 12px',
                background: 'rgba(14,165,233,0.07)',
                border: '1px solid rgba(14,165,233,0.15)',
                borderRadius: 12, textAlign: 'center',
              }}>
                <s.icon size={14} style={{ color: '#38bdf8', marginBottom: 6 }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.32)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────── RIGHT PANEL — Login form ─────── */}
      <div style={{
        flex: '1 1 45%', maxWidth: 520,
        background: '#060e18',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 48px',
        borderLeft: '1px solid rgba(14,165,233,0.1)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', top: -70, right: -70, background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', bottom: -40, left: -40, background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
          {/* Animated logo on right panel too */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 78, height: 78, borderRadius: 24, margin: '0 auto 18px',
              background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(16,185,129,0.08))',
              border: '1.5px solid rgba(14,165,233,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 48px rgba(14,165,233,0.14)',
              animation: 'logoBounce 2.5s ease-in-out infinite 0.5s',
            }}>
              <BookOpen size={34} style={{ color: '#38bdf8' }} />
            </div>
            <h2 style={{ fontSize: '1.4375rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Student Sign In</h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.32)', margin: 0, lineHeight: 1.6 }}>
              Enter your Name and IRN No. to access the student portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleContinue}>
            {/* Name field */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.2px' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: focusedField === 'name' ? '#38bdf8' : 'rgba(255,255,255,0.22)', transition: 'color 0.2s',
                }} />
                <input
                  type="text" placeholder="e.g. Arjun Mehta"
                  value={name} onChange={e => { setName(e.target.value); if (error) setError(''); }}
                  onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                  autoFocus required
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px',
                    background: focusedField === 'name' ? 'rgba(14,165,233,0.07)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${focusedField === 'name' ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: 12, color: '#fff', fontSize: '0.9375rem',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s ease', caretColor: '#38bdf8',
                  }}
                />
              </div>
            </div>

            {/* IRN No. field */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.2px' }}>
                IRN No. / PRN No. <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <IdCard size={15} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: focusedField === 'irn' ? '#38bdf8' : 'rgba(255,255,255,0.22)', transition: 'color 0.2s',
                }} />
                <input
                  type="text" placeholder="e.g. IRN2024891"
                  value={irnNo} onChange={e => { setIrnNo(e.target.value); if (error) setError(''); }}
                  onFocus={() => setFocusedField('irn')} onBlur={() => setFocusedField(null)}
                  required
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px',
                    background: focusedField === 'irn' ? 'rgba(14,165,233,0.07)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${focusedField === 'irn' ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: 12, color: '#fff', fontSize: '0.9375rem',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s ease', caretColor: '#38bdf8',
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 18, fontSize: '0.8125rem', color: '#f87171' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* CTA button */}
            <button
              type="submit"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontWeight: 700, fontSize: '0.9375rem',
                cursor: 'pointer', letterSpacing: '0.2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isHovered ? '0 8px 32px rgba(14,165,233,0.55)' : '0 4px 20px rgba(14,165,233,0.35)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.22s ease',
              }}
            >
              Continue to Student Portal
              <ArrowRight size={16} style={{ animation: isHovered ? 'slideRight 0.4s ease infinite alternate' : 'none' }} />
            </button>

            {/* Demo Auto-fill Hint */}
            <div style={{
              marginTop: 16, padding: '10px 12px',
              background: 'rgba(14,165,233,0.06)',
              border: '1px solid rgba(14,165,233,0.18)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                Demo: <code style={{ color: '#38bdf8', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 4 }}>Arjun Mehta</code> / <code style={{ color: '#38bdf8', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 4 }}>IRN2024891</code>
              </div>
              <button
                type="button"
                onClick={() => { setName('Arjun Mehta'); setIrnNo('IRN2024891'); setError(''); }}
                style={{
                  background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)',
                  borderRadius: 6, color: '#38bdf8', fontSize: '0.65rem', fontWeight: 700,
                  padding: '3px 8px', cursor: 'pointer',
                }}
              >
                Auto-fill
              </button>
            </div>
          </form>

          {/* Portal Switcher */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>Staff & Ops login:</span>
            <button
              onClick={() => navigate('/login/maintenance')}
              style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', marginRight: 12 }}
            >
              Maintenance Login
            </button>
            <button
              onClick={() => navigate('/login/admin')}
              style={{ background: 'none', border: 'none', color: '#34d399', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Admin Login
            </button>
          </div>

          {/* Verification badge */}
          <div style={{
            marginTop: 20, padding: '11px 16px',
            background: 'rgba(14,165,233,0.06)',
            border: '1px solid rgba(14,165,233,0.15)',
            borderRadius: 10, textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              🆔 <strong style={{ color: '#38bdf8' }}>Verified Portal</strong> — Name &amp; IRN No. mandatory for campus issue reporting
            </div>
          </div>

          {/* Footer status */}
          <div style={{ marginTop: 36, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.75rem', color: 'rgba(16,185,129,0.75)', fontWeight: 600 }}>System Online</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.14)' }}>I2IT Hinjewadi · Campus Water Management</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes logoBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(12px, -18px) scale(1.03); }
          66%       { transform: translate(-8px, 10px) scale(0.97); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes slideRight {
          from { transform: translateX(0); }
          to   { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
