import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Maps each role to its dedicated login page
const LOGIN_PAGE = {
  admin:       '/login/admin',
  maintenance: '/login/maintenance',
  student:     '/login/student',
};

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in → send to the appropriate login page
  if (!user) {
    const dest = requiredRole ? LOGIN_PAGE[requiredRole] : '/login/student';
    return <Navigate to={dest} state={{ from: location }} replace />;
  }

  // Logged in but wrong role → send to their authorized landing page
  // Note: Admins have supervisory access to inspect student and maintenance views
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    if (user.role === 'maintenance') return <Navigate to="/maintenance/tasks" replace />;
    return <Navigate to="/student/report" replace />;
  }

  return children;
}
