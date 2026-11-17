import { AGE_LEGAL_RULES, LIFE_STAGES, type LifeStageDefinition } from '../data/lifeStages';
import type { GameSettings, LifeSubStageId, Person } from './types';

export function getLifeStageForAge(ageYears: number): LifeStageDefinition {
  const clampedAge = Math.max(0, Math.floor(ageYears));
  const found = LIFE_STAGES.find((s) => clampedAge >= s.minAge && clampedAge <= s.maxAge);
  return found ?? LIFE_STAGES[LIFE_STAGES.length - 1];
}

export function getLifeSubStageId(ageYears: number): LifeSubStageId {
  return getLifeStageForAge(ageYears).id;
}

export interface AgeEmploymentRules {
  canWorkAny: boolean;
  canWorkPartTimeOnly: boolean;
  maxDailyHours: number;
  maxWeeklyHours: number;
  canWorkNightShift: boolean;
  canWorkEntertainmentVenue: boolean;
  canEnterPubCustomer: boolean;
  pubVisitAgeThreshold: 18 | 20;
  summaryTh: string;
}

/**
 * Spec 03 Section 2 age & employment legal gates.
 * Consumes existing settings.pubVisitAge (default 20, toggleable to 18) without duplicating setting keys.
 */
export function getAgeEmploymentRules(
  ageYears: number,
  settings?: Partial<GameSettings>
): AgeEmploymentRules {
  const pubVisitAgeThreshold: 18 | 20 = settings?.pubVisitAge ?? AGE_LEGAL_RULES.defaultPubVisitAge;

  if (ageYears < AGE_LEGAL_RULES.minAnyEmploymentAge) {
    return {
      canWorkAny: false,
      canWorkPartTimeOnly: false,
      maxDailyHours: 0,
      maxWeeklyHours: 0,
      canWorkNightShift: false,
      canWorkEntertainmentVenue: false,
      canEnterPubCustomer: false,
      pubVisitAgeThreshold,
      summaryTh: 'อายุต่ำกว่า 15 ปี ยังไม่สามารถทำงานรับจ้างได้ (ช่วยงานบ้านและเรียนเป็นหลัก)',
    };
  }

  if (ageYears < AGE_LEGAL_RULES.minAdultFullWorkAge) {
    return {
      canWorkAny: true,
      canWorkPartTimeOnly: true,
      maxDailyHours: AGE_LEGAL_RULES.minorMaxDailyWorkHours,
      maxWeeklyHours: AGE_LEGAL_RULES.minorMaxWeeklyWorkHours,
      canWorkNightShift: false, // 22:00-06:00 forbidden for <18
      canWorkEntertainmentVenue: false,
      canEnterPubCustomer: false,
      pubVisitAgeThreshold,
      summaryTh: 'อายุ 15–17 ปี ทำพาร์ตไทม์เบาๆ นอกเวลาเรียนได้ไม่เกิน 8 ชม./วัน ห้ามกะดึก 22:00–06:00 และห้ามสถานบริการ',
    };
  }

  const canEnterPubCustomer = ageYears >= pubVisitAgeThreshold;
  return {
    canWorkAny: true,
    canWorkPartTimeOnly: false,
    maxDailyHours: 14,
    maxWeeklyHours: 84,
    canWorkNightShift: true,
    canWorkEntertainmentVenue: ageYears >= AGE_LEGAL_RULES.minPubStaffAge,
    canEnterPubCustomer,
    pubVisitAgeThreshold,
    summaryTh: canEnterPubCustomer
      ? 'อายุถึงเกณฑ์ผู้ใหญ่ เปิดรับงานทุกประเภท กะดึก และเข้าสถานบันเทิงได้'
      : `ทำงานทั่วไปและกะดึกได้ แต่การเข้าใช้บริการผับตั้งเกณฑ์ไว้ที่ ${pubVisitAgeThreshold} ปีขึ้นไป`,
  };
}

export function canWorkPartTime(ageYears: number): boolean {
  return ageYears >= AGE_LEGAL_RULES.minPartTimeAge;
}

export function canEnterNightlife(ageYears: number, settings?: Partial<GameSettings>): boolean {
  if (ageYears < 18) return false; // Hard engine minor lock
  const threshold = settings?.pubVisitAge ?? AGE_LEGAL_RULES.defaultPubVisitAge;
  return ageYears >= threshold;
}

export function onBirthdayLifeStageUpdate(
  person: Person,
  newAge: number
): {
  person: Person;
  changedStage: boolean;
  prevStageDef: LifeStageDefinition;
  nextStageDef: LifeStageDefinition;
} {
  const prevStageDef = getLifeStageForAge(person.ageYears);
  const nextStageDef = getLifeStageForAge(newAge);
  const changedStage = prevStageDef.id !== nextStageDef.id;

  return {
    person: {
      ...person,
      ageYears: newAge,
      isMinor: newAge < 18,
      lifeStage: nextStageDef.id,
    },
    changedStage,
    prevStageDef,
    nextStageDef,
  };
}
