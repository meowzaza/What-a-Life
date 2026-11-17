import { useState } from 'react';
import { HOUSINGS } from '../../../data/thaiData';
import { checkHousingEligibility } from '../../../engine/economy';
import type { GameState, HousingId, PlayerAction } from '../../../engine/types';
import { PixelIcon } from '../../art/PixelIcons';

interface FinanceTabProps {
  state: GameState;
  onDispatch: (action: PlayerAction) => void;
  onSelectExplain: (key: string) => void;
}

const HOUSING_IDS: HousingId[] = ['parents_home', 'cheap_room', 'townhouse_rent', 'condo'];

export function FinanceTab({ state, onDispatch, onSelectExplain }: FinanceTabProps) {
  const { character, economy } = state;
  const [borrowAmt, setBorrowAmt] = useState('5000');
  const [repayAmt, setRepayAmt] = useState('5000');

  const netEstimated = economy.monthlySalary + economy.monthlySideIncome - economy.monthlyExpenses;
  const isChild = character.ageYears < 15;
  const isMinor = character.ageYears < 18;

  return (
    <div className="space-y-4">
      {/* สรุปกระเป๋าเงิน */}
      <div className="game-card overflow-hidden">
        <div className="bg-[#FFE58F] dark:bg-[#8F7230] border-b-2 border-[#4E3B69] dark:border-[#7662AC] px-4 py-2.5 flex items-center gap-2">
          <PixelIcon name="coin" size={20} />
          <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
            กระเป๋าเงินและรายรับ-รายจ่าย
          </h3>
        </div>

        <div className="p-4 space-y-3 px-window-striped">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onSelectExplain('eco:cash')}
              className="game-btn text-left p-3 bg-[#FFFDFB] dark:bg-[#221B3B]"
            >
              <span className="text-xs text-[#76658D] dark:text-[#CBBFE3] block">เงินสดตอนนี้</span>
              <span className="text-base font-display font-bold font-num">
                {economy.cash.toLocaleString('th-TH')} ฿
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectExplain('eco:debt')}
              className="game-btn text-left p-3 bg-[#FFFDFB] dark:bg-[#221B3B]"
            >
              <span className="text-xs text-[#76658D] dark:text-[#CBBFE3] block">หนี้คงค้าง</span>
              <span
                className={`text-base font-display font-bold font-num ${
                  economy.debt > 0
                    ? 'text-[#BD346B] dark:text-[#FFB8D4]'
                    : 'text-[#167956] dark:text-[#7EF4C2]'
                }`}
              >
                {economy.debt.toLocaleString('th-TH')} ฿
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectExplain('eco:creditScore')}
              className="game-btn text-left p-3 bg-[#FFFDFB] dark:bg-[#221B3B]"
            >
              <span className="text-xs text-[#76658D] dark:text-[#CBBFE3] block">เครดิตการเงิน</span>
              <span className="text-base font-display font-bold font-num">
                {economy.creditScore} / 900
              </span>
            </button>

            <div className="px-inset p-3">
              <span className="text-xs text-[#76658D] dark:text-[#CBBFE3] block">สุทธิประมาณ/เดือน</span>
              <span
                className={`text-base font-display font-bold font-num ${
                  netEstimated >= 0
                    ? 'text-[#167956] dark:text-[#7EF4C2]'
                    : 'text-[#BD346B] dark:text-[#FFB8D4]'
                }`}
              >
                {netEstimated >= 0 ? '+' : ''}
                {netEstimated.toLocaleString('th-TH')} ฿
              </span>
            </div>
          </div>

          <div className="text-xs text-[#76658D] dark:text-[#CBBFE3] font-num flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <span>เงินเดือน: {economy.monthlySalary.toLocaleString('th-TH')} ฿</span>
            <span>จ๊อบเสริมเดือนนี้: {economy.monthlySideIncome.toLocaleString('th-TH')} ฿</span>
            <span>รายจ่ายประเมิน: {economy.monthlyExpenses.toLocaleString('th-TH')} ฿/ด.</span>
          </div>
        </div>
      </div>

      {/* สินเชื่อและปลดหนี้ */}
      <div className="game-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PixelIcon name="bank" size={18} />
            <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
              กู้เงินและจ่ายหนี้
            </h3>
          </div>
          <span className="text-xs font-num font-semibold text-[#76658D] dark:text-[#CBBFE3]">
            {isMinor ? 'กู้ได้เมื่ออายุ 18 ปีขึ้นไป' : `กู้เพิ่มได้ ${economy.creditLimit.toLocaleString('th-TH')} ฿`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="px-inset p-3 space-y-2">
            <label className="text-xs font-bold block">กู้เงินด่วน (บาท)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={500}
                step={500}
                value={borrowAmt}
                disabled={isMinor}
                onChange={(e) => setBorrowAmt(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm font-num disabled:opacity-40"
              />
              <button
                type="button"
                disabled={!character.isAlive || isMinor || economy.creditLimit <= 0}
                onClick={() => onDispatch({ type: 'BORROW_MONEY', amount: Number(borrowAmt) || 0 })}
                className="game-btn px-4 text-xs font-display font-extrabold bg-[#4E3B69] text-white disabled:opacity-40 shrink-0"
              >
                กู้
              </button>
            </div>
          </div>

          <div className="px-inset p-3 space-y-2">
            <label className="text-xs font-bold block">โปะคืนหนี้ (บาท)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={500}
                step={500}
                value={repayAmt}
                onChange={(e) => setRepayAmt(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#4E3B69] dark:border-[#7662AC] bg-[#FFFDFB] dark:bg-[#2A2247] text-sm font-num"
              />
              <button
                type="button"
                disabled={!character.isAlive || economy.debt <= 0 || economy.cash <= 0}
                onClick={() => onDispatch({ type: 'REPAY_DEBT', amount: Number(repayAmt) || 0 })}
                className="game-btn px-4 text-xs font-display font-extrabold bg-[#6EE7B7] text-[#165940] disabled:opacity-40 shrink-0"
              >
                จ่ายหนี้
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ที่อยู่อาศัย */}
      <div className="game-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PixelIcon name="home" size={18} />
            <h3 className="font-display font-extrabold text-base text-[#3D2D52] dark:text-[#FFF6FA]">
              ที่อยู่อาศัย
            </h3>
          </div>
          {isChild && (
            <span className="text-xs font-bold text-[#BD346B] dark:text-[#FFB8D4]">
              ย้ายบ้านเองได้เมื่ออายุ 15 ปี
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {HOUSING_IDS.map((hId) => {
            const h = HOUSINGS[hId];
            const isCurrent = economy.housingId === hId;
            const check = checkHousingEligibility(economy, hId);
            const disabled = isCurrent || !check.allowed || !character.isAlive || isChild;

            return (
              <div
                key={hId}
                className={`p-3.5 space-y-2 ${
                  isCurrent
                    ? 'px-slot bg-[#FFF3BF] dark:bg-[#4A3A1B]'
                    : 'px-inset bg-[#FFFDFB] dark:bg-[#221B3B]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-bold text-sm text-[#3D2D52] dark:text-[#FFF6FA]">
                      {h.name}
                    </div>
                    <div className="text-xs text-[#76658D] dark:text-[#CBBFE3] font-num">
                      {h.monthlyRent.toLocaleString('th-TH')} ฿/ด. · ฟื้นพลัง +{h.energyRecoveryPerDay}/วัน
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onDispatch({ type: 'CHANGE_HOUSING', housingId: hId })}
                    className={`game-btn px-3 text-xs font-display font-extrabold shrink-0 ${
                      isCurrent
                        ? 'bg-[#FFE58F] text-[#3D2D52]'
                        : !disabled
                          ? 'bg-[#FF8DA8] text-[#3D2D52]'
                          : 'bg-[#FFFDFB]/60 dark:bg-[#2A2247] text-[#76658D] opacity-50'
                    }`}
                  >
                    {isCurrent ? 'อยู่ตอนนี้' : 'ย้ายเข้า'}
                  </button>
                </div>
                <p className="text-xs text-[#5A4773] dark:text-[#DDD6FE]">{h.description}</p>
                {!isCurrent && !check.allowed && (
                  <p className="text-xs font-semibold text-[#BD346B] dark:text-[#FFB8D4]">
                    {check.reasons.join(' · ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
