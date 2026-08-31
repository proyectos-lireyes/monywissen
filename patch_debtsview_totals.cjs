const fs = require('fs');
let code = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

const target2 = `  const totalOriginalActive = activeDebts.reduce((sum, d) => sum + (d.balance || 0), 0);
  const totalRemainingActive = activeDebts.reduce((sum, d) => sum + convertAmount(getRemainingDebtAmount(d, overrides, exchangeRates), d.currency), 0);
  const totalPaidActive = Math.max(0, totalOriginalActive - totalRemainingActive);`;

const replacement2 = `  let totalRemainingActive = 0;
  let totalPaidActive = 0;
  let totalOriginalActive = 0;
  
  activeDebts.forEach(d => {
    const plan = calculateAmortizationPlan(d, overrides, profile.settings.customDebts || [], undefined, exchangeRates);
    const rem = plan.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
    const paid = getDebtTotalPaid(d, overrides, exchangeRates);
    const orig = rem + paid;
    
    totalRemainingActive += convertAmount(rem, d.currency);
    totalPaidActive += convertAmount(paid, d.currency);
    totalOriginalActive += convertAmount(orig, d.currency);
  });`;

code = code.replace(target2, replacement2);
fs.writeFileSync('src/components/debts/DebtsView.tsx', code);
console.log("Patched DebtsView totals");
