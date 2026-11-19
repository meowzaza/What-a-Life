# PROGRESS.md — บันทึกประวัติงานที่ทำเสร็จแล้วทั้งหมด (Completed Phases Ledger)

> **กติกาสำหรับ AI (ห้ามทำซ้ำ & การอัปเดตเอกสาร):**
> 1. ไฟล์นี้คือบันทึกสิ่งที่ **สร้างและทดสอบเสร็จสมบูรณ์แล้วในโค้ดจริง (Phase 1 ถึง Phase 3.3.1 รวม 18 รอบงาน)** ห้ามรื้อสร้างซ้ำเด็ดขาด ให้เรียกใช้ฟังก์ชันที่มีอยู่แล้วตามที่ระบุไว้
> 2. **เมื่อต้องเช็กประวัติย้อนหลัง:** ให้ค้นหา (Search) เฉพาะหัวข้อรหัส Phase ที่เกี่ยวข้อง ไม่ต้องอ่านไล่ตั้งแต่บรรทัดแรกจนจบเพื่อประหยัดโทเคน
> 3. **สิทธิ์การอัปเดตไฟล์โดย AI:** AI สามารถเข้ามาอัปเดต เพิ่มเติม หรือแก้ไขข้อมูลในไฟล์นี้ (รวมถึง `ROADMAP.md`, `CODE_MAP.md`, `DESIGN.md`, `BACKLOG_IDEAS.md`) ได้ด้วยตัวเอง **เมื่อผู้ใช้ตกลงยืนยันหรือสั่งให้จัดการแล้วเท่านั้น** (ห้ามแก้แผนงานเองโดยพลการหากผู้ใช้แค่ถามปรึกษา)

---

## ตารางเทียบชื่อรหัส Phase ย่อย (Alias Reference)
เพื่อไม่ให้สับสนเมื่อเปิดเจอชื่อเก่าในคอมเมนต์โค้ดหรือชื่อไฟล์เทสต์:
- **`Phase 3.2.2-X1`** = ชื่อเดิมคือ *"Phase 3.2.2 Extended"*
- **`Phase 3.2.2-X2`** = ชื่อเดิมคือ *"Phase 3.2.2 (Extension 2)"*
- **`Phase 3.2.2-P1`** = ชื่อเดิมคือ *"Patch Phase 3.2.2 (Overtime & Side-Gig)"*
- **`Phase 3.2.3-P1`** = ชื่อเดิมคือ *"Patch Phase 3.2.3 (Auto-Save & Polish)"*

---

## รายละเอียดสิ่งที่ทำเสร็จแล้ว (เรียงจากเริ่มต้น -> ล่าสุด)

### 1. Phase 1: แกนหลักจำลองชีวิต (Core Deterministic Spine) — เสร็จแล้ว
- **ไฟล์ที่สร้าง:** `src/engine/types.ts`, `rng.ts`, `clock.ts`, `lifegen.ts`, `stats.ts`, `economy.ts`, `pipeline.ts`, `state.ts`, `save.ts`, `src/data/thaiData.ts`, `lifeStages.ts`, `uiText.ts`
- **สิ่งที่ทำเสร็จ:**
  - ระบบเวลา `1 Tick = 1 วัน` (4 ช่วงเวลา: เช้า/บ่าย/เย็น/ดึก) พร้อมความเร็ว `Pause / x1 / x2 / x5 / x20` และตัวฮุก `onDay`, `onWeek`, `onMonth`, `onYear`
  - ระบบสุ่มเทียม `mulberry32` ที่ส่งต่อ `rngState` ใน `GameState` ทุกการตัดสินใจ (`x1` กับ `x20` ผลตรงกัน 100%)
  - สเตตัส 3 ชั้น: ดัชนีหลัก 6 ตัว (`Energy`, `Health`, `Stress`, `Money`, `Relationship`, `Status`), คุณลักษณะแกนกลาง 7 ตัว, และทักษะพื้นฐาน
  - ระบบเศรษฐกิจไทย 6 ภูมิภาค, เงินเฟ้อ, ภาษี/หนี้สิน, วันหยุดราชการไทยและปิดเทอม (`isThaiPublicHoliday`, `isThaiSchoolBreak`)
  - กฎล็อกผู้เยาว์ใน Engine (`isMinor`: `<15` ห้ามทำงาน/รายจ่ายส่วนตัว 0, `<18` อยู่บ้านพ่อแม่ฟรี/ล็อกเนื้อหาผู้ใหญ่)
  - ระบบเซฟ IndexedDB 4 ช่อง + Export/Import JSON + Replay Log

### 2. Phase 1.5: ยกเครื่อง UI มือถือ & แก้บั๊กเวลา — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/ui/screens/MainGameScreen.tsx`, `LifeGenScreen.tsx`, `src/ui/components/TopBar.tsx`, `StickyControls.tsx`, `StatBar.tsx`
- **สิ่งที่ทำเสร็จ:**
  - แก้บั๊ก Stale Closure ในลูป `requestAnimationFrame` โดยใช้ `useReducer(gameReducer)` รับ Action `TICK`
  - ออกแบบเลย์เอาต์จอมือถือ (`360–430 px`) แถบควบคุมเวลาติดขอบจอไม่เลื่อนหาย และเปลี่ยนข้อความทั้งหมดเป็นภาษาไทยคนทั่วไปไร้ศัพท์เทคนิค

### 3. Phase 1.6: ระบบตัวละคร PNG 332 ตัว & การเปลี่ยนร่างตามวัย — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/data/characterManifest.json` (332 ตัว), `src/engine/appearance.ts`, `src/ui/components/CharacterPortrait.tsx`
- **สิ่งที่ทำเสร็จ:**
  - ระบบคัดกรองตัวละครตาม `ageBucket` (`child`, `teen`, `young_adult`, `mid_adult`, `senior`) และเพศ
  - ระบบ `evolveCharacterPortraitOnBirthday`: เปลี่ยนภาพตัวละครเมื่อข้ามช่วงวัยโดยรักษา `skinTone`, `hairColor`, `eyeColor`, `eyeShape` เดิมไว้ให้มากที่สุด
  - ระบบประเมินผลกระทบของรูปลักษณ์ (`evaluateAppearanceImpact`: สีผมย้อม/การแต่งกายส่งผลต่ออาชีพและภาพลักษณ์ 4 กลุ่มสังคม)

### 4. Phase 1.7: ธีม Soft Pastel Pixel & ไร้อิโมจิ 100% — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/ui/components/PixelIcons.tsx`, `IndexIcon.tsx`, `scripts/checkNoEmoji.mjs`, `src/index.css`
- **สิ่งที่ทำเสร็จ:**
  - ลบอิโมจิออกจากโค้ด UI และ Data 100% พร้อมสคริปต์ตรวจอัตโนมัติ `npm run check:emoji`
  - วาดไอคอน SVG สไตล์พิกเซลพาสเทลขอบม่วงเข้ม (`#4E3B69`) ครบทุกดัชนีและปุ่มเมนู

### 5. Phase 1.8: ระบบฉากพิกเซล 21 ฉาก (`SceneStage`) — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `public/assets/scenes/sceneManifest.json` (21 ฉาก), `src/data/sceneMeta.ts`, `src/engine/scene.ts`, `src/ui/components/SceneStage.tsx`
- **สิ่งที่ทำเสร็จ:**
  - แสดงภาพฉากหลังพิกเซล 16:9 พร้อมวางตัวละคร PNG ยืนในพิกัด `standZone` และปรับขนาดตาม `characterScale`
  - เอฟเฟกต์แสงสีตามช่วงเวลา 4 ช่วง (เช้า/บ่าย/เย็น/ดึก) และการเปลี่ยนฉากแบบ Crossfade

### 6. Phase 2: นิสัย 3 ชั้น (34 Traits) & Autopilot พื้นฐาน — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/data/traits.ts`, `src/engine/traits.ts`, `evidence.ts`, `timeAlloc.ts`, `autopilot.ts`, `src/ui/components/StandingOrdersPanel.tsx`, `TimeAllocPanel.tsx`
- **สิ่งที่ทำเสร็จ:**
  - นิสัย 34 ตัว แบ่ง 3 ชั้น: พื้นอารมณ์แต่กำเนิด (5), นิสัยที่งอกและจางจากหลักฐานพฤติกรรม `EvidenceCounters` (21), และความขัดแย้งในใจ `innerTension` (8)
  - ระบบคำสั่งประจำ (`Autopilot / Standing Orders`) พื้นฐานสำหรับตอบเหตุการณ์ระดับต่ำตอนเปิดความเร็วสูง (`x5`, `x20`)

### 7. Phase 3: Event Director, Storylet Engine & ปุ่ม "ทำไม?" — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/engine/storylet.ts`, `eventDirector.ts`, `echo.ts`, `twist.ts`, `explain.ts`, `src/data/storylets/coreStorylets.ts`, `src/ui/components/ExplainModal.tsx`
- **สิ่งที่ทำเสร็จ:**
  - `validateStorylet`: ตรวจความถูกต้องของ Storylet, ล็อกผู้เยาว์ `isMinorSafe`, ตรวจฉากใน Manifest, และจำกัดเพดาน Effect union
  - `Event Director`: คุมจังหวะดราม่า (`Tension Curve` & `Attention Budget` ไม่ให้ T3 ถี่เกินไป), ระบบลางบอกเหตุ (`Foreshadow`) ล่วงหน้าอย่างน้อย 14 วันก่อนเกิดจุดพลิกผัน (`Twist`)
  - `Echo Queue`: คิวผลสะท้อนหน่วงเวลาที่จะทำงานเมื่อถึงวันที่กำหนด
  - `explain()`: อธิบายสาเหตุย้อนหลังเป็นภาษาไทยเข้าใจง่ายว่าทำไมเหตุการณ์นี้ถึงเกิด หรือทำไมนิสัยนี้ถึงงอก

### 8. Phase 3.1: การ์ดเหตุการณ์มาตรฐานเดียว & บทสรุปช่วงเวลา (`Digest`) — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/engine/digest.ts`, `src/ui/components/EventCardModal.tsx`, `DigestModal.tsx`, `CelebrationToast.tsx`
- **สิ่งที่ทำเสร็จ:**
  - รวมหน้าตาการ์ดตัดสินใจ T2 และ T3 ให้ใช้แม่แบบเดียวกัน แสดงหมวดเป็นป้ายเล็กมุมการ์ด โดย T3 บังคับลดความเร็วเป็น `x1` และไม่มีเวลานับถอยหลัง
  - ระบบ `Digest`: สรุปเหตุการณ์และผลประกอบการเมื่อผู้เล่นกดหยุดหลังเร่งความเร็ว `x20`

### 9. Phase 3.2: ตารางวัน 4 ช่อง (`DayPlan`) & ฉากตามเวลาจริง — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/engine/dayPlan.ts`, `src/ui/components/DayPlanStrip.tsx`, `src/tests/phase32Tests.ts`
- **สิ่งที่ทำเสร็จ:**
  - สร้าง `DayPlan` 4 ช่องต่อวัน (`morning`, `afternoon`, `evening`, `night`) ที่เปลี่ยนฉากใน `SceneStage` ตามช่วงเวลาจริง
  - ประตูอายุและเวลาเปิด-ปิดของฉาก (`isSceneOpen`: เช่น `nightlife_pub` เปิดเฉพาะกลางคืนและล็อกอายุ `<20`) พร้อมฉากสำรอง (`fallbackSceneId`)
  - ใส่โลโก้เกมหน้าแรกและปรับ HUD มือถือไม่ให้บังตัวละครในฉาก

### 10. Phase 3.2.1: พรีเซ็ตวิถีชีวิตตามวัย & ระบบฝึกทักษะขั้นบันได — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/data/lifestylePresets.ts`, `src/data/skillTraining.ts`, `src/engine/skillTraining.ts`, `src/tests/phase321Tests.ts`
- **สิ่งที่ทำเสร็จ:**
  - พรีเซ็ตวิถีชีวิต 10 แบบที่ล็อก/ปลดล็อกตามช่วงวัยและสถานะการจ้างงานจริง
  - **อุดบั๊กผู้เยาว์ทำงานเสริม:** ปิดไม่ให้เด็ก `<15` ได้เงินจากงานเสริม และอายุ `15–17` ห้ามทำโอที/กะดึก
  - **ระบบฝึกทักษะขั้นบันได 3 ขั้น (Skill Tiers):** `Lv.1–30` ฝึกเองได้, `Lv.31–60` ต้องลงคอร์สเรียน (มีค่าใช้จ่ายและระยะเวลาคอร์ส), `Lv.61–100` ต้องทำงานในสายนั้นจริงหรือปลดล็อกผ่านกิจกรรมระดับสูง พร้อมผลตอบแทนลดหลั่นเมื่อฝึกซ้ำ

### 11. Phase 3.2.2: ตารางแผนชีวิตแบบกริด (`LifePlanner Grid`) — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/data/slotHours.ts`, `src/data/activities.ts`, `src/data/lifestyleTemplates.ts`, `src/engine/planner.ts`, `src/ui/components/LifePlannerPanel.tsx`, `src/tests/phase322Tests.ts`
- **สิ่งที่ทำเสร็จ:**
  - สร้างกริดตารางแผนชีวิต **2 คอลัมน์ (`weekday` / `weekend`) × 4 ช่วงเวลา (`morning`, `afternoon`, `evening`, `night`)** ให้เป็น **แหล่งความจริงเดียว (Single Source of Truth)** ที่คำนวณ `deriveWeeklyAllocation` ออกมาเป็น 168 ชม./สัปดาห์
  - แคตตาล็อกกิจกรรม 6 หมวดใหญ่ 23 กิจกรรมย่อย พร้อมการสลับกิจกรรมเสียเงินเป็นกิจกรรมฟรีอัตโนมัติเมื่อเงินสดไม่พอใน `onWeek`

### 12. Phase 3.2.2-X1 *(ชื่อเดิม: Phase 3.2.2 Extended)*: กะงาน, โอทีต่อเนื่อง & ฟรีแลนซ์เบื้องต้น — เสร็จแล้ว
- **ไฟล์ที่แก้:** `src/engine/planner.ts`, `src/data/activities.ts`, `src/engine/types.ts`
- **สิ่งที่ทำเสร็จ:**
  - เพิ่มระบบกะงาน (`workShift`: เช้า-บ่าย, บ่าย-เย็น, ดึก-เช้า, ยืดหยุ่น) ที่ล็อกช่องในกริดตามกะจริง
  - เพิ่มการล็อกช่องต่อเนื่องเมื่อเลือกโอที (`Slot Chaining`) และกิจกรรมฟรีแลนซ์เบื้องต้นที่ผันแปรรายได้ตาม Seeded RNG

### 13. Phase 3.2.2-X2 *(ชื่อเดิม: Phase 3.2.2 Extension 2)*: ขัดเกลา UI กริด & Migration เซฟเก่า — เสร็จแล้ว
- **ไฟล์ที่แก้:** `src/ui/components/LifePlannerPanel.tsx`, `src/engine/planner.ts`, `src/engine/save.ts`
- **สิ่งที่ทำเสร็จ:**
  - แสดงสัญลักษณ์เชื่อมช่องเวลาต่อเนื่องใน UI, กรอบพรีวิวผลคาดการณ์รายสัปดาห์ (`previewPlannerImpact`), และระบบแปลงเซฟเก่าเข้าสู่กริด (`migratePlanner`)

### 14. Phase 3.2.2-P1 *(ชื่อเดิม: Patch Phase 3.2.2)*: แก้การคำนวณเงินโอที/งานเสริมจากกริดจริง — เสร็จแล้ว
- **ไฟล์ที่แก้:** `src/engine/planner.ts`, `src/engine/timeAlloc.ts`, `src/data/activities.ts`, `src/data/lifestyleTemplates.ts`
- **สิ่งที่ทำเสร็จ:**
  - แก้ให้รายได้จาก `work_overtime` และ `work_side_gig` คำนวณจากจำนวนชั่วโมงที่วางในกริดโดยตรง (คูณอัตราโอที 1.5x จากฐานเงินเดือน) ไม่พึ่งตัวแปร `routine` เดิม
  - ขยายให้วาง `work_overtime` ในช่องวันหยุดหรือช่องดึก (สำหรับงานกะยาว `day_long`) ได้ภายใต้เพดานชั่วโมงทำงานสูงสุดต่อสัปดาห์

### 15. Phase 3.2.3: เป้าหมายประจำปี, ปฏิทินรายปี, Streak, Autopilot ดูแลตน & Storylet 24 ใบ — เสร็จแล้ว
- **ไฟล์ที่สร้าง/แก้:** `src/data/storylets/plannerStorylets.ts` (24 ใบ รวมคลังทั้งหมดเป็น 69 ใบ), `src/engine/planner.ts`, `src/engine/autopilot.ts`, `src/ui/components/LifePlannerPanel.tsx`, `StandingOrdersPanel.tsx`, `src/tests/phase323Tests.ts`
- **สิ่งที่ทำเสร็จ:**
  - เป้าหมายประจำปี (`AnnualFocus`) ตั้งตอนอายุ 13+ เปลี่ยนได้ไม่เกินปีละ 2 ครั้ง ให้โบนัสหลักฐาน (`Evidence`) `+10%` ในหมวดที่ตรงเป้าหมาย และสรุปผลรายปีผ่าน `digest.ts`
  - แท็บ **ปฏิทินรายปี**: แสดงวันเกิด, วันหยุดราชการ/ปิดเทอม, วันจบคอร์ส, วันเงินเดือนออก/บิลวันที่ 1, และปักหมุดนัดหมายส่วนตัวได้สูงสุด 24 รายการ
  - กิจกรรมปลดล็อกตามเงื่อนไข (`club_uni`, `work_streaming`, `competition_advanced`, `childcare`, และ Stub สำหรับฝึกงาน/ฟรีแลนซ์ที่รอ Phase 3.4) พร้อมระบบรีล็อกคืนอย่างสุภาพเมื่อเงื่อนไขหาย
  - ตัวนับความต่อเนื่องรายสัปดาห์ (`Streak`) และสวิตช์ **Autopilot ดูแลตัวเองอัตโนมัติ** (ตรวจสุขภาพประจำปี / ดูแลลุครายเดือน / ส่งเงินให้ครอบครัว) ที่หยุดทำงานชั่วคราวอัตโนมัติเมื่อเงินสดต่ำกว่าเกณฑ์ปลอดภัย

### 16. Phase 3.2.3-P1 *(ชื่อเดิม: Patch Phase 3.2.3)*: ระบบ Auto-Save & เก็บตกการแจ้งเตือน — เสร็จแล้ว
- **ไฟล์ที่แก้:** `src/engine/save.ts`, `src/ui/screens/MainGameScreen.tsx`, `src/ui/screens/LifeGenScreen.tsx`, `src/engine/state.ts`, `src/data/traits.ts`, `src/ui/components/LifePlannerPanel.tsx`
- **สิ่งที่ทำเสร็จ:**
  - **ระบบ Auto-Save (`AUTOSAVE_SLOT_ID = 'autosave'`):** บันทึกอัตโนมัติทุกสัปดาห์ในเกม, ทุกครั้งที่ตอบเหตุการณ์/ยืนยันตาราง, และทันทีที่พับหน้าจอหรือสลับแท็บบนมือถือ (`visibilitychange` / `pagehide`) พร้อมปุ่มเด่น **"เล่นต่อจากเซฟอัตโนมัติ"** บนหน้าแรก
  - แจ้งเตือนชัดเจนในกรอบพรีวิวตารางเมื่อเลือกทักษะที่โฟกัสแล้วแต่ยังไม่ได้ใส่ช่องกิจกรรมพัฒนาตัวเองในกริด
  - ลบปุ่ม `"อาสารับงานโอที"` ที่ซ้ำซ้อนออกจาก `GATED_ACTIONS`, เด้ง Toast แจ้งเตือนทุกครั้งที่เหตุการณ์ปลดล็อกกิจกรรมใหม่, และยุบโหมดเริ่มชีวิตในหน้า `LifeGenScreen` เหลือ **2 โหมด (`random` และ `custom`)**

### 17. Phase 3.2.4-DOC: ยกเครื่องเอกสาร (เอกสารล้วน ไม่แตะลอจิก) — เสร็จแล้ว
- **ไฟล์ที่สร้าง:** โฟลเดอร์ `docs/catalogs/` (12 ไฟล์), `CORE_BLUEPRINTS.md`, `CODE_MAP.md` (เขียนใหม่จาก export ในโค้ดจริง), `DECISIONS.md`, `BACKLOG_IDEAS.md`, `ROADMAP.md`, `specs/00_index.md`, `specs/07_education_tcas_and_skills.md`, `specs/SPEC_EDIT_QUEUE.md`
- **สิ่งที่ทำเสร็จ:**
  - วางเอกสารชุดใหม่ทับ ย้ายของเก่าเข้า `docs/_archive/pre-3.2.4-DOC/` ตัดการ์ดศิลปิน/จับฉลากปีใหม่ออกจากแผนกาชา เปลี่ยนแท็ก `[ร่าง]` เป็น `[ยืนยัน]` แก้ชื่อ `01_scene_catalog_v2.md` เป็น `01_scene_catalog.md`

### 18. Phase 3.3.1: ทักษะ 2 ชั้น, พรสวรรค์หลายชนิด & ระบบเรียน/GPA — เสร็จแล้ว
- **ไฟล์ที่สร้าง:** `src/data/skills.ts`, `src/data/talents.ts`, `src/data/education.ts`, `src/engine/talents.ts`, `src/engine/education.ts`, `src/tests/phase331Tests.ts`
- **ไฟล์ที่แก้:** `src/engine/types.ts`, `src/engine/skillTraining.ts`, `src/engine/save.ts`, `src/engine/lifegen.ts`, `src/engine/pipeline.ts`, `src/engine/planner.ts`, `src/engine/state.ts`, `src/engine/stats.ts`, `src/engine/storylet.ts`, `src/engine/director.ts`, `src/engine/log.ts`, `src/engine/timeAlloc.ts`, `src/engine/traits.ts`, `src/engine/traitEffects.ts`, `src/data/skillTraining.ts`, `src/data/activities.ts`, `src/data/traits.ts`, `src/data/thaiData.ts`, `src/data/autopilot.ts`, `src/data/uiText.ts`, `src/data/storylets/catalog.ts`, `src/data/storylets/plannerStorylets.ts`, `src/ui/components/tabs/MeTab.tsx`, `src/ui/components/tabs/WorkStudyTab.tsx`, `src/ui/components/LifePlannerPanel.tsx`, `src/ui/screens/MainGameScreen.tsx`, `package.json`
- **สิ่งที่ทำเสร็จ:**
  - **ทักษะ 2 ชั้น (13 ทักษะ แทนชุดเก่า 8 ตัว):** แยก `CoreSkillId` 6 ด้าน (`academic`, `tech`, `craft`, `social`, `business`, `athletics`) และ `DiscoveredSkillId` 7 ด้าน (`visual_arts`, `music_vocal`, `performing_acting`, `dance_thai_modern`, `culinary`, `foreign_lang`, `literature_writing`) พร้อม `tagProgress` ค้นพบอิสระจากแท็กกิจกรรม (`>= 8` ครั้ง หรือ `>= 24` ชม.) และ Migration เซฟเก่าใน `save.ts` (`socializing -> social`, `max(sales, finance) -> business`, `english -> foreign_lang`, `cooking -> culinary`)
  - **พรสวรรค์หลายชนิดและข้อจำกัดแก้ไขได้ (`talents.ts`):** สุ่ม 0–หลายอย่างตอนเกิด (~35/40/20/5%) 3 ระดับความแรง (`+10/20/30%` ภายใต้เพดานกลาง `+40%`) ลดเกณฑ์ค้นพบทักษะ `25/40/60%`, มีลางบอก (`ev_talent_hint`) ก่อนเปิดเผย, และข้อจำกัด 8 ชนิด (เช่น `lim_slow_learner`, `lim_stage_fright`) ที่รักษาหายผ่านกิจวัตร/คอร์สเรียน (`advanceLimitationCureProgress`)
  - **ระบบเรียนไทย GPA, รด. & Second-Chance (`education.ts`):** ประเภทโรงเรียน 4 ระดับ (ย้ายได้เฉพาะ มี.ค.–เม.ย.), แผนการเรียน ม.ปลาย 4 สาย (`arts_lang` / `arts_fine` เปิดทักษะตรงสายทันที), เกรดเฉลี่ยปลายเทอม (ต.ค./มี.ค.) + ติด ร. (`GPA < 1.50`) + ตัดทุนเมื่อต่ำกว่าเกณฑ์, รด. 3 ปี, กศน. ม.ต้น/ม.ปลาย (`nfe_lower`/`nfe_upper` เทียบเท่าในระบบ) และมหาวิทยาลัยเปิด, พร้อมการ์ด T3 วิกฤต ม.3 (`ev_dropout_crisis`) ตัวเลือกปกติ 5 ข้อ + ตัวเลือกพิเศษตามเงื่อนไข 4 ข้อ
