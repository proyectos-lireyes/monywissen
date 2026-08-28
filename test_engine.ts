import { calculateProjections } from './src/utils/financialEngine';

const profile = {
  settings: { minBalance: 0, planStart: '2026-08-01', openingBalance: 0 },
  incomes: [
    { id: '1', name: 'Bono 1ra', amount: 500, freq: 'one-time', date: '2026-08-05', currency: 'USD' }
  ],
  expenses: [
    { id: '2', name: 'Internet mama', amount: 12, freq: 'one-time', date: '2026-08-03', currency: 'USD' }
  ],
  debts: [
    { id: 'd1', name: 'Curso de Zara', balance: 50, amount: 50, start: '2026-08-01', currency: 'USD', type: 'noloan', payments: [] },
    { id: 'd2', name: 'Vitaminas', balance: 34.74, amount: 34.74, start: '2026-08-01', currency: 'USD', type: 'noloan', payments: [] },
    { id: 'd3', name: 'Bolso Karina', balance: 231.57, amount: 231.57, start: '2026-08-03', currency: 'USD', type: 'noloan', payments: [] }
  ],
  savingsList: [],
  overrides: {
     'debt_d3_2026-09-01': { done: true, actualDate: '2026-08-03' },
     'debt_d1_2026-08-01': { done: true, actualDate: '2026-08-01' },
     'debt_d2_2026-08-01': { done: true, actualDate: '2026-08-01' },
     'expense_2_2026-08-03': { done: true, actualDate: '2026-08-03' }
  }
};
const plan = calculateProjections(profile as any, {});
console.log(plan.map(p => ({ label: p.label, date: p.date, amt: p.amt, balance: p.balance })));
