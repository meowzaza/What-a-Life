import { ALL_SKILL_IDS, DISCOVERED_SKILL_IDS } from '../data/skills';
import { createEmploymentForJob } from '../data/thaiData';
import { buildCharacterAppearance } from './appearance';
import { createDefaultStandingOrders } from './autopilot';
import { formatShortThaiDate } from './clock';
import { checkSideGigEligibility } from './economy';
import { createInitialEducationState } from './education';
import { getLifeSubStageId } from './lifeStage';
import { TALENT_MAX_ACTIVE_SLOTS, TALENT_VAULT_MAX_SLOTS } from '../data/talents';
import { appendTimeline } from './log';
import {
  buildSkillStatesFromCompatSkills,
  convertLevelToCompatScore,
  createInitialSkillTrainingState,
  zeroSkillRecord,
} from './skillTraining';
import { migratePlanner } from './planner';
import { evaluatePresetAvailability } from './timeAlloc';
import { initTraitsForPerson } from './traits';
import type {
  ActionRecord,
  DiscoveredSkillId,
  GameState,
  LifeGenRequest,
  LifestylePresetId,
  SkillKey,
  Skills,
  SkillTrainingState,
  StandingOrders,
} from './types';

export interface SaveSlotData {
  slotId: string; // 'autosave' | 'slot_1' | 'slot_2' | 'slot_3'
  label: string;
  savedAtISO: string;
  seed: number;
  lifeGenRequest: LifeGenRequest;
  actionLog: ActionRecord[];
  snapshot: GameState;
  meta: {
    characterName: string;
    ageYears: number;
    dateLabel: string;
    cash: number;
    jobTitle: string;
    isAlive: boolean;
  };
}

export const AUTOSAVE_SLOT_ID = 'autosave';

export const MANUAL_SAVE_SLOTS = [
  { id: 'slot_1', label: 'ช่องบันทึกที่ 1' },
  { id: 'slot_2', label: 'ช่องบันทึกที่ 2' },
  { id: 'slot_3', label: 'ช่องบันทึกที่ 3' },
  { id: 'slot_4', label: 'ช่องบันทึกที่ 4' },
] as const;

export const SAVE_SLOTS = [
  { id: AUTOSAVE_SLOT_ID, label: 'บันทึกอัตโนมัติ (ล่าสุด)' },
  ...MANUAL_SAVE_SLOTS,
] as const;

export function buildSavePayload(
  slotId: string,
  label: string,
  state: GameState,
  lifeGenRequest: LifeGenRequest,
  actionLog: ActionRecord[],
  savedAtISO = new Date().toISOString()
): SaveSlotData {
  return {
    slotId,
    label,
    savedAtISO,
    seed: state.seed,
    lifeGenRequest,
    actionLog: [...actionLog],
    snapshot: state,
    meta: {
      characterName: `${state.character.firstName} ${state.character.lastName} (${state.character.nickname})`,
      ageYears: state.character.ageYears,
      dateLabel: formatShortThaiDate(state.date),
      cash: state.economy.cash,
      jobTitle: state.economy.jobTitle,
      isAlive: state.character.isAlive,
    },
  };
}

function mapLegacySkillKey(rawKey: string): SkillKey | undefined {
  if (rawKey === 'socializing') return 'social';
  if (rawKey === 'sales' || rawKey === 'finance') return 'business';
  if (rawKey === 'english') return 'foreign_lang';
  if (rawKey === 'cooking') return 'culinary';
  if ((ALL_SKILL_IDS as string[]).includes(rawKey)) return rawKey as SkillKey;
  return undefined;
}

function migrateSkillRecordMap(rawMap: Record<string, number> | undefined): Record<SkillKey, number> {
  const out = zeroSkillRecord();
  if (!rawMap) return out;
  for (const k of ALL_SKILL_IDS) {
    if (typeof rawMap[k] === 'number') {
      out[k] = rawMap[k];
    }
  }
  if (rawMap.social === undefined && typeof rawMap.socializing === 'number') {
    out.social = rawMap.socializing;
  }
  if (rawMap.business === undefined) {
    const oldSales = typeof rawMap.sales === 'number' ? rawMap.sales : 0;
    const oldFin = typeof rawMap.finance === 'number' ? rawMap.finance : 0;
    if (oldSales > 0 || oldFin > 0) {
      out.business = Math.max(oldSales, oldFin);
    }
  }
  if (rawMap.foreign_lang === undefined && typeof rawMap.english === 'number') {
    out.foreign_lang = rawMap.english;
  }
  if (rawMap.culinary === undefined && typeof rawMap.cooking === 'number') {
    out.culinary = rawMap.cooking;
  }
  return out;
}

function migrateSkillsAndTrainingFromSnapshot(snapshot: GameState): {
  skills: Skills;
  skillTraining: SkillTrainingState;
} {
  const rawSkills = (snapshot.character.skills ?? {}) as unknown as Record<string, number>;
  const migratedSkills: Skills = migrateSkillRecordMap(rawSkills);

  const rawTraining = snapshot.skillTraining as unknown as
    | (Partial<SkillTrainingState> & {
        xp?: Record<string, number>;
        lastPracticedWeek?: Record<string, number>;
        lastLoggedCap?: Record<string, 30 | 60>;
        focus?: string[];
        course?: { skillId: string; weeksLeft: number; totalWeeks: number; feePerWeek: number } | null;
      })
    | undefined;

  const focusMapped: SkillKey[] = [];
  for (const f of rawTraining?.focus ?? []) {
    const mapped = mapLegacySkillKey(f);
    if (mapped && !focusMapped.includes(mapped)) {
      focusMapped.push(mapped);
    }
  }

  let migratedCourse = null;
  if (rawTraining?.course) {
    const mappedCourseSkill = mapLegacySkillKey(rawTraining.course.skillId);
    if (mappedCourseSkill) {
      migratedCourse = {
        ...rawTraining.course,
        skillId: mappedCourseSkill,
      };
    }
  }

  const discoveredSet = new Set<DiscoveredSkillId>(rawTraining?.discoveredSkills ?? []);
  for (const discKey of DISCOVERED_SKILL_IDS) {
    if ((migratedSkills[discKey] ?? 0) > 0) {
      discoveredSet.add(discKey);
    }
  }

  const migratedLastLoggedCap: Partial<Record<SkillKey, 30 | 60>> = {};
  if (rawTraining?.lastLoggedCap) {
    for (const [k, v] of Object.entries(rawTraining.lastLoggedCap)) {
      const mapped = mapLegacySkillKey(k);
      if (mapped && (v === 30 || v === 60)) {
        migratedLastLoggedCap[mapped] = v;
      }
    }
  }

  const skillStates = buildSkillStatesFromCompatSkills(migratedSkills, rawTraining?.skillStates);

  // Keep compat score aligned with migrated Lv.1-5 state if synthesized from legacy save
  if (!rawTraining?.skillStates) {
    for (const sk of ALL_SKILL_IDS) {
      migratedSkills[sk] = convertLevelToCompatScore(skillStates[sk]);
    }
  }

  const skillTraining = createInitialSkillTrainingState({
    ...rawTraining,
    focus: focusMapped,
    course: migratedCourse,
    skillStates,
    xp: migrateSkillRecordMap(rawTraining?.xp),
    lastPracticedWeek: migrateSkillRecordMap(rawTraining?.lastPracticedWeek),
    discoveredSkills: Array.from(discoveredSet),
    lastLoggedCap: migratedLastLoggedCap,
  });

  return { skills: migratedSkills, skillTraining };
}

export function hydrateLoadedGameState(
  snapshot: GameState,
  lifeGenRequest?: LifeGenRequest
): GameState {
  let character = snapshot.character;

  // Phase 3.3.1-FIX: Migrate legacy 8-key or 13-key skills -> Lv.1-5 skillStates & initialize talents/vault/educationState
  const { skills: migratedSkills, skillTraining: nextSkillTraining } =
    migrateSkillsAndTrainingFromSnapshot(snapshot);
  const rawEdu =
    character.educationState ??
    createInitialEducationState(
      character.ageYears,
      character.education,
      character.background.familyWealth,
      snapshot.seed
    ).educationState;
  const migratedEducationState = {
    ...rawEdu,
    gpaHistory: rawEdu.gpaHistory ?? [],
    teacherTermDelta: rawEdu.teacherTermDelta ?? 0,
    trackChangeCountThisYear: rawEdu.trackChangeCountThisYear ?? 0,
  };

  // Cap revealed active talents at 3 and overflow any extras into talentVault (max 5)
  const existingTalents = [...(character.talents ?? [])];
  const existingVault = [...(character.talentVault ?? [])];
  const keptTalents = [];
  let revealedActiveCount = 0;
  for (const t of existingTalents) {
    if (t.revealed) {
      if (revealedActiveCount < TALENT_MAX_ACTIVE_SLOTS) {
        keptTalents.push(t);
        revealedActiveCount++;
      } else if (existingVault.length < TALENT_VAULT_MAX_SLOTS) {
        existingVault.push(t);
      }
    } else {
      keptTalents.push(t);
    }
  }

  character = {
    ...character,
    skills: migratedSkills,
    talents: keptTalents,
    talentVault: existingVault.slice(0, TALENT_VAULT_MAX_SLOTS),
    limitations: character.limitations ?? [],
    educationState: migratedEducationState,
    lifeHistory: character.lifeHistory ?? [],
  };

  if (!character.appearance?.charId) {
    const appearance = buildCharacterAppearance(
      snapshot.seed,
      character.gender,
      character.ageYears,
      undefined,
      lifeGenRequest?.appearanceOverride
    );
    if (appearance) {
      character = {
        ...character,
        appearance,
      };
    }
  }

  let nextEvidence = snapshot.evidence;
  if (
    !character.lifeStage ||
    !character.temperamentProfile ||
    !character.personality ||
    !character.emergentTraits ||
    !character.reputationView
  ) {
    const initialized = initTraitsForPerson(
      snapshot.seed,
      character.background.temperament,
      character.ageYears
    );
    character = {
      ...character,
      lifeStage: character.lifeStage ?? getLifeSubStageId(character.ageYears),
      temperamentProfile: character.temperamentProfile ?? initialized.temperamentProfile,
      personality: character.personality ?? initialized.personality,
      emergentTraits: character.emergentTraits ?? initialized.emergentTraits,
      innerTension: character.innerTension ?? initialized.innerTension,
      reputationView: character.reputationView ?? initialized.reputationView,
      traits: character.traits?.length ? character.traits : initialized.traitsTagList,
    };
    nextEvidence = nextEvidence ?? initialized.starterEvidence;
  }

  const defaultOrders = createDefaultStandingOrders(character);
  const nextStandingOrders: StandingOrders = snapshot.standingOrders
    ? {
        ...defaultOrders,
        ...snapshot.standingOrders,
        selfCare: {
          ...defaultOrders.selfCare,
          ...(snapshot.standingOrders.selfCare ?? {}),
          healthCheckupPackage: snapshot.standingOrders.selfCare?.healthCheckupPackage ?? 'off',
          groomingMonthlyEnabled: snapshot.standingOrders.selfCare?.groomingMonthlyEnabled ?? false,
          familyRemittanceMode: snapshot.standingOrders.selfCare?.familyRemittanceMode ?? 'off',
          pausedByLowCash: { ...(snapshot.standingOrders.selfCare?.pausedByLowCash ?? {}) },
        },
      }
    : defaultOrders;
  const nextSettings = { pubVisitAge: 20 as const, ...snapshot.settings };
  const nextSideGigRecord = snapshot.sideGigRecord ?? null;

  let hydrated: GameState = {
    ...snapshot,
    character,
    evidence: nextEvidence ?? {},
    sideGigRecord: nextSideGigRecord,
    skillTraining: nextSkillTraining,
    standingOrders: nextStandingOrders,
    pendingAutopilotSituation: snapshot.pendingAutopilotSituation ?? null,
    lastDigest: snapshot.lastDigest ?? null,
    settings: nextSettings,
    activeToast: snapshot.activeToast ?? null,
    sceneMode:
      snapshot.sceneMode && snapshot.sceneMode.expiresAtTotalDay === undefined
        ? snapshot.sceneMode.sceneId === 'hospital' && character.indices.physical >= 35
          ? null
          : {
              ...snapshot.sceneMode,
              startedAtTotalDay: snapshot.sceneMode.startedAtTotalDay ?? snapshot.date.totalDays,
              expiresAtTotalDay: snapshot.date.totalDays + 2,
            }
        : (snapshot.sceneMode ?? null),
    gameSpeed: snapshot.gameSpeed ?? 1,
    directorState: snapshot.directorState ?? {
      lastT2Day: -999,
      lastT3Day: -999,
      lastCategoryDays: {},
      activeForeshadows: [],
      twistCount: 0,
      lastTwistDay: -999,
      seenStoryletIds: [],
      consequenceQueue: [],
      tensionBudget: 100,
    },
  };

  // Migrate legacy routine -> lifestylePresetId per Spec 05 §2.4
  let nextPresetId: LifestylePresetId | 'custom' | undefined = snapshot.lifestylePresetId;
  if (!nextPresetId) {
    const legacyRoutine = snapshot.routine as string | undefined;
    let candidate: LifestylePresetId = 'balanced';
    let sideGigRejected = false;

    if (legacyRoutine === 'balanced' || !legacyRoutine) {
      candidate = hydrated.economy.jobId === 'student' ? 'study_focus' : 'balanced';
    } else if (legacyRoutine === 'hustle') {
      candidate = 'workaholic';
    } else if (legacyRoutine === 'study' || legacyRoutine === 'grind') {
      candidate = 'skill_grind';
    } else if (legacyRoutine === 'rest') {
      candidate = 'rest_recover';
    } else if (legacyRoutine === 'side_gig') {
      if (checkSideGigEligibility(hydrated, 1).allowed) {
        candidate = 'work_and_gig';
      } else {
        candidate = 'balanced';
        sideGigRejected = true;
      }
    }

    if (
      character.ageYears >= 6 &&
      evaluatePresetAvailability(candidate, hydrated).available
    ) {
      nextPresetId = candidate;
    } else {
      nextPresetId = 'balanced';
    }

    if (sideGigRejected) {
      hydrated = appendTimeline(hydrated, {
        category: 'life',
        title: 'ย้ายข้อมูลวิถีชีวิตจากเซฟเดิม',
        description:
          'กิจวัตรเดิม (งานเสริม) ถูกปรับเป็น "สมดุล" เนื่องจากยังไม่เข้าเกณฑ์อายุหรือยังไม่มีบันทึกงานเสริมตามเกณฑ์',
      });
    }
  }

  const nextEmployment =
    snapshot.employment && snapshot.employment.jobId === hydrated.economy.jobId
      ? snapshot.employment
      : createEmploymentForJob(
          hydrated.economy.jobId,
          'morning-afternoon',
          snapshot.employment
        );

  hydrated = {
    ...hydrated,
    employment: nextEmployment,
    lifestylePresetId: nextPresetId,
  };

  return migratePlanner(hydrated);
}

export function hydrateLoadedSaveSlot(slot: SaveSlotData): SaveSlotData {
  const snapshot = hydrateLoadedGameState(slot.snapshot, slot.lifeGenRequest);
  if (snapshot === slot.snapshot) return slot;
  return { ...slot, snapshot };
}

const DB_NAME = 'thai_life_sim_db';
const DB_VERSION = 1;
const STORE_NAME = 'save_slots';

function openSaveDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB ไม่พร้อมใช้งานในสภาพแวดล้อมนี้'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('เปิด IndexedDB ไม่สำเร็จ'));
  });
}

export async function saveToIndexedDB(payload: SaveSlotData): Promise<void> {
  const db = await openSaveDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(payload);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('บันทึกข้อมูลไม่สำเร็จ'));
    };
  });
}

export async function loadFromIndexedDB(slotId: string): Promise<SaveSlotData | null> {
  const db = await openSaveDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(slotId);
    req.onsuccess = () => {
      db.close();
      const raw = req.result as SaveSlotData | undefined;
      resolve(raw ? hydrateLoadedSaveSlot(raw) : null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error('โหลดข้อมูลไม่สำเร็จ'));
    };
  });
}

export async function listSaveSlotsFromIndexedDB(): Promise<SaveSlotData[]> {
  const db = await openSaveDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      const rows = (req.result as SaveSlotData[]) ?? [];
      resolve(rows.map(hydrateLoadedSaveSlot));
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error('อ่านรายการเซฟไม่สำเร็จ'));
    };
  });
}

export async function deleteSaveSlotFromIndexedDB(slotId: string): Promise<void> {
  const db = await openSaveDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(slotId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('ลบช่องเซฟไม่สำเร็จ'));
    };
  });
}

export async function saveAutosave(
  state: GameState,
  lifeGenRequest: LifeGenRequest,
  actionLog: ActionRecord[]
): Promise<void> {
  const payload = buildSavePayload(
    AUTOSAVE_SLOT_ID,
    'บันทึกอัตโนมัติ',
    state,
    lifeGenRequest,
    actionLog
  );
  await saveToIndexedDB(payload);
}

export async function loadAutosave(): Promise<SaveSlotData | null> {
  return loadFromIndexedDB(AUTOSAVE_SLOT_ID);
}

