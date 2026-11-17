import type { ActivityId, AnnualFocusId, LifestylePresetId } from '../engine/types';

export interface AnnualFocusDef {
  id: AnnualFocusId;
  labelTh: string;
  shortDescTh: string;
  recommendedPresets: LifestylePresetId[];
  alignedActivityIds: ActivityId[];
  alignedEvidenceKeys: string[];
}

export const ANNUAL_FOCUS_CONFIG = {
  minAge: 13,
  maxChangesPerYear: 2,
  alignedEvidenceBonusPct: 0.1,
} as const;

export const ANNUAL_FOCUS_LIST: AnnualFocusDef[] = [
  {
    id: 'save_money',
    labelTh: 'เก็บเงิน',
    shortDescTh: 'เน้นสร้างเงินสำรองและรายรับเพิ่ม (ทำโอที/งานเสริม/ประหยัดให้ผลหลักฐาน +10%)',
    recommendedPresets: ['workaholic', 'work_and_gig', 'homebody'],
    alignedActivityIds: ['overtime_work', 'side_gig_work', 'freelance_work', 'work_shift', 'flexible_work'],
    alignedEvidenceKeys: ['hardWorking', 'self_discipline', 'disciplined_saving', 'endurance_work', 'independent', 'overwork'],
  },
  {
    id: 'skill_career',
    labelTh: 'ซุ่มพัฒนาทักษะ / เปลี่ยนสายงาน',
    shortDescTh: 'เร่งฝึกทักษะเฉพาะทางและลงสนามจริงเพื่อต่อยอดอาชีพ (กิจกรรมฝึกทักษะให้หลักฐาน +10%)',
    recommendedPresets: ['skill_grind', 'balanced'],
    alignedActivityIds: ['self_study', 'attend_course', 'field_practice', 'read_review', 'stream_content', 'advanced_competition'],
    alignedEvidenceKeys: ['practice_any', 'self_discipline', 'creative', 'hobby_focus'],
  },
  {
    id: 'health_recovery',
    labelTh: 'ฟื้นสุขภาพกายใจ',
    shortDescTh: 'เน้นนอนหลับเต็มอิ่ม ออกกำลังกาย และพักผ่อนลดความเครียดสะสม',
    recommendedPresets: ['fitness', 'rest_recover'],
    alignedActivityIds: ['workout', 'skincare_grooming', 'health_check_rest', 'quiet_rest', 'sleep_full', 'sleep_normal', 'advanced_competition'],
    alignedEvidenceKeys: ['fitness_training', 'rest_recovery'],
  },
  {
    id: 'family_close',
    labelTh: 'ใกล้ชิดครอบครัว',
    shortDescTh: 'ให้เวลากับคนในบ้าน ดูแลกันและสร้างความอบอุ่นในครอบครัว',
    recommendedPresets: ['family_first', 'balanced'],
    alignedActivityIds: ['family_time', 'raise_child'],
    alignedEvidenceKeys: ['family_time', 'help_others'],
  },
  {
    id: 'social_network',
    labelTh: 'ขยายเพื่อน / คอนเนกชัน',
    shortDescTh: 'พบปะผู้คน เข้าชมรม และสร้างความสัมพันธ์ในวงสังคมให้กว้างขึ้น',
    recommendedPresets: ['friends_only', 'social_party'],
    alignedActivityIds: ['meet_friends', 'university_club', 'party_night', 'advanced_competition'],
    alignedEvidenceKeys: ['social_fun', 'peer_follow', 'night_out'],
  },
  {
    id: 'study_focus',
    labelTh: 'ตั้งใจเรียน',
    shortDescTh: 'ทุ่มเทกับการเรียน อ่านทบทวน และกิจกรรมเสริมความรู้',
    recommendedPresets: ['study_focus', 'skill_grind'],
    alignedActivityIds: ['school_class', 'read_review', 'self_study', 'attend_course', 'university_club'],
    alignedEvidenceKeys: ['self_discipline', 'practice_any'],
  },
  {
    id: 'none',
    labelTh: 'ไม่ระบุ',
    shortDescTh: 'ใช้ชีวิตไปตามจังหวะปกติโดยไม่จำกัดกรอบเป้าหมายรายปี',
    recommendedPresets: ['balanced'],
    alignedActivityIds: [],
    alignedEvidenceKeys: [],
  },
];

export const ANNUAL_FOCUS_BY_ID: ReadonlyMap<AnnualFocusId, AnnualFocusDef> = new Map(
  ANNUAL_FOCUS_LIST.map((item) => [item.id, item])
);
