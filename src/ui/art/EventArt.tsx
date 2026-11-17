import type { PendingEventPrompt } from '../../engine/types';
import { STROKE_COLOR } from '../theme';

interface EventArtProps {
  category: PendingEventPrompt['category'] | 'love' | 'family' | 'work';
  className?: string;
}

const S = STROKE_COLOR;

export function EventArt({ category, className = '' }: EventArtProps) {
  const bg =
    category === 'health'
      ? { a: '#FFE6F0', b: '#FFD4E5' }
      : category === 'dilemma' || category === 'economy'
        ? { a: '#FFF9DF', b: '#FFEFB8' }
        : category === 'twist'
          ? { a: '#EFEAFF', b: '#DFD5FF' }
          : { a: '#E8F2FF', b: '#D4E6FF' };

  return (
    <svg
      viewBox="0 0 112 36"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-24 border-2 border-[#4E3B69] dark:border-[#7662AC] ${className}`}
      aria-hidden="true"
    >
      {/* Pastel vertical pixel stripes background (Image 2 style) */}
      <rect x="0" y="0" width="112" height="36" fill={bg.a} />
      {[0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104].map((x) => (
        <rect key={x} x={x} y="0" width="4" height="36" fill={bg.b} opacity="0.6" />
      ))}

      {/* Corner pixel stars */}
      <rect x="7" y="6" width="1" height="3" fill="#FFFFFF" />
      <rect x="6" y="7" width="3" height="1" fill="#FFFFFF" />
      <rect x="103" y="25" width="1" height="3" fill="#FFFFFF" />
      <rect x="102" y="26" width="3" height="1" fill="#FFFFFF" />

      {category === 'health' && (
        <g>
          {/* Heartbeat ECG pixel line */}
          <rect x="14" y="18" width="16" height="2" fill="#FF8DA8" />
          <rect x="30" y="14" width="2" height="6" fill="#FF8DA8" />
          <rect x="32" y="12" width="2" height="12" fill="#FF8DA8" />
          <rect x="34" y="18" width="10" height="2" fill="#FF8DA8" />

          <rect x="68" y="18" width="10" height="2" fill="#FF8DA8" />
          <rect x="78" y="14" width="2" height="10" fill="#FF8DA8" />
          <rect x="80" y="18" width="18" height="2" fill="#FF8DA8" />

          {/* Pixel white badge + Pink Heart */}
          <rect x="44" y="6" width="24" height="24" fill="#FFFFFF" />
          <rect x="44" y="6" width="24" height="2" fill={S} />
          <rect x="44" y="28" width="24" height="2" fill={S} />
          <rect x="44" y="6" width="2" height="24" fill={S} />
          <rect x="66" y="6" width="2" height="24" fill={S} />

          <rect x="49" y="11" width="5" height="5" fill="#FF759F" />
          <rect x="58" y="11" width="5" height="5" fill="#FF759F" />
          <rect x="51" y="13" width="10" height="5" fill="#FF759F" />
          <rect x="53" y="18" width="6" height="3" fill="#FF759F" />
          <rect x="55" y="21" width="2" height="2" fill="#FF759F" />
          <rect x="50" y="12" width="2" height="2" fill="#FFFFFF" />
        </g>
      )}

      {(category === 'dilemma' || category === 'economy') && (
        <g>
          {/* Floating pixel coins */}
          <rect x="24" y="11" width="8" height="10" fill="#FFD35C" />
          <rect x="23" y="13" width="10" height="6" fill="#FFE58F" />
          <rect x="27" y="13" width="2" height="6" fill="#D9820B" />
          <rect x="24" y="10" width="8" height="1" fill={S} />
          <rect x="24" y="21" width="8" height="1" fill={S} />

          <rect x="80" y="15" width="8" height="10" fill="#FFD35C" />
          <rect x="79" y="17" width="10" height="6" fill="#FFE58F" />
          <rect x="83" y="17" width="2" height="6" fill="#D9820B" />
          <rect x="80" y="14" width="8" height="1" fill={S} />
          <rect x="80" y="25" width="8" height="1" fill={S} />

          {/* Pixel Wallet + Banknote */}
          <rect x="47" y="6" width="14" height="7" fill="#6EE7B7" />
          <rect x="47" y="6" width="14" height="1" fill={S} />
          <rect x="44" y="12" width="24" height="16" fill="#FFAE87" />
          <rect x="44" y="11" width="24" height="2" fill={S} />
          <rect x="44" y="27" width="24" height="2" fill={S} />
          <rect x="43" y="12" width="2" height="16" fill={S} />
          <rect x="67" y="12" width="2" height="16" fill={S} />
          <rect x="58" y="17" width="10" height="6" fill="#FFE58F" />
          <rect x="57" y="16" width="11" height="1" fill={S} />
          <rect x="57" y="23" width="11" height="1" fill={S} />
          <rect x="60" y="19" width="2" height="2" fill={S} />
        </g>
      )}

      {category === 'twist' && (
        <g>
          {/* Left & Right pastel drama stars */}
          <rect x="28" y="12" width="10" height="10" fill="#C4B5FD" />
          <rect x="27" y="11" width="12" height="1" fill={S} />
          <rect x="27" y="22" width="12" height="1" fill={S} />
          <rect x="31" y="15" width="4" height="4" fill="#FFFFFF" />

          <rect x="74" y="12" width="10" height="10" fill="#FFA6C9" />
          <rect x="73" y="11" width="12" height="1" fill={S} />
          <rect x="73" y="22" width="12" height="1" fill={S} />
          <rect x="77" y="15" width="4" height="4" fill="#FFFFFF" />

          {/* Center Lightning Bolt */}
          <rect x="54" y="5" width="6" height="6" fill="#FFE58F" />
          <rect x="50" y="11" width="10" height="5" fill="#FFD35C" />
          <rect x="48" y="16" width="16" height="4" fill="#FFD35C" />
          <rect x="54" y="20" width="8" height="5" fill="#FFAE52" />
          <rect x="52" y="25" width="6" height="5" fill="#FFAE52" />
          <rect x="54" y="4" width="6" height="1" fill={S} />
          <rect x="47" y="16" width="1" height="4" fill={S} />
          <rect x="64" y="16" width="1" height="4" fill={S} />
        </g>
      )}

      {(category === 'milestone' || category === 'work' || category === 'love' || category === 'family') && (
        <g>
          {/* Wooden pixel signpost at crossroads */}
          <rect x="54" y="7" width="4" height="24" fill="#D49A6A" />
          <rect x="53" y="7" width="1" height="24" fill={S} />
          <rect x="58" y="7" width="1" height="24" fill={S} />

          {/* Left-pointing top board */}
          <rect x="35" y="10" width="26" height="6" fill="#B8F0D2" />
          <rect x="33" y="11" width="2" height="4" fill="#B8F0D2" />
          <rect x="31" y="12" width="2" height="2" fill="#B8F0D2" />
          <rect x="35" y="9" width="26" height="1" fill={S} />
          <rect x="35" y="16" width="26" height="1" fill={S} />

          {/* Right-pointing bottom board */}
          <rect x="51" y="19" width="26" height="6" fill="#FFBE94" />
          <rect x="77" y="20" width="2" height="4" fill="#FFBE94" />
          <rect x="79" y="21" width="2" height="2" fill="#FFBE94" />
          <rect x="51" y="18" width="26" height="1" fill={S} />
          <rect x="51" y="25" width="26" height="1" fill={S} />

          {/* Grass tufts */}
          <rect x="48" y="30" width="16" height="2" fill="#6EE7B7" />
        </g>
      )}
    </svg>
  );
}
