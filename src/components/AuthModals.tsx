// src/components/AuthModals.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { X, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react';

type ModalType = 'login' | 'signup' | null;
type UserRegion = 'US' | 'EU' | 'UK' | 'AU';

const REGIONS: { value: UserRegion; label: string; flag: string }[] = [
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'EU', label: 'Europe', flag: '🇪🇺' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺' },
];

interface AuthModalsProps {
  isOpen: ModalType;
  onClose: () => void;
  onSwitch: (type: ModalType) => void;
  onAuthSuccess?: () => void;
}

export function AuthModals({ isOpen, onClose, onSwitch, onAuthSuccess }: AuthModalsProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Signup form
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    region: 'US' as UserRegion,
  });

  // Reset form when modal changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setApiError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    if (!loginData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) newErrors.email = 'Invalid email';
    if (!loginData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors: Record<string, string> = {};
    if (!signupData.name.trim()) newErrors.name = 'Name is required';
    if (!signupData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) newErrors.email = 'Invalid email';
    if (!signupData.password) newErrors.password = 'Password is required';
    else if (signupData.password.length < 8) newErrors.password = 'Min 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const result = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setApiError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (onAuthSuccess) {
        onAuthSuccess();
        onClose();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setApiError('Something went wrong');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      const signInResult = await signIn('credentials', {
        email: signupData.email,
        password: signupData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        onSwitch('login');
      } else {
        if (onAuthSuccess) {
          onAuthSuccess();
          onClose();
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setApiError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      setApiError('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-xl sm:rounded-2xl border animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-[var(--background)] z-10"
          style={{ color: 'var(--muted)' }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 pr-8">
            <h2 
              className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              {isOpen === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
              {isOpen === 'login' 
                ? 'Enter your credentials to continue' 
                : 'Get started with Edge Maxxer'}
            </p>
          </div>

          {/* Error message */}
          {apiError && (
            <div 
              className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm"
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
          <form onSubmit={isOpen === 'login' ? handleLogin : handleSignup} className="space-y-3 sm:space-y-4">
            {/* Name (signup only) */}
            {isOpen === 'signup' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  placeholder="John Smith"
                  disabled={isLoading}
                  className="w-full px-3 py-2 sm:py-2.5 text-sm rounded-lg disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: errors.name ? '1px solid var(--danger)' : '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                {errors.name && (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.name}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--foreground)' }}>
                Email
              </label>
              <input
                type="email"
                value={isOpen === 'login' ? loginData.email : signupData.email}
                onChange={(e) => isOpen === 'login' 
                  ? setLoginData({ ...loginData, email: e.target.value })
                  : setSignupData({ ...signupData, email: e.target.value })
                }
                placeholder="you@example.com"
                disabled={isLoading}
                className="w-full px-3 py-2 sm:py-2.5 text-sm rounded-lg disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--background)',
                  border: errors.email ? '1px solid var(--danger)' : '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              {errors.email && (
                <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={isOpen === 'login' ? loginData.password : signupData.password}
                  onChange={(e) => isOpen === 'login'
                    ? setLoginData({ ...loginData, password: e.target.value })
                    : setSignupData({ ...signupData, password: e.target.value })
                  }
                  placeholder={isOpen === 'signup' ? 'Min. 8 characters' : '••••••••'}
                  disabled={isLoading}
                  className="w-full px-3 py-2 sm:py-2.5 pr-10 text-sm rounded-lg disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: errors.password ? '1px solid var(--danger)' : '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password}</p>
              )}
            </div>

            {/* Region (signup only) */}
            {isOpen === 'signup' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Your region
                </label>
                <div className="relative">
                  <select
                    value={signupData.region}
                    onChange={(e) => setSignupData({ ...signupData, region: e.target.value as UserRegion })}
                    disabled={isLoading}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--background)',
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
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 sm:py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: '#14b8a6',
                color: '#ffffff'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{isOpen === 'login' ? 'Logging in...' : 'Creating...'}</span>
                </>
              ) : (
                isOpen === 'login' ? 'Log in' : 'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span 
                className="px-3 text-xs"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
              >
                or
              </span>
            </div>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2 sm:py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-[var(--background)] border disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
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
            <span>Continue with Google</span>
          </button>

          {/* Switch link */}
          <p className="text-xs sm:text-sm text-center mt-4 sm:mt-6" style={{ color: 'var(--muted)' }}>
            {isOpen === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => onSwitch(isOpen === 'login' ? 'signup' : 'login')}
              className="font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--foreground)' }}
            >
              {isOpen === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}