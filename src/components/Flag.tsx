// src/components/Flag.tsx
'use client';

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
 */
export function Flag({ code, size = 'sm', className = '' }: FlagProps) {
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