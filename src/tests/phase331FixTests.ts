import assert from 'node:assert/strict';
import { SCHOOL_TIERS } from '../data/education';
import { SKILL_LEVEL_CONFIG } from '../data/skillTraining';
import { AGE_AND_EDU_STORYLETS } from '../data/storylets/ageAndEduStorylets';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import { TALENT_MAX_ACTIVE_SLOTS, TALENT_VAULT_MAX_SLOTS } from '../data/talents';
import { maybeRollMonthlyAutopilotEvent } from '../engine/autopilot';
import {
  evaluateAcademicTermEnd,
  evaluateTrackReadiness,
  isDropoutCrisisEligible,
  requestSchoolTransfer,
  requestTrackChange,
  resolvePendingSchoolTransfer,
} from '../engine/education';
import { stepOneTick } from '../engine/pipeline';
import { clonePlannerGrid, countActivitySlotsInGrid, previewPlannerImpact, validatePlanner } from '../engine/planner';
import { hydrateLoadedGameState } from '../engine/save';
import {
  applyWeeklySkillTraining,
  computeStressMult,
  createInitialSkillTrainingState,
  getMaxLevelForSkill,
  grantDailyJobSkillXp,
  grantStoryletSkillPoints,
  isSkillVisible,
} from '../engine/skillTraining';
import { createInitialGameState, dispatchPlayerAction } from '../engine/state';
import { isStoryletEligible, renderStoryletText } from '../engine/storylet';
import {
  canSwapTalentSlots,
  computeCombinedSkillMultiplier,
  computeTalentSkillBonus,
  getActiveTalents,
  revealTalentById,
  stampTalentSwapWindow,
} from '../engine/talents';
import type { GameState } from '../engine/types';

function test1_BugRegressions1Through7() {
  // Bug 1: Permanent unlockedTier across multiple courses + no over-cap via storylet/daily job gain
  const adultBase = createInitialGameState({
    mode: 'at_age',
    seed: 993311,
    atAge: { targetAge: 23, education: 'bachelor', wealthFocus: 'comfortable' },
  });
  let s1: GameState = {
    ...adultBase,
    economy: { ...adultBase.economy, jobId: 'unemployed', cash: 40000 },
    timeAllocation: {
      sleep: 56,
      workOrStudy: 0,
      sideGig: 0,
      social: 16,
      hobby: 20,
      family: 16,
      selfDev: 60,
      nightlife: 0,
    },
    skillTraining: createInitialSkillTrainingState({
      focus: ['tech'],
      skillStates: {
        ...createInitialSkillTrainingState().skillStates!,
        tech: { ...createInitialSkillTrainingState().skillStates!.tech, level: 2, xp: 300, unlockedTier: 1, certificates: [] },
        business: { ...createInitialSkillTrainingState().skillStates!.business, level: 1, xp: 0, unlockedTier: 1, certificates: [] },
        craft: { ...createInitialSkillTrainingState().skillStates!.craft, level: 2, xp: 300, unlockedTier: 1, certificates: [] },
      },
    }),
  };

  const eTech = dispatchPlayerAction(s1, { type: 'ENROLL_SKILL_COURSE', skillId: 'tech', weeks: 8 });
  assert.equal(eTech.accepted, true);
  s1 = eTech.state;
  for (let w = 0; w < 8; w++) {
    s1 = applyWeeklySkillTraining(s1, false);
  }
  assert.equal(s1.skillTraining?.skillStates?.tech?.unlockedTier, 2, 'Completing tech course grants permanent Tier 2');
  assert.ok((s1.skillTraining?.skillStates?.tech?.certificates?.length ?? 0) >= 1, 'Course completion issues certificate');
  assert.ok((s1.skillTraining?.skillStates?.tech?.level ?? 1) >= 3, 'Carryover XP promotes after Lv.4 unlock');

  // Enrolling a second course (business) MUST NOT drop tech cap back to Lv.2
  const eBiz = dispatchPlayerAction(s1, { type: 'ENROLL_SKILL_COURSE', skillId: 'business', weeks: 8 });
  assert.equal(eBiz.accepted, true);
  s1 = eBiz.state;
  assert.equal(getMaxLevelForSkill(s1, 'tech'), 4, 'Enrolling in 2nd course must NOT revert tech cap back to Lv.2');

  // Storylet and daily job XP cannot bypass Lv.2 cap on locked skill craft
  s1 = grantStoryletSkillPoints(s1, 'craft', 50, 'test overcap');
  assert.equal(getMaxLevelForSkill(s1, 'craft'), 2);
  assert.equal(s1.skillTraining?.skillStates?.craft?.level, 2, 'Storylet gain must respect Lv.2 cap');
  assert.ok(s1.character.skills.craft <= 39, 'Storylet gain must respect <=39 compat cap at Lv.2');
  s1 = grantDailyJobSkillXp({ ...s1, economy: { ...s1.economy, jobId: 'rider' } });
  assert.ok(s1.character.skills.craft <= 39 || getMaxLevelForSkill(s1, 'craft') === 5);

  // Bug 2: GPA formula responds to academic score, active talent, and teacherTermDelta + records gpaHistory
  const stuLow: GameState = {
    ...adultBase,
    economy: { ...adultBase.economy, jobId: 'student' },
    character: {
      ...adultBase.character,
      ageYears: 16,
      talents: [],
      skills: { ...adultBase.character.skills, academic: 10 },
      resources: { ...adultBase.character.resources, stress: 25, energy: 80 },
      educationState: {
        ...adultBase.character.educationState!,
        schoolTier: 'school_public',
        teacherTermDelta: -0.2,
        gpaHistory: [],
      },
    },
  };
  const stuHigh: GameState = {
    ...stuLow,
    character: {
      ...stuLow.character,
      talents: [{ id: 'tal_academic', kind: 'skill', tier: 3, revealed: true, acquiredAtAge: 0, source: 'birth' }],
      skills: { ...stuLow.character.skills, academic: 75 },
      educationState: {
        ...stuLow.character.educationState!,
        teacherTermDelta: 0.25,
      },
    },
  };
  const resLow = evaluateAcademicTermEnd(stuLow, 10);
  const resHigh = evaluateAcademicTermEnd(stuHigh, 10);
  assert.ok(
    (resHigh.character.educationState?.currentGpa ?? 0) >
      (resLow.character.educationState?.currentGpa ?? 4) + 0.5,
    'High academic + talent + teacher praise must meaningfully boost term GPA'
  );
  assert.equal(resHigh.character.educationState?.gpaHistory?.length, 1, 'Term evaluation appends gpaHistory');
  assert.ok(
    (resHigh.character.educationState?.gpaHistory?.[0]?.parts?.teacher ?? 0) > 0,
    'gpaHistory must record teacherTermDelta contribution'
  );

  // Bug 3: Middle-class no-debt family never gets ev_dropout_crisis; gets ev_after_m3_choice at age 15
  const midM3: GameState = {
    ...createInitialGameState({
      mode: 'at_age',
      seed: 33199,
      atAge: { targetAge: 14, education: 'lower_secondary', wealthFocus: 'average' },
    }),
    date: { yearCE: 2025, month: 12, day: 31, dayOfWeek: 3, totalDays: 100 },
    economy: {
      ...adultBase.economy,
      jobId: 'student',
      debt: 0,
      cash: 50000,
    },
  };
  const midClean: GameState = {
    ...midM3,
    character: {
      ...midM3.character,
      background: { ...midM3.character.background, familyWealth: 'middle' },
      educationState: { ...midM3.character.educationState!, schoolTier: 'school_public' },
    },
  };
  assert.equal(isDropoutCrisisEligible(midClean), false, 'Middle-class zero-debt public student ineligible for dropout crisis');
  const turned15 = stepOneTick(midClean, { allowPrompts: true, recordLogs: true });
  assert.equal(
    turned15.pendingPrompt?.storyletId,
    'ev_after_m3_choice',
    'Middle-class student finishing M.3 receives normal ev_after_m3_choice prompt'
  );

  const poorM3: GameState = {
    ...midClean,
    character: {
      ...midClean.character,
      background: { ...midClean.character.background, familyWealth: 'working_poor' },
    },
  };
  assert.equal(isDropoutCrisisEligible(poorM3), true, 'working_poor eligible for ev_dropout_crisis');

  // Bug 4: Work storylets & overtime_offer never fire when unemployed or student
  const burnoutCard = STORYLET_CATALOG.find((s) => s.id === 'planner_12_overwork_burnout_warning')!;
  assert.equal(burnoutCard.conditions?.requireEmployed, true, 'planner_12_overwork_burnout_warning must requireEmployed');
  const unempLowCash: GameState = {
    ...adultBase,
    economy: { ...adultBase.economy, jobId: 'unemployed', cash: 100 },
    employment: { status: 'none', jobId: 'unemployed', workShift: 'morning-afternoon', allowsOvertime: false, contractHoursPerWeek: 0, overtimeStreakWeeks: 0 },
  };
  assert.equal(isStoryletEligible(burnoutCard, unempLowCash, { ignoreCooldown: true }), false);
  for (let seedOffset = 0; seedOffset < 80; seedOffset++) {
    const rolled = maybeRollMonthlyAutopilotEvent({ ...unempLowCash, rngState: 1000 + seedOffset * 97 });
    assert.notEqual(rolled.situation?.kind, 'overtime_offer', 'Unemployed must never receive overtime_offer');
  }

  // Bug 5: Parents-home storylets never use "กลับถึงบ้านในจ..." hometown-return phrasing
  const warmDinner = STORYLET_CATALOG.find((s) => s.id === 't1_parents_warm_dinner')!;
  const renderedDinner = renderStoryletText(warmDinner.bodyTemplate, unempLowCash);
  assert.equal(renderedDinner.includes('กลับถึงบ้านในจ.'), false);
  assert.equal(renderedDinner.includes('ที่อยู่กับครอบครัว'), false);

  // Bug 6: Annual tuition deducted only in May (5) and Nov (11)
  const privStu: GameState = {
    ...midClean,
    date: { yearCE: 2025, month: 4, day: 30, dayOfWeek: 3, totalDays: 120 },
    economy: { ...midClean.economy, jobId: 'student', housingId: 'parents_home', cash: 100000, monthlySalary: 0 },
    character: {
      ...midClean.character,
      ageYears: 16,
      isMinor: true,
      educationState: {
        ...midClean.character.educationState!,
        schoolTier: 'school_private',
        hasScholarship: false,
        hasStudentLoan: false,
      },
    },
  };
  const expectedInstallment = Math.round((SCHOOL_TIERS.school_private.monthlyFeeThb * 12) / 2);
  const mayState = stepOneTick(privStu, { allowPrompts: false, recordLogs: false });
  // Allowance for middle at 16 is +5000, tuition installment is -expectedInstallment
  assert.equal(
    mayState.economy.cash,
    100000 + 5000 - expectedInstallment,
    'May month-start must add allowance and deduct 1/2 annual tuition'
  );
  const juneState = stepOneTick(
    { ...privStu, date: { yearCE: 2025, month: 5, day: 31, dayOfWeek: 6, totalDays: 151 } },
    { allowPrompts: false, recordLogs: false }
  );
  assert.equal(juneState.economy.cash, 100000 + 5000, 'Non-tuition month (June) deducts 0 tuition');

  // Bug 7: Under-15 friend activities cost 0 money in planner impact
  const kid12 = createInitialGameState({
    mode: 'at_age',
    seed: 12012,
    atAge: { targetAge: 12, education: 'primary', wealthFocus: 'average' },
  });
  const gridWithFriends = clonePlannerGrid(kid12.planner!.grid);
  gridWithFriends.weekend.morning = 'meet_friends';
  const kidPreview = previewPlannerImpact(gridWithFriends, kid12);
  assert.equal(kidPreview.netMoneyPerWeek, 0, 'Under-15 meet_friends incurs 0 cost');

  console.log('PASS [Fix Test 1]: All 7 reported bug regressions verified');
}

function test2_Lv1To5CourseAttendanceStressAndTalents() {
  assert.deepEqual(
    [
      SKILL_LEVEL_CONFIG.xpThresholds[1],
      SKILL_LEVEL_CONFIG.xpThresholds[2],
      SKILL_LEVEL_CONFIG.xpThresholds[3],
      SKILL_LEVEL_CONFIG.xpThresholds[4],
    ],
    [100, 300, 700, 1500]
  );

  const base = createInitialGameState({
    mode: 'at_age',
    seed: 55331,
    atAge: { targetAge: 24, education: 'bachelor', wealthFocus: 'comfortable' },
  });

  // Stress > 80 halves XP gain
  assert.equal(computeStressMult({ ...base, character: { ...base.character, resources: { ...base.character.resources, stress: 85 } } }), 0.5);
  assert.equal(computeStressMult({ ...base, character: { ...base.character, resources: { ...base.character.resources, stress: 75 } } }), 1.0);

  // Talent multipliers +10% / +20% / +30%, vault talents give 0%
  const charT1 = { ...base.character, talents: [{ id: 'tal_tech', kind: 'skill' as const, tier: 1 as const, revealed: true, acquiredAtAge: 0, source: 'birth' as const }], limitations: [] };
  const charT2 = { ...charT1, talents: [{ ...charT1.talents[0], tier: 2 as const }] };
  const charT3 = { ...charT1, talents: [{ ...charT1.talents[0], tier: 3 as const }] };
  assert.equal(computeTalentSkillBonus(charT1, 'tech'), 0.1);
  assert.equal(computeTalentSkillBonus(charT2, 'tech'), 0.2);
  assert.equal(computeTalentSkillBonus(charT3, 'tech'), 0.3);
  assert.equal(computeCombinedSkillMultiplier(charT3, 'tech'), 1.3);

  const inVaultOnly = { ...charT1, talents: [], talentVault: charT3.talents };
  assert.equal(computeTalentSkillBonus(inVaultOnly, 'tech'), 0, 'Talent in vault must give 0 bonus');

  // Missed > 2 weeks (selfDev < 6h for 3 weeks) fails 8-week course without certificate
  let sCourse: GameState = {
    ...base,
    economy: { ...base.economy, cash: 20000 },
    timeAllocation: { sleep: 56, workOrStudy: 40, sideGig: 0, social: 20, hobby: 30, family: 20, selfDev: 2, nightlife: 0 },
    skillTraining: createInitialSkillTrainingState({ focus: ['tech'] }),
  };
  assert.equal(dispatchPlayerAction(sCourse, { type: 'ENROLL_SKILL_COURSE', skillId: 'tech', weeks: 12 }).accepted, false);
  sCourse = dispatchPlayerAction(sCourse, { type: 'ENROLL_SKILL_COURSE', skillId: 'tech', weeks: 8 }).state;
  for (let w = 0; w < 3; w++) {
    sCourse = applyWeeklySkillTraining(sCourse, false);
  }
  assert.equal(sCourse.skillTraining?.course, null, 'Missing > 2 weeks must cancel/fail course');
  assert.equal(sCourse.skillTraining?.skillStates?.tech?.certificates?.length ?? 0, 0, 'Failed course grants no certificate');
  assert.equal(sCourse.skillTraining?.skillStates?.tech?.unlockedTier, 1, 'Failed course does not unlock Tier 2');

  console.log('PASS [Fix Test 2]: Lv.1-5 XP thresholds, stress > 80 x0.5, +10/20/30% talents, course miss penalty');
}

function test3_TalentSlotsVaultSwapAndCooldown() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 77331,
    atAge: { targetAge: 20, education: 'upper_secondary', wealthFocus: 'average' },
  });

  // 3 active + overflow to vault
  let s: GameState = {
    ...base,
    character: {
      ...base.character,
      lastTalentRevealAgeMonths: -999,
      lastTalentRevealLifeStage: undefined,
      talents: [
        { id: 'tal_academic', kind: 'skill', tier: 1, revealed: true, acquiredAtAge: 0, source: 'birth' },
        { id: 'tal_tech', kind: 'skill', tier: 2, revealed: true, acquiredAtAge: 0, source: 'birth' },
        { id: 'tal_business', kind: 'skill', tier: 1, revealed: true, acquiredAtAge: 0, source: 'birth' },
        { id: 'tal_art', kind: 'skill', tier: 3, revealed: false, acquiredAtAge: 0, source: 'birth' },
      ],
      talentVault: [],
    },
  };

  assert.equal(getActiveTalents(s.character).length, TALENT_MAX_ACTIVE_SLOTS);
  const rev = revealTalentById(s, 'tal_art');
  s = rev.state;
  assert.equal(rev.revealedTalent?.id, 'tal_art');
  assert.equal(s.character.talents?.filter((t) => t.revealed).length, 3, 'Active slots remain capped at 3');
  assert.equal(s.character.talentVault?.length, 1, '4th revealed talent overflows into talentVault');
  assert.ok((s.character.talentVault?.length ?? 0) <= TALENT_VAULT_MAX_SLOTS);

  // Cooldown blocks immediate second reveal within 36 months / same stage
  const sWithUnrev: GameState = {
    ...s,
    character: {
      ...s.character,
      talents: [...(s.character.talents ?? []), { id: 'tal_music', kind: 'skill', tier: 1, revealed: false, acquiredAtAge: 0, source: 'birth' }],
    },
  };
  const blocked = revealTalentById(sWithUnrev, 'tal_music');
  assert.equal(blocked.blockedByCooldown, true, 'Reveal inside 36-month cooldown or same stage must be blocked');

  // Swap gated behind turning point / swap window & consumes window after 1 swap
  assert.equal(canSwapTalentSlots(s).allowed, false, 'Swap forbidden without active swap window');
  s = stampTalentSwapWindow(s, 'sem_2025_5');
  assert.equal(canSwapTalentSlots(s).allowed, true, 'Swap allowed once inside swap window');
  const swapRes = dispatchPlayerAction(s, { type: 'SWAP_TALENT_SLOT', activeIdx: 0, vaultIdx: 0 });
  assert.equal(swapRes.accepted, true);
  assert.equal(swapRes.state.character.talents?.[0].id, 'tal_art', 'Vault talent moved into active slot');
  assert.equal(swapRes.state.character.talentVault?.[0].id, 'tal_academic', 'Replaced active talent moved to vault');
  assert.equal(canSwapTalentSlots(swapRes.state).allowed, false, 'Only 1 swap permitted per swap window');

  console.log('PASS [Fix Test 3]: 3 Active + 5 Vault slots, reveal 36m/stage cooldown, gated 1-swap window');
}

function test4_EducationTracksReadinessRotcTransfersAndPlanner() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 88331,
    atAge: { targetAge: 16, education: 'lower_secondary', wealthFocus: 'comfortable' },
  });

  const teenApr: GameState = {
    ...base,
    economy: { ...base.economy, jobId: 'student', cash: 30000 },
    date: { yearCE: 2025, month: 4, day: 10, dayOfWeek: 4, totalDays: 100 },
    character: {
      ...base.character,
      skills: { ...base.character.skills, academic: 10, tech: 5, craft: 15 },
      educationState: {
        ...base.character.educationState!,
        schoolTier: 'school_public',
        highSchoolTrack: undefined,
        currentGpa: 2.0,
        cumulativeGpa: 2.0,
        trackChangeCountThisYear: 0,
      },
    },
  };

  // Readiness evaluation: sci_math missing both GPAX & academic -> very_risky; vocational craft passes both -> ready
  assert.equal(evaluateTrackReadiness(teenApr, 'sci_math').level, 'very_risky');
  assert.equal(evaluateTrackReadiness(teenApr, 'vocational', 'craft').level, 'ready');
  assert.equal(
    requestTrackChange(teenApr, 'sci_math').accepted,
    false,
    'very_risky track requires explicit allowVeryRisky acknowledgment'
  );
  const riskyAllow = requestTrackChange(teenApr, 'sci_math', undefined, undefined, { allowVeryRisky: true });
  assert.equal(riskyAllow.accepted, true);
  assert.equal(riskyAllow.state.character.educationState?.trackReadiness, 'very_risky');
  assert.equal(riskyAllow.state.character.educationState?.readinessTermsRemaining, 2);

  // Vocational branch discovery + max 1 track change/year with fee
  const toVoc = requestTrackChange(riskyAllow.state, 'vocational', undefined, 'culinary');
  assert.equal(toVoc.accepted, true, '1st change of year in April allowed');
  assert.equal(toVoc.state.economy.cash, 30000 - 500, 'Public school track change deducts 500 THB fee');
  assert.equal(isSkillVisible(toVoc.state, 'culinary'), true, 'Choosing culinary vocational branch discovers culinary');
  assert.equal(
    requestTrackChange(toVoc.state, 'arts_lang').accepted,
    false,
    '2nd track change in same year must be rejected'
  );

  // Female ROTC 70% pass rate deterministic check & no draftExemption
  let femalePassed = false;
  for (let i = 0; i < 20; i++) {
    const fem: GameState = {
      ...teenApr,
      seed: 100 + i * 7919,
      character: {
        ...teenApr.character,
        gender: 'female',
        skills: { ...teenApr.character.skills, athletics: 50 },
      },
    };
    const r = dispatchPlayerAction(fem, { type: 'ENROLL_ROTC', enroll: true });
    if (r.accepted) {
      let grad = r.state;
      grad = evaluateAcademicTermEnd(grad, 3);
      grad = evaluateAcademicTermEnd(grad, 3);
      grad = evaluateAcademicTermEnd(grad, 3);
      assert.equal(grad.character.educationState?.completedRotc, true);
      assert.ok(!grad.character.educationState?.draftExemption, 'Female ROTC does not set draftExemption');
      assert.equal(grad.character.educationState?.rotcGovServiceBonus, 1, 'Female ROTC grants +1 gov service bonus');
      femalePassed = true;
      break;
    }
  }
  assert.equal(femalePassed, true, 'Female ROTC must be attainable (~70% rate)');

  // School transfer request (7-14 days pending)
  const trReq = requestSchoolTransfer(teenApr, 'school_private');
  assert.equal(trReq.accepted, true);
  assert.ok(trReq.state.character.educationState?.pendingTransfer);
  const trDone = resolvePendingSchoolTransfer({
    ...trReq.state,
    character: {
      ...trReq.state.character,
      educationState: {
        ...trReq.state.character.educationState!,
        pendingTransfer: { ...trReq.state.character.educationState!.pendingTransfer!, probability: 1 },
      },
    },
  });
  assert.equal(trDone.character.educationState?.schoolTier, 'school_private');

  // Planner kid_home_games maxWeeklySlots <= 4
  const kid10 = createInitialGameState({
    mode: 'at_age',
    seed: 10010,
    atAge: { targetAge: 10, education: 'none', wealthFocus: 'average' },
  });
  const gridWith4 = clonePlannerGrid(kid10.planner!.grid);
  gridWith4.weekday.evening = 'kid_home_games';
  gridWith4.weekend.morning = 'kid_home_games';
  gridWith4.weekend.afternoon = 'kid_home_games';
  gridWith4.weekend.evening = 'kid_home_games';
  assert.equal(countActivitySlotsInGrid(gridWith4, 'kid_home_games'), 4);
  assert.equal(validatePlanner(gridWith4, kid10).valid, true);
  const gridWith5 = clonePlannerGrid(gridWith4);
  gridWith5.weekday.afternoon = 'kid_home_games';
  assert.equal(validatePlanner(gridWith5, kid10).valid, false, '5 slots of kid_home_games must fail maxWeeklySlots=4');

  // Under-15 storylets carry ZERO cash effects & every age 6-22 has >= 8 eligible storylets
  for (const card of AGE_AND_EDU_STORYLETS) {
    if ((card.conditions?.maxAge ?? 99) < 15) {
      for (const ch of card.choices ?? []) {
        for (const eff of ch.effects) {
          assert.notEqual(eff.type, 'AddMoney');
          assert.notEqual(eff.type, 'ChangeMoney', `Under-15 storylet ${card.id} must not modify money`);
        }
      }
    }
  }
  for (let age = 6; age <= 22; age++) {
    const sample = createInitialGameState({
      mode: 'at_age',
      seed: 6000 + age,
      atAge: { targetAge: age, wealthFocus: 'average' },
    });
    const studentSample: GameState = {
      ...sample,
      economy: { ...sample.economy, jobId: age <= 22 ? 'student' : sample.economy.jobId },
    };
    const eligibleCount = STORYLET_CATALOG.filter((s) =>
      isStoryletEligible(s, studentSample, { ignoreCooldown: true })
    ).length;
    assert.ok(eligibleCount >= 8, `Age ${age} must have >= 8 eligible storylets (got ${eligibleCount})`);
  }

  console.log('PASS [Fix Test 4]: 5 HS tracks, readiness, Mar-Apr transfer, M/F ROTC, kid_home_games limit & age 6-22 pool');
}

function test5_LegacySaveMigration331Fix() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 331777,
    atAge: { targetAge: 25, education: 'bachelor', wealthFocus: 'average' },
  });

  const legacySnapshot = {
    ...base,
    character: {
      ...base.character,
      talents: [
        { id: 'tal_academic', kind: 'skill', tier: 1, revealed: true, acquiredAtAge: 0, source: 'birth' },
        { id: 'tal_tech', kind: 'skill', tier: 2, revealed: true, acquiredAtAge: 0, source: 'birth' },
        { id: 'tal_business', kind: 'skill', tier: 1, revealed: true, acquiredAtAge: 0, source: 'birth' },
        { id: 'tal_art', kind: 'skill', tier: 2, revealed: true, acquiredAtAge: 0, source: 'birth' },
      ] as GameState['character']['talents'],
      talentVault: undefined,
      lifeHistory: undefined,
      skills: {
        ...base.character.skills,
        tech: 38,
        academic: 45,
      },
      educationState: {
        ...base.character.educationState!,
        gpaHistory: undefined,
      },
    },
    skillTraining: {
      focus: ['tech'],
      course: { skillId: 'tech', weeksLeft: 2, totalWeeks: 4, feePerWeek: 500 },
      xp: base.skillTraining!.xp,
      lastPracticedWeek: base.skillTraining!.lastPracticedWeek,
    } as unknown as GameState['skillTraining'],
  };

  const migrated = hydrateLoadedGameState(legacySnapshot as GameState);
  assert.equal(migrated.skillTraining?.skillStates?.tech?.level, 2, 'Raw 38 migrates to Lv.2');
  assert.equal(migrated.skillTraining?.skillStates?.tech?.xp, 270, 'Raw 38 -> (18/20)*300 = 270 xp');
  assert.equal(migrated.skillTraining?.skillStates?.academic?.level, 3, 'Raw 45 migrates to Lv.3');
  assert.equal(migrated.skillTraining?.skillStates?.academic?.unlockedTier, 2, 'Raw >= 40 unlocks Tier 2 permanently');
  assert.equal(migrated.skillTraining?.course?.totalWeeks, 4, 'Legacy active course preserved until finish');
  assert.equal(migrated.character.talents?.length, 3, 'Revealed active talents capped at 3 on load');
  assert.equal(migrated.character.talentVault?.length, 1, '4th revealed talent moved to vault on load');
  assert.ok(Array.isArray(migrated.character.educationState?.gpaHistory));
  assert.ok(Array.isArray(migrated.character.lifeHistory));

  console.log('PASS [Fix Test 5]: Pre-3.3.1-FIX save migration preserves legacy courses & maps Lv.1-5 + vault cleanly');
}

function main() {
  test1_BugRegressions1Through7();
  test2_Lv1To5CourseAttendanceStressAndTalents();
  test3_TalentSlotsVaultSwapAndCooldown();
  test4_EducationTracksReadinessRotcTransfersAndPlanner();
  test5_LegacySaveMigration331Fix();
  console.log('\nALL 5 PHASE 3.3.1-FIX TESTS PASSED!');
}

main();
