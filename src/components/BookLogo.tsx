// src/components/BookLogo.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getBookmakerByKeyOrName, getBookmakerAbbr, getLogoPath } from '@/lib/bookmakers';

interface BookLogoProps {
  bookKey: string;
  size?: number;
  className?: string;
}

// Global cache to track which logos have successfully loaded
// This persists across component remounts and re-renders
const loadedLogosCache = new Set<string>();
const failedLogosCache = new Set<string>();

/**
 * BookLogo component - displays a bookmaker logo with fallback to abbreviation
 * Uses a global cache to prevent flickering on re-renders
 */
export function BookLogo({ bookKey, size = 24, className = '' }: BookLogoProps) {
  // Use the function that handles both keys and display names
  const bookmaker = getBookmakerByKeyOrName(bookKey);
  
  // Use the actual key from the bookmaker config for the logo path
  const actualKey = bookmaker?.key || bookKey;
  const logoPath = getLogoPath(actualKey);
  
  // Check global cache first to avoid flickering
  const wasAlreadyLoaded = loadedLogosCache.has(actualKey);
  const wasAlreadyFailed = failedLogosCache.has(actualKey);
  
  const [imgLoaded, setImgLoaded] = useState(wasAlreadyLoaded);
  const [imgError, setImgError] = useState(wasAlreadyFailed);
  
  // Track the previous key to detect actual changes
  const prevKeyRef = useRef<string>(actualKey);
  
  const bgColor = bookmaker?.color || '#333';
  const textColor = bookmaker?.textColor || '#fff';
  const abbr = bookmaker ? getBookmakerAbbr(bookmaker.name) : bookKey.slice(0, 2).toUpperCase();

  // Only reset states when bookKey ACTUALLY changes to a different value
  useEffect(() => {
    if (prevKeyRef.current !== actualKey) {
      prevKeyRef.current = actualKey;
      
      // Check cache for the new key
      if (loadedLogosCache.has(actualKey)) {
        setImgLoaded(true);
        setImgError(false);
      } else if (failedLogosCache.has(actualKey)) {
        setImgLoaded(false);
        setImgError(true);
      } else {
        // New key we haven't seen before
        setImgLoaded(false);
        setImgError(false);
      }
    }
  }, [actualKey]);

  const handleLoad = () => {
    loadedLogosCache.add(actualKey);
    failedLogosCache.delete(actualKey);
    setImgLoaded(true);
  };

  const handleError = () => {
    failedLogosCache.add(actualKey);
    loadedLogosCache.delete(actualKey);
    setImgError(true);
  };

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
          onLoad={handleLoad}
          onError={handleError}
          loading="eager"
          decoding="async"
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