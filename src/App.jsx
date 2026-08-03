import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ── Dedicated login pages (completely separate, no shared UI) ─────────────────
import StudentLogin     from './pages/login/StudentLogin';
import AdminLogin       from './pages/login/AdminLogin';
import MaintenanceLogin from './pages/login/MaintenanceLogin';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Harvesting     from './pages/admin/Harvesting';
import WaterUsage     from './pages/admin/WaterUsage';
import LeakReports    from './pages/admin/LeakReports';
import MapView        from './pages/admin/MapView';
import Alerts         from './pages/admin/Alerts';
import Analytics      from './pages/admin/Analytics';

// Student pages
import ReportIssue       from './pages/student/ReportIssue';
import MyReports         from './pages/student/MyReports';
import StudentHarvesting from './pages/student/Harvesting';

// Maintenance pages
import TaskQueue      from './pages/maintenance/TaskQueue';
import CompletedTasks from './pages/maintenance/CompletedTasks';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Entry points — each role has its own isolated login page ── */}
          {/* / and unknown routes redirect to student login by default      */}
          <Route path="/"                   element={<Navigate to="/login/student" replace />} />
          <Route path="/login/student"     element={<StudentLogin />} />
          <Route path="/login/admin"       element={<AdminLogin />} />
          <Route path="/login/maintenance" element={<MaintenanceLogin />} />

          {/* ── Admin Routes (protected: role = admin) ──────────────────── */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/harvesting" element={<ProtectedRoute requiredRole="admin"><Harvesting /></ProtectedRoute>} />
          <Route path="/admin/usage"      element={<ProtectedRoute requiredRole="admin"><WaterUsage /></ProtectedRoute>} />
          <Route path="/admin/reports"    element={<ProtectedRoute requiredRole="admin"><LeakReports /></ProtectedRoute>} />
          <Route path="/admin/map"        element={<ProtectedRoute requiredRole="admin"><MapView /></ProtectedRoute>} />
          <Route path="/admin/alerts"     element={<ProtectedRoute requiredRole="admin"><Alerts /></ProtectedRoute>} />
          <Route path="/admin/analytics"  element={<ProtectedRoute requiredRole="admin"><Analytics /></ProtectedRoute>} />

          {/* ── Maintenance Routes (protected: role = maintenance) ────────── */}
          <Route path="/maintenance/tasks"     element={<ProtectedRoute requiredRole="maintenance"><TaskQueue /></ProtectedRoute>} />
          <Route path="/maintenance/completed" element={<ProtectedRoute requiredRole="maintenance"><CompletedTasks /></ProtectedRoute>} />

          {/* ── Student Routes (protected: any authenticated user) ────────── */}
          <Route path="/student/report"     element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
          <Route path="/student/myreports"  element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
          <Route path="/student/harvesting" element={<ProtectedRoute><StudentHarvesting /></ProtectedRoute>} />

          {/* Unknown URL → student login */}
          <Route path="*" element={<Navigate to="/login/student" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
