/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Login from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import { STATIC_MODE } from './services/staticMode';

const MOCK_USER = {
  id: "mock",
  displayName: "Visitante (Modo Estático)",
  photos: [{ value: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg" }]
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    if (STATIC_MODE) {
      const token = localStorage.getItem('steam_auth_token');
      if (token === 'mock_token') {
        setUser(MOCK_USER);
      }
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('steam_auth_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/user', { 
        headers,
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('steam_auth_token');
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleMessage = async (event: MessageEvent) => {
      if (STATIC_MODE) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.token) {
          console.log("[App] Exchanging auth token...");
          try {
            const exchangeRes = await fetch('/api/auth/exchange', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: event.data.token }),
              credentials: 'include'
            });
            if (exchangeRes.ok) {
              const data = await exchangeRes.json();
              if (data.token) {
                localStorage.setItem('steam_auth_token', data.token);
              }
              setUser(data.user);
            } else {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          }
        } else {
          checkAuth();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleMockLogin = () => {
    localStorage.setItem('steam_auth_token', 'mock_token');
    setUser(MOCK_USER);
  };

  const handleLogin = () => {
    if (STATIC_MODE) {
      handleMockLogin();
      return;
    }
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      '/api/auth/steam',
      'steam_login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#CD853F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <ErrorBoundary>{user ? <Dashboard user={user} /> : <Login onLogin={handleLogin} onMockLogin={handleMockLogin} />}</ErrorBoundary>;
}

