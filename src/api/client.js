/**
 * client.js — Unified API Client for AquaManage
 * Handles all REST API communications with automatic JSON parsing and graceful fallback.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`[API Warning] Request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    login: (role, username, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ role, username, password }),
      }),

    studentLogin: (name, irnNo) =>
      request('/auth/student-login', {
        method: 'POST',
        body: JSON.stringify({ name, irnNo }),
      }),

    getUsers: () => request('/auth/users'),
  },

  // ── Leak Reports & Issues ─────────────────────────────────────────────────
  reports: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/reports${qs ? `?${qs}` : ''}`);
    },

    getById: (id) => request(`/reports/${id}`),

    create: (formDataOrJson) => {
      const isForm = formDataOrJson instanceof FormData;
      return request('/reports', {
        method: 'POST',
        body: isForm ? formDataOrJson : JSON.stringify(formDataOrJson),
      });
    },

    update: (id, updates) =>
      request(`/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    addWorkLog: (id, note) =>
      request(`/reports/${id}/work-log`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
  },

  // ── Tanks & IoT Telemetry ─────────────────────────────────────────────────
  tanks: {
    getAll: () => request('/tanks'),
    getById: (id) => request(`/tanks/${id}`),
    updateTelemetry: (id, current) =>
      request(`/tanks/${id}/telemetry`, {
        method: 'POST',
        body: JSON.stringify({ current }),
      }),
  },

  // ── Harvesting ────────────────────────────────────────────────────────────
  harvesting: {
    getSummary: () => request('/harvesting/summary'),
  },

  // ── Water Usage & Analytics ───────────────────────────────────────────────
  usage: {
    getZones: () => request('/usage/zones'),
  },

  // ── Alerts & Notifications ────────────────────────────────────────────────
  alerts: {
    getAll: () => request('/alerts'),
    markRead: (id) => request(`/alerts/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/alerts/mark-all-read', { method: 'POST' }),
  },

  // ── Campus GIS Map ────────────────────────────────────────────────────────
  map: {
    getPins: () => request('/map/pins'),
    getBuildings: () => request('/map/buildings'),
  },

  // ── Health ────────────────────────────────────────────────────────────────
  health: () => request('/health'),
};

export default api;
