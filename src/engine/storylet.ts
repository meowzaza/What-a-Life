import { ALLOWED_STORYLET_EFFECT_TYPES } from '../data/storylets/directorConfig';
import { TRAITS_BY_ID } from '../data/traits';
import { evaluateAppearanceImpact, getActiveAppearanceTags } from './appearance';
import { isDropoutCrisisEligible } from './education';
import { getLifeSubStageId } from './lifeStage';
import { SCENES_BY_ID, type Daypart } from './scene';
import type {
  Effect,
  EventChoice,
  EventTier,
  FamilyWealthTier,
  GameState,
  Gender,
  HighSchoolTrack,
  HousingId,
  LifeIndices,
  LifeSubStageId,
  LifestylePresetId,
  RawStats,
  RegionId,
  SceneTag,
  SkillKey,
  SkillLevelState,
  StoryletCategory,
  TempResources,
  TraitIntensity,
} from './types';

export const MAX_INSTANT_CASH_GAIN = 50000;
export const MAX_INSTANT_CASH_LOSS = 30000;

export type EventSourceType =
  | 'calendar'
  | 'stat_threshold'
  | 'hazard'
  | 'consequence'
  | 'general';

export interface StoryletConditions {
  minAge?: number;
  maxAge?: number;
  stages?: LifeSubStageId[];
  wealth?: FamilyWealthTier[];
  regions?: RegionId[];
  genders?: Gender[];
  requiredFlags?: string[];
  forbiddenFlags?: string[];
  requiredTraits?: string[];
  forbiddenTraits?: string[];
  requiredEvidence?: Record<string, number>;
  minCash?: number;
  maxCash?: number;
  minStats?: Partial<LifeIndices & TempResources & RawStats>;
  maxStats?: Partial<LifeIndices & TempResources & RawStats>;
  daypart?: Daypart;
  jobIds?: string[];
  housingIds?: HousingId[];
  forbiddenHousingIds?: HousingId[];
  lifestylePresetIds?: LifestylePresetId[];
  /** Calendar trigger: month (1..12) and day (1..31) or birthday */
  calendarMonth?: number;
  calendarDay?: number;
  onBirthday?: boolean;
  /** Stat threshold triggers */
  minStress?: number;
  maxEnergy?: number;
  /** Appearance & Style conditions */
  requiredAnyAppearanceTags?: string[];
  forbiddenAppearanceTags?: string[];
  requireDyedOrFlashyHair?: boolean;
  forbidDyedOrFlashyHair?: boolean;
  /** Hard safety flag for teen/kid school romance */
  isMinorSafe?: boolean;
  /** Phase 3.2.3 Planner streaks & conditions */
  requiredAnyTraits?: string[];
  minPresetWeeks?: number;
  lifestylePresetMismatch?: boolean;
  minMismatchWeeks?: number;
  minWorkoutWeeks?: number;
  minOvertimeWeeks?: number;
  minSleepDeficitWeeks?: number;
  minSleepFullWeeks?: number;
  minClubWeeks?: number;
  minStreamUnlockedWeeks?: number;
  minStudyTeenWeeks?: number;
  minSocialKidsPlayWeeks?: number;
  requireTier2FocusedSkill?: boolean;
  requireAnnualFocusSet?: boolean;
  /** Phase 3.3.1 talent hint, dropout crisis & education conditions */
  requireUnrevealedTalent?: boolean;
  requireLimitationId?: string;
  minDebt?: number;
  maxGpa?: number;
  requireEmployed?: boolean;
  requireDropoutCrisisEligible?: boolean;
  requiredHsTracks?: HighSchoolTrack[];
}

export interface BlockedByTraitRule {
  traitId: string;
  minIntensity?: TraitIntensity;
  reasonTh: string;
}

export interface StoryletChoice {
  id: string;
  label: string;
  description?: string;
  effects: Effect[];
  requiresAdult?: boolean;
  requiredTraits?: string[];
  forbiddenTraits?: string[];
  blockedByTraits?: BlockedByTraitRule[];
  requiredStats?: Partial<LifeIndices & TempResources & RawStats>;
  requiredWealth?: FamilyWealthTier[];
  requiredAnyTalents?: string[];
  requiredSkills?: Partial<Record<SkillKey, number>>;
  requiredMinGpa?: number;
  requiredMinRawStats?: Partial<Record<keyof RawStats, number>>;
  conditionalUnlockReasonTh?: string;
  costCash?: number;
  twistChance?: number; // 0 to 1
  twistEffects?: Effect[];
  twistSummary?: string;
  consequenceStoryletId?: string;
  consequenceDelayDays?: number;
  aiHint?: string;
}

export interface TwistPlausibilityRule {
  minAge?: number;
  requiredAnyTraits?: string[];
  requiredAnyFlags?: string[];
  requiredAnyEvidence?: Record<string, number>;
  minTension?: number;
  reasonTh: string;
}

export interface StoryletDef {
  id: string;
  title: string;
  bodyTemplate: string;
  category: StoryletCategory;
  tier: EventTier; // 'T0' | 'T1' | 'T2' | 'T3'
  sourceHint?: EventSourceType;
  conditions?: StoryletConditions;
  sceneId?: string;
  sceneTag?: SceneTag;
  daypart?: Daypart;
  /** Foreshadowing setup for negative T3 crises */
  isNegative?: boolean;
  isSuddenHazard?: boolean;
  foreshadowTitle?: string;
  foreshadowHint?: string;
  /** Twist metadata */
  isTwist?: boolean;
  plausibilityCheck?: TwistPlausibilityRule;
  /** Event importance 1..10 for x20 filtering */
  importance?: number;
  deadlineDays?: number;
  weight?: number; // default 10
  choices?: StoryletChoice[];
  consequenceStoryletId?: string;
  consequenceDelayMonths?: number;
  cooldownYears?: number;
  isOneOff?: boolean;
  isAdultContent?: boolean;
}

export interface StoryletValidationResult {
  valid: boolean;
  errors: string[];
}

const INTENSITY_RANK: Record<TraitIntensity, number> = {
  subtle: 1,
  clear: 2,
  core: 3,
};

function validateEffectsList(
  storyletId: string,
  choiceId: string,
  effects: Effect[],
  errors: string[]
): void {
  for (const eff of effects) {
    if (!eff || !ALLOWED_STORYLET_EFFECT_TYPES.has(eff.type)) {
      errors.push(
        `Storylet [${storyletId}] Choice [${choiceId}]: Effect type "${(eff as { type?: string })?.type}" is not in allowed union.`
      );
      continue;
    }
    if (eff.type === 'ChangeMoney' || eff.type === 'AddMoney') {
      if (eff.amount > MAX_INSTANT_CASH_GAIN) {
        errors.push(
          `Storylet [${storyletId}] Choice [${choiceId}]: Cash gain ${eff.amount} exceeds MAX_INSTANT_CASH_GAIN (${MAX_INSTANT_CASH_GAIN}).`
        );
      }
      if (eff.amount < -MAX_INSTANT_CASH_LOSS) {
        errors.push(
          `Storylet [${storyletId}] Choice [${choiceId}]: Cash loss ${Math.abs(eff.amount)} exceeds MAX_INSTANT_CASH_LOSS (${MAX_INSTANT_CASH_LOSS}).`
        );
      }
    }
  }
}

/**
 * Validates a storylet definition against content rules, scene manifest, effect union, and balance boundaries.
 * Enforces hard minor lock (< 18) for adult/romantic themes in pure engine.
 */
export function validateStorylet(
  def: StoryletDef,
  validSceneIds?: ReadonlySet<string>
): StoryletValidationResult {
  const errors: string[] = [];

  if (!def.id || def.id.trim() === '') {
    errors.push('Storylet ID must not be empty.');
  }

  if (!def.title || def.title.trim() === '') {
    errors.push(`Storylet [${def.id}]: Title must not be empty.`);
  }

  if (!def.bodyTemplate || def.bodyTemplate.trim() === '') {
    errors.push(`Storylet [${def.id}]: Body template must not be empty.`);
  }

  if (!['T0', 'T1', 'T2', 'T3'].includes(def.tier)) {
    errors.push(`Storylet [${def.id}]: Invalid tier "${def.tier}".`);
  }

  if (def.tier === 'T0' && def.choices && def.choices.length > 0) {
    errors.push(`Storylet [${def.id}]: T0 events are background logs and must not contain choices.`);
  }

  if ((def.tier === 'T2' || def.tier === 'T3') && (!def.choices || def.choices.length === 0)) {
    errors.push(`Storylet [${def.id}]: T2 and T3 events must have at least one choice.`);
  }

  // Hard minor lock (< 18)
  const minAge = def.conditions?.minAge ?? 0;
  if (def.isAdultContent && minAge < 18) {
    errors.push(`Storylet [${def.id}]: Adult content is strictly forbidden for minors (minAge must be >= 18).`);
  }

  if (def.category === 'romance' && minAge < 18) {
    if (!def.conditions?.isMinorSafe || def.isAdultContent) {
      errors.push(
        `Storylet [${def.id}]: Romance storylets available to minors (< 18) must explicitly set isMinorSafe: true and cannot contain adult content.`
      );
    }
  }

  // Scene manifest validation
  if (def.sceneId) {
    const scenesSet = validSceneIds ?? new Set(SCENES_BY_ID.keys());
    if (!scenesSet.has(def.sceneId)) {
      errors.push(`Storylet [${def.id}]: SceneId "${def.sceneId}" does not exist in sceneManifest.`);
    }
  }

  // Effect union and bounds check
  if (def.choices) {
    for (const choice of def.choices) {
      if (choice.costCash && choice.costCash > MAX_INSTANT_CASH_LOSS) {
        errors.push(
          `Storylet [${def.id}] Choice [${choice.id}]: Cost ${choice.costCash} exceeds MAX_INSTANT_CASH_LOSS (${MAX_INSTANT_CASH_LOSS}).`
        );
      }
      validateEffectsList(def.id, choice.id, choice.effects, errors);
      if (choice.twistEffects) {
        validateEffectsList(def.id, `${choice.id}:twist`, choice.twistEffects, errors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Filters raw storylets at catalog load so invalid cards never enter the live pool.
 */
export function filterValidatedStorylets(
  defs: StoryletDef[],
  validSceneIds?: ReadonlySet<string>
): StoryletDef[] {
  return defs.filter((def) => validateStorylet(def, validSceneIds).valid);
}

function getCharacterTraitMap(state: GameState): Map<string, TraitIntensity> {
  const map = new Map<string, TraitIntensity>();
  for (const t of state.character.traits ?? []) {
    if (!map.has(t)) map.set(t, 'subtle');
  }
  for (const inst of state.character.emergentTraits ?? []) {
    map.set(inst.id, inst.intensity);
  }
  return map;
}

function readStatValue(state: GameState, key: string): number | undefined {
  const { character } = state;
  if (key in character.indices) {
    return character.indices[key as keyof LifeIndices];
  }
  if (key in character.resources) {
    return character.resources[key as keyof TempResources];
  }
  if (key in character.rawStats) {
    return character.rawStats[key as keyof RawStats];
  }
  return undefined;
}

/**
 * Checks Twist plausibility against life history, traits, flags, and evidence.
 */
export function isTwistPlausible(def: StoryletDef, state: GameState): { plausible: boolean; reasonTh: string } {
  if (!def.isTwist || !def.plausibilityCheck) {
    return { plausible: true, reasonTh: 'สอดคล้องกับจังหวะชีวิตปัจจุบัน' };
  }
  const rule = def.plausibilityCheck;
  if (rule.minAge !== undefined && state.character.ageYears < rule.minAge) {
    return { plausible: false, reasonTh: `ต้องมีอายุอย่างน้อย ${rule.minAge} ปี` };
  }

  const traitMap = getCharacterTraitMap(state);
  const flags = state.character.flags ?? {};
  const evidence = state.evidence ?? {};

  let hasSignal = false;
  if (rule.requiredAnyTraits && rule.requiredAnyTraits.length > 0) {
    if (rule.requiredAnyTraits.some((t) => traitMap.has(t))) {
      hasSignal = true;
    }
  }
  if (rule.requiredAnyFlags && rule.requiredAnyFlags.length > 0) {
    if (rule.requiredAnyFlags.some((f) => Boolean(flags[f]))) {
      hasSignal = true;
    }
  }
  if (rule.requiredAnyEvidence) {
    for (const [k, minVal] of Object.entries(rule.requiredAnyEvidence)) {
      if ((evidence[k] ?? 0) >= minVal) {
        hasSignal = true;
        break;
      }
    }
  }
  if (rule.minTension !== undefined && (state.character.innerTension ?? 0) >= rule.minTension) {
    hasSignal = true;
  }

  // If no explicit traits/flags/evidence constraints were specified, treat as baseline plausible
  const hasAnyConstraint =
    Boolean(rule.requiredAnyTraits?.length) ||
    Boolean(rule.requiredAnyFlags?.length) ||
    Boolean(rule.requiredAnyEvidence) ||
    rule.minTension !== undefined;

  if (!hasAnyConstraint) {
    return { plausible: true, reasonTh: rule.reasonTh };
  }

  return {
    plausible: hasSignal,
    reasonTh: rule.reasonTh,
  };
}

/**
 * Checks whether a given Storylet is eligible to fire in the current GameState.
 * Pure deterministic function.
 */
export function isStoryletEligible(
  def: StoryletDef,
  state: GameState,
  options?: { ignoreCooldown?: boolean }
): boolean {
  const { character, economy } = state;
  const flags = character.flags ?? {};
  const cond = def.conditions;

  if (!character.isAlive) {
    return false;
  }

  // Hard minor protection even if a card slipped past validation
  if (character.isMinor && def.isAdultContent) {
    return false;
  }
  if (character.isMinor && def.category === 'romance' && !cond?.isMinorSafe) {
    return false;
  }

  // Infants & toddlers (< 6 years old) cannot trigger T2/T3 or work events
  if (character.ageYears < 6 && (def.tier === 'T2' || def.tier === 'T3' || def.category === 'work')) {
    return false;
  }

  if (!options?.ignoreCooldown) {
    if (def.isOneOff && Boolean(flags[`storylet_done:${def.id}`])) {
      return false;
    }

    const cooldownYears = def.cooldownYears ?? 1;
    if (cooldownYears > 0) {
      for (let y = 0; y < cooldownYears; y++) {
        const yr = state.date.yearCE - y;
        if (Boolean(flags[`storylet_used_year_${yr}:${def.id}`])) {
          return false;
        }
      }
    }
  }

  if (!cond) {
    return true;
  }

  if (cond.minAge !== undefined && character.ageYears < cond.minAge) {
    return false;
  }
  if (cond.maxAge !== undefined && character.ageYears > cond.maxAge) {
    return false;
  }

  const stageId = character.lifeStage ?? getLifeSubStageId(character.ageYears);
  if (cond.stages && cond.stages.length > 0 && !cond.stages.includes(stageId)) {
    return false;
  }

  if (cond.genders && cond.genders.length > 0 && !cond.genders.includes(character.gender)) {
    return false;
  }

  if (cond.wealth && cond.wealth.length > 0 && !cond.wealth.includes(character.background.familyWealth)) {
    return false;
  }

  if (cond.regions && cond.regions.length > 0 && !cond.regions.includes(character.background.region)) {
    return false;
  }

  if (
    cond.lifestylePresetIds &&
    cond.lifestylePresetIds.length > 0 &&
    (!state.lifestylePresetId ||
      state.lifestylePresetId === 'custom' ||
      !cond.lifestylePresetIds.includes(state.lifestylePresetId))
  ) {
    return false;
  }

  if (cond.jobIds && cond.jobIds.length > 0) {
    if (!economy.jobId || !cond.jobIds.includes(economy.jobId)) {
      return false;
    }
  }

  if (cond.housingIds && cond.housingIds.length > 0) {
    if (!cond.housingIds.includes(economy.housingId)) {
      return false;
    }
  }
  if (cond.forbiddenHousingIds && cond.forbiddenHousingIds.length > 0) {
    if (cond.forbiddenHousingIds.includes(economy.housingId)) {
      return false;
    }
  }

  if (cond.minCash !== undefined && economy.cash < cond.minCash) {
    return false;
  }
  if (cond.maxCash !== undefined && economy.cash > cond.maxCash) {
    return false;
  }

  if (cond.minStress !== undefined && character.resources.stress < cond.minStress) {
    return false;
  }
  if (cond.maxEnergy !== undefined && character.resources.energy > cond.maxEnergy) {
    return false;
  }

  if (cond.calendarMonth !== undefined && state.date.month !== cond.calendarMonth) {
    return false;
  }
  if (cond.calendarDay !== undefined && state.date.day !== cond.calendarDay) {
    return false;
  }
  if (cond.onBirthday && !(state.date.month === 5 && state.date.day === 14)) {
    return false;
  }

  if (cond.requiredFlags) {
    for (const flag of cond.requiredFlags) {
      if (!Boolean(flags[flag])) return false;
    }
  }
  if (cond.forbiddenFlags) {
    for (const flag of cond.forbiddenFlags) {
      if (Boolean(flags[flag])) return false;
    }
  }

  const traitMap = getCharacterTraitMap(state);
  if (cond.requiredTraits) {
    for (const traitId of cond.requiredTraits) {
      if (!traitMap.has(traitId)) return false;
    }
  }
  if (cond.forbiddenTraits) {
    for (const traitId of cond.forbiddenTraits) {
      if (traitMap.has(traitId)) return false;
    }
  }

  if (cond.requiredEvidence) {
    const ev = state.evidence ?? {};
    for (const [k, minVal] of Object.entries(cond.requiredEvidence)) {
      if ((ev[k] ?? 0) < minVal) return false;
    }
  }

  if (cond.minStats) {
    for (const [key, val] of Object.entries(cond.minStats)) {
      const idxVal = readStatValue(state, key);
      if (typeof idxVal === 'number' && typeof val === 'number' && idxVal < val) {
        return false;
      }
    }
  }

  if (cond.maxStats) {
    for (const [key, val] of Object.entries(cond.maxStats)) {
      const idxVal = readStatValue(state, key);
      if (typeof idxVal === 'number' && typeof val === 'number' && idxVal > val) {
        return false;
      }
    }
  }

  if (
    cond.requiredAnyAppearanceTags?.length ||
    cond.forbiddenAppearanceTags?.length ||
    cond.requireDyedOrFlashyHair !== undefined ||
    cond.forbidDyedOrFlashyHair !== undefined
  ) {
    const activeTags = new Set(getActiveAppearanceTags(character));
    const appImpact = evaluateAppearanceImpact(character);

    if (cond.requiredAnyAppearanceTags && cond.requiredAnyAppearanceTags.length > 0) {
      if (!cond.requiredAnyAppearanceTags.some((tag) => activeTags.has(tag))) {
        return false;
      }
    }
    if (cond.forbiddenAppearanceTags && cond.forbiddenAppearanceTags.length > 0) {
      if (cond.forbiddenAppearanceTags.some((tag) => activeTags.has(tag))) {
        return false;
      }
    }
    if (cond.requireDyedOrFlashyHair && !appImpact.hasDyedOrFlashyStyle && !appImpact.blocksStrictFormalJobs) {
      return false;
    }
    if (cond.forbidDyedOrFlashyHair && (appImpact.hasDyedOrFlashyStyle || appImpact.blocksStrictFormalJobs)) {
      return false;
    }
  }

  if (cond.requiredAnyTraits && cond.requiredAnyTraits.length > 0) {
    if (!cond.requiredAnyTraits.some((tid) => traitMap.has(tid))) {
      return false;
    }
  }

  const streaks = state.planner?.streaks;
  if (cond.minPresetWeeks !== undefined && (streaks?.presetWeeks ?? 0) < cond.minPresetWeeks) {
    return false;
  }
  if (cond.minWorkoutWeeks !== undefined && (streaks?.workoutWeeks ?? 0) < cond.minWorkoutWeeks) {
    return false;
  }
  if (cond.minOvertimeWeeks !== undefined && (streaks?.overtimeWeeks ?? 0) < cond.minOvertimeWeeks) {
    return false;
  }
  if (cond.minSleepDeficitWeeks !== undefined && (streaks?.sleepDeficitWeeks ?? 0) < cond.minSleepDeficitWeeks) {
    return false;
  }
  if (cond.minSleepFullWeeks !== undefined && (streaks?.sleepFullWeeks ?? 0) < cond.minSleepFullWeeks) {
    return false;
  }
  if (cond.minClubWeeks !== undefined && (streaks?.clubWeeks ?? 0) < cond.minClubWeeks) {
    return false;
  }
  if (
    cond.minStreamUnlockedWeeks !== undefined &&
    (streaks?.streamUnlockedWeeks ?? 0) < cond.minStreamUnlockedWeeks
  ) {
    return false;
  }
  if (cond.minStudyTeenWeeks !== undefined && (streaks?.studyTeenWeeks ?? 0) < cond.minStudyTeenWeeks) {
    return false;
  }
  if (
    cond.minSocialKidsPlayWeeks !== undefined &&
    (streaks?.socialKidsPlayWeeks ?? 0) < cond.minSocialKidsPlayWeeks
  ) {
    return false;
  }
  if (cond.minMismatchWeeks !== undefined && (streaks?.mismatchPresetWeeks ?? 0) < cond.minMismatchWeeks) {
    return false;
  }
  if (cond.lifestylePresetMismatch) {
    if (!isLifestylePresetMismatchWithTraits(state.lifestylePresetId, traitMap)) {
      return false;
    }
  }
  if (cond.requireTier2FocusedSkill) {
    const focus = state.skillTraining?.focus ?? [];
    const courseSkill = state.skillTraining?.course?.skillId;
    const skillStates: Partial<Record<SkillKey, SkillLevelState>> = state.skillTraining?.skillStates ?? {};
    const hasTier2 =
      focus.some(
        (sk) => (skillStates[sk]?.unlockedTier ?? 1) >= 2 || (skillStates[sk]?.level ?? 1) >= 2 || (character.skills[sk] ?? 0) >= 30
      ) || Boolean(courseSkill && (state.skillTraining?.course?.weeksLeft ?? 0) > 0);
    if (!hasTier2) {
      return false;
    }
  }
  if (cond.requireAnnualFocusSet) {
    const af = state.planner?.annualFocus;
    if (!af || af.current === 'none') {
      return false;
    }
  }

  if (cond.requireUnrevealedTalent) {
    const allTalents = [...(character.talents ?? []), ...(character.talentVault ?? [])];
    const hasUnrevealed = allTalents.some((t) => !t.revealed);
    if (!hasUnrevealed) {
      return false;
    }
  }

  if (cond.requireEmployed) {
    const isEmployed =
      state.employment?.status === 'employed' ||
      (state.economy.jobId !== 'none' &&
        state.economy.jobId !== 'infant' &&
        state.economy.jobId !== 'student' &&
        state.economy.jobId !== 'unemployed');
    if (!isEmployed) {
      return false;
    }
  }

  if (cond.requireDropoutCrisisEligible) {
    if (!isDropoutCrisisEligible(state)) {
      return false;
    }
  }

  if (cond.requiredHsTracks && cond.requiredHsTracks.length > 0) {
    const curTrack = character.educationState?.highSchoolTrack;
    if (!curTrack || !cond.requiredHsTracks.includes(curTrack)) {
      return false;
    }
  }

  if (cond.requireLimitationId) {
    const hasLim = (character.limitations ?? []).some(
      (l) => l.id === cond.requireLimitationId && l.curedAtAge === undefined
    );
    if (!hasLim) {
      return false;
    }
  }

  if (cond.minDebt !== undefined && economy.debt < cond.minDebt) {
    return false;
  }

  if (cond.maxGpa !== undefined) {
    const gpa = character.educationState?.currentGpa ?? 3.0;
    if (gpa > cond.maxGpa) {
      return false;
    }
  }

  return true;
}

export function isLifestylePresetMismatchWithTraits(
  presetId: LifestylePresetId | 'custom' | undefined,
  traitMap: Map<string, TraitIntensity>
): boolean {
  if (!presetId || presetId === 'custom' || presetId === 'balanced') return false;
  if (
    (presetId === 'skill_grind' ||
      presetId === 'workaholic' ||
      presetId === 'study_focus' ||
      presetId === 'work_and_gig') &&
    traitMap.has('slacker')
  ) {
    return true;
  }
  if (
    (presetId === 'social_party' || presetId === 'friends_only') &&
    traitMap.has('solitude_lover')
  ) {
    return true;
  }
  if (
    presetId === 'homebody' &&
    (traitMap.has('party_lover') || traitMap.has('peer_attached'))
  ) {
    return true;
  }
  if (presetId === 'rest_recover' && traitMap.has('workaholic')) {
    return true;
  }
  if (presetId === 'fitness' && traitMap.has('slacker')) {
    return true;
  }
  return false;
}

/**
 * Evaluates a single choice for trait/age filtering and cash availability.
 * Per spec: Trait-blocked choices MUST NOT appear in UI choices; their block reason is surfaced in Explain.
 */
export function evaluateStoryletChoice(
  choice: StoryletChoice,
  state: GameState
): { visible: boolean; disabled: boolean; disabledReason?: string; hiddenReason?: string } {
  // Minor hard lock
  if (state.character.isMinor && choice.requiresAdult) {
    return {
      visible: false,
      disabled: true,
      hiddenReason: `ซ่อนตัวเลือก "${choice.label}" เพราะตัวละครยังเป็นผู้เยาว์ (< 18 ปี)`,
    };
  }

  const traitMap = getCharacterTraitMap(state);

  // Explicit blockedByTraits rules hide choices and explain why
  if (choice.blockedByTraits) {
    for (const rule of choice.blockedByTraits) {
      const activeIntensity = traitMap.get(rule.traitId);
      if (!activeIntensity) continue;
      const minRank = INTENSITY_RANK[rule.minIntensity ?? 'subtle'];
      if (INTENSITY_RANK[activeIntensity] >= minRank) {
        const traitName = TRAITS_BY_ID.get(rule.traitId)?.nameTh ?? rule.traitId;
        return {
          visible: false,
          disabled: true,
          hiddenReason: `ซ่อนทางเลือก "${choice.label}" เพราะนิสัย "${traitName}" (${rule.reasonTh})`,
        };
      }
    }
  }

  if (choice.forbiddenTraits) {
    for (const traitId of choice.forbiddenTraits) {
      if (traitMap.has(traitId)) {
        const traitName = TRAITS_BY_ID.get(traitId)?.nameTh ?? traitId;
        return {
          visible: false,
          disabled: true,
          hiddenReason: `ซ่อนทางเลือก "${choice.label}" เพราะนิสัย "${traitName}" ขัดแย้งกับทางเลือกนี้`,
        };
      }
    }
  }

  if (choice.requiredTraits) {
    for (const traitId of choice.requiredTraits) {
      if (!traitMap.has(traitId)) {
        const traitName = TRAITS_BY_ID.get(traitId)?.nameTh ?? traitId;
        return {
          visible: false,
          disabled: true,
          hiddenReason: `ซ่อนทางเลือก "${choice.label}" เพราะต้องมีนิสัย "${traitName}"`,
        };
      }
    }
  }

  if (choice.requiredStats) {
    for (const [key, val] of Object.entries(choice.requiredStats)) {
      const current = readStatValue(state, key);
      if (typeof current === 'number' && typeof val === 'number' && current < val) {
        return {
          visible: true,
          disabled: true,
          disabledReason: choice.conditionalUnlockReasonTh ?? `ค่าสถานะยังไม่ถึงเกณฑ์`,
        };
      }
    }
  }

  if (choice.requiredWealth && choice.requiredWealth.length > 0) {
    if (!choice.requiredWealth.includes(state.character.background.familyWealth)) {
      return {
        visible: true,
        disabled: true,
        disabledReason: choice.conditionalUnlockReasonTh ?? 'ฐานะหรือเงื่อนไขครอบครัวยังไม่ตรงเกณฑ์',
      };
    }
  }

  if (choice.requiredAnyTalents && choice.requiredAnyTalents.length > 0) {
    const allOwned = [
      ...(state.character.talents ?? []),
      ...(state.character.talentVault ?? []),
    ];
    const ownedRevealed = allOwned.filter((t) => t.revealed).map((t) => t.id);
    if (!choice.requiredAnyTalents.some((tid) => ownedRevealed.includes(tid))) {
      return {
        visible: true,
        disabled: true,
        disabledReason: choice.conditionalUnlockReasonTh ?? 'ยังไม่มีพรสวรรค์ที่เปิดเผยตรงกับเงื่อนไขนี้',
      };
    }
  }

  if (choice.requiredSkills) {
    for (const [sk, minVal] of Object.entries(choice.requiredSkills)) {
      const cur = state.character.skills[sk as SkillKey] ?? 0;
      if (typeof minVal === 'number' && cur < minVal) {
        return {
          visible: true,
          disabled: true,
          disabledReason: choice.conditionalUnlockReasonTh ?? 'ทักษะยังไม่ถึงเกณฑ์ของทางเลือกนี้',
        };
      }
    }
  }

  if (choice.requiredMinGpa !== undefined) {
    const gpa = state.character.educationState?.currentGpa ?? 2.5;
    if (gpa < choice.requiredMinGpa) {
      return {
        visible: true,
        disabled: true,
        disabledReason:
          choice.conditionalUnlockReasonTh ??
          `ต้องมีเกรดเฉลี่ยตั้งแต่ ${choice.requiredMinGpa.toFixed(2)} ขึ้นไป`,
      };
    }
  }

  if (choice.requiredMinRawStats) {
    for (const [rk, minVal] of Object.entries(choice.requiredMinRawStats)) {
      const cur = state.character.rawStats[rk as keyof RawStats] ?? 0;
      if (typeof minVal === 'number' && cur < minVal) {
        return {
          visible: true,
          disabled: true,
          disabledReason: choice.conditionalUnlockReasonTh ?? 'พื้นฐานยังไม่ถึงเกณฑ์ของทางเลือกนี้',
        };
      }
    }
  }

  if (state.character.ageYears < 15 && choice.costCash && choice.costCash > 0) {
    return {
      visible: true,
      disabled: true,
      disabledReason: 'อายุต่ำกว่า 15 ปี ไม่สามารถใช้จ่ายเงินส่วนตัวได้',
    };
  }

  if (choice.costCash && state.economy.cash < choice.costCash) {
    return {
      visible: true,
      disabled: true,
      disabledReason: `เงินสดไม่พอ (ต้องการ ${choice.costCash.toLocaleString('th-TH')} บาท)`,
    };
  }

  return { visible: true, disabled: false };
}

/**
 * Filters storylet choices into visible UI EventChoice items + hidden trait reasons for Explain.
 */
export function filterStoryletChoices(
  choices: StoryletChoice[],
  state: GameState
): { visibleChoices: EventChoice[]; hiddenChoiceReasons: string[] } {
  const visibleChoices: EventChoice[] = [];
  const hiddenChoiceReasons: string[] = [];

  for (const ch of choices) {
    const evalRes = evaluateStoryletChoice(ch, state);
    if (!evalRes.visible) {
      if (evalRes.hiddenReason) {
        hiddenChoiceReasons.push(evalRes.hiddenReason);
      }
      continue;
    }

    visibleChoices.push({
      id: ch.id,
      label: ch.label,
      hint: ch.description,
      requiresAdult: ch.requiresAdult,
      blockedByTraits: ch.blockedByTraits?.map((b) => ({
        traitId: b.traitId,
        minIntensity: b.minIntensity,
        reasonTh: b.reasonTh,
      })),
      requiredWealth: ch.requiredWealth,
      requiredAnyTalents: ch.requiredAnyTalents,
      requiredSkills: ch.requiredSkills,
      requiredMinGpa: ch.requiredMinGpa,
      requiredMinRawStats: ch.requiredMinRawStats,
      conditionalUnlockReasonTh: ch.conditionalUnlockReasonTh,
      effects: ch.effects,
      costCash: ch.costCash,
      disabled: evalRes.disabled,
      disabledReason: evalRes.disabledReason,
      twistChance: ch.twistChance,
      twistEffects: ch.twistEffects,
      twistSummary: ch.twistSummary,
    });
  }

  return { visibleChoices, hiddenChoiceReasons };
}

/**
 * Interpolates variables in storylet templates.
 */
export function renderStoryletText(template: string, state: GameState): string {
  const { character, economy } = state;
  const firstName = character.firstName ?? 'ตัวละคร';
  const lastName = character.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return template
    .replace(/\{name\}/g, fullName || firstName)
    .replace(/\{firstName\}/g, firstName)
    .replace(/\{age\}/g, String(character.ageYears))
    .replace(/\{cash\}/g, economy.cash.toLocaleString('th-TH'))
    .replace(/\{province\}/g, character.background.province)
    .replace(/\{job\}/g, economy.jobTitle || 'ไม่มีงานประจำ');
}
