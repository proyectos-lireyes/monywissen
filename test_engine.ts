import { calculateAmortizationPlan } from './src/utils/financialEngine';

const dummyItem = {
  id: 'preview',
  name: 'Tucacas',
  type: 'loan',
  balance: 95,
  amount: 95 / 3,
  amortized: 0,
  installments: 3,
  currency: 'EUR_BCV',
  minPay: 95 / 3,
  start: '2026-09-03',
  dueDay: '15 y 30',
  freq: 'biweekly',
  hasInterest: false,
  apr: 0
};

const plan = calculateAmortizationPlan(dummyItem, {}, [], undefined, {});
console.log(JSON.stringify(plan, null, 2));
