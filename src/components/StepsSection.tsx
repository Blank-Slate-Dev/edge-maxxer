// src/components/StepsSection.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Smartphone, Trophy, Zap, ExternalLink } from 'lucide-react';

interface StepCardProps {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}

function StepCard({ step, icon: Icon, title, description, children, delay = 0 }: StepCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div 
      ref={cardRef}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {/* Animation Container */}
      <div 
        className="relative h-64 rounded-xl border overflow-hidden mb-6"
        style={{ 
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
      >
        {children}
      </div>

      {/* Text Content */}
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)' }}
        >
          <Icon className="w-5 h-5" style={{ color: '#14b8a6' }} />
        </div>
        <div>
          <h3 
            className="font-semibold text-lg mb-1"
            style={{ color: 'var(--foreground)' }}
          >
            {step}. {title}
          </h3>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// Animated scanning visualization
function ScanningAnimation() {
  const [scanPosition, setScanPosition] = useState(0);
  const [dots, setDots] = useState<{ x: number; y: number; active: boolean }[]>([]);

  useEffect(() => {
    // Generate grid dots
    const gridDots = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        gridDots.push({
          x: 30 + i * 50,
          y: 30 + j * 40,
          active: false
        });
      }
    }
    setDots(gridDots);

    // Animate scan line
    const scanInterval = setInterval(() => {
      setScanPosition(prev => (prev + 2) % 220);
    }, 30);

    // Randomly activate dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.map(dot => ({
        ...dot,
        active: Math.random() > 0.7
      })));
    }, 500);

    return () => {
      clearInterval(scanInterval);
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 grid-pattern">
      {/* Grid dots */}
      {dots.map((dot, i) => (
        <div
          key={i}
          className={`absolute w-3 h-3 rounded-full transition-all duration-300 ${dot.active ? 'scale-150' : 'scale-100'}`}
          style={{
            left: dot.x,
            top: dot.y,
            backgroundColor: dot.active ? '#14b8a6' : 'var(--border)',
            boxShadow: dot.active ? '0 0 20px rgba(20, 184, 166, 0.5)' : 'none'
          }}
        />
      ))}

      {/* Scanning line */}
      <div 
        className="absolute left-0 right-0 h-0.5"
        style={{
          top: scanPosition,
          background: 'linear-gradient(90deg, transparent, #14b8a6, transparent)',
          boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)'
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        <line 
          x1="80" y1="70" x2="180" y2="150" 
          stroke="#14b8a6" 
          strokeWidth="2" 
          strokeDasharray="5,5"
          opacity="0.5"
        />
        <line 
          x1="180" y1="150" x2="130" y2="110" 
          stroke="#14b8a6" 
          strokeWidth="2" 
          strokeDasharray="5,5"
          opacity="0.5"
        />
      </svg>

      {/* Center search icon */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
        style={{ 
          backgroundColor: 'rgba(20, 184, 166, 0.2)',
          border: '2px solid #14b8a6'
        }}
      >
        <Search className="w-8 h-8" style={{ color: '#14b8a6' }} />
      </div>

      {/* Label */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: 'var(--background)',
          color: 'var(--muted)',
          border: '1px solid var(--border)'
        }}
      >
        <Zap className="w-3 h-3" style={{ color: '#14b8a6' }} />
        Scanning 80+ Books
      </div>
    </div>
  );
}

// Bet placement visualization
function BetPlacementAnimation() {
  const [cursorY, setCursorY] = useState(100);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    // Animate cursor
    const interval = setInterval(() => {
      setCursorY(prev => {
        if (prev >= 120) {
          setClicked(true);
          setTimeout(() => setClicked(false), 200);
          return 80;
        }
        return prev + 0.5;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Direct Link badge */}
      <div 
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ 
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)'
        }}
      >
        <ExternalLink className="w-3 h-3" />
        Direct Link
      </div>

      {/* Place Bet button */}
      <button
        className={`px-8 py-3 rounded-lg font-medium text-sm transition-all ${clicked ? 'scale-95' : 'scale-100'}`}
        style={{ 
          backgroundColor: '#14b8a6',
          color: '#fff',
          boxShadow: clicked ? '0 0 30px rgba(20, 184, 166, 0.5)' : '0 4px 20px rgba(20, 184, 166, 0.3)'
        }}
      >
        PLACE BET
      </button>

      {/* Cursor */}
      <div 
        className="absolute pointer-events-none transition-transform"
        style={{ 
          left: '60%',
          top: cursorY,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M4 4L10.5 20L13 13L20 10.5L4 4Z" 
            fill="white" 
            stroke="black" 
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Bet slip preview */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 rounded-lg border overflow-hidden"
        style={{ 
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="h-8" style={{ backgroundColor: 'var(--surface)' }} />
        <div className="flex justify-center gap-3 py-3">
          <div 
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)'
            }}
          >
            BOOK A
          </div>
          <div 
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)'
            }}
          >
            BOOK B
          </div>
        </div>
      </div>
    </div>
  );
}

// Profit chart visualization
function ProfitAnimation() {
  const [bars, setBars] = useState([0, 0, 0, 0]);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    // Animate bars growing
    const targetBars = [0.4, 0.6, 0.75, 1];
    let frame = 0;
    
    const interval = setInterval(() => {
      frame++;
      if (frame <= 60) {
        const progress = frame / 60;
        setBars(targetBars.map(t => t * progress));
        setProfit(Math.round(progress * 1240.50 * 100) / 100);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Trophy icon */}
      <div 
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ 
          backgroundColor: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.3)'
        }}
      >
        <Trophy className="w-5 h-5" style={{ color: '#eab308' }} />
      </div>

      {/* Chart and stats */}
      <div className="flex items-end gap-8">
        {/* Bar chart */}
        <div className="flex items-end gap-3 h-32">
          {bars.map((height, i) => (
            <div
              key={i}
              className="w-8 rounded-t transition-all duration-300"
              style={{
                height: `${height * 100}%`,
                backgroundColor: i === 3 ? '#eab308' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Profit line */}
        <svg className="absolute w-32 h-24" style={{ left: '25%', top: '30%' }}>
          <path
            d="M0,80 Q30,70 50,50 T100,10"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <circle cx="100" cy="10" r="6" fill="#14b8a6" />
        </svg>
      </div>

      {/* Profit display */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg"
        style={{ 
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
          TOTAL PROFIT
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: '#22c55e' }}>
          +${profit.toFixed(2)}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span>ROI: 12.5%</span>
          <span>Vol: $10k</span>
        </div>
      </div>
    </div>
  );
}

export function StepsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            <span className="convex-underline">Profit</span> in 3 Steps
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            We automate the math. You place the bets.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            step={1}
            icon={Search}
            title="We Find the Opportunity"
            description="Our system scans 80+ sportsbooks in real-time to find profitable odds discrepancies."
            delay={0}
          >
            <ScanningAnimation />
          </StepCard>

          <StepCard
            step={2}
            icon={Smartphone}
            title="You Place the Bets"
            description="We show you the exact teams and books. Our tools help you open both betslips instantly to lock in the odds."
            delay={200}
          >
            <BetPlacementAnimation />
          </StepCard>

          <StepCard
            step={3}
            icon={Trophy}
            title="Lock-in Profit"
            description="Regardless of who wins the game, the mathematical difference in the odds becomes your locked-in profit."
            delay={400}
          >
            <ProfitAnimation />
          </StepCard>
        </div>
      </div>
    </section>
  );
}