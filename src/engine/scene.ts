import sceneManifestRaw from '../data/sceneManifest.json';
import { deriveClassTier, pickSceneByTagAndTier, type SceneTag } from '../data/sceneMeta';
import { buildDayPlan, type DaySlot, getHighlightSlot, type SlotFallbackReason } from './dayPlan';
import { canEnterNightlife } from './lifeStage';
import type { GameState } from './types';

export type Daypart = 'morning' | 'afternoon' | 'evening' | 'night';

export const ALL_DAYPARTS: readonly Daypart[] = ['morning', 'afternoon', 'evening', 'night'] as const;

export type SceneCategory =
  | 'home'
  | 'school'
  | 'education'
  | 'work'
  | 'commerce'
  | 'street'
  | 'public'
  | 'nightlife';

export type SceneFlag = 'brand' | 'text_glitch' | 'night_only';

export interface SceneAvailability {
  open: string | null;
  close: string | null;
  dayparts: Daypart[];
  alwaysOpen: boolean;
  nightMeaning?: string;
  overtimeDayparts?: Daypart[];
  shiftBased?: boolean;
  greyJobsUseNight?: boolean;
  shopsOpen?: [string, string];
  nightOnly?: boolean;
  hardGate?: string;
  minAgeVisit?: number;
  minAgeVisitSettingMin?: number;
  minAgeWork?: number;
  note?: string;
}

export interface SceneHousing {
  tenures: string[];
  regions?: string[];
  note?: string;
}

export interface SceneEntry {
  id: string;
  nameTh: string;
  nameEn: string;
  category: SceneCategory;
  w: number;
  h: number;
  files: {
    day?: string;
    night?: string;
  };
  daypartImage: Record<Daypart, 'day' | 'night'>;
  availability: SceneAvailability;
  housing?: SceneHousing;
  tags: string[];
  flags: SceneFlag[];
}

export interface SceneManifest {
  meta: {
    version: number;
    style: string;
    coordinate: string;
    root: string;
    categories: Record<string, string>;
    daypartRule: Record<string, string>;
    flags: Record<string, string>;
    idNote?: string;
    paths?: string;
    counts: {
      scenes: number;
      images: number;
    };
  };
  scenes: SceneEntry[];
}

export interface SceneSettings {
  /**
   * Minimum legal age to enter/visit pub for leisure (default: 20 per Thai law, can be toggled to 18 in realism settings).
   * Note: Minors (< 18) are hard-gated in the engine and can never enter.
   */
  pubVisitAge?: 18 | 20;
}

export const SCENE_MANIFEST = sceneManifestRaw as unknown as SceneManifest;

export const SCENES_BY_ID: ReadonlyMap<string, SceneEntry> = new Map(
  SCENE_MANIFEST.scenes.map((s) => [s.id, s])
);

/**
 * Resolves current daypart (morning | afternoon | evening | night) via DayPlan (Spec 04 §4).
 * Pure function: deterministic from state (no React, no Math.random).
 * Priority order:
 *   1) Prompt / Scene Mode explicit daypart override (unless inspecting a specific DayPlan slot)
 *   2) Active slot in DayPlan (provided slotIndex or highlight slot)
 */
export function resolveDaypart(state: GameState, slotIndex?: 0 | 1 | 2 | 3): Daypart {
  const eventDaypart = getPromptDaypartOverride(state);
  if (eventDaypart && slotIndex === undefined) {
    return eventDaypart;
  }

  const plan = buildDayPlan(state, state.settings);
  if (slotIndex !== undefined) {
    return plan[slotIndex].daypart;
  }
  return getHighlightSlot(plan).slot.daypart;
}

/**
 * Event / Prompt explicit daypart override.
 */
function getPromptDaypartOverride(state: GameState): Daypart | undefined {
  return state.pendingPrompt?.daypart ?? state.sceneMode?.daypart;
}

/**
 * Deterministically picks the home residence scene for a character based on
 * wealth, region, and seed.
 */
export function pickHomeSceneForState(state: GameState): string {
  const { character, economy } = state;
  const region = character.background.region;
  const wealth = character.background.familyWealth;

  // Direct housing preference if assigned in economy
  if (economy.housingId === 'cheap_room') return 'home_tenement';
  if (economy.housingId === 'condo') return 'home_condo_mid';

  // Working poor in rural provinces -> rural stilt house; in urban -> tenement
  if (wealth === 'working_poor') {
    if (region === 'northeast' || region === 'north' || (region !== 'bangkok' && Math.abs(state.seed) % 2 === 0)) {
      return 'home_rural_stilt';
    }
    return 'home_tenement';
  }

  // Wealthy backgrounds -> premium condo or mansion
  if (wealth === 'wealthy') {
    return Math.abs(state.seed) % 2 === 0 ? 'home_condo_premium' : 'home_mansion';
  }

  // Middle wealth -> variety between condo, shophouse, and Thai timber compound
  const middleOptions = ['home_condo_mid', 'home_shophouse', 'home_thai_house'];
  const idx = Math.abs(state.seed) % middleOptions.length;
  return middleOptions[idx];
}

/**
 * Deterministically picks the active scene for a given GameState via DayPlan.
 */
export function pickSceneForState(
  state: GameState,
  settings?: SceneSettings,
  slotIndex?: 0 | 1 | 2 | 3
): string {
  const effectiveSettings = settings ?? state.settings;
  const plan = buildDayPlan(state, effectiveSettings);
  const slot = slotIndex !== undefined ? plan[slotIndex] : getHighlightSlot(plan).slot;
  return slot.sceneId;
}

export interface ResolvedSceneMeta {
  sceneId: string;
  daypart: Daypart;
  slot: DaySlot;
  slotIndex: 0 | 1 | 2 | 3;
  fallbackFrom?: string;
  fallbackReason?: SlotFallbackReason;
}

/**
 * Resolves the active scene plus DaySlot / fallback metadata (Spec 04 §4):
 *   1. Storylet / Prompt explicit sceneId or sceneTag
 *   2. Scene Mode (unexpired)
 *   3. Current slot in DayPlan
 *   4. Home residence fallback
 */
export function resolveSceneWithMeta(
  state: GameState,
  options?: {
    sceneId?: string;
    sceneTag?: SceneTag;
    settings?: SceneSettings;
    slotIndex?: 0 | 1 | 2 | 3;
  }
): ResolvedSceneMeta {
  const effectiveSettings = options?.settings ?? state.settings;
  const plan = buildDayPlan(state, effectiveSettings);
  const highlight = getHighlightSlot(plan);
  const slotIndex = options?.slotIndex ?? highlight.index;
  const slot = plan[slotIndex];

  const daypart =
    options?.slotIndex !== undefined
      ? slot.daypart
      : getPromptDaypartOverride(state) ?? slot.daypart;

  const age = state.character?.ageYears ?? 0;
  const homeScene = pickHomeSceneForState(state);

  const fallbackMeta = (
    sceneId: string,
    fallbackFrom?: string,
    fallbackReason?: SlotFallbackReason
  ): ResolvedSceneMeta => ({
    sceneId,
    daypart,
    slot,
    slotIndex,
    fallbackFrom,
    fallbackReason,
  });

  // 1. Storylet / Prompt explicit sceneId (skip when user inspects another slot while no explicit override)
  const explicitSceneId = options?.sceneId ?? state.pendingPrompt?.sceneId;
  if (explicitSceneId && SCENES_BY_ID.has(explicitSceneId)) {
    if (isSceneOpen(explicitSceneId, daypart, age, effectiveSettings)) {
      return fallbackMeta(explicitSceneId);
    }
  }

  // 1b. Storylet / Prompt explicit sceneTag
  const explicitSceneTag = options?.sceneTag ?? state.pendingPrompt?.sceneTag;
  if (explicitSceneTag) {
    const classTier = deriveClassTier(
      state.character.background.familyWealth,
      state.economy.cash
    );
    const taggedScene = pickSceneByTagAndTier(
      explicitSceneTag,
      classTier,
      daypart,
      age,
      effectiveSettings
    );
    if (taggedScene && isSceneOpen(taggedScene, daypart, age, effectiveSettings)) {
      return fallbackMeta(taggedScene);
    }
    if (explicitSceneTag === 'home') {
      return fallbackMeta(homeScene);
    }
    if (
      (explicitSceneTag === 'district' ||
        explicitSceneTag === 'market' ||
        explicitSceneTag === 'cafe' ||
        explicitSceneTag === 'nightlife') &&
      isSceneOpen('street_shops', daypart, age, effectiveSettings)
    ) {
      return fallbackMeta('street_shops', taggedScene ?? undefined, 'closed');
    }
  }

  // 2. Scene Mode (only while unexpired)
  if (
    state.sceneMode?.sceneId &&
    SCENES_BY_ID.has(state.sceneMode.sceneId) &&
    (state.sceneMode.expiresAtTotalDay === undefined ||
      state.date.totalDays < state.sceneMode.expiresAtTotalDay)
  ) {
    if (isSceneOpen(state.sceneMode.sceneId, daypart, age, effectiveSettings)) {
      return fallbackMeta(state.sceneMode.sceneId);
    }
    const reason: SlotFallbackReason =
      state.sceneMode.sceneId === 'nightlife_pub' && !canEnterNightlife(age, effectiveSettings)
        ? age < 18
          ? 'underage'
          : 'nightlife_age'
        : 'closed';
    return fallbackMeta(homeScene, state.sceneMode.sceneId, reason);
  }

  // Fallback for closed explicit sceneId by group hint
  if (explicitSceneId) {
    if (explicitSceneId.startsWith('home_')) {
      return fallbackMeta(homeScene);
    }
    if (
      (explicitSceneId.startsWith('shop_') ||
        explicitSceneId.startsWith('street_') ||
        explicitSceneId.startsWith('market_') ||
        explicitSceneId.startsWith('cafe') ||
        explicitSceneId.startsWith('restaurant_') ||
        explicitSceneId.startsWith('nightlife_')) &&
      isSceneOpen('street_shops', daypart, age, effectiveSettings)
    ) {
      return fallbackMeta('street_shops', explicitSceneId, 'closed');
    }
    return fallbackMeta(homeScene, explicitSceneId, 'closed');
  }

  // 3. Current slot in DayPlan
  if (isSceneOpen(slot.sceneId, daypart, age, effectiveSettings, { isOvertime: slot.isOvertime })) {
    return fallbackMeta(slot.sceneId, slot.fallbackFrom, slot.fallbackReason);
  }

  // 4. Home residence fallback
  return fallbackMeta(homeScene, slot.fallbackFrom ?? slot.sceneId, slot.fallbackReason ?? 'closed');
}

export function resolveScene(
  state: GameState,
  options?: {
    sceneId?: string;
    sceneTag?: SceneTag;
    settings?: SceneSettings;
    slotIndex?: 0 | 1 | 2 | 3;
  }
): string {
  return resolveSceneWithMeta(state, options).sceneId;
}

export function getSceneModeRemainingDays(state: GameState): number | null {
  if (!state.sceneMode || state.sceneMode.expiresAtTotalDay === undefined) {
    return null;
  }
  return Math.max(0, state.sceneMode.expiresAtTotalDay - state.date.totalDays);
}

/**
 * Checks if a scene is currently accessible (open) given the daypart, age, and settings.
 * Pure function.
 */
export function isSceneOpen(
  sceneId: string,
  daypart: Daypart,
  age: number,
  settings?: SceneSettings,
  options?: { isOvertime?: boolean }
): boolean {
  const scene = SCENES_BY_ID.get(sceneId);
  if (!scene) return false;

  // Housing scenes are residences: open 24/7 across every daypart
  if (scene.category === 'home' || scene.id.startsWith('home_')) {
    return true;
  }

  // Pub age gating (03 ข้อ 2 & 3)
  if (sceneId === 'nightlife_pub') {
    if (!canEnterNightlife(age, settings)) {
      return false;
    }
  }

  // General daypart check against availability list
  if (scene.availability.dayparts.includes(daypart)) {
    return true;
  }

  // Overtime dayparts only for adults (18+) actively working overtime
  if (
    options?.isOvertime &&
    age >= 18 &&
    scene.availability.overtimeDayparts?.includes(daypart)
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves the public asset URL for a given scene and daypart.
 * Resolves via: files[daypartImage[daypart]] ?? files.day ?? files.night
 * Prepends import.meta.env.BASE_URL + 'assets/'
 * Note: scenes with only night image (e.g. street_food_night, nightlife_pub) resolve to night across all dayparts.
 */
export function sceneImagePath(sceneId: string, daypart: Daypart): string {
  const scene = SCENES_BY_ID.get(sceneId);
  if (!scene) return '';

  const imgKey = scene.daypartImage[daypart] ?? 'day';
  const fileRel = scene.files[imgKey] ?? scene.files.day ?? scene.files.night;
  if (!fileRel) return '';

  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.BASE_URL === 'string'
      ? import.meta.env.BASE_URL
      : '/';

  const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const cleanRel = fileRel.startsWith('/') ? fileRel.slice(1) : fileRel;

  return `${cleanBase}assets/${cleanRel}`;
}

/**
 * Dev validation: checks manifest completeness and flags in development mode.
 */
let hasValidatedManifest = false;
export function validateSceneManifestInDev(): void {
  if (hasValidatedManifest) return;
  hasValidatedManifest = true;

  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    for (const scene of SCENE_MANIFEST.scenes) {
      if (scene.flags.includes('brand')) {
        console.warn(
          `[SceneManifest] Scene "${scene.id}" (${scene.nameTh}) has flag "brand" (contains logo resembling 7-Eleven or real brand). Needs review before production.`
        );
      }
      if (!scene.files.day && !scene.files.night) {
        console.warn(`[SceneManifest] Scene "${scene.id}" has no image files defined in manifest!`);
      }
    }
  }
}
