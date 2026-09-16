import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify JWT Token with Backend on mount
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('kh_auth_token');

    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          if (data.success && data.data?.user) {
            setProfile(data.data.user);
          } else {
            // Token invalid or expired
            localStorage.removeItem('kh_auth_token');
            localStorage.removeItem('kh_user_profile');
            setProfile(null);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Backend connection error on auth check:', err.message);
        if (mounted) {
          // If offline, check cached profile
          const cached = localStorage.getItem('kh_user_profile');
          if (cached) {
            try {
              setProfile(JSON.parse(cached));
            } catch (e) {
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.user) {
        const userObj = data.data.user;
        const token = data.data.token;
        localStorage.setItem('kh_auth_token', token);
        localStorage.setItem('kh_user_profile', JSON.stringify(userObj));
        setProfile(userObj);
        setLoading(false);
        return { error: null };
      }

      return { error: data.message || 'Invalid email or password' };
    } catch (e) {
      return { error: 'Unable to connect to backend server. Ensure Express API server is running on port 5000.' };
    }
  };

  const signUp = async (data) => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (res.ok && resData.success && resData.data?.user) {
        const userObj = resData.data.user;
        const token = resData.data.token;
        localStorage.setItem('kh_auth_token', token);
        localStorage.setItem('kh_user_profile', JSON.stringify(userObj));
        setProfile(userObj);
        setLoading(false);
        return { error: null };
      }

      return { error: resData.message || 'Registration failed' };
    } catch (e) {
      return { error: 'Unable to connect to backend server. Ensure Express API server is running on port 5000.' };
    }
  };

  const signOut = async () => {
    const token = localStorage.getItem('kh_auth_token');
    if (token) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (e) {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem('kh_auth_token');
    localStorage.removeItem('kh_user_profile');
    localStorage.removeItem('kh_demo_user');
    setProfile(null);
    setLoading(false);
  };

  const updateAuthProfile = (userObj) => {
    localStorage.setItem('kh_user_profile', JSON.stringify(userObj));
    setProfile(userObj);
  };

  const value = useMemo(
    () => ({ profile, loading, signIn, signUp, signOut, updateAuthProfile }),
    [profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}