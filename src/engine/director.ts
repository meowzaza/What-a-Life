import { SELF_CARE_ORDER_CONFIG } from '../data/autopilot';
import { DIRECTOR_CONFIG } from '../data/storylets/directorConfig';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import { formatShortThaiDate } from './clock';
import { pushLifeHistory } from './education';
import { appendTimeline, applyEffects, summarizeEffects } from './log';
import { nextRandom, round2 } from './rng';
import { stampTalentSwapWindow } from './talents';
import {
  filterStoryletChoices,
  isStoryletEligible,
  isTwistPlausible,
  renderStoryletText,
  type StoryletDef,
} from './storylet';
import { getAutopilotTraitBiases, hazardModifiers } from './traitEffects';
import type {
  DirectorState,
  EventChoice,
  EventTier,
  GameSpeed,
  GameState,
  PendingEventPrompt,
  TimelineEntry,
} from './types';

export const T2_COOLDOWN_DAYS = DIRECTOR_CONFIG.t2CooldownDays;
export const T3_COOLDOWN_DAYS = DIRECTOR_CONFIG.t3CooldownDays;

const STORYLET_BY_ID = new Map(STORYLET_CATALOG.map((s) => [s.id, s]));
const CALENDAR_STORYLETS = STORYLET_CATALOG.filter(
  (s) => s.sourceHint === 'calendar' || Boolean(s.conditions?.onBirthday) || s.conditions?.calendarMonth !== undefined
);
const STAT_THRESHOLD_STORYLETS = STORYLET_CATALOG.filter((s) => s.sourceHint === 'stat_threshold');

// === Phase 4 / 5 / 7 Event Source Extension Stubs ===
export interface NpcEventProposal {
  npcId: string;
  storyletId: string;
  urgency: number;
  reasonTh: string;
}

export interface AiEventProposal {
  promptKey: string;
  tier: EventTier;
  suggestedTitle: string;
}

export interface WorldEventProposal {
  macroKey: string;
  storyletId: string;
  regionScope: string;
}

export function createInitialDirectorState(): DirectorState {
  return {
    lastT2Day: -999,
    lastT3Day: -999,
    lastCategoryDays: {},
    activeForeshadows: [],
    twistCount: 0,
    lastTwistDay: -999,
    seenStoryletIds: [],
    consequenceQueue: [],
    tensionBudget: DIRECTOR_CONFIG.tensionBudget.start,
  };
}

export interface DirectorStepResult {
  state: GameState;
  firedStorylet?: StoryletDef;
  tier?: EventTier;
}

/**
 * Pure UI helper enforcing the real-time Attention Budget & x20 speed filter.
 * Used ONLY by UI presentation layer — never called inside simulation tick RNG.
 */
export function shouldInterruptWithAttentionBudget(params: {
  lastInterruptMs: number | null;
  nowMs: number;
  speed: GameSpeed;
  tier: EventTier;
  importance?: number;
}): boolean {
  if (params.tier === 'T3') {
    return true;
  }
  if (params.tier === 'T2') {
    const importance = params.importance ?? 5;
    if (params.speed === 20 && importance < DIRECTOR_CONFIG.attentionBudget.x20InterruptMinT2Importance) {
      return false;
    }
    if (params.lastInterruptMs !== null) {
      const elapsedSec = (params.nowMs - params.lastInterruptMs) / 1000;
      if (elapsedSec < DIRECTOR_CONFIG.attentionBudget.minRealSecondsBetweenPrompts) {
        return false;
      }
    }
  }
  return true;
}

function mapCategoryToTimeline(category: PendingEventPrompt['category']): TimelineEntry['category'] {
  switch (category) {
    case 'work':
    case 'romance':
    case 'family':
    case 'health':
    case 'finance':
    case 'social':
    case 'quirky':
    case 'milestone':
    case 'system':
      return category;
    case 'economy':
      return 'finance';
    case 'twist':
      return 'milestone';
    case 'dilemma':
    default:
      return 'life';
  }
}

function canPassDirectorBudgetAndCooldowns(
  def: StoryletDef,
  state: GameState,
  directorState: DirectorState
): boolean {
  const totalDays = state.date.totalDays;
  const budget = directorState.tensionBudget ?? DIRECTOR_CONFIG.tensionBudget.start;

  // Minors < 15 only experience T0 / T1 background & flavor unless marked isMinorSafe
  if (state.character.ageYears < 15 && (def.tier === 'T2' || def.tier === 'T3') && !def.conditions?.isMinorSafe) {
    return false;
  }

  if (def.tier === 'T2') {
    if (totalDays - directorState.lastT2Day < DIRECTOR_CONFIG.t2CooldownDays) return false;
    if (budget < DIRECTOR_CONFIG.tensionBudget.minForT2) return false;
  }

  if (def.tier === 'T3') {
    if (totalDays - directorState.lastT3Day < DIRECTOR_CONFIG.t3CooldownDays) return false;
    if (budget < DIRECTOR_CONFIG.tensionBudget.minForT3) return false;
  }

  // Category diversity check for T1-T3
  if (def.tier !== 'T0') {
    const lastCatDay = directorState.lastCategoryDays[def.category] ?? -999;
    if (totalDays - lastCatDay < DIRECTOR_CONFIG.categoryCooldownDays) {
      return false;
    }
  }

  // Twist budget & plausibility gate
  if (def.isTwist) {
    if (directorState.twistCount >= DIRECTOR_CONFIG.twist.maxPerLife) return false;
    if (totalDays < DIRECTOR_CONFIG.twist.minNormalDaysBeforeFirstTwist) return false;
    if (totalDays - directorState.lastTwistDay < DIRECTOR_CONFIG.twist.minDaysBetweenTwists) return false;
    if (!isTwistPlausible(def, state).plausible) return false;
  }

  // While hospitalized in sceneMode, pause unrelated outside work/nightlife/flood events
  if (
    state.sceneMode?.sceneId === 'hospital' &&
    def.sourceHint !== 'consequence' &&
    def.category !== 'health' &&
    def.category !== 'family'
  ) {
    return false;
  }

  return isStoryletEligible(def, state);
}

function pickWeightedStorylet(
  candidates: StoryletDef[],
  state: GameState
): { chosen: StoryletDef; rngState: number } {
  const hazardMult = hazardModifiers(state).multiplier;
  const weights = candidates.map((s) => {
    const base = s.weight ?? 10;
    if (s.sourceHint === 'hazard' || s.category === 'health') {
      return Math.max(1, base * hazardMult);
    }
    return Math.max(1, base);
  });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  const roll = nextRandom(state.rngState);
  const target = roll.value * totalWeight;
  let running = 0;
  for (let i = 0; i < candidates.length; i++) {
    running += weights[i];
    if (running >= target) {
      return { chosen: candidates[i], rngState: roll.rngState };
    }
  }
  return { chosen: candidates[0], rngState: roll.rngState };
}

/**
 * Main Event Director tick handler.
 * Called at Step 8 of the fixed 11-step daily tick pipeline.
 * Pure deterministic state transition.
 */
export function stepEventDirector(
  state: GameState,
  allowPrompts: boolean = true
): DirectorStepResult {
  if (!state.character.isAlive) {
    return { state };
  }

  // Ensure directorState exists & recover tension budget daily
  const existingDir = state.directorState ?? createInitialDirectorState();
  let directorState: DirectorState = {
    ...existingDir,
    tensionBudget: Math.min(
      DIRECTOR_CONFIG.tensionBudget.max,
      round2((existingDir.tensionBudget ?? DIRECTOR_CONFIG.tensionBudget.start) + DIRECTOR_CONFIG.tensionBudget.dailyRecovery)
    ),
  };

  let workingState: GameState = {
    ...state,
    directorState,
  };

  // 1. Handle active pendingPrompt Decision Window (T2 only: 14-day default; T3 has NO deadline and NO automatic choice)
  if (workingState.pendingPrompt) {
    if (workingState.pendingPrompt.tier === 'T3') {
      return { state: workingState };
    }
    const deadline =
      workingState.pendingPrompt.deadlineDay ??
      workingState.date.totalDays + DIRECTOR_CONFIG.defaultDecisionWindowDays;
    if (workingState.date.totalDays >= deadline) {
      workingState = resolveAutopilotPromptDecision(
        workingState,
        'หมดเวลาตัดสินใจ ระบบจึงช่วยเลือกทางเดินที่เข้ากับนิสัยของคุณให้แทน'
      );
      return { state: workingState };
    } else {
      return { state: workingState };
    }
  }

  // 2. Expire active T0/T1 toast past its display window
  if (workingState.activeToast && workingState.date.totalDays > workingState.activeToast.expiresAtTotalDay) {
    workingState = {
      ...workingState,
      activeToast: null,
    };
  }

  let candidateStorylet: StoryletDef | undefined;
  let sourceReason = 'เกิดตามจังหวะชีวิตและสภาพแวดล้อมของตัวละครในตอนนี้';
  let skipForeshadow = false;

  // === Source 4: Consequence / Foreshadow Queue (highest priority) ===
  if (directorState.consequenceQueue && directorState.consequenceQueue.length > 0) {
    const dueIdx = directorState.consequenceQueue.findIndex((item) => {
      if (item.dueTotalDay > workingState.date.totalDays) return false;
      const def = STORYLET_BY_ID.get(item.storyletId);
      if (!def) return true;
      if (item.originId === 'foreshadow') return true;
      if (
        def.tier === 'T2' &&
        workingState.date.totalDays - directorState.lastT2Day < DIRECTOR_CONFIG.t2CooldownDays
      ) {
        return false;
      }
      if (
        def.tier === 'T3' &&
        workingState.date.totalDays - directorState.lastT3Day < DIRECTOR_CONFIG.t3CooldownDays
      ) {
        return false;
      }
      return true;
    });
    if (dueIdx >= 0) {
      const dueItem = directorState.consequenceQueue[dueIdx];
      const updatedQueue = [...directorState.consequenceQueue];
      updatedQueue.splice(dueIdx, 1);
      directorState = {
        ...directorState,
        consequenceQueue: updatedQueue,
      };
      workingState = { ...workingState, directorState };

      const storylet = STORYLET_BY_ID.get(dueItem.storyletId);
      if (storylet && isStoryletEligible(storylet, workingState, { ignoreCooldown: true })) {
        candidateStorylet = storylet;
        skipForeshadow = dueItem.originId === 'foreshadow';
        sourceReason =
          dueItem.originId === 'foreshadow'
            ? `ก่อนหน้านี้เคยมีสัญญาณเตือนมาก่อนแล้ว (${storylet.foreshadowTitle ?? 'ลางบอกเหตุ'}) จนเกิดเหตุจริงในวันนี้`
            : 'เป็นผลต่อเนื่องจากทางเลือกและเหตุการณ์ที่คุณเคยตัดสินใจไว้ก่อนหน้า';
      }
    }
  }

  // === Source 1: Calendar / Life Stage Triggers ===
  if (!candidateStorylet) {
    const calendarCandidates = CALENDAR_STORYLETS.filter((s) =>
      canPassDirectorBudgetAndCooldowns(s, workingState, directorState)
    );
    if (calendarCandidates.length > 0) {
      const picked = pickWeightedStorylet(calendarCandidates, workingState);
      candidateStorylet = picked.chosen;
      workingState = { ...workingState, rngState: picked.rngState };
      sourceReason = 'เกิดขึ้นตรงกับเทศกาลหรือจังหวะสำคัญของช่วงวัยในเวลานี้';
    }
  }

  // === Source 2: Stat Threshold Triggers ===
  if (!candidateStorylet) {
    const { character, economy } = workingState;
    const thresholdTriggered =
      character.resources.stress >= DIRECTOR_CONFIG.statThresholds.highStress ||
      character.resources.energy <= DIRECTOR_CONFIG.statThresholds.lowEnergy ||
      (character.ageYears >= 18 && economy.cash <= DIRECTOR_CONFIG.statThresholds.lowCashAdult);

    if (thresholdTriggered) {
      const thresholdCandidates = STAT_THRESHOLD_STORYLETS.filter((s) =>
        canPassDirectorBudgetAndCooldowns(s, workingState, directorState)
      );
      if (thresholdCandidates.length > 0) {
        const picked = pickWeightedStorylet(thresholdCandidates, workingState);
        candidateStorylet = picked.chosen;
        workingState = { ...workingState, rngState: picked.rngState };
        if (character.resources.stress >= DIRECTOR_CONFIG.statThresholds.highStress) {
          sourceReason = `ความเครียดสะสมพุ่งสูงถึง ${Math.round(character.resources.stress)}/100 ร่างกายและอารมณ์จึงส่งสัญญาณเตือน`;
        } else if (character.ageYears >= 18 && economy.cash <= DIRECTOR_CONFIG.statThresholds.lowCashAdult) {
          sourceReason = `เงินสดในกระเป๋าเหลือเพียง ${economy.cash.toLocaleString('th-TH')} บาท ทำให้เกิดแรงกดดันทางการเงิน`;
        } else {
          sourceReason = `พลังงานร่อยหรอเหลือ ${Math.round(character.resources.energy)}/100 จนส่งผลต่อการใช้ชีวิต`;
        }
      }
    }
  }

  // === Source 3: General + Hazard-Weighted Pool on Cadence Days (Day 1 & Day 15) ===
  if (!candidateStorylet && DIRECTOR_CONFIG.cadenceDaysOfMonth.includes(workingState.date.day)) {
    const eligible = STORYLET_CATALOG.filter((s) =>
      canPassDirectorBudgetAndCooldowns(s, workingState, directorState)
    );
    if (eligible.length > 0) {
      const picked = pickWeightedStorylet(eligible, workingState);
      candidateStorylet = picked.chosen;
      workingState = { ...workingState, rngState: picked.rngState };
      if (candidateStorylet.isTwist) {
        sourceReason = `จุดหักมุมนี้มีที่มา: ${isTwistPlausible(candidateStorylet, workingState).reasonTh}`;
      } else if (candidateStorylet.sourceHint === 'hazard' || candidateStorylet.category === 'health') {
        const hazReport = hazardModifiers(workingState);
        sourceReason =
          hazReport.reasons.length > 0
            ? `วิถีชีวิตและนิสัยของคุณช่วงนี้ (${hazReport.reasons.join(', ')}) ทำให้มีโอกาสเจอเหตุการณ์ด้านสุขภาพหรือความเสี่ยงสูงขึ้น`
            : 'เกิดเหตุการณ์ด้านสุขภาพหรือความเสี่ยงเฉพาะหน้าตามจังหวะชีวิต';
      } else {
        sourceReason = `สอดคล้องกับช่วงวัย (${workingState.character.ageYears} ปี) บทบาท และการใช้ชีวิตของคุณในตอนนี้`;
      }
    }
  }

  if (!candidateStorylet) {
    return { state: workingState };
  }

  // === Foreshadowing Check for Negative non-sudden T3 Crises ===
  const activeForeshadows = directorState.activeForeshadows ?? [];
  const needsForeshadow =
    !skipForeshadow &&
    candidateStorylet.tier === 'T3' &&
    Boolean(candidateStorylet.isNegative) &&
    !candidateStorylet.isSuddenHazard &&
    !activeForeshadows.includes(candidateStorylet.id);

  if (needsForeshadow) {
    const signalTitle = candidateStorylet.foreshadowTitle ?? 'เริ่มมีสัญญาณบางอย่างผิดปกติ';
    const signalBody =
      candidateStorylet.foreshadowHint ??
      'ช่วงนี้มีลางบอกเหตุเล็กๆ เกี่ยวกับเรื่องที่อาจบานปลายในอีกไม่กี่สัปดาห์ข้างหน้า';

    const checkupPkg =
      workingState.character.ageYears >= 18
        ? (workingState.standingOrders?.selfCare?.healthCheckupPackage ?? 'off')
        : 'off';
    const leadDays =
      candidateStorylet.category === 'health'
        ? SELF_CARE_ORDER_CONFIG.healthCheckup.packages[checkupPkg].foreshadowLeadDays
        : DIRECTOR_CONFIG.foreshadowLeadDays;

    const nextDir: DirectorState = {
      ...directorState,
      activeForeshadows: [...activeForeshadows, candidateStorylet.id],
      consequenceQueue: [
        ...(directorState.consequenceQueue ?? []),
        {
          storyletId: candidateStorylet.id,
          dueTotalDay: workingState.date.totalDays + leadDays,
          originId: 'foreshadow',
        },
      ],
    };

    let foreshadowState: GameState = {
      ...workingState,
      directorState: nextDir,
      activeToast: {
        id: `foreshadow_${candidateStorylet.id}_${workingState.date.totalDays}`,
        title: signalTitle,
        description: signalBody,
        tier: 'T1',
        category: candidateStorylet.category,
        expiresAtTotalDay: workingState.date.totalDays + 7,
        storyletId: candidateStorylet.id,
        explainReason: `ลางบอกเหตุก่อนเกิดเหตุการณ์ใหญ่ (${candidateStorylet.title})`,
      },
    };

    foreshadowState = appendTimeline(foreshadowState, {
      category: mapCategoryToTimeline(candidateStorylet.category),
      tier: 'T1',
      title: `ลางบอกเหตุ: ${signalTitle}`,
      description: signalBody,
      explainReason: `มีสัญญาณเตือนล่วงหน้า ${leadDays} วัน ก่อนเสี่ยงเกิดเหตุ "${candidateStorylet.title}"`,
      storyletId: candidateStorylet.id,
    });

    return { state: foreshadowState, tier: 'T1' };
  }

  return fireStorylet(workingState, candidateStorylet, allowPrompts, {
    sourceReason,
  });
}

/**
 * Fires a storylet and transitions GameState according to its EventTier (T0, T1, T2, T3).
 */
export function fireStorylet(
  state: GameState,
  storylet: StoryletDef,
  allowPrompts: boolean = true,
  options?: { bypassRules?: boolean; sourceReason?: string }
): DirectorStepResult {
  const prevDir = state.directorState ?? createInitialDirectorState();
  let directorState: DirectorState = {
    ...prevDir,
    seenStoryletIds: [...prevDir.seenStoryletIds, storylet.id],
    activeForeshadows: prevDir.activeForeshadows.filter((id) => id !== storylet.id),
    lastCategoryDays: {
      ...prevDir.lastCategoryDays,
      [storylet.category]: state.date.totalDays,
    },
  };

  if (storylet.consequenceStoryletId) {
    const delayMonths = storylet.consequenceDelayMonths ?? 3;
    const dueTotalDay = state.date.totalDays + delayMonths * 30;
    directorState = {
      ...directorState,
      consequenceQueue: [
        ...(directorState.consequenceQueue ?? []),
        {
          storyletId: storylet.consequenceStoryletId,
          dueTotalDay,
          originId: storylet.id,
        },
      ],
    };
  }

  const updatedFlags = { ...(state.character.flags ?? {}) };
  if (storylet.isOneOff) {
    updatedFlags[`storylet_done:${storylet.id}`] = true;
  }
  updatedFlags[`storylet_used_year_${state.date.yearCE}:${storylet.id}`] = true;
  updatedFlags[`storylet_last_year:${storylet.id}`] = true;

  let workingState: GameState = {
    ...state,
    character: {
      ...state.character,
      flags: updatedFlags,
    },
    directorState,
  };

  const renderedText = renderStoryletText(storylet.bodyTemplate, workingState);
  const explainReason =
    options?.sourceReason ?? 'เกิดจากจังหวะชีวิตและเงื่อนไขของคุณในช่วงเวลานี้';

  // === T0: Silent background timeline entry ===
  if (storylet.tier === 'T0') {
    workingState = appendTimeline(workingState, {
      category: mapCategoryToTimeline(storylet.category),
      tier: 'T0',
      title: storylet.title,
      description: renderedText,
      explainReason,
      storyletId: storylet.id,
    });
    return { state: workingState, firedStorylet: storylet, tier: 'T0' };
  }

  // === T1: Non-blocking toast + instant effect ===
  if (storylet.tier === 'T1') {
    const defaultChoice = storylet.choices?.[0];
    let effectsSummary: string[] = [];

    if (defaultChoice && defaultChoice.effects.length > 0) {
      effectsSummary = summarizeEffects(defaultChoice.effects);
      workingState = applyEffects(workingState, defaultChoice.effects, true);
    }

    workingState = {
      ...workingState,
      activeToast: {
        id: `toast_${storylet.id}_${workingState.date.totalDays}`,
        title: storylet.title,
        description: renderedText,
        tier: 'T1',
        category: storylet.category,
        expiresAtTotalDay: workingState.date.totalDays + 7,
        storyletId: storylet.id,
        explainReason,
      },
    };

    workingState = appendTimeline(workingState, {
      category: mapCategoryToTimeline(storylet.category),
      tier: 'T1',
      title: storylet.title,
      description: renderedText,
      effectsSummary,
      explainReason,
      storyletId: storylet.id,
    });

    return { state: workingState, firedStorylet: storylet, tier: 'T1' };
  }

  // === Filter choices for T2 and T3 (hides trait-blocked choices & surfaces reasons in Explain) ===
  const { visibleChoices, hiddenChoiceReasons } = filterStoryletChoices(
    storylet.choices ?? [],
    workingState
  );

  // Fallback safety: if every single choice was hidden by traits, expose first non-adult choice disabled
  const finalChoices: EventChoice[] =
    visibleChoices.length > 0
      ? visibleChoices
      : (storylet.choices ?? [])
          .filter((c) => !(workingState.character.isMinor && c.requiresAdult))
          .slice(0, 1)
          .map((c) => ({
            id: c.id,
            label: c.label,
            hint: c.description,
            effects: c.effects,
            costCash: c.costCash,
            twistChance: c.twistChance,
            twistEffects: c.twistEffects,
            twistSummary: c.twistSummary,
          }));

  const isT3 = storylet.tier === 'T3';
  const deadlineDays = isT3 ? undefined : (storylet.deadlineDays ?? DIRECTOR_CONFIG.defaultDecisionWindowDays);
  const prompt: PendingEventPrompt = {
    id: `prompt_${storylet.id}_${workingState.date.totalDays}`,
    title: storylet.title,
    category: storylet.category,
    tier: storylet.tier,
    description: renderedText,
    choices: finalChoices,
    isAdultContent: storylet.isAdultContent,
    sceneId: storylet.sceneId,
    sceneTag: storylet.sceneTag,
    daypart: storylet.daypart,
    deadlineDay: isT3 ? undefined : workingState.date.totalDays + deadlineDays!,
    importance: storylet.importance ?? (isT3 ? 10 : 5),
    isTwist: storylet.isTwist,
    directorReason: explainReason,
    hiddenBlockedReasons: hiddenChoiceReasons.length > 0 ? hiddenChoiceReasons : undefined,
    storyletId: storylet.id,
  };

  // === T2: Interactive Decision ===
  if (storylet.tier === 'T2') {
    const nextBudget = options?.bypassRules
      ? (directorState.tensionBudget ?? DIRECTOR_CONFIG.tensionBudget.start)
      : Math.max(0, (directorState.tensionBudget ?? DIRECTOR_CONFIG.tensionBudget.start) - DIRECTOR_CONFIG.tensionBudget.t2Cost);

    directorState = {
      ...directorState,
      lastT2Day: workingState.date.totalDays,
      tensionBudget: nextBudget,
      ...(storylet.isTwist
        ? {
            twistCount: directorState.twistCount + 1,
            lastTwistDay: workingState.date.totalDays,
          }
        : {}),
    };
    workingState = {
      ...workingState,
      directorState,
      pendingPrompt: prompt,
    };

    if (!allowPrompts) {
      workingState = resolveAutopilotPromptDecision(
        workingState,
        'ระหว่างเดินเวลาเร็ว ระบบช่วยเลือกทางที่เหมาะกับนิสัยของตัวละครให้แทน'
      );
      return { state: workingState, firedStorylet: storylet, tier: 'T2' };
    }

    workingState = {
      ...workingState,
      needsPlayer: true,
    };
    return { state: workingState, firedStorylet: storylet, tier: 'T2' };
  }

  // === T3: Crisis / Turning Point ===
  // CRITICAL: T3 ALWAYS forces speed to 1 (x1) and pauses!
  const nextBudget = options?.bypassRules
    ? (directorState.tensionBudget ?? DIRECTOR_CONFIG.tensionBudget.start)
    : Math.max(0, (directorState.tensionBudget ?? DIRECTOR_CONFIG.tensionBudget.start) - DIRECTOR_CONFIG.tensionBudget.t3Cost);

  directorState = {
    ...directorState,
    lastT3Day: workingState.date.totalDays,
    tensionBudget: nextBudget,
    ...(storylet.isTwist
      ? {
          twistCount: directorState.twistCount + 1,
          lastTwistDay: workingState.date.totalDays,
        }
      : {}),
  };

  workingState = {
    ...workingState,
    directorState,
    gameSpeed: 1,
    pendingPrompt: prompt,
  };

  if (!allowPrompts) {
    workingState = resolveAutopilotPromptDecision(
      workingState,
      'โหมดจำลองอัตโนมัติ (Headless) เลือกทางรับมือเหตุการณ์ใหญ่ให้แทน'
    );
    return { state: workingState, firedStorylet: storylet, tier: 'T3' };
  }

  workingState = {
    ...workingState,
    needsPlayer: true,
  };

  return { state: workingState, firedStorylet: storylet, tier: 'T3' };
}

/**
 * Resolves an active PendingEventPrompt by executing a player's chosen choice.
 * Handles twist probability deterministically via seeded RNG.
 */
export function resolveStoryletChoice(
  state: GameState,
  choiceId: string,
  options?: { isAutopilot?: boolean; autopilotReason?: string; allowDisabledFallback?: boolean }
): GameState {
  const prompt = state.pendingPrompt;
  if (!prompt) return state;

  const choice = prompt.choices.find((c) => c.id === choiceId);
  if (!choice || (choice.disabled && !options?.allowDisabledFallback)) {
    return state;
  }

  let workingState = { ...state };
  let rng = workingState.rngState;
  let isTwisted = false;
  let activeEffects = choice.effects;
  let summaryText = choice.label;

  if (choice.twistChance && choice.twistChance > 0 && choice.twistEffects && choice.twistEffects.length > 0) {
    const step = nextRandom(rng);
    rng = step.rngState;
    workingState = { ...workingState, rngState: rng };

    if (step.value < choice.twistChance) {
      isTwisted = true;
      activeEffects = choice.twistEffects;
      summaryText = choice.twistSummary ?? `เกิดเรื่องพลิกผันไม่คาดคิด: ${choice.label}`;

      const dirState = workingState.directorState ?? createInitialDirectorState();
      workingState = {
        ...workingState,
        directorState: {
          ...dirState,
          twistCount: dirState.twistCount + 1,
          lastTwistDay: workingState.date.totalDays,
        },
      };
    }
  }

  if (!isTwisted && choice.costCash && choice.costCash > 0 && workingState.character.ageYears >= 15) {
    workingState = {
      ...workingState,
      economy: {
        ...workingState.economy,
        cash: Math.max(0, workingState.economy.cash - choice.costCash),
      },
    };
  }

  const effectsSummary = summarizeEffects(activeEffects);
  workingState = applyEffects(workingState, activeEffects, true);

  // Check if any StartScene effect was included so SceneStage reflects it with duration
  let nextSceneMode = workingState.sceneMode ?? null;
  for (const eff of activeEffects) {
    if (eff.type === 'StartScene') {
      const durationDays = Math.max(1, eff.durationDays ?? (eff.sceneId === 'hospital' ? 3 : 1));
      nextSceneMode = {
        sceneId: eff.sceneId,
        daypart: eff.daypart,
        reason: eff.reason,
        startedAtTotalDay: workingState.date.totalDays,
        expiresAtTotalDay: workingState.date.totalDays + durationDays,
        returnSummary: eff.returnSummary,
      };
    }
  }

  // Queue any choice-specific follow-up consequence storylet (e.g., chronic relapse)
  const storyletDef = prompt.storyletId
    ? STORYLET_CATALOG.find((s) => s.id === prompt.storyletId)
    : undefined;
  const rawChoiceDef = storyletDef?.choices?.find((c) => c.id === choiceId);
  if (rawChoiceDef?.consequenceStoryletId) {
    const dirState = workingState.directorState ?? createInitialDirectorState();
    const delayDays = Math.max(7, rawChoiceDef.consequenceDelayDays ?? 35);
    workingState = {
      ...workingState,
      directorState: {
        ...dirState,
        consequenceQueue: [
          ...(dirState.consequenceQueue ?? []),
          {
            storyletId: rawChoiceDef.consequenceStoryletId,
            dueTotalDay: workingState.date.totalDays + delayDays,
            originId: storyletDef?.id ?? prompt.id,
          },
        ],
      },
    };
  }

  const entryCategory: TimelineEntry['category'] = options?.isAutopilot
    ? 'autopilot'
    : mapCategoryToTimeline(prompt.category);

  const entryTitle = isTwisted
    ? `[จุดหักมุม] ${prompt.title}`
    : options?.isAutopilot
      ? `เลือกอัตโนมัติ: ${prompt.title} -> ${choice.label}`
      : `${prompt.title} -> ${choice.label}`;

  workingState = appendTimeline(workingState, {
    category: entryCategory,
    tier: prompt.tier,
    title: entryTitle,
    description: options?.isAutopilot
      ? `${options.autopilotReason ?? 'ระบบช่วยตัดสินใจให้แทน'} (${summaryText})`
      : summaryText,
    effectsSummary,
    explainReason: options?.isAutopilot
      ? `${options.autopilotReason ?? ''}${prompt.directorReason ? ` · ${prompt.directorReason}` : ''}`.trim()
      : prompt.directorReason,
    storyletId: prompt.storyletId,
  });

  if (prompt.tier === 'T3') {
    workingState = stampTalentSwapWindow(
      workingState,
      `t3_${prompt.storyletId ?? 'prompt'}_${workingState.date.totalDays}`
    );
    workingState = pushLifeHistory(workingState, {
      id: `t3_${prompt.storyletId ?? 'prompt'}_${workingState.date.totalDays}`,
      kind: 'turning_point',
      titleTh: prompt.title,
      detailTh: choice.label,
    });
  }

  workingState = {
    ...workingState,
    pendingPrompt: null,
    sceneMode: nextSceneMode,
    needsPlayer: workingState.pendingAutopilotSituation !== null || !workingState.character.isAlive,
  };

  return workingState;
}

/**
 * Autopilot prompt resolver: invoked when a T2/T3 decision window expires (14 days)
 * or when a T2 card is deferred/filtered by Attention Budget.
 * Deterministically picks the best available choice using traits + standing orders.
 */
export function resolveAutopilotPromptDecision(
  state: GameState,
  reasonNote?: string
): GameState {
  const prompt = state.pendingPrompt;
  if (!prompt || !prompt.choices || prompt.choices.length === 0) {
    return {
      ...state,
      pendingPrompt: null,
      needsPlayer: state.pendingAutopilotSituation !== null || !state.character.isAlive,
    };
  }

  const availableChoices = prompt.choices.filter(
    (c) => !c.disabled && !(state.character.isMinor && c.requiresAdult)
  );
  const choicesToConsider =
    availableChoices.length > 0
      ? availableChoices
      : prompt.choices.filter((c) => !(state.character.isMinor && c.requiresAdult));

  if (choicesToConsider.length === 0) {
    return {
      ...state,
      pendingPrompt: null,
      needsPlayer: state.pendingAutopilotSituation !== null || !state.character.isAlive,
    };
  }

  const biases = getAutopilotTraitBiases(state.character);
  const orders = state.standingOrders;
  const avoidDebt = Boolean(orders?.financial.avoidDebt) || state.character.isMinor;
  const lowCash = state.economy.cash < (orders?.financial.lowCashThreshold ?? 5000);

  let bestChoice = choicesToConsider[0];
  let bestScore = -999;
  let pickedReason = 'เลือกทางเลือกมาตรฐานที่สมดุล';

  for (const ch of choicesToConsider) {
    let score = 0;
    const notes: string[] = [];
    const cost = ch.costCash ?? 0;

    if (avoidDebt && lowCash && cost > 0) {
      score -= 3;
    }
    if (biases.spendImpulse < -0.2 && cost === 0) {
      score += 1.5;
      notes.push('นิสัยประหยัด');
    } else if (biases.spendImpulse > 0.3 && cost > 0 && state.economy.cash >= cost * 2) {
      score += 0.8;
      notes.push('กล้าใช้จ่ายเพื่อความสะดวก');
    }

    if (biases.riskBias > 0.25 && (ch.twistChance ?? 0) > 0) {
      score += 1.8;
      notes.push('ชอบความท้าทายและลองเสี่ยง');
    } else if (biases.riskBias < -0.2 && !(ch.twistChance ?? 0)) {
      score += 1.0;
      notes.push('เน้นปลอดภัยไว้ก่อน');
    }

    for (const eff of ch.effects) {
      if (eff.type === 'ChangeResource') {
        if (eff.resource === 'energy' && eff.delta > 0 && (biases.restBias > 0.2 || state.character.resources.energy < 25)) {
          score += 1.6;
          notes.push('ฟื้นฟูพลังงาน');
        }
        if (eff.resource === 'stress' && eff.delta < 0 && state.character.resources.stress > 65) {
          score += 1.4;
          notes.push('ลดความเครียดสะสม');
        }
      }
      if ((eff.type === 'ChangeMoney' || eff.type === 'AddMoney') && eff.amount < 0 && avoidDebt && state.economy.cash + eff.amount < 0) {
        score -= 4;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestChoice = ch;
      if (notes.length > 0) {
        pickedReason = notes.join(' และ ');
      }
    }
  }

  const finalReason = reasonNote
    ? `${reasonNote} (ระบบเลือกให้เพราะสอดคล้องกับ${pickedReason})`
    : `ระบบช่วยเลือก "${bestChoice.label}" ให้แทนเพราะสอดคล้องกับ${pickedReason}`;

  const nextState = resolveStoryletChoice(state, bestChoice.id, {
    isAutopilot: true,
    autopilotReason: finalReason,
    allowDisabledFallback: availableChoices.length === 0,
  });

  return {
    ...nextState,
    date: {
      ...nextState.date,
    },
  };
}
