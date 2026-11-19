import { UI_TEXT } from '../../../data/uiText';
import { cleanDisplayReason } from '../../../engine/explain';
import type { GameState } from '../../../engine/types';
import { PixelIcon } from '../../art/PixelIcons';
import { TimelineFeed } from '../TimelineFeed';

interface JournalTabProps {
  state: GameState;
  onOpenSaveLoad: () => void;
  onSelectExplain?: (targetKey: string) => void;
}

export function JournalTab({ state, onOpenSaveLoad, onSelectExplain }: JournalTabProps) {
  const recentLogs = state.statLogs.slice(-30).reverse();
  const lifeHistory = state.character.lifeHistory ?? [];

  return (
    <div className="space-y-4">
      <div className="game-card p-4 flex flex-wrap items-center justify-between gap-3 px-window-striped">
        <div>
          <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA] flex items-center gap-2">
            <PixelIcon name="journal" size={18} />
            <span>บันทึกชีวิตทั้งหมด</span>
          </h3>
          <p className="text-xs text-[#76658D] dark:text-[#CBBFE3] mt-0.5 font-num">
            ผ่านมาแล้ว {state.date.totalDays.toLocaleString('th-TH')} วัน · รหัสชีวิต #{state.seed}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSaveLoad}
          className="game-btn px-4 text-xs font-display font-extrabold bg-[#FF8DA8] text-[#3D2D52] inline-flex items-center gap-2"
        >
          <PixelIcon name="folder" size={16} />
          <span>เซฟ / โหลด</span>
        </button>
      </div>

      {/* ประวัติชีวิตและจุดเปลี่ยนที่ผ่านมา (Life History) */}
      <div className="game-card p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PixelIcon name="life" size={18} />
            <h4 className="font-display font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
              {UI_TEXT.PHASE331.lifeHistoryHeading}
            </h4>
          </div>
          <span className="text-xs text-[#76658D] dark:text-[#CBBFE3] font-num font-bold">
            {lifeHistory.length} รายการ
          </span>
        </div>
        {lifeHistory.length === 0 ? (
          <p className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
            {UI_TEXT.PHASE331.lifeHistoryEmpty}
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {lifeHistory.map((item) => (
              <li
                key={item.id}
                className="px-inset p-2.5 bg-[#FFFDFB] dark:bg-[#221B3B] text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                    {item.titleTh}
                  </span>
                  <span className="text-[11px] font-num text-[#76658D] dark:text-[#CBBFE3] shrink-0">
                    {item.dateLabel} · อายุ {item.ageYears} ปี
                  </span>
                </div>
                {item.detailTh && (
                  <p className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE]">
                    {item.detailTh}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* คิวผลสะท้อน (Echo Queue) */}
      <div className="game-card p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <PixelIcon name="clock" size={18} />
          <h4 className="font-display font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
            เรื่องที่กำลังรอผลสะท้อน
          </h4>
        </div>
        {state.echoQueue.length === 0 ? (
          <p className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
            ยังไม่มีเรื่องค้างคาจากการตัดสินใจในตอนนี้
          </p>
        ) : (
          <ul className="space-y-2">
            {state.echoQueue.map((echo) => {
              const daysLeft = Math.max(0, echo.triggerOnDay - state.date.totalDays);
              return (
                <li
                  key={echo.id}
                  className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                      ผลพวงจากการตัดสินใจก่อนหน้า
                    </div>
                    <div className="text-[#76658D] dark:text-[#CBBFE3]">
                      กำลังรอส่งผลในอีกไม่นาน
                    </div>
                  </div>
                  <span className="font-num font-bold text-[#BD346B] dark:text-[#FFB8D4] shrink-0">
                    อีก {daysLeft} วัน
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ฟีดเหตุการณ์ทั้งหมด */}
      <TimelineFeed entries={state.timeline} limit={0} onSelectExplain={onSelectExplain} />

      {/* บัญชีตัวเลขล่าสุด */}
      <div className="game-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
            รายการเปลี่ยนแปลงตัวเลขล่าสุด
          </h4>
          <span className="text-xs text-[#76658D] dark:text-[#CBBFE3] font-num">
            {recentLogs.length} รายการ
          </span>
        </div>
        {recentLogs.length === 0 ? (
          <div className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
            ยังไม่มีรายการเปลี่ยนแปลง
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {recentLogs.map((log, idx) => (
              <div
                key={`${log.id}_${idx}`}
                className="px-3 py-2 bg-[#FFFDFB] dark:bg-[#221B3B] border-2 border-[#4E3B69]/25 dark:border-[#7662AC]/55 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {cleanDisplayReason(log.reason) ?? log.reason}
                  </div>
                  <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] font-num">
                    {log.dateLabel}
                  </div>
                </div>
                <span
                  className={`font-bold font-num shrink-0 ${
                    log.delta > 0
                      ? 'text-[#167956] dark:text-[#7EF4C2]'
                      : 'text-[#BD346B] dark:text-[#FFB8D4]'
                  }`}
                >
                  {log.delta > 0 ? `+${log.delta.toLocaleString('th-TH')}` : log.delta.toLocaleString('th-TH')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
