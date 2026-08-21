const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

content = content.replace(
  /const totalDebt = \(profile\.debts \|\| \[\]\)\.reduce\(\(acc, d\) => acc \+ getRemainingDebtAmount\(d, profile\.overrides\), 0\);/g,
  'const totalDebt = (profile.debts || []).reduce((acc, d) => acc + convertAmount(getRemainingDebtAmount(d, profile.overrides, exchangeRates), d.currency), 0);'
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', content);
