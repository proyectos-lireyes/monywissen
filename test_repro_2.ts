import { calculateProjections } from './src/utils/financialEngine';

const profile: any = {
  settings: { planStart: '2026-09-02', planEnd: '2026-09-15', openingBalance: 0, minBalance: 0 },
  savings: { current: 100, digital: 0 },
  incomes: [
    { id: 'i1', name: 'Sueldo', freq: 'one-time', date: '2026-09-12', amount: 200, usePlan: true, currency: 'USD' }
  ],
  expenses: [
    { id: 'e1', name: 'Strict Exp', freq: 'one-time', date: '2026-09-02', amount: 50, usePlan: true, strictDate: true, currency: 'USD' }
  ],
  debts: [],
  overrides: { "income_required_starting_fund_2026-09-02": { discarded: true } }
};

const plan = calculateProjections(profile, { 'USD': 1 });
console.log(plan.map((p: any) => ({ date: p.date, type: p.type, label: p.label, amt: p.amt, bal: p.balance, delayed: p.isDelayed, pulled: p.pulledEarly })));
