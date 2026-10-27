import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  X, Shield, HardHat, BookOpen, LogOut,
  MapPin, Clock, ArrowRight, Key, Droplets, Users
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      // If click target is outside the modal card, close the modal immediately
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const role = user?.role || 'admin';

  // Role metadata and theme configurations
  const roleConfig = {
    admin: {
      title: 'System Administrator',
      badge: 'Admin Access',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.3)',
      badgeColor: '#10b981',
      icon: Shield,
      accentColor: '#10b981',
      avatarBg: 'linear-gradient(135deg, #059669, #10b981)',
      loginPath: '/login/admin',
      idLabel: 'Admin Email',
      idValue: user?.email || user?.username || 'director@iiit.ac.in',
      portalName: 'Admin Control Center',
    },
    maintenance: {
      title: 'Field Maintenance Technician',
      badge: 'Ops Technician',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
      badgeColor: '#f59e0b',
      icon: HardHat,
      accentColor: '#f59e0b',
      avatarBg: 'linear-gradient(135deg, #d97706, #f59e0b)',
      loginPath: '/login/maintenance',
      idLabel: 'Employee Code',
      idValue: user?.username || 'EMP-01',
      portalName: 'Maintenance Operations',
    },
    student: {
      title: 'Campus Student Member',
      badge: 'Eco Contributor',
      badgeBg: 'rgba(14, 165, 233, 0.15)',
      badgeBorder: 'rgba(14, 165, 233, 0.3)',
      badgeColor: '#0ea5e9',
      icon: BookOpen,
      accentColor: '#0ea5e9',
      avatarBg: 'linear-gradient(135deg, #0ea5e9, #10b981)',
      loginPath: '/login/student',
      idLabel: 'IRN / PRN No.',
      idValue: user?.student_id || user?.studentId || user?.irnNo || (user?.username && !user?.username.includes('@') ? user.username : null) || 'STU-2024-001',
      portalName: 'Student Portal',
    },
  };

  const cfg = roleConfig[role] || roleConfig.student;
  const RoleIcon = cfg.icon;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleSignOut = () => {
    onClose();
    logout();
    navigate(cfg.loginPath);
  };

  const modalContent = (
    <div
      className="profile-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        animation: 'fadeIn 0.18s ease both',
      }}
    >
      <div
        ref={modalRef}
        className="profile-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: 'min(640px, calc(100dvh - 32px))',
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? '#161b22' : '#ffffff',
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'var(--navy-200)'}`,
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 20px 50px rgba(0, 0, 0, 0.18)',
          overflow: 'hidden',
          margin: 'auto',
          animation: 'fadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Header Ribbon - pinned at top of card, never cut off */}
        <div
          style={{
            flexShrink: 0,
            padding: '20px 24px 16px',
            background: isDark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)'
              : 'linear-gradient(180deg, var(--navy-50) 0%, transparent 100%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-100)'}`,
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-100)',
              color: isDark ? '#fff' : 'var(--navy-700)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Close"
            aria-label="Close Profile"
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Avatar Circle */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: cfg.avatarBg,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                fontWeight: '800',
                letterSpacing: '0.5px',
                boxShadow: `0 6px 20px ${cfg.accentColor}44`,
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                    color: cfg.badgeColor,
                    background: cfg.badgeBg,
                    border: `1px solid ${cfg.badgeBorder}`,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <RoleIcon size={12} /> {cfg.badge}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.6875rem',
                    color: '#10b981',
                    fontWeight: '600',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Online
                </span>
              </div>

              <h3
                style={{
                  margin: '0 0 2px',
                  fontSize: '1.125rem',
                  fontWeight: '800',
                  color: isDark ? '#fff' : 'var(--navy-900)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'Active User'}
              </h3>
              <div style={{ fontSize: '0.8125rem', color: 'var(--navy-500)', lineHeight: 1.3 }}>
                {cfg.title}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div
          style={{
            padding: '16px 22px 20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Profile Information Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--navy-50)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={14} style={{ color: cfg.accentColor }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>{cfg.idLabel}</span>
              </div>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: isDark ? '#e6edf3' : 'var(--navy-900)',
                  fontFamily: 'monospace',
                }}
              >
                {cfg.idValue}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--navy-50)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} style={{ color: cfg.accentColor }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>Campus</span>
              </div>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: isDark ? '#e6edf3' : 'var(--navy-800)',
                }}
              >
                IIIT Hinjewadi, Pune
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--navy-50)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={14} style={{ color: cfg.accentColor }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>System Scope</span>
              </div>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: isDark ? '#e6edf3' : 'var(--navy-800)',
                }}
              >
                AquaManage Smart Telemetry
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--navy-50)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} style={{ color: cfg.accentColor }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>Session Security</span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Active · 15m idle guard
              </span>
            </div>
          </div>

          {/* Quick Role-Specific Navigation Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: '700',
                color: 'var(--navy-400)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '8px',
              }}
            >
              Quick Shortcuts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {role === 'admin' && (
                <>
                  <button
                    onClick={() => { onClose(); navigate('/admin/students'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10b981',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={14} />
                      Student Management
                    </span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/student/report'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(14,165,233,0.08)',
                      border: '1px solid rgba(14,165,233,0.2)',
                      color: '#0ea5e9',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Switch to Student View</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/admin/map'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--navy-100)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-200)'}`,
                      color: isDark ? '#fff' : 'var(--navy-700)',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Inspect Campus GIS Map</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}

              {role === 'maintenance' && (
                <>
                  <button
                    onClick={() => { onClose(); navigate('/maintenance/tasks'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      color: '#d97706',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>View Assigned Work Orders</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/maintenance/completed'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--navy-100)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-200)'}`,
                      color: isDark ? '#fff' : 'var(--navy-700)',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>View Completed Task History</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}

              {role === 'student' && (
                <>
                  <button
                    onClick={() => { onClose(); navigate('/student/profile'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(16,185,129,0.1))',
                      border: '1px solid rgba(14,165,233,0.3)',
                      color: '#0ea5e9',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Manage Student Profile & Security</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/student/report'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(14,165,233,0.08)',
                      border: '1px solid rgba(14,165,233,0.2)',
                      color: '#0ea5e9',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>File New Water Issue</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/student/myreports'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--navy-100)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-200)'}`,
                      color: isDark ? '#fff' : 'var(--navy-700)',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Track My Reports</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSignOut}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <LogOut size={14} /> Sign Out of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
