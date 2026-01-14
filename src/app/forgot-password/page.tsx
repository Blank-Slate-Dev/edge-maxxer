// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { Sun, Moon, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return;
    }
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center px-6 py-12"
      style={{ backgroundColor: 'var(--background)' }}
    >
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

        {/* Back link */}
        <Link 
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {!isSubmitted ? (
          <>
            {/* Title */}
            <div className="mb-8">
              <h1 
                className="text-2xl font-semibold mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Reset your password
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: error ? '1px solid var(--danger)' : '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                {error && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div 
            className="p-6 rounded-xl border text-center"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)' }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
            </div>
            
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Check your email
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              We sent a reset link to{' '}
              <span style={{ color: 'var(--foreground)' }}>{email}</span>
            </p>

            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Didn&apos;t receive it?{' '}
              <button 
                onClick={() => setIsSubmitted(false)}
                className="underline hover:opacity-70 transition-opacity"
                style={{ color: 'var(--foreground)' }}
              >
                Try again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
