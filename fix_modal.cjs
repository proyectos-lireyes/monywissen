const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const regex = /const expectedCuotas = React\.useMemo\(\(\) => \{[\s\S]*?return cuotas;\n  \}, \[.*?\]\);/m;
const replacement = `const expectedCuotas = React.useMemo(() => {
    if (type !== 'debt') return [];
    const itemId = editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex].id : 'preview';
    const inst = parseInt(String(installments), 10) || 1;
    const finalFreq = debtType === 'card' ? 'monthly' : freq;
    const finalDueDay = finalFreq === 'biweekly' ? dueDay : (dueDay || day);

    const dummyItem = {
      id: itemId,
      name: name,
      type: debtType,
      balance: parseFloat(String(balance)) || 0,
      amount: calculatedPmt,
      amortized: parseFloat(String(amortized)) || 0,
      installments: inst,
      currency: currency as any,
      minPay: calculatedPmt,
      start: date,
      dueDay: finalDueDay,
      freq: finalFreq,
      hasInterest: (debtType === 'loan_interest' || debtType === 'card' || !!(profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)),
      apr: parseFloat(String(apr)) || 0
    };
    
    const plan = calculateAmortizationPlan(dummyItem, profile.overrides || {}, profile.settings.customDebts || []);
    
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
  }, [type, editIndex, profile.debts, profile.overrides, profile.settings.customDebts, installments, date, freq, dueDay, day, debtType, calculatedPmt, currency, amortized, balance, apr, name]);`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
  console.log('Replaced successfully!');
} else {
  console.log('Regex did not match.');
}
