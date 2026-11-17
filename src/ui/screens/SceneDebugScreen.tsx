import { useState, useMemo } from 'react';
import {
  ALL_DAYPARTS,
  type Daypart,
  isSceneOpen,
  type SceneCategory,
  SCENE_MANIFEST,
  sceneImagePath,
  type SceneSettings,
} from '../../engine/scene';
import { pickSceneForState } from '../../data/sceneRules';
import type { GameState } from '../../engine/types';
import { PixelCornerStar, PixelIcon } from '../art/PixelIcons';

interface SceneDebugScreenProps {
  state?: GameState;
  onClose: () => void;
}

const DAYPART_TITLE: Record<Daypart, { labelTh: string; timeTh: string; icon: 'sun' | 'moon' }> = {
  morning: { labelTh: 'เช้า', timeTh: '05:00-11:59', icon: 'sun' },
  afternoon: { labelTh: 'บ่าย', timeTh: '12:00-16:59', icon: 'sun' },
  evening: { labelTh: 'เย็น', timeTh: '17:00-20:59', icon: 'moon' },
  night: { labelTh: 'ดึก', timeTh: '21:00-04:59', icon: 'moon' },
};

const CATEGORIES: Array<{ id: 'all' | SceneCategory; label: string }> = [
  { id: 'all', label: 'ทั้งหมด (21)' },
  { id: 'home', label: 'บ้าน (7)' },
  { id: 'school', label: 'โรงเรียน (3)' },
  { id: 'education', label: 'มหาวิทยาลัย (1)' },
  { id: 'work', label: 'ที่ทำงาน (2)' },
  { id: 'commerce', label: 'การค้า/ร้าน (4)' },
  { id: 'street', label: 'ถนน (1)' },
  { id: 'public', label: 'สาธารณะ (1)' },
  { id: 'nightlife', label: 'กลางคืน/ผับ (2)' },
];

export function SceneDebugScreen({ state, onClose }: SceneDebugScreenProps) {
  const [testAge, setTestAge] = useState<number>(state?.character.ageYears ?? 20);
  const [pubVisitAge, setPubVisitAge] = useState<18 | 20>(20);
  const [selectedCategory, setSelectedCategory] = useState<'all' | SceneCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const settings: SceneSettings = useMemo(() => ({ pubVisitAge }), [pubVisitAge]);

  const filteredScenes = useMemo(() => {
    return SCENE_MANIFEST.scenes.filter((scene) => {
      if (selectedCategory !== 'all' && scene.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = scene.id.toLowerCase().includes(q);
        const matchTh = scene.nameTh.toLowerCase().includes(q);
        const matchEn = scene.nameEn.toLowerCase().includes(q);
        const matchTag = scene.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchId && !matchTh && !matchEn && !matchTag) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Current simulation state resolution (if available)
  const currentResolution = useMemo(() => {
    if (!state) return null;
    const sceneId = pickSceneForState(state, settings);
    return {
      sceneId,
      scene: SCENE_MANIFEST.scenes.find((s) => s.id === sceneId),
    };
  }, [state, settings]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scene System Debug"
      className="fixed inset-0 z-50 bg-[#1E1833] text-[#FFF6FA] flex flex-col overflow-hidden font-body"
    >
      {/* Header bar */}
      <div className="bg-[#2A2247] border-b-2 border-[#7662AC] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <PixelCornerStar size={16} />
          <div>
            <h1 className="font-display font-extrabold text-base sm:text-lg">
              ดีบักระบบฉาก (Scene System Debug — Phase 1.8)
            </h1>
            <p className="text-xs text-[#CBBFE3]">
              ตรวจสอบ 21 ฉาก 40 ภาพ (688x384), ความสอดคล้อง daypart, และ Availability Gates
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="game-btn px-4 py-2 bg-[#FF8DA8] text-[#3D2D52] font-display font-extrabold text-sm"
        >
          ปิดหน้าดีบัก
        </button>
      </div>

      {/* Control panel */}
      <div className="bg-[#241C3E] border-b-2 border-[#4E3B69] p-3 sm:p-4 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Age tester input */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#E2D9F3]">ทดสอบอายุตัวละคร:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={testAge}
              onChange={(e) => setTestAge(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 px-2 py-1 bg-[#1A142D] border-2 border-[#7662AC] text-center font-num font-bold text-sm"
            />
            <span className="font-num text-[#A7F3D0]">
              {testAge < 18 ? 'เยาวชน (<18 ล็อกผับ)' : testAge < 20 ? '18-19 ปี' : 'ผู้ใหญ่ (20+)'}
            </span>
          </div>

          {/* Pub Visit Age setting switch */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#E2D9F3]">เกณฑ์อายุเข้าผับ (pubVisitAge):</span>
            <div className="inline-flex border-2 border-[#7662AC]">
              <button
                type="button"
                onClick={() => setPubVisitAge(20)}
                className={`px-2.5 py-1 font-bold ${
                  pubVisitAge === 20
                    ? 'bg-[#FFE58F] text-[#3D2D52]'
                    : 'bg-[#1A142D] text-[#CBBFE3] hover:brightness-110'
                }`}
              >
                20 ปี (ค่าเริ่มต้น)
              </button>
              <button
                type="button"
                onClick={() => setPubVisitAge(18)}
                className={`px-2.5 py-1 font-bold border-l-2 border-[#7662AC] ${
                  pubVisitAge === 18
                    ? 'bg-[#FFE58F] text-[#3D2D52]'
                    : 'bg-[#1A142D] text-[#CBBFE3] hover:brightness-110'
                }`}
              >
                18 ปี (ผ่อนผัน)
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="ค้นหา ID, ชื่อฉาก, หรือแท็ก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1 bg-[#1A142D] border-2 border-[#7662AC] text-xs text-[#FFF6FA]"
            />
          </div>
        </div>

        {/* Current State Pick Preview (if state provided) */}
        {currentResolution && (
          <div className="px-inset p-2.5 bg-[#1A142D] border-2 border-[#7662AC] text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-[#FFD35C]">ฉากที่ Engine สุ่มให้สถานะปัจจุบัน: </span>
              <span className="font-display font-extrabold text-[#7EF4C2]">
                {currentResolution.scene?.nameTh} ({currentResolution.sceneId})
              </span>
              <span className="text-[#CBBFE3] ml-2">
                (หมวด: {currentResolution.scene?.category})
              </span>
            </div>
            <div className="font-num text-[#DDD2FE]">
              อายุจริง {state?.character.ageYears} ปี · อาชีพ {state?.economy.jobTitle}
            </div>
          </div>
        )}

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs font-display font-bold transition-transform active:translate-y-0.5 ${
                selectedCategory === cat.id
                  ? 'px-slot bg-[#6EE7B7] text-[#165940]'
                  : 'bg-[#1A142D] text-[#CBBFE3] border-2 border-[#4E3B69] hover:border-[#7662AC]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main scenes gallery list */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {filteredScenes.length === 0 ? (
          <div className="text-center py-12 text-[#CBBFE3]">ไม่พบฉากที่ตรงกับเงื่อนไขการค้นหา</div>
        ) : (
          filteredScenes.map((scene) => {
            return (
              <div
                key={scene.id}
                className="game-card bg-[#2A2247] p-3 sm:p-4 space-y-3 border-2 border-[#7662AC]"
              >
                {/* Scene Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-[#4E3B69] pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-extrabold text-base text-[#FFF6FA]">
                        {scene.nameTh}
                      </h3>
                      <span className="text-xs text-[#CBBFE3]">({scene.nameEn})</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#1A142D] border border-[#7662AC] text-[#FFE58F]">
                        {scene.id}
                      </span>
                    </div>
                    <div className="text-xs text-[#DDD2FE] mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                      <span>หมวด: <strong className="text-[#A7F3D0]">{scene.category}</strong></span>
                      <span>
                        เวลาทำการ:{' '}
                        <strong>
                          {scene.availability.alwaysOpen
                            ? 'เปิด 24 ชม.'
                            : `${scene.availability.open ?? '-'} ถึง ${scene.availability.close ?? '-'}`}
                        </strong>
                      </span>
                      {scene.availability.nightMeaning && (
                        <span>
                          (ความหมายกลางคืน: {scene.availability.nightMeaning})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges & Flags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scene.flags.map((flag) => (
                      <span
                        key={flag}
                        className={`px-2 py-0.5 text-[10px] font-bold border-2 ${
                          flag === 'brand'
                            ? 'bg-[#FFE0EE] text-[#B02A60] border-[#FF8DA8]'
                            : flag === 'night_only'
                              ? 'bg-[#4F358D] text-[#E2D9F3] border-[#7662AC]'
                              : 'bg-[#FFF3BF] text-[#785E00] border-[#FFD35C]'
                        }`}
                      >
                        flag: {flag}
                      </span>
                    ))}
                    {scene.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] bg-[#1A142D] border border-[#7662AC] text-[#CBBFE3]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4 Dayparts Matrix Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {ALL_DAYPARTS.map((daypart) => {
                    const isOpen = isSceneOpen(scene.id, daypart, testAge, settings);
                    const imgUrl = sceneImagePath(scene.id, daypart);
                    const mappedImg = scene.daypartImage[daypart];
                    const info = DAYPART_TITLE[daypart];

                    return (
                      <div
                        key={daypart}
                        className={`p-2 border-2 space-y-1.5 ${
                          isOpen
                            ? 'border-[#7662AC] bg-[#1F1735]'
                            : 'border-[#4E3B69]/60 bg-[#161026] opacity-60'
                        }`}
                      >
                        {/* Daypart title & Status badge */}
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-bold flex items-center gap-1 text-[#FFF6FA]">
                            <PixelIcon name={info.icon} size={13} />
                            <span>{info.labelTh}</span>
                            <span className="text-[9px] text-[#CBBFE3] font-num">({info.timeTh})</span>
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold border ${
                              isOpen
                                ? 'bg-[#D6FAEA] text-[#165940] border-[#6EE7B7]'
                                : 'bg-[#FFE0EE] text-[#B02A60] border-[#FF8DA8]'
                            }`}
                          >
                            {isOpen ? 'เปิด' : 'ปิด'}
                          </span>
                        </div>

                        {/* Image Preview */}
                        <div
                          className="relative w-full overflow-hidden bg-black border border-[#4E3B69]"
                          style={{ aspectRatio: '16 / 9' }}
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={`${scene.nameTh} (${daypart})`}
                              className="w-full h-full object-cover"
                              style={{ imageRendering: 'pixelated' }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-red-400">
                              ไม่มีภาพ
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 px-1 text-[9px] font-mono bg-black/80 text-white">
                            {mappedImg}.png
                          </span>
                        </div>

                        <div className="text-[10px] text-[#CBBFE3] truncate font-mono">
                          {imgUrl.replace(/^.*\/scenes\//, 'scenes/')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
