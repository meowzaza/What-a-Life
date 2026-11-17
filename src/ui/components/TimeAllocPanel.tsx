import {
  TIME_ALLOC_CATEGORIES,
  TOTAL_WEEKLY_HOURS,
} from '../../data/timeAlloc';
import { UI_TEXT } from '../../data/uiText';
import { getLifeStageForAge } from '../../engine/lifeStage';
import { deriveWeeklyAllocation, createInitialPlannerState } from '../../engine/planner';
import type { GameState, TimeAllocation } from '../../engine/types';
import { PixelIcon } from '../art/PixelIcons';

interface TimeAllocPanelProps {
  state: GameState;
  previewAllocation?: TimeAllocation;
  titleOverride?: string;
}

export function TimeAllocPanel({
  state,
  previewAllocation,
  titleOverride,
}: TimeAllocPanelProps) {
  const { character } = state;
  const stageDef = getLifeStageForAge(character.ageYears);

  const allocation: TimeAllocation =
    previewAllocation ??
    (state.planner?.grid
      ? deriveWeeklyAllocation(state.planner.grid, state)
      : state.timeAllocation ??
        deriveWeeklyAllocation(createInitialPlannerState(state).grid, state));

  const totalHours = TIME_ALLOC_CATEGORIES.reduce(
    (sum, cat) => sum + (allocation[cat.key] ?? 0),
    0
  );

  return (
    <div className="game-card p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PixelIcon name="clock" size={18} />
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA] truncate">
              {titleOverride ?? UI_TEXT.RESOURCES.timeAlloc} (168 ชม./สัปดาห์)
            </h3>
            <p className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
              ช่วง{stageDef.labelTh} · {UI_TEXT.PLANNER.readOnlyHoursHint}
            </p>
          </div>
        </div>
        <div
          className={`px-2.5 py-1 border-2 border-[#4E3B69] font-num tabular-nums text-xs font-extrabold shrink-0 ${
            totalHours === TOTAL_WEEKLY_HOURS
              ? 'bg-[#D6FAEA] text-[#167956]'
              : 'bg-[#FFE0EE] text-[#BD346B]'
          }`}
        >
          รวม: {totalHours} / {TOTAL_WEEKLY_HOURS} ชม.
        </div>
      </div>

      {/* Stacked pastel bar visualizing 168h */}
      <div className="px-progress-track h-4 flex overflow-hidden bg-[#FFF0F6] dark:bg-[#221B3B]">
        {TIME_ALLOC_CATEGORIES.map((cat) => {
          const hrs = allocation[cat.key] ?? 0;
          const pct = Math.max(0, (hrs / TOTAL_WEEKLY_HOURS) * 100);
          return (
            <div
              key={cat.key}
              style={{ width: `${pct}%`, backgroundColor: cat.color }}
              title={`${cat.labelTh}: ${hrs} ชม.`}
              className="h-full border-r border-[#4E3B69]/40 last:border-r-0 transition-all"
            />
          );
        })}
      </div>

      {/* Read-only category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TIME_ALLOC_CATEGORIES.map((cat) => {
          const hrs = allocation[cat.key] ?? 0;
          return (
            <div
              key={cat.key}
              className="px-inset px-3 py-2 bg-[#FFFDFB] dark:bg-[#221B3B] flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 border border-[#4E3B69] shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <div className="font-display font-bold text-xs text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                    {cat.labelTh}
                  </div>
                  <div className="text-[10px] text-[#76658D] dark:text-[#CBBFE3] truncate">
                    {cat.shortDescTh}
                  </div>
                </div>
              </div>
              <span className="font-num tabular-nums font-extrabold text-xs text-[#3D2D52] dark:text-[#FFF6FA] whitespace-nowrap shrink-0">
                {hrs} ชม.
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
