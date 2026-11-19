/**
 * Centralized UI Text & Human-Friendly Terminology (Phase 3.1)
 * Single Source of Truth for all player-facing Thai labels.
 * Replaces technical / dev jargon with everyday human language.
 * Enforces ZERO emojis in accordance with game art guidelines.
 */

export const UI_TEXT = {
  // === 1. Event Cards & Decision Modal ===
  DECISION_HEADER: 'ตัดสินใจ',
  TURNING_POINT_HEADER: 'จุดเปลี่ยน',
  AUTOPILOT_SITUATION_SUBTITLE: 'เรื่องนี้ตั้งค่าให้หยุดถามคุณก่อน หรือยังไม่มีคำสั่งล่วงหน้า',
  T3_SPEED_NOTICE: 'จุดเปลี่ยนสำคัญของชีวิต (ปรับความเร็วเป็น x1) — กรุณาเลือกทางเดินชีวิตด้วยตัวเอง',
  TWIST_TAG: 'จุดหักมุม',
  DAYS_LEFT_HINT: (days: number) => `เลือกได้ภายใน ${days} วัน (หากเลยเวลาตัวละครจะตัดสินใจตามนิสัยให้)`,
  MINOR_CHOICE_SHIELD: 'ตัวละครยังเป็นเยาวชน ระบบซ่อนทางเลือกผู้ใหญ่ให้อัตโนมัติ',
  AUTOPILOT_SKIP_BTN: 'ข้ามและปล่อยให้เลือกตามนิสัย',
  AUTOPILOT_SKIP_REASON: 'ปล่อยให้ตัวละครตัดสินใจเองตามนิสัยและแนวทางที่วางไว้',
  LIFE_END_TITLE: 'จบตำนานหนึ่งชีวิต',
  LIFE_END_DEVELOPMENT: 'ภาพพัฒนาการตามช่วงวัย',
  LIFE_END_PLAY_AGAIN: 'เริ่มชีวิตใหม่',
  LIFE_END_LOAD_SAVE: 'โหลดเซฟเดิม',

  // === 2. Categories (Tags / Chips) ===
  CATEGORIES: {
    work: 'งานและเรียน',
    romance: 'ความรัก',
    family: 'ครอบครัว',
    health: 'สุขภาพ',
    finance: 'การเงิน',
    social: 'สังคม',
    quirky: 'เรื่องแปลก',
    milestone: 'จุดเปลี่ยนชีวิต',
    dilemma: 'ตัดสินใจ',
    economy: 'การเงิน',
    twist: 'หักมุม',
    life: 'ชีวิต',
    echo: 'ผลสะท้อน',
    trait: 'นิสัย',
    autopilot: 'ตัวละครตัดสินใจเอง',
    system: 'สรุปจากระบบ',
  } as Record<string, string>,

  // === 3. Dayparts & DayPlan Activities ===
  DAYPARTS: {
    morning: 'เช้า',
    afternoon: 'บ่าย',
    evening: 'เย็น',
    night: 'ดึก',
  } as const,

  ACTIVITY_LABELS: {
    sleep: 'พักผ่อนเข้านอน',
    work: 'ทำงาน',
    study: 'เข้าเรียน',
    side_gig: 'ทำงานเสริม',
    social: 'เจอเพื่อนเข้าสังคม',
    hobby: 'ทำกิจกรรมยามว่าง',
    family: 'อยู่กับครอบครัว',
    self_dev: 'ฝึกทักษะพัฒนาตัวเอง',
    nightlife: 'ออกไปผ่อนคลายกลางคืน',
    errand: 'ทำธุระนอกบ้าน',
    rest: 'พักผ่อนอยู่บ้าน',
  } as const,

  // === 4. Explain Panel ===
  EXPLAIN_BUTTON: 'ทำไม?',
  EXPLAIN_EVENT_HEADER: 'ทำไมถึงเกิดเรื่องนี้?',
  EXPLAIN_SCENE_HEADER: 'ทำไมถึงมาอยู่ที่นี่?',
  EXPLAIN_STAT_HEADER: 'ทำไมถึงเป็นแบบนี้?',
  EXPLAIN_DETAILS_EVENT: 'ดูรายละเอียดและที่มาของเรื่องนี้',
  EXPLAIN_DETAILS_SCENE: 'ดูรายละเอียดตารางประจำวันและเงื่อนไขสถานที่',
  EXPLAIN_DETAILS_STAT: 'ดูปัจจัยประกอบและประวัติล่าสุด',
  EXPLAIN_CLOSE: 'ปิดหน้าต่างอธิบาย',
  EXPLAIN_BACKSTORY: 'เรื่องราวเบื้องหลัง:',
  EXPLAIN_CURRENT_LEVEL: 'ระดับตอนนี้:',
  EXPLAIN_RECENT_CHANGES: 'การเปลี่ยนแปลงล่าสุด',

  // === 5. Period Digest ===
  DIGEST_HEADER: 'สรุปช่วงที่ผ่านมา',
  DIGEST_CLICK_ANYWHERE: 'กดตรงไหนก็ได้เพื่อปิดและเดินเวลาต่อ',
  DIGEST_CLOSE_BUTTON: 'เข้าใจแล้ว ปิดหน้าต่าง',
  DIGEST_AUTOPILOT_COUNT: (count: number) => `ตัวละครตัดสินใจเอง ${count} เรื่อง`,
  DIGEST_TRAIT_TITLE: 'นิสัยและตัวตนที่มีการเปลี่ยนแปลง',
  DIGEST_TURNING_POINTS_TITLE: 'จุดเปลี่ยนและเหตุการณ์สำคัญ',
  DIGEST_NET_CASH_TITLE: 'การเปลี่ยนแปลงเงินสดสุทธิ',

  // === 6. Navigation & Tabs ===
  TABS: {
    home: 'หน้าหลัก',
    life: 'ชีวิต',
    people: 'คน',
    finance: 'เงิน',
    journal: 'บันทึก',
  } as const,

  SUBTABS: {
    schedule: 'ตารางเวลา',
    standingOrders: 'คำสั่งประจำ',
    skills: 'ทักษะ',
    appearance: 'รูปลักษณ์',
    workStudy: 'งานและเรียน',
    me: 'ตัวฉัน',
    relationships: 'ความสัมพันธ์',
  } as const,

  // === 7. Resources & Human-Friendly Concepts ===
  RESOURCES: {
    energy: 'พลังงาน',
    stress: 'ความเครียด',
    freeTime: 'เวลาว่าง',
    evidence: 'พฤติกรรมสะสม',
    traits: 'นิสัย',
    standingOrders: 'คำสั่งประจำ',
    timeAlloc: 'ตารางเวลา',
    autopilot: 'ตัวละครตัดสินใจเอง',
    digest: 'สรุปช่วงที่ผ่านมา',
  } as const,

  // === 8. Timeline Feed ===
  TIMELINE_TITLE: 'เรื่องราวที่เกิดขึ้น',
  TIMELINE_EMPTY: 'กดปุ่มเล่นเวลาด้านบนเพื่อเริ่มเรื่องราววันแรก',
  TIMELINE_SHOW_ALL: (count: number) => `ดูทั้งหมด (${count})`,
  SYSTEM_SUMMARY_LABEL: 'บันทึกระบบ',
  MONTH_END_SUMMARY_TITLE: 'สรุปปิดงบสิ้นเดือน',

  // === 9. Time Controls ===
  TIME: {
    paused: 'หยุด',
    playing: 'เล่น',
    speedX1: 'x1 (ปกติ)',
    speedX5: 'x5 (เร็ว)',
    speedX20: 'x20 (เร็วมาก)',
    skipMonth: 'ข้าม 1 เดือน',
    skipYear: 'ข้าม 1 ปี',
    skipMilestone: 'ข้ามไปจุดสำคัญ',
    pausedBanner: 'เวลาหยุดอยู่ (กดเล่นต่อเพื่อดำเนินชีวิต)',
    resumeBtn: 'เล่นต่อ',
  } as const,

  // === 10. General Verbs & Controls ===
  COMMON: {
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    close: 'ปิด',
    back: 'ย้อนกลับ',
    ageYears: (age: number) => `อายุ ${age} ปี`,
  } as const,

  // === 11. Phase 3.2.1: Lifestyle Presets, Side-Gig Rules, and Skill Training ===
  LIFESTYLE: {
    sectionTitle: 'วิถีชีวิตประจำสัปดาห์',
    sectionSubtitle: 'เลือกแนวทางที่ต้องการเพื่อให้ตาราง 168 ชั่วโมงปรับสมดุลให้อัตโนมัติ',
    customLabel: 'กำหนดเอง',
    customBadge: 'ปรับตารางเอง',
    activeBadge: 'ใช้อยู่',
    fineTuneBtn: 'ปรับละเอียด (168 ชม.)',
    infantManagedNotice: 'วัย 0–5 ปี ครอบครัวเป็นผู้ดูแลและจัดตารางเวลาชีวิตให้ทั้งหมด',
    unemployedNotice: 'ยังไม่มีงานประจำ',
    studentDropoutLockReason: 'ต้องยืนยันเรื่องการเรียนก่อน',
    minorSideGigUnder15: 'อายุต่ำกว่า 15 ปี ห้ามทำงานเสริมทุกกรณี',
    minorSideGigNoRecord: 'ต้องมีงานเสริมที่ผ่านเกณฑ์ก่อน',
    minorSideGigNightForbidden: 'ผู้เยาว์ 15–17 ปี ห้ามทำงานกะดึก (22:00–06:00)',
    minorSideGigOverHours: 'ผู้เยาว์ 15–17 ปี เวลางานและเรียนรวมกันต้องไม่เกิน 48 ชม./สัปดาห์',
    adultSideGigNoRecord: 'ต้องมีงานเสริมก่อน (ระบบสมัครเปิดเต็มรูปแบบในขั้นถัดไป)',
    resetToBaselineBtn: 'คืนค่ามาตรฐานช่วงวัย',
  } as const,

  SKILL_TRAINING: {
    sectionTitle: 'ฝึกทักษะแบบขั้นฝึก 3 ระดับ',
    sectionSubtitle: 'ฝึกเอง (สูงสุด Lv.2) · ลงคอร์ส (สูงสุด Lv.4) · สนามจริง (สูงสุด Lv.5)',
    tooYoungNotice: 'เปิดระบบฝึกทักษะเมื่ออายุ 6 ปีขึ้นไป',
    focusHint: (count: number, max: number) => `เลือกโฟกัสได้สูงสุด ${max} ทักษะ (กำลังโฟกัส ${count}/${max})`,
    focusActive: 'กำลังโฟกัส',
    focusSet: 'ตั้งเป็นโฟกัส',
    focusClear: 'เลิกโฟกัส',
    tierNames: {
      1: 'ขั้น 1: ฝึกเอง (Lv.1–2)',
      2: 'ขั้น 2: ลงคอร์ส (Lv.3–4)',
      3: 'ขั้น 3: สนามจริง (Lv.5)',
    } as const,
    courseTitle: 'คอร์สเรียนเสริม (แบบเดียว: 8 สัปดาห์ · 4,000 ฿)',
    courseActiveLabel: (skillLabel: string, weeksLeft: number, fee: number, missedWeeks = 0) =>
      `กำลังเรียนคอร์ส${skillLabel} · เหลือ ${weeksLeft} สัปดาห์ (${fee.toLocaleString('th-TH')} ฿/สัปดาห์ · ขาด ${missedWeeks}/2)`,
    courseEnrollBtn: (weeks: number, totalFee: number) =>
      `ลงคอร์ส ${weeks} สัปดาห์ (${totalFee.toLocaleString('th-TH')} ฿)`,
    courseUnder15Lock: 'อายุต่ำกว่า 15 ปี ยังลงคอร์สเองไม่ได้ (ฝึกเองถึง Lv.2 หรือร่วมกิจกรรมวัยเด็ก)',
    courseMinHoursHint: (minHours: number) =>
      `ต้องฝึกทักษะนั้นอย่างน้อย ${minHours} ชม./สัปดาห์ (ขาดเกิน 2 สัปดาห์ถือว่าไม่ผ่าน)`,
    capReachedBadge: 'รอปลดล็อกขั้นถัดไป',
    waitingCourseBadge: 'รอปลดล็อกคอร์ส',
    certificatesHeading: 'ใบประกาศนียบัตรที่ได้รับ',
    unlockHintPrefix: 'ทางไปต่อ:',
    explainBtn: 'ทำไม?',
  } as const,

  // === 12. Phase 3.2.2: Life Planner Grid ===
  PLANNER: {
    pageTitle: 'ตารางแผนชีวิต',
    tabWeekly: 'ตารางสัปดาห์',
    tabYearly: 'ปฏิทินรายปี',
    yearlyComingSoonTitle: 'ปฏิทินรายปีและเป้าหมายประจำปี',
    yearlyComingSoonBadge: 'เร็วๆ นี้',
    yearlyComingSoonDesc:
      'มุมมองปฏิทินรายปี วันหยุดราชการ นัดหมาย และเป้าหมายประจำปี กำลังเปิดให้ใช้งานในขั้นถัดไป',
    shortcutTitle: 'ทางลัดจัดตาราง',
    shortcutSubtitle: 'กดเลือกแนวทางเพื่อเติมช่องที่ปรับได้ให้อัตโนมัติ (ตรวจสอบผลก่อนยืนยัน)',
    colWeekday: 'วันธรรมดา (จ.–ศ.)',
    colWeekend: 'วันหยุด (ส.–อา.)',
    changeBtn: 'เปลี่ยน',
    lockedBadge: 'ล็อก',
    draftBadge: 'ฉบับร่าง',
    pendingTomorrowBadge: 'ยืนยันแล้ว · ใช้ผลวันพรุ่งนี้',
    confirmBtn: 'ยืนยันแผน',
    discardBtn: 'ยกเลิกการแก้ไข',
    confirmEffectiveNote: 'ยืนยันแล้วจะมีผลตั้งแต่วันถัดไปในเกม (ปิดหน้านี้โดยไม่ยืนยัน = ไม่เปลี่ยนอะไร)',
    previewTitle: 'ผลคาดการณ์รายสัปดาห์',
    previewScenesLabel: 'ฉากที่จะเห็น:',
    previewFocusedSkillsLabel: 'ทักษะที่จะโต:',
    previewNoFocusSkill: 'ยังไม่ได้ตั้งโฟกัสทักษะ (เลือกได้ในหน้าทักษะ)',
    previewRuleErrorTitle: 'ยังไม่สามารถยืนยันแผนนี้ได้',
    viewAsHoursShow: 'ดูเป็นชั่วโมง (168 ชม./สัปดาห์ · อ่านอย่างเดียว)',
    viewAsHoursHide: 'ซ่อนมุมมองชั่วโมง',
    readOnlyHoursHint: 'ชั่วโมงด้านล่างคำนวณตรงจากกริดตารางด้านบนเท่านั้น ไม่สามารถแก้แยกต่างหาก',
    pickerTitle: (dayLabel: string, slotLabel: string) => `เลือกกิจกรรม · ${dayLabel} ช่วง${slotLabel}`,
    pickerSubtitle: 'เลือกหมวดใหญ่แล้วแตะกิจกรรมที่ต้องการ (แตะนอกกรอบเพื่อปิด)',
    parentPaidHint: 'ผู้ปกครองดูแลค่าใช้จ่าย',
    cashInsufficientLogTitle: 'สลับกิจกรรมเป็นแบบไม่เสียเงินอัตโนมัติ',
    cashInsufficientLogDesc: (fromName: string, toName: string) =>
      `เงินสดไม่พอจ่ายค่าใช้จ่ายของ "${fromName}" ในสัปดาห์นี้ จึงสลับเป็น "${toName}" เพื่อไม่ให้เงินติดลบ`,
    migratedCustomTimelineTitle: 'ตารางถูกจัดใหม่เป็นแบบสมดุล',
    migratedCustomTimelineDesc:
      'ย้ายเซฟจากระบบชั่วโมงกำหนดเองเดิมเข้าสู่ตารางกริดแบบสมดุลเรียบร้อยแล้ว (ชั่วโมงรวม 168 ชม. คำนวณจากกริดทั้งหมด)',
    chainNotice: (slotLabel: string) => `เชื่อมต่อกะทำงานกับช่วง${slotLabel}`,
    otChainCardHint: 'ต่อกะโอทีต่อเนื่องจากงานประจำ',
    otChainLockReason: 'ล็อกต่อเนื่องตามกะงานประจำ',
    otLimitWarning: 'ทำโอทีได้สูงสุด 2 ช่วง/สัปดาห์ และห้ามวางซ้ำติดกันเย็น-ดึกในวันเดียว',
    shiftChainLockNotice: 'เวลาทำงานต่อเนื่องตามกะงานประจำ',
    workaholicPresetPreviewNote: 'เน้นจัดเวลาทำโอทีเพิ่มรายได้พิเศษ (สลับลงวันหยุดให้อัตโนมัติหากกะหลักล็อกช่วงเย็น)',
    minorOvertimeForbidden: 'ผู้เยาว์อายุ 15–17 ปี ห้ามทำโอทีตามกฎหมายแรงงาน',
    adultWorkLimitError: (current: number, max: number) =>
      `ชั่วโมงงานรวม (งานประจำ + โอที + งานเสริม) ต้องไม่เกิน ${max} ชม./สัปดาห์ (ปัจจุบัน ${current} ชม.)`,
    totalWorkHoursLabel: (current: number, max: number) =>
      `ชั่วโมงงานรวม ${current}/${max} ชม./สัปดาห์`,
    noSelfDevSlotHint: (skillLabel: string) =>
      `ทักษะที่เลือก: ${skillLabel} (+0.0/สัปดาห์ — ต้องใส่กิจกรรมพัฒนาตัวเองในตารางอย่างน้อย 1 ช่อง)`,
    arrowLabels: {
      energy: 'พลังงาน',
      stress: 'ความเครียด',
      relationship: 'ความสัมพันธ์',
      skill: 'ทักษะ',
      money: 'การเงิน',
    } as const,
  } as const,

  // === 13. Phase 3.2.3: Annual Focus, Yearly Calendar & Self-Care ===
  ANNUAL_FOCUS: {
    sectionTitle: 'เป้าหมายประจำปี',
    under13Notice: 'เปิดให้ตั้งเป้าหมายประจำปีเมื่ออายุ 13 ปีขึ้นไป',
    changesLeftLabel: (left: number) => `เปลี่ยนได้อีก ${left} ครั้งในปีนี้`,
    maxChangesError: 'ปีนี้คุณเปลี่ยนเป้าหมายครบ 2 ครั้งแล้ว รอตั้งใหม่ในปีหน้า',
    evidenceBonusNote: 'กิจกรรมและโอทีที่ตรงกับเป้าหมายจะช่วยเสริมพฤติกรรมสะสมมากขึ้น 10%',
    recommendedPresetsLabel: 'แนวทางตารางที่เข้ากัน:',
    applyRecommendedBtn: 'ลองใช้แนวทางนี้',
    birthdayPromptTitle: (age: number) => `ตั้งเป้าหมายชีวิตในวัย ${age} ปี`,
    birthdayPromptBody: (age: number, prevLabel: string) =>
      `ก้าวเข้าสู่วัย ${age} ปีแล้ว อยากวางเข็มทิศประจำปีนี้ไปทางไหนเป็นพิเศษ? (ปีที่ผ่านมา: ${prevLabel} · ข้ามเพื่อใช้แนวทางเดิมได้)`,
    skipKeepLabel: 'ข้าม (ใช้แนวทางเดิม)',
    annualSummaryTitle: (yearBE: number, focusLabel: string) =>
      `สรุปผลเป้าหมายปี ${yearBE} (${focusLabel})`,
    relockNoticeTitle: 'ปรับตารางอัตโนมัติตามสถานะล่าสุด',
    streakSectionTitle: 'ความต่อเนื่องรายสัปดาห์',
  } as const,

  YEARLY_CALENDAR: {
    sectionTitle: 'ปฏิทินรายปีและนัดหมาย',
    subtitle: 'วันเกิด วันหยุดราชการ ปิดเทอม วันเงินเดือน/บิล และนัดหมายที่คุณปักไว้ (ไม่เปิดเผยเหตุการณ์ที่ยังไม่เกิดขึ้น)',
    pinFormTitle: 'ปักหมุดนัดหมายส่วนตัว',
    pinTitlePlaceholder: 'เช่น นัดตรวจฟัน / วันเกิดเพื่อน / ส่งโปรเจกต์',
    pinAddBtn: 'ปักหมุดในปฏิทิน',
    pinRemoveBtn: 'ลบ',
    emptyPins: 'ยังไม่มีนัดหมายที่ปักไว้ในปีนี้',
    monthNamesShort: [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ] as readonly string[],
    badgeBirthday: 'วันเกิด',
    badgeHoliday: 'วันหยุด',
    badgeCourse: 'จบคอร์ส',
    badgeFinance: 'รอบบิล',
    badgePin: 'นัดหมาย',
  } as const,

  SELF_CARE_AUTOPILOT: {
    sectionTitle: 'ดูแลตัวเองและครอบครัวอัตโนมัติ',
    sectionSubtitle: 'ตั้งค่าให้หักอัตโนมัติเมื่อถึงกำหนด และจะพักชั่วคราวทันทีหากเงินสดหลังหักต่ำกว่าเงินสำรองขั้นต่ำ',
    pausedLowCashBadge: 'พักชั่วคราว (เงินสดสำรองไม่พอ)',
    checkupLabel: 'ตรวจสุขภาพประจำปี (อายุ 18+)',
    checkupOff: 'ปิด (ยังไม่ตรวจอัตโนมัติ)',
    checkupBasic: 'สิทธิพื้นฐาน (500 ฿/ปี)',
    checkupPrivate: 'โรงพยาบาลเอกชน (3,500 ฿/ปี · เสริมความอึด +3)',
    groomingLabel: 'ดูแลบุคลิกและทำสีผมรายเดือน (500 ฿/เดือน · อายุ 15+)',
    groomingDesc: 'ช่วยคงระดับเสน่ห์ ความน่าเชื่อถือ และรักษาโทนสีผมให้ดูดีเสมอ',
    remittanceLabel: 'ส่งเงินให้ครอบครัวทุกเดือน (อายุ 18+)',
    remittanceOff: 'ยังไม่ตั้งส่งรายเดือน',
    remittance5: 'ส่ง 5% ของรายได้',
    remittance15: 'ส่ง 15% ของรายได้',
  } as const,

  // === 14. Phase 3.2.3 Post-Release Patch ===
  GATED_ACTIONS: {
    tabLabel: 'การกระทำพิเศษ',
    sectionTitle: 'การกระทำพิเศษตามนิสัยและทักษะ',
    sectionSubtitle: 'ลงมือทำกิจกรรมพิเศษที่ปลดล็อกหรือปิดกั้นตามนิสัยและทักษะของคุณได้ทันที',
    toastTitle: (label: string) => `ทำกิจกรรมพิเศษ: ${label}`,
  } as const,

  AUTOSAVE: {
    resumeEyebrow: 'เล่นต่อจากจุดเดิม',
    resumeButton: (name: string, ageYears: number) =>
      `เล่นต่อจากเซฟอัตโนมัติ (${name} • อายุ ${ageYears} ปี)`,
  } as const,

  STORYLET_TOAST: {
    unlockTitle: 'ปลดล็อกกิจกรรมใหม่ในตารางชีวิต',
    unlockPrefix: (labels: string[]) => `ปลดล็อกแล้ว: ${labels.join(', ')}`,
    evidenceTitle: 'บันทึกพฤติกรรมสะสมแล้ว',
    evidencePrefix: (labels: string[]) => `สะสมพฤติกรรมด้าน: ${labels.join(', ')}`,
  } as const,

  // === 15. Phase 3.3.1 & 3.3.1-FIX: Two-Tier Lv.1-5 Skills, Talent Slots 3+5 & Read-Only Education ===
  PHASE331: {
    coreSkillsHeading: 'ทักษะพื้นฐาน (6 ด้าน)',
    discoveredSkillsHeading: 'ทักษะเฉพาะทางที่ค้นพบแล้ว',
    discoveredSkillsEmpty: 'ยังไม่มีทักษะเฉพาะทางที่เปิดเผย ลองเลือกงานอดิเรกที่สนใจแล้วฝึกสะสมให้ครบเกณฑ์ค้นพบ',
    skillDiscoveredToastTitle: 'ค้นพบความถนัดใหม่',
    skillDiscoveredToastDesc: (label: string) => `คุณเริ่มจับทางทักษะ "${label}" ได้แล้ว และสามารถฝึกต่อยอดได้ทันที`,
    talentsHeading: 'ช่องพรสวรรค์และข้อจำกัด',
    talentsSubnote: 'ใช้งานได้พร้อมกันสูงสุด 3 ช่อง ส่วนที่เกินเก็บใน lot (สูงสุด 5) และสลับได้เฉพาะช่วงจุดเปลี่ยนชีวิต',
    talentsActiveHeading: 'ช่องใช้งานอยู่ (สูงสุด 3)',
    talentsVaultHeading: 'คลังสำรอง (lot · สูงสุด 5 · ไม่ให้ผลจนกว่าจะสลับ)',
    talentsRevealedLabel: 'พรสวรรค์ที่ค้นพบแล้ว',
    talentsUnrevealedHintLabel: 'สัญญาณที่เริ่มสังเกตได้',
    talentsNoneRevealed: 'ยังไม่พบพรสวรรค์ที่เด่นชัด',
    talentsSwapReadyNotice: 'ถึงช่วงจุดเปลี่ยนแล้ว — สลับพรสวรรค์ระหว่างช่องใช้งานกับ lot ได้ 1 ครั้ง',
    talentsSwapLockedNotice: 'สลับได้เฉพาะจุดเปลี่ยน: วันขึ้นปีใหม่ (1 ม.ค.), เปิดเทอม (พ.ค./พ.ย.), ย้ายงาน/ระดับเรียน หรือหลังเหตุการณ์สำคัญ T3',
    talentsSwapBtn: 'สลับเข้าช่องใช้งาน',
    limitationsLabel: 'ข้อจำกัดที่ฝึกแก้ไขได้ (ไม่กินช่อง)',
    limitationsCuredToastTitle: 'ก้าวข้ามข้อจำกัดเดิมสำเร็จ',
    limitationsCuredToastDesc: (name: string) => `จากการฝึกฝนอย่างต่อเนื่อง คุณเอาชนะข้อจำกัด "${name}" ได้แล้ว`,
    talentRevealedToastTitle: 'พรสวรรค์ในตัวฉายแววชัดเจน',
    talentRevealedToastDesc: (name: string, tierLabel: string) => `ค้นพบ${name} (${tierLabel})`,
    activitySubfocusLabel: 'สิ่งที่สนใจ / แนวทางฝึก',
    activitySubfocusSaved: (actLabel: string, tagLabel: string) => `ปรับแนวทาง "${actLabel}" เป็น "${tagLabel}" แล้ว`,
    educationSectionTitle: 'ประวัติการเรียน สายการเรียน และเกรดเฉลี่ย',
    educationReadOnlyNote: 'สถานศึกษา สายการเรียน และการสมัคร รด. จะตัดสินใจผ่านเหตุการณ์สำคัญตามวัยและปิดเทอม',
    currentSchoolTierLabel: 'ประเภทสถานศึกษา',
    currentTrackLabel: 'แผนการเรียน ม.ปลาย / สายอาชีพ',
    annualTuitionLabel: (annualThb: number) => `ค่าเทอมต่อปี: ${annualThb.toLocaleString('th-TH')} ฿ (แบ่งชำระ 2 งวด พ.ค. / พ.ย.)`,
    pendingTransferNotice: (targetLabel: string, daysLeft: number) =>
      `รอครอบครัวพิจารณาคำขอย้ายไป${targetLabel} (เหลือ ~${daysLeft} วัน)`,
    currentGpaLabel: 'เกรดเฉลี่ยเทอมล่าสุด',
    cumulativeGpaLabel: 'เกรดเฉลี่ยสะสม (GPAX)',
    gpaHistoryHeading: 'ประวัติเกรดรายเทอม',
    remedialWarningBadge: 'ต้องแก้ ร. / เรียนซ่อม',
    scholarshipActiveBadge: (minGpa: number) => `มีทุนการศึกษา (ต้องรักษาเกรด >= ${minGpa.toFixed(2)})`,
    scholarshipLostToastTitle: 'หลุดทุนการศึกษา',
    scholarshipLostToastDesc: (gpa: number, req: number) =>
      `เกรดเฉลี่ยเทอมนี้ (${gpa.toFixed(2)}) ต่ำกว่าเกณฑ์รักษาทุน (${req.toFixed(2)})`,
    rotcBadgeCompletedMale: 'จบ รด. 3 ปีแล้ว (ได้สิทธิ์ยกเว้นเกณฑ์ทหาร)',
    rotcBadgeCompletedFemale: 'จบ รด. หญิงครบ 3 ปีแล้ว (ได้โบนัสสายราชการ)',
    rotcBadgeEnrolled: (yrs: number) => `กำลังเรียน รด. (ปี ${Math.min(3, yrs + 1)}/3)`,
    rotcNotEnrolled: 'ไม่ได้เรียน รด.',
    lifeHistoryHeading: 'ประวัติชีวิตและจุดเปลี่ยนที่ผ่านมา',
    lifeHistoryEmpty: 'ยังไม่มีจุดเปลี่ยนใหญ่ในชีวิตที่บันทึกไว้',
    lifeHistoryOpenJournalBtn: 'ดูทั้งหมดในแท็บบันทึก',
    secondChanceTitle: 'เรียนต่อนอกเวลา / เพิ่มวุฒิ (อายุ 15+)',
    secondChanceEnrollBtn: 'ลงเรียนเพิ่มวุฒิ',
    secondChanceLeaveBtn: 'พักการเรียนเพิ่มวุฒิ',
    secondChanceProgressLabel: (label: string, termsDone: number, reqTerms: number) =>
      `กำลังเรียน ${label} (ผ่านแล้ว ${termsDone}/${reqTerms} ภาคเรียน)`,
  } as const,
} as const;
