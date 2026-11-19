# SCHEMAS.md — โครงสร้างข้อมูลและชนิดตัวแปรหลัก (Core Type Reference)

> **สำคัญ:** ไฟล์โค้ด `src/engine/types.ts` คือแหล่งความจริงสูงสุด (Single Source of Truth) เอกสารนี้สรุปโครงสร้างหลักตั้งแต่ **Phase 1 ถึง Phase 3.3.1** (ที่มีในโค้ดแล้ว) ส่วนใน **§4 รายการที่ยังไม่มีป้าย `[ทำแล้ว · 3.3.1]` เป็นชนิดข้อมูล "แผน" ของ Phase 3.3.2–3.3.3 ที่ยังไม่มีในโค้ด** เพื่อให้ AI ดูภาพรวมอย่างรวดเร็วโดยไม่ต้องเปิดอ่านไฟล์โค้ดทั้งหมด

---

## 1. โครงสร้างสถานะเกมหลัก (`GameState` & `CharacterState`)

```ts
export interface GameState {
  version: string;
  seed: number;
  rngState: number;                  // สถานะตัวสุ่ม mulberry32 ปัจจุบัน (ห้ามใช้ Math.random)
  clock: ClockState;                 // วัน เดือน ปี พ.ศ. ช่วงเวลา (morning/afternoon/evening/night) และความเร็ว
  character: CharacterState;
  activePrompt: ActivePrompt | null; // การ์ดเหตุการณ์ T2/T3 ที่กำลังรอผู้เล่นตัดสินใจ
  activeToast: ActiveToast | null;   // แถบแจ้งเตือนสั้น T1 / แจ้งผลปลดล็อก
  echoQueue: ScheduledEcho[];        // คิวผลสะท้อนหน่วงเวลาและตอนย่อยของเควส
  eventLog: EventLogEntry[];         // ประวัติเหตุการณ์สำหรับ Replay และปุ่ม "ทำไม?"
  standingOrders: StandingOrders;    // การตั้งค่า Autopilot และสวิตช์ดูแลตัวเองอัตโนมัติ
  digestQueue: DigestItem[];         // รายการรอสรุปเมื่อหยุดหลังเร่งความเร็ว x20
}
```

---

## 2. ระบบตารางแผนชีวิต, กะงาน และเป้าหมายประจำปี (`Phase 3.2 – 3.2.3-P1`)

```ts
export type DaypartId = 'morning' | 'afternoon' | 'evening' | 'night';
export type PlannerColumnId = 'weekday' | 'weekend';
export type WorkShiftType = 'morning-afternoon' | 'afternoon-evening' | 'night-morning' | 'flexible' | 'day_long';

export interface PlannerGrid {
  weekday: Record<DaypartId, string>; // เก็บ activityId ของแต่ละช่วงเวลา (จ.-ศ.)
  weekend: Record<DaypartId, string>; // เก็บ activityId ของแต่ละช่วงเวลา (ส.-อา.)
}

export interface CharacterPlannerState {
  activePresetId: string;
  grid: PlannerGrid;                  // แหล่งความจริงเดียวที่ใช้คำนวณ deriveWeeklyAllocation() (168 ชม.)
  draftGrid?: PlannerGrid | null;
  streaks: Record<string, number>;    // นับสัปดาห์ต่อเนื่องของพรีเซ็ต/หมวดกิจกรรม/โอที (overtimeStreakWeeks)
  annualFocus: {
    currentFocusId: string | null;    // เป้าหมายประจำปี (บวก Evidence +10% ในหมวดที่ตรง)
    changesThisYear: number;          // เปลี่ยนได้ไม่เกินปีละ 2 ครั้ง
    lastReviewYear: number;
  };
  customReminders: CalendarReminder[]; // นัดหมายที่ผู้เล่นปักหมุดเองในปฏิทินรายปี (สูงสุด 24 รายการ)
}
```

---

## 3. ระบบคำสั่งประจำและสวิตช์ดูแลตัวเองอัตโนมัติ (`StandingOrders`)

```ts
export interface StandingOrders {
  enabled: boolean;
  riskPosture: 'cautious' | 'balanced' | 'bold';
  moneyFloor: number;                 // เงินสดขั้นต่ำที่หากต่ำกว่านี้ Autopilot ที่เสียเงินจะหยุดชั่วคราวอัตโนมัติ
  annualHealthCheck: 'off' | 'basic_500' | 'private_3500'; // ตรวจสุขภาพประจำปีตอนวันเกิด (อายุ 18+)
  monthlyGrooming: boolean;           // ดูแลลุคและเติมสีผมรายเดือน (500 ฿/เดือน)
  monthlyFamilySupport: 'off' | 'modest_5pct' | 'generous_15pct'; // ส่งเงินดูแลครอบครัวรายเดือน
}
```

---

## 4. โครงสร้างระบบทักษะ 2 ชั้น, การศึกษาไทย (`Phase 3.3.1` `[ทำแล้ว · 3.3.1]`) และแผน `Phase 3.3.2–3.3.3`

> **สถานะ:** ชนิดข้อมูล `CoreSkillId`, `DiscoveredSkillId`, `SkillKey`, `EducationLevel`, `EducationState`, `Talent` `[ทำแล้ว · 3.3.1]` มีจริงใน `src/engine/types.ts` แล้ว ส่วนโครงสร้างของ `Phase 3.3.2–3.3.3` ด้านล่างยังคงเป็น **(แผน)** จนกว่าจะทำโค้ด

```ts
// [ทำแล้ว · 3.3.1] ทักษะหลัก 6 ด้าน (เห็นตั้งแต่ต้น)
export type CoreSkillId = 'academic' | 'tech' | 'craft' | 'social' | 'business' | 'athletics';

// [ทำแล้ว · 3.3.1] ทักษะเฉพาะทางที่ค้นพบได้ 7 ด้าน (ซ่อนไว้จนกว่าจะปลดล็อกผ่านแท็กกิจกรรม/ชมรม/สายการเรียน)
export type DiscoveredSkillId =
  | 'foreign_lang'
  | 'culinary'
  | 'visual_arts'
  | 'music_vocal'
  | 'performing_acting'
  | 'dance_thai_modern'
  | 'literature_writing';

export type SkillKey = CoreSkillId | DiscoveredSkillId;

// [ทำแล้ว · 3.3.1] สถานะการศึกษา (ฟิลด์ universityId/facultyId/majorId/tcasExamScore รองรับล่วงหน้าสำหรับ 3.3.2)
export type EducationLevel =
  | 'none' | 'primary' | 'lower_secondary' | 'upper_secondary'
  | 'vocational' | 'nfe_lower' | 'nfe_upper'
  | 'bachelor' | 'master' | 'doctorate';

export interface EducationState {
  level: EducationLevel;
  schoolTier: 'school_temple' | 'school_public' | 'school_private' | 'school_international';
  highSchoolTrack?: 'sci_math' | 'arts_math' | 'arts_lang' | 'arts_fine';
  fineArtSkill?: DiscoveredSkillId;
  universityId?: string;              // รอเชื่อมสถาบันใน 3.3.2
  facultyId?: string;
  majorId?: string;
  currentGpa: number;                 // 0.00 - 4.00
  cumulativeGpa: number;
  termCount?: number;
  scholarshipMinGpa?: number | null;  // หากมีทุนและเกรดต่ำกว่าค่านี้จะหลุดทุน
  hasScholarship?: boolean;
  hasStudentLoan: boolean;            // กยศ.
  completedRotc: boolean;             // เรียนจบ รด. 3 ปี (ยกเว้นเกณฑ์ทหารตอนอายุ 21)
  rotcEnrolled?: boolean;
  rotcYearsCompleted?: number;
  remedialDue?: boolean;
  secondChanceEnrolled?: 'nfe_lower' | 'nfe_upper' | 'uni_open_evening' | null;
  secondChanceProgressTerms?: number;
  tcasExamScore?: number | null;      // รอระบบสอบกลางใน 3.3.2
}

// [ใหม่ · 3.3.1-FIX] ระบบเลเวลทักษะ 1–5 (สเปก 05 §2)
export type SkillTierId = 1 | 2 | 3;  // 1 ฝึกเอง (≤Lv2) · 2 ลงคอร์ส (≤Lv4) · 3 สนามจริง (Lv5)
export interface SkillLevelState {
  level: 1 | 2 | 3 | 4 | 5;
  xp: number;                 // XP ในแถบเลเวลปัจจุบัน
  unlockedTier: SkillTierId;  // เก็บถาวร ห้ามผูกกับคอร์สที่กำลังเรียน
  discoveredHours: number;    // ชั่วโมงสะสมเพื่อค้นพบ (ทักษะค้นพบ)
  certificates: string[];     // ใบประกาศจากคอร์ส
}
export interface CourseEnrollment { skillId: string; weeksLeft: number; missedWeeks: number; feePaid: number; }  // คอร์ส 8 สัปดาห์ 4,000 บาท
export interface GpaTermRecord { termId: string; gpa: number; gpax: number; parts: Record<string, number>; }  // ประวัติเกรดรายเทอม
export type ReadinessLevel = 'ready' | 'risky' | 'very_risky';  // ความพร้อมสายเรียน
export interface LifeHistoryEntry { ageMonths: number; kind: string; textKey: string; }  // ประวัติชีวิตเฉพาะจุดใหญ่ แสดงล่าสุด 8 รายการ

// โครงสร้างเควสเนื้อเรื่องแบบแตกแขนง (ตาม CORE_BLUEPRINTS.md §2)
export interface ActiveQuestState {
  questId: string;
  currentAct: 1 | 2 | 3;
  branchRoute: string | null;         // เส้นทางย่อยที่เลือกจาก Act 1 (เช่น 'spotlight' | 'social_chill' | 'rebel')
  questVars: Record<string, number>;  // คะแนนสะสมภายในเควส
  startedOnDay: number;
}

// โครงสร้างฉายาและเกียรติประวัติตัวละคร (ตาม CORE_BLUEPRINTS.md §3)
export interface CharacterTitle {
  id: string;
  nameTh: string;
  originDesc: string;
  scope: 'school' | 'university' | 'career' | 'entertainment' | 'underworld' | 'public';
  acquiredAtAge: number;
  expiresAtAge: number | null;        // null = จำได้ตลอดชีวิต
  modifiers: Record<string, number>;
}

### 4.1 ชนิดข้อมูลที่เพิ่มเข้าแผน (ป้าย `[ใหม่ · 3.3.x]`)
```ts
// [ทำแล้ว · 3.3.1] แทน hiddenAptitudes แบบเดิม (ดู src/data/talents.ts, src/engine/talents.ts)
export type TalentKind = 'skill' | 'personality' | 'genius' | 'limitation' | 'special';
export type TalentTier = 1 | 2 | 3;
export interface Talent {
  id: string;                         // รหัสใน src/data/talents.ts
  kind: TalentKind;
  tier: TalentTier;                   // เล็ก (+10%) / กลาง (+20%) / ใหญ่ (+30%)
  revealed: boolean;                  // ยังไม่เปิดเผย = เห็นแค่ลางบอก
  acquiredAtAge: number;              // 0 = ตั้งแต่เกิด
  source: 'birth' | 'gacha' | 'event';
  fixableBy?: string[];               // สำหรับ limitation: ตัวแก้ เช่น 'hard_study' | 'tutor' | 'course'
  curedAtAge?: number;
  hintShownCount?: number;
}
export interface TalentSlots { active: Talent[]; vault: Talent[]; activeMax: 3; vaultMax: 5; lastRevealAgeMonths: number; lastRevealLifeStage: LifeStage; }  // [อัปเดต · 3.3.1-FIX] ใช้งาน 3 ช่อง + lot 5 ค้นพบห่าง ≥ 36 เดือนเกม

// [ใหม่ · 3.3.2] เควสระดับ Q และเลน (CORE §8)
export type QuestLevel = 'Q-S' | 'Q-M' | 'Q-L' | 'Q-C';
export type QuestLane = 'school_social' | 'love' | 'work' | 'family' | 'entertainment';
// ActiveQuestState ใน §4 เพิ่มฟิลด์: level: QuestLevel; lane: QuestLane;  (รวมไม่เกิน 3 เควสพร้อมกัน)

// [ใหม่ · 3.3.2] แนวประพฤติ, ชื่อเสียงในรั้ว, ชมรม, สภานักเรียน
export type CampusStance =
  | 'quiet' | 'activity' | 'social_butterfly' | 'popular' | 'nerd'
  | 'athlete' | 'academic' | 'bully_turf' | 'average';
export interface CampusReputation { popularity: number; respect: number; studentImage: number; athleteImage: number; }
export interface ClubMembership { clubId: string; role: 'member' | 'vice' | 'president'; sinceAge: number; }
export interface StudentElection { year: number; phase: 'member' | 'vice' | 'run_president'; allies: number; result?: 'win' | 'lose' | 'close'; }

// [ใหม่ · 3.3.2] ชื่อเสียงสถาบันอุดมศึกษา (catalogs/institutions.md)
export interface InstitutionMeta { id: string; prestige: number; competition: number; /* 1-100 */ }

// [ใหม่ · 3.3.3] ค่าขนม/เงินเด็ก และกาชา (CORE §9)
export interface AllowanceState { lastAskedDay: number; cooldownDays: number; childMoney: number; }
export interface GachaState { pityCounters: Record<string, number>; }  // ใช้ nextRng เท่านั้น

// [ใหม่ · 3.3.3] ของขลังจากกาชา (CORE §9, catalogs/items_wardrobe.md) [ร่าง โครงชนิดข้อมูล]
export type CharmRarity = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
export interface CharmItem {
  id: string;                         // รหัสใน catalogs/items_wardrobe.md (chm_*)
  rarity: CharmRarity;
  usage: 'permanent' | 'limited' | 'single_use';
  usesLeft?: number;                  // เมื่อ usage = 'limited'
  acquiredAtDay: number;
}
// [ใหม่ · 3.3.3] งานความสามารถของเด็ก (สเปก 03 §1.1, catalogs/activities.md `gig_*`) [ร่าง โครงชนิดข้อมูล]
export interface TalentGigState {
  gigId: string;                      // รหัส gig_* ใน activities.md
  monthIncome: number;                // ใช้เทียบเพดานรายเดือนของอายุ 13–14 (สเปก 03 §1.1)
  guardianSupervised: boolean;        // 13–14 ต้อง true
}
```
