import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  EDUCATION_LABELS,
  FAMILY_STRUCTURES,
  PARENT_EDUCATIONS,
  REGIONS,
  TEMPERAMENTS,
  WEALTH_TIERS,
} from '../../data/thaiData';
import { UI_TEXT } from '../../data/uiText';
import {
  APPEARANCE_TAG_CATEGORY_LABELS,
  APPEARANCE_TAG_CATEGORY_ORDER,
  describeAppearanceTraits,
  getEligibleAppearancePool,
  isAppearanceValidForSelection,
} from '../../engine/appearance';
import { generateLife } from '../../engine/lifegen';
import type {
  CustomLifeOptions,
  FamilyStructure,
  FamilyWealthTier,
  Gender,
  LifeGenMode,
  LifeGenRequest,
  ParentEducation,
  RandomStartPoint,
  RegionId,
  TemperamentId,
} from '../../engine/types';
import { loadAutosave, type SaveSlotData } from '../../engine/save';
import { Avatar } from '../art/Avatar';
import {
  PixelCatMascot,
  PixelCornerStar,
  PixelGenderBadge,
  PixelIcon,
  PixelWing,
} from '../art/PixelIcons';
import { CharacterGalleryModal } from '../components/CharacterGalleryModal';

interface LifeGenScreenProps {
  onStartLife: (request: LifeGenRequest) => void;
  onOpenLoadModal: () => void;
  onLoadAutosave?: (slot: SaveSlotData) => void;
  onOpenFontSettings: () => void;
  isDark: boolean;
  reduceFx: boolean;
  onToggleTheme: () => void;
  onOpenSceneDebug?: () => void;
}

const MAX_REROLLS = 5;

const START_POINT_OPTIONS: { id: RandomStartPoint; label: string; sub: string }[] = [
  { id: 'birth', label: 'เกิดใหม่ (0 ปี)', sub: 'เริ่มจากวัยทารก' },
  { id: 'age6', label: '6 ขวบ', sub: 'เริ่มเข้าประถม' },
  { id: 'age12', label: '12 ขวบ', sub: 'เตรียมขึ้นมัธยม' },
  { id: 'late_teen', label: 'วัยรุ่นตอนปลาย', sub: 'สุ่มช่วง 15–20 ปี' },
];

function ModeCardArt({ mode }: { mode: LifeGenMode }) {
  if (mode === 'random') {
    return <PixelIcon name="dice" size={34} />;
  }
  if (mode === 'custom') {
    return <PixelIcon name="gallery" size={34} />;
  }
  return <PixelIcon name="clock" size={34} />;
}

export function LifeGenScreen({
  onStartLife,
  onOpenLoadModal,
  onLoadAutosave,
  onOpenFontSettings,
  isDark,
  reduceFx,
  onToggleTheme,
  onOpenSceneDebug,
}: LifeGenScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<LifeGenMode>('random');
  const [seed, setSeed] = useState<number>(() => Math.floor(Date.now() % 10000000));
  const [rerollsLeft, setRerollsLeft] = useState<number>(MAX_REROLLS);
  const [diceSpinKey, setDiceSpinKey] = useState(0);
  const [autosaveSlot, setAutosaveSlot] = useState<SaveSlotData | null>(null);

  useEffect(() => {
    void loadAutosave()
      .then((slot) => {
        if (slot && slot.meta && slot.snapshot?.character?.isAlive) {
          setAutosaveSlot(slot);
        }
      })
      .catch(() => {});
  }, []);

  // Mode 1: Random start point (ค่าเริ่มต้นเกิดใหม่ 0 ปี)
  const [randomStartPoint, setRandomStartPoint] = useState<RandomStartPoint>('birth');

  // Mode 2: Custom state
  const [startingAge, setStartingAge] = useState<number>(0);
  const [randName, setRandName] = useState(true);
  const [firstName, setFirstName] = useState('ธนกฤต');
  const [lastName, setLastName] = useState('สุขสมบูรณ์');
  const [nickname, setNickname] = useState('ปอนด์');

  const [randGender, setRandGender] = useState(true);
  const [gender, setGender] = useState<Gender>('male');

  const [randRegion, setRandRegion] = useState(true);
  const [region, setRegion] = useState<RegionId>('bangkok');
  const [randProvince, setRandProvince] = useState(true);
  const [province, setProvince] = useState('กรุงเทพมหานคร');

  const [randWealth, setRandWealth] = useState(true);
  const [familyWealth, setFamilyWealth] = useState<FamilyWealthTier>('lower_middle');

  const [randFamilyStruct, setRandFamilyStruct] = useState(true);
  const [familyStructure, setFamilyStructure] = useState<FamilyStructure>('two_parents');

  const [randParentEdu, setRandParentEdu] = useState(true);
  const [parentEducation, setParentEducation] = useState<ParentEducation>('secondary');

  const [randTemp, setRandTemp] = useState(true);
  const [temperament, setTemperament] = useState<TemperamentId>('calm');

  const [randHealth, setRandHealth] = useState(true);
  const [geneticHealth, setGeneticHealth] = useState(70);

  const [appearanceOverride, setAppearanceOverride] = useState<string | undefined>(undefined);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [previewTagsExpanded, setPreviewTagsExpanded] = useState(false);

  const selectedRegionObj = REGIONS.find((r) => r.id === region) ?? REGIONS[0];

  useEffect(() => {
    setAppearanceOverride(undefined);
  }, [mode, seed, randomStartPoint]);

  const currentRequest: LifeGenRequest = useMemo(() => {
    if (mode === 'random') {
      return { mode: 'random', seed, randomStartPoint, appearanceOverride };
    }
    const custom: CustomLifeOptions = {
      startingAge,
      firstName: randName ? undefined : firstName,
      lastName: randName ? undefined : lastName,
      nickname: randName ? undefined : nickname,
      gender: randGender ? undefined : gender,
      region: randRegion ? undefined : region,
      province: randRegion || randProvince ? undefined : province,
      familyWealth: randWealth ? undefined : familyWealth,
      familyStructure: randFamilyStruct ? undefined : familyStructure,
      parentEducation: randParentEdu ? undefined : parentEducation,
      temperament: randTemp ? undefined : temperament,
      geneticHealth: randHealth ? undefined : geneticHealth,
    };
    return { mode: 'custom', seed, custom, appearanceOverride };
  }, [
    mode,
    seed,
    randomStartPoint,
    startingAge,
    randName,
    firstName,
    lastName,
    nickname,
    randGender,
    gender,
    randRegion,
    region,
    randProvince,
    province,
    randWealth,
    familyWealth,
    randFamilyStruct,
    familyStructure,
    randParentEdu,
    parentEducation,
    randTemp,
    temperament,
    randHealth,
    geneticHealth,
    appearanceOverride,
  ]);

  const previewLife = useMemo(() => generateLife(currentRequest), [currentRequest]);

  // หากผู้เล่นเปลี่ยนอายุหรือเพศจนตัวละครที่เลือกไว้ไม่เข้าเกณฑ์แล้ว ให้รีเซ็ตกลับเป็นสุ่มตามเกณฑ์ใหม่อัตโนมัติ
  useEffect(() => {
    if (
      appearanceOverride &&
      !isAppearanceValidForSelection(
        appearanceOverride,
        previewLife.person.gender,
        previewLife.person.ageYears
      )
    ) {
      setAppearanceOverride(undefined);
    }
  }, [appearanceOverride, previewLife.person.gender, previewLife.person.ageYears]);

  const previewTraits = useMemo(
    () =>
      describeAppearanceTraits(previewLife.person.appearance?.charId, {
        ageYears: previewLife.person.ageYears,
        appearance: previewLife.person.appearance,
      }),
    [previewLife.person.appearance, previewLife.person.ageYears]
  );

  useEffect(() => {
    setPreviewTagsExpanded(false);
  }, [previewLife.person.appearance?.charId, previewLife.person.ageYears]);

  const eligibleAppearancePool = useMemo(
    () => getEligibleAppearancePool(previewLife.person.gender, previewLife.person.ageYears),
    [previewLife.person.gender, previewLife.person.ageYears]
  );

  const handleCycleAppearance = () => {
    if (eligibleAppearancePool.length <= 1) return;
    const currentId = previewLife.person.appearance?.charId;
    const idx = eligibleAppearancePool.findIndex((item) => item.id === currentId);
    const nextIdx = idx >= 0 ? (idx + 1) % eligibleAppearancePool.length : 0;
    setAppearanceOverride(eligibleAppearancePool[nextIdx].id);
  };

  const handleRerollRandom = () => {
    if (rerollsLeft <= 0) return;
    setRerollsLeft((r) => r - 1);
    setDiceSpinKey((k) => k + 1);
    setSeed((s) => (s + 13791) % 99999999);
  };

  const regionName = REGIONS.find((r) => r.id === previewLife.person.background.region)?.name ?? '';
  const wealthName =
    WEALTH_TIERS.find((w) => w.id === previewLife.person.background.familyWealth)?.label ?? '';
  const fsName =
    FAMILY_STRUCTURES.find((f) => f.id === previewLife.person.background.familyStructure)?.label ?? '';
  const tempName =
    TEMPERAMENTS.find((t) => t.id === previewLife.person.background.temperament)?.label ?? '';

  const logoUrl = `${import.meta.env.BASE_URL}assets/aistudio/file_00000000458482079ce17d838caf3cbd_7902fa30.png`;

  return (
    <div className="min-h-screen text-[#3D2D52] dark:text-[#FFF6FA] pb-10">
      {/* Header พาสเทลพิกเซล */}
      <header className="border-b-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFB8D2]/95 dark:bg-[#2A2247]/95 shadow-[0_3px_0_rgba(78,59,105,0.18)]">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <img
              src={logoUrl}
              alt="What a Life!"
              className="h-9 w-auto object-contain sm:hidden drop-shadow-[0_2px_0_rgba(78,59,105,0.2)]"
            />
            <span className="hidden sm:inline-flex items-center gap-2">
              <PixelCornerStar size={14} animate={!reduceFx} />
              <span className="font-display font-extrabold text-xl tracking-tight text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                ชีวิตจริงยิ่งกว่านิยาย
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenSceneDebug && (
              <button
                type="button"
                onClick={onOpenSceneDebug}
                title="ดีบักระบบฉาก (Scene Debug)"
                className="game-btn px-2 sm:px-2.5 bg-[#FFFDFB] dark:bg-[#352B59] text-xs font-display font-bold inline-flex items-center gap-1 text-[#167956] dark:text-[#7EF4C2]"
              >
                <PixelIcon name="star" size={15} />
                <span className="hidden sm:inline">ฉาก</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenFontSettings}
              aria-label="ตั้งค่าแบบอักษร"
              className="game-btn px-2 sm:px-3 bg-[#FFFDFB] dark:bg-[#352B59] text-xs font-display font-bold inline-flex items-center gap-1.5"
            >
              <PixelIcon name="font" size={16} />
              <span className="hidden sm:inline">ฟอนต์</span>
            </button>
            <button
              type="button"
              onClick={onOpenLoadModal}
              className="game-btn px-2.5 sm:px-3 bg-[#FFFDFB] dark:bg-[#352B59] text-xs font-display font-bold inline-flex items-center gap-1.5"
            >
              <PixelIcon name="folder" size={16} />
              <span>โหลดเซฟ</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="สลับโหมดสี"
              className="game-btn w-10 sm:w-11 bg-[#FFFDFB] dark:bg-[#352B59] flex items-center justify-center"
            >
              <PixelIcon name={isDark ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-5 space-y-4 sm:space-y-5">
        {/* โลโก้เกมด้านบนสุดก่อน Step 1-2-3 */}
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="What a Life! ชีวิตจริงยิ่งกว่านิยาย"
            className="h-24 sm:h-32 w-auto object-contain drop-shadow-[0_4px_0_rgba(78,59,105,0.2)] select-none"
          />
        </div>

        {/* Progress Stepper พิกเซล 1-2-3 */}
        <div className="flex items-center justify-center gap-2.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (s < step) setStep(s as 1 | 2 | 3);
                }}
                className={`w-9 h-9 border-2 border-[#4E3B69] dark:border-[#7662AC] font-display font-bold text-sm transition-transform ${
                  step === s
                    ? 'bg-[#FF8DA8] text-[#3D2D52] scale-110 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_3px_0_#4E3B69]'
                    : step > s
                      ? 'bg-[#6EE7B7] text-[#165940]'
                      : 'bg-[#FFFDFB] dark:bg-[#2A2247] text-[#76658D] dark:text-[#CBBFE3]'
                }`}
              >
                {s}
              </button>
              {s < 3 && (
                <div className="w-8 h-1.5 bg-[#4E3B69]/20 dark:bg-white/20" />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: เลือกวิธีเริ่มต้นชีวิต */}
        {step === 1 && (
          <div className="space-y-4">
            {autosaveSlot && onLoadAutosave && (
              <button
                type="button"
                onClick={() => onLoadAutosave(autosaveSlot)}
                className="game-btn w-full p-4 bg-[#FFE58F] dark:bg-[#7A5B1F] text-left flex items-center gap-3.5 border-2 border-[#4E3B69] dark:border-[#7662AC] shadow-[0_4px_0_#4E3B69] hover:brightness-105 transition-all"
              >
                <div className="w-12 h-12 bg-[#FFFDFB] dark:bg-[#221B3B] border-2 border-[#4E3B69] flex items-center justify-center shrink-0">
                  <PixelIcon name="play" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-[#8A5A00] dark:text-[#FDE68A] uppercase tracking-wide">
                    {UI_TEXT.AUTOSAVE.resumeEyebrow}
                  </div>
                  <div className="font-display font-extrabold text-base sm:text-lg text-[#3D2D52] dark:text-[#FFF6FA] truncate">
                    {UI_TEXT.AUTOSAVE.resumeButton(
                      autosaveSlot.meta.characterName,
                      autosaveSlot.meta.ageYears
                    )}
                  </div>
                  <div className="text-xs text-[#5A4773] dark:text-[#DDD6FE] font-num">
                    {autosaveSlot.meta.dateLabel} · เงินสด {autosaveSlot.meta.cash.toLocaleString('th-TH')} ฿
                  </div>
                </div>
                <PixelIcon name="arrow_right" size={20} className="shrink-0" />
              </button>
            )}

            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center gap-2">
                <PixelWing animate={!reduceFx} />
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#3D2D52] dark:text-[#FFF6FA]">
                  อยากเริ่มต้นชีวิตแบบไหน?
                </h1>
                <PixelWing flip animate={!reduceFx} />
              </div>
              <p className="text-sm text-[#76658D] dark:text-[#CBBFE3]">
                ทุกทางเลือกมีราคา ไม่มีบทเรียนสอนใจ เล่นได้เต็มที่ตามใจคุณ
              </p>
            </div>

            <div className="space-y-3">
              {(
                [
                  {
                    id: 'random' as LifeGenMode,
                    title: '1. สุ่มชีวิตใหม่',
                    desc: 'ทอยลูกเต๋าเกิดใหม่ตามสถิติจริงของคนไทย สุ่มได้สูงสุด 5 ครั้ง',
                    accent: 'bg-[#FFF3BF] dark:bg-[#4A3A1B]',
                  },
                  {
                    id: 'custom' as LifeGenMode,
                    title: '2. กำหนดชะตาเอง',
                    desc: 'เลือกอายุ 0–65 ปี เพศ บ้านเกิด ฐานะ พร้อมเลือกหน้าตาตัวละครจากแกลเลอรีได้เอง',
                    accent: 'bg-[#DCEBFF] dark:bg-[#223F7D]/60',
                  },
                ] as const
              ).map((item) => {
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMode(item.id);
                      setStep(2);
                    }}
                    className={`game-btn w-full p-4 text-left flex items-center gap-4 ${
                      active ? item.accent : 'bg-[#FFFDFB] dark:bg-[#2A2247]'
                    }`}
                  >
                    <div className="px-slot w-14 h-14 bg-[#FFF2F6] dark:bg-[#352B59] flex items-center justify-center shrink-0">
                      <ModeCardArt mode={item.id} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-display font-extrabold text-base sm:text-lg text-[#3D2D52] dark:text-[#FFF6FA]">
                        {item.title}
                      </div>
                      <p className="text-xs sm:text-sm text-[#5A4773] dark:text-[#DDD6FE]">
                        {item.desc}
                      </p>
                    </div>
                    <PixelIcon name="arrow_right" size={20} className="shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: ปรับแต่ง / ทอยลูกเต๋า */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Live Avatar Preview Banner สไตล์หน้าต่างพร้อมแมวเกาะขอบ */}
            <div className="game-card relative overflow-visible mt-2">
              <div className="absolute -top-[21px] right-4 z-10 pointer-events-none">
                <PixelCatMascot animate={!reduceFx} />
              </div>

              <div className="bg-[#B4C3FF] dark:bg-[#4F5DA8] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-1.5 flex items-center gap-2">
                <PixelCornerStar size={12} animate={!reduceFx} />
                <span className="text-xs font-display font-extrabold text-[#3D2D52] dark:text-[#FFF6FA]">
                  ข้อมูลตัวละคร
                </span>
              </div>

              <div className="p-4 space-y-3 px-window-striped">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <Avatar
                      seed={currentRequest.seed}
                      gender={previewLife.person.gender}
                      ageYears={previewLife.person.ageYears}
                      mentalIndex={previewLife.person.indices.mental}
                      jobId={previewLife.economy.jobId}
                      appearanceId={previewLife.person.appearance?.charId}
                      size={80}
                    />
                    <div className="flex flex-col gap-1.5 w-full">
                      {mode !== 'random' && eligibleAppearancePool.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setGalleryOpen(true)}
                          className="px-2 py-1 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFB8D2] text-[#3D2D52] text-[11px] font-extrabold inline-flex items-center justify-center gap-1 shadow-[0_2px_0_rgba(78,59,105,0.2)] hover:brightness-105"
                        >
                          <PixelIcon name="gallery" size={14} />
                          <span>เลือกตัวละคร</span>
                        </button>
                      )}
                      {eligibleAppearancePool.length > 1 && (
                        <button
                          type="button"
                          onClick={handleCycleAppearance}
                          className="px-2 py-1 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFE58F] text-[#3D2D52] text-[11px] font-bold inline-flex items-center justify-center gap-1 shadow-[0_2px_0_rgba(78,59,105,0.2)] hover:brightness-105"
                        >
                          <PixelIcon name="reroll" size={13} />
                          <span>ลองหน้าถัดไป</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-display font-extrabold text-base sm:text-lg leading-snug break-words">
                        {previewLife.person.firstName} {previewLife.person.lastName} ({previewLife.person.nickname})
                      </div>
                      <PixelGenderBadge gender={previewLife.person.gender} size={14} />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-[#BD346B] dark:text-[#FFB8D4] break-words">
                      อายุ {previewLife.person.ageYears} ปี · จ.{previewLife.person.background.province}
                    </div>
                    <div className="text-xs text-[#76658D] dark:text-[#CBBFE3] break-words">
                      ฐานะ{wealthName} · {previewLife.economy.jobTitle}
                    </div>
                  </div>
                </div>

                {previewTraits && (
                  <div className="px-inset p-3 space-y-2 bg-[#FFFDFB]/90 dark:bg-[#221B3B]/90">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs">
                      <div className="min-w-0">
                        <span className="block text-[10px] text-[#76658D] dark:text-[#CBBFE3]">สีผิว</span>
                        <span className="inline-flex items-center gap-1.5 font-bold break-words">
                          <span
                            className="w-2.5 h-2.5 border border-[#4E3B69] shrink-0"
                            style={{ backgroundColor: previewTraits.skinHex }}
                            aria-hidden="true"
                          />
                          <span>{previewTraits.skinLabel}</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-[#76658D] dark:text-[#CBBFE3]">สีตา</span>
                        <span className="font-bold block break-words">{previewTraits.eyeColorLabel}</span>
                      </div>
                      <div className="min-w-0 col-span-2 sm:col-span-1">
                        <span className="block text-[10px] text-[#76658D] dark:text-[#CBBFE3]">
                          {previewLife.person.ageYears <= 1 ? 'สีผมแรกเริ่ม' : 'สีผม'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-bold break-words">
                          {!previewTraits.isHairPendingReveal && (
                            <span
                              className="w-2.5 h-2.5 border border-[#4E3B69] shrink-0"
                              style={{ backgroundColor: previewTraits.hairHex }}
                              aria-hidden="true"
                            />
                          )}
                          <span>{previewTraits.hairColorLabel}</span>
                        </span>
                      </div>
                    </div>

                    {previewTraits.allTags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {previewTraits.styleTags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFF0F6] dark:bg-[#352B59] border border-[#4E3B69]/40 dark:border-[#7662AC] text-[#5A4773] dark:text-[#DDD6FE]"
                            >
                              {tag}
                            </span>
                          ))}
                          {previewTraits.allTags.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setPreviewTagsExpanded((prev) => !prev)}
                              className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#FFE58F] text-[#3D2D52] border border-[#4E3B69] hover:brightness-105"
                            >
                              {previewTagsExpanded
                                ? 'ย่อ'
                                : `+ดูเพิ่มเติม (${previewTraits.allTags.length - 3})`}
                            </button>
                          )}
                        </div>

                        {previewTagsExpanded && (
                          <div className="pt-2 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 space-y-1.5">
                            {APPEARANCE_TAG_CATEGORY_ORDER.map((cat) => {
                              const catTags = previewTraits.categorizedTags[cat];
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
                  </div>
                )}
              </div>
            </div>

            {mode === 'random' && (
              <div className="game-card p-5 space-y-4">
                <div>
                  <h2 className="font-display font-extrabold text-lg">เลือกช่วงอายุเริ่มต้น</h2>
                  <p className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
                    ค่าเริ่มต้นคือเกิดใหม่ (0 ปี) หรือเลือกโตขึ้นมาหน่อยก็ได้
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {START_POINT_OPTIONS.map((sp) => {
                    const active = randomStartPoint === sp.id;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setRandomStartPoint(sp.id)}
                        className={`game-btn p-3 text-left ${
                          active
                            ? 'bg-[#FFE58F] text-[#3D2D52]'
                            : 'bg-[#FFFDFB] dark:bg-[#221B3B]'
                        }`}
                      >
                        <div className="font-display font-bold text-sm">{sp.label}</div>
                        <div
                          className={`text-xs ${
                            active ? 'text-[#3D2D52]/80' : 'text-[#76658D] dark:text-[#CBBFE3]'
                          }`}
                        >
                          {sp.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ปุ่มทอยลูกเต๋า + ไอคอนลูกเต๋าพิกเซลที่เหลือ */}
                <div className="pt-3 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold mr-1">สิทธิ์สุ่มเหลือ:</span>
                    {Array.from({ length: MAX_REROLLS }).map((_, idx) => (
                      <span
                        key={idx}
                        className={idx < rerollsLeft ? 'opacity-100' : 'opacity-25 grayscale'}
                      >
                        <PixelIcon name="dice" size={20} />
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={rerollsLeft <= 0}
                    onClick={handleRerollRandom}
                    className="game-btn w-full sm:w-auto px-5 py-2.5 bg-[#FF8DA8] text-[#3D2D52] font-display font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <motion.span
                      key={diceSpinKey}
                      animate={reduceFx ? undefined : { rotate: [0, 360] }}
                      transition={{ duration: 0.45 }}
                      className="inline-flex"
                    >
                      <PixelIcon name="dice" size={20} />
                    </motion.span>
                    <span>ทอยลูกเต๋าเกิดใหม่</span>
                  </button>
                </div>

                {/* การ์ดเกิดมาพร้อม... */}
                <div className="px-inset p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#76658D] dark:text-[#CBBFE3] block">บ้านเกิด</span>
                    <span className="font-bold">จ.{previewLife.person.background.province} ({regionName})</span>
                  </div>
                  <div>
                    <span className="text-[#76658D] dark:text-[#CBBFE3] block">ครอบครัว</span>
                    <span className="font-bold">{fsName}</span>
                  </div>
                  <div>
                    <span className="text-[#76658D] dark:text-[#CBBFE3] block">อาชีพพ่อแม่</span>
                    <span className="font-bold">
                      {previewLife.person.background.fatherJob} / {previewLife.person.background.motherJob}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#76658D] dark:text-[#CBBFE3] block">นิสัยติดตัว</span>
                    <span className="font-bold">{tempName}</span>
                  </div>
                </div>
              </div>
            )}

            {mode === 'custom' && (
              <div className="game-card p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display font-extrabold text-lg">ตั้งค่าตัวละครเอง</h2>
                  <button
                    type="button"
                    onClick={() => setSeed((s) => (s + 9173) % 99999999)}
                    className="text-xs font-bold text-[#BD346B] dark:text-[#FFB8D4] hover:underline"
                  >
                    สุ่มใหม่เฉพาะช่องที่ติ๊ก
                  </button>
                </div>

                {/* อายุเริ่มต้น 0-65 */}
                <div className="px-inset p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display font-bold text-sm">
                      อายุเริ่มต้น: <span className="font-num text-[#BD346B] dark:text-[#FFB8D4]">{startingAge} ปี</span>
                    </span>
                    <div className="flex gap-1.5">
                      {[0, 6, 12, 18, 25].map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setStartingAge(a)}
                          className={`px-2.5 py-1 border-2 text-xs font-bold font-num ${
                            startingAge === a
                              ? 'bg-[#FFE58F] text-[#3D2D52] border-[#4E3B69]'
                              : 'bg-[#FFFDFB] dark:bg-[#2A2247] border-transparent'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={65}
                    value={startingAge}
                    onChange={(e) => setStartingAge(Number(e.target.value))}
                    className="w-full accent-[#FF8DA8]"
                  />
                </div>

                {/* ชื่อ-นามสกุล */}
                <div className="px-inset p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm">ชื่อและชื่อเล่น</span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={randName}
                        onChange={(e) => setRandName(e.target.checked)}
                        className="accent-[#FF8DA8] w-4 h-4"
                      />
                      <span>ให้สุ่มข้อนี้</span>
                    </label>
                  </div>
                  {!randName && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="ชื่อจริง"
                        className="px-3 py-2 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm"
                      />
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="นามสกุล"
                        className="px-3 py-2 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm"
                      />
                      <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="ชื่อเล่น"
                        className="px-3 py-2 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* เพศ */}
                <div className="px-inset p-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm">เพศ</span>
                    {!randGender && (
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                        className="px-3 py-1.5 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm"
                      >
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                        <option value="nonbinary">นอนไบนารี</option>
                      </select>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randGender}
                      onChange={(e) => setRandGender(e.target.checked)}
                      className="accent-[#FF8DA8] w-4 h-4"
                    />
                    <span>ให้สุ่มข้อนี้</span>
                  </label>
                </div>

                {/* ภูมิภาค & จังหวัด */}
                <div className="px-inset p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm">ภูมิภาคและจังหวัด</span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={randRegion}
                        onChange={(e) => setRandRegion(e.target.checked)}
                        className="accent-[#FF8DA8] w-4 h-4"
                      />
                      <span>ให้สุ่มข้อนี้</span>
                    </label>
                  </div>
                  {!randRegion && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={region}
                        onChange={(e) => {
                          const rId = e.target.value as RegionId;
                          setRegion(rId);
                          const rObj = REGIONS.find((r) => r.id === rId);
                          if (rObj) setProvince(rObj.provinces[0]);
                        }}
                        className="px-3 py-1.5 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm"
                      >
                        {REGIONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={randProvince}
                          onChange={(e) => setRandProvince(e.target.checked)}
                          className="accent-[#FF8DA8]"
                        />
                        <span>สุ่มจังหวัด</span>
                      </label>
                      {!randProvince && (
                        <select
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="px-3 py-1.5 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm"
                        >
                          {selectedRegionObj.provinces.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {/* ฐานะ + โครงสร้าง + การศึกษาพ่อแม่ + อารมณ์ + สุขภาพ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="px-inset p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs">ฐานะครอบครัว</span>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={randWealth}
                          onChange={(e) => setRandWealth(e.target.checked)}
                          className="accent-[#FF8DA8]"
                        />
                        <span>สุ่ม</span>
                      </label>
                    </div>
                    {!randWealth && (
                      <select
                        value={familyWealth}
                        onChange={(e) => setFamilyWealth(e.target.value as FamilyWealthTier)}
                        className="w-full px-2.5 py-1.5 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-xs"
                      >
                        {WEALTH_TIERS.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="px-inset p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs">โครงสร้างครอบครัว</span>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={randFamilyStruct}
                          onChange={(e) => setRandFamilyStruct(e.target.checked)}
                          className="accent-[#FF8DA8]"
                        />
                        <span>สุ่ม</span>
                      </label>
                    </div>
                    {!randFamilyStruct && (
                      <select
                        value={familyStructure}
                        onChange={(e) => setFamilyStructure(e.target.value as FamilyStructure)}
                        className="w-full px-2.5 py-1.5 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-xs"
                      >
                        {FAMILY_STRUCTURES.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="px-inset p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs">การศึกษาพ่อแม่</span>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={randParentEdu}
                          onChange={(e) => setRandParentEdu(e.target.checked)}
                          className="accent-[#FF8DA8]"
                        />
                        <span>สุ่ม</span>
                      </label>
                    </div>
                    {!randParentEdu && (
                      <select
                        value={parentEducation}
                        onChange={(e) => setParentEducation(e.target.value as ParentEducation)}
                        className="w-full px-2.5 py-1.5 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-xs"
                      >
                        {PARENT_EDUCATIONS.map((pe) => (
                          <option key={pe.id} value={pe.id}>
                            {pe.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="px-inset p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs">อารมณ์พื้นฐาน</span>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={randTemp}
                          onChange={(e) => setRandTemp(e.target.checked)}
                          className="accent-[#FF8DA8]"
                        />
                        <span>สุ่ม</span>
                      </label>
                    </div>
                    {!randTemp && (
                      <select
                        value={temperament}
                        onChange={(e) => setTemperament(e.target.value as TemperamentId)}
                        className="w-full px-2.5 py-1.5 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-xs"
                      >
                        {TEMPERAMENTS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* พันธุกรรมสุขภาพ */}
                <div className="px-inset p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm">พันธุกรรมสุขภาพ</span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={randHealth}
                        onChange={(e) => setRandHealth(e.target.checked)}
                        className="accent-[#FF8DA8] w-4 h-4"
                      />
                      <span>ให้สุ่มข้อนี้</span>
                    </label>
                  </div>
                  {!randHealth && (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={25}
                        max={95}
                        value={geneticHealth}
                        onChange={(e) => setGeneticHealth(Number(e.target.value))}
                        className="w-full accent-[#FF8DA8]"
                      />
                      <span className="font-num font-bold text-sm w-10 text-right">{geneticHealth}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="game-btn px-4 bg-[#FFFDFB] dark:bg-[#2A2247] font-display font-bold text-sm inline-flex items-center gap-1.5"
              >
                <PixelIcon name="arrow_left" size={16} />
                <span>ย้อนกลับ</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="game-btn flex-1 px-5 bg-[#6EE7B7] text-[#165940] font-display font-extrabold text-base inline-flex items-center justify-center gap-2"
              >
                <span>ดูเรื่องราวของฉัน</span>
                <PixelIcon name="arrow_right" size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: การ์ด "เรื่องราวของฉัน" สไตล์พาสปอร์ตพาสเทล + ปุ่มเริ่มชีวิต */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="game-card overflow-hidden">
              <div className="bg-[#FFE58F] dark:bg-[#8F7230] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PixelCornerStar size={14} animate={!reduceFx} />
                  <span className="font-display font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                    เรื่องราวของฉัน
                  </span>
                </div>
                <span className="text-[11px] font-bold font-num px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#352B59] border-2 border-[#4E3B69] text-[#3D2D52] dark:text-[#FFF6FA]">
                  #{currentRequest.seed}
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-4 px-window-striped">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar
                    seed={currentRequest.seed}
                    gender={previewLife.person.gender}
                    ageYears={previewLife.person.ageYears}
                    mentalIndex={previewLife.person.indices.mental}
                    jobId={previewLife.economy.jobId}
                    appearanceId={previewLife.person.appearance?.charId}
                    size={104}
                  />
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h2 className="font-display font-extrabold text-2xl">
                      {previewLife.person.firstName} {previewLife.person.lastName} ({previewLife.person.nickname})
                    </h2>
                    <PixelGenderBadge gender={previewLife.person.gender} size={16} />
                  </div>
                  <div className="text-sm font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                    อายุ {previewLife.person.ageYears} ปี · {previewLife.economy.jobTitle} · {EDUCATION_LABELS[previewLife.person.education]}
                  </div>
                  {previewTraits && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                      <span className="px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#221B3B] border-2 border-[#4E3B69]/40 dark:border-[#7662AC] font-bold">
                        ผิว{previewTraits.skinLabel}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#221B3B] border-2 border-[#4E3B69]/40 dark:border-[#7662AC] font-bold">
                        {previewTraits.isEyePendingReveal
                          ? previewTraits.eyeColorLabel
                          : `ตา${previewTraits.eyeColorLabel}`}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#221B3B] border-2 border-[#4E3B69]/40 dark:border-[#7662AC] font-bold">
                        {previewTraits.isHairPendingReveal
                          ? `ผม${previewTraits.hairColorLabel}`
                          : `${previewLife.person.ageYears <= 1 ? 'ผมแรกเริ่มสี' : 'ผมสี'}${previewTraits.hairColorLabel}`}
                      </span>
                    </div>
                  )}
                </div>

                <p className="px-inset p-4 text-sm sm:text-base text-[#5A4773] dark:text-[#DDD6FE] leading-relaxed">
                  {previewLife.person.backstory.narrativeCard}
                </p>

                <div className="space-y-1.5">
                  <div className="font-display font-bold text-sm">จุดเริ่มต้นและอดีตที่ผ่านมา</div>
                  <ul className="space-y-1 text-sm text-[#5A4773] dark:text-[#DDD6FE] list-disc pl-5">
                    {previewLife.person.backstory.turningPoints.map((tp, i) => (
                      <li key={i}>{tp}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-dashed border-[#4E3B69]/25 dark:border-white/15">
                  <div className="px-slot p-3 bg-[#D6FAEA] dark:bg-[#1E533F]/60">
                    <span className="text-xs text-[#167956] dark:text-[#7EF4C2] block">เงินสดตั้งต้น</span>
                    <span className="font-display font-extrabold text-lg font-num text-[#167956] dark:text-[#7EF4C2]">
                      {previewLife.economy.cash.toLocaleString('th-TH')} ฿
                    </span>
                  </div>
                  <div className="px-slot p-3 bg-[#FFE0EE] dark:bg-[#6E2647]/70">
                    <span className="text-xs text-[#BD346B] dark:text-[#FFB8D4] block">หนี้สินติดตัว</span>
                    <span className="font-display font-extrabold text-lg font-num text-[#BD346B] dark:text-[#FFB8D4]">
                      {previewLife.economy.debt.toLocaleString('th-TH')} ฿
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="game-btn px-4 bg-[#FFFDFB] dark:bg-[#2A2247] font-display font-bold text-sm inline-flex items-center gap-1.5"
              >
                <PixelIcon name="arrow_left" size={16} />
                <span>แก้ไข</span>
              </button>
              <button
                type="button"
                onClick={() => onStartLife(currentRequest)}
                className="game-btn flex-1 py-3.5 px-6 bg-[#FF8DA8] text-[#3D2D52] font-display font-extrabold text-lg inline-flex items-center justify-center gap-2"
              >
                <PixelIcon name="play" size={20} />
                <span>เริ่มชีวิต</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <CharacterGalleryModal
        isOpen={galleryOpen}
        gender={previewLife.person.gender}
        ageYears={previewLife.person.ageYears}
        region={previewLife.person.background.region}
        province={previewLife.person.background.province}
        selectedCharId={previewLife.person.appearance?.charId}
        reduceFx={reduceFx}
        onSelectCharacter={(charId) => setAppearanceOverride(charId)}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}
