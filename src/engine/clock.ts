import { THAI_MONTHS, THAI_WEEKDAYS } from '../data/thaiData';
import type { GameDate } from './types';

// Configurable timing constant: x1 = 1 game day per 2 real seconds
export const BASE_MS_PER_DAY = 2000;

export function isLeapYearCE(yearCE: number): boolean {
  return (yearCE % 4 === 0 && yearCE % 100 !== 0) || yearCE % 400 === 0;
}

export function getDaysInMonth(yearCE: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYearCE(yearCE) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

export function createDate(yearCE: number, month: number, day: number, totalDays = 0): GameDate {
  // Zeller-like / JS Date UTC day of week without local timezone drift
  const utc = Date.UTC(yearCE, month - 1, day);
  const dayOfWeek = new Date(utc).getUTCDay();
  return {
    yearCE,
    month,
    day,
    dayOfWeek,
    totalDays,
  };
}

export interface CalendarAdvanceResult {
  nextDate: GameDate;
  isNewWeek: boolean;
  isNewMonth: boolean;
  isNewYear: boolean;
}

export function advanceOneDay(date: GameDate): CalendarAdvanceResult {
  const daysInCurrentMonth = getDaysInMonth(date.yearCE, date.month);
  let yearCE = date.yearCE;
  let month = date.month;
  let day = date.day + 1;
  let isNewMonth = false;
  let isNewYear = false;

  if (day > daysInCurrentMonth) {
    day = 1;
    month += 1;
    isNewMonth = true;
    if (month > 12) {
      month = 1;
      yearCE += 1;
      isNewYear = true;
    }
  }

  const dayOfWeek = (date.dayOfWeek + 1) % 7;
  const isNewWeek = dayOfWeek === 1; // Every Monday starts a new week

  return {
    nextDate: {
      yearCE,
      month,
      day,
      dayOfWeek,
      totalDays: date.totalDays + 1,
    },
    isNewWeek,
    isNewMonth,
    isNewYear,
  };
}

export function toBuddhistYear(yearCE: number): number {
  return yearCE + 543;
}

export function formatThaiDate(date: GameDate): string {
  const weekday = THAI_WEEKDAYS[date.dayOfWeek] ?? '';
  const monthName = THAI_MONTHS[date.month - 1] ?? '';
  const yearBE = toBuddhistYear(date.yearCE);
  return `วัน${weekday}ที่ ${date.day} ${monthName} พ.ศ. ${yearBE}`;
}

export function formatShortThaiDate(date: GameDate): string {
  const monthName = THAI_MONTHS[date.month - 1] ?? '';
  const yearBE = toBuddhistYear(date.yearCE);
  return `${date.day} ${monthName} ${yearBE}`;
}

export function getMonthProgressRatio(date: GameDate): number {
  const total = getDaysInMonth(date.yearCE, date.month);
  return Math.min(1, Math.max(0, date.day / total));
}

const THAI_FIXED_PUBLIC_HOLIDAYS: ReadonlySet<string> = new Set([
  '1-1',   // วันขึ้นปีใหม่
  '4-6',   // วันจักรี
  '4-13',  // วันสงกรานต์
  '4-14',  // วันสงกรานต์
  '4-15',  // วันสงกรานต์
  '5-1',   // วันแรงงานแห่งชาติ
  '5-4',   // วันฉัตรมงคล
  '6-3',   // วันเฉลิมพระชนมพรรษาพระราชินี
  '7-28',  // วันเฉลิมพระชนมพรรษา ร.10
  '8-12',  // วันแม่แห่งชาติ
  '10-13', // วันนวมินทรมหาราช
  '10-23', // วันปิยมหาราช
  '12-5',  // วันพ่อแห่งชาติ
  '12-10', // วันรัฐธรรมนูญ
  '12-31', // วันสิ้นปี
]);

export function isThaiPublicHoliday(month: number, day: number): boolean {
  return THAI_FIXED_PUBLIC_HOLIDAYS.has(`${month}-${day}`);
}

/**
 * ช่วงปิดเทอมมาตรฐานของสถานศึกษาไทย (มี.ค. 15 - เม.ย. 30 และ ต.ค. 1 - ต.ค. 31)
 */
export function isThaiSchoolBreak(month: number, day: number): boolean {
  if (month === 10) return true;
  if (month === 4) return true;
  if (month === 3 && day >= 15) return true;
  return false;
}

