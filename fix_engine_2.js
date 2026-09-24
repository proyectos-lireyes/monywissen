import fs from 'fs';

let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const targetFunctionStr = `export function calculateAmortizationPlan(`;
let blockStart = content.indexOf(targetFunctionStr);

const endStr = `  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);`;
let totalPaidIdx = content.indexOf(endStr, blockStart);

const newLogic = `  // Distribute lifetimeTotal exactly into installments to avoid pennies
  const scheduleAmounts: number[] = [];
  let currentSum = 0;
  for (let idx = 0; idx < inst; idx++) {
    if (idx === inst - 1) {
      scheduleAmounts.push(Math.round((lifetimeTotal - currentSum) * 100) / 100);
    } else {
      let p = Math.round((lifetimeTotal / inst) * 100) / 100;
      scheduleAmounts.push(p);
      currentSum += p;
    }
  }

  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);`;

content = content.substring(0, totalPaidIdx) + newLogic + content.substring(totalPaidIdx + endStr.length);

fs.writeFileSync('src/utils/financialEngine.ts', content);
