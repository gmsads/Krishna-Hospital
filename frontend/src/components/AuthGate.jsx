import React, { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import AuthScreen from './AuthScreen';
import AppShell from './AppShell';
import { useRouter } from './common/useRouter';

function AuthGate() {
  const { profile, loading } = useAuth();
  const { path, navigate } = useRouter();

  const isAuthenticated = Boolean(profile);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        if (path !== '/login' && path !== '/register') {
          navigate('/login');
        }
      } else {
        if (path === '/' || path === '/login' || path === '/register') {
          navigate('/dashboard');
        }
      }
    }
  }, [loading, isAuthenticated, path, navigate]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Loading your workspace…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen path={path} navigate={navigate} />;
  }

  return <AppShell path={path} navigate={navigate} />;
}

export default AuthGate;