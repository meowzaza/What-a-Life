import { useEffect, useMemo, useState } from 'react';
import { REGIONS } from '../../data/thaiData';
import {
  APPEARANCE_TAG_CATEGORY_LABELS,
  APPEARANCE_TAG_CATEGORY_ORDER,
  type GalleryCandidate,
  describeAppearanceTraits,
  getGalleryCandidates,
} from '../../engine/appearance';
import type { Gender, RegionId } from '../../engine/types';
import { CharacterSprite } from '../art/CharacterSprite';
import { PixelCornerStar, PixelIcon } from '../art/PixelIcons';

interface CharacterGalleryModalProps {
  isOpen: boolean;
  gender: Gender;
  ageYears: number;
  region?: RegionId;
  province?: string;
  selectedCharId?: string;
  reduceFx: boolean;
  onSelectCharacter: (charId: string) => void;
  onClose: () => void;
}

const GENDER_LABEL: Record<Gender, string> = {
  male: 'ชาย',
  female: 'หญิง',
  nonbinary: 'นอนไบนารี',
};

export function CharacterGalleryModal({
  isOpen,
  gender,
  ageYears,
  region,
  province,
  selectedCharId,
  reduceFx,
  onSelectCharacter,
  onClose,
}: CharacterGalleryModalProps) {
  const [onlyRegionMatch, setOnlyRegionMatch] = useState(false);
  const [draftCharId, setDraftCharId] = useState<string | undefined>(selectedCharId);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const candidates = useMemo(
    () => getGalleryCandidates(gender, ageYears, region),
    [gender, ageYears, region]
  );

  const regionMatches = useMemo(
    () => candidates.filter((c) => c.matchesRegion),
    [candidates]
  );

  useEffect(() => {
    if (!isOpen) return;
    setDraftCharId(selectedCharId ?? candidates[0]?.entry.id);
    setOnlyRegionMatch(false);
    setTagsExpanded(false);
  }, [isOpen, selectedCharId, candidates]);

  useEffect(() => {
    setTagsExpanded(false);
  }, [draftCharId]);

  if (!isOpen) return null;

  const visibleCandidates: GalleryCandidate[] =
    onlyRegionMatch && regionMatches.length > 0 ? regionMatches : candidates;

  const regionName = REGIONS.find((r) => r.id === region)?.name ?? 'ไม่ระบุภาค';
  const draftTraits = describeAppearanceTraits(draftCharId, { ageYears });
  const extraTagCount = draftTraits ? Math.max(0, draftTraits.allTags.length - 3) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="แกลเลอรีเลือกตัวละคร"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1E1833]/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="game-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar พาสเทล */}
        <div className="bg-[#FFB8D2] dark:bg-[#8E4A6F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PixelCornerStar size={14} animate={!reduceFx} />
              <h2 className="font-display font-extrabold text-base sm:text-lg text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                แกลเลอรีเลือกตัวละคร
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-[#5A3F73] dark:text-[#F4E6F0] truncate">
              {ageYears <= 1
                ? 'ทารกห่อผ้า 0–1 ปี (ไม่แยกเพศ)'
                : `เพศ${GENDER_LABEL[gender]} · อายุ ${ageYears} ปี`}
              {province ? ` · จ.${province}` : ` · ${regionName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดแกลเลอรี"
            className="game-btn w-11 h-11 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center shrink-0"
          >
            <PixelIcon name="close" size={18} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-2.5 bg-[#FFF2F6] dark:bg-[#221B3B] border-b-2 border-[#4E3B69]/20 dark:border-[#7662AC]/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setOnlyRegionMatch(false)}
              className={`px-3 py-1.5 text-xs font-display font-bold ${
                !onlyRegionMatch
                  ? 'px-slot bg-[#FFE58F] text-[#3D2D52]'
                  : 'px-inset bg-[#FFFDFB] dark:bg-[#2A2247] text-[#5A4773] dark:text-[#CBBFE3]'
              }`}
            >
              ทั้งหมดในวัยนี้ ({candidates.length})
            </button>
            {regionMatches.length > 0 && (
              <button
                type="button"
                onClick={() => setOnlyRegionMatch(true)}
                className={`px-3 py-1.5 text-xs font-display font-bold ${
                  onlyRegionMatch
                    ? 'px-slot bg-[#D6FAEA] text-[#167956]'
                    : 'px-inset bg-[#FFFDFB] dark:bg-[#2A2247] text-[#5A4773] dark:text-[#CBBFE3]'
                }`}
              >
                เข้ากับ{regionName} ({regionMatches.length})
              </button>
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#76658D] dark:text-[#CBBFE3]">
            แตะดูรายละเอียดสีผิว-สีตา-สีผมด้านล่าง
          </span>
        </div>

        {/* Character grid */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 px-window-striped">
          {visibleCandidates.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#76658D] dark:text-[#CBBFE3]">
              ไม่พบตัวละครที่ตรงเงื่อนไขนี้ ลองเปลี่ยนอายุหรือเพศดูนะ
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {visibleCandidates.map((item) => {
                const isSelected = draftCharId === item.entry.id;
                return (
                  <button
                    key={item.entry.id}
                    type="button"
                    onClick={() => setDraftCharId(item.entry.id)}
                    className={`p-2 flex flex-col items-center gap-1.5 text-center transition-transform active:translate-y-0.5 ${
                      isSelected
                        ? 'px-slot bg-[#FFE58F] text-[#3D2D52]'
                        : 'px-inset bg-[#FFFDFB] dark:bg-[#2A2247] hover:bg-[#FFF0F6] dark:hover:bg-[#352B59]'
                    }`}
                  >
                    <div className="relative">
                      <CharacterSprite
                        charId={item.entry.id}
                        mode="bust"
                        size={68}
                        ageYears={ageYears}
                        gender={gender}
                      />
                      {item.matchesRegion && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-extrabold bg-[#6EE7B7] text-[#165940] border-2 border-[#4E3B69]">
                          ตรงถิ่น
                        </span>
                      )}
                    </div>
                    <div className="w-full space-y-0.5">
                      <div className="text-[11px] font-bold truncate">
                        ผิว{item.traits.skinLabel}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected
                            ? 'text-[#3D2D52]/80 font-semibold'
                            : 'text-[#76658D] dark:text-[#CBBFE3]'
                        }`}
                      >
                        {item.traits.isHairPendingReveal
                          ? 'ผมยังไม่ขึ้น'
                          : `ผม${item.traits.hairColorLabel}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Preview + Pulled Traits Bar */}
        <div className="p-3.5 sm:p-4 bg-[#FFFDFB] dark:bg-[#2A2247] border-t-2 border-[#4E3B69] dark:border-[#7662AC] space-y-3 shrink-0">
          {draftCharId && draftTraits && (
            <div className="px-inset p-2.5 space-y-2">
              <div className="flex items-start gap-3">
                <CharacterSprite
                  charId={draftCharId}
                  mode="bust"
                  size={56}
                  ageYears={ageYears}
                  gender={gender}
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
                    <div className="min-w-0">
                      <span className="block text-[10px] text-[#76658D] dark:text-[#CBBFE3]">สีผิว</span>
                      <span className="inline-flex items-center gap-1 font-bold break-words">
                        <span
                          className="w-2.5 h-2.5 border border-[#4E3B69] shrink-0"
                          style={{ backgroundColor: draftTraits.skinHex }}
                          aria-hidden="true"
                        />
                        <span>{draftTraits.skinLabel}</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-[#76658D] dark:text-[#CBBFE3]">สีตา</span>
                      <span className="font-bold block break-words">{draftTraits.eyeColorLabel}</span>
                    </div>
                    <div className="min-w-0 col-span-2 sm:col-span-1">
                      <span className="block text-[10px] text-[#76658D] dark:text-[#CBBFE3]">
                        {ageYears <= 1 ? 'สีผมแรกเริ่ม' : 'สีผม'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold break-words">
                        {!draftTraits.isHairPendingReveal && (
                          <span
                            className="w-2.5 h-2.5 border border-[#4E3B69] shrink-0"
                            style={{ backgroundColor: draftTraits.hairHex }}
                            aria-hidden="true"
                          />
                        )}
                        <span>{draftTraits.hairColorLabel}</span>
                      </span>
                    </div>
                  </div>

                  {draftTraits.allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {draftTraits.styleTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFF0F6] dark:bg-[#352B59] border border-[#4E3B69]/40 dark:border-[#7662AC] text-[#5A4773] dark:text-[#DDD6FE]"
                        >
                          {tag}
                        </span>
                      ))}
                      {extraTagCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setTagsExpanded((prev) => !prev)}
                          className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#FFE58F] text-[#3D2D52] border border-[#4E3B69] hover:brightness-105"
                        >
                          {tagsExpanded ? 'ย่อ' : `+ดูเพิ่มเติม (${extraTagCount})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {tagsExpanded && (
                <div className="pt-2 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 max-h-36 overflow-y-auto space-y-1.5">
                  {APPEARANCE_TAG_CATEGORY_ORDER.map((cat) => {
                    const catTags = draftTraits.categorizedTags[cat];
                    if (catTags.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-0.5">
                        <div className="text-[10px] font-extrabold text-[#BD346B] dark:text-[#FFB8D4]">
                          {APPEARANCE_TAG_CATEGORY_LABELS[cat]}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {catTags.map((label) => (
                            <span
                              key={`${cat}:${label}`}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFFDFB] dark:bg-[#352B59] border border-[#4E3B69]/40 dark:border-[#7662AC] text-[#3D2D52] dark:text-[#FFF6FA]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="game-btn px-4 bg-[#FFFDFB] dark:bg-[#352B59] font-display font-bold text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!draftCharId}
              onClick={() => {
                if (draftCharId) {
                  onSelectCharacter(draftCharId);
                  onClose();
                }
              }}
              className="game-btn flex-1 px-4 bg-[#6EE7B7] text-[#165940] font-display font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <PixelIcon name="check" size={18} />
              <span>เลือกตัวละครนี้</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
