// src/components/StealthGuide.tsx

'use client';

import { useState } from 'react';
import { 
  BOOKMAKER_PROFILES, 
  BookmakerProfile, 
  getRiskColor,
  getAllBookmakerKeys 
} from '@/lib/stealth/bookmakerProfiles';
import { 
  getAccountHealth, 
  getTrackedBookmakers,
  getOverallHealth,
  getHealthStatusColor,
  AccountHealthMetrics 
} from '@/lib/stealth/accountHealth';

interface ExpandableSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: { text: string; color: string };
}

function ExpandableSection({ title, defaultOpen = false, children, badge }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-800 flex items-center justify-between hover:bg-zinc-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-white">{title}</span>
          {badge && (
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: badge.color, color: '#000' }}
            >
              {badge.text}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-zinc-900">
          {children}
        </div>
      )}
    </div>
  );
}

function BookmakerProfileCard({ profile }: { profile: BookmakerProfile }) {
  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">{profile.name}</h4>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs px-2 py-1 rounded font-medium uppercase"
            style={{ backgroundColor: getRiskColor(profile.riskLevel), color: '#000' }}
          >
            {profile.riskLevel} Risk
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-zinc-400">Limiting Speed:</span>
          <span className="text-white ml-2">{profile.limitingSpeed}</span>
        </div>
        <div>
          <span className="text-zinc-400">Avg Lifespan:</span>
          <span className="text-white ml-2">{profile.avgAccountLifespan}</span>
        </div>
        <div>
          <span className="text-zinc-400">MBL Protected:</span>
          <span className={`ml-2 ${profile.minBetLawProtection ? 'text-green-400' : 'text-red-400'}`}>
            {profile.minBetLawProtection ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-zinc-400">Accepts Winners:</span>
          <span className={`ml-2 ${profile.acceptsWinners ? 'text-green-400' : 'text-red-400'}`}>
            {profile.acceptsWinners ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <h5 className="text-zinc-400 text-sm mb-1">Notes:</h5>
        <ul className="text-sm text-zinc-300 space-y-1">
          {profile.notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-zinc-500 mt-1">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h5 className="text-zinc-400 text-sm mb-1">Recommendations:</h5>
        <ul className="text-sm text-green-400/80 space-y-1">
          {profile.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AccountHealthCard({ health }: { health: AccountHealthMetrics }) {
  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">{health.bookmaker}</h4>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs px-2 py-1 rounded font-medium uppercase"
            style={{ backgroundColor: getHealthStatusColor(health.healthStatus), color: '#000' }}
          >
            {health.healthStatus}
          </span>
          <span className="text-sm text-zinc-400">
            Risk: {health.riskScore}/100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div className="text-center p-2 bg-zinc-900 rounded">
          <div className="text-zinc-400 text-xs">Total Bets</div>
          <div className="text-white font-medium">{health.totalBets}</div>
        </div>
        <div className="text-center p-2 bg-zinc-900 rounded">
          <div className="text-zinc-400 text-xs">Win Rate</div>
          <div className={`font-medium ${health.winRate > 55 ? 'text-yellow-400' : 'text-white'}`}>
            {health.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="text-center p-2 bg-zinc-900 rounded">
          <div className="text-zinc-400 text-xs">Mug Bet %</div>
          <div className={`font-medium ${health.mugBetRatio < 25 ? 'text-red-400' : 'text-white'}`}>
            {health.mugBetRatio.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="text-center p-2 bg-zinc-900 rounded">
          <div className="text-zinc-400 text-xs">Total Staked</div>
          <div className="text-white font-medium">${health.totalStaked.toFixed(0)}</div>
        </div>
        <div className="text-center p-2 bg-zinc-900 rounded">
          <div className="text-zinc-400 text-xs">Profit</div>
          <div className={`font-medium ${health.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${health.totalProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {health.warnings.length > 0 && (
        <div className="mb-3">
          <h5 className="text-red-400 text-sm mb-1">⚠️ Warnings:</h5>
          <ul className="text-sm text-red-300 space-y-1">
            {health.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {health.recommendations.length > 0 && (
        <div>
          <h5 className="text-zinc-400 text-sm mb-1">Recommendations:</h5>
          <ul className="text-sm text-zinc-300 space-y-1">
            {health.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StealthGuide() {
  const [activeTab, setActiveTab] = useState<'tips' | 'profiles' | 'health' | 'detection'>('tips');
  
  const trackedBookmakers = getTrackedBookmakers();
  const overallHealth = getOverallHealth();
  const bookmakerKeys = getAllBookmakerKeys();

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800">
        {[
          { id: 'tips', label: 'Survival Tips' },
          { id: 'profiles', label: 'Bookmaker Intel' },
          { id: 'health', label: 'Account Health' },
          { id: 'detection', label: 'Detection Methods' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-white bg-zinc-800 border-b-2 border-blue-500'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* TIPS TAB */}
        {activeTab === 'tips' && (
          <div className="space-y-4">
            <ExpandableSection title="🎯 Golden Rules" defaultOpen={true}>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">1.</span>
                  <span><strong>Round your stakes.</strong> $47.83 screams calculator. $50 looks normal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">2.</span>
                  <span><strong>Place mug bets.</strong> Bet on popular favorites occasionally. 1 mug bet per arb bet minimum.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">3.</span>
                  <span><strong>Don&apos;t withdraw early.</strong> New account + quick withdrawal = instant flag.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">4.</span>
                  <span><strong>Bet close to start time.</strong> Early bets on obscure markets = professional signal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">5.</span>
                  <span><strong>Never take exact promo minimums.</strong> $25.01 on a &quot;bet $25&quot; promo is obvious.</span>
                </li>
              </ul>
            </ExpandableSection>

            <ExpandableSection title="💰 Stake Naturalization">
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Your calculated stake of $47.83 is a red flag. Here&apos;s how to naturalize:</p>
                
                <div className="bg-zinc-800 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">Conservative (Bet365, Ladbrokes)</h5>
                  <p className="text-zinc-400">Round to nearest $5 or $10: $47.83 → $50</p>
                </div>
                
                <div className="bg-zinc-800 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">Moderate (Sportsbet, TAB)</h5>
                  <p className="text-zinc-400">Can use &quot;friendly odd&quot; numbers: $47.83 → $48</p>
                </div>
                
                <div className="bg-zinc-800 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">Aggressive (Betfair Exchange, TopSport)</h5>
                  <p className="text-zinc-400">These don&apos;t limit winners - use exact stakes if needed</p>
                </div>
              </div>
            </ExpandableSection>

            <ExpandableSection title="🎰 Mug Betting Strategy">
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Mug bets are &quot;normal punter&quot; bets that make you look recreational:</p>
                
                <ul className="space-y-2">
                  <li>• Bet on heavy favorites in popular markets (AFL, NRL, EPL)</li>
                  <li>• Use multis/parlays occasionally (bookies love these)</li>
                  <li>• Bet on Same Game Multis when offered</li>
                  <li>• Back popular teams regardless of odds</li>
                  <li>• Bet on live markets during major events</li>
                </ul>
                
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mt-3">
                  <p className="text-yellow-300">
                    <strong>Target:</strong> At least 1 mug bet for every arb/value bet. Higher ratio for extreme-risk books.
                  </p>
                </div>
              </div>
            </ExpandableSection>

            <ExpandableSection title="⏰ Timing Your Bets">
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                  <h5 className="text-green-400 font-medium mb-1">✓ Good Timing</h5>
                  <ul className="text-zinc-300 space-y-1">
                    <li>• 1-2 hours before event start</li>
                    <li>• During live play (for live bets)</li>
                    <li>• Weekend afternoons for sports</li>
                    <li>• Evening hours (casual bettor times)</li>
                  </ul>
                </div>
                
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <h5 className="text-red-400 font-medium mb-1">✗ Bad Timing</h5>
                  <ul className="text-zinc-300 space-y-1">
                    <li>• Immediately when lines open</li>
                    <li>• 3am bets on obscure markets</li>
                    <li>• Right after odds move in your favor</li>
                    <li>• Systematically at the same time daily</li>
                  </ul>
                </div>
              </div>
            </ExpandableSection>
          </div>
        )}

        {/* PROFILES TAB */}
        {activeTab === 'profiles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['extreme', 'high', 'medium', 'low'].map((level) => (
                <div 
                  key={level} 
                  className="text-center p-2 rounded"
                  style={{ backgroundColor: getRiskColor(level as BookmakerProfile['riskLevel']) + '20' }}
                >
                  <span 
                    className="text-xs font-medium uppercase"
                    style={{ color: getRiskColor(level as BookmakerProfile['riskLevel']) }}
                  >
                    {level} Risk
                  </span>
                </div>
              ))}
            </div>
            
            <div className="grid gap-4">
              {bookmakerKeys.map((key) => (
                <BookmakerProfileCard key={key} profile={BOOKMAKER_PROFILES[key]} />
              ))}
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            {trackedBookmakers.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <p className="mb-2">No betting history tracked yet.</p>
                <p className="text-sm">Record your bets to see account health metrics.</p>
              </div>
            ) : (
              <>
                {/* Overall Status */}
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    borderColor: getHealthStatusColor(overallHealth.overallStatus),
                    backgroundColor: getHealthStatusColor(overallHealth.overallStatus) + '10'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Overall Status</h3>
                      <p className="text-sm text-zinc-400">
                        {overallHealth.totalBets} bets across {trackedBookmakers.length} bookmakers
                      </p>
                    </div>
                    <div className="text-right">
                      <span 
                        className="text-lg font-bold uppercase"
                        style={{ color: getHealthStatusColor(overallHealth.overallStatus) }}
                      >
                        {overallHealth.overallStatus}
                      </span>
                      <p className={`text-sm ${overallHealth.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${overallHealth.totalProfit.toFixed(2)} profit
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual Bookmaker Health */}
                <div className="grid gap-4">
                  {trackedBookmakers.map((bookmaker) => (
                    <AccountHealthCard key={bookmaker} health={getAccountHealth(bookmaker)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* DETECTION TAB */}
        {activeTab === 'detection' && (
          <div className="space-y-4">
            <ExpandableSection title="📊 Closing Line Value (CLV)" defaultOpen={true}>
              <div className="space-y-3 text-sm text-zinc-300">
                <p>
                  CLV is the #1 metric bookmakers use to identify sharp bettors. It measures whether 
                  you consistently beat the closing line.
                </p>
                
                <div className="bg-zinc-800 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">How it works:</h5>
                  <ul className="space-y-1 text-zinc-400">
                    <li>• You bet Team A at 2.10</li>
                    <li>• Line closes at 1.95</li>
                    <li>• CLV = (2.10/1.95 - 1) × 100 = +7.7%</li>
                    <li>• Consistently positive CLV = you&apos;re sharp</li>
                  </ul>
                </div>
                
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300">
                    <strong>Warning:</strong> Even 2-3% average CLV over 50+ bets will get you limited at aggressive books.
                  </p>
                </div>
              </div>
            </ExpandableSection>

            <ExpandableSection title="🔍 Pattern Recognition">
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Bookmakers look for these patterns:</p>
                
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">🚩</span>
                    <span><strong>Bet timing correlation:</strong> Always betting right after line moves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">🚩</span>
                    <span><strong>Stake precision:</strong> $47.83, $123.45 style amounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">🚩</span>
                    <span><strong>Market selection:</strong> Only betting where you have edge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">🚩</span>
                    <span><strong>Promotional abuse:</strong> Only betting on promos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">🚩</span>
                    <span><strong>Win rate:</strong> Sustained 55%+ hit rate</span>
                  </li>
                </ul>
              </div>
            </ExpandableSection>

            <ExpandableSection title="🖥️ Technical Detection">
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Advanced methods bookies use:</p>
                
                <div className="space-y-2">
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <h5 className="text-white font-medium">Device Fingerprinting</h5>
                    <p className="text-zinc-400 text-sm">
                      Browser, screen resolution, fonts, plugins - creates unique ID even without login
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <h5 className="text-white font-medium">IP & Location Tracking</h5>
                    <p className="text-zinc-400 text-sm">
                      Multiple accounts from same IP/location get linked. VPNs often blocked.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <h5 className="text-white font-medium">Behavioral Analysis</h5>
                    <p className="text-zinc-400 text-sm">
                      Mouse movements, typing speed, navigation patterns - ML models detect bots/pros
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <h5 className="text-white font-medium">Cross-Book Data Sharing</h5>
                    <p className="text-zinc-400 text-sm">
                      Flutter brands (Sportsbet, Ladbrokes, Neds) share bettor data. Get limited at one, flagged at all.
                    </p>
                  </div>
                </div>
              </div>
            </ExpandableSection>

            <ExpandableSection title="⚖️ Minimum Bet Laws (Racing Only)">
              <div className="space-y-3 text-sm text-zinc-300">
                <p>
                  Australian racing has minimum bet requirements by law. This does NOT apply to sports.
                </p>
                
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                  <h5 className="text-green-400 font-medium mb-2">Protected Minimums:</h5>
                  <ul className="text-zinc-300 space-y-1">
                    <li>• $500 win on individual races (some states)</li>
                    <li>• Must be within certain time before race</li>
                    <li>• Only applies to licensed Australian bookmakers</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                  <p className="text-yellow-300">
                    <strong>Note:</strong> Bookies can still limit you on sports betting - MBL is racing-only.
                  </p>
                </div>
              </div>
            </ExpandableSection>
          </div>
        )}
      </div>
    </div>
  );
}
