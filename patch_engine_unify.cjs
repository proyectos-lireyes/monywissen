const fs = require('fs');
let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const exportBlock = `export interface AmortizationInstallment {
  index: number;
  date: string;
  key: string;
  expectedAmount: number;
  isPaid: boolean;
  paidAmount: number;
  paidCurrency: string;
  ov: any;
  isCoveredBySequential: boolean;
  isCoveredByExplicit: boolean;
  requiredPay: number;
}

export function calculateAmortizationPlan(
  debt: any,
  overrides: Record<string, any> = {},
  customDebts: any[] = [],
  limitDate?: Date
): AmortizationInstallment[] {
  const customDef = customDebts.find(c => c.id === debt.type);
  const isCard = debt.type === 'card';
  const freq = isCard ? 'monthly' : (debt.freq || (customDef ? customDef.freq : 'monthly'));
  const dueDay = isCard ? debt.dueDay : (debt.dueDay || (customDef ? customDef.dueDay : '1'));

  const pay = parseFloat(String(debt.amount || debt.minPay || 0));
  let totalDebt = parseFloat(String(debt.balance || 0));

  const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
  const inst = parseInt(String(debt.installments || 1), 10);

  if (hasInt && debt.apr) {
    totalDebt = pay * inst;
  }

  const totalPaid = getDebtTotalPaid(debt, overrides);
  let accumulated = 0;
  let curr = new Date((debt.start || todayStr()) + 'T12:00:00');

  const cuotas: AmortizationInstallment[] = [];
  let i = 0;
  const maxIterations = 999;

  while (i < maxIterations) {
    if (!isCard && i >= inst && (totalDebt <= 0 || accumulated >= totalDebt - 0.01)) {
      break;
    }
    if (isCard && i >= inst) {
      break;
    }
    if (limitDate && curr > limitDate) {
      break;
    }

    const dateStr = curr.toISOString().slice(0, 10);
    const key = \`debt_\${debt.id}_\${dateStr}\`;
    const ov = overrides[key] || {};

    let currentPay = pay;
    if (totalDebt > 0 && accumulated + currentPay > totalDebt) {
      currentPay = totalDebt - accumulated;
    }

    let isPaid = false;
    let paidAmt = currentPay;

    const coveredSeq = (totalPaid > accumulated) ? Math.min(currentPay, totalPaid - accumulated) : 0;
    let isCoveredBySequential = false;
    if (coveredSeq >= currentPay - 0.01) {
      isPaid = true;
      paidAmt = coveredSeq;
      isCoveredBySequential = true;
    }

    let isCoveredByExplicit = false;
    if (ov.done) {
      isPaid = true;
      isCoveredByExplicit = true;
      if (ov.amt !== undefined) {
        paidAmt = parseFloat(String(ov.rawPayAmount || ov.amt));
      }
    }

    const requiredPay = isPaid ? 0 : currentPay - coveredSeq;

    cuotas.push({
      index: i + 1,
      date: dateStr,
      key,
      expectedAmount: currentPay,
      isPaid,
      paidAmount: isPaid ? paidAmt : 0,
      paidCurrency: ov.payCurrency || debt.currency || 'USD_BCV',
      ov,
      isCoveredBySequential,
      isCoveredByExplicit,
      requiredPay: isCoveredByExplicit ? 0 : requiredPay
    });

    accumulated += currentPay;
    advanceDateFreq(curr, freq, dueDay);
    i++;
  }

  return cuotas;
}

export function getRemainingDebtAmount`;

content = content.replace("export function getRemainingDebtAmount", exportBlock);

const oldLoopBlock = `      let accumulated = 0;
      const rawTotalPaid = getDebtTotalPaid(debt, overrides);
      const totalPaid = convAmt(rawTotalPaid, (debt as any).currency);

      for (let safety = 0; safety < 999; safety++) {
        if (totalDebt > 0 && accumulated >= totalDebt - 0.01) break;
        if (curr > limitDate) break;

        const dateStr = curr.toISOString().slice(0, 10);
        const key = \`debt_\${debt.id}_\${dateStr}\`;
        const ov = overrides[key] || {};

        let currentPay = pay;
        if (totalDebt > 0 && accumulated + currentPay > totalDebt) {
          currentPay = totalDebt - accumulated;
        }

        const coveredSeq = (totalPaid > accumulated) ? Math.min(currentPay, totalPaid - accumulated) : 0;
        let requiredPay = currentPay - coveredSeq;

        let effectivePayToAccumulate = currentPay;
        if (ov.done && ov.amt !== undefined) {
          effectivePayToAccumulate = convAmt(parseFloat(String(ov.amt)), (debt as any).currency);
        }

        if (ov.done) {
          // Add it so it shows as paid in the calendar on this explicit date
          addOccurrence(dateStr, debt.name, 'debt', -currentPay, debtRef);
        } else if (requiredPay > 0.01) {
          addOccurrence(dateStr, debt.name, 'debt', -requiredPay, debtRef);
        }

        accumulated += currentPay;
        advanceDateFreq(curr, freq, debt.dueDay);
      }`;

const newLoopBlock = `      const plan = calculateAmortizationPlan(debt, overrides, customDebts, limitDate);
      plan.forEach(cuota => {
        const expectedNative = cuota.expectedAmount;
        const requiredNative = cuota.requiredPay;

        if (cuota.isCoveredByExplicit) {
          addOccurrence(cuota.date, debt.name, 'debt', -convAmt(expectedNative, (debt as any).currency), debtRef);
        } else if (requiredNative > 0.01) {
          addOccurrence(cuota.date, debt.name, 'debt', -convAmt(requiredNative, (debt as any).currency), debtRef);
        }
      });`;

content = content.replace(oldLoopBlock, newLoopBlock);

fs.writeFileSync('src/utils/financialEngine.ts', content);
console.log("Engine fully patched with unificator");
