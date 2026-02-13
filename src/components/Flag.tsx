// src/components/Flag.tsx
'use client';

import { useEffect } from 'react';

const FLAG_ICONS_CSS_ID = 'flag-icons-css';

function ensureFlagIconsCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FLAG_ICONS_CSS_ID)) return;

  // Load flag-icons CSS dynamically on first use
  const link = document.createElement('link');
  link.id = FLAG_ICONS_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/css/flag-icons.min.css';
  document.head.appendChild(link);
}

interface FlagProps {
  /** ISO 3166-1 alpha-2 country code (lowercase) e.g., 'us', 'gb', 'au', 'eu' */
  code: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Cross-platform flag component using flag-icons library
 * Works consistently on Windows, Mac, Linux, and all browsers
 * Self-loads flag-icons CSS on first render — no page-level loader needed
 */
export function Flag({ code, size = 'sm', className = '' }: FlagProps) {
  useEffect(() => {
    ensureFlagIconsCSS();
  }, []);

  const sizeClass = {
    sm: 'flag-size-sm',
    md: 'flag-size-md',
    lg: 'flag-size-lg',
  }[size];

  return (
    <span 
      className={`fi fi-${code.toLowerCase()} ${sizeClass} ${className}`}
      role="img"
      aria-label={`${code.toUpperCase()} flag`}
    />
  );
}