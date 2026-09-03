import { calculateAmortizationPlan, getDebtTotalPaid } from './src/utils/financialEngine';

const debt = {
    id: 'preview',
    balance: 66,
    amount: 22,
    amortized: 0,
    installments: 3,
    currency: 'USD',
    start: '2026-08-15',
    freq: 'monthly',
    dueDay: '15' // Wait, dates are 15/08, 06/09, 19/09. This is Cashea (exact_14) maybe? 
                 // Let's just say freq: 'biweekly', dueDay: 'exact_15' or whatever generates 15, 6, 19.
};

// Wait, 15/08 + 14 = 29/08.
// But the user has 15/08, 06/09, 19/09.
// That is 22 days and 13 days. It's likely they set 06-19 for dueDay!
// freq: 'biweekly', dueDay: '6-19'
debt.freq = 'biweekly';
debt.dueDay = '6-19';

const overrides = {};
const customDebts = [];
const exchangeRates = { USD: 1 };

let plan = calculateAmortizationPlan(debt, overrides, customDebts, undefined, exchangeRates);
console.log("Initial plan:", plan.map(c => c.date + ' ' + c.key + ' ' + c.isPaid));

// Step 1: User moves 15/08 to 24/08
overrides['debt_preview_2026-08-15'] = {
    userPostponed: true,
    actualDate: '2026-08-24',
    plannedAmt: 22,
    rawPayAmount: 22,
    payCurrency: 'USD'
};

plan = calculateAmortizationPlan(debt, overrides, customDebts, undefined, exchangeRates);
console.log("\nAfter move:", plan.map(c => c.date + ' ' + c.key + ' ' + c.isPaid));

// Step 2: User marks as paid
overrides['debt_preview_2026-08-15'].done = true;
overrides['debt_preview_2026-08-15'].amt = 22;

plan = calculateAmortizationPlan(debt, overrides, customDebts, undefined, exchangeRates);
console.log("\nAfter mark paid:", plan.map(c => c.date + ' ' + c.key + ' ' + c.isPaid));
console.log("Total paid:", getDebtTotalPaid(debt, overrides, exchangeRates));

