import type {
  DiscoveredSkillId,
  FamilyWealthTier,
  HighSchoolTrack,
  ReadinessLevel,
  SchoolTier,
  SecondChanceEduType,
  SkillKey,
  VocationalBranchId,
} from '../engine/types';

export interface SchoolTierMeta {
  id: SchoolTier;
  labelTh: string;
  shortDescTh: string;
  monthlyFeeThb: number;
  gpaBonus: number;
  academicGainMult: number;
  autoDiscoversForeignLang?: boolean;
}

export const SCHOOL_TIERS: Record<SchoolTier, SchoolTierMeta> = {
  school_temple: {
    id: 'school_temple',
    labelTh: 'โรงเรียนวัด / ชุมชน',
    shortDescTh: 'ค่าใช้จ่ายต่ำมาก ใกล้ชิดชุมชน และช่วยลดภาระค่าเรียนของครอบครัว',
    monthlyFeeThb: 0,
    gpaBonus: -0.05,
    academicGainMult: 0.92,
  },
  school_public: {
    id: 'school_public',
    labelTh: 'โรงเรียนรัฐบาล',
    shortDescTh: 'โรงเรียนมาตรฐานสายหลัก มีเพื่อนหลากหลายและค่าเทอมประหยัด',
    monthlyFeeThb: 350,
    gpaBonus: 0,
    academicGainMult: 1.0,
  },
  school_private: {
    id: 'school_private',
    labelTh: 'โรงเรียนเอกชน',
    shortDescTh: 'สิ่งอำนวยความสะดวกและห้องเรียนดูแลใกล้ชิดกว่า ค่าใช้จ่ายสูงขึ้น',
    monthlyFeeThb: 2800,
    gpaBonus: 0.05,
    academicGainMult: 1.12,
  },
  school_international: {
    id: 'school_international',
    labelTh: 'โรงเรียนนานาชาติ',
    shortDescTh: 'ใช้ภาษาต่างประเทศในชีวิตประจำวัน ค่าใช้จ่ายสูงและเปิดโอกาสสายสากล',
    monthlyFeeThb: 14000,
    gpaBonus: 0.05,
    academicGainMult: 1.15,
    autoDiscoversForeignLang: true,
  },
};

export const SCHOOL_TIER_ORDER: SchoolTier[] = [
  'school_temple',
  'school_public',
  'school_private',
  'school_international',
];

export interface HighSchoolTrackMeta {
  id: HighSchoolTrack;
  labelTh: string;
  shortDescTh: string;
  boostedSkills: SkillKey[];
  autoDiscoversSkill?: DiscoveredSkillId;
}

export const HIGH_SCHOOL_TRACKS: Record<HighSchoolTrack, HighSchoolTrackMeta> = {
  sci_math: {
    id: 'sci_math',
    labelTh: 'สายวิทย์-คณิต',
    shortDescTh: 'เน้นวิชาการคำนวณและเทคโนโลยี เตรียมทางเลือกเรียนต่อกว้างที่สุด',
    boostedSkills: ['academic', 'tech'],
  },
  arts_math: {
    id: 'arts_math',
    labelTh: 'สายศิลป์-คำนวณ',
    shortDescTh: 'ผสมผสานการคำนวณ ธุรกิจ และการจัดการเชิงปฏิบัติ',
    boostedSkills: ['academic', 'business'],
  },
  arts_lang: {
    id: 'arts_lang',
    labelTh: 'สายศิลป์-ภาษา',
    shortDescTh: 'ปลดล็อกทักษะภาษาต่างประเทศทันทีและเน้นการสื่อสารกับผู้คน',
    boostedSkills: ['foreign_lang', 'social'],
    autoDiscoversSkill: 'foreign_lang',
  },
  arts_fine: {
    id: 'arts_fine',
    labelTh: 'สายศิลปกรรม',
    shortDescTh: 'เปิดทางด้านศิลปะ ดนตรี การแสดง หรือวรรณศิลป์เฉพาะทาง',
    boostedSkills: ['visual_arts', 'music_vocal', 'performing_acting', 'dance_thai_modern', 'literature_writing'],
  },
  vocational: {
    id: 'vocational',
    labelTh: 'สายอาชีพ (ปวช.)',
    shortDescTh: 'ฝึกทักษะช่าง เทคโนโลยี คหกรรม หรือธุรกิจเพื่อใช้งานจริงและต่อยอด ปวส./ทำงาน',
    boostedSkills: ['craft', 'tech', 'culinary', 'business'],
  },
};

export const FINE_ART_TRACK_CHOICES: DiscoveredSkillId[] = [
  'visual_arts',
  'music_vocal',
  'performing_acting',
  'dance_thai_modern',
  'literature_writing',
];

export const VOCATIONAL_BRANCHES: Array<{ id: VocationalBranchId; labelTh: string; skill: SkillKey }> = [
  { id: 'craft', labelTh: 'ช่างอุตสาหกรรม / งานฝีมือ', skill: 'craft' },
  { id: 'tech', labelTh: 'เทคโนโลยีสารสนเทศ', skill: 'tech' },
  { id: 'culinary', labelTh: 'คหกรรม / การอาหาร', skill: 'culinary' },
  { id: 'business', labelTh: 'พณิชยการ / ธุรกิจ', skill: 'business' },
];

export interface TrackSkillRequirement {
  skills: SkillKey[];
  minScore: number;
  anyOf?: boolean;
  labelTh: string;
}

export interface TrackReadinessRule {
  track: HighSchoolTrack;
  recommendedGpax: number;
  skillChecks: TrackSkillRequirement[];
  nextPathsTh: string;
  gainedSkillsTh: string;
}

export const TRACK_READINESS_RULES: Record<HighSchoolTrack, TrackReadinessRule> = {
  sci_math: {
    track: 'sci_math',
    recommendedGpax: 2.75,
    skillChecks: [
      { skills: ['academic'], minScore: 25, labelTh: 'วิชาการ >= 25 (ช่วงกลาง Lv.2)' },
    ],
    nextPathsTh: 'แพทย์ วิศวะ วิทย์ เทคโนโลยี',
    gainedSkillsTh: 'วิชาการ, เทคโนโลยี',
  },
  arts_math: {
    track: 'arts_math',
    recommendedGpax: 2.25,
    skillChecks: [
      { skills: ['academic'], minScore: 20, labelTh: 'วิชาการ >= 20 (Lv.2)' },
      { skills: ['business'], minScore: 10, labelTh: 'ธุรกิจ >= 10 (ยังไม่ค้นพบนับ 0)' },
    ],
    nextPathsTh: 'บริหาร เศรษฐศาสตร์ บัญชี',
    gainedSkillsTh: 'วิชาการ, ธุรกิจ',
  },
  arts_lang: {
    track: 'arts_lang',
    recommendedGpax: 2.0,
    skillChecks: [
      { skills: ['foreign_lang'], minScore: 10, labelTh: 'ภาษาต่างประเทศ >= 10 (ยังไม่ค้นพบนับ 0)' },
    ],
    nextPathsTh: 'อักษร มนุษย์ ล่าม สื่อสาร',
    gainedSkillsTh: 'ภาษาต่างประเทศ (ปลดล็อก), สังคม',
  },
  arts_fine: {
    track: 'arts_fine',
    recommendedGpax: 2.0,
    skillChecks: [
      {
        skills: ['visual_arts', 'music_vocal', 'performing_acting', 'dance_thai_modern', 'literature_writing'],
        minScore: 15,
        anyOf: true,
        labelTh: 'ทักษะศิลปะ/ดนตรี/การแสดง/เต้น/เขียน >= 15',
      },
    ],
    nextPathsTh: 'ศิลปกรรม ดุริยางค์ นิเทศ',
    gainedSkillsTh: 'แขนงที่เลือก (ปลดล็อกอัตโนมัติ)',
  },
  vocational: {
    track: 'vocational',
    recommendedGpax: 1.75,
    skillChecks: [
      {
        skills: ['craft', 'tech', 'culinary', 'business'],
        minScore: 10,
        anyOf: true,
        labelTh: 'ทักษะสาขา (ช่าง/เทค/อาหาร/ธุรกิจ) >= 10',
      },
    ],
    nextPathsTh: 'ปวส. ป.ตรีต่อเนื่อง ทำงานช่าง/บริการ',
    gainedSkillsTh: 'ทักษะสาขาที่เลือก',
  },
};

export const READINESS_META: Record<ReadinessLevel, { labelTh: string; penalty: number; warningTh: string }> = {
  ready: {
    labelTh: 'พร้อม',
    penalty: 0,
    warningTh: 'พื้นฐานและเกรดเฉลี่ยสะสมผ่านเกณฑ์แนะนำของสายนี้',
  },
  risky: {
    labelTh: 'เสี่ยง',
    penalty: 0.2,
    warningTh: 'พื้นฐานยังไม่ครบ 1 เกณฑ์ — เกรด 2 เทอมแรกจะถูกหัก -0.20 ระหว่างปรับตัว',
  },
  very_risky: {
    labelTh: 'เสี่ยงสูง',
    penalty: 0.4,
    warningTh: 'พื้นฐานยังไม่ถึงเกณฑ์ทั้ง GPAX และทักษะ — เกรด 2 เทอมแรกจะถูกหัก -0.40',
  },
};

export const TRACK_CHANGE_FEES: Record<SchoolTier, number> = {
  school_temple: 500,
  school_public: 500,
  school_private: 1500,
  school_international: 3000,
};

export const GPA_FORMULA_CONFIG = {
  baseGpa: 2.4,
  academicSlope: 0.015,
  studyTargetHoursPerWeek: 5,
  studyBonusPerHour: 0.04,
  studyBonusMin: -0.4,
  studyBonusMax: 0.4,
  talentBonusByTier: { 1: 0.1, 2: 0.2, 3: 0.3 } as Record<1 | 2 | 3, number>,
  talentBonusMax: 0.3,
  teacherBonusMin: -0.3,
  teacherBonusMax: 0.3,
  stressThreshold: 60,
  stressDivisor: 40,
  stressPenaltyMax: 0.4,
  energyThreshold: 40,
  energyDivisor: 40,
  energyPenaltyMax: 0.3,
  noiseAmplitude: 0.15,
  readinessDurationTerms: 2,
  trackAdjustmentPenalty: 0.2,
  trackAdjustmentDurationTerms: 1,
  maxGpaHistoryEntries: 24,
} as const;

export const SCHOOL_TRANSFER_CONFIG = {
  waitMinDays: 7,
  waitMaxDays: 14,
  minProb: 0.15,
  maxProb: 0.95,
  baseProb: 0.5,
  familyRelWeight: 0.2,
  wealthBonus: {
    destitute: -0.2,
    working_poor: -0.2,
    lower_middle: -0.05,
    middle: 0,
    upper_middle: 0.1,
    wealthy: 0.2,
  } as Record<FamilyWealthTier, number>,
  estimatedAnnualIncomeByWealth: {
    destitute: 90000,
    working_poor: 160000,
    lower_middle: 260000,
    middle: 480000,
    upper_middle: 960000,
    wealthy: 2400000,
  } as Record<FamilyWealthTier, number>,
  maxDebtPenalty: 0.25,
  maxFeeDiffPenalty: 0.4,
  parentTemperamentBonus: 0.1,
} as const;

export const ROTC_RULES = {
  maleAutoPassMinPhysical: 20,
  femaleBasePassChance: 0.7,
  femaleModifierMax: 0.1,
  femaleGovServiceBonus: 1,
  femaleReliabilityGain: 1,
  annualAthleticsXp: 4,
} as const;

export const DROPOUT_CRISIS_CONFIG = {
  poorWealthTiers: ['destitute', 'working_poor'] as readonly FamilyWealthTier[],
  highDebtThreshold: 30000,
  annualTuitionAffordabilityRatio: 0.18,
} as const;

export interface SecondChanceEduMeta {
  id: SecondChanceEduType;
  labelTh: string;
  shortDescTh: string;
  requiredMinAge: number;
  requiredTerms: number;
  monthlyFeeThb: number;
  targetEducation: 'nfe_lower' | 'nfe_upper' | 'bachelor';
}

export const SECOND_CHANCE_PROGRAMS: Record<SecondChanceEduType, SecondChanceEduMeta> = {
  nfe_lower: {
    id: 'nfe_lower',
    labelTh: 'กศน. ระดับ ม.ต้น',
    shortDescTh: 'เรียนเทียบวุฒิมัธยมต้นควบคู่การทำงานได้ ใช้วุฒิสมัครงานระดับ ม.ต้น ได้เท่าเทียม',
    requiredMinAge: 15,
    requiredTerms: 2,
    monthlyFeeThb: 250,
    targetEducation: 'nfe_lower',
  },
  nfe_upper: {
    id: 'nfe_upper',
    labelTh: 'กศน. ระดับ ม.ปลาย',
    shortDescTh: 'เรียนเทียบวุฒิมัธยมปลายควบคู่การทำงานได้ ใช้วุฒิสมัครงานระดับ ม.ปลาย ได้เท่าเทียม',
    requiredMinAge: 15,
    requiredTerms: 2,
    monthlyFeeThb: 350,
    targetEducation: 'nfe_upper',
  },
  uni_open_evening: {
    id: 'uni_open_evening',
    labelTh: 'มหาวิทยาลัยเปิด / ภาคค่ำ',
    shortDescTh: 'เรียนปริญญาตรีภาคค่ำหรือนอกเวลาควบคู่การทำงานประจำเพื่ออัปวุฒิ',
    requiredMinAge: 18,
    requiredTerms: 4,
    monthlyFeeThb: 1200,
    targetEducation: 'bachelor',
  },
};

export const EDUCATION_SYSTEM_RULES = {
  summerTransferMonths: [3, 4] as readonly number[], // มีนาคม–เมษายน เท่านั้น
  tuitionPaymentMonths: [5, 11] as readonly number[], // ต้นเทอม พ.ค. และ พ.ย. (2 งวดต่อปี)
  termEvaluationMonths: [10, 3] as readonly number[], // ปิดเทอม 1 ต.ค., ปิดเทอม 2 มี.ค.
  remedialThresholdGpa: 1.5,
  rotcRequiredYears: 3,
  rotcStartMinAge: 15,
  rotcStartMaxAge: 17,
} as const;
