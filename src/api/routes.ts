/**
 * Confirmd API Routes
 * RESTful API for claims, sources, verdicts, and scores
 */

import type {
  Claim,
  Source,
  Verdict,
  EvidenceItem,
  ClaimFilters,
  PaginatedResponse,
  ClaimWithContext,
  SourceWithScore,
  User,
  SubscriptionTier,
} from '../models/types';

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    requestId?: string;
  };
}

// ============================================
// ROUTE DEFINITIONS
// ============================================

export const API_ROUTES = {
  // Claims
  getClaims: '/api/claims',
  getClaimById: '/api/claims/:id',
  getClaimEvidence: '/api/claims/:id/evidence',
  getClaimVerdict: '/api/claims/:id/verdict',
  overrideVerdict: '/api/claims/:id/verdict/override',
  overrideResolution: '/api/claims/:id/resolution/override',

  // Sources
  getSources: '/api/sources',
  getSourceById: '/api/sources/:id',
  getSourceClaims: '/api/sources/:id/claims',
  mergeSources: '/api/sources/merge',

  // Scores
  getSourceScore: '/api/sources/:id/score',
  getClaimScore: '/api/claims/:id/score',

  // User
  getCurrentUser: '/api/user',
  updateSubscription: '/api/user/subscription',
  getCredits: '/api/user/credits',
  deductCredits: '/api/user/credits/deduct',

  // Alerts
  getAlerts: '/api/alerts',
  createAlert: '/api/alerts',
  dismissAlert: '/api/alerts/:id/dismiss',

  // Watchlist
  getWatchlist: '/api/watchlist',
  addToWatchlist: '/api/watchlist',
  removeFromWatchlist: '/api/watchlist/:id',

  // Admin
  ingestItem: '/api/admin/ingest',
  triggerRecheck: '/api/admin/recheck/:claimId',
  getAuditLog: '/api/admin/audit',
};

// ============================================
// API CLIENT (for frontend)
// ============================================

export class ConfirmdApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = '', authToken?: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Claims
  async getClaims(filters?: ClaimFilters): Promise<ApiResponse<PaginatedResponse<ClaimWithContext>>> {
    const params = new URLSearchParams();
    if (filters?.asset) params.set('asset', filters.asset);
    if (filters?.verdict) params.set('verdict', filters.verdict);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.claimType) params.set('claimType', filters.claimType);
    if (filters?.since) params.set('since', filters.since.toISOString());

    return this.request('GET', `/api/claims?${params}`);
  }

  async getClaimById(id: string): Promise<ApiResponse<ClaimWithContext>> {
    return this.request('GET', `/api/claims/${id}`);
  }

  async getClaimEvidence(claimId: string): Promise<ApiResponse<EvidenceItem[]>> {
    return this.request('GET', `/api/claims/${claimId}/evidence`);
  }

  // Sources
  async getSources(): Promise<ApiResponse<SourceWithScore[]>> {
    return this.request('GET', '/api/sources');
  }

  async getSourceById(id: string): Promise<ApiResponse<SourceWithScore>> {
    return this.request('GET', `/api/sources/${id}`);
  }

  async getSourceClaims(sourceId: string): Promise<ApiResponse<ClaimWithContext[]>> {
    return this.request('GET', `/api/sources/${sourceId}/claims`);
  }

  // User
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('GET', '/api/user');
  }

  async deductCredits(amount: number, description: string): Promise<ApiResponse<{ balance: number }>> {
    return this.request('POST', '/api/user/credits/deduct', { amount, description });
  }

  // Watchlist
  async getWatchlist(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/api/watchlist');
  }

  async addToWatchlist(item: { assetSymbol?: string; topic?: string; claimId?: string }): Promise<ApiResponse<any>> {
    return this.request('POST', '/api/watchlist', item);
  }

  // Alerts
  async getAlerts(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/api/alerts');
  }

  async dismissAlert(id: string): Promise<ApiResponse<void>> {
    return this.request('POST', `/api/alerts/${id}/dismiss`);
  }
}

// ============================================
// MOCK API (for demo/development)
// ============================================

export class MockApiClient extends ConfirmdApiClient {
  private mockData: {
    claims: ClaimWithContext[];
    sources: SourceWithScore[];
    user: User;
  };

  constructor() {
    super('');
    this.mockData = this.initializeMockData();
  }

  private initializeMockData() {
    // This would be populated with realistic mock data
    return {
      claims: [],
      sources: [],
      user: {
        id: 'user-1',
        email: 'demo@confirmd.io',
        username: 'demo_user',
        subscriptionTier: 'free' as SubscriptionTier,
        creditsBalance: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return {
      success: true,
      data: this.mockData.user,
    };
  }

  async deductCredits(amount: number, description: string): Promise<ApiResponse<{ balance: number }>> {
    if (this.mockData.user.creditsBalance < amount) {
      return {
        success: false,
        error: 'Insufficient credits',
      };
    }

    this.mockData.user.creditsBalance -= amount;
    return {
      success: true,
      data: { balance: this.mockData.user.creditsBalance },
    };
  }
}

// ============================================
// TIER-BASED ACCESS CONTROL
// ============================================

export const TIER_ACCESS = {
  free: {
    canViewFullEvidence: false,
    canViewSourceHistory: false,
    canSetAlerts: false,
    canExport: false,
    maxWatchlistItems: 3,
    evidencePreviewCount: 2,
  },
  plus: {
    canViewFullEvidence: true,
    canViewSourceHistory: true,
    canSetAlerts: true,
    canExport: false,
    maxWatchlistItems: 25,
    evidencePreviewCount: 10,
  },
  pro: {
    canViewFullEvidence: true,
    canViewSourceHistory: true,
    canSetAlerts: true,
    canExport: true,
    maxWatchlistItems: 100,
    evidencePreviewCount: -1, // unlimited
  },
  team: {
    canViewFullEvidence: true,
    canViewSourceHistory: true,
    canSetAlerts: true,
    canExport: true,
    maxWatchlistItems: 500,
    evidencePreviewCount: -1,
  },
  enterprise: {
    canViewFullEvidence: true,
    canViewSourceHistory: true,
    canSetAlerts: true,
    canExport: true,
    maxWatchlistItems: -1, // unlimited
    evidencePreviewCount: -1,
  },
};

/**
 * Check if user has access to a feature
 */
export function hasAccess(tier: SubscriptionTier, feature: keyof typeof TIER_ACCESS.free): boolean {
  const access = TIER_ACCESS[tier];
  const value = access[feature];

  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Get limit for a feature
 */
export function getLimit(tier: SubscriptionTier, feature: keyof typeof TIER_ACCESS.free): number {
  const access = TIER_ACCESS[tier];
  const value = access[feature];

  if (typeof value === 'number') return value;
  return 0;
}
