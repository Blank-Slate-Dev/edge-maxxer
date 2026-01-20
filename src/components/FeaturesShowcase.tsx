// src/components/FeaturesShowcase.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BarChart3, Check, TrendingUp, Clock } from 'lucide-react';
import { getBookmaker, getBookmakerAbbr, getLogoPath } from '@/lib/bookmakers';

// Sample EV opportunities data
const EV_OPPORTUNITIES = [
  { team: 'Lakers ML', bookKey: 'fanduel', odds: '+145', fairOdds: '+115', roi: '12.4%' },
  { team: 'Chiefs -3.5', bookKey: 'draftkings', odds: '+105', fairOdds: '-130', roi: '8.2%' },
  { team: 'O 9.5 Runs', bookKey: 'betmgm', odds: '+110', fairOdds: '-105', roi: '4.1%' },
];

// BookLogo component with image fallback
function BookLogo({ bookKey, size = 28 }: { bookKey: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const bookmaker = getBookmaker(bookKey);

  const bgColor = bookmaker?.color || '#333';
  const textColor = bookmaker?.textColor || '#fff';
  const abbr = bookmaker ? getBookmakerAbbr(bookmaker.name) : bookKey.slice(0, 2).toUpperCase();

  if (imgError || !bookmaker) {
    // Fallback to colored box with abbreviation
    return (
      <div
        className="rounded flex items-center justify-center font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          color: textColor,
          fontSize: size * 0.35,
        }}
      >
        {abbr}
      </div>
    );
  }

  return (
    <Image
      src={getLogoPath(bookKey)}
      alt={bookmaker.name}
      width={size}
      height={size}
      className="rounded object-cover"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
}

function PositiveEVCard() {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`rounded-2xl border p-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ 
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Icon */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
      >
        <BarChart3 className="w-6 h-6" style={{ color: '#3b82f6' }} />
      </div>

      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <h3 
          className="text-2xl font-bold"
          style={{ color: 'var(--foreground)' }}
        >
          Positive EV
        </h3>
        <span 
          className="text-xs font-medium px-2 py-1 rounded"
          style={{ 
            backgroundColor: '#22c55e',
            color: '#000'
          }}
        >
          NEW
        </span>
      </div>

      {/* Description */}
      <p 
        className="text-sm mb-6 leading-relaxed"
        style={{ color: 'var(--muted)' }}
      >
        Beat the closing line. We compare sharp book consensus against soft lines to identify value bets with positive expected return.
      </p>

      {/* Features list */}
      <div className="space-y-3 mb-8">
        {['Real-time Devigging', 'Kelly Criterion Staking'].map((feature, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="w-4 h-4" style={{ color: '#22c55e' }} />
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* EV Table Preview */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ 
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Table header */}
        <div 
          className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-medium border-b"
          style={{ 
            borderColor: 'var(--border)',
            color: 'var(--muted)'
          }}
        >
          <div>OPPORTUNITY</div>
          <div className="text-center">EDGE</div>
          <div className="text-center">ROI</div>
          <div></div>
        </div>

        {/* Table rows */}
        {EV_OPPORTUNITIES.map((opp, i) => (
          <div 
            key={i}
            className="grid grid-cols-4 gap-2 px-4 py-3 items-center border-b last:border-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <BookLogo bookKey={opp.bookKey} size={28} />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {opp.team}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {opp.odds}
                </div>
              </div>
            </div>
            <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
              Fair: {opp.fairOdds}
            </div>
            <div 
              className="text-center font-mono font-medium"
              style={{ color: '#22c55e' }}
            >
              {opp.roi}
            </div>
            <div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackEdgeCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [profit, setProfit] = useState(0);
  const [chartPoints, setChartPoints] = useState<number[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Start counter animation
          let frame = 0;
          const targetProfit = 1240.50;
          const interval = setInterval(() => {
            frame++;
            if (frame <= 60) {
              setProfit((frame / 60) * targetProfit);
            } else {
              clearInterval(interval);
            }
          }, 20);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Generate chart line
  useEffect(() => {
    if (isVisible) {
      const points: number[] = [];
      for (let i = 0; i <= 20; i++) {
        // Upward trend with some variance
        const base = (i / 20) * 80;
        const variance = Math.sin(i * 0.5) * 10 + Math.random() * 5;
        points.push(100 - base - variance);
      }
      setChartPoints(points);
    }
  }, [isVisible]);

  const pathD = chartPoints.length > 0 
    ? `M 0,${chartPoints[0]} ${chartPoints.map((p, i) => `L ${i * 15},${p}`).join(' ')}`
    : '';

  return (
    <div 
      ref={cardRef}
      className={`rounded-2xl border p-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ 
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-6">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)' }}
        >
          <Clock className="w-6 h-6" style={{ color: '#14b8a6' }} />
        </div>
        <span 
          className="text-xs font-medium px-3 py-1 rounded"
          style={{ 
            backgroundColor: '#14b8a6',
            color: '#fff'
          }}
        >
          ANALYTICS
        </span>
      </div>

      {/* Title */}
      <h3 
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--foreground)' }}
      >
        Track Your Edge
      </h3>

      {/* Description */}
      <p 
        className="text-sm mb-8 leading-relaxed"
        style={{ color: 'var(--muted)' }}
      >
        Integrated P&L tracking. Visualize your growth and analyze performance by sportsbook.
      </p>

      {/* Profit Card */}
      <div 
        className="rounded-xl p-6"
        style={{ 
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium tracking-wider" style={{ color: 'var(--muted)' }}>
            TOTAL PROFIT
          </span>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)' }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: '#14b8a6' }} />
          </div>
        </div>

        {/* Profit amount */}
        <div 
          className="text-4xl font-bold font-mono mb-6"
          style={{ color: '#22c55e' }}
        >
          +${profit.toFixed(2)}
        </div>

        {/* Chart */}
        <div className="relative h-20 mb-4">
          <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            {pathD && (
              <path
                d={`${pathD} L 300,100 L 0,100 Z`}
                fill="url(#chartGradient)"
              />
            )}
            
            {/* Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2"
                className={isVisible ? 'animate-draw-line' : ''}
              />
            )}
          </svg>
        </div>

        {/* Stats row */}
        <div 
          className="flex items-center justify-between pt-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>ROI: </span>
            <span className="text-sm font-medium" style={{ color: '#22c55e' }}>12.5%</span>
          </div>
          <div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Vol: </span>
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>$10k</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesShowcase() {
  return (
    <section 
      className="py-24 px-6 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <PositiveEVCard />
          <TrackEdgeCard />
        </div>
      </div>
    </section>
  );
}