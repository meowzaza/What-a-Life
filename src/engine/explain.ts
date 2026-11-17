import { ANNUAL_FOCUS_BY_ID } from '../data/annualFocus';
import { SELF_CARE_ORDER_CONFIG } from '../data/autopilot';
import { LIFESTYLE_PRESETS_BY_ID } from '../data/lifestylePresets';
import { HOUSINGS, JOBS, RAW_STAT_LABELS, WORK_SHIFT_LABELS_TH } from '../data/thaiData';
import { STORYLET_CATALOG } from '../data/storylets/catalog';
import { DIRECTOR_CONFIG } from '../data/storylets/directorConfig';
import { TRAITS_BY_ID, TURNING_POINTS_BY_KIND } from '../data/traits';
import { UI_TEXT } from '../data/uiText';
import { evaluateAppearanceImpact } from './appearance';
import { buildDayPlan, getHighlightSlot, getSlotActivityLabel } from './dayPlan';
import { getLifeStageForAge } from './lifeStage';
import { resolveSceneWithMeta, SCENES_BY_ID } from './scene';
import { explainStat } from './stats';
import { isTwistPlausible } from './storylet';
import { translateEvidenceKey as translateTraitEvidenceKey } from './traits';
import type { GameState, StoryletCategory } from './types';

export interface ExplainFormulaItem {
  label: string;
  value: string;
  impact: string;
}

export interface ExplainResult {
  targetKey: string;
  titleTh: string;
  summaryBullets: string[];
  formulaBreakdown: ExplainFormulaItem[];
  causalStory?: string;
}

const CATEGORY_LABEL_TH: Record<StoryletCategory, string> = {
  work: 'การงานและการเรียน',
  romance: 'ความรักและความสัมพันธ์',
  family: 'ครอบครัว',
  health: 'สุขภาพ',
  finance: 'การเงิน',
  social: 'สังคมและเพื่อนฝูง',
  quirky: 'สีสันรอบตัว',
  system: 'สรุปจากระบบ',
};

const SOURCE_HINT_TH: Record<string, string> = {
  calendar: 'เหตุการณ์ตามช่วงวัยและจังหวะเวลา',
  consequence: 'ผลสืบเนื่องจากสิ่งที่เคยเลือกหรือทำไว้ก่อนหน้า',
  stat_threshold: 'สภาพร่างกาย จิตใจ หรือการเงินมาถึงจุดเปลี่ยน',
  hazard: 'ความเสี่ยงที่แฝงอยู่ในชีวิตประจำวัน',
  random: 'เรื่องราวที่แวะเวียนเข้ามาตามวิถีชีวิตช่วงนี้',
  general: 'เรื่องราวที่พบได้ตามสภาพแวดล้อมปัจจุบัน',
};

function translateEvidenceKey(key: string): string {
  return translateTraitEvidenceKey(key);
}

export function cleanDisplayReason(raw?: string): string | undefined {
  if (!raw) return undefined;
  let text = raw
    .replace(
      /สะสมพฤติกรรม\s*\(([a-zA-Z0-9_]+)\s*([+-]?[\d.]+)\)/g,
      (_m, key: string, amt: string) => `สะสมนิสัยด้าน${translateEvidenceKey(key)} (${amt})`
    )
    .replace(
      /จุดเปลี่ยนชีวิต\s*\(([a-zA-Z0-9_]+)\)/g,
      (_m, kind: string) =>
        `จุดเปลี่ยนชีวิต: ${TURNING_POINTS_BY_KIND.get(kind)?.titleTh ?? 'เหตุการณ์สำคัญ'}`
    )
    .replace(/ยกเลิกสถานะ\s*\([a-zA-Z0-9_]+\)/g, 'ปรับสถานะชีวิตประจำวัน')
    .replace(
      /หลักฐานสะสม\s*\([^)]*\)\s*[×x*]\s*ตัวคูณช่วงวัย\s*[0-9.]+\s*(?:ผ่านเกณฑ์และสอดคล้องกับบุคลิกภาพ)?/gi,
      'เกิดจากการทำพฤติกรรมลักษณะนี้ซ้ำๆ จนซึมซับเข้ากับบุคลิกภาพในช่วงวัยนี้'
    )
    .replace(/หลักฐานสะสม\s*\([^)]*\)/g, 'พฤติกรรมที่ทำสะสมมาอย่างต่อเนื่อง')
    .replace(/Event Director/g, 'จังหวะชีวิต')
    .replace(/ระบบ Autopilot/g, 'ตัวละครตัดสินใจเอง')
    .replace(/Autopilot/g, 'ตัวละครตัดสินใจเอง')
    .replace(/Standing Orders?/gi, 'หน้าคำสั่งประจำ')
    .replace(/Tension Budget/g, 'จังหวะหนัก-เบาของชีวิตช่วงนี้')
    .replace(/Turning Point Override/gi, 'เหตุการณ์จุดเปลี่ยนชีวิต')
    .replace(/Reputation Hook/gi, 'ภาพจำของคนรอบข้าง')
    .replace(/\bTrait\b/gi, 'นิสัย')
    .replace(/\bStorylet\b/gi, 'เหตุการณ์')
    .replace(/\bDayPlan\b/gi, 'ตารางประจำวัน');
  text = text.replace(/\s*\([a-z0-9_]+=[\d.]+\/[\d.]+\)/gi, '');
  text = text.replace(/\s*\((?:เกณฑ์|ระดับขั้นต่ำ)\s*[^)]*\)/g, '');
  return text.trim();
}

function describeCategoryCause(state: GameState, category: StoryletCategory): string {
  const { character, economy } = state;
  const housingName = HOUSINGS[economy.housingId]?.name ?? 'ที่พัก';

  switch (category) {
    case 'work':
      return character.ageYears < 18
        ? `ช่วงชีวิตวัยเรียนกับกิจวัตรประจำวันของคุณเปิดโอกาสให้เจอเรื่องนี้`
        : `บทบาทการทำงานในฐานะ${economy.jobTitle}และสภาพแวดล้อมที่ทำงานทำให้เจอเรื่องนี้เข้าพอดี`;
    case 'finance':
      return `เงินสดในมือตอนนี้ (${Math.round(economy.cash).toLocaleString('th-TH')} บาท) และพฤติกรรมการใช้จ่ายช่วงที่ผ่านมาพามาถึงจุดนี้`;
    case 'health':
      return `ระดับพลังงาน (${Math.round(character.resources.energy)}/100) ความเครียดสะสม (${Math.round(character.resources.stress)}/100) และการพักผ่อนที่${housingName}ส่งผลต่อร่างกายโดยตรง`;
    case 'family':
      return `สายสัมพันธ์และการอาศัยอยู่กับครอบครัวในวัย ${character.ageYears} ปีทำให้เกิดเรื่องนี้ขึ้น`;
    case 'romance':
      return `จังหวะหัวใจ ความใกล้ชิด และการเข้าสังคมในช่วงวัยนี้พามาเจอกัน`;
    case 'social':
      return `ผู้คนรอบตัวที่ จ.${character.background.province} และการใช้เวลาเข้าสังคมของคุณเปิดทางให้เกิดเรื่องนี้`;
    case 'system':
      return `ระบบประมวลผลจากเป้าหมายและข้อมูลการใช้ชีวิตจริงตลอดรอบปีของคุณ`;
    case 'quirky':
    default:
      return `บรรยากาศรอบตัวใน จ.${character.background.province} และจังหวะชีวิตวันสบายๆ ทำให้พบเรื่องนี้เข้าโดยบังเอิญ`;
  }
}

/**
 * Unified Explain Engine (Phase 3).
 * Answers "ทำไมถึงเกิดเรื่องนี้กับฉัน" and "ทำไมถึงเป็นแบบนี้" in clear, plain Thai without dev jargon.
 */
export function explain(state: GameState, targetKey: string): ExplainResult {
  // === 0a. Phase 3.2.3 Planner & Self-Care Specific Explanations ===
  if (targetKey === 'planner:relock') {
    const reason =
      state.planner?.lastRelockReasonTh ??
      'บางกิจกรรมในตารางจำเป็นต้องมีสถานะหรือเงื่อนไขเฉพาะตัว เมื่อเงื่อนไขนั้นสิ้นสุดลง ตารางจึงปรับเป็นกิจกรรมพื้นฐานที่ทำได้ให้ทันที';
    return {
      targetKey,
      titleTh: 'ทำไมกิจกรรมในตารางจึงถูกล็อกคืน',
      summaryBullets: [
        reason,
        'ระบบสลับเป็นกิจกรรมพื้นฐานที่เหมาะกับช่วงเวลานี้เพื่อไม่ให้ตาราง 168 ชั่วโมงติดขัด',
        'เมื่อเข้าเกณฑ์ใหม่อีกครั้ง คุณสามารถเลือกกลับมาจัดลงตารางได้ตามปกติ',
      ],
      formulaBreakdown: [
        {
          label: 'สถานะกิจกรรมล่าสุด',
          value: 'ปรับเป็นกิจกรรมพื้นฐาน',
          impact: reason,
        },
      ],
      causalStory: reason,
    };
  }

  if (targetKey === 'planner:annualFocus') {
    const focusId = state.planner?.annualFocus?.current ?? 'none';
    const focusDef = ANNUAL_FOCUS_BY_ID.get(focusId) ?? ANNUAL_FOCUS_BY_ID.get('none')!;
    const used = state.planner?.annualFocus?.changesThisYear ?? 0;
    return {
      targetKey,
      titleTh: `เป้าหมายประจำปี: ${focusDef.labelTh}`,
      summaryBullets: [
        focusDef.shortDescTh,
        focusId === 'none'
          ? 'เมื่อเลือกเป้าหมายประจำปี (อายุ 13 ปีขึ้นไป) กิจกรรมในตารางที่ตรงสายจะช่วยให้คุณสะสมบุคลิกและนิสัยด้านนั้นได้เร็วขึ้น +10%'
          : 'กิจกรรมในตารางรายสัปดาห์ที่ตรงกับเป้าหมายนี้กำลังช่วยเสริมนิสัยและความเคยชินด้านนี้เพิ่มขึ้น +10% (รวมงานโอทีและงานเสริมเมื่อเน้นเก็บเงิน)',
        `เปลี่ยนเป้าหมายได้ไม่เกินปีละ 2 ครั้ง (ใช้ไปแล้ว ${used}/2 ครั้งในปีนี้)`,
      ],
      formulaBreakdown: [
        {
          label: 'เป้าหมายที่เลือก',
          value: focusDef.labelTh,
          impact: focusId === 'none' ? 'ยังไม่ได้เน้นด้านใดเป็นพิเศษ' : 'กิจกรรมที่สอดคล้องจะบ่มเพาะนิสัยเร็วขึ้น +10%',
        },
      ],
      causalStory:
        focusId === 'none'
          ? 'คุณยังไม่ได้ระบุเป้าหมายประจำปี จึงใช้ชีวิตตามปกติโดยไม่มีแรงส่งเสริมเฉพาะทาง'
          : `คุณตั้งใจโฟกัส "${focusDef.labelTh}" ในปีนี้ การทำกิจกรรมที่ตรงกับเป้าหมายจึงค่อยๆ หล่อหลอมตัวตนได้ชัดขึ้น`,
    };
  }

  if (targetKey === 'autopilot:selfCare') {
    const sc = state.standingOrders?.selfCare;
    const pausedFlags = sc?.pausedByLowCash ?? {};
    const pausedLabels: string[] = [];
    if (pausedFlags.healthCheckup) pausedLabels.push('ตรวจสุขภาพประจำปี');
    if (pausedFlags.grooming) pausedLabels.push('ดูแลบุคลิกและสีผมรายเดือน');
    if (pausedFlags.familyRemittance) pausedLabels.push('ส่งเงินดูแลครอบครัวรายเดือน');
    const reserveFloor = state.standingOrders?.financial.lowCashThreshold ?? 3000;
    return {
      targetKey,
      titleTh: 'คำสั่งประจำดูแลตัวเองและครอบครัว',
      summaryBullets: [
        pausedLabels.length > 0
          ? `รายการที่พักชั่วคราว: ${pausedLabels.join(', ')} เพราะเงินสดหลังหักจะต่ำกว่าเงินสำรองฉุกเฉิน (${reserveFloor.toLocaleString('th-TH')} บาท)`
          : 'รายการที่เปิดไว้ทั้งหมดทำงานตามรอบเดือนและวันเกิดโดยอัตโนมัติ',
        sc?.healthCheckupPackage && sc.healthCheckupPackage !== 'off'
          ? `แผนตรวจสุขภาพปัจจุบัน: ${SELF_CARE_ORDER_CONFIG.healthCheckup.packages[sc.healthCheckupPackage].labelTh}`
          : 'ยังไม่ได้ตั้งตรวจสุขภาพประจำปี (เปิดได้ตั้งแต่อายุ 18 ปี)',
        'เมื่อเงินสดกลับมาสูงกว่าเกณฑ์สำรองที่ตั้งไว้ ระบบจะกลับมาทำงานให้อัตโนมัติโดยไม่ต้องตั้งค่าใหม่',
      ],
      formulaBreakdown: [
        {
          label: 'เงินสำรองกันฉุกเฉิน',
          value: `${reserveFloor.toLocaleString('th-TH')} บาท`,
          impact: pausedLabels.length > 0 ? 'กำลังพักรายการดูแลตัวเองเพื่อรักษาเงินสดสำรอง' : 'เงินสดเพียงพอสำหรับคำสั่งดูแลตัวเองทั้งหมด',
        },
      ],
      causalStory:
        pausedLabels.length > 0
          ? `เพื่อไม่ให้เงินสดขาดมือ ระบบจึงพัก${pausedLabels.join(' และ ')}ไว้ชั่วคราวจนกว่าฐานะการเงินจะคล่องตัวขึ้น`
          : 'คำสั่งดูแลตัวเองช่วยรักษาร่างกาย บุคลิกภาพ และความสัมพันธ์ในครอบครัวอย่างสม่ำเสมอโดยไม่กระทบเงินสำรอง',
    };
  }

  // === 0. Pending Autopilot Situation Explanation ===
  if (targetKey.startsWith('autopilot:')) {
    const sit = state.pendingAutopilotSituation;
    const title = sit?.title ?? 'เรื่องที่ต้องตัดสินใจ';
    const stageDef = getLifeStageForAge(state.character.ageYears);
    return {
      targetKey,
      titleTh: `ที่มาของเหตุการณ์: ${title}`,
      summaryBullets: [
        `เรื่องนี้แวะเข้ามาหา${state.character.firstName} ในช่วงอายุ ${state.character.ageYears} ปี (${stageDef.labelTh})`,
        sit?.description ?? 'สถานการณ์ประจำเดือนที่เข้ามาทดสอบแนวทางการใช้ชีวิตและวินัยการเงินของคุณ',
        'ระบบหยุดถามคุณโดยตรงเพราะยังไม่มีคำสั่งตัดสินใจอัตโนมัติสำหรับเรื่องนี้ หรือตั้งค่าไว้ว่าให้ถามคุณก่อนเสมอ',
      ],
      formulaBreakdown: [
        {
          label: 'จังหวะที่เกิดเรื่อง',
          value: `อายุ ${state.character.ageYears} ปี`,
          impact: 'เรื่องแวะเวียนเข้ามาตามรอบเดือนของวัยทำงานและวัยรุ่นตอนปลาย',
        },
        {
          label: 'เหตุผลที่เกมหยุดถามคุณ',
          value: 'ต้องการคำตอบจากผู้เล่น',
          impact: 'คุณสามารถตั้งค่าแนวทางเลือกได้ในหน้าคำสั่งประจำ',
        },
      ],
      causalStory:
        'เหตุการณ์ลักษณะนี้จะสุ่มแวะเข้ามาตามจังหวะชีวิตในแต่ละเดือน และจะหยุดถามเมื่อเป็นเรื่องที่คุณเลือกให้ถามตัวเองก่อนเสมอ',
    };
  }

  // === 0b. DayPlan Slot & Scene Fallback Explanation ===
  if (targetKey.startsWith('dayplan:')) {
    const match = /^dayplan:slot:([0-3])$/.exec(targetKey);
    const plan = buildDayPlan(state, state.settings);
    const slotIdx = (match ? Number(match[1]) : getHighlightSlot(plan).index) as 0 | 1 | 2 | 3;
    const resolved = resolveSceneWithMeta(state, {
      settings: state.settings,
      slotIndex: slotIdx,
    });
    const slot = resolved.slot;
    const daypartTh = UI_TEXT.DAYPARTS[resolved.daypart];
    const sceneName = SCENES_BY_ID.get(resolved.sceneId)?.nameTh ?? resolved.sceneId;
    const activityLabel = getSlotActivityLabel(slot, state);
    const fromId = resolved.fallbackFrom ?? slot.fallbackFrom;
    const fromReason = resolved.fallbackReason ?? slot.fallbackReason;
    const fromName = fromId ? (SCENES_BY_ID.get(fromId)?.nameTh ?? fromId) : undefined;
    const minPubAge = state.settings?.pubVisitAge ?? 20;
    const jobTitle = JOBS[state.economy.jobId]?.title ?? state.economy.jobTitle;

    const summaryBullets: string[] = [];
    if (fromName) {
      if (fromReason === 'underage' || fromReason === 'nightlife_age') {
        summaryBullets.push(
          `เดิมช่วง${daypartTh}วางแผนจะไป${fromName} แต่ตอนนี้อายุ ${state.character.ageYears} ปี ยังไม่ผ่านเกณฑ์อายุเข้าใช้บริการ (${state.character.ageYears < 18 ? 'ล็อกผู้เยาว์ต่ำกว่า 18 ปี' : `ตั้งค่าขั้นต่ำไว้ ${minPubAge} ปี`})`
        );
      } else {
        summaryBullets.push(
          `เดิมช่วง${daypartTh}ตั้งใจจะไป${fromName} แต่สถานที่ปิดให้บริการในช่วง${daypartTh} ระบบจึงพาย้อนมาที่${sceneName}แทน`
        );
      }
    } else {
      summaryBullets.push(
        `ช่วง${daypartTh}วันนี้${state.character.firstName}กำลัง${activityLabel}อยู่ที่${sceneName}`
      );
    }

    const activeLifestyleLabel =
      state.lifestylePresetId === 'custom'
        ? UI_TEXT.LIFESTYLE.customLabel
        : (LIFESTYLE_PRESETS_BY_ID.get(state.lifestylePresetId ?? 'balanced')?.nameTh ?? 'สมดุล');

    const empShiftText =
      state.employment?.status === 'employed'
        ? ` · ${WORK_SHIFT_LABELS_TH[state.employment.workShift]}`
        : '';

    summaryBullets.push(
      `บทบาทตอนนี้คือ "${jobTitle}"${empShiftText} ในแนวทาง "${activeLifestyleLabel}"`
    );

    if (slot.isHolidayOverride) {
      summaryBullets.push(
        'วันนี้เป็นวันหยุดหรือช่วงปิดเทอม จึงใช้กิจกรรมจากช่องวันหยุดในตารางแผนชีวิตแทนตารางเรียนหรือทำงานปกติ'
      );
    }

    const costFallbackReason = state.planner?.lastCostFallbackReasonTh;
    if (costFallbackReason) {
      summaryBullets.push(costFallbackReason);
    }

    const formulaBreakdown: ExplainFormulaItem[] = [
      {
        label: `กิจกรรมช่วง${daypartTh}`,
        value: activityLabel,
        impact: slot.isHolidayOverride
          ? 'อ้างอิงจากตารางวันหยุด (วันหยุดราชการ/ปิดเทอม)'
          : `อ้างอิงจากตารางแผนชีวิต ช่องที่ ${slotIdx + 1}`,
      },
      {
        label: 'สถานที่ปัจจุบัน',
        value: sceneName,
        impact: fromName ? `สลับมาจาก ${fromName}` : 'เปิดให้บริการตรงช่วงเวลาและเข้าเกณฑ์อายุ',
      },
    ];

    if (costFallbackReason) {
      formulaBreakdown.push({
        label: 'การคุมงบรายสัปดาห์',
        value: 'สลับเป็นกิจกรรมฟรี',
        impact: costFallbackReason,
      });
    }

    if (fromName) {
      formulaBreakdown.push({
        label: 'สาเหตุที่ไม่ได้อยู่สถานที่แรก',
        value: fromName,
        impact:
          fromReason === 'underage'
            ? 'เยาวชนอายุต่ำกว่า 18 ปี ห้ามเข้าสถานบันเทิง'
            : fromReason === 'nightlife_age'
              ? `อายุยังไม่ถึงเกณฑ์ ${minPubAge} ปี`
              : `ปิดทำการในช่วง${daypartTh} จึงถอยมายังฉากสำรอง/บ้าน`,
      });
    }

    return {
      targetKey,
      titleTh: `ช่วง${daypartTh}: ${activityLabel} · ${sceneName}`,
      summaryBullets: summaryBullets.slice(0, 4),
      formulaBreakdown,
      causalStory: costFallbackReason
        ? `${costFallbackReason} จึงจัดกิจกรรม "${activityLabel}" ที่ "${sceneName}" แทนในสัปดาห์นี้`
        : fromName
          ? `สถานที่ "${fromName}" ไม่พร้อมเข้าใช้บริการในช่วง${daypartTh} ระบบจึงเลือก "${sceneName}" ที่เปิดอยู่และเหมาะสมที่สุดให้แทน`
          : `ตารางแผนชีวิตจัดกิจกรรม "${activityLabel}" ลงในช่วง${daypartTh} โดยเลือกฉาก "${sceneName}" ตามบทบาทและกิจกรรมที่วางไว้`,
    };
  }

  // === 1. Storylet / Timeline Event: event:<storyletId> or timeline:<entryId> ===
  if (targetKey.startsWith('event:') || targetKey.startsWith('timeline:')) {
    let storyletId = '';
    let timelineEntry = undefined;

    if (targetKey.startsWith('timeline:')) {
      const entryId = targetKey.replace(/^timeline:/, '');
      timelineEntry = state.timeline.find((e) => e.id === entryId);
      storyletId = timelineEntry?.storyletId ?? '';
    } else {
      storyletId = targetKey.replace(/^event:/, '');
      timelineEntry = [...state.timeline]
        .reverse()
        .find((e) => e.storyletId === storyletId);
    }

    const storylet = STORYLET_CATALOG.find((s) => s.id === storyletId);
    const matchingPrompt =
      state.pendingPrompt?.storyletId === storyletId ? state.pendingPrompt : undefined;

    const title = storylet?.title ?? matchingPrompt?.title ?? timelineEntry?.title ?? 'เหตุการณ์ชีวิต';
    const summaryBullets: string[] = [];
    const formulaBreakdown: ExplainFormulaItem[] = [];
    const { character, economy } = state;
    const stageDef = getLifeStageForAge(character.ageYears);
    const housingName = HOUSINGS[economy.housingId]?.name ?? 'ที่พักปัจจุบัน';

    // Bullet 1: Who & when & context
    summaryBullets.push(
      `เกิดขึ้นกับ${character.firstName} ตอนอายุ ${character.ageYears} ปี (${stageDef.labelTh}) ขณะพักอยู่ที่${housingName}`
    );

    const rawReason =
      matchingPrompt?.directorReason ??
      timelineEntry?.explainReason ??
      (state.activeToast?.storyletId === storyletId ? state.activeToast.explainReason : undefined);
    const directorReason = cleanDisplayReason(rawReason);

    if (storylet) {
      const cond = storylet.conditions;

      // Bullet 2: Clear cause
      if (directorReason) {
        summaryBullets.push(directorReason);
      } else if (cond?.requireDyedOrFlashyHair) {
        const impact = evaluateAppearanceImpact(character);
        summaryBullets.push(
          `สไตล์การแต่งตัวและสีผมที่โดดเด่นของคุณ (${impact.activeStyleLabelTh}) ดึงดูดความสนใจและทำให้เกิดสถานการณ์นี้`
        );
      } else if (cond?.minStats && (cond.minStats.charisma !== undefined || cond.minStats.looks !== undefined)) {
        summaryBullets.push(
          'บุคลิกภาพ รูปลักษณ์ และเสน่ห์การพูดที่โดดเด่นของคุณเข้าตาคนรอบข้างจนเปิดโอกาสนี้ขึ้นมา'
        );
      } else if (cond?.maxStats && cond.maxStats.charisma !== undefined) {
        summaryBullets.push(
          'ความไม่คล่องตัวในการพูดคุยและเข้าสังคมช่วงนี้ทำให้เจอสถานการณ์ติดขัดนี้เข้า'
        );
      } else if (cond?.requiredEvidence && Object.keys(cond.requiredEvidence).length > 0) {
        const habits = Object.keys(cond.requiredEvidence).map(translateEvidenceKey).join(' และ ');
        summaryBullets.push(`เกิดจากพฤติกรรมสะสมของคุณที่ผ่านมา โดยเฉพาะด้าน${habits}`);
      } else if (cond?.requiredTraits && cond.requiredTraits.length > 0) {
        const traitNames = cond.requiredTraits
          .map((id) => TRAITS_BY_ID.get(id)?.nameTh ?? id)
          .join(' และ ');
        summaryBullets.push(`นิสัยส่วนตัว (${traitNames}) ทำให้คุณดึงดูดและพาตัวเองมาเจอสถานการณ์นี้`);
      } else {
        summaryBullets.push(describeCategoryCause(state, storylet.category));
      }

      // Bullet 3: Consequence or trait filter or foreshadow
      if (matchingPrompt?.hiddenBlockedReasons && matchingPrompt.hiddenBlockedReasons.length > 0) {
        summaryBullets.push(matchingPrompt.hiddenBlockedReasons[0]);
      } else if (timelineEntry?.effectsSummary && timelineEntry.effectsSummary.length > 0) {
        const cleanedSummary = timelineEntry.effectsSummary
          .map((item) => cleanDisplayReason(item) ?? item)
          .join(', ');
        summaryBullets.push(`ผลที่ตามมา: ${cleanedSummary}`);
      } else if (storylet.isNegative && !storylet.isSuddenHazard && storylet.foreshadowTitle) {
        summaryBullets.push(`ก่อนหน้านี้มีสัญญาณเตือนมาก่อนแล้ว ("${storylet.foreshadowTitle}") ไม่ใช่เรื่องที่อยู่ๆ ก็โผล่มาแบบไร้ที่มา`);
      } else if (storylet.tier === 'T3') {
        summaryBullets.push('ถือเป็นจุดเปลี่ยนสำคัญของชีวิต เกมจึงลดความเร็วลงเหลือ x1 เพื่อให้คุณตัดสินใจด้วยตัวเอง');
      } else if (storylet.tier === 'T2') {
        summaryBullets.push('เป็นเหตุการณ์ที่ให้คุณเลือกทางออกเอง หากปล่อยผ่านครบ 14 วัน ตัวละครจะเลือกตามนิสัยให้');
      }

      const tierMeaning: Record<string, { label: string; desc: string }> = {
        T3: { label: 'จุดเปลี่ยนสำคัญของชีวิต', desc: 'ส่งผลระยะยาวและต้องตัดสินใจด้วยตัวเอง' },
        T2: { label: 'เหตุการณ์ชวนตัดสินใจ', desc: 'มีหลายทางเลือกให้กำหนดทิศทางเอง' },
        T1: { label: 'เรื่องราวระหว่างวัน', desc: 'เกิดขึ้นแล้วส่งผลกับชีวิตทันทีโดยไม่ขัดจังหวะ' },
        T0: { label: 'สีสันในชีวิตประจำวัน', desc: 'บันทึกเก็บเป็นความทรงจำเล็กๆ ของช่วงวัย' },
      };
      const tierInfo = tierMeaning[storylet.tier] ?? tierMeaning.T0;

      formulaBreakdown.push({
        label: `หมวด: ${CATEGORY_LABEL_TH[storylet.category]}`,
        value: tierInfo.label,
        impact: tierInfo.desc,
      });

      formulaBreakdown.push({
        label: 'จุดเริ่มต้นของเรื่อง',
        value: SOURCE_HINT_TH[storylet.sourceHint ?? 'general'] ?? 'จังหวะชีวิตในขณะนั้น',
        impact:
          storylet.sourceHint === 'consequence'
            ? 'เชื่อมโยงจากทางเลือกของคุณก่อนหน้า'
            : 'เกิดได้สอดคล้องกับสภาพชีวิตตอนนี้',
      });

      if (cond?.minAge !== undefined || cond?.maxAge !== undefined) {
        formulaBreakdown.push({
          label: 'ช่วงวัยที่สอดคล้อง',
          value: `${cond.minAge ?? 0}–${cond.maxAge ?? 100} ปี`,
          impact: `ตอนนี้อายุ ${character.ageYears} ปี เข้าเกณฑ์พอดี`,
        });
      }

      if (cond?.housingIds && cond.housingIds.length > 0) {
        const names = cond.housingIds.map((h) => HOUSINGS[h]?.name ?? h).join(', ');
        formulaBreakdown.push({
          label: 'บริบทที่อยู่อาศัย',
          value: housingName,
          impact: `เรื่องนี้เกิดเมื่ออาศัยอยู่ใน ${names}`,
        });
      }

      if (cond?.minCash !== undefined || cond?.maxCash !== undefined) {
        formulaBreakdown.push({
          label: 'สภาพการเงินในขณะนั้น',
          value: `มีเงินสด ${Math.round(economy.cash).toLocaleString('th-TH')} บาท`,
          impact:
            cond.maxCash !== undefined && economy.cash <= cond.maxCash
              ? 'เงินในมือตึงตัวพอดีกับเงื่อนไขเรื่องนี้'
              : 'สถานะการเงินเอื้อให้เกิดสถานการณ์นี้',
        });
      }

      if (cond?.requiredTraits && cond.requiredTraits.length > 0) {
        const names = cond.requiredTraits.map((id) => TRAITS_BY_ID.get(id)?.nameTh ?? id);
        formulaBreakdown.push({
          label: 'นิสัยที่ชักนำเรื่องนี้เข้ามา',
          value: names.join(', '),
          impact: 'นิสัยติดตัวของคุณเปิดโอกาสให้เรื่องนี้เกิด',
        });
      }

      if (cond?.requiredEvidence) {
        const evPairs = Object.keys(cond.requiredEvidence)
          .map((k) => `${translateEvidenceKey(k)}`)
          .join(', ');
        formulaBreakdown.push({
          label: 'พฤติกรรมที่สะสมมา',
          value: evPairs,
          impact: 'ทำสะสมต่อเนื่องจนส่งผลเป็นเหตุการณ์นี้',
        });
      }

      if (cond?.requireDyedOrFlashyHair) {
        const impact = evaluateAppearanceImpact(character);
        formulaBreakdown.push({
          label: 'สีผมและสไตล์การแต่งตัว',
          value: impact.activeStyleLabelTh,
          impact: 'ลุคที่โดดเด่นสะดุดตามีผลต่อปฏิกิริยาของผู้คนและสายงาน',
        });
      }

      if (cond?.minStats) {
        for (const [k, minVal] of Object.entries(cond.minStats)) {
          if (minVal === undefined) continue;
          const rawMeta = RAW_STAT_LABELS[k as keyof typeof RAW_STAT_LABELS];
          if (rawMeta) {
            formulaBreakdown.push({
              label: `บุคลิกเด่นด้าน${rawMeta.label}`,
              value: 'โดดเด่นเข้าตาคนรอบข้าง',
              impact: 'ระดับพื้นฐานส่วนตัวที่สูงพอเปิดโอกาสพิเศษนี้ให้เข้ามา',
            });
          }
        }
      }

      if (cond?.maxStats) {
        for (const [k, maxVal] of Object.entries(cond.maxStats)) {
          if (maxVal === undefined) continue;
          const rawMeta = RAW_STAT_LABELS[k as keyof typeof RAW_STAT_LABELS];
          if (rawMeta) {
            formulaBreakdown.push({
              label: `จุดที่ยังต้องฝึกเพิ่มด้าน${rawMeta.label}`,
              value: 'ยังไม่คล่องตัวนักในด้านนี้',
              impact: 'ความไม่ถนัดด้านนี้เปิดทางให้เกิดเหตุการณ์ท้าทายนี้เข้ามา',
            });
          }
        }
      }

      if (storylet.isNegative && !storylet.isSuddenHazard && storylet.foreshadowTitle) {
        formulaBreakdown.push({
          label: 'สัญญาณเตือนล่วงหน้า',
          value: storylet.foreshadowTitle,
          impact: `เตือนก่อนเกิดจริงประมาณ ${DIRECTOR_CONFIG.foreshadowLeadDays} วัน`,
        });
      }

      if (storylet.isTwist) {
        const plaus = isTwistPlausible(storylet, state);
        formulaBreakdown.push({
          label: 'ทำไมเรื่องพลิกผันแบบนี้ถึงเกิดได้',
          value: plaus.plausible ? 'สมเหตุสมผลกับชีวิตช่วงนี้' : 'จังหวะพลิกผันหายาก',
          impact: plaus.reasonTh,
        });
      }

      if (matchingPrompt?.hiddenBlockedReasons) {
        for (const hiddenReason of matchingPrompt.hiddenBlockedReasons) {
          formulaBreakdown.push({
            label: 'ทำไมบางทางเลือกจึงถูกซ่อน',
            value: 'ติดข้อจำกัดของนิสัย',
            impact: hiddenReason,
          });
        }
      }
    } else {
      // Non-storylet timeline entry (birthday, hospital discharge, trait formed, routine/autopilot decision)
      if (directorReason) {
        summaryBullets.push(directorReason);
      } else if (timelineEntry?.description) {
        summaryBullets.push(cleanDisplayReason(timelineEntry.description) ?? timelineEntry.description);
      } else {
        summaryBullets.push('เกิดขึ้นตามลำดับชีวิต การเติบโต และกิจวัตรที่คุณวางไว้ในช่วงเวลานั้น');
      }

      if (timelineEntry?.effectsSummary && timelineEntry.effectsSummary.length > 0) {
        const cleanedSummary = timelineEntry.effectsSummary
          .map((item) => cleanDisplayReason(item) ?? item)
          .join(', ');
        summaryBullets.push(`ผลที่เกิดขึ้น: ${cleanedSummary}`);
      }

      formulaBreakdown.push({
        label: 'ที่มาของบันทึกนี้',
        value: timelineEntry?.category === 'milestone' ? 'ก้าวสำคัญตามเวลาชีวิต' : 'เหตุการณ์จากกิจวัตรและการตัดสินใจ',
        impact: directorReason ?? 'เกิดขึ้นสอดคล้องกับสถานะและช่วงวัยในขณะนั้น',
      });
    }

    const dirBudget = Math.round(
      state.directorState?.tensionBudget ?? DIRECTOR_CONFIG.tensionBudget.start
    );
    const paceStatus =
      dirBudget >= 80
        ? 'กำลังนิ่งสบาย'
        : dirBudget >= 40
          ? 'สมดุลกำลังดี'
          : 'เพิ่งผ่านเรื่องหนัก';
    const paceLabel =
      dirBudget >= 80
        ? 'ชีวิตช่วงนี้ค่อนข้างนิ่ง พร้อมรับเรื่องราวใหม่ๆ'
        : dirBudget >= 40
          ? 'จังหวะชีวิตกำลังพอดี ไม่หนักหน่วงเกินไป'
          : 'ช่วงนี้เพิ่งผ่านเรื่องหนักมา จังหวะเรื่องเครียดจึงผ่อนลงให้';

    formulaBreakdown.push({
      label: 'จังหวะชีวิตช่วงนี้',
      value: paceStatus,
      impact: paceLabel,
    });

    const causalStory =
      directorReason ??
      (storylet
        ? `${describeCategoryCause(state, storylet.category)} จึงนำไปสู่เรื่อง "${title}" ในช่วงอายุ ${character.ageYears} ปี`
        : `บันทึก "${title}" เกิดขึ้นตามพัฒนาการของชีวิตและกิจวัตรที่คุณเลือกในช่วงอายุ ${character.ageYears} ปี`);

    return {
      targetKey,
      titleTh: `ที่มาของเหตุการณ์: ${title}`,
      summaryBullets: summaryBullets.slice(0, 3),
      formulaBreakdown,
      causalStory,
    };
  }

  // === 2. Stats / Traits / Action Locks via explainStat ===
  const statInfo = explainStat(state, targetKey);
  const summaryBullets: string[] = [];
  const formulaBreakdown: ExplainFormulaItem[] = [];

  if (targetKey.startsWith('trait:')) {
    summaryBullets.push(statInfo.formulaText);
    for (const c of statInfo.components) {
      if (c.label.startsWith('หลักฐาน:') || c.label.startsWith('แนวทางฟื้นฟู')) {
        summaryBullets.push(c.label);
      }
    }
  } else if (targetKey.startsWith('action_lock:')) {
    summaryBullets.push(statInfo.formulaText);
    if (statInfo.components[0]?.label) {
      summaryBullets.push(statInfo.components[0].label);
    }
  } else if (targetKey === 'innerTension') {
    summaryBullets.push(statInfo.formulaText);
    for (const c of statInfo.components.slice(0, 2)) {
      summaryBullets.push(c.label);
    }
  } else {
    const sorted = [...statInfo.components].sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
    );
    const topPos = sorted.find((c) => c.contribution > 0);
    const topNeg = sorted.find((c) => c.contribution < 0);
    if (topPos) {
      summaryBullets.push(`ตัวช่วยหลักที่ทำให้คะแนนดี: ${topPos.label}`);
    }
    if (topNeg) {
      summaryBullets.push(`ปัจจัยที่ดึงคะแนนลงช่วงนี้: ${topNeg.label}`);
    }
    if (statInfo.recentLogs.length > 0) {
      summaryBullets.push(`เรื่องที่เพิ่งส่งผลล่าสุด: ${cleanDisplayReason(statInfo.recentLogs[0].reason) ?? statInfo.recentLogs[0].reason}`);
    }
  }

  if (summaryBullets.length === 0) {
    summaryBullets.push('ค่านี้เปลี่ยนแปลงตามการใช้ชีวิตประจำวัน การพักผ่อน และเหตุการณ์ที่พบเจอ');
    summaryBullets.push(`ระดับปัจจุบันอยู่ที่ ${statInfo.currentValue.toLocaleString('th-TH')}`);
  }

  for (const c of statInfo.components) {
    const impactText =
      c.contribution > 0
        ? `ช่วยเพิ่ม +${c.contribution}`
        : c.contribution < 0
          ? `ดึงลง ${c.contribution}`
          : 'ทรงตัว (0)';
    formulaBreakdown.push({
      label: c.label,
      value:
        typeof c.value === 'number'
          ? `ระดับ ${c.value.toLocaleString('th-TH')}`
          : String(c.value),
      impact: impactText,
    });
  }

  return {
    targetKey,
    titleTh: `ที่มาของ: ${statInfo.title}`,
    summaryBullets: summaryBullets.slice(0, 3),
    formulaBreakdown,
    causalStory: statInfo.formulaText,
  };
}
