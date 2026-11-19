import {
  DROPOUT_CRISIS_CONFIG,
  EDUCATION_SYSTEM_RULES,
  FINE_ART_TRACK_CHOICES,
  GPA_FORMULA_CONFIG,
  HIGH_SCHOOL_TRACKS,
  READINESS_META,
  ROTC_RULES,
  SCHOOL_TIER_ORDER,
  SCHOOL_TIERS,
  SCHOOL_TRANSFER_CONFIG,
  SECOND_CHANCE_PROGRAMS,
  TRACK_CHANGE_FEES,
  TRACK_READINESS_RULES,
  VOCATIONAL_BRANCHES,
} from '../data/education';
import { EDUCATION_LABELS, EDUCATION_RANK, SKILL_LABELS } from '../data/thaiData';
import { UI_TEXT } from '../data/uiText';
import { formatShortThaiDate } from './clock';
import { appendTimeline } from './log';
import { clamp, nextRandom, round2 } from './rng';
import { getActiveTalents } from './talents';
import type {
  DiscoveredSkillId,
  EducationLevel,
  EducationState,
  EventChoice,
  FamilyWealthTier,
  GameState,
  GpaTermRecord,
  HighSchoolTrack,
  LifeHistoryEntry,
  PendingEventPrompt,
  PendingSchoolTransfer,
  ReadinessLevel,
  SchoolTier,
  SecondChanceEduType,
  SkillKey,
  SkillLevelState,
  VocationalBranchId,
} from './types';

function emptySkillStatesRecord(): Record<SkillKey, SkillLevelState> {
  const mk = (): SkillLevelState => ({ level: 1, xp: 0, unlockedTier: 1, certificates: [] });
  return {
    academic: mk(),
    tech: mk(),
    craft: mk(),
    social: mk(),
    business: mk(),
    athletics: mk(),
    foreign_lang: mk(),
    culinary: mk(),
    visual_arts: mk(),
    music_vocal: mk(),
    performing_acting: mk(),
    dance_thai_modern: mk(),
    literature_writing: mk(),
  };
}

export function pushLifeHistory(
  state: GameState,
  entry: {
    id: string;
    kind: string;
    titleTh: string;
    detailTh?: string;
    ageYears?: number;
    ageMonths?: number;
    dateLabel?: string;
  }
): GameState {
  const existing = state.character.lifeHistory ?? [];
  if (existing.some((item) => item.id === entry.id)) {
    return state;
  }
  const fullEntry: LifeHistoryEntry = {
    id: entry.id,
    ageYears: entry.ageYears ?? state.character.ageYears,
    ageMonths: entry.ageMonths ?? state.date.month,
    dateLabel: entry.dateLabel ?? formatShortThaiDate(state.date),
    kind: entry.kind,
    titleTh: entry.titleTh,
    detailTh: entry.detailTh,
  };
  const nextList = [fullEntry, ...existing].slice(0, 100);
  return {
    ...state,
    character: {
      ...state.character,
      lifeHistory: nextList,
    },
  };
}

export function isDropoutCrisisEligible(state: GameState): boolean {
  const wealth = state.character.background.familyWealth;
  if (DROPOUT_CRISIS_CONFIG.poorWealthTiers.includes(wealth)) return true;
  if (state.economy.debt >= DROPOUT_CRISIS_CONFIG.highDebtThreshold) return true;
  const schoolTier = state.character.educationState?.schoolTier ?? 'school_public';
  const annualFee = (SCHOOL_TIERS[schoolTier]?.monthlyFeeThb ?? 0) * 12;
  const estIncome = SCHOOL_TRANSFER_CONFIG.estimatedAnnualIncomeByWealth[wealth] ?? 240000;
  if (annualFee > estIncome * DROPOUT_CRISIS_CONFIG.annualTuitionAffordabilityRatio) {
    return true;
  }
  return false;
}

export function evaluateTrackReadiness(
  state: GameState,
  track: HighSchoolTrack,
  vocationalBranch?: VocationalBranchId
): {
  level: ReadinessLevel;
  missingCriteria: string[];
  recommendedGpax: number;
  checksSummary: string[];
} {
  const rule = TRACK_READINESS_RULES[track];
  const curEdu = state.character.educationState;
  const gpax = curEdu?.cumulativeGpa ?? curEdu?.currentGpa ?? 2.75;
  const skills = state.character.skills;

  const missingCriteria: string[] = [];
  const checksSummary: string[] = [];

  if (gpax < rule.recommendedGpax) {
    missingCriteria.push(`GPAX ต่ำกว่าเกณฑ์ (${gpax.toFixed(2)} / ${rule.recommendedGpax.toFixed(2)})`);
  } else {
    checksSummary.push(`GPAX ผ่าน (${gpax.toFixed(2)} >= ${rule.recommendedGpax.toFixed(2)})`);
  }

  for (const check of rule.skillChecks) {
    if (track === 'vocational' && vocationalBranch) {
      const targetSkill = vocationalBranch as unknown as SkillKey;
      const skillScore = skills[targetSkill] ?? 0;
      const skillName = SKILL_LABELS[targetSkill]?.label ?? targetSkill;
      if (skillScore < check.minScore) {
        missingCriteria.push(`${skillName} ยังไม่ถึงเกณฑ์ (${Math.floor(skillScore)} / ${check.minScore})`);
      } else {
        checksSummary.push(`${skillName} ผ่าน (${Math.floor(skillScore)} >= ${check.minScore})`);
      }
      continue;
    }

    if (check.anyOf) {
      let bestSkill = check.skills[0];
      let bestScore = -1;
      for (const sk of check.skills) {
        const sc = skills[sk] ?? 0;
        if (sc > bestScore) {
          bestScore = sc;
          bestSkill = sk;
        }
      }
      if (bestScore < check.minScore) {
        missingCriteria.push(`${check.labelTh} (สูงสุดตอนนี้ ${Math.floor(Math.max(0, bestScore))})`);
      } else {
        const bestName = SKILL_LABELS[bestSkill]?.label ?? bestSkill;
        checksSummary.push(`${bestName} ผ่าน (${Math.floor(bestScore)} >= ${check.minScore})`);
      }
    } else {
      for (const sk of check.skills) {
        const skillScore = skills[sk] ?? 0;
        const skillName = SKILL_LABELS[sk]?.label ?? sk;
        if (skillScore < check.minScore) {
          missingCriteria.push(`${skillName} ยังไม่ถึงเกณฑ์ (${Math.floor(skillScore)} / ${check.minScore})`);
        } else {
          checksSummary.push(`${skillName} ผ่าน (${Math.floor(skillScore)} >= ${check.minScore})`);
        }
      }
    }
  }

  let level: ReadinessLevel = 'ready';
  if (missingCriteria.length === 1) {
    level = 'risky';
  } else if (missingCriteria.length >= 2) {
    level = 'very_risky';
  }

  return {
    level,
    missingCriteria,
    recommendedGpax: rule.recommendedGpax,
    checksSummary,
  };
}

export function createInitialEducationState(
  ageYears: number,
  education: EducationLevel,
  wealth: FamilyWealthTier,
  rngState: number
): { rngState: number; educationState: EducationState } {
  let rng = rngState;

  const tierRoll = nextRandom(rng);
  rng = tierRoll.rngState;
  let schoolTier: SchoolTier = 'school_public';
  if (wealth === 'wealthy') {
    schoolTier = tierRoll.value < 0.45 ? 'school_international' : 'school_private';
  } else if (wealth === 'upper_middle') {
    schoolTier =
      tierRoll.value < 0.15 ? 'school_international' : tierRoll.value < 0.7 ? 'school_private' : 'school_public';
  } else if (wealth === 'middle' || wealth === 'lower_middle') {
    schoolTier = tierRoll.value < 0.2 ? 'school_private' : 'school_public';
  } else {
    schoolTier = tierRoll.value < 0.35 ? 'school_temple' : 'school_public';
  }

  const gpaRoll = nextRandom(rng);
  rng = gpaRoll.rngState;
  const baseGpa = round2(clamp(2.4 + gpaRoll.value * 1.15, 1.8, 3.85));

  const trackRoll = nextRandom(rng);
  rng = trackRoll.rngState;
  let highSchoolTrack: HighSchoolTrack | undefined;
  let fineArtSkill: DiscoveredSkillId | undefined;
  let vocationalBranch: VocationalBranchId | undefined;

  if (ageYears >= 15 && EDUCATION_RANK[education] >= EDUCATION_RANK.lower_secondary) {
    const tracks: HighSchoolTrack[] = ['sci_math', 'arts_math', 'arts_lang', 'arts_fine', 'vocational'];
    highSchoolTrack = tracks[Math.floor(trackRoll.value * tracks.length) % tracks.length];
    if (highSchoolTrack === 'arts_fine') {
      const artRoll = nextRandom(rng);
      rng = artRoll.rngState;
      fineArtSkill = FINE_ART_TRACK_CHOICES[Math.floor(artRoll.value * FINE_ART_TRACK_CHOICES.length)];
    } else if (highSchoolTrack === 'vocational') {
      const vocRoll = nextRandom(rng);
      rng = vocRoll.rngState;
      vocationalBranch = VOCATIONAL_BRANCHES[Math.floor(vocRoll.value * VOCATIONAL_BRANCHES.length)]?.id ?? 'craft';
    }
  }

  const rotcRoll = nextRandom(rng);
  rng = rotcRoll.rngState;
  const completedRotc =
    ageYears >= 18 && EDUCATION_RANK[education] >= EDUCATION_RANK.upper_secondary && rotcRoll.value < 0.25;

  return {
    rngState: rng,
    educationState: {
      level: education,
      schoolTier,
      highSchoolTrack,
      fineArtSkill,
      vocationalBranch,
      trackReadiness: 'ready',
      readinessTermsRemaining: 0,
      trackAdjustmentTermsRemaining: 0,
      teacherTermDelta: 0,
      trackChangeCountThisYear: 0,
      gpaHistory: [],
      pendingTransfer: null,
      currentGpa: baseGpa,
      cumulativeGpa: baseGpa,
      termCount: ageYears >= 7 ? Math.max(1, (ageYears - 6) * 2) : 0,
      scholarshipMinGpa: null,
      hasScholarship: false,
      hasStudentLoan: false,
      completedRotc,
      rotcEnrolled: false,
      rotcYearsCompleted: completedRotc ? 3 : 0,
      remedialDue: false,
      secondChanceEnrolled: null,
      secondChanceProgressTerms: 0,
      tcasExamScore: null,
    },
  };
}

export function discoverSkillOnState(
  state: GameState,
  skillId: DiscoveredSkillId,
  announce = true
): GameState {
  const existing = state.skillTraining?.discoveredSkills ?? [];
  if (existing.includes(skillId)) return state;
  const skillLabel = SKILL_LABELS[skillId]?.label ?? skillId;

  let next: GameState = {
    ...state,
    skillTraining: state.skillTraining
      ? {
          ...state.skillTraining,
          discoveredSkills: [...existing, skillId],
        }
      : {
          focus: [],
          course: null,
          skillStates: emptySkillStatesRecord(),
          xp: {
            academic: 0,
            tech: 0,
            craft: 0,
            social: 0,
            business: 0,
            athletics: 0,
            foreign_lang: 0,
            culinary: 0,
            visual_arts: 0,
            music_vocal: 0,
            performing_acting: 0,
            dance_thai_modern: 0,
            literature_writing: 0,
          },
          lastPracticedWeek: {
            academic: 0,
            tech: 0,
            craft: 0,
            social: 0,
            business: 0,
            athletics: 0,
            foreign_lang: 0,
            culinary: 0,
            visual_arts: 0,
            music_vocal: 0,
            performing_acting: 0,
            dance_thai_modern: 0,
            literature_writing: 0,
          },
          discoveredSkills: [...existing, skillId],
        },
  };

  if (announce) {
    next = {
      ...next,
      activeToast: {
        id: `toast_disc_${skillId}_${state.date.totalDays}`,
        title: UI_TEXT.PHASE331.skillDiscoveredToastTitle,
        description: UI_TEXT.PHASE331.skillDiscoveredToastDesc(skillLabel),
        tier: 'T1',
        category: 'milestone',
        expiresAtTotalDay: state.date.totalDays + 10,
      },
    };
    next = appendTimeline(next, {
      category: 'life',
      tier: 'T1',
      title: UI_TEXT.PHASE331.skillDiscoveredToastTitle,
      description: UI_TEXT.PHASE331.skillDiscoveredToastDesc(skillLabel),
    });
  }

  return next;
}

export function canTransferSchoolTier(state: GameState): { allowed: boolean; reasonTh?: string } {
  if (!EDUCATION_SYSTEM_RULES.summerTransferMonths.includes(state.date.month)) {
    return {
      allowed: false,
      reasonTh: 'ยื่นขอย้ายสถานศึกษาได้เฉพาะช่วงปิดเทอมใหญ่ (มีนาคม–เมษายน) เท่านั้น',
    };
  }
  if (state.economy.jobId !== 'student') {
    return {
      allowed: false,
      reasonTh: 'ต้องกำลังศึกษาอยู่ในสถานศึกษาจึงจะเปลี่ยนประเภทโรงเรียนได้',
    };
  }
  return { allowed: true };
}

export function requestSchoolTransfer(
  state: GameState,
  targetTier: SchoolTier,
  bypassMonthCheck = false
): { accepted: boolean; state: GameState; message: string } {
  if (!bypassMonthCheck) {
    const check = canTransferSchoolTier(state);
    if (!check.allowed) {
      return { accepted: false, state, message: check.reasonTh ?? 'ยังไม่สามารถยื่นขอย้ายสถานศึกษาได้' };
    }
  }
  const curEdu = state.character.educationState;
  if (!curEdu) {
    return { accepted: false, state, message: 'ไม่พบข้อมูลการศึกษา' };
  }
  if (curEdu.schoolTier === targetTier) {
    return { accepted: false, state, message: 'กำลังศึกษาอยู่ในสถานศึกษาประเภทนี้อยู่แล้ว' };
  }
  if (curEdu.pendingTransfer) {
    return { accepted: false, state, message: 'มีคำร้องขอย้ายสถานศึกษาที่อยู่ระหว่างการพิจารณา' };
  }

  // Calculate success probability per spec 07 §2.1.1
  const baseProb = SCHOOL_TRANSFER_CONFIG.baseProb;
  const wealth = state.character.background.familyWealth;
  const wealthMod = SCHOOL_TRANSFER_CONFIG.wealthBonus[wealth] ?? 0;
  const gpax = curEdu.cumulativeGpa ?? curEdu.currentGpa ?? 2.75;
  const gpaMod = (gpax - 2.5) * 0.15;
  const debtPenalty =
    state.economy.debt > 0
      ? Math.min(SCHOOL_TRANSFER_CONFIG.maxDebtPenalty, (state.economy.debt / 50000) * 0.2)
      : 0;

  const currentFee = SCHOOL_TIERS[curEdu.schoolTier].monthlyFeeThb;
  const targetFee = SCHOOL_TIERS[targetTier].monthlyFeeThb;
  const feeDiff = targetFee - currentFee;
  const feePenalty = feeDiff > 0 ? Math.min(SCHOOL_TRANSFER_CONFIG.maxFeeDiffPenalty, (feeDiff / 10000) * 0.25) : 0;

  const chance = clamp(
    baseProb + wealthMod + gpaMod - debtPenalty - feePenalty,
    SCHOOL_TRANSFER_CONFIG.minProb,
    SCHOOL_TRANSFER_CONFIG.maxProb
  );

  const roll = nextRandom(state.seed + state.date.totalDays);
  const waitDays = Math.round(
    SCHOOL_TRANSFER_CONFIG.waitMinDays +
      roll.value * (SCHOOL_TRANSFER_CONFIG.waitMaxDays - SCHOOL_TRANSFER_CONFIG.waitMinDays)
  );

  const pending: PendingSchoolTransfer = {
    targetTier,
    requestedDay: state.date.totalDays,
    dueDay: state.date.totalDays + waitDays,
    probability: round2(chance),
    yearCE: state.date.yearCE,
  };

  const targetMeta = SCHOOL_TIERS[targetTier];
  let next: GameState = {
    ...state,
    seed: roll.rngState,
    character: {
      ...state.character,
      educationState: {
        ...curEdu,
        pendingTransfer: pending,
      },
    },
    activeToast: {
      id: `toast_transfer_req_${state.date.totalDays}`,
      title: 'ยื่นคำร้องขอย้ายสถานศึกษาแล้ว',
      description: `ปรึกษาครอบครัวเพื่อขอย้ายไป "${targetMeta.labelTh}" รอการตัดสินใจประมาณ ${waitDays} วัน`,
      tier: 'T1',
      category: 'milestone',
      expiresAtTotalDay: state.date.totalDays + 7,
    },
  };

  next = appendTimeline(next, {
    category: 'life',
    tier: 'T1',
    title: 'ยื่นคำร้องขอย้ายสถานศึกษา',
    description: `ยื่นเรื่องขอย้ายไป ${targetMeta.labelTh} (โอกาสผ่านราว ${(chance * 100).toFixed(0)}%) รอผล ${waitDays} วัน`,
  });

  return {
    accepted: true,
    state: next,
    message: `ยื่นคำร้องขอย้ายไป${targetMeta.labelTh}แล้ว รอผลพิจารณา`,
  };
}

export function resolvePendingSchoolTransfer(state: GameState): GameState {
  const curEdu = state.character.educationState;
  const pending = curEdu?.pendingTransfer;
  if (!curEdu || !pending) return state;

  const roll = nextRandom(state.seed + state.date.totalDays);
  const success = roll.value < pending.probability;
  const targetMeta = SCHOOL_TIERS[pending.targetTier];

  if (success) {
    let next: GameState = {
      ...state,
      seed: roll.rngState,
      character: {
        ...state.character,
        educationState: {
          ...curEdu,
          schoolTier: pending.targetTier,
          pendingTransfer: null,
        },
      },
      activeToast: {
        id: `toast_transfer_pass_${state.date.totalDays}`,
        title: 'ครอบครัวอนุมัติการย้ายสถานศึกษา',
        description: `ย้ายเข้าเรียน "${targetMeta.labelTh}" เรียบร้อยแล้ว`,
        tier: 'T1',
        category: 'milestone',
        expiresAtTotalDay: state.date.totalDays + 14,
      },
    };
    if (targetMeta.autoDiscoversForeignLang) {
      next = discoverSkillOnState(next, 'foreign_lang', true);
    }
    next = appendTimeline(next, {
      category: 'milestone',
      tier: 'T2',
      title: 'ย้ายสถานศึกษาสำเร็จ',
      description: `ครอบครัวเห็นชอบ ย้ายเข้าเรียนที่ "${targetMeta.labelTh}" อย่างเป็นทางการ`,
    });
    next = pushLifeHistory(next, {
      id: `transfer_school_${state.date.totalDays}`,
      kind: 'school_transfer',
      titleTh: `ย้ายสถานศึกษา: ${targetMeta.labelTh}`,
      detailTh: `เปลี่ยนมาเรียนที่ ${targetMeta.labelTh}`,
    });
    return next;
  }

  let next: GameState = {
    ...state,
    seed: roll.rngState,
    character: {
      ...state.character,
      educationState: {
        ...curEdu,
        pendingTransfer: null,
      },
    },
    activeToast: {
      id: `toast_transfer_fail_${state.date.totalDays}`,
      title: 'ครอบครัวยังไม่อนุมัติการย้ายโรงเรียน',
      description: 'เนื่องจากภาระค่าใช้จ่ายหรือจังหวะครอบครัว ยังคงเรียนต่อที่เดิม',
      tier: 'T1',
      category: 'milestone',
      expiresAtTotalDay: state.date.totalDays + 10,
    },
  };
  next = appendTimeline(next, {
    category: 'life',
    tier: 'T1',
    title: 'คำขอย้ายโรงเรียนไม่ผ่าน',
    description: `ครอบครัวยังไม่พร้อมสนับสนุนการย้ายไป ${targetMeta.labelTh} ในรอบนี้`,
  });
  return next;
}

export function requestTrackChange(
  state: GameState,
  track: HighSchoolTrack,
  fineArtSkill?: DiscoveredSkillId,
  vocationalBranch?: VocationalBranchId,
  options?: { allowVeryRisky?: boolean; bypassMonthCheck?: boolean }
): { accepted: boolean; state: GameState; message: string } {
  const age = state.character.ageYears;
  if (state.economy.jobId !== 'student' || age < 15 || age >= 19) {
    return {
      accepted: false,
      state,
      message: 'เลือกหรือเปลี่ยนแผนการเรียนได้เมื่อศึกษาอยู่ระดับ ม.ปลาย (อายุ 15–18 ปี)',
    };
  }

  const curEdu = state.character.educationState;
  if (!curEdu) {
    return { accepted: false, state, message: 'ไม่พบข้อมูลการศึกษา' };
  }

  const isSummer = EDUCATION_SYSTEM_RULES.summerTransferMonths.includes(state.date.month);
  const isInitial = !curEdu.highSchoolTrack;

  if (!options?.bypassMonthCheck && !isSummer && !isInitial) {
    return {
      accepted: false,
      state,
      message: 'เปลี่ยนแผนการเรียนได้เฉพาะช่วงปิดเทอมใหญ่ (มีนาคม–เมษายน) เท่านั้น',
    };
  }

  const sameYearChanges =
    curEdu.trackChangeLastYearCE === state.date.yearCE ? (curEdu.trackChangeCountThisYear ?? 0) : 0;

  if (sameYearChanges >= 1 && !isInitial) {
    return {
      accepted: false,
      state,
      message: 'คุณได้ยื่นเปลี่ยนแผนการเรียนไปแล้ว 1 ครั้งในปีการศึกษานี้',
    };
  }

  const readiness = evaluateTrackReadiness(state, track, vocationalBranch);
  if (readiness.level === 'very_risky' && !options?.allowVeryRisky) {
    return {
      accepted: false,
      state,
      message: `ไม่สามารถเลือกสายนี้ได้เนื่องจากความพร้อมเสี่ยงสูงมาก: ${readiness.missingCriteria.join(', ')}`,
    };
  }

  const fee = isInitial ? 0 : TRACK_CHANGE_FEES[curEdu.schoolTier] ?? 500;
  if (!isInitial && state.character.ageYears >= 15 && state.economy.cash < fee) {
    return {
      accepted: false,
      state,
      message: `เงินสดไม่พอจ่ายค่าธรรมเนียมเปลี่ยนสายการเรียน (${fee.toLocaleString('th-TH')} บาท)`,
    };
  }

  const chosenFineArt =
    track === 'arts_fine'
      ? fineArtSkill && FINE_ART_TRACK_CHOICES.includes(fineArtSkill)
        ? fineArtSkill
        : 'visual_arts'
      : undefined;

  const chosenBranch = track === 'vocational' ? vocationalBranch ?? 'craft' : undefined;

  const nextEdu: EducationState = {
    ...curEdu,
    highSchoolTrack: track,
    fineArtSkill: chosenFineArt,
    vocationalBranch: chosenBranch,
    trackReadiness: readiness.level,
    readinessTermsRemaining: readiness.level !== 'ready' ? GPA_FORMULA_CONFIG.readinessDurationTerms : 0,
    trackAdjustmentTermsRemaining: isInitial ? 0 : GPA_FORMULA_CONFIG.trackAdjustmentDurationTerms,
    trackChangeCountThisYear: sameYearChanges + (isInitial ? 0 : 1),
    trackChangeLastYearCE: isInitial ? curEdu.trackChangeLastYearCE : state.date.yearCE,
  };

  let next: GameState = {
    ...state,
    economy: {
      ...state.economy,
      cash: Math.max(0, state.economy.cash - fee),
    },
    character: {
      ...state.character,
      educationState: nextEdu,
    },
  };

  if (track === 'arts_lang') {
    next = discoverSkillOnState(next, 'foreign_lang', true);
  } else if (track === 'arts_fine' && chosenFineArt) {
    next = discoverSkillOnState(next, chosenFineArt, true);
  } else if (track === 'vocational' && chosenBranch) {
    next = discoverSkillOnState(next, chosenBranch as unknown as DiscoveredSkillId, true);
  }

  const meta = HIGH_SCHOOL_TRACKS[track];
  const trackLabel = meta?.labelTh ?? track;
  const branchLabel = chosenBranch
    ? ` (${VOCATIONAL_BRANCHES.find((b) => b.id === chosenBranch)?.labelTh ?? chosenBranch})`
    : '';

  next = appendTimeline(next, {
    category: 'milestone',
    tier: 'T2',
    title: isInitial ? 'เลือกแผนการเรียน ม.ปลาย' : 'ย้ายแผนการเรียน ม.ปลาย',
    description: `เข้าสู่แผนการเรียน "${trackLabel}"${branchLabel} [ความพร้อม: ${READINESS_META[readiness.level].labelTh}]`,
  });

  next = pushLifeHistory(next, {
    id: `track_change_${state.date.totalDays}`,
    kind: 'track_change',
    titleTh: isInitial ? `เลือกสายเรียน: ${trackLabel}` : `เปลี่ยนสายเรียน: ${trackLabel}`,
    detailTh: `${trackLabel}${branchLabel} · ความพร้อม: ${READINESS_META[readiness.level].labelTh}`,
  });

  return {
    accepted: true,
    state: next,
    message: `เลือกแผนการเรียน ${trackLabel}${branchLabel} เรียบร้อยแล้ว`,
  };
}

export function applyChooseHighSchoolTrack(
  state: GameState,
  track: HighSchoolTrack,
  fineArtSkill?: DiscoveredSkillId,
  vocationalBranch?: VocationalBranchId
): { accepted: boolean; state: GameState; message: string } {
  return requestTrackChange(state, track, fineArtSkill, vocationalBranch);
}

export function applyChangeSchoolTier(
  state: GameState,
  schoolTier: SchoolTier
): { accepted: boolean; state: GameState; message: string } {
  return requestSchoolTransfer(state, schoolTier);
}

export function applyEnrollRotc(
  state: GameState,
  enroll: boolean
): { accepted: boolean; state: GameState; message: string } {
  const age = state.character.ageYears;
  const curEdu = state.character.educationState;
  if (!curEdu) {
    return { accepted: false, state, message: 'ไม่พบข้อมูลการศึกษา' };
  }
  if (curEdu.completedRotc) {
    return { accepted: false, state, message: 'คุณเรียนจบ รด. ครบ 3 ปีแล้ว' };
  }
  if (!enroll) {
    const next: GameState = {
      ...state,
      character: {
        ...state.character,
        educationState: {
          ...curEdu,
          rotcEnrolled: false,
        },
      },
    };
    return { accepted: true, state: next, message: 'ถอนตัวจากการฝึก รด. แล้ว' };
  }

  if (
    state.economy.jobId !== 'student' ||
    age < EDUCATION_SYSTEM_RULES.rotcStartMinAge ||
    age > EDUCATION_SYSTEM_RULES.rotcStartMaxAge
  ) {
    return {
      accepted: false,
      state,
      message: 'สมัครเรียน รด. ได้เฉพาะนักเรียน ม.ปลาย (อายุ 15–17 ปี)',
    };
  }

  const gender = state.character.gender;
  if (gender === 'male') {
    const physical = (state.character.rawStats.strength + state.character.rawStats.endurance) / 2;
    if (physical < ROTC_RULES.maleAutoPassMinPhysical) {
      return {
        accepted: false,
        state,
        message: `สมรรถภาพร่างกายยังไม่ถึงเกณฑ์ตรวจคัดเลือก รด. (ความแข็งแรง+ความอึดเฉลี่ย ${physical.toFixed(0)} / ${ROTC_RULES.maleAutoPassMinPhysical})`,
      };
    }
  } else {
    const roll = nextRandom(state.seed + state.date.totalDays);
    const athleticsBonus = Math.min(
      ROTC_RULES.femaleModifierMax,
      ((state.character.skills.athletics ?? 0) / 100) * 0.1
    );
    const passChance = ROTC_RULES.femaleBasePassChance + athleticsBonus;
    if (roll.value >= passChance) {
      const nextState = { ...state, seed: roll.rngState };
      return {
        accepted: false,
        state: nextState,
        message: 'การทดสอบสมรรถภาพ รด. หญิง รอบนี้คะแนนยังไม่ผ่านเกณฑ์การคัดเลือก',
      };
    }
  }

  let next: GameState = {
    ...state,
    character: {
      ...state.character,
      educationState: {
        ...curEdu,
        rotcEnrolled: true,
      },
    },
  };

  next = appendTimeline(next, {
    category: 'milestone',
    tier: 'T1',
    title: 'สมัครเรียน รด. สำเร็จ',
    description: 'ผ่านการทดสอบสมรรถภาพและลงทะเบียนเรียนนักศึกษาวิชาทหาร (ปี 1) เรียบร้อยแล้ว',
  });

  next = pushLifeHistory(next, {
    id: `rotc_enroll_${state.date.totalDays}`,
    kind: 'rotc',
    titleTh: 'สมัครเรียน รด.',
    detailTh: 'เริ่มการฝึกนักศึกษาวิชาทหาร (ปี 1)',
  });

  return {
    accepted: true,
    state: next,
    message: 'สมัครเรียน รด. ผ่านการคัดเลือกเรียบร้อยแล้ว',
  };
}

export function applyEnrollSecondChanceEdu(
  state: GameState,
  program: SecondChanceEduType | null
): { accepted: boolean; state: GameState; message: string } {
  const curEdu: EducationState = state.character.educationState ?? {
    level: state.character.education,
    schoolTier: 'school_public',
    currentGpa: 2.75,
    cumulativeGpa: 2.75,
    termCount: 1,
    hasStudentLoan: false,
    completedRotc: false,
  };

  if (!program) {
    return {
      accepted: true,
      state: {
        ...state,
        character: {
          ...state.character,
          educationState: {
            ...curEdu,
            secondChanceEnrolled: null,
            secondChanceProgressTerms: 0,
          },
        },
      },
      message: 'พักการเรียนนอกเวลาชั่วคราวแล้ว',
    };
  }

  const meta = SECOND_CHANCE_PROGRAMS[program];
  if (state.character.ageYears < meta.requiredMinAge) {
    return {
      accepted: false,
      state,
      message: `${meta.labelTh} เปิดรับตั้งแต่อายุ ${meta.requiredMinAge} ปีขึ้นไป`,
    };
  }
  if (state.economy.jobId === 'student') {
    return {
      accepted: false,
      state,
      message: 'กำลังศึกษาอยู่ในระบบปกติอยู่แล้ว',
    };
  }
  if (EDUCATION_RANK[state.character.education] >= EDUCATION_RANK[meta.targetEducation]) {
    return {
      accepted: false,
      state,
      message: `คุณมีวุฒิการศึกษาถึงระดับ${EDUCATION_LABELS[meta.targetEducation]}แล้ว`,
    };
  }

  let next: GameState = {
    ...state,
    character: {
      ...state.character,
      educationState: {
        ...curEdu,
        secondChanceEnrolled: program,
        secondChanceProgressTerms: 0,
      },
    },
  };

  next = pushLifeHistory(next, {
    id: `second_chance_${program}_${state.date.totalDays}`,
    kind: 'second_chance',
    titleTh: `ลงทะเบียน: ${meta.labelTh}`,
    detailTh: `เริ่มเรียนหลักสูตรเพิ่มวุฒิ ${meta.labelTh}`,
  });

  return {
    accepted: true,
    state: next,
    message: `ลงทะเบียน${meta.labelTh}เรียบร้อยแล้ว (เรียนควบคู่การทำงานได้)`,
  };
}

export function computeTermGpaBreakdown(state: GameState): {
  gpa: number;
  parts: Record<string, number>;
} {
  const { character } = state;
  const eduState = character.educationState;
  const schoolTier = eduState?.schoolTier ?? 'school_public';
  const tierMeta = SCHOOL_TIERS[schoolTier];
  const alloc = state.timeAllocation;

  const isVocational = eduState?.highSchoolTrack === 'vocational';
  const vocationalBranch = eduState?.vocationalBranch ?? 'craft';
  const academicBase = character.skills.academic ?? 0;
  const academicScore = isVocational
    ? 0.5 * academicBase + 0.5 * (character.skills[vocationalBranch as unknown as SkillKey] ?? 0)
    : academicBase;

  const studyWeeklyHours = (alloc?.workOrStudy ?? 30) * 0.15 + (alloc?.selfDev ?? 6);
  const studyBonus = clamp(
    GPA_FORMULA_CONFIG.studyBonusPerHour * (studyWeeklyHours - GPA_FORMULA_CONFIG.studyTargetHoursPerWeek),
    GPA_FORMULA_CONFIG.studyBonusMin,
    GPA_FORMULA_CONFIG.studyBonusMax
  );

  const activeTalents = getActiveTalents(character);
  let rawTalentBonus = 0;
  for (const tal of activeTalents) {
    if (tal.id === 'tal_academic' || tal.id === 'tal_memory' || tal.id === 'tal_genius') {
      rawTalentBonus += GPA_FORMULA_CONFIG.talentBonusByTier[tal.tier] ?? 0.1;
    }
  }
  const talentBonus = Math.min(GPA_FORMULA_CONFIG.talentBonusMax, rawTalentBonus);

  const teacherBonus = clamp(
    eduState?.teacherTermDelta ?? 0,
    GPA_FORMULA_CONFIG.teacherBonusMin,
    GPA_FORMULA_CONFIG.teacherBonusMax
  );

  const stress = character.resources.stress;
  const energy = character.resources.energy;
  const stressPenalty =
    GPA_FORMULA_CONFIG.stressPenaltyMax *
    Math.max(0, (stress - GPA_FORMULA_CONFIG.stressThreshold) / GPA_FORMULA_CONFIG.stressDivisor);
  const energyPenalty =
    GPA_FORMULA_CONFIG.energyPenaltyMax *
    Math.max(0, (GPA_FORMULA_CONFIG.energyThreshold - energy) / GPA_FORMULA_CONFIG.energyDivisor);

  const readinessPenalty =
    (eduState?.readinessTermsRemaining ?? 0) > 0
      ? READINESS_META[eduState?.trackReadiness ?? 'ready']?.penalty ?? 0
      : 0;
  const trackAdjPenalty =
    (eduState?.trackAdjustmentTermsRemaining ?? 0) > 0 ? GPA_FORMULA_CONFIG.trackAdjustmentPenalty : 0;

  const schoolMod = tierMeta?.gpaBonus ?? 0;
  const termSeed = (state.seed ^ ((eduState?.termCount ?? 1) * 7919)) & 0x7fffffff;
  const noiseRoll = nextRandom(termSeed);
  const noise = (noiseRoll.value * 2 - 1) * GPA_FORMULA_CONFIG.noiseAmplitude;

  const rawGpa =
    GPA_FORMULA_CONFIG.baseGpa +
    GPA_FORMULA_CONFIG.academicSlope * academicScore +
    studyBonus +
    talentBonus +
    teacherBonus -
    stressPenalty -
    energyPenalty -
    readinessPenalty -
    trackAdjPenalty +
    schoolMod +
    noise;

  return {
    gpa: round2(clamp(rawGpa, 0, 4.0)),
    parts: {
      base: GPA_FORMULA_CONFIG.baseGpa,
      academic: round2(GPA_FORMULA_CONFIG.academicSlope * academicScore),
      study: round2(studyBonus),
      talent: round2(talentBonus),
      teacher: round2(teacherBonus),
      stress: round2(-stressPenalty),
      energy: round2(-energyPenalty),
      readiness: round2(-readinessPenalty - trackAdjPenalty),
      school: round2(schoolMod),
    },
  };
}

export function computeTermGpaValue(state: GameState): number {
  return computeTermGpaBreakdown(state).gpa;
}

export function evaluateAcademicTermEnd(state: GameState, evaluatedMonth: number): GameState {
  const curEdu: EducationState = state.character.educationState ?? {
    level: state.character.education,
    schoolTier: 'school_public',
    currentGpa: 2.75,
    cumulativeGpa: 2.75,
    termCount: 1,
    hasStudentLoan: false,
    completedRotc: false,
  };

  const isRegularStudent = state.economy.jobId === 'student' && state.character.ageYears >= 6;
  const secondChanceProg = curEdu.secondChanceEnrolled;

  if (!isRegularStudent && !secondChanceProg) {
    return state;
  }

  const termNum: 1 | 2 = evaluatedMonth === 10 ? 1 : 2;
  const breakdown = computeTermGpaBreakdown(state);
  const termGpa = breakdown.gpa;
  const prevTerms = Math.max(0, curEdu.termCount ?? 1);
  const nextTermCount = prevTerms + 1;
  const nextCumulative = round2(
    clamp((curEdu.cumulativeGpa * prevTerms + termGpa) / nextTermCount, 0, 4.0)
  );

  const termRecord: GpaTermRecord = {
    termId: `${state.date.yearCE + 543}-T${termNum}`,
    gpa: termGpa,
    gpax: nextCumulative,
    parts: breakdown.parts,
  };

  const nextGpaHistory = [termRecord, ...(curEdu.gpaHistory ?? [])].slice(
    0,
    GPA_FORMULA_CONFIG.maxGpaHistoryEntries
  );

  let nextEdu: EducationState = {
    ...curEdu,
    currentGpa: termGpa,
    cumulativeGpa: nextCumulative,
    termCount: nextTermCount,
    gpaHistory: nextGpaHistory,
    teacherTermDelta: 0,
    readinessTermsRemaining: Math.max(0, (curEdu.readinessTermsRemaining ?? 0) - 1),
    trackAdjustmentTermsRemaining: Math.max(0, (curEdu.trackAdjustmentTermsRemaining ?? 0) - 1),
  };

  let next: GameState = {
    ...state,
    character: {
      ...state.character,
      educationState: nextEdu,
    },
  };

  if (termGpa < EDUCATION_SYSTEM_RULES.remedialThresholdGpa) {
    nextEdu = { ...nextEdu, remedialDue: true };
    next = {
      ...next,
      character: { ...next.character, educationState: nextEdu },
    };
    next = appendTimeline(next, {
      category: 'life',
      tier: 'T1',
      title: 'ติด ร. / ต้องเรียนซ่อมหลังสอบปลายภาค',
      description: `เกรดเฉลี่ยเทอมนี้อยู่ที่ ${termGpa.toFixed(2)} (ต่ำกว่า ${EDUCATION_SYSTEM_RULES.remedialThresholdGpa.toFixed(2)}) ต้องสละเวลาอ่านหนังสือและแก้ ร. ก่อนเปิดเทอมใหม่`,
    });
  } else if (nextEdu.remedialDue) {
    nextEdu = { ...nextEdu, remedialDue: false };
    next = {
      ...next,
      character: { ...next.character, educationState: nextEdu },
    };
  }

  if (
    nextEdu.hasScholarship &&
    nextEdu.scholarshipMinGpa != null &&
    termGpa < nextEdu.scholarshipMinGpa
  ) {
    const req = nextEdu.scholarshipMinGpa;
    nextEdu = {
      ...nextEdu,
      hasScholarship: false,
      scholarshipMinGpa: null,
    };
    next = {
      ...next,
      character: {
        ...next.character,
        educationState: nextEdu,
        flags: {
          ...next.character.flags,
          lost_scholarship: true,
        },
      },
      activeToast: {
        id: `toast_lost_scholar_${state.date.totalDays}`,
        title: UI_TEXT.PHASE331.scholarshipLostToastTitle,
        description: UI_TEXT.PHASE331.scholarshipLostToastDesc(termGpa, req),
        tier: 'T1',
        category: 'milestone',
        expiresAtTotalDay: state.date.totalDays + 14,
      },
    };
    next = appendTimeline(next, {
      category: 'milestone',
      tier: 'T2',
      title: UI_TEXT.PHASE331.scholarshipLostToastTitle,
      description: UI_TEXT.PHASE331.scholarshipLostToastDesc(termGpa, req),
    });
    next = pushLifeHistory(next, {
      id: `lost_scholarship_${state.date.totalDays}`,
      kind: 'scholarship_lost',
      titleTh: 'หลุดทุนการศึกษา',
      detailTh: `เกรดเฉลี่ย ${termGpa.toFixed(2)} ไม่ถึงเกณฑ์ขั้นต่ำ ${req.toFixed(2)}`,
    });
  }

  if (isRegularStudent && evaluatedMonth === 3 && nextEdu.rotcEnrolled && !nextEdu.completedRotc) {
    const nextYears = (nextEdu.rotcYearsCompleted ?? 0) + 1;
    const completed = nextYears >= EDUCATION_SYSTEM_RULES.rotcRequiredYears;
    const isMale = next.character.gender === 'male';

    nextEdu = {
      ...nextEdu,
      rotcYearsCompleted: nextYears,
      completedRotc: completed,
      rotcEnrolled: completed ? false : nextEdu.rotcEnrolled,
      draftExemption: completed && isMale ? true : nextEdu.draftExemption,
      rotcGovServiceBonus: completed && !isMale ? ROTC_RULES.femaleGovServiceBonus : nextEdu.rotcGovServiceBonus,
    };

    next = {
      ...next,
      character: {
        ...next.character,
        educationState: nextEdu,
        skills: {
          ...next.character.skills,
          athletics: Math.min(90, (next.character.skills.athletics ?? 0) + ROTC_RULES.annualAthleticsXp),
        },
      },
    };

    if (completed) {
      const completionDesc = isMale
        ? 'จบหลักสูตรนักศึกษาวิชาทหารครบ 3 ชั้นปี ได้รับสิทธิ์ยกเว้นการเกณฑ์ทหารตามเกณฑ์'
        : 'จบหลักสูตร รด. หญิงครบ 3 ชั้นปี ได้รับคะแนนพิเศษสำหรับการสอบเข้ารับราชการ';

      next = appendTimeline(next, {
        category: 'milestone',
        tier: 'T2',
        title: isMale ? 'สำเร็จการฝึก รด. ครบ 3 ปี' : 'สำเร็จการฝึก รด. หญิง ครบ 3 ปี',
        description: completionDesc,
      });

      next = pushLifeHistory(next, {
        id: `rotc_completed_${state.date.totalDays}`,
        kind: 'rotc',
        titleTh: isMale ? 'จบ รด. ปี 3 (ยกเว้นเกณฑ์ทหาร)' : 'จบ รด. หญิง ปี 3',
        detailTh: completionDesc,
      });
    } else {
      next = appendTimeline(next, {
        category: 'milestone',
        tier: 'T1',
        title: `ผ่านการฝึก รด. ปี ${nextYears}`,
        description: `ผ่านการฝึกภาคสนามและสอบประจำปีของนักศึกษาวิชาทหาร ชั้นปีที่ ${nextYears}`,
      });
    }
  }

  if (secondChanceProg) {
    const progMeta = SECOND_CHANCE_PROGRAMS[secondChanceProg];
    const nextProgTerms = (nextEdu.secondChanceProgressTerms ?? 0) + 1;
    if (nextProgTerms >= progMeta.requiredTerms) {
      const upgradedLevel =
        EDUCATION_RANK[progMeta.targetEducation] >= EDUCATION_RANK[next.character.education]
          ? progMeta.targetEducation
          : next.character.education;
      nextEdu = {
        ...nextEdu,
        level: upgradedLevel,
        secondChanceEnrolled: null,
        secondChanceProgressTerms: 0,
      };
      next = {
        ...next,
        character: {
          ...next.character,
          education: upgradedLevel,
          educationState: nextEdu,
        },
        activeToast: {
          id: `toast_grad_nfe_${state.date.totalDays}`,
          title: `จบหลักสูตร${progMeta.labelTh}`,
          description: `ได้รับวุฒิ "${EDUCATION_LABELS[upgradedLevel]}" และปลดล็อกโอกาสงานเพิ่มเติมแล้ว`,
          tier: 'T1',
          category: 'milestone',
          expiresAtTotalDay: state.date.totalDays + 14,
        },
      };
      next = appendTimeline(next, {
        category: 'milestone',
        tier: 'T2',
        title: `สำเร็จการศึกษา: ${progMeta.labelTh}`,
        description: `เรียนควบคู่ชีวิตจริงจนจบหลักสูตร ได้รับวุฒิ ${EDUCATION_LABELS[upgradedLevel]} เรียบร้อยแล้ว`,
      });
      next = pushLifeHistory(next, {
        id: `grad_${progMeta.id}_${state.date.totalDays}`,
        kind: 'graduation',
        titleTh: `สำเร็จการศึกษา: ${progMeta.labelTh}`,
        detailTh: `ได้รับวุฒิ ${EDUCATION_LABELS[upgradedLevel]}`,
      });
    } else {
      nextEdu = {
        ...nextEdu,
        secondChanceProgressTerms: nextProgTerms,
      };
      next = {
        ...next,
        character: { ...next.character, educationState: nextEdu },
      };
    }
  }

  return next;
}

// ---------- Dynamic Phase 3.3.1-FIX Education Prompts ----------

export function buildAfterP6SchoolPrompt(state: GameState): PendingEventPrompt {
  const curTier = state.character.educationState?.schoolTier ?? 'school_public';
  const curMeta = SCHOOL_TIERS[curTier];
  const wealth = state.character.background.familyWealth;
  const estIncome = SCHOOL_TRANSFER_CONFIG.estimatedAnnualIncomeByWealth[wealth] ?? 240000;

  const choices: EventChoice[] = [
    {
      id: `keep:${curTier}`,
      label: `เรียนต่อ${curMeta.labelTh}ตามแผนครอบครัว (${(curMeta.monthlyFeeThb * 12).toLocaleString('th-TH')} ฿/ปี)`,
      hint: curMeta.shortDescTh,
      effects: [{ type: 'AddFlag', flag: 'done_after_p6_school', value: true, reason: 'ยืนยันโรงเรียนชั้น ม.ต้น' }],
    },
    ...SCHOOL_TIER_ORDER.filter((t) => t !== curTier).map((tierId): EventChoice => {
      const m = SCHOOL_TIERS[tierId];
      const annual = m.monthlyFeeThb * 12;
      const pricey = annual > estIncome * DROPOUT_CRISIS_CONFIG.annualTuitionAffordabilityRatio;
      return {
        id: `transfer:${tierId}`,
        label: `ขอย้ายเข้า${m.labelTh} (${annual.toLocaleString('th-TH')} ฿/ปี)`,
        hint: pricey
          ? `${m.shortDescTh} (ค่าเทอมอาจตึงมือครอบครัว โอกาสอนุมัติลดลง)`
          : m.shortDescTh,
        effects: [{ type: 'AddFlag', flag: 'done_after_p6_school', value: true, reason: 'ยื่นคำร้องย้ายสถานศึกษาช่วงขึ้น ม.1' }],
      };
    }),
  ];

  return {
    id: `prompt_ev_after_p6_school_${state.date.totalDays}`,
    storyletId: 'ev_after_p6_school',
    title: 'จบ ป.6 — เลือกโรงเรียนต่อชั้น ม.1',
    category: 'milestone',
    tier: 'T2',
    sceneId: 'home',
    sceneTag: 'home',
    daypart: 'evening',
    deadlineDay: state.date.totalDays + 14,
    importance: 8,
    description: `${state.character.firstName}กำลังจะขึ้นชั้นมัธยมศึกษาปีที่ 1 แล้ว สถานศึกษาปัจจุบันคือ "${curMeta.labelTh}" คุณต้องการเรียนต่อที่เดิมหรือปรึกษาครอบครัวเพื่อขอย้ายโรงเรียน?`,
    choices,
  };
}

export function buildAfterM3ChoicePrompt(state: GameState): PendingEventPrompt {
  const gpax = state.character.educationState?.cumulativeGpa ?? 2.75;
  const annualFee = (SCHOOL_TIERS[state.character.educationState?.schoolTier ?? 'school_public']?.monthlyFeeThb ?? 0) * 12;

  const trackEntries: Array<{ track: HighSchoolTrack; branch?: VocationalBranchId; labelSuffix?: string }> = [
    { track: 'sci_math' },
    { track: 'arts_math' },
    { track: 'arts_lang' },
    { track: 'arts_fine' },
    ...VOCATIONAL_BRANCHES.map((b) => ({
      track: 'vocational' as HighSchoolTrack,
      branch: b.id,
      labelSuffix: ` · ${b.labelTh}`,
    })),
  ];

  const trackChoices: EventChoice[] = trackEntries.map(({ track, branch, labelSuffix }) => {
    const meta = HIGH_SCHOOL_TRACKS[track];
    const rule = TRACK_READINESS_RULES[track];
    const readiness = evaluateTrackReadiness(state, track, branch);
    const readLabel = READINESS_META[readiness.level].labelTh;
    const choiceId = branch ? `track:${track}:${branch}` : `track:${track}`;
    return {
      id: choiceId,
      label: `เข้า${meta.labelTh}${labelSuffix ?? ''} [${readLabel}]`,
      hint: `แนะนำ GPAX ${rule.recommendedGpax.toFixed(2)} · ได้ทักษะ: ${rule.gainedSkillsTh} · ต่อยอด: ${rule.nextPathsTh} · ค่าเทอม ~${annualFee.toLocaleString('th-TH')} ฿/ปี${
        readiness.missingCriteria.length > 0 ? ` (${readiness.missingCriteria.join(', ')})` : ''
      }`,
      effects: [{ type: 'AddFlag', flag: 'done_after_m3_choice', value: true, reason: 'ตัดสินใจเส้นทางหลังจบ ม.3' }],
    };
  });

  // Always allow entering workforce + NFE as a safe fallback
  trackChoices.push({
    id: 'work_nfe',
    label: 'ออกจากระบบปกติ ไปทำงานพร้อมลง กศน. ม.ปลาย',
    hint: 'เริ่มมีรายได้ทันทีหลังอายุ 15 ปี พร้อมเก็บวุฒิ ม.ปลาย นอกเวลาควบคู่ได้',
    effects: [
      { type: 'AddFlag', flag: 'done_after_m3_choice', value: true, reason: 'เลือกเส้นทางทำงานควบคู่ กศน.' },
      { type: 'SetJob', jobId: 'unemployed', reason: 'จบ ม.3 ออกหางานและเรียน กศน.' },
    ],
  });

  return {
    id: `prompt_ev_after_m3_choice_${state.date.totalDays}`,
    storyletId: 'ev_after_m3_choice',
    title: 'จบ ม.3 — เลือกสายการเรียน ม.ปลาย / อาชีวะ',
    category: 'milestone',
    tier: 'T3',
    sceneId: 'school',
    sceneTag: 'school',
    daypart: 'morning',
    deadlineDay: state.date.totalDays + 14,
    importance: 10,
    description: `เกรดเฉลี่ยสะสม (GPAX) ปัจจุบันอยู่ที่ ${gpax.toFixed(2)} ถึงเวลาเลือกแผนการเรียนระดับชั้น ม.4 หรือสายอาชีพ ปวช. ที่จะปูทางสู่อนาคต (หากพื้นฐานยังไม่ถึงเกณฑ์อาจต้องเหนื่อยปรับตัวช่วง 2 เทอมแรก)`,
    choices: trackChoices,
  };
}

export function buildSchoolTransferRequestPrompt(state: GameState): PendingEventPrompt {
  const curTier = state.character.educationState?.schoolTier ?? 'school_public';
  const curMeta = SCHOOL_TIERS[curTier];
  const choices: EventChoice[] = [
    ...SCHOOL_TIER_ORDER.filter((t) => t !== curTier).map((tierId): EventChoice => {
      const m = SCHOOL_TIERS[tierId];
      return {
        id: `transfer:${tierId}`,
        label: `ยื่นขอย้ายไป${m.labelTh} (${(m.monthlyFeeThb * 12).toLocaleString('th-TH')} ฿/ปี)`,
        hint: m.shortDescTh,
        effects: [],
      };
    }),
    {
      id: 'cancel_transfer',
      label: `เรียนต่อที่${curMeta.labelTh}ตามเดิม`,
      hint: 'ไม่เปลี่ยนสถานศึกษาในปีการศึกษานี้',
      effects: [],
    },
  ];
  return {
    id: `prompt_ev_school_transfer_${state.date.totalDays}`,
    storyletId: 'ev_school_transfer_request',
    title: 'ช่วงปิดเทอมใหญ่ — ขอย้ายสถานศึกษา',
    category: 'milestone',
    tier: 'T2',
    sceneId: 'home',
    sceneTag: 'home',
    daypart: 'evening',
    deadlineDay: state.date.totalDays + 14,
    importance: 7,
    description: `ปิดเทอมภาคฤดูร้อน (มี.ค.–เม.ย.) เป็นช่วงเดียวที่สามารถขอปรึกษาครอบครัวเพื่อย้ายสถานศึกษาได้ ปัจจุบันเรียนอยู่ "${curMeta.labelTh}"`,
    choices,
  };
}

export function buildTrackChangeRequestPrompt(state: GameState): PendingEventPrompt {
  const curEdu = state.character.educationState;
  const curTier = curEdu?.schoolTier ?? 'school_public';
  const fee = TRACK_CHANGE_FEES[curTier] ?? 500;
  const curTrack = curEdu?.highSchoolTrack ?? 'sci_math';

  const choices: EventChoice[] = (Object.keys(HIGH_SCHOOL_TRACKS) as HighSchoolTrack[])
    .filter((t) => t !== curTrack)
    .map((track): EventChoice => {
      const meta = HIGH_SCHOOL_TRACKS[track];
      const readiness = evaluateTrackReadiness(state, track);
      const disabled = readiness.level === 'very_risky' || state.economy.cash < fee;
      return {
        id: `track:${track}${track === 'vocational' ? ':craft' : ''}`,
        label: `ย้ายไป${meta.labelTh} (ค่าธรรมเนียม ${fee.toLocaleString('th-TH')} ฿ · ${READINESS_META[readiness.level].labelTh})`,
        hint: `ต้องปรับตัวเกรด -0.20 ในเทอมแรก · ${TRACK_READINESS_RULES[track].gainedSkillsTh}`,
        disabled,
        disabledReason:
          state.economy.cash < fee
            ? `เงินสดไม่พอค่าธรรมเนียม ${fee} ฿`
            : readiness.level === 'very_risky'
              ? 'ความพร้อมยังไม่ถึงเกณฑ์ย้ายสาย'
              : undefined,
        effects: [],
      };
    });

  choices.push({
    id: 'keep_track',
    label: `เรียนต่อ${HIGH_SCHOOL_TRACKS[curTrack].labelTh}ตามเดิม`,
    hint: 'ไม่เสียค่าธรรมเนียมและไม่ต้องปรับตัวใหม่',
    effects: [],
  });

  return {
    id: `prompt_ev_track_change_${state.date.totalDays}`,
    storyletId: 'ev_track_change_request',
    title: 'ปิดเทอมใหญ่ — ยื่นขอเปลี่ยนแผนการเรียน',
    category: 'milestone',
    tier: 'T2',
    sceneId: 'school',
    sceneTag: 'school',
    daypart: 'morning',
    deadlineDay: state.date.totalDays + 14,
    importance: 7,
    description: `ช่วงปิดเทอมเดือนมีนาคม–เมษายน เปิดโอกาสให้ยื่นเปลี่ยนแผนการเรียน ม.ปลาย ได้ปีละไม่เกิน 1 ครั้ง (ค่าธรรมเนียมดำเนินการ ${fee.toLocaleString('th-TH')} บาท)`,
    choices,
  };
}

export function buildRotcApplyPrompt(state: GameState): PendingEventPrompt {
  const isMale = state.character.gender === 'male';
  const physical = Math.round((state.character.rawStats.strength + state.character.rawStats.endurance) / 2);
  const desc = isMale
    ? `เข้าสู่ชั้น ม.4 แล้ว เปิดรับสมัครนักศึกษาวิชาทหาร (รด.) หากเรียนครบ 3 ปีจะได้รับสิทธิ์ยกเว้นการเกณฑ์ทหาร (เกณฑ์สมรรถภาพชาย: ความแข็งแรง+ความอึดเฉลี่ย >= ${ROTC_RULES.maleAutoPassMinPhysical} · ค่าปัจจุบันของคุณ ${physical})`
    : 'เข้าสู่ชั้น ม.4 แล้ว นักเรียนหญิงสามารถสมัคร รด. ได้เช่นกัน โดยคัดเลือกตามโควต้า (โอกาสผ่านเริ่มต้น ~70%) หากจบครบ 3 ปีจะได้รับคะแนนพิเศษสอบเข้ารับราชการและเสริมความรับผิดชอบ';

  return {
    id: `prompt_ev_rotc_apply_${state.date.totalDays}`,
    storyletId: 'ev_rotc_apply',
    title: 'เปิดรับสมัครนักศึกษาวิชาทหาร (รด.) ปี 1',
    category: 'milestone',
    tier: 'T2',
    sceneId: 'school',
    sceneTag: 'school',
    daypart: 'morning',
    deadlineDay: state.date.totalDays + 14,
    importance: 7,
    description: desc,
    choices: [
      {
        id: 'rotc_enroll',
        label: 'สมัครเข้ารับการทดสอบและเรียน รด. ปี 1',
        hint: isMale
          ? 'เรียนครบ 3 ปี ได้สิทธิ์ยกเว้นเกณฑ์ทหาร + พัฒนากีฬาปีละ +4'
          : 'ผ่านคัดเลือกได้เรียน รด. หญิง + คะแนนพิเศษสายราชการเมื่อจบปี 3',
        effects: [{ type: 'AddFlag', flag: 'rotc_prompted', value: true, reason: 'พิจารณาสมัคร รด.' }],
      },
      {
        id: 'rotc_skip',
        label: 'ไม่สมัคร รด. ในปีนี้',
        hint: isMale ? 'เก็บเวลาไปทุ่มเทกับการเรียนหรือกิจกรรมอื่นแทน' : 'เน้นเวลาเรียนและกิจกรรมชมรมตามปกติ',
        effects: [{ type: 'AddFlag', flag: 'rotc_prompted', value: true, reason: 'เลือกไม่สมัคร รด.' }],
      },
    ],
  };
}

export function resolveEducationPromptChoice(
  state: GameState,
  prompt: PendingEventPrompt,
  choiceId: string
): GameState | null {
  if (
    prompt.storyletId !== 'ev_after_p6_school' &&
    prompt.storyletId !== 'ev_after_m3_choice' &&
    prompt.storyletId !== 'ev_school_transfer_request' &&
    prompt.storyletId !== 'ev_track_change_request' &&
    prompt.storyletId !== 'ev_rotc_apply'
  ) {
    return null;
  }

  let next: GameState = {
    ...state,
    pendingPrompt: null,
    needsPlayer: state.pendingAutopilotSituation !== null,
  };

  if (choiceId.startsWith('keep:')) {
    next = {
      ...next,
      character: {
        ...next.character,
        flags: { ...next.character.flags, done_after_p6_school: true },
      },
    };
    next = appendTimeline(next, {
      category: 'milestone',
      tier: 'T1',
      title: 'ขึ้นชั้น ม.1 ที่โรงเรียนเดิม',
      description: 'ครอบครัวตกลงให้เรียนต่อชั้นมัธยมศึกษาตอนต้นในสถานศึกษาเดิม',
    });
    return next;
  }

  if (choiceId.startsWith('transfer:')) {
    const targetTier = choiceId.slice('transfer:'.length) as SchoolTier;
    const transferRes = requestSchoolTransfer(next, targetTier, true);
    next = transferRes.state;
    if (prompt.storyletId === 'ev_after_p6_school') {
      next = {
        ...next,
        character: {
          ...next.character,
          flags: { ...next.character.flags, done_after_p6_school: true },
        },
      };
    }
    return next;
  }

  if (choiceId.startsWith('track:')) {
    const parts = choiceId.split(':');
    const track = parts[1] as HighSchoolTrack;
    const branch = parts[2] as VocationalBranchId | undefined;
    const bestFineArt =
      track === 'arts_fine'
        ? FINE_ART_TRACK_CHOICES.reduce((best, cur) =>
            (next.character.skills[cur] ?? 0) > (next.character.skills[best] ?? 0) ? cur : best
          )
        : undefined;
    const res = requestTrackChange(next, track, bestFineArt, branch, {
      allowVeryRisky: prompt.storyletId === 'ev_after_m3_choice',
      bypassMonthCheck: prompt.storyletId === 'ev_after_m3_choice',
    });
    next = res.state;
    if (prompt.storyletId === 'ev_after_m3_choice') {
      next = {
        ...next,
        character: {
          ...next.character,
          flags: { ...next.character.flags, done_after_m3_choice: true },
        },
      };
    }
    return next;
  }

  if (choiceId === 'work_nfe') {
    next = {
      ...next,
      character: {
        ...next.character,
        flags: { ...next.character.flags, done_after_m3_choice: true, enroll_nfe_upper: true },
      },
      economy: {
        ...next.economy,
        jobId: 'unemployed',
        jobTitle: 'ว่างงาน / หางาน',
        monthlySalary: 0,
      },
    };
    const nfe = applyEnrollSecondChanceEdu(next, 'nfe_upper');
    if (nfe.accepted) next = nfe.state;
    next = appendTimeline(next, {
      category: 'milestone',
      tier: 'T3',
      title: 'จบ ม.3 ออกหางานพร้อมลงทะเบียน กศน.',
      description: 'เลือกเส้นทางเริ่มต้นทำงานตั้งแต่อายุ 15 ปี ควบคู่กับการเรียน กศน. ม.ปลาย',
    });
    return next;
  }

  if (choiceId === 'rotc_enroll') {
    const res = applyEnrollRotc(next, true);
    next = res.state;
    next = {
      ...next,
      character: {
        ...next.character,
        flags: { ...next.character.flags, rotc_prompted: true },
      },
      activeToast: {
        id: `toast_rotc_res_${state.date.totalDays}`,
        title: res.accepted ? 'ผ่านการคัดเลือก รด.' : 'ผลการคัดเลือก รด.',
        description: res.message,
        tier: 'T1',
        category: 'milestone',
        expiresAtTotalDay: state.date.totalDays + 10,
      },
    };
    return next;
  }

  if (choiceId === 'rotc_skip') {
    return {
      ...next,
      character: {
        ...next.character,
        flags: { ...next.character.flags, rotc_prompted: true },
      },
    };
  }

  return next;
}
