import { STROKE_COLOR } from '../theme';

interface MoodFaceProps {
  value: number;
  size?: number;
  className?: string;
}

export function getMoodTier(value: number): {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  fill: string;
  shade: string;
} {
  if (value >= 80) return { level: 5, label: 'ปังสุดๆ', fill: '#A7F3D0', shade: '#6EE7B7' };
  if (value >= 60) return { level: 4, label: 'ดีเลย', fill: '#D9F99D', shade: '#BEF264' };
  if (value >= 40) return { level: 3, label: 'เรื่อยๆ', fill: '#FEF08A', shade: '#FDE047' };
  if (value >= 20) return { level: 2, label: 'เริ่มฝืด', fill: '#FED7AA', shade: '#FDBA74' };
  return { level: 1, label: 'วิกฤต', fill: '#FECDD3', shade: '#FDA4AF' };
}

const S = STROKE_COLOR;

export function MoodFace({ value, size = 30, className = '' }: MoodFaceProps) {
  const tier = getMoodTier(value);

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
      aria-label={`ระดับ ${tier.label}`}
    >
      {/* Crisp Stepped-Pixel Notched Square Face Frame */}
      <rect x="4" y="2" width="16" height="1" fill={S} />
      <rect x="4" y="21" width="16" height="1" fill={S} />
      <rect x="2" y="4" width="1" height="16" fill={S} />
      <rect x="21" y="4" width="1" height="16" fill={S} />
      <rect x="3" y="3" width="1" height="1" fill={S} />
      <rect x="20" y="3" width="1" height="1" fill={S} />
      <rect x="3" y="20" width="1" height="1" fill={S} />
      <rect x="20" y="20" width="1" height="1" fill={S} />

      <rect x="4" y="3" width="16" height="18" fill={tier.fill} />
      <rect x="3" y="4" width="18" height="16" fill={tier.fill} />

      {/* Top white highlight & bottom pixel shade */}
      <rect x="4" y="3" width="16" height="2" fill="#FFFFFF" opacity="0.6" />
      <rect x="4" y="19" width="16" height="2" fill={tier.shade} />

      {/* Rosy pixel cheeks */}
      <rect x="4" y="13" width="3" height="2" fill="#FF8DA8" opacity="0.7" />
      <rect x="17" y="13" width="3" height="2" fill="#FF8DA8" opacity="0.7" />

      {/* Level 5: Sparkling Happy ^ ^ */}
      {tier.level === 5 && (
        <>
          <rect x="6" y="10" width="1" height="1" fill={S} />
          <rect x="7" y="9" width="2" height="1" fill={S} />
          <rect x="9" y="10" width="1" height="1" fill={S} />

          <rect x="14" y="10" width="1" height="1" fill={S} />
          <rect x="15" y="9" width="2" height="1" fill={S} />
          <rect x="17" y="10" width="1" height="1" fill={S} />

          <rect x="9" y="14" width="6" height="3" fill="#FF6B93" />
          <rect x="9" y="13" width="6" height="1" fill={S} />
          <rect x="10" y="17" width="4" height="1" fill={S} />
          <rect x="10" y="14" width="4" height="1" fill="#FFFFFF" />
        </>
      )}

      {/* Level 4: Bright Sparkling Eyes & Smile */}
      {tier.level === 4 && (
        <>
          <rect x="6" y="8" width="3" height="4" fill={S} />
          <rect x="15" y="8" width="3" height="4" fill={S} />
          <rect x="6" y="8" width="2" height="2" fill="#FFFFFF" />
          <rect x="15" y="8" width="2" height="2" fill="#FFFFFF" />
          <rect x="9" y="14" width="1" height="2" fill={S} />
          <rect x="14" y="14" width="1" height="2" fill={S} />
          <rect x="10" y="16" width="4" height="1" fill={S} />
        </>
      )}

      {/* Level 3: Calm Straight Face */}
      {tier.level === 3 && (
        <>
          <rect x="6" y="9" width="3" height="3" fill={S} />
          <rect x="15" y="9" width="3" height="3" fill={S} />
          <rect x="6" y="9" width="1" height="1" fill="#FFFFFF" />
          <rect x="15" y="9" width="1" height="1" fill="#FFFFFF" />
          <rect x="9" y="15" width="6" height="2" fill={S} />
        </>
      )}

      {/* Level 2: Worried Face + Sweat */}
      {tier.level === 2 && (
        <>
          <rect x="6" y="8" width="3" height="1" fill={S} />
          <rect x="15" y="8" width="3" height="1" fill={S} />
          <rect x="6" y="10" width="3" height="2" fill={S} />
          <rect x="15" y="10" width="3" height="2" fill={S} />
          <rect x="9" y="15" width="2" height="1" fill={S} />
          <rect x="11" y="14" width="2" height="1" fill={S} />
          <rect x="13" y="15" width="2" height="1" fill={S} />
          <rect x="18" y="6" width="2" height="4" fill="#60A5FA" />
        </>
      )}

      {/* Level 1: Critical Dizzy X X */}
      {tier.level === 1 && (
        <>
          <rect x="6" y="8" width="1" height="1" fill={S} />
          <rect x="8" y="8" width="1" height="1" fill={S} />
          <rect x="7" y="9" width="1" height="2" fill={S} />
          <rect x="6" y="11" width="1" height="1" fill={S} />
          <rect x="8" y="11" width="1" height="1" fill={S} />

          <rect x="15" y="8" width="1" height="1" fill={S} />
          <rect x="17" y="8" width="1" height="1" fill={S} />
          <rect x="16" y="9" width="1" height="2" fill={S} />
          <rect x="15" y="11" width="1" height="1" fill={S} />
          <rect x="17" y="11" width="1" height="1" fill={S} />

          <rect x="9" y="14" width="6" height="1" fill={S} />
          <rect x="8" y="15" width="2" height="2" fill={S} />
          <rect x="14" y="15" width="2" height="2" fill={S} />
        </>
      )}
    </svg>
  );
}
