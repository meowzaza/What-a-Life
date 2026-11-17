import type { LifeSubStageId, TimeAllocCategory, TimeAllocation } from '../engine/types';

export const TOTAL_WEEKLY_HOURS = 168;

export interface TimeCategoryMeta {
  key: TimeAllocCategory;
  labelTh: string;
  shortDescTh: string;
  color: string;
  minHours: number;
  maxHours: number;
}

export const TIME_ALLOC_CATEGORIES: TimeCategoryMeta[] = [
  {
    key: 'sleep',
    labelTh: 'นอนหลับพักผ่อน',
    shortDescTh: 'ฟื้นฟูพลังงานและกันความเครียดสะสม',
    color: '#B4C3FF',
    minHours: 28, // 4h/day minimum physiological floor
    maxHours: 98,
  },
  {
    key: 'workOrStudy',
    labelTh: 'งาน / เรียน',
    shortDescTh: 'ชั่วโมงทำงานประจำหรือเรียนต่อสัปดาห์ (เกินกำลังจะเกิดความล้า)',
    color: '#FFE58F',
    minHours: 0,
    maxHours: 84,
  },
  {
    key: 'sideGig',
    labelTh: 'งานเสริม / พาร์ตไทม์',
    shortDescTh: 'ชั่วโมงทำงานเสริมนอกเวลาหลัก (ต้องมีงานเสริมที่ผ่านเกณฑ์ก่อน)',
    color: '#FFD6A5',
    minHours: 0,
    maxHours: 40,
  },
  {
    key: 'social',
    labelTh: 'เข้าสังคมกลางวัน/พบเพื่อน',
    shortDescTh: 'สร้างสัมพันธ์และทักษะการเข้าสังคม',
    color: '#FFB8D2',
    minHours: 0,
    maxHours: 48,
  },
  {
    key: 'hobby',
    labelTh: 'งานอดิเรก / พักใจ',
    shortDescTh: 'คลายเครียดและเปิดโอกาสพัฒนาความชอบเฉพาะทาง',
    color: '#6EE7B7',
    minHours: 0,
    maxHours: 60,
  },
  {
    key: 'family',
    labelTh: 'เวลาให้ครอบครัว',
    shortDescTh: 'ดูแลบ้านและความผูกพันกับคนในครอบครัว',
    color: '#FFBE94',
    minHours: 0,
    maxHours: 56,
  },
  {
    key: 'selfDev',
    labelTh: 'พัฒนาตัวเอง / ฝึกทักษะ',
    shortDescTh: 'อ่านหนังสือ ฝึกทักษะ และสร้างวินัยส่วนตัว',
    color: '#C4B5FD',
    minHours: 0,
    maxHours: 48,
  },
  {
    key: 'nightlife',
    labelTh: 'กลางคืน / ปาร์ตี้',
    shortDescTh: 'เฉพาะอายุ 18+: ใช้ชีวิตยามค่ำคืน สังสรรค์ดึก (ส่งผลต่อฉากกลางคืน)',
    color: '#9F8FEF',
    minHours: 0,
    maxHours: 42,
  },
];

export const STAGE_MIN_SLEEP_HOURS: Record<LifeSubStageId, number> = {
  newborn: 70,    // 10h/day
  toddler: 63,    // 9h/day
  school_kid: 56, // 8h/day
  teen: 49,       // 7h/day
  young_adult: 35,// 5h/day min
  mid_adult: 35,
  senior: 42,     // 6h/day min
};

export const STAGE_OVERWORK_THRESHOLD: Record<LifeSubStageId, number> = {
  newborn: 0,
  toddler: 0,
  school_kid: 36,
  teen: 48,        // School + light part-time cap per Spec 03 §2
  young_adult: 56, // Beyond 56h/wk degrades stress & physical health (Spec 03 §8)
  mid_adult: 52,
  senior: 35,
};

export const DEFAULT_TIME_ALLOC_BY_STAGE: Record<LifeSubStageId, TimeAllocation> = {
  newborn: { sleep: 98, workOrStudy: 0, sideGig: 0, social: 14, hobby: 20, family: 36, selfDev: 0, nightlife: 0 },
  toddler: { sleep: 84, workOrStudy: 0, sideGig: 0, social: 18, hobby: 30, family: 34, selfDev: 2, nightlife: 0 },
  school_kid: { sleep: 63, workOrStudy: 35, sideGig: 0, social: 18, hobby: 22, family: 20, selfDev: 10, nightlife: 0 },
  teen: { sleep: 56, workOrStudy: 42, sideGig: 0, social: 20, hobby: 20, family: 16, selfDev: 14, nightlife: 0 },
  young_adult: { sleep: 52, workOrStudy: 45, sideGig: 0, social: 18, hobby: 18, family: 14, selfDev: 15, nightlife: 6 },
  mid_adult: { sleep: 52, workOrStudy: 46, sideGig: 0, social: 14, hobby: 18, family: 22, selfDev: 12, nightlife: 4 },
  senior: { sleep: 58, workOrStudy: 10, sideGig: 0, social: 20, hobby: 32, family: 34, selfDev: 12, nightlife: 2 },
};

/**
 * Fixed deduction order when balancing preset deltas back to 168 hours (Spec 05 §2.1).
 */
export const PRESET_DEDUCTION_ORDER: TimeAllocCategory[] = [
  'hobby',
  'selfDev',
  'social',
  'family',
  'nightlife',
  'sleep',
];

/**
 * All tuning constants for weekly 168-hour Time Allocation effects & evidence generation.
 * Stored purely in src/data to keep src/engine formula-transparent.
 */
export const TIME_ALLOC_BALANCE = {
  optimalSleepHours: 56, // 8h * 7
  energyPerSleepDiffHour: 0.45,
  stressPerSleepDeficitHour: 0.32,
  overworkStressPerExtraHour: 0.48,
  overworkEndurancePenaltyPerExtraHour: 0.025,
  overtimeHourlyPayMultiplier: 0.012, // Extra fraction of monthly salary per extra work hour above contract
  sideGigEnergyPenaltyPerHour: 0.22,
  sideGigStressPerHour: 0.14,
  socialSkillPerHour: 0.065,
  selfDevSkillPerHour: 0.09,
  hobbyStressReliefPerHour: 0.24,
  familyStressReliefPerHour: 0.16,
  nightlifeStressReliefPerHour: 0.12,
  nightlifeEnergyPenaltyPerHour: 0.35,
  nightlifeCostPerHour: 55, // THB/week per nightlife hour (drinks/food/transport)
  // Evidence thresholds per week
  workaholicWeeklyHours: 62,
  socialButterflyWeeklyHours: 26,
  hermitMaxSocialPlusNightlife: 5,
  hermitMinHobbyHours: 24,
  nightlifeDominantMinHours: 14, // If nightlife >= 14 AND is highest among evening/leisure categories -> daypart = 'night'
};
