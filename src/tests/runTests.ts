import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  type AppearanceContext,
  type CharacterSpriteMeta,
  buildCharacterAppearance,
  describeAppearanceTraits,
  evaluateAppearanceImpact,
  getAllManifestEntries,
  getAppearanceStage,
  getAppearanceTagMeta,
  getContextAlignmentScore,
  getGalleryCandidates,
  getManifestEntry,
  isAppearanceValidForAge,
  isAppearanceValidForSelection,
  isDyedOrFancyHair,
  pickAppearance,
  pickAppearanceFromEntries,
} from '../engine/appearance';
import { validateLifePlausibility, generateLife } from '../engine/lifegen';
import { stepOneTick } from '../engine/pipeline';
import { hydrateLoadedGameState } from '../engine/save';
import { createInitialGameState, dispatchPlayerAction, replayGameState } from '../engine/state';
import {
  getSceneModeRemainingDays,
  isSceneOpen,
  pickSceneForState,
  resolveDaypart,
  resolveScene,
  SCENE_MANIFEST,
  sceneImagePath,
} from '../engine/scene';
import {
  FIRST_NAMES,
  LAST_NAMES,
  NICKNAMES_FEMALE,
  NICKNAMES_MALE,
  NICKNAMES_UNISEX,
} from '../data/thaiData';
import { TRAITS_BY_ID, TURNING_POINTS_BY_KIND } from '../data/traits';
import { isStoryletEligible, validateStorylet } from '../engine/storylet';
import { fireStorylet, resolveAutopilotPromptDecision } from '../engine/director';
import { explain } from '../engine/explain';
import { DIRECTOR_CONFIG } from '../data/storylets/directorConfig';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import {
  autopilotDecide,
  buildAutopilotSituation,
  createDefaultStandingOrders,
} from '../engine/autopilot';
import { checkJobEligibility } from '../engine/economy';
import { recordEvidence, recordEvidenceBatch } from '../engine/evidence';
import { canEnterNightlife, getAgeEmploymentRules, getLifeStageForAge } from '../engine/lifeStage';
import { skipToNextMilestone } from '../engine/pipeline';
import { explainStat } from '../engine/stats';
import {
  applyWeeklyTimeAllocation,
  getDefaultTimeAllocation,
  getDominantNightDaypart,
  validateTimeAllocation,
} from '../engine/timeAlloc';
import {
  createInitialPlannerState,
  deriveWeeklyAllocation,
} from '../engine/planner';
import {
  computeReputationViews,
  filterAvailableActions,
  getAutopilotTraitBiases,
  hazardModifiers,
} from '../engine/traitEffects';
import {
  applyTurningPoint,
  checkTraitFormation,
  computeInnerTensionFromTraits,
  explainTrait,
} from '../engine/traits';
import type {
  ActionRecord,
  EmergentTraitInstance,
  GameState,
  Gender,
  LifeGenRequest,
  PlannerGrid,
} from '../engine/types';

function testDeterminismX1vsX20() {
  const req: LifeGenRequest = { mode: 'random', seed: 987654 };
  let s1 = createInitialGameState(req);
  let s20 = createInitialGameState(req);

  // Run 100 days at x1 (1 tick per frame) with actions on specific days
  const actionDays: Record<number, { type: 'APPLY_LIFESTYLE_PRESET'; presetId: 'rest_recover' | 'study_focus' }> = {
    3: { type: 'APPLY_LIFESTYLE_PRESET', presetId: 'rest_recover' },
    45: { type: 'APPLY_LIFESTYLE_PRESET', presetId: 'study_focus' },
  };

  for (let day = 0; day < 100; day++) {
    const act = actionDays[s1.date.totalDays];
    if (act) s1 = dispatchPlayerAction(s1, act).state;
    if (s1.pendingPrompt) {
      s1 = dispatchPlayerAction(s1, {
        type: 'RESOLVE_PROMPT',
        promptId: s1.pendingPrompt.id,
        choiceId: s1.pendingPrompt.choices[0].id,
      }).state;
    }
    s1 = stepOneTick(s1);
  }

  // Run 100 days in x20 bursts (20 ticks per accumulator frame, pausing on prompt just like UI loop)
  let remaining = 100;
  while (remaining > 0) {
    const batch = Math.min(20, remaining);
    for (let i = 0; i < batch; i++) {
      const act = actionDays[s20.date.totalDays];
      if (act) s20 = dispatchPlayerAction(s20, act).state;
      if (s20.pendingPrompt) {
        s20 = dispatchPlayerAction(s20, {
          type: 'RESOLVE_PROMPT',
          promptId: s20.pendingPrompt.id,
          choiceId: s20.pendingPrompt.choices[0].id,
        }).state;
      }
      s20 = stepOneTick(s20);
      remaining--;
    }
  }

  assert.equal(s1.date.totalDays, s20.date.totalDays, 'Total days must match');
  assert.equal(s1.rngState, s20.rngState, 'RNG state must match identically');
  assert.equal(s1.economy.cash, s20.economy.cash, 'Cash must match identically');
  assert.equal(s1.economy.debt, s20.economy.debt, 'Debt must match identically');
  assert.deepEqual(s1.character.indices, s20.character.indices, 'Life indices must match identically');
  assert.deepEqual(s1.character.rawStats, s20.character.rawStats, 'Raw stats must match identically');
  assert.deepEqual(s1.character.skills, s20.character.skills, 'Skills must match identically');
}

function testEconomyCeilingsAndCosts() {
  const req: LifeGenRequest = {
    mode: 'at_age',
    seed: 12345,
    atAge: { targetAge: 25, education: 'bachelor', wealthFocus: 'average' },
  };
  let state = createInitialGameState(req);

  // Borrow beyond limit must fail
  const overBorrow = dispatchPlayerAction(state, {
    type: 'BORROW_MONEY',
    amount: state.economy.creditLimit + 50000,
  });
  assert.equal(overBorrow.accepted, false, 'Must reject borrowing above creditLimit');

  // Borrow within limit must increase both cash and debt equally
  if (state.economy.creditLimit >= 5000) {
    const prevCash = state.economy.cash;
    const prevDebt = state.economy.debt;
    const res = dispatchPlayerAction(state, { type: 'BORROW_MONEY', amount: 5000 });
    assert.equal(res.accepted, true);
    assert.equal(res.state.economy.cash, prevCash + 5000);
    assert.equal(res.state.economy.debt, prevDebt + 5000);
    state = res.state;
  }

  // Setting skill focus & enrolling in Tier 2 course must deduct week-1 fee without consuming instant energy
  const prevCash = state.economy.cash;
  const focusRes = dispatchPlayerAction(state, { type: 'SET_SKILL_FOCUS', focus: ['tech'] });
  assert.equal(focusRes.accepted, true);
  assert.deepEqual(focusRes.state.skillTraining?.focus, ['tech']);
  if (prevCash >= 500) {
    const enrollRes = dispatchPlayerAction(focusRes.state, { type: 'ENROLL_SKILL_COURSE', skillId: 'tech', weeks: 4 });
    assert.equal(enrollRes.accepted, true);
    assert.equal(enrollRes.state.economy.cash, prevCash - 500, 'Enrolling in course must deduct week-1 fee upfront');
  }
}

function testLifeGenPlausibility1000() {
  for (let i = 0; i < 1000; i++) {
    const modeIdx = i % 3;
    let req: LifeGenRequest;
    if (modeIdx === 0) {
      req = { mode: 'random', seed: 1000 + i };
    } else if (modeIdx === 1) {
      req = {
        mode: 'custom',
        seed: 2000 + i,
        custom: { region: i % 2 === 0 ? 'bangkok' : undefined },
      };
    } else {
      const ages = [14, 18, 25, 40];
      const age = ages[i % ages.length];
      req = {
        mode: 'at_age',
        seed: 3000 + i,
        atAge: {
          targetAge: age,
          // Intentionally try requesting doctorate at age 25 to verify engine clamps it!
          education: age === 25 ? 'doctorate' : undefined,
        },
      };
    }

    const life = generateLife(req);
    const report = validateLifePlausibility(life.person, life.economy);
    assert.equal(
      report.valid,
      true,
      `Plausibility failed at iteration ${i} (mode=${req.mode}): ${report.violations.join('; ')}`
    );
    if (life.person.ageYears === 25) {
      assert.notEqual(life.person.education, 'doctorate', 'Age 25 cannot be doctorate');
    }
  }
}

function testMinorContentLock() {
  const req: LifeGenRequest = {
    mode: 'at_age',
    seed: 555,
    atAge: { targetAge: 16 },
  };
  let state = createInitialGameState(req);
  assert.equal(state.character.isMinor, true, 'Age 16 must set isMinor = true');

  for (let i = 0; i < 20; i++) {
    state = stepOneTick(state);
    if (state.pendingPrompt) break;
  }

  assert.ok(state.pendingPrompt, 'Demo prompt should trigger by day 12');
  const hasAdultChoice = state.pendingPrompt!.choices.some((c) => c.requiresAdult);
  assert.equal(hasAdultChoice, false, 'Adult choices must be filtered out for minors');

  // Even direct action dispatch of adult choice ID must be rejected
  const forcedAdult = dispatchPlayerAction(state, {
    type: 'RESOLVE_PROMPT',
    promptId: 'demo_relative_borrow',
    choiceId: 'adult_underground_tip',
  });
  assert.equal(forcedAdult.accepted, false, 'Direct adult choice dispatch must fail for minor');
}

function testDeterministicReplay() {
  const req: LifeGenRequest = { mode: 'random', seed: 424242 };
  let live = createInitialGameState(req);
  const actions: ActionRecord[] = [];

  for (let i = 0; i < 60; i++) {
    if (live.date.totalDays === 5) {
      const action = { type: 'APPLY_LIFESTYLE_PRESET' as const, presetId: 'rest_recover' as const };
      actions.push({ atTotalDay: live.date.totalDays, action });
      live = dispatchPlayerAction(live, action).state;
    }
    if (live.pendingPrompt) {
      const action = {
        type: 'RESOLVE_PROMPT' as const,
        promptId: live.pendingPrompt.id,
        choiceId: live.pendingPrompt.choices[0].id,
      };
      actions.push({ atTotalDay: live.date.totalDays, action });
      live = dispatchPlayerAction(live, action).state;
    }
    live = stepOneTick(live);
  }

  const replayed = replayGameState(req, actions, live.date.totalDays);
  assert.equal(replayed.economy.cash, live.economy.cash, 'Replayed cash must match');
  assert.equal(replayed.rngState, live.rngState, 'Replayed RNG state must match');
  assert.deepEqual(replayed.character.indices, live.character.indices, 'Replayed indices must match');
}

function testBirthToAdult200Seeds() {
  let reached18Count = 0;

  for (let i = 0; i < 200; i++) {
    let state = createInitialGameState({
      mode: 'random',
      seed: 500000 + i * 97,
      randomStartPoint: 'birth',
    });

    assert.equal(state.character.ageYears, 0, 'Random birth mode must start at age 0');
    assert.equal(state.character.isMinor, true, 'Newborn must have isMinor = true');
    assert.equal(state.economy.cash, 0, 'Newborn must have cash = 0');
    assert.equal(state.economy.debt, 0, 'Newborn must have debt = 0');

    // Simulate daily ticks until reaching age 18 (max 19 * 366 days)
    let ticks = 0;
    let lastCheckedAge = -1;
    while (state.character.isAlive && state.character.ageYears < 18 && ticks < 7000) {
      if (state.pendingPrompt) {
        state = dispatchPlayerAction(state, {
          type: 'RESOLVE_PROMPT',
          promptId: state.pendingPrompt.id,
          choiceId: state.pendingPrompt.choices[0].id,
        }).state;
      }
      if (state.pendingAutopilotSituation) {
        const sit = state.pendingAutopilotSituation;
        const safeOpt =
          sit.options.find((o) => !o.tags.includes('spend') && !(state.character.isMinor && o.requiresAdult)) ??
          sit.options[0];
        state = dispatchPlayerAction(state, {
          type: 'RESOLVE_AUTOPILOT',
          situationId: sit.id,
          optionId: safeOpt.id,
        }).state;
      }

      state = stepOneTick(state, { allowPrompts: false, recordLogs: false });
      ticks++;

      assert.ok(state.economy.cash >= 0, `Seed ${i}: cash must never be negative (${state.economy.cash})`);
      assert.equal(state.economy.debt, 0, `Seed ${i} age ${state.character.ageYears}: child/minor at parents_home must have 0 debt`);

      if (state.character.ageYears < 18) {
        assert.equal(state.character.isMinor, true, `Seed ${i}: isMinor must remain true below 18`);
      }

      if (state.character.ageYears !== lastCheckedAge) {
        lastCheckedAge = state.character.ageYears;
        const report = validateLifePlausibility(state.character, state.economy);
        assert.equal(
          report.valid,
          true,
          `Seed ${i} age ${state.character.ageYears} plausibility failed: ${report.violations.join('; ')}`
        );
      }
    }

    if (state.character.isAlive) {
      reached18Count++;
      assert.equal(state.character.ageYears, 18, `Seed ${i}: should reach age 18`);
      assert.equal(state.character.isMinor, false, `Seed ${i}: isMinor must become false at age 18`);
      assert.ok(state.economy.cash >= 0, `Seed ${i}: cash >= 0 at 18`);
      assert.equal(state.economy.debt, 0, `Seed ${i}: debt === 0 at 18`);
    }
  }

  assert.ok(reached18Count >= 195, `Most children (at least 195/200) must safely reach age 18 (got ${reached18Count})`);
}

function buildSyntheticManifestFixture(): CharacterSpriteMeta[] {
  const list: CharacterSpriteMeta[] = [];
  const naturalHairs = ['black', 'dark brown', 'brown', 'light brown', 'blonde'];
  const eyeShapes: Array<'narrow' | 'balanced' | 'round'> = ['narrow', 'balanced', 'round'];

  for (let i = 1; i <= 20; i++) {
    const hair = naturalHairs[i % naturalHairs.length];
    const isBlonde = hair === 'blonde';
    const isSwaddled = i <= 10;
    list.push({
      id: `baby_${String(i).padStart(3, '0')}`,
      group: 'baby',
      w: 96,
      h: 175,
      skinTone: isBlonde ? 1 : ((i - 1) % 5) + 1,
      skinHex: '#c08e6e',
      hairHex: '#423126',
      hairColor: hair,
      lookAge: 'baby',
      ageRange: isSwaddled ? [0, 1] : [2, 3],
      gender: isSwaddled ? 'n' : i % 3 === 0 ? 'f' : 'n',
      eyeShape: eyeShapes[i % eyeShapes.length],
      eyeColor: isBlonde ? 'blue' : 'dark',
      tags: [
        isSwaddled ? 'swaddled' : 'toddler',
        'casual',
        ...(isBlonde ? ['luk_kreung', 'natural_blonde'] : []),
      ],
      flags: [],
      file: `characters/baby/baby_${String(i).padStart(3, '0')}.png`,
      anchor: { x: 48, y: 175 },
    });
  }

  for (let i = 1; i <= 24; i++) {
    const hair = naturalHairs[i % naturalHairs.length];
    const isBlonde = hair === 'blonde';
    list.push({
      id: `kid_${String(i).padStart(3, '0')}`,
      group: 'kid',
      w: 175,
      h: 335,
      skinTone: isBlonde ? 1 : ((i - 1) % 5) + 1,
      skinHex: '#c08e6e',
      hairHex: '#423126',
      hairColor: hair,
      lookAge: 'child',
      gender: i % 2 === 0 ? 'f' : 'm',
      eyeShape: eyeShapes[i % eyeShapes.length],
      eyeColor: isBlonde ? 'blue' : 'dark',
      tags: [
        ...(i <= 4 ? ['school_uniform'] : ['casual']),
        ...(isBlonde ? ['luk_kreung', 'natural_blonde'] : []),
      ],
      flags: [],
      file: `characters/kid/kid_${String(i).padStart(3, '0')}.png`,
      anchor: { x: 87, y: 335 },
    });
  }

  // Dyed & non-elder gray synthetic entries: must never be chosen naturally
  list.push({
    id: 'kid_025',
    group: 'kid',
    w: 175,
    h: 335,
    skinTone: 1,
    skinHex: '#f4d3be',
    hairHex: '#ef9bb8',
    hairColor: 'pink',
    lookAge: 'child',
    gender: 'f',
    eyeShape: 'round',
    eyeColor: 'purple',
    tags: ['dyed_hair'],
    flags: [],
    file: 'characters/kid/kid_025.png',
    anchor: { x: 87, y: 335 },
  });
  list.push({
    id: 'kid_026',
    group: 'kid',
    w: 175,
    h: 335,
    skinTone: 2,
    skinHex: '#e4b89c',
    hairHex: '#b8b8c2',
    hairColor: 'gray',
    lookAge: 'child',
    gender: 'm',
    eyeShape: 'balanced',
    eyeColor: 'dark',
    tags: ['casual'],
    flags: [],
    file: 'characters/kid/kid_026.png',
    anchor: { x: 87, y: 335 },
  });

  for (let i = 1; i <= 60; i++) {
    const g = i % 2 === 0 ? 'female' : 'male';
    const look = i <= 16 ? 'teen' : i <= 44 ? 'adult' : 'mature';
    const hair = naturalHairs[i % naturalHairs.length];
    const isBlonde = hair === 'blonde';
    list.push({
      id: `${g}_${String(i).padStart(3, '0')}`,
      group: g,
      w: 180,
      h: 344,
      skinTone: isBlonde ? 1 : ((Math.floor(i / 5) + i) % 5) + 1,
      skinHex: '#c08e6e',
      hairHex: '#423126',
      hairColor: hair,
      lookAge: look,
      gender: g === 'female' ? 'f' : 'm',
      eyeShape: eyeShapes[(Math.floor(i / 2) + Math.floor(i / 5) + i) % eyeShapes.length],
      eyeColor: isBlonde ? 'blue' : 'dark',
      tags: [
        ...(i <= 6 ? ['student_uniform'] : ['casual']),
        ...(isBlonde ? ['luk_kreung', 'natural_blonde'] : []),
      ],
      flags: [],
      file: `characters/${g}/${g}_${String(i).padStart(3, '0')}.png`,
      anchor: { x: 90, y: 344 },
    });
  }

  list.push({
    id: 'male_061',
    group: 'male',
    w: 180,
    h: 344,
    skinTone: 1,
    skinHex: '#f4d3be',
    hairHex: '#7da5d9',
    hairColor: 'blue',
    lookAge: 'adult',
    gender: 'm',
    eyeShape: 'balanced',
    eyeColor: 'blue',
    tags: ['dyed_hair'],
    flags: [],
    file: 'characters/male/male_061.png',
    anchor: { x: 90, y: 344 },
  });
  list.push({
    id: 'female_062',
    group: 'female',
    w: 180,
    h: 344,
    skinTone: 2,
    skinHex: '#e4b89c',
    hairHex: '#c0c2cc',
    hairColor: 'gray',
    lookAge: 'adult',
    gender: 'f',
    eyeShape: 'balanced',
    eyeColor: 'dark',
    tags: ['dyed_hair'],
    flags: [],
    file: 'characters/female/female_062.png',
    anchor: { x: 90, y: 344 },
  });

  for (let i = 1; i <= 20; i++) {
    list.push({
      id: `elder_${String(i).padStart(3, '0')}`,
      group: 'elder',
      w: 180,
      h: 340,
      skinTone: ((i - 1) % 5) + 1,
      skinHex: '#c08e6e',
      hairHex: '#d4d0e5',
      hairColor: i % 2 === 0 ? 'gray' : 'white',
      lookAge: 'senior',
      gender: i % 2 === 0 ? 'f' : 'm',
      eyeShape: eyeShapes[i % eyeShapes.length],
      eyeColor: 'dark',
      tags: ['casual'],
      flags: [],
      file: `characters/elder/elder_${String(i).padStart(3, '0')}.png`,
      anchor: { x: 90, y: 340 },
    });
  }

  return list;
}

const DARK_HAIR_FAMILY = new Set(['black', 'dark brown']);

function isHairTransitionConsistent(prevHair: string, nextHair: string, nextAge: number): boolean {
  if (nextAge >= 60) {
    // 60+ naturally grays/whitens or keeps natural dark
    return (
      nextHair === 'gray' ||
      nextHair === 'white' ||
      nextHair === prevHair ||
      (DARK_HAIR_FAMILY.has(prevHair) && DARK_HAIR_FAMILY.has(nextHair))
    );
  }
  if (prevHair === nextHair) return true;
  if (DARK_HAIR_FAMILY.has(prevHair) && DARK_HAIR_FAMILY.has(nextHair)) return true;
  if (prevHair === 'brown') {
    return nextHair === 'dark brown' || nextHair === 'light brown';
  }
  if (prevHair === 'light brown') {
    return nextHair === 'blonde' || nextHair === 'brown' || nextHair === 'dark brown';
  }
  if (prevHair === 'blonde') {
    return nextHair === 'light brown';
  }
  if (prevHair === 'red/orange') {
    return nextHair === 'light brown' || nextHair === 'brown';
  }
  return false;
}

function verifyAppearanceRulesWithPool(entries: readonly CharacterSpriteMeta[], useRealPicker: boolean) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const pick = (seed: number, gender: Gender, age: number, prev?: string) =>
    useRealPicker
      ? pickAppearance(seed, gender, age, prev)
      : pickAppearanceFromEntries(entries, seed, gender, age, prev);

  // 1. Determinism: same seed/gender/age -> identical charId
  const genders: Gender[] = ['male', 'female', 'nonbinary'];
  for (let i = 0; i < 30; i++) {
    const seed = 7000 + i * 13;
    const g = genders[i % genders.length];
    const age = [1, 8, 17, 28, 50, 68][i % 6];
    const a = pick(seed, g, age);
    const b = pick(seed, g, age);
    assert.ok(a.length > 0, 'pickAppearance must return non-empty charId');
    assert.equal(a, b, 'pickAppearance must be deterministic for same seed/gender/age');
  }

  // 2. 100 seeds age 20+ must NEVER get student_uniform / school_uniform
  for (let i = 0; i < 100; i++) {
    const seed = 20000 + i * 31;
    const g = genders[i % genders.length];
    const age = 20 + (i % 50);
    const id = pick(seed, g, age);
    const meta = byId.get(id);
    assert.ok(meta, `Manifest entry must exist for ${id}`);
    assert.equal(
      meta.tags.includes('student_uniform') || meta.tags.includes('school_uniform'),
      false,
      `Age ${age} must never receive student_uniform/school_uniform (${id})`
    );
  }

  // 3. Age 0-15 only baby/kid, 60+ only elder, <60 never gets dyed hair or non-elder gray/white (at <45)
  for (let i = 0; i < 120; i++) {
    const seed = 30000 + i * 17;
    const g = genders[i % genders.length];
    const youngAge = i % 16; // 0..15
    const youngId = pick(seed, g, youngAge);
    const youngMeta = byId.get(youngId);
    assert.ok(youngMeta, `Young entry must exist for ${youngId}`);
    if (youngAge <= 3) {
      assert.equal(youngMeta.group, 'baby', `Age ${youngAge} must pick baby group`);
    } else {
      assert.equal(youngMeta.group, 'kid', `Age ${youngAge} must pick kid group`);
    }
    assert.equal(isDyedOrFancyHair(youngMeta), false, `Young age ${youngAge} must never pick dyed hair (${youngId})`);
    assert.equal(
      youngMeta.hairColor === 'gray' || youngMeta.hairColor === 'white',
      false,
      `Young age ${youngAge} must never pick gray/white hair (${youngId})`
    );

    const adultAge = 16 + (i % 28); // 16..43
    const adultId = pick(seed, g, adultAge);
    const adultMeta = byId.get(adultId);
    assert.ok(adultMeta, `Adult entry must exist for ${adultId}`);
    assert.equal(isDyedOrFancyHair(adultMeta), false, `Age ${adultAge} must never naturally pick dyed hair (${adultId})`);
    assert.equal(
      adultMeta.hairColor === 'gray' || adultMeta.hairColor === 'white',
      false,
      `Age ${adultAge} (<45) must never naturally pick gray/white hair (${adultId})`
    );

    const oldAge = 60 + (i % 30);
    const oldId = pick(seed, g, oldAge);
    const oldMeta = byId.get(oldId);
    assert.ok(oldMeta, `Elder entry must exist for ${oldId}`);
    assert.equal(oldMeta.group, 'elder', `Age ${oldAge} must pick elder group`);
  }

  // 4. Full life-chain 0 -> 4 -> 16 -> 60 across 200 seeds: hair continuity, no dyed/gray under 60, skinTone <= 1
  for (let i = 0; i < 200; i++) {
    const seed = 90000 + i * 73;
    const g = genders[i % genders.length];
    const babyId = pick(seed, g, 0);
    const kidId = pick(seed, g, 4, babyId);
    const adultId = pick(seed, g, 16, kidId);
    const elderId = pick(seed, g, 60, adultId);

    const babyMeta = byId.get(babyId)!;
    const kidMeta = byId.get(kidId)!;
    const adultMeta = byId.get(adultId)!;
    const elderMeta = byId.get(elderId)!;

    assert.equal(babyMeta.group, 'baby');
    assert.equal(kidMeta.group, 'kid');
    assert.ok(adultMeta.group === 'male' || adultMeta.group === 'female');
    assert.equal(elderMeta.group, 'elder');

    // No dyed or gray/white hair during natural growth < 60
    for (const m of [babyMeta, kidMeta, adultMeta]) {
      assert.equal(isDyedOrFancyHair(m), false, `Seed ${i}: dyed hair leaked into natural aging (${m.id})`);
      assert.equal(
        m.hairColor === 'gray' || m.hairColor === 'white',
        false,
        `Seed ${i}: gray/white hair leaked into age < 60 (${m.id})`
      );
    }

    if (!babyMeta.tags.includes('bald')) {
      assert.ok(
        isHairTransitionConsistent(babyMeta.hairColor, kidMeta.hairColor, 4),
        `Seed ${i} (${g}) 0->4 hair mismatch: ${babyMeta.id}(${babyMeta.hairColor}) -> ${kidMeta.id}(${kidMeta.hairColor})`
      );
    }
    if (!kidMeta.tags.includes('bald')) {
      assert.ok(
        isHairTransitionConsistent(kidMeta.hairColor, adultMeta.hairColor, 16),
        `Seed ${i} (${g}) 4->16 hair mismatch: ${kidMeta.id}(${kidMeta.hairColor}) -> ${adultMeta.id}(${adultMeta.hairColor})`
      );
    }
    if (!adultMeta.tags.includes('bald')) {
      assert.ok(
        isHairTransitionConsistent(adultMeta.hairColor, elderMeta.hairColor, 60),
        `Seed ${i} (${g}) 16->60 hair mismatch: ${adultMeta.id}(${adultMeta.hairColor}) -> ${elderMeta.id}(${elderMeta.hairColor})`
      );
    }

    // Dark-eyed character must not suddenly jump to bright blue/purple/green eyes on 0->4 or 4->16
    if (babyMeta.eyeColor === 'dark') {
      assert.notEqual(kidMeta.eyeColor, 'blue', `Seed ${i}: dark eyes jumped to blue at kid stage`);
      assert.notEqual(kidMeta.eyeColor, 'purple', `Seed ${i}: dark eyes jumped to purple at kid stage`);
    }
    if (kidMeta.eyeColor === 'dark') {
      assert.notEqual(adultMeta.eyeColor, 'blue', `Seed ${i}: dark eyes jumped to blue at adult stage`);
      assert.notEqual(adultMeta.eyeColor, 'purple', `Seed ${i}: dark eyes jumped to purple at adult stage`);
    }
  }

  // 5. Crossing 3->4, 15->16, 59->60 across 200 seeds: skinTone diff <= 1 in >= 95%
  const transitions: Array<[number, number]> = [
    [3, 4],
    [15, 16],
    [59, 60],
  ];
  for (const [beforeAge, afterAge] of transitions) {
    let withinOneCount = 0;
    let narrowToRoundCount = 0;
    for (let i = 0; i < 200; i++) {
      const seed = 90000 + i * 73;
      const g = genders[i % genders.length];
      const prevId = pick(seed, g, beforeAge);
      const nextId = pick(seed, g, afterAge, prevId);
      const prevMeta = byId.get(prevId)!;
      const nextMeta = byId.get(nextId)!;
      const expectedStage = getAppearanceStage(afterAge);

      if (expectedStage === 'kid') assert.equal(nextMeta.group, 'kid');
      if (expectedStage === 'adult') assert.ok(nextMeta.group === 'male' || nextMeta.group === 'female');
      if (expectedStage === 'elder') assert.equal(nextMeta.group, 'elder');

      if (Math.abs(nextMeta.skinTone - prevMeta.skinTone) <= 1) {
        withinOneCount++;
      }
      if (
        (prevMeta.eyeShape === 'narrow' && nextMeta.eyeShape === 'round') ||
        (prevMeta.eyeShape === 'round' && nextMeta.eyeShape === 'narrow')
      ) {
        narrowToRoundCount++;
      }
    }
    assert.ok(
      withinOneCount >= 190,
      `Transition ${beforeAge}->${afterAge} skinTone diff <= 1 must hold for >= 95% (got ${withinOneCount}/200)`
    );
    assert.ok(
      narrowToRoundCount <= 2,
      `Transition ${beforeAge}->${afterAge} narrow<->round eye jump too frequent (${narrowToRoundCount}/200)`
    );
  }
}

function testAppearanceSystem() {
  const realManifest = getAllManifestEntries();

  // Always verify core appearance algorithm with deterministic fixture
  verifyAppearanceRulesWithPool(buildSyntheticManifestFixture(), false);

  // Verify old save hydration works gracefully without throwing
  const oldState = createInitialGameState({ mode: 'random', seed: 112233 });
  const stripped = {
    ...oldState,
    character: { ...oldState.character, appearance: undefined },
  };
  const hydrated = hydrateLoadedGameState(stripped);
  assert.equal(hydrated.character.ageYears, oldState.character.ageYears);

  if (realManifest.length > 0) {
    // Full verification on real 332-character manifest + public/assets PNG files
    verifyAppearanceRulesWithPool(realManifest, true);

    // 6. Verify every entry in real 332 manifest has valid ageRange and bustFocus
    for (const entry of realManifest) {
      assert.ok(entry.ageRange, `Entry ${entry.id} must define ageRange`);
      const [minAge, maxAge] = entry.ageRange;
      assert.ok(minAge <= maxAge, `Entry ${entry.id} invalid ageRange [${minAge}, ${maxAge}]`);

      assert.ok(entry.bustFocus, `Entry ${entry.id} must define bustFocus`);
      assert.ok(
        entry.bustFocus.x >= 0.25 && entry.bustFocus.x <= 0.75,
        `Entry ${entry.id} bustFocus.x out of bounds: ${entry.bustFocus.x}`
      );
      assert.ok(
        entry.bustFocus.y >= 0.15 && entry.bustFocus.y <= 0.45,
        `Entry ${entry.id} bustFocus.y out of bounds: ${entry.bustFocus.y}`
      );
      assert.ok(
        (entry.bustFocus.zoom ?? 0) >= 1.05,
        `Entry ${entry.id} bustFocus.zoom must be >= 1.05 (got ${entry.bustFocus.zoom})`
      );
    }

    // 7. Strict ageRange enforcement across adult sub-ages (200 seeds each)
    const testAges = [16, 17, 18, 19, 25, 38, 52];
    const checkGenders: Gender[] = ['male', 'female'];
    for (const age of testAges) {
      for (let i = 0; i < 200; i++) {
        const seed = 150000 + age * 1000 + i * 19;
        const g = checkGenders[i % checkGenders.length];
        const pickedId = pickAppearance(seed, g, age);
        const picked = getManifestEntry(pickedId);
        assert.ok(picked, `Missing entry ${pickedId}`);
        assert.ok(picked.ageRange, `Missing ageRange on ${pickedId}`);
        assert.ok(
          age >= picked.ageRange[0] && age <= picked.ageRange[1],
          `Age ${age} picked ${pickedId} with out-of-bounds ageRange [${picked.ageRange[0]}, ${picked.ageRange[1]}]`
        );
        if (age === 16) {
          assert.notEqual(pickedId, 'female_068', 'Age 16 must never pick female_068 (middle-aged auntie)');
          assert.ok(
            picked.ageRange[0] < 30,
            `Age 16 picked mature-looking sprite ${pickedId} (minAge=${picked.ageRange[0]})`
          );
        }
      }
    }

    // 8. Intra-adult aging chain (16 -> 20 -> 40 -> 60): outgrowing ageRange refreshes naturally & keeps hair/skin
    for (let i = 0; i < 100; i++) {
      const seed = 310000 + i * 41;
      const g = checkGenders[i % checkGenders.length];
      const id16 = pickAppearance(seed, g, 16);
      const id20 = pickAppearance(seed, g, 20, id16);
      const id40 = pickAppearance(seed, g, 40, id20);
      const id60 = pickAppearance(seed, g, 60, id40);

      const m16 = getManifestEntry(id16)!;
      const m20 = getManifestEntry(id20)!;
      const m40 = getManifestEntry(id40)!;
      const m60 = getManifestEntry(id60)!;

      assert.equal(isAppearanceValidForAge(id20, 20, realManifest), true);
      assert.equal(isAppearanceValidForAge(id40, 40, realManifest), true);
      assert.equal(isAppearanceValidForAge(id60, 60, realManifest), true);

      // School uniforms at 16 must change by age 20
      if (m16.tags.includes('student_uniform') || m16.tags.includes('school_uniform')) {
        assert.notEqual(id20, id16, `Seed ${i}: uniform ${id16} must refresh by age 20`);
      }
      assert.ok(
        isHairTransitionConsistent(m16.hairColor, m20.hairColor, 20),
        `Seed ${i}: 16->20 hair mismatch ${m16.id}(${m16.hairColor}) -> ${m20.id}(${m20.hairColor})`
      );
      assert.ok(
        isHairTransitionConsistent(m20.hairColor, m40.hairColor, 40),
        `Seed ${i}: 20->40 hair mismatch ${m20.id}(${m20.hairColor}) -> ${m40.id}(${m40.hairColor})`
      );
      assert.ok(
        isHairTransitionConsistent(m40.hairColor, m60.hairColor, 60),
        `Seed ${i}: 40->60 hair mismatch ${m40.id}(${m40.hairColor}) -> ${m60.id}(${m60.hairColor})`
      );
      assert.ok(
        Math.abs(m20.skinTone - m16.skinTone) <= 1 && Math.abs(m40.skinTone - m20.skinTone) <= 1,
        `Seed ${i}: adult skinTone drifted too far across 16->20->40`
      );
    }

    // 9. Context-aware scoring & selection (wealth, isOrphan, region, gamer/tech)
    const poorContext: AppearanceContext = {
      familyWealth: 'destitute',
      isOrphan: true,
      region: 'northeast',
      temperament: 'calm',
    };
    const richContext: AppearanceContext = {
      familyWealth: 'wealthy',
      isOrphan: false,
      region: 'bangkok',
      temperament: 'optimistic',
    };
    const techContext: AppearanceContext = {
      familyWealth: 'middle',
      region: 'bangkok',
      temperament: 'anxious',
      skills: { tech: 30 },
    };

    let poorLuxuryCount = 0;
    let richLuxuryCount = 0;
    let isaanRegionalCount = 0;
    let techGamerCount = 0;

    for (let i = 0; i < 60; i++) {
      const seed = 420000 + i * 29;
      const g = checkGenders[i % checkGenders.length];

      const poorEntry = getManifestEntry(pickAppearance(seed, g, 24, undefined, poorContext))!;
      const richEntry = getManifestEntry(pickAppearance(seed, g, 24, undefined, richContext))!;
      const isaanEntry = getManifestEntry(pickAppearance(seed, g, 28, undefined, poorContext))!;
      const techEntry = getManifestEntry(pickAppearance(seed, g, 22, undefined, techContext))!;

      if (poorEntry.tags.includes('luxury') || poorEntry.tags.includes('khun_nu')) {
        poorLuxuryCount++;
      }
      if (richEntry.tags.includes('luxury') || richEntry.tags.includes('khun_nu') || richEntry.tags.includes('sia') || richEntry.tags.includes('office')) {
        richLuxuryCount++;
      }
      if (isaanEntry.tags.includes('isaan_vibe') || isaanEntry.tags.includes('humble')) {
        isaanRegionalCount++;
      }
      if (techEntry.tags.includes('gamer') || techEntry.tags.includes('nerdy')) {
        techGamerCount++;
      }
    }

    assert.equal(poorLuxuryCount, 0, `Orphan/destitute context must avoid luxury sprites (got ${poorLuxuryCount}/60)`);
    assert.ok(richLuxuryCount >= 40, `Wealthy context should strongly favor luxury/office sprites (got ${richLuxuryCount}/60)`);
    assert.ok(isaanRegionalCount >= 30, `Northeast destitute context should favor isaan/humble sprites (got ${isaanRegionalCount}/60)`);
    assert.ok(techGamerCount >= 20, `High-tech anxious context should favor gamer/nerdy sprites (got ${techGamerCount}/60)`);

    // Spot check getContextAlignmentScore directionality
    const luxurySample = realManifest.find((e) => e.tags.includes('luxury') && e.tags.includes('cheerful')) ?? realManifest.find((e) => e.tags.includes('luxury'))!;
    const isaanSample = realManifest.find((e) => e.tags.includes('isaan_vibe'))!;
    assert.ok(
      getContextAlignmentScore(luxurySample, 24, richContext) >
        getContextAlignmentScore(luxurySample, 24, poorContext),
      'Luxury sprite must score higher for wealthy than destitute/orphan'
    );
    assert.ok(
      getContextAlignmentScore(isaanSample, 28, poorContext) >
        getContextAlignmentScore(isaanSample, 28, richContext),
      'Isaan sprite must score higher for northeast context'
    );

    // Verify dyed_hair sprite is blocked naturally yet unlocked when allowDyed is requested (future dye feature)
    assert.equal(
      isAppearanceValidForAge('female_077', 22, realManifest),
      false,
      'Dyed pink sprite must not be valid for natural selection'
    );
    assert.equal(
      isAppearanceValidForAge('female_077', 22, realManifest, { allowDyed: true }),
      true,
      'Dyed pink sprite must be valid when allowDyed=true for future style choices'
    );

    // 10. Realistic baby pool split: age 0-1 strictly swaddled [0, 1]; age 2-3 strictly non-swaddled toddler [2, 3]
    const testGenders: Gender[] = ['male', 'female', 'nonbinary'];
    for (let i = 0; i < 200; i++) {
      const seed = 550000 + i * 37;
      const g = testGenders[i % testGenders.length];
      for (const age of [0, 1]) {
        const id = pickAppearance(seed, g, age);
        const entry = getManifestEntry(id)!;
        assert.equal(entry.group, 'baby', `Age ${age} must select baby group (${id})`);
        assert.equal(entry.tags.includes('swaddled'), true, `Age ${age} must select swaddled baby (${id})`);
        assert.deepEqual(entry.ageRange, [0, 1], `Age ${age} entry must have ageRange [0, 1] (${id})`);
      }
      for (const age of [2, 3]) {
        const id = pickAppearance(seed, g, age);
        const entry = getManifestEntry(id)!;
        assert.equal(entry.group, 'baby', `Age ${age} must select baby group (${id})`);
        assert.equal(entry.tags.includes('swaddled'), false, `Age ${age} must NOT select swaddled baby (${id})`);
        assert.deepEqual(entry.ageRange, [2, 3], `Age ${age} entry must have ageRange [2, 3] (${id})`);
      }

      // Transition 1 -> 2 must leave swaddled pool while maintaining skinTone diff <= 1 & consistent hair
      const id1 = pickAppearance(seed, g, 1);
      const id2 = pickAppearance(seed, g, 2, id1);
      const m1 = getManifestEntry(id1)!;
      const m2 = getManifestEntry(id2)!;
      assert.equal(isAppearanceValidForAge(id1, 2, realManifest), false, `Swaddled ${id1} must not remain valid at age 2`);
      assert.equal(m2.tags.includes('swaddled'), false, `Transition 1->2 must pick non-swaddled toddler (${id2})`);
      assert.ok(Math.abs(m2.skinTone - m1.skinTone) <= 1, `Transition 1->2 skinTone drifted too far (${m1.id} -> ${m2.id})`);
      if (!m1.tags.includes('bald')) {
        assert.ok(isHairTransitionConsistent(m1.hairColor, m2.hairColor, 2), `Transition 1->2 hair mismatch (${m1.hairColor} -> ${m2.hairColor})`);
      }
    }

    // 11. Character Gallery & Thai Trait Extraction (describeAppearanceTraits / getGalleryCandidates)
    for (const entry of realManifest) {
      const traits = describeAppearanceTraits(entry.id);
      assert.ok(traits, `describeAppearanceTraits must return traits for ${entry.id}`);
      assert.ok(traits.skinLabel.length > 0, `skinLabel missing on ${entry.id}`);
      assert.ok(traits.eyeColorLabel.length > 0, `eyeColorLabel missing on ${entry.id}`);
      assert.ok(traits.hairColorLabel.length > 0, `hairColorLabel missing on ${entry.id}`);
    }
    const newbornMaleGallery = getGalleryCandidates('male', 0, 'northeast');
    const newbornFemaleGallery = getGalleryCandidates('female', 1, 'northeast');
    assert.equal(newbornMaleGallery.length, 19, `Age 0-1 gallery should show all 19 swaddled babies regardless of gender`);
    assert.equal(newbornFemaleGallery.length, 19, `Age 0-1 gallery should show all 19 swaddled babies regardless of gender`);
    assert.ok(
      newbornMaleGallery.every((c) => c.entry.tags.includes('swaddled')),
      'Age 0-1 gallery must contain only swaddled babies'
    );
    const toddlerFemaleGallery = getGalleryCandidates('female', 2, 'bangkok');
    assert.ok(toddlerFemaleGallery.length >= 30, 'Age 2-3 female gallery should include female + unisex toddlers');
    assert.ok(
      toddlerFemaleGallery.every((c) => !c.entry.tags.includes('swaddled')),
      'Age 2-3 gallery must never include swaddled babies'
    );
    const isaanAdultGallery = getGalleryCandidates('female', 25, 'northeast');
    assert.ok(isaanAdultGallery.some((c) => c.matchesRegion), 'Northeast gallery should flag local matches');
    const firstNonLocalIdx = isaanAdultGallery.findIndex((c) => !c.matchesRegion);
    const lastLocalIdx = isaanAdultGallery.reduce((acc, c, idx) => (c.matchesRegion ? idx : acc), -1);
    if (firstNonLocalIdx !== -1 && lastLocalIdx !== -1) {
      assert.ok(lastLocalIdx < firstNonLocalIdx, 'Gallery must sort region-matching sprites first');
    }
    assert.equal(isAppearanceValidForSelection(newbornMaleGallery[0].entry.id, 'male', 0), true);
    assert.equal(isAppearanceValidForSelection(newbornMaleGallery[0].entry.id, 'male', 2), false);

    for (const entry of realManifest) {
      const fullPath = path.resolve('public/assets', entry.file);
      assert.ok(fs.existsSync(fullPath), `Missing character sprite file for ${entry.id}: ${fullPath}`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `Sprite file is empty (0 bytes) for ${entry.id}: ${fullPath}`);

      // 12a. Every tag in manifest must exist in APPEARANCE_TAG_META
      for (const tag of entry.tags) {
        const meta = getAppearanceTagMeta(tag);
        assert.ok(meta, `Missing Thai tag metadata for "${tag}" on ${entry.id}`);
        assert.ok(meta.label.length > 0, `Empty Thai label for "${tag}" on ${entry.id}`);
      }
    }

    // 12b. Baby minimal factual tags & fixed open-eye babies
    const forbiddenBabyTags = new Set([
      'humble',
      'middle_class',
      'nerdy',
      'gamer',
      'artistic',
      'sporty',
      'khun_nu',
      'energetic_look',
      'cheerful',
      'serious_look',
      'cunning_look',
      'villain_look',
      'rebellious',
      'strict',
      'office',
      'luxury',
    ]);
    for (const entry of realManifest) {
      if (entry.group === 'baby') {
        assert.ok(entry.tags.length <= 5, `Baby ${entry.id} has too many tags (${entry.tags.join(', ')})`);
        for (const t of entry.tags) {
          assert.equal(forbiddenBabyTags.has(t), false, `Baby ${entry.id} must not have adult tag "${t}"`);
        }
      }
      if (entry.group === 'male' || entry.group === 'female') {
        assert.ok(entry.tags.length >= 5, `Adult ${entry.id} must have >= 5 tags (got ${entry.tags.length})`);
        const summary = describeAppearanceTraits(entry.id, { ageYears: 25 })!;
        assert.ok(summary.allTags.length >= 5, `Adult ${entry.id} summary.allTags must have >= 5 labels`);
        assert.ok(summary.styleTags.length === 3, `Adult ${entry.id} summary.styleTags must provide 3 primary tags`);
      }
    }
    assert.equal(getManifestEntry('baby_001')?.eyeColor, 'dark', 'baby_001 eyes must be open dark');
    assert.equal(getManifestEntry('baby_013')?.eyeColor, 'dark', 'baby_013 eyes must be open dark');
    assert.equal(getManifestEntry('baby_016')?.eyeColor, 'dark', 'baby_016 eyes must be open dark');
    assert.equal(getManifestEntry('male_017')?.tags.includes('disheveled'), true);
    assert.equal(getManifestEntry('male_017')?.tags.includes('office'), false);
    assert.equal(getManifestEntry('male_049')?.tags.includes('gamer'), false);
    assert.equal(getManifestEntry('male_011')?.tags.includes('villain_look'), false);
    assert.equal(getManifestEntry('female_019')?.tags.includes('energetic_look'), false);
    assert.equal(getManifestEntry('female_025')?.eyeColor, 'dark');
    assert.equal(getManifestEntry('elder_022')?.tags.includes('gentle_look'), false);
    assert.equal(getManifestEntry('elder_023')?.tags.includes('gentle_look'), false);

    // 12c. Closed-eye & bald baby -> Age 2+ reveal & lock across 2 -> 4 -> 16
    for (let i = 0; i < 40; i++) {
      const seed = 770000 + i * 53;
      const g = checkGenders[i % checkGenders.length];
      const app0 = buildCharacterAppearance(seed, g, 0, undefined, 'baby_019')!;
      assert.equal(app0.charId, 'baby_019');
      assert.equal(app0.geneticEyeColor, undefined, 'Closed-eye baby age 0 must not lock geneticEyeColor');
      assert.equal(app0.geneticHairColor, undefined, 'Bald baby age 0 must not lock geneticHairColor');
      assert.equal(app0.revealedAtAge2, false);

      const traits0 = describeAppearanceTraits(app0.charId, { ageYears: 0, appearance: app0 })!;
      assert.equal(traits0.isEyePendingReveal, true);
      assert.equal(traits0.isHairPendingReveal, true);

      const app2 = buildCharacterAppearance(seed, g, 2, app0)!;
      assert.equal(app2.revealedAtAge2, true);
      assert.ok(app2.geneticEyeColor, 'Age 2 must reveal and lock geneticEyeColor');
      assert.ok(app2.geneticHairColor, 'Age 2 must reveal and lock geneticHairColor');

      const traits2 = describeAppearanceTraits(app2.charId, { ageYears: 2, appearance: app2 })!;
      assert.equal(traits2.isEyePendingReveal, false);
      assert.equal(traits2.isHairPendingReveal, false);

      const app4 = buildCharacterAppearance(seed, g, 4, app2)!;
      const app16 = buildCharacterAppearance(seed, g, 16, app4)!;
      const m4 = getManifestEntry(app4.charId)!;
      const m16 = getManifestEntry(app16.charId)!;

      assert.ok(
        isHairTransitionConsistent(app2.geneticHairColor!, m4.hairColor, 4),
        `Age 2 revealed hair (${app2.geneticHairColor}) must persist at age 4 (${m4.hairColor})`
      );
      assert.ok(
        isHairTransitionConsistent(app2.geneticHairColor!, m16.hairColor, 16),
        `Age 2 revealed hair (${app2.geneticHairColor}) must persist at age 16 (${m16.hairColor})`
      );
      if (app2.geneticEyeColor === 'dark') {
        assert.notEqual(m4.eyeColor, 'blue');
        assert.notEqual(m16.eyeColor, 'blue');
      }
    }

    console.log(
      `✓ ผ่าน: Appearance System (${realManifest.length} ตัวละคร, ไฟล์รูปครบ, กฎช่วงอายุ/ทารก0-1vs2-3/เผยสีตา-สีผมตอน 2 ขวบ/แท็กครบ 5 หมวด ผ่าน 100%)`
    );
  } else {
    console.log(
      '✓ ผ่าน: Appearance Algorithm Logic (หมายเหตุ: characterManifest.json ว่างเปล่า จึงข้ามการตรวจไฟล์ PNG จริงใน public/assets)'
    );
  }
}

function testSceneSystem() {
  // 1. Test sceneImagePath: morning->day, evening/night->night, night_only scenes
  assert.ok(sceneImagePath('home_tenement', 'morning').endsWith('/assets/scenes/home_tenement/day.png'));
  assert.ok(sceneImagePath('home_tenement', 'afternoon').endsWith('/assets/scenes/home_tenement/day.png'));
  assert.ok(sceneImagePath('home_tenement', 'evening').endsWith('/assets/scenes/home_tenement/night.png'));
  assert.ok(sceneImagePath('home_tenement', 'night').endsWith('/assets/scenes/home_tenement/night.png'));

  // Night-only scenes: must return night.png for every daypart
  for (const dp of ['morning', 'afternoon', 'evening', 'night'] as const) {
    assert.ok(
      sceneImagePath('street_food_night', dp).endsWith('/assets/scenes/street_food_night/night.png'),
      `street_food_night during ${dp} must return night.png`
    );
    assert.ok(
      sceneImagePath('nightlife_pub', dp).endsWith('/assets/scenes/nightlife_pub/night.png'),
      `nightlife_pub during ${dp} must return night.png`
    );
  }

  // 2. Test isSceneOpen rules
  // 2a. nightlife_pub: closed morning/afternoon, minor (<18) blocked, age 19 blocked at 20 but allowed at 18
  assert.equal(isSceneOpen('nightlife_pub', 'morning', 25), false, 'Pub must be closed in morning');
  assert.equal(isSceneOpen('nightlife_pub', 'afternoon', 25), false, 'Pub must be closed in afternoon');
  assert.equal(isSceneOpen('nightlife_pub', 'night', 16), false, 'Minors (<18) must never enter pub');
  assert.equal(isSceneOpen('nightlife_pub', 'night', 17), false, 'Age 17 must never enter pub');
  assert.equal(isSceneOpen('nightlife_pub', 'night', 19, { pubVisitAge: 20 }), false, 'Age 19 cannot enter when pubVisitAge=20');
  assert.equal(isSceneOpen('nightlife_pub', 'night', 19), false, 'Age 19 cannot enter with default pubVisitAge 20');
  assert.equal(isSceneOpen('nightlife_pub', 'night', 19, { pubVisitAge: 18 }), true, 'Age 19 CAN enter when pubVisitAge=18');
  assert.equal(isSceneOpen('nightlife_pub', 'night', 20), true, 'Age 20 can enter in night');
  assert.equal(isSceneOpen('nightlife_pub', 'evening', 22), true, 'Age 22 can enter in evening');

  // 2b. street_food_night: evening/night only
  assert.equal(isSceneOpen('street_food_night', 'morning', 25), false, 'Street food alley closed morning');
  assert.equal(isSceneOpen('street_food_night', 'afternoon', 25), false, 'Street food alley closed afternoon');
  assert.equal(isSceneOpen('street_food_night', 'evening', 25), true, 'Street food alley open evening');
  assert.equal(isSceneOpen('street_food_night', 'night', 25), true, 'Street food alley open night');

  // 2c. hospital: open 24h across all dayparts
  for (const dp of ['morning', 'afternoon', 'evening', 'night'] as const) {
    assert.equal(isSceneOpen('hospital', dp, 25), true, `Hospital must be open during ${dp}`);
  }

  // 2d. schools: closed at night and evening
  for (const schoolId of ['school_public', 'school_temple', 'school_international']) {
    assert.equal(isSceneOpen(schoolId, 'morning', 10), true, `${schoolId} open morning`);
    assert.equal(isSceneOpen(schoolId, 'afternoon', 10), true, `${schoolId} open afternoon`);
    assert.equal(isSceneOpen(schoolId, 'evening', 10), false, `${schoolId} closed evening`);
    assert.equal(isSceneOpen(schoolId, 'night', 10), false, `${schoolId} closed night`);
  }

  // 2e. home scenes: open across all dayparts
  for (const homeId of ['home_tenement', 'home_rural_stilt', 'home_condo_mid', 'home_mansion']) {
    for (const dp of ['morning', 'afternoon', 'evening', 'night'] as const) {
      assert.equal(isSceneOpen(homeId, dp, 20), true, `${homeId} must be open during ${dp}`);
    }
  }

  // 3. resolveDaypart: deterministic and cycles across all 4 dayparts (morning, afternoon, evening, night)
  for (let i = 0; i < 50; i++) {
    const s1 = createInitialGameState({ mode: 'random', seed: 44000 + i * 17 });
    const s2 = createInitialGameState({ mode: 'random', seed: 44000 + i * 17 });
    assert.equal(resolveDaypart(s1), resolveDaypart(s2), `resolveDaypart must be deterministic for seed ${i}`);
  }
  const seenDayparts = new Set<string>();
  const dayState = createInitialGameState({ mode: 'random', seed: 77777 });
  for (const idx of [0, 1, 2, 3] as const) {
    seenDayparts.add(resolveDaypart(dayState, idx));
  }
  assert.equal(seenDayparts.has('morning'), true, 'Must reach morning daypart');
  assert.equal(seenDayparts.has('afternoon'), true, 'Must reach afternoon daypart');
  assert.equal(seenDayparts.has('evening'), true, 'Must reach evening daypart');
  assert.equal(seenDayparts.has('night'), true, 'Must reach night daypart');

  // 4. pickSceneForState: deterministic & never returns a closed scene
  for (let i = 0; i < 100; i++) {
    const s1 = createInitialGameState({ mode: 'random', seed: 88000 + i * 31 });
    const s2 = createInitialGameState({ mode: 'random', seed: 88000 + i * 31 });
    const scene1 = pickSceneForState(s1);
    const scene2 = pickSceneForState(s2);
    assert.equal(scene1, scene2, `pickSceneForState must be deterministic for seed ${i}`);

    const dp = resolveDaypart(s1);
    const isOpen = isSceneOpen(scene1, dp, s1.character.ageYears);
    assert.equal(isOpen, true, `pickSceneForState must never return closed scene (${scene1} at ${dp})`);
  }

  // 5. Verify all 40 image files in manifest exist on disk and are non-empty
  let imageFileCount = 0;
  for (const scene of SCENE_MANIFEST.scenes) {
    if (scene.files.day) {
      const fullPath = path.resolve('public/assets', scene.files.day);
      assert.ok(fs.existsSync(fullPath), `Scene file missing: ${fullPath}`);
      assert.ok(fs.statSync(fullPath).size > 0, `Scene file empty: ${fullPath}`);
      imageFileCount++;
    }
    if (scene.files.night) {
      const fullPath = path.resolve('public/assets', scene.files.night);
      assert.ok(fs.existsSync(fullPath), `Scene file missing: ${fullPath}`);
      assert.ok(fs.statSync(fullPath).size > 0, `Scene file empty: ${fullPath}`);
      imageFileCount++;
    }
  }
  assert.equal(imageFileCount, 40, `Must verify all 40 scene image files (got ${imageFileCount})`);
  assert.equal(SCENE_MANIFEST.scenes.length, 21, 'Must have 21 scenes in manifest');

  console.log(
    `✓ ผ่าน: Scene System (21 ฉาก, 40 ภาพ, กฎ daypart->ภาพ, Availability Gates, ผับ 18 vs 20, Determinisim และ Fallback ฉากบ้าน ผ่าน 100%)`
  );
}

function testGenderSeparatedNameBanks() {
  assert.ok(FIRST_NAMES.male.length >= 100, `Expected >= 100 male first names, got ${FIRST_NAMES.male.length}`);
  assert.ok(FIRST_NAMES.female.length >= 100, `Expected >= 100 female first names, got ${FIRST_NAMES.female.length}`);
  assert.ok(FIRST_NAMES.nonbinary.length >= 100, `Expected >= 100 nonbinary first names, got ${FIRST_NAMES.nonbinary.length}`);
  assert.ok(LAST_NAMES.length >= 100, `Expected >= 100 last names, got ${LAST_NAMES.length}`);
  assert.ok(NICKNAMES_MALE.length >= 100, `Expected >= 100 male nicknames, got ${NICKNAMES_MALE.length}`);
  assert.ok(NICKNAMES_FEMALE.length >= 100, `Expected >= 100 female nicknames, got ${NICKNAMES_FEMALE.length}`);
  assert.ok(NICKNAMES_UNISEX.length >= 40, `Expected >= 40 unisex nicknames, got ${NICKNAMES_UNISEX.length}`);

  const maleOnlySet = new Set(NICKNAMES_MALE);
  const femaleOnlySet = new Set(NICKNAMES_FEMALE);

  for (let i = 0; i < 150; i++) {
    const fLife = generateLife({ mode: 'custom', seed: 61000 + i, custom: { gender: 'female' } });
    assert.equal(maleOnlySet.has(fLife.person.nickname), false, `Female character received male nickname "${fLife.person.nickname}"`);

    const mLife = generateLife({ mode: 'custom', seed: 62000 + i, custom: { gender: 'male' } });
    assert.equal(femaleOnlySet.has(mLife.person.nickname), false, `Male character received female nickname "${mLife.person.nickname}"`);
  }

  console.log('✓ ผ่าน: Gender-Separated Thai Name Banks (ชื่อจริง-นามสกุล-ชื่อเล่นแยกเพศครบ 100+ รายการ)');
}

function testPhase2DeterminismMultiYear() {
  const req: LifeGenRequest = {
    mode: 'at_age',
    seed: 202602,
    atAge: { targetAge: 19, education: 'upper_secondary', wealthFocus: 'average' },
  };
  let s1 = createInitialGameState(req);
  let s20 = createInitialGameState(req);

  const basePlanner = createInitialPlannerState(s1);
  const customGrid: PlannerGrid = {
    weekday: {
      ...basePlanner.grid.weekday,
      evening: 'self_study',
      night: 'sleep_normal',
    },
    weekend: {
      morning: 'self_study',
      afternoon: 'meet_friends',
      evening: 'family_time',
      night: 'sleep_normal',
    },
  };
  const customAlloc = deriveWeeklyAllocation(customGrid, s1);
  const validRes = validateTimeAllocation(customAlloc, 19);
  assert.equal(validRes.valid, true, 'Custom 168h adult allocation derived from grid must be valid');

  const orders = createDefaultStandingOrders(s1.character);
  orders.autopilotEnabled = true;
  orders.riskProfile = 'balanced';

  const applySetup = (st: typeof s1) => {
    let cur = dispatchPlayerAction(st, {
      type: 'CONFIRM_LIFE_PLANNER',
      grid: customGrid,
      presetId: 'custom',
    }).state;
    cur = dispatchPlayerAction(cur, { type: 'UPDATE_STANDING_ORDERS', orders }).state;
    return cur;
  };
  s1 = applySetup(s1);
  s20 = applySetup(s20);

  // Run 400 days x1 vs x20 bursts (crossing birthday, weekly evidence, monthly traits & autopilot checks)
  const runBatch = (st: typeof s1, days: number, burstSize: number) => {
    let cur = st;
    let rem = days;
    while (rem > 0) {
      const b = Math.min(burstSize, rem);
      for (let i = 0; i < b; i++) {
        if (cur.pendingPrompt) {
          cur = dispatchPlayerAction(cur, {
            type: 'RESOLVE_PROMPT',
            promptId: cur.pendingPrompt.id,
            choiceId: cur.pendingPrompt.choices[0].id,
          }).state;
        }
        if (cur.pendingAutopilotSituation) {
          cur = dispatchPlayerAction(cur, {
            type: 'RESOLVE_AUTOPILOT',
            situationId: cur.pendingAutopilotSituation.id,
            optionId: cur.pendingAutopilotSituation.options[0].id,
          }).state;
        }
        cur = stepOneTick(cur);
        rem--;
      }
    }
    return cur;
  };

  s1 = runBatch(s1, 400, 1);
  s20 = runBatch(s20, 400, 20);

  assert.equal(s1.date.totalDays, s20.date.totalDays, 'Total days must match at x1 vs x20');
  assert.equal(s1.rngState, s20.rngState, 'RNG state must match identically at x1 vs x20');
  assert.deepEqual(s1.evidence, s20.evidence, 'Evidence counters must match identically');
  assert.deepEqual(s1.character.personality, s20.character.personality, 'Personality axes must match identically');
  assert.deepEqual(s1.character.emergentTraits, s20.character.emergentTraits, 'Emergent traits must match identically');
  assert.deepEqual(s1.timeAllocation, s20.timeAllocation, 'Time allocation must match identically');
  assert.equal(s1.economy.cash, s20.economy.cash, 'Cash must match identically');

  console.log('✓ ผ่าน: Phase 2 Determinism Multi-Year (TimeAlloc + Evidence + Traits + Autopilot ตรงกัน 100% ที่ x1 vs x20)');
}

function testPhase2TraitFormationGatesAndTurningPoint() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 551100,
    atAge: { targetAge: 22, education: 'bachelor', wealthFocus: 'average' },
  });

  // 1. Personality/Temperament Gate: hot_tempered requires maxStability <= 54 and minEnergy >= 55
  let gatedOut: GameState = {
    ...base,
    character: {
      ...base.character,
      emergentTraits: [] as EmergentTraitInstance[],
      temperamentProfile: { energy: 75, positivity: 50, sensitivity: 60, obsessiveness: 50 },
      personality: { ambition: 55, agreeableness: 45, stability: 82 }, // too stable for hot_tempered
    },
  };
  gatedOut = recordEvidence(gatedOut, 'conflict_lash', 14);
  gatedOut = checkTraitFormation(gatedOut, 'monthly', false);
  assert.equal(
    (gatedOut.character.emergentTraits ?? []).some((t) => t.id === 'hot_tempered'),
    false,
    'hot_tempered must NOT form when Layer B stability gate fails'
  );

  // Lower stability inside gate -> now forms with same evidence
  let gatedPass: GameState = {
    ...gatedOut,
    character: {
      ...gatedOut.character,
      personality: { ambition: 55, agreeableness: 45, stability: 40 },
    },
  };
  gatedPass = checkTraitFormation(gatedPass, 'monthly', false);
  assert.equal(
    (gatedPass.character.emergentTraits ?? []).some((t) => t.id === 'hot_tempered'),
    true,
    'hot_tempered must form when both evidence and Layer A/B gates pass'
  );

  // 2. Sensitive stage multiplier: school_kid (1.35x) scores higher than senior (0.80x)
  const makeForAge = (age: number): GameState => ({
    ...base,
    character: {
      ...base.character,
      ageYears: age,
      isMinor: age < 18,
      lifeStage: getLifeStageForAge(age).id,
      emergentTraits: [] as EmergentTraitInstance[],
      temperamentProfile: { energy: 65, positivity: 65, sensitivity: 50, obsessiveness: 55 },
      personality: { ambition: 60, agreeableness: 60, stability: 55 },
    },
    evidence: { family_time: 7 },
  });
  const kidState = checkTraitFormation(makeForAge(10), 'monthly', false);
  const seniorState = checkTraitFormation(makeForAge(68), 'monthly', false);
  const kidFamily = kidState.character.emergentTraits?.find((t) => t.id === 'family_anchored');
  const seniorFamily = seniorState.character.emergentTraits?.find((t) => t.id === 'family_anchored');
  assert.ok(kidFamily, 'school_kid with family_time=7 should form family_anchored via 1.35x stage bonus');
  assert.equal(seniorFamily, undefined, 'senior (0.80x) should not yet cross threshold at family_time=7');

  // 3. Recovery path decay: accumulate recovery evidence (self_reflection) and decay hot_tempered out
  let recovering: GameState = {
    ...gatedPass,
    evidence: { conflict_lash: 1, self_reflection: 20 },
  };
  for (let w = 0; w < 24; w++) {
    recovering = checkTraitFormation(recovering, 'weekly', false);
  }
  assert.equal(
    (recovering.character.emergentTraits ?? []).some((t) => t.id === 'hot_tempered'),
    false,
    'hot_tempered must fade away after recovery evidence + lack of reinforcement'
  );

  // 4. Turning point bypasses normal gate and sets originStory
  const tpInput = {
    ...gatedPass,
    character: {
      ...gatedPass.character,
      personality: { ambition: 40, agreeableness: 30, stability: 20 }, // below calm_minded gate (52)
    },
  };
  const afterTp = applyTurningPoint(tpInput, 'parent_illness_calm');
  const calmInst = afterTp.character.emergentTraits?.find((t) => t.id === 'calm_minded');
  assert.ok(calmInst, 'Turning point must grant calm_minded bypassing normal stability gate');
  assert.ok(calmInst!.originStory.includes('22'), 'Turning point originStory must record age');
  assert.equal(
    (afterTp.character.emergentTraits ?? []).some((t) => t.id === 'hot_tempered'),
    false,
    'parent_illness_calm turning point removes hot_tempered'
  );

  // 5. hidden_to_self spoiler masking in explainTrait & explainStat
  let hiddenHost = {
    ...base,
    character: {
      ...base.character,
      emergentTraits: [
        {
          id: 'stress_sensitive',
          intensity: 'clear' as const,
          intensityScore: 15,
          visibility: 'hidden_to_self' as const,
          formedAtAge: 22,
          formedAtDay: 10,
          originStory: 'ลับ',
          evidenceReason: 'ลับ',
          lastReinforcedDay: 10,
        },
      ],
    },
  };
  const traitDef = TRAITS_BY_ID.get('stress_sensitive')!;
  const expT = explainTrait(hiddenHost, 'stress_sensitive')!;
  const expS = explainStat(hiddenHost, 'trait:stress_sensitive');
  assert.equal(expT.titleTh, 'แนวโน้มแฝงที่ยังไม่รู้ตัว', 'hidden_to_self must return masked title');
  assert.equal(expT.titleTh.includes(traitDef.nameTh), false, 'Must not leak actual hidden trait name');
  assert.equal(expS.title.includes(traitDef.nameTh), false, 'explainStat must not leak hidden trait name');
  assert.equal(expS.formulaText.includes(traitDef.nameTh), false, 'explainStat formulaText must not leak hidden trait name');

  // 6. Conflicting traits generate innerTension
  const tension = computeInnerTensionFromTraits([
    {
      id: 'strict_saver',
      intensity: 'clear',
      intensityScore: 15,
      visibility: 'known',
      formedAtAge: 22,
      formedAtDay: 1,
      originStory: 'test',
      evidenceReason: 'test',
      lastReinforcedDay: 1,
    },
    {
      id: 'emotional_spender',
      intensity: 'clear',
      intensityScore: 15,
      visibility: 'known',
      formedAtAge: 22,
      formedAtDay: 1,
      originStory: 'test',
      evidenceReason: 'test',
      lastReinforcedDay: 1,
    },
  ]);
  assert.ok(tension >= 18, `Conflicting traits must yield innerTension >= 18 (got ${tension})`);
  assert.ok(TURNING_POINTS_BY_KIND.size >= 6, 'Must have at least 6 turning point definitions');

  console.log('✓ ผ่าน: Phase 2 Trait System (Gate 3 ชั้น, Sensitive Stage, Recovery Decay, Turning Point & Spoiler Masking)');
}

function testPhase2TraitFourWayEffects() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 778899,
    atAge: { targetAge: 24, education: 'bachelor', wealthFocus: 'average' },
  });

  // 1. Action Gating: self_doubting (clear) locks public_speaking_stage; socializing >= 25 overrides it
  const doubtingState = {
    ...base,
    character: {
      ...base.character,
      skills: { ...base.character.skills, socializing: 10 },
      emergentTraits: [
        {
          id: 'self_doubting',
          intensity: 'clear' as const,
          intensityScore: 16,
          visibility: 'known' as const,
          formedAtAge: 18,
          formedAtDay: 1,
          originStory: 'test',
          evidenceReason: 'test',
          lastReinforcedDay: 1,
        },
      ],
    },
  };
  const lockedEval = filterAvailableActions(doubtingState).find((a) => a.action.id === 'public_speaking_stage')!;
  assert.equal(lockedEval.available, false, 'self_doubting clear must lock public_speaking_stage');
  assert.equal(lockedEval.lockedByTraitId, 'self_doubting');

  const skilledState = {
    ...doubtingState,
    character: {
      ...doubtingState.character,
      skills: { ...doubtingState.character.skills, socializing: 28 },
    },
  };
  const unlockedEval = filterAvailableActions(skilledState).find((a) => a.action.id === 'public_speaking_stage')!;
  assert.equal(unlockedEval.available, true, 'socializing >= 25 must unlock public_speaking_stage');

  // 2. Hazard Modifiers
  const riskyState = {
    ...base,
    character: {
      ...base.character,
      emergentTraits: [
        {
          id: 'risk_taker',
          intensity: 'clear' as const,
          intensityScore: 15,
          visibility: 'known' as const,
          formedAtAge: 20,
          formedAtDay: 1,
          originStory: 'test',
          evidenceReason: 'test',
          lastReinforcedDay: 1,
        },
      ],
    },
  };
  const cautiousState = {
    ...base,
    character: {
      ...base.character,
      emergentTraits: [
        {
          id: 'cautious_planner',
          intensity: 'clear' as const,
          intensityScore: 20,
          visibility: 'known' as const,
          formedAtAge: 20,
          formedAtDay: 1,
          originStory: 'test',
          evidenceReason: 'test',
          lastReinforcedDay: 1,
        },
      ],
    },
  };
  assert.ok(hazardModifiers(riskyState).multiplier > 1.0, 'risk_taker must raise hazard multiplier');
  assert.ok(hazardModifiers(cautiousState).multiplier < 1.0, 'cautious_planner must lower hazard multiplier');

  // 3. Autopilot Bias & 4. Reputation View
  const biases = getAutopilotTraitBiases(riskyState.character);
  assert.ok(biases.riskBias > 0.4, 'risk_taker must generate positive riskBias');
  const repRisky = computeReputationViews(riskyState);
  const repCautious = computeReputationViews(cautiousState);
  assert.ok(repCautious.work > repRisky.work, 'cautious_planner must earn higher work reputation than risk_taker');
  assert.ok(repCautious.family > repRisky.family, 'cautious_planner must earn higher family reputation than risk_taker');

  console.log('✓ ผ่าน: Phase 2 Trait 4-Way Effects (Action Gate + Skill Override, Hazard, Autopilot Bias & Reputation View)');
}

function testPhase2LifeStagesAndSpec03Rules() {
  // 7 life sub-stages check
  assert.equal(getLifeStageForAge(0).id, 'newborn');
  assert.equal(getLifeStageForAge(2).id, 'toddler');
  assert.equal(getLifeStageForAge(7).id, 'school_kid');
  assert.equal(getLifeStageForAge(15).id, 'teen');
  assert.equal(getLifeStageForAge(22).id, 'young_adult');
  assert.equal(getLifeStageForAge(40).id, 'mid_adult');
  assert.equal(getLifeStageForAge(65).id, 'senior');

  // Spec 03 Section 2 rules
  const s14 = createInitialGameState({ mode: 'at_age', seed: 1414, atAge: { targetAge: 14, education: 'primary', wealthFocus: 'average' } });
  const r14 = getAgeEmploymentRules(14);
  assert.equal(r14.canWorkAny, false, '<15 cannot take paid work');
  assert.equal(checkJobEligibility(s14.character, 'convenience_staff').allowed, false, 'Age 14 blocked from convenience_staff');

  const s16 = createInitialGameState({ mode: 'at_age', seed: 1616, atAge: { targetAge: 16, education: 'lower_secondary', wealthFocus: 'average' } });
  const r16 = getAgeEmploymentRules(16);
  assert.equal(r16.canWorkPartTimeOnly, true, '15-17 is part-time only');
  assert.equal(r16.maxWeeklyHours, 48, '15-17 weekly cap must be 48h');
  assert.equal(r16.canWorkNightShift, false, '15-17 forbidden from night shifts');
  assert.equal(r16.canWorkEntertainmentVenue, false, '15-17 forbidden from pub work');
  assert.equal(checkJobEligibility(s16.character, 'convenience_staff').allowed, true, 'Age 16 can work part-time convenience_staff');
  assert.equal(checkJobEligibility(s16.character, 'food_rider').allowed, false, 'Age 16 strictly blocked from adult 18+ food_rider');

  const s19 = createInitialGameState({ mode: 'at_age', seed: 1919, atAge: { targetAge: 19, education: 'upper_secondary', wealthFocus: 'average' } });
  const r19 = getAgeEmploymentRules(19, { pubVisitAge: 20 });
  assert.equal(r19.canWorkEntertainmentVenue, true, 'Age 19 allowed entertainment venue work (18+)');
  assert.equal(checkJobEligibility(s19.character, 'food_rider').allowed, true, 'Age 19 can apply for adult 18+ food_rider');
  assert.equal(canEnterNightlife(17, { pubVisitAge: 18 }), false, '<18 permanently blocked from nightlife');
  assert.equal(canEnterNightlife(19, { pubVisitAge: 20 }), false, 'Age 19 blocked from pub visit when pubVisitAge=20');
  assert.equal(canEnterNightlife(19, { pubVisitAge: 18 }), true, 'Age 19 allowed pub visit when pubVisitAge=18');

  console.log('✓ ผ่าน: Phase 2 Life Stages (7 ช่วงวัย) & Spec 03 §2 (กฎอายุ/พาร์ตไทม์/สถานบันเทิง)');
}

function testPhase2TimeAllocationAndNightDaypart() {
  // Invalid sum (!= 168)
  const badSum = { sleep: 50, workOrStudy: 40, sideGig: 0, social: 10, hobby: 10, family: 10, selfDev: 10, nightlife: 0 };
  assert.equal(validateTimeAllocation(badSum, 25).valid, false, 'Must reject sum != 168');

  // Minor with nightlife > 0 rejected
  const minorNight = { sleep: 56, workOrStudy: 40, sideGig: 0, social: 18, hobby: 20, family: 14, selfDev: 14, nightlife: 6 };
  assert.equal(validateTimeAllocation(minorNight, 16).valid, false, 'Must reject minor with nightlife > 0');

  // Adult with low sleep rejected
  const lowSleep = { sleep: 20, workOrStudy: 70, sideGig: 0, social: 20, hobby: 20, family: 18, selfDev: 20, nightlife: 0 };
  assert.equal(validateTimeAllocation(lowSleep, 25).valid, false, 'Must reject sleep < STAGE_MIN_SLEEP_HOURS');

  // Dominant nightlife via Life Planner grid -> resolveDaypart === 'night'
  const rawAdult = createInitialGameState({
    mode: 'at_age',
    seed: 990011,
    atAge: { targetAge: 24, education: 'bachelor', wealthFocus: 'average' },
  });
  const baseAdult: GameState = {
    ...rawAdult,
    economy: {
      ...rawAdult.economy,
      jobId: 'office_junior',
      monthlySalary: 18000,
      cash: Math.max(rawAdult.economy.cash, 10000),
    },
  };
  const nightHeavyGrid: PlannerGrid = {
    weekday: {
      morning: 'work_shift',
      afternoon: 'work_shift',
      evening: 'family_time',
      night: 'party_night',
    },
    weekend: {
      morning: 'family_time',
      afternoon: 'family_time',
      evening: 'family_time',
      night: 'sleep_full',
    },
  };
  const nightHeavyAlloc = deriveWeeklyAllocation(nightHeavyGrid, baseAdult);
  assert.equal(validateTimeAllocation(nightHeavyAlloc, 24).valid, true);
  assert.equal(getDominantNightDaypart(nightHeavyAlloc), 'night');

  const res = dispatchPlayerAction(baseAdult, {
    type: 'CONFIRM_LIFE_PLANNER',
    grid: nightHeavyGrid,
    presetId: 'social_party',
  });
  assert.equal(res.accepted, true);
  const activatedNightState = stepOneTick(res.state, { allowPrompts: false, recordLogs: false });
  assert.equal(
    resolveDaypart(activatedNightState),
    'night',
    'Dominant nightlife schedule must resolve daypart to night'
  );

  const sceneId = pickSceneForState(activatedNightState);
  const img = sceneImagePath(sceneId, resolveDaypart(activatedNightState));
  assert.ok(img.endsWith('night.png'), `Expected night.png for nightlife-dominant schedule (got ${img})`);

  // Weekly allocation collects overwork evidence when workOrStudy >= 55 (via overtime_work slots)
  const workaholicGrid: PlannerGrid = {
    weekday: {
      morning: 'work_shift',
      afternoon: 'work_shift',
      evening: 'overtime_work',
      night: 'sleep_normal',
    },
    weekend: {
      morning: 'self_study',
      afternoon: 'self_study',
      evening: 'quiet_rest',
      night: 'sleep_normal',
    },
  };
  const workConfirm = dispatchPlayerAction(
    { ...baseAdult, evidence: {} },
    { type: 'CONFIRM_LIFE_PLANNER', grid: workaholicGrid, presetId: 'workaholic' }
  );
  assert.equal(workConfirm.accepted, true, 'Workaholic overtime grid must be accepted');
  const workState = stepOneTick(workConfirm.state, { allowPrompts: false, recordLogs: false });
  const afterWeek = applyWeeklyTimeAllocation({ ...workState, evidence: {} }, false);
  assert.ok((afterWeek.evidence?.overwork ?? 0) >= 2.0, 'Weekly overwork schedule must record overwork evidence');
  assert.ok((afterWeek.evidence?.self_discipline ?? 0) > 0, 'High selfDev schedule must record self_discipline');

  console.log('✓ ผ่าน: Phase 2 Time Allocation (168 ชม./สัปดาห์, Minor Lock, Night Daypart Wiring & Weekly Evidence)');
}

function testPhase2AutopilotStandingOrdersAndDigest() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 334455,
    atAge: { targetAge: 25, education: 'bachelor', wealthFocus: 'average' },
  });

  // 1. emotional_spender overrides balanced payday rule toward impulse_treat when strictBudget=false
  const spenderOrders = createDefaultStandingOrders(base.character);
  spenderOrders.autopilotEnabled = true;
  spenderOrders.riskProfile = 'balanced';
  spenderOrders.financial.strictBudget = false;

  const spenderState = {
    ...base,
    standingOrders: spenderOrders,
    character: {
      ...base.character,
      emergentTraits: [
        {
          id: 'emotional_spender',
          intensity: 'clear' as const,
          intensityScore: 15,
          visibility: 'known' as const,
          formedAtAge: 24,
          formedAtDay: 1,
          originStory: 'test',
          evidenceReason: 'test',
          lastReinforcedDay: 1,
        },
      ],
    },
  };
  const paydaySit = buildAutopilotSituation('payday_temptation', 10, false)!;
  const spenderDecision = autopilotDecide(spenderState, paydaySit, 1234);
  assert.equal(spenderDecision.handled, true);
  assert.equal(spenderDecision.chosenOption?.id, 'impulse_treat', 'emotional_spender should pick impulse_treat when strictBudget=false');

  // 2. strictBudget=true overrides emotional_spender to save_strictly
  const strictState = {
    ...spenderState,
    standingOrders: {
      ...spenderOrders,
      financial: { ...spenderOrders.financial, strictBudget: true },
    },
  };
  const strictDecision = autopilotDecide(strictState, paydaySit, 1234);
  assert.equal(strictDecision.handled, true);
  assert.equal(strictDecision.chosenOption?.id, 'save_strictly', 'strictBudget=true must force save_strictly');

  // 3. slacker picks rest_instead on overtime_offer
  const slackerOrders = createDefaultStandingOrders(base.character);
  slackerOrders.rules = [
    ...slackerOrders.rules,
    {
      id: 'rule_overtime',
      enabled: true,
      conditionKey: 'overtime_offer',
      actionKey: 'accept_if_safe',
      labelTh: 'ทำโอทีถ้าพลังพอ',
    },
  ];
  const slackerState = {
    ...base,
    standingOrders: slackerOrders,
    character: {
      ...base.character,
      emergentTraits: [
        {
          id: 'slacker',
          intensity: 'clear' as const,
          intensityScore: 15,
          visibility: 'known' as const,
          formedAtAge: 23,
          formedAtDay: 1,
          originStory: 'test',
          evidenceReason: 'test',
          lastReinforcedDay: 1,
        },
      ],
    },
  };
  const otSit = buildAutopilotSituation('overtime_offer', 15, false)!;
  const slackerDecision = autopilotDecide(slackerState, otSit, 5678);
  assert.equal(slackerDecision.handled, true);
  assert.equal(slackerDecision.chosenOption?.id, 'rest_instead', 'slacker should pick rest_instead on overtime_offer');

  // 4. Unhandled situation (risky_windfall is disabled by default) pauses game with needsPlayer=true
  const triggerRes = dispatchPlayerAction(base, { type: 'TRIGGER_AUTOPILOT_SITUATION', kind: 'risky_windfall' });
  assert.equal(triggerRes.accepted, true);
  assert.ok(triggerRes.state.pendingAutopilotSituation !== null);
  const pausedTick = stepOneTick({ ...triggerRes.state, needsPlayer: false });
  assert.equal(pausedTick.needsPlayer, true, 'Unhandled Autopilot situation must pause tick pipeline');
  assert.ok(pausedTick.pendingAutopilotSituation !== null);

  // 5. skipToNextMilestone populates lastDigest cleanly without AI
  let digestState = recordEvidenceBatch(base, { disciplined_saving: 10 }, { reason: 'test' });
  digestState = skipToNextMilestone(digestState, 'milestone', 400);
  assert.ok(digestState.lastDigest !== null, 'skipToNextMilestone must generate PeriodDigest');
  assert.ok(digestState.lastDigest!.summaryLines.length >= 2, 'PeriodDigest must contain template summary lines');

  console.log('✓ ผ่าน: Phase 2 Autopilot, Standing Orders (Strict Budget Override, Unhandled Pause) & Period Digest');
}

function testPhase3StoryletAndDirector() {
  // Test 1: x1 vs x20 same seed + actions -> identical event selection & state across 2 years (730 days)
  const reqDet: LifeGenRequest = {
    mode: 'custom',
    seed: 202603,
    custom: {
      gender: 'female',
      startingAge: 24,
      province: 'กรุงเทพมหานคร',
      familyWealth: 'middle',
      region: 'bangkok',
    },
  };
  let sim1 = createInitialGameState(reqDet);
  let sim20 = createInitialGameState(reqDet);

  // Run 730 days at x1 (1 tick per loop)
  for (let d = 0; d < 730; d++) {
    if (sim1.pendingPrompt) {
      sim1 = dispatchPlayerAction(sim1, {
        type: 'RESOLVE_PROMPT',
        promptId: sim1.pendingPrompt.id,
        choiceId: sim1.pendingPrompt.choices[0].id,
      }).state;
    }
    if (sim1.pendingAutopilotSituation) {
      sim1 = dispatchPlayerAction(sim1, {
        type: 'RESOLVE_AUTOPILOT',
        situationId: sim1.pendingAutopilotSituation.id,
        optionId: sim1.pendingAutopilotSituation.options[0].id,
      }).state;
    }
    sim1 = stepOneTick(sim1, { allowPrompts: true });
  }

  // Run 730 days in x20 bursts (up to 20 ticks per batch, pausing cleanly on prompts)
  let remaining = 730;
  while (remaining > 0) {
    const batch = Math.min(20, remaining);
    for (let i = 0; i < batch; i++) {
      if (sim20.pendingPrompt) {
        sim20 = dispatchPlayerAction(sim20, {
          type: 'RESOLVE_PROMPT',
          promptId: sim20.pendingPrompt.id,
          choiceId: sim20.pendingPrompt.choices[0].id,
        }).state;
      }
      if (sim20.pendingAutopilotSituation) {
        sim20 = dispatchPlayerAction(sim20, {
          type: 'RESOLVE_AUTOPILOT',
          situationId: sim20.pendingAutopilotSituation.id,
          optionId: sim20.pendingAutopilotSituation.options[0].id,
        }).state;
      }
      sim20 = stepOneTick(sim20, { allowPrompts: true });
      remaining--;
      if (sim20.needsPlayer) break;
    }
  }

  assert.equal(sim1.date.totalDays, sim20.date.totalDays, 'x1 vs x20 totalDays must match');
  assert.equal(sim1.economy.cash, sim20.economy.cash, 'x1 vs x20 cash must match');
  assert.deepEqual(sim1.character.indices, sim20.character.indices, 'x1 vs x20 indices must match');
  assert.deepEqual(
    sim1.directorState?.seenStoryletIds,
    sim20.directorState?.seenStoryletIds,
    'x1 vs x20 Director selected storylets must match identically'
  );
  console.log('✓ ผ่าน: Phase 3 Test 1 - Determinism (x1 vs x20 ได้ event และ state ตรงกัน 100%)');

  // Test 2: validateStorylet rejects romance/adult for minors (< 18) and invalid sceneId
  const invalidAdultForMinor = {
    id: 'test_invalid_adult',
    title: 'ทดสอบผู้ใหญ่',
    bodyTemplate: 'เนื้อหาผู้ใหญ่',
    category: 'romance' as const,
    tier: 'T2' as const,
    conditions: { minAge: 16, isMinorSafe: false },
    isAdultContent: true,
    choices: [{ id: 'c1', label: 'เลือก', effects: [] }],
  };
  assert.equal(
    validateStorylet(invalidAdultForMinor).valid,
    false,
    'Validator must reject adult/non-minorSafe romance for minors (< 18)'
  );

  const invalidSceneStorylet = {
    id: 'test_invalid_scene',
    title: 'ฉากไม่มีอยู่จริง',
    bodyTemplate: 'ทดสอบฉาก',
    category: 'work' as const,
    tier: 'T1' as const,
    sceneId: 'nonexistent_scene_999',
  };
  assert.equal(
    validateStorylet(invalidSceneStorylet).valid,
    false,
    'Validator must reject unknown sceneId absent from sceneManifest'
  );

  assert.ok(STORYLET_CATALOG.length >= 30, `Catalog must have >= 30 storylets (got ${STORYLET_CATALOG.length})`);
  for (const storylet of STORYLET_CATALOG) {
    const res = validateStorylet(storylet);
    assert.equal(res.valid, true, `Storylet ${storylet.id} must be valid: ${res.errors.join(', ')}`);
  }
  console.log(`✓ ผ่าน: Phase 3 Test 2 - Storylet Validator (คัดกรองผู้เยาว์/ฉากผิดพลาด และผ่านครบทั้ง ${STORYLET_CATALOG.length} ใบ)`);

  // Test 3: Director respects tension budget & cooldowns (T2/T3 do not fire back-to-back)
  let pacingState = createInitialGameState(reqDet);
  const t2EventsDays: number[] = [];
  const t3EventsDays: number[] = [];
  for (let d = 0; d < 365; d++) {
    if (pacingState.pendingPrompt) {
      if (pacingState.pendingPrompt.tier === 'T2') {
        t2EventsDays.push(pacingState.date.totalDays);
      } else if (pacingState.pendingPrompt.tier === 'T3') {
        t3EventsDays.push(pacingState.date.totalDays);
      }
      pacingState = dispatchPlayerAction(pacingState, {
        type: 'RESOLVE_PROMPT',
        promptId: pacingState.pendingPrompt.id,
        choiceId: pacingState.pendingPrompt.choices[0].id,
      }).state;
    }
    if (pacingState.pendingAutopilotSituation) {
      pacingState = dispatchPlayerAction(pacingState, {
        type: 'RESOLVE_AUTOPILOT',
        situationId: pacingState.pendingAutopilotSituation.id,
        optionId: pacingState.pendingAutopilotSituation.options[0].id,
      }).state;
    }
    pacingState = stepOneTick(pacingState, { allowPrompts: true });
  }
  for (let i = 1; i < t2EventsDays.length; i++) {
    assert.ok(
      t2EventsDays[i] - t2EventsDays[i - 1] >= DIRECTOR_CONFIG.t2CooldownDays,
      `T2 events fired too close together (${t2EventsDays[i - 1]} and ${t2EventsDays[i]})`
    );
  }
  for (let i = 1; i < t3EventsDays.length; i++) {
    assert.ok(
      t3EventsDays[i] - t3EventsDays[i - 1] >= DIRECTOR_CONFIG.t3CooldownDays,
      `T3 events fired too close together (${t3EventsDays[i - 1]} and ${t3EventsDays[i]})`
    );
  }
  console.log('✓ ผ่าน: Phase 3 Test 3 - Director Tension Budget & Cooldowns (T2/T3 ไม่เกิดติดกัน)');

  // Test 4: T3 forces gameSpeed = 1 and pauses, and closing/timing out Decision Window calls resolveAutopilotPromptDecision
  const stateAtFast = { ...createInitialGameState(reqDet), gameSpeed: 20 as const };
  const t3Storylet = STORYLET_CATALOG.find((s) => s.tier === 'T3')!;
  assert.ok(t3Storylet, 'Must find a T3 storylet in catalog');

  const firedRes = fireStorylet(stateAtFast, t3Storylet, true);
  assert.equal(firedRes.state.gameSpeed, 1, 'T3 event must force gameSpeed down to 1 (x1)');
  assert.equal(firedRes.state.needsPlayer, true, 'T3 event must pause and require player decision');
  assert.ok(firedRes.state.pendingPrompt !== null, 'T3 event must set pendingPrompt');

  assert.equal(firedRes.state.pendingPrompt?.deadlineDay, undefined, 'T3 event must have no deadlineDay');

  // Verify T2 Decision Window auto-resolves via resolveAutopilotPromptDecision once past deadline
  const t2Storylet = STORYLET_CATALOG.find((s) => s.tier === 'T2')!;
  assert.ok(t2Storylet, 'Must find a T2 storylet in catalog');
  const firedT2Res = fireStorylet(stateAtFast, t2Storylet, true);
  assert.ok(firedT2Res.state.pendingPrompt?.deadlineDay !== undefined, 'T2 event must have deadlineDay');

  const expiredState = {
    ...firedT2Res.state,
    date: {
      ...firedT2Res.state.date,
      totalDays: firedT2Res.state.pendingPrompt!.deadlineDay!,
    },
    needsPlayer: false,
  };
  const afterTimeout = stepOneTick(expiredState, { allowPrompts: true });
  assert.equal(afterTimeout.pendingPrompt, null, 'Expired T2 Decision Window must auto-resolve pendingPrompt');

  const directAutopilot = resolveAutopilotPromptDecision(firedRes.state);
  assert.equal(directAutopilot.pendingPrompt, null, 'Autopilot prompt decision must clear pendingPrompt');
  assert.equal(directAutopilot.needsPlayer, false, 'needsPlayer must be false after autopilot decision');
  console.log('✓ ผ่าน: Phase 3 Test 4 - T3 Forced x1 + Decision Window Timeout Autopilot');

  // Test 5: explain(state, 'event:...') returns short plain sentences + formula breakdown
  const explanation = explain(directAutopilot, `event:${t3Storylet.id}`);
  assert.ok(explanation.summaryBullets.length > 0, 'Explain must return short plain Thai summary sentences');
  assert.ok(explanation.formulaBreakdown.length > 0, 'Explain must return formula/factor breakdown');
  assert.equal(explanation.targetKey, `event:${t3Storylet.id}`);
  console.log('✓ ผ่าน: Phase 3 Test 5 - Explain Engine สำหรับเหตุการณ์');
}

function testPhase3CrossSystemPlausibilityAndHospitalLifecycle() {
  // 1. Age 2 toddler living at parents_home must NOT be eligible for shipped parcel or independent street T0s
  const toddlerBase = createInitialGameState({
    mode: 'at_age',
    seed: 202002,
    atAge: { targetAge: 2 },
  });
  const toddlerState = {
    ...toddlerBase,
    character: {
      ...toddlerBase.character,
      ageYears: 2,
      isMinor: true,
    },
    economy: {
      ...toddlerBase.economy,
      housingId: 'parents_home' as const,
      jobId: 'infant' as const,
    },
  };
  const parcelStorylet = STORYLET_CATALOG.find((s) => s.id === 't1_home_snack_parcel')!;
  const streetCatStorylet = STORYLET_CATALOG.find((s) => s.id === 't0_street_cat_pat')!;
  const toddlerBlocks = STORYLET_CATALOG.find((s) => s.id === 't0_toddler_block_tower')!;
  assert.equal(
    isStoryletEligible(parcelStorylet, toddlerState),
    false,
    'Age 2 toddler at parents_home must never receive t1_home_snack_parcel'
  );
  assert.equal(
    isStoryletEligible(streetCatStorylet, toddlerState),
    false,
    'Age 2 toddler must never trigger t0_street_cat_pat'
  );
  assert.equal(
    isStoryletEligible(toddlerBlocks, toddlerState),
    true,
    'Age 2 toddler should be eligible for age-appropriate t0_toddler_block_tower'
  );

  // 2. Hospital stay duration + automatic discharge back to normal scene
  const adultState = createInitialGameState({
    mode: 'at_age',
    seed: 991188,
    atAge: { targetAge: 28, education: 'bachelor', wealthFocus: 'average' },
  });
  const surgeryStorylet = STORYLET_CATALOG.find((s) => s.id === 't3_emergency_surgery_hospital')!;
  assert.ok(surgeryStorylet, 'Must find t3_emergency_surgery_hospital');
  const firedSurgery = fireStorylet(adultState, surgeryStorylet, true).state;
  assert.ok(firedSurgery.pendingPrompt, 'Surgery prompt must open');

  const chooseUniversal = dispatchPlayerAction(firedSurgery, {
    type: 'RESOLVE_PROMPT',
    promptId: firedSurgery.pendingPrompt!.id,
    choiceId: 'use_universal_health_gold',
  });
  assert.equal(chooseUniversal.accepted, true);
  let hospitalState = chooseUniversal.state;
  assert.equal(hospitalState.sceneMode?.sceneId, 'hospital', 'Choice must admit character into timed hospital sceneMode');
  assert.equal(getSceneModeRemainingDays(hospitalState), 5, 'Universal surgery must set 5-day hospital stay');
  assert.equal(resolveScene(hospitalState), 'hospital', 'Active scene must resolve to hospital while admitted');
  assert.equal(hospitalState.character.flags?.appendix_removed, true, 'Definitive surgery must set appendix_removed');

  for (let d = 0; d < 5; d++) {
    hospitalState = stepOneTick(hospitalState, { allowPrompts: false });
  }
  assert.equal(hospitalState.sceneMode, null, 'Hospital sceneMode must automatically clear after 5 recovery days');
  assert.notEqual(
    resolveScene(hospitalState),
    'hospital',
    'Once discharged with healthy indices, scene must return from hospital'
  );
  assert.ok(
    hospitalState.timeline.some((e) => e.title.includes('ออกจากโรงพยาบาลแล้ว')),
    'Discharge must record timeline entry'
  );

  // 3. Conservative non-surgical treatment sets chronic_appendix_risk and schedules relapse consequence
  const firedForConservative = fireStorylet(adultState, surgeryStorylet, true).state;
  const conservativeRes = dispatchPlayerAction(firedForConservative, {
    type: 'RESOLVE_PROMPT',
    promptId: firedForConservative.pendingPrompt!.id,
    choiceId: 'conservative_antibiotics_rest',
  });
  assert.equal(conservativeRes.accepted, true);
  let conservativeState = conservativeRes.state;
  assert.equal(getSceneModeRemainingDays(conservativeState), 2, 'Conservative treatment sets 2-day hospital observation');
  assert.equal(conservativeState.character.flags?.chronic_appendix_risk, true, 'Must set chronic_appendix_risk');
  assert.ok(
    conservativeState.directorState?.consequenceQueue?.some(
      (q) => q.storyletId === 't2_chronic_appendix_relapse'
    ),
    'Conservative choice must schedule t2_chronic_appendix_relapse'
  );

  // Advance through 2 hospital days -> discharged, then advance up to 75 days (allowing T2 cooldown deferral) -> relapse triggers
  let sawRelapse = false;
  for (let d = 0; d < 75; d++) {
    if (conservativeState.pendingPrompt?.storyletId === 't2_chronic_appendix_relapse') {
      sawRelapse = true;
      break;
    }
    if (conservativeState.pendingPrompt) {
      conservativeState = dispatchPlayerAction(conservativeState, {
        type: 'RESOLVE_PROMPT',
        promptId: conservativeState.pendingPrompt.id,
        choiceId: conservativeState.pendingPrompt.choices[0].id,
      }).state;
    }
    if (conservativeState.pendingAutopilotSituation) {
      conservativeState = dispatchPlayerAction(conservativeState, {
        type: 'RESOLVE_AUTOPILOT',
        situationId: conservativeState.pendingAutopilotSituation.id,
        optionId: conservativeState.pendingAutopilotSituation.options[0].id,
      }).state;
    }
    conservativeState = stepOneTick(conservativeState, { allowPrompts: true });
  }
  assert.equal(sawRelapse, true, 'Conservative non-surgical choice must trigger chronic relapse event later');

  // 4. Plain-Thai Explain check: no dev jargon or math jargon
  const finExplain = explain(adultState, 'index:financial');
  const evtExplain = explain(conservativeState, 'event:t2_chronic_appendix_relapse');
  const allFinText = [finExplain.titleTh, ...finExplain.summaryBullets, finExplain.causalStory ?? '', ...finExplain.formulaBreakdown.map((f) => `${f.label} ${f.value} ${f.impact}`)].join(' ');
  const allEvtText = [evtExplain.titleTh, ...evtExplain.summaryBullets, evtExplain.causalStory ?? '', ...evtExplain.formulaBreakdown.map((f) => `${f.label} ${f.value} ${f.impact}`)].join(' ');
  assert.equal(allFinText.includes('สเกลลอการิทึม'), false, 'Explain must not contain math jargon');
  assert.equal(allEvtText.includes('Event Director'), false, 'Explain must not expose Event Director jargon');
  assert.equal(allEvtText.includes('Tension Budget'), false, 'Explain must not expose Tension Budget jargon');

  console.log('✓ ผ่าน: Cross-System Plausibility, Hospital Discharge/Relapse & Plain-Thai Explain');
}

function testAppearanceAndStatGameplayImpact() {
  const base = createInitialGameState({
    mode: 'at_age',
    seed: 774422,
    atAge: { targetAge: 26, education: 'bachelor', wealthFocus: 'average' },
  });

  // Find a dyed_hair manifest entry and a formal office entry from manifest
  const allEntries = getAllManifestEntries();
  const dyedEntry = allEntries.find((e) => e.group !== 'baby' && e.group !== 'kid' && isDyedOrFancyHair(e));
  const officeEntry = allEntries.find((e) => e.group !== 'baby' && e.group !== 'kid' && e.tags.includes('office') && !isDyedOrFancyHair(e));
  assert.ok(dyedEntry, 'Must find a dyed hair sprite in characterManifest');
  assert.ok(officeEntry, 'Must find an office sprite in characterManifest');

  // 1. Dyed/flashy look lowers formal status & work rep, and blocks strict_formal civil_servant
  const dyedChar = {
    ...base.character,
    ageYears: 26,
    rawStats: { ...base.character.rawStats, reliability: 65, charisma: 68, looks: 72 },
    skills: { ...base.character.skills, academic: 35, sales: 35, socializing: 30 },
    indices: { ...base.character.indices, competence: 70 },
    flags: {},
    appearance: {
      charId: dyedEntry.id,
      stage: 'adult' as const,
      geneticHairColor: 'brown',
    },
  };
  const dyedImpact = evaluateAppearanceImpact(dyedChar);
  assert.equal(dyedImpact.hasDyedOrFlashyStyle, true);
  assert.equal(dyedImpact.blocksStrictFormalJobs, true);
  assert.ok(dyedImpact.formalCredibilityDelta < 0, 'Dyed hair must apply formal credibility debuff');

  const civilCheckBlocked = checkJobEligibility(dyedChar, 'civil_servant');
  assert.equal(civilCheckBlocked.allowed, false, 'civil_servant must reject loud dyed hair / flashy look');
  assert.ok(
    civilCheckBlocked.reasons.some((r) => r.includes('ปรับลุคให้สุภาพ')),
    'Job rejection reason must mention toning down look'
  );

  // Toned-down formal flag or formal office look lifts the block and removes debuff
  const officeChar = {
    ...dyedChar,
    appearance: { charId: officeEntry.id, stage: 'adult' as const },
  };
  const officeImpact = evaluateAppearanceImpact(officeChar);
  assert.ok(officeImpact.formalCredibilityDelta > 0, 'Formal office look must grant credibility bonus');
  assert.equal(checkJobEligibility(officeChar, 'civil_servant').allowed, true, 'Formal look passes civil_servant');

  // 2. Stat gates in JOBS: low charisma rejects sales_exec & sales_manager
  const lowCharisma = {
    ...officeChar,
    ageYears: 28,
    rawStats: { ...officeChar.rawStats, charisma: 32, looks: 30, reliability: 60 },
    skills: { ...officeChar.skills, sales: 50, socializing: 45 },
    indices: { ...officeChar.indices, competence: 72 },
  };
  const salesBlocked = checkJobEligibility(lowCharisma, 'sales_exec');
  assert.equal(salesBlocked.allowed, false, 'Low charisma/looks must block sales_exec');
  assert.ok(salesBlocked.reasons.some((r) => r.includes('เสน่ห์การพูด')), 'Must report charisma requirement');

  const salesManagerBlocked = checkJobEligibility(lowCharisma, 'sales_manager');
  assert.equal(salesManagerBlocked.allowed, false, 'Low charisma must block sales_manager');

  const highCharisma = {
    ...lowCharisma,
    rawStats: { ...lowCharisma.rawStats, charisma: 70, looks: 72 },
  };
  assert.equal(checkJobEligibility(highCharisma, 'sales_exec').allowed, true, 'High charisma passes sales_exec');
  assert.equal(checkJobEligibility(highCharisma, 'sales_manager').allowed, true, 'High charisma passes sales_manager');

  // 3. Appearance & stat storylets trigger + toning down via choice updates eligibility
  const scoutCharisma = STORYLET_CATALOG.find((s) => s.id === 't2_talent_scout_charisma')!;
  const scoutLooks = STORYLET_CATALOG.find((s) => s.id === 't2_model_scout_high_looks')!;
  const awkwardLow = STORYLET_CATALOG.find((s) => s.id === 't2_awkward_interview_low_charisma')!;
  const dyedFeedback = STORYLET_CATALOG.find((s) => s.id === 't2_dyed_hair_office_feedback')!;
  const dyedCompliment = STORYLET_CATALOG.find((s) => s.id === 't1_fashion_hair_compliment')!;
  assert.ok(scoutCharisma && scoutLooks && awkwardLow && dyedFeedback && dyedCompliment, 'All 5 appearance/charisma storylets must exist in validated catalog');

  const highState: GameState = { ...base, character: highCharisma };
  const lowState: GameState = { ...base, character: lowCharisma };
  const dyedState: GameState = { ...base, economy: { ...base.economy, cash: 5000 }, character: dyedChar };

  assert.equal(isStoryletEligible(scoutCharisma, highState), true, 'High charisma eligible for talent scout');
  assert.equal(isStoryletEligible(scoutCharisma, lowState), false, 'Low charisma NOT eligible for talent scout');
  assert.equal(isStoryletEligible(scoutLooks, highState), true, 'High looks eligible for model scout');
  assert.equal(isStoryletEligible(awkwardLow, lowState), true, 'Low charisma eligible for awkward interview card');
  assert.equal(isStoryletEligible(awkwardLow, highState), false, 'High charisma NOT eligible for awkward interview card');
  assert.equal(isStoryletEligible(dyedFeedback, dyedState), true, 'Dyed hair eligible for office look feedback');
  assert.equal(isStoryletEligible(dyedFeedback, highState), false, 'Formal office look NOT eligible for dyed hair feedback');

  // Resolving tone_down_formal_look unlocks civil_servant immediately
  const firedFeedback = fireStorylet(dyedState, dyedFeedback, true).state;
  const resolved = dispatchPlayerAction(firedFeedback, {
    type: 'RESOLVE_PROMPT',
    promptId: firedFeedback.pendingPrompt!.id,
    choiceId: 'tone_down_formal_look',
  });
  assert.equal(resolved.accepted, true);
  assert.equal(
    checkJobEligibility(resolved.state.character, 'civil_servant').allowed,
    true,
    'Toning down look in storylet must unlock strict_formal civil_servant'
  );

  // Explain engine describes dyed-hair / charisma cause in plain Thai
  const expDyed = explain(dyedState, 'event:t2_dyed_hair_office_feedback');
  assert.ok(
    expDyed.summaryBullets.some((b) => b.includes('สีผม') || b.includes('สไตล์')),
    'Explain must surface dyed hair/style cause'
  );

  console.log('✓ ผ่าน: Appearance, Style, Dyed Hair & Looks/Charisma Gates + Storylets');
}

function main() {
  console.log('กำลังรัน Unit Tests ของ Engine...');
  testDeterminismX1vsX20();
  console.log('✓ ผ่าน: Determinism (seed เดียวกัน x1 เทียบ x20 ได้ผลลัพธ์ตรงกัน 100%)');

  testEconomyCeilingsAndCosts();
  console.log('✓ ผ่าน: Economy Ceilings & Costs (วงเงินกู้และต้นทุนพลังงานทำงานถูกต้อง)');

  testLifeGenPlausibility1000();
  console.log('✓ ผ่าน: LifeGen Plausibility 1,000 ครั้ง (ไม่พบความขัดแย้ง กฎอายุ 25 เป็นดอกเตอร์ไม่ได้ผ่าน)');

  testMinorContentLock();
  console.log('✓ ผ่าน: isMinor Hard Rule (ล็อกทางเลือกผู้ใหญ่สำหรับตัวละครอายุ < 18)');

  testDeterministicReplay();
  console.log('✓ ผ่าน: Deterministic Replay (สร้าง state ซ้ำจาก seed + actionLog ได้ตรงกัน)');

  testBirthToAdult200Seeds();
  console.log('✓ ผ่าน: Birth-to-Adult 200 Seeds (เริ่มอายุ 0 จนถึง 18 เงินไม่ติดลบ หนี้ 0 ผ่านกฎความเป็นไปได้)');

  testAppearanceSystem();

  testSceneSystem();

  testGenderSeparatedNameBanks();

  testPhase2DeterminismMultiYear();
  testPhase2TraitFormationGatesAndTurningPoint();
  testPhase2TraitFourWayEffects();
  testPhase2LifeStagesAndSpec03Rules();
  testPhase2TimeAllocationAndNightDaypart();
  testPhase2AutopilotStandingOrdersAndDigest();
  testPhase3StoryletAndDirector();
  testPhase3CrossSystemPlausibilityAndHospitalLifecycle();
  testAppearanceAndStatGameplayImpact();

  console.log('\nสรุป: ผ่านครบทั้ง 22 ชุดทดสอบ!');
}

main();


