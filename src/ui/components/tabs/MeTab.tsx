import { useState } from 'react';
import {
  EDUCATION_LABELS,
  FAMILY_STRUCTURES,
  PARENT_EDUCATIONS,
  RAW_STAT_DETAILS,
  RAW_STAT_GROUPS,
  REGIONS,
  SKILL_LABELS,
  TEMPERAMENTS,
  WEALTH_TIERS,
} from '../../../data/thaiData';
import {
  PERSONALITY_AXIS_META,
  TRAIT_CATEGORY_META,
  TRAIT_INTENSITY_META,
  TRAITS_BY_ID,
  TURNING_POINT_DEFS,
} from '../../../data/traits';
import { describeAppearanceTraits, evaluateAppearanceImpact } from '../../../engine/appearance';
import { getAgeEmploymentRules, getLifeStageForAge } from '../../../engine/lifeStage';
import { getSkillGrowthDetails } from '../../../engine/skillTraining';
import type {
  GameState,
  PersonalityAxisKey,
  PlayerAction,
  ReputationGroupKey,
  SkillKey,
  TemperamentDimensions,
} from '../../../engine/types';
import { PixelIcon } from '../../art/PixelIcons';

interface MeTabProps {
  state: GameState;
  onSelectExplain: (key: string) => void;
  onDispatch?: (action: PlayerAction) => void;
}

type MeSubTab = 'stats' | 'stage_traits' | 'backstory';

const SKILL_KEYS: SkillKey[] = [
  'english',
  'sales',
  'finance',
  'tech',
  'craft',
  'cooking',
  'socializing',
  'academic',
];

const TEMP_DIM_META: Array<{ key: keyof TemperamentDimensions; labelTh: string; color: string }> = [
  { key: 'energy', labelTh: 'พลังงานพื้นฐาน', color: '#6EE7B7' },
  { key: 'positivity', labelTh: 'มองโลกแง่ดี', color: '#FFE58F' },
  { key: 'sensitivity', labelTh: 'ความอ่อนไหว', color: '#FFB8D2' },
  { key: 'obsessiveness', labelTh: 'ความหมกมุ่นโฟกัส', color: '#C4B5FD' },
];

const PERSONALITY_KEYS: PersonalityAxisKey[] = ['ambition', 'agreeableness', 'stability'];

const REP_LABELS: Array<{ key: ReputationGroupKey; labelTh: string }> = [
  { key: 'family', labelTh: 'ครอบครัว' },
  { key: 'friends', labelTh: 'เพื่อนฝูง' },
  { key: 'work', labelTh: 'ที่ทำงาน/เรียน' },
  { key: 'community', labelTh: 'ชุมชนรอบตัว' },
];

export function MeTab({ state, onSelectExplain, onDispatch }: MeTabProps) {
  const { character } = state;
  const { rawStats, resources, skills, background, backstory } = character;
  const [activeSubTab, setActiveSubTab] = useState<MeSubTab>('stats');
  const [selectedTpKind, setSelectedTpKind] = useState<string>(TURNING_POINT_DEFS[0].kind);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const regionName = REGIONS.find((r) => r.id === background.region)?.name ?? '';
  const wealthName = WEALTH_TIERS.find((w) => w.id === background.familyWealth)?.label ?? '';
  const fsName = FAMILY_STRUCTURES.find((f) => f.id === background.familyStructure)?.label ?? '';
  const peName = PARENT_EDUCATIONS.find((p) => p.id === background.parentEducation)?.label ?? '';
  const tempInfo = TEMPERAMENTS.find((t) => t.id === background.temperament);
  const appearanceSummary = describeAppearanceTraits(character.appearance?.charId, {
    ageYears: character.ageYears,
    appearance: character.appearance,
    flags: character.flags,
  });
  const appearanceImpact = evaluateAppearanceImpact(character);

  const stageDef = getLifeStageForAge(character.ageYears);
  const ageRules = getAgeEmploymentRules(character.ageYears, state.settings);
  const tempProfile = character.temperamentProfile ?? {
    energy: 50,
    positivity: 50,
    sensitivity: 50,
    obsessiveness: 50,
  };
  const personality = character.personality ?? {
    ambition: 50,
    agreeableness: 50,
    stability: 50,
  };
  const emergentTraits = character.emergentTraits ?? [];
  const innerTension = character.innerTension ?? 0;
  const repView = character.reputationView ?? { family: 50, friends: 50, work: 50, community: 50 };
  const focusSkills = state.skillTraining?.focus ?? [];

  return (
    <div className="space-y-3.5">
      {/* 1. แถบสรุปพลังชีวิตประจำวัน (อยู่อันดับแรกเสมอ แตะดูที่มาได้ทันที) */}
      <div className="game-card p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PixelIcon name="lightning" size={16} />
            <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
              พลังชีวิตวันนี้
            </h3>
          </div>
          <span className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">แตะเพื่อดูสาเหตุ</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSelectExplain('res:energy')}
            className="game-btn text-left p-2.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-1 transition-transform active:translate-y-0.5"
          >
            <div className="flex justify-between text-xs font-bold">
              <span>พลังงาน</span>
              <span className="font-num tabular-nums text-[#167956] dark:text-[#7EF4C2]">
                {Math.round(resources.energy)}%
              </span>
            </div>
            <div className="px-progress-track h-2.5 bg-[#E8FDF3] dark:bg-[#194736]/55">
              <div
                className="px-progress-fill h-full bg-[#6EE7B7]"
                style={{ width: `${Math.max(0, Math.min(100, resources.energy))}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectExplain('res:stress')}
            className="game-btn text-left p-2.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-1 transition-transform active:translate-y-0.5"
          >
            <div className="flex justify-between text-xs font-bold">
              <span>ความเครียด</span>
              <span className="font-num tabular-nums text-[#BD346B] dark:text-[#FFB8D4]">
                {Math.round(resources.stress)}%
              </span>
            </div>
            <div className="px-progress-track h-2.5 bg-[#FFF0F6] dark:bg-[#6E2647]/50">
              <div
                className="px-progress-fill h-full bg-[#FFA6C9]"
                style={{ width: `${Math.max(0, Math.min(100, resources.stress))}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectExplain('res:freeTime')}
            className="game-btn text-left p-2.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-1 transition-transform active:translate-y-0.5"
          >
            <div className="flex justify-between text-xs font-bold">
              <span>เวลาว่าง/วัน</span>
              <span className="font-num tabular-nums text-[#2559B8] dark:text-[#B8D8FE]">
                {resources.freeTime.toFixed(1)} ชม.
              </span>
            </div>
            <div className="px-progress-track h-2.5 bg-[#EFF6FF] dark:bg-[#223F7D]/50">
              <div
                className="px-progress-fill h-full bg-[#93C5FD]"
                style={{ width: `${Math.min(100, (resources.freeTime / 16) * 100)}%` }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* 2. แท็บย่อยจัดระเบียบหน้าชีวิต (ลดการไถหน้าจอยาวๆ) */}
      <div className="px-inset p-1 bg-[#FFF0F6] dark:bg-[#221B3B] grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('stats')}
          className={`py-2 px-2 text-xs font-display font-extrabold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
            activeSubTab === 'stats'
              ? 'px-slot bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] shadow-xs'
              : 'text-[#5A4773] dark:text-[#DDD6FE] hover:bg-[#FFFDFB]/40'
          }`}
        >
          <PixelIcon name="sparkle" size={13} />
          <span>ต้นทุน & ทักษะ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('stage_traits')}
          className={`py-2 px-2 text-xs font-display font-extrabold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
            activeSubTab === 'stage_traits'
              ? 'px-slot bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] shadow-xs'
              : 'text-[#5A4773] dark:text-[#DDD6FE] hover:bg-[#FFFDFB]/40'
          }`}
        >
          <PixelIcon name="heart" size={13} />
          <span>ช่วงวัย & นิสัย</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backstory')}
          className={`py-2 px-2 text-xs font-display font-extrabold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
            activeSubTab === 'backstory'
              ? 'px-slot bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] shadow-xs'
              : 'text-[#5A4773] dark:text-[#DDD6FE] hover:bg-[#FFFDFB]/40'
          }`}
        >
          <PixelIcon name="life" size={13} />
          <span>ปูมหลัง & ประวัติ</span>
        </button>
      </div>

      {/* 3. เนื้อหาแท็บ 1: ต้นทุนติดตัว 9 ด้าน & ทักษะที่สั่งสม */}
      {activeSubTab === 'stats' && (
        <div className="space-y-3.5">
          {/* ต้นทุนติดตัว 9 ด้าน (แบ่ง 3 กลุ่ม: กายภาพ / สมองและงาน / ใจและผู้คน) */}
          <div className="game-card overflow-hidden">
            <div className="bg-[#EAE2FF] dark:bg-[#4F358D] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PixelIcon name="sparkle" size={18} />
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                    ต้นทุนติดตัว 9 ด้าน
                  </h3>
                  <p className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE] truncate">
                    แตะที่การ์ดเพื่อดูรายละเอียด (เสริมดัชนี · เร่งทักษะ · การเพิ่ม/ลด)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSection('rawStats')}
                  aria-label={collapsedSections.rawStats ? 'ขยายต้นทุนติดตัว' : 'ย่อต้นทุนติดตัว'}
                  className="game-btn px-2 py-1 bg-[#FFFDFB] dark:bg-[#352B59] text-[10px] font-bold text-[#663FB5] dark:text-[#DDD2FE] inline-flex items-center gap-1"
                >
                  <span>{collapsedSections.rawStats ? 'ขยาย' : 'ย่อ'}</span>
                  <PixelIcon
                    name={collapsedSections.rawStats ? 'chevron_down' : 'chevron_up'}
                    size={11}
                  />
                </button>
              </div>
            </div>

            {!collapsedSections.rawStats && (
              <div className="p-3 sm:p-4 space-y-3 px-window-striped">
              {RAW_STAT_GROUPS.map((grp) => (
                <div key={grp.key} className="px-inset p-3 bg-[#FFFDFB]/90 dark:bg-[#221B3B]/90 space-y-2">
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#4E3B69]/15 dark:border-white/10">
                    <div className="min-w-0">
                      <span className="font-display font-bold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                        กลุ่ม{grp.labelTh}
                      </span>
                      <span className="hidden sm:inline text-[11px] text-[#76658D] dark:text-[#CBBFE3] ml-2">
                        · {grp.descTh}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#76658D] dark:text-[#CBBFE3] shrink-0">
                      3 ด้าน
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {grp.keys.map((key) => {
                      const val = Math.round(rawStats[key]);
                      const detail = RAW_STAT_DETAILS[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onSelectExplain(`raw:${key}`)}
                          className="game-btn text-left p-2.5 bg-[#FFFDFB] dark:bg-[#2A2247] space-y-1.5 transition-transform active:translate-y-0.5 hover:brightness-[0.98]"
                        >
                          <div className="flex items-center justify-between text-xs font-bold gap-1">
                            <span className="truncate">{detail.label}</span>
                            <span className="font-num tabular-nums text-[#663FB5] dark:text-[#DDD2FE] shrink-0">
                              {val}
                            </span>
                          </div>
                          <div className="px-progress-track h-2 bg-[#F5F2FF] dark:bg-[#352B59]">
                            <div
                              className="px-progress-fill h-full bg-[#C4B5FD]"
                              style={{ width: `${Math.max(0, Math.min(100, val))}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#76658D] dark:text-[#CBBFE3] pt-0.5">
                            <span className="truncate">{detail.indicesSupported[0]}</span>
                            <span className="text-[#BD346B] dark:text-[#FFB8D4] shrink-0 font-bold">
                              ดูวิธีพยุง →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* ทักษะที่สั่งสม (8 ทักษะ พร้อมเกณฑ์และตัวคูณ) */}
          <div className="game-card overflow-hidden">
            <div className="bg-[#FFE58F] dark:bg-[#7A5B1F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PixelIcon name="star" size={18} />
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                    ทักษะที่สั่งสม ({SKILL_KEYS.length} ด้าน)
                  </h3>
                  <p className="text-[11px] text-[#5A3F73] dark:text-[#F4E6F0] truncate">
                    แตะเพื่อดูรายละเอียดการฝึก อัตราเติบโต และเงื่อนไขปลดล็อกขั้นถัดไป
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {focusSkills.length > 0 && (
                  <span className="px-2 py-0.5 bg-[#FFFDFB] text-[#165940] border border-[#4E3B69] text-[10px] font-bold">
                    โฟกัส {focusSkills.length} ด้าน
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection('skills')}
                  aria-label={collapsedSections.skills ? 'ขยายทักษะที่สั่งสม' : 'ย่อทักษะที่สั่งสม'}
                  className="game-btn px-2 py-1 bg-[#FFFDFB] dark:bg-[#352B59] text-[10px] font-bold text-[#3D2D52] dark:text-[#FFF6FA] inline-flex items-center gap-1"
                >
                  <span>{collapsedSections.skills ? 'ขยาย' : 'ย่อ'}</span>
                  <PixelIcon
                    name={collapsedSections.skills ? 'chevron_down' : 'chevron_up'}
                    size={11}
                  />
                </button>
              </div>
            </div>

            {!collapsedSections.skills && (
              <div className="p-3 sm:p-4 px-window-striped">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SKILL_KEYS.map((key) => {
                  const val = skills[key];
                  const meta = SKILL_LABELS[key];
                  const details = getSkillGrowthDetails(state, key);
                  const isFocus = focusSkills.includes(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSelectExplain(`skill:${key}`)}
                      className="game-btn text-left p-2.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-1.5 transition-transform active:translate-y-0.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{meta.label}</span>
                          {isFocus && (
                            <span className="px-1 py-0.2 bg-[#D6FAEA] text-[#165940] border border-[#4E3B69]/40 text-[9px] font-extrabold shrink-0">
                              โฟกัส
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-num tabular-nums text-[#BD346B] dark:text-[#FFB8D4]">
                            {val.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-[#76658D] dark:text-[#CBBFE3]">
                            /{details.effectiveCap}
                          </span>
                        </div>
                      </div>

                      <div className="px-progress-track h-2 bg-[#EFF6FF] dark:bg-[#352B59]">
                        <div
                          className="px-progress-fill h-full bg-[#93C5FD]"
                          style={{
                            width: `${Math.max(0, Math.min(100, (val / details.effectiveCap) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#76658D] dark:text-[#CBBFE3]">
                        <span className="truncate">
                          {details.atCap
                            ? 'ติดเพดานขั้น'
                            : details.estimatedWeeklyGain > 0
                              ? `+${details.estimatedWeeklyGain.toFixed(2)}/สัปดาห์`
                              : `ขั้น ${details.tierLabelTh}`}
                        </span>
                        <span className="text-[#2559B8] dark:text-[#B8D8FE] font-semibold shrink-0">
                          ดูรายละเอียด →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. เนื้อหาแท็บ 2: ช่วงวัยปัจจุบัน & นิสัย 3 ชั้น */}
      {activeSubTab === 'stage_traits' && (
        <div className="space-y-3.5">
          {/* ช่วงวัยปัจจุบัน */}
          <div className="game-card overflow-hidden">
            <div
              className="border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
              style={{ backgroundColor: stageDef.badgeColor }}
            >
              <div className="flex items-center gap-2">
                <PixelIcon name="star" size={18} />
                <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52]">
                  ช่วงวัย: {stageDef.labelTh}
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-[#FFFDFB] border-2 border-[#4E3B69] text-[10px] sm:text-[11px] font-bold font-num text-[#3D2D52]">
                ไวต่อนิสัย x{stageDef.sensitiveMultiplier.toFixed(2)}
              </span>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5 px-window-striped text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-1">
                  <div className="font-display font-bold text-[#167956] dark:text-[#7EF4C2]">
                    สิ่งที่เปิดใช้ในวัยนี้
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#5A4773] dark:text-[#DDD6FE]">
                    {stageDef.unlockedSystemsTh.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-1">
                  <div className="font-display font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                    ขอบเขตตามช่วงวัย
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#5A4773] dark:text-[#DDD6FE]">
                    {stageDef.restrictionsTh.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    <li>
                      สิทธิ์ทำงาน:{' '}
                      {ageRules.canWorkAny && !ageRules.canWorkPartTimeOnly
                        ? 'ทำงานประจำและกะกลางคืนได้'
                        : ageRules.canWorkPartTimeOnly
                          ? `พาร์ตไทม์ไม่เกิน ${ageRules.maxWeeklyHours} ชม./สัปดาห์`
                          : 'ยังทำงานรับจ้างไม่ได้ (<15 ปี)'}
                    </li>
                    <li>
                      สถานบันเทิง:{' '}
                      {ageRules.canEnterPubCustomer
                        ? 'เข้าใช้บริการได้ตามเกณฑ์'
                        : 'ยังไม่ถึงเกณฑ์เข้าสถานบันเทิง'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ระบบนิสัยและบุคลิกภาพ 3 ชั้น */}
          <div className="game-card overflow-hidden">
            <div className="bg-[#FFE0EE] dark:bg-[#6E2647] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PixelIcon name="heart" size={18} />
                <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                  นิสัยและบุคลิกภาพ 3 ชั้น
                </h3>
              </div>
              {innerTension > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectExplain('innerTension')}
                  className="game-btn px-2.5 py-1 bg-[#FFE58F] text-[#3D2D52] text-[11px] font-bold inline-flex items-center gap-1"
                >
                  <PixelIcon name="warning" size={12} />
                  <span>ขัดแย้งภายใน {innerTension}</span>
                </button>
              )}
            </div>

            <div className="p-3 sm:p-4 space-y-3 px-window-striped">
              {/* Layer A & Layer B */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-[#3D2D52] dark:text-[#FFF6FA]">
                      พื้นฐานอารมณ์แต่กำเนิด ({tempInfo?.label})
                    </span>
                    <span className="text-[10px] text-[#76658D] dark:text-[#CBBFE3]">เปลี่ยนช้ามาก</span>
                  </div>
                  {TEMP_DIM_META.map((dim) => {
                    const val = Math.round(tempProfile[dim.key]);
                    return (
                      <div key={dim.key} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span>{dim.labelTh}</span>
                          <span className="font-num tabular-nums">{val}</span>
                        </div>
                        <div className="px-progress-track h-2 bg-[#FFF0F6] dark:bg-[#352B59]">
                          <div
                            className="px-progress-fill h-full"
                            style={{ width: `${val}%`, backgroundColor: dim.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-[#3D2D52] dark:text-[#FFF6FA]">
                      บุคลิกภาพหลัก 3 ด้าน
                    </span>
                    <span className="text-[10px] text-[#76658D] dark:text-[#CBBFE3]">ขยับตามวัย</span>
                  </div>
                  {PERSONALITY_KEYS.map((axis) => {
                    const meta = PERSONALITY_AXIS_META[axis];
                    const val = Math.round(personality[axis]);
                    return (
                      <div key={axis} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="truncate">{meta.labelTh}</span>
                          <span className="font-num tabular-nums">{val}</span>
                        </div>
                        <div className="px-progress-track h-2 bg-[#EFF6FF] dark:bg-[#352B59]">
                          <div
                            className="px-progress-fill h-full bg-[#93C5FD]"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#76658D] dark:text-[#CBBFE3]">
                          <span>{meta.lowLabelTh}</span>
                          <span>{meta.highLabelTh}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Layer C: Emergent Behavioral Traits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                    นิสัยที่ก่อตัวจากการใช้ชีวิต ({emergentTraits.length})
                  </h4>
                  <span className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
                    แตะการ์ดเพื่อดูที่มาและวิธีปรับสมดุล
                  </span>
                </div>

                {emergentTraits.length === 0 ? (
                  <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] text-xs text-[#76658D] dark:text-[#CBBFE3]">
                    ยังไม่ปรากฏนิสัยเฉพาะตัว เมื่อใช้ชีวิตและสะสมพฤติกรรมซ้ำๆ นิสัยใหม่จะค่อยๆ ก่อตัวขึ้น
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {emergentTraits.map((inst) => {
                      const def = TRAITS_BY_ID.get(inst.id);
                      if (!def) return null;
                      const isHidden = inst.visibility === 'hidden_to_self';
                      const catMeta = TRAIT_CATEGORY_META[def.category];
                      const intMeta = TRAIT_INTENSITY_META[inst.intensity];

                      if (isHidden) {
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => onSelectExplain(`trait:${inst.id}`)}
                            className="game-btn text-left p-3 bg-[#F4F0FF] dark:bg-[#2A2247] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display font-bold text-xs text-[#663FB5] dark:text-[#DDD2FE]">
                                แนวโน้มแฝงที่ยังไม่รู้ตัว
                              </span>
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#EAE2FF] text-[#3D2D52] border border-[#4E3B69]">
                                แฝงลึก
                              </span>
                            </div>
                            <p className="text-xs text-[#5A4773] dark:text-[#DDD6FE] leading-snug">
                              {def.subtleHintTh}
                            </p>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => onSelectExplain(`trait:${inst.id}`)}
                          className="game-btn text-left p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-extrabold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                              {def.nameTh}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className="px-1.5 py-0.5 text-[10px] font-bold text-[#3D2D52] border border-[#4E3B69]"
                                style={{ backgroundColor: catMeta.accentBg }}
                              >
                                {intMeta.labelTh}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE] leading-snug">
                            {def.descriptionTh}
                          </p>
                          <div className="text-[11px] font-semibold text-[#76658D] dark:text-[#CBBFE3]">
                            ที่มา: {inst.originStory}
                          </div>
                          {def.isNegative && (
                            <div className="text-[11px] font-semibold text-[#167956] dark:text-[#7EF4C2]">
                              ปรับสมดุล: {def.recoveryPathTh}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reputation View */}
              <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-xs text-[#3D2D52] dark:text-[#FFF6FA]">
                    มุมมองและภาพจำของคนรอบข้างที่มีต่อคุณ
                  </span>
                  <span className="text-[10px] text-[#76658D] dark:text-[#CBBFE3]">50 = ปานกลาง</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REP_LABELS.map((grp) => (
                    <div
                      key={grp.key}
                      className="px-slot p-2 bg-[#FFF8E6] dark:bg-[#352B59] text-center"
                    >
                      <div className="text-[11px] font-semibold text-[#76658D] dark:text-[#CBBFE3]">
                        {grp.labelTh}
                      </div>
                      <div className="font-num tabular-nums font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                        {Math.round(repView[grp.key])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dev Trigger Turning Point */}
              {onDispatch && (
                <div className="pt-2 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-[#76658D] dark:text-[#CBBFE3]">
                    ลองจำลองเหตุการณ์จุดเปลี่ยนชีวิต:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="เลือกเหตุการณ์จุดเปลี่ยนชีวิต"
                      value={selectedTpKind}
                      onChange={(e) => setSelectedTpKind(e.target.value)}
                      className="px-slot px-2 py-1.5 text-xs font-semibold bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] max-w-[220px]"
                    >
                      {TURNING_POINT_DEFS.map((tp) => (
                        <option key={tp.kind} value={tp.kind}>
                          {tp.titleTh}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!character.isAlive}
                      onClick={() =>
                        onDispatch({ type: 'TRIGGER_TURNING_POINT', kind: selectedTpKind })
                      }
                      className="game-btn px-3 py-1.5 bg-[#FFE58F] text-[#3D2D52] text-xs font-display font-extrabold disabled:opacity-40"
                    >
                      จำลองจุดเปลี่ยน
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. เนื้อหาแท็บ 3: ปูมหลัง & ประวัติชีวิต */}
      {activeSubTab === 'backstory' && (
        <div className="space-y-3.5">
          {/* โปรไฟล์และปูมหลังครอบครัว */}
          <div className="game-card overflow-hidden">
            <div className="bg-[#B4C3FF] dark:bg-[#4F5DA8] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PixelIcon name="life" size={18} />
                <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                  โปรไฟล์และปูมหลังครอบครัว
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-[#FFFDFB] dark:bg-[#352B59] text-xs font-bold text-[#2559B8] dark:text-[#B8D8FE] border-2 border-[#4E3B69] dark:border-[#7662AC]">
                {EDUCATION_LABELS[character.education]}
              </span>
            </div>

            <div className="p-3 sm:p-4 space-y-3 px-window-striped">
              <p className="text-sm text-[#5A4773] dark:text-[#DDD6FE] leading-relaxed">
                {backstory.narrativeCard}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 text-xs">
                <div className="space-y-1.5 text-[#5A4773] dark:text-[#DDD6FE]">
                  <div className="font-display font-bold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                    พื้นเพครอบครัว
                  </div>
                  <div>ถิ่นเกิด: {regionName} (จ.{background.province})</div>
                  <div>ฐานะทางบ้าน: {wealthName} · {fsName}</div>
                  <div>อาชีพพ่อแม่: {background.fatherJob} / {background.motherJob}</div>
                  <div>วุฒิพ่อแม่: {peName} · อารมณ์: {tempInfo?.label}</div>
                </div>

                <div className="space-y-1.5 text-[#5A4773] dark:text-[#DDD6FE]">
                  <div className="font-display font-bold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                    รูปลักษณ์และภาพลักษณ์
                  </div>
                  {appearanceSummary && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                        ผิว{appearanceSummary.skinLabel} · ตา{appearanceSummary.eyeColorLabel} · ผมสี{appearanceSummary.hairColorLabel}
                      </div>
                      {character.ageYears >= 15 && (
                        <div className="text-[11px] text-[#5A4773] dark:text-[#DDD6FE]">
                          ภาพลักษณ์งานทางการ: {appearanceImpact.activeStyleLabelTh}
                          {appearanceImpact.formalCredibilityDelta !== 0 && (
                            <button
                              type="button"
                              onClick={() => onSelectExplain('index:status')}
                              className={`ml-1.5 font-bold underline ${
                                appearanceImpact.formalCredibilityDelta > 0
                                  ? 'text-[#167956] dark:text-[#7EF4C2]'
                                  : 'text-[#BD346B] dark:text-[#FFB8D4]'
                              }`}
                            >
                              ({appearanceImpact.formalCredibilityDelta > 0 ? '+' : ''}
                              {appearanceImpact.formalCredibilityDelta} สถานะ)
                            </button>
                          )}
                          {appearanceImpact.blocksStrictFormalJobs && (
                            <span className="block text-[10px] font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                              * ลุคนี้ยังไม่ผ่านเกณฑ์สายงานราชการ/ทางการเข้มงวด
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* เรื่องราวที่ผ่านมาและจุดเปลี่ยนชีวิต */}
          <div className="game-card overflow-hidden">
            <div className="bg-[#D6FAEA] dark:bg-[#1E4D3B] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PixelIcon name="journal" size={18} />
                <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                  ประวัติชีวิตและจุดเปลี่ยนที่ผ่านมา
                </h3>
              </div>
              <span className="text-xs font-num font-bold text-[#165940] dark:text-[#7EF4C2]">
                {backstory.turningPoints.length} เหตุการณ์
              </span>
            </div>

            <div className="p-3 sm:p-4 px-window-striped text-xs text-[#5A4773] dark:text-[#DDD6FE]">
              {backstory.turningPoints.length === 0 ? (
                <div className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] text-[#76658D] dark:text-[#CBBFE3]">
                  ยังไม่มีบันทึกจุดเปลี่ยนชีวิตสำคัญ เมื่อผ่านเหตุการณ์ชีวิตครั้งใหญ่ เรื่องราวจะถูกจดจำไว้ที่นี่
                </div>
              ) : (
                <ul className="space-y-1.5 list-disc pl-5">
                  {backstory.turningPoints.map((tp, i) => (
                    <li key={i} className="leading-relaxed">
                      {tp}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
