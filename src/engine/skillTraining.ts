import { ACTIVITIES_BY_ID } from '../data/activities';
import {
  SKILL_AGE_MULTIPLIERS,
  SKILL_APTITUDE_STATS,
  SKILL_TIERS,
  SKILL_TRAINING_CONFIG,
  SKILL_TRAIT_MULTIPLIERS,
  SKILL_UNLOCK_RULES,
  type SkillTier,
} from '../data/skillTraining';
import {
  ALL_DAY_TYPES,
  ALL_SLOTS,
  DAY_TYPE_WEIGHTS,
  NIGHT_AWAKE_SLEEP_PENALTY_HOURS,
  SLOT_HOURS,
} from '../data/slotHours';
import { JOBS, SKILL_LABELS } from '../data/thaiData';
import { DEFAULT_TIME_ALLOC_BY_STAGE } from '../data/timeAlloc';
import { UI_TEXT } from '../data/uiText';
import { formatShortThaiDate } from './clock';
import { getLifeSubStageId } from './lifeStage';
import { appendTimeline, applyEffects } from './log';
import { clamp, round2 } from './rng';
import type { GameState, SkillKey, SkillTrainingState, TimeAllocation } from './types';

export const ALL_SKILL_KEYS: readonly SkillKey[] = [
  'english',
  'sales',
  'finance',
  'tech',
  'craft',
  'cooking',
  'socializing',
  'academic',
] as const;

function zeroSkillRecord(): Record<SkillKey, number> {
  return {
    english: 0,
    sales: 0,
    finance: 0,
    tech: 0,
    craft: 0,
    cooking: 0,
    socializing: 0,
    academic: 0,
  };
}

export function createInitialSkillTrainingState(
  existing?: Partial<SkillTrainingState>
): SkillTrainingState {
  return {
    focus: existing?.focus ? [...existing.focus].slice(0, SKILL_TRAINING_CONFIG.maxFocusSkills) : [],
    course: existing?.course ? { ...existing.course } : null,
    xp: { ...zeroSkillRecord(), ...(existing?.xp ?? {}) },
    lastPracticedWeek: { ...zeroSkillRecord(), ...(existing?.lastPracticedWeek ?? {}) },
    socialHighWeeks: existing?.socialHighWeeks ?? 0,
    savingStreakWeeks: existing?.savingStreakWeeks ?? 0,
    lastLoggedCap: existing?.lastLoggedCap ? { ...existing.lastLoggedCap } : {},
  };
}

export function getSkillTier(level: number): SkillTier {
  if (level < SKILL_TIERS[1].maxCap) return 1;
  if (level < SKILL_TIERS[2].maxCap) return 2;
  return 3;
}

export function isTier2Unlocked(state: GameState, skill: SkillKey): boolean {
  const course = state.skillTraining?.course;
  if (course && course.skillId === skill && course.weeksLeft > 0) {
    return true;
  }
  const rule = SKILL_UNLOCK_RULES[skill];
  if (rule.allowsSchoolTier2 && state.economy.jobId === 'student') {
    return true;
  }
  return false;
}

export function isTier3Unlocked(state: GameState, skill: SkillKey): boolean {
  const job = JOBS[state.economy.jobId];
  if (job?.relatedSkills?.includes(skill)) {
    return true;
  }

  const rule = SKILL_UNLOCK_RULES[skill];
  if (
    rule.allowsUniversityTier3 &&
    state.economy.jobId === 'student' &&
    state.character.ageYears >= 18
  ) {
    return true;
  }

  if (
    rule.allowsContinuousSocialTier3 &&
    ((state.skillTraining?.socialHighWeeks ?? 0) >= SKILL_TRAINING_CONFIG.socialTier3RequiredWeeks ||
      Boolean(state.character.flags?.competition_unlocked))
  ) {
    return true;
  }

  if (
    rule.allowsSavingWealthTier3 &&
    (state.evidence?.disciplined_saving ?? 0) >= SKILL_TRAINING_CONFIG.financeTier3MinEvidence &&
    state.economy.cash + state.economy.assetsValue >= SKILL_TRAINING_CONFIG.financeTier3MinWealthCash
  ) {
    return true;
  }

  return false;
}

/**
 * Returns the maximum achievable skill level given the character's currently unlocked sources.
 * Never reduces existing over-cap levels from legacy saves; freezes positive gain once >= cap.
 */
export function getEffectiveSkillCap(state: GameState, skill: SkillKey): number {
  const level = state.character.skills[skill] ?? 0;
  const tier2 = isTier2Unlocked(state, skill);
  const tier3 = isTier3Unlocked(state, skill);

  if (tier3 && (tier2 || level >= 60)) {
    return 100;
  }
  if (tier2) {
    return 60;
  }
  return 30;
}

export function computeAptitudeMult(state: GameState, skill: SkillKey): number {
  const stats = SKILL_APTITUDE_STATS[skill];
  if (!stats || stats.length === 0) return 1.0;
  let sum = 0;
  for (const key of stats) {
    sum += state.character.rawStats[key] ?? 50;
  }
  const avg = sum / stats.length;
  const mult =
    SKILL_TRAINING_CONFIG.aptitudeMinMult +
    (clamp(avg, 0, 100) / 100) *
      (SKILL_TRAINING_CONFIG.aptitudeMaxMult - SKILL_TRAINING_CONFIG.aptitudeMinMult);
  return round4(mult);
}

export function computeTraitMult(state: GameState): number {
  let mult = 1.0;
  for (const traitId of state.character.traits ?? []) {
    const m = SKILL_TRAIT_MULTIPLIERS[traitId];
    if (m !== undefined) {
      mult *= m;
    }
  }
  return round4(clamp(mult, 0.65, 1.45));
}

export function computeAgeMult(state: GameState): number {
  const stageId = getLifeSubStageId(state.character.ageYears);
  return SKILL_AGE_MULTIPLIERS[stageId] ?? 1.0;
}

export function computeEnergyMult(state: GameState): number {
  return state.character.resources.energy < SKILL_TRAINING_CONFIG.energyLowThreshold
    ? SKILL_TRAINING_CONFIG.energyLowMult
    : SKILL_TRAINING_CONFIG.energyNormalMult;
}

export function computeProgressCurve(level: number, tier: SkillTier): number {
  const tierDef = SKILL_TIERS[tier];
  const span = Math.max(1, tierDef.maxCap - tierDef.minLevel);
  const pos = clamp((level - tierDef.minLevel) / span, 0, 1);
  return round4(
    SKILL_TRAINING_CONFIG.progressCurveStart -
      (SKILL_TRAINING_CONFIG.progressCurveStart - SKILL_TRAINING_CONFIG.progressCurveEnd) * pos
  );
}

export function canEnrollCourse(
  state: GameState,
  skill: SkillKey
): { allowed: boolean; reasonTh?: string } {
  if (!state.character.isAlive) {
    return { allowed: false, reasonTh: 'ตัวละครเสียชีวิตแล้ว' };
  }
  if (state.character.ageYears < SKILL_TRAINING_CONFIG.minTrainingAge) {
    return { allowed: false, reasonTh: UI_TEXT.SKILL_TRAINING.tooYoungNotice };
  }
  if (state.character.ageYears < SKILL_TRAINING_CONFIG.minCourseEnrollAge) {
    return { allowed: false, reasonTh: UI_TEXT.SKILL_TRAINING.courseUnder15Lock };
  }
  const active = state.skillTraining?.course;
  if (active && active.weeksLeft > 0) {
    const label = SKILL_LABELS[active.skillId]?.label ?? active.skillId;
    return {
      allowed: false,
      reasonTh: `กำลังเรียนคอร์ส${label}อยู่ (เหลืออีก ${active.weeksLeft} สัปดาห์)`,
    };
  }
  if (state.economy.cash < SKILL_TRAINING_CONFIG.courseFeePerWeek) {
    return {
      allowed: false,
      reasonTh: `เงินสดไม่พอค่าเรียนสัปดาห์แรก (${SKILL_TRAINING_CONFIG.courseFeePerWeek.toLocaleString('th-TH')} บาท)`,
    };
  }
  void skill;
  return { allowed: true };
}

export interface SkillGrowthDetails {
  skillId: SkillKey;
  level: number;
  tier: SkillTier;
  tierLabelTh: string;
  effectiveCap: number;
  atCap: boolean;
  xpProgressPct: number;
  isFocused: boolean;
  hasActiveCourse: boolean;
  tier2Unlocked: boolean;
  tier3Unlocked: boolean;
  aptitudeMult: number;
  traitMult: number;
  ageMult: number;
  energyMult: number;
  estimatedWeeklyGain: number;
  unlockHintTh: string;
  slowReasonsTh: string[];
}

export function getSkillGrowthDetails(state: GameState, skill: SkillKey): SkillGrowthDetails {
  const training = createInitialSkillTrainingState(state.skillTraining);
  const stageId = getLifeSubStageId(state.character.ageYears);
  const alloc: TimeAllocation = state.timeAllocation ?? DEFAULT_TIME_ALLOC_BY_STAGE[stageId];
  const level = state.character.skills[skill] ?? 0;
  const tier = getSkillTier(level);
  const tierDef = SKILL_TIERS[tier];
  const tier2 = isTier2Unlocked(state, skill);
  const tier3 = isTier3Unlocked(state, skill);
  const effectiveCap = getEffectiveSkillCap(state, skill);
  const atCap = level >= effectiveCap && effectiveCap < 100;
  const isFocused = training.focus.includes(skill);
  const hasActiveCourse =
    training.course?.skillId === skill && (training.course?.weeksLeft ?? 0) > 0;
  const rule = SKILL_UNLOCK_RULES[skill];

  const aptitudeMult = computeAptitudeMult(state, skill);
  const traitMult = computeTraitMult(state);
  const ageMult = computeAgeMult(state);
  const energyMult = computeEnergyMult(state);
  const progressCurve = computeProgressCurve(level, tier);

  const slowReasonsTh: string[] = [];
  if (state.character.resources.energy < SKILL_TRAINING_CONFIG.energyLowThreshold) {
    slowReasonsTh.push('พลังงานต่ำกว่า 30 ทำให้ฝึกได้ช้าลง (x0.6)');
  }
  if (hasActiveCourse && alloc.selfDev < SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek) {
    slowReasonsTh.push(
      `เวลาพัฒนาตัวเอง (${alloc.selfDev} ชม./สัปดาห์) ต่ำกว่าขั้นต่ำ ${SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek} ชม. คอร์สจึงได้ผลลดลงตามสัดส่วน`
    );
  }
  if (traitMult < 1) {
    slowReasonsTh.push(`นิสัยส่วนตัวชะลอการฝึก (x${traitMult.toFixed(2)})`);
  }
  if (ageMult < 1) {
    slowReasonsTh.push(`ช่วงวัยปรับจังหวะการเรียนรู้ (x${ageMult.toFixed(2)})`);
  }

  let unlockHintTh = '';
  if (level >= 30 && level < 60 && !tier2) {
    unlockHintTh = rule.tier2HintTh;
  } else if (level < 60 && tier2 && !tier3) {
    unlockHintTh = rule.tier3HintTh;
  } else if (level >= 60 && !tier3) {
    unlockHintTh = rule.tier3HintTh;
  } else if (level < 30) {
    unlockHintTh = atCap ? rule.tier2HintTh : `ขั้นถัดไป (30–59): ${rule.tier2SourceTh}`;
  } else if (level < 60) {
    unlockHintTh = rule.tier3HintTh;
  } else {
    unlockHintTh = `กำลังพัฒนาในสนามจริง: ${rule.tier3SourceTh}`;
  }

  const gainEval = computeWeeklySkillGainForOne(state, training, alloc, skill);

  return {
    skillId: skill,
    level,
    tier,
    tierLabelTh: UI_TEXT.SKILL_TRAINING.tierNames[tier] ?? tierDef.labelTh,
    effectiveCap,
    atCap,
    xpProgressPct: Math.round(clamp((training.xp[skill] ?? 0) * 100, 0, 99)),
    isFocused,
    hasActiveCourse,
    tier2Unlocked: tier2,
    tier3Unlocked: tier3,
    aptitudeMult,
    traitMult,
    ageMult,
    energyMult,
    estimatedWeeklyGain: gainEval.rawGain,
    unlockHintTh,
    slowReasonsTh,
  };
}

function computeGridTrainingBreakdown(
  state: GameState,
  alloc: TimeAllocation
): {
  selfStudyHours: number;
  courseHours: number;
  fieldPracticeHours: number;
  readReviewHours: number;
  effectiveSkillDevHours: number;
} {
  const grid = state.planner?.grid;
  if (!grid) {
    return {
      selfStudyHours: alloc.selfDev,
      courseHours: alloc.selfDev,
      fieldPracticeHours: 0,
      readReviewHours: 0,
      effectiveSkillDevHours: alloc.selfDev,
    };
  }

  let selfStudyHours = 0;
  let courseHours = 0;
  let fieldPracticeHours = 0;
  let readReviewHours = 0;
  let totalGridSelfDev = 0;
  const jobId = state.economy.jobId || 'unemployed';
  const job = JOBS[jobId];
  const age = state.character.ageYears;

  const isCellRoleLocked = (dayType: 'weekday' | 'weekend', slot: 'morning' | 'afternoon' | 'evening' | 'night') => {
    if (age < 6 || jobId === 'infant') return true;
    if (dayType !== 'weekday') return false;
    if (jobId === 'student') return slot === 'morning' || slot === 'afternoon';
    if (!job || job.shift === 'none') return false;
    if (job.shift === 'day') return slot === 'morning' || slot === 'afternoon';
    if (job.shift === 'day_long') return slot === 'morning' || slot === 'afternoon' || slot === 'evening';
    if (job.shift === 'split') return slot === 'afternoon' || slot === 'evening';
    if (job.shift === 'flex') return jobId === 'food_rider' ? (slot === 'afternoon' || slot === 'evening') : (slot === 'morning' || slot === 'afternoon');
    if (job.shift === 'night') return age >= 18 ? (slot === 'evening' || slot === 'night') : (slot === 'afternoon' || slot === 'evening');
    return false;
  };

  for (const dayType of ALL_DAY_TYPES) {
    const weight = DAY_TYPE_WEIGHTS[dayType];
    for (const slot of ALL_SLOTS) {
      if (isCellRoleLocked(dayType, slot)) continue;
      const actId = grid[dayType]?.[slot];
      if (!actId) continue;
      const def = ACTIVITIES_BY_ID.get(actId);
      if (!def || def.timeCategory !== 'selfDev') continue;
      const hrs =
        (slot === 'night'
          ? SLOT_HOURS.night + NIGHT_AWAKE_SLEEP_PENALTY_HOURS
          : SLOT_HOURS[slot]) * weight;
      totalGridSelfDev += hrs;
      if (actId === 'self_study') selfStudyHours += hrs;
      else if (actId === 'attend_course') courseHours += hrs;
      else if (actId === 'field_practice') fieldPracticeHours += hrs;
      else if (actId === 'read_review') readReviewHours += hrs;
    }
  }

  // Respect direct state.timeAllocation overrides in legacy/unit tests if alloc diverges from planner grid
  if (Math.abs(alloc.selfDev - totalGridSelfDev) > 0.5) {
    return {
      selfStudyHours: alloc.selfDev,
      courseHours: alloc.selfDev,
      fieldPracticeHours: 0,
      readReviewHours: 0,
      effectiveSkillDevHours: alloc.selfDev,
    };
  }

  return {
    selfStudyHours,
    courseHours,
    fieldPracticeHours,
    readReviewHours,
    effectiveSkillDevHours:
      selfStudyHours + courseHours + fieldPracticeHours + readReviewHours * 0.55,
  };
}

function computeWeeklySkillGainForOne(
  state: GameState,
  training: SkillTrainingState,
  alloc: TimeAllocation,
  skill: SkillKey
): { rawGain: number; practicedHours: number } {
  if (state.character.ageYears < SKILL_TRAINING_CONFIG.minTrainingAge || !state.character.isAlive) {
    return { rawGain: 0, practicedHours: 0 };
  }

  const level = state.character.skills[skill] ?? 0;
  const effectiveCap = getEffectiveSkillCap(state, skill);
  if (level >= effectiveCap) {
    return { rawGain: 0, practicedHours: 0 };
  }

  const tier = getSkillTier(level);
  const tierDef = SKILL_TIERS[tier];
  const tier2 = isTier2Unlocked(state, skill);
  const tier3 = isTier3Unlocked(state, skill);
  const job = JOBS[state.economy.jobId];
  const breakdown = computeGridTrainingBreakdown(state, alloc);

  const isFocused = training.focus.includes(skill);
  const activeCourseForThis =
    training.course?.skillId === skill && (training.course?.weeksLeft ?? 0) > 0;
  const focusCount = Math.max(1, training.focus.length);

  let selfDevHoursForSkill = 0;
  if (isFocused) {
    selfDevHoursForSkill = breakdown.effectiveSkillDevHours / focusCount;
  } else if (activeCourseForThis) {
    selfDevHoursForSkill = breakdown.effectiveSkillDevHours / (training.focus.length + 1);
  }

  let effectiveHours = 0;
  if (tier === 1) {
    effectiveHours = selfDevHoursForSkill;
    if (skill === 'socializing' && alloc.social > 0) {
      effectiveHours += alloc.social * 0.35;
    }
    if (skill === 'academic' && state.economy.jobId === 'student' && alloc.workOrStudy > 0) {
      effectiveHours += alloc.workOrStudy * 0.25;
    }
  } else if (tier === 2) {
    if (!tier2) {
      return { rawGain: 0, practicedHours: selfDevHoursForSkill };
    }
    if (activeCourseForThis) {
      const courseTotalHours = Math.max(breakdown.courseHours, breakdown.effectiveSkillDevHours);
      const minScale = Math.min(
        1,
        courseTotalHours / SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek
      );
      effectiveHours = Math.max(selfDevHoursForSkill, courseTotalHours * 0.5) * minScale;
    } else if (skill === 'academic' && state.economy.jobId === 'student') {
      effectiveHours = selfDevHoursForSkill + alloc.workOrStudy * 0.22;
    }
  } else {
    // Tier 3 (60-100): real-world usage hours + grid field_practice slot
    if (!tier3) {
      return { rawGain: 0, practicedHours: selfDevHoursForSkill };
    }
    const relatedCount = Math.max(1, job?.relatedSkills?.length ?? 1);
    const jobHours =
      job?.relatedSkills?.includes(skill) && alloc.workOrStudy > 0
        ? alloc.workOrStudy / relatedCount
        : 0;
    const fieldHours =
      isFocused && breakdown.fieldPracticeHours > 0
        ? breakdown.fieldPracticeHours / focusCount
        : 0;
    const uniHours =
      skill === 'academic' && state.economy.jobId === 'student' && state.character.ageYears >= 18
        ? alloc.workOrStudy * 0.35
        : 0;
    const socialRealHours =
      skill === 'socializing' &&
      (training.socialHighWeeks ?? 0) >= SKILL_TRAINING_CONFIG.socialTier3RequiredWeeks
        ? alloc.social * 0.5 + (isFocused ? selfDevHoursForSkill * 0.5 : 0)
        : 0;
    const financeRealHours =
      skill === 'finance' &&
      (state.evidence?.disciplined_saving ?? 0) >= SKILL_TRAINING_CONFIG.financeTier3MinEvidence &&
      state.economy.cash + state.economy.assetsValue >=
        SKILL_TRAINING_CONFIG.financeTier3MinWealthCash
        ? isFocused
          ? selfDevHoursForSkill
          : 4
        : 0;
    effectiveHours = Math.max(jobHours + fieldHours, uniHours, socialRealHours, financeRealHours);
  }

  if (effectiveHours <= 0) {
    return { rawGain: 0, practicedHours: 0 };
  }

  const progressCurve = computeProgressCurve(level, tier);
  const aptitudeMult = computeAptitudeMult(state, skill);
  const traitMult = computeTraitMult(state);
  const ageMult = computeAgeMult(state);
  const energyMult = computeEnergyMult(state);

  const rawGain =
    effectiveHours *
    tierDef.baseRatePerHour *
    progressCurve *
    aptitudeMult *
    traitMult *
    ageMult *
    energyMult;

  return {
    rawGain: round4(Math.min(SKILL_TRAINING_CONFIG.maxSkillGainPerWeek, Math.max(0, rawGain))),
    practicedHours: effectiveHours,
  };
}

/**
 * Pure weekly staircase skill progression executed inside pipeline.ts onWeek().
 * Handles:
 *  - Paid Tier 2 course weekly upfront deduction & expiration
 *  - Continuous Tier 3 unlock trackers (e.g. social >= 10h/wk for 8 wks)
 *  - Fractional XP accumulation & tier cap walls (30 / 60 / 100)
 *  - Idle decay (0.02/wk after 12 idle weeks, never below previous tier floor)
 */
export function applyWeeklySkillTraining(state: GameState, recordLogs = true): GameState {
  if (!state.character.isAlive) return state;

  let next = state;
  const training = createInitialSkillTrainingState(next.skillTraining);
  const stageId = getLifeSubStageId(next.character.ageYears);
  const alloc: TimeAllocation = next.timeAllocation ?? DEFAULT_TIME_ALLOC_BY_STAGE[stageId];
  const currentWeek = Math.floor(next.date.totalDays / 7);

  // 1. Update continuous Tier 3 activity trackers
  const prevSocialWeeks = training.socialHighWeeks ?? 0;
  if (alloc.social >= SKILL_TRAINING_CONFIG.socialTier3RequiredHoursPerWeek) {
    training.socialHighWeeks = prevSocialWeeks + 1;
  } else if (prevSocialWeeks < SKILL_TRAINING_CONFIG.socialTier3RequiredWeeks) {
    training.socialHighWeeks = 0;
  }

  // 2. Active Tier 2 paid course weekly upkeep (deduct weekly fee upfront, cancel if insufficient cash — no refund)
  if (training.course && training.course.weeksLeft > 0) {
    const courseSkillLabel = SKILL_LABELS[training.course.skillId]?.label ?? training.course.skillId;
    if (next.economy.cash >= training.course.feePerWeek) {
      next = applyEffects(
        next,
        [
          {
            type: 'AddMoney',
            amount: -training.course.feePerWeek,
            category: 'living',
            reason: `ค่าเรียนคอร์ส${courseSkillLabel}รายสัปดาห์`,
          },
        ],
        recordLogs
      );
    } else {
      training.course = null;
      if (recordLogs) {
        next = appendTimeline(next, {
          category: 'life',
          title: `คอร์ส${courseSkillLabel}หยุดลงกลางคัน`,
          description: 'เงินสดไม่พอจ่ายค่าเรียนรายสัปดาห์ คอร์สจึงสิ้นสุดลงโดยไม่มีการคืนเงิน',
        });
      }
    }
  }

  // Re-attach updated training before computing gains
  next = {
    ...next,
    skillTraining: training,
  };

  if (next.character.ageYears < SKILL_TRAINING_CONFIG.minTrainingAge) {
    return next;
  }

  // 3. Compute raw weekly gains across all 8 skills, capping each <= 3 and total <= 6
  const rawGains: Record<SkillKey, number> = zeroSkillRecord();
  const practicedHoursMap: Record<SkillKey, number> = zeroSkillRecord();
  let totalRawGain = 0;

  for (const sKey of ALL_SKILL_KEYS) {
    const res = computeWeeklySkillGainForOne(next, training, alloc, sKey);
    rawGains[sKey] = res.rawGain;
    practicedHoursMap[sKey] = res.practicedHours;
    totalRawGain += res.rawGain;
  }

  const totalScale =
    totalRawGain > SKILL_TRAINING_CONFIG.maxTotalSkillGainPerWeek
      ? SKILL_TRAINING_CONFIG.maxTotalSkillGainPerWeek / totalRawGain
      : 1;

  // 4. Apply fractional XP accumulation + wall caps + 12-week idle decay
  const nextSkills = { ...next.character.skills };
  const nextStatLogs = [...next.statLogs];
  const capNotices: string[] = [];

  for (const sKey of ALL_SKILL_KEYS) {
    const curLevel = nextSkills[sKey] ?? 0;
    const cap = getEffectiveSkillCap(next, sKey);
    const gain = round4(rawGains[sKey] * totalScale);

    if (practicedHoursMap[sKey] > 0) {
      training.lastPracticedWeek[sKey] = currentWeek;
    }

    if (gain > 0 && curLevel < cap) {
      const nextXpAcc = (training.xp[sKey] ?? 0) + gain;
      const wholeLevels = Math.floor(nextXpAcc);
      if (wholeLevels > 0) {
        const unclamped = curLevel + wholeLevels;
        const appliedLevel = Math.min(cap, unclamped);
        const appliedDelta = appliedLevel - curLevel;
        nextSkills[sKey] = appliedLevel;
        training.xp[sKey] = appliedLevel >= cap ? 0 : round4(nextXpAcc - wholeLevels);

        if (recordLogs && appliedDelta > 0) {
          nextStatLogs.push({
            id: `sl_${next.date.totalDays}_${nextStatLogs.length + 1}`,
            totalDay: next.date.totalDays,
            dateLabel: formatShortThaiDate(next.date),
            target: `skill:${sKey}`,
            delta: appliedDelta,
            newValue: appliedLevel,
            reason: `พัฒนาทักษะ${SKILL_LABELS[sKey].label}ประจำสัปดาห์`,
          });
        }

        if (appliedLevel >= cap && cap < 100 && training.lastLoggedCap?.[sKey] !== cap) {
          training.lastLoggedCap = {
            ...(training.lastLoggedCap ?? {}),
            [sKey]: cap as 30 | 60,
          };
          const rule = SKILL_UNLOCK_RULES[sKey];
          const hint = cap === 30 ? rule.tier2HintTh : rule.tier3HintTh;
          capNotices.push(`ทักษะ${SKILL_LABELS[sKey].label}แตะเพดาน ${cap}: ${hint}`);
        }
      } else {
        training.xp[sKey] = round4(nextXpAcc);
      }
    } else if (curLevel >= cap && cap < 100) {
      training.xp[sKey] = 0;
      if (
        (training.focus.includes(sKey) || training.course?.skillId === sKey) &&
        training.lastLoggedCap?.[sKey] !== cap
      ) {
        training.lastLoggedCap = {
          ...(training.lastLoggedCap ?? {}),
          [sKey]: cap as 30 | 60,
        };
        const rule = SKILL_UNLOCK_RULES[sKey];
        const hint = cap === 30 ? rule.tier2HintTh : rule.tier3HintTh;
        capNotices.push(`ทักษะ${SKILL_LABELS[sKey].label}ติดเพดาน ${cap}: ${hint}`);
      }
    } else if (
      practicedHoursMap[sKey] <= 0 &&
      currentWeek - (training.lastPracticedWeek[sKey] ?? currentWeek) >
        SKILL_TRAINING_CONFIG.decayIdleWeeks
    ) {
      // Slow idle decay, never below previous tier floor (0, 30, or 60)
      const tierFloor = curLevel >= 60 ? 60 : curLevel >= 30 ? 30 : 0;
      if (training.xp[sKey] >= SKILL_TRAINING_CONFIG.decayPerWeek) {
        training.xp[sKey] = round4(training.xp[sKey] - SKILL_TRAINING_CONFIG.decayPerWeek);
      } else if (curLevel > tierFloor) {
        nextSkills[sKey] = Math.max(
          tierFloor,
          round2(curLevel - SKILL_TRAINING_CONFIG.decayPerWeek)
        );
      }
    }
  }

  // 5. Decrement course week counter AFTER weekly training gain has been applied
  let completedCourseLabel: string | null = null;
  if (training.course && training.course.weeksLeft > 0) {
    const nextWeeksLeft = training.course.weeksLeft - 1;
    if (nextWeeksLeft <= 0) {
      completedCourseLabel = SKILL_LABELS[training.course.skillId]?.label ?? training.course.skillId;
      training.course = null;
    } else {
      training.course = {
        ...training.course,
        weeksLeft: nextWeeksLeft,
      };
    }
  }

  if (nextStatLogs.length > 400) {
    nextStatLogs.splice(0, nextStatLogs.length - 400);
  }

  next = {
    ...next,
    character: {
      ...next.character,
      skills: nextSkills,
    },
    skillTraining: training,
    statLogs: nextStatLogs,
  };

  if (recordLogs && completedCourseLabel) {
    next = appendTimeline(next, {
      category: 'life',
      title: `เรียนจบคอร์ส${completedCourseLabel}`,
      description: 'เรียนครบระยะเวลาคอร์สแล้ว หากต้องการปลดล็อกระดับ 60–100 ต้องฝึกในสนามจริงหรือสายงานที่เกี่ยวข้อง',
    });
  }

  if (recordLogs && capNotices.length > 0) {
    next = appendTimeline(next, {
      category: 'life',
      title: 'ทักษะแตะเพดานขั้น',
      description: capNotices.join(' · '),
    });
  }

  return next;
}

function round4(val: number): number {
  return Math.round(val * 10000) / 10000;
}
