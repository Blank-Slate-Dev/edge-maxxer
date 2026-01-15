// src/components/StepsSection.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Smartphone, Trophy, Zap } from 'lucide-react';
import Image from 'next/image';
import { getLogoPath, getBookmaker, getBookmakerAbbr } from '@/lib/bookmakers';

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

// Book logo component for the animation - matches SportsbooksModal implementation
function BookLogo({ bookKey, size = 40, highlighted = false }: { bookKey: string; size?: number; highlighted?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const bookmaker = getBookmaker(bookKey);

  // Get proper abbreviation and colors from config
  const abbr = bookmaker ? getBookmakerAbbr(bookmaker.name) : bookKey.slice(0, 2).toUpperCase();
  const bgColor = bookmaker?.color || 'var(--border)';
  const textColor = bookmaker?.textColor || 'var(--muted)';

  if (imgError || !bookmaker) {
    // Fallback to colored box with abbreviation
    return (
      <div 
        className="rounded-lg flex items-center justify-center font-bold text-xs"
        style={{ 
          width: size,
          height: size,
          backgroundColor: highlighted ? '#14b8a6' : bgColor,
          color: highlighted ? '#fff' : textColor,
          boxShadow: highlighted ? '0 0 20px rgba(20, 184, 166, 0.5)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        {abbr}
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ 
        width: size,
        height: size,
        boxShadow: highlighted ? '0 0 20px rgba(20, 184, 166, 0.5)' : 'none',
        border: highlighted ? '2px solid #14b8a6' : '2px solid transparent',
        transition: 'all 0.3s ease'
      }}
    >
      <Image
        src={getLogoPath(bookKey)}
        alt={bookmaker.name}
        width={size}
        height={size}
        className="w-full h-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// Animated scanning visualization - shows bookmakers on left and right with connecting lines
function ScanningAnimation() {
  const [activeConnection, setActiveConnection] = useState(0);

  const leftBooks = ['fanduel', 'draftkings', 'betmgm'];
  const rightBooks = ['williamhill_us', 'pointsbetau', 'betonlineag'];

  // Define connection paths: [leftIndex, rightIndex]
  const connections = [
    { from: 0, to: 0 }, // straight across top
    { from: 0, to: 2 }, // diagonal down
    { from: 2, to: 1 }, // diagonal up
    { from: 1, to: 1 }, // straight across middle
    { from: 2, to: 0 }, // diagonal up steep
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveConnection(prev => (prev + 1) % connections.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [connections.length]);

  const currentConnection = connections[activeConnection];
  
  // Calculate Y positions (top of container + offset for each book)
  const leftY = 76 + currentConnection.from * 52;
  const rightY = 76 + currentConnection.to * 52;

  return (
    <div className="absolute inset-0">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      {/* Search icon at top */}
      <div 
        className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ 
          backgroundColor: 'rgba(20, 184, 166, 0.15)',
          border: '1px solid rgba(20, 184, 166, 0.3)'
        }}
      >
        <Search className="w-4 h-4" style={{ color: '#14b8a6' }} />
        <span className="text-[10px] font-medium" style={{ color: '#14b8a6' }}>
          Scanning
        </span>
      </div>

      {/* Left bookmakers */}
      <div className="absolute left-6 top-14 flex flex-col gap-3">
        {leftBooks.map((book, i) => (
          <BookLogo 
            key={book} 
            bookKey={book} 
            size={40} 
            highlighted={currentConnection.from === i}
          />
        ))}
      </div>

      {/* Right bookmakers */}
      <div className="absolute right-6 top-14 flex flex-col gap-3">
        {rightBooks.map((book, i) => (
          <BookLogo 
            key={book} 
            bookKey={book} 
            size={40} 
            highlighted={currentConnection.to === i}
          />
        ))}
      </div>

      {/* Connection line SVG */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        {/* Line from active left to active right */}
        <line 
          x1="70" 
          y1={leftY} 
          x2="280" 
          y2={rightY}
          stroke="#14b8a6" 
          strokeWidth="2"
          strokeDasharray="8,4"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(20, 184, 166, 0.5))',
            transition: 'all 0.3s ease'
          }}
        />
        {/* Animated dot on the line */}
        <circle 
          r="5" 
          fill="#14b8a6"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(20, 184, 166, 0.8))'
          }}
        >
          <animateMotion
            dur="1.2s"
            repeatCount="indefinite"
            path={`M70,${leftY} L280,${rightY}`}
            key={activeConnection}
          />
        </circle>
      </svg>

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

// Bet placement visualization - tree structure showing the two bets
function BetPlacementAnimation() {
  const [showTree, setShowTree] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTree(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Place Bet button at top */}
      <div 
        className="px-6 py-2.5 rounded-lg font-medium text-sm"
        style={{ 
          backgroundColor: '#14b8a6',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(20, 184, 166, 0.4)'
        }}
      >
        PLACE BET
      </div>

      {/* Tree structure */}
      <div className={`transition-all duration-500 ${showTree ? 'opacity-100' : 'opacity-0'}`}>
        {/* Vertical line from button */}
        <div 
          className="w-0.5 h-4 mx-auto"
          style={{ backgroundColor: 'var(--border)' }}
        />

        {/* Total stake label */}
        <div 
          className="text-center py-1.5 px-3 rounded mb-1"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
            Total Stake:{' '}
          </span>
          <span className="text-[10px] font-bold" style={{ color: 'var(--foreground)' }}>
            $1,000
          </span>
        </div>

        {/* Vertical line to connector */}
        <div 
          className="w-0.5 h-3 mx-auto"
          style={{ backgroundColor: 'var(--border)' }}
        />

        {/* Horizontal connector - width matches the gap between book centers */}
        <div className="relative" style={{ width: '224px' }}>
          <div 
            className="h-0.5 mx-auto"
            style={{ 
              backgroundColor: 'var(--border)',
              width: '124px'
            }}
          />
          {/* Left vertical */}
          <div 
            className="absolute top-0 w-0.5 h-3"
            style={{ 
              backgroundColor: 'var(--border)',
              left: '50px'
            }}
          />
          {/* Right vertical */}
          <div 
            className="absolute top-0 w-0.5 h-3"
            style={{ 
              backgroundColor: 'var(--border)',
              right: '50px'
            }}
          />
        </div>

        {/* Book boxes */}
        <div className="flex gap-6 mt-3">
          {/* Book A */}
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              width: '100px'
            }}
          >
            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--muted)' }}>
              BOOK A
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: '#14b8a6' }}>
              $2.12
            </div>
            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
              Bet: $494.88
            </div>
            <div className="text-[10px] font-medium" style={{ color: '#22c55e' }}>
              Return: $1,050
            </div>
            <div className="text-[10px] font-bold" style={{ color: '#eab308' }}>
              Profit: $50
            </div>
          </div>

          {/* Book B */}
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              width: '100px'
            }}
          >
            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--muted)' }}>
              BOOK B
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: '#14b8a6' }}>
              $2.08
            </div>
            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
              Bet: $505.12
            </div>
            <div className="text-[10px] font-medium" style={{ color: '#22c55e' }}>
              Return: $1,050
            </div>
            <div className="text-[10px] font-bold" style={{ color: '#eab308' }}>
              Profit: $50
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profit chart visualization
function ProfitAnimation() {
  const [bars, setBars] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const targetBars = [0.35, 0.5, 0.7, 1];
    let frame = 0;
    
    const interval = setInterval(() => {
      frame++;
      if (frame <= 40) {
        const progress = frame / 40;
        setBars(targetBars.map(t => t * progress));
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Chart area */}
      <div className="flex items-end gap-3 h-36">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-10 rounded-t transition-all duration-300"
            style={{
              height: `${height * 100}%`,
              backgroundColor: i === 3 ? '#eab308' : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Dotted trend line */}
      <svg 
        className="absolute" 
        style={{ width: '140px', height: '100px', left: '50%', top: '25%', transform: 'translateX(-50%)' }}
      >
        <path
          d="M10,80 Q40,70 70,50 T130,15"
          fill="none"
          stroke="#eab308"
          strokeWidth="2"
          strokeDasharray="6,4"
          opacity="0.8"
        />
        {/* End circle with lock icon area */}
        <circle cx="130" cy="15" r="12" fill="var(--background)" stroke="#eab308" strokeWidth="2" />
        {/* Lock icon (simplified) */}
        <rect x="125" y="12" width="10" height="8" rx="1" fill="none" stroke="#eab308" strokeWidth="1.5" />
        <path d="M127,12 V9 a3,3 0 0 1 6,0 V12" fill="none" stroke="#eab308" strokeWidth="1.5" />
      </svg>

      {/* Trophy badge */}
      <div 
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ 
          backgroundColor: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.3)'
        }}
      >
        <Trophy className="w-4 h-4" style={{ color: '#eab308' }} />
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