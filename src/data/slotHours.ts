import type { DayType, Slot, TimeAllocCategory } from '../engine/types';

/**
 * Spec 06 §2.2: Fixed waking hours per slot (total = 16h/day).
 * Remaining 8h/day = sleep & basic daily routines (meals, shower, short commute).
 */
export const ALL_SLOTS: readonly Slot[] = ['morning', 'afternoon', 'evening', 'night'] as const;
export const ALL_DAY_TYPES: readonly DayType[] = ['weekday', 'weekend'] as const;

export const SLOT_HOURS: Record<Slot, number> = {
  morning: 4,
  afternoon: 5,
  evening: 4,
  night: 3,
};

export const BASE_DAILY_SLEEP_AND_ROUTINE_HOURS = 8;

export const DAY_TYPE_WEIGHTS: Record<DayType, number> = {
  weekday: 5,
  weekend: 2,
};

export const OVERTIME_EXTRA_HOURS_PER_NIGHT_SLOT = 3;

/**
 * Spec 06 §2.3 #3: Sleep variants and late-night wake penalties for the 'night' slot (3h).
 * Each day's base (8h) + night slot (3h) = 11h, guaranteeing deterministic 24h/day and 168h/week sums.
 * - sleep_full: 10h sleep/day (70h/wk max) + 1h calm wind-down (hobby)
 * - sleep_normal: 8h sleep/day (56h/wk baseline) + 2h hobby + 1h family wind-down
 * - Any awake activity in night slot: uses 3h slot + deducts 3h from base sleep (5h sleep/day when awake all night),
 *   so teens (minSleep 49) & kids (minSleep 56) fail sleep validation if staying awake on weekday nights.
 */
export const NIGHT_SLEEP_VARIANTS: Record<
  'sleep_full' | 'sleep_normal',
  {
    sleepHoursFromBaseAndSlot: number;
    remainderHours: Partial<Record<TimeAllocCategory, number>>;
  }
> = {
  sleep_full: {
    sleepHoursFromBaseAndSlot: 10,
    remainderHours: { hobby: 1 },
  },
  sleep_normal: {
    sleepHoursFromBaseAndSlot: 8,
    remainderHours: { hobby: 2, family: 1 },
  },
};

export const NIGHT_AWAKE_SLEEP_PENALTY_HOURS = 3;
