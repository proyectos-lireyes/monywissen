const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const regex = /(const expectedCuotas = React\.useMemo\(\(\) => \{)([\s\S]*?)(\}, \[type, editIndex, profile\.debts, profile\.overrides, profile\.settings\.customDebts, installments, date, freq, dueDay, day, debtType, calculatedPmt, currency, amortized, balance, apr, name\]\);)/;

const newBlock = `
    if (type !== 'debt' && type !== 'income' && type !== 'expense') return [];
    if (!parseFloat(String(balance || amount))) return [];

    if (type === 'income' || type === 'expense') {
      const itemId = editIndex !== null && profile[type === 'income' ? 'incomes' : 'expenses'][editIndex] ? profile[type === 'income' ? 'incomes' : 'expenses'][editIndex].id : 'preview';
      const dummyItem = {
        id: itemId,
        name: name || 'Preview',
        type: type,
        amount: parseFloat(String(amount)) || 0,
        currency: currency as any,
        start: date,
        day: freq === 'monthly' || freq === 'weekly' ? parseInt(String(day), 10) || 1 : day,
        freq: freq,
      };

      const dummyProfile = {
        settings: { planStart: todayStr(), openingBalance: 0 },
        incomes: type === 'income' ? [dummyItem] : [],
        expenses: type === 'expense' ? [dummyItem] : [],
        debts: [],
        savingsList: [],
        overrides: profile.overrides || {}
      };

      const plan = calculateProjections(dummyProfile as any, exchangeRates);
      
      const occurrences = plan.filter(p => p.ref?.id === itemId).slice(0, 12);
      
      return occurrences.map((c, i) => {
        return {
          index: i + 1,
          date: c.originalDate || c.date,
          key: c.key,
          expectedAmount: Math.abs(c.amt),
          isPaid: c.done,
          paidAmount: c.done ? Math.abs(c.amt) : 0,
          paidCurrency: currency,
          ov: c.done ? (profile.overrides || {})[c.key] : {},
          isCoveredBySequential: false,
          isCoveredByExplicit: c.done,
          requiredPay: Math.abs(c.amt)
        };
      });
    }

    const itemId = editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex].id : 'preview';
    const isTdc = debtType === 'card' || debtType.startsWith('tdc_');
    const inst = parseInt(String(installments), 10) || 1;
    let actualInst = inst;
    const finalFreq = isTdc ? freq : freq;
    if (finalFreq === 'biweekly') actualInst = inst * 2;
    if (finalFreq === 'weekly') actualInst = inst * 4;
    let finalDueDay = finalFreq === 'biweekly' ? dueDay : (dueDay || day);
    if (isTdc && finalFreq === 'biweekly' && String(finalDueDay).indexOf('-') === -1) {
       const d1 = parseInt(String(finalDueDay), 10) || 15;
       const d2 = d1 + 15 > 30 ? 30 : d1 + 15;
       finalDueDay = String(d1) + "-" + String(d2);
    }

    const dummyItem = {
      id: itemId,
      name: name,
      type: debtType,
      balance: parseFloat(String(balance)) || 0,
      amount: calculatedPmt,
      amortized: parseFloat(String(amortized)) || 0,
      installments: actualInst,
      currency: currency as any,
      minPay: calculatedPmt,
      start: date,
      dueDay: finalDueDay,
      freq: finalFreq,
      hasInterest: (debtType === 'loan_interest' || debtType === 'card' || !!(profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)),
      apr: parseFloat(String(apr)) || 0
    };
    
    const plan = calculateAmortizationPlan(dummyItem, profile.overrides || {}, profile.settings.customDebts || [], undefined, exchangeRates);
    
    return plan.map((c, i) => {
      const isPaid = c.isCoveredByExplicit || c.isCoveredBySequential;
      return {
        index: i + 1,
        date: c.date,
        key: c.key,
        expectedAmount: c.expectedAmount,
        isPaid,
        paidAmount: isPaid ? c.expectedAmount : 0, // Simplifying preview
        paidCurrency: currency,
        ov: c.isCoveredByExplicit ? (profile.overrides || {})[c.key] : {},
        isCoveredBySequential: c.isCoveredBySequential,
        isCoveredByExplicit: c.isCoveredByExplicit,
        requiredPay: c.requiredPay
      };
    });
`;

code = code.replace(regex, `$1${newBlock}$3`);
fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
