const { calculateProjections } = require('./dist/server.cjs').__financialEngine__ || require('./dist/server.cjs');

const profile = {
  settings: { minBalance: 0, planStart: '2026-09-01' },
  incomes: [
    { id: '1', name: 'karina', amount: 50, freq: 'one-time', date: '2026-09-02', currency: 'USD_BCV' },
    { id: '2', name: 'Bono', amount: 100, freq: 'one-time', date: '2026-09-05', currency: 'USD_BCV' }
  ],
  expenses: [
    { id: '3', name: 'Nazareno', amount: 30, freq: 'one-time', date: '2026-09-01', currency: 'USD_BCV' },
    { id: '4', name: 'Internet mama', amount: 10, freq: 'one-time', date: '2026-09-03', currency: 'USD_BCV' },
    { id: '5', name: 'Internet', amount: 10, freq: 'one-time', date: '2026-09-04', currency: 'USD_BCV' }
  ],
  debts: [], savingsList: [], overrides: {}
};
console.log(calculateProjections(profile, {}));
