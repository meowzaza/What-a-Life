import { useState } from 'react';
import type { GameSpeed, GameState } from '../../engine/types';
import { PixelIcon } from '../art/PixelIcons';

export type ActiveSpeed = Exclude<GameSpeed, 0>;
export type PauseReason = 'initial' | 'manual' | 'prompt' | 'dead';

interface TimeControlsProps {
  state: GameState;
  speed: GameSpeed;
  lastActiveSpeed: ActiveSpeed;
  pauseReason: PauseReason;
  onTogglePlayPause: () => void;
  onSelectSpeed: (s: ActiveSpeed) => void;
  onSkipMilestone?: () => void;
}

const SPEEDS: ActiveSpeed[] = [1, 3, 5, 10, 20];
const COLLAPSED_STORAGE_KEY = 'thaigame_time_controls_collapsed';

export function TimeControls({
  state,
  speed,
  lastActiveSpeed,
  pauseReason,
  onTogglePlayPause,
  onSelectSpeed,
  onSkipMilestone,
}: TimeControlsProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const blocked = !state.character.isAlive || state.needsPlayer;
  const isPlaying = speed > 0 && !blocked;

  const statusText = !state.character.isAlive
    ? 'จบเส้นทางชีวิต'
    : state.pendingAutopilotSituation || state.needsPlayer
      ? 'รอตัดสินใจ'
      : isPlaying
        ? `เดินเวลา x${speed}`
        : pauseReason === 'initial'
          ? 'พร้อมเริ่ม'
          : 'เวลาหยุดอยู่';

  return (
    <section
      aria-label="ควบคุมเวลาในเกม"
      className="fixed bottom-[64px] inset-x-0 z-20 px-2 pb-1 pointer-events-none"
    >
      <div className="max-w-xl mx-auto flex justify-end">
        {collapsed ? (
          <div className="pointer-events-auto game-card-sm px-2 py-1.5 bg-[#FFFDFB]/95 dark:bg-[#2A2247]/95 flex items-center gap-1.5 shadow-[0_2px_10px_rgba(30,24,51,0.18)]">
            <button
              type="button"
              onClick={onTogglePlayPause}
              disabled={blocked}
              aria-label={isPlaying ? 'หยุดเวลา' : 'เดินเวลาต่อ'}
              className={`game-btn min-h-[36px] w-9 h-9 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                isPlaying
                  ? 'bg-[#FF8DA8] text-[#FFFDFB]'
                  : 'bg-[#6EE7B7] text-[#165940]'
              }`}
            >
              <PixelIcon name={isPlaying ? 'pause' : 'play'} size={16} />
            </button>

            <span className="px-1.5 text-xs font-display font-bold font-num text-[#3D2D52] dark:text-[#FFF6FA] whitespace-nowrap">
              {isPlaying ? `x${speed}` : 'หยุด'}
            </span>

            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="ขยายแถบควบคุมเวลา"
              title="ขยายแถบควบคุมเวลา"
              className="game-btn min-h-[36px] px-2 py-1 bg-[#FFE58F] text-[#3D2D52] text-[11px] font-display font-extrabold inline-flex items-center gap-1 shrink-0"
            >
              <PixelIcon name="clock" size={13} />
              <span>เวลา</span>
              <PixelIcon name="chevron_up" size={12} />
            </button>
          </div>
        ) : (
          <div className="w-full pointer-events-auto game-card px-2.5 py-2 sm:px-3.5 sm:py-2.5 px-window-striped space-y-1.5 shadow-[0_-2px_12px_rgba(30,24,51,0.16)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={onTogglePlayPause}
                  disabled={blocked}
                  aria-label={isPlaying ? 'หยุดเวลา' : 'เดินเวลาต่อ'}
                  className={`game-btn min-h-[40px] w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                    isPlaying
                      ? 'bg-[#FF8DA8] text-[#FFFDFB]'
                      : 'bg-[#6EE7B7] text-[#165940]'
                  }`}
                >
                  <PixelIcon name={isPlaying ? 'pause' : 'play'} size={18} />
                </button>

                <div className="hidden sm:block min-w-0">
                  <div className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                    {statusText}
                  </div>
                  <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] truncate">
                    {isPlaying
                      ? 'แตะปุ่มเพื่อพักจังหวะ'
                      : `ความเร็วที่ตั้งไว้: x${lastActiveSpeed}`}
                  </div>
                </div>
              </div>

              {/* ปุ่มความเร็ว x1..x20 + ปุ่มข้าม + ปุ่มย่อ */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 sm:flex-initial justify-end min-w-0">
                {SPEEDS.map((s) => {
                  const selected = (isPlaying ? speed : lastActiveSpeed) === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={blocked}
                      onClick={() => onSelectSpeed(s)}
                      className={`min-h-[38px] sm:min-h-[40px] min-w-[32px] sm:min-w-[38px] px-1.5 sm:px-2 text-xs font-bold font-num transition-transform active:translate-y-0.5 disabled:opacity-40 ${
                        selected
                          ? 'px-slot bg-[#FFE58F] text-[#3D2D52]'
                          : 'px-inset bg-[#FFFDFB] dark:bg-[#352B59] text-[#76658D] dark:text-[#CBBFE3] hover:brightness-98'
                      }`}
                    >
                      x{s}
                    </button>
                  );
                })}
                {onSkipMilestone && (
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={onSkipMilestone}
                    title="ข้ามไปเหตุการณ์สำคัญถัดไปพร้อมสรุปช่วงที่ผ่านมา"
                    className="game-btn px-2 sm:px-2.5 min-h-[38px] sm:min-h-[40px] bg-[#EAE2FF] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] text-xs font-display font-bold inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
                  >
                    <PixelIcon name="fast_forward" size={14} />
                    <span className="hidden sm:inline">ข้าม</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="ย่อแถบควบคุมเวลา"
                  title="ย่อแถบควบคุมเวลา"
                  className="game-btn px-1.5 sm:px-2 min-h-[38px] sm:min-h-[40px] bg-[#FFFDFB] dark:bg-[#352B59] text-[#5A4773] dark:text-[#DDD6FE] text-[11px] font-display font-bold inline-flex items-center gap-0.5 shrink-0"
                >
                  <PixelIcon name="chevron_down" size={13} />
                  <span className="hidden sm:inline">ย่อ</span>
                </button>
              </div>
            </div>

            {/* แถบสถานะย่อเมื่อหยุดเวลาเองบนมือถือ */}
            {speed === 0 && pauseReason === 'manual' && !blocked && (
              <div className="sm:hidden px-2 py-1 bg-[#FFF3BF] dark:bg-[#4A3A1B] border border-[#4E3B69]/45 text-[11px] font-semibold text-[#5A3F73] dark:text-[#FFE58F] flex items-center justify-between gap-2">
                <span>เวลาหยุดอยู่ · กดเล่นต่อเพื่อเดิน x{lastActiveSpeed}</span>
                {onSkipMilestone && (
                  <button
                    type="button"
                    onClick={onSkipMilestone}
                    className="font-bold underline text-[#3D2D52] dark:text-[#FFF6FA] shrink-0"
                  >
                    ข้ามไปจุดสำคัญ
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
