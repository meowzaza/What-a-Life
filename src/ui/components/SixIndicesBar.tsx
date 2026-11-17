import { useEffect, useRef, useState } from 'react';
import type { GameState, LifeIndexKey } from '../../engine/types';
import { IndexIcon } from '../art/IndexIcon';
import { MoodFace } from '../art/MoodFace';
import { PixelIcon } from '../art/PixelIcons';
import { INDEX_THEMES } from '../theme';

interface SixIndicesBarProps {
  state: GameState;
  selectedExplainKey: string | null;
  reduceFx: boolean;
  onSelectExplain: (key: string) => void;
}

const INDEX_KEYS: LifeIndexKey[] = [
  'physical',
  'mental',
  'financial',
  'social',
  'status',
  'competence',
];

function useAnimatedNumber(target: number, disabled: boolean): number {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    if (disabled || Math.abs(target - currentRef.current) < 5) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }
    const startVal = currentRef.current;
    const diff = target - startVal;
    const duration = 380;
    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(startVal + diff * eased);
      currentRef.current = val;
      setDisplay(val);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, disabled]);

  return display;
}

export function SixIndicesBar({
  state,
  selectedExplainKey,
  reduceFx,
  onSelectExplain,
}: SixIndicesBarProps) {
  const { character, economy } = state;
  const animatedCash = useAnimatedNumber(economy.cash, reduceFx);

  const prevIndicesRef = useRef(character.indices);
  const [shakingKeys, setShakingKeys] = useState<Partial<Record<LifeIndexKey, boolean>>>({});

  useEffect(() => {
    const prev = prevIndicesRef.current;
    const dropped: Partial<Record<LifeIndexKey, boolean>> = {};
    let hasDrop = false;
    for (const k of INDEX_KEYS) {
      if (character.indices[k] - prev[k] <= -4) {
        dropped[k] = true;
        hasDrop = true;
      }
    }
    prevIndicesRef.current = character.indices;
    if (hasDrop && !reduceFx) {
      setShakingKeys(dropped);
      const timer = setTimeout(() => setShakingKeys({}), 460);
      return () => clearTimeout(timer);
    }
  }, [character.indices, reduceFx]);

  return (
    <section aria-label="การเงินและดัชนีชีวิต 6 ด้าน" className="space-y-3">
      {/* แถบ HUD เงินสดและหนี้สิน */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <button
          type="button"
          onClick={() => onSelectExplain('eco:cash')}
          className={`game-btn sm:col-span-8 px-3.5 py-2.5 bg-[#FFFDFB] dark:bg-[#2A2247] flex items-center justify-between gap-3 text-left ${
            selectedExplainKey === 'eco:cash' ? 'ring-2 ring-[#FF8DA8]' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-slot w-11 h-11 bg-[#FFF3BF] dark:bg-[#73571D]/75 flex items-center justify-center shrink-0">
              <PixelIcon name="coin" size={26} />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#76658D] dark:text-[#CBBFE3]">
                {character.ageYears < 15 ? 'เงินส่วนตัว (พ่อแม่ดูแลค่าใช้จ่าย)' : 'เงินสดในมือ'}
              </div>
              <div className="text-xl sm:text-2xl font-display font-extrabold font-num text-[#3D2D52] dark:text-[#FFF6FA] leading-tight">
                {animatedCash.toLocaleString('th-TH')} ฿
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-[#FFF0F6] dark:bg-[#352B59] border-2 border-[#4E3B69]/45 dark:border-[#7662AC] text-[#BD346B] dark:text-[#FFB8D4] shrink-0">
            ดูที่มา
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectExplain('eco:debt')}
          className={`game-btn sm:col-span-4 px-3.5 py-2.5 flex items-center justify-between gap-2 text-left ${
            economy.debt > 0
              ? 'bg-[#FFE0EE] dark:bg-[#6E2647]/80'
              : 'bg-[#D6FAEA] dark:bg-[#1E533F]/75'
          } ${selectedExplainKey === 'eco:debt' ? 'ring-2 ring-[#FF8DA8]' : ''}`}
        >
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#5A4773] dark:text-[#E2D9F3]">
              หนี้สินคงค้าง
            </div>
            <div
              className={`text-base sm:text-lg font-display font-bold font-num truncate ${
                economy.debt > 0
                  ? 'text-[#BD346B] dark:text-[#FFB8D4]'
                  : 'text-[#167956] dark:text-[#7EF4C2]'
              }`}
            >
              {economy.debt > 0 ? `${economy.debt.toLocaleString('th-TH')} ฿` : 'ปลอดหนี้'}
            </div>
          </div>
          {economy.debt > 0 ? (
            <PixelIcon name="warning" size={20} />
          ) : (
            <PixelIcon name="check" size={18} />
          )}
        </button>
      </div>

      {/* กริดดัชนีชีวิต 3x2 สไตล์เกจพิกเซลพาสเทล */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {INDEX_KEYS.map((key) => {
          const val = character.indices[key];
          const theme = INDEX_THEMES[key];
          const explainKey = `index:${key}`;
          const isSelected = selectedExplainKey === explainKey;
          const isShaking = Boolean(shakingKeys[key]);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectExplain(explainKey)}
              aria-label={`ดัชนี${theme.label}: แตะเพื่อดูเหตุผล`}
              className={`game-btn p-2.5 sm:p-3 bg-[#FFFDFB] dark:bg-[#2A2247] text-left flex flex-col justify-between gap-2 ${
                isSelected ? 'ring-2 ring-[#FF8DA8]' : ''
              } ${isShaking ? 'animate-shake-drop' : ''}`}
            >
              <div className="flex items-center justify-between gap-1.5 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <IndexIcon indexKey={key} size={24} />
                  <span className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                    {theme.label}
                  </span>
                </div>
                <MoodFace value={val} size={30} className="shrink-0" />
              </div>

              <div className={`px-progress-track h-3.5 w-full ${theme.trackBg}`}>
                <div
                  className={`px-progress-fill h-full ${theme.barColor}`}
                  style={{ width: `${Math.max(6, val)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
