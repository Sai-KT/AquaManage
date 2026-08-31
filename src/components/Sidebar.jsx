import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Droplets, LayoutDashboard, FileText, CloudRain, BarChart3,
  Map, Bell, Activity, ClipboardList, LogOut, CheckSquare,
  AlertTriangle, Shield, ChevronRight,
  BookOpen, Leaf, HardHat, X,
} from 'lucide-react';

// ─── Navigation configs ───────────────────────────────────────────────────────
const navConfigs = {
  admin: {
    sections: [
      {
        label: 'OVERVIEW',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard',   path: '/admin/dashboard' },
          { icon: Bell,            label: 'Alerts',      path: '/admin/alerts', badge: 3 },
        ],
      },
      {
        label: 'MONITORING',
        items: [
          { icon: CloudRain,  label: 'Harvesting',  path: '/admin/harvesting' },
          { icon: BarChart3,  label: 'Water Usage', path: '/admin/usage'      },
          { icon: Map,        label: 'Campus Map',  path: '/admin/map'        },
          { icon: Activity,   label: 'Analytics',  path: '/admin/analytics'  },
        ],
      },
      {
        label: 'MANAGEMENT',
        items: [
          { icon: FileText, label: 'Leak Reports', path: '/admin/reports' },
        ],
      },
    ],
  },
  maintenance: {
    sections: [
      {
        label: 'WORK QUEUE',
        items: [
          { icon: ClipboardList, label: 'Active Tasks',    path: '/maintenance/tasks',     badge: 3 },
          { icon: CheckSquare,   label: 'Completed Tasks', path: '/maintenance/completed'           },
        ],
      },
    ],
  },
  student: {
    sections: [
      {
        label: 'REPORT',
        items: [
          { icon: AlertTriangle, label: 'Report an Issue', path: '/student/report'    },
          { icon: FileText,      label: 'My Reports',      path: '/student/myreports' },
        ],
      },
      {
        label: 'CAMPUS INFO',
        items: [
          { icon: CloudRain, label: 'Harvesting Status', path: '/student/harvesting' },
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN SIDEBAR
//  Theme: Deep emerald security-ops. Left accent bar, hex icon, monospace label.
// ─────────────────────────────────────────────────────────────────────────────
function AdminSidebar({ user, location, navigate, logout }) {
  const cfg = navConfigs.admin;

  return (
    <div className="sidebar-wrapper" style={{
      width: 240, height: '100vh', flexShrink: 0,
      background: 'linear-gradient(180deg, #010e07 0%, #021307 50%, #010904 100%)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(16,185,129,0.12)',
      position: 'fixed', top: 0, left: 0, zIndex: 100, overflow: 'hidden',
    }}>
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, #059669, #10b981 40%, transparent)' }} />

      {/* Hex grid background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
        <defs>
          <pattern id="sh" x="0" y="0" width="40" height="35" patternUnits="userSpaceOnUse">
            <polygon points="20,2 37,11 37,24 20,33 3,24 3,11" fill="none" stroke="#10b981" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sh)"/>
      </svg>

      {/* ── Brand ── */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(16,185,129,0.08)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', flexShrink: 0 }}>
              <Droplets size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fff', letterSpacing: '-0.2px' }}>AquaManage</div>
              <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>IIIT Hinjewadi</div>
            </div>
          </div>
          <button
            className="sidebar-mobile-close"
            onClick={() => document.body.classList.remove('sidebar-mobile-open')}
            style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
            title="Close Menu"
            aria-label="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin identity card */}
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={16} style={{ color: '#34d399' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.5625rem', color: 'rgba(52,211,153,0.6)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>System Administrator</div>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0, animation: 'blink 2s ease-in-out infinite' }} />
        </div>
        <button
          onClick={() => navigate('/student/report')}
          style={{
            marginTop: 10, width: '100%', padding: '6px 10px',
            background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)',
            borderRadius: 8, color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <BookOpen size={12} /> Student View
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', position: 'relative', zIndex: 1 }}>
        {cfg.sections.map(section => (
          <div key={section.label} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(52,211,153,0.35)', letterSpacing: '1.5px', padding: '0 8px', marginBottom: 6 }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <div key={item.path} onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 9, marginBottom: 2,
                    cursor: 'pointer', position: 'relative',
                    background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Active left indicator */}
                  {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 2, borderRadius: 2, background: '#10b981' }} />}
                  <item.icon size={15} style={{ color: active ? '#34d399' : 'rgba(255,255,255,0.28)', flexShrink: 0, transition: 'color 0.18s' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.38)', flex: 1, letterSpacing: '-0.1px', transition: 'color 0.18s' }}>
                    {item.label}
                  </span>
                  {item.badge && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#fff', background: '#10b981', borderRadius: 10, padding: '2px 7px', letterSpacing: '0.2px' }}>{item.badge}</span>}
                  {active && <ChevronRight size={12} style={{ color: '#34d399', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.18),transparent)', margin: '0 12px', position: 'relative', zIndex: 1 }} />

      {/* ── Footer ── */}
      <div style={{ padding: '14px 12px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => { logout(); navigate('/login/admin'); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px', borderRadius: 9,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontWeight: 700, fontSize: '0.8125rem',
            cursor: 'pointer', transition: 'all 0.18s ease', letterSpacing: '0.2px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAINTENANCE SIDEBAR
//  Theme: Industrial amber. Full amber top header, task-count strip, bold cards.
// ─────────────────────────────────────────────────────────────────────────────
function MaintenanceSidebar({ user, location, navigate, logout }) {
  const cfg = navConfigs.maintenance;

  return (
    <div className="sidebar-wrapper" style={{
      width: 240, height: '100vh', flexShrink: 0,
      background: '#0e0900',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(245,158,11,0.1)',
      position: 'fixed', top: 0, left: 0, zIndex: 100, overflow: 'hidden',
    }}>
      {/* Diagonal stripe texture */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'repeating-linear-gradient(55deg,#f59e0b 0px,#f59e0b 8px,transparent 8px,transparent 24px)', pointerEvents: 'none' }} />

      {/* ── Bold amber top header ── */}
      <div style={{
        background: 'linear-gradient(145deg,#451a00 0%,#78350f 60%,#92400e 100%)',
        borderBottom: '2px solid rgba(245,158,11,0.3)',
        padding: '22px 18px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Header diagonal overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(55deg,#fbbf24 0px,#fbbf24 8px,transparent 8px,transparent 24px)', pointerEvents: 'none' }} />
        {/* Bottom amber glow line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#fbbf24,transparent)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Droplets size={14} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#fff' }}>AquaManage</div>
                <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Maintenance Ops</div>
              </div>
            </div>
            <button
              className="sidebar-mobile-close"
              onClick={() => document.body.classList.remove('sidebar-mobile-open')}
              style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
              title="Close Menu"
              aria-label="Close Menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Staff ID card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 9, padding: '8px 10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HardHat size={15} style={{ color: '#fbbf24' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Staff'}</div>
              <div style={{ fontSize: '0.5625rem', color: 'rgba(251,191,36,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Field Technician</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task summary strip ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(245,158,11,0.08)', position: 'relative', zIndex: 1 }}>
        {[{ label: 'Active', value: '3', color: '#fbbf24' }, { label: 'Critical', value: '1', color: '#f87171' }, { label: 'Done', value: '2', color: '#34d399' }].map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(245,158,11,0.07)' : 'none' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.28)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', position: 'relative', zIndex: 1 }}>
        {cfg.sections.map(section => (
          <div key={section.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(251,191,36,0.35)', letterSpacing: '1.5px', padding: '0 8px', marginBottom: 6 }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <div key={item.path} onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 9, marginBottom: 4,
                    cursor: 'pointer',
                    background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                    border: active ? '1px solid rgba(245,158,11,0.22)' : '1px solid transparent',
                    borderLeft: active ? '3px solid #f59e0b' : '3px solid transparent',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(245,158,11,0.05)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                  }}>
                    <item.icon size={14} style={{ color: active ? '#fbbf24' : 'rgba(255,255,255,0.28)', transition: 'color 0.18s' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.38)', flex: 1, transition: 'color 0.18s' }}>
                    {item.label}
                  </span>
                  {item.badge && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#fff', background: '#f59e0b', borderRadius: 10, padding: '2px 7px' }}>{item.badge}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.15),transparent)', margin: '0 12px', position: 'relative', zIndex: 1 }} />

      {/* ── Footer ── */}
      <div style={{ padding: '14px 12px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => { logout(); navigate('/login/maintenance'); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px', borderRadius: 9,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
            color: '#f87171', fontWeight: 700, fontSize: '0.8125rem',
            cursor: 'pointer', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)'; }}
        >
          <LogOut size={14} /> End Shift
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STUDENT SIDEBAR
//  Theme: Fresh ocean blue. Rounded pill nav items, campus-community feel,
//         eco badge, friendly avatar, gradient background.
// ─────────────────────────────────────────────────────────────────────────────
function StudentSidebar({ user, location, navigate, logout }) {
  const cfg = navConfigs.student;
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="sidebar-wrapper" style={{
      width: 240, height: '100vh', flexShrink: 0,
      background: 'linear-gradient(180deg, #020d18 0%, #061a2e 60%, #020e1c 100%)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(14,165,233,0.1)',
      position: 'fixed', top: 0, left: 0, zIndex: 100, overflow: 'hidden',
    }}>
      {/* Dot grid background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(rgba(14,165,233,0.6) 1px, transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
      {/* Wave at bottom */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.06, pointerEvents: 'none' }} viewBox="0 0 240 100" fill="none">
        <path d="M0 50C40 20 80 80 120 50C160 20 200 80 240 50V100H0V50Z" fill="#38bdf8"/>
      </svg>

      {/* ── Header ── */}
      <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid rgba(14,165,233,0.09)', position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg,#0ea5e9,#10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(14,165,233,0.35)', flexShrink: 0,
              animation: 'logoBounce 3s ease-in-out infinite',
            }}>
              <Droplets size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fff' }}>AquaManage</div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Student Portal</div>
            </div>
          </div>
          <button
            className="sidebar-mobile-close"
            onClick={() => document.body.classList.remove('sidebar-mobile-open')}
            style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
            title="Close Menu"
            aria-label="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar + greeting card */}
        <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(14,165,233,0.3),rgba(16,185,129,0.2))',
            border: '2px solid rgba(14,165,233,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 8px', fontSize: '1rem', fontWeight: 800, color: '#38bdf8',
          }}>
            {initials}
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', marginBottom: 3 }}>{user?.name || 'Student'}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '2px 8px' }}>
            <Leaf size={9} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.5px' }}>Eco Contributor</span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', position: 'relative', zIndex: 1 }}>
        {cfg.sections.map(section => (
          <div key={section.label} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(56,189,248,0.35)', letterSpacing: '1.5px', padding: '0 6px', marginBottom: 8 }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <div key={item.path} onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 50, /* Pill shape */ marginBottom: 5,
                    cursor: 'pointer',
                    background: active
                      ? 'linear-gradient(135deg,rgba(14,165,233,0.22),rgba(16,185,129,0.12))'
                      : 'transparent',
                    border: active ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                    boxShadow: active ? '0 2px 10px rgba(14,165,233,0.12)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(14,165,233,0.06)'; e.currentTarget.style.borderColor = 'rgba(14,165,233,0.12)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: active ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    <item.icon size={13} style={{ color: active ? '#38bdf8' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.38)', flex: 1, transition: 'color 0.2s' }}>
                    {item.label}
                  </span>
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        ))}

        {/* Eco tip card */}
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Leaf size={11} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Campus Eco Tip</span>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.5, margin: 0 }}>
            Reporting a single leak saves up to 10,000 litres per day at IIIT.
          </p>
        </div>
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(14,165,233,0.15),transparent)', margin: '0 14px', position: 'relative', zIndex: 1 }} />

      {/* ── Footer ── */}
      <div style={{ padding: '14px 14px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => { logout(); navigate('/login/student'); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px 14px', borderRadius: 50,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.17)',
            color: '#f87171', fontWeight: 700, fontSize: '0.8125rem',
            cursor: 'pointer', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.33)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.17)'; }}
        >
          <LogOut size={13} /> Leave Portal
        </button>
      </div>

      <style>{`
        @keyframes logoBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({ role = 'admin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleNavigate = (path) => {
    document.body.classList.remove('sidebar-mobile-open');
    navigate(path);
  };

  const handleLogout = () => {
    document.body.classList.remove('sidebar-mobile-open');
    logout();
  };

  const props = { user, location, navigate: handleNavigate, logout: handleLogout };

  return (
    <>
      <div
        className="sidebar-backdrop"
        onClick={() => document.body.classList.remove('sidebar-mobile-open')}
      />
      {role === 'admin' && <AdminSidebar {...props} />}
      {role === 'maintenance' && <MaintenanceSidebar {...props} />}
      {role !== 'admin' && role !== 'maintenance' && <StudentSidebar {...props} />}
    </>
  );
}
