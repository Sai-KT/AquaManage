// ─── Authentication Context ──────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'aquamanage_user';
const LAST_ACTIVE_KEY = 'aquamanage_last_active';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes inactivity timeout for Admin & Maintenance

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
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsedUser = JSON.parse(stored);

      // Check inactivity for admin and maintenance on initial app launch / page refresh
      if (parsedUser?.role === 'admin' || parsedUser?.role === 'maintenance') {
        const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
        if (lastActive && Date.now() - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LAST_ACTIVE_KEY);
          return null;
        }
      }
      return parsedUser;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  }, []);

  const updateLastActive = useCallback(() => {
    if (user && (user.role === 'admin' || user.role === 'maintenance')) {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }
  }, [user]);

  // Monitor user activity and handle 15-min idle timeout for Admin & Maintenance
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'maintenance')) return;

    updateLastActive();

    const handleUserActivity = () => {
      updateLastActive();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity));

    // Check inactivity every 10 seconds
    const interval = setInterval(() => {
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActive && Date.now() - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 10000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [user, updateLastActive, logout]);

  const login = (role, username, password) => {
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();
    const list = CREDENTIALS[role] || [];
    const found = list.find(
      (c) => c.username.trim().toLowerCase() === cleanUsername.toLowerCase() && c.password.trim() === cleanPassword
    );
    if (found) {
      const userData = { name: found.name, role: found.role, username: found.username };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      if (role === 'admin' || role === 'maintenance') {
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials. Please check your username and password.' };
  };

  const loginStudent = (name, irnNo) => {
    const cleanName = (name || '').trim();
    const cleanIrn = (irnNo || '').trim();
    const userData = {
      name: cleanName || 'Student',
      irnNo: cleanIrn,
      role: 'student',
      username: cleanName || 'Student',
    };
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
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
