import {
  EDUCATION_SYSTEM_RULES,
  SCHOOL_TIERS,
  SECOND_CHANCE_PROGRAMS,
} from '../data/education';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import { DEFAULT_TIME_ALLOC_BY_STAGE } from '../data/timeAlloc';
import { createEmploymentForJob, DEMO_PROMPTS, HOUSINGS, JOBS } from '../data/thaiData';
import {
  buildCharacterAppearance,
  getAppearanceStage,
  getAppearanceStageLabel,
  isAppearanceValidForAge,
} from './appearance';
import {
  autopilotDecide,
  buildPeriodDigest,
  createDefaultStandingOrders,
  getHealthCheckupHazardMultiplier,
  maybeRollMonthlyAutopilotEvent,
  processAnnualHealthCheckupOnBirthday,
  processMonthlySelfCareAutopilot,
  resolveAutopilotWithOption,
} from './autopilot';
import { advanceOneDay, formatThaiDate } from './clock';
import {
  BASE_MONTHLY_LIVING_COST,
  MIN_DEBT_PAYMENT_RATE,
  MONTHLY_DEBT_INTEREST_RATE,
  getRegionCostMultiplier,
  recalculateEconomyDerived,
} from './economy';
import {
  buildAfterM3ChoicePrompt,
  buildAfterP6SchoolPrompt,
  buildRotcApplyPrompt,
  evaluateAcademicTermEnd,
  isDropoutCrisisEligible,
  resolvePendingSchoolTransfer,
} from './education';
import { generateAnnualFocusDigest } from './digest';
import { fireStorylet, stepEventDirector as runEventDirector } from './director';
import { decayEvidenceWeekly, recordEvidence, recordJobWeeklyEvidence } from './evidence';
import { getLifeSubStageId, onBirthdayLifeStageUpdate } from './lifeStage';
import { appendTimeline, applyEffects, summarizeEffects } from './log';
import { clamp, nextRandom, round2 } from './rng';
import { applyWeeklySkillTraining, grantDailyJobSkillXp } from './skillTraining';
import { computeLifeIndices } from './stats';
import {
  applyWeeklyTimeAllocation,
  getDefaultTimeAllocation,
  sanitizeTimeAllocation,
  validateTimeAllocation,
} from './timeAlloc';
import {
  applyPresetTemplate,
  buildAnnualFocusBirthdayPrompt,
  computeNightShiftWeeklyImpact,
  createInitialAnnualFocusState,
  deriveWeeklyAllocation,
  resolveEmploymentState,
  sanitizeGridForState,
  sanitizePlannerWithRelockNotice,
  updatePlannerStreaksWeekly,
} from './planner';
import { stampTalentSwapWindow } from './talents';
import { computeReputationViews, hazardModifiers } from './traitEffects';
import { checkTraitFormation, driftPersonalityYearly } from './traits';
import type { GameState, PendingEventPrompt } from './types';

function onDay(state: GameState): GameState {
  if (!state.character.isAlive) return state;
  let next = state;
  const pendingTransfer = next.character.educationState?.pendingTransfer;
  if (pendingTransfer && next.date.totalDays >= pendingTransfer.dueDay) {
    next = resolvePendingSchoolTransfer(next);
  }
  const af = next.planner?.annualFocus;
  if (!af?.snapshot) return next;
  return {
    ...next,
    planner: {
      ...next.planner!,
      annualFocus: {
        ...af,
        snapshot: {
          ...af.snapshot,
          stressSum: round2(af.snapshot.stressSum + next.character.resources.stress),
          stressSamples: af.snapshot.stressSamples + 1,
        },
      },
    },
  };
}

function onWeek(state: GameState, recordLogs = true): GameState {
  if (!state.character.isAlive) return state;
  let next = recordJobWeeklyEvidence(state);
  next = applyWeeklyTimeAllocation(next, recordLogs);
  next = applyWeeklySkillTraining(next, recordLogs);
  if (next.planner?.grid) {
    const relockRes = sanitizePlannerWithRelockNotice(next.planner, next);
    next = {
      ...next,
      planner: relockRes.planner,
      timeAllocation: deriveWeeklyAllocation(relockRes.planner.grid, next),
    };
    if (relockRes.relockNoticeTh && recordLogs) {
      next = appendTimeline(next, {
        category: 'life',
        title: 'ปรับกิจกรรมในตารางอัตโนมัติ',
        description: relockRes.relockNoticeTh,
        explainReason: relockRes.relockNoticeTh,
      });
    }
    next = updatePlannerStreaksWeekly(next);
  }
  next = {
    ...next,
    evidence: decayEvidenceWeekly(next.evidence),
  };
  next = checkTraitFormation(next, 'weekly', recordLogs);
  next = {
    ...next,
    employment: resolveEmploymentState(next),
    character: {
      ...next.character,
      reputationView: computeReputationViews(next),
    },
  };
  return next;
}

function onMonth(
  state: GameState,
  recordLogs = true,
  allowPrompts = true,
  evaluatedMonth?: number
): GameState {
  const { character, economy } = state;
  const housing = HOUSINGS[economy.housingId];
  const job = JOBS[economy.jobId] ?? JOBS.unemployed;

  let next = state;
  const monthEffects: Parameters<typeof applyEffects>[1] = [];

  // 1. เงินเดือนประจำ หรือค่าขนมเฉพาะวัยเรียน 15..23 ปี (อายุ < 15 พ่อแม่ดูแลทั้งหมด ไม่มีเงินส่วนตัว)
  if (character.ageYears >= 15) {
    if (economy.monthlySalary > 0) {
      monthEffects.push({
        type: 'AddMoney',
        amount: economy.monthlySalary,
        category: 'salary',
        reason: `เงินเดือนประจำ (${job.title})`,
      });
      const nightImpact = computeNightShiftWeeklyImpact(state);
      if (nightImpact.isNightShift && nightImpact.monthlyPayBonus > 0) {
        monthEffects.push({
          type: 'AddMoney',
          amount: nightImpact.monthlyPayBonus,
          category: 'salary',
          reason: 'ค่าตอบแทนเพิ่มเติมกะดึก (+15%)',
        });
      }
    } else if (character.ageYears < 18 || (job.id === 'student' && character.ageYears <= 23)) {
      const allowanceMap = {
        destitute: 1200,
        working_poor: 2000,
        lower_middle: 3200,
        middle: 5000,
        upper_middle: 8000,
        wealthy: 14000,
      };
      const allowance = allowanceMap[character.background.familyWealth];
      monthEffects.push({
        type: 'AddMoney',
        amount: allowance,
        category: 'salary',
        reason: 'เงินสนับสนุนรายเดือนจากครอบครัว',
      });
    }
  }

  // 2. ค่าเช่าที่พัก (อายุ < 18 อยู่บ้านพ่อแม่ไม่ต้องจ่าย)
  const rent = character.ageYears < 18 && economy.housingId === 'parents_home' ? 0 : housing.monthlyRent;
  if (character.ageYears >= 15 && rent > 0) {
    monthEffects.push({
      type: 'AddMoney',
      amount: -rent,
      category: 'rent',
      reason: `ค่าเช่า/ค่าดูแลที่พัก (${housing.name})`,
    });
  }

  if (monthEffects.length > 0) {
    next = applyEffects(next, monthEffects, recordLogs);
  }

  // 2b. ค่าเล่าเรียนสถานศึกษา (จ่ายปีละ 2 งวด: พ.ค. และ พ.ย., อายุ >= 15) และ กศน. รายเดือน
  if (next.character.ageYears >= 15 && next.character.educationState) {
    const eduState = next.character.educationState;
    if (
      next.economy.jobId === 'student' &&
      !eduState.hasScholarship &&
      !eduState.hasStudentLoan &&
      EDUCATION_SYSTEM_RULES.tuitionPaymentMonths.includes(next.date.month)
    ) {
      const tierMeta = SCHOOL_TIERS[eduState.schoolTier];
      const installmentFee = tierMeta ? Math.round((tierMeta.monthlyFeeThb * 12) / 2) : 0;
      if (installmentFee > 0 && next.economy.cash >= installmentFee) {
        const termTag = next.date.month === 5 ? '1/2 (พ.ค.)' : '2/2 (พ.ย.)';
        next = applyEffects(
          next,
          [
            {
              type: 'AddMoney',
              amount: -installmentFee,
              category: 'living',
              reason: `ค่าเทอม${tierMeta.labelTh} งวด ${termTag}`,
            },
          ],
          recordLogs
        );
      }
    }
    if (eduState.secondChanceEnrolled) {
      const scMeta = SECOND_CHANCE_PROGRAMS[eduState.secondChanceEnrolled];
      if (scMeta && scMeta.monthlyFeeThb > 0 && next.economy.cash >= scMeta.monthlyFeeThb) {
        next = applyEffects(
          next,
          [
            {
              type: 'AddMoney',
              amount: -scMeta.monthlyFeeThb,
              category: 'living',
              reason: `ค่าลงทะเบียนรายเดือน (${scMeta.labelTh})`,
            },
          ],
          recordLogs
        );
      }
    }
  }

  // 3. ดอกเบี้ยและผ่อนชำระหนี้ขั้นต่ำ (เพดานดอกเบี้ยไม่เกินยอดกู้เริ่มต้นหลายเท่าตัวแบบไร้เหตุผล)
  if (next.economy.debt > 0) {
    const effectiveRate = next.economy.debt > 500000 ? 0.006 : MONTHLY_DEBT_INTEREST_RATE;
    const interest = Math.round(next.economy.debt * effectiveRate);
    if (interest > 0) {
      next = applyEffects(
        next,
        [{ type: 'AddDebt', amount: interest, reason: 'ดอกเบี้ยเงินกู้ประจำเดือน' }],
        recordLogs
      );
    }
    const minPayment = Math.min(
      next.economy.debt,
      Math.max(500, Math.round(next.economy.debt * MIN_DEBT_PAYMENT_RATE))
    );
    if (next.economy.cash >= minPayment) {
      next = applyEffects(
        next,
        [
          { type: 'AddMoney', amount: -minPayment, category: 'debt', reason: 'ชำระหนี้ขั้นต่ำประจำเดือน' },
          { type: 'RepayDebt', amount: minPayment, reason: 'ตัดเงินต้นหนี้สิน' },
          { type: 'ChangeCredit', delta: 4, reason: 'ชำระหนี้ตรงเวลา' },
        ],
        recordLogs
      );
    } else {
      next = {
        ...next,
        economy: {
          ...next.economy,
          missedPayments: next.economy.missedPayments + 1,
        },
      };
      next = applyEffects(
        next,
        [
          { type: 'ChangeCredit', delta: -12, reason: 'ค้างชำระหนี้รายเดือน (เงินสดไม่พอ)' },
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'เครียดจากหนี้สินค้างชำระ' },
        ],
        recordLogs
      );
    }
  } else if (next.economy.cash > 0) {
    next = applyEffects(
      next,
      [{ type: 'ChangeCredit', delta: 1, reason: 'ประวัติการเงินปกติปลอดหนี้ค้าง' }],
      recordLogs
    );
  }

  // Phase 3.2.3: คำสั่งประจำดูแลตัวเองและครอบครัวรายเดือน (พัก-กลับมาอัตโนมัติตามเงินสำรอง)
  next = processMonthlySelfCareAutopilot(next, recordLogs);

  // รีเซ็ตตัวสะสมรายได้เสริมรายเดือน
  next = {
    ...next,
    economy: recalculateEconomyDerived(next.character, {
      ...next.economy,
      monthlySideIncome: 0,
    }),
  };

  // Phase 2: Standing Order financial behavior evidence & monthly trait check
  const orders = next.standingOrders ?? createDefaultStandingOrders(next.character);
  if (next.character.ageYears >= 15) {
    if (next.economy.cash < orders.financial.lowCashThreshold) {
      next = recordEvidence(next, 'money_scarcity_stress', 0.8, { reason: 'เงินสดต่ำกว่าเกณฑ์เฝ้าระวัง' });
    } else if (next.economy.cash >= orders.financial.lowCashThreshold * 2 && orders.financial.minSavingsRatePct >= 15 && next.economy.debt === 0) {
      next = recordEvidence(next, 'disciplined_saving', 0.45, { reason: 'รักษาวินัยเงินออมตาม Standing Orders' });
    }
  }
  next = checkTraitFormation(next, 'monthly', recordLogs);

  // Trigger monthly autopilot dilemma/opportunity when UI prompts are allowed & not hospitalized/busy
  const daysSinceLastT2 = next.date.totalDays - (next.directorState?.lastT2Day ?? -999);
  const inHospital = next.sceneMode?.sceneId === 'hospital';
  if (allowPrompts && !next.pendingPrompt && !next.pendingAutopilotSituation && !inHospital && daysSinceLastT2 >= 7) {
    const rolled = maybeRollMonthlyAutopilotEvent(next);
    next = rolled.state;
    if (rolled.situation) {
      next = {
        ...next,
        pendingAutopilotSituation: rolled.situation,
      };
    }
  }

  // Phase 3.3.1: สรุปเกรดปลายภาคเมื่อปิดเทอม (ต.ค. = 10, มี.ค. = 3)
  const monthClosed = evaluatedMonth ?? ((state.date.month + 10) % 12 + 1);
  if (EDUCATION_SYSTEM_RULES.termEvaluationMonths.includes(monthClosed)) {
    next = evaluateAcademicTermEnd(next, monthClosed);
  }

  // Phase 3.3.1-FIX: เปิดหน้าต่างสลับพรสวรรค์ต้นภาคเรียน (พ.ค. / พ.ย.) และรับสมัคร รด. ช่วงเปิดเทอม ม.ปลาย
  if (EDUCATION_SYSTEM_RULES.tuitionPaymentMonths.includes(next.date.month)) {
    next = stampTalentSwapWindow(next, `sem_${next.date.yearCE}_${next.date.month}`);
  }
  if (
    allowPrompts &&
    !next.pendingPrompt &&
    !inHospital &&
    (next.date.month === 5 || next.date.month === 6) &&
    next.economy.jobId === 'student' &&
    next.character.ageYears >= EDUCATION_SYSTEM_RULES.rotcStartMinAge &&
    next.character.ageYears <= EDUCATION_SYSTEM_RULES.rotcStartMaxAge &&
    !next.character.flags?.rotc_prompted &&
    !next.character.educationState?.rotcEnrolled &&
    !next.character.educationState?.completedRotc
  ) {
    next = {
      ...next,
      pendingPrompt: buildRotcApplyPrompt(next),
      needsPlayer: true,
    };
  }

  if (recordLogs) {
    next = appendTimeline(next, {
      category: 'finance',
      title: 'สรุปปิดงบสิ้นเดือน',
      description: `เงินสดคงเหลือ ${next.economy.cash.toLocaleString('th-TH')} บาท${
        next.economy.debt > 0 ? ` · หนี้คงค้าง ${next.economy.debt.toLocaleString('th-TH')} บาท` : ''
      }`,
    });
  }

  return next;
}

function onYear(state: GameState, recordLogs = true, allowPrompts = true): GameState {
  const prevAge = state.character.ageYears;
  const newAge = prevAge + 1;
  const wasMinor = state.character.isMinor;
  const isMinor = newAge < 18;
  const prevStage = getAppearanceStage(prevAge);
  const nextStage = getAppearanceStage(newAge);
  const crossedStage = prevStage !== nextStage;
  const lifeStageUpdate = onBirthdayLifeStageUpdate(state.character, newAge);

  const currentAppearance = state.character.appearance;
  const currentAppearanceId = currentAppearance?.charId;
  const crossedAge2Reveal = prevAge < 2 && newAge >= 2;
  const outgrewCurrentSprite =
    !currentAppearanceId ||
    !isAppearanceValidForAge(currentAppearanceId, newAge, undefined, {
      allowDyed: true,
      allowMatureGray: true,
    });

  let nextAppearance = currentAppearance;
  if (crossedStage || outgrewCurrentSprite || crossedAge2Reveal) {
    const picked = buildCharacterAppearance(
      state.seed,
      state.character.gender,
      newAge,
      currentAppearance,
      !outgrewCurrentSprite && currentAppearanceId ? currentAppearanceId : undefined,
      {
        familyWealth: state.character.background.familyWealth,
        region: state.character.background.region,
        temperament: state.character.background.temperament,
        familyStructure: state.character.background.familyStructure,
        jobId: state.economy.jobId,
        traits: state.character.traits,
        skills: state.character.skills,
        isOrphan: Boolean(state.character.flags.isOrphan),
      }
    );
    if (picked) {
      nextAppearance = picked;
    }
  }

  let next: GameState = {
    ...state,
    character: {
      ...lifeStageUpdate.person,
      ageYears: newAge,
      isMinor,
      appearance: nextAppearance,
    },
  };

  // Phase 2: Annual Layer A/B personality drift + refresh/clamp timeAllocation on stage change
  const drifted = driftPersonalityYearly(next.rngState, next.character);
  next = {
    ...next,
    rngState: drifted.rngState,
    character: drifted.person,
  };

  if (next.planner?.grid) {
    if (lifeStageUpdate.changedStage) {
      const targetPreset =
        next.lifestylePresetId && next.lifestylePresetId !== 'custom'
          ? next.lifestylePresetId
          : 'balanced';
      const reapplied = applyPresetTemplate(targetPreset, next);
      next = reapplied.accepted ? reapplied.state : applyPresetTemplate('balanced', next).state;
    } else {
      const relockRes = sanitizePlannerWithRelockNotice(next.planner, next);
      next = {
        ...next,
        planner: relockRes.planner,
        timeAllocation: deriveWeeklyAllocation(relockRes.planner.grid, next),
      };
      if (relockRes.relockNoticeTh && recordLogs) {
        next = appendTimeline(next, {
          category: 'life',
          title: 'ปรับกิจกรรมในตารางอัตโนมัติ',
          description: relockRes.relockNoticeTh,
          explainReason: relockRes.relockNoticeTh,
        });
      }
    }
  } else if (
    lifeStageUpdate.changedStage ||
    !next.timeAllocation ||
    !validateTimeAllocation(next.timeAllocation, newAge, next).valid
  ) {
    const keepCustom =
      next.timeAllocation &&
      !lifeStageUpdate.changedStage &&
      validateTimeAllocation(next.timeAllocation, newAge, next).valid;
    if (!keepCustom) {
      next = {
        ...next,
        timeAllocation: getDefaultTimeAllocation(newAge),
      };
    }
  } else {
    next = sanitizeTimeAllocation(next, next.timeAllocation, recordLogs).state;
  }

  if (lifeStageUpdate.changedStage) {
    next = stampTalentSwapWindow(next, `stage_${lifeStageUpdate.nextStageDef.id}_${newAge}`);
  }

  if (recordLogs && lifeStageUpdate.changedStage) {
    next = appendTimeline(next, {
      category: 'milestone',
      title: `เปลี่ยนช่วงวัย: ${lifeStageUpdate.nextStageDef.labelTh}`,
      description: `ก้าวเข้าสู่${lifeStageUpdate.nextStageDef.labelTh} (${lifeStageUpdate.nextStageDef.unlockedSystemsTh.join(' · ')})`,
    });
  }

  if (recordLogs && nextAppearance) {
    if (crossedStage) {
      next = appendTimeline(next, {
        category: 'life',
        title: 'หน้าตาเปลี่ยนตามวัย',
        description: `ก้าวเข้าสู่${getAppearanceStageLabel(nextStage)}ในวัย ${newAge} ปี รูปลักษณ์ภายนอกเติบโตเปลี่ยนไปตามกาลเวลา`,
        appearance: nextAppearance,
      });
    } else if (
      crossedAge2Reveal &&
      (!currentAppearance?.geneticEyeColor || !currentAppearance?.geneticHairColor)
    ) {
      next = appendTimeline(next, {
        category: 'life',
        title: 'โตขึ้นจนเห็นสีตาและสีผมชัดขึ้น',
        description: 'เข้าสู่วัยเตาะแตะ 2 ขวบ ลักษณะสีตาและสีผมจริงเริ่มปรากฏชัดเจนเป็นเอกลักษณ์ติดตัว',
        appearance: nextAppearance,
      });
    }
  }

  // พัฒนาการวัยเรียนตามอายุจริง 6 -> 12 -> 15 -> 18 -> 23
  if (newAge >= 6 && next.economy.jobId === 'infant') {
    next = applyEffects(next, [{ type: 'SetJob', jobId: 'student', reason: 'เข้าเรียนระดับประถมศึกษา' }], recordLogs);
    next = {
      ...next,
      employment: createEmploymentForJob(next.economy.jobId),
    };
  }
  if (newAge >= 12 && next.character.education === 'none') {
    next = {
      ...next,
      character: { ...next.character, education: 'primary' },
    };
  }
  if (newAge >= 15 && (next.character.education === 'none' || next.character.education === 'primary')) {
    next = {
      ...next,
      character: { ...next.character, education: 'lower_secondary' },
    };
  }
  if (newAge >= 18 && next.character.education === 'lower_secondary' && next.economy.jobId === 'student') {
    next = {
      ...next,
      character: { ...next.character, education: 'upper_secondary' },
    };
  }

  // หากเรียนจบวัย 23 แล้วยังเป็นนักเรียน/นักศึกษา ให้เปลี่ยนผ่านสู่งานเริ่มต้นตามวุฒิ
  if (newAge >= 23 && next.economy.jobId === 'student') {
    const newEdu = next.character.education === 'upper_secondary' || next.character.education === 'lower_secondary' ? 'bachelor' : next.character.education;
    next = {
      ...next,
      character: { ...next.character, education: newEdu },
    };
    const nextJobId = newEdu === 'bachelor' ? 'office_junior' : 'convenience_staff';
    next = applyEffects(next, [{ type: 'SetJob', jobId: nextJobId, reason: 'จบการศึกษาและเริ่มเข้าสู่ตลาดแรงงาน' }], recordLogs);
    next = {
      ...next,
      employment: createEmploymentForJob(next.economy.jobId),
    };
    if (next.planner?.grid) {
      const relockRes = sanitizePlannerWithRelockNotice(next.planner, next);
      next = {
        ...next,
        planner: relockRes.planner,
        timeAllocation: deriveWeeklyAllocation(relockRes.planner.grid, next),
      };
      if (relockRes.relockNoticeTh && recordLogs) {
        next = appendTimeline(next, {
          category: 'life',
          title: 'ปรับกิจกรรมในตารางอัตโนมัติ',
          description: relockRes.relockNoticeTh,
          explainReason: relockRes.relockNoticeTh,
        });
      }
    }
  }

  // ความเสื่อมหรือเติบโตตามวัย (แนวทางที่ 2 ทำงานควบคู่กับกิจวัตรแนวทางที่ 1)
  if (newAge > 45) {
    const ageLossEffects: Parameters<typeof applyEffects>[1] = [
      { type: 'ChangeRawStat', stat: 'endurance', delta: -0.6, reason: 'อายุมากขึ้น ความอึดลดลงตามวัย' },
      { type: 'ChangeRawStat', stat: 'strength', delta: -0.5, reason: 'พละกำลังถดถอยตามวัย' },
    ];
    if (newAge >= 60) {
      ageLossEffects.push({
        type: 'ChangeRawStat',
        stat: 'looks',
        delta: -0.4,
        reason: 'ริ้วรอยและความสดชื่นเปลี่ยนตามวัยสูงอายุ',
      });
      ageLossEffects.push({
        type: 'ChangeRawStat',
        stat: 'memory',
        delta: -0.3,
        reason: 'ความจำชะลอลงตามวัยสูงอายุ',
      });
    }
    next = applyEffects(next, ageLossEffects, recordLogs);
  } else if (newAge <= 24) {
    next = applyEffects(
      next,
      [
        { type: 'ChangeRawStat', stat: 'endurance', delta: 0.6, reason: 'ร่างกายยังอยู่ในวัยเจริญเติบโต' },
        { type: 'ChangeRawStat', stat: 'strength', delta: 0.5, reason: 'พละกำลังพัฒนาตามวัยหนุ่มสาว' },
        { type: 'ChangeRawStat', stat: 'wit', delta: 0.5, reason: 'ประสบการณ์ชีวิตและการเรียนรู้เพิ่มขึ้น' },
        { type: 'ChangeRawStat', stat: 'eq', delta: 0.3, reason: 'วุฒิภาวะทางอารมณ์เติบโตตามวัย' },
      ],
      recordLogs
    );
  } else {
    // วัยผู้ใหญ่ช่วงหลัก (25–44 ปี): วุฒิภาวะและความรับผิดชอบสั่งสม
    next = applyEffects(
      next,
      [
        { type: 'ChangeRawStat', stat: 'reliability', delta: 0.3, reason: 'ประสบการณ์การทำงานและความรับผิดชอบสั่งสม' },
        { type: 'ChangeRawStat', stat: 'eq', delta: 0.2, reason: 'ความนิ่งและวุฒิภาวะอารมณ์ในวัยผู้ใหญ่' },
      ],
      recordLogs
    );
  }

  // ปรับขึ้นเงินเดือนเล็กน้อยตามประสบการณ์ (ไม่เกิน maxSalaryCap)
  const job = JOBS[next.economy.jobId];
  if (job && job.monthlySalary > 0 && next.economy.monthlySalary < job.maxSalaryCap) {
    const raise = Math.min(job.maxSalaryCap - next.economy.monthlySalary, Math.round(next.economy.monthlySalary * 0.03));
    if (raise > 0) {
      next = {
        ...next,
        economy: recalculateEconomyDerived(next.character, {
          ...next.economy,
          monthlySalary: next.economy.monthlySalary + raise,
        }),
      };
    }
  }

  if (recordLogs) {
    const turnedAdult = wasMinor && !isMinor;
    next = appendTimeline(next, {
      category: turnedAdult ? 'milestone' : 'life',
      title: `ก้าวเข้าสู่อายุ ${newAge} ปี`,
      description: turnedAdult
        ? 'คุณอายุครบ 18 ปีบริบูรณ์แล้ว พ้นสถานะผู้เยาว์ และเข้าสู่โลกผู้ใหญ่อย่างเต็มตัว'
        : `ขึ้นปีใหม่ชีวิต อายุครบ ${newAge} ปี`,
    });
  }

  // Phase 3.2.3: ตรวจสุขภาพประจำปีตามคำสั่งประจำ (18+)
  if (newAge >= 18) {
    next = processAnnualHealthCheckupOnBirthday(next, recordLogs);
  }

  // Phase 3.3.1-FIX: จบ ป.6 (อายุ 12) เลือกโรงเรียน ม.ต้น
  if (
    newAge === 12 &&
    next.character.isAlive &&
    next.economy.jobId === 'student' &&
    !next.character.flags?.done_after_p6_school &&
    !next.pendingPrompt &&
    next.sceneMode?.sceneId !== 'hospital' &&
    allowPrompts
  ) {
    next = {
      ...next,
      pendingPrompt: buildAfterP6SchoolPrompt(next),
      needsPlayer: true,
    };
  }

  // Phase 3.3.1-FIX: จบ ม.3 (อายุ 15) ตรวจสิทธิ์วิกฤตครอบครัวก่อน หากไม่เข้าเกณฑ์เปิดเหตุการณ์เลือกสายเรียน ม.ปลาย
  if (
    newAge === 15 &&
    next.character.isAlive &&
    (state.economy.jobId === 'student' || prevAge === 14) &&
    !next.pendingPrompt &&
    next.sceneMode?.sceneId !== 'hospital' &&
    allowPrompts
  ) {
    if (isDropoutCrisisEligible(next) && !next.character.flags?.['storylet_done:ev_dropout_crisis']) {
      const crisisDef = STORYLET_CATALOG.find((s) => s.id === 'ev_dropout_crisis');
      if (crisisDef) {
        next = fireStorylet(next, crisisDef, allowPrompts, {
          bypassRules: true,
          sourceReason: 'จบช่วงชั้น ม.3 ท่ามกลางแรงกดดันค่าใช้จ่ายของครอบครัว',
        }).state;
      }
    } else if (next.economy.jobId === 'student' && !next.character.flags?.done_after_m3_choice) {
      next = {
        ...next,
        pendingPrompt: buildAfterM3ChoicePrompt(next),
        needsPlayer: true,
      };
    }
  }

  // Phase 3.2.3: สรุปผลเป้าหมายประจำปีที่ผ่านมา + เปิดเลือกเป้าหมายปีใหม่ (อายุ 13+, ห้ามทับ T3)
  if (newAge >= 13 && next.character.isAlive) {
    const basePlanner = next.planner;
    const prevAf = basePlanner?.annualFocus;
    if (
      prevAf &&
      prevAf.current !== 'none' &&
      prevAf.yearCE < next.date.yearCE &&
      prevAf.lastSummaryYearCE !== prevAf.yearCE
    ) {
      const afDigest = generateAnnualFocusDigest(next);
      if (recordLogs) {
        next = appendTimeline(next, {
          category: 'system',
          title: afDigest.title,
          description: afDigest.summaryLines.join(' · '),
          explainReason: 'สรุปผลเป้าหมายประจำปีจากข้อมูลจริงตลอดปีที่ผ่านมา',
        });
      }
    }

    const freshSnapshot = createInitialAnnualFocusState(next).snapshot;
    const keptCurrent = prevAf?.current ?? 'none';
    const rolledAf = {
      current: keptCurrent,
      yearCE: next.date.yearCE,
      changesThisYear: 0,
      lastSummaryYearCE: prevAf?.yearCE,
      lastPromptedAge: prevAf?.lastPromptedAge,
      snapshot: freshSnapshot,
    };

    if (basePlanner) {
      next = {
        ...next,
        planner: {
          ...basePlanner,
          annualFocus: rolledAf,
        },
      };
    }

    const alreadyPrompted = (rolledAf.lastPromptedAge ?? -1) >= newAge;
    if (
      allowPrompts &&
      !next.pendingPrompt &&
      !alreadyPrompted &&
      next.sceneMode?.sceneId !== 'hospital'
    ) {
      const prompt = buildAnnualFocusBirthdayPrompt(next);
      next = {
        ...next,
        pendingPrompt: prompt,
        needsPlayer: true,
        planner: next.planner
          ? {
              ...next.planner,
              annualFocus: {
                ...(next.planner.annualFocus ?? rolledAf),
                lastPromptedAge: newAge,
              },
            }
          : next.planner,
      };
    }
  }

  return next;
}

// --- 11-Step Fixed Tick Pipeline ---

// 1. เดินปฏิทิน
function stepCalendar(
  state: GameState,
  recordLogs = true,
  allowPrompts = true
): { state: GameState; isNewWeek: boolean; isNewMonth: boolean; isNewYear: boolean } {
  const adv = advanceOneDay(state.date);
  let next: GameState = {
    ...state,
    date: adv.nextDate,
    pendingAutosave: false,
  };
  // Spec 06 §4 #6: Confirmed Life Planner edits take effect at the start of the next in-game day
  if (
    next.planner?.pendingGrid &&
    next.planner.effectiveFromDay !== undefined &&
    next.date.totalDays >= next.planner.effectiveFromDay
  ) {
    const activeGrid = sanitizeGridForState(next.planner.pendingGrid, next);
    const activePresetId = next.planner.pendingPresetId ?? 'custom';
    next = {
      ...next,
      lifestylePresetId: activePresetId,
      planner: {
        ...next.planner,
        grid: activeGrid,
        presetId: activePresetId,
        pendingGrid: undefined,
        pendingPresetId: undefined,
        effectiveFromDay: undefined,
        draft: undefined,
      },
      timeAllocation: deriveWeeklyAllocation(activeGrid, next),
    };
  }
  if (adv.nextDate.month === 1 && adv.nextDate.day === 1) {
    next = stampTalentSwapWindow(next, `newyear_${adv.nextDate.yearCE}`);
    if (next.character.educationState) {
      next = {
        ...next,
        character: {
          ...next.character,
          educationState: {
            ...next.character.educationState,
            trackChangeCountThisYear: 0,
            trackChangeLastYearCE: adv.nextDate.yearCE,
          },
        },
      };
    }
  }
  next = onDay(next);
  if (adv.isNewWeek) next = onWeek(next, recordLogs);
  if (adv.isNewMonth) next = onMonth(next, recordLogs, allowPrompts, state.date.month);
  if (adv.isNewYear) next = onYear(next, recordLogs, allowPrompts);
  return {
    state: next,
    isNewWeek: adv.isNewWeek,
    isNewMonth: adv.isNewMonth,
    isNewYear: adv.isNewYear,
  };
}

// 2. ผลการใช้ชีวิตประจำวันจากตาราง 168 ชม. ที่พัก และงาน
function stepDailyLife(state: GameState): GameState {
  const { character, economy } = state;
  const housing = HOUSINGS[economy.housingId];
  const job = JOBS[economy.jobId] ?? JOBS.unemployed;
  const stageId = getLifeSubStageId(character.ageYears);
  const alloc =
    state.timeAllocation ??
    (state.planner?.grid
      ? deriveWeeklyAllocation(state.planner.grid, state)
      : DEFAULT_TIME_ALLOC_BY_STAGE[stageId]);
  const stageDefault = DEFAULT_TIME_ALLOC_BY_STAGE[stageId];

  // ผลต่างจากตาราง 168 ชม. (เมื่อเทียบกับค่ามาตรฐานของช่วงวัย)
  const sleepDiffEnergy = ((alloc.sleep - stageDefault.sleep) / 7) * 0.25;
  const sideGigEnergyCost = ((alloc.sideGig ?? 0) / 7) * 0.35;
  const selfDevEffort = Math.max(0, alloc.selfDev - stageDefault.selfDev) * 0.08;
  const hobbyDiffStress = ((alloc.hobby - stageDefault.hobby) / 7) * -0.14;
  const familyDiffStress = ((alloc.family - stageDefault.family) / 7) * -0.06;
  const overworkDiffStress =
    Math.max(0, alloc.workOrStudy + (alloc.sideGig ?? 0) - stageDefault.workOrStudy - 6) * 0.045;

  // พลังงานและความเครียดรายวัน พร้อมสมดุลธรรมชาติ (Homeostasis) ของความเครียด
  const isChild = character.ageYears < 15;
  const rawEnergyDelta =
    housing.energyRecoveryPerDay -
    job.energyCostPerDay +
    (isChild ? 2 : 0) +
    sleepDiffEnergy -
    sideGigEnergyCost -
    selfDevEffort;
  const stressTarget = character.ageYears < 6 ? 8 : character.ageYears < 15 ? 14 : 22;
  const stressHomeostasis = -(character.resources.stress - stressTarget) * 0.065;
  const rawStressDelta =
    (isChild ? 0 : housing.stressDeltaPerDay) +
    job.stressCostPerDay +
    stressHomeostasis +
    hobbyDiffStress +
    familyDiffStress +
    overworkDiffStress;

  const nextEnergy = round2(clamp(character.resources.energy + rawEnergyDelta, 0, 100));
  const nextStress = round2(clamp(character.resources.stress + rawStressDelta, 0, 100));
  const nextFreeTime = round2(
    clamp(24 - alloc.sleep / 7 - (alloc.workOrStudy + (alloc.sideGig ?? 0)) / 7, 0.5, 16)
  );

  // รายจ่ายค่ากินอยู่รายวัน (อายุ < 15 หรือผู้เยาว์ < 18 ที่อยู่บ้านพ่อแม่: พ่อแม่รับผิดชอบค่ากิน)
  const regionMult = getRegionCostMultiplier(character.background.region);
  const parentsCoverFood =
    character.ageYears < 15 || (character.ageYears < 18 && economy.housingId === 'parents_home');
  const dailyLiving = parentsCoverFood
    ? 0
    : Math.round((BASE_MONTHLY_LIVING_COST * regionMult) / 30);

  const nextCash = Math.round(economy.cash - dailyLiving);

  let finalCash = nextCash;
  let addedDebt = 0;
  if (finalCash < 0) {
    addedDebt = Math.abs(finalCash);
    finalCash = 0;
  }

  let nextEconomy = {
    ...economy,
    cash: finalCash,
    debt: economy.debt + addedDebt,
  };
  const nextCharacter = {
    ...character,
    resources: {
      energy: nextEnergy,
      stress: nextStress,
      freeTime: nextFreeTime,
    },
  };

  nextEconomy = recalculateEconomyDerived(nextCharacter, nextEconomy);
  nextCharacter.indices = computeLifeIndices(nextCharacter, nextEconomy);

  return grantDailyJobSkillXp({
    ...state,
    character: nextCharacter,
    economy: nextEconomy,
  });
}

// 2b. วงจรสถานที่ชั่วคราวและการพักฟื้นในโรงพยาบาล (Scene Mode Lifecycle)
function stepSceneModeLifecycle(state: GameState, recordLogs = true): GameState {
  const mode = state.sceneMode;
  if (!mode || !state.character.isAlive) return state;

  let next = state;

  // ระหว่างนอนโรงพยาบาล พลังงานและกายฟื้นตัวเป็นพิเศษ
  if (mode.sceneId === 'hospital') {
    const healedEnergy = round2(clamp(next.character.resources.energy + 4.5, 0, 100));
    const calmerStress = round2(clamp(next.character.resources.stress - 2, 0, 100));
    const nextChar = {
      ...next.character,
      resources: {
        ...next.character.resources,
        energy: healedEnergy,
        stress: calmerStress,
      },
    };
    nextChar.indices = computeLifeIndices(nextChar, next.economy);
    next = {
      ...next,
      character: nextChar,
    };
  }

  const expiresAt = mode.expiresAtTotalDay ?? (mode.startedAtTotalDay ?? state.date.totalDays) + 2;
  if (next.date.totalDays >= expiresAt) {
    const wasHospital = mode.sceneId === 'hospital';
    next = {
      ...next,
      sceneMode: null,
    };

    if (wasHospital && recordLogs) {
      const desc =
        mode.returnSummary ??
        'พักรักษาตัวครบกำหนดแล้ว อาการดีขึ้นตามลำดับ แพทย์อนุญาตให้กลับไปพักผ่อนและใช้ชีวิตตามปกติได้';
      next = appendTimeline(next, {
        category: 'health',
        tier: 'T1',
        title: 'ออกจากโรงพยาบาลแล้ว',
        description: desc,
        explainReason: 'ครบกำหนดพักฟื้นตามแผนการรักษา จึงย้ายฉากกลับสู่ชีวิตประจำวัน',
      });
      next = {
        ...next,
        activeToast: {
          id: `discharge_${next.date.totalDays}`,
          title: 'ออกจากโรงพยาบาลแล้ว',
          description: desc,
          tier: 'T1',
          category: 'health',
          expiresAtTotalDay: next.date.totalDays + 5,
          explainReason: 'รักษาตัวครบกำหนดวันพักฟื้นแล้ว',
        },
      };
    }
  }

  return next;
}

// 3. อัปเดตโลก (Stub สำหรับ Phase 6/7)
function stepWorld(state: GameState): GameState {
  // TODO(Phase 6/7): อัปเดตเศรษฐกิจมหภาค ข่าวสารสังคม และแนวโน้มตลาดแรงงาน
  return state;
}

// 4. อัปเดต NPC (Stub สำหรับ Phase 4)
function stepNPCs(state: GameState): GameState {
  // TODO(Phase 4): อัปเดต NPC LOD 3 ระดับ และการตัดสินใจแบบ Utility AI
  return state;
}

// 5. Hazard (ความเสี่ยงด้านสุขภาพและอายุขัย)
function stepHazards(state: GameState, recordLogs = true): GameState {
  const { character } = state;
  if (!character.isAlive) return state;

  const age = character.ageYears;
  let baseDailyDeathRate = age < 15 ? 0.0000004 : 0.000004; // เด็กปลอดภัยสูง / วัยหนุ่มสาว (~0.14%/ปี)

  if (age >= 45 && age < 60) baseDailyDeathRate = 0.000016;
  else if (age >= 60 && age < 70) baseDailyDeathRate = 0.000055;
  else if (age >= 70 && age < 80) baseDailyDeathRate = 0.00018;
  else if (age >= 80 && age < 90) baseDailyDeathRate = 0.00052;
  else if (age >= 90) baseDailyDeathRate = 0.0014;

  // ปรับตามสุขภาพกายและพันธุกรรม
  const healthMod = clamp(1.32 - character.indices.physical / 145, 0.55, 2.0);
  const stressMod = character.resources.stress > 88 && character.resources.energy < 15 ? 1.65 : 1.0;

  // ถ้าอายุ >= 108 ให้จบชีวิตตามอายุขัยสูงสุดอย่างเป็นธรรมชาติ
  if (age >= 108) {
    let dead = applyEffects(state, [{ type: 'SetDeath', cause: 'ชราภาพตามอายุขัย' }], recordLogs);
    if (recordLogs) {
      dead = appendTimeline(dead, {
        category: 'health',
        title: 'ปิดฉากชีวิตอย่างสงบ',
        description: `คุณจากไปในวัย ${age} ปี ด้วยโรคชรา`,
      });
    }
    return dead;
  }

  const roll = nextRandom(state.rngState);
  let next: GameState = { ...state, rngState: roll.rngState };

  const traitHazard = hazardModifiers(next).multiplier;
  const checkupHazard = getHealthCheckupHazardMultiplier(next);
  const hazardProb = baseDailyDeathRate * healthMod * stressMod * traitHazard * checkupHazard;
  if (roll.value < hazardProb) {
    const cause =
      age >= 68
        ? 'โรคชราและภาวะแทรกซ้อน'
        : character.resources.stress > 85
          ? 'ภาวะหัวใจล้มเหลวเฉียบพลันจากความเครียดสะสม'
          : 'อุบัติเหตุหรืออาการเจ็บป่วยฉับพลัน';

    next = applyEffects(next, [{ type: 'SetDeath', cause }], recordLogs);
    if (recordLogs) {
      next = appendTimeline(next, {
        category: 'health',
        title: 'สิ้นสุดการเดินทางของชีวิต',
        description: `คุณเสียชีวิตในวัย ${age} ปี สาเหตุ: ${cause}`,
      });
    }
  }

  return next;
}

// 6. เกณฑ์สถานะ
function stepThresholds(state: GameState): GameState {
  if (!state.character.isAlive) return state;
  const indices = computeLifeIndices(state.character, state.economy);
  return {
    ...state,
    character: {
      ...state.character,
      indices,
    },
  };
}

// 7. Echo Queue (ผลลัพธ์หน่วงเวลาที่ตั้งไว้ล่วงหน้า)
function stepEchoQueue(state: GameState): GameState {
  if (!state.character.isAlive || state.echoQueue.length === 0) return state;

  const due = state.echoQueue.filter((e) => e.triggerOnDay <= state.date.totalDays);
  if (due.length === 0) return state;

  const remaining = state.echoQueue.filter((e) => e.triggerOnDay > state.date.totalDays);
  let next: GameState = { ...state, echoQueue: remaining };

  for (const item of due) {
    next = applyEffects(next, item.effects);
    next = appendTimeline(next, {
      category: 'echo',
      title: item.title,
      description: item.description,
      effectsSummary: summarizeEffects(item.effects),
    });
  }
  return next;
}

function filterChoicesByAge(prompt: PendingEventPrompt, isMinor: boolean): PendingEventPrompt {
  return {
    ...prompt,
    choices: prompt.choices.filter((c) => !(isMinor && c.requiresAdult)),
  };
}

// 8. Event Director (Phase 3 Storylet & Dynamic Director)
function stepEventDirector(state: GameState, allowPrompts: boolean): GameState {
  return runEventDirector(state, allowPrompts).state;
}

// 9. ส่งเหตุการณ์ (ตรวจ needsPlayer)
function stepDispatchEvents(state: GameState): GameState {
  return {
    ...state,
    needsPlayer: state.pendingPrompt !== null || !state.character.isAlive,
  };
}

// 10. Autopilot (ตัดสินใจแทนอัตโนมัติ หรือหยุดเวลาเมื่อไม่มี Standing Order รองรับ)
function stepAutopilot(state: GameState, recordLogs = true): GameState {
  if (!state.character.isAlive || state.pendingPrompt) return state;
  const situation = state.pendingAutopilotSituation;
  if (!situation) return state;

  const decision = autopilotDecide(state, situation, state.rngState);
  let next: GameState = { ...state, rngState: decision.rngState };

  if (decision.handled && decision.chosenOption) {
    next = resolveAutopilotWithOption(
      next,
      situation,
      decision.chosenOption,
      decision.explainReasonTh,
      recordLogs
    );
    return next;
  }

  return {
    ...next,
    needsPlayer: true,
  };
}

// 11. จุดเซฟ
function stepAutosaveCheck(state: GameState, isNewMonth: boolean): GameState {
  if (isNewMonth && state.character.isAlive) {
    return {
      ...state,
      pendingAutosave: true,
    };
  }
  return state;
}

export interface StepTickOptions {
  allowPrompts?: boolean; // ใน headless simulator ปิด prompt เพื่อรันยาวจนจบชีวิตได้
  recordLogs?: boolean;   // ปิดการสร้าง string timeline/audit ใน headless simulator เพื่อความเร็ว
}

export function stepOneTick(state: GameState, options: StepTickOptions = {}): GameState {
  const allowPrompts = options.allowPrompts ?? true;
  const recordLogs = options.recordLogs ?? true;

  if (!state.character.isAlive || (allowPrompts && state.needsPlayer)) {
    return state;
  }

  // 1. เดินปฏิทิน
  const cal = stepCalendar(state, recordLogs, allowPrompts);
  let next = cal.state;
  // 2. ผลการใช้ชีวิตประจำวัน
  next = stepDailyLife(next);
  // 2b. วงจรสถานที่ชั่วคราว / การพักฟื้นโรงพยาบาล
  next = stepSceneModeLifecycle(next, recordLogs);
  // 3. อัปเดตโลก
  next = stepWorld(next);
  // 4. อัปเดต NPC
  next = stepNPCs(next);
  // 5. Hazard
  next = stepHazards(next, recordLogs);
  // 6. เกณฑ์สถานะ
  next = stepThresholds(next);
  // 7. Echo Queue
  next = stepEchoQueue(next);
  // 8. Event Director
  next = stepEventDirector(next, allowPrompts);
  // 9. ส่งเหตุการณ์
  next = stepDispatchEvents(next);
  // 10. Autopilot
  next = stepAutopilot(next, recordLogs);
  // 11. จุดเซฟ
  next = stepAutosaveCheck(next, cal.isNewMonth);

  return next;
}

export function skipToNextMilestone(
  state: GameState,
  target: 'month' | 'year' | 'milestone',
  maxTicks = 400
): GameState {
  const beforeState = state;
  let current = state;
  const startMonth = current.date.month;
  const startYear = current.date.yearCE;
  const startAge = current.character.ageYears;
  const startStage = current.character.lifeStage;
  const initialClearCoreIds = new Set(
    (current.character.emergentTraits ?? [])
      .filter((t) => t.intensity === 'clear' || t.intensity === 'core')
      .map((t) => t.id)
  );
  const startTimelineLen = current.timeline.length;
  let turningPointsCount = 0;
  let autopilotActionsCount = 0;

  for (let i = 0; i < maxTicks; i++) {
    if (!current.character.isAlive || current.needsPlayer) break;
    const prevLogCount = current.timeline.length;
    current = stepOneTick(current, { allowPrompts: true });

    const newEntries = current.timeline.slice(prevLogCount);
    for (const entry of newEntries) {
      if (entry.category === 'autopilot') autopilotActionsCount++;
      if (entry.title.startsWith('จุดเปลี่ยนชีวิต:')) turningPointsCount++;
    }

    if (current.needsPlayer || !current.character.isAlive) break;
    if (target === 'month' && current.date.month !== startMonth) break;
    if (target === 'year' && current.date.yearCE !== startYear) break;
    if (target === 'milestone') {
      const birthdayHit = current.character.ageYears !== startAge;
      const stageHit = current.character.lifeStage !== startStage;
      const newMajorTrait = (current.character.emergentTraits ?? []).some(
        (t) =>
          (t.intensity === 'clear' || t.intensity === 'core') &&
          !initialClearCoreIds.has(t.id) &&
          t.visibility === 'known'
      );
      const turningPointHit = newEntries.some((e) => e.title.startsWith('จุดเปลี่ยนชีวิต:'));
      if (birthdayHit || stageHit || newMajorTrait || turningPointHit) break;
    }
  }

  void startTimelineLen;
  const digest = buildPeriodDigest(beforeState, current, {
    turningPointsCount,
    autopilotActionsCount,
  });

  return {
    ...current,
    lastDigest: digest,
  };
}

export function getReadableDateHeader(state: GameState): string {
  return formatThaiDate(state.date);
}
