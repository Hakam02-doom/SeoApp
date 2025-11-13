'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        // Better Auth uses /api/auth/session endpoint
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });
        
        console.log('[useAuth] Session response status:', response.status);
        console.log('[useAuth] Session response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          // Check if response has content before parsing
          const text = await response.text();
          let data: any = null;
          
          if (text && text.trim() !== 'null' && text.trim() !== '') {
            try {
              data = JSON.parse(text);
            } catch (e) {
              console.error('[useAuth] Failed to parse JSON:', text);
              data = null;
            }
          }
          
          console.log('[useAuth] Session data:', data);
          
          // Check if data exists and is not null
          if (!data || data === null) {
            console.log('[useAuth] No session data (user not logged in)');
            setSession(null);
            setUser(null);
            return;
          }
          
          // Better Auth returns { user, session } or just the user object
          if (data && typeof data === 'object' && data.user) {
            setUser(data.user);
            setSession(data.session || data);
            console.log('[useAuth] User set:', data.user);
          } else if (data && typeof data === 'object' && data.id) {
            // Sometimes it returns the user directly
            setUser(data);
            setSession(data);
            console.log('[useAuth] User set (direct):', data);
          } else {
            console.log('[useAuth] No user found in response');
            setSession(null);
            setUser(null);
          }
        } else {
          console.log('[useAuth] Session response not OK:', response.status);
          setSession(null);
          setUser(null);
        }
      } catch (err: any) {
        console.error('[useAuth] Error fetching session:', err);
        setError(err);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  return {
    user,
    session,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}