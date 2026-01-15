// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { Sun, Moon, Eye, EyeOff, Loader2, Check, ChevronDown } from 'lucide-react';

type UserRegion = 'US' | 'EU' | 'UK' | 'AU';

const REGIONS: { value: UserRegion; label: string; flag: string }[] = [
  { value: 'AU', label: 'Australia', flag: '🇦🇺' },
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'EU', label: 'Europe', flag: '🇪🇺' },
];

export default function SignupPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    region: 'AU' as UserRegion,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setApiError('');

    try {
      // 1. Create the account
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      // 2. Sign them in automatically
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Account created but auto-login failed - send to login page
        router.push('/login?registered=true');
      } else {
        // Success - go to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setApiError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setApiError('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Left: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/">
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)]"
              style={{ color: 'var(--muted)' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 
              className="text-2xl font-semibold mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Create your account
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Start your 7-day free trial. No credit card required.
            </p>
          </div>

          {/* API Error */}
          {apiError && (
            <div 
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: 'var(--danger-muted)',
                color: 'var(--danger)',
                border: '1px solid var(--danger)'
              }}
            >
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--foreground)' }}
              >
                Full name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                disabled={isLoading}
                className="w-full px-3 py-2.5 text-sm rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: errors.name ? '1px solid var(--danger)' : '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              {errors.name && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.name}</p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--foreground)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                disabled={isLoading}
                className="w-full px-3 py-2.5 text-sm rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: errors.email ? '1px solid var(--danger)' : '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              {errors.email && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.email}</p>
              )}
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--foreground)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: errors.password ? '1px solid var(--danger)' : '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.password}</p>
              )}
            </div>

            {/* Region Selector */}
            <div>
              <label 
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--foreground)' }}
              >
                Your region
              </label>
              <div className="relative">
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value as UserRegion })}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  {REGIONS.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.flag} {region.label}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--muted)' }}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                This sets your default bookmaker region. You can scan other regions anytime.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span 
                className="px-3 text-xs"
                style={{ 
                  backgroundColor: 'var(--background)',
                  color: 'var(--muted)'
                }}
              >
                or
              </span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-[var(--surface)] border disabled:opacity-50"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Terms */}
          <p className="text-xs text-center mt-6" style={{ color: 'var(--muted)' }}>
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline hover:opacity-70">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:opacity-70">Privacy Policy</Link>
          </p>

          {/* Login link */}
          <p className="text-sm text-center mt-8" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--foreground)' }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Side panel */}
      <div 
        className="hidden lg:flex flex-1 flex-col justify-center p-12 border-l"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="max-w-md">
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ color: 'var(--foreground)' }}
          >
            Start finding guaranteed profits today
          </h2>
          
          <div className="space-y-4 mb-8">
            {[
              '7-day free trial, no credit card',
              'Scan 50+ bookmakers in seconds',
              '10x cheaper than competitors',
              'Cancel anytime'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)' }}
                >
                  <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Testimonial or stat */}
          <div 
            className="p-5 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl font-semibold font-mono" style={{ color: '#22c55e' }}>
                23
              </div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                arbitrage opportunities live right now
              </div>
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              Scanning AU, UK, US, EU • Updated 5 seconds ago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
