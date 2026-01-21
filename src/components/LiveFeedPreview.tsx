// src/components/LiveFeedPreview.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Pin,
  ExternalLink,
  TrendingUp,
  DollarSign,
  BarChart3,
  Link as LinkIcon,
} from 'lucide-react';
import { getBookmaker, getBookmakerAbbr, getLogoPath } from '@/lib/bookmakers';

interface ArbOpportunity {
  id: string;
  matchup: string;
  league: string;
  sport: 'NBA' | 'NFL' | 'NHL' | 'MLB' | 'EPL' | 'Tennis';
  betType: string;
  profit: number;
  profitAmount: number;
  tag?: string;
  status: 'pregame';
  gameTime?: string;
  outcomes: {
    label: string;
    book: string;
    bookKey: string;
    odds: number;
    line?: number;
    fairOdds?: number;
    ev?: number;
    stake?: number;
    altOdds?: { book: string; bookKey: string; odds: number }[];
  }[];
}

// Sample data matching Gambit Odds style - ordered by profit % (highest to lowest)
// All pre-game markets: h2h (moneyline), spreads, totals
const SAMPLE_ARBS: ArbOpportunity[] = [
  {
    id: '1',
    matchup: 'CELTICS @ KNICKS',
    league: 'NBA',
    sport: 'NBA',
    betType: 'TOTAL POINTS',
    profit: 25.8,
    profitAmount: 129,
    tag: 'Middle',
    status: 'pregame',
    gameTime: 'Today 7:30 PM',
    outcomes: [
      {
        label: 'Over 218.5',
        book: 'FanDuel',
        bookKey: 'fanduel',
        odds: 150,
        ev: 26.2,
        line: 218.5,
        stake: 268,
        altOdds: [{ book: 'DK', bookKey: 'draftkings', odds: -110 }],
      },
      {
        label: 'Under 222.5',
        book: 'Caesars',
        bookKey: 'williamhill_us',
        odds: 190,
        ev: 21.8,
        line: 222.5,
        stake: 232,
      },
    ],
  },
  {
    id: '2',
    matchup: 'SUNS @ LAKERS',
    league: 'NBA',
    sport: 'NBA',
    betType: 'SPREAD',
    profit: 22.5,
    profitAmount: 112,
    tag: 'Staying Power',
    status: 'pregame',
    gameTime: 'Today 10:00 PM',
    outcomes: [
      {
        label: 'Lakers -4.5',
        book: 'DraftKings',
        bookKey: 'draftkings',
        odds: 185,
        ev: 24.5,
        line: -4.5,
        stake: 215,
        altOdds: [
          { book: 'CZ', bookKey: 'williamhill_us', odds: 135 },
          { book: 'FD', bookKey: 'fanduel', odds: 140 },
        ],
      },
      {
        label: 'Suns +5.5',
        book: 'Caesars',
        bookKey: 'williamhill_us',
        odds: 115,
        ev: 18.2,
        line: 5.5,
        stake: 285,
        altOdds: [{ book: 'MGM', bookKey: 'betmgm', odds: -160 }],
      },
    ],
  },
  {
    id: '3',
    matchup: 'FLAMES @ OILERS',
    league: 'NHL',
    sport: 'NHL',
    betType: 'TOTAL GOALS',
    profit: 17.6,
    profitAmount: 88,
    tag: 'Staying Power',
    status: 'pregame',
    gameTime: 'Tomorrow 9:00 PM',
    outcomes: [
      {
        label: 'Over 5.5',
        book: 'BetMGM',
        bookKey: 'betmgm',
        odds: 160,
        ev: 16.1,
        line: 5.5,
        stake: 226,
        altOdds: [
          { book: 'FD', bookKey: 'fanduel', odds: 125 },
          { book: 'DK', bookKey: 'draftkings', odds: 130 },
        ],
      },
      {
        label: 'Under 6.5',
        book: 'Caesars',
        bookKey: 'williamhill_us',
        odds: 115,
        ev: 2.5,
        line: 6.5,
        stake: 274,
        altOdds: [{ book: 'PB', bookKey: 'pointsbetau', odds: -145 }],
      },
    ],
  },
  {
    id: '4',
    matchup: 'YANKEES @ RED SOX',
    league: 'MLB',
    sport: 'MLB',
    betType: 'MONEYLINE',
    profit: 13.7,
    profitAmount: 68,
    status: 'pregame',
    gameTime: 'Tomorrow 1:05 PM',
    outcomes: [
      {
        label: 'Yankees',
        book: 'BetOnline',
        bookKey: 'betonlineag',
        odds: 130,
        ev: 14.5,
        stake: 247,
        altOdds: [{ book: 'PIN', bookKey: 'pinnacle', odds: -105 }],
      },
      {
        label: 'Red Sox',
        book: 'FanDuel',
        bookKey: 'fanduel',
        odds: 125,
        ev: 11.2,
        stake: 253,
        altOdds: [{ book: 'DK', bookKey: 'draftkings', odds: -110 }],
      },
    ],
  },
  {
    id: '5',
    matchup: 'KNICKS @ NUGGETS',
    league: 'NBA',
    sport: 'NBA',
    betType: 'SPREAD',
    profit: 11.2,
    profitAmount: 56,
    status: 'pregame',
    gameTime: 'Sat 8:30 PM',
    outcomes: [
      {
        label: 'Nuggets -5.5',
        book: 'DraftKings',
        bookKey: 'draftkings',
        odds: 125,
        ev: 12.3,
        line: -4.5,
        stake: 247,
        altOdds: [
          { book: 'PIN', bookKey: 'pinnacle', odds: -105 },
          { book: 'FD', bookKey: 'fanduel', odds: 100 },
        ],
      },
      {
        label: 'Knicks +6.5',
        book: 'BetMGM',
        bookKey: 'betmgm',
        odds: 120,
        ev: 11.0,
        line: 6.5,
        stake: 253,
      },
    ],
  },
];

const SIDEBAR_ITEMS = [
  { icon: TrendingUp, label: 'H2H, Spreads & Totals' },
  { icon: DollarSign, label: 'Guaranteed Profit %' },
  { icon: BarChart3, label: 'Expected Value (+EV)' },
  { icon: LinkIcon, label: '1-Click Deep Links' },
];

const PREVIEW_WIDTH = 780;

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

// Small inline book badge for alt odds
function BookBadge({ bookKey, odds }: { bookKey: string; odds: number }) {
  const bookmaker = getBookmaker(bookKey);
  const abbr = bookmaker ? getBookmakerAbbr(bookmaker.name) : bookKey.slice(0, 2).toUpperCase();
  const bgColor = bookmaker?.color || '#333';
  const textColor = bookmaker?.textColor || '#fff';

  const formatOdds = (o: number) => (o > 0 ? `+${o}` : o.toString());

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded"
      style={{
        backgroundColor: '#2a2a28',
        color: '#aaa',
      }}
    >
      <span
        className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {abbr.slice(0, 1)}
      </span>
      {formatOdds(odds)}
    </span>
  );
}

export function LiveFeedPreview() {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Responsive scaling: only scale down on smaller viewports
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      
      // On large screens (1280px+), always use full size
      if (viewportWidth >= 1280) {
        setScale(1);
        return;
      }
      
      // On medium screens, scale based on available space
      let availableWidth: number;
      if (viewportWidth >= 1024 && containerRef.current) {
        availableWidth = containerRef.current.offsetWidth;
      } else {
        availableWidth = viewportWidth - 64;
      }
      
      const newScale = Math.min(1, availableWidth / PREVIEW_WIDTH);
      setScale(newScale);
    };

    updateScale();
    
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateScale);
    
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [mounted]);

  const phoneSrc = theme === 'light'
    ? '/mobilephone_light_version.png'
    : '/mobilephone_dark_version.png';

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  return (
    <div className="w-full">
      {/* Mobile Version */}
      <div className="md:hidden w-full">
        {mounted ? (
          <Image
            src={phoneSrc}
            alt="Edge Maxxer Mobile App Preview"
            width={1082}
            height={1944}
            className="mx-auto h-auto"
            style={{ width: '70%', maxWidth: '280px' }}
            priority
          />
        ) : (
          // Skeleton placeholder with same aspect ratio to prevent layout shift
          // Uses CSS variables so it automatically matches theme without flash
          <div 
            className="mx-auto rounded-[2rem] animate-pulse"
            style={{ 
              width: '70%', 
              maxWidth: '280px',
              aspectRatio: '1082 / 1944',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }} 
          >
            {/* Phone screen skeleton */}
            <div 
              className="mx-auto mt-[8%] rounded-lg"
              style={{
                width: '85%',
                height: '75%',
                backgroundColor: 'var(--surface-secondary)',
              }}
            />
          </div>
        )}
      </div>

      {/* Desktop Version - Shows only on medium screens and up */}
      <div ref={containerRef} className="hidden md:block w-full">
        <div
          className="relative w-fit"
          style={{ zoom: scale }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Container - fixed width, doesn't change */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#0d0d0c',
              border: '1px solid #2a2a28',
              width: '780px',
              boxShadow: '0 0 60px rgba(20, 184, 166, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Browser Chrome */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                backgroundColor: '#161614',
                borderBottom: '1px solid #2a2a28',
              }}
            >
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f56' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#27ca40' }} />
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1.5 rounded-md text-xs text-center"
                style={{ backgroundColor: '#0d0d0c', color: '#666' }}
              >
                edgemaxxer.com/dashboard
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-[10px] font-medium tracking-wider" style={{ color: '#888' }}>
                  ARB SCANNER
                </span>
              </div>
            </div>

            {/* Scrollable Feed - Manual scroll only */}
            <div
              className="overflow-y-auto overflow-x-hidden custom-scrollbar"
              style={{
                height: '535px',
              }}
            >
              <div className="p-3 space-y-3">
                {SAMPLE_ARBS.map((arb) => (
                  <div
                    key={arb.id}
                    className="rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: '#1a1a18',
                      border: '1px solid #2a2a28',
                    }}
                  >
                    {/* Header Row */}
                    <div
                      className="px-3 py-2.5 flex items-center justify-between"
                      style={{ borderBottom: '1px solid #2a2a28' }}
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={`/sports/${arb.sport}.png`}
                          alt={arb.sport}
                          width={16}
                          height={16}
                          className="w-4 h-4 object-contain"
                        />
                        <span className="text-[10px] font-medium" style={{ color: '#888' }}>
                          {arb.league}
                        </span>
                        <span className="font-semibold text-xs" style={{ color: '#14b8a6' }}>
                          {arb.matchup}
                        </span>
                        {arb.tag && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor:
                                arb.tag === 'Middle'
                                  ? 'rgba(168, 85, 247, 0.2)'
                                  : 'rgba(20, 184, 166, 0.15)',
                              color: arb.tag === 'Middle' ? '#a855f7' : '#14b8a6',
                              border: `1px solid ${
                                arb.tag === 'Middle'
                                  ? 'rgba(168, 85, 247, 0.3)'
                                  : 'rgba(20, 184, 166, 0.3)'
                              }`,
                            }}
                          >
                            {arb.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {arb.gameTime && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: 'rgba(20, 184, 166, 0.15)',
                              color: '#14b8a6',
                            }}
                          >
                            {arb.gameTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bet Type */}
                    <div
                      className="px-3 py-1.5 text-[10px] font-medium"
                      style={{ color: '#666', borderBottom: '1px solid #2a2a28' }}
                    >
                      {arb.betType}
                    </div>

                    {/* Profit Row */}
                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{ backgroundColor: '#141412' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold" style={{ color: '#22c55e' }}>
                          {arb.profit.toFixed(1)}%
                        </span>
                        <div>
                          <div className="text-[9px] uppercase tracking-wider" style={{ color: '#666' }}>
                            Guaranteed Profit
                          </div>
                          <div className="text-xs font-medium flex items-center gap-1" style={{ color: '#22c55e' }}>
                            <TrendingUp className="w-3 h-3" />
                            +${arb.profitAmount}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-[#2a2a28] transition-colors"
                          style={{ color: '#666' }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-[#2a2a28] transition-colors"
                          style={{ color: '#666' }}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Outcomes */}
                    {arb.outcomes.map((outcome, i) => (
                      <div
                        key={i}
                        className="px-4 py-3"
                        style={{
                          borderTop: '1px solid #2a2a28',
                          backgroundColor: '#141412',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {/* Left: Book Logo + Label */}
                          <div className="flex items-center gap-3 min-w-[160px]">
                            <BookLogo bookKey={outcome.bookKey} size={32} />
                            <span className="font-medium text-sm" style={{ color: '#fff' }}>
                              {outcome.label}
                            </span>
                          </div>

                          {/* Right: Stats row */}
                          <div className="flex items-center gap-3">
                            {/* EV Badge */}
                            <div className="w-[70px] text-right">
                              {outcome.ev && (
                                <span
                                  className="text-[10px] px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: 'rgba(20, 184, 166, 0.15)',
                                    color: '#14b8a6',
                                  }}
                                >
                                  {outcome.ev.toFixed(1)}% EV
                                </span>
                              )}
                            </div>

                            {/* Line */}
                            <div className="w-[50px] text-right">
                              {outcome.line !== undefined && (
                                <span className="text-sm font-mono font-medium" style={{ color: '#14b8a6' }}>
                                  {outcome.line > 0 ? '+' : ''}
                                  {outcome.line}
                                </span>
                              )}
                            </div>

                            {/* Odds */}
                            <div className="w-[55px] text-right">
                              <span className="text-sm font-mono font-bold" style={{ color: '#22c55e' }}>
                                {formatOdds(outcome.odds)}
                              </span>
                            </div>

                            {/* Stake */}
                            <div className="w-[50px] text-right">
                              <span className="text-xs font-mono" style={{ color: '#666' }}>
                                ${outcome.stake}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Alt Odds Row */}
                        {outcome.altOdds && outcome.altOdds.length > 0 && (
                          <div className="flex justify-end mt-2 gap-2">
                            {outcome.altOdds.slice(0, 3).map((alt, j) => (
                              <BookBadge key={j} bookKey={alt.bookKey} odds={alt.odds} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - extends outside the main container to the right, vertically centered */}
          <div
            className="absolute top-1/2 left-full -translate-y-1/2 transition-all duration-300 ease-out overflow-hidden"
            style={{
              width: isHovered ? '200px' : '0px',
              backgroundColor: '#0d0d0c',
              border: '1px solid #2a2a28',
              borderLeft: 'none',
              borderTopRightRadius: '12px',
              borderBottomRightRadius: '12px',
            }}
          >
            <div className="p-4 w-[200px]">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ color: '#14b8a6' }}>
                Key Features
              </h3>
              <div className="space-y-3">
                {SIDEBAR_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#1a1a18', border: '1px solid #2a2a28' }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: '#14b8a6' }} />
                    </div>
                    <span className="text-sm" style={{ color: '#fff' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
