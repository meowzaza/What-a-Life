import type { TimelineEntry } from '../../engine/types';
import { UI_TEXT } from '../../data/uiText';
import { PixelCornerStar, PixelIcon, type PixelIconName } from '../art/PixelIcons';
import { TIMELINE_CATEGORY_META } from '../theme';

interface TimelineFeedProps {
  entries: TimelineEntry[];
  limit?: number;
  onShowAll?: () => void;
  onSelectExplain?: (targetKey: string) => void;
}

function isDevModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.search.includes('dev') || window.location.search.includes('debug');
}

const CATEGORY_ICON_MAP: Record<TimelineEntry['category'], PixelIconName> = {
  life: 'sparkle',
  work: 'briefcase',
  finance: 'coin',
  health: 'heart',
  milestone: 'star',
  echo: 'clock',
  trait: 'heart',
  autopilot: 'lightning',
  romance: 'heart',
  family: 'home',
  social: 'people',
  quirky: 'sparkle',
  system: 'star',
};

export function TimelineFeed({
  entries,
  limit = 5,
  onShowAll,
  onSelectExplain,
}: TimelineFeedProps) {
  const reversed = entries.slice().reverse();
  const visible = limit > 0 ? reversed.slice(0, limit) : reversed;

  return (
    <section
      aria-label={UI_TEXT.TIMELINE_TITLE}
      className="game-card overflow-hidden"
    >
      {/* หัวสมุดบันทึกไดอารี่พาสเทล */}
      <div className="bg-[#FFB8D2] dark:bg-[#8E4A6F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PixelCornerStar size={14} />
          <h2 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
            {UI_TEXT.TIMELINE_TITLE}
          </h2>
        </div>
        {onShowAll && reversed.length > limit && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-xs font-display font-bold px-2.5 py-1 bg-[#FFFDFB] dark:bg-[#352B59] border-2 border-[#4E3B69] dark:border-[#7662AC] text-[#3D2D52] dark:text-[#FFF6FA] shadow-[0_2px_0_rgba(78,59,105,0.25)] hover:brightness-98"
          >
            {UI_TEXT.TIMELINE_SHOW_ALL(reversed.length)}
          </button>
        )}
      </div>

      {/* แถบสันห่วงสมุดไดอารี่ */}
      <div
        aria-hidden="true"
        className="flex items-center justify-around px-3 py-1 bg-[#FFF2F6] dark:bg-[#221B3B] border-b-2 border-dashed border-[#4E3B69]/25 dark:border-[#7662AC]/40"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="w-3 h-1.5 bg-[#FF9EBF] dark:bg-[#7662AC] border border-[#4E3B69]/60"
          />
        ))}
      </div>

      <div className="p-3.5 sm:p-4 px-window-striped">
        {visible.length === 0 ? (
          <div className="py-6 text-center text-sm text-[#76658D] dark:text-[#CBBFE3]">
            {UI_TEXT.TIMELINE_EMPTY}
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map((item, idx) => {
              const meta = TIMELINE_CATEGORY_META[item.category] ?? TIMELINE_CATEGORY_META.life;
              const isSystemSummary =
                item.category === 'autopilot' ||
                item.title.includes('สรุป') ||
                item.category === 'echo';
              const iconName = isSystemSummary
                ? item.title.includes('สรุป')
                  ? 'coin'
                  : 'lightning'
                : (CATEGORY_ICON_MAP[item.category] ?? 'sparkle');
              const explainTarget = item.storyletId
                ? `event:${item.storyletId}`
                : item.explainReason
                  ? `timeline:${item.id}`
                  : null;

              return (
                <article
                  key={`${item.id}_${idx}`}
                  className={`px-inset p-3 flex items-start gap-3 ${
                    isSystemSummary
                      ? 'bg-[#F8F9FB] dark:bg-[#1E192D] border border-dashed border-[#CBD5E1] dark:border-[#52446E]'
                      : 'bg-[#FFFDFB]/95 dark:bg-[#221B3B]'
                  }`}
                >
                  <span
                    className={`px-slot w-10 h-10 flex items-center justify-center shrink-0 mt-0.5 ${
                      isSystemSummary
                        ? 'bg-[#E2E8F0] dark:bg-[#342D4B] text-[#475569] dark:text-[#CBD5E1]'
                        : meta.bg
                    }`}
                  >
                    <PixelIcon name={iconName} size={22} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#76658D] dark:text-[#CBBFE3] font-num">
                        <span
                          className={`font-bold ${
                            isSystemSummary
                              ? 'text-[#475569] dark:text-[#CBD5E1]'
                              : meta.text
                          }`}
                        >
                          {isSystemSummary && item.title.includes('สรุป')
                            ? UI_TEXT.CATEGORIES.finance
                            : meta.label}
                        </span>
                        {isSystemSummary && (
                          <span className="px-1.5 py-0.2 bg-[#E2E8F0] dark:bg-[#342D4B] text-[#475569] dark:text-[#CBD5E1] border border-[#4E3B69]/40 text-[10px] font-bold">
                            {UI_TEXT.SYSTEM_SUMMARY_LABEL}
                          </span>
                        )}
                        {isDevModeActive() && item.tier && (
                          <span className="px-1.5 py-0.2 bg-[#FFF3BF] dark:bg-[#4A3A1B] text-[#3D2D52] dark:text-[#FFE58F] border border-[#4E3B69]/60 text-[10px] font-bold">
                            {item.tier}
                          </span>
                        )}
                        <span>·</span>
                        <span>{item.dateLabel}</span>
                        <span>·</span>
                        <span>{UI_TEXT.COMMON.ageYears(item.ageYears)}</span>
                      </div>
                      {onSelectExplain && explainTarget && (
                        <button
                          type="button"
                          onClick={() => onSelectExplain(explainTarget)}
                          className="text-[11px] font-bold px-2 py-0.5 bg-[#DCEBFF] dark:bg-[#28488E]/70 text-[#2559B8] dark:text-[#B8D8FE] border border-[#4E3B69]/60 hover:brightness-95"
                        >
                          {UI_TEXT.EXPLAIN_BUTTON}
                        </button>
                      )}
                    </div>
                    <h3
                      className={`font-display font-bold text-sm leading-snug ${
                        isSystemSummary
                          ? 'text-[#2D3748] dark:text-[#E2E8F0]'
                          : 'text-[#3D2D52] dark:text-[#FFF6FA]'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#5A4773] dark:text-[#DDD6FE] leading-snug">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
