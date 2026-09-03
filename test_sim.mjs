import { calculateAmortizationPlan, getDebtTotalPaid } from './src/utils/financialEngine.ts';

const debt = {
    id: 'preview',
    type: 'custom',
    balance: 66,
    amount: 22,
    amortized: 0,
    installments: 3,
    currency: 'USD',
    start: '2026-08-15',
    freq: 'biweekly',
    dueDay: '6-19'
};

const overrides = {};
const exchangeRates = { USD: 1 };

let plan = calculateAmortizationPlan(debt, overrides, [], undefined, exchangeRates);
console.log("Initial plan:");
plan.forEach(c => console.log(c.date, c.key, c.isPaid, 'reqPay:', c.requiredPay, 'paidAmt:', c.paidAmount));

overrides['debt_preview_2026-08-15'] = {
    userPostponed: true,
    actualDate: '2026-08-24',
    plannedAmt: 22,
    rawPayAmount: 22,
    payCurrency: 'USD'
};
plan = calculateAmortizationPlan(debt, overrides, [], undefined, exchangeRates);
console.log("\nAfter move:");
plan.forEach(c => console.log(c.date, c.key, c.isPaid, 'reqPay:', c.requiredPay, 'paidAmt:', c.paidAmount));

overrides['debt_preview_2026-08-15'].done = true;
overrides['debt_preview_2026-08-15'].amt = 22;

plan = calculateAmortizationPlan(debt, overrides, [], undefined, exchangeRates);
console.log("\nAfter mark paid:");
plan.forEach(c => console.log(c.date, c.key, c.isPaid, 'reqPay:', c.requiredPay, 'paidAmt:', c.paidAmount));
console.log("Total paid:", getDebtTotalPaid(debt, overrides, exchangeRates));

