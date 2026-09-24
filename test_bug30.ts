import { calculateAmortizationPlan } from './src/utils/financialEngine';

const dummyItem = {
  id: 'debt_1725371587397',
  name: 'Bolso Karina',
  type: 'debt',
  balance: 2000,
  amount: 200, 
  amortized: 0,
  installments: 10, 
  currency: 'EUR_BCV',
  minPay: 200,
  start: '2026-02-03', // as per UI
  dueDay: '1',
  freq: 'monthly',
  hasInterest: false,
  apr: 0
};

const overrides = {
  'debt_debt_1725371587397_2026-09-03': { done: true, amt: 200 }, 
};

const plan = calculateAmortizationPlan(dummyItem as any, overrides, [], undefined, {});
console.log(plan.map(c => ({ index: c.index, date: c.date, expectedAmount: c.expectedAmount, requiredPay: c.requiredPay, isPaid: c.isPaid, paidAmt: (c as any).paidAmount })));
