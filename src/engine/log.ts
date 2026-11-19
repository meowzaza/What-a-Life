import { ANNUAL_FOCUS_BY_ID } from '../data/annualFocus';
import sceneManifestRaw from '../data/sceneManifest.json';
import { DISCOVERED_SKILL_IDS } from '../data/skills';
import { HOUSINGS, JOBS, RAW_STAT_LABELS, SKILL_LABELS } from '../data/thaiData';
import { PERSONALITY_AXIS_META, TRAITS_BY_ID, TURNING_POINTS_BY_KIND } from '../data/traits';
import { formatShortThaiDate } from './clock';
import { recalculateEconomyDerived } from './economy';
import { recordEvidence } from './evidence';
import { clamp, round2 } from './rng';
import { grantStoryletSkillPoints } from './skillTraining';
import { computeLifeIndices } from './stats';
import { applyTurningPoint, revealTrait, translateEvidenceKey } from './traits';
import type {
  Effect,
  GameState,
  PersonalityAxes,
  SkillKey,
  StatChangeLog,
  TimelineEntry,
} from './types';

const MAX_STAT_LOGS = 400;
const MAX_TIMELINE_ENTRIES = 250;

function makeLogId(prefix: string, totalDay: number, seq: number): string {
  return `${prefix}_${totalDay}_${seq}`;
}

export function appendTimeline(
  state: GameState,
  entry: Omit<TimelineEntry, 'id' | 'totalDay' | 'dateLabel' | 'ageYears'>
): GameState {
  let seq = state.timeline.length + 1;
  let id = makeLogId('tl', state.date.totalDays, seq);
  while (state.timeline.some((item) => item.id === id)) {
    seq++;
    id = makeLogId('tl', state.date.totalDays, seq);
  }
  const fullEntry: TimelineEntry = {
    id,
    totalDay: state.date.totalDays,
    dateLabel: formatShortThaiDate(state.date),
    ageYears: state.character.ageYears,
    ...entry,
  };
  const nextTimeline = [...state.timeline, fullEntry];
  if (nextTimeline.length > MAX_TIMELINE_ENTRIES) {
    nextTimeline.splice(0, nextTimeline.length - MAX_TIMELINE_ENTRIES);
  }
  return {
    ...state,
    timeline: nextTimeline,
  };
}

function pushStatLog(
  logs: StatChangeLog[],
  state: GameState,
  target: string,
  delta: number,
  newValue: number,
  reason: string
): StatChangeLog[] {
  if (Math.abs(delta) < 0.001) return logs;
  let seq = logs.length + 1;
  let id = makeLogId('sl', state.date.totalDays, seq);
  while (logs.some((item) => item.id === id)) {
    seq++;
    id = makeLogId('sl', state.date.totalDays, seq);
  }
  const entry: StatChangeLog = {
    id,
    totalDay: state.date.totalDays,
    dateLabel: formatShortThaiDate(state.date),
    target,
    delta: round2(delta),
    newValue: round2(newValue),
    reason,
  };
  const next = [...logs, entry];
  if (next.length > MAX_STAT_LOGS) {
    next.splice(0, next.length - MAX_STAT_LOGS);
  }
  return next;
}

const SCENE_NAME_TH_BY_ID: Record<string, string> = Object.fromEntries(
  ((sceneManifestRaw as { scenes?: Array<{ id: string; nameTh: string }> }).scenes ?? []).map((s) => [
    s.id,
    s.nameTh,
  ])
);

const FLAG_LABEL_TH: Record<string, string> = {
  lent_relative_money: 'ปิดเรื่องยืมเงินญาติ',
  chronic_appendix_risk: 'พ้นความเสี่ยงอาการกำเริบเรื้อรัง',
  appearance_dyed_fashion: 'ปรับลุคสีผมกลับสู่โทนธรรมชาติ',
  appearance_toned_down_formal: 'ปลดล็อกสไตล์ลุคสบายๆ',
};

const TENURE_LABEL_TH: Record<string, string> = {
  rent: 'เช่าอยู่',
  own: 'เป็นเจ้าของ',
  family: 'อาศัยอยู่กับครอบครัว',
};

function translateStatKeyTh(statKey: string): string {
  if (statKey in RAW_STAT_LABELS) {
    return RAW_STAT_LABELS[statKey as keyof typeof RAW_STAT_LABELS].label;
  }
  if (statKey in SKILL_LABELS) {
    return `ทักษะ${SKILL_LABELS[statKey as keyof typeof SKILL_LABELS].label}`;
  }
  if (statKey === 'energy') return 'พลังงาน';
  if (statKey === 'stress') return 'ความเครียด';
  if (statKey === 'freeTime') return 'เวลาว่าง';
  return 'ค่าสถานะส่วนตัว';
}

export function summarizeEffects(effects: Effect[]): string[] {
  const out: string[] = [];
  for (const eff of effects) {
    switch (eff.type) {
      case 'AddMoney':
        out.push(`เงินสด ${eff.amount >= 0 ? '+' : ''}${eff.amount.toLocaleString('th-TH')} บาท`);
        break;
      case 'AddDebt':
        out.push(`หนี้สิน +${eff.amount.toLocaleString('th-TH')} บาท`);
        break;
      case 'RepayDebt':
        out.push(`ชำระหนี้ -${eff.amount.toLocaleString('th-TH')} บาท`);
        break;
      case 'ChangeRawStat': {
        const label = RAW_STAT_LABELS[eff.stat].label;
        out.push(`${label} ${eff.delta >= 0 ? '+' : ''}${eff.delta}`);
        break;
      }
      case 'ChangeResource': {
        const name = eff.resource === 'energy' ? 'พลังงาน' : eff.resource === 'stress' ? 'ความเครียด' : 'เวลาว่าง';
        out.push(`${name} ${eff.delta >= 0 ? '+' : ''}${eff.delta}`);
        break;
      }
      case 'ChangeSkill': {
        const label = SKILL_LABELS[eff.skill].label;
        out.push(`ทักษะ${label} ${eff.delta >= 0 ? '+' : ''}${eff.delta}`);
        break;
      }
      case 'ChangeCredit':
        out.push(`เครดิต ${eff.delta >= 0 ? '+' : ''}${eff.delta}`);
        break;
      case 'SetHousing':
        out.push(`ย้ายที่พัก: ${HOUSINGS[eff.housingId].name}`);
        break;
      case 'SetJob':
        out.push(`เปลี่ยนงาน: ${(JOBS[eff.jobId] ?? JOBS.unemployed).title}`);
        break;
      case 'ScheduleEcho':
        out.push(`ผลสะท้อนในอีก ${eff.delayDays} วัน`);
        break;
      case 'RecordEvidence':
        out.push(`สะสมนิสัยด้าน${translateEvidenceKey(eff.key)} (${eff.amount >= 0 ? '+' : ''}${eff.amount})`);
        break;
      case 'AdjustPersonality':
        out.push(
          `${PERSONALITY_AXIS_META[eff.axis].labelTh} ${eff.delta >= 0 ? '+' : ''}${eff.delta}`
        );
        break;
      case 'ApplyTurningPoint': {
        const tpTitle = TURNING_POINTS_BY_KIND.get(eff.kind)?.titleTh ?? 'เหตุการณ์จุดเปลี่ยนครั้งสำคัญ';
        out.push(`จุดเปลี่ยนชีวิต: ${tpTitle}`);
        break;
      }
      case 'RevealTrait':
        out.push(`ค้นพบนิสัย: ${TRAITS_BY_ID.get(eff.traitId)?.nameTh ?? 'นิสัยใหม่ในตัว'}`);
        break;
      case 'SetDeath':
        out.push(`เสียชีวิต (${eff.cause})`);
        break;
      case 'ChangeStat':
        out.push(`${translateStatKeyTh(eff.stat)} ${eff.delta >= 0 ? '+' : ''}${eff.delta}`);
        break;
      case 'ChangeMoney':
        out.push(`เงินสด ${eff.amount >= 0 ? '+' : ''}${eff.amount.toLocaleString('th-TH')} บาท`);
        break;
      case 'ModifyTeacherGpa':
        out.push(`คะแนนเก็บอาจารย์ ${eff.delta >= 0 ? '+' : ''}${eff.delta.toFixed(2)}`);
        break;
      case 'RemoveFlag':
        out.push(FLAG_LABEL_TH[eff.flag] ?? (eff.reason || 'ปรับสถานะชีวิตประจำวัน'));
        break;
      case 'StartScene': {
        const sceneTitle =
          eff.sceneId === 'hospital'
            ? 'พักรักษาตัวที่โรงพยาบาล'
            : eff.sceneId === 'cafe'
              ? 'แวะพักที่คาเฟ่'
              : (SCENE_NAME_TH_BY_ID[eff.sceneId] ?? 'ย้ายสถานที่ชั่วคราว');
        out.push(
          eff.durationDays
            ? `${sceneTitle} (${eff.durationDays} วัน)`
            : `${sceneTitle}`
        );
        break;
      }
      case 'MoveIn': {
        const housingName =
          HOUSINGS[eff.housingId as keyof typeof HOUSINGS]?.name ?? 'ที่พักใหม่';
        out.push(`ย้ายเข้า: ${housingName}`);
        break;
      }
      case 'ChangeTenure':
        out.push(`เปลี่ยนรูปแบบที่อยู่: ${TENURE_LABEL_TH[eff.tenure] ?? 'ปรับสัญญาที่พัก'}`);
        break;
      case 'StartJobShift': {
        const jobTitle = JOBS[eff.jobId]?.title ?? 'งานใหม่';
        out.push(`เริ่มกะงาน: ${jobTitle}`);
        break;
      }
      case 'SetAnnualFocus': {
        const label = ANNUAL_FOCUS_BY_ID.get(eff.focusId)?.labelTh ?? 'เป้าหมายประจำปี';
        out.push(`ตั้งเป้าหมายประจำปี: ${label}`);
        break;
      }
    }
  }
  return out;
}

export function applyEffects(state: GameState, effects: Effect[], recordStatLogs = true): GameState {
  let character = {
    ...state.character,
    rawStats: { ...state.character.rawStats },
    resources: { ...state.character.resources },
    skills: { ...state.character.skills },
    traits: [...state.character.traits],
    flags: { ...state.character.flags },
  };
  let economy = { ...state.economy };
  let echoQueue = [...state.echoQueue];
  let statLogs = [...state.statLogs];
  let nextSkillTraining = state.skillTraining;

  for (const eff of effects) {
    switch (eff.type) {
      case 'ChangeRawStat': {
        const prev = character.rawStats[eff.stat];
        const next = round2(clamp(prev + eff.delta, 0, 100));
        character.rawStats[eff.stat] = next;
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, `raw:${eff.stat}`, next - prev, next, eff.reason);
        }
        break;
      }
      case 'ChangeResource': {
        const prev = character.resources[eff.resource];
        const maxVal = eff.resource === 'freeTime' ? 16 : 100;
        const next = round2(clamp(prev + eff.delta, 0, maxVal));
        character.resources[eff.resource] = next;
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, `res:${eff.resource}`, next - prev, next, eff.reason);
        }
        break;
      }
      case 'ChangeSkill': {
        const prev = character.skills[eff.skill] ?? 0;
        const tempState: GameState = { ...state, character, economy, skillTraining: nextSkillTraining };
        const updatedState = grantStoryletSkillPoints(tempState, eff.skill, eff.delta, eff.reason);
        character.skills = { ...updatedState.character.skills };
        nextSkillTraining = updatedState.skillTraining;
        const next = character.skills[eff.skill] ?? prev;
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, `skill:${eff.skill}`, next - prev, next, eff.reason);
        }
        break;
      }
      case 'AddMoney': {
        if (character.ageYears < 15 && eff.amount !== 0) {
          break;
        }
        const prev = economy.cash;
        const next = Math.round(prev + eff.amount);
        economy.cash = next;
        if (eff.category === 'side' && eff.amount > 0) {
          economy.monthlySideIncome += Math.round(eff.amount);
        }
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, 'eco:cash', next - prev, next, eff.reason);
        }
        break;
      }
      case 'AddDebt': {
        const amt = Math.max(0, Math.round(eff.amount));
        const prev = economy.debt;
        economy.debt = prev + amt;
        if (recordStatLogs && amt > 0) {
          statLogs = pushStatLog(statLogs, state, 'eco:debt', amt, economy.debt, eff.reason);
        }
        break;
      }
      case 'RepayDebt': {
        const repay = Math.min(economy.debt, Math.max(0, Math.round(eff.amount)));
        if (repay > 0) {
          economy.debt -= repay;
          if (recordStatLogs) {
            statLogs = pushStatLog(statLogs, state, 'eco:debt', -repay, economy.debt, eff.reason);
          }
        }
        break;
      }
      case 'ChangeCredit': {
        const prev = economy.creditScore;
        const next = Math.round(clamp(prev + eff.delta, 300, 900));
        economy.creditScore = next;
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, 'eco:creditScore', next - prev, next, eff.reason);
        }
        break;
      }
      case 'SetHousing': {
        economy.housingId = eff.housingId;
        break;
      }
      case 'SetJob': {
        const job = JOBS[eff.jobId] ?? JOBS.unemployed;
        economy.jobId = job.id;
        economy.jobTitle = job.title;
        economy.monthlySalary = job.monthlySalary;
        break;
      }
      case 'AddTrait': {
        if (!character.traits.includes(eff.traitId)) {
          character.traits.push(eff.traitId);
        }
        break;
      }
      case 'RemoveTrait': {
        character.traits = character.traits.filter((t) => t !== eff.traitId);
        break;
      }
      case 'ChangeMoney': {
        if (character.ageYears < 15 && eff.amount !== 0) {
          break;
        }
        // Enforce hard economy ceilings on single events to prevent broken simulation state
        const clampedAmount = clamp(Math.round(eff.amount), -30000, 50000);
        const prev = economy.cash;
        const next = Math.max(0, Math.round(prev + clampedAmount));
        economy.cash = next;
        if (eff.category === 'side' && clampedAmount > 0) {
          economy.monthlySideIncome += clampedAmount;
        }
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, 'eco:cash', next - prev, next, eff.reason);
        }
        break;
      }
      case 'ChangeStat': {
        const k = eff.stat;
        if (k in character.rawStats) {
          const rawK = k as keyof typeof character.rawStats;
          const prev = character.rawStats[rawK];
          const next = round2(clamp(prev + eff.delta, 0, 100));
          character.rawStats[rawK] = next;
          if (recordStatLogs) {
            statLogs = pushStatLog(statLogs, state, `raw:${rawK}`, next - prev, next, eff.reason);
          }
        } else if (k in character.resources) {
          const resK = k as keyof typeof character.resources;
          const maxVal = resK === 'freeTime' ? 16 : 100;
          const prev = character.resources[resK];
          const next = round2(clamp(prev + eff.delta, 0, maxVal));
          character.resources[resK] = next;
          if (recordStatLogs) {
            statLogs = pushStatLog(statLogs, state, `res:${resK}`, next - prev, next, eff.reason);
          }
        } else if (k in character.skills) {
          const skK = k as keyof typeof character.skills;
          const prev = character.skills[skK] ?? 0;
          const tempState: GameState = { ...state, character, economy, skillTraining: nextSkillTraining };
          const updatedState = grantStoryletSkillPoints(tempState, skK, eff.delta, eff.reason);
          character.skills = { ...updatedState.character.skills };
          nextSkillTraining = updatedState.skillTraining;
          const next = character.skills[skK] ?? prev;
          if (recordStatLogs) {
            statLogs = pushStatLog(statLogs, state, `skill:${skK}`, next - prev, next, eff.reason);
          }
        }
        break;
      }
      case 'RemoveFlag': {
        delete character.flags[eff.flag];
        break;
      }
      case 'StartScene': {
        // Scene Mode / Temporary event scene
        break;
      }
      case 'MoveIn':
      case 'ChangeTenure':
      case 'StartJobShift': {
        // Spec 02/03 stubs for future phases
        break;
      }
      case 'AddFlag': {
        character.flags[eff.flag] = eff.value;
        break;
      }
      case 'ScheduleEcho': {
        const delay = Math.max(1, Math.round(eff.delayDays));
        let seq = echoQueue.length + 1;
        let id = makeLogId('echo', state.date.totalDays, seq);
        while (echoQueue.some((item) => item.id === id)) {
          seq++;
          id = makeLogId('echo', state.date.totalDays, seq);
        }
        echoQueue.push({
          id,
          triggerOnDay: state.date.totalDays + delay,
          title: eff.title,
          description: eff.description,
          effects: eff.effects,
          sourceEventId: eff.sourceEventId,
        });
        break;
      }
      case 'SetDeath': {
        character.isAlive = false;
        character.causeOfDeath = eff.cause;
        break;
      }
      case 'AdjustPersonality': {
        const curPers: PersonalityAxes = {
          ...(character.personality ?? { ambition: 50, agreeableness: 50, stability: 50 }),
        };
        const prev = curPers[eff.axis];
        const nextVal = round2(clamp(prev + eff.delta, 5, 95));
        curPers[eff.axis] = nextVal;
        character.personality = curPers;
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, `pers:${eff.axis}`, nextVal - prev, nextVal, eff.reason);
        }
        break;
      }
      case 'ModifyTeacherGpa': {
        const curEdu = character.educationState ?? {
          level: character.education,
          schoolTier: 'school_public',
          currentGpa: 2.75,
          cumulativeGpa: 2.75,
          termCount: 1,
          hasStudentLoan: false,
          completedRotc: false,
        };
        const prev = curEdu.teacherTermDelta ?? 0;
        const nextVal = round2(clamp(prev + eff.delta, -0.30, 0.30));
        curEdu.teacherTermDelta = nextVal;
        character.educationState = curEdu;
        if (recordStatLogs) {
          statLogs = pushStatLog(statLogs, state, 'edu:teacherDelta', nextVal - prev, nextVal, eff.reason);
        }
        break;
      }
      case 'RecordEvidence':
      case 'ApplyTurningPoint':
      case 'RevealTrait':
      case 'SetAnnualFocus': {
        // Applied immediately after core stat loop below so state mutations compose cleanly
        break;
      }
    }
  }

  economy = recalculateEconomyDerived(character, economy);
  character.indices = computeLifeIndices(character, economy);

  const discSet = new Set(nextSkillTraining?.discoveredSkills ?? []);
  let discAdded = false;
  for (const dKey of DISCOVERED_SKILL_IDS) {
    if ((character.skills[dKey] ?? 0) > 0 && !discSet.has(dKey)) {
      discSet.add(dKey);
      discAdded = true;
    }
  }
  if (discAdded && nextSkillTraining) {
    nextSkillTraining = {
      ...nextSkillTraining,
      discoveredSkills: Array.from(discSet),
    };
  }

  let nextState: GameState = {
    ...state,
    character,
    economy,
    echoQueue,
    statLogs,
    skillTraining: nextSkillTraining,
  };

  for (const eff of effects) {
    if (eff.type === 'RecordEvidence') {
      nextState = recordEvidence(nextState, eff.key, eff.amount, { reason: eff.reason });
    } else if (eff.type === 'ApplyTurningPoint') {
      nextState = applyTurningPoint(nextState, eff.kind, nextState.seed);
    } else if (eff.type === 'RevealTrait') {
      nextState = revealTrait(nextState, eff.traitId, eff.reason);
    } else if (eff.type === 'SetAnnualFocus') {
      const skillKeys = Object.keys(nextState.character.skills) as SkillKey[];
      const avgSkill =
        skillKeys.length > 0
          ? skillKeys.reduce((sum, k) => sum + (nextState.character.skills[k] ?? 0), 0) / skillKeys.length
          : 0;
      const curPlanner = nextState.planner;
      if (curPlanner) {
        const prevAf = curPlanner.annualFocus;
        nextState = {
          ...nextState,
          planner: {
            ...curPlanner,
            annualFocus: {
              current: eff.focusId,
              yearCE: nextState.date.yearCE,
              changesThisYear: prevAf && prevAf.yearCE === nextState.date.yearCE ? prevAf.changesThisYear : 0,
              lastPromptedAge: nextState.character.ageYears,
              lastSummaryYearCE: prevAf?.lastSummaryYearCE,
              snapshot: prevAf?.snapshot ?? {
                yearCE: nextState.date.yearCE,
                startCash: nextState.economy.cash,
                startAvgSkill: avgSkill,
                startPhysical: nextState.character.indices.physical,
                stressSum: nextState.character.resources.stress,
                stressSamples: 1,
              },
            },
          },
        };
      }
    }
  }

  return nextState;
}
