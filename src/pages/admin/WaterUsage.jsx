import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { BarChart3, Droplets, TrendingUp, Zap, ChevronLeft, FileText } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { waterUsageByZone, campusStats } from '../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
  },
};

// 5 zones: Academic, PPCRC, Mithila, Vikramshila, Canteen
const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function WaterUsage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('daily');

  const usageData = {
    labels: waterUsageByZone.labels,
    datasets: [{
      label: 'Water Usage (L)',
      data: waterUsageByZone[period],
      backgroundColor: COLORS,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  // Realistic IIIT hourly pattern:
  // Low early morning (hostels only), spike at 8am college open,
  // lunch peak, evening hostel peak, drop at night
  const hourlyLine = {
    labels: ['5am','7am','9am','11am','1pm','3pm','5pm','7pm','9pm','11pm'],
    datasets: [{
      label: 'Litres/hr',
      data: [480, 1200, 3800, 4200, 5100, 3600, 4800, 6200, 3400, 820],
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.1)',
      fill: true,
      borderWidth: 2.5,
      tension: 0.4,
      pointBackgroundColor: '#0ea5e9',
      pointRadius: 4,
    }],
  };

  const totalUsage = waterUsageByZone[period].reduce((a, b) => a + b, 0);
  const highestZone = waterUsageByZone.labels[waterUsageByZone[period].indexOf(Math.max(...waterUsageByZone[period]))];

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar title="Water Usage — IIIT Campus" subtitle="Campus-wide consumption across all zones" />
        <div className="page-body">
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/admin/dashboard')}>
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>Water Usage Monitoring</h2>
                <p>Track consumption patterns across IIIT campus zones: Academic Block, PPCRC, Hostels, and Canteen</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/analytics')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} /> Full Analytics
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Usage Today',   value: `${(campusStats.totalUsageToday / 1000).toFixed(1)} kL`, icon: Droplets, color: 'teal' },
              { label: 'Highest Usage Zone',  value: highestZone, icon: Zap, color: 'amber' },
              { label: 'Peak Hour (7pm)',      value: '6.2 kL/hr', icon: TrendingUp, color: 'green' },
              { label: 'Avg. per Zone',        value: `${(totalUsage / waterUsageByZone.labels.length / 1000).toFixed(1)} kL`, icon: BarChart3, color: 'green' },
            ].map((s) => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className="stat-card-top">
                  <div>
                    <div className="stat-card-value" style={{ fontSize: s.label === 'Highest Usage Zone' ? '1.25rem' : '1.875rem' }}>{s.value}</div>
                    <div className="stat-card-label">{s.label}</div>
                  </div>
                  <div className={`stat-card-icon ${s.color}`}><s.icon size={22} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Usage by Zone */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><BarChart3 size={17} style={{ color: 'var(--teal-600)' }} /> Usage by Campus Zone</div>
              <div className="tabs">
                {['daily', 'weekly', 'monthly'].map((p) => (
                  <div key={p} className={`tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container" style={{ height: 300 }}>
              <Bar data={usageData} options={baseOpts} />
            </div>
          </div>

          {/* Hourly Trend */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><TrendingUp size={17} style={{ color: 'var(--teal-600)' }} /> Today's Hourly Usage Pattern</div>
              <span className="badge in_progress">Live</span>
            </div>
            <div className="chart-container" style={{ height: 260 }}>
              <Line data={hourlyLine} options={baseOpts} />
            </div>
          </div>

          {/* Zone breakdown table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Zone Breakdown</div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>{period.charAt(0).toUpperCase() + period.slice(1)} data</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Usage</th>
                    <th>Share</th>
                    <th>vs Avg</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {waterUsageByZone.labels.map((zone, i) => {
                    const usage = waterUsageByZone[period][i];
                    const share = Math.round((usage / totalUsage) * 100);
                    // Realistic trends for IIIT zones
                    const trends = ['+8%', '+14%', '+3%', '+5%', '+2%'];
                    const benchmarks = ['Normal', 'High Lab Usage', 'Normal', 'Normal', 'Normal'];
                    const trendUp = trends[i].startsWith('+');
                    const trendVal = parseInt(trends[i]);
                    const isHigh = trendVal > 10;
                    return (
                      <tr key={zone}>
                        <td><strong>{zone}</strong></td>
                        <td>{(usage / 1000).toFixed(1)} kL</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 100, height: 6 }}>
                              <div className="progress-fill teal" style={{ width: `${share}%`, background: COLORS[i] }} />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{share}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: isHigh ? 'var(--red-500)' : 'var(--green-600)' }}>
                            {trends[i]}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${isHigh ? 'high' : 'resolved'}`}>{benchmarks[i]}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
