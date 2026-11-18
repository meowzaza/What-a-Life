# SCHEMAS — นิยามโครงสร้างข้อมูลกลางของเกม

> กฎสำคัญ: `Effect` ต้องเป็น Discriminated Union ชนิดจำกัดเท่านั้น ห้ามมี Effect แบบแก้ค่าใดๆ ตามใจ (Arbitrary Key/Value Mutator)

---

## 1. ปฏิทินและเวลา (Calendar & Time)

```typescript
export interface GameDate {
  yearCE: number;      // ปี ค.ศ. (ใช้คำนวณปฏิทินสากลและอธิกสุรทิน)
  month: number;       // 1..12
  day: number;         // 1..31
  dayOfWeek: number;   // 0 (อาทิตย์) .. 6 (เสาร์)
  totalDays: number;   // จำนวนวันสะสมตั้งแต่เริ่มเกม (Tick count)
}

export type GameSpeed = 0 | 1 | 3 | 5 | 10 | 20;
```

---

## 2. สเตตัส 3 ชั้น (3-Layer Stats)

```typescript
// ชั้น 1: ดัชนีชีวิต 6 ด้าน (0..100, คำนวณจากชั้น 2 + บริบทเท่านั้น)
export type LifeIndexKey =
  | 'physical'     // กาย
  | 'mental'       // ใจ
  | 'financial'    // เงิน
  | 'social'       // สัมพันธ์
  | 'status'       // สถานะ
  | 'competence';  // ความสามารถ

export type LifeIndices = Record<LifeIndexKey, number>;

// ชั้น 2A: ปัจจัยดิบ (Raw Attributes, 0..100)
export type RawStatKey =
  | 'looks'        // รูปลักษณ์/เสน่ห์
  | 'strength'     // ความแข็งแรง
  | 'endurance'    // ความอึด
  | 'wit'          // ไหวพริบ
  | 'memory'       // ความจำ
  | 'creativity'   // ความคิดสร้างสรรค์
  | 'eq'           // EQ
  | 'charisma'     // เสน่ห์การพูด
  | 'reliability'; // ความน่าเชื่อถือ

export type RawStats = Record<RawStatKey, number>;

// ชั้น 2B: ทรัพยากรชั่วคราว (0..100 สำหรับ energy/stress, 0..24 ชั่วโมง/วัน สำหรับ freeTime)
export type ResourceKey = 'energy' | 'stress' | 'freeTime';
export type TempResources = Record<ResourceKey, number>;

// ชั้น 3: ทักษะรายอย่าง (0..100, เติบโตจากการฝึก/ทำงาน)
export type SkillKey =
  | 'english'      // ภาษาอังกฤษ
  | 'sales'        // การเจรจา/ขาย
  | 'finance'      // การจัดการเงิน
  | 'tech'         // เทคโนโลยี/คอมพิวเตอร์
  | 'craft'        // งานช่าง/ฝีมือ
  | 'cooking'      // ทำอาหาร/ค้าขาย
  | 'socializing'  // การเข้าสังคม
  | 'academic';    // วิชาการ

export type Skills = Record<SkillKey, number>;
```

---

## 3. ข้อมูลตัวละครและภูมิหลัง (Person & Background)

```typescript
export type RegionId = 'bangkok' | 'central' | 'north' | 'northeast' | 'east' | 'south';

export type FamilyWealthTier =
  | 'destitute'     // ยากจนขัดสน
  | 'working_poor'  // หาเช้ากินค่ำ
  | 'lower_middle'  // ชนชั้นกลางล่าง
  | 'middle'        // ชนชั้นกลาง
  | 'upper_middle'  // มีอันจะกิน
  | 'wealthy';      // มั่งคั่ง

export type FamilyStructure =
  | 'two_parents'   // พ่อแม่ครบ
  | 'single_parent' // เลี้ยงเดี่ยว
  | 'grandparents'; // ปู่ย่าตายายเลี้ยง

export type ParentEducation = 'primary' | 'secondary' | 'vocational' | 'bachelor' | 'postgrad';

export type TemperamentId =
  | 'calm'          // ใจเย็น
  | 'fiery'         // ใจร้อน
  | 'anxious'       // ขี้กังวล
  | 'optimistic'    // มองโลกแง่ดี
  | 'ambitious';    // ทะเยอทะยาน

export type EducationLevel =
  | 'none'
  | 'primary'
  | 'lower_secondary'
  | 'upper_secondary'
  | 'vocational'
  | 'bachelor'
  | 'master'
  | 'doctorate';

export type Gender = 'male' | 'female' | 'nonbinary';

export interface BackgroundProfile {
  region: RegionId;
  province: string;
  familyWealth: FamilyWealthTier;
  fatherJob: string;
  motherJob: string;
  familyStructure: FamilyStructure;
  parentEducation: ParentEducation;
  temperament: TemperamentId;
  geneticHealth: number; // 20..100
}

export interface BackstorySummary {
  educationHistory: string;
  keyRelationships: string[];
  turningPoints: string[]; // 3-5 จุดเปลี่ยนชีวิตที่ผ่านมา
  narrativeCard: string;   // เรื่องราวของฉัน
}

export type AppearanceStage = 'baby' | 'kid' | 'adult' | 'elder';
export type ManifestEyeShape = 'narrow' | 'balanced' | 'round' | 'closed' | 'hidden';
export type ManifestEyeColor =
  | 'dark'
  | 'blue'
  | 'green'
  | 'gray'
  | 'amber'
  | 'purple'
  | 'closed'
  | 'hidden';

export interface CharacterBustFocus {
  x: number;
  y: number;
  zoom?: number;
}

export interface CharacterSpriteMeta {
  id: string;
  group: 'baby' | 'kid' | 'male' | 'female' | 'elder';
  w: number;
  h: number;
  skinTone: number; // 1..6 (ตรวจสอบด้วยตาจริงทั้ง 332 ตัวใน Manifest v3)
  skinHex: string;
  hairHex: string;
  hairColor: string;
  lookAge: 'baby' | 'child' | 'teen' | 'adult' | 'mature' | 'senior';
  ageRange?: [number, number]; // ขอบเขตอายุรายตัวที่สอดคล้องกับใบหน้าและเครื่องแต่งกายจริง
  bustFocus?: CharacterBustFocus; // พิกัดจุดกึ่งกลางใบหน้าสำหรับโหมดกรอบวงกลม bust
  gender: 'm' | 'f' | 'n';
  eyeShape?: ManifestEyeShape;
  eyeColor?: ManifestEyeColor;
  tags: string[]; // ช่วงวัย/ความต่อเนื่อง (school_uniform, dyed_hair, mature_gray, luk_kreung), บุคลิก (cute, cheerful, haughty, bad_boy, quiet, strict, kind, nerdy, gamer, chubby, muscular, sia, sugar_daddy, sugar_mommy, jae, sor, khun_nai, khun_nu), ฐานะ & ภูมิภาค (luxury, middle_class, humble, street_working, isaan_vibe, north_vibe, south_vibe, central_bkk)
  flags: string[];
  file: string;
  anchor: { x: number; y: number };
}

export interface CharacterAppearance {
  charId: string;
  stage: AppearanceStage;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: Gender;
  birthYearCE: number;
  ageYears: number;
  isMinor: boolean; // กฎตายตัวใน Engine: ageYears < 18
  isAlive: boolean;
  causeOfDeath?: string;
  education: EducationLevel;
  background: BackgroundProfile;
  backstory: BackstorySummary;
  rawStats: RawStats;
  resources: TempResources;
  skills: Skills;
  indices: LifeIndices; // คำนวณจาก rawStats + resources + economy + skills
  traits: string[];     // Stub สำหรับ Phase 2 (เริ่มที่ temperament tag)
  flags: Record<string, boolean>;
  appearance?: CharacterAppearance; // Optional เพื่อรองรับเซฟเก่า (สร้างให้ตอนโหลดเซฟ)
}
```

---

## 4. เศรษฐกิจและกิจวัตร (Economy & Routine)

```typescript
export type HousingId = 'parents_home' | 'cheap_room' | 'townhouse_rent' | 'condo';

export type RoutineFocus = 'balanced' | 'hustle' | 'study' | 'rest' | 'side_gig';

export interface EconomyState {
  cash: number;               // เงินสด (บาท)
  monthlySalary: number;      // รายได้ประจำต่อเดือน
  monthlySideIncome: number;  // รายได้เสริมสะสมเดือนนี้
  monthlyExpenses: number;    // รายจ่ายประเมินต่อเดือน (ค่าเช่า + ค่ากิน + ผ่อนหนี้)
  housingId: HousingId;
  jobId: string;
  jobTitle: string;
  debt: number;               // ยอดหนี้คงค้าง
  creditScore: number;        // 300..900
  creditLimit: number;        // เพดานวงเงินกู้คำนวณจากรายได้ + creditScore
  missedPayments: number;
  assetsValue: number;        // มูลค่าทรัพย์สินอื่น (ถ้ามี)
}
```

---

## 5. Effect Union (ชนิดจำกัดเท่านั้น)

```typescript
export type Effect =
  | { type: 'ChangeRawStat'; stat: RawStatKey; delta: number; reason: string }
  | { type: 'ChangeResource'; resource: ResourceKey; delta: number; reason: string }
  | { type: 'ChangeSkill'; skill: SkillKey; delta: number; reason: string }
  | { type: 'AddMoney'; amount: number; category: 'salary' | 'side' | 'living' | 'rent' | 'debt' | 'event'; reason: string }
  | { type: 'AddDebt'; amount: number; reason: string }
  | { type: 'RepayDebt'; amount: number; reason: string }
  | { type: 'ChangeCredit'; delta: number; reason: string }
  | { type: 'SetHousing'; housingId: HousingId; reason: string }
  | { type: 'SetJob'; jobId: string; reason: string }
  | { type: 'AddTrait'; traitId: string; reason: string }
  | { type: 'RemoveTrait'; traitId: string; reason: string }
  | { type: 'AddFlag'; flag: string; value: boolean; reason: string }
  | { type: 'ScheduleEcho'; delayDays: number; title: string; description: string; effects: Effect[]; sourceEventId: string }
  | { type: 'SetDeath'; cause: string };
```

---

## 6. Event, Prompt และ Log (Event & Audit)

```typescript
export interface EchoItem {
  id: string;
  triggerOnDay: number; // เทียบกับ date.totalDays
  title: string;
  description: string;
  effects: Effect[];
  sourceEventId: string;
}

export interface EventChoice {
  id: string;
  label: string;
  hint?: string;
  requiresAdult?: boolean; // ถ้า true จะถูกล็อก/กรองเมื่อ isMinor === true
  effects: Effect[];
}

export interface PendingEventPrompt {
  id: string;
  title: string;
  category: 'milestone' | 'dilemma' | 'economy' | 'health' | 'twist';
  description: string;
  choices: EventChoice[];
  isAdultContent?: boolean;
}

export interface TimelineEntry {
  id: string;
  totalDay: number;
  dateLabel: string;
  ageYears: number;
  category: 'life' | 'work' | 'finance' | 'health' | 'milestone' | 'echo';
  title: string;
  description: string;
  effectsSummary?: string[];
  appearance?: CharacterAppearance; // บันทึกภาพตัวละคร ณ ช่วงวัยใน log เพื่อแสดงแถวสรุปตอนจบชีวิต
}

export interface StatChangeLog {
  id: string;
  totalDay: number;
  dateLabel: string;
  target: string; // เช่น "raw:endurance", "cash", "skill:english"
  delta: number;
  newValue: number;
  reason: string;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number; // สถานะภายในของ mulberry32 เพื่อให้ทำ Deterministic step ต่อเนื่องได้
  date: GameDate;
  character: Person;
  economy: EconomyState;
  routine: RoutineFocus;
  echoQueue: EchoItem[];
  pendingPrompt: PendingEventPrompt | null;
  needsPlayer: boolean;
  timeline: TimelineEntry[];
  statLogs: StatChangeLog[];
  triggeredEventIds: string[];
  pendingAutosave: boolean;
}
```

---

## 7. PlayerAction และ Replay

```typescript
export type PlayerAction =
  | { type: 'SET_ROUTINE'; routine: RoutineFocus }
  | { type: 'CHANGE_HOUSING'; housingId: HousingId }
  | { type: 'APPLY_JOB'; jobId: string }
  | { type: 'TRAIN_SKILL'; skill: SkillKey }
  | { type: 'BORROW_MONEY'; amount: number }
  | { type: 'REPAY_DEBT'; amount: number }
  | { type: 'RESOLVE_PROMPT'; promptId: string; choiceId: string };

export interface ActionRecord {
  atTotalDay: number;
  action: PlayerAction;
}
```

---

## 8. Explain Panel, LifeGen และ SaveSlot (Phase 1 Additions)

```typescript
export interface ExplainComponent {
  label: string;
  value: number;
  weight?: string;
  contribution: number;
}

export interface ExplainBreakdown {
  key: string;
  title: string;
  currentValue: number;
  formulaText: string;
  components: ExplainComponent[];
  recentLogs: StatChangeLog[];
}

export type LifeGenMode = 'random' | 'custom' | 'at_age';

export interface CustomLifeOptions {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  gender?: Gender;
  region?: RegionId;
  province?: string;
  familyWealth?: FamilyWealthTier;
  familyStructure?: FamilyStructure;
  parentEducation?: ParentEducation;
  temperament?: TemperamentId;
  geneticHealth?: number;
}

export interface AtAgeLifeOptions extends CustomLifeOptions {
  targetAge: number;
  education?: EducationLevel;
  wealthFocus?: 'struggling' | 'average' | 'comfortable';
}

export interface LifeGenRequest {
  mode: LifeGenMode;
  seed: number;
  randomStartPoint?: 'birth' | 'age6' | 'age12' | 'late_teen';
  custom?: CustomLifeOptions;
  atAge?: AtAgeLifeOptions;
  appearanceOverride?: string; // charId ที่ผู้เล่นกดสุ่มเปลี่ยนในหน้า LifeGen ก่อนเริ่มชีวิต
}

export interface SaveSlotData {
  slotId: string; // 'autosave' | 'slot_1' | 'slot_2' | 'slot_3'
  label: string;
  savedAtISO: string;
  seed: number;
  lifeGenRequest: LifeGenRequest;
  actionLog: ActionRecord[];
  snapshot: GameState;
  meta: {
    characterName: string;
    ageYears: number;
    dateLabel: string;
    cash: number;
    jobTitle: string;
    isAlive: boolean;
  };
}
```

---

## 9. กฎความสัมพันธ์และความเหมาะสมตามอายุ สำหรับ Phase 4 (`canRomance`)

> Phase 4 (ระบบ NPC และความรัก) **ต้องเรียกใช้ `canRomance(a, b)` ใน Engine ทุกครั้ง** ก่อนอนุญาตให้จีบ สารภาพรัก คบหา หรือเกิดเหตุการณ์เชิงชู้สาว (ห้ามให้ AI ตัดสินเอง)

```typescript
export type RomanceMode =
  | 'forbidden'      // ห้ามจีบ/คบ ให้เกิดเหตุการณ์ปฏิเสธ (แอบปลื้ม/ชื่นชม/รู้สึกดีได้เท่านั้น)
  | 'puppy_crush'    // ต่ำกว่า 16 ปี: ไม่มีสถานะแฟน มีได้แค่เพื่อน เพื่อนสนิท แอบชอบ ป๊อปปี้เลิฟทั่วไป
  | 'school_romance' // 16–20 ปี (และห่าง <= 2 ปี, ไม่มีคู่ใด < 18 กับ >= 20): คบแบบรักวัยเรียน (แอบชอบ สารภาพ เดต จับมือ)
  | 'full';          // 18 ปีขึ้นไปทั้งคู่: เปิดเต็มตามระดับเนื้อหาที่ผู้เล่นตั้ง

export interface RomanceEligibility {
  allowedDating: boolean;       // คบเป็นแฟนได้หรือไม่
  allowedExplicitAdult: boolean; // เปิดฉากผู้ใหญ่ชัดเจนได้หรือไม่ (ต้อง >= 18 ทั้งคู่เท่านั้น)
  mode: RomanceMode;
  reason: string;
}

/**
 * Specification สำหรับ Phase 4 (ยังไม่สร้างโค้ดจริงใน Phase 1.6):
 * 1. ถ้าฝ่ายใดฝ่ายหนึ่งอายุ < 16:
 *    - allowedDating = false, allowedExplicitAdult = false
 *    - mode = 'puppy_crush' (มีได้แค่ความรู้สึกชอบ แอบชอบ เพื่อน เพื่อนสนิท ป๊อปปี้เลิฟทั่วไป; ถ้าอีกฝ่าย >= 18 ให้ปฏิเสธเป็น 'forbidden')
 * 2. ถ้าฝ่ายใดฝ่ายหนึ่งอายุ < 18 และอีกฝ่ายอายุ >= 20:
 *    - allowedDating = false, allowedExplicitAdult = false
 *    - mode = 'forbidden' -> ต้องเป็นเหตุการณ์ปฏิเสธ (เช่น 17 กับ 22 แอบปลื้ม/ชื่นชมได้เท่านั้น)
 * 3. ถ้าทั้งคู่อายุ >= 18:
 *    - allowedDating = true, allowedExplicitAdult = true (ขึ้นกับการตั้งค่าระดับเนื้อหาของผู้เล่น)
 *    - mode = 'full'
 * 4. กรณีที่เหลือ (อย่างน้อยหนึ่งฝ่ายอายุ 16–17 และอีกฝ่ายอายุ 16–19):
 *    - ตรวจอายุช่วง 16–20 และ Math.abs(a.ageYears - b.ageYears) <= 2 (เช่น 16 กับ 18, 17 กับ 19)
 *    - ถ้าผ่าน: allowedDating = true, allowedExplicitAdult = false, mode = 'school_romance'
 *      (ล็อกฉากทางเพศโจ่งแจ้งไว้ใน Engine; มีได้เฉพาะฉากความสุ่มเสี่ยงทางสังคม/อนาคตตามบริบท เช่น ท้องวัยเรียน, ซื้อถุงยาง/ยาคุม, แฟนชวนไปบ้านวันที่ผู้ใหญ่ไม่อยู่, โดดเรียนไปกินเหล้า ฯลฯ)
 *    - ถ้าไม่ผ่าน (ห่างเกิน 2 ปี): allowedDating = false, allowedExplicitAdult = false, mode = 'forbidden'
 */
export function canRomance(
  a: { ageYears: number; isMinor: boolean },
  b: { ageYears: number; isMinor: boolean }
): RomanceEligibility;
```

