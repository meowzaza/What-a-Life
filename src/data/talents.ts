import type { SkillKey, TalentKind, TalentTier } from '../engine/types';

export const CENTRAL_MODIFIER_CAP = 0.40; // Combined ceiling for Talents + future Charms + Titles

export const TALENT_MAX_ACTIVE_SLOTS = 3;
export const TALENT_VAULT_MAX_SLOTS = 5;
export const TALENT_REVEAL_COOLDOWN_MONTHS = 36;

export const TALENT_TIER_BONUSES: Record<TalentTier, number> = {
  1: 0.10, // +10% (เล็ก)
  2: 0.20, // +20% (กลาง)
  3: 0.30, // +30% (ใหญ่) — reserves +10% headroom under 40% central cap
};

export const TALENT_TIER_LABELS_TH: Record<TalentTier, string> = {
  1: 'ระดับเล็ก (+10%)',
  2: 'ระดับกลาง (+20%)',
  3: 'ระดับใหญ่ (+30%)',
};

export const TALENT_DISCOVERY_THRESHOLD_REDUCTION: Record<TalentTier, number> = {
  1: 0.25, // -25% discovery threshold
  2: 0.40, // -40% discovery threshold
  3: 0.60, // -60% discovery threshold
};

export const TALENT_COUNT_WEIGHTS: Array<{ count: 0 | 1 | 2 | 3; weight: number }> = [
  { count: 0, weight: 35 },
  { count: 1, weight: 40 },
  { count: 2, weight: 20 },
  { count: 3, weight: 5 },
];

export const TALENT_TIER_SPAWN_WEIGHTS: Array<{ tier: TalentTier; weight: number }> = [
  { tier: 1, weight: 70 },
  { tier: 2, weight: 25 },
  { tier: 3, weight: 5 },
];

export interface TalentDef {
  id: string;
  nameTh: string;
  kind: TalentKind;
  categoryLabelTh: string;
  effectDescTh: string;
  targetSkills?: SkillKey[];
  gpaDeltaByTier?: Record<TalentTier, number>;
  firstImpressionBonusByTier?: Record<TalentTier, number>;
  isGenius?: boolean;
  isLimitation?: boolean;
  limitationPenaltyPct?: number;
  fixableBy?: string[];
  fixDescTh?: string;
  cureTarget?: { sessions?: number; weeks?: number };
  hintsTh: string[];
  rarityWeight: number;
}

export const POSITIVE_TALENT_DEFS: TalentDef[] = [
  {
    id: 'tal_music',
    nameTh: 'พรสวรรค์ด้านดนตรี',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'ฝึกดนตรีและการขับร้องได้เร็วขึ้นและค้นพบไวขึ้น',
    targetSkills: ['music_vocal'],
    hintsTh: [
      'เวลาได้ยินเพลงตามร้านค้า มักเผลอฮัมตามได้อย่างตรงคีย์และแม่นจังหวะ',
      'ลองจับเครื่องดนตรีไม่กี่ครั้งก็แยกเสียงสูงต่ำได้ดีกว่าคนรอบตัว',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_language',
    nameTh: 'พรสวรรค์ด้านภาษา',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'จดจำสำเนียงและโครงสร้างภาษาต่างประเทศได้ไวเป็นพิเศษ',
    targetSkills: ['foreign_lang'],
    hintsTh: [
      'ฟังบทสนทนาหรือเพลงต่างประเทศเพียงไม่กี่รอบก็พอจับสำเนียงได้ไว',
      'จำคำศัพท์ใหม่ๆ จากป้ายและสื่อรอบตัวได้แม่นโดยไม่ต้องท่องหนัก',
    ],
    rarityWeight: 10,
  },
  {
    id: 'tal_art',
    nameTh: 'พรสวรรค์ด้านศิลปะ',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'ฝึกศิลปะและการออกแบบได้เร็วและจับคู่สีได้เฉียบคม',
    targetSkills: ['visual_arts'],
    hintsTh: [
      'สังเกตแสงเงาและองค์ประกอบรอบตัวละเอียดกว่าคนทั่วไป',
      'เวลาหยิบปากกามาสเก็ตช์เล่น เส้นสายมักดูลงตัวอย่างเป็นธรรมชาติ',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_academic',
    nameTh: 'พรสวรรค์ด้านวิชาการ',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'เข้าใจเนื้อหาวิชาการไวและช่วยพยุงเกรดเฉลี่ยได้ดี',
    targetSkills: ['academic'],
    gpaDeltaByTier: { 1: 0.15, 2: 0.25, 3: 0.35 },
    hintsTh: [
      'อ่านโจทย์หรือเนื้อหาซับซ้อนรอบเดียวก็เชื่อมโยงเหตุผลได้ไว',
      'มักเป็นคนที่เพื่อนชอบมาถามวิธีสรุปบทเรียนก่อนสอบ',
    ],
    rarityWeight: 10,
  },
  {
    id: 'tal_negotiation',
    nameTh: 'พรสวรรค์ด้านการเจรจา',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'ต่อยอดธุรกิจและการสื่อสารได้คล่องและโน้มน้าวคนเก่ง',
    targetSkills: ['business', 'social'],
    hintsTh: [
      'รู้จังหวะพูดคุยต่อรองให้ทั้งสองฝ่ายรู้สึกสบายใจได้เสมอ',
      'มักจับความต้องการของคู่สนทนาได้ก่อนที่อีกฝ่ายจะพูดจบ',
    ],
    rarityWeight: 8,
  },
  {
    id: 'tal_charm',
    nameTh: 'พรสวรรค์ด้านเสน่ห์',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'สร้างความประทับใจแรกและพัฒนาทักษะเข้าสังคมได้เร็ว',
    targetSkills: ['social'],
    hintsTh: [
      'แค่ยิ้มทักทายก็ทำให้คนแปลกหน้ารู้สึกเป็นกันเองได้เร็ว',
      'เวลาอยู่ในกลุ่มคนหมู่มาก มักมีจังหวะดึงความสนใจโดยไม่ต้องพยายาม',
    ],
    rarityWeight: 8,
  },
  {
    id: 'tal_memory',
    nameTh: 'ความจำดี',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'จดจำเนื้อหาทฤษฎีและการสอบได้แม่นยำกว่าค่าเฉลี่ย',
    targetSkills: ['academic', 'foreign_lang'],
    gpaDeltaByTier: { 1: 0.10, 2: 0.18, 3: 0.25 },
    hintsTh: [
      'จำรายละเอียดเล็กๆ ที่คนอื่นลืมไปแล้วได้อย่างแม่นยำ',
      'พออ่านทบทวนเพียงสั้นๆ เนื้อหาสำคัญมักติดอยู่ในหัวได้นาน',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_focus',
    nameTh: 'สมาธิดี',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'จดจ่อกับการฝึกต่อเนื่องได้ดี ไม่เสียประสิทธิภาพจากสิ่งรบกวนง่าย',
    targetSkills: ['academic', 'tech', 'craft'],
    hintsTh: [
      'พอได้ลงมือทำสิ่งที่ตั้งใจแล้ว รอบข้างจะเสียงดังแค่ไหนก็ยังไม่หลุดโฟกัส',
      'นั่งฝึกเรื่องเดิมติดต่อกันได้นานโดยไม่วอกแวกง่าย',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_genius',
    nameTh: 'หัวไวรอบด้าน',
    kind: 'genius',
    categoryLabelTh: 'พรสวรรค์หายาก',
    effectDescTh: 'เรียนรู้ทุกทักษะได้ไวกว่าปกติและจับจุดความถนัดของตัวเองได้เร็ว',
    isGenius: true,
    gpaDeltaByTier: { 1: 0.20, 2: 0.30, 3: 0.40 },
    hintsTh: [
      'ไม่ว่าจะหยิบจับเรื่องใหม่ด้านไหน ก็มักจับหลักพื้นฐานได้เร็วผิดหูผิดตา',
      'คนรอบตัวมักทักว่าเข้าใจอะไรทะลุปรุโปร่งเกินวัยอยู่บ่อยครั้ง',
    ],
    rarityWeight: 2,
  },
  {
    id: 'tal_athletic',
    nameTh: 'พรสวรรค์ด้านกีฬา',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'ฝึกทักษะกีฬาและนาฏศิลป์ได้ไวและคล่องแคล่วเป็นพิเศษ',
    targetSkills: ['athletics', 'dance_thai_modern'],
    hintsTh: [
      'การทรงตัวและความไวในการตอบสนองร่างกายดีเกินเพื่อนรุ่นเดียวกัน',
      'ลองกีฬาหรือท่าเคลื่อนไหวใหม่ๆ ไม่กี่ครั้งก็จับจังหวะร่างกายได้ถูก',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_culinary',
    nameTh: 'พรสวรรค์ด้านรสมือ',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'ปรุงอาหารและชงเครื่องดื่มรสมือดี ฝึกสายครัวได้ไว',
    targetSkills: ['culinary'],
    hintsTh: [
      'แยกกลิ่นเครื่องเทศและกะปริมาณปรุงรสได้แม่นตั้งแต่ลองทำช่วงแรก',
      'ทำอาหารจานธรรมดาก็ออกมาอร่อยจนคนในบ้านชมไม่ขาดปาก',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_tech',
    nameTh: 'พรสวรรค์ด้านเทคโนโลยี',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'เรียนรู้ระบบดิจิทัล เครื่องมือ และโค้ดได้คล่องแคล่ว',
    targetSkills: ['tech'],
    hintsTh: [
      'เห็นโปรแกรมหรืออุปกรณ์ใหม่ๆ ไม่นานก็กดลองจนเข้าใจระบบข้างใน',
      'มองตรรกะของระบบและแก้ปัญหาเฉพาะหน้าทางดิจิทัลได้รวดเร็ว',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_craft',
    nameTh: 'พรสวรรค์ด้านงานฝีมือ',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'มือเที่ยงและสายตาดี ฝึกงานช่างและงานประดิษฐ์ได้ไว',
    targetSkills: ['craft', 'visual_arts'],
    hintsTh: [
      'งานประกอบหรือซ่อมแซมที่ต้องใช้ความละเอียด มือมักนิ่งอย่างน่าทึ่ง',
      'มองโครงสร้างสิ่งของแล้วพอเดาได้ว่าต้องแกะหรือต่อตรงไหน',
    ],
    rarityWeight: 9,
  },
  {
    id: 'tal_writing',
    nameTh: 'พรสวรรค์ด้านการเขียน',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'เรียบเรียงถ้อยคำและเล่าเรื่องได้สละสลวย ฝึกงานเขียนได้เร็ว',
    targetSkills: ['literature_writing'],
    hintsTh: [
      'เวลาเขียนบันทึกหรือเล่าเรื่องธรรมดา มักเลือกคำได้เห็นภาพชวนติดตาม',
      'ความคิดในหัวมักเรียงตัวเป็นประโยคและเรื่องเล่าได้ชัดเจนเสมอ',
    ],
    rarityWeight: 8,
  },
  {
    id: 'tal_acting',
    nameTh: 'พรสวรรค์ด้านการแสดง',
    kind: 'skill',
    categoryLabelTh: 'พรสวรรค์ผูกทักษะ',
    effectDescTh: 'สื่อสารอารมณ์ สีหน้า และน้ำเสียงบนเวทีได้อย่างเป็นธรรมชาติ',
    targetSkills: ['performing_acting'],
    hintsTh: [
      'เวลาเล่าเรื่องให้เพื่อนฟัง สีหน้าและน้ำเสียงมักชวนให้คนอินตามทันที',
      'กล้าสวมบทบาทสมมติและสื่ออารมณ์ได้ชัดโดยไม่เคอะเขิน',
    ],
    rarityWeight: 7,
  },
  {
    id: 'tal_leadership',
    nameTh: 'บารมีผู้นำ',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'ดึงดูดความไว้วางใจในกลุ่มและประสานงานสังคมได้ดี',
    targetSkills: ['social', 'business'],
    hintsTh: [
      'เวลาเกิดความวุ่นวายในกลุ่ม คนรอบตัวมักหันมามองรอฟังความเห็นของคุณ',
      'จัดแจงแบ่งงานให้เพื่อนได้อย่างพอดีจนทุกคนยอมรับ',
    ],
    rarityWeight: 7,
  },
  {
    id: 'tal_humor',
    nameTh: 'อารมณ์ขัน/มีมุก',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'ละลายบรรยากาศเก่ง ทำให้สนิทกับคนรอบข้างได้ไว',
    targetSkills: ['social', 'performing_acting'],
    hintsTh: [
      'มักมีมุกตลกสุภาพคอยผ่อนคลายบรรยากาศตึงเครียดให้วงสนทนาเสมอ',
      'แม้เจอเรื่องน่าอาย ก็พลิกมุมมองกลับมาเป็นเรื่องขำขันได้ไว',
    ],
    rarityWeight: 8,
  },
  {
    id: 'tal_empathy',
    nameTh: 'เห็นใจคนเก่ง',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'เข้าใจความรู้สึกคนอื่นลึกซึ้ง สร้างความสัมพันธ์ระยะยาวได้ดี',
    targetSkills: ['social'],
    hintsTh: [
      'จับสังเกตอารมณ์ที่ซ่อนอยู่ของคนรอบตัวได้ไวกว่าที่เขาพูดออกมา',
      'เวลามีคนไม่สบายใจ มักเป็นคนที่ใครๆ อยากเดินเข้ามาปรับทุกข์ด้วย',
    ],
    rarityWeight: 8,
  },
  {
    id: 'tal_luck',
    nameTh: 'จังหวะชีวิตดี',
    kind: 'special',
    categoryLabelTh: 'พรสวรรค์พิเศษ',
    effectDescTh: 'เพิ่มโอกาสเจอจังหวะดีๆ ในชีวิตประจำวันเล็กน้อย',
    hintsTh: [
      'บางครั้งเวลาจวนตัว มักมีจังหวะพอดีให้รอดพ้นอย่างหวุดหวิดอยู่บ่อยๆ',
      'เรื่องเล็กน้อยที่ดูจะติดขัดมักคลี่คลายได้จังหวะเหมาะอย่างไม่คาดคิด',
    ],
    rarityWeight: 3,
  },
  {
    id: 'tal_face_blessed',
    nameTh: 'รูปหน้าฟ้าประทาน',
    kind: 'personality',
    categoryLabelTh: 'พรสวรรค์ผูกบุคลิก',
    effectDescTh: 'ลุคเริ่มต้นดีขึ้น: ความประทับใจแรก +10/20/30% และเพิ่มโอกาสเข้าตาแมวมอง (ใช้ใน 3.5); ข้อแลก: ถูกจับจ้องหรือเจอเรื่องซุบซิบบ่อยขึ้น',
    targetSkills: ['social', 'performing_acting'],
    firstImpressionBonusByTier: { 1: 0.10, 2: 0.20, 3: 0.30 },
    hintsTh: [
      'เดินผ่านใครคนมักเหลียวมองและจำหน้าได้ตั้งแต่ครั้งแรกที่พบ',
      'แม้แต่งตัวเรียบง่ายก็ดูโดดเด่นสะดุดตา จนบางครั้งถูกพูดถึงลับหลัง',
    ],
    rarityWeight: 3,
  },
];

export const LIMITATION_DEFS: TalentDef[] = [
  {
    id: 'lim_slow_learner',
    nameTh: 'หัวช้าในเรื่องใหม่',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'เข้าใจเนื้อหาใหม่ช้ากว่าปกติ ต้องใช้ความพยายามซ้ำมากขึ้น (ลดความเร็ว ~15%)',
    isLimitation: true,
    limitationPenaltyPct: 0.15,
    gpaDeltaByTier: { 1: -0.25, 2: -0.35, 3: -0.45 },
    fixableBy: ['hard_study', 'tutor', 'course'],
    fixDescTh: 'แก้ได้ด้วยการพัฒนาตัวเองสม่ำเสมอ ลงคอร์ส หรือตั้งใจติวต่อเนื่อง',
    cureTarget: { sessions: 16, weeks: 12 },
    hintsTh: [
      'เวลาเจอเรื่องใหม่ต้องใช้เวลาทบทวนนานกว่าเพื่อน แต่ถ้าเข้าใจแล้วจะจำแม่น',
    ],
    rarityWeight: 18,
  },
  {
    id: 'lim_stage_fright',
    nameTh: 'ประหม่าเวที',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'ตื่นเต้นและสั่นเวลาต้องแสดงออกต่อหน้าผู้คน (ลดทักษะการแสดง/เข้าสังคม ~15%)',
    targetSkills: ['performing_acting', 'social'],
    isLimitation: true,
    limitationPenaltyPct: 0.15,
    fixableBy: ['stage_practice', 'acting_club', 'public_speaking'],
    fixDescTh: 'แก้ได้ด้วยการฝึกขึ้นเวที ชมรม หรือกิจกรรมพูดคุยสม่ำเสมอ',
    cureTarget: { sessions: 10, weeks: 8 },
    hintsTh: [
      'เวลาต้องยืนพูดต่อหน้าคนจำนวนมาก ใจมักเต้นแรงจนเสียงสั่นเล็กน้อย',
    ],
    rarityWeight: 14,
  },
  {
    id: 'lim_short_memory',
    nameTh: 'ความจำระยะสั้นแผ่ว',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'ลืมรายละเอียดทฤษฎีหรือสิ่งที่ไม่จดไว้ได้ง่าย (มีผลต่อการเรียน/สอบ)',
    targetSkills: ['academic', 'foreign_lang'],
    isLimitation: true,
    limitationPenaltyPct: 0.12,
    gpaDeltaByTier: { 1: -0.18, 2: -0.25, 3: -0.35 },
    fixableBy: ['full_sleep', 'read_review'],
    fixDescTh: 'แก้ได้ด้วยการนอนหลับให้เต็มอิ่มและทบทวนบทเรียนสม่ำเสมอ',
    cureTarget: { sessions: 12, weeks: 10 },
    hintsTh: [
      'ถ้าไม่จดบันทึกไว้ทันที มักเผลอลืมรายละเอียดที่เพิ่งฟังไปเมื่อครู่',
    ],
    rarityWeight: 14,
  },
  {
    id: 'lim_short_temper',
    nameTh: 'อารมณ์หุนหันง่าย',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'หงุดหงิดไวเมื่อถูกกดดันหรือขัดใจ ต้องฝึกควบคุมสติ',
    isLimitation: true,
    limitationPenaltyPct: 0.10,
    fixableBy: ['rest_recovery', 'therapy_reflection'],
    fixDescTh: 'แก้ได้ด้วยการพักผ่อน ดูแลใจ และฝึกใจเย็นต่อเนื่อง',
    cureTarget: { sessions: 12, weeks: 10 },
    hintsTh: [
      'พอเจอเรื่องติดขัดหรือคำพูดกวนใจ ไฟมักขึ้นไวกว่าปกติ',
    ],
    rarityWeight: 12,
  },
  {
    id: 'lim_shy',
    nameTh: 'ขี้อายและเกร็งกับคนแปลกหน้า',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'เปิดใจเข้ากลุ่มใหม่ช้า (ลดความเร็วทักษะเข้าสังคม ~15%)',
    targetSkills: ['social'],
    isLimitation: true,
    limitationPenaltyPct: 0.15,
    fixableBy: ['meet_friends', 'university_club', 'hobby_group'],
    fixDescTh: 'แก้ได้ด้วยการเข้ากลุ่ม ชมรม หรือพบปะผู้คนอย่างค่อยเป็นค่อยไป',
    cureTarget: { sessions: 10, weeks: 8 },
    hintsTh: [
      'เวลาต้องเริ่มทักทายคนที่ไม่คุ้นเคย มักลังเลและถอยมาอยู่เงียบๆ',
    ],
    rarityWeight: 14,
  },
  {
    id: 'lim_procrastinate',
    nameTh: 'ติดผัดวันประกันพรุ่ง',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'ตั้งต้นฝึกทักษะหรืออ่านหนังสือยาก (ลดความเร็วฝึกทุกทักษะ ~12%)',
    isLimitation: true,
    limitationPenaltyPct: 0.12,
    fixableBy: ['self_discipline_streak', 'hard_study'],
    fixDescTh: 'แก้ได้ด้วยการจัดตารางพัฒนาตัวเองอย่างมีวินัยต่อเนื่องหลายสัปดาห์',
    cureTarget: { sessions: 14, weeks: 8 },
    hintsTh: [
      'มักบอกตัวเองว่าเดี๋ยวค่อยเริ่มตอนอารมณ์ดี จนเวลาล่วงเลยไปเรื่อยๆ',
    ],
    rarityWeight: 16,
  },
  {
    id: 'lim_clumsy',
    nameTh: 'ซุ่มซ่ามมือไม้ไม่นิ่ง',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'ฝึกงานฝีมือ กีฬา หรือทำอาหารติดขัดช่วงแรก (~15%)',
    targetSkills: ['craft', 'athletics', 'culinary', 'dance_thai_modern'],
    isLimitation: true,
    limitationPenaltyPct: 0.15,
    fixableBy: ['workout', 'craft_practice'],
    fixDescTh: 'แก้ได้ด้วยการฝึกกีฬา ออกกำลังกาย หรือทำงานฝีมือเป็นประจำ',
    cureTarget: { sessions: 10, weeks: 8 },
    hintsTh: [
      'หยิบจับของชิ้นเล็กๆ หรือก้าวขาไวๆ มักสะดุดหรือทำหล่นอยู่บ่อยๆ',
    ],
    rarityWeight: 12,
  },
  {
    id: 'lim_burnout_prone',
    nameTh: 'ล้าและหมดไฟง่าย',
    kind: 'limitation',
    categoryLabelTh: 'ข้อจำกัดที่ฝึกแก้ได้',
    effectDescTh: 'รับภาระหนักติดต่อกันได้ไม่นาน ความเครียดขึ้นง่ายกว่าปกติ',
    isLimitation: true,
    limitationPenaltyPct: 0.10,
    fixableBy: ['rest_recovery', 'full_sleep'],
    fixDescTh: 'แก้ได้ด้วยการนอนเต็มอิ่มและพักฟื้นความเครียดต่อเนื่อง',
    cureTarget: { sessions: 12, weeks: 8 },
    hintsTh: [
      'พอเร่งงานหรือเรียนหนักติดกันหลายวัน ใจจะล้าและหมดแรงเร็วกว่าเพื่อน',
    ],
    rarityWeight: 12,
  },
];

export const ALL_TALENT_AND_LIMITATION_DEFS: TalentDef[] = [
  ...POSITIVE_TALENT_DEFS,
  ...LIMITATION_DEFS,
];

export const TALENT_DEFS_BY_ID: Map<string, TalentDef> = new Map(
  ALL_TALENT_AND_LIMITATION_DEFS.map((d) => [d.id, d])
);
