import { AnimatePresence, motion } from 'motion/react';
import { Celebration } from '../art/Celebration';
import { PixelIcon } from '../art/PixelIcons';
import { UI_TEXT } from '../../data/uiText';

export interface NonBlockingNotice {
  id: string | number;
  kind: 'birthday' | 'outcome' | 'error' | 'storylet';
  title: string;
  body?: string;
  ageYears?: number;
  onExplain?: () => void;
}

interface CelebrationToastProps {
  notice: NonBlockingNotice | null;
  reduceFx: boolean;
  onDismiss: () => void;
}

export function CelebrationToast({ notice, reduceFx, onDismiss }: CelebrationToastProps) {
  return (
    <div className="fixed top-20 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            initial={reduceFx ? { opacity: 1 } : { opacity: 0, y: -16, scale: 0.94 }}
            animate={reduceFx ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceFx ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className={`pointer-events-auto game-card max-w-md w-full px-4 py-3 flex items-center gap-3 ${
              notice.kind === 'error'
                ? 'bg-[#FFE0EE] dark:bg-[#6E2647]'
                : notice.kind === 'birthday'
                  ? 'bg-[#FFF3BF] dark:bg-[#4A3A1B]'
                  : notice.kind === 'storylet'
                    ? 'bg-[#E8F2FF] dark:bg-[#28488E]/90'
                    : 'bg-[#D6FAEA] dark:bg-[#1E533F]'
            }`}
          >
            {notice.kind === 'birthday' ? (
              <Celebration ageYears={notice.ageYears ?? 1} size={52} className="shrink-0" />
            ) : (
              <PixelIcon
                name={
                  notice.kind === 'error'
                    ? 'warning'
                    : notice.kind === 'storylet'
                      ? 'sparkle'
                      : 'check'
                }
                size={28}
                className="shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                {notice.title}
              </div>
              {notice.body && (
                <p className="text-xs text-[#5A4773] dark:text-[#E2D9F3] mt-0.5 line-clamp-2">
                  {notice.body}
                </p>
              )}
              {notice.onExplain && (
                <button
                  type="button"
                  onClick={notice.onExplain}
                  className="mt-1.5 text-[11px] font-bold px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#2A2247] border border-[#4E3B69] text-[#2559B8] dark:text-[#B8D8FE] hover:brightness-95"
                >
                  {UI_TEXT.EXPLAIN_BUTTON}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="ปิดข้อความ"
              className="w-8 h-8 bg-[#FFFDFB]/80 dark:bg-[#2A2247]/80 border-2 border-[#4E3B69] dark:border-[#7662AC] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center hover:brightness-95 shrink-0"
            >
              <PixelIcon name="close" size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
