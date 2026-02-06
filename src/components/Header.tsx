// src/components/Header.tsx
'use client';

import {
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Settings,
  Zap,
  Menu,
  X,
  Clock,
  Sparkles,
  Calendar,
  Repeat,
  Crown,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { CheckoutModal } from '@/components/CheckoutModal';

type PlanType = 'trial' | 'monthly' | 'yearly';

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

  // Plan picker & checkout state
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanType | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const planPickerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (planPickerRef.current && !planPickerRef.current.contains(event.target as Node)) {
        setShowPlanPicker(false);
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
        setShowPlanPicker(false);
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

  const handleSelectPlan = (plan: PlanType) => {
    setShowPlanPicker(false);
    setMobileMenuOpen(false);
    setCheckoutPlan(plan);
    setShowCheckoutModal(true);
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

  // Plan picker dropdown component (reused for desktop & mobile)
  const PlanPickerDropdown = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div
      className={
        isMobile
          ? 'space-y-2'
          : 'absolute right-0 mt-2 w-64 rounded-xl border shadow-xl overflow-hidden'
      }
      style={
        isMobile
          ? undefined
          : {
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }
      }
    >
      {!isMobile && (
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            Choose a plan
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Get full access to the scanner
          </p>
        </div>
      )}

      <div className={isMobile ? 'space-y-2' : 'p-2 space-y-1'}>
        {/* 3-Day Trial */}
        <button
          onClick={() => handleSelectPlan('trial')}
          className={`w-full flex items-center gap-3 text-left rounded-lg transition-colors hover:bg-[var(--background)] ${
            isMobile ? 'px-3 py-3 border' : 'px-3 py-2.5'
          }`}
          style={
            isMobile
              ? {
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface)',
                }
              : undefined
          }
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, #f97316 15%, transparent)',
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: '#f97316' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-medium"
              style={{ color: 'var(--foreground)' }}
            >
              3-Day Trial
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              $2.99 one-time
            </div>
          </div>
        </button>

        {/* Monthly */}
        <button
          onClick={() => handleSelectPlan('monthly')}
          className={`w-full flex items-center gap-3 text-left rounded-lg transition-colors hover:bg-[var(--background)] ${
            isMobile ? 'px-3 py-3 border' : 'px-3 py-2.5'
          }`}
          style={
            isMobile
              ? {
                  borderColor: '#22c55e',
                  backgroundColor: 'color-mix(in srgb, #22c55e 5%, var(--surface))',
                }
              : undefined
          }
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)',
            }}
          >
            <Repeat className="w-4 h-4" style={{ color: '#22c55e' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Monthly
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)',
                  color: '#22c55e',
                }}
              >
                POPULAR
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                $9.99
              </span>{' '}
              $4.99 first month
            </div>
          </div>
        </button>

        {/* Yearly */}
        <button
          onClick={() => handleSelectPlan('yearly')}
          className={`w-full flex items-center gap-3 text-left rounded-lg transition-colors hover:bg-[var(--background)] ${
            isMobile ? 'px-3 py-3 border' : 'px-3 py-2.5'
          }`}
          style={
            isMobile
              ? {
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface)',
                }
              : undefined
          }
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, #a855f7 15%, transparent)',
            }}
          >
            <Crown className="w-4 h-4" style={{ color: '#a855f7' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-medium"
              style={{ color: 'var(--foreground)' }}
            >
              Yearly
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              $99/year — save 17%
            </div>
          </div>
        </button>
      </div>
    </div>
  );

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
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center">
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
            </div>

            {/* Center: Free Trial Countdown (desktop — centered with flex-1) */}
            {freeTrialActive && freeTrialRemainingMs > 0 && (
              <div className="hidden lg:flex flex-1 items-center justify-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${trialColor} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${trialColor} 40%, transparent)`,
                  }}
                >
                  <Clock
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: trialColor }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: trialColor }}
                  >
                    Free Trial
                  </span>
                  <span
                    className="font-mono text-sm font-semibold tabular-nums"
                    style={{ color: trialColor }}
                  >
                    {formatTrialRemaining(freeTrialRemainingMs)}
                  </span>
                </div>
                <div className="relative" ref={planPickerRef}>
                  <button
                    onClick={() => setShowPlanPicker(!showPlanPicker)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hover:opacity-90"
                    style={{
                      backgroundColor: trialColor,
                      color: 'white',
                    }}
                  >
                    Subscribe
                  </button>
                  {showPlanPicker && <PlanPickerDropdown />}
                </div>
              </div>
            )}

            {/* If no trial active, still need flex-1 spacer for centering */}
            {!(freeTrialActive && freeTrialRemainingMs > 0) && (
              <div className="hidden lg:flex flex-1" />
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
                  <Clock
                    className="w-3 h-3"
                    style={{ color: trialColor }}
                  />
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
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
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
                    <span className="text-sm hidden lg:block">
                      {session.user.name?.split(' ')[0] || 'User'}
                    </span>
                    {subscription && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium hidden md:block"
                        style={{
                          backgroundColor:
                            subscription === 'active'
                              ? 'color-mix(in srgb, #22c55e 15%, transparent)'
                              : 'color-mix(in srgb, var(--warning) 15%, transparent)',
                          color:
                            subscription === 'active'
                              ? '#22c55e'
                              : 'var(--warning)',
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
                      <div
                        className="px-4 py-3 border-b"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {session.user.name}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: 'var(--muted)' }}
                        >
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
                          <Settings
                            className="w-4 h-4"
                            style={{ color: 'var(--muted)' }}
                          />
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
                <span className="hidden sm:inline">
                  {isLoading ? 'Scanning...' : 'Full Scan'}
                </span>
                <span className="sm:hidden">
                  {isLoading ? '...' : 'Scan'}
                </span>
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
        <div
          className="fixed inset-0 z-50 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
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
            <div
              className="flex items-center justify-between px-4 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <span
                className="font-medium"
                style={{ color: 'var(--foreground)' }}
              >
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
              <div
                className="px-4 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
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
                    <p
                      className="font-medium truncate"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {session.user.name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--muted)' }}
                    >
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
                        color:
                          subscription === 'active'
                            ? '#22c55e'
                            : 'var(--warning)',
                      }}
                    >
                      {subscription === 'active' ? 'PRO' : 'TRIAL'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Free Trial + Plan Picker (mobile drawer) */}
            {freeTrialActive && freeTrialRemainingMs > 0 && (
              <div
                className="px-4 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock
                    className="w-4 h-4"
                    style={{ color: trialColor }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: trialColor }}
                  >
                    Free Trial
                  </span>
                  <span
                    className="font-mono text-sm font-semibold tabular-nums"
                    style={{ color: trialColor }}
                  >
                    {formatTrialRemaining(freeTrialRemainingMs)}
                  </span>
                </div>

                <p
                  className="text-xs mb-3"
                  style={{ color: 'var(--muted)' }}
                >
                  Subscribe to keep access after your trial ends
                </p>

                <PlanPickerDropdown isMobile />
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
                <Settings
                  className="w-5 h-5"
                  style={{ color: 'var(--muted)' }}
                />
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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => {
          setShowCheckoutModal(false);
          setCheckoutPlan(null);
        }}
        plan={checkoutPlan}
      />
    </>
  );
}
