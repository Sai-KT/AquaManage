import React from 'react';
import { Bell, Search, RefreshCw, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ title, subtitle }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="topbar-mobile-toggle"
          onClick={() => document.body.classList.toggle('sidebar-mobile-open')}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: 'var(--navy-400)', marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search-box" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--navy-100)', borderRadius: 8, padding: '6px 12px', border: '1px solid var(--navy-200)' }}>
          <Search size={14} style={{ color: 'var(--navy-400)' }} />
          <input
            type="text"
            placeholder="Search..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--navy-700)', width: 140 }}
          />
        </div>

        <button className="topbar-btn" title="Refresh data">
          <RefreshCw size={16} />
        </button>

        <button className="topbar-btn" title="Notifications">
          <Bell size={16} />
          <div className="topbar-notif-dot" />
        </button>

        {/* ── Dark / Light mode toggle ──────────────────── */}
        <button
          className="topbar-btn topbar-theme-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <span
            className="theme-icon-wrap"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
              transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-30deg) scale(0.8)',
              opacity: isDark ? 1 : 0,
              position: 'absolute',
            }}
          >
            <Sun size={16} style={{ color: '#fbbf24' }} />
          </span>
          <span
            className="theme-icon-wrap"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
              transform: isDark ? 'rotate(30deg) scale(0.8)' : 'rotate(0deg) scale(1)',
              opacity: isDark ? 0 : 1,
              position: 'absolute',
            }}
          >
            <Moon size={16} />
          </span>
          {/* Invisible spacer to maintain button size */}
          <span style={{ opacity: 0, pointerEvents: 'none' }}><Moon size={16} /></span>
        </button>

        <div className="topbar-live-status" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <span className="live-dot" />
          <span className="topbar-live-status-text" style={{ fontSize: '0.75rem', color: 'var(--green-600)', fontWeight: 600 }}>Live</span>
        </div>
      </div>
    </div>
  );
}
