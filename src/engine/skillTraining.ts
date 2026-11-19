import { ACTIVITIES_BY_ID } from '../data/activities';
import {
  ALL_SKILL_IDS,
  CORE_SKILL_IDS,
  DISCOVERED_SKILL_IDS,
  DISCOVERY_THRESHOLD_HOURS,
  DISCOVERY_THRESHOLD_SESSIONS,
  getSkillsForActivityTag,
} from '../data/skills';
import {
  SKILL_AGE_MULTIPLIERS,
  SKILL_APTITUDE_STATS,
  SKILL_LEVEL_CONFIG,
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
  SLOT_HOURS,
} from '../data/slotHours';
import { JOBS, SKILL_LABELS } from '../data/thaiData';
import { DEFAULT_TIME_ALLOC_BY_STAGE } from '../data/timeAlloc';
import { UI_TEXT } from '../data/uiText';
import { discoverSkillOnState, pushLifeHistory } from './education';
import { getLifeSubStageId } from './lifeStage';
import { appendTimeline, applyEffects } from './log';
import { clamp, round2 } from './rng';
import {
  computeCombinedSkillMultiplier,
  getDiscoveryThresholdReduction,
  revealTalentById,
} from './talents';
import type {
  ActivitySkillTagId,
  DiscoveredSkillId,
  GameState,
  SkillKey,
  SkillLevelNum,
  SkillLevelState,
  SkillTierId,
  SkillTrainingState,
  TimeAllocation,
} from './types';

export const ALL_SKILL_KEYS: readonly SkillKey[] = ALL_SKILL_IDS;

export function zeroSkillRecord(): Record<SkillKey, number> {
  return {
    academic: 0,
    tech: 0,
    craft: 0,
    social: 0,
    business: 0,
    athletics: 0,
    foreign_lang: 0,
    culinary: 0,
    visual_arts: 0,
    music_vocal: 0,
    performing_acting: 0,
    dance_thai_modern: 0,
    literature_writing: 0,
  };
}

export function isCoreSkill(skill: SkillKey): boolean {
  return (CORE_SKILL_IDS as string[]).includes(skill);
}

export function isSkillVisible(state: GameState, skill: SkillKey): boolean {
  if (isCoreSkill(skill)) return true;
  if ((state.character.skills[skill] ?? 0) > 0) return true;
  return (state.skillTraining?.discoveredSkills ?? []).includes(skill as DiscoveredSkillId);
}

export function getVisibleSkills(state: GameState): SkillKey[] {
  return ALL_SKILL_IDS.filter((sk) => isSkillVisible(state, sk));
}

export function convertLevelToCompatScore(levelState?: SkillLevelState): number {
  if (!levelState) return 0;
  if (levelState.level >= 5) return SKILL_LEVEL_CONFIG.maxCompatScoreAtLv5;
  const threshold = SKILL_LEVEL_CONFIG.xpThresholds[levelState.level] ?? 100;
  const pct = threshold > 0 ? clamp(levelState.xp / threshold, 0, 1) : 0;
  return Math.min(
    SKILL_LEVEL_CONFIG.maxCompatScoreAtLv5,
    Math.floor(20 * (levelState.level - 1) + 19 * pct)
  );
}

export function createInitialSkillLevelState(
  level: SkillLevelNum = 1,
  unlockedTier: SkillTierId = 1,
  xp = 0,
  certificates: string[] = [],
  unlockedViaChildEvent = false
): SkillLevelState {
  return {
    level,
    xp,
    unlockedTier,
    certificates: [...certificates],
    unlockedViaChildEvent,
  };
}

export function convertCompatScoreToSkillLevelState(
  rawScore: number,
  existing?: SkillLevelState
): SkillLevelState {
  if (existing) {
    return {
      ...existing,
      certificates: [...(existing.certificates ?? [])],
    };
  }
  const s = clamp(rawScore ?? 0, 0, 100);
  let level: SkillLevelNum = 1;
  let xp = 0;
  let unlockedTier: SkillTierId = 1;
  if (s >= 80) {
    level = 5;
    xp = 0;
    unlockedTier = 3;
  } else if (s >= 60) {
    level = 4;
    xp = Math.round(((s - 60) / 20) * (SKILL_LEVEL_CONFIG.xpThresholds[4] ?? 1500));
    unlockedTier = 2;
  } else if (s >= 40) {
    level = 3;
    xp = Math.round(((s - 40) / 20) * (SKILL_LEVEL_CONFIG.xpThresholds[3] ?? 700));
    unlockedTier = 2;
  } else if (s >= 20) {
    level = 2;
    xp = Math.round(((s - 20) / 20) * (SKILL_LEVEL_CONFIG.xpThresholds[2] ?? 300));
    unlockedTier = 1;
  } else {
    level = 1;
    xp = Math.round((s / 20) * (SKILL_LEVEL_CONFIG.xpThresholds[1] ?? 100));
    unlockedTier = 1;
  }
  return createInitialSkillLevelState(level, unlockedTier, xp, []);
}

export function buildSkillStatesFromCompatSkills(
  skills: Partial<Record<SkillKey, number>>,
  existingStates?: Partial<Record<SkillKey, SkillLevelState>>
): Record<SkillKey, SkillLevelState> {
  const out: Partial<Record<SkillKey, SkillLevelState>> = {};
  for (const sk of ALL_SKILL_IDS) {
    out[sk] = convertCompatScoreToSkillLevelState(skills[sk] ?? 0, existingStates?.[sk]);
  }
  return out as Record<SkillKey, SkillLevelState>;
}

export function createInitialSkillTrainingState(
  existing?: Partial<SkillTrainingState>
): SkillTrainingState {
  const initialStates: Partial<Record<SkillKey, SkillLevelState>> = {};
  for (const sk of ALL_SKILL_IDS) {
    if (existing?.skillStates?.[sk]) {
      const s = existing.skillStates[sk]!;
      initialStates[sk] = {
        ...s,
        certificates: [...(s.certificates ?? [])],
      };
    } else {
      initialStates[sk] = createInitialSkillLevelState(1, 1, 0, []);
    }
  }

  return {
    focus: existing?.focus
      ? [...existing.focus].filter((k) => ALL_SKILL_IDS.includes(k)).slice(0, SKILL_TRAINING_CONFIG.maxFocusSkills)
      : [],
    course: existing?.course ? { ...existing.course } : null,
    xp: { ...zeroSkillRecord(), ...(existing?.xp ?? {}) },
    lastPracticedWeek: { ...zeroSkillRecord(), ...(existing?.lastPracticedWeek ?? {}) },
    discoveredSkills: existing?.discoveredSkills ? [...existing.discoveredSkills] : [],
    skillStates: initialStates as Record<SkillKey, SkillLevelState>,
    tagProgress: existing?.tagProgress ? { ...existing.tagProgress } : {},
    limitationProgress: existing?.limitationProgress ? { ...existing.limitationProgress } : {},
    socialHighWeeks: existing?.socialHighWeeks ?? 0,
    savingStreakWeeks: existing?.savingStreakWeeks ?? 0,
    lastLoggedCap: existing?.lastLoggedCap ? { ...existing.lastLoggedCap } : {},
  };
}

export function getSkillTier(levelOrTier: number): SkillTier {
  if (levelOrTier <= 1) return 1;
  if (levelOrTier === 2) return 2;
  return 3;
}

export function isTier2Unlocked(state: GameState, skill: SkillKey): boolean {
  const skState = state.skillTraining?.skillStates?.[skill];
  if (skState && skState.unlockedTier >= 2) return true;

  const hsTrack = state.character.educationState?.highSchoolTrack;
  if (hsTrack === 'sci_math' && (skill === 'academic' || skill === 'tech')) return true;
  if (hsTrack === 'arts_math' && (skill === 'business' || skill === 'academic')) return true;
  if (hsTrack === 'arts_lang' && (skill === 'foreign_lang' || skill === 'social')) return true;
  if (hsTrack === 'arts_fine' && skill === (state.character.educationState?.fineArtSkill ?? 'visual_arts')) return true;
  if (hsTrack === 'vocational') {
    const branch = state.character.educationState?.vocationalBranch ?? 'craft';
    if (skill === 'academic' || skill === (branch as unknown as SkillKey)) return true;
  }

  return false;
}

export function isTier3Unlocked(state: GameState, skill: SkillKey): boolean {
  const skState = state.skillTraining?.skillStates?.[skill];
  if (skState && skState.unlockedTier >= 3) return true;

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
    (state.evidence?.disciplined_saving ?? 0) >= SKILL_TRAINING_CONFIG.businessTier3MinEvidence &&
    state.economy.cash + state.economy.assetsValue >= SKILL_TRAINING_CONFIG.businessTier3MinWealthCash
  ) {
    return true;
  }

  if (
    rule.allowsWorkoutStreakTier3 &&
    ((state.planner?.streaks?.workoutWeeks ?? 0) >= SKILL_TRAINING_CONFIG.socialTier3RequiredWeeks ||
      Boolean(state.character.flags?.competition_unlocked))
  ) {
    return true;
  }

  return false;
}

export function getMaxLevelForSkill(state: GameState, skill: SkillKey): SkillLevelNum {
  const skState = state.skillTraining?.skillStates?.[skill];
  const unlockedTier = Math.max(
    skState?.unlockedTier ?? 1,
    isTier3Unlocked(state, skill) ? 3 : isTier2Unlocked(state, skill) ? 2 : 1
  ) as SkillTierId;

  if (unlockedTier === 3) return 5;
  if (unlockedTier === 2) {
    if (skState?.unlockedViaChildEvent && (!skState.certificates || skState.certificates.length === 0)) {
      return SKILL_LEVEL_CONFIG.childEventTier2MaxLevel; // Lv.3
    }
    return 4;
  }
  return 2;
}

export function getEffectiveSkillCap(state: GameState, skill: SkillKey): number {
  const maxLvl = getMaxLevelForSkill(state, skill);
  if (maxLvl === 5) return 90;
  if (maxLvl === 4) return 79;
  if (maxLvl === 3) return 59;
  return 39;
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

export function computeStressMult(state: GameState): number {
  return state.character.resources.stress > SKILL_LEVEL_CONFIG.stressHighThreshold
    ? SKILL_LEVEL_CONFIG.stressHighMult
    : 1.0;
}

export function computeEnergyMult(state: GameState): number {
  return computeStressMult(state);
}

export function computeIntraLevelCurve(levelState: SkillLevelState): number {
  if (levelState.level >= 5) return SKILL_LEVEL_CONFIG.intraLevelCurveEnd;
  const threshold = SKILL_LEVEL_CONFIG.xpThresholds[levelState.level] ?? 100;
  const pos = threshold > 0 ? clamp(levelState.xp / threshold, 0, 1) : 1;
  return round4(
    SKILL_LEVEL_CONFIG.intraLevelCurveStart -
      (SKILL_LEVEL_CONFIG.intraLevelCurveStart - SKILL_LEVEL_CONFIG.intraLevelCurveEnd) * pos
  );
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
  if (!isSkillVisible(state, skill)) {
    return { allowed: false, reasonTh: 'ต้องค้นพบทักษะนี้ก่อนจึงจะลงคอร์สต่อยอดได้' };
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
  return { allowed: true };
}

export function recordActivitySkillTagProgress(
  state: GameState,
  tagId: ActivitySkillTagId,
  sessionsDelta: number,
  hoursDelta: number,
  announce = true
): GameState {
  if (!state.character.isAlive || state.character.ageYears < 4) return state;

  const training = createInitialSkillTrainingState(state.skillTraining);
  const tagProgress = { ...(training.tagProgress ?? {}) };
  const prev = tagProgress[tagId] ?? { sessions: 0, hours: 0 };
  const nextSessions = prev.sessions + Math.max(0, sessionsDelta);
  const nextHours = round2(prev.hours + Math.max(0, hoursDelta));
  tagProgress[tagId] = { sessions: nextSessions, hours: nextHours };

  let next: GameState = {
    ...state,
    skillTraining: {
      ...training,
      tagProgress,
    },
  };

  const taggedSkills = getSkillsForActivityTag(tagId);
  for (const sk of taggedSkills) {
    if ((DISCOVERED_SKILL_IDS as string[]).includes(sk)) {
      const discId = sk as DiscoveredSkillId;
      const alreadyDiscovered = (next.skillTraining?.discoveredSkills ?? []).includes(discId);
      if (!alreadyDiscovered) {
        const reduction = getDiscoveryThresholdReduction(next.character, sk);
        const reqSessions = Math.max(1, Math.ceil(DISCOVERY_THRESHOLD_SESSIONS * (1 - reduction)));
        const reqHours = Math.max(1, Math.ceil(DISCOVERY_THRESHOLD_HOURS * (1 - reduction)));

        // 1/3 Hint trigger (ev_talent_hint)
        const hintThreshold = reqHours / 3;
        const hintFlag = `hint_emitted_${sk}`;
        if (nextHours >= hintThreshold && !next.character.flags?.[hintFlag]) {
          const matchingUnrevealed = [...(next.character.talents ?? []), ...(next.character.talentVault ?? [])].some(
            (t) => !t.revealed
          );
          if (matchingUnrevealed) {
            next = {
              ...next,
              character: {
                ...next.character,
                flags: {
                  ...next.character.flags,
                  [hintFlag]: true,
                },
              },
              activeToast: {
                id: `toast_talent_hint_${sk}_${state.date.totalDays}`,
                title: 'เริ่มสังเกตเห็นแววความถนัด',
                description: 'การฝึกฝนต่อเนื่องเริ่มเผยให้เห็นพรสวรรค์ที่ซ่อนอยู่ในการทำกิจกรรมนี้',
                tier: 'T1',
                category: 'milestone',
                expiresAtTotalDay: state.date.totalDays + 10,
              },
            };
            next = appendTimeline(next, {
              category: 'life',
              tier: 'T1',
              title: 'สัญญาณพรสวรรค์เริ่มฉายแวว',
              description: 'จากการฝึกฝนกิจกรรมแนวนี้ คุณเริ่มสัมผัสได้ถึงความถนัดพิเศษที่รอการเปิดเผย',
            });
          }
        }

        // Full threshold discovery
        if (nextSessions >= reqSessions || nextHours >= reqHours) {
          next = discoverSkillOnState(next, discId, announce);
          const revealed = revealTalentById(next, undefined, sk);
          next = revealed.state;
        }
      }
    }
  }

  return next;
}

export interface SkillGrowthDetails {
  skillId: SkillKey;
  level: number;
  levelNum: SkillLevelNum;
  levelNameTh: string;
  unlockedTier: SkillTierId;
  maxLevelForTier: SkillLevelNum;
  tier: SkillTier;
  tierLabelTh: string;
  effectiveCap: number;
  atCap: boolean;
  xp: number;
  xpThreshold: number;
  xpProgressPct: number;
  isFocused: boolean;
  hasActiveCourse: boolean;
  tier2Unlocked: boolean;
  tier3Unlocked: boolean;
  unlockedViaChildEvent: boolean;
  certificates: string[];
  aptitudeMult: number;
  traitMult: number;
  talentMult: number;
  ageMult: number;
  stressMult: number;
  estimatedWeeklyGain: number;
  unlockHintTh: string;
  slowReasonsTh: string[];
}

export function getSkillGrowthDetails(state: GameState, skill: SkillKey): SkillGrowthDetails {
  const training = createInitialSkillTrainingState(state.skillTraining);
  const stageId = getLifeSubStageId(state.character.ageYears);
  const alloc: TimeAllocation = state.timeAllocation ?? DEFAULT_TIME_ALLOC_BY_STAGE[stageId];
  const skState = training.skillStates?.[skill] ?? createInitialSkillLevelState(1, 1, 0, []);

  const tier2 = isTier2Unlocked(state, skill);
  const tier3 = isTier3Unlocked(state, skill);
  const effectiveTier: SkillTierId = Math.max(skState.unlockedTier, tier3 ? 3 : tier2 ? 2 : 1) as SkillTierId;
  const maxLevel = getMaxLevelForSkill(state, skill);
  const atCap = skState.level >= maxLevel;

  const threshold = SKILL_LEVEL_CONFIG.xpThresholds[skState.level] ?? 0;
  const xpPct = threshold > 0 ? clamp(Math.round((skState.xp / threshold) * 100), 0, 100) : 100;

  const isFocused = training.focus.includes(skill);
  const hasActiveCourse = training.course?.skillId === skill && (training.course?.weeksLeft ?? 0) > 0;
  const rule = SKILL_UNLOCK_RULES[skill];

  const aptitudeMult = computeAptitudeMult(state, skill);
  const traitMult = computeTraitMult(state);
  const talentMult = round4(computeCombinedSkillMultiplier(state.character, skill));
  const ageMult = computeAgeMult(state);
  const stressMult = computeStressMult(state);

  const slowReasonsTh: string[] = [];
  if (state.character.resources.stress > SKILL_LEVEL_CONFIG.stressHighThreshold) {
    slowReasonsTh.push('ความเครียดสูงกว่า 80 ทำให้การฝึกทักษะช้าลงครึ่งหนึ่ง (x0.5)');
  }
  if (hasActiveCourse && alloc.selfDev < SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek) {
    slowReasonsTh.push(
      `เวลาพัฒนาตัวเอง (${alloc.selfDev} ชม./สัปดาห์) ต่ำกว่าขั้นต่ำ ${SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek} ชม. อาจถือว่าขาดเรียนประจำสัปดาห์`
    );
  }
  if (traitMult < 1) {
    slowReasonsTh.push(`นิสัยส่วนตัวชะลอการฝึก (x${traitMult.toFixed(2)})`);
  }
  if (talentMult < 1) {
    slowReasonsTh.push(`ข้อจำกัดติดตัวยังไม่ถูกแก้ทำให้พัฒนาช้าลงเล็กน้อย (x${talentMult.toFixed(2)})`);
  }
  if (ageMult < 1) {
    slowReasonsTh.push(`ช่วงวัยปรับจังหวะการเรียนรู้ (x${ageMult.toFixed(2)})`);
  }

  let unlockHintTh = '';
  if (!tier2) {
    unlockHintTh = rule.tier2HintTh;
  } else if (skState.unlockedViaChildEvent && (!skState.certificates || skState.certificates.length === 0)) {
    unlockHintTh = `ลงคอร์ส 8 สัปดาห์เพื่อปลดล็อกต่อจาก Lv.3 ถึง Lv.4`;
  } else if (!tier3) {
    unlockHintTh = rule.tier3HintTh;
  } else {
    unlockHintTh = 'ปลดล็อกขั้นสูงสุดแล้ว (Lv.5 เชี่ยวชาญ)';
  }

  const breakdown = computeGridTrainingBreakdown(state, alloc);
  let weeklyHours = 0;
  if (isFocused) {
    weeklyHours += breakdown.effectiveSkillDevHours / Math.max(1, training.focus.length);
  }
  if (hasActiveCourse) {
    weeklyHours += Math.max(breakdown.courseHours, 4);
  }
  weeklyHours += breakdown.hobbyTagHours[skill] ?? 0;

  const baseRate = SKILL_TIERS[(hasActiveCourse && effectiveTier < 2 ? 2 : effectiveTier) as SkillTier].baseRatePerHour;
  const curveMult = computeIntraLevelCurve(skState);
  const courseBoost = hasActiveCourse ? SKILL_LEVEL_CONFIG.courseXpMult : 1.0;
  const estimatedWeeklyGain =
    atCap || weeklyHours <= 0
      ? 0
      : round2(
          Math.min(
            SKILL_LEVEL_CONFIG.maxSkillXpPerWeek,
            weeklyHours *
              baseRate *
              aptitudeMult *
              traitMult *
              talentMult *
              ageMult *
              stressMult *
              courseBoost *
              curveMult
          )
        );

  return {
    skillId: skill,
    level: skState.level,
    levelNum: skState.level,
    levelNameTh: SKILL_LEVEL_CONFIG.namesTh[skState.level] ?? 'เพิ่งเริ่ม',
    unlockedTier: effectiveTier,
    maxLevelForTier: maxLevel,
    tier: effectiveTier,
    tierLabelTh: SKILL_TIERS[effectiveTier].labelTh,
    effectiveCap: getEffectiveSkillCap(state, skill),
    atCap,
    xp: skState.xp,
    xpThreshold: threshold,
    xpProgressPct: xpPct,
    isFocused,
    hasActiveCourse,
    tier2Unlocked: tier2,
    tier3Unlocked: tier3,
    unlockedViaChildEvent: Boolean(skState.unlockedViaChildEvent),
    certificates: skState.certificates ?? [],
    aptitudeMult,
    traitMult,
    talentMult,
    ageMult,
    stressMult,
    estimatedWeeklyGain,
    unlockHintTh,
    slowReasonsTh,
  };
}

export function computeGridTrainingBreakdown(
  state: GameState,
  alloc: TimeAllocation
): {
  selfStudyHours: number;
  courseHours: number;
  fieldPracticeHours: number;
  readReviewHours: number;
  workoutHours: number;
  hobbyTagHours: Record<SkillKey, number>;
  effectiveSkillDevHours: number;
} {
  const grid = state.planner?.grid;
  const hobbyTagHours = zeroSkillRecord();
  let selfStudyHours = 0;
  let courseHours = 0;
  let fieldPracticeHours = 0;
  let readReviewHours = 0;
  let workoutHours = 0;
  let totalGridSelfDev = 0;

  if (grid) {
    for (const dt of ALL_DAY_TYPES) {
      for (const slot of ALL_SLOTS) {
        const actId = grid?.[dt]?.[slot];
        if (!actId) continue;
        const act = ACTIVITIES_BY_ID.get(actId);
        if (!act) continue;
        const hrs = (SLOT_HOURS[slot] ?? 4) * DAY_TYPE_WEIGHTS[dt];

        if (act.timeCategory === 'selfDev') {
          totalGridSelfDev += hrs;
        }

        if (actId === 'attend_course') courseHours += hrs;
        else if (actId === 'field_practice') fieldPracticeHours += hrs;
        else if (actId === 'read_review') readReviewHours += hrs;
        else if (act.timeCategory === 'selfDev') selfStudyHours += hrs;

        if (actId === 'workout' || act.tags?.includes('sport') || act.tags?.includes('fitness')) {
          workoutHours += hrs;
        }

        const customTag =
          actId === 'hobby_leisure' ||
          actId === 'attend_course' ||
          actId === 'university_club' ||
          actId === 'self_study'
            ? state.planner?.activitySkillTags?.[actId]
            : undefined;
        const tagsToApply = customTag ? [customTag] : act.defaultSkillTags ?? [];
        for (const tagId of tagsToApply) {
          const skills = getSkillsForActivityTag(tagId);
          for (const sk of skills) {
            hobbyTagHours[sk] = (hobbyTagHours[sk] ?? 0) + hrs * 0.35;
          }
        }
      }
    }
  }

  if (Math.abs(alloc.selfDev - totalGridSelfDev) > 0.5) {
    return {
      selfStudyHours: alloc.selfDev,
      courseHours: alloc.selfDev,
      fieldPracticeHours: 0,
      readReviewHours: 0,
      workoutHours,
      hobbyTagHours,
      effectiveSkillDevHours: alloc.selfDev,
    };
  }

  return {
    selfStudyHours,
    courseHours,
    fieldPracticeHours,
    readReviewHours,
    workoutHours,
    hobbyTagHours,
    effectiveSkillDevHours: selfStudyHours + courseHours + fieldPracticeHours + readReviewHours * 0.55,
  };
}

function advanceSkillLevelAndXp(
  cur: SkillLevelState,
  xpDelta: number,
  maxLvl: SkillLevelNum
): SkillLevelState {
  let nextXp = round2(Math.max(0, cur.xp + xpDelta));
  let nextLvl = cur.level;

  while (nextLvl < 5) {
    const threshold = SKILL_LEVEL_CONFIG.xpThresholds[nextLvl] ?? 100;
    if (nextXp < threshold) break;
    if (nextLvl < maxLvl) {
      nextXp = round2(nextXp - threshold);
      nextLvl = (nextLvl + 1) as SkillLevelNum;
    } else {
      // Carryover XP stops at current tier cap threshold
      nextXp = threshold;
      break;
    }
  }

  if (nextLvl >= 5) {
    nextLvl = 5;
    nextXp = 0;
  }

  return {
    ...cur,
    level: nextLvl,
    xp: nextXp,
  };
}

export function grantStoryletSkillPoints(
  state: GameState,
  skill: SkillKey,
  compatDelta: number,
  _reason?: string
): GameState {
  const training = createInitialSkillTrainingState(state.skillTraining);
  const skillStates: Partial<Record<SkillKey, SkillLevelState>> = { ...(training.skillStates ?? {}) };
  const curState = skillStates[skill] ?? createInitialSkillLevelState(1, 1, 0, []);
  const maxLvl = getMaxLevelForSkill(state, skill);

  // Convert legacy 0..100 compat delta proportionally into current level XP (~20 compat = 1 level)
  const threshold = curState.level < 5 ? SKILL_LEVEL_CONFIG.xpThresholds[curState.level] ?? 100 : 1500;
  const xpDelta = (compatDelta / 20) * threshold;

  const updated = advanceSkillLevelAndXp(curState, xpDelta, maxLvl);
  skillStates[skill] = updated;

  const nextSkills = { ...state.character.skills };
  nextSkills[skill] = convertLevelToCompatScore(updated);

  return {
    ...state,
    character: {
      ...state.character,
      skills: nextSkills,
    },
    skillTraining: {
      ...training,
      skillStates: skillStates as Record<SkillKey, SkillLevelState>,
    },
  };
}

export function grantDailyJobSkillXp(state: GameState): GameState {
  const job = JOBS[state.economy.jobId];
  if (!job || !job.skillGrowthPerDay || state.character.ageYears < 15) return state;

  let next = state;
  for (const [sk, delta] of Object.entries(job.skillGrowthPerDay)) {
    const sKey = sk as SkillKey;
    const dailyDelta = (delta ?? 0) * 0.15;
    if (dailyDelta !== 0) {
      next = grantStoryletSkillPoints(next, sKey, dailyDelta, 'การทำงานประจำ');
    }
  }
  return next;
}

export function applyWeeklySkillTraining(state: GameState, recordLogs = true): GameState {
  if (!state.character.isAlive) return state;

  let next = state;
  const training = createInitialSkillTrainingState(next.skillTraining);
  const stageId = getLifeSubStageId(next.character.ageYears);
  const alloc: TimeAllocation = next.timeAllocation ?? DEFAULT_TIME_ALLOC_BY_STAGE[stageId];
  const breakdown = computeGridTrainingBreakdown(next, alloc);
  const skillStates: Partial<Record<SkillKey, SkillLevelState>> = { ...(training.skillStates ?? {}) };

  // 1. Social high weeks tracker
  if (alloc.social >= SKILL_TRAINING_CONFIG.socialTier3RequiredHoursPerWeek) {
    training.socialHighWeeks = (training.socialHighWeeks ?? 0) + 1;
  } else if ((training.socialHighWeeks ?? 0) < SKILL_TRAINING_CONFIG.socialTier3RequiredWeeks) {
    training.socialHighWeeks = 0;
  }

  // 2. Active Course processing (8 weeks fixed, 500/week, min 6h/week, max 2 missed)
  let courseFinishedThisWeek = false;
  let courseFailedThisWeek = false;
  let activeCourseSkill: SkillKey | null = null;

  if (training.course && training.course.weeksLeft > 0) {
    activeCourseSkill = training.course.skillId;
    const courseFee = training.course.feePerWeek ?? SKILL_TRAINING_CONFIG.courseFeePerWeek;
    const courseSkillLabel = SKILL_LABELS[activeCourseSkill]?.label ?? activeCourseSkill;

    if (next.economy.cash >= courseFee) {
      next = applyEffects(
        next,
        [
          {
            type: 'AddMoney',
            amount: -courseFee,
            category: 'living',
            reason: `ค่าเรียนคอร์ส${courseSkillLabel}รายสัปดาห์`,
          },
        ],
        recordLogs
      );

      // Course attendance counts total self-dev hours vs min 6h/week
      const weeklyHours = Math.max(alloc.selfDev, breakdown.effectiveSkillDevHours);
      if (weeklyHours < SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek) {
        training.course.missedWeeks = (training.course.missedWeeks ?? 0) + 1;
      }

      if ((training.course.missedWeeks ?? 0) > SKILL_LEVEL_CONFIG.courseMaxMissedWeeks) {
        courseFailedThisWeek = true;
        training.course = null;
      } else {
        training.course.weeksLeft -= 1;
        if (training.course.weeksLeft <= 0) {
          courseFinishedThisWeek = true;
        }
      }
    } else {
      courseFailedThisWeek = true;
      training.course = null;
    }
  }

  // 3. Weekly XP calculation across skills with per-skill (6) & total weekly (10) caps
  const stressMult = computeStressMult(next);
  const ageMult = computeAgeMult(next);
  const traitMult = computeTraitMult(next);

  const pendingGains: Array<{ sk: SkillKey; gainedXp: number; maxLvl: SkillLevelNum }> = [];
  let totalRawGain = 0;

  for (const sk of ALL_SKILL_KEYS) {
    if (!isSkillVisible(next, sk)) continue;
    const cur = skillStates[sk] ?? createInitialSkillLevelState(1, 1, 0, []);
    const isFocused = training.focus.includes(sk);
    const hasCourse = activeCourseSkill === sk;
    const maxLvl = getMaxLevelForSkill(next, sk);

    // Sync permanent unlockedTier upward if situational unlocks (school track / job / streak) applied
    const situationalTier: SkillTierId = isTier3Unlocked(next, sk) ? 3 : isTier2Unlocked(next, sk) ? 2 : 1;
    const effectiveTier = Math.max(cur.unlockedTier, situationalTier) as SkillTierId;
    if (effectiveTier > cur.unlockedTier) {
      skillStates[sk] = { ...cur, unlockedTier: effectiveTier };
    }

    let weeklyHours = 0;
    if (isFocused) {
      weeklyHours += breakdown.effectiveSkillDevHours / Math.max(1, training.focus.length);
    }
    if (hasCourse) {
      weeklyHours += Math.max(breakdown.courseHours, 4);
    }
    weeklyHours += breakdown.hobbyTagHours[sk] ?? 0;

    if (weeklyHours <= 0) continue;

    const baseRate = SKILL_TIERS[(hasCourse && effectiveTier < 2 ? 2 : effectiveTier) as SkillTier].baseRatePerHour;
    const aptitudeMult = computeAptitudeMult(next, sk);
    const talentMult = computeCombinedSkillMultiplier(next.character, sk);
    const courseBoost = hasCourse ? SKILL_LEVEL_CONFIG.courseXpMult : 1.0;
    const curveMult = computeIntraLevelCurve(cur);

    const perSkillCap = SKILL_LEVEL_CONFIG.maxSkillXpPerWeek;
    const gainedXp = round2(
      Math.min(
        perSkillCap,
        weeklyHours * baseRate * aptitudeMult * traitMult * talentMult * ageMult * stressMult * courseBoost * curveMult
      )
    );
    if (gainedXp > 0) {
      pendingGains.push({ sk, gainedXp, maxLvl });
      totalRawGain += gainedXp;
    }
  }

  const totalScale =
    totalRawGain > SKILL_LEVEL_CONFIG.maxTotalSkillXpPerWeek && totalRawGain > 0
      ? SKILL_LEVEL_CONFIG.maxTotalSkillXpPerWeek / totalRawGain
      : 1;

  for (const { sk, gainedXp, maxLvl } of pendingGains) {
    const cur = skillStates[sk] ?? createInitialSkillLevelState(1, 1, 0, []);
    const scaledXp = round2(gainedXp * totalScale);
    skillStates[sk] = advanceSkillLevelAndXp(cur, scaledXp, maxLvl);
  }

  // Handle course completion rewards
  if (courseFinishedThisWeek && activeCourseSkill) {
    const cur = skillStates[activeCourseSkill] ?? createInitialSkillLevelState(1, 1, 0, []);
    const certName = `ใบประกาศนียบัตร: ${SKILL_LABELS[activeCourseSkill]?.label ?? activeCourseSkill} (8 สัปดาห์)`;
    const updatedCerts = cur.certificates.includes(certName) ? cur.certificates : [...cur.certificates, certName];
    const unlockedTier = Math.max(cur.unlockedTier, 2) as SkillTierId;
    const upgradedCur = {
      ...cur,
      unlockedTier,
      certificates: updatedCerts,
    };
    // Re-evaluate level up if carryover XP was waiting at Lv.2/Lv.3 threshold
    const newMaxLvl = unlockedTier === 3 ? 5 : 4;
    skillStates[activeCourseSkill] = advanceSkillLevelAndXp(upgradedCur, 0, newMaxLvl);
    training.course = null;

    next = appendTimeline(next, {
      category: 'milestone',
      tier: 'T2',
      title: `เรียนจบคอร์ส: ${SKILL_LABELS[activeCourseSkill]?.label ?? activeCourseSkill}`,
      description: 'สำเร็จหลักสูตร 8 สัปดาห์ ปลดล็อกทักษะสู่ระดับขั้นที่ 2 (ขั้นคอร์ส Lv.4) พร้อมรับใบประกาศนียบัตร',
    });

    next = pushLifeHistory(next, {
      id: `course_grad_${activeCourseSkill}_${next.date.totalDays}`,
      kind: 'course_completed',
      titleTh: `จบคอร์ส: ${SKILL_LABELS[activeCourseSkill]?.label ?? activeCourseSkill}`,
      detailTh: certName,
    });
  } else if (courseFailedThisWeek && activeCourseSkill) {
    next = appendTimeline(next, {
      category: 'life',
      tier: 'T1',
      title: `คอร์ส${SKILL_LABELS[activeCourseSkill]?.label ?? activeCourseSkill}ยุติลง`,
      description: 'ขาดเรียนเกิน 2 สัปดาห์ หรือเงินสดไม่พอจ่ายค่าเรียน คอร์สจึงสิ้นสุดลงโดยไม่ได้รับใบประกาศ',
    });
  }

  // Sync compat scores into character.skills
  const nextSkills = { ...next.character.skills };
  for (const sk of ALL_SKILL_KEYS) {
    nextSkills[sk] = convertLevelToCompatScore(skillStates[sk]);
  }

  return {
    ...next,
    character: {
      ...next.character,
      skills: nextSkills,
    },
    skillTraining: {
      ...training,
      skillStates: skillStates as Record<SkillKey, SkillLevelState>,
    },
  };
}

function round4(val: number): number {
  return Math.round(val * 10000) / 10000;
}
