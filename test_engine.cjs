require('ts-node').register();
const { calculateProjections } = require('./src/utils/financialEngine.ts');
// Create a fake profile
const profile = {
  settings: {
    planStart: '2026-09-02',
    planEnd: '2026-09-06',
    openingBalance: -10
  },
  savings: { current: 200, digital: 0 },
  incomes: [],
  expenses: [],
  debts: [
    { id: '1', name: 'Deuda', freq: 'one-time', amount: 30, nextDate: '2026-09-02', usePlan: true, currency: 'USD' },
    { id: '2', name: 'Deuda2', freq: 'one-time', amount: 12, nextDate: '2026-09-03', usePlan: true, currency: 'USD' },
    { id: '3', name: 'Deuda3', freq: 'one-time', amount: 30, nextDate: '2026-09-04', usePlan: true, currency: 'USD' },
  ],
  overrides: {}
};
const plan = calculateProjections(profile, { 'USD': 1 });
const rescues = plan.filter(p => p.type === 'rescate_ahorros');
console.log('Rescues count:', rescues.length);
console.log(rescues);
