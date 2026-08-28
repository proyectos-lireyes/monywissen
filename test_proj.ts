import { calculateProjections } from './src/utils/financialEngine';

const profile: any = {
  settings: {
    planStart: '2026-08-20',
    planEnd: '2026-09-30',
    openingBalance: 100
  },
  incomes: [
    {
      id: 'inc_123',
      name: 'Salary',
      amount: 500,
      freq: 'one-time',
      date: '2026-08-24'
    }
  ],
  overrides: {
    "income_inc_123_2026-08-24": {
      done: true
    }
  }
};

const projs = calculateProjections(profile, {});
console.log(projs);
