import { supabase, isSupabaseConfigured } from '../services/supabase';
import { validation } from './validation';
import { CREDENTIALS } from '../context/AuthContext';

export const authApi = {
  /**
   * Authenticate user with role, username, and password
   */
  async login({ role, username, password }) {
    const val = validation.loginCredentials(role, username, password);
    if (!val.isValid) {
      return { success: false, error: val.errorMessage };
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (role === 'student') {
      // Handled via student Supabase Auth flow
      return this.loginStudent({ name: cleanUsername, irnNo: cleanPassword || cleanUsername });
    }

    // Admin or Maintenance authentication
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanUsername.includes('@') ? cleanUsername : `${cleanUsername.toLowerCase()}@aquamanage.local`,
          password: cleanPassword,
        });

        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          return {
            success: true,
            user: {
              id: data.user.id,
              name: profile?.name || data.user.user_metadata?.name || cleanUsername,
              role: profile?.role || role,
              email: data.user.email,
              username: cleanUsername,
            },
          };
        }
      } catch (err) {
        console.warn('[authApi] Supabase remote auth failed, falling back to credentials validation:', err.message);
      }
    }

    // Verified credentials fallback for demo & offline testing
    const list = CREDENTIALS[role] || [];
    const found = list.find(
      (c) => c.username.trim().toLowerCase() === cleanUsername.toLowerCase() && c.password.trim() === cleanPassword
    );

    if (found) {
      return {
        success: true,
        user: {
          id: `usr-${role}-${cleanUsername}`,
          name: found.name,
          role: found.role,
          username: found.username,
        },
      };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please check your username and password.',
    };
  },

  /**
   * Authenticate student with Name & IRN No.
   */
  async loginStudent({ name, irnNo }) {
    const cleanName = (name || '').trim();
    const cleanIrn = (irnNo || '').trim();

    if (!cleanName || !cleanIrn) {
      return { success: false, error: 'Full name and IRN No. are required.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const email = `${cleanIrn.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.aquamanage.local`;
        const password = `Student#${cleanIrn.toLowerCase()}!2026`;

        let { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error && (error.message.includes('Invalid login') || error.message.includes('User not found'))) {
          const signUpRes = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: cleanName, identifier_no: cleanIrn, role: 'student' } },
          });
          if (signUpRes.error) throw signUpRes.error;
          data = signUpRes.data;
        } else if (error) {
          throw error;
        }

        return {
          success: true,
          user: {
            id: data?.user?.id || `stud-${cleanIrn}`,
            name: cleanName,
            irnNo: cleanIrn,
            role: 'student',
            email,
          },
        };
      } catch (err) {
        console.warn('[authApi] Student Supabase auth exception:', err.message);
      }
    }

    return {
      success: true,
      user: {
        id: `stud-${cleanIrn}`,
        name: cleanName,
        irnNo: cleanIrn,
        role: 'student',
      },
    };
  },

  /**
   * Log out active session
   */
  async logout() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    return { success: true };
  },
};

export default authApi;
