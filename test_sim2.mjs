import { calculateAmortizationPlan } from './src/utils/financialEngine.ts';

const debt = {
    id: 'preview', type: 'custom', balance: 66, amount: 22, amortized: 0, installments: 3, currency: 'USD',
    start: '2026-08-15', freq: 'biweekly', dueDay: 'exact_14'
};
const overrides = {};
const exchangeRates = { USD: 1 };
let plan = calculateAmortizationPlan(debt, overrides, [], undefined, exchangeRates);
console.log("exact_14:", plan.map(c => c.date + ' ' + c.key));

debt.dueDay = 'exact_15';
plan = calculateAmortizationPlan(debt, overrides, [], undefined, exchangeRates);
console.log("exact_15:", plan.map(c => c.date + ' ' + c.key));

debt.freq = 'Cashea'; 
plan = calculateAmortizationPlan(debt, overrides, [], undefined, exchangeRates);
console.log("Cashea:", plan.map(c => c.date + ' ' + c.key));

