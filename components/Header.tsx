'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const authResult = useAuth();
  const { user, isAuthenticated, isLoading } = authResult || { user: null, isAuthenticated: false, isLoading: true };
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok || response.status === 204 || response.status === 302) {
        console.log('[Sign Out] Sign out successful');
      }
      
      // Clear cookies and redirect
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name.includes('auth') || name.includes('session') || name.includes('token')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
        }
      });
      
      window.location.href = '/';
    } catch (error: any) {
      console.error('[Sign Out] Sign out error:', error);
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name.includes('auth') || name.includes('session') || name.includes('token')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
        }
      });
      window.location.href = '/';
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
      {/* Glass effect background - rounded container */}
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          {/* Subtle gradient overlay - more transparent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-pink-50/10 pointer-events-none"></div>
          
          <nav className="relative px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">RankYak</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              How it works
            </Link>
            <Link href="#examples" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Writing Examples
            </Link>
            <Link href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Pricing
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Blog
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/sign-in/social', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ provider: 'google' }),
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        }
                      }
                    } catch (err: any) {
                      console.error('Google sign-in error:', err);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Join with Google
                </button>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg"
                >
                  Start for Free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              className="p-2 z-10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden py-4 space-y-4 border-t border-white/20 mt-2">
            <Link href="#how-it-works" className="block text-gray-700 hover:text-gray-900 font-medium">
              How it works
            </Link>
            <Link href="#examples" className="block text-gray-700 hover:text-gray-900 font-medium">
              Writing Examples
            </Link>
            <Link href="#pricing" className="block text-gray-700 hover:text-gray-900 font-medium">
              Pricing
            </Link>
            <Link href="/blog" className="block text-gray-700 hover:text-gray-900 font-medium">
              Blog
            </Link>
            {isLoading ? (
              <div className="pt-4">Loading...</div>
            ) : isAuthenticated ? (
              <>
                <Link href="/dashboard" className="block text-gray-700 hover:text-gray-900 font-medium">
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="block text-gray-700 hover:text-gray-900 font-medium w-full text-left disabled:opacity-50"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            ) : (
              <div className="pt-4 space-y-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/sign-in/social', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ provider: 'google' }),
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        }
                      }
                    } catch (err: any) {
                      console.error('Google sign-in error:', err);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Join with Google
                </button>
                <Link
                  href="/register"
                  className="block w-full text-center inline-flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Start for Free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
            </div>
          )}
          </nav>
        </div>
      </div>
    </header>
  );
}
