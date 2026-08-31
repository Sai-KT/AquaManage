import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

const STORAGE_KEY    = 'aquamanage_user';
const LAST_ACTIVE_KEY = 'aquamanage_last_active';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes idle timeout for Admin & Maintenance

// Helper to generate normalized student email & deterministic credential for Supabase Auth
const getStudentEmail = (irnNo) => {
  const clean = (irnNo || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean}@student.aquamanage.local`;
};

const getStudentPassword = (irnNo) => {
  return `Student#${(irnNo || '').trim().toLowerCase()}!2026`;
};

// ── Hardcoded credentials for demo ─────────────────────────────────────────
const CREDENTIALS = {
  admin: [
    { username: 'director@iiit.ac.in', password: 'Director@99',  name: 'Prof. A. Kulkarni', role: 'admin' },
    { username: 'hod@iiit.ac.in',      password: 'HoD@Admin2024', name: 'Dr. R. Sharma',     role: 'admin' },
  ],
  maintenance: [
    { username: 'EMP-01', password: 'Maint@1234', name: 'Ram Kumar',   role: 'maintenance' },
    { username: 'EMP-02', password: 'Maint@1234', name: 'Suresh',      role: 'maintenance' },
    { username: 'EMP-03', password: 'Maint@1234', name: 'Mohan',       role: 'maintenance' },
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsedUser = JSON.parse(stored);

      // Check inactivity for admin and maintenance on page refresh within the same tab
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
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore sign out errors
      }
    }
  }, []);

  const updateLastActive = useCallback(() => {
    if (user && (user.role === 'admin' || user.role === 'maintenance')) {
      sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }
  }, [user]);

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

  // Admin & Maintenance login
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
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      if (role === 'admin' || role === 'maintenance') {
        sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials. Please check your username and password.' };
  };

  // ── Student Login with Supabase Auth ─────────────────────────────────────────
  const loginStudent = async (name, irnNo) => {
    const cleanName = (name || '').trim();
    const cleanIrn  = (irnNo || '').trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanIrn) {
      return { success: false, error: 'Please enter your IRN No. / PRN No.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const email = getStudentEmail(cleanIrn);
        const password = getStudentPassword(cleanIrn);

        // 1. Try signing in with existing credentials
        let { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // 2. If student does not exist yet in Supabase Auth, register them
        if (error && (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('user not found'))) {
          const signUpRes = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: cleanName,
                identifier_no: cleanIrn,
                role: 'student',
              },
            },
          });

          if (signUpRes.error) {
            return { success: false, error: signUpRes.error.message };
          }
          data = signUpRes.data;
        } else if (error) {
          return { success: false, error: error.message };
        }

        const authUser = data?.user;
        const userData = {
          id: authUser?.id || `stud-${cleanIrn}`,
          name: cleanName,
          irnNo: cleanIrn,
          role: 'student',
          username: cleanName,
          email: authUser?.email || email,
        };

        setUser(userData);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return { success: true, user: userData };
      } catch (err) {
        return { success: false, error: err.message || 'Authentication failed. Please try again.' };
      }
    } else {
      // Fallback session when Supabase env variables are not yet configured
      const userData = {
        id: `stud-${cleanIrn}`,
        name: cleanName,
        irnNo: cleanIrn,
        role: 'student',
        username: cleanName,
      };
      setUser(userData);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { success: true, user: userData };
    }
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
