import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EDUCATION_LABELS } from '../../data/thaiData';
import { UI_TEXT } from '../../data/uiText';
import { getAppearanceStageLabel } from '../../engine/appearance';
import { resolveDaypart, resolveScene, SCENES_BY_ID, sceneImagePath } from '../../engine/scene';
import type { AppearanceStage, GameState, PendingEventPrompt } from '../../engine/types';
import { Avatar } from '../art/Avatar';
import { CharacterSprite } from '../art/CharacterSprite';
import { EffectChip, extractVisualEffectChips } from '../art/EffectChip';
import { EventArt } from '../art/EventArt';
import { PixelCornerStar, PixelIcon } from '../art/PixelIcons';

interface ChoiceCardProps {
  state: GameState;
  reduceFx: boolean;
  onSelectChoice: (promptId: string, choiceId: string) => void;
  onResolveAutopilot?: (situationId: string, optionId: string) => void;
  onAutopilotSkip?: (promptId: string) => void;
  onSelectExplain?: (targetKey: string) => void;
  onClearDigest?: () => void;
  onStartNewLife: () => void;
  onOpenSaveLoad: () => void;
}

function buildEndOfLifeHighlights(state: GameState): string[] {
  const { character, economy } = state;
  const highlights: string[] = [];

  highlights.push(
    `ประกอบอาชีพ${economy.jobTitle} (วุฒิ${EDUCATION_LABELS[character.education]})`
  );

  if (economy.cash >= 1000000) {
    highlights.push(`เก็บเงินสดทะลุ ${economy.cash.toLocaleString('th-TH')} บาท ก่อนอำลาโลก`);
  } else if (economy.debt > 0) {
    highlights.push(`ทิ้งภาระหนี้คงค้างไว้ ${economy.debt.toLocaleString('th-TH')} บาท`);
  } else {
    highlights.push(`จากไปแบบปลอดหนี้สิน เหลือเงินติดบัญชี ${economy.cash.toLocaleString('th-TH')} บาท`);
  }

  const entries = [
    { key: 'physical', label: 'ร่างกายแข็งแกร่งน่าอิจฉา', val: character.indices.physical },
    { key: 'mental', label: 'จิตใจนิ่งสงบรับมือดราม่าเก่ง', val: character.indices.mental },
    { key: 'social', label: 'คอนเนกชันแน่น มีคนรักใคร่', val: character.indices.social },
    { key: 'status', label: 'สร้างชื่อเสียงและสถานะทางสังคมไว้สูง', val: character.indices.status },
    { key: 'competence', label: 'ทักษะและความสามารถรอบตัวโดดเด่น', val: character.indices.competence },
  ].sort((a, b) => b.val - a.val);

  highlights.push(`จุดเด่นที่สุดของชีวิต: ${entries[0].label}`);
  return highlights;
}

interface StageSnapshot {
  stage: AppearanceStage;
  charId: string;
  ageYears: number;
}

function extractStageHistory(state: GameState): StageSnapshot[] {
  const seen = new Set<AppearanceStage>();
  const out: StageSnapshot[] = [];
  for (const entry of state.timeline) {
    if (entry.appearance && !seen.has(entry.appearance.stage)) {
      seen.add(entry.appearance.stage);
      out.push({
        stage: entry.appearance.stage,
        charId: entry.appearance.charId,
        ageYears: entry.ageYears,
      });
    }
  }
  return out;
}

function isDevModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.search.includes('dev') || window.location.search.includes('debug');
}

export function ChoiceCard({
  state,
  reduceFx,
  onSelectChoice,
  onResolveAutopilot,
  onAutopilotSkip,
  onSelectExplain,
  onClearDigest,
  onStartNewLife,
  onOpenSaveLoad,
}: ChoiceCardProps) {
  const [failedSceneKey, setFailedSceneKey] = useState<string | null>(null);
  const { pendingPrompt, pendingAutopilotSituation, lastDigest, character, economy } = state;

  // 1. การ์ดสรุปชีวิตตอนจบ
  if (!character.isAlive) {
    const highlights = buildEndOfLifeHighlights(state);
    const stageHistory = extractStageHistory(state);
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="สรุปชีวิตตอนจบ"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1833]/70 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={reduceFx ? { opacity: 1 } : { opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="game-card w-full max-w-md overflow-hidden my-auto"
        >
          <div className="bg-[#FFB8D2] dark:bg-[#8E4A6F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PixelCornerStar size={14} animate={!reduceFx} />
              <span className="font-display font-extrabold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                จบตำนานหนึ่งชีวิต
              </span>
            </div>
            <span className="text-[11px] font-bold font-num px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#352B59] border-2 border-[#4E3B69] dark:border-[#7662AC] text-[#3D2D52] dark:text-[#FFF6FA]">
              #{state.seed}
            </span>
          </div>

          <div className="p-5 space-y-4 px-window-striped">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Avatar
                  seed={state.seed}
                  gender={character.gender}
                  ageYears={character.ageYears}
                  mentalIndex={character.indices.mental}
                  jobId={economy.jobId}
                  appearanceId={character.appearance?.charId}
                  size={96}
                />
              </div>
              <h2 className="font-display font-extrabold text-xl text-[#3D2D52] dark:text-[#FFF6FA]">
                {character.firstName} {character.lastName} ({character.nickname})
              </h2>
              <p className="text-sm font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                อายุ {character.ageYears} ปี · {character.causeOfDeath ?? 'สิ้นสุดอายุขัย'}
              </p>
            </div>

            {stageHistory.length > 0 && (
              <div className="px-inset p-3 space-y-2">
                <div className="text-xs font-bold text-[#76658D] dark:text-[#CBBFE3] text-center">
                  ภาพพัฒนาการตามช่วงวัย
                </div>
                <div className="flex items-end justify-center gap-3 overflow-x-auto pt-1 pb-1">
                  {stageHistory.map((item) => (
                    <div key={item.stage} className="flex flex-col items-center gap-1 shrink-0">
                      <div className="flex items-end justify-center min-h-[76px] border-b-2 border-[#4E3B69]/25 dark:border-white/20 px-1.5">
                        <CharacterSprite
                          charId={item.charId}
                          mode="full"
                          size={74}
                          seed={state.seed}
                          gender={character.gender}
                          ageYears={item.ageYears}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                        {getAppearanceStageLabel(item.stage)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-inset p-4 space-y-2 border-t-2 border-dashed border-[#4E3B69]/25">
              <div className="text-xs font-bold text-[#76658D] dark:text-[#CBBFE3]">
                ไฮไลต์ 3 อย่างของชีวิตนี้
              </div>
              <ul className="space-y-1.5 text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#FFE58F] text-[#3D2D52] border-2 border-[#4E3B69] text-xs font-bold font-num flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onStartNewLife}
                className="game-btn w-full px-4 py-3 bg-[#FF8DA8] text-[#3D2D52] font-display font-extrabold text-base inline-flex items-center justify-center gap-2"
              >
                <PixelIcon name="reroll" size={18} />
                <span>เล่นชีวิตใหม่</span>
              </button>
              <button
                type="button"
                onClick={onOpenSaveLoad}
                className="game-btn w-full px-4 py-3 bg-[#FFFDFB] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] font-display font-bold text-base inline-flex items-center justify-center gap-2"
              >
                <PixelIcon name="folder" size={18} />
                <span>โหลดเซฟเดิม</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. การ์ดเหตุการณ์รอตัดสินใจหลัก (Prompt T2 / T3)
  if (pendingPrompt) {
    const isT3 = pendingPrompt.tier === 'T3';
    const resolvedSceneId = resolveScene(state, {
      sceneId: pendingPrompt.sceneId,
      sceneTag: pendingPrompt.sceneTag,
    });
    const daypart = resolveDaypart(state);
    const sceneUrl = sceneImagePath(resolvedSceneId, daypart);
    const sceneMeta = SCENES_BY_ID.get(resolvedSceneId);
    const sceneKey = `${pendingPrompt.id}:${resolvedSceneId}:${daypart}`;
    const showSceneImage = Boolean(sceneUrl) && failedSceneKey !== sceneKey;
    const daysLeft =
      pendingPrompt.deadlineDay !== undefined
        ? Math.max(1, pendingPrompt.deadlineDay - state.date.totalDays)
        : null;
    const explainTarget = pendingPrompt.storyletId
      ? `event:${pendingPrompt.storyletId}`
      : `timeline:${pendingPrompt.id}`;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={pendingPrompt.title}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1833]/65 backdrop-blur-xs overflow-y-auto"
      >
        <AnimatePresence>
          <motion.div
            key={pendingPrompt.id}
            initial={reduceFx ? { opacity: 1 } : { opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceFx ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="game-card w-full max-w-md overflow-hidden my-auto"
          >
            {/* แถบหัวหน้าต่างเหตุการณ์ */}
            <div
              className={`border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2 flex items-center justify-between gap-2 ${
                isT3
                  ? 'bg-[#FF9EBF] dark:bg-[#8E4A6F]'
                  : 'bg-[#FFE58F] dark:bg-[#7A5B1F]'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <PixelCornerStar size={13} animate={!reduceFx} />
                <span className="text-sm font-display font-extrabold text-[#3D2D52] dark:text-[#FFF6FA] shrink-0">
                  {isT3 ? UI_TEXT.TURNING_POINT_HEADER : UI_TEXT.DECISION_HEADER}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFFDFB]/85 dark:bg-[#221B3B]/80 text-[#3D2D52] dark:text-[#FFF6FA] border border-[#4E3B69]/50 truncate">
                  {UI_TEXT.CATEGORIES[pendingPrompt.category] ?? 'ชีวิต'}
                </span>
                {isDevModeActive() && pendingPrompt.tier && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold font-num bg-[#FFFDFB] text-[#3D2D52] border border-[#4E3B69] shrink-0">
                    {pendingPrompt.tier}
                  </span>
                )}
                {pendingPrompt.isTwist && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#EAE2FF] text-[#663FB5] border border-[#4E3B69] shrink-0">
                    {UI_TEXT.TWIST_TAG}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold font-num px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA] border-2 border-[#4E3B69] shrink-0">
                อายุ {character.ageYears} ปี
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 px-window-striped">
              {showSceneImage ? (
                <div className="relative w-full aspect-video border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#221B3B] overflow-hidden">
                  <img
                    src={sceneUrl}
                    alt={sceneMeta?.nameTh ?? 'ฉากเหตุการณ์'}
                    onError={() => setFailedSceneKey(sceneKey)}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {sceneMeta?.nameTh && (
                    <div className="px-2 py-0.5 bg-[#FFFDFB]/90 dark:bg-[#221B3B]/90 border-t-2 border-r-2 border-[#4E3B69] dark:border-[#7662AC] text-[11px] font-bold text-[#3D2D52] dark:text-[#FFF6FA] inline-block absolute bottom-0 left-0">
                      {sceneMeta.nameTh}
                    </div>
                  )}
                </div>
              ) : (
                <EventArt category={pendingPrompt.category} />
              )}

              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display font-extrabold text-xl text-[#3D2D52] dark:text-[#FFF6FA] leading-snug">
                    {pendingPrompt.title}
                  </h2>
                </div>
                <p className="text-sm sm:text-[15px] text-[#5A4773] dark:text-[#DDD6FE] leading-relaxed">
                  {pendingPrompt.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {!isT3 && daysLeft !== null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-num text-[#76658D] dark:text-[#CBBFE3]">
                      <PixelIcon name="clock" size={13} />
                      <span>{UI_TEXT.DAYS_LEFT_HINT(daysLeft)}</span>
                    </span>
                  )}
                  {onSelectExplain && (
                    <button
                      type="button"
                      onClick={() => onSelectExplain(explainTarget)}
                      className="text-xs font-bold px-2.5 py-1 bg-[#DCEBFF] dark:bg-[#28488E]/75 text-[#2559B8] dark:text-[#B8D8FE] border-2 border-[#4E3B69] dark:border-[#7662AC] hover:brightness-95"
                    >
                      {UI_TEXT.EXPLAIN_BUTTON}
                    </button>
                  )}
                </div>
              </div>

              {character.isMinor && (
                <div className="px-slot flex items-center gap-2 px-3 py-2 bg-[#DCEBFF] dark:bg-[#28488E]/60 text-xs font-semibold text-[#2559B8] dark:text-[#B8D8FE]">
                  <PixelIcon name="shield" size={18} />
                  <span>{UI_TEXT.MINOR_CHOICE_SHIELD}</span>
                </div>
              )}

              {/* ทางเลือก */}
              <div className="border-t-2 border-dashed border-[#4E3B69]/25 dark:border-[#7662AC]/45 pt-3 space-y-2.5">
                {pendingPrompt.choices.map((choice) => {
                  const chips = extractVisualEffectChips(choice.effects);
                  const isDisabled = Boolean(choice.disabled);
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => onSelectChoice(pendingPrompt.id, choice.id)}
                      className={`game-btn w-full text-left px-4 py-3 space-y-2 ${
                        isDisabled
                          ? 'bg-[#EAE6F3] dark:bg-[#262040] opacity-65 cursor-not-allowed'
                          : 'bg-[#FFFDFB] dark:bg-[#352B59] hover:bg-[#FFF0F6] dark:hover:bg-[#41356B]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-display font-bold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                          {choice.label}
                        </div>
                        {choice.costCash && choice.costCash > 0 ? (
                          <span className="text-xs font-bold font-num px-2 py-0.5 bg-[#FFF3BF] text-[#9A6708] border border-[#4E3B69] shrink-0">
                            -{choice.costCash.toLocaleString('th-TH')} ฿
                          </span>
                        ) : null}
                      </div>
                      {choice.hint && (
                        <div className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
                          {choice.hint}
                        </div>
                      )}
                      {isDisabled && choice.disabledReason && (
                        <div className="text-xs font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                          {choice.disabledReason}
                        </div>
                      )}
                      {chips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {chips.map((c, idx) => (
                            <EffectChip
                              key={`${c.kind}-${c.direction}-${idx}`}
                              kind={c.kind}
                              label={c.label}
                              direction={c.direction}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ปุ่มให้ตัวละครตัดสินใจเอง (เฉพาะ T2; T3 บังคับตัดสินใจเอง) */}
              {!isT3 && onAutopilotSkip ? (
                <button
                  type="button"
                  onClick={() => onAutopilotSkip(pendingPrompt.id)}
                  className="game-btn w-full px-3 py-2 bg-[#F4F0FF] dark:bg-[#2A2247] text-xs font-bold text-[#5A4773] dark:text-[#DDD6FE] inline-flex items-center justify-center gap-1.5"
                >
                  <PixelIcon name="lightning" size={14} />
                  <span>{UI_TEXT.AUTOPILOT_SKIP_BTN}</span>
                </button>
              ) : isT3 ? (
                <div className="text-center text-[11px] font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                  {UI_TEXT.T3_SPEED_NOTICE}
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // 3. การ์ดสถานการณ์ที่ตัวละครตัดสินใจเองหยุดถามผู้เล่น (ผสานเป็นโครงสร้างมาตรฐานเดียวกับการ์ดหลัก)
  if (pendingAutopilotSituation && onResolveAutopilot) {
    const sitCategory = pendingAutopilotSituation.kind === 'low_cash' || pendingAutopilotSituation.kind === 'payday_temptation' || pendingAutopilotSituation.kind === 'risky_windfall' ? 'finance' : 'work';
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={pendingAutopilotSituation.title}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1833]/65 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          key={pendingAutopilotSituation.id}
          initial={reduceFx ? { opacity: 1 } : { opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="game-card w-full max-w-md overflow-hidden my-auto"
        >
          {/* หัวหน้าต่างสีเหลือง "ตัดสินใจ" มาตรฐานเดียวกับ T2 */}
          <div className="bg-[#FFE58F] dark:bg-[#7A5B1F] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <PixelCornerStar size={13} animate={!reduceFx} />
              <span className="text-sm font-display font-extrabold text-[#3D2D52] dark:text-[#FFF6FA] shrink-0">
                {UI_TEXT.DECISION_HEADER}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFFDFB]/85 dark:bg-[#221B3B]/80 text-[#3D2D52] dark:text-[#FFF6FA] border border-[#4E3B69]/50 truncate">
                {UI_TEXT.CATEGORIES[sitCategory] ?? 'การเงิน'}
              </span>
              {isDevModeActive() && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold font-num bg-[#FFFDFB] text-[#3D2D52] border border-[#4E3B69] shrink-0">
                  ถามผู้เล่น
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold font-num px-2 py-0.5 bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA] border-2 border-[#4E3B69] shrink-0">
              อายุ {character.ageYears} ปี
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-3.5 px-window-striped">
            <EventArt category={sitCategory} />

            {/* ประโยคชี้แจงเหตุผลที่หยุดถามคุณ */}
            <div className="px-slot px-3 py-2 bg-[#FFF3BF] dark:bg-[#4A3A1B] text-xs font-semibold text-[#5A3F73] dark:text-[#FDE68A]">
              {UI_TEXT.AUTOPILOT_SITUATION_SUBTITLE}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display font-extrabold text-xl text-[#3D2D52] dark:text-[#FFF6FA] leading-snug">
                {pendingAutopilotSituation.title}
              </h2>
              <p className="text-sm sm:text-[15px] text-[#5A4773] dark:text-[#DDD6FE] leading-relaxed">
                {pendingAutopilotSituation.description}
              </p>
              {onSelectExplain && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectExplain(`autopilot:${pendingAutopilotSituation.id}`)}
                    className="text-xs font-bold px-2.5 py-1 bg-[#DCEBFF] dark:bg-[#28488E]/75 text-[#2559B8] dark:text-[#B8D8FE] border-2 border-[#4E3B69] dark:border-[#7662AC] hover:brightness-95"
                  >
                    {UI_TEXT.EXPLAIN_BUTTON}
                  </button>
                </div>
              )}
            </div>

            {/* ทางเลือก */}
            <div className="border-t-2 border-dashed border-[#4E3B69]/25 dark:border-[#7662AC]/45 pt-3 space-y-2.5">
              {pendingAutopilotSituation.options.map((opt) => {
                const chips = extractVisualEffectChips(opt.effects);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onResolveAutopilot(pendingAutopilotSituation.id, opt.id)}
                    className="game-btn w-full text-left px-4 py-3 bg-[#FFFDFB] dark:bg-[#352B59] hover:bg-[#FFF0F6] dark:hover:bg-[#41356B] space-y-2"
                  >
                    <div className="font-display font-bold text-sm sm:text-base text-[#3D2D52] dark:text-[#FFF6FA]">
                      {opt.label}
                    </div>
                    {opt.hint && (
                      <div className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
                        {opt.hint}
                      </div>
                    )}
                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {chips.map((c, idx) => (
                          <EffectChip
                            key={`${c.kind}-${c.direction}-${idx}`}
                            kind={c.kind}
                            label={c.label}
                            direction={c.direction}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. การ์ดสรุปช่วงที่ผ่านมา (Period Digest)
  if (lastDigest && onClearDigest) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lastDigest.title}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1833]/55 backdrop-blur-xs overflow-y-auto"
        onClick={onClearDigest}
      >
        <motion.div
          initial={reduceFx ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="game-card w-full max-w-md overflow-hidden my-auto"
        >
          <div className="bg-[#D6FAEA] dark:bg-[#194736] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PixelIcon name="sparkle" size={16} />
              <span className="font-display font-extrabold text-sm text-[#165940] dark:text-[#7EF4C2]">
                {UI_TEXT.DIGEST_HEADER}
              </span>
            </div>
            <span className="text-[11px] font-bold font-num px-2 py-0.5 bg-[#FFFDFB] text-[#3D2D52] border-2 border-[#4E3B69]">
              +{lastDigest.daysElapsed} วัน
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-3 px-window-striped">
            <div className="px-inset p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-2 text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
              {lastDigest.summaryLines.map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-[#6EE7B7] border border-[#4E3B69] mt-1.5 shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            {lastDigest.newTraits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {lastDigest.newTraits.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-[#FFE58F] text-[#3D2D52] border-2 border-[#4E3B69] text-xs font-bold"
                  >
                    {UI_TEXT.RESOURCES.traits}: {t}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onClearDigest}
              className="game-btn w-full px-4 py-2.5 bg-[#6EE7B7] text-[#165940] font-display font-extrabold text-sm"
            >
              {UI_TEXT.DIGEST_CLOSE_BUTTON}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
