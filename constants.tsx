
import { NewsStory, SidebarTopic, VeracityRating, NewsSource, Claim, CredibilitySource } from './types';

const SOURCES: Record<string, NewsSource> = {
  confirmd: { id: 's0', name: 'Confirmd Editorial', logo: 'C', rating: VeracityRating.VERIFIED, url: '#' },
  bloomberg: { id: 's1', name: 'Bloomberg Crypto', logo: 'BC', rating: VeracityRating.VERIFIED, url: '#' },
  reuters: { id: 's2', name: 'Reuters', logo: 'R', rating: VeracityRating.VERIFIED, url: '#' },
  theblock: { id: 's3', name: 'The Block', logo: 'TB', rating: VeracityRating.VERIFIED, url: '#' },
  coindesk: { id: 's4', name: 'CoinDesk', logo: 'CD', rating: VeracityRating.BALANCED, url: '#' },
  cointelegraph: { id: 's5', name: 'CoinTelegraph', logo: 'CT', rating: VeracityRating.BALANCED, url: '#' },
  whalechart: { id: 's6', name: 'WhaleChart', logo: 'WC', rating: VeracityRating.SPECULATIVE, url: '#' },
  cryptodaily: { id: 's7', name: 'CryptoDaily', logo: 'CDY', rating: VeracityRating.SPECULATIVE, url: '#' },
  xleak: { id: 's8', name: 'X-Leaks', logo: 'XL', rating: VeracityRating.SPECULATIVE, url: '#' },
};

export const MOCK_STORIES: NewsStory[] = [
  {
    id: 'confirmd-1',
    title: 'The State of Institutional DeFi: A Multi-Source Synthesis',
    summary: 'Our editorial team has distilled 12 institutional reports into a single verified brief on the 2024 DeFi regulatory landscape, removing all market-driven hyperbole.',
    fullContent: 'By analyzing regulatory filings from the SEC and the European Central Bank alongside verified reporting from Reuters and Bloomberg, Confirmd has identified three core pillars of the 2024 institutional pivot. Unlike speculative outlets claiming "imminent adoption," our synthesis focuses on the actual technical milestones reached by the major clearing houses. The signal here is clear: structural integration is preceding retail-facing features.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    sources: [SOURCES.confirmd, SOURCES.bloomberg, SOURCES.reuters, SOURCES.theblock],
    timeLabel: 'Just Now',
    category: 'Analysis',
    veracity: { verified: 100, balanced: 0, speculative: 0 },
    isSynthesized: true,
    synthesisNotes: [
      "Filtered out anonymous 'insider' claims from 3 speculative outlets.",
      "Consolidated 4 conflicting dates for SEC filings into the single verified submission date.",
      "Removed price prediction hyperbole from informing sources."
    ]
  },
  {
    id: '1',
    title: 'U.S. Treasury Proposes New DeFi Monitoring Rules',
    summary: 'The Treasury Department is seeking public comment on a new framework that would require decentralized protocols to implement strict KYC measures.',
    fullContent: 'The U.S. Treasury Department has officially entered the DeFi space with a comprehensive regulatory proposal. This 300-page document outlines a vision for the future of decentralized finance where privacy-preserving protocols must reconcile with Anti-Money Laundering (AML) standards.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800',
    sources: [SOURCES.bloomberg, SOURCES.reuters, SOURCES.theblock, SOURCES.coindesk],
    timeLabel: '1h ago',
    category: 'Regulation',
    veracity: { verified: 90, balanced: 10, speculative: 0 }
  },
  {
    id: '2',
    title: 'Insider Claims Amazon to Launch NFT Marketplace Next Month',
    summary: 'A source close to the e-commerce giant suggests that Amazon is finalizing its blockchain infrastructure for a massive digital collectibles rollout.',
    fullContent: 'Multiple speculative outlets have reported that Amazon is "weeks away" from a major NFT pivot. While the company has not made an official statement, anonymous leaks from AWS engineering teams suggest that a proprietary chain is in testing.',
    imageUrl: 'https://images.unsplash.com/photo-1523475496153-3d6cc0f0bf19?auto=format&fit=crop&q=80&w=800',
    sources: [SOURCES.whalechart, SOURCES.xleak, SOURCES.cryptodaily, SOURCES.cointelegraph],
    timeLabel: '3h ago',
    category: 'Tech',
    veracity: { verified: 5, balanced: 15, speculative: 80 },
    isBlindspot: true
  },
  {
    id: '3',
    title: 'Solana Network Successfully Implements Firedancer Upgrade',
    summary: 'Validators have reported a significant increase in throughput after the latest core client update went live on mainnet-beta.',
    imageUrl: 'https://images.unsplash.com/photo-1639710339857-71955b2940bc?auto=format&fit=crop&q=80&w=800',
    sources: [SOURCES.theblock, SOURCES.coindesk, SOURCES.cointelegraph],
    timeLabel: '5h ago',
    category: 'Infrastructure',
    veracity: { verified: 60, balanced: 35, speculative: 5 }
  }
];

export const SIDEBAR_TOPICS: SidebarTopic[] = [
  { id: '1', name: 'Ethereum ETF', trend: 'up' },
  { id: '2', name: 'SEC v. Ripple', trend: 'neutral' },
  { id: '3', name: 'Layer 2 Season', trend: 'up' },
  { id: '4', name: 'GameFi Revival', trend: 'down' },
  { id: '5', name: 'Stablecoin Bills', trend: 'up' }
];

// ============================================
// CREDIBILITY SOURCES (from spec)
// ============================================

export const CREDIBILITY_SOURCES: Record<string, CredibilitySource> = {
  'bloomberg-crypto': {
    id: 'bloomberg-crypto',
    type: 'publisher',
    handleOrDomain: 'bloomberg.com',
    displayName: 'Bloomberg Crypto',
    logo: 'BC',
    score: { trackRecord: 89, methodDiscipline: 92, sampleSize: 156, confidenceInterval: { lower: 85, upper: 93 } }
  },
  'reuters': {
    id: 'reuters',
    type: 'publisher',
    handleOrDomain: 'reuters.com',
    displayName: 'Reuters',
    logo: 'R',
    score: { trackRecord: 91, methodDiscipline: 94, sampleSize: 203, confidenceInterval: { lower: 88, upper: 94 } }
  },
  'sec-gov': {
    id: 'sec-gov',
    type: 'regulator',
    handleOrDomain: 'sec.gov',
    displayName: 'SEC',
    logo: 'SEC',
    score: { trackRecord: 98, methodDiscipline: 99, sampleSize: 45, confidenceInterval: { lower: 95, upper: 100 } }
  },
  'the-block': {
    id: 'the-block',
    type: 'publisher',
    handleOrDomain: 'theblock.co',
    displayName: 'The Block',
    logo: 'TB',
    score: { trackRecord: 82, methodDiscipline: 85, sampleSize: 189, confidenceInterval: { lower: 78, upper: 86 } }
  },
  'coindesk': {
    id: 'coindesk',
    type: 'publisher',
    handleOrDomain: 'coindesk.com',
    displayName: 'CoinDesk',
    logo: 'CD',
    score: { trackRecord: 76, methodDiscipline: 78, sampleSize: 234, confidenceInterval: { lower: 72, upper: 80 } }
  },
  'cointelegraph': {
    id: 'cointelegraph',
    type: 'publisher',
    handleOrDomain: 'cointelegraph.com',
    displayName: 'Cointelegraph',
    logo: 'CT',
    score: { trackRecord: 58, methodDiscipline: 52, sampleSize: 312, confidenceInterval: { lower: 54, upper: 62 } }
  },
  'ct-whale': {
    id: 'ct-whale',
    type: 'x_handle',
    handleOrDomain: '@CryptoWhale',
    displayName: 'Crypto Whale',
    logo: 'CW',
    score: { trackRecord: 34, methodDiscipline: 22, sampleSize: 89, confidenceInterval: { lower: 28, upper: 40 } }
  },
  'defi-alpha': {
    id: 'defi-alpha',
    type: 'telegram',
    handleOrDomain: 't.me/defialpha',
    displayName: 'DeFi Alpha Leaks',
    logo: 'DA',
    score: { trackRecord: 28, methodDiscipline: 18, sampleSize: 67, confidenceInterval: { lower: 20, upper: 36 } }
  },
};

// ============================================
// MOCK CLAIMS (from spec)
// ============================================

export const MOCK_CLAIMS: Claim[] = [
  {
    id: 'claim-1',
    sourceId: 'bloomberg-crypto',
    claimText: 'The SEC has scheduled a meeting to discuss spot Ethereum ETF applications on February 15, 2024',
    claimType: 'filing_approved_or_denied',
    assetSymbols: ['ETH'],
    assertedAt: '2024-01-15T14:30:00Z',
    resolveBy: '2024-02-15T23:59:00Z',
    resolutionType: 'scheduled',
    falsifiabilityScore: 0.95,
    llmConfidence: 0.82,
    status: 'reviewed',
    verdict: {
      verdictLabel: 'verified',
      probabilityTrue: 0.91,
      evidenceStrength: 0.88,
      reasoningSummary: 'SEC public calendar confirms the scheduled meeting. Multiple institutional sources corroborate the timeline. Primary evidence directly supports this claim.',
      invalidationTriggers: 'SEC announcement of postponement or cancellation would invalidate this verdict.',
    },
    evidence: [
      { id: 'ev-1', url: 'https://sec.gov/calendar', publisher: 'SEC', grade: 'A', stance: 'supports', excerpt: 'Commission meeting scheduled for February 15 to discuss pending ETF applications...' },
      { id: 'ev-2', url: 'https://bloomberg.com/etf-timeline', publisher: 'Bloomberg', grade: 'B', stance: 'supports', excerpt: 'Sources familiar with the matter confirm SEC readiness to evaluate applications...' },
      { id: 'ev-3', url: 'https://theblock.co/analysis', publisher: 'The Block', grade: 'B', stance: 'supports', excerpt: 'Industry insiders expect decision within the scheduled window based on regulatory signals...' },
    ],
  },
  {
    id: 'claim-2',
    sourceId: 'ct-whale',
    claimText: 'ETH ETF will be approved THIS WEEK, insider source confirms imminent announcement',
    claimType: 'filing_approved_or_denied',
    assetSymbols: ['ETH'],
    assertedAt: '2024-01-15T16:20:00Z',
    resolveBy: '2024-01-22T23:59:00Z',
    resolutionType: 'scheduled',
    falsifiabilityScore: 0.85,
    llmConfidence: 0.25,
    status: 'reviewed',
    verdict: {
      verdictLabel: 'speculative',
      probabilityTrue: 0.18,
      evidenceStrength: 0.22,
      reasoningSummary: 'No primary source evidence supports this accelerated timeline. SEC communications indicate no imminent decision. Anonymous claim with no corroborating evidence.',
      invalidationTriggers: 'Official SEC announcement of approval within the claimed timeframe.',
    },
    evidence: [
      { id: 'ev-4', url: 'https://twitter.com/whale/123', publisher: 'Crypto Whale', grade: 'D', stance: 'supports', excerpt: 'My source at [redacted] confirms approval coming this week. Trust me on this one...' },
      { id: 'ev-5', url: 'https://sec.gov/statement', publisher: 'SEC', grade: 'A', stance: 'contradicts', excerpt: 'The Commission has not set a definitive timeline for ETF application decisions...' },
    ],
  },
  {
    id: 'claim-3',
    sourceId: 'the-block',
    claimText: 'Nexus Protocol lost approximately $45 million in a smart contract exploit via reentrancy vulnerability',
    claimType: 'exploit_or_hack',
    assetSymbols: ['NEXUS', 'ETH'],
    assertedAt: '2024-01-15T08:00:00Z',
    resolutionType: 'immediate',
    falsifiabilityScore: 0.98,
    llmConfidence: 0.95,
    status: 'resolved',
    verdict: {
      verdictLabel: 'verified',
      probabilityTrue: 0.97,
      evidenceStrength: 0.95,
      reasoningSummary: 'On-chain transaction data confirms fund movement from protocol contracts. Official team acknowledgment. Security researchers independently verified the reentrancy attack vector.',
      invalidationTriggers: 'Protocol clarification that funds are safe or evidence of transaction reversal.',
    },
    evidence: [
      { id: 'ev-6', url: 'https://etherscan.io/tx/0xabc123', publisher: 'Etherscan', grade: 'A', stance: 'supports', excerpt: 'Transaction shows transfer of 15,000 ETH from Nexus contract to unknown wallet in single block...' },
      { id: 'ev-7', url: 'https://twitter.com/NexusProtocol', publisher: 'Nexus Protocol', grade: 'A', stance: 'supports', excerpt: 'We are aware of a security incident affecting our smart contracts. Investigation ongoing. Funds have been moved.' },
      { id: 'ev-8', url: 'https://theblock.co/exploit', publisher: 'The Block', grade: 'B', stance: 'supports', excerpt: 'Security researchers at PeckShield confirm the exploit utilized a classic reentrancy vulnerability in the withdraw function...' },
    ],
    resolution: { outcome: 'true', resolvedAt: '2024-01-15T12:00:00Z', notes: 'Protocol confirmed exploit; funds not recovered' },
  },
  {
    id: 'claim-4',
    sourceId: 'defi-alpha',
    claimText: 'Arbitrum preparing massive airdrop for active users, launching next week',
    claimType: 'rumor',
    assetSymbols: ['ARB'],
    assertedAt: '2024-01-13T16:00:00Z',
    resolveBy: '2024-01-20T23:59:00Z',
    resolutionType: 'scheduled',
    falsifiabilityScore: 0.6,
    llmConfidence: 0.15,
    status: 'reviewed',
    verdict: {
      verdictLabel: 'speculative',
      probabilityTrue: 0.12,
      evidenceStrength: 0.15,
      reasoningSummary: 'No official announcement from Arbitrum Foundation. Anonymous source with poor track record. Previous similar claims from this channel have failed to materialize.',
      invalidationTriggers: 'Official Arbitrum Foundation announcement confirming airdrop details.',
    },
    evidence: [
      { id: 'ev-9', url: 'https://t.me/defialpha/789', publisher: 'DeFi Alpha Leaks', grade: 'D', stance: 'supports', excerpt: 'Insider info: ARB team finalizing massive airdrop. Get your wallets ready...' },
    ],
  },
  {
    id: 'claim-5',
    sourceId: 'reuters',
    claimText: 'The European Central Bank has advanced the Digital Euro project to its preparation phase, with potential launch by 2027',
    claimType: 'regulatory_action',
    assetSymbols: ['EUR'],
    assertedAt: '2024-01-12T09:00:00Z',
    resolutionType: 'immediate',
    falsifiabilityScore: 0.92,
    llmConfidence: 0.94,
    status: 'resolved',
    verdict: {
      verdictLabel: 'verified',
      probabilityTrue: 0.96,
      evidenceStrength: 0.94,
      reasoningSummary: 'Official ECB press release confirms preparation phase advancement. Named ECB officials quoted on 2027 timeline. Multiple primary sources in agreement.',
      invalidationTriggers: 'ECB retraction or policy reversal announcement.',
    },
    evidence: [
      { id: 'ev-10', url: 'https://ecb.europa.eu/press', publisher: 'ECB', grade: 'A', stance: 'supports', excerpt: 'The Governing Council has decided to advance the digital euro project to its preparation phase...' },
      { id: 'ev-11', url: 'https://reuters.com/ecb-cbdc', publisher: 'Reuters', grade: 'B', stance: 'supports', excerpt: 'ECB President Lagarde confirmed the 2027 target during press conference, citing regulatory framework completion...' },
    ],
    resolution: { outcome: 'true', resolvedAt: '2024-01-12T11:00:00Z' },
  },
  {
    id: 'claim-6',
    sourceId: 'cointelegraph',
    claimText: 'Bitcoin will reach $150,000 following the halving event in 2024',
    claimType: 'price_prediction',
    assetSymbols: ['BTC'],
    assertedAt: '2024-01-14T14:00:00Z',
    resolutionType: 'indefinite',
    falsifiabilityScore: 0.35,
    llmConfidence: 0.3,
    status: 'reviewed',
    verdict: {
      verdictLabel: 'speculative',
      probabilityTrue: 0.25,
      evidenceStrength: 0.2,
      reasoningSummary: 'Price predictions are inherently speculative. Historical halving data shows varied outcomes. No methodology or evidence supports the specific $150K target.',
      invalidationTriggers: 'This prediction will be resolved by market price movement over time.',
    },
    evidence: [
      { id: 'ev-12', url: 'https://cointelegraph.com/prediction', publisher: 'Cointelegraph', grade: 'C', stance: 'supports', excerpt: 'Analysts predict BTC could reach new highs post-halving based on supply reduction mechanics...' },
    ],
  },
];
