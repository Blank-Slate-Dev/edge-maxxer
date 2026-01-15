// src/components/SportsbookSlider.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getFeaturedBookmakers, getBookmakerAbbr, getLogoPath, type BookmakerConfig } from '@/lib/bookmakers';

interface SportsbookSliderProps {
  onViewAll: () => void;
  compact?: boolean;
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

export function SportsbookSlider({ onViewAll, compact = false }: SportsbookSliderProps) {
  const featuredBooks = getFeaturedBookmakers();
  
  // Double the items for seamless loop
  const items = [...featuredBooks, ...featuredBooks];

  return (
    <div className="w-full">
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

      {/* Marquee container */}
      <div 
        className="relative overflow-hidden py-2"
        style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
        }}
      >
        <div className="flex gap-3 animate-marquee hover:pause">
          {items.map((book, i) => (
            <SliderBookLogo 
              key={`${book.key}-${i}`} 
              bookmaker={book} 
              compact={compact} 
            />
          ))}
        </div>
      </div>

      {/* View all link */}
      <div className={compact ? 'mt-3' : 'mt-6 text-center'}>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:gap-3 group"
          style={{ color: '#14b8a6' }}
        >
          View all 80+ supported books
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}