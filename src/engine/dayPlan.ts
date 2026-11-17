import { ACTIVITIES_BY_ID, type ActivityDef } from '../data/activities';
import { deriveClassTier } from '../data/sceneMeta';
import { JOBS, validateJobsScheduleInDev } from '../data/thaiData';
import { UI_TEXT } from '../data/uiText';
import { isThaiPublicHoliday, isThaiSchoolBreak } from './clock';
import { checkSideGigEligibility } from './economy';
import { canEnterNightlife, getAgeEmploymentRules } from './lifeStage';
import {
  getSlotActivity,
  resolveAffordableWeeklyActivities,
} from './planner';
import {
  ALL_DAYPARTS,
  type Daypart,
  isSceneOpen,
  pickHomeSceneForState,
  SCENES_BY_ID,
  type SceneSettings,
} from './scene';
import { getDominantNightDaypart } from './timeAlloc';
import type { ActivityId, GameState, TimeAllocation } from './types';

export type Activity =
  | 'sleep'
  | 'work'
  | 'study'
  | 'side_gig'
  | 'social'
  | 'hobby'
  | 'family'
  | 'self_dev'
  | 'nightlife'
  | 'errand'
  | 'rest';

export type SlotFallbackReason = 'closed' | 'underage' | 'nightlife_age';

export interface DaySlot {
  daypart: Daypart;
  activity: Activity;
  catalogActivityId?: ActivityId;
  isHolidayOverride?: boolean;
  sceneId: string;
  fallbackFrom?: string;
  fallbackReason?: SlotFallbackReason;
  isOvertime?: boolean;
  importance: number;
}

export type DayPlan = [DaySlot, DaySlot, DaySlot, DaySlot];

const DEFAULT_FREE_ALLOC: TimeAllocation = {
  sleep: 56,
  workOrStudy: 40,
  sideGig: 0,
  social: 18,
  hobby: 18,
  family: 16,
  selfDev: 14,
  nightlife: 6,
};

/**
 * Deterministic 32-bit hash from seed + totalDays + salt.
 * Pure function: never calls Math.random() and never mutates state.rngState.
 */
function hashDayPlan(seed: number, totalDays: number, salt: string): number {
  let h = (Math.imul(seed | 0, 374761393) ^ Math.imul((totalDays + 1) | 0, 668265263)) >>> 0;
  for (let i = 0; i < salt.length; i++) {
    h = Math.imul(h ^ salt.charCodeAt(i), 16777619) >>> 0;
  }
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function pickWeightedFromHash<T>(items: Array<{ item: T; weight: number }>, hashVal: number): T {
  const positive = items.filter((entry) => entry.weight > 0);
  if (positive.length === 0) return items[0].item;
  const total = positive.reduce((sum, entry) => sum + entry.weight, 0);
  let target = hashVal % Math.max(1, total);
  for (const entry of positive) {
    if (target < entry.weight) return entry.item;
    target -= entry.weight;
  }
  return positive[positive.length - 1].item;
}

function resolveSchoolSceneId(state: GameState): string {
  if (state.character.ageYears >= 18) {
    return 'university';
  }
  if (state.character.background.familyWealth === 'wealthy') {
    return 'school_international';
  }
  if (Math.abs(state.seed) % 4 === 0) {
    return 'school_temple';
  }
  return 'school_public';
}

function pickOpenCandidate(
  candidates: string[],
  daypart: Daypart,
  age: number,
  homeScene: string,
  settings?: SceneSettings,
  options?: { isOvertime?: boolean }
): {
  sceneId: string;
  fallbackFrom?: string;
  fallbackReason?: SlotFallbackReason;
} {
  if (candidates.length === 0) {
    return { sceneId: homeScene };
  }

  let firstFailed: string | undefined;
  let firstReason: SlotFallbackReason | undefined;

  for (const candidateId of candidates) {
    if (isSceneOpen(candidateId, daypart, age, settings, options)) {
      return firstFailed
        ? { sceneId: candidateId, fallbackFrom: firstFailed, fallbackReason: firstReason }
        : { sceneId: candidateId };
    }
    if (!firstFailed) {
      firstFailed = candidateId;
      if (candidateId === 'nightlife_pub' && !canEnterNightlife(age, settings)) {
        firstReason = age < 18 ? 'underage' : 'nightlife_age';
      } else {
        firstReason = 'closed';
      }
    }
  }

  return {
    sceneId: homeScene,
    fallbackFrom: firstFailed,
    fallbackReason: firstReason ?? 'closed',
  };
}

function resolveActivityCandidates(
  activity: Activity,
  state: GameState,
  homeScene: string,
  hashVal: number
): string[] {
  const { character, economy } = state;
  const age = character.ageYears;
  const classTier = deriveClassTier(character.background.familyWealth, economy.cash);
  const isUpperTier = classTier === 'T3' || classTier === 'T4' || classTier === 'T5';

  switch (activity) {
    case 'social':
      return isUpperTier
        ? ['cafe', 'street_shops', 'market_fresh']
        : ['street_shops', 'market_fresh', 'cafe'];
    case 'hobby':
      return hashVal % 3 === 0 ? ['street_shops', homeScene] : [homeScene, 'street_shops'];
    case 'family':
      return hashVal % 3 === 0 ? ['restaurant_tamsang', homeScene] : [homeScene, 'restaurant_tamsang'];
    case 'self_dev':
      if (economy.jobId === 'student' && age >= 18) {
        return ['university', 'cafe', homeScene];
      }
      if (classTier === 'T4' || classTier === 'T5') {
        return ['cafe', homeScene];
      }
      return [homeScene, 'cafe'];
    case 'nightlife':
      return age >= 18 ? ['nightlife_pub', 'street_food_night'] : ['street_food_night'];
    case 'errand':
      return character.indices.physical < 50
        ? ['hospital', 'shop_minimart', 'market_fresh', 'street_shops']
        : ['market_fresh', 'shop_minimart', 'street_shops'];
    case 'side_gig': {
      const pool =
        age >= 18
          ? ['street_shops', 'market_fresh', 'cafe', 'restaurant_tamsang', 'shop_minimart', 'street_food_night']
          : ['shop_minimart', 'street_shops', 'cafe', 'market_fresh', 'restaurant_tamsang'];
      const offset = hashVal % pool.length;
      return [...pool.slice(offset), ...pool.slice(0, offset)];
    }
    case 'sleep':
    case 'rest':
    default:
      return [homeScene];
  }
}

function getActivityImportance(activity: Activity): number {
  switch (activity) {
    case 'work':
    case 'study':
      return 80;
    case 'side_gig':
      return 70;
    case 'nightlife':
      return 60;
    case 'social':
    case 'errand':
      return 50;
    case 'hobby':
    case 'family':
    case 'self_dev':
      return 40;
    case 'rest':
      return 20;
    case 'sleep':
    default:
      return 10;
  }
}

function resolveCandidatesForCatalogActivity(
  def: ActivityDef,
  state: GameState,
  homeScene: string,
  hashVal: number
): string[] {
  if (def.id === 'side_gig_work') {
    const basePool = resolveActivityCandidates('side_gig', state, homeScene, hashVal);
    return state.sideGigRecord?.sceneId && SCENES_BY_ID.has(state.sideGigRecord.sceneId)
      ? [state.sideGigRecord.sceneId, ...basePool]
      : basePool;
  }

  if (def.id === 'attend_course' && state.economy.jobId !== 'student') {
    const classTier = deriveClassTier(state.character.background.familyWealth, state.economy.cash);
    return classTier === 'T4' || classTier === 'T5'
      ? ['cafe', 'street_shops', homeScene]
      : [homeScene, 'cafe', 'street_shops'];
  }

  const primary = def.sceneId === 'home' ? homeScene : def.sceneId;
  const alt = def.alternateSceneId
    ? def.alternateSceneId === 'home'
      ? homeScene
      : def.alternateSceneId
    : undefined;
  const pool = resolveActivityCandidates(def.dayPlanActivity, state, homeScene, hashVal);
  const raw = [primary, ...(alt ? [alt] : []), ...pool];
  // Never pick university scene unless character is an adult student
  return Array.from(
    new Set(
      raw.filter((s) => !(s === 'university' && (state.economy.jobId !== 'student' || state.character.ageYears < 18)))
    )
  );
}

/**
 * Pure daily schedule builder returning 4 DaySlots (morning, afternoon, evening, night).
 * Priority order per Spec 06 §1 #4:
 *   Event / Scene Mode > Locked Role Slots (work/study/shift) > Life Planner Grid > Stage Default.
 */
export function buildDayPlan(state: GameState, settings?: SceneSettings): DayPlan {
  validateJobsScheduleInDev();

  const effectiveSettings = settings ?? state.settings;
  const { character, economy, date } = state;
  const age = character.ageYears;
  const homeScene = pickHomeSceneForState(state);
  const empRules = getAgeEmploymentRules(age, effectiveSettings);
  const alloc = state.timeAllocation ?? DEFAULT_FREE_ALLOC;

  const slots: [DaySlot | null, DaySlot | null, DaySlot | null, DaySlot | null] = [
    null,
    null,
    null,
    null,
  ];

  // Step 1: Special conditions (deceased or unexpired sceneMode)
  if (!character.isAlive) {
    return ALL_DAYPARTS.map((daypart) => ({
      daypart,
      activity: 'rest' as const,
      sceneId: 'hospital',
      importance: 100,
    })) as DayPlan;
  }

  if (
    state.sceneMode?.sceneId &&
    SCENES_BY_ID.has(state.sceneMode.sceneId) &&
    (state.sceneMode.expiresAtTotalDay === undefined ||
      date.totalDays < state.sceneMode.expiresAtTotalDay)
  ) {
    const modeSceneId = state.sceneMode.sceneId;
    const modeActivity: Activity = modeSceneId === 'hospital' ? 'rest' : 'errand';
    return ALL_DAYPARTS.map((daypart) => {
      const picked = pickOpenCandidate([modeSceneId], daypart, age, homeScene, effectiveSettings);
      return {
        daypart,
        activity: modeActivity,
        sceneId: picked.sceneId,
        fallbackFrom: picked.fallbackFrom,
        fallbackReason: picked.fallbackReason,
        importance: 100,
      };
    }) as DayPlan;
  }

  // Step 2: Severe illness -> daytime slots at hospital
  if (
    character.indices.physical < 22 ||
    (character.indices.physical < 35 && character.resources.energy < 12)
  ) {
    slots[0] = { daypart: 'morning', activity: 'errand', sceneId: 'hospital', importance: 90 };
    slots[1] = { daypart: 'afternoon', activity: 'errand', sceneId: 'hospital', importance: 90 };
    slots[2] = { daypart: 'evening', activity: 'rest', sceneId: homeScene, importance: 30 };
    slots[3] = { daypart: 'night', activity: 'sleep', sceneId: homeScene, importance: 10 };
    return slots as DayPlan;
  }

  // Step 3-6: Planner Grid driven schedule when planner exists
  const jobId = economy.jobId || 'unemployed';
  const job = JOBS[jobId];
  const isWeekend = date.dayOfWeek === 0 || date.dayOfWeek === 6;
  const isHoliday = isThaiPublicHoliday(date.month, date.day);
  const isSchoolBreak = isThaiSchoolBreak(date.month, date.day);

  if (age < 6 || jobId === 'infant') {
    return [
      { daypart: 'morning', activity: 'hobby', catalogActivityId: 'hobby_leisure', sceneId: homeScene, importance: 25 },
      { daypart: 'afternoon', activity: 'rest', catalogActivityId: 'quiet_rest', sceneId: homeScene, importance: 20 },
      { daypart: 'evening', activity: 'family', catalogActivityId: 'family_time', sceneId: homeScene, importance: 20 },
      { daypart: 'night', activity: 'sleep', catalogActivityId: 'sleep_full', sceneId: homeScene, importance: 10 },
    ];
  }

  if (state.planner?.grid) {
    const dominantNight = age >= 18 ? getDominantNightDaypart(alloc) : undefined;
    const costRes = resolveAffordableWeeklyActivities(state, state.planner.grid);
    const cashSwapMap = new Map<string, ActivityId>();
    for (const sw of costRes.swappedSlots) {
      cashSwapMap.set(`${sw.dayType}:${sw.slot}`, sw.toActivityId);
    }

    // Preserve split/flex shift scene diversity on active workdays
    const isRegularWorkDay =
      job &&
      job.shift !== 'none' &&
      jobId !== 'student' &&
      !(job.weekendOff && (isWeekend || isHoliday));
    const baseWorkScene =
      job?.sceneId === 'school'
        ? resolveSchoolSceneId(state)
        : job?.sceneId === 'home'
          ? homeScene
          : (job?.sceneId ?? 'work_corporate');
    const flexAlt =
      isRegularWorkDay && job?.shift === 'flex' && jobId !== 'food_rider'
        ? hashDayPlan(state.seed, date.totalDays, 'flex_shift') % 2
        : 0;
    const splitAlt =
      isRegularWorkDay && job?.shift === 'split'
        ? hashDayPlan(state.seed, Math.floor(date.totalDays / 7), 'split_shift') % 2
        : 0;
    void flexAlt;
    void splitAlt;

    for (let i = 0; i < 4; i++) {
      const idx = i as 0 | 1 | 2 | 3;
      const dp = ALL_DAYPARTS[idx];
      const slotRes = getSlotActivity(state, date, dp);
      const dayTypeForCash = isWeekend ? 'weekend' : 'weekday';
      const swappedId =
        !slotRes.isLockedRoleSlot && !slotRes.isHolidayOverride
          ? cashSwapMap.get(`${dayTypeForCash}:${dp}`)
          : undefined;

      let actId: ActivityId = swappedId ?? slotRes.activityId;
      let def = ACTIVITIES_BY_ID.get(actId) ?? slotRes.def;

      // Runtime safety: block side_gig if eligibility failed (e.g. sideGigRecord removed mid-week)
      if (actId === 'side_gig_work' && !checkSideGigEligibility(state, 4).allowed) {
        actId = dp === 'night' ? 'sleep_normal' : 'hobby_leisure';
        def = ACTIVITIES_BY_ID.get(actId)!;
      }

      // Runtime safety: block nightlife for underage or pubVisitAge mismatch
      if (actId === 'party_night' && !canEnterNightlife(age, effectiveSettings)) {
        const candidates = ['street_food_night', homeScene];
        const picked = pickOpenCandidate(candidates, dp, age, homeScene, effectiveSettings);
        slots[idx] = {
          daypart: dp,
          activity: 'nightlife',
          catalogActivityId: 'party_night',
          isHolidayOverride: slotRes.isHolidayOverride,
          sceneId: picked.sceneId,
          fallbackFrom: 'nightlife_pub',
          fallbackReason: age < 18 ? 'underage' : 'nightlife_age',
          importance: dp === 'night' && dominantNight === 'night' ? 85 : 55,
        };
        continue;
      }

      const slotHash = hashDayPlan(state.seed, date.totalDays, `planner_${dp}`);

      if (actId === 'school_class') {
        const schoolScene = resolveSchoolSceneId(state);
        const picked = pickOpenCandidate([schoolScene], dp, age, homeScene, effectiveSettings);
        slots[idx] = {
          daypart: dp,
          activity: 'study',
          catalogActivityId: actId,
          isHolidayOverride: false,
          sceneId: picked.sceneId,
          fallbackFrom: picked.fallbackFrom,
          fallbackReason: picked.fallbackReason,
          importance: 80,
        };
      } else if (
        actId === 'work_shift' ||
        actId === 'overtime_work' ||
        actId === 'flexible_work'
      ) {
        const isOT = actId === 'overtime_work';
        const picked = pickOpenCandidate([baseWorkScene], dp, age, homeScene, effectiveSettings, {
          isOvertime: isOT,
        });
        slots[idx] = {
          daypart: dp,
          activity: 'work',
          catalogActivityId: actId,
          isHolidayOverride: slotRes.isHolidayOverride,
          sceneId: picked.sceneId,
          fallbackFrom: picked.fallbackFrom,
          fallbackReason: picked.fallbackReason,
          isOvertime: isOT,
          importance: isOT ? 82 : jobId === 'food_rider' && idx === 2 ? 85 : 80,
        };
      } else if (actId === 'freelance_work') {
        const candidates = ['cafe', homeScene];
        const picked = pickOpenCandidate(candidates, dp, age, homeScene, effectiveSettings);
        slots[idx] = {
          daypart: dp,
          activity: 'side_gig',
          catalogActivityId: actId,
          isHolidayOverride: slotRes.isHolidayOverride,
          sceneId: picked.sceneId,
          fallbackFrom: picked.fallbackFrom,
          fallbackReason: picked.fallbackReason,
          importance: 72,
        };
      } else {
        const candidates = resolveCandidatesForCatalogActivity(def, state, homeScene, slotHash);
        const picked = pickOpenCandidate(candidates, dp, age, homeScene, effectiveSettings);
        let imp = getActivityImportance(def.dayPlanActivity);
        if (dp === 'night' && def.dayPlanActivity === 'nightlife' && dominantNight === 'night') {
          imp = 85;
        }
        slots[idx] = {
          daypart: dp,
          activity: def.dayPlanActivity,
          catalogActivityId: actId,
          isHolidayOverride: slotRes.isHolidayOverride,
          sceneId: picked.sceneId,
          fallbackFrom: picked.fallbackFrom,
          fallbackReason: picked.fallbackReason,
          importance: imp,
        };
      }
    }

    return slots as DayPlan;
  }

  // Fallback legacy branch (only reached if planner is absent in an unhydrated mock state)
  if (jobId === 'student') {
    const isSchoolDay = !isWeekend && !isHoliday && !isSchoolBreak;
    if (isSchoolDay) {
      const schoolScene = resolveSchoolSceneId(state);
      for (const idx of [0, 1] as const) {
        const dp = ALL_DAYPARTS[idx];
        const picked = pickOpenCandidate([schoolScene], dp, age, homeScene, effectiveSettings);
        slots[idx] = {
          daypart: dp,
          activity: 'study',
          sceneId: picked.sceneId,
          fallbackFrom: picked.fallbackFrom,
          fallbackReason: picked.fallbackReason,
          importance: 80,
        };
      }
    }
  } else if (job && job.shift !== 'none') {
    const isWorkDay = !(job.weekendOff && (isWeekend || isHoliday));
    if (isWorkDay) {
      const baseScene = job.sceneId === 'school' ? resolveSchoolSceneId(state) : job.sceneId === 'home' ? homeScene : job.sceneId;
      for (const idx of [0, 1] as const) {
        const dp = ALL_DAYPARTS[idx];
        const picked = pickOpenCandidate([baseScene], dp, age, homeScene, effectiveSettings);
        slots[idx] = {
          daypart: dp,
          activity: 'work',
          sceneId: picked.sceneId,
          fallbackFrom: picked.fallbackFrom,
          fallbackReason: picked.fallbackReason,
          importance: 80,
        };
      }
    }
  }

  for (const idx of [0, 1, 2, 3] as const) {
    if (slots[idx]) continue;
    const dp = ALL_DAYPARTS[idx];
    slots[idx] = {
      daypart: dp,
      activity: dp === 'night' ? 'sleep' : 'rest',
      sceneId: homeScene,
      importance: dp === 'night' ? 10 : 20,
    };
  }

  return slots as DayPlan;
}

export function getDayPlan(state: GameState, settings?: SceneSettings): DayPlan {
  return buildDayPlan(state, settings);
}

export function getHighlightSlot(plan: DayPlan): { slot: DaySlot; index: 0 | 1 | 2 | 3 } {
  let bestIdx: 0 | 1 | 2 | 3 = 0;
  let bestSlot = plan[0];

  for (let i = 1; i < 4; i++) {
    const idx = i as 0 | 1 | 2 | 3;
    if (plan[idx].importance > bestSlot.importance) {
      bestSlot = plan[idx];
      bestIdx = idx;
    }
  }

  return { slot: bestSlot, index: bestIdx };
}

export function getSlotActivityLabel(slot: DaySlot, state: GameState): string {
  if (slot.isOvertime && slot.activity === 'work') {
    return 'ทำโอที';
  }
  if (slot.activity === 'study' && state.character.ageYears >= 18) {
    return 'เข้าคลาสเรียน';
  }
  if (slot.catalogActivityId) {
    const def = ACTIVITIES_BY_ID.get(slot.catalogActivityId);
    if (def) {
      if (def.id === 'school_class') return 'เข้าเรียน';
      if (def.id === 'work_shift') return 'ทำงาน';
      return def.nameTh;
    }
  }
  return UI_TEXT.ACTIVITY_LABELS[slot.activity];
}

export function getSlotActivityWhereLabel(
  slot: DaySlot,
  state: GameState,
  resolvedSceneId?: string
): string {
  const sceneId = resolvedSceneId ?? slot.sceneId;
  const sceneName = SCENES_BY_ID.get(sceneId)?.nameTh ?? 'ในเมือง';
  const actLabel = getSlotActivityLabel(slot, state);
  return `${actLabel} · ${sceneName}`;
}

export function getActivitySpeechText(
  slot: DaySlot,
  sceneId: string,
  state: GameState,
  remainingDays: number | null
): string {
  const { character, economy } = state;
  const sceneName = SCENES_BY_ID.get(sceneId)?.nameTh ?? 'บ้าน';

  if (!character.isAlive) {
    return `ปิดฉากการเดินทางในวัย ${character.ageYears} ปี`;
  }
  if (state.sceneMode?.sceneId === 'hospital' && remainingDays !== null && remainingDays > 0) {
    return `กำลังนอนพักรักษาตัวอยู่ที่โรงพยาบาล หมอบอกให้ดูอาการอีก ${remainingDays} วัน`;
  }
  if (sceneId === 'hospital' && character.indices.physical < 35) {
    return 'ร่างกายอ่อนแรงจนต้องแวะมาให้หมอตรวจดูอาการให้หายดีก่อน';
  }
  if (state.sceneMode?.sceneId === 'cafe' && remainingDays !== null && remainingDays > 0) {
    return 'แวะมานั่งหลบฝนพักใจที่คาเฟ่ใกล้บ้านสักครู่';
  }
  if (character.ageYears <= 2) {
    return 'กิน นอน แล้วก็ส่งเสียงเรียกร้องความสนใจเต็มที่';
  }
  if (character.ageYears <= 5) {
    return `กำลังหัดเดิน หัดพูด และสำรวจทุกมุมใน${sceneName}`;
  }

  if (slot.fallbackFrom && sceneId.startsWith('home_')) {
    const fromName = SCENES_BY_ID.get(slot.fallbackFrom)?.nameTh ?? 'ข้างนอก';
    if (slot.fallbackReason === 'closed') {
      return `${fromName}ปิดช่วง${UI_TEXT.DAYPARTS[slot.daypart]}แล้ว เลยกลับมาพักที่${sceneName}`;
    }
    return `เข้า${fromName}ไม่ได้ตามเกณฑ์อายุ เลยกลับมาพักผ่อนที่${sceneName}แทน`;
  }

  const job = JOBS[economy.jobId] ?? JOBS.unemployed;

  if (slot.catalogActivityId === 'workout') {
    return `กำลังออกกำลังกายเรียกเหงื่อและฟิตร่างกายอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'skincare_grooming') {
    return `แวะดูแลผิวพรรณและแต่งตัวให้ดูดีอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'health_check_rest') {
    return `มาตรวจเช็กสุขภาพและดูแลร่างกายอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'attend_course') {
    return `กำลังตั้งใจเรียนคอร์สพัฒนาทักษะอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'field_practice') {
    return `กำลังลงสนามฝึกทักษะขั้นสูงจากการทำงานจริงอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'read_review') {
    return `นั่งอ่านหนังสือและทบทวนบทเรียนเงียบๆ อยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'freelance_work') {
    return `กำลังนั่งปั่นงานฟรีแลนซ์อยู่ที่${sceneName} ตามเวลาที่จัดไว้เอง`;
  }
  if (slot.catalogActivityId === 'flexible_work') {
    return `กำลังทำงาน${job.title}ตามตารางเวลายืดหยุ่นอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'university_club') {
    return `กำลังทำกิจกรรมชมรมและประชุมกับเพื่อนร่วมชมรมอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'stream_content') {
    return `กำลังจัดไลฟ์สตรีมและทำคอนเทนต์ตามความถนัดอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'raise_child') {
    return `กำลังดูแลเอาใจใส่ลูกน้อยและใช้เวลาครอบครัวอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'advanced_competition') {
    return `กำลังฝึกซ้อมและลงแข่งกิจกรรมระดับสูงร่วมกับทีมอยู่ที่${sceneName}`;
  }
  if (slot.catalogActivityId === 'internship') {
    return `กำลังฝึกประสบการณ์สายอาชีพอยู่ที่${sceneName}`;
  }

  switch (slot.activity) {
    case 'work':
      if (slot.isOvertime) {
        return `อยู่ทำโอทีต่อที่${sceneName} เร่งปิดงานให้เสร็จตามเป้า`;
      }
      return `กำลังทำงาน${job.title}อยู่ที่${sceneName}`;
    case 'study':
      return character.ageYears >= 18
        ? `นั่งเรียนและปั่นงานส่งอาจารย์อยู่ที่${sceneName}`
        : `มาเรียนและเจอเพื่อนๆ อยู่ที่${sceneName}`;
    case 'side_gig':
      return `กำลังลุยจ๊อบเสริมอยู่ที่${sceneName} หารายได้เข้ากระเป๋าเพิ่ม`;
    case 'social':
      return `นัดเพื่อนมานั่งคุยผ่อนคลายกันที่${sceneName}`;
    case 'nightlife':
      return slot.fallbackFrom === 'nightlife_pub'
        ? `ยังเข้าผับไม่ได้ เลยแวะหาของอร่อยกินที่${sceneName}แทน`
        : `ออกมาปล่อยใจกับบรรยากาศยามค่ำคืนที่${sceneName}`;
    case 'hobby':
      return sceneId.startsWith('home_')
        ? `ใช้เวลาว่างเพลินๆ กับงานอดิเรกที่${sceneName}`
        : `ออกมาเดินเล่นเปิดหูเปิดตาที่${sceneName}`;
    case 'family':
      return sceneId.startsWith('home_')
        ? `ใช้เวลากับครอบครัวอย่างอบอุ่นที่${sceneName}`
        : `พากันออกมากินข้าวมื้อพิเศษที่${sceneName}`;
    case 'self_dev':
      return `ซุ่มฝึกทักษะและอ่านหนังสือเพิ่มความสามารถที่${sceneName}`;
    case 'errand':
      return `ออกมาทำธุระและซื้อของจำเป็นที่${sceneName}`;
    case 'sleep':
      return `ดึกแล้ว กลับถึง${sceneName}เตรียมตัวเข้านอนพักผ่อน`;
    case 'rest':
    default:
      if (character.resources.energy < 20) {
        return `ตาจะปิดแล้ว วันนี้ขอพักเอาแรงที่${sceneName}ก่อน`;
      }
      return `พักผ่อนสบายๆ ชาร์จพลังอยู่ที่${sceneName}`;
  }
}
