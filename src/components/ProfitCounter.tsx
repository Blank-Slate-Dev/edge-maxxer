// src/components/ProfitCounter.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface ProfitCounterProps {
  initialValue?: number;
  refreshInterval?: number;
}

export function ProfitCounter({ 
  initialValue = 0, 
  refreshInterval = 5000
}: ProfitCounterProps) {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [floatingAmount, setFloatingAmount] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef<number | null>(null);

  // Fetch latest stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/global-stats');
        if (res.ok) {
          const data = await res.json();
          const newValue = data.totalProfit;
          
          // Check if value increased
          if (previousValue.current !== null && newValue > previousValue.current) {
            const difference = newValue - previousValue.current;
            
            // Show floating amount
            setFloatingAmount(difference);
            setIsAnimating(true);

            // Animate counter
            const startValue = previousValue.current;
            const duration = 1500;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const value = startValue + (newValue - startValue) * easeOut;
              setDisplayValue(value);

              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };

            requestAnimationFrame(animate);

            // Hide floating amount after 4 seconds
            setTimeout(() => {
              setFloatingAmount(null);
              setIsAnimating(false);
            }, 4000);
          } else {
            setDisplayValue(newValue);
          }

          previousValue.current = newValue;
        }
      } catch (err) {
        console.error('Failed to fetch global stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Format the display value
  const formattedValue = displayValue !== null 
    ? displayValue.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })
    : '0.00';

  return (
    <div className="relative inline-flex flex-col items-center">
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