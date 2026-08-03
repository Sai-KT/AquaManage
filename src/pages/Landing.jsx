import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Users, Wrench, Shield, CheckCircle,
  Activity, CloudRain, ArrowRight, Lock
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const stats = [
    { icon: Droplets,    label: 'Litres Saved This Month', value: '2.4M', color: 'var(--teal-400)'  },
    { icon: CloudRain,   label: 'Harvesting Efficiency',   value: '87%',  color: 'var(--green-400)' },
    { icon: CheckCircle, label: 'Issues Resolved',         value: '48',   color: 'var(--green-400)' },
    { icon: Activity,    label: 'Active Alerts',           value: '3',    color: 'var(--amber-400)' },
  ];

  const roles = [
    {
      key: 'student',
      icon: Users,
      title: 'Student / Staff',
      desc: 'Report water issues, track your submissions, and view campus water status.',
      features: ['Report leaks & wastage', 'Track issue status', 'View campus alerts'],
      btnLabel: 'Continue as Student',
      loginPath: '/login/student',
      accentColor: '#38bdf8',
      accentBg: 'rgba(14,165,233,0.12)',
      accentBorder: 'rgba(14,165,233,0.25)',
      locked: false,
    },
    {
      key: 'maintenance',
      icon: Wrench,
      title: 'Maintenance Staff',
      desc: 'View your assigned tasks, update issue status, and log field work done.',
      features: ['View assigned tasks', 'Update issue progress', 'Log work done'],
      btnLabel: 'Login as Maintenance',
      loginPath: '/login/maintenance',
      accentColor: '#fbbf24',
      accentBg: 'rgba(245,158,11,0.12)',
      accentBorder: 'rgba(245,158,11,0.25)',
      locked: true,
    },
    {
      key: 'admin',
      icon: Shield,
      title: 'Admin / Facilities',
      desc: 'Full access: analytics, harvesting data, alerts, and system management.',
      features: ['Full analytics & reports', 'Manage all issues', 'Configure alerts'],
      btnLabel: 'Login as Admin',
      loginPath: '/login/admin',
      accentColor: '#34d399',
      accentBg: 'rgba(16,185,129,0.12)',
      accentBorder: 'rgba(16,185,129,0.25)',
      locked: true,
    },
  ];

  return (
    <div className="landing-page">
      {/* Animated background */}
      <div className="landing-bg" />

      {/* Wave */}
      <div className="landing-waves">
        <svg viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 80C240 120 480 40 720 80C960 120 1200 40 1440 80V180H0V80Z" fill="rgba(16,185,129,0.04)" />
          <path d="M0 100C300 60 600 140 900 100C1100 72 1280 110 1440 100V180H0V100Z" fill="rgba(14,165,233,0.04)" />
        </svg>
      </div>

      <div className="landing-content">
        {/* Hero */}
        <div className="landing-hero">
          <div className="landing-logo-wrap">
            <div className="landing-logo-icon">
              <Droplets size={30} color="#fff" />
            </div>
          </div>
          <h1>I2IT <span className="accent">AquaManage</span></h1>
          <p>
            Smart water management platform for I2IT Hinjewadi campus — monitor usage,
            track rainwater harvesting, detect leaks, and respond to issues in real time.
          </p>

          {/* Live stats */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                <s.icon size={16} style={{ color: s.color }} />
                <strong style={{ color: s.color, fontSize: '1.0625rem', fontWeight: 800 }}>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Select Your Role heading */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Select your role to continue
          </span>
        </div>

        {/* Role Cards — each navigates to its own dedicated login page */}
        <div className="landing-roles">
          {roles.map((role) => (
            <div
              key={role.key}
              className={`role-card ${role.key}`}
              onClick={() => navigate(role.loginPath)}
              style={{ cursor: 'pointer' }}
            >
              {/* Role icon */}
              <div className={`role-icon ${role.key}`} style={{ background: role.accentBg, color: role.accentColor, border: `1px solid ${role.accentBorder}` }}>
                <role.icon size={26} />
              </div>

              <h3>{role.title}</h3>
              <p>{role.desc}</p>

              {/* Feature list */}
              <ul style={{ listStyle: 'none', marginBottom: 24, textAlign: 'left' }}>
                {role.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                    <CheckCircle size={13} style={{ color: role.accentColor, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                className={`role-login-btn ${role.key}`}
                onClick={(e) => { e.stopPropagation(); navigate(role.loginPath); }}
                style={{ color: role.accentColor, background: role.accentBg, border: `1px solid ${role.accentBorder}` }}
              >
                {role.locked && <Lock size={12} style={{ marginRight: 6, opacity: 0.7 }} />}
                {role.btnLabel}
                <ArrowRight size={13} style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.8125rem' }}>System Online</span>
          <span style={{ color: 'var(--navy-600)' }}>·</span>
          <Activity size={13} style={{ color: 'var(--navy-500)' }} />
          <span>59,500 L monitored today</span>
        </div>
      </div>
    </div>
  );
}
