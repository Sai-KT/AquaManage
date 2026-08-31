/**
 * chartConfig.js
 * Dark-mode aware Chart.js option generators with premium styling.
 */

export function getChartTheme(isDark) {
  return {
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    tickColor: isDark ? '#8b949e' : '#64748b',
    titleColor: isDark ? '#e6edf3' : '#0f172a',
    bodyColor: isDark ? '#cdd9e5' : '#334155',
    tooltipBg: isDark ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.96)',
    tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    targetBorderColor: isDark ? '#4b5563' : '#94a3b8',
    resolvedGreen: '#10b981',
    pendingRed: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
    pendingBorderRed: isDark ? '#f87171' : '#ef4444',
  };
}

export function getBaseChartOpts(isDark, overrides = {}) {
  const theme = getChartTheme(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: theme.tickColor,
          font: { size: 11, family: "'Inter', sans-serif" },
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme.tooltipBg,
        titleColor: theme.titleColor,
        bodyColor: theme.bodyColor,
        borderColor: theme.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        cornerRadius: 8,
        titleFont: { size: 12, weight: '600', family: "'Inter', sans-serif" },
        bodyFont: { size: 11, family: "'Inter', sans-serif" },
      },
      ...(overrides.plugins || {}),
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 11, family: "'Inter', sans-serif" }, color: theme.tickColor },
      },
      y: {
        grid: { color: theme.gridColor, drawBorder: false },
        ticks: { font: { size: 11, family: "'Inter', sans-serif" }, color: theme.tickColor },
      },
      ...(overrides.scales || {}),
    },
    ...overrides,
  };
}
