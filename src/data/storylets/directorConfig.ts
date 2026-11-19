/**
 * Event Director & Storylet Tuning Constants (Phase 3).
 * Pure data table — zero logic, zero React, zero emojis.
 */
export const DIRECTOR_CONFIG = {
  /** Base monthly check days in addition to triggered calendar/threshold/queue checks */
  cadenceDaysOfMonth: [1, 15] as readonly number[],

  /** Minimum days between interactive prompts */
  t2CooldownDays: 28,
  t3CooldownDays: 160,
  categoryCooldownDays: 45,

  /** Default decision window before Autopilot handles pending prompt */
  defaultDecisionWindowDays: 14,

  /** Minimum days between foreshadow signal and negative T3 crisis */
  foreshadowLeadDays: 14,

  /** Tension budget governs spacing of heavy dilemmas & crises */
  tensionBudget: {
    start: 100,
    max: 100,
    dailyRecovery: 1.5,
    t2Cost: 35,
    t3Cost: 70,
    minForT2: 30,
    minForT3: 60,
  },

  /** Real-time UI attention budget (controls presentation pause ONLY, never simulation RNG) */
  attentionBudget: {
    minRealSecondsBetweenPrompts: 35,
    x20InterruptMinT2Importance: 7,
  },

  /** Twist plausibility & lifetime pacing rules */
  twist: {
    maxPerLife: 3,
    minDaysBetweenTwists: 180,
    minNormalDaysBeforeFirstTwist: 60,
  },

  /** Stat thresholds that proactively trigger Director checks */
  statThresholds: {
    highStress: 78,
    lowEnergy: 20,
    lowCashAdult: 1500,
  },
} as const;

export const ALLOWED_STORYLET_EFFECT_TYPES = new Set([
  'ChangeRawStat',
  'ChangeResource',
  'ChangeSkill',
  'ChangeStat',
  'AddMoney',
  'ChangeMoney',
  'AddDebt',
  'RepayDebt',
  'ChangeCredit',
  'SetHousing',
  'SetJob',
  'AddTrait',
  'RemoveTrait',
  'AddFlag',
  'RemoveFlag',
  'RecordEvidence',
  'AdjustPersonality',
  'ApplyTurningPoint',
  'RevealTrait',
  'ScheduleEcho',
  'StartScene',
  'MoveIn',
  'ChangeTenure',
  'StartJobShift',
  'SetAnnualFocus',
  'ModifyTeacherGpa',
  'SetDeath',
]);
