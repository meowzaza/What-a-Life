import { JOB_EVIDENCE_PREP } from '../data/traits';
import { clamp, round2 } from './rng';
import type { EvidenceState, GameState } from './types';

export interface EvidenceContext {
  reason?: string;
}

const MAX_EVIDENCE_VALUE = 200;

export function getEvidenceValue(evidence: EvidenceState | undefined, key: string): number {
  if (!evidence) return 0;
  return evidence[key] ?? 0;
}

/**
 * Pure unified API to record behavioral evidence counters.
 * Also increments aggregate `practice_any` whenever a `practice_*` key is recorded.
 */
export function recordEvidence(
  state: GameState,
  key: string,
  amount: number,
  _context?: EvidenceContext
): GameState {
  if (!key || !Number.isFinite(amount) || amount === 0) return state;

  const prevEvidence: EvidenceState = state.evidence ?? {};
  const nextEvidence: EvidenceState = { ...prevEvidence };

  const cur = nextEvidence[key] ?? 0;
  nextEvidence[key] = round2(clamp(cur + amount, 0, MAX_EVIDENCE_VALUE));

  if (key.startsWith('practice_') && key !== 'practice_any' && amount > 0) {
    const curAny = nextEvidence.practice_any ?? 0;
    nextEvidence.practice_any = round2(clamp(curAny + amount, 0, MAX_EVIDENCE_VALUE));
  }

  return {
    ...state,
    evidence: nextEvidence,
  };
}

export function recordEvidenceBatch(
  state: GameState,
  entries: Record<string, number>,
  context?: EvidenceContext
): GameState {
  let next = state;
  for (const [key, amount] of Object.entries(entries)) {
    if (amount !== 0) {
      next = recordEvidence(next, key, amount, context);
    }
  }
  return next;
}

/**
 * Slow passive time decay on behavioral evidence so unused habits gently fade over years.
 */
export function decayEvidenceWeekly(evidence: EvidenceState | undefined): EvidenceState {
  if (!evidence) return {};
  const next: EvidenceState = {};
  for (const [key, raw] of Object.entries(evidence)) {
    const decayed = round2(Math.max(0, raw * 0.985 - 0.04));
    if (decayed > 0.05) {
      next[key] = decayed;
    }
  }
  return next;
}

/**
 * Records multi-year career evidence (Spec 03 Section 8 prep, e.g., rider -> endurance, bartender -> nightlife social).
 */
export function recordJobWeeklyEvidence(state: GameState): GameState {
  const prep = JOB_EVIDENCE_PREP[state.economy.jobId];
  if (!prep) return state;
  return recordEvidenceBatch(state, prep.evidencePerWeek, { reason: prep.noteTh });
}
