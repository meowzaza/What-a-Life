import type {
  ActivitySkillTagId,
  CoreSkillId,
  DiscoveredSkillId,
  SkillKey,
} from '../engine/types';

export interface SkillCatalogEntry {
  id: SkillKey;
  tierType: 'core' | 'discovered';
  labelTh: string;
  shortDescTh: string;
  unlockSourceHintTh: string;
}

export const CORE_SKILL_IDS: CoreSkillId[] = [
  'academic',
  'tech',
  'craft',
  'social',
  'business',
  'athletics',
];

export const DISCOVERED_SKILL_IDS: DiscoveredSkillId[] = [
  'visual_arts',
  'music_vocal',
  'performing_acting',
  'dance_thai_modern',
  'culinary',
  'foreign_lang',
  'literature_writing',
];

export const ALL_SKILL_IDS: SkillKey[] = [
  ...CORE_SKILL_IDS,
  ...DISCOVERED_SKILL_IDS,
];

export const DISCOVERY_THRESHOLD_SESSIONS = 8;
export const DISCOVERY_THRESHOLD_HOURS = 24;

export const SKILL_CATALOG: Record<SkillKey, SkillCatalogEntry> = {
  academic: {
    id: 'academic',
    tierType: 'core',
    labelTh: 'วิชาการและคำนวณ',
    shortDescTh: 'ช่วยด้านผลการเรียน เกรดเฉลี่ย การสอบ และงานสายวิชาการ',
    unlockSourceHintTh: 'เห็นและฝึกได้ตั้งแต่เริ่มต้น',
  },
  tech: {
    id: 'tech',
    tierType: 'core',
    labelTh: 'เทคโนโลยีและดิจิทัล',
    shortDescTh: 'ทักษะคอมพิวเตอร์ ซอฟต์แวร์ และงานดิจิทัลสมัยใหม่',
    unlockSourceHintTh: 'เห็นและฝึกได้ตั้งแต่เริ่มต้น',
  },
  craft: {
    id: 'craft',
    tierType: 'core',
    labelTh: 'งานช่างและปฏิบัติการ',
    shortDescTh: 'งานซ่อมบำรุง งานประดิษฐ์ และทักษะฝีมือปฏิบัติ',
    unlockSourceHintTh: 'เห็นและฝึกได้ตั้งแต่เริ่มต้น',
  },
  social: {
    id: 'social',
    tierType: 'core',
    labelTh: 'การสื่อสารและเข้าสังคม',
    shortDescTh: 'การพูดคุย ประสานงาน สร้างคอนเนกชัน และรับมือผู้คน',
    unlockSourceHintTh: 'เห็นและฝึกได้ตั้งแต่เริ่มต้น',
  },
  business: {
    id: 'business',
    tierType: 'core',
    labelTh: 'ธุรกิจและการจัดการ',
    shortDescTh: 'การเจรจาค้าขาย บริหารเงิน และต่อยอดกิจการ',
    unlockSourceHintTh: 'เห็นและฝึกได้ตั้งแต่เริ่มต้น',
  },
  athletics: {
    id: 'athletics',
    tierType: 'core',
    labelTh: 'ร่างกายและกีฬา',
    shortDescTh: 'ความคล่องแคล่ว ทักษะกีฬา และการเคลื่อนไหวร่างกาย',
    unlockSourceHintTh: 'เห็นและฝึกได้ตั้งแต่เริ่มต้น',
  },
  visual_arts: {
    id: 'visual_arts',
    tierType: 'discovered',
    labelTh: 'ศิลปะและการออกแบบ',
    shortDescTh: 'วาดภาพ สเก็ตช์ ออกแบบ และงานสร้างสรรค์เชิงทัศนศิลป์',
    unlockSourceHintTh: 'ค้นพบจากการวาดรูป ชมรมศิลปะ คอร์สศิลปะ หรือสายศิลปกรรม',
  },
  music_vocal: {
    id: 'music_vocal',
    tierType: 'discovered',
    labelTh: 'ดนตรีและการขับร้อง',
    shortDescTh: 'เล่นเครื่องดนตรี ร้องเพลง จับจังหวะ และฝึกดนตรีสม่ำเสมอ',
    unlockSourceHintTh: 'ค้นพบจากการซ้อมดนตรี ร้องเพลง ชมรมดนตรี หรือคอร์สดนตรี',
  },
  performing_acting: {
    id: 'performing_acting',
    tierType: 'discovered',
    labelTh: 'การแสดงและละคร',
    shortDescTh: 'สวมบทบาท พิธีกร และการสื่ออารมณ์ต่อหน้าผู้คน',
    unlockSourceHintTh: 'ค้นพบจากกิจกรรมเวที ชมรมการแสดง หรือรับบทพิธีกร',
  },
  dance_thai_modern: {
    id: 'dance_thai_modern',
    tierType: 'discovered',
    labelTh: 'นาฏศิลป์และการเต้น',
    shortDescTh: 'ทักษะรำไทย เต้นสมัยใหม่ จังหวะ และการแสดงบนเวที',
    unlockSourceHintTh: 'ค้นพบจากการซ้อมเต้น ชมรมเต้น/นาฏศิลป์ หรือกิจกรรมเชียร์',
  },
  culinary: {
    id: 'culinary',
    tierType: 'discovered',
    labelTh: 'การทำอาหารและเครื่องดื่ม',
    shortDescTh: 'ปรุงอาหาร ชงเครื่องดื่ม และต่อยอดงานครัวหรือร้านค้า',
    unlockSourceHintTh: 'ค้นพบจากการทำอาหาร ช่วยงานครัว หรือคอร์สทำอาหาร',
  },
  foreign_lang: {
    id: 'foreign_lang',
    tierType: 'discovered',
    labelTh: 'ภาษาต่างประเทศ',
    shortDescTh: 'สื่อสารภาษาสากล ปลดล็อกงานองค์กรและโอกาสต่างแดน',
    unlockSourceHintTh: 'ค้นพบจากสายศิลป์-ภาษา โรงเรียนนานาชาติ คอร์สภาษา หรือสื่อต่างประเทศ',
  },
  literature_writing: {
    id: 'literature_writing',
    tierType: 'discovered',
    labelTh: 'การเขียนและวรรณศิลป์',
    shortDescTh: 'เขียนบทความ เรียงความ เรื่องสั้น และการเล่าเรื่องอย่างมีพลัง',
    unlockSourceHintTh: 'ค้นพบจากการเขียนบันทึก อ่านนิยาย หรือชมรมวรรณศิลป์',
  },
};

export interface ActivitySkillTagMeta {
  id: ActivitySkillTagId;
  labelTh: string;
  descTh: string;
  skills: SkillKey[];
  sampleActsTh: string;
}

export const ACTIVITY_SKILL_TAGS: Record<ActivitySkillTagId, ActivitySkillTagMeta> = {
  tag_draw: {
    id: 'tag_draw',
    labelTh: 'วาดรูปและออกแบบ',
    descTh: 'ฝึกสเก็ตช์ภาพ ออกแบบ หรือลงสีสร้างสรรค์',
    skills: ['visual_arts'],
    sampleActsTh: 'วาดรูปเล่น, สมุดสเก็ตช์, ออกแบบงานศิลป์',
  },
  tag_music_play: {
    id: 'tag_music_play',
    labelTh: 'เล่นดนตรีและร้องเพลง',
    descTh: 'ซ้อมร้องเพลง ฝึกเครื่องดนตรี หรือแกะจังหวะ',
    skills: ['music_vocal'],
    sampleActsTh: 'เล่นเครื่องดนตรี, ร้องคาราโอเกะ, ชมรมดนตรี',
  },
  tag_stage: {
    id: 'tag_stage',
    labelTh: 'การแสดงและพิธีกร',
    descTh: 'ซ้อมสวมบทบาท ฝึกพูดหน้าเวที และถ่ายทอดอารมณ์',
    skills: ['performing_acting', 'social'],
    sampleActsTh: 'เป็นพิธีกร, ละครเวที, ฝึกการแสดง',
  },
  tag_move: {
    id: 'tag_move',
    labelTh: 'ซ้อมเต้นและจังหวะ',
    descTh: 'แกะท่าเต้น ฝึกนาฏศิลป์ หรือซ้อมโชว์เคลื่อนไหว',
    skills: ['dance_thai_modern', 'athletics'],
    sampleActsTh: 'เต้นตามคลิป, ชมรมเต้น/นาฏศิลป์, ซ้อมเชียร์',
  },
  tag_cook: {
    id: 'tag_cook',
    labelTh: 'ทำอาหารและชงเครื่องดื่ม',
    descTh: 'ลงมือเข้าครัว ฝึกสูตรอาหาร หรือชงเครื่องดื่ม',
    skills: ['culinary'],
    sampleActsTh: 'ช่วยงานครัว, ทำอาหารเอง, ชงเครื่องดื่ม',
  },
  tag_read_write: {
    id: 'tag_read_write',
    labelTh: 'อ่านและงานเขียน',
    descTh: 'อ่านวรรณกรรม จดบันทึก เขียนเรื่องสั้น หรือบทความ',
    skills: ['literature_writing', 'foreign_lang'],
    sampleActsTh: 'อ่านนิยาย, เขียนไดอารี่, เขียนเรียงความ',
  },
  tag_lang_media: {
    id: 'tag_lang_media',
    labelTh: 'ฝึกภาษาผ่านสื่อและบทสนทนา',
    descTh: 'ฟังสื่อต่างประเทศ ฝึกคำศัพท์ หรือคุยกับเพื่อนต่างชาติ',
    skills: ['foreign_lang'],
    sampleActsTh: 'ดูซีรีส์ฝึกภาษา, คอร์สภาษา, ฝึกสนทนา',
  },
  tag_numbers: {
    id: 'tag_numbers',
    labelTh: 'คำนวณและวิชาการ',
    descTh: 'ฝึกคิดวิเคราะห์ คิดเลขเร็ว และทบทวนความรู้เชิงระบบ',
    skills: ['academic', 'business'],
    sampleActsTh: 'ทำโจทย์เลข, ติววิชาการ, วางแผนตัวเลข',
  },
  tag_tech_play: {
    id: 'tag_tech_play',
    labelTh: 'เทคโนโลยีและโค้ดดิ้ง',
    descTh: 'ฝึกคอมพิวเตอร์ เขียนโปรแกรม หรือลองเครื่องมือดิจิทัล',
    skills: ['tech'],
    sampleActsTh: 'ลองเขียนโค้ด, ซ่อมคอม/มือถือ, ตัดต่อเบื้องต้น',
  },
  tag_make: {
    id: 'tag_make',
    labelTh: 'งานช่างและประดิษฐ์',
    descTh: 'ซ่อมของใช้ในบ้าน งานไม้ ต่อโมเดล และงานฝีมือ',
    skills: ['craft'],
    sampleActsTh: 'ต่อโมเดล, ซ่อมจักรยาน, งานไม้และงานช่าง',
  },
  tag_sell: {
    id: 'tag_sell',
    labelTh: 'ค้าขายและบริหารร้าน',
    descTh: 'เรียนรู้การจัดสินค้า คุยลูกค้า และคำนวณต้นทุน',
    skills: ['business', 'social'],
    sampleActsTh: 'ช่วยดูแลร้านครอบครัว, วิเคราะห์ตลาด',
  },
  tag_lead: {
    id: 'tag_lead',
    labelTh: 'ประสานงานและกิจกรรมกลุ่ม',
    descTh: 'ฝึกจัดงาน แบ่งหน้าที่ และสื่อสารกับคนหมู่มาก',
    skills: ['social'],
    sampleActsTh: 'ชมรมอาสา, กิจกรรมห้อง, ประสานงานทีม',
  },
  tag_sport: {
    id: 'tag_sport',
    labelTh: 'ฝึกกีฬาและสมรรถภาพ',
    descTh: 'วิ่ง เวทเทรนนิ่ง หรือซ้อมกีฬาเป็นประจำ',
    skills: ['athletics'],
    sampleActsTh: 'วิ่งออกกำลังกาย, กีฬาสี, ซ้อมทีมกีฬา',
  },
};

export const HOBBY_SELECTABLE_TAGS: ActivitySkillTagId[] = [
  'tag_draw',
  'tag_music_play',
  'tag_cook',
  'tag_read_write',
  'tag_lang_media',
  'tag_move',
  'tag_stage',
  'tag_tech_play',
  'tag_make',
  'tag_sport',
];

export const COURSE_CLUB_SELECTABLE_TAGS: ActivitySkillTagId[] = [
  'tag_numbers',
  'tag_tech_play',
  'tag_make',
  'tag_sell',
  'tag_lead',
  'tag_sport',
  'tag_lang_media',
  'tag_draw',
  'tag_music_play',
  'tag_stage',
  'tag_move',
  'tag_cook',
  'tag_read_write',
];

export function getSkillsForActivityTag(tagId: ActivitySkillTagId): SkillKey[] {
  return ACTIVITY_SKILL_TAGS[tagId]?.skills ?? [];
}
