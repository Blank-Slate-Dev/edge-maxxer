// src/components/SportsbooksModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { X, Zap } from 'lucide-react';
import { 
  getBookmakersByDisplayRegion, 
  getBookmakerAbbr, 
  getLogoPath,
  type DisplayRegion,
  type BookmakerConfig 
} from '@/lib/bookmakers';

const REGION_LABELS: Record<DisplayRegion, string> = {
  US: '🇺🇸 United States',
  UK: '🇬🇧 United Kingdom', 
  EU: '🇪🇺 Europe',
  AU: '🇦🇺 Australia',
  ALL: '🌍 All Regions',
};

const REGION_SHORT: Record<DisplayRegion, string> = {
  US: 'US',
  UK: 'UK',
  EU: 'EU',
  AU: 'AU',
  ALL: 'All',
};

interface SportsbooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedRegion?: DisplayRegion;
}

// BookLogo component with image fallback for modal
function ModalBookLogo({ bookmaker }: { bookmaker: BookmakerConfig }) {
  const [imgError, setImgError] = useState(false);
  
  const abbr = getBookmakerAbbr(bookmaker.name);

  if (imgError) {
    // Fallback to colored box with abbreviation
    return (
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
        style={{ 
          backgroundColor: bookmaker.color,
          color: bookmaker.textColor,
        }}
      >
        {abbr}
      </div>
    );
  }

  return (
    <Image
      src={getLogoPath(bookmaker.key)}
      alt={bookmaker.name}
      width={48}
      height={48}
      className="w-12 h-12 rounded-xl object-cover"
      onError={() => setImgError(true)}
    />
  );
}

export function SportsbooksModal({ isOpen, onClose, detectedRegion = 'US' }: SportsbooksModalProps) {
  const [activeRegion, setActiveRegion] = useState<DisplayRegion>(detectedRegion);

  // Reset to detected region when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveRegion(detectedRegion);
    }
  }, [isOpen, detectedRegion]);

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

  if (!isOpen) return null;

  const sportsbooks = getBookmakersByDisplayRegion(activeRegion);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl border animate-scale-in overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 
              className="text-xl font-semibold mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              Our Active Sportsbooks
            </h2>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#22c55e' }}>
              <Zap className="w-4 h-4" />
              <span>LIVE &amp; PREGAME BOOKS</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--background)]"
            style={{ color: 'var(--muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region Tabs */}
        <div 
          className="flex gap-2 p-4 border-b overflow-x-auto shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          {(['US', 'UK', 'EU', 'AU', 'ALL'] as DisplayRegion[]).map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeRegion === region ? 'var(--primary)' : 'var(--background)',
                color: activeRegion === region ? '#fff' : 'var(--muted)',
                border: activeRegion === region ? 'none' : '1px solid var(--border)',
              }}
            >
              {REGION_SHORT[region]}
              {region === detectedRegion && region !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">(You)</span>
              )}
            </button>
          ))}
        </div>

        {/* Sportsbooks Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {sportsbooks.map((book, i) => (
              <div
                key={`${book.key}-${i}`}
                className="relative group"
              >
                <ModalBookLogo bookmaker={book} />
                
                {/* Tooltip on hover */}
                <div 
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  style={{ 
                    backgroundColor: 'var(--foreground)',
                    color: 'var(--background)',
                  }}
                >
                  {book.name}
                  {book.isPaid && <span className="ml-1 text-yellow-400">(Pro)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t text-center shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Showing {sportsbooks.length} sportsbooks • Updated in real-time
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper: Detect region from timezone/IP (for guests)
async function detectGeoRegion(): Promise<DisplayRegion> {
  try {
    // First try timezone detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone.startsWith('Australia')) {
      return 'AU';
    }
    if (timezone.startsWith('Europe/London') || timezone === 'GB') {
      return 'UK';
    }
    if (timezone.startsWith('Europe')) {
      return 'EU';
    }
    if (timezone.startsWith('America')) {
      return 'US';
    }

    // Fallback: try IP geolocation (free service)
    const res = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000) 
    });
    if (res.ok) {
      const data = await res.json();
      const country = data.country_code;
      
      if (country === 'AU') return 'AU';
      if (country === 'GB') return 'UK';
      if (['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(country)) {
        return 'EU';
      }
      if (country === 'US') return 'US';
    }
  } catch (error) {
    // Silently fail
    console.log('Geo detection failed, defaulting to AU');
  }
  
  // Default to AU (primary market)
  return 'AU';
}

// Hook to get user's region (prioritizes saved preference, falls back to geo-detection)
export function useGeoRegion(): DisplayRegion {
  const { data: session, status } = useSession();
  const [region, setRegion] = useState<DisplayRegion>('AU');
  const [hasCheckedUser, setHasCheckedUser] = useState(false);

  useEffect(() => {
    const determineRegion = async () => {
      // If user is authenticated, try to fetch their saved region preference
      if (status === 'authenticated' && session?.user) {
        try {
          const res = await fetch('/api/settings');
          if (res.ok) {
            const data = await res.json();
            if (data.region && ['US', 'UK', 'EU', 'AU'].includes(data.region)) {
              setRegion(data.region as DisplayRegion);
              setHasCheckedUser(true);
              return;
            }
          }
        } catch (error) {
          console.log('Failed to fetch user region, falling back to geo-detection');
        }
      }

      // If not authenticated or fetch failed, use geo-detection
      if (status === 'unauthenticated' || (status === 'authenticated' && !hasCheckedUser)) {
        const detectedRegion = await detectGeoRegion();
        setRegion(detectedRegion);
        setHasCheckedUser(true);
      }
    };

    // Only run when session status is determined (not loading)
    if (status !== 'loading') {
      determineRegion();
    }
  }, [status, session, hasCheckedUser]);

  return region;
}
