import { calculateAmortizationPlan } from './src/utils/financialEngine';

const dummyItem = {
  id: 'preview',
  name: 'Quoota Viaje',
  type: 'loan',
  balance: 1230,
  amount: 102.5,
  amortized: 0,
  installments: 12,
  currency: 'USD_BCV',
  minPay: 102.5,
  start: '2026-09-03', // Or some date
  dueDay: '15 y 30', // Or whatever
  freq: 'monthly', // Let's guess
  hasInterest: false,
  apr: 0
};

// We need to simulate totalPaid = 512.5.
// We can pass overrides that simulate this.
const overrides = {
  'debt_preview_2026-09-15': { done: true, amt: 102.5 },
  'debt_preview_2026-10-15': { done: true, amt: 102.5 },
  'debt_preview_2026-11-15': { done: true, amt: 102.5 },
  'debt_preview_2026-12-15': { done: true, amt: 102.5 },
  'debt_preview_2027-01-15': { done: true, amt: 102.5 },
};

const plan = calculateAmortizationPlan(dummyItem, overrides, [], undefined, {});
console.log(`Generated ${plan.length} cuotas`);
