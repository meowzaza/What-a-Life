import {
  PERSONALITY_AXIS_META,
  TEMPERAMENT_VECTORS,
  TRAIT_CATALOG,
  TRAIT_INTENSITY_META,
  TRAITS_BY_ID,
  TURNING_POINT_DEFS,
  TURNING_POINTS_BY_KIND,
  type TraitDefinition,
} from '../data/traits';
import { formatShortThaiDate } from './clock';
import { getEvidenceValue, recordEvidenceBatch } from './evidence';
import { getLifeStageForAge } from './lifeStage';
import { clamp, pickOne, randRange, round2 } from './rng';
import type {
  EmergentTraitInstance,
  EvidenceState,
  GameState,
  Person,
  PersonalityAxes,
  PersonalityAxisKey,
  ReputationGroupKey,
  ReputationView,
  TemperamentDimensions,
  TemperamentId,
  TimelineEntry,
  TraitIntensity,
} from './types';

function pushTraitTimeline(
  state: GameState,
  entry: Omit<TimelineEntry, 'id' | 'totalDay' | 'dateLabel' | 'ageYears'>
): GameState {
  let seq = state.timeline.length + 1;
  let id = `tl_${state.date.totalDays}_${seq}`;
  while (state.timeline.some((t) => t.id === id)) {
    seq++;
    id = `tl_${state.date.totalDays}_${seq}`;
  }
  const full: TimelineEntry = {
    id,
    totalDay: state.date.totalDays,
    dateLabel: formatShortThaiDate(state.date),
    ageYears: state.character.ageYears,
    ...entry,
  };
  const nextTimeline = [...state.timeline, full];
  if (nextTimeline.length > 250) {
    nextTimeline.splice(0, nextTimeline.length - 250);
  }
  return {
    ...state,
    timeline: nextTimeline,
  };
}

export function initTraitsForPerson(
  rngState: number,
  temperamentId: TemperamentId,
  ageYears: number
): {
  temperamentProfile: TemperamentDimensions;
  personality: PersonalityAxes;
  emergentTraits: EmergentTraitInstance[];
  innerTension: number;
  reputationView: ReputationView;
  starterEvidence: EvidenceState;
  traitsTagList: string[];
  rngState: number;
} {
  let s = rngState;
  const spec = TEMPERAMENT_VECTORS[temperamentId] ?? TEMPERAMENT_VECTORS.calm;

  const jitter = (base: number, spread: number): number => {
    const r = randRange(s, -spread, spread);
    s = r.rngState;
    return Math.round(clamp(base + r.value, 15, 95));
  };

  const temperamentProfile: TemperamentDimensions = {
    energy: jitter(spec.baseDimensions.energy, 6),
    positivity: jitter(spec.baseDimensions.positivity, 6),
    sensitivity: jitter(spec.baseDimensions.sensitivity, 6),
    obsessiveness: jitter(spec.baseDimensions.obsessiveness, 6),
  };

  const personality: PersonalityAxes = {
    ambition: jitter(50 + spec.personalityBaseBias.ambition, 9),
    agreeableness: jitter(50 + spec.personalityBaseBias.agreeableness, 9),
    stability: jitter(50 + spec.personalityBaseBias.stability, 9),
  };

  const starterEvidence: EvidenceState = {};
  const emergentTraits: EmergentTraitInstance[] = [];

  // For characters starting at teen/adult age, seed 1-2 background traits compatible with their temperament
  if (ageYears >= 14) {
    const eligibleStarter = TRAIT_CATALOG.filter((t) => {
      if (!meetsLayerGates(t, temperamentProfile, personality)) return false;
      return t.id === 'cheerful' || t.id === 'calm_minded' || t.id === 'gritty' || t.id === 'family_anchored' || t.id === 'curious_learner' || t.id === 'overthinker' || t.id === 'hot_tempered';
    });
    if (eligibleStarter.length > 0) {
      const picked = pickOne(s, eligibleStarter);
      s = picked.rngState;
      const def = picked.value;
      emergentTraits.push({
        id: def.id,
        intensity: ageYears >= 25 ? 'clear' : 'subtle',
        intensityScore: ageYears >= 25 ? def.intensityThresholds.clear + 2 : def.intensityThresholds.subtle + 2,
        visibility: def.defaultVisibility,
        formedAtAge: Math.max(8, ageYears - 4),
        formedAtDay: 0,
        originStory: `นิสัยติดตัวจากการใช้ชีวิตช่วงก่อนอายุ ${ageYears} ปี`,
        evidenceReason: 'สะสมจากประสบการณ์ชีวิตตั้งต้นก่อนเริ่มเกม',
        lastReinforcedDay: 0,
      });
      for (const req of def.evidenceReqs) {
        starterEvidence[req.key] = Math.max(starterEvidence[req.key] ?? 0, req.min + 3);
      }
    }
  }

  const innerTension = computeInnerTensionFromTraits(emergentTraits);
  const reputationView = computeReputationFromTraits(emergentTraits, personality);
  const traitsTagList = buildTraitTagList(temperamentId, emergentTraits);

  return {
    temperamentProfile,
    personality,
    emergentTraits,
    innerTension,
    reputationView,
    starterEvidence,
    traitsTagList,
    rngState: s,
  };
}

export function buildTraitTagList(
  temperamentId: TemperamentId,
  emergentTraits: readonly EmergentTraitInstance[]
): string[] {
  const tags = [`temperament:${temperamentId}`];
  for (const inst of emergentTraits) {
    if (!tags.includes(inst.id)) {
      tags.push(inst.id);
    }
  }
  return tags;
}

export function meetsLayerGates(
  def: TraitDefinition,
  temp: TemperamentDimensions,
  pers: PersonalityAxes
): boolean {
  if (def.temperamentReq) {
    const tr = def.temperamentReq;
    if (tr.minEnergy !== undefined && temp.energy < tr.minEnergy) return false;
    if (tr.maxEnergy !== undefined && temp.energy > tr.maxEnergy) return false;
    if (tr.minPositivity !== undefined && temp.positivity < tr.minPositivity) return false;
    if (tr.maxPositivity !== undefined && temp.positivity > tr.maxPositivity) return false;
    if (tr.minSensitivity !== undefined && temp.sensitivity < tr.minSensitivity) return false;
    if (tr.maxSensitivity !== undefined && temp.sensitivity > tr.maxSensitivity) return false;
    if (tr.minObsessiveness !== undefined && temp.obsessiveness < tr.minObsessiveness) return false;
    if (tr.maxObsessiveness !== undefined && temp.obsessiveness > tr.maxObsessiveness) return false;
  }

  if (def.personalityReq) {
    const pr = def.personalityReq;
    if (pr.minAmbition !== undefined && pers.ambition < pr.minAmbition) return false;
    if (pr.maxAmbition !== undefined && pers.ambition > pr.maxAmbition) return false;
    if (pr.minAgreeableness !== undefined && pers.agreeableness < pr.minAgreeableness) return false;
    if (pr.maxAgreeableness !== undefined && pers.agreeableness > pr.maxAgreeableness) return false;
    if (pr.minStability !== undefined && pers.stability < pr.minStability) return false;
    if (pr.maxStability !== undefined && pers.stability > pr.maxStability) return false;
  }

  return true;
}

export function computeInnerTensionFromTraits(traits: readonly EmergentTraitInstance[]): number {
  const ids = new Set(traits.map((t) => t.id));
  let conflictScore = 0;
  for (const inst of traits) {
    const def = TRAITS_BY_ID.get(inst.id);
    if (!def) continue;
    for (const conflictId of def.conflictsWith) {
      if (ids.has(conflictId)) {
        conflictScore += 18;
      }
    }
  }
  // Divided by 2 because each conflict pair appears from both sides if mutual
  return Math.round(clamp(conflictScore / 2, 0, 100));
}

export function getConflictingTraitPairs(traits: readonly EmergentTraitInstance[]): Array<[string, string]> {
  const ids = new Set(traits.map((t) => t.id));
  const pairs: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const inst of traits) {
    const def = TRAITS_BY_ID.get(inst.id);
    if (!def) continue;
    for (const otherId of def.conflictsWith) {
      if (!ids.has(otherId)) continue;
      const key = [inst.id, otherId].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push([inst.id, otherId]);
      }
    }
  }
  return pairs;
}

export function computeReputationFromTraits(
  traits: readonly EmergentTraitInstance[],
  personality: PersonalityAxes
): ReputationView {
  const view: ReputationView = {
    family: Math.round(clamp(50 + (personality.agreeableness - 50) * 0.12, 0, 100)),
    friends: Math.round(clamp(50 + (personality.agreeableness - 50) * 0.14, 0, 100)),
    work: Math.round(clamp(50 + (personality.ambition - 50) * 0.1 + (personality.stability - 50) * 0.1, 0, 100)),
    community: Math.round(clamp(50 + (personality.stability - 50) * 0.1, 0, 100)),
  };

  for (const inst of traits) {
    const def = TRAITS_BY_ID.get(inst.id);
    if (!def) continue;
    const mult = TRAIT_INTENSITY_META[inst.intensity].multiplier;
    for (const grp of ['family', 'friends', 'work', 'community'] as ReputationGroupKey[]) {
      const delta = def.reputationDeltas[grp] ?? 0;
      view[grp] = Math.round(clamp(view[grp] + delta * mult, 0, 100));
    }
  }

  return view;
}

export function intensityFromScore(score: number, def: TraitDefinition): TraitIntensity | null {
  if (score >= def.intensityThresholds.core) return 'core';
  if (score >= def.intensityThresholds.clear) return 'clear';
  if (score >= def.intensityThresholds.subtle) return 'subtle';
  return null;
}

export const EVIDENCE_LABELS_TH: Record<string, string> = {
  praised: 'การได้รับคำชมและความไว้วางใจ',
  social_fun: 'การสังสรรค์และเข้าสังคม',
  self_reflection: 'การทบทวนและสงบสติอารมณ์',
  success_streak: 'การทำสิ่งต่างๆ สำเร็จต่อเนื่อง',
  conflict_lash: 'การปะทะอารมณ์และโต้เถียง',
  failure_streak: 'ความผิดพลาดหรือติดขัดซ้ำๆ',
  teased: 'การถูกหยอกล้อหรือกดดันจากรอบข้าง',
  endurance_work: 'ความอึดและความทุ่มเททำงาน',
  overwork: 'การทำงานหนักหักโหมเกินกำลัง',
  avoidance: 'การหลีกเลี่ยงภาระหรือปัญหา',
  peer_follow: 'การทำตามเพื่อนฝูง',
  solitude: 'การใช้เวลาอยู่เงียบๆ กับตัวเอง',
  betrayal_hurt: 'ความผิดหวังหรือถูกคนไว้ใจหักหลัง',
  night_out: 'การออกใช้ชีวิตยามค่ำคืน',
  help_others: 'ความมีน้ำใจช่วยเหลือคนรอบข้าง',
  nightlife_social: 'การเข้าสังคมในแหล่งบันเทิงกลางคืน',
  practice_business: 'การฝึกฝนการค้าขายและวางแผนธุรกิจ',
  self_discipline: 'ความมีวินัยและการคุมตัวเอง',
  hobby_focus: 'ความทุ่มเทกับงานอดิเรกที่ชอบ',
  practice_any: 'การหมั่นฝึกฝนทักษะสม่ำเสมอ',
  family_time: 'การให้เวลากับครอบครัว',
  lying: 'การปิดบังหรือพูดไม่ตรงความจริง',
  risk_taking: 'ความกล้าได้กล้าเสียและชอบเสี่ยง',
  overspending: 'การใช้จ่ายเกินตัวตามใจอยาก',
  disciplined_saving: 'ความประหยัดและวินัยการออมเงิน',
  money_scarcity_stress: 'ความกังวลใจเรื่องเงินฝืดเคือง',
  rest_recovery: 'การรู้จักพักผ่อนและดูแลใจตัวเอง',
  street_smart: 'ไหวพริบและความคล่องตัวในการเอาตัวรอด',
  fitness_training: 'การฝึกซ้อมดูแลร่างกาย',
  hardWorking: 'ความขยันและการรับผิดชอบงานหนักเพิ่มขึ้น',
  workaholic: 'การทุ่มเทเวลาส่วนใหญ่ให้กับงานต่อเนื่องหลายสัปดาห์',
  independent: 'การทำงานอิสระและการพึ่งพาตัวเอง',
  creative: 'การคิดริเริ่มสร้างสรรค์ผลงานใหม่ๆ',
  practice_academic: 'การทบทวนและฝึกฝนวิชาการ',
  practice_tech: 'การฝึกฝนทักษะเทคโนโลยีและดิจิทัล',
  practice_craft: 'การฝึกฝนงานฝีมือและงานช่าง',
  practice_social: 'การฝึกทักษะการพูดคุยและสื่อสาร',
  practice_athletics: 'การฝึกซ้อมร่างกายและกีฬา',
  practice_foreign_lang: 'การฝึกฝนภาษาต่างประเทศ',
  practice_culinary: 'การฝึกฝนการทำอาหารและเครื่องดื่ม',
  practice_visual_arts: 'การฝึกวาดภาพและงานศิลปะ',
  practice_music_vocal: 'การฝึกดนตรีและการขับร้อง',
  practice_performing_acting: 'การฝึกการแสดงและเวที',
  practice_dance_thai_modern: 'การฝึกนาฏศิลป์และการเต้น',
  practice_literature_writing: 'การฝึกเขียนและงานวรรณศิลป์',
};

export function translateEvidenceKey(key: string): string {
  if (EVIDENCE_LABELS_TH[key]) return EVIDENCE_LABELS_TH[key];
  if (key.startsWith('practice_')) return 'การหมั่นฝึกฝนทักษะเฉพาะทาง';
  return 'พฤติกรรมที่ทำสะสมมา';
}

function formatEvidenceExplain(def: TraitDefinition, _evidence: EvidenceState, _mult: number): string {
  const habitNames = def.evidenceReqs.map((r) => translateEvidenceKey(r.key)).join(' และ');
  return `เกิดจากการทำพฤติกรรมซ้ำๆ ด้าน${habitNames} จนซึมซับเข้ากับบุคลิกภาพในช่วงวัยนี้`;
}

/**
 * Annual drift on Layer A (very slow <= 0.15/yr) and Layer B (<= 1.5/yr).
 */
export function driftPersonalityYearly(rngState: number, person: Person): { person: Person; rngState: number } {
  let s = rngState;
  const temp = person.temperamentProfile ?? TEMPERAMENT_VECTORS[person.background.temperament].baseDimensions;
  const pers = person.personality ?? { ambition: 50, agreeableness: 50, stability: 50 };
  const traits = person.emergentTraits ?? [];

  // Layer A: very slow temperament drift (<= 0.15/year)
  const driftTempDim = (val: number): number => {
    const r = randRange(s, -0.15, 0.15);
    s = r.rngState;
    return round2(clamp(val + r.value, 10, 95));
  };

  const nextTemp: TemperamentDimensions = {
    energy: driftTempDim(temp.energy),
    positivity: driftTempDim(temp.positivity),
    sensitivity: driftTempDim(temp.sensitivity),
    obsessiveness: driftTempDim(temp.obsessiveness),
  };

  // Layer B: gentle personality drift influenced by active traits + bounded seeded nudge
  let ambitionBias = 0;
  let agreeBias = 0;
  let stabilityBias = 0;
  for (const inst of traits) {
    if (inst.id === 'gritty' || inst.id === 'disciplined_worker') ambitionBias += 0.35;
    if (inst.id === 'slacker') ambitionBias -= 0.35;
    if (inst.id === 'helpful_hearted' || inst.id === 'family_anchored') agreeBias += 0.35;
    if (inst.id === 'guarded_around_close' || inst.id === 'stubborn_pride') agreeBias -= 0.35;
    if (inst.id === 'calm_minded' || inst.id === 'cautious_planner') stabilityBias += 0.4;
    if (inst.id === 'hot_tempered' || inst.id === 'stress_sensitive') stabilityBias -= 0.35;
  }

  const stepAxis = (key: PersonalityAxisKey, bias: number): number => {
    const maxD = PERSONALITY_AXIS_META[key].annualMaxDrift;
    const r = randRange(s, -0.5, 0.5);
    s = r.rngState;
    const delta = clamp(bias + r.value, -maxD, maxD);
    return round2(clamp(pers[key] + delta, 5, 95));
  };

  const nextPers: PersonalityAxes = {
    ambition: stepAxis('ambition', ambitionBias),
    agreeableness: stepAxis('agreeableness', agreeBias),
    stability: stepAxis('stability', stabilityBias),
  };

  return {
    person: {
      ...person,
      temperamentProfile: nextTemp,
      personality: nextPers,
      reputationView: computeReputationFromTraits(traits, nextPers),
    },
    rngState: s,
  };
}

/**
 * Evaluates trait formation, intensity upgrades, decay/fading, and inner conflict.
 * Deterministic via state.rngState.
 */
export function checkTraitFormation(
  state: GameState,
  _cadence: 'weekly' | 'monthly',
  recordLogs = true
): GameState {
  let next = state;
  const character = next.character;
  if (!character.isAlive) return next;

  const evidence = next.evidence ?? {};
  const temp = character.temperamentProfile ?? TEMPERAMENT_VECTORS[character.background.temperament].baseDimensions;
  const pers = character.personality ?? { ambition: 50, agreeableness: 50, stability: 50 };
  const stageDef = getLifeStageForAge(character.ageYears);

  let currentTraits = [...(character.emergentTraits ?? [])];
  const pendingLogs: Array<Omit<TimelineEntry, 'id' | 'totalDay' | 'dateLabel' | 'ageYears'>> = [];

  // Process existing traits: reinforce or decay
  const updatedTraits: EmergentTraitInstance[] = [];
  for (const inst of currentTraits) {
    const def = TRAITS_BY_ID.get(inst.id);
    if (!def) continue;

    // Sum current supporting evidence with sensitive-stage multiplier
    let rawSum = 0;
    let allMetMin = true;
    for (const req of def.evidenceReqs) {
      const val = getEvidenceValue(evidence, req.key);
      rawSum += val;
      if (val < req.min * 0.45) {
        allMetMin = false;
      }
    }

    const recoveryBoost = def.recoveryEvidenceKey
      ? getEvidenceValue(evidence, def.recoveryEvidenceKey) * 0.65
      : 0;

    const effectiveEvidenceScore = rawSum * stageDef.sensitiveMultiplier * def.sensitiveStageBonus - recoveryBoost;

    let nextScore = inst.intensityScore;
    if (allMetMin && effectiveEvidenceScore > inst.intensityScore) {
      // Reinforce toward effective evidence score gradually
      nextScore = round2(Math.min(100, inst.intensityScore + Math.min(2.5, (effectiveEvidenceScore - inst.intensityScore) * 0.35)));
    } else {
      // Decay if evidence stopped or recovery path practiced
      const extraRecoveryDecay = recoveryBoost > 2 ? 0.55 : 0;
      nextScore = round2(Math.max(0, inst.intensityScore - def.decayPerWeek - extraRecoveryDecay));
    }

    const fadeFloor = def.intensityThresholds.subtle * 0.55;
    if (nextScore < fadeFloor) {
      if (recordLogs) {
        pendingLogs.push({
          category: 'trait',
          title: `นิสัย "${def.nameTh}" จางหายไปตามเวลา`,
          description: def.isNegative
            ? `พฤติกรรมใหม่และการฟื้นตัวทำให้คุณสลัดนิสัย ${def.nameTh} ออกไปได้แล้ว`
            : `พฤติกรรมที่หนุนนิสัย ${def.nameTh} ลดลงต่อเนื่องจนจางหายไป`,
          explainReason: def.recoveryEvidenceKey && recoveryBoost > 1
            ? `ปรับพฤติกรรมใหม่ด้วยการ${translateEvidenceKey(def.recoveryEvidenceKey)}อย่างสม่ำเสมอ จนนิสัยเดิมค่อยๆ จางลง`
            : 'ไม่ได้แสดงพฤติกรรมด้านนี้อย่างต่อเนื่อง นิสัยนี้จึงค่อยๆ จางหายไปตามเวลา',
        });
      }
      continue;
    }

    const nextIntensity = intensityFromScore(nextScore, def) ?? 'subtle';
    if (nextIntensity !== inst.intensity && recordLogs) {
      const grew = TRAIT_INTENSITY_META[nextIntensity].multiplier > TRAIT_INTENSITY_META[inst.intensity].multiplier;
      pendingLogs.push({
        category: 'trait',
        title: `นิสัย "${def.nameTh}" ${grew ? 'เข้มข้นขึ้นเป็นระดับ' : 'อ่อนลงเป็นระดับ'} ${TRAIT_INTENSITY_META[nextIntensity].labelTh}`,
        description: def.descriptionTh,
        explainReason: grew
          ? formatEvidenceExplain(def, evidence, stageDef.sensitiveMultiplier * def.sensitiveStageBonus)
          : `ช่วงหลังไม่ค่อยได้แสดงพฤติกรรมด้านนี้ ระดับความชัดจึงค่อยๆ อ่อนลงเป็น${TRAIT_INTENSITY_META[nextIntensity].labelTh}`,
      });
    }

    updatedTraits.push({
      ...inst,
      intensity: nextIntensity,
      intensityScore: nextScore,
      lastReinforcedDay: effectiveEvidenceScore > inst.intensityScore ? next.date.totalDays : inst.lastReinforcedDay,
    });
  }
  currentTraits = updatedTraits;

  // Check new trait formations
  const existingIds = new Set(currentTraits.map((t) => t.id));
  for (const def of TRAIT_CATALOG) {
    if (existingIds.has(def.id)) continue;
    if (!stageDef.eligibleCategories.includes(def.category)) continue;
    if (!meetsLayerGates(def, temp, pers)) continue;

    const totalMultiplier = stageDef.sensitiveMultiplier * def.sensitiveStageBonus;
    let totalWeighted = 0;
    let allReqsMet = true;

    for (const req of def.evidenceReqs) {
      const val = getEvidenceValue(evidence, req.key);
      const effectiveVal = val * totalMultiplier;
      totalWeighted += effectiveVal;
      if (effectiveVal < req.min) {
        allReqsMet = false;
        break;
      }
    }

    if (!allReqsMet) continue;

    // Small seeded variance near threshold (0.94..1.06)
    const r = randRange(next.rngState, 0.94, 1.06);
    next = { ...next, rngState: r.rngState };
    const scored = round2(totalWeighted * r.value);

    if (scored < def.intensityThresholds.subtle) continue;

    const intensity = intensityFromScore(scored, def) ?? 'subtle';
    const explainReason = formatEvidenceExplain(def, evidence, totalMultiplier);
    const originStory = `ก่อตัวจากพฤติกรรมซ้ำๆ ในช่วง${stageDef.labelTh} (อายุ ${character.ageYears} ปี)`;

    currentTraits.push({
      id: def.id,
      intensity,
      intensityScore: scored,
      visibility: def.defaultVisibility,
      formedAtAge: character.ageYears,
      formedAtDay: next.date.totalDays,
      originStory,
      evidenceReason: explainReason,
      lastReinforcedDay: next.date.totalDays,
    });
    existingIds.add(def.id);

    if (recordLogs) {
      pendingLogs.push({
        category: 'trait',
        title: def.defaultVisibility === 'hidden_to_self'
          ? `บางอย่างในตัวคุณเริ่มเปลี่ยนไป (แฝงลึก)`
          : `ก่อเกิดนิสัยใหม่: ${def.nameTh} (${TRAIT_INTENSITY_META[intensity].labelTh})`,
        description: def.defaultVisibility === 'hidden_to_self' ? def.subtleHintTh : def.descriptionTh,
        explainReason: def.defaultVisibility === 'hidden_to_self'
          ? 'พฤติกรรมสะสมก่อตัวเป็นนิสัยที่เจ้าตัวยังไม่ทันสังเกตเห็นชัด'
          : explainReason,
      });
    }
  }

  const innerTension = computeInnerTensionFromTraits(currentTraits);
  const reputationView = computeReputationFromTraits(currentTraits, pers);
  const traitsTags = buildTraitTagList(character.background.temperament, currentTraits);

  next = {
    ...next,
    character: {
      ...next.character,
      emergentTraits: currentTraits,
      innerTension,
      reputationView,
      traits: traitsTags,
    },
  };

  for (const log of pendingLogs) {
    next = pushTraitTimeline(next, log);
  }

  return next;
}

/**
 * Turning Point: immediately creates or upgrades a trait and sets originStory,
 * bypassing normal gradual personality gates.
 */
export function applyTurningPoint(
  state: GameState,
  kind: string,
  _seed?: number
): GameState {
  let next = state;
  let def = TURNING_POINTS_BY_KIND.get(kind);
  if (!def) {
    const picked = pickOne(next.rngState, TURNING_POINT_DEFS);
    def = picked.value;
    next = { ...next, rngState: picked.rngState };
  }

  const age = next.character.ageYears;
  const originStory = def.originStoryTemplate.replace('{age}', String(age));
  const pers: PersonalityAxes = { ...(next.character.personality ?? { ambition: 50, agreeableness: 50, stability: 50 }) };

  if (def.personalityDelta) {
    for (const [ax, delta] of Object.entries(def.personalityDelta)) {
      const k = ax as PersonalityAxisKey;
      pers[k] = round2(clamp(pers[k] + (delta ?? 0), 5, 95));
    }
  }

  if (def.evidenceDelta) {
    next = recordEvidenceBatch(next, def.evidenceDelta, { reason: def.titleTh });
  }

  let traits = [...(next.character.emergentTraits ?? [])];
  if (def.removeTraitIds && def.removeTraitIds.length > 0) {
    const remSet = new Set(def.removeTraitIds);
    traits = traits.filter((t) => !remSet.has(t.id));
  }

  if (def.addTraitId) {
    const traitMeta = TRAITS_BY_ID.get(def.addTraitId);
    if (traitMeta) {
      const targetIntensity = def.boostIntensity ?? 'clear';
      const targetScore = traitMeta.intensityThresholds[targetIntensity] + 3;
      const existingIdx = traits.findIndex((t) => t.id === def.addTraitId);
      if (existingIdx >= 0) {
        const cur = traits[existingIdx];
        const nextScore = Math.max(cur.intensityScore + 8, targetScore);
        const nextInt = intensityFromScore(nextScore, traitMeta) ?? targetIntensity;
        traits[existingIdx] = {
          ...cur,
          intensity: nextInt,
          intensityScore: round2(clamp(nextScore, 0, 100)),
          visibility: 'known',
          originStory,
          evidenceReason: `จุดเปลี่ยนชีวิต: ${def.titleTh}`,
          lastReinforcedDay: next.date.totalDays,
        };
      } else {
        traits.push({
          id: traitMeta.id,
          intensity: targetIntensity,
          intensityScore: targetScore,
          visibility: 'known',
          formedAtAge: age,
          formedAtDay: next.date.totalDays,
          originStory,
          evidenceReason: `จุดเปลี่ยนชีวิต: ${def.titleTh}`,
          lastReinforcedDay: next.date.totalDays,
        });
      }
    }
  }

  const nextStress = def.stressDelta
    ? round2(clamp(next.character.resources.stress + def.stressDelta, 0, 100))
    : next.character.resources.stress;

  const innerTension = computeInnerTensionFromTraits(traits);
  const reputationView = computeReputationFromTraits(traits, pers);
  const traitsTags = buildTraitTagList(next.character.background.temperament, traits);

  next = {
    ...next,
    character: {
      ...next.character,
      personality: pers,
      emergentTraits: traits,
      innerTension,
      reputationView,
      traits: traitsTags,
      resources: {
        ...next.character.resources,
        stress: nextStress,
      },
    },
  };

  next = pushTraitTimeline(next, {
    category: 'trait',
    title: `จุดเปลี่ยนชีวิต: ${def.titleTh}`,
    description: originStory,
    explainReason: `เหตุการณ์จุดเปลี่ยนครั้งสำคัญในชีวิตส่งผลต่อนิสัยและมุมมองของคุณโดยตรง`,
  });

  return next;
}

export function revealTrait(state: GameState, traitId: string, reason: string): GameState {
  const traits = state.character.emergentTraits ?? [];
  const idx = traits.findIndex((t) => t.id === traitId);
  if (idx < 0 || traits[idx].visibility === 'known') return state;

  const def = TRAITS_BY_ID.get(traitId);
  const updated = [...traits];
  updated[idx] = {
    ...updated[idx],
    visibility: 'known',
    evidenceReason: reason || updated[idx].evidenceReason,
  };

  let next: GameState = {
    ...state,
    character: {
      ...state.character,
      emergentTraits: updated,
    },
  };

  if (def) {
    next = pushTraitTimeline(next, {
      category: 'trait',
      title: `ตระหนักรู้ถึงนิสัยในตัว: ${def.nameTh}`,
      description: `คุณเพิ่งสังเกตเห็นชัดว่าตัวเองมีนิสัย "${def.nameTh}" (${reason})`,
      explainReason: reason,
    });
  }

  return next;
}

export function explainTrait(state: GameState, traitId: string): {
  titleTh: string;
  originStory: string;
  evidenceReason: string;
  recoveryPathTh: string;
  intensityLabel: string;
} | null {
  const inst = (state.character.emergentTraits ?? []).find((t) => t.id === traitId);
  const def = TRAITS_BY_ID.get(traitId);
  if (!inst || !def) return null;

  if (inst.visibility === 'hidden_to_self') {
    return {
      titleTh: 'แนวโน้มแฝงที่ยังไม่รู้ตัว',
      originStory: 'คุณยังไม่ทันสังเกตเห็นต้นตอของความเคยชินนี้อย่างชัดเจน',
      evidenceReason: def.subtleHintTh,
      recoveryPathTh: 'ลองสังเกตจังหวะการตัดสินใจและอารมณ์ของตัวเองในแต่ละสัปดาห์',
      intensityLabel: 'แฝงลึก',
    };
  }

  return {
    titleTh: def.nameTh,
    originStory: inst.originStory,
    evidenceReason: inst.evidenceReason,
    recoveryPathTh: def.recoveryPathTh,
    intensityLabel: TRAIT_INTENSITY_META[inst.intensity].labelTh,
  };
}
