import type { Gender } from '../../engine/types';
import { STROKE_COLOR } from '../theme';
import { CharacterSprite } from './CharacterSprite';

interface AvatarProps {
  seed: number;
  gender: Gender;
  ageYears: number;
  mentalIndex?: number;
  jobId?: string;
  appearanceId?: string;
  size?: number;
  animate?: boolean;
  className?: string;
}

const SKIN_TONES = ['#FDE1C8', '#F6C9A5', '#E9B185', '#D69464', '#F3D2B3'];
const HAIR_COLORS = ['#2B2250', '#3F2D21', '#1F1B24', '#5A3825', '#43384F'];
const SHIRT_COLORS = ['#FF8C42', '#3B82F6', '#22C55E', '#EC4899', '#8B5CF6', '#F59E0B', '#14B8A6'];

export type AgeStage = 'infant' | 'child' | 'teen' | 'adult' | 'senior';

export function getAgeStage(ageYears: number): AgeStage {
  if (ageYears <= 5) return 'infant';
  if (ageYears <= 11) return 'child';
  if (ageYears <= 19) return 'teen';
  if (ageYears <= 59) return 'adult';
  return 'senior';
}

export function Avatar({
  seed,
  gender,
  ageYears,
  mentalIndex = 65,
  jobId,
  appearanceId,
  size = 88,
  animate = false,
  className = '',
}: AvatarProps) {
  if (appearanceId) {
    return (
      <CharacterSprite
        charId={appearanceId}
        mode="bust"
        size={size}
        animate={animate}
        className={className}
        seed={seed}
        gender={gender}
        ageYears={ageYears}
        mentalIndex={mentalIndex}
        jobId={jobId}
      />
    );
  }

  const s = Math.abs(seed || 1);
  const stage = getAgeStage(ageYears);

  const skin = SKIN_TONES[s % SKIN_TONES.length];
  const rawHair = HAIR_COLORS[(s >> 3) % HAIR_COLORS.length];
  const hair = stage === 'senior' ? '#D4D0E5' : rawHair;
  const hairAccent = stage === 'senior' ? '#A8A2C5' : rawHair;
  const shirt = SHIRT_COLORS[(s >> 5) % SHIRT_COLORS.length];
  const hasGlasses = stage === 'senior' ? s % 2 === 0 : (s >> 7) % 5 === 0;
  const hairStyle = (s >> 4) % 3;

  // อารมณ์จากดัชนีใจ (Mental)
  const mood: 'happy' | 'neutral' | 'sad' =
    mentalIndex >= 65 ? 'happy' : mentalIndex >= 38 ? 'neutral' : 'sad';

  const isInfant = stage === 'infant';
  const isChild = stage === 'child';
  const isTeen = stage === 'teen';
  const isSchoolUniform = (isChild || isTeen) && (jobId === 'student' || ageYears >= 6);
  const isOffice = stage === 'adult' && (jobId === 'office_junior' || jobId === 'sales_manager' || jobId === 'civil_servant' || jobId === 'software_dev');

  // สัดส่วนหัวต่อตัว: ทารกหัวโตแก้มป่อง, เด็ก/วัยรุ่นเรียวขึ้น, ผู้ใหญ่ไหล่กว้างขึ้น
  const headRadiusX = isInfant ? 25 : isChild ? 23 : 21;
  const headRadiusY = isInfant ? 23 : isChild ? 22 : 23;
  const headCy = isInfant ? 48 : isChild ? 45 : 43;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animate ? 'animate-gentle-bob' : ''} ${className}`}
      role="img"
      aria-label={`ภาพตัวละครอายุ ${ageYears} ปี`}
    >
      {/* กรอบพาสเทลพิกเซลคมชัด */}
      <rect x="2" y="2" width="96" height="96" fill="#FFF0F6" stroke={STROKE_COLOR} strokeWidth="4" />
      <rect x="0" y="0" width="4" height="4" fill="#FFFDFB" />
      <rect x="96" y="0" width="4" height="4" fill="#FFFDFB" />
      <rect x="0" y="96" width="4" height="4" fill="#FFFDFB" />
      <rect x="96" y="96" width="4" height="4" fill="#FFFDFB" />
      <path d="M12 74C22 67 78 67 88 74" stroke="#FFD6E7" strokeWidth="4" strokeLinecap="square" opacity="0.8" />
      <rect x="11" y="11" width="5" height="5" fill="#FFE58F" />

      {/* ผมด้านหลัง (หญิงหรือผมยาวนอนไบนารี) */}
      {!isInfant && (gender === 'female' || (gender === 'nonbinary' && hairStyle === 2)) && (
        <path
          d={
            stage === 'senior'
              ? 'M26 42C24 22 76 22 74 42C75 56 71 62 66 64H34C29 62 25 56 26 42Z'
              : 'M24 44C22 20 78 20 76 44C77 62 73 72 68 74H32C27 72 23 62 24 44Z'
          }
          fill={hair}
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {/* มวยผมผู้สูงอายุหญิง */}
      {stage === 'senior' && gender === 'female' && (
        <circle cx="50" cy="17" r="8" fill={hair} stroke={STROKE_COLOR} strokeWidth="2" />
      )}

      {/* ลำตัว / เสื้อผ้าตามช่วงวัยและอาชีพ */}
      {isInfant ? (
        <path
          d="M27 89C28 73 37 68 50 68C63 68 72 73 73 89Z"
          fill="#FFE066"
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : isSchoolUniform ? (
        <>
          <path
            d="M22 90C24 72 35 67 50 67C65 67 76 72 78 90Z"
            fill="#FFFFFF"
            stroke={STROKE_COLOR}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* ปกคอเสื้อนักเรียน + โบว์/เนกไท */}
          <path
            d="M39 67L50 77L61 67"
            fill="#DBEAFE"
            stroke={STROKE_COLOR}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {gender === 'female' ? (
            <path d="M45 77L50 74L55 77L50 82Z" fill="#EC4899" stroke={STROKE_COLOR} strokeWidth="1.5" />
          ) : (
            <path d="M48 75H52L51 86H49Z" fill="#3B82F6" stroke={STROKE_COLOR} strokeWidth="1.5" />
          )}
        </>
      ) : isOffice ? (
        <>
          <path
            d="M20 90C22 71 34 66 50 66C66 66 78 71 80 90Z"
            fill="#3B82F6"
            stroke={STROKE_COLOR}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M42 66L50 80L58 66Z" fill="#FFFFFF" stroke={STROKE_COLOR} strokeWidth="1.8" />
          <path d="M48 72L50 84L52 72Z" fill="#FF8C42" stroke={STROKE_COLOR} strokeWidth="1.5" />
        </>
      ) : stage === 'senior' ? (
        <>
          <path
            d="M21 90C23 71 34 67 50 67C66 67 77 71 79 90Z"
            fill="#A78BFA"
            stroke={STROKE_COLOR}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M43 67V90M57 67V90" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
        </>
      ) : (
        <path
          d="M21 90C23 72 34 67 50 67C66 67 77 72 79 90Z"
          fill={shirt}
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {/* ผ้ากันเปื้อนเด็กเล็ก */}
      {isInfant && (
        <path
          d="M40 69C43 79 57 79 60 69Z"
          fill="#FFFFFF"
          stroke={STROKE_COLOR}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )}

      {/* ลำคอ */}
      {!isInfant && (
        <rect
          x="44"
          y="60"
          width="12"
          height="10"
          rx="4"
          fill={skin}
          stroke={STROKE_COLOR}
          strokeWidth="2"
        />
      )}

      {/* หูสองข้าง */}
      <circle cx={50 - headRadiusX} cy={headCy + 2} r="4.5" fill={skin} stroke={STROKE_COLOR} strokeWidth="2" />
      <circle cx={50 + headRadiusX} cy={headCy + 2} r="4.5" fill={skin} stroke={STROKE_COLOR} strokeWidth="2" />

      {/* ใบหน้า */}
      <ellipse
        cx="50"
        cy={headCy}
        rx={headRadiusX}
        ry={headRadiusY}
        fill={skin}
        stroke={STROKE_COLOR}
        strokeWidth="2"
      />

      {/* แก้มอมชมพู */}
      <ellipse cx="36" cy={headCy + 5} rx="4" ry="2.2" fill="#FB7185" opacity={isInfant ? 0.5 : 0.32} />
      <ellipse cx="64" cy={headCy + 5} rx="4" ry="2.2" fill="#FB7185" opacity={isInfant ? 0.5 : 0.32} />

      {/* รอยยิ้มหรือเส้นวัยผู้ใหญ่ตอนปลาย */}
      {stage === 'senior' && (
        <>
          <path d="M35 48C35 51 36 53 38 55" stroke={STROKE_COLOR} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
          <path d="M65 48C65 51 64 53 62 55" stroke={STROKE_COLOR} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
        </>
      )}

      {/* ตา */}
      {mood === 'happy' ? (
        <>
          <circle cx="41" cy={headCy - 1} r="2.7" fill={STROKE_COLOR} />
          <circle cx="59" cy={headCy - 1} r="2.7" fill={STROKE_COLOR} />
          <circle cx="40" cy={headCy - 2} r="1" fill="#FFFFFF" />
          <circle cx="58" cy={headCy - 2} r="1" fill="#FFFFFF" />
        </>
      ) : mood === 'neutral' ? (
        <>
          <circle cx="41" cy={headCy - 1} r="2.4" fill={STROKE_COLOR} />
          <circle cx="59" cy={headCy - 1} r="2.4" fill={STROKE_COLOR} />
        </>
      ) : (
        <>
          <circle cx="41" cy={headCy} r="2.3" fill={STROKE_COLOR} />
          <circle cx="59" cy={headCy} r="2.3" fill={STROKE_COLOR} />
          {/* คิ้วตกกังวล */}
          <path d="M37 36L45 38" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M63 36L55 38" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" />
          {/* หยดเหงื่อเล็กๆ */}
          <path d="M68 33C70 36 70 39 68 39C66 39 66 36 68 33Z" fill="#60A5FA" stroke={STROKE_COLOR} strokeWidth="1.3" />
        </>
      )}

      {/* คิ้วปกติ */}
      {mood !== 'sad' && !isInfant && (
        <>
          <path d="M37 36C39 34.5 43 34.5 45 36" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M55 36C57 34.5 61 34.5 63 36" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {/* ปาก */}
      {mood === 'happy' ? (
        <path
          d={`M43 ${headCy + 8}C46 ${headCy + 13} 54 ${headCy + 13} 57 ${headCy + 8}`}
          stroke={STROKE_COLOR}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : mood === 'neutral' ? (
        <path
          d={`M44 ${headCy + 9}H56`}
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M43 ${headCy + 12}C46 ${headCy + 8} 54 ${headCy + 8} 57 ${headCy + 12}`}
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* แว่นตา */}
      {hasGlasses && !isInfant && (
        <g stroke={STROKE_COLOR} strokeWidth="1.8">
          <circle cx="41" cy={headCy - 1} r="6.2" fill="#FFFFFF" fillOpacity="0.22" />
          <circle cx="59" cy={headCy - 1} r="6.2" fill="#FFFFFF" fillOpacity="0.22" />
          <path d="M47.2 42H52.8" />
        </g>
      )}

      {/* ผมด้านหน้าตามช่วงวัย */}
      {isInfant ? (
        /* ปอยผมทารกจุกน้อยน่ารัก */
        <path
          d="M47 25C46 18 52 16 53 23C55 18 59 20 55 26"
          fill={hair}
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : gender === 'female' ? (
        /* หน้าม้าปัดข้างหรือตรง */
        <path
          d={
            hairStyle === 0
              ? 'M28 40C29 22 71 22 72 40C65 33 57 32 50 35C43 32 35 33 28 40Z'
              : 'M28 41C29 21 71 21 72 41C63 31 46 28 28 41Z'
          }
          fill={hairAccent}
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : (
        /* ทรงผมชาย / นอนไบนารี */
        <path
          d={
            hairStyle === 1
              ? 'M28 39C27 21 43 16 54 19C65 17 73 25 72 39C65 31 58 29 50 30C42 29 34 31 28 39Z'
              : 'M28 40C28 21 72 21 72 40C65 32 56 30 50 30C44 30 35 32 28 40Z'
          }
          fill={hairAccent}
          stroke={STROKE_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {/* กิ๊บติดผมเด็กหญิง */}
      {isChild && gender === 'female' && (
        <rect x="61" y="29" width="7" height="3.5" rx="1.5" fill="#FACC15" stroke={STROKE_COLOR} strokeWidth="1.5" />
      )}
    </svg>
  );
}
