import sceneManifestRaw from './sceneManifest.json';
import type { Daypart } from '../engine/scene';
import type { SceneTag } from '../engine/types';

export type { SceneTag };

const MANIFEST_SCENES = (sceneManifestRaw as any).scenes as Array<{
  id: string;
  availability: { alwaysOpen: boolean; dayparts: Daypart[] };
}>;

export type SceneGroup = 'home' | 'education' | 'work' | 'district';

export type ClassTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface StandZone {
  xMin: number;
  xMax: number;
  footY: number;
  tuned: boolean;
}

export interface SceneMetaEntry {
  sceneId: string;
  nameTh: string;
  group: SceneGroup;
  classTiers: ClassTier[];
  sceneTag: SceneTag;
  regionMode: 'rural' | 'urban';
  minAgeEnter: number;
  aliases: string[];
  standZone: StandZone;
  characterScale: number;
}

const DEFAULT_STAND_ZONE: StandZone = {
  xMin: 0.15,
  xMax: 0.85,
  footY: 0.88,
  tuned: false,
};

const DEFAULT_CHARACTER_SCALE = 0.38;

/**
 * Metadata table per 01_scene_catalog_v2.md Section 10.
 * Separated cleanly from sceneManifest.json without modifying asset manifests.
 */
export const SCENE_META_CATALOG: SceneMetaEntry[] = [
  // === Home (7 ฉาก) ===
  {
    sceneId: 'home_tenement',
    nameTh: 'ห้องเช่า/แฟลตเก่า',
    group: 'home',
    classTiers: ['T1', 'T2'],
    sceneTag: 'home',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['tenement', 'flat'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'home_rural_stilt',
    nameTh: 'บ้านไม้ยกสูงชนบท',
    group: 'home',
    classTiers: ['T1', 'T2'],
    sceneTag: 'home',
    regionMode: 'rural',
    minAgeEnter: 0,
    aliases: ['stilt_house', 'rural_home'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'home_shophouse',
    nameTh: 'บ้านครึ่งไม้พร้อมร้าน',
    group: 'home',
    classTiers: ['T2', 'T3'],
    sceneTag: 'home',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['shophouse', 'row_home'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'home_condo_mid',
    nameTh: 'คอนโดกลางเมือง',
    group: 'home',
    classTiers: ['T3'],
    sceneTag: 'home',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['condo_mid', 'city_condo'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'home_thai_house',
    nameTh: 'บ้านไม้ไทยในรั้ว มีแมว',
    group: 'home',
    classTiers: ['T3', 'T4'],
    sceneTag: 'home',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['thai_house', 'cat_house'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'home_condo_premium',
    nameTh: 'คอนโดมีฟิตเนส',
    group: 'home',
    classTiers: ['T4', 'T5'],
    sceneTag: 'home',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['condo_premium', 'luxury_condo'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'home_mansion',
    nameTh: 'บ้านหรู 2 ชั้น',
    group: 'home',
    classTiers: ['T5'],
    sceneTag: 'home',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['mansion', 'luxury_house'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },

  // === Education (4 ฉาก) ===
  {
    sceneId: 'school_temple',
    nameTh: 'โรงเรียนวัด',
    group: 'education',
    classTiers: ['T1', 'T2'],
    sceneTag: 'school',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['temple_school'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'school_public',
    nameTh: 'โรงเรียนทั่วไป',
    group: 'education',
    classTiers: ['T2', 'T3', 'T4'],
    sceneTag: 'school',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['public_school', 'state_school'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'school_international',
    nameTh: 'โรงเรียนอินเตอร์',
    group: 'education',
    classTiers: ['T4', 'T5'],
    sceneTag: 'school',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['inter_school', 'international_school'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'university',
    nameTh: 'มหาวิทยาลัย',
    group: 'education',
    classTiers: ['T1', 'T2', 'T3', 'T4', 'T5'],
    sceneTag: 'school',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['campus', 'college'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },

  // === Work (3 ฉาก) ===
  {
    sceneId: 'work_corporate',
    nameTh: 'บริษัทใหญ่',
    group: 'work',
    classTiers: ['T3', 'T4', 'T5'],
    sceneTag: 'work',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['office', 'corporate'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'work_warehouse',
    nameTh: 'โกดังสินค้า',
    group: 'work',
    classTiers: ['T2', 'T3'],
    sceneTag: 'work',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['warehouse', 'storage'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'hospital',
    nameTh: 'โรงพยาบาล',
    group: 'work',
    classTiers: ['T1', 'T2', 'T3', 'T4', 'T5'],
    sceneTag: 'work',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['clinic', 'er'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },

  // === District & Commerce (7 ฉาก) ===
  {
    sceneId: 'shop_minimart',
    nameTh: 'มินิมาร์ท',
    group: 'district',
    classTiers: ['T1', 'T2', 'T3', 'T4', 'T5'],
    sceneTag: 'district',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['convenience_store', 'minimart'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'street_shops',
    nameTh: 'ถนนร้านค้า',
    group: 'district',
    classTiers: ['T2', 'T3'],
    sceneTag: 'district',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['street_market', 'commercial_street'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'market_fresh',
    nameTh: 'ตลาดสดชุมชน',
    group: 'district',
    classTiers: ['T1', 'T2', 'T3'],
    sceneTag: 'market',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['fresh_market', 'bazaar'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'cafe',
    nameTh: 'คาเฟ่',
    group: 'district',
    classTiers: ['T2', 'T3', 'T4'],
    sceneTag: 'cafe',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['shop_row', 'coffee_shop'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'restaurant_tamsang',
    nameTh: 'ร้านอาหารตามสั่ง',
    group: 'district',
    classTiers: ['T1', 'T2', 'T3'],
    sceneTag: 'district',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['tamsang', 'diner'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'street_food_night',
    nameTh: 'ซอยอาหารกลางคืน',
    group: 'district',
    classTiers: ['T1', 'T2', 'T3'],
    sceneTag: 'nightlife',
    regionMode: 'urban',
    minAgeEnter: 0,
    aliases: ['night_food', 'food_alley'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
  {
    sceneId: 'nightlife_pub',
    nameTh: 'ผับ PARTY TOWN',
    group: 'district',
    classTiers: ['T2', 'T3', 'T4', 'T5'],
    sceneTag: 'nightlife',
    regionMode: 'urban',
    minAgeEnter: 20, // Toggleable to 18 via settings.pubVisitAge
    aliases: ['pub', 'bar', 'club'],
    standZone: DEFAULT_STAND_ZONE,
    characterScale: DEFAULT_CHARACTER_SCALE,
  },
];

export const SCENE_META_BY_ID: ReadonlyMap<string, SceneMetaEntry> = new Map(
  SCENE_META_CATALOG.map((m) => [m.sceneId, m])
);

/**
 * Maps FamilyWealth / Economy cash tier to ClassTier T1-T5.
 */
export function deriveClassTier(wealth: string, cash = 0): ClassTier {
  if (cash >= 2000000 || wealth === 'wealthy') return 'T5';
  if (cash >= 500000 || wealth === 'upper_middle') return 'T4';
  if (cash >= 100000 || wealth === 'middle') return 'T3';
  if (wealth === 'working_poor' || cash >= 20000) return 'T2';
  return 'T1';
}

/**
 * Resolves best scene for a given sceneTag and ClassTier.
 * E.g. school + T1 -> school_temple, school + T5 -> school_international.
 */
export function pickSceneByTagAndTier(
  tag: SceneTag,
  tier: ClassTier,
  daypart: Daypart,
  age: number,
  settings?: { pubVisitAge?: 18 | 20 }
): string | null {
  const candidates = SCENE_META_CATALOG.filter(
    (m) => m.sceneTag === tag && m.classTiers.includes(tier)
  );

  // Fallback to any tier matching this tag if exact tier not found
  const pool = candidates.length > 0 ? candidates : SCENE_META_CATALOG.filter((m) => m.sceneTag === tag);

  // Return first candidate open at current daypart and age
  for (const item of pool) {
    const sceneDef = MANIFEST_SCENES.find((s) => s.id === item.sceneId);
    if (!sceneDef) continue;
    if (item.sceneId === 'nightlife_pub' && age < (settings?.pubVisitAge ?? 20)) {
      continue;
    }
    if (sceneDef.availability.alwaysOpen || sceneDef.availability.dayparts.includes(daypart)) {
      return item.sceneId;
    }
  }

  return pool[0]?.sceneId ?? null;
}
