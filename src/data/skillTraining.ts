import type {
  LifeSubStageId,
  RawStatKey,
  SkillCourseDuration,
  SkillKey,
} from '../engine/types';

export type SkillTier = 1 | 2 | 3;

export interface SkillTierDef {
  tier: SkillTier;
  labelTh: string;
  minLevel: number;
  maxCap: number;
  baseRatePerHour: number;
}

export const SKILL_TIERS: Record<SkillTier, SkillTierDef> = {
  1: {
    tier: 1,
    labelTh: 'ฝึกเอง',
    minLevel: 0,
    maxCap: 30,
    baseRatePerHour: 0.12,
  },
  2: {
    tier: 2,
    labelTh: 'ลงคอร์ส',
    minLevel: 30,
    maxCap: 60,
    baseRatePerHour: 0.07,
  },
  3: {
    tier: 3,
    labelTh: 'สนามจริง',
    minLevel: 60,
    maxCap: 100,
    baseRatePerHour: 0.02,
  },
};

export const SKILL_TRAINING_CONFIG = {
  courseMinSelfDevHoursPerWeek: 6,
  courseFeePerWeek: 500,
  courseDurations: [4, 8, 12] as readonly SkillCourseDuration[],
  maxSkillGainPerWeek: 3,
  maxTotalSkillGainPerWeek: 6,
  maxFocusSkills: 2,
  aptitudeMinMult: 0.8,
  aptitudeMaxMult: 1.25,
  energyLowThreshold: 30,
  energyLowMult: 0.6,
  energyNormalMult: 1.0,
  decayIdleWeeks: 12,
  decayPerWeek: 0.02,
  minTrainingAge: 6,
  minCourseEnrollAge: 15,
  socialTier3RequiredHoursPerWeek: 10,
  socialTier3RequiredWeeks: 8,
  financeTier3MinEvidence: 6,
  financeTier3MinWealthCash: 50000,
  progressCurveStart: 1.0,
  progressCurveEnd: 0.5,
} as const;

export const SKILL_APTITUDE_STATS: Record<SkillKey, RawStatKey[]> = {
  english: ['memory', 'wit'],
  sales: ['charisma', 'eq'],
  finance: ['wit', 'reliability'],
  tech: ['wit', 'creativity'],
  craft: ['strength', 'endurance'],
  cooking: ['creativity', 'endurance'],
  socializing: ['charisma', 'eq'],
  academic: ['memory', 'wit'],
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
  school_kid: 1.15,
  teen: 1.15,
  young_adult: 1.0,
  mid_adult: 0.9,
  senior: 0.8,
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
}

export const SKILL_UNLOCK_RULES: Record<SkillKey, SkillUnlockRule> = {
  english: {
    skillId: 'english',
    tier2SourceTh: 'คอร์สภาษา',
    tier3SourceTh: 'งานที่ใช้ภาษาอังกฤษประจำ (พนักงานออฟฟิศ/นักพัฒนาซอฟต์แวร์)',
    tier2HintTh: 'ลงคอร์สภาษาอังกฤษเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'ต้องทำงานสายที่ใช้ภาษาอังกฤษจริง (เช่น พนักงานออฟฟิศ หรือนักพัฒนาซอฟต์แวร์) เพื่อผ่านเลเวล 60',
  },
  sales: {
    skillId: 'sales',
    tier2SourceTh: 'คอร์สการขาย',
    tier3SourceTh: 'งานสายขายหรือค้าขาย (พนักงานร้านสะดวกซื้อ/เซลส์/ผู้จัดการขาย/ค้าขายอิสระ)',
    tier2HintTh: 'ลงคอร์สการขายเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'ต้องทำงานสายขายหรือบริการลูกค้าจริงเพื่อผ่านเลเวล 60',
  },
  finance: {
    skillId: 'finance',
    tier2SourceTh: 'คอร์สการเงิน',
    tier3SourceTh: 'งานสายจัดการเงิน/ธุรกิจ หรือออมเงินตามแผนจนมีเงินสด/ทรัพย์สินถึง 50,000 บาท',
    tier2HintTh: 'ลงคอร์สการเงินเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'ทำงานที่ต้องบริหารเงิน (เช่น ไรเดอร์/ข้าราชการ/ค้าขาย/ผู้จัดการขาย) หรือสะสมวินัยการออมพร้อมเงินสำรอง 50,000 บาทขึ้นไป',
    allowsSavingWealthTier3: true,
  },
  tech: {
    skillId: 'tech',
    tier2SourceTh: 'คอร์สเทค',
    tier3SourceTh: 'งานสายเทค/ดิจิทัล (พนักงานออฟฟิศ/ช่างเทคนิค/นักพัฒนาซอฟต์แวร์)',
    tier2HintTh: 'ลงคอร์สเทคโนโลยีเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'ต้องทำงานที่ได้ใช้ทักษะเทคจริง (ออฟฟิศ/ช่างเทคนิค/นักพัฒนาซอฟต์แวร์) เพื่อผ่านเลเวล 60',
  },
  craft: {
    skillId: 'craft',
    tier2SourceTh: 'คอร์สช่าง',
    tier3SourceTh: 'งานภาคสนาม/ซ่อมบำรุง (ไรเดอร์/ช่างเทคนิค)',
    tier2HintTh: 'ลงคอร์สงานช่างเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'ต้องทำงานสายซ่อมบำรุงหรือภาคสนามจริง (เช่น ช่างเทคนิค หรือไรเดอร์) เพื่อผ่านเลเวล 60',
  },
  cooking: {
    skillId: 'cooking',
    tier2SourceTh: 'คอร์สอาหาร',
    tier3SourceTh: 'งานร้านอาหาร/ค้าขายอิสระ',
    tier2HintTh: 'ลงคอร์สทำอาหารเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'ต้องทำอาชีพเจ้าของร้านอาหาร/ค้าขายอิสระเพื่อฝึกในสนามจริงผ่านเลเวล 60',
  },
  socializing: {
    skillId: 'socializing',
    tier2SourceTh: 'คอร์สพัฒนาบุคลิก/เข้าสังคม',
    tier3SourceTh: 'งานที่ต้องเจรจาผู้คน หรือใช้เวลาเข้าสังคม >= 10 ชม./สัปดาห์ ต่อเนื่อง 8 สัปดาห์',
    tier2HintTh: 'ลงคอร์สเข้าสังคมเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'จัดเวลาเข้าสังคมอย่างน้อย 10 ชม./สัปดาห์ ต่อเนื่อง 8 สัปดาห์ หรือทำงานสายเจรจา/บริการลูกค้า',
    allowsContinuousSocialTier3: true,
  },
  academic: {
    skillId: 'academic',
    tier2SourceTh: 'การเรียนในโรงเรียน หรือคอร์สวิชาการ',
    tier3SourceTh: 'เรียนระดับมหาวิทยาลัย (18+) หรือทำงานสายวิชาการ/ราชการ',
    tier2HintTh: 'เข้าเรียนในระบบหรือลงคอร์สวิชาการเพื่อปลดล็อกเลเวล 30–59',
    tier3HintTh: 'เรียนต่อระดับมหาวิทยาลัย (อายุ 18+) หรือทำงานที่ใช้ความรู้เชิงวิชาการ (ข้าราชการ/นักพัฒนาซอฟต์แวร์)',
    allowsSchoolTier2: true,
    allowsUniversityTier3: true,
  },
};
