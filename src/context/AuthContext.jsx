import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

const STORAGE_KEY = 'aquamanage_user';
const LAST_ACTIVE_KEY = 'aquamanage_last_active';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes idle timeout for Admin & Maintenance

// ── Fallback credentials for offline demo reliability ─────────────────────────
const CREDENTIALS = {
  admin: [
    { username: 'director@iiit.ac.in', password: 'Director@99',  name: 'Prof. A. Kulkarni', role: 'admin' },
    { username: 'hod@iiit.ac.in',      password: 'HoD@Admin2024', name: 'Dr. R. Sharma',     role: 'admin' },
  ],
  maintenance: [
    { username: 'EMP-01', password: 'Maint@1234', name: 'Ram Kumar',   role: 'maintenance' },
    { username: 'EMP-02', password: 'Maint@1234', name: 'Suresh Babu', role: 'maintenance' },
    { username: 'EMP-03', password: 'Maint@1234', name: 'Mohan Das',   role: 'maintenance' },
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsedUser = JSON.parse(stored);

      if (parsedUser?.role === 'admin' || parsedUser?.role === 'maintenance') {
        const lastActive = sessionStorage.getItem(LAST_ACTIVE_KEY);
        if (lastActive && Date.now() - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT) {
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(LAST_ACTIVE_KEY);
          return null;
        }
      }
      return parsedUser;
    } catch {
      return null;
    }
  });

  const logout = useCallback(async () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LAST_ACTIVE_KEY);
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // non-fatal
    }
  }, []);

  const updateLastActive = useCallback(() => {
    if (user && (user.role === 'admin' || user.role === 'maintenance')) {
      sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }
  }, [user]);

  // Sync session with local backend on initial load
  useEffect(() => {
    apiClient
      .get('/auth/me')
      .then((res) => {
        if (res && res.success && res.user) {
          setUser(res.user);
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        }
      })
      .catch(() => {
        // Backend not yet running or no active cookie session
      });
  }, []);

  // Monitor user activity and handle 15-min idle timeout for Admin & Maintenance
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'maintenance')) return;

    updateLastActive();
    const handleUserActivity = () => updateLastActive();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity));

    const interval = setInterval(() => {
      const lastActive = sessionStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActive && Date.now() - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 10000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [user, updateLastActive, logout]);

  // ── Universal Login (Admin & Maintenance) ───────────────────────────────────
  const login = async (role, username, password) => {
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, error: 'Username and password are required.' };
    }

    try {
      // 1. Authenticate against local Express backend
      const res = await apiClient.post('/auth/login', {
        role,
        username: cleanUsername,
        password: cleanPassword,
      });

      if (res && res.success && res.user) {
        const userData = {
          id: res.user.id,
          name: res.user.name,
          role: res.user.role,
          username: cleanUsername,
          email: res.user.email,
          employee_id: res.user.employee_id,
        };

        setUser(userData);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        return { success: true, user: userData };
      }
    } catch (err) {
      // If server returned a 401/403 validation error, pass message to user
      if (err.status === 401 || err.status === 403 || err.status === 400) {
        return { success: false, error: err.message };
      }

      console.warn('[AuthContext] Local backend unreachable, testing fallback credentials:', err.message);
    }

    // 2. Offline fallback credentials for demo reliability if backend is starting
    const list = CREDENTIALS[role] || [];
    const found = list.find(
      (c) => c.username.trim().toLowerCase() === cleanUsername.toLowerCase() && c.password.trim() === cleanPassword
    );
    if (found) {
      const userData = { id: 999, name: found.name, role: found.role, username: found.username };
      setUser(userData);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      if (role === 'admin' || role === 'maintenance') {
        sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
      return { success: true, user: userData };
    }

    return { success: false, error: 'Invalid credentials. Please check your username and password.' };
  };

  // ── Student Login ───────────────────────────────────────────────────────────
  const loginStudent = async (name, irnNo) => {
    const cleanName = (name || '').trim();
    const cleanIrn  = (irnNo || '').trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanIrn) {
      return { success: false, error: 'Please enter your IRN No. / PRN No.' };
    }

    try {
      const res = await apiClient.post('/auth/login', {
        role: 'student',
        name: cleanName,
        irnNo: cleanIrn,
      });

      if (res && res.success && res.user) {
        const userData = {
          id: res.user.id,
          name: res.user.name,
          irnNo: cleanIrn,
          student_id: cleanIrn,
          role: 'student',
          username: cleanName,
        };

        setUser(userData);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return { success: true, user: userData };
      }
    } catch (err) {
      console.warn('[AuthContext] Local backend error on student login, using local session:', err.message);
    }

    // Fallback session
    const userData = {
      id: `stud-${cleanIrn}`,
      name: cleanName,
      irnNo: cleanIrn,
      student_id: cleanIrn,
      role: 'student',
      username: cleanName,
    };
    setUser(userData);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return { success: true, user: userData };
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
export default AuthContext;
