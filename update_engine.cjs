const fs = require('fs');

let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const startIdx = content.indexOf('  const totalPaid = getDebtTotalPaid(debt, overrides);');
const endIdx = content.indexOf('  return cuotas;', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const oldLogic = content.substring(startIdx, endIdx);
    const newLogic = `  const totalPaid = getDebtTotalPaid(debt, overrides);
  let unallocatedPaid = parseFloat(String(debt.amortized || 0));
  let remainingPrincipal = totalDebt - totalPaid;

  let curr = new Date((debt.start || todayStr()) + 'T12:00:00');
  const cuotas: AmortizationInstallment[] = [];
  let i = 0;
  const maxIterations = 999;

  while (i < maxIterations) {
    if (limitDate && curr > limitDate) break;

    const dateStr = curr.toISOString().slice(0, 10);
    const key = \`debt_\${debt.id}_\${dateStr}\`;
    const ov = overrides[key] || {};
    
    let expectedAmount = pay;
    let isPaid = false;
    let paidAmt = 0;
    let isCoveredByExplicit = false;
    let isCoveredBySequential = false;
    let requiredPay = 0;
    
    const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + (parseFloat(String(pt.amt)) || 0), 0);
    
    if (ov.done || ov.discarded) {
      isPaid = true;
      isCoveredByExplicit = true;
      const finalAmt = ov.amt !== undefined ? parseFloat(String(ov.amt)) : Math.max(0, pay - partialsSum);
      paidAmt = finalAmt + partialsSum;
      expectedAmount = Math.max(pay, paidAmt); 
    } else {
      if (unallocatedPaid > 0) {
        const canCover = Math.min(pay, unallocatedPaid);
        if (canCover >= pay - 0.01) {
          isPaid = true;
          isCoveredBySequential = true;
          paidAmt = canCover;
          unallocatedPaid -= canCover;
        } else {
          paidAmt = canCover;
          unallocatedPaid -= canCover;
        }
      }
      
      paidAmt += partialsSum;
      
      if (paidAmt >= pay - 0.01) {
        isPaid = true;
      } else {
        requiredPay = Math.min(pay - paidAmt, Math.max(0, remainingPrincipal));
        if (requiredPay < 0.01) {
          requiredPay = 0;
        }
        expectedAmount = paidAmt + requiredPay;
        remainingPrincipal -= requiredPay;
      }
    }
    
    if (!isPaid && requiredPay <= 0) {
      break; 
    }
    
    if (isCard && i >= inst) break;

    cuotas.push({
      index: i + 1,
      date: dateStr,
      key,
      expectedAmount,
      isPaid,
      paidAmount: isPaid ? paidAmt : (partialsSum > 0 ? partialsSum : 0),
      paidCurrency: ov.payCurrency || debt.currency || 'USD_BCV',
      ov,
      isCoveredBySequential,
      isCoveredByExplicit,
      requiredPay
    });

    advanceDateFreq(curr, freq, dueDay);
    i++;
  }

`;
    content = content.replace(oldLogic, newLogic);
    fs.writeFileSync('src/utils/financialEngine.ts', content);
    console.log('Successfully replaced');
} else {
    console.log('Could not find boundaries', startIdx, endIdx);
}
