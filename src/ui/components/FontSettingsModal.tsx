import { FONT_PRESETS, type FontPresetId } from '../fonts';
import { PixelCornerStar, PixelIcon } from '../art/PixelIcons';

interface FontSettingsModalProps {
  isOpen: boolean;
  currentFont: FontPresetId;
  reduceFx?: boolean;
  onSelectFont: (id: FontPresetId) => void;
  onClose: () => void;
}

export function FontSettingsModal({
  isOpen,
  currentFont,
  reduceFx = false,
  onSelectFont,
  onClose,
}: FontSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ตั้งค่าฟอนต์ตัวอักษร"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1E1833]/65 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="game-card w-full sm:max-w-lg overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#B4C3FF] dark:bg-[#4F5DA8] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PixelCornerStar size={14} animate={!reduceFx} />
              <h2 className="font-display font-extrabold text-base sm:text-lg text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                เลือกแบบอักษร (ฟอนต์)
              </h2>
            </div>
            <p className="text-xs text-[#3D2D52]/80 dark:text-[#E2D9F3] truncate">
              เปลี่ยนทันทีทั้งเกม ค่าเริ่มต้นคือ TA 16 BIT
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างตั้งค่าฟอนต์"
            className="game-btn w-11 h-11 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center shrink-0"
          >
            <PixelIcon name="close" size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2.5 overflow-y-auto px-window-striped">
          {FONT_PRESETS.map((preset) => {
            const active = currentFont === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectFont(preset.id)}
                className={`game-btn w-full p-3.5 text-left flex items-center justify-between gap-3 ${
                  active
                    ? 'bg-[#FFE58F] text-[#3D2D52]'
                    : 'bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA]'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-bold text-base leading-tight"
                      style={{ fontFamily: preset.displayFamily }}
                    >
                      {preset.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold border-2 border-[#4E3B69] ${
                        active
                          ? 'bg-[#FFFDFB] text-[#3D2D52]'
                          : 'bg-[#FFF0F6] dark:bg-[#352B59] text-[#BD346B] dark:text-[#FFB8D4]'
                      }`}
                    >
                      {preset.sourceLabel}
                    </span>
                  </div>
                  <div
                    className={`text-xs ${
                      active ? 'text-[#3D2D52]/85' : 'text-[#76658D] dark:text-[#CBBFE3]'
                    }`}
                  >
                    {preset.subtitle}
                  </div>
                  <div
                    className="text-sm pt-0.5 truncate"
                    style={{ fontFamily: preset.bodyFamily }}
                  >
                    {preset.sampleText}
                  </div>
                </div>

                {active && (
                  <span className="shrink-0">
                    <PixelIcon name="check" size={20} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
