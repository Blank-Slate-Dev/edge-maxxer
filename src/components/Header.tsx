// src/components/Header.tsx
'use client';

import { RefreshCw, Sun, Moon, LogOut, Settings, Key, Eye, EyeOff, Check, Loader2, ExternalLink } from 'lucide-react';
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

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [hasLoadedKey, setHasLoadedKey] = useState(false);

  // Load API key on mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.oddsApiKey || '');
        }
      } catch (err) {
        console.error('Failed to fetch API key:', err);
      } finally {
        setHasLoadedKey(true);
      }
    };

    if (session) {
      fetchApiKey();
    }
  }, [session]);

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

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    setKeyError('');
    setKeySaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oddsApiKey: apiKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setKeySaveSuccess(true);
      setTimeout(() => setKeySaveSuccess(false), 2000);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Failed to save');
      setTimeout(() => setKeyError(''), 3000);
    } finally {
      setIsSavingKey(false);
    }
  };

  const subscription = (session?.user as { subscription?: string })?.subscription;

  // Check if key looks valid (basic check)
  const isKeyEmpty = !apiKey || apiKey.trim() === '';

  return (
    <header 
      className="border-b sticky top-0 z-50 transition-colors"
      style={{ 
        borderColor: 'var(--border)', 
        backgroundColor: 'var(--background)' 
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/dashboard" className="flex items-center">
              {/* Both logos rendered, CSS controls visibility based on theme */}
              <Image
                src="/logo_thin_dark_version.png"
                alt="Edge Maxxer"
                width={300}
                height={72}
                priority
                className="h-16 w-auto logo-dark"
              />
              <Image
                src="/logo_thin_light_version.png"
                alt="Edge Maxxer"
                width={300}
                height={72}
                priority
                className="h-16 w-auto logo-light"
              />
            </Link>
            {lastUpdated && (
              <span className="text-sm hidden lg:block" style={{ color: 'var(--muted)' }}>
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Center: API Key Input (desktop only) */}
          {hasLoadedKey && (
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="flex items-center gap-2 flex-1">
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1"
                  style={{ 
                    backgroundColor: 'var(--surface)',
                    border: `1px solid ${keyError ? 'var(--danger)' : keySaveSuccess ? '#22c55e' : 'var(--border)'}`,
                  }}
                >
                  <Key className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter Odds API key"
                    className="flex-1 bg-transparent text-xs font-mono outline-none min-w-0"
                    style={{ color: 'var(--foreground)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="shrink-0 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--muted)' }}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                
                <button
                  onClick={handleSaveApiKey}
                  disabled={isSavingKey}
                  className="shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: keySaveSuccess ? '#22c55e' : 'var(--foreground)',
                    color: 'var(--background)'
                  }}
                >
                  {isSavingKey ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : keySaveSuccess ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    'Save'
                  )}
                </button>
              </div>

              {/* API Calls Remaining / Get Key Link */}
              <div className="shrink-0 flex items-center gap-2">
                {remainingRequests !== undefined && !isKeyEmpty ? (
                  <span 
                    className="text-xs font-mono px-2 py-1 rounded whitespace-nowrap"
                    style={{ 
                      backgroundColor: remainingRequests < 100 ? 'var(--warning-muted)' : 'var(--surface)',
                      color: remainingRequests < 100 ? 'var(--warning)' : 'var(--muted)'
                    }}
                  >
                    {remainingRequests} left
                  </span>
                ) : isKeyEmpty ? (
                  <a
                    href="https://the-odds-api.com/#get-access"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded whitespace-nowrap transition-opacity hover:opacity-70"
                    style={{ 
                      backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)',
                      color: '#22c55e'
                    }}
                  >
                    Get free key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 shrink-0">
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
                  <span className="text-sm hidden lg:block">
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
