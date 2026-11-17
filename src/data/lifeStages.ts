import type { AppearanceStage, GameSpeed, LifeSubStageId, TraitCategory } from '../engine/types';

export interface LifeStageDefinition {
  id: LifeSubStageId;
  manifestGroup: AppearanceStage; // Matches characterManifest.json: baby (0-3), kid (4-15), adult (16-59), elder (60+)
  minAge: number;
  maxAge: number;
  labelTh: string;
  shortLabelTh: string;
  badgeColor: string;
  defaultSpeed: Exclude<GameSpeed, 0>;
  sensitiveMultiplier: number; // Early childhood & teens form traits faster & deeper
  eligibleCategories: TraitCategory[];
  unlockedSystemsTh: string[];
  restrictionsTh: string[];
}

export const LIFE_STAGES: LifeStageDefinition[] = [
  {
    id: 'newborn',
    manifestGroup: 'baby',
    minAge: 0,
    maxAge: 1,
    labelTh: 'วัยทารกแรกเกิด',
    shortLabelTh: 'ทารก',
    badgeColor: '#FFE0EE',
    defaultSpeed: 5,
    sensitiveMultiplier: 1.55,
    eligibleCategories: ['emotion', 'social'],
    unlockedSystemsTh: ['อารมณ์พื้นฐาน (Temperament)', 'การตอบสนองของครอบครัว'],
    restrictionsTh: ['ไม่เปิดเศรษฐกิจส่วนตัว', 'ยังไม่มีเวลาทำงานหรือสังสรรค์กลางคืน'],
  },
  {
    id: 'toddler',
    manifestGroup: 'baby',
    minAge: 2,
    maxAge: 3,
    labelTh: 'วัยเตาะแตะ',
    shortLabelTh: 'เตาะแตะ',
    badgeColor: '#FFF3BF',
    defaultSpeed: 5,
    sensitiveMultiplier: 1.5,
    eligibleCategories: ['emotion', 'social', 'mindset'],
    unlockedSystemsTh: ['เผยสีตาและสีผมแท้จริง', 'การซึมซับนิสัยต้นแบบ'],
    restrictionsTh: ['ไม่เปิดเศรษฐกิจส่วนตัว', 'ยังไม่มีเวลาทำงานหรือสังสรรค์กลางคืน'],
  },
  {
    id: 'school_kid',
    manifestGroup: 'kid',
    minAge: 4,
    maxAge: 12,
    labelTh: 'วัยเรียนประถม',
    shortLabelTh: 'วัยเด็ก',
    badgeColor: '#DCEBFF',
    defaultSpeed: 3,
    sensitiveMultiplier: 1.35,
    eligibleCategories: ['emotion', 'social', 'work', 'mindset'],
    unlockedSystemsTh: ['ฝึกทักษะพื้นฐาน (6+)', 'เพื่อนในโรงเรียน', 'จัดตารางเวลาเด็ก'],
    restrictionsTh: ['ห้ามทำงานรับจ้าง (<15)', 'ห้ามกู้เงิน/เที่ยวกลางคืน'],
  },
  {
    id: 'teen',
    manifestGroup: 'kid', // Note: manifest switches to 'adult' at 16, handled by getAppearanceStage
    minAge: 13,
    maxAge: 17,
    labelTh: 'วัยรุ่น',
    shortLabelTh: 'วัยรุ่น',
    badgeColor: '#EAE2FF',
    defaultSpeed: 3,
    sensitiveMultiplier: 1.25,
    eligibleCategories: ['emotion', 'social', 'work', 'finance', 'mindset'],
    unlockedSystemsTh: ['พาร์ตไทม์เบาๆ นอกเวลาเรียน (15-17)', 'ค่าขนมและการออม', 'ตัวละครตัดสินใจเองวัยเรียน'],
    restrictionsTh: ['ห้ามทำงาน 22:00-06:00', 'ห้ามเข้าผับ/สังสรรค์กลางคืน (<18)', 'ห้ามกู้สินเชื่อ (<18)'],
  },
  {
    id: 'young_adult',
    manifestGroup: 'adult',
    minAge: 18,
    maxAge: 34,
    labelTh: 'วัยทำงานตอนต้น',
    shortLabelTh: 'ผู้ใหญ่ตอนต้น',
    badgeColor: '#D6FAEA',
    defaultSpeed: 1,
    sensitiveMultiplier: 0.95,
    eligibleCategories: ['emotion', 'social', 'work', 'finance', 'mindset'],
    unlockedSystemsTh: ['งานเต็มเวลาและกะกลางคืน (18+)', 'เช่าที่พัก/สินเชื่อ (18+)', 'ตั้งค่าคำสั่งประจำเต็มรูปแบบ'],
    restrictionsTh: ['การเข้าใช้บริการผับขึ้นกับการตั้งค่าอายุ 20+ (ค่าตั้งต้น) หรือ 18+'],
  },
  {
    id: 'mid_adult',
    manifestGroup: 'adult',
    minAge: 35,
    maxAge: 59,
    labelTh: 'วัยกลางคน',
    shortLabelTh: 'วัยกลางคน',
    badgeColor: '#FFE3D3',
    defaultSpeed: 1,
    sensitiveMultiplier: 0.78,
    eligibleCategories: ['emotion', 'social', 'work', 'finance', 'mindset'],
    unlockedSystemsTh: ['งานบริหาร/ธุรกิจเต็มตัว', 'ตั้งค่าคำสั่งประจำเต็มรูปแบบ'],
    restrictionsTh: ['นิสัยใหม่ต้องอาศัยการทำพฤติกรรมซ้ำๆ นานขึ้นหรือเจอจุดเปลี่ยนชีวิต'],
  },
  {
    id: 'senior',
    manifestGroup: 'elder',
    minAge: 60,
    maxAge: 130,
    labelTh: 'วัยชรา / เกษียณ',
    shortLabelTh: 'ผู้สูงอายุ',
    badgeColor: '#F3E8FF',
    defaultSpeed: 1,
    sensitiveMultiplier: 0.65,
    eligibleCategories: ['emotion', 'social', 'work', 'finance', 'mindset'],
    unlockedSystemsTh: ['ใช้ชีวิตบั้นปลาย', 'ปรับนิสัยด้วยความสงบและจุดเปลี่ยนชีวิต'],
    restrictionsTh: ['ความอึดและพละกำลังลดลงตามวัย หลีกเลี่ยงงานหักโหม'],
  },
];

/**
 * Consolidated Spec 03 Section 2 age & employment legal rules.
 * Pub leisure entry age reuses SceneSettings.pubVisitAge (default 20, configurable to 18).
 */
export const AGE_LEGAL_RULES = {
  minAnyEmploymentAge: 15,
  minPartTimeAge: 15,
  maxMinorPartTimeAge: 17,
  minorMaxDailyWorkHours: 8,
  minorMaxWeeklyWorkHours: 48, // Light daytime part-time outside school hours
  adultMaxWeeklyWorkHours: 65, // Maximum combined weekly work hours (supports 45h daytime morning+afternoon + 20h weekday evening OT)
  minorNightWorkCurfewStartHour: 22, // 22:00 - 06:00 forbidden for <18
  minorNightWorkCurfewEndHour: 6,
  minAdultFullWorkAge: 18,
  minCreditLoanAge: 18,
  defaultPubVisitAge: 20 as 18 | 20,
  minPubStaffAge: 18,
} as const;
