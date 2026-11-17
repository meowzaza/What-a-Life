import rawManifest from '../data/characterManifest.json';
import { normalizeSeed, pickOne, weightedPick } from './rng';
import type {
  AppearanceStage,
  CharacterAppearance,
  FamilyStructure,
  FamilyWealthTier,
  Gender,
  GeneticEyeColor,
  Person,
  RegionId,
  Skills,
  TemperamentId,
} from './types';

export type ManifestGroup = 'baby' | 'kid' | 'male' | 'female' | 'elder';
export type ManifestGender = 'm' | 'f' | 'n';
export type ManifestLookAge = 'baby' | 'child' | 'teen' | 'adult' | 'mature' | 'senior';
export type ManifestEyeShape = 'narrow' | 'balanced' | 'round' | 'closed' | 'hidden';
export type ManifestEyeColor =
  | 'dark'
  | 'blue'
  | 'green'
  | 'gray'
  | 'amber'
  | 'purple'
  | 'closed'
  | 'hidden';

export type AppearanceTagCategory = 'look' | 'type' | 'fashion' | 'style' | 'trait';

export interface AppearanceTagMeta {
  label: string;
  category: AppearanceTagCategory;
  priority: number;
}

export const APPEARANCE_TAG_CATEGORY_LABELS: Record<AppearanceTagCategory, string> = {
  look: 'หน้าตาและอารมณ์',
  type: 'ไทป์และบุคลิก',
  fashion: 'แฟชั่นและการแต่งตัว',
  style: 'สไตล์และบทบาทที่เห็น',
  trait: 'เอกลักษณ์และไอเท็ม',
};

export const APPEARANCE_TAG_CATEGORY_ORDER: AppearanceTagCategory[] = [
  'look',
  'type',
  'fashion',
  'style',
  'trait',
];

export interface CharacterBustFocus {
  x: number;
  y: number;
  zoom?: number;
}

export interface CharacterSpriteMeta {
  id: string;
  group: ManifestGroup;
  w: number;
  h: number;
  skinTone: number;
  skinHex: string;
  hairHex: string;
  hairColor: string;
  lookAge: ManifestLookAge;
  ageRange?: [number, number];
  bustFocus?: CharacterBustFocus;
  gender: ManifestGender;
  eyeShape?: ManifestEyeShape;
  eyeColor?: ManifestEyeColor;
  tags: string[];
  flags: string[];
  isUniform?: boolean;
  file: string;
  anchor: {
    x: number;
    y: number;
  };
}

export interface AppearanceEligibilityOptions {
  allowDyed?: boolean;
  allowMatureGray?: boolean;
}

export interface AppearanceContext {
  familyWealth?: FamilyWealthTier;
  region?: RegionId;
  temperament?: TemperamentId;
  familyStructure?: FamilyStructure;
  jobId?: string;
  traits?: readonly string[];
  skills?: Partial<Skills>;
  isOrphan?: boolean;
}

interface CharacterManifestData {
  meta?: Record<string, unknown>;
  characters: CharacterSpriteMeta[];
}

const manifest = rawManifest as unknown as CharacterManifestData;
const ALL_ENTRIES: readonly CharacterSpriteMeta[] = Array.isArray(manifest?.characters)
  ? manifest.characters
  : [];

const ENTRY_BY_ID = new Map<string, CharacterSpriteMeta>(
  ALL_ENTRIES.map((entry) => [entry.id, entry])
);

const MIN_GENDER_POOL = 5;

const FANCY_HAIR_COLORS = new Set([
  'pink',
  'blue',
  'purple',
  'teal/green',
  'multicolor',
]);

const GRAY_WHITE_HAIR_COLORS = new Set(['gray', 'white']);

const GENETIC_EYE_SET = new Set<GeneticEyeColor>([
  'dark',
  'blue',
  'green',
  'gray',
  'amber',
  'purple',
]);

export function hasKnownEyeColor(eye?: ManifestEyeColor): eye is GeneticEyeColor {
  return Boolean(eye && GENETIC_EYE_SET.has(eye as GeneticEyeColor));
}

export function getAppearanceStage(ageYears: number): AppearanceStage {
  if (ageYears <= 3) return 'baby';
  if (ageYears <= 15) return 'kid';
  if (ageYears <= 59) return 'adult';
  return 'elder';
}

export function getAppearanceStageLabel(stage: AppearanceStage): string {
  switch (stage) {
    case 'baby':
      return 'วัยทารก';
    case 'kid':
      return 'วัยเด็ก';
    case 'adult':
      return 'วัยผู้ใหญ่';
    case 'elder':
      return 'วัยสูงอายุ';
  }
}

export function getAllManifestEntries(): readonly CharacterSpriteMeta[] {
  return ALL_ENTRIES;
}

export function getManifestEntry(charId?: string): CharacterSpriteMeta | undefined {
  if (!charId) return undefined;
  return ENTRY_BY_ID.get(charId);
}

function hashString32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return normalizeSeed(h >>> 0);
}

export function getAppearanceAgeBand(ageYears: number): string {
  if (ageYears <= 1) return 'newborn';
  if (ageYears <= 3) return 'toddler';
  if (ageYears <= 15) return 'kid';
  if (ageYears <= 19) return 'teen';
  if (ageYears <= 34) return 'young_adult';
  if (ageYears <= 49) return 'mid_adult';
  if (ageYears <= 59) return 'mature_adult';
  return 'elder';
}

/**
 * RNG แยกต่างหากสำหรับ appearance เพื่อไม่ให้แตะ main RNG stream ของ GameState
 */
export function createAppearanceRngState(
  seed: number,
  stage: AppearanceStage,
  ageYears?: number
): number {
  const key = ageYears !== undefined ? getAppearanceAgeBand(ageYears) : stage;
  return hashString32(`${normalizeSeed(seed)}:appearance:${key}`);
}

export function revealGeneticEyeColor(
  seed: number,
  refEntry: CharacterSpriteMeta | undefined,
  gender: Gender
): GeneticEyeColor {
  if (refEntry && hasKnownEyeColor(refEntry.eyeColor)) {
    return refEntry.eyeColor;
  }
  const rng = hashString32(`${normalizeSeed(seed)}:reveal_eye:${gender}`);
  const isMixed =
    Boolean(refEntry?.tags.includes('luk_kreung')) ||
    refEntry?.hairColor === 'blonde' ||
    refEntry?.hairColor === 'red/orange';

  if (isMixed) {
    return weightedPick(rng, [
      { id: 'dark' as GeneticEyeColor, weight: 45 },
      { id: 'amber' as GeneticEyeColor, weight: 20 },
      { id: 'blue' as GeneticEyeColor, weight: 20 },
      { id: 'green' as GeneticEyeColor, weight: 10 },
      { id: 'gray' as GeneticEyeColor, weight: 5 },
    ]).value.id;
  }

  if ((refEntry?.skinTone ?? 3) <= 2) {
    return weightedPick(rng, [
      { id: 'dark' as GeneticEyeColor, weight: 86 },
      { id: 'amber' as GeneticEyeColor, weight: 10 },
      { id: 'blue' as GeneticEyeColor, weight: 2 },
      { id: 'green' as GeneticEyeColor, weight: 2 },
    ]).value.id;
  }

  return weightedPick(rng, [
    { id: 'dark' as GeneticEyeColor, weight: 94 },
    { id: 'amber' as GeneticEyeColor, weight: 6 },
  ]).value.id;
}

export function revealGeneticHairColor(
  seed: number,
  refEntry: CharacterSpriteMeta | undefined,
  gender: Gender
): string {
  if (
    refEntry &&
    !refEntry.tags.includes('bald') &&
    !GRAY_WHITE_HAIR_COLORS.has(refEntry.hairColor) &&
    !FANCY_HAIR_COLORS.has(refEntry.hairColor)
  ) {
    return refEntry.hairColor;
  }

  const rng = hashString32(`${normalizeSeed(seed)}:reveal_hair:${gender}`);
  if (refEntry?.tags.includes('luk_kreung')) {
    return weightedPick(rng, [
      { id: 'brown', weight: 35 },
      { id: 'light brown', weight: 35 },
      { id: 'dark brown', weight: 15 },
      { id: 'blonde', weight: 10 },
      { id: 'red/orange', weight: 5 },
    ]).value.id;
  }

  if ((refEntry?.skinTone ?? 3) <= 2) {
    return weightedPick(rng, [
      { id: 'black', weight: 38 },
      { id: 'dark brown', weight: 36 },
      { id: 'brown', weight: 18 },
      { id: 'light brown', weight: 8 },
    ]).value.id;
  }

  return weightedPick(rng, [
    { id: 'black', weight: 52 },
    { id: 'dark brown', weight: 34 },
    { id: 'brown', weight: 14 },
  ]).value.id;
}

function isGroupAllowedForStage(group: ManifestGroup, stage: AppearanceStage): boolean {
  switch (stage) {
    case 'baby':
      return group === 'baby';
    case 'kid':
      return group === 'kid';
    case 'adult':
      return group === 'male' || group === 'female';
    case 'elder':
      return group === 'elder';
  }
}

function hasSchoolUniformTag(entry: CharacterSpriteMeta): boolean {
  return (
    entry.tags.includes('student_uniform') ||
    entry.tags.includes('school_uniform')
  );
}

export function isDyedOrFancyHair(entry: CharacterSpriteMeta): boolean {
  if (entry.tags.includes('dyed_hair')) return true;
  return FANCY_HAIR_COLORS.has(entry.hairColor);
}

export function isAppearanceEntryEligibleForAge(
  entry: CharacterSpriteMeta,
  ageYears: number,
  options?: AppearanceEligibilityOptions
): boolean {
  const stage = getAppearanceStage(ageYears);
  if (!isGroupAllowedForStage(entry.group, stage)) {
    return false;
  }
  // อายุ 0-15 ล็อกให้อยู่เฉพาะ baby/kid
  if (ageYears <= 15 && entry.group !== 'baby' && entry.group !== 'kid') {
    return false;
  }
  // ขอบเขตอายุรายตัวตามหน้าตาจริง (เช่น วัย 16-19 ห้ามหลุดไปหน้า 35-55)
  if (entry.ageRange) {
    const [minAge, maxAge] = entry.ageRange;
    if (ageYears < minAge || ageYears > maxAge) {
      return false;
    }
  }
  // แท็กชุดนักเรียน/นักศึกษาใช้ได้เฉพาะอายุ 16-19 ปีเท่านั้น
  if (hasSchoolUniformTag(entry) && (ageYears < 16 || ageYears > 19)) {
    return false;
  }
  // ผมสีแฟนซี / ผมย้อม สงวนไว้ให้ผู้เล่นเลือกย้อม/เปลี่ยนสไตล์ในอนาคต (ไม่สุ่มอัตโนมัติ)
  if (!options?.allowDyed && isDyedOrFancyHair(entry)) {
    return false;
  }
  // ผมเทา/ขาวเป็นสีผมธรรมชาติของวัยชรา (60+) เท่านั้น
  // ยกเว้นกรณีเริ่มเล่นช่วง 45-59 โดยตรงที่อนุญาตเฉพาะ lookAge=mature (mature_gray)
  if (stage !== 'elder' && GRAY_WHITE_HAIR_COLORS.has(entry.hairColor)) {
    const canMatureGray =
      Boolean(options?.allowMatureGray) &&
      ageYears >= 45 &&
      entry.lookAge === 'mature' &&
      entry.tags.includes('mature_gray');
    if (!canMatureGray) {
      return false;
    }
  }
  return true;
}

export function isAppearanceValidForAge(
  charId: string,
  ageYears: number,
  entries: readonly CharacterSpriteMeta[] = ALL_ENTRIES,
  options?: AppearanceEligibilityOptions
): boolean {
  const entry =
    entries === ALL_ENTRIES
      ? ENTRY_BY_ID.get(charId)
      : entries.find((e) => e.id === charId);
  if (!entry) return false;
  return isAppearanceEntryEligibleForAge(entry, ageYears, options);
}

export function getEligibleAppearancePoolFromEntries(
  entries: readonly CharacterSpriteMeta[],
  gender: Gender,
  ageYears: number,
  options?: AppearanceEligibilityOptions
): CharacterSpriteMeta[] {
  const stage = getAppearanceStage(ageYears);
  const stagePool = entries.filter((e) =>
    isAppearanceEntryEligibleForAge(e, ageYears, options)
  );
  if (stagePool.length === 0) return [];

  let genderPool = stagePool;
  // ทารก 0-1 ปีอยู่ในห่อผ้าเหมือนกันทุกเพศ จึงไม่จำเป็นต้องแยกพูลตามเพศ
  if (stage === 'baby' && ageYears <= 1) {
    return stagePool;
  }

  if (gender !== 'nonbinary') {
    const target: ManifestGender = gender === 'male' ? 'm' : 'f';
    if (stage === 'baby') {
      // วัยเตาะแตะ 2-3 ปี ใช้ชุดยูนิเซ็กซ์ (n) ร่วมกับชุดเฉพาะเพศเพื่อให้ครบทุกสีผิวและสีผม
      const withNeutral = stagePool.filter((e) => e.gender === target || e.gender === 'n');
      genderPool = withNeutral.length > 0 ? withNeutral : stagePool;
    } else {
      const exact = stagePool.filter((e) => e.gender === target);
      if (exact.length >= MIN_GENDER_POOL) {
        genderPool = exact;
      } else {
        const withNeutral = stagePool.filter((e) => e.gender === target || e.gender === 'n');
        if (withNeutral.length >= MIN_GENDER_POOL) {
          genderPool = withNeutral;
        } else if (exact.length > 0) {
          genderPool = exact;
        } else if (withNeutral.length > 0) {
          genderPool = withNeutral;
        } else {
          genderPool = stagePool;
        }
      }
    }
  }

  // สำหรับชุดข้อมูลเก่าที่ยังไม่มี ageRange: กัน lookAge=mature ออกจากวัย 20-44
  if (stage === 'adult' && ageYears >= 20 && ageYears <= 44) {
    const adultOrBounded = genderPool.filter((e) => Boolean(e.ageRange) || e.lookAge === 'adult');
    if (
      adultOrBounded.length >= MIN_GENDER_POOL ||
      (adultOrBounded.length > 0 && genderPool.length < MIN_GENDER_POOL)
    ) {
      return adultOrBounded;
    }
  }

  return genderPool;
}

export function getEligibleAppearancePool(
  gender: Gender,
  ageYears: number,
  options?: AppearanceEligibilityOptions
): CharacterSpriteMeta[] {
  return getEligibleAppearancePoolFromEntries(ALL_ENTRIES, gender, ageYears, options);
}

function getAdultLookWeight(lookAge: ManifestLookAge, ageYears: number): number {
  if (ageYears >= 16 && ageYears <= 19) {
    if (lookAge === 'teen') return 6;
    if (lookAge === 'adult') return 1;
    return 0.2;
  }
  if (ageYears >= 45 && ageYears <= 59) {
    if (lookAge === 'mature') return 6;
    if (lookAge === 'adult') return 1.5;
    if (lookAge === 'senior') return 1;
    return 0.2;
  }
  return 1;
}

const NATURAL_DARK_SET = new Set(['black', 'dark brown']);

interface ResolvedGeneticTraits {
  hairColor: string;
  eyeColor?: GeneticEyeColor;
  revealedNewHair: boolean;
  revealedNewEye: boolean;
}

function resolvePrevGeneticTraits(
  prevEntry: CharacterSpriteMeta,
  prevAppearance: CharacterAppearance | undefined,
  seed: number,
  gender: Gender,
  targetAgeYears: number
): ResolvedGeneticTraits {
  const prevWasBald = prevEntry.tags.includes('bald');
  const prevWasClosedEye = prevEntry.eyeColor === 'closed' || prevEntry.eyeColor === 'hidden';

  let hairColor = prevAppearance?.geneticHairColor;
  let revealedNewHair = false;
  if (!hairColor) {
    if (prevWasBald && targetAgeYears >= 2) {
      hairColor = revealGeneticHairColor(seed, prevEntry, gender);
      revealedNewHair = true;
    } else {
      hairColor = prevEntry.hairColor;
    }
  }

  let eyeColor: GeneticEyeColor | undefined = prevAppearance?.geneticEyeColor;
  let revealedNewEye = false;
  if (!eyeColor) {
    if (hasKnownEyeColor(prevEntry.eyeColor)) {
      eyeColor = prevEntry.eyeColor;
    } else if (prevWasClosedEye && targetAgeYears >= 2) {
      eyeColor = revealGeneticEyeColor(seed, prevEntry, gender);
      revealedNewEye = true;
    }
  }

  return {
    hairColor,
    eyeColor,
    revealedNewHair,
    revealedNewEye,
  };
}

function getAllowedNaturalHairTiers(
  prevHair: string,
  prevEntry: CharacterSpriteMeta,
  targetStage: AppearanceStage
): string[][] {
  if (targetStage === 'elder') {
    if (prevHair === 'white' || prevHair === 'gray') {
      return [[prevHair], ['white', 'gray']];
    }
    if (NATURAL_DARK_SET.has(prevHair)) {
      return [
        ['gray', 'white'],
        ['black', 'dark brown'],
      ];
    }
    return [['white', 'gray'], ['black', 'dark brown']];
  }

  // ก่อนวัยชรา (< 60): ห้ามเปลี่ยนไปเป็นสีผมอื่นที่ไม่เข้ากัน
  switch (prevHair) {
    case 'black':
    case 'dark brown':
      return [['black', 'dark brown']];
    case 'brown':
      return [
        ['brown'],
        prevEntry.skinTone <= 2 ? ['brown', 'dark brown', 'light brown'] : ['brown', 'dark brown'],
      ];
    case 'light brown':
      if (prevEntry.tags.includes('luk_kreung') || prevEntry.tags.includes('natural_blonde')) {
        return [
          ['light brown', 'blonde'],
          ['light brown', 'blonde', 'brown'],
        ];
      }
      return [
        ['light brown'],
        ['light brown', 'brown'],
        ['light brown', 'brown', 'dark brown'],
      ];
    case 'blonde':
      return [
        ['blonde'],
        ['blonde', 'light brown'],
      ];
    case 'red/orange':
      return [
        ['red/orange'],
        ['red/orange', 'light brown', 'brown'],
      ];
    case 'gray':
    case 'white':
      return [['gray', 'white'], ['light brown', 'brown']];
    default:
      return [[prevHair]];
  }
}

function getHairContinuityScore(
  prevHair: string,
  candidate: CharacterSpriteMeta,
  targetStage: AppearanceStage
): number {
  const candHair = candidate.hairColor;

  if (targetStage === 'elder') {
    if (candHair === 'white' || candHair === 'gray') return 22;
    if (NATURAL_DARK_SET.has(prevHair) && candHair === prevHair) return 14;
    if (NATURAL_DARK_SET.has(prevHair) && NATURAL_DARK_SET.has(candHair)) return 10;
    return 0;
  }

  if (candHair === prevHair) return 26;
  if (NATURAL_DARK_SET.has(prevHair) && NATURAL_DARK_SET.has(candHair)) return 16;
  if (
    (prevHair === 'light brown' && candHair === 'blonde') ||
    (prevHair === 'blonde' && candHair === 'light brown')
  ) {
    return 14;
  }
  if (
    (prevHair === 'light brown' && candHair === 'brown') ||
    (prevHair === 'brown' && candHair === 'light brown') ||
    (prevHair === 'brown' && candHair === 'dark brown')
  ) {
    return 10;
  }
  if (prevHair === 'red/orange' && (candHair === 'light brown' || candHair === 'brown')) {
    return 10;
  }
  return -20;
}

function getEyeShapeContinuityScore(
  prevEntry: CharacterSpriteMeta,
  candidate: CharacterSpriteMeta
): number {
  const prevEye = prevEntry.eyeShape;
  const candEye = candidate.eyeShape;
  if (!prevEye || !candEye) return 0;

  if (prevEye === 'closed' || prevEye === 'hidden') {
    if (candEye === 'balanced') return 8;
    if (candEye === 'round' || candEye === 'narrow') return 4;
    return 0;
  }
  if (candEye === 'closed' || candEye === 'hidden') {
    return 0;
  }
  if (prevEye === candEye) return 24;
  // ห้ามข้ามระหว่างตาตี่ (narrow) กับตาโต (round)
  if ((prevEye === 'narrow' && candEye === 'round') || (prevEye === 'round' && candEye === 'narrow')) {
    return -24;
  }
  return 6;
}

const LIGHT_EYES_SET = new Set<ManifestEyeColor>(['blue', 'green', 'gray', 'amber']);

function getEyeColorContinuityScore(
  prevColor: ManifestEyeColor | undefined,
  candidate: CharacterSpriteMeta
): number {
  const candColor = candidate.eyeColor;
  if (!prevColor || !candColor) return 0;

  if (prevColor === 'closed' || prevColor === 'hidden') {
    return candColor === 'dark' ? 4 : 0;
  }
  if (candColor === 'closed' || candColor === 'hidden') {
    return 0;
  }
  if (prevColor === candColor) return 22;

  if (prevColor === 'dark') {
    return candColor === 'amber' ? 2 : -18;
  }

  if (LIGHT_EYES_SET.has(prevColor) && LIGHT_EYES_SET.has(candColor)) {
    return 10;
  }
  if (LIGHT_EYES_SET.has(prevColor) && candColor === 'dark') {
    return 2;
  }
  return -10;
}

function isOppositeEyeShape(
  a?: ManifestEyeShape,
  b?: ManifestEyeShape
): boolean {
  return (a === 'narrow' && b === 'round') || (a === 'round' && b === 'narrow');
}

function isUnnaturalEyeJump(
  prev?: ManifestEyeColor,
  cand?: ManifestEyeColor
): boolean {
  if (prev === 'dark' && (cand === 'blue' || cand === 'purple' || cand === 'green')) {
    return true;
  }
  return false;
}

function filterPoolWithNaturalHairContinuity(
  pool: CharacterSpriteMeta[],
  prevEntry: CharacterSpriteMeta,
  resolved: ResolvedGeneticTraits,
  targetStage: AppearanceStage,
  ageYears: number
): CharacterSpriteMeta[] {
  const tiers = getAllowedNaturalHairTiers(resolved.hairColor, prevEntry, targetStage);
  const prevEye = resolved.eyeColor ?? prevEntry.eyeColor;

  // หากกำลังโตจากทารก 0-1 ที่หลับตา/หัวล้าน สู่เด็ก 2-15 ขวบ ให้ให้ความสำคัญกับตัวละครที่ลืมตา/มีผมก่อน
  const preferVisibleTraits = (list: CharacterSpriteMeta[]): CharacterSpriteMeta[] => {
    if (ageYears < 2 || ageYears > 15) return list;
    let current = list;
    if (ageYears <= 3 && resolved.revealedNewEye) {
      const openEyed = current.filter((c) => hasKnownEyeColor(c.eyeColor));
      if (openEyed.length > 0) current = openEyed;
    }
    if (resolved.revealedNewHair || !prevEntry.tags.includes('bald')) {
      const withHair = current.filter((c) => !c.tags.includes('bald'));
      if (withHair.length > 0) current = withHair;
    }
    return current;
  };

  // 1) สีผมธรรมชาติตรง/ใกล้ + สีผิวต่าง <= 1 + ทรงตาไม่ตรงข้ามกัน (narrow <-> round) + สีตาธรรมชาติไม่กระโดด
  for (const allowedColors of tiers) {
    const allowedSet = new Set(allowedColors);
    const ideal = preferVisibleTraits(
      pool.filter(
        (c) =>
          allowedSet.has(c.hairColor) &&
          Math.abs(c.skinTone - prevEntry.skinTone) <= 1 &&
          !isOppositeEyeShape(prevEntry.eyeShape, c.eyeShape) &&
          !isUnnaturalEyeJump(prevEye, c.eyeColor)
      )
    );
    if (ideal.length > 0) return ideal;
  }

  // 2) สีผมธรรมชาติตรง/ใกล้ + สีผิวต่าง <= 1 + สีตาธรรมชาติไม่กระโดด
  for (const allowedColors of tiers) {
    const allowedSet = new Set(allowedColors);
    const closeSkin = preferVisibleTraits(
      pool.filter(
        (c) =>
          allowedSet.has(c.hairColor) &&
          Math.abs(c.skinTone - prevEntry.skinTone) <= 1 &&
          !isUnnaturalEyeJump(prevEye, c.eyeColor)
      )
    );
    if (closeSkin.length > 0) return closeSkin;
  }

  // 3) สีผมธรรมชาติตรง/ใกล้ + สีผิวต่าง <= 2 + สีตาธรรมชาติไม่กระโดด
  for (const allowedColors of tiers) {
    const allowedSet = new Set(allowedColors);
    const mediumSkin = preferVisibleTraits(
      pool.filter(
        (c) =>
          allowedSet.has(c.hairColor) &&
          Math.abs(c.skinTone - prevEntry.skinTone) <= 2 &&
          !isUnnaturalEyeJump(prevEye, c.eyeColor)
      )
    );
    if (mediumSkin.length > 0) return mediumSkin;
  }

  // 4) ผ่อนปรนสีตา: สีผมตรง + สีผิวต่าง <= 1
  for (const allowedColors of tiers) {
    const allowedSet = new Set(allowedColors);
    const fallbackSkin1 = pool.filter(
      (c) =>
        allowedSet.has(c.hairColor) &&
        Math.abs(c.skinTone - prevEntry.skinTone) <= 1
    );
    if (fallbackSkin1.length > 0) return fallbackSkin1;
  }

  // 5) ผ่อนปรนสีตา: สีผมตรง + สีผิวต่าง <= 2
  for (const allowedColors of tiers) {
    const allowedSet = new Set(allowedColors);
    const fallbackSkin2 = pool.filter(
      (c) =>
        allowedSet.has(c.hairColor) &&
        Math.abs(c.skinTone - prevEntry.skinTone) <= 2
    );
    if (fallbackSkin2.length > 0) return fallbackSkin2;
  }

  // 6) สีผมธรรมชาติตรง/ใกล้ (ไม่จำกัดสีผิว)
  for (const allowedColors of tiers) {
    const allowedSet = new Set(allowedColors);
    const matchingHair = pool.filter((c) => allowedSet.has(c.hairColor));
    if (matchingHair.length > 0) return matchingHair;
  }

  return pool;
}

const LUXURY_TAGS = new Set([
  'luxury',
  'khun_nu',
  'khun_nai',
  'sia',
  'sugar_daddy',
  'sugar_mommy',
  'sor',
]);

const HUMBLE_TAGS = new Set(['humble', 'street_working']);

export function getContextAlignmentScore(
  candidate: CharacterSpriteMeta,
  ageYears: number,
  context?: AppearanceContext
): number {
  if (!context) return 0;

  const tags = new Set(candidate.tags);
  let score = 0;

  const hasLuxury = candidate.tags.some((t) => LUXURY_TAGS.has(t));
  const hasHumble = candidate.tags.some((t) => HUMBLE_TAGS.has(t));

  // 1. ฐานะและสถานะครอบครัว
  if (context.isOrphan || context.familyWealth === 'destitute' || context.familyWealth === 'working_poor') {
    if (hasLuxury) score -= context.isOrphan || context.familyWealth === 'destitute' ? 38 : 26;
    if (hasHumble) score += 16;
    if (tags.has('middle_class') && !hasLuxury) score += 4;
  } else if (context.familyWealth === 'wealthy' || context.familyWealth === 'upper_middle') {
    const isRichTier = context.familyWealth === 'wealthy';
    if (hasLuxury) score += isRichTier ? 20 : 14;
    if (tags.has('office')) score += 6;
    if (hasHumble) score -= isRichTier ? 24 : 14;
  } else if (context.familyWealth === 'middle' || context.familyWealth === 'lower_middle') {
    if (tags.has('middle_class') || tags.has('office') || tags.has('casual')) score += 10;
    if (context.familyWealth === 'lower_middle' && hasHumble) score += 6;
    if (context.familyWealth === 'lower_middle' && hasLuxury) score -= 12;
  }

  // 2. ภูมิภาคและเอกลักษณ์ท้องถิ่น
  if (context.region === 'northeast') {
    if (tags.has('isaan_vibe')) score += 18;
    if (tags.has('thai_traditional') && context.familyWealth !== 'wealthy') score += 8;
  } else if (context.region === 'north') {
    if (tags.has('north_vibe')) score += 18;
    if (tags.has('thai_traditional') && context.familyWealth !== 'wealthy') score += 8;
  } else if (context.region === 'south') {
    if (tags.has('south_vibe')) score += 16;
  } else if (context.region === 'bangkok') {
    if (tags.has('central_bkk')) score += 12;
    if (tags.has('office')) score += 6;
  }

  // 3. นิสัยพื้นฐาน (Temperament) และบุคลิก
  if (context.temperament === 'optimistic') {
    if (tags.has('cheerful') || tags.has('cute') || tags.has('kind')) score += 14;
    if (tags.has('haughty') || tags.has('strict') || tags.has('bad_boy')) score -= 10;
  } else if (context.temperament === 'calm') {
    if (tags.has('quiet') || tags.has('kind') || tags.has('artistic')) score += 12;
  } else if (context.temperament === 'fiery') {
    if (tags.has('bad_boy') || tags.has('rebellious') || tags.has('haughty') || tags.has('muscular')) score += 14;
  } else if (context.temperament === 'anxious') {
    if (tags.has('quiet') || tags.has('nerdy') || tags.has('gamer') || tags.has('shy_look')) score += 12;
  } else if (context.temperament === 'ambitious') {
    if (
      tags.has('strict') ||
      tags.has('haughty') ||
      tags.has('office') ||
      tags.has('sia') ||
      tags.has('jae') ||
      tags.has('sor')
    ) {
      score += 14;
    }
  }

  // 4. สายงาน / ความสนใจ
  const techAffinity =
    (context.skills?.tech ?? 0) >= 15 ||
    context.jobId === 'software_dev' ||
    Boolean(context.traits?.some((t) => t.includes('gamer')));
  if (techAffinity && (tags.has('gamer') || tags.has('nerdy'))) {
    score += 16;
  }
  if ((context.jobId === 'office_junior' || context.jobId === 'sales_manager' || context.jobId === 'civil_servant') && tags.has('office')) {
    score += 10;
  }

  // 5. วัยกับ lookAge
  if (ageYears >= 16 && ageYears <= 59) {
    if (ageYears <= 19 && candidate.lookAge === 'teen') score += 6;
    else if (ageYears >= 40 && candidate.lookAge === 'mature') score += 6;
    else if (ageYears >= 20 && ageYears <= 39 && candidate.lookAge === 'adult') score += 4;
  }

  return score;
}

export type PreviousAppearanceRef = CharacterAppearance | string | null | undefined;

const FACE_TYPE_TAGS = new Set([
  'cunning_look',
  'flirty_look',
  'gentle_look',
  'villain_look',
  'innocent_look',
  'charismatic_look',
  'mysterious_look',
  'energetic_look',
  'shy_look',
  'serious_look',
  'cute',
  'pretty',
  'handsome',
  'haughty',
  'quiet',
  'cheerful',
  'kind',
  'strict',
  'rebellious',
  'luk_kreung',
  'chubby',
  'muscular',
]);

const IGNORED_OTHER_TAGS = new Set([
  'casual',
  'uniform',
  'student_uniform',
  'school_uniform',
  'swaddled',
  'toddler',
  'dyed_hair',
  'mature_gray',
]);

export interface SimilarityMatchResult {
  matchedCriteria: number;
  score: number;
}

export function evaluateAppearanceSimilarity(
  prevEntry: CharacterSpriteMeta,
  candidate: CharacterSpriteMeta,
  stage: AppearanceStage,
  ageYears: number,
  context?: AppearanceContext,
  resolvedPrev?: ResolvedGeneticTraits
): SimilarityMatchResult {
  let matchedCriteria = 0;
  const prevHair = resolvedPrev?.hairColor ?? prevEntry.hairColor;
  const prevEyeColor = resolvedPrev?.eyeColor ?? prevEntry.eyeColor;

  // 1. สีผม (Hair color)
  const hairScore = getHairContinuityScore(prevHair, candidate, stage);
  if (prevHair === candidate.hairColor || hairScore >= 10) {
    matchedCriteria++;
  }

  // 2. สีตา (Eye color)
  const eyeColorScore = getEyeColorContinuityScore(prevEyeColor, candidate);
  if (
    prevEyeColor &&
    candidate.eyeColor &&
    prevEyeColor !== 'closed' &&
    prevEyeColor !== 'hidden' &&
    candidate.eyeColor !== 'closed' &&
    candidate.eyeColor !== 'hidden' &&
    (prevEyeColor === candidate.eyeColor ||
      (LIGHT_EYES_SET.has(prevEyeColor) && LIGHT_EYES_SET.has(candidate.eyeColor)))
  ) {
    matchedCriteria++;
  }

  // 3. สีผิว (Skin tone)
  const skinDiff = Math.abs(candidate.skinTone - prevEntry.skinTone);
  const skinScore = (5 - skinDiff) * 16;
  if (skinDiff <= 1) {
    matchedCriteria++;
  }

  // 4. รูปทรงตา (Eye shape)
  const eyeShapeScore = getEyeShapeContinuityScore(prevEntry, candidate);
  if (
    prevEntry.eyeShape &&
    candidate.eyeShape &&
    prevEntry.eyeShape !== 'closed' &&
    prevEntry.eyeShape !== 'hidden' &&
    prevEntry.eyeShape === candidate.eyeShape
  ) {
    matchedCriteria++;
  }

  // 5. ไทป์หน้าตา (Face / visual look type overlap)
  const candTagSet = new Set(candidate.tags);
  let faceOverlapCount = 0;
  let otherOverlapCount = 0;
  for (const tag of prevEntry.tags) {
    if (!candTagSet.has(tag)) continue;
    if (FACE_TYPE_TAGS.has(tag)) {
      faceOverlapCount++;
    } else if (!IGNORED_OTHER_TAGS.has(tag)) {
      otherOverlapCount++;
    }
  }
  if (faceOverlapCount > 0) {
    matchedCriteria++;
  }

  // 6. ไทป์อื่นๆ (Other trait / occupation / region / style overlap)
  if (otherOverlapCount > 0) {
    matchedCriteria++;
  }

  const faceScore = Math.min(20, faceOverlapCount * 7);
  const otherScore = Math.min(16, otherOverlapCount * 6);
  const lukKreungBonus =
    prevEntry.tags.includes('luk_kreung') && candTagSet.has('luk_kreung') ? 10 : 0;

  let revealVisibilityBonus = 0;
  if (resolvedPrev?.revealedNewEye && hasKnownEyeColor(candidate.eyeColor)) {
    revealVisibilityBonus += 8;
  }
  if (resolvedPrev?.revealedNewHair && !candTagSet.has('bald')) {
    revealVisibilityBonus += 8;
  }

  let lookBonus = 0;
  if (stage === 'adult') {
    if (ageYears <= 19 && candidate.lookAge === 'teen') lookBonus = 6;
    else if (ageYears >= 40 && candidate.lookAge === 'mature') lookBonus = 6;
    else if (ageYears >= 20 && ageYears <= 39 && candidate.lookAge === 'adult') lookBonus = 4;
  }

  const contextScore = Math.round(
    getContextAlignmentScore(candidate, ageYears, context) * 0.65
  );

  const score =
    skinScore +
    hairScore +
    eyeShapeScore +
    eyeColorScore +
    faceScore +
    otherScore +
    lukKreungBonus +
    revealVisibilityBonus +
    lookBonus +
    contextScore;

  return { matchedCriteria, score };
}

export function pickAppearanceFromEntries(
  entries: readonly CharacterSpriteMeta[],
  seed: number,
  gender: Gender,
  ageYears: number,
  previous?: PreviousAppearanceRef,
  context?: AppearanceContext
): string {
  if (entries.length === 0) return '';

  const stage = getAppearanceStage(ageYears);
  const prevObj = typeof previous === 'object' && previous !== null ? previous : undefined;
  const prevId = typeof previous === 'string' ? previous : prevObj?.charId;
  const prevEntry = prevId
    ? entries === ALL_ENTRIES
      ? ENTRY_BY_ID.get(prevId)
      : entries.find((e) => e.id === prevId)
    : undefined;

  // ถ้าเริ่มชีวิตช่วง 45-59 โดยไม่มีร่างก่อนหน้า อนุญาต mature_gray ได้
  const allowMatureGray = !prevEntry && ageYears >= 45 && stage === 'adult';
  const pool = getEligibleAppearancePoolFromEntries(entries, gender, ageYears, {
    allowDyed: false,
    allowMatureGray,
  });
  if (pool.length === 0) return '';

  const rngState = createAppearanceRngState(seed, stage, ageYears);

  if (prevEntry) {
    const resolvedPrev = resolvePrevGeneticTraits(prevEntry, prevObj, seed, gender, ageYears);
    const filteredPool = filterPoolWithNaturalHairContinuity(
      pool,
      prevEntry,
      resolvedPrev,
      stage,
      ageYears
    );

    const evaluated = filteredPool.map((candidate) => {
      const sim = evaluateAppearanceSimilarity(
        prevEntry,
        candidate,
        stage,
        ageYears,
        context,
        resolvedPrev
      );
      return { candidate, ...sim };
    });

    // เกณฑ์ความใกล้เคียง 2+ ข้อขึ้นไป (สีผม, สีตา, สีผิว, ไทป์หน้าตา, รูปทรงตา, ไทป์อื่นๆ)
    const qualified = evaluated.filter((item) => item.matchedCriteria >= 2);
    const activePool = qualified.length > 0 ? qualified : evaluated;

    activePool.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.matchedCriteria !== a.matchedCriteria) return b.matchedCriteria - a.matchedCriteria;
      return a.candidate.id.localeCompare(b.candidate.id);
    });

    const bestScore = activePool[0].score;
    const closeTop = activePool
      .filter((item) => item.score >= bestScore - 16)
      .slice(0, 6)
      .map((item) => item.candidate);

    return pickOne(rngState, closeTop).value.id;
  }

  if (context) {
    const scored = pool.map((candidate) => ({
      candidate,
      score:
        getContextAlignmentScore(candidate, ageYears, context) +
        (stage === 'adult' ? getAdultLookWeight(candidate.lookAge, ageYears) : 0),
    }));
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.id.localeCompare(b.candidate.id);
    });
    const bestScore = scored[0].score;
    const closePool = scored
      .filter((item) => item.score >= bestScore - 10)
      .slice(0, 8)
      .map((item) => item.candidate);
    return pickOne(rngState, closePool).value.id;
  }

  if (stage === 'adult' && (ageYears <= 19 || ageYears >= 45)) {
    const weighted = pool.map((entry) => ({
      entry,
      weight: getAdultLookWeight(entry.lookAge, ageYears),
    }));
    return weightedPick(rngState, weighted).value.entry.id;
  }

  return pickOne(rngState, pool).value.id;
}

export function pickAppearance(
  seed: number,
  gender: Gender,
  ageYears: number,
  previous?: PreviousAppearanceRef,
  context?: AppearanceContext
): string {
  return pickAppearanceFromEntries(ALL_ENTRIES, seed, gender, ageYears, previous, context);
}

export function buildCharacterAppearance(
  seed: number,
  gender: Gender,
  ageYears: number,
  previous?: PreviousAppearanceRef,
  overrideCharId?: string,
  context?: AppearanceContext
): CharacterAppearance | undefined {
  const stage = getAppearanceStage(ageYears);
  const prevObj = typeof previous === 'object' && previous !== null ? previous : undefined;
  const prevEntry = prevObj?.charId ? ENTRY_BY_ID.get(prevObj.charId) : undefined;

  let charId: string;
  if (
    overrideCharId &&
    isAppearanceValidForAge(overrideCharId, ageYears, ALL_ENTRIES, {
      allowDyed: true,
      allowMatureGray: true,
    })
  ) {
    charId = overrideCharId;
  } else {
    charId = pickAppearance(seed, gender, ageYears, previous, context);
  }
  if (!charId) return undefined;

  const pickedEntry = ENTRY_BY_ID.get(charId);

  if (ageYears < 2) {
    const geneticEyeColor =
      pickedEntry?.eyeColor && hasKnownEyeColor(pickedEntry.eyeColor)
        ? pickedEntry.eyeColor
        : prevObj?.geneticEyeColor;
    const geneticHairColor =
      pickedEntry &&
      !pickedEntry.tags.includes('bald') &&
      !GRAY_WHITE_HAIR_COLORS.has(pickedEntry.hairColor) &&
      !FANCY_HAIR_COLORS.has(pickedEntry.hairColor)
        ? pickedEntry.hairColor
        : prevObj?.geneticHairColor;

    return {
      charId,
      stage,
      ...(geneticEyeColor ? { geneticEyeColor } : {}),
      ...(geneticHairColor ? { geneticHairColor } : {}),
      revealedAtAge2: false,
    };
  }

  // อายุ >= 2: เปิดเผยและล็อกสีตา/สีผมหลัก (หากทารกเดิมหลับตาหรือยังหัวล้าน)
  const geneticEyeColor: GeneticEyeColor =
    prevObj?.geneticEyeColor ??
    (pickedEntry && hasKnownEyeColor(pickedEntry.eyeColor)
      ? pickedEntry.eyeColor
      : revealGeneticEyeColor(seed, pickedEntry ?? prevEntry, gender));

  const pickedNaturalHair =
    pickedEntry &&
    !pickedEntry.tags.includes('bald') &&
    !GRAY_WHITE_HAIR_COLORS.has(pickedEntry.hairColor) &&
    !FANCY_HAIR_COLORS.has(pickedEntry.hairColor)
      ? pickedEntry.hairColor
      : undefined;

  const prevNaturalHair =
    prevEntry &&
    !prevEntry.tags.includes('bald') &&
    !GRAY_WHITE_HAIR_COLORS.has(prevEntry.hairColor) &&
    !FANCY_HAIR_COLORS.has(prevEntry.hairColor)
      ? prevEntry.hairColor
      : undefined;

  const geneticHairColor: string =
    prevObj?.geneticHairColor ??
    pickedNaturalHair ??
    prevNaturalHair ??
    revealGeneticHairColor(seed, pickedEntry ?? prevEntry, gender);

  return {
    charId,
    stage,
    geneticEyeColor,
    geneticHairColor,
    revealedAtAge2: true,
  };
}

export interface AppearanceTraitsSummary {
  skinLabel: string;
  skinHex: string;
  eyeColorLabel: string;
  eyeShapeLabel: string;
  hairColorLabel: string;
  hairHex: string;
  styleTags: string[];
  allTags: string[];
  categorizedTags: Record<AppearanceTagCategory, string[]>;
  isSwaddled: boolean;
  isEyePendingReveal: boolean;
  isHairPendingReveal: boolean;
  ageStageLabel: string;
}

function resolveSkinToneLabel(skinTone: number, skinHex: string): string {
  const clean = skinHex.replace('#', '');
  const parsed = Number.parseInt(clean, 16);
  const validHex = clean.length === 6 && Number.isFinite(parsed);
  const r = validHex ? (parsed >> 16) & 255 : 240;
  const g = validHex ? (parsed >> 8) & 255 : 210;
  const b = validHex ? parsed & 255 : 190;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  switch (skinTone) {
    case 1:
      if (validHex && g - b <= 6 && r - g >= 18) {
        return 'ขาวอมชมพู';
      }
      return 'ขาวเหลือง';
    case 2:
      return validHex && lum >= 204 ? 'ขาวเหลืองนวล' : 'สองสี';
    case 3:
      return 'น้ำผึ้ง';
    case 4:
      return 'แทน';
    case 5:
      return 'เข้ม';
    default:
      return 'น้ำผึ้ง';
  }
}

const EYE_COLOR_LABELS: Record<ManifestEyeColor, string> = {
  dark: 'น้ำตาลเข้ม',
  blue: 'ฟ้า',
  green: 'เขียว',
  gray: 'เทา',
  amber: 'อำพัน',
  purple: 'ม่วง',
  closed: 'หลับตาพริ้ม',
  hidden: 'ซ่อนใต้แว่น/หมวก',
};

const EYE_SHAPE_LABELS: Record<ManifestEyeShape, string> = {
  narrow: 'ตาเรียว',
  balanced: 'ตาคมพอดี',
  round: 'ตากลมโต',
  closed: 'หลับตา',
  hidden: 'ซ่อนรูปตา',
};

const HAIR_COLOR_LABELS: Record<string, string> = {
  black: 'ดำ',
  'dark brown': 'น้ำตาลเข้ม',
  brown: 'น้ำตาล',
  'light brown': 'น้ำตาลอ่อน',
  blonde: 'บลอนด์ทอง',
  'red/orange': 'แดงส้ม',
  gray: 'เทาเงิน',
  white: 'ขาว',
  pink: 'ชมพู (ย้อม)',
  blue: 'ฟ้า (ย้อม)',
  purple: 'ม่วง (ย้อม)',
  'teal/green': 'เขียวอมฟ้า (ย้อม)',
  multicolor: 'หลากสี (ย้อม)',
};

const HAIR_HEX_BY_COLOR: Record<string, string> = {
  black: '#242028',
  'dark brown': '#3D2B22',
  brown: '#6D4732',
  'light brown': '#9C714E',
  blonde: '#E4C36E',
  'red/orange': '#C95F36',
  gray: '#B6B9C5',
  white: '#ECEAF2',
};

const T = (
  label: string,
  category: AppearanceTagCategory,
  priority = 50
): AppearanceTagMeta => ({ label, category, priority });

/**
 * แผนผังแท็กครบทุกแท็กใน characterManifest.json แบ่งเป็น 5 หมวดชัดเจน
 */
export const APPEARANCE_TAG_META: Record<string, AppearanceTagMeta> = {
  // 1) look: หน้าตาและอารมณ์
  innocent_look: T('หน้าตาดูใสซื่อ', 'look', 72),
  gentle_look: T('หน้าตาดูอ่อนโยน', 'look', 72),
  cheerful: T('ร่าเริงสดใส', 'look', 74),
  quiet: T('เงียบขรึม', 'look', 70),
  shy_look: T('ดูขี้อาย', 'look', 76),
  serious_look: T('หน้าตาจริงจังขรึม', 'look', 75),
  cunning_look: T('หน้าตาดูเจ้าเล่ห์', 'look', 76),
  flirty_look: T('หน้าตาดูเจ้าชู้', 'look', 76),
  villain_look: T('หน้าตาดุ/มาดเข้ม', 'look', 76),
  haughty: T('มาดเนี้ยบ/ดูหยิ่ง', 'look', 76),
  mysterious_look: T('ดูลึกลับน่าค้นหา', 'look', 74),
  charismatic_look: T('ดูภูมิฐานน่าเชื่อถือ', 'look', 75),
  energetic_look: T('ดูคล่องแคล่วกระฉับกระเฉง', 'look', 71),
  crying: T('น้ำตาคลอ', 'look', 80),
  laughing: T('หัวเราะร่า', 'look', 78),
  sharp_eyes: T('ตาเฉี่ยว', 'look', 75),
  monolid_eyes: T('ตาตี่', 'look', 74),
  sleepy_eyes: T('ตาง่วง', 'look', 75),
  dazed_messy: T('ลุคมึนๆ เซอร์ๆ', 'look', 74),
  meek: T('หน่อมแน้ม/ใสซื่อ', 'look', 73),

  // 2) type: ไทป์และบุคลิก
  cute: T('น่ารัก', 'type', 68),
  pretty: T('สวยเด่น', 'type', 70),
  handsome: T('หล่อคม', 'type', 70),
  pretty_boy: T('หนุ่มหน้าสวย', 'type', 80),
  tomboy_handsome: T('สาวเท่ สาวหล่อ', 'type', 80),
  sweet_girl: T('สายหวาน', 'type', 78),
  western_vibe: T('สายฝอ', 'type', 79),
  hip: T('ฮิปสเตอร์/เด็กแนว', 'type', 77),
  androgynous: T('ลุคอันโดรจีนัส', 'type', 78),
  bad_boy: T('แบดบอย', 'type', 78),
  nerdy: T('สายเนิร์ด', 'type', 76),
  gamer: T('สายเกม', 'type', 77),
  artistic: T('สายอาร์ต', 'type', 74),
  sporty: T('สายกีฬา', 'type', 74),
  rebellious: T('สายลุย/กบฏนิดๆ', 'type', 72),
  strict: T('เจ้าระเบียบ', 'type', 73),
  kind: T('ดูใจดีเป็นมิตร', 'type', 69),
  khun_nu: T('ลุคคุณหนู', 'type', 80),
  khun_nai: T('ลุคคุณนาย', 'type', 80),
  sia: T('มาดเสี่ย', 'type', 82),
  jae: T('มาดเจ๊', 'type', 81),
  sor: T('มาดซ้อ', 'type', 81),
  sugar_daddy: T('มาดป๋า', 'type', 81),
  sugar_mommy: T('มาดมัมหมี', 'type', 81),
  uncle: T('มาดลุงใจดี', 'type', 74),
  aunt: T('มาดป้าใจดี', 'type', 74),
  tomboy: T('ลุคทอมบอย/เท่', 'type', 78),
  femme_fatale: T('สาวพราวเสน่ห์', 'type', 82),
  otaku: T('สายโอตาคุ', 'type', 78),
  princess: T('มาดเจ้าหญิง', 'type', 75),

  // 3) fashion: แฟชั่นและการแต่งตัว
  swaddled: T('ทารกในห่อผ้า', 'fashion', 98),
  toddler: T('วัยเตาะแตะ', 'fashion', 90),
  costume: T('ชุดแฟนซี/คอสตูม', 'fashion', 65),
  bear_costume: T('ชุดมาสคอตหมี', 'fashion', 72),
  hill_tribe_costume: T('ชุดชนเผ่าพื้นเมือง', 'fashion', 76),
  student_uniform: T('ชุดนักเรียน', 'fashion', 84),
  school_uniform: T('ชุดนักเรียน', 'fashion', 84),
  vocational_uniform: T('ชุดช็อปอาชีวะ', 'fashion', 85),
  scout_uniform: T('ชุดลูกเสือ/เนตรนารี', 'fashion', 85),
  uniform: T('ชุดเครื่องแบบ', 'fashion', 70),
  school_shirt: T('เสื้อนักเรียน', 'fashion', 62),
  pe_polo: T('เสื้อพละ', 'fashion', 68),
  office: T('ชุดทำงานออฟฟิศ', 'fashion', 78),
  suit: T('ชุดสูท', 'fashion', 77),
  blazer: T('เสื้อเบลเซอร์', 'fashion', 70),
  formal: T('ชุดทางการ', 'fashion', 72),
  tuxedo: T('ชุดทักซิโด', 'fashion', 79),
  smart_casual: T('สมาร์ทแคชชวล', 'fashion', 71),
  casual: T('ชุดลำลองสบายๆ', 'fashion', 40),
  casual_shirt: T('เสื้อเชิ้ตลำลอง', 'fashion', 54),
  casual_jacket: T('แจ็กเก็ตลำลอง', 'fashion', 56),
  flannel: T('เสื้อลายสก๊อต', 'fashion', 62),
  plaid: T('ลายตาราง/สก๊อต', 'fashion', 55),
  turtleneck: T('เสื้อคอเต่า', 'fashion', 66),
  sweater_vest: T('เสื้อกั๊กไหมพรม', 'fashion', 66),
  sweater: T('สเวตเตอร์', 'fashion', 58),
  striped_sweater: T('สเวตเตอร์ลายทาง', 'fashion', 60),
  streetwear: T('สตรีทแวร์', 'fashion', 74),
  hoodie: T('เสื้อฮู้ด', 'fashion', 64),
  hood: T('สวมฮู้ดคลุมหัว', 'fashion', 62),
  crop_top: T('เสื้อครอป', 'fashion', 66),
  overalls: T('ชุดเอี๊ยม', 'fashion', 67),
  trench: T('โค้ทยาว/เทรนช์โค้ท', 'fashion', 72),
  long_coat: T('เสื้อโค้ทยาว', 'fashion', 71),
  bomber: T('บอมเบอร์แจ็กเก็ต', 'fashion', 68),
  leather_jacket: T('แจ็กเก็ตหนัง', 'fashion', 73),
  jacket: T('เสื้อแจ็กเก็ต', 'fashion', 58),
  varsity: T('แจ็กเก็ตเบสบอล', 'fashion', 69),
  track_jacket: T('เสื้อวอร์มกีฬา', 'fashion', 65),
  baseball_jersey: T('เสื้อเบสบอล', 'fashion', 66),
  jersey_7: T('เสื้อกีฬาลายเลข 7', 'fashion', 64),
  lolita: T('แฟชั่นโลลิต้า', 'fashion', 82),
  goth: T('สายโกธิค', 'fashion', 80),
  gothic_lolita: T('โกธิคโลลิต้า', 'fashion', 84),
  punk: T('สไตล์พังก์', 'fashion', 80),
  pastel: T('โทนพาสเทล', 'fashion', 64),
  harajuku: T('สตรีทฮาราจูกุ', 'fashion', 79),
  preppy: T('ลุคเด็กเรียน/เพร็พพี', 'fashion', 72),
  luxury: T('แต่งตัวหรูหรา', 'fashion', 79),
  humble: T('เรียบง่ายติดดิน', 'fashion', 68),
  middle_class: T('แต่งตัวเรียบร้อยทั่วไป', 'fashion', 42),
  sundress: T('เดรสสบายๆ', 'fashion', 65),
  boho: T('สไตล์โบฮีเมียน', 'fashion', 74),
  bohemian: T('สไตล์โบฮีเมียน', 'fashion', 75),
  gyaru: T('แฟชั่นสาวแกล', 'fashion', 82),
  cafe_cozy: T('คาเฟ่ (ลุคโคซี่)', 'fashion', 74),
  casual_chill: T('สบายๆ เรียบง่าย', 'fashion', 65),
  gothic: T('สายโกธิค', 'fashion', 80),
  japanese_style: T('สไตล์ญี่ปุ่น', 'fashion', 78),
  korean_style: T('สไตล์เกาหลี', 'fashion', 78),
  tweed: T('ชุดผ้าทวีดหรู', 'fashion', 76),
  thai_traditional: T('ผ้าไทยพื้นถิ่น', 'fashion', 82),
  thai_formal: T('ชุดไทยพิธีการ', 'fashion', 84),
  thai_outfit: T('ชุดไทยประยุกต์', 'fashion', 78),
  thai_pants: T('กางเกงลายไทย', 'fashion', 68),
  thai_striped_shirt: T('เสื้อลายไทย', 'fashion', 68),
  batik_shirt: T('เสื้อปาเต๊ะ/บาติก', 'fashion', 78),
  hawaiian_shirt: T('เสื้อฮาวาย', 'fashion', 70),
  cheongsam: T('ชุดกี่เพ้า', 'fashion', 82),
  red_cheongsam: T('กี่เพ้าสีแดง', 'fashion', 83),
  kimono: T('ชุดกิโมโน', 'fashion', 82),
  pajamas: T('ชุดนอน', 'fashion', 68),
  disheveled: T('แต่งตัวไม่เรียบร้อย/ยุ่งเหยิง', 'fashion', 77),
  shirtless: T('ถอดเสื้อโชว์กล้าม', 'fashion', 78),
  flashy: T('แต่งตัวฉูดฉาดเด่นสะดุดตา', 'fashion', 75),
  sarong: T('นุ่งโสร่ง/ผ้าถุง', 'fashion', 76),
  pakama: T('ผ้าขาวม้า', 'fashion', 75),
  white_robes: T('ชุดขาวปฏิบัติธรรม', 'fashion', 80),
  flight_suit: T('ชุดนักบิน/อวกาศ', 'fashion', 80),
  boho_dress: T('เดรสโบฮีเมียน', 'fashion', 65),
  bow_dress: T('เดรสประดับโบว์', 'fashion', 64),
  dress: T('ชุดเดรส', 'fashion', 55),
  floral_dress: T('เดรสลายดอก', 'fashion', 64),
  polka_dress: T('เดรสลายจุด', 'fashion', 64),
  pink_dress: T('เดรสสีชมพู', 'fashion', 60),
  purple_dress: T('เดรสสีม่วง', 'fashion', 60),
  star_dress: T('เดรสลายดาว', 'fashion', 62),
  pink_outfit: T('ชุดโทนชมพู', 'fashion', 56),
  lace_blouse: T('เสื้อลูกไม้', 'fashion', 66),
  lace_dress: T('เดรสลูกไม้', 'fashion', 67),
  gingham: T('ลายตารางกิงแฮม', 'fashion', 60),
  stripes: T('เสื้อลายทาง', 'fashion', 50),
  polo: T('เสื้อโปโล', 'fashion', 56),
  blue_shirt: T('เสื้อสีฟ้า', 'fashion', 45),
  red_shirt: T('เสื้อสีแดง', 'fashion', 48),
  white_shirt: T('เสื้อเชิ้ตขาว', 'fashion', 46),
  tee: T('เสื้อยืด', 'fashion', 42),
  tank: T('เสื้อกล้าม', 'fashion', 55),
  tank_top: T('เสื้อกล้าม', 'fashion', 55),
  dragon_tank: T('เสื้อกล้ามลายมังกร', 'fashion', 68),
  cat_tee: T('เสื้อยืดลายแมว', 'fashion', 60),
  gameboy_tee: T('เสื้อยืดลายเกม', 'fashion', 64),
  pad_thai_tee: T('เสื้อยืดลายผัดไทย', 'fashion', 66),
  pineapple_tee: T('เสื้อยืดลายสับปะรด', 'fashion', 62),
  robot_tee: T('เสื้อยืดลายหุ่นยนต์', 'fashion', 62),
  skateboard_tee: T('เสื้อยืดลายสเก็ต', 'fashion', 64),
  star_tee: T('เสื้อยืดลายดาว', 'fashion', 58),
  thai_text_tee: T('เสื้อยืดสกรีนอักษรไทย', 'fashion', 66),
  shorts: T('กางเกงขาสั้น', 'fashion', 44),

  // 4) style: สไตล์และบทบาทที่เห็น
  nurse: T('ลุคพยาบาล', 'style', 92),
  police: T('ลุคตำรวจ', 'style', 92),
  police_tactical: T('ลุคตำรวจสายปราบปราม', 'style', 93),
  teacher: T('ลุคครู/อาจารย์', 'style', 90),
  lawyer: T('ลุคทนาย/นักกฎหมาย', 'style', 91),
  chef: T('ลุคเชฟ/พ่อครัว', 'style', 91),
  mechanic: T('ลุคช่างซ่อม', 'style', 90),
  musician: T('ลุคนักดนตรี', 'style', 89),
  artist: T('ลุคศิลปิน', 'style', 87),
  painter: T('ลุคจิตรกร', 'style', 88),
  athlete: T('ลุคนักกีฬา', 'style', 87),
  boxer: T('ลุคนักมวย', 'style', 90),
  muay_thai: T('ลุคนักมวยไทย', 'style', 92),
  businessman: T('ลุคนักธุรกิจ', 'style', 88),
  businesswoman: T('ลุคผู้บริหารหญิง', 'style', 88),
  executive: T('ลุคผู้บริหาร', 'style', 89),
  wealthy_boss: T('ลุคเถ้าแก่/บอสใหญ่', 'style', 90),
  boss: T('ลุคเจ้านาย', 'style', 86),
  civil_servant: T('ลุคข้าราชการ', 'style', 90),
  retired_official: T('ลุคข้าราชการเกษียณ', 'style', 89),
  retired_executive: T('ลุคผู้ใหญ่ใจดีมีบารมี', 'style', 88),
  freelancer: T('ลุคฟรีแลนซ์', 'style', 84),
  clerk: T('ลุคพนักงานธุรการ/แคชเชียร์', 'style', 85),
  streamer: T('ลุคสตรีมเมอร์', 'style', 88),
  entertainer: T('ลุคสายเอนเตอร์เทน', 'style', 86),
  singer: T('ลุคนักร้อง', 'style', 88),
  actress: T('ลุคดารานักแสดง', 'style', 89),
  showgirl: T('ลุคสายโชว์/เอนเตอร์เทน', 'style', 89),
  noodle_vendor: T('ลุคพ่อค้าก๋วยเตี๋ยว', 'style', 91),
  market_vendor: T('ลุคแม่ค้าตลาดสด', 'style', 91),
  papaya_salad_vendor: T('ลุคพ่อค้าส้มตำ', 'style', 91),
  motorbike_taxi: T('ลุควินมอเตอร์ไซค์', 'style', 92),
  farmer: T('ลุคเกษตรกร', 'style', 90),
  gardener: T('ลุคคนรักต้นไม้/ทำสวน', 'style', 87),
  spirit_medium: T('ลุคสายมู/ร่างทรง', 'style', 90),
  fortune_teller: T('ลุคหมอดู', 'style', 90),
  loan_shark: T('ลุคเสี่ยปล่อยกู้', 'style', 90),
  gambler: T('ลุคนักเสี่ยงโชค', 'style', 88),
  biker: T('ลุคสายบิ๊กไบค์', 'style', 87),
  skater: T('ลุคสายสเก็ต', 'style', 87),
  tourist: T('ลุคนักท่องเที่ยว', 'style', 86),
  astronomer: T('ลุคนักดูดาว', 'style', 88),
  amulet_collector: T('ลุคเซียนพระ', 'style', 89),
  temple_helper: T('ลุคเด็กวัด/สายบุญ', 'style', 88),
  nun: T('ลุคสายปฏิบัติธรรม', 'style', 90),
  merit: T('ลุคสายทำบุญ', 'style', 85),
  street_working: T('สู้ชีวิต/ทำงานหนัก', 'style', 76),
  central_bkk: T('สไตล์เมืองกรุง', 'style', 62),
  isaan_vibe: T('กลิ่นอายอีสาน', 'style', 82),
  north_vibe: T('กลิ่นอายเหนือ', 'style', 82),
  south_vibe: T('กลิ่นอายใต้', 'style', 82),
  chinese_thai: T('ไทยเชื้อสายจีน', 'style', 81),
  modern: T('สไตล์โมเดิร์น', 'style', 60),

  // 5) trait: เอกลักษณ์และไอเท็ม
  luk_kreung: T('ลูกครึ่ง', 'trait', 94),
  chubby: T('แก้มป่อง/ท้วม', 'trait', 72),
  muscular: T('หุ่นล่ำ/แข็งแรง', 'trait', 76),
  glasses: T('ใส่แว่น', 'trait', 74),
  round_glasses: T('ใส่แว่นตากลม', 'trait', 75),
  sunglasses: T('ใส่แว่นกันแดด', 'trait', 78),
  headphones: T('ใส่หูฟัง', 'trait', 74),
  hat: T('สวมหมวก', 'trait', 68),
  cap: T('สวมหมวกแก๊ป', 'trait', 70),
  straw_hat: T('สวมหมวกฟาง', 'trait', 74),
  beanie: T('สวมหมวกไหมพรม', 'trait', 71),
  cat_beanie: T('หมวกไหมพรมหูแมว', 'trait', 76),
  helmet: T('สวมหมวกกันน็อก', 'trait', 77),
  headband: T('คาดผม', 'trait', 60),
  thai_headband: T('ผ้าคาดหัวแบบไทย', 'trait', 72),
  headscarf: T('ผ้าคลุมศีรษะ', 'trait', 72),
  handbag: T('ถือกระเป๋าถือ', 'trait', 64),
  backpack: T('สะพายเป้', 'trait', 65),
  scarf: T('พันผ้าพันคอ', 'trait', 66),
  tie: T('ผูกเนกไท', 'trait', 62),
  apron: T('สวมผ้ากันเปื้อน', 'trait', 73),
  vest: T('สวมเสื้อกั๊ก', 'trait', 66),
  gold_chain: T('สวมสร้อยทองเส้นใหญ่', 'trait', 79),
  amulet_necklace: T('แขวนสร้อยพระ', 'trait', 76),
  tattoo: T('มีรอยสัก', 'trait', 80),
  piercing: T('เจาะร่างกาย/เจาะหู', 'trait', 78),
  eyebrow_slit: T('คิ้วบาก', 'trait', 79),
  beard: T('ไว้หนวดเครา', 'trait', 75),
  mustache: T('ไว้หนวด', 'trait', 73),
  wounds: T('มีรอยแผล/พลาสเตอร์', 'trait', 79),
  muddy: T('เปื้อนดิน/ลุยงาน', 'trait', 74),
  beauty_mark: T('มีไฝเสน่ห์', 'trait', 74),
  betel_chewing: T('เคี้ยวหมาก', 'trait', 76),
  long_hair: T('ผมยาว', 'trait', 52),
  long_white_hair: T('ผมขาวยาว', 'trait', 62),
  white_hair: T('ผมขาว', 'trait', 58),
  ponytail: T('มัดผมหางม้า', 'trait', 60),
  braid: T('ถักเปีย', 'trait', 64),
  braids: T('ถักผมเปีย', 'trait', 64),
  twintails: T('มัดแกละสองข้าง', 'trait', 67),
  pigtails: T('มัดแกละน่ารัก', 'trait', 67),
  bun: T('มวยผม', 'trait', 61),
  buns: T('มวยผมซาลาเปา', 'trait', 66),
  topknot: T('มวยจุกบนหัว', 'trait', 68),
  updo: T('เกล้าผมขึ้น', 'trait', 64),
  bob: T('ผมบ๊อบสั้น', 'trait', 62),
  curly: T('ผมหยักศก/ดัดลอน', 'trait', 63),
  curly_hair: T('ผมหยิก/ดัดลอน', 'trait', 63),
  afro_puffs: T('ทรงแอฟโฟรพองคู่', 'trait', 74),
  cornrows: T('ถักเปียคอร์นโรล', 'trait', 75),
  bald: T('ไม่มีผม/ศีรษะเกลี้ยง', 'trait', 83),
  blue_eyes: T('ตาสีฟ้า', 'trait', 82),
  green_eyes: T('ตาสีเขียว', 'trait', 82),
  flower_crown: T('สวมมงกุฎดอกไม้', 'trait', 73),
  tiara: T('สวมมงกุฎ/เทียร่า', 'trait', 75),
  garland: T('คล้องพวงมาลัย', 'trait', 76),
  dyed_hair: T('ผมย้อมสีแฟชั่น', 'trait', 86),
  mature_gray: T('ผมแซมดอกเลา', 'trait', 68),
  natural_blonde: T('ผมบลอนด์ธรรมชาติ', 'trait', 69),
  natural_red: T('ผมสีส้มแดงธรรมชาติ', 'trait', 70),
  red_hair: T('ผมโทนแดง', 'trait', 66),
  blonde: T('ผมโทนบลอนด์', 'trait', 64),
  blue_gray_hair: T('ผมสีเทาอมฟ้า', 'trait', 70),
  cane: T('ถือไม้เท้า', 'trait', 72),
  guitar: T('ถือกีตาร์', 'trait', 76),
  coffee: T('ถือแก้วกาแฟ', 'trait', 62),
  iced_coffee: T('ถือกาแฟเย็น', 'trait', 64),
  bubble_tea: T('ถือชานมไข่มุก', 'trait', 68),
  mug: T('ถือแก้วมัค', 'trait', 60),
  juice: T('ถือน้ำผลไม้', 'trait', 60),
  fan: T('ถือพัด', 'trait', 64),
  floral_fan: T('ถือพัดลายดอกไม้', 'trait', 66),
  newspaper: T('ถือหนังสือพิมพ์', 'trait', 66),
  phone: T('ถือมือถือ', 'trait', 62),
  old_phone: T('ถือโทรศัพท์ปุ่มกด', 'trait', 68),
  telescope: T('มีกล้องดูดาว', 'trait', 74),
  magnifier: T('ถือแว่นขยาย', 'trait', 72),
  alms_bowl: T('ถือบาตร', 'trait', 78),
  prayer_beads: T('ถือลูกประคำ', 'trait', 76),
  pipe: T('คาบไปป์', 'trait', 75),
  inhaler: T('พกยาดม', 'trait', 74),
  herbal_oil: T('พกยาหม่อง/น้ำมันสมุนไพร', 'trait', 74),
  khaen: T('เป่าแคนอีสาน', 'trait', 80),
  cat: T('อุ้มน้องแมว', 'trait', 78),
  elephant: T('ตุ๊กตาช้าง', 'trait', 74),
  polar_bear: T('ตุ๊กตาหมีขาว', 'trait', 72),
  teddy: T('กอดตุ๊กตาหมี', 'trait', 72),
  doll: T('กอดตุ๊กตา', 'trait', 70),
  toy_plane: T('ถือเครื่องบินของเล่น', 'trait', 72),
  tricycle: T('ขี่สามล้อเด็ก', 'trait', 74),
  takraw: T('ถือลูกตะกร้อ', 'trait', 75),
  basket: T('ถือตะกร้า', 'trait', 62),
  vegetable_basket: T('ถือตะกร้าผัก', 'trait', 72),
  lunchbox: T('ถือปิ่นโต/กล่องข้าว', 'trait', 70),
  brooch: T('ติดเข็มกลัดหรู', 'trait', 65),
  sash: T('คาดสายสะพาย', 'trait', 72),
  sitting: T('ท่านั่งพักผ่อน', 'trait', 45),
  wicker_chair: T('นั่งเก้าอี้หวาย', 'trait', 66),
  hair_clips: T('ติดกิ๊บผม', 'trait', 58),
  bow: T('ติดโบว์', 'trait', 60),
};

export function getAppearanceTagMeta(tag: string): AppearanceTagMeta | undefined {
  return APPEARANCE_TAG_META[tag];
}

const LOOK_AGE_LABELS: Record<ManifestLookAge, string> = {
  baby: 'ทารก-เตาะแตะ',
  child: 'เด็ก',
  teen: 'วัยรุ่น',
  adult: 'วัยผู้ใหญ่',
  mature: 'ผู้ใหญ่ตอนกลาง',
  senior: 'ผู้สูงอายุ',
};

export interface DescribeAppearanceOptions {
  ageYears?: number;
  appearance?: CharacterAppearance;
  flags?: Record<string, boolean>;
}

export function describeAppearanceTraits(
  charId?: string,
  options?: DescribeAppearanceOptions
): AppearanceTraitsSummary | null {
  const entry = getManifestEntry(charId);
  if (!entry) return null;

  const ageYears = options?.ageYears;
  const app = options?.appearance;

  // จัดลำดับแท็กตาม priority แล้วแบ่งหมวดหมู่ครบทุกแท็ก
  const resolvedMetas = entry.tags
    .map((tag) => ({ tag, meta: APPEARANCE_TAG_META[tag] }))
    .filter((item): item is { tag: string; meta: AppearanceTagMeta } => Boolean(item.meta))
    .sort((a, b) => b.meta.priority - a.meta.priority);

  const seenLabels = new Set<string>();
  const allTags: string[] = [];
  const categorizedTags: Record<AppearanceTagCategory, string[]> = {
    look: [],
    type: [],
    fashion: [],
    style: [],
    trait: [],
  };

  for (const { meta } of resolvedMetas) {
    if (seenLabels.has(meta.label)) continue;
    seenLabels.add(meta.label);
    allTags.push(meta.label);
    categorizedTags[meta.category].push(meta.label);
  }

  // เลือก Top 3 แท็กเด่น (พยายามกระจายไม่ให้ซ้ำซ้อน)
  const styleTags = allTags.slice(0, 3);

  const rawEyeColor = entry.eyeColor ?? 'dark';
  const rawEyeShape = entry.eyeShape ?? 'balanced';
  const isBaby01Stage = ageYears !== undefined ? ageYears <= 1 : entry.ageRange?.[1] === 1;

  // ตรวจสอบสถานะการเปิดเผยสีตาเมื่ออายุ 2 ขวบขึ้นไป
  const revealedEye = app?.geneticEyeColor;
  const isEyeClosedOrHidden = rawEyeColor === 'closed' || rawEyeColor === 'hidden';
  let isEyePendingReveal = false;
  let eyeColorLabel: string;
  let eyeShapeLabel: string;

  if (isEyeClosedOrHidden) {
    if (revealedEye && (ageYears === undefined || ageYears >= 2)) {
      eyeColorLabel = EYE_COLOR_LABELS[revealedEye];
      eyeShapeLabel = EYE_SHAPE_LABELS[rawEyeShape];
    } else if (isBaby01Stage) {
      isEyePendingReveal = true;
      eyeColorLabel = 'หลับตา (รอดูตอน 2 ขวบ)';
      eyeShapeLabel = 'ยังหลับตา';
    } else {
      eyeColorLabel = EYE_COLOR_LABELS[rawEyeColor] ?? 'หลับตาพริ้ม';
      eyeShapeLabel = EYE_SHAPE_LABELS[rawEyeShape] ?? 'หลับตา';
    }
  } else {
    eyeColorLabel = EYE_COLOR_LABELS[rawEyeColor] ?? 'น้ำตาลเข้ม';
    eyeShapeLabel = EYE_SHAPE_LABELS[rawEyeShape] ?? 'ตาคมพอดี';
  }

  const isBald = entry.tags.includes('bald');
  const revealedHair = app?.geneticHairColor;
  const activeDyedHair = app?.dyedHairColor;
  const tonedDownFormal = Boolean(options?.flags?.appearance_toned_down_formal);
  let isHairPendingReveal = false;
  let hairColorLabel: string;
  let hairHex = entry.hairHex;

  if (tonedDownFormal && isDyedOrFancyHair(entry)) {
    hairColorLabel = revealedHair
      ? `${HAIR_COLOR_LABELS[revealedHair] ?? revealedHair} (ปรับลุคสุภาพ)`
      : 'สีธรรมชาติ (ปรับลุคสุภาพ)';
    hairHex = (revealedHair && HAIR_HEX_BY_COLOR[revealedHair]) ?? '#3D2B22';
  } else if (activeDyedHair && activeDyedHair !== 'natural') {
    hairColorLabel = HAIR_COLOR_LABELS[activeDyedHair] ?? `${activeDyedHair} (ย้อม)`;
    hairHex = HAIR_HEX_BY_COLOR[activeDyedHair] ?? entry.hairHex;
  } else if (isBald) {
    if (revealedHair && (ageYears === undefined || ageYears >= 2)) {
      hairColorLabel = HAIR_COLOR_LABELS[revealedHair] ?? revealedHair;
      hairHex = HAIR_HEX_BY_COLOR[revealedHair] ?? entry.hairHex;
    } else if (isBaby01Stage) {
      isHairPendingReveal = true;
      hairColorLabel = 'ยังไม่ขึ้น (รอดูตอน 2 ขวบ)';
      hairHex = '#D8C8BC';
    } else {
      hairColorLabel = HAIR_COLOR_LABELS[entry.hairColor] ?? entry.hairColor;
    }
  } else {
    hairColorLabel = HAIR_COLOR_LABELS[entry.hairColor] ?? entry.hairColor;
  }

  return {
    skinLabel: resolveSkinToneLabel(entry.skinTone, entry.skinHex),
    skinHex: entry.skinHex,
    eyeColorLabel,
    eyeShapeLabel,
    hairColorLabel,
    hairHex,
    styleTags,
    allTags,
    categorizedTags,
    isSwaddled: entry.tags.includes('swaddled'),
    isEyePendingReveal,
    isHairPendingReveal,
    ageStageLabel: LOOK_AGE_LABELS[entry.lookAge] ?? 'ทั่วไป',
  };
}

export function getRegionAffinityTags(region?: RegionId): string[] {
  switch (region) {
    case 'northeast':
      return ['isaan_vibe', 'thai_traditional'];
    case 'north':
      return ['north_vibe', 'thai_traditional'];
    case 'south':
      return ['south_vibe'];
    case 'bangkok':
      return ['central_bkk', 'office', 'chinese_thai'];
    case 'central':
      return ['central_bkk', 'thai_traditional', 'middle_class'];
    default:
      return [];
  }
}

export interface GalleryCandidate {
  entry: CharacterSpriteMeta;
  matchesRegion: boolean;
  traits: AppearanceTraitsSummary;
}

export function getGalleryCandidates(
  gender: Gender,
  ageYears: number,
  region?: RegionId,
  options?: { allowDyed?: boolean }
): GalleryCandidate[] {
  const stage = getAppearanceStage(ageYears);
  const allowMatureGray = ageYears >= 45 && stage === 'adult';
  const pool = getEligibleAppearancePool(gender, ageYears, {
    allowDyed: Boolean(options?.allowDyed),
    allowMatureGray,
  });

  const regionTags = getRegionAffinityTags(region);
  const items: GalleryCandidate[] = [];

  for (const entry of pool) {
    const traits = describeAppearanceTraits(entry.id, { ageYears });
    if (!traits) continue;
    const matchesRegion =
      regionTags.length > 0 && regionTags.some((t) => entry.tags.includes(t));
    items.push({ entry, matchesRegion, traits });
  }

  items.sort((a, b) => {
    if (a.matchesRegion !== b.matchesRegion) return a.matchesRegion ? -1 : 1;
    return a.entry.id.localeCompare(b.entry.id);
  });

  return items;
}

export function isAppearanceValidForSelection(
  charId: string,
  gender: Gender,
  ageYears: number
): boolean {
  const pool = getEligibleAppearancePool(gender, ageYears, {
    allowDyed: true,
    allowMatureGray: true,
  });
  return pool.some((e) => e.id === charId);
}

const STRICT_FORMAL_BLOCKED_TAGS = new Set([
  'disheveled',
  'shirtless',
  'rebellious',
  'punk',
  'goth',
  'gothic_lolita',
  'harajuku',
  'flashy',
  'showgirl',
  'dragon_tank',
]);

const MILD_CASUAL_OR_BOLD_TAGS = new Set([
  'bad_boy',
  'tattoo',
  'biker',
  'skater',
  'lolita',
  'costume',
  'bear_costume',
]);

const FORMAL_PROFESSIONAL_TAGS = new Set([
  'office',
  'suit',
  'blazer',
  'formal',
  'tuxedo',
  'smart_casual',
  'civil_servant',
  'executive',
  'businessman',
  'businesswoman',
  'lawyer',
  'teacher',
  'charismatic_look',
  'tie',
]);

export interface AppearanceImpactReport {
  hasLoudDyedHair: boolean;
  hasSubtleDyedHair: boolean;
  hasDyedOrFlashyStyle: boolean;
  hasBoldCasualStyle: boolean;
  hasFormalProfessionalLook: boolean;
  blocksStrictFormalJobs: boolean;
  formalCredibilityDelta: number;
  workRepDelta: number;
  friendsRepDelta: number;
  communityRepDelta: number;
  activeStyleLabelTh: string;
  statusExplainLabelTh: string;
  blockedReasonTh?: string;
}

export function getActiveAppearanceTags(person: Pick<Person, 'appearance' | 'flags'>): string[] {
  const entry = getManifestEntry(person.appearance?.charId);
  const baseTags = entry ? [...entry.tags] : [];
  if (person.flags?.appearance_dyed_fashion && !baseTags.includes('dyed_hair')) {
    baseTags.push('dyed_hair');
  }
  if (person.flags?.appearance_toned_down_formal) {
    return baseTags.filter(
      (t) => t !== 'dyed_hair' && !STRICT_FORMAL_BLOCKED_TAGS.has(t)
    );
  }
  return baseTags;
}

export function evaluateAppearanceImpact(
  person: Pick<Person, 'ageYears' | 'appearance' | 'flags'>
): AppearanceImpactReport {
  const entry = getManifestEntry(person.appearance?.charId);
  const app = person.appearance;
  const flags = person.flags ?? {};

  const tonedDownFormal =
    Boolean(flags.appearance_toned_down_formal) ||
    app?.styleOverride === 'formal' ||
    app?.styleOverride === 'neat';

  if (person.ageYears < 15) {
    return {
      hasLoudDyedHair: false,
      hasSubtleDyedHair: false,
      hasDyedOrFlashyStyle: false,
      hasBoldCasualStyle: false,
      hasFormalProfessionalLook: false,
      blocksStrictFormalJobs: false,
      formalCredibilityDelta: 0,
      workRepDelta: 0,
      friendsRepDelta: 0,
      communityRepDelta: 0,
      activeStyleLabelTh: 'วัยเด็ก (ยังไม่มีเกณฑ์ภาพลักษณ์ทางการ)',
      statusExplainLabelTh: 'บุคลิกภายนอกวัยเด็ก',
    };
  }

  const effectiveDyedColor = app?.dyedHairColor && app.dyedHairColor !== 'natural' ? app.dyedHairColor : undefined;
  const hasLoudDyedHair =
    !tonedDownFormal &&
    (Boolean(flags.appearance_dyed_fashion) ||
      Boolean(entry && isDyedOrFancyHair(entry)) ||
      Boolean(effectiveDyedColor && FANCY_HAIR_COLORS.has(effectiveDyedColor)));

  const hasSubtleDyedHair =
    !tonedDownFormal &&
    !hasLoudDyedHair &&
    Boolean(
      effectiveDyedColor &&
        app?.geneticHairColor &&
        effectiveDyedColor !== app.geneticHairColor
    );

  const entryTags = entry?.tags ?? [];
  const blockedTags = tonedDownFormal
    ? []
    : entryTags.filter((t) => STRICT_FORMAL_BLOCKED_TAGS.has(t));
  const boldTags = tonedDownFormal
    ? []
    : entryTags.filter((t) => MILD_CASUAL_OR_BOLD_TAGS.has(t));
  const isFlashyOverride = !tonedDownFormal && app?.styleOverride === 'flashy';

  const hasFormalProfessionalLook =
    tonedDownFormal ||
    entryTags.some((t) => FORMAL_PROFESSIONAL_TAGS.has(t));

  if (hasLoudDyedHair || blockedTags.length > 0 || isFlashyOverride) {
    const reasonParts: string[] = [];
    if (hasLoudDyedHair) reasonParts.push('ผมย้อมสีแฟชั่นเด่นชัด');
    if (blockedTags.length > 0) {
      const firstLabel = APPEARANCE_TAG_META[blockedTags[0]]?.label ?? 'สไตล์จัดจ้าน';
      reasonParts.push(firstLabel);
    } else if (isFlashyOverride) {
      reasonParts.push('แต่งกายแฟชั่นจัดจ้าน');
    }
    const reasonStr = reasonParts.join(' · ') || 'ลุคแฟชั่นโดดเด่น';

    return {
      hasLoudDyedHair,
      hasSubtleDyedHair,
      hasDyedOrFlashyStyle: true,
      hasBoldCasualStyle: boldTags.length > 0,
      hasFormalProfessionalLook: false,
      blocksStrictFormalJobs: true,
      formalCredibilityDelta: -4,
      workRepDelta: -6,
      friendsRepDelta: 2,
      communityRepDelta: -3,
      activeStyleLabelTh: reasonStr,
      statusExplainLabelTh: `สีผม/ลุคแฟชั่นโดดเด่น (${reasonStr}) ลดความน่าเชื่อถือสายงานทางการ`,
      blockedReasonTh: reasonStr,
    };
  }

  if (hasSubtleDyedHair || boldTags.length > 0 || app?.styleOverride === 'creative') {
    const firstTag = boldTags.length > 0 ? (APPEARANCE_TAG_META[boldTags[0]]?.label ?? 'สไตล์มีเอกลักษณ์') : 'สีผมย้อม/สไตล์เฉพาะตัว';
    return {
      hasLoudDyedHair: false,
      hasSubtleDyedHair,
      hasDyedOrFlashyStyle: hasSubtleDyedHair,
      hasBoldCasualStyle: true,
      hasFormalProfessionalLook: false,
      blocksStrictFormalJobs: false,
      formalCredibilityDelta: -2,
      workRepDelta: -3,
      friendsRepDelta: 2,
      communityRepDelta: -1,
      activeStyleLabelTh: firstTag,
      statusExplainLabelTh: `บุคลิกแนวอิสระ (${firstTag}) ลดภาพจำความเป็นทางการเล็กน้อย`,
    };
  }

  if (hasFormalProfessionalLook) {
    return {
      hasLoudDyedHair: false,
      hasSubtleDyedHair: false,
      hasDyedOrFlashyStyle: false,
      hasBoldCasualStyle: false,
      hasFormalProfessionalLook: true,
      blocksStrictFormalJobs: false,
      formalCredibilityDelta: 2,
      workRepDelta: 4,
      friendsRepDelta: 0,
      communityRepDelta: 2,
      activeStyleLabelTh: 'สุภาพภูมิฐาน',
      statusExplainLabelTh: 'การแต่งกายและลุคสุภาพเรียบร้อย ช่วยเสริมความน่าเชื่อถือ',
    };
  }

  return {
    hasLoudDyedHair: false,
    hasSubtleDyedHair: false,
    hasDyedOrFlashyStyle: false,
    hasBoldCasualStyle: false,
    hasFormalProfessionalLook: false,
    blocksStrictFormalJobs: false,
    formalCredibilityDelta: 0,
    workRepDelta: 0,
    friendsRepDelta: 0,
    communityRepDelta: 0,
    activeStyleLabelTh: 'เรียบง่ายทั่วไป',
    statusExplainLabelTh: 'ภาพลักษณ์เป็นกลางตามธรรมชาติ',
  };
}
