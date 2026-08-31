import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import HeroBanner from '../../components/HeroBanner';
import Topbar from '../../components/Topbar';
import AlertPanel from '../../components/AlertPanel';
import TankGauge from '../../components/TankGauge';
import {
  Activity, Droplets, AlertTriangle, CheckCircle, CloudRain,
  ArrowUpRight, ArrowDownRight, ChevronRight, Map
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  campusStats, tankData, harvestingTrend, waterUsageByZone, alerts
} from '../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
  },
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const statCards = [
    {
      label: 'Active Leaks',
      value: campusStats.activeLeaks,
      sub: '+2 since yesterday',
      subDir: 'up',
      icon: AlertTriangle,
      color: 'red',
      path: '/admin/reports?status=active',
      hint: 'Click to view active leak reports →',
    },
    {
      label: 'Water Saved Today',
      value: `${(campusStats.waterSavedToday / 1000).toFixed(1)}kL`,
      sub: 'via rainwater harvesting',
      subDir: 'good',
      icon: CloudRain,
      color: 'teal',
      path: '/admin/harvesting',
      hint: 'Click to view harvesting status →',
    },
    {
      label: 'Alerts Today',
      value: campusStats.alertsToday,
      sub: '2 unacknowledged',
      subDir: 'up',
      icon: Activity,
      color: 'amber',
      path: '/admin/alerts',
      hint: 'Click to view all alerts →',
    },
    {
      label: 'Resolved Issues',
      value: campusStats.resolvedIssues,
      sub: `${campusStats.pendingIssues} still pending`,
      subDir: 'good',
      icon: CheckCircle,
      color: 'green',
      path: '/admin/reports?status=resolved',
      hint: 'Click to view resolved issues →',
    },
  ];

  const harvestLineData = {
    labels: harvestingTrend.labels,
    datasets: [
      {
        label: 'Collected (L)',
        data: harvestingTrend.collected,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      },
      {
        label: 'Target (L)',
        data: harvestingTrend.target,
        borderColor: '#94a3b8',
        borderDash: [6, 4],
        borderWidth: 1.5,
        fill: false,
        tension: 0,
        pointRadius: 0,
      },
    ],
  };

  const usageBarData = {
    labels: waterUsageByZone.labels,
    datasets: [
      {
        label: 'Usage (L)',
        data: waterUsageByZone.daily,
        backgroundColor: [
          '#10b981','#0ea5e9','#f59e0b','#8b5cf6','#ef4444','#0284c7','#34d399'
        ],
        borderRadius: 6,
      },
    ],
  };

  const resolvedRatio = {
    labels: ['Resolved', 'Pending'],
    datasets: [{
      data: [campusStats.resolvedIssues, campusStats.pendingIssues],
      backgroundColor: ['#10b981', '#fee2e2'],
      borderColor: ['#10b981', '#ef4444'],
      borderWidth: 2,
    }],
  };

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar
          title="Admin Dashboard — IIIT Hinjewadi"
          subtitle={`Last updated: ${new Date().toLocaleTimeString()}`}
        />
        <div className="page-body">
          <HeroBanner role="admin" />

          {/* ── Clickable Stat Cards ────────────────────────────────────── */}
          <div className="stat-cards-grid">
            {statCards.map((s) => (
              <div
                key={s.label}
                className={`stat-card ${s.color}`}
                onClick={() => navigate(s.path)}
                style={{ cursor: 'pointer' }}
                title={s.hint}
              >
                <div className="stat-card-top">
                  <div>
                    <div className="stat-card-value">{s.value}</div>
                    <div className="stat-card-label">{s.label}</div>
                  </div>
                  <div className={`stat-card-icon ${s.color}`}>
                    <s.icon size={22} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={`stat-card-change ${s.subDir}`}>
                    {s.subDir === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {s.sub}
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--navy-400)', opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick Links Strip ────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Pending Issues', count: campusStats.pendingIssues, path: '/admin/reports?status=pending', color: 'var(--amber-500)', bg: '#fef3c7' },
              { label: 'In Progress',    count: leakReportsInProgress(), path: '/admin/reports?status=in_progress', color: 'var(--teal-600)', bg: 'var(--teal-100)' },
              { label: 'Critical Alerts', count: alerts.filter(a=>a.type==='critical').length, path: '/admin/alerts?type=critical', color: 'var(--red-600)', bg: 'var(--red-100)' },
              { label: 'Usage Analytics', count: null, path: '/admin/usage', color: 'var(--green-700)', bg: 'var(--green-100)' },
              { label: 'Full Analytics',  count: null, path: '/admin/analytics', color: 'var(--navy-700)', bg: 'var(--navy-100)' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: item.bg, color: item.color, fontWeight: 600, fontSize: '0.8125rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {item.count !== null && (
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{item.count}</span>
                )}
                {item.label}
                <ChevronRight size={13} />
              </button>
            ))}
          </div>

          {/* ── Charts Row ───────────────────────────────────────────────── */}
          <div className="dash-grid-21">
            {/* Harvesting Trend — clickable */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/admin/harvesting')}
            >
              <div className="card-header">
                <div className="card-title">
                  <CloudRain size={17} style={{ color: 'var(--teal-600)' }} />
                  Weekly Harvesting vs Target
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge resolved">This Week</span>
                  <ChevronRight size={15} style={{ color: 'var(--navy-400)' }} />
                </div>
              </div>
              <div className="chart-container" style={{ height: 220 }}>
                <Line data={harvestLineData} options={chartOpts} />
              </div>
            </div>

            {/* Issue Ratio — clickable */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/admin/reports')}
            >
              <div className="card-header">
                <div className="card-title">
                  <CheckCircle size={17} style={{ color: 'var(--green-600)' }} />
                  Issue Resolution
                </div>
                <ChevronRight size={15} style={{ color: 'var(--navy-400)' }} />
              </div>
              <div className="chart-container" style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 160, height: 160 }}>
                  <Doughnut
                    data={resolvedRatio}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
                      },
                      cutout: '65%',
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-600)' }}>
                  {Math.round((campusStats.resolvedIssues / (campusStats.resolvedIssues + campusStats.pendingIssues)) * 100)}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)' }}>Resolution Rate</div>
              </div>
            </div>
          </div>

          {/* ── Usage Bar + Tank Gauges ─────────────────────────────────── */}
          <div className="dash-grid-21">
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/admin/usage')}
            >
              <div className="card-header">
                <div className="card-title">
                  <Droplets size={17} style={{ color: 'var(--teal-600)' }} />
                  Daily Usage by Zone — IIIT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--navy-400)' }}>Click for details</span>
                  <ChevronRight size={15} style={{ color: 'var(--navy-400)' }} />
                </div>
              </div>
              <div className="chart-container" style={{ height: 240 }}>
                <Bar data={usageBarData} options={chartOpts} />
              </div>
            </div>

            {/* Tank Gauges — clickable */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/admin/harvesting')}
            >
              <div className="card-header">
                <div className="card-title">
                  <Activity size={17} style={{ color: 'var(--green-600)' }} />
                  Tank Levels
                </div>
                <ChevronRight size={15} style={{ color: 'var(--navy-400)' }} />
              </div>
              <div className="tank-gauges-grid">
                {tankData.map((t) => <TankGauge key={t.id} tank={t} />)}
              </div>
            </div>
          </div>

          {/* ── Recent Alerts ────────────────────────────────────────────── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Activity size={17} style={{ color: 'var(--red-500)' }} />
                Recent Alerts
                <span className="badge critical">{alerts.filter(a => !a.read).length} new</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/admin/alerts')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                View All <ChevronRight size={13} />
              </button>
            </div>
            <AlertPanel limit={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

// helper (avoids importing full leakReports in this file)
function leakReportsInProgress() {
  return 3; // LK-001, LK-003, LK-007
}
