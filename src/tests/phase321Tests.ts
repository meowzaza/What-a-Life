import assert from 'node:assert/strict';
import { LIFESTYLE_PRESETS } from '../data/lifestylePresets';
import { STAGE_MIN_SLEEP_HOURS, TOTAL_WEEKLY_HOURS } from '../data/timeAlloc';
import { getLifeSubStageId } from '../engine/lifeStage';
import { applyEffects } from '../engine/log';
import { stepOneTick } from '../engine/pipeline';
import { hydrateLoadedGameState } from '../engine/save';
import { applyWeeklySkillTraining } from '../engine/skillTraining';
import { createInitialGameState, dispatchPlayerAction } from '../engine/state';
import type { GameState, LifeGenRequest } from '../engine/types';

function test1_MinorUnder15ZeroSideIncome() {
  const req: LifeGenRequest = {
    mode: 'at_age',
    seed: 50501,
    atAge: { targetAge: 10, wealthFocus: 'average' },
  };
  const initial = createInitialGameState(req);
  const startCash = initial.economy.cash;

  // Attempt preset work_and_gig -> must reject
  const presetRes = dispatchPlayerAction(initial, {
    type: 'APPLY_LIFESTYLE_PRESET',
    presetId: 'work_and_gig',
  });
  assert.equal(presetRes.accepted, false, 'Age 10 must reject work_and_gig preset');

  // Attempt manual CONFIRM_LIFE_PLANNER with side_gig_work at age 10 -> must reject
  const badGrid = {
    weekday: { ...initial.planner!.grid.weekday },
    weekend: { ...initial.planner!.grid.weekend, afternoon: 'side_gig_work' as const },
  };
  const manualRes = dispatchPlayerAction(initial, {
    type: 'CONFIRM_LIFE_PLANNER',
    grid: badGrid,
    presetId: 'custom',
  });
  assert.equal(manualRes.accepted, false, 'Age 10 must reject planner grid containing side_gig_work');

  // Attempt migrating legacy routine: 'side_gig' save at age 12
  const legacyAge12: GameState = {
    ...createInitialGameState({
      mode: 'at_age',
      seed: 50502,
      atAge: { targetAge: 12, wealthFocus: 'average' },
    }),
    routine: 'side_gig',
    lifestylePresetId: undefined,
    timeAllocation: {
      sleep: 60,
      workOrStudy: 35,
      sideGig: 10,
      social: 14,
      hobby: 14,
      family: 21,
      selfDev: 14,
      nightlife: 0,
    },
  };
  const migrated = hydrateLoadedGameState(legacyAge12);
  assert.equal(migrated.timeAllocation?.sideGig, 0, 'Migrated age 12 sideGig must be stripped to 0');
  assert.equal(migrated.lifestylePresetId, 'balanced', 'Migrated age 12 side_gig routine must become balanced');

  // Direct AddMoney category: 'side' for age < 15 must be blocked in log.ts
  const afterDirect = applyEffects(initial, [
    { type: 'AddMoney', amount: 1500, category: 'side', reason: 'test_leak' },
  ]);
  assert.equal(afterDirect.economy.cash, startCash, 'Direct side income for <15 must be blocked');

  console.log('PASS [Test 1]: Age 6-14 has zero side-gig hours and zero side income in all paths');
}

function test2_EveryUnlockedPresetSumsTo168AndRespectsMinSleep() {
  const testAges = [8, 16, 25, 65];
  for (const age of testAges) {
    const base = createInitialGameState({
      mode: 'at_age',
      seed: 60000 + age,
      atAge: { targetAge: age, wealthFocus: 'average' },
    });
    const stateWithGig: GameState =
      age >= 15
        ? {
            ...base,
            sideGigRecord: {
              id: 'gig_test',
              title: 'ขายของออนไลน์',
              sceneId: 'street_shops',
              hourlyPay: 100,
              maxWeeklyHours: 16,
              isNightShift: false,
              hiredAtTotalDay: 0,
            },
          }
        : base;

    const stageId = getLifeSubStageId(age);
    const minSleep = STAGE_MIN_SLEEP_HOURS[stageId];

    for (const preset of LIFESTYLE_PRESETS) {
      const res = dispatchPlayerAction(stateWithGig, {
        type: 'APPLY_LIFESTYLE_PRESET',
        presetId: preset.id,
      });
      if (!res.accepted) continue;
      const alloc = res.state.timeAllocation!;
      const sum =
        alloc.sleep +
        alloc.workOrStudy +
        alloc.sideGig +
        alloc.social +
        alloc.hobby +
        alloc.family +
        alloc.selfDev +
        alloc.nightlife;
      assert.equal(sum, TOTAL_WEEKLY_HOURS, `Preset ${preset.id} at age ${age} must sum to 168`);
      assert.ok(alloc.sleep >= minSleep, `Preset ${preset.id} at age ${age} sleep >= ${minSleep}`);
      if (age < 18) {
        assert.equal(alloc.nightlife, 0, `Preset ${preset.id} minor nightlife must be 0`);
        assert.ok(
          alloc.workOrStudy + alloc.sideGig <= 48,
          `Preset ${preset.id} minor work+sideGig <= 48`
        );
      }
    }
  }
  console.log('PASS [Test 2]: All unlocked presets across stages sum strictly to 168h & satisfy minSleep/minor limits');
}

function test3_SkillStaircaseCeilingsAndSocialNoSoftLock() {
  let state = createInitialGameState({
    mode: 'at_age',
    seed: 70707,
    atAge: { targetAge: 22, education: 'bachelor', wealthFocus: 'comfortable' },
  });

  // 3A. Self-study at Lv.2 full XP bar stops strictly at Lv.2 (compat 39) without Tier 2 course
  state = {
    ...state,
    character: {
      ...state.character,
      skills: { ...state.character.skills, tech: 38 },
    },
    skillTraining: {
      ...state.skillTraining!,
      skillStates: {
        ...state.skillTraining!.skillStates!,
        tech: { level: 2, xp: 295, unlockedTier: 1, certificates: [] },
      },
    },
    economy: { ...state.economy, jobId: 'unemployed', cash: 20000 },
    timeAllocation: {
      sleep: 56,
      workOrStudy: 0,
      sideGig: 0,
      social: 16,
      hobby: 24,
      family: 16,
      selfDev: 56,
      nightlife: 0,
    },
  };
  state = dispatchPlayerAction(state, { type: 'SET_SKILL_FOCUS', focus: ['tech'] }).state;
  for (let w = 0; w < 6; w++) {
    state = applyWeeklySkillTraining(state, false);
  }
  assert.equal(state.skillTraining?.skillStates?.tech?.level, 2, 'Self-study must cap strictly at Lv.2 without active course');
  assert.equal(state.character.skills.tech, 39, 'Self-study compat score must cap strictly at 39 without Tier 2 unlock');

  // 3B. Enrolling in standard 8-week Tier 2 course unlocks Lv.4 (compat 79); Lv.4 full stops at 79 without real-world Tier 3 job
  const enroll = dispatchPlayerAction(state, {
    type: 'ENROLL_SKILL_COURSE',
    skillId: 'tech',
    weeks: 8,
  });
  assert.equal(enroll.accepted, true, 'Adult with sufficient cash can enroll in standard 8-week Tier 2 course');
  state = {
    ...enroll.state,
    character: {
      ...enroll.state.character,
      skills: { ...enroll.state.character.skills, tech: 78 },
    },
    skillTraining: {
      ...enroll.state.skillTraining!,
      skillStates: {
        ...enroll.state.skillTraining!.skillStates!,
        tech: { level: 4, xp: 1495, unlockedTier: 2, certificates: [] },
      },
    },
  };
  for (let w = 0; w < 4; w++) {
    state = applyWeeklySkillTraining(state, false);
  }
  assert.equal(state.skillTraining?.skillStates?.tech?.level, 4, 'Course without real-world job must cap strictly at Lv.4');
  assert.equal(state.character.skills.tech, 79, 'Course without real-world job compat score must cap strictly at 79');

  // 3C. Social unlocks Tier 3 (Lv.5) via >=10h/wk social for 8 weeks without needing a job
  state = {
    ...state,
    character: {
      ...state.character,
      skills: { ...state.character.skills, social: 78 },
    },
    skillTraining: {
      ...state.skillTraining!,
      skillStates: {
        ...state.skillTraining!.skillStates!,
        social: { level: 4, xp: 1490, unlockedTier: 2, certificates: [] },
      },
    },
    timeAllocation: {
      sleep: 56,
      workOrStudy: 0,
      sideGig: 0,
      social: 20,
      hobby: 30,
      family: 20,
      selfDev: 42,
      nightlife: 0,
    },
  };
  state = dispatchPlayerAction(state, { type: 'SET_SKILL_FOCUS', focus: ['social'] }).state;
  for (let w = 0; w < 10; w++) {
    state = applyWeeklySkillTraining(state, false);
  }
  assert.equal(state.skillTraining?.skillStates?.social?.level, 5, 'Social must reach Lv.5 after >=10h/wk social for 8+ weeks');
  assert.ok(
    state.character.skills.social > 79,
    `Social must unlock Tier 3 (>79) after >=10h/wk for 8 weeks (got ${state.character.skills.social})`
  );

  console.log('PASS [Test 3]: Skill staircase walls (Lv.2/Lv.4/Lv.5) & non-softlocked Tier 3 social work accurately');
}

function test4_DeterminismX1VsX20WithPresetsAndTraining() {
  const req: LifeGenRequest = {
    mode: 'at_age',
    seed: 888321,
    atAge: { targetAge: 21, education: 'bachelor', wealthFocus: 'average' },
  };
  let s1 = createInitialGameState(req);
  let s20 = createInitialGameState(req);

  const runActionAtDay = (st: GameState, day: number): GameState => {
    if (day === 2) {
      return dispatchPlayerAction(st, { type: 'SET_SKILL_FOCUS', focus: ['tech', 'business'] }).state;
    }
    if (day === 3) {
      return dispatchPlayerAction(st, { type: 'APPLY_LIFESTYLE_PRESET', presetId: 'skill_grind' }).state;
    }
    if (day === 10 && st.economy.cash >= 500) {
      return dispatchPlayerAction(st, { type: 'ENROLL_SKILL_COURSE', skillId: 'tech', weeks: 8 }).state;
    }
    return st;
  };

  for (let d = 0; d < 80; d++) {
    s1 = runActionAtDay(s1, s1.date.totalDays);
    if (s1.pendingPrompt) {
      s1 = dispatchPlayerAction(s1, {
        type: 'RESOLVE_PROMPT',
        promptId: s1.pendingPrompt.id,
        choiceId: s1.pendingPrompt.choices[0].id,
      }).state;
    }
    s1 = stepOneTick(s1);
  }

  let rem = 80;
  while (rem > 0) {
    const batch = Math.min(20, rem);
    for (let i = 0; i < batch; i++) {
      s20 = runActionAtDay(s20, s20.date.totalDays);
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

  assert.equal(s1.economy.cash, s20.economy.cash, 'Cash must match x1 vs x20');
  assert.deepEqual(s1.character.skills, s20.character.skills, 'Skills must match x1 vs x20');
  assert.equal(s1.lifestylePresetId, s20.lifestylePresetId, 'Lifestyle preset must match x1 vs x20');
  assert.deepEqual(s1.skillTraining, s20.skillTraining, 'SkillTraining state must match x1 vs x20');
  console.log('PASS [Test 4]: x1 vs x20 determinism matches 100% with presets, skill focus & courses');
}

function test5_LegacySaveMigrationRoutineToPreset() {
  const baseAdult = createInitialGameState({
    mode: 'at_age',
    seed: 91919,
    atAge: { targetAge: 25, education: 'bachelor', wealthFocus: 'average' },
  });

  const mRest = hydrateLoadedGameState({
    ...baseAdult,
    routine: 'rest',
    lifestylePresetId: undefined,
  });
  assert.equal(mRest.lifestylePresetId, 'rest_recover', 'rest -> rest_recover');

  const mStudy = hydrateLoadedGameState({
    ...baseAdult,
    routine: 'study',
    lifestylePresetId: undefined,
  });
  assert.equal(mStudy.lifestylePresetId, 'skill_grind', 'study -> skill_grind');

  const mSideGigNoRecord = hydrateLoadedGameState({
    ...baseAdult,
    routine: 'side_gig',
    sideGigRecord: null,
    lifestylePresetId: undefined,
  });
  assert.equal(mSideGigNoRecord.lifestylePresetId, 'balanced', 'side_gig without record -> balanced');
  assert.ok(
    mSideGigNoRecord.timeline.some((t) => t.title.includes('ย้ายข้อมูลวิถีชีวิต')),
    'Rejected side_gig migration must record timeline note'
  );

  console.log('PASS [Test 5]: Phase 3.2 save migration maps routine -> lifestylePresetId cleanly');
}

function main() {
  test1_MinorUnder15ZeroSideIncome();
  test2_EveryUnlockedPresetSumsTo168AndRespectsMinSleep();
  test3_SkillStaircaseCeilingsAndSocialNoSoftLock();
  test4_DeterminismX1VsX20WithPresetsAndTraining();
  test5_LegacySaveMigrationRoutineToPreset();
  console.log('ALL 5 PHASE 3.2.1 TESTS PASSED!');
}

main();
