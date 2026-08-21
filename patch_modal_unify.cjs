const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  "import { todayStr, formatCurrency, advanceDateFreq, getRemainingDebtAmount, getDebtTotalPaid } from '../../utils/financialEngine';",
  "import { todayStr, formatCurrency, advanceDateFreq, getRemainingDebtAmount, getDebtTotalPaid, calculateAmortizationPlan } from '../../utils/financialEngine';"
);

const oldMemoBlock = `  const expectedCuotas = React.useMemo(() => {
    if (type !== 'debt') return [];
    
    // allow preview for new records too
    const itemId = editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex].id : 'preview';
    
    const inst = parseInt(String(installments), 10) || 1;
    const pmt = calculatedPmt;
    
    let curr = new Date((date || todayStr()) + 'T12:00:00');
    const overrides = profile.overrides || {};
    
    const finalFreq = debtType === 'card' ? 'monthly' : freq;
    const finalDueDay = finalFreq === 'biweekly' ? dueDay : (dueDay || day);

    const dummyItem = {
      id: itemId,
      name: name,
      type: debtType,
      balance: parseFloat(String(balance)) || parseFloat(String(amount)) || 0,
      amount: calculatedPmt,
      amortized: parseFloat(String(amortized)) || 0,
      installments: inst,
      currency: currency,
      minPay: calculatedPmt,
    };
    
    // Calculate total paid across ALL overrides and amortized, to handle orphaned payments
    // (e.g. when user changes the due day/frequency and the old payment dates no longer match)
    const totalPaid = getDebtTotalPaid(dummyItem as any, overrides);

    let accumulated = 0;
    const cuotas = [];
    for (let i = 0; i < inst; i++) {
      const dateStr = curr.toISOString().slice(0, 10);
      const key = \`debt_\${itemId}_\${dateStr}\`;
      const ov = overrides[key] || {};
      
      let isPaid = false;
      let paidAmt = pmt;

      // 1. Sequential fill from totalPaid (handles amortized + orphaned overrides)
      const covered = Math.min(pmt, totalPaid - accumulated);
      let isCoveredBySequential = false;
      if (covered >= pmt - 0.01) {
         isPaid = true;
         paidAmt = covered;
         isCoveredBySequential = true;
      }

      // 2. Explicit match (if user explicitly paid this specific future quota)
      if (ov.done) {
         isPaid = true;
         if (ov.amt !== undefined) {
           paidAmt = parseFloat(String(ov.rawPayAmount || ov.amt));
         }
      }
      
      cuotas.push({
        index: i + 1,
        date: dateStr,
        key,
        expectedAmount: pmt,
        isPaid,
        paidAmount: paidAmt,
        paidCurrency: ov.payCurrency || currency || 'USD_BCV',
        ov,
        isCoveredBySequential,
        isCoveredByExplicit: !!ov.done
      });
      
      accumulated += pmt;
      advanceDateFreq(curr, finalFreq, finalDueDay);
    }

    return cuotas;
  }, [type, editIndex, profile.debts, profile.overrides, installments, date, freq, dueDay, day, debtType, calculatedPmt, currency, amortized]);`;

const newMemoBlock = `  const expectedCuotas = React.useMemo(() => {
    if (type !== 'debt') return [];
    
    const itemId = editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex].id : 'preview';
    const finalFreq = debtType === 'card' ? 'monthly' : freq;
    const finalDueDay = finalFreq === 'biweekly' ? dueDay : (dueDay || day);

    const dummyItem = {
      id: itemId,
      name: name,
      type: debtType,
      balance: parseFloat(String(balance)) || parseFloat(String(amount)) || 0,
      amount: calculatedPmt,
      amortized: parseFloat(String(amortized)) || 0,
      installments: parseInt(String(installments), 10) || 1,
      currency: currency,
      minPay: calculatedPmt,
      freq: finalFreq,
      dueDay: finalDueDay,
      start: date || todayStr(),
      hasInterest: false
    };
    
    return calculateAmortizationPlan(dummyItem, profile.overrides || {}, profile.settings.customDebts || []);
  }, [type, editIndex, profile.debts, profile.overrides, profile.settings.customDebts, installments, date, freq, dueDay, day, debtType, calculatedPmt, currency, amortized, balance, amount]);`;

content = content.replace(oldMemoBlock, newMemoBlock);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
console.log("Modal patched with unificator");
