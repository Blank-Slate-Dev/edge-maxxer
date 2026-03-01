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
import dynamic from 'next/dynamic';

// Lazy-load the phone overlay components (only used on mobile)
const PhoneOverlayPreview = dynamic(() => import('@/components/PhoneOverlayPreview'), { ssr: false });
const PhoneScreenFeedLazy = dynamic(
  () => import('@/components/PhoneScreenFeed').then(mod => ({ default: mod.PhoneScreenFeed })),
  { ssr: false }
);

// =============================================================================
// TYPES
// =============================================================================

// All supported sports across all regions
type Sport = 
  // US Sports
  | 'NBA' | 'NFL' | 'NHL' | 'MLB' | 'MLS'
  // AU Sports
  | 'AFL' | 'NRL' | 'Cricket' | 'ALeague'
  // UK Sports
  | 'EPL' | 'Championship' | 'RugbyUnion' | 'RugbyLeague'
  // EU Sports
  | 'LaLiga' | 'Bundesliga' | 'SerieA' | 'Ligue1' | 'UCL'
  // Shared
  | 'Tennis';

interface ArbOpportunity {
  id: string;
  matchup: string;
  league: string;
  sport: Sport;
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
  }[];
}

// =============================================================================
// SPORT ICON MAPPING
// =============================================================================
// Maps sport keys to their icon filenames in /public/sports/
// 
// Required icon files (place in /public/sports/):
// - NBA.png, NFL.png, NHL.png, MLB.png, MLS.png (US)
// - AFL.png, NRL.png, Cricket.png, ALeague.png (AU)
// - EPL.png, Championship.png, RugbyUnion.png, RugbyLeague.png (UK)
// - LaLiga.png, Bundesliga.png, SerieA.png, Ligue1.png, UCL.png (EU)
// - Tennis.png (Shared)

const SPORT_ICONS: Record<Sport, string> = {
  // US Sports
  NBA: 'NBA.png',
  NFL: 'NFL.png',
  NHL: 'NHL.png',
  MLB: 'MLB.png',
  MLS: 'MLS.png',
  // AU Sports
  AFL: 'AFL.png',
  NRL: 'NRL.png',
  Cricket: 'Cricket.png',
  ALeague: 'ALeague.png',
  // UK Sports
  EPL: 'EPL.png',
  Championship: 'Championship.png',
  RugbyUnion: 'RugbyUnion.png',
  RugbyLeague: 'RugbyLeague.png',
  // EU Sports
  LaLiga: 'LaLiga.png',
  Bundesliga: 'Bundesliga.png',
  SerieA: 'SerieA.png',
  Ligue1: 'Ligue1.png',
  UCL: 'UCL.png',
  // Shared
  Tennis: 'Tennis.png',
};

// =============================================================================
// REGION-SPECIFIC BOOKMAKER CONFIGURATION
// =============================================================================

interface RegionBookmakers {
  primary: { name: string; key: string }[];
}

const REGION_BOOKMAKERS: Record<UserRegion, RegionBookmakers> = {
  AU: {
    // Ordered by popularity/recognition for Australian users
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
  },
  UK: {
    primary: [
      { name: 'Bet365', key: 'williamhill' },        // 0 - Placeholder
      { name: 'William Hill', key: 'williamhill' }, // 1 - Classic UK book
      { name: 'Paddy Power', key: 'paddypower' },   // 2 - Very popular
      { name: 'Sky Bet', key: 'skybet' },           // 3 - Big brand
      { name: 'Ladbrokes', key: 'ladbrokes_uk' },   // 4 - Historic
      { name: 'Betfair', key: 'betfair_ex_uk' },    // 5 - Exchange
      { name: 'Coral', key: 'coral' },              // 6 - High street
      { name: 'Betway', key: 'betway' },            // 7 - Modern
      { name: '888sport', key: 'sport888' },        // 8 - Online
    ],
  },
  EU: {
    primary: [
      { name: 'Pinnacle', key: 'pinnacle' },        // 0 - Sharp book
      { name: 'Unibet', key: 'unibet_fr' },         // 1 - Pan-European
      { name: 'Betsson', key: 'betsson' },          // 2 - Scandinavian
      { name: '1xBet', key: 'onexbet' },            // 3 - Eastern Europe
      { name: 'Betclic', key: 'betclic_fr' },       // 4 - France
      { name: 'Winamax', key: 'winamax_fr' },       // 5 - France
      { name: 'Tipico', key: 'tipico_de' },         // 6 - Germany
      { name: 'Marathonbet', key: 'marathonbet' }, // 7 - International
      { name: 'NordicBet', key: 'nordicbet' },      // 8 - Scandinavia
    ],
  },
  US: {
    primary: [
      { name: 'FanDuel', key: 'fanduel' },          // 0 - Market leader
      { name: 'DraftKings', key: 'draftkings' },    // 1 - Close second
      { name: 'Caesars', key: 'williamhill_us' },   // 2 - Big brand
      { name: 'BetMGM', key: 'betmgm' },            // 3 - Major player
      { name: 'BetOnline', key: 'betonlineag' },    // 4 - Offshore
      { name: 'ESPN BET', key: 'espnbet' },         // 5 - New major
      { name: 'BetRivers', key: 'betrivers' },      // 6 - Regional
      { name: 'PointsBet', key: 'pointsbetau' },    // 7 - Unique odds
      { name: 'Hard Rock', key: 'hardrockbet' },    // 8 - Growing
    ],
  },
};

// =============================================================================
// REGION-SPECIFIC SAMPLE ARBS
// =============================================================================

function getAustralianArbs(): ArbOpportunity[] {
  const books = REGION_BOOKMAKERS.AU.primary;
  return [
    {
      id: '1',
      matchup: 'COLLINGWOOD @ CARLTON',
      league: 'AFL',
      sport: 'AFL',
      betType: 'HEAD TO HEAD',
      profit: 25.8,
      profitAmount: 129,
      tag: 'Middle',
      status: 'pregame',
      gameTime: 'Fri 7:50 PM',
      outcomes: [
        { label: 'Collingwood', book: books[0].name, bookKey: books[0].key, odds: 150, ev: 26.2, stake: 268 },
        { label: 'Carlton', book: books[1].name, bookKey: books[1].key, odds: 190, ev: 21.8, stake: 232 },
      ],
    },
    {
      id: '2',
      matchup: 'BRONCOS @ STORM',
      league: 'NRL',
      sport: 'NRL',
      betType: 'LINE BETTING',
      profit: 22.5,
      profitAmount: 112,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Sat 7:35 PM',
      outcomes: [
        { label: 'Broncos +4.5', book: books[2].name, bookKey: books[2].key, odds: 185, ev: 24.5, line: 4.5, stake: 215 },
        { label: 'Storm -3.5', book: books[3].name, bookKey: books[3].key, odds: 115, ev: 18.2, line: -3.5, stake: 285 },
      ],
    },
    {
      id: '3',
      matchup: 'AUSTRALIA @ ENGLAND',
      league: 'The Ashes',
      sport: 'Cricket',
      betType: 'MATCH WINNER',
      profit: 17.6,
      profitAmount: 88,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Thu 10:30 AM',
      outcomes: [
        { label: 'Australia', book: books[4].name, bookKey: books[4].key, odds: 160, ev: 16.1, stake: 226 },
        { label: 'England', book: books[5].name, bookKey: books[5].key, odds: 115, ev: 2.5, stake: 274 },
      ],
    },
    {
      id: '4',
      matchup: 'SYDNEY FC @ MELBOURNE VICTORY',
      league: 'A-League',
      sport: 'ALeague',
      betType: 'HEAD TO HEAD',
      profit: 13.7,
      profitAmount: 68,
      status: 'pregame',
      gameTime: 'Sun 5:00 PM',
      outcomes: [
        { label: 'Sydney FC', book: books[6].name, bookKey: books[6].key, odds: 130, ev: 14.5, stake: 247 },
        { label: 'Melbourne Victory', book: books[7].name, bookKey: books[7].key, odds: 125, ev: 11.2, stake: 253 },
      ],
    },
    {
      id: '5',
      matchup: 'RICHMOND @ GEELONG',
      league: 'AFL',
      sport: 'AFL',
      betType: 'TOTAL POINTS',
      profit: 11.2,
      profitAmount: 56,
      status: 'pregame',
      gameTime: 'Sat 4:35 PM',
      outcomes: [
        { label: 'Over 165.5', book: books[8].name, bookKey: books[8].key, odds: 125, ev: 12.3, line: 165.5, stake: 247 },
        { label: 'Under 168.5', book: books[0].name, bookKey: books[0].key, odds: 120, ev: 11.0, line: 168.5, stake: 253 },
      ],
    },
  ];
}

function getUKArbs(): ArbOpportunity[] {
  const books = REGION_BOOKMAKERS.UK.primary;
  return [
    {
      id: '1',
      matchup: 'ARSENAL @ CHELSEA',
      league: 'Premier League',
      sport: 'EPL',
      betType: 'MATCH RESULT',
      profit: 25.8,
      profitAmount: 129,
      tag: 'Middle',
      status: 'pregame',
      gameTime: 'Sat 3:00 PM',
      outcomes: [
        { label: 'Arsenal', book: books[0].name, bookKey: books[0].key, odds: 150, ev: 26.2, stake: 268 },
        { label: 'Chelsea', book: books[1].name, bookKey: books[1].key, odds: 190, ev: 21.8, stake: 232 },
      ],
    },
    {
      id: '2',
      matchup: 'LIVERPOOL @ MAN UNITED',
      league: 'Premier League',
      sport: 'EPL',
      betType: 'ASIAN HANDICAP',
      profit: 22.5,
      profitAmount: 112,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Sun 4:30 PM',
      outcomes: [
        { label: 'Liverpool -1.5', book: books[2].name, bookKey: books[2].key, odds: 185, ev: 24.5, line: -1.5, stake: 215 },
        { label: 'Man United +2.5', book: books[3].name, bookKey: books[3].key, odds: 115, ev: 18.2, line: 2.5, stake: 285 },
      ],
    },
    {
      id: '3',
      matchup: 'LEEDS @ SHEFFIELD UTD',
      league: 'Championship',
      sport: 'Championship',
      betType: 'MATCH RESULT',
      profit: 17.6,
      profitAmount: 88,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Sat 12:30 PM',
      outcomes: [
        { label: 'Leeds', book: books[4].name, bookKey: books[4].key, odds: 160, ev: 16.1, stake: 226 },
        { label: 'Sheffield Utd', book: books[5].name, bookKey: books[5].key, odds: 115, ev: 2.5, stake: 274 },
      ],
    },
    {
      id: '4',
      matchup: 'ENGLAND @ IRELAND',
      league: 'Six Nations',
      sport: 'RugbyUnion',
      betType: 'MATCH WINNER',
      profit: 13.7,
      profitAmount: 68,
      status: 'pregame',
      gameTime: 'Sat 4:45 PM',
      outcomes: [
        { label: 'England', book: books[6].name, bookKey: books[6].key, odds: 130, ev: 14.5, stake: 247 },
        { label: 'Ireland', book: books[7].name, bookKey: books[7].key, odds: 125, ev: 11.2, stake: 253 },
      ],
    },
    {
      id: '5',
      matchup: 'MAN CITY @ TOTTENHAM',
      league: 'Premier League',
      sport: 'EPL',
      betType: 'TOTAL GOALS',
      profit: 11.2,
      profitAmount: 56,
      status: 'pregame',
      gameTime: 'Sun 2:00 PM',
      outcomes: [
        { label: 'Over 2.5', book: books[8].name, bookKey: books[8].key, odds: 125, ev: 12.3, line: 2.5, stake: 247 },
        { label: 'Under 3.5', book: books[0].name, bookKey: books[0].key, odds: 120, ev: 11.0, line: 3.5, stake: 253 },
      ],
    },
  ];
}

function getEUArbs(): ArbOpportunity[] {
  const books = REGION_BOOKMAKERS.EU.primary;
  return [
    {
      id: '1',
      matchup: 'REAL MADRID @ BARCELONA',
      league: 'La Liga',
      sport: 'LaLiga',
      betType: 'MATCH RESULT',
      profit: 25.8,
      profitAmount: 129,
      tag: 'Middle',
      status: 'pregame',
      gameTime: 'Sat 9:00 PM',
      outcomes: [
        { label: 'Real Madrid', book: books[0].name, bookKey: books[0].key, odds: 150, ev: 26.2, stake: 268 },
        { label: 'Barcelona', book: books[1].name, bookKey: books[1].key, odds: 190, ev: 21.8, stake: 232 },
      ],
    },
    {
      id: '2',
      matchup: 'BAYERN @ DORTMUND',
      league: 'Bundesliga',
      sport: 'Bundesliga',
      betType: 'ASIAN HANDICAP',
      profit: 22.5,
      profitAmount: 112,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Sat 6:30 PM',
      outcomes: [
        { label: 'Bayern -1.5', book: books[2].name, bookKey: books[2].key, odds: 185, ev: 24.5, line: -1.5, stake: 215 },
        { label: 'Dortmund +2.5', book: books[3].name, bookKey: books[3].key, odds: 115, ev: 18.2, line: 2.5, stake: 285 },
      ],
    },
    {
      id: '3',
      matchup: 'JUVENTUS @ AC MILAN',
      league: 'Serie A',
      sport: 'SerieA',
      betType: 'MATCH RESULT',
      profit: 17.6,
      profitAmount: 88,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Sun 8:45 PM',
      outcomes: [
        { label: 'Juventus', book: books[4].name, bookKey: books[4].key, odds: 160, ev: 16.1, stake: 226 },
        { label: 'AC Milan', book: books[5].name, bookKey: books[5].key, odds: 115, ev: 2.5, stake: 274 },
      ],
    },
    {
      id: '4',
      matchup: 'PSG @ MARSEILLE',
      league: 'Ligue 1',
      sport: 'Ligue1',
      betType: 'MATCH RESULT',
      profit: 13.7,
      profitAmount: 68,
      status: 'pregame',
      gameTime: 'Sun 8:45 PM',
      outcomes: [
        { label: 'PSG', book: books[6].name, bookKey: books[6].key, odds: 130, ev: 14.5, stake: 247 },
        { label: 'Marseille', book: books[7].name, bookKey: books[7].key, odds: 125, ev: 11.2, stake: 253 },
      ],
    },
    {
      id: '5',
      matchup: 'INTER @ ATLETICO',
      league: 'Champions League',
      sport: 'UCL',
      betType: 'TOTAL GOALS',
      profit: 11.2,
      profitAmount: 56,
      status: 'pregame',
      gameTime: 'Wed 9:00 PM',
      outcomes: [
        { label: 'Over 2.5', book: books[8].name, bookKey: books[8].key, odds: 125, ev: 12.3, line: 2.5, stake: 247 },
        { label: 'Under 3.5', book: books[0].name, bookKey: books[0].key, odds: 120, ev: 11.0, line: 3.5, stake: 253 },
      ],
    },
  ];
}

function getUSArbs(): ArbOpportunity[] {
  const books = REGION_BOOKMAKERS.US.primary;
  return [
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
        { label: 'Over 218.5', book: books[0].name, bookKey: books[0].key, odds: 150, ev: 26.2, line: 218.5, stake: 268 },
        { label: 'Under 222.5', book: books[1].name, bookKey: books[1].key, odds: 190, ev: 21.8, line: 222.5, stake: 232 },
      ],
    },
    {
      id: '2',
      matchup: 'CHIEFS @ BILLS',
      league: 'NFL',
      sport: 'NFL',
      betType: 'SPREAD',
      profit: 22.5,
      profitAmount: 112,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Sun 6:30 PM',
      outcomes: [
        { label: 'Chiefs -3.5', book: books[2].name, bookKey: books[2].key, odds: 185, ev: 24.5, line: -3.5, stake: 215 },
        { label: 'Bills +4.5', book: books[3].name, bookKey: books[3].key, odds: 115, ev: 18.2, line: 4.5, stake: 285 },
      ],
    },
    {
      id: '3',
      matchup: 'RANGERS @ BRUINS',
      league: 'NHL',
      sport: 'NHL',
      betType: 'TOTAL GOALS',
      profit: 17.6,
      profitAmount: 88,
      tag: 'Staying Power',
      status: 'pregame',
      gameTime: 'Tomorrow 7:00 PM',
      outcomes: [
        { label: 'Over 5.5', book: books[4].name, bookKey: books[4].key, odds: 160, ev: 16.1, line: 5.5, stake: 226 },
        { label: 'Under 6.5', book: books[5].name, bookKey: books[5].key, odds: 115, ev: 2.5, line: 6.5, stake: 274 },
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
        { label: 'Yankees', book: books[6].name, bookKey: books[6].key, odds: 130, ev: 14.5, stake: 247 },
        { label: 'Red Sox', book: books[7].name, bookKey: books[7].key, odds: 125, ev: 11.2, stake: 253 },
      ],
    },
    {
      id: '5',
      matchup: 'LAKERS @ WARRIORS',
      league: 'NBA',
      sport: 'NBA',
      betType: 'SPREAD',
      profit: 11.2,
      profitAmount: 56,
      status: 'pregame',
      gameTime: 'Sat 8:30 PM',
      outcomes: [
        { label: 'Warriors -5.5', book: books[8].name, bookKey: books[8].key, odds: 125, ev: 12.3, line: -5.5, stake: 247 },
        { label: 'Lakers +6.5', book: books[0].name, bookKey: books[0].key, odds: 120, ev: 11.0, line: 6.5, stake: 253 },
      ],
    },
  ];
}

// Main function to get sample arbs based on region
function getSampleArbs(region: UserRegion): ArbOpportunity[] {
  switch (region) {
    case 'AU':
      return getAustralianArbs();
    case 'UK':
      return getUKArbs();
    case 'EU':
      return getEUArbs();
    case 'US':
    default:
      return getUSArbs();
  }
}

// =============================================================================
// SIDEBAR CONFIG
// =============================================================================

const SIDEBAR_ITEMS = [
  { icon: TrendingUp, label: 'All Markets' },
  { icon: DollarSign, label: 'Profit %' },
  { icon: BarChart3, label: '+EV Bets' },
  { icon: LinkIcon, label: 'Deep Links' },
];

const PREVIEW_WIDTH = 780;
const SIDEBAR_WIDTH = 160;

// =============================================================================
// COMPONENTS
// =============================================================================

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

// Sport icon component with fallback
function SportIcon({ sport }: { sport: Sport }) {
  const [imgError, setImgError] = useState(false);
  const iconFile = SPORT_ICONS[sport];

  if (imgError) {
    // Fallback to text abbreviation
    return (
      <span 
        className="w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded"
        style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
      >
        {sport.slice(0, 2)}
      </span>
    );
  }

  return (
    <Image
      src={`/sports/${iconFile}`}
      alt={sport}
      width={16}
      height={16}
      className="w-4 h-4 object-contain"
      onError={() => setImgError(true)}
    />
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

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

  const formatOdds = (odds: number) => {
    return formatAmericanOddsForRegion(odds, userRegion);
  };

  return (
    <div className="w-full">
      {/* ================================================================= */}
      {/* Mobile Version — Phone overlay with live scrolling feed inside     */}
      {/* ================================================================= */}
      <div className="md:hidden w-full flex justify-center">
        {mounted ? (
          <PhoneOverlayPreview
            screenWidth={338}
            screenHeight={734}
            screenRadius={44}
            screenLeft={15}
            screenTop={13}
            templateWidth={368}
            templateHeight={759}
            maxRenderWidth={250}
            templateSrc="/Phone_Display_Template.png"
          >
            <PhoneScreenFeedLazy />
          </PhoneOverlayPreview>
        ) : (
          /* Placeholder while JS hydrates — matches phone aspect ratio */
          <div 
            className="rounded-[2rem] animate-pulse"
            style={{ 
              width: '70%', 
              maxWidth: '280px',
              aspectRatio: '368 / 759',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }} 
          />
        )}
      </div>

      {/* ================================================================= */}
      {/* Desktop Version — Full dashboard preview (unchanged)              */}
      {/* ================================================================= */}
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
                          <SportIcon sport={arb.sport} />
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
                borderTop: isHovered ? '1px solid var(--border)' : 'none',
                borderRight: isHovered ? '1px solid var(--border)' : 'none',
                borderBottom: isHovered ? '1px solid var(--border)' : 'none',
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
