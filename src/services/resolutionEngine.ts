/**
 * Resolution Engine
 * Handles scheduled re-checks and ground truth resolution
 * Manages the lifecycle of claims from creation to resolution
 */

import type {
  Claim,
  Resolution,
  ResolutionOutcome,
  EvidenceItem,
  Verdict,
} from '../models/types';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Re-check intervals for scheduled claims
  RECHECK_INTERVALS_HOURS: [6, 24, 48, 72, 168], // 6h, 1d, 2d, 3d, 1 week

  // Grace period after resolve_by date
  GRACE_PERIOD_HOURS: 24,

  // Max attempts before giving up
  MAX_RECHECK_ATTEMPTS: 10,

  // Indefinite claims re-check schedule
  INDEFINITE_RECHECK_DAYS: [7, 14, 21, 28], // Weekly for 4 weeks

  // Evidence thresholds for auto-resolution
  AUTO_RESOLVE_EVIDENCE_THRESHOLD: 0.85,
  AUTO_RESOLVE_PRIMARY_COUNT: 2,
};

// ============================================
// TYPES
// ============================================

export interface ScheduledRecheck {
  id: string;
  claimId: string;
  scheduledFor: Date;
  attempts: number;
  lastAttempt?: Date;
  completed: boolean;
  createdAt: Date;
}

export interface ResolutionResult {
  resolution: Resolution | null;
  shouldRecheck: boolean;
  nextRecheckAt?: Date;
  reason: string;
}

// ============================================
// RESOLUTION LOGIC
// ============================================

/**
 * Determine if a claim can be auto-resolved based on evidence
 */
export function canAutoResolve(
  claim: Claim,
  evidence: EvidenceItem[],
  verdict?: Verdict
): { canResolve: boolean; outcome?: ResolutionOutcome; reason: string } {
  // Need minimum evidence
  if (evidence.length < 2) {
    return {
      canResolve: false,
      reason: 'Insufficient evidence for auto-resolution',
    };
  }

  // Count primary sources
  const primaryEvidence = evidence.filter(
    e => e.evidenceGrade === 'A' || e.evidenceGrade === 'B'
  );

  // Check if we have strong contradicting evidence
  const contradicting = primaryEvidence.filter(e => e.stance === 'contradicts');
  if (contradicting.length >= CONFIG.AUTO_RESOLVE_PRIMARY_COUNT) {
    return {
      canResolve: true,
      outcome: 'false',
      reason: `${contradicting.length} primary sources contradict the claim`,
    };
  }

  // Check if we have strong supporting evidence
  const supporting = primaryEvidence.filter(e => e.stance === 'supports');
  if (supporting.length >= CONFIG.AUTO_RESOLVE_PRIMARY_COUNT) {
    return {
      canResolve: true,
      outcome: 'true',
      reason: `${supporting.length} primary sources support the claim`,
    };
  }

  // Use verdict if available and strong enough
  if (verdict) {
    if (
      verdict.evidenceStrength >= CONFIG.AUTO_RESOLVE_EVIDENCE_THRESHOLD &&
      verdict.verdictLabel === 'verified'
    ) {
      return {
        canResolve: true,
        outcome: 'true',
        reason: 'Verdict indicates verified with high confidence',
      };
    }

    if (
      verdict.evidenceStrength >= CONFIG.AUTO_RESOLVE_EVIDENCE_THRESHOLD &&
      verdict.verdictLabel === 'misleading'
    ) {
      return {
        canResolve: true,
        outcome: 'false',
        reason: 'Verdict indicates misleading with high confidence',
      };
    }
  }

  return {
    canResolve: false,
    reason: 'Evidence is inconclusive for auto-resolution',
  };
}

/**
 * Calculate next re-check time for a claim
 */
export function calculateNextRecheck(
  claim: Claim,
  attemptCount: number
): Date | null {
  const now = new Date();

  if (claim.resolutionType === 'scheduled' && claim.resolveBy) {
    const resolveByTime = new Date(claim.resolveBy).getTime();
    const graceEnd = resolveByTime + CONFIG.GRACE_PERIOD_HOURS * 60 * 60 * 1000;

    // If past grace period, no more rechecks
    if (now.getTime() > graceEnd) {
      return null;
    }

    // Use interval based on attempt count
    if (attemptCount < CONFIG.RECHECK_INTERVALS_HOURS.length) {
      const intervalHours = CONFIG.RECHECK_INTERVALS_HOURS[attemptCount];
      return new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
    }

    // Past all intervals, check once more at resolve_by
    if (now.getTime() < resolveByTime) {
      return new Date(resolveByTime);
    }

    return null;
  }

  if (claim.resolutionType === 'indefinite') {
    // Weekly rechecks for 4 weeks
    if (attemptCount < CONFIG.INDEFINITE_RECHECK_DAYS.length) {
      const days = CONFIG.INDEFINITE_RECHECK_DAYS[attemptCount];
      return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
    return null;
  }

  // Immediate claims don't need scheduled rechecks
  return null;
}

/**
 * Process a claim for potential resolution
 */
export function processClaimResolution(
  claim: Claim,
  evidence: EvidenceItem[],
  verdict?: Verdict,
  attemptCount: number = 0
): ResolutionResult {
  // Check if claim can be auto-resolved
  const autoResolve = canAutoResolve(claim, evidence, verdict);

  if (autoResolve.canResolve && autoResolve.outcome) {
    return {
      resolution: {
        id: generateId(),
        claimId: claim.id,
        outcome: autoResolve.outcome,
        resolvedAt: new Date(),
        resolutionEvidenceUrl: evidence.find(e => e.primaryFlag)?.url,
        notes: autoResolve.reason,
      },
      shouldRecheck: false,
      reason: autoResolve.reason,
    };
  }

  // Check if we've exceeded max attempts
  if (attemptCount >= CONFIG.MAX_RECHECK_ATTEMPTS) {
    return {
      resolution: {
        id: generateId(),
        claimId: claim.id,
        outcome: 'unresolved',
        resolvedAt: new Date(),
        notes: 'Max re-check attempts exceeded without conclusive evidence',
      },
      shouldRecheck: false,
      reason: 'Max attempts exceeded',
    };
  }

  // Check if past resolve_by + grace period
  if (claim.resolutionType === 'scheduled' && claim.resolveBy) {
    const graceEnd = new Date(claim.resolveBy).getTime() +
      CONFIG.GRACE_PERIOD_HOURS * 60 * 60 * 1000;

    if (Date.now() > graceEnd) {
      // For specific claims without confirmation, mark as false
      if (claim.falsifiabilityScore && claim.falsifiabilityScore > 0.7) {
        return {
          resolution: {
            id: generateId(),
            claimId: claim.id,
            outcome: 'false',
            resolvedAt: new Date(),
            notes: 'Specific claim not confirmed within expected timeframe',
          },
          shouldRecheck: false,
          reason: 'Passed resolve_by deadline without confirmation',
        };
      }

      // For vague claims, mark as unresolved
      return {
        resolution: {
          id: generateId(),
          claimId: claim.id,
          outcome: 'unresolved',
          resolvedAt: new Date(),
          notes: 'Claim not confirmed or refuted within expected timeframe',
        },
        shouldRecheck: false,
        reason: 'Passed deadline as unresolved',
      };
    }
  }

  // Schedule another re-check
  const nextRecheck = calculateNextRecheck(claim, attemptCount);

  if (nextRecheck) {
    return {
      resolution: null,
      shouldRecheck: true,
      nextRecheckAt: nextRecheck,
      reason: autoResolve.reason,
    };
  }

  // No more rechecks available
  return {
    resolution: {
      id: generateId(),
      claimId: claim.id,
      outcome: 'unresolved',
      resolvedAt: new Date(),
      notes: 'No conclusive evidence found within re-check window',
    },
    shouldRecheck: false,
    reason: 'Re-check window expired',
  };
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Get all claims due for re-check
 */
export function getClaimsDueForRecheck(
  claims: Claim[],
  scheduledRechecks: ScheduledRecheck[]
): Claim[] {
  const now = new Date();
  const dueRecheckIds = new Set(
    scheduledRechecks
      .filter(r => !r.completed && new Date(r.scheduledFor) <= now)
      .map(r => r.claimId)
  );

  return claims.filter(c =>
    c.status !== 'resolved' && dueRecheckIds.has(c.id)
  );
}

/**
 * Create initial re-check schedule for a claim
 */
export function createInitialSchedule(claim: Claim): ScheduledRecheck | null {
  if (claim.resolutionType === 'immediate') {
    return null; // Immediate claims are checked once
  }

  const nextRecheck = calculateNextRecheck(claim, 0);

  if (!nextRecheck) {
    return null;
  }

  return {
    id: generateId(),
    claimId: claim.id,
    scheduledFor: nextRecheck,
    attempts: 0,
    completed: false,
    createdAt: new Date(),
  };
}

// ============================================
// HIGH-RISK CLAIM HANDLING
// ============================================

const HIGH_RISK_CLAIM_TYPES = [
  'exploit_or_hack',
  'regulatory_action',
  'wallet_attribution',
];

/**
 * Check if claim requires human review
 */
export function requiresHumanReview(claim: Claim): boolean {
  return HIGH_RISK_CLAIM_TYPES.includes(claim.claimType);
}

/**
 * Flag high-risk claims for manual queue
 */
export function flagForManualReview(
  claim: Claim,
  reason: string
): { claimId: string; reason: string; priority: 'high' | 'medium' | 'low' } {
  const isExploit = claim.claimType === 'exploit_or_hack';
  const isRegulatory = claim.claimType === 'regulatory_action';

  return {
    claimId: claim.id,
    reason,
    priority: isExploit || isRegulatory ? 'high' : 'medium',
  };
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

export { CONFIG as RESOLUTION_CONFIG };
