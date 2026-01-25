// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Flag } from '@/components';
import { config, type UserRegion } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sun, 
  Moon, 
  Key, 
  User, 
  LogOut, 
  Loader2, 
  Check, 
  Eye, 
  EyeOff,
  ExternalLink,
  AlertCircle,
  Globe,
  ChevronDown,
  CreditCard
} from 'lucide-react';

type UserPlan = 'none' | 'trial' | 'monthly' | 'yearly';
type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'expired';

const PLAN_LABELS: Record<UserPlan, string> = {
  none: 'No Plan',
  trial: '3-Day Trial',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  plan?: UserPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionEndsAt?: string;
  hasAccess?: boolean;
  region?: UserRegion;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState<UserRegion>('AU');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [regionSaveSuccess, setRegionSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [regionError, setRegionError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const user = session?.user as SessionUser | undefined;

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.oddsApiKey || '');
          setRegion(data.region || 'AU');
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const handleSaveApiKey = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRegion = async (newRegion: UserRegion) => {
    setRegion(newRegion);
    setIsSavingRegion(true);
    setRegionError('');
    setRegionSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: newRegion }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setRegionSaveSuccess(true);
      setTimeout(() => setRegionSaveSuccess(false), 3000);
    } catch (err) {
      setRegionError(err instanceof Error ? err.message : 'Failed to save region');
    } finally {
      setIsSavingRegion(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Get subscription display info
  const getSubscriptionInfo = () => {
    const plan = user?.plan || 'none';
    const status = user?.subscriptionStatus || 'inactive';
    const hasAccess = user?.hasAccess || false;
    const endsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;

    let label = PLAN_LABELS[plan];
    let statusColor = 'var(--muted)';
    let statusBg = 'var(--surface)';
    let description = '';

    if (hasAccess && endsAt) {
      statusColor = '#22c55e';
      statusBg = 'color-mix(in srgb, #22c55e 15%, transparent)';
      
      if (plan === 'trial') {
        const daysLeft = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        description = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
      } else {
        description = `Renews ${endsAt.toLocaleDateString()}`;
      }
    } else if (status === 'canceled' && endsAt && endsAt > new Date()) {
      statusColor = 'var(--warning)';
      statusBg = 'color-mix(in srgb, var(--warning) 15%, transparent)';
      label = `${PLAN_LABELS[plan]} (Canceled)`;
      description = `Access until ${endsAt.toLocaleDateString()}`;
    } else if (status === 'past_due') {
      statusColor = 'var(--danger)';
      statusBg = 'color-mix(in srgb, var(--danger) 15%, transparent)';
      label = `${PLAN_LABELS[plan]} (Past Due)`;
      description = 'Please update your payment method';
    } else {
      statusColor = 'var(--muted)';
      statusBg = 'var(--background)';
      label = 'No Active Plan';
      description = 'Subscribe to access all features';
    }

    return { label, statusColor, statusBg, description, hasAccess };
  };

  const subscriptionInfo = getSubscriptionInfo();

  if (status === 'loading' || isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Header - matches dashboard style */}
      <header 
        className="border-b sticky top-0 z-50 transition-colors"
        style={{ 
          borderColor: 'var(--border)',
          backgroundColor: 'var(--background)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
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

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
                style={{ color: 'var(--muted)' }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Dashboard Button */}
              <Link
                href="/dashboard"
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: '#14b8a6',
                  color: '#fff'
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 
          className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8"
          style={{ color: 'var(--foreground)' }}
        >
          Settings
        </h1>

        {/* Two-column grid on desktop, single column on mobile - equal height rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:auto-rows-fr">
          {/* Account Section */}
          <section 
            className="p-6 rounded-xl border flex flex-col"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <User className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </div>
              <div>
                <h2 className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Account
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Manage your account settings
                </p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-sm" style={{ color: 'var(--muted)' }}>
                  Email
                </label>
                <div 
                  className="mt-1 px-3 py-2.5 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                >
                  {session.user?.email}
                </div>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section 
            className="p-6 rounded-xl border flex flex-col"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <CreditCard className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </div>
              <div>
                <h2 className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Subscription
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Manage your subscription plan
                </p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-sm" style={{ color: 'var(--muted)' }}>
                  Current Plan
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span 
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ 
                      backgroundColor: subscriptionInfo.statusBg,
                      color: subscriptionInfo.statusColor
                    }}
                  >
                    {subscriptionInfo.label}
                  </span>
                  {subscriptionInfo.description && (
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>
                      {subscriptionInfo.description}
                    </span>
                  )}
                </div>
              </div>

              {/* No active plan - show View Plans */}
              {!subscriptionInfo.hasAccess && (
                <Link
                  href="/#pricing"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                  style={{
                    backgroundColor: '#14b8a6',
                    color: '#fff'
                  }}
                >
                  View Plans
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}

              {/* Trial user - show Upgrade option */}
              {subscriptionInfo.hasAccess && user?.plan === 'trial' && (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Enjoying your trial? Upgrade now to keep access.
                  </p>
                  <Link
                    href="/#pricing"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                    style={{
                      backgroundColor: '#14b8a6',
                      color: '#fff'
                    }}
                  >
                    Upgrade Plan
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Active monthly/yearly subscriber - show manage option */}
              {subscriptionInfo.hasAccess && (user?.plan === 'monthly' || user?.plan === 'yearly') && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  To manage your subscription or update payment details, contact support.
                </p>
              )}
            </div>
          </section>

          {/* Region Section */}
          <section 
            className="p-6 rounded-xl border flex flex-col"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <Globe className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </div>
              <div>
                <h2 className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Default Region
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Your home region for scanning
                </p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label 
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Region
                </label>
                <div className="relative">
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <Flag code={config.regionInfo[region].flagCode} size="sm" />
                  </div>
                  <select
                    value={region}
                    onChange={(e) => handleSaveRegion(e.target.value as UserRegion)}
                    disabled={isSavingRegion}
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                    style={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {config.regionOrder.map((r) => (
                      <option key={r} value={r}>
                        {config.regionInfo[r].label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                    {isSavingRegion && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted)' }} />}
                    {regionSaveSuccess && <Check className="w-4 h-4" style={{ color: '#22c55e' }} />}
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  </div>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Sets your default dashboard region.
                </p>
              </div>

              {regionError && (
                <div 
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--danger)' }}
                >
                  <AlertCircle className="w-4 h-4" />
                  {regionError}
                </div>
              )}
            </div>
          </section>

          {/* API Key Section */}
          <section 
            className="p-6 rounded-xl border flex flex-col"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <Key className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </div>
              <div>
                <h2 className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Odds API Key
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Your key for live odds data
                </p>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-4 flex-1">
              <div>
                <label 
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Odds API key"
                    className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg transition-colors font-mono"
                    style={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--muted)' }}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs mt-1.5 space-x-3" style={{ color: 'var(--muted)' }}>
                  <a 
                    href="https://the-odds-api.com/#get-access"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: '#22c55e' }}
                  >
                    Get a free API key →
                  </a>
                  <a 
                    href="https://tempmailo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: '#22c55e' }}
                  >
                    Get a temporary email →
                  </a>
                </p>
              </div>

              {error && (
                <div 
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--danger)' }}
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSaveApiKey}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: saveSuccess ? '#22c55e' : 'var(--foreground)',
                  color: 'var(--background)'
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  'Save API Key'
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Sign Out Section - Separate from grid */}
        <section 
          className="p-6 rounded-xl border mt-6"
          style={{ 
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <LogOut className="w-5 h-5" style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <h2 className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Sign Out
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Sign out of your account
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--background)]"
              style={{
                borderColor: 'var(--danger)',
                color: 'var(--danger)'
              }}
            >
              Sign Out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
