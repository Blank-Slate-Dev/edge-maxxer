// src/components/SportsbookSlider.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { 
  getBookmakersByDisplayRegion, 
  getBookmakerAbbr, 
  getLogoPath, 
  type BookmakerConfig,
  type DisplayRegion 
} from '@/lib/bookmakers';

interface SportsbookSliderProps {
  onViewAll: () => void;
  compact?: boolean;
  region?: DisplayRegion;
}

// BookLogo component with image fallback
function SliderBookLogo({ bookmaker, compact }: { bookmaker: BookmakerConfig; compact: boolean }) {
  const [imgError, setImgError] = useState(false);
  
  const fontSize = compact ? 9 : 10;
  const abbr = getBookmakerAbbr(bookmaker.name);

  if (imgError) {
    // Fallback to colored box with abbreviation
    return (
      <div 
        className="flex items-center justify-center shrink-0 rounded-lg"
        style={{ 
          width: compact ? 40 : 56,
          height: 40,
          backgroundColor: bookmaker.color,
        }}
      >
        <span 
          className="font-bold"
          style={{ 
            color: bookmaker.textColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {abbr}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={getLogoPath(bookmaker.key)}
      alt={bookmaker.name}
      width={compact ? 40 : 56}
      height={40}
      className="shrink-0 rounded-lg object-cover"
      style={{ width: compact ? 40 : 56, height: 40 }}
      onError={() => setImgError(true)}
    />
  );
}

export function SportsbookSlider({ onViewAll, compact = false, region = 'ALL' }: SportsbookSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  
  // Get bookmakers for user's region (defaults to ALL if region is undefined)
  const regionBookmakers = getBookmakersByDisplayRegion(region);
  
  // Measure actual track width after render
  useEffect(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
  }, [regionBookmakers.length, compact]);

  // Target speed: ~50px per second
  const animationDuration = trackWidth ? trackWidth / 50 : 15;

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Stats row - only show if not compact */}
      {!compact && (
        <div className="flex items-center justify-center gap-8 md:gap-16 mb-8">
          {[
            { value: '80+', label: 'SPORTSBOOKS' },
            { value: '<2s', label: 'LATENCY' },
            { value: '24/7', label: 'UPTIME' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div 
                className="text-2xl md:text-3xl font-bold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                {stat.value}
              </div>
              <div 
                className="text-xs tracking-wider"
                style={{ color: 'var(--muted)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slider container */}
      <div 
        className="relative overflow-hidden py-2 w-full pointer-events-none select-none"
        style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        {/* Inject keyframe animation with exact pixel value */}
        {trackWidth > 0 && (
          <style>{`
            @keyframes marquee-exact {
              from { transform: translate3d(0, 0, 0); }
              to { transform: translate3d(-${trackWidth}px, 0, 0); }
            }
          `}</style>
        )}
        
        {/* Marquee wrapper - contains two identical sets */}
        <div 
          className="flex"
          style={{ 
            animation: trackWidth > 0 
              ? `marquee-exact ${animationDuration}s linear infinite` 
              : 'none',
            willChange: 'transform',
          }}
        >
          <div ref={trackRef} className="flex gap-3 shrink-0 pr-3">
            {regionBookmakers.map((book, i) => (
              <SliderBookLogo 
                key={`a-${book.key}-${i}`} 
                bookmaker={book} 
                compact={compact} 
              />
            ))}
          </div>
          <div className="flex gap-3 shrink-0 pr-3" aria-hidden="true">
            {regionBookmakers.map((book, i) => (
              <SliderBookLogo 
                key={`b-${book.key}-${i}`} 
                bookmaker={book} 
                compact={compact} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* View all link */}
      <div className={compact ? 'mt-3' : 'mt-6 text-center'}>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:gap-3 group"
          style={{ color: '#14b8a6' }}
        >
          View all 86 supported books
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
