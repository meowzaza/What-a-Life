import { ANNUAL_FOCUS_BY_ID } from '../data/annualFocus';
import { TRAITS_BY_ID } from '../data/traits';
import { ALL_SKILL_KEYS } from './skillTraining';
import type { AnnualFocusId, EventTier, GameState, PeriodDigest } from './types';

export interface PeriodFacts {
  daysElapsed: number;
  cashDelta: number;
  incomeTotal: number;
  expenseTotal: number;
  debtDelta: number;
  newTraits: string[];
  events: Array<{ title: string; tier?: EventTier; category: string }>;
  autopilotDecisions: number;
  turningPoints: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  relationshipTrend: 'improving' | 'stable' | 'declining';
}

/**
 * Enhanced structured period digest generator.
 * Pure deterministic template engine (Phase 3 — strictly zero AI).
 */
export function buildEnhancedDigest(facts: PeriodFacts, afterState: GameState): PeriodDigest {
  const approxMonths = Math.max(1, Math.round(facts.daysElapsed / 30));
  const periodLabel = facts.daysElapsed >= 330 ? '1 ปีที่ผ่านมา' : `${approxMonths} เดือนที่ผ่านมา`;

  const summaryLines: string[] = [];

  // 1. Overview summary
  summaryLines.push(
    `สรุปช่วง ${periodLabel}: มีเหตุการณ์เกิดขึ้น ${facts.events.length} เรื่อง, Autopilot ช่วยตัดสินใจ ${facts.autopilotDecisions} ครั้ง`
  );

  // 2. Financial breakdown
  const cashDeltaStr = `${facts.cashDelta >= 0 ? '+' : ''}${facts.cashDelta.toLocaleString('th-TH')} บาท`;
  summaryLines.push(
    `การเงิน: เงินสดสุทธิเปลี่ยนแปลง ${cashDeltaStr} (คงเหลือ ${afterState.economy.cash.toLocaleString('th-TH')} บาท)`
  );

  // 3. Trait & personal growth
  if (facts.newTraits.length > 0) {
    summaryLines.push(`นิสัยและการเติบโต: ก่อตัวนิสัยใหม่ ${facts.newTraits.length} ด้าน (${facts.newTraits.join(', ')})`);
  } else {
    summaryLines.push(`นิสัยและการเติบโต: ค่านิสัยยังคงที่ ไม่มีนิสัยใหม่ปรากฏ`);
  }

  // 4. Turning points / major crises
  if (facts.turningPoints > 0) {
    summaryLines.push(`จุดเปลี่ยนสำคัญ: เผชิญจุดเปลี่ยนชีวิต ${facts.turningPoints} เหตุการณ์`);
  }

  // 5. Wellness & social trends
  const healthLabel =
    facts.healthTrend === 'improving' ? 'มีทิศทางดีขึ้น' : facts.healthTrend === 'declining' ? 'ทรุดโทรมลง' : 'ทรงตัว';
  const relLabel =
    facts.relationshipTrend === 'improving' ? 'อบอุ่นแน่นแฟ้นขึ้น' : facts.relationshipTrend === 'declining' ? 'ตึงเครียดขึ้น' : 'ราบเรียบ';
  summaryLines.push(`สุขภาวะและความสัมพันธ์: สุขภาพกายใจ${healthLabel}, ความสัมพันธ์${relLabel}`);

  return {
    title: `สรุปภาพรวมชีวิต (${periodLabel})`,
    daysElapsed: facts.daysElapsed,
    summaryLines,
    newTraits: facts.newTraits,
    turningPointsCount: facts.turningPoints,
    autopilotActionsCount: facts.autopilotDecisions,
    cashDelta: facts.cashDelta,
  };
}

/**
 * Extracts structured facts between beforeState and afterState and builds the PeriodDigest.
 */
export function generatePeriodDigestFromStates(
  beforeState: GameState,
  afterState: GameState,
  meta?: { turningPointsCount?: number; autopilotActionsCount?: number }
): PeriodDigest {
  const daysElapsed = Math.max(0, afterState.date.totalDays - beforeState.date.totalDays);

  const beforeIds = new Set((beforeState.character.emergentTraits ?? []).map((t) => t.id));
  const newTraits: string[] = [];
  for (const inst of afterState.character.emergentTraits ?? []) {
    if (!beforeIds.has(inst.id)) {
      if (inst.visibility === 'hidden_to_self') {
        newTraits.push('แนวโน้มแฝงใหม่');
      } else {
        newTraits.push(TRAITS_BY_ID.get(inst.id)?.nameTh ?? inst.id);
      }
    }
  }

  const recentWindowLogs = afterState.timeline.filter(
    (e) => e.totalDay > beforeState.date.totalDays && e.totalDay <= afterState.date.totalDays
  );

  const events = recentWindowLogs.map((e) => ({
    title: e.title,
    tier: e.tier,
    category: e.category,
  }));

  const turningPoints =
    meta?.turningPointsCount ??
    recentWindowLogs.filter((e) => e.tier === 'T3' || e.title.includes('จุดเปลี่ยน')).length;

  const autopilotDecisions =
    meta?.autopilotActionsCount ??
    recentWindowLogs.filter((e) => e.category === 'autopilot' || e.title.includes('Autopilot')).length;

  const cashDelta = afterState.economy.cash - beforeState.economy.cash;

  const physicalDelta = afterState.character.indices.physical - beforeState.character.indices.physical;
  const mentalDelta = afterState.character.indices.mental - beforeState.character.indices.mental;
  const healthTrend: 'improving' | 'stable' | 'declining' =
    physicalDelta + mentalDelta > 3 ? 'improving' : physicalDelta + mentalDelta < -3 ? 'declining' : 'stable';

  const relDelta = afterState.character.indices.social - beforeState.character.indices.social;
  const relationshipTrend: 'improving' | 'stable' | 'declining' =
    relDelta > 2 ? 'improving' : relDelta < -2 ? 'declining' : 'stable';

  const debtDelta = afterState.economy.debt - beforeState.economy.debt;

  const facts: PeriodFacts = {
    daysElapsed,
    cashDelta,
    incomeTotal: Math.max(0, cashDelta),
    expenseTotal: Math.max(0, -cashDelta),
    debtDelta,
    newTraits,
    events,
    autopilotDecisions,
    turningPoints,
    healthTrend,
    relationshipTrend,
  };

  return buildEnhancedDigest(facts, afterState);
}

/**
 * Pure template-based Annual Focus Summary Report (Spec 06 §9.1).
 * Uses factual year-start snapshots stored on state.planner.annualFocus.snapshot (zero AI).
 */
export function generateAnnualFocusDigest(currentState: GameState): PeriodDigest {
  const af = currentState.planner?.annualFocus;
  const focusId: AnnualFocusId = af?.current ?? 'none';
  const focusDef = ANNUAL_FOCUS_BY_ID.get(focusId) ?? ANNUAL_FOCUS_BY_ID.get('none')!;
  const snap = af?.snapshot;

  const cashDelta = snap ? currentState.economy.cash - snap.startCash : 0;
  const curAvgSkill =
    ALL_SKILL_KEYS.reduce((s, k) => s + (currentState.character.skills[k] ?? 0), 0) /
    ALL_SKILL_KEYS.length;
  const avgSkillDelta = snap ? Math.round((curAvgSkill - snap.startAvgSkill) * 10) / 10 : 0;
  const physicalDelta = snap
    ? Math.round((currentState.character.indices.physical - snap.startPhysical) * 10) / 10
    : 0;
  const avgStress =
    snap && snap.stressSamples > 0
      ? Math.round(snap.stressSum / snap.stressSamples)
      : Math.round(currentState.character.resources.stress);

  const yearBE = (snap?.yearCE ?? currentState.date.yearCE - 1) + 543;
  const summaryLines: string[] = [
    `เป้าหมายปี พ.ศ. ${yearBE}: "${focusDef.labelTh}"`,
    `การเงิน: เงินสดเปลี่ยนแปลง ${cashDelta >= 0 ? '+' : ''}${cashDelta.toLocaleString('th-TH')} บาท (คงเหลือ ${currentState.economy.cash.toLocaleString('th-TH')} บาท)`,
    `ทักษะเฉลี่ย: ${avgSkillDelta >= 0 ? '+' : ''}${avgSkillDelta} ระดับ · ค่าเฉลี่ยความเครียดตลอดปี ${avgStress}/100`,
    `สุขภาพกาย: ${physicalDelta >= 0 ? '+' : ''}${physicalDelta} คะแนน (ปัจจุบัน ${Math.round(currentState.character.indices.physical)}/100)`,
  ];

  const streaks = currentState.planner?.streaks;
  if (streaks) {
    const activeStreaks: string[] = [];
    if (streaks.overtimeWeeks > 0) activeStreaks.push(`ทำโอทีต่อเนื่อง ${streaks.overtimeWeeks} สัปดาห์`);
    if (streaks.workoutWeeks > 0) activeStreaks.push(`ออกกำลังกายต่อเนื่อง ${streaks.workoutWeeks} สัปดาห์`);
    if (streaks.presetWeeks >= 4 && streaks.presetId) activeStreaks.push(`ยึดวิถีชีวิตเดิม ${streaks.presetWeeks} สัปดาห์`);
    if (activeStreaks.length > 0) {
      summaryLines.push(`ความต่อเนื่องเด่น: ${activeStreaks.join(' · ')}`);
    }
  }

  return {
    title: `สรุปผลเป้าหมายปี ${yearBE} (${focusDef.labelTh})`,
    daysElapsed: 365,
    summaryLines,
    newTraits: [],
    turningPointsCount: 0,
    autopilotActionsCount: 0,
    cashDelta,
  };
}
