const fs = require('fs');
let code = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

if (!code.includes('calculateAmortizationPlan')) {
    code = code.replace("import { formatCurrencyExt, getRemainingDebtAmount, getDebtTotalPaid } from '../../utils/financialEngine';", "import { formatCurrencyExt, getRemainingDebtAmount, getDebtTotalPaid, calculateAmortizationPlan } from '../../utils/financialEngine';");
    
    // Replace the manual calculations inside activeDebts.map
    const target = `const remaining = getRemainingDebtAmount(item, overrides, exchangeRates);
                const original = remaining + getDebtTotalPaid(item, overrides, exchangeRates);
                const paid = getDebtTotalPaid(item, overrides, exchangeRates);
                const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;
                const isCleared = progressPct === 100;
                const installmentsCount = item.installments || 1;
                const monthlyInstallment = item.amount || item.minPay || 0;`;

    const replacement = `
                const plan = calculateAmortizationPlan(item, overrides, profile.settings.customDebts || [], undefined, exchangeRates);
                const remaining = plan.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
                const paid = getDebtTotalPaid(item, overrides, exchangeRates);
                const original = remaining + paid;
                const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;
                const isCleared = progressPct === 100;
                const installmentsCount = plan.length;
                const monthlyInstallment = plan.length > 0 ? plan[0].expectedAmount : (item.amount || item.minPay || 0);`;

    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/debts/DebtsView.tsx', code);
}
console.log("Patched DebtsView with calculateAmortizationPlan");
