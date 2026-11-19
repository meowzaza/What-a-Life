# CODE_MAP.md — แผนที่ไฟล์โค้ด ฟังก์ชันหลัก และโครงสร้างข้อมูล

> **วิธีใช้สำหรับ AI:**
> - เปิดไฟล์นี้ก่อนเสมอเมื่อต้องการรู้ว่าฟีเจอร์ไหนอยู่ในไฟล์ใด หรือต้องเรียกใช้ฟังก์ชันชื่ออะไร เพื่อจะได้ไม่ต้องเปิดอ่านไฟล์ใน `src/` ทั้งหมด
> - **สิทธิ์การอัปเดตไฟล์โดย AI:** เมื่อสร้างไฟล์ใหม่หรือเพิ่มฟังก์ชันสำคัญตามคำสั่งที่ผู้ใช้ตกลงแล้ว ให้อัปเดตตารางนี้ให้ตรงกับโค้ดจริงก่อนจบงาน
> - **ตรวจล่าสุดกับโค้ดจริงเมื่อ 2026-11-18:** ชื่อฟังก์ชันด้านล่างดึงจาก `export` ในโค้ดจริง (รายการเดิมมีชื่อฟังก์ชัน/ไฟล์ที่ไม่มีอยู่จริง จึงเขียนใหม่ทั้งหมด) ตารางแสดงเฉพาะ export หลัก ไม่ครบทุกตัว
> - ไฟล์ที่ **ยังไม่มี** แต่อยู่ในแผน (เช่น Echo Queue, Twist) ให้ดู `ROADMAP.md` ไม่ใช่ตารางนี้

---

## 1. ชั้น Pure Engine (`src/engine/`) — ห้าม import React / ห้ามใช้ `Math.random`

| ไฟล์ | หน้าที่หลัก | export หลักที่เรียกใช้ได้ |
| :--- | :--- | :--- |
| `src/engine/appearance.ts` | คัดกรองภาพตัวละคร 332 ตัว เปลี่ยนร่างตามวัย ประเมินผลกระทบสีผม/ชุด | `hasKnownEyeColor()`, `getAppearanceStage()`, `getAppearanceStageLabel()`, `getAllManifestEntries()`, `getManifestEntry()`, `getAppearanceAgeBand()`, `createAppearanceRngState()`, `revealGeneticEyeColor()` `APPEARANCE_TAG_CATEGORY_LABELS`, `APPEARANCE_TAG_CATEGORY_ORDER`, `APPEARANCE_TAG_META` |
| `src/engine/autopilot.ts` | คำสั่งประจำอัตโนมัติ (ตรวจสุขภาพประจำปี/รักษาลุค/ส่งเงินครอบครัว) และสรุปช่วงเวลา | `deriveRiskProfileFromTraits()`, `createDefaultStandingOrders()`, `evaluateStandingOrders()`, `autopilotDecide()`, `buildAutopilotSituation()`, `maybeRollMonthlyAutopilotEvent()`, `resolveAutopilotWithOption()`, `buildPeriodDigest()` |
| `src/engine/clock.ts` | คำนวณวัน เดือน ปี พ.ศ. และวันหยุดไทย/ปิดเทอม | `isLeapYearCE()`, `getDaysInMonth()`, `createDate()`, `advanceOneDay()`, `toBuddhistYear()`, `formatThaiDate()`, `formatShortThaiDate()`, `getMonthProgressRatio()` `BASE_MS_PER_DAY` |
| `src/engine/dayPlan.ts` | สร้างตาราง 4 ช่องของวัน (เช้า/บ่าย/เย็น/ดึก) และเลือกฉาก/คำพูด | `buildDayPlan()`, `getDayPlan()`, `getHighlightSlot()`, `getSlotActivityLabel()`, `getSlotActivityWhereLabel()`, `getActivitySpeechText()` |
| `src/engine/digest.ts` | สรุปช่วงเวลาเมื่อเร่งความเร็วและสรุปเป้าหมายประจำปี | `buildEnhancedDigest()`, `generatePeriodDigestFromStates()`, `generateAnnualFocusDigest()` |
| `src/engine/director.ts` | Event Director: คัดเหตุการณ์ T0-T3 ตามงบความตึงเครียด คูลดาวน์ และจัดการการ์ดตัดสินใจ | `createInitialDirectorState()`, `shouldInterruptWithAttentionBudget()`, `stepEventDirector()`, `fireStorylet()`, `resolveStoryletChoice()`, `resolveAutopilotPromptDecision()` `T2_COOLDOWN_DAYS`, `T3_COOLDOWN_DAYS` |
| `src/engine/economy.ts` | รายรับ-รายจ่าย วงเงินกู้ เงื่อนไขงาน/งานเสริม/ที่อยู่ (ตรวจอายุผู้เยาว์ที่นี่) | `getRegionCostMultiplier()`, `calculateCreditLimit()`, `estimateMonthlyExpenses()`, `recalculateEconomyDerived()`, `checkSideGigEligibility()`, `checkJobEligibility()`, `checkHousingEligibility()` `BASE_MONTHLY_LIVING_COST`, `MONTHLY_DEBT_INTEREST_RATE`, `MIN_DEBT_PAYMENT_RATE` |
| `src/engine/education.ts` | ประเภทโรงเรียน แผนการเรียน ม.ปลาย คำนวณ GPA ปลายเทอม ติด ร. รด. และ กศน./ม.เปิด | `createInitialEducationState()`, `discoverSkillOnState()`, `canTransferSchoolTier()`, `applyChangeSchoolTier()`, `applyChooseHighSchoolTrack()`, `applyEnrollRotc()`, `applyEnrollSecondChanceEdu()`, `computeTermGpaValue()`, `evaluateAcademicTermEnd()` |
| `src/engine/evidence.ts` | สะสมหลักฐานพฤติกรรมรายสัปดาห์เพื่อใช้งอก/จางนิสัย | `getEvidenceValue()`, `recordEvidence()`, `recordEvidenceBatch()`, `decayEvidenceWeekly()`, `recordJobWeeklyEvidence()` |
| `src/engine/explain.ts` | สร้างคำอธิบายภาษาไทยสำหรับปุ่ม "ทำไม?" | `cleanDisplayReason()`, `explain()` |
| `src/engine/lifeStage.ts` | ช่วงวัย กฎจ้างงานตามอายุ และอัปเดตเมื่อขึ้นปีใหม่ | `getLifeStageForAge()`, `getLifeSubStageId()`, `getAgeEmploymentRules()`, `canWorkPartTime()`, `canEnterNightlife()`, `onBirthdayLifeStageUpdate()` |
| `src/engine/lifegen.ts` | สร้างตัวละคร ครอบครัว ปูมหลัง และตรวจความสมเหตุสมผลของชีวิตที่สุ่ม | `getMaxPlausibleEducation()`, `enforceEducationPlausibility()`, `validateLifePlausibility()`, `generateLife()` |
| `src/engine/log.ts` | ไทม์ไลน์เหตุการณ์ สรุปและประยุกต์ Effect ลงสถานะ | `appendTimeline()`, `summarizeEffects()`, `applyEffects()` |
| `src/engine/pipeline.ts` | ท่อประมวลผลหลักต่อ 1 วัน (onDay > onWeek > onMonth > onYear) และข้ามไปเหตุการณ์สำคัญ | `stepOneTick()`, `skipToNextMilestone()`, `getReadableDateHeader()` |
| `src/engine/planner.ts` | ตัวหลักจัดการกริดตารางแผนชีวิต 2x4 โอที/กะงาน การตรวจกฎและพรีวิวผล | `clonePlannerGrid()`, `isHospitalAdmitted()`, `getArchetypeForState()`, `resolveEmploymentState()`, `getLockedWeekdaySlotsForJob()`, `isSlotLocked()`, `getSlotDailyHours()`, `getSlotWeeklyHours()` |
| `src/engine/rng.ts` | ตัวสุ่มเทียม Deterministic (mulberry32) ใช้ rngState ส่งต่อทุกการตัดสินใจ | `normalizeSeed()`, `nextRandom()`, `randInt()`, `randRange()`, `randNormalApprox()`, `pickOne()`, `weightedPick()`, `clamp()` |
| `src/engine/save.ts` | เซฟ/โหลดผ่าน IndexedDB (4 ช่องแมนนวล + autosave) พร้อม hydrate/migrate | `buildSavePayload()`, `hydrateLoadedGameState()`, `hydrateLoadedSaveSlot()`, `saveToIndexedDB()`, `loadFromIndexedDB()`, `listSaveSlotsFromIndexedDB()`, `deleteSaveSlotFromIndexedDB()`, `saveAutosave()` `AUTOSAVE_SLOT_ID`, `MANUAL_SAVE_SLOTS`, `SAVE_SLOTS` |
| `src/engine/scene.ts` | ตรวจเวลาเปิด-ปิดฉาก ประตูอายุ และเลือกฉาก/ฉากสำรอง | `resolveDaypart()`, `pickHomeSceneForState()`, `pickSceneForState()`, `resolveSceneWithMeta()`, `resolveScene()`, `getSceneModeRemainingDays()`, `isSceneOpen()`, `sceneImagePath()` `ALL_DAYPARTS`, `SCENE_MANIFEST`, `SCENES_BY_ID` |
| `src/engine/skillTraining.ts` | ระบบฝึกทักษะ 2 ชั้น (13 ทักษะ) ขั้นบันได 3 ขั้น คอร์สเรียน และค้นพบผ่านแท็กกิจกรรม | `createInitialSkillTrainingState()`, `zeroSkillRecord()`, `isCoreSkill()`, `isSkillVisible()`, `getVisibleSkills()`, `getSkillTier()`, `isTier2Unlocked()`, `isTier3Unlocked()`, `getEffectiveSkillCap()`, `computeAptitudeMult()`, `computeTraitMult()`, `computeAgeMult()`, `canEnrollCourse()`, `recordActivitySkillTagProgress()`, `getSkillGrowthDetails()`, `applyWeeklySkillTraining()` `ALL_SKILL_KEYS` |
| `src/engine/state.ts` | Reducer/dispatch หลักเชื่อม UI Actions กับ Pure Engine และ Replay | `createInitialGameState()`, `dispatchPlayerAction()`, `replayGameState()` `ENGINE_VERSION` |
| `src/engine/stats.ts` | คำนวณดัชนีหลัก 6 ตัวและอธิบายสเตตัส | `computeLifeIndices()`, `explainStat()` |
| `src/engine/storylet.ts` | Validator ตรวจ Storylet เงื่อนไข/ตัวเลือก/ผลลัพธ์ และเรนเดอร์ข้อความ | `validateStorylet()`, `filterValidatedStorylets()`, `isTwistPlausible()`, `isStoryletEligible()`, `isLifestylePresetMismatchWithTraits()`, `evaluateStoryletChoice()`, `filterStoryletChoices()`, `renderStoryletText()` `MAX_INSTANT_CASH_GAIN`, `MAX_INSTANT_CASH_LOSS` |
| `src/engine/talents.ts` | สุ่มพรสวรรค์หลายชนิด 3 ระดับ เพดานกลาง +40% ลางบอก และข้อจำกัดที่รักษาหาย | `computeCombinedModifierWithCap()`, `getActiveTalents()`, `getActiveLimitations()`, `computeTalentSkillBonus()`, `computeLimitationSkillPenaltyMultiplier()`, `computeCombinedSkillMultiplier()`, `getDiscoveryThresholdReduction()`, `computeTalentGpaDelta()`, `getTalentHintText()`, `rollInitialTalentsAndLimitations()`, `revealTalentById()`, `advanceLimitationCureProgress()`, `getAllKnownTalentDefsCount()` |
| `src/engine/timeAlloc.ts` | แปลงกริดเป็นชั่วโมง 168 ชม./สัปดาห์ ตรวจกฎผู้เยาว์ และคิดผลรายสัปดาห์ | `evaluatePresetAvailability()`, `getDefaultTimeAllocation()`, `applyLifestylePreset()`, `validateTimeAllocation()`, `sanitizeTimeAllocation()`, `getDominantNightDaypart()`, `getJobContractWeeklyHours()`, `previewTimeAllocationEffects()` |
| `src/engine/traitEffects.ts` | ผลของนิสัยต่อตัวเลือกที่ทำได้ ความเสี่ยง Autopilot และมุมมองชื่อเสียง | `filterAvailableActions()`, `hazardModifiers()`, `getAutopilotTraitBiases()`, `computeReputationViews()` |
| `src/engine/traits.ts` | ประเมินการงอก/จางของนิสัยจาก Evidence และจุดเปลี่ยน | `initTraitsForPerson()`, `buildTraitTagList()`, `meetsLayerGates()`, `computeInnerTensionFromTraits()`, `getConflictingTraitPairs()`, `computeReputationFromTraits()`, `intensityFromScore()`, `translateEvidenceKey()` `EVIDENCE_LABELS_TH` |
| `src/engine/types.ts` | นิยาม Type ทั้งหมดของเกม (GameState, CharacterState, Storylet, Effect ฯลฯ) แหล่งความจริงของโครงสร้างข้อมูล | แหล่งความจริงของโครงสร้างข้อมูลทั้งหมด |

---

## 2. ชั้นข้อมูลและเนื้อหา (`src/data/`)

| ไฟล์ | เนื้อหาภายใน | export หลัก |
| :--- | :--- | :--- |
| `src/data/activities.ts` | แคตตาล็อกกิจกรรม 6 หมวดใหญ่ + กิจกรรมย่อย + เงื่อนไขปลดล็อก | `ACTIVITY_MAJOR_GROUPS`, `ACTIVITY_GROUPS_BY_ID`, `ACTIVITY_CATALOG`, `ACTIVITIES_BY_ID` |
| `src/data/annualFocus.ts` | เป้าหมายประจำปี | `ANNUAL_FOCUS_CONFIG`, `ANNUAL_FOCUS_LIST`, `ANNUAL_FOCUS_BY_ID` |
| `src/data/autopilot.ts` | ค่าคอนฟิกและป้ายของคำสั่งประจำ/Autopilot | `SELF_CARE_ORDER_CONFIG`, `DEFAULT_SELF_CARE_ORDERS`, `RISK_PROFILE_META`, `STANDING_CONDITION_LABELS` |
| `src/data/characterManifest.json` | เมตาดาตาตัวละคร PNG 332 ตัว | - |
| `src/data/education.ts` | ประเภทโรงเรียน 4 ระดับ แผนการเรียน ม.ปลาย 4 สาย โปรแกรม กศน./ม.เปิด และกฎปิดเทอม | `SCHOOL_TIERS`, `SCHOOL_TIER_ORDER`, `HIGH_SCHOOL_TRACKS`, `FINE_ART_TRACK_CHOICES`, `SECOND_CHANCE_PROGRAMS`, `EDUCATION_SYSTEM_RULES` |
| `src/data/lifeStages.ts` | ช่วงวัย `LIFE_STAGES` และกฎแรงงานผู้เยาว์ `AGE_LEGAL_RULES` (แก้ตรงนี้เมื่อทำกติกาอายุใหม่ใน 3.3.3) | `LIFE_STAGES`, `AGE_LEGAL_RULES` |
| `src/data/lifestylePresets.ts` | พรีเซ็ตวิถีชีวิต (เก็บไว้สำหรับ Migration) | `LIFESTYLE_PRESETS`, `LIFESTYLE_PRESETS_BY_ID` |
| `src/data/lifestyleTemplates.ts` | แม่แบบกริดแผนชีวิตของแต่ละพรีเซ็ตตามช่วงวัย | `getTemplateForPresetAndArchetype` |
| `src/data/sceneManifest.json` | รายการฉากพิกเซลทั้งหมดที่ `engine/scene.ts` อ่านเข้ามา | - |
| `src/data/sceneMeta.ts` | ข้อมูลเสริมของฉาก (เวลาเปิด-ปิด อายุขั้นต่ำ ฉากสำรอง) และ `deriveClassTier` | `SCENE_META_CATALOG`, `SCENE_META_BY_ID`, `deriveClassTier`, `pickSceneByTagAndTier` |
| `src/data/sceneRules.ts` | re-export ฟังก์ชันเลือกฉากจาก `engine/scene.ts` (ไม่มีลอจิกของตัวเอง) | - |
| `src/data/skills.ts` | ทะเบียนทักษะหลัก 6 + ค้นพบ 7 (13 ทักษะ) และแท็กกิจกรรมค้นพบอิสระ 13 แท็ก | `CORE_SKILL_IDS`, `DISCOVERED_SKILL_IDS`, `ALL_SKILL_IDS`, `DISCOVERY_THRESHOLD_SESSIONS`, `DISCOVERY_THRESHOLD_HOURS`, `SKILL_CATALOG`, `ACTIVITY_SKILL_TAGS`, `HOBBY_SELECTABLE_TAGS`, `COURSE_CLUB_SELECTABLE_TAGS`, `getSkillsForActivityTag()` |
| `src/data/skillTraining.ts` | ข้อมูลทักษะ ขั้นบันได 3 ขั้น และคอร์สเรียน | `SKILL_TIERS`, `SKILL_TRAINING_CONFIG`, `SKILL_APTITUDE_STATS`, `SKILL_TRAIT_MULTIPLIERS`, `SKILL_UNLOCK_RULES` |
| `src/data/slotHours.ts` | ชั่วโมงของแต่ละช่องในกริด และเวลานอนพื้นฐาน | `ALL_SLOTS`, `ALL_DAY_TYPES`, `SLOT_HOURS`, `BASE_DAILY_SLEEP_AND_ROUTINE_HOURS` |
| `src/data/storylets/ageAndEduStorylets.ts` | คลังเหตุการณ์ตามวัย 6–22 ปี (ประถม/ม.ต้น/ม.ปลาย/มหาวิทยาลัย) | `AGE_AND_EDU_STORYLETS` |
| `src/data/storylets/catalog.ts` | คลัง Storylet พื้นฐานทุกช่วงวัย (ผ่านการ validate) | `RAW_STORYLET_CATALOG`, `STORYLET_CATALOG` |
| `src/data/storylets/directorConfig.ts` | ค่าปรับแต่ง Event Director (ตารางข้อมูลล้วน) | `DIRECTOR_CONFIG`, `ALLOWED_STORYLET_EFFECT_TYPES` |
| `src/data/storylets/plannerStorylets.ts` | คลัง Storylet ผูกตารางแผนชีวิตและเป้าหมายรายปี | `PLANNER_STORYLETS` |
| `src/data/talents.ts` | นิยามพรสวรรค์ 19 ชนิด ข้อจำกัดแก้ได้ 8 ชนิด น้ำหนักเกิด และเพดานกลาง +40% | `CENTRAL_MODIFIER_CAP`, `TALENT_MAX_ACTIVE_SLOTS`, `TALENT_TIER_BONUSES`, `TALENT_DISCOVERY_THRESHOLD_REDUCTION`, `TALENT_COUNT_WEIGHTS`, `POSITIVE_TALENT_DEFS`, `LIMITATION_DEFS`, `TALENT_DEFS_BY_ID` |
| `src/data/thaiData.ts` | ภูมิภาค อาชีพ ค่าครองชีพ ชื่อคนไทย และข้อมูลพื้นฐานสังคมไทย | `REGIONS`, `FIRST_NAMES`, `LAST_NAMES`, `NICKNAMES_MALE`, `createEmploymentForJob`, `validateJobsScheduleInDev` |
| `src/data/timeAlloc.ts` | หมวดชั่วโมง 168 ชม. เพดานนอนขั้นต่ำ/เกณฑ์ทำงานหนักตามวัย | `TOTAL_WEEKLY_HOURS`, `TIME_ALLOC_CATEGORIES`, `STAGE_MIN_SLEEP_HOURS`, `STAGE_OVERWORK_THRESHOLD` |
| `src/data/traits.ts` | นิยามนิสัย `TRAIT_CATALOG` เกณฑ์ Evidence และการกระทำเฉพาะตัว | `TEMPERAMENT_VECTORS`, `PERSONALITY_AXIS_META`, `TRAIT_CATEGORY_META`, `TRAIT_INTENSITY_META` |
| `src/data/uiText.ts` | ข้อความภาษาไทยทั้งหมดของ UI (ห้ามมีอิโมจิ) | `UI_TEXT` |

> จำนวน Storylet ให้นับจากโค้ด (`STORYLET_CATALOG`) ไม่ต้องจดตัวเลขในเอกสาร

---

## 3. ชั้นส่วนติดต่อผู้ใช้ (`src/ui/`) และชุดทดสอบ (`src/tests/`)

- **entry:** `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/ui/theme.ts`, `src/ui/fonts.ts`
- **หน้าจอ (`src/ui/screens/`):** `LifeGenScreen.tsx`, `MainGameScreen.tsx`, `SceneDebugScreen.tsx` — `LifeGenScreen` หน้าแรก/สร้างชีวิต · `MainGameScreen` หน้าเล่นหลัก · `SceneDebugScreen` ดีบักฉาก
- **คอมโพเนนต์ (`src/ui/components/`):** `CelebrationToast.tsx`, `CharacterGalleryModal.tsx`, `ChoiceCard.tsx`, `ExplainPanel.tsx`, `FontSettingsModal.tsx`, `LifePlannerPanel.tsx`, `SaveLoadModal.tsx`, `SceneStage.tsx`, `SixIndicesBar.tsx`, `StandingOrdersPanel.tsx`, `TimeAllocPanel.tsx`, `TimeControls.tsx`, `TimelineFeed.tsx`, `TopBar.tsx`
- **แท็บข้อมูล (`src/ui/components/tabs/`):** `FinanceTab.tsx`, `JournalTab.tsx`, `MeTab.tsx`, `RelationshipsTab.tsx`, `WorkStudyTab.tsx`
- **งานภาพพิกเซล (`src/ui/art/`):** `Avatar.tsx`, `Celebration.tsx`, `CharacterSprite.tsx`, `EffectChip.tsx`, `EventArt.tsx`, `IndexIcon.tsx`, `MoodFace.tsx`, `PixelIcons.tsx`, `SceneArt.tsx`
- **ชุดทดสอบ (`src/tests/`):** `checkEmoji.ts`, `phase321Tests.ts`, `phase322Tests.ts`, `phase323Tests.ts`, `phase331Tests.ts`, `phase331FixTests.ts`, `runTests.ts`, `sim1000.ts` (เอกสารรอบนี้ตัดเรื่อง testing/handoff ออก แต่ไฟล์ทดสอบยังอยู่ในโค้ด)
