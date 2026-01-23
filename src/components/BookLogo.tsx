// src/components/BookLogo.tsx
'use client';

import { useState, useEffect } from 'react';
import { getBookmakerByKeyOrName, getBookmakerAbbr, getLogoPath } from '@/lib/bookmakers';

interface BookLogoProps {
  bookKey: string;
  size?: number;
  className?: string;
}

/**
 * BookLogo component - displays a bookmaker logo with fallback to abbreviation
 */
export function BookLogo({ bookKey, size = 24, className = '' }: BookLogoProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Use the function that handles both keys and display names
  const bookmaker = getBookmakerByKeyOrName(bookKey);
  const bgColor = bookmaker?.color || '#333';
  const textColor = bookmaker?.textColor || '#fff';
  const abbr = bookmaker ? getBookmakerAbbr(bookmaker.name) : bookKey.slice(0, 2).toUpperCase();
  // Use the actual key from the bookmaker config for the logo path
  const logoPath = bookmaker ? getLogoPath(bookmaker.key) : getLogoPath(bookKey);

  // Reset states when bookKey changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [bookKey]);

  const showFallback = !bookmaker || imgError || !imgLoaded;

  return (
    <div 
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {/* Always render image to give it a chance to load */}
      {bookmaker && !imgError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoPath}
          alt={bookmaker.name}
          width={size}
          height={size}
          className="rounded object-cover absolute inset-0"
          style={{ 
            width: size, 
            height: size,
            opacity: imgLoaded ? 1 : 0,
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          title={bookmaker.name}
        />
      )}
      
      {/* Fallback badge - shown while loading or on error */}
      {showFallback && (
        <div
          className="rounded flex items-center justify-center font-bold absolute inset-0"
          style={{
            width: size,
            height: size,
            backgroundColor: bgColor,
            color: textColor,
            fontSize: size * 0.35,
          }}
          title={bookmaker?.name || bookKey}
        >
          {abbr}
        </div>
      )}
    </div>
  );
}