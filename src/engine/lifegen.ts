import {
  AT_AGE_TURNING_POINTS,
  EDUCATION_LABELS,
  EDUCATION_RANK,
  FAMILY_STRUCTURES,
  FIRST_NAMES,
  HOUSINGS,
  JOBS,
  LAST_NAMES,
  NICKNAMES_BY_GENDER,
  NICKNAMES_UNISEX,
  PARENT_EDUCATIONS,
  REGIONS,
  TEMPERAMENTS,
  WEALTH_TIERS,
} from '../data/thaiData';
import { buildCharacterAppearance } from './appearance';
import { createDate } from './clock';
import { recalculateEconomyDerived } from './economy';
import { getLifeSubStageId } from './lifeStage';
import { clamp, nextRandom, normalizeSeed, pickOne, randInt, randNormalApprox, weightedPick } from './rng';
import { computeLifeIndices } from './stats';
import { initTraitsForPerson } from './traits';
import type {
  AtAgeLifeOptions,
  BackgroundProfile,
  BackstorySummary,
  CustomLifeOptions,
  EconomyState,
  EducationLevel,
  EvidenceState,
  FamilyWealthTier,
  Gender,
  HousingId,
  LifeGenRequest,
  ParentEducation,
  Person,
  RawStats,
  Skills,
} from './types';

export interface GeneratedLife {
  person: Person;
  economy: EconomyState;
  starterEvidence: EvidenceState;
  startYearCE: number;
  rngState: number;
}

export function getMaxPlausibleEducation(ageYears: number): EducationLevel {
  if (ageYears < 12) return 'none';
  if (ageYears < 15) return 'primary';
  if (ageYears < 18) return 'lower_secondary';
  if (ageYears < 22) return 'vocational'; // ม.6 / ปวช. จบได้ตั้งแต่อายุ 18
  if (ageYears < 24) return 'bachelor';
  if (ageYears <= 25) return 'master'; // กฎเหล็ก: อายุ 25 เป็นดอกเตอร์ไม่ได้
  return 'doctorate';
}

export function enforceEducationPlausibility(ageYears: number, requested: EducationLevel): EducationLevel {
  const maxEdu = getMaxPlausibleEducation(ageYears);
  if (EDUCATION_RANK[requested] > EDUCATION_RANK[maxEdu]) {
    return maxEdu;
  }
  return requested;
}

export interface PlausibilityReport {
  valid: boolean;
  violations: string[];
}

export function validateLifePlausibility(person: Person, economy: EconomyState): PlausibilityReport {
  const violations: string[] = [];

  if (person.isMinor !== (person.ageYears < 18)) {
    violations.push(`isMinor flag (${person.isMinor}) ไม่ตรงกับอายุ (${person.ageYears})`);
  }

  const maxEdu = getMaxPlausibleEducation(person.ageYears);
  if (EDUCATION_RANK[person.education] > EDUCATION_RANK[maxEdu]) {
    violations.push(`อายุ ${person.ageYears} ปี ไม่สามารถจบวุฒิ ${EDUCATION_LABELS[person.education]} ได้`);
  }

  if (person.ageYears <= 25 && person.education === 'doctorate') {
    violations.push('อายุ 25 ปีหรือต่ำกว่าไม่สามารถจบปริญญาเอกได้');
  }

  const job = JOBS[economy.jobId];
  if (!job) {
    violations.push(`ไม่พบอาชีพ ${economy.jobId}`);
  } else {
    if (person.ageYears < job.minAge) {
      violations.push(`อายุ ${person.ageYears} ต่ำกว่าเกณฑ์ขั้นต่ำของอาชีพ ${job.title} (${job.minAge})`);
    }
    if (EDUCATION_RANK[person.education] < EDUCATION_RANK[job.minEducation]) {
      violations.push(`วุฒิ ${person.education} ต่ำกว่าเกณฑ์ของอาชีพ ${job.title}`);
    }
    if (economy.monthlySalary > job.maxSalaryCap) {
      violations.push(`เงินเดือน ${economy.monthlySalary} เกินเพดานของอาชีพ ${job.title}`);
    }
  }

  if (economy.debt < 0) {
    violations.push('หนี้สินติดลบไม่ได้');
  }

  if (person.background.geneticHealth < 15 || person.background.geneticHealth > 100) {
    violations.push('พันธุกรรมสุขภาพอยู่นอกช่วง 15..100');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

function pickParentEducationForWealth(rngState: number, wealth: FamilyWealthTier): { value: ParentEducation; rngState: number } {
  const map: Record<FamilyWealthTier, ParentEducation[]> = {
    destitute: ['primary', 'primary', 'secondary'],
    working_poor: ['primary', 'secondary', 'secondary', 'vocational'],
    lower_middle: ['secondary', 'vocational', 'bachelor'],
    middle: ['vocational', 'bachelor', 'bachelor', 'postgrad'],
    upper_middle: ['bachelor', 'bachelor', 'postgrad'],
    wealthy: ['bachelor', 'postgrad', 'postgrad'],
  };
  return pickOne(rngState, map[wealth]);
}

function buildInitialRawStats(
  rngState: number,
  wealth: FamilyWealthTier,
  geneticHealth: number,
  temperamentId: BackgroundProfile['temperament']
): { rawStats: RawStats; rngState: number } {
  let state = rngState;
  const wealthBonus =
    wealth === 'wealthy' ? 8 : wealth === 'upper_middle' ? 5 : wealth === 'middle' ? 2 : wealth === 'destitute' ? -4 : 0;

  const sampleStat = (mean: number): number => {
    const r = randNormalApprox(state, mean, 11);
    state = r.rngState;
    return Math.round(clamp(r.value, 18, 88));
  };

  const healthBase = Math.round(clamp(geneticHealth * 0.65 + 15, 25, 85));
  const rawStats: RawStats = {
    looks: sampleStat(48 + wealthBonus),
    strength: sampleStat(healthBase - 2),
    endurance: sampleStat(healthBase),
    wit: sampleStat(50 + wealthBonus * 0.5),
    memory: sampleStat(50 + wealthBonus * 0.5),
    creativity: sampleStat(48),
    eq: sampleStat(48),
    charisma: sampleStat(48 + wealthBonus * 0.4),
    reliability: sampleStat(52),
  };

  const tempMeta = TEMPERAMENTS.find((t) => t.id === temperamentId);
  if (tempMeta) {
    for (const [k, delta] of Object.entries(tempMeta.statBias)) {
      const key = k as keyof RawStats;
      rawStats[key] = Math.round(clamp(rawStats[key] + (delta ?? 0), 15, 95));
    }
  }

  return { rawStats, rngState: state };
}

function buildInitialSkills(
  rngState: number,
  ageYears: number,
  education: EducationLevel,
  wealth: FamilyWealthTier
): { skills: Skills; rngState: number } {
  let state = rngState;
  const eduRank = EDUCATION_RANK[education];
  const ageFactor = Math.max(0, ageYears - 12);
  const wealthEngBonus = wealth === 'wealthy' ? 18 : wealth === 'upper_middle' ? 12 : wealth === 'middle' ? 6 : 0;

  const rollSkill = (base: number): number => {
    const r = randInt(state, 0, 10);
    state = r.rngState;
    return Math.round(clamp(base + r.value, 0, 85));
  };

  const skills: Skills = {
    english: rollSkill(eduRank * 4 + wealthEngBonus + ageFactor * 0.4),
    sales: rollSkill(ageFactor * 0.6),
    finance: rollSkill(ageFactor * 0.5 + (wealth === 'wealthy' ? 6 : 0)),
    tech: rollSkill(eduRank * 3 + ageFactor * 0.5),
    craft: rollSkill(wealth === 'working_poor' || wealth === 'lower_middle' ? 10 + ageFactor * 0.5 : ageFactor * 0.3),
    cooking: rollSkill(6 + ageFactor * 0.4),
    socializing: rollSkill(10 + ageFactor * 0.5),
    academic: rollSkill(eduRank * 6 + ageFactor * 0.2),
  };

  return { skills, rngState: state };
}

function generateBackground(rngState: number, opts?: CustomLifeOptions): { bg: BackgroundProfile; gender: Gender; firstName: string; lastName: string; nickname: string; rngState: number } {
  let state = rngState;

  // Gender
  let gender: Gender = opts?.gender ?? 'male';
  if (!opts?.gender) {
    const gPick = weightedPick(state, [
      { id: 'male' as Gender, weight: 48 },
      { id: 'female' as Gender, weight: 48 },
      { id: 'nonbinary' as Gender, weight: 4 },
    ]);
    gender = gPick.value.id;
    state = gPick.rngState;
  }

  // Names
  let firstName = opts?.firstName?.trim();
  if (!firstName) {
    const p = pickOne(state, FIRST_NAMES[gender]);
    firstName = p.value;
    state = p.rngState;
  }
  let lastName = opts?.lastName?.trim();
  if (!lastName) {
    const p = pickOne(state, LAST_NAMES);
    lastName = p.value;
    state = p.rngState;
  }
  let nickname = opts?.nickname?.trim();
  if (!nickname) {
    const nicknamePool =
      gender === 'nonbinary'
        ? NICKNAMES_UNISEX
        : [...NICKNAMES_BY_GENDER[gender], ...NICKNAMES_UNISEX.slice(0, 20)];
    const p = pickOne(state, nicknamePool);
    nickname = p.value;
    state = p.rngState;
  }

  // Region & Province
  let regionInfo = REGIONS.find((r) => r.id === opts?.region);
  if (!regionInfo) {
    const rPick = weightedPick(state, REGIONS);
    regionInfo = rPick.value;
    state = rPick.rngState;
  }
  let province = opts?.province;
  if (!province || !regionInfo.provinces.includes(province)) {
    const pPick = pickOne(state, regionInfo.provinces);
    province = pPick.value;
    state = pPick.rngState;
  }

  // Family Wealth
  let wealthInfo = WEALTH_TIERS.find((w) => w.id === opts?.familyWealth);
  if (!wealthInfo) {
    const wPick = weightedPick(state, WEALTH_TIERS);
    wealthInfo = wPick.value;
    state = wPick.rngState;
  }

  const fatherJobPick = pickOne(state, wealthInfo.parentJobs);
  state = fatherJobPick.rngState;
  const motherJobPick = pickOne(state, wealthInfo.parentJobs);
  state = motherJobPick.rngState;

  // Family structure
  let familyStructure = opts?.familyStructure;
  if (!familyStructure) {
    const fsPick = weightedPick(state, FAMILY_STRUCTURES);
    familyStructure = fsPick.value.id;
    state = fsPick.rngState;
  }

  // Parent education
  let parentEducation = opts?.parentEducation;
  if (!parentEducation) {
    const pePick = pickParentEducationForWealth(state, wealthInfo.id);
    parentEducation = pePick.value;
    state = pePick.rngState;
  }

  // Temperament
  let temperament = opts?.temperament;
  if (!temperament) {
    const tPick = pickOne(state, TEMPERAMENTS);
    temperament = tPick.value.id;
    state = tPick.rngState;
  }

  // Genetic health
  let geneticHealth = opts?.geneticHealth;
  if (geneticHealth === undefined) {
    const gRoll = randNormalApprox(state, 68, 13);
    state = gRoll.rngState;
    geneticHealth = Math.round(clamp(gRoll.value, 25, 98));
  } else {
    geneticHealth = Math.round(clamp(geneticHealth, 25, 98));
  }

  return {
    bg: {
      region: regionInfo.id,
      province,
      familyWealth: wealthInfo.id,
      fatherJob: fatherJobPick.value,
      motherJob: motherJobPick.value,
      familyStructure,
      parentEducation,
      temperament,
      geneticHealth,
    },
    gender,
    firstName,
    lastName,
    nickname,
    rngState: state,
  };
}

function defaultEducationForAge(rngState: number, ageYears: number, wealth: FamilyWealthTier): { edu: EducationLevel; rngState: number } {
  let state = rngState;
  const roll = nextRandom(state);
  state = roll.rngState;
  const highWealth = wealth === 'middle' || wealth === 'upper_middle' || wealth === 'wealthy';

  if (ageYears < 12) return { edu: 'none', rngState: state };
  if (ageYears < 15) return { edu: 'primary', rngState: state };
  if (ageYears < 18) return { edu: 'lower_secondary', rngState: state };
  if (ageYears < 22) {
    return { edu: roll.value < 0.35 && !highWealth ? 'vocational' : 'upper_secondary', rngState: state };
  }
  if (ageYears < 26) {
    if (highWealth || roll.value > 0.45) return { edu: 'bachelor', rngState: state };
    return { edu: roll.value > 0.2 ? 'vocational' : 'upper_secondary', rngState: state };
  }
  if (highWealth && roll.value > 0.82) return { edu: 'master', rngState: state };
  if (roll.value > 0.38) return { edu: 'bachelor', rngState: state };
  return { edu: roll.value > 0.16 ? 'vocational' : 'upper_secondary', rngState: state };
}

function selectInitialJobForProfile(
  rngState: number,
  ageYears: number,
  education: EducationLevel,
  skills: Skills,
  rawStats: RawStats
): { jobId: string; rngState: number } {
  if (ageYears < 6) return { jobId: 'infant', rngState };
  if (ageYears < 16) return { jobId: 'student', rngState };
  if (ageYears <= 21 && education === 'upper_secondary') {
    const r = nextRandom(rngState);
    return { jobId: r.value < 0.55 ? 'student' : 'convenience_staff', rngState: r.rngState };
  }

  const candidates = Object.values(JOBS).filter((j) => {
    if (j.id === 'student' || j.id === 'unemployed') return false;
    if (ageYears < j.minAge) return false;
    if (j.maxAge !== undefined && ageYears > j.maxAge) return false;
    if (EDUCATION_RANK[education] < EDUCATION_RANK[j.minEducation]) return false;
    if (j.minSkill) {
      for (const [sk, req] of Object.entries(j.minSkill)) {
        if (skills[sk as keyof Skills] < (req ?? 0)) return false;
      }
    }
    if (j.minRawStats) {
      for (const [rk, req] of Object.entries(j.minRawStats)) {
        if (rawStats[rk as keyof RawStats] < (req ?? 0)) return false;
      }
    }
    return true;
  });

  if (candidates.length === 0) {
    return { jobId: ageYears <= 22 ? 'student' : 'unemployed', rngState };
  }

  // Pick a plausible job weighted toward higher salary for older age
  const picked = pickOne(rngState, candidates);
  return { jobId: picked.value.id, rngState: picked.rngState };
}

export function generateLife(request: LifeGenRequest): GeneratedLife {
  let state = normalizeSeed(request.seed);
  const startYearCE = 2025; // พ.ศ. 2568

  const customOpts: CustomLifeOptions | undefined =
    request.mode === 'custom' ? request.custom : request.mode === 'at_age' ? request.atAge : undefined;

  const { bg, gender, firstName, lastName, nickname, rngState: afterBg } = generateBackground(state, customOpts);
  state = afterBg;

  let ageYears = 0;
  if (request.mode === 'random') {
    const sp = request.randomStartPoint ?? 'birth';
    if (sp === 'birth') {
      ageYears = 0;
    } else if (sp === 'age6') {
      ageYears = 6;
    } else if (sp === 'age12') {
      ageYears = 12;
    } else {
      const ageRoll = randInt(state, 15, 20);
      ageYears = ageRoll.value;
      state = ageRoll.rngState;
    }
  } else if (request.mode === 'at_age') {
    ageYears = Math.round(clamp(request.atAge?.targetAge ?? 25, 12, 65));
  } else {
    ageYears = Math.round(clamp(request.custom?.startingAge ?? 0, 0, 65));
  }

  const wealthMeta = WEALTH_TIERS.find((w) => w.id === bg.familyWealth) ?? WEALTH_TIERS[2];
  const wealthLabel = wealthMeta.label;
  const regionName = REGIONS.find((r) => r.id === bg.region)?.name ?? '';

  // Education with hard plausibility rule
  let education: EducationLevel;
  if (request.mode === 'at_age' && request.atAge?.education) {
    education = enforceEducationPlausibility(ageYears, request.atAge.education);
  } else {
    const ePick = defaultEducationForAge(state, ageYears, bg.familyWealth);
    education = ePick.edu;
    state = ePick.rngState;
  }

  // Starting Raw Stats & Skills
  const rsRes = buildInitialRawStats(state, bg.familyWealth, bg.geneticHealth, bg.temperament);
  const rawStats = rsRes.rawStats;
  state = rsRes.rngState;

  const skRes = buildInitialSkills(state, ageYears, education, bg.familyWealth);
  const skills = skRes.skills;
  state = skRes.rngState;

  // Cash & Debt (เด็กอายุ < 15 ไม่มีเงินสดหรือหนี้ส่วนตัว พ่อแม่ดูแลทั้งหมด)
  const cashRoll = randInt(state, wealthMeta.startCashRange[0], wealthMeta.startCashRange[1]);
  state = cashRoll.rngState;
  const debtRoll = randInt(state, wealthMeta.startDebtRange[0], wealthMeta.startDebtRange[1]);
  state = debtRoll.rngState;

  let cash = ageYears < 15 ? 0 : cashRoll.value;
  let debt = ageYears < 15 ? 0 : debtRoll.value;

  if (request.mode === 'at_age' && ageYears >= 15) {
    const wf: AtAgeLifeOptions['wealthFocus'] = request.atAge?.wealthFocus ?? 'average';
    const ageWorkYears = Math.max(0, ageYears - 18);
    if (wf === 'struggling') {
      cash = Math.round(cash * 0.6 + ageWorkYears * 800);
      debt += 25000 + ageWorkYears * 2500;
    } else if (wf === 'comfortable') {
      cash = Math.round(cash * 1.8 + ageWorkYears * 14000);
      debt = Math.round(debt * 0.3);
    } else {
      cash = Math.round(cash + ageWorkYears * 4500);
    }
  }

  // Turning Points (3-5 items for at_age, 1-2 background highlights for random/custom)
  const turningPoints: string[] = [];
  if (request.mode === 'at_age') {
    const eligibleTP = AT_AGE_TURNING_POINTS.filter((tp) => ageYears >= tp.minAge);
    const pool = [...eligibleTP];
    const count = Math.min(pool.length, ageYears >= 25 ? 4 : 3);
    for (let i = 0; i < count; i++) {
      const pick = randInt(state, 0, pool.length - 1);
      state = pick.rngState;
      const chosen = pool.splice(pick.value, 1)[0];
      turningPoints.push(chosen.text);
      if (chosen.statDelta) {
        for (const [k, d] of Object.entries(chosen.statDelta)) {
          const sk = k as keyof RawStats;
          rawStats[sk] = Math.round(clamp(rawStats[sk] + (d ?? 0), 10, 98));
        }
      }
      if (chosen.skillDelta) {
        for (const [k, d] of Object.entries(chosen.skillDelta)) {
          const sk = k as keyof Skills;
          skills[sk] = Math.round(clamp(skills[sk] + (d ?? 0), 0, 95));
        }
      }
      if (chosen.cashDelta) cash += chosen.cashDelta;
      if (chosen.debtDelta) debt += chosen.debtDelta;
    }
  } else {
    turningPoints.push(`เติบโตในจังหวัด${bg.province} (${regionName}) ท่ามกลางครอบครัวฐานะ${wealthLabel}`);
    if (bg.familyStructure === 'single_parent') {
      turningPoints.push('โตมากับครอบครัวเลี้ยงเดี่ยว ทำให้ต้องช่วยแบ่งเบาภาระและพึ่งพาตัวเองเร็ว');
    } else if (bg.familyStructure === 'grandparents') {
      turningPoints.push('เติบโตมากับปู่ย่าตายายในต่างถิ่น ขณะที่พ่อแม่ต้องดิ้นรนหาเงิน');
    } else {
      turningPoints.push(`พ่อทำงาน${bg.fatherJob} และแม่ทำงาน${bg.motherJob}`);
    }
  }

  // Job & Housing
  const jobPick = selectInitialJobForProfile(state, ageYears, education, skills, rawStats);
  state = jobPick.rngState;
  const job = JOBS[jobPick.jobId] ?? JOBS.unemployed;

  let housingId: HousingId = 'parents_home';
  if (ageYears >= 22 && cash >= HOUSINGS.cheap_room.depositRequired && bg.region === 'bangkok') {
    housingId = 'cheap_room';
  }
  if (ageYears >= 26 && cash >= HOUSINGS.townhouse_rent.depositRequired && job.monthlySalary >= 23000) {
    housingId = 'townhouse_rent';
  }

  const keyRelationships: string[] = [];
  if (bg.familyStructure === 'two_parents') {
    keyRelationships.push(`พ่อ (${bg.fatherJob}) และแม่ (${bg.motherJob})`);
  } else if (bg.familyStructure === 'single_parent') {
    keyRelationships.push(`ผู้ปกครองเลี้ยงเดี่ยว (${bg.motherJob})`);
  } else {
    keyRelationships.push('ปู่ย่าตายายผู้เลี้ยงดู');
  }
  if (ageYears >= 18) keyRelationships.push('เพื่อนสนิทสมัยมัธยม/มหาลัย 1–2 คนที่ยังทักทายกันบ้าง');
  if (ageYears >= 28) keyRelationships.push('คนรู้จักในสายงานและเจ้าหนี้/เพื่อนร่วมรุ่นที่คอยเปรียบเทียบชีวิต');

  const tempLabel = TEMPERAMENTS.find((t) => t.id === bg.temperament)?.label ?? bg.temperament;
  const eduLabel = EDUCATION_LABELS[education];
  const birthYearCE = startYearCE - ageYears;

  const backstory: BackstorySummary = {
    educationHistory: `ระดับการศึกษาปัจจุบัน: ${eduLabel}`,
    keyRelationships,
    turningPoints,
    narrativeCard:
      ageYears === 0
        ? `คุณเพิ่งลืมตาดูโลกในชื่อ "${nickname}" (${firstName} ${lastName}) ที่จังหวัด${bg.province} ครอบครัวฐานะ${wealthLabel} อุปนิสัยติดตัวเป็นคน${tempLabel}`
        : `คุณชื่อ "${nickname}" (${firstName} ${lastName}) อายุ ${ageYears} ปี เกิดและโตที่จังหวัด${bg.province} ครอบครัวฐานะ${wealthLabel} อุปนิสัยพื้นฐานเป็นคน${tempLabel} ปัจจุบัน${job.id === 'infant' ? 'อยู่ในวัยทารก' : job.id === 'student' ? 'กำลังศึกษาอยู่' : `ทำงานเป็น${job.title}`}`,
  };

  const traitInit = initTraitsForPerson(state, bg.temperament, ageYears);
  state = traitInit.rngState;
  const lifeStage = getLifeSubStageId(ageYears);

  const person: Person = {
    id: `char_${normalizeSeed(request.seed)}`,
    firstName,
    lastName,
    nickname,
    gender,
    birthYearCE,
    ageYears,
    isMinor: ageYears < 18,
    isAlive: true,
    education,
    lifeStage,
    background: bg,
    backstory,
    rawStats,
    resources: {
      energy: ageYears < 6 ? 90 : 82,
      stress: ageYears < 6 ? 6 : ageYears < 15 ? 12 : ageYears < 18 ? 18 : 26,
      freeTime: Math.max(1, 16 - job.workHoursPerDay),
    },
    skills,
    indices: {
      physical: 50,
      mental: 50,
      financial: 50,
      social: 50,
      status: 50,
      competence: 50,
    },
    traits: traitInit.traitsTagList,
    temperamentProfile: traitInit.temperamentProfile,
    personality: traitInit.personality,
    emergentTraits: traitInit.emergentTraits,
    innerTension: traitInit.innerTension,
    reputationView: traitInit.reputationView,
    flags: {},
    appearance: buildCharacterAppearance(
      request.seed,
      gender,
      ageYears,
      undefined,
      request.appearanceOverride,
      {
        familyWealth: bg.familyWealth,
        region: bg.region,
        temperament: bg.temperament,
        familyStructure: bg.familyStructure,
        jobId: job.id,
        traits: traitInit.traitsTagList,
        skills,
      }
    ),
  };

  const baseCredit = clamp(
    560 + (bg.familyWealth === 'wealthy' ? 90 : bg.familyWealth === 'destitute' ? -40 : 0) - Math.floor(debt / 4000),
    350,
    820
  );

  let economy: EconomyState = {
    cash: Math.max(0, Math.round(cash)),
    monthlySalary: job.monthlySalary,
    monthlySideIncome: 0,
    monthlyExpenses: 0,
    housingId,
    jobId: job.id,
    jobTitle: job.title,
    debt: Math.max(0, Math.round(debt)),
    creditScore: baseCredit,
    creditLimit: 0,
    missedPayments: 0,
    assetsValue: 0,
  };

  economy = recalculateEconomyDerived(person, economy);
  person.indices = computeLifeIndices(person, economy);

  // Ensure date initializes cleanly
  void createDate;

  return {
    person,
    economy,
    starterEvidence: traitInit.starterEvidence,
    startYearCE,
    rngState: state,
  };
}
