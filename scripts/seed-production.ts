/**
 * Production seed script for Confirmd sources, source scores, and creators.
 *
 * Idempotent: safe to run multiple times.
 *   - Upserts all 13 sources (inserts if missing, updates logoUrl/metadata if existing)
 *   - Upserts source scores for each source (inserts if missing, updates if existing)
 *   - Upserts 15 crypto YouTube creators with videos, claims, and scores
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/seed-production.ts
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import {
  sources,
  sourceScores,
  creators,
  creatorVideos,
  creatorClaims,
  creatorScores,
} from "../shared/schema.js";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Source definitions (mirrors seedInitialData in server/storage.ts)
// ---------------------------------------------------------------------------

const SOURCE_DATA = [
  {
    type: "regulator" as const,
    handleOrDomain: "sec.gov",
    displayName: "SEC",
    logoUrl: "https://www.google.com/s2/favicons?domain=sec.gov&sz=128",
    metadata: { description: "U.S. Securities and Exchange Commission" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "reuters.com",
    displayName: "Reuters",
    logoUrl: "https://www.google.com/s2/favicons?domain=reuters.com&sz=128",
    metadata: { description: "Global news wire service" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "bloomberg.com",
    displayName: "Bloomberg Crypto",
    logoUrl: "https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128",
    metadata: { description: "Bloomberg digital asset coverage" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "theblock.co",
    displayName: "The Block",
    logoUrl: "https://www.google.com/s2/favicons?domain=theblock.co&sz=128",
    metadata: { description: "Crypto research and journalism" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "coindesk.com",
    displayName: "CoinDesk",
    logoUrl: "https://www.google.com/s2/favicons?domain=coindesk.com&sz=128",
    metadata: { description: "Crypto news and media" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "cointelegraph.com",
    displayName: "Cointelegraph",
    logoUrl: "https://www.google.com/s2/favicons?domain=cointelegraph.com&sz=128",
    metadata: { description: "Crypto and blockchain media" },
  },
  {
    type: "x_handle" as const,
    handleOrDomain: "@CryptoWhale",
    displayName: "Crypto Whale",
    logoUrl: "https://www.google.com/s2/favicons?domain=x.com&sz=128",
    metadata: { description: "Anonymous crypto Twitter personality" },
  },
  {
    type: "telegram" as const,
    handleOrDomain: "t.me/defialpha",
    displayName: "DeFi Alpha Leaks",
    logoUrl: "https://www.google.com/s2/favicons?domain=telegram.org&sz=128",
    metadata: { description: "Anonymous DeFi alpha Telegram channel" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "cryptoslate.com",
    displayName: "CryptoSlate",
    logoUrl: "https://www.google.com/s2/favicons?domain=cryptoslate.com&sz=128",
    metadata: { description: "Crypto news and data" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "thedefiant.io",
    displayName: "The Defiant",
    logoUrl: "https://www.google.com/s2/favicons?domain=thedefiant.io&sz=128",
    metadata: { description: "DeFi news and analysis" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "blockworks.co",
    displayName: "Blockworks",
    logoUrl: "https://www.google.com/s2/favicons?domain=blockworks.co&sz=128",
    metadata: { description: "Crypto and blockchain news" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "dlnews.com",
    displayName: "DL News",
    logoUrl: "https://www.google.com/s2/favicons?domain=dlnews.com&sz=128",
    metadata: { description: "Digital asset news" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "unchainedcrypto.com",
    displayName: "Unchained",
    logoUrl: "https://www.google.com/s2/favicons?domain=unchainedcrypto.com&sz=128",
    metadata: { description: "Crypto news and podcasts" },
  },
];

// Score data keyed by handleOrDomain (mirrors seedInitialData)
const SCORE_DATA: Record<
  string,
  { trackRecord: number; methodDiscipline: number; sampleSize: number; ci: { lower: number; upper: number } }
> = {
  "sec.gov":            { trackRecord: 98, methodDiscipline: 99, sampleSize: 45,  ci: { lower: 95, upper: 100 } },
  "reuters.com":        { trackRecord: 91, methodDiscipline: 94, sampleSize: 203, ci: { lower: 88, upper: 94  } },
  "bloomberg.com":      { trackRecord: 89, methodDiscipline: 92, sampleSize: 156, ci: { lower: 85, upper: 93  } },
  "theblock.co":        { trackRecord: 82, methodDiscipline: 85, sampleSize: 189, ci: { lower: 78, upper: 86  } },
  "coindesk.com":       { trackRecord: 76, methodDiscipline: 78, sampleSize: 234, ci: { lower: 72, upper: 80  } },
  "cointelegraph.com":  { trackRecord: 58, methodDiscipline: 52, sampleSize: 312, ci: { lower: 54, upper: 62  } },
  "@CryptoWhale":       { trackRecord: 34, methodDiscipline: 22, sampleSize: 89,  ci: { lower: 28, upper: 40  } },
  "t.me/defialpha":     { trackRecord: 28, methodDiscipline: 18, sampleSize: 67,  ci: { lower: 20, upper: 36  } },
  "cryptoslate.com":    { trackRecord: 68, methodDiscipline: 72, sampleSize: 150, ci: { lower: 64, upper: 72  } },
  "thedefiant.io":      { trackRecord: 75, methodDiscipline: 78, sampleSize: 120, ci: { lower: 71, upper: 79  } },
  "blockworks.co":      { trackRecord: 80, methodDiscipline: 82, sampleSize: 140, ci: { lower: 76, upper: 84  } },
  "dlnews.com":         { trackRecord: 74, methodDiscipline: 76, sampleSize: 100, ci: { lower: 70, upper: 78  } },
  "unchainedcrypto.com": { trackRecord: 78, methodDiscipline: 80, sampleSize: 110, ci: { lower: 74, upper: 82  } },
};

// ---------------------------------------------------------------------------
// Creator definitions — 15 crypto YouTube creators
// ---------------------------------------------------------------------------

const CREATOR_DATA = [
  // --- XRP Creators (from ClaimVault) ---
  {
    youtubeChannelId: "UCia6oYbLKo8fLOguATpACmA",
    channelHandle: "@BlockchainBacker",
    channelName: "Blockchain Backer",
    channelUrl: "https://youtube.com/channel/UCia6oYbLKo8fLOguATpACmA",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_l12A6K1uDqbNt4LhXqmwtHw_Q9m9hpOksH1StlsZUMkg=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 400000,
    description: "Chart-focused XRP/crypto price insights. Known for detailed technical analysis and historical pattern comparisons.",
    primaryNiche: "XRP",
    trackingSince: new Date("2024-04-01"),
    overallAccuracy: 38.6,
    totalClaims: 60,
    verifiedTrue: 35,
    verifiedFalse: 8,
    pendingClaims: 17,
    tier: "unranked" as const,
    rankOverall: 14,
    rankChange: -13,
    currentSentiment: "bullish",
    priceAccuracy: 78, timelineAccuracy: 72, regulatoryAccuracy: 80,
    partnershipAccuracy: 75, technologyAccuracy: 85, marketAccuracy: 90,
    videos: [
      { youtubeVideoId: "bb_xrp_chart_01", title: "XRP Chart Breakout Analysis — February 2026", publishedAt: new Date("2026-01-28"), durationSeconds: 1845, viewCount: 89000, thumbnailUrl: "https://i.ytimg.com/vi/bb_xrp_chart_01/maxresdefault.jpg" },
      { youtubeVideoId: "bb_cycle_top_02", title: "When Does the Crypto Cycle Top? My Updated Model", publishedAt: new Date("2026-01-15"), durationSeconds: 2100, viewCount: 142000, thumbnailUrl: "https://i.ytimg.com/vi/bb_cycle_top_02/maxresdefault.jpg" },
      { youtubeVideoId: "bb_btc_dom_03", title: "Bitcoin Dominance Dropping — Altseason Signal?", publishedAt: new Date("2026-02-02"), durationSeconds: 1560, viewCount: 67000, thumbnailUrl: "https://i.ytimg.com/vi/bb_btc_dom_03/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "XRP will reach $5 before the end of Q1 2026 based on historical cycle patterns", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "Q1 2026", assetSymbols: ["XRP"], specificityScore: 9, aiExtractionConfidence: 0.92 },
      { claimText: "Bitcoin dominance will drop below 40% this cycle, triggering major alt season", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["BTC"], specificityScore: 8, aiExtractionConfidence: 0.88 },
      { claimText: "The 4-year cycle pattern suggests crypto market peaks in mid-2026", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "mid-2026", assetSymbols: ["BTC", "XRP"], specificityScore: 7, aiExtractionConfidence: 0.85 },
      { claimText: "XRP's weekly chart mirrors the 2017 pre-breakout pattern almost exactly", category: "technical_analysis" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: null, assetSymbols: ["XRP"], specificityScore: 6, aiExtractionConfidence: 0.90 },
    ],
  },
  {
    youtubeChannelId: "UCtQycmSrKdJ0zE0bWumO4vA",
    channelHandle: "@digitalassetinvestor",
    channelName: "Digital Asset Investor",
    channelUrl: "https://youtube.com/channel/UCtQycmSrKdJ0zE0bWumO4vA",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_lSPhW-zQLrGdGDoL04H1L2iT_vSROJB5It6q_nF5vwrlE=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 218000,
    description: "Frequent XRP analysis within wider market context. Covers regulations, Ripple news, and institutional crypto.",
    primaryNiche: "XRP",
    trackingSince: new Date("2024-05-01"),
    overallAccuracy: 48.6,
    totalClaims: 55,
    verifiedTrue: 25,
    verifiedFalse: 10,
    pendingClaims: 20,
    tier: "unranked" as const,
    rankOverall: 11,
    rankChange: -8,
    currentSentiment: "bullish",
    priceAccuracy: 60, timelineAccuracy: 55, regulatoryAccuracy: 88,
    partnershipAccuracy: 78, technologyAccuracy: 72, marketAccuracy: 68,
    videos: [
      { youtubeVideoId: "dai_ripple_01", title: "Ripple IPO Rumors Are REAL — What It Means for XRP", publishedAt: new Date("2026-01-22"), durationSeconds: 1320, viewCount: 95000, thumbnailUrl: "https://i.ytimg.com/vi/dai_ripple_01/maxresdefault.jpg" },
      { youtubeVideoId: "dai_sec_02", title: "SEC Settlement Final? XRP Legal Update", publishedAt: new Date("2026-02-01"), durationSeconds: 1680, viewCount: 112000, thumbnailUrl: "https://i.ytimg.com/vi/dai_sec_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Ripple will file for IPO in 2026 following SEC settlement", category: "partnership" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["XRP"], specificityScore: 8, aiExtractionConfidence: 0.85 },
      { claimText: "XRP utility in cross-border payments will drive price independent of BTC", category: "market_prediction" as const, status: "partially_true" as const, confidenceLanguage: "medium" as const, statedTimeframe: null, assetSymbols: ["XRP"], specificityScore: 5, aiExtractionConfidence: 0.80 },
      { claimText: "Major banks will announce XRP corridor usage by end of 2025", category: "partnership" as const, status: "verified_false" as const, confidenceLanguage: "strong" as const, statedTimeframe: "end of 2025", assetSymbols: ["XRP"], specificityScore: 8, aiExtractionConfidence: 0.90 },
    ],
  },
  {
    youtubeChannelId: "UCjpkwsuHgYx9fBE0ojsJ_-w",
    channelHandle: "@thinkingcrypto",
    channelName: "Thinking Crypto",
    channelUrl: "https://youtube.com/@thinkingcrypto",
    avatarUrl: "https://yt3.googleusercontent.com/Wy4q7Us9fNb5fF2onjagA-c-ROwTcB9qsU2QhhBA8X6T5jmQ559FuUfW99G62xGOUeZ-bdgr=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 125000,
    description: "Crypto news channel with regular XRP coverage. Podcast format with industry interviews.",
    primaryNiche: "XRP",
    trackingSince: new Date("2024-05-15"),
    overallAccuracy: 61.3,
    totalClaims: 36,
    verifiedTrue: 19,
    verifiedFalse: 7,
    pendingClaims: 10,
    tier: "silver" as const,
    rankOverall: 4,
    rankChange: 1,
    currentSentiment: "bullish",
    priceAccuracy: 62, timelineAccuracy: 60, regulatoryAccuracy: 90,
    partnershipAccuracy: 75, technologyAccuracy: 78, marketAccuracy: 70,
    videos: [
      { youtubeVideoId: "tc_reg_01", title: "Crypto Regulation Update — What Congress Is Planning", publishedAt: new Date("2026-01-20"), durationSeconds: 2400, viewCount: 78000, thumbnailUrl: "https://i.ytimg.com/vi/tc_reg_01/maxresdefault.jpg" },
      { youtubeVideoId: "tc_etf_02", title: "XRP ETF Filing Deep Dive with Industry Expert", publishedAt: new Date("2026-02-03"), durationSeconds: 3200, viewCount: 105000, thumbnailUrl: "https://i.ytimg.com/vi/tc_etf_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "XRP ETF will be approved by mid-2026 based on regulatory trajectory", category: "etf_approval" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "mid-2026", assetSymbols: ["XRP"], specificityScore: 8, aiExtractionConfidence: 0.88 },
      { claimText: "Stablecoin legislation will pass in the US by Q2 2026", category: "regulatory" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "Q2 2026", assetSymbols: [], specificityScore: 7, aiExtractionConfidence: 0.82 },
      { claimText: "The SEC will drop remaining Ripple appeal attempts", category: "regulatory" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "2025", assetSymbols: ["XRP"], specificityScore: 9, aiExtractionConfidence: 0.95 },
    ],
  },
  {
    youtubeChannelId: "UCf3Vlkhhxrwr3A8IYN8KVkw",
    channelHandle: "@MoonLambo",
    channelName: "Moon Lambo",
    channelUrl: "https://youtube.com/channel/UCf3Vlkhhxrwr3A8IYN8KVkw",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_kMiQ5FnabGiCZgr4n9YYCy4kjx2F1h_CJ9O9cg-L39cmg=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 173000,
    description: "XRP regulatory/legal focus and community updates. Known for balanced, research-based analysis.",
    primaryNiche: "XRP",
    trackingSince: new Date("2024-05-01"),
    overallAccuracy: 50.0,
    totalClaims: 35,
    verifiedTrue: 18,
    verifiedFalse: 8,
    pendingClaims: 9,
    tier: "bronze" as const,
    rankOverall: 10,
    rankChange: -5,
    currentSentiment: "bullish",
    priceAccuracy: 58, timelineAccuracy: 55, regulatoryAccuracy: 88,
    partnershipAccuracy: 72, technologyAccuracy: 75, marketAccuracy: 68,
    videos: [
      { youtubeVideoId: "ml_etf_01", title: "XRP ETF — When, Not If", publishedAt: new Date("2026-01-25"), durationSeconds: 1450, viewCount: 88000, thumbnailUrl: "https://i.ytimg.com/vi/ml_etf_01/maxresdefault.jpg" },
      { youtubeVideoId: "ml_reg_02", title: "Regulatory Clarity Is Here — XRP's Next Chapter", publishedAt: new Date("2026-02-04"), durationSeconds: 1200, viewCount: 71000, thumbnailUrl: "https://i.ytimg.com/vi/ml_reg_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "XRP ETF approval is a matter of when not if, likely 2026", category: "etf_approval" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "2026", assetSymbols: ["XRP"], specificityScore: 6, aiExtractionConfidence: 0.85 },
      { claimText: "XRP price will benefit from regulatory clarity more than any other altcoin", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: null, assetSymbols: ["XRP"], specificityScore: 5, aiExtractionConfidence: 0.78 },
      { claimText: "Ripple acquired Hidden Road to expand institutional reach", category: "partnership_adoption" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: null, assetSymbols: ["XRP"], specificityScore: 9, aiExtractionConfidence: 0.95 },
    ],
  },
  {
    youtubeChannelId: "UCeBbEvlSOeJMwSVYOdXOvvw",
    channelHandle: "@coinskid",
    channelName: "CoinsKid",
    channelUrl: "https://youtube.com/@coinskid",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_l0v2IPL8U5r9G1zLEFIqXpKs6VvgCxTCMB3isDr-QKK84=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 274000,
    description: "Daily XRP and crypto news, often XRP-centric coverage.",
    primaryNiche: "XRP",
    trackingSince: new Date("2024-06-01"),
    overallAccuracy: 58.5,
    totalClaims: 42,
    verifiedTrue: 18,
    verifiedFalse: 12,
    pendingClaims: 12,
    tier: "bronze" as const,
    rankOverall: 7,
    rankChange: -3,
    currentSentiment: "bullish",
    priceAccuracy: 55, timelineAccuracy: 45, regulatoryAccuracy: 82,
    partnershipAccuracy: 70, technologyAccuracy: 75, marketAccuracy: 60,
    videos: [
      { youtubeVideoId: "ck_daily_01", title: "XRP Daily Update — Massive Volume Incoming", publishedAt: new Date("2026-02-05"), durationSeconds: 980, viewCount: 45000, thumbnailUrl: "https://i.ytimg.com/vi/ck_daily_01/maxresdefault.jpg" },
      { youtubeVideoId: "ck_news_02", title: "XRP News: RLUSD Adoption Growing Fast", publishedAt: new Date("2026-01-30"), durationSeconds: 1100, viewCount: 62000, thumbnailUrl: "https://i.ytimg.com/vi/ck_news_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "XRP will see massive volume spike once ETF is approved", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: null, assetSymbols: ["XRP"], specificityScore: 5, aiExtractionConfidence: 0.80 },
      { claimText: "RLUSD will become a top-5 stablecoin by market cap in 2026", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["XRP"], specificityScore: 7, aiExtractionConfidence: 0.82 },
      { claimText: "XRP broke above $2.50 resistance in January 2026", category: "technical_analysis" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "January 2026", assetSymbols: ["XRP"], specificityScore: 9, aiExtractionConfidence: 0.95 },
    ],
  },

  // --- General Crypto Creators ---
  {
    youtubeChannelId: "UCqK_GSMbpiV8spgD3ZGloSw",
    channelHandle: "@CoinBureau",
    channelName: "Coin Bureau",
    channelUrl: "https://youtube.com/@CoinBureau",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_nM3xTS3aLPknGoFjSsGAxRKmzVlDkRnQWoYSKPu-hCHJQ=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 2500000,
    description: "One of the largest crypto education channels. In-depth reviews, market analysis, and project breakdowns.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-06-01"),
    overallAccuracy: 72.4,
    totalClaims: 48,
    verifiedTrue: 28,
    verifiedFalse: 6,
    pendingClaims: 14,
    tier: "gold" as const,
    rankOverall: 1,
    rankChange: 2,
    currentSentiment: "bullish",
    priceAccuracy: 70, timelineAccuracy: 68, regulatoryAccuracy: 85,
    partnershipAccuracy: 80, technologyAccuracy: 88, marketAccuracy: 75,
    videos: [
      { youtubeVideoId: "cb_top10_01", title: "Top 10 Altcoins for 2026 — My Portfolio Picks", publishedAt: new Date("2026-01-10"), durationSeconds: 2800, viewCount: 1200000, thumbnailUrl: "https://i.ytimg.com/vi/cb_top10_01/maxresdefault.jpg" },
      { youtubeVideoId: "cb_eth_02", title: "Ethereum's Pectra Upgrade — Everything You Need to Know", publishedAt: new Date("2026-01-25"), durationSeconds: 2200, viewCount: 680000, thumbnailUrl: "https://i.ytimg.com/vi/cb_eth_02/maxresdefault.jpg" },
      { youtubeVideoId: "cb_btc_03", title: "Bitcoin to $200K? Analyzing the Bull Case", publishedAt: new Date("2026-02-01"), durationSeconds: 1950, viewCount: 890000, thumbnailUrl: "https://i.ytimg.com/vi/cb_btc_03/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Bitcoin will reach $200K in this cycle, likely by end of 2026", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "end of 2026", assetSymbols: ["BTC"], specificityScore: 9, aiExtractionConfidence: 0.90 },
      { claimText: "Ethereum will outperform Bitcoin in H2 2026 after Pectra upgrade", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "H2 2026", assetSymbols: ["ETH", "BTC"], specificityScore: 7, aiExtractionConfidence: 0.85 },
      { claimText: "Solana ETF will be approved after Bitcoin and Ethereum ETFs", category: "etf_approval" as const, status: "pending" as const, confidenceLanguage: "weak" as const, statedTimeframe: "2026-2027", assetSymbols: ["SOL"], specificityScore: 6, aiExtractionConfidence: 0.80 },
      { claimText: "The SEC approved spot Bitcoin ETFs in January 2024", category: "regulatory" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "January 2024", assetSymbols: ["BTC"], specificityScore: 10, aiExtractionConfidence: 0.99 },
      { claimText: "Cardano would flip Solana in market cap by end of 2025", category: "market_prediction" as const, status: "verified_false" as const, confidenceLanguage: "weak" as const, statedTimeframe: "end of 2025", assetSymbols: ["ADA", "SOL"], specificityScore: 8, aiExtractionConfidence: 0.88 },
    ],
  },
  {
    youtubeChannelId: "UCRvqjQPSeaWn-uEx-w0XOIg",
    channelHandle: "@BenjaminCowen",
    channelName: "Benjamin Cowen",
    channelUrl: "https://youtube.com/@BenjaminCowen",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_nPFB2t3FWfUyJFcyAIUhJVtzaLmL_dqZzQn4BchB7TnA=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 810000,
    description: "Data-driven crypto analysis. PhD researcher known for risk metrics, lengthening cycle theory, and macro analysis.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-04-01"),
    overallAccuracy: 68.9,
    totalClaims: 52,
    verifiedTrue: 30,
    verifiedFalse: 9,
    pendingClaims: 13,
    tier: "gold" as const,
    rankOverall: 2,
    rankChange: 0,
    currentSentiment: "neutral",
    priceAccuracy: 72, timelineAccuracy: 65, regulatoryAccuracy: 70,
    partnershipAccuracy: 60, technologyAccuracy: 80, marketAccuracy: 85,
    videos: [
      { youtubeVideoId: "bc_risk_01", title: "Bitcoin Risk Metric Update — Where Are We in the Cycle?", publishedAt: new Date("2026-01-18"), durationSeconds: 1800, viewCount: 320000, thumbnailUrl: "https://i.ytimg.com/vi/bc_risk_01/maxresdefault.jpg" },
      { youtubeVideoId: "bc_eth_02", title: "ETH/BTC Ratio — The Moment of Truth", publishedAt: new Date("2026-02-02"), durationSeconds: 1500, viewCount: 250000, thumbnailUrl: "https://i.ytimg.com/vi/bc_eth_02/maxresdefault.jpg" },
      { youtubeVideoId: "bc_macro_03", title: "Fed Rate Cuts and Crypto — Macro Analysis", publishedAt: new Date("2026-01-28"), durationSeconds: 2100, viewCount: 410000, thumbnailUrl: "https://i.ytimg.com/vi/bc_macro_03/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Bitcoin's risk metric suggests we are still in mid-cycle, not near a top", category: "market_analysis" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "early 2026", assetSymbols: ["BTC"], specificityScore: 7, aiExtractionConfidence: 0.90 },
      { claimText: "ETH/BTC ratio will bottom and reverse in 2026 after years of decline", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["ETH", "BTC"], specificityScore: 7, aiExtractionConfidence: 0.85 },
      { claimText: "Fed rate cuts will be the primary catalyst for crypto's next leg up", category: "market_prediction" as const, status: "partially_true" as const, confidenceLanguage: "medium" as const, statedTimeframe: null, assetSymbols: ["BTC"], specificityScore: 5, aiExtractionConfidence: 0.82 },
      { claimText: "The lengthening cycle theory means this bull run extends into 2027", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "weak" as const, statedTimeframe: "2027", assetSymbols: ["BTC"], specificityScore: 6, aiExtractionConfidence: 0.78 },
    ],
  },
  {
    youtubeChannelId: "UCSlAkMOBJrCFB3Ayf3iZbhg",
    channelHandle: "@AltcoinDaily",
    channelName: "Altcoin Daily",
    channelUrl: "https://youtube.com/@AltcoinDaily",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_m0dRY3i2e_JzGApHiAh89f2D0dFCaQS0j6_tPwFR4cX1c=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 1400000,
    description: "Daily crypto news and altcoin coverage by the Austin brothers. High-energy market updates.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-07-01"),
    overallAccuracy: 52.1,
    totalClaims: 65,
    verifiedTrue: 22,
    verifiedFalse: 18,
    pendingClaims: 25,
    tier: "bronze" as const,
    rankOverall: 8,
    rankChange: -2,
    currentSentiment: "bullish",
    priceAccuracy: 48, timelineAccuracy: 42, regulatoryAccuracy: 72,
    partnershipAccuracy: 68, technologyAccuracy: 65, marketAccuracy: 58,
    videos: [
      { youtubeVideoId: "ad_altseason_01", title: "ALTSEASON IS HERE! Top Picks for February 2026", publishedAt: new Date("2026-02-03"), durationSeconds: 1400, viewCount: 520000, thumbnailUrl: "https://i.ytimg.com/vi/ad_altseason_01/maxresdefault.jpg" },
      { youtubeVideoId: "ad_sol_02", title: "Solana Update — Why SOL Could 5X", publishedAt: new Date("2026-01-22"), durationSeconds: 1200, viewCount: 380000, thumbnailUrl: "https://i.ytimg.com/vi/ad_sol_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Altseason will begin in February 2026 as Bitcoin dominance drops", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "February 2026", assetSymbols: ["BTC"], specificityScore: 7, aiExtractionConfidence: 0.82 },
      { claimText: "Solana will reach $500 in this bull cycle", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["SOL"], specificityScore: 8, aiExtractionConfidence: 0.80 },
      { claimText: "Cardano smart contract usage increased 300% in 2025", category: "technology" as const, status: "verified_false" as const, confidenceLanguage: "strong" as const, statedTimeframe: "2025", assetSymbols: ["ADA"], specificityScore: 8, aiExtractionConfidence: 0.85 },
      { claimText: "BlackRock Bitcoin ETF would see $10B inflows in first year", category: "market_prediction" as const, status: "verified_true" as const, confidenceLanguage: "medium" as const, statedTimeframe: "first year", assetSymbols: ["BTC"], specificityScore: 8, aiExtractionConfidence: 0.88 },
    ],
  },
  {
    youtubeChannelId: "UCjemQfjaXAzA-95RGoy1WNA",
    channelHandle: "@BenArmstrongsChannel",
    channelName: "Ben Armstrong",
    channelUrl: "https://youtube.com/@BenArmstrongsChannel",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_nDFU-k_eMNznCvE_0c6CQHG0j3MKcBJNSzlvxbhEJBYQ=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 1500000,
    description: "Formerly BitBoy Crypto. High-volume crypto content covering market trends, altcoins, and breaking news.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-08-01"),
    overallAccuracy: 35.2,
    totalClaims: 80,
    verifiedTrue: 18,
    verifiedFalse: 30,
    pendingClaims: 32,
    tier: "unranked" as const,
    rankOverall: 15,
    rankChange: -4,
    currentSentiment: "bullish",
    priceAccuracy: 30, timelineAccuracy: 25, regulatoryAccuracy: 55,
    partnershipAccuracy: 45, technologyAccuracy: 50, marketAccuracy: 40,
    videos: [
      { youtubeVideoId: "ba_100x_01", title: "This Altcoin Could 100X — Don't Miss It!", publishedAt: new Date("2026-01-28"), durationSeconds: 1100, viewCount: 650000, thumbnailUrl: "https://i.ytimg.com/vi/ba_100x_01/maxresdefault.jpg" },
      { youtubeVideoId: "ba_btc_02", title: "Bitcoin $300K Is PROGRAMMED — Here's Why", publishedAt: new Date("2026-02-05"), durationSeconds: 1350, viewCount: 480000, thumbnailUrl: "https://i.ytimg.com/vi/ba_btc_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Bitcoin will reach $300K in this cycle", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "this cycle", assetSymbols: ["BTC"], specificityScore: 8, aiExtractionConfidence: 0.78 },
      { claimText: "A specific unnamed altcoin will do 100X from January 2026 levels", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "2026", assetSymbols: [], specificityScore: 3, aiExtractionConfidence: 0.60 },
      { claimText: "Ethereum would flip Bitcoin by end of 2025", category: "market_prediction" as const, status: "verified_false" as const, confidenceLanguage: "strong" as const, statedTimeframe: "end of 2025", assetSymbols: ["ETH", "BTC"], specificityScore: 9, aiExtractionConfidence: 0.92 },
      { claimText: "Solana would fail and go to zero after FTX collapse", category: "price_prediction" as const, status: "verified_false" as const, confidenceLanguage: "strong" as const, statedTimeframe: null, assetSymbols: ["SOL"], specificityScore: 9, aiExtractionConfidence: 0.95 },
    ],
  },
  {
    youtubeChannelId: "UCkrLFImmV9U5RJVMh1RNbdg",
    channelHandle: "@CryptoBanterGroup",
    channelName: "Crypto Banter",
    channelUrl: "https://youtube.com/@CryptoBanterGroup",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_kIr_Yt2S5yvK2ELeI4r2YyqJGBcKp2pGI5DQPN82J8BA=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 700000,
    description: "Live crypto trading show. Daily market analysis, trading setups, and community engagement.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-07-01"),
    overallAccuracy: 55.8,
    totalClaims: 45,
    verifiedTrue: 20,
    verifiedFalse: 12,
    pendingClaims: 13,
    tier: "bronze" as const,
    rankOverall: 9,
    rankChange: 1,
    currentSentiment: "bullish",
    priceAccuracy: 55, timelineAccuracy: 50, regulatoryAccuracy: 65,
    partnershipAccuracy: 62, technologyAccuracy: 60, marketAccuracy: 70,
    videos: [
      { youtubeVideoId: "cban_live_01", title: "LIVE: Bitcoin Breaking Out! Trading the Move", publishedAt: new Date("2026-02-04"), durationSeconds: 5400, viewCount: 180000, thumbnailUrl: "https://i.ytimg.com/vi/cban_live_01/maxresdefault.jpg" },
      { youtubeVideoId: "cban_setup_02", title: "Best Trading Setups This Week — February 2026", publishedAt: new Date("2026-02-03"), durationSeconds: 2800, viewCount: 120000, thumbnailUrl: "https://i.ytimg.com/vi/cban_setup_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Bitcoin will test $150K before any major pullback occurs", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "Q1 2026", assetSymbols: ["BTC"], specificityScore: 8, aiExtractionConfidence: 0.82 },
      { claimText: "Ethereum gas fees will drop 90% post Pectra making it competitive with L2s", category: "technology" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["ETH"], specificityScore: 7, aiExtractionConfidence: 0.78 },
      { claimText: "BTC would hold $100K support through December 2025", category: "price_prediction" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "December 2025", assetSymbols: ["BTC"], specificityScore: 9, aiExtractionConfidence: 0.90 },
    ],
  },
  {
    youtubeChannelId: "UCCatR7nWbYrkVXdxXb4cGXg",
    channelHandle: "@DataDash",
    channelName: "DataDash",
    channelUrl: "https://youtube.com/@DataDash",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_mk0aMb0W6qGiZCgTU7HSVKndMnZRJMZbFMKzUQ5UhIrw=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 520000,
    description: "Technical analysis and macro-focused crypto content by Nicholas Merten. Known for measured, data-backed analysis.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-06-01"),
    overallAccuracy: 66.3,
    totalClaims: 40,
    verifiedTrue: 22,
    verifiedFalse: 8,
    pendingClaims: 10,
    tier: "silver" as const,
    rankOverall: 3,
    rankChange: 3,
    currentSentiment: "neutral",
    priceAccuracy: 68, timelineAccuracy: 62, regulatoryAccuracy: 72,
    partnershipAccuracy: 65, technologyAccuracy: 78, marketAccuracy: 80,
    videos: [
      { youtubeVideoId: "dd_macro_01", title: "The Macro Picture for Crypto in 2026", publishedAt: new Date("2026-01-12"), durationSeconds: 2400, viewCount: 210000, thumbnailUrl: "https://i.ytimg.com/vi/dd_macro_01/maxresdefault.jpg" },
      { youtubeVideoId: "dd_defi_02", title: "DeFi Renaissance — Why TVL Is Exploding", publishedAt: new Date("2026-01-30"), durationSeconds: 1800, viewCount: 165000, thumbnailUrl: "https://i.ytimg.com/vi/dd_defi_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "DeFi TVL will surpass $300B in 2026, exceeding the 2021 peak", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: [], specificityScore: 8, aiExtractionConfidence: 0.85 },
      { claimText: "Bitcoin market cap will surpass silver's market cap in this cycle", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "this cycle", assetSymbols: ["BTC"], specificityScore: 7, aiExtractionConfidence: 0.82 },
      { claimText: "Total crypto market cap reached $3T in 2024", category: "market_analysis" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "2024", assetSymbols: [], specificityScore: 9, aiExtractionConfidence: 0.95 },
    ],
  },
  {
    youtubeChannelId: "USAbMhSsckBUMbMfWp2nHCQ",
    channelHandle: "@TheCryptoLark",
    channelName: "Lark Davis",
    channelUrl: "https://youtube.com/@TheCryptoLark",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_lHqj8BcmPxnVGUIsXAz5nRBynaQz_oHEKsFPUt3jnxlw=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 520000,
    description: "New Zealand-based crypto educator covering altcoins, DeFi, and market trends with an accessible style.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-08-01"),
    overallAccuracy: 49.5,
    totalClaims: 42,
    verifiedTrue: 16,
    verifiedFalse: 14,
    pendingClaims: 12,
    tier: "unranked" as const,
    rankOverall: 12,
    rankChange: -1,
    currentSentiment: "bullish",
    priceAccuracy: 45, timelineAccuracy: 40, regulatoryAccuracy: 60,
    partnershipAccuracy: 58, technologyAccuracy: 68, marketAccuracy: 52,
    videos: [
      { youtubeVideoId: "ld_gems_01", title: "5 Hidden Gem Altcoins for 2026 Bull Run", publishedAt: new Date("2026-01-15"), durationSeconds: 1600, viewCount: 290000, thumbnailUrl: "https://i.ytimg.com/vi/ld_gems_01/maxresdefault.jpg" },
      { youtubeVideoId: "ld_defi_02", title: "Best DeFi Yield Strategies Right Now", publishedAt: new Date("2026-02-01"), durationSeconds: 1400, viewCount: 180000, thumbnailUrl: "https://i.ytimg.com/vi/ld_defi_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "At least one small-cap altcoin from his 2026 picks will 50X", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: [], specificityScore: 4, aiExtractionConfidence: 0.70 },
      { claimText: "DeFi yields will sustain above 20% APY on major protocols through 2026", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "weak" as const, statedTimeframe: "2026", assetSymbols: [], specificityScore: 6, aiExtractionConfidence: 0.72 },
      { claimText: "Polkadot would be a top-5 crypto by market cap by 2025", category: "market_prediction" as const, status: "verified_false" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2025", assetSymbols: ["DOT"], specificityScore: 8, aiExtractionConfidence: 0.88 },
    ],
  },
  {
    youtubeChannelId: "UCaIFJxT2RXnJj4v2g7Bvq3Q",
    channelHandle: "@SheldonEvans",
    channelName: "Sheldon Evans",
    channelUrl: "https://youtube.com/@SheldonEvans",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_lJ5F1S2n9AEmOWdNxOcbHfpfMeDr6BPlrC5IPhbiTkGw=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 280000,
    description: "South African crypto YouTuber. Covers market analysis, trading strategies, and crypto education.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-09-01"),
    overallAccuracy: 57.8,
    totalClaims: 30,
    verifiedTrue: 14,
    verifiedFalse: 7,
    pendingClaims: 9,
    tier: "bronze" as const,
    rankOverall: 6,
    rankChange: 2,
    currentSentiment: "bullish",
    priceAccuracy: 58, timelineAccuracy: 52, regulatoryAccuracy: 65,
    partnershipAccuracy: 62, technologyAccuracy: 70, marketAccuracy: 68,
    videos: [
      { youtubeVideoId: "se_btc_01", title: "Bitcoin Price Target Update — My Realistic Prediction", publishedAt: new Date("2026-01-20"), durationSeconds: 1500, viewCount: 140000, thumbnailUrl: "https://i.ytimg.com/vi/se_btc_01/maxresdefault.jpg" },
      { youtubeVideoId: "se_trade_02", title: "How I'm Trading This Crypto Market — My Strategy", publishedAt: new Date("2026-02-02"), durationSeconds: 1800, viewCount: 95000, thumbnailUrl: "https://i.ytimg.com/vi/se_trade_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Bitcoin will reach between $150K-$180K at this cycle's peak", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "this cycle", assetSymbols: ["BTC"], specificityScore: 8, aiExtractionConfidence: 0.85 },
      { claimText: "Altcoins will see their biggest gains in Q2-Q3 2026", category: "market_prediction" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "Q2-Q3 2026", assetSymbols: [], specificityScore: 6, aiExtractionConfidence: 0.78 },
      { claimText: "Bitcoin would close 2025 above $100K", category: "price_prediction" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "end of 2025", assetSymbols: ["BTC"], specificityScore: 9, aiExtractionConfidence: 0.92 },
    ],
  },
  {
    youtubeChannelId: "UCGwuxdEeCf0TIA2RbPOj-8g",
    channelHandle: "@CryptoJebb",
    channelName: "Crypto Jebb",
    channelUrl: "https://youtube.com/@CryptoJebb",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_mCQMw4uPFZ3EsNK2BGF3k8rZblkjBWuB-bm6WXB0Fj_A=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 350000,
    description: "Technical analysis focused crypto channel. Known for chart breakdowns and trading education.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-08-01"),
    overallAccuracy: 54.2,
    totalClaims: 38,
    verifiedTrue: 16,
    verifiedFalse: 10,
    pendingClaims: 12,
    tier: "bronze" as const,
    rankOverall: 7,
    rankChange: 0,
    currentSentiment: "bullish",
    priceAccuracy: 58, timelineAccuracy: 48, regulatoryAccuracy: 55,
    partnershipAccuracy: 50, technologyAccuracy: 62, marketAccuracy: 72,
    videos: [
      { youtubeVideoId: "cj_ta_01", title: "Bitcoin Technical Analysis — Key Levels to Watch", publishedAt: new Date("2026-02-01"), durationSeconds: 1600, viewCount: 150000, thumbnailUrl: "https://i.ytimg.com/vi/cj_ta_01/maxresdefault.jpg" },
      { youtubeVideoId: "cj_alt_02", title: "This Altcoin Chart Looks INCREDIBLE Right Now", publishedAt: new Date("2026-01-25"), durationSeconds: 1300, viewCount: 120000, thumbnailUrl: "https://i.ytimg.com/vi/cj_alt_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Bitcoin will see a 30% correction before reaching new all-time highs", category: "technical_analysis" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["BTC"], specificityScore: 7, aiExtractionConfidence: 0.80 },
      { claimText: "Ethereum's chart shows a massive cup-and-handle pattern targeting $10K", category: "technical_analysis" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: null, assetSymbols: ["ETH"], specificityScore: 8, aiExtractionConfidence: 0.82 },
      { claimText: "Bitcoin would break $75K by end of Q3 2024", category: "price_prediction" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "Q3 2024", assetSymbols: ["BTC"], specificityScore: 9, aiExtractionConfidence: 0.90 },
      { claimText: "LINK would reach $50 before end of 2025", category: "price_prediction" as const, status: "expired" as const, confidenceLanguage: "medium" as const, statedTimeframe: "end of 2025", assetSymbols: ["LINK"], specificityScore: 9, aiExtractionConfidence: 0.85 },
    ],
  },
  {
    youtubeChannelId: "UClgJyzwGs-GyaNxUHcLZrkg",
    channelHandle: "@InvestAnswers",
    channelName: "InvestAnswers",
    channelUrl: "https://youtube.com/@InvestAnswers",
    avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_lV9hX4tRjKjhPkPR7ZqyTJDFp_f3VvBGr7jhTMzDp_=s900-c-k-c0x00ffffff-no-rj",
    subscriberCount: 460000,
    description: "Quantitative crypto and stock analysis by James. Known for spreadsheet models, price projections, and data-first approach.",
    primaryNiche: "crypto",
    trackingSince: new Date("2024-06-01"),
    overallAccuracy: 63.7,
    totalClaims: 35,
    verifiedTrue: 18,
    verifiedFalse: 7,
    pendingClaims: 10,
    tier: "silver" as const,
    rankOverall: 5,
    rankChange: 1,
    currentSentiment: "bullish",
    priceAccuracy: 72, timelineAccuracy: 60, regulatoryAccuracy: 68,
    partnershipAccuracy: 55, technologyAccuracy: 75, marketAccuracy: 78,
    videos: [
      { youtubeVideoId: "ia_model_01", title: "My Bitcoin Price Model Updated for 2026 — Spreadsheet Walkthrough", publishedAt: new Date("2026-01-18"), durationSeconds: 2600, viewCount: 280000, thumbnailUrl: "https://i.ytimg.com/vi/ia_model_01/maxresdefault.jpg" },
      { youtubeVideoId: "ia_sol_02", title: "Solana vs Ethereum — Which Is the Better Investment?", publishedAt: new Date("2026-01-30"), durationSeconds: 2200, viewCount: 195000, thumbnailUrl: "https://i.ytimg.com/vi/ia_sol_02/maxresdefault.jpg" },
    ],
    claims: [
      { claimText: "Bitcoin fair value model shows $175K-$220K range for cycle peak", category: "price_prediction" as const, status: "pending" as const, confidenceLanguage: "strong" as const, statedTimeframe: "cycle peak", assetSymbols: ["BTC"], specificityScore: 8, aiExtractionConfidence: 0.88 },
      { claimText: "Solana will capture more market share from Ethereum in developer activity", category: "technology" as const, status: "pending" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2026", assetSymbols: ["SOL", "ETH"], specificityScore: 6, aiExtractionConfidence: 0.80 },
      { claimText: "Bitcoin would reach $100K by end of 2024", category: "price_prediction" as const, status: "verified_true" as const, confidenceLanguage: "strong" as const, statedTimeframe: "end of 2024", assetSymbols: ["BTC"], specificityScore: 9, aiExtractionConfidence: 0.92 },
      { claimText: "Ethereum staking yields would stay above 5% through 2025", category: "technology" as const, status: "verified_false" as const, confidenceLanguage: "medium" as const, statedTimeframe: "2025", assetSymbols: ["ETH"], specificityScore: 8, aiExtractionConfidence: 0.85 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // ------------------------------------------------------------------
    // Step 1: Upsert sources
    // ------------------------------------------------------------------
    console.log("\n--- Upserting sources ---");

    for (const src of SOURCE_DATA) {
      const [upserted] = await db
        .insert(sources)
        .values({
          type: src.type,
          handleOrDomain: src.handleOrDomain,
          displayName: src.displayName,
          logoUrl: src.logoUrl,
          metadata: src.metadata,
        })
        .onConflictDoUpdate({
          target: sources.handleOrDomain,
          set: {
            displayName: src.displayName,
            type: src.type,
            logoUrl: src.logoUrl,
            metadata: src.metadata,
            updatedAt: new Date(),
          },
        })
        .returning();

      console.log(`  [OK] ${upserted.displayName} (${upserted.handleOrDomain}) -> id=${upserted.id}, logoUrl=${upserted.logoUrl}`);
    }

    // ------------------------------------------------------------------
    // Step 2: Upsert source scores
    // ------------------------------------------------------------------
    console.log("\n--- Upserting source scores ---");

    // Fetch all sources to get their IDs
    const allSources = await db.select().from(sources);

    for (const source of allSources) {
      const scoreInfo = SCORE_DATA[source.handleOrDomain];
      if (!scoreInfo) {
        console.log(`  [SKIP] No score data for ${source.handleOrDomain}`);
        continue;
      }

      // Check if a score already exists for this source
      const existing = await db
        .select()
        .from(sourceScores)
        .where(eq(sourceScores.sourceId, source.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing score
        await db
          .update(sourceScores)
          .set({
            scoreVersion: "v1.0",
            trackRecord: scoreInfo.trackRecord,
            methodDiscipline: scoreInfo.methodDiscipline,
            confidenceInterval: scoreInfo.ci,
            sampleSize: scoreInfo.sampleSize,
            computedAt: new Date(),
            metadata: {},
          })
          .where(eq(sourceScores.id, existing[0].id));

        console.log(`  [UPDATED] Score for ${source.displayName}: trackRecord=${scoreInfo.trackRecord}, methodDiscipline=${scoreInfo.methodDiscipline}`);
      } else {
        // Insert new score
        await db.insert(sourceScores).values({
          sourceId: source.id,
          scoreVersion: "v1.0",
          trackRecord: scoreInfo.trackRecord,
          methodDiscipline: scoreInfo.methodDiscipline,
          confidenceInterval: scoreInfo.ci,
          sampleSize: scoreInfo.sampleSize,
          computedAt: new Date(),
          metadata: {},
        });

        console.log(`  [CREATED] Score for ${source.displayName}: trackRecord=${scoreInfo.trackRecord}, methodDiscipline=${scoreInfo.methodDiscipline}`);
      }
    }

    // ------------------------------------------------------------------
    // Step 3: Upsert creators, videos, claims, and scores
    // ------------------------------------------------------------------
    console.log("\n--- Upserting creators ---");

    for (const creatorData of CREATOR_DATA) {
      const { videos, claims, ...creatorFields } = creatorData;

      // Upsert creator
      const [creator] = await db
        .insert(creators)
        .values(creatorFields)
        .onConflictDoUpdate({
          target: creators.youtubeChannelId,
          set: {
            channelName: creatorFields.channelName,
            channelHandle: creatorFields.channelHandle,
            channelUrl: creatorFields.channelUrl,
            avatarUrl: creatorFields.avatarUrl,
            subscriberCount: creatorFields.subscriberCount,
            description: creatorFields.description,
            primaryNiche: creatorFields.primaryNiche,
            overallAccuracy: creatorFields.overallAccuracy,
            totalClaims: creatorFields.totalClaims,
            verifiedTrue: creatorFields.verifiedTrue,
            verifiedFalse: creatorFields.verifiedFalse,
            pendingClaims: creatorFields.pendingClaims,
            tier: creatorFields.tier,
            rankOverall: creatorFields.rankOverall,
            rankChange: creatorFields.rankChange,
            currentSentiment: creatorFields.currentSentiment,
            priceAccuracy: creatorFields.priceAccuracy,
            timelineAccuracy: creatorFields.timelineAccuracy,
            regulatoryAccuracy: creatorFields.regulatoryAccuracy,
            partnershipAccuracy: creatorFields.partnershipAccuracy,
            technologyAccuracy: creatorFields.technologyAccuracy,
            marketAccuracy: creatorFields.marketAccuracy,
            updatedAt: new Date(),
          },
        })
        .returning();

      console.log(`  [OK] Creator: ${creator.channelName} (${creator.tier}) -> id=${creator.id}`);

      // Upsert videos
      const videoIdMap: Record<string, string> = {};
      for (const video of videos) {
        const [upsertedVideo] = await db
          .insert(creatorVideos)
          .values({
            creatorId: creator.id,
            youtubeVideoId: video.youtubeVideoId,
            title: video.title,
            publishedAt: video.publishedAt,
            durationSeconds: video.durationSeconds,
            viewCount: video.viewCount,
            thumbnailUrl: video.thumbnailUrl,
            transcriptStatus: "completed",
          })
          .onConflictDoUpdate({
            target: creatorVideos.youtubeVideoId,
            set: {
              title: video.title,
              viewCount: video.viewCount,
              thumbnailUrl: video.thumbnailUrl,
            },
          })
          .returning();

        videoIdMap[video.youtubeVideoId] = upsertedVideo.id;
        console.log(`    [VIDEO] ${video.title} -> id=${upsertedVideo.id}`);
      }

      // Insert claims (linked to first video for simplicity, distribute across videos)
      const videoIds = Object.values(videoIdMap);
      for (let i = 0; i < claims.length; i++) {
        const claim = claims[i];
        const videoId = videoIds[i % videoIds.length];

        // Check if claim already exists (by text + creator combo)
        const existingClaim = await db
          .select()
          .from(creatorClaims)
          .where(eq(creatorClaims.creatorId, creator.id))
          .limit(100);

        const alreadyExists = existingClaim.some(
          (c) => c.claimText === claim.claimText
        );

        if (!alreadyExists) {
          await db.insert(creatorClaims).values({
            creatorId: creator.id,
            videoId,
            claimText: claim.claimText,
            category: claim.category,
            status: claim.status,
            confidenceLanguage: claim.confidenceLanguage,
            statedTimeframe: claim.statedTimeframe,
            assetSymbols: claim.assetSymbols,
            specificityScore: claim.specificityScore,
            aiExtractionConfidence: claim.aiExtractionConfidence,
          });
          console.log(`    [CLAIM] ${claim.claimText.substring(0, 60)}... (${claim.status})`);
        } else {
          console.log(`    [SKIP] Claim already exists: ${claim.claimText.substring(0, 60)}...`);
        }
      }

      // Upsert creator score snapshot
      const existingScore = await db
        .select()
        .from(creatorScores)
        .where(eq(creatorScores.creatorId, creator.id))
        .limit(1);

      if (existingScore.length > 0) {
        await db
          .update(creatorScores)
          .set({
            overallAccuracy: creatorFields.overallAccuracy,
            priceAccuracy: creatorFields.priceAccuracy,
            timelineAccuracy: creatorFields.timelineAccuracy,
            regulatoryAccuracy: creatorFields.regulatoryAccuracy,
            partnershipAccuracy: creatorFields.partnershipAccuracy,
            technologyAccuracy: creatorFields.technologyAccuracy,
            marketAccuracy: creatorFields.marketAccuracy,
            totalClaimsScored: creatorFields.totalClaims,
            claimsPending: creatorFields.pendingClaims,
            rankOverall: creatorFields.rankOverall,
            rankChange: creatorFields.rankChange,
            calculatedAt: new Date(),
          })
          .where(eq(creatorScores.id, existingScore[0].id));
        console.log(`    [SCORE UPDATED] ${creatorFields.overallAccuracy}% accuracy, rank #${creatorFields.rankOverall}`);
      } else {
        await db.insert(creatorScores).values({
          creatorId: creator.id,
          overallAccuracy: creatorFields.overallAccuracy,
          priceAccuracy: creatorFields.priceAccuracy,
          timelineAccuracy: creatorFields.timelineAccuracy,
          regulatoryAccuracy: creatorFields.regulatoryAccuracy,
          partnershipAccuracy: creatorFields.partnershipAccuracy,
          technologyAccuracy: creatorFields.technologyAccuracy,
          marketAccuracy: creatorFields.marketAccuracy,
          totalClaimsScored: creatorFields.totalClaims,
          claimsPending: creatorFields.pendingClaims,
          rankOverall: creatorFields.rankOverall,
          rankChange: creatorFields.rankChange,
          calculatedAt: new Date(),
        });
        console.log(`    [SCORE CREATED] ${creatorFields.overallAccuracy}% accuracy, rank #${creatorFields.rankOverall}`);
      }
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    const finalSources = await db.select().from(sources);
    const finalScores = await db.select().from(sourceScores);
    const finalCreators = await db.select().from(creators);
    const finalVideos = await db.select().from(creatorVideos);
    const finalClaims = await db.select().from(creatorClaims);
    const finalCreatorScores = await db.select().from(creatorScores);
    console.log(`\n--- Done ---`);
    console.log(`Total sources: ${finalSources.length}`);
    console.log(`Total source scores: ${finalScores.length}`);
    console.log(`Sources with logos: ${finalSources.filter((s) => s.logoUrl).length}`);
    console.log(`Total creators: ${finalCreators.length}`);
    console.log(`Total creator videos: ${finalVideos.length}`);
    console.log(`Total creator claims: ${finalClaims.length}`);
    console.log(`Total creator scores: ${finalCreatorScores.length}`);

  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("\nDatabase connection closed.");
  }
}

main();
