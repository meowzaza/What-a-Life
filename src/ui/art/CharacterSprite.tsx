import { useEffect, useState } from 'react';
import { getManifestEntry } from '../../engine/appearance';
import type { Gender } from '../../engine/types';
import { Avatar } from './Avatar';

export interface CharacterSpriteProps {
  charId?: string;
  mode: 'full' | 'bust';
  size: number;
  animate?: boolean;
  className?: string;
  seed?: number;
  gender?: Gender;
  ageYears?: number;
  mentalIndex?: number;
  jobId?: string;
}

export function resolveCharacterSpriteUrl(file: string): string {
  const rawBase = import.meta.env?.BASE_URL ?? '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const cleanFile = file.replace(/^\/+/, '');
  return `${base}assets/${cleanFile}`;
}

export function CharacterSprite({
  charId,
  mode,
  size,
  animate = false,
  className = '',
  seed = 1,
  gender = 'male',
  ageYears = 20,
  mentalIndex = 65,
  jobId,
}: CharacterSpriteProps) {
  const [imgError, setImgError] = useState(false);
  const entry = getManifestEntry(charId);

  useEffect(() => {
    setImgError(false);
  }, [charId]);

  if (!charId || !entry || imgError) {
    return (
      <Avatar
        seed={seed}
        gender={gender}
        ageYears={ageYears}
        mentalIndex={mentalIndex}
        jobId={jobId}
        size={mode === 'full' ? Math.round(size * 0.72) : size}
        animate={animate}
        className={className}
      />
    );
  }

  const src = resolveCharacterSpriteUrl(entry.file);

  if (mode === 'full') {
    const scale = size / 340;
    const displayHeight = Math.max(1, Math.round(entry.h * scale));
    const displayWidth = Math.max(1, Math.round(entry.w * scale));

    return (
      <div
        className={`inline-flex items-end justify-center select-none shrink-0 ${
          animate ? 'animate-gentle-bob' : ''
        } ${className}`}
        style={{
          width: displayWidth,
          height: displayHeight,
          transformOrigin: 'bottom center',
        }}
        role="img"
        aria-label={`ภาพตัวละครอายุ ${ageYears} ปี`}
      >
        <img
          src={src}
          alt={`ตัวละครอายุ ${ageYears} ปี`}
          width={displayWidth}
          height={displayHeight}
          draggable={false}
          onError={() => setImgError(true)}
          className="pixelated block w-full h-full object-contain object-bottom pointer-events-none select-none"
        />
      </div>
    );
  }

  // mode === 'bust': กรอบพาสเทลพิกเซล 1:1 จัดสัดส่วนใบหน้าให้เท่ากันทุกตัวละคร
  // คำนวณจากความสูงศีรษะและลำตัวอ้างอิง เพื่อให้หมวกปีกกว้าง ทรงผมฟู หรือหมวกแก๊ปไม่ทำให้หน้าตัวละครหดเล็กลง
  const isBaby = entry.group === 'baby';
  const refHeight = isBaby ? 175 : 344;
  const targetHeadRatio = isBaby ? 2.15 : 2.05;
  const zoomFactor = entry.bustFocus?.zoom ? entry.bustFocus.zoom / 1.12 : 1.0;
  const clampedZoom = Math.min(1.12, Math.max(0.9, zoomFactor));
  const scale = (size / refHeight) * targetHeadRatio * clampedZoom;
  const renderedH = Math.round(entry.h * scale);
  const renderedW = Math.round(entry.w * scale);
  const focusX = entry.bustFocus?.x ?? 0.5;
  const focusY = entry.bustFocus?.y ?? (isBaby ? 0.26 : 0.26);
  const left = Math.round(size * 0.5 - focusX * renderedW);
  const rawTop = size * 0.44 - focusY * renderedH;
  const top = Math.round(Math.min(size * 0.04, Math.max(size - renderedH, rawTop)));

  return (
    <div
      className={`px-slot relative overflow-hidden bg-[#FFF0F6] dark:bg-[#352B59] shrink-0 select-none ${
        animate ? 'animate-gentle-bob' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`ภาพตัวละครอายุ ${ageYears} ปี`}
    >
      <img
        src={src}
        alt={`ตัวละครอายุ ${ageYears} ปี`}
        draggable={false}
        onError={() => setImgError(true)}
        className="pixelated absolute pointer-events-none select-none"
        style={{
          width: renderedW,
          height: renderedH,
          maxWidth: 'none',
          maxHeight: 'none',
          left,
          top,
        }}
      />
    </div>
  );
}
