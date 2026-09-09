import { readFileSync } from 'fs';
import { calculateProjections } from './src/utils/financialEngine.ts';

const profile = {
  settings: { openingBalance: 0, minBalance: 0, planStart: '2026-09-01' },
  overrides: {},
  incomes: [],
  expenses: [
    { name: 'Nazareno', amount: 20, start: '2026-09-01', freq: 'monthly', day: 1 },
    { name: 'Tlf mamai', amount: 10, start: '2026-09-01', freq: 'monthly', day: 1 }
  ],
  debts: [],
  savings: { current: 100 }
};

const plan = calculateProjections(profile as any, {});
console.log("Plan length:", plan.length);
const req = plan.find((p: any) => p.ref && p.ref.id === 'required_starting_fund');
console.log("Required fund:", req);
