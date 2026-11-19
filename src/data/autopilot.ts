import type {
  AutopilotSituation,
  RiskProfile,
  SelfCareOrders,
  StandingActionKey,
  StandingConditionKey,
  StandingOrderRule,
  StandingOrders,
} from '../engine/types';

export const SELF_CARE_ORDER_CONFIG = {
  healthCheckup: {
    minAge: 18,
    packages: {
      off: { fee: 0, labelTh: 'ปิด', severeIllnessHazardMult: 1.0, foreshadowLeadDays: 14, annualPhysicalBonus: 0 },
      basic_500: {
        fee: 500,
        labelTh: 'ตรวจสุขภาพสิทธิพื้นฐาน',
        severeIllnessHazardMult: 0.8,
        foreshadowLeadDays: 8,
        annualPhysicalBonus: 0,
      },
      private_3500: {
        fee: 3500,
        labelTh: 'ตรวจสุขภาพโรงพยาบาลเอกชน',
        severeIllnessHazardMult: 0.65,
        foreshadowLeadDays: 6,
        annualPhysicalBonus: 3,
      },
    },
  },
  groomingMonthly: {
    minAge: 15,
    fee: 500,
    looksBonus: 0.35,
    charismaBonus: 0.35,
    reliabilityBonus: 0.25,
  },
  familyRemittance: {
    minAge: 18,
    rates: {
      off: 0,
      pct_5: 0.05,
      pct_15: 0.15,
    },
    familyEvidencePct5: 1.0,
    familyEvidencePct15: 2.2,
  },
} as const;

export const DEFAULT_SELF_CARE_ORDERS: SelfCareOrders = {
  healthCheckupPackage: 'off',
  groomingMonthlyEnabled: false,
  familyRemittanceMode: 'off',
  pausedByLowCash: {},
};

export const RISK_PROFILE_META: Record<
  RiskProfile,
  { labelTh: string; descriptionTh: string; boldnessScore: number }
> = {
  cautious: {
    labelTh: 'ปลอดภัยไว้ก่อน (Cautious)',
    descriptionTh: 'เน้นเก็บออม เลี่ยงความเสี่ยงและหนี้สิน ปฏิเสธข้อเสนอสุ่มเสี่ยง',
    boldnessScore: -1,
  },
  balanced: {
    labelTh: 'สมดุล (Balanced)',
    descriptionTh: 'ชั่งน้ำหนักระหว่างความมั่นคงกับโอกาสใหม่ตามสภาพคล่องและความเครียด',
    boldnessScore: 0,
  },
  bold: {
    labelTh: 'กล้าได้กล้าเสีย (Bold)',
    descriptionTh: 'เปิดรับโอกาสเสี่ยงสูงผลตอบแทนสูง ยอมเหนื่อยหรือลงทุนเพิ่มเพื่อก้าวกระโดด',
    boldnessScore: 1,
  },
};

export const STANDING_CONDITION_LABELS: Record<StandingConditionKey, string> = {
  low_cash: 'เมื่อเงินสดต่ำกว่าเกณฑ์ขั้นต่ำ',
  high_stress: 'เมื่อความเครียดพุ่งสูงเกิน 75',
  payday_surplus: 'เมื่อเงินเดือนเข้าหรือได้เงินก้อน',
  night_invite: 'เมื่อมีคำชวนสังสรรค์ยามค่ำคืน',
  overtime_offer: 'เมื่อมีข้อเสนอทำโอที/งานเสริม',
  risky_windfall: 'เมื่อเจอข้อเสนอลงทุน/เสี่ยงโชค',
};

export const STANDING_ACTION_LABELS: Record<StandingActionKey, string> = {
  save_reserve: 'กันเงินออมเข้าบัญชีสำรองทันที',
  take_side_gig: 'มองหางานเสริม / รับโอทีเพิ่ม',
  rest_priority: 'สลับไปโหมดพักผ่อนและลดงานหนัก',
  decline_spend: 'ปฏิเสธคำชวนที่ใช้เงินฟุ่มเฟือย',
  accept_if_safe: 'ตอบรับอัตโนมัติถ้าระดับพลังและเงินปลอดภัย',
  ask_player: 'หยุดเวลาและถามฉันก่อนเสมอ',
};

export const DEFAULT_STANDING_RULES: StandingOrderRule[] = [
  {
    id: 'rule_low_cash',
    enabled: true,
    conditionKey: 'low_cash',
    actionKey: 'take_side_gig',
    labelTh: 'ถ้าเงินสดต่ำกว่าเกณฑ์ ให้ส่งสัญญาณ/รับงานเสริม',
  },
  {
    id: 'rule_payday_save',
    enabled: true,
    conditionKey: 'payday_surplus',
    actionKey: 'save_reserve',
    labelTh: 'เมื่อมีรายรับ ให้ยึดเป้าการออมตามสัดส่วนที่ตั้งไว้',
  },
  {
    id: 'rule_high_stress',
    enabled: true,
    conditionKey: 'high_stress',
    actionKey: 'rest_priority',
    labelTh: 'ถ้าความเครียดสูงมาก ให้ชะลอภาระและเน้นพักฟื้น',
  },
  {
    id: 'rule_risky_windfall',
    enabled: false, // Disabled by default so unhandled situations genuinely pause for the player!
    conditionKey: 'risky_windfall',
    actionKey: 'ask_player',
    labelTh: 'เมื่อเจอข้อเสนอเสี่ยงโชค/ลงทุน ให้จัดการตามกฎที่เลือก',
  },
];

export const DEFAULT_STANDING_ORDERS: StandingOrders = {
  autopilotEnabled: true,
  riskProfile: 'balanced',
  financial: {
    minSavingsRatePct: 15,
    lowCashThreshold: 4000,
    avoidDebt: true,
    strictBudget: false,
  },
  rules: DEFAULT_STANDING_RULES,
  selfCare: { ...DEFAULT_SELF_CARE_ORDERS },
};

export const AUTOPILOT_SITUATION_TEMPLATES: Omit<AutopilotSituation, 'id'>[] = [
  {
    kind: 'payday_temptation',
    title: 'เงินเข้ากระเป๋าพร้อมโปรลดแรงปลายเดือน',
    description: 'ร้านค้าและแอปช้อปปิ้งส่งคูปองลดราคามาเต็มฟีด คุณจะใช้จังหวะนี้ยังไง?',
    options: [
      {
        id: 'save_strictly',
        label: 'เก็บออมตามแผน ไม่วอกแวก',
        hint: 'สะสมหลักฐานวินัยการเงินและรักษาเงินสด',
        tags: ['save', 'disciplined'],
        effects: [
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 2, reason: 'ห้ามใจไม่ช้อปปลายเดือน' },
          { type: 'ChangeResource', resource: 'stress', delta: -1, reason: 'สบายใจที่คุมงบได้' },
        ],
      },
      {
        id: 'impulse_treat',
        label: 'เปย์รางวัลชีวิตให้ตัวเองสัก 1,200 บาท',
        hint: 'คลายเครียดทันที แต่เงินสดลดลงและเพิ่มหลักฐานใช้จ่ายตามอารมณ์',
        tags: ['spend', 'impulse'],
        effects: [
          { type: 'AddMoney', amount: -1200, category: 'living', reason: 'ใช้จ่ายตามอารมณ์ซื้อของให้รางวัลตัวเอง' },
          { type: 'ChangeResource', resource: 'stress', delta: -4, reason: 'ได้ของถูกใจทันที' },
          { type: 'RecordEvidence', key: 'overspending', amount: 2, reason: 'เปย์ของอยากได้ตามอารมณ์' },
        ],
      },
    ],
  },
  {
    kind: 'overtime_offer',
    title: 'หัวหน้า/ลูกค้าถามหาคนช่วยลุยงานด่วนพิเศษ',
    description: 'มีจังหวะทำชั่วโมงพิเศษเพิ่มรายได้อีกก้อนเล็กๆ แต่ต้องแลกกับแรงกายและเวลาพัก',
    options: [
      {
        id: 'take_overtime',
        label: 'รับงานพิเศษ (+850 บาท)',
        hint: 'ได้เงินเพิ่มแต่เสียพลังงานและสะสมความเหนื่อยล้า',
        tags: ['work', 'money'],
        effects: [
          { type: 'AddMoney', amount: 850, category: 'side', reason: 'รับงานด่วนพิเศษผ่านการตัดสินใจ' },
          { type: 'ChangeResource', resource: 'energy', delta: -10, reason: 'ล้าจากงานเสริมด่วน' },
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'เร่งปิดงานด่วน' },
          { type: 'RecordEvidence', key: 'overwork', amount: 1.5, reason: 'รับงานเร่งเพิ่มนอกเวลา' },
          { type: 'RecordEvidence', key: 'self_discipline', amount: 1, reason: 'ขยันคว้าโอกาสงาน' },
        ],
      },
      {
        id: 'rest_instead',
        label: 'ขอผ่าน เพื่อรักษาเวลาพักผ่อน',
        hint: 'รักษาพลังงานและความสงบทางใจ',
        tags: ['rest', 'safe'],
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 5, reason: 'เลือกพักฟื้นร่างกายแทนฝืนทำโอที' },
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ลดภาระล่วงเวลา' },
          { type: 'RecordEvidence', key: 'rest_recovery', amount: 1.5, reason: 'จัดลำดับความสำคัญให้การพักผ่อน' },
        ],
      },
    ],
  },
  {
    kind: 'night_invite',
    title: 'กลุ่มเพื่อนทักชวนออกไปสังสรรค์คืนนี้',
    description: 'เพื่อนชวนออกไปเจอกันแถวร้านนั่งชิลหลังเลิกงาน/เลิกเรียน ค่าใช้จ่ายอาจบานปลายได้',
    options: [
      {
        id: 'join_night_out',
        label: 'ตกลงออกไปแจมกับเพื่อน (-600 บาท)',
        hint: 'ได้สังคมและความสนิทสนม แต่เสียเงินและพลังนอน',
        tags: ['social', 'spend', 'night'],
        requiresAdult: true,
        effects: [
          { type: 'AddMoney', amount: -600, category: 'living', reason: 'ค่าอาหารเครื่องดื่มสังสรรค์กับเพื่อน' },
          { type: 'ChangeSkill', skill: 'social', delta: 0.8, reason: 'เข้าสังคมพูดคุยกับเพื่อนฝูง' },
          { type: 'ChangeResource', resource: 'energy', delta: -8, reason: 'นอนดึกหลังสังสรรค์' },
          { type: 'RecordEvidence', key: 'night_out', amount: 2, reason: 'ออกไปเที่ยวสังสรรค์กลางคืน' },
          { type: 'RecordEvidence', key: 'peer_follow', amount: 1.5, reason: 'ตอบรับคำชวนของกลุ่มเพื่อน' },
        ],
      },
      {
        id: 'decline_stay_home',
        label: 'ขอตัวพักอยู่บ้านและฝึกทักษะเงียบๆ',
        hint: 'ประหยัดเงินและได้เวลาส่วนตัว',
        tags: ['rest', 'save', 'solitude'],
        effects: [
          { type: 'ChangeResource', resource: 'energy', delta: 4, reason: 'เข้านอนตรงเวลา' },
          { type: 'RecordEvidence', key: 'solitude', amount: 1.5, reason: 'เลือกอยู่เงียบๆ ทบทวนตัวเอง' },
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1, reason: 'ประหยัดค่าสังสรรค์' },
        ],
      },
    ],
  },
  {
    kind: 'risky_windfall',
    title: 'คนรู้จักชวนลงขันโปรเจกต์/เสี่ยงโชคผลตอบแทนสูง',
    description: 'ข้อเสนอฟังดูน่าตื่นเต้น มีโอกาสได้กำไรคืนเร็วแต่ก็มีความเสี่ยงเงินสูญ',
    options: [
      {
        id: 'take_the_gamble',
        label: 'ลองเสี่ยงดูสักตั้ง (-1,500 บาท)',
        hint: 'เสี่ยงดวงได้หรือเสีย และสะสมหลักฐานชอบเสี่ยงโชค',
        tags: ['risk', 'bold'],
        requiresAdult: true,
        effects: [
          { type: 'AddMoney', amount: -1500, category: 'event', reason: 'ลงขันความเสี่ยงระยะสั้น' },
          { type: 'RecordEvidence', key: 'risk_taking', amount: 2.5, reason: 'กล้าลองข้อเสนอเสี่ยงสูง' },
          {
            type: 'ScheduleEcho',
            delayDays: 14,
            title: 'ผลตอบแทนจากการเสี่ยงลงทุนระยะสั้น',
            description: 'ครบกำหนดสรุปผลวงลงขันที่ตัดสินใจเข้าร่วมเมื่อสองสัปดาห์ก่อน',
            effects: [
              { type: 'AddMoney', amount: 2200, category: 'event', reason: 'ได้เงินคืนจากดีลเสี่ยงระยะสั้น' },
              { type: 'RecordEvidence', key: 'success_streak', amount: 1.5, reason: 'ดีลเสี่ยงได้กำไร' },
            ],
            sourceEventId: 'autopilot_risky_windfall',
          },
        ],
      },
      {
        id: 'skip_risk_play_safe',
        label: 'ปฏิเสธอย่างสุภาพ เก็บเงินสดไว้กับตัว',
        hint: 'ปลอดภัย 100% ไม่มีโอกาสขาดทุน',
        tags: ['safe', 'save'],
        effects: [
          { type: 'RecordEvidence', key: 'disciplined_saving', amount: 1.5, reason: 'หลีกเลี่ยงดีลเสี่ยงและรักษาเงินต้น' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 0.4, reason: 'รอบคอบเรื่องเงิน' },
        ],
      },
    ],
  },
];
