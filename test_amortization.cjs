require('ts-node').register();
const { calculateAmortizationPlan } = require('./src/utils/financialEngine.ts');

const debt = {
  id: 'd1',
  type: 'fixed',
  freq: 'monthly',
  balance: 300,
  installments: 3,
  start: '2026-09-02',
};

const overrides = {
  'debt_d1_2026-09-02': { userPostponed: true, actualDate: '2026-09-10' }
};

const plan = calculateAmortizationPlan(debt, overrides);
console.log(plan.map(p => ({ idx: p.index, date: p.date, key: p.key })));
