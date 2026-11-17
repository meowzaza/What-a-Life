import type {
  LifeSubStageId,
  LifestylePresetId,
  TimeAllocCategory,
} from '../engine/types';

export interface LifestylePresetAvailability {
  minAge: number;
  maxAge?: number;
  requires?: 'job' | 'side_gig' | 'student' | 'not_working';
  forbidsStages?: LifeSubStageId[];
}

export interface LifestylePreset {
  id: LifestylePresetId;
  nameTh: string;
  summaryTh: string;
  impactSummaryTh: string;
  deltaHours: Partial<Record<TimeAllocCategory, number>>;
  evidencePerWeek: Record<string, number>;
  /** Extra health tag for Spec 05 §2.2 fitness preset */
  tags?: string[];
  availability: LifestylePresetAvailability;
}

/**
 * 12 Lifestyle Presets stored as hour deltas relative to the stage baseline (Spec 05 §2.2-2.3).
 * Never stores absolute hours so totals always resolve cleanly to 168h.
 */
export const LIFESTYLE_PRESETS: LifestylePreset[] = [
  {
    id: 'balanced',
    nameTh: 'สมดุล',
    summaryTh: 'จัดจังหวะชีวิตตามค่ามาตรฐานของช่วงวัย ไม่เร่งหรือผ่อนด้านใดเกินไป',
    impactSummaryTh: 'พลังงานและความเครียดทรงตัว',
    deltaHours: {},
    evidencePerWeek: {},
    availability: { minAge: 6 },
  },
  {
    id: 'study_focus',
    nameTh: 'ตั้งใจเรียน',
    summaryTh: 'ทุ่มเวลาให้การเรียนหรือทบทวนบทเรียนมากขึ้น ลดเวลาเที่ยวเล่นลง',
    impactSummaryTh: 'วินัยและวิชาการดีขึ้น · พักผ่อนน้อยลงเล็กน้อย',
    deltaHours: { workOrStudy: 6, hobby: -3, social: -2, family: -1 },
    evidencePerWeek: { self_discipline: 1.0 },
    availability: { minAge: 6, maxAge: 59 },
  },
  {
    id: 'kid_play',
    nameTh: 'เล่นกับเพื่อน',
    summaryTh: 'เน้นสนุกสนานกับเพื่อนฝูงและกิจกรรมที่ชอบตามประสาวัยเด็กและวัยรุ่น',
    impactSummaryTh: 'เข้าสังคมดีขึ้น · คลายเครียด · ทักษะเฉพาะทางโตช้าลง',
    deltaHours: { hobby: 5, social: 4, selfDev: -5, family: -4 },
    evidencePerWeek: { peer_follow: 1.0 },
    availability: { minAge: 6, maxAge: 17 },
  },
  {
    id: 'workaholic',
    nameTh: 'โหมงาน / โอที',
    summaryTh: 'ทุ่มชั่วโมงทำงานและรับโอทีเพิ่ม แลกเวลานอนและเวลาส่วนตัว',
    impactSummaryTh: 'รายได้เพิ่มจากโอที · เหนื่อยและความเครียดพุ่งสูง',
    deltaHours: { workOrStudy: 8, sleep: -3, social: -3, family: -2 },
    evidencePerWeek: { self_discipline: 0.9, overwork: 1.4 },
    availability: { minAge: 18, maxAge: 59, requires: 'job', forbidsStages: ['senior'] },
  },
  {
    id: 'skill_grind',
    nameTh: 'ซุ่มฝึกทักษะ',
    summaryTh: 'ดึงเวลาอดิเรกและเข้าสังคมมาซุ่มฝึกทักษะที่โฟกัสอย่างจริงจัง',
    impactSummaryTh: 'ทักษะที่โฟกัสโตไวขึ้น · เวลาพักใจและเพื่อนลดลง',
    deltaHours: { selfDev: 8, hobby: -3, social: -3, nightlife: -2 },
    evidencePerWeek: { practice_any: 1.2 },
    availability: { minAge: 18, maxAge: 59 },
  },
  {
    id: 'social_party',
    nameTh: 'ปาร์ตี้เข้าสังคม',
    summaryTh: 'ออกพบปะเพื่อนฝูงและสังสรรค์ยามค่ำคืนอย่างเต็มที่',
    impactSummaryTh: 'สังคมเด่น · มีค่าใช้จ่ายกลางคืน · นอนน้อยลง',
    deltaHours: { social: 6, nightlife: 6, sleep: -2, selfDev: -4, hobby: -3, family: -3 },
    evidencePerWeek: { night_out: 1.2, peer_follow: 1.0 },
    availability: { minAge: 18, maxAge: 59 },
  },
  {
    id: 'friends_only',
    nameTh: 'เพื่อนฝูง (ไม่มีกลางคืน)',
    summaryTh: 'ใช้เวลากับกลุ่มเพื่อนช่วงกลางวันและเย็นโดยไม่ออกเที่ยวกลางคืน',
    impactSummaryTh: 'ทักษะสังคมดีขึ้น · คลายเหงา · พัฒนาตัวเองช้าลงเล็กน้อย',
    deltaHours: { social: 8, hobby: -3, selfDev: -3, family: -2 },
    evidencePerWeek: { peer_follow: 1.0, social_fun: 0.8 },
    availability: { minAge: 13 },
  },
  {
    id: 'fitness',
    nameTh: 'รักสุขภาพ / ดูแลตัวเอง',
    summaryTh: 'จัดเวลาออกกำลังกาย ดูแลร่างกาย และฝึกวินัยสุขภาพสม่ำเสมอ',
    impactSummaryTh: 'ร่างกายและพลังฟื้นตัวดีขึ้น · ลดเวลากลางคืน',
    deltaHours: { selfDev: 6, hobby: -2, social: -2, nightlife: -2 },
    evidencePerWeek: { rest_recovery: 0.8, self_discipline: 0.6, fitness_training: 1.0 },
    tags: ['fitness'],
    availability: { minAge: 13 },
  },
  {
    id: 'homebody',
    nameTh: 'ติดบ้าน / โลกส่วนตัว',
    summaryTh: 'ชอบอยู่เงียบๆ กับงานอดิเรกที่บ้าน ลดการออกไปสุงสิงข้างนอก',
    impactSummaryTh: 'ความเครียดลดลง · ประหยัดเงิน · ความสัมพันธ์ห่างลง',
    deltaHours: { hobby: 8, social: -5, nightlife: -3 },
    evidencePerWeek: { solitude: 1.3 },
    availability: { minAge: 13 },
  },
  {
    id: 'family_first',
    nameTh: 'ทุ่มเทครอบครัว',
    summaryTh: 'แบ่งเวลาให้คนในบ้านและช่วยเหลือดูแลครอบครัวเป็นหลัก',
    impactSummaryTh: 'ความผูกพันครอบครัวแน่นแฟ้น · คลายเครียด',
    deltaHours: { family: 8, social: -3, hobby: -3, nightlife: -2 },
    evidencePerWeek: { family_time: 1.1, help_others: 0.9 },
    availability: { minAge: 13 },
  },
  {
    id: 'work_and_gig',
    nameTh: 'ทำงาน/เรียน ควบงานเสริม',
    summaryTh: 'เจียดเวลาหลังงานหรือหลังเลิกเรียนไปทำจ๊อบเสริมเพิ่มรายได้',
    impactSummaryTh: 'ได้รายได้เสริมรายสัปดาห์ · เหนื่อยและพักผ่อนน้อยลง',
    deltaHours: { sideGig: 10, social: -4, hobby: -3, sleep: -2, nightlife: -1 },
    evidencePerWeek: { self_discipline: 1.0 },
    availability: { minAge: 15, maxAge: 59, requires: 'side_gig' },
  },
  {
    id: 'rest_recover',
    nameTh: 'พักฟื้น',
    summaryTh: 'เน้นนอนเต็มอิ่มและพักผ่อนสบายๆ เพื่อลดความเครียดสะสม',
    impactSummaryTh: 'พลังงานฟื้นไว · ความเครียดลดลงชัดเจน',
    deltaHours: { sleep: 6, hobby: 2, selfDev: -4, social: -2, nightlife: -2 },
    evidencePerWeek: {},
    availability: { minAge: 6 },
  },
];

export const LIFESTYLE_PRESETS_BY_ID: ReadonlyMap<LifestylePresetId, LifestylePreset> = new Map(
  LIFESTYLE_PRESETS.map((p) => [p.id, p])
);
