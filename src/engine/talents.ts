import {
  ALL_TALENT_AND_LIMITATION_DEFS,
  CENTRAL_MODIFIER_CAP,
  LIMITATION_DEFS,
  POSITIVE_TALENT_DEFS,
  TALENT_COUNT_WEIGHTS,
  TALENT_DEFS_BY_ID,
  TALENT_DISCOVERY_THRESHOLD_REDUCTION,
  TALENT_MAX_ACTIVE_SLOTS,
  TALENT_REVEAL_COOLDOWN_MONTHS,
  TALENT_TIER_BONUSES,
  TALENT_TIER_LABELS_TH,
  TALENT_TIER_SPAWN_WEIGHTS,
  TALENT_VAULT_MAX_SLOTS,
} from '../data/talents';
import { UI_TEXT } from '../data/uiText';
import { pushLifeHistory } from './education';
import { appendTimeline } from './log';
import { clamp, nextRandom, weightedPick } from './rng';
import type {
  FamilyWealthTier,
  GameState,
  Person,
  SkillKey,
  Talent,
  TalentTier,
} from './types';

/**
 * Pure deterministic bonus calculation with central modifier ceiling (+40% max).
 * Phase 3.3.1: Talents give +10%/+20%/+30% per tier; future Charms/Titles add into the same ceiling.
 */
export function computeCombinedModifierWithCap(
  talentBonus: number,
  charmBonus = 0,
  titleBonus = 0
): number {
  const raw = Math.max(0, talentBonus) + Math.max(0, charmBonus) + Math.max(0, titleBonus);
  return Math.min(CENTRAL_MODIFIER_CAP, raw);
}

export function getActiveTalents(person: Pick<Person, 'talents'>): Talent[] {
  return (person.talents ?? []).filter((t) => t.revealed).slice(0, TALENT_MAX_ACTIVE_SLOTS);
}

export function getActiveLimitations(person: Pick<Person, 'limitations'>): Talent[] {
  return (person.limitations ?? []).filter((l) => l.curedAtAge === undefined);
}

export function computeTalentSkillBonus(person: Pick<Person, 'talents'>, skillId: SkillKey): number {
  let bonus = 0;
  for (const tal of getActiveTalents(person)) {
    const def = TALENT_DEFS_BY_ID.get(tal.id);
    if (!def || def.isLimitation) continue;
    const tierBonus = TALENT_TIER_BONUSES[tal.tier] ?? 0.1;
    if (def.isGenius) {
      bonus += tierBonus;
    } else if (def.targetSkills?.includes(skillId)) {
      bonus += tierBonus;
    }
  }
  return computeCombinedModifierWithCap(bonus, 0, 0);
}

export function computeLimitationSkillPenaltyMultiplier(
  person: Pick<Person, 'limitations'>,
  skillId: SkillKey
): number {
  let mult = 1;
  for (const lim of getActiveLimitations(person)) {
    const def = TALENT_DEFS_BY_ID.get(lim.id);
    if (!def) continue;
    const appliesGlobal =
      lim.id === 'lim_slow_learner' || lim.id === 'lim_procrastinate';
    const appliesTarget = def.targetSkills?.includes(skillId) ?? false;
    if (appliesGlobal || appliesTarget) {
      const penalty = def.limitationPenaltyPct ?? 0.12;
      mult *= 1 - penalty;
    }
  }
  return clamp(mult, 0.55, 1);
}

export function computeCombinedSkillMultiplier(
  person: Pick<Person, 'talents' | 'limitations'>,
  skillId: SkillKey,
  charmBonus = 0,
  titleBonus = 0
): number {
  const talentBonus = computeTalentSkillBonus(person, skillId);
  const cappedPositiveBonus = computeCombinedModifierWithCap(talentBonus, charmBonus, titleBonus);
  const limitationMult = computeLimitationSkillPenaltyMultiplier(person, skillId);
  return (1 + cappedPositiveBonus) * limitationMult;
}

export function getDiscoveryThresholdReduction(
  person: Pick<Person, 'talents'> & { talentVault?: Talent[] },
  skillId: SkillKey
): number {
  let reduction = 0;
  const allTalents = [...(person.talents ?? []), ...(person.talentVault ?? [])];
  for (const tal of allTalents) {
    const def = TALENT_DEFS_BY_ID.get(tal.id);
    if (!def || def.isLimitation) continue;
    if (def.targetSkills?.includes(skillId)) {
      reduction = Math.max(reduction, TALENT_DISCOVERY_THRESHOLD_REDUCTION[tal.tier] ?? 0.25);
    } else if (def.isGenius) {
      reduction = Math.max(reduction, TALENT_DISCOVERY_THRESHOLD_REDUCTION[tal.tier] ?? 0.25);
    }
  }
  return clamp(reduction, 0, 0.7);
}

export function getFirstImpressionBonus(person: Pick<Person, 'talents'>): number {
  let bonus = 0;
  for (const tal of getActiveTalents(person)) {
    if (tal.id === 'tal_face_blessed') {
      const def = TALENT_DEFS_BY_ID.get(tal.id);
      if (def?.firstImpressionBonusByTier) {
        bonus += def.firstImpressionBonusByTier[tal.tier] ?? 0.15;
      }
    }
  }
  return computeCombinedModifierWithCap(bonus, 0, 0);
}

export function computeTalentGpaDelta(person: Pick<Person, 'talents' | 'limitations'>): number {
  let delta = 0;
  for (const tal of getActiveTalents(person)) {
    const def = TALENT_DEFS_BY_ID.get(tal.id);
    if (def?.gpaDeltaByTier) {
      delta += def.gpaDeltaByTier[tal.tier] ?? 0;
    }
  }
  for (const lim of getActiveLimitations(person)) {
    const def = TALENT_DEFS_BY_ID.get(lim.id);
    if (def?.gpaDeltaByTier) {
      delta += def.gpaDeltaByTier[lim.tier] ?? 0;
    }
  }
  return clamp(delta, -0.75, 0.65);
}

export function getTalentHintText(talent: Talent, variantIndex = 0): string {
  const def = TALENT_DEFS_BY_ID.get(talent.id);
  if (!def || def.hintsTh.length === 0) {
    return 'ดูเหมือนจะมีความถนัดบางอย่างซ่อนอยู่';
  }
  return def.hintsTh[Math.abs(variantIndex) % def.hintsTh.length];
}

export function rollInitialTalentsAndLimitations(
  rngState: number,
  wealth: FamilyWealthTier,
  geneticHealth: number,
  startingAge: number
): { rngState: number; talents: Talent[]; limitations: Talent[] } {
  let rng = rngState;
  const countPicked = weightedPick(
    rng,
    TALENT_COUNT_WEIGHTS.map((w) => ({ count: w.count, weight: w.weight }))
  );
  rng = countPicked.rngState;
  const targetCount = countPicked.value.count;

  const chosenIds = new Set<string>();
  const talents: Talent[] = [];

  for (let i = 0; i < targetCount; i++) {
    const availDefs = POSITIVE_TALENT_DEFS.filter((d) => !chosenIds.has(d.id));
    if (availDefs.length === 0) break;
    const defRoll = nextRandom(rng);
    rng = defRoll.rngState;
    const def = availDefs[Math.floor(defRoll.value * availDefs.length)];
    chosenIds.add(def.id);

    const tierRoll = weightedPick(
      rng,
      TALENT_TIER_SPAWN_WEIGHTS.map((w) => ({ tier: w.tier, weight: w.weight }))
    );
    rng = tierRoll.rngState;
    const tier = tierRoll.value.tier;

    // Small chance to be revealed at birth/early childhood
    const revealRoll = nextRandom(rng);
    rng = revealRoll.rngState;
    const isRevealedAtBirth = startingAge >= 6 ? revealRoll.value < 0.25 : false;

    talents.push({
      id: def.id,
      kind: def.kind,
      tier,
      revealed: isRevealedAtBirth,
      acquiredAtAge: 0,
      source: 'birth',
    });
  }

  // 1-2 starting limitations based on geneticHealth and wealth
  const limitations: Talent[] = [];
  const limCountRoll = nextRandom(rng);
  rng = limCountRoll.rngState;
  const limTargetCount = geneticHealth < 40 || wealth === 'destitute' ? (limCountRoll.value < 0.5 ? 2 : 1) : 1;

  const limChosenIds = new Set<string>();
  for (let i = 0; i < limTargetCount; i++) {
    const availLim = LIMITATION_DEFS.filter((d) => !limChosenIds.has(d.id));
    if (availLim.length === 0) break;
    const pickRoll = nextRandom(rng);
    rng = pickRoll.rngState;
    const limDef = availLim[Math.floor(pickRoll.value * availLim.length)];
    limChosenIds.add(limDef.id);

    const revRoll = nextRandom(rng);
    rng = revRoll.rngState;
    limitations.push({
      id: limDef.id,
      kind: 'limitation',
      tier: 1,
      revealed: startingAge >= 10 || revRoll.value < 0.5,
      acquiredAtAge: 0,
      source: 'birth',
      fixableBy: limDef.fixableBy ? [...limDef.fixableBy] : ['hard_study'],
    });
  }

  return { rngState: rng, talents, limitations };
}

export function getRevealStageBucket(ageYears: number, jobId: string): string {
  if (ageYears < 12) return 'child';
  if (ageYears < 15) return 'lower_sec';
  if (ageYears < 18) return 'upper_sec';
  if (ageYears >= 18 && jobId === 'student') return 'uni';
  return 'work';
}

export function stampTalentSwapWindow(state: GameState, tag: string): GameState {
  if (!tag) return state;
  return {
    ...state,
    character: {
      ...state.character,
      talentSwapWindowTag: tag,
    },
  };
}

export function canSwapTalentSlots(state: GameState): { allowed: boolean; reasonTh?: string } {
  const char = state.character;
  const tag = char.talentSwapWindowTag;
  if (!tag || tag === char.lastTalentSwapWindowTag) {
    return {
      allowed: false,
      reasonTh: UI_TEXT.PHASE331.talentsSwapLockedNotice,
    };
  }
  const activeRevealed = (char.talents ?? []).filter((t) => t.revealed);
  const vault = char.talentVault ?? [];
  if (activeRevealed.length === 0 || vault.length === 0) {
    return {
      allowed: false,
      reasonTh: 'ต้องมีทั้งพรสวรรค์ในช่องใช้งานและในคลังสำรองจึงจะสลับได้',
    };
  }
  return { allowed: true };
}

export function applySwapTalentSlot(
  state: GameState,
  activeIdx: number,
  vaultIdx: number
): { accepted: boolean; state: GameState; message: string } {
  const check = canSwapTalentSlots(state);
  if (!check.allowed) {
    return { accepted: false, state, message: check.reasonTh ?? 'ยังไม่สามารถสลับช่องพรสวรรค์ได้' };
  }
  const char = state.character;
  const talents = [...(char.talents ?? [])];
  const vault = [...(char.talentVault ?? [])];

  if (activeIdx < 0 || activeIdx >= talents.length) {
    return { accepted: false, state, message: 'ไม่พบช่องใช้งานที่เลือก' };
  }
  if (vaultIdx < 0 || vaultIdx >= vault.length) {
    return { accepted: false, state, message: 'ไม่พบพรสวรรค์ในคลังสำรองที่เลือก' };
  }

  const fromActive = talents[activeIdx];
  const fromVault = vault[vaultIdx];

  talents[activeIdx] = fromVault;
  vault[vaultIdx] = fromActive;

  const fromDef = TALENT_DEFS_BY_ID.get(fromActive.id);
  const toDef = TALENT_DEFS_BY_ID.get(fromVault.id);

  let next: GameState = {
    ...state,
    character: {
      ...char,
      talents,
      talentVault: vault,
      lastTalentSwapWindowTag: char.talentSwapWindowTag,
    },
  };

  next = appendTimeline(next, {
    category: 'life',
    tier: 'T1',
    title: 'สลับช่องใช้งานพรสวรรค์',
    description: `สลับเอา "${toDef?.nameTh ?? fromVault.id}" เข้าช่องใช้งานแทน "${fromDef?.nameTh ?? fromActive.id}"`,
  });

  next = pushLifeHistory(next, {
    id: `talent_swap_${state.date.totalDays}`,
    kind: 'talent_reveal',
    titleTh: `สลับพรสวรรค์: ${toDef?.nameTh ?? fromVault.id}`,
    detailTh: `เปิดใช้งาน ${toDef?.nameTh ?? fromVault.id} เก็บ ${fromDef?.nameTh ?? fromActive.id} เข้าคลังสำรอง`,
  });

  return {
    accepted: true,
    state: next,
    message: `สลับนำ "${toDef?.nameTh ?? fromVault.id}" เข้าช่องใช้งานแล้ว`,
  };
}

export function revealTalentById(
  state: GameState,
  talentId?: string,
  matchingSkillId?: SkillKey,
  options?: { bypassCooldown?: boolean }
): { state: GameState; revealedTalent?: Talent; blockedByCooldown?: boolean } {
  const currentAgeMonths = state.character.ageYears * 12 + state.date.month;
  const stageBucket = getRevealStageBucket(state.character.ageYears, state.economy.jobId);

  // Cooldown check (36 months and change of life stage bucket)
  if (!options?.bypassCooldown) {
    const lastMonths = state.character.lastTalentRevealAgeMonths ?? -999;
    const lastStage = state.character.lastTalentRevealLifeStage;
    if (currentAgeMonths - lastMonths < TALENT_REVEAL_COOLDOWN_MONTHS || stageBucket === lastStage) {
      return { state, blockedByCooldown: true };
    }
  }

  const existing = [...(state.character.talents ?? [])];
  const vault = [...(state.character.talentVault ?? [])];

  // Find candidate unrevealed talent in existing or vault
  let inVault = false;
  let idx = -1;
  if (talentId) {
    idx = existing.findIndex((t) => t.id === talentId && !t.revealed);
    if (idx < 0) {
      idx = vault.findIndex((t) => t.id === talentId && !t.revealed);
      if (idx >= 0) inVault = true;
    }
  }
  if (idx < 0 && matchingSkillId) {
    idx = existing.findIndex((t) => {
      if (t.revealed) return false;
      const def = TALENT_DEFS_BY_ID.get(t.id);
      return Boolean(def?.targetSkills?.includes(matchingSkillId) || def?.isGenius);
    });
    if (idx < 0) {
      idx = vault.findIndex((t) => {
        if (t.revealed) return false;
        const def = TALENT_DEFS_BY_ID.get(t.id);
        return Boolean(def?.targetSkills?.includes(matchingSkillId) || def?.isGenius);
      });
      if (idx >= 0) inVault = true;
    }
  }
  if (idx < 0) {
    idx = existing.findIndex((t) => !t.revealed);
    if (idx < 0) {
      idx = vault.findIndex((t) => !t.revealed);
      if (idx >= 0) inVault = true;
    }
  }
  if (idx < 0) {
    return { state };
  }

  const candidate = inVault ? vault[idx] : existing[idx];
  const updated: Talent = { ...candidate, revealed: true };

  // Place into active or vault based on 3-active limit
  const activeRevealedCount = existing.filter((t) => t.revealed).length;
  if (inVault) {
    vault.splice(idx, 1);
    if (activeRevealedCount < TALENT_MAX_ACTIVE_SLOTS) {
      existing.push(updated);
    } else {
      vault.push(updated);
    }
  } else {
    if (activeRevealedCount < TALENT_MAX_ACTIVE_SLOTS) {
      existing[idx] = updated;
    } else {
      existing.splice(idx, 1);
      vault.push(updated);
    }
  }

  const def = TALENT_DEFS_BY_ID.get(updated.id);
  const name = def?.nameTh ?? 'พรสวรรค์เฉพาะตัว';
  const tierLabel = TALENT_TIER_LABELS_TH[updated.tier];

  let next: GameState = {
    ...state,
    character: {
      ...state.character,
      talents: existing,
      talentVault: vault.slice(0, TALENT_VAULT_MAX_SLOTS),
      lastTalentRevealAgeMonths: currentAgeMonths,
      lastTalentRevealLifeStage: stageBucket,
    },
    activeToast: {
      id: `toast_talent_${updated.id}_${state.date.totalDays}`,
      title: UI_TEXT.PHASE331.talentRevealedToastTitle,
      description: UI_TEXT.PHASE331.talentRevealedToastDesc(name, tierLabel),
      tier: 'T1',
      category: 'milestone',
      expiresAtTotalDay: state.date.totalDays + 14,
      explainReason: def?.effectDescTh,
    },
  };

  next = appendTimeline(next, {
    category: 'life',
    tier: 'T1',
    title: UI_TEXT.PHASE331.talentRevealedToastTitle,
    description: `${UI_TEXT.PHASE331.talentRevealedToastDesc(name, tierLabel)} — ${def?.effectDescTh ?? ''}`,
  });

  next = pushLifeHistory(next, {
    id: `talent_reveal_${updated.id}_${state.date.totalDays}`,
    kind: 'talent_reveal',
    titleTh: `ค้นพบพรสวรรค์: ${name}`,
    detailTh: `${name} (${tierLabel})`,
  });

  return { state: next, revealedTalent: updated };
}

export function advanceLimitationCureProgress(
  state: GameState,
  weeklyContext: {
    selfDevHours: number;
    sleepHours: number;
    socialHours: number;
    workoutHours: number;
    craftOrCookPracticeHours: number;
    restHours: number;
    hasActiveCourse: boolean;
  }
): GameState {
  const activeLimitations = getActiveLimitations(state.character);
  if (activeLimitations.length === 0) return state;

  const progressMap: Record<string, { sessions: number; weeks: number }> = {
    ...(state.skillTraining?.limitationProgress ?? {}),
  };
  const updatedLimitations = [...(state.character.limitations ?? [])];
  const curedNames: string[] = [];

  for (let i = 0; i < updatedLimitations.length; i++) {
    const lim = updatedLimitations[i];
    if (lim.curedAtAge !== undefined) continue;
    const def = TALENT_DEFS_BY_ID.get(lim.id);
    if (!def?.cureTarget) continue;

    let metThisWeek = false;
    let sessionGain = 0;

    switch (lim.id) {
      case 'lim_slow_learner':
        if (weeklyContext.selfDevHours >= 6 || weeklyContext.hasActiveCourse) {
          metThisWeek = true;
          sessionGain = weeklyContext.hasActiveCourse ? 2 : 1;
        }
        break;
      case 'lim_short_memory':
        if (weeklyContext.sleepHours >= 64 && weeklyContext.selfDevHours >= 4) {
          metThisWeek = true;
          sessionGain = 1;
        }
        break;
      case 'lim_stage_fright':
      case 'lim_shy':
        if (weeklyContext.socialHours >= 8) {
          metThisWeek = true;
          sessionGain = 1;
        }
        break;
      case 'lim_procrastinate':
        if (weeklyContext.selfDevHours >= 5) {
          metThisWeek = true;
          sessionGain = 2;
        }
        break;
      case 'lim_clumsy':
        if (weeklyContext.workoutHours >= 4 || weeklyContext.craftOrCookPracticeHours >= 4) {
          metThisWeek = true;
          sessionGain = 1;
        }
        break;
      case 'lim_short_temper':
      case 'lim_burnout_prone':
        if (weeklyContext.sleepHours >= 60 && weeklyContext.restHours >= 10) {
          metThisWeek = true;
          sessionGain = 1;
        }
        break;
    }

    if (!metThisWeek) continue;

    const prev = progressMap[lim.id] ?? { sessions: 0, weeks: 0 };
    const nextProg = {
      sessions: prev.sessions + sessionGain,
      weeks: prev.weeks + 1,
    };
    progressMap[lim.id] = nextProg;

    const reqWeeks = def.cureTarget.weeks ?? 8;
    const reqSessions = def.cureTarget.sessions ?? 10;
    if (nextProg.weeks >= reqWeeks && nextProg.sessions >= reqSessions) {
      updatedLimitations[i] = {
        ...lim,
        revealed: true,
        curedAtAge: state.character.ageYears,
      };
      curedNames.push(def.nameTh);
    }
  }

  let next: GameState = {
    ...state,
    character: {
      ...state.character,
      limitations: updatedLimitations,
    },
    skillTraining: state.skillTraining
      ? {
          ...state.skillTraining,
          limitationProgress: progressMap,
        }
      : state.skillTraining,
  };

  for (const name of curedNames) {
    next = {
      ...next,
      activeToast: {
        id: `toast_lim_cured_${state.date.totalDays}_${name}`,
        title: UI_TEXT.PHASE331.limitationsCuredToastTitle,
        description: UI_TEXT.PHASE331.limitationsCuredToastDesc(name),
        tier: 'T1',
        category: 'milestone',
        expiresAtTotalDay: state.date.totalDays + 14,
      },
    };
    next = appendTimeline(next, {
      category: 'life',
      tier: 'T1',
      title: UI_TEXT.PHASE331.limitationsCuredToastTitle,
      description: UI_TEXT.PHASE331.limitationsCuredToastDesc(name),
    });
  }

  return next;
}

export function getAllKnownTalentDefsCount(): number {
  return ALL_TALENT_AND_LIMITATION_DEFS.length;
}
