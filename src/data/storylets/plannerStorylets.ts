import type { StoryletDef } from '../../engine/storylet';

/**
 * Phase 3.2.3: 24 Planner-Linked Storylets (Spec 06 §9.5 #1 - #24)
 * - Deterministic conditions bound to grid presets, streaks, sleep, and unlockable activities
 * - Strictly validated via validateStorylet (no AI, valid scenes, cash ceilings, isMinorSafe, zero emojis)
 */
export const PLANNER_STORYLETS: StoryletDef[] = [
  // #1 สังสรรค์ต่อเนื่อง 12 สัปดาห์ (ผู้ใหญ่)
  {
    id: 'planner_01_party_big_invite',
    title: 'กลุ่มเพื่อนชวนไปงานปาร์ตี้ใหญ่ประจำปี',
    bodyTemplate:
      'หลัง {firstName} ออกไปสังสรรค์ช่วงค่ำติดกันมาหลายเดือน เพื่อนซี้ก็ส่งการ์ดเชิญงานปาร์ตี้ใหญ่ที่ร้านดัง คาดว่าดึกและค่าใช้จ่ายสูงกว่าปกติ',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'nightlife_pub',
    daypart: 'night',
    importance: 6,
    isAdultContent: false,
    conditions: {
      minAge: 18,
      lifestylePresetIds: ['social_party'],
      minPresetWeeks: 12,
    },
    choices: [
      {
        id: 'go_all_out',
        label: 'ไปร่วมงานเต็มที่ (-1,200 บ.)',
        costCash: 1200,
        requiresAdult: true,
        effects: [
          { type: 'ChangeMoney', amount: -1200, category: 'living', reason: 'ค่าเครื่องดื่มและปาร์ตี้ใหญ่กับเพื่อน' },
          { type: 'ChangeResource', resource: 'energy', delta: -12, reason: 'อยู่ดึกจนเกือบเช้า' },
          { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'ทำความรู้จักผู้คนใหม่ๆ ในงาน' },
          { type: 'RecordEvidence', key: 'night_out', amount: 2.5, reason: 'เที่ยวงานปาร์ตี้ใหญ่ยามค่ำคืน' },
        ],
      },
      {
        id: 'go_sober',
        label: 'ไปแจมพอเป็นพิธีแต่ไม่ดื่ม (-450 บ.)',
        costCash: 450,
        requiresAdult: true,
        effects: [
          { type: 'ChangeMoney', amount: -450, category: 'living', reason: 'ค่าอาหารว่างและเครื่องดื่มไม่มีแอลกอฮอล์' },
          { type: 'ChangeResource', resource: 'energy', delta: -4, reason: 'กลับบ้านก่อนดึกมาก' },
          { type: 'ChangeSkill', skill: 'social', delta: 1, reason: 'พบปะพูดคุยอย่างมีสติ' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.6, reason: 'คุมตัวเองได้แม้ในวงปาร์ตี้' },
        ],
      },
      {
        id: 'skip_big_party',
        label: 'ปฏิเสธสุภาพ ขอพักผ่อนเก็บเงิน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ได้นอนพักอยู่บ้านสบายๆ' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'หักห้ามใจไม่เสียเงินก้อน' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #2 สังสรรค์ + นอนต่ำกว่าเกณฑ์
  {
    id: 'planner_02_party_late_sleep_deficit',
    title: 'นาฬิกาปลุกไม่ดังหลังคืนสังสรรค์',
    bodyTemplate:
      'เมื่อคืนเที่ยวเพลินจนดึกแถมพักผ่อนไม่พอมานาน วันนี้ {firstName} สะดุ้งตื่นสายกว่าเวลาปกติเกือบชั่วโมงจนเสี่ยงเข้างานหรือเรียนไม่ทัน',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'work_corporate',
    importance: 6,
    conditions: {
      minAge: 18,
      lifestylePresetIds: ['social_party'],
      minSleepDeficitWeeks: 1,
    },
    choices: [
      {
        id: 'rush_taxi',
        label: 'เรียกรถด่วนให้ทันเข้างาน (-350 บ.)',
        costCash: 350,
        effects: [
          { type: 'ChangeMoney', amount: -350, category: 'living', reason: 'ค่ารถด่วนตอนเช้าเพราะตื่นสาย' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'รีบเร่งจนหัวหมุนแต่เช้า' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.3, reason: 'แก้ปัญหาเฉพาะหน้ามาทันเวลา' },
        ],
      },
      {
        id: 'arrive_late_honest',
        label: 'ยอมเข้าสายแล้วขอโทษตามตรง',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: -1.5, reason: 'มาสายจากอาการนอนไม่พอ' },
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'ถูกเพ่งเล็งเรื่องตรงต่อเวลา' },
          { type: 'ChangeResource', resource: 'energy', delta: 3, reason: 'ไม่ต้องวิ่งจนหอบ' },
        ],
      },
    ],
    cooldownYears: 1,
    weight: 10,
  },

  // #3 สังสรรค์ต่อเนื่อง (ค่าใช้จ่ายเกินแผน)
  {
    id: 'planner_03_party_overspend',
    title: 'ยอดค่าสังสรรค์ช่วงหลังเริ่มบานปลาย',
    bodyTemplate:
      'พอเช็กยอดเงินในกระเป๋า {firstName} เพิ่งรู้ตัวว่าค่ามื้อดึกและนัดเจอเพื่อนต่อเนื่องหลายสัปดาห์เริ่มกินงบเก็บออมไปมากกว่าที่คิด',
    category: 'finance',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'street_food_night',
    importance: 5,
    conditions: {
      minAge: 18,
      lifestylePresetIds: ['social_party'],
      minPresetWeeks: 4,
    },
    choices: [
      {
        id: 'cap_night_budget',
        label: 'ตัดใจงดมื้อดึกสักพักเพื่อดึงงบกลับ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 3, reason: 'ต้องคอยยั้งใจเวลาเพื่อนสั่งเพิ่ม' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'เริ่มตั้งสติคุมรายจ่ายกลางคืน' },
        ],
      },
      {
        id: 'pay_and_keep_vibe',
        label: 'ยอมควักเพิ่มเพื่อไม่อยากเสียบรรยากาศ (-1,200 บ.)',
        costCash: 1200,
        effects: [
          { type: 'ChangeMoney', amount: -1200, category: 'living', reason: 'ยอดค้างจ่ายมื้อสังสรรค์กับกลุ่มเพื่อน' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 0.6, reason: 'ใจป้ำดูแลวงเพื่อน' },
        ],
      },
    ],
    cooldownYears: 1,
    weight: 10,
  },

  // #4 ติดบ้านต่อเนื่อง 8 สัปดาห์
  {
    id: 'planner_04_homebody_friends_miss',
    title: 'เพื่อนสนิทส่งข้อความถามว่าหายไปไหน',
    bodyTemplate:
      'เพื่อนในกลุ่มทักมาถามด้วยความเป็นห่วงว่าช่วงสองเดือนมานี้ไม่เห็น {firstName} ออกมาเจอหน้าเลย ยังสบายดีอยู่ไหม',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 4,
    conditions: {
      minAge: 13,
      lifestylePresetIds: ['homebody'],
      minPresetWeeks: 8,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'reply_warmly',
        label: 'ทักตอบยาวๆ นัดคุยออนไลน์สั้นๆ',
        effects: [
          { type: 'ChangeSkill', skill: 'social', delta: 0.5, reason: 'รักษาสายสัมพันธ์กับเพื่อนเก่า' },
          { type: 'ChangeResource', resource: 'energy', delta: -3, reason: 'สละเวลาส่วนตัวมาตอบแชต' },
        ],
      },
      {
        id: 'stay_quiet_room',
        label: 'ตอบสั้นๆ แล้วขอเก็บตัวอยู่เงียบๆ ต่อ',
        effects: [
          { type: 'RecordEvidence', key: 'solitude', amount: 1.5, reason: 'พอใจกับโลกส่วนตัวในห้อง' },
          { type: 'ChangeSkill', skill: 'social', delta: -0.6, reason: 'ห่างเหินจากวงสนทนาเพื่อนฝูง' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #5 ติดบ้านต่อเนื่อง 16 สัปดาห์
  {
    id: 'planner_05_homebody_invite_out',
    title: 'เพื่อนมาเคาะประตูชวนออกไปเปิดหูเปิดตา',
    bodyTemplate:
      'หลังอยู่ติดบ้านมานานสี่เดือน เพื่อนสนิทแวะมาหาถึงหน้าบ้านเพื่อชวน {firstName} ออกไปนั่งคาเฟ่สูดอากาศข้างนอกสักครั้ง',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 6,
    conditions: {
      minAge: 18,
      lifestylePresetIds: ['homebody'],
      minPresetWeeks: 16,
    },
    choices: [
      {
        id: 'step_out_cafe',
        label: 'ยอมเปลี่ยนเสื้อผ้าออกไปนั่งคุยข้างนอก (-300 บ.)',
        costCash: 300,
        effects: [
          { type: 'ChangeMoney', amount: -300, category: 'living', reason: 'ค่าเครื่องดื่มและขนมที่คาเฟ่กับเพื่อน' },
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'ได้เปลี่ยนบรรยากาศรับแสงแดด' },
          { type: 'ChangeResource', resource: 'energy', delta: -5, reason: 'เหนื่อยจากการเดินทางและคุยยาว' },
          { type: 'ChangeSkill', skill: 'social', delta: 1.4, reason: 'ฟื้นความคุ้นเคยในการพบปะผู้คน' },
        ],
      },
      {
        id: 'decline_stay_in',
        label: 'ปฏิเสธอย่างเกรงใจ ขอพักในพื้นที่ปลอดภัยต่อ',
        effects: [
          { type: 'RecordEvidence', key: 'solitude', amount: 2.5, reason: 'ยึดติดกับการอยู่คนเดียว' },
          { type: 'ChangeSkill', skill: 'social', delta: -1.2, reason: 'ปฏิเสธโอกาสพบปะเพื่อนสนิท' },
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ไม่ต้องฝืนตัวเองออกจากบ้าน' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #6 ซุ่มฝึกทักษะต่อเนื่อง 8 สัปดาห์
  {
    id: 'planner_06_skill_grind_noticed',
    title: 'คนรอบข้างเริ่มสังเกตความคล่องแคล่วที่เพิ่มขึ้น',
    bodyTemplate:
      'จากการที่ {firstName} ซุ่มฝึกฝนต่อเนื่องทุกสัปดาห์ งานที่เคยทำติดขัดเริ่มลื่นไหลจนคนใกล้ตัวเอ่ยปากชมอย่างแปลกใจ',
    category: 'work',
    tier: 'T1',
    sourceHint: 'general',
    sceneTag: 'cafe',
    importance: 5,
    conditions: {
      minAge: 13,
      lifestylePresetIds: ['skill_grind'],
      minPresetWeeks: 8,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'keep_honing_quietly',
        label: 'รับคำชมแล้วเก็บไปพัฒนาต่ออย่างเงียบๆ',
        effects: [
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.8, reason: 'สร้างผลงานให้เห็นชัดเจนจากความสม่ำเสมอ' },
          { type: 'RecordEvidence', key: 'practice_any', amount: 1.5, reason: 'มีกำลังใจฝึกทักษะต่อ' },
          { type: 'ChangeResource', resource: 'stress', delta: 2, reason: 'กดดันตัวเองให้เก่งขึ้นอีก' },
        ],
      },
      {
        id: 'share_tips_with_peers',
        label: 'แบ่งปันวิธีฝึกให้คนที่สนใจรอบตัว',
        effects: [
          { type: 'ChangeRawStat', stat: 'charisma', delta: 1, reason: 'มีน้ำใจถ่ายทอดความรู้ให้คนอื่น' },
          { type: 'ChangeResource', resource: 'energy', delta: -4, reason: 'สละเวลาอธิบายรายละเอียดให้คนอื่นฟัง' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #7 ซุ่มฝึก + นอนน้อย
  {
    id: 'planner_07_skill_grind_sleep_loss',
    title: 'สมองล้าจนเผลอทำพลาดกลางคันเพราะอดนอนฝึก',
    bodyTemplate:
      'ช่วงที่ผ่านมา {firstName} ทุ่มเวลาซุ่มฝึกหนักจนเบียดเวลานอน วันนี้เกิดอาการมึนเบลอจนทำขั้นตอนสำคัญผิดพลาดต่อหน้าคนอื่น',
    category: 'health',
    tier: 'T2',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 6,
    conditions: {
      minAge: 15,
      lifestylePresetIds: ['skill_grind'],
      minPresetWeeks: 3,
      minSleepDeficitWeeks: 1,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'pause_and_sleep',
        label: 'ยอมรับความพลาดแล้วรีบกลับไปนอนชดเชย',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 10, reason: 'ได้นอนเต็มอิ่มฟื้นสมอง' },
          { type: 'ChangeResource', resource: 'stress', delta: 3, reason: 'เสียดายที่ทำงานพลาดเล็กน้อย' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: -0.5, reason: 'งานสะดุดเพราะความล้า' },
        ],
      },
      {
        id: 'push_fix_tonight',
        label: 'ซื้อเครื่องดื่มบำรุงแก้ให้จบคืนนี้ (-200 บ.)',
        costCash: 200,
        effects: [
          { type: 'ChangeMoney', amount: -200, category: 'living', reason: 'ค่าเครื่องดื่มชูกำลังและกาแฟกลางดึก' },
          { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'ฝืนสังขารทำงานต่อ' },
          { type: 'ChangeResource', resource: 'stress', delta: 8, reason: 'เครียดจัดกลัวพลาดซ้ำ' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'กัดฟันรับผิดชอบงานจนเสร็จ' },
        ],
      },
    ],
    cooldownYears: 1,
    weight: 10,
  },

  // #8 ซุ่มฝึกทักษะที่เข้าขั้น 2
  {
    id: 'planner_08_skill_tier2_discount',
    title: 'เวิร์กช็อปเฉพาะทางเปิดรอบลดค่าลงทะเบียน',
    bodyTemplate:
      'สถาบันที่เปิดสอนทักษะสายเดียวกับที่ {firstName} กำลังต่อยอดในระดับกลาง มีโปรโมชันเวิร์กช็อปเข้มข้นสุดสัปดาห์ราคาพิเศษเฉพาะรอบนี้',
    category: 'finance',
    tier: 'T2',
    sourceHint: 'general',
    sceneTag: 'cafe',
    importance: 6,
    conditions: {
      minAge: 15,
      lifestylePresetIds: ['skill_grind'],
      minPresetWeeks: 4,
      requireTier2FocusedSkill: true,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'join_discount_workshop',
        label: 'ยอมจ่ายเข้าเวิร์กช็อปรอบพิเศษ (-1,200 บ.)',
        costCash: 1200,
        effects: [
          { type: 'ChangeMoney', amount: -1200, category: 'living', reason: 'ค่าเข้าเวิร์กช็อปเสริมทักษะขั้นกลาง' },
          { type: 'ChangeRawStat', stat: 'wit', delta: 1.2, reason: 'ได้มุมมองแก้ปัญหาจากผู้สอนจริง' },
          { type: 'RecordEvidence', key: 'practice_any', amount: 3, reason: 'ทุ่มทุนอัปเกรดทักษะอย่างจริงจัง' },
          { type: 'ChangeResource', resource: 'energy', delta: -6, reason: 'เรียนเข้มข้นตลอดวันหยุด' },
        ],
      },
      {
        id: 'wait_self_practice',
        label: 'ยังไม่จ่าย รอฝึกทบทวนจากคอร์สเดิมไปก่อน',
        effects: [
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'ประหยัดงบไม่เพิ่มรายจ่ายก้อน' },
          { type: 'ChangeResource', resource: 'stress', delta: 2, reason: 'แอบเสียดายโอกาสที่ได้ยินมา' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #9 ออกกำลังกายต่อเนื่อง 8 สัปดาห์ (ปลดล็อกกิจกรรมลงแข่ง)
  {
    id: 'planner_09_workout_competition_invite',
    title: 'เพื่อนร่วมซ้อมชวนลงแข่งรายการท้องถิ่น',
    bodyTemplate:
      'เห็น {firstName} มาวิ่งและออกกำลังกายสม่ำเสมอครบสองเดือน เพื่อนที่เจอกันประจำจึงชวนลงสมัครแข่งรายการสมัครเล่นสุดสัปดาห์หน้า',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'street_shops',
    importance: 7,
    conditions: {
      minAge: 15,
      minWorkoutWeeks: 8,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'accept_competition',
        label: 'ตอบรับลงแข่งและเตรียมตัว (-500 บ.)',
        costCash: 500,
        effects: [
          { type: 'ChangeMoney', amount: -500, category: 'living', reason: 'ค่าสมัครและอุปกรณ์เตรียมลงแข่ง' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'ซ้อมหนักเตรียมลงสนามจริง' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: 1.5, reason: 'ยกระดับความฟิตเพื่อการแข่งขัน' },
          { type: 'RecordEvidence', key: 'fitness_training', amount: 2.5, reason: 'มุ่งมั่นเข้าสู่สนามแข่งขันจริง' },
          { type: 'AddFlag', flag: 'competition_unlocked', value: true, reason: 'ปลดล็อกกิจกรรมลงแข่ง / กิจกรรมระดับสูงในตารางชีวิต' },
        ],
      },
      {
        id: 'cheer_from_sideline',
        label: 'ขอไปช่วยเชียร์และเก็บแรงไว้ก่อน (-150 บ.)',
        costCash: 150,
        effects: [
          { type: 'ChangeMoney', amount: -150, category: 'living', reason: 'ค่าน้ำและขนมติดมือไปเชียร์เพื่อน' },
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ไม่กดดันตัวเองเกินความพร้อม' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 1.2, reason: 'รักษามิตรภาพกับกลุ่มคนรักสุขภาพ' },
        ],
      },
    ],
    isOneOff: true,
    weight: 12,
  },

  // #10 ออกกำลังกายหนักต่อเนื่อง
  {
    id: 'planner_10_workout_minor_injury',
    title: 'กล้ามเนื้อตึงและเจ็บข้อเล็กน้อยจากการซ้อมหนัก',
    bodyTemplate:
      'หลังออกกำลังกายต่อเนื่องมานานสามเดือน วันนี้ {firstName} รู้สึกแปลบที่ข้อเท้าและน่องระหว่างวอร์มร่างกาย',
    category: 'health',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'hospital',
    importance: 6,
    conditions: {
      minAge: 15,
      minWorkoutWeeks: 12,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'rest_and_physio',
        label: 'หยุดพักและแวะให้หมอตรวจประคบยา (-600 บ.)',
        costCash: 600,
        effects: [
          { type: 'ChangeMoney', amount: -600, category: 'living', reason: 'ค่ายาประคบและตรวจเช็กอาการบาดเจ็บ' },
          { type: 'ChangeResource', resource: 'energy', delta: 8, reason: 'ยอมหยุดพักให้เส้นเอ็นฟื้นตัว' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'อุ่นใจว่าไม่บาดเจ็บเรื้อรัง' },
        ],
      },
      {
        id: 'push_through_pain',
        label: 'พันผ้าแล้วฝืนซ้อมเบาๆ ตามตารางเดิม',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'กังวลกับอาการเจ็บที่ยังไม่หาย' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'ร่างกายต้องแบกรับอาการล้าสะสม' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: 0.8, reason: 'อดทนประคองวินัยการซ้อม' },
        ],
      },
    ],
    cooldownYears: 1,
    weight: 10,
  },

  // #11 โหมงานต่อเนื่อง 8 สัปดาห์ (ผู้ใหญ่)
  {
    id: 'planner_11_overwork_boss_offer',
    title: 'หัวหน้าเห็นความขยัน จึงยื่นงานพิเศษให้รับผิดชอบ',
    bodyTemplate:
      'จากผลงานที่ {firstName} อยู่ทำโอทีต่อเนื่องถึงแปดสัปดาห์ หัวหน้าเลยถามว่าสนใจรับดูแลโปรเจกต์เร่งด่วนเพิ่มอีกชิ้นไหม มีค่าตอบแทนพิเศษให้',
    category: 'work',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'work_corporate',
    importance: 7,
    conditions: {
      minAge: 18,
      requireEmployed: true,
      minOvertimeWeeks: 8,
    },
    choices: [
      {
        id: 'take_extra_project',
        label: 'ตอบรับงานพิเศษเพิ่มเพื่อสร้างผลงานและเงิน',
        effects: [
          { type: 'ChangeMoney', amount: 3500, category: 'side', reason: 'ค่าตอบแทนพิเศษจากโปรเจกต์เร่งด่วน' },
          { type: 'ChangeResource', resource: 'energy', delta: -12, reason: 'โหมทำงานหนักเกินกำลัง' },
          { type: 'ChangeResource', resource: 'stress', delta: 10, reason: 'แบกรับความรับผิดชอบและเดดไลน์เพิ่ม' },
          { type: 'RecordEvidence', key: 'hardWorking', amount: 2.5, reason: 'พิสูจน์ความทุ่มเทในสายงาน' },
        ],
      },
      {
        id: 'decline_protect_health',
        label: 'ปฏิเสธอย่างนุ่มนวลเพื่อรักษามาตรฐานงานหลัก',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ไม่แบกภาระจนล้นมือ' },
          { type: 'ChangeResource', resource: 'energy', delta: 4, reason: 'เหลือเวลาพักฟื้นหลังเลิกงาน' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.5, reason: 'รู้ขีดจำกัดและรักษาคุณภาพงานเดิม' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #12 โหมงานต่อเนื่อง + ความเครียดสูง
  {
    id: 'planner_12_overwork_burnout_warning',
    title: 'ร่างกายส่งสัญญาณเตือนก่อนหมดไฟ',
    bodyTemplate:
      'หลังลากโอทีติดกันมาหลายสัปดาห์จนความเครียดพุ่งสูง ช่วงบ่ายวันนี้ {firstName} รู้สึกปวดหัวตุบๆ และใจสั่นจนแทบจ้องหน้าจอต่อไม่ไหว',
    category: 'health',
    tier: 'T1',
    sourceHint: 'stat_threshold',
    sceneId: 'work_corporate',
    importance: 6,
    conditions: {
      minAge: 18,
      requireEmployed: true,
      minOvertimeWeeks: 6,
      minStress: 72,
    },
    choices: [
      {
        id: 'take_half_day_off',
        label: 'ขอลางานครึ่งบ่ายกลับไปงีบตั้งหลัก',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -9, reason: 'หยุดพักก่อนร่างกายทรุดหนัก' },
          { type: 'ChangeResource', resource: 'energy', delta: 7, reason: 'ได้หลับตาฟื้นพลัง' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: -0.4, reason: 'ต้องลางานกะทันหันครึ่งวัน' },
        ],
      },
      {
        id: 'drink_strong_coffee',
        label: 'ซื้อกาแฟเข้มประคองตัวเองให้จบวัน (-120 บ.)',
        costCash: 120,
        effects: [
          { type: 'ChangeMoney', amount: -120, category: 'living', reason: 'ค่ากาแฟแก้ง่วงยามบ่าย' },
          { type: 'ChangeResource', resource: 'stress', delta: 6, reason: 'ฝืนร่างกายทั้งที่ยังล้า' },
          { type: 'ChangeResource', resource: 'energy', delta: -4, reason: 'ดึงพลังสำรองมาใช้ต่อ' },
        ],
      },
    ],
    cooldownYears: 1,
    weight: 10,
  },

  // #13 ทุ่มครอบครัวต่อเนื่อง (ญาติฝากภาระดูแล)
  {
    id: 'planner_13_family_care_burden',
    title: 'ญาติผู้ใหญ่ขอฝากให้ช่วยดูแลธุระและค่าใช้จ่ายในบ้าน',
    bodyTemplate:
      'เพราะเห็นว่า {firstName} จัดเวลาให้ครอบครัวอย่างสม่ำเสมอ ญาติจึงขอแรงช่วยรับภาระดูแลเรื่องซ่อมบ้านและธุระผู้ใหญ่ในเดือนนี้',
    category: 'family',
    tier: 'T2',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 6,
    conditions: {
      minAge: 18,
      lifestylePresetIds: ['family_first'],
      minPresetWeeks: 8,
    },
    choices: [
      {
        id: 'shoulder_family_task',
        label: 'รับอาสาดูแลและช่วยออกค่าใช้จ่าย (-1,500 บ.)',
        costCash: 1500,
        effects: [
          { type: 'ChangeMoney', amount: -1500, category: 'living', reason: 'ช่วยค่าซ่อมบำรุงและธุระภายในบ้าน' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'เหนื่อยจากการวิ่งจัดการธุระหลายจุด' },
          { type: 'RecordEvidence', key: 'family_time', amount: 3, reason: 'เป็นที่พึ่งหลักให้ครอบครัว' },
          { type: 'RecordEvidence', key: 'help_others', amount: 2, reason: 'เสียสละเวลาและเงินช่วยคนในบ้าน' },
        ],
      },
      {
        id: 'explain_limits_gently',
        label: 'อธิบายข้อจำกัดเวลาและกำลังทรัพย์อย่างตรงไปตรงมา',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'กังวลว่าผู้ใหญ่จะแอบน้อยใจ' },
          { type: 'RecordEvidence', key: 'family_time', amount: -0.5, reason: 'ปฏิเสธคำขอช่วยธุระใหญ่ของญาติ' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.5, reason: 'กล้าตั้งขอบเขตที่รับผิดชอบไหวจริง' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #14 ทุ่มครอบครัวต่อเนื่อง (ผู้ใหญ่ชื่นชม)
  {
    id: 'planner_14_family_praise',
    title: 'คนในบ้านเอ่ยปากชมความใส่ใจในช่วงนี้',
    bodyTemplate:
      'บรรยากาศในบ้านช่วงหลังอบอุ่นขึ้นชัดเจน ผู้ใหญ่ในครอบครัวพูดขึ้นระหว่างมื้อเย็นว่าดีใจที่ {firstName} แบ่งเวลามาอยู่ด้วยกันสม่ำเสมอ',
    category: 'family',
    tier: 'T1',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 4,
    conditions: {
      minAge: 13,
      lifestylePresetIds: ['family_first'],
      minPresetWeeks: 4,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'buy_family_dessert',
        label: 'ช่วยจัดโต๊ะน้ำชาและขนมในครัวมาทานพร้อมหน้ากับที่บ้าน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'อบอุ่นใจกับรอยยิ้มของครอบครัว' },
          { type: 'RecordEvidence', key: 'family_time', amount: 2, reason: 'เติมความสัมพันธ์ดีๆ ในบ้าน' },
        ],
      },
      {
        id: 'help_clean_after_dinner',
        label: 'ช่วยเก็บล้างจานและนั่งคุยต่อจนดึก',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -4, reason: 'ช่วยทำงานบ้านหลังมื้อเย็น' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1.5, reason: 'ร่วมแบ่งเบาภาระในครัวเรือน' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #15 งานอดิเรกเล่นเกมสะสม + นิสัยติดเกม/เฉพาะทาง (ปลดล็อกสตรีม)
  {
    id: 'planner_15_gaming_stream_invite',
    title: 'เพื่อนร่วมวงเกมชวนเปิดช่องสตรีมครั้งแรก',
    bodyTemplate:
      'หลังขลุกอยู่กับงานอดิเรกจนรู้ลึกและคุยสนุก เพื่อนที่เล่นด้วยกันก็ยุให้ {firstName} ลองจัดไลฟ์สตรีมหรือทำช่องแชร์สไตล์การเล่นดูสักตั้ง',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 7,
    conditions: {
      minAge: 15,
      requiredEvidence: { hobby_focus: 6 },
      requiredAnyTraits: ['niche_obsessed', 'curious_learner', 'solitude_lover'],
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'start_streaming_channel',
        label: 'ซื้อไมค์ตั้งต้นและเปิดช่องสตรีมเลย (-400 บ.)',
        costCash: 400,
        effects: [
          { type: 'ChangeMoney', amount: -400, category: 'living', reason: 'ซื้ออุปกรณ์ตั้งต้นลองสตรีมครั้งแรก' },
          { type: 'ChangeResource', resource: 'energy', delta: -6, reason: 'วุ่นวายกับการเซ็ตระบบไลฟ์ครั้งแรก' },
          { type: 'ChangeRawStat', stat: 'creativity', delta: 1.5, reason: 'คิดไอเดียจัดรายการของตัวเอง' },
          { type: 'RecordEvidence', key: 'hobby_focus', amount: 2, reason: 'ต่อยอดงานอดิเรกสู่การทำช่อง' },
          { type: 'AddFlag', flag: 'stream_unlocked', value: true, reason: 'ปลดล็อกกิจกรรม สตรีม / ทำช่องคอนเทนต์ ในตารางชีวิต' },
        ],
      },
      {
        id: 'keep_gaming_private',
        label: 'ขอเล่นสนุกเป็นพื้นที่พักใจส่วนตัวดีกว่า',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ไม่ต้องแบกความกดดันเรื่องคนดู' },
          { type: 'RecordEvidence', key: 'solitude', amount: 1.5, reason: 'รักษาความสนุกแบบเงียบๆ' },
        ],
      },
    ],
    isOneOff: true,
    weight: 12,
  },

  // #16 สตรีมปลดล็อกแล้ว 6 สัปดาห์
  {
    id: 'planner_16_stream_low_viewers',
    title: 'ไลฟ์มาหกสัปดาห์แต่ยอดคนดูยังขึ้นๆ ลงๆ',
    bodyTemplate:
      'หลังเปิดช่องมาได้ระยะหนึ่ง วันนี้ช่วงไลฟ์มีคนดูเพียงไม่กี่คนจน {firstName} เริ่มตั้งคำถามว่าควรปรับแนวทางหรือพักก่อนดี',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 5,
    conditions: {
      minAge: 13,
      requiredFlags: ['stream_unlocked'],
      minStreamUnlockedWeeks: 6,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'experiment_new_format',
        label: 'ไม่ยอมแพ้ ลองคิดช่วงคอนเทนต์ใหม่สู้ต่อ',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -5, reason: 'ตัดต่อและวางแผนคอนเทนต์เพิ่ม' },
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'ลุ้นยอดผู้ชมหลังปรับแนวทาง' },
          { type: 'ChangeRawStat', stat: 'creativity', delta: 1.5, reason: 'ฝึกทดลองเล่าเรื่องรูปแบบใหม่' },
          { type: 'RecordEvidence', key: 'hobby_focus', amount: 2, reason: 'ยืนระยะทำช่องต่อแม้ช่วงเงียบเหงา' },
        ],
      },
      {
        id: 'take_stream_break',
        label: 'พักตารางไลฟ์สักระยะเพื่อลดความคาดหวัง',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -5, reason: 'วางตัวเลขยอดวิวลงชั่วคราว' },
          { type: 'ChangeResource', resource: 'energy', delta: 5, reason: 'ได้เวลานอนช่วงหัวค่ำคืนมา' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #17 พักฟื้นต่อเนื่อง (T0 บันทึกเงียบ)
  {
    id: 'planner_17_rest_recover_quiet',
    title: 'ร่างกายเริ่มกลับมาสดชื่นหลังพักฟื้นต่อเนื่อง',
    bodyTemplate:
      'จากการให้เวลาตัวเองได้พักผ่อนเต็มที่หลายสัปดาห์ติดกัน {firstName} รู้สึกว่าอาการล้าสะสมลดลงและตื่นเช้าได้คล่องตัวขึ้น',
    category: 'health',
    tier: 'T0',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 2,
    conditions: {
      minAge: 6,
      lifestylePresetIds: ['rest_recover'],
      minPresetWeeks: 4,
      isMinorSafe: true,
    },
    cooldownYears: 1,
    weight: 8,
  },

  // #18 ชมรมมหาวิทยาลัย 8 สัปดาห์
  {
    id: 'planner_18_uni_club_committee',
    title: 'รุ่นพี่ในชมรมชวนลงชื่อเป็นกรรมการจัดกิจกรรม',
    bodyTemplate:
      'หลังเข้ากิจกรรมชมรมมหาวิทยาลัยมาครบสองเดือน รุ่นพี่เห็นความตั้งใจจึงชวน {firstName} ขยับมาช่วยเป็นกรรมการเตรียมงานค่ายเทอมหน้า',
    category: 'social',
    tier: 'T2',
    sourceHint: 'general',
    sceneId: 'university',
    importance: 6,
    conditions: {
      minAge: 18,
      jobIds: ['student'],
      minClubWeeks: 8,
    },
    choices: [
      {
        id: 'join_club_committee',
        label: 'ตอบรับเป็นกรรมการชมรมเต็มตัว',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'ประชุมและประสานงานค่ายจนเย็น' },
          { type: 'ChangeResource', resource: 'stress', delta: 5, reason: 'ต้องรับผิดชอบงานส่วนรวมของชมรม' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 1.5, reason: 'ฝึกบทบาทผู้นำต่อหน้าสมาชิก' },
          { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'ประสานงานกับเพื่อนต่างคณะ' },
          { type: 'RecordEvidence', key: 'social_fun', amount: 2, reason: 'ขยับบทบาทสำคัญในกิจกรรมมหาวิทยาลัย' },
        ],
      },
      {
        id: 'stay_regular_member',
        label: 'ขอช่วยเป็นสมาชิกเบื้องหลังตามเวลาที่สะดวก',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ไม่แบกงานบริหารเกินเวลาเรียน' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.5, reason: 'แบ่งสมดุลเวลาเรียนกับกิจกรรมได้ดี' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #19 ตั้งใจเรียน (เด็ก/วัยรุ่น ปลอดภัย)
  {
    id: 'planner_19_teen_study_praise',
    title: 'คุณครูเอ่ยปากชมการบ้านและเพื่อนแซวเบาๆ หน้าห้อง',
    bodyTemplate:
      'หลังตั้งใจเรียนและทบทวนบทเรียนสม่ำเสมอ คุณครูชมสมุดบันทึกของ {firstName} หน้าชั้นเรียน จนเพื่อนข้างโต๊ะหันมาแซวเบาๆ แบบเป็นกันเอง',
    category: 'social',
    tier: 'T1',
    sourceHint: 'general',
    sceneId: 'school_public',
    importance: 4,
    conditions: {
      minAge: 6,
      maxAge: 17,
      jobIds: ['student'],
      minStudyTeenWeeks: 4,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'share_study_notes',
        label: 'ยิ้มรับแล้วแบ่งสรุปบทเรียนให้เพื่อนยืมดู',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: -3, reason: 'ช่วยอธิบายข้อสอบให้เพื่อนฟังช่วงพัก' },
          { type: 'ChangeRawStat', stat: 'charisma', delta: 1, reason: 'เข้ากับเพื่อนในห้องได้ดีขึ้น' },
          { type: 'ModifyTeacherGpa', delta: 0.1, reason: 'คุณครูเอ่ยปากชมความขยันหน้าชั้นเรียน' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1.5, reason: 'รักษาความขยันและน้ำใจในห้องเรียน' },
        ],
      },
      {
        id: 'smile_back_review',
        label: 'ยิ้มรับเขินๆ แล้วก้มหน้าอ่านต่อ',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 2, reason: 'แอบเกร็งเล็กน้อยเวลาถูกชมหน้าห้อง' },
          { type: 'ChangeRawStat', stat: 'memory', delta: 0.8, reason: 'ทบทวนเนื้อหาจำได้แม่นยำขึ้น' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #20 เล่นกับเพื่อนมากและนอนน้อย (เด็ก ปลอดภัย)
  {
    id: 'planner_20_kid_play_curfew',
    title: 'ผู้ปกครองเรียกคุยเรื่องเวลาเข้าบ้านและเข้านอน',
    bodyTemplate:
      'ช่วงนี้ {firstName} ติดเล่นกับเพื่อนจนกลับค่ำและนอนน้อยลง ผู้ปกครองเลยเรียกมานั่งคุยจริงจังให้รีบกลับบ้านตรงเวลา',
    category: 'family',
    tier: 'T1',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 4,
    conditions: {
      minAge: 6,
      maxAge: 14,
      minSocialKidsPlayWeeks: 2,
      minSleepDeficitWeeks: 1,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'promise_early_curfew',
        label: 'รับปากจะรีบกลับบ้านก่อนฟ้ามืดและนอนไวขึ้น',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 6, reason: 'ได้เข้านอนตรงเวลาตามผู้ใหญ่เตือน' },
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'บรรยากาศในบ้านผ่อนคลายลง' },
          { type: 'RecordEvidence', key: 'family_time', amount: 1.5, reason: 'เคารพกติกาเวลาในบ้าน' },
        ],
      },
      {
        id: 'negotiate_weekend_play',
        label: 'ขอต่อรองให้วันหยุดยังออกไปเล่นกับเพื่อนได้นานขึ้น',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 3, reason: 'ถูกผู้ปกครองซักถามเงื่อนไขเพิ่ม' },
          { type: 'RecordEvidence', key: 'peer_follow', amount: 1.2, reason: 'ยังอยากมีเวลาสนุกกับเพื่อน' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #21 นอนต่ำกว่าเกณฑ์ติดกัน 4 สัปดาห์
  {
    id: 'planner_21_sleep_deficit_warning',
    title: 'ร่างกายเตือนหนักหลังนอนไม่พอครบเดือน',
    bodyTemplate:
      'ตาโหล อ่อนเพลีย และสมาธิหลุดง่ายขึ้นทุกวัน หลังจาก {firstName} จัดเวลานอนต่ำกว่าเกณฑ์มาติดกันครบสี่สัปดาห์เต็ม',
    category: 'health',
    tier: 'T2',
    sourceHint: 'stat_threshold',
    sceneTag: 'home',
    importance: 7,
    conditions: {
      minAge: 13,
      minSleepDeficitWeeks: 4,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'adjust_bedtime_routine',
        label: 'จัดห้องนอนให้เงียบ ดื่มน้ำอุ่น และเข้านอนไวขึ้น',
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 12, reason: 'เริ่มฟื้นชั่วโมงการนอนให้กลับมาปกติ' },
          { type: 'ChangeResource', resource: 'stress', delta: -6, reason: 'ลดอาการมึนล้าสะสม' },
          { type: 'RecordEvidence', key: 'rest_recovery', amount: 2.5, reason: 'หันกลับมาดูแลการนอนอย่างจริงจัง' },
        ],
      },
      {
        id: 'ignore_sleep_keep_pace',
        label: 'ทนฝืนใช้ตารางเดิมต่อไปก่อน',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 8, reason: 'ระบบประสาทล้าจากการอดนอนสะสม' },
          { type: 'ChangeResource', resource: 'energy', delta: -6, reason: 'พักผ่อนไม่ถึงจุดฟื้นตัว' },
          { type: 'ChangeRawStat', stat: 'endurance', delta: -0.5, reason: 'สุขภาพพื้นฐานถดถอยจากการอดนอน' },
        ],
      },
    ],
    cooldownYears: 1,
    weight: 10,
  },

  // #22 นอนเต็มอิ่มต่อเนื่อง 4 สัปดาห์ (T0 บันทึกเงียบ)
  {
    id: 'planner_22_sleep_full_fresh',
    title: 'ตื่นเช้าพร้อมสมองปลอดโปร่งครบหนึ่งเดือน',
    bodyTemplate:
      'การเข้านอนเต็มอิ่มสม่ำเสมอตลอดสี่สัปดาห์ช่วยให้ {firstName} ตื่นเช้ามาด้วยความกระปรี้กระเปร่าและอารมณ์มั่นคงขึ้น',
    category: 'health',
    tier: 'T0',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 2,
    conditions: {
      minAge: 6,
      minSleepFullWeeks: 4,
      isMinorSafe: true,
    },
    cooldownYears: 1,
    weight: 8,
  },

  // #23 พรีเซ็ตขัดกับนิสัย (เช่น ขี้เกียจ + ซุ่มฝึก/โหมงาน) ต่อเนื่อง 6 สัปดาห์
  {
    id: 'planner_23_preset_trait_conflict',
    title: 'เริ่มท้อใจเพราะตารางชีวิตฝืนธรรมชาติของตัวเอง',
    bodyTemplate:
      'แม้ {firstName} จะพยายามจัดตารางเร่งพัฒนาหรือโหมงานติดต่อกันมาหกสัปดาห์ แต่นิสัยลึกๆ ข้างในก็กำลังต่อต้านจนเริ่มเหนื่อยใจอย่างบอกไม่ถูก',
    category: 'health',
    tier: 'T2',
    sourceHint: 'general',
    sceneTag: 'home',
    importance: 7,
    conditions: {
      minAge: 13,
      lifestylePresetMismatch: true,
      minMismatchWeeks: 6,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'ease_schedule_match_self',
        label: 'ยอมผ่อนจังหวะลงให้สมดุลกับนิสัยตัวเอง',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'หยุดกดดันตัวเองให้ฝืนธรรมชาติ' },
          { type: 'ChangeResource', resource: 'energy', delta: 6, reason: 'ใจเบาลงและมีแรงเหลือ' },
        ],
      },
      {
        id: 'grit_through_conflict',
        label: 'กัดฟันฝืนตารางเดิมต่อเพื่อดัดนิสัยตัวเอง',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 9, reason: 'ความขัดแย้งในใจพุ่งสูงจากการฝืนตัวเอง' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 2.5, reason: 'ฝืนชนะความเคยชินเดิมอย่างหนัก' },
          { type: 'RecordEvidence', key: 'overwork', amount: 1.5, reason: 'กดดันตัวเองต่อเนื่องเกินจังหวะปกติ' },
        ],
      },
    ],
    cooldownYears: 2,
    weight: 10,
  },

  // #24 วันเกิด (ผ่านการตั้งเป้าหมายครบปี — สรุประบบ)
  {
    id: 'planner_24_annual_focus_summary',
    title: 'สรุปผลเป้าหมายประจำปีในวันเกิด',
    bodyTemplate:
      'ครบรอบวันเกิดอีกปีแล้ว ระบบได้รวบรวมความเปลี่ยนแปลงจากเป้าหมายประจำปีที่ผ่านมาของ {firstName} ทั้งเรื่องเงิน ทักษะ สุขภาพ และความเครียดไว้ในบันทึกประจำปีเรียบร้อย',
    category: 'system',
    tier: 'T1',
    sourceHint: 'calendar',
    sceneTag: 'home',
    importance: 5,
    conditions: {
      minAge: 13,
      onBirthday: true,
      requireAnnualFocusSet: true,
      isMinorSafe: true,
    },
    choices: [
      {
        id: 'acknowledge_annual_report',
        label: 'รับทราบผลสรุปประจำปี',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: -2, reason: 'ได้ทบทวนเส้นทางชีวิตตลอดปีที่ผ่านมา' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 0.5, reason: 'ทบทวนเป้าหมายประจำปี' },
        ],
      },
    ],
    cooldownYears: 1,
    weight: 10,
  },
];
