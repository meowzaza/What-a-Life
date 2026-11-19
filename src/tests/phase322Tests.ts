import assert from 'node:assert/strict';
import { LIFESTYLE_PRESETS } from '../data/lifestylePresets';
import { TOTAL_WEEKLY_HOURS } from '../data/timeAlloc';
import { UI_TEXT } from '../data/uiText';
import { buildDayPlan } from '../engine/dayPlan';
import { explain } from '../engine/explain';
import { stepOneTick } from '../engine/pipeline';
import {
  applyPresetTemplate,
  computeFreelanceWeeklyPreview,
  computeOvertimeHourlyRate,
  computeOvertimeWeeklyImpact,
  countOvertimeHoursPerWeek,
  deriveWeeklyAllocation,
  getSlotActivity,
  getSlotChainInfo,
  isActivityAvailableInSlot,
  isSlotLocked,
  previewPlannerImpact,
  validatePlanner,
} from '../engine/planner';
import { hydrateLoadedGameState } from '../engine/save';
import { createInitialGameState, dispatchPlayerAction } from '../engine/state';
import { applyWeeklyTimeAllocation } from '../engine/timeAlloc';
import type { GameState, LifeGenRequest, PlannerGrid } from '../engine/types';

function sumAlloc(alloc: NonNullable<GameState['timeAllocation']>): number {
  return (
    alloc.sleep +
    alloc.workOrStudy +
    alloc.sideGig +
    alloc.social +
    alloc.hobby +
    alloc.family +
    alloc.selfDev +
    alloc.nightlife
  );
}

// Test 1: Grid edits, work shifts (night-morning daytime sleep & flexible), freelance, and all unlocked presets derive strictly 168h
function test1_DerivedHoursAlwaysSumTo168() {
  const ages = [3, 9, 16, 25, 65];
  for (const age of ages) {
    const base = createInitialGameState({
      mode: 'at_age',
      seed: 100322 + age,
      atAge: { targetAge: age, wealthFocus: 'average' },
    });
    const stateWithGig: GameState =
      age >= 15
        ? {
            ...base,
            sideGigRecord: {
              id: 'gig_planner_test',
              title: 'ช่วยงานร้านกาแฟ',
              sceneId: 'cafe',
              hourlyPay: 100,
              maxWeeklyHours: 16,
              isNightShift: false,
              hiredAtTotalDay: 0,
            },
          }
        : base;

    const initialDerived = deriveWeeklyAllocation(stateWithGig.planner!.grid, stateWithGig);
    assert.equal(sumAlloc(initialDerived), TOTAL_WEEKLY_HOURS, `Initial grid at age ${age} must sum to 168`);

    for (const preset of LIFESTYLE_PRESETS) {
      const applied = applyPresetTemplate(preset.id, stateWithGig);
      if (!applied.accepted) continue;
      const alloc = deriveWeeklyAllocation(applied.grid, applied.state);
      assert.equal(sumAlloc(alloc), TOTAL_WEEKLY_HOURS, `Preset ${preset.id} at age ${age} must sum to 168`);
    }
  }

  // Night shift worker switching to night-morning + afternoon recovery sleep + flexible shift = 168h
  let worker = createInitialGameState({
    mode: 'at_age',
    seed: 110322,
    atAge: { targetAge: 24, education: 'bachelor', wealthFocus: 'average' },
  });
  worker = dispatchPlayerAction(worker, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;
  const nightRes = dispatchPlayerAction(worker, {
    type: 'CHANGE_WORK_SHIFT',
    workShift: 'night-morning',
  });
  assert.equal(nightRes.accepted, true, 'Adult worker should switch to night-morning shift');
  const nightAlloc = deriveWeeklyAllocation(nightRes.state.planner!.grid, nightRes.state);
  assert.equal(sumAlloc(nightAlloc), TOTAL_WEEKLY_HOURS, 'Night-morning grid must sum to 168h');
  assert.ok(nightAlloc.sleep >= 49, 'Night shift with afternoon recovery sleep must reach >= 49h sleep');

  const flexRes = dispatchPlayerAction(nightRes.state, {
    type: 'CHANGE_WORK_SHIFT',
    workShift: 'flexible',
  });
  assert.equal(flexRes.accepted, true, 'Adult worker should switch to flexible shift');
  assert.equal(
    sumAlloc(deriveWeeklyAllocation(flexRes.state.planner!.grid, flexRes.state)),
    TOTAL_WEEKLY_HOURS,
    'Flexible shift grid must sum to 168h'
  );
  console.log('PASS [Test 1]: Grid edits, shifts (night-morning & flexible), and all presets derive strictly 168h');
}

// Test 2: Minor locks, OT cap & chaining, and Freelance eligibility rules
function test2_MinorLocksAndRuleValidation() {
  const teen = createInitialGameState({
    mode: 'at_age',
    seed: 200322,
    atAge: { targetAge: 16, wealthFocus: 'average' },
  });
  const partyCheck = isActivityAvailableInSlot('party_night', 'weekend', 'night', teen);
  assert.equal(partyCheck.allowed, false, 'Teen age 16 must not be allowed party_night');

  const teenNightShift = dispatchPlayerAction(
    { ...teen, economy: { ...teen.economy, jobId: 'convenience_staff' } },
    { type: 'CHANGE_WORK_SHIFT', workShift: 'night-morning' }
  );
  assert.equal(teenNightShift.accepted, false, 'Minor age < 18 must be blocked from night-morning shift');

  // Adult OT rules: max 2 OT cells/week & weekday evening OT chains night = sleep_normal
  let adultWorker = createInitialGameState({
    mode: 'at_age',
    seed: 202322,
    atAge: { targetAge: 26, education: 'bachelor', wealthFocus: 'average' },
  });
  adultWorker = dispatchPlayerAction(adultWorker, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;

  const twoWeekendOtGrid: PlannerGrid = {
    weekday: { ...adultWorker.planner!.grid.weekday, evening: 'family_time', night: 'sleep_normal' },
    weekend: {
      ...adultWorker.planner!.grid.weekend,
      morning: 'overtime_work',
      evening: 'overtime_work',
      night: 'sleep_normal',
    },
  };
  assert.equal(
    validatePlanner(twoWeekendOtGrid, adultWorker).valid,
    true,
    '2 OT cells/week within 64h cap (40 + 8 + 8 = 56h) should be valid'
  );

  const weekdayEveningOtGrid: PlannerGrid = {
    weekday: { ...adultWorker.planner!.grid.weekday, evening: 'overtime_work', night: 'sleep_normal' },
    weekend: { ...adultWorker.planner!.grid.weekend, evening: 'hobby_leisure', night: 'sleep_normal' },
  };
  assert.equal(
    validatePlanner(weekdayEveningOtGrid, adultWorker).valid,
    true,
    'Weekday evening OT (40 + 20 = 60h <= 64h) should be valid'
  );
  const chainInfo = getSlotChainInfo(weekdayEveningOtGrid, 'weekday', 'evening', adultWorker);
  assert.equal(
    chainInfo.isChained && chainInfo.chainedWithSlot === 'afternoon',
    true,
    'Evening OT chains to afternoon regular work'
  );

  const overCapOtGrid: PlannerGrid = {
    weekday: { ...adultWorker.planner!.grid.weekday, evening: 'overtime_work', night: 'sleep_normal' },
    weekend: { ...adultWorker.planner!.grid.weekend, evening: 'overtime_work', night: 'sleep_normal' },
  };
  assert.equal(
    validatePlanner(overCapOtGrid, adultWorker).valid,
    false,
    'Weekly work hours exceeding 64h (40 + 20 + 8 = 68h) must be rejected'
  );

  const stackedOtGrid: PlannerGrid = {
    weekday: { ...adultWorker.planner!.grid.weekday, evening: 'overtime_work', night: 'overtime_work' },
    weekend: { ...adultWorker.planner!.grid.weekend, evening: 'overtime_work', night: 'sleep_normal' },
  };
  assert.equal(
    validatePlanner(stackedOtGrid, adultWorker).valid,
    false,
    '3 OT cells or evening->night OT stacking must be rejected'
  );

  // Freelance rules: blocked if employed, blocked if skill < 31 or missing flag, allowed when unlocked & unemployed & skill >= 31, max 7/wk
  assert.equal(
    isActivityAvailableInSlot('freelance_work', 'weekday', 'morning', adultWorker).allowed,
    false,
    'Employed worker must not take freelance_work'
  );
  const unemployedLowSkill: GameState = {
    ...adultWorker,
    economy: { ...adultWorker.economy, jobId: 'unemployed', monthlySalary: 0 },
    employment: undefined,
    character: {
      ...adultWorker.character,
      flags: { ...adultWorker.character.flags, freelance_unlocked: true },
      skills: {
        academic: 25,
        tech: 25,
        craft: 20,
        social: 20,
        business: 20,
        athletics: 20,
        visual_arts: 0,
        music_vocal: 0,
        performing_acting: 0,
        dance_thai_modern: 0,
        culinary: 0,
        foreign_lang: 0,
        literature_writing: 0,
      },
    },
  };
  assert.equal(
    isActivityAvailableInSlot('freelance_work', 'weekday', 'morning', unemployedLowSkill).allowed,
    false,
    'Freelance blocked when max skill < 31'
  );

  const freelanceReady: GameState = {
    ...unemployedLowSkill,
    character: {
      ...unemployedLowSkill.character,
      skills: { ...unemployedLowSkill.character.skills, tech: 35 },
    },
  };
  assert.equal(
    isActivityAvailableInSlot('freelance_work', 'weekday', 'morning', freelanceReady).allowed,
    true,
    'Freelance allowed when unemployed, 18+, flag set, and skill >= 31'
  );
  const eightFreelanceGrid: PlannerGrid = {
    weekday: { morning: 'freelance_work', afternoon: 'freelance_work', evening: 'freelance_work', night: 'freelance_work' },
    weekend: { morning: 'freelance_work', afternoon: 'freelance_work', evening: 'freelance_work', night: 'freelance_work' },
  };
  assert.equal(
    validatePlanner(eightFreelanceGrid, freelanceReady).valid,
    false,
    'Exceeding 7 freelance slots/week must be rejected'
  );

  console.log('PASS [Test 2]: Minor locks, OT max-2/chaining, and freelance gating verified');
}

// Test 3: Insufficient cash swaps paid grid activities to free fallback + clean plain-Thai Explain (zero dev jargon)
function test3_InsufficientCashSwapsToFreeFallbackAndExplains() {
  let adult = createInitialGameState({
    mode: 'at_age',
    seed: 300322,
    atAge: { targetAge: 23, education: 'bachelor', wealthFocus: 'struggling' },
  });
  adult = {
    ...adult,
    economy: { ...adult.economy, jobId: 'unemployed', cash: 50 },
    employment: undefined,
  };
  const expensiveGrid: PlannerGrid = {
    weekday: {
      morning: 'self_study',
      afternoon: 'meet_friends',
      evening: 'party_night',
      night: 'sleep_normal',
    },
    weekend: {
      morning: 'family_time',
      afternoon: 'meet_friends',
      evening: 'hobby_leisure',
      night: 'sleep_normal',
    },
  };
  const confirmed = dispatchPlayerAction(adult, {
    type: 'CONFIRM_LIFE_PLANNER',
    grid: expensiveGrid,
    presetId: 'custom',
  });
  assert.equal(confirmed.accepted, true);

  const nextDay = stepOneTick(confirmed.state, { allowPrompts: false, recordLogs: true });
  const afterWeek = applyWeeklyTimeAllocation(nextDay, true);

  assert.ok(afterWeek.economy.cash >= 0, 'Cash must never drop below 0 from paid grid activities');
  assert.ok(
    afterWeek.timeline.some((t) => t.title === UI_TEXT.PLANNER.cashInsufficientLogTitle),
    'Timeline must record automatic free-activity fallback when cash is insufficient'
  );

  const expDayplan = explain(afterWeek, 'dayplan:slot:0');
  assert.ok(
    expDayplan.summaryBullets.some((d) => d.includes('เงินสดไม่พอ')),
    'Explain dayplan must surface cash-insufficient free fallback reason'
  );

  // Verify legacy debug-style explainReason strings are stripped to plain Thai by explain()
  const stateWithLegacyLog: GameState = {
    ...afterWeek,
    timeline: [
      {
        id: 'legacy_jargon_test',
        totalDay: afterWeek.date.totalDays,
        ageYears: afterWeek.character.ageYears,
        dateLabel: 'วันนี้',
        category: 'trait',
        title: 'ก่อเกิดนิสัยใหม่',
        description: 'ทดสอบข้อความ',
        explainReason:
          'หลักฐานสะสม (success_streak=6.9/4, self_reflection=7.8/4) × ตัวคูณช่วงวัย 1.04 ผ่านเกณฑ์และสอดคล้องกับบุคลิกภาพ',
      },
      ...afterWeek.timeline,
    ],
  };
  const expTimeline = explain(stateWithLegacyLog, 'timeline:legacy_jargon_test');
  const joinedExplain = [
    expTimeline.titleTh,
    ...expTimeline.summaryBullets,
    expTimeline.causalStory ?? '',
    ...expTimeline.formulaBreakdown.map((f) => `${f.label} ${f.value} ${f.impact}`),
  ].join(' ');
  assert.equal(
    /success_streak|self_reflection|=6\.9|1\.04/.test(joinedExplain),
    false,
    'Plain-Thai explain must strip raw snake_case keys and multipliers'
  );
  console.log('PASS [Test 3]: Insufficient cash fallback and clean plain-Thai explain verified');
}

// Test 4: x1 vs x20 90-day determinism + OT pay/streak/family impact + night shift +15% + seeded freelance + holiday override
function test4_Determinism1YearAndHolidayOverride() {
  const req: LifeGenRequest = {
    mode: 'at_age',
    seed: 400322,
    atAge: { targetAge: 21, education: 'bachelor', wealthFocus: 'average' },
  };
  let s1 = createInitialGameState(req);
  let s20 = createInitialGameState(req);

  // Holiday DayPlan override check
  const officeHolidayState: GameState = {
    ...s1,
    economy: { ...s1.economy, jobId: 'office_junior' },
    date: { yearCE: 2025, month: 12, day: 5, dayOfWeek: 5, totalDays: 205 },
  };
  const holidayCheck = getSlotActivity(officeHolidayState, officeHolidayState.date, 'morning');
  assert.equal(holidayCheck.isHolidayOverride, true, 'Weekday holiday must use weekend template slot');
  assert.equal(buildDayPlan(officeHolidayState)[0].isHolidayOverride, true, 'DayPlan flags holiday override');

  // Verify OT weekly math, 3-week streak -> workaholic evidence, and family relationship offset
  let otWorker = dispatchPlayerAction(s1, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;
  const otGrid: PlannerGrid = {
    weekday: { ...otWorker.planner!.grid.weekday, evening: 'overtime_work', night: 'sleep_normal' },
    weekend: { ...otWorker.planner!.grid.weekend, evening: 'hobby_leisure', night: 'sleep_normal' },
  };
  otWorker = {
    ...otWorker,
    planner: { ...otWorker.planner!, grid: otGrid },
    timeAllocation: deriveWeeklyAllocation(otGrid, otWorker),
  };
  const otPreview = computeOvertimeWeeklyImpact(otGrid, otWorker);
  assert.ok(otPreview.otPayPerWeek > 0, 'OT worker must compute positive OT pay');
  for (let w = 0; w < 3; w++) {
    otWorker = applyWeeklyTimeAllocation(otWorker, false);
  }
  assert.equal(otWorker.employment?.overtimeStreakWeeks, 3, '3 weekly settlements -> overtimeStreakWeeks = 3');
  assert.ok((otWorker.evidence?.workaholic ?? 0) >= 1, '3-week OT streak records workaholic evidence');
  assert.ok((otWorker.employment?.shiftFamilyRelOffset ?? 0) < 0, 'OT accumulates negative family offset');

  // Verify seeded freelance weekly settlement & preview
  const freelanceWorker: GameState = {
    ...s1,
    economy: { ...s1.economy, jobId: 'unemployed', monthlySalary: 0, cash: 5000 },
    employment: undefined,
    character: {
      ...s1.character,
      flags: { ...s1.character.flags, freelance_unlocked: true },
      skills: { ...s1.character.skills, tech: 45 },
    },
    planner: {
      grid: {
        weekday: { morning: 'freelance_work', afternoon: 'self_study', evening: 'family_time', night: 'sleep_normal' },
        weekend: { morning: 'freelance_work', afternoon: 'meet_friends', evening: 'hobby_leisure', night: 'sleep_normal' },
      },
    },
  };
  const flPreview = computeFreelanceWeeklyPreview(freelanceWorker.planner!.grid, freelanceWorker);
  assert.ok(flPreview.expectedIncomePerWeek > 0, 'Freelance preview calculates expected weekly pay');
  const flSettled = applyWeeklyTimeAllocation(freelanceWorker, false);
  assert.ok(flSettled.economy.cash > 5000, 'Freelance weekly settlement pays seeded income');
  assert.notEqual(flSettled.rngState, freelanceWorker.rngState, 'Freelance settlement advances seeded rngState');

  // Verify x1 vs x20 determinism across 90 days including work shift change & OT plan
  const maybeAct = (st: GameState) => {
    if (st.date.totalDays === 5) {
      return dispatchPlayerAction(st, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;
    }
    if (st.date.totalDays === 12) {
      return dispatchPlayerAction(st, { type: 'CHANGE_WORK_SHIFT', workShift: 'afternoon-evening' }).state;
    }
    if (st.date.totalDays === 30) {
      return dispatchPlayerAction(st, { type: 'SET_SKILL_FOCUS', focus: ['tech', 'business'] }).state;
    }
    return st;
  };

  for (let d = 0; d < 90; d++) {
    s1 = maybeAct(s1);
    if (s1.pendingPrompt) {
      s1 = dispatchPlayerAction(s1, {
        type: 'RESOLVE_PROMPT',
        promptId: s1.pendingPrompt.id,
        choiceId: s1.pendingPrompt.choices[0].id,
      }).state;
    }
    s1 = stepOneTick(s1);
  }

  let rem = 90;
  while (rem > 0) {
    const batch = Math.min(20, rem);
    for (let i = 0; i < batch; i++) {
      s20 = maybeAct(s20);
      if (s20.pendingPrompt) {
        s20 = dispatchPlayerAction(s20, {
          type: 'RESOLVE_PROMPT',
          promptId: s20.pendingPrompt.id,
          choiceId: s20.pendingPrompt.choices[0].id,
        }).state;
      }
      s20 = stepOneTick(s20);
      rem--;
    }
  }

  assert.equal(s1.rngState, s20.rngState, '90-day rngState must match x1 vs x20');
  assert.equal(s1.economy.cash, s20.economy.cash, '90-day cash must match x1 vs x20');
  assert.deepEqual(s1.employment, s20.employment, '90-day employment state must match x1 vs x20');
  assert.deepEqual(s1.planner, s20.planner, '90-day planner state must match x1 vs x20');
  console.log('PASS [Test 4]: x1 vs x20 determinism, OT pay/streak, freelance seeded payout, and holiday override verified');
}

// Test 5: Phase 3.2.1 & legacy save migration (employment defaults to morning-afternoon)
function test5_MigratePhase321Saves() {
  const baseAdult = createInitialGameState({
    mode: 'at_age',
    seed: 500322,
    atAge: { targetAge: 25, education: 'bachelor', wealthFocus: 'average' },
  });

  // 5A. Legacy save without employment field -> defaults workShift to morning-afternoon
  const legacyNoEmployment: GameState = {
    ...baseAdult,
    economy: { ...baseAdult.economy, jobId: 'convenience_staff', monthlySalary: 14500 },
    employment: undefined,
    planner: undefined,
    lifestylePresetId: 'skill_grind',
  };
  const migratedPreset = hydrateLoadedGameState(legacyNoEmployment);
  assert.equal(
    migratedPreset.employment?.workShift,
    'morning-afternoon',
    'Legacy save missing employment must migrate to workShift = morning-afternoon'
  );
  assert.ok(migratedPreset.planner?.grid, 'Migrated preset save must construct planner.grid');
  assert.deepEqual(
    migratedPreset.timeAllocation,
    deriveWeeklyAllocation(migratedPreset.planner!.grid, migratedPreset),
    'Derived timeAllocation must match planner grid'
  );

  // 5B. Custom save ('custom') -> migrates to balanced grid + logs mandatory timeline entry
  const legacyCustomSave: GameState = {
    ...baseAdult,
    planner: undefined,
    lifestylePresetId: 'custom',
    timeline: [],
  };
  const migratedCustom = hydrateLoadedGameState(legacyCustomSave);
  assert.ok(migratedCustom.planner?.grid, 'Migrated custom save must construct planner.grid');
  assert.equal(migratedCustom.lifestylePresetId, 'balanced', 'Custom 3.2.1 save must migrate to balanced');
  assert.ok(
    migratedCustom.timeline.some((t) => t.title === UI_TEXT.PLANNER.migratedCustomTimelineTitle),
    'Migrated custom save must record mandatory timeline log'
  );
  console.log('PASS [Test 5]: Phase 3.2.1 and legacy employment save migrations verified');
}

function test6_Patch322RealisticOvertimeAndSideGig() {
  let adult = createInitialGameState({
    mode: 'at_age',
    seed: 600322,
    atAge: { targetAge: 28, education: 'bachelor', wealthFocus: 'average' },
  });
  adult = {
    ...adult,
    character: {
      ...adult.character,
      skills: {
        ...adult.character.skills,
        culinary: 30,
        business: 30,
        tech: 45,
        foreign_lang: 35,
      },
      indices: {
        ...adult.character.indices,
        competence: 60,
      },
    },
  };

  // 6A. Grid-based OT hours & 1.5x pay scale linearly with real slot hours
  const office = dispatchPlayerAction(adult, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;
  const otHourly = computeOvertimeHourlyRate(office);
  assert.ok(otHourly > 0, 'Eligible worker has positive 1.5x OT hourly rate');

  const weekdayOtGrid: PlannerGrid = {
    weekday: { ...office.planner!.grid.weekday, evening: 'overtime_work', night: 'sleep_normal' },
    weekend: { ...office.planner!.grid.weekend, morning: 'quiet_rest', night: 'sleep_normal' },
  };
  const weekdayOtHours = countOvertimeHoursPerWeek(weekdayOtGrid, office);
  assert.equal(weekdayOtHours, 20, 'Weekday evening OT must count 4h * 5 = 20h/week');
  const weekdayOtPreview = previewPlannerImpact(weekdayOtGrid, office);
  assert.equal(weekdayOtPreview.otHoursPerWeek, 20);
  assert.equal(weekdayOtPreview.overtimePayPerWeek, Math.round(otHourly * 20));
  assert.equal(
    weekdayOtPreview.netMoneyPerWeek,
    weekdayOtPreview.overtimePayPerWeek - weekdayOtPreview.activityCostPerWeek,
    'previewPlannerImpact netMoneyPerWeek must reflect grid OT pay immediately'
  );

  // Expanded OT slots: weekend morning (8h) & weekend afternoon (10h)
  assert.equal(
    isActivityAvailableInSlot('overtime_work', 'weekend', 'morning', office).allowed,
    true,
    'overtime_work must be allowed on weekend morning'
  );
  assert.equal(
    isActivityAvailableInSlot('overtime_work', 'weekend', 'afternoon', office).allowed,
    true,
    'overtime_work must be allowed on weekend afternoon'
  );
  const weekendAfternoonOtGrid: PlannerGrid = {
    weekday: { ...office.planner!.grid.weekday, evening: 'family_time', night: 'sleep_normal' },
    weekend: { ...office.planner!.grid.weekend, afternoon: 'overtime_work', night: 'sleep_normal' },
  };
  const weekendOtPreview = previewPlannerImpact(weekendAfternoonOtGrid, office);
  assert.equal(weekendOtPreview.otHoursPerWeek, 10, 'Weekend afternoon OT must count 5h * 2 = 10h/week');
  assert.equal(weekendOtPreview.overtimePayPerWeek, Math.round(otHourly * 10));

  // 6B. day_long shift locks morning/afternoon/evening, and workaholic preset falls back to unlocked weekend OT
  const shopOwner = dispatchPlayerAction(adult, { type: 'APPLY_JOB', jobId: 'small_business' }).state;
  assert.equal(isSlotLocked('weekday', 'morning', shopOwner).locked, true);
  assert.equal(isSlotLocked('weekday', 'afternoon', shopOwner).locked, true);
  assert.equal(isSlotLocked('weekday', 'evening', shopOwner).locked, true);

  const workaholicShop = applyPresetTemplate('workaholic', shopOwner);
  assert.equal(workaholicShop.accepted, true, 'workaholic preset must succeed for day_long worker');
  const shopOtPreview = previewPlannerImpact(workaholicShop.grid, workaholicShop.state);
  assert.ok(shopOtPreview.otHoursPerWeek > 0, 'day_long workaholic preset must place OT into an unlocked slot');
  assert.ok(shopOtPreview.overtimePayPerWeek > 0, 'day_long workaholic preset must earn positive OT pay');
  assert.ok(
    shopOtPreview.derivedAllocation.workOrStudy + shopOtPreview.derivedAllocation.sideGig <= 65,
    'day_long workaholic preset must stay within 65h weekly work cap'
  );

  // 9h/day job (software_dev = 45h/wk) + workaholic preset places OT on weekday evening (45 + 20 = 65h)
  const dev = dispatchPlayerAction(adult, { type: 'APPLY_JOB', jobId: 'software_dev' }).state;
  const workaholicDev = applyPresetTemplate('workaholic', dev);
  assert.equal(workaholicDev.accepted, true, 'workaholic preset must succeed for 45h/wk software_dev');
  const devPreview = previewPlannerImpact(workaholicDev.grid, workaholicDev.state);
  assert.ok(devPreview.otHoursPerWeek > 0 && devPreview.overtimePayPerWeek > 0);
  assert.ok(devPreview.derivedAllocation.workOrStudy + devPreview.derivedAllocation.sideGig <= 65);

  // Flexible job (food_rider = 45h morning+afternoon) + weekday evening OT (20h) = 65h must be valid
  const rider = dispatchPlayerAction(adult, { type: 'APPLY_JOB', jobId: 'food_rider' }).state;
  const riderWeekdayOtGrid: PlannerGrid = {
    weekday: {
      morning: 'flexible_work',
      afternoon: 'flexible_work',
      evening: 'overtime_work',
      night: 'sleep_normal',
    },
    weekend: { ...rider.planner!.grid.weekend, night: 'sleep_full' },
  };
  const riderValidation = validatePlanner(riderWeekdayOtGrid, rider);
  assert.equal(riderValidation.valid, true, 'Flexible 45h daytime + 20h weekday evening OT (65h) must be valid');
  const riderWorkaholic = applyPresetTemplate('workaholic', rider);
  assert.equal(riderWorkaholic.accepted, true, 'workaholic preset on food_rider must accept weekday evening OT');
  assert.equal(
    riderWorkaholic.grid.weekday.evening,
    'overtime_work',
    'food_rider workaholic preset must place OT on weekday evening (45 + 20 = 65h)'
  );

  // 6C. Side gig income calculated directly from grid (and capped cleanly at contract max hours instead of 0)
  const workerWithGig: GameState = {
    ...office,
    sideGigRecord: {
      id: 'gig_test_322',
      title: 'งานฟรีแลนซ์เสริมร้านกาแฟ',
      sceneId: 'cafe',
      hourlyPay: 100,
      maxWeeklyHours: 16,
      isNightShift: false,
      hiredAtTotalDay: 0,
    },
  };
  const gigGrid: PlannerGrid = {
    weekday: { ...workerWithGig.planner!.grid.weekday, evening: 'family_time', night: 'sleep_normal' },
    weekend: { ...workerWithGig.planner!.grid.weekend, afternoon: 'side_gig_work', night: 'sleep_normal' },
  };
  const gigPreview = previewPlannerImpact(gigGrid, workerWithGig);
  assert.equal(gigPreview.sideGigIncomePerWeek, 1000, '10h weekend afternoon side gig @ 100 THB/hr = 1000 THB');
  const overContractGigGrid: PlannerGrid = {
    weekday: { ...workerWithGig.planner!.grid.weekday, evening: 'side_gig_work', night: 'sleep_normal' },
    weekend: { ...workerWithGig.planner!.grid.weekend, evening: 'family_time', night: 'sleep_normal' },
  };
  const overContractPreview = previewPlannerImpact(overContractGigGrid, workerWithGig);
  assert.equal(
    overContractPreview.sideGigIncomePerWeek,
    1600,
    '20h weekday evening side gig with 16h contract cap must still pay 16h = 1600 THB instead of 0'
  );

  // 6D. Minor OT prohibition
  const teen = createInitialGameState({
    mode: 'at_age',
    seed: 600323,
    atAge: { targetAge: 16, wealthFocus: 'average' },
  });
  const teenOtGrid: PlannerGrid = {
    weekday: { ...teen.planner!.grid.weekday, evening: 'overtime_work', night: 'sleep_normal' },
    weekend: { ...teen.planner!.grid.weekend },
  };
  assert.equal(validatePlanner(teenOtGrid, teen).valid, false, 'Minor 15-17 must fail validation if OT scheduled');

  console.log('PASS [Test 6]: Patch 3.2.2 realistic OT pay, expanded slots, day_long fallback, side gig & 64h cap verified');
}

function main() {
  test1_DerivedHoursAlwaysSumTo168();
  test2_MinorLocksAndRuleValidation();
  test3_InsufficientCashSwapsToFreeFallbackAndExplains();
  test4_Determinism1YearAndHolidayOverride();
  test5_MigratePhase321Saves();
  test6_Patch322RealisticOvertimeAndSideGig();
  console.log('ALL 6 PHASE 3.2.2 TESTS PASSED!');
}

main();
