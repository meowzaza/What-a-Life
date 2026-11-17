import type { GameState } from '../../../engine/types';
import { PixelIcon } from '../../art/PixelIcons';

interface RelationshipsTabProps {
  state: GameState;
}

export function RelationshipsTab({ state }: RelationshipsTabProps) {
  const { backstory } = state.character;

  return (
    <div className="space-y-4">
      <div className="game-card overflow-hidden">
        <div className="bg-[#FFE3D3] dark:bg-[#7D3A21] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PixelIcon name="people" size={20} />
            <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
              คนรอบตัวและครอบครัว
            </h3>
          </div>
          <span className="px-2.5 py-0.5 bg-[#FFFDFB] dark:bg-[#352B59] text-[#B84B1C] dark:text-[#FFC3A6] border-2 border-[#4E3B69] dark:border-[#7662AC] text-xs font-bold">
            กำลังพัฒนาเพิ่มใน Phase 4
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3 px-window-striped">
          <p className="text-sm text-[#5A4773] dark:text-[#DDD6FE] leading-relaxed">
            ตอนนี้คุณจะเห็นคนสำคัญตั้งต้นของครอบครัวและคนใกล้ชิด ส่วนระบบจีบใคร ทะเลาะ คืนดี และความลับของ NPC จะทยอยเปิดเพิ่มใน Phase 4
          </p>

          <div className="pt-2 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 space-y-2">
            <h4 className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
              คนรู้จักในชีวิตตอนนี้
            </h4>
            <ul className="space-y-2">
              {backstory.keyRelationships.map((rel, idx) => (
                <li
                  key={idx}
                  className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] text-sm font-medium text-[#3D2D52] dark:text-[#FFF6FA] flex items-center gap-2.5"
                >
                  <PixelIcon name="heart" size={16} />
                  <span>{rel}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
