import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cleanDisplayReason, explain } from '../../engine/explain';
import { explainStat } from '../../engine/stats';
import type { GameState } from '../../engine/types';
import { RAW_STAT_DETAILS } from '../../data/thaiData';
import { UI_TEXT } from '../../data/uiText';
import { PixelCornerStar, PixelIcon } from '../art/PixelIcons';
import type { RawStatKey } from '../../engine/types';

interface ExplainPanelProps {
  state: GameState;
  targetKey: string | null;
  reduceFx: boolean;
  onClose: () => void;
}

function buildPlainSentences(
  targetKey: string,
  info: ReturnType<typeof explainStat>,
  state: GameState
): string[] {
  const sentences: string[] = [];
  const { character, economy } = state;

  if (targetKey === 'eco:cash') {
    if (character.ageYears < 15) {
      sentences.push('ตอนนี้ยังเป็นวัยเด็ก พ่อแม่ดูแลค่ากินค่าอยู่ให้หมด จึงยังไม่มีเงินสดส่วนตัว');
    } else if (economy.monthlySalary > 0) {
      sentences.push(
        `รายได้หลักมาจากงาน${economy.jobTitle} หักด้วยค่ากินอยู่และค่าที่พักทุกวันและทุกสิ้นเดือน`
      );
    } else {
      sentences.push('ตอนนี้ยังไม่มีเงินเดือนประจำ เงินสดส่วนใหญ่มาจากทางบ้านหรือจ๊อบเสริม');
    }
    if (economy.debt > 0) {
      sentences.push('ทุกสิ้นเดือนระบบจะตัดเงินไปผ่อนหนี้ขั้นต่ำโดยอัตโนมัติ');
    }
    return sentences;
  }

  if (targetKey === 'eco:debt') {
    if (economy.debt <= 0) {
      sentences.push('ยินดีด้วย! ตอนนี้คุณไม่มีหนี้ค้างชำระ ไม่ต้องเสียดอกเบี้ยรายเดือน');
    } else {
      sentences.push('หนี้สินมีดอกเบี้ยเดินทุกสิ้นเดือน ยิ่งโปะคืนเร็ว ดอกเบี้ยสะสมยิ่งน้อยลง');
    }
    return sentences;
  }

  if (targetKey.startsWith('trait:')) {
    sentences.push(info.formulaText);
    for (const c of info.components) {
      if (c.label.startsWith('หลักฐาน:') || c.label.startsWith('แนวทางฟื้นฟู')) {
        sentences.push(c.label);
      }
    }
    return sentences.slice(0, 3);
  }

  if (targetKey.startsWith('action_lock:')) {
    sentences.push(info.formulaText);
    if (info.components[0]?.label) {
      sentences.push(info.components[0].label);
    }
    return sentences.slice(0, 2);
  }

  if (targetKey === 'innerTension') {
    sentences.push(info.formulaText);
    for (const c of info.components.slice(0, 2)) {
      sentences.push(c.label);
    }
    return sentences.slice(0, 3);
  }

  if (targetKey.startsWith('raw:')) {
    const rawKey = targetKey.replace('raw:', '') as RawStatKey;
    const detail = RAW_STAT_DETAILS[rawKey];
    if (detail) {
      sentences.push(`เสริมดัชนีชีวิต: ${detail.indicesSupported.join(' และ ')}`);
      sentences.push(`เร่งอัตราการฝึกทักษะ: ${detail.skillsAccelerated.join(', ')}`);
      sentences.push(
        `การพัฒนาและปัจจัยเสื่อม: พยุงและเพิ่มได้จาก ${detail.lifestyleBoosts[0]} แต่อาจลดลงจาก ${detail.lifestyleDrains[0]}`
      );
      return sentences;
    }
  }

  const sorted = [...info.components].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );
  const topPos = sorted.find((c) => c.contribution > 0);
  const topNeg = sorted.find((c) => c.contribution < 0);

  if (topPos) {
    sentences.push(`แรงหนุนหลักตอนนี้มาจาก ${topPos.label}`);
  }
  if (topNeg) {
    sentences.push(`ตัวดึงคะแนนลงตอนนี้คือ ${topNeg.label}`);
  }
  if (info.recentLogs.length > 0) {
    const cleaned = cleanDisplayReason(info.recentLogs[0].reason) ?? info.recentLogs[0].reason;
    sentences.push(`เรื่องที่เพิ่งส่งผลล่าสุด: ${cleaned}`);
  }
  if (sentences.length === 0) {
    sentences.push('ค่านี้เปลี่ยนแปลงตามการใช้ชีวิต กิจวัตร และเหตุการณ์ในแต่ละวัน');
  }
  return sentences.slice(0, 3);
}

export function ExplainPanel({ state, targetKey, reduceFx, onClose }: ExplainPanelProps) {
  const [showFormula, setShowFormula] = useState(false);

  return (
    <AnimatePresence>
      {targetKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={UI_TEXT.EXPLAIN_STAT_HEADER}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1E1833]/65 backdrop-blur-xs p-0 sm:p-4"
          onClick={onClose}
        >
          {(() => {
            const isDayPlan = targetKey.startsWith('dayplan:');
            const isEvent = targetKey.startsWith('event:') || targetKey.startsWith('timeline:') || isDayPlan;
            const eventExplanation = isEvent ? explain(state, targetKey) : null;
            const info = !isEvent ? explainStat(state, targetKey) : null;
            const title = eventExplanation ? eventExplanation.titleTh : (info?.title ?? '');
            const plainBullets = eventExplanation
              ? eventExplanation.summaryBullets
              : buildPlainSentences(targetKey, info!, state);

            return (
              <motion.div
                initial={reduceFx ? { opacity: 1 } : { y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduceFx ? { opacity: 0 } : { y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="game-card w-full sm:max-w-lg overflow-hidden max-h-[85vh] flex flex-col"
              >
                {/* หัวหน้าต่าง Bottom Sheet */}
                <div className="bg-[#B4C3FF] dark:bg-[#4F5DA8] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-3 flex items-start justify-between gap-3 shrink-0">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FFFDFB]/85 dark:bg-[#221B3B]/80 border border-[#4E3B69]/60 dark:border-[#7662AC] text-[11px] font-bold text-[#3D2D52] dark:text-[#FFE58F]">
                      <PixelCornerStar size={11} animate={!reduceFx} />
                      <span>
                        {isDayPlan
                          ? UI_TEXT.EXPLAIN_SCENE_HEADER
                          : isEvent
                            ? UI_TEXT.EXPLAIN_EVENT_HEADER
                            : UI_TEXT.EXPLAIN_STAT_HEADER}
                      </span>
                    </div>
                    <h3 className="font-display font-extrabold text-base sm:text-lg leading-snug text-[#3D2D52] dark:text-[#FFF6FA] break-words">
                      {title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={UI_TEXT.EXPLAIN_CLOSE}
                    className="game-btn w-10 h-10 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] flex items-center justify-center shrink-0"
                  >
                    <PixelIcon name="close" size={18} />
                  </button>
                </div>

                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto px-window-striped">
                  {/* สรุปภาษาง่าย 2-3 ประโยค */}
                  <div className="px-inset p-4 space-y-2">
                    <ul className="space-y-2 text-sm text-[#3D2D52] dark:text-[#FFF6FA] leading-relaxed">
                      {plainBullets.map((line, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-2 h-2 bg-[#FF8DA8] border border-[#4E3B69] mt-2 shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ปุ่มเปิด/ปิดรายละเอียดเบื้องหลัง */}
                  <button
                    type="button"
                    onClick={() => setShowFormula((v) => !v)}
                    className="game-btn w-full px-4 py-2.5 bg-[#FFFDFB] dark:bg-[#352B59] flex items-center justify-between text-sm font-bold text-[#3D2D52] dark:text-[#FFF6FA]"
                  >
                    <span>
                      {isDayPlan
                        ? UI_TEXT.EXPLAIN_DETAILS_SCENE
                        : isEvent
                          ? UI_TEXT.EXPLAIN_DETAILS_EVENT
                          : UI_TEXT.EXPLAIN_DETAILS_STAT}
                    </span>
                    <PixelIcon name={showFormula ? 'chevron_up' : 'chevron_down'} size={16} />
                  </button>

                  {showFormula && (
                    <div className="space-y-3 pt-1">
                      {isEvent && eventExplanation ? (
                        <>
                          <div className="px-slot p-3 bg-[#FFF3BF] dark:bg-[#4A3A1B] text-xs text-[#3D2D52] dark:text-[#FFF6FA] leading-relaxed">
                            <div className="font-bold mb-1">{UI_TEXT.EXPLAIN_BACKSTORY}</div>
                            <div>{eventExplanation.causalStory}</div>
                          </div>
                          <div className="px-inset divide-y divide-[#4E3B69]/15 dark:divide-white/10 overflow-hidden">
                            {eventExplanation.formulaBreakdown.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between gap-3 px-3.5 py-2.5 text-xs bg-[#FFFDFB] dark:bg-[#2A2247]"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="font-semibold text-[#3D2D52] dark:text-[#FFF6FA] leading-snug">
                                    {item.label}
                                  </div>
                                  <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] font-num leading-snug">
                                    {item.value}
                                  </div>
                                </div>
                                <span className="font-bold text-[#167956] dark:text-[#7EF4C2] text-right max-w-[45%] leading-snug">
                                  {item.impact}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : info ? (
                        <>
                          <div className="px-slot p-3 bg-[#FFF3BF] dark:bg-[#4A3A1B] text-xs text-[#3D2D52] dark:text-[#FFF6FA] leading-relaxed">
                            <div className="font-bold mb-1">
                              ระดับตอนนี้:{' '}
                              <span className="font-num">{info.currentValue.toLocaleString('th-TH')}</span>
                            </div>
                            <div>{info.formulaText}</div>
                          </div>

                          <div className="px-inset divide-y divide-[#4E3B69]/15 dark:divide-white/10 overflow-hidden">
                            {info.components.map((comp, idx) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between gap-3 px-3.5 py-2.5 text-xs bg-[#FFFDFB] dark:bg-[#2A2247]"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="font-semibold text-[#3D2D52] dark:text-[#FFF6FA] leading-snug">
                                    {comp.label}
                                  </div>
                                  <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] font-num">
                                    ระดับพื้นฐาน: {comp.value.toLocaleString('th-TH')}
                                    {comp.weight ? ` (${comp.weight})` : ''}
                                  </div>
                                </div>
                                <span
                                  className={`font-bold font-num shrink-0 text-right ${
                                    comp.contribution > 0
                                      ? 'text-[#167956] dark:text-[#7EF4C2]'
                                      : comp.contribution < 0
                                        ? 'text-[#BD346B] dark:text-[#FFB8D4]'
                                        : 'text-[#76658D]'
                                  }`}
                                >
                                  {comp.contribution > 0
                                    ? `ช่วยหนุน +${comp.contribution}`
                                    : comp.contribution < 0
                                      ? `ดึงลง ${comp.contribution}`
                                      : 'ทรงตัว'}
                                </span>
                              </div>
                            ))}
                          </div>

                      {info.recentLogs.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-[#76658D] dark:text-[#CBBFE3]">
                            การเปลี่ยนแปลงล่าสุด
                          </div>
                          <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                            {info.recentLogs.map((log, idx) => (
                              <li
                                key={`${log.id}_${idx}`}
                                className="px-slot flex items-center justify-between gap-2 px-3 py-2 bg-[#FFFDFB] dark:bg-[#221B3B] text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold truncate">
                                    {cleanDisplayReason(log.reason) ?? log.reason}
                                  </div>
                                  <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] font-num">
                                    {log.dateLabel}
                                  </div>
                                </div>
                                <span
                                  className={`font-bold font-num shrink-0 ${
                                    log.delta > 0
                                      ? 'text-[#167956] dark:text-[#7EF4C2]'
                                      : 'text-[#BD346B] dark:text-[#FFB8D4]'
                                  }`}
                                >
                                  {log.delta > 0
                                    ? `+${log.delta.toLocaleString('th-TH')}`
                                    : log.delta.toLocaleString('th-TH')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </div>
      )}
    </AnimatePresence>
  );
}
