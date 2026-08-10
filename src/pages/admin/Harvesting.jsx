import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import TankGauge from '../../components/TankGauge';
import { CloudRain, TrendingUp, Droplets, Target, ChevronLeft, Map } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { tankData, harvestingTrend, monthlyHarvesting, campusStats } from '../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top', labels: { font: { size: 11 } } }, tooltip: { mode: 'index', intersect: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
  },
};

export default function Harvesting() {
  const navigate = useNavigate();
  const [view, setView] = useState('weekly');

  const weeklyData = {
    labels: harvestingTrend.labels,
    datasets: [
      {
        label: 'Collected (L)',
        data: harvestingTrend.collected,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Target (L)',
        data: harvestingTrend.target,
        borderColor: '#94a3b8',
        borderDash: [6, 4],
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

  const monthlyData = {
    labels: monthlyHarvesting.labels,
    datasets: [
      {
        label: 'Monthly Collection (L)',
        data: monthlyHarvesting.collected,
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const totalCap = tankData.reduce((s, t) => s + t.capacity, 0);
  const totalCur = tankData.reduce((s, t) => s + t.current, 0);
  const avgFill = Math.round((totalCur / totalCap) * 100);

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar title="Rainwater Harvesting — I2IT" subtitle="Monitoring collection performance and tank levels" />
        <div className="page-body">
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/admin/dashboard')}>
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>Rainwater Harvesting</h2>
                <p>Track collection efficiency and tank statuses across all I2IT campus buildings</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/map')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Map size={14} /> View on Campus Map
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Today\'s Collection', value: `${(campusStats.waterSavedToday / 1000).toFixed(1)} kL`, icon: CloudRain, color: 'teal' },
              { label: 'Harvesting Efficiency', value: `${campusStats.harvestingEfficiency}%`, icon: Target, color: 'green' },
              { label: 'Avg Tank Fill', value: `${avgFill}%`, icon: Droplets, color: 'teal' },
              { label: 'Monthly Total', value: '340 kL', icon: TrendingUp, color: 'green' },
            ].map((s) => (
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

          {/* Tank Gauges */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><Droplets size={17} style={{ color: 'var(--teal-600)' }} /> Tank Status</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>
                Total: {Math.round(totalCur / 1000)}kL / {Math.round(totalCap / 1000)}kL
              </div>
            </div>
            <div className="responsive-grid-4">
              {tankData.map((t) => <TankGauge key={t.id} tank={t} />)}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><CloudRain size={17} style={{ color: 'var(--teal-600)' }} /> Collection Trends</div>
              <div className="tabs">
                {['weekly', 'monthly'].map((t) => (
                  <div key={t} className={`tab ${view === t ? 'active' : ''}`} onClick={() => setView(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container" style={{ height: 280 }}>
              {view === 'weekly'
                ? <Line data={weeklyData} options={chartOpts} />
                : <Bar data={monthlyData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
              }
            </div>
          </div>

          {/* Tank Detail Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Tank Details</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tank</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Current Level</th>
                    <th>Fill %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tankData.map((t) => {
                    const pct = Math.round((t.current / t.capacity) * 100);
                    return (
                      <tr key={t.id}>
                        <td><strong>{t.name.split('—')[0].trim()}</strong></td>
                        <td style={{ color: 'var(--navy-500)' }}>{t.name.split('—')[1]?.trim()}</td>
                        <td>{(t.capacity / 1000).toFixed(0)}kL</td>
                        <td>{(t.current / 1000).toFixed(1)}kL</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                              <div
                                className={`progress-fill ${t.status === 'good' ? 'green' : t.status === 'warning' ? 'amber' : 'red'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, width: 34 }}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${t.status === 'good' ? 'resolved' : t.status === 'warning' ? 'high' : 'critical'}`}>
                            {t.status === 'good' ? 'Normal' : t.status === 'warning' ? 'Refill Soon' : 'Critical'}
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
