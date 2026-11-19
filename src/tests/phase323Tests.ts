import assert from 'node:assert/strict';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import { PLANNER_STORYLETS } from '../data/storylets/plannerStorylets';
import { TRAIT_GATED_ACTIONS } from '../data/traits';
import { generateAnnualFocusDigest } from '../engine/digest';
import { explain } from '../engine/explain';
import { stepOneTick } from '../engine/pipeline';
import {
  canChangeAnnualFocus,
  clonePlannerGrid,
  getYearlyCalendarEvents,
  isActivityAvailableInSlot,
  isSlotLocked,
  previewPlannerImpact,
  sanitizePlannerWithRelockNotice,
} from '../engine/planner';
import { AUTOSAVE_SLOT_ID, MANUAL_SAVE_SLOTS } from '../engine/save';
import { createInitialGameState, dispatchPlayerAction } from '../engine/state';
import { isStoryletEligible, validateStorylet } from '../engine/storylet';
import { applyWeeklyTimeAllocation } from '../engine/timeAlloc';
import type { GameState } from '../engine/types';

function test1_CatalogAndPlannerStoryletsValidation() {
  assert.equal(PLANNER_STORYLETS.length, 24, 'PLANNER_STORYLETS must contain exactly 24 storylets');
  assert.equal(STORYLET_CATALOG.length, 123, 'STORYLET_CATALOG must total 123 (72 + 51 Phase 3.3.1-FIX)');

  const ids = new Set<string>();
  for (const s of STORYLET_CATALOG) {
    assert.ok(!ids.has(s.id), `Duplicate storylet id: ${s.id}`);
    ids.add(s.id);
    const val = validateStorylet(s);
    assert.equal(val.valid, true, `Storylet ${s.id} failed validation: ${val.errors.join(', ')}`);
  }

  // Verify specific unlock storylets #9, #15, #24
  const s9 = PLANNER_STORYLETS.find((s) => s.id === 'planner_09_workout_competition_invite');
  assert.ok(s9, 'Storylet #9 planner_09_workout_competition_invite must exist');
  const s9HasFlag = s9!.choices?.some((c) =>
    c.effects.some((e) => e.type === 'AddFlag' && e.flag === 'competition_unlocked' && e.value === true)
  );
  assert.ok(s9HasFlag, 'Storylet #9 must be able to grant competition_unlocked');

  const s15 = PLANNER_STORYLETS.find((s) => s.id === 'planner_15_gaming_stream_invite');
  assert.ok(s15, 'Storylet #15 planner_15_gaming_stream_invite must exist');
  const s15HasFlag = s15!.choices?.some((c) =>
    c.effects.some((e) => e.type === 'AddFlag' && e.flag === 'stream_unlocked' && e.value === true)
  );
  assert.ok(s15HasFlag, 'Storylet #15 must be able to grant stream_unlocked');

  const s24 = PLANNER_STORYLETS.find((s) => s.id === 'planner_24_annual_focus_summary');
  assert.ok(s24, 'Storylet #24 planner_24_annual_focus_summary must exist');
  assert.equal(s24!.category, 'system', 'Storylet #24 must use category "system"');

  console.log('PASS [Test 1]: 123 storylets validated (45 + 24 planner + 3 Phase 3.3.1 + 51 Age/Edu, #9/#15/#24 verified)');
}

function test2_AnnualFocusRulesBonusDigestAndT3Protection() {
  // 1) Age < 13 cannot set annual focus
  const child = createInitialGameState({
    mode: 'at_age',
    seed: 32302,
    atAge: { targetAge: 10, wealthFocus: 'average' },
  });
  assert.equal(canChangeAnnualFocus(child).allowed, false, 'Child age < 13 cannot change annual focus');
  const childTry = dispatchPlayerAction(child, { type: 'SET_ANNUAL_FOCUS', focusId: 'save_money' });
  assert.equal(childTry.accepted, false, 'SET_ANNUAL_FOCUS must reject age < 13');

  // 2) Age >= 13 can change max 2 times/year; 3rd rejected
  let worker = createInitialGameState({
    mode: 'at_age',
    seed: 32303,
    atAge: { targetAge: 24, education: 'bachelor', wealthFocus: 'average' },
  });
  worker = dispatchPlayerAction(worker, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;

  const ch1 = dispatchPlayerAction(worker, { type: 'SET_ANNUAL_FOCUS', focusId: 'save_money' });
  assert.equal(ch1.accepted, true, '1st annual focus change should succeed');
  const ch2 = dispatchPlayerAction(ch1.state, { type: 'SET_ANNUAL_FOCUS', focusId: 'health_recovery' });
  assert.equal(ch2.accepted, true, '2nd annual focus change should succeed');
  const ch3 = dispatchPlayerAction(ch2.state, { type: 'SET_ANNUAL_FOCUS', focusId: 'skill_career' });
  assert.equal(ch3.accepted, false, '3rd annual focus change in same year must be rejected');

  // 3) +10% aligned evidence bonus (specifically save_money + overtime_work)
  const gridWithOT = clonePlannerGrid(ch1.state.planner!.grid);
  gridWithOT.weekday.evening = 'overtime_work';
  gridWithOT.weekday.night = 'sleep_normal';

  const baseNoneState: GameState = {
    ...worker,
    planner: {
      ...ch1.state.planner!,
      grid: gridWithOT,
      annualFocus: { ...ch1.state.planner!.annualFocus!, current: 'none' },
    },
    evidence: {},
  };
  const baseSaveState: GameState = {
    ...worker,
    planner: {
      ...ch1.state.planner!,
      grid: gridWithOT,
      annualFocus: { ...ch1.state.planner!.annualFocus!, current: 'save_money' },
    },
    evidence: {},
  };

  const afterNone = applyWeeklyTimeAllocation(baseNoneState, false);
  const afterSave = applyWeeklyTimeAllocation(baseSaveState, false);
  const hwNone = afterNone.evidence?.hardWorking ?? 0;
  const hwSave = afterSave.evidence?.hardWorking ?? 0;
  assert.ok(hwSave > hwNone, `save_money OT hardWorking evidence (${hwSave}) must exceed none (${hwNone})`);
  assert.ok(
    Math.abs(hwSave - hwNone * 1.1) < 0.05,
    `save_money OT bonus must be +10% (got ${hwSave} vs expected ${(hwNone * 1.1).toFixed(2)})`
  );

  // 4) Template digest generation
  const digest = generateAnnualFocusDigest(afterSave);
  assert.ok(digest.title.includes('สรุปผลเป้าหมายปี'), 'Annual digest title must use template');
  assert.ok(digest.summaryLines.some((l) => l.includes('เก็บเงิน')), 'Annual digest must include active focus');

  // 5) Year roll never overwrites active T3 prompt
  let preYearWithT3: GameState = {
    ...ch1.state,
    date: { ...ch1.state.date, month: 12, day: 31, totalDays: 100 },
    pendingPrompt: {
      id: 't3_guard_test',
      title: 'วิกฤตสำคัญต้องตัดสินใจ',
      category: 'health',
      tier: 'T3',
      description: 'เหตุการณ์ T3 ที่กำลังรอผู้เล่น',
      choices: [
        { id: 'c1', label: 'รับมือ', effects: [] },
      ],
    },
    needsPlayer: false, // force tick through stepCalendar for unit test
  };
  preYearWithT3 = stepOneTick(preYearWithT3, { allowPrompts: true });
  assert.equal(
    preYearWithT3.pendingPrompt?.id,
    't3_guard_test',
    'Annual focus birthday prompt must NEVER overwrite an active T3 prompt'
  );
  assert.ok(
    preYearWithT3.timeline.some((t) => t.category === 'system' && t.title.includes('สรุปผลเป้าหมายปี')),
    'Year roll must log template annual focus summary in system timeline category'
  );

  // Yearly calendar pins + Fog of Knowledge check (hidden echoQueue excluded)
  const pinned = dispatchPlayerAction(ch1.state, {
    type: 'ADD_CALENDAR_PIN',
    month: 8,
    day: 20,
    title: 'นัดตรวจฟันประจำปี',
  });
  assert.equal(pinned.accepted, true, 'Calendar pin add must succeed');
  const events = getYearlyCalendarEvents({
    ...pinned.state,
    echoQueue: [
      {
        id: 'secret_echo',
        triggerOnDay: pinned.state.date.totalDays + 10,
        title: 'SECRET_HIDDEN_ECHO',
        description: 'Should never leak to yearly calendar',
        effects: [],
        sourceEventId: 'test',
      },
    ],
  });
  assert.ok(events.some((e) => e.kind === 'pin' && e.titleTh === 'นัดตรวจฟันประจำปี'));
  assert.equal(
    events.some((e) => e.titleTh.includes('SECRET_HIDDEN_ECHO')),
    false,
    'Yearly calendar must uphold Fog of Knowledge (never leak echoQueue)'
  );

  console.log('PASS [Test 2]: Annual Focus limits, +10% OT bonus, digest, T3 guard, calendar pins & Fog');
}

function test3_UnlockableActivitiesAndPoliteRelock() {
  // 1) university_club unlocked for 18+ student, relocked when graduating to office_junior
  let uni = createInitialGameState({
    mode: 'at_age',
    seed: 32304,
    atAge: { targetAge: 19, wealthFocus: 'average' },
  });
  uni = {
    ...uni,
    economy: { ...uni.economy, jobId: 'student', jobTitle: 'นักเรียน / นักศึกษา' },
  };
  assert.equal(
    isActivityAvailableInSlot('university_club', 'weekday', 'evening', uni).allowed,
    true,
    'university_club must unlock for age 18+ student'
  );

  // Internship stays locked waiting Phase 3.4
  const internAvail = isActivityAvailableInSlot('internship', 'weekday', 'afternoon', uni);
  assert.equal(internAvail.allowed, false, 'internship must remain locked until Phase 3.4');
  assert.equal(internAvail.reasonTh, 'รอระบบสมัครงาน 3.4');

  // Place university_club in grid, then graduate/switch job -> polite relock
  const uniGrid = clonePlannerGrid(uni.planner!.grid);
  uniGrid.weekday.evening = 'university_club';
  const withClub: GameState = {
    ...uni,
    planner: { ...uni.planner!, grid: uniGrid },
  };
  const graduatedState: GameState = {
    ...withClub,
    economy: { ...withClub.economy, jobId: 'office_junior', jobTitle: 'พนักงานออฟฟิศ' },
  };
  const relockRes = sanitizePlannerWithRelockNotice(graduatedState.planner!, graduatedState);
  assert.notEqual(relockRes.planner.grid.weekday.evening, 'university_club', 'university_club must relock after leaving student status');
  assert.ok(relockRes.relockNoticeTh && relockRes.relockNoticeTh.length > 0, 'Relock must emit polite Thai notice');
  assert.ok(relockRes.planner.lastRelockReasonTh, 'Relock reason must persist on planner');
  const explainRelock = explain(
    { ...graduatedState, planner: relockRes.planner },
    'planner:relock'
  );
  assert.ok(explainRelock.titleTh.includes('ถูกล็อกคืน'), 'Explain engine must explain planner:relock');

  // 2) stream_content (via stream_unlocked OR hobby_focus >= 6 + trait)
  assert.equal(
    isActivityAvailableInSlot('stream_content', 'weekend', 'evening', graduatedState).allowed,
    false,
    'stream_content must start locked'
  );
  const streamByEvidence: GameState = {
    ...graduatedState,
    character: { ...graduatedState.character, traits: [...graduatedState.character.traits, 'niche_obsessed'] },
    evidence: { ...graduatedState.evidence, hobby_focus: 6 },
  };
  assert.equal(
    isActivityAvailableInSlot('stream_content', 'weekend', 'evening', streamByEvidence).allowed,
    true,
    'stream_content must unlock when hobby_focus >= 6 + niche_obsessed trait'
  );

  // 3) raise_child unlocks via has_child & permanently locks weekend.evening
  const parentRes = dispatchPlayerAction(graduatedState, {
    type: 'DEV_TOGGLE_FLAG',
    flag: 'has_child',
    value: true,
  });
  const weekendEveningLock = isSlotLocked('weekend', 'evening', parentRes.state);
  assert.equal(weekendEveningLock.locked, true, 'has_child flag must lock weekend.evening');
  assert.equal(weekendEveningLock.activityId, 'raise_child', 'Locked weekend.evening activity must be raise_child');

  // 4) advanced_competition unlocks via workoutWeeks >= 8
  assert.equal(
    isActivityAvailableInSlot('advanced_competition', 'weekend', 'afternoon', graduatedState).allowed,
    false,
    'advanced_competition must start locked'
  );
  const fitState = dispatchPlayerAction(graduatedState, {
    type: 'DEV_SET_PLANNER_STREAKS',
    patch: { workoutWeeks: 8 },
  }).state;
  assert.equal(
    isActivityAvailableInSlot('advanced_competition', 'weekend', 'afternoon', fitState).allowed,
    true,
    'advanced_competition must unlock at workoutWeeks >= 8'
  );

  // 5) Phase 3.2.2 freelance_work contract remains intact
  const unemployedSkilled: GameState = {
    ...graduatedState,
    economy: { ...graduatedState.economy, jobId: 'unemployed', monthlySalary: 0 },
    character: {
      ...graduatedState.character,
      flags: { ...graduatedState.character.flags, freelance_unlocked: true },
      skills: { ...graduatedState.character.skills, tech: 35 },
    },
  };
  assert.equal(
    isActivityAvailableInSlot('freelance_work', 'weekday', 'morning', unemployedSkilled).allowed,
    true,
    'Phase 3.2.2 freelance_work contract must remain intact'
  );

  console.log('PASS [Test 3]: Unlockables, polite relock notice & explain, child slot lock, and 3.2.2 freelance intact');
}

function test4_Deterministic400DaysAndSelfCarePauseResume() {
  // Setup two identical runs of 400 days (headless) to guarantee 100% deterministic parity
  const makeRun = (seed: number): GameState => {
    let s = createInitialGameState({
      mode: 'at_age',
      seed,
      atAge: { targetAge: 25, education: 'bachelor', wealthFocus: 'average' },
    });
    s = dispatchPlayerAction(s, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;
    s = dispatchPlayerAction(s, { type: 'SET_ANNUAL_FOCUS', focusId: 'health_recovery' }).state;
    const baseOrders = s.standingOrders!;
    s = dispatchPlayerAction(s, {
      type: 'UPDATE_STANDING_ORDERS',
      orders: {
        ...baseOrders,
        financial: { ...baseOrders.financial, lowCashThreshold: 5000 },
        selfCare: {
          healthCheckupPackage: 'private_3500',
          groomingMonthlyEnabled: true,
          familyRemittanceMode: 'pct_5',
        },
      },
    }).state;
    const g = clonePlannerGrid(s.planner!.grid);
    g.weekend.morning = 'workout';
    s = {
      ...s,
      planner: { ...s.planner!, grid: g },
    };
    return s;
  };

  let a = makeRun(99323);
  let b = makeRun(99323);
  for (let i = 0; i < 400; i++) {
    a = stepOneTick(a, { allowPrompts: false, recordLogs: i % 20 === 0 });
    b = stepOneTick(b, { allowPrompts: true, recordLogs: true });
    // Note: in x20 fast UI, allowPrompts is true, if prompt opens, keep resolving nothing? For parity check compare pure 400 ticks with allowPrompts: false (different recordLogs cadences)
  }

  // Re-run b with allowPrompts: false and recordLogs: true to match headless vs UI logging
  let b2 = makeRun(99323);
  for (let i = 0; i < 400; i++) {
    b2 = stepOneTick(b2, { allowPrompts: false, recordLogs: true });
  }

  assert.equal(a.rngState, b2.rngState, 'RNG state must stay 100% deterministic across 400 ticks');
  assert.equal(a.economy.cash, b2.economy.cash, 'Cash must be identical across 400 ticks');
  assert.equal(
    a.planner?.streaks?.workoutWeeks,
    b2.planner?.streaks?.workoutWeeks,
    'Workout streak must be identical across 400 ticks'
  );
  assert.equal(
    a.character.indices.physical,
    b2.character.indices.physical,
    'Physical index must be identical across 400 ticks'
  );
  assert.ok(
    (b2.planner?.streaks?.workoutWeeks ?? 0) >= 8,
    'Running 400 days with workout in grid must advance workoutWeeks streak'
  );

  // Verify private_3500 annual health checkup gives ~+3.0 physical & pauses/resumes cleanly on low cash
  let checkupTest = createInitialGameState({
    mode: 'at_age',
    seed: 77323,
    atAge: { targetAge: 26, education: 'bachelor', wealthFocus: 'comfortable' },
  });
  checkupTest = dispatchPlayerAction(checkupTest, {
    type: 'UPDATE_STANDING_ORDERS',
    orders: {
      ...checkupTest.standingOrders!,
      financial: { ...checkupTest.standingOrders!.financial, lowCashThreshold: 5000 },
      selfCare: {
        healthCheckupPackage: 'private_3500',
        groomingMonthlyEnabled: true,
        familyRemittanceMode: 'pct_5',
      },
    },
  }).state;

  // Low cash -> pauses grooming & checkup cleanly
  let lowCashState: GameState = {
    ...checkupTest,
    date: { ...checkupTest.date, month: 1, day: 31 },
    economy: { ...checkupTest.economy, cash: 2000, monthlySalary: 0 },
  };
  lowCashState = stepOneTick(lowCashState, { allowPrompts: false, recordLogs: true });
  assert.equal(
    lowCashState.standingOrders?.selfCare?.pausedByLowCash?.grooming,
    true,
    'Low cash below lowCashThreshold + fee must auto-pause monthly grooming'
  );

  // Recover cash -> auto-resumes on next month roll
  let recoveredState: GameState = {
    ...lowCashState,
    date: { ...lowCashState.date, month: 2, day: 28 },
    economy: { ...lowCashState.economy, cash: 50000, monthlySalary: 0 },
  };
  const cashBeforeResume = recoveredState.economy.cash;
  recoveredState = stepOneTick(recoveredState, { allowPrompts: false, recordLogs: true });
  assert.equal(
    recoveredState.standingOrders?.selfCare?.pausedByLowCash?.grooming,
    false,
    'Recovered cash must auto-resume monthly grooming'
  );
  assert.ok(recoveredState.economy.cash < cashBeforeResume, 'Auto-resumed grooming must deduct fee');

  // Verify year roll with private_3500 checkup triggers +4.7 endurance/strength (~+3.0 physical) vs off baseline
  const offState = dispatchPlayerAction(checkupTest, {
    type: 'UPDATE_STANDING_ORDERS',
    orders: {
      ...checkupTest.standingOrders!,
      selfCare: {
        ...checkupTest.standingOrders!.selfCare!,
        healthCheckupPackage: 'off',
      },
    },
  }).state;
  const bdayOff = stepOneTick(
    { ...offState, date: { ...offState.date, month: 12, day: 31 }, economy: { ...offState.economy, cash: 80000 } },
    { allowPrompts: false, recordLogs: false }
  );
  let bdayPre: GameState = {
    ...checkupTest,
    date: { ...checkupTest.date, month: 12, day: 31 },
    economy: { ...checkupTest.economy, cash: 80000 },
  };
  bdayPre = stepOneTick(bdayPre, { allowPrompts: false, recordLogs: true });
  assert.ok(
    bdayPre.character.rawStats.endurance - bdayOff.character.rawStats.endurance >= 4.0 &&
      bdayPre.character.rawStats.strength - bdayOff.character.rawStats.strength >= 4.0,
    'private_3500 annual checkup must add endurance & strength (+~3.0 physical)'
  );

  console.log('PASS [Test 4]: 400-tick determinism parity, streaks, private_3500 +3 physical, low-cash auto-pause/resume');
}

function test5_MinorStrictProtection() {
  const teen = createInitialGameState({
    mode: 'at_age',
    seed: 55323,
    atAge: { targetAge: 16, wealthFocus: 'average' },
  });

  // Adult 18+ planner storylets are ineligible for <18, and adult storylets cannot be Dev-triggered for minors
  const plannerAdult = PLANNER_STORYLETS.find((s) => (s.conditions?.minAge ?? 0) >= 18);
  assert.ok(plannerAdult, 'Must have 18+ planner storylet');
  assert.equal(isStoryletEligible(plannerAdult!, teen), false, 'Minor < 18 must be ineligible for 18+ planner storylet');

  const adultCatalogStorylet = STORYLET_CATALOG.find(
    (s) => s.isAdultContent || (s.category === 'romance' && !s.conditions?.isMinorSafe)
  );
  assert.ok(adultCatalogStorylet, 'Must have adult-gated storylet in catalog');
  const triggerAdult = dispatchPlayerAction(teen, {
    type: 'TRIGGER_STORYLET',
    storyletId: adultCatalogStorylet!.id,
  });
  assert.equal(triggerAdult.accepted, false, 'Minor < 18 must be blocked from triggering adult storylets');

  // Hard guard: minor cannot resolve requiresAdult choice
  const minorWithAdultChoice: GameState = {
    ...teen,
    pendingPrompt: {
      id: 'adult_choice_guard',
      title: 'Test Adult Choice',
      category: 'social',
      tier: 'T2',
      description: 'Test',
      choices: [{ id: 'adult_only', label: 'Adult', requiresAdult: true, effects: [] }],
    },
  };
  assert.equal(
    dispatchPlayerAction(minorWithAdultChoice, {
      type: 'RESOLVE_PROMPT',
      promptId: 'adult_choice_guard',
      choiceId: 'adult_only',
    }).accepted,
    false,
    'Minor < 18 must be blocked from requiresAdult choice'
  );

  // Minor-safe #19 and #20 are minor safe
  const s19 = PLANNER_STORYLETS.find((s) => s.id === 'planner_19_teen_study_praise');
  const s20 = PLANNER_STORYLETS.find((s) => s.id === 'planner_20_kid_play_curfew');
  assert.equal(s19?.conditions?.isMinorSafe, true, 'Storylet #19 must be minor safe');
  assert.equal(s20?.conditions?.isMinorSafe, true, 'Storylet #20 must be minor safe');

  // Adult activities blocked for minor
  assert.equal(isActivityAvailableInSlot('university_club', 'weekday', 'evening', teen).allowed, false);
  assert.equal(isActivityAvailableInSlot('internship', 'weekday', 'afternoon', teen).allowed, false);
  assert.equal(isActivityAvailableInSlot('raise_child', 'weekend', 'evening', teen).allowed, false);

  // 18+ self-care orders do NOT trigger for minor even if forcibly toggled in state
  let minorSelfCare: GameState = {
    ...teen,
    date: { ...teen.date, month: 12, day: 31 },
    economy: { ...teen.economy, cash: 30000, monthlySalary: 0 },
    standingOrders: {
      ...teen.standingOrders!,
      selfCare: {
        healthCheckupPackage: 'private_3500',
        groomingMonthlyEnabled: false,
        familyRemittanceMode: 'pct_15',
      },
    },
  };
  const endurBefore = minorSelfCare.character.rawStats.endurance;
  minorSelfCare = stepOneTick(minorSelfCare, { allowPrompts: false, recordLogs: false });
  assert.equal(
    minorSelfCare.character.flags?.health_checkup_private ?? false,
    false,
    'Minor age 17 after year roll must NOT trigger 18+ annual health checkup'
  );
  // Note: natural growth at age 17 adds +0.6 endurance, NOT +4.7 checkup bonus
  assert.ok(
    minorSelfCare.character.rawStats.endurance - endurBefore < 2,
    'Minor < 18 must not gain adult checkup stat bonus'
  );

  console.log('PASS [Test 5]: Strict minor (<18) guards across planner activities, storylets, and self-care orders');
}

function test6_PostReleasePatchAutosaveSkillPreviewAndToasts() {
  // 1) Auto-Save slot & 4 manual save slots
  assert.equal(AUTOSAVE_SLOT_ID, 'autosave', 'AUTOSAVE_SLOT_ID must be autosave');
  assert.equal(MANUAL_SAVE_SLOTS.length, 4, 'Must have 4 manual save slots separate from autosave');

  // 2) apply_overtime removed from TRAIT_GATED_ACTIONS
  assert.equal(
    TRAIT_GATED_ACTIONS.some((a) => a.id === 'apply_overtime'),
    false,
    'apply_overtime must be removed from TRAIT_GATED_ACTIONS'
  );

  // 3) Focused skill summary flags missing self_dev slot
  let worker = createInitialGameState({
    mode: 'at_age',
    seed: 32306,
    atAge: { targetAge: 24, education: 'bachelor', wealthFocus: 'average' },
  });
  worker = dispatchPlayerAction(worker, { type: 'APPLY_JOB', jobId: 'office_junior' }).state;
  worker = dispatchPlayerAction(worker, { type: 'SET_SKILL_FOCUS', focus: ['tech'] }).state;
  const gridWithoutSelfDev = clonePlannerGrid(worker.planner!.grid);
  gridWithoutSelfDev.weekday.evening = 'quiet_rest';
  gridWithoutSelfDev.weekend.morning = 'quiet_rest';
  gridWithoutSelfDev.weekend.afternoon = 'quiet_rest';
  gridWithoutSelfDev.weekend.evening = 'family_time';
  const preview = previewPlannerImpact(gridWithoutSelfDev, worker);
  assert.equal(preview.focusedSkillsSummary.length, 1, 'Focused skill tech must be summarized');
  assert.equal(preview.focusedSkillsSummary[0].hasSelfDevSlot, false, 'hasSelfDevSlot must be false when alloc.selfDev === 0');
  assert.equal(preview.focusedSkillsSummary[0].estimatedWeeklyGain, 0, 'Weekly gain for tech without self_dev slot must be 0');

  // 4) RESOLVE_PROMPT creates Thai activeToast for AddFlag activity unlock and RecordEvidence
  const triggered = dispatchPlayerAction(worker, {
    type: 'TRIGGER_STORYLET',
    storyletId: 'planner_15_gaming_stream_invite',
  });
  assert.equal(triggered.accepted, true, 'Must trigger planner_15_gaming_stream_invite');
  const resolved = dispatchPlayerAction(triggered.state, {
    type: 'RESOLVE_PROMPT',
    promptId: triggered.state.pendingPrompt!.id,
    choiceId: 'start_streaming_channel',
  });
  assert.equal(resolved.accepted, true, 'Must resolve streaming unlock choice');
  assert.ok(resolved.state.activeToast, 'RESOLVE_PROMPT must set activeToast on unlock/evidence');
  assert.ok(
    resolved.state.activeToast!.title.includes('ปลดล็อกกิจกรรมใหม่'),
    'Toast title must announce newly unlocked planner activity'
  );
  assert.equal(
    resolved.state.activeToast!.description.includes('stream_unlocked') ||
      resolved.state.activeToast!.description.includes('hobby_focus'),
    false,
    'Toast description must NEVER leak raw snake_case keys'
  );

  // 5) Gated action execution produces clear outcome message
  const gatedRes = dispatchPlayerAction(worker, {
    type: 'EXECUTE_GATED_ACTION',
    actionId: 'therapy_reflection',
  });
  assert.equal(gatedRes.accepted, true, 'Gated action must execute cleanly');
  assert.ok(gatedRes.message && gatedRes.message.includes('ความเครียด'), 'Gated action message must include outcome details');

  console.log('PASS [Test 6]: Phase 3.2.3 Post-Release Patch (autosave slots, skill preview flag, gated cleanup, storylet toast)');
}

function run() {
  test1_CatalogAndPlannerStoryletsValidation();
  test2_AnnualFocusRulesBonusDigestAndT3Protection();
  test3_UnlockableActivitiesAndPoliteRelock();
  test4_Deterministic400DaysAndSelfCarePauseResume();
  test5_MinorStrictProtection();
  test6_PostReleasePatchAutosaveSkillPreviewAndToasts();
  console.log('\nAll 6 Phase 3.2.3 verification tests PASSED!');
}

run();
