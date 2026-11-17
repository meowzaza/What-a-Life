import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UI_TEXT } from '../../data/uiText';
import {
  getActivitySpeechText,
  getDayPlan,
  getHighlightSlot,
  getSlotActivityLabel,
  getSlotActivityWhereLabel,
} from '../../engine/dayPlan';
import {
  ALL_DAYPARTS,
  type Daypart,
  getSceneModeRemainingDays,
  resolveSceneWithMeta,
  SCENES_BY_ID,
  type SceneSettings,
} from '../../engine/scene';
import type { GameSpeed, GameState } from '../../engine/types';
import { CharacterSprite } from '../art/CharacterSprite';
import { PixelCatMascot, PixelCornerStar, PixelIcon } from '../art/PixelIcons';
import { SceneArt } from '../art/SceneArt';

export interface FloatingDelta {
  id: number;
  text: string;
  positive: boolean;
}

interface SceneStageProps {
  state: GameState;
  isPlaying: boolean;
  speed?: GameSpeed;
  activeSlotIndex?: 0 | 1 | 2 | 3;
  reduceFx: boolean;
  floatingDeltas: FloatingDelta[];
  sceneSettings?: SceneSettings;
  onSelectExplain?: (targetKey: string) => void;
}

const SPEECH_STORAGE_KEY = 'thaigame_speech_collapsed';

const DAYPART_META: Record<Daypart, { label: string; icon: 'sun' | 'moon' }> = {
  morning: { label: UI_TEXT.DAYPARTS.morning, icon: 'sun' },
  afternoon: { label: UI_TEXT.DAYPARTS.afternoon, icon: 'sun' },
  evening: { label: UI_TEXT.DAYPARTS.evening, icon: 'moon' },
  night: { label: UI_TEXT.DAYPARTS.night, icon: 'moon' },
};

export function SceneStage({
  state,
  isPlaying,
  speed = 0,
  activeSlotIndex,
  reduceFx,
  floatingDeltas,
  sceneSettings,
  onSelectExplain,
}: SceneStageProps) {
  const [speechCollapsed, setSpeechCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(SPEECH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [inspectedSlot, setInspectedSlot] = useState<0 | 1 | 2 | 3 | null>(null);

  useEffect(() => {
    if (isPlaying) {
      setInspectedSlot(null);
    }
  }, [isPlaying]);

  useEffect(() => {
    setInspectedSlot(null);
  }, [state.date.totalDays]);

  const toggleSpeech = () => {
    setSpeechCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SPEECH_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const { character, economy } = state;
  const plan = getDayPlan(state, sceneSettings);
  const highlight = getHighlightSlot(plan);
  const isSlowPlay = isPlaying && speed > 0 && speed < 5;

  const displaySlotIdx: 0 | 1 | 2 | 3 = isSlowPlay
    ? (activeSlotIndex ?? highlight.index)
    : !isPlaying
      ? (inspectedSlot ?? highlight.index)
      : highlight.index;

  const resolved = resolveSceneWithMeta(state, {
    settings: sceneSettings,
    slotIndex: displaySlotIdx,
  });

  const sceneId = resolved.sceneId;
  const daypart = resolved.daypart;
  const displaySlot = resolved.slot;
  const sceneMeta = SCENES_BY_ID.get(sceneId);
  const daypartInfo = DAYPART_META[daypart];
  const sceneModeRemaining = getSceneModeRemainingDays(state);
  const speech = getActivitySpeechText(displaySlot, sceneId, state, sceneModeRemaining);
  const hasFallback = Boolean(resolved.fallbackFrom ?? displaySlot.fallbackFrom);

  const activeStayBanner =
    state.sceneMode && sceneModeRemaining !== null && sceneModeRemaining > 0
      ? state.sceneMode.sceneId === 'hospital'
        ? `พักรักษาตัว · ${sceneMeta?.nameTh ?? 'โรงพยาบาล'} (อีก ${sceneModeRemaining} วัน)`
        : `${sceneMeta?.nameTh ?? 'สถานที่ชั่วคราว'} (อีก ${sceneModeRemaining} วัน)`
      : null;

  const headerActivityWhere = activeStayBanner ?? getSlotActivityWhereLabel(displaySlot, state, sceneId);
  const crossfadeMs = isSlowPlay ? (speed >= 3 ? 160 : 300) : 400;

  return (
    <div className="relative pt-[18px]">
      {/* น้องแมวพิกเซลเกาะขอบหน้าต่างบนขวาเมื่อยังมีชีวิต (อยู่นอก clip-path ของ .game-card) */}
      {character.isAlive && (
        <div className="absolute top-0 right-4 z-20 pointer-events-none">
          <PixelCatMascot animate={!reduceFx && isPlaying} />
        </div>
      )}

      <section
        aria-label="ฉากชีวิตปัจจุบัน"
        className="game-card relative overflow-hidden"
      >

      {/* แถบหัวหน้าต่างฉากพาสเทล (Viewfinder Header) */}
      <div className="bg-[#B4C3FF]/90 dark:bg-[#4F5DA8]/90 border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <PixelCornerStar size={12} animate={!reduceFx} />
          <span className="text-xs font-display font-bold text-[#3D2D52] dark:text-[#FFF6FA] truncate">
            {headerActivityWhere}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasFallback && onSelectExplain && (
            <button
              type="button"
              onClick={() => onSelectExplain(`dayplan:slot:${displaySlotIdx}`)}
              title="ดูเหตุผลว่าทำไมระบบพากลับฉากนี้"
              className="px-2 py-0.5 bg-[#FFF3BF] text-[#3D2D52] border-2 border-[#4E3B69] text-[10px] font-display font-extrabold hover:brightness-105 active:translate-y-0.5"
            >
              {UI_TEXT.EXPLAIN_BUTTON}
            </button>
          )}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 bg-[#FFFDFB]/95 dark:bg-[#2A2247]/95 border-2 border-[#4E3B69] dark:border-[#7662AC] text-[11px] font-bold font-num text-[#3D2D52] dark:text-[#FFF6FA]"
            title={`ช่วงเวลา: ${daypartInfo.label}`}
          >
            <PixelIcon name={daypartInfo.icon} size={15} />
            <span>{daypartInfo.label}</span>
          </div>
        </div>
      </div>

      {/* กรอบฉากหลัง Pixel-Art 16:9 */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#1E1833]">
        <SceneArt
          state={state}
          isPlaying={isPlaying}
          reduceFx={reduceFx}
          sceneIdOverride={sceneId}
          daypartOverride={daypart}
          settings={sceneSettings}
          crossfadeMs={crossfadeMs}
        />

        {/* ป๊อปอัปตัวเลขลอย (Juice) - มุมบนขวา */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 pointer-events-none z-20">
          <AnimatePresence>
            {floatingDeltas.map((d) => (
              <motion.div
                key={d.id}
                initial={reduceFx ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.85 }}
                animate={reduceFx ? { opacity: 1 } : { opacity: 1, y: -14, scale: 1 }}
                exit={reduceFx ? { opacity: 0 } : { opacity: 0, y: -28 }}
                transition={{ duration: 0.9 }}
                className={`px-slot px-2.5 py-1 text-xs font-bold font-num ${
                  d.positive
                    ? 'bg-[#D6FAEA] text-[#167956]'
                    : 'bg-[#FFE0EE] text-[#BD346B]'
                }`}
              >
                {d.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* บอลลูนคำพูด RPG Pixel อยู่มุมล่างขวาในกรอบฉาก พร้อมปุ่มย่อ/ขยาย */}
        <div className="absolute bottom-2.5 right-2.5 z-20 max-w-[230px] sm:max-w-[320px]">
          {speechCollapsed ? (
            <button
              type="button"
              onClick={toggleSpeech}
              aria-label="แสดงกล่องคำพูด"
              title="แสดงกล่องคำพูด"
              className="px-slot px-2.5 py-1.5 bg-[#FFFDFB]/95 dark:bg-[#2A2247]/95 text-[#3D2D52] dark:text-[#FFF6FA] inline-flex items-center gap-1.5 text-[11px] font-display font-bold hover:brightness-105 active:translate-y-0.5 shadow-[0_2px_0_rgba(78,59,105,0.25)]"
            >
              <PixelIcon name="chat" size={14} />
              <span>คำพูด</span>
            </button>
          ) : (
            <div className="relative">
              {/* ติ่งบอลลูนคำพูดชี้ไปทางตัวละครด้านซ้าย */}
              <div
                className="hidden sm:block absolute -left-2 bottom-4 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-[#4E3B69] dark:border-r-[#7662AC]"
                aria-hidden="true"
              >
                <div className="absolute -top-[5px] left-[2px] w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-[#FFFDFB] dark:border-r-[#2A2247]" />
              </div>

              <div className="px-slot relative bg-[#FFFDFB] dark:bg-[#2A2247] px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-[0_2px_0_rgba(78,59,105,0.3)]">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <div className="text-[11px] font-bold text-[#BD346B] dark:text-[#FFB8D4] truncate">
                    {getSlotActivityLabel(displaySlot, state)} · {sceneMeta?.nameTh ?? `จ.${character.background.province}`}
                  </div>
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    aria-label="ย่อกล่องคำพูด"
                    title="ย่อกล่องคำพูด"
                    className="w-5 h-5 bg-[#FFF0F6] dark:bg-[#352B59] border-2 border-[#4E3B69] dark:border-[#7662AC] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center shrink-0 hover:brightness-95 active:translate-y-0.5"
                  >
                    <PixelIcon name="minus" size={10} />
                  </button>
                </div>
                <p className="text-xs sm:text-[13px] font-medium text-[#3D2D52] dark:text-[#FFF6FA] leading-snug line-clamp-2">
                  {speech}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ตัวละครยืนติดพื้นทางเท้า/ถนน (ไม่ลอยในอากาศ) ทางด้านซ้าย */}
        <div
          className="absolute z-10 drop-shadow-[0_4px_0_rgba(78,59,105,0.45)] pointer-events-none"
          style={{ bottom: '6px', left: '16px' }}
        >
          <CharacterSprite
            charId={character.appearance?.charId}
            mode="full"
            size={104}
            animate={isPlaying && !reduceFx}
            seed={state.seed}
            gender={character.gender}
            ageYears={character.ageYears}
            mentalIndex={character.indices.mental}
            jobId={economy.jobId}
          />
        </div>
      </div>

      {/* แถบ 4 ช่องเวลา (เช้า / บ่าย / เย็น / ดึก) ตอนหยุดเวลาให้กดดูแต่ละช่องได้ */}
      {!isPlaying && (
        <div className="bg-[#FFF8FA] dark:bg-[#231C3D] border-t-2 border-[#4E3B69] dark:border-[#7662AC] px-2.5 py-1.5 grid grid-cols-4 gap-1.5">
          {ALL_DAYPARTS.map((dp, idx) => {
            const slotIdx = idx as 0 | 1 | 2 | 3;
            const slot = plan[slotIdx];
            const meta = DAYPART_META[dp];
            const active = displaySlotIdx === slotIdx;
            const slotSceneName = SCENES_BY_ID.get(slot.sceneId)?.nameTh ?? slot.sceneId;
            return (
              <button
                key={dp}
                type="button"
                onClick={() => setInspectedSlot(slotIdx)}
                title={`${meta.label}: ${getSlotActivityLabel(slot, state)} · ${slotSceneName}`}
                className={`px-1.5 py-1 border-2 text-[11px] font-display font-bold flex items-center justify-center gap-1 transition-transform active:translate-y-0.5 ${
                  active
                    ? 'bg-[#FFE58F] text-[#3D2D52] border-[#4E3B69] shadow-[0_2px_0_rgba(78,59,105,0.2)]'
                    : 'bg-[#FFFDFB] dark:bg-[#352B59] text-[#5A4773] dark:text-[#CBBFE3] border-[#4E3B69]/40 dark:border-[#7662AC]/60 hover:brightness-98'
                }`}
              >
                <PixelIcon name={meta.icon} size={13} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}
      </section>
    </div>
  );
}
