/**
 * HeroBanner.jsx
 *
 * Role-specific premium hero banner rendered at the top of each dashboard.
 * Admin   → deep emerald command-centre feel with live clock + particle dots
 * Maintenance → amber industrial with shift info + today's date
 * Student → ocean blue with motivational copy + quick action chips
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield, HardHat, BookOpen,
  Clock, Calendar, Activity,
  ArrowRight, Droplets, Map,
  FileText, CheckCircle, Zap
} from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';

// ── Admin Moving Dots Animation (Telemetry Node Mesh) ─────────────────────────
function AdminMovingDots() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const DOT_COUNT = 34;
    const dots = Array.from({ length: DOT_COUNT }, () => ({
      x: Math.random() * (width || 800),
      y: Math.random() * (height || 200),
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.32,
      radius: Math.random() < 0.25 ? 2.4 : Math.random() < 0.6 ? 1.7 : 1.2,
      baseAlpha: 0.25 + Math.random() * 0.4,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.025,
      color: Math.random() < 0.7 ? '52, 211, 153' : '110, 231, 183',
    }));

    const render = () => {
      if (!width || !height) {
        animId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections between nearby telemetry nodes
      for (let i = 0; i < DOT_COUNT; i++) {
        for (let j = i + 1; j < DOT_COUNT; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            const lineAlpha = (1 - dist / 65) * 0.12;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Update & render moving dots
      for (let i = 0; i < DOT_COUNT; i++) {
        const d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        d.pulse += d.pulseSpeed;

        if (d.x < -10) d.x = width + 10;
        if (d.x > width + 10) d.x = -10;
        if (d.y < -10) d.y = height + 10;
        if (d.y > height + 10) d.y = -10;

        const currentAlpha = Math.max(0.12, d.baseAlpha + Math.sin(d.pulse) * 0.18);

        // Soft outer glow halo
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.color}, ${currentAlpha * 0.22})`;
        ctx.fill();

        // Sharp bright center core
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.color}, ${currentAlpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ── Student Calming Animated Waves ───────────────────────────────────────────
function CalmingWave() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'calmWaveSwell 8s ease-in-out infinite',
        willChange: 'transform',
      }}
    >
      {/* Wave 1: Deep Ocean Cyan */}
      <svg
        viewBox="0 0 1600 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          height: '100%',
          opacity: 0.16,
          animation: 'calmWaveDrift 22s linear infinite',
          willChange: 'transform',
        }}
      >
        <defs>
          <linearGradient id="waveGradDeep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <path
          d="M 0 45 Q 200 20 400 45 T 800 45 T 1200 45 T 1600 45 V 100 H 0 Z"
          fill="url(#waveGradDeep)"
        />
      </svg>

      {/* Wave 2: Aquamarine / Mint (offset speed and reverse direction) */}
      <svg
        viewBox="0 0 1600 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          height: '100%',
          opacity: 0.12,
          animation: 'calmWaveDriftRev 18s linear infinite',
          willChange: 'transform',
        }}
      >
        <defs>
          <linearGradient id="waveGradMint" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <path
          d="M 0 58 Q 200 78 400 58 T 800 58 T 1200 58 T 1600 58 V 100 H 0 Z"
          fill="url(#waveGradMint)"
        />
      </svg>

      {/* Wave 3: Surface Aqua Crest */}
      <svg
        viewBox="0 0 1600 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          height: '100%',
          opacity: 0.08,
          animation: 'calmWaveDrift 30s linear infinite',
          willChange: 'transform',
        }}
      >
        <path
          d="M 0 70 Q 200 58 400 70 T 800 70 T 1200 70 T 1600 70 V 100 H 0 Z"
          fill="#67e8f9"
        />
      </svg>
    </div>
  );
}

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

      {/* Animated Moving Telemetry Dots */}
      <AdminMovingDots />

      {/* Right glow */}
      <div style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #059669, #10b981 50%, transparent)' }} />

      <div className="hero-banner-inner" style={{ position: 'relative', zIndex: 1, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        {/* Left */}
        <div className="hero-banner-left" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
              IIIT Campus Water Management — full system control
            </p>
          </div>
        </div>

        {/* Right — live clock + quick actions */}
        <div className="hero-banner-right" style={{ textAlign: 'right', flexShrink: 0 }}>
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

  const [taskStats, setTaskStats] = useState({ active: 0, critical: 0 });

  useEffect(() => {
    let isMounted = true;
    async function loadTasks() {
      try {
        const res = await maintenanceService.getAssignedTasks(user);
        if (isMounted) {
          const tasks = res?.tasks || [];
          const active = tasks.length;
          const critical = tasks.filter((t) => {
            const p = (t.priority || t.severity || '').toLowerCase();
            return p === 'critical' || p === 'high';
          }).length;
          setTaskStats({ active, critical });
        }
      } catch {
        if (isMounted) {
          setTaskStats({ active: 0, critical: 0 });
        }
      }
    }
    loadTasks();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16, marginBottom: 28,
      background: 'linear-gradient(135deg, #1c0e00 0%, #2d1600 50%, #1a0c00 100%)',
      border: '1px solid rgba(245,158,11,0.2)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      minHeight: 188,
    }}>
      {/* Live animated diagonal slant lines across hero banner */}
      <div className="maintenance-slant-lines maintenance-slant-lines-hero" aria-hidden="true" />
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #d97706, #f59e0b 50%, #fbbf24)' }} />
      {/* Right glow */}
      <div style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="hero-banner-inner" style={{ position: 'relative', zIndex: 1, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        {/* Left */}
        <div className="hero-banner-left" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
              IIIT Campus · Field maintenance operations
            </p>
          </div>
        </div>

        {/* Right — date + summary */}
        <div className="hero-banner-right" style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(251,191,36,0.8)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{timeStr}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.28)', marginBottom: 16 }}>{today}</div>

          {/* Quick status chips */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {[
              {
                label: `${taskStats.active} Active Task${taskStats.active === 1 ? '' : 's'}`,
                color: '#fbbf24',
                bg: 'rgba(245,158,11,0.1)',
                border: 'rgba(245,158,11,0.25)',
                path: '/maintenance/tasks',
              },
              {
                label: `${taskStats.critical} Critical`,
                color: '#f87171',
                bg: 'rgba(239,68,68,0.08)',
                border: 'rgba(239,68,68,0.2)',
                path: '/maintenance/tasks',
              },
            ].map(chip => (
              <button
                key={chip.label}
                onClick={() => navigate(chip.path)}
                style={{
                  background: chip.bg,
                  border: `1px solid ${chip.border}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: chip.color,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
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
      {/* Subtle & Calming Animated Water Waves */}
      <CalmingWave />
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8 50%, transparent)' }} />
      {/* Right glow */}
      <div style={{ position: 'absolute', right: -50, top: '50%', transform: 'translateY(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="hero-banner-inner" style={{ position: 'relative', zIndex: 1, padding: '28px 36px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="hero-banner-left" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
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
                IIIT Hinjewadi · Help keep campus water-efficient
              </p>
            </div>
          </div>

          {/* Campus impact stat */}
          <div className="hero-banner-right" style={{ textAlign: 'right', flexShrink: 0 }}>
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
        @keyframes logoBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes calmWaveDrift { 0%{transform:translate3d(0,0,0)} 100%{transform:translate3d(-50%,0,0)} }
        @keyframes calmWaveDriftRev { 0%{transform:translate3d(-50%,0,0)} 100%{transform:translate3d(0,0,0)} }
        @keyframes calmWaveSwell { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
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
