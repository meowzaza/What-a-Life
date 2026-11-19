import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ACTIVITIES_BY_ID,
  ACTIVITY_CATALOG,
  ACTIVITY_GROUPS_BY_ID,
  ACTIVITY_MAJOR_GROUPS,
  type ActivityDef,
} from '../../data/activities';
import { ANNUAL_FOCUS_BY_ID, ANNUAL_FOCUS_LIST } from '../../data/annualFocus';
import { AGE_LEGAL_RULES } from '../../data/lifeStages';
import { LIFESTYLE_PRESETS, LIFESTYLE_PRESETS_BY_ID } from '../../data/lifestylePresets';
import { ACTIVITY_SKILL_TAGS } from '../../data/skills';
import {
  ALL_SLOTS,
  DAY_TYPE_WEIGHTS,
  SLOT_HOURS,
} from '../../data/slotHours';
import { JOBS, SKILL_LABELS } from '../../data/thaiData';
import { WORK_SHIFT_LABELS_TH } from '../../data/thaiData';
import { UI_TEXT } from '../../data/uiText';
import {
  applyPresetTemplate,
  canChangeAnnualFocus,
  clonePlannerGrid,
  computeOvertimeHourlyRate,
  countFreelanceSlots,
  countOvertimeSlots,
  createInitialPlannerState,
  formatImpactArrowLabel,
  getSlotChainInfo,
  getSlotWeeklyHours,
  getYearlyCalendarEvents,
  hasDownwardChainConnector,
  isActivityAvailableInSlot,
  isHospitalAdmitted,
  isNightChainedByEveningOT,
  isPresetAvailableForPlanner,
  isSlotLocked,
  previewPlannerImpact,
  resolveEffectiveSlotActivityId,
  resolveEmploymentState,
} from '../../engine/planner';
import { getSkillGrowthDetails } from '../../engine/skillTraining';
import type {
  ActivityId,
  ActivityMajorGroup,
  ActivitySkillTagId,
  DayType,
  GameState,
  LifestylePresetId,
  PlannerGrid,
  PlayerAction,
  Slot,
} from '../../engine/types';
import { PixelIcon } from '../art/PixelIcons';
import { TimeAllocPanel } from './TimeAllocPanel';

interface LifePlannerPanelProps {
  state: GameState;
  onDispatch: (action: PlayerAction) => void;
  onSelectExplain?: (targetKey: string) => void;
}

type PlannerViewTab = 'weekly' | 'yearly';

function gridsEqualForState(a: PlannerGrid, b: PlannerGrid, state: GameState): boolean {
  for (const dt of ['weekday', 'weekend'] as const) {
    for (const slot of ALL_SLOTS) {
      const actA = resolveEffectiveSlotActivityId(a, dt, slot, state);
      const actB = resolveEffectiveSlotActivityId(b, dt, slot, state);
      if (actA !== actB) return false;
    }
  }
  return true;
}

export function LifePlannerPanel({
  state,
  onDispatch,
  onSelectExplain,
}: LifePlannerPanelProps) {
  const { character, economy } = state;
  const currentJob = JOBS[economy.jobId] ?? JOBS.unemployed;
  const hospitalized = isHospitalAdmitted(state);

  const activeBaseGrid = useMemo<PlannerGrid>(() => {
    const source = state.planner?.pendingGrid ?? state.planner?.grid;
    return source ? clonePlannerGrid(source) : createInitialPlannerState(state).grid;
  }, [state]);

  const activeBasePreset: LifestylePresetId | 'custom' =
    state.planner?.pendingPresetId ??
    state.planner?.presetId ??
    state.lifestylePresetId ??
    'balanced';

  const [viewTab, setViewTab] = useState<PlannerViewTab>('weekly');
  const [draftGrid, setDraftGrid] = useState<PlannerGrid>(() => clonePlannerGrid(activeBaseGrid));
  const [draftPresetId, setDraftPresetId] = useState<LifestylePresetId | 'custom'>(activeBasePreset);
  const [pickerTarget, setPickerTarget] = useState<{ dayType: DayType; slot: Slot } | null>(null);
  const [pickerGroup, setPickerGroup] = useState<ActivityMajorGroup>('self_dev');
  const [showHours, setShowHours] = useState(false);
  const [pinMonth, setPinMonth] = useState<number>(state.date.month);
  const [pinDay, setPinDay] = useState<number>(state.date.day);
  const [pinTitle, setPinTitle] = useState<string>('');
  const [pinNote, setPinNote] = useState<string>('');
  const pickerListRef = useRef<HTMLDivElement | null>(null);

  // Sync draft when committed/pending planner changes externally (e.g. confirm, job change, work shift, birthday)
  useEffect(() => {
    setDraftGrid(clonePlannerGrid(activeBaseGrid));
    setDraftPresetId(activeBasePreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.planner?.grid, state.planner?.pendingGrid, state.economy.jobId, state.character.ageYears, state.employment?.workShift]);

  // Lock background page scroll and support Escape key while activity picker modal is open
  useEffect(() => {
    if (!pickerTarget) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPickerTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pickerTarget]);

  // Reset activity list scroll to top when switching group or opening another slot
  useEffect(() => {
    if (pickerListRef.current) {
      pickerListRef.current.scrollTop = 0;
    }
  }, [pickerGroup, pickerTarget]);

  const isDirty = !gridsEqualForState(draftGrid, activeBaseGrid, state);
  const hasPendingTomorrow = Boolean(state.planner?.pendingGrid);
  const preview = useMemo(() => previewPlannerImpact(draftGrid, state), [draftGrid, state]);
  const otHourlyRate = useMemo(() => computeOvertimeHourlyRate(state), [state]);
  const emp = useMemo(() => resolveEmploymentState(state), [state]);

  const handleApplyPresetToDraft = (presetId: LifestylePresetId) => {
    const res = applyPresetTemplate(presetId, state);
    if (!res.accepted) return;
    setDraftGrid(res.grid);
    setDraftPresetId(presetId);
  };

  const handleOpenPicker = (dayType: DayType, slot: Slot) => {
    if (!character.isAlive) return;
    if (isSlotLocked(dayType, slot, state).locked) return;
    if (isNightChainedByEveningOT(draftGrid, dayType, slot, state)) return;
    const curActId = resolveEffectiveSlotActivityId(draftGrid, dayType, slot, state);
    const curAct = ACTIVITIES_BY_ID.get(curActId);
    setPickerGroup(curAct?.majorGroup ?? 'self_dev');
    setPickerTarget({ dayType, slot });
  };

  const handlePickActivity = (actId: ActivityId) => {
    if (!pickerTarget) return;
    const next = clonePlannerGrid(draftGrid);
    next[pickerTarget.dayType][pickerTarget.slot] = actId;
    if (
      pickerTarget.dayType === 'weekday' &&
      pickerTarget.slot === 'evening' &&
      actId === 'overtime_work' &&
      !isSlotLocked('weekday', 'night', state).locked
    ) {
      next.weekday.night = 'sleep_normal';
    }
    setDraftGrid(next);
    setDraftPresetId('custom');
    setPickerTarget(null);
  };

  const handleConfirmPlan = () => {
    if (!isDirty || !preview.validation.valid || !character.isAlive) return;
    onDispatch({
      type: 'CONFIRM_LIFE_PLANNER',
      grid: draftGrid,
      presetId: draftPresetId,
    });
  };

  const handleDiscardDraft = () => {
    setDraftGrid(clonePlannerGrid(activeBaseGrid));
    setDraftPresetId(activeBasePreset);
  };

  // Picker visible activities grouped cleanly
  const pickerEntries = useMemo(() => {
    if (!pickerTarget) return [] as Array<{ act: ActivityDef; avail: ReturnType<typeof isActivityAvailableInSlot> }>;
    return ACTIVITY_CATALOG.filter((a) => a.majorGroup === pickerGroup)
      .map((act) => ({
        act,
        avail: isActivityAvailableInSlot(act.id, pickerTarget.dayType, pickerTarget.slot, state),
      }))
      .filter((item) => item.avail.visible);
  }, [pickerTarget, pickerGroup, state]);

  const visibleGroupsForSlot = useMemo(() => {
    if (!pickerTarget) return ACTIVITY_MAJOR_GROUPS;
    return ACTIVITY_MAJOR_GROUPS.filter((g) =>
      ACTIVITY_CATALOG.some(
        (a) =>
          a.majorGroup === g.id &&
          isActivityAvailableInSlot(a.id, pickerTarget.dayType, pickerTarget.slot, state).visible
      )
    );
  }, [pickerTarget, state]);

  // Focused skill cap warning helper inside activity picker
  const focusedSkillsDetails = useMemo(
    () =>
      (state.skillTraining?.focus ?? []).map((sk) => ({
        skillId: sk,
        labelTh: SKILL_LABELS[sk]?.label ?? sk,
        details: getSkillGrowthDetails(state, sk),
      })),
    [state]
  );

  const energyFmt = formatImpactArrowLabel(preview.energyArrow);
  const stressFmt = formatImpactArrowLabel(preview.stressArrow, true);
  const relFmt = formatImpactArrowLabel(preview.relationshipArrow);

  const annualFocusState = state.planner?.annualFocus;
  const activeFocusId = annualFocusState?.current ?? 'none';
  const activeFocusDef = ANNUAL_FOCUS_BY_ID.get(activeFocusId) ?? ANNUAL_FOCUS_BY_ID.get('none')!;
  const annualFocusGate = useMemo(() => canChangeAnnualFocus(state), [state]);
  const yearlyEvents = useMemo(() => getYearlyCalendarEvents(state), [state]);
  const streaks = state.planner?.streaks;

  const handleAddPin = () => {
    const trimmed = pinTitle.trim();
    if (!trimmed || !character.isAlive) return;
    onDispatch({
      type: 'ADD_CALENDAR_PIN',
      month: pinMonth,
      day: pinDay,
      title: trimmed,
      note: pinNote.trim() || undefined,
    });
    setPinTitle('');
    setPinNote('');
  };

  return (
    <div className="game-card overflow-hidden">
      {/* 1. Pastel Pixel Window Title Bar + View Switch */}
      <div className="bg-[#FFE58F] dark:bg-[#7A5B1F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex items-start gap-2">
          <span className="mt-0.5 shrink-0">
            <PixelIcon name="clock" size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                {UI_TEXT.PLANNER.pageTitle}
              </h3>
              {isDirty && (
                <span className="px-2 py-0.5 bg-[#FFFDFB] text-[#962253] border-2 border-[#4E3B69] text-[10px] font-extrabold">
                  {UI_TEXT.PLANNER.draftBadge}
                </span>
              )}
              {!isDirty && hasPendingTomorrow && (
                <span className="px-2 py-0.5 bg-[#D6FAEA] text-[#165940] border-2 border-[#4E3B69] text-[10px] font-extrabold">
                  {UI_TEXT.PLANNER.pendingTomorrowBadge}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-[#5A3F73] dark:text-[#F4E6F0] flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>{UI_TEXT.COMMON.ageYears(character.ageYears)}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{currentJob.title}</span>
              {preview.workShiftLabelTh && (
                <span className="px-1.5 py-0.5 bg-[#FFFDFB]/85 dark:bg-[#2A2247] border border-[#4E3B69]/60 text-[10px] font-bold text-[#3D2D52] dark:text-[#FFE58F]">
                  {preview.workShiftLabelTh}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-inset p-1 bg-[#FFF0F6] dark:bg-[#221B3B] flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewTab('weekly')}
            className={`px-2.5 py-1.5 text-xs font-display font-bold whitespace-nowrap transition-colors ${
              viewTab === 'weekly'
                ? 'px-slot bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]'
                : 'text-[#5A4773] dark:text-[#DDD6FE] hover:bg-[#FFFDFB]/50 dark:hover:bg-[#352B59]/50'
            }`}
          >
            {UI_TEXT.PLANNER.tabWeekly}
          </button>
          <button
            type="button"
            onClick={() => setViewTab('yearly')}
            className={`px-2.5 py-1.5 text-xs font-display font-bold whitespace-nowrap transition-colors ${
              viewTab === 'yearly'
                ? 'px-slot bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]'
                : 'text-[#5A4773] dark:text-[#DDD6FE] hover:bg-[#FFFDFB]/50 dark:hover:bg-[#352B59]/50'
            }`}
          >
            {UI_TEXT.PLANNER.tabYearly}
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3.5 px-window-striped">
        {hospitalized && (
          <div className="px-slot p-2.5 bg-[#FFE0EE] dark:bg-[#4B1D36] text-xs font-semibold text-[#962253] dark:text-[#FFB8D4] flex items-start gap-2">
            <PixelIcon name="warning" size={14} className="shrink-0 mt-0.5" />
            <span>
              กำลังพักรักษาตัวที่โรงพยาบาลชั่วคราว — ตารางแผนชีวิตจะกลับมาใช้ต่ออัตโนมัติเมื่อออกจากโรงพยาบาล
            </span>
          </div>
        )}

      {/* Polite Activity Re-lock Banner */}
      {state.planner?.lastRelockReasonTh && (
        <div className="px-slot p-2.5 bg-[#FFF9DB] dark:bg-[#3A3018] text-xs font-semibold text-[#735100] dark:text-[#FFE58F] flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <PixelIcon name="warning" size={14} className="shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold">{UI_TEXT.ANNUAL_FOCUS.relockNoticeTitle}</div>
              <div className="text-[11px] leading-snug">{state.planner.lastRelockReasonTh}</div>
            </div>
          </div>
          {onSelectExplain && (
            <button
              type="button"
              onClick={() => onSelectExplain('planner:relock')}
              className="underline font-bold text-[11px] shrink-0"
            >
              {UI_TEXT.EXPLAIN_BUTTON}
            </button>
          )}
        </div>
      )}

      {/* Yearly Tab: Annual Focus + Weekly Streaks + Yearly Calendar & Pins */}
      {viewTab === 'yearly' ? (
        <div className="space-y-4">
          {/* A. Annual Focus Section */}
          <div className="px-inset p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <PixelIcon name="star" size={15} />
                <h4 className="font-display font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                  {UI_TEXT.ANNUAL_FOCUS.sectionTitle}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {character.ageYears >= 13 && (
                  <span className="px-2 py-0.5 bg-[#FFE58F] text-[#3D2D52] border border-[#4E3B69] font-bold font-num">
                    {UI_TEXT.ANNUAL_FOCUS.changesLeftLabel(annualFocusGate.changesLeft)}
                  </span>
                )}
                {onSelectExplain && (
                  <button
                    type="button"
                    onClick={() => onSelectExplain('planner:annualFocus')}
                    className="underline font-bold text-[#663FB5] dark:text-[#DDD2FE]"
                  >
                    {UI_TEXT.EXPLAIN_BUTTON}
                  </button>
                )}
              </div>
            </div>

            {character.ageYears < 13 ? (
              <div className="px-slot p-2.5 bg-[#FFF0F6] dark:bg-[#2A2247] text-xs text-[#76658D] dark:text-[#CBBFE3] font-semibold">
                {UI_TEXT.ANNUAL_FOCUS.under13Notice}
              </div>
            ) : (
              <>
                <p className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE]">
                  {UI_TEXT.ANNUAL_FOCUS.evidenceBonusNote}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ANNUAL_FOCUS_LIST.map((item) => {
                    const isActive = activeFocusId === item.id;
                    const disabled = !character.isAlive || (!annualFocusGate.allowed && !isActive);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!isActive) {
                            onDispatch({ type: 'SET_ANNUAL_FOCUS', focusId: item.id });
                          }
                        }}
                        className={`game-btn text-left p-2.5 space-y-1 ${
                          isActive
                            ? 'bg-[#D6FAEA] text-[#165940]'
                            : 'bg-[#FFFDFB] dark:bg-[#2A2247] text-[#3D2D52] dark:text-[#FFF6FA]'
                        } ${disabled ? 'opacity-55 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1 font-display font-extrabold text-xs">
                          <span>{item.labelTh}</span>
                          {isActive && <PixelIcon name="check" size={13} />}
                        </div>
                        <p
                          className={`text-[11px] leading-snug ${
                            isActive ? 'text-[#165940]/90' : 'text-[#76658D] dark:text-[#CBBFE3]'
                          }`}
                        >
                          {item.shortDescTh}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {!annualFocusGate.allowed && (
                  <div className="text-[11px] font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                    {UI_TEXT.ANNUAL_FOCUS.maxChangesError}
                  </div>
                )}

                {activeFocusDef.recommendedPresets.length > 0 && (
                  <div className="pt-2 border-t border-dashed border-[#4E3B69]/20 dark:border-white/15 space-y-1.5">
                    <div className="text-[11px] font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                      {UI_TEXT.ANNUAL_FOCUS.recommendedPresetsLabel}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeFocusDef.recommendedPresets.map((pid) => {
                        const presetDef = LIFESTYLE_PRESETS_BY_ID.get(pid);
                        if (!presetDef) return null;
                        const avail = isPresetAvailableForPlanner(pid, state);
                        return (
                          <button
                            key={pid}
                            type="button"
                            disabled={!character.isAlive || !avail.available}
                            onClick={() => {
                              handleApplyPresetToDraft(pid);
                              setViewTab('weekly');
                            }}
                            className="game-btn px-2.5 py-1.5 bg-[#FFE58F] text-[#3D2D52] text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-45"
                          >
                            <span>{presetDef.nameTh}</span>
                            <span className="px-1.5 py-0.5 bg-[#FFFDFB] border border-[#4E3B69]/60 text-[10px]">
                              {UI_TEXT.ANNUAL_FOCUS.applyRecommendedBtn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* B. Weekly Continuity Streaks */}
          {streaks && (
            <div className="px-inset p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-2">
              <div className="flex items-center gap-1.5 font-display font-extrabold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                <PixelIcon name="lightning" size={14} />
                <span>{UI_TEXT.ANNUAL_FOCUS.streakSectionTitle}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-num">
                <span className="px-2 py-1 bg-[#EAE2FF] dark:bg-[#352B59] border border-[#4E3B69]/40 font-bold">
                  วิถีชีวิตต่อเนื่อง: {streaks.presetWeeks} สัปดาห์
                </span>
                <span className="px-2 py-1 bg-[#D6FAEA] dark:bg-[#194736] text-[#165940] dark:text-[#7EF4C2] border border-[#4E3B69]/40 font-bold">
                  ออกกำลังกาย: {streaks.workoutWeeks} สัปดาห์
                </span>
                <span className="px-2 py-1 bg-[#FFF3BF] dark:bg-[#4A3A1B] border border-[#4E3B69]/40 font-bold">
                  ทำโอทีต่อเนื่อง: {streaks.overtimeWeeks} สัปดาห์
                </span>
                <span className="px-2 py-1 bg-[#DCEBFF] dark:bg-[#28488E]/60 border border-[#4E3B69]/40 font-bold">
                  นอนเต็มอิ่ม: {streaks.sleepFullWeeks} สัปดาห์
                </span>
                {streaks.clubWeeks > 0 && (
                  <span className="px-2 py-1 bg-[#FFE0EE] text-[#962253] border border-[#4E3B69]/40 font-bold">
                    ชมรมมหาลัย: {streaks.clubWeeks} สัปดาห์
                  </span>
                )}
                {streaks.sleepDeficitWeeks > 0 && (
                  <span className="px-2 py-1 bg-[#FFE0EE] text-[#BD346B] border border-[#4E3B69]/40 font-bold">
                    พักผ่อนน้อยสะสม: {streaks.sleepDeficitWeeks} สัปดาห์
                  </span>
                )}
              </div>
            </div>
          )}

          {/* C. Read-only Yearly Calendar + Personal Pins */}
          <div className="px-inset p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-display font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                <PixelIcon name="clock" size={14} />
                <span>{UI_TEXT.YEARLY_CALENDAR.sectionTitle}</span>
              </div>
              <p className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] mt-0.5">
                {UI_TEXT.YEARLY_CALENDAR.subtitle}
              </p>
            </div>

            {/* Pin Form */}
            <div className="px-slot p-2.5 bg-[#FFF2F6] dark:bg-[#2A2247] space-y-2">
              <div className="text-xs font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                {UI_TEXT.YEARLY_CALENDAR.pinFormTitle}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  aria-label="เลือกเดือนนัดหมาย"
                  value={pinMonth}
                  onChange={(e) => setPinMonth(Number(e.target.value))}
                  className="px-slot px-2 py-1.5 text-xs bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]"
                >
                  {UI_TEXT.YEARLY_CALENDAR.monthNamesShort.map((mLabel, idx) => (
                    <option key={mLabel} value={idx + 1}>
                      {mLabel}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  aria-label="วันที่นัดหมาย"
                  min={1}
                  max={31}
                  value={pinDay}
                  onChange={(e) => setPinDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                  className="px-slot px-2 py-1.5 text-xs font-num bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]"
                />
                <button
                  type="button"
                  disabled={!character.isAlive || !pinTitle.trim()}
                  onClick={handleAddPin}
                  className="game-btn px-2.5 py-1.5 bg-[#6EE7B7] text-[#165940] text-xs font-extrabold disabled:opacity-45"
                >
                  {UI_TEXT.YEARLY_CALENDAR.pinAddBtn}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  maxLength={60}
                  value={pinTitle}
                  onChange={(e) => setPinTitle(e.target.value)}
                  placeholder={UI_TEXT.YEARLY_CALENDAR.pinTitlePlaceholder}
                  className="px-slot px-2.5 py-1.5 text-xs bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]"
                />
                <input
                  type="text"
                  maxLength={100}
                  value={pinNote}
                  onChange={(e) => setPinNote(e.target.value)}
                  placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)"
                  className="px-slot px-2.5 py-1.5 text-xs bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]"
                />
              </div>
            </div>

            {/* Yearly Events List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {yearlyEvents.map((ev) => {
                const mShort = UI_TEXT.YEARLY_CALENDAR.monthNamesShort[ev.month - 1] ?? `${ev.month}`;
                const badgeMap = {
                  birthday: { label: UI_TEXT.YEARLY_CALENDAR.badgeBirthday, cls: 'bg-[#FFE0EE] text-[#962253]' },
                  holiday: { label: UI_TEXT.YEARLY_CALENDAR.badgeHoliday, cls: 'bg-[#DCEBFF] text-[#2559B8]' },
                  course: { label: UI_TEXT.YEARLY_CALENDAR.badgeCourse, cls: 'bg-[#D6FAEA] text-[#165940]' },
                  finance: { label: UI_TEXT.YEARLY_CALENDAR.badgeFinance, cls: 'bg-[#FFF3BF] text-[#735100]' },
                  pin: { label: UI_TEXT.YEARLY_CALENDAR.badgePin, cls: 'bg-[#EAE2FF] text-[#4C2E99]' },
                } as const;
                const badge = badgeMap[ev.kind];
                return (
                  <div
                    key={ev.id}
                    className="px-slot p-2 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="px-1.5 py-1 bg-[#FFF2F6] dark:bg-[#352B59] border border-[#4E3B69]/40 text-center shrink-0 min-w-[46px] font-num">
                        <div className="text-xs font-extrabold leading-none">{ev.day}</div>
                        <div className="text-[10px] font-bold text-[#76658D] dark:text-[#CBBFE3] mt-0.5">
                          {mShort}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold border border-[#4E3B69]/35 ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="font-bold text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                            {ev.titleTh}
                          </span>
                        </div>
                        {ev.subtitleTh && (
                          <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] mt-0.5 truncate">
                            {ev.subtitleTh}
                          </div>
                        )}
                      </div>
                    </div>
                    {ev.kind === 'pin' && ev.pinId && (
                      <button
                        type="button"
                        onClick={() => onDispatch({ type: 'REMOVE_CALENDAR_PIN', pinId: ev.pinId! })}
                        className="px-2 py-1 text-[11px] font-bold bg-[#FFE0EE] text-[#BD346B] border border-[#4E3B69]/50 shrink-0"
                      >
                        {UI_TEXT.YEARLY_CALENDAR.pinRemoveBtn}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Compact Annual Focus Banner inside Weekly Planner */}
          {character.ageYears >= 13 && (
            <div className="px-slot px-3 py-2 bg-[#F4F0FF] dark:bg-[#2A2247] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                  เป้าหมายปีนี้: {activeFocusDef.labelTh}
                </span>
                {activeFocusId !== 'none' && (
                  <span className="text-[11px] text-[#167956] dark:text-[#7EF4C2] font-semibold ml-2">
                    (+10% พฤติกรรมที่ตรงสาย)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewTab('yearly')}
                className="underline font-bold text-[11px] text-[#663FB5] dark:text-[#DDD2FE] shrink-0"
              >
                ปรับเป้าหมาย / ดูปฏิทินรายปี
              </button>
            </div>
          )}
          {/* 2. Horizontal Shortcut Strip */}
          {character.ageYears < 6 ? (
            <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] text-xs font-semibold text-[#5A4773] dark:text-[#DDD6FE]">
              {UI_TEXT.LIFESTYLE.infantManagedNotice}
            </div>
          ) : (
            <div className="px-inset p-2.5 sm:p-3 bg-[#FFFDFB]/85 dark:bg-[#221B3B]/90 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-display font-extrabold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                    {UI_TEXT.PLANNER.shortcutTitle}
                  </div>
                  <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
                    {UI_TEXT.PLANNER.shortcutSubtitle}
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5 overflow-x-auto px-2 py-1.5">
                {LIFESTYLE_PRESETS.map((preset) => {
                  const avail = isPresetAvailableForPlanner(preset.id, state);
                  const active = draftPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={!character.isAlive || !avail.available}
                      onClick={() => handleApplyPresetToDraft(preset.id)}
                      className={`game-btn shrink-0 w-[166px] sm:w-[178px] text-left p-2.5 flex flex-col justify-between gap-1.5 ${
                        active
                          ? 'bg-[#FFE58F] text-[#3D2D52]'
                          : 'bg-[#FFFDFB] dark:bg-[#2A2247] text-[#3D2D52] dark:text-[#FFF6FA]'
                      } ${!avail.available ? 'opacity-55' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display font-extrabold text-xs truncate">
                          {preset.nameTh}
                        </span>
                        {active ? (
                          <span className="w-5 h-5 bg-[#6EE7B7] border-2 border-[#4E3B69] flex items-center justify-center shrink-0">
                            <PixelIcon name="check" size={11} />
                          </span>
                        ) : !avail.available ? (
                          <PixelIcon name="lock" size={12} />
                        ) : null}
                      </div>
                      <p
                        className={`text-[11px] leading-snug line-clamp-2 ${
                          active ? 'text-[#3D2D52]/85' : 'text-[#76658D] dark:text-[#CBBFE3]'
                        }`}
                      >
                        {!avail.available && avail.reasonTh ? `ล็อก: ${avail.reasonTh}` : preset.summaryTh}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. 2-Column x 4-Row Grid (Weekday | Weekend x Morning/Afternoon/Evening/Night) */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="px-slot py-2 bg-[#FFB8D2]/55 dark:bg-[#6E2647] font-display font-extrabold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                {UI_TEXT.PLANNER.colWeekday}
              </div>
              <div className="px-slot py-2 bg-[#B4C3FF]/55 dark:bg-[#3A4785] font-display font-extrabold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                {UI_TEXT.PLANNER.colWeekend}
              </div>
            </div>

            <div className="space-y-2.5">
              {ALL_SLOTS.map((slot, slotIndex) => (
                <div key={slot} className="grid grid-cols-2 gap-2.5 items-stretch">
                  {(['weekday', 'weekend'] as const).map((dayType) => {
                    const lock = isSlotLocked(dayType, slot, state);
                    const chainedNightOTLock = isNightChainedByEveningOT(draftGrid, dayType, slot, state);
                    const effectiveLocked = lock.locked || chainedNightOTLock;
                    const chainInfo = getSlotChainInfo(draftGrid, dayType, slot, state);
                    const actId = resolveEffectiveSlotActivityId(draftGrid, dayType, slot, state);
                    const act = ACTIVITIES_BY_ID.get(actId)!;
                    const group = ACTIVITY_GROUPS_BY_ID.get(act.majorGroup)!;
                    const weeklyCost =
                      act.moneyCostPerSlot > 0 &&
                      !(character.ageYears < 15 && act.minorPaidByParentsBelow15)
                        ? act.moneyCostPerSlot * DAY_TYPE_WEIGHTS[dayType]
                        : 0;
                    const slotWeeklyHours = getSlotWeeklyHours(dayType, slot, actId);
                    const slotOtIncome =
                      actId === 'overtime_work' && otHourlyRate > 0
                        ? Math.round(otHourlyRate * slotWeeklyHours)
                        : 0;
                    const slotGigIncome =
                      actId === 'side_gig_work' &&
                      state.sideGigRecord &&
                      character.ageYears >= 15 &&
                      !(character.ageYears < 18 && slot === 'night')
                        ? Math.round(state.sideGigRecord.hourlyPay * slotWeeklyHours)
                        : 0;
                    const slotEstimatedIncome = slotOtIncome + slotGigIncome;
                    const nextSlot = slotIndex < ALL_SLOTS.length - 1 ? ALL_SLOTS[slotIndex + 1] : null;
                    const showDownwardChainConnector =
                      nextSlot !== null && hasDownwardChainConnector(draftGrid, dayType, slot, state);
                    const lockReasonText = chainedNightOTLock
                      ? chainInfo.lockReasonTh
                      : lock.reasonTh;

                    const cellContent = effectiveLocked ? (
                      <div
                        className={`px-slot flex-1 h-full ${group.bgClass} ${
                          chainInfo.isChained
                            ? 'bg-gradient-to-b from-[#FFFDFB]/20 to-[#E5DBFF]/35 dark:to-[#3A2E66]/60'
                            : ''
                        } p-2.5 min-w-0 min-h-[104px] flex flex-col justify-between gap-1.5 opacity-95`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-bold text-[#5A4773] dark:text-[#DDD6FE]">
                            {UI_TEXT.DAYPARTS[slot]} · {SLOT_HOURS[slot]}ชม.
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#FFFDFB]/85 dark:bg-[#1E1833]/85 border-2 border-[#4E3B69]/55 font-bold text-[#76658D] dark:text-[#CBBFE3] shrink-0">
                            {chainInfo.isChained && <PixelIcon name="chain" size={11} />}
                            <PixelIcon name="lock" size={10} />
                            <span>{UI_TEXT.PLANNER.lockedBadge}</span>
                          </span>
                        </div>
                        <div className={`font-display font-extrabold text-xs sm:text-[13px] leading-snug break-words ${group.textClass}`}>
                          {act.nameTh}
                        </div>
                        {chainInfo.isChained && chainInfo.noticeTh ? (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4C2E99] dark:text-[#DDD2FE] leading-tight">
                            <PixelIcon name="chain" size={11} className="shrink-0" />
                            <span className="truncate">{chainInfo.noticeTh}</span>
                          </div>
                        ) : lockReasonText ? (
                          <div className="text-[10px] font-semibold text-[#76658D] dark:text-[#CBBFE3] leading-tight truncate">
                            {lockReasonText}
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold text-[#76658D] dark:text-[#CBBFE3] truncate">
                            {group.labelTh}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!character.isAlive}
                        onClick={() => handleOpenPicker(dayType, slot)}
                        className={`w-full flex-1 h-full px-slot text-left ${group.bgClass} ${
                          chainInfo.isChained
                            ? 'bg-gradient-to-b from-[#FFFDFB]/20 to-[#E5DBFF]/35 dark:to-[#3A2E66]/60'
                            : ''
                        } p-2.5 min-w-0 min-h-[104px] flex flex-col justify-between gap-1.5 transition-transform active:translate-y-0.5 hover:brightness-[0.98] disabled:opacity-50`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-bold text-[#5A4773] dark:text-[#DDD6FE]">
                            {UI_TEXT.DAYPARTS[slot]} · {SLOT_HOURS[slot]}ชม.
                          </span>
                          <span className="px-1.5 py-0.5 bg-[#FFFDFB] dark:bg-[#352B59] border-2 border-[#4E3B69] dark:border-[#7662AC] text-[#3D2D52] dark:text-[#FFF6FA] font-extrabold shrink-0">
                            {UI_TEXT.PLANNER.changeBtn}
                          </span>
                        </div>
                        <div className={`font-display font-extrabold text-xs sm:text-[13px] leading-snug break-words ${group.textClass}`}>
                          {act.nameTh}
                        </div>
                        {chainInfo.isChained && chainInfo.noticeTh ? (
                          <div className="text-[10px] font-bold text-[#4C2E99] dark:text-[#DDD2FE] flex items-center justify-between gap-1 leading-tight">
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <PixelIcon name="chain" size={11} className="shrink-0" />
                              <span className="truncate">{chainInfo.noticeTh}</span>
                            </span>
                            {slotEstimatedIncome > 0 && (
                              <span className="font-num tabular-nums font-extrabold text-[#167956] dark:text-[#7EF4C2] shrink-0">
                                +{slotEstimatedIncome.toLocaleString('th-TH')}฿
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold text-[#76658D] dark:text-[#CBBFE3] flex items-center justify-between gap-1">
                            <span className="truncate">
                              {actId === 'overtime_work' || actId === 'side_gig_work'
                                ? `${slotWeeklyHours} ชม./สัปดาห์`
                                : group.labelTh}
                            </span>
                            {slotEstimatedIncome > 0 ? (
                              <span className="font-num tabular-nums font-extrabold text-[#167956] dark:text-[#7EF4C2] shrink-0">
                                +{slotEstimatedIncome.toLocaleString('th-TH')}฿
                              </span>
                            ) : weeklyCost > 0 ? (
                              <span className="font-num tabular-nums font-extrabold text-[#BD346B] dark:text-[#FFB8D4] shrink-0">
                                -{weeklyCost}฿
                              </span>
                            ) : null}
                          </div>
                        )}
                      </button>
                    );

                    return (
                      <div key={`${dayType}-${slot}`} className="relative min-w-0 flex flex-col h-full">
                        {cellContent}
                        {showDownwardChainConnector && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-[11px] z-10 w-6 h-4 bg-[#DDD2FE] dark:bg-[#4C2E99] border-2 border-[#4E3B69] dark:border-[#9E84F7] flex items-center justify-center"
                          >
                            <PixelIcon name="chain" size={11} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 4b. Sub-Focus Activity Skill Tag Selector (hobby_leisure, self_study, attend_course, university_club) */}
          {(() => {
            const subfocusActivityIds = ['hobby_leisure', 'self_study', 'attend_course', 'university_club'] as const;
            const activeSubfocusActs = subfocusActivityIds.filter((actId) =>
              (['weekday', 'weekend'] as const).some((dt) =>
                ALL_SLOTS.some(
                  (sl) => resolveEffectiveSlotActivityId(draftGrid, dt, sl, state) === actId
                )
              )
            );
            if (activeSubfocusActs.length === 0) return null;
            return (
              <div className="px-slot p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-2 text-xs">
                <div className="font-display font-extrabold text-[#3D2D52] dark:text-[#FFF6FA]">
                  {UI_TEXT.PHASE331.activitySubfocusLabel}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeSubfocusActs.map((actId) => {
                    const def = ACTIVITIES_BY_ID.get(actId);
                    if (!def?.selectableSkillTags || def.selectableSkillTags.length === 0) return null;
                    const currentTag =
                      state.planner?.activitySkillTags?.[actId] ??
                      def.defaultSkillTags?.[0] ??
                      def.selectableSkillTags[0];
                    return (
                      <div key={actId} className="space-y-1">
                        <label
                          htmlFor={`subfocus-${actId}`}
                          className="block text-[11px] font-bold text-[#5A4773] dark:text-[#DDD6FE]"
                        >
                          {def.nameTh}
                        </label>
                        <select
                          id={`subfocus-${actId}`}
                          disabled={!character.isAlive}
                          value={currentTag}
                          onChange={(e) =>
                            onDispatch({
                              type: 'SET_ACTIVITY_SUBFOCUS',
                              activityId: actId,
                              tagId: e.target.value as ActivitySkillTagId,
                            })
                          }
                          className="w-full px-slot px-2 py-1.5 text-xs font-semibold bg-[#FFF0F6] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]"
                        >
                          {def.selectableSkillTags.map((tagId) => (
                            <option key={tagId} value={tagId}>
                              {ACTIVITY_SKILL_TAGS[tagId]?.labelTh ?? tagId}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 5. Live Weekly Impact Preview */}
          <div className="px-slot p-3 bg-[#F4F0FF] dark:bg-[#2A2247] space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display font-extrabold text-[#3D2D52] dark:text-[#FFF6FA]">
                {UI_TEXT.PLANNER.previewTitle}
              </span>
              <span
                className={`font-num tabular-nums font-extrabold ${
                  preview.netMoneyPerWeek >= 0
                    ? 'text-[#167956] dark:text-[#7EF4C2]'
                    : 'text-[#BD346B] dark:text-[#FFB8D4]'
                }`}
              >
                {UI_TEXT.PLANNER.arrowLabels.money}: {preview.netMoneyPerWeek >= 0 ? '+' : ''}
                {preview.netMoneyPerWeek.toLocaleString('th-TH')} ฿/สัปดาห์
              </span>
            </div>

            {(preview.overtimePayPerWeek > 0 ||
              preview.sideGigIncomePerWeek > 0 ||
              preview.nightShiftBonusPerWeek > 0 ||
              preview.freelanceExpectedIncomePerWeek > 0 ||
              character.ageYears >= 15) && (
              <div className="flex flex-wrap gap-1.5 text-[11px] font-num">
                {character.ageYears >= 15 && (
                  <span className="px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA] border border-[#4E3B69]/40 font-bold">
                    {UI_TEXT.PLANNER.totalWorkHoursLabel(
                      preview.derivedAllocation.workOrStudy + preview.derivedAllocation.sideGig,
                      character.ageYears < 18
                        ? AGE_LEGAL_RULES.minorMaxWeeklyWorkHours
                        : AGE_LEGAL_RULES.adultMaxWeeklyWorkHours
                    )}
                  </span>
                )}
                {preview.overtimePayPerWeek > 0 && (
                  <span className="px-2 py-0.5 bg-[#D6FAEA] text-[#165940] border border-[#4E3B69]/40 font-bold">
                    ค่าล่วงเวลา ({preview.otHoursPerWeek} ชม.) +{preview.overtimePayPerWeek.toLocaleString('th-TH')} ฿/สัปดาห์
                  </span>
                )}
                {preview.sideGigIncomePerWeek > 0 && (
                  <span className="px-2 py-0.5 bg-[#D6FAEA] text-[#165940] border border-[#4E3B69]/40 font-bold">
                    งานเสริม ({preview.derivedAllocation.sideGig} ชม.) +{preview.sideGigIncomePerWeek.toLocaleString('th-TH')} ฿/สัปดาห์
                  </span>
                )}
                {preview.nightShiftBonusPerWeek > 0 && (
                  <span className="px-2 py-0.5 bg-[#E0E7FF] text-[#313B7A] border border-[#4E3B69]/40 font-bold">
                    เบี้ยขยันกะดึก ~+{preview.nightShiftBonusPerWeek.toLocaleString('th-TH')} ฿/สัปดาห์
                  </span>
                )}
                {preview.freelanceExpectedIncomePerWeek > 0 && (
                  <span className="px-2 py-0.5 bg-[#FFF9DB] text-[#735100] border border-[#4E3B69]/40 font-bold">
                    งานฟรีแลนซ์ (คาดการณ์) ~+{preview.freelanceExpectedIncomePerWeek.toLocaleString('th-TH')} ฿/สัปดาห์
                  </span>
                )}
              </div>
            )}

            {draftPresetId === 'workaholic' && (
              <div className="text-[11px] font-semibold text-[#5A4773] dark:text-[#DDD6FE]">
                {UI_TEXT.PLANNER.workaholicPresetPreviewNote}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              <span className={`px-2 py-0.5 border border-[#4E3B69]/40 font-bold ${energyFmt.toneClass}`}>
                {UI_TEXT.PLANNER.arrowLabels.energy}: {energyFmt.text}
              </span>
              <span className={`px-2 py-0.5 border border-[#4E3B69]/40 font-bold ${stressFmt.toneClass}`}>
                {UI_TEXT.PLANNER.arrowLabels.stress}: {stressFmt.text}
              </span>
              <span className={`px-2 py-0.5 border border-[#4E3B69]/40 font-bold ${relFmt.toneClass}`}>
                {UI_TEXT.PLANNER.arrowLabels.relationship}: {relFmt.text}
              </span>
              {preview.resultingDaypartHint === 'night' && character.ageYears >= 18 && (
                <span className="px-2 py-0.5 bg-[#352B59] text-[#FFE58F] border border-[#7662AC] font-bold">
                  เน้นใช้ชีวิตช่วงดึก
                </span>
              )}
            </div>

            {/* Focused skills growth summary */}
            <div className="space-y-1 text-[11px]">
              <div className="font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                {UI_TEXT.PLANNER.previewFocusedSkillsLabel}{' '}
                {preview.focusedSkillsSummary.length === 0 && (
                  <span className="font-normal text-[#76658D] dark:text-[#CBBFE3]">
                    {UI_TEXT.PLANNER.previewNoFocusSkill}
                  </span>
                )}
              </div>
              {preview.focusedSkillsSummary.map((sk) => (
                <div
                  key={sk.skillId}
                  className="flex flex-wrap items-center justify-between gap-1 text-[#5A4773] dark:text-[#DDD6FE]"
                >
                  <span>
                    {sk.labelTh} (Lv.{Math.floor(sk.level)} / สูงสุด Lv.{sk.maxLevelForTier ?? 2})
                  </span>
                  {sk.atCap ? (
                    <span className="text-[#BD346B] dark:text-[#FFB8D4] font-semibold">
                      {UI_TEXT.SKILL_TRAINING.capReachedBadge} · {sk.unlockHintTh}
                    </span>
                  ) : !sk.hasSelfDevSlot && sk.estimatedWeeklyGain < 0.01 ? (
                    <span className="text-[#BD346B] dark:text-[#FFB8D4] font-semibold">
                      {UI_TEXT.PLANNER.noSelfDevSlotHint(sk.labelTh)}
                    </span>
                  ) : !sk.hasSelfDevSlot ? (
                    <span className="font-num tabular-nums font-bold text-[#167956] dark:text-[#7EF4C2]">
                      +{sk.estimatedWeeklyGain.toFixed(2)} XP/สัปดาห์ (จากกิจกรรมประจำ · เพิ่มช่องพัฒนาตัวเองเพื่อฝึกเต็มที่)
                    </span>
                  ) : (
                    <span className="font-num tabular-nums font-bold text-[#167956] dark:text-[#7EF4C2]">
                      +{sk.estimatedWeeklyGain.toFixed(2)} XP/สัปดาห์
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Scenes to see */}
            <div className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE] leading-relaxed">
              <span className="font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                {UI_TEXT.PLANNER.previewScenesLabel}
              </span>{' '}
              {preview.scenesToSee.join(' · ')}
            </div>

            {state.planner?.lastCostFallbackReasonTh && (
              <div className="p-2 bg-[#FFF9DB] dark:bg-[#3A3018] border border-[#D9A31E] text-[11px] text-[#735100] dark:text-[#FFE58F] flex items-start justify-between gap-2">
                <span>{state.planner.lastCostFallbackReasonTh}</span>
                {onSelectExplain && (
                  <button
                    type="button"
                    onClick={() => onSelectExplain('dayplan:slot:0')}
                    className="underline font-bold shrink-0"
                  >
                    {UI_TEXT.EXPLAIN_BUTTON}
                  </button>
                )}
              </div>
            )}

            {preview.warningsTh.map((w, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 text-[11px] font-semibold text-[#A16207] dark:text-[#FDE68A]"
              >
                <PixelIcon name="warning" size={13} className="shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>

          {/* Red validation error banner */}
          {!preview.validation.valid && (
            <div className="px-slot p-3 bg-[#FFE0EE] dark:bg-[#5E233E] text-xs text-[#BD346B] dark:text-[#FFB8D4] space-y-1 font-semibold">
              <div className="font-display font-extrabold">
                {UI_TEXT.PLANNER.previewRuleErrorTitle}
              </div>
              {preview.validation.errors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}

          {/* 6. Confirm / Discard Footer */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!isDirty}
                onClick={handleDiscardDraft}
                className="game-btn min-h-[44px] px-3 py-2 bg-[#FFFDFB] dark:bg-[#352B59] text-xs font-display font-bold text-[#3D2D52] dark:text-[#FFF6FA] disabled:opacity-40"
              >
                {UI_TEXT.PLANNER.discardBtn}
              </button>
              <button
                type="button"
                disabled={!isDirty || !preview.validation.valid || !character.isAlive}
                onClick={handleConfirmPlan}
                className="game-btn min-h-[44px] px-3 py-2 bg-[#6EE7B7] text-[#165940] text-xs sm:text-sm font-display font-extrabold disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
              >
                <PixelIcon name="check" size={15} />
                <span>{UI_TEXT.PLANNER.confirmBtn}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] text-center">
              {UI_TEXT.PLANNER.confirmEffectiveNote}
            </p>
          </div>

          {/* 7. Collapsible Read-Only Hour Breakdown */}
          <div className="pt-2 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowHours((prev) => !prev)}
              className="game-btn w-full min-h-[40px] flex items-center justify-between gap-2 px-3 py-1.5 bg-[#FFFDFB] dark:bg-[#221B3B] text-xs font-display font-bold text-[#3D2D52] dark:text-[#FFF6FA]"
            >
              <span>
                {showHours ? UI_TEXT.PLANNER.viewAsHoursHide : UI_TEXT.PLANNER.viewAsHoursShow}
              </span>
              <PixelIcon name={showHours ? 'chevron_up' : 'chevron_down'} size={14} />
            </button>

            {showHours && (
              <TimeAllocPanel
                state={state}
                previewAllocation={preview.derivedAllocation}
              />
            )}
          </div>
        </>
      )}
      </div>

      {/* 4. Bottom Sheet Activity Picker (Portaled to document.body above all bars/transforms) */}
      {pickerTarget &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setPickerTarget(null)}
            className="fixed inset-0 z-[60] bg-[#1E1833]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="game-card w-full max-w-lg max-h-[86dvh] flex flex-col overflow-hidden"
            >
              {/* Sheet Header */}
              <div className="p-3.5 border-b-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFB8D2] dark:bg-[#8E4A6F] flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <h4 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                    {UI_TEXT.PLANNER.pickerTitle(
                      pickerTarget.dayType === 'weekday'
                        ? UI_TEXT.PLANNER.colWeekday
                        : UI_TEXT.PLANNER.colWeekend,
                      UI_TEXT.DAYPARTS[pickerTarget.slot]
                    )}
                  </h4>
                  <p className="text-[11px] font-semibold text-[#5A3F73] dark:text-[#F4E6F0]">
                    {UI_TEXT.PLANNER.pickerSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={UI_TEXT.COMMON.close}
                  onClick={() => setPickerTarget(null)}
                  className="game-btn min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#FFFDFB] dark:bg-[#352B59] shrink-0"
                >
                  <PixelIcon name="close" size={16} />
                </button>
              </div>

              {/* Horizontal Major Group Chips */}
              <div className="px-3.5 py-2.5 border-b-2 border-[#4E3B69]/20 dark:border-[#7662AC]/40 bg-[#FFF2F6] dark:bg-[#221B3B] flex gap-2 overflow-x-auto overscroll-x-contain shrink-0">
                {visibleGroupsForSlot.map((g) => {
                  const isSelected = pickerGroup === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setPickerGroup(g.id)}
                      className={`shrink-0 min-h-[38px] px-3 py-1.5 text-xs font-display font-bold whitespace-nowrap transition-colors ${
                        isSelected
                          ? `px-slot ${g.bgClass} ${g.textClass}`
                          : 'px-inset bg-[#FFFDFB] dark:bg-[#2A2247] text-[#5A4773] dark:text-[#DDD6FE]'
                      }`}
                    >
                      {g.labelTh}
                    </button>
                  );
                })}
              </div>

              {/* Activity Sub-Cards */}
              <div
                ref={pickerListRef}
                className="flex-1 min-h-0 p-3.5 pb-6 overflow-y-auto overscroll-contain space-y-2.5"
              >
              {pickerEntries.map(({ act, avail }) => {
                const currentlySelected =
                  resolveEffectiveSlotActivityId(
                    draftGrid,
                    pickerTarget.dayType,
                    pickerTarget.slot,
                    state
                  ) === act.id;
                const otCount = countOvertimeSlots(draftGrid, state);
                const freelanceCount = countFreelanceSlots(draftGrid, state);
                const isNightAfterEveningOT =
                  pickerTarget.slot === 'night' &&
                  resolveEffectiveSlotActivityId(
                    draftGrid,
                    pickerTarget.dayType,
                    'evening',
                    state
                  ) === 'overtime_work';
                const otCapBlocked =
                  act.id === 'overtime_work' &&
                  !currentlySelected &&
                  (otCount >= 2 || isNightAfterEveningOT);
                const slotHoursIfPicked = getSlotWeeklyHours(
                  pickerTarget.dayType,
                  pickerTarget.slot,
                  act.id
                );
                const isOtRegularChain =
                  act.id === 'overtime_work' &&
                  pickerTarget.dayType === 'weekday' &&
                  pickerTarget.slot === 'evening' &&
                  emp.status === 'employed' &&
                  emp.workShift === 'morning-afternoon' &&
                  currentJob?.shift !== 'day_long';
                const pickerOtWeeklyPay =
                  act.id === 'overtime_work' && otHourlyRate > 0
                    ? Math.round(otHourlyRate * slotHoursIfPicked)
                    : 0;
                const pickerGigWeeklyPay =
                  act.id === 'side_gig_work' && state.sideGigRecord
                    ? Math.round(state.sideGigRecord.hourlyPay * slotHoursIfPicked)
                    : 0;
                const freelanceCapBlocked =
                  act.id === 'freelance_work' &&
                  !currentlySelected &&
                  freelanceCount >= 7;
                const weeklySlotCount = act.maxWeeklySlots
                  ? (['weekday', 'weekend'] as const).reduce(
                      (acc, dt) =>
                        acc +
                        ALL_SLOTS.filter(
                          (sl) => resolveEffectiveSlotActivityId(draftGrid, dt, sl, state) === act.id
                        ).length,
                      0
                    )
                  : 0;
                const maxSlotBlocked =
                  Boolean(act.maxWeeklySlots) &&
                  !currentlySelected &&
                  weeklySlotCount >= (act.maxWeeklySlots ?? 99);
                const effectiveAllowed =
                  avail.allowed && !otCapBlocked && !freelanceCapBlocked && !maxSlotBlocked;
                const effectiveLockReason = otCapBlocked
                  ? UI_TEXT.PLANNER.otLimitWarning
                  : freelanceCapBlocked
                    ? 'รับงานฟรีแลนซ์ได้สูงสุด 7 ช่วง/สัปดาห์'
                    : maxSlotBlocked
                      ? `จำกัดไม่เกิน ${act.maxWeeklySlots} ช่วง/สัปดาห์ (ผู้ปกครองคุมเวลา)`
                      : avail.reasonTh;
                const weeklyCost =
                  act.moneyCostPerSlot * DAY_TYPE_WEIGHTS[pickerTarget.dayType];
                const isParentPaid =
                  character.ageYears < 15 && Boolean(act.minorPaidByParentsBelow15);
                const cappedFocusNotice = act.usesSkillFocus
                  ? focusedSkillsDetails.find(
                      (f) =>
                        f.details.atCap ||
                        (act.id === 'self_study' && f.details.levelNum >= 2 && !f.details.tier2Unlocked) ||
                        (act.id === 'attend_course' && f.details.levelNum >= 4 && !f.details.tier3Unlocked)
                    )
                  : undefined;

                return (
                  <button
                    key={act.id}
                    type="button"
                    disabled={!effectiveAllowed}
                    onClick={() => handlePickActivity(act.id)}
                    className={`w-full text-left px-inset p-3 space-y-1.5 transition-colors ${
                      currentlySelected
                        ? 'bg-[#FFE58F] text-[#3D2D52] border-2 border-[#4E3B69]'
                        : 'bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA] hover:bg-[#FFF0F6] dark:hover:bg-[#2A2247]'
                    } ${!effectiveAllowed ? 'opacity-65 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-sm leading-snug">
                          {act.nameTh}
                        </div>
                        <p
                          className={`text-xs mt-0.5 ${
                            currentlySelected
                              ? 'text-[#3D2D52]/85'
                              : 'text-[#5A4773] dark:text-[#DDD6FE]'
                          }`}
                        >
                          {act.shortDescTh}
                        </p>
                      </div>
                      {currentlySelected ? (
                        <PixelIcon name="check" size={16} className="shrink-0 mt-0.5" />
                      ) : !effectiveAllowed ? (
                        <PixelIcon name="lock" size={14} className="shrink-0 mt-0.5" />
                      ) : null}
                    </div>

                    {isOtRegularChain && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EFEAFF] dark:bg-[#352B59] border border-[#8B6EE8] text-[11px] font-bold text-[#4C2E99] dark:text-[#DDD2FE]">
                        <PixelIcon name="chain" size={12} />
                        <span>{UI_TEXT.PLANNER.otChainCardHint}</span>
                      </div>
                    )}

                    {/* Arrow impact labels + concrete slot income/cost */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {(
                        ['energy', 'stress', 'relationship', 'skill', 'money'] as const
                      ).map((k) => {
                        if (isParentPaid && k === 'money') return null;
                        const arrowVal = act.arrows[k];
                        if (!arrowVal) return null;
                        const fmt = formatImpactArrowLabel(arrowVal, k === 'stress');
                        return (
                          <span
                            key={k}
                            className={`px-1.5 py-0.5 border border-[#4E3B69]/35 font-bold ${fmt.toneClass}`}
                          >
                            {UI_TEXT.PLANNER.arrowLabels[k]} {fmt.text}
                          </span>
                        );
                      })}
                      {act.maxWeeklySlots && (
                        <span className="px-1.5 py-0.5 border border-[#4E3B69]/35 bg-[#FFF9DB] text-[#735100] font-bold font-num">
                          ไม่เกิน {act.maxWeeklySlots} ช่วง/สัปดาห์
                        </span>
                      )}
                      {pickerOtWeeklyPay > 0 && (
                        <span className="px-1.5 py-0.5 border border-[#4E3B69]/35 bg-[#D6FAEA] text-[#165940] font-bold font-num">
                          +{pickerOtWeeklyPay.toLocaleString('th-TH')} ฿/สัปดาห์ ({slotHoursIfPicked} ชม.)
                        </span>
                      )}
                      {pickerGigWeeklyPay > 0 && (
                        <span className="px-1.5 py-0.5 border border-[#4E3B69]/35 bg-[#D6FAEA] text-[#165940] font-bold font-num">
                          +{pickerGigWeeklyPay.toLocaleString('th-TH')} ฿/สัปดาห์ ({slotHoursIfPicked} ชม.)
                        </span>
                      )}
                      {act.moneyCostPerSlot > 0 && (
                        <span className="px-1.5 py-0.5 border border-[#4E3B69]/35 bg-[#FFF0F6] text-[#962253] font-bold font-num">
                          {isParentPaid
                            ? UI_TEXT.PLANNER.parentPaidHint
                            : `ค่าใช้จ่าย ${weeklyCost.toLocaleString('th-TH')} ฿/สัปดาห์`}
                        </span>
                      )}
                    </div>

                    {/* Skill training ceiling notice (Spec 06 §3.2) */}
                    {cappedFocusNotice && (
                      <div className="text-[11px] font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                        {UI_TEXT.SKILL_TRAINING.capReachedBadge} ({cappedFocusNotice.labelTh}):{' '}
                        {cappedFocusNotice.details.unlockHintTh}
                      </div>
                    )}

                    {/* Lock reason + unlock hint */}
                    {!effectiveAllowed && (
                      <div className="text-[11px] font-semibold text-[#BD346B] dark:text-[#FFB8D4] space-y-0.5 pt-0.5">
                        <div>ล็อก: {effectiveLockReason}</div>
                        {!otCapBlocked && !freelanceCapBlocked && avail.unlockHintTh && (
                          <div className="text-[#5A4773] dark:text-[#DDD6FE]">
                            {UI_TEXT.SKILL_TRAINING.unlockHintPrefix} {avail.unlockHintTh}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
