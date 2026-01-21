// src/components/ResponsibleGambling.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Phone, AlertTriangle } from 'lucide-react';

interface ResponsibleGamblingProps {
  /** Whether to show in compact mode (just the essentials) */
  compact?: boolean;
  /** Additional className for styling */
  className?: string;
}

export function ResponsibleGambling({ compact = false, className = '' }: ResponsibleGamblingProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (compact) {
    return (
      <div 
        className={`text-center py-4 px-4 ${className}`}
        style={{ 
          backgroundColor: 'var(--surface-secondary)',
          borderTop: '1px solid var(--border)'
        }}
      >
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          <span className="font-medium">18+</span> | Gamble Responsibly | 
          <a 
            href="tel:1800858858" 
            className="ml-1 hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Gambling Helpline: 1800 858 858
          </a>
        </p>
      </div>
    );
  }

  return (
    <div 
      className={`${className}`}
      style={{ 
        backgroundColor: 'var(--surface-secondary)',
        borderTop: '1px solid var(--border)'
      }}
    >
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-left transition-colors hover:bg-[var(--surface)]"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" style={{ color: 'var(--warning)' }} />
          <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Gamble Responsibly
          </span>
          <span 
            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-medium"
            style={{ 
              backgroundColor: 'var(--warning-muted)',
              color: 'var(--warning)'
            }}
          >
            18+
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--muted)' }} />
        ) : (
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--muted)' }} />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div 
          className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* Main message */}
          <p className="text-xs sm:text-sm pt-4" style={{ color: 'var(--muted)' }}>
            Gambling can be addictive and harmful. If you or someone you know needs help with gambling, 
            support is available 24/7.
          </p>

          {/* Help resources */}
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {/* National Gambling Helpline */}
            <a
              href="tel:1800858858"
              className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-[var(--surface)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--success-muted)' }}
              >
                <Phone className="w-5 h-5" style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Gambling Helpline
                </div>
                <div className="text-xs" style={{ color: 'var(--primary)' }}>
                  1800 858 858
                </div>
                <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  Free, confidential, 24/7
                </div>
              </div>
            </a>

            {/* Gambling Help Online */}
            <a
              href="https://www.gamblinghelponline.org.au"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-[var(--surface)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--info-muted)' }}
              >
                <ExternalLink className="w-5 h-5" style={{ color: 'var(--info)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Gambling Help Online
                </div>
                <div className="text-xs" style={{ color: 'var(--primary)' }}>
                  gamblinghelponline.org.au
                </div>
                <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  Live chat & resources
                </div>
              </div>
            </a>
          </div>

          {/* BetStop */}
          <div 
            className="p-3 sm:p-4 rounded-lg"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 text-sm sm:text-base font-bold"
                style={{ 
                  backgroundColor: 'var(--danger-muted)',
                  color: 'var(--danger)'
                }}
              >
                🛑
              </div>
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Need to take a break?
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                  BetStop is Australia&apos;s National Self-Exclusion Register. Register to exclude yourself 
                  from all Australian licensed wagering services.
                </p>
                <a
                  href="https://www.betstop.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  Visit BetStop.gov.au
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="text-[10px] sm:text-xs space-y-1" style={{ color: 'var(--muted-foreground)' }}>
            <p>
              • Edge Maxxer is an analytics tool that compares odds across bookmakers. We do not facilitate betting directly.
            </p>
            <p>
              • Set deposit limits with your bookmaker to stay in control of your gambling.
            </p>
            <p>
              • Only gamble with money you can afford to lose.
            </p>
          </div>
        </div>
      )}

      {/* Always visible footer when collapsed */}
      {!isExpanded && (
        <div 
          className="px-4 sm:px-6 pb-3 sm:pb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] sm:text-xs"
          style={{ color: 'var(--muted)' }}
        >
          <a 
            href="tel:1800858858" 
            className="hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Helpline: 1800 858 858
          </a>
          <span>•</span>
          <a 
            href="https://www.gamblinghelponline.org.au" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            gamblinghelponline.org.au
          </a>
          <span>•</span>
          <a 
            href="https://www.betstop.gov.au" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            betstop.gov.au
          </a>
        </div>
      )}
    </div>
  );
}

export default ResponsibleGambling;
