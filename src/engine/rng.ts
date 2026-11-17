export interface RngStep<T> {
  value: T;
  rngState: number;
}

export function normalizeSeed(seed: number): number {
  const s = Math.floor(seed) >>> 0;
  return s === 0 ? 0x6d2b79f5 : s;
}

/**
 * Pure state-threaded Mulberry32 PRNG.
 * Same rngState always produces the exact same float in [0, 1) and next rngState.
 */
export function nextRandom(rngState: number): RngStep<number> {
  let t = (rngState + 0x6d2b79f5) | 0;
  const nextState = t >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, rngState: nextState };
}

export function randInt(rngState: number, minInclusive: number, maxInclusive: number): RngStep<number> {
  const step = nextRandom(rngState);
  const span = maxInclusive - minInclusive + 1;
  return {
    value: minInclusive + Math.floor(step.value * span),
    rngState: step.rngState,
  };
}

export function randRange(rngState: number, min: number, max: number): RngStep<number> {
  const step = nextRandom(rngState);
  return {
    value: min + step.value * (max - min),
    rngState: step.rngState,
  };
}

export function randNormalApprox(rngState: number, mean: number, stdDev: number): RngStep<number> {
  let state = rngState;
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    const step = nextRandom(state);
    sum += step.value;
    state = step.rngState;
  }
  const centered = (sum / 3 - 0.5) * 3.464; // approx std=1
  return {
    value: mean + centered * stdDev,
    rngState: state,
  };
}

export function pickOne<T>(rngState: number, items: readonly T[]): RngStep<T> {
  const step = randInt(rngState, 0, items.length - 1);
  return {
    value: items[step.value],
    rngState: step.rngState,
  };
}

export function weightedPick<T extends { weight: number }>(rngState: number, items: readonly T[]): RngStep<T> {
  let total = 0;
  for (const item of items) {
    total += Math.max(0, item.weight);
  }
  const step = nextRandom(rngState);
  let target = step.value * total;
  for (const item of items) {
    target -= Math.max(0, item.weight);
    if (target <= 0) {
      return { value: item, rngState: step.rngState };
    }
  }
  return { value: items[items.length - 1], rngState: step.rngState };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function round2(val: number): number {
  return Math.round(val * 100) / 100;
}
