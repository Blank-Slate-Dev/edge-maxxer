// src/components/PhoneScreenFeed.tsx
'use client';

/**
 * PhoneScreenFeed
 *
 * A compact arbitrage-opportunity feed designed to fit inside the
 * PhoneOverlayPreview screen cutout (338 × 734 template px).
 *
 * It reuses the same sample-arb data and bookmaker helpers as
 * LiveFeedPreview but renders at phone proportions with smaller
 * typography, tighter spacing, and vertical scrolling.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { TrendingUp } from 'lucide-react';
import { getBookmaker, getBookmakerAbbr, getLogoPath } from '@/lib/bookmakers';
import { useGeoRegion } from '@/components/SportsbooksModal';
import { formatAmericanOddsForRegion } from '@/lib/oddsFormat';
import type { UserRegion } from '@/lib/config';

// ── Types ──────────────────────────────────────────────────────────────

type Sport =
  | 'NBA' | 'NFL' | 'NHL' | 'MLB' | 'MLS'
  | 'AFL' | 'NRL' | 'Cricket' | 'ALeague'
  | 'EPL' | 'Championship' | 'RugbyUnion' | 'RugbyLeague'
  | 'LaLiga' | 'Bundesliga' | 'SerieA' | 'Ligue1' | 'UCL'
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
  gameTime?: string;
  outcomes: {
    label: string;
    book: string;
    bookKey: string;
    odds: number;
    line?: number;
    ev?: number;
    stake?: number;
  }[];
}

// ── Sport Icons ────────────────────────────────────────────────────────

const SPORT_ICONS: Record<Sport, string> = {
  NBA: 'NBA.png', NFL: 'NFL.png', NHL: 'NHL.png', MLB: 'MLB.png', MLS: 'MLS.png',
  AFL: 'AFL.png', NRL: 'NRL.png', Cricket: 'Cricket.png', ALeague: 'ALeague.png',
  EPL: 'EPL.png', Championship: 'Championship.png', RugbyUnion: 'RugbyUnion.png',
  RugbyLeague: 'RugbyLeague.png', LaLiga: 'LaLiga.png', Bundesliga: 'Bundesliga.png',
  SerieA: 'SerieA.png', Ligue1: 'Ligue1.png', UCL: 'UCL.png', Tennis: 'Tennis.png',
};

// ── Region bookmaker configs (same as LiveFeedPreview) ─────────────────

interface RegionBookmakers { primary: { name: string; key: string }[] }

const REGION_BOOKMAKERS: Record<UserRegion, RegionBookmakers> = {
  AU: {
    primary: [
      { name: 'Sportsbet', key: 'sportsbet' },
      { name: 'TAB', key: 'tab' },
      { name: 'Bet365', key: 'bet365_au' },
      { name: 'Ladbrokes', key: 'ladbrokes_au' },
      { name: 'PointsBet', key: 'pointsbetau' },
      { name: 'PlayUp', key: 'playup' },
      { name: 'Neds', key: 'neds' },
      { name: 'Unibet', key: 'unibet' },
      { name: 'Betfair', key: 'betfair_ex_au' },
    ],
  },
  UK: {
    primary: [
      { name: 'Bet365', key: 'williamhill' },
      { name: 'William Hill', key: 'williamhill' },
      { name: 'Paddy Power', key: 'paddypower' },
      { name: 'Sky Bet', key: 'skybet' },
      { name: 'Ladbrokes', key: 'ladbrokes_uk' },
      { name: 'Betfair', key: 'betfair_ex_uk' },
      { name: 'Coral', key: 'coral' },
      { name: 'Betway', key: 'betway' },
      { name: '888sport', key: 'sport888' },
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
      { name: 'Tipico', key: 'tipico_de' },
      { name: 'Marathonbet', key: 'marathonbet' },
      { name: 'NordicBet', key: 'nordicbet' },
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
      { name: 'BetRivers', key: 'betrivers' },
      { name: 'PointsBet', key: 'pointsbetau' },
      { name: 'Hard Rock', key: 'hardrockbet' },
    ],
  },
};

// ── Sample arb generators (identical data to LiveFeedPreview) ──────────

function getArbs(region: UserRegion): ArbOpportunity[] {
  const b = REGION_BOOKMAKERS[region].primary;

  const regionData: Record<UserRegion, ArbOpportunity[]> = {
    AU: [
      { id:'1', matchup:'COLLINGWOOD @ CARLTON', league:'AFL', sport:'AFL', betType:'H2H', profit:25.8, profitAmount:129, tag:'Middle', gameTime:'Fri 7:50 PM',
        outcomes:[{ label:'Collingwood', book:b[0].name, bookKey:b[0].key, odds:150, ev:26.2, stake:268 },{ label:'Carlton', book:b[1].name, bookKey:b[1].key, odds:190, ev:21.8, stake:232 }] },
      { id:'2', matchup:'BRONCOS @ STORM', league:'NRL', sport:'NRL', betType:'LINE', profit:22.5, profitAmount:112, tag:'Staying Power', gameTime:'Sat 7:35 PM',
        outcomes:[{ label:'Broncos +4.5', book:b[2].name, bookKey:b[2].key, odds:185, ev:24.5, line:4.5, stake:215 },{ label:'Storm -3.5', book:b[3].name, bookKey:b[3].key, odds:115, ev:18.2, line:-3.5, stake:285 }] },
      { id:'3', matchup:'AUSTRALIA @ ENGLAND', league:'The Ashes', sport:'Cricket', betType:'WINNER', profit:17.6, profitAmount:88, gameTime:'Thu 10:30 AM',
        outcomes:[{ label:'Australia', book:b[4].name, bookKey:b[4].key, odds:160, ev:16.1, stake:226 },{ label:'England', book:b[5].name, bookKey:b[5].key, odds:115, ev:2.5, stake:274 }] },
      { id:'4', matchup:'SYDNEY FC @ MELB VICTORY', league:'A-League', sport:'ALeague', betType:'H2H', profit:13.7, profitAmount:68, gameTime:'Sun 5:00 PM',
        outcomes:[{ label:'Sydney FC', book:b[6].name, bookKey:b[6].key, odds:130, ev:14.5, stake:247 },{ label:'Melb Victory', book:b[7].name, bookKey:b[7].key, odds:125, ev:11.2, stake:253 }] },
      { id:'5', matchup:'RICHMOND @ GEELONG', league:'AFL', sport:'AFL', betType:'TOTAL', profit:11.2, profitAmount:56, gameTime:'Sat 4:35 PM',
        outcomes:[{ label:'Over 165.5', book:b[8].name, bookKey:b[8].key, odds:125, ev:12.3, line:165.5, stake:247 },{ label:'Under 168.5', book:b[0].name, bookKey:b[0].key, odds:120, ev:11.0, line:168.5, stake:253 }] },
    ],
    UK: [
      { id:'1', matchup:'ARSENAL @ CHELSEA', league:'Premier League', sport:'EPL', betType:'RESULT', profit:25.8, profitAmount:129, tag:'Middle', gameTime:'Sat 3:00 PM',
        outcomes:[{ label:'Arsenal', book:b[0].name, bookKey:b[0].key, odds:150, ev:26.2, stake:268 },{ label:'Chelsea', book:b[1].name, bookKey:b[1].key, odds:190, ev:21.8, stake:232 }] },
      { id:'2', matchup:'LIVERPOOL @ MAN UTD', league:'Premier League', sport:'EPL', betType:'AH', profit:22.5, profitAmount:112, tag:'Staying Power', gameTime:'Sun 4:30 PM',
        outcomes:[{ label:'Liverpool -1.5', book:b[2].name, bookKey:b[2].key, odds:185, ev:24.5, line:-1.5, stake:215 },{ label:'Man Utd +2.5', book:b[3].name, bookKey:b[3].key, odds:115, ev:18.2, line:2.5, stake:285 }] },
      { id:'3', matchup:'LEEDS @ SHEFF UTD', league:'Championship', sport:'Championship', betType:'RESULT', profit:17.6, profitAmount:88, gameTime:'Sat 12:30 PM',
        outcomes:[{ label:'Leeds', book:b[4].name, bookKey:b[4].key, odds:160, ev:16.1, stake:226 },{ label:'Sheff Utd', book:b[5].name, bookKey:b[5].key, odds:115, ev:2.5, stake:274 }] },
      { id:'4', matchup:'ENGLAND @ IRELAND', league:'Six Nations', sport:'RugbyUnion', betType:'WINNER', profit:13.7, profitAmount:68, gameTime:'Sat 4:45 PM',
        outcomes:[{ label:'England', book:b[6].name, bookKey:b[6].key, odds:130, ev:14.5, stake:247 },{ label:'Ireland', book:b[7].name, bookKey:b[7].key, odds:125, ev:11.2, stake:253 }] },
      { id:'5', matchup:'MAN CITY @ SPURS', league:'Premier League', sport:'EPL', betType:'TOTAL', profit:11.2, profitAmount:56, gameTime:'Sun 2:00 PM',
        outcomes:[{ label:'Over 2.5', book:b[8].name, bookKey:b[8].key, odds:125, ev:12.3, line:2.5, stake:247 },{ label:'Under 3.5', book:b[0].name, bookKey:b[0].key, odds:120, ev:11.0, line:3.5, stake:253 }] },
    ],
    EU: [
      { id:'1', matchup:'REAL MADRID @ BARCA', league:'La Liga', sport:'LaLiga', betType:'RESULT', profit:25.8, profitAmount:129, tag:'Middle', gameTime:'Sat 9:00 PM',
        outcomes:[{ label:'Real Madrid', book:b[0].name, bookKey:b[0].key, odds:150, ev:26.2, stake:268 },{ label:'Barcelona', book:b[1].name, bookKey:b[1].key, odds:190, ev:21.8, stake:232 }] },
      { id:'2', matchup:'BAYERN @ DORTMUND', league:'Bundesliga', sport:'Bundesliga', betType:'AH', profit:22.5, profitAmount:112, tag:'Staying Power', gameTime:'Sat 6:30 PM',
        outcomes:[{ label:'Bayern -1.5', book:b[2].name, bookKey:b[2].key, odds:185, ev:24.5, line:-1.5, stake:215 },{ label:'Dortmund +2.5', book:b[3].name, bookKey:b[3].key, odds:115, ev:18.2, line:2.5, stake:285 }] },
      { id:'3', matchup:'JUVE @ AC MILAN', league:'Serie A', sport:'SerieA', betType:'RESULT', profit:17.6, profitAmount:88, gameTime:'Sun 8:45 PM',
        outcomes:[{ label:'Juventus', book:b[4].name, bookKey:b[4].key, odds:160, ev:16.1, stake:226 },{ label:'AC Milan', book:b[5].name, bookKey:b[5].key, odds:115, ev:2.5, stake:274 }] },
      { id:'4', matchup:'PSG @ MARSEILLE', league:'Ligue 1', sport:'Ligue1', betType:'RESULT', profit:13.7, profitAmount:68, gameTime:'Sun 8:45 PM',
        outcomes:[{ label:'PSG', book:b[6].name, bookKey:b[6].key, odds:130, ev:14.5, stake:247 },{ label:'Marseille', book:b[7].name, bookKey:b[7].key, odds:125, ev:11.2, stake:253 }] },
      { id:'5', matchup:'INTER @ ATLETICO', league:'Champions League', sport:'UCL', betType:'TOTAL', profit:11.2, profitAmount:56, gameTime:'Wed 9:00 PM',
        outcomes:[{ label:'Over 2.5', book:b[8].name, bookKey:b[8].key, odds:125, ev:12.3, line:2.5, stake:247 },{ label:'Under 3.5', book:b[0].name, bookKey:b[0].key, odds:120, ev:11.0, line:3.5, stake:253 }] },
    ],
    US: [
      { id:'1', matchup:'CELTICS @ KNICKS', league:'NBA', sport:'NBA', betType:'TOTAL', profit:25.8, profitAmount:129, tag:'Middle', gameTime:'Today 7:30 PM',
        outcomes:[{ label:'Over 218.5', book:b[0].name, bookKey:b[0].key, odds:150, ev:26.2, line:218.5, stake:268 },{ label:'Under 222.5', book:b[1].name, bookKey:b[1].key, odds:190, ev:21.8, line:222.5, stake:232 }] },
      { id:'2', matchup:'CHIEFS @ BILLS', league:'NFL', sport:'NFL', betType:'SPREAD', profit:22.5, profitAmount:112, tag:'Staying Power', gameTime:'Sun 6:30 PM',
        outcomes:[{ label:'Chiefs -3.5', book:b[2].name, bookKey:b[2].key, odds:185, ev:24.5, line:-3.5, stake:215 },{ label:'Bills +4.5', book:b[3].name, bookKey:b[3].key, odds:115, ev:18.2, line:4.5, stake:285 }] },
      { id:'3', matchup:'RANGERS @ BRUINS', league:'NHL', sport:'NHL', betType:'TOTAL', profit:17.6, profitAmount:88, gameTime:'Tmrw 7:00 PM',
        outcomes:[{ label:'Over 5.5', book:b[4].name, bookKey:b[4].key, odds:160, ev:16.1, line:5.5, stake:226 },{ label:'Under 6.5', book:b[5].name, bookKey:b[5].key, odds:115, ev:2.5, line:6.5, stake:274 }] },
      { id:'4', matchup:'YANKEES @ RED SOX', league:'MLB', sport:'MLB', betType:'ML', profit:13.7, profitAmount:68, gameTime:'Tmrw 1:05 PM',
        outcomes:[{ label:'Yankees', book:b[6].name, bookKey:b[6].key, odds:130, ev:14.5, stake:247 },{ label:'Red Sox', book:b[7].name, bookKey:b[7].key, odds:125, ev:11.2, stake:253 }] },
      { id:'5', matchup:'LAKERS @ WARRIORS', league:'NBA', sport:'NBA', betType:'SPREAD', profit:11.2, profitAmount:56, gameTime:'Sat 8:30 PM',
        outcomes:[{ label:'Warriors -5.5', book:b[8].name, bookKey:b[8].key, odds:125, ev:12.3, line:-5.5, stake:247 },{ label:'Lakers +6.5', book:b[0].name, bookKey:b[0].key, odds:120, ev:11.0, line:6.5, stake:253 }] },
    ],
  };

  return regionData[region];
}

// ── Small helper components ────────────────────────────────────────────

function BookLogo({ bookKey, size = 22 }: { bookKey: string; size?: number }) {
  const [err, setErr] = useState(false);
  const bm = getBookmaker(bookKey);
  const bg = bm?.color || '#333';
  const tc = bm?.textColor || '#fff';
  const abbr = bm ? getBookmakerAbbr(bm.name) : bookKey.slice(0, 2).toUpperCase();

  if (err || !bm) {
    return (
      <div
        className="rounded flex items-center justify-center font-bold"
        style={{ width: size, height: size, backgroundColor: bg, color: tc, fontSize: size * 0.35 }}
      >
        {abbr}
      </div>
    );
  }

  return (
    <Image
      src={getLogoPath(bookKey)}
      alt={bm.name}
      width={size}
      height={size}
      className="rounded object-cover"
      style={{ width: size, height: size }}
      onError={() => setErr(true)}
    />
  );
}

function SportIcon({ sport }: { sport: Sport }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <span
        className="flex items-center justify-center text-[6px] font-bold rounded"
        style={{ width: 12, height: 12, backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
      >
        {sport.slice(0, 2)}
      </span>
    );
  }
  return (
    <Image
      src={`/sports/${SPORT_ICONS[sport]}`}
      alt={sport}
      width={12}
      height={12}
      className="object-contain"
      style={{ width: 12, height: 12 }}
      onError={() => setErr(true)}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────

export function PhoneScreenFeed() {
  const detectedRegion = useGeoRegion();
  const [regionReady, setRegionReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRegionReady(true), 500);
    return () => clearTimeout(t);
  }, [detectedRegion]);

  const region: UserRegion = detectedRegion === 'ALL' ? 'AU' : detectedRegion;
  const arbs = getArbs(region);

  const fmt = (odds: number) => formatAmericanOddsForRegion(odds, region);

  // ── Scroll-linked feed ─────────────────────────────────────────────
  // As the user scrolls the page past the phone, the feed content
  // translates upward inside the clipped container, creating the
  // illusion of the phone scrolling in sync with the page.
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const feedInnerRef = useRef<HTMLDivElement>(null);
  const [feedTranslateY, setFeedTranslateY] = useState(0);

  useEffect(() => {
    const container = feedContainerRef.current;
    const inner = feedInnerRef.current;
    if (!container || !inner) return;

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const viewH = window.innerHeight;

      // How far the container has scrolled into / through the viewport
      // 0 = just entering from bottom, 1 = fully past the top
      const progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)));

      // Max we can translate = how much the inner content overflows the container
      const overflow = Math.max(0, inner.scrollHeight - container.clientHeight);
      setFeedTranslateY(progress * overflow);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position
    return () => window.removeEventListener('scroll', onScroll);
  }, [arbs]);

  return (
    <div
      className="flex flex-col"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        fontSize: 10,
      }}
    >
      {/* ── Mini header ──────────────────────────────────── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: '#22c55e' }}
          />
          <span className="font-semibold" style={{ fontSize: 9, color: 'var(--foreground)' }}>
            EDGE MAXXER
          </span>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[8px] font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            color: 'var(--primary)',
          }}
        >
          Auto scanning
        </span>
      </div>

      {/* ── Tab bar ──────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          padding: '6px 10px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        {['H2H', 'Lines', 'Totals', 'Value'].map((tab, i) => (
          <span
            key={tab}
            className="font-medium"
            style={{
              fontSize: 9,
              color: i === 0 ? 'var(--primary)' : 'var(--muted)',
              borderBottom: i === 0 ? '1px solid var(--primary)' : 'none',
              paddingBottom: 2,
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* ── Scrollable arb cards ─────────────────────────── */}
      <div
        className="flex-1 overflow-hidden"
        ref={feedContainerRef}
        style={{ padding: '6px 6px' }}
      >
        <div
          ref={feedInnerRef}
          className="space-y-2"
          style={{
            transform: `translateY(-${feedTranslateY}px)`,
            willChange: 'transform',
          }}
        >
          {arbs.map((arb) => (
            <div
              key={arb.id}
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between"
                style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <SportIcon sport={arb.sport} />
                  <span className="text-[8px] truncate" style={{ color: 'var(--muted)' }}>
                    {arb.league}
                  </span>
                </div>
                {arb.tag && (
                  <span
                    className="text-[7px] px-1 py-0.5 rounded font-medium shrink-0"
                    style={{
                      backgroundColor:
                        arb.tag === 'Middle'
                          ? 'var(--purple-muted)'
                          : 'var(--primary-alpha-15)',
                      color:
                        arb.tag === 'Middle' ? 'var(--purple)' : 'var(--primary)',
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

              {/* Matchup + profit */}
              <div
                className="flex items-center justify-between"
                style={{ padding: '5px 8px', backgroundColor: 'var(--surface-inset)' }}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[9px] truncate" style={{ color: 'var(--foreground)' }}>
                    {arb.matchup}
                  </div>
                  <div className="text-[7px]" style={{ color: 'var(--muted)' }}>
                    {arb.betType} · {arb.gameTime}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="font-bold text-sm" style={{ color: 'var(--success)' }}>
                    {arb.profit.toFixed(1)}%
                  </div>
                  <div className="flex items-center gap-0.5 text-[8px]" style={{ color: 'var(--success)' }}>
                    <TrendingUp className="w-2 h-2" />
                    +${arb.profitAmount}
                  </div>
                </div>
              </div>

              {/* Outcomes */}
              {arb.outcomes.map((o, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                  style={{
                    padding: '5px 8px',
                    borderTop: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-inset)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookLogo bookKey={o.bookKey} size={20} />
                    <span className="text-[9px] font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {o.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {regionReady ? (
                      <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--success)' }}>
                        {fmt(o.odds)}
                      </span>
                    ) : (
                      <span
                        className="inline-block w-7 h-3 rounded animate-pulse"
                        style={{ backgroundColor: 'var(--surface)' }}
                      />
                    )}
                    {o.ev && (
                      <span
                        className="text-[7px] px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--primary-alpha-15)',
                          color: 'var(--primary)',
                        }}
                      >
                        {o.ev.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}