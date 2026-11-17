import { STROKE_COLOR } from '../theme';

export type PixelIconName =
  | 'home'
  | 'life'
  | 'people'
  | 'money'
  | 'journal'
  | 'gallery'
  | 'coin'
  | 'heart'
  | 'star'
  | 'sun'
  | 'moon'
  | 'dice'
  | 'reroll'
  | 'folder'
  | 'save'
  | 'play'
  | 'pause'
  | 'fast_forward'
  | 'menu'
  | 'close'
  | 'arrow_left'
  | 'arrow_right'
  | 'chevron_up'
  | 'chevron_down'
  | 'clock'
  | 'briefcase'
  | 'cap'
  | 'train'
  | 'bank'
  | 'trash'
  | 'download'
  | 'check'
  | 'warning'
  | 'shield'
  | 'lightning'
  | 'sparkle'
  | 'plus'
  | 'lock'
  | 'font'
  | 'chat'
  | 'minus'
  | 'chain'
  | 'gender_male'
  | 'gender_female'
  | 'gender_nonbinary';

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  className?: string;
}

const S = STROKE_COLOR;

export function PixelIcon({ name, size = 22, className = '' }: PixelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 inline-block ${className}`}
      aria-hidden="true"
    >
      {/* หน้าหลัก: บ้านหลังคาชมพูพาสเทลพร้อมปล่องไฟและหน้าต่าง */}
      {name === 'home' && (
        <>
          <rect x="16" y="3" width="3" height="5" fill="#FFBE94" />
          <rect x="16" y="2" width="3" height="1" fill={S} />
          <rect x="15" y="3" width="1" height="4" fill={S} />
          <rect x="19" y="3" width="1" height="5" fill={S} />

          {/* Roof */}
          <rect x="10" y="3" width="4" height="2" fill="#FF9EBF" />
          <rect x="7" y="5" width="10" height="2" fill="#FF89B2" />
          <rect x="4" y="7" width="16" height="2" fill="#FF75A3" />
          <rect x="2" y="9" width="20" height="2" fill="#FF75A3" />
          <rect x="10" y="2" width="4" height="1" fill={S} />
          <rect x="7" y="4" width="3" height="1" fill={S} />
          <rect x="14" y="4" width="3" height="1" fill={S} />
          <rect x="4" y="6" width="3" height="1" fill={S} />
          <rect x="17" y="6" width="3" height="1" fill={S} />
          <rect x="2" y="8" width="2" height="1" fill={S} />
          <rect x="20" y="8" width="2" height="1" fill={S} />
          <rect x="1" y="9" width="1" height="2" fill={S} />
          <rect x="22" y="9" width="1" height="2" fill={S} />
          <rect x="2" y="11" width="20" height="1" fill={S} />

          {/* Cottage Wall & Door */}
          <rect x="5" y="12" width="14" height="9" fill="#FFF8EC" />
          <rect x="4" y="12" width="1" height="9" fill={S} />
          <rect x="19" y="12" width="1" height="9" fill={S} />
          <rect x="4" y="21" width="16" height="1" fill={S} />

          <rect x="7" y="14" width="4" height="7" fill="#B4C3FF" />
          <rect x="7" y="13" width="4" height="1" fill={S} />
          <rect x="6" y="14" width="1" height="7" fill={S} />
          <rect x="11" y="14" width="1" height="7" fill={S} />
          <rect x="10" y="17" width="1" height="1" fill="#FFE58F" />

          <rect x="14" y="14" width="3" height="3" fill="#BAE6FD" />
          <rect x="13" y="14" width="1" height="3" fill={S} />
          <rect x="17" y="14" width="1" height="3" fill={S} />
          <rect x="14" y="13" width="3" height="1" fill={S} />
          <rect x="14" y="17" width="3" height="1" fill={S} />
        </>
      )}

      {/* ชีวิต: ตัวละครจิบิหน้ายิ้มน่ารัก */}
      {name === 'life' && (
        <>
          <rect x="8" y="2" width="8" height="1" fill={S} />
          <rect x="6" y="3" width="2" height="2" fill={S} />
          <rect x="16" y="3" width="2" height="2" fill={S} />
          <rect x="5" y="5" width="1" height="7" fill={S} />
          <rect x="18" y="5" width="1" height="7" fill={S} />
          <rect x="6" y="12" width="2" height="1" fill={S} />
          <rect x="16" y="12" width="2" height="1" fill={S} />
          <rect x="8" y="13" width="8" height="1" fill={S} />

          {/* Hair & Face */}
          <rect x="8" y="3" width="8" height="3" fill="#8C6258" />
          <rect x="6" y="5" width="12" height="2" fill="#8C6258" />
          <rect x="6" y="7" width="12" height="5" fill="#FDE0C6" />
          <rect x="8" y="12" width="8" height="1" fill="#FDE0C6" />
          <rect x="8" y="8" width="2" height="2" fill={S} />
          <rect x="14" y="8" width="2" height="2" fill={S} />
          <rect x="7" y="10" width="2" height="1" fill="#FF9EBF" />
          <rect x="15" y="10" width="2" height="1" fill="#FF9EBF" />
          <rect x="11" y="11" width="2" height="1" fill={S} />

          {/* Shirt & Gold Star Collar */}
          <rect x="5" y="14" width="14" height="6" fill="#93C5FD" />
          <rect x="4" y="15" width="1" height="5" fill={S} />
          <rect x="19" y="15" width="1" height="5" fill={S} />
          <rect x="5" y="20" width="14" height="1" fill={S} />
          <rect x="10" y="15" width="4" height="3" fill="#FFE58F" />
        </>
      )}

      {/* คน: เพื่อนสองคนคู่กันพร้อมหัวใจเล็กข้างบน */}
      {name === 'people' && (
        <>
          {/* Little Floating Heart */}
          <rect x="10" y="2" width="2" height="2" fill="#FF759F" />
          <rect x="13" y="2" width="2" height="2" fill="#FF759F" />
          <rect x="10" y="3" width="5" height="2" fill="#FF759F" />
          <rect x="11" y="5" width="3" height="1" fill="#FF759F" />

          {/* Left Person */}
          <rect x="4" y="7" width="5" height="5" fill="#FDE0C6" />
          <rect x="4" y="6" width="5" height="2" fill="#6D4C41" />
          <rect x="3" y="7" width="1" height="5" fill={S} />
          <rect x="9" y="7" width="1" height="5" fill={S} />
          <rect x="4" y="12" width="5" height="1" fill={S} />
          <rect x="2" y="14" width="9" height="6" fill="#FFB5CE" />
          <rect x="1" y="15" width="1" height="5" fill={S} />
          <rect x="2" y="13" width="9" height="1" fill={S} />
          <rect x="2" y="20" width="9" height="1" fill={S} />

          {/* Right Person */}
          <rect x="15" y="7" width="5" height="5" fill="#F6C9A5" />
          <rect x="15" y="6" width="5" height="2" fill="#3D2D52" />
          <rect x="14" y="7" width="1" height="5" fill={S} />
          <rect x="20" y="7" width="1" height="5" fill={S} />
          <rect x="15" y="12" width="5" height="1" fill={S} />
          <rect x="13" y="14" width="9" height="6" fill="#B8F0D2" />
          <rect x="22" y="15" width="1" height="5" fill={S} />
          <rect x="13" y="13" width="9" height="1" fill={S} />
          <rect x="13" y="20" width="9" height="1" fill={S} />
          <rect x="11" y="14" width="2" height="6" fill={S} opacity="0.5" />
        </>
      )}

      {/* เงิน / เหรียญทอง: เหรียญกลมเงางามมีสัญลักษณ์ ฿ */}
      {(name === 'money' || name === 'coin') && (
        <>
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

          <rect x="8" y="3" width="8" height="18" fill="#F59E0B" />
          <rect x="6" y="4" width="12" height="16" fill="#F59E0B" />
          <rect x="4" y="6" width="16" height="12" fill="#F59E0B" />
          <rect x="3" y="8" width="18" height="8" fill="#F59E0B" />

          <rect x="8" y="5" width="8" height="14" fill="#FFE58F" />
          <rect x="6" y="6" width="12" height="12" fill="#FFD35C" />
          <rect x="5" y="8" width="14" height="8" fill="#FFD35C" />
          <rect x="6" y="6" width="3" height="2" fill="#FFFFFF" />

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

      {/* บันทึก: สมุดไดอารี่สันห่วงพร้อมปกชมพูและเส้นข้อความ */}
      {name === 'journal' && (
        <>
          <rect x="5" y="2" width="14" height="1" fill={S} />
          <rect x="4" y="3" width="1" height="18" fill={S} />
          <rect x="19" y="3" width="1" height="18" fill={S} />
          <rect x="5" y="21" width="14" height="1" fill={S} />
          <rect x="5" y="3" width="14" height="18" fill="#FFF9E6" />
          <rect x="5" y="3" width="3" height="18" fill="#FFB5CE" />
          <rect x="8" y="3" width="1" height="18" fill={S} opacity="0.25" />

          {/* Spiral Rings */}
          <rect x="2" y="5" width="4" height="2" fill={S} />
          <rect x="2" y="11" width="4" height="2" fill={S} />
          <rect x="2" y="17" width="4" height="2" fill={S} />

          {/* Cover Label & Lines */}
          <rect x="10" y="6" width="7" height="4" fill="#B4C3FF" />
          <rect x="10" y="5" width="7" height="1" fill={S} opacity="0.4" />
          <rect x="10" y="12" width="7" height="2" fill={S} opacity="0.45" />
          <rect x="10" y="15" width="5" height="2" fill={S} opacity="0.35" />
          <rect x="14" y="18" width="3" height="4" fill="#FF759F" />
        </>
      )}

      {/* แกลเลอรีตัวละคร: กรอบรูป 2x2 สีพาสเทล + ประกาย */}
      {name === 'gallery' && (
        <>
          <rect x="3" y="3" width="8" height="8" fill="#FFE0EE" />
          <rect x="3" y="2" width="8" height="1" fill={S} />
          <rect x="3" y="11" width="8" height="1" fill={S} />
          <rect x="2" y="3" width="1" height="8" fill={S} />
          <rect x="11" y="3" width="1" height="8" fill={S} />
          <rect x="5" y="5" width="4" height="3" fill="#FDE0C6" />
          <rect x="5" y="4" width="4" height="1" fill={S} />
          <rect x="4" y="8" width="6" height="3" fill="#FF8DA8" />

          <rect x="13" y="3" width="8" height="8" fill="#DCEBFF" />
          <rect x="13" y="2" width="8" height="1" fill={S} />
          <rect x="13" y="11" width="8" height="1" fill={S} />
          <rect x="12" y="3" width="1" height="8" fill={S} />
          <rect x="21" y="3" width="1" height="8" fill={S} />
          <rect x="15" y="5" width="4" height="3" fill="#F6C9A5" />
          <rect x="15" y="4" width="4" height="1" fill={S} />
          <rect x="14" y="8" width="6" height="3" fill="#93C5FD" />

          <rect x="3" y="13" width="8" height="8" fill="#D6FAEA" />
          <rect x="3" y="12" width="8" height="1" fill={S} />
          <rect x="3" y="21" width="8" height="1" fill={S} />
          <rect x="2" y="13" width="1" height="8" fill={S} />
          <rect x="11" y="13" width="1" height="8" fill={S} />
          <rect x="5" y="15" width="4" height="3" fill="#E9B185" />
          <rect x="5" y="14" width="4" height="1" fill={S} />
          <rect x="4" y="18" width="6" height="3" fill="#6EE7B7" />

          <rect x="13" y="13" width="8" height="8" fill="#FFF3BF" />
          <rect x="13" y="12" width="8" height="1" fill={S} />
          <rect x="13" y="21" width="8" height="1" fill={S} />
          <rect x="12" y="13" width="1" height="8" fill={S} />
          <rect x="21" y="13" width="1" height="8" fill={S} />
          <rect x="16" y="14" width="2" height="6" fill="#F59E0B" />
          <rect x="14" y="16" width="6" height="2" fill="#F59E0B" />
        </>
      )}

      {name === 'heart' && (
        <>
          <rect x="5" y="4" width="5" height="1" fill={S} />
          <rect x="14" y="4" width="5" height="1" fill={S} />
          <rect x="3" y="5" width="2" height="1" fill={S} />
          <rect x="10" y="5" width="1" height="1" fill={S} />
          <rect x="13" y="5" width="1" height="1" fill={S} />
          <rect x="19" y="5" width="2" height="1" fill={S} />
          <rect x="2" y="6" width="1" height="5" fill={S} />
          <rect x="11" y="6" width="2" height="1" fill={S} />
          <rect x="21" y="6" width="1" height="5" fill={S} />
          <rect x="3" y="11" width="1" height="2" fill={S} />
          <rect x="20" y="11" width="1" height="2" fill={S} />
          <rect x="4" y="13" width="2" height="2" fill={S} />
          <rect x="18" y="13" width="2" height="2" fill={S} />
          <rect x="6" y="15" width="2" height="2" fill={S} />
          <rect x="16" y="15" width="2" height="2" fill={S} />
          <rect x="8" y="17" width="3" height="2" fill={S} />
          <rect x="13" y="17" width="3" height="2" fill={S} />
          <rect x="11" y="19" width="2" height="1" fill={S} />

          <rect x="5" y="5" width="5" height="2" fill="#FFB8D4" />
          <rect x="14" y="5" width="5" height="2" fill="#FFB8D4" />
          <rect x="3" y="6" width="8" height="5" fill="#FF89B5" />
          <rect x="13" y="6" width="8" height="5" fill="#FF89B5" />
          <rect x="11" y="7" width="2" height="12" fill="#FF89B5" />
          <rect x="4" y="11" width="16" height="2" fill="#FF89B5" />
          <rect x="6" y="13" width="12" height="2" fill="#FF6B93" />
          <rect x="8" y="15" width="8" height="2" fill="#FF6B93" />
          <rect x="10" y="17" width="4" height="2" fill="#FF6B93" />
          <rect x="5" y="7" width="2" height="2" fill="#FFFFFF" />
        </>
      )}

      {(name === 'star' || name === 'sparkle') && (
        <>
          <rect x="11" y="2" width="2" height="20" fill="#FFE58F" />
          <rect x="2" y="11" width="20" height="2" fill="#FFE58F" />
          <rect x="9" y="6" width="6" height="12" fill="#FFD35C" />
          <rect x="6" y="9" width="12" height="6" fill="#FFD35C" />
          <rect x="11" y="1" width="2" height="1" fill={S} />
          <rect x="11" y="22" width="2" height="1" fill={S} />
          <rect x="1" y="11" width="1" height="2" fill={S} />
          <rect x="22" y="11" width="1" height="2" fill={S} />
          <rect x="10" y="2" width="1" height="4" fill={S} />
          <rect x="13" y="2" width="1" height="4" fill={S} />
          <rect x="10" y="18" width="1" height="4" fill={S} />
          <rect x="13" y="18" width="1" height="4" fill={S} />
          <rect x="2" y="10" width="4" height="1" fill={S} />
          <rect x="18" y="10" width="4" height="1" fill={S} />
          <rect x="2" y="13" width="4" height="1" fill={S} />
          <rect x="18" y="13" width="4" height="1" fill={S} />
          <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
        </>
      )}

      {name === 'sun' && (
        <>
          <rect x="11" y="1" width="2" height="3" fill="#FFAE52" />
          <rect x="11" y="20" width="2" height="3" fill="#FFAE52" />
          <rect x="1" y="11" width="3" height="2" fill="#FFAE52" />
          <rect x="20" y="11" width="3" height="2" fill="#FFAE52" />
          <rect x="4" y="4" width="2" height="2" fill="#FFD35C" />
          <rect x="18" y="4" width="2" height="2" fill="#FFD35C" />
          <rect x="4" y="18" width="2" height="2" fill="#FFD35C" />
          <rect x="18" y="18" width="2" height="2" fill="#FFD35C" />

          <rect x="8" y="6" width="8" height="12" fill="#FFE58F" />
          <rect x="6" y="8" width="12" height="8" fill="#FFD35C" />
          <rect x="8" y="5" width="8" height="1" fill={S} />
          <rect x="8" y="18" width="8" height="1" fill={S} />
          <rect x="5" y="8" width="1" height="8" fill={S} />
          <rect x="18" y="8" width="1" height="8" fill={S} />
          <rect x="9" y="8" width="2" height="2" fill="#FFFFFF" />
        </>
      )}

      {name === 'moon' && (
        <>
          {/* Outer pixel outline for bright golden crescent moon */}
          <rect x="8" y="2" width="7" height="1" fill={S} />
          <rect x="6" y="3" width="2" height="1" fill={S} />
          <rect x="5" y="4" width="1" height="2" fill={S} />
          <rect x="4" y="6" width="1" height="2" fill={S} />
          <rect x="3" y="8" width="1" height="8" fill={S} />
          <rect x="4" y="16" width="1" height="2" fill={S} />
          <rect x="5" y="18" width="1" height="2" fill={S} />
          <rect x="6" y="20" width="2" height="1" fill={S} />
          <rect x="8" y="21" width="7" height="1" fill={S} />
          <rect x="15" y="20" width="2" height="1" fill={S} />
          <rect x="15" y="3" width="1" height="1" fill={S} />

          {/* Golden crescent body (high-contrast on both light & dark) */}
          <rect x="8" y="3" width="7" height="2" fill="#FFE58F" />
          <rect x="6" y="4" width="6" height="2" fill="#FFE58F" />
          <rect x="5" y="6" width="5" height="2" fill="#FFE58F" />
          <rect x="4" y="8" width="5" height="8" fill="#FFD35C" />
          <rect x="5" y="16" width="5" height="2" fill="#FFD35C" />
          <rect x="6" y="18" width="7" height="2" fill="#FFD35C" />
          <rect x="8" y="20" width="7" height="1" fill="#FBBF24" />
          <rect x="13" y="17" width="3" height="2" fill="#FFD35C" />
          <rect x="12" y="5" width="3" height="2" fill="#FFE58F" />

          {/* Crisp inner crescent highlight */}
          <rect x="6" y="6" width="2" height="2" fill="#FFFDF4" />
          <rect x="5" y="8" width="2" height="4" fill="#FFFDF4" />

          {/* Inner crescent edge outline */}
          <rect x="11" y="6" width="1" height="2" fill={S} />
          <rect x="9" y="8" width="1" height="8" fill={S} />
          <rect x="10" y="16" width="2" height="1" fill={S} />
          <rect x="12" y="17" width="3" height="1" fill={S} />

          {/* Bright pixel star beside crescent */}
          <rect x="17" y="6" width="2" height="6" fill="#FFE58F" />
          <rect x="15" y="8" width="6" height="2" fill="#FFE58F" />
          <rect x="17" y="8" width="2" height="2" fill="#FFFFFF" />
        </>
      )}

      {name === 'dice' && (
        <>
          <rect x="4" y="2" width="16" height="1" fill={S} />
          <rect x="4" y="21" width="16" height="1" fill={S} />
          <rect x="2" y="4" width="1" height="16" fill={S} />
          <rect x="21" y="4" width="1" height="16" fill={S} />
          <rect x="3" y="3" width="1" height="1" fill={S} />
          <rect x="20" y="3" width="1" height="1" fill={S} />
          <rect x="3" y="20" width="1" height="1" fill={S} />
          <rect x="20" y="20" width="1" height="1" fill={S} />

          <rect x="3" y="4" width="18" height="16" fill="#FFF3BF" />
          <rect x="4" y="3" width="16" height="18" fill="#FFF3BF" />
          <rect x="4" y="3" width="16" height="3" fill="#FFFFFF" />
          <rect x="6" y="6" width="3" height="3" fill={S} />
          <rect x="15" y="6" width="3" height="3" fill={S} />
          <rect x="10" y="10" width="4" height="4" fill="#FF759F" />
          <rect x="6" y="15" width="3" height="3" fill={S} />
          <rect x="15" y="15" width="3" height="3" fill={S} />
        </>
      )}

      {name === 'reroll' && (
        <>
          <rect x="6" y="4" width="11" height="3" fill="#FF8DA8" />
          <rect x="4" y="6" width="3" height="5" fill="#FF8DA8" />
          <rect x="15" y="2" width="2" height="7" fill="#FF8DA8" />
          <rect x="17" y="4" width="2" height="3" fill="#FF8DA8" />
          <rect x="7" y="3" width="9" height="1" fill={S} />
          <rect x="13" y="7" width="7" height="1" fill={S} />

          <rect x="7" y="17" width="11" height="3" fill="#93C5FD" />
          <rect x="17" y="13" width="3" height="5" fill="#93C5FD" />
          <rect x="7" y="15" width="2" height="7" fill="#93C5FD" />
          <rect x="5" y="17" width="2" height="3" fill="#93C5FD" />
          <rect x="8" y="20" width="9" height="1" fill={S} />
          <rect x="4" y="16" width="7" height="1" fill={S} />
        </>
      )}

      {name === 'folder' && (
        <>
          <rect x="3" y="4" width="7" height="3" fill="#FFE58F" />
          <rect x="3" y="3" width="7" height="1" fill={S} />
          <rect x="2" y="4" width="1" height="16" fill={S} />
          <rect x="10" y="6" width="11" height="1" fill={S} />
          <rect x="21" y="7" width="1" height="13" fill={S} />
          <rect x="3" y="20" width="18" height="1" fill={S} />
          <rect x="3" y="7" width="18" height="13" fill="#B4C3FF" />
          <rect x="3" y="7" width="18" height="3" fill="#DCEBFF" />
        </>
      )}

      {name === 'save' && (
        <>
          <rect x="3" y="2" width="16" height="1" fill={S} />
          <rect x="2" y="3" width="1" height="18" fill={S} />
          <rect x="21" y="5" width="1" height="16" fill={S} />
          <rect x="19" y="3" width="2" height="2" fill={S} />
          <rect x="3" y="21" width="18" height="1" fill={S} />
          <rect x="3" y="3" width="18" height="18" fill="#B4C3FF" />
          <rect x="6" y="3" width="10" height="7" fill="#FFFDFB" />
          <rect x="12" y="4" width="2" height="5" fill={S} />
          <rect x="6" y="13" width="12" height="8" fill="#FFE58F" />
          <rect x="8" y="16" width="8" height="1" fill={S} opacity="0.45" />
          <rect x="8" y="18" width="6" height="1" fill={S} opacity="0.45" />
        </>
      )}

      {name === 'play' && (
        <>
          <rect x="6" y="3" width="3" height="18" fill="currentColor" />
          <rect x="9" y="5" width="3" height="14" fill="currentColor" />
          <rect x="12" y="7" width="3" height="10" fill="currentColor" />
          <rect x="15" y="9" width="3" height="6" fill="currentColor" />
          <rect x="18" y="11" width="2" height="2" fill="currentColor" />
        </>
      )}

      {name === 'pause' && (
        <>
          <rect x="5" y="4" width="5" height="16" fill="currentColor" />
          <rect x="14" y="4" width="5" height="16" fill="currentColor" />
        </>
      )}

      {name === 'fast_forward' && (
        <>
          <rect x="3" y="5" width="3" height="14" fill="#FF8DA8" />
          <rect x="6" y="7" width="3" height="10" fill="#FF8DA8" />
          <rect x="9" y="9" width="2" height="6" fill="#FF8DA8" />
          <rect x="12" y="5" width="3" height="14" fill="#93C5FD" />
          <rect x="15" y="7" width="3" height="10" fill="#93C5FD" />
          <rect x="18" y="9" width="3" height="6" fill="#93C5FD" />
          <rect x="2" y="5" width="1" height="14" fill={S} />
        </>
      )}

      {name === 'menu' && (
        <>
          <rect x="3" y="5" width="18" height="3" fill="currentColor" />
          <rect x="3" y="11" width="18" height="3" fill="currentColor" />
          <rect x="3" y="17" width="18" height="3" fill="currentColor" />
        </>
      )}

      {name === 'close' && (
        <>
          <rect x="5" y="5" width="3" height="3" fill="currentColor" />
          <rect x="16" y="5" width="3" height="3" fill="currentColor" />
          <rect x="8" y="8" width="3" height="3" fill="currentColor" />
          <rect x="13" y="8" width="3" height="3" fill="currentColor" />
          <rect x="10" y="10" width="4" height="4" fill="currentColor" />
          <rect x="8" y="13" width="3" height="3" fill="currentColor" />
          <rect x="13" y="13" width="3" height="3" fill="currentColor" />
          <rect x="5" y="16" width="3" height="3" fill="currentColor" />
          <rect x="16" y="16" width="3" height="3" fill="currentColor" />
        </>
      )}

      {name === 'arrow_left' && (
        <>
          <rect x="5" y="11" width="15" height="2" fill="currentColor" />
          <rect x="7" y="9" width="3" height="6" fill="currentColor" />
          <rect x="9" y="7" width="3" height="3" fill="currentColor" />
          <rect x="9" y="14" width="3" height="3" fill="currentColor" />
          <rect x="11" y="5" width="2" height="3" fill="currentColor" />
          <rect x="11" y="16" width="2" height="3" fill="currentColor" />
        </>
      )}

      {name === 'arrow_right' && (
        <>
          <rect x="4" y="11" width="15" height="2" fill="currentColor" />
          <rect x="14" y="9" width="3" height="6" fill="currentColor" />
          <rect x="12" y="7" width="3" height="3" fill="currentColor" />
          <rect x="12" y="14" width="3" height="3" fill="currentColor" />
          <rect x="11" y="5" width="2" height="3" fill="currentColor" />
          <rect x="11" y="16" width="2" height="3" fill="currentColor" />
        </>
      )}

      {name === 'chevron_up' && (
        <>
          <rect x="11" y="7" width="2" height="3" fill="currentColor" />
          <rect x="9" y="9" width="2" height="3" fill="currentColor" />
          <rect x="13" y="9" width="2" height="3" fill="currentColor" />
          <rect x="7" y="11" width="2" height="3" fill="currentColor" />
          <rect x="15" y="11" width="2" height="3" fill="currentColor" />
          <rect x="5" y="13" width="2" height="2" fill="currentColor" />
          <rect x="17" y="13" width="2" height="2" fill="currentColor" />
        </>
      )}

      {name === 'chevron_down' && (
        <>
          <rect x="5" y="8" width="2" height="2" fill="currentColor" />
          <rect x="17" y="8" width="2" height="2" fill="currentColor" />
          <rect x="7" y="9" width="2" height="3" fill="currentColor" />
          <rect x="15" y="9" width="2" height="3" fill="currentColor" />
          <rect x="9" y="11" width="2" height="3" fill="currentColor" />
          <rect x="13" y="11" width="2" height="3" fill="currentColor" />
          <rect x="11" y="13" width="2" height="3" fill="currentColor" />
        </>
      )}

      {name === 'clock' && (
        <>
          <rect x="8" y="2" width="8" height="1" fill={S} />
          <rect x="8" y="21" width="8" height="1" fill={S} />
          <rect x="2" y="8" width="1" height="8" fill={S} />
          <rect x="21" y="8" width="1" height="8" fill={S} />
          <rect x="5" y="4" width="14" height="16" fill="#EAE2FF" />
          <rect x="4" y="6" width="16" height="12" fill="#FFFFFF" />
          <rect x="8" y="3" width="8" height="18" fill="#FFFFFF" />
          <rect x="11" y="6" width="2" height="7" fill="#8B5CF6" />
          <rect x="11" y="11" width="6" height="2" fill={S} />
          <rect x="10" y="11" width="3" height="2" fill={S} />
        </>
      )}

      {name === 'briefcase' && (
        <>
          <rect x="8" y="3" width="8" height="1" fill={S} />
          <rect x="7" y="4" width="2" height="3" fill={S} />
          <rect x="15" y="4" width="2" height="3" fill={S} />
          <rect x="3" y="7" width="18" height="13" fill="#FFBE94" />
          <rect x="2" y="7" width="1" height="13" fill={S} />
          <rect x="21" y="7" width="1" height="13" fill={S} />
          <rect x="3" y="6" width="18" height="1" fill={S} />
          <rect x="3" y="20" width="18" height="1" fill={S} />
          <rect x="3" y="12" width="18" height="2" fill={S} opacity="0.65" />
          <rect x="10" y="11" width="4" height="4" fill="#FFE58F" />
          <rect x="10" y="10" width="4" height="1" fill={S} />
        </>
      )}

      {name === 'cap' && (
        <>
          <rect x="10" y="3" width="4" height="2" fill="#60A5FA" />
          <rect x="6" y="5" width="12" height="2" fill="#93C5FD" />
          <rect x="2" y="7" width="20" height="3" fill="#60A5FA" />
          <rect x="6" y="10" width="12" height="2" fill="#3B82F6" />
          <rect x="6" y="12" width="12" height="6" fill="#93C5FD" />
          <rect x="19" y="10" width="2" height="8" fill="#FFE58F" />
          <rect x="5" y="12" width="1" height="6" fill={S} />
          <rect x="18" y="12" width="1" height="6" fill={S} />
          <rect x="6" y="18" width="12" height="1" fill={S} />
        </>
      )}

      {name === 'train' && (
        <>
          <rect x="11" y="2" width="2" height="2" fill={S} />
          <rect x="8" y="4" width="8" height="4" fill="#B8F0D2" />
          <rect x="5" y="8" width="14" height="7" fill="#C4B5FD" />
          <rect x="7" y="10" width="4" height="3" fill="#FFFFFF" />
          <rect x="13" y="10" width="4" height="3" fill="#FFFFFF" />
          <rect x="8" y="15" width="8" height="5" fill="#FFE58F" />
          <rect x="4" y="8" width="1" height="7" fill={S} />
          <rect x="19" y="8" width="1" height="7" fill={S} />
          <rect x="7" y="20" width="10" height="1" fill={S} />
        </>
      )}

      {name === 'bank' && (
        <>
          <rect x="11" y="2" width="2" height="2" fill={S} />
          <rect x="6" y="4" width="12" height="2" fill="#FFB5CE" />
          <rect x="3" y="6" width="18" height="2" fill="#FF8DA8" />
          <rect x="2" y="8" width="20" height="1" fill={S} />
          <rect x="5" y="9" width="3" height="8" fill="#FFFDFB" />
          <rect x="10" y="9" width="4" height="8" fill="#FFFDFB" />
          <rect x="16" y="9" width="3" height="8" fill="#FFFDFB" />
          <rect x="2" y="17" width="20" height="3" fill="#FFE58F" />
          <rect x="2" y="20" width="20" height="1" fill={S} />
        </>
      )}

      {name === 'trash' && (
        <>
          <rect x="9" y="3" width="6" height="2" fill={S} />
          <rect x="4" y="5" width="16" height="2" fill="#FFB5CE" />
          <rect x="3" y="7" width="18" height="1" fill={S} />
          <rect x="6" y="8" width="12" height="12" fill="#FFE4EE" />
          <rect x="9" y="10" width="2" height="7" fill={S} />
          <rect x="13" y="10" width="2" height="7" fill={S} />
          <rect x="5" y="8" width="1" height="12" fill={S} />
          <rect x="18" y="8" width="1" height="12" fill={S} />
          <rect x="6" y="20" width="12" height="1" fill={S} />
        </>
      )}

      {name === 'download' && (
        <>
          <rect x="10" y="3" width="4" height="9" fill="currentColor" />
          <rect x="7" y="10" width="10" height="2" fill="currentColor" />
          <rect x="9" y="12" width="6" height="2" fill="currentColor" />
          <rect x="11" y="14" width="2" height="2" fill="currentColor" />
          <rect x="3" y="15" width="2" height="5" fill="currentColor" />
          <rect x="19" y="15" width="2" height="5" fill="currentColor" />
          <rect x="3" y="19" width="18" height="2" fill="#34D399" />
          <rect x="3" y="21" width="18" height="1" fill="currentColor" />
        </>
      )}

      {name === 'check' && (
        <>
          <rect x="3" y="3" width="18" height="18" fill="#B8F0D2" />
          <rect x="3" y="2" width="18" height="1" fill={S} />
          <rect x="3" y="21" width="18" height="1" fill={S} />
          <rect x="2" y="3" width="1" height="18" fill={S} />
          <rect x="21" y="3" width="1" height="18" fill={S} />
          <rect x="15" y="7" width="3" height="3" fill="#167956" />
          <rect x="12" y="10" width="3" height="3" fill="#167956" />
          <rect x="9" y="13" width="3" height="3" fill="#167956" />
          <rect x="6" y="11" width="3" height="3" fill="#167956" />
        </>
      )}

      {name === 'warning' && (
        <>
          <rect x="11" y="3" width="2" height="3" fill="#FF89A8" />
          <rect x="9" y="6" width="6" height="4" fill="#FF89A8" />
          <rect x="6" y="10" width="12" height="5" fill="#FF89A8" />
          <rect x="3" y="15" width="18" height="4" fill="#FF89A8" />
          <rect x="11" y="8" width="2" height="6" fill="#FFFFFF" />
          <rect x="11" y="15" width="2" height="2" fill="#FFFFFF" />
          <rect x="3" y="19" width="18" height="1" fill={S} />
        </>
      )}

      {name === 'shield' && (
        <>
          <rect x="5" y="2" width="14" height="1" fill={S} />
          <rect x="4" y="3" width="1" height="10" fill={S} />
          <rect x="19" y="3" width="1" height="10" fill={S} />
          <rect x="5" y="3" width="14" height="10" fill="#DCEBFF" />
          <rect x="6" y="13" width="12" height="4" fill="#B4C3FF" />
          <rect x="8" y="17" width="8" height="3" fill="#B4C3FF" />
          <rect x="10" y="20" width="4" height="1" fill={S} />
          <rect x="11" y="6" width="2" height="9" fill="#2559B8" />
          <rect x="8" y="9" width="8" height="2" fill="#2559B8" />
        </>
      )}

      {name === 'lightning' && (
        <>
          <rect x="12" y="2" width="6" height="4" fill="#FFE58F" />
          <rect x="9" y="6" width="6" height="4" fill="#FFD35C" />
          <rect x="6" y="10" width="12" height="3" fill="#FFD35C" />
          <rect x="9" y="13" width="6" height="4" fill="#FFAE52" />
          <rect x="6" y="17" width="6" height="4" fill="#FFAE52" />
          <rect x="11" y="2" width="1" height="4" fill={S} />
          <rect x="18" y="2" width="1" height="4" fill={S} />
          <rect x="5" y="10" width="1" height="3" fill={S} />
          <rect x="18" y="10" width="1" height="3" fill={S} />
        </>
      )}

      {name === 'plus' && (
        <>
          <rect x="10" y="4" width="4" height="16" fill="currentColor" />
          <rect x="4" y="10" width="16" height="4" fill="currentColor" />
        </>
      )}

      {name === 'lock' && (
        <>
          <rect x="8" y="3" width="8" height="2" fill={S} />
          <rect x="6" y="5" width="2" height="5" fill={S} />
          <rect x="16" y="5" width="2" height="5" fill={S} />
          <rect x="4" y="10" width="16" height="10" fill="#FFE58F" />
          <rect x="4" y="9" width="16" height="1" fill={S} />
          <rect x="4" y="20" width="16" height="1" fill={S} />
          <rect x="3" y="10" width="1" height="10" fill={S} />
          <rect x="20" y="10" width="1" height="10" fill={S} />
          <rect x="11" y="13" width="2" height="5" fill={S} />
        </>
      )}

      {name === 'font' && (
        <>
          <rect x="5" y="4" width="4" height="2" fill="currentColor" />
          <rect x="4" y="6" width="2" height="12" fill="currentColor" />
          <rect x="8" y="6" width="2" height="12" fill="currentColor" />
          <rect x="5" y="11" width="4" height="2" fill="currentColor" />
          <rect x="13" y="9" width="6" height="2" fill="#FF8DA8" />
          <rect x="17" y="11" width="2" height="7" fill="#FF8DA8" />
          <rect x="13" y="13" width="4" height="2" fill="#FF8DA8" />
          <rect x="12" y="15" width="2" height="3" fill="#FF8DA8" />
          <rect x="13" y="17" width="6" height="1" fill="#FF8DA8" />
        </>
      )}

      {name === 'chat' && (
        <>
          <rect x="3" y="4" width="18" height="1" fill={S} />
          <rect x="2" y="5" width="1" height="10" fill={S} />
          <rect x="21" y="5" width="1" height="10" fill={S} />
          <rect x="3" y="15" width="4" height="1" fill={S} />
          <rect x="10" y="15" width="11" height="1" fill={S} />
          <rect x="6" y="16" width="1" height="3" fill={S} />
          <rect x="7" y="18" width="1" height="1" fill={S} />
          <rect x="8" y="16" width="2" height="2" fill={S} />
          <rect x="3" y="5" width="18" height="10" fill="#FFFDFB" />
          <rect x="7" y="15" width="3" height="2" fill="#FFFDFB" />
          <rect x="6" y="9" width="2" height="2" fill="#FF8DA8" />
          <rect x="11" y="9" width="2" height="2" fill="#FF8DA8" />
          <rect x="16" y="9" width="2" height="2" fill="#FF8DA8" />
        </>
      )}

      {name === 'minus' && (
        <>
          <rect x="5" y="11" width="14" height="3" fill="currentColor" />
        </>
      )}

      {/* เพศชาย: พิกเซลสีฟ้าสดใส */}
      {name === 'gender_male' && (
        <>
          {/* วงกลม */}
          <rect x="6" y="10" width="6" height="2" fill="#3B82F6" />
          <rect x="6" y="18" width="6" height="2" fill="#3B82F6" />
          <rect x="4" y="12" width="2" height="6" fill="#3B82F6" />
          <rect x="12" y="12" width="2" height="6" fill="#3B82F6" />
          <rect x="6" y="11" width="2" height="1" fill="#93C5FD" />
          {/* ก้านและหัวลูกศร */}
          <rect x="12" y="10" width="2" height="2" fill="#3B82F6" />
          <rect x="14" y="8" width="2" height="2" fill="#3B82F6" />
          <rect x="16" y="6" width="2" height="2" fill="#3B82F6" />
          <rect x="13" y="4" width="7" height="2" fill="#2563EB" />
          <rect x="18" y="4" width="2" height="7" fill="#2563EB" />
          <rect x="15" y="4" width="2" height="1" fill="#93C5FD" />
        </>
      )}

      {/* เพศหญิง: พิกเซลสีชมพูพาสเทลสด */}
      {name === 'gender_female' && (
        <>
          {/* วงกลม */}
          <rect x="9" y="3" width="6" height="2" fill="#EC4899" />
          <rect x="9" y="12" width="6" height="2" fill="#EC4899" />
          <rect x="7" y="5" width="2" height="7" fill="#EC4899" />
          <rect x="15" y="5" width="2" height="7" fill="#EC4899" />
          <rect x="9" y="4" width="2" height="1" fill="#F9A8D4" />
          {/* กางเขนด้านล่าง */}
          <rect x="11" y="14" width="2" height="7" fill="#DB2777" />
          <rect x="8" y="16" width="8" height="2" fill="#DB2777" />
        </>
      )}

      {/* นอนไบนารี: พิกเซลสีม่วงลาเวนเดอร์ */}
      {name === 'gender_nonbinary' && (
        <>
          {/* ดาวบน */}
          <rect x="11" y="2" width="2" height="2" fill="#8B5CF6" />
          <rect x="8" y="4" width="8" height="2" fill="#8B5CF6" />
          <rect x="11" y="6" width="2" height="3" fill="#7C3AED" />
          {/* วงกลมกลาง */}
          <rect x="9" y="9" width="6" height="2" fill="#8B5CF6" />
          <rect x="9" y="16" width="6" height="2" fill="#8B5CF6" />
          <rect x="7" y="11" width="2" height="5" fill="#8B5CF6" />
          <rect x="15" y="11" width="2" height="5" fill="#8B5CF6" />
          <rect x="9" y="10" width="2" height="1" fill="#DDD6FE" />
          {/* กากบาทล่าง */}
          <rect x="11" y="18" width="2" height="4" fill="#7C3AED" />
          <rect x="9" y="19" width="6" height="2" fill="#7C3AED" />
        </>
      )}

      {/* โซ่เชื่อมช่วงเวลา: 2 ห่วงคล้องกันแนวนอนคมชัด (ไร้อิโมจิ) */}
      {name === 'chain' && (
        <>
          {/* Left link outer dark outline */}
          <rect x="3" y="6" width="8" height="2" fill={S} />
          <rect x="3" y="16" width="8" height="2" fill={S} />
          <rect x="1" y="8" width="2" height="8" fill={S} />
          <rect x="10" y="8" width="2" height="3" fill={S} />
          <rect x="10" y="13" width="2" height="3" fill={S} />
          {/* Left link metallic body (hollow center at x=5..8, y=10..13) */}
          <rect x="3" y="8" width="7" height="2" fill="#DCEBFF" />
          <rect x="3" y="10" width="2" height="4" fill="#93C5FD" />
          <rect x="3" y="14" width="7" height="2" fill="#818CF8" />

          {/* Right link outer dark outline */}
          <rect x="13" y="6" width="8" height="2" fill={S} />
          <rect x="13" y="16" width="8" height="2" fill={S} />
          <rect x="21" y="8" width="2" height="8" fill={S} />
          <rect x="12" y="8" width="2" height="3" fill={S} />
          <rect x="12" y="13" width="2" height="3" fill={S} />
          {/* Right link metallic body (hollow center at x=15..18, y=10..13) */}
          <rect x="14" y="8" width="7" height="2" fill="#DCEBFF" />
          <rect x="19" y="10" width="2" height="4" fill="#93C5FD" />
          <rect x="14" y="14" width="7" height="2" fill="#818CF8" />

          {/* Interlocking center bar bridging both hollow rings */}
          <rect x="7" y="10" width="10" height="4" fill={S} />
          <rect x="7" y="11" width="10" height="2" fill="#FFE58F" />
        </>
      )}
    </svg>
  );
}

/**
 * Tiny cute pastel pixel cat mascot perched on top window borders (inspired by reference image 1)
 */
export function PixelCatMascot({
  animate = true,
  className = '',
}: {
  animate?: boolean;
  className?: string;
}) {
  return (
    <svg
      width="34"
      height="26"
      viewBox="0 0 17 13"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animate ? 'animate-gentle-bob' : ''} pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <rect x="2" y="1" width="2" height="1" fill={S} />
      <rect x="7" y="1" width="2" height="1" fill={S} />
      <rect x="2" y="2" width="2" height="2" fill="#FDE2C8" />
      <rect x="7" y="2" width="2" height="2" fill="#FDE2C8" />
      <rect x="3" y="2" width="1" height="1" fill="#FFA6C9" />
      <rect x="7" y="2" width="1" height="1" fill="#FFA6C9" />
      <rect x="4" y="2" width="3" height="1" fill={S} />
      <rect x="2" y="3" width="7" height="4" fill="#FFF2E2" />
      <rect x="9" y="5" width="4" height="5" fill="#F5C9A6" />
      <rect x="4" y="7" width="8" height="4" fill="#FFF2E2" />
      <rect x="10" y="6" width="2" height="2" fill="#E3A87D" />
      <rect x="13" y="4" width="2" height="2" fill="#E3A87D" />
      <rect x="14" y="6" width="1" height="3" fill="#E3A87D" />
      <rect x="3" y="4" width="1" height="1" fill={S} />
      <rect x="7" y="4" width="1" height="1" fill={S} />
      <rect x="2" y="5" width="1" height="1" fill="#FFA6C9" />
      <rect x="8" y="5" width="1" height="1" fill="#FFA6C9" />
      <rect x="3" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="7" y="10" width="2" height="2" fill="#FFFFFF" />
      <rect x="1" y="2" width="1" height="5" fill={S} />
      <rect x="9" y="2" width="1" height="3" fill={S} />
      <rect x="10" y="4" width="3" height="1" fill={S} />
      <rect x="13" y="6" width="1" height="4" fill={S} />
      <rect x="3" y="11" width="9" height="1" fill={S} opacity="0.55" />
    </svg>
  );
}

/**
 * Tiny pastel pixel wings decoration (inspired by reference image 1)
 */
export function PixelWing({
  flip = false,
  animate = true,
  className = '',
}: {
  flip?: boolean;
  animate?: boolean;
  className?: string;
}) {
  return (
    <svg
      width="24"
      height="20"
      viewBox="0 0 12 10"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      className={`${animate ? 'animate-pixel-flap' : ''} pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <rect x="2" y="1" width="4" height="1" fill={S} />
      <rect x="1" y="2" width="1" height="4" fill={S} />
      <rect x="2" y="2" width="5" height="2" fill="#FFFFFF" />
      <rect x="2" y="4" width="7" height="2" fill="#F0F5FF" />
      <rect x="4" y="6" width="6" height="2" fill="#DCEBFF" />
      <rect x="6" y="8" width="4" height="1" fill="#B4C3FF" />
      <rect x="9" y="4" width="2" height="3" fill={S} opacity="0.45" />
    </svg>
  );
}

/**
 * 4-point pastel pixel star charm for window corners (inspired by reference image 2)
 */
export function PixelCornerStar({
  color = '#FFE58F',
  size = 16,
  animate = true,
  className = '',
}: {
  color?: string;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 9 9"
      fill="none"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animate ? 'animate-pixel-twinkle' : ''} pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="0" width="1" height="1" fill={S} />
      <rect x="4" y="8" width="1" height="1" fill={S} />
      <rect x="0" y="4" width="1" height="1" fill={S} />
      <rect x="8" y="4" width="1" height="1" fill={S} />
      <rect x="3" y="2" width="3" height="5" fill={color} />
      <rect x="2" y="3" width="5" height="3" fill={color} />
      <rect x="4" y="1" width="1" height="7" fill={color} />
      <rect x="1" y="4" width="7" height="1" fill={color} />
      <rect x="4" y="4" width="1" height="1" fill="#FFFFFF" />
    </svg>
  );
}

export function PixelGenderBadge({
  gender,
  showLabel = true,
  size = 15,
  className = '',
}: {
  gender: 'male' | 'female' | 'nonbinary';
  showLabel?: boolean;
  size?: number;
  className?: string;
}) {
  const meta =
    gender === 'female'
      ? {
          icon: 'gender_female' as const,
          label: 'หญิง',
          bg: 'bg-[#FCE7F3] dark:bg-[#5E1C43] border-[#EC4899]/60 dark:border-[#F472B6]/70 text-[#9D174D] dark:text-[#FBCFE8]',
        }
      : gender === 'male'
        ? {
            icon: 'gender_male' as const,
            label: 'ชาย',
            bg: 'bg-[#DBEAFE] dark:bg-[#1E3A8A] border-[#3B82F6]/60 dark:border-[#60A5FA]/70 text-[#1D4ED8] dark:text-[#BFDBFE]',
          }
        : {
            icon: 'gender_nonbinary' as const,
            label: 'นอนไบนารี',
            bg: 'bg-[#EDE9FE] dark:bg-[#4C1D95] border-[#8B5CF6]/60 dark:border-[#A78BFA]/70 text-[#6D28D9] dark:text-[#DDD6FE]',
          };

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border-2 text-[11px] font-display font-bold leading-none shrink-0 shadow-[0_1px_0_rgba(78,59,105,0.2)] ${meta.bg} ${className}`}
      title={`เพศ: ${meta.label}`}
      aria-label={`เพศ${meta.label}`}
    >
      <PixelIcon name={meta.icon} size={size} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
