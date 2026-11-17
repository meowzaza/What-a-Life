import {
  DEFAULT_SELF_CARE_ORDERS,
  RISK_PROFILE_META,
  SELF_CARE_ORDER_CONFIG,
  STANDING_ACTION_LABELS,
  STANDING_CONDITION_LABELS,
} from '../../data/autopilot';
import { UI_TEXT } from '../../data/uiText';
import { createDefaultStandingOrders } from '../../engine/autopilot';
import type {
  FamilyRemittanceMode,
  GameState,
  HealthCheckupPackage,
  PlayerAction,
  RiskProfile,
  SelfCareOrders,
  StandingActionKey,
  StandingOrders,
} from '../../engine/types';
import { PixelIcon } from '../art/PixelIcons';

interface StandingOrdersPanelProps {
  state: GameState;
  onDispatch: (action: PlayerAction) => void;
}

const RISK_OPTIONS: RiskProfile[] = ['cautious', 'balanced', 'bold'];
const ACTION_KEYS: StandingActionKey[] = [
  'save_reserve',
  'take_side_gig',
  'rest_priority',
  'decline_spend',
  'accept_if_safe',
  'ask_player',
];

export function StandingOrdersPanel({ state, onDispatch }: StandingOrdersPanelProps) {
  const orders: StandingOrders =
    state.standingOrders ?? createDefaultStandingOrders(state.character);

  const commit = (next: StandingOrders) => {
    onDispatch({ type: 'UPDATE_STANDING_ORDERS', orders: next });
  };

  const updateFinancial = (patch: Partial<StandingOrders['financial']>) => {
    commit({
      ...orders,
      financial: {
        ...orders.financial,
        ...patch,
      },
    });
  };

  const toggleRule = (ruleId: string) => {
    commit({
      ...orders,
      rules: orders.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    });
  };

  const changeRuleAction = (ruleId: string, actionKey: StandingActionKey) => {
    commit({
      ...orders,
      rules: orders.rules.map((r) => (r.id === ruleId ? { ...r, actionKey } : r)),
    });
  };

  const selfCare: SelfCareOrders = {
    ...DEFAULT_SELF_CARE_ORDERS,
    ...(orders.selfCare ?? {}),
    pausedByLowCash: { ...(orders.selfCare?.pausedByLowCash ?? {}) },
  };
  const age = state.character.ageYears;

  const updateSelfCare = (patch: Partial<SelfCareOrders>) => {
    commit({
      ...orders,
      selfCare: {
        ...selfCare,
        ...patch,
      },
    });
  };

  return (
    <div className="game-card p-4 space-y-4">
      {/* Header + Autopilot Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PixelIcon name="shield" size={18} />
          <div>
            <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
              ระบบตัวละครตัดสินใจเอง และคำสั่งประจำ
            </h3>
            <p className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
              กำหนดนโยบายให้ตัวละครตัดสินใจตามกฎ + นิสัย หรือหยุดถามคุณก่อนเมื่อไม่เข้าเงื่อนไข
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!state.character.isAlive}
          onClick={() => commit({ ...orders, autopilotEnabled: !orders.autopilotEnabled })}
          className={`game-btn px-3.5 py-2 text-xs font-display font-extrabold ${
            orders.autopilotEnabled
              ? 'bg-[#6EE7B7] text-[#165940]'
              : 'bg-[#FFE0EE] text-[#BD346B]'
          }`}
        >
          {orders.autopilotEnabled ? 'ตัดสินใจเอง: เปิดอยู่' : 'ตัดสินใจเอง: ปิด (ถามทุกครั้ง)'}
        </button>
      </div>

      {/* Risk Profile */}
      <div className="space-y-2">
        <div className="text-xs font-display font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
          ระดับความกล้าเสี่ยง
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {RISK_OPTIONS.map((rp) => {
            const meta = RISK_PROFILE_META[rp];
            const active = orders.riskProfile === rp;
            return (
              <button
                key={rp}
                type="button"
                disabled={!state.character.isAlive}
                onClick={() => commit({ ...orders, riskProfile: rp })}
                className={`game-btn text-left p-3 space-y-1 ${
                  active
                    ? 'bg-[#FFE58F] text-[#3D2D52]'
                    : 'bg-[#FFFDFB] dark:bg-[#221B3B] text-[#3D2D52] dark:text-[#FFF6FA]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 font-display font-bold text-xs">
                  <span>{meta.labelTh}</span>
                  {active && <PixelIcon name="check" size={14} />}
                </div>
                <p
                  className={`text-[11px] leading-snug ${
                    active ? 'text-[#3D2D52]/85' : 'text-[#76658D] dark:text-[#CBBFE3]'
                  }`}
                >
                  {meta.descriptionTh}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial Standing Policy */}
      <div className="px-inset p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-3">
        <div className="font-display font-bold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
          นโยบายการเงินอัตโนมัติ
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between font-semibold">
              <span>เป้าออมขั้นต่ำต่อเดือน</span>
              <span className="font-num font-bold text-[#167956] dark:text-[#7EF4C2]">
                {orders.financial.minSavingsRatePct}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={orders.financial.minSavingsRatePct}
              onChange={(e) => updateFinancial({ minSavingsRatePct: Number(e.target.value) })}
              className="w-full accent-[#6EE7B7] cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold">
              <span>เพดานเตือนเงินสดเหลือน้อย</span>
              <span className="font-num font-bold text-[#BD346B] dark:text-[#FFB8D4]">
                {orders.financial.lowCashThreshold.toLocaleString('th-TH')} ฿
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={20000}
              step={1000}
              value={orders.financial.lowCashThreshold}
              onChange={(e) => updateFinancial({ lowCashThreshold: Number(e.target.value) })}
              className="w-full accent-[#FF8DA8] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFinancial({ avoidDebt: !orders.financial.avoidDebt })}
            className={`game-btn px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 ${
              orders.financial.avoidDebt
                ? 'bg-[#D6FAEA] text-[#165940]'
                : 'bg-[#FFF0F6] dark:bg-[#352B59] text-[#76658D] dark:text-[#CBBFE3]'
            }`}
          >
            <PixelIcon name={orders.financial.avoidDebt ? 'check' : 'close'} size={12} />
            <span>เลี่ยงการก่อหนี้ใหม่</span>
          </button>

          <button
            type="button"
            onClick={() => updateFinancial({ strictBudget: !orders.financial.strictBudget })}
            className={`game-btn px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 ${
              orders.financial.strictBudget
                ? 'bg-[#FFE58F] text-[#3D2D52]'
                : 'bg-[#FFF0F6] dark:bg-[#352B59] text-[#76658D] dark:text-[#CBBFE3]'
            }`}
          >
            <PixelIcon name={orders.financial.strictBudget ? 'check' : 'close'} size={12} />
            <span>คุมงบเข้มงวด (ห้ามใช้จ่ายฟุ่มเฟือย)</span>
          </button>
        </div>
      </div>

      {/* If-Then Rules */}
      <div className="space-y-2">
        <div className="text-xs font-display font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
          กฎตั้งค่าล่วงหน้า (เปิด/ปิด และเลือกการตอบสนอง)
        </div>
        <div className="space-y-2">
          {orders.rules.map((rule) => (
            <div
              key={rule.id}
              className="px-inset p-3 bg-[#FFFDFB] dark:bg-[#221B3B] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  aria-label={`สลับกฎ ${rule.labelTh}`}
                  className={`game-btn w-9 h-9 shrink-0 flex items-center justify-center ${
                    rule.enabled
                      ? 'bg-[#6EE7B7] text-[#165940]'
                      : 'bg-[#FFF0F6] dark:bg-[#352B59] text-[#76658D]'
                  }`}
                >
                  <PixelIcon name={rule.enabled ? 'check' : 'close'} size={14} />
                </button>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
                    {STANDING_CONDITION_LABELS[rule.conditionKey]}
                  </div>
                  <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
                    {rule.labelTh}
                  </div>
                </div>
              </div>

              <select
                aria-label={`เลือกคำสั่งสำหรับ ${rule.labelTh}`}
                value={rule.actionKey}
                onChange={(e) => changeRuleAction(rule.id, e.target.value as StandingActionKey)}
                className="px-slot px-2.5 py-1.5 text-xs font-semibold bg-[#FFF8E6] dark:bg-[#352B59] text-[#3D2D52] dark:text-[#FFF6FA] shrink-0"
              >
                {ACTION_KEYS.map((ak) => (
                  <option key={ak} value={ak}>
                    {STANDING_ACTION_LABELS[ak]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 3.2.3: Self-Care & Family Remittance Autopilot */}
      <div className="px-inset p-3.5 bg-[#FFFDFB] dark:bg-[#221B3B] space-y-3">
        <div>
          <div className="font-display font-bold text-xs sm:text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
            {UI_TEXT.SELF_CARE_AUTOPILOT.sectionTitle}
          </div>
          <p className="text-[11px] text-[#76658D] dark:text-[#CBBFE3] mt-0.5">
            {UI_TEXT.SELF_CARE_AUTOPILOT.sectionSubtitle}
          </p>
        </div>

        {/* Annual Health Checkup (18+) */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
            <span>{UI_TEXT.SELF_CARE_AUTOPILOT.checkupLabel}</span>
            {selfCare.pausedByLowCash?.healthCheckup && (
              <span className="px-2 py-0.5 bg-[#FFE0EE] text-[#BD346B] border border-[#4E3B69]/40 text-[10px] font-bold">
                {UI_TEXT.SELF_CARE_AUTOPILOT.pausedLowCashBadge}
              </span>
            )}
          </div>
          {age < SELF_CARE_ORDER_CONFIG.healthCheckup.minAge ? (
            <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
              ล็อกสำหรับอายุ 18 ปีขึ้นไป (ตอนนี้อายุ {age} ปี)
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'off', label: UI_TEXT.SELF_CARE_AUTOPILOT.checkupOff },
                  { id: 'basic_500', label: UI_TEXT.SELF_CARE_AUTOPILOT.checkupBasic },
                  { id: 'private_3500', label: UI_TEXT.SELF_CARE_AUTOPILOT.checkupPrivate },
                ] as Array<{ id: HealthCheckupPackage; label: string }>
              ).map((opt) => {
                const active = selfCare.healthCheckupPackage === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!state.character.isAlive}
                    onClick={() => updateSelfCare({ healthCheckupPackage: opt.id })}
                    className={`game-btn px-2.5 py-2 text-left text-xs font-bold ${
                      active
                        ? 'bg-[#D6FAEA] text-[#165940]'
                        : 'bg-[#FFF0F6] dark:bg-[#2A2247] text-[#3D2D52] dark:text-[#FFF6FA]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Grooming (15+) */}
        <div className="pt-2 border-t border-dashed border-[#4E3B69]/20 dark:border-white/15 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
              <span>{UI_TEXT.SELF_CARE_AUTOPILOT.groomingLabel}</span>
              {selfCare.pausedByLowCash?.grooming && (
                <span className="px-2 py-0.5 bg-[#FFE0EE] text-[#BD346B] border border-[#4E3B69]/40 text-[10px] font-bold">
                  {UI_TEXT.SELF_CARE_AUTOPILOT.pausedLowCashBadge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
              {UI_TEXT.SELF_CARE_AUTOPILOT.groomingDesc}
            </p>
          </div>
          <button
            type="button"
            disabled={!state.character.isAlive || age < SELF_CARE_ORDER_CONFIG.groomingMonthly.minAge}
            onClick={() => updateSelfCare({ groomingMonthlyEnabled: !selfCare.groomingMonthlyEnabled })}
            className={`game-btn px-3 py-1.5 text-xs font-bold shrink-0 disabled:opacity-45 ${
              selfCare.groomingMonthlyEnabled
                ? 'bg-[#6EE7B7] text-[#165940]'
                : 'bg-[#FFF0F6] dark:bg-[#352B59] text-[#76658D] dark:text-[#CBBFE3]'
            }`}
          >
            {age < SELF_CARE_ORDER_CONFIG.groomingMonthly.minAge
              ? 'ล็อก (<15 ปี)'
              : selfCare.groomingMonthlyEnabled
                ? 'เปิดใช้งานอยู่'
                : 'ปิดไว้'}
          </button>
        </div>

        {/* Monthly Family Remittance (18+) */}
        <div className="pt-2 border-t border-dashed border-[#4E3B69]/20 dark:border-white/15 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-[#3D2D52] dark:text-[#FFF6FA]">
            <span>{UI_TEXT.SELF_CARE_AUTOPILOT.remittanceLabel}</span>
            {selfCare.pausedByLowCash?.familyRemittance && (
              <span className="px-2 py-0.5 bg-[#FFE0EE] text-[#BD346B] border border-[#4E3B69]/40 text-[10px] font-bold">
                {UI_TEXT.SELF_CARE_AUTOPILOT.pausedLowCashBadge}
              </span>
            )}
          </div>
          {age < SELF_CARE_ORDER_CONFIG.familyRemittance.minAge ? (
            <div className="text-[11px] text-[#76658D] dark:text-[#CBBFE3]">
              ล็อกสำหรับอายุ 18 ปีขึ้นไป (ตอนนี้อายุ {age} ปี)
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'off', label: UI_TEXT.SELF_CARE_AUTOPILOT.remittanceOff },
                  { id: 'pct_5', label: UI_TEXT.SELF_CARE_AUTOPILOT.remittance5 },
                  { id: 'pct_15', label: UI_TEXT.SELF_CARE_AUTOPILOT.remittance15 },
                ] as Array<{ id: FamilyRemittanceMode; label: string }>
              ).map((opt) => {
                const active = selfCare.familyRemittanceMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!state.character.isAlive}
                    onClick={() => updateSelfCare({ familyRemittanceMode: opt.id })}
                    className={`game-btn px-2 py-2 text-center text-xs font-bold ${
                      active
                        ? 'bg-[#FFE58F] text-[#3D2D52]'
                        : 'bg-[#FFF0F6] dark:bg-[#2A2247] text-[#3D2D52] dark:text-[#FFF6FA]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Manual test trigger for character decision dilemma */}
      {state.character.ageYears >= 15 && (
        <div className="pt-2 border-t-2 border-dashed border-[#4E3B69]/20 dark:border-white/15 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#76658D] dark:text-[#CBBFE3]">
            ทดสอบการตัดสินใจของตัวละครทันที:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!state.character.isAlive || state.needsPlayer}
              onClick={() =>
                onDispatch({ type: 'TRIGGER_AUTOPILOT_SITUATION', kind: 'payday_surplus' })
              }
              className="game-btn px-3 py-1.5 bg-[#EAE2FF] dark:bg-[#352B59] text-xs font-bold disabled:opacity-40"
            >
              ลองเหตุการณ์เงินเดือนออก
            </button>
            <button
              type="button"
              disabled={!state.character.isAlive || state.needsPlayer}
              onClick={() =>
                onDispatch({ type: 'TRIGGER_AUTOPILOT_SITUATION', kind: 'risky_windfall' })
              }
              className="game-btn px-3 py-1.5 bg-[#FFE3D3] dark:bg-[#5E3B2C] text-xs font-bold disabled:opacity-40"
            >
              จำลองเหตุการณ์วัดใจ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
