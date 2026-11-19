import type { StoryletDef } from '../../engine/storylet';

/**
 * Phase 3.3.1-FIX: Age 6-22 Storylet Expansion (Sections E1 & E2).
 * Pure Thai text, zero emojis, every sceneId verified against sceneManifest.json.
 * Strict rule: Under-15 storylets set `isMinorSafe: true` and carry ZERO cash gain/loss.
 */
export const AGE_AND_EDU_STORYLETS: StoryletDef[] = [
  // ==========================================
  // E2.1 Primary School (6-11 years, 13 cards)
  // ==========================================
  {
    id: 'ev_p1_first_day',
    title: 'วันแรกของการเรียน ป.1',
    bodyTemplate:
      'ชุดนักเรียนใหม่เอี่ยมกับกระเป๋าใบโตหน้าโรงเรียนเช้านี้ทำให้ {firstName} ทั้งตื่นเต้นและแอบประหม่าเมื่อต้องเดินเข้าห้องเรียน ป.1 เป็นครั้งแรก',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    isOneOff: true,
    conditions: { minAge: 6, maxAge: 6, isMinorSafe: true },
    choices: [
      {
        id: 'greet_desk_mate',
        label: 'หันไปยิ้มทักทายเพื่อนที่นั่งข้างโต๊ะก่อน',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 0.8, reason: 'กล้าทักทายเพื่อนใหม่วันเปิดเทอม ป.1' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.5, reason: 'ผูกมิตรเพื่อนตั้งแต่วันแรก' },
        ],
      },
      {
        id: 'sit_quiet_excited',
        label: 'นั่งเงียบ ๆ มองกระดานดำด้วยความตื่นเต้น',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 2, reason: 'ตื่นเต้นกับห้องเรียนใหม่' },
          { type: 'RecordEvidence', key: 'solitude', amount: 1, reason: 'สังเกตบรรยากาศรอบตัวเงียบ ๆ' },
        ],
      },
      {
        id: 'tear_up_miss_home',
        label: 'แอบน้ำตาซึมคิดถึงบ้านจนคุณครูเดินเข้ามาปลอบ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'คุณครูช่วยปลอบให้ใจเย็นลง' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1, reason: 'ยังผูกพันกับที่บ้านมาก' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 'ev_p_lost_tooth',
    title: 'ฟันน้ำนมหลุดซี่แรก',
    bodyTemplate:
      'ระหว่างกินข้าวเย็นที่บ้าน ฟันน้ำนมซี่เล็กที่โยกมาหลายวันของ {firstName} ก็หลุดออกมาพอดี คุณย่ายิ้มเล่าความเชื่อโบราณให้ฟังอย่างเอ็นดู',
    category: 'quirky',
    tier: 'T0',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 3,
    isOneOff: true,
    conditions: { minAge: 6, maxAge: 8, isMinorSafe: true },
    weight: 12,
  },
  {
    id: 'ev_p_lunch_swap',
    title: 'แลกกับข้าวกลางวันกับเพื่อน',
    bodyTemplate:
      'พักเที่ยงใต้ร่มไม้โรงเรียน {firstName} กับเพื่อนสนิทเปิดกล่องข้าวพร้อมกันแล้วตกลงแบ่งไข่เจียวกับผัดผักคนละครึ่งอย่างสนุกสนาน',
    category: 'social',
    tier: 'T0',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 3,
    conditions: { minAge: 6, maxAge: 11, isMinorSafe: true },
    cooldownYears: 1,
    weight: 12,
  },
  {
    id: 'ev_p_scout_camp',
    title: 'ค่ายลูกเสือ-เนตรนารี',
    bodyTemplate:
      'คืนเข้าค่ายพักแรมลูกเสือ-เนตรนารี ทุกคนต้องช่วยกันกางเต็นท์และเตรียมการแสดงรอบกองไฟ แต่พอค่ำลง {firstName} ก็แอบคิดถึงบ้านอยู่เหมือนกัน',
    category: 'social',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'school_public',
    importance: 5,
    conditions: { minAge: 8, maxAge: 11, isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'help_pitch_tent',
        label: 'ช่วยเพื่อนหมู่เดียวกันตอกสมอบกและผูกเชือกเต็นท์',
        effects: [
          { type: 'ChangeSkill', skill: 'craft', delta: 0.8, reason: 'ฝึกผูกเงื่อนและกางเต็นท์ในค่าย' },
          { type: 'RecordEvidence', key: 'help_others', amount: 1.5, reason: 'ร่วมมือช่วยงานหมู่ลูกเสือ' },
        ],
      },
      {
        id: 'sing_around_campfire',
        label: 'ร้องเพลงเชียร์และผูกมิตรกับเพื่อนต่างห้องรอบกองไฟ',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 0.8, reason: 'สนุกกับกิจกรรมรอบกองไฟ' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'หัวเราะคลายคิดถึงบ้าน' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_p_race_day',
    title: 'วิ่งแข่งกีฬาสีประถม',
    bodyTemplate:
      'เสียงกลองเชียร์ดังกระหึ่มสนามหญ้าโรงเรียน เพื่อนร่วมสีชวน {firstName} ลงแข่งวิ่งระยะสั้นรอบคัดเลือกช่วงเช้า',
    category: 'health',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'school_public',
    importance: 5,
    conditions: { minAge: 7, maxAge: 11, isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'sprint_all_out',
        label: 'วิ่งเต็มฝีเท้าสุดกำลังเพื่อเก็บแต้มให้สี',
        effects: [
          { type: 'ChangeSkill', skill: 'athletics', delta: 1, reason: 'ซ้อมและลงแข่งวิ่งกีฬาสีประถม' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'ใช้แรงวิ่งเต็มสปีด' },
        ],
      },
      {
        id: 'run_for_fun',
        label: 'ลงวิ่งเอาสนุกและช่วยเพื่อนเตรียมน้ำดื่ม',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ร่วมสนุกในวันกีฬาสี' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.5, reason: 'สนุกกับเพื่อนในวันกีฬาสี' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_p_childrens_day',
    title: 'วันเด็กแห่งชาติ',
    bodyTemplate:
      'เสาร์สัปดาห์ที่สองของเดือนมกราคม ครอบครัวพา {firstName} ไปเดินเที่ยวงานวันเด็กแถวบ้าน ได้จับสลากของขวัญและเล่นเกมทายปัญหาอย่างเพลิดเพลิน',
    category: 'family',
    tier: 'T0',
    sourceHint: 'calendar',
    sceneId: 'street_shops',
    importance: 3,
    conditions: { minAge: 6, maxAge: 11, calendarMonth: 1, isMinorSafe: true },
    cooldownYears: 1,
    weight: 16,
  },
  {
    id: 'ev_p_friend_fight',
    title: 'ทะเลาะกับเพื่อนสนิท',
    bodyTemplate:
      'เรื่องเข้าใจผิดเล็ก ๆ เรื่องยืมยางลบในห้องเรียนทำให้ {firstName} กับเพื่อนสนิทงอนไม่พูดกันตลอดช่วงบ่าย',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 4,
    conditions: { minAge: 7, maxAge: 11, isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'apologize_first',
        label: 'เดินเข้าไปขอโทษและอธิบายตรง ๆ ก่อนกลับบ้าน',
        effects: [
          { type: 'ChangeRawStat', stat: 'eq', delta: 0.8, reason: 'กล้าขอโทษและปรับความเข้าใจกับเพื่อน' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'คืนดีกับเพื่อนสนิทได้เร็ว' },
        ],
      },
      {
        id: 'wait_or_new_friend',
        label: 'รอให้อีกฝ่ายทักมาก่อนแล้วลองไปคุยเล่นกับเพื่อนโต๊ะอื่น',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 3, reason: 'ยังรู้สึกค้างคาใจอยู่บ้าง' },
          { type: 'RecordEvidence', key: 'solitude', amount: 1, reason: 'เว้นระยะเมื่อเกิดความไม่เข้าใจ' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_p_library',
    title: 'ห้องสมุดโรงเรียนน่าสนใจ',
    bodyTemplate:
      'ช่วงพักกลางวัน {firstName} แวะเข้าห้องสมุดแอร์เย็นของโรงเรียนแล้วหยิบหนังสือนิทานกับการ์ตูนความรู้มานั่งอ่านเพลินจนเกือบหมดคาบพัก (สะสมแท็ก literature_writing)',
    category: 'quirky',
    tier: 'T0',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 3,
    conditions: { minAge: 7, maxAge: 11, isMinorSafe: true },
    cooldownYears: 1,
    weight: 13,
  },
  {
    id: 'ev_p_class_leader',
    title: 'เลือกหัวหน้าห้อง',
    bodyTemplate:
      'ต้นเทอมคุณครูเปิดให้เลือกหัวหน้าห้องคนใหม่ เพื่อนหลายคนหันมามองและเสนอชื่อ {firstName} ขึ้นกระดาน',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    conditions: { minAge: 8, maxAge: 11, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'volunteer_leader',
        label: 'อาสาเป็นหัวหน้าห้อง ช่วยครูดูแลเพื่อนในชั้น',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1, reason: 'รับหน้าที่หัวหน้าห้องประถม' },
          { type: 'ChangeSkill', skill: 'social', delta: 0.8, reason: 'ฝึกประสานงานกับเพื่อนและคุณครู' },
          { type: 'ModifyTeacherGpa', delta: 0.08, reason: 'ช่วยงานครูในห้องเรียนอย่างสม่ำเสมอ' },
        ],
      },
      {
        id: 'decline_leader',
        label: 'ยิ้มปฏิเสธและช่วยเพื่อนอยู่เบื้องหลังแทน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ไม่ต้องแบกภาระหน้าที่หน้าชั้น' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_p_summer_relatives',
    title: 'ปิดเทอมไปบ้านญาติ',
    bodyTemplate:
      'ช่วงปิดเทอมใหญ่ ครอบครัวพา {firstName} ไปพักบ้านญาติต่างอำเภอ มีลูกพี่ลูกน้องมาชวนเล่นและช่วยผู้ใหญ่ทำงานบ้านเล็ก ๆ น้อย ๆ',
    category: 'family',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'home_rural_stilt',
    importance: 4,
    conditions: { minAge: 6, maxAge: 11, calendarMonth: 4, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'play_cousins_help_house',
        label: 'เล่นกับลูกพี่ลูกน้องและช่วยตายายเก็บกวาดบ้าน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'สนุกและอบอุ่นในวันหยุดปิดเทอม' },
          { type: 'RecordEvidence', key: 'family_time', amount: 2, reason: 'ใกล้ชิดญาติผู้ใหญ่และครอบครัว' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_p_stray_pet',
    title: 'หมา/แมวจรหน้าบ้าน',
    bodyTemplate:
      'ตอนเย็นหน้าประตูรั้วบ้าน มีลูกหมาตัวเล็กเดินมานั่งกระดิกหางมองตาแป๋ว {firstName} วิ่งเข้าไปบอกคุณแม่ให้ช่วยกันดู',
    category: 'family',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 4,
    conditions: { minAge: 7, maxAge: 11, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'ask_parents_care',
        label: 'แบ่งข้าวที่บ้านให้กินและถามพ่อแม่ว่าขอเลี้ยงได้ไหม',
        effects: [
          { type: 'ChangeRawStat', stat: 'eq', delta: 0.8, reason: 'เมตตาและดูแลสัตว์ที่หลงมา' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ใจฟูที่ได้ดูแลสัตว์ตัวน้อย' },
        ],
      },
      {
        id: 'pat_gently_leave',
        label: 'ลูบหัวเบา ๆ แล้วปล่อยให้มันเดินกลับซอย',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ยิ้มให้กับความน่ารักหน้าบ้าน' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_p_exam_anxiety',
    title: 'สอบปลายภาคครั้งแรกที่กังวล',
    bodyTemplate:
      'ใกล้สอบปลายภาคประถมปลาย เนื้อหาเริ่มเยอะขึ้นกว่าปีก่อนจน {firstName} เริ่มกังวลกลัวทำข้อสอบไม่ทัน',
    category: 'work',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 5,
    conditions: { minAge: 9, maxAge: 11, isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'review_with_parents',
        label: 'ชวนพ่อแม่ช่วยทวนแบบฝึกหัดและท่องศัพท์ก่อนนอน',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1, reason: 'ทบทวนบทเรียนก่อนสอบกับครอบครัว' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1, reason: 'พ่อแม่ช่วยดูแลการเรียน' },
        ],
      },
      {
        id: 'review_self',
        label: 'อ่านสรุปด้วยตัวเองแล้วเข้านอนเร็ว',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 0.6, reason: 'ฝึกจัดเวลาทบทวนเอง' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'รับผิดชอบการสอบด้วยตัวเอง' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_p_game_envy',
    title: 'เพื่อนในห้องเล่นเกมมือถือเก่ง',
    bodyTemplate:
      'พักเที่ยงเพื่อนกลุ่มใหญ่ล้อมวงคุยเรื่องเกมมือถือยอดฮิต {firstName} นั่งฟังอยู่ข้าง ๆ และอยากลองมีส่วนร่วมบ้าง',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 4,
    conditions: { minAge: 9, maxAge: 11, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'ask_watch_play',
        label: 'ขอนั่งดูและผลัดกันเล่นกับเพื่อนในช่วงพัก',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 0.5, reason: 'เข้ากลุ่มคุยเรื่องเกมกับเพื่อน' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.2, reason: 'ร่วมวงสนุกกับเพื่อนร่วมชั้น' },
        ],
      },
      {
        id: 'focus_other_play',
        label: 'ไม่สนใจแล้วชวนเพื่อนอีกคนไปเตะบอลหน้าเสาธงแทน',
        effects: [
          { type: 'ChangeSkill', skill: 'athletics', delta: 0.6, reason: 'ออกไปวิ่งเล่นกลางแจ้งกับเพื่อน' },
        ],
      },
    ],
    weight: 12,
  },

  // ==========================================
  // E2.2 Lower Secondary M.1-M.3 (12-14 years, 12 cards)
  // ==========================================
  {
    id: 'ev_m1_first_day',
    title: 'วันแรกที่ ม.1 โรงเรียนใหม่',
    bodyTemplate:
      'ก้าวเข้าสู่รั้วมัธยมต้นในชุด ม.1 วันแรก อาคารเรียนกว้างใหญ่กว่าสมัยประถมมาก {firstName} มองหาห้องเรียนและเพื่อนใหม่รอบตัว',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    isOneOff: true,
    conditions: { minAge: 12, maxAge: 12, isMinorSafe: true },
    choices: [
      {
        id: 'make_new_friends',
        label: 'เข้าไปแนะนำตัวกับเพื่อนใหม่ในแถวหน้าเสาธง',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'เริ่มสร้างกลุ่มเพื่อนใหม่ในชั้น ม.1' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.5, reason: 'ปรับตัวเข้ากับเพื่อนมัธยมได้ดี' },
        ],
      },
      {
        id: 'stay_quiet_observe',
        label: 'นั่งเงียบ ๆ ปรับตัวจนกว่าจะได้เจอเพื่อนเก่า',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 2, reason: 'ตื่นเต้นกับการขึ้นชั้นมัธยมต้น' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 'ev_m_puberty',
    title: 'ร่างกายเริ่มเปลี่ยนตามวัย',
    bodyTemplate:
      'ช่วงวัยมัธยมต้น ร่างกายและอารมณ์ของ {firstName} เปลี่ยนแปลงเร็วกว่าเดิม ทั้งส่วนสูง เสียง และอารมณ์อ่อนไหวง่ายขึ้น',
    category: 'health',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 4,
    isOneOff: true,
    conditions: { minAge: 12, maxAge: 14, isMinorSafe: true },
    choices: [
      {
        id: 'ask_parents_pe_teacher',
        label: 'เปิดใจถามผู้ปกครองหรือครูพละเพื่อดูแลตัวเองให้ถูกวิธี',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'เข้าใจความเปลี่ยนแปลงตามวัยอย่างสบายใจ' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: 0.8, reason: 'ดูแลสุขภาพร่างกายช่วงวัยรุ่นตอนต้น' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_m_first_crush',
    title: 'แอบชอบใครสักคนครั้งแรก',
    bodyTemplate:
      'ช่วงเปลี่ยนคาบเรียน {firstName} เผลอหันไปมองเพื่อนร่วมรุ่นคนหนึ่งบ่อยกว่าปกติ หัวใจเต้นแรงขึ้นทุกครั้งที่เดินสวนกันตรงทางเดิน',
    category: 'romance',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    isOneOff: true,
    conditions: { minAge: 12, maxAge: 14, isMinorSafe: true },
    choices: [
      {
        id: 'keep_quiet_crush',
        label: 'เก็บไว้เป็นกำลังใจเงียบ ๆ แล้วตั้งใจเรียนให้ดีขึ้น',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ความรู้สึกสดใสวัย ม.ต้น' },
          { type: 'ChangeSkill', skill: 'academic', delta: 0.6, reason: 'อยากทำให้ตัวเองดูดีขึ้นในห้องเรียน' },
        ],
      },
      {
        id: 'talk_casually',
        label: 'ลองชวนคุยเรื่องการบ้านแบบเพื่อนกันไปก่อน',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 0.8, reason: 'ฝึกกล้าทักทายคนที่ชื่นชม' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_m_new_clique',
    title: 'เข้ากลุ่มเพื่อนกลุ่มใหญ่',
    bodyTemplate:
      'ช่วงหลังเลิกเรียนมีเพื่อนกลุ่มใหญ่ชวน {firstName} ไปเดินเล่นและกินข้าวกลางวันด้วยกันประจำ จะเลือกคบแบบไหนดี',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 4,
    conditions: { minAge: 12, maxAge: 13, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'join_big_clique',
        label: 'เข้ากลุ่มใหญ่เฮฮากับเพื่อนหลายห้อง',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'เรียนรู้การปรับตัวเข้ากับเพื่อนหลากหลาย' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 2, reason: 'ชอบความคึกคักในกลุ่มเพื่อน' },
        ],
      },
      {
        id: 'pick_close_few',
        label: 'เลือกสนิทกับเพื่อนที่ไว้ใจได้แค่ไม่กี่คน',
        effects: [
          { type: 'ChangeRawStat', stat: 'eq', delta: 0.8, reason: 'รักษามิตรภาพเชิงลึกที่สบายใจ' },
          { type: 'RecordEvidence', key: 'solitude', amount: 1, reason: 'เลือกความสงบมากกว่าความวุ่นวาย' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_m_study_group',
    title: 'เพื่อนชวนติวสอบกลางภาค',
    bodyTemplate:
      'สัปดาห์หน้าจะสอบกลางภาคแล้ว เพื่อนในห้องชวน {firstName} นั่งจับกลุ่มติวเลขและวิทย์ในโรงอาหารหลังเลิกเรียน',
    category: 'work',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    conditions: { minAge: 12, maxAge: 14, jobIds: ['student'], isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'study_focus_group',
        label: 'ตั้งใจช่วยกันทำโจทย์จริงจังจนเข้าใจครบ',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1.2, reason: 'ติวสอบกลางภาคกับเพื่อน' },
          { type: 'ModifyTeacherGpa', delta: 0.05, reason: 'เตรียมสอบกลางภาคได้ดี' },
        ],
      },
      {
        id: 'chat_mostly',
        label: 'ไปนั่งด้วยแต่คุยเล่นกันเสียส่วนใหญ่',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'คลายเครียดกับเพื่อนหลังเลิกเรียน' },
          { type: 'ChangeSkill', skill: 'social', delta: 0.6, reason: 'สนิทกับเพื่อนในห้องมากขึ้น' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_m_field_trip',
    title: 'ทัศนศึกษา',
    bodyTemplate:
      'วันทัศนศึกษานอกสถานที่ รถบัสโรงเรียนพา {firstName} และเพื่อน ๆ ไปชมพิพิธภัณฑ์และศูนย์เรียนรู้วิทยาศาสตร์ประจำจังหวัด',
    category: 'social',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'school_public',
    importance: 4,
    conditions: { minAge: 12, maxAge: 14, isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'learn_actively',
        label: 'จดบันทึกนิทรรศการและเดินถ่ายรูปกับเพื่อนครบทุกโซน',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 0.8, reason: 'เปิดโลกความรู้นอกห้องเรียน' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'เปลี่ยนบรรยากาศนอกโรงเรียน' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_m_first_phone',
    title: 'ได้โทรศัพท์เครื่องแรก',
    bodyTemplate:
      'ผู้ปกครองตกลงซื้อมือถือเครื่องแรกให้ {firstName} ไว้ใช้ติดต่อรับส่งกลับบ้านและค้นคว้าการเรียน พร้อมตั้งกติกาเวลาใช้งานในบ้าน',
    category: 'family',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 5,
    isOneOff: true,
    conditions: {
      minAge: 12,
      maxAge: 13,
      wealth: ['lower_middle', 'middle', 'upper_middle', 'wealthy'],
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'use_disciplined',
        label: 'ใช้งานอย่างมีวินัย แบ่งเวลาติดต่อเพื่อนและหาความรู้',
        effects: [
          { type: 'ChangeSkill', skill: 'tech', delta: 1, reason: 'คุ้นเคยกับการใช้งานสมาร์ตโฟนและค้นข้อมูล' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'รักษากติกาการใช้มือถือของที่บ้าน' },
        ],
      },
      {
        id: 'play_overtime_limited',
        label: 'เล่นเพลินจนดึกจนผู้ปกครองต้องจำกัดเวลาหน้าจอ',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -4, reason: 'นอนดึกเพราะติดหน้าจอมือถือ' },
          { type: 'RecordEvidence', key: 'hobby_focus', amount: 1, reason: 'สนใจคอนเทนต์และเกมบนมือถือ' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_m_group_chat_tease',
    title: 'โดนแซวในกลุ่มแชท',
    bodyTemplate:
      'คืนหนึ่ง {firstName} เปิดแชทห้องแล้วเห็นเพื่อนบางคนส่งมีมล้อเลียนเรื่องพลาดหน้าเสาธงเมื่อเช้า ทำให้รู้สึกอึดอัดและไม่แน่ใจว่าจะจัดการยังไงดี',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 6,
    conditions: { minAge: 13, maxAge: 14, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'reply_calmly_or_mute',
        label: 'บอกตรง ๆ ว่าไม่โอเคแล้วปิดแจ้งเตือนกลุ่มไปพักใจ',
        effects: [
          { type: 'ChangeRawStat', stat: 'eq', delta: 1.5, reason: 'กำหนดขอบเขตการล้อเลียนอย่างมีสติ' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'จัดการความอึดอัดทางอารมณ์ได้' },
        ],
      },
      {
        id: 'tell_homeroom_teacher',
        label: 'แคปหลักฐานไว้ปรึกษาคุณครูที่ปรึกษาและผู้ปกครอง',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1, reason: 'พึ่งพาผู้ใหญ่ที่ไว้ใจได้เมื่อถูกล้อเกินขอบเขต' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1.5, reason: 'ปรึกษาครอบครัวเมื่อมีปัญหาที่โรงเรียน' },
        ],
      },
    ],
    weight: 11,
  },
  {
    id: 'ev_m_exam_pressure',
    title: 'เครียดสอบเข้า ม.4',
    bodyTemplate:
      'เข้าสู่เทอมสุดท้ายของ ม.3 แล้ว เพื่อนหลายคนเริ่มเร่งอ่านหนังสือและกวดวิชาเข้า ม.4 จนบรรยากาศในห้องตึงเครียดขึ้นอย่างเห็นได้ชัด',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 7,
    conditions: { minAge: 14, maxAge: 14, jobIds: ['student'], isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'cram_hard_m3',
        label: 'วางแผนติวเข้มวันละบทอย่างมีวินัย',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1.5, reason: 'อ่านสรุปและทำโจทย์เตรียมสอบเข้า ม.4' },
          { type: 'ChangeResource', resource: 'stress', delta: 5, reason: 'กดดันจากการเร่งเตรียมสอบ' },
          { type: 'ModifyTeacherGpa', delta: 0.08, reason: 'ส่งงานและทำคะแนนโค้งสุดท้ายได้ดี' },
        ],
      },
      {
        id: 'pace_and_consult',
        label: 'จัดตารางพักผ่อนให้พอแล้วขอคำแนะนำจากครูแนะแนว',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'เห็นแนวทางเลือกสาย ม.ปลาย ชัดเจนขึ้น' },
          { type: 'ChangeRawStat', stat: 'wit', delta: 1, reason: 'ประเมินความถนัดของตัวเองอย่างมีเหตุผล' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_m_rotc_story',
    title: 'รุ่นพี่เล่าเรื่อง รด.',
    bodyTemplate:
      'ช่วงใกล้จบ ม.3 รุ่นพี่ ม.4 แวะมาเล่าประสบการณ์ฝึก รด. ให้ฟัง ทั้งความเหนื่อย ความสนุกกับเพื่อนต่างโรงเรียน และสิทธิ์ยกเว้นเกณฑ์ทหารในอนาคต',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 4,
    isOneOff: true,
    conditions: { minAge: 14, maxAge: 14, isMinorSafe: true },
    choices: [
      {
        id: 'interested_rotc',
        label: 'ฟังอย่างตั้งใจแล้วกลับไปถามความเห็นพ่อแม่ไว้ล่วงหน้า',
        effects: [
          { type: 'AddFlag', flag: 'rotc_preview_interested', value: true, reason: 'สนใจข้อมูลการสมัคร รด. ตอน ม.4' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1, reason: 'ปรึกษาครอบครัวล่วงหน้าก่อนขึ้น ม.ปลาย' },
        ],
      },
      {
        id: 'not_interested_rotc',
        label: 'ฟังผ่าน ๆ เพราะอยากเก็บวันหยุดไว้พักหรือฝึกทักษะอื่น',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'โฟกัสความสนใจด้านอื่นของตัวเอง' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_m_help_relative',
    title: 'ช่วยงานร้านญาติเป็นบางวัน',
    bodyTemplate:
      'วันเสาร์ญาติชวน {firstName} มาช่วยดูหน้าร้านและจัดของเล็ก ๆ น้อย ๆ เพื่อฝึกความคล่องตัว (ช่วยที่บ้าน ไม่มีค่าจ้าง)',
    category: 'family',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'shop_minimart',
    importance: 4,
    conditions: { minAge: 13, maxAge: 14, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'help_store_fully',
        label: 'ช่วยจัดของและช่วยจดรายการอย่างคล่องแคล่ว',
        effects: [
          { type: 'ChangeSkill', skill: 'business', delta: 0.8, reason: 'ได้สังเกตการจัดการร้านค้าจริง' },
          { type: 'RecordEvidence', key: 'help_others', amount: 1.5, reason: 'มีน้ำใจช่วยงานญาติผู้ใหญ่' },
        ],
      },
      {
        id: 'help_just_enough',
        label: 'ช่วยเท่าที่ไหวแล้วขอออกไปเดินเล่นกับเพื่อนต่อ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ได้ทั้งช่วยงานเล็กน้อยและพักผ่อน' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_m_parents_argue',
    title: 'พ่อแม่ทะเลาะกัน',
    bodyTemplate:
      'คืนหนึ่งเสียงเถียงกันเรื่องค่าใช้จ่ายและเรื่องจุกจิกดังมาจากห้องนั่งเล่น {firstName} นั่งฟังอยู่เงียบ ๆ และไม่รู้ควรทำตัวอย่างไรดี',
    category: 'family',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 6,
    conditions: { minAge: 12, maxAge: 14, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'mediate_gently',
        label: 'ยกน้ำไปให้ทั้งคู่แล้วขอให้คุยกันใจเย็น ๆ',
        effects: [
          { type: 'ChangeRawStat', stat: 'eq', delta: 1.5, reason: 'ช่วยคลี่คลายบรรยากาศตึงเครียดในบ้าน' },
          { type: 'ChangeResource', resource: 'stress', delta: 3, reason: 'แอบกังวลแทนผู้ใหญ่ในบ้าน' },
        ],
      },
      {
        id: 'retreat_to_room',
        label: 'หลบเข้าห้องพักใจหรือทักไประบายกับเพื่อนสนิท',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'บรรยากาศในบ้านไม่ค่อยสบายใจ' },
          { type: 'RecordEvidence', key: 'solitude', amount: 1.5, reason: 'ถอยห่างจากความขัดแย้งในครอบครัว' },
        ],
      },
    ],
    weight: 11,
  },

  // ==========================================
  // E2.3 Upper Secondary M.4-M.6 (15-17 years, 14 cards)
  // ==========================================
  {
    id: 'ev_u_m4_first_day',
    title: 'วันแรกของ ม.4 ตามสายที่เลือก',
    bodyTemplate:
      'วันเปิดเทอม ม.4 หรือ ปวช. ปี 1 มาถึงแล้ว {firstName} เดินเข้าห้องเรียนใหม่ เจอเพื่อนร่วมสายการเรียนและอาจารย์ประจำวิชาคนใหม่',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    isOneOff: true,
    conditions: { minAge: 15, maxAge: 15, jobIds: ['student'], isMinorSafe: true },
    choices: [
      {
        id: 'connect_track_peers',
        label: 'ทำความรู้จักเพื่อนร่วมสายและจดตารางเรียนอย่างกระตือรือร้น',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'เริ่มต้นมิตรภาพใหม่ในสาย ม.ปลาย' },
          { type: 'ChangeSkill', skill: 'academic', delta: 0.8, reason: 'ตั้งเป้าหมายการเรียนตั้งแต่ต้นเทอม' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 'ev_u_rotc_training',
    title: 'ฝึก รด. ครั้งแรก',
    bodyTemplate:
      'วันเสาร์แรกที่ศูนย์ฝึกนักศึกษาวิชาทหาร แดดจ้า เสียงนกหวีด และแถวตรงยาวเหยียดทำให้ {firstName} ทั้งเหนื่อยและได้เพื่อนร่วมรุ่นสายวินัยเพียบ',
    category: 'health',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    isOneOff: true,
    conditions: { minAge: 15, maxAge: 16, requiredFlags: ['rotc_enrolled'], isMinorSafe: true },
    choices: [
      {
        id: 'complete_first_drill',
        label: 'กัดฟันฝึกจนครบวันแรกและผูกมิตรกับเพื่อนร่วมกองร้อย',
        effects: [
          { type: 'ChangeSkill', skill: 'athletics', delta: 1.5, reason: 'ฝึกแถวและออกกำลังกายวันฝึก รด.' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: 1, reason: 'ร่างกายทนแดดทนฝึกมากขึ้น' },
          { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'เหนื่อยล้าจากการฝึกกลางแจ้งวันหยุด' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 'ev_u_bike_license',
    title: 'ใบขับขี่จักรยานยนต์',
    bodyTemplate:
      'อายุถึงเกณฑ์สอบใบขับขี่รถจักรยานยนต์แล้ว ช่วยให้เดินทางไปเรียนหรือไปทำธุระคล่องตัวขึ้น {firstName} คิดว่าจะไปสอบเลยหรือรอก่อนดี',
    category: 'quirky',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'street_shops',
    importance: 4,
    isOneOff: true,
    conditions: { minAge: 15, maxAge: 17, isMinorSafe: true },
    choices: [
      {
        id: 'take_bike_test',
        label: 'ขอพ่อแม่พาลองซ้อมแล้วไปสอบใบขับขี่ให้ถูกต้อง',
        effects: [
          { type: 'AddFlag', flag: 'has_motorcycle_license', value: true, reason: 'สอบผ่านใบขับขี่จักรยานยนต์' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1, reason: 'ปฏิบัติตามกฎจราจรอย่างถูกต้อง' },
        ],
      },
      {
        id: 'wait_later_license',
        label: 'รอก่อน ยังเดินทางรถสาธารณะสะดวกอยู่',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -1, reason: 'ไม่ต้องรีบรับผิดชอบรถส่วนตัว' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_u_cram_school',
    title: 'กวดวิชาช่วง ม.5',
    bodyTemplate:
      'ขึ้น ม.5 เนื้อหาวิชาเฉพาะเข้มข้นขึ้นมาก เพื่อนหลายคนเริ่มลงคอร์สกวดวิชาช่วงเย็นหรือเสาร์อาทิตย์ {firstName} เองก็ต้องตัดสินใจเรื่องการติว',
    category: 'work',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'cafe',
    importance: 5,
    conditions: { minAge: 16, maxAge: 16, jobIds: ['student'], isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'tutor_with_friends',
        label: 'จับกลุ่มติวกับเพื่อนและทำข้อสอบเก่าด้วยตัวเอง',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1.2, reason: 'ทบทวนโจทย์ ม.5 กับกลุ่มเพื่อน' },
          { type: 'ModifyTeacherGpa', delta: 0.06, reason: 'คะแนนเก็บในห้องดีขึ้นจากการทำโจทย์' },
        ],
      },
      {
        id: 'skip_cram_rest',
        label: 'เน้นเรียนในห้องให้เข้าใจแล้วเก็บเวลาพักผ่อน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ไม่เร่งเรียนหนักจนเกินพอดี' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_u_first_love',
    title: 'คบกับใครครั้งแรก',
    bodyTemplate:
      'ความสนิทสนมที่คุยกันมาหลายเดือนค่อย ๆ ชัดเจนขึ้นจนอีกฝ่ายเอ่ยปากขอคบหาเป็นแฟนอย่างจริงจังในวัย ม.ปลาย',
    category: 'romance',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'cafe',
    importance: 6,
    conditions: { minAge: 15, maxAge: 17, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'date_openly',
        label: 'ตกลงคบกันอย่างเปิดเผยและคอยช่วยกันเรียน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'มีกำลังใจดีในวัยมัธยมปลาย' },
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'เรียนรู้การสื่อสารกับคนพิเศษ' },
          { type: 'AddFlag', flag: 'teen_first_relationship', value: true, reason: 'คบหาดูใจช่วง ม.ปลาย' },
        ],
      },
      {
        id: 'stay_close_friends',
        label: 'ขอชะลอไว้เป็นเพื่อนสนิทก่อนจนกว่าจะเข้ามหาวิทยาลัย',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1, reason: 'โฟกัสเป้าหมายการเรียนช่วงสำคัญ' },
        ],
      },
    ],
    weight: 11,
  },
  {
    id: 'ev_u_friend_drift',
    title: 'เพื่อนสนิทห่างกัน',
    bodyTemplate:
      'พอแยกสายการเรียนและต่างคนต่างมีกิจกรรมใหม่ เพื่อนที่เคยตัวติดกันสมัย ม.ต้น ก็เริ่มคุยกันน้อยลงจน {firstName} รู้สึกใจหาย',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 5,
    conditions: { minAge: 15, maxAge: 17, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'reach_out_talk',
        label: 'ทักไปชวนคุยและนัดกินข้าวกลางวันด้วยกันเหมือนเดิม',
        effects: [
          { type: 'ChangeRawStat', stat: 'eq', delta: 1, reason: 'รักษามิตรภาพเดิมด้วยความใส่ใจ' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'โล่งใจที่ได้กลับมาคุยกันดี' },
        ],
      },
      {
        id: 'accept_drift_new_friends',
        label: 'เข้าใจว่าเป็นธรรมดาของการเติบโตแล้วเปิดใจหาเพื่อนใหม่',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'ปรับตัวสร้างวงสังคมใหม่' },
        ],
      },
    ],
    weight: 11,
  },
  {
    id: 'ev_u_career_guidance',
    title: 'กิจกรรมแนะแนวอาชีพและการศึกษาต่อ',
    bodyTemplate:
      'หอประชุมโรงเรียนจัดงานแนะแนวอาชีพ มีรุ่นพี่จากหลายคณะและหลากหลายสายงานมาเล่าเส้นทางชีวิตหลังจบ ม.6 / ปวช.',
    category: 'work',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'school_public',
    importance: 5,
    conditions: { minAge: 16, maxAge: 16, jobIds: ['student'], isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'listen_and_ask_counselor',
        label: 'ตั้งใจจดข้อมูลคณะและเข้าไปปรึกษาครูแนะแนวหลังจบงาน',
        effects: [
          { type: 'ChangeRawStat', stat: 'wit', delta: 1, reason: 'เห็นภาพรวมเส้นทางคณะและอาชีพชัดขึ้น' },
          { type: 'ChangeSkill', skill: 'academic', delta: 0.6, reason: 'วางแผนเตรียมตัวเข้าศึกษาต่อ' },
        ],
      },
      {
        id: 'listen_casually',
        label: 'นั่งฟังผ่าน ๆ กับเพื่อนหลังหอประชุม',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ไม่กดดันเรื่องอนาคตเร็วเกินไป' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_u_open_house',
    title: 'มหาวิทยาลัยโอเพ่นเฮาส์',
    bodyTemplate:
      'สุดสัปดาห์นี้มหาวิทยาลัยใหญ่เปิดบ้านต้อนรับนักเรียน ม.ปลาย เข้าชมคณะและลองทำเวิร์กช็อปสายอาชีพจริง',
    category: 'work',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'university',
    importance: 5,
    conditions: { minAge: 16, maxAge: 17, jobIds: ['student'], isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'attend_open_house',
        label: 'ไปเดินชมซุ้มคณะที่สนใจและเก็บเกียรติบัตรเวิร์กช็อป',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1, reason: 'ได้แรงบันดาลใจจากงานโอเพ่นเฮาส์' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'เตรียมข้อมูลอนาคตล่วงหน้า' },
        ],
      },
      {
        id: 'skip_open_house',
        label: 'อยู่บ้านพักผ่อนและทบทวนวิชาที่ยังไม่ถนัด',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 4, reason: 'พักผ่อนวันหยุด' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_u_portfolio_stuck',
    title: 'ทำพอร์ตแล้วติดขัด',
    bodyTemplate:
      'ใกล้กำหนดส่งแฟ้มสะสมผลงานรอบพอร์ตโฟลิโอแล้ว แต่ {firstName} ยังจัดเรียงผลงานและเขียนเรียงความแนะนำตัวได้ไม่ลงตัวสักที',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 7,
    conditions: { minAge: 17, maxAge: 17, jobIds: ['student'], isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'ask_teacher_review_port',
        label: 'นำร่างพอร์ตไปให้คุณครูช่วยตรวจและปรับแก้ทีละหน้า',
        effects: [
          { type: 'ChangeSkill', skill: 'literature_writing', delta: 1, reason: 'ปรับสำนวนการเล่าเรื่องในพอร์ต' },
          { type: 'ModifyTeacherGpa', delta: 0.08, reason: 'ตั้งใจปรึกษาครูเตรียมเข้ามหาวิทยาลัย' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'มั่นใจในแฟ้มผลงานมากขึ้น' },
        ],
      },
      {
        id: 'adjust_target_plan',
        label: 'ปรับเป้าหมายเตรียมลุยรอบสอบกลางแทนหากพอร์ตยังไม่พร้อม',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1, reason: 'เบนเข็มทุ่มเตรียมสอบวิชาการ' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_u_graduation_party',
    title: 'ปัจฉิมนิเทศและงานเลี้ยงส่ง ม.6',
    bodyTemplate:
      'เสื้อนักเรียนเต็มไปด้วยลายเซ็นปากกาเมจิกและพวงมาลัยดอกไม้จากเพื่อนร่วมรุ่น วันปัจฉิมนิเทศ ม.6 มาถึงเร็วกว่าที่คิด',
    category: 'social',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'school_public',
    importance: 6,
    isOneOff: true,
    conditions: { minAge: 17, maxAge: 17, jobIds: ['student'], isMinorSafe: true },
    choices: [
      {
        id: 'celebrate_graduation',
        label: 'ร่วมถ่ายรูปและช่วยเพื่อนจัดงานอำลาอย่างเต็มที่',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'บันทึกความทรงจำแสนอบอุ่นวันจบ ม.6' },
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'รักษาคอนเนกชันเพื่อนร่วมรุ่นก่อนแยกย้าย' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 'ev_u_viral_post',
    title: 'โพสต์ติดกระแสเล็ก ๆ',
    bodyTemplate:
      'คลิปสั้นหรือภาพวาดที่ {firstName} ลงไว้เล่น ๆ ดันมียอดแชร์พุ่งขึ้นหลายพันในชั่วข้ามคืนจนเพื่อนในโรงเรียนทักกันไม่หยุด',
    category: 'quirky',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 5,
    conditions: { minAge: 15, maxAge: 17, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'ride_small_wave',
        label: 'ใช้โอกาสนี้ต่อยอดทำผลงานชิ้นต่อไปด้วยความระมัดระวัง',
        effects: [
          { type: 'ChangeSkill', skill: 'tech', delta: 1, reason: 'เรียนรู้จังหวะโซเชียลและสร้างคอนเทนต์' },
          { type: 'ChangeRawStat', stat: 'creativity', delta: 1, reason: 'มีกำลังใจสร้างสรรค์ผลงาน' },
        ],
      },
      {
        id: 'stay_low_profile',
        label: 'ปล่อยผ่านเงียบ ๆ ไม่อยากตกเป็นเป้าสายตา',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'รักษาความเป็นส่วนตัว' },
        ],
      },
    ],
    weight: 10,
  },
  {
    id: 'ev_u_want_expensive',
    title: 'อยากได้ของแพงเหมือนเพื่อน',
    bodyTemplate:
      'เพื่อนในกลุ่มเพิ่งเปลี่ยนแกดเจ็ตและรองเท้ารุ่นใหม่เอี่ยม ทำเอา {firstName} แอบลังเลอยากมีบ้างทั้งที่ราคายังสูงเกินงบ',
    category: 'finance',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'street_shops',
    importance: 4,
    conditions: { minAge: 15, maxAge: 17, isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'save_slowly_self',
        label: 'ตั้งเป้าทยอยเก็บเงินตัวเองให้ถึงก่อนค่อยซื้อ',
        effects: [
          { type: 'RecordEvidence', key: 'save_money', amount: 2, reason: 'ยับยั้งชั่งใจไม่ซื้อของเกินตัว' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.8, reason: 'รู้จักวางแผนการเงินตั้งแต่ ม.ปลาย' },
        ],
      },
      {
        id: 'let_it_pass',
        label: 'ปล่อยผ่าน เพราะของที่มีอยู่ยังใช้งานได้ดี',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ไม่กดดันตัวเองตามกระแส' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_u_family_expect',
    title: 'พ่อแม่คาดหวังเรื่องคณะ',
    bodyTemplate:
      'มื้อค่ำวันนี้พ่อแม่เปิดประเด็นเรื่องคณะในฝันที่อยากให้ {firstName} สอบเข้า แต่ใจจริงของคุณกลับมองเห็นอีกเส้นทางที่ถนัดมากกว่า',
    category: 'family',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_thai_house',
    importance: 7,
    conditions: { minAge: 16, maxAge: 17, jobIds: ['student'], isMinorSafe: true },
    cooldownYears: 2,
    choices: [
      {
        id: 'explain_own_reasons',
        label: 'เตรียมข้อมูลงานและอธิบายเหตุผลของตัวเองให้ท่านเข้าใจ',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1.2, reason: 'สื่อสารเหตุผลกับครอบครัวอย่างผู้ใหญ่' },
          { type: 'ChangeRawStat', stat: 'eq', delta: 1, reason: 'ใจเย็นรับฟังและเจรจากับพ่อแม่' },
        ],
      },
      {
        id: 'compromise_think',
        label: 'รับฟังไว้ก่อนและขอเวลาทบทวนอีกสักเทอม',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'คิดหนักเรื่องความคาดหวังของครอบครัว' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_u_tired_streak',
    title: 'เหนื่อยล้าสะสมกลางเทอม',
    bodyTemplate:
      'ทั้งการบ้าน โปรเจกต์ และตารางสอบย่อยถาโถมเข้ามาพร้อมกันจน {firstName} รู้สึกหมดแรงตั้งแต่กลางเทอม',
    category: 'health',
    tier: 'T2',
    sourceHint: 'stat_threshold',
    sceneId: 'home_thai_house',
    importance: 6,
    conditions: { minAge: 16, maxAge: 17, minStress: 55, isMinorSafe: true },
    cooldownYears: 1,
    choices: [
      {
        id: 'rest_seriously',
        label: 'ยอมวางหนังสือหนึ่งสุดสัปดาห์เพื่อพักฟื้นร่างกายจริงจัง',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 14, reason: 'พักเต็มอิ่มช่วงกลางเทอม' },
          { type: 'ChangeResource', resource: 'stress', delta: -12, reason: 'คลายความตึงเครียดสะสม' },
        ],
      },
      {
        id: 'push_on_stubborn',
        label: 'ฝืนอ่านต่อให้จบสัปดาห์ก่อนแล้วค่อยพัก',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1, reason: 'เก็บเนื้อหาทันเพื่อน' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'ล้าสะสมมากขึ้น' },
        ],
      },
    ],
    weight: 12,
  },

  // ==========================================
  // E2.4 University (18-22 years, 12 cards)
  // ==========================================
  {
    id: 'ev_c_move_in',
    title: 'ย้ายเข้าหอพัก/คอนโดใกล้มหาวิทยาลัย',
    bodyTemplate:
      'กล่องสัมภาระวางเรียงเต็มหน้าห้องพักใกล้มหาวิทยาลัย {firstName} เริ่มต้นชีวิตกึ่งอิสระนอกบ้านเป็นครั้งแรก',
    category: 'family',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_condo_mid',
    importance: 6,
    isOneOff: true,
    conditions: { minAge: 18, maxAge: 18, jobIds: ['student'] },
    choices: [
      {
        id: 'unpack_independently',
        label: 'จัดห้องและวางงบรายจ่ายรายเดือนด้วยตัวเองตั้งแต่วันแรก',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1.5, reason: 'ฝึกดูแลชีวิตหอพักด้วยตัวเอง' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'ขนของและจัดห้องตลอดบ่าย' },
        ],
      },
      {
        id: 'parents_help_move',
        label: 'ให้ครอบครัวช่วยจัดของแล้วทานมื้อเย็นด้วยกันก่อนท่านกลับ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'อุ่นใจจากกำลังใจของครอบครัว' },
          { type: 'RecordEvidence', key: 'family_time', amount: 2, reason: 'ใช้เวลาส่งเข้าหอพักกับที่บ้าน' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 'ev_c_orientation',
    title: 'ปฐมนิเทศและเปิดภาคเรียนแรก',
    bodyTemplate:
      'วันปฐมนิเทศเฟรชชี่ในหอประชุมมหาวิทยาลัย เต็มไปด้วยรุ่นพี่และเพื่อนใหม่จากหลายจังหวัดที่กำลังจะใช้ชีวิตในรั้วมหาวิทยาลัยร่วมกัน',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'university',
    importance: 5,
    isOneOff: true,
    conditions: { minAge: 18, maxAge: 18, jobIds: ['student'] },
    choices: [
      {
        id: 'join_orientation_activities',
        label: 'ร่วมกิจกรรมรับน้องสร้างสรรค์และแลกช่องทางติดต่อกับเพื่อนคณะ',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'รู้จักเพื่อนร่วมรุ่นในคณะ' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'บรรยากาศเปิดเทอมคึกคัก' },
        ],
      },
    ],
    weight: 16,
  },
  {
    id: 'ev_c_roommate',
    title: 'เพื่อนร่วมห้อง',
    bodyTemplate:
      'หลังอยู่หอพักมาระยะหนึ่ง เรื่องเวลานอน ความสะอาด และการใช้แอร์เริ่มต้องคุยตกลงกติกากับรูมเมตให้ลงตัว',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_condo_mid',
    importance: 5,
    conditions: { minAge: 18, maxAge: 19, jobIds: ['student'] },
    cooldownYears: 2,
    choices: [
      {
        id: 'agree_room_rules',
        label: 'นั่งคุยตกลงกติกาเวรทำความสะอาดและเวลาปิดไฟอย่างชัดเจน',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1.2, reason: 'เจรจาอยู่ร่วมกับรูมเมตได้ราบรื่น' },
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'ห้องพักเป็นระเบียบสบายใจขึ้น' },
        ],
      },
      {
        id: 'put_up_silently',
        label: 'ยอมปรับตัวเงียบ ๆ ไม่อยากมีปัญหาในห้อง',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'อึดอัดเล็กน้อยกับการไม่กล้าพูดตรง ๆ' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_c_first_exam_fail',
    title: 'สอบวิชาแรกพลาด',
    bodyTemplate:
      'คะแนนมิดเทอมวิชาหลักของมหาวิทยาลัยออกมาต่ำกว่าที่คาดไว้มาก ทำเอา {firstName} ใจหายวาบว่าต้องรีบแก้เกมก่อนไฟนอล',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'university',
    importance: 7,
    conditions: { minAge: 18, maxAge: 19, jobIds: ['student'], maxGpa: 2.85 },
    cooldownYears: 2,
    choices: [
      {
        id: 'consult_professor_ta',
        label: 'เข้าพบอาจารย์และรุ่นพี่ TA เพื่อขอแนวทางทบทวนใหม่',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1.5, reason: 'แก้ไขจุดอ่อนก่อนสอบปลายภาค' },
          { type: 'ModifyTeacherGpa', delta: 0.12, reason: 'อาจารย์เห็นความตั้งใจและช่วยแนะนำเพิ่มเติม' },
        ],
      },
      {
        id: 'study_alone_harder',
        label: 'ก้มหน้าก้มตาท่องและทำโจทย์เพิ่มเองทุกคืน',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1, reason: 'ฮึดสู้แก้คะแนนไฟนอล' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'อดหลับอดนอนอ่านทบทวน' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_c_club_invite',
    title: 'ชมรมในมหาวิทยาลัยชวนเข้า',
    bodyTemplate:
      'ลานกิจกรรมเปิดบูธชมรมนักศึกษา รุ่นพี่สายกิจกรรมชวน {firstName} ลงชื่อเข้าชมรมและลองมาทำโปรเจกต์แรกด้วยกัน',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'university',
    importance: 5,
    conditions: { minAge: 18, maxAge: 19, jobIds: ['student'] },
    cooldownYears: 2,
    choices: [
      {
        id: 'join_uni_club_card',
        label: 'ตกลงเข้าชมรมเพื่อฝึกทักษะและหาเพื่อนต่างคณะ',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1.2, reason: 'ร่วมกิจกรรมชมรมมหาวิทยาลัย' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 2, reason: 'กระตือรือร้นร่วมกิจกรรมมหาลัย' },
        ],
      },
      {
        id: 'wait_and_see_club',
        label: 'ขอรับใบปลิวไว้ดูก่อนเพราะอยากดูตารางเรียนให้ชัวร์',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -1, reason: 'จัดเวลาให้ลงตัวก่อนรับกิจกรรมเพิ่ม' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_c_copy_dilemma',
    title: 'เพื่อนขอลอกงาน',
    bodyTemplate:
      'คืนก่อนส่งรายงานสำคัญ เพื่อนในกลุ่มทักมาขอไฟล์งานฉบับเต็มของ {firstName} ไปแก้ชื่อส่งตรง ๆ เพราะทำไม่ทันกำหนด',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'home_condo_mid',
    importance: 6,
    conditions: { minAge: 18, maxAge: 22, jobIds: ['student'] },
    cooldownYears: 2,
    choices: [
      {
        id: 'teach_instead_of_copy',
        label: 'ปฏิเสธไม่ให้ลอกไฟล์ตรง ๆ แต่ส่งโครงร่างและช่วยติวให้แทน',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1.5, reason: 'ซื่อสัตย์ต่อผลงานวิชาการและยังช่วยเพื่อนถูกวิธี' },
          { type: 'ChangeSkill', skill: 'social', delta: 0.8, reason: 'ปฏิเสธอย่างนุ่มนวลและรักษาความสัมพันธ์' },
        ],
      },
      {
        id: 'let_copy_warning',
        label: 'ส่งให้ไปดูเป็นตัวอย่างทั้งที่แอบหวั่นใจเรื่องอาจารย์จับได้',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 5, reason: 'ลุ้นว่างานจะซ้ำจนโดนหักคะแนน' },
          { type: 'ModifyTeacherGpa', delta: -0.1, reason: 'ความน่าเชื่อถือของรายงานลดลง' },
        ],
      },
    ],
    weight: 12,
  },
  {
    id: 'ev_c_group_project',
    title: 'งานกลุ่มเพื่อนไม่ช่วย',
    bodyTemplate:
      'เหลืออีก 3 วันต้องพรีเซนต์งานกลุ่มวิชาใหญ่ แต่สมาชิกครึ่งทีมยังเงียบหายไม่ส่งส่วนของตัวเองมาให้รวมเล่ม',
    category: 'work',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'university',
    importance: 5,
    conditions: { minAge: 19, maxAge: 22, jobIds: ['student'] },
    cooldownYears: 1,
    choices: [
      {
        id: 'chase_and_split_clearly',
        label: 'ทวงงานในกลุ่มอย่างจริงจังและรีบปั่นส่วนที่ขาดให้ทันส่ง',
        effects: [
          { type: 'ChangeSkill', skill: 'business', delta: 1, reason: 'บริหารจัดการทีมและเดดไลน์เฉพาะหน้า' },
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'แบกรับงานกลุ่มใกล้เดดไลน์' },
          { type: 'ModifyTeacherGpa', delta: 0.06, reason: 'งานกลุ่มเสร็จเรียบร้อยทันส่ง' },
        ],
      },
    ],
    weight: 13,
  },
  {
    id: 'ev_c_intern_hunt',
    title: 'หาที่ฝึกงาน',
    bodyTemplate:
      'ขึ้นปี 3 แล้ว ต้องยื่นเรซูเม่หาที่ฝึกงานภาคฤดูร้อนให้ตรงสาย {firstName} นั่งไล่ส่งพอร์ตและเตรียมสัมภาษณ์รอบแรก',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'work_corporate',
    importance: 7,
    conditions: { minAge: 20, maxAge: 21, jobIds: ['student'] },
    cooldownYears: 2,
    choices: [
      {
        id: 'apply_top_companies',
        label: 'ส่งสมัครเองหลายบริษัทและซ้อมสัมภาษณ์อย่างจริงจัง',
        effects: [
          { type: 'ChangeSkill', skill: 'business', delta: 1.5, reason: 'ฝึกเตรียมเรซูเม่และสัมภาษณ์งานจริง' },
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'สื่อสารนำเสนอความสามารถของตัวเอง' },
          { type: 'AddFlag', flag: 'uni_intern_ready', value: true, reason: 'ผ่านกระบวนการคัดเลือกฝึกงาน' },
        ],
      },
      {
        id: 'ask_senior_referral',
        label: 'ทักปรึกษารุ่นพี่ที่ทำงานในสายงานเพื่อขอคำแนะนำและรีเฟอร์',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 1.2, reason: 'ใช้คอนเนกชันรุ่นพี่ในสายอาชีพ' },
          { type: 'AddFlag', flag: 'uni_intern_ready', value: true, reason: 'ได้ที่ฝึกงานผ่านคำแนะนำรุ่นพี่' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_c_coop_semester',
    title: 'เทอมสหกิจศึกษา',
    bodyTemplate:
      'ภาคเรียนสหกิจศึกษาทำให้ {firstName} ต้องลงสนามปฏิบัติงานเต็มเวลาที่องค์กรจริงพร้อมทำโปรเจกต์ส่งอาจารย์นิเทศ',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'work_corporate',
    importance: 7,
    conditions: { minAge: 21, maxAge: 21, jobIds: ['student'] },
    cooldownYears: 2,
    choices: [
      {
        id: 'excel_at_coop',
        label: 'ทุ่มเททำงานเหมือนพนักงานจริงและเก็บผลงานไว้ใส่พอร์ต',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 1, reason: 'เชื่อมทฤษฎีสู่การปฏิบัติงานจริง' },
          { type: 'ChangeSkill', skill: 'business', delta: 1.5, reason: 'ทำงานร่วมกับทีมองค์กรจริง' },
          { type: 'ModifyTeacherGpa', delta: 0.1, reason: 'ได้คำประเมินจากพี่เลี้ยงและอาจารย์นิเทศดีมาก' },
        ],
      },
      {
        id: 'coast_coop',
        label: 'ทำตามหน้าที่ให้ผ่านเกณฑ์แบบไม่กดดันเกินไป',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'รักษาสมดุลช่วงสหกิจศึกษา' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_c_thesis',
    title: 'โปรเจกต์/วิทยานิพนธ์จบ',
    bodyTemplate:
      'ด่านสุดท้ายก่อนรับปริญญาคือโปรเจกต์จบหรือวิทยานิพนธ์ อาจารย์ที่ปรึกษานัดตรวจความคืบหน้าและคอมเมนต์จุดที่ต้องแก้ยกใหญ่',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'university',
    importance: 8,
    conditions: { minAge: 21, maxAge: 22, jobIds: ['student'] },
    cooldownYears: 2,
    choices: [
      {
        id: 'revise_thesis_thoroughly',
        label: 'ตั้งใจปรับแก้ตามข้อเสนอแนะอาจารย์จนผ่านฉลุย',
        effects: [
          { type: 'ChangeSkill', skill: 'academic', delta: 2, reason: 'ทำวิจัยและวิเคราะห์โปรเจกต์จบครบถ้วน' },
          { type: 'ModifyTeacherGpa', delta: 0.15, reason: 'ผลงานโปรเจกต์จบได้รับคำชม' },
          { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'ทุ่มเวลาแก้เล่มจนดึก' },
        ],
      },
      {
        id: 'ask_advisor_scope_down',
        label: 'ขอปรับขอบเขตหัวข้อให้กระชับและส่งทันรอบสอบ',
        effects: [
          { type: 'ChangeRawStat', stat: 'wit', delta: 1, reason: 'เจรจาบริหารขอบเขตงานวิจัยให้สำเร็จทันเวลา' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ลดแรงกดดันก่อนสอบจบ' },
        ],
      },
    ],
    weight: 15,
  },
  {
    id: 'ev_c_loan_info',
    title: 'เรื่องกู้ กยศ.',
    bodyTemplate:
      'ต้นเทอมระบบแจ้งเตือนให้ผู้กู้ กยศ. ยืนยันเบิกค่าครองชีพและค่าเล่าเรียนประจำภาคเรียนให้ตรงกำหนด {firstName} ต้องจัดการเอกสารให้เรียบร้อย',
    category: 'finance',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneId: 'university',
    importance: 5,
    conditions: { minAge: 18, maxAge: 22, requiredFlags: ['applied_student_loan'] },
    cooldownYears: 1,
    choices: [
      {
        id: 'submit_loan_docs_on_time',
        label: 'อัปโหลดเอกสารและบันทึกจิตอาสาให้ครบก่อนกำหนด',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 1, reason: 'จัดการเอกสารทุนกู้ยืมตรงเวลา' },
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ไม่ต้องกังวลเรื่องค่าเทอมค้างจ่าย' },
        ],
      },
    ],
    weight: 14,
  },
  {
    id: 'ev_c_exchange_chance',
    title: 'โอกาสโครงการแลกเปลี่ยน',
    bodyTemplate:
      'คณะประกาศรับสมัครนักศึกษาทุนแลกเปลี่ยนระยะสั้น 1 เทอมกับมหาวิทยาลัยคู่สัญญา เปิดโอกาสให้ผู้ที่มีเกรดเฉลี่ยถึงเกณฑ์ลองยื่นสมัคร',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'university',
    importance: 7,
    conditions: { minAge: 19, maxAge: 21, jobIds: ['student'], minStats: { wit: 35 } },
    cooldownYears: 2,
    choices: [
      {
        id: 'apply_exchange',
        label: 'ลองยื่นสมัครและเตรียมฝึกสื่อสารภาษาต่างประเทศเพิ่ม',
        requiredMinGpa: 2.75,
        conditionalUnlockReasonTh: 'ต้องมี GPA สะสม >= 2.75 จึงจะผ่านเกณฑ์คุณสมบัติแลกเปลี่ยน',
        effects: [
          { type: 'ChangeSkill', skill: 'foreign_lang', delta: 2, reason: 'เตรียมตัวสัมภาษณ์โครงการแลกเปลี่ยน' },
          { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'เปิดโลกประสบการณ์ระดับสากล' },
          { type: 'AddFlag', flag: 'uni_exchange_applied', value: true, reason: 'สมัครโครงการแลกเปลี่ยนมหาวิทยาลัย' },
        ],
      },
      {
        id: 'focus_local_study',
        label: 'โฟกัสเรียนและเก็บหน่วยกิตในประเทศให้จบตามแผนดีกว่า',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'เดินตามแผนเดิมอย่างมั่นคง' },
        ],
      },
    ],
    weight: 11,
  },
];
