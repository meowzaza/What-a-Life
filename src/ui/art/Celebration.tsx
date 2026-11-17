import { STROKE_COLOR } from '../theme';

interface CelebrationProps {
  ageYears: number;
  size?: number;
  className?: string;
}

const S = STROKE_COLOR;

export function Celebration({ ageYears, size = 68, className = '' }: CelebrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`ฉลองอายุครบ ${ageYears} ปี`}
    >
      {/* Pastel pixel frame */}
      <rect x="3" y="1" width="18" height="22" fill="#FFF8E2" />
      <rect x="1" y="3" width="22" height="18" fill="#FFF8E2" />
      <rect x="3" y="1" width="18" height="1" fill={S} />
      <rect x="3" y="22" width="18" height="1" fill={S} />
      <rect x="1" y="3" width="1" height="18" fill={S} />
      <rect x="22" y="3" width="1" height="18" fill={S} />
      <rect x="2" y="2" width="1" height="1" fill={S} />
      <rect x="21" y="2" width="1" height="1" fill={S} />
      <rect x="2" y="21" width="1" height="1" fill={S} />
      <rect x="21" y="21" width="1" height="1" fill={S} />

      {/* Pixel sparkles & balloons */}
      <rect x="4" y="4" width="3" height="4" fill="#FFA6C9" />
      <rect x="5" y="5" width="1" height="1" fill="#FFFFFF" />
      <rect x="5" y="8" width="1" height="4" fill={S} opacity="0.5" />

      <rect x="17" y="4" width="3" height="4" fill="#93C5FD" />
      <rect x="18" y="5" width="1" height="1" fill="#FFFFFF" />
      <rect x="18" y="8" width="1" height="4" fill={S} opacity="0.5" />

      <rect x="8" y="5" width="1" height="1" fill="#FFD35C" />
      <rect x="15" y="6" width="1" height="1" fill="#6EE7B7" />

      {/* Candle flame */}
      <rect x="11" y="4" width="2" height="2" fill="#FFE58F" />
      <rect x="11" y="3" width="2" height="1" fill="#FFAE52" />
      {/* Candle stick */}
      <rect x="11" y="6" width="2" height="5" fill="#C4B5FD" />
      <rect x="11" y="8" width="2" height="1" fill="#FFFFFF" />

      {/* Cake body & cream icing */}
      <rect x="7" y="11" width="10" height="7" fill="#FFBE94" />
      <rect x="7" y="11" width="10" height="3" fill="#FFFDFB" />
      <rect x="8" y="14" width="2" height="1" fill="#FFFDFB" />
      <rect x="11" y="14" width="2" height="1" fill="#FFFDFB" />
      <rect x="14" y="14" width="2" height="1" fill="#FFFDFB" />
      <rect x="9" y="12" width="1" height="1" fill="#FF759F" />
      <rect x="14" y="12" width="1" height="1" fill="#6EE7B7" />

      {/* Plate & crisp outline */}
      <rect x="5" y="18" width="14" height="2" fill="#DCEBFF" />
      <rect x="6" y="11" width="1" height="7" fill={S} />
      <rect x="17" y="11" width="1" height="7" fill={S} />
      <rect x="7" y="10" width="10" height="1" fill={S} />
      <rect x="5" y="18" width="14" height="1" fill={S} />
    </svg>
  );
}
