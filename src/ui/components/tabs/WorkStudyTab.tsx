import { useState } from 'react';
import { SKILL_TRAINING_CONFIG } from '../../../data/skillTraining';
import { EDUCATION_LABELS, JOBS, SKILL_LABELS, WORK_SHIFT_LABELS_TH } from '../../../data/thaiData';
import { UI_TEXT } from '../../../data/uiText';
import { checkJobEligibility } from '../../../engine/economy';
import { deriveWeeklyAllocation, resolveEmploymentState } from '../../../engine/planner';
import { canEnrollCourse, getSkillGrowthDetails } from '../../../engine/skillTraining';
import { filterAvailableActions } from '../../../engine/traitEffects';
import type { GameState, PlayerAction, SkillKey, WorkShiftSchedule } from '../../../engine/types';
import { PixelIcon } from '../../art/PixelIcons';
import { LifePlannerPanel } from '../LifePlannerPanel';
import { StandingOrdersPanel } from '../StandingOrdersPanel';

interface WorkStudyTabProps {
  state: GameState;
  onDispatch: (action: PlayerAction) => void;
  onSelectExplain?: (targetKey: string) => void;
}

type WorkSubTab = 'job' | 'actions' | 'autopilot';

const SKILL_KEYS: SkillKey[] = [
  'english',
  'sales',
  'finance',
  'tech',
  'craft',
  'cooking',
  'socializing',
  'academic',
];

export function WorkStudyTab({ state, onDispatch, onSelectExplain }: WorkStudyTabProps) {
  const [subTab, setSubTab] = useState<WorkSubTab>('job');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { character, economy, skillTraining } = state;

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentJob = JOBS[economy.jobId] ?? JOBS.unemployed;
  const empState = resolveEmploymentState(state);
  const canSwitchShift =
    empState.status === 'employed' &&
    currentJob.shift !== 'none' &&
    currentJob.id !== 'student';
  const shiftOptions: WorkShiftSchedule[] = [
    'morning-afternoon',
    'afternoon-evening',
    'night-morning',
    'flexible',
  ];
  const isTooYoungForWork = character.ageYears < 15;
  const isTooYoungForTrain = character.ageYears < SKILL_TRAINING_CONFIG.minTrainingAge;
  const currentFocus = skillTraining?.focus ?? [];
  const activeCourse = skillTraining?.course ?? null;
  const currentSelfDevHours = state.planner?.grid
    ? deriveWeeklyAllocation(state.planner.grid, state).selfDev
    : (state.timeAllocation?.selfDev ?? 0);
  const evaluatedActions = filterAvailableActions(state);
  const availableActionCount = evaluatedActions.filter((ev) => ev.available).length;

  const handleToggleFocus = (skill: SkillKey) => {
    const isFocused = currentFocus.includes(skill);
    if (isFocused) {
      onDispatch({
        type: 'SET_SKILL_FOCUS',
        focus: currentFocus.filter((k) => k !== skill),
      });
    } else if (currentFocus.length < SKILL_TRAINING_CONFIG.maxFocusSkills) {
      onDispatch({
        type: 'SET_SKILL_FOCUS',
        focus: [...currentFocus, skill],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation for Work/Skill/Schedule, Trait-Gated Actions, and Standing Orders */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setSubTab('job')}
          className={`game-btn px-2 py-2 text-[11px] sm:text-xs font-display font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            subTab === 'job'
              ? 'bg-[#D6FAEA] text-[#165940]'
              : 'bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA]'
          }`}
        >
          <PixelIcon name="briefcase" size={14} />
          <span>งานและทักษะ</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('actions')}
          className={`game-btn px-2 py-2 text-[11px] sm:text-xs font-display font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            subTab === 'actions'
              ? 'bg-[#D6FAEA] text-[#165940]'
              : 'bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA]'
          }`}
        >
          <PixelIcon name="sparkle" size={14} />
          <span>{UI_TEXT.GATED_ACTIONS.tabLabel}</span>
          <span className="font-num tabular-nums text-[10px] opacity-80">
            ({availableActionCount}/{evaluatedActions.length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('autopilot')}
          className={`game-btn px-2 py-2 text-[11px] sm:text-xs font-display font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap ${
            subTab === 'autopilot'
              ? 'bg-[#D6FAEA] text-[#165940]'
              : 'bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA]'
          }`}
        >
          <PixelIcon name="shield" size={14} />
          <span>คำสั่งประจำ</span>
        </button>
      </div>

      {subTab === 'actions' && (
        <div className="game-card overflow-hidden">
          <div className="bg-[#FFE58F] dark:bg-[#7A5B1F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <PixelIcon name="sparkle" size={18} />
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                  {UI_TEXT.GATED_ACTIONS.sectionTitle}
                </h3>
                <p className="text-[11px] text-[#5A3F73] dark:text-[#F4E6F0]">
                  {UI_TEXT.GATED_ACTIONS.sectionSubtitle}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-[#FFFDFB] text-[#3D2D52] border-2 border-[#4E3B69] text-[11px] font-num font-bold shrink-0">
              พร้อมทำ {availableActionCount}/{evaluatedActions.length}
            </span>
          </div>

          <div className="p-3 sm:p-4 space-y-2.5 px-window-striped">
            {evaluatedActions.map((ev) => (
              <div
                key={ev.action.id}
                className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 font-display font-bold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                    {!ev.available && <PixelIcon name="lock" size={14} />}
                    <span>{ev.action.labelTh}</span>
                  </div>
                  <p className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE]">
                    {ev.action.descriptionTh} · {ev.action.rewardEffectsSummary}
                  </p>
                  <div className="text-[10px] font-num font-semibold text-[#76658D] dark:text-[#CBBFE3]">
                    ใช้พลังงาน {ev.action.energyCost} · เวลาว่าง {ev.action.freeTimeCost} ชม.
                  </div>
                  {!ev.available && ev.lockReasonTh && (
                    <p className="text-[11px] font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                      {ev.lockReasonTh}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!ev.available && onSelectExplain && (
                    <button
                      type="button"
                      onClick={() => onSelectExplain(`action_lock:${ev.action.id}`)}
                      className="game-btn px-2.5 py-1.5 bg-[#FFF0F6] dark:bg-[#352B59] text-[11px] font-bold"
                    >
                      ทำไมล็อก?
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!ev.available || !character.isAlive}
                    onClick={() =>
                      onDispatch({ type: 'EXECUTE_GATED_ACTION', actionId: ev.action.id })
                    }
                    className={`game-btn px-3 py-1.5 text-xs font-display font-extrabold disabled:opacity-40 ${
                      ev.available
                        ? 'bg-[#6EE7B7] text-[#165940]'
                        : 'bg-[#FFFDFB] dark:bg-[#352B59] text-[#76658D]'
                    }`}
                  >
                    ลงมือทำ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'autopilot' && <StandingOrdersPanel state={state} onDispatch={onDispatch} />}

      {subTab === 'job' && (
        <>
          {/* อาชีพ / การเรียนปัจจุบัน */}
          <div className="game-card overflow-hidden">
            <div className="bg-[#B4C3FF] dark:bg-[#4F5DA8] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PixelIcon name={currentJob.category === 'study' ? 'cap' : 'briefcase'} size={20} />
                <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                  {currentJob.title}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-[#D6FAEA] text-[#167956] border-2 border-[#4E3B69] text-sm font-bold font-num">
                {economy.monthlySalary.toLocaleString('th-TH')} ฿/เดือน
              </span>
            </div>
            <div className="p-4 space-y-2.5 px-window-striped">
              <p className="text-sm text-[#5A4773] dark:text-[#DDD6FE]">{currentJob.description}</p>
              <div className="text-xs text-[#76658D] dark:text-[#CBBFE3] font-num">
                วุฒิ: {EDUCATION_LABELS[character.education]} · ใช้เวลา {currentJob.workHoursPerDay} ชม./วัน
                {canSwitchShift && ` · ${WORK_SHIFT_LABELS_TH[empState.workShift]}`}
              </div>
              {canSwitchShift && (
                <div className="pt-2 border-t border-[#4E3B69]/20 dark:border-white/15 space-y-1.5">
                  <div className="text-[11px] font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                    เลือกกะเวลาทำงาน (เปลี่ยนช่องล็อกในตารางสัปดาห์อัตโนมัติ)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {shiftOptions.map((sh) => {
                      const active = empState.workShift === sh;
                      const nightMinorLocked = sh === 'night-morning' && character.ageYears < 18;
                      return (
                        <button
                          key={sh}
                          type="button"
                          disabled={!character.isAlive || nightMinorLocked}
                          onClick={() => onDispatch({ type: 'CHANGE_WORK_SHIFT', workShift: sh })}
                          className={`game-btn px-2 py-1.5 text-[11px] font-display font-bold text-left ${
                            active
                              ? 'bg-[#FFE58F] text-[#3D2D52]'
                              : 'bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA]'
                          } disabled:opacity-45`}
                        >
                          {WORK_SHIFT_LABELS_TH[sh]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ตารางแผนชีวิต (มีจุดเดียวในหน้างาน) */}
          <LifePlannerPanel
            state={state}
            onDispatch={onDispatch}
            onSelectExplain={onSelectExplain}
          />

          {/* ฝึกทักษะแบบขั้นบันได */}
          <div className="game-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PixelIcon name="star" size={18} />
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                    {UI_TEXT.SKILL_TRAINING.sectionTitle}
                  </h3>
                  <p className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
                    {UI_TEXT.SKILL_TRAINING.sectionSubtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-[#5A4773] dark:text-[#DDD6FE] font-num">
                  {isTooYoungForTrain
                    ? UI_TEXT.SKILL_TRAINING.tooYoungNotice
                    : UI_TEXT.SKILL_TRAINING.focusHint(
                        currentFocus.length,
                        SKILL_TRAINING_CONFIG.maxFocusSkills
                      )}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSection('skillTraining')}
                  aria-label={collapsedSections.skillTraining ? 'ขยายหมวดฝึกทักษะ' : 'ย่อหมวดฝึกทักษะ'}
                  className="game-btn px-2 py-1 bg-[#FFF0F6] dark:bg-[#352B59] text-[11px] font-bold inline-flex items-center gap-1"
                >
                  <span>{collapsedSections.skillTraining ? 'ขยาย' : 'ย่อ'}</span>
                  <PixelIcon
                    name={collapsedSections.skillTraining ? 'chevron_down' : 'chevron_up'}
                    size={12}
                  />
                </button>
              </div>
            </div>

            {!collapsedSections.skillTraining && (
              <>

            {activeCourse && activeCourse.weeksLeft > 0 && (
              <div className="px-slot p-3 bg-[#EBF7FF] dark:bg-[#2A2247] space-y-1 text-xs">
                <div className="font-display font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                  {UI_TEXT.SKILL_TRAINING.courseActiveLabel(
                    SKILL_LABELS[activeCourse.skillId]?.label ?? activeCourse.skillId,
                    activeCourse.weeksLeft,
                    activeCourse.feePerWeek
                  )}
                </div>
                {currentSelfDevHours < SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek && (
                  <div className="text-[#BD346B] dark:text-[#FFB8D4] font-semibold">
                    {UI_TEXT.SKILL_TRAINING.courseMinHoursHint(
                      SKILL_TRAINING_CONFIG.courseMinSelfDevHoursPerWeek
                    )}
                  </div>
                )}
              </div>
            )}

            {!isTooYoungForTrain && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SKILL_KEYS.map((sKey) => {
                  const meta = SKILL_LABELS[sKey];
                  const details = getSkillGrowthDetails(state, sKey);
                  const enrollGate = canEnrollCourse(state, sKey);
                  const showCourseOptions = !details.tier2Unlocked && details.level < 60;
                  const canFocusMore =
                    details.isFocused || currentFocus.length < SKILL_TRAINING_CONFIG.maxFocusSkills;

                  return (
                    <div
                      key={sKey}
                      className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                              {meta.label}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#F4F0FF] dark:bg-[#352B59] border border-[#4E3B69]/50 text-[10px] font-bold">
                              {details.tierLabelTh}
                            </span>
                            {details.atCap && (
                              <span className="px-1.5 py-0.5 bg-[#FFE0EE] text-[#BD346B] border border-[#4E3B69]/50 text-[10px] font-bold">
                                {UI_TEXT.SKILL_TRAINING.capReachedBadge} {details.effectiveCap}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-num font-bold text-[#BD346B] dark:text-[#FFB8D4] mt-0.5">
                            Lv.{Math.floor(details.level)} / {details.effectiveCap} · +{details.estimatedWeeklyGain.toFixed(2)}/สัปดาห์
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onSelectExplain && (
                            <button
                              type="button"
                              onClick={() => onSelectExplain(`skill:${sKey}`)}
                              className="game-btn px-2 py-1 bg-[#FFF0F6] dark:bg-[#352B59] text-[11px] font-bold text-[#3D2D52] dark:text-[#FFF6FA]"
                            >
                              {UI_TEXT.SKILL_TRAINING.explainBtn}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!character.isAlive || !canFocusMore}
                            onClick={() => handleToggleFocus(sKey)}
                            className={`game-btn px-2.5 py-1 text-[11px] font-display font-bold disabled:opacity-40 ${
                              details.isFocused
                                ? 'bg-[#FFE58F] text-[#3D2D52]'
                                : 'bg-[#D6FAEA] text-[#165940]'
                            }`}
                          >
                            {details.isFocused
                              ? UI_TEXT.SKILL_TRAINING.focusActive
                              : UI_TEXT.SKILL_TRAINING.focusSet}
                          </button>
                        </div>
                      </div>

                      {/* Fractional XP Progress Bar */}
                      <div className="space-y-1">
                        <div className="px-progress-track h-2 bg-[#FFF0F6] dark:bg-[#1A1430] overflow-hidden">
                          <div
                            className="h-full bg-[#FF8DA8] transition-all"
                            style={{ width: `${details.xpProgressPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-num text-[#76658D] dark:text-[#CBBFE3]">
                          <span>ความคืบหน้าระดับถัดไป</span>
                          <span>{details.xpProgressPct}%</span>
                        </div>
                      </div>

                      {/* Tier 2 Course Enrollment (4 / 8 / 12 weeks) */}
                      {showCourseOptions && (
                        <div className="pt-1 border-t border-[#4E3B69]/20 space-y-1.5">
                          <div className="text-[11px] font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                            {UI_TEXT.SKILL_TRAINING.courseTitle}
                          </div>
                          {enrollGate.allowed ? (
                            <div className="grid grid-cols-3 gap-1.5">
                              {SKILL_TRAINING_CONFIG.courseDurations.map((wks) => (
                                <button
                                  key={wks}
                                  type="button"
                                  disabled={!character.isAlive}
                                  onClick={() =>
                                    onDispatch({
                                      type: 'ENROLL_SKILL_COURSE',
                                      skillId: sKey,
                                      weeks: wks,
                                    })
                                  }
                                  className="game-btn px-1.5 py-1 bg-[#EBF7FF] dark:bg-[#352B59] text-[10px] font-num font-bold text-[#1E40AF] dark:text-[#BFDBFE]"
                                >
                                  {wks} สัปดาห์ ({SKILL_TRAINING_CONFIG.courseFeePerWeek}฿)
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                              {enrollGate.reasonTh}
                            </p>
                          )}
                        </div>
                      )}

                      {details.unlockHintTh && (
                        <p className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE] leading-snug">
                          <span className="font-bold">{UI_TEXT.SKILL_TRAINING.unlockHintPrefix}</span>{' '}
                          {details.unlockHintTh}
                        </p>
                      )}
                      {details.slowReasonsTh.length > 0 && (
                        <p className="text-[11px] font-semibold text-[#A16207] dark:text-[#FDE68A]">
                          {details.slowReasonsTh[0]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>

          {/* ตลาดงาน */}
          <div className="game-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                โอกาสงานและเปลี่ยนสายอาชีพ
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {isTooYoungForWork && (
                  <span className="text-xs font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                    เปิดสมัครงานเมื่ออายุ 15 ปี
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection('jobMarket')}
                  aria-label={collapsedSections.jobMarket ? 'ขยายตลาดงาน' : 'ย่อตลาดงาน'}
                  className="game-btn px-2 py-1 bg-[#FFF0F6] dark:bg-[#352B59] text-[11px] font-bold inline-flex items-center gap-1"
                >
                  <span>{collapsedSections.jobMarket ? 'ขยาย' : 'ย่อ'}</span>
                  <PixelIcon
                    name={collapsedSections.jobMarket ? 'chevron_down' : 'chevron_up'}
                    size={12}
                  />
                </button>
              </div>
            </div>

            {!collapsedSections.jobMarket && (
              <div className="space-y-2.5">
                {Object.values(JOBS)
                  .filter((j) => j.id !== 'infant')
                  .map((job) => {
                    const isCurrent = economy.jobId === job.id;
                    const check = checkJobEligibility(
                      character,
                      job.id,
                      state.settings,
                      economy.jobId
                    );
                    const disabled = isCurrent || !check.allowed || !character.isAlive || isTooYoungForWork;
                    return (
                      <div
                        key={job.id}
                        className="px-inset p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                              {job.title}
                            </span>
                            <span className="text-xs font-bold font-num text-[#167956] dark:text-[#7EF4C2]">
                              {job.monthlySalary.toLocaleString('th-TH')} ฿/ด.
                            </span>
                          </div>
                          <p className="text-xs text-[#5A4773] dark:text-[#DDD6FE]">{job.description}</p>
                          {job.appearanceNoteTh && (
                            <p className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
                              ภาพลักษณ์/บุคลิก: {job.appearanceNoteTh}
                            </p>
                          )}
                          {!isCurrent && !check.allowed && (
                            <p className="text-xs font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                              เงื่อนไข: {check.reasons.join(' · ')}
                            </p>
                          )}
                          {!isCurrent && check.allowed && check.warnings && check.warnings.length > 0 && (
                            <p className="text-[11px] font-semibold text-[#A16207] dark:text-[#FDE68A]">
                              หมายเหตุ: {check.warnings.join(' · ')}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onDispatch({ type: 'APPLY_JOB', jobId: job.id })}
                          className={`game-btn px-4 text-xs font-display font-extrabold whitespace-nowrap shrink-0 ${
                            isCurrent
                              ? 'bg-[#FFE58F] text-[#3D2D52]'
                              : !disabled
                                ? 'bg-[#FF8DA8] text-[#3D2D52]'
                                : 'bg-[#FFFDFB]/60 dark:bg-[#2A2247] text-[#76658D] opacity-50'
                          }`}
                        >
                          {isCurrent ? 'ทำอยู่ตอนนี้' : 'สมัครเลย'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
