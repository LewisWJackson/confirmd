/**
 * Evidence Retrieval Service
 * Retrieves and grades evidence for claims
 * Supports multiple search backends
 */

import type { Claim, EvidenceItem, EvidenceGrade, EvidenceStance } from '../models/types';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  MAX_RESULTS: 15,
  CACHE_TTL_MINUTES: 60,
  PRIMARY_DOMAINS: [
    // Regulators
    'sec.gov',
    'cftc.gov',
    'treasury.gov',
    'federalreserve.gov',
    'bis.org',
    'fca.org.uk',
    // Exchanges (official)
    'binance.com/en/support',
    'coinbase.com/blog',
    'kraken.com/features',
    'exchange.gemini.com',
    // Blockchain explorers
    'etherscan.io',
    'blockchain.com',
    'solscan.io',
    // Official project domains
    'ethereum.org',
    'bitcoin.org',
    'solana.com',
  ],
  STRONG_SECONDARY_DOMAINS: [
    'bloomberg.com',
    'reuters.com',
    'wsj.com',
    'ft.com',
    'theblock.co',
    'coindesk.com',
  ],
  WEAK_SECONDARY_DOMAINS: [
    'cointelegraph.com',
    'decrypt.co',
    'cryptoslate.com',
    'newsbtc.com',
    'beincrypto.com',
  ],
};

// ============================================
// EVIDENCE GRADING
// ============================================

/**
 * Determine evidence grade based on source domain
 */
function gradeEvidence(url: string, publisher?: string): EvidenceGrade {
  const domain = extractDomain(url).toLowerCase();
  const pub = (publisher || '').toLowerCase();

  // Check for primary/authoritative sources
  if (CONFIG.PRIMARY_DOMAINS.some(d => domain.includes(d) || pub.includes(d))) {
    return 'A';
  }

  // Check for strong secondary sources
  if (CONFIG.STRONG_SECONDARY_DOMAINS.some(d => domain.includes(d) || pub.includes(d))) {
    return 'B';
  }

  // Check for weak secondary sources
  if (CONFIG.WEAK_SECONDARY_DOMAINS.some(d => domain.includes(d) || pub.includes(d))) {
    return 'C';
  }

  // Social media and anonymous sources
  if (
    domain.includes('twitter.com') ||
    domain.includes('x.com') ||
    domain.includes('t.me') ||
    domain.includes('discord') ||
    domain.includes('reddit.com') ||
    domain.includes('4chan')
  ) {
    return 'D';
  }

  // Default to weak secondary
  return 'C';
}

/**
 * Determine stance from excerpt content
 */
function determineStance(excerpt: string, claimText: string): EvidenceStance {
  const text = excerpt.toLowerCase();
  const claim = claimText.toLowerCase();

  // Keywords that suggest contradiction
  const contradictKeywords = [
    'denied', 'refuted', 'false', 'incorrect', 'misleading',
    'not true', 'debunked', 'no evidence', 'unconfirmed',
    'contrary to', 'disputes', 'rejects', 'disproves'
  ];

  // Keywords that suggest support
  const supportKeywords = [
    'confirmed', 'verified', 'announced', 'official',
    'according to', 'states that', 'proves', 'validates',
    'evidence shows', 'data confirms', 'reported'
  ];

  // Check for contradiction
  if (contradictKeywords.some(k => text.includes(k))) {
    return 'contradicts';
  }

  // Check for support
  if (supportKeywords.some(k => text.includes(k))) {
    return 'supports';
  }

  // Check for mere mention
  const claimKeywords = claim.split(' ').filter(w => w.length > 4);
  const mentionCount = claimKeywords.filter(k => text.includes(k)).length;

  if (mentionCount >= 2) {
    return 'mentions';
  }

  return 'irrelevant';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ============================================
// SEARCH QUERY BUILDING
// ============================================

/**
 * Build search queries for a claim
 */
function buildSearchQueries(claim: Claim): string[] {
  const queries: string[] = [];

  // Primary query: the claim text itself
  queries.push(claim.claimText);

  // Asset-specific query
  if (claim.assetSymbols.length > 0) {
    queries.push(`${claim.assetSymbols.join(' ')} ${claim.claimText.slice(0, 100)}`);
  }

  // Type-specific query
  const typeQueries: Record<string, string[]> = {
    'filing_submitted': ['SEC filing', 'ETF application'],
    'filing_approved_or_denied': ['SEC approval', 'ETF decision'],
    'regulatory_action': ['SEC lawsuit', 'CFTC enforcement'],
    'listing_announced': ['exchange listing', 'new trading pair'],
    'exploit_or_hack': ['DeFi exploit', 'funds stolen', 'security breach'],
    'mainnet_launch': ['mainnet launch', 'network upgrade'],
    'partnership_announced': ['partnership announcement', 'collaboration'],
  };

  if (typeQueries[claim.claimType]) {
    typeQueries[claim.claimType].forEach(tq => {
      queries.push(`${tq} ${claim.assetSymbols[0] || ''}`);
    });
  }

  return queries.slice(0, 3); // Limit to 3 queries
}

// ============================================
// MOCK SEARCH RESULTS
// ============================================

/**
 * Simulate search results for demo
 */
function simulateSearchResults(claim: Claim): EvidenceItem[] {
  const now = new Date();
  const results: EvidenceItem[] = [];

  // Determine claim theme
  const claimLower = claim.claimText.toLowerCase();

  // Generate mock evidence based on claim type
  if (claim.claimType === 'filing_approved_or_denied' || claimLower.includes('etf')) {
    results.push(
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://www.sec.gov/news/press-release/2024-example',
        publisher: 'SEC',
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        retrievedAt: now,
        excerpt: 'The Securities and Exchange Commission today announced...',
        stance: 'mentions',
        evidenceGrade: 'A',
        primaryFlag: true,
        metadata: {},
      },
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://www.bloomberg.com/news/articles/crypto-etf',
        publisher: 'Bloomberg',
        publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        retrievedAt: now,
        excerpt: 'According to sources familiar with the matter, the SEC is reviewing multiple ETF applications...',
        stance: 'supports',
        evidenceGrade: 'B',
        primaryFlag: false,
        metadata: {},
      },
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://www.coindesk.com/etf-analysis',
        publisher: 'CoinDesk',
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        retrievedAt: now,
        excerpt: 'Industry analysts believe the ETF approval could come as early as next month...',
        stance: 'supports',
        evidenceGrade: 'B',
        primaryFlag: false,
        metadata: {},
      }
    );
  }

  if (claim.claimType === 'exploit_or_hack' || claimLower.includes('hack')) {
    results.push(
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://etherscan.io/tx/0xabc123',
        publisher: 'Etherscan',
        publishedAt: now,
        retrievedAt: now,
        excerpt: 'Transaction shows 45,000 ETH transferred from protocol contract to unknown wallet...',
        stance: 'supports',
        evidenceGrade: 'A',
        primaryFlag: true,
        metadata: { txHash: '0xabc123' },
      },
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://twitter.com/protocol_official/status/123',
        publisher: 'Protocol Official',
        publishedAt: now,
        retrievedAt: now,
        excerpt: 'We are aware of an incident affecting our smart contracts. Investigation ongoing.',
        stance: 'supports',
        evidenceGrade: 'A',
        primaryFlag: true,
        metadata: {},
      },
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://theblock.co/post/security-incident',
        publisher: 'The Block',
        publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        retrievedAt: now,
        excerpt: 'Security researchers have confirmed the exploit utilized a reentrancy vulnerability...',
        stance: 'supports',
        evidenceGrade: 'B',
        primaryFlag: false,
        metadata: {},
      }
    );
  }

  if (claim.claimType === 'listing_announced' || claimLower.includes('list')) {
    results.push(
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://www.binance.com/en/support/announcement/new-listing',
        publisher: 'Binance',
        publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        retrievedAt: now,
        excerpt: 'Binance will list [TOKEN] in the Innovation Zone on [DATE]...',
        stance: 'supports',
        evidenceGrade: 'A',
        primaryFlag: true,
        metadata: {},
      },
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://cointelegraph.com/news/new-listing',
        publisher: 'Cointelegraph',
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        retrievedAt: now,
        excerpt: 'The token will be available for trading starting...',
        stance: 'supports',
        evidenceGrade: 'C',
        primaryFlag: false,
        metadata: {},
      }
    );
  }

  // Add some speculative sources
  if (claim.claimType === 'rumor' || claim.claimType === 'price_prediction') {
    results.push(
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://twitter.com/crypto_whale/status/456',
        publisher: 'Crypto Whale',
        publishedAt: now,
        retrievedAt: now,
        excerpt: 'My sources say this is happening. Trust me bro.',
        stance: 'supports',
        evidenceGrade: 'D',
        primaryFlag: false,
        metadata: {},
      },
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://t.me/alpha_group/789',
        publisher: 'Telegram Alpha',
        publishedAt: now,
        retrievedAt: now,
        excerpt: 'Insider info suggests major announcement coming...',
        stance: 'supports',
        evidenceGrade: 'D',
        primaryFlag: false,
        metadata: {},
      }
    );
  }

  // Default fallback evidence
  if (results.length === 0) {
    results.push(
      {
        id: generateId(),
        claimId: claim.id,
        url: 'https://decrypt.co/news/general',
        publisher: 'Decrypt',
        publishedAt: now,
        retrievedAt: now,
        excerpt: 'Market participants are discussing various unconfirmed reports...',
        stance: 'mentions',
        evidenceGrade: 'C',
        primaryFlag: false,
        metadata: {},
      }
    );
  }

  return results;
}

// ============================================
// MAIN RETRIEVAL FUNCTION
// ============================================

export interface RetrievalProvider {
  search: (query: string, options?: { domains?: string[] }) => Promise<SearchResult[]>;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  publishedAt?: Date;
}

/**
 * Retrieve evidence for a claim
 */
export async function retrieveEvidence(
  claim: Claim,
  provider?: RetrievalProvider
): Promise<EvidenceItem[]> {
  const results: EvidenceItem[] = [];

  if (provider) {
    // Use real search provider
    const queries = buildSearchQueries(claim);

    for (const query of queries) {
      try {
        const searchResults = await provider.search(query, {
          domains: CONFIG.PRIMARY_DOMAINS,
        });

        for (const sr of searchResults) {
          const grade = gradeEvidence(sr.url);
          const stance = determineStance(sr.snippet, claim.claimText);

          results.push({
            id: generateId(),
            claimId: claim.id,
            url: sr.url,
            publisher: extractDomain(sr.url),
            publishedAt: sr.publishedAt,
            retrievedAt: new Date(),
            excerpt: sr.snippet,
            stance,
            evidenceGrade: grade,
            primaryFlag: grade === 'A',
            metadata: { query },
          });
        }
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error);
      }
    }
  } else {
    // Use simulated results for demo
    return simulateSearchResults(claim);
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduplicated = results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Sort by grade (A first) then by date
  deduplicated.sort((a, b) => {
    const gradeOrder = { A: 0, B: 1, C: 2, D: 3 };
    const gradeDiff = gradeOrder[a.evidenceGrade] - gradeOrder[b.evidenceGrade];
    if (gradeDiff !== 0) return gradeDiff;

    const dateA = a.publishedAt?.getTime() || 0;
    const dateB = b.publishedAt?.getTime() || 0;
    return dateB - dateA;
  });

  return deduplicated.slice(0, CONFIG.MAX_RESULTS);
}

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export { CONFIG as RETRIEVAL_CONFIG };
