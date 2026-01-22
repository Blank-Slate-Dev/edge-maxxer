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
import { useGeoRegion } from '@/components/SportsbooksModal';
import { formatAmericanOddsForRegion } from '@/lib/oddsFormat';
import type { UserRegion } from '@/lib/config';

interface ArbOpportunity {
  id: string;
  matchup: string;
  league: string;
  sport: 'NBA' | 'NFL' | 'NHL' | 'MLB' | 'EPL' | 'Tennis' | 'AFL' | 'NRL' | 'LaLiga' | 'Bundesliga';
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
    odds: number; // Stored in American format
    line?: number;
    fairOdds?: number;
    ev?: number;
    stake?: number;
    altOdds?: { book: string; bookKey: string; odds: number }[];
  }[];
}

// =============================================================================
// REGION-SPECIFIC BOOKMAKER CONFIGURATION
// =============================================================================
// These mappings define which bookmakers to show for each region.
// Each region has primary bookmakers (used in main outcomes) and 
// secondary bookmakers (used in altOdds badges).

interface RegionBookmakers {
  primary: { name: string; key: string }[];
  secondary: { abbr: string; key: string }[];
}

const REGION_BOOKMAKERS: Record<UserRegion, RegionBookmakers> = {
  AU: {
    // Ordered by popularity/recognition for Australian users
    // Pairings in sample arbs: [0]+[1], [2]+[3], [4]+[5], [6]+[7], [8]+[0]
    primary: [
      { name: 'Sportsbet', key: 'sportsbet' },       // 0 - Most popular
      { name: 'TAB', key: 'tab' },                   // 1 - Very well known
      { name: 'Bet365', key: 'bet365_au' },          // 2 - Huge brand
      { name: 'Ladbrokes', key: 'ladbrokes_au' },    // 3 - Well known
      { name: 'PointsBet', key: 'pointsbetau' },     // 4 - Popular
      { name: 'PlayUp', key: 'playup' },             // 5 - Growing
      { name: 'Neds', key: 'neds' },                 // 6 - Popular
      { name: 'Unibet', key: 'unibet' },             // 7 - Known
      { name: 'Betfair', key: 'betfair_ex_au' },     // 8 - For sharps
    ],
    secondary: [
      { abbr: 'TAB', key: 'tab' },
      { abbr: 'SB', key: 'sportsbet' },
      { abbr: '365', key: 'bet365_au' },
      { abbr: 'LAD', key: 'ladbrokes_au' },
      { abbr: 'PB', key: 'pointsbetau' },
      { abbr: 'PU', key: 'playup' },
      { abbr: 'NEDS', key: 'neds' },
      { abbr: 'UNI', key: 'unibet' },
      { abbr: 'BF', key: 'betfair_ex_au' },
    ],
  },
  UK: {
    primary: [
      { name: 'Bet365', key: 'williamhill' }, // Using williamhill as placeholder since bet365_uk doesn't exist
      { name: 'William Hill', key: 'williamhill' },
      { name: 'Paddy Power', key: 'paddypower' },
      { name: 'Sky Bet', key: 'skybet' },
      { name: 'Ladbrokes', key: 'ladbrokes_uk' },
      { name: 'Betfair', key: 'betfair_ex_uk' },
    ],
    secondary: [
      { abbr: 'WH', key: 'williamhill' },
      { abbr: 'PP', key: 'paddypower' },
      { abbr: 'SKY', key: 'skybet' },
      { abbr: 'LAD', key: 'ladbrokes_uk' },
      { abbr: 'BF', key: 'betfair_ex_uk' },
      { abbr: '888', key: 'sport888' },
      { abbr: 'COR', key: 'coral' },
    ],
  },
  EU: {
    primary: [
      { name: 'Pinnacle', key: 'pinnacle' },
      { name: 'Unibet', key: 'unibet_fr' },
      { name: 'Betsson', key: 'betsson' },
      { name: '1xBet', key: 'onexbet' },
      { name: 'Betclic', key: 'betclic_fr' },
      { name: 'Winamax', key: 'winamax_fr' },
    ],
    secondary: [
      { abbr: 'PIN', key: 'pinnacle' },
      { abbr: 'UNI', key: 'unibet_fr' },
      { abbr: 'BET', key: 'betsson' },
      { abbr: '1X', key: 'onexbet' },
      { abbr: 'BC', key: 'betclic_fr' },
      { abbr: 'WIN', key: 'winamax_fr' },
      { abbr: 'MAR', key: 'marathonbet' },
    ],
  },
  US: {
    primary: [
      { name: 'FanDuel', key: 'fanduel' },
      { name: 'DraftKings', key: 'draftkings' },
      { name: 'Caesars', key: 'williamhill_us' },
      { name: 'BetMGM', key: 'betmgm' },
      { name: 'BetOnline', key: 'betonlineag' },
      { name: 'ESPN BET', key: 'espnbet' },
    ],
    secondary: [
      { abbr: 'DK', key: 'draftkings' },
      { abbr: 'FD', key: 'fanduel' },
      { abbr: 'CZ', key: 'williamhill_us' },
      { abbr: 'MGM', key: 'betmgm' },
      { abbr: 'PIN', key: 'pinnacle' },
      { abbr: 'PB', key: 'pointsbetau' },
      { abbr: 'ESPN', key: 'espnbet' },
    ],
  },
};

// =============================================================================
// SAMPLE ARB DATA GENERATOR
// =============================================================================
// Generates sample arbitrage opportunities with region-appropriate bookmakers.
// 
// TODO (Option B - Region-specific sports/leagues):
// When ready to implement fully localized previews, this function should also
// accept region and return different matchups:
//
// AU: AFL (Collingwood vs Carlton), NRL (Broncos vs Storm), A-League
// UK: EPL (Arsenal vs Chelsea), Championship, Scottish Premiership
// EU: La Liga (Real Madrid vs Barcelona), Bundesliga, Serie A
// US: NBA, NFL, MLB, NHL (current implementation)
//
// You would create separate SAMPLE_ARBS_AU, SAMPLE_ARBS_UK, etc. arrays
// or a function like getSampleArbsForRegion(region: UserRegion)

function getSampleArbs(region: UserRegion): ArbOpportunity[] {
  const books = REGION_BOOKMAKERS[region];
  
  // Helper to get primary bookmaker by index (with wrapping)
  const getPrimary = (index: number) => books.primary[index % books.primary.length];
  
  // Helper to get secondary bookmaker by index (with wrapping)
  const getSecondary = (index: number) => books.secondary[index % books.secondary.length];

  // =============================================================================
  // TODO (Option B): Replace these US-centric matchups with region-specific ones
  // 
  // Example structure for AU:
  // {
  //   id: '1',
  //   matchup: 'COLLINGWOOD @ CARLTON',
  //   league: 'AFL',
  //   sport: 'AFL',
  //   betType: 'HEAD TO HEAD',
  //   ...
  // }
  //
  // Example structure for UK:
  // {
  //   id: '1',
  //   matchup: 'ARSENAL @ CHELSEA',
  //   league: 'EPL',
  //   sport: 'EPL',
  //   betType: 'MATCH RESULT',
  //   ...
  // }
  // =============================================================================

  return [
    {
      // Arb 1: Sportsbet + TAB (the two biggest AU books)
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
          book: getPrimary(0).name,
          bookKey: getPrimary(0).key,
          odds: 150,
          ev: 26.2,
          line: 218.5,
          stake: 268,
          altOdds: [{ book: getSecondary(2).abbr, bookKey: getSecondary(2).key, odds: -110 }],
        },
        {
          label: 'Under 222.5',
          book: getPrimary(1).name,
          bookKey: getPrimary(1).key,
          odds: 190,
          ev: 21.8,
          line: 222.5,
          stake: 232,
        },
      ],
    },
    {
      // Arb 2: Bet365 + Ladbrokes (major international + local brand)
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
          book: getPrimary(2).name,
          bookKey: getPrimary(2).key,
          odds: 185,
          ev: 24.5,
          line: -4.5,
          stake: 215,
          altOdds: [
            { book: getSecondary(1).abbr, bookKey: getSecondary(1).key, odds: 135 },
            { book: getSecondary(0).abbr, bookKey: getSecondary(0).key, odds: 140 },
          ],
        },
        {
          label: 'Suns +5.5',
          book: getPrimary(3).name,
          bookKey: getPrimary(3).key,
          odds: 115,
          ev: 18.2,
          line: 5.5,
          stake: 285,
          altOdds: [{ book: getSecondary(4).abbr, bookKey: getSecondary(4).key, odds: -160 }],
        },
      ],
    },
    {
      // Arb 3: PointsBet + PlayUp (growing AU brands)
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
          book: getPrimary(4).name,
          bookKey: getPrimary(4).key,
          odds: 160,
          ev: 16.1,
          line: 5.5,
          stake: 226,
          altOdds: [
            { book: getSecondary(1).abbr, bookKey: getSecondary(1).key, odds: 125 },
            { book: getSecondary(3).abbr, bookKey: getSecondary(3).key, odds: 130 },
          ],
        },
        {
          label: 'Under 6.5',
          book: getPrimary(5).name,
          bookKey: getPrimary(5).key,
          odds: 115,
          ev: 2.5,
          line: 6.5,
          stake: 274,
          altOdds: [{ book: getSecondary(6).abbr, bookKey: getSecondary(6).key, odds: -145 }],
        },
      ],
    },
    {
      // Arb 4: Neds + Unibet (popular + international)
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
          book: getPrimary(6).name,
          bookKey: getPrimary(6).key,
          odds: 130,
          ev: 14.5,
          stake: 247,
          altOdds: [{ book: getSecondary(8).abbr, bookKey: getSecondary(8).key, odds: -105 }],
        },
        {
          label: 'Red Sox',
          book: getPrimary(7).name,
          bookKey: getPrimary(7).key,
          odds: 125,
          ev: 11.2,
          stake: 253,
          altOdds: [{ book: getSecondary(0).abbr, bookKey: getSecondary(0).key, odds: -110 }],
        },
      ],
    },
    {
      // Arb 5: Betfair + Sportsbet (exchange + biggest retail)
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
          book: getPrimary(8).name,
          bookKey: getPrimary(8).key,
          odds: 125,
          ev: 12.3,
          line: -4.5,
          stake: 247,
          altOdds: [
            { book: getSecondary(2).abbr, bookKey: getSecondary(2).key, odds: -105 },
            { book: getSecondary(3).abbr, bookKey: getSecondary(3).key, odds: 100 },
          ],
        },
        {
          label: 'Knicks +6.5',
          book: getPrimary(0).name,
          bookKey: getPrimary(0).key,
          odds: 120,
          ev: 11.0,
          line: 6.5,
          stake: 253,
        },
      ],
    },
  ];
}

// Shortened labels to fit within viewport
const SIDEBAR_ITEMS = [
  { icon: TrendingUp, label: 'All Markets' },
  { icon: DollarSign, label: 'Profit %' },
  { icon: BarChart3, label: '+EV Bets' },
  { icon: LinkIcon, label: 'Deep Links' },
];

const PREVIEW_WIDTH = 780;
const SIDEBAR_WIDTH = 160;

// BookLogo component with image fallback
function BookLogo({ bookKey, size = 28 }: { bookKey: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const bookmaker = getBookmaker(bookKey);

  const bgColor = bookmaker?.color || '#333';
  const textColor = bookmaker?.textColor || '#fff';
  const abbr = bookmaker ? getBookmakerAbbr(bookmaker.name) : bookKey.slice(0, 2).toUpperCase();

  if (imgError || !bookmaker) {
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

export function LiveFeedPreview() {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-detect region for non-logged-in visitors (now includes user preference check)
  const detectedRegion = useGeoRegion();
  
  // Track whether we've finished determining the region
  const [regionResolved, setRegionResolved] = useState(false);
  
  // Mark region as resolved once useGeoRegion returns a non-default value
  // or after a short delay to prevent infinite loading state
  useEffect(() => {
    // Give the hook time to fetch user settings or detect geo
    const timer = setTimeout(() => {
      setRegionResolved(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [detectedRegion]);
  
  // Resolve to a valid UserRegion (convert 'ALL' to 'AU' as default)
  const resolveUserRegion = (): UserRegion => {
    if (detectedRegion === 'ALL') {
      return 'AU';
    }
    return detectedRegion;
  };
  
  const userRegion = resolveUserRegion();
  
  // Get region-specific sample arbs
  const sampleArbs = getSampleArbs(userRegion);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      
      if (viewportWidth >= 1280) {
        setScale(1);
        return;
      }
      
      let availableWidth: number;
      if (viewportWidth >= 1024 && containerRef.current) {
        availableWidth = containerRef.current.offsetWidth;
      } else {
        availableWidth = viewportWidth - 64;
      }
      
      // Account for sidebar space when calculating scale
      const totalWidth = PREVIEW_WIDTH + SIDEBAR_WIDTH + 20;
      const newScale = Math.min(1, availableWidth / totalWidth);
      setScale(Math.max(0.5, newScale)); // Minimum scale of 0.5
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
    return formatAmericanOddsForRegion(odds, userRegion);
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

      {/* Desktop Version */}
      <div ref={containerRef} className="hidden md:block w-full">
        {/* Outer wrapper for scaling */}
        <div style={{ zoom: scale }}>
          {/* Inner wrapper with fixed total width to reserve sidebar space */}
          <div 
            className="relative"
            style={{ width: `${PREVIEW_WIDTH + SIDEBAR_WIDTH + 10}px` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Main Container */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--surface-deep)',
                border: '1px solid var(--border)',
                width: `${PREVIEW_WIDTH}px`,
                boxShadow: 'var(--preview-shadow)',
              }}
            >
              {/* Browser Chrome */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  backgroundColor: 'var(--surface-chrome)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f56' }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#27ca40' }} />
                </div>
                <div
                  className="flex-1 mx-4 px-3 py-1.5 rounded-md text-xs text-center"
                  style={{ backgroundColor: 'var(--surface-deep)', color: 'var(--muted-foreground)' }}
                >
                  edgemaxxer.com/dashboard
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
                  <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--muted)' }}>
                    ARB SCANNER
                  </span>
                </div>
              </div>

              {/* Scrollable Feed */}
              <div
                className="overflow-y-auto overflow-x-hidden custom-scrollbar"
                style={{ height: '535px' }}
              >
                <div className="p-3 space-y-3">
                  {sampleArbs.map((arb) => (
                    <div
                      key={arb.id}
                      className="rounded-lg overflow-hidden"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {/* Header Row */}
                      <div
                        className="px-3 py-2.5 flex items-center justify-between"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-2">
                          <Image
                            src={`/sports/${arb.sport}.png`}
                            alt={arb.sport}
                            width={16}
                            height={16}
                            className="w-4 h-4 object-contain"
                          />
                          <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                            {arb.league}
                          </span>
                          <span className="font-semibold text-xs" style={{ color: 'var(--primary)' }}>
                            {arb.matchup}
                          </span>
                          {arb.tag && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor:
                                  arb.tag === 'Middle'
                                    ? 'var(--purple-muted)'
                                    : 'var(--primary-alpha-15)',
                                color: arb.tag === 'Middle' ? 'var(--purple)' : 'var(--primary)',
                                border: `1px solid ${
                                  arb.tag === 'Middle'
                                    ? 'var(--purple-border)'
                                    : 'var(--primary-alpha-30)'
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
                                backgroundColor: 'var(--primary-alpha-15)',
                                color: 'var(--primary)',
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
                        style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}
                      >
                        {arb.betType}
                      </div>

                      {/* Profit Row */}
                      <div
                        className="px-3 py-2 flex items-center justify-between"
                        style={{ backgroundColor: 'var(--surface-inset)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                            {arb.profit.toFixed(1)}%
                          </span>
                          <div>
                            <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                              Guaranteed Profit
                            </div>
                            <div className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--success)' }}>
                              <TrendingUp className="w-3 h-3" />
                              +${arb.profitAmount}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--muted-foreground)' }}
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
                            borderTop: '1px solid var(--border)',
                            backgroundColor: 'var(--surface-inset)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            {/* Left: Book Logo + Label */}
                            <div className="flex items-center gap-3 min-w-[160px]">
                              <BookLogo bookKey={outcome.bookKey} size={32} />
                              <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                                {outcome.label}
                              </span>
                            </div>

                            {/* Right: Stats row - ORDER: Line | Odds | EV | Stake */}
                            <div className="flex items-center gap-3">
                              {/* 1. Line */}
                              <div className="w-[50px] text-right">
                                {outcome.line !== undefined && (
                                  <span className="text-sm font-mono font-medium" style={{ color: 'var(--primary)' }}>
                                    {outcome.line > 0 ? '+' : ''}
                                    {outcome.line}
                                  </span>
                                )}
                              </div>

                              {/* 2. Odds - show placeholder until region is resolved */}
                              <div className="w-[55px] text-right">
                                {regionResolved ? (
                                  <span className="text-sm font-mono font-bold" style={{ color: 'var(--success)' }}>
                                    {formatOdds(outcome.odds)}
                                  </span>
                                ) : (
                                  <span 
                                    className="inline-block w-10 h-4 rounded animate-pulse" 
                                    style={{ backgroundColor: 'var(--surface)' }} 
                                  />
                                )}
                              </div>

                              {/* 3. EV Badge */}
                              <div className="w-[70px] text-right">
                                {outcome.ev && (
                                  <span
                                    className="text-[10px] px-2 py-1 rounded"
                                    style={{
                                      backgroundColor: 'var(--primary-alpha-15)',
                                      color: 'var(--primary)',
                                    }}
                                  >
                                    {outcome.ev.toFixed(1)}% EV
                                  </span>
                                )}
                              </div>

                              {/* 4. Stake */}
                              <div className="w-[50px] text-right">
                                <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                                  ${outcome.stake}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - positioned at exact pixel location to the right of main container */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out overflow-hidden"
              style={{
                left: `${PREVIEW_WIDTH}px`,
                width: isHovered ? `${SIDEBAR_WIDTH}px` : '0px',
                backgroundColor: 'var(--surface-deep)',
                border: isHovered ? '1px solid var(--border)' : 'none',
                borderLeft: 'none',
                borderTopRightRadius: '12px',
                borderBottomRightRadius: '12px',
              }}
            >
              <div className="p-3" style={{ width: `${SIDEBAR_WIDTH}px` }}>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--primary)' }}>
                  Key Features
                </h3>
                <div className="space-y-2">
                  {SIDEBAR_ITEMS.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
                      >
                        <item.icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--foreground)' }}>
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
    </div>
  );
}
