import React from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--navy-400)', marginTop: 1 }}>{subtitle}</div>
        )}
      </div>

      <div className="topbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--navy-100)', borderRadius: 8, padding: '6px 12px', border: '1px solid var(--navy-200)' }}>
          <Search size={14} style={{ color: 'var(--navy-400)' }} />
          <input
            type="text"
            placeholder="Search..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--navy-700)', width: 160 }}
          />
        </div>

        <button className="topbar-btn" title="Refresh data">
          <RefreshCw size={16} />
        </button>

        <button className="topbar-btn" title="Notifications">
          <Bell size={16} />
          <div className="topbar-notif-dot" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.75rem', color: 'var(--green-600)', fontWeight: 600 }}>Live</span>
        </div>
      </div>
    </div>
  );
}
