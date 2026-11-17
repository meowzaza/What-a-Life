import { AGE_LEGAL_RULES } from '../data/lifeStages';
import {
  EDUCATION_LABELS,
  EDUCATION_RANK,
  HOUSINGS,
  JOBS,
  RAW_STAT_LABELS,
  REGIONS,
  SKILL_LABELS,
} from '../data/thaiData';
import { UI_TEXT } from '../data/uiText';
import { evaluateAppearanceImpact } from './appearance';
import { getAgeEmploymentRules } from './lifeStage';
import { clamp } from './rng';
import type {
  EconomyState,
  GameSettings,
  GameState,
  HousingId,
  Person,
  RawStatKey,
  RegionId,
  SkillKey,
} from './types';

export const BASE_MONTHLY_LIVING_COST = 5200; // ค่าอาหาร ค่าเดินทาง ของใช้จำเป็นพื้นฐานในไทย
export const MONTHLY_DEBT_INTEREST_RATE = 0.015; // 1.5% ต่อเดือน (~18% ต่อปี)
export const MIN_DEBT_PAYMENT_RATE = 0.05; // ผ่อนขั้นต่ำ 5% ของยอดหนี้ หรืออย่างน้อย 500 บาท

export function getRegionCostMultiplier(region: RegionId): number {
  return REGIONS.find((r) => r.id === region)?.costMultiplier ?? 1.0;
}

export function calculateCreditLimit(
  monthlySalary: number,
  creditScore: number,
  currentDebt: number,
  ageYears = 18
): number {
  if (ageYears < 18 || creditScore < 420) return 0;
  const grossLimit = Math.round((monthlySalary * 3.5 + Math.max(0, creditScore - 420) * 180) / 500) * 500;
  const maxCapped = Math.min(800000, grossLimit);
  return Math.max(0, maxCapped - Math.round(currentDebt));
}

export function estimateMonthlyExpenses(
  region: RegionId,
  housingId: HousingId,
  debt: number,
  ageYears: number
): number {
  if (ageYears < 15) return 0; // พ่อแม่รับผิดชอบค่ากินอยู่และที่พักทั้งหมด
  const mult = getRegionCostMultiplier(region);
  const housing = HOUSINGS[housingId];
  const ageFactor = ageYears < 18 ? 0.55 : 1.0;
  const living = ageYears < 18 && housingId === 'parents_home' ? 0 : Math.round(BASE_MONTHLY_LIVING_COST * mult * ageFactor);
  const rent = ageYears < 18 && housingId === 'parents_home' ? 0 : housing.monthlyRent;
  const debtService = debt > 0 ? Math.min(debt, Math.max(500, Math.round(debt * MIN_DEBT_PAYMENT_RATE))) : 0;
  return living + rent + debtService;
}

export function recalculateEconomyDerived(person: Person, economy: EconomyState): EconomyState {
  const job = JOBS[economy.jobId] ?? JOBS.unemployed;
  const salary = clamp(economy.monthlySalary, 0, job.maxSalaryCap);
  const creditScore = Math.round(clamp(economy.creditScore, 300, 900));
  const debt = Math.max(0, Math.round(economy.debt));
  const creditLimit = calculateCreditLimit(salary, creditScore, debt, person.ageYears);
  const monthlyExpenses = estimateMonthlyExpenses(
    person.background.region,
    economy.housingId,
    debt,
    person.ageYears
  );

  return {
    ...economy,
    monthlySalary: salary,
    jobTitle: job.title,
    creditScore,
    debt,
    creditLimit,
    monthlyExpenses,
  };
}

export interface EligibilityResult {
  allowed: boolean;
  reasons: string[];
  warnings?: string[];
}

export interface SideGigEligibilityResult {
  allowed: boolean;
  maxHours: number;
  reasonTh?: string;
}

/**
 * Single Engine Gate for all side-gig hours and income checks (Spec 05 §3).
 * Called by timeAlloc.ts, dayPlan.ts, state.ts, and save.ts.
 */
export function checkSideGigEligibility(
  state: GameState,
  proposedSideGigHours?: number
): SideGigEligibilityResult {
  const age = state.character.ageYears;
  if (age < AGE_LEGAL_RULES.minAnyEmploymentAge) {
    return {
      allowed: false,
      maxHours: 0,
      reasonTh: UI_TEXT.LIFESTYLE.minorSideGigUnder15,
    };
  }

  const record = state.sideGigRecord;
  if (!record) {
    return {
      allowed: false,
      maxHours: 0,
      reasonTh:
        age < AGE_LEGAL_RULES.minAdultFullWorkAge
          ? UI_TEXT.LIFESTYLE.minorSideGigNoRecord
          : UI_TEXT.LIFESTYLE.adultSideGigNoRecord,
    };
  }

  if (age < AGE_LEGAL_RULES.minAdultFullWorkAge) {
    if (record.isNightShift) {
      return {
        allowed: false,
        maxHours: 0,
        reasonTh: UI_TEXT.LIFESTYLE.minorSideGigNightForbidden,
      };
    }
    const workOrStudyHours = state.timeAllocation?.workOrStudy ?? 0;
    const remainingWeeklyCap = Math.max(
      0,
      AGE_LEGAL_RULES.minorMaxWeeklyWorkHours - workOrStudyHours
    );
    const maxHours = Math.min(record.maxWeeklyHours, remainingWeeklyCap, 40);
    if (maxHours <= 0 || (proposedSideGigHours !== undefined && proposedSideGigHours > maxHours)) {
      return {
        allowed: false,
        maxHours,
        reasonTh: UI_TEXT.LIFESTYLE.minorSideGigOverHours,
      };
    }
    return { allowed: true, maxHours };
  }

  const maxHours = Math.min(record.maxWeeklyHours, 40);
  if (proposedSideGigHours !== undefined && proposedSideGigHours > maxHours) {
    return {
      allowed: false,
      maxHours,
      reasonTh: `งานเสริมปัจจุบันจำกัดสูงสุด ${maxHours} ชม./สัปดาห์`,
    };
  }
  return { allowed: true, maxHours };
}

export function checkJobEligibility(
  person: Person,
  jobId: string,
  settings?: Partial<GameSettings>,
  currentJobId?: string
): EligibilityResult {
  const job = JOBS[jobId];
  if (!job) {
    return { allowed: false, reasons: ['ไม่พบข้อมูลอาชีพนี้'] };
  }
  const reasons: string[] = [];
  const warnings: string[] = [];
  const ageRules = getAgeEmploymentRules(person.ageYears, settings);

  // Spec 05 §3: Block accidental student -> unemployed transition until Phase 3.3 dropout event exists
  if (currentJobId === 'student' && jobId === 'unemployed') {
    reasons.push(UI_TEXT.LIFESTYLE.studentDropoutLockReason);
  }

  if (jobId !== 'student' && jobId !== 'infant' && jobId !== 'unemployed' && !ageRules.canWorkAny) {
    reasons.push('อายุต่ำกว่า 15 ปี ยังไม่สามารถทำงานรับจ้างได้ตามกฎหมาย');
  }
  if (jobId.startsWith('pub_') && !ageRules.canWorkEntertainmentVenue) {
    reasons.push('งานในสถานบันเทิง/ผับบาร์ต้องอายุ 18 ปีขึ้นไป');
  }
  if (person.ageYears < job.minAge) {
    reasons.push(`ต้องอายุอย่างน้อย ${job.minAge} ปี`);
  }
  if (job.maxAge !== undefined && person.ageYears > job.maxAge) {
    reasons.push(`จำกัดอายุไม่เกิน ${job.maxAge} ปี`);
  }
  if (EDUCATION_RANK[person.education] < EDUCATION_RANK[job.minEducation]) {
    reasons.push(`ต้องมีวุฒิอย่างน้อย ${EDUCATION_LABELS[job.minEducation]}`);
  }
  if (person.indices.competence < job.minCompetence) {
    reasons.push(`ดัชนีความสามารถต้องถึง ${job.minCompetence} (ปัจจุบัน ${person.indices.competence})`);
  }
  if (job.minSkill) {
    for (const [sKey, minVal] of Object.entries(job.minSkill)) {
      const k = sKey as SkillKey;
      const cur = Math.floor(person.skills[k]);
      if (cur < (minVal ?? 0)) {
        reasons.push(`ทักษะ${SKILL_LABELS[k].label} ต้องถึง ${minVal} (ปัจจุบัน ${cur})`);
      }
    }
  }
  if (job.minRawStats) {
    for (const [rKey, minVal] of Object.entries(job.minRawStats)) {
      const k = rKey as RawStatKey;
      const cur = Math.round(person.rawStats[k]);
      if (cur < (minVal ?? 0)) {
        reasons.push(`${RAW_STAT_LABELS[k].label} ต้องถึง ${minVal} (ปัจจุบัน ${cur})`);
      }
    }
  }

  const appearanceImpact = evaluateAppearanceImpact(person);
  if (job.dressCode === 'strict_formal' && appearanceImpact.blocksStrictFormalJobs) {
    reasons.push(
      `${job.title}ไม่รองรับ${appearanceImpact.blockedReasonTh ?? 'ผมย้อมสีแฟชั่น/ลุคจัดจ้าน'} — ต้องปรับลุคให้สุภาพก่อน`
    );
  } else if (job.dressCode === 'neat' && appearanceImpact.formalCredibilityDelta < 0) {
    warnings.push(
      `ลุคปัจจุบัน (${appearanceImpact.activeStyleLabelTh}) ลดความน่าเชื่อถือในสายงานนี้เล็กน้อย`
    );
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

export function checkHousingEligibility(economy: EconomyState, housingId: HousingId): EligibilityResult {
  const housing = HOUSINGS[housingId];
  if (!housing) {
    return { allowed: false, reasons: ['ไม่พบข้อมูลที่อยู่อาศัย'] };
  }
  if (economy.housingId === housingId) {
    return { allowed: false, reasons: ['กำลังพักอาศัยอยู่ที่นี่อยู่แล้ว'] };
  }
  const reasons: string[] = [];
  if (economy.cash < housing.depositRequired) {
    reasons.push(`ต้องมีเงินมัดจำ/ล่วงหน้า ${housing.depositRequired.toLocaleString('th-TH')} บาท`);
  }
  if (economy.creditScore < housing.minCreditScore) {
    reasons.push(`ต้องมีคะแนนเครดิตอย่างน้อย ${housing.minCreditScore}`);
  }
  return {
    allowed: reasons.length === 0,
    reasons,
  };
}
