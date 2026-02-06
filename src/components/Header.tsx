// src/components/Header.tsx
'use client';

import {
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Zap,
  Menu,
  X,
  Clock,
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
  freeTrialRemainingMs?: number;
  freeTrialActive?: boolean;
}

export function Header({
  lastUpdated,
  isLoading,
  isUsingMockData,
  remainingRequests,
  onRefresh,
  onQuickScan,
  freeTrialRemainingMs = 0,
  freeTrialActive = false,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const subscription = (session?.user as { subscription?: string })?.subscription;

  // Format free trial remaining time as M:SS
  const formatTrialRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine trial countdown color
  const getTrialColor = (ms: number) => {
    if (ms <= 30000) return '#ef4444'; // red at 30s
    if (ms <= 60000) return '#f97316'; // orange at 1m
    return '#22c55e'; // green otherwise
  };

  const trialColor = getTrialColor(freeTrialRemainingMs);

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

            {/* Center: Free Trial Countdown (when active) */}
            {freeTrialActive && freeTrialRemainingMs > 0 && (
              <div className="hidden lg:flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${trialColor} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${trialColor} 40%, transparent)`,
                  }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: trialColor }} />
                  <span className="text-xs font-medium" style={{ color: trialColor }}>
                    Free Trial
                  </span>
                  <span
                    className="font-mono text-sm font-semibold tabular-nums"
                    style={{ color: trialColor }}
                  >
                    {formatTrialRemaining(freeTrialRemainingMs)}
                  </span>
                </div>
                <a
                  href="https://www.edgemaxxer.com/#pricing"
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hover:opacity-90"
                  style={{
                    backgroundColor: trialColor,
                    color: 'white',
                  }}
                >
                  Subscribe
                </a>
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Free Trial Countdown - Mobile/Tablet (compact) */}
              {freeTrialActive && freeTrialRemainingMs > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg lg:hidden"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${trialColor} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${trialColor} 40%, transparent)`,
                  }}
                >
                  <Clock className="w-3 h-3" style={{ color: trialColor }} />
                  <span
                    className="font-mono text-xs font-semibold tabular-nums"
                    style={{ color: trialColor }}
                  >
                    {formatTrialRemaining(freeTrialRemainingMs)}
                  </span>
                </div>
              )}

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

            {/* Free Trial Notice (mobile drawer) */}
            {freeTrialActive && freeTrialRemainingMs > 0 && (
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: trialColor }} />
                    <span className="text-sm font-medium" style={{ color: trialColor }}>
                      Free Trial
                    </span>
                    <span
                      className="font-mono text-sm font-semibold tabular-nums"
                      style={{ color: trialColor }}
                    >
                      {formatTrialRemaining(freeTrialRemainingMs)}
                    </span>
                  </div>
                  <a
                    href="https://www.edgemaxxer.com/#pricing"
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                    style={{
                      backgroundColor: trialColor,
                      color: 'white',
                    }}
                  >
                    Subscribe
                  </a>
                </div>
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
