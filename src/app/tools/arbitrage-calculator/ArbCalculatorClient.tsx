// src/app/tools/arbitrage-calculator/ArbCalculatorClient.tsx
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Calculator, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Info, TrendingUp, Zap } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';

// ─── Types ────────────────────────────────────────────────────────────────────

type MarketType = '2way' | '3way';

interface Outcome {
  label: string;
  odds: string;
  bookmaker: string;
}

interface CalcResult {
  isArb: boolean;
  impliedSum: number;
  profitPct: number;
  stakes: { label: string; odds: number; bookmaker: string; stake: number; payout: number }[];
  totalStake: number;
  guaranteedProfit: number;
  roi: number;
}

// ─── Calculation logic (mirrors src/lib/arb/calculator.ts) ───────────────────

function calcArb(outcomes: Outcome[], totalStake: number): CalcResult | null {
  const parsed = outcomes.map((o) => ({ ...o, oddsNum: parseFloat(o.odds) }));
  if (parsed.some((o) => isNaN(o.oddsNum) || o.oddsNum <= 1)) return null;

  const weights = parsed.map((o) => 1 / o.oddsNum);
  const impliedSum = weights.reduce((a, b) => a + b, 0);
  const profitPct = (1 / impliedSum - 1) * 100;
  const isArb = impliedSum < 1;

  const stakes = parsed.map((o, i) => {
    const stake = totalStake * (weights[i] / impliedSum);
    return {
      label: o.label,
      odds: o.oddsNum,
      bookmaker: o.bookmaker,
      stake: Math.round(stake * 100) / 100,
      payout: Math.round(stake * o.oddsNum * 100) / 100,
    };
  });

  const guaranteedProfit = Math.round((totalStake / impliedSum - totalStake) * 100) / 100;
  const roi = Math.round(profitPct * 100) / 100;

  return { isArb, impliedSum, profitPct, stakes, totalStake, guaranteedProfit, roi };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OddsInput({
  outcome,
  index,
  onChange,
}: {
  outcome: Outcome;
  index: number;
  onChange: (index: number, field: keyof Outcome, value: string) => void;
}) {
  const oddsNum = parseFloat(outcome.odds);
  const implied = !isNaN(oddsNum) && oddsNum > 1 ? ((1 / oddsNum) * 100).toFixed(1) : null;

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 space-y-3 transition-colors"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--muted)' }}
        >
          {outcome.label}
        </span>
        {implied && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{
              backgroundColor: 'var(--surface-hover)',
              color: 'var(--muted)',
            }}
          >
            {implied}% implied
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'var(--muted)' }}>
            Decimal Odds
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 2.10"
            value={outcome.odds}
            min="1.01"
            step="0.01"
            onChange={(e) => onChange(index, 'odds', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors border focus:border-[var(--primary)]"
            style={{
              backgroundColor: 'var(--surface-inset)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'var(--muted)' }}>
            Bookmaker (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Bet365"
            value={outcome.bookmaker}
            onChange={(e) => onChange(index, 'bookmaker', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors border focus:border-[var(--primary)]"
            style={{
              backgroundColor: 'var(--surface-inset)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
      <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
      <div className="text-right">
        <span
          className={`text-sm font-semibold font-mono ${highlight ? '' : ''}`}
          style={{ color: highlight ? 'var(--success)' : 'var(--foreground)' }}
        >
          {value}
        </span>
        {sub && <div className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'What is arbitrage betting?',
    a: 'Arbitrage betting (also called "arbing" or "sure betting") is when you place bets on all possible outcomes of a sporting event using different bookmakers. If the odds are high enough across all outcomes, the combined implied probability drops below 100% — creating a guaranteed profit regardless of the result.',
  },
  {
    q: 'How do I find arbitrage opportunities?',
    a: 'Arbitrage gaps appear when bookmakers price the same event differently — often due to different data providers, delayed line adjustments, or promotional odds boosts. They\'re easiest to spot with a dedicated arb scanner that monitors multiple books simultaneously in real time.',
  },
  {
    q: 'Is arbitrage betting legal?',
    a: 'Placing bets on sporting events is legal in jurisdictions where sports betting is regulated (Australia, UK, most of Europe, and many US states). Arbitrage itself is not illegal — it\'s just smart use of price differences. However, bookmakers may restrict or close accounts of bettors they identify as arbers.',
  },
  {
    q: 'What\'s a good arbitrage profit percentage?',
    a: 'Most real arbitrage opportunities fall between 0.5% and 5% ROI. Higher percentages (over 5%) are rare and often short-lived. Even 1–2% compounded across many bets adds up substantially over time.',
  },
  {
    q: 'Does this work for Betfair lay bets?',
    a: 'This calculator handles standard book-vs-book arbitrage. For Betfair back/lay arbs, the calculation is different (you need to account for Betfair commission and lay liability). Edge Maxxer\'s full platform handles back/lay arbs with commission-adjusted calculations.',
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.q}</span>
            {openIndex === i ? (
              <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
            )}
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4">
              <p className="text-sm leading-6" style={{ color: 'var(--foreground-secondary)' }}>{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function ArbCalculatorClient() {
  const [marketType, setMarketType] = useState<MarketType>('2way');
  const [totalStake, setTotalStake] = useState<string>('100');
  const [copied, setCopied] = useState(false);

  const defaultOutcomes2: Outcome[] = [
    { label: 'Outcome 1 (Team A / Yes / Over)', odds: '', bookmaker: '' },
    { label: 'Outcome 2 (Team B / No / Under)', odds: '', bookmaker: '' },
  ];
  const defaultOutcomes3: Outcome[] = [
    { label: 'Home Win', odds: '', bookmaker: '' },
    { label: 'Draw', odds: '', bookmaker: '' },
    { label: 'Away Win', odds: '', bookmaker: '' },
  ];

  const [outcomes2, setOutcomes2] = useState<Outcome[]>(defaultOutcomes2);
  const [outcomes3, setOutcomes3] = useState<Outcome[]>(defaultOutcomes3);

  const outcomes = marketType === '2way' ? outcomes2 : outcomes3;
  const setOutcomes = marketType === '2way' ? setOutcomes2 : setOutcomes3;

  const handleOutcomeChange = useCallback(
    (index: number, field: keyof Outcome, value: string) => {
      setOutcomes((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [setOutcomes]
  );

  const handleReset = () => {
    setOutcomes2(defaultOutcomes2);
    setOutcomes3(defaultOutcomes3);
    setTotalStake('100');
  };

  const stake = parseFloat(totalStake);
  const result = !isNaN(stake) && stake > 0 ? calcArb(outcomes, stake) : null;

  const handleCopy = () => {
    if (!result) return;
    const lines = [
      `Arbitrage Calculator — Edge Maxxer`,
      `─────────────────────────────────`,
      ...result.stakes.map(
        (s) =>
          `${s.label}${s.bookmaker ? ` @ ${s.bookmaker}` : ''}: Odds ${s.odds.toFixed(2)} → Stake $${s.stake.toFixed(2)} → Payout $${s.payout.toFixed(2)}`
      ),
      `─────────────────────────────────`,
      `Total Stake: $${result.totalStake.toFixed(2)}`,
      `Guaranteed Profit: $${result.guaranteedProfit.toFixed(2)}`,
      `ROI: ${result.roi.toFixed(2)}%`,
      ``,
      `Calculator: https://www.edgemaxxer.com/tools/arbitrage-calculator`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidResult = result !== null;
  const showResult = isValidResult;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <PublicNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-6" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:opacity-70">Tools</Link>
          <span>/</span>
          <span style={{ color: 'var(--foreground)' }}>Arbitrage Calculator</span>
        </nav>

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--primary-alpha-15)', color: 'var(--primary)' }}
            >
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Arbitrage Betting Calculator
            </h1>
          </div>
          <p className="text-base leading-7 max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
            Enter the decimal odds for each outcome from their respective bookmakers, set your total stake, and get
            optimal bet sizes and guaranteed profit instantly. Free to use, no signup required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left: Calculator inputs ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Market type toggle */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl w-fit"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              {(['2way', '3way'] as MarketType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setMarketType(t)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={
                    marketType === t
                      ? { backgroundColor: 'var(--primary)', color: '#fff' }
                      : { color: 'var(--muted)' }
                  }
                >
                  {t === '2way' ? '2-Way Market' : '3-Way Market'}
                </button>
              ))}
            </div>

            {/* Outcome inputs */}
            {outcomes.map((outcome, i) => (
              <OddsInput key={`${marketType}-${i}`} outcome={outcome} index={i} onChange={handleOutcomeChange} />
            ))}

            {/* Total stake */}
            <div
              className="rounded-2xl border p-4 sm:p-5 space-y-2"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--muted)' }}>
                Total Stake
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono"
                  style={{ color: 'var(--muted)' }}
                >
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="100"
                  value={totalStake}
                  min="1"
                  step="10"
                  onChange={(e) => setTotalStake(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors border focus:border-[var(--primary)]"
                  style={{
                    backgroundColor: 'var(--surface-inset)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Total amount distributed across all bets. The calculator will split this optimally.
              </p>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset calculator
            </button>
          </div>

          {/* ── Right: Results panel ── */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: showResult && result?.isArb ? 'var(--success)' : 'var(--border)',
                backgroundColor: 'var(--surface)',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Result header */}
              <div
                className="px-4 sm:px-5 py-3 border-b flex items-center justify-between"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: showResult && result?.isArb
                    ? 'color-mix(in srgb, var(--success) 8%, var(--surface))'
                    : showResult && !result?.isArb
                    ? 'color-mix(in srgb, var(--danger) 8%, var(--surface))'
                    : 'var(--surface)',
                }}
              >
                <div className="flex items-center gap-2">
                  {showResult && result?.isArb && (
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  )}
                  {showResult && !result?.isArb && (
                    <Info className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  )}
                  {!showResult && <Calculator className="w-4 h-4" style={{ color: 'var(--muted)' }} />}
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {showResult
                      ? result?.isArb
                        ? 'Arbitrage found ✓'
                        : 'No arbitrage'
                      : 'Enter odds above'}
                  </span>
                </div>
                {showResult && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--muted)' }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              <div className="px-4 sm:px-5 py-4 space-y-0">
                {!showResult && (
                  <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>
                    Results will appear here once you enter odds and a stake.
                  </p>
                )}

                {showResult && result && (
                  <>
                    {/* Stakes breakdown */}
                    <div className="space-y-2 mb-4">
                      {result.stakes.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-3 space-y-1"
                          style={{ backgroundColor: 'var(--surface-hover)' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                              {s.label}
                              {s.bookmaker && (
                                <span className="ml-1.5 text-xs" style={{ color: 'var(--muted)' }}>@ {s.bookmaker}</span>
                              )}
                            </span>
                            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                              {s.odds.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold font-mono" style={{ color: 'var(--foreground)' }}>
                              Stake: ${s.stake.toFixed(2)}
                            </span>
                            <span className="text-sm font-mono" style={{ color: 'var(--foreground-secondary)' }}>
                              → ${s.payout.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface-inset)' }}>
                      <div className="px-3 py-1">
                        <ResultRow
                          label="Total stake"
                          value={`$${result.totalStake.toFixed(2)}`}
                        />
                        <ResultRow
                          label="Implied probability sum"
                          value={`${(result.impliedSum * 100).toFixed(2)}%`}
                          sub={result.isArb ? `${(100 - result.impliedSum * 100).toFixed(2)}% margin` : undefined}
                        />
                        <ResultRow
                          label="Guaranteed profit"
                          value={result.isArb ? `+$${result.guaranteedProfit.toFixed(2)}` : `–$${Math.abs(result.guaranteedProfit).toFixed(2)}`}
                          highlight={result.isArb}
                        />
                        <ResultRow
                          label="ROI"
                          value={`${result.roi > 0 ? '+' : ''}${result.roi.toFixed(2)}%`}
                          highlight={result.isArb}
                        />
                      </div>
                    </div>

                    {!result.isArb && (
                      <p className="text-xs mt-3 leading-5" style={{ color: 'var(--muted)' }}>
                        The combined implied probability is over 100% ({(result.impliedSum * 100).toFixed(2)}%), so
                        there is no guaranteed profit at these odds. Try finding higher odds on one or more outcomes.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* CTA */}
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Find arbs automatically
                  </p>
                  <p className="text-xs mt-1 leading-5" style={{ color: 'var(--muted)' }}>
                    Edge Maxxer scans 80+ sportsbooks in real time and surfaces arbitrage opportunities automatically — no manual odds hunting required.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
              >
                Try free dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Explainer content (SEO body copy) ── */}
        <article className="mt-12 sm:mt-16 max-w-3xl space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              How to use this arbitrage betting calculator
            </h2>
            <div className="space-y-3 text-sm leading-7" style={{ color: 'var(--foreground-secondary)' }}>
              <p>
                This calculator works for any standard sports betting arbitrage (also known as a{' '}
                <strong style={{ color: 'var(--foreground)' }}>sure bet</strong>). Here's the process:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Select <strong style={{ color: 'var(--foreground)' }}>2-Way</strong> for head-to-head, over/under, or yes/no markets, or <strong style={{ color: 'var(--foreground)' }}>3-Way</strong> for soccer, boxing, or any market with a draw option.</li>
                <li>Enter the <strong style={{ color: 'var(--foreground)' }}>decimal odds</strong> for each outcome from their respective bookmakers.</li>
                <li>Optionally enter the bookmaker name for each outcome to keep track.</li>
                <li>Enter your total stake — the calculator distributes this optimally across all bets.</li>
                <li>If the implied probability sum is under 100%, you have a genuine arbitrage opportunity. Hit <strong style={{ color: 'var(--foreground)' }}>Copy</strong> to paste the bet details wherever you need.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              How the arbitrage calculation works
            </h2>
            <div className="space-y-3 text-sm leading-7" style={{ color: 'var(--foreground-secondary)' }}>
              <p>
                For a set of outcomes with decimal odds O₁, O₂, ... Oₙ, the implied probability sum is:
              </p>
              <div
                className="rounded-xl px-4 py-3 font-mono text-sm"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Sum = (1/O₁) + (1/O₂) + ... + (1/Oₙ)
              </div>
              <p>
                If <strong style={{ color: 'var(--foreground)' }}>Sum &lt; 1.0</strong>, an arbitrage exists. The guaranteed profit percentage is:
              </p>
              <div
                className="rounded-xl px-4 py-3 font-mono text-sm"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Profit % = (1/Sum − 1) × 100
              </div>
              <p>
                The optimal stake for each outcome is proportional to its implied probability:
              </p>
              <div
                className="rounded-xl px-4 py-3 font-mono text-sm"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Stake_i = Total × (1/O_i) / Sum
              </div>
              <p>
                This ensures the payout is identical regardless of which outcome wins — locking in your guaranteed profit.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Arbitrage betting tips
            </h2>
            <div className="space-y-3 text-sm leading-7" style={{ color: 'var(--foreground-secondary)' }}>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>Speed matters.</strong> Arb opportunities typically last minutes to seconds before bookmakers adjust. Having accounts funded and ready at multiple books is essential.
              </p>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>Account management is critical.</strong> Bookmakers may limit or close accounts that consistently exploit arbitrage. Using realistic stakes, avoiding round numbers, and varying your betting patterns can extend account longevity.
              </p>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>Check settlement rules before betting.</strong> Some bookmakers use different rules for pushes, abandoned events, or player markets. A profitable-looking arb can become a loss if one side voids and the other doesn't.
              </p>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>Verify the market is identical.</strong> "Team A to win" vs "Team A −0 handicap" may look the same but settle differently. Always confirm you're betting on the exact same market at each book.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Frequently asked questions
            </h2>
            <FaqAccordion />
          </section>

          {/* Internal links */}
          <section
            className="rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              More arbitrage resources
            </h2>
            <div className="grid sm:grid-cols-3 gap-2">
              {[
                { label: 'Arbitrage betting guide', href: '/guides/arbitrage-betting', desc: 'Full explainer: how arbs work, risks, and execution' },
                { label: 'Learn hub', href: '/learn', desc: 'Guides, regional pages, and comparisons' },
                { label: 'Free dashboard', href: '/dashboard', desc: 'Scan live arbs across 80+ sportsbooks' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border p-3 transition-colors hover:border-[var(--primary)] block"
                  style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-hover)' }}
                >
                  <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--foreground)' }}>{link.label}</div>
                  <div className="text-xs leading-5" style={{ color: 'var(--muted)' }}>{link.desc}</div>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>

      {/* Footer note */}
      <footer className="border-t mt-16" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
            <strong>Responsible gambling:</strong> Arbitrage betting reduces variance but cannot eliminate risk. Voids, limits, settlement rule differences, and execution speed can all affect outcomes. Always follow local laws and each bookmaker's terms of service. If gambling is causing you harm, contact the{' '}
            <a href="https://www.gamblinghelponline.org.au" className="underline hover:opacity-70" target="_blank" rel="noopener noreferrer">
              Gambling Help Online
            </a>{' '}
            helpline on 1800 858 858 (AU).
          </p>
        </div>
      </footer>
    </div>
  );
}