import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function TankGauge({ tank }) {
  const { isDark } = useTheme();
  const pct = Math.round((tank.current / tank.capacity) * 100);
  const status = tank.status;

  const colorMap = {
    good: {
      stroke: '#10b981',
      track: isDark ? 'rgba(255, 255, 255, 0.08)' : '#d1fae5',
      text: isDark ? '#34d399' : '#065f46',
    },
    warning: {
      stroke: '#f59e0b',
      track: isDark ? 'rgba(255, 255, 255, 0.08)' : '#fef3c7',
      text: isDark ? '#fbbf24' : '#92400e',
    },
    critical: {
      stroke: '#ef4444',
      track: isDark ? 'rgba(255, 255, 255, 0.08)' : '#fee2e2',
      text: isDark ? '#f87171' : '#991b1b',
    },
  };

  const colors = colorMap[status] || colorMap.good;

  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  const formatL = (v) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}kL` : `${v}L`;

  return (
    <div className="tank-gauge">
      <div className="tank-gauge-circle">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={colors.track}
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="gauge-text">
          <span style={{ color: colors.text }}>{pct}%</span>
          <small style={{ color: colors.text }}>full</small>
        </div>
      </div>
      <div className="tank-gauge-name">{tank.name.split('—')[0].trim()}</div>
      <div className="tank-gauge-sub">
        {formatL(tank.current)} / {formatL(tank.capacity)}
      </div>
      <div style={{ marginTop: 8 }}>
        <div className="progress-bar" style={{ height: 5 }}>
          <div
            className={`progress-fill ${status === 'good' ? 'green' : status === 'warning' ? 'amber' : 'red'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        <span className={`badge ${status === 'good' ? 'resolved' : status === 'warning' ? 'high' : 'critical'}`}>
          {status === 'good' ? 'Normal' : status === 'warning' ? 'Refill Soon' : 'Critical'}
        </span>
      </div>
    </div>
  );
}
