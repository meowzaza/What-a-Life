import { useEffect, useState } from 'react';
import {
  SAVE_SLOTS,
  type SaveSlotData,
  deleteSaveSlotFromIndexedDB,
  listSaveSlotsFromIndexedDB,
} from '../../engine/save';
import { PixelCornerStar, PixelIcon } from '../art/PixelIcons';

interface SaveLoadModalProps {
  isOpen: boolean;
  canSave: boolean;
  onClose: () => void;
  onSaveToSlot: (slotId: string, label: string) => Promise<void>;
  onLoadFromSlot: (slot: SaveSlotData) => void;
}

export function SaveLoadModal({
  isOpen,
  canSave,
  onClose,
  onSaveToSlot,
  onLoadFromSlot,
}: SaveLoadModalProps) {
  const [slots, setSlots] = useState<Record<string, SaveSlotData>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await listSaveSlotsFromIndexedDB();
      const map: Record<string, SaveSlotData> = {};
      for (const item of list) {
        map[item.slotId] = item;
      }
      setSlots(map);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถเปิดคลังเซฟได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusMsg(null);
      void refresh();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (slotId: string, label: string) => {
    setErrorMsg(null);
    try {
      await onSaveToSlot(slotId, label);
      setStatusMsg(`บันทึกข้อมูลลง "${label}" เรียบร้อยแล้ว`);
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleDelete = async (slotId: string) => {
    setErrorMsg(null);
    try {
      await deleteSaveSlotFromIndexedDB(slotId);
      setStatusMsg('ลบช่องบันทึกแล้ว');
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="บันทึกและโหลดเกม"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1833]/65 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="game-card w-full max-w-lg overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar หน้าต่างคลังเซฟ */}
        <div className="bg-[#FFB8D2] dark:bg-[#8E4A6F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <PixelCornerStar size={13} />
              <h2 className="font-display font-extrabold text-lg text-[#3D2D52] dark:text-[#FFF6FA]">
                สมุดบันทึกชีวิต (เซฟ / โหลด)
              </h2>
            </div>
            <p className="text-xs text-[#5A3F73] dark:text-[#F4E6F0]">
              บันทึกอัตโนมัติทุกสิ้นเดือน และเซฟแยกได้อีก 3 ช่อง
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเซฟ"
            className="game-btn w-11 h-11 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center shrink-0"
          >
            <PixelIcon name="close" size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto px-window-striped">
          {errorMsg && (
            <div className="px-slot p-3 bg-[#FFE0EE] text-xs font-semibold text-[#BD346B]">
              {errorMsg}
            </div>
          )}
          {statusMsg && (
            <div className="px-slot p-3 bg-[#D6FAEA] text-xs font-semibold text-[#167956]">
              {statusMsg}
            </div>
          )}

          <div className="space-y-2.5">
            {SAVE_SLOTS.map((slotDef) => {
              const existing = slots[slotDef.id];
              const isAuto = slotDef.id === 'autosave';
              return (
                <div
                  key={slotDef.id}
                  className="px-slot p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                      {slotDef.label}
                    </div>
                    {loading ? (
                      <div className="text-xs text-[#76658D]">กำลังโหลดรายการ...</div>
                    ) : existing ? (
                      <div className="text-xs text-[#5A4773] dark:text-[#DDD6FE] mt-0.5 space-y-0.5">
                        <div className="font-semibold">
                          {existing.meta.characterName} · อายุ {existing.meta.ageYears} ปี · {existing.meta.jobTitle}
                        </div>
                        <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] font-num">
                          {existing.meta.dateLabel} · เงินสด {existing.meta.cash.toLocaleString('th-TH')} ฿
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#76658D] dark:text-[#CBBFE3] mt-0.5">
                        ช่องว่าง
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isAuto && canSave && (
                      <button
                        type="button"
                        onClick={() => void handleSave(slotDef.id, slotDef.label)}
                        className="game-btn px-3 text-xs font-display font-extrabold bg-[#FF8DA8] text-[#3D2D52] inline-flex items-center gap-1.5"
                      >
                        <PixelIcon name="save" size={16} />
                        <span>บันทึก</span>
                      </button>
                    )}
                    {existing && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onLoadFromSlot(existing);
                            onClose();
                          }}
                          className="game-btn px-3 text-xs font-display font-bold bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] inline-flex items-center gap-1.5"
                        >
                          <PixelIcon name="download" size={16} />
                          <span>โหลด</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(slotDef.id)}
                          aria-label="ลบช่องบันทึกนี้"
                          className="game-btn w-11 bg-[#FFE0EE] text-[#BD346B] flex items-center justify-center"
                        >
                          <PixelIcon name="trash" size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
