import fs from 'fs';

// 1. App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  'const plan = calculateProjections(profile, exchangeRates);',
  'const plan = calculateProjections(profile, state.exchangeRates);'
);
fs.writeFileSync('src/App.tsx', appContent);

// 2. CalendarView.tsx
let calContent = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');
calContent = calContent.replace(
  'const { profile } = useApp();',
  'const { profile, state } = useApp();'
);
calContent = calContent.replace(
  'const plan = calculateProjections(profile, exchangeRates);',
  'const plan = calculateProjections(profile, state.exchangeRates);'
);
fs.writeFileSync('src/components/calendar/CalendarView.tsx', calContent);

// 3. financialEngine.ts
let engineContent = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');
// Undo the bad replace in getRemainingDebtAmount
engineContent = engineContent.replace(
  'const amortized = convAmt(parseFloat(String(debt.amortized || 0)), (debt as any).currency);',
  'const amortized = parseFloat(String(debt.amortized || 0));'
);
// Actually wait, let's just make sure there are no other `convAmt` outside `calculateProjections`.
// Yes, only that one in `getRemainingDebtAmount`.
fs.writeFileSync('src/utils/financialEngine.ts', engineContent);
