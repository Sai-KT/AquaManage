import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, RefreshCw, Menu, Sun, Moon,
  X, ChevronRight, Command, SlidersHorizontal,
  LayoutDashboard, Map, AlertTriangle, CloudRain, Droplets,
  BarChart2, Wrench, CheckCircle2, FilePlus, ListOrdered,
  Database, Building2, AlertCircle, PlusCircle, Compass,
  Activity, Wifi, Server, Check, ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  tankData, leakReports, alerts as mockAlerts, i2itBuildings
} from '../data/mockData';

// Map string icon names to Lucide icon components
const ICON_MAP = {
  LayoutDashboard, Map, AlertTriangle, CloudRain, Droplets,
  BarChart2, Wrench, CheckCircle2, FilePlus, ListOrdered,
  Database, Building2, AlertCircle, PlusCircle, Compass,
  Activity, Wifi, Server, Bell, RefreshCw
};

export default function Topbar({ title, subtitle }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const role = user?.role || 'admin';

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [alertsList, setAlertsList] = useState(() => mockAlerts);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'unread'
  const notifRef = useRef(null);

  // Live status popover state
  const [liveOpen, setLiveOpen] = useState(false);
  const [lastPingTime, setLastPingTime] = useState('24ms');
  const liveRef = useRef(null);

  // Refresh animation & toast state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date());

  const unreadCount = alertsList.filter(a => !a.read).length;

  // ── Keyboard shortcut (Cmd+K / Ctrl+K / Slash) ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setLiveOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (liveRef.current && !liveRef.current.contains(e.target)) {
        setLiveOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Show temporary toast ────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // ── Handle Telemetry Refresh ────────────────────────────────────────────
  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime(new Date());
      setLastPingTime(`${Math.floor(18 + Math.random() * 12)}ms`);
      showToast('✓ Campus Telemetry Synchronized (All 12 sensors active)');
    }, 800);
  };

  // ── Handle Theme Toggle with Toast ──────────────────────────────────────
  const handleThemeToggle = () => {
    toggleTheme();
    showToast(isDark ? '☀️ Switched to Light Mode' : '🌙 Switched to Dark Mode');
  };

  // ── Build Full Search Index across all features ─────────────────────────
  const allSearchItems = useMemo(() => {
    const pages = [
      // Admin
      { id: 'p-admin-dash', category: 'Navigation', title: 'Admin Dashboard', desc: 'Main telemetry, stats, and campus overview', path: '/admin/dashboard', icon: 'LayoutDashboard', roles: ['admin'] },
      { id: 'p-admin-map', category: 'Navigation', title: 'Campus Map', desc: 'Interactive live map with pins and tanks', path: '/admin/map', icon: 'Map', roles: ['admin', 'maintenance', 'student'] },
      { id: 'p-admin-reports', category: 'Navigation', title: 'Leak Reports', desc: 'All reported water issues and tickets', path: '/admin/reports', icon: 'AlertTriangle', roles: ['admin'] },
      { id: 'p-admin-harvest', category: 'Navigation', title: 'Rainwater Harvesting', desc: 'Tank levels and collection performance', path: '/admin/harvesting', icon: 'CloudRain', roles: ['admin'] },
      { id: 'p-admin-usage', category: 'Navigation', title: 'Water Usage Analytics', desc: 'Zone consumption breakdown and hourly demand', path: '/admin/usage', icon: 'Droplets', roles: ['admin'] },
      { id: 'p-admin-analytics', category: 'Navigation', title: 'Full Analytics & Reports', desc: 'Historical monthly trends and CSV exports', path: '/admin/analytics', icon: 'BarChart2', roles: ['admin'] },
      { id: 'p-admin-alerts', category: 'Navigation', title: 'Alerts & System Events', desc: 'Live alerts, critical notifications', path: '/admin/alerts', icon: 'Bell', roles: ['admin'] },

      // Maintenance
      { id: 'p-maint-queue', category: 'Navigation', title: 'Maintenance Tasks Queue', desc: 'Active assigned tickets and repair work orders', path: '/maintenance/tasks', icon: 'Wrench', roles: ['maintenance', 'admin'] },
      { id: 'p-maint-done', category: 'Navigation', title: 'Completed Tasks History', desc: 'Log of resolved maintenance jobs', path: '/maintenance/completed', icon: 'CheckCircle2', roles: ['maintenance', 'admin'] },

      // Student
      { id: 'p-stud-report', category: 'Navigation', title: 'Report a Leak', desc: 'Submit a new water wastage or leak incident', path: '/student/report', icon: 'FilePlus', roles: ['student', 'admin', 'maintenance'] },
      { id: 'p-stud-myreports', category: 'Navigation', title: 'My Submitted Reports', desc: 'Track your reported issues and resolutions', path: '/student/myreports', icon: 'ListOrdered', roles: ['student', 'admin'] },
      { id: 'p-stud-harvest', category: 'Navigation', title: 'Campus Harvesting Status', desc: 'Student view of rainwater harvesting', path: '/student/harvesting', icon: 'CloudRain', roles: ['student', 'admin'] },
    ];

    // Tanks
    const tanks = tankData.map(t => ({
      id: `tank-${t.id}`,
      category: 'Tanks',
      title: t.name,
      desc: `Capacity: ${(t.capacity / 1000).toFixed(0)}kL | Current: ${(t.current / 1000).toFixed(1)}kL (${Math.round((t.current / t.capacity) * 100)}% full)`,
      badge: `${Math.round((t.current / t.capacity) * 100)}%`,
      badgeType: t.status,
      path: role === 'student' ? '/student/harvesting' : '/admin/harvesting',
      icon: 'Database',
    }));

    // Buildings & Zones
    const zones = i2itBuildings.map(b => ({
      id: `zone-${b.id}`,
      category: 'Buildings',
      title: b.name,
      desc: `${b.desc} • ${b.floors} Floors`,
      path: role === 'admin' ? '/admin/map' : role === 'maintenance' ? '/maintenance/tasks' : '/student/report',
      icon: 'Building2',
    }));

    // Leak Reports
    const reports = leakReports.map(r => ({
      id: `report-${r.id}`,
      category: 'Issues',
      title: `${r.id}: ${r.type}`,
      desc: `${r.location} • Status: ${r.status.replace('_', ' ')}`,
      badge: r.priority,
      badgeType: r.priority,
      path: role === 'admin' ? '/admin/reports' : role === 'maintenance' ? '/maintenance/tasks' : '/student/myreports',
      icon: 'AlertCircle',
    }));

    // Quick System Actions
    const actions = [
      { id: 'act-report', category: 'Actions', title: 'Report a New Leak', desc: 'File an instant maintenance report', path: '/student/report', icon: 'PlusCircle' },
      { id: 'act-refresh', category: 'Actions', title: 'Sync Live Telemetry', desc: 'Pull fresh telemetry from 12 sensor nodes', customAction: 'refresh', icon: 'RefreshCw' },
      { id: 'act-theme', category: 'Actions', title: 'Toggle Dark / Light Theme', desc: 'Switch visual color palette mode', customAction: 'toggleTheme', icon: 'Sun' },
      { id: 'act-map', category: 'Actions', title: 'Open Campus GIS Map', desc: 'View geo-tagged sensors and campus layout', path: '/admin/map', icon: 'Compass' },
    ];

    return [...pages, ...tanks, ...zones, ...reports, ...actions];
  }, [role]);

  // Filtered search results
  const filteredSearchResults = useMemo(() => {
    let list = allSearchItems;
    if (activeCategory !== 'All') {
      list = list.filter(item => item.category === activeCategory);
    }
    if (!searchQuery.trim()) {
      return list.slice(0, 8); // Top suggestions
    }
    const q = searchQuery.toLowerCase().trim();
    return list.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [allSearchItems, searchQuery, activeCategory]);

  // ── Handle search item execution ────────────────────────────────────────
  const executeSearchItem = (item) => {
    setSearchOpen(false);
    if (item.customAction === 'refresh') {
      handleRefresh();
    } else if (item.customAction === 'toggleTheme') {
      handleThemeToggle();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // ── Keyboard navigation in search ───────────────────────────────────────
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredSearchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredSearchResults.length) % Math.max(1, filteredSearchResults.length));
    } else if (e.key === 'Enter' && filteredSearchResults[selectedIndex]) {
      e.preventDefault();
      executeSearchItem(filteredSearchResults[selectedIndex]);
    }
  };

  // ── Notification handlers ───────────────────────────────────────────────
  const markAllAlertsRead = () => {
    setAlertsList(prev => prev.map(a => ({ ...a, read: true })));
    showToast('✓ All notifications marked as read');
  };

  const handleAlertClick = (alert) => {
    setAlertsList(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a));
    setNotifOpen(false);
    if (role === 'admin') navigate('/admin/alerts');
    else if (role === 'maintenance') navigate('/maintenance/tasks');
    else navigate('/student/myreports');
  };

  const displayedAlerts = useMemo(() => {
    if (notifFilter === 'unread') return alertsList.filter(a => !a.read);
    return alertsList;
  }, [alertsList, notifFilter]);

  const categories = ['All', 'Navigation', 'Issues', 'Tanks', 'Buildings', 'Actions'];

  return (
    <div className="topbar">
      {/* ── Left: Mobile Toggle & Page Title ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          className="topbar-mobile-toggle"
          onClick={() => document.body.classList.toggle('sidebar-mobile-open')}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="topbar-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Actions ────────────────────────────────────────────── */}
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>

        {/* ── 1. Full Interactive Search Bar / Palette ───────────────── */}
        <div ref={searchContainerRef} style={{ position: 'relative' }}>
          {/* Desktop Search Input */}
          <div
            className="topbar-search-box desktop-only"
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--navy-100)',
              borderRadius: 8,
              padding: '6px 12px',
              border: '1px solid var(--navy-200)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: 210,
            }}
          >
            <Search size={14} style={{ color: 'var(--navy-400)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search anything... (⌘K)"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
                setSelectedIndex(0);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.8125rem',
                color: 'var(--navy-700)',
                width: '100%',
                cursor: 'text',
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--navy-400)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--navy-500)',
                  background: 'var(--navy-200)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  lineHeight: 1.4,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Command size={10} />K
              </span>
            )}
          </div>

          {/* Mobile Search Icon Trigger Button */}
          <button
            className="topbar-btn mobile-only"
            onClick={() => setSearchOpen(true)}
            title="Search"
            aria-label="Search"
            style={{ cursor: 'pointer' }}
          >
            <Search size={16} />
          </button>

          {/* Search Dropdown / Palette Popover (Responsive Modal on Mobile, Popover on Desktop) */}
          {searchOpen && (
            <>
              {/* Mobile backdrop */}
              <div
                className="search-mobile-backdrop"
                onClick={() => setSearchOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 9998,
                }}
              />
              <div
                className="topbar-search-modal"
                style={{
                  position: 'fixed',
                  top: 'min(72px, 12vh)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'min(540px, calc(100vw - 24px))',
                  maxHeight: 'min(520px, 80vh)',
                  background: isDark ? '#161b22' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'var(--navy-200)'}`,
                  borderRadius: 14,
                  boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.8)' : '0 16px 45px rgba(0,0,0,0.18)',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  animation: 'fadeUp 0.18s ease both',
                }}
              >
                {/* Search Header with Input */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-100)'}`,
                    background: isDark ? '#1c2128' : '#f8fafc',
                  }}
                >
                  <Search size={18} style={{ color: 'var(--green-500)', flexShrink: 0 }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search pages, leak issues, tanks, zones, actions..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setSelectedIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: isDark ? '#e6edf3' : 'var(--navy-900)',
                      width: '100%',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--navy-400)', display: 'flex' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-200)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--navy-600)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Esc
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    padding: '8px 14px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    background: isDark ? '#161b22' : '#ffffff',
                  }}
                >
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setSelectedIndex(0);
                      }}
                      style={{
                        padding: '4px 11px',
                        borderRadius: 20,
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeCategory === cat ? 'var(--green-500)' : isDark ? 'rgba(255,255,255,0.07)' : 'var(--navy-100)',
                        color: activeCategory === cat ? '#fff' : 'var(--navy-600)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Results List */}
                <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, padding: '8px' }}>
                  {filteredSearchResults.length === 0 ? (
                    <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--navy-400)' }}>
                      <Search size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--navy-600)' }}>No matches found</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Try searching for "leak", "tank", "usage", or "map"</div>
                    </div>
                  ) : (
                    filteredSearchResults.map((item, idx) => {
                      const IconComponent = ICON_MAP[item.icon] || FilePlus;
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => executeSearchItem(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '11px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'var(--navy-100)') : 'transparent',
                            transition: 'background 0.12s ease',
                            minHeight: 46,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-200)',
                              color: 'var(--green-500)',
                              flexShrink: 0,
                            }}
                          >
                            <IconComponent size={17} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isDark ? '#e6edf3' : 'var(--navy-800)' }}>
                                {item.title}
                              </span>
                              <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)', color: 'var(--navy-500)' }}>
                                {item.category}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--navy-500)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.desc}
                            </div>
                          </div>
                          {item.badge && (
                            <span
                              className={`badge ${item.badgeType === 'critical' ? 'critical' : item.badgeType === 'high' ? 'high' : item.badgeType === 'good' ? 'resolved' : 'medium'}`}
                              style={{ fontSize: '0.625rem', padding: '2px 7px', flexShrink: 0 }}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight size={15} style={{ color: 'var(--navy-400)', opacity: isSelected ? 1 : 0.4, flexShrink: 0 }} />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer */}
                <div
                  style={{
                    padding: '9px 16px',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
                    fontSize: '0.6875rem',
                    color: 'var(--navy-400)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isDark ? '#1c2128' : '#f8fafc',
                  }}
                >
                  <span>Use <kbd style={{ padding: '1px 4px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: 3 }}>↑</kbd> <kbd style={{ padding: '1px 4px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: 3 }}>↓</kbd> to navigate</span>
                  <span>Tap or press <kbd style={{ padding: '1px 4px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: 3 }}>Enter</kbd> to open</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 2. Live Telemetry Refresh Button ───────────────────────── */}
        <button
          className="topbar-btn"
          onClick={handleRefresh}
          title="Synchronize Live Telemetry"
          aria-label="Synchronize Live Telemetry"
          style={{ cursor: 'pointer' }}
        >
          <RefreshCw
            size={16}
            style={{
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
              color: isRefreshing ? 'var(--green-500)' : 'inherit',
            }}
          />
        </button>

        {/* ── 3. Notification Center Button & Dropdown ───────────────── */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topbar-btn"
            onClick={() => setNotifOpen(prev => !prev)}
            title="System Notifications"
            aria-label="System Notifications"
            style={{ cursor: 'pointer' }}
          >
            <Bell size={16} />
            {unreadCount > 0 && <div className="topbar-notif-dot" />}
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'min(360px, 90vw)',
                maxHeight: '460px',
                background: isDark ? '#161b22' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'var(--navy-200)'}`,
                borderRadius: 12,
                boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.65)' : '0 12px 36px rgba(0,0,0,0.14)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'fadeUp 0.18s ease both',
              }}
            >
              {/* Notif Header */}
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy-800)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="badge critical" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAlertsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--green-500)',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '8px 16px',
                  background: isDark ? '#1c2128' : '#f8fafc',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
                }}
              >
                <button
                  onClick={() => setNotifFilter('all')}
                  style={{
                    border: 'none',
                    background: notifFilter === 'all' ? 'var(--navy-200)' : 'transparent',
                    color: notifFilter === 'all' ? 'var(--navy-900)' : 'var(--navy-500)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  All ({alertsList.length})
                </button>
                <button
                  onClick={() => setNotifFilter('unread')}
                  style={{
                    border: 'none',
                    background: notifFilter === 'unread' ? 'var(--navy-200)' : 'transparent',
                    color: notifFilter === 'unread' ? 'var(--navy-900)' : 'var(--navy-500)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notification Items */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                {displayedAlerts.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--navy-400)' }}>
                    <CheckCircle2 size={28} style={{ opacity: 0.3, margin: '0 auto 8px', color: 'var(--green-500)' }} />
                    <div style={{ fontSize: '0.8125rem', color: 'var(--navy-600)' }}>All caught up!</div>
                    <div style={{ fontSize: '0.6875rem', marginTop: 2 }}>No unread notifications</div>
                  </div>
                ) : (
                  displayedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: !alert.read ? (isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)') : 'transparent',
                        borderLeft: !alert.read ? '3px solid var(--green-500)' : '3px solid transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: alert.type === 'critical' ? 'var(--red-100)' : alert.type === 'warning' ? 'var(--amber-100)' : 'var(--teal-100)',
                          color: alert.type === 'critical' ? 'var(--red-500)' : alert.type === 'warning' ? 'var(--amber-500)' : 'var(--teal-500)',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {alert.type === 'critical' ? <AlertTriangle size={14} /> : alert.type === 'warning' ? <Droplets size={14} /> : <CheckCircle2 size={14} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--navy-800)', lineHeight: 1.3 }}>
                          {alert.title}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--navy-500)', marginTop: 2, lineHeight: 1.4 }}>
                          {alert.message}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--navy-400)', marginTop: 4 }}>
                          {alert.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View All Button */}
              <div
                style={{
                  padding: '8px 16px',
                  borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--navy-100)'}`,
                  textAlign: 'center',
                }}
              >
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    navigate(role === 'admin' ? '/admin/alerts' : role === 'maintenance' ? '/maintenance/tasks' : '/student/myreports');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--green-600)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  View full alerts center <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Dark / Light Mode Toggle Button ─────────────────────── */}
        <button
          className="topbar-btn topbar-theme-btn"
          onClick={handleThemeToggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
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
          <span style={{ opacity: 0, pointerEvents: 'none' }}><Moon size={16} /></span>
        </button>

        {/* ── 5. Live Telemetry Status Pill & Diagnostic Popover ──────── */}
        <div ref={liveRef} style={{ position: 'relative' }}>
          <div
            className="topbar-live-status"
            onClick={() => setLiveOpen(prev => !prev)}
            title="Click to view IoT Telemetry & Network Health"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 4,
              padding: '4px 8px',
              borderRadius: 20,
              background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            <span className="live-dot" />
            <span className="topbar-live-status-text" style={{ fontSize: '0.75rem', color: 'var(--green-500)', fontWeight: 600 }}>
              Live
            </span>
          </div>

          {liveOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                background: isDark ? '#161b22' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'var(--navy-200)'}`,
                borderRadius: 12,
                boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.65)' : '0 12px 36px rgba(0,0,0,0.14)',
                padding: '16px',
                zIndex: 1000,
                animation: 'fadeUp 0.18s ease both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy-800)' }}>
                  Campus Telemetry Live
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-500)' }}>
                  <span>Network Health</span>
                  <span style={{ color: 'var(--green-500)', fontWeight: 600 }}>100% Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-500)' }}>
                  <span>IoT Flow Sensors</span>
                  <span style={{ color: 'var(--navy-800)', fontWeight: 600 }}>12 Online / 0 Offline</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-500)' }}>
                  <span>Gateway Latency</span>
                  <span style={{ color: 'var(--navy-800)', fontWeight: 600 }}>{lastPingTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-500)' }}>
                  <span>Last Sync</span>
                  <span style={{ color: 'var(--navy-800)', fontWeight: 600 }}>
                    {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  handleRefresh();
                  setLiveOpen(false);
                }}
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--green-500)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={12} className={isRefreshing ? 'spin-icon' : ''} />
                Ping Diagnostic Stream
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── Toast Notification Banner ─────────────────────────────────── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: isDark ? '#1c2128' : '#0f172a',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 9999,
            animation: 'fadeUp 0.2s ease both',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
