# ชีวิตจริงยิ่งกว่านิยาย (Real Life Is Stranger Than Fiction) — เอกสารออกแบบกลาง

> เอกสารนี้คือความจำกลางของโปรเจกต์ ต้องอ่านก่อนเริ่มงานทุกครั้ง และอัปเดตให้เป็นปัจจุบันเสมอเมื่อจบงานแต่ละ Phase

---

## 1. แก่นของเกมและสิ่งที่ตกลงแล้ว

- **ชื่อเกม**: ชีวิตจริงยิ่งกว่านิยาย (Life Simulator เซ็ตติ้งไทย)
- **ภาษา**: UI โค้ดที่แสดงผล และเอกสารเล่าเรื่องเป็นภาษาไทยทั้งหมด
- **โทนและแนวคิด**:
  - เซ็ตติ้งประเทศไทยร่วมสมัย สะท้อนความจริงทางสังคม เศรษฐกิจ ครอบครัว และจังหวะชีวิตแบบไทย
  - โทนประชดแบบ "ยิ่งกว่าในละคร" เล่นอิสระ เป็นแซนด์บ็อกซ์ **ไม่ใช่ละครคุณธรรม** ไม่ต้องมีบทเรียนสอนใจ เล่นเพื่อความเพลิดเพลินและการสำรวจผลลัพธ์ของทางเลือก
- **ขอบเขตเนื้อหาและกฎอายุ (Hard Engine Rule)**:
  - **ต่ำกว่า 16 ปี**: ไม่มีสถานะแฟน มีได้แค่ความรู้สึกชอบ แอบชอบ เพื่อน เพื่อนสนิท ป๊อปปี้เลิฟทั่วไป
  - **16–20 ปี**: คบแบบรักวัยเรียนได้ (แอบชอบ สารภาพ เดต จับมือ) เฉพาะกับคู่อายุ 16–20 และอายุห่างกันไม่เกิน 2 ปี เช่น 16 กับ 18, 17 กับ 19
  - **กฎตายตัวใน Engine สำหรับต่ำกว่า 18 ปี (`isMinor = true`)**: เนื้อหาทางเพศที่เฉพาะชัดเจนเกินไปและฉากโจ่งแจ้งสำหรับต่ำกว่า 18 ล็อกไว้ใน Engine (ไม่พึ่ง AI ตัดสิน) มีได้แต่ฉากที่สื่อถึงความสุ่มเสี่ยงเกิดคำครหา หรือสุ่มเสี่ยงเกี่ยวกับอนาคต เช่น ท้องวัยเรียน, เริ่มดูหนังโป๊เพื่อเรียนรู้ตัวเองและเพศศึกษา, ซื้อถุงยางพกไว้, ซื้อยาคุม, แฟนชวนไปบ้านวันที่ผู้ใหญ่ไม่อยู่, โดดเรียนไปกินเหล้า ฯลฯ (ทั้งนี้ขึ้นอยู่กับปัจจัยอื่นๆ อย่างสังคม, ความตระหนักรู้ด้านเพศศึกษา, โรงเรียน, นิสัยตัวละครเราและตัวอื่น ฯลฯ ซึ่งจะพัฒนาลึกใน Phase ต่อๆ ไป)
  - **ผู้เยาว์ต่ำกว่า 18 กับผู้ใหญ่ 20+**: ผู้เยาว์ต่ำกว่า 18 จีบ/คบกับผู้ใหญ่อายุ 20 ขึ้นไปไม่ได้ ให้เป็นเหตุการณ์ปฏิเสธ (เช่น อายุ 17 จะคบคนอายุ 22 ถือว่าไม่ได้ แอบปลื้มหรือชื่นชม รู้สึกดีได้เท่านั้น)
  - **18 ปีขึ้นไป**: เปิดเต็มตามระดับเนื้อหาที่ผู้เล่นตั้ง (เสี่ยเลี้ยง พนัน ยาเสพติด ความรุนแรง เรื่องฉาว และสถานการณ์สุ่มเสี่ยงทุกความเป็นไปได้)
- **เป้าหมายผู้เล่น**:
  - แซนด์บ็อกซ์เป็นหลัก (เล่นตามจังหวะและแรงปรารถนาของตัวเอง)
  - มี Aspiration แบบเลือกได้ (จะเลือกหรือไม่เลือกก็ได้)
  - มีคะแนนสรุปชีวิตตอนจบแบบหลายนิยาม (ไม่ได้วัดแค่เงินหรือศีลธรรม)
- **ปุ่มปรับโทน 3 ปุ่มอิสระ (วางแผนทำใน Phase 6)**:
  1. ความโหดของโลก (ชิลล์ / สมจริง / โหดจริง)
  2. ระดับความยิ่งกว่านิยาย (เงียบ / ละครหลังข่าว / เต็มสูบ)
  3. น้ำเสียงการเล่าเรื่อง + พรีเซ็ตสำเร็จรูป
- **ระบบ Trait 3 ชั้น (วางแผนทำใน Phase 2)**:
  1. อารมณ์พื้นฐาน (Temperament)
  2. บุคลิกภาพต่อเนื่อง (Personality)
  3. Trait ที่งอกจากหลักฐานพฤติกรรม (มีเกณฑ์ ช่วงอ่อนไหว ระดับความเข้ม และจุดเปลี่ยน)
  - Trait ต้องส่งผลจริง 4 ทาง: เปลี่ยนตัวเลือกที่ปรากฏ, เปลี่ยนความน่าจะเป็นของผลลัพธ์, พฤติกรรม Autopilot, และปฏิกิริยาของ NPC
- **ระบบ NPC (วางแผนทำใน Phase 4)**:
  - LOD 3 ระดับ (เพื่อประสิทธิภาพและมิติของตัวละครใกล้ตัว vs คนผ่านทาง)
  - Utility-based decision
  - Memory ที่จางลงตามเวลาและคืนดีกันได้
  - Fog of Knowledge (ผู้เล่นไม่ได้รู้ความลับหรือค่าสถานะทั้งหมดของ NPC ทันที)
- **Twist และความโปร่งใส (วางแผนทำใน Phase 3 และ 6)**:
  - ทุกจุดหักมุม (Twist) ต้องมีต้นเหตุที่ตรวจสอบได้ + ลางบอกเหตุ (Foreshadowing) + Explain Panel

---

## 2. หลักการทางวิศวกรรมที่ห้ามละเมิด

1. **"AI เสนอ, Engine ตัดสิน"**:
   - ตรรกะ ตัวเลข ความน่าจะเป็น เวลา เงิน สุขภาพ ความตาย และกฎความปลอดภัย (`isMinor`) ต้องเป็น **Pure Functions** ใน `src/engine/` เท่านั้น
   - ห้าม `src/engine/` import React, DOM, Browser API หรือเรียก External API เด็ดขาด
2. **Deterministic Simulation**:
   - ใช้ Seeded RNG (`mulberry32`) ทุกจุดที่มีการสุ่ม ห้ามใช้ `Math.random()` ใน `src/engine/`
   - `seed` เดียวกัน + ลำดับ `PlayerAction` เดียวกัน ต้องให้ผลลัพธ์ `GameState` เหมือนเดิม 100% ทุกครั้ง
3. **Frame-rate & Speed Independence**:
   - ผลลัพธ์ต้องไม่ขึ้นกับความเร็วเกม (`x1`..`x20`) และไม่ขึ้นกับ Frame Rate
   - ใช้ Fixed-timestep Accumulator Loop ในชั้น Runner/UI เพื่อประมวลผลทีละ Tick (1 Tick = 1 วันในเกม) โดยห้ามข้าม Tick
4. **AI-Optional**:
   - เกมต้องเล่นได้ครบสมบูรณ์แม้ไม่มี AI (Phase 1 ยังไม่มีการเรียก AI เลย)
5. **Event Sourcing / Audit Trail**:
   - เก็บ Action Log และ Event Log ทุกการเปลี่ยนแปลงสถานะ เพื่อให้สามารถตรวจสอบย้อนหลังใน Explain Panel และจำลองซ้ำจาก `seed + actionLog` ได้
6. **กฎเหล็กเรื่องภาษาผู้เล่นและสิ่งต้องห้ามในการแสดงผล (Forbidden Player-Facing Jargon & Math)**:
   - **ห้ามใช้ศัพท์วิศวกรรม/ศัพท์เทคนิคของระบบให้ผู้เล่นเห็น**: ห้ามแสดงคำว่า `Trait`, `Storylet`, `Autopilot`, `Standing Orders`, `Tension Budget`, `Event Director`, `DayPlan`, `Hook`, `Override`, `Strict Budget`, `If-Then`, `T0/T1/T2/T3`, `rng`, `tick`, `ชั้น A / ชั้น B / ชั้น C` ในหน้าจอเล่นเกมจริง ป๊อปอัป การ์ดเหตุการณ์ ไทม์ไลน์ หรือหน้า `"ทำไม?"` (ยกเว้นหน้าดีบักหรือปุ่ม Dev ที่ซ่อนอยู่) ให้ใช้คำภาษาไทยธรรมดาที่คนทั่วไปเข้าใจทันที (เช่น `นิสัย`, `เหตุการณ์`, `ตัวละครตัดสินใจเอง`, `หน้าคำสั่งประจำ`, `จังหวะชีวิตช่วงนี้`)
   - **ห้ามแสดงชื่อตัวแปรหรือคีย์ภายในแบบโค้ด (`snake_case` / `camelCase`)**: ห้ามหลุดชื่ออย่าง `success_streak`, `self_reflection`, `praised`, `disciplined_saving`, `rest_recovery`, `def.kind` ออกมาให้ผู้เล่นเห็นเด็ดขาด ต้องแปลงผ่านพจนานุกรมภาษาไทยเสมอ
   - **ห้ามแสดงสูตรคูณหรือค่าคำนวณภายในแบบ Debug**: ห้ามเขียนข้อความแนว `หลักฐานสะสม (success_streak=6.9/4, self_reflection=7.8/4) × ตัวคูณช่วงวัย 1.04`, `(เกณฑ์ 45+)`, `(ต่ำกว่า 38)`, `จังหวะหนัก-เบาของชีวิตช่วงนี้: 100 / 100`, หรือ `คะแนนลดต่ำกว่า 2.4` — หน้าต่าง `"ทำไม?"` และคำอธิบายผลลัพธ์ต้องเล่าด้วย **ภาษาคนทั่วไปเชิงเหตุและผล** (เช่น `"เกิดจากการทำพฤติกรรมซ้ำๆ ด้านความสำเร็จต่อเนื่องและการทบทวนตัวเอง"`, `"จังหวะชีวิตช่วงนี้กำลังนิ่งสบาย พร้อมรับเรื่องราวใหม่ๆ"`)

---

## 3. สถาปัตยกรรมชั้นต่างๆ (Layered Architecture)

```text
src/
├── data/
│   ├── thaiData.ts         # ตารางข้อมูลคงที่เซ็ตติ้งไทย (จังหวัด 6 ภาค, ชื่อ/ชื่อเล่นแยกเพศ, อาชีพพร้อม sceneId/shift/weekendOff, ที่อยู่อาศัย, กิจวัตร)
│   ├── uiText.ts           # ข้อความ UI ภาษาไทยกลาง (Single Source of Truth ปลอดศัพท์เทคนิค/ไร้อิโมจิ)
│   ├── traits.ts           # ตาราง Trait 3 ชั้น (Temperament Vectors, 3 แกนบุคลิก, 34 Emergent Traits, Turning Points, Gated Actions)
│   ├── lifeStages.ts       # ช่วงวัย 7 ระดับ (infant..senior) + ตัวคูณช่วงอ่อนไหว + กฎอายุและการจ้างงานจาก Spec 03 §2
│   ├── timeAlloc.ts        # ตารางเวลา 168 ชม./สัปดาห์ (รวมหมวด sideGig) มาตรฐานแต่ละช่วงวัย + ลำดับหักพรีเซ็ต + ตัวเลขสมดุล
│   ├── slotHours.ts        # ชั่วโมงต่อช่อง (เช้า 4 / บ่าย 5 / เย็น 4 / ดึก 3), ฐานนอน 8 ชม./วัน, และกฎวันธรรมดา/วันหยุด (Phase 3.2.2)
│   ├── activities.ts       # แคตตาล็อกกิจกรรมหมวดใหญ่ 6 หมวด 23 กิจกรรมย่อย (รวม 5 กิจกรรมปลดล็อกใน 3.2.3) พร้อมฉาก ค่าใช้จ่าย และเงื่อนไขปลดล็อก
│   ├── annualFocus.ts      # นิยามเป้าหมายประจำปี 7 รูปแบบ พร้อมพรีเซ็ตแนะนำและเกณฑ์โบนัส +10% (Phase 3.2.3)
│   ├── lifestylePresets.ts # พรีเซ็ตวิถีชีวิต 12 แบบ (Phase 3.2.1; ปรับเป็นทางลัดเติมกริดใน 3.2.2)
│   ├── lifestyleTemplates.ts # แม่แบบกริดวันธรรมดา/วันหยุดของแต่ละพรีเซ็ตแยกตามช่วงวัย (Phase 3.2.2)
│   ├── skillTraining.ts    # ตารางเกณฑ์ฝึกทักษะแบบขั้นบันได 3 ขั้น, คอร์ส, ตัวคูณความถนัด/Trait/ช่วงวัย (Phase 3.2.1)
│   ├── autopilot.ts        # แผน Autopilot (cautious/balanced/bold), กฎ Standing Orders If-Then, คำสั่งดูแลตัวเอง/ครอบครัวอัตโนมัติ (3.2.3)
│   ├── sceneMeta.ts        # เมตาดาตาเสริมจาก 01_scene_catalog_v2 (group, classTier, sceneTag, regionMode, minAgeEnter, standZone)
│   ├── sceneRules.ts       # Re-export resolveScene / resolveSceneWithMeta ตามลำดับความสำคัญ 01_scene_catalog_v2 §3
│   ├── sceneManifest.json  # เมตาดาตาฉากพิกเซล 21 ฉาก 40 ภาพ 688x384 (ไม่แก้ไข)
│   ├── characterManifest.json # เมตาดาตาตัวละครสำเร็จรูป 332 ตัว v3
│   └── storylets/
│       ├── directorConfig.ts # ตารางค่าคงที่ Director (Cadence, Cooldown, Decision Window 14 วัน, Tension/Attention Budget)
│       ├── plannerStorylets.ts # คลัง Storylet ผูกตาราง 24 ใบ (รวมหมวด system #24, 3.2.3)
│       └── catalog.ts        # คลัง Storylet เขียนมือภาษาไทยรวม 69 ใบ (45 เดิม + 24 ผูกตาราง) ครบ T0-T3 และ Validator ตอนโหลด
├── engine/                 # Pure Deterministic Simulation Core (ไม่ import React หรือ External API)
│   ├── types.ts            # นิยาม Type กลาง (รวม Trait 3 ชั้น, DirectorState, StoryletCategory, PendingEventPrompt, ActiveToast)
│   ├── rng.ts              # Pure state-threaded Mulberry32 PRNG + weightedPick / randNormalApprox
│   ├── appearance.ts       # ระบบเลือกรูปตัวละครตามช่วงวัย/เพศ/อายุ/ความต่อเนื่อง (ใช้ RNG แยกจาก hash)
│   ├── clock.ts            # ปฏิทิน พ.ศ. จริง (อธิกสุรทิน, BASE_MS_PER_DAY = 2000) + วันหยุดราชการ/ปิดเทอมไทย
│   ├── lifeStage.ts        # คำนวณช่วงวัย 7 ระดับ, กฎแรงงาน/สถานบันเทิง Spec 03 §2, และเปลี่ยนผ่านช่วงวัยรายปี
│   ├── evidence.ts         # ตัวนับหลักฐานพฤติกรรมกลาง (recordEvidence, decayEvidenceWeekly, recordJobWeeklyEvidence)
│   ├── traits.ts           # Trait 3 ชั้น (Layer A/B/C), checkTraitFormation, applyTurningPoint, revealTrait, innerTension, explainTrait
│   ├── traitEffects.ts     # ผลกระทบ Trait 4 ทาง (filterAvailableActions, hazardModifiers, autopilotBiases, reputationViews)
│   ├── timeAlloc.ts        # ตัวตรวจสอบ/พรีวิวผลรายสัปดาห์และหักค่าใช้จ่ายกิจกรรมจากกริด (derive จาก planner.grid)
│   ├── planner.ts          # กริดแผนชีวิตเป็นแหล่งความจริงเดียว (deriveWeeklyAllocation, validatePlanner, applyPresetTemplate, getSlotActivity, previewPlannerImpact, migratePlanner)
│   ├── skillTraining.ts    # ระบบฝึกทักษะแบบขั้นบันได 3 ขั้น (0–29, 30–59, 60–100), คอร์สรายสัปดาห์, และ Explain details
│   ├── autopilot.ts        # evaluateStandingOrders, autopilotDecide, resolveAutopilotWithOption, buildPeriodDigest
│   ├── dayPlan.ts          # ตารางประจำวัน 4 ช่อง (buildDayPlan, getDayPlan, getHighlightSlot, กะงาน + กิจกรรมว่าง -> ฉาก, fallbackFrom)
│   ├── scene.ts            # resolveScene, resolveSceneWithMeta, resolveDaypart, isSceneOpen, pickSceneForState, sceneImagePath
│   ├── storylet.ts         # StoryletDef, validateStorylet (ล็อกผู้เยาว์/ฉาก/เพดานเงิน), isStoryletEligible, isTwistPlausible, filterStoryletChoices
│   ├── director.ts         # Event Director 4 แหล่ง + Tension Budget + Foreshadow + Twist + 14-day Decision Window + Attention Budget helper
│   ├── digest.ts           # buildEnhancedDigest / generatePeriodDigestFromStates (Template Pure 100%)
│   ├── explain.ts          # explain(state, targetKey) กลาง รองรับ event:*, timeline:*, index:*, raw:*, res:*, skill:*, trait:*, action_lock:*
│   ├── stats.ts            # สเตตัส 3 ชั้น + สูตรคำนวณ Layer 1 โปร่งใส + explainStat()
│   ├── economy.ts          # เศรษฐกิจพื้นฐาน + ตรวจสิทธิ์งานตามกฎ Spec 03 §2
│   ├── lifegen.ts          # ตัวสร้างชีวิต 3 โหมด + Plausibility Validator + เตรียม Trait 3 ชั้นตั้งต้น
│   ├── log.ts              # Strict Effect Union Applier + StatChangeLog + TimelineEntry
│   ├── pipeline.ts         # ท่อประมวลผล 1 Tick 11 ขั้นตอน (ต่อ Event Director ในขั้น 8) + onWeek/onMonth/onYear + skipToNextMilestone
│   ├── state.ts            # createInitialGameState + dispatchPlayerAction (รวม DISMISS_TOAST, TRIGGER_STORYLET, RESOLVE_AUTOPILOT_PROMPT) + replayGameState
│   └── save.ts             # SaveSlotData serialization + Multi-slot IndexedDB (พร้อม migrate เซฟ Phase 1/2 อัตโนมัติ)
├── ui/
│   ├── theme.ts                # Token สีพาสเทล 6 ดัชนี, หมวด Timeline ครบทุก StoryletCategory
│   ├── art/                    # ระบบภาพเกม Soft Pastel Pixel (shapeRendering="crispEdges", EffectChip รองรับ Storylet, ไร้อิโมจิ 100%)
│   ├── components/
│   │   ├── TopBar.tsx          # HUD แถวเดียว + ปุ่ม "เรียกเหตุการณ์ทดสอบ (Dev)" เลือก Storylet ได้ทันที
│   │   ├── SceneStage.tsx      # ฉากพิกเซล 21 ฉาก + Avatar + บอลลูนคำพูดขอบบน + ตัวเลขลอย
│   │   ├── SixIndicesBar.tsx   # เงินสด/หนี้ + กริดดัชนี 3x2 คลิกเปิด Bottom Sheet
│   │   ├── TimeControls.tsx    # ปุ่มเล่น/หยุด + ความเร็ว x1..x20 + ปุ่มข้ามเดือน/ปี/เหตุการณ์สำคัญ
│   │   ├── CelebrationToast.tsx# ป๊อปอัปวันเกิด ผลลัพธ์ และ Storylet T1 แบบไม่หยุดเวลา พร้อมปุ่ม "ทำไม?"
│   │   ├── ExplainPanel.tsx    # Bottom Sheet "ทำไมถึงเกิดเรื่องนี้?" / "ทำไมถึงเป็นแบบนี้?"
│   │   ├── TimeAllocPanel.tsx  # มุมมองอ่านอย่างเดียว "ดูเป็นชั่วโมง" แปลงตรงจากกริดตารางแผนชีวิต (ห้ามแก้แยก)
│   │   ├── LifePlannerPanel.tsx# ตารางแผนชีวิต 2 คอลัมน์ x 4 ช่อง + แถบทางลัด + แผ่นเลือกกิจกรรมด้านล่าง + พรีวิวสด (Phase 3.2.2)
│   │   ├── StandingOrdersPanel.tsx # ตั้งค่า Autopilot, RiskProfile, นโยบายการเงิน, กฎ If-Then
│   │   ├── ChoiceCard.tsx      # การ์ดเหตุการณ์ (ภาพฉากจาก resolveScene, ป้าย Tier/Twist, หน้าต่าง 14 วัน, ปุ่ม Explain, ปุ่ม Autopilot ข้าม T2)
│   │   ├── TimelineFeed.tsx    # ฟีดเรื่องราวล่าสุด + ป้าย Tier + ปุ่ม "ทำไม?"
│   │   ├── SaveLoadModal.tsx   # จัดการ IndexedDB 4 ช่อง
│   │   └── tabs/               # MeTab, WorkStudyTab, RelationshipsTab, FinanceTab, JournalTab
│   └── screens/
│       ├── LifeGenScreen.tsx   # Wizard 3 ขั้นตอน + แกลเลอรีเลือกตัวละคร
│       └── MainGameScreen.tsx  # Fixed-timestep Accumulator Loop + Attention Budget x20 + บังคับ T3 เหลือ x1 + 5-Tab Bottom Bar
└── tests/
    ├── runTests.ts             # Unit tests 21 ชุด (รวม Phase 3 และความสอดคล้องข้าม Phase)
    ├── phase321Tests.ts        # Unit tests Phase 3.2.1 (พรีเซ็ต, งานเสริมผู้เยาว์, ทักษะขั้นบันได)
    ├── phase322Tests.ts        # Unit tests Phase 3.2.2 (ตารางแผนชีวิตกริด, กฎอายุ, เงินไม่พอสลับฟรี, x1 vs x20, migration 3.2.1)
    ├── phase323Tests.ts        # Unit tests Phase 3.2.3 (69 Storylets, เป้าหมายประจำปี, 5 กิจกรรมปลดล็อก+ล็อกคืน, ปฏิทิน, ดูแลตัวเอง, x1 vs x20)
    ├── sim1000.ts              # Headless 1,000-life simulator
    └── checkEmoji.ts           # สคริปต์ตรวจจับอิโมจิใน src/ui และ src/data (บังคับ 0 อิโมจิ)
```

---

## 4. แผน Phase ทั้งหมด

- **Phase 1**: โครงโปรเจกต์ + ระบบเวลา (1 Tick = 1 วัน, x1..x20, Accumulator, 11-Step Pipeline, Auto-Pause) + สเตตัส 3 ชั้น + Explain Panel + เศรษฐกิจพื้นฐาน + ตัวสร้างชีวิต 3 โหมด + Save/Load IndexedDB + Unit Test & Simulator 1,000 ชีวิต
- **Phase 1.5**: แก้บั๊กเวลาหยุดค้างหลังตอบเหตุการณ์ + รองรับวัยทารก/เด็กตั้งแต่อายุ 0 ปี + รื้อ UI เป็นเกมเวกเตอร์สดใส (Mobile-first, SVG Art System 7 ชิ้น, ไร้อิโมจิ 100%, Bottom Sheet Explain, Wizard 3 ขั้นตอน)
- **Phase 1.6**: เปลี่ยนภาพตัวละครจาก Avatar SVG เป็นตัวละครสำเร็จรูป PNG 332 ตัว (`CharacterSprite` + `appearance.ts` แยก RNG + เปลี่ยนตามช่วงวัยอัตโนมัติ)
- **Phase 1.7**: ปรับสไตล์ UI ทั้งเกมเป็น Soft Pastel Pixel-Inspired ให้เข้ากับตัวละครจิบิพิกเซล (หน้าต่างเบเวลพาสเทล, ไอคอนพิกเซลทำเอง, สมุดไดอารี่สันห่วง, แมว/ปีก/ดาวพิกเซลตกแต่ง, ไม่เพิ่ม dependency, ไร้อิโมจิ 100%)
- **Phase 1.8**: เปลี่ยนฉากจาก SVG เป็นภาพพิกเซล (21 ฉาก 40 ภาพ 688x384, Day/Night Pairs, Availability Gate, ระบบ daypart 4 ช่วง, Fallback SVG, ย้ายกล่องคำพูดขึ้นขอบบน, หน้าดีบัก ?debug=scenes)
- **Phase 2**: ระบบ Trait 3 ชั้น (อารมณ์พื้นฐาน, บุคลิกภาพต่อเนื่อง, Trait งอกจากหลักฐาน) + ช่วงวัย + ระบบ Autopilot
- **Phase 3**: Storylet Engine + Event Director + ระบบ Digest สรุปรายสัปดาห์/เดือน/ปี + ลางบอกเหตุ
- **Phase 3.1**: รวมหน้าตาเหตุการณ์ให้เป็นมาตรฐานเดียว (Unified Decision Card) + เปลี่ยนศัพท์เทคนิคเป็นภาษาคนทั่วไป (`src/data/uiText.ts`) + กฎ T3 บังคับเลือกเองไร้ Deadline + แผนท่อสมัครงาน/เรียน/ทุนส่วนกลางแทรกก่อน Phase 4
- **Phase 3.2**: ตารางประจำวัน `DayPlan` 4 ช่อง (เช้า/บ่าย/เย็น/ดึก) + เลือกฉากตามกิจกรรมและกะงาน + แสดง 4 ช่วงในหน้าหลัก/ปุ่มกดดูตอนหยุดเวลา/แถบควบคุมเวลาติดขอบจอมือถือ (`docs/specs/04_schedule_and_scene_of_day.md`)
- **Phase 3.2.1**: ยุบ `routine` เป็นพรีเซ็ตวิถีชีวิต 12 แบบขับเคลื่อนตารางเวลา 168 ชม. + อุดช่องโหว่งานเสริมผู้เยาว์/โอที + ระบบฝึกทักษะแบบขั้นบันได 3 ขั้น (`docs/specs/05_lifestyle_and_training.md`)
- **Phase 3.2.2**: ตารางแผนชีวิตแบบกริด 2x4 (`วันธรรมดา/วันหยุด` x `เช้า/บ่าย/เย็น/ดึก`) เป็นแหล่งความจริงเดียว + แคตตาล็อกกิจกรรมหมวดใหญ่-ย่อย + พรีเซ็ตเป็นแม่แบบเติมกริด (`docs/specs/06_life_planner.md` ข้อ 0–8)
- **Phase 3.2.3 (เสร็จสมบูรณ์)**: เป้าหมายประจำปี (`Annual Focus`), ปฏิทินรายปีอ่านอย่างเดียว+ปักหมุด, กิจกรรมปลดล็อกได้ 5 รายการ, ตัวนับความต่อเนื่อง, Autopilot ดูแลตัวเอง/ครอบครัวอัตโนมัติ, และ Storylet ผูกตาราง 24 ใบ (คลังรวม **69 ใบ**)
- **Phase 3.3**: ทักษะและการศึกษาไทย (เรียนสายอาชีพ ปวช./ปวส., สอบเข้า/แอดมิชชันมหาลัย, ทุนการศึกษา, พัก/ลาออกจากการเรียน)
- **Phase 3.4**: อาชีพและท่อสมัครงาน (ท่อสมัครงาน/สัมภาษณ์/ผ่านไม่ผ่านส่วนกลาง, สมัครงานเสริมจริง `SideGigRecord`, `internship` ฝึกงาน, โปรบาชัน/เลื่อนขั้น)
- **Phase 3.5**: สายบันเทิง/ไอดอล และสายเทา/ใต้ดิน (ดารา/นักร้อง/อินฟลูเอนเซอร์และรายได้สตรีมเมอร์เต็มระบบ, งานเสี่ยงกฎหมาย/กึ่งผิดกฎหมาย 18+)
- **Phase 3.6**: Instant Scene Actions แบบ BitLife (เมนูการกระทำทันทีในแต่ละฉาก, ของใช้และพาหนะ, ร้านทำผม/ตู้เสื้อผ้า)
- **Phase 4**: ระบบ NPC (LOD 3 ระดับ, Utility AI, Memory จาง/คืนดีได้, Fog of Knowledge) + ความรัก + ครอบครัว (และระบบเลี้ยงดูบุตรเต็มรูปแบบรองรับ `raise_child`)
- **Phase 5**: เชื่อมต่อ AI (Structured Output + Engine Validator + Deterministic Fallback)
- **Phase 6**: คอนเทนต์ไทยเชิงลึก + คลัง Twist + ปุ่มปรับโทน 3 ปุ่มอิสระ
- **Phase 7**: เศรษฐกิจ-องค์กร-สุขภาพเชิงลึก + ระบบ Legacy (ทายาท/ชีวิตถัดไป) + Simulator 10,000 ชีวิต

---

## 5. สถานะ Phase

- **Phase 1**: เสร็จสมบูรณ์
- **Phase 1.5**: เสร็จสมบูรณ์
  - **สิ่งที่ทำแล้ว**:
    - **Part A (แก้บั๊กใน Engine/UI)**:
      - **A1 (เวลาเดินต่ออัตโนมัติ)**: เก็บ `lastActiveSpeed` (ค่าเริ่มต้น `1`) และ `pauseReason` (`initial | manual | prompt | dead`) เมื่อผู้เล่นตอบ `RESOLVE_PROMPT` แล้วตัวละครยังมีชีวิต เกมจะกลับไปเดินเวลาต่อที่ความเร็วเดิมอัตโนมัติ พร้อมป๊อปอัปผลสั้นๆ แบบไม่หยุดเวลา และแสดงแถบ "เวลาหยุดอยู่" + ปุ่ม "เล่นต่อ" ชัดเจนเมื่อผู้เล่นกดหยุดเอง
      - **A2 (อายุเริ่มต้น 0 ปี และเศรษฐกิจวัยเด็ก)**: โหมดสุ่มตั้งค่าเริ่มต้นเป็นเกิดใหม่ (0 ปี) พร้อมตัวเลือก `เกิดใหม่ / 6 ขวบ / 12 ขวบ / วัยรุ่นตอนปลาย (15–20 ปี)`; โหมดตั้งค่าเองเพิ่ม `startingAge` (0–65); เพิ่มอาชีพ `infant` (0–5 ปี); เด็กอายุ `< 15` มีเงินสด/หนี้/รายจ่ายส่วนตัวเป็น 0 โดยพ่อแม่ดูแลทั้งหมด ปิดการสมัครงาน/ย้ายบ้าน (`< 15`), ฝึกสกิล (`< 6`), กู้เงิน (`< 18`) และผู้เยาว์ `< 18` ที่อยู่ `parents_home` ไม่เสียค่ากิน/ค่าเช่า ทำให้รัน 200 seeds ตั้งแต่อายุ 0 ถึง 18 ปีไม่เกิดหนี้ผิดปกติ
    - **Part B (รื้อ UI เป็นเกมเวกเตอร์สดใส Mobile-First)**:
      - ระบบธีมเกม: พื้นครีมอุ่น `#FFF8EC` (สว่างเป็นค่าเริ่มต้น) / อินดิโก้ `#1B1535` (กลางคืน), การ์ดขอบม่วงเข้ม `2px solid #2B2250` มุมโค้ง `20px` เงาแข็ง `0 4px 0`, ฟอนต์ `Kanit` + `Noto Sans Thai`
      - สร้าง `src/ui/art/` ครบ 7 ชิ้น (`Avatar`, `SceneArt`, `MoodFace`, `IndexIcon`, `EventArt`, `Celebration`, `EffectChip`) ด้วย SVG แบบ Unified + `@phosphor-icons/react` (duotone)
      - ไร้อิโมจิ 100% ใน `src/ui` และ `src/data` พร้อมสคริปต์ `npm run check:emoji` ตรวจสอบอัตโนมัติ
      - LifeGen Wizard 3 ขั้นตอน, Bottom Sheet `"ทำไมถึงเป็นแบบนี้?"` (ซ่อนเป็นค่าเริ่มต้น + พับสูตรละเอียด), Game Juice (ตัวเลขลอย, หลอดสั่นเมื่อดัชนีตกแรง, ป๊อปอัปวันเกิดไม่หยุดเวลา, การ์ดสรุปชีวิตตอนจบ, สวิตช์ปิดเอฟเฟกต์ + `prefers-reduced-motion`)
  - **ส่วนที่ยังเป็น Stub / TODO สำหรับ Phase ถัดไป**:
    - `stepWorld` ใน `src/engine/pipeline.ts`: Stub สำหรับเศรษฐกิจมหภาค/ข่าวสังคม (Phase 6/7)
    - `stepNPCs` และแท็บ `คน`: Stub แสดงครอบครัวตั้งต้น ยังไม่มี NPC LOD/Utility AI (Phase 4)
    - `stepEventDirector`: มี Demo Prompts 2 เหตุการณ์สำหรับอายุ 15+ ยังไม่มีคลัง Storylet เต็มรูปแบบหรือ Storylet วัยเด็ก (Phase 3/6)
    - `stepAutopilot`: Stub สำหรับ Autopilot ตาม Trait (Phase 2)
    - `onWeek`: Hook พร้อมสำหรับ Digest รายสัปดาห์ (Phase 3)
    - ระบบ Trait 3 ชั้น: เก็บเฉพาะ `temperament:*` ใน `character.traits` (Phase 2)
    - ระบบ AI และปุ่มปรับโทน 3 ปุ่ม: ยังไม่ได้เชื่อมต่อ (Phase 5/6)
- **Phase 1.6**: เสร็จสมบูรณ์ (รวมรอบตรวจสอบภาพ 332 ตัว, กฎความต่อเนื่อง v2 และ Manifest v3 ช่วงอายุ/จัดกึ่งกลาง/แท็กบริบท)
  - **Appearance Schema & Manifest v3**:
    - `character.appearance?: { charId: string; stage: 'baby' | 'kid' | 'adult' | 'elder' }` (optional เพื่อรองรับเซฟเก่าที่ไม่มีฟิลด์ โดยจะสร้างให้ตอนโหลดเซฟ) และบันทึก `appearance` ลง `TimelineEntry` เมื่อเริ่มชีวิตและเมื่อเปลี่ยนช่วงวัย/พ้นช่วง `ageRange`
    - ตรวจสอบภาพทั้ง 332 ตัวจาก Contact Sheet และวิเคราะห์พิกัดใบหน้าอัตโนมัติ:
      - เพิ่ม `ageRange: [minAge, maxAge]` รายตัวสำหรับทั้ง 332 ตัว (แยกหน้าวัยรุ่น/วัยเรียน 16–24, วัยทำงาน 20–40, และวัยผู้ใหญ่มีอายุ 35–59 ออกจากกันอย่างชัดเจน เพื่อให้ตัวละครอายุ 16 ไม่มีทางสุ่มได้หน้าตาดูมีอายุ 35–55)
      - เพิ่ม `bustFocus: { x, y, zoom }` ที่คำนวณจากพิกัดใบหน้าจริงของ PNG ทุกไฟล์ เพื่อแก้ปัญหาภาพทารกหรือตัวละครที่มีหมวก/หนวดแมลง/พร็อพข้างลำตัวตกขอบหรือเบี้ยวในกรอบวงกลม `bust`
      - เพิ่มแท็กบุคลิก รูปร่าง ไทป์ตัวละคร ฐานะ และภูมิภาคครบชุด (`cute`, `cheerful`, `pretty`, `haughty`, `handsome`, `bad_boy`, `quiet`, `strict`, `kind`, `nerdy`, `gamer`, `artistic`, `sporty`, `rebellious`, `chubby`, `muscular`, `sia`, `sugar_daddy`, `sugar_mommy`, `jae`, `sor`, `khun_nai`, `khun_nu`, `uncle`, `aunt`, `luxury`, `middle_class`, `humble`, `street_working`, `isaan_vibe`, `north_vibe`, `south_vibe`, `central_bkk`, `thai_traditional`, `chinese_thai`) พร้อมแท็กความต่อเนื่อง (`eyeShape`, `eyeColor`, `dyed_hair`, `mature_gray`, `natural_blonde`, `natural_red`, `luk_kreung`)
  - **กติกา Stage / อายุรายตัว / เพศ / สีผม / บริบทชีวิต**:
    - ช่วงวัยตามอายุ: `0–3 = baby`, `4–15 = kid`, `16–59 = adult` (รวมพูล `male + female`), `60+ = elder`
    - ล็อกใน Engine: อายุ `0–15` ใช้ได้เฉพาะกลุ่ม `baby`/`kid`, อายุ `60+` ใช้ได้เฉพาะ `elder`, และทุกอายุต้องผ่าน `entry.ageRange` รายตัวเสมอ
    - **รีเฟรชหน้าตาเมื่อโตพ้น `ageRange` (`onYear`)**: แม้ยังอยู่ใน stage `adult` เช่นกัน (เช่น อายุ 16 -> 20 ที่หมดวัยชุดนักเรียน หรือ 25 -> 40 ที่โตเป็นผู้ใหญ่เต็มตัว) `pipeline.ts` จะตรวจ `isAppearanceValidForAge` ทุกวันเกิด หากพ้น `ageRange` จะเปลี่ยน Sprite ใหม่อัตโนมัติโดยยังคงความต่อเนื่องของสีผิว สีผม และทรงตาเดิม
    - กรองเพศจากฟิลด์ `gender` ใน manifest (`m`/`f` -> ตรงเพศก่อน, พูลเล็กค่อยรวม `n`, ยังเล็กค่อยเปิดทั้งหมด; `nonbinary` ใช้ได้ทุกตัว)
    - **ให้คะแนนตามบริบทชีวิต (`AppearanceContext`)**: ประเมินความสอดคล้องกับ `familyWealth`, `isOrphan`, `region`, `temperament`, `jobId`, `traits`, `skills.tech` (เช่น เด็กกำพร้า/ฐานะขัดสนหลีกเลี่ยงชุด `luxury`, ภาคอีสานได้น้ำหนัก `isaan_vibe`, บ้านมั่งคั่ง + อารมณ์ร่าเริงได้ `luxury + cheerful`, สายเทค/เกมได้ `gamer/nerdy`) โดยระหว่างโตขึ้นจะถ่วงน้ำหนักบริบทไว้ที่ `0.65x` เพื่อไม่ให้สำคัญกว่าความต่อเนื่องทางชีวภาพ
    - แท็ก `student_uniform` / `school_uniform` ใช้ได้เฉพาะอายุ `16–19` เท่านั้น (อายุ 20+ และต่ำกว่า 16 จะไม่ถูกเลือก)
    - **กฎสีผมธรรมชาติและผมย้อม**:
      - ผมเทา/ขาว เป็นสีผมธรรมชาติของวัยชรา (`60+`) เท่านั้น (ยกเว้นเริ่มเล่นช่วง `45–59` โดยตรงที่อนุญาต `mature_gray`)
      - ตัวละคร `< 60` ที่มีผมเทา/ขาว หรือผมสีแฟนซี (`pink`, `blue`, `purple`, `teal/green`, `multicolor`) และแท็ก `dyed_hair` จะ **ไม่ถูกสุ่มให้ตั้งแต่เกิดหรือตอนโตขึ้นอัตโนมัติ** สงวนไว้ให้ผู้เล่นเลือก `"ไปย้อมผม / เปลี่ยนสไตล์"` ใน Phase ถัดไป (`allowDyed: true`)
      - ลูกครึ่งผมบลอนด์/แดง/ตาฟ้า (`luk_kreung`, `natural_blonde`, `natural_red`) ถูกแท็กแยกเพื่อให้คงความต่อเนื่องตั้งแต่วัยทารกจนถึงวัยผู้ใหญ่
  - **RNG แยกต่างหาก**: `pickAppearance` ใช้ RNG ที่สร้างจาก `hash(seed, "appearance", ageBand)` (`baby | kid | teen | young_adult | mid_adult | mature_adult | elder`) เท่านั้น ไม่แตะ `GameState.rngState` หลัก เพื่อรักษาผลจำลองเดิม (`x1` vs `x20`, `sim1000`, Replay) ให้ตรงกัน 100%
  - **UI และฟอนต์**: `CharacterSprite.tsx` (`full` สูง `h * (size / 340)` วางเท้าติดพื้นฉาก, `bust` กรอบวงกลมขอบ `2px #2B2250` จัดตำแหน่งใบหน้าตรงกลางด้วย `bustFocus` + `maxWidth: 'none'` + clamp กันขอบแหว่ง, fallback เป็น SVG `Avatar` เมื่อไม่พบรูป), ปุ่ม `"ลองหน้าตาใหม่"` ใน `LifeGenScreen` (เก็บใน `LifeGenRequest.appearanceOverride`), แถวภาพพัฒนาการตามช่วงวัยในหน้าสรุปชีวิตตอนจบ และเพิ่มฟอนต์ Google Fonts `Pixelify Sans` สำหรับตัวอักษรภาษาอังกฤษโดยคงฟอนต์ไทย (`Kanit` + `Noto Sans Thai`) ไว้คงเดิม
  - **ข้อจำกัดของภาพสำเร็จรูป (หมายเหตุ)**: ภาพตัวละครทั้ง 332 ตัวเป็นไฟล์ PNG เต็มตัวแบบภาพเดี่ยว (ไม่ได้แยกเลเยอร์ตา/ปาก/จมูกอิสระ) ระบบจึงคุมความต่อเนื่องในระดับ `skinTone`, `hairColor`, `eyeShape`, `eyeColor`, `ageRange` และ `luk_kreung` ให้ตรงที่สุดในชุดภาพที่มี
  - **TODO สำหรับ Phase ถัดไป**:
    - Phase 4: ให้ NPC และสมาชิกครอบครัวใช้ Sprite ตัวละครจาก manifest ด้วย (คัดเลือกตามช่วงอายุ ฐานะ นิสัย และบทบาท NPC เช่น `sia`, `jae`, `sor`, `sugar_daddy`, `sugar_mommy` จากแท็กที่มีอยู่แล้วใน Manifest v3)
    - ตัวเลือกในเกม `"ไปย้อมผม / เปลี่ยนสไตล์ / แต่งตัว"` ด้วยเงินในเกม (ปลดล็อกพูล `dyed_hair` ผ่าน `allowDyed: true`)
    - อัปเกรดฉากพื้นหลัง (`SceneArt`) เป็นภาพประกอบเต็มฉาก
- **Phase 1.7**: เสร็จสมบูรณ์
  - **สไตล์ UI (Soft Pastel Pixel-Inspired)**:
    - ใช้พาเลตสีพาสเทลนุ่มตา (`#FDF4F8` วอลเปเปอร์ลายตารางหมากรุกสตรอว์เบอร์รี-ลาเวนเดอร์, โหมดกลางคืน `#1E1833`, เส้นขอบโคโค่-พลัม `#4E3B69` / `#7662AC`) พร้อมกรอบมุมพิกเซลขั้นบันไดแท้ (Stepped-Pixel Corners) + ขอบไฮไลต์ด้านบนและเงาตกกระทบเบาๆ (`.game-card`, `.px-window`, `.px-slot`, `.px-inset`, `.game-btn`, `.px-progress-track`), พื้นหลังลายทางพาสเทล `.px-window-striped`
    - วาดชุดไอคอนพิกเซลแท้ขนาด 24x24 ที่อ่านชัดเจนทุกหมวดหมู่ (`shapeRendering="crispEdges"`, ไม่เพิ่ม dependency) ทั้ง 6 ดัชนีหลัก (`IndexIcon`: หัวใจ+บวก, หัวใจติดปีก, เหรียญ ฿, บอลลูนแชท+หัวใจ, มงกุฎประดับอัญมณี, หลอดไฟสว่าง), `MoodFace`, และ `PixelIcon` ครบทุกแท็บ/ปุ่ม พร้อมกิมมิคตกแต่ง (`PixelCatMascot`, `PixelWing`, `PixelCornerStar`) โดยหยุดอัตโนมัติเมื่อเปิด `reduceFx` หรือ `prefers-reduced-motion`
    - **แยกพูลทารกตามพัฒนาการจริง**: อายุ `0–1` ปีใช้เฉพาะพูลทารกในห่อผ้า (`swaddled`, `ageRange: [0, 1]`, ไม่แยกเพศ `gender: "n"`) และอายุ `2–3` ปีเปลี่ยนเข้าสู่พูลวัยเตาะแตะที่ไม่ได้ห่อผ้า (`toddler`, `ageRange: [2, 3]`) โดยยังรักษาความต่อเนื่องของสีผิว/สีผมข้ามช่วง `1 -> 2`
    - **แกลเลอรีเลือกตัวละครก่อนเริ่มชีวิต (Pre-Start Character Selection Gallery)**: เพิ่มหน้าต่าง `CharacterGalleryModal` ให้เลือกตัวละครที่เข้ากับเพศ ช่วงอายุ และภูมิภาค/จังหวัด (`ตรงถิ่น`) ในโหมด `custom` และ `at_age` พร้อมสกัดคุณลักษณะภาพให้อัตโนมัติเป็นภาษาไทย (**สีผิว**, **สีตา**, **สีผมแรกเริ่ม** และแท็กบุคลิก) แสดงใน Step 2, Step 3 Passport และแท็บตัวตน (`MeTab`)
    - คงกฎเหล็กครบถ้วน: ไม่แตะสมการ/RNG ของ GameState, ใช้ RNG แยกสำหรับหน้าตาตัวละครเหมือนเดิม, ไร้อิโมจิ 100%, เทสต์และ Simulator ผ่านครบ
- **Phase 1.8**: เสร็จสมบูรณ์ (เปลี่ยนฉากเป็นภาพพิกเซล 21 ฉาก 40 ภาพ 688x384, Day/Night Pairs, Availability Gate, Fallback SVG, ย้ายกล่องคำพูดขึ้นขอบบน, หน้าดีบัก ?debug=scenes)
  - **กติกา Path และเมตาดาตา**:
    - เก็บไฟล์ภาพจริงที่ `public/assets/scenes/{sceneId}/day.png` และ `night.png` (เสิร์ฟผ่าน `import.meta.env.BASE_URL + 'assets/' + fileRel`)
    - เมตาดาตาหลักอยู่ที่ `src/data/sceneManifest.json` (21 ฉาก, 40 ภาพ, ขนาด 688x384 อัตราส่วน 16:9, day/night image mapping, availability, housing tenures, tags, flags)
    - นิยามชนิดข้อมูล TypeScript อยู่ใน `src/engine/scene.ts` (`SceneEntry`, `SceneManifest`, `Daypart`, `SceneAvailability`, `SceneHousing`, `SceneSettings`)
  - **กติกา Daypart -> ภาพ**:
    - `resolveDaypart(state)`: Pure function คืน `morning | afternoon | evening | night`
    - ลำดับความสำคัญ: 1) เหตุการณ์/Prompt (stub สำหรับ Phase 3), 2) กะงาน (stub สำหรับ Phase 03), 3) กิจวัตรกลางคืนเด่น (stub สำหรับ Phase 03), 4) ค่าเริ่มต้นสลับตามวัน (deterministic)
    - การจับคู่ภาพ: morning/afternoon = `day.png`, evening/night = `night.png` (ฉากที่มีเฉพาะกลางคืน เช่น `street_food_night`, `nightlife_pub` คืน `night.png` ทุกช่วง)
  - **กติกา Availability Gate (`isSceneOpen`)**:
    - ฉากกลุ่มบ้าน (`home_*`) เป็นที่พักอาศัย เปิดตลอด 24/7 ทุก daypart
    - `nightlife_pub`: ล็อกผู้เยาว์ (< 18) ใน Engine ถาวร, ผู้เข้าใช้บริการต้องอายุ >= `pubVisitAge` (ค่าเริ่มต้น 20 ปรับเป็น 18 ได้), เปิดเฉพาะ `evening` และ `night`
    - `street_food_night`: เปิดเฉพาะ `evening` และ `night`
    - `hospital`: เปิด 24 ชม. ทุก daypart
    - `school_*`: เปิดเฉพาะ `morning` และ `afternoon`
  - **Fallback SVG เดิม & UI Integration**:
    - เก็บ SVG เดิมไว้เป็น `FallbackSceneSvg` ใน `src/ui/art/SceneArt.tsx` โดยจะสลับมาแสดงอัตโนมัติเมื่อรูปภาพโหลดไม่สำเร็จ พร้อมแจ้ง `console.warn`
    - เปลี่ยน day <-> night ด้วย crossfade ~400ms (`motion.img` opacity transition) พร้อม preload ภาพคู่ล่วงหน้า
    - ตัวละครวางเท้าบนเส้นพื้น `DEFAULT_GROUND_LINE_Y_RATIO = 0.88` (88% จากขอบบน = 12% จากขอบล่าง) สอดคล้องกับเส้นพื้นของภาพ 688x384
    - ย้ายกล่องคำพูดไปขอบบน (`top-2.5 left-2.5`) พร้อมปุ่มย่อ/ขยาย ไม่บังตัวอาคารหลักที่อยู่ฝั่งขวา
    - รองรับการเปิดหน้าดีบักผ่าน URL `?debug=scenes` หรือปุ่มในเมนู
  - **ที่เก็บเอกสารสเปก**:
    - `docs/specs/02_housing_system.md`
    - `docs/specs/03_jobs_nightlife_daypart.md`
    - *หมายเหตุ*: ไฟล์ `01_scene_catalog_v2.md` ยังไม่มีการแนบในรอบนี้ ให้ใช้ 02, 03 และ `sceneManifest.json` เป็นแหล่งอ้างอิง
  - **รายการความต่างจากการเทียบในข้อ 1.5**:
    1. รายการ tenure ของฉากบ้านทั้ง 7 แบบใน `sceneManifest.json` ตรงกับตารางข้อ 2 ของ `02_housing_system.md` ครบถ้วน 100%
    2. เวลาเปิด-ปิดและ daypart ของทุกฉากใน manifest ตรงกับตารางข้อ 3 ของ `03_jobs_nightlife_daypart.md`
    3. ในเอกสาร 03 ระบุชื่อแบบรวมว่า `school_*` (07:00-17:00) แต่ใน `sceneManifest.json` แตกย่อยเป็น 3 ฉากจริง: `school_public`, `school_temple`, `school_international` โดยตั้งเวลาเปิด-ปิดตรงกันทั้ง 3 ฉาก
    4. มี 2 ฉากที่มีเฉพาะภาพกลางคืน (`night_only`): `street_food_night` และ `nightlife_pub`
    5. Flag `brand` ใน `street_shops`: มีป้ายคล้ายแบรนด์จริง (7-Eleven) มีการเตือนผ่าน `console.warn` ในโหมด dev ตามสเปก
  - **รายการ TODO ที่รอ Phase ถัดไป**:
    - รอ Phase ระบบที่อยู่อาศัย (02): นำข้อมูล Dwelling จริงมาแทน placeholder ใน `pickHomeSceneForState`
    - รอ Phase Storylet/Event Director (Phase 3): ระบุ daypart เฉพาะกิจในเหตุการณ์ และเติมคลัง Storylet เชื่อมกับ `applyTurningPoint` / `revealTrait`
    - **หมายเหตุไฟล์สเปก**: ไฟล์ `01_scene_catalog_v2.md` ยังไม่มีในระบบ จึงอ้างอิงจาก `02_housing_system.md`, `03_jobs_nightlife_daypart.md` และ `src/data/sceneManifest.json` เป็นหลัก
- **Phase 2**: เสร็จสมบูรณ์ (Trait 3 ชั้น + Evidence Counters + ช่วงวัย 7 ระดับ + Time Allocation 168 ชม. + Autopilot & Standing Orders + Period Digest)
  - **ระบบ Trait 3 ชั้น (`src/engine/traits.ts`, `src/data/traits.ts`)**:
    - **ชั้น A (Temperament)**: มิติอารมณ์พื้นฐาน 4 ด้าน (`energy`, `positivity`, `sensitivity`, `obsessiveness`) เปลี่ยนช้ามากปีละไม่เกิน `0.15`
    - **ชั้น B (Continuous Personality)**: แกนต่อเนื่อง 3 แกน (`ambition`, `agreeableness`, `stability`) ปรับตาม Trait และ RNG แบบกำหนดได้ ไม่เกิน `1.5/ปี`
    - **ชั้น C (Emergent Traits — 34 นิสัย)**: ใช้ภาษาไทยทั่วไปปลอดศัพท์คลินิก มีเกณฑ์ Layer A/B + หลักฐานพฤติกรรม, ตัวคูณช่วงวัยอ่อนไหว (`school_kid` / `teen` ก่อตัวไวกว่า `senior`), ระดับความเข้ม (`subtle` / `clear` / `core`), ค่าความขัดแย้งภายใน (`conflictsWith` -> `innerTension`), เส้นทางฟื้นฟู (`recoveryPathTh` + `recoveryEvidenceKey`), การซ่อนจากเจ้าตัว (`hidden_to_self` ปิดชื่อจริงใน UI/Explain จนกว่าจะถูกเปิดเผยผ่าน `revealTrait`), และ `applyTurningPoint` ที่ข้ามเกณฑ์ปกติได้ทันทีพร้อมบันทึก `originStory`
  - **ผลกระทบจริงของ Trait 4 ทาง (`src/engine/traitEffects.ts`)**:
    1. ล็อก/เปิดทางเลือก (`filterAvailableActions` + ปลดล็อกด้วยทักษะ เช่น `self_doubting` ปิดการขึ้นเวทีจนกว่าทักษะเข้าสังคมถึง 25)
    2. ปรับโอกาสเสี่ยงและอายุขัย (`hazardModifiers` เชื่อมเข้า `stepHazards` ใน `pipeline.ts`)
    3. กำหนดน้ำหนักตัดสินใจของ Autopilot (`getAutopilotTraitBiases`)
    4. ปรับภาพลักษณ์ที่ 4 กลุ่มสังคมมองเรา (`reputationView`: `family`, `friends`, `work`, `community`) เตรียมพร้อมสำหรับ Phase 4
  - **ตัวนับหลักฐานพฤติกรรม (`src/engine/evidence.ts`)**:
    - API กลาง `recordEvidence` / `recordEvidenceBatch`, ระบบจางลงช้าๆ รายสัปดาห์ (`decayEvidenceWeekly`), เชื่อม Effect `RecordEvidence`, การฝึกทักษะ, ตารางเวลา, กิจวัตร และจุดเตรียมงานสายอาชีพจาก Spec 03 §8 (`JOB_EVIDENCE_PREP`)
  - **ช่วงวัย 7 ระดับ & กฎอายุ Spec 03 §2 (`src/engine/lifeStage.ts`, `src/data/lifeStages.ts`)**:
    - `newborn (0-1)` -> `toddler (2-3)` -> `school_kid (4-12)` -> `teen (13-17)` -> `young_adult (18-34)` -> `mid_adult (35-59)` -> `senior (60+)`
    - กฎอายุ Spec 03 §2: ต่ำกว่า 15 ห้ามทำงานรับจ้าง; 15–17 ทำพาร์ตไทม์รวมไม่เกิน 48 ชม./สัปดาห์ ห้ามกะดึก (22:00–06:00) และห้ามทำงาน/เข้าสถานบันเทิง; 18+ เปิดผู้ใหญ่เต็มตัว; เข้าใช้บริการผับอ่านจาก `settings.pubVisitAge` (ค่าเริ่มต้น 20 ปรับเป็น 18 ได้จากเมนูตั้งค่า)
  - **ตารางเวลา 168 ชม./สัปดาห์ (`src/engine/timeAlloc.ts`, `src/data/timeAlloc.ts`)**:
    - บังคับผลรวม `168 ชม.`, เวลาขั้นต่ำในการนอนแต่ละช่วงวัย, ล็อกผู้เยาว์ `nightlife = 0` และชั่วโมงงาน/เรียนไม่เกิน `48 ชม.`, พรีวิวผลรายวัน/รายสัปดาห์, หักค่าใช้จ่าย/เพิ่มค่าล่วงเวลา/เพิ่มทักษะ/สะสมหลักฐาน, และเชื่อม `getDominantNightDaypart` เข้า `resolveDaypart(state)` เมื่อผู้ใหญ่จัดกิจกรรมกลางคืนเด่น
  - **Autopilot, Standing Orders & Basic Digest (`src/engine/autopilot.ts`, `src/data/autopilot.ts`)**:
    - แผนความเสี่ยง (`cautious / balanced / bold`), นโยบายการเงิน (`minSavingsRatePct`, `lowCashThreshold`, `avoidDebt`, `strictBudget`), กฎ `If-Then`
    - เชื่อม `stepAutopilot` ใน `pipeline.ts`: เมื่อไม่มีกฎรองรับหรือกฎตั้งค่าให้ถามผู้เล่น จะหยุดเวลา (`needsPlayer = true`) และเปิดการ์ดถามผู้เล่น
    - `skipToNextMilestone(state, 'month' | 'year' | 'milestone')` สร้าง `PeriodDigest` แบบ Template Pure 100% (ไม่มี AI) สรุป Trait ใหม่ เหตุการณ์ Autopilot จุดเปลี่ยน และความเปลี่ยนแปลงเงินสด
  - **TODO สำหรับ Phase ถัดไป**:
    - **หมายเหตุ**: ยังไม่มี `docs/specs/01_scene_catalog_v2.md` ในโปรเจกต์ อะไรที่อิงตาราง 01 ใช้ `02`, `03` และ `sceneManifest.json` แทน
    - รอ Phase 3: เชื่อม Storylet Engine (T0–T3) ให้ยิง Turning Point, เงื่อนไขเปิดเผย `hidden_to_self`, และ Monthly Event Director เต็มรูปแบบ (แทน Demo Prompts + Monthly Autopilot Roll)
    - รอ Phase 4: ใช้ `reputationView` ในระบบ NPC LOD 3 ระดับและ Utility AI
    - รอ Phase 5: เพิ่มชั้น AI Narration บน `PeriodDigest` โดยยังคง Template Fallback เดิมไว้ 100%
    - รอ Phase Housing (02): เชื่อมระบบที่อยู่อาศัยเต็มรูปแบบเข้ากับ `timeAllocation` และ `economy`
- **Phase 3**: เสร็จสมบูรณ์ (Storylet + Event Director + เหตุการณ์ 4 ระดับ T0–T3 + Digest + Explain Panel + Twist + Dev Trigger)
  - **Storylet Engine & Validator (`src/engine/storylet.ts`, `src/data/storylets/catalog.ts`)**:
    - คลัง Storylet ภาษาไทยเขียนมือ **40 ใบ** ครอบคลุม 7 หมวด (`work`, `romance`, `family`, `health`, `finance`, `social`, `quirky`), ทุกช่วงวัย (`toddler`..`senior`) และครบทั้ง 4 ระดับ (`T0`: 6 ใบ, `T1`: 8 ใบ, `T2`: 19 ใบ, `T3`: 7 ใบ รวม Twist 3 ใบ) พร้อมเกณฑ์ตรวจอายุ-ที่อยู่อาศัย (`housingIds`, `forbiddenHousingIds`)
    - Union Effects จำกัดเฉพาะที่อนุญาต (`ChangeStat`, `ChangeMoney` เพดาน `-30,000..+50,000`, `AddFlag`, `RecordEvidence`, `ScheduleEcho`, `ApplyTurningPoint`, `StartScene` พร้อม `durationDays` และ `returnSummary`, `RevealTrait` และ Stub `MoveIn`/`ChangeTenure`/`StartJobShift` สำหรับ Spec 02/03)
    - `validateStorylet` ตรวจตอนโหลดคลัง: ห้ามผู้เยาว์ `< 18` เข้าเนื้อหาผู้ใหญ่หรือโรแมนติกที่ไม่ตั้ง `isMinorSafe: true`, ตรวจ `sceneId` กับ `sceneManifest.json`, และซ่อนทางเลือกที่ถูก Trait ปิดกั้น (`filterStoryletChoices`) พร้อมเก็บเหตุผลไว้แสดงใน Explain
  - **Scene Meta, Timed Scene Mode & Resolver (`src/data/sceneMeta.ts`, `src/engine/scene.ts`, `src/engine/pipeline.ts`)**:
    - เพิ่ม `sceneMeta.ts` ตาม `docs/specs/01_scene_catalog_v2.md` §10 โดยแยก `classTier` (ฐานะ `T1`–`T5`) ออกจาก `eventTier` (`T0`–`T3`) และไม่แก้ `sceneManifest.json`
    - ต่อยอด `resolveScene` ตามลำดับความสำคัญใน `01_scene_catalog_v2.md` §3 (`sceneId` / `sceneTag` -> `sceneMode` ที่มีวันหมดอายุ -> `pickSceneForState`) พร้อม Fallback (`home` -> ฉากบ้านปัจจุบัน, `district`/`market`/`cafe`/`nightlife` -> `street_shops`)
    - วงจรชีวิต `sceneMode` (เช่น แอดมิตโรงพยาบาล `durationDays` วัน): พักฟื้นพลังงาน/ลดความเครียดระหว่างนอนโรงพยาบาล พักเบรกเหตุการณ์ภายนอกที่ไม่เกี่ยวข้อง ครบกำหนดปลดออกและคืนฉากปกติพร้อมบันทึก `"ออกจากโรงพยาบาลแล้ว"` ส่วนทางเลือกรักษาแบบประคองอาการที่ไม่หายขาดจะตั้ง `chronic_appendix_risk` และนัดเหตุการณ์กำเริบซ้ำในอนาคต
  - **Event Director 4 แหล่ง & ตาราง 4 ระดับ (`src/engine/director.ts`, `src/data/storylets/directorConfig.ts`)**:
    - แหล่งกำเนิด 4 แหล่งเรียงลำดับตายตัวใน Step 8 ของ Tick: (1) คิวผลลัพธ์/ลางบอกเหตุ (`consequenceQueue`), (2) ปฏิทิน/ช่วงวัย (`calendar`), (3) เกณฑ์สถานะวิกฤต (`stat_threshold`), (4) พูลสุ่มถ่วงน้ำหนัก Hazard + Cadence วันที่ 1/15 พร้อม Interface Stubs สำหรับ Phase 4 (`NpcEventProposal`), Phase 5 (`AiEventProposal`), และ Phase 7 (`WorldEventProposal`)
    - ตาราง 4 ระดับ: `T0` บันทึกเงียบ (0 วิ), `T1` Toast ไม่หยุดเวลา (7 วันในเกม), `T2` การ์ดตัดสินใจ (หน้าต่าง 14 วัน ปิด/ข้ามหรือเกินเวลาให้เลือกแทนตามนิสัยและคำสั่งล่วงหน้า), `T3` จุดเปลี่ยน/วิกฤต (บังคับลดความเร็วเป็น `x1` และหยุดรอ บังคับเลือกเอง)
    - Tension Budget (`start 100`, `+1.5/วัน`, `T2 -35`, `T3 -70`), Cooldown (`T2 >= 28 วัน`, `T3 >= 160 วัน`, หมวดซ้ำ `>= 45 วัน`), Foreshadowing ล่วงหน้า 14 วันสำหรับ T3 เชิงลบ (ยกเว้น `isSuddenHazard`), Plausible Twist (จำกัด 3 ครั้ง/ชีวิต ห่าง >= 180 วัน), และ UI Attention Budget (`>= 35 วินาที` จริงต่อป๊อปอัป + กรอง T2 สำคัญต่ำ `< 7` ที่ `x20`)
  - **Explain Engine & Digest (`src/engine/explain.ts`, `src/engine/digest.ts`)**:
    - `explain(state, targetKey)` รองรับ `event:<id>`, `timeline:<id>`, `autopilot:<id>`, สถิติ 3 ชั้น, Trait, และ Action Lock อธิบายเป็นภาษาไทยเข้าใจง่ายแบบเหตุ-ผล ปราศจากศัพท์โค้ด/สูตรลอการิทึม พร้อมแสดงลางบอกเหตุ, Plausibility ของ Twist, และทางเลือกที่ถูก Trait ซ่อน
  - **ระบบผลกระทบจากรูปลักษณ์ สไตล์ สีผม และค่าเสน่ห์ (`src/engine/appearance.ts`, `src/engine/economy.ts`, `src/engine/stats.ts`)**:
    - **แกนคำนวณกลาง (`evaluateAppearanceImpact`)**: ประเมินจากสีผมย้อม/สีแฟนซี (`dyed_hair`, `FANCY_HAIR_COLORS`, `dyedHairColor`), แท็กแฟชั่นจัดจ้าน/กบฏ (`STRICT_FORMAL_BLOCKED_TAGS`, `MILD_CASUAL_OR_BOLD_TAGS`), หรือชุดสุภาพ/ชุดทำงาน (`FORMAL_PROFESSIONAL_TAGS`), รวมถึง Flag ปรับลุคสุภาพจากเหตุการณ์ (`appearance_toned_down_formal`)
    - **Debuff ความน่าเชื่อถือ & การล็อกสายงาน (`checkJobEligibility`, `computeLifeIndices`, `computeReputationViews`)**:
      - ผมย้อมสีแฟชั่นจัดหรือลุคจัดจ้านลดค่า `status` (`-4`) และภาพลักษณ์ที่ทำงาน (`workRep -6`, `communityRep -3`) แต่เพิ่มภาพจำในกลุ่มเพื่อน (`friendsRep +2`) และล็อกอาชีพสาย `dressCode: 'strict_formal'` (เช่น ข้าราชการ) จนกว่าจะปรับลุคให้สุภาพ
      - สายงาน `dressCode: 'neat'` (พนักงานออฟฟิศ, เซลส์, ผู้จัดการขาย) ยังรับสมัครได้แต่แสดงคำเตือนเรื่องภาพลักษณ์ ส่วนสาย `tech` / `business` / `parttime` ไม่จำกัดสีผม
      - ลุคสุภาพ/สูท/ชุดทำงานเสริมความน่าเชื่อถือ (`status +2`, `workRep +4`)
    - **เกณฑ์สเตตัสดิบในอาชีพและ Storylet**:
      - อาชีพที่ต้องเจรจา/ภาพลักษณ์ (`sales_exec`: เสน่ห์ `45+`, รูปลักษณ์ `35+`; `sales_manager`: เสน่ห์ `58+`, ความน่าเชื่อถือ `48+`; `civil_servant`: ความน่าเชื่อถือ `45+` + ลุคสุภาพ) ตรวจสอบผ่าน `minRawStats` ทั้งตอนสร้างชีวิต (`lifegen.ts`) และหน้าสมัครงาน (`WorkStudyTab.tsx`)
      - Storylet เชื่อมสเตตัสและลุคโดยตรง: เสน่ห์สูง (`charisma >= 65`) หรือหน้าตาดีมาก (`looks >= 68`) มีโอกาสเจอแมวมอง/แคสงานโฆษณา (`t2_talent_scout_charisma`, `t2_model_scout_high_looks`); เสน่ห์ต่ำ (`charisma <= 38`) เกิดเหตุการณ์ติดขัดการสื่อสารเพื่อฝึกพัฒนา (`t2_awkward_interview_low_charisma`); ผมสีแฟชั่น/ลุคจัดจ้านเกิดทั้งคำชมจากคนรุ่นเดียวกัน (`t1_fashion_hair_compliment`) และข้อทักท้วงในสายงานทางการพร้อมทางเลือกปรับลุค (`t2_dyed_hair_office_feedback`)
  - **ความต่างระหว่างเอกสาร 01 กับไฟล์จริงในโปรเจกต์**:
    - ตอนนี้มี `docs/specs/01_scene_catalog_v2.md` ในโปรเจกต์แล้ว (อัปเดตจากบันทึกเดิมใน Phase 1.8/2)
    - `01_scene_catalog_v2.md` §1 จัด 21 ฉากเป็น 4 กลุ่ม (`home`, `education`, `work`, `district`) ขณะที่ `sceneManifest.json` ใช้ 8 category ย่อย (`home`, `school`, `education`, `work`, `commerce`, `street`, `public`, `nightlife`) รวมถึง `hospital` (`public`) — จึงเชื่อมผ่าน `src/data/sceneMeta.ts` โดยไม่แตะ `sceneManifest.json`
    - `standZone` และ `characterScale` ยังไม่มีใน `sceneManifest.json` จึงตั้งค่า default ตาม §3 (`xMin: 0.15, xMax: 0.85, footY: 0.88, tuned: false`, `characterScale: 0.38`) ไว้ใน `sceneMeta.ts` และรอหน้าจูน + `jobs[]` ใน Phase ถัดไป
  - **Stubs และ TODO สำหรับ Phase ถัดไป (นอกขอบเขต Phase 3)**:
    - **ระบบร้านทำผม/ตู้เสื้อผ้าและการเปลี่ยนลุค (Salon & Wardrobe — รอ Phase 5–7)**: เพิ่ม `dyedHairColor` / `styleOverride` ใน `CharacterAppearance` รองรับไว้แล้ว แต่ยังต้องทำหน้าจอจ่ายเงินเข้าร้านทำผม (ย้อมสีผ่าน `allowDyed: true` และโคนผมงอกคืนสีธรรมชาติเมื่อเวลาผ่านไป) รวมถึงระบบตู้เสื้อผ้าสลับชุดทางการก่อนไปสัมภาษณ์งานกับชุดลำลอง/กลางคืน
    - **Phase 4 (`NpcEventProposal` / ปฏิกิริยา NPC)**: ให้ระบบ Utility AI ของ NPC อ่านค่า `looks`, `charisma`, `reputationView`, สีผม และแท็กสไตล์ (เช่น ญาติผู้ใหญ่/ข้าราชการค่อนขอดผมสีฉูดฉาด vs เพื่อน/สายครีเอทีฟ/วงการบันเทิงชื่นชม รวมถึงความประทับใจแรกในความรักและแมวมองแบบมีตัวละคร NPC จริง)
    - **Phase 5 (`AiEventProposal`)**: AI Storylet Narration & Structured Output Fallback
    - **Phase 6 (ปุ่มปรับโทน 3 ปุ่ม + คอนเทนต์ไทยเชิงลึก)**: ให้ระดับ "ความโหดของโลก" ปรับความเข้มงวดของอคติเรื่องสีผม/การแต่งกายในสังคมไทย (ชิลล์ / สมจริง / โหดจริง) พร้อมคลัง Twist เพิ่มเติม
    - **Phase 7 (`WorldEventProposal`)**: Spec 02 Housing (`MoveIn`/`ChangeTenure`) และ Spec 03 Job Shifts (`StartJobShift`) เต็มรูปแบบ + ระบบงานกลางคืน (`pub_hostess`, `pub_bartender`, ฯลฯ) ที่ใช้เกณฑ์ `looks`/`charisma` และ `dressCode: 'nightlife'`
- **Phase 3.1**: เสร็จสมบูรณ์ (รวมหน้าตาเหตุการณ์ให้เป็นมาตรฐานเดียว + แปลงศัพท์เทคนิคเป็นภาษาคนทั่วไป + กฎ T3 บังคับเลือกเองไร้ Deadline + บันทึกแผนท่อสมัครกลางแทรกก่อน Phase 4)
  - **การรวมหน้าตาเหตุการณ์เป็นมาตรฐานเดียว (Unified Decision Card `src/ui/components/ChoiceCard.tsx`)**:
    - ยุบป๊อปอัปสีเหลืองของ Autopilot ใน Phase 2 เข้ามาใช้โครงสร้างการ์ดเดียวกับการ์ดตัดสินใจหลัก โดยคงข้อความชี้แจง `"เรื่องนี้ตั้งค่าให้หยุดถามคุณก่อน หรือยังไม่มีคำสั่งล่วงหน้า"` ไว้อย่างแนบเนียน
    - ลำดับข้อมูล โครงสร้างปุ่ม และ `EffectChip` ใช้มาตรฐานชุดเดียวกัน 100%
  - **ตารางเปรียบเทียบระดับเหตุการณ์ภายใน vs สิ่งที่ผู้เล่นเห็นจริง**:

| ระดับภายใน (Engine) | สิ่งที่ผู้เล่นเห็นใน UI | หัวการ์ดและสี | พฤติกรรมเวลาและการตัดสินใจ | การแสดงใน Timeline |
| :--- | :--- | :--- | :--- | :--- |
| **T0 (Silent Event)** | ไม่มีป้ายระดับ | ไม่มีป๊อปอัป (บันทึกเงียบ) | ไม่หยุดเวลา (0 วิ) | แสดงในฟีดปกติ (ซ่อนป้าย T0 ในมุมมองปกติ) |
| **T1 (Minor Toast)** | ไม่มีป้ายระดับ | Toast เล็กด้านบน (ชมพู/ฟ้า) | ไม่หยุดเวลา (แสดง 7 วันในเกม) | แสดงในฟีดปกติ (ซ่อนป้าย T1 ในมุมมองปกติ) |
| **T2 (Decision)** | `ตัดสินใจ` | สีเหลือง `#FFE58F` + แท็กหมวดเล็กๆ | มีเวลานับถอยหลัง 14 วัน (หากหมดเวลาตัวละครจะเลือกตามนิสัย/คำสั่ง หรือกดข้ามได้) | แสดงในฟีดปกติ (ซ่อนป้าย T2 ในมุมมองปกติ) |
| **T3 (Turning Point)** | `จุดเปลี่ยน` | สีชมพู `#FF9EBF` + แท็กหมวดเล็กๆ | บังคับลดความเร็วเหลือ `x1` และหยุดรอ (Pause) **ไม่มีเวลานับถอยหลัง ไม่มีปุ่มข้าม ผู้เล่นต้องกดเลือกเองเสมอ** | แสดงในฟีดปกติ (ซ่อนป้าย T3 ในมุมมองปกติ) |
| **Autopilot Situation** | `ตัดสินใจ` | สีเหลือง `#FFE58F` + แท็กหมวดเล็กๆ | ใช้โครงเดียวกับ T2 พร้อมแถบเหตุผล "เรื่องนี้ตั้งค่าให้หยุดถามคุณก่อน หรือยังไม่มีคำสั่งล่วงหน้า" | ไอคอนสายฟ้า/เหรียญ + แถบประ + แท็ก `[บันทึกระบบ]` |
| **สรุปปิดงบสิ้นเดือน / Period Digest** | `สรุปช่วงที่ผ่านมา` / `การเงิน` | สไตล์สรุปจากระบบ (กรอบประ Slate/Neutral) | แสดงภาพรวมรายเดือน/รายปี | สไตล์ระบบแยกชัดเจน ไม่ปนกับเหตุการณ์ชีวิตทั่วไป |

  - **กฎตายตัวของ T3 ใน Engine (`src/engine/director.ts`, `src/data/storylets/catalog.ts`)**:
    - `prompt.deadlineDay = undefined` สำหรับเหตุการณ์ T3 ทั้งหมด
    - `stepEventDirector` จะไม่นำเหตุการณ์ T3 ไป auto-resolve หรือสุ่มเลือกแทนเด็ดขาด
    - เอาข้อความนับถอยหลังออกจากหน้าต่าง T3 และแสดงคำเตือน `"จุดเปลี่ยนสำคัญของชีวิต (ปรับความเร็วเป็น x1) — กรุณาเลือกทางเดินชีวิตด้วยตัวเอง"`
  - **การรวมข้อความ UI และศัพท์คนทั่วไป (`src/data/uiText.ts`)**:
    - สร้าง Single Source of Truth รวมข้อความภาษาไทยทั้งหมดไว้ที่ `src/data/uiText.ts` ห้ามฝังข้อความดิบกระจัดกระจายในคอมโพเนนต์
    - แปลงศัพท์ทางเทคนิคให้เป็นภาษาคนทั่วไป:
      - `Autopilot` -> `ตัวละครตัดสินใจเอง`
      - `Digest` -> `สรุปช่วงที่ผ่านมา`
      - `Daypart` -> `เช้า / บ่าย / เย็น / ดึก`
      - `Explain` -> `ทำไม?`
      - `Standing Orders` -> `คำสั่งประจำ`
      - `Time Allocation` -> `ตารางเวลา`
      - `Evidence` -> `พฤติกรรมสะสม`
      - `Traits` -> `นิสัย`
      - `Stress` -> `ความเครียด`
      - `Energy` -> `พลังงาน`
  - **บันทึกความเห็นชอบทางสถาปัตยกรรม (แทรกก่อน Phase 4)**:
    - **ท่อสมัครงาน / เรียน / ทุน ส่วนกลาง (Central Application Pipeline)**: จะไม่ทำเป็น Storylet พิเศษแยกเป็นเกาะๆ แต่สร้างเป็นท่อกลางที่ใช้ซ้ำร่วมกัน เพื่อเก็บประวัติการจ้างงาน (กะทำงาน, ค่าจ้าง, ผ่านโปร) ให้ฉากประจำวัน เงินเดือน และ NPC ผู้สัมภาษณ์/เจ้านายใน Phase 4 สามารถเกาะต่อได้อย่างเป็นระบบ
- **Phase 3.2**: เสร็จสมบูรณ์ (ตารางประจำวัน `DayPlan` 4 ช่อง + เลือกฉากตามกิจกรรม + อัปเดต HUD มือถือ/โลโก้หน้าแรก)
  - **ข้อมูลกะงานใน `JobDefinition` (`src/data/thaiData.ts`)**:
    - เพิ่มฟิลด์ `sceneId`, `shift` (`none | day | day_long | split | flex | night`), `weekendOff` ครบทั้ง 12 อาชีพ พร้อม `validateJobsScheduleInDev()` ตรวจตอนโหลดในโหมด dev
    - ลบ `switch (economy.jobId)` ออกจาก `pickSceneForState` และลบกฎ `totalDays % 4` / `getJobShiftDaypart` / `getWeeklyRoutineNightDaypart` เดิม
  - **Pure DayPlan Scheduler (`src/engine/dayPlan.ts`, `src/engine/clock.ts`, `src/engine/scene.ts`)**:
    - `buildDayPlan(state)` / `getDayPlan(state)` สร้างตาราง 4 ช่อง (`เช้า / บ่าย / เย็น / ดึก`) แบบ Deterministic ล้วนจากแฮช `seed + totalDays` (ไม่ใช้ `Math.random` ไม่แตะ `rngState` ทำให้ `x1` และ `x20` ได้ผลตรงกัน 100%)
    - รองรับวันหยุดราชการและช่วงปิดเทอม (`isThaiPublicHoliday`, `isThaiSchoolBreak`), กะ `split` สลับรายสัปดาห์, `food_rider` เน้นช่วงเย็น (`importance: 85`), โอที (`routine === 'hustle'`) ขยายกะไปช่องถัดไปด้วย `overtimeDayparts` สำหรับผู้ใหญ่, และผู้เรียน/คนทำงานที่ตั้ง `routine === 'side_gig'` จะวางงานเสริมไว้ในช่องว่าง (ปกติ `evening`) โดยไม่ทับชั่วโมงเรียน/งานประจำ พร้อมฉากงานเสริมหลากหลาย
    - ลองฉากสำรองในแถวเดียวกันก่อนถอยบ้านเมื่อปิดทำการหรือติดกฎอายุ (`isSceneOpen`), บันทึก `fallbackFrom` / `fallbackReason` และเชื่อมเข้า `explain(state, 'dayplan:slot:<0..3>')` + ปุ่ม `"ทำไม?"` ใน `SceneStage`
  - **UI & Mobile UX (`LifeGenScreen.tsx`, `SceneStage.tsx`, `TimeControls.tsx`, `MainGameScreen.tsx`, `uiText.ts`)**:
    - ใส่โลโก้ `What a Life! ชีวิตจริงยิ่งกว่านิยาย` เหนือ Stepper 1-2-3 ในหน้าแรก และย่อแบรนด์หัวแถบซ้ายบนมือถือไม่ให้เบียดปุ่มเครื่องมือขวาบน
    - `SceneStage`: ความเร็ว `x1–x3` แสดงไล่ตามช่องเวลาจริงของวัน, `x5+` แสดงเฉพาะช่องเด่น (`getHighlightSlot`), ตอนหยุดมีแถบ 4 ปุ่ม (`เช้า / บ่าย / เย็น / ดึก`) กดสำรวจแต่ละช่องได้, หัวฉากและกล่องคำพูดบอก `"กำลังทำอะไร · ที่ไหน"` ตามกิจกรรมของช่องนั้น
    - ย้ายแผงปุ่มเล่น/หยุด/ความเร็ว `TimeControls` เป็นแถบตรึงขอบล่างเหนือ Bottom Nav Dock บนมือถือ (`lg:static` บนจอใหญ่)
    - สงวนป้าย `"จุดเปลี่ยน"` (`milestone`) เฉพาะเหตุการณ์ `T3`, การเปลี่ยนช่วงวัย, และวันเกิดอายุครบ 18 ปี ส่วนวันเกิดทั่วไปใช้หมวด `'life'` และย้ายข้อความข้ามเหตุการณ์ `T2` ให้เป็นภาษาธรรมชาติใน `UI_TEXT.AUTOPILOT_SKIP_REASON`
  - **TODO นอกขอบเขต Phase 3.2 (ยกยอดไป Phase ถัดไป)**:
    - ระบบสมัครงาน / สัมภาษณ์ / ผ่านไม่ผ่าน และการสมัครมหาวิทยาลัย (Phase 3.3 / 3.5)
    - เมนูการกระทำในฉากแบบ BitLife (Phase ถัดไป)
    - หมวด `sideGig` ในตารางจัดสรรเวลา 168 ชม./สัปดาห์ (`src/data/timeAlloc.ts`, `src/engine/timeAlloc.ts`)
- **Phase 3.2.1**: เสร็จสมบูรณ์ (พรีเซ็ตวิถีชีวิต 12 แบบ + อุดช่องโหว่งานเสริมผู้เยาว์/โอที + ฝึกทักษะแบบขั้นบันได 3 ขั้น)
  - **ตารางเวลา 168 ชม. เป็นแหล่งความจริงเดียว (`src/data/lifestylePresets.ts`, `src/data/timeAlloc.ts`, `src/engine/timeAlloc.ts`, `src/engine/save.ts`)**:
    - เพิ่มหมวด `sideGig` (งานเสริม) ใน `TimeAllocation` พร้อมค่าตั้งต้น `0` ทุกช่วงวัย และลำดับหักตายตัว `hobby -> selfDev -> social -> family -> nightlife -> sleep` เมื่อนำ delta ของพรีเซ็ตไปบวกกับ baseline ช่วงวัย
    - ลบการอ่าน `state.routine` ออกจาก runtime ทั้งหมด (`pipeline.ts`, `dayPlan.ts`, `explain.ts`, `storylet.ts`, `SceneArt.tsx`, `TimeAllocPanel.tsx`, `WorkStudyTab.tsx`) คงไว้เฉพาะ `@deprecated routine?` สำหรับย้ายเซฟเก่าอัตโนมัติใน `save.ts` พร้อมบันทึกไทม์ไลน์เมื่อ `side_gig` เดิมไม่ผ่านเกณฑ์
    - ขยับสไลเดอร์ใน `TimeAllocPanel` จะสลับ `lifestylePresetId` เป็น `'custom'` โดยไม่เขียนทับค่าผู้เล่น
  - **อุดช่องโหว่งานเสริมผู้เยาว์และโอที (`src/engine/economy.ts`, `src/engine/log.ts`, `src/engine/dayPlan.ts`, `src/data/thaiData.ts`)**:
    - สร้าง Gate กลาง `checkSideGigEligibility(state, proposedSideGigHours?)` ร่วมกับเกราะป้องกันใน `log.ts` (`AddMoney`/`ChangeMoney` หมวด `side` เป็นบวกถูกบล็อกเมื่ออายุ `< 15`)
    - `< 15` ห้ามทำงานเสริมและรายได้เสริม `= 0` ทุกกรณี; `15–17` ต้องมี `sideGigRecord` ที่ไม่เป็นกะดึก (`22:00–06:00`), `workOrStudy + sideGig <= 48`, และไม่มีโอที; `18+` ทำโอทีได้ตาม `job.allowsOvertime` และเงินโอทีนับเป็น `'salary'` ไม่ใช่ `'side'`
    - บล็อก `student -> unemployed` ใน `checkJobEligibility` ด้วยข้อความ `"ต้องยืนยันเรื่องการเรียนก่อน"` จนกว่าท่อลาออก/พักการเรียนจะเปิดใน Phase 3.3
  - **ระบบฝึกทักษะแบบขั้นบันได 3 ขั้น (`src/data/skillTraining.ts`, `src/engine/skillTraining.ts`, `src/ui/components/tabs/WorkStudyTab.tsx`)**:
    - ยกเลิก `TRAIN_SKILL` แบบกดแล้วได้สกิลทันที แทนที่ด้วย `SET_SKILL_FOCUS` (เลือกได้สูงสุด 2 ทักษะ) และ `ENROLL_SKILL_COURSE` (อายุ 15+, 4/8/12 สัปดาห์, สัปดาห์ละ 500 บาท หักล่วงหน้าทุกสัปดาห์ใน `onWeek`)
    - ขั้น 1 (`0–29`): ฝึกเองผ่าน `selfDev` / ขั้น 2 (`30–59`): ต้องมีคอร์สที่กำลังเรียนอยู่ (หรือเป็นนักเรียนสำหรับ `academic`) และเวลา `selfDev >= 6` ชม./สัปดาห์ / ขั้น 3 (`60–100`): ต้องทำงานสายที่ใช้ทักษะนั้นจริง (`job.relatedSkills`), หรือกิจกรรมต่อเนื่องที่ไม่มีวันตัน (`socializing`: เข้าสังคม >= 10 ชม./สัปดาห์ 8 สัปดาห์, `finance`: ออมมีวินัย + เงินสำรอง 50,000+, `academic`: เรียนวัยผู้ใหญ่ 18+)
    - เก็บ XP ทศนิยมสะสมรายสัปดาห์ + เพดานแต่ละขั้น + สลายตัวช้าๆ (`0.02/สัปดาห์`) หลังปล่อยว่างเกิน 12 สัปดาห์โดยไม่ลดต่ำกว่าฐานขั้นเดิม (`0 / 30 / 60`) และผูกเข้ากับ `explain(state, 'skill:<key>')`
  - **ความต่างระหว่างเอกสาร 05 กับโค้ดจริงในโปรเจกต์**:
    1. เอกสาร 05 §2.4 ระบุชื่อ routine เก่าว่า `'grind'` แต่โค้ดจริงใช้ `'study'` — จึงรองรับการย้ายทั้ง `'study'` และ `'grind'` ใน `save.ts`
    2. เอกสาร 05 §4.4 ระบุถึง `"สุขภาพ/ฟิตเนส (ถ้ามีเป็นทักษะ)"` — ในโค้ดจริง `SkillKey` มีเพียง 8 ทักษะ (`english`, `sales`, `finance`, `tech`, `craft`, `cooking`, `socializing`, `academic`) ไม่มีทักษะฟิตเนส จึงไม่เพิ่มทักษะที่ 9 และคงการดูแลร่างกายไว้ที่ `indices.physical` + หลักฐาน `fitness_training` (เพิ่มป้าย `fitness_training: 'การฝึกซ้อมดูแลร่างกาย'` ใน `explain.ts`)
    3. เอกสาร 05 §4.4 ระบุทางเข้าขั้น 3 ของ `english` ด้วยการ `"เข้าสังคมกับคนต่างชาติสะสมต่อเนื่อง"` — ระบบเข้าสังคมคนต่างชาติยังไม่เปิดใน Phase นี้ (เก็บเป็น TODO สำหรับ Phase 4/6) แต่ `english` ยังปลดล็อกขั้น 3 ได้ไม่ตันผ่าน `office_junior` (`minSkill` ไม่มีเกณฑ์อังกฤษ) และ `software_dev` (`minSkill.english = 25`)
  - **TODO นอกขอบเขต Phase 3.2.1**:
    - Phase 3.3: ระบบสมัครงานเสริมจริงเพื่อสร้าง `SideGigRecord` (ตอนนี้ `sideGigRecord` เริ่มต้นเป็น `null` ทำให้พรีเซ็ต `work_and_gig` แสดงป้ายล็อก) และท่อยืนยันพัก/ลาออกจากการเรียนสำหรับ `student -> unemployed`
    - Phase 3.2.2: เมนูกิจกรรมเฉพาะฉากแบบ BitLife และเหตุการณ์ย่อยประจำวัน
    - Phase 4/6: เหตุการณ์เข้าสังคมกับคนต่างชาติเพื่อเปิดทางเลือกขั้น 3 เสริมของทักษะ `english`
- **Phase 3.2.2**: เสร็จสมบูรณ์ (ตารางแผนชีวิตแบบกริดเป็นแหล่งความจริงเดียว + แคตตาล็อกกิจกรรม 6 หมวด 18 กิจกรรมย่อย)
  - **กริดตารางแผนชีวิตเป็นแหล่งความจริงเดียว (`src/data/slotHours.ts`, `src/data/activities.ts`, `src/data/lifestyleTemplates.ts`, `src/engine/planner.ts`)**:
    - ชั่วโมงต่อช่องคงที่ (`เช้า 4 / บ่าย 5 / เย็น 4 / ดึก 3` = 16 ชม./วัน + ฐานนอน/กิจวัตรพื้นฐาน `8 ชม./วัน`) แปลงเป็น 168 ชม./สัปดาห์แบบ Deterministic ล้วนผ่าน `deriveWeeklyAllocation(grid, state)` (หักชั่วโมงจริงจาก `JobDefinition` / ตารางเรียนสำหรับช่องที่ล็อก และคืนเศษที่เหลือลง `hobby` เพื่อให้ผลรวมเท่ากับ `168` เสมอ)
    - ลบ `UPDATE_TIME_ALLOCATION` และสไลเดอร์แก้ชั่วโมงแยกออกจากระบบทั้งหมด (`TimeAllocPanel.tsx` เป็นมุมมองอ่านอย่างเดียว `"ดูเป็นชั่วโมง"` เท่านั้น); ผู้เล่นแก้ไขตารางผ่าน `CONFIRM_LIFE_PLANNER` ซึ่งตรวจสอบด้วย `validatePlanner` และมีผลตั้งแต่วันถัดไป (`pendingGrid` + `effectiveFromDay`)
    - พรีเซ็ต 12 แบบจาก 05 กลายเป็นแม่แบบกริดรายช่วงวัยใน `lifestyleTemplates.ts` (`applyPresetTemplate` เติมเฉพาะช่องที่ไม่ล็อก)
  - **กฎวันหยุด กฎเงิน กฎทักษะ และ DayPlan (`src/engine/dayPlan.ts`, `src/engine/timeAlloc.ts`, `src/engine/skillTraining.ts`)**:
    - `getSlotActivity` และ `buildDayPlan` อ่านกิจกรรมจาก `planner.grid` โดยตรง; วันหยุดราชการ (`isThaiPublicHoliday`) และช่วงปิดเทอม (`isThaiSchoolBreak`) แทนที่ช่องที่ปกติล็อกด้วยงาน/เรียนด้วยช่องวันหยุดของกริด และกะ `weekendOff: false` ยึดกะวันเสาร์ไว้เหมือนเดิม พร้อมแก้ไขบั๊กหัวฉาก "งานเสริม" ให้ไม่ไปจับคู่กับฉาก `university`
    - กฎเงิน (`resolveAffordableWeeklyActivities`): `< 15 ปี` ซ่อนกิจกรรมเสียเงินส่วนตัว (ยกเว้น `minorPaidByParentsBelow15`); `15+ ปี` หักค่ากิจกรรมรายสัปดาห์ใน `onWeek()` หากเงินสดไม่พอจะสลับช่องที่เกินงบเป็นกิจกรรมฟรี (`freeFallbackActivityId`) อัตโนมัติ พร้อมบันทึกในไทม์ไลน์และแสดงเหตุผลใน `explain(state, 'dayplan:slot:0')` (`"ทำไม?"`)
    - ทักษะ (`skillTraining.ts`): ชั่วโมงจาก `self_study`, `attend_course`, `field_practice` และ `read_review` ในกริดถูกนำไปคำนวณตามขั้นบันได 1/2/3 พร้อมแสดงคำเตือนติดเพดานขั้นและทางปลดล็อกใน Bottom Sheet เลือกกิจกรรม
  - **UI มือถือ 360–400px (`src/ui/components/LifePlannerPanel.tsx`, `src/ui/components/TimeAllocPanel.tsx`, `src/ui/components/tabs/WorkStudyTab.tsx`)**:
    - แสดงหัวสรุปสถานะ + แท็บสลับ `ตารางสัปดาห์ / ปฏิทินรายปี` (แท็บรายปีแสดง `"เร็วๆ นี้"` รอ Phase 3.2.3), แถบทางลัดจัดตารางเลื่อนแนวนอน, กริด 2x4 แยกสีตามหมวดใหญ่, Bottom Sheet เลือกหมวดใหญ่-กิจกรรมย่อย (แตะนอกกรอบเพื่อปิด, ลูกศรขึ้น/ลงไม่มีตัวเลขดิบ), พรีวิวผลรายสัปดาห์สด, ปุ่ม `ยืนยันแผน` / `ยกเลิกการแก้ไข` + ป้าย `ฉบับร่าง`, และแถบพับ `ดูเป็นชั่วโมง`
  - **การย้ายเซฟ Phase 3.2.1 (`migratePlanner` ใน `src/engine/planner.ts` & `save.ts`)**:
    - เซฟเดิมที่มีพรีเซ็ตจะถูกสร้างกริดจากแม่แบบพรีเซ็ตนั้น; เซฟที่เป็น `'custom'` จะย้ายเป็นกริด `'balanced'` พร้อมบันทึกไทม์ไลน์ `"ตารางถูกจัดใหม่เป็นแบบสมดุล"`
  - **ความต่างระหว่างเอกสาร 06 กับโค้ดจริงในโปรเจกต์**:
    1. เอกสาร 06 ข้อ 10 อ้างอิง `00_index.md` แต่ไฟล์ `docs/specs/00_index.md` ยังไม่มีในโปรเจกต์ จึงบันทึกการปรับอ้างอิงไว้ใน `DESIGN.md` แทน
    2. ฉาก `ยิม/สวนสาธารณะ`, `ห้องสมุด`, และ `ห้างสรรพสินค้า` ยังไม่มีใน `sceneManifest.json` จึงผูกกิจกรรม `workout`, `read_review`, และ `skincare_grooming` เข้ากับ `street_shops` / `home` / `cafe` พร้อมบันทึก `todoMissingSceneNote` (TODO ตาม 01 ข้อ 8)
    3. เอกสาร 06 ข้อ 0 ระบุคำอธิบายเพิ่มเติมสำหรับ `"แอดมิตโรงพยาบาลถูกล็อก"` — ในโค้ดจริง `sceneMode: 'hospital'` ถูกคุมด้วยชั้นความสำคัญที่ 2 ใน `resolveScene` / `stepDailyLife` อยู่แล้ว จึงแสดงแบนเนอร์แจ้งเตือนชั่วคราวบนหัวตารางแผนชีวิตโดยไม่เขียนทับกริดถาวรของผู้เล่น
    4. `06` ข้อ 3 ระบุตัวเลือกกิจกรรมปลดล็อก (`ชมรม`, `สตรีม`) ร่วมในตารางตัวอย่าง แต่ข้อ 9.3 จัดเป็นขอบเขตของ Phase 3.2.3 จึงละเว้นไว้ไม่ทำในรอบนี้ตามคำสั่ง
  - **TODO นอกขอบเขต Phase 3.2.2**:
    - Phase 3.2.3 (`06` ข้อ 9): เป้าหมายประจำปี (`Annual Focus`), ปฏิทินรายปีอ่านอย่างเดียว+ปักหมุด, หมวดกิจกรรมปลดล็อกได้ (`ชมรม`, `ฝึกงาน`, `สตรีม`, `เลี้ยงลูก`, `ลงแข่ง`), ตัวนับความต่อเนื่อง `Streak`, และ Storylet 24 ใบ
    - Phase 3.3: ท่อสมัครงาน/งานเสริมจริงเพื่อสร้าง `SideGigRecord` และคำสั่งพัก/ลาออกจากการเรียน
    - ฉากที่ยังขาดตาม 01 ข้อ 8: ยิม/สวนสาธารณะ, ห้องสมุด, ห้างสรรพสินค้า
- **Phase 3.2.2 Extended**: เสร็จสมบูรณ์ (กรอบพิกเซลขั้นบันได + โอที/กะงาน + ฟรีแลนซ์ + การล็อกช่องต่อเนื่อง)
  - **สไตล์กรอบพิกเซลขั้นบันไดแท้ & ภาษาผู้เล่น (`src/index.css`, `src/engine/explain.ts`, `src/ui/art/PixelIcons.tsx`)**:
    - อัปเกรดคลาสกรอบ `.game-card`, `.px-window`, `.game-card-sm`, `.px-window-sm`, `.px-inset`, `.px-slot`, `.game-btn`, `.px-btn` เป็นมุมพิกเซลเว้าขั้นบันได (9-slice SVG `border-image` รองรับโหมดสว่าง `#4E3B69` / มืด `#7662AC`)
    - เพิ่มกฎล้างคำนวณและคีย์ดิบใน `cleanDisplayReason` (`src/engine/explain.ts`) ให้ครอบคลุมข้อความที่บันทึกไว้ในเซฟเก่าด้วย
    - เพิ่มไอคอนพิกเซล `'chain'` ใน `PixelIcons.tsx` และขยายขอบแถบทางลัดใน `LifePlannerPanel.tsx` ไม่ให้มุมกรอบโดนคลิป
  - **โอทีหลังเลิกงาน (Part A — `overtime_work`)**:
    - จำกัดสูงสุด **2 ช่วง/สัปดาห์**, ต้องอายุ `18+`, มีงานประจำ (`allowsOvertime !== false`), และเลือก `overtime_work` ช่วงเย็นวันธรรมดาจะล็อกต่อเนื่อง (`chainedNextSlot: 'night'`) ให้ช่วงดึกเป็น `sleep_normal` อัตโนมัติ (ห้ามทำโอทีติดกัน 2 ช่วงในวันเดียว)
    - ค่าล่วงเวลาต่อสัปดาห์ = `hourlyWage * multiplier * (otSessions * 4)` โดย `entry` (`1.5x`) และ `mid` (`2.0x`), เพิ่มความเครียด `+4/ช่วง`, ลดพลังงาน `-6/ช่วง`, ลดสัมพันธ์ครอบครัวสะสม `-1/ช่วง`, และสะสม `hardWorking +2/ช่วง` (+ `workaholic +1` เมื่อทำติดกัน `>= 3` สัปดาห์ผ่าน `employment.overtimeStreakWeeks`)
  - **ระบบกะงานประจำ (Part B — `EmploymentState.workShift`)**:
    - รองรับ 4 กะ (`morning-afternoon`, `afternoon-evening`, `night-morning`, `flexible`) ใน `src/engine/state.ts` (`CHANGE_WORK_SHIFT`), `WorkStudyTab.tsx`, และย้ายเซฟเดิมที่ไม่มี `employment` ให้เริ่มเป็น `morning-afternoon` ใน `save.ts`
    - กะดึก (`night-morning`, อายุ `18+` เท่านั้น): ล็อก `['night', 'morning']`, โบนัสเงินเดือน `+15%` ใน `onMonth()`, ความเครียด `+2/สัปดาห์`, สัมพันธ์ครอบครัวสะสม `-2/สัปดาห์` (เชื่อมเข้า `computeReputationViews` ใน `traitEffects.ts`), และยอมรับการนอนพักฟื้นช่วงบ่าย (`weekday.afternoon`) นับเป็นชั่วโมงนอนใน `deriveWeeklyAllocation`
    - กะเวลายืดหยุ่น (`flexible`): ไม่ล็อกช่องตายตัว ให้ผู้เล่นจัด `flexible_work` ให้ครบชั่วโมงขั้นต่ำตามสัญญา
  - **ฟรีแลนซ์ & ทางลัดบ้างาน & UI ล็อกต่อเนื่อง (Part C–E)**:
    - `freelance_work`: เปิดเฉพาะช่วงว่างงานประจำ, อายุ `18+`, `flags.freelance_unlocked === true`, และทักษะสูงสุด `>= 31`, สูงสุด 7 ช่วง/สัปดาห์; คำนวณรายได้คาดการณ์ `450 * (1 + (maxSkill - 30) * 0.02)` และสุ่มจ่ายจริงรายสัปดาห์ ±20% ผ่าน `nextRandom` พร้อมความเครียด `+3/ช่วง` และหลักฐาน `independent +2`, `creative +1`
    - พรีเซ็ต `workaholic` ปรับวันหยุดให้มีการพักฟื้นและเวลาครอบครัวเพื่อไม่ให้ชนกฎโอที; `LifePlannerPanel` แสดงโซ่เชื่อมระหว่างช่อง (`<PixelIcon name="chain" />`), สะพานเชื่อมแนวตั้ง, และคำอธิบายการล็อกช่องถัดไป
  - **ความต่างระหว่างข้อกำหนด Extended กับโค้ดจริง**:
    - ระดับความยาก/ตำแหน่งงานของอาชีพ (`JobGrade: 'entry' | 'mid'`) ยังไม่มีฟิลด์ใน `JobDefinition` เดิม จึงเพิ่ม `jobGrade` ให้ครบทั้ง 12 อาชีพใน `thaiData.ts` เพื่อคูณค่าล่วงเวลา `1.5x`/`2.0x` ได้ตรงจุด
    - `freelance_work` เป็นส่วนเสริมใน `activities.ts` ที่เตรียมรองรับล่วงหน้า โดยคงหมวดกิจกรรมปลดล็อกอื่นๆ (`ชมรม`, `สตรีม`, `เลี้ยงลูก`, `ลงแข่ง`) และแท็บปฏิทินรายปีไว้รอ Phase 3.2.3 ตามแผนเดิม
- **Phase 3.2.2 Extension 2**: เสร็จสมบูรณ์ (การจัดระเบียบหน้าชีวิต Sub-Tabs + ต้นทุนติดตัว 9 ด้านแบบสมดุลผสม 2 แนวทาง + การเชื่อมต่อโซ่กะงานกับโอที)
  - **การจัดระเบียบหน้าชีวิตลดการไถหน้าจอยาวๆ (`src/ui/components/tabs/MeTab.tsx`)**:
    - แบ่งหน้าชีวิตเป็น 3 แท็บย่อยสะอาดตา: `ต้นทุน & ทักษะ`, `ช่วงวัย & นิสัย`, และ `ปูมหลัง & ประวัติ`
    - ตรึงการ์ดพลังชีวิตวันนี้ (พลังงาน %, ความเครียด %, เวลาว่าง ชม.) ไว้ด้านบนสุดเสมอ แตะดูสาเหตุที่มาได้ทันที
    - จัดกลุ่มต้นทุนติดตัว 9 ด้านเป็น 3 หมวดอ่านง่าย:
      1. กายภาพ (`looks`, `strength`, `endurance`): สุขภาพ รูปร่าง และความทนทาน
      2. สมองและงาน (`wit`, `memory`, `creativity`): สติปัญญา ความจำ และความคิดสร้างสรรค์
      3. ใจและผู้คน (`eq`, `charisma`, `reliability`): วุฒิภาวะทางอารมณ์ เสน่ห์ และความน่าเชื่อถือ
    - ใส่ตัวบ่งชี้ชัดเจนว่าแตะดูรายละเอียดได้ พร้อมระบุดัชนีที่สนับสนุนไว้บนการ์ด
  - **หน้าต่างคำอธิบายที่มาฉบับสมบูรณ์ (`src/engine/stats.ts`, `src/ui/components/ExplainPanel.tsx`, `src/data/thaiData.ts`)**:
    - เพิ่มเมตาดาตา `RAW_STAT_GROUPS` และ `RAW_STAT_DETAILS` ครบทั้ง 9 ด้าน
    - หน้าต่าง "ทำไม?" และ `explainStat()` แสดงครบ 3 มิติสำคัญ: เสริมดัชนีใด, เร่งการฝึกทักษะใด, และการเพิ่ม/พยุงจากวิถีชีวิต vs ปัจจัยที่ทำให้ลดลง
  - **ระบบเกมเพลย์ต้นทุนติดตัว 9 ด้านแบบผสม 2 แนวทาง (`src/engine/timeAlloc.ts`, `src/engine/pipeline.ts`)**:
    - **แนวทางที่ 1 (เกิดจากกิจกรรมและกิจวัตรในตารางชีวิต)**:
      - `exercise`: เสริมความแข็งแรง (`strength`) และความอึด (`endurance`)
      - `sleep_full`: พยุงความอึด (`endurance`) และฟื้นฟูผิวพรรณ/ความสดชื่น (`looks`)
      - `self_study` / `attend_course`: ขัดเกลาไหวพริบ (`wit`) และลับความจำ (`memory`)
      - `hobby_leisure`: เปิดมุมมองสร้างสรรค์ (`creativity`) และสมดุลอารมณ์ (`eq`)
      - `meet_friends` / `party_night`: เพิ่มเสน่ห์การพูดคุย (`charisma`)
      - `family_time` / `quiet_rest`: เสริมวุฒิภาวะอารมณ์ (`eq`) และความน่าเชื่อถือ (`reliability`)
      - `work_shift`: ฝึกฝนความรับผิดชอบและความน่าเชื่อถือ (`reliability`)
      - ควบคุมเพดานการเติบโตรายสัปดาห์ (สูงสุดไม่เกิน 0.25 ต่อด้านต่อสัปดาห์) เพื่อไม่ให้ค่าเฟ้อ
    - **แนวทางที่ 2 (เติบโตและเสื่อมถอยตามวัย + ภาระงานเกินเกณฑ์ + เหตุการณ์สำคัญ)**:
      - วัยเด็กจนถึง 24 ปี: ร่างกาย สติปัญญา และ EQ เติบโตตามวัย
      - วัยผู้ใหญ่ช่วงหลัก (25–44 ปี): ความน่าเชื่อถือและ EQ มั่นคงสั่งสม
      - วัย 45+ ปี: ความอึดและความแข็งแรงลดลงช้าๆ ตามวัย (และ 60+ ปี รูปลักษณ์/ความจำ)
      - กิจวัตรดูแลสุขภาพตามแนวทางที่ 1 (เช่น ออกกำลังกายและนอนเต็มอิ่ม) จะช่วยค้ำยันและหักลบความเสื่อมถอยตามวัยได้
      - ภาระงานเกินเกณฑ์ (Overwork): หักความอึดทุกสัปดาห์หากชั่วโมงทำงานเกินเกณฑ์สมดุล
  - **แก้ไขจุดเชื่อมต่อไอคอนโซ่ในตารางสัปดาห์ (`src/engine/planner.ts`, `src/ui/components/LifePlannerPanel.tsx`, `src/data/uiText.ts`)**:
    - โซ่เชื่อมต่อระหว่าง **ทำงานประจำ (บ่าย)** <---> **ทำงานล่วงเวลา (เย็น)** ถูกต้องตามความเป็นจริง
    - ยกเลิกการแสดงโซ่เชื่อมลงไปยังช่องนอนดึก (เวลานอนไม่ใช่กะโอทีต่อเนื่อง)
    - ปลดล็อกช่องนอนดึก ไม่บังคับล็อกเป็น sleep_normal ผู้เล่นเลือกนอนเต็มอิ่มหรือนอนปกติได้อิสระ
    - เพิ่มฟังก์ชัน `hasDownwardChainConnector()` และปรับ `getSlotChainInfo()` ให้สะท้อนความเชื่อมโยงที่แท้จริง
  - **การจัดระเบียบแท็บงาน/ตัวตน และฟอนต์หลัก `TA 16 BIT` (`WorkStudyTab.tsx`, `MeTab.tsx`, `fonts.ts`, `index.css`)**:
    - ยุบแท็บย่อย `ตารางเวลา` ที่ซ้ำซ้อนใน `WorkStudyTab.tsx` ออก เหลือ `<LifePlannerPanel />` ไว้จุดเดียวในหน้า `งานและทักษะ` พร้อมปุ่มย่อ/ขยายหมวดฝึกทักษะและตลาดงานเพื่อลดการเลื่อนยาวบนมือถือ
    - ย้ายรายการ `กิจกรรมเฉพาะตัว (ปลดล็อก/ล็อกตามนิสัยและทักษะ)` จาก `MeTab.tsx` มาเป็นแท็บย่อย `กิจกรรมเฉพาะตัว` ใน `WorkStudyTab.tsx` เพื่อแยกบทบาทหน้า `ตัวตน นิสัย และทักษะ` ให้เป็นหน้าสำหรับดูรายละเอียดตัวละครโดยเฉพาะ และหน้า `งาน เรียน และเวลา` เป็นจุดกดลงมือทำ
    - ติดตั้งไฟล์ฟอนต์หลัก `TA 16 BIT` แท้ (`/public/fonts/TA-16-BIT.ttf` 98KB จากแพ็กเกจผู้สร้าง TA Font) และตั้งเป็น `DEFAULT_FONT_PRESET` ใน `src/ui/fonts.ts` และ `src/index.css` แทนที่การเรียก URL ภายนอกที่ไม่สมบูรณ์ พร้อมตัดฟอนต์สำรองที่สระเพี้ยนออกจากสแต็กหลัก
- **Patch Phase 3.2.2 (แก้ระบบโอทีและงานเสริมในกริดให้คำนวณเงินและช่องเวลาสมจริง)**: เสร็จสมบูรณ์
  - **คำนวณค่าล่วงเวลาและงานเสริมจากชั่วโมงจริงในกริด (`src/engine/planner.ts`, `src/engine/timeAlloc.ts`)**:
    - เพิ่ม `countOvertimeHoursPerWeek`, `getSlotWeeklyHours`, และ `computeOvertimeHourlyRate` คำนวณชั่วโมงโอทีจริงจากช่องที่จัดในกริด (`SLOT_HOURS` × `DAY_TYPE_WEIGHTS`, รวมถึงช่องดึก 6 ชม./วัน) คูณอัตรา `1.5x` ของค่าแรงรายชั่วโมงจากเงินเดือนประจำ (`monthlySalary`) พร้อมสเกลผลกระทบความเครียด พลังงาน ความสัมพันธ์ และหลักฐานตามชั่วโมงจริง
    - ปรับการคำนวณรายได้ `side_gig_work` ให้คิดเงินตามชั่วโมงจริงในกริดไม่เกินเพดานสัญญา (`Math.min(alloc.sideGig, maxHours)`) และรวมเข้า `previewPlannerImpact.netMoneyPerWeek` กับ `LifePlannerPanel.tsx` แบบเรียลไทม์ทั้งบนการ์ดช่องเวลาและกล่องสรุปผลคาดการณ์รายสัปดาห์
  - **ขยายช่องโอที ล็อกกะยาว `day_long` และเพดานชั่วโมงงานรวม (`src/data/activities.ts`, `src/data/lifeStages.ts`, `src/engine/planner.ts`)**:
    - ขยาย `overtime_work.allowedSlots` เป็นทุกช่วงเวลาที่ไม่ถูกกะหลักล็อก (`morning`, `afternoon`, `evening`, `night`) ทั้งวันธรรมดาและวันหยุด
    - ปรับ `getLockedWeekdaySlotsForJob` ให้กะยาว `day_long` (เช่น `small_business`) ล็อกครบ 3 ช่วง (`morning`, `afternoon`, `evening`) สอดคล้องกับ `skillTraining.ts`
    - เพิ่มเพดานชั่วโมงงานรวมสูงสุด (งานประจำ + โอที + งานเสริม) ใน `validatePlanner`: ผู้ใหญ่ (`18+`) ไม่เกิน **65 ชม./สัปดาห์** (`adultMaxWeeklyWorkHours` เพื่อรองรับงาน 9 ชม./วัน หรือกะยืดหยุ่น เช้า 4+บ่าย 5 = 45 ชม. คู่กับโอทีเย็นวันธรรมดา 20 ชม. = 65 ชม. พอดี) และผู้เยาว์ (`15–17 ปี`) ห้ามทำโอทีและงาน/เรียนรวมไม่เกิน **48 ชม./สัปดาห์** หากเกินจะแจ้งเตือนสีแดงพร้อมเหตุผลทันที
  - **ปรับพรีเซ็ต `workaholic` (`hustle`) รองรับกะยาวและเพดาน 65 ชม. (`applyPresetTemplate` ใน `src/engine/planner.ts`)**:
    - เมื่อกดพรีเซ็ต `workaholic` แล้วช่องเย็นวันธรรมดาถูกล็อก (เช่น งานกะยาว `day_long` หรือกะบ่าย–เย็น) หรือเกินเพดาน 65 ชม./สัปดาห์ ระบบจะวาง `overtime_work` ลงในช่องว่างถัดไปที่เหมาะสมให้อัตโนมัติ (เช่น เช้า/บ่ายวันหยุด)
  - **TODO ระยะถัดไป**:
    - **Phase 3.3**: ทักษะและการศึกษาไทย (ปวช./ปวส., แอดมิชชัน, ทุน, พัก/ลาออกจากการเรียน)
    - **Phase 3.4**: อาชีพและท่อสมัครงาน / สัมภาษณ์ / สมัครงานเสริมจริง / ฝึกงาน (`internship`)
    - **Phase 3.5**: สายบันเทิง/ไอดอล/สตรีมเมอร์เต็มระบบ และสายเทา/ใต้ดิน (18+)
    - **Phase 3.6**: เมนูการกระทำทันทีในฉากแบบ BitLife / ของใช้และพาหนะ / ร้านทำผม-ตู้เสื้อผ้า
    - **Phase 4**: ระบบ NPC, ความรัก, และครอบครัวเต็มรูปแบบ
- **Phase 3.2.3**: เสร็จสมบูรณ์ (เป้าหมายประจำปี + ปฏิทินรายปี + กิจกรรมปลดล็อก 5 รายการ + ความต่อเนื่อง + Autopilot ดูแลตัวเอง + Storylet ผูกตาราง 24 ใบ)
  - **เป้าหมายประจำปี (`src/data/annualFocus.ts`, `src/engine/planner.ts`, `src/engine/timeAlloc.ts`, `src/engine/digest.ts`)**:
    - ตั้งได้ตั้งแต่อายุ `13+` ปีในวันปีใหม่/วันเกิดหรือแท็บปฏิทินรายปี ข้ามได้ (คงค่าเดิม) เปลี่ยนได้สูงสุดปีละ **2 ครั้ง**
    - เสริมหลักฐานพฤติกรรมสะสม (**Evidence +10%**) สำหรับกิจกรรมในกริดที่ตรงเป้าหมาย (รวมถึง `overtime_work` และ `side_gig_work` เมื่อเลือก `save_money`), แนะนำพรีเซ็ตที่สอดคล้องพร้อมปุ่มลองใช้, และสร้างสรุปผลประจำปีแบบเทมเพลตล้วน (`generateAnnualFocusDigest`) ลงไทม์ไลน์หมวด `system` โดยไม่แทรกซ้ำหากมี `T3` ค้างรอตัดสินใจอยู่
  - **ปฏิทินรายปีอ่านอย่างเดียวและปักหมุดส่วนตัว (`getYearlyCalendarEvents`, `LifePlannerPanel.tsx`)**:
    - เปิดใช้แท็บ `ปฏิทินรายปี` แทนข้อความ `"เร็วๆ นี้"`, แสดงวันเกิด (14 พ.ค.), วันหยุดราชการไทย/ปิดเทอม (`clock.ts`), กำหนดจบคอร์สทักษะ, วันเงินเดือนออก/บิลวันที่ 1 และนัดหมายที่ผู้เล่นปักหมุด (`calendarPins` สูงสุด 24 หมุด) โดยยึด **Fog of Knowledge** ไม่เปิดเผย `echoQueue` หรือ `consequenceQueue`
  - **กิจกรรมที่ปลดล็อกได้ 5 รายการและการล็อกคืนอย่างสุภาพ (`src/data/activities.ts`, `src/engine/planner.ts`)**:
    - `university_club` (นักศึกษา 18+), `internship` (ล็อกด้วย `"รอระบบสมัครงาน 3.4"`), `stream_content` (`hobby_focus >= 6` + trait สร้างสรรค์ หรือ `flags.stream_unlocked`, รายได้ 0 บ. รอ Phase 3.5), `raise_child` (`flags.has_child` + 18+ และล็อกช่อง `weekend.evening`), และ `advanced_competition` (`workoutWeeks >= 8` หรือ `flags.competition_unlocked`)
    - เมื่อเงื่อนไขหมดอายุ (เช่น เรียนจบ/เปลี่ยนสถานะ) `sanitizePlannerWithRelockNotice` จะสลับกลับกิจกรรมพื้นฐานอย่างสุภาพพร้อมบันทึก `lastRelockReasonTh` และอธิบายผ่าน `explain(state, 'planner:relock')` โดยคงสัญญาของ `freelance_work` (Phase 3.2.2) ไว้ครบถ้วน
  - **ตัวนับความต่อเนื่องรายสัปดาห์ (`PlannerStreakState`, `updatePlannerStreaksWeekly`)**:
    - อัปเดตใน `pipeline.onWeek()` แบบ Pure Deterministic 100% (ไร้ RNG) ครอบคลุม `presetWeeks`, `overtimeWeeks`, `workoutWeeks`, `sleepDeficitWeeks`, `sleepFullWeeks`, `clubWeeks`, `streamUnlockedWeeks`, `mismatchPresetWeeks`, `studyTeenWeeks`, และ `socialKidsPlayWeeks`
  - **คำสั่งประจำดูแลตัวเองและครอบครัว (`SelfCareOrders` ใน `src/data/autopilot.ts`, `src/engine/autopilot.ts`, `StandingOrdersPanel.tsx`)**:
    - ตรวจสุขภาพประจำปี (`off` / `basic_500` / `private_3500`, อายุ `18+`): `private_3500` เพิ่มสมรรถภาพกาย `+3` (`strength`/`endurance` +4.7), ลดความเสี่ยงป่วยหนัก (`hazardMultiplier`), และลดวันเตือนล่วงหน้าใน `director.ts`
    - ดูแลบุคลิก/ทำสีผมรายเดือน (`500` บ./เดือน, อายุ `15+`) และส่งเงินให้ครอบครัว (`5%` / `15%`, อายุ `18+`)
    - รองรับ **Auto-Pause และ Auto-Resume อัตโนมัติ** ตามเพดานเงินสำรอง `lowCashThreshold` พร้อมป้ายสถานะพักชั่วคราวและคำอธิบายผ่าน `explain(state, 'autopilot:selfCare')`
  - **คลัง Storylet ผูกตาราง 24 ใบและเครื่องมือ Dev (`src/data/storylets/plannerStorylets.ts`, `src/data/storylets/catalog.ts`, `TopBar.tsx`)**:
    - เพิ่ม Storylet ใหม่ 24 ใบ (`planner_01`..`planner_24`) รวมคลังเป็น **69 ใบ** (ระดับ: `T0 8`, `T1 18`, `T2 36`, `T3 7` | หมวด: `work 12`, `romance 2`, `family 10`, `health 15`, `finance 8`, `social 16`, `quirky 5`, `system 1`) ผ่าน `validateStorylet` 100% พร้อม `isMinorSafe` ในใบ #19/#20, ใบปลดล็อก #9 (`competition_unlocked`), #15 (`stream_unlocked`), และหมวด `system` ในใบ #24
    - เพิ่มปุ่มกรอง `ตารางชีวิต (24)`, สวิตช์ Flags (`has_child`, `stream_unlocked`, `competition_unlocked`, `freelance_unlocked`), ปุ่มตั้ง Streak ทดสอบ, และปุ่มทดสอบการ์ดเป้าหมายประจำปีในหน้าต่าง Dev ของ `TopBar.tsx`
  - **ความต่างระหว่างเอกสาร 06 §9 กับโค้ดจริง & TODO คงค้าง**:
    - ในโค้ดปัจจุบัน `clock.ts` รัน `onYear()` (เพิ่มอายุและฉลองวัยใหม่) ในวันที่ 1 ม.ค. ขณะที่วันเกิดเริ่มต้นในปฏิทินคือ 14 พ.ค. (`onBirthday`) จึงรันการสรุปผล/ต่ออายุเป้าหมายและตรวจสุขภาพประจำปีใน `onYear()` ให้สอดคล้องกับระบบอายุจริงของเกม (และแสดง 14 พ.ค. ในปฏิทินรายปีตามปกติ)
    - ชื่อตัวตน/Trait ในโค้ดจริงใช้ `solitude_lover` (ไม่ใช่ `solitary_hobbyist` ในร่างสเปค)
    - รายการรอ Phase ถัดไป: `internship` รอ Phase 3.4, `raise_child` รอ NPC ลูกใน Phase 4, รายได้สตรีมเมอร์รอ Phase 3.5, และฉาก ยิม/ห้องสมุด/ห้างสรรพสินค้า ใช้ฉากสำรองใน `sceneManifest.json`
- **Patch เก็บตก Phase 3.2.3**: เสร็จสมบูรณ์ (Auto-Save & Resume + คำแนะนำทักษะในกริด + ปรับปรุงการกระทำพิเศษและ Storylet Toast + ลดโหมดหน้าแรกเหลือ 2 โหมด)
  - **ระบบเซฟอัตโนมัติและเล่นต่อ (`src/engine/save.ts`, `MainGameScreen.tsx`, `LifeGenScreen.tsx`, `SaveLoadModal.tsx`)**:
    - แยกช่อง `AUTOSAVE_SLOT_ID = 'autosave'` ออกจากช่องเซฟแมนนวล 4 ช่อง (`slot_1`..`slot_4`) พร้อมฟังก์ชัน `saveAutosave` / `loadAutosave`
    - บันทึกอัตโนมัติใน 3 จังหวะโดยไม่กระทบเฟรมเรต: (1) ทุกวันจันทร์ในเกม, (2) ทันทีเมื่อตอบเหตุการณ์ (`RESOLVE_PROMPT`) หรือยืนยันตารางแผนชีวิต (`CONFIRM_LIFE_PLANNER`), และ (3) เมื่อสลับแท็บหรือพับหน้าจอบนมือถือ (`visibilitychange === 'hidden'` และ `pagehide`)
    - เพิ่มปุ่มเด่น `"เล่นต่อจากเซฟอัตโนมัติ (ชื่อตัวละคร • อายุ X ปี)"` ด้านบนสุดของหน้าแรก (`LifeGenScreen.tsx`) และรองรับการโหลดผ่าน `SaveLoadModal`
  - **การแสดงผลทักษะและการกระทำพิเศษ (`planner.ts`, `LifePlannerPanel.tsx`, `traits.ts`, `WorkStudyTab.tsx`, `state.ts`)**:
    - เพิ่ม `hasSelfDevSlot` ใน `previewPlannerImpact`: เมื่อตั้งโฟกัสทักษะไว้แต่ไม่มีช่องหมวดพัฒนาตัวเอง (`self_dev`) ในตารางและไม่มีการเติบโตอื่น จะแสดงคำแนะนำชัดเจนให้ใส่กิจกรรมพัฒนาตัวเองอย่างน้อย 1 ช่อง
    - ลบ `apply_overtime` ออกจาก `TRAIT_GATED_ACTIONS` (ให้จัดการโอทีผ่านช่อง `overtime_work` ในกริดตารางเป็นหลัก), ปรับคำอธิบายใน `WorkStudyTab.tsx` เป็น `"การกระทำพิเศษตามนิสัยและทักษะ"`, และแสดง Toast ผลลัพธ์ทุกครั้งที่กดทำ
    - เพิ่ม `attachStoryletFeedbackToast` ใน `RESOLVE_PROMPT`: เมื่อเหตุการณ์ปลดล็อกกิจกรรมใหม่ในตาราง (`stream_unlocked`, `competition_unlocked`, `freelance_unlocked`, `has_child`) หรือเพิ่ม `RecordEvidence` ระบบจะสร้าง `ActiveToast` ภาษาไทย (แปลผ่าน `translateEvidenceKey` ไร้คีย์ดิบ) แจ้งผู้เล่นทันที
  - **หน้าแรกเริ่มชีวิตเหลือ 2 โหมดหลัก (`src/ui/screens/LifeGenScreen.tsx`)**:
    - ปรับตัวเลือก UI เหลือ `1. สุ่มชีวิตใหม่` (`random`) และ `2. กำหนดชะตาเอง` (`custom`, รองรับอายุ 0–65 ปี) โดยยังคงโหมด `'at_age'` ในชั้น Engine (`lifegen.ts`) ไว้เพื่อความเข้ากันได้กับเซฟและชุดทดสอบเดิม

---

## 6. การตัดสินใจสำคัญและเหตุผล / ปัญหาที่พบ

1. **State-threaded `rngState` ภายใน `GameState`**:
   - เก็บ `rngState: number` ไว้ใน `GameState` โดยตรง ทำให้ `stepOneTick(state)` เป็น Pure Function 100% และ Save/Load หรือ Replay กลางเกมได้ตรงกัน 100% ระหว่าง `x1` กับ `x20`
2. **การแยก `recordLogs` ใน `stepOneTick` สำหรับ Headless Simulator**:
   - เพิ่ม option `{ allowPrompts: false, recordLogs: false }` โดยคงคณิตศาสตร์ RNG และสถานะทั้งหมดไว้เหมือนเดิมเพื่อความเร็วในการจำลอง 1,000+ ชีวิต
3. **ปัญหาสมดุลจากการรัน Simulator 1,000 ชีวิตครั้งแรก**:
   - ปรับเกณฑ์ ปวช. ให้จบได้ที่อายุ 18 (ยังคงล็อก ป.เอก ที่อายุ <= 25), เพิ่ม Stress Homeostasis, การเข้าตลาดแรงงานอัตโนมัติเมื่ออายุ 23 ปี, และเพดานดอกเบี้ยเมื่อหนี้เกิน 500,000 บาท
4. **สาเหตุและการแก้บั๊ก Phase 1.5 (A1 & A2)**:
   - **A1**: เดิม `MainGameScreen` เรียก `setSpeed(0)` เมื่อ `needsPlayer` เป็นจริงโดยไม่เก็บความเร็วก่อนหน้า จึงเพิ่ม `lastActiveSpeed` และสั่งกลับไปใช้ `lastActiveSpeed` ทันทีที่ `RESOLVE_PROMPT` ผ่านและตัวละครยังมีชีวิต
   - **A2**: เดิม `estimateMonthlyExpenses` และ `stepRoutine` หักค่ากินอยู่รายวัน (`BASE_MONTHLY_LIVING_COST`) จากเด็กและผู้เยาว์ที่อยู่ `parents_home` ทั้งที่ยังไม่มีรายได้ จึงปรับให้เด็ก `< 15` มีเศรษฐกิจส่วนตัวเป็น 0 และผู้เยาว์ `< 18` ที่อยู่ `parents_home` ไม่เสียค่าเช่า/ค่ากินอยู่ พร้อมเพิ่มอาชีพ `infant` และอัปเกรดวัยเรียน 6 -> 12 -> 15 -> 18 ปีใน `onYear`
5. **การแยก UI Attention Budget (`Date.now()`) ออกจาก Simulation Loop (`stepOneTick`)**:
   - ให้ `MainGameScreen` ตัดสินใจเรื่องเวลาจริงของ UI Attention Budget และสั่ง `RESOLVE_AUTOPILOT_PROMPT` ผ่าน Action Log ทำให้ RNG ของ `stepOneTick` ยังคง Deterministic 100% ระหว่าง `x1` กับ `x20` และทำ Replay ซ้ำได้แม่นยำ

---

## 7. วิธีรันการทดสอบและ Simulator

- รัน Unit Tests ทั้งหมด (รวม Phase 3 และความสอดคล้องข้าม Phase): `npm test`
- รัน Unit Tests เฉพาะ Phase 3.2.1–3.2.3: `npx tsx src/tests/phase321Tests.ts`, `npx tsx src/tests/phase322Tests.ts`, และ `npx tsx src/tests/phase323Tests.ts`
- ตรวจจับอิโมจิใน `src/ui` และ `src/data`: `npm run check:emoji`
- รัน Headless Simulator 1,000 ชีวิต: `npm run sim`
- ตรวจสอบ TypeScript และ Build: `npm run lint` และ `npm run build`


