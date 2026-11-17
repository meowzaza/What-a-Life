import type { Effect } from '../../engine/types';
import { STROKE_COLOR } from '../theme';
import { PixelIcon } from './PixelIcons';

interface EffectChipProps {
  label: string;
  direction: 'up' | 'down' | 'pending';
  kind: 'money' | 'energy' | 'stress' | 'stat' | 'echo';
}

export function extractVisualEffectChips(effects: Effect[]): EffectChipProps[] {
  const chips: EffectChipProps[] = [];

  for (const eff of effects) {
    if (eff.type === 'AddMoney' || eff.type === 'ChangeMoney') {
      chips.push({
        kind: 'money',
        label: 'เงินสด',
        direction: eff.amount >= 0 ? 'up' : 'down',
      });
    } else if (eff.type === 'AddDebt') {
      chips.push({
        kind: 'money',
        label: 'หนี้สิน',
        direction: 'up',
      });
    } else if (eff.type === 'RepayDebt') {
      chips.push({
        kind: 'money',
        label: 'หนี้สิน',
        direction: 'down',
      });
    } else if (eff.type === 'ChangeResource') {
      if (eff.resource === 'energy') {
        chips.push({
          kind: 'energy',
          label: 'พลังงาน',
          direction: eff.delta >= 0 ? 'up' : 'down',
        });
      } else if (eff.resource === 'stress') {
        chips.push({
          kind: 'stress',
          label: 'ความเครียด',
          direction: eff.delta >= 0 ? 'up' : 'down',
        });
      }
    } else if (eff.type === 'ChangeStat') {
      if (eff.stat === 'energy') {
        chips.push({
          kind: 'energy',
          label: 'พลังงาน',
          direction: eff.delta >= 0 ? 'up' : 'down',
        });
      } else if (eff.stat === 'stress') {
        chips.push({
          kind: 'stress',
          label: 'ความเครียด',
          direction: eff.delta >= 0 ? 'up' : 'down',
        });
      } else {
        chips.push({
          kind: 'stat',
          label: 'สถานะ/ทักษะ',
          direction: eff.delta >= 0 ? 'up' : 'down',
        });
      }
    } else if (eff.type === 'ChangeRawStat' || eff.type === 'ChangeSkill' || eff.type === 'AdjustPersonality') {
      chips.push({
        kind: 'stat',
        label: eff.type === 'ChangeSkill' ? 'ทักษะ' : 'บุคลิก/ใจ',
        direction: eff.delta >= 0 ? 'up' : 'down',
      });
    } else if (eff.type === 'ApplyTurningPoint' || eff.type === 'AddTrait' || eff.type === 'RevealTrait') {
      chips.push({
        kind: 'echo',
        label: 'เปลี่ยนนิสัย/จุดเปลี่ยน',
        direction: 'pending',
      });
    } else if (eff.type === 'ScheduleEcho') {
      chips.push({
        kind: 'echo',
        label: 'มีผลตามมาภายหลัง',
        direction: 'pending',
      });
    } else if (eff.type === 'StartScene') {
      const days = eff.durationDays;
      const label =
        eff.sceneId === 'hospital'
          ? days
            ? `พักโรงพยาบาล ${days} วัน`
            : 'เข้ารักษาที่โรงพยาบาล'
          : days
            ? `เปลี่ยนสถานที่ ${days} วัน`
            : 'เปลี่ยนสถานที่ชั่วคราว';
      chips.push({
        kind: 'echo',
        label,
        direction: 'pending',
      });
    } else if (eff.type === 'SetAnnualFocus') {
      chips.push({
        kind: 'echo',
        label: 'ตั้งเป้าหมายประจำปี',
        direction: 'pending',
      });
    }
  }

  const seen = new Set<string>();
  return chips.filter((c) => {
    const k = `${c.kind}:${c.label}:${c.direction}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function EffectChip({ label, direction, kind }: EffectChipProps) {
  const isGood =
    direction === 'pending'
      ? null
      : kind === 'stress' || label === 'หนี้สิน'
        ? direction === 'down'
          : direction === 'up';

  const bgClass =
    isGood === null
      ? 'bg-[#EAE2FF] dark:bg-[#4F358D]/70 text-[#5B35A6] dark:text-[#DDD2FE]'
      : isGood
        ? 'bg-[#D6FAEA] dark:bg-[#1E533F]/70 text-[#167956] dark:text-[#A7F3D0]'
        : 'bg-[#FFE0EE] dark:bg-[#7A2B4E]/70 text-[#B02A60] dark:text-[#FFB8D4]';

  const iconName =
    kind === 'money'
      ? 'coin'
      : kind === 'energy'
        ? 'lightning'
        : kind === 'echo'
          ? 'clock'
          : 'heart';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-[#4E3B69] dark:border-[#7662AC] text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${bgClass}`}
    >
      <PixelIcon name={iconName} size={13} />
      <span>{label}</span>
      {direction !== 'pending' && (
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {direction === 'up' ? (
            <>
              <rect x="3" y="1" width="2" height="2" fill="currentColor" />
              <rect x="2" y="3" width="4" height="2" fill="currentColor" />
              <rect x="1" y="5" width="6" height="2" fill="currentColor" stroke={STROKE_COLOR} strokeWidth="0" />
            </>
          ) : (
            <>
              <rect x="1" y="1" width="6" height="2" fill="currentColor" />
              <rect x="2" y="3" width="4" height="2" fill="currentColor" />
              <rect x="3" y="5" width="2" height="2" fill="currentColor" />
            </>
          )}
        </svg>
      )}
    </span>
  );
}
