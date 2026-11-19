import { filterValidatedStorylets, type StoryletDef } from '../../engine/storylet';
import { AGE_AND_EDU_STORYLETS } from './ageAndEduStorylets';
import { PLANNER_STORYLETS } from './plannerStorylets';

/**
 * Storylet Catalog for Thai Life Simulator (Phase 3).
 * 32 hand-crafted Thai storylets spanning all 4 tiers (T0-T3), all 7 categories
 * (work, romance, family, health, finance, social, quirky), and all life stages
 * (school_kid, teen, adult, senior), plus Calendar, Threshold, Hazard, Consequence,
 * Trait-gated choices, Foreshadowing, and Twist storylets.
 *
 * Strictly pure Thai text, zero emojis.
 * Minor lock: Minors (< 18) are hard-locked from adult themes.
 */
export const RAW_STORYLET_CATALOG: StoryletDef[] = [
  // ==========================================
  // T0: Silent / Background Events (5 cards)
  // ==========================================
  {
    id: 't0_street_cat_pat',
    title: 'แมวจรทักทายหน้าปากซอย',
    bodyTemplate:
      'ระหว่างเดินกลับที่พัก {firstName} เจอแมวลายสลิดมานั่งรออยู่หน้าร้านค้า อดไม่ได้ที่จะย่อตัวลูบหัวเบาๆ',
    category: 'quirky',
    tier: 'T0',
    sourceHint: 'general',
    conditions: { minAge: 6 },
    sceneTag: 'district',
    weight: 14,
  },
  {
    id: 't0_fresh_breeze_morning',
    title: 'เช้าวันฟ้าโปร่งที่บ้าน',
    bodyTemplate:
      'ลมเช้าพัดเย็นสบายใน {province} ช่วยให้ {firstName} สูดหายใจได้เต็มปอดก่อนเริ่มภารกิจของวัน',
    category: 'health',
    tier: 'T0',
    sourceHint: 'general',
    conditions: { minAge: 6 },
    daypart: 'morning',
    sceneTag: 'home',
    weight: 14,
  },
  {
    id: 't0_toddler_block_tower',
    title: 'ต่อบล็อกไม้เล่นในบ้านอย่างอารมณ์ดี',
    bodyTemplate:
      'ในวัย {age} ปี {firstName} นั่งเรียงของเล่นและหัวเราะคิกคักอยู่ใต้สายตาผู้ใหญ่ที่คอยดูแลอย่างใกล้ชิดในบ้าน',
    category: 'family',
    tier: 'T0',
    sourceHint: 'general',
    conditions: { minAge: 1, maxAge: 5 },
    daypart: 'morning',
    sceneTag: 'home',
    weight: 16,
  },
  {
    id: 't0_price_creep_noodle',
    title: 'ก๋วยเตี๋ยวเจ้าประจำปรับราคา',
    bodyTemplate:
      'ป้าร้านตามสั่งหน้าซอยขอปรับราคาขึ้นอีก 5 บาทเพราะต้นทุนวัตถุดิบ ค่าครองชีพรอบตัวค่อยๆ ขยับตามเวลา',
    category: 'finance',
    tier: 'T0',
    sourceHint: 'general',
    conditions: { minAge: 15 },
    sceneId: 'restaurant_tamsang',
    weight: 12,
  },
  {
    id: 't0_focused_study_flow',
    title: 'ชั่วโมงทำการบ้านที่ตั้งใจ',
    bodyTemplate:
      '{firstName} นั่งทบทวนบทเรียนจนจบครบทุกหน้า ความรู้และสมาธิค่อยๆ ก่อตัวขึ้นโดยไม่รู้ตัว',
    category: 'work',
    tier: 'T0',
    sourceHint: 'general',
    conditions: { minAge: 6, maxAge: 22 },
    sceneTag: 'school',
    weight: 14,
  },
  {
    id: 't0_senior_morning_park',
    title: 'จิบน้ำชายามเช้าและอ่านหนังสือพิมพ์',
    bodyTemplate:
      'ในวัย {age} ปี {firstName} ตื่นมารับแสงแดดอุ่นพร้อมจิบน้ำชาฟังข่าวสารบ้านเมืองอย่างสงบใจ',
    category: 'family',
    tier: 'T0',
    sourceHint: 'general',
    conditions: { minAge: 60 },
    daypart: 'morning',
    sceneTag: 'home',
    weight: 14,
  },

  // ==========================================
  // T1: Quick Toasts with Instant Effects (6 cards)
  // ==========================================
  {
    id: 't1_coworker_treat_tea',
    title: 'เพื่อนแวะซื้อชาเย็นมาฝาก',
    bodyTemplate:
      'คนรู้จักถือชาเย็นแก้วใหญ่มาวางให้บนโต๊ะ ความหวานชื่นใจช่วยเติมพลังยามบ่ายได้ทันตา',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    conditions: { minAge: 15 },
    sceneTag: 'cafe',
    choices: [
      {
        id: 'c1',
        label: 'รับไว้ด้วยความขอบคุณ',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 6, reason: 'ได้น้ำตาลและความสดชื่นจากชาเย็น' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'บรรยากาศเป็นกันเอง' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1, reason: 'สังสรรค์เล็กๆ ระหว่างวัน' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 't1_found_coin_sidewalk',
    title: 'เก็บธนบัตรหล่นหน้ามินิมาร์ท',
    bodyTemplate:
      '{firstName} สังเกตเห็นธนบัตร 100 บาทตกอยู่ตรงมุมมืดที่ไม่มีเจ้าของอยู่แถวนั้นเลย',
    category: 'finance',
    tier: 'T1',
    sourceHint: 'general',
    conditions: { minAge: 15 },
    sceneId: 'shop_minimart',
    choices: [
      {
        id: 'c1',
        label: 'เก็บใส่กระเป๋าเป็นโชคเล็กๆ ประจำวัน',
        effects: [
          { type: 'ChangeMoney', amount: 100, category: 'event', reason: 'เก็บเงินตกได้โดยไม่มีเจ้าของ' },
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ดีใจกับโชคลาภเล็กน้อย' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 't1_boss_compliment',
    title: 'หัวหน้าเอ่ยปากชมกลางที่ประชุม',
    bodyTemplate:
      'ผลงานล่าสุดของ {firstName} ถูกยกเป็นตัวอย่างที่ดีในทีม ความเหนื่อยที่ทุ่มเทเริ่มเห็นผล',
    category: 'work',
    tier: 'T1',
    sourceHint: 'general',
    conditions: {
      minAge: 18,
      jobIds: ['office_junior', 'sales_exec', 'sales_manager', 'software_dev', 'civil_servant'],
    },
    sceneId: 'work_corporate',
    choices: [
      {
        id: 'c1',
        label: 'ยิ้มรับและรักษามาตรฐาน',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1, reason: 'ได้รับคำชมเชยในที่ทำงาน' },
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'มีกำลังใจทำงานต่อ' },
          { type: 'RecordEvidence', key: 'praised', amount: 2, reason: 'ได้รับคำชมจากหัวหน้างาน' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 't1_home_snack_parcel',
    title: 'พัสดุของฝากจากทางบ้าน',
    bodyTemplate:
      'กล่องพัสดุจากครอบครัวส่งตรงมาถึงที่พักปัจจุบันของ {firstName} มีทั้งน้ำพริก ขนมพื้นบ้าน และข้อความสั้นๆ ถามไถ่สารทุกข์สุกดิบ',
    category: 'family',
    tier: 'T1',
    sourceHint: 'general',
    conditions: {
      minAge: 18,
      forbiddenHousingIds: ['parents_home'],
      forbiddenFlags: ['isOrphan'],
    },
    sceneTag: 'home',
    choices: [
      {
        id: 'c1',
        label: 'แกะกล่องทานอย่างอุ่นใจ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'อุ่นใจจากของฝากครอบครัว' },
          { type: 'ChangeResource', resource: 'energy', delta: 5, reason: 'อิ่มท้องด้วยของอร่อยจากบ้าน' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1.5, reason: 'ติดต่อและระลึกถึงครอบครัว' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 't1_parents_warm_dinner',
    title: 'มื้อเย็นฝีมือคนที่บ้าน',
    bodyTemplate:
      'กลับถึงบ้านหลังเลิกเรียนหรือเลิกงาน ก็ได้กลิ่นกับข้าวร้อนๆ เมนูโปรดตั้งรออยู่บนโต๊ะอาหาร พร้อมเสียงไถ่ถามสารทุกข์สุกดิบจากคนในบ้าน',
    category: 'family',
    tier: 'T1',
    sourceHint: 'general',
    conditions: {
      minAge: 6,
      maxAge: 19,
      housingIds: ['parents_home'],
      forbiddenFlags: ['isOrphan'],
    },
    daypart: 'evening',
    sceneTag: 'home',
    choices: [
      {
        id: 'c1',
        label: 'นั่งล้อมวงกินข้าวกับครอบครัวอย่างอบอุ่น',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'อุ่นใจจากมื้อค่ำกับครอบครัว' },
          { type: 'ChangeResource', resource: 'energy', delta: 6, reason: 'อิ่มท้องกับกับข้าวที่บ้าน' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1.5, reason: 'ใช้เวลาอบอุ่นร่วมกับครอบครัว' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 't1_child_vaccine_smile',
    title: 'พาไปตรวจพัฒนาการวัยเด็ก',
    bodyTemplate:
      'ผู้ใหญ่พา {firstName} ไปตรวจร่างกายประจำปี พัฒนาการสมวัยแข็งแรงร่าเริงดี แถมได้สติ๊กเกอร์การ์ตูนติดเสื้อกลับมาด้วย',
    category: 'health',
    tier: 'T1',
    sourceHint: 'general',
    conditions: { minAge: 1, maxAge: 5 },
    daypart: 'morning',
    sceneId: 'hospital',
    choices: [
      {
        id: 'c1',
        label: 'ยิ้มรับสติ๊กเกอร์จากคุณหมอ',
        effects: [
          { type: 'ChangeRawStat', stat: 'endurance', delta: 1, reason: 'ร่างกายแข็งแรงสมวัย' },
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ดีใจที่ได้สติ๊กเกอร์รางวัล' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 't1_school_teacher_sticker',
    title: 'ได้ดาวทองคำชมจากคุณครู',
    bodyTemplate:
      'คุณครูประจำชั้นชมสมุดคัดลายมือและแบบฝึกหัดของ {firstName} ว่าเรียบร้อยที่สุดในห้อง',
    category: 'work',
    tier: 'T1',
    sourceHint: 'general',
    conditions: { minAge: 6, maxAge: 12, stages: ['school_kid'] },
    sceneTag: 'school',
    choices: [
      {
        id: 'c1',
        label: 'เก็บไว้โชว์ที่บ้าน',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1, reason: 'มั่นใจในบทเรียนมากขึ้น' },
          { type: 'ModifyTeacherGpa', delta: 0.1, reason: 'ได้รับคำชมจากคุณครูประจำชั้น' },
          { type: 'RecordEvidence', key: 'praised', amount: 2, reason: 'ได้รับคำชมจากคุณครู' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 't1_songkran_calendar_splash',
    title: 'บรรยากาศสงกรานต์ชุ่มฉ่ำ',
    bodyTemplate:
      'เสียงเพลงและน้ำเย็นฉ่ำหน้าซอยในเดือนเมษายนทำให้ทั้งย่านคึกคัก {firstName} โดนประแป้งยิ้มแฉ่งกลางถนน',
    category: 'quirky',
    tier: 'T1',
    sourceHint: 'calendar',
    conditions: { calendarMonth: 4, minAge: 6 },
    sceneTag: 'district',
    choices: [
      {
        id: 'c1',
        label: 'ร่วมสนุกคลายร้อนตามประเพณี',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'ผ่อนคลายในเทศกาลสงกรานต์' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.5, reason: 'ร่วมเทศกาลชุมชน' },
        ],
      },
    ],
    weight: 18,
  },

  // ==========================================
  // T2: Interactive Dilemmas & Life Choices (15 cards)
  // ==========================================
  // --- Kid (6-12) ---
  {
    id: 't2_kid_field_day_relay',
    title: 'กีฬาสีโรงเรียน: ขาดตัววิ่งผลัดคนสุดท้าย',
    bodyTemplate:
      'วันกีฬาสีใกล้เริ่มเต็มที เพื่อนร่วมสีวิ่งมาชวน {firstName} ลงแข่งวิ่งผลัดแทนเพื่อนที่เจ็บข้อเท้า แต่เสียงเชียร์ข้างสนามดังจนน่าประหม่า',
    category: 'social',
    tier: 'T2',
    sourceHint: 'calendar',
    conditions: { minAge: 7, maxAge: 12, stages: ['school_kid'], isMinorSafe: true },
    sceneTag: 'school',
    importance: 6,
    choices: [
      {
        id: 'run_boldly',
        label: 'อาสาลงแข่งทันที วิ่งสู้เพื่อทีม',
        description: 'ฝึกความกล้าและความแข็งแรง',
        blockedByTraits: [
          {
            traitId: 'self_doubting',
            minIntensity: 'subtle',
            reasonTh: 'ขาดความมั่นใจเมื่อต้องลงแข่งต่อหน้าคนทั้งโรงเรียน',
          },
        ],
        effects: [
          { type: 'ChangeRawStat', stat: 'strength', delta: 1.5, reason: 'ลงแข่งวิ่งผลัดกีฬาสี' },
          { type: 'ChangeResource', resource: 'energy', delta: -12, reason: 'เหนื่อยจากการวิ่งแข่ง' },
          { type: 'RecordEvidence', key: 'praised', amount: 2.5, reason: 'กล้าอาสาช่วยทีมสี' },
        ],
      },
      {
        id: 'cheer_squad',
        label: 'ขอช่วยอยู่กองเชียร์และแจกน้ำข้างสนาม',
        description: 'ช่วยเพื่อนเท่าที่สบายใจ',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'คุยเล่นกับเพื่อนบนอัฒจันทร์' },
          { type: 'RecordEvidence', key: 'help_others', amount: 1.5, reason: 'ช่วยเตรียมน้ำให้เพื่อน' },
        ],
      },
    ],
    weight: 14,
  },

  // --- Teen Romance (13-17, Minor-Safe) ---
  {
    id: 't2_school_paper_confession',
    title: 'โน้ตพับหัวใจใต้โต๊ะเรียน',
    bodyTemplate:
      'หลังพักเที่ยง {firstName} เปิดโต๊ะเรียนแล้วเจอกระดาษโน้ตพับอย่างประณีต เขียนข้อความแอบให้กำลังใจก่อนสอบพร้อมลายเซ็นย่อของเพื่อนต่างห้อง',
    category: 'romance',
    tier: 'T2',
    sourceHint: 'general',
    conditions: {
      minAge: 13,
      maxAge: 17,
      stages: ['teen'],
      isMinorSafe: true,
    },
    sceneId: 'school_public',
    importance: 6,
    choices: [
      {
        id: 'write_back_sweet',
        label: 'เขียนโน้ตตอบขอบคุณกลับอย่างสุภาพ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'ใจฟูกับความรู้สึกดีวัยเรียน' },
          { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'เปิดใจสื่อสารอย่างสุภาพ' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.5, reason: 'พูดคุยอย่างอบอุ่นกับเพื่อน' },
        ],
      },
      {
        id: 'focus_exam',
        label: 'เก็บไว้เป็นกำลังใจเงียบๆ แล้วโฟกัสอ่านหนังสือสอบ',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1.5, reason: 'มุ่งมั่นเตรียมสอบ' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'คุมสมาธิกับเป้าหมายการเรียน' },
        ],
      },
    ],
    weight: 12,
  },

  // --- Teen Risk / Peer Pressure ---
  {
    id: 't2_teen_skip_tutor_arcade',
    title: 'เพื่อนชวนโดดเรียนพิเศษไปเดินสยาม/ห้าง',
    bodyTemplate:
      'เลิกเรียนตอนเย็น เพื่อนกลุ่มสนิทชวนโดดคอร์สกวดวิชาไปเดินเล่นตลาดนัดและกินของอร่อย บอกว่า "โดดครั้งเดียวไม่เป็นไรหรอก"',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    conditions: { minAge: 15, maxAge: 17, stages: ['teen'], isMinorSafe: true },
    sceneTag: 'district',
    daypart: 'afternoon',
    importance: 6,
    choices: [
      {
        id: 'join_friends_hangout',
        label: 'ไปกับเพื่อน คลายเครียดสักวัน (-250 บ.)',
        costCash: 250,
        effects: [
          { type: 'ChangeMoney', amount: -250, category: 'event', reason: 'ค่าขนมและเที่ยวเล่นกับเพื่อน' },
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'สนุกกับกลุ่มเพื่อน' },
          { type: 'RecordEvidence', key: 'peer_follow', amount: 2.5, reason: 'ตามใจเพื่อนโดดกวดวิชา' },
        ],
      },
      {
        id: 'attend_tutor_class',
        label: 'ปฏิเสธเพื่อนแล้วเดินเข้าห้องเรียนพิเศษตามนัด',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 2, reason: 'เข้าเรียนพิเศษครบถ้วน' },
          { type: 'ChangeResource', resource: 'stress', delta: 3, reason: 'เหนื่อยจากการเรียนต่อเนื่อง' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 2.5, reason: 'ไม่หวั่นไหวต่อคำชวน' },
        ],
      },
    ],
    weight: 12,
  },

  // --- Adult Romance ---
  {
    id: 't2_adult_dating_dinner',
    title: 'นัดทานข้าวมื้อค่ำริมน้ำ',
    bodyTemplate:
      'คนที่กำลังคุยด้วยชวนไปทานมื้อค่ำบรรยากาศดีหลังเลิกงาน แต่ร้านที่เลือกดูท่าทางราคาพอตัวทีเดียว',
    category: 'romance',
    tier: 'T2',
    sourceHint: 'general',
    conditions: { minAge: 18, maxAge: 59 },
    sceneTag: 'cafe',
    daypart: 'evening',
    importance: 7,
    choices: [
      {
        id: 'go_dinner_split',
        label: 'ไปตามนัดและเสนอช่วยกันหารค่าอาหาร (-500 บ.)',
        costCash: 500,
        effects: [
          { type: 'ChangeMoney', amount: -500, category: 'event', reason: 'แชร์ค่ามื้อค่ำ' },
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'ผ่อนคลายกับบทสนทนาที่ดี' },
          { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'สานสัมพันธ์ระหว่างมื้อค่ำ' },
        ],
      },
      {
        id: 'go_dinner_treat',
        label: 'อาสาเป็นเจ้ามือเลี้ยงทั้งมื้อเพื่อสร้างความประทับใจ (-1,100 บ.)',
        costCash: 1100,
        blockedByTraits: [
          {
            traitId: 'strict_saver',
            minIntensity: 'clear',
            reasonTh: 'นิสัยประหยัดเข้มงวดไม่ยอมควักจ่ายเกินงบโดยไม่จำเป็น',
          },
        ],
        effects: [
          { type: 'ChangeMoney', amount: -1100, category: 'event', reason: 'เลี้ยงข้าวมื้อพิเศษ' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 1.5, reason: 'สร้างความประทับใจอย่างอบอุ่น' },
          { type: 'RecordEvidence', key: 'overspending', amount: 1.5, reason: 'จ่ายเงินเลี้ยงคนคุยเกินงบ' },
        ],
      },
      {
        id: 'suggest_tamsang_instead',
        label: 'ชวนเปลี่ยนไปกินร้านตามสั่งหรือซอยของกินแทน (-150 บ.)',
        costCash: 150,
        effects: [
          { type: 'ChangeMoney', amount: -150, category: 'event', reason: 'ทานข้าวแบบประหยัด' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'คุมงบประมาณการเดต' },
        ],
      },
      {
        id: 'walk_and_talk_instead',
        label: 'ชวนไปเดินเล่นคุยกันที่สวนสาธารณะแทนมื้อหรู',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'เดินเล่นรับลมคุยกันสบายใจ' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 2, reason: 'ประหยัดงบเดตอย่างสร้างสรรค์' },
        ],
      },
    ],
    weight: 12,
  },

  // --- Work T2 ---
  {
    id: 't2_work_overtime_urgent',
    title: 'ลูกค้าแก้สเปกด่วนช่วงหัวค่ำ',
    bodyTemplate:
      'ใกล้เวลาเลิกงานเต็มที แต่มีงานด่วนเข้ามา หัวหน้าถามหาอาสาสมัครอยู่ทำโอทีคืนนี้พร้อมค่าล่วงเวลาพิเศษ',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    conditions: {
      minAge: 18,
      jobIds: ['office_junior', 'sales_exec', 'sales_manager', 'software_dev', 'civil_servant', 'technician'],
    },
    sceneId: 'work_corporate',
    daypart: 'evening',
    importance: 6,
    choices: [
      {
        id: 'accept_ot',
        label: 'อยู่ลุยโอทีต่อจนดึก (+1,400 บ.)',
        description: 'ได้เงินพิเศษและสร้างความประทับใจ แต่กินแรงมาก',
        blockedByTraits: [
          {
            traitId: 'slacker',
            minIntensity: 'clear',
            reasonTh: 'นิสัยขี้เกียจทำให้หลีกเลี่ยงงานโอทีนอกเวลา',
          },
        ],
        effects: [
          { type: 'ChangeMoney', amount: 1400, category: 'side', reason: 'ค่าล่วงเวลาพิเศษ' },
          { type: 'ChangeResource', resource: 'energy', delta: -18, reason: 'ทำงานล่วงเวลาจนดึก' },
          { type: 'ChangeResource', resource: 'stress', delta: 7, reason: 'เร่งปิดงานด่วน' },
          { type: 'RecordEvidence', key: 'overwork', amount: 2, reason: 'อยู่ทำโอทีเกินเวลา' },
          { type: 'RecordEvidence', key: 'endurance_work', amount: 1.5, reason: 'รับผิดชอบงานเร่งด่วน' },
        ],
      },
      {
        id: 'decline_ot',
        label: 'ขอตัวกลับตามเวลาเพื่อรักษาสุขภาพ',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 8, reason: 'ได้กลับไปพักผ่อนตรงเวลา' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ไม่แบกงานเกินกำลัง' },
          { type: 'RecordEvidence', key: 'rest_recovery', amount: 1.5, reason: 'รู้จักวางขอบเขตเวลาทำงาน' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 't2_warehouse_rush_order',
    title: 'ล็อตสินค้าทะลักหน้าโกดัง',
    bodyTemplate:
      'รถขนส่งมาจอดเรียงคิวรับของล็อตใหญ่ หัวหน้ากะชวนเร่งมือทำยอดให้เสร็จไวเพื่อรับเบี้ยขยันพิเศษ',
    category: 'work',
    tier: 'T2',
    sourceHint: 'hazard',
    conditions: {
      minAge: 18,
      jobIds: ['convenience_staff', 'food_rider', 'technician', 'small_business'],
    },
    sceneId: 'work_warehouse',
    importance: 7,
    choices: [
      {
        id: 'rush_speed',
        label: 'เร่งยกแข่งเวลาเอาเบี้ยขยัน (+900 บ.)',
        effects: [
          { type: 'ChangeMoney', amount: 900, category: 'side', reason: 'เบี้ยขยันงานเร่งด่วน' },
          { type: 'ChangeResource', resource: 'energy', delta: -16, reason: 'ออกแรงหนักต่อเนื่อง' },
          { type: 'RecordEvidence', key: 'endurance_work', amount: 2, reason: 'อึดลุยงานหนัก' },
        ],
        twistChance: 0.25,
        twistEffects: [
          { type: 'ChangeRawStat', stat: 'endurance', delta: -2, reason: 'กล้ามเนื้ออักเสบจากการยกของเร็วเกินไป' },
          { type: 'ChangeMoney', amount: -450, category: 'event', reason: 'ซื้อยานวดและยาแก้ปวด' },
        ],
        twistSummary: 'ยกผิดจังหวะจนหลังยอก ต้องควักเงินซื้อยาทาแก้ปวดและพักฟื้น',
      },
      {
        id: 'safety_first',
        label: 'ทำตามขั้นตอนปลอดภัย ช้าหน่อยแต่ไม่เจ็บตัว',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -7, reason: 'ทำงานตามจังหวะปกติ' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'รักษามาตรฐานความปลอดภัย' },
        ],
      },
    ],
    weight: 11,
  },

  // --- Stat Threshold Triggers (Burnout & Low Cash) ---
  {
    id: 't2_threshold_burnout_warning',
    title: 'ร่างกายประท้วงจากความเครียดสะสม',
    bodyTemplate:
      '{firstName} ตื่นเช้ามาพร้อมอาการมึนหัวและใจสั่น งานและความคิดเรื่องเงินวนเวียนไม่หยุดถึงเวลาต้องตัดสินใจว่าจะฝืนต่อหรือหยุดเบรก',
    category: 'health',
    tier: 'T2',
    sourceHint: 'stat_threshold',
    conditions: {
      minAge: 16,
      minStress: 76,
    },
    sceneTag: 'home',
    importance: 8,
    choices: [
      {
        id: 'take_mental_day_off',
        label: 'หยุดพัก 1 วันเต็ม ปิดมือถือและนอนฟื้นฟู',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -18, reason: 'ตัดขาดความวุ่นวายเพื่อพักใจ' },
          { type: 'ChangeResource', resource: 'energy', delta: 22, reason: 'นอนหลับพักผ่อนเต็มอิ่ม' },
          { type: 'RecordEvidence', key: 'rest_recovery', amount: 3, reason: 'ฟังเสียงเตือนของร่างกาย' },
        ],
      },
      {
        id: 'push_through_coffee',
        label: 'อัดกาแฟเข้มๆ ฝืนลากสังขารไปทำงานต่อ (-85 บ.)',
        costCash: 85,
        effects: [
          { type: 'ChangeMoney', amount: -85, category: 'living', reason: 'ซื้อกาแฟประคองอาการล้า' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'ฝืนกดความเครียดไว้ต่อไป' },
          { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'ใช้พลังงานสำรองจนหมด' },
          { type: 'RecordEvidence', key: 'overwork', amount: 2.5, reason: 'ไม่ยอมหยุดพักแม้ร่างกายเตือน' },
        ],
      },
    ],
    weight: 22,
    cooldownYears: 1,
  },
  {
    id: 't2_threshold_low_cash_hustle',
    title: 'กระเป๋าสตางค์ตึงเปรี๊ยะปลายเดือน',
    bodyTemplate:
      'เปิดแอปธนาคารดูยอดเหลือ {cash} บาท ค่ากินอยู่และค่าเดินทางกำลังจ่อคิวเข้ามา ต้องรีบหาทางหมุนเงินด่วน',
    category: 'finance',
    tier: 'T2',
    sourceHint: 'stat_threshold',
    conditions: {
      minAge: 18,
      maxCash: 1600,
    },
    sceneId: 'street_shops',
    importance: 8,
    choices: [
      {
        id: 'sell_unused_items',
        label: 'รื้อของใช้สภาพดีในห้องไปโพสต์ขายมือสอง (+1,500 บ.)',
        effects: [
          { type: 'ChangeMoney', amount: 1500, category: 'side', reason: 'ขายของใช้มือสองหมุนสภาพคล่อง' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'เหนื่อยแพ็กของส่งลูกค้า' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'แก้ปัญหาเงินตึงตัวด้วยตัวเอง' },
        ],
      },
      {
        id: 'pawn_quick_cash',
        label: 'จำนำของมีค่าชิ้นเล็กหมุนใช้ก่อน 2,000 บาท',
        effects: [
          { type: 'ChangeMoney', amount: 2000, category: 'debt', reason: 'เงินหมุนฉุกเฉินจากโรงรับจำนำ' },
          { type: 'AddDebt', amount: 2200, reason: 'ตั๋วจำนำพร้อมดอกเบี้ย' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'กังวลเรื่องไถ่ถอนของคืน' },
        ],
      },
    ],
    weight: 20,
    cooldownYears: 1,
  },

  // --- Family & Consequence Chain ---
  {
    id: 't2_family_borrow_money',
    title: 'ญาติสนิทโทรมาขอยืมเงินฉุกเฉิน',
    bodyTemplate:
      'ญาติโทรมาเสียงสั่น บอกว่ารถทำมาหากินเสียกะทันหัน ขอยืม 3,000 บาท เดี๋ยวสิ้นเดือนหน้าจะโอนคืนให้ แต่ที่ผ่านมาเคยมีประวัติผ่อนผันมาแล้ว',
    category: 'family',
    tier: 'T2',
    sourceHint: 'general',
    conditions: { minAge: 18, minCash: 3000 },
    sceneTag: 'home',
    importance: 7,
    consequenceStoryletId: 't2_consequence_relative_repay',
    consequenceDelayMonths: 2,
    choices: [
      {
        id: 'lend_full',
        label: 'โอนให้ยืม 3,000 บาทเต็มจำนวน ช่วยคนในบ้าน',
        costCash: 3000,
        effects: [
          { type: 'ChangeMoney', amount: -3000, category: 'event', reason: 'ให้ญาติยืมเงินซ่อมรถ' },
          { type: 'AdjustPersonality', axis: 'agreeableness', delta: 1.2, reason: 'ยอมช่วยเหลือญาติในยามลำบาก' },
          { type: 'AddFlag', flag: 'lent_relative_money', value: true, reason: 'ให้ญาติยืมเงินไว้ 3,000 บาท' },
          { type: 'RecordEvidence', key: 'help_others', amount: 2, reason: 'ช่วยเหลือญาติ' },
        ],
      },
      {
        id: 'give_small_aid',
        label: 'ช่วยสมทบให้เปล่า 1,000 บาทเท่าที่ไหว',
        costCash: 1000,
        effects: [
          { type: 'ChangeMoney', amount: -1000, category: 'event', reason: 'ช่วยค่าซ่อมรถญาติแบบไม่หวังคืน' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1.5, reason: 'เกื้อกูลคนในครอบครัวตามกำลัง' },
        ],
      },
      {
        id: 'refuse_polite',
        label: 'ขอโทษและปฏิเสธตรงๆ ว่ากำลังเก็บเงินสำรอง',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'อึดอัดใจหลังปฏิเสธญาติ' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'ปกป้องเงินสำรองส่วนตัว' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 't2_consequence_relative_repay',
    title: 'ผลพวงเงินที่ให้ญาติยืมคราวก่อน',
    bodyTemplate:
      'ผ่านไปสองเดือนเต็ม ญาติที่เคยขอยืมเงิน 3,000 บาทติดต่อกลับมาอีกครั้ง ถึงเวลาดูผลลัพธ์จากน้ำใจในวันนั้น',
    category: 'family',
    tier: 'T2',
    sourceHint: 'consequence',
    conditions: {
      minAge: 18,
      requiredFlags: ['lent_relative_money'],
    },
    sceneTag: 'home',
    importance: 7,
    isOneOff: true,
    choices: [
      {
        id: 'check_repay_outcome',
        label: 'รับสายฟังคำตอบจากอีกฝ่าย',
        effects: [
          { type: 'RemoveFlag', flag: 'lent_relative_money', reason: 'ปิดเรื่องยืมเงินญาติ' },
        ],
        twistChance: 0.5,
        twistEffects: [
          { type: 'ChangeMoney', amount: 3500, category: 'event', reason: 'ญาติคืนเงินครบพร้อมดอกเบี้ยน้ำใจและขนมฝาก' },
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'โล่งใจที่ได้เงินคืนครบ' },
          { type: 'RemoveFlag', flag: 'lent_relative_money', reason: 'ญาติใช้หนี้ครบแล้ว' },
        ],
        twistSummary: 'ญาติโอนคืนครบ 3,000 บาทพร้อมแถมสินน้ำใจอีก 500 บาทและคำขอบคุณ',
      },
      {
        id: 'forgive_and_close',
        label: 'ถ้าเขายังลำบากก็บอกให้ทยอยคืนไม่ต้องกดดัน',
        effects: [
          { type: 'ChangeMoney', amount: 1000, category: 'event', reason: 'ญาติทยอยคืนงวดแรก 1,000 บาท' },
          { type: 'RemoveFlag', flag: 'lent_relative_money', reason: 'ตกลงผ่อนคืนแบบไม่ติดใจ' },
        ],
      },
    ],
    weight: 1,
  },

  // --- Health / Hazard ---
  {
    id: 't2_food_poisoning_street',
    title: 'อาหารเป็นพิษหลังมื้อดึก',
    bodyTemplate:
      'ช่วงดึกหลังจัดเมนูรสจัดข้างทาง {firstName} เริ่มปวดบิดท้องและเวียนหัวจนแทบยืนไม่ไหว',
    category: 'health',
    tier: 'T2',
    sourceHint: 'hazard',
    conditions: { minAge: 15 },
    sceneId: 'street_food_night',
    daypart: 'night',
    importance: 7,
    choices: [
      {
        id: 'buy_pharmacy_medicine',
        label: 'แวะซื้อเกลือแร่และยาฆ่าเชื้อร้านขายยา (-180 บ.)',
        costCash: 180,
        effects: [
          { type: 'ChangeMoney', amount: -180, category: 'living', reason: 'ค่ายาแก้ท้องเสียและเกลือแร่' },
          { type: 'ChangeResource', resource: 'energy', delta: -12, reason: 'อ่อนเพลียจากอาการท้องเสีย' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: -0.5, reason: 'ร่างกายอ่อนล้าชั่วคราว' },
        ],
      },
      {
        id: 'go_er_clinic',
        label: 'เข้าตรวจโรงพยาบาลให้น้ำเกลือให้หายขาด (-900 บ. · พัก 2 วัน)',
        description: 'แพทย์ดูแลให้น้ำเกลือและยาฆ่าเชื้อ นอนพักฟื้น 2 วันแล้วหายเป็นปกติ',
        costCash: 900,
        effects: [
          { type: 'ChangeMoney', amount: -900, category: 'living', reason: 'ค่ารักษาและน้ำเกลือที่โรงพยาบาล' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'อุ่นใจเมื่อถึงมือแพทย์' },
          {
            type: 'StartScene',
            sceneId: 'hospital',
            daypart: 'night',
            durationDays: 2,
            reason: 'นอนให้น้ำเกลือรักษาอาหารเป็นพิษ (2 วัน)',
            returnSummary: 'ได้รับน้ำเกลือครบและหายจากอาหารเป็นพิษแล้ว แพทย์อนุญาตให้กลับบ้านได้',
          },
        ],
      },
      {
        id: 'endure_it',
        label: 'ประหยัดเงิน อดทนดื่มน้ำอุ่นรอหายเอง (เสี่ยงอ่อนเพลียค้าง)',
        description: 'อาจยังมีอาการปวดบิดและขาดน้ำหลงเหลือในอีกไม่กี่วันถัดไป',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -22, reason: 'ร่างกายขาดน้ำและอ่อนแรงหนัก' },
          { type: 'ChangeResource', resource: 'stress', delta: 8, reason: 'ทรมานจากอาการปวดท้องทั้งคืน' },
          {
            type: 'ScheduleEcho',
            delayDays: 2,
            title: 'ผลข้างเคียงจากการไม่ยอมรักษาอาหารเป็นพิษ',
            description: 'อาการขาดน้ำและอ่อนเพลียยังไม่หายขาด ทำให้ต้องลางาน/พักเพิ่มอีกวัน',
            effects: [
              { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'อาการท้องเสียยืดเยื้อ' },
            ],
            sourceEventId: 't2_food_poisoning_street',
          },
        ],
      },
    ],
    weight: 12,
  },

  // --- Finance Scam / Trait-Linked ---
  {
    id: 't2_phone_scam_call',
    title: 'สายมิจฉาชีพอ้างเป็นเจ้าหน้าที่พัสดุ',
    bodyTemplate:
      'เบอร์แปลกโทรเข้ามาเสียงเข้ม อ้างว่ามีพัสดุผิดกฎหมายค้างที่ด่าน ให้แอดไลน์ยืนยันตัวตนและโอนเงินตรวจสอบบัญชี',
    category: 'finance',
    tier: 'T2',
    sourceHint: 'hazard',
    conditions: { minAge: 16 },
    sceneTag: 'district',
    importance: 7,
    choices: [
      {
        id: 'hang_up_scam',
        label: 'ตัดสายทิ้งทันทีแล้วบล็อกเบอร์',
        effects: [
          { type: 'ChangeRawStat', stat: 'wit', delta: 0.8, reason: 'รู้เท่าทันกลโกงคอลเซ็นเตอร์' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1, reason: 'ระมัดระวังทรัพย์สิน' },
        ],
      },
      {
        id: 'panic_verify_link',
        label: 'ตกใจหลงเชื่อกดลิงก์เช็กข้อมูล (เสี่ยงถูกดูดเงิน)',
        blockedByTraits: [
          {
            traitId: 'cautious_planner',
            minIntensity: 'subtle',
            reasonTh: 'นิสัยรอบคอบวางแผนล่วงหน้าไม่หลงกลเบอร์แปลกง่ายๆ',
          },
        ],
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 10, reason: 'ตื่นตระหนกกับคำขู่' },
          { type: 'RecordEvidence', key: 'risk_taking', amount: 1.5, reason: 'ประมาทกดลิงก์ไม่น่าเชื่อถือ' },
        ],
        twistChance: 0.45,
        twistEffects: [
          { type: 'ChangeMoney', amount: -4500, category: 'event', reason: 'ถูกมิจฉาชีพดูดเงินจากลิงก์ปลอม' },
          { type: 'ChangeResource', resource: 'stress', delta: 16, reason: 'เครียดหนักหลังถูกหลอกโอนเงิน' },
        ],
        twistSummary: 'มิจฉาชีพดูดเงินออกจากบัญชีไป 4,500 บาทก่อนจะรู้ตัว',
      },
    ],
    weight: 12,
  },

  // --- Trait-Conditioned Storylets (Phase 2 -> Phase 3 Integration) ---
  {
    id: 't2_party_lover_afterparty',
    title: 'กลุ่มสายตี้ชวนต่ออาฟเตอร์ปาร์ตี้กลางดึก',
    bodyTemplate:
      'เสียงเพลงในผับกำลังมันได้ที่ เพื่อนสายสังสรรค์ยกแก้วชวน {firstName} เปิดโต๊ะต่อรอบดึก บอกคืนนี้ต้องสุด',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    conditions: {
      minAge: 20,
      requiredTraits: ['party_lover'],
    },
    sceneId: 'nightlife_pub',
    daypart: 'night',
    importance: 7,
    choices: [
      {
        id: 'go_all_out_party',
        label: 'ลุยต่อเต็มสูบ เลี้ยงรอบวง (-1,500 บ.)',
        costCash: 1500,
        effects: [
          { type: 'ChangeMoney', amount: -1500, category: 'event', reason: 'ค่าเครื่องดื่มรอบดึกที่ผับ' },
          { type: 'ChangeResource', resource: 'stress', delta: -12, reason: 'ปลดปล่อยเต็มที่กับเพื่อน' },
          { type: 'ChangeResource', resource: 'energy', delta: -18, reason: 'นอนดึกโต้รุ่ง' },
          { type: 'RecordEvidence', key: 'night_out', amount: 2.5, reason: 'สังสรรค์โต้รุ่ง' },
        ],
      },
      {
        id: 'slip_home_early',
        label: 'ขอตัวกลับก่อนตั้งแต่งานยังไม่เลิก (-300 บ.)',
        costCash: 300,
        effects: [
          { type: 'ChangeMoney', amount: -300, category: 'event', reason: 'จ่ายเฉพาะส่วนของตัวเองแล้วกลับ' },
          { type: 'ChangeResource', resource: 'energy', delta: 6, reason: 'ได้กลับไปนอนเร็วขึ้น' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'คุมงบปาร์ตี้ได้' },
        ],
      },
      {
        id: 'say_goodnight_free',
        label: 'โบกมือลาเพื่อนกลับบ้านทันที (งดต่อ)',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 8, reason: 'รีบกลับมานอนพักผ่อน' },
          { type: 'RecordEvidence', key: 'rest_recovery', amount: 1.5, reason: 'เลือกพักผ่อนแทนเที่ยวต่อ' },
        ],
      },
    ],
    weight: 15,
  },
  {
    id: 't2_risk_taker_crypto_share',
    title: 'วงแชร์ลูกโซ่ / เหรียญซิ่งชวนลงขัน',
    bodyTemplate:
      'คนรู้จักสายซิ่งกระซิบชวนลงขันโปรเจกต์ผลตอบแทนสูง อ้างว่าได้กำไรเท่าตัวในไม่กี่เดือน ตรงสเปกสายชอบเสี่ยงโชคพอดี',
    category: 'finance',
    tier: 'T2',
    sourceHint: 'hazard',
    conditions: {
      minAge: 18,
      minCash: 5000,
      requiredTraits: ['risk_taker'],
    },
    sceneTag: 'cafe',
    importance: 8,
    choices: [
      {
        id: 'bet_big_deal',
        label: 'ทุ่มลงขันลุ้นรวยไว (-5,000 บ.)',
        costCash: 5000,
        effects: [
          { type: 'ChangeMoney', amount: -5000, category: 'event', reason: 'ลงขันลงทุนความเสี่ยงสูง' },
          { type: 'RecordEvidence', key: 'risk_taking', amount: 3, reason: 'กล้าเสี่ยงเงินก้อนใหญ่' },
        ],
        twistChance: 0.45,
        twistEffects: [
          { type: 'ChangeMoney', amount: 11000, category: 'event', reason: 'ขายทำกำไรทันจังหวะก่อนวงแตก' },
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'ดีใจที่ได้กำไรก้อนโต' },
        ],
        twistSummary: 'จังหวะดีเหลือเชื่อ ถอนทุนคืนพร้อมกำไรรวม 11,000 บาทก่อนตลาดร่วง!',
      },
      {
        id: 'walk_away_safe',
        label: 'ถอยออกมาตั้งสติ เก็บเงินสดไว้กับตัวดีกว่า',
        effects: [
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 2.5, reason: 'ห้ามใจไม่ลงดีลเสี่ยง' },
        ],
      },
    ],
    weight: 16,
  },

  // --- Senior Storylets (60+) ---
  {
    id: 't2_senior_hospital_checkup',
    title: 'นัดตรวจสุขภาพประจำปีวัยเก๋า',
    bodyTemplate:
      'ในวัย {age} ปี หมอนัดตรวจความดัน น้ำตาล และกระดูกที่โรงพยาบาล พร้อมชวนเข้าโปรแกรมฟื้นฟูกายภาพ',
    category: 'health',
    tier: 'T2',
    sourceHint: 'calendar',
    conditions: { minAge: 60 },
    sceneId: 'hospital',
    daypart: 'morning',
    importance: 7,
    choices: [
      {
        id: 'join_rehab_program',
        label: 'เข้าคอร์สกายภาพและวิตามินเสริม (-1,200 บ.)',
        costCash: 1200,
        effects: [
          { type: 'ChangeMoney', amount: -1200, category: 'living', reason: 'ค่าตรวจสุขภาพและกายภาพบำบัด' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: 2, reason: 'ดูแลสุขภาพวัยเกษียณสม่ำเสมอ' },
          { type: 'ChangeResource', resource: 'energy', delta: 12, reason: 'ร่างกายกระปรี้กระเปร่า' },
          { type: 'RecordEvidence', key: 'rest_recovery', amount: 2, reason: 'ดูแลสุขภาพจริงจัง' },
        ],
      },
      {
        id: 'basic_gov_checkup',
        label: 'รับยาพื้นฐานตามสิทธิแล้วเดินออกกำลังสวนใกล้บ้าน',
        effects: [
          { type: 'ChangeRawStat', stat: 'endurance', delta: 0.8, reason: 'เดินออกกำลังสม่ำเสมอ' },
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'จิตใจแจ่มใส' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 't2_senior_community_club',
    title: 'ชมรมผู้สูงอายุชวนเป็นแกนนำกิจกรรม',
    bodyTemplate:
      'เพื่อนบ้านรุ่นราวคราวเดียวกันในชุมชนชวน {firstName} มาช่วยจัดกิจกรรมงานบุญและสอนทักษะให้รุ่นน้องในซอย',
    category: 'family',
    tier: 'T2',
    sourceHint: 'general',
    conditions: { minAge: 60 },
    sceneTag: 'home',
    importance: 6,
    choices: [
      {
        id: 'lead_club',
        label: 'ตอบรับเป็นแกนนำชุมชน แบ่งปันประสบการณ์',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 2, reason: 'นำกิจกรรมชมรมชุมชน' },
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'ภูมิใจที่ได้มีบทบาทในสังคม' },
          { type: 'RecordEvidence', key: 'help_others', amount: 2, reason: 'ช่วยงานชุมชนอย่างเต็มใจ' },
        ],
      },
      {
        id: 'attend_occasionally',
        label: 'ไปร่วมงานเป็นครั้งคราว เน้นพักผ่อนที่บ้าน',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 10, reason: 'พักผ่อนสบายๆ อยู่กับบ้าน' },
        ],
      },
    ],
    weight: 14,
  },

  // --- Quirky / Daily Life ---
  {
    id: 't2_stray_cat_adoption',
    title: 'ลูกแมวหลงมาขอพึ่งใบบุญหน้าบ้าน',
    bodyTemplate:
      'ลูกแมวตัวน้อยผอมโซส่งเสียงร้องอยู่หน้าประตู มองตาแป๋วเหมือนกำลังรอให้ {firstName} เปิดรับเข้าบ้าน',
    category: 'quirky',
    tier: 'T2',
    sourceHint: 'general',
    conditions: { minAge: 15 },
    sceneTag: 'home',
    importance: 6,
    choices: [
      {
        id: 'adopt_cat',
        label: 'รับเลี้ยงเป็นเจ้านายใหม่ ซื้อกระบะทรายและอาหาร (-650 บ.)',
        costCash: 650,
        effects: [
          { type: 'ChangeMoney', amount: -650, category: 'living', reason: 'ซื้ออุปกรณ์และอาหารเลี้ยงแมว' },
          { type: 'ChangeResource', resource: 'stress', delta: -12, reason: 'เยียวยาใจด้วยความน่ารักของแมว' },
          { type: 'AddFlag', flag: 'has_pet_cat', value: true, reason: 'รับเลี้ยงลูกแมวจร' },
          { type: 'RecordEvidence', key: 'help_others', amount: 1.5, reason: 'เมตตาต่อสัตว์' },
        ],
      },
      {
        id: 'feed_only',
        label: 'แบ่งข้าวคลุกปลาทูให้กินมื้อหนึ่งแล้วปล่อยไป (-40 บ.)',
        costCash: 40,
        effects: [
          { type: 'ChangeMoney', amount: -40, category: 'living', reason: 'ซื้อปลาทูแบ่งแมวจร' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'สบายใจที่ได้ช่วยมื้อเล็กๆ' },
        ],
      },
      {
        id: 'pet_and_pass',
        label: 'นั่งลูบหัวเป็นเพื่อนเล่นสักพักแล้วค่อยเข้าบ้าน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'อารมณ์ดีขึ้นจากการเล่นกับแมว' },
        ],
      },
    ],
    weight: 10,
  },
  {
    id: 't2_flash_flood_soi',
    title: 'พายุฝนถล่ม น้ำรอระบายท่วมซอย',
    bodyTemplate:
      'ฝนตกหนักติดต่อกันไม่ถึงชั่วโมง น้ำในซอยเอ่อท่วมระดับหน้าแข้ง การเดินทางติดขัดไปทั้งย่าน',
    category: 'quirky',
    tier: 'T2',
    sourceHint: 'general',
    conditions: { minAge: 15 },
    sceneId: 'street_shops',
    daypart: 'evening',
    importance: 6,
    choices: [
      {
        id: 'wade_water_boots',
        label: 'ถอดรองเท้าลุยน้ำฝ่าฝนกลับที่พักเอง',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'เดินลุยน้ำท่วมกลับบ้าน' },
          { type: 'ChangeResource', resource: 'stress', delta: 5, reason: 'หงุดหงิดกับน้ำท่วมขัง' },
        ],
      },
      {
        id: 'wait_cafe_coffee',
        label: 'แวะนั่งรอในคาเฟ่สั่งเครื่องดื่มอุ่นๆ รอน้ำลด (-110 บ.)',
        costCash: 110,
        effects: [
          { type: 'ChangeMoney', amount: -110, category: 'living', reason: 'ค่าเครื่องดื่มระหว่างรอน้ำลด' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'นั่งพักฟังเสียงฝนสบายใจ' },
          {
            type: 'StartScene',
            sceneId: 'cafe',
            daypart: 'evening',
            durationDays: 1,
            reason: 'นั่งรอฝนหยุดและน้ำลดที่คาเฟ่ (1 วัน)',
          },
        ],
      },
    ],
    weight: 11,
  },

  // ==========================================
  // T3: Turning Points, Foreshadowed Crises & Plausible Twists (6 cards)
  // ==========================================
  {
    id: 't3_company_downsizing_crisis',
    title: 'วิกฤตปรับโครงสร้างบริษัท เลิกจ้างฟ้าผ่า',
    bodyTemplate:
      'บอร์ดบริหารประกาศลดขนาดองค์กรฉุกเฉิน แผนกของ {firstName} ถูกยุบลง ฝ่ายบุคคลยื่นซองเงินชดเชยให้เลือกระหว่างรับก้อนนี้แล้วออก หรือย้ายไปทีมงานหนัก',
    category: 'work',
    tier: 'T3',
    sourceHint: 'hazard',
    isNegative: true,
    foreshadowTitle: 'ลางบอกเหตุ: ข่าวลือลดต้นทุนในออฟฟิศ',
    foreshadowHint: 'ช่วงนี้ฝ่ายบัญชีเรียกประชุมลับบ่อยผิดปกติ และมีข่าวลือเรื่องลดงบประมาณแผนกของคุณ',
    conditions: {
      minAge: 21,
      jobIds: ['office_junior', 'sales_exec', 'sales_manager', 'software_dev'],
    },
    sceneId: 'work_corporate',
    importance: 10,
    choices: [
      {
        id: 'take_severance',
        label: 'รับเงินชดเชย 28,000 บาทแล้วตั้งหลักหางานใหม่',
        effects: [
          { type: 'ChangeMoney', amount: 28000, category: 'event', reason: 'เงินชดเชยการเลิกจ้าง' },
          { type: 'SetJob', jobId: 'unemployed', reason: 'ออกจากงานพร้อมเงินชดเชย' },
          { type: 'ChangeResource', resource: 'stress', delta: 14, reason: 'กังวลช่วงเปลี่ยนผ่านอาชีพ' },
          { type: 'AddFlag', flag: 'survived_layoff', value: true, reason: 'ผ่านเหตุการณ์เลิกจ้าง' },
          { type: 'ApplyTurningPoint', kind: 'debt_wake_up_call', reason: 'ทบทวนแผนการเงินหลังตกงานกะทันหัน' },
        ],
      },
      {
        id: 'transfer_harder_role',
        label: 'ยอมย้ายไปฝ่ายปฏิบัติการที่งานหนักขึ้นเพื่อรักษาตำแหน่ง',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -22, reason: 'ปรับตัวกับตำแหน่งใหม่ที่หนักขึ้น' },
          { type: 'ChangeResource', resource: 'stress', delta: 10, reason: 'แรงกดดันสูงในทีมใหม่' },
          { type: 'RecordEvidence', key: 'endurance_work', amount: 3, reason: 'กัดฟันสู้ไม่ยอมแพ้' },
        ],
      },
    ],
    weight: 8,
    cooldownYears: 3,
  },
  {
    id: 't3_emergency_surgery_hospital',
    title: 'ไส้ติ่งอักเสบเฉียบพลัน หามส่งห้องฉุกเฉิน',
    bodyTemplate:
      'อาการปวดท้องรุนแรงฝั่งขวาช่วงกลางดึกทำให้ {firstName} ทรุดลงกับพื้น ถูกหามส่งโรงพยาบาลด่วน แพทย์ตรวจพบไส้ติ่งอักเสบและเสนอแนวทางรักษาให้เลือก',
    category: 'health',
    tier: 'T3',
    sourceHint: 'hazard',
    isNegative: true,
    isSuddenHazard: true, // Sudden medical emergency skips foreshadowing per spec
    sceneId: 'hospital',
    daypart: 'night',
    importance: 10,
    conditions: { minAge: 12, forbiddenFlags: ['appendix_removed'] },
    choices: [
      {
        id: 'use_universal_health_gold',
        label: 'ผ่าตัดด่วนตามสิทธิบัตรทอง / ประกันสังคม (ฟรี · พักโรงพยาบาล 5 วัน)',
        description: 'ผ่าตัดเอาออกให้หายขาด ต้องนอนพักฟื้นที่โรงพยาบาล 5 วันแล้วกลับบ้านได้',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -25, reason: 'อ่อนแรงช่วงแรกหลังการผ่าตัด' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: -1, reason: 'ร่างกายเพิ่งผ่านการผ่าตัด' },
          { type: 'AddFlag', flag: 'appendix_removed', value: true, reason: 'ผ่าตัดไส้ติ่งหายขาดแล้ว' },
          { type: 'RemoveFlag', flag: 'chronic_appendix_risk', reason: 'รักษาต้นเหตุหายขาด' },
          {
            type: 'StartScene',
            sceneId: 'hospital',
            daypart: 'night',
            durationDays: 5,
            reason: 'นอนพักฟื้นหลังผ่าตัดไส้ติ่ง (5 วัน)',
            returnSummary: 'แผลผ่าตัดไส้ติ่งสมานตัวดี แพทย์อนุญาตให้กลับบ้านได้และจะไม่กำเริบซ้ำอีก',
          },
        ],
      },
      {
        id: 'private_hospital_fast',
        label: 'ผ่าตัดส่องกล้องห้องพิเศษเอกชน (-18,000 บ. · พัก 3 วัน)',
        description: 'ฟื้นตัวไวและเจ็บตัวน้อยกว่า นอนโรงพยาบาลเพียง 3 วันแล้วหายขาดแน่นอน',
        requiresAdult: true,
        costCash: 18000,
        effects: [
          { type: 'ChangeMoney', amount: -18000, category: 'living', reason: 'ค่ารักษาผ่าตัดส่องกล้องห้องพิเศษ' },
          { type: 'ChangeResource', resource: 'energy', delta: -12, reason: 'พักฟื้นในห้องพิเศษอย่างสบาย' },
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'อุ่นใจกับการดูแลใกล้ชิด' },
          { type: 'AddFlag', flag: 'appendix_removed', value: true, reason: 'ผ่าตัดไส้ติ่งหายขาดแล้ว' },
          { type: 'RemoveFlag', flag: 'chronic_appendix_risk', reason: 'รักษาต้นเหตุหายขาด' },
          {
            type: 'StartScene',
            sceneId: 'hospital',
            daypart: 'night',
            durationDays: 3,
            reason: 'พักฟื้นห้องพิเศษหลังผ่าตัดส่องกล้อง (3 วัน)',
            returnSummary: 'พักฟื้นครบ 3 วัน แผลผ่าตัดฟื้นตัวไวมาก แพทย์อนุญาตให้กลับบ้านได้',
          },
        ],
      },
      {
        id: 'conservative_antibiotics_rest',
        label: 'ขอยาประคองอาการและนอนดูอาการไปก่อน ไม่ผ่าทันที (พัก 2 วัน · อาจกำเริบซ้ำ)',
        description: 'ประหยัดและไม่ต้องผ่าตัดทันที แต่มักไม่หายขาด มีโอกาสปวดท้องกำเริบกลับมาอีกในอนาคต',
        consequenceStoryletId: 't2_chronic_appendix_relapse',
        consequenceDelayDays: 35,
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -15, reason: 'ต้องนอนให้น้ำเกลือและยาฆ่าเชื้อ' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'กังวลว่าอาการอาจกำเริบอีก' },
          { type: 'AddFlag', flag: 'chronic_appendix_risk', value: true, reason: 'เลือกประคองอาการโดยยังไม่ผ่าตัด' },
          {
            type: 'StartScene',
            sceneId: 'hospital',
            daypart: 'night',
            durationDays: 2,
            reason: 'นอนรอดูอาการและให้ยาประคอง (2 วัน)',
            returnSummary: 'อาการปวดทุเลาลงจึงได้กลับบ้าน แต่แพทย์เตือนว่าอาจกลับมาอักเสบซ้ำอีกได้',
          },
        ],
      },
    ],
    weight: 7,
    cooldownYears: 4,
    isOneOff: true,
  },
  {
    id: 't2_chronic_appendix_relapse',
    title: 'อาการปวดท้องเรื้อรังกำเริบซ้ำ',
    bodyTemplate:
      'หลังจากคราวก่อนเลือกประคองอาการไว้โดยยังไม่ผ่าตัด วันนี้ {firstName} กลับมาปวดท้องฝั่งขวาจี๊ดขึ้นมาอีกจนต้องรีบมาพบแพทย์ที่โรงพยาบาล',
    category: 'health',
    tier: 'T2',
    sourceHint: 'consequence',
    conditions: {
      minAge: 12,
      requiredFlags: ['chronic_appendix_risk'],
      forbiddenFlags: ['appendix_removed'],
    },
    sceneId: 'hospital',
    importance: 9,
    choices: [
      {
        id: 'do_final_surgery',
        label: 'ตัดสินใจผ่าตัดรักษาให้หายขาดคราวนี้ (ฟรีสิทธิ 30 บ. · พัก 5 วัน)',
        description: 'จบปัญหาเรื้อรัง ไม่ต้องทรมานซ้ำซ้อนอีก พักฟื้นที่โรงพยาบาล 5 วัน',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -22, reason: 'พักฟื้นหลังผ่าตัดแก้ไขอาการเรื้อรัง' },
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'โล่งใจที่รักษาจนหายขาดเสียที' },
          { type: 'AddFlag', flag: 'appendix_removed', value: true, reason: 'ผ่าตัดรักษาหายขาดแล้ว' },
          { type: 'RemoveFlag', flag: 'chronic_appendix_risk', reason: 'ปิดความเสี่ยงอาการกำเริบซ้ำ' },
          {
            type: 'StartScene',
            sceneId: 'hospital',
            daypart: 'night',
            durationDays: 5,
            reason: 'ผ่าตัดรักษาให้หายขาด (5 วัน)',
            returnSummary: 'ผ่าตัดแก้ปัญหาเรื้อรังเรียบร้อย ครบ 5 วันแพทย์อนุญาตให้กลับบ้านได้',
          },
        ],
      },
      {
        id: 'painkiller_wait_again',
        label: 'ขอฉีดยาแก้ปวดและนอนพัก 1 วัน (ยังรักษาไม่หายขาด)',
        description: 'รีบกลับไปใช้ชีวิตก่อน แต่ความอึดลดลงและมีโอกาสปวดซ้ำอีกในเดือนถัดไป',
        consequenceStoryletId: 't2_chronic_appendix_relapse',
        consequenceDelayDays: 45,
        effects: [
          { type: 'ChangeRawStat', stat: 'endurance', delta: -1.5, reason: 'อาการอักเสบเรื้อรังบั่นทอนความอึด' },
          { type: 'ChangeResource', resource: 'stress', delta: 8, reason: 'ต้องคอยระแวงอาการปวดกำเริบ' },
          {
            type: 'StartScene',
            sceneId: 'hospital',
            daypart: 'evening',
            durationDays: 1,
            reason: 'รับยาประคองอาการ (1 วัน)',
            returnSummary: 'อาการปวดสงบลงชั่วคราวหลังรับยา แพทย์แนะนำให้รีบมาผ่าตัดหากปวดอีก',
          },
        ],
      },
    ],
    weight: 2,
    cooldownYears: 0,
  },
  {
    id: 't3_burnout_collapse_crisis',
    title: 'วิกฤตหมดไฟและวูบหมดสติจากความเครียดสะสม',
    bodyTemplate:
      'หลังจากสะสมความเครียดและพักผ่อนไม่พอมาเป็นเวลานาน ร่างกายของ {firstName} ก็วูบหมดสติระหว่างใช้ชีวิตประจำวันจนต้องรีบพาส่งโรงพยาบาล',
    category: 'health',
    tier: 'T3',
    sourceHint: 'stat_threshold',
    isNegative: true,
    foreshadowTitle: 'ลางบอกเหตุ: อาการเวียนหัวและนอนไม่หลับเรื้อรัง',
    foreshadowHint: 'ช่วงนี้คุณเริ่มหูอื้อ ใจเต้นผิดจังหวะ และนอนไม่หลับติดต่อกันหลายคืนเพราะความเครียดสะสม',
    conditions: {
      minAge: 18,
      maxAge: 65,
      minStress: 80,
    },
    sceneId: 'hospital',
    importance: 10,
    choices: [
      {
        id: 'accept_lifestyle_reset',
        label: 'รับคำแนะนำหมอ นอนพักฟื้น 3 วันและปฏิวัติตารางชีวิต (-2,500 บ.)',
        description: 'นอนฟื้นฟูร่างกายที่โรงพยาบาล 3 วันเต็มแล้วกลับไปจัดสมดุลชีวิตใหม่',
        costCash: 2500,
        effects: [
          { type: 'ChangeMoney', amount: -2500, category: 'living', reason: 'ค่าตรวจสุขภาพและวิตามินฟื้นฟู' },
          { type: 'ChangeResource', resource: 'stress', delta: -35, reason: 'หยุดพักและปรับจังหวะชีวิตใหม่' },
          { type: 'ChangeResource', resource: 'energy', delta: 30, reason: 'ฟื้นพลังงานกลับมาเต็มที่' },
          { type: 'ApplyTurningPoint', kind: 'burnout_reset', reason: 'ร่างกายทรุดจากความเครียดจนเปลี่ยนวิธีใช้ชีวิต' },
          {
            type: 'StartScene',
            sceneId: 'hospital',
            durationDays: 3,
            reason: 'นอนพักฟื้นฟูร่างกายจากภาวะหมดไฟ (3 วัน)',
            returnSummary: 'พักฟื้นครบ 3 วัน ความเครียดลดลงมากแล้ว ได้เวลากลับไปใช้ชีวิตอย่างสมดุล',
          },
        ],
      },
      {
        id: 'sign_out_early',
        label: 'เซ็นใบขอกลับบ้านทันทีเพราะห่วงภาระและค่าใช้จ่าย',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -12, reason: 'ไม่ยอมพักฟื้นเต็มที่' },
          { type: 'ChangeResource', resource: 'stress', delta: 8, reason: 'ยังกังวลเรื่องค้างคา' },
        ],
      },
    ],
    weight: 10,
    cooldownYears: 3,
  },
  {
    id: 't3_golden_career_opportunity',
    title: 'ข้อเสนอยกระดับสายอาชีพครั้งใหญ่',
    bodyTemplate:
      'ผู้บริหารองค์กรชั้นนำประทับใจผลงานในฐานะ{job}และเสนองานระดับหัวเรือใหญ่พร้อมโบนัสเซ็นสัญญา 24,000 บาท แต่ต้องแลกกับความรับผิดชอบสูงขึ้นมหาศาล',
    category: 'work',
    tier: 'T3',
    sourceHint: 'general',
    conditions: {
      minAge: 22,
      maxAge: 58,
      jobIds: [
        'office_junior',
        'sales_exec',
        'sales_manager',
        'software_dev',
        'civil_servant',
        'technician',
        'convenience_staff',
        'small_business',
      ],
    },
    sceneId: 'work_corporate',
    importance: 9,
    choices: [
      {
        id: 'accept_leap',
        label: 'คว้าโอกาสใหญ่ รับโบนัส 24,000 บาทและเดินหน้าเต็มตัว',
        blockedByTraits: [
          {
            traitId: 'overthinker',
            minIntensity: 'core',
            reasonTh: 'คิดวนและกังวลความเสี่ยงมากเกินไปจนไม่กล้าคว้าข้อเสนอด่วน',
          },
        ],
        effects: [
          { type: 'ChangeMoney', amount: 24000, category: 'salary', reason: 'โบนัสเซ็นสัญญาโอกาสงานใหม่' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 3, reason: 'ก้าวสู่บทบาทความรับผิดชอบสูง' },
          { type: 'ChangeResource', resource: 'stress', delta: 10, reason: 'ความคาดหวังของบทบาทใหม่' },
          { type: 'ApplyTurningPoint', kind: 'mentor_inspiration', reason: 'ผู้ใหญ่เปิดทางให้เติบโตก้าวกระโดด' },
        ],
      },
      {
        id: 'stay_content',
        label: 'ขอบคุณและปฏิเสธอย่างสุภาพ เพื่อรักษาสมดุลชีวิตตอนนี้',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -10, reason: 'สบายใจกับทางเดินที่เลือกเอง' },
          { type: 'ChangeResource', resource: 'energy', delta: 10, reason: 'ไม่แบกภาระเกินความจำเป็น' },
          { type: 'RecordEvidence', key: 'rest_recovery', amount: 2.5, reason: 'เลือกความสงบสุขของชีวิต' },
        ],
      },
    ],
    weight: 6,
    cooldownYears: 4,
  },

  // --- Twist Storylets (3 explicit Plausible Twists) ---
  {
    id: 't3_twist_hidden_mentor_inheritance',
    title: 'จุดหักมุม: จดหมายทนายความจากผู้มีพระคุณเก่า',
    bodyTemplate:
      'ทนายความติดต่อหา {firstName} พร้อมซองเอกสารปิดผนึก แจ้งว่าผู้ใหญ่ที่เคยเอ็นดูความสม่ำเสมอของคุณได้ระบุชื่อคุณเป็นผู้รับทุนตั้งตัวก้อนพิเศษ 45,000 บาท',
    category: 'finance',
    tier: 'T3',
    sourceHint: 'general',
    isTwist: true,
    foreshadowTitle: 'ลางบอกเหตุ: โทรศัพท์ถามเลขที่อยู่จากสำนักงานทนายความ',
    foreshadowHint: 'มีผู้ช่วยทนายโทรมาสอบถามข้อมูลยืนยันตัวตนเบื้องต้นของครอบครัวคุณอย่างสุภาพ',
    plausibilityCheck: {
      minAge: 20,
      requiredAnyTraits: ['helpful_hearted', 'steady_reliable', 'disciplined_worker', 'strict_saver', 'family_anchored'],
      requiredAnyEvidence: { help_others: 3, self_discipline: 4, family_time: 4 },
      reasonTh: 'ความสม่ำเสมอ น้ำใจ และความน่าเชื่อถือที่สะสมมานานเป็นเหตุให้ผู้ใหญ่จดจำ',
    },
    sceneTag: 'home',
    importance: 10,
    conditions: { minAge: 20 },
    choices: [
      {
        id: 'accept_legacy_gift',
        label: 'รับทุนตั้งตัว 45,000 บาทและกล่าวคำขอบคุณต่อหน้าอนุสรณ์',
        effects: [
          { type: 'ChangeMoney', amount: 45000, category: 'event', reason: 'มรดก/ทุนตั้งตัวจากผู้มีพระคุณ' },
          { type: 'ChangeResource', resource: 'stress', delta: -15, reason: 'ซาบซึ้งและมั่นคงทางการเงินขึ้น' },
          { type: 'AddFlag', flag: 'twist_received_legacy', value: true, reason: 'ได้รับทุนตั้งตัวแบบไม่คาดฝัน' },
        ],
      },
      {
        id: 'share_half_family',
        label: 'เก็บไว้ 30,000 บาท และแบ่งส่วนที่เหลือดูแลครอบครัว',
        effects: [
          { type: 'ChangeMoney', amount: 30000, category: 'event', reason: 'รับทุนตั้งตัวหลังแบ่งให้ครอบครัว' },
          { type: 'RecordEvidence', key: 'family_time', amount: 4, reason: 'แบ่งปันโชคลาภให้ครอบครัว' },
          { type: 'AddFlag', flag: 'twist_received_legacy', value: true, reason: 'ได้รับทุนตั้งตัวและแบ่งปันบ้าน' },
        ],
      },
    ],
    weight: 4,
    isOneOff: true,
  },
  {
    id: 't3_twist_trusted_friend_betrayal',
    title: 'จุดหักมุม: คนสนิทแอบอ้างชื่อไปกู้นอกระบบ',
    bodyTemplate:
      'หมายทวงหนี้ส่งมาถึงหน้าบ้าน เมื่อไล่เช็กจึงรู้ว่าเพื่อนหรือคนคุ้นเคยที่เคยคบหานำสำเนาเอกสารของคุณไปค้ำประกันหนี้ 18,000 บาทแล้วหายตัวไป',
    category: 'social',
    tier: 'T3',
    sourceHint: 'hazard',
    isNegative: true,
    isTwist: true,
    foreshadowTitle: 'ลางบอกเหตุ: คนสนิทขอยืมสำเนาเอกสารและหลบตาเวลาคุยเรื่องเงิน',
    foreshadowHint: 'คนใกล้ตัวมีท่าทีลุกลี้ลุกลนและชอบถามเรื่องวงเงินสินเชื่อของคุณผิดปกติในช่วงที่ผ่านมา',
    plausibilityCheck: {
      minAge: 18,
      requiredAnyTraits: ['peer_attached', 'people_pleaser', 'party_lover', 'generous_host'],
      requiredAnyEvidence: { peer_follow: 3, night_out: 3, help_others: 3 },
      reasonTh: 'การไว้ใจคนใกล้ตัวหรือติดกลุ่มเพื่อนมากเกินไปเปิดช่องให้ถูกเอาเปรียบ',
    },
    sceneTag: 'district',
    importance: 10,
    conditions: { minAge: 18 },
    choices: [
      {
        id: 'settle_and_file_report',
        label: 'แจ้งความลงบันทึกประจำวันและปิดยอดจบเรื่อง (-8,000 บ.)',
        costCash: 8000,
        effects: [
          { type: 'ChangeMoney', amount: -8000, category: 'event', reason: 'ค่าทนายและไกล่เกลี่ยปิดคดีแอบอ้าง' },
          { type: 'ApplyTurningPoint', kind: 'betrayed_by_close', reason: 'ถูกคนไว้ใจนำชื่อไปแอบอ้างจนเป็นบทเรียนชีวิต' },
          { type: 'AddFlag', flag: 'twist_betrayed', value: true, reason: 'ผ่านเหตุการณ์ถูกคนใกล้ตัวหักหลัง' },
        ],
      },
      {
        id: 'fight_legally_no_pay',
        label: 'ยืนยันปฏิเสธไม่จ่ายและเดินเรื่องสู้คดีเต็มรูปแบบ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 18, reason: 'เหนื่อยล้ากับการเดินเรื่องศาลและตำรวจ' },
          { type: 'ApplyTurningPoint', kind: 'betrayed_by_close', reason: 'ถูกคนใกล้ตัวหักหลังเรื่องการเงิน' },
          { type: 'AddFlag', flag: 'twist_betrayed', value: true, reason: 'ผ่านเหตุการณ์ถูกคนใกล้ตัวหักหลัง' },
        ],
      },
    ],
    weight: 4,
    isOneOff: true,
  },
  {
    id: 't3_twist_viral_clip_night',
    title: 'จุดหักมุม: คลิปเหตุการณ์ยามค่ำกลายเป็นไวรัลชั่วข้ามคืน',
    bodyTemplate:
      'จังหวะที่ {firstName} เข้าไปช่วยเคลียร์เหตุการณ์หน้าซอยอาหารกลางคืน มีคนถ่ายคลิปลงโซเชียลจนยอดวิวพุ่งทะลุแสน เช้าวันต่อมามีแบรนด์และร้านค้าทักมาขอสนับสนุน',
    category: 'quirky',
    tier: 'T3',
    sourceHint: 'general',
    isTwist: true,
    foreshadowTitle: 'ลางบอกเหตุ: มีคนตั้งกล้องถ่ายคลิปบรรยากาศในซอยช่วงค่ำ',
    foreshadowHint: 'ช่วงสัปดาห์นี้มียูทูบเบอร์และสายคอนเทนต์มาเดินถ่ายคลิปแถวซอยอาหารกลางคืนบ่อยเป็นพิเศษ',
    plausibilityCheck: {
      minAge: 18,
      requiredAnyTraits: ['smooth_talker', 'helpful_hearted', 'cheerful', 'party_lover', 'street_smart'],
      requiredAnyEvidence: { social_fun: 2, nightlife_social: 2, help_others: 2 },
      reasonTh: 'การใช้ชีวิตยามค่ำคืนหรือความกล้าเข้าสังคมทำให้คุณบังเอิญเข้าไปอยู่ในเฟรมคลิปไวรัล',
    },
    sceneId: 'street_food_night',
    daypart: 'night',
    importance: 9,
    conditions: { minAge: 18 },
    choices: [
      {
        id: 'accept_sponsor_deal',
        label: 'รับงานรีวิวจากร้านค้าท้องถิ่น (+18,000 บ.)',
        effects: [
          { type: 'ChangeMoney', amount: 18000, category: 'side', reason: 'ค่าโปรโมตร้านค้าจากกระแสไวรัล' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 3, reason: 'มีชื่อเสียงชั่วข้ามคืน' },
          { type: 'RevealTrait', traitId: 'stress_sensitive', reason: 'แรงกดดันจากสายตาคนแปลกหน้าทำให้รู้ทันความเครียดตัวเอง' },
        ],
      },
      {
        id: 'stay_private_humble',
        label: 'ขอไม่รับสปอนเซอร์ รักษาความเป็นส่วนตัวเหมือนเดิม',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -10, reason: 'ไม่ตกเป็นเป้าดราม่าออนไลน์' },
          { type: 'RecordEvidence', key: 'self_reflection', amount: 3, reason: 'เลือกความสงบเหนือกระแส' },
        ],
      },
    ],
    weight: 4,
    isOneOff: true,
  },

  // --- Appearance, Style, Looks & Charisma Storylets ---
  {
    id: 't2_talent_scout_charisma',
    title: 'แมวมองและเอเจนซี่สายคอนเทนต์เข้ามาทาบทาม',
    bodyTemplate:
      'จังหวะพูดคุยและเสน่ห์เฉพาะตัวของ {firstName} ดันไปเตะตาทีมงานเอเจนซี่ที่เดินผ่านมาพอดี เขาฝากนามบัตรชวนไปลองรับงานพิธีกร/พรีเซนเตอร์ระยะสั้น',
    category: 'social',
    tier: 'T2',
    sourceHint: 'stat_threshold',
    sceneTag: 'cafe',
    importance: 8,
    conditions: {
      minAge: 16,
      minStats: { charisma: 65 },
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'take_presenter_gig',
        label: 'ลองรับงานพรีเซนเตอร์และคอนเทนต์ระยะสั้น (+9,500 บ.)',
        description: 'ได้ค่าตอบแทนดีและฝึกออกหน้ากล้อง แต่ต้องแบ่งเวลารับความกดดันจากงานเพิ่ม',
        effects: [
          { type: 'ChangeMoney', amount: 9500, category: 'side', reason: 'ค่าตัวงานพิธีกร/คอนเทนต์จากแมวมอง' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 2, reason: 'มั่นใจและคล่องขึ้นหน้ากล้อง' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'ความตื่นเต้นและเดดไลน์ถ่ายทำ' },
          { type: 'RecordEvidence', key: 'praised', amount: 2.5, reason: 'มีคนชื่นชมความสามารถเฉพาะตัว' },
        ],
      },
      {
        id: 'keep_contact_for_work',
        label: 'แลกคอนแทกต์ไว้ต่อยอดสายงานประจำของตัวเอง',
        description: 'ไม่เสียจังหวะงานหลัก แต่ได้คอนเนกชันเพิ่มในวงการสื่อ',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 2, reason: 'ขยายเครือข่ายรู้จักคนในวงการ' },
          { type: 'ChangeRawStat', stat: 'creativity', delta: 2, reason: 'ได้มุมมองงานสื่อสารใหม่ๆ' },
        ],
      },
      {
        id: 'decline_prefer_privacy',
        label: 'ขอบคุณและขอปฏิเสธ เพราะชอบใช้ชีวิตเงียบๆ มากกว่า',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'รักษาพื้นที่ส่วนตัวและความสบายใจ' },
          { type: 'RecordEvidence', key: 'self_reflection', amount: 2, reason: 'รู้ใจตัวเองว่าไม่ชอบแสงสปอตไลต์' },
        ],
      },
    ],
    weight: 10,
    cooldownYears: 3,
  },
  {
    id: 't2_model_scout_high_looks',
    title: 'เอเจนซี่ทักชวนไปแคสงานถ่ายแบบโฆษณา',
    bodyTemplate:
      'บุคลิกและหน้าตาที่โดดเด่นของ {firstName} ทำให้ทีมคัดเลือกนักแสดงโฆษณาทักเข้ามาถามว่าสนใจลองไปแคสติ้งถ่ายแบบสินค้าโปรโมตรอบสุดสัปดาห์นี้ไหม',
    category: 'social',
    tier: 'T2',
    sourceHint: 'stat_threshold',
    sceneTag: 'cafe',
    importance: 7,
    conditions: {
      minAge: 16,
      minStats: { looks: 68 },
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'try_casting_audition',
        label: 'ลองไปแคสติ้งดูสักตั้ง (ค่าเดินทางและเตรียมชุด -400 บ.)',
        costCash: 400,
        twistChance: 0.45,
        twistSummary: 'ผ่านคัดเลือกตัวจริง! ได้ค่าตัวถ่ายโฆษณาเต็มวันเพิ่มอีกก้อนหนึ่ง',
        twistEffects: [
          { type: 'ChangeMoney', amount: 11000, category: 'side', reason: 'ค่าตัวถ่ายแบบโฆษณาหลังผ่านแคสติ้ง' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 2, reason: 'ประสบการณ์ทำงานกองถ่ายจริง' },
        ],
        effects: [
          { type: 'ChangeMoney', amount: -400, category: 'living', reason: 'ค่าเดินทางและเตรียมตัวไปแคสงาน' },
          { type: 'ChangeRawStat', stat: 'looks', delta: 1, reason: 'ได้เรียนรู้การจัดวางท่าทางหน้ากล้อง' },
          { type: 'ChangeResource', resource: 'energy', delta: -12, reason: 'รอคิวแคสติ้งทั้งบ่าย' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.5, reason: 'ได้ลองเปิดประสบการณ์ใหม่' },
        ],
      },
      {
        id: 'skip_focus_main_track',
        label: 'ปฏิเสธอย่างสุภาพ เพื่อเก็บแรงไว้โฟกัสงานและการเรียนหลัก',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ไม่กังวลเรื่องแข่งขันรูปลักษณ์' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'จัดลำดับความสำคัญของเป้าหมายหลัก' },
        ],
      },
    ],
    weight: 9,
    cooldownYears: 3,
  },
  {
    id: 't2_awkward_interview_low_charisma',
    title: 'พูดคุยและนำเสนอติดขัดเพราะขาดความมั่นใจ',
    bodyTemplate:
      'ช่วงนี้เวลา {firstName} ต้องคุยประสานงานหรือตอบคำถามต่อหน้าคนไม่คุ้นเคย มักพูดตะกุกตะกักจนคนฟังจับประเด็นไม่ทัน ทำให้เสียโอกาสแสดงฝีมือไปหลายครั้ง',
    category: 'work',
    tier: 'T2',
    sourceHint: 'stat_threshold',
    sceneTag: 'work',
    importance: 7,
    conditions: {
      minAge: 18,
      maxStats: { charisma: 38 },
    },
    choices: [
      {
        id: 'join_speaking_workshop',
        label: 'ลงคอร์สฝึกพูดและบุคลิกภาพแบบเร่งรัด (-1,800 บ.)',
        costCash: 1800,
        effects: [
          { type: 'ChangeMoney', amount: -1800, category: 'living', reason: 'ค่าอบรมฝึกการสื่อสารและบุคลิกภาพ' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 6, reason: 'ฝึกจังหวะพูดและการสบตาอย่างเป็นระบบ' },
          { type: 'ChangeSkill', skill: 'social', delta: 4, reason: 'กล้าเข้าสังคมและพูดคุยคล่องขึ้น' },
          { type: 'RecordEvidence', key: 'practice_any', amount: 2, reason: 'ลงทุนพัฒนาจุดอ่อนของตัวเอง' },
        ],
      },
      {
        id: 'practice_mirror_self',
        label: 'ซ้อมพูดหน้ากระจกและจดสคริปต์ด้วยตัวเองทุกเย็น',
        effects: [
          { type: 'ChangeRawStat', stat: 'charisma', delta: 3, reason: 'ค่อยๆ สร้างความคุ้นชินการสื่อสาร' },
          { type: 'ChangeRawStat', stat: 'wit', delta: 1, reason: 'เรียงลำดับความคิดก่อนพูดได้ดีขึ้น' },
          { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'ใช้แรงซ้อมหลังเลิกงาน' },
        ],
      },
      {
        id: 'focus_quiet_craft',
        label: 'ยอมรับว่าไม่ถนัดเจรจา หันไปทุ่มพัฒนาทักษะสายลงมือทำแทน',
        effects: [
          { type: 'ChangeSkill', skill: 'tech', delta: 2.5, reason: 'โฟกัสงานเบื้องหลังที่ใช้ฝีมือมากกว่าการพูด' },
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ไม่ฝืนตัวเองเกินไป' },
        ],
      },
    ],
    weight: 9,
    cooldownYears: 3,
  },
  {
    id: 't2_dyed_hair_office_feedback',
    title: 'ลุคและสีผมแฟชั่นถูกทักเรื่องความเหมาะสมในงานทางการ',
    bodyTemplate:
      'สีผมหรือสไตล์การแต่งตัวที่จัดจ้านของ {firstName} เป็นจุดเด่นสะดุดตา แต่ผู้ใหญ่ในสายงานทางการและฝ่ายบุคคลเริ่มเปรยเบาๆ ว่าหากอยากเติบโตหรือสมัครสายงานราชการอาจต้องปรับให้ดูสุภาพขึ้น',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneTag: 'work',
    importance: 7,
    conditions: {
      minAge: 18,
      requireDyedOrFlashyHair: true,
    },
    choices: [
      {
        id: 'tone_down_formal_look',
        label: 'ปรับลุคและย้อมผมโทนสุภาพเพื่อเปิดทางงานทางการ (-1,200 บ.)',
        costCash: 1200,
        description: 'ปลดข้อจำกัดงานสายราชการและเพิ่มความน่าเชื่อถือต่อองค์กรทันที',
        effects: [
          { type: 'ChangeMoney', amount: -1200, category: 'living', reason: 'ค่าปรับแต่งลุคและสีผมให้สุภาพ' },
          { type: 'AddFlag', flag: 'appearance_toned_down_formal', value: true, reason: 'ปรับสไตล์ให้สุภาพเรียบร้อยเข้ากับงานทางการ' },
          { type: 'AddFlag', flag: 'appearance_dyed_fashion', value: false, reason: 'ลดโทนสีแฟชั่นฉูดฉาด' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 2, reason: 'ยอมปรับตัวตามกาลเทศะขององค์กร' },
        ],
      },
      {
        id: 'keep_signature_style',
        label: 'ยืนยันสไตล์ตัวเองต่อไป แล้วพิสูจน์ด้วยผลงานจริงแทน',
        effects: [
          { type: 'ChangeRawStat', stat: 'creativity', delta: 2, reason: 'รักษาอัตลักษณ์และสไตล์เฉพาะตัว' },
          { type: 'ChangeResource', resource: 'stress', delta: 5, reason: 'ต้องทำงานหนักขึ้นเพื่อลบอคติเรื่องภาพลักษณ์' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 2, reason: 'ตั้งใจทำผลงานให้คนยอมรับตัวตน' },
        ],
      },
    ],
    weight: 10,
    cooldownYears: 2,
  },
  {
    id: 't1_fashion_hair_compliment',
    title: 'คนรุ่นเดียวกันชมสไตล์และสีผมสุดจี๊ด',
    bodyTemplate:
      'ระหว่างแวะพักที่คาเฟ่แถวนี้ มีคนชมว่าสีผมและการแต่งตัวของ {firstName} ดูมีเอกลักษณ์และเข้ากับตัวสุดๆ ทำให้บรรยากาศวันสบายๆ คึกคักขึ้น',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneTag: 'cafe',
    conditions: {
      minAge: 15,
      requireDyedOrFlashyHair: true,
    },
    choices: [
      {
        id: 'enjoy_style_vibe',
        label: 'ยิ้มรับคำชม',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'มีคนชื่นชอบสไตล์ที่เป็นตัวของตัวเอง' },
          { type: 'ChangeRawStat', stat: 'creativity', delta: 1, reason: 'มั่นใจในรสนิยมแฟชั่น' },
        ],
      },
    ],
    weight: 8,
    cooldownYears: 2,
  },
  // === Phase 3.3.1: Talents, Fixable Limitations & M.3 Dropout Crisis ===
  {
    id: 'ev_talent_hint',
    title: 'สังเกตเห็นแววบางอย่างในชีวิตประจำวัน',
    bodyTemplate:
      'ช่วงนี้คนรอบตัวทักเบาๆ ว่าเวลา {firstName} ได้ลองจับงานหรือกิจกรรมที่ถูกจริต มักจับจังหวะได้ไวกว่าปกติเป็นพิเศษ ลองเปิดโอกาสให้ตัวเองได้ลองหลายแนวทางดูสักหน่อย',
    category: 'quirky',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    conditions: {
      minAge: 6,
      maxAge: 18,
      requireUnrevealedTalent: true,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'notice_subtle_spark',
        label: 'เก็บคำชมและลองสังเกตความถนัดของตัวเองต่อไป',
        effects: [
          { type: 'ChangeRawStat', stat: 'wit', delta: 0.8, reason: 'เริ่มสังเกตความถนัดธรรมชาติของตัวเอง' },
          { type: 'RecordEvidence', key: 'practice_any', amount: 1.5, reason: 'อยากลองทำกิจกรรมที่สนใจต่อเนื่อง' },
          { type: 'AddFlag', flag: 'talent_hint_noticed', value: true, reason: 'เริ่มจับสังเกตแววความถนัดเฉพาะตัว' },
        ],
      },
    ],
    weight: 10,
    cooldownYears: 1,
  },
  {
    id: 'ev_ms_slow_learner_tutor',
    title: 'ครูประจำชั้นช่วยทบทวนบทเรียนหลังเลิกเรียน',
    bodyTemplate:
      'ครูสังเกตว่า {firstName} ต้องใช้เวลาทำความเข้าใจเรื่องใหม่นานกว่าเพื่อนจึงไม่เร่งรัด แต่ชวนมานั่งอธิบายทีละขั้นอย่างใจเย็นจนเริ่มมองเห็นภาพรวมชัดขึ้น',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    conditions: {
      minAge: 12,
      maxAge: 18,
      requireLimitationId: 'lim_slow_learner',
      jobIds: ['student'],
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'stay_after_class_tutor',
        label: 'ตั้งใจฟังและจดสรุปตามวิธีของตัวเอง',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1.5, reason: 'ทบทวนเนื้อหาทีละขั้นอย่างใจเย็น' },
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ไม่รู้สึกถูกกดดันเวลาต้องทำความเข้าใจช้ากว่าเพื่อน' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'อดทนทบทวนบทเรียนจนเข้าใจ' },
        ],
      },
    ],
    weight: 9,
    cooldownYears: 1,
  },
  {
    id: 'ev_dropout_crisis',
    title: 'หัวเลี้ยวหัวต่อ ม.3: ไปต่อสายไหนดีเมื่อบ้านเริ่มตึงมือ',
    bodyTemplate:
      'ใกล้จบชั้น ม.3 แล้ว แต่ค่าใช้จ่ายในบ้านของ {firstName} ช่วงนี้ตึงตัวกว่าที่คิด ทั้งครอบครัวต้องมานั่งคุยกันจริงจังว่าจะวางแผนก้าวต่อไปอย่างไรดี',
    category: 'family',
    tier: 'T3',
    sourceHint: 'calendar',
    sceneTag: 'home',
    importance: 10,
    isOneOff: true,
    conditions: {
      minAge: 14,
      maxAge: 16,
      isMinorSafe: true,
      requireDropoutCrisisEligible: true,
    },
    choices: [
      {
        id: 'stay_highschool_tight',
        label: 'กัดฟันขอเรียนต่อ ม.ปลายสายสามัญต่อไป',
        description: 'รักษาเส้นทางสายหลัก แต่ความเครียดเรื่องเงินของบ้านจะหนักขึ้นและต้องช่วยประหยัด',
        effects: [
          { type: 'SetJob', jobId: 'student', reason: 'ยืนยันเรียนต่อ ม.ปลาย ตามสายหลัก' },
          { type: 'AddFlag', flag: 'chosen_stay_hs_budget', value: true, reason: 'เลือกเรียนต่อ ม.ปลาย แม้ครอบครัวตึงมือ' },
          { type: 'ChangeResource', resource: 'stress', delta: 8, reason: 'กดดันจากภาระค่าใช้จ่ายของครอบครัว' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 2, reason: 'ตั้งใจเรียนให้คุ้มค่าความเสียสละของที่บ้าน' },
        ],
      },
      {
        id: 'switch_vocational_track',
        label: 'เปลี่ยนไปเรียนสายอาชีพ / ปวช. เพื่อฝึกวิชาติดตัวเร็ว',
        description: 'เน้นทักษะปฏิบัติที่ต่อยอดทำงานไวขึ้น แทนเส้นทางสายวิชาการล้วน',
        effects: [
          { type: 'SetJob', jobId: 'student', reason: 'เข้าศึกษาต่อสายอาชีพเพื่อเน้นทักษะปฏิบัติ' },
          { type: 'AddFlag', flag: 'vocational_track', value: true, reason: 'เลือกเส้นทางสายอาชีพ/ปวช.' },
          { type: 'ChangeSkill', skill: 'craft', delta: 3, reason: 'ได้ลงมือฝึกงานช่างและปฏิบัติจริงตั้งแต่เริ่มเรียน' },
          { type: 'ChangeResource', resource: 'stress', delta: 2, reason: 'ปรับตัวเข้ากับสายอาชีพ' },
        ],
      },
      {
        id: 'dropout_help_family',
        label: 'พักการเรียนในระบบ ออกมาทำงานช่วยแบ่งเบาภาระที่บ้าน',
        description: 'จบวุฒิ ม.3 แล้วออกมาทำงานเต็มเวลาหรือพาร์ตไทม์ (ยังไปต่อ กศน. ภายหลังได้)',
        effects: [
          { type: 'SetJob', jobId: 'unemployed', reason: 'ออกจากโรงเรียนหลังจบ ม.3 เพื่อเริ่มหางานช่วยครอบครัว' },
          { type: 'AddFlag', flag: 'dropped_out_m3', value: true, reason: 'ยุติการเรียนในระบบหลังจบ ม.3' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'ก้าวเข้าสู่โลกผู้ใหญ่เร็วกว่าเพื่อนรุ่นเดียวกัน' },
          { type: 'RecordEvidence', key: 'family_time', amount: 2, reason: 'ตัดสินใจเสียสละช่วยพยุงฐานะครอบครัว' },
        ],
      },
      {
        id: 'work_and_nfe_upper',
        label: 'ทำงานไปด้วย เรียน กศน. ม.ปลาย ควบคู่กันไป',
        description: 'แบ่งเวลาวันหยุดไปเรียน กศน. ม.ปลาย เพื่อไม่ให้วุฒิการศึกษาขาดช่วง',
        effects: [
          { type: 'SetJob', jobId: 'unemployed', reason: 'ออกมาหางานทำควบคู่กับการเรียน กศน. ม.ปลาย' },
          { type: 'AddFlag', flag: 'enroll_nfe_upper', value: true, reason: 'ลงทะเบียนเรียน กศน. ระดับ ม.ปลาย ควบคู่ทำงาน' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'เหนื่อยจากการแบ่งเวลาทั้งงานและการเรียนนอกระบบ' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 3, reason: 'ไม่ยอมทิ้งโอกาสทางการศึกษาแม้ต้องทำงาน' },
        ],
      },
      {
        id: 'apply_student_loan',
        label: 'ขอกู้ กยศ. / ผ่อนผันค่าเทอมเพื่อเรียนต่อ',
        description: 'ลดค่าใช้จ่ายรายเดือนลง แต่มีภาระหนี้ก้อนแรกติดตัว (8,000 บาท)',
        effects: [
          { type: 'SetJob', jobId: 'student', reason: 'ขอทุนกู้ยืมเพื่อการศึกษา (กยศ.) เรียนต่อ ม.ปลาย' },
          { type: 'AddFlag', flag: 'applied_student_loan', value: true, reason: 'ใช้สิทธิ์ กยศ. พยุงค่าเทอม ม.ปลาย' },
          { type: 'AddDebt', amount: 8000, reason: 'ยอดเริ่มต้นเงินกู้ยืมเพื่อการศึกษา กยศ.' },
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'รับผิดชอบภาระกู้ยืมเพื่ออนาคตของตัวเอง' },
        ],
      },
      {
        id: 'special_gpa_scholarship',
        label: 'สมัครทุนเรียนดีประจำอำเภอ (ปลดล็อกพิเศษจากเกรดเฉลี่ย 3.20+)',
        description: 'ใช้ผลการเรียนที่สม่ำเสมอขอทุนยกเว้นค่าเล่าเรียนเต็มจำนวน',
        requiredMinGpa: 3.2,
        conditionalUnlockReasonTh: 'ต้องมีเกรดเฉลี่ยสะสมล่าสุดตั้งแต่ 3.20 ขึ้นไปจึงจะยื่นขอทุนเรียนดีได้',
        effects: [
          { type: 'SetJob', jobId: 'student', reason: 'ได้รับทุนเรียนดีเข้าศึกษาต่อระดับ ม.ปลาย' },
          { type: 'AddFlag', flag: 'won_high_school_scholarship', value: true, reason: 'ได้รับทุนเรียนดี ม.ปลาย (ต้องรักษาเกรด >= 3.00)' },
          { type: 'ChangeMoney', amount: 5000, category: 'event', reason: 'เงินสนับสนุนอุปกรณ์การเรียนจากทุนการศึกษา' },
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'โล่งใจที่สามารถเรียนต่อได้โดยไม่เพิ่มภาระบ้าน' },
        ],
      },
      {
        id: 'special_talent_quota',
        label: 'ใช้แฟ้มผลงานขอโควตาความสามารถพิเศษเรียนต่อฟรี (ปลดล็อกพิเศษจากพรสวรรค์)',
        description: 'แสดงพรสวรรค์ที่ค้นพบแล้วด้านศิลปะ ดนตรี กีฬา การแสดง หรือการเขียน เพื่อรับทุนโควตา',
        requiredAnyTalents: ['tal_art', 'tal_music', 'tal_athletic', 'tal_acting', 'tal_writing'],
        conditionalUnlockReasonTh: 'ต้องค้นพบพรสวรรค์ด้านศิลปะ ดนตรี กีฬา การแสดง หรือการเขียนก่อนจึงจะยื่นโควตาได้',
        effects: [
          { type: 'SetJob', jobId: 'student', reason: 'เข้าเรียนต่อ ม.ปลาย ด้วยโควตาความสามารถพิเศษ' },
          { type: 'AddFlag', flag: 'won_high_school_scholarship', value: true, reason: 'ได้รับทุนโควตาความสามารถพิเศษ' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 2, reason: 'ภูมิใจที่ได้ใช้ความสามารถเฉพาะตัวช่วยครอบครัว' },
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'มีเส้นทางเฉพาะตัวรองรับการเรียนต่อ' },
        ],
      },
      {
        id: 'special_academic_skill_bursary',
        label: 'สอบชิงทุนมูลนิธิท้องถิ่นสายวิชาการ (ปลดล็อกพิเศษจากทักษะวิชาการ 28+)',
        description: 'นำความแน่นด้านวิชาการเข้าสอบชิงทุนช่วยค่าเทอม',
        requiredSkills: { academic: 28 },
        conditionalUnlockReasonTh: 'ต้องมีทักษะวิชาการและคำนวณตั้งแต่ 28 ขึ้นไปจึงจะผ่านเกณฑ์สอบชิงทุน',
        effects: [
          { type: 'SetJob', jobId: 'student', reason: 'สอบผ่านทุนมูลนิธิเรียนต่อระดับ ม.ปลาย' },
          { type: 'AddFlag', flag: 'won_high_school_scholarship', value: true, reason: 'สอบได้ทุนมูลนิธิการศึกษาท้องถิ่น' },
          { type: 'ChangeMoney', amount: 4000, category: 'event', reason: 'เงินทุนการศึกษาจากมูลนิธิท้องถิ่น' },
        ],
      },
      {
        id: 'special_reliable_patron',
        label: 'ผู้ใหญ่ที่เห็นความขยันออกปากอุปการะค่าเรียน (ปลดล็อกพิเศษจากความน่าเชื่อถือ 55+)',
        description: 'ความประพฤติสม่ำเสมอทำให้ครูหรือญาติผู้ใหญ่ยื่นมือช่วยสนับสนุนค่าเทอม',
        requiredMinRawStats: { reliability: 55 },
        conditionalUnlockReasonTh: 'ต้องมีความน่าเชื่อถือตั้งแต่ 55 ขึ้นไปจึงจะมีผู้ใหญ่ไว้วางใจอุปการะ',
        effects: [
          { type: 'SetJob', jobId: 'student', reason: 'ได้รับการอุปการะค่าเทอม ม.ปลาย จากผู้ใหญ่ที่เอ็นดู' },
          { type: 'AddFlag', flag: 'won_high_school_scholarship', value: true, reason: 'มีผู้อุปการะดูแลค่าเล่าเรียน ม.ปลาย' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'อุ่นใจที่มีผู้ใหญ่คอยช่วยเหลือ' },
        ],
      },
    ],
    weight: 10,
  },
  ...PLANNER_STORYLETS,
  ...AGE_AND_EDU_STORYLETS,
];

/**
 * Live validated Storylet pool.
 * Invalid definitions are automatically excluded at load time.
 */
export const STORYLET_CATALOG: StoryletDef[] = filterValidatedStorylets(RAW_STORYLET_CATALOG);
