'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { user, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      console.log('[Sign Out] Attempting to sign out...');
      
      // Better Auth sign-out endpoint
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });

      console.log('[Sign Out] Response status:', response.status);
      console.log('[Sign Out] Response OK:', response.ok);
      
      // Better Auth may return 200, 204, or redirect
      // Even if there's an error, we'll clear cookies and redirect
      if (response.ok || response.status === 204 || response.status === 302) {
        console.log('[Sign Out] Sign out successful');
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('[Sign Out] Sign out API returned error:', response.status, errorText);
      }
      
      // Always clear cookies and redirect (even if API call failed)
      // This ensures the user is signed out locally
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        // Clear all auth-related cookies
        if (name.includes('auth') || name.includes('session') || name.includes('token')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
        }
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('[Sign Out] Sign out error:', error);
      // Clear cookies manually as fallback
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

  // Get user initials for avatar
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get user display name
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'User';
  };

  // Get plan name (default to Free Plan if no subscription)
  const getPlanName = () => {
    // TODO: Fetch actual subscription from database
    return 'RankYak Free Plan';
  };

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/dashboard' },
    { name: 'Calendar', icon: '📅', path: '/dashboard/calendar' },
    { name: 'Articles', icon: '📝', path: '/dashboard/articles' },
    { name: 'Blog', icon: '✍️', path: '/dashboard/blog' },
    { name: 'Keywords', icon: '🏷️', path: '/dashboard/keywords' },
    { name: 'Analytics', icon: '📈', path: '/dashboard/analytics' },
    { name: 'Backlinks', icon: '🔗', path: '/dashboard/backlinks' },
    { name: 'Settings', icon: '⚙️', path: '/dashboard/settings', hasSubmenu: true },
  ];

  const settingsSubmenu = [
    { name: 'Project', path: '/dashboard/settings/project' },
    { name: 'Articles', path: '/dashboard/settings/articles' },
    { name: 'Integrations', path: '/dashboard/settings/integrations' },
    { name: 'Billing', path: '/dashboard/settings/billing' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard/settings') {
      return pathname?.startsWith('/dashboard/settings');
    }
    return pathname === path;
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gray-50 border-r border-gray-200 transition-all duration-300 z-50 ${
      isExpanded ? 'w-64' : 'w-20'
    } hidden md:block`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">↑</span>
              </div>
              {isExpanded && (
                <div>
                  <div className="font-bold text-gray-900">RankYak</div>
                  <div className="text-xs text-gray-500">rankyak.com</div>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? '←' : '→'}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                {item.hasSubmenu ? (
                  <div>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {isExpanded && <span className="flex-1 text-left">{item.name}</span>}
                      {isExpanded && (
                        <span className={showSettings ? 'rotate-90' : ''}>›</span>
                      )}
                    </button>
                    {isExpanded && showSettings && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {settingsSubmenu.map((subItem) => (
                          <li key={subItem.path}>
                            <Link
                              href={subItem.path}
                              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                pathname === subItem.path
                                  ? 'bg-blue-50 text-blue-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {isExpanded && <span>{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/dashboard/support"
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>🎧</span>
            {isExpanded && <span>Support</span>}
          </Link>
          <Link
            href="/dashboard/feedback"
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>💡</span>
            {isExpanded && <span>Feedback</span>}
          </Link>
          
          {/* User Profile */}
          <div className="pt-4 border-t border-gray-200">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                {isExpanded && (
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                    {getInitials(user?.name, user?.email)}
                  </div>
                  {isExpanded && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{getUserName()}</div>
                      <div className="text-xs text-gray-500 truncate">{getPlanName()}</div>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 text-left"
                  >
                    <span>🚪</span>
                    <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
