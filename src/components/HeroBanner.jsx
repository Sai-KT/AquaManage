/**
 * HeroBanner.jsx
 *
 * Role-specific premium hero banner rendered at the top of each dashboard.
 * Admin   → deep emerald command-centre feel with live clock + particle dots
 * Maintenance → amber industrial with shift info + today's date
 * Student → ocean blue with motivational copy + quick action chips
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield, HardHat, BookOpen,
  Clock, Calendar, Activity,
  ArrowRight, Droplets, Map,
  FileText, CheckCircle, Zap
} from 'lucide-react';

// ── Tiny static particles (stable across renders) ─────────────────────────────
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left:  `${(i * 43 + 9) % 100}%`,
  top:   `${(i * 61 + 5) % 100}%`,
  size:  (i % 3) === 0 ? 3 : 2,
  dur:   `${5 + (i % 4)}s`,
  delay: `${(i * 0.45) % 3}s`,
  op:    i % 4 === 0 ? 0.45 : 0.22,
}));

// ── Live clock hook ──────────────────────────────────────────────────────────
function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN HERO — Security Operations Centre style
// ─────────────────────────────────────────────────────────────────────────────
function AdminHero({ user }) {
  const navigate = useNavigate();
  const now = useClock();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16, marginBottom: 28,
      background: 'linear-gradient(135deg, #010e07 0%, #031a0d 50%, #020d07 100%)',
      border: '1px solid rgba(16,185,129,0.18)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.08)',
      minHeight: 188,
    }}>
      {/* Hex grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}>
        <defs>
          <pattern id="hh" x="0" y="0" width="50" height="43" patternUnits="userSpaceOnUse">
            <polygon points="25,2 47,14 47,30 25,42 3,30 3,14" fill="none" stroke="#10b981" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hh)"/>
      </svg>

      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(16,185,129,0.01) 3px, rgba(16,185,129,0.01) 4px)', pointerEvents: 'none' }} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: p.left, top: p.top, width: p.size, height: p.size, borderRadius: '50%', background: '#34d399', opacity: p.op, animation: `heroParticle ${p.dur} ease-in-out ${p.delay} infinite` }} />
      ))}

      {/* Right glow */}
      <div style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #059669, #10b981 50%, transparent)' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Shield */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1px solid rgba(16,185,129,0.2)', animation: 'ringPulse 3s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: -18, borderRadius: '50%', border: '1px solid rgba(16,185,129,0.1)', animation: 'ringPulse 3s ease-in-out 0.5s infinite' }} />
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(16,185,129,0.15)' }}>
              <Shield size={30} style={{ color: '#34d399' }} strokeWidth={1.5} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 4, padding: '3px 9px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'blink 2s infinite' }} />
                <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#34d399', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Admin Command Centre</span>
              </div>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 6px', lineHeight: 1.1 }}>
              Welcome back, <span style={{ background: 'linear-gradient(90deg,#34d399,#6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              I2IT Campus Water Management — full system control
            </p>
          </div>
        </div>

        {/* Right — live clock + quick actions */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'rgba(52,211,153,0.85)', fontVariantNumeric: 'tabular-nums', letterSpacing: '1px', lineHeight: 1, marginBottom: 4 }}>{timeStr}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>{dateStr}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {[
              { label: 'Campus Map', icon: Map, path: '/admin/map' },
              { label: 'All Alerts', icon: Activity, path: '/admin/alerts' },
            ].map(btn => (
              <button key={btn.label} onClick={() => navigate(btn.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 7, padding: '6px 12px', color: '#34d399',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'; }}
              >
                <btn.icon size={12} /> {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAINTENANCE HERO — Industrial shift-start style
// ─────────────────────────────────────────────────────────────────────────────
function MaintenanceHero({ user }) {
  const navigate = useNavigate();
  const now = useClock();
  const today = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const shift = now.getHours() < 14 ? 'Morning Shift' : 'Afternoon Shift';

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16, marginBottom: 28,
      background: 'linear-gradient(135deg, #1c0e00 0%, #2d1600 50%, #1a0c00 100%)',
      border: '1px solid rgba(245,158,11,0.2)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      minHeight: 188,
    }}>
      {/* Diagonal stripe texture */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(55deg, #fbbf24 0px, #fbbf24 10px, transparent 10px, transparent 30px)', pointerEvents: 'none' }} />
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #d97706, #f59e0b 50%, #fbbf24)' }} />
      {/* Right glow */}
      <div style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(245,158,11,0.12)', flexShrink: 0 }}>
            <HardHat size={32} style={{ color: '#fbbf24' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, padding: '3px 9px' }}>
                <Zap size={9} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Field Operations Active</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 4, padding: '3px 9px' }}>
                <Clock size={8} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>{shift}</span>
              </div>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 6px', lineHeight: 1.1 }}>
              Good shift, <span style={{ background: 'linear-gradient(90deg,#fbbf24,#fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'Staff'}</span>
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              I2IT Campus · Field maintenance operations
            </p>
          </div>
        </div>

        {/* Right — date + summary */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(251,191,36,0.8)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{timeStr}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.28)', marginBottom: 16 }}>{today}</div>

          {/* Quick status chips */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {[
              { label: '3 Active Tasks', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
              { label: '1 Critical',     color: '#f87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
            ].map(chip => (
              <div key={chip.label} style={{ background: chip.bg, border: `1px solid ${chip.border}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.6875rem', fontWeight: 700, color: chip.color }}>
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STUDENT HERO — Friendly, motivational, campus-community feel
// ─────────────────────────────────────────────────────────────────────────────
function StudentHero({ user }) {
  const navigate = useNavigate();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' });

  const quickActions = [
    { label: 'Report a Leak',       icon: FileText,    path: '/student/report',     color: '#38bdf8', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.25)' },
    { label: 'My Reports',          icon: CheckCircle, path: '/student/myreports',  color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    { label: 'Harvesting Status',   icon: Droplets,    path: '/student/harvesting', color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
  ];

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16, marginBottom: 28,
      background: 'linear-gradient(135deg, #020d18 0%, #061a2e 50%, #061528 100%)',
      border: '1px solid rgba(14,165,233,0.18)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      minHeight: 188,
    }}>
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'radial-gradient(rgba(14,165,233,0.6) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      {/* Wave decoration */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.1 }} viewBox="0 0 800 80" fill="none">
        <path d="M0 40C133 15 267 65 400 40C533 15 667 65 800 40V80H0V40Z" fill="#38bdf8"/>
        <path d="M0 55C133 30 267 75 400 55C533 30 667 75 800 55V80H0V55Z" fill="#34d399"/>
      </svg>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8 50%, transparent)' }} />
      {/* Right glow */}
      <div style={{ position: 'absolute', right: -50, top: '50%', transform: 'translateY(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '28px 36px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(14,165,233,0.12)', border: '1.5px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(14,165,233,0.14)', animation: 'logoBounce 3s ease-in-out infinite', flexShrink: 0 }}>
              <BookOpen size={26} style={{ color: '#38bdf8' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 4, padding: '3px 9px' }}>
                  <Calendar size={9} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{dateStr}</span>
                </div>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 5px', lineHeight: 1.1 }}>
                {greeting}, <span style={{ background: 'linear-gradient(90deg,#38bdf8,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name || 'Student'}</span>!
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                I2IT Hinjewadi · Help keep campus water-efficient
              </p>
            </div>
          </div>

          {/* Campus impact stat */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'rgba(56,189,248,0.85)', lineHeight: 1, marginBottom: 3 }}>2.4M</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>Litres Saved This Month</div>
          </div>
        </div>

        {/* Quick action chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: a.bg, border: `1px solid ${a.border}`,
                borderRadius: 8, padding: '7px 14px',
                color: a.color, fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <a.icon size={13} /> {a.label} <ArrowRight size={11} />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ringPulse  { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.1);opacity:.2} }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes heroParticle { 0%,100%{transform:translateY(0) scale(1);opacity:var(--op,.25)} 50%{transform:translateY(-14px) scale(1.3);opacity:.07} }
        @keyframes logoBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export — picks the right hero based on role prop
// ─────────────────────────────────────────────────────────────────────────────
export default function HeroBanner({ role }) {
  const { user } = useAuth();
  if (role === 'admin')       return <AdminHero       user={user} />;
  if (role === 'maintenance') return <MaintenanceHero user={user} />;
  return <StudentHero user={user} />;
}
