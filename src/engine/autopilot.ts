import {
  AUTOPILOT_SITUATION_TEMPLATES,
  DEFAULT_SELF_CARE_ORDERS,
  DEFAULT_STANDING_ORDERS,
  SELF_CARE_ORDER_CONFIG,
} from '../data/autopilot';
import { TRAITS_BY_ID } from '../data/traits';
import { generatePeriodDigestFromStates } from './digest';
import { appendTimeline, applyEffects, summarizeEffects } from './log';
import { nextRandom } from './rng';
import { getAutopilotTraitBiases } from './traitEffects';
import type {
  AutopilotOption,
  AutopilotSituation,
  Effect,
  GameState,
  Person,
  PeriodDigest,
  RiskProfile,
  SelfCareOrders,
  StandingActionKey,
  StandingConditionKey,
  StandingOrderRule,
  StandingOrders,
} from './types';

export function deriveRiskProfileFromTraits(person: Person): RiskProfile {
  const traitIds = new Set((person.emergentTraits ?? []).map((t) => t.id));
  if (traitIds.has('risk_taker') || traitIds.has('hot_tempered') || traitIds.has('street_smart')) {
    return 'bold';
  }
  if (traitIds.has('cautious_planner') || traitIds.has('strict_saver') || traitIds.has('self_doubting')) {
    return 'cautious';
  }
  if (person.background.temperament === 'calm' || person.background.temperament === 'anxious') {
    return 'cautious';
  }
  if (person.background.temperament === 'fiery') {
    return 'bold';
  }
  return 'balanced';
}

export function createDefaultStandingOrders(person: Person): StandingOrders {
  return {
    autopilotEnabled: DEFAULT_STANDING_ORDERS.autopilotEnabled,
    riskProfile: deriveRiskProfileFromTraits(person),
    financial: { ...DEFAULT_STANDING_ORDERS.financial },
    rules: DEFAULT_STANDING_ORDERS.rules.map((r) => ({ ...r })),
    selfCare: {
      ...DEFAULT_SELF_CARE_ORDERS,
      pausedByLowCash: {},
    },
  };
}

function normalizeConditionForRuleLookup(kind: StandingConditionKey | 'payday_temptation'): StandingConditionKey {
  if (kind === 'payday_temptation') return 'payday_surplus';
  return kind;
}

export interface StandingEvalResult {
  handled: boolean;
  chosenActionKey?: StandingActionKey;
  matchedRule?: StandingOrderRule;
  reasonTh: string;
}

export function evaluateStandingOrders(
  state: GameState,
  situation: AutopilotSituation
): StandingEvalResult {
  const orders = state.standingOrders ?? createDefaultStandingOrders(state.character);
  if (!orders.autopilotEnabled) {
    return {
      handled: false,
      reasonTh: 'ตั้งค่าให้หยุดถามคุณทุกครั้ง จึงรอให้คุณตัดสินใจด้วยตัวเอง',
    };
  }

  const lookupKind = normalizeConditionForRuleLookup(situation.kind);
  let matchingRule = orders.rules.find((r) => r.enabled && r.conditionKey === lookupKind);

  if (
    !matchingRule &&
    lookupKind === 'overtime_offer' &&
    state.economy.cash < orders.financial.lowCashThreshold
  ) {
    matchingRule = orders.rules.find((r) => r.enabled && r.conditionKey === 'low_cash');
  }

  if (!matchingRule) {
    return {
      handled: false,
      reasonTh: 'ยังไม่ได้ตั้งคำสั่งล่วงหน้าสำหรับเรื่องนี้ จึงหยุดถามคุณก่อนตัดสินใจ',
    };
  }

  if (matchingRule.actionKey === 'ask_player') {
    return {
      handled: false,
      matchedRule: matchingRule,
      reasonTh: `คำสั่งล่วงหน้า "${matchingRule.labelTh}" ตั้งค่าให้หยุดถามคุณก่อนเสมอ`,
    };
  }

  return {
    handled: true,
    chosenActionKey: matchingRule.actionKey,
    matchedRule: matchingRule,
    reasonTh: `ทำตามแนวทางที่ตั้งไว้: ${matchingRule.labelTh}`,
  };
}

export interface AutopilotDecisionResult {
  handled: boolean;
  chosenOption?: AutopilotOption;
  explainReasonTh: string;
  rngState: number;
}

/**
 * Deterministic Autopilot decision maker: evaluates Standing Orders + Traits (4-way bias) + Needs + Cash.
 * Returns handled: false when no active rule handles the situation (or rule says ask_player),
 * causing tick pipeline to pause with needsPlayer = true.
 */
export function autopilotDecide(
  state: GameState,
  situation: AutopilotSituation,
  seed?: number
): AutopilotDecisionResult {
  const validOptions = situation.options.filter(
    (opt) => !(state.character.isMinor && opt.requiresAdult)
  );
  if (validOptions.length === 0) {
    return {
      handled: false,
      explainReasonTh: 'ไม่มีตัวเลือกที่ผ่านเกณฑ์อายุในสถานการณ์นี้',
      rngState: state.rngState,
    };
  }

  const evalRes = evaluateStandingOrders(state, situation);
  if (!evalRes.handled) {
    return {
      handled: false,
      explainReasonTh: evalRes.reasonTh,
      rngState: state.rngState,
    };
  }

  const orders = state.standingOrders ?? createDefaultStandingOrders(state.character);
  const traitBiases = getAutopilotTraitBiases(state.character);
  const { character, economy } = state;

  // Hard financial Standing Order override: strictBudget always chooses disciplined saving on spending dilemmas
  if (
    orders.financial.strictBudget &&
    (situation.kind === 'payday_surplus' || (situation.kind as string) === 'payday_temptation')
  ) {
    const saveOpt = validOptions.find((o) => o.tags.includes('save') || o.tags.includes('disciplined'));
    if (saveOpt) {
      return {
        handled: true,
        chosenOption: saveOpt,
        explainReasonTh: 'ปฏิบัติตามนโยบาย Strict Budget: เลือกเก็บออมตามแผนและงดใช้จ่ายฟุ่มเฟือยอัตโนมัติ',
        rngState: state.rngState,
      };
    }
  }

  let bestOption = validOptions[0];
  let bestScore = -Infinity;
  const reasonsPerOption = new Map<string, string[]>();
  let currentRng = seed ?? state.rngState;

  for (const opt of validOptions) {
    let score = 0;
    const notes: string[] = [];
    const tags = new Set(opt.tags);

    // 1) Standing Order preference
    if (evalRes.chosenActionKey === 'save_reserve' || evalRes.chosenActionKey === 'decline_spend') {
      if (tags.has('save') || tags.has('disciplined') || tags.has('safe')) {
        score += 0.55;
        notes.push('ตรงกับกฎออมเงิน/คุมงบ');
      }
      if (tags.has('spend') || tags.has('impulse')) {
        score -= 0.4;
      }
    } else if (evalRes.chosenActionKey === 'take_side_gig') {
      if (tags.has('work') || tags.has('money')) {
        score += 0.6;
        notes.push('ตรงกับกฎรับงานเสริมเมื่อโอกาสเปิด');
      }
    } else if (evalRes.chosenActionKey === 'rest_priority') {
      if (tags.has('rest') || tags.has('safe')) {
        score += 0.7;
        notes.push('ตรงกับกฎเน้นพักผ่อน');
      }
    } else if (evalRes.chosenActionKey === 'accept_if_safe') {
      if (character.resources.energy >= 45 && economy.cash >= orders.financial.lowCashThreshold) {
        score += tags.has('safe') ? 0.25 : 0.45;
      } else if (tags.has('safe') || tags.has('rest')) {
        score += 0.7;
      }
    }

    // 2) Risk Profile
    if (orders.riskProfile === 'cautious') {
      if (tags.has('safe') || tags.has('save') || tags.has('rest')) score += 0.45;
      if (tags.has('risk') || tags.has('bold')) score -= 0.85;
    } else if (orders.riskProfile === 'bold') {
      if (tags.has('risk') || tags.has('bold') || tags.has('work')) score += 0.45;
    }

    // 3) 4-Way Trait Biases (Traits shape Autopilot decisions strongly)
    if (tags.has('spend') || tags.has('impulse')) {
      if (traitBiases.spendImpulse > 0) {
        score += traitBiases.spendImpulse * 1.9;
        notes.push('แรงผลักจากนิสัยใช้จ่ายตามอารมณ์/ใจป้ำ');
      } else if (traitBiases.spendImpulse < 0) {
        score += traitBiases.spendImpulse * 1.6;
      }
    }
    if (tags.has('save') || tags.has('disciplined')) {
      if (traitBiases.spendImpulse < 0) {
        score += Math.abs(traitBiases.spendImpulse) * 1.7;
        notes.push('นิสัยประหยัด/วางแผนหนุนการออม');
      }
    }
    if (tags.has('rest')) {
      if (traitBiases.restBias > 0) {
        score += traitBiases.restBias * 1.8;
        notes.push('นิสัยรักสบาย/ต้องการพักผ่อนหนุนให้เลือกพัก');
      } else if (traitBiases.restBias < 0) {
        score += traitBiases.restBias;
      }
    }
    if (tags.has('work')) {
      if (traitBiases.selfDevBias < 0) {
        score += traitBiases.selfDevBias * 1.6;
      } else if (traitBiases.selfDevBias > 0) {
        score += traitBiases.selfDevBias * 1.3;
        notes.push('วินัยและความขยันหนุนให้รับงานเพิ่ม');
      }
    }
    if (tags.has('social') || tags.has('night')) {
      if (traitBiases.socialBias > 0) {
        score += traitBiases.socialBias * 1.5;
        notes.push('นิสัยเข้าสังคม/ติดเพื่อนชวนตอบรับ');
      } else if (traitBiases.socialBias < 0) {
        score += traitBiases.socialBias * 1.4;
      }
    }
    if (tags.has('risk') || tags.has('bold')) {
      score += traitBiases.riskBias * 1.7;
    }

    // 4) Needs & Cash reality check
    if (character.resources.energy < 25) {
      if (tags.has('rest')) {
        score += 1.1;
        notes.push('พลังงานต่ำมากต้องพัก');
      }
      if (tags.has('work') || tags.has('night')) score -= 1.0;
    }
    if (orders.financial.avoidDebt && economy.cash < orders.financial.lowCashThreshold) {
      if (tags.has('spend') || tags.has('risk')) score -= 0.75;
      if (tags.has('work') || tags.has('save')) score += 0.5;
    }

    // Never push minors or avoidDebt players into negative cash on discretionary spending
    if (orders.financial.avoidDebt || character.isMinor) {
      let netCashImpact = 0;
      for (const eff of opt.effects) {
        if (eff.type === 'AddMoney') netCashImpact += eff.amount;
      }
      if (netCashImpact < 0 && economy.cash + netCashImpact < 0) {
        score -= 5.0;
      }
    }

    // Small deterministic tie-break
    const r = nextRandom(currentRng);
    currentRng = r.rngState;
    score += r.value * 0.04;

    reasonsPerOption.set(opt.id, notes);
    if (score > bestScore) {
      bestScore = score;
      bestOption = opt;
    }
  }

  const pickedNotes = reasonsPerOption.get(bestOption.id) ?? [];
  const explainReasonTh =
    pickedNotes.length > 0
      ? `ตัดสินใจเลือก "${bestOption.label}" เพราะ${pickedNotes.join(' และ ')}`
      : `ตัดสินใจเลือก "${bestOption.label}" ตามแนวทางที่ตั้งไว้ (${evalRes.reasonTh})`;

  return {
    handled: true,
    chosenOption: bestOption,
    explainReasonTh,
    rngState: currentRng,
  };
}

export function buildAutopilotSituation(
  kind: StandingConditionKey | 'payday_temptation',
  totalDay: number,
  isMinor: boolean
): AutopilotSituation | null {
  const normalizedKind = kind === 'payday_surplus' ? 'payday_temptation' : kind;
  const tpl =
    AUTOPILOT_SITUATION_TEMPLATES.find((t) => (t.kind as string) === normalizedKind || t.kind === kind) ??
    AUTOPILOT_SITUATION_TEMPLATES[0];
  if (!tpl) return null;

  const filteredOptions = tpl.options.filter((o) => !(isMinor && o.requiresAdult));
  if (filteredOptions.length === 0) return null;

  return {
    id: `ap_${tpl.kind}_${totalDay}`,
    kind: tpl.kind,
    title: tpl.title,
    description: tpl.description,
    options: filteredOptions,
  };
}

/**
 * Deterministically triggers periodic Autopilot situations on monthly checks (age 15+).
 */
export function maybeRollMonthlyAutopilotEvent(
  state: GameState
): { state: GameState; situation: AutopilotSituation | null } {
  if (!state.character.isAlive || state.character.ageYears < 15) {
    return { state, situation: null };
  }
  if (state.pendingPrompt || state.pendingAutopilotSituation) {
    return { state, situation: null };
  }

  const r = nextRandom(state.rngState);
  const next = { ...state, rngState: r.rngState };
  const orders = next.standingOrders ?? createDefaultStandingOrders(next.character);

  // Trigger low cash overtime check or periodic situation (~38% per month)
  if (next.economy.cash < orders.financial.lowCashThreshold && r.value < 0.55) {
    return {
      state: next,
      situation: buildAutopilotSituation('overtime_offer', next.date.totalDays, next.character.isMinor),
    };
  }

  if (r.value >= 0.36) {
    return { state: next, situation: null };
  }

  const pool: Array<StandingConditionKey | 'payday_temptation'> = next.character.isMinor
    ? ['payday_temptation', 'overtime_offer']
    : ['payday_temptation', 'overtime_offer', 'night_invite', 'risky_windfall'];

  const pickRoll = nextRandom(next.rngState);
  const chosenKind = pool[Math.floor(pickRoll.value * pool.length) % pool.length];
  return {
    state: { ...next, rngState: pickRoll.rngState },
    situation: buildAutopilotSituation(chosenKind, next.date.totalDays, next.character.isMinor),
  };
}

export function resolveAutopilotWithOption(
  state: GameState,
  situation: AutopilotSituation,
  option: AutopilotOption,
  explainReasonTh: string,
  recordLogs = true
): GameState {
  if (state.character.isMinor && option.requiresAdult) {
    return state;
  }

  let next: GameState = {
    ...state,
    pendingAutopilotSituation: null,
    needsPlayer: state.pendingPrompt !== null || !state.character.isAlive,
  };

  next = applyEffects(next, option.effects, recordLogs);
  if (recordLogs) {
    next = appendTimeline(next, {
      category: 'autopilot',
      title: `ตัดสินใจตามแนวทาง: ${option.label}`,
      description: `${situation.title} — ${explainReasonTh}`,
      effectsSummary: summarizeEffects(option.effects),
      explainReason: explainReasonTh,
    });
  }
  return next;
}

/**
 * Pure template-based Period Digest (Phase 2 & 3 Basic & Enhanced Digest — strictly zero AI).
 */
export function buildPeriodDigest(
  beforeState: GameState,
  afterState: GameState,
  meta: { turningPointsCount: number; autopilotActionsCount: number }
): PeriodDigest {
  return generatePeriodDigestFromStates(beforeState, afterState, meta);
}

function ensureSelfCareOrders(orders: StandingOrders): SelfCareOrders {
  return {
    ...DEFAULT_SELF_CARE_ORDERS,
    ...(orders.selfCare ?? {}),
    pausedByLowCash: { ...(orders.selfCare?.pausedByLowCash ?? {}) },
  };
}

function canAffordReserveSafe(state: GameState, fee: number, reserveFloor: number): boolean {
  if (fee <= 0) return true;
  if (state.economy.cash < fee) return false;
  return state.economy.cash - fee >= reserveFloor;
}

export function getHealthCheckupHazardMultiplier(state: GameState): number {
  if (state.character.ageYears < SELF_CARE_ORDER_CONFIG.healthCheckup.minAge) return 1.0;
  const pkg = state.standingOrders?.selfCare?.healthCheckupPackage ?? 'off';
  if (pkg === 'off') return 1.0;
  const wasPaused = Boolean(state.standingOrders?.selfCare?.pausedByLowCash?.healthCheckup);
  if (wasPaused) return 1.0;
  return SELF_CARE_ORDER_CONFIG.healthCheckup.packages[pkg].severeIllnessHazardMult;
}

/**
 * Annual Health Checkup Standing Order (executed on birthday / year roll when age >= 18).
 * Auto-pauses if cash after fee falls below lowCashThreshold, and auto-resumes when cash recovers.
 */
export function processAnnualHealthCheckupOnBirthday(
  state: GameState,
  recordLogs = true
): GameState {
  if (!state.character.isAlive) return state;
  const age = state.character.ageYears;
  if (age < SELF_CARE_ORDER_CONFIG.healthCheckup.minAge) return state;

  const baseOrders = state.standingOrders ?? createDefaultStandingOrders(state.character);
  const selfCare = ensureSelfCareOrders(baseOrders);
  if (selfCare.healthCheckupPackage === 'off') return state;
  if (selfCare.lastAnnualCheckupAge === age) return state;

  const pkgDef = SELF_CARE_ORDER_CONFIG.healthCheckup.packages[selfCare.healthCheckupPackage];
  const reserveFloor = baseOrders.financial.lowCashThreshold;

  if (!canAffordReserveSafe(state, pkgDef.fee, reserveFloor)) {
    const alreadyPaused = Boolean(selfCare.pausedByLowCash?.healthCheckup);
    let next: GameState = {
      ...state,
      standingOrders: {
        ...baseOrders,
        selfCare: {
          ...selfCare,
          pausedByLowCash: {
            ...selfCare.pausedByLowCash,
            healthCheckup: true,
          },
        },
      },
    };
    if (recordLogs && !alreadyPaused) {
      next = appendTimeline(next, {
        category: 'autopilot',
        title: `พักคำสั่งประจำ: ${pkgDef.labelTh}`,
        description: `เงินสดหลังหักค่าตรวจ (${pkgDef.fee.toLocaleString('th-TH')} บาท) จะต่ำกว่าเงินสำรองขั้นต่ำ จึงพักคำสั่งนี้ชั่วคราว`,
        explainReason: 'พักรายการดูแลตัวเองอัตโนมัติเพราะเงินสดสำรองไม่เพียงพอ',
      });
    }
    return next;
  }

  const wasPaused = Boolean(selfCare.pausedByLowCash?.healthCheckup);
  const effects: Effect[] = [
    {
      type: 'AddMoney',
      amount: -pkgDef.fee,
      category: 'living',
      reason: `คำสั่งประจำ: ${pkgDef.labelTh}`,
    },
    {
      type: 'AddFlag',
      flag:
        selfCare.healthCheckupPackage === 'private_3500'
          ? 'health_checkup_private'
          : 'health_checkup_basic',
      value: true,
      reason: 'ผ่านการตรวจสุขภาพประจำปี',
    },
  ];
  if (pkgDef.annualPhysicalBonus > 0) {
    // Physical index uses 0.32 * strength + 0.32 * endurance; +4.7 each adds ~+3.0 Physical
    effects.push(
      {
        type: 'ChangeRawStat',
        stat: 'endurance',
        delta: 4.7,
        reason: 'ดูแลร่างกายตามผลตรวจสุขภาพประจำปี',
      },
      {
        type: 'ChangeRawStat',
        stat: 'strength',
        delta: 4.7,
        reason: 'ฟื้นฟูสมรรถภาพกายตามคำแนะนำแพทย์',
      },
      {
        type: 'ChangeResource',
        resource: 'stress',
        delta: -3,
        reason: 'อุ่นใจหลังตรวจสุขภาพครบชุด',
      }
    );
  }

  let next = applyEffects(state, effects, recordLogs);
  next = {
    ...next,
    standingOrders: {
      ...baseOrders,
      selfCare: {
        ...selfCare,
        lastAnnualCheckupAge: age,
        pausedByLowCash: {
          ...selfCare.pausedByLowCash,
          healthCheckup: false,
        },
      },
    },
  };

  if (recordLogs) {
    next = appendTimeline(next, {
      category: 'autopilot',
      title: wasPaused
        ? `กลับมาทำงาน: ${pkgDef.labelTh}`
        : `คำสั่งประจำ: ${pkgDef.labelTh}`,
      description: `${pkgDef.labelTh} สำเร็จ (หัก ${pkgDef.fee.toLocaleString('th-TH')} บาท)${
        pkgDef.annualPhysicalBonus > 0 ? ' · สุขภาพกายดีขึ้น +3' : ''
      }`,
      effectsSummary: summarizeEffects(effects),
      explainReason: 'ดำเนินการตรวจสุขภาพประจำปีตามคำสั่งประจำที่ตั้งไว้',
    });
  }

  return next;
}

/**
 * Monthly Self-Care Standing Orders (grooming/hair maintenance + family remittance).
 * Auto-pauses when cash reserves dip below lowCashThreshold and auto-resumes upon recovery.
 */
export function processMonthlySelfCareAutopilot(
  state: GameState,
  recordLogs = true
): GameState {
  if (!state.character.isAlive) return state;

  let next = state;
  const age = next.character.ageYears;
  const baseOrders = next.standingOrders ?? createDefaultStandingOrders(next.character);
  let selfCare = ensureSelfCareOrders(baseOrders);
  const reserveFloor = baseOrders.financial.lowCashThreshold;

  // Also check if paused annual checkup can auto-resume later in the same year
  if (
    age >= SELF_CARE_ORDER_CONFIG.healthCheckup.minAge &&
    selfCare.healthCheckupPackage !== 'off' &&
    selfCare.pausedByLowCash?.healthCheckup &&
    selfCare.lastAnnualCheckupAge !== age
  ) {
    const pkgFee = SELF_CARE_ORDER_CONFIG.healthCheckup.packages[selfCare.healthCheckupPackage].fee;
    if (canAffordReserveSafe(next, pkgFee, reserveFloor)) {
      next = processAnnualHealthCheckupOnBirthday(next, recordLogs);
      selfCare = ensureSelfCareOrders(next.standingOrders ?? baseOrders);
    }
  }

  // 1. Monthly Grooming & Hair Color Maintenance (500 THB/mo, age 15+)
  if (age >= SELF_CARE_ORDER_CONFIG.groomingMonthly.minAge && selfCare.groomingMonthlyEnabled) {
    const fee = SELF_CARE_ORDER_CONFIG.groomingMonthly.fee;
    const wasPaused = Boolean(selfCare.pausedByLowCash?.grooming);
    if (!canAffordReserveSafe(next, fee, reserveFloor)) {
      selfCare = {
        ...selfCare,
        pausedByLowCash: { ...selfCare.pausedByLowCash, grooming: true },
      };
      next = {
        ...next,
        standingOrders: { ...(next.standingOrders ?? baseOrders), selfCare },
      };
      if (recordLogs && !wasPaused) {
        next = appendTimeline(next, {
          category: 'autopilot',
          title: 'พักคำสั่งประจำ: ดูแลบุคลิกและสีผมรายเดือน',
          description: 'เงินสดหลังหัก 500 บาท ต่ำกว่าเงินสำรองขั้นต่ำ จึงพักชั่วคราวจนกว่าเงินสดจะเพียงพอ',
          explainReason: 'พักรายการดูแลตัวเองอัตโนมัติเพราะเงินสดสำรองไม่พอ',
        });
      }
    } else {
      const effects: Effect[] = [
        { type: 'AddMoney', amount: -fee, category: 'living', reason: 'ค่าดูแลบุคลิกและสีผมประจำเดือน' },
        {
          type: 'ChangeRawStat',
          stat: 'looks',
          delta: SELF_CARE_ORDER_CONFIG.groomingMonthly.looksBonus,
          reason: 'ดูแลผิวพรรณและสีผมสม่ำเสมอ',
        },
        {
          type: 'ChangeRawStat',
          stat: 'charisma',
          delta: SELF_CARE_ORDER_CONFIG.groomingMonthly.charismaBonus,
          reason: 'บุคลิกภาพดูดีสม่ำเสมอ',
        },
        {
          type: 'ChangeRawStat',
          stat: 'reliability',
          delta: SELF_CARE_ORDER_CONFIG.groomingMonthly.reliabilityBonus,
          reason: 'แต่งกายเรียบร้อยน่าเชื่อถือ',
        },
      ];
      next = applyEffects(next, effects, recordLogs);
      selfCare = {
        ...selfCare,
        pausedByLowCash: { ...selfCare.pausedByLowCash, grooming: false },
      };
      next = {
        ...next,
        standingOrders: { ...(next.standingOrders ?? baseOrders), selfCare },
      };
      if (recordLogs && wasPaused) {
        next = appendTimeline(next, {
          category: 'autopilot',
          title: 'กลับมาทำงาน: ดูแลบุคลิกและสีผมรายเดือน',
          description: 'เงินสดสำรองเพียงพอแล้ว ระบบกลับมาดูแลบุคลิกภาพรายเดือนตามปกติ (-500 บาท)',
          explainReason: 'กลับมาทำงานอัตโนมัติเมื่อเงินสดฟื้นตัวเหนือเกณฑ์สำรอง',
        });
      }
    }
  }

  // 2. Monthly Family Remittance (5% or 15% of monthly salary/income, age 18+)
  if (
    age >= SELF_CARE_ORDER_CONFIG.familyRemittance.minAge &&
    selfCare.familyRemittanceMode !== 'off'
  ) {
    const rate = SELF_CARE_ORDER_CONFIG.familyRemittance.rates[selfCare.familyRemittanceMode];
    const baseIncome = Math.max(0, next.economy.monthlySalary + next.economy.monthlySideIncome);
    const amount = Math.round(baseIncome * rate);
    if (amount > 0) {
      const wasPaused = Boolean(selfCare.pausedByLowCash?.familyRemittance);
      if (!canAffordReserveSafe(next, amount, reserveFloor)) {
        selfCare = {
          ...selfCare,
          pausedByLowCash: { ...selfCare.pausedByLowCash, familyRemittance: true },
        };
        next = {
          ...next,
          standingOrders: { ...(next.standingOrders ?? baseOrders), selfCare },
        };
        if (recordLogs && !wasPaused) {
          next = appendTimeline(next, {
            category: 'autopilot',
            title: 'พักคำสั่งประจำ: ส่งเงินให้ครอบครัวรายเดือน',
            description: `เงินสดหลังหัก ${amount.toLocaleString('th-TH')} บาท ต่ำกว่าเงินสำรองขั้นต่ำ จึงพักชั่วคราว`,
            explainReason: 'พักการส่งเงินให้ครอบครัวอัตโนมัติเพื่อรักษาเงินสำรองฉุกเฉิน',
          });
        }
      } else {
        const famEv =
          selfCare.familyRemittanceMode === 'pct_15'
            ? SELF_CARE_ORDER_CONFIG.familyRemittance.familyEvidencePct15
            : SELF_CARE_ORDER_CONFIG.familyRemittance.familyEvidencePct5;
        const effects: Effect[] = [
          {
            type: 'AddMoney',
            amount: -amount,
            category: 'living',
            reason: 'ส่งเงินดูแลครอบครัวประจำเดือน',
          },
          {
            type: 'RecordEvidence',
            key: 'family_time',
            amount: famEv,
            reason: 'ส่งเงินจุนเจือครอบครัวสม่ำเสมอ',
          },
          {
            type: 'ChangeResource',
            resource: 'stress',
            delta: -1.5,
            reason: 'อิ่มใจที่ได้ดูแลครอบครัว',
          },
        ];
        next = applyEffects(next, effects, recordLogs);
        selfCare = {
          ...selfCare,
          pausedByLowCash: { ...selfCare.pausedByLowCash, familyRemittance: false },
        };
        next = {
          ...next,
          standingOrders: { ...(next.standingOrders ?? baseOrders), selfCare },
        };
        if (recordLogs) {
          next = appendTimeline(next, {
            category: 'autopilot',
            title: wasPaused
              ? 'กลับมาส่งเงินให้ครอบครัวรายเดือน'
              : 'ส่งเงินดูแลครอบครัวตามคำสั่งประจำ',
            description: `โอนเงินให้ครอบครัว ${amount.toLocaleString('th-TH')} บาท ครอบครัวซาบซึ้งในความใส่ใจ`,
            effectsSummary: summarizeEffects(effects),
            explainReason: 'โอนเงินช่วยเหลือครอบครัวอัตโนมัติตามคำสั่งประจำ',
          });
        }
      }
    }
  }

  return next;
}
