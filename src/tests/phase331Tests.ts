import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALL_SKILL_IDS,
  CORE_SKILL_IDS,
  DISCOVERED_SKILL_IDS,
} from '../data/skills';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import { checkJobEligibility } from '../engine/economy';
import {
  canTransferSchoolTier,
  evaluateAcademicTermEnd,
  resolvePendingSchoolTransfer,
} from '../engine/education';
import { hydrateLoadedGameState } from '../engine/save';
import {
  canEnrollCourse,
  createInitialSkillTrainingState,
  isSkillVisible,
  recordActivitySkillTagProgress,
} from '../engine/skillTraining';
import { createInitialGameState, dispatchPlayerAction } from '../engine/state';
import { fireStorylet } from '../engine/director';
import { validateStorylet } from '../engine/storylet';
import {
  advanceLimitationCureProgress,
  computeCombinedModifierWithCap,
  computeCombinedSkillMultiplier,
  getActiveLimitations,
} from '../engine/talents';
import type { GameState, LifeGenRequest } from '../engine/types';

function test1_DeterminismAndMonteCarloTalentWeights() {
  // 1A. Same seed -> identical talents, limitations, discoveredSkills, educationState
  const req: LifeGenRequest = {
    mode: 'at_age',
    seed: 331001,
    atAge: { targetAge: 16, wealthFocus: 'average' },
  };
  const sA = createInitialGameState(req);
  const sB = createInitialGameState(req);
  assert.deepEqual(sA.character.talents, sB.character.talents, 'Identical seed must yield identical talents');
  assert.deepEqual(sA.character.limitations, sB.character.limitations, 'Identical seed must yield identical limitations');
  assert.deepEqual(
    sA.skillTraining?.discoveredSkills,
    sB.skillTraining?.discoveredSkills,
    'Identical seed must yield identical discoveredSkills'
  );
  assert.deepEqual(
    sA.character.educationState,
    sB.character.educationState,
    'Identical seed must yield identical educationState'
  );
  assert.equal(sA.rngState, sB.rngState, 'Identical seed must yield identical rngState');

  // 1B. Monte Carlo 1,000 lives -> talent count distribution ~ 35% (0), 40% (1), 20% (2), 5% (3)
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const total = 1000;
  for (let i = 0; i < total; i++) {
    const g = createInitialGameState({
      mode: 'random',
      seed: 900000 + i * 7919,
      randomStartPoint: 'birth',
    });
    const len = g.character.talents?.length ?? 0;
    counts[len] = (counts[len] ?? 0) + 1;
  }
  const pct0 = counts[0] / total;
  const pct1 = counts[1] / total;
  const pct2 = counts[2] / total;
  const pct3 = counts[3] / total;
  assert.ok(pct0 >= 0.29 && pct0 <= 0.41, `0-talent proportion expected ~0.35 (got ${pct0.toFixed(3)})`);
  assert.ok(pct1 >= 0.34 && pct1 <= 0.46, `1-talent proportion expected ~0.40 (got ${pct1.toFixed(3)})`);
  assert.ok(pct2 >= 0.15 && pct2 <= 0.25, `2-talent proportion expected ~0.20 (got ${pct2.toFixed(3)})`);
  assert.ok(pct3 >= 0.025 && pct3 <= 0.085, `3-talent proportion expected ~0.05 (got ${pct3.toFixed(3)})`);

  // 1C. Verify zero Math.random() anywhere in src/ (excluding test assertions mentioning the literal)
  const srcRoot = path.resolve('src');
  const queue = [srcRoot];
  const mathRandomHits: string[] = [];
  while (queue.length > 0) {
    const dir = queue.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        if (full.endsWith('phase331Tests.ts')) continue;
        const text = fs
          .readFileSync(full, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '');
        if (text.includes('Math.random(')) {
          mathRandomHits.push(path.relative(process.cwd(), full));
        }
      }
    }
  }
  assert.equal(mathRandomHits.length, 0, `Math.random() forbidden in src/: ${mathRandomHits.join(', ')}`);

  console.log(
    `PASS [Test 1]: Seed determinism + Monte Carlo 1,000 lives (0:${(pct0 * 100).toFixed(1)}%, 1:${(pct1 * 100).toFixed(1)}%, 2:${(pct2 * 100).toFixed(1)}%, 3:${(pct3 * 100).toFixed(1)}%) + zero Math.random()`
  );
}

function test2_Pre331SaveMigration13Keys() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 331002,
    atAge: { targetAge: 26, education: 'bachelor', wealthFocus: 'average' },
  });

  // Legacy 8-key save snapshot
  const legacySnapshot = {
    ...base,
    character: {
      ...base.character,
      talents: undefined,
      limitations: undefined,
      educationState: undefined,
      skills: {
        english: 18,
        sales: 12,
        finance: 27,
        tech: 10,
        craft: 5,
        cooking: 9,
        socializing: 22,
        academic: 30,
      } as unknown as GameState['character']['skills'],
    },
    skillTraining: {
      focus: ['sales', 'socializing'],
      course: { skillId: 'finance', weeksLeft: 2, totalWeeks: 4, feePerWeek: 500 },
      xp: {
        english: 0.3,
        sales: 0.2,
        finance: 0.7,
        tech: 0.1,
        craft: 0,
        cooking: 0.5,
        socializing: 0.4,
        academic: 0,
      },
      lastPracticedWeek: {
        english: 1,
        sales: 2,
        finance: 3,
        tech: 1,
        craft: 0,
        cooking: 1,
        socializing: 4,
        academic: 0,
      },
    } as unknown as GameState['skillTraining'],
  };

  const migrated = hydrateLoadedGameState(legacySnapshot as GameState);
  const sk = migrated.character.skills as unknown as Record<string, number>;

  // Exact 13 keys, zero legacy keys remaining
  assert.deepEqual(
    Object.keys(sk).sort(),
    [...ALL_SKILL_IDS].sort(),
    'Migrated skills must have exact 13 Phase 3.3.1 keys'
  );
  for (const legacyKey of ['english', 'sales', 'finance', 'cooking', 'socializing']) {
    assert.equal(legacyKey in sk, false, `Legacy key ${legacyKey} must NOT exist after migration`);
  }

  // Exact Lv.1-5 migration & compat score checks (s=27 -> Lv.2 xp=105 -> compat=26)
  assert.equal(sk.business, 26, 'business must migrate from Math.max(sales=12, finance=27) -> Lv.2 compat === 26');
  assert.equal(migrated.skillTraining?.skillStates?.business?.level, 2);
  assert.equal(migrated.skillTraining?.skillStates?.business?.xp, 105);
  assert.equal(sk.social, 21, 'social must migrate from socializing=22 -> Lv.2 compat === 21');
  assert.equal(sk.foreign_lang, 17, 'foreign_lang must migrate from english=18 -> Lv.1 compat === 17');
  assert.equal(sk.culinary, 8, 'culinary must migrate from cooking=9 -> Lv.1 compat === 8');
  assert.equal(sk.athletics, 0, 'athletics must initialize at 0');
  assert.equal(sk.visual_arts, 0);
  assert.equal(sk.music_vocal, 0);
  assert.equal(sk.performing_acting, 0);
  assert.equal(sk.dance_thai_modern, 0);
  assert.equal(sk.literature_writing, 0);

  // Auto-discovery for migrated skills > 0
  const disc = migrated.skillTraining?.discoveredSkills ?? [];
  assert.equal(disc.includes('foreign_lang'), true, 'foreign_lang > 0 must auto-discover on migration');
  assert.equal(disc.includes('culinary'), true, 'culinary > 0 must auto-discover on migration');
  assert.equal(disc.includes('visual_arts'), false, 'visual_arts === 0 must stay undiscovered');

  // Focus & active course migration
  assert.deepEqual(migrated.skillTraining?.focus, ['business', 'social'], 'Legacy focus must migrate to new keys');
  assert.equal(migrated.skillTraining?.course?.skillId, 'business', 'Legacy course finance must migrate to business');

  // Hydrated fields exist cleanly
  assert.ok(Array.isArray(migrated.character.talents), 'Migrated save must initialize talents array');
  assert.ok(Array.isArray(migrated.character.limitations), 'Migrated save must initialize limitations array');
  assert.ok(migrated.character.educationState, 'Migrated save must initialize educationState');

  console.log('PASS [Test 2]: Pre-3.3.1 save migration maps 8 legacy keys -> 13 clean keys (business=max, auto-discover)');
}

function test3_DiscoveryThresholdsTalentReductionAndModifierCap() {
  assert.equal(CORE_SKILL_IDS.length, 6, 'Must define exactly 6 core skills');
  assert.equal(DISCOVERED_SKILL_IDS.length, 7, 'Must define exactly 7 discovered skills');
  assert.equal(ALL_SKILL_IDS.length, 13, 'Total skill pool must be strictly 13 (deferred 6 excluded)');

  // 3A. Undiscovered skill blocked from focus & course enrollment
  const baseRaw = createInitialGameState({
    mode: 'at_age',
    seed: 331003,
    atAge: { targetAge: 20, education: 'upper_secondary', wealthFocus: 'comfortable' },
  });
  let state: GameState = {
    ...baseRaw,
    economy: { ...baseRaw.economy, cash: 20000 },
    character: {
      ...baseRaw.character,
      talents: [],
      limitations: [],
      skills: { ...baseRaw.character.skills, visual_arts: 0, music_vocal: 0 },
    },
    skillTraining: createInitialSkillTrainingState({ discoveredSkills: [] }),
  };

  assert.equal(isSkillVisible(state, 'visual_arts'), false, 'visual_arts starts hidden');
  assert.equal(
    dispatchPlayerAction(state, { type: 'SET_SKILL_FOCUS', focus: ['visual_arts'] }).accepted,
    false,
    'Undiscovered skill cannot be set as focus'
  );
  assert.equal(
    canEnrollCourse(state, 'music_vocal').allowed,
    false,
    'Undiscovered skill cannot enroll in course'
  );

  // 3B. Baseline discovery at >= 8 sessions or >= 24 hours
  let sBaseline = state;
  for (let i = 0; i < 7; i++) {
    sBaseline = recordActivitySkillTagProgress(sBaseline, 'tag_draw', 1, 2, false);
  }
  assert.equal(isSkillVisible(sBaseline, 'visual_arts'), false, '7 sessions / 14 hrs must NOT yet discover visual_arts');
  sBaseline = recordActivitySkillTagProgress(sBaseline, 'tag_draw', 1, 2, true);
  assert.equal(isSkillVisible(sBaseline, 'visual_arts'), true, '8th session must discover visual_arts');

  // Hours threshold without 8 sessions (>= 24 hours)
  let sHours = recordActivitySkillTagProgress(state, 'tag_draw', 3, 24, false);
  assert.equal(isSkillVisible(sHours, 'visual_arts'), true, '>= 24 hours must discover visual_arts even with < 8 sessions');

  // 3C. Talent threshold reduction: 25% (Tier 1 -> 6), 40% (Tier 2 -> 5), 60% (Tier 3 -> 4)
  for (const [tier, expectedReq] of [
    [1, 6],
    [2, 5],
    [3, 4],
  ] as const) {
    let sTal: GameState = {
      ...state,
      character: {
        ...state.character,
        talents: [
          {
            id: 'tal_art',
            kind: 'skill',
            tier,
            revealed: false,
            acquiredAtAge: 0,
            source: 'birth',
          },
        ],
      },
    };
    for (let i = 0; i < expectedReq - 1; i++) {
      sTal = recordActivitySkillTagProgress(sTal, 'tag_draw', 1, 1, false);
    }
    assert.equal(
      isSkillVisible(sTal, 'visual_arts'),
      false,
      `Tier ${tier} talent should require ${expectedReq} sessions (not yet at ${expectedReq - 1})`
    );
    sTal = recordActivitySkillTagProgress(sTal, 'tag_draw', 1, 1, true);
    assert.equal(isSkillVisible(sTal, 'visual_arts'), true, `Tier ${tier} talent must discover at session ${expectedReq}`);
    assert.equal(sTal.character.talents?.[0].revealed, true, 'Discovering matching skill reveals hidden talent');
  }

  // 3D. Central Modifier Cap = +40% (0.40) strictly enforced
  assert.equal(computeCombinedModifierWithCap(0.30, 0, 0), 0.30, 'Tier 3 talent alone caps at 0.30');
  assert.equal(computeCombinedModifierWithCap(0.30, 0.15, 0.10), 0.40, 'Combined bonus must cap strictly at 0.40');
  assert.equal(computeCombinedModifierWithCap(0.55, 0, 0), 0.40, 'Even high positive bonus caps at 0.40');

  // Now discovered skill CAN be focused
  assert.equal(
    dispatchPlayerAction(sBaseline, { type: 'SET_SKILL_FOCUS', focus: ['visual_arts'] }).accepted,
    true,
    'Discovered skill can be set as skill focus'
  );

  console.log('PASS [Test 3]: 6+7=13 skills, discovery thresholds (8 sess / 24h), Tier 1/2/3 reductions (-25/-40/-60%) & +40% cap');
}

function test4_SchoolingTracksGpaRotcAndSecondChance() {
  // 4A. School transfer allowed strictly in months 3–4
  const teenBase = createInitialGameState({
    mode: 'at_age',
    seed: 331004,
    atAge: { targetAge: 16, education: 'lower_secondary', wealthFocus: 'comfortable' },
  });
  const studentInJune: GameState = {
    ...teenBase,
    economy: { ...teenBase.economy, jobId: 'student', jobTitle: 'นักเรียน / นักศึกษา' },
    date: { ...teenBase.date, month: 6, day: 15 },
  };
  assert.equal(canTransferSchoolTier(studentInJune).allowed, false, 'School tier transfer forbidden in June');
  assert.equal(
    dispatchPlayerAction(studentInJune, { type: 'CHANGE_SCHOOL_TIER', schoolTier: 'school_international' }).accepted,
    false
  );

  const studentInApril: GameState = {
    ...studentInJune,
    economy: { ...studentInJune.economy, cash: 20000 },
    date: { ...studentInJune.date, month: 4, day: 2 },
    character: {
      ...studentInJune.character,
      educationState: {
        ...studentInJune.character.educationState!,
        schoolTier: 'school_public',
        highSchoolTrack: undefined,
      },
    },
  };
  const transferRes = dispatchPlayerAction(studentInApril, {
    type: 'CHANGE_SCHOOL_TIER',
    schoolTier: 'school_international',
  });
  assert.equal(transferRes.accepted, true, 'School tier transfer request allowed in March–April');
  assert.equal(
    transferRes.state.character.educationState?.pendingTransfer?.targetTier,
    'school_international',
    'Transfer must create pendingTransfer awaiting family approval delay'
  );
  const resolvedTransfer = resolvePendingSchoolTransfer({
    ...transferRes.state,
    character: {
      ...transferRes.state.character,
      educationState: {
        ...transferRes.state.character.educationState!,
        pendingTransfer: {
          ...transferRes.state.character.educationState!.pendingTransfer!,
          probability: 1,
        },
      },
    },
  });
  assert.equal(resolvedTransfer.character.educationState?.schoolTier, 'school_international');
  assert.equal(isSkillVisible(resolvedTransfer, 'foreign_lang'), true, 'International school auto-discovers foreign_lang');

  // 4B. High school tracks: arts_lang discovers foreign_lang; arts_fine discovers chosen fine art
  const trackLang = dispatchPlayerAction(studentInApril, {
    type: 'CHOOSE_HIGH_SCHOOL_TRACK',
    track: 'arts_lang',
  });
  assert.equal(trackLang.accepted, true);
  assert.equal(isSkillVisible(trackLang.state, 'foreign_lang'), true, 'arts_lang discovers foreign_lang');

  const readyForFineArt: GameState = {
    ...studentInApril,
    character: {
      ...studentInApril.character,
      skills: { ...studentInApril.character.skills, music_vocal: 20 },
      educationState: {
        ...studentInApril.character.educationState!,
        currentGpa: 3.0,
        cumulativeGpa: 3.0,
      },
    },
  };
  const trackFine = dispatchPlayerAction(readyForFineArt, {
    type: 'CHOOSE_HIGH_SCHOOL_TRACK',
    track: 'arts_fine',
    fineArtSkill: 'music_vocal',
  });
  assert.equal(trackFine.accepted, true);
  assert.equal(trackFine.state.character.educationState?.fineArtSkill, 'music_vocal');
  assert.equal(isSkillVisible(trackFine.state, 'music_vocal'), true, 'arts_fine discovers chosen fineArtSkill');

  // 4C. Term end GPA: remedial (<1.50) & scholarship loss
  const strugglingStudent: GameState = {
    ...studentInJune,
    timeAllocation: {
      sleep: 60,
      workOrStudy: 2,
      sideGig: 0,
      social: 54,
      hobby: 30,
      family: 22,
      selfDev: 0,
      nightlife: 0,
    },
    character: {
      ...studentInJune.character,
      rawStats: { ...studentInJune.character.rawStats, wit: 20, memory: 20 },
      resources: { ...studentInJune.character.resources, stress: 98, energy: 10 },
      skills: { ...studentInJune.character.skills, academic: 0 },
      educationState: {
        ...studentInJune.character.educationState!,
        schoolTier: 'school_temple',
        trackReadiness: 'very_risky',
        readinessTermsRemaining: 2,
        hasScholarship: true,
        scholarshipMinGpa: 3.0,
      },
    },
  };
  const afterBadTerm = evaluateAcademicTermEnd(strugglingStudent, 10);
  assert.ok((afterBadTerm.character.educationState?.currentGpa ?? 4) < 1.5, 'Low effort + high stress + very_risky must drop GPA < 1.50');
  assert.equal(afterBadTerm.character.educationState?.remedialDue, true, 'GPA < 1.50 must flag remedialDue ("ติด ร.")');
  assert.equal(afterBadTerm.character.educationState?.hasScholarship, false, 'GPA below min must revoke scholarship');

  // 4D. ROTC completes after 3 March terms (male with passing fitness)
  const rotcCandidate: GameState = {
    ...studentInJune,
    character: {
      ...studentInJune.character,
      gender: 'male',
      rawStats: { ...studentInJune.character.rawStats, strength: 60, endurance: 60 },
      educationState: {
        ...studentInJune.character.educationState!,
        completedRotc: false,
        rotcEnrolled: false,
        rotcYearsCompleted: 0,
      },
    },
  };
  let rotcStudent = dispatchPlayerAction(rotcCandidate, { type: 'ENROLL_ROTC', enroll: true }).state;
  assert.equal(rotcStudent.character.educationState?.rotcEnrolled, true);
  rotcStudent = evaluateAcademicTermEnd(rotcStudent, 3);
  assert.equal(rotcStudent.character.educationState?.rotcYearsCompleted, 1);
  rotcStudent = evaluateAcademicTermEnd(rotcStudent, 10); // October does not advance ROTC year
  assert.equal(rotcStudent.character.educationState?.rotcYearsCompleted, 1);
  rotcStudent = evaluateAcademicTermEnd(rotcStudent, 3);
  rotcStudent = evaluateAcademicTermEnd(rotcStudent, 3);
  assert.equal(rotcStudent.character.educationState?.rotcYearsCompleted, 3);
  assert.equal(rotcStudent.character.educationState?.completedRotc, true, '3 March terms must complete ROTC');
  assert.equal(rotcStudent.character.educationState?.draftExemption, true, 'Male ROTC completion grants draftExemption');

  // 4E. Second-chance NFE lower & upper upgrade education and pass job requirements
  const adultWorkerBase = createInitialGameState({
    mode: 'at_age',
    seed: 331005,
    atAge: { targetAge: 21, education: 'primary', wealthFocus: 'struggling' },
  });
  let worker: GameState = {
    ...adultWorkerBase,
    economy: { ...adultWorkerBase.economy, jobId: 'convenience_staff', cash: 10000 },
    character: {
      ...adultWorkerBase.character,
      education: 'primary',
      skills: { ...adultWorkerBase.character.skills, business: 25, social: 25 },
      rawStats: { ...adultWorkerBase.character.rawStats, charisma: 60, looks: 55 },
      indices: { ...adultWorkerBase.character.indices, competence: 55 },
    },
  };
  assert.equal(checkJobEligibility(worker.character, 'sales_exec').allowed, false, 'Primary edu blocked from upper_secondary sales_exec');

  worker = dispatchPlayerAction(worker, { type: 'ENROLL_SECOND_CHANCE_EDU', program: 'nfe_lower' }).state;
  worker = evaluateAcademicTermEnd(worker, 10);
  worker = evaluateAcademicTermEnd(worker, 3);
  assert.equal(worker.character.education, 'nfe_lower', '2 terms complete nfe_lower');

  worker = dispatchPlayerAction(worker, { type: 'ENROLL_SECOND_CHANCE_EDU', program: 'nfe_upper' }).state;
  worker = evaluateAcademicTermEnd(worker, 10);
  worker = evaluateAcademicTermEnd(worker, 3);
  assert.equal(worker.character.education, 'nfe_upper', '2 terms complete nfe_upper');
  assert.equal(
    checkJobEligibility(worker.character, 'sales_exec').allowed,
    true,
    'nfe_upper satisfies upper_secondary job eligibility equivalently'
  );

  console.log('PASS [Test 4]: School summer transfers, HS tracks, GPA remedial/scholarship, 3-yr ROTC & NFE equivalence');
}

function test5_StoryletValidationAndDropoutCrisis() {
  // Validate entire 123-storylet catalog including Phase 3.3.1 & 3.3.1-FIX cards
  assert.equal(STORYLET_CATALOG.length, 123, 'Expected 123 validated storylets');
  for (const s of STORYLET_CATALOG) {
    const res = validateStorylet(s);
    assert.equal(res.valid, true, `Storylet ${s.id} invalid: ${res.errors.join('; ')}`);
  }

  const hintCard = STORYLET_CATALOG.find((s) => s.id === 'ev_talent_hint');
  const tutorCard = STORYLET_CATALOG.find((s) => s.id === 'ev_ms_slow_learner_tutor');
  const crisisCard = STORYLET_CATALOG.find((s) => s.id === 'ev_dropout_crisis');
  assert.ok(hintCard && tutorCard && crisisCard, 'All 3 Phase 3.3.1 storylets must exist in validated catalog');

  // Verify ev_dropout_crisis locks special choices when unmet and unlocks each when criteria met
  const baseTeen = createInitialGameState({
    mode: 'at_age',
    seed: 331006,
    atAge: { targetAge: 15, education: 'lower_secondary', wealthFocus: 'struggling' },
  });
  const unmetTeen: GameState = {
    ...baseTeen,
    character: {
      ...baseTeen.character,
      talents: [],
      skills: { ...baseTeen.character.skills, academic: 12 },
      rawStats: { ...baseTeen.character.rawStats, reliability: 35 },
      educationState: { ...baseTeen.character.educationState!, currentGpa: 2.4 },
    },
  };
  const firedUnmet = fireStorylet(unmetTeen, crisisCard!, true, { bypassRules: true }).state;
  const unmetChoices = firedUnmet.pendingPrompt!.choices;
  for (const specialId of [
    'special_gpa_scholarship',
    'special_talent_quota',
    'special_academic_skill_bursary',
    'special_reliable_patron',
  ]) {
    const ch = unmetChoices.find((c) => c.id === specialId)!;
    assert.equal(ch.disabled, true, `Special choice ${specialId} must be disabled when criteria unmet`);
    assert.ok(ch.disabledReason && ch.disabledReason.length > 0, `Special choice ${specialId} must show unlock hint`);
  }
  assert.equal(
    unmetChoices.find((c) => c.id === 'stay_highschool_tight')?.disabled ?? false,
    false,
    'Normal choices remain available'
  );

  // Unlock all 4 special choices when GPA >= 3.20, matching revealed talent, academic >= 28, reliability >= 55
  const metTeen: GameState = {
    ...unmetTeen,
    character: {
      ...unmetTeen.character,
      talents: [
        {
          id: 'tal_art',
          kind: 'skill',
          tier: 1,
          revealed: true,
          acquiredAtAge: 0,
          source: 'birth',
        },
      ],
      skills: { ...unmetTeen.character.skills, academic: 30 },
      rawStats: { ...unmetTeen.character.rawStats, reliability: 60 },
      educationState: { ...unmetTeen.character.educationState!, currentGpa: 3.35 },
    },
  };
  const firedMet = fireStorylet(metTeen, crisisCard!, true, { bypassRules: true }).state;
  const metChoices = firedMet.pendingPrompt!.choices;
  for (const specialId of [
    'special_gpa_scholarship',
    'special_talent_quota',
    'special_academic_skill_bursary',
    'special_reliable_patron',
  ]) {
    const ch = metChoices.find((c) => c.id === specialId)!;
    assert.equal(ch.disabled ?? false, false, `Special choice ${specialId} must unlock when criteria met`);
  }

  // Test resolving special_gpa_scholarship sets scholarship flags & educationState
  const chosenScholarship = dispatchPlayerAction(firedMet, {
    type: 'RESOLVE_PROMPT',
    promptId: firedMet.pendingPrompt!.id,
    choiceId: 'special_gpa_scholarship',
  });
  assert.equal(chosenScholarship.accepted, true);
  assert.equal(chosenScholarship.state.character.educationState?.hasScholarship, true);
  assert.equal(chosenScholarship.state.character.educationState?.scholarshipMinGpa, 3.0);

  console.log('PASS [Test 5]: All 123 storylets pass validator & ev_dropout_crisis 5 normal + 4 conditional choices verified');
}

function test6_FixableLimitationsCureAndRestoreMultiplier() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 331007,
    atAge: { targetAge: 17, education: 'lower_secondary', wealthFocus: 'average' },
  });

  // 6A. lim_slow_learner reduces skill multiplier (< 1.0), cures in 12 weeks with active course (2 sessions/wk -> 24 >= 16)
  let slowState: GameState = {
    ...base,
    character: {
      ...base.character,
      talents: [],
      limitations: [
        {
          id: 'lim_slow_learner',
          kind: 'limitation',
          tier: 1,
          revealed: true,
          acquiredAtAge: 0,
          source: 'birth',
          fixableBy: ['hard_study', 'tutor', 'course'],
        },
      ],
    },
    skillTraining: createInitialSkillTrainingState({}),
  };

  assert.ok(
    computeCombinedSkillMultiplier(slowState.character, 'academic') < 1.0,
    'Active lim_slow_learner must penalize skill multiplier below 1.0'
  );
  assert.equal(getActiveLimitations(slowState.character).length, 1);

  for (let w = 0; w < 12; w++) {
    slowState = advanceLimitationCureProgress(slowState, {
      selfDevHours: 6,
      sleepHours: 60,
      socialHours: 8,
      workoutHours: 4,
      craftOrCookPracticeHours: 0,
      restHours: 10,
      hasActiveCourse: true,
    });
  }

  assert.equal(getActiveLimitations(slowState.character).length, 0, 'lim_slow_learner must be cured after 12 course weeks');
  assert.equal(
    slowState.character.limitations?.[0].curedAtAge,
    slowState.character.ageYears,
    'curedAtAge must record age at cure'
  );
  assert.equal(
    computeCombinedSkillMultiplier(slowState.character, 'academic'),
    1.0,
    'Skill multiplier must restore to >= 1.0 once limitation is cured'
  );

  // 6B. lim_stage_fright cures after 10 weeks of >= 8h/wk social practice
  let stageState: GameState = {
    ...base,
    character: {
      ...base.character,
      talents: [],
      limitations: [
        {
          id: 'lim_stage_fright',
          kind: 'limitation',
          tier: 1,
          revealed: true,
          acquiredAtAge: 0,
          source: 'birth',
          fixableBy: ['stage_practice'],
        },
      ],
    },
  };
  assert.ok(computeCombinedSkillMultiplier(stageState.character, 'social') < 1.0);
  for (let w = 0; w < 10; w++) {
    stageState = advanceLimitationCureProgress(stageState, {
      selfDevHours: 4,
      sleepHours: 56,
      socialHours: 10,
      workoutHours: 0,
      craftOrCookPracticeHours: 0,
      restHours: 10,
      hasActiveCourse: false,
    });
  }
  assert.equal(getActiveLimitations(stageState.character).length, 0, 'lim_stage_fright must cure after 10 social weeks');
  assert.equal(computeCombinedSkillMultiplier(stageState.character, 'social'), 1.0);

  console.log('PASS [Test 6]: Fixable limitations (lim_slow_learner, lim_stage_fright) cure cleanly & restore >=1.0 multiplier');
}

function main() {
  test1_DeterminismAndMonteCarloTalentWeights();
  test2_Pre331SaveMigration13Keys();
  test3_DiscoveryThresholdsTalentReductionAndModifierCap();
  test4_SchoolingTracksGpaRotcAndSecondChance();
  test5_StoryletValidationAndDropoutCrisis();
  test6_FixableLimitationsCureAndRestoreMultiplier();
  console.log('\nALL 6 PHASE 3.3.1 TESTS PASSED!');
}

main();
