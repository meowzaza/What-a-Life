import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BASE_MS_PER_DAY } from '../../engine/clock';
import { shouldInterruptWithAttentionBudget } from '../../engine/director';
import { skipToNextMilestone, stepOneTick } from '../../engine/pipeline';
import { AUTOSAVE_SLOT_ID, buildSavePayload, saveAutosave, saveToIndexedDB } from '../../engine/save';
import { dispatchPlayerAction } from '../../engine/state';
import type {
  ActionRecord,
  GameSpeed,
  GameState,
  LifeGenRequest,
  PlayerAction,
} from '../../engine/types';
import { PixelIcon, type PixelIconName } from '../art/PixelIcons';
import { CelebrationToast, type NonBlockingNotice } from '../components/CelebrationToast';
import { ChoiceCard } from '../components/ChoiceCard';
import { ExplainPanel } from '../components/ExplainPanel';
import { SceneStage, type FloatingDelta } from '../components/SceneStage';
import { SixIndicesBar } from '../components/SixIndicesBar';
import { type ActiveSpeed, type PauseReason, TimeControls } from '../components/TimeControls';
import { TimelineFeed } from '../components/TimelineFeed';
import { TopBar } from '../components/TopBar';
import { FinanceTab } from '../components/tabs/FinanceTab';
import { JournalTab } from '../components/tabs/JournalTab';
import { MeTab } from '../components/tabs/MeTab';
import { RelationshipsTab } from '../components/tabs/RelationshipsTab';
import { WorkStudyTab } from '../components/tabs/WorkStudyTab';

import type { FontPresetId } from '../fonts';

type BottomTab = 'home' | 'life' | 'people' | 'money' | 'journal';
type LifeSubView = 'work' | 'me';

interface MainGameScreenProps {
  state: GameState;
  lifeGenRequest: LifeGenRequest;
  actionLog: ActionRecord[];
  onUpdateState: (next: GameState) => void;
  onRecordAction: (record: ActionRecord) => void;
  isDark: boolean;
  reduceFx: boolean;
  fontPreset: FontPresetId;
  onToggleTheme: () => void;
  onToggleReduceFx: () => void;
  onOpenFontSettings: () => void;
  onOpenSaveLoad: () => void;
  onStartNewLife: () => void;
  onOpenSceneDebug?: () => void;
}

export function MainGameScreen({
  state,
  lifeGenRequest,
  actionLog,
  onUpdateState,
  onRecordAction,
  isDark,
  reduceFx,
  fontPreset,
  onToggleTheme,
  onToggleReduceFx,
  onOpenFontSettings,
  onOpenSaveLoad,
  onStartNewLife,
  onOpenSceneDebug,
}: MainGameScreenProps) {
  const [speed, setSpeed] = useState<GameSpeed>(0);
  const [lastActiveSpeed, setLastActiveSpeed] = useState<ActiveSpeed>(1);
  const [pauseReason, setPauseReason] = useState<PauseReason>('initial');
  const [activeSlotIndex, setActiveSlotIndex] = useState<0 | 1 | 2 | 3>(0);
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [lifeSubView, setLifeSubView] = useState<LifeSubView>('work');
  const [selectedExplainKey, setSelectedExplainKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<NonBlockingNotice | null>(null);
  const [floatingDeltas, setFloatingDeltas] = useState<FloatingDelta[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const lifeGenRef = useRef(lifeGenRequest);
  lifeGenRef.current = lifeGenRequest;

  const actionLogRef = useRef(actionLog);
  actionLogRef.current = actionLog;

  const noticeTimerRef = useRef<number | null>(null);
  const prevAgeRef = useRef(state.character.ageYears);
  const prevCashRef = useRef(state.economy.cash);
  const deltaIdRef = useRef(1);
  const lastPromptRealMsRef = useRef<number | null>(null);

  const showNotice = useCallback((nextNotice: Omit<NonBlockingNotice, 'id'>, durationMs = 2800) => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    const id = Date.now() + Math.floor(Math.random() * 100);
    setNotice({ ...nextNotice, id });
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, durationMs);
  }, []);

  const pushFloatingDelta = useCallback(
    (text: string, positive: boolean) => {
      if (reduceFx) return;
      const id = deltaIdRef.current++;
      setFloatingDeltas((prev) => [...prev.slice(-3), { id, text, positive }]);
      window.setTimeout(() => {
        setFloatingDeltas((prev) => prev.filter((item) => item.id !== id));
      }, 1050);
    },
    [reduceFx]
  );

  const triggerAutosave = useCallback((targetState?: GameState) => {
    const target = targetState ?? stateRef.current;
    if (!target || !target.character.isAlive) return;
    void saveAutosave(
      target,
      lifeGenRef.current,
      actionLogRef.current
    ).catch(() => {});
  }, []);

  useEffect(() => {
    if (state.character.ageYears > prevAgeRef.current && state.character.isAlive) {
      const newAge = state.character.ageYears;
      const milestoneDesc =
        newAge === 6
          ? 'ได้เวลาเข้าโรงเรียนประถมแล้ว'
          : newAge === 15
            ? 'ก้าวสู่วัยรุ่นเต็มตัว เริ่มรับผิดชอบชีวิตมากขึ้น'
            : newAge === 18
              ? 'อายุครบ 18 ปีบริบูรณ์ พ้นสถานะเยาวชนแล้ว'
              : newAge === 60
                ? 'ก้าวเข้าสู่วัยเกษียณอย่างเป็นทางการ'
                : 'ปีใหม่ในชีวิตเริ่มต้นขึ้นแล้ว';
      showNotice(
        {
          kind: 'birthday',
          title: `สุขสันต์วันเกิด อายุครบ ${newAge} ปี`,
          body: milestoneDesc,
          ageYears: newAge,
        },
        3200
      );
    }
    prevAgeRef.current = state.character.ageYears;
  }, [state.character.ageYears, state.character.isAlive, showNotice]);

  useEffect(() => {
    const diff = state.economy.cash - prevCashRef.current;
    prevCashRef.current = state.economy.cash;
    if (Math.abs(diff) >= 500) {
      const sign = diff > 0 ? '+' : '';
      pushFloatingDelta(`${sign}${diff.toLocaleString('th-TH')} ฿`, diff > 0);
    }
  }, [state.economy.cash, pushFloatingDelta]);

  // Fixed-timestep Accumulator Loop (ไม่ข้าม Tick)
  useEffect(() => {
    if (speed === 0 || state.needsPlayer || !state.character.isAlive) {
      return;
    }

    let rafId = 0;
    let lastTs: number | null = null;
    let accumulator = 0;
    let prevSlotBucket = -1;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        lastTs = null;
        accumulator = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const frame = (now: number) => {
      if (document.visibilityState === 'hidden' || speedRef.current === 0) {
        lastTs = null;
        rafId = requestAnimationFrame(frame);
        return;
      }

      if (lastTs === null) {
        lastTs = now;
        rafId = requestAnimationFrame(frame);
        return;
      }

      const dt = Math.max(0, now - lastTs);
      lastTs = now;
      accumulator += dt;

      const msPerTick = BASE_MS_PER_DAY / speedRef.current;
      let current = stateRef.current;
      let stepped = false;

      let safetyLoop = 0;
      let hitNewWeek = false;
      while (accumulator >= msPerTick && safetyLoop < 120) {
        if (!current.character.isAlive || current.needsPlayer) {
          accumulator = 0;
          setPauseReason(!current.character.isAlive ? 'dead' : 'prompt');
          setSpeed(0);
          break;
        }
        const prevDays = current.date.totalDays;
        current = stepOneTick(current, { allowPrompts: true });
        accumulator -= msPerTick;
        stepped = true;
        safetyLoop++;

        // Auto-save every week (every Monday / dayOfWeek === 1)
        if (current.date.dayOfWeek === 1 && current.date.totalDays !== prevDays) {
          hitNewWeek = true;
        }

        if (current.pendingPrompt && current.character.isAlive) {
          const tier = current.pendingPrompt.tier ?? 'T2';
          const activeSpeed = speedRef.current;
          const shouldInterrupt = shouldInterruptWithAttentionBudget({
            lastInterruptMs: lastPromptRealMsRef.current,
            nowMs: Date.now(),
            speed: activeSpeed,
            tier,
            importance: current.pendingPrompt.importance,
          });

          if (!shouldInterrupt && tier !== 'T3') {
            const promptId = current.pendingPrompt.id;
            const autoAction: PlayerAction = { type: 'RESOLVE_AUTOPILOT_PROMPT', promptId };
            const resolved = dispatchPlayerAction(current, autoAction);
            if (resolved.accepted) {
              onRecordAction({ atTotalDay: current.date.totalDays, action: autoAction });
              current = resolved.state;
              continue;
            }
          }

          lastPromptRealMsRef.current = Date.now();
          if (tier === 'T3' || activeSpeed === 20) {
            setLastActiveSpeed(1);
          }
          accumulator = 0;
          setPauseReason('prompt');
          setSpeed(0);
          break;
        }

        if (current.needsPlayer || !current.character.isAlive) {
          accumulator = 0;
          setPauseReason(!current.character.isAlive ? 'dead' : 'prompt');
          setSpeed(0);
          break;
        }
      }

      if (stepped) {
        stateRef.current = current;
        onUpdateState(current);
        if (hitNewWeek) {
          triggerAutosave(current);
        }
      }

      if (
        speedRef.current > 0 &&
        speedRef.current < 5 &&
        !current.needsPlayer &&
        current.character.isAlive
      ) {
        const ratio = Math.max(0, Math.min(0.9999, accumulator / msPerTick));
        const slotBucket = Math.min(3, Math.floor(ratio * 4)) as 0 | 1 | 2 | 3;
        if (slotBucket !== prevSlotBucket) {
          prevSlotBucket = slotBucket;
          setActiveSlotIndex(slotBucket);
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [speed, state.needsPlayer, state.character.isAlive, onUpdateState, triggerAutosave]);

  // Monthly Autosave to IndexedDB
  useEffect(() => {
    if (!state.pendingAutosave) return;
    const payload = buildSavePayload(
      AUTOSAVE_SLOT_ID,
      'บันทึกอัตโนมัติ (สิ้นเดือน)',
      state,
      lifeGenRef.current,
      actionLogRef.current
    );
    void saveToIndexedDB(payload).catch(() => {
      // Ignore if IndexedDB unavailable
    });
    onUpdateState({ ...state, pendingAutosave: false });
  }, [state, onUpdateState]);

  // Enforce x1 speed reset whenever a T3 prompt becomes active (including skip / Dev trigger)
  useEffect(() => {
    if (state.pendingPrompt?.tier === 'T3') {
      setLastActiveSpeed(1);
      setSpeed(0);
      setPauseReason('prompt');
      lastPromptRealMsRef.current = Date.now();
    }
  }, [state.pendingPrompt?.id, state.pendingPrompt?.tier]);

  const handleTogglePlayPause = () => {
    if (!state.character.isAlive || state.needsPlayer) return;
    if (speed > 0) {
      setPauseReason('manual');
      setSpeed(0);
    } else {
      setSpeed(lastActiveSpeed);
    }
  };

  const handleSelectSpeed = (nextSpeed: ActiveSpeed) => {
    if (!state.character.isAlive || state.needsPlayer) return;
    setLastActiveSpeed(nextSpeed);
    setSpeed(nextSpeed);
  };

  const handleDispatch = (action: PlayerAction) => {
    const prevPrompt = stateRef.current.pendingPrompt;
    const prevAutopilot = stateRef.current.pendingAutopilotSituation;
    const prevToastId = stateRef.current.activeToast?.id;
    const res = dispatchPlayerAction(stateRef.current, action);
    if (!res.accepted) {
      if (res.message) {
        showNotice({ kind: 'error', title: 'ทำรายการไม่ได้', body: res.message }, 3000);
      }
      return;
    }

    onRecordAction({ atTotalDay: stateRef.current.date.totalDays, action });
    stateRef.current = res.state;
    onUpdateState(res.state);

    if (action.type === 'RESOLVE_PROMPT' && res.state.character.isAlive) {
      const hasNewFeedbackToast = Boolean(
        res.state.activeToast && res.state.activeToast.id !== prevToastId
      );
      if (hasNewFeedbackToast) {
        if (noticeTimerRef.current !== null) {
          window.clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = null;
        }
        setNotice(null);
      } else {
        const chosen = prevPrompt?.choices.find((c) => c.id === action.choiceId);
        const latestTimeline = res.state.timeline[res.state.timeline.length - 1];
        const summary =
          latestTimeline?.effectsSummary && latestTimeline.effectsSummary.length > 0
            ? latestTimeline.effectsSummary.join(' · ')
            : chosen?.hint ?? 'ตัดสินใจเรียบร้อย ชีวิตเดินหน้าต่อแล้ว';
        showNotice(
          {
            kind: 'outcome',
            title: chosen ? `เลือก: ${chosen.label}` : 'บันทึกการตัดสินใจแล้ว',
            body: summary,
          },
          2700
        );
      }
      if (!res.state.needsPlayer) {
        setSpeed(lastActiveSpeed);
      }
    } else if (action.type === 'RESOLVE_AUTOPILOT' && res.state.character.isAlive) {
      const chosen = prevAutopilot?.options.find((o) => o.id === action.optionId);
      showNotice(
        {
          kind: 'outcome',
          title: chosen ? `เลือก: ${chosen.label}` : 'ตัดสินใจเรียบร้อย',
          body: chosen?.hint ?? 'ระบบเดินหน้าต่อแล้ว',
        },
        2700
      );
      if (!res.state.needsPlayer) {
        setSpeed(lastActiveSpeed);
      }
    } else if (action.type === 'RESOLVE_AUTOPILOT_PROMPT' && res.state.character.isAlive) {
      showNotice(
        {
          kind: 'outcome',
          title: 'ตัวละครตัดสินใจแทนแล้ว',
          body: 'เลือกทางเดินที่สอดคล้องกับนิสัยและคำสั่งประจำให้เรียบร้อย',
        },
        2500
      );
      if (!res.state.needsPlayer) {
        setSpeed(lastActiveSpeed);
      }
    } else if (action.type === 'EXECUTE_GATED_ACTION' && res.message) {
      showNotice(
        {
          kind: 'outcome',
          title: 'ทำกิจกรรมพิเศษสำเร็จ',
          body: res.message,
        },
        3200
      );
    } else if (res.message) {
      showNotice(
        {
          kind: 'outcome',
          title: 'อัปเดตสำเร็จ',
          body: res.message,
        },
        2600
      );
    }

    // Auto-save on prompt resolution or life planner confirmation
    if (
      (action.type === 'RESOLVE_PROMPT' ||
        action.type === 'CONFIRM_LIFE_PLANNER' ||
        (action as { type: string }).type === 'UPDATE_PLANNER') &&
      res.state.character.isAlive
    ) {
      triggerAutosave(res.state);
    }
  };

  // Auto-save immediately on tab switch or screen hide on mobile
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        triggerAutosave();
      }
    };
    const handlePageHide = () => {
      triggerAutosave();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [triggerAutosave]);

  const handleSkip = (target: 'month' | 'year' | 'milestone') => {
    setPauseReason('manual');
    setSpeed(0);
    const next = skipToNextMilestone(stateRef.current, target);
    stateRef.current = next;
    onUpdateState(next);
    if (next.needsPlayer) {
      setPauseReason(next.character.isAlive ? 'prompt' : 'dead');
    }
  };

  const tabs: { id: BottomTab; label: string; icon: PixelIconName }[] = [
    { id: 'home', label: 'หน้าหลัก', icon: 'home' },
    { id: 'life', label: 'ชีวิต', icon: 'life' },
    { id: 'people', label: 'คน', icon: 'people' },
    { id: 'money', label: 'เงิน', icon: 'money' },
    { id: 'journal', label: 'บันทึก', icon: 'journal' },
  ];

  const isPlaying = speed > 0 && !state.needsPlayer && state.character.isAlive;

  const effectiveNotice: NonBlockingNotice | null =
    notice ??
    (state.activeToast
      ? {
          id: state.activeToast.id,
          kind: 'storylet',
          title: state.activeToast.title,
          body: state.activeToast.description,
          onExplain: state.activeToast.storyletId
            ? () => setSelectedExplainKey(`event:${state.activeToast!.storyletId}`)
            : undefined,
        }
      : null);

  return (
    <div className="min-h-screen flex flex-col text-[#3D2D52] dark:text-[#FFF6FA] pb-44 sm:pb-40">
      <TopBar
        state={state}
        isDark={isDark}
        reduceFx={reduceFx}
        fontPreset={fontPreset}
        onToggleTheme={onToggleTheme}
        onToggleReduceFx={onToggleReduceFx}
        onOpenFontSettings={onOpenFontSettings}
        onSkipMonth={() => handleSkip('month')}
        onSkipYear={() => handleSkip('year')}
        onSkipMilestone={() => handleSkip('milestone')}
        onUpdateSettings={(settings) => handleDispatch({ type: 'UPDATE_SETTINGS', settings })}
        onOpenSaveLoad={onOpenSaveLoad}
        onOpenNewLife={onStartNewLife}
        onOpenSceneDebug={onOpenSceneDebug}
        onTriggerStorylet={(storyletId) => handleDispatch({ type: 'TRIGGER_STORYLET', storyletId })}
        onDispatch={handleDispatch}
      />

      <CelebrationToast
        notice={effectiveNotice}
        reduceFx={reduceFx}
        onDismiss={() => (notice ? setNotice(null) : handleDispatch({ type: 'DISMISS_TOAST' }))}
      />

      {/* Main Centered Mobile-First Game Column */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-5 pt-3 sm:pt-4 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="tab-home"
              initial={reduceFx ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceFx ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
            >
              {/* คอลัมน์หลัก (ฉาก + ดัชนี 3x2 + ปุ่มเล่น/หยุด) */}
              <div className="lg:col-span-7 space-y-4 max-w-[520px] lg:max-w-none mx-auto w-full">
                <SceneStage
                  state={state}
                  isPlaying={isPlaying}
                  speed={speed}
                  activeSlotIndex={activeSlotIndex}
                  reduceFx={reduceFx}
                  floatingDeltas={floatingDeltas}
                  sceneSettings={state.settings}
                  onSelectExplain={setSelectedExplainKey}
                />

                <SixIndicesBar
                  state={state}
                  selectedExplainKey={selectedExplainKey}
                  reduceFx={reduceFx}
                  onSelectExplain={setSelectedExplainKey}
                />
              </div>

              {/* คอลัมน์ฟีดเรื่องราว 5 อันดับล่าสุด */}
              <div className="lg:col-span-5 max-w-[520px] lg:max-w-none mx-auto w-full">
                <TimelineFeed
                  entries={state.timeline}
                  limit={5}
                  onShowAll={() => setActiveTab('journal')}
                  onSelectExplain={setSelectedExplainKey}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'life' && (
            <motion.div
              key="tab-life"
              initial={reduceFx ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceFx ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="max-w-3xl mx-auto w-full space-y-4"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLifeSubView('work')}
                  className={`game-btn px-4 py-2.5 font-display font-bold text-sm inline-flex items-center justify-center gap-2 ${
                    lifeSubView === 'work'
                      ? 'bg-[#FFE58F] text-[#3D2D52]'
                      : 'bg-[#FFFDFB] dark:bg-[#2A2247] text-[#3D2D52] dark:text-[#FFF6FA]'
                  }`}
                >
                  <PixelIcon name="briefcase" size={16} />
                  <span>งาน เรียน และเวลา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLifeSubView('me')}
                  className={`game-btn px-4 py-2.5 font-display font-bold text-sm inline-flex items-center justify-center gap-2 ${
                    lifeSubView === 'me'
                      ? 'bg-[#FFE58F] text-[#3D2D52]'
                      : 'bg-[#FFFDFB] dark:bg-[#2A2247] text-[#3D2D52] dark:text-[#FFF6FA]'
                  }`}
                >
                  <PixelIcon name="life" size={16} />
                  <span>ตัวตน นิสัย และทักษะ</span>
                </button>
              </div>
              {lifeSubView === 'work' ? (
                <WorkStudyTab
                  state={state}
                  onDispatch={handleDispatch}
                  onSelectExplain={setSelectedExplainKey}
                />
              ) : (
                <MeTab
                  state={state}
                  onSelectExplain={setSelectedExplainKey}
                  onDispatch={handleDispatch}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'people' && (
            <motion.div
              key="tab-people"
              initial={reduceFx ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceFx ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="max-w-3xl mx-auto w-full"
            >
              <RelationshipsTab state={state} />
            </motion.div>
          )}

          {activeTab === 'money' && (
            <motion.div
              key="tab-money"
              initial={reduceFx ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceFx ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="max-w-3xl mx-auto w-full"
            >
              <FinanceTab
                state={state}
                onDispatch={handleDispatch}
                onSelectExplain={setSelectedExplainKey}
              />
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div
              key="tab-journal"
              initial={reduceFx ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceFx ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="max-w-3xl mx-auto w-full"
            >
              <JournalTab
                state={state}
                onOpenSaveLoad={onOpenSaveLoad}
                onSelectExplain={setSelectedExplainKey}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals & Bottom Sheets */}
      <ChoiceCard
        state={state}
        reduceFx={reduceFx}
        onSelectChoice={(promptId, choiceId) =>
          handleDispatch({ type: 'RESOLVE_PROMPT', promptId, choiceId })
        }
        onResolveAutopilot={(situationId, optionId) =>
          handleDispatch({ type: 'RESOLVE_AUTOPILOT', situationId, optionId })
        }
        onAutopilotSkip={(promptId) =>
          handleDispatch({ type: 'RESOLVE_AUTOPILOT_PROMPT', promptId })
        }
        onSelectExplain={setSelectedExplainKey}
        onClearDigest={() => handleDispatch({ type: 'CLEAR_DIGEST' })}
        onStartNewLife={onStartNewLife}
        onOpenSaveLoad={onOpenSaveLoad}
      />

      <ExplainPanel
        state={state}
        targetKey={selectedExplainKey}
        reduceFx={reduceFx}
        onClose={() => setSelectedExplainKey(null)}
      />

      {/* Global Collapsible Time Controls (visible on every tab) */}
      <TimeControls
        state={state}
        speed={speed}
        lastActiveSpeed={lastActiveSpeed}
        pauseReason={pauseReason}
        onTogglePlayPause={handleTogglePlayPause}
        onSelectSpeed={handleSelectSpeed}
        onSkipMilestone={() => handleSkip('milestone')}
      />

      {/* Bottom 5-tab Pixel Pastel Navigation Dock */}
      <nav
        aria-label="แถบนำทางด้านล่าง"
        className="fixed bottom-0 inset-x-0 z-30 bg-[#FFF2F6]/95 dark:bg-[#2A2247]/95 backdrop-blur-xs border-t-2 border-[#4E3B69] dark:border-[#7662AC] px-window-striped"
      >
        <div className="max-w-xl mx-auto grid grid-cols-5 px-2 py-1.5 gap-1.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-xs font-display font-bold transition-transform active:translate-y-0.5 ${
                  active
                    ? 'px-slot bg-[#FFE58F] text-[#3D2D52] -translate-y-0.5'
                    : 'text-[#76658D] dark:text-[#CBBFE3] border-2 border-transparent hover:bg-[#FFFDFB]/80 dark:hover:bg-[#352B59]'
                }`}
              >
                <PixelIcon name={tab.icon} size={22} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
