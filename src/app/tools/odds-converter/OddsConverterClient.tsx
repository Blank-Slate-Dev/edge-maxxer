// src/app/tools/odds-converter/OddsConverterClient.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RefreshCw, Copy, Check, ChevronDown, ChevronUp, ArrowLeftRight, Calculator } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';

// ─── Conversion math ──────────────────────────────────────────────────────────

function decimalToAmerican(decimal: number): string {
  if (decimal <= 1) return '—';
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (decimal - 1))}`;
  }
}

function decimalToFractional(decimal: number): string {
  if (decimal <= 1) return '—';
  const net = decimal - 1;
  // Find reasonable fraction via GCD
  const precision = 10000;
  const num = Math.round(net * precision);
  const den = precision;
  const gcdVal = gcd(num, den);
  const simplifiedNum = num / gcdVal;
  const simplifiedDen = den / gcdVal;
  // If denominator is too large, show as decimal fraction
  if (simplifiedDen > 500) {
    return `${net.toFixed(3).replace(/\.?0+$/, '')}/1`;
  }
  return `${simplifiedNum}/${simplifiedDen}`;
}

function decimalToHongKong(decimal: number): string {
  if (decimal <= 1) return '—';
  return (decimal - 1).toFixed(3).replace(/\.?0+$/, '') || '0';
}

function decimalToImplied(decimal: number): string {
  if (decimal <= 1) return '—';
  return `${((1 / decimal) * 100).toFixed(2)}%`;
}

function americanToDecimal(american: number): number {
  if (american >= 100) return american / 100 + 1;
  if (american <= -100) return 100 / Math.abs(american) + 1;
  return NaN;
}

function fractionalToDecimal(numerator: number, denominator: number): number {
  if (denominator === 0) return NaN;
  return numerator / denominator + 1;
}

function hongKongToDecimal(hk: number): number {
  return hk + 1;
}

function impliedToDecimal(pct: number): number {
  if (pct <= 0 || pct >= 100) return NaN;
  return 100 / pct;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function roundDecimal(n: number, places = 3): number {
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type InputMode = 'decimal' | 'american' | 'fractional' | 'hk' | 'implied';

interface ConversionResult {
  decimal: number;
  american: string;
  fractional: string;
  hongKong: string;
  implied: string;
  valid: boolean;
}

const FORMAT_LABELS: Record<InputMode, string> = {
  decimal: 'Decimal',
  american: 'American (Moneyline)',
  fractional: 'Fractional (UK)',
  hk: 'Hong Kong',
  implied: 'Implied Probability',
};

const FORMAT_PLACEHOLDERS: Record<InputMode, string> = {
  decimal: 'e.g. 2.50',
  american: 'e.g. +150 or -200',
  fractional: 'e.g. 5/2',
  hk: 'e.g. 1.50',
  implied: 'e.g. 40',
};

const FORMAT_HINTS: Record<InputMode, string> = {
  decimal: 'Used by AU, EU and most international bookmakers. Always ≥ 1.01.',
  american: 'Used by US sportsbooks. Positive = underdog, negative = favourite.',
  fractional: 'Common in UK & Ireland. Enter as numerator/denominator (e.g. 5/2).',
  hk: 'Used in Asian markets. Equals decimal odds minus 1.',
  implied: 'Enter the implied win probability as a percentage (e.g. 40 for 40%).',
};

// Popular odds reference table
const REFERENCE_ODDS = [
  { decimal: 1.5, label: 'Heavy fav.' },
  { decimal: 1.8, label: '' },
  { decimal: 2.0, label: 'Evens' },
  { decimal: 2.5, label: '' },
  { decimal: 3.0, label: '' },
  { decimal: 4.0, label: '' },
  { decimal: 5.0, label: '' },
  { decimal: 6.0, label: '' },
  { decimal: 10.0, label: 'Longshot' },
  { decimal: 21.0, label: '' },
  { decimal: 51.0, label: 'Big outsider' },
  { decimal: 101.0, label: '' },
];

const FAQ_ITEMS = [
  {
    q: 'What odds format do Australian bookmakers use?',
    a: "All major Australian bookmakers — Sportsbet, Ladbrokes, Neds, TAB, Bet365, Unibet, and PointsBet — display decimal odds as standard. This is the same format used across Europe. If you're cross-referencing with US sites or UK racing, you'll need to convert.",
  },
  {
    q: 'What is the difference between decimal and fractional odds?',
    a: "Decimal odds represent your total return per $1 staked, including your stake back. So 2.50 decimal means you get $2.50 back for every $1 bet, a net profit of $1.50. Fractional odds show only the profit: 3/2 means you profit $3 for every $2 staked. Decimal odds = (fractional numerator ÷ denominator) + 1.",
  },
  {
    q: 'How do American (moneyline) odds work?',
    a: "Positive American odds (e.g. +150) show profit on a $100 stake — +150 means you win $150 profit. Negative odds (e.g. −200) show how much you need to stake to win $100 — −200 means you stake $200 to profit $100. In decimal: +150 = 2.50, −200 = 1.50.",
  },
  {
    q: 'What is implied probability and why does it matter for arbitrage?',
    a: "Implied probability is the bookmaker's estimated chance of an outcome, derived from the odds. For arbitrage, you add up the implied probabilities of all outcomes across different bookmakers. If the total is less than 100%, a guaranteed profit exists. The further below 100%, the larger the arb margin.",
  },
  {
    q: 'Why do implied probabilities sum to more than 100%?',
    a: "Because bookmakers add a margin (also called overround or vig) to their odds. This is how they make money. A typical 2-outcome market might have implied probabilities of 52.5% + 52.5% = 105% — meaning the true chance adds to 100% but the bookie's book is 5% over. Arbitrage exploits cases where different bookmakers' margins create a combined book under 100%.",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

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
            {openIndex === i
              ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
              : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />}
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

function ResultRow({
  label,
  value,
  sub,
  mono = true,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b last:border-0 gap-4"
      style={{ borderColor: 'var(--border-light)' }}
    >
      <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
      <div className="text-right">
        <span
          className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
          style={{ color: highlight ? 'var(--primary)' : 'var(--foreground)' }}
        >
          {value}
        </span>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OddsConverterClient() {
  const [inputMode, setInputMode] = useState<InputMode>('decimal');
  const [inputValue, setInputValue] = useState('');
  const [fracNum, setFracNum] = useState('');
  const [fracDen, setFracDen] = useState('');
  const [copied, setCopied] = useState(false);

  // Derived: parse input to decimal, then emit all formats
  const result: ConversionResult | null = (() => {
    try {
      let decimal = NaN;

      if (inputMode === 'decimal') {
        decimal = parseFloat(inputValue);
      } else if (inputMode === 'american') {
        // Allow +150 or 150 or -200
        const clean = inputValue.replace(/\s/g, '');
        const num = parseFloat(clean);
        if (!isNaN(num)) decimal = americanToDecimal(num);
      } else if (inputMode === 'fractional') {
        const n = parseFloat(fracNum);
        const d = parseFloat(fracDen);
        if (!isNaN(n) && !isNaN(d) && d > 0) decimal = fractionalToDecimal(n, d);
      } else if (inputMode === 'hk') {
        const hk = parseFloat(inputValue);
        if (!isNaN(hk) && hk > 0) decimal = hongKongToDecimal(hk);
      } else if (inputMode === 'implied') {
        const pct = parseFloat(inputValue);
        if (!isNaN(pct)) decimal = impliedToDecimal(pct);
      }

      if (isNaN(decimal) || decimal <= 1) return null;

      return {
        decimal: roundDecimal(decimal, 4),
        american: decimalToAmerican(decimal),
        fractional: decimalToFractional(decimal),
        hongKong: decimalToHongKong(decimal),
        implied: decimalToImplied(decimal),
        valid: true,
      };
    } catch {
      return null;
    }
  })();

  const hasInput =
    inputMode === 'fractional'
      ? fracNum !== '' || fracDen !== ''
      : inputValue !== '';

  const handleReset = useCallback(() => {
    setInputValue('');
    setFracNum('');
    setFracDen('');
  }, []);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const lines = [
      `Odds Converter — Edge Maxxer`,
      `─────────────────────────────────`,
      `Decimal:            ${result.decimal}`,
      `American:           ${result.american}`,
      `Fractional (UK):    ${result.fractional}`,
      `Hong Kong:          ${result.hongKong}`,
      `Implied probability: ${result.implied}`,
      ``,
      `Convert more: https://www.edgemaxxer.com/tools/odds-converter`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

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
          <span style={{ color: 'var(--foreground)' }}>Odds Converter</span>
        </nav>

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--primary-alpha-15)', color: 'var(--primary)' }}
            >
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Betting Odds Converter
            </h1>
          </div>
          <p className="text-base leading-7 max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
            Convert between decimal, fractional (UK), American (moneyline), Hong Kong odds and implied probability.
            Used by AU, UK, US and EU sportsbooks — enter any format, get all formats instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left: Input ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Format tabs */}
            <div
              className="flex flex-wrap gap-1 p-1 rounded-xl w-fit"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              {(Object.keys(FORMAT_LABELS) as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setInputMode(mode); handleReset(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={
                    inputMode === mode
                      ? { backgroundColor: 'var(--primary)', color: '#fff' }
                      : { color: 'var(--muted)' }
                  }
                >
                  {FORMAT_LABELS[mode]}
                </button>
              ))}
            </div>

            {/* Input panel */}
            <div
              className="rounded-2xl border p-4 sm:p-5 space-y-3"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--muted)' }}>
                  Enter {FORMAT_LABELS[inputMode]}
                </label>
                <p className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
                  {FORMAT_HINTS[inputMode]}
                </p>
              </div>

              {inputMode === 'fractional' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Numerator (e.g. 5)"
                    value={fracNum}
                    min="0"
                    step="1"
                    onChange={(e) => setFracNum(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors border focus:border-[var(--primary)]"
                    style={{ backgroundColor: 'var(--surface-inset)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                  <span className="text-xl font-light shrink-0" style={{ color: 'var(--muted)' }}>/</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Denominator (e.g. 2)"
                    value={fracDen}
                    min="1"
                    step="1"
                    onChange={(e) => setFracDen(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors border focus:border-[var(--primary)]"
                    style={{ backgroundColor: 'var(--surface-inset)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              ) : (
                <div className="relative">
                  {inputMode === 'implied' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>%</span>
                  )}
                  <input
                    type={inputMode === 'american' ? 'text' : 'number'}
                    inputMode="decimal"
                    placeholder={FORMAT_PLACEHOLDERS[inputMode]}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors border focus:border-[var(--primary)]"
                    style={{ backgroundColor: 'var(--surface-inset)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Reference table */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Common odds reference
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-hover)' }}>
                      {['Decimal', 'American', 'Fractional', 'HK', 'Implied %'].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                          style={{ color: 'var(--muted)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REFERENCE_ODDS.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                        style={{ borderColor: 'var(--border-light)' }}
                        onClick={() => {
                          setInputMode('decimal');
                          setInputValue(String(row.decimal));
                        }}
                      >
                        <td className="px-3 py-2 font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
                          {row.decimal.toFixed(2)}
                          {row.label && (
                            <span className="ml-1.5 text-[10px] font-normal" style={{ color: 'var(--muted)' }}>
                              ({row.label})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono" style={{ color: 'var(--foreground-secondary)' }}>
                          {decimalToAmerican(row.decimal)}
                        </td>
                        <td className="px-3 py-2 font-mono" style={{ color: 'var(--foreground-secondary)' }}>
                          {decimalToFractional(row.decimal)}
                        </td>
                        <td className="px-3 py-2 font-mono" style={{ color: 'var(--foreground-secondary)' }}>
                          {decimalToHongKong(row.decimal)}
                        </td>
                        <td className="px-3 py-2 font-mono" style={{ color: 'var(--foreground-secondary)' }}>
                          {decimalToImplied(row.decimal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  Click any row to load those odds into the converter.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: result ? 'var(--primary)' : 'var(--border)',
                backgroundColor: 'var(--surface)',
                transition: 'border-color 0.2s',
              }}
            >
              <div
                className="px-4 sm:px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {result ? 'Converted odds' : 'Enter odds above'}
                </span>
                {result && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--muted)' }}
                  >
                    {copied
                      ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                      : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy all'}
                  </button>
                )}
              </div>

              <div className="px-4 sm:px-5 py-2">
                {!result && (
                  <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>
                    {hasInput ? 'Invalid odds — check your input.' : 'Results will appear here once you enter odds.'}
                  </p>
                )}

                {result && (
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface-inset)' }}>
                    <div className="px-3">
                      <ResultRow
                        label="Decimal"
                        value={result.decimal.toFixed(4).replace(/\.?0+$/, '')}
                        sub="AU / EU standard"
                        highlight={inputMode !== 'decimal'}
                      />
                      <ResultRow
                        label="American (Moneyline)"
                        value={result.american}
                        sub="US sportsbooks"
                        highlight={inputMode !== 'american'}
                      />
                      <ResultRow
                        label="Fractional (UK)"
                        value={result.fractional}
                        sub="UK / Ireland"
                        highlight={inputMode !== 'fractional'}
                      />
                      <ResultRow
                        label="Hong Kong"
                        value={result.hongKong}
                        sub="Asian markets"
                        highlight={inputMode !== 'hk'}
                      />
                      <ResultRow
                        label="Implied probability"
                        value={result.implied}
                        sub="Chance of winning"
                        highlight={inputMode !== 'implied'}
                        mono={false}
                      />
                    </div>
                  </div>
                )}
              </div>

              {result && (
                <div
                  className="px-4 sm:px-5 py-3 border-t"
                  style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-hover)' }}
                >
                  <p className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
                    For a $100 stake at {result.decimal.toFixed(2)} decimal, your total return would be{' '}
                    <span style={{ color: 'var(--foreground)' }}>
                      ${(100 * result.decimal).toFixed(2)}
                    </span>{' '}
                    (profit of{' '}
                    <span style={{ color: 'var(--success)' }}>
                      ${(100 * (result.decimal - 1)).toFixed(2)}
                    </span>
                    ).
                  </p>
                </div>
              )}
            </div>

            {/* Cross-tool CTA */}
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <div className="flex items-start gap-2.5">
                <Calculator className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Found an arb opportunity?
                  </p>
                  <p className="text-xs mt-1 leading-5" style={{ color: 'var(--muted)' }}>
                    Use the arbitrage calculator to work out optimal stakes and guaranteed profit.
                  </p>
                </div>
              </div>
              <Link
                href="/tools/arbitrage-calculator"
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
              >
                Open arb calculator →
              </Link>
            </div>

            {/* Dashboard CTA */}
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Skip the manual work
              </p>
              <p className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
                Edge Maxxer scans 80+ sportsbooks in real time and surfaces arbitrage opportunities automatically — no manual odds hunting needed.
              </p>
              <Link
                href="/dashboard"
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border hover:bg-[var(--surface-hover)]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                Try free dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* ── SEO body content ── */}
        <article className="mt-12 sm:mt-16 max-w-3xl space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Odds format conversion formulas
            </h2>
            <div className="space-y-4 text-sm leading-7" style={{ color: 'var(--foreground-secondary)' }}>
              <p>
                Every format represents the same underlying probability — they're just different conventions used by different markets and regions.
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: 'Fractional → Decimal',
                    formula: 'decimal = (numerator ÷ denominator) + 1',
                    example: '5/2 → (5 ÷ 2) + 1 = 3.50',
                  },
                  {
                    title: 'American (positive) → Decimal',
                    formula: 'decimal = (American ÷ 100) + 1',
                    example: '+250 → (250 ÷ 100) + 1 = 3.50',
                  },
                  {
                    title: 'American (negative) → Decimal',
                    formula: 'decimal = (100 ÷ |American|) + 1',
                    example: '−200 → (100 ÷ 200) + 1 = 1.50',
                  },
                  {
                    title: 'Hong Kong → Decimal',
                    formula: 'decimal = Hong Kong + 1',
                    example: '2.50 HK → 2.50 + 1 = 3.50',
                  },
                  {
                    title: 'Implied probability → Decimal',
                    formula: 'decimal = 100 ÷ implied probability (%)',
                    example: '40% → 100 ÷ 40 = 2.50',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border p-4"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  >
                    <div className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                      {item.title}
                    </div>
                    <div
                      className="font-mono text-xs px-3 py-2 rounded-lg mb-2"
                      style={{ backgroundColor: 'var(--surface-inset)', color: 'var(--foreground)' }}
                    >
                      {item.formula}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      Example: {item.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Which odds format should I use?
            </h2>
            <div className="space-y-3 text-sm leading-7" style={{ color: 'var(--foreground-secondary)' }}>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>Decimal odds</strong> are the easiest format for arbitrage calculations because the math is simple and intuitive — your total return is always odds × stake. All Australian bookmakers and most European ones use decimal by default.
              </p>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>American (moneyline) odds</strong> are standard in the United States. If you're using US-facing sportsbooks like FanDuel, DraftKings, BetMGM or Caesars, you'll need to convert to decimal to run arbitrage calculations accurately.
              </p>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>Fractional odds</strong> are the traditional UK format, still used on some UK horse racing and ante-post markets. They show net profit only, which makes cross-book comparison harder than decimal.
              </p>
              <p>
                <strong style={{ color: 'var(--foreground)' }}>Implied probability</strong> is the most useful format for evaluating value and arbs — if two bookmakers' implied probabilities for a two-outcome event sum to less than 100%, you have a sure bet.
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
              More betting tools & resources
            </h2>
            <div className="grid sm:grid-cols-3 gap-2">
              {[
                { label: 'Arbitrage calculator', href: '/tools/arbitrage-calculator', desc: 'Optimal stakes & guaranteed profit for sure bets' },
                { label: 'Arbitrage betting guide', href: '/guides/arbitrage-betting', desc: 'How arbs work, execution risks, and scanner tips' },
                { label: 'Free live scanner', href: '/dashboard', desc: 'Real-time arbs across 80+ sportsbooks' },
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

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
            <strong>Responsible gambling:</strong> Betting involves financial risk. Always follow local laws and bookmaker terms of service. If gambling is causing you harm, contact{' '}
            <a href="https://www.gamblinghelponline.org.au" className="underline hover:opacity-70" target="_blank" rel="noopener noreferrer">
              Gambling Help Online
            </a>{' '}
            on 1800 858 858 (AU).
          </p>
        </div>
      </footer>
    </div>
  );
}