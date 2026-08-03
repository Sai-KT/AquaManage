// ─── Authentication Context ──────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// ── Hardcoded credentials for demo ─────────────────────────────────────────
const CREDENTIALS = {
  admin: [
    { username: 'admin@i2it.edu.in', password: 'Admin@1234', name: 'Dr. Sonali Patil', role: 'admin' },
    { username: 'director@i2it.edu.in', password: 'Director@99', name: 'Prof. A. Kulkarni', role: 'admin' },
  ],
  maintenance: [
    { username: 'EMP-01', password: 'Maint@1234', name: 'Ram Kumar', role: 'maintenance' },
    { username: 'EMP-02', password: 'Maint@1234', name: 'Suresh', role: 'maintenance' },
    { username: 'EMP-03', password: 'Maint@1234', name: 'Mohan', role: 'maintenance' },
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('aquamanage_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (role, username, password) => {
    const list = CREDENTIALS[role] || [];
    const found = list.find(
      (c) => c.username.toLowerCase() === username.toLowerCase() && c.password === password
    );
    if (found) {
      const userData = { name: found.name, role: found.role, username: found.username };
      setUser(userData);
      sessionStorage.setItem('aquamanage_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials. Please check your username and password.' };
  };

  const loginStudent = (name) => {
    const userData = { name: name || 'Student', role: 'student', username: name };
    setUser(userData);
    sessionStorage.setItem('aquamanage_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('aquamanage_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginStudent, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { CREDENTIALS };
