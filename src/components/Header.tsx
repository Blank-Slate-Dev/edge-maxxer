// src/components/Header.tsx
'use client';

import {
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Settings,
  Key,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ExternalLink,
  Zap,
  Menu,
  X,
} from 'lucide-react';
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
  onQuickScan?: () => void;
}

export function Header({
  lastUpdated,
  isLoading,
  isUsingMockData,
  remainingRequests,
  onRefresh,
  onQuickScan,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
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
  const isKeyEmpty = !apiKey || apiKey.trim() === '';

  return (
    <>
      <header
        className="border-b sticky top-0 z-50 transition-colors"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--background)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <Link href="/" className="flex items-center">
                {/* Responsive logo - smaller on mobile */}
                <Image
                  src="/logo_thin_dark_version.png"
                  alt="Edge Maxxer"
                  width={300}
                  height={72}
                  priority
                  className="h-10 sm:h-12 lg:h-16 w-auto logo-dark"
                />
                <Image
                  src="/logo_thin_light_version.png"
                  alt="Edge Maxxer"
                  width={300}
                  height={72}
                  priority
                  className="h-10 sm:h-12 lg:h-16 w-auto logo-light"
                />
              </Link>
              {lastUpdated && (
                <span className="text-xs sm:text-sm hidden lg:block" style={{ color: 'var(--muted)' }}>
                  Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Center: API Key Input (desktop only) */}
            {hasLoadedKey && (
              <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: `1px solid ${
                        keyError ? 'var(--danger)' : keySaveSuccess ? '#22c55e' : 'var(--border)'
                      }`,
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
                      color: 'var(--background)',
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
                        color: remainingRequests < 100 ? 'var(--warning)' : 'var(--muted)',
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
                        color: '#22c55e',
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
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Mock Data Indicator - hide on mobile */}
              {isUsingMockData && (
                <span
                  className="text-xs px-2 py-1 rounded hidden sm:block"
                  style={{
                    backgroundColor: 'var(--warning-muted)',
                    color: 'var(--warning)',
                  }}
                >
                  Demo
                </span>
              )}

              {/* API Remaining - Mobile only (compact) */}
              {remainingRequests !== undefined && !isKeyEmpty && (
                <span
                  className="text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-1 rounded lg:hidden"
                  style={{
                    backgroundColor: remainingRequests < 100 ? 'var(--warning-muted)' : 'var(--surface)',
                    color: remainingRequests < 100 ? 'var(--warning)' : 'var(--muted)',
                  }}
                >
                  {remainingRequests}
                </span>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--muted)' }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Menu - Desktop */}
              {session?.user && (
                <div className="relative hidden sm:block" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--muted)',
                      }}
                    >
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm hidden lg:block">{session.user.name?.split(' ')[0] || 'User'}</span>
                    {subscription && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium hidden md:block"
                        style={{
                          backgroundColor:
                            subscription === 'active'
                              ? 'color-mix(in srgb, #22c55e 15%, transparent)'
                              : 'color-mix(in srgb, var(--warning) 15%, transparent)',
                          color: subscription === 'active' ? '#22c55e' : 'var(--warning)',
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
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
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

              {/* Quick Scan Button */}
              {onQuickScan && (
                <button
                  onClick={onQuickScan}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: '#7ac875',
                    color: '#7ac875',
                  }}
                  title="Quick scan: NBA, NFL, NHL, MLB, EPL, Tennis, AFL, NRL"
                >
                  <span className={isLoading ? 'animate-pulse' : ''}>
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <span className="hidden sm:inline">Quick Scan</span>
                </button>
              )}

              {/* Full Scan Button */}
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                }}
              >
                <span className={isLoading ? 'animate-spin' : ''}>
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span className="hidden sm:inline">{isLoading ? 'Scanning...' : 'Full Scan'}</span>
                <span className="sm:hidden">{isLoading ? '...' : 'Scan'}</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)] sm:hidden"
                style={{ color: 'var(--foreground)' }}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setMobileMenuOpen(false)}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          />

          {/* Drawer */}
          <div
            className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm overflow-y-auto"
            style={{ backgroundColor: 'var(--background)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            {session?.user && (
              <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--surface)',
                      color: 'var(--muted)',
                    }}
                  >
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {session.user.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {session.user.email}
                    </p>
                  </div>
                  {subscription && (
                    <span
                      className="text-xs px-2 py-1 rounded font-medium shrink-0"
                      style={{
                        backgroundColor:
                          subscription === 'active'
                            ? 'color-mix(in srgb, #22c55e 15%, transparent)'
                            : 'color-mix(in srgb, var(--warning) 15%, transparent)',
                        color: subscription === 'active' ? '#22c55e' : 'var(--warning)',
                      }}
                    >
                      {subscription === 'active' ? 'PRO' : 'TRIAL'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* API Key Section */}
            {hasLoadedKey && (
              <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  Odds API Key
                </label>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: `1px solid ${
                      keyError ? 'var(--danger)' : keySaveSuccess ? '#22c55e' : 'var(--border)'
                    }`,
                  }}
                >
                  <Key className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key"
                    className="flex-1 bg-transparent text-sm font-mono outline-none min-w-0"
                    style={{ color: 'var(--foreground)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="shrink-0 p-1"
                    style={{ color: 'var(--muted)' }}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveApiKey}
                    disabled={isSavingKey}
                    className="flex-1 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: keySaveSuccess ? '#22c55e' : 'var(--foreground)',
                      color: 'var(--background)',
                    }}
                  >
                    {isSavingKey ? 'Saving...' : keySaveSuccess ? 'Saved!' : 'Save Key'}
                  </button>

                  {isKeyEmpty && (
                    <a
                      href="https://the-odds-api.com/#get-access"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)',
                        color: '#22c55e',
                      }}
                    >
                      Get key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {remainingRequests !== undefined && !isKeyEmpty && (
                  <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                    {remainingRequests} API calls remaining
                  </p>
                )}
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </p>
              </div>
            )}

            {/* Navigation Links */}
            <div className="py-2">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--foreground)' }}
              >
                <Settings className="w-5 h-5" style={{ color: 'var(--muted)' }} />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>

            {/* Demo Mode Notice */}
            {isUsingMockData && (
              <div
                className="mx-4 mb-4 px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: 'var(--warning-muted)',
                  color: 'var(--warning)',
                }}
              >
                Demo mode — add API key for live data
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
