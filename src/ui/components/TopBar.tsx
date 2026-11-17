import { useState } from 'react';
import { STORYLET_CATALOG } from '../../data/storylets/catalog';
import { PLANNER_STORYLETS } from '../../data/storylets/plannerStorylets';
import { formatThaiDate, getMonthProgressRatio } from '../../engine/clock';
import { getLifeStageForAge } from '../../engine/lifeStage';
import type { EventTier, GameSettings, GameState, PlayerAction } from '../../engine/types';
import { Avatar } from '../art/Avatar';
import { PixelCornerStar, PixelIcon } from '../art/PixelIcons';
import { type FontPresetId, getFontPreset } from '../fonts';

interface TopBarProps {
  state: GameState;
  isDark: boolean;
  reduceFx: boolean;
  fontPreset: FontPresetId;
  onToggleTheme: () => void;
  onToggleReduceFx: () => void;
  onOpenFontSettings: () => void;
  onSkipMonth: () => void;
  onSkipYear: () => void;
  onSkipMilestone: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onOpenSaveLoad: () => void;
  onOpenNewLife: () => void;
  onOpenSceneDebug?: () => void;
  onTriggerStorylet?: (storyletId: string) => void;
  onDispatch?: (action: PlayerAction) => void;
}

const PLANNER_STORYLET_ID_SET = new Set(PLANNER_STORYLETS.map((s) => s.id));

export function TopBar({
  state,
  isDark,
  reduceFx,
  fontPreset,
  onToggleTheme,
  onToggleReduceFx,
  onOpenFontSettings,
  onSkipMonth,
  onSkipYear,
  onSkipMilestone,
  onUpdateSettings,
  onOpenSaveLoad,
  onOpenNewLife,
  onOpenSceneDebug,
  onTriggerStorylet,
  onDispatch,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [devTriggerOpen, setDevTriggerOpen] = useState(false);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'PLANNER24' | EventTier>('ALL');
  const { character, date } = state;
  const progressRatio = getMonthProgressRatio(date);
  const segments = 6;
  const activeSegments = Math.max(1, Math.round(progressRatio * segments));
  const disabledTime = !character.isAlive || state.needsPlayer;
  const currentFontMeta = getFontPreset(fontPreset);
  const stageDef = getLifeStageForAge(character.ageYears);
  const pubVisitAge = state.settings?.pubVisitAge ?? 20;

  const filteredStorylets = STORYLET_CATALOG.filter((s) =>
    tierFilter === 'ALL'
      ? true
      : tierFilter === 'PLANNER24'
        ? PLANNER_STORYLET_ID_SET.has(s.id)
        : s.tier === tierFilter
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FFB8D2]/95 dark:bg-[#2A2247]/95 backdrop-blur-xs border-b-2 border-[#4E3B69] dark:border-[#7662AC] shadow-[0_3px_0_rgba(78,59,105,0.18)]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* ซ้าย: Avatar + ชื่อเล่น + ป้ายอายุ + ช่วงวัย */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              seed={state.seed}
              gender={character.gender}
              ageYears={character.ageYears}
              mentalIndex={character.indices.mental}
              jobId={state.economy.jobId}
              appearanceId={character.appearance?.charId}
              size={46}
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-display font-extrabold text-base truncate text-[#3D2D52] dark:text-[#FFF6FA] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-none">
                  {character.nickname}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold font-num bg-[#FFE58F] text-[#3D2D52] border-2 border-[#4E3B69] shadow-[inset_0_1px_0_#FFFDF4] shrink-0">
                  {character.ageYears} ปี
                </span>
                <span
                  className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold text-[#3D2D52] border-2 border-[#4E3B69] shrink-0"
                  style={{ backgroundColor: stageDef.badgeColor }}
                >
                  {stageDef.shortLabelTh}
                </span>
              </div>
              <div className="text-xs font-semibold text-[#5A3F73] dark:text-[#CBBFE3] truncate font-num">
                {formatThaiDate(date)}
              </div>
            </div>
          </div>

          {/* ขวา: เกจความคืบหน้ารายเดือน + ปุ่มเมนู */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="px-slot flex items-center gap-2 px-2.5 py-1.5 bg-[#FFFDFB] dark:bg-[#352B59]"
              title={`วันที่ ${date.day} ของเดือน`}
            >
              <PixelIcon name="clock" size={18} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold font-num leading-none text-[#3D2D52] dark:text-[#FFF6FA]">
                  เดือน {date.month}
                </span>
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: segments }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-1.5 border border-[#4E3B69]/60 dark:border-[#7662AC]/80 ${
                        i < activeSegments
                          ? 'bg-[#FF8DA8] dark:bg-[#FF94B2]'
                          : 'bg-[#FFF0F6] dark:bg-[#221B3B]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="เปิดเมนูเกม"
              className="game-btn px-3 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] inline-flex items-center justify-center gap-1.5 font-display font-bold text-sm"
            >
              <PixelIcon name="menu" size={18} />
              <span className="hidden sm:inline">เมนู</span>
            </button>
          </div>
        </div>
      </header>

      {/* Drawer เมนูเกม */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="เมนูตั้งค่าเกม"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1E1833]/65 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="game-card w-full sm:max-w-md overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#FFB8D2] dark:bg-[#8E4A6F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <PixelCornerStar size={14} animate={!reduceFx} />
                <h2 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                  เมนูและตัวช่วยเวลา
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="ปิดเมนู"
                className="game-btn w-11 h-11 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center"
              >
                <PixelIcon name="close" size={18} />
              </button>
            </div>

            <div className="p-4 space-y-2.5 px-window-striped overflow-y-auto">
              <button
                type="button"
                disabled={disabledTime}
                onClick={() => {
                  onSkipMilestone();
                  setMenuOpen(false);
                }}
                className="game-btn w-full px-4 py-3 bg-[#D6FAEA] dark:bg-[#194736] text-[#165940] dark:text-[#7EF4C2] flex items-center justify-between text-sm font-bold disabled:opacity-40"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name="sparkle" size={18} />
                  <span>ข้ามไปเหตุการณ์สำคัญ</span>
                </span>
                <span className="text-xs font-num">พร้อมสรุปช่วงชีวิต</span>
              </button>

              <button
                type="button"
                disabled={disabledTime}
                onClick={() => {
                  onSkipMonth();
                  setMenuOpen(false);
                }}
                className="game-btn w-full px-4 py-3 bg-[#FFF8E6] dark:bg-[#352B59] flex items-center justify-between text-sm font-semibold disabled:opacity-40"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name="fast_forward" size={18} />
                  <span>ข้ามไปสิ้นเดือนถัดไป</span>
                </span>
                <span className="text-xs font-num text-[#76658D] dark:text-[#CBBFE3]">1 เดือน</span>
              </button>

              <button
                type="button"
                disabled={disabledTime}
                onClick={() => {
                  onSkipYear();
                  setMenuOpen(false);
                }}
                className="game-btn w-full px-4 py-3 bg-[#F4F0FF] dark:bg-[#352B59] flex items-center justify-between text-sm font-semibold disabled:opacity-40"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name="fast_forward" size={18} />
                  <span>ข้ามไปวันเกิดปีหน้า</span>
                </span>
                <span className="text-xs font-num text-[#76658D] dark:text-[#CBBFE3]">1 ปี</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ pubVisitAge: pubVisitAge === 20 ? 18 : 20 })}
                className="game-btn w-full px-4 py-3 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name="shield" size={18} />
                  <span>เกณฑ์อายุเข้าสถานบันเทิง</span>
                </span>
                <span className="text-xs font-bold font-num text-[#BD346B] dark:text-[#FFB8D4]">
                  {pubVisitAge} ปี+
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenSaveLoad();
                  setMenuOpen(false);
                }}
                className="game-btn w-full px-4 py-3 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name="folder" size={18} />
                  <span>เซฟ / โหลดเกม</span>
                </span>
                <span className="text-xs font-num text-[#76658D] dark:text-[#CBBFE3]">4 ช่อง</span>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                className="game-btn w-full px-4 py-3 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name={isDark ? 'sun' : 'moon'} size={18} />
                  <span>ธีมสีหน้าจอ</span>
                </span>
                <span className="text-xs font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                  {isDark ? 'โหมดกลางคืน' : 'โหมดพาสเทลสว่าง'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenFontSettings();
                }}
                className="game-btn w-full px-4 py-3 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name="font" size={18} />
                  <span>แบบอักษร (ฟอนต์)</span>
                </span>
                <span className="text-xs font-bold text-[#663FB5] dark:text-[#DDD2FE] truncate max-w-[145px]">
                  {currentFontMeta.name}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleReduceFx}
                className="game-btn w-full px-4 py-3 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <PixelIcon name="sparkle" size={18} />
                  <span>เอฟเฟกต์เด้ง/เคลื่อนไหว</span>
                </span>
                <span className="text-xs font-bold text-[#76658D] dark:text-[#CBBFE3]">
                  {reduceFx ? 'ปิดไว้ (ประหยัดสายตา)' : 'เปิดอยู่'}
                </span>
              </button>

              {onTriggerStorylet && (
                <button
                  type="button"
                  disabled={!character.isAlive}
                  onClick={() => {
                    setMenuOpen(false);
                    setDevTriggerOpen(true);
                  }}
                  className="game-btn w-full px-4 py-3 bg-[#FFF3BF] dark:bg-[#4A3A1B] flex items-center justify-between text-sm font-semibold disabled:opacity-40"
                >
                  <span className="flex items-center gap-2.5">
                    <PixelIcon name="lightning" size={18} />
                    <span>เรียกเหตุการณ์ทดสอบ (Dev)</span>
                  </span>
                  <span className="text-xs font-bold font-num text-[#9A6708] dark:text-[#FFE58F]">
                    {STORYLET_CATALOG.length} ใบ
                  </span>
                </button>
              )}

              {onOpenSceneDebug && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSceneDebug();
                  }}
                  className="game-btn w-full px-4 py-3 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between text-sm font-semibold"
                >
                  <span className="flex items-center gap-2.5">
                    <PixelIcon name="star" size={18} />
                    <span>ดีบักระบบฉาก (Scene Debug)</span>
                  </span>
                  <span className="text-xs font-bold font-num text-[#167956] dark:text-[#7EF4C2]">
                    21 ฉาก
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenNewLife();
                }}
                className="game-btn w-full px-4 py-3 bg-[#FF8DA8] text-[#3D2D52] flex items-center justify-center gap-2 text-sm font-display font-extrabold"
              >
                <PixelIcon name="plus" size={18} />
                <span>เริ่มต้นชีวิตใหม่</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dev Modal เลือก Storylet บังคับเกิดเหตุการณ์ */}
      {devTriggerOpen && onTriggerStorylet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="เรียกเหตุการณ์ทดสอบ Storylet"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1833]/65 backdrop-blur-xs p-3 sm:p-4"
          onClick={() => setDevTriggerOpen(false)}
        >
          <div
            className="game-card w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#FFE58F] dark:bg-[#7A5B1F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-3 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <PixelIcon name="lightning" size={16} />
                <h2 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                  เรียกเหตุการณ์ทดสอบ (Storylet Dev Trigger)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDevTriggerOpen(false)}
                aria-label="ปิดหน้าต่างทดสอบ"
                className="game-btn w-10 h-10 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center"
              >
                <PixelIcon name="close" size={16} />
              </button>
            </div>

            <div className="p-3 border-b-2 border-dashed border-[#4E3B69]/25 bg-[#FFF8E6] dark:bg-[#221B3B] space-y-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'PLANNER24', 'T0', 'T1', 'T2', 'T3'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTierFilter(tier)}
                    className={`px-2.5 py-1 text-xs font-bold font-num border-2 border-[#4E3B69] ${
                      tierFilter === tier
                        ? 'bg-[#FF8DA8] text-[#3D2D52]'
                        : 'bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA]'
                    }`}
                  >
                    {tier === 'ALL'
                      ? `ทั้งหมด (${STORYLET_CATALOG.length})`
                      : tier === 'PLANNER24'
                        ? `ตารางชีวิต (${PLANNER_STORYLETS.length})`
                        : tier}
                  </button>
                ))}
              </div>

              {onDispatch && (
                <div className="space-y-1.5 pt-1.5 border-t border-dashed border-[#4E3B69]/20 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-bold text-[#3D2D52] dark:text-[#FFF6FA] mr-1">Flags:</span>
                    {(['has_child', 'stream_unlocked', 'competition_unlocked', 'freelance_unlocked'] as const).map((flg) => {
                      const active = Boolean(character.flags?.[flg]);
                      return (
                        <button
                          key={flg}
                          type="button"
                          onClick={() => onDispatch({ type: 'DEV_TOGGLE_FLAG', flag: flg })}
                          className={`px-2 py-0.5 font-num font-bold border border-[#4E3B69] ${
                            active
                              ? 'bg-[#6EE7B7] text-[#165940]'
                              : 'bg-[#FFFDFB] dark:bg-[#352B59] text-[#5A4773] dark:text-[#DDD6FE]'
                          }`}
                        >
                          {flg}: {active ? 'ON' : 'OFF'}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-bold text-[#3D2D52] dark:text-[#FFF6FA] mr-1">Streaks:</span>
                    <button
                      type="button"
                      onClick={() => onDispatch({ type: 'DEV_SET_PLANNER_STREAKS', patch: { workoutWeeks: 8 } })}
                      className="px-2 py-0.5 bg-[#DCEBFF] text-[#2559B8] border border-[#4E3B69] font-bold font-num"
                    >
                      workout=8
                    </button>
                    <button
                      type="button"
                      onClick={() => onDispatch({ type: 'DEV_SET_PLANNER_STREAKS', patch: { overtimeWeeks: 8 } })}
                      className="px-2 py-0.5 bg-[#DCEBFF] text-[#2559B8] border border-[#4E3B69] font-bold font-num"
                    >
                      overtime=8
                    </button>
                    <button
                      type="button"
                      onClick={() => onDispatch({ type: 'DEV_SET_PLANNER_STREAKS', patch: { presetWeeks: 12 } })}
                      className="px-2 py-0.5 bg-[#DCEBFF] text-[#2559B8] border border-[#4E3B69] font-bold font-num"
                    >
                      preset=12
                    </button>
                    <button
                      type="button"
                      onClick={() => onDispatch({ type: 'DEV_SET_PLANNER_STREAKS', patch: { sleepDeficitWeeks: 4 } })}
                      className="px-2 py-0.5 bg-[#FFE0EE] text-[#962253] border border-[#4E3B69] font-bold font-num"
                    >
                      sleepDeficit=4
                    </button>
                    <button
                      type="button"
                      onClick={() => onDispatch({ type: 'DEV_SET_PLANNER_STREAKS', patch: { clubWeeks: 8 } })}
                      className="px-2 py-0.5 bg-[#DCEBFF] text-[#2559B8] border border-[#4E3B69] font-bold font-num"
                    >
                      club=8
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDispatch({ type: 'DEV_TRIGGER_ANNUAL_FOCUS_PROMPT' });
                        setDevTriggerOpen(false);
                      }}
                      className="px-2 py-0.5 bg-[#FFE58F] text-[#3D2D52] border border-[#4E3B69] font-bold"
                    >
                      เปิดการ์ดเป้าหมายปี (13+)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 space-y-2 overflow-y-auto px-window-striped">
              {filteredStorylets.map((s) => {
                const blockedMinor =
                  character.isMinor &&
                  (s.isAdultContent || (s.category === 'romance' && !s.conditions?.isMinorSafe));
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={blockedMinor}
                    onClick={() => {
                      onTriggerStorylet(s.id);
                      setDevTriggerOpen(false);
                    }}
                    className={`game-btn w-full text-left px-3.5 py-2.5 space-y-1 ${
                      blockedMinor
                        ? 'bg-[#EAE6F3] dark:bg-[#262040] opacity-55 cursor-not-allowed'
                        : 'bg-[#FFFDFB] dark:bg-[#352B59] hover:bg-[#FFF0F6] dark:hover:bg-[#41356B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                        {s.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#DCEBFF] text-[#2559B8] border border-[#4E3B69]">
                          {s.category}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold font-num bg-[#FFE58F] text-[#3D2D52] border border-[#4E3B69]">
                          {s.tier}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] font-num text-[#76658D] dark:text-[#CBBFE3] flex items-center justify-between">
                      <span>{s.id}</span>
                      {blockedMinor && <span className="text-[#BD346B]">ล็อกผู้เยาว์ (&lt;18)</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
