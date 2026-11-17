export type FontPresetId =
  | 'ta_16_bit'
  | 'pixelpoint'
  | 'rd_chulajaruek'
  | 'pixel_noto'
  | 'mali'
  | 'itim'
  | 'kanit'
  | 'sarabun';

export interface FontPreset {
  id: FontPresetId;
  name: string;
  subtitle: string;
  sourceLabel: string;
  bodyFamily: string;
  displayFamily: string;
  numFamily: string;
  sampleText: string;
}

export const DEFAULT_FONT_PRESET: FontPresetId = 'ta_16_bit';
export const FONT_STORAGE_KEY = 'thaigame_font_preset';

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'ta_16_bit',
    name: 'TA 16 BIT',
    subtitle: 'ฟอนต์พิกเซลไทย 16-บิต (ค่าเริ่มต้น)',
    sourceLabel: 'ฟอนต์หลัก',
    bodyFamily: "'TA 16 BIT', 'Noto Sans Thai', 'Kanit', system-ui, sans-serif",
    displayFamily: "'TA 16 BIT', 'Noto Sans Thai', 'Kanit', sans-serif",
    numFamily: "'TA 16 BIT', 'Noto Sans Thai', 'Kanit', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
  {
    id: 'pixelpoint',
    name: 'Pixelpoint',
    subtitle: 'พิกเซลไทยโมเดิร์น',
    sourceLabel: 'ฟอนต์แนะนำ',
    bodyFamily: "'Pixelpoint', 'Noto Sans Thai', system-ui, sans-serif",
    displayFamily: "'Pixelpoint', 'Noto Sans Thai', 'Kanit', sans-serif",
    numFamily: "'Pixelpoint', 'Noto Sans Thai', 'Kanit', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
  {
    id: 'rd_chulajaruek',
    name: 'RD CHULAJARUEK',
    subtitle: 'พิกเซลไทยคลาสสิก',
    sourceLabel: 'ตัวเลือกเพิ่มเติม',
    bodyFamily: "'RD CHULAJARUEK', 'Noto Sans Thai', system-ui, sans-serif",
    displayFamily: "'RD CHULAJARUEK', 'Noto Sans Thai', 'Kanit', sans-serif",
    numFamily: "'RD CHULAJARUEK', 'Noto Sans Thai', 'Kanit', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
  {
    id: 'pixel_noto',
    name: 'Pixelify + Noto Thai',
    subtitle: 'หัวข้อพิกเซลคู่ฟอนต์ไทยอ่านคม',
    sourceLabel: 'Google Fonts',
    bodyFamily: "'Pixelify Sans', 'Noto Sans Thai', system-ui, sans-serif",
    displayFamily: "'Pixelify Sans', 'Kanit', 'Noto Sans Thai', sans-serif",
    numFamily: "'Kanit', 'Noto Sans Thai', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
  {
    id: 'mali',
    name: 'Mali (มะลิ)',
    subtitle: 'ลายมือน่ารักสดใส สไตล์สมุดโน้ต',
    sourceLabel: 'Google Fonts',
    bodyFamily: "'Mali', 'Noto Sans Thai', sans-serif",
    displayFamily: "'Mali', 'Kanit', sans-serif",
    numFamily: "'Mali', 'Kanit', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
  {
    id: 'itim',
    name: 'Itim (ไอติม)',
    subtitle: 'เส้นมนน่ารัก อ่านสบายขี้เล่น',
    sourceLabel: 'Google Fonts',
    bodyFamily: "'Itim', 'Noto Sans Thai', sans-serif",
    displayFamily: "'Itim', 'Kanit', sans-serif",
    numFamily: "'Kanit', 'Itim', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
  {
    id: 'kanit',
    name: 'Kanit (คณิต)',
    subtitle: 'เรขาคณิตคมชัด อ่านง่ายทุกหน้าจอ',
    sourceLabel: 'Google Fonts',
    bodyFamily: "'Kanit', 'Noto Sans Thai', sans-serif",
    displayFamily: "'Kanit', 'Noto Sans Thai', sans-serif",
    numFamily: "'Kanit', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
  {
    id: 'sarabun',
    name: 'Prompt + Sarabun',
    subtitle: 'ทางการสบายตา เหมาะอ่านเนื้อเรื่องยาว',
    sourceLabel: 'Google Fonts',
    bodyFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
    displayFamily: "'Prompt', 'Sarabun', sans-serif",
    numFamily: "'Sarabun', 'Kanit', sans-serif",
    sampleText: 'ชีวิตจริงยิ่งกว่านิยาย 123 ฿',
  },
];

export function getFontPreset(id: string | null | undefined): FontPreset {
  return FONT_PRESETS.find((f) => f.id === id) ?? FONT_PRESETS[0];
}

export function loadSavedFontPreset(): FontPresetId {
  if (typeof window === 'undefined') return DEFAULT_FONT_PRESET;
  try {
    const saved = window.localStorage.getItem(FONT_STORAGE_KEY);
    return getFontPreset(saved).id;
  } catch {
    return DEFAULT_FONT_PRESET;
  }
}

export function applyFontPreset(presetId: FontPresetId): void {
  if (typeof document === 'undefined') return;
  const preset = getFontPreset(presetId);
  const root = document.documentElement;
  root.style.setProperty('--font-body', preset.bodyFamily);
  root.style.setProperty('--font-display', preset.displayFamily);
  root.style.setProperty('--font-num', preset.numFamily);
  root.setAttribute('data-font', preset.id);
  try {
    window.localStorage.setItem(FONT_STORAGE_KEY, preset.id);
  } catch {
    // ignore storage errors
  }
}
