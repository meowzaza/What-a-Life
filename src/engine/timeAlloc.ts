import { ACTIVITIES_BY_ID } from '../data/activities';
import { ANNUAL_FOCUS_BY_ID, ANNUAL_FOCUS_CONFIG } from '../data/annualFocus';
import { AGE_LEGAL_RULES } from '../data/lifeStages';
import { LIFESTYLE_PRESETS_BY_ID } from '../data/lifestylePresets';
import {
  ALL_DAY_TYPES,
  ALL_SLOTS,
  DAY_TYPE_WEIGHTS,
  NIGHT_AWAKE_SLEEP_PENALTY_HOURS,
  SLOT_HOURS,
} from '../data/slotHours';
import { JOBS } from '../data/thaiData';
import {
  DEFAULT_TIME_ALLOC_BY_STAGE,
  PRESET_DEDUCTION_ORDER,
  STAGE_MIN_SLEEP_HOURS,
  STAGE_OVERWORK_THRESHOLD,
  TIME_ALLOC_BALANCE,
  TIME_ALLOC_CATEGORIES,
  TOTAL_WEEKLY_HOURS,
} from '../data/timeAlloc';
import { UI_TEXT } from '../data/uiText';
import { checkSideGigEligibility } from './economy';
import { recordEvidenceBatch } from './evidence';
import { getLifeStageForAge, getLifeSubStageId } from './lifeStage';
import { appendTimeline, applyEffects } from './log';
import {
  applyPresetTemplate,
  computeFreelanceWeeklyPreview,
  computeNightShiftWeeklyImpact,
  computeOvertimeWeeklyImpact,
  countOvertimeHoursPerWeek,
  deriveWeeklyAllocation,
  isPresetAvailableForPlanner,
  isSlotLocked,
  resolveAffordableWeeklyActivities,
  resolveEffectiveSlotActivityId,
  resolveEmploymentState,
} from './planner';
import { clamp, nextRandom, round2 } from './rng';
import { recordActivitySkillTagProgress } from './skillTraining';
import { advanceLimitationCureProgress } from './talents';
import type {
  ActivityId,
  ActivitySkillTagId,
  Effect,
  GameState,
  LifestylePresetId,
  TimeAllocCategory,
  TimeAllocation,
} from './types';

export interface TimeAllocationValidation {
  valid: boolean;
  totalHours: number;
  errors: string[];
}

export interface TimeAllocationPreview {
  energyDeltaPerDay: number;
  stressDeltaPerDay: number;
  overtimePayPerWeek: number;
  sideGigIncomePerWeek: number;
  nightlifeCostPerWeek: number;
  isOverworking: boolean;
  overworkHours: number;
  warningsTh: string[];
  resultingDaypartHint: 'night' | 'normal';
}

export interface PresetAvailabilityResult {
  available: boolean;
  reasonTh?: string;
}

export function evaluatePresetAvailability(
  presetId: LifestylePresetId,
  state: GameState
): PresetAvailabilityResult {
  return isPresetAvailableForPlanner(presetId, state);
}

function getCategoryMeta(key: TimeAllocCategory) {
  return TIME_ALLOC_CATEGORIES.find((c) => c.key === key)!;
}

function balanceAllocationTo168(
  draft: TimeAllocation,
  ageYears: number,
  state?: GameState
): TimeAllocation {
  const stageId = getLifeSubStageId(ageYears);
  const minSleep = STAGE_MIN_SLEEP_HOURS[stageId];
  const gigCheck = state ? checkSideGigEligibility(state) : undefined;
  const maxSideGig =
    ageYears < 15
      ? 0
      : gigCheck
        ? gigCheck.allowed
          ? gigCheck.maxHours
          : 0
        : getCategoryMeta('sideGig').maxHours;

  const next: TimeAllocation = {
    sleep: clamp(Math.round(draft.sleep), minSleep, getCategoryMeta('sleep').maxHours),
    workOrStudy: ageYears < 4 ? 0 : clamp(Math.round(draft.workOrStudy), 0, getCategoryMeta('workOrStudy').maxHours),
    sideGig: ageYears < 15 ? 0 : clamp(Math.round(draft.sideGig ?? 0), 0, maxSideGig),
    social: clamp(Math.round(draft.social), 0, getCategoryMeta('social').maxHours),
    hobby: clamp(Math.round(draft.hobby), 0, getCategoryMeta('hobby').maxHours),
    family: clamp(Math.round(draft.family), 0, getCategoryMeta('family').maxHours),
    selfDev: clamp(Math.round(draft.selfDev), 0, getCategoryMeta('selfDev').maxHours),
    nightlife: ageYears < 18 ? 0 : clamp(Math.round(draft.nightlife), 0, getCategoryMeta('nightlife').maxHours),
  };

  if (ageYears < 18) {
    const minorLimit = AGE_LEGAL_RULES.minorMaxWeeklyWorkHours;
    if (next.workOrStudy + next.sideGig > minorLimit) {
      const over = next.workOrStudy + next.sideGig - minorLimit;
      const trimGig = Math.min(next.sideGig, over);
      next.sideGig -= trimGig;
      const remOver = over - trimGig;
      if (remOver > 0) {
        next.workOrStudy = Math.max(0, next.workOrStudy - remOver);
      }
    }
  }

  let sum =
    next.sleep +
    next.workOrStudy +
    next.sideGig +
    next.social +
    next.hobby +
    next.family +
    next.selfDev +
    next.nightlife;

  let diff = TOTAL_WEEKLY_HOURS - sum;
  if (diff !== 0) {
    // Fixed deterministic deduction/addition order per Spec 05 §2.1:
    // hobby -> selfDev -> social -> family -> nightlife -> sleep
    for (const key of PRESET_DEDUCTION_ORDER) {
      if (diff === 0) break;
      if (key === 'nightlife' && ageYears < 18) continue;
      const meta = getCategoryMeta(key);
      const minBound = key === 'sleep' ? minSleep : meta.minHours;
      const maxBound = meta.maxHours;
      if (diff > 0) {
        const room = maxBound - next[key];
        const add = Math.min(diff, room);
        next[key] += add;
        diff -= add;
      } else {
        const room = next[key] - minBound;
        const sub = Math.min(-diff, room);
        next[key] -= sub;
        diff += sub;
      }
    }
  }

  // Final safety safeguard
  sum =
    next.sleep +
    next.workOrStudy +
    next.sideGig +
    next.social +
    next.hobby +
    next.family +
    next.selfDev +
    next.nightlife;
  if (sum !== TOTAL_WEEKLY_HOURS) {
    next.sleep = clamp(
      next.sleep + (TOTAL_WEEKLY_HOURS - sum),
      minSleep,
      getCategoryMeta('sleep').maxHours
    );
  }
  return next;
}

export function getDefaultTimeAllocation(ageYears: number): TimeAllocation {
  const stageId = getLifeSubStageId(ageYears);
  return balanceAllocationTo168({ ...DEFAULT_TIME_ALLOC_BY_STAGE[stageId] }, ageYears);
}

/**
 * Pure Lifestyle Preset applicator (Spec 06 §5):
 * Applies the matching archetype grid template onto unlocked slots and derives 168h hours from the grid.
 */
export function applyLifestylePreset(
  state: GameState,
  presetId: LifestylePresetId
): { state: GameState; accepted: boolean; reasonTh?: string } {
  const applied = applyPresetTemplate(presetId, state);
  return {
    state: applied.state,
    accepted: applied.accepted,
    reasonTh: applied.reasonTh,
  };
}

export function validateTimeAllocation(
  allocation: TimeAllocation,
  ageYears: number,
  state?: GameState
): TimeAllocationValidation {
  const errors: string[] = [];
  const stageDef = getLifeStageForAge(ageYears);
  const minSleep = STAGE_MIN_SLEEP_HOURS[stageDef.id];

  let totalHours = 0;
  for (const meta of TIME_ALLOC_CATEGORIES) {
    const val = allocation[meta.key];
    if (!Number.isFinite(val) || val < 0 || !Number.isInteger(val)) {
      errors.push(`ชั่วโมงของ "${meta.labelTh}" ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`);
      continue;
    }
    totalHours += val;
    if (val < meta.minHours || val > meta.maxHours) {
      errors.push(`"${meta.labelTh}" ต้องอยู่ระหว่าง ${meta.minHours} ถึง ${meta.maxHours} ชม./สัปดาห์`);
    }
  }

  if (totalHours !== TOTAL_WEEKLY_HOURS) {
    errors.push(`ผลรวมเวลาต่อสัปดาห์ต้องเท่ากับ ${TOTAL_WEEKLY_HOURS} ชม. (ปัจจุบัน ${totalHours} ชม.)`);
  }

  if (allocation.sleep < minSleep) {
    errors.push(
      `ช่วง${stageDef.shortLabelTh} ต้องนอนอย่างน้อย ${minSleep} ชม./สัปดาห์ (${(minSleep / 7).toFixed(1)} ชม./วัน)`
    );
  }

  if (ageYears < 15 && allocation.sideGig > 0) {
    errors.push(UI_TEXT.LIFESTYLE.minorSideGigUnder15);
  } else if (allocation.sideGig > 0 && state) {
    const gigCheck = checkSideGigEligibility(
      { ...state, timeAllocation: allocation },
      allocation.sideGig
    );
    if (!gigCheck.allowed) {
      errors.push(gigCheck.reasonTh ?? UI_TEXT.LIFESTYLE.minorSideGigNoRecord);
    }
  }

  if (ageYears < 18) {
    if (allocation.nightlife > 0) {
      errors.push('ผู้เยาว์อายุต่ำกว่า 18 ปี ห้ามจัดชั่วโมงสังสรรค์ยามค่ำคืน (ต้องเป็น 0 ชม.)');
    }
    if (allocation.workOrStudy + allocation.sideGig > AGE_LEGAL_RULES.minorMaxWeeklyWorkHours) {
      errors.push(
        `ผู้เยาว์อายุต่ำกว่า 18 ปี จัดเวลาเรียน งานหลัก และงานเสริมรวมกันได้ไม่เกิน ${AGE_LEGAL_RULES.minorMaxWeeklyWorkHours} ชม./สัปดาห์`
      );
    }
  }

  if (ageYears < 4 && (allocation.workOrStudy > 0 || allocation.sideGig > 0)) {
    errors.push('วัยทารกและเตาะแตะยังไม่สามารถจัดชั่วโมงงานหรือเรียนได้');
  }

  return {
    valid: errors.length === 0,
    totalHours,
    errors,
  };
}

/**
 * Sanitizes an existing or loaded TimeAllocation against current age and sideGigRecord rules.
 * Strips invalid sideGig hours and records a clear reason in the Event Log if trimmed (Spec 05 §3).
 */
export function sanitizeTimeAllocation(
  state: GameState,
  alloc?: TimeAllocation,
  recordLogs = true
): { state: GameState; allocation: TimeAllocation; trimmedSideGigReason?: string } {
  if (state.planner?.grid) {
    const derived = deriveWeeklyAllocation(state.planner.grid, state);
    return {
      state: {
        ...state,
        timeAllocation: derived,
      },
      allocation: derived,
    };
  }

  const ageYears = state.character.ageYears;
  const raw: TimeAllocation = alloc
    ? { ...getDefaultTimeAllocation(ageYears), ...alloc }
    : getDefaultTimeAllocation(ageYears);

  let trimmedSideGigReason: string | undefined;
  if (raw.sideGig > 0) {
    const check = checkSideGigEligibility({ ...state, timeAllocation: raw }, raw.sideGig);
    if (!check.allowed) {
      const clampedGig = Math.min(raw.sideGig, Math.max(0, check.maxHours));
      if (clampedGig !== raw.sideGig) {
        raw.sideGig = clampedGig;
        trimmedSideGigReason = check.reasonTh ?? UI_TEXT.LIFESTYLE.minorSideGigNoRecord;
      }
    }
  }

  const balanced = balanceAllocationTo168(raw, ageYears, state);
  let nextState: GameState = {
    ...state,
    timeAllocation: balanced,
  };

  if (trimmedSideGigReason && recordLogs) {
    nextState = appendTimeline(nextState, {
      category: 'life',
      title: 'ปรับตารางเวลางานเสริมอัตโนมัติ',
      description: `ตัดชั่วโมงงานเสริมออกตามเกณฑ์: ${trimmedSideGigReason}`,
    });
  }

  return { state: nextState, allocation: balanced, trimmedSideGigReason };
}

export function getDominantNightDaypart(allocation?: TimeAllocation): 'night' | undefined {
  if (!allocation) return undefined;
  if (
    allocation.nightlife >= TIME_ALLOC_BALANCE.nightlifeDominantMinHours &&
    allocation.nightlife >= allocation.social &&
    allocation.nightlife >= allocation.hobby &&
    allocation.nightlife >= allocation.selfDev
  ) {
    return 'night';
  }
  return undefined;
}

export function getJobContractWeeklyHours(jobId: string): number {
  const job = JOBS[jobId];
  if (!job || job.shift === 'none' || job.workHoursPerDay <= 0) return 0;
  return job.workHoursPerDay * (job.weekendOff ? 5 : 6);
}

export function previewTimeAllocationEffects(
  state: GameState,
  allocation: TimeAllocation
): TimeAllocationPreview {
  const { character, economy } = state;
  const stageId = getLifeSubStageId(character.ageYears);
  const job = JOBS[economy.jobId] ?? JOBS.unemployed;
  const overworkLimit = STAGE_OVERWORK_THRESHOLD[stageId];
  const totalWorkHours = allocation.workOrStudy + (allocation.sideGig ?? 0);
  const overworkHours = Math.max(0, totalWorkHours - overworkLimit);
  const isOverworking = character.ageYears >= 15 && overworkHours > 0;

  const sleepDiffPerDay = (allocation.sleep - TIME_ALLOC_BALANCE.optimalSleepHours) / 7;
  const energyFromSleep = sleepDiffPerDay * TIME_ALLOC_BALANCE.energyPerSleepDiffHour;
  const energyCostNight = (allocation.nightlife / 7) * TIME_ALLOC_BALANCE.nightlifeEnergyPenaltyPerHour;
  const energyCostSideGig =
    ((allocation.sideGig ?? 0) / 7) * TIME_ALLOC_BALANCE.sideGigEnergyPenaltyPerHour;
  const energyDeltaPerDay = round2(
    energyFromSleep - energyCostNight - energyCostSideGig - overworkHours * 0.08
  );

  const sleepDeficit = Math.max(0, TIME_ALLOC_BALANCE.optimalSleepHours - allocation.sleep);
  const stressFromSleep = (sleepDeficit / 7) * TIME_ALLOC_BALANCE.stressPerSleepDeficitHour;
  const stressFromOverwork = (overworkHours / 7) * TIME_ALLOC_BALANCE.overworkStressPerExtraHour;
  const stressFromSideGig =
    ((allocation.sideGig ?? 0) / 7) * TIME_ALLOC_BALANCE.sideGigStressPerHour;
  const stressRelief =
    (allocation.hobby / 7) * TIME_ALLOC_BALANCE.hobbyStressReliefPerHour +
    (allocation.family / 7) * TIME_ALLOC_BALANCE.familyStressReliefPerHour +
    (allocation.nightlife / 7) * TIME_ALLOC_BALANCE.nightlifeStressReliefPerHour;
  const stressDeltaPerDay = round2(
    stressFromSleep + stressFromOverwork + stressFromSideGig - stressRelief * 0.4
  );

  // Main job OT strictly gated: 18+, real paid job, job.allowsOvertime !== false
  const contractHours = getJobContractWeeklyHours(economy.jobId);
  const otImpactFromGrid = state.planner?.grid
    ? computeOvertimeWeeklyImpact(state.planner.grid, state)
    : null;
  const nightImpact = computeNightShiftWeeklyImpact(state);
  const freelancePreview = computeFreelanceWeeklyPreview(state.planner?.grid, state);

  let overtimeHours = 0;
  if (state.planner?.grid) {
    overtimeHours = countOvertimeHoursPerWeek(state.planner.grid, state);
  } else if (contractHours > 0) {
    overtimeHours = Math.max(0, allocation.workOrStudy - contractHours);
  }

  const canDoOvertime =
    character.ageYears >= 18 &&
    economy.monthlySalary > 0 &&
    job.shift !== 'none' &&
    job.allowsOvertime !== false &&
    overtimeHours > 0;

  const overtimePayPerWeek = otImpactFromGrid
    ? otImpactFromGrid.otPayPerWeek
    : canDoOvertime
      ? Math.round((economy.monthlySalary / Math.max(120, contractHours * 4)) * 1.5 * overtimeHours)
      : 0;
  void nightImpact;
  void freelancePreview;

  // Side-gig weekly pay strictly gated via single eligibility helper + valid sideGigRecord
  const gigHours = allocation.sideGig ?? 0;
  const baseGigCheck =
    gigHours > 0
      ? checkSideGigEligibility({ ...state, timeAllocation: allocation })
      : { allowed: false, maxHours: 0 };
  const payableGigHours =
    gigHours > 0 && baseGigCheck.allowed && state.sideGigRecord
      ? Math.min(gigHours, baseGigCheck.maxHours)
      : 0;
  const sideGigIncomePerWeek =
    payableGigHours > 0 && state.sideGigRecord
      ? Math.round(payableGigHours * state.sideGigRecord.hourlyPay)
      : 0;

  const costRes = state.planner?.grid
    ? resolveAffordableWeeklyActivities(state, state.planner.grid)
    : null;
  const nightlifeCostPerWeek =
    character.ageYears >= 18
      ? costRes
        ? costRes.totalWeeklyCost
        : Math.round(allocation.nightlife * TIME_ALLOC_BALANCE.nightlifeCostPerHour * 0.5)
      : 0;

  const warningsTh: string[] = [];
  if (isOverworking) {
    warningsTh.push(
      `ทำงาน/เรียนเกินเกณฑ์สมดุล (${overworkHours} ชม./สัปดาห์) ความเครียดสะสมและความอึดจะลดลง`
    );
  }
  if (sleepDeficit >= 10) {
    warningsTh.push('เวลานอนน้อยกว่าเกณฑ์ 8 ชม./วัน ร่างกายจะฟื้นฟูพลังช้าลง');
  }
  if (allocation.nightlife >= TIME_ALLOC_BALANCE.nightlifeDominantMinHours && character.ageYears >= 18) {
    warningsTh.push('กิจกรรมกลางคืนโดดเด่น: ฉากหลักจะสลับเข้าสู่บรรยากาศกลางคืน');
  }

  return {
    energyDeltaPerDay,
    stressDeltaPerDay,
    overtimePayPerWeek,
    sideGigIncomePerWeek,
    nightlifeCostPerWeek,
    isOverworking,
    overworkHours,
    warningsTh,
    resultingDaypartHint: getDominantNightDaypart(allocation) === 'night' ? 'night' : 'normal',
  };
}

/**
 * Applies weekly Time Allocation impacts (overwork health degradation, OT salary, gated sideGig income,
 * planner weekly paid activity costs with free-activity fallback when cash is insufficient,
 * and behavioral evidence from the grid + preset).
 */
export function applyWeeklyTimeAllocation(state: GameState, recordLogs = true): GameState {
  if (!state.character.isAlive) return state;

  const sanitized = sanitizeTimeAllocation(state, state.timeAllocation, recordLogs);
  let currentState = sanitized.state;
  const alloc = sanitized.allocation;

  if (currentState.planner) {
    currentState = {
      ...currentState,
      planner: {
        ...currentState.planner,
        lastCostFallbackReasonTh: undefined,
      },
    };
  }

  const preview = previewTimeAllocationEffects(currentState, alloc);
  const otImpact = computeOvertimeWeeklyImpact(currentState.planner?.grid, currentState);
  const nightImpact = computeNightShiftWeeklyImpact(currentState);
  const freelancePreview = computeFreelanceWeeklyPreview(currentState.planner?.grid, currentState);
  const { character, economy } = currentState;

  const effects: Effect[] = [];

  if (preview.isOverworking) {
    const extra = preview.overworkHours;
    effects.push({
      type: 'ChangeResource',
      resource: 'stress',
      delta: round2(clamp(extra * 0.25, 0.5, 5)),
      reason: `ทำงานหนักเกินกำลัง (${alloc.workOrStudy + alloc.sideGig} ชม./สัปดาห์)`,
    });
    effects.push({
      type: 'ChangeRawStat',
      stat: 'endurance',
      delta: -round2(
        clamp(extra * TIME_ALLOC_BALANCE.overworkEndurancePenaltyPerExtraHour * 0.35, 0.05, 0.45)
      ),
      reason: 'พักผ่อนไม่พอจากภาระงานเกินเกณฑ์',
    });
  }

  // Dual-Track Gameplay: Routine Activity-based Progression & Maintenance (Spec 05 / User Direction)
  // Weekly micro-progression from lifestyle activities, with weekly capping per stat (0.25 max/wk)
  const activePlannerGrid = currentState.planner?.grid;
  if (activePlannerGrid) {
    let exerciseCount = 0;
    let sleepFullCount = 0;
    let selfStudyCount = 0;
    let hobbyCount = 0;
    let socialCount = 0;
    let familyQuietCount = 0;
    let regularWorkCount = 0;

    for (const dt of ALL_DAY_TYPES) {
      const weight = DAY_TYPE_WEIGHTS[dt];
      for (const slot of ALL_SLOTS) {
        const actId = resolveEffectiveSlotActivityId(activePlannerGrid, dt, slot, currentState);
        if (actId === 'workout') exerciseCount += weight;
        else if (actId === 'sleep_full') sleepFullCount += weight;
        else if (actId === 'skincare_grooming') sleepFullCount += weight * 0.7;
        else if (actId === 'self_study' || actId === 'attend_course' || actId === 'field_practice' || actId === 'read_review') {
          selfStudyCount += weight;
        } else if (actId === 'hobby_leisure') hobbyCount += weight;
        else if (actId === 'meet_friends' || actId === 'party_night') socialCount += weight;
        else if (actId === 'family_time' || actId === 'quiet_rest' || actId === 'health_check_rest') familyQuietCount += weight;
        else if (actId === 'work_shift' || actId === 'school_class' || actId === 'flexible_work') regularWorkCount += weight;
      }
    }

    const strengthGain = round2(clamp(exerciseCount * 0.04, 0, 0.25));
    const enduranceGain = round2(clamp(exerciseCount * 0.04 + sleepFullCount * 0.03, 0, 0.25));
    const looksGain = round2(clamp(sleepFullCount * 0.03, 0, 0.20));
    const witGain = round2(clamp(selfStudyCount * 0.035, 0, 0.25));
    const memoryGain = round2(clamp(selfStudyCount * 0.035, 0, 0.25));
    const creativityGain = round2(clamp(hobbyCount * 0.04, 0, 0.25));
    const eqGain = round2(clamp(familyQuietCount * 0.03 + hobbyCount * 0.015, 0, 0.25));
    const charismaGain = round2(clamp(socialCount * 0.04, 0, 0.25));
    const reliabilityGain = round2(
      clamp(regularWorkCount * 0.015 + familyQuietCount * 0.015, 0, 0.25)
    );

    if (strengthGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'strength',
        delta: strengthGain,
        reason: 'ออกกำลังกายสม่ำเสมอช่วยพยุงความแข็งแรง',
      });
    }
    if (enduranceGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'endurance',
        delta: enduranceGain,
        reason: 'รักษาสุขภาพและนอนเต็มอิ่มช่วยพยุงความอึด',
      });
    }
    if (looksGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'looks',
        delta: looksGain,
        reason: 'การนอนเต็มอิ่มช่วยฟื้นฟูผิวพรรณและความสดชื่น',
      });
    }
    if (witGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'wit',
        delta: witGain,
        reason: 'การอ่านหนังสือและฝึกฝนตนเองช่วยขัดเกลาไหวพริบ',
      });
    }
    if (memoryGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'memory',
        delta: memoryGain,
        reason: 'ทบทวนเนื้อหาและเรียนรู้สิ่งใหม่ช่วยลับความจำ',
      });
    }
    if (creativityGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'creativity',
        delta: creativityGain,
        reason: 'ทำงานอดิเรกสร้างสรรค์ช่วยเปิดมุมมองใหม่',
      });
    }
    if (eqGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'eq',
        delta: eqGain,
        reason: 'เวลาคุณภาพกับครอบครัวและการพักผ่อนช่วยเสริมวุฒิภาวะอารมณ์',
      });
    }
    if (charismaGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'charisma',
        delta: charismaGain,
        reason: 'การพบปะเพื่อนฝูงเข้าสังคมช่วยเพิ่มเสน่ห์การพูด',
      });
    }
    if (reliabilityGain > 0) {
      effects.push({
        type: 'ChangeRawStat',
        stat: 'reliability',
        delta: reliabilityGain,
        reason: 'การทำหน้าที่และรับผิดชอบภารกิจช่วยเพิ่มความน่าเชื่อถือ',
      });
    }
  }

  if (otImpact.otSessions > 0) {
    effects.push({
      type: 'ChangeResource',
      resource: 'stress',
      delta: otImpact.stressDeltaPerWeek,
      reason: 'ทำโอทีหลังเลิกงานเพิ่มความเครียดสะสม',
    });
    effects.push({
      type: 'ChangeResource',
      resource: 'energy',
      delta: otImpact.energyDeltaPerWeek,
      reason: 'ทำโอทีใช้พลังงานร่างกายเพิ่มขึ้น',
    });
  }

  if (nightImpact.isNightShift && nightImpact.stressDeltaPerWeek > 0) {
    effects.push({
      type: 'ChangeResource',
      resource: 'stress',
      delta: nightImpact.stressDeltaPerWeek,
      reason: 'การทำงานกะดึกต่อเนื่องรบกวนจังหวะพักผ่อน',
    });
  }

  if (preview.overtimePayPerWeek > 0) {
    effects.push({
      type: 'AddMoney',
      amount: preview.overtimePayPerWeek,
      category: 'salary',
      reason: 'ค่าล่วงเวลา (OT) จากงานประจำ',
    });
  }

  if (preview.sideGigIncomePerWeek > 0 && character.resources.energy > 15) {
    effects.push({
      type: 'AddMoney',
      amount: preview.sideGigIncomePerWeek,
      category: 'side',
      reason: `รายได้จากงานเสริม (${currentState.sideGigRecord?.title ?? 'พาร์ตไทม์'})`,
    });
  }

  // Freelance seeded weekly income (0.8..1.2 of expected) + stress
  let nextRngState = currentState.rngState;
  if (freelancePreview.freelanceSlots > 0) {
    const roll = nextRandom(nextRngState);
    nextRngState = roll.rngState;
    const factor = 0.8 + roll.value * 0.4;
    const freelancePay = Math.round(freelancePreview.expectedIncomePerWeek * factor);
    if (freelancePay > 0) {
      effects.push({
        type: 'AddMoney',
        amount: freelancePay,
        category: 'side',
        reason: 'รายได้จากงานฟรีแลนซ์ประจำสัปดาห์',
      });
    }
    if (freelancePreview.stressDeltaPerWeek > 0) {
      effects.push({
        type: 'ChangeResource',
        resource: 'stress',
        delta: freelancePreview.stressDeltaPerWeek,
        reason: 'ความกดดันจากการส่งงานฟรีแลนซ์ตามกำหนด',
      });
    }
  }

  // Apply cash-gated activity costs from Life Planner grid (or legacy nightlife fallback)
  let costRes: ReturnType<typeof resolveAffordableWeeklyActivities> | null = null;
  if (currentState.planner?.grid) {
    costRes = resolveAffordableWeeklyActivities(currentState, currentState.planner.grid);
    if (character.ageYears >= 15 && costRes.affordableCost > 0) {
      effects.push({
        type: 'AddMoney',
        amount: -costRes.affordableCost,
        category: 'living',
        reason: 'ค่าใช้จ่ายกิจกรรมตามตารางแผนชีวิตประจำสัปดาห์',
      });
    }
  } else if (preview.nightlifeCostPerWeek > 0 && economy.cash >= preview.nightlifeCostPerWeek) {
    effects.push({
      type: 'AddMoney',
      amount: -preview.nightlifeCostPerWeek,
      category: 'living',
      reason: 'ค่าใช้จ่ายสังสรรค์ยามค่ำคืนประจำสัปดาห์',
    });
  }

  let next = effects.length > 0 ? applyEffects(currentState, effects, recordLogs) : currentState;
  if (nextRngState !== next.rngState) {
    next = {
      ...next,
      rngState: nextRngState,
    };
  }

  // Update employment overtime streak & cumulative family-relationship impact
  const emp = resolveEmploymentState(next);
  const nextOtStreak = otImpact.otSessions > 0 ? (emp.overtimeStreakWeeks ?? 0) + 1 : 0;
  const weeklyFamilyDelta = otImpact.familyRelDeltaPerWeek + nightImpact.familyRelDeltaPerWeek;
  const prevFamilyOffset = emp.shiftFamilyRelOffset ?? 0;
  let nextFamilyOffset = prevFamilyOffset;
  if (weeklyFamilyDelta < 0) {
    nextFamilyOffset = clamp(prevFamilyOffset + weeklyFamilyDelta, -20, 0);
  } else if (!nightImpact.isNightShift && otImpact.otSessions === 0 && alloc.family >= 12) {
    nextFamilyOffset = clamp(prevFamilyOffset + 1, -20, 0);
  }
  next = {
    ...next,
    employment: {
      ...emp,
      overtimeStreakWeeks: nextOtStreak,
      shiftFamilyRelOffset: nextFamilyOffset,
    },
  };

  // Record insufficient-cash free fallback reason in timeline and on planner state (for Explain "ทำไม?")
  if (costRes && costRes.hadInsufficientCash && character.ageYears >= 15) {
    const desc =
      costRes.fallbackReasonTh ??
      'เงินสดไม่พอจ่ายค่ากิจกรรมบางช่อง จึงสลับเป็นกิจกรรมฟรีโดยอัตโนมัติ';
    if (next.planner) {
      next = {
        ...next,
        planner: {
          ...next.planner,
          lastCostFallbackReasonTh: desc,
        },
      };
    }
    if (recordLogs) {
      next = appendTimeline(next, {
        category: 'finance',
        title: UI_TEXT.PLANNER.cashInsufficientLogTitle,
        description: desc,
        explainReason: desc,
      });
    }
  }

  // Behavioral evidence collection from weekly time allocation & grid activities
  const evidenceBatch: Record<string, number> = {};
  const stageId = getLifeSubStageId(character.ageYears);
  const overworkThreshold = STAGE_OVERWORK_THRESHOLD[stageId];

  if (
    character.ageYears >= 15 &&
    (alloc.workOrStudy + alloc.sideGig >= 58 ||
      otImpact.otHoursPerWeek >= 16 ||
      otImpact.otSessions >= 2)
  ) {
    evidenceBatch.overwork = 2.2;
    evidenceBatch.endurance_work = 1.0;
  } else if (character.ageYears >= 12 && alloc.workOrStudy >= 38 && alloc.selfDev >= 10) {
    evidenceBatch.self_discipline = 1.3;
    evidenceBatch.endurance_work = 0.7;
  }

  const activeFocusId =
    character.ageYears >= ANNUAL_FOCUS_CONFIG.minAge
      ? (next.planner?.annualFocus?.current ?? 'none')
      : 'none';
  const focusDef = ANNUAL_FOCUS_BY_ID.get(activeFocusId);
  const alignedActivitySet = new Set(focusDef?.alignedActivityIds ?? []);
  const focusEvidenceMult = 1 + ANNUAL_FOCUS_CONFIG.alignedEvidenceBonusPct;

  if (otImpact.hardWorkingEvidence > 0) {
    const otMult = alignedActivitySet.has('overtime_work') ? focusEvidenceMult : 1;
    evidenceBatch.hardWorking = round2(
      (evidenceBatch.hardWorking ?? 0) + otImpact.hardWorkingEvidence * otMult
    );
  }
  if (nextOtStreak >= 3 && otImpact.otSessions > 0) {
    evidenceBatch.workaholic = round2((evidenceBatch.workaholic ?? 0) + 1);
  }
  if (freelancePreview.freelanceSlots > 0) {
    const flMult = alignedActivitySet.has('freelance_work') ? focusEvidenceMult : 1;
    evidenceBatch.independent = round2(
      (evidenceBatch.independent ?? 0) + freelancePreview.independentEvidence * flMult
    );
    evidenceBatch.creative = round2(
      (evidenceBatch.creative ?? 0) + freelancePreview.creativeEvidence * flMult
    );
  }

  if (alloc.social + alloc.nightlife >= TIME_ALLOC_BALANCE.socialButterflyWeeklyHours) {
    evidenceBatch.social_fun = 1.6;
    evidenceBatch.peer_follow = 1.2;
  } else if (
    alloc.social + alloc.nightlife <= TIME_ALLOC_BALANCE.hermitMaxSocialPlusNightlife &&
    alloc.hobby >= TIME_ALLOC_BALANCE.hermitMinHobbyHours
  ) {
    evidenceBatch.solitude = 1.8;
    evidenceBatch.hobby_focus = 1.4;
  }

  if (alloc.hobby >= 18) {
    evidenceBatch.hobby_focus = (evidenceBatch.hobby_focus ?? 0) + 0.9;
  }
  if (alloc.family >= 20) {
    evidenceBatch.family_time = 1.4;
  }
  if (alloc.selfDev >= 14) {
    evidenceBatch.self_discipline = (evidenceBatch.self_discipline ?? 0) + 1.2;
    evidenceBatch.practice_any = 0.8;
  } else if (alloc.selfDev <= 3 && alloc.workOrStudy <= 30 && character.ageYears >= 10) {
    evidenceBatch.avoidance = 0.9;
  }

  if (character.ageYears >= 18 && alloc.nightlife >= 8) {
    evidenceBatch.night_out = round2(alloc.nightlife / 6);
    evidenceBatch.nightlife_social = round2(alloc.nightlife / 8);
  }

  if (
    alloc.sleep >= TIME_ALLOC_BALANCE.optimalSleepHours &&
    alloc.workOrStudy + alloc.sideGig <= overworkThreshold
  ) {
    evidenceBatch.rest_recovery = 1.0;
  }

  // Record specific activity evidence from grid (respecting cash-insufficient swaps + Annual Focus +10% bonus)
  if (next.planner?.grid) {
    const swapLookup = new Map<string, ActivityId>();
    for (const sw of costRes?.swappedSlots ?? []) {
      swapLookup.set(`${sw.dayType}:${sw.slot}`, sw.toActivityId);
    }
    for (const dayType of ALL_DAY_TYPES) {
      const w = DAY_TYPE_WEIGHTS[dayType];
      for (const slot of ALL_SLOTS) {
        if (isSlotLocked(dayType, slot, next).locked) continue;
        const effectiveActId =
          swapLookup.get(`${dayType}:${slot}`) ??
          resolveEffectiveSlotActivityId(next.planner.grid, dayType, slot, next);
        if (effectiveActId === 'overtime_work' || effectiveActId === 'freelance_work') {
          continue;
        }
        const def = ACTIVITIES_BY_ID.get(effectiveActId);
        if (def?.evidenceKey) {
          const actMult = alignedActivitySet.has(effectiveActId) ? focusEvidenceMult : 1;
          evidenceBatch[def.evidenceKey] = round2(
            (evidenceBatch[def.evidenceKey] ?? 0) + 0.14 * w * actMult
          );
        }
      }
    }
  }

  // Add weekly evidence from active lifestyle preset (if not custom)
  const presetId = next.lifestylePresetId;
  if (presetId && presetId !== 'custom') {
    const preset = LIFESTYLE_PRESETS_BY_ID.get(presetId);
    if (preset) {
      for (const [evKey, amt] of Object.entries(preset.evidencePerWeek)) {
        evidenceBatch[evKey] = round2((evidenceBatch[evKey] ?? 0) + amt);
      }
      if (presetId === 'skill_grind') {
        for (const fSkill of next.skillTraining?.focus ?? []) {
          evidenceBatch[`practice_${fSkill}`] = round2(
            (evidenceBatch[`practice_${fSkill}`] ?? 0) + 0.8
          );
        }
      }
    }
  }

  next = recordEvidenceBatch(next, evidenceBatch, { reason: 'จัดสรรเวลาประจำสัปดาห์' });

  // Phase 3.3.1: Track activity skill tags for hidden skill discovery & advance limitation cure progress
  if (next.planner?.grid) {
    const swapLookup = new Map<string, ActivityId>();
    for (const sw of costRes?.swappedSlots ?? []) {
      swapLookup.set(`${sw.dayType}:${sw.slot}`, sw.toActivityId);
    }
    const tagUsage = new Map<ActivitySkillTagId, { sessions: number; hours: number }>();
    let workoutHours = 0;
    let craftOrCookHours = 0;
    let restHours = 0;

    for (const dayType of ALL_DAY_TYPES) {
      const w = DAY_TYPE_WEIGHTS[dayType];
      for (const slot of ALL_SLOTS) {
        if (isSlotLocked(dayType, slot, next).locked) continue;
        const effectiveActId =
          swapLookup.get(`${dayType}:${slot}`) ??
          resolveEffectiveSlotActivityId(next.planner.grid, dayType, slot, next);
        const def = ACTIVITIES_BY_ID.get(effectiveActId);
        if (!def) continue;
        const slotHrs =
          (slot === 'night'
            ? SLOT_HOURS.night + NIGHT_AWAKE_SLEEP_PENALTY_HOURS
            : SLOT_HOURS[slot]) * w;

        if (effectiveActId === 'workout' || effectiveActId === 'advanced_competition') {
          workoutHours += slotHrs;
        }
        if (effectiveActId === 'quiet_rest' || effectiveActId === 'health_check_rest') {
          restHours += slotHrs;
        }

        const customTag =
          next.planner.activitySkillTags?.[
            effectiveActId as keyof NonNullable<typeof next.planner.activitySkillTags>
          ];
        const activeTag = customTag ?? def.defaultSkillTags?.[0];
        if (activeTag) {
          if (activeTag === 'tag_make' || activeTag === 'tag_cook') {
            craftOrCookHours += slotHrs;
          }
          const prev = tagUsage.get(activeTag) ?? { sessions: 0, hours: 0 };
          tagUsage.set(activeTag, {
            sessions: prev.sessions + w,
            hours: prev.hours + slotHrs,
          });
        }
      }
    }

    for (const [tagId, usage] of tagUsage.entries()) {
      next = recordActivitySkillTagProgress(
        next,
        tagId,
        usage.sessions,
        usage.hours,
        recordLogs
      );
    }

    next = advanceLimitationCureProgress(next, {
      selfDevHours: alloc.selfDev,
      sleepHours: alloc.sleep,
      socialHours: alloc.social,
      workoutHours,
      craftOrCookPracticeHours: craftOrCookHours,
      restHours,
      hasActiveCourse: Boolean(next.skillTraining?.course && next.skillTraining.course.weeksLeft > 0),
    });
  } else {
    next = advanceLimitationCureProgress(next, {
      selfDevHours: alloc.selfDev,
      sleepHours: alloc.sleep,
      socialHours: alloc.social,
      workoutHours: 0,
      craftOrCookPracticeHours: 0,
      restHours: alloc.hobby * 0.4,
      hasActiveCourse: Boolean(next.skillTraining?.course && next.skillTraining.course.weeksLeft > 0),
    });
  }

  return next;
}
