import {
  ACTIVITIES_BY_ID,
  ACTIVITY_CATALOG,
  type ActivityDef,
} from '../data/activities';
import { ANNUAL_FOCUS_BY_ID, ANNUAL_FOCUS_CONFIG, ANNUAL_FOCUS_LIST } from '../data/annualFocus';
import { AGE_LEGAL_RULES } from '../data/lifeStages';
import { LIFESTYLE_PRESETS_BY_ID } from '../data/lifestylePresets';
import {
  getTemplateForPresetAndArchetype,
  type PlannerArchetype,
} from '../data/lifestyleTemplates';
import sceneManifestRaw from '../data/sceneManifest.json';
import { SKILL_TRAINING_CONFIG, SKILL_UNLOCK_RULES } from '../data/skillTraining';
import {
  ALL_DAY_TYPES,
  ALL_SLOTS,
  BASE_DAILY_SLEEP_AND_ROUTINE_HOURS,
  DAY_TYPE_WEIGHTS,
  NIGHT_AWAKE_SLEEP_PENALTY_HOURS,
  NIGHT_SLEEP_VARIANTS,
  OVERTIME_EXTRA_HOURS_PER_NIGHT_SLOT,
  SLOT_HOURS,
} from '../data/slotHours';
import { createEmploymentForJob, JOBS, SKILL_LABELS, WORK_SHIFT_LABELS_TH } from '../data/thaiData';
import {
  STAGE_MIN_SLEEP_HOURS,
  STAGE_OVERWORK_THRESHOLD,
  TIME_ALLOC_BALANCE,
  TOTAL_WEEKLY_HOURS,
} from '../data/timeAlloc';
import { UI_TEXT } from '../data/uiText';
import {
  advanceOneDay,
  getDaysInMonth,
  isThaiPublicHoliday,
  isThaiSchoolBreak,
} from './clock';
import { checkSideGigEligibility } from './economy';
import { canEnterNightlife, getLifeStageForAge, getLifeSubStageId } from './lifeStage';
import { appendTimeline } from './log';
import { clamp, round2 } from './rng';
import { createInitialSkillTrainingState, getSkillGrowthDetails, isTier3Unlocked } from './skillTraining';
import type {
  ActivityId,
  ActivityMajorGroup,
  AnnualFocusId,
  AnnualFocusState,
  CalendarPin,
  DayType,
  EmploymentState,
  GameDate,
  GameState,
  LifestylePresetId,
  PendingEventPrompt,
  PlannerGrid,
  PlannerState,
  PlannerStreakState,
  SkillKey,
  Slot,
  TimeAllocCategory,
  TimeAllocation,
  WorkShiftSchedule,
} from './types';

interface ManifestSceneLite {
  id: string;
  nameTh: string;
  category: string;
}

const MANIFEST_SCENES = ((sceneManifestRaw as unknown as { scenes: ManifestSceneLite[] }).scenes ?? []);
const SCENE_NAME_BY_ID: ReadonlyMap<string, string> = new Map(
  MANIFEST_SCENES.map((s) => [s.id, s.nameTh])
);

export interface SlotLockInfo {
  locked: boolean;
  activityId?: ActivityId;
  reasonTh?: string;
}

export interface ActivityAvailabilityResult {
  visible: boolean;
  allowed: boolean;
  reasonTh?: string;
  unlockHintTh?: string;
}

export interface PlannerValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  derivedAllocation: TimeAllocation;
}

export interface WeeklyCostResolution {
  totalWeeklyCost: number;
  affordableCost: number;
  hadInsufficientCash: boolean;
  swappedSlots: Array<{
    dayType: DayType;
    slot: Slot;
    fromActivityId: ActivityId;
    toActivityId: ActivityId;
    fromNameTh: string;
    toNameTh: string;
    savedCostPerSlot: number;
  }>;
  fallbackReasonTh?: string;
}

export interface SlotChainInfo {
  isChained: boolean;
  role?: 'start' | 'end';
  chainedWithSlot?: Slot;
  chainType?: 'overtime' | 'shift';
  noticeTh?: string;
  lockReasonTh?: string;
}

export interface PlannerImpactPreview {
  derivedAllocation: TimeAllocation;
  validation: PlannerValidationResult;
  energyArrow: 'up' | 'down' | 'neutral';
  stressArrow: 'up' | 'down' | 'neutral';
  relationshipArrow: 'up' | 'down' | 'neutral';
  energyDeltaPerDay: number;
  stressDeltaPerDay: number;
  overtimePayPerWeek: number;
  freelanceExpectedIncomePerWeek: number;
  nightShiftBonusPerWeek: number;
  familyRelDeltaPerWeek: number;
  workShiftLabelTh?: string;
  otSlotsCount: number;
  otHoursPerWeek: number;
  otLimitExceeded: boolean;
  sideGigIncomePerWeek: number;
  activityCostPerWeek: number;
  netMoneyPerWeek: number;
  isOverworking: boolean;
  overworkHours: number;
  resultingDaypartHint: 'night' | 'normal';
  focusedSkillsSummary: Array<{
    skillId: SkillKey;
    labelTh: string;
    level: number;
    effectiveCap: number;
    atCap: boolean;
    estimatedWeeklyGain: number;
    unlockHintTh: string;
  }>;
  scenesToSee: string[];
  warningsTh: string[];
}

export function clonePlannerGrid(grid: PlannerGrid): PlannerGrid {
  return {
    weekday: { ...grid.weekday },
    weekend: { ...grid.weekend },
  };
}

export function isHospitalAdmitted(state: GameState): boolean {
  const mode = state.sceneMode;
  if (!mode || mode.sceneId !== 'hospital') return false;
  if (mode.expiresAtTotalDay === undefined) return true;
  return state.date.totalDays < mode.expiresAtTotalDay;
}

export function getArchetypeForState(state: GameState): PlannerArchetype {
  const age = state.character.ageYears;
  const jobId = state.economy.jobId || 'unemployed';

  if (age < 6 || jobId === 'infant') return 'infant';
  if (age < 13) return 'school_kid';
  if (age < 18) return 'teen';
  if (age >= 60 && (jobId === 'unemployed' || jobId === 'student' || jobId === 'infant')) {
    return 'senior';
  }
  if (jobId !== 'unemployed' && jobId !== 'student' && jobId !== 'infant') {
    return 'adult_worker';
  }
  return 'adult_unemployed';
}

export function resolveEmploymentState(state: GameState): EmploymentState {
  const jobId = state.economy.jobId || 'unemployed';
  const existing = state.employment;
  if (existing && existing.jobId === jobId) {
    return existing;
  }
  return createEmploymentForJob(jobId, undefined, existing);
}

export function getLockedWeekdaySlotsForJob(
  jobId: string,
  age: number,
  workShiftOverride?: WorkShiftSchedule
): Slot[] {
  if (age < 6 || jobId === 'infant') {
    return ['morning', 'afternoon', 'evening', 'night'];
  }
  if (jobId === 'student') {
    return ['morning', 'afternoon'];
  }
  const job = JOBS[jobId];
  if (!job || job.shift === 'none') return [];

  const shift = workShiftOverride ?? job.defaultWorkShift ?? 'morning-afternoon';
  if (job.shift === 'day_long' && shift === 'morning-afternoon') {
    return ['morning', 'afternoon', 'evening'];
  }
  switch (shift) {
    case 'morning-afternoon':
      return ['morning', 'afternoon'];
    case 'afternoon-evening':
      return ['afternoon', 'evening'];
    case 'night-morning':
      return age >= 18 ? ['night', 'morning'] : ['afternoon', 'evening'];
    case 'flexible':
      return [];
    default:
      return ['morning', 'afternoon'];
  }
}

export function isSlotLocked(dayType: DayType, slot: Slot, state: GameState): SlotLockInfo {
  const age = state.character.ageYears;
  const jobId = state.economy.jobId || 'unemployed';

  if (age < 6 || jobId === 'infant') {
    const infantBase = getTemplateForPresetAndArchetype('balanced', 'infant');
    return {
      locked: true,
      activityId: infantBase[dayType][slot],
      reasonTh: UI_TEXT.LIFESTYLE.infantManagedNotice,
    };
  }

  if (dayType === 'weekday') {
    if (jobId === 'student' && (slot === 'morning' || slot === 'afternoon')) {
      return {
        locked: true,
        activityId: 'school_class',
        reasonTh: age >= 18 ? 'ชั่วโมงเรียนตามตารางมหาวิทยาลัย' : 'ชั่วโมงเรียนภาคปกติของโรงเรียน',
      };
    }
    const emp = resolveEmploymentState(state);
    const job = JOBS[jobId];
    if (emp.status === 'employed' && job && job.shift !== 'none') {
      const lockedSlots = getLockedWeekdaySlotsForJob(jobId, age, emp.workShift);
      if (lockedSlots.includes(slot)) {
        const shiftDesc =
          job.shift === 'day_long' && emp.workShift === 'morning-afternoon'
            ? 'กะยาว (เช้า–เย็น)'
            : WORK_SHIFT_LABELS_TH[emp.workShift];
        return {
          locked: true,
          activityId: 'work_shift',
          reasonTh: `${shiftDesc} (${job.title})`,
        };
      }
    }
  }

  // Stub childcare slot lock when flags.has_child is enabled (Phase 4 full child system)
  if (
    dayType === 'weekend' &&
    slot === 'evening' &&
    age >= 18 &&
    Boolean(state.character.flags?.has_child)
  ) {
    return {
      locked: true,
      activityId: 'raise_child',
      reasonTh: 'เวลาดูแลลูกประจำสัปดาห์ (ล็อกตามภาระครอบครัว)',
    };
  }

  return { locked: false };
}

export function getSlotDailyHours(slot: Slot, actId: ActivityId): number {
  if (slot !== 'night') {
    return SLOT_HOURS[slot];
  }
  if (actId === 'sleep_full' || actId === 'sleep_normal') {
    return SLOT_HOURS.night;
  }
  const extra =
    actId === 'overtime_work'
      ? OVERTIME_EXTRA_HOURS_PER_NIGHT_SLOT
      : NIGHT_AWAKE_SLEEP_PENALTY_HOURS;
  return SLOT_HOURS.night + extra;
}

export function getSlotWeeklyHours(dayType: DayType, slot: Slot, actId: ActivityId): number {
  return getSlotDailyHours(slot, actId) * DAY_TYPE_WEIGHTS[dayType];
}

export function countOvertimeSlots(grid: PlannerGrid, state: GameState): number {
  let count = 0;
  for (const dt of ALL_DAY_TYPES) {
    for (const slot of ALL_SLOTS) {
      if (isSlotLocked(dt, slot, state).locked) continue;
      if (resolveEffectiveSlotActivityId(grid, dt, slot, state) === 'overtime_work') {
        count++;
      }
    }
  }
  return count;
}

export function countOvertimeHoursPerWeek(grid: PlannerGrid, state: GameState): number {
  let hours = 0;
  for (const dt of ALL_DAY_TYPES) {
    for (const slot of ALL_SLOTS) {
      if (isSlotLocked(dt, slot, state).locked) continue;
      if (resolveEffectiveSlotActivityId(grid, dt, slot, state) === 'overtime_work') {
        hours += getSlotWeeklyHours(dt, slot, 'overtime_work');
      }
    }
  }
  return hours;
}

export function computeOvertimeHourlyRate(state: GameState): number {
  const emp = resolveEmploymentState(state);
  if (
    state.character.ageYears < AGE_LEGAL_RULES.minAdultFullWorkAge ||
    emp.status !== 'employed' ||
    !emp.allowsOvertime
  ) {
    return 0;
  }
  const job = JOBS[emp.jobId] ?? JOBS.unemployed;
  const baseMonthlySalary =
    state.economy.monthlySalary > 0 ? state.economy.monthlySalary : job.monthlySalary;
  if (baseMonthlySalary <= 0) return 0;
  const monthlyContractHours = Math.max(120, emp.contractHoursPerWeek * 4);
  const hourlyWage = baseMonthlySalary / monthlyContractHours;
  return hourlyWage * 1.5;
}

export function countFreelanceSlots(grid: PlannerGrid, state: GameState): number {
  let count = 0;
  for (const dt of ALL_DAY_TYPES) {
    for (const slot of ALL_SLOTS) {
      if (isSlotLocked(dt, slot, state).locked) continue;
      if (resolveEffectiveSlotActivityId(grid, dt, slot, state) === 'freelance_work') {
        count++;
      }
    }
  }
  return count;
}

export function isNightChainedByEveningOT(
  _grid: PlannerGrid | undefined,
  _dayType: DayType,
  _slot: Slot,
  _state: GameState
): boolean {
  // Overtime connects downward from regular work (afternoon -> evening), NOT to night sleep
  return false;
}

export function hasDownwardChainConnector(
  grid: PlannerGrid | undefined,
  dayType: DayType,
  slot: Slot,
  state: GameState
): boolean {
  if (dayType !== 'weekday') return false;
  const emp = resolveEmploymentState(state);
  if (emp.status !== 'employed') return false;
  const job = JOBS[emp.jobId];
  const isDayLong = job?.shift === 'day_long' && emp.workShift === 'morning-afternoon';

  if (slot === 'morning') {
    return emp.workShift === 'morning-afternoon';
  }

  if (slot === 'afternoon') {
    if (isDayLong || emp.workShift === 'afternoon-evening') return true;
    if (
      emp.workShift === 'morning-afternoon' &&
      grid &&
      resolveEffectiveSlotActivityId(grid, 'weekday', 'evening', state) === 'overtime_work'
    ) {
      return true;
    }
    return false;
  }

  if (slot === 'evening') {
    if (
      (isDayLong || emp.workShift === 'afternoon-evening') &&
      grid &&
      resolveEffectiveSlotActivityId(grid, 'weekday', 'night', state) === 'overtime_work'
    ) {
      return true;
    }
    return false;
  }

  return false;
}

export function getSlotChainInfo(
  grid: PlannerGrid | undefined,
  dayType: DayType,
  slot: Slot,
  state: GameState
): SlotChainInfo {
  if (dayType !== 'weekday') return { isChained: false };

  const emp = resolveEmploymentState(state);
  const job = JOBS[emp.jobId];
  const isDayLong = job?.shift === 'day_long' && emp.workShift === 'morning-afternoon';
  const lock = isSlotLocked(dayType, slot, state);
  if (lock.locked && lock.activityId === 'work_shift' && emp.status === 'employed') {
    if (isDayLong) {
      if (slot === 'morning') {
        return { isChained: true, role: 'start', chainedWithSlot: 'afternoon', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
      if (slot === 'afternoon') {
        return { isChained: true, role: 'start', chainedWithSlot: 'evening', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
      if (slot === 'evening') {
        const nightId = grid ? resolveEffectiveSlotActivityId(grid, 'weekday', 'night', state) : undefined;
        if (nightId === 'overtime_work') {
          return { isChained: true, role: 'start', chainedWithSlot: 'night', chainType: 'overtime', noticeTh: 'มีกะโอทีต่อเนื่องช่วงดึก' };
        }
        return { isChained: true, role: 'end', chainedWithSlot: 'afternoon', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
    } else if (emp.workShift === 'morning-afternoon') {
      if (slot === 'morning') {
        return { isChained: true, role: 'start', chainedWithSlot: 'afternoon', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
      if (slot === 'afternoon') {
        const eveningId = grid ? resolveEffectiveSlotActivityId(grid, 'weekday', 'evening', state) : undefined;
        if (eveningId === 'overtime_work') {
          return { isChained: true, role: 'start', chainedWithSlot: 'evening', chainType: 'overtime', noticeTh: 'มีกะโอทีต่อเนื่องช่วงเย็น' };
        }
        return { isChained: true, role: 'end', chainedWithSlot: 'morning', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
    } else if (emp.workShift === 'afternoon-evening') {
      if (slot === 'afternoon') {
        return { isChained: true, role: 'start', chainedWithSlot: 'evening', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
      if (slot === 'evening') {
        const nightId = grid ? resolveEffectiveSlotActivityId(grid, 'weekday', 'night', state) : undefined;
        if (nightId === 'overtime_work') {
          return { isChained: true, role: 'start', chainedWithSlot: 'night', chainType: 'overtime', noticeTh: 'มีกะโอทีต่อเนื่องช่วงดึก' };
        }
        return { isChained: true, role: 'end', chainedWithSlot: 'afternoon', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
    } else if (emp.workShift === 'night-morning') {
      if (slot === 'night') {
        return { isChained: true, role: 'start', chainedWithSlot: 'morning', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
      if (slot === 'morning') {
        return { isChained: true, role: 'end', chainedWithSlot: 'night', chainType: 'shift', noticeTh: UI_TEXT.PLANNER.shiftChainLockNotice };
      }
    }
  }

  // Evening OT connects from afternoon regular work only for morning-afternoon non-day_long shifts
  if (
    grid &&
    slot === 'evening' &&
    emp.status === 'employed' &&
    emp.workShift === 'morning-afternoon' &&
    !isDayLong
  ) {
    const eveningId = resolveEffectiveSlotActivityId(grid, 'weekday', 'evening', state);
    if (eveningId === 'overtime_work') {
      return {
        isChained: true,
        role: 'end',
        chainedWithSlot: 'afternoon',
        chainType: 'overtime',
        noticeTh: 'โอทีต่อเนื่องจากงานประจำ',
      };
    }
  }

  // Night OT connects from evening regular work (for afternoon-evening or day_long shifts)
  if (grid && slot === 'night') {
    const nightId = resolveEffectiveSlotActivityId(grid, 'weekday', 'night', state);
    if (
      nightId === 'overtime_work' &&
      emp.status === 'employed' &&
      (emp.workShift === 'afternoon-evening' || isDayLong)
    ) {
      return {
        isChained: true,
        role: 'end',
        chainedWithSlot: 'evening',
        chainType: 'overtime',
        noticeTh: 'โอทีต่อเนื่องจากงานประจำ',
      };
    }
  }

  return { isChained: false };
}

/**
 * Resolves the concrete ActivityId stored in a grid cell (expanding `null` via the balanced template
 * and repairing stale system-only markers on unlocked cells).
 */
export function resolveEffectiveSlotActivityId(
  grid: PlannerGrid | undefined,
  dayType: DayType,
  slot: Slot,
  state: GameState
): ActivityId {
  const lock = isSlotLocked(dayType, slot, state);
  if (lock.locked && lock.activityId) {
    return lock.activityId;
  }

  const archetype = getArchetypeForState(state);
  const fallbackId = getTemplateForPresetAndArchetype('balanced', archetype)[dayType][slot];
  const raw = grid?.[dayType]?.[slot];

  if (!raw || !ACTIVITIES_BY_ID.has(raw)) {
    return ACTIVITIES_BY_ID.get(fallbackId)?.isSystemOnly
      ? slot === 'night'
        ? 'sleep_normal'
        : 'quiet_rest'
      : fallbackId;
  }

  const def = ACTIVITIES_BY_ID.get(raw)!;
  if (def.isSystemOnly) {
    return slot === 'night' ? 'sleep_normal' : 'quiet_rest';
  }
  return raw;
}

function getSafeUnlockedFallback(slot: Slot, archetype: PlannerArchetype): ActivityId {
  if (slot === 'night') {
    return archetype === 'school_kid' || archetype === 'senior' || archetype === 'infant'
      ? 'sleep_full'
      : 'sleep_normal';
  }
  if (slot === 'evening') return 'family_time';
  return 'hobby_leisure';
}

export function isPresetAvailableForPlanner(
  presetId: LifestylePresetId,
  state: GameState
): { available: boolean; reasonTh?: string } {
  const preset = LIFESTYLE_PRESETS_BY_ID.get(presetId);
  if (!preset) {
    return { available: false, reasonTh: 'ไม่พบแนวทางวิถีชีวิตนี้' };
  }

  const age = state.character.ageYears;
  const stageId = getLifeSubStageId(age);
  const jobId = state.economy.jobId || 'unemployed';
  const avail = preset.availability;

  if (age < 6) {
    return { available: false, reasonTh: UI_TEXT.LIFESTYLE.infantManagedNotice };
  }
  if (age < avail.minAge) {
    return { available: false, reasonTh: `ปลดล็อกเมื่ออายุ ${avail.minAge} ปีขึ้นไป` };
  }
  if (avail.maxAge !== undefined && age > avail.maxAge) {
    return { available: false, reasonTh: `เหมาะสำหรับอายุไม่เกิน ${avail.maxAge} ปี` };
  }
  if (avail.forbidsStages?.includes(stageId)) {
    return { available: false, reasonTh: 'ไม่เหมาะกับช่วงวัยนี้' };
  }

  if (avail.requires === 'job') {
    const hasRegularJob = jobId !== 'infant' && jobId !== 'student' && jobId !== 'unemployed';
    if (!hasRegularJob) {
      return { available: false, reasonTh: UI_TEXT.LIFESTYLE.unemployedNotice };
    }
    if (presetId === 'workaholic' && !resolveEmploymentState(state).allowsOvertime) {
      return { available: false, reasonTh: `งาน${JOBS[jobId]?.title ?? ''}ไม่มีระบบโอที` };
    }
  } else if (avail.requires === 'side_gig') {
    const gigCheck = checkSideGigEligibility(state, 1);
    if (!gigCheck.allowed) {
      return {
        available: false,
        reasonTh: gigCheck.reasonTh ?? UI_TEXT.LIFESTYLE.adultSideGigNoRecord,
      };
    }
  } else if (avail.requires === 'student' && jobId !== 'student') {
    return { available: false, reasonTh: 'เฉพาะผู้ที่กำลังเรียนอยู่' };
  } else if (avail.requires === 'not_working' && jobId !== 'unemployed') {
    return { available: false, reasonTh: 'เฉพาะช่วงที่ยังไม่มีงานประจำ' };
  }

  return { available: true };
}

export function isActivityAvailableInSlot(
  activityId: ActivityId,
  dayType: DayType,
  slot: Slot,
  state: GameState
): ActivityAvailabilityResult {
  const act = ACTIVITIES_BY_ID.get(activityId);
  if (!act) {
    return { visible: false, allowed: false, reasonTh: 'ไม่พบกิจกรรมนี้' };
  }

  const age = state.character.ageYears;
  const jobId = state.economy.jobId || 'unemployed';
  const job = JOBS[jobId];

  if (act.isSystemOnly) {
    const lock = isSlotLocked(dayType, slot, state);
    if (lock.locked && lock.activityId === activityId) {
      return { visible: true, allowed: true };
    }
    return { visible: false, allowed: false, reasonTh: act.lockReasonTh };
  }

  const emp = resolveEmploymentState(state);
  const isNightShiftAfternoonSleep =
    emp.status === 'employed' &&
    emp.workShift === 'night-morning' &&
    dayType === 'weekday' &&
    slot === 'afternoon' &&
    (activityId === 'sleep_normal' || activityId === 'sleep_full');

  if (!act.allowedSlots.includes(slot) && !isNightShiftAfternoonSleep) {
    return {
      visible: false,
      allowed: false,
      reasonTh: `กิจกรรมนี้ทำไม่ได้ในช่วง${UI_TEXT.DAYPARTS[slot]}`,
    };
  }

  // Spec 06 §3.1: Below 15, paid activities are hidden unless parents cover cost
  if (age < 15 && act.moneyCostPerSlot > 0 && !act.minorPaidByParentsBelow15) {
    return {
      visible: false,
      allowed: false,
      reasonTh: 'วัยต่ำกว่า 15 ปี ยังไม่เปิดกิจกรรมที่มีค่าใช้จ่ายส่วนตัว',
    };
  }

  if (age < act.minAge) {
    return {
      visible: true,
      allowed: false,
      reasonTh:
        act.requires === 'nightlife_age'
          ? 'ผู้เยาว์อายุต่ำกว่า 18 ปี ล็อกถาวรตามกฎหมาย'
          : `ปลดล็อกเมื่ออายุ ${act.minAge} ปีขึ้นไป`,
    };
  }

  if (act.maxAge !== undefined && age > act.maxAge) {
    return {
      visible: true,
      allowed: false,
      reasonTh: `เหมาะสำหรับอายุไม่เกิน ${act.maxAge} ปี`,
    };
  }

  if (act.requires === 'nightlife_age' && !canEnterNightlife(age, state.settings)) {
    const minPubAge = state.settings?.pubVisitAge ?? 20;
    return {
      visible: true,
      allowed: false,
      reasonTh:
        age < 18
          ? 'ผู้เยาว์อายุต่ำกว่า 18 ปี ล็อกถาวรตามกฎหมาย'
          : `ต้องอายุ ${minPubAge} ปีขึ้นไปตามเกณฑ์สถานที่`,
    };
  }

  if (act.requires === 'regular_job_overtime') {
    const hasRegularJob = emp.status === 'employed';
    if (age < 18) {
      return { visible: true, allowed: false, reasonTh: 'ทำโอทีได้เมื่ออายุ 18 ปีขึ้นไป' };
    }
    if (!hasRegularJob) {
      return { visible: true, allowed: false, reasonTh: 'ต้องมีงานประจำก่อนจึงจะทำโอทีได้' };
    }
    if (!emp.allowsOvertime || state.economy.monthlySalary <= 0) {
      return { visible: true, allowed: false, reasonTh: `งาน${job?.title ?? ''}ไม่มีระบบโอที` };
    }
  }

  if (act.requires === 'flexible_shift') {
    if (emp.status !== 'employed' || emp.workShift !== 'flexible') {
      return {
        visible: false,
        allowed: false,
        reasonTh: 'ใช้ได้เฉพาะงานประจำที่เลือกเวลาทำงานแบบยืดหยุ่นเท่านั้น',
      };
    }
  }

  if (act.requires === 'freelance_eligible') {
    if (emp.status === 'employed') {
      return {
        visible: true,
        allowed: false,
        reasonTh: 'รับงานฟรีแลนซ์ได้เฉพาะช่วงที่ไม่ได้ทำงานประจำ',
      };
    }
    if (age < 18) {
      return {
        visible: true,
        allowed: false,
        reasonTh: 'ต้องมีอายุ 18 ปีขึ้นไปจึงจะรับงานฟรีแลนซ์เต็มตัวได้',
      };
    }
    const maxSkill = Math.max(0, ...Object.values(state.character.skills));
    const unlockedFlag = Boolean(state.character.flags?.freelance_unlocked);
    if (!unlockedFlag || maxSkill < 31) {
      return {
        visible: true,
        allowed: false,
        reasonTh: !unlockedFlag
          ? 'ต้องปลดล็อกสิทธิ์รับงานอิสระและมีทักษะตั้งแต่ระดับ 31 ขึ้นไป'
          : 'ต้องมีทักษะเฉพาะทางอย่างน้อย 1 ด้านถึงระดับ 31 ขึ้นไป',
        unlockHintTh: 'ลงคอร์สพัฒนาทักษะให้ผ่านระดับ 31 เพื่อเปิดรับงานฟรีแลนซ์',
      };
    }
  }

  if (act.requires === 'side_gig_eligible') {
    if (age < 15) {
      return { visible: true, allowed: false, reasonTh: UI_TEXT.LIFESTYLE.minorSideGigUnder15 };
    }
    if (age < 18 && slot === 'night') {
      return { visible: true, allowed: false, reasonTh: UI_TEXT.LIFESTYLE.minorSideGigNightForbidden };
    }
    const gigCheck = checkSideGigEligibility(state, SLOT_HOURS[slot]);
    if (!gigCheck.allowed) {
      return {
        visible: true,
        allowed: false,
        reasonTh: gigCheck.reasonTh ?? UI_TEXT.LIFESTYLE.adultSideGigNoRecord,
      };
    }
  }

  if (act.requires === 'active_course') {
    const course = state.skillTraining?.course;
    if (!course || course.weeksLeft <= 0) {
      return { visible: true, allowed: false, reasonTh: act.lockReasonTh };
    }
  }

  if (act.requires === 'tier3_skill') {
    const focus = state.skillTraining?.focus ?? [];
    const candidateSkills: SkillKey[] =
      focus.length > 0
        ? focus
        : ['english', 'sales', 'finance', 'tech', 'craft', 'cooking', 'socializing', 'academic'];
    const anyTier3 = candidateSkills.some((sk) => isTier3Unlocked(state, sk));
    if (!anyTier3) {
      const targetSkill = candidateSkills[0];
      const rule = SKILL_UNLOCK_RULES[targetSkill];
      return {
        visible: true,
        allowed: false,
        reasonTh: act.lockReasonTh,
        unlockHintTh: rule?.tier3HintTh,
      };
    }
  }

  if (act.requires === 'university_student') {
    if (age < 18 || jobId !== 'student') {
      return {
        visible: age >= 15,
        allowed: false,
        reasonTh: act.lockReasonTh ?? 'เปิดเฉพาะนักศึกษามหาวิทยาลัย',
      };
    }
  }

  if (act.requires === 'coming_phase34_job') {
    return {
      visible: age >= 18 && jobId === 'student',
      allowed: false,
      reasonTh: 'รอระบบสมัครงาน 3.4',
    };
  }

  if (act.requires === 'stream_eligible') {
    const activeTraits = new Set<string>([
      ...(state.character.traits ?? []),
      ...(state.character.emergentTraits ?? []).map((t) => t.id),
    ]);
    const hasStreamFlag = Boolean(state.character.flags?.stream_unlocked);
    const hasHobbyTraitOrCreative =
      activeTraits.has('niche_obsessed') ||
      activeTraits.has('curious_learner') ||
      activeTraits.has('solitude_lover') ||
      state.character.rawStats.creativity >= 55;
    const hobbyEv = state.evidence?.hobby_focus ?? 0;
    if (!hasStreamFlag && (!hasHobbyTraitOrCreative || hobbyEv < 6)) {
      return {
        visible: true,
        allowed: false,
        reasonTh: act.lockReasonTh,
        unlockHintTh: 'เล่นเกม/ทำงานอดิเรกต่อเนื่องให้เกิดนิสัยเฉพาะทางหรือมีไอเดียสร้างสรรค์ถึงเกณฑ์',
      };
    }
  }

  if (act.requires === 'has_child_stub') {
    if (!Boolean(state.character.flags?.has_child) || age < 18) {
      return {
        visible: age >= 18,
        allowed: false,
        reasonTh: act.lockReasonTh ?? 'เปิดเมื่อมีสถานะดูแลบุตรในครอบครัว',
      };
    }
  }

  if (act.requires === 'competition_eligible') {
    const workoutWeeks = state.planner?.streaks?.workoutWeeks ?? 0;
    const hasCompFlag = Boolean(state.character.flags?.competition_unlocked);
    if (!hasCompFlag && workoutWeeks < 8) {
      return {
        visible: true,
        allowed: false,
        reasonTh: act.lockReasonTh,
        unlockHintTh: `ออกกำลังกายต่อเนื่องแล้ว ${workoutWeeks}/8 สัปดาห์`,
      };
    }
  }

  return { visible: true, allowed: true };
}

/**
 * Pure 168h Weekly Allocation derivation from the Planner Grid (Spec 06 §2.3).
 * Mathematical invariant: ALWAYS sums strictly to 168 hours (5*24 + 2*24).
 */
export function deriveWeeklyAllocation(grid: PlannerGrid, state: GameState): TimeAllocation {
  const result: TimeAllocation = {
    sleep: 0,
    workOrStudy: 0,
    sideGig: 0,
    social: 0,
    hobby: 0,
    family: 0,
    selfDev: 0,
    nightlife: 0,
  };

  const age = state.character.ageYears;
  const jobId = state.economy.jobId || 'unemployed';
  const job = JOBS[jobId];
  const archetype = getArchetypeForState(state);

  for (const dayType of ALL_DAY_TYPES) {
    const dayWeight = DAY_TYPE_WEIGHTS[dayType];
    const dayTotals: Record<TimeAllocCategory, number> = {
      sleep: 0,
      workOrStudy: 0,
      sideGig: 0,
      social: 0,
      hobby: 0,
      family: 0,
      selfDev: 0,
      nightlife: 0,
    };

    if (archetype === 'infant') {
      const infGrid = getTemplateForPresetAndArchetype('balanced', 'infant')[dayType];
      for (const s of ['morning', 'afternoon', 'evening'] as const) {
        const def = ACTIVITIES_BY_ID.get(infGrid[s])!;
        dayTotals[def.timeCategory] += SLOT_HOURS[s];
      }
      const nightVariant = NIGHT_SLEEP_VARIANTS.sleep_full;
      dayTotals.sleep += nightVariant.sleepHoursFromBaseAndSlot;
      for (const [cat, hrs] of Object.entries(nightVariant.remainderHours)) {
        dayTotals[cat as TimeAllocCategory] += hrs ?? 0;
      }
    } else {
      const slotActIds: Record<Slot, ActivityId> = {
        morning: resolveEffectiveSlotActivityId(grid, dayType, 'morning', state),
        afternoon: resolveEffectiveSlotActivityId(grid, dayType, 'afternoon', state),
        evening: resolveEffectiveSlotActivityId(grid, dayType, 'evening', state),
        night: resolveEffectiveSlotActivityId(grid, dayType, 'night', state),
      };

      const lockedWorkSlots: Slot[] = [];
      for (const s of ALL_SLOTS) {
        const lock = isSlotLocked(dayType, s, state);
        if (lock.locked && (lock.activityId === 'school_class' || lock.activityId === 'work_shift')) {
          lockedWorkSlots.push(s);
        }
      }

      const includesNightLock = lockedWorkSlots.includes('night');
      if (lockedWorkSlots.length > 0) {
        const slotWeightSum = lockedWorkSlots.reduce((sum, s) => sum + SLOT_HOURS[s], 0);
        const rawCapacity = slotWeightSum + (includesNightLock ? NIGHT_AWAKE_SLEEP_PENALTY_HOURS : 0);
        const contractDailyHours =
          jobId === 'student'
            ? JOBS.student.workHoursPerDay
            : job && job.shift !== 'none'
              ? Math.max(0, job.workHoursPerDay)
              : 0;
        const actualWork = Math.min(rawCapacity, contractDailyHours);
        const unspentRemainder = Math.max(0, rawCapacity - actualWork);
        dayTotals.workOrStudy += actualWork;
        dayTotals.hobby += unspentRemainder;
      }

      // Unlocked daytime slots (morning, afternoon, evening)
      for (const s of ['morning', 'afternoon', 'evening'] as const) {
        if (lockedWorkSlots.includes(s)) continue;
        const actId = slotActIds[s];
        const def = ACTIVITIES_BY_ID.get(actId) ?? ACTIVITIES_BY_ID.get('quiet_rest')!;
        // Night-shift workers recover sleep in the daytime afternoon slot (5h)
        if (
          includesNightLock &&
          s === 'afternoon' &&
          (actId === 'sleep_full' || actId === 'sleep_normal' || actId === 'quiet_rest')
        ) {
          dayTotals.sleep += SLOT_HOURS[s];
        } else {
          dayTotals[def.timeCategory] += SLOT_HOURS[s];
        }
      }

      // Night slot + 8h base sleep/routine budget (= 11h total)
      if (includesNightLock) {
        dayTotals.sleep += BASE_DAILY_SLEEP_AND_ROUTINE_HOURS - NIGHT_AWAKE_SLEEP_PENALTY_HOURS;
      } else {
        const nightActId = slotActIds.night;
        if (nightActId === 'sleep_full' || nightActId === 'sleep_normal') {
          const variant = NIGHT_SLEEP_VARIANTS[nightActId];
          dayTotals.sleep += variant.sleepHoursFromBaseAndSlot;
          for (const [cat, hrs] of Object.entries(variant.remainderHours)) {
            dayTotals[cat as TimeAllocCategory] += hrs ?? 0;
          }
        } else {
          const def = ACTIVITIES_BY_ID.get(nightActId) ?? ACTIVITIES_BY_ID.get('sleep_normal')!;
          const extra =
            nightActId === 'overtime_work'
              ? OVERTIME_EXTRA_HOURS_PER_NIGHT_SLOT
              : NIGHT_AWAKE_SLEEP_PENALTY_HOURS;
          dayTotals[def.timeCategory] += SLOT_HOURS.night + extra;
          dayTotals.sleep += BASE_DAILY_SLEEP_AND_ROUTINE_HOURS - extra;
        }
      }
    }

    for (const cat of Object.keys(result) as TimeAllocCategory[]) {
      result[cat] += dayTotals[cat] * dayWeight;
    }
  }

  return result;
}

/**
 * Repairs locked slots & any activities whose prerequisites expired (e.g. course ended or job changed).
 */
export function sanitizeGridForState(grid: PlannerGrid, state: GameState): PlannerGrid {
  const next = clonePlannerGrid(grid);
  const archetype = getArchetypeForState(state);
  const emp = resolveEmploymentState(state);

  for (const dayType of ALL_DAY_TYPES) {
    for (const slot of ALL_SLOTS) {
      const lock = isSlotLocked(dayType, slot, state);
      if (lock.locked && lock.activityId) {
        next[dayType][slot] = lock.activityId;
        continue;
      }

      let curId = next[dayType][slot];
      // When an employed job switches to flexible shift, replace system work_shift markers with flexible_work
      if (curId === 'work_shift' && emp.status === 'employed' && emp.workShift === 'flexible') {
        curId = 'flexible_work';
        next[dayType][slot] = curId;
      }

      if (!curId || !ACTIVITIES_BY_ID.has(curId) || ACTIVITIES_BY_ID.get(curId)!.isSystemOnly) {
        next[dayType][slot] = getSafeUnlockedFallback(slot, archetype);
        continue;
      }

      const avail = isActivityAvailableInSlot(curId, dayType, slot, state);
      if (!avail.visible || !avail.allowed) {
        if (curId === 'attend_course' || curId === 'field_practice') {
          next[dayType][slot] = 'self_study';
        } else if (curId === 'party_night' && state.character.ageYears >= 18) {
          next[dayType][slot] = 'meet_friends';
        } else {
          next[dayType][slot] = getSafeUnlockedFallback(slot, archetype);
        }
      }
    }
  }

  // Night-shift workers recover sleep in weekday afternoon by default
  if (emp.status === 'employed' && emp.workShift === 'night-morning') {
    const afternoonId = next.weekday.afternoon;
    if (afternoonId !== 'sleep_normal' && afternoonId !== 'sleep_full' && afternoonId !== 'quiet_rest') {
      next.weekday.afternoon = 'sleep_normal';
    }
  }

  // Auto-chain weekday evening OT -> lock night as sleep_normal
  if (
    !isSlotLocked('weekday', 'evening', state).locked &&
    next.weekday.evening === 'overtime_work' &&
    !isSlotLocked('weekday', 'night', state).locked
  ) {
    next.weekday.night = 'sleep_normal';
  }

  // Ensure max 2 OT cells/week in sanitized grid
  let otCount = 0;
  for (const dt of ALL_DAY_TYPES) {
    for (const sl of ALL_SLOTS) {
      if (isSlotLocked(dt, sl, state).locked) continue;
      if (next[dt][sl] === 'overtime_work') {
        otCount++;
        if (otCount > 2) {
          next[dt][sl] = getSafeUnlockedFallback(sl, archetype);
        }
      }
    }
  }

  // Flexible shift default fill so contract work hours are met automatically on shift change / new grid
  if (emp.status === 'employed' && emp.workShift === 'flexible') {
    const minFlexHours = Math.min(35, Math.max(20, emp.contractHoursPerWeek));
    if (deriveWeeklyAllocation(next, state).workOrStudy < minFlexHours) {
      if (!isSlotLocked('weekday', 'morning', state).locked) {
        next.weekday.morning = 'flexible_work';
      }
      if (
        deriveWeeklyAllocation(next, state).workOrStudy < minFlexHours &&
        !isSlotLocked('weekday', 'afternoon', state).locked
      ) {
        next.weekday.afternoon = 'flexible_work';
      }
    }
  }

  // Trim excess unlocked OT / side-gig slots if total weekly work hours exceed legal ceiling (64h adult / 48h minor)
  const maxWorkCeiling =
    state.character.ageYears < AGE_LEGAL_RULES.minAdultFullWorkAge
      ? AGE_LEGAL_RULES.minorMaxWeeklyWorkHours
      : AGE_LEGAL_RULES.adultMaxWeeklyWorkHours;
  const trimPriority: Array<[DayType, Slot]> = [
    ['weekday', 'night'],
    ['weekend', 'night'],
    ['weekend', 'evening'],
    ['weekend', 'afternoon'],
    ['weekend', 'morning'],
    ['weekday', 'evening'],
    ['weekday', 'afternoon'],
    ['weekday', 'morning'],
  ];
  let sanitizedAlloc = deriveWeeklyAllocation(next, state);
  if (sanitizedAlloc.workOrStudy + sanitizedAlloc.sideGig > maxWorkCeiling) {
    for (const [dt, sl] of trimPriority) {
      if (isSlotLocked(dt, sl, state).locked) continue;
      const cur = next[dt][sl];
      if (cur === 'overtime_work' || cur === 'side_gig_work' || cur === 'freelance_work') {
        next[dt][sl] = getSafeUnlockedFallback(sl, archetype);
        sanitizedAlloc = deriveWeeklyAllocation(next, state);
        if (sanitizedAlloc.workOrStudy + sanitizedAlloc.sideGig <= maxWorkCeiling) {
          break;
        }
      }
    }
  }

  return next;
}

export function validatePlanner(grid: PlannerGrid, state: GameState): PlannerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const age = state.character.ageYears;
  const stageDef = getLifeStageForAge(age);
  const minSleep = STAGE_MIN_SLEEP_HOURS[stageDef.id];
  const emp = resolveEmploymentState(state);
  const derivedAllocation = deriveWeeklyAllocation(grid, state);

  for (const dayType of ALL_DAY_TYPES) {
    const dayLabel = dayType === 'weekday' ? UI_TEXT.PLANNER.colWeekday : UI_TEXT.PLANNER.colWeekend;
    for (const slot of ALL_SLOTS) {
      const slotLabel = UI_TEXT.DAYPARTS[slot];
      const lock = isSlotLocked(dayType, slot, state);
      const rawVal = grid?.[dayType]?.[slot];
      if (lock.locked) {
        if (rawVal !== null && rawVal !== undefined && rawVal !== lock.activityId) {
          errors.push(`${dayLabel} ช่วง${slotLabel} ถูกล็อก: ${lock.reasonTh}`);
        }
        continue;
      }

      const actId = resolveEffectiveSlotActivityId(grid, dayType, slot, state);
      const act = ACTIVITIES_BY_ID.get(actId);
      if (!act) {
        errors.push(`${dayLabel} ช่วง${slotLabel}: ไม่พบกิจกรรมที่เลือก`);
        continue;
      }
      const isNightShiftAfternoonSleep =
        emp.status === 'employed' &&
        emp.workShift === 'night-morning' &&
        dayType === 'weekday' &&
        slot === 'afternoon' &&
        act.timeCategory === 'sleep';
      if (!act.allowedSlots.includes(slot) && !isNightShiftAfternoonSleep) {
        errors.push(`${dayLabel} ช่วง${slotLabel}: "${act.nameTh}" ทำไม่ได้ในช่วงเวลานี้`);
        continue;
      }
      if (act.isSystemOnly) {
        errors.push(`${dayLabel} ช่วง${slotLabel}: กิจกรรมนี้ตั้งโดยระบบเท่านั้น`);
        continue;
      }

      const avail = isActivityAvailableInSlot(actId, dayType, slot, state);
      if (!avail.visible || !avail.allowed) {
        errors.push(
          `${dayLabel} ช่วง${slotLabel} (${act.nameTh}): ${avail.reasonTh ?? 'ยังไม่ผ่านเงื่อนไข'}`
        );
      }
    }
  }

  // Part A: OT limits, minor block, total work ceiling & slot chaining validation
  const otSlotsCount = countOvertimeSlots(grid, state);
  if (age < AGE_LEGAL_RULES.minAdultFullWorkAge && otSlotsCount > 0) {
    errors.push(UI_TEXT.PLANNER.minorOvertimeForbidden);
  }
  if (otSlotsCount > 2) {
    errors.push(UI_TEXT.PLANNER.otLimitWarning);
  }
  for (const dt of ALL_DAY_TYPES) {
    if (isSlotLocked(dt, 'evening', state).locked) continue;
    const ev = resolveEffectiveSlotActivityId(grid, dt, 'evening', state);
    if (ev === 'overtime_work' && !isSlotLocked(dt, 'night', state).locked) {
      const nt = resolveEffectiveSlotActivityId(grid, dt, 'night', state);
      const ntDef = ACTIVITIES_BY_ID.get(nt);
      if (nt === 'overtime_work') {
        errors.push(UI_TEXT.PLANNER.otLimitWarning);
      } else if (dt === 'weekday' && (!ntDef || ntDef.timeCategory !== 'sleep')) {
        errors.push('หลังทำโอทีช่วงเย็นวันธรรมดา ช่วงดึกต้องพักผ่อนนอนหลับต่อเนื่อง');
      }
    }
  }

  // Part B: Flexible shift minimum weekly work hours
  if (emp.status === 'employed' && emp.workShift === 'flexible') {
    const minFlexHours = Math.min(35, Math.max(20, emp.contractHoursPerWeek));
    if (derivedAllocation.workOrStudy < minFlexHours) {
      errors.push(
        `งานกะเวลายืดหยุ่นต้องจัดชั่วโมงทำงานหลักอย่างน้อย ${minFlexHours} ชม./สัปดาห์ (ปัจจุบัน ${derivedAllocation.workOrStudy} ชม.)`
      );
    }
  }

  // Part C: Freelance max 7 slots/week
  const freelanceSlots = countFreelanceSlots(grid, state);
  if (freelanceSlots > 7) {
    errors.push('รับงานฟรีแลนซ์ได้สูงสุด 7 ช่วง/สัปดาห์ เพื่อให้ร่างกายมีเวลาพักผ่อนเพียงพอ');
  }

  const sum =
    derivedAllocation.sleep +
    derivedAllocation.workOrStudy +
    derivedAllocation.sideGig +
    derivedAllocation.social +
    derivedAllocation.hobby +
    derivedAllocation.family +
    derivedAllocation.selfDev +
    derivedAllocation.nightlife;

  if (sum !== TOTAL_WEEKLY_HOURS) {
    errors.push(`ผลรวมเวลาต่อสัปดาห์ต้องเท่ากับ ${TOTAL_WEEKLY_HOURS} ชม. (ปัจจุบัน ${sum} ชม.)`);
  }

  if (derivedAllocation.sleep < minSleep) {
    errors.push(
      emp.workShift === 'night-morning'
        ? `ช่วง${stageDef.shortLabelTh} ต้องนอนรวมอย่างน้อย ${minSleep} ชม./สัปดาห์ (ตารางนี้นอน ${derivedAllocation.sleep} ชม. · คนทำงานกะดึกควรจัด "นอนปกติ" หรือ "พักฟื้นลดเครียด" ช่วงบ่าย)`
        : `ช่วง${stageDef.shortLabelTh} ต้องนอนอย่างน้อย ${minSleep} ชม./สัปดาห์ (ตารางนี้นอน ${derivedAllocation.sleep} ชม. · ให้เลือก "นอนปกติ" หรือ "นอนเต็มอิ่ม" ในช่วงดึก)`
    );
  }

  const totalWork = derivedAllocation.workOrStudy + derivedAllocation.sideGig;
  if (age < 18) {
    if (derivedAllocation.nightlife > 0) {
      errors.push('ผู้เยาว์อายุต่ำกว่า 18 ปี ห้ามจัดกิจกรรมกลางคืนหรือสังสรรค์ผับ');
    }
    if (totalWork > AGE_LEGAL_RULES.minorMaxWeeklyWorkHours) {
      errors.push(
        `ผู้เยาว์อายุต่ำกว่า 18 ปี เวลางาน เรียน และงานเสริมรวมกันต้องไม่เกิน ${AGE_LEGAL_RULES.minorMaxWeeklyWorkHours} ชม./สัปดาห์ (ปัจจุบัน ${totalWork} ชม.)`
      );
    }
  } else if (totalWork > AGE_LEGAL_RULES.adultMaxWeeklyWorkHours) {
    errors.push(
      UI_TEXT.PLANNER.adultWorkLimitError(totalWork, AGE_LEGAL_RULES.adultMaxWeeklyWorkHours)
    );
  }

  if (derivedAllocation.sideGig > 0 && state.sideGigRecord) {
    const baseGigCheck = checkSideGigEligibility({ ...state, timeAllocation: derivedAllocation });
    if (baseGigCheck.allowed && derivedAllocation.sideGig > baseGigCheck.maxHours) {
      warnings.push(
        `ชั่วโมงงานเสริม (${derivedAllocation.sideGig} ชม./สัปดาห์) เกินสัญญาสูงสุด ${baseGigCheck.maxHours} ชม. ระบบจะคำนวณรายได้สูงสุดตามสัญญา`
      );
    }
  }

  const overworkLimit = STAGE_OVERWORK_THRESHOLD[stageDef.id];
  if (age >= 15 && totalWork > overworkLimit) {
    warnings.push(
      `ทำงาน/เรียนรวม ${totalWork} ชม./สัปดาห์ สูงกว่าเกณฑ์สมดุล (${overworkLimit} ชม.) ความเครียดสะสมจะเพิ่มขึ้น`
    );
  }
  if (derivedAllocation.sleep < TIME_ALLOC_BALANCE.optimalSleepHours) {
    warnings.push('เวลานอนรวมต่ำกว่า 8 ชม./วัน การฟื้นพลังงานจะช้าลง');
  }

  const costRes = resolveAffordableWeeklyActivities(state, grid);
  if (costRes.hadInsufficientCash && age >= 15) {
    warnings.push(
      `เงินสดปัจจุบันไม่พอค่ากิจกรรมทั้งสัปดาห์ (${costRes.totalWeeklyCost.toLocaleString('th-TH')} ฿) บางช่องจะสลับเป็นกิจกรรมฟรีอัตโนมัติ`
    );
  }

  return {
    valid: errors.length === 0,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    derivedAllocation,
  };
}

export function applyPresetTemplate(
  presetId: LifestylePresetId,
  state: GameState
): { accepted: boolean; reasonTh?: string; grid: PlannerGrid; state: GameState } {
  const avail = isPresetAvailableForPlanner(presetId, state);
  if (!avail.available) {
    const existingGrid = state.planner?.grid
      ? clonePlannerGrid(state.planner.grid)
      : sanitizeGridForState(
          getTemplateForPresetAndArchetype('balanced', getArchetypeForState(state)),
          state
        );
    return {
      accepted: false,
      reasonTh: avail.reasonTh,
      grid: existingGrid,
      state,
    };
  }

  const archetype = getArchetypeForState(state);
  const template = getTemplateForPresetAndArchetype(presetId, archetype);
  let nextGrid: PlannerGrid = {
    weekday: { ...template.weekday },
    weekend: { ...template.weekend },
  };

  // If skill_grind & player has an active course, upgrade weekend self_study to attend_course
  if (
    presetId === 'skill_grind' &&
    state.skillTraining?.course &&
    state.skillTraining.course.weeksLeft > 0
  ) {
    if (nextGrid.weekend.morning === 'self_study') nextGrid.weekend.morning = 'attend_course';
  }

  // Never exceed minor 48h / adult 64h cap or night rules on preset templates
  nextGrid = sanitizeGridForState(nextGrid, state);

  // For workaholic preset: if weekday.evening was locked (e.g. day_long / afternoon-evening) or trimmed due to 64h cap,
  // automatically place overtime_work into the best available unlocked slot (weekend morning/afternoon/evening, etc.)
  if (presetId === 'workaholic' && countOvertimeSlots(nextGrid, state) === 0) {
    const candidateSlots: Array<[DayType, Slot]> = [
      ['weekday', 'evening'],
      ['weekend', 'morning'],
      ['weekend', 'afternoon'],
      ['weekend', 'evening'],
      ['weekday', 'morning'],
      ['weekday', 'afternoon'],
      ['weekend', 'night'],
      ['weekday', 'night'],
    ];
    for (const [dt, sl] of candidateSlots) {
      if (isSlotLocked(dt, sl, state).locked) continue;
      if (!isActivityAvailableInSlot('overtime_work', dt, sl, state).allowed) continue;
      const candidateGrid = clonePlannerGrid(nextGrid);
      candidateGrid[dt][sl] = 'overtime_work';
      if (
        dt === 'weekday' &&
        sl === 'evening' &&
        !isSlotLocked('weekday', 'night', state).locked
      ) {
        candidateGrid.weekday.night = 'sleep_normal';
      }
      if (validatePlanner(candidateGrid, state).valid) {
        nextGrid = candidateGrid;
        break;
      }
    }
  }

  // If sanitize changed something slightly, ensure validation passes cleanly (fall back sleep & trim minor gig slots)
  let check = validatePlanner(nextGrid, state);
  if (!check.valid) {
    for (const dayType of ALL_DAY_TYPES) {
      if (!isSlotLocked(dayType, 'night', state).locked) {
        const curNight = nextGrid[dayType].night;
        const nightDef = curNight ? ACTIVITIES_BY_ID.get(curNight) : undefined;
        if (!nightDef || nightDef.timeCategory !== 'sleep') {
          nextGrid[dayType].night =
            archetype === 'school_kid' || archetype === 'senior' ? 'sleep_full' : 'sleep_normal';
        }
      }
    }
    check = validatePlanner(nextGrid, state);
  }

  // If minor < 18 exceeds 48h work+study+sideGig, trim unlocked side_gig_work/overtime_work slots deterministically
  if (
    state.character.ageYears < 18 &&
    check.derivedAllocation.workOrStudy + check.derivedAllocation.sideGig >
      AGE_LEGAL_RULES.minorMaxWeeklyWorkHours
  ) {
    const trimOrder: Array<[DayType, Slot]> = [
      ['weekday', 'night'],
      ['weekend', 'night'],
      ['weekday', 'evening'],
      ['weekend', 'evening'],
      ['weekday', 'afternoon'],
      ['weekend', 'afternoon'],
      ['weekday', 'morning'],
      ['weekend', 'morning'],
    ];
    for (const [dt, sl] of trimOrder) {
      if (isSlotLocked(dt, sl, state).locked) continue;
      const cur = nextGrid[dt][sl];
      if (cur === 'side_gig_work' || cur === 'overtime_work') {
        nextGrid[dt][sl] = getSafeUnlockedFallback(sl, archetype);
        check = validatePlanner(nextGrid, state);
        if (
          check.derivedAllocation.workOrStudy + check.derivedAllocation.sideGig <=
          AGE_LEGAL_RULES.minorMaxWeeklyWorkHours
        ) {
          break;
        }
      }
    }
  }

  if (!check.valid) {
    const existingGrid = state.planner?.grid
      ? clonePlannerGrid(state.planner.grid)
      : sanitizeGridForState(
          getTemplateForPresetAndArchetype('balanced', archetype),
          state
        );
    return {
      accepted: false,
      reasonTh: check.errors[0] ?? 'ไม่สามารถจัดตารางวิถีชีวิตนี้ได้ตามเงื่อนไขปัจจุบัน',
      grid: existingGrid,
      state,
    };
  }

  const nextPlanner: PlannerState = {
    ...(state.planner ?? { grid: nextGrid }),
    grid: nextGrid,
    presetId,
    draft: undefined,
    pendingGrid: undefined,
    pendingPresetId: undefined,
    effectiveFromDay: undefined,
  };

  const nextState: GameState = {
    ...state,
    lifestylePresetId: presetId,
    planner: nextPlanner,
    timeAllocation: check.derivedAllocation,
  };

  return {
    accepted: true,
    grid: nextGrid,
    state: nextState,
  };
}

export function createInitialPlannerState(state: GameState): PlannerState {
  const archetype = getArchetypeForState(state);
  const rawTemplate = getTemplateForPresetAndArchetype('balanced', archetype);
  const grid = sanitizeGridForState(rawTemplate, state);
  return {
    grid,
    presetId: 'balanced',
  };
}

/**
 * Deterministic holiday/day-aware slot resolver (Spec 06 §2.3 #6 & §7).
 * On public holidays or student school breaks, slots normally locked by work/study
 * yield to the weekend template cell (`grid.weekend[slot]`).
 */
export function getSlotActivity(
  state: GameState,
  dayIndexOrDate: number | GameDate,
  slot: Slot
): {
  activityId: ActivityId;
  def: ActivityDef;
  isLockedRoleSlot: boolean;
  isHolidayOverride: boolean;
} {
  let targetDate: GameDate;
  if (typeof dayIndexOrDate === 'object') {
    targetDate = dayIndexOrDate;
  } else if (dayIndexOrDate === state.date.totalDays) {
    targetDate = state.date;
  } else {
    let cur = state.date;
    if (dayIndexOrDate > cur.totalDays) {
      const steps = Math.min(366, dayIndexOrDate - cur.totalDays);
      for (let i = 0; i < steps; i++) {
        cur = advanceOneDay(cur).nextDate;
      }
      targetDate = cur;
    } else if (dayIndexOrDate >= 0 && dayIndexOrDate <= 6) {
      targetDate = { ...state.date, dayOfWeek: dayIndexOrDate };
    } else {
      targetDate = state.date;
    }
  }

  const grid = state.planner?.grid ?? createInitialPlannerState(state).grid;
  const age = state.character.ageYears;
  const jobId = state.economy.jobId || 'unemployed';
  const job = JOBS[jobId];
  const isWeekendDay = targetDate.dayOfWeek === 0 || targetDate.dayOfWeek === 6;
  const isHoliday = isThaiPublicHoliday(targetDate.month, targetDate.day);
  const isSchoolBreak = jobId === 'student' && isThaiSchoolBreak(targetDate.month, targetDate.day);

  // Infant (0-5)
  if (age < 6 || jobId === 'infant') {
    const dt: DayType = isWeekendDay ? 'weekend' : 'weekday';
    const actId = resolveEffectiveSlotActivityId(grid, dt, slot, state);
    return {
      activityId: actId,
      def: ACTIVITIES_BY_ID.get(actId)!,
      isLockedRoleSlot: true,
      isHolidayOverride: false,
    };
  }

  const emp = resolveEmploymentState(state);
  // Saturday shift override for jobs where weekendOff === false (fixed shifts only; flexible is player-scheduled)
  const saturdayShiftActive =
    targetDate.dayOfWeek === 6 &&
    !isHoliday &&
    emp.status === 'employed' &&
    emp.workShift !== 'flexible' &&
    job &&
    job.shift !== 'none' &&
    !job.weekendOff &&
    getLockedWeekdaySlotsForJob(jobId, age, emp.workShift).includes(slot);

  if (saturdayShiftActive) {
    return {
      activityId: 'work_shift',
      def: ACTIVITIES_BY_ID.get('work_shift')!,
      isLockedRoleSlot: true,
      isHolidayOverride: false,
    };
  }

  if (isWeekendDay) {
    const actId = resolveEffectiveSlotActivityId(grid, 'weekend', slot, state);
    return {
      activityId: actId,
      def: ACTIVITIES_BY_ID.get(actId)!,
      isLockedRoleSlot: false,
      isHolidayOverride: false,
    };
  }

  // Regular weekday: check if slot is normally locked and today is a holiday / student break
  const weekdayLock = isSlotLocked('weekday', slot, state);
  const offWorkToday =
    (jobId === 'student' && (isHoliday || isSchoolBreak)) ||
    (job && job.shift !== 'none' && job.weekendOff && isHoliday);

  if (weekdayLock.locked && offWorkToday) {
    const actId = resolveEffectiveSlotActivityId(grid, 'weekend', slot, state);
    return {
      activityId: actId,
      def: ACTIVITIES_BY_ID.get(actId)!,
      isLockedRoleSlot: false,
      isHolidayOverride: true,
    };
  }

  const actId = resolveEffectiveSlotActivityId(grid, 'weekday', slot, state);
  return {
    activityId: actId,
    def: ACTIVITIES_BY_ID.get(actId)!,
    isLockedRoleSlot: weekdayLock.locked,
    isHolidayOverride: false,
  };
}

/**
 * Evaluates weekly activity slot costs in deterministic order (weekday then weekend).
 * Below age 15: minorPaidByParentsBelow15 items are covered by parents (0 THB).
 * Age >= 15: if cash < total cost, swaps unaffordable slots to freeFallbackActivityId.
 */
export function resolveAffordableWeeklyActivities(
  state: GameState,
  gridOverride?: PlannerGrid
): WeeklyCostResolution {
  const grid = gridOverride ?? state.planner?.grid ?? createInitialPlannerState(state).grid;
  const age = state.character.ageYears;
  let remainingCash = Math.max(0, state.economy.cash);
  let totalWeeklyCost = 0;
  let affordableCost = 0;
  const swappedSlots: WeeklyCostResolution['swappedSlots'] = [];

  for (const dayType of ALL_DAY_TYPES) {
    const dayWeight = DAY_TYPE_WEIGHTS[dayType];
    for (const slot of ALL_SLOTS) {
      const actId = resolveEffectiveSlotActivityId(grid, dayType, slot, state);
      const act = ACTIVITIES_BY_ID.get(actId);
      if (!act || act.moneyCostPerSlot <= 0) continue;

      if (age < 15 && act.minorPaidByParentsBelow15) {
        continue; // Parents cover cost
      }

      const weeklyCostForSlot = act.moneyCostPerSlot * dayWeight;
      totalWeeklyCost += weeklyCostForSlot;

      if (remainingCash >= weeklyCostForSlot) {
        remainingCash -= weeklyCostForSlot;
        affordableCost += weeklyCostForSlot;
      } else {
        const fallbackId: ActivityId = act.freeFallbackActivityId ?? 'quiet_rest';
        const fallbackDef = ACTIVITIES_BY_ID.get(fallbackId) ?? ACTIVITIES_BY_ID.get('quiet_rest')!;
        swappedSlots.push({
          dayType,
          slot,
          fromActivityId: actId,
          toActivityId: fallbackDef.id,
          fromNameTh: act.nameTh,
          toNameTh: fallbackDef.nameTh,
          savedCostPerSlot: act.moneyCostPerSlot,
        });
      }
    }
  }

  const fallbackReasonTh =
    swappedSlots.length > 0
      ? UI_TEXT.PLANNER.cashInsufficientLogDesc(
          swappedSlots[0].fromNameTh,
          swappedSlots[0].toNameTh
        )
      : undefined;

  return {
    totalWeeklyCost,
    affordableCost,
    hadInsufficientCash: swappedSlots.length > 0,
    swappedSlots,
    fallbackReasonTh,
  };
}

/**
 * Counts skill-focused training hours from the grid for Spec 06 §3.2 integration with 05 §4.2.
 */
export function getGridSkillTrainingHoursBreakdown(grid: PlannerGrid, state: GameState): {
  selfStudyHours: number;
  courseHours: number;
  fieldPracticeHours: number;
  readReviewHours: number;
  totalSkillFocusHours: number;
} {
  let selfStudyHours = 0;
  let courseHours = 0;
  let fieldPracticeHours = 0;
  let readReviewHours = 0;

  for (const dayType of ALL_DAY_TYPES) {
    const weight = DAY_TYPE_WEIGHTS[dayType];
    for (const slot of ALL_SLOTS) {
      if (isSlotLocked(dayType, slot, state).locked) continue;
      const actId = resolveEffectiveSlotActivityId(grid, dayType, slot, state);
      const hrs =
        (slot === 'night'
          ? SLOT_HOURS.night + NIGHT_AWAKE_SLEEP_PENALTY_HOURS
          : SLOT_HOURS[slot]) * weight;
      if (actId === 'self_study') selfStudyHours += hrs;
      else if (actId === 'attend_course') courseHours += hrs;
      else if (actId === 'field_practice') fieldPracticeHours += hrs;
      else if (actId === 'read_review') readReviewHours += hrs;
    }
  }

  const totalSkillFocusHours =
    selfStudyHours + courseHours + fieldPracticeHours + readReviewHours * 0.55;

  return {
    selfStudyHours,
    courseHours,
    fieldPracticeHours,
    readReviewHours,
    totalSkillFocusHours,
  };
}

function countSlotHoursForActivities(
  grid: PlannerGrid,
  state: GameState,
  targetIds: ActivityId[]
): number {
  let total = 0;
  for (const dayType of ALL_DAY_TYPES) {
    const weight = DAY_TYPE_WEIGHTS[dayType];
    for (const slot of ALL_SLOTS) {
      if (isSlotLocked(dayType, slot, state).locked) continue;
      const actId = resolveEffectiveSlotActivityId(grid, dayType, slot, state);
      if (targetIds.includes(actId)) {
        total +=
          (slot === 'night'
            ? SLOT_HOURS.night + NIGHT_AWAKE_SLEEP_PENALTY_HOURS
            : SLOT_HOURS[slot]) * weight;
      }
    }
  }
  return total;
}

export function computeOvertimeWeeklyImpact(
  grid: PlannerGrid | undefined,
  state: GameState
): {
  otSessions: number;
  otHoursPerWeek: number;
  otPayPerWeek: number;
  stressDeltaPerWeek: number;
  energyDeltaPerWeek: number;
  familyRelDeltaPerWeek: number;
  hardWorkingEvidence: number;
} {
  const emp = resolveEmploymentState(state);
  const otHourlyRate = computeOvertimeHourlyRate(state);
  if (
    !grid ||
    state.character.ageYears < AGE_LEGAL_RULES.minAdultFullWorkAge ||
    emp.status !== 'employed' ||
    !emp.allowsOvertime ||
    otHourlyRate <= 0
  ) {
    return {
      otSessions: 0,
      otHoursPerWeek: 0,
      otPayPerWeek: 0,
      stressDeltaPerWeek: 0,
      energyDeltaPerWeek: 0,
      familyRelDeltaPerWeek: 0,
      hardWorkingEvidence: 0,
    };
  }

  const otSessions = countOvertimeSlots(grid, state);
  const otHoursPerWeek = countOvertimeHoursPerWeek(grid, state);
  if (otSessions <= 0 || otHoursPerWeek <= 0) {
    return {
      otSessions: 0,
      otHoursPerWeek: 0,
      otPayPerWeek: 0,
      stressDeltaPerWeek: 0,
      energyDeltaPerWeek: 0,
      familyRelDeltaPerWeek: 0,
      hardWorkingEvidence: 0,
    };
  }

  const otPayPerWeek = Math.round(otHourlyRate * otHoursPerWeek);

  return {
    otSessions,
    otHoursPerWeek,
    otPayPerWeek,
    stressDeltaPerWeek: round2(otHoursPerWeek * 0.25),
    energyDeltaPerWeek: -round2(otHoursPerWeek * 0.4),
    familyRelDeltaPerWeek: -Math.max(1, Math.round(otHoursPerWeek / 10)),
    hardWorkingEvidence: Math.max(1, Math.round(otHoursPerWeek / 5)),
  };
}

export function computeNightShiftWeeklyImpact(state: GameState): {
  isNightShift: boolean;
  monthlyPayBonus: number;
  weeklyPayBonusEquiv: number;
  stressDeltaPerWeek: number;
  familyRelDeltaPerWeek: number;
} {
  const emp = resolveEmploymentState(state);
  if (
    emp.status !== 'employed' ||
    emp.workShift !== 'night-morning' ||
    state.character.ageYears < 18
  ) {
    return {
      isNightShift: false,
      monthlyPayBonus: 0,
      weeklyPayBonusEquiv: 0,
      stressDeltaPerWeek: 0,
      familyRelDeltaPerWeek: 0,
    };
  }
  const monthlyPayBonus = Math.round(state.economy.monthlySalary * 0.15);
  return {
    isNightShift: true,
    monthlyPayBonus,
    weeklyPayBonusEquiv: Math.round(monthlyPayBonus / 4),
    stressDeltaPerWeek: 2,
    familyRelDeltaPerWeek: -2,
  };
}

export function computeFreelanceWeeklyPreview(
  grid: PlannerGrid | undefined,
  state: GameState
): {
  freelanceSlots: number;
  expectedPayPerSlot: number;
  expectedIncomePerWeek: number;
  stressDeltaPerWeek: number;
  independentEvidence: number;
  creativeEvidence: number;
} {
  const emp = resolveEmploymentState(state);
  const maxSkill = Math.max(0, ...Object.values(state.character.skills));
  const eligible =
    grid &&
    emp.status !== 'employed' &&
    state.character.ageYears >= 18 &&
    Boolean(state.character.flags?.freelance_unlocked) &&
    maxSkill >= 31;

  if (!eligible || !grid) {
    return {
      freelanceSlots: 0,
      expectedPayPerSlot: 0,
      expectedIncomePerWeek: 0,
      stressDeltaPerWeek: 0,
      independentEvidence: 0,
      creativeEvidence: 0,
    };
  }

  const freelanceSlots = Math.min(7, countFreelanceSlots(grid, state));
  if (freelanceSlots <= 0) {
    return {
      freelanceSlots: 0,
      expectedPayPerSlot: 0,
      expectedIncomePerWeek: 0,
      stressDeltaPerWeek: 0,
      independentEvidence: 0,
      creativeEvidence: 0,
    };
  }

  const expectedPayPerSlot = Math.round(450 * (1 + Math.max(0, maxSkill - 30) * 0.02));
  return {
    freelanceSlots,
    expectedPayPerSlot,
    expectedIncomePerWeek: expectedPayPerSlot * freelanceSlots,
    stressDeltaPerWeek: 3 * freelanceSlots,
    independentEvidence: 2 * freelanceSlots,
    creativeEvidence: 1 * freelanceSlots,
  };
}

export function previewPlannerImpact(grid: PlannerGrid, state: GameState): PlannerImpactPreview {
  const validation = validatePlanner(grid, state);
  const alloc = validation.derivedAllocation;
  const { character, economy } = state;
  const stageId = getLifeSubStageId(character.ageYears);
  const job = JOBS[economy.jobId] ?? JOBS.unemployed;
  const emp = resolveEmploymentState(state);
  const overworkLimit = STAGE_OVERWORK_THRESHOLD[stageId];
  const totalWorkHours = alloc.workOrStudy + alloc.sideGig;
  const overworkHours = Math.max(0, totalWorkHours - overworkLimit);
  const isOverworking = character.ageYears >= 15 && overworkHours > 0;

  const otImpact = computeOvertimeWeeklyImpact(grid, state);
  const nightImpact = computeNightShiftWeeklyImpact(state);
  const freelancePreview = computeFreelanceWeeklyPreview(grid, state);

  const sleepDiffPerDay = (alloc.sleep - TIME_ALLOC_BALANCE.optimalSleepHours) / 7;
  const energyFromSleep = sleepDiffPerDay * TIME_ALLOC_BALANCE.energyPerSleepDiffHour;
  const energyCostNight = (alloc.nightlife / 7) * TIME_ALLOC_BALANCE.nightlifeEnergyPenaltyPerHour;
  const energyCostSideGig = (alloc.sideGig / 7) * TIME_ALLOC_BALANCE.sideGigEnergyPenaltyPerHour;
  const workoutHours = countSlotHoursForActivities(grid, state, ['workout', 'quiet_rest', 'health_check_rest']);
  const energyGainRest = (workoutHours / 7) * 0.12;
  const energyDeltaPerDay = round2(
    energyFromSleep +
      energyGainRest -
      energyCostNight -
      energyCostSideGig -
      overworkHours * 0.08 +
      otImpact.energyDeltaPerWeek / 7
  );

  const sleepDeficit = Math.max(0, TIME_ALLOC_BALANCE.optimalSleepHours - alloc.sleep);
  const stressFromSleep = (sleepDeficit / 7) * TIME_ALLOC_BALANCE.stressPerSleepDeficitHour;
  const stressFromOverwork = (overworkHours / 7) * TIME_ALLOC_BALANCE.overworkStressPerExtraHour;
  const stressFromSideGig = (alloc.sideGig / 7) * TIME_ALLOC_BALANCE.sideGigStressPerHour;
  const stressRelief =
    (alloc.hobby / 7) * TIME_ALLOC_BALANCE.hobbyStressReliefPerHour +
    (alloc.family / 7) * TIME_ALLOC_BALANCE.familyStressReliefPerHour +
    (alloc.nightlife / 7) * TIME_ALLOC_BALANCE.nightlifeStressReliefPerHour;
  const stressDeltaPerDay = round2(
    stressFromSleep +
      stressFromOverwork +
      stressFromSideGig +
      (otImpact.stressDeltaPerWeek + nightImpact.stressDeltaPerWeek + freelancePreview.stressDeltaPerWeek) / 7 -
      stressRelief * 0.4
  );

  const overtimePayPerWeek = otImpact.otPayPerWeek;
  const freelanceExpectedIncomePerWeek = freelancePreview.expectedIncomePerWeek;
  const nightShiftBonusPerWeek = nightImpact.weeklyPayBonusEquiv;
  const familyRelDeltaPerWeek = otImpact.familyRelDeltaPerWeek + nightImpact.familyRelDeltaPerWeek;

  const baseGigCheck =
    alloc.sideGig > 0
      ? checkSideGigEligibility({ ...state, timeAllocation: alloc })
      : { allowed: false, maxHours: 0 };
  const payableSideGigHours =
    alloc.sideGig > 0 && baseGigCheck.allowed && state.sideGigRecord
      ? Math.min(alloc.sideGig, baseGigCheck.maxHours)
      : 0;
  const sideGigIncomePerWeek =
    payableSideGigHours > 0 && state.sideGigRecord
      ? Math.round(payableSideGigHours * state.sideGigRecord.hourlyPay)
      : 0;

  const costRes = resolveAffordableWeeklyActivities(state, grid);
  const activityCostPerWeek =
    character.ageYears >= 15 ? costRes.totalWeeklyCost : 0;
  const netMoneyPerWeek =
    overtimePayPerWeek +
    freelanceExpectedIncomePerWeek +
    nightShiftBonusPerWeek +
    sideGigIncomePerWeek -
    activityCostPerWeek;

  // Relationship directional arrow (accounts for OT / Night shift family penalty + social/family time)
  const relHours = alloc.social + alloc.family + alloc.nightlife * 0.5;
  const relationshipArrow: 'up' | 'down' | 'neutral' =
    familyRelDeltaPerWeek <= -2 || relHours <= 10
      ? 'down'
      : relHours >= 24 && familyRelDeltaPerWeek >= 0
        ? 'up'
        : 'neutral';
  const energyArrow: 'up' | 'down' | 'neutral' =
    energyDeltaPerDay >= 0.25 ? 'up' : energyDeltaPerDay <= -0.35 ? 'down' : 'neutral';
  const stressArrow: 'up' | 'down' | 'neutral' =
    stressDeltaPerDay >= 0.35 ? 'up' : stressDeltaPerDay <= -0.3 ? 'down' : 'neutral';

  // Focused skills growth preview using derived allocation & planner grid
  const previewState: GameState = {
    ...state,
    planner: {
      ...(state.planner ?? { grid }),
      grid,
    },
    timeAllocation: alloc,
  };
  const training = createInitialSkillTrainingState(state.skillTraining);
  const focusList = training.focus;
  const focusedSkillsSummary = focusList.map((sk) => {
    const d = getSkillGrowthDetails(previewState, sk);
    return {
      skillId: sk,
      labelTh: SKILL_LABELS[sk]?.label ?? sk,
      level: d.level,
      effectiveCap: d.effectiveCap,
      atCap: d.atCap,
      estimatedWeeklyGain: d.estimatedWeeklyGain,
      unlockHintTh: d.unlockHintTh,
    };
  });

  // Distinct scenes player will see in this grid
  const seenSceneNames = new Set<string>();
  const jobSceneId = job?.sceneId;
  for (const dayType of ALL_DAY_TYPES) {
    for (const slot of ALL_SLOTS) {
      const actId = resolveEffectiveSlotActivityId(grid, dayType, slot, state);
      const act = ACTIVITIES_BY_ID.get(actId);
      if (!act) continue;
      let targetSceneId = act.sceneId;
      if (actId === 'school_class') {
        targetSceneId = character.ageYears >= 18 ? 'university' : 'school_public';
      } else if (actId === 'work_shift' || actId === 'overtime_work' || actId === 'flexible_work') {
        targetSceneId = jobSceneId && jobSceneId !== 'home' ? jobSceneId : 'work_corporate';
      } else if (actId === 'side_gig_work' && state.sideGigRecord?.sceneId) {
        targetSceneId = state.sideGigRecord.sceneId;
      }
      if (targetSceneId === 'home') {
        seenSceneNames.add('บ้านพัก');
      } else {
        seenSceneNames.add(SCENE_NAME_BY_ID.get(targetSceneId) ?? targetSceneId);
      }
    }
  }

  const resultingDaypartHint =
    alloc.nightlife >= TIME_ALLOC_BALANCE.nightlifeDominantMinHours &&
    alloc.nightlife >= alloc.social &&
    alloc.nightlife >= alloc.hobby &&
    alloc.nightlife >= alloc.selfDev
      ? 'night'
      : 'normal';

  return {
    derivedAllocation: alloc,
    validation,
    energyArrow,
    stressArrow,
    relationshipArrow,
    energyDeltaPerDay,
    stressDeltaPerDay,
    overtimePayPerWeek,
    freelanceExpectedIncomePerWeek,
    nightShiftBonusPerWeek,
    familyRelDeltaPerWeek,
    workShiftLabelTh: emp.status === 'employed' ? WORK_SHIFT_LABELS_TH[emp.workShift] : undefined,
    otSlotsCount: otImpact.otSessions,
    otHoursPerWeek: otImpact.otHoursPerWeek,
    otLimitExceeded: otImpact.otSessions > 2,
    sideGigIncomePerWeek,
    activityCostPerWeek,
    netMoneyPerWeek,
    isOverworking,
    overworkHours,
    resultingDaypartHint,
    focusedSkillsSummary,
    scenesToSee: Array.from(seenSceneNames).slice(0, 6),
    warningsTh: validation.warnings,
  };
}

/**
 * Migrates Phase 3.2.1 (or older) state into Phase 3.2.2 PlannerState (Spec 06 §6).
 * - Preserves known lifestylePresetId as matching template grid.
 * - Maps 'custom' -> 'balanced' grid AND appends the mandatory timeline note.
 * - Ensures planner.grid & timeAllocation stay 100% synced.
 */
export function migratePlanner(oldState: GameState): GameState {
  if (oldState.planner?.grid) {
    const sanitizedGrid = sanitizeGridForState(oldState.planner.grid, oldState);
    const sanitizedPending = oldState.planner.pendingGrid
      ? sanitizeGridForState(oldState.planner.pendingGrid, oldState)
      : undefined;
    const derived = deriveWeeklyAllocation(sanitizedGrid, oldState);
    return {
      ...oldState,
      planner: {
        ...oldState.planner,
        grid: sanitizedGrid,
        pendingGrid: sanitizedPending,
      },
      timeAllocation: derived,
    };
  }

  const preset = oldState.lifestylePresetId;
  if (preset === 'custom') {
    const res = applyPresetTemplate('balanced', oldState);
    let next = res.state;
    const alreadyLogged = next.timeline.some(
      (t) => t.title === UI_TEXT.PLANNER.migratedCustomTimelineTitle
    );
    if (!alreadyLogged) {
      next = appendTimeline(next, {
        category: 'life',
        title: UI_TEXT.PLANNER.migratedCustomTimelineTitle,
        description: UI_TEXT.PLANNER.migratedCustomTimelineDesc,
      });
    }
    return next;
  }

  const targetPreset: LifestylePresetId = preset ?? 'balanced';
  const applied = applyPresetTemplate(targetPreset, oldState);
  if (applied.accepted) {
    return applied.state;
  }
  return applyPresetTemplate('balanced', oldState).state;
}

export function getActivityCatalogForPicker(): ActivityDef[] {
  return ACTIVITY_CATALOG;
}

export function formatImpactArrowLabel(
  arrow: 'up' | 'down' | 'neutral' | undefined,
  invertGood = false
): { text: string; toneClass: string } {
  if (!arrow || arrow === 'neutral') {
    return { text: 'ทรงตัว', toneClass: 'bg-[#F4F0FF] text-[#5A4773]' };
  }
  const good = invertGood ? arrow === 'down' : arrow === 'up';
  return {
    text: arrow === 'up' ? 'ขึ้น' : 'ลง',
    toneClass: good
      ? 'bg-[#D6FAEA] text-[#167956]'
      : 'bg-[#FFE0EE] text-[#BD346B]',
  };
}

// =====================================================================
// Phase 3.2.3: Activity Re-lock, Streaks, Annual Focus & Yearly Calendar
// =====================================================================

const RELOCK_TRACKED_ACTIVITIES = new Set<ActivityId>([
  'university_club',
  'stream_content',
  'raise_child',
  'advanced_competition',
  'freelance_work',
  'attend_course',
  'field_practice',
]);

export function sanitizePlannerWithRelockNotice(
  planner: PlannerState,
  state: GameState
): { planner: PlannerState; relockNoticeTh?: string } {
  const prevGrid = planner.grid;
  const cleanGrid = sanitizeGridForState(prevGrid, state);
  const relocked: string[] = [];

  for (const dt of ALL_DAY_TYPES) {
    for (const sl of ALL_SLOTS) {
      if (isSlotLocked(dt, sl, state).locked) continue;
      const oldActId = prevGrid[dt]?.[sl];
      const newActId = cleanGrid[dt]?.[sl];
      if (oldActId && oldActId !== newActId && RELOCK_TRACKED_ACTIVITIES.has(oldActId)) {
        const oldDef = ACTIVITIES_BY_ID.get(oldActId);
        const avail = isActivityAvailableInSlot(oldActId, dt, sl, state);
        if (!avail.allowed && oldDef) {
          relocked.push(
            `"${oldDef.nameTh}" ถูกล็อกคืน (${avail.reasonTh ?? 'เงื่อนไขไม่ครบแล้ว'}) จึงสลับเป็นกิจกรรมพื้นฐานให้อัตโนมัติ`
          );
        }
      }
    }
  }

  const uniqueReason = relocked.length > 0 ? Array.from(new Set(relocked)).join(' · ') : undefined;
  return {
    planner: {
      ...planner,
      grid: cleanGrid,
      lastRelockReasonTh: uniqueReason ?? planner.lastRelockReasonTh,
    },
    relockNoticeTh: uniqueReason,
  };
}

export function createInitialPlannerStreaks(presetId?: LifestylePresetId | 'custom'): PlannerStreakState {
  return {
    presetId: presetId ?? 'balanced',
    presetWeeks: 0,
    majorGroupWeeks: {},
    overtimeWeeks: 0,
    workoutWeeks: 0,
    sleepDeficitWeeks: 0,
    sleepFullWeeks: 0,
    clubWeeks: 0,
    streamUnlockedWeeks: 0,
    mismatchPresetWeeks: 0,
    studyTeenWeeks: 0,
    socialKidsPlayWeeks: 0,
  };
}

function isPresetConflictingWithStateTraits(
  presetId: LifestylePresetId | 'custom' | undefined,
  state: GameState
): boolean {
  if (!presetId || presetId === 'custom' || presetId === 'balanced') return false;
  const traitIds = new Set<string>([
    ...(state.character.traits ?? []),
    ...(state.character.emergentTraits ?? []).map((t) => t.id),
  ]);
  if (
    (presetId === 'skill_grind' ||
      presetId === 'workaholic' ||
      presetId === 'study_focus' ||
      presetId === 'work_and_gig' ||
      presetId === 'fitness') &&
    traitIds.has('slacker')
  ) {
    return true;
  }
  if ((presetId === 'social_party' || presetId === 'friends_only') && traitIds.has('solitude_lover')) {
    return true;
  }
  if (presetId === 'homebody' && (traitIds.has('party_lover') || traitIds.has('peer_attached'))) {
    return true;
  }
  if (presetId === 'rest_recover' && traitIds.has('workaholic')) {
    return true;
  }
  return false;
}

/**
 * Deterministic weekly streak updater inside pipeline.onWeek() (Spec 06 §9.4).
 * Depends ONLY on committed planner.grid, lifestylePresetId, flags, traits, and sleep norms — zero RNG.
 */
export function updatePlannerStreaksWeekly(state: GameState): GameState {
  if (!state.planner?.grid) return state;

  const prev = state.planner.streaks ?? createInitialPlannerStreaks(state.lifestylePresetId);
  const grid = state.planner.grid;
  const presetId = state.lifestylePresetId ?? state.planner.presetId ?? 'balanced';
  const alloc = state.timeAllocation ?? deriveWeeklyAllocation(grid, state);
  const stageDef = getLifeStageForAge(state.character.ageYears);
  const minSleep = STAGE_MIN_SLEEP_HOURS[stageDef.id];

  const groupsPresent = new Set<ActivityMajorGroup>();
  let hasOvertime = false;
  let hasWorkout = false;
  let hasClub = false;
  let hasFullSleepNight = false;

  for (const dt of ALL_DAY_TYPES) {
    for (const sl of ALL_SLOTS) {
      const actId = resolveEffectiveSlotActivityId(grid, dt, sl, state);
      const def = ACTIVITIES_BY_ID.get(actId);
      if (def) {
        groupsPresent.add(def.majorGroup);
      }
      if (actId === 'overtime_work') hasOvertime = true;
      if (actId === 'workout' || actId === 'advanced_competition') hasWorkout = true;
      if (actId === 'university_club') hasClub = true;
      if (sl === 'night' && actId === 'sleep_full') hasFullSleepNight = true;
    }
  }

  const nextMajorGroupWeeks: Partial<Record<ActivityMajorGroup, number>> = {};
  for (const grp of groupsPresent) {
    nextMajorGroupWeeks[grp] = (prev.majorGroupWeeks[grp] ?? 0) + 1;
  }

  const samePreset = prev.presetId === presetId;
  const presetWeeks = samePreset ? prev.presetWeeks + 1 : 1;
  const isSleepDeficit = alloc.sleep < Math.max(minSleep + 1, TIME_ALLOC_BALANCE.optimalSleepHours - 4);
  const isSleepFull = alloc.sleep >= TIME_ALLOC_BALANCE.optimalSleepHours && hasFullSleepNight;
  const hasStreamFlag = Boolean(state.character.flags?.stream_unlocked);
  const isMismatch = isPresetConflictingWithStateTraits(presetId, state);
  const isStudyTeen =
    state.character.ageYears >= 6 &&
    state.character.ageYears <= 17 &&
    (presetId === 'study_focus' || alloc.selfDev >= 10);
  const isKidsPlay =
    state.character.ageYears >= 6 &&
    state.character.ageYears <= 14 &&
    (presetId === 'kid_play' || alloc.social + alloc.hobby >= 28);

  const nextStreaks: PlannerStreakState = {
    presetId,
    presetWeeks,
    majorGroupWeeks: nextMajorGroupWeeks,
    overtimeWeeks: hasOvertime ? prev.overtimeWeeks + 1 : 0,
    workoutWeeks: hasWorkout ? prev.workoutWeeks + 1 : 0,
    sleepDeficitWeeks: isSleepDeficit ? prev.sleepDeficitWeeks + 1 : 0,
    sleepFullWeeks: isSleepFull ? prev.sleepFullWeeks + 1 : 0,
    clubWeeks: hasClub ? prev.clubWeeks + 1 : 0,
    streamUnlockedWeeks: hasStreamFlag ? prev.streamUnlockedWeeks + 1 : 0,
    mismatchPresetWeeks: isMismatch ? prev.mismatchPresetWeeks + 1 : 0,
    studyTeenWeeks: isStudyTeen ? prev.studyTeenWeeks + 1 : 0,
    socialKidsPlayWeeks: isKidsPlay ? prev.socialKidsPlayWeeks + 1 : 0,
  };

  return {
    ...state,
    planner: {
      ...state.planner,
      streaks: nextStreaks,
    },
  };
}

export function createInitialAnnualFocusState(state: GameState): AnnualFocusState {
  const skillKeys = Object.keys(state.character.skills) as SkillKey[];
  const avgSkill =
    skillKeys.length > 0
      ? skillKeys.reduce((s, k) => s + (state.character.skills[k] ?? 0), 0) / skillKeys.length
      : 0;
  return {
    current: 'none',
    yearCE: state.date.yearCE,
    changesThisYear: 0,
    snapshot: {
      yearCE: state.date.yearCE,
      startCash: state.economy.cash,
      startAvgSkill: round2(avgSkill),
      startPhysical: round2(state.character.indices.physical),
      stressSum: state.character.resources.stress,
      stressSamples: 1,
    },
  };
}

export function canChangeAnnualFocus(state: GameState): {
  allowed: boolean;
  changesLeft: number;
  reasonTh?: string;
} {
  if (state.character.ageYears < ANNUAL_FOCUS_CONFIG.minAge) {
    return {
      allowed: false,
      changesLeft: 0,
      reasonTh: UI_TEXT.ANNUAL_FOCUS.under13Notice,
    };
  }
  const af = state.planner?.annualFocus;
  const used = af && af.yearCE === state.date.yearCE ? af.changesThisYear : 0;
  const left = Math.max(0, ANNUAL_FOCUS_CONFIG.maxChangesPerYear - used);
  if (left <= 0) {
    return {
      allowed: false,
      changesLeft: 0,
      reasonTh: UI_TEXT.ANNUAL_FOCUS.maxChangesError,
    };
  }
  return { allowed: true, changesLeft: left };
}

export function applyAnnualFocusChange(
  state: GameState,
  focusId: AnnualFocusId
): { state: GameState; accepted: boolean; message?: string } {
  const gate = canChangeAnnualFocus(state);
  if (!gate.allowed) {
    return { state, accepted: false, message: gate.reasonTh };
  }
  const basePlanner = state.planner ?? createInitialPlannerState(state);
  const existing = basePlanner.annualFocus ?? createInitialAnnualFocusState(state);
  if (existing.current === focusId && existing.yearCE === state.date.yearCE) {
    return { state, accepted: true, message: 'ใช้เป้าหมายนี้อยู่แล้ว' };
  }

  const usedThisYear = existing.yearCE === state.date.yearCE ? existing.changesThisYear : 0;
  const focusLabel = ANNUAL_FOCUS_BY_ID.get(focusId)?.labelTh ?? focusId;

  const nextState: GameState = {
    ...state,
    planner: {
      ...basePlanner,
      annualFocus: {
        ...existing,
        current: focusId,
        yearCE: state.date.yearCE,
        changesThisYear: usedThisYear + 1,
      },
    },
  };

  return {
    state: nextState,
    accepted: true,
    message: `ตั้งเป้าหมายประจำปีเป็น "${focusLabel}" แล้ว (เปลี่ยนได้อีก ${ANNUAL_FOCUS_CONFIG.maxChangesPerYear - (usedThisYear + 1)} ครั้งในปีนี้)`,
  };
}

export function buildAnnualFocusBirthdayPrompt(state: GameState): PendingEventPrompt {
  const age = state.character.ageYears;
  const prevFocus = state.planner?.annualFocus?.current ?? 'none';
  const prevLabel = ANNUAL_FOCUS_BY_ID.get(prevFocus)?.labelTh ?? 'ไม่ระบุ';

  const focusChoices = ANNUAL_FOCUS_LIST.filter((f) => f.id !== 'none').map((f) => ({
    id: `annual_focus_${f.id}`,
    label: f.labelTh,
    hint: f.shortDescTh,
    effects: [
      {
        type: 'SetAnnualFocus' as const,
        focusId: f.id,
        reason: `ตั้งเป้าหมายประจำปีวัย ${age} ปี: ${f.labelTh}`,
      },
    ],
  }));

  focusChoices.push({
    id: 'annual_focus_skip',
    label: UI_TEXT.ANNUAL_FOCUS.skipKeepLabel,
    hint: `คงแนวทาง "${prevLabel}" ไว้และดำเนินชีวิตต่อทันที`,
    effects: [
      {
        type: 'SetAnnualFocus' as const,
        focusId: prevFocus,
        reason: `ข้ามการเลือกเป้าหมายและคงแนวทาง "${prevLabel}"`,
      },
    ],
  });

  return {
    id: `annual_focus_bday_${state.date.yearCE}_${age}`,
    title: UI_TEXT.ANNUAL_FOCUS.birthdayPromptTitle(age),
    category: 'milestone',
    importance: 6,
    sceneTag: 'home',
    description: UI_TEXT.ANNUAL_FOCUS.birthdayPromptBody(age, prevLabel),
    choices: focusChoices,
  };
}

export interface YearlyCalendarEventItem {
  id: string;
  month: number;
  day: number;
  kind: 'birthday' | 'holiday' | 'course' | 'finance' | 'pin';
  titleTh: string;
  subtitleTh?: string;
  pinId?: string;
}

const THAI_PUBLIC_HOLIDAY_LIST: ReadonlyArray<{ month: number; day: number; titleTh: string }> = [
  { month: 1, day: 1, titleTh: 'วันขึ้นปีใหม่' },
  { month: 4, day: 6, titleTh: 'วันจักรี' },
  { month: 4, day: 13, titleTh: 'วันสงกรานต์' },
  { month: 4, day: 14, titleTh: 'วันสงกรานต์ (วันครอบครัว)' },
  { month: 4, day: 15, titleTh: 'วันสงกรานต์' },
  { month: 5, day: 1, titleTh: 'วันแรงงานแห่งชาติ' },
  { month: 5, day: 4, titleTh: 'วันฉัตรมงคล' },
  { month: 6, day: 3, titleTh: 'วันเฉลิมพระชนมพรรษาพระราชินี' },
  { month: 7, day: 28, titleTh: 'วันเฉลิมพระชนมพรรษา ร.10' },
  { month: 8, day: 12, titleTh: 'วันแม่แห่งชาติ' },
  { month: 10, day: 13, titleTh: 'วันนวมินทรมหาราช' },
  { month: 10, day: 23, titleTh: 'วันปิยมหาราช' },
  { month: 12, day: 5, titleTh: 'วันพ่อแห่งชาติ' },
  { month: 12, day: 10, titleTh: 'วันรัฐธรรมนูญ' },
  { month: 12, day: 31, titleTh: 'วันสิ้นปี' },
];

/**
 * Pure read-only yearly calendar builder (Spec 06 §9.2).
 * Fog of Knowledge: NEVER exposes hidden delayed echoQueue or consequenceQueue events.
 */
export function getYearlyCalendarEvents(state: GameState): YearlyCalendarEventItem[] {
  const items: YearlyCalendarEventItem[] = [];

  // 1. Character birthday (starting date May 14)
  items.push({
    id: 'cal_birthday',
    month: 5,
    day: 14,
    kind: 'birthday',
    titleTh: `วันคล้ายวันเกิดของ ${state.character.firstName}`,
    subtitleTh: 'โอกาสทบทวนและตั้งเป้าหมายประจำปี',
  });

  // 2. Thai public holidays (verified via clock.ts)
  for (const hol of THAI_PUBLIC_HOLIDAY_LIST) {
    if (isThaiPublicHoliday(hol.month, hol.day)) {
      items.push({
        id: `cal_hol_${hol.month}_${hol.day}`,
        month: hol.month,
        day: hol.day,
        kind: 'holiday',
        titleTh: hol.titleTh,
        subtitleTh: 'วันหยุดราชการ (ตารางใช้วันหยุดแทนวันทำงาน)',
      });
    }
  }

  // 3. School break markers if student
  if (state.economy.jobId === 'student') {
    if (isThaiSchoolBreak(3, 15)) {
      items.push({
        id: 'cal_break_summer',
        month: 3,
        day: 15,
        kind: 'holiday',
        titleTh: 'เริ่มปิดเทอมใหญ่ฤดูร้อน (15 มี.ค. – 30 เม.ย.)',
        subtitleTh: 'ตารางเรียนช่วงกลางวันผ่อนเป็นตารางวันหยุด',
      });
    }
    if (isThaiSchoolBreak(10, 1)) {
      items.push({
        id: 'cal_break_oct',
        month: 10,
        day: 1,
        kind: 'holiday',
        titleTh: 'ช่วงปิดเทอมตุลาคม (1 – 31 ต.ค.)',
        subtitleTh: 'ตารางเรียนช่วงกลางวันผ่อนเป็นตารางวันหยุด',
      });
    }
  }

  // 4. Enrolled skill course estimated completion date
  const course = state.skillTraining?.course;
  if (course && course.weeksLeft > 0) {
    let cur = state.date;
    const totalCourseDays = course.weeksLeft * 7;
    for (let i = 0; i < totalCourseDays; i++) {
      cur = advanceOneDay(cur).nextDate;
    }
    const skLabel = SKILL_LABELS[course.skillId]?.label ?? course.skillId;
    items.push({
      id: 'cal_course_end',
      month: cur.month,
      day: cur.day,
      kind: 'course',
      titleTh: `จบคอร์สทักษะ${skLabel}`,
      subtitleTh: `เหลืออีก ${course.weeksLeft} สัปดาห์ (${cur.yearCE + 543})`,
    });
  }

  // 5. Next monthly payday / rent & debt cycle (day 1)
  if (state.character.ageYears >= 15) {
    const curMonth = state.date.month;
    const nextMonth = curMonth === 12 ? 1 : curMonth + 1;
    const paydayReason =
      state.economy.monthlySalary > 0
        ? 'วันเงินเดือนออกและสรุปรอบบิลรายเดือน'
        : 'วันรับเงินสนับสนุนและสรุปค่าใช้จ่ายประจำเดือน';
    items.push({
      id: `cal_finance_${nextMonth}_1`,
      month: nextMonth,
      day: 1,
      kind: 'finance',
      titleTh: paydayReason,
      subtitleTh:
        state.economy.debt > 0
          ? 'รวมหักชำระหนี้ขั้นต่ำและค่าเช่าที่พัก'
          : 'สรุปรายรับ-รายจ่ายประจำเดือน',
    });
  }

  // 6. Player-pinned appointments (sanitized valid month/day)
  for (const pin of state.planner?.calendarPins ?? []) {
    const maxDay = getDaysInMonth(state.date.yearCE, clamp(pin.month, 1, 12));
    items.push({
      id: `cal_pin_${pin.id}`,
      month: clamp(pin.month, 1, 12),
      day: clamp(pin.day, 1, maxDay),
      kind: 'pin',
      titleTh: pin.title,
      subtitleTh: pin.note || 'นัดหมายส่วนตัว',
      pinId: pin.id,
    });
  }

  return items.sort((a, b) => (a.month !== b.month ? a.month - b.month : a.day - b.day));
}

export function addPlannerCalendarPin(
  state: GameState,
  month: number,
  day: number,
  title: string,
  note?: string
): { state: GameState; accepted: boolean; message?: string } {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return { state, accepted: false, message: 'กรุณาใส่ชื่อนัดหมาย' };
  }
  const safeMonth = clamp(Math.round(month), 1, 12);
  const safeDay = clamp(Math.round(day), 1, getDaysInMonth(state.date.yearCE, safeMonth));
  const basePlanner = state.planner ?? createInitialPlannerState(state);
  const prevPins = basePlanner.calendarPins ?? [];
  if (prevPins.length >= 24) {
    return { state, accepted: false, message: 'ปักหมุดนัดหมายได้สูงสุด 24 รายการต่อปี' };
  }
  const nextPin: CalendarPin = {
    id: `pin_${state.date.totalDays}_${prevPins.length + 1}`,
    month: safeMonth,
    day: safeDay,
    title: cleanTitle.slice(0, 60),
    note: note?.trim() ? note.trim().slice(0, 100) : undefined,
  };
  return {
    state: {
      ...state,
      planner: {
        ...basePlanner,
        calendarPins: [...prevPins, nextPin],
      },
    },
    accepted: true,
    message: `ปักหมุด "${nextPin.title}" วันที่ ${safeDay}/${safeMonth} เรียบร้อย`,
  };
}

export function removePlannerCalendarPin(state: GameState, pinId: string): GameState {
  if (!state.planner?.calendarPins) return state;
  return {
    ...state,
    planner: {
      ...state.planner,
      calendarPins: state.planner.calendarPins.filter((p) => p.id !== pinId),
    },
  };
}
