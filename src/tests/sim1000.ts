import { stepOneTick } from '../engine/pipeline';
import { createInitialGameState } from '../engine/state';

function runHeadlessSim(totalLives = 1000) {
  const startMs = Date.now();
  let sumDeathAge = 0;
  let minAge = 999;
  let maxAge = 0;
  let sumFinalCash = 0;
  let sumFinalDebt = 0;
  const finalCashList: number[] = [];
  const causeCounts: Record<string, number> = {};
  const wealthCounts: Record<string, number> = {};

  for (let i = 0; i < totalLives; i++) {
    let state = createInitialGameState({
      mode: 'random',
      seed: 100000 + i * 7919,
    });

    const wTier = state.character.background.familyWealth;
    wealthCounts[wTier] = (wealthCounts[wTier] ?? 0) + 1;

    // Max safety cap: 115 years (42,000 days)
    let ticks = 0;
    while (state.character.isAlive && ticks < 42000) {
      state = stepOneTick(state, { allowPrompts: false, recordLogs: false });
      ticks++;
    }

    const age = state.character.ageYears;
    sumDeathAge += age;
    if (age < minAge) minAge = age;
    if (age > maxAge) maxAge = age;
    sumFinalCash += state.economy.cash;
    sumFinalDebt += state.economy.debt;
    finalCashList.push(state.economy.cash);

    const cause = state.character.causeOfDeath ?? 'ไม่ระบุ';
    causeCounts[cause] = (causeCounts[cause] ?? 0) + 1;
  }

  finalCashList.sort((a, b) => a - b);
  const medianCash = finalCashList[Math.floor(finalCashList.length / 2)] ?? 0;
  const elapsedMs = Date.now() - startMs;

  console.log('====================================================');
  console.log(`รายงาน Headless Simulator (${totalLives.toLocaleString('th-TH')} ชีวิต)`);
  console.log('====================================================');
  console.log(`เวลาประมวลผลรวม        : ${(elapsedMs / 1000).toFixed(2)} วินาที`);
  console.log(`อายุขัยเฉลี่ย            : ${(sumDeathAge / totalLives).toFixed(2)} ปี`);
  console.log(`อายุขัยต่ำสุด / สูงสุด    : ${minAge} ปี / ${maxAge} ปี`);
  console.log(`เงินสดเฉลี่ยตอนจบชีวิต    : ${Math.round(sumFinalCash / totalLives).toLocaleString('th-TH')} บาท`);
  console.log(`เงินสดมัธยฐานตอนจบชีวิต  : ${Math.round(medianCash).toLocaleString('th-TH')} บาท`);
  console.log(`หนี้สินเฉลี่ยตอนจบชีวิต   : ${Math.round(sumFinalDebt / totalLives).toLocaleString('th-TH')} บาท`);
  console.log('\nสัดส่วนฐานะครอบครัวตั้งต้น:');
  for (const [k, v] of Object.entries(wealthCounts)) {
    console.log(`  - ${k}: ${v} (${((v / totalLives) * 100).toFixed(1)}%)`);
  }
  console.log('\nสาเหตุการเสียชีวิต:');
  for (const [k, v] of Object.entries(causeCounts)) {
    console.log(`  - ${k}: ${v} (${((v / totalLives) * 100).toFixed(1)}%)`);
  }
  console.log('====================================================');
}

runHeadlessSim(1000);
