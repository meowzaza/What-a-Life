import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { pickSceneForState } from '../../data/sceneRules';
import {
  type Daypart,
  isSceneOpen,
  resolveDaypart,
  SCENES_BY_ID,
  sceneImagePath,
  type SceneSettings,
  validateSceneManifestInDev,
} from '../../engine/scene';
import type { GameState } from '../../engine/types';
import { STROKE_COLOR } from '../theme';

export const DEFAULT_GROUND_LINE_Y_RATIO = 0.88; // 88% from top of scene (feet level)

interface SceneArtProps {
  state: GameState;
  isPlaying: boolean;
  reduceFx?: boolean;
  className?: string;
  sceneIdOverride?: string;
  daypartOverride?: Daypart;
  settings?: SceneSettings;
  crossfadeMs?: number;
  onSceneResolved?: (sceneId: string, daypart: Daypart) => void;
}

import { deriveWeeklyAllocation } from '../../engine/planner';

export type SceneType = 'nursery' | 'school' | 'hospital' | 'office' | 'shop' | 'condo' | 'parents_home' | 'city';

export function resolveSceneType(state: GameState): SceneType {
  const { character, economy, lifestylePresetId } = state;
  const alloc = state.planner?.grid ? deriveWeeklyAllocation(state.planner.grid, state) : state.timeAllocation;
  if (!character.isAlive || character.indices.physical < 26 || character.resources.energy < 14) {
    return 'hospital';
  }
  if (character.ageYears <= 5 || economy.jobId === 'infant') return 'nursery';
  if (economy.jobId === 'student' || lifestylePresetId === 'study_focus') return 'school';
  if (economy.jobId === 'small_business' || (alloc?.sideGig ?? 0) > 0) return 'shop';
  if (
    economy.jobId === 'office_junior' ||
    economy.jobId === 'sales_exec' ||
    economy.jobId === 'sales_manager' ||
    economy.jobId === 'software_dev' ||
    economy.jobId === 'civil_servant'
  ) {
    return lifestylePresetId === 'rest_recover'
      ? economy.housingId === 'condo'
        ? 'condo'
        : 'parents_home'
      : 'office';
  }
  if (economy.housingId === 'condo') return 'condo';
  if (economy.housingId === 'parents_home') return 'parents_home';
  return 'city';
}

const S = STROKE_COLOR;

/**
 * Original Phase 1.5 SVG scene implementation retained as fallback
 * when pixel image assets cannot be loaded or encountered an error.
 */
export function FallbackSceneSvg({
  state,
  isPlaying,
  reduceFx = false,
  className = '',
}: {
  state: GameState;
  isPlaying: boolean;
  reduceFx?: boolean;
  className?: string;
}) {
  const scene = resolveSceneType(state);
  const timePhase = state.date.totalDays % 3; // 0: เช้า, 1: เย็นพาสเทล, 2: ค่ำมีดาว
  const animate = isPlaying && !reduceFx;
  const isNight = timePhase === 2 && scene !== 'hospital';

  const skyBand1 =
    scene === 'hospital'
      ? '#FFEAF2'
      : timePhase === 0
        ? '#CBEAFF'
        : timePhase === 1
          ? '#FFD7C4'
          : '#332A5C';

  const skyBand2 =
    scene === 'hospital'
      ? '#FFF4F8'
      : timePhase === 0
        ? '#E3F4FF'
        : timePhase === 1
          ? '#FFEBD6'
          : '#483B78';

  const skyBand3 =
    scene === 'hospital'
      ? '#FFFDFB'
      : timePhase === 0
        ? '#F4FAFF'
        : timePhase === 1
          ? '#FFF6E8'
          : '#604D94';

  return (
    <svg
      viewBox="0 0 180 86"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full object-cover ${className}`}
      aria-hidden="true"
    >
      {/* Layered Pixel Sky Bands */}
      <rect x="0" y="0" width="180" height="28" fill={skyBand1} />
      <rect x="0" y="28" width="180" height="24" fill={skyBand2} />
      <rect x="0" y="52" width="180" height="16" fill={skyBand3} />

      {/* Pixel Dither Seam Dots */}
      {[4, 16, 28, 40, 52, 64, 76, 88, 100, 112, 124, 136, 148, 160, 172].map((x) => (
        <g key={x}>
          <rect x={x} y="27" width="4" height="1" fill={skyBand2} />
          <rect x={x + 4} y="51" width="4" height="1" fill={skyBand3} />
        </g>
      ))}

      {/* Sun / Moon + Pixel Stars */}
      {isNight ? (
        <>
          <rect x="150" y="10" width="8" height="10" fill="#FFF3BF" />
          <rect x="148" y="12" width="12" height="6" fill="#FFF3BF" />
          <rect x="154" y="11" width="6" height="6" fill={skyBand1} />
          <g className={animate ? 'animate-pixel-twinkle' : ''}>
            <rect x="24" y="12" width="1" height="3" fill="#FFF3BF" />
            <rect x="23" y="13" width="3" height="1" fill="#FFF3BF" />
            <rect x="64" y="8" width="2" height="2" fill="#FFFFFF" />
            <rect x="108" y="14" width="1" height="3" fill="#FFD8EC" />
            <rect x="107" y="15" width="3" height="1" fill="#FFD8EC" />
            <rect x="132" y="22" width="2" height="2" fill="#FFFFFF" />
          </g>
        </>
      ) : (
        <>
          <rect x="150" y="10" width="10" height="10" fill={timePhase === 1 ? '#FFAE87' : '#FFE58F'} />
          <rect x="148" y="12" width="14" height="6" fill={timePhase === 1 ? '#FFAE87' : '#FFE58F'} />
          <rect x="152" y="12" width="3" height="2" fill="#FFFFFF" opacity="0.8" />
          <g className={animate ? 'animate-cloud-drift' : ''}>
            <rect x="20" y="17" width="22" height="5" fill="#FFFFFF" />
            <rect x="24" y="14" width="12" height="3" fill="#FFFFFF" />
            <rect x="27" y="12" width="6" height="2" fill="#FFFFFF" />
            <rect x="20" y="22" width="22" height="1" fill="#DCEBFF" />

            <rect x="82" y="21" width="18" height="4" fill="#FFFFFF" opacity="0.92" />
            <rect x="86" y="18" width="9" height="3" fill="#FFFFFF" opacity="0.92" />
            <rect x="82" y="25" width="18" height="1" fill="#DCEBFF" opacity="0.8" />
          </g>
        </>
      )}

      {/* Soft Distant Pixel Hills / City Horizon */}
      <rect x="0" y="61" width="34" height="6" fill={isNight ? '#3E336A' : '#D5E9FF'} />
      <rect x="10" y="58" width="18" height="3" fill={isNight ? '#3E336A' : '#D5E9FF'} />
      <rect x="52" y="62" width="44" height="5" fill={isNight ? '#3E336A' : '#D5E9FF'} />

      {/* Pixel Grass & Checkered Pixel Sidewalk */}
      <rect x="0" y="66" width="180" height="8" fill={isNight ? '#447A6A' : '#A7F3D0'} />
      <rect x="0" y="65" width="180" height="1" fill={S} />
      <rect x="0" y="73" width="180" height="1" fill={S} />
      <rect x="0" y="74" width="180" height="12" fill={isNight ? '#3A325C' : '#F3E9F5'} />
      {[0, 18, 36, 54, 72, 90, 108, 126, 144, 162].map((x) => (
        <g key={x}>
          <rect x={x} y="79" width="10" height="2" fill={isNight ? '#574B85' : '#FFFFFF'} opacity="0.7" />
          <rect x={x + 12} y="74" width="1" height="5" fill={S} opacity="0.2" />
        </g>
      ))}

      {scene === 'nursery' && (
        <g>
          <rect x="74" y="45" width="7" height="8" fill="#FFA6C9" />
          <rect x="75" y="46" width="2" height="2" fill="#FFFDFB" />
          <rect x="77" y="53" width="1" height="12" fill={S} />
          <rect x="96" y="34" width="58" height="31" fill="#FFF8E2" />
          <rect x="92" y="28" width="66" height="6" fill="#FFAE87" />
          <rect x="98" y="23" width="54" height="5" fill="#FFBE94" />
          <rect x="106" y="19" width="38" height="4" fill="#FFD3B6" />
          <rect x="95" y="34" width="1" height="31" fill={S} />
          <rect x="154" y="34" width="1" height="31" fill={S} />
          <rect x="92" y="34" width="66" height="1" fill={S} />
          <rect x="105" y="42" width="14" height="12" fill={isNight ? '#FFE58F' : '#BAE6FD'} />
          <rect x="111" y="42" width="2" height="12" fill={S} opacity="0.4" />
          <rect x="105" y="42" width="14" height="1" fill={S} />
          <rect x="128" y="44" width="14" height="21" fill="#FFE58F" />
          <rect x="128" y="44" width="14" height="1" fill={S} />
          <rect x="139" y="54" width="2" height="2" fill={S} />
        </g>
      )}

      {scene === 'school' && (
        <g>
          <rect x="70" y="24" width="2" height="41" fill={S} />
          <rect x="72" y="25" width="12" height="2" fill="#FF759F" />
          <rect x="72" y="27" width="12" height="1" fill="#FFFFFF" />
          <rect x="72" y="28" width="12" height="2" fill="#6D7FE6" />
          <rect x="72" y="30" width="12" height="1" fill="#FFFFFF" />
          <rect x="72" y="31" width="12" height="2" fill="#FF759F" />
          <rect x="88" y="34" width="72" height="31" fill="#FFF5DA" />
          <rect x="84" y="27" width="80" height="7" fill="#FF89A8" />
          <rect x="92" y="22" width="64" height="5" fill="#FFA6C9" />
          <rect x="84" y="34" width="80" height="1" fill={S} />
          <rect x="88" y="34" width="1" height="31" fill={S} />
          <rect x="159" y="34" width="1" height="31" fill={S} />
          {[96, 112, 140].map((x) => (
            <g key={x}>
              <rect x={x} y="41" width="10" height="10" fill={isNight ? '#FFE58F' : '#CBEAFF'} />
              <rect x={x} y="41" width="10" height="1" fill={S} />
            </g>
          ))}
          <rect x="126" y="48" width="10" height="17" fill="#D49A6A" />
          <rect x="126" y="47" width="10" height="1" fill={S} />
        </g>
      )}

      {scene === 'office' && (
        <g>
          <rect x="86" y="21" width="34" height="44" fill="#DCEBFF" />
          <rect x="86" y="20" width="34" height="1" fill={S} />
          <rect x="86" y="21" width="1" height="44" fill={S} />
          <rect x="120" y="21" width="1" height="44" fill={S} />
          <rect x="125" y="30" width="34" height="35" fill="#EAE2FF" />
          <rect x="125" y="29" width="34" height="1" fill={S} />
          <rect x="125" y="30" width="1" height="35" fill={S} />
          <rect x="158" y="30" width="1" height="35" fill={S} />
          {[27, 36, 45, 54].map((y) => (
            <g key={y}>
              <rect x="92" y={y} width="9" height="5" fill={isNight ? '#FFE58F' : '#93C5FD'} />
              <rect x="106" y={y} width="9" height="5" fill={isNight ? '#FFE58F' : '#BFDBFE'} />
            </g>
          ))}
          {[37, 46].map((y) => (
            <g key={y}>
              <rect x="131" y={y} width="22" height="5" fill={isNight ? '#FFE58F' : '#C4B5FD'} />
            </g>
          ))}
          <rect x="136" y="54" width="12" height="11" fill="#8196F8" />
        </g>
      )}

      {scene === 'shop' && (
        <g>
          <rect x="88" y="36" width="66" height="29" fill="#FFF8EC" />
          <rect x="88" y="36" width="1" height="29" fill={S} />
          <rect x="153" y="36" width="1" height="29" fill={S} />
          <rect x="84" y="28" width="74" height="8" fill="#FFA6C9" />
          {[88, 100, 112, 124, 136, 148].map((x) => (
            <rect key={x} x={x} y="28" width="6" height="8" fill="#FFFDFB" />
          ))}
          <rect x="84" y="28" width="74" height="1" fill={S} />
          <rect x="84" y="36" width="74" height="1" fill={S} />
          <rect x="96" y="45" width="30" height="12" fill="#FFE58F" />
          <rect x="96" y="44" width="30" height="1" fill={S} />
          <rect x="132" y="44" width="14" height="21" fill="#BAE6FD" />
          <rect x="132" y="44" width="14" height="1" fill={S} />
        </g>
      )}

      {scene === 'hospital' && (
        <g>
          <rect x="86" y="27" width="70" height="38" fill="#FFFFFF" />
          <rect x="86" y="26" width="70" height="1" fill={S} />
          <rect x="86" y="27" width="1" height="38" fill={S} />
          <rect x="155" y="27" width="1" height="38" fill={S} />
          <rect x="114" y="31" width="14" height="14" fill="#FFE0EE" />
          <rect x="114" y="31" width="14" height="1" fill={S} />
          <rect x="114" y="44" width="14" height="1" fill={S} />
          <rect x="120" y="34" width="2" height="8" fill="#FF5D8F" />
          <rect x="117" y="37" width="8" height="2" fill="#FF5D8F" />
          <rect x="94" y="49" width="14" height="9" fill="#CBEAFF" />
          <rect x="134" y="49" width="14" height="9" fill="#CBEAFF" />
          <rect x="115" y="50" width="12" height="15" fill="#B4C3FF" />
        </g>
      )}

      {(scene === 'parents_home' || scene === 'condo' || scene === 'city') && (
        <g>
          {scene === 'condo' ? (
            <>
              <rect x="94" y="18" width="56" height="47" fill="#F3ECFF" />
              <rect x="94" y="17" width="56" height="1" fill={S} />
              <rect x="94" y="18" width="1" height="47" fill={S} />
              <rect x="149" y="18" width="1" height="47" fill={S} />
              {[24, 34, 44].map((y) => (
                <g key={y}>
                  <rect x="102" y={y} width="16" height="6" fill={isNight ? '#FFE58F' : '#C4B5FD'} />
                  <rect x="126" y={y} width="16" height="6" fill={isNight ? '#FFE58F' : '#DDD2FE'} />
                </g>
              ))}
              <rect x="115" y="53" width="14" height="12" fill="#93C5FD" />
            </>
          ) : (
            <>
              <rect x="92" y="36" width="62" height="29" fill="#FFF8E2" />
              <rect x="86" y="30" width="74" height="6" fill="#6EE7B7" />
              <rect x="96" y="24" width="54" height="6" fill="#A7F3D0" />
              <rect x="86" y="36" width="74" height="1" fill={S} />
              <rect x="92" y="36" width="1" height="29" fill={S} />
              <rect x="153" y="36" width="1" height="29" fill={S} />
              <rect x="100" y="44" width="13" height="10" fill={isNight ? '#FFE58F' : '#CBEAFF'} />
              <rect x="133" y="44" width="13" height="10" fill={isNight ? '#FFE58F' : '#CBEAFF'} />
              <rect x="118" y="48" width="10" height="17" fill="#FFAE87" />
            </>
          )}
        </g>
      )}

      <rect x="165" y="53" width="4" height="12" fill="#B57B5C" />
      <rect x="160" y="43" width="14" height="10" fill={isNight ? '#3B7A69' : '#6EE7B7'} />
      <rect x="162" y="40" width="10" height="3" fill={isNight ? '#4B9681' : '#A7F3D0'} />
      <rect x="158" y="46" width="18" height="5" fill={isNight ? '#3B7A69' : '#6EE7B7'} />
    </svg>
  );
}

/**
 * Phase 1.8: Production pixel-art scene component.
 * Displays 688x384 pixel scenes (16:9) with day/night resolution,
 * ~400ms crossfade between time transitions, counterpart preloading,
 * dev flag warnings, and graceful SVG fallback upon image loading error.
 */
export function SceneArt({
  state,
  isPlaying,
  reduceFx = false,
  className = '',
  sceneIdOverride,
  daypartOverride,
  settings,
  crossfadeMs = 400,
  onSceneResolved,
}: SceneArtProps) {
  // Validate manifest in dev mode once
  useEffect(() => {
    validateSceneManifestInDev();
  }, []);

  const daypart = daypartOverride ?? resolveDaypart(state);
  const sceneId = sceneIdOverride ?? pickSceneForState(state, settings);
  const scene = SCENES_BY_ID.get(sceneId);

  // Notify parent of resolved scene and daypart
  useEffect(() => {
    onSceneResolved?.(sceneId, daypart);
  }, [sceneId, daypart, onSceneResolved]);

  // Dev warning for brand flag
  useEffect(() => {
    if (scene?.flags.includes('brand') && import.meta.env?.DEV) {
      console.warn(
        `[SceneArt] Scene "${sceneId}" (${scene.nameTh}) has flag "brand" (contains signage resembling real brand).`
      );
    }
  }, [sceneId, scene]);

  const currentSrc = sceneImagePath(sceneId, daypart);

  // Preload counterpart image for instant smooth day/night transition
  useEffect(() => {
    if (!scene) return;
    const counterpartDaypart: Daypart =
      daypart === 'morning' || daypart === 'afternoon' ? 'night' : 'afternoon';
    const preloadUrl = sceneImagePath(sceneId, counterpartDaypart);
    if (preloadUrl && preloadUrl !== currentSrc) {
      const img = new Image();
      img.src = preloadUrl;
    }
  }, [sceneId, daypart, currentSrc, scene]);

  // Error tracking per scene
  const [failedScenes, setFailedScenes] = useState<Record<string, boolean>>({});
  const hasError = failedScenes[sceneId] || !currentSrc;

  if (hasError) {
    return <FallbackSceneSvg state={state} isPlaying={isPlaying} reduceFx={reduceFx} className={className} />;
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#1E1833] ${className}`}
      style={{ aspectRatio: '16 / 9' }}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={currentSrc}
          src={currentSrc}
          alt={scene?.nameTh ?? 'ฉาก'}
          initial={reduceFx ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceFx ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reduceFx ? 0 : Math.max(0.1, crossfadeMs / 1000), ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          onError={(err) => {
            console.warn(
              `[SceneArt] Failed to load image for scene "${sceneId}" (${currentSrc}), falling back to SVG:`,
              err
            );
            setFailedScenes((prev) => ({ ...prev, [sceneId]: true }));
          }}
        />
      </AnimatePresence>
    </div>
  );
}
