import type {
  ActivityId,
  ActivityMajorGroup,
  Slot,
  TimeAllocCategory,
} from '../engine/types';

export type ImpactArrow = 'up' | 'down' | 'neutral';

export interface ActivityImpactArrows {
  energy?: ImpactArrow;
  stress?: ImpactArrow;
  relationship?: ImpactArrow;
  skill?: ImpactArrow;
  money?: ImpactArrow;
}

export type ActivityDayPlanKind =
  | 'sleep'
  | 'work'
  | 'study'
  | 'side_gig'
  | 'social'
  | 'hobby'
  | 'family'
  | 'self_dev'
  | 'nightlife'
  | 'errand'
  | 'rest';

export type ActivityPrereq =
  | 'system_locked'
  | 'regular_job_overtime'
  | 'flexible_shift'
  | 'freelance_eligible'
  | 'side_gig_eligible'
  | 'active_course'
  | 'tier3_skill'
  | 'nightlife_age'
  | 'university_student'
  | 'coming_phase34_job'
  | 'stream_eligible'
  | 'has_child_stub'
  | 'competition_eligible';

export interface ActivityDef {
  id: ActivityId;
  nameTh: string;
  shortDescTh: string;
  majorGroup: ActivityMajorGroup;
  timeCategory: TimeAllocCategory;
  dayPlanActivity: ActivityDayPlanKind;
  allowedSlots: Slot[];
  sceneTag?: 'home' | 'school' | 'work' | 'nightlife' | 'market' | 'cafe' | 'district';
  sceneId: string;
  alternateSceneId?: string;
  evidenceKey: string;
  moneyCostPerSlot: number;
  minorPaidByParentsBelow15?: boolean;
  freeFallbackActivityId?: ActivityId;
  minAge: number;
  maxAge?: number;
  requires?: ActivityPrereq;
  lockReasonTh?: string;
  effectNotesTh: string;
  arrows: ActivityImpactArrows;
  tags?: string[];
  usesSkillFocus?: boolean;
  isOvertime?: boolean;
  isSystemOnly?: boolean;
  chainedNextSlot?: Slot;
  todoMissingSceneNote?: string;
}

export interface ActivityGroupMeta {
  id: ActivityMajorGroup;
  labelTh: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  textClass: string;
}

export const ACTIVITY_MAJOR_GROUPS: ActivityGroupMeta[] = [
  {
    id: 'work_study',
    labelTh: 'งานและการเรียน',
    bgClass: 'bg-[#FFF9DB] dark:bg-[#3A3018]',
    borderClass: 'border-[#D9A31E] dark:border-[#C99A2E]',
    badgeClass: 'bg-[#FFE58F] text-[#3D2D52]',
    textClass: 'text-[#735100] dark:text-[#FFE58F]',
  },
  {
    id: 'self_dev',
    labelTh: 'พัฒนาตัวเอง',
    bgClass: 'bg-[#F3EEFF] dark:bg-[#2F254E]',
    borderClass: 'border-[#8B6EE8] dark:border-[#9E84F7]',
    badgeClass: 'bg-[#DDD2FE] text-[#3D2D52]',
    textClass: 'text-[#4C2E99] dark:text-[#DDD2FE]',
  },
  {
    id: 'social_family',
    labelTh: 'สังคมและครอบครัว',
    bgClass: 'bg-[#FFF0F6] dark:bg-[#3D213B]',
    borderClass: 'border-[#E56B9F] dark:border-[#F08BB6]',
    badgeClass: 'bg-[#FFB8D2] text-[#3D2D52]',
    textClass: 'text-[#962253] dark:text-[#FFB8D4]',
  },
  {
    id: 'self_care',
    labelTh: 'ดูแลตัวเอง',
    bgClass: 'bg-[#ECFDF5] dark:bg-[#193A32]',
    borderClass: 'border-[#25A77B] dark:border-[#4FD1A5]',
    badgeClass: 'bg-[#A7F3D0] text-[#165940]',
    textClass: 'text-[#165940] dark:text-[#7EF4C2]',
  },
  {
    id: 'hobby_special',
    labelTh: 'งานอดิเรก',
    bgClass: 'bg-[#EFF6FF] dark:bg-[#1E2E4A]',
    borderClass: 'border-[#5B8DEF] dark:border-[#7BA8FA]',
    badgeClass: 'bg-[#BAE6FD] text-[#1E3A8A]',
    textClass: 'text-[#1E40AF] dark:text-[#BFDBFE]',
  },
  {
    id: 'rest',
    labelTh: 'พักผ่อน',
    bgClass: 'bg-[#EEF2FF] dark:bg-[#25264A]',
    borderClass: 'border-[#7E8CE0] dark:border-[#98A4F2]',
    badgeClass: 'bg-[#B4C3FF] text-[#283166]',
    textClass: 'text-[#313B7A] dark:text-[#C7D2FE]',
  },
];

export const ACTIVITY_GROUPS_BY_ID: ReadonlyMap<ActivityMajorGroup, ActivityGroupMeta> = new Map(
  ACTIVITY_MAJOR_GROUPS.map((g) => [g.id, g])
);

export const ACTIVITY_CATALOG: ActivityDef[] = [
  // === 1. งานและการเรียน (work_study) ===
  {
    id: 'school_class',
    nameTh: 'เข้าเรียนตามตาราง',
    shortDescTh: 'เรียนและทำกิจกรรมในสถานศึกษาช่วงกลางวัน',
    majorGroup: 'work_study',
    timeCategory: 'workOrStudy',
    dayPlanActivity: 'study',
    allowedSlots: ['morning', 'afternoon'],
    sceneTag: 'school',
    sceneId: 'school_public',
    evidenceKey: 'self_discipline',
    moneyCostPerSlot: 0,
    minAge: 6,
    requires: 'system_locked',
    isSystemOnly: true,
    lockReasonTh: 'จัดตารางโดยสถานศึกษาอัตโนมัติ',
    effectNotesTh: 'พัฒนาทักษะวิชาการตามวัยและสะสมวินัยการเรียน',
    arrows: { skill: 'up', energy: 'down' },
  },
  {
    id: 'work_shift',
    nameTh: 'ทำงานประจำ',
    shortDescTh: 'ทำงานหลักตามกะและสัญญาจ้างปัจจุบัน',
    majorGroup: 'work_study',
    timeCategory: 'workOrStudy',
    dayPlanActivity: 'work',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'work',
    sceneId: 'work_corporate',
    evidenceKey: 'endurance_work',
    moneyCostPerSlot: 0,
    minAge: 15,
    requires: 'system_locked',
    isSystemOnly: true,
    lockReasonTh: 'ตั้งโดยกะงานประจำปัจจุบัน',
    effectNotesTh: 'รับเงินเดือนประจำและฝึกทักษะตามสายงาน',
    arrows: { money: 'up', skill: 'up', energy: 'down', stress: 'up' },
  },
  {
    id: 'overtime_work',
    nameTh: 'ทำโอทีหลังเลิกงาน',
    shortDescTh: 'ทำงานล่วงเวลานอกกะหลัก คิดค่าแรง 1.5 เท่าตามชั่วโมงจริงในตาราง (งานรวมไม่เกิน 65 ชม./สัปดาห์)',
    majorGroup: 'work_study',
    timeCategory: 'workOrStudy',
    dayPlanActivity: 'work',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'work',
    sceneId: 'work_corporate',
    evidenceKey: 'hardWorking',
    moneyCostPerSlot: 0,
    minAge: 18,
    requires: 'regular_job_overtime',
    lockReasonTh: 'ต้องอายุ 18+ และมีงานประจำที่อนุญาตให้ทำโอที',
    effectNotesTh: 'รับค่าล่วงเวลา 1.5 เท่าตามชั่วโมงที่ลงในกริด ทั้งวันธรรมดาและวันหยุด แต่เพิ่มความเครียดและกินแรงกาย',
    arrows: { money: 'up', energy: 'down', stress: 'up', relationship: 'down' },
    isOvertime: true,
    chainedNextSlot: 'night',
  },
  {
    id: 'flexible_work',
    nameTh: 'ทำงานหลัก (จัดเวลาเอง)',
    shortDescTh: 'จัดเวลาทำงานหลักให้ครบชั่วโมงสัญญาสำหรับสายงานที่เวลายืดหยุ่น',
    majorGroup: 'work_study',
    timeCategory: 'workOrStudy',
    dayPlanActivity: 'work',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'work',
    sceneId: 'work_corporate',
    alternateSceneId: 'street_shops',
    evidenceKey: 'endurance_work',
    moneyCostPerSlot: 0,
    minAge: 18,
    requires: 'flexible_shift',
    lockReasonTh: 'ใช้ได้เฉพาะงานประจำที่ตั้งค่าเวลายืดหยุ่น',
    effectNotesTh: 'นับเป็นชั่วโมงทำงานตามสัญญา โดยผู้เล่นเลือกช่วงเวลาที่สะดวกได้เอง',
    arrows: { money: 'up', skill: 'up', energy: 'down', stress: 'up' },
  },
  {
    id: 'freelance_work',
    nameTh: 'รับงานฟรีแลนซ์',
    shortDescTh: 'รับงานอิสระตามความถนัดเฉพาะทาง (เลือกได้สูงสุด 7 ช่วง/สัปดาห์)',
    majorGroup: 'work_study',
    timeCategory: 'workOrStudy',
    dayPlanActivity: 'side_gig',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'cafe',
    sceneId: 'cafe',
    alternateSceneId: 'home',
    evidenceKey: 'independent',
    moneyCostPerSlot: 0,
    minAge: 18,
    requires: 'freelance_eligible',
    lockReasonTh: 'ต้องว่างงานประจำ ปลดล็อกสิทธิ์ฟรีแลนซ์ และมีทักษะเฉพาะทางตั้งแต่ระดับ 31 ขึ้นไป',
    effectNotesTh: 'ได้รายได้แปรผันตามระดับทักษะและจังหวะงาน มีความอิสระสูงแต่เครียดตามเดดไลน์',
    arrows: { money: 'up', stress: 'up', skill: 'up' },
    tags: ['freelance'],
  },
  {
    id: 'side_gig_work',
    nameTh: 'ทำงานเสริม',
    shortDescTh: 'เจียดเวลานอกกะหลักไปทำงานพิเศษเพิ่มรายได้',
    majorGroup: 'work_study',
    timeCategory: 'sideGig',
    dayPlanActivity: 'side_gig',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'district',
    sceneId: 'street_shops',
    alternateSceneId: 'shop_minimart',
    evidenceKey: 'self_discipline',
    moneyCostPerSlot: 0,
    minAge: 15,
    requires: 'side_gig_eligible',
    lockReasonTh: 'ต้องมีบันทึกงานเสริมที่ผ่านเกณฑ์ (ผู้เยาว์ห้ามทำช่วงดึก)',
    effectNotesTh: 'ได้รายได้เสริมเข้ากระเป๋ารายสัปดาห์ แลกพลังงานและเวลาว่าง',
    arrows: { money: 'up', energy: 'down', stress: 'up' },
  },
  {
    id: 'internship',
    nameTh: 'ฝึกงานสายอาชีพ',
    shortDescTh: 'ลงสนามฝึกงานจริงร่วมกับองค์กรภายนอกระหว่างเรียนมหาวิทยาลัย',
    majorGroup: 'work_study',
    timeCategory: 'workOrStudy',
    dayPlanActivity: 'work',
    allowedSlots: ['morning', 'afternoon'],
    sceneTag: 'work',
    sceneId: 'work_corporate',
    evidenceKey: 'hardWorking',
    moneyCostPerSlot: 0,
    minAge: 18,
    requires: 'coming_phase34_job',
    lockReasonTh: 'รอระบบสมัครงาน 3.4',
    effectNotesTh: 'รอระบบสมัครงาน 3.4 (เปิดพร้อมช่องทางสมัครฝึกงานและสายงานเต็มรูปแบบ)',
    arrows: { skill: 'up', stress: 'up' },
  },

  // === 2. พัฒนาตัวเอง (self_dev) ===
  {
    id: 'self_study',
    nameTh: 'ฝึกทักษะเองที่บ้าน',
    shortDescTh: 'ซุ่มฝึกทักษะที่เลือกโฟกัสด้วยตัวเอง (ขั้น 1: 0–29)',
    majorGroup: 'self_dev',
    timeCategory: 'selfDev',
    dayPlanActivity: 'self_dev',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'home',
    sceneId: 'home',
    evidenceKey: 'practice_any',
    moneyCostPerSlot: 0,
    minAge: 6,
    effectNotesTh: 'เพิ่มทักษะที่โฟกัสโดยไม่เสียค่าใช้จ่าย (เพดานขั้น 1 ที่ระดับ 30)',
    arrows: { skill: 'up', energy: 'down' },
    usesSkillFocus: true,
    tags: ['self_study'],
  },
  {
    id: 'attend_course',
    nameTh: 'เข้าคอร์สพัฒนาทักษะ',
    shortDescTh: 'เรียนเสริมตามหลักสูตรที่ลงทะเบียนไว้ (ขั้น 2: 30–59)',
    majorGroup: 'self_dev',
    timeCategory: 'selfDev',
    dayPlanActivity: 'self_dev',
    allowedSlots: ['morning', 'afternoon', 'evening'],
    sceneTag: 'cafe',
    sceneId: 'cafe',
    alternateSceneId: 'university',
    evidenceKey: 'practice_any',
    moneyCostPerSlot: 0,
    minAge: 15,
    requires: 'active_course',
    lockReasonTh: 'ต้องลงทะเบียนคอร์สทักษะที่หน้างานและทักษะก่อน',
    effectNotesTh: 'ปลดล็อกและเร่งการพัฒนาทักษะช่วง 30–59 ให้เต็มประสิทธิภาพ',
    arrows: { skill: 'up', energy: 'down' },
    usesSkillFocus: true,
    tags: ['course'],
  },
  {
    id: 'field_practice',
    nameTh: 'ฝึกทักษะในสนามจริง',
    shortDescTh: 'ลงมือใช้งานจริงระดับมืออาชีพ (ขั้น 3: 60–100)',
    majorGroup: 'self_dev',
    timeCategory: 'selfDev',
    dayPlanActivity: 'self_dev',
    allowedSlots: ['morning', 'afternoon', 'evening'],
    sceneTag: 'work',
    sceneId: 'work_corporate',
    alternateSceneId: 'street_shops',
    evidenceKey: 'practice_any',
    moneyCostPerSlot: 0,
    minAge: 18,
    requires: 'tier3_skill',
    lockReasonTh: 'ต้องปลดล็อกขั้น 3 ในสายงาน/การเรียนผู้ใหญ่ หรือเงื่อนไขต่อเนื่องก่อน',
    effectNotesTh: 'ต่อยอดทักษะที่โฟกัสทะลุระดับ 60–100 จากประสบการณ์จริง',
    arrows: { skill: 'up', energy: 'down', stress: 'up' },
    usesSkillFocus: true,
    tags: ['tier3_practice'],
  },
  {
    id: 'read_review',
    nameTh: 'อ่านหนังสือ / ทบทวนบทเรียน',
    shortDescTh: 'ทบทวนความรู้ อ่านหนังสือ และจัดระเบียบความคิด',
    majorGroup: 'self_dev',
    timeCategory: 'selfDev',
    dayPlanActivity: 'self_dev',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'home',
    sceneId: 'home',
    alternateSceneId: 'cafe',
    evidenceKey: 'self_discipline',
    moneyCostPerSlot: 0,
    minAge: 6,
    effectNotesTh: 'เพิ่มวินัยในตัวเองและต่อยอดทักษะสายความรู้ช้าๆ โดยไม่เสียเงิน',
    arrows: { skill: 'up' },
    todoMissingSceneNote: 'TODO(01 ข้อ 8): รอฉากห้องสมุด ใช้บ้าน/คาเฟ่เป็นฉากสำรอง',
  },

  // === 3. สังคมและครอบครัว (social_family) ===
  {
    id: 'meet_friends',
    nameTh: 'นัดเจอเพื่อน',
    shortDescTh: 'แวะคาเฟ่หรือเดินเล่นพูดคุยกับเพื่อนฝูง',
    majorGroup: 'social_family',
    timeCategory: 'social',
    dayPlanActivity: 'social',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'cafe',
    sceneId: 'cafe',
    alternateSceneId: 'street_shops',
    evidenceKey: 'social_fun',
    moneyCostPerSlot: 120,
    minorPaidByParentsBelow15: true,
    freeFallbackActivityId: 'family_time',
    minAge: 6,
    effectNotesTh: 'เสริมความสัมพันธ์กับเพื่อน ลดความเครียด (วัย 15+ มีค่าขนม/เครื่องดื่ม)',
    arrows: { relationship: 'up', stress: 'down', money: 'down' },
  },
  {
    id: 'family_time',
    nameTh: 'เวลากับครอบครัว / ช่วยงานบ้าน',
    shortDescTh: 'กินข้าว คุยกับคนในบ้าน และช่วยดูแลความเรียบร้อย',
    majorGroup: 'social_family',
    timeCategory: 'family',
    dayPlanActivity: 'family',
    allowedSlots: ['morning', 'afternoon', 'evening'],
    sceneTag: 'home',
    sceneId: 'home',
    alternateSceneId: 'restaurant_tamsang',
    evidenceKey: 'family_time',
    moneyCostPerSlot: 0,
    minAge: 4,
    effectNotesTh: 'สร้างความผูกพันในครอบครัวและช่วยผ่อนคลายความเครียด',
    arrows: { relationship: 'up', stress: 'down' },
  },
  {
    id: 'party_night',
    nameTh: 'ปาร์ตี้ / สังสรรค์กลางคืน',
    shortDescTh: 'สังสรรค์ยามค่ำคืนที่ร้านนั่งชิลล์หรือแหล่งบันเทิง',
    majorGroup: 'social_family',
    timeCategory: 'nightlife',
    dayPlanActivity: 'nightlife',
    allowedSlots: ['evening', 'night'],
    sceneTag: 'nightlife',
    sceneId: 'nightlife_pub',
    alternateSceneId: 'street_food_night',
    evidenceKey: 'night_out',
    moneyCostPerSlot: 450,
    freeFallbackActivityId: 'quiet_rest',
    minAge: 18,
    requires: 'nightlife_age',
    lockReasonTh: 'ผู้เยาว์ต่ำกว่า 18 ปีล็อกถาวร (ผู้ใหญ่ขึ้นอยู่กับเกณฑ์อายุเข้าผับในตั้งค่า)',
    effectNotesTh: 'ขยายวงสังคมยามค่ำคืน แต่มีค่าใช้จ่ายสูงและลดเวลานอน',
    arrows: { relationship: 'up', energy: 'down', money: 'down' },
  },
  {
    id: 'university_club',
    nameTh: 'ชมรม / กิจกรรมมหาวิทยาลัย',
    shortDescTh: 'ทำกิจกรรมชมรม วางแผนงานค่าย และฝึกทำงานร่วมกับเพื่อนต่างคณะ',
    majorGroup: 'social_family',
    timeCategory: 'social',
    dayPlanActivity: 'social',
    allowedSlots: ['afternoon', 'evening'],
    sceneTag: 'school',
    sceneId: 'university',
    alternateSceneId: 'cafe',
    evidenceKey: 'social_fun',
    moneyCostPerSlot: 0,
    minAge: 18,
    requires: 'university_student',
    lockReasonTh: 'เปิดเฉพาะผู้ที่กำลังศึกษาในระดับมหาวิทยาลัย (18+)',
    effectNotesTh: 'สะสมทักษะสังคมและประสบการณ์นำทีมภายในรั้วมหาวิทยาลัย',
    arrows: { relationship: 'up', skill: 'up', energy: 'down' },
  },
  {
    id: 'raise_child',
    nameTh: 'ดูแลลูก / ใช้เวลากับลูก',
    shortDescTh: 'ดูแลกิจวัตร พาเล่น และเอาใจใส่ลูกน้อยในบ้าน (ต้องจัดเวลาดูแลประจำ)',
    majorGroup: 'social_family',
    timeCategory: 'family',
    dayPlanActivity: 'family',
    allowedSlots: ['morning', 'afternoon', 'evening'],
    sceneTag: 'home',
    sceneId: 'home',
    evidenceKey: 'family_time',
    moneyCostPerSlot: 0,
    minAge: 18,
    requires: 'has_child_stub',
    lockReasonTh: 'เปิดเมื่อมีสถานะดูแลบุตรในครอบครัว',
    effectNotesTh: 'สร้างสายสัมพันธ์พ่อแม่ลูกอย่างแน่นแฟ้น (ระบบคู่ครองและลูกเต็มรูปแบบจะเปิดในขั้นถัดไป)',
    arrows: { relationship: 'up', energy: 'down' },
  },

  // === 4. ดูแลตัวเอง (self_care) ===
  {
    id: 'workout',
    nameTh: 'ออกกำลังกาย / วิ่ง',
    shortDescTh: 'ฝึกซ้อมดูแลร่างกาย วิ่ง หรือยืดเหยียดสร้างความอึด',
    majorGroup: 'self_care',
    timeCategory: 'selfDev',
    dayPlanActivity: 'hobby',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'district',
    sceneId: 'street_shops',
    alternateSceneId: 'home',
    evidenceKey: 'fitness_training',
    moneyCostPerSlot: 0,
    minAge: 6,
    effectNotesTh: 'เสริมความอึด ลดความเครียด และสะสมพฤติกรรมรักสุขภาพ',
    arrows: { energy: 'up', stress: 'down' },
    tags: ['fitness'],
    todoMissingSceneNote: 'TODO(01 ข้อ 8): รอฉากยิม/สวนสาธารณะ ใช้ street_shops/home สำรอง',
  },
  {
    id: 'skincare_grooming',
    nameTh: 'ดูแลผิว / แต่งตัว',
    shortDescTh: 'ดูแลบุคลิกภาพ แต่งตัว และบำรุงผิวพรรณให้ดูดี',
    majorGroup: 'self_care',
    timeCategory: 'selfDev',
    dayPlanActivity: 'hobby',
    allowedSlots: ['morning', 'afternoon', 'evening'],
    sceneTag: 'district',
    sceneId: 'street_shops',
    alternateSceneId: 'home',
    evidenceKey: 'self_discipline',
    moneyCostPerSlot: 180,
    freeFallbackActivityId: 'quiet_rest',
    minAge: 15,
    effectNotesTh: 'เสริมความมั่นใจและภาพลักษณ์ที่ดี (มีค่าใช้จ่ายดูแลตัวเอง)',
    arrows: { relationship: 'up', money: 'down' },
    tags: ['selfcare'],
    todoMissingSceneNote: 'TODO(01 ข้อ 8): รอฉากห้างสรรพสินค้า ใช้ street_shops/home สำรอง',
  },
  {
    id: 'health_check_rest',
    nameTh: 'พาตัวเองไปตรวจ / พักฟื้น',
    shortDescTh: 'พบแพทย์ตรวจสุขภาพเบื้องต้นและดูแลอาการอ่อนล้า',
    majorGroup: 'self_care',
    timeCategory: 'hobby',
    dayPlanActivity: 'errand',
    allowedSlots: ['morning', 'afternoon'],
    sceneTag: 'district',
    sceneId: 'hospital',
    alternateSceneId: 'home',
    evidenceKey: 'rest_recovery',
    moneyCostPerSlot: 250,
    minorPaidByParentsBelow15: true,
    freeFallbackActivityId: 'quiet_rest',
    minAge: 6,
    effectNotesTh: 'ช่วยฟื้นตัวและลดความเครียดสะสมจากการตรวจดูแลร่างกาย',
    arrows: { energy: 'up', stress: 'down', money: 'down' },
    tags: ['health_check'],
  },

  // === 5. งานอดิเรก (hobby_special) ===
  {
    id: 'hobby_leisure',
    nameTh: 'เล่นเกม / ดูซีรีส์ / งานอดิเรก',
    shortDescTh: 'ใช้เวลาว่างทำสิ่งที่ชอบ ฟังเพลง ดูซีรีส์ หรือเล่นเกมคลายเครียด',
    majorGroup: 'hobby_special',
    timeCategory: 'hobby',
    dayPlanActivity: 'hobby',
    allowedSlots: ['morning', 'afternoon', 'evening', 'night'],
    sceneTag: 'home',
    sceneId: 'home',
    alternateSceneId: 'street_shops',
    evidenceKey: 'hobby_focus',
    moneyCostPerSlot: 0,
    minAge: 4,
    effectNotesTh: 'ช่วยผ่อนคลายอารมณ์และความเครียดจากการเรียนหรือทำงาน',
    arrows: { stress: 'down' },
  },
  {
    id: 'stream_content',
    nameTh: 'สตรีม / ทำช่องคอนเทนต์',
    shortDescTh: 'จัดไลฟ์หรือทำคลิปงานอดิเรกตามความถนัดเฉพาะทาง (ยังไม่คิดรายได้ในขั้นนี้)',
    majorGroup: 'hobby_special',
    timeCategory: 'hobby',
    dayPlanActivity: 'hobby',
    allowedSlots: ['evening', 'night'],
    sceneTag: 'home',
    sceneId: 'home',
    evidenceKey: 'hobby_focus',
    moneyCostPerSlot: 0,
    minAge: 13,
    requires: 'stream_eligible',
    lockReasonTh: 'ต้องมีนิสัยคลั่งไคล้เฉพาะทาง/ใฝ่รู้หรือความคิดสร้างสรรค์ 55+ และมีชั่วโมงงานอดิเรกสะสม',
    effectNotesTh: 'สะสมผู้ติดตามและเปิดทางเหตุการณ์สายครีเอเตอร์ (รายได้เปิดในขั้นถัดไป)',
    arrows: { skill: 'up', stress: 'up' },
    tags: ['creative', 'streaming'],
  },
  {
    id: 'advanced_competition',
    nameTh: 'ลงแข่ง / กิจกรรมระดับสูง',
    shortDescTh: 'ร่วมแข่งขันกีฬาและกิจกรรมทักษะสังคมระดับสูงกับทีมนอกบ้าน',
    majorGroup: 'self_care',
    timeCategory: 'selfDev',
    dayPlanActivity: 'social',
    allowedSlots: ['morning', 'afternoon', 'evening'],
    sceneTag: 'district',
    sceneId: 'street_shops',
    alternateSceneId: 'home',
    evidenceKey: 'fitness_training',
    moneyCostPerSlot: 150,
    freeFallbackActivityId: 'workout',
    minAge: 15,
    requires: 'competition_eligible',
    lockReasonTh: 'ต้องออกกำลังกายต่อเนื่อง 8 สัปดาห์ หรือได้รับคำชวนลงแข่ง',
    effectNotesTh: 'ใช้ต่อยอดทักษะสายสุขภาพและสังคมระดับสูงเกินขั้น 60 พร้อมสร้างชื่อเสียง',
    arrows: { skill: 'up', relationship: 'up', energy: 'down', money: 'down' },
    tags: ['fitness', 'competition'],
    todoMissingSceneNote: 'TODO(01 ข้อ 8): รอฉากสนามกีฬา/ยิม ใช้ street_shops สำรอง',
  },

  // === 6. พักผ่อน (rest) ===
  {
    id: 'quiet_rest',
    nameTh: 'พักฟื้นลดเครียด (อยู่บ้านเงียบๆ)',
    shortDescTh: 'เอนหลังพักสายตา งีบ หรือปล่อยใจสบายๆ ที่บ้าน',
    majorGroup: 'rest',
    timeCategory: 'hobby',
    dayPlanActivity: 'rest',
    allowedSlots: ['morning', 'afternoon', 'evening'],
    sceneTag: 'home',
    sceneId: 'home',
    evidenceKey: 'rest_recovery',
    moneyCostPerSlot: 0,
    minAge: 0,
    effectNotesTh: 'ฟื้นฟูพลังงานระหว่างวันและลดความเครียดสะสม',
    arrows: { energy: 'up', stress: 'down' },
  },
  {
    id: 'sleep_full',
    nameTh: 'นอนเต็มอิ่ม (เข้านอนเร็ว)',
    shortDescTh: 'เข้านอนไวและหลับสนิทตลอดคืน (~10 ชม./วัน) เพิ่มชั่วโมงพักผ่อนสูงสุด',
    majorGroup: 'rest',
    timeCategory: 'sleep',
    dayPlanActivity: 'sleep',
    allowedSlots: ['night'],
    sceneTag: 'home',
    sceneId: 'home',
    evidenceKey: 'rest_recovery',
    moneyCostPerSlot: 0,
    minAge: 0,
    effectNotesTh: 'ได้ชั่วโมงนอนเต็มที่ ฟื้นพลังงานและความสดชื่นได้มากที่สุด',
    arrows: { energy: 'up', stress: 'down' },
  },
  {
    id: 'sleep_normal',
    nameTh: 'นอนปกติ',
    shortDescTh: 'พักผ่อนเข้านอนตามเวลาปกติ (~8 ชม./วัน)',
    majorGroup: 'rest',
    timeCategory: 'sleep',
    dayPlanActivity: 'sleep',
    allowedSlots: ['night'],
    sceneTag: 'home',
    sceneId: 'home',
    evidenceKey: 'rest_recovery',
    moneyCostPerSlot: 0,
    minAge: 0,
    effectNotesTh: 'รักษาวินัยการนอนสมดุลกับภาระงานและการเรียน',
    arrows: { energy: 'neutral', stress: 'neutral' },
  },
];

export const ACTIVITIES_BY_ID: ReadonlyMap<ActivityId, ActivityDef> = new Map(
  ACTIVITY_CATALOG.map((a) => [a.id, a])
);
