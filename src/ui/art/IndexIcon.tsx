import type { LifeIndexKey } from '../../engine/types';
import { INDEX_THEMES, STROKE_COLOR } from '../theme';

interface IndexIconProps {
  indexKey: LifeIndexKey;
  size?: number;
  withBadge?: boolean;
  className?: string;
}

const S = STROKE_COLOR;

export function IndexIcon({
  indexKey,
  size = 24,
  withBadge = true,
  className = '',
}: IndexIconProps) {
  const theme = INDEX_THEMES[indexKey];

  const renderPixelGlyph = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* กาย: หัวใจสีมินต์ + เครื่องหมายบวกพยาบาลสีขาว */}
      {indexKey === 'physical' && (
        <>
          {/* Outline */}
          <rect x="5" y="3" width="5" height="1" fill={S} />
          <rect x="14" y="3" width="5" height="1" fill={S} />
          <rect x="3" y="4" width="2" height="1" fill={S} />
          <rect x="10" y="4" width="1" height="1" fill={S} />
          <rect x="13" y="4" width="1" height="1" fill={S} />
          <rect x="19" y="4" width="2" height="1" fill={S} />
          <rect x="2" y="5" width="1" height="6" fill={S} />
          <rect x="11" y="5" width="2" height="1" fill={S} />
          <rect x="21" y="5" width="1" height="6" fill={S} />
          <rect x="3" y="11" width="1" height="2" fill={S} />
          <rect x="20" y="11" width="1" height="2" fill={S} />
          <rect x="4" y="13" width="1" height="2" fill={S} />
          <rect x="19" y="13" width="1" height="2" fill={S} />
          <rect x="5" y="15" width="2" height="1" fill={S} />
          <rect x="17" y="15" width="2" height="1" fill={S} />
          <rect x="7" y="16" width="2" height="1" fill={S} />
          <rect x="15" y="16" width="2" height="1" fill={S} />
          <rect x="9" y="17" width="2" height="1" fill={S} />
          <rect x="13" y="17" width="2" height="1" fill={S} />
          <rect x="11" y="18" width="2" height="1" fill={S} />

          {/* Mint Heart Body */}
          <rect x="5" y="4" width="5" height="2" fill="#6EE7B7" />
          <rect x="14" y="4" width="5" height="2" fill="#6EE7B7" />
          <rect x="3" y="5" width="8" height="6" fill="#34D399" />
          <rect x="13" y="5" width="8" height="6" fill="#34D399" />
          <rect x="11" y="6" width="2" height="12" fill="#34D399" />
          <rect x="4" y="11" width="16" height="2" fill="#34D399" />
          <rect x="5" y="13" width="14" height="2" fill="#10B981" />
          <rect x="7" y="15" width="10" height="1" fill="#10B981" />
          <rect x="9" y="16" width="6" height="1" fill="#10B981" />
          <rect x="11" y="17" width="2" height="1" fill="#10B981" />

          {/* Highlight */}
          <rect x="5" y="5" width="3" height="2" fill="#D1FAE5" />
          <rect x="4" y="6" width="2" height="2" fill="#FFFFFF" />

          {/* Medical White Cross */}
          <rect x="11" y="8" width="2" height="7" fill="#FFFFFF" />
          <rect x="8" y="10" width="8" height="3" fill="#FFFFFF" />
          <rect x="10" y="8" width="4" height="7" fill="#FFFFFF" />
        </>
      )}

      {/* ใจ: หัวใจชมพูมีปีกนางฟ้าสีขาว + ประกาย */}
      {indexKey === 'mental' && (
        <>
          {/* Left & Right Tiny Wings Outline & Fill */}
          <rect x="1" y="6" width="4" height="1" fill={S} />
          <rect x="0" y="7" width="1" height="4" fill={S} />
          <rect x="1" y="11" width="2" height="1" fill={S} />
          <rect x="2" y="12" width="3" height="1" fill={S} />
          <rect x="1" y="7" width="4" height="4" fill="#FFFFFF" />
          <rect x="2" y="10" width="3" height="2" fill="#FCE7F3" />

          <rect x="19" y="6" width="4" height="1" fill={S} />
          <rect x="23" y="7" width="1" height="4" fill={S} />
          <rect x="21" y="11" width="2" height="1" fill={S} />
          <rect x="19" y="12" width="3" height="1" fill={S} />
          <rect x="19" y="7" width="4" height="4" fill="#FFFFFF" />
          <rect x="19" y="10" width="3" height="2" fill="#FCE7F3" />

          {/* Center Pink Heart Outline */}
          <rect x="6" y="4" width="4" height="1" fill={S} />
          <rect x="14" y="4" width="4" height="1" fill={S} />
          <rect x="5" y="5" width="1" height="1" fill={S} />
          <rect x="10" y="5" width="1" height="1" fill={S} />
          <rect x="13" y="5" width="1" height="1" fill={S} />
          <rect x="18" y="5" width="1" height="1" fill={S} />
          <rect x="4" y="6" width="1" height="6" fill={S} />
          <rect x="11" y="6" width="2" height="1" fill={S} />
          <rect x="19" y="6" width="1" height="6" fill={S} />
          <rect x="5" y="12" width="1" height="2" fill={S} />
          <rect x="18" y="12" width="1" height="2" fill={S} />
          <rect x="6" y="14" width="2" height="1" fill={S} />
          <rect x="16" y="14" width="2" height="1" fill={S} />
          <rect x="8" y="15" width="2" height="1" fill={S} />
          <rect x="14" y="15" width="2" height="1" fill={S} />
          <rect x="10" y="16" width="4" height="1" fill={S} />
          <rect x="11" y="17" width="2" height="1" fill={S} />

          {/* Heart Fill */}
          <rect x="6" y="5" width="4" height="2" fill="#FFB8D4" />
          <rect x="14" y="5" width="4" height="2" fill="#FFB8D4" />
          <rect x="5" y="6" width="6" height="6" fill="#FF8DA8" />
          <rect x="13" y="6" width="6" height="6" fill="#FF8DA8" />
          <rect x="11" y="7" width="2" height="10" fill="#FF8DA8" />
          <rect x="6" y="12" width="12" height="2" fill="#FF6B93" />
          <rect x="8" y="14" width="8" height="1" fill="#FF6B93" />
          <rect x="10" y="15" width="4" height="1" fill="#FF6B93" />

          {/* Shine & Happy Sparkle */}
          <rect x="6" y="7" width="2" height="2" fill="#FFFFFF" />
          <rect x="15" y="9" width="1" height="3" fill="#FFFDFB" />
          <rect x="14" y="10" width="3" height="1" fill="#FFFDFB" />
        </>
      )}

      {/* เงิน: เหรียญทองกลมพิกเซลพร้อมสัญลักษณ์บาทชัดเจน */}
      {indexKey === 'financial' && (
        <>
          {/* Outer Circle Outline */}
          <rect x="8" y="2" width="8" height="1" fill={S} />
          <rect x="6" y="3" width="2" height="1" fill={S} />
          <rect x="16" y="3" width="2" height="1" fill={S} />
          <rect x="4" y="4" width="2" height="2" fill={S} />
          <rect x="18" y="4" width="2" height="2" fill={S} />
          <rect x="3" y="6" width="1" height="2" fill={S} />
          <rect x="20" y="6" width="1" height="2" fill={S} />
          <rect x="2" y="8" width="1" height="8" fill={S} />
          <rect x="21" y="8" width="1" height="8" fill={S} />
          <rect x="3" y="16" width="1" height="2" fill={S} />
          <rect x="20" y="16" width="1" height="2" fill={S} />
          <rect x="4" y="18" width="2" height="2" fill={S} />
          <rect x="18" y="18" width="2" height="2" fill={S} />
          <rect x="6" y="20" width="2" height="1" fill={S} />
          <rect x="16" y="20" width="2" height="1" fill={S} />
          <rect x="8" y="21" width="8" height="1" fill={S} />

          {/* Outer Gold Rim */}
          <rect x="8" y="3" width="8" height="18" fill="#F59E0B" />
          <rect x="6" y="4" width="12" height="16" fill="#F59E0B" />
          <rect x="4" y="6" width="16" height="12" fill="#F59E0B" />
          <rect x="3" y="8" width="18" height="8" fill="#F59E0B" />

          {/* Bright Inner Coin Face */}
          <rect x="8" y="5" width="8" height="14" fill="#FFE58F" />
          <rect x="6" y="6" width="12" height="12" fill="#FFD35C" />
          <rect x="5" y="8" width="14" height="8" fill="#FFD35C" />
          <rect x="8" y="5" width="8" height="2" fill="#FFF7D6" />
          <rect x="6" y="6" width="3" height="2" fill="#FFFFFF" />

          {/* Clear Thai Baht Symbol (฿) */}
          <rect x="11" y="6" width="2" height="12" fill="#9A5804" />
          <rect x="9" y="7" width="2" height="10" fill="#9A5804" />
          <rect x="9" y="7" width="5" height="2" fill="#9A5804" />
          <rect x="14" y="8" width="1" height="3" fill="#9A5804" />
          <rect x="9" y="11" width="6" height="2" fill="#9A5804" />
          <rect x="14" y="13" width="2" height="3" fill="#9A5804" />
          <rect x="9" y="15" width="6" height="2" fill="#9A5804" />
          <rect x="10" y="9" width="3" height="2" fill="#FFE58F" />
          <rect x="10" y="13" width="4" height="2" fill="#FFE58F" />
        </>
      )}

      {/* สัมพันธ์: กล่องข้อความ 2 ใบซ้อน + หัวใจเล็กๆ */}
      {indexKey === 'social' && (
        <>
          {/* Back Mint Chat Bubble (top-right) */}
          <rect x="10" y="2" width="11" height="1" fill={S} />
          <rect x="9" y="3" width="1" height="5" fill={S} />
          <rect x="21" y="3" width="1" height="7" fill={S} />
          <rect x="16" y="10" width="5" height="1" fill={S} />
          <rect x="10" y="3" width="11" height="7" fill="#A7F3D0" />
          <rect x="11" y="4" width="9" height="1" fill="#FFFFFF" opacity="0.7" />
          <rect x="17" y="10" width="2" height="2" fill="#6EE7B7" />
          <rect x="17" y="12" width="2" height="1" fill={S} />

          {/* Front Peach Chat Bubble (bottom-left) */}
          <rect x="3" y="7" width="13" height="1" fill={S} />
          <rect x="2" y="8" width="1" height="8" fill={S} />
          <rect x="16" y="8" width="1" height="8" fill={S} />
          <rect x="3" y="16" width="2" height="1" fill={S} />
          <rect x="8" y="16" width="8" height="1" fill={S} />
          <rect x="5" y="17" width="1" height="3" fill={S} />
          <rect x="6" y="19" width="1" height="1" fill={S} />
          <rect x="7" y="17" width="1" height="2" fill={S} />

          <rect x="3" y="8" width="13" height="8" fill="#FFD3B6" />
          <rect x="4" y="9" width="11" height="2" fill="#FFF0E5" />
          <rect x="6" y="16" width="2" height="2" fill="#FFD3B6" />

          {/* Little Heart Inside Chat */}
          <rect x="7" y="10" width="2" height="2" fill="#FF5C8D" />
          <rect x="10" y="10" width="2" height="2" fill="#FF5C8D" />
          <rect x="7" y="11" width="5" height="2" fill="#FF5C8D" />
          <rect x="8" y="13" width="3" height="1" fill="#FF5C8D" />
          <rect x="9" y="14" width="1" height="1" fill="#FF5C8D" />
        </>
      )}

      {/* สถานะ: มงกุฎทอง 3 ยอดประดับอัญมณี */}
      {indexKey === 'status' && (
        <>
          {/* Crown Peak Pearls */}
          <rect x="11" y="2" width="2" height="2" fill="#FFFDFB" />
          <rect x="10" y="2" width="1" height="2" fill={S} />
          <rect x="13" y="2" width="1" height="2" fill={S} />
          <rect x="11" y="1" width="2" height="1" fill={S} />

          <rect x="3" y="4" width="2" height="2" fill="#FFFDFB" />
          <rect x="2" y="4" width="1" height="2" fill={S} />
          <rect x="5" y="4" width="1" height="2" fill={S} />
          <rect x="3" y="3" width="2" height="1" fill={S} />

          <rect x="19" y="4" width="2" height="2" fill="#FFFDFB" />
          <rect x="18" y="4" width="1" height="2" fill={S} />
          <rect x="21" y="4" width="1" height="2" fill={S} />
          <rect x="19" y="3" width="2" height="1" fill={S} />

          {/* Crown Gold Body */}
          <rect x="3" y="6" width="3" height="11" fill="#FFD86B" />
          <rect x="10" y="4" width="4" height="13" fill="#FFE58F" />
          <rect x="18" y="6" width="3" height="11" fill="#FFD86B" />
          <rect x="6" y="9" width="2" height="8" fill="#FBBF24" />
          <rect x="16" y="9" width="2" height="8" fill="#FBBF24" />
          <rect x="8" y="11" width="2" height="6" fill="#F59E0B" />
          <rect x="14" y="11" width="2" height="6" fill="#F59E0B" />
          <rect x="3" y="16" width="18" height="3" fill="#F59E0B" />

          {/* Outlines */}
          <rect x="2" y="6" width="1" height="13" fill={S} />
          <rect x="21" y="6" width="1" height="13" fill={S} />
          <rect x="3" y="19" width="18" height="1" fill={S} />
          <rect x="3" y="15" width="18" height="1" fill={S} opacity="0.45" />
          <rect x="6" y="7" width="1" height="3" fill={S} />
          <rect x="17" y="7" width="1" height="3" fill={S} />
          <rect x="7" y="10" width="1" height="2" fill={S} />
          <rect x="16" y="10" width="1" height="2" fill={S} />
          <rect x="8" y="11" width="2" height="1" fill={S} />
          <rect x="14" y="11" width="2" height="1" fill={S} />
          <rect x="9" y="7" width="1" height="4" fill={S} />
          <rect x="14" y="7" width="1" height="4" fill={S} />

          {/* Center Ruby & Side Sapphire Gems */}
          <rect x="11" y="11" width="2" height="3" fill="#FF5C8D" />
          <rect x="6" y="12" width="2" height="2" fill="#60A5FA" />
          <rect x="16" y="12" width="2" height="2" fill="#60A5FA" />
          <rect x="11" y="11" width="1" height="1" fill="#FFFFFF" />
        </>
      )}

      {/* ความสามารถ: หลอดไฟไอเดียสว่างไสว + รัศมี */}
      {indexKey === 'competence' && (
        <>
          {/* Sparkle Rays */}
          <rect x="11" y="1" width="2" height="2" fill="#F59E0B" />
          <rect x="3" y="5" width="2" height="2" fill="#60A5FA" />
          <rect x="19" y="5" width="2" height="2" fill="#60A5FA" />
          <rect x="2" y="10" width="2" height="2" fill="#F59E0B" />
          <rect x="20" y="10" width="2" height="2" fill="#F59E0B" />

          {/* Glass Bulb Outline */}
          <rect x="9" y="4" width="6" height="1" fill={S} />
          <rect x="7" y="5" width="2" height="1" fill={S} />
          <rect x="15" y="5" width="2" height="1" fill={S} />
          <rect x="6" y="6" width="1" height="6" fill={S} />
          <rect x="17" y="6" width="1" height="6" fill={S} />
          <rect x="7" y="12" width="1" height="2" fill={S} />
          <rect x="16" y="12" width="1" height="2" fill={S} />
          <rect x="8" y="14" width="1" height="2" fill={S} />
          <rect x="15" y="14" width="1" height="2" fill={S} />

          {/* Glowing Bulb Glass Fill */}
          <rect x="9" y="5" width="6" height="10" fill="#FFE58F" />
          <rect x="7" y="6" width="10" height="6" fill="#FFD35C" />
          <rect x="8" y="12" width="8" height="2" fill="#FBBF24" />
          <rect x="9" y="14" width="6" height="2" fill="#FBBF24" />

          {/* White Shine & Inner Filament */}
          <rect x="8" y="7" width="2" height="3" fill="#FFFFFF" />
          <rect x="9" y="6" width="2" height="1" fill="#FFFFFF" />
          <rect x="11" y="10" width="2" height="5" fill="#FFFFFF" />
          <rect x="10" y="10" width="4" height="1" fill="#F59E0B" />

          {/* Metal Screw Base */}
          <rect x="8" y="16" width="8" height="1" fill={S} />
          <rect x="9" y="17" width="6" height="2" fill="#CBD5E1" />
          <rect x="9" y="19" width="6" height="1" fill="#94A3B8" />
          <rect x="8" y="17" width="1" height="3" fill={S} />
          <rect x="15" y="17" width="1" height="3" fill={S} />
          <rect x="9" y="20" width="6" height="1" fill={S} />
          <rect x="10" y="21" width="4" height="1" fill={S} />
        </>
      )}
    </svg>
  );

  if (!withBadge) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        {renderPixelGlyph()}
      </span>
    );
  }

  return (
    <span
      className={`px-slot inline-flex items-center justify-center w-10 h-10 ${theme.badgeBg} shrink-0 ${className}`}
    >
      {renderPixelGlyph()}
    </span>
  );
}
