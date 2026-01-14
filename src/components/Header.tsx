// src/components/Header.tsx
'use client';

import { RefreshCw, Sun, Moon, LogOut, Settings, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  isUsingMockData: boolean;
  remainingRequests?: number;
  onRefresh: () => void;
}

export function Header({
  lastUpdated,
  isLoading,
  isUsingMockData,
  remainingRequests,
  onRefresh,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const subscription = (session?.user as { subscription?: string })?.subscription;

  return (
    <header 
      className="border-b sticky top-0 z-50 transition-colors"
      style={{ 
        borderColor: 'var(--border)', 
        backgroundColor: 'var(--background)' 
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Image
                  src="/logo_thin_dark_version.png"
                  alt="Edge Maxxer"
                  width={300}
                  height={72}
                  priority
                  className="h-16 w-auto"
                />
              ) : (
                <Image
                  src="/logo_thin_light_version.png"
                  alt="Edge Maxxer"
                  width={300}
                  height={72}
                  priority
                  className="h-16 w-auto"
                />
              )}
            </Link>
            {lastUpdated && (
              <span className="text-sm hidden sm:block" style={{ color: 'var(--muted)' }}>
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* API Calls Remaining */}
            {remainingRequests !== undefined && (
              <span 
                className="text-xs font-mono px-2 py-1 rounded hidden sm:block"
                style={{ 
                  backgroundColor: 'var(--surface)',
                  color: 'var(--muted)'
                }}
              >
                {remainingRequests} API calls left
              </span>
            )}

            {/* Mock Data Indicator */}
            {isUsingMockData && (
              <span 
                className="text-xs px-2 py-1 rounded hidden sm:block"
                style={{ 
                  backgroundColor: 'var(--warning-muted)',
                  color: 'var(--warning)'
                }}
              >
                Demo
              </span>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
              style={{ color: 'var(--muted)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User Menu */}
            {session?.user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                  style={{ color: 'var(--foreground)' }}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ 
                      backgroundColor: 'var(--surface)',
                      color: 'var(--muted)'
                    }}
                  >
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm hidden md:block">
                    {session.user.name?.split(' ')[0] || 'User'}
                  </span>
                  {subscription && (
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded font-medium hidden sm:block"
                      style={{ 
                        backgroundColor: subscription === 'active' 
                          ? 'color-mix(in srgb, #22c55e 15%, transparent)'
                          : 'color-mix(in srgb, var(--warning) 15%, transparent)',
                        color: subscription === 'active' ? '#22c55e' : 'var(--warning)'
                      }}
                    >
                      {subscription === 'active' ? 'PRO' : 'TRIAL'}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-lg border shadow-lg overflow-hidden"
                    style={{ 
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <div 
                      className="px-4 py-3 border-b"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {session.user.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                        {session.user.email}
                      </p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--background)]"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <Settings className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--background)]"
                        style={{ color: 'var(--danger)' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scan Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)'
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Scanning...' : 'Scan'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
