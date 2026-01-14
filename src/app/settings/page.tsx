// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sun, 
  Moon, 
  ArrowLeft, 
  Key, 
  User, 
  LogOut, 
  Loader2, 
  Check, 
  Eye, 
  EyeOff,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch current API key
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.oddsApiKey || '');
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
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
      {/* Header */}
      <header 
        className="border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                {theme === 'dark' ? (
                  <Image
                    src="/logo_thin_dark_version.png"
                    alt="Edge Maxxer"
                    width={120}
                    height={29}
                    priority
                    className="h-6 w-auto"
                  />
                ) : (
                  <Image
                    src="/logo_thin_light_version.png"
                    alt="Edge Maxxer"
                    width={120}
                    height={29}
                    priority
                    className="h-6 w-auto"
                  />
                )}
              </Link>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
              style={{ color: 'var(--muted)' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm mb-8 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 
          className="text-2xl font-semibold mb-8"
          style={{ color: 'var(--foreground)' }}
        >
          Settings
        </h1>

        <div className="space-y-6">
          {/* Account Section */}
          <section 
            className="p-6 rounded-xl border"
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

            <div className="space-y-4">
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

              <div>
                <label className="text-sm" style={{ color: 'var(--muted)' }}>
                  Subscription
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <span 
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ 
                      backgroundColor: (session.user as { subscription?: string })?.subscription === 'active' 
                        ? 'color-mix(in srgb, #22c55e 15%, transparent)'
                        : 'color-mix(in srgb, var(--warning) 15%, transparent)',
                      color: (session.user as { subscription?: string })?.subscription === 'active'
                        ? '#22c55e'
                        : 'var(--warning)'
                    }}
                  >
                    {(session.user as { subscription?: string })?.subscription === 'active' ? 'Pro' : 'Trial'}
                  </span>
                  {(session.user as { subscription?: string })?.subscription !== 'active' && (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      7-day free trial
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* API Key Section */}
          <section 
            className="p-6 rounded-xl border"
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
                  Your personal API key for live odds data
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div 
              className="p-4 rounded-lg mb-6"
              style={{ 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)'
              }}
            >
              <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                We use a <strong style={{ color: 'var(--foreground)' }}>Bring Your Own Key (BYOK)</strong> model. 
                Get a free API key from The Odds API to scan live odds.
              </p>
              <a 
                href="https://the-odds-api.com/#get-access"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#22c55e' }}
              >
                Get your free API key
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* API Key Input */}
            <div className="space-y-4">
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

          {/* Sign Out Section */}
          <section 
            className="p-6 rounded-xl border"
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
        </div>
      </main>
    </div>
  );
}
