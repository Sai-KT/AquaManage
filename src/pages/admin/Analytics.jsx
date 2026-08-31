import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { TrendingUp, Download, Calendar, Droplets, CloudRain, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { analyticsData } from '../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
  },
};

export default function Analytics() {
  const navigate = useNavigate();
  const [range, setRange] = useState('7m');

  const usageVsHarvest = {
    labels: analyticsData.labels,
    datasets: [
      {
        label: 'Total Usage (L)',
        data: analyticsData.usage,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#0ea5e9',
        pointRadius: 4,
      },
      {
        label: 'Harvested (L)',
        data: analyticsData.harvested,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      },
    ],
  };

  const issuesTrend = {
    labels: analyticsData.labels,
    datasets: [
      {
        label: 'Reported',
        data: analyticsData.leaksReported,
        backgroundColor: 'rgba(239,68,68,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Resolved',
        data: analyticsData.leaksResolved,
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 6,
      },
    ],
  };

  const highlights = [
    { label: 'Avg Monthly Usage', value: `${Math.round(analyticsData.usage.reduce((a,b)=>a+b)/analyticsData.usage.length / 1000)}kL`, icon: Droplets, color: 'teal' },
    { label: 'Total Harvested (7mo)', value: `${Math.round(analyticsData.harvested.reduce((a,b)=>a+b) / 1000)}kL`, icon: CloudRain, color: 'green' },
    { label: 'Total Issues Reported', value: analyticsData.leaksReported.reduce((a,b)=>a+b), icon: AlertTriangle, color: 'amber' },
    { label: 'Total Resolved', value: analyticsData.leaksResolved.reduce((a,b)=>a+b), icon: CheckCircle, color: 'green' },
  ];

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar title="Analytics & Reports — IIIT" subtitle="Historical trends and exportable reports" />
        <div className="page-body">
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/admin/dashboard')}>
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>Analytics & Reports</h2>
                <p>Long-term trends in water usage, harvesting performance, and issue management.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm">
                  <Calendar size={13} /> Date Range
                </button>
                <button className="btn btn-primary btn-sm">
                  <Download size={13} /> Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
            {highlights.map((s) => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className="stat-card-top">
                  <div>
                    <div className="stat-card-value">{s.value}</div>
                    <div className="stat-card-label">{s.label}</div>
                  </div>
                  <div className={`stat-card-icon ${s.color}`}><s.icon size={22} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Usage vs Harvested */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><TrendingUp size={17} style={{ color: 'var(--teal-600)' }} /> Usage vs Harvesting Trend (7 Months)</div>
              <div className="tabs">
                {['7m', '3m', '1m'].map((r) => (
                  <div key={r} className={`tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                    {r === '7m' ? '7 Months' : r === '3m' ? '3 Months' : 'This Month'}
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container" style={{ height: 300 }}>
              <Line data={usageVsHarvest} options={lineOpts} />
            </div>
          </div>

          {/* Issues Trend */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><AlertTriangle size={17} style={{ color: 'var(--amber-500)' }} /> Issues Reported vs Resolved</div>
            </div>
            <div className="chart-container" style={{ height: 260 }}>
              <Bar
                data={issuesTrend}
                options={{
                  ...lineOpts,
                  plugins: {
                    legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true } },
                    tooltip: { mode: 'index', intersect: false },
                  },
                }}
              />
            </div>
          </div>

          {/* Monthly summary table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Monthly Summary Table</div>
              <button className="btn btn-secondary btn-sm"><Download size={13} /> CSV</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Usage (L)</th>
                    <th>Harvested (L)</th>
                    <th>Harvest %</th>
                    <th>Issues Reported</th>
                    <th>Issues Resolved</th>
                    <th>Resolution Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.labels.map((month, i) => {
                    const harvestPct = Math.round((analyticsData.harvested[i] / analyticsData.usage[i]) * 100);
                    const resolveRate = Math.round((analyticsData.leaksResolved[i] / analyticsData.leaksReported[i]) * 100);
                    return (
                      <tr key={month}>
                        <td><strong>{month} 2026</strong></td>
                        <td>{(analyticsData.usage[i] / 1000).toFixed(0)}kL</td>
                        <td>{(analyticsData.harvested[i] / 1000).toFixed(0)}kL</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 60, height: 5 }}>
                              <div className="progress-fill green" style={{ width: `${harvestPct}%` }} />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{harvestPct}%</span>
                          </div>
                        </td>
                        <td>{analyticsData.leaksReported[i]}</td>
                        <td>{analyticsData.leaksResolved[i]}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: resolveRate >= 80 ? 'var(--green-600)' : 'var(--amber-500)' }}>
                            {resolveRate}%
                          </span>
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
