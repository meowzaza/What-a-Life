import { LIFESTYLE_PRESETS_BY_ID } from '../data/lifestylePresets';
import { SKILL_LEVEL_CONFIG, SKILL_TRAINING_CONFIG } from '../data/skillTraining';
import { createEmploymentForJob, HOUSINGS, JOBS, SKILL_LABELS, WORK_SHIFT_LABELS_TH } from '../data/thaiData';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import { UI_TEXT } from '../data/uiText';
import {
  autopilotDecide,
  buildAutopilotSituation,
  createDefaultStandingOrders,
  resolveAutopilotWithOption,
} from './autopilot';
import {
  createInitialDirectorState,
  fireStorylet,
  resolveAutopilotPromptDecision,
  resolveStoryletChoice,
} from './director';
import { createDate } from './clock';
import {
  checkHousingEligibility,
  checkJobEligibility,
  recalculateEconomyDerived,
} from './economy';
import {
  applyChangeSchoolTier,
  applyChooseHighSchoolTrack,
  applyEnrollRotc,
  applyEnrollSecondChanceEdu,
  pushLifeHistory,
  resolveEducationPromptChoice,
} from './education';
import { generateLife } from './lifegen';
import { appendTimeline, applyEffects, summarizeEffects } from './log';
import { stepOneTick } from './pipeline';
import { clamp } from './rng';
import {
  buildSkillStatesFromCompatSkills,
  canEnrollCourse,
  createInitialSkillTrainingState,
  isSkillVisible,
} from './skillTraining';
import { applySwapTalentSlot, stampTalentSwapWindow } from './talents';
import { computeLifeIndices } from './stats';
import {
  applyLifestylePreset,
  getDefaultTimeAllocation,
  sanitizeTimeAllocation,
} from './timeAlloc';
import {
  addPlannerCalendarPin,
  applyAnnualFocusChange,
  buildAnnualFocusBirthdayPrompt,
  createInitialAnnualFocusState,
  createInitialPlannerState,
  createInitialPlannerStreaks,
  deriveWeeklyAllocation,
  removePlannerCalendarPin,
  resolveEmploymentState,
  sanitizeGridForState,
  sanitizePlannerWithRelockNotice,
  validatePlanner,
} from './planner';
import { filterAvailableActions } from './traitEffects';
import { applyTurningPoint, checkTraitFormation, translateEvidenceKey } from './traits';
import type { ActionRecord, ActiveToast, Effect, GameState, LifeGenRequest, PlayerAction, TimelineEntry } from './types';

export const ENGINE_VERSION = 2;

export function createInitialGameState(request: LifeGenRequest): GameState {
  const generated = generateLife(request);
  const startDate = createDate(generated.startYearCE, 5, 14, 0); // เริ่มต้น 14 พฤษภาคม พ.ศ. 2568

  let state: GameState = {
    version: ENGINE_VERSION,
    seed: request.seed,
    rngState: generated.rngState,
    date: startDate,
    character: generated.person,
    economy: generated.economy,
    employment: createEmploymentForJob(generated.economy.jobId),
    lifestylePresetId: 'balanced',
    sideGigRecord: null,
    skillTraining: createInitialSkillTrainingState({
      discoveredSkills: generated.initialDiscoveredSkills,
      skillStates: buildSkillStatesFromCompatSkills(generated.person.skills),
    }),
    evidence: generated.starterEvidence,
    timeAllocation: getDefaultTimeAllocation(generated.person.ageYears),
    standingOrders: createDefaultStandingOrders(generated.person),
    pendingAutopilotSituation: null,
    lastDigest: null,
    settings: { pubVisitAge: 20 },
    echoQueue: [],
    pendingPrompt: null,
    activeToast: null,
    directorState: createInitialDirectorState(),
    sceneMode: null,
    gameSpeed: 1,
    needsPlayer: false,
    timeline: [],
    statLogs: [],
    triggeredEventIds: [],
    pendingAutosave: false,
  };

  const initialPlanner = createInitialPlannerState(state);
  const enrichedPlanner = {
    ...initialPlanner,
    streaks: initialPlanner.streaks ?? createInitialPlannerStreaks(initialPlanner.presetId),
    calendarPins: initialPlanner.calendarPins ?? [],
    annualFocus:
      generated.person.ageYears >= 13
        ? (initialPlanner.annualFocus ?? createInitialAnnualFocusState(state))
        : initialPlanner.annualFocus,
  };
  state = {
    ...state,
    planner: enrichedPlanner,
    timeAllocation: deriveWeeklyAllocation(enrichedPlanner.grid, state),
  };

  state = appendTimeline(state, {
    category: 'life',
    title: `เริ่มต้นชีวิต: ${generated.person.firstName} ${generated.person.lastName} (${generated.person.nickname})`,
    description: generated.person.backstory.narrativeCard,
    appearance: generated.person.appearance,
  });

  return state;
}

export interface ActionResult {
  state: GameState;
  accepted: boolean;
  message?: string;
}

function buildGatedActionEffects(actionId: string, energyCost: number, freeTimeCost: number): Effect[] {
  const baseCost: Effect[] = [
    { type: 'ChangeResource', resource: 'energy', delta: -energyCost, reason: 'ใช้พลังงานทำกิจกรรมพิเศษ' },
    { type: 'ChangeResource', resource: 'freeTime', delta: -freeTimeCost, reason: 'ใช้เวลาว่างทำกิจกรรมพิเศษ' },
  ];

  switch (actionId) {
    case 'public_speaking_stage':
      return [
        ...baseCost,
        { type: 'ChangeRawStat', stat: 'charisma', delta: 1, reason: 'กล้าแสดงออกต่อหน้าคนจำนวนมาก' },
        { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'ฝึกพูดบนเวที' },
        { type: 'RecordEvidence', key: 'praised', amount: 3, reason: 'ได้รับเสียงตอบรับบนเวที' },
      ];
    case 'social_networking':
      return [
        ...baseCost,
        { type: 'ChangeSkill', skill: 'social', delta: 1.5, reason: 'พบปะแลกเปลี่ยนคอนเนกชัน' },
        { type: 'RecordEvidence', key: 'social_fun', amount: 2, reason: 'สนุกกับวงสนทนา' },
        { type: 'RecordEvidence', key: 'help_others', amount: 1, reason: 'แบ่งปันคำแนะนำกับคนรู้จัก' },
      ];
    case 'strict_saving_challenge':
      return [
        ...baseCost,
        { type: 'ChangeSkill', skill: 'business', delta: 1, reason: 'คุมงบรายจ่ายรายสัปดาห์เข้มงวด' },
        { type: 'RecordEvidence', key: 'disciplined_saving', amount: 3, reason: 'ผ่านชาเลนจ์งดรายจ่ายฟุ่มเฟือย' },
      ];
    case 'therapy_reflection':
      return [
        ...baseCost,
        { type: 'ChangeResource', resource: 'stress', delta: -8, reason: 'ทบทวนใจและคลายความกดดันสะสม' },
        { type: 'AdjustPersonality', axis: 'stability', delta: 0.8, reason: 'เข้าใจอารมณ์ตัวเองมากขึ้น' },
        { type: 'RecordEvidence', key: 'self_reflection', amount: 3, reason: 'ทบทวนตัวเองอย่างจริงจัง' },
        { type: 'RecordEvidence', key: 'rest_recovery', amount: 3, reason: 'จัดจังหวะฟื้นฟูจิตใจ' },
      ];
    default:
      return baseCost;
  }
}

const UNLOCK_ACTIVITY_FLAG_LABELS_TH: Record<string, string> = {
  stream_unlocked: 'สตรีม / ทำช่องคอนเทนต์',
  unlock_activity_streaming: 'สตรีม / ทำช่องคอนเทนต์',
  competition_unlocked: 'ลงแข่ง / กิจกรรมระดับสูง',
  unlock_activity_competition: 'ลงแข่ง / กิจกรรมระดับสูง',
  freelance_unlocked: 'รับงานฟรีแลนซ์อิสระ',
  has_child: 'ดูแลลูกและครอบครัว',
};

function mapPromptCategoryToToastCategory(category: string): ActiveToast['category'] {
  if (
    category === 'work' ||
    category === 'romance' ||
    category === 'family' ||
    category === 'health' ||
    category === 'finance' ||
    category === 'social' ||
    category === 'quirky' ||
    category === 'system' ||
    category === 'milestone'
  ) {
    return category;
  }
  if (category === 'economy') return 'finance';
  return 'milestone';
}

function attachStoryletFeedbackToast(
  prevState: GameState,
  nextState: GameState,
  storyletId?: string,
  promptCategory = 'milestone'
): ActiveToast | null {
  const prevFlags = prevState.character.flags ?? {};
  const nextFlags = nextState.character.flags ?? {};
  const unlockedLabels: string[] = [];

  for (const [flagKey, isEnabled] of Object.entries(nextFlags)) {
    if (!isEnabled || prevFlags[flagKey]) continue;
    if (UNLOCK_ACTIVITY_FLAG_LABELS_TH[flagKey]) {
      unlockedLabels.push(UNLOCK_ACTIVITY_FLAG_LABELS_TH[flagKey]);
    } else if (flagKey.startsWith('unlock_activity_')) {
      unlockedLabels.push('กิจกรรมใหม่ในตารางชีวิต');
    }
  }

  const prevEv = prevState.evidence ?? {};
  const nextEv = nextState.evidence ?? {};
  const gainedEvidenceLabels: string[] = [];
  for (const [evKey, nextVal] of Object.entries(nextEv)) {
    const prevVal = prevEv[evKey] ?? 0;
    if ((nextVal ?? 0) > prevVal + 0.01) {
      gainedEvidenceLabels.push(translateEvidenceKey(evKey));
    }
  }

  const uniqueUnlocks = Array.from(new Set(unlockedLabels));
  const uniqueEvidence = Array.from(new Set(gainedEvidenceLabels));
  if (uniqueUnlocks.length === 0 && uniqueEvidence.length === 0) {
    return nextState.activeToast ?? null;
  }

  const title =
    uniqueUnlocks.length > 0
      ? UI_TEXT.STORYLET_TOAST.unlockTitle
      : UI_TEXT.STORYLET_TOAST.evidenceTitle;
  const parts: string[] = [];
  if (uniqueUnlocks.length > 0) {
    parts.push(UI_TEXT.STORYLET_TOAST.unlockPrefix(uniqueUnlocks));
  }
  if (uniqueEvidence.length > 0) {
    parts.push(UI_TEXT.STORYLET_TOAST.evidencePrefix(uniqueEvidence.slice(0, 3)));
  }

  return {
    id: `toast_storylet_outcome_${nextState.date.totalDays}_${nextState.timeline.length}`,
    title,
    description: parts.join(' · '),
    tier: 'T1',
    category: mapPromptCategoryToToastCategory(promptCategory),
    expiresAtTotalDay: nextState.date.totalDays + 7,
    storyletId,
  };
}

export function dispatchPlayerAction(state: GameState, action: PlayerAction): ActionResult {
  if (!state.character.isAlive) {
    return { state, accepted: false, message: 'ตัวละครเสียชีวิตแล้ว' };
  }

  switch (action.type) {
    case 'APPLY_LIFESTYLE_PRESET': {
      const res = applyLifestylePreset(state, action.presetId);
      if (!res.accepted) {
        return { state, accepted: false, message: res.reasonTh ?? 'ไม่สามารถใช้วิถีชีวิตนี้ได้' };
      }
      const presetName = LIFESTYLE_PRESETS_BY_ID.get(action.presetId)?.nameTh ?? action.presetId;
      return {
        state: res.state,
        accepted: true,
        message: `ปรับวิถีชีวิตเป็น "${presetName}" และจัดตาราง 168 ชม. เรียบร้อย`,
      };
    }

    case 'CHANGE_HOUSING': {
      if (state.character.ageYears < 15) {
        return { state, accepted: false, message: 'อายุต่ำกว่า 15 ปี ต้องพักอาศัยอยู่กับครอบครัว' };
      }
      const check = checkHousingEligibility(state.economy, action.housingId);
      if (!check.allowed) {
        return { state, accepted: false, message: check.reasons.join(' · ') };
      }
      const housing = HOUSINGS[action.housingId];
      let next = applyEffects(state, [
        ...(housing.depositRequired > 0
          ? [{ type: 'AddMoney' as const, amount: -housing.depositRequired, category: 'rent' as const, reason: `เงินมัดจำย้ายเข้า ${housing.name}` }]
          : []),
        { type: 'SetHousing', housingId: action.housingId, reason: `ย้ายที่อยู่อาศัยเป็น ${housing.name}` },
      ]);
      next = appendTimeline(next, {
        category: 'life',
        title: `ย้ายที่พัก: ${housing.name}`,
        description: housing.description,
      });
      return { state: next, accepted: true };
    }

    case 'APPLY_JOB': {
      if (state.character.ageYears < 15) {
        return { state, accepted: false, message: 'อายุต่ำกว่า 15 ปี ยังไม่ถึงเกณฑ์ทำงานตามกฎหมาย' };
      }
      if (state.economy.jobId === action.jobId) {
        return { state, accepted: false, message: 'คุณทำอาชีพนี้อยู่แล้ว' };
      }
      const check = checkJobEligibility(state.character, action.jobId, state.settings, state.economy.jobId);
      if (!check.allowed) {
        return { state, accepted: false, message: check.reasons.join(' · ') };
      }
      const job = JOBS[action.jobId];
      let next = applyEffects(state, [
        { type: 'SetJob', jobId: action.jobId, reason: `สมัครและเริ่มงาน ${job.title}` },
      ]);
      next = {
        ...next,
        employment: createEmploymentForJob(action.jobId),
      };
      if (next.planner?.grid) {
        const sanitizedGrid = sanitizeGridForState(next.planner.grid, next);
        const sanitizedPending = next.planner.pendingGrid
          ? sanitizeGridForState(next.planner.pendingGrid, next)
          : undefined;
        next = {
          ...next,
          planner: {
            ...next.planner,
            grid: sanitizedGrid,
            pendingGrid: sanitizedPending,
          },
          timeAllocation: deriveWeeklyAllocation(sanitizedGrid, next),
        };
      } else {
        next = sanitizeTimeAllocation(next, next.timeAllocation, true).state;
      }
      next = stampTalentSwapWindow(next, `job_${action.jobId}_${next.date.totalDays}`);
      next = pushLifeHistory(next, {
        id: `job_apply_${action.jobId}_${next.date.totalDays}`,
        kind: 'career',
        titleTh: `เริ่มทำงาน: ${job.title}`,
        detailTh: `รายได้ประจำ ${job.monthlySalary.toLocaleString('th-TH')} บาท/เดือน`,
      });
      next = appendTimeline(next, {
        category: 'work',
        title: `เปลี่ยนสายงาน: ${job.title}`,
        description: `รายได้ประจำ ${job.monthlySalary.toLocaleString('th-TH')} บาท/เดือน`,
      });
      return { state: next, accepted: true };
    }

    case 'CHANGE_WORK_SHIFT': {
      const emp = resolveEmploymentState(state);
      const job = JOBS[state.economy.jobId] ?? JOBS.unemployed;
      if (emp.status !== 'employed' || !job || job.shift === 'none' || job.id === 'student') {
        return { state, accepted: false, message: 'ต้องมีงานประจำก่อนจึงจะปรับกะเวลาทำงานได้' };
      }
      if (action.workShift === 'night-morning' && state.character.ageYears < 18) {
        return { state, accepted: false, message: 'ผู้เยาว์อายุต่ำกว่า 18 ปี ห้ามทำงานกะดึก (22:00–06:00)' };
      }
      if (emp.workShift === action.workShift) {
        return { state, accepted: false, message: 'คุณทำงานในกะเวลานี้อยู่แล้ว' };
      }
      let next: GameState = {
        ...state,
        employment: {
          ...emp,
          workShift: action.workShift,
        },
      };
      if (next.planner?.grid) {
        const sanitizedGrid = sanitizeGridForState(next.planner.grid, next);
        const sanitizedPending = next.planner.pendingGrid
          ? sanitizeGridForState(next.planner.pendingGrid, next)
          : undefined;
        next = {
          ...next,
          planner: {
            ...next.planner,
            grid: sanitizedGrid,
            pendingGrid: sanitizedPending,
          },
          timeAllocation: deriveWeeklyAllocation(sanitizedGrid, next),
        };
      } else {
        next = sanitizeTimeAllocation(next, next.timeAllocation, true).state;
      }
      const shiftLabel = WORK_SHIFT_LABELS_TH[action.workShift];
      next = appendTimeline(next, {
        category: 'work',
        title: `เปลี่ยนกะเวลาทำงาน: ${shiftLabel}`,
        description: `ปรับตารางงาน${job.title}เป็น${shiftLabel} และอัปเดตตารางสัปดาห์เรียบร้อย`,
      });
      return { state: next, accepted: true, message: `เปลี่ยนเป็น${shiftLabel}แล้ว` };
    }

    case 'SET_SKILL_FOCUS': {
      if (state.character.ageYears < SKILL_TRAINING_CONFIG.minTrainingAge) {
        return { state, accepted: false, message: UI_TEXT.SKILL_TRAINING.tooYoungNotice };
      }
      const uniqueFocus = Array.from(new Set(action.focus));
      if (uniqueFocus.length > SKILL_TRAINING_CONFIG.maxFocusSkills) {
        return {
          state,
          accepted: false,
          message: `เลือกโฟกัสได้สูงสุด ${SKILL_TRAINING_CONFIG.maxFocusSkills} ทักษะ`,
        };
      }
      if (uniqueFocus.some((sk) => !isSkillVisible(state, sk))) {
        return {
          state,
          accepted: false,
          message: 'ยังไม่ค้นพบทักษะบางรายการที่เลือก กรุณาปลดล็อกก่อนตั้งเป็นโฟกัส',
        };
      }
      const prevTraining = createInitialSkillTrainingState(state.skillTraining);
      return {
        state: {
          ...state,
          skillTraining: {
            ...prevTraining,
            focus: uniqueFocus,
          },
        },
        accepted: true,
        message: 'อัปเดตทักษะที่โฟกัสเรียบร้อยแล้ว',
      };
    }

    case 'ENROLL_SKILL_COURSE': {
      if (action.weeks !== SKILL_LEVEL_CONFIG.courseFixedWeeks) {
        return {
          state,
          accepted: false,
          message: `ระยะเวลาคอร์สไม่ถูกต้อง (เปิดสอนเฉพาะคอร์สมาตรฐาน ${SKILL_LEVEL_CONFIG.courseFixedWeeks} สัปดาห์)`,
        };
      }
      const gate = canEnrollCourse(state, action.skillId);
      if (!gate.allowed) {
        return { state, accepted: false, message: gate.reasonTh ?? 'ยังไม่สามารถลงคอร์สได้' };
      }
      const skillMeta = SKILL_LABELS[action.skillId];
      if (!skillMeta) {
        return { state, accepted: false, message: 'ไม่พบทักษะที่ระบุ' };
      }
      const feePerWeek = SKILL_TRAINING_CONFIG.courseFeePerWeek;
      let next = applyEffects(state, [
        {
          type: 'AddMoney',
          amount: -feePerWeek,
          category: 'living',
          reason: `ลงทะเบียนคอร์ส${skillMeta.label} (${action.weeks} สัปดาห์ · สัปดาห์แรก)`,
        },
      ]);
      const prevTraining = createInitialSkillTrainingState(next.skillTraining);
      const nextFocus = prevTraining.focus.includes(action.skillId)
        ? prevTraining.focus
        : prevTraining.focus.length < SKILL_TRAINING_CONFIG.maxFocusSkills
          ? [...prevTraining.focus, action.skillId]
          : [action.skillId, prevTraining.focus[0]];
      next = {
        ...next,
        skillTraining: {
          ...prevTraining,
          focus: nextFocus,
          course: {
            skillId: action.skillId,
            weeksLeft: action.weeks,
            totalWeeks: action.weeks,
            feePerWeek,
            missedWeeks: 0,
          },
        },
      };
      next = appendTimeline(next, {
        category: 'life',
        title: `ลงคอร์ส${skillMeta.label} (${action.weeks} สัปดาห์)`,
        description: `ค่าเรียนสัปดาห์ละ ${feePerWeek.toLocaleString('th-TH')} บาท (รวม ${SKILL_LEVEL_CONFIG.courseTotalFee.toLocaleString('th-TH')} บาท) เพื่อปลดล็อกขั้นคอร์สถึง Lv.4 และรับใบประกาศนียบัตร`,
      });
      return {
        state: next,
        accepted: true,
        message: `ลงคอร์ส${skillMeta.label} ${action.weeks} สัปดาห์เรียบร้อยแล้ว`,
      };
    }

    case 'SWAP_TALENT_SLOT': {
      const res = applySwapTalentSlot(state, action.activeIdx, action.vaultIdx);
      return { state: res.state, accepted: res.accepted, message: res.message };
    }

    case 'BORROW_MONEY': {
      if (state.character.ageYears < 18) {
        return { state, accepted: false, message: 'ผู้เยาว์อายุต่ำกว่า 18 ปี ไม่สามารถกู้สินเชื่อได้' };
      }
      const amount = Math.round(action.amount);
      if (amount <= 0) {
        return { state, accepted: false, message: 'จำนวนเงินกู้ต้องมากกว่า 0' };
      }
      if (amount > state.economy.creditLimit) {
        return {
          state,
          accepted: false,
          message: `เกินวงเงินกู้คงเหลือ (${state.economy.creditLimit.toLocaleString('th-TH')} บาท)`,
        };
      }
      let next = applyEffects(state, [
        { type: 'AddMoney', amount, category: 'debt', reason: 'เบิกวงเงินสินเชื่อส่วนบุคคล' },
        { type: 'AddDebt', amount, reason: 'ก่อหนี้สินเชื่อส่วนบุคคล' },
        { type: 'ChangeCredit', delta: -8, reason: 'สัดส่วนภาระหนี้เพิ่มขึ้น' },
      ]);
      next = appendTimeline(next, {
        category: 'finance',
        title: `กู้เงินสินเชื่อ ${amount.toLocaleString('th-TH')} บาท`,
        description: 'เพิ่มสภาพคล่องระยะสั้น พร้อมภาระดอกเบี้ย 1.5% ต่อเดือน',
      });
      return { state: next, accepted: true };
    }

    case 'REPAY_DEBT': {
      const amount = Math.min(Math.round(action.amount), state.economy.debt, state.economy.cash);
      if (amount <= 0) {
        return { state, accepted: false, message: 'ไม่มียอดหนี้หรือเงินสดไม่เพียงพอชำระ' };
      }
      let next = applyEffects(state, [
        { type: 'AddMoney', amount: -amount, category: 'debt', reason: 'โปะชำระหนี้สิน' },
        { type: 'RepayDebt', amount, reason: 'ลดเงินต้นหนี้สิน' },
        { type: 'ChangeCredit', delta: Math.min(15, Math.max(2, Math.floor(amount / 3000))), reason: 'ชำระคืนหนี้ช่วยเพิ่มความน่าเชื่อถือ' },
      ]);
      next = appendTimeline(next, {
        category: 'finance',
        title: `ชำระหนี้ ${amount.toLocaleString('th-TH')} บาท`,
        description: `หนี้คงเหลือ ${next.economy.debt.toLocaleString('th-TH')} บาท`,
      });
      return { state: next, accepted: true };
    }

    case 'RESOLVE_PROMPT': {
      if (!state.pendingPrompt || state.pendingPrompt.id !== action.promptId) {
        return { state, accepted: false, message: 'ไม่พบเหตุการณ์ที่รอตัดสินใจ' };
      }
      const choice = state.pendingPrompt.choices.find((c) => c.id === action.choiceId);
      if (!choice) {
        return { state, accepted: false, message: 'ไม่พบตัวเลือกนี้' };
      }
      // กฎตายตัวใน Engine: ห้ามตัวละครอายุต่ำกว่า 18 เลือกตัวเลือกผู้ใหญ่เด็ดขาด
      if (state.character.isMinor && choice.requiresAdult) {
        return { state, accepted: false, message: 'ถูกปฏิเสธโดยกฎอายุ (isMinor)' };
      }
      if (choice.disabled) {
        return { state, accepted: false, message: choice.disabledReason ?? 'ตัวเลือกนี้ยังไม่พร้อมใช้งาน' };
      }

      const eduHandled = resolveEducationPromptChoice(state, state.pendingPrompt, action.choiceId);
      if (eduHandled) {
        eduHandled.economy = recalculateEconomyDerived(eduHandled.character, eduHandled.economy);
        eduHandled.character.indices = computeLifeIndices(eduHandled.character, eduHandled.economy);
        return { state: eduHandled, accepted: true };
      }

      const promptStoryletId = state.pendingPrompt.storyletId;
      const promptCategory = state.pendingPrompt.category;

      // If storylet event, resolve via director to handle twists, cash costs, and StartScene
      if (promptStoryletId || choice.twistChance || choice.costCash) {
        let next = resolveStoryletChoice(state, action.choiceId);
        // Sync Phase 3.3.1 educationState triggers from crisis/scholarship flags
        const prevFlags = state.character.flags ?? {};
        const nextFlags = next.character.flags ?? {};
        if (!prevFlags.enroll_nfe_upper && nextFlags.enroll_nfe_upper && next.economy.jobId !== 'student') {
          const nfeRes = applyEnrollSecondChanceEdu(next, 'nfe_upper');
          if (nfeRes.accepted) next = nfeRes.state;
        }
        if (next.character.educationState) {
          let updatedEdu = next.character.educationState;
          let changed = false;
          if (!prevFlags.applied_student_loan && nextFlags.applied_student_loan) {
            updatedEdu = { ...updatedEdu, hasStudentLoan: true };
            changed = true;
          }
          if (!prevFlags.won_high_school_scholarship && nextFlags.won_high_school_scholarship) {
            updatedEdu = { ...updatedEdu, hasScholarship: true, scholarshipMinGpa: 3.0 };
            changed = true;
          }
          if (changed) {
            next = {
              ...next,
              character: {
                ...next.character,
                educationState: updatedEdu,
              },
            };
          }
        }
        next.economy = recalculateEconomyDerived(next.character, next.economy);
        next.character.indices = computeLifeIndices(next.character, next.economy);
        next = {
          ...next,
          activeToast: attachStoryletFeedbackToast(state, next, promptStoryletId, promptCategory),
        };
        return { state: next, accepted: true };
      }

      const promptTitle = state.pendingPrompt.title;
      let next: GameState = {
        ...state,
        pendingPrompt: null,
        needsPlayer: state.pendingAutopilotSituation !== null,
      };
      next = applyEffects(next, choice.effects);
      let nextSceneMode = next.sceneMode ?? null;
      for (const eff of choice.effects) {
        if (eff.type === 'StartScene') {
          const durationDays = Math.max(1, eff.durationDays ?? (eff.sceneId === 'hospital' ? 3 : 1));
          nextSceneMode = {
            sceneId: eff.sceneId,
            daypart: eff.daypart,
            reason: eff.reason,
            startedAtTotalDay: next.date.totalDays,
            expiresAtTotalDay: next.date.totalDays + durationDays,
            returnSummary: eff.returnSummary,
          };
        }
      }
      next.sceneMode = nextSceneMode;
      const isMilestonePrompt =
        state.pendingPrompt.tier === 'T3' || state.pendingPrompt.category === 'milestone';
      const fallbackCategory: TimelineEntry['category'] = isMilestonePrompt ? 'milestone' : 'life';
      next = appendTimeline(next, {
        category: fallbackCategory,
        title: `${promptTitle} -> ${choice.label}`,
        description: choice.hint ?? 'คุณได้ตัดสินใจเลือกทางเดินในเหตุการณ์นี้แล้ว',
        effectsSummary: summarizeEffects(choice.effects),
      });
      next.economy = recalculateEconomyDerived(next.character, next.economy);
      next.character.indices = computeLifeIndices(next.character, next.economy);
      next = {
        ...next,
        activeToast: attachStoryletFeedbackToast(state, next, promptStoryletId, promptCategory),
      };
      return { state: next, accepted: true };
    }

    case 'CONFIRM_LIFE_PLANNER': {
      const validation = validatePlanner(action.grid, state);
      if (!validation.valid) {
        return { state, accepted: false, message: validation.errors.join(' · ') };
      }
      const cleanGrid = sanitizeGridForState(action.grid, state);
      const nextPreset = action.presetId ?? 'custom';
      const basePlanner = state.planner ?? createInitialPlannerState(state);
      const next: GameState = {
        ...state,
        planner: {
          ...basePlanner,
          pendingGrid: cleanGrid,
          pendingPresetId: nextPreset,
          effectiveFromDay: state.date.totalDays + 1,
          draft: undefined,
        },
      };
      return {
        state: next,
        accepted: true,
        message: 'ยืนยันแผนชีวิตแล้ว (มีผลตั้งแต่วันพรุ่งนี้)',
      };
    }

    case 'UPDATE_STANDING_ORDERS': {
      const orders = action.orders;
      const defaults = createDefaultStandingOrders(state.character);
      const nextSelfCare = orders.selfCare
        ? {
            ...defaults.selfCare,
            ...orders.selfCare,
            pausedByLowCash: { ...(orders.selfCare.pausedByLowCash ?? {}) },
          }
        : defaults.selfCare;
      const sanitized = {
        ...orders,
        financial: {
          ...orders.financial,
          minSavingsRatePct: clamp(Math.round(orders.financial.minSavingsRatePct), 0, 60),
          lowCashThreshold: Math.max(0, Math.round(orders.financial.lowCashThreshold)),
        },
        rules: orders.rules.map((r) => ({ ...r })),
        selfCare: nextSelfCare,
      };
      return {
        state: {
          ...state,
          standingOrders: sanitized,
        },
        accepted: true,
        message: 'อัปเดตคำสั่งล่วงหน้า (Standing Orders) เรียบร้อย',
      };
    }

    case 'TRIGGER_TURNING_POINT': {
      const next = applyTurningPoint(state, action.kind, state.seed);
      return { state: next, accepted: true };
    }

    case 'RESOLVE_AUTOPILOT': {
      const sit = state.pendingAutopilotSituation;
      if (!sit || sit.id !== action.situationId) {
        return { state, accepted: false, message: 'ไม่พบสถานการณ์ Autopilot ที่รอการตัดสินใจ' };
      }
      const opt = sit.options.find((o) => o.id === action.optionId);
      if (!opt) {
        return { state, accepted: false, message: 'ไม่พบตัวเลือกนี้' };
      }
      if (state.character.isMinor && opt.requiresAdult) {
        return { state, accepted: false, message: 'ถูกปฏิเสธโดยกฎอายุ (isMinor)' };
      }
      let next = resolveAutopilotWithOption(
        state,
        sit,
        opt,
        'คุณตัดสินใจเลือกทางเดินด้วยตัวเองหลังระบบหยุดรอ',
        true
      );
      next.economy = recalculateEconomyDerived(next.character, next.economy);
      next.character.indices = computeLifeIndices(next.character, next.economy);
      return { state: next, accepted: true };
    }

    case 'TRIGGER_AUTOPILOT_SITUATION': {
      const sit = buildAutopilotSituation(
        action.kind ?? 'risky_windfall',
        state.date.totalDays,
        state.character.isMinor
      );
      if (!sit) {
        return { state, accepted: false, message: 'ไม่สามารถสร้างสถานการณ์นี้ได้ในช่วงวัยปัจจุบัน' };
      }
      const decision = autopilotDecide(state, sit, state.rngState);
      let next: GameState = { ...state, rngState: decision.rngState };
      if (decision.handled && decision.chosenOption) {
        next = resolveAutopilotWithOption(
          next,
          sit,
          decision.chosenOption,
          decision.explainReasonTh,
          true
        );
        next.economy = recalculateEconomyDerived(next.character, next.economy);
        next.character.indices = computeLifeIndices(next.character, next.economy);
        return { state: next, accepted: true, message: decision.explainReasonTh };
      }
      next = {
        ...next,
        pendingAutopilotSituation: sit,
        needsPlayer: true,
      };
      return { state: next, accepted: true, message: decision.explainReasonTh };
    }

    case 'UPDATE_SETTINGS': {
      const nextSettings = {
        pubVisitAge: 20 as const,
        ...state.settings,
        ...action.settings,
      };
      return {
        state: {
          ...state,
          settings: nextSettings,
        },
        accepted: true,
      };
    }

    case 'CLEAR_DIGEST': {
      return {
        state: {
          ...state,
          lastDigest: null,
        },
        accepted: true,
      };
    }

    case 'EXECUTE_GATED_ACTION': {
      const evaluated = filterAvailableActions(state).find((e) => e.action.id === action.actionId);
      if (!evaluated) {
        return { state, accepted: false, message: 'ไม่พบกิจกรรมนี้' };
      }
      if (!evaluated.available) {
        return {
          state,
          accepted: false,
          message: evaluated.lockReasonTh ?? 'ยังไม่ผ่านเงื่อนไขปลดล็อกกิจกรรมนี้',
        };
      }
      const def = evaluated.action;
      if (state.character.resources.energy < def.energyCost) {
        return { state, accepted: false, message: `พลังงานไม่พอ (ต้องมีอย่างน้อย ${def.energyCost})` };
      }
      if (state.character.resources.freeTime < def.freeTimeCost) {
        return { state, accepted: false, message: `เวลาว่างไม่พอ (ต้องมีอย่างน้อย ${def.freeTimeCost} ชม.)` };
      }

      const effects = buildGatedActionEffects(def.id, def.energyCost, def.freeTimeCost);
      const effectsSummary = summarizeEffects(effects);
      let next = applyEffects(state, effects, true);
      next = checkTraitFormation(next, 'weekly', true);
      next = appendTimeline(next, {
        category: 'life',
        title: `กิจกรรมเฉพาะตัว: ${def.labelTh}`,
        description: def.descriptionTh,
        effectsSummary,
      });
      next.economy = recalculateEconomyDerived(next.character, next.economy);
      next.character.indices = computeLifeIndices(next.character, next.economy);
      const summaryText = effectsSummary.length > 0 ? effectsSummary.join(' · ') : def.rewardEffectsSummary;
      return {
        state: next,
        accepted: true,
        message: `${def.labelTh} (${summaryText})`,
      };
    }

    case 'DISMISS_TOAST': {
      return {
        state: {
          ...state,
          activeToast: null,
        },
        accepted: true,
      };
    }

    case 'TRIGGER_STORYLET': {
      const def = STORYLET_CATALOG.find((s) => s.id === action.storyletId);
      if (!def) {
        return { state, accepted: false, message: 'ไม่พบ Storylet ที่ระบุในคลัง' };
      }
      if (state.character.isMinor && (def.isAdultContent || (def.category === 'romance' && !def.conditions?.isMinorSafe))) {
        return { state, accepted: false, message: 'ถูกปฏิเสธโดยกฎผู้เยาว์ (< 18 ปี)' };
      }
      const res = fireStorylet(state, def, true, {
        bypassRules: true,
        sourceReason: 'ทดสอบเรียกเหตุการณ์โดยตรงผ่านปุ่ม Dev',
      });
      const next = res.state;
      next.economy = recalculateEconomyDerived(next.character, next.economy);
      next.character.indices = computeLifeIndices(next.character, next.economy);
      return {
        state: next,
        accepted: true,
        message: `เรียกเหตุการณ์ "${def.title}" (${def.tier}) สำเร็จ`,
      };
    }

    case 'RESOLVE_AUTOPILOT_PROMPT': {
      if (!state.pendingPrompt || state.pendingPrompt.id !== action.promptId) {
        return { state, accepted: false, message: 'ไม่พบการ์ดเหตุการณ์ที่รอการตัดสินใจ' };
      }
      const next = resolveAutopilotPromptDecision(
        state,
        UI_TEXT.AUTOPILOT_SKIP_REASON
      );
      next.economy = recalculateEconomyDerived(next.character, next.economy);
      next.character.indices = computeLifeIndices(next.character, next.economy);
      return { state: next, accepted: true };
    }

    case 'SET_ANNUAL_FOCUS': {
      const res = applyAnnualFocusChange(state, action.focusId);
      if (!res.accepted) {
        return { state, accepted: false, message: res.message };
      }
      return { state: res.state, accepted: true, message: res.message };
    }

    case 'ADD_CALENDAR_PIN': {
      const res = addPlannerCalendarPin(state, action.month, action.day, action.title, action.note);
      if (!res.accepted) {
        return { state, accepted: false, message: res.message };
      }
      return { state: res.state, accepted: true, message: res.message };
    }

    case 'REMOVE_CALENDAR_PIN': {
      return {
        state: removePlannerCalendarPin(state, action.pinId),
        accepted: true,
        message: 'ลบหมุดนัดหมายออกจากปฏิทินแล้ว',
      };
    }

    case 'SET_ACTIVITY_SUBFOCUS': {
      const basePlanner = state.planner ?? createInitialPlannerState(state);
      const nextTags = {
        ...(basePlanner.activitySkillTags ?? {}),
        [action.activityId]: action.tagId,
      };
      return {
        state: {
          ...state,
          planner: {
            ...basePlanner,
            activitySkillTags: nextTags,
          },
        },
        accepted: true,
        message: 'ปรับแนวทางการฝึกกิจกรรมเรียบร้อยแล้ว',
      };
    }

    case 'CHOOSE_HIGH_SCHOOL_TRACK': {
      const res = applyChooseHighSchoolTrack(
        state,
        action.track,
        action.fineArtSkill,
        action.vocationalBranch
      );
      return { state: res.state, accepted: res.accepted, message: res.message };
    }

    case 'ENROLL_ROTC': {
      const res = applyEnrollRotc(state, action.enroll);
      return { state: res.state, accepted: res.accepted, message: res.message };
    }

    case 'CHANGE_SCHOOL_TIER': {
      const res = applyChangeSchoolTier(state, action.schoolTier);
      return { state: res.state, accepted: res.accepted, message: res.message };
    }

    case 'ENROLL_SECOND_CHANCE_EDU': {
      const res = applyEnrollSecondChanceEdu(state, action.program);
      return { state: res.state, accepted: res.accepted, message: res.message };
    }

    case 'DEV_SET_PLANNER_STREAKS': {
      const basePlanner = state.planner ?? createInitialPlannerState(state);
      const prevStreaks = basePlanner.streaks ?? createInitialPlannerStreaks(basePlanner.presetId);
      return {
        state: {
          ...state,
          planner: {
            ...basePlanner,
            streaks: {
              ...prevStreaks,
              ...action.patch,
            },
          },
        },
        accepted: true,
        message: 'ปรับค่าตัวนับความต่อเนื่อง (Dev) เรียบร้อย',
      };
    }

    case 'DEV_TOGGLE_FLAG': {
      const prevVal = Boolean(state.character.flags?.[action.flag]);
      const nextVal = action.value !== undefined ? action.value : !prevVal;
      let next: GameState = {
        ...state,
        character: {
          ...state.character,
          flags: {
            ...state.character.flags,
            [action.flag]: nextVal,
          },
        },
      };
      if (next.planner?.grid) {
        const relockRes = sanitizePlannerWithRelockNotice(next.planner, next);
        next = {
          ...next,
          planner: relockRes.planner,
          timeAllocation: deriveWeeklyAllocation(relockRes.planner.grid, next),
        };
      }
      return {
        state: next,
        accepted: true,
        message: `สถานะ ${action.flag}: ${nextVal ? 'เปิด' : 'ปิด'}`,
      };
    }

    case 'DEV_TRIGGER_ANNUAL_FOCUS_PROMPT': {
      if (state.character.ageYears < 13) {
        return { state, accepted: false, message: UI_TEXT.ANNUAL_FOCUS.under13Notice };
      }
      if (state.pendingPrompt?.tier === 'T3') {
        return { state, accepted: false, message: 'มีเหตุการณ์สำคัญ (T3) รอตัดสินใจอยู่ จึงไม่แทรก' };
      }
      const prompt = buildAnnualFocusBirthdayPrompt(state);
      return {
        state: {
          ...state,
          pendingPrompt: prompt,
          needsPlayer: true,
        },
        accepted: true,
        message: 'เปิดการ์ดตั้งเป้าหมายประจำปีแล้ว',
      };
    }
  }
}

/**
 * Deterministic Replay from seed + lifeGenRequest + chronological actionRecords
 */
export function replayGameState(
  request: LifeGenRequest,
  actionRecords: ActionRecord[],
  targetTotalDays: number
): GameState {
  let state = createInitialGameState(request);
  const sorted = [...actionRecords].sort((a, b) => a.atTotalDay - b.atTotalDay);
  let idx = 0;

  while (state.date.totalDays <= targetTotalDays) {
    while (idx < sorted.length && sorted[idx].atTotalDay === state.date.totalDays) {
      const res = dispatchPlayerAction(state, sorted[idx].action);
      state = res.state;
      idx++;
    }
    if (state.date.totalDays >= targetTotalDays) break;
    if (!state.character.isAlive) break;
    state = stepOneTick(state, { allowPrompts: true });
  }

  return state;
}
