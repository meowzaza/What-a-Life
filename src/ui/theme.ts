import type { LifeIndexKey, TimelineEntry } from '../engine/types';

export interface IndexThemeToken {
  key: LifeIndexKey;
  label: string;
  barColor: string;
  trackBg: string;
  badgeBg: string;
  textColor: string;
  accentHex: string;
}

export const INDEX_THEMES: Record<LifeIndexKey, IndexThemeToken> = {
  physical: {
    key: 'physical',
    label: 'กาย',
    barColor: 'bg-[#6EE7B7]',
    trackBg: 'bg-[#E8FDF3] dark:bg-[#194736]/55',
    badgeBg: 'bg-[#D6FAEA] dark:bg-[#1E533F]/75',
    textColor: 'text-[#167956] dark:text-[#7EF4C2]',
    accentHex: '#34D399',
  },
  mental: {
    key: 'mental',
    label: 'ใจ',
    barColor: 'bg-[#FFA6C9]',
    trackBg: 'bg-[#FFF0F6] dark:bg-[#6E2647]/50',
    badgeBg: 'bg-[#FFE0EE] dark:bg-[#7A2B4E]/75',
    textColor: 'text-[#BD346B] dark:text-[#FFB8D4]',
    accentHex: '#F472B6',
  },
  financial: {
    key: 'financial',
    label: 'เงิน',
    barColor: 'bg-[#FFD86B]',
    trackBg: 'bg-[#FFFBE6] dark:bg-[#664C18]/50',
    badgeBg: 'bg-[#FFF3BF] dark:bg-[#73571D]/75',
    textColor: 'text-[#9A6708] dark:text-[#FFE58F]',
    accentHex: '#F59E0B',
  },
  social: {
    key: 'social',
    label: 'สัมพันธ์',
    barColor: 'bg-[#FFAE87]',
    trackBg: 'bg-[#FFF3EC] dark:bg-[#6E341D]/50',
    badgeBg: 'bg-[#FFE3D3] dark:bg-[#7D3A21]/75',
    textColor: 'text-[#B84B1C] dark:text-[#FFC3A6]',
    accentHex: '#FB923C',
  },
  status: {
    key: 'status',
    label: 'สถานะ',
    barColor: 'bg-[#C4B5FD]',
    trackBg: 'bg-[#F5F2FF] dark:bg-[#442C7A]/50',
    badgeBg: 'bg-[#EAE2FF] dark:bg-[#4F358D]/75',
    textColor: 'text-[#663FB5] dark:text-[#DDD2FE]',
    accentHex: '#A78BFA',
  },
  competence: {
    key: 'competence',
    label: 'ความสามารถ',
    barColor: 'bg-[#93C5FD]',
    trackBg: 'bg-[#EFF6FF] dark:bg-[#223F7D]/50',
    badgeBg: 'bg-[#DCEBFF] dark:bg-[#28488E]/75',
    textColor: 'text-[#2559B8] dark:text-[#B8D8FE]',
    accentHex: '#60A5FA',
  },
};

export const TIMELINE_CATEGORY_META: Record<
  TimelineEntry['category'],
  { label: string; bg: string; text: string; hex: string }
> = {
  life: {
    label: 'ชีวิต',
    bg: 'bg-[#DCEBFF] dark:bg-[#28488E]/60',
    text: 'text-[#2559B8] dark:text-[#B8D8FE]',
    hex: '#60A5FA',
  },
  work: {
    label: 'งานและเรียน',
    bg: 'bg-[#EAE2FF] dark:bg-[#4F358D]/60',
    text: 'text-[#663FB5] dark:text-[#DDD2FE]',
    hex: '#A78BFA',
  },
  finance: {
    label: 'การเงิน',
    bg: 'bg-[#FFF3BF] dark:bg-[#73571D]/60',
    text: 'text-[#9A6708] dark:text-[#FFE58F]',
    hex: '#F59E0B',
  },
  health: {
    label: 'สุขภาพ',
    bg: 'bg-[#FFE0EE] dark:bg-[#7A2B4E]/60',
    text: 'text-[#BD346B] dark:text-[#FFB8D4]',
    hex: '#F472B6',
  },
  milestone: {
    label: 'จุดเปลี่ยน',
    bg: 'bg-[#FFE3D3] dark:bg-[#7D3A21]/60',
    text: 'text-[#B84B1C] dark:text-[#FFC3A6]',
    hex: '#FB923C',
  },
  echo: {
    label: 'ผลสะท้อน',
    bg: 'bg-[#D6FAEA] dark:bg-[#1E533F]/60',
    text: 'text-[#167956] dark:text-[#7EF4C2]',
    hex: '#34D399',
  },
  trait: {
    label: 'นิสัยและตัวตน',
    bg: 'bg-[#FFE0EE] dark:bg-[#7A2B4E]/60',
    text: 'text-[#BD346B] dark:text-[#FFB8D4]',
    hex: '#F472B6',
  },
  autopilot: {
    label: 'ตัวละครตัดสินใจเอง',
    bg: 'bg-[#E2E8F0] dark:bg-[#334155]/60',
    text: 'text-[#475569] dark:text-[#CBD5E1]',
    hex: '#64748B',
  },
  romance: {
    label: 'ความรัก',
    bg: 'bg-[#FFE0EE] dark:bg-[#7A2B4E]/60',
    text: 'text-[#BD346B] dark:text-[#FFB8D4]',
    hex: '#F472B6',
  },
  family: {
    label: 'ครอบครัว',
    bg: 'bg-[#FFF3BF] dark:bg-[#73571D]/60',
    text: 'text-[#9A6708] dark:text-[#FFE58F]',
    hex: '#F59E0B',
  },
  social: {
    label: 'สังคม',
    bg: 'bg-[#D6FAEA] dark:bg-[#1E533F]/60',
    text: 'text-[#167956] dark:text-[#7EF4C2]',
    hex: '#34D399',
  },
  quirky: {
    label: 'เรื่องแปลก',
    bg: 'bg-[#EAE2FF] dark:bg-[#4F358D]/60',
    text: 'text-[#663FB5] dark:text-[#DDD2FE]',
    hex: '#A78BFA',
  },
  system: {
    label: 'สรุปรายปี',
    bg: 'bg-[#DCEBFF] dark:bg-[#28488E]/60',
    text: 'text-[#2559B8] dark:text-[#B8D8FE]',
    hex: '#60A5FA',
  },
};

export const STROKE_COLOR = '#4E3B69';
