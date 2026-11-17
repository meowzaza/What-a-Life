import {
  EDUCATION_LABELS,
  EDUCATION_RANK,
  HOUSINGS,
  JOBS,
  LIFE_INDEX_LABELS,
  RAW_STAT_DETAILS,
  RAW_STAT_LABELS,
  SKILL_LABELS,
} from '../data/thaiData';
import { TRAIT_GATED_ACTIONS, TRAITS_BY_ID } from '../data/traits';
import { evaluateAppearanceImpact } from './appearance';
import { clamp, round2 } from './rng';
import { getSkillGrowthDetails } from './skillTraining';
import { filterAvailableActions } from './traitEffects';
import { explainTrait, getConflictingTraitPairs } from './traits';
import type {
  EconomyState,
  ExplainBreakdown,
  ExplainComponent,
  GameState,
  LifeIndexKey,
  LifeIndices,
  Person,
  RawStatKey,
  ResourceKey,
  SkillKey,
} from './types';

function computePhysicalComponents(person: Person, economy: EconomyState): ExplainComponent[] {
  const { rawStats, resources, background } = person;
  const housing = HOUSINGS[economy.housingId];
  const agePenalty = person.ageYears > 45 ? -((person.ageYears - 45) * 0.55) : 0;
  const stressPenalty = -(resources.stress * 0.14);

  return [
    { label: 'ความแข็งแรงของร่างกาย', value: rawStats.strength, weight: 'หลัก', contribution: round2(rawStats.strength * 0.32) },
    { label: 'ความอึดและความทนทาน', value: rawStats.endurance, weight: 'หลัก', contribution: round2(rawStats.endurance * 0.32) },
    { label: 'สุขภาพพื้นฐานแต่กำเนิด', value: background.geneticHealth, weight: 'พื้นฐาน', contribution: round2(background.geneticHealth * 0.16) },
    { label: 'เรี่ยวแรงที่มีในวันนี้', value: resources.energy, weight: 'รายวัน', contribution: round2(resources.energy * 0.22) },
    { label: `การพักผ่อนจากที่อยู่ (${housing.name})`, value: housing.energyRecoveryPerDay, weight: 'สภาพแวดล้อม', contribution: round2((housing.energyRecoveryPerDay - 14) * 0.5) },
    { label: 'ความเครียดที่บั่นทอนร่างกาย', value: resources.stress, weight: 'ลดทอน', contribution: round2(stressPenalty) },
    ...(agePenalty !== 0
      ? [{ label: 'ความเสื่อมถอยตามวัย (อายุ 45 ปีขึ้นไป)', value: person.ageYears, weight: 'ตามวัย', contribution: round2(agePenalty) }]
      : []),
  ];
}

function computeMentalComponents(person: Person): ExplainComponent[] {
  const { rawStats, resources } = person;
  const stressPenalty = -(resources.stress * 0.55);
  const lowEnergyPenalty = resources.energy < 25 ? -((25 - resources.energy) * 0.35) : 0;

  return [
    { label: 'วุฒิภาวะและการรับมืออารมณ์', value: rawStats.eq, weight: 'หลัก', contribution: round2(rawStats.eq * 0.55) },
    { label: 'ความหนักแน่นมั่นคงในใจ', value: rawStats.reliability, weight: 'เสริม', contribution: round2(rawStats.reliability * 0.2) },
    { label: 'เวลาว่างที่ได้พักหายใจในแต่ละวัน', value: resources.freeTime, weight: 'พักใจ', contribution: round2(resources.freeTime * 2.5) },
    { label: 'ความสงบพื้นฐานในใจ', value: 25, weight: 'พื้นฐาน', contribution: 25 },
    { label: 'แรงกดดันและความเครียดสะสม', value: resources.stress, weight: 'บั่นทอน', contribution: round2(stressPenalty) },
    ...(lowEnergyPenalty !== 0
      ? [{ label: 'อาการล้าสะสมเมื่อพักผ่อนไม่พอ', value: resources.energy, weight: 'ล้าหนัก', contribution: round2(lowEnergyPenalty) }]
      : []),
  ];
}

function computeFinancialComponents(person: Person, economy: EconomyState): ExplainComponent[] {
  const cashScore = clamp(Math.log10(Math.max(100, economy.cash + 100)) * 11 - 15, 0, 42);
  const netMonthly = economy.monthlySalary + economy.monthlySideIncome - economy.monthlyExpenses;
  const cashflowScore = clamp(netMonthly / 1500, -18, 28);
  const debtRatioPenalty = economy.debt > 0 ? -clamp(economy.debt / Math.max(15000, economy.monthlySalary * 2 + 15000) * 18, 1, 35) : 0;
  const creditBonus = clamp((economy.creditScore - 500) / 22, -10, 18);
  const financeSkillBonus = person.skills.finance * 0.15;

  return [
    { label: 'เงินสดสำรองที่มีติดตัว', value: Math.round(economy.cash), weight: 'สภาพคล่อง', contribution: round2(cashScore) },
    { label: 'เงินเหลือเก็บต่อเดือน (รายรับหักรายจ่าย)', value: Math.round(netMonthly), weight: 'กระแสเงินสด', contribution: round2(cashflowScore) },
    { label: 'ความน่าเชื่อถือทางการเงิน', value: Math.round(economy.creditScore), weight: 'เครดิต', contribution: round2(creditBonus) },
    { label: 'ทักษะการวางแผนและคุมเงิน', value: round2(person.skills.finance), weight: 'ทักษะ', contribution: round2(financeSkillBonus) },
    { label: 'ภาระหนี้สินที่ต้องแบกรับ', value: Math.round(economy.debt), weight: 'หนี้สิน', contribution: round2(debtRatioPenalty) },
  ];
}

function computeSocialComponents(person: Person): ExplainComponent[] {
  const { rawStats, skills, resources } = person;
  const stressFriction = resources.stress > 70 ? -((resources.stress - 70) * 0.25) : 0;
  return [
    { label: 'เสน่ห์ในการพูดคุยและเข้าหาคน', value: rawStats.charisma, weight: 'หลัก', contribution: round2(rawStats.charisma * 0.34) },
    { label: 'บุคลิกภาพและการดูแลตัวเอง', value: rawStats.looks, weight: 'เสริม', contribution: round2(rawStats.looks * 0.2) },
    { label: 'ความน่าเชื่อถือและความไว้ใจจากคนรอบข้าง', value: rawStats.reliability, weight: 'เสริม', contribution: round2(rawStats.reliability * 0.22) },
    { label: 'ทักษะการเข้าสังคมและการผูกมิตร', value: round2(skills.socializing), weight: 'ทักษะ', contribution: round2(skills.socializing * 0.24) },
    ...(stressFriction !== 0
      ? [{ label: 'ความเครียดสูงจนไม่อยากสุงสิงกับใคร', value: resources.stress, weight: 'ลดทอน', contribution: round2(stressFriction) }]
      : []),
  ];
}

function computeStatusComponents(person: Person, economy: EconomyState): ExplainComponent[] {
  const job = JOBS[economy.jobId] ?? JOBS.unemployed;
  const housing = HOUSINGS[economy.housingId];
  const eduScore = EDUCATION_RANK[person.education] * 4.5;
  const wealthBaseMap = {
    destitute: 2,
    working_poor: 6,
    lower_middle: 12,
    middle: 18,
    upper_middle: 26,
    wealthy: 35,
  };
  const wealthScore = wealthBaseMap[person.background.familyWealth];
  const creditBonus = clamp((economy.creditScore - 550) / 30, -6, 12);
  const appearanceImpact = evaluateAppearanceImpact(person);

  return [
    { label: `หน้าที่การงาน (${job.title})`, value: job.statusBonus, weight: 'อาชีพ', contribution: job.statusBonus },
    { label: `วุฒิการศึกษา (${EDUCATION_LABELS[person.education]})`, value: EDUCATION_RANK[person.education], weight: 'การศึกษา', contribution: round2(eduScore) },
    { label: `ที่อยู่อาศัย (${housing.name})`, value: housing.statusBonus, weight: 'ที่พัก', contribution: housing.statusBonus },
    { label: 'ต้นทุนและพื้นฐานครอบครัว', value: wealthScore, weight: 'ภูมิหลัง', contribution: wealthScore },
    { label: 'ความน่าเชื่อถือในสายตาคนทั่วไป', value: person.rawStats.reliability, weight: 'บุคลิก', contribution: round2(person.rawStats.reliability * 0.18) },
    { label: 'ประวัติเครดิตทางการเงิน', value: Math.round(economy.creditScore), weight: 'เครดิต', contribution: round2(creditBonus) },
    ...(appearanceImpact.formalCredibilityDelta !== 0
      ? [
          {
            label: appearanceImpact.statusExplainLabelTh,
            value: appearanceImpact.formalCredibilityDelta,
            weight: appearanceImpact.formalCredibilityDelta > 0 ? 'เสริมภาพลักษณ์' : 'ลดภาพจำ',
            contribution: appearanceImpact.formalCredibilityDelta,
          },
        ]
      : []),
  ];
}

function computeCompetenceComponents(person: Person): ExplainComponent[] {
  const { rawStats, skills } = person;
  const skillValues = Object.values(skills);
  const top3Avg =
    skillValues
      .slice()
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((acc, v) => acc + v, 0) / 3;

  return [
    { label: 'ไหวพริบและการแก้ปัญหาเฉพาะหน้า', value: rawStats.wit, weight: 'หลัก', contribution: round2(rawStats.wit * 0.26) },
    { label: 'ความจำและการเรียนรู้สิ่งใหม่', value: rawStats.memory, weight: 'เสริม', contribution: round2(rawStats.memory * 0.2) },
    { label: 'ความคิดสร้างสรรค์และมุมมอง', value: rawStats.creativity, weight: 'เสริม', contribution: round2(rawStats.creativity * 0.18) },
    { label: 'ความรับผิดชอบและทำงานจนสำเร็จ', value: rawStats.reliability, weight: 'เสริม', contribution: round2(rawStats.reliability * 0.14) },
    { label: 'ความชำนาญจาก 3 ทักษะเด่นที่สุด', value: round2(top3Avg), weight: 'ทักษะเด่น', contribution: round2(top3Avg * 0.3) },
  ];
}

export function computeLifeIndices(person: Person, economy: EconomyState): LifeIndices {
  const { rawStats, resources, background, skills, ageYears, education } = person;
  const housing = HOUSINGS[economy.housingId];
  const job = JOBS[economy.jobId] ?? JOBS.unemployed;

  // 1. Physical
  const agePenalty = ageYears > 45 ? -((ageYears - 45) * 0.55) : 0;
  const physicalRaw =
    round2(rawStats.strength * 0.32) +
    round2(rawStats.endurance * 0.32) +
    round2(background.geneticHealth * 0.16) +
    round2(resources.energy * 0.22) +
    round2((housing.energyRecoveryPerDay - 14) * 0.5) +
    round2(-(resources.stress * 0.14)) +
    round2(agePenalty);

  // 2. Mental
  const lowEnergyPenalty = resources.energy < 25 ? -((25 - resources.energy) * 0.35) : 0;
  const mentalRaw =
    round2(rawStats.eq * 0.55) +
    round2(rawStats.reliability * 0.2) +
    round2(resources.freeTime * 2.5) +
    25 +
    round2(-(resources.stress * 0.55)) +
    round2(lowEnergyPenalty);

  // 3. Financial
  const cashScore = clamp(Math.log10(Math.max(100, economy.cash + 100)) * 11 - 15, 0, 42);
  const netMonthly = economy.monthlySalary + economy.monthlySideIncome - economy.monthlyExpenses;
  const cashflowScore = clamp(netMonthly / 1500, -18, 28);
  const debtRatioPenalty =
    economy.debt > 0 ? -clamp((economy.debt / Math.max(15000, economy.monthlySalary * 2 + 15000)) * 18, 1, 35) : 0;
  const creditBonus = clamp((economy.creditScore - 500) / 22, -10, 18);
  const financialRaw =
    round2(cashScore) +
    round2(cashflowScore) +
    round2(creditBonus) +
    round2(skills.finance * 0.15) +
    round2(debtRatioPenalty);

  // 4. Social
  const stressFriction = resources.stress > 70 ? -((resources.stress - 70) * 0.25) : 0;
  const socialRaw =
    round2(rawStats.charisma * 0.34) +
    round2(rawStats.looks * 0.2) +
    round2(rawStats.reliability * 0.22) +
    round2(skills.socializing * 0.24) +
    round2(stressFriction);

  // 5. Status
  const eduScore = EDUCATION_RANK[education] * 4.5;
  const wealthBaseMap = {
    destitute: 2,
    working_poor: 6,
    lower_middle: 12,
    middle: 18,
    upper_middle: 26,
    wealthy: 35,
  };
  const wealthScore = wealthBaseMap[background.familyWealth];
  const statusCredit = clamp((economy.creditScore - 550) / 30, -6, 12);
  const appearanceImpact = evaluateAppearanceImpact(person);
  const statusRaw =
    job.statusBonus +
    round2(eduScore) +
    housing.statusBonus +
    wealthScore +
    round2(rawStats.reliability * 0.18) +
    round2(statusCredit) +
    appearanceImpact.formalCredibilityDelta;

  // 6. Competence (top 3 skills without allocating array sort)
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  const vals = [
    skills.english,
    skills.sales,
    skills.finance,
    skills.tech,
    skills.craft,
    skills.cooking,
    skills.socializing,
    skills.academic,
  ];
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v >= s1) {
      s3 = s2;
      s2 = s1;
      s1 = v;
    } else if (v >= s2) {
      s3 = s2;
      s2 = v;
    } else if (v > s3) {
      s3 = v;
    }
  }
  const top3Avg = (s1 + s2 + s3) / 3;
  const competenceRaw =
    round2(rawStats.wit * 0.26) +
    round2(rawStats.memory * 0.2) +
    round2(rawStats.creativity * 0.18) +
    round2(rawStats.reliability * 0.14) +
    round2(round2(top3Avg) * 0.3);

  return {
    physical: Math.round(clamp(physicalRaw, 0, 100)),
    mental: Math.round(clamp(mentalRaw, 0, 100)),
    financial: Math.round(clamp(financialRaw, 0, 100)),
    social: Math.round(clamp(socialRaw, 0, 100)),
    status: Math.round(clamp(statusRaw, 0, 100)),
    competence: Math.round(clamp(competenceRaw, 0, 100)),
  };
}

export function explainStat(state: GameState, targetKey: string): ExplainBreakdown {
  const { character, economy, statLogs } = state;
  const recentLogs = statLogs
    .filter((l) => l.target === targetKey || (targetKey.startsWith('index:') && l.target.startsWith('raw:')))
    .slice(-8)
    .reverse();

  if (targetKey.startsWith('index:')) {
    const key = targetKey.replace('index:', '') as LifeIndexKey;
    const meta = LIFE_INDEX_LABELS[key];
    let components: ExplainComponent[] = [];
    let formulaText = '';
    switch (key) {
      case 'physical':
        components = computePhysicalComponents(character, economy);
        formulaText = 'ประเมินจากความแข็งแรง ความอึด สุขภาพแต่กำเนิด พลังงานที่เหลือวันนี้ และคุณภาพการพักผ่อน หักด้วยความเครียดและอายุที่เพิ่มขึ้น';
        break;
      case 'mental':
        components = computeMentalComponents(character);
        formulaText = 'ประเมินจากวุฒิภาวะทางอารมณ์ ความมั่นคงทางใจ และเวลาว่างที่ได้พักผ่อน หักด้วยความเครียดสะสมและอาการอ่อนล้า';
        break;
      case 'financial':
        components = computeFinancialComponents(character, economy);
        formulaText = 'ประเมินจากเงินสดสำรองติดตัว รายรับหักรายจ่ายต่อเดือน ประวัติเครดิต และทักษะการคุมเงิน หักด้วยภาระหนี้คงค้าง';
        break;
      case 'social':
        components = computeSocialComponents(character);
        formulaText = 'ประเมินจากเสน่ห์การพูดคุย บุคลิกภาพ ความไว้ใจจากคนรอบข้าง และทักษะเข้าสังคม หักด้วยความเครียดสูงที่ทำให้ไม่อยากพบใคร';
        break;
      case 'status':
        components = computeStatusComponents(character, economy);
        formulaText = 'ประเมินจากหน้าที่การงาน วุฒิการศึกษา ที่อยู่อาศัย พื้นฐานครอบครัว ความน่าเชื่อถือ ภาพลักษณ์ภายนอก และประวัติเครดิต';
        break;
      case 'competence':
        components = computeCompetenceComponents(character);
        formulaText = 'ประเมินจากไหวพริบ ความจำ ความคิดสร้างสรรค์ ความรับผิดชอบ และความชำนาญของ 3 ทักษะที่โดดเด่นที่สุด';
        break;
    }

    return {
      key: targetKey,
      title: `ภาพรวมด้าน${meta.label}`,
      currentValue: character.indices[key],
      formulaText,
      components,
      recentLogs: statLogs.slice(-8).reverse(),
    };
  }

  if (targetKey.startsWith('raw:')) {
    const key = targetKey.replace('raw:', '') as RawStatKey;
    const meta = RAW_STAT_LABELS[key];
    const detail = RAW_STAT_DETAILS[key];
    const val = round2(character.rawStats[key]);

    const components: ExplainComponent[] = [
      {
        label: `คะแนนสะสมปัจจุบัน (${val}/100)`,
        value: val,
        weight: 'ระดับพื้นฐาน',
        contribution: val,
      },
      {
        label: `เสริมดัชนีชีวิต: ${detail?.indicesSupported.join(' · ') ?? 'ดัชนีทั่วไป'}`,
        value: val,
        weight: 'ดัชนีที่ได้รับผล',
        contribution: 1,
      },
      {
        label: `เร่งการฝึกทักษะ: ${detail?.skillsAccelerated.join(' · ') ?? 'ทักษะทั่วไป'}`,
        value: val,
        weight: 'ตัวคูณทักษะ',
        contribution: 1,
      },
      {
        label: `วิถีชีวิตที่ช่วยพัฒนา/พยุง: ${detail?.lifestyleBoosts.join(' · ') ?? 'กิจวัตรสมดุล'}`,
        value: val,
        weight: 'วิธีเพิ่ม/พยุง',
        contribution: 1,
      },
      {
        label: `ปัจจัยที่ทำให้ลดลง: ${detail?.lifestyleDrains.join(' · ') ?? 'อายุและการหักโหม'}`,
        value: val,
        weight: 'ความเสี่ยงถดถอย',
        contribution: -1,
      },
    ];

    return {
      key: targetKey,
      title: `ต้นทุนติดตัว: ${meta.label} (${detail?.groupLabelTh ?? 'พื้นฐาน'})`,
      currentValue: val,
      formulaText: `${detail?.shortDesc ?? meta.description} — เสริมดัชนี ${detail?.indicesSupported[0] ?? ''} และเร่งทักษะ ${detail?.skillsAccelerated[0] ?? ''}`,
      components,
      recentLogs: statLogs.filter((l) => l.target === targetKey).slice(-10).reverse(),
    };
  }

  if (targetKey.startsWith('res:')) {
    const key = targetKey.replace('res:', '') as ResourceKey;
    const names: Record<ResourceKey, string> = {
      energy: 'เรี่ยวแรงวันนี้',
      stress: 'ความเครียดสะสม',
      freeTime: 'เวลาว่างต่อวัน (ชั่วโมง)',
    };
    const housing = HOUSINGS[economy.housingId];
    const job = JOBS[economy.jobId] ?? JOBS.unemployed;
    return {
      key: targetKey,
      title: names[key],
      currentValue: round2(character.resources[key]),
      formulaText:
        key === 'energy'
          ? `ได้แรงฟื้นฟูจากการนอนที่${housing.name} แล้วหักด้วยความเหนื่อยจากงาน${job.title}และกิจกรรมที่ทำระหว่างวัน`
          : key === 'stress'
            ? `เพิ่มลดตามความกดดันจากงาน${job.title} สภาพแวดล้อมที่พักอาศัย และการเลือกพักผ่อนในแต่ละวัน`
            : `เวลา 24 ชั่วโมง หักเวลานอนและการทำงานวันละ ${job.workHoursPerDay} ชั่วโมง เหลือเป็นเวลาส่วนตัวให้ใช้งาน`,
      components: [
        { label: 'ระดับตอนนี้', value: round2(character.resources[key]), weight: 'ปัจจุบัน', contribution: round2(character.resources[key]) },
      ],
      recentLogs: statLogs.filter((l) => l.target === targetKey).slice(-10).reverse(),
    };
  }

  if (targetKey.startsWith('skill:')) {
    const key = targetKey.replace('skill:', '') as SkillKey;
    const meta = SKILL_LABELS[key];
    const details = getSkillGrowthDetails(state, key);
    const components: ExplainComponent[] = [
      {
        label: `ระดับความชำนาญ (${details.tierLabelTh})`,
        value: round2(details.level),
        weight: details.atCap ? 'ติดเพดาน' : details.tierLabelTh,
        contribution: round2(details.level),
      },
      {
        label: `ความคืบหน้าสู่ระดับถัดไป (${details.xpProgressPct}%)`,
        value: details.xpProgressPct,
        weight: details.isFocused ? 'กำลังโฟกัส' : 'พื้นฐาน',
        contribution: round2(details.xpProgressPct),
      },
      {
        label: `อัตราพัฒนาต่อสัปดาห์ (${details.estimatedWeeklyGain > 0 ? `+${details.estimatedWeeklyGain.toFixed(2)}` : 'คงที่'})`,
        value: round2(details.estimatedWeeklyGain),
        weight: details.hasActiveCourse ? 'มีคอร์ส' : 'ปกติ',
        contribution: round2(details.estimatedWeeklyGain),
      },
    ];
    for (const reason of details.slowReasonsTh) {
      components.push({
        label: reason,
        value: 0,
        weight: 'ชะลอ',
        contribution: 0,
      });
    }
    if (details.unlockHintTh) {
      components.push({
        label: `ทางไปต่อ: ${details.unlockHintTh}`,
        value: details.effectiveCap,
        weight: 'เงื่อนไข',
        contribution: 0,
      });
    }
    const slowSummary =
      details.slowReasonsTh.length > 0 ? ` (${details.slowReasonsTh.join('; ')})` : '';
    return {
      key: targetKey,
      title: `ทักษะ: ${meta.label} (${details.tierLabelTh})`,
      currentValue: round2(character.skills[key]),
      formulaText: `${meta.description} — พัฒนาได้สูงสุดในตอนนี้ที่ระดับ ${details.effectiveCap} · ${details.unlockHintTh}${slowSummary}`,
      components,
      recentLogs: statLogs.filter((l) => l.target === targetKey).slice(-10).reverse(),
    };
  }

  if (targetKey.startsWith('trait:')) {
    const traitId = targetKey.replace('trait:', '');
    const explained = explainTrait(state, traitId);
    const inst = (character.emergentTraits ?? []).find((t) => t.id === traitId);
    if (!explained || !inst) {
      return {
        key: targetKey,
        title: 'ข้อมูลนิสัยตัวละคร',
        currentValue: 0,
        formulaText: 'ไม่พบข้อมูลนิสัยนี้ในตัวละครปัจจุบัน',
        components: [],
        recentLogs: [],
      };
    }

    const hidden = inst.visibility === 'hidden_to_self';
    return {
      key: targetKey,
      title: hidden ? 'แนวโน้มแฝงที่ยังไม่รู้ตัว' : `นิสัย: ${explained.titleTh} (${explained.intensityLabel})`,
      currentValue: hidden ? 0 : Math.round(inst.intensityScore),
      formulaText: `${explained.originStory} · เส้นทางปรับตัว/ฟื้นฟู: ${explained.recoveryPathTh}`,
      components: [
        {
          label: `ที่มา: ${explained.originStory}`,
          value: hidden ? 0 : round2(inst.intensityScore),
          weight: explained.intensityLabel,
          contribution: hidden ? 0 : round2(inst.intensityScore),
        },
        {
          label: `หลักฐาน: ${explained.evidenceReason}`,
          value: 1,
          weight: 'เหตุผล',
          contribution: 1,
        },
        {
          label: `แนวทางฟื้นฟู/สมดุล: ${explained.recoveryPathTh}`,
          value: 0,
          weight: 'ทางออก',
          contribution: 0,
        },
      ],
      recentLogs: [],
    };
  }

  if (targetKey.startsWith('action_lock:')) {
    const actionId = targetKey.replace('action_lock:', '');
    const evaluated = filterAvailableActions(state).find((e) => e.action.id === actionId);
    const actionDef = evaluated?.action ?? TRAIT_GATED_ACTIONS.find((a) => a.id === actionId);
    if (!actionDef) {
      return {
        key: targetKey,
        title: 'เงื่อนไขการปลดล็อกทางเลือก',
        currentValue: 0,
        formulaText: 'ไม่พบข้อมูลทางเลือกนี้',
        components: [],
        recentLogs: [],
      };
    }

    return {
      key: targetKey,
      title: `ทางเลือก: ${actionDef.labelTh}`,
      currentValue: evaluated?.available ? 1 : 0,
      formulaText: evaluated?.lockReasonTh ?? 'ทางเลือกนี้พร้อมใช้งานแล้ว',
      components: [
        {
          label: evaluated?.available ? 'สถานะ: พร้อมทำได้' : `สาเหตุที่ล็อก: ${evaluated?.lockReasonTh ?? ''}`,
          value: evaluated?.available ? 1 : 0,
          weight: 'เงื่อนไข',
          contribution: evaluated?.available ? 1 : 0,
        },
      ],
      recentLogs: [],
    };
  }

  if (targetKey === 'innerTension') {
    const pairs = getConflictingTraitPairs(character.emergentTraits ?? []);
    return {
      key: targetKey,
      title: 'ความตึงเครียดภายในจากนิสัยขัดแย้งกัน',
      currentValue: character.innerTension ?? 0,
      formulaText: 'เมื่อตัวละครมีนิสัยที่ขัดแย้งกันอยู่ในตัว จะเกิดความลังเลและแรงเสียดทานภายในใจ',
      components:
        pairs.length > 0
          ? pairs.map(([a, b]) => {
              const nameA = TRAITS_BY_ID.get(a)?.nameTh ?? a;
              const nameB = TRAITS_BY_ID.get(b)?.nameTh ?? b;
              return {
                label: `${nameA} ขัดแย้งกับ ${nameB}`,
                value: 18,
                weight: 'คู่ขัดแย้ง',
                contribution: 18,
              };
            })
          : [{ label: 'ยังไม่มีนิสัยที่ขัดแย้งกันชัดเจน', value: 0, weight: 'ปกติ', contribution: 0 }],
      recentLogs: [],
    };
  }

  // Economy keys
  const ecoMap: Record<string, { title: string; value: number; formula: string }> = {
    'eco:cash': {
      title: 'เงินสดคงเหลือ (บาท)',
      value: Math.round(economy.cash),
      formula: 'เงินสด = เงินตั้งต้น + เงินเดือน + รายได้เสริม - ค่ากินอยู่ - ค่าเช่า - ผ่อนหนี้',
    },
    'eco:debt': {
      title: 'หนี้สินคงค้าง (บาท)',
      value: Math.round(economy.debt),
      formula: 'หนี้สินคิดดอกเบี้ยทบต้น 1.5% ต่อเดือน ต้องผ่อนชำระขั้นต่ำทุกสิ้นเดือน',
    },
    'eco:creditScore': {
      title: 'คะแนนเครดิต (300–900)',
      value: Math.round(economy.creditScore),
      formula: 'กำหนดเพดานวงเงินกู้และสิทธิ์เช่าที่พักระดับสูง เพิ่มขึ้นเมื่อชำระหนี้ตรงเวลา ลดลงเมื่อค้างชำระ',
    },
  };

  const ecoInfo = ecoMap[targetKey] ?? {
    title: targetKey,
    value: 0,
    formula: 'ข้อมูลระบบเศรษฐกิจ',
  };

  return {
    key: targetKey,
    title: ecoInfo.title,
    currentValue: ecoInfo.value,
    formulaText: ecoInfo.formula,
    components: [{ label: 'ค่าปัจจุบัน', value: ecoInfo.value, weight: 'ล่าสุด', contribution: ecoInfo.value }],
    recentLogs: statLogs.filter((l) => l.target === targetKey).slice(-10).reverse(),
  };
}
