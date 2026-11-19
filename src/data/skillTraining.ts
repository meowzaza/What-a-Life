import type {
  LifeSubStageId,
  RawStatKey,
  SkillCourseDuration,
  SkillKey,
  SkillLevelNum,
  SkillTierId,
} from '../engine/types';

export type SkillTier = SkillTierId;

export interface SkillTierDef {
  tier: SkillTier;
  labelTh: string;
  maxLevel: SkillLevelNum;
  /** Internal 0..100 compat score anchor for tier boundaries */
  minLevel: number;
  maxCap: number;
  baseRatePerHour: number;
}

export const SKILL_TIERS: Record<SkillTier, SkillTierDef> = {
  1: {
    tier: 1,
    labelTh: 'ฝึกเอง',
    maxLevel: 2,
    minLevel: 0,
    maxCap: 39,
    baseRatePerHour: 0.25,
  },
  2: {
    tier: 2,
    labelTh: 'ลงคอร์ส',
    maxLevel: 4,
    minLevel: 40,
    maxCap: 79,
    baseRatePerHour: 0.35,
  },
  3: {
    tier: 3,
    labelTh: 'สนามจริง',
    maxLevel: 5,
    minLevel: 80,
    maxCap: 90,
    baseRatePerHour: 0.50,
  },
};

export const SKILL_LEVEL_CONFIG = {
  levels: [1, 2, 3, 4, 5] as readonly SkillLevelNum[],
  namesTh: {
    1: 'เพิ่งเริ่ม',
    2: 'พอทำได้',
    3: 'คล่อง',
    4: 'ชำนาญ',
    5: 'เชี่ยวชาญ',
  } as Record<SkillLevelNum, string>,
  xpThresholds: {
    1: 100,
    2: 300,
    3: 700,
    4: 1500,
    5: 0,
  } as Record<SkillLevelNum, number>,
  maxCompatScoreAtLv5: 90,
  tierMaxLevel: {
    1: 2,
    2: 4,
    3: 5,
  } as Record<SkillTierId, SkillLevelNum>,
  childEventTier2MaxLevel: 3 as SkillLevelNum,
  baseXpPerHourByTier: {
    1: 0.25,
    2: 0.35,
    3: 0.50,
  } as Record<SkillTierId, number>,
  maxSkillXpPerWeek: 6,
  maxTotalSkillXpPerWeek: 10,
  intraLevelCurveStart: 1.0,
  intraLevelCurveEnd: 0.85,
  stressHighThreshold: 80,
  stressHighMult: 0.5,
  courseFixedWeeks: 8 as SkillCourseDuration,
  courseTotalFee: 4000,
  courseFeePerWeek: 500,
  courseMinHoursPerWeek: 6,
  courseMaxMissedWeeks: 2,
  courseXpMult: 1.5,
  tier3CompetitionSkillIds: [
    'social',
    'athletics',
    'visual_arts',
    'music_vocal',
    'performing_acting',
    'dance_thai_modern',
    'literature_writing',
  ] as readonly SkillKey[],
} as const;

export const SKILL_TRAINING_CONFIG = {
  courseMinSelfDevHoursPerWeek: 6,
  courseFeePerWeek: 500,
  courseTotalFee: 4000,
  courseMaxMissedWeeks: 2,
  courseXpMult: 1.5,
  courseDurations: [8] as readonly SkillCourseDuration[],
  maxSkillGainPerWeek: 6,
  maxTotalSkillGainPerWeek: 10,
  maxFocusSkills: 2,
  aptitudeMinMult: 0.85,
  aptitudeMaxMult: 1.2,
  stressHighThreshold: 80,
  stressHighMult: 0.5,
  decayIdleWeeks: 12,
  decayPerWeek: 0.02,
  minTrainingAge: 6,
  minCourseEnrollAge: 15,
  socialTier3RequiredHoursPerWeek: 10,
  socialTier3RequiredWeeks: 8,
  businessTier3MinEvidence: 6,
  businessTier3MinWealthCash: 50000,
  progressCurveStart: 1.0,
  progressCurveEnd: 0.85,
  discoveryHours: 24,
  discoverySessions: 8,
  discoveryHintFraction: 1 / 3,
} as const;

export const SKILL_APTITUDE_STATS: Record<SkillKey, RawStatKey[]> = {
  academic: ['memory', 'wit'],
  tech: ['wit', 'creativity'],
  craft: ['strength', 'endurance'],
  social: ['charisma', 'eq'],
  business: ['wit', 'reliability'],
  athletics: ['strength', 'endurance'],
  foreign_lang: ['memory', 'wit'],
  culinary: ['creativity', 'endurance'],
  visual_arts: ['creativity', 'looks'],
  music_vocal: ['creativity', 'eq'],
  performing_acting: ['charisma', 'eq'],
  dance_thai_modern: ['endurance', 'creativity'],
  literature_writing: ['creativity', 'memory'],
};

/**
 * Trait IDs verified against src/data/traits.ts.
 */
export const SKILL_TRAIT_MULTIPLIERS: Record<string, number> = {
  disciplined_worker: 1.2, // ขยันวินัย
  slacker: 0.8,            // ขี้เกียจ
  curious_learner: 1.12,   // กระหายการเรียนรู้สิ่งใหม่
  niche_obsessed: 1.12,    // คลั่งไคล้เฉพาะทาง
  gritty: 1.08,            // ฮึดสู้
  shortcut_seeker: 0.9,    // ชอบหาทางลัด
};

export const SKILL_AGE_MULTIPLIERS: Record<LifeSubStageId, number> = {
  newborn: 0,
  toddler: 0,
  school_kid: 1.05,
  teen: 1.05,
  young_adult: 1.0,
  mid_adult: 0.95,
  senior: 0.85,
};

export interface SkillUnlockRule {
  skillId: SkillKey;
  tier2SourceTh: string;
  tier3SourceTh: string;
  tier2HintTh: string;
  tier3HintTh: string;
  allowsSchoolTier2?: boolean;
  allowsUniversityTier3?: boolean;
  allowsContinuousSocialTier3?: boolean;
  allowsSavingWealthTier3?: boolean;
  allowsWorkoutStreakTier3?: boolean;
}

export const SKILL_UNLOCK_RULES: Record<SkillKey, SkillUnlockRule> = {
  academic: {
    skillId: 'academic',
    tier2SourceTh: 'คอร์สวิชาการ หรือเรียนต่อสายตรงที่ปลดล็อกขั้นคอร์ส',
    tier3SourceTh: 'เรียนระดับมหาวิทยาลัย (18+) หรือทำงานสายวิชาการ/ราชการ',
    tier2HintTh: 'ลงคอร์สพัฒนาทักษะ (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อกขั้นคอร์สถึง Lv.4',
    tier3HintTh: 'เรียนต่อระดับมหาวิทยาลัย (อายุ 18+) หรือทำงานที่ใช้ความรู้เชิงวิชาการ (ข้าราชการ/นักพัฒนาซอฟต์แวร์) เพื่อปลดล็อก Lv.5',
    allowsUniversityTier3: true,
  },
  tech: {
    skillId: 'tech',
    tier2SourceTh: 'คอร์สเทคโนโลยี',
    tier3SourceTh: 'งานสายเทค/ดิจิทัล (พนักงานออฟฟิศ/ช่างเทคนิค/นักพัฒนาซอฟต์แวร์)',
    tier2HintTh: 'ลงคอร์สเทคโนโลยี (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ต้องทำงานที่ได้ใช้ทักษะเทคจริง (ออฟฟิศ/ช่างเทคนิค/นักพัฒนาซอฟต์แวร์) เพื่อปลดล็อก Lv.5',
  },
  craft: {
    skillId: 'craft',
    tier2SourceTh: 'คอร์สงานช่าง หรือสาย ปวช. ช่างฝีมือ',
    tier3SourceTh: 'งานภาคสนาม/ซ่อมบำรุง (ไรเดอร์/ช่างเทคนิค)',
    tier2HintTh: 'ลงคอร์สงานช่าง (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ต้องทำงานสายซ่อมบำรุงหรือภาคสนามจริง (เช่น ช่างเทคนิค หรือไรเดอร์) เพื่อปลดล็อก Lv.5',
  },
  social: {
    skillId: 'social',
    tier2SourceTh: 'คอร์สพัฒนาบุคลิก/เข้าสังคม หรือสายศิลป์-ภาษา',
    tier3SourceTh: 'งานที่ต้องเจรจาผู้คน หรือใช้เวลาเข้าสังคม >= 10 ชม./สัปดาห์ ต่อเนื่อง 8 สัปดาห์ หรือลงแข่งระดับสูง',
    tier2HintTh: 'ลงคอร์สเข้าสังคม (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'จัดเวลาเข้าสังคมอย่างน้อย 10 ชม./สัปดาห์ ต่อเนื่อง 8 สัปดาห์ หรือทำงานสายเจรจา/ลงแข่งระดับสูง เพื่อปลดล็อก Lv.5',
    allowsContinuousSocialTier3: true,
  },
  business: {
    skillId: 'business',
    tier2SourceTh: 'คอร์สธุรกิจและการเงิน หรือสายศิลป์-คำนวณ/ปวช.',
    tier3SourceTh: 'งานสายขาย/บริหารเงิน หรือออมเงินตามแผนจนมีเงินสำรองถึง 50,000 บาท',
    tier2HintTh: 'ลงคอร์สธุรกิจ (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ทำงานสายค้าขายหรือบริหารเงิน (เช่น เซลส์/ผู้จัดการ/ค้าขายอิสระ) หรือสะสมเงินสำรอง 50,000 บาทขึ้นไป เพื่อปลดล็อก Lv.5',
    allowsSavingWealthTier3: true,
  },
  athletics: {
    skillId: 'athletics',
    tier2SourceTh: 'คอร์สฝึกกีฬา',
    tier3SourceTh: 'ลงแข่งกิจกรรมระดับสูง หรือออกกำลังกายต่อเนื่อง 8 สัปดาห์',
    tier2HintTh: 'ลงคอร์สกีฬา (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ออกกำลังกายต่อเนื่อง 8 สัปดาห์ หรือเข้าร่วมกิจกรรมแข่งขันระดับสูงเพื่อปลดล็อก Lv.5',
    allowsWorkoutStreakTier3: true,
  },
  foreign_lang: {
    skillId: 'foreign_lang',
    tier2SourceTh: 'คอร์สภาษาต่างประเทศ หรือสายศิลป์-ภาษา',
    tier3SourceTh: 'งานที่ใช้ภาษาต่างประเทศประจำ (พนักงานออฟฟิศ/นักพัฒนาซอฟต์แวร์) หรือเรียนมหาวิทยาลัย',
    tier2HintTh: 'ลงคอร์สภาษา (8 สัปดาห์ · 4,000 ฿) หรือเรียนสายศิลป์-ภาษา เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ต้องทำงานสายที่ได้ใช้ภาษาต่างประเทศจริง หรือเรียนมหาวิทยาลัยเพื่อปลดล็อก Lv.5',
    allowsUniversityTier3: true,
  },
  culinary: {
    skillId: 'culinary',
    tier2SourceTh: 'คอร์สทำอาหารและเครื่องดื่ม หรือสาย ปวช. คหกรรม',
    tier3SourceTh: 'งานร้านอาหาร/ค้าขายอิสระ',
    tier2HintTh: 'ลงคอร์สทำอาหาร (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ต้องทำอาชีพเจ้าของร้านอาหาร/ค้าขายอิสระเพื่อฝึกในสนามจริงถึง Lv.5',
  },
  visual_arts: {
    skillId: 'visual_arts',
    tier2SourceTh: 'คอร์สศิลปะและการออกแบบ หรือสายศิลปกรรม',
    tier3SourceTh: 'เรียนมหาวิทยาลัย หรือลงแข่งขัน/โปรเจกต์ระดับสูง',
    tier2HintTh: 'ลงคอร์สศิลปะ (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'เข้ามหาวิทยาลัยหรือลงแข่งกิจกรรมระดับสูงเพื่อปลดล็อก Lv.5',
    allowsUniversityTier3: true,
  },
  music_vocal: {
    skillId: 'music_vocal',
    tier2SourceTh: 'คอร์สดนตรีและการขับร้อง หรือสายศิลปกรรม/เหตุการณ์วัยเด็ก',
    tier3SourceTh: 'เรียนมหาวิทยาลัย หรือลงแข่งขัน/ขึ้นเวทีระดับสูง',
    tier2HintTh: 'ลงคอร์สดนตรี (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'เข้ากิจกรรมแข่งขันระดับสูง หรือศึกษาระดับมหาวิทยาลัยเพื่อปลดล็อก Lv.5',
    allowsUniversityTier3: true,
  },
  performing_acting: {
    skillId: 'performing_acting',
    tier2SourceTh: 'คอร์สการแสดงและพูดต่อหน้าผู้คน หรือสายศิลปกรรม',
    tier3SourceTh: 'ฝึกสนามจริงสายการแสดงหรือกิจกรรมเวที/การแข่งระดับสูง',
    tier2HintTh: 'ลงคอร์สการแสดง (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ขึ้นเวทีประกวดระดับสูงหรือทำกิจกรรมสังคมต่อเนื่องเพื่อปลดล็อก Lv.5',
    allowsContinuousSocialTier3: true,
  },
  dance_thai_modern: {
    skillId: 'dance_thai_modern',
    tier2SourceTh: 'คอร์สนาฏศิลป์และการเต้น หรือสายศิลปกรรม',
    tier3SourceTh: 'ฝึกซ้อมต่อเนื่อง 8 สัปดาห์ หรือลงแข่งกิจกรรมระดับสูง',
    tier2HintTh: 'ลงคอร์สการเต้น (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'ซ้อมเคลื่อนไหวสม่ำเสมอต่อเนื่อง 8 สัปดาห์ หรือเข้าร่วมแข่งขันระดับสูงเพื่อปลดล็อก Lv.5',
    allowsWorkoutStreakTier3: true,
  },
  literature_writing: {
    skillId: 'literature_writing',
    tier2SourceTh: 'คอร์สการเขียนและวรรณศิลป์ หรือสายศิลปกรรม',
    tier3SourceTh: 'ศึกษาระดับมหาวิทยาลัย หรือลงประกวดงานเขียนระดับสูง',
    tier2HintTh: 'ลงคอร์สการเขียน (8 สัปดาห์ · 4,000 ฿) เพื่อปลดล็อก Lv.3–Lv.4',
    tier3HintTh: 'เรียนต่อระดับมหาวิทยาลัย (18+) หรือประกวดงานเขียนระดับสูงเพื่อปลดล็อก Lv.5',
    allowsUniversityTier3: true,
  },
};
