// src/components/TestimonialsSection.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  handle: string;
  avatar: string;
  content: string;
  profit?: string;
  rating: number;
}

interface GlobalStats {
  totalProfit: number;
  totalUsers: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Jake M.',
    handle: '@jakebets',
    avatar: 'JM',
    content: "Finally an arb scanner that doesn't cost a fortune. Made back my first month's subscription in 2 hours. The UI is clean and the alerts are fast.",
    profit: '+$847',
    rating: 5
  },
  {
    name: 'Sarah T.',
    handle: '@saraht_sports',
    avatar: 'ST',
    content: "I've used OddsJam and RebelBetting before - Edge Maxxer is just as good at a fraction of the price. The stealth mode is a game changer for staying under the radar.",
    profit: '+$2,340',
    rating: 5
  },
  {
    name: 'Marcus L.',
    handle: '@marcuslimits',
    avatar: 'ML',
    content: "The multi-region support is perfect for me. I can scan AU books during the day and switch to US markets at night. Already up 3 units this month.",
    profit: '+$1,560',
    rating: 5
  },
  {
    name: 'David K.',
    handle: '@davidkarbs',
    avatar: 'DK',
    content: "Started with skepticism, now I'm a believer. The EV+ feature alone is worth the subscription. Finally found a tool that keeps up with line movements.",
    profit: '+$920',
    rating: 5
  },
  {
    name: 'Alex R.',
    handle: '@alexroi',
    avatar: 'AR',
    content: "Support team is incredible - they actually respond and help. The calculator saves so much time. Best $10 I spend each month.",
    profit: '+$1,200',
    rating: 5
  },
  {
    name: 'Chris B.',
    handle: '@chrisbets21',
    avatar: 'CB',
    content: "Switched from a $100/month scanner and haven't looked back. Edge Maxxer finds the same arbs. The BYOK model is genius.",
    profit: '+$3,100',
    rating: 5
  },
];

// Format large numbers with K, M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M+`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K+`;
  }
  return `$${num.toFixed(0)}`;
}

// Format user count
function formatUserCount(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K+`.replace('.0K', 'K');
  }
  return `${num}+`;
}

// Hook for animated count-up that smoothly transitions to new targets
function useAnimatedCount(target: number, duration: number = 1500, enabled: boolean = true): number {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === displayValue) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValueRef.current + (target - startValueRef.current) * easeOut;
      
      setDisplayValue(Math.floor(current));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, duration, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return displayValue;
}

function TestimonialCard({ testimonial, delay, className = '' }: { testimonial: Testimonial; delay: number; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div 
      ref={cardRef}
      className={`p-4 sm:p-6 rounded-xl border transition-all duration-500 flex flex-col ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
      style={{ 
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium"
            style={{ 
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            }}
          >
            {testimonial.avatar}
          </div>
          <div>
            <div className="font-medium text-xs sm:text-sm" style={{ color: 'var(--foreground)' }}>
              {testimonial.name}
            </div>
            <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted)' }}>
              {testimonial.handle}
            </div>
          </div>
        </div>
        <Quote className="w-4 h-4 sm:w-5 sm:h-5 hidden sm:block" style={{ color: 'var(--border)' }} />
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-2 sm:mb-3">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star 
            key={i} 
            className="w-3 h-3 sm:w-4 sm:h-4" 
            fill="#eab308" 
            style={{ color: '#eab308' }} 
          />
        ))}
      </div>

      {/* Content */}
      <p 
        className="text-xs sm:text-sm leading-relaxed flex-1"
        style={{ color: 'var(--foreground)' }}
      >
        &ldquo;{testimonial.content}&rdquo;
      </p>

      {/* Profit badge */}
      {testimonial.profit && (
        <div className="mt-4 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div 
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium"
            style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e'
            }}
          >
            <span className="hidden sm:inline">Reported profit:</span>
            <span className="sm:hidden">Profit:</span>
            <span className="font-mono">{testimonial.profit}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// PERFORMANCE FIX: Stats now fetch immediately on component mount so the
// header ("Trusted by 22+ Bettors") and stats row render without waiting
// for the stats box to scroll into view.
//
// Polling still only starts when the stats box is visible (30s interval).
// The IntersectionObserver on the stats box now just controls polling,
// not the initial data fetch.
// =========================================================================

export function TestimonialsSection() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isStatsBoxVisible, setIsStatsBoxVisible] = useState(false);
  const statsBoxRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/global-stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalProfit: data.totalProfit || 0,
          totalUsers: data.totalUsers || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch global stats:', err);
    }
  }, []);

  // Fetch stats immediately on mount so header text loads fast
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  // Start polling only when the stats box is visible in the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        setIsStatsBoxVisible(nowVisible);

        if (nowVisible) {
          // Refresh immediately when scrolled into view
          fetchStats();
          // Start polling
          if (!intervalRef.current) {
            intervalRef.current = setInterval(fetchStats, 30000);
          }
        } else {
          // Stop polling when scrolled away
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      },
      { threshold: 0.1 }
    );

    if (statsBoxRef.current) {
      observer.observe(statsBoxRef.current);
    }

    return () => {
      observer.disconnect();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats]);

  // Animated values — animate once stats are loaded
  const animatedUsers = useAnimatedCount(
    stats?.totalUsers || 0, 
    1500, 
    isStatsBoxVisible && stats !== null
  );
  
  const animatedProfit = useAnimatedCount(
    stats?.totalProfit || 0, 
    1500, 
    isStatsBoxVisible && stats !== null
  );

  // Dynamic header text — available immediately after first fetch
  const headerText = stats && stats.totalUsers > 0 
    ? `Trusted by ${formatUserCount(stats.totalUsers)} Bettors`
    : 'Trusted by Bettors Worldwide';

  return (
    <section 
      className="py-16 sm:py-24 px-4 sm:px-6 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            {headerText}
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
            See what our users are saying about Edge Maxxer
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 items-stretch">
          {TESTIMONIALS.map((testimonial, i) => (
            <TestimonialCard 
              key={i} 
              testimonial={testimonial} 
              delay={i * 100}
              className={i >= 4 ? 'hidden lg:flex' : ''}
            />
          ))}
        </div>

        {/* Social proof stats */}
        <div 
          ref={statsBoxRef}
          className="mt-12 sm:mt-20 p-4 sm:p-8 rounded-2xl border"
          style={{ 
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            {/* Active Users - animated */}
            <div>
              <div 
                className="text-xl sm:text-3xl font-bold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                {formatUserCount(animatedUsers)}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                Active Users
              </div>
            </div>

            {/* User Profits - animated */}
            <div>
              <div 
                className="text-xl sm:text-3xl font-bold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                {formatNumber(animatedProfit)}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                User Profits
              </div>
            </div>

            {/* Static stats */}
            <div>
              <div 
                className="text-xl sm:text-3xl font-bold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                4.8/5
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                Avg. Rating
              </div>
            </div>

            <div>
              <div 
                className="text-xl sm:text-3xl font-bold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                96%
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                Would Recommend
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
