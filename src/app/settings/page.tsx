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
  CreditCard,
  Bell,
  Phone,
  Zap,
  Clock,
  Send,
  Info,
  MapPin
} from 'lucide-react';

type UserPlan = 'none' | 'trial' | 'monthly' | 'yearly';
type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'expired';
type CreditTier = '20k' | '100k' | '5m' | '15m';

const PLAN_LABELS: Record<UserPlan, string> = {
  none: 'No Plan',
  trial: '3-Day Trial',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

interface CreditTierOption {
  value: string;
  label: string;
  scanInterval: string;
}

interface AutoScanSettings {
  enabled: boolean;
  minProfitPercent: number;
  highValueThreshold: number;
  enableHighValueReminders: boolean;
  regions: UserRegion[];
  creditTier: CreditTier;
  alertCooldownMinutes: number;
  lastScanAt?: string;
  creditsUsedThisMonth: number;
}

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
  
  // Basic settings
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

  // Auto-scan settings
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [autoScan, setAutoScan] = useState<AutoScanSettings>({
    enabled: false,
    minProfitPercent: 4.0,
    highValueThreshold: 10.0,
    enableHighValueReminders: true,
    regions: ['AU'],
    creditTier: '20k',
    alertCooldownMinutes: 5,
    creditsUsedThisMonth: 0,
  });
  const [creditTierOptions, setCreditTierOptions] = useState<CreditTierOption[]>([]);
  const [smsConfigured, setSmsConfigured] = useState(false);
  const [isSavingAutoScan, setIsSavingAutoScan] = useState(false);
  const [autoScanSaveSuccess, setAutoScanSaveSuccess] = useState(false);
  const [autoScanError, setAutoScanError] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSmsSent, setTestSmsSent] = useState(false);

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
          setPhoneNumber(data.phoneNumber || '');
          setPhoneVerified(data.phoneVerified || false);
          setSmsConfigured(data.smsConfigured || false);
          setCreditTierOptions(data.creditTierOptions || []);
          if (data.autoScan) {
            setAutoScan({
              enabled: data.autoScan.enabled || false,
              minProfitPercent: data.autoScan.minProfitPercent || 4.0,
              highValueThreshold: data.autoScan.highValueThreshold || 10.0,
              enableHighValueReminders: data.autoScan.enableHighValueReminders !== false,
              regions: data.autoScan.regions || ['AU'],
              creditTier: data.autoScan.creditTier || '20k',
              alertCooldownMinutes: data.autoScan.alertCooldownMinutes || 5,
              lastScanAt: data.autoScan.lastScanAt,
              creditsUsedThisMonth: data.autoScan.creditsUsedThisMonth || 0,
            });
          }
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

  const handleSaveAutoScan = async (updates: Partial<AutoScanSettings & { phoneNumber?: string }>, sendTest = false) => {
    setIsSavingAutoScan(true);
    setAutoScanError('');
    setAutoScanSaveSuccess(false);

    try {
      const body: Record<string, unknown> = {};
      
      if (updates.phoneNumber !== undefined) {
        body.phoneNumber = updates.phoneNumber;
      }
      
      // Only include autoScan if there are auto-scan specific updates
      const autoScanUpdates = { ...updates };
      delete autoScanUpdates.phoneNumber;
      if (Object.keys(autoScanUpdates).length > 0) {
        body.autoScan = autoScanUpdates;
      }
      
      if (sendTest) {
        body.sendTestMessage = true;
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      if (data.phoneNumber !== undefined) {
        setPhoneNumber(data.phoneNumber);
      }
      if (data.phoneVerified !== undefined) {
        setPhoneVerified(data.phoneVerified);
      }
      if (data.autoScan) {
        setAutoScan(prev => ({ ...prev, ...data.autoScan }));
      }
      if (data.testMessageSent) {
        setTestSmsSent(true);
        setTimeout(() => setTestSmsSent(false), 5000);
      }

      setAutoScanSaveSuccess(true);
      setTimeout(() => setAutoScanSaveSuccess(false), 3000);
    } catch (err) {
      setAutoScanError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSavingAutoScan(false);
      setIsSendingTest(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!phoneNumber) {
      setAutoScanError('Please enter a phone number first');
      return;
    }
    setIsSendingTest(true);
    await handleSaveAutoScan({ phoneNumber }, true);
  };

  const handleToggleAutoScan = async () => {
    const newEnabled = !autoScan.enabled;
    setAutoScan(prev => ({ ...prev, enabled: newEnabled }));
    await handleSaveAutoScan({ enabled: newEnabled });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Get subscription display info
  const getSubscriptionInfo = () => {
    const plan = user?.plan || 'none';
    const subStatus = user?.subscriptionStatus || 'inactive';
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
    } else if (subStatus === 'canceled' && endsAt && endsAt > new Date()) {
      statusColor = 'var(--warning)';
      statusBg = 'color-mix(in srgb, var(--warning) 15%, transparent)';
      label = `${PLAN_LABELS[plan]} (Canceled)`;
      description = `Access until ${endsAt.toLocaleDateString()}`;
    } else if (subStatus === 'past_due') {
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

  // Toggle region for auto-scan
  const toggleAutoScanRegion = (regionToToggle: UserRegion) => {
    const newRegions = autoScan.regions.includes(regionToToggle)
      ? autoScan.regions.filter(r => r !== regionToToggle)
      : [...autoScan.regions, regionToToggle];
    
    // Ensure at least one region is selected
    if (newRegions.length > 0) {
      setAutoScan(prev => ({ ...prev, regions: newRegions }));
    }
  };

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

        {/* Auto-Scan Alerts Section - Full Width */}
        <section 
          className="p-6 rounded-xl border mt-6"
          style={{ 
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)' }}
            >
              <Bell className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Auto-Scan Alerts
                </h2>
                <span 
                  className="px-2 py-0.5 text-xs font-medium rounded"
                  style={{ 
                    backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)',
                    color: '#f59e0b'
                  }}
                >
                  PRO
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Get SMS alerts when arbs matching your criteria are found
              </p>
            </div>
            
            {/* Enable Toggle */}
            <button
              onClick={handleToggleAutoScan}
              disabled={isSavingAutoScan || !smsConfigured || !apiKey}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                !smsConfigured || !apiKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={{
                backgroundColor: autoScan.enabled ? '#22c55e' : 'var(--border)'
              }}
            >
              <div 
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  autoScan.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Info Banner */}
          {!smsConfigured && (
            <div 
              className="flex items-start gap-3 p-4 rounded-lg mb-6"
              style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)' }}
            >
              <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>
                  SMS Service Not Configured
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Auto-scan alerts require SMS to be configured by the administrator. Contact support to enable this feature.
                </p>
              </div>
            </div>
          )}

          {!apiKey && smsConfigured && (
            <div 
              className="flex items-start gap-3 p-4 rounded-lg mb-6"
              style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)' }}
            >
              <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>
                  API Key Required
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Please add your Odds API key above to enable auto-scan alerts.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Phone Number */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+61 412 345 678"
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg"
                    style={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <button
                    onClick={handleSendTestSms}
                    disabled={isSendingTest || !phoneNumber || !smsConfigured}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: testSmsSent ? '#22c55e' : 'var(--background)',
                      border: '1px solid var(--border)',
                      color: testSmsSent ? '#fff' : 'var(--foreground)'
                    }}
                  >
                    {isSendingTest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : testSmsSent ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {testSmsSent ? 'Sent!' : 'Test'}
                  </button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Include country code (e.g., +61 for Australia)
                  {phoneVerified && (
                    <span className="ml-2" style={{ color: '#22c55e' }}>
                      ✓ Verified
                    </span>
                  )}
                </p>
              </div>

              {/* Minimum Profit */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Zap className="w-4 h-4" />
                  Minimum Alert Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="4"
                    max="500"
                    step="0.5"
                    value={autoScan.minProfitPercent}
                    onChange={(e) => setAutoScan(prev => ({ ...prev, minProfitPercent: Math.max(4, parseFloat(e.target.value) || 4) }))}
                    className="w-24 px-3 py-2 text-sm rounded-lg text-center font-medium"
                    style={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      color: '#22c55e',
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>%</span>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Only alert for arbs ≥ {autoScan.minProfitPercent}% profit (sent once per arb)
                </p>
              </div>

              {/* High Value Threshold */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Bell className="w-4 h-4" />
                  High-Value Reminder Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="5"
                    max="500"
                    step="0.5"
                    value={autoScan.highValueThreshold}
                    onChange={(e) => setAutoScan(prev => ({ ...prev, highValueThreshold: Math.max(5, parseFloat(e.target.value) || 10) }))}
                    className="w-24 px-3 py-2 text-sm rounded-lg text-center font-medium"
                    style={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      color: '#f59e0b',
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>%</span>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Arbs ≥ {autoScan.highValueThreshold}% get repeat reminders while active
                </p>
              </div>

              {/* Enable High Value Reminders Toggle */}
              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)' }}
                    >
                      <Bell className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        High-Value Reminders
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>
                        Send repeat alerts for {autoScan.highValueThreshold}%+ arbs
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoScan(prev => ({ ...prev, enableHighValueReminders: !prev.enableHighValueReminders }))}
                    className="relative w-12 h-6 rounded-full transition-colors"
                    style={{ 
                      backgroundColor: autoScan.enableHighValueReminders 
                        ? '#f59e0b' 
                        : 'var(--border)'
                    }}
                  >
                    <div 
                      className="absolute w-5 h-5 rounded-full top-0.5 transition-transform"
                      style={{ 
                        backgroundColor: 'white',
                        transform: autoScan.enableHighValueReminders ? 'translateX(26px)' : 'translateX(2px)'
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Alert Cooldown */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Clock className="w-4 h-4" />
                  Alert Cooldown
                </label>
                <select
                  value={autoScan.alertCooldownMinutes}
                  onChange={(e) => setAutoScan(prev => ({ ...prev, alertCooldownMinutes: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2.5 text-sm rounded-lg appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  <option value="1">1 minute</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Minimum time between any SMS alerts
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Credit Tier */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  <CreditCard className="w-4 h-4" />
                  API Credit Tier
                </label>
                <select
                  value={autoScan.creditTier}
                  onChange={(e) => setAutoScan(prev => ({ ...prev, creditTier: e.target.value as CreditTier }))}
                  className="w-full px-3 py-2.5 text-sm rounded-lg appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  {creditTierOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.scanInterval}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Match this to your{' '}
                  <a 
                    href="https://the-odds-api.com/#pricing-section"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: '#14b8a6' }}
                  >
                    The Odds API plan
                  </a>
                </p>
              </div>

              {/* Scan Regions */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  <MapPin className="w-4 h-4" />
                  Scan Regions
                </label>
                <div className="flex flex-wrap gap-2">
                  {config.regionOrder.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleAutoScanRegion(r)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        autoScan.regions.includes(r) 
                          ? 'ring-2 ring-offset-1 ring-teal-500' 
                          : ''
                      }`}
                      style={{
                        backgroundColor: autoScan.regions.includes(r) 
                          ? 'color-mix(in srgb, #14b8a6 15%, transparent)' 
                          : 'var(--background)',
                        border: '1px solid var(--border)',
                        color: autoScan.regions.includes(r) ? '#14b8a6' : 'var(--foreground)',
                      }}
                    >
                      <Flag code={config.regionInfo[r].flagCode} size="sm" />
                      {r}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Bookmakers from these regions will be scanned
                </p>
              </div>

              {/* Usage Stats */}
              {autoScan.enabled && (
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--background)' }}
                >
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                    This Month&apos;s Usage
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted)' }}>Credits Used</span>
                    <span style={{ color: 'var(--foreground)' }}>
                      {autoScan.creditsUsedThisMonth.toLocaleString()} / {
                        creditTierOptions.find(t => t.value === autoScan.creditTier)?.label.split(' ')[0] || '20K'
                      }
                    </span>
                  </div>
                  {autoScan.lastScanAt && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span style={{ color: 'var(--muted)' }}>Last Scan</span>
                      <span style={{ color: 'var(--foreground)' }}>
                        {new Date(autoScan.lastScanAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {autoScanError && (
            <div 
              className="flex items-center gap-2 text-sm mt-4"
              style={{ color: 'var(--danger)' }}
            >
              <AlertCircle className="w-4 h-4" />
              {autoScanError}
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => handleSaveAutoScan({
                minProfitPercent: autoScan.minProfitPercent,
                regions: autoScan.regions,
                creditTier: autoScan.creditTier,
                alertCooldownMinutes: autoScan.alertCooldownMinutes,
              })}
              disabled={isSavingAutoScan}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: autoScanSaveSuccess ? '#22c55e' : '#14b8a6',
                color: '#fff'
              }}
            >
              {isSavingAutoScan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : autoScanSaveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Alert Settings'
              )}
            </button>
            
            {autoScan.enabled && (
              <span className="text-sm" style={{ color: '#22c55e' }}>
                ✓ Auto-scan is active
              </span>
            )}
          </div>
        </section>

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
