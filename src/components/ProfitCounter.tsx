// src/components/ProfitCounter.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// =========================================================================
// PERFORMANCE FIX: Reduced default polling from 5s to 15s.
//
// This component was polling /api/global-stats every 5 seconds on the
// landing page. Combined with TestimonialsSection (also polling every 5s),
// every visitor was making 24 API requests per minute for cosmetic counters.
//
// Changes:
// - Default refreshInterval bumped from 5000ms to 15000ms
// - The caller (LandingPageClient) now also passes 15000ms explicitly
// - Uses IntersectionObserver to only poll when the counter is visible
// =========================================================================

interface ProfitCounterProps {
  initialValue?: number;
  refreshInterval?: number;
}

export function ProfitCounter({ 
  initialValue = 0, 
  refreshInterval = 15000
}: ProfitCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [floatingAmount, setFloatingAmount] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInitialAnimated, setHasInitialAnimated] = useState(false);
  const previousValue = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Smooth count-up animation helper
  const animateToValue = useCallback((from: number, to: number, duration: number, onComplete?: () => void) => {
    // Cancel any in-progress animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * easeOut;
      setDisplayValue(value);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(to);
        animationFrameRef.current = null;
        onComplete?.();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Only start polling when visible in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch latest stats — only when visible
  useEffect(() => {
    if (!isVisible) {
      // Clear interval when not visible
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/global-stats');
        if (res.ok) {
          const data = await res.json();
          const newValue = data.totalProfit;
          
          // First load: count up from 0 to the fetched value
          if (!hasInitialAnimated && previousValue.current === null) {
            previousValue.current = newValue;
            setHasInitialAnimated(true);
            
            if (newValue > 0) {
              // Longer animation for the initial dramatic count-up
              animateToValue(0, newValue, 2500);
            } else {
              setDisplayValue(newValue);
            }
            return;
          }
          
          // Subsequent updates: animate if value increased
          if (previousValue.current !== null && newValue > previousValue.current) {
            const difference = newValue - previousValue.current;
            
            // Show floating amount
            setFloatingAmount(difference);
            setIsAnimating(true);
            
            // Animate counter from old to new
            animateToValue(previousValue.current, newValue, 1500);
            
            // Hide floating amount after 4 seconds
            setTimeout(() => {
              setFloatingAmount(null);
              setIsAnimating(false);
            }, 4000);
          } else if (previousValue.current !== null && newValue !== previousValue.current) {
            // Value changed but didn't increase (e.g. correction) — just set it
            setDisplayValue(newValue);
          }
          
          previousValue.current = newValue;
        }
      } catch (err) {
        console.error('Failed to fetch global stats:', err);
      }
    };

    // Fetch immediately when becoming visible
    fetchStats();
    intervalRef.current = setInterval(fetchStats, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshInterval, isVisible, hasInitialAnimated, animateToValue]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Format the display value
  const formattedValue = displayValue.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });

  return (
    <div ref={containerRef} className="relative inline-flex flex-col items-center">
      {/* Floating profit indicator */}
      {floatingAmount !== null && (
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 animate-float-up pointer-events-none"
          style={{ color: '#22c55e' }}
        >
          <span className="text-lg font-semibold font-mono">
            +${floatingAmount.toFixed(2)}
          </span>
        </div>
      )}
      
      {/* Main counter */}
      <div 
        className={`text-xl font-semibold font-mono transition-transform duration-200 ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}
        style={{ color: '#22c55e' }}
      >
        ${formattedValue}
      </div>
    </div>
  );
}
