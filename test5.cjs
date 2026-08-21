const fs = require('fs');
let content = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

content = content.replace(
  /const \{ profile, updateProfileData, showToast, convertAmount \} = useApp\(\);/g,
  'const { profile, updateProfileData, showToast, convertAmount, exchangeRates } = useApp();'
);

content = content.replace(/getRemainingDebtAmount\(d, overrides\)/g, 'getRemainingDebtAmount(d, overrides, exchangeRates)');
content = content.replace(/getRemainingDebtAmount\(a, overrides\)/g, 'getRemainingDebtAmount(a, overrides, exchangeRates)');
content = content.replace(/getRemainingDebtAmount\(b, overrides\)/g, 'getRemainingDebtAmount(b, overrides, exchangeRates)');
content = content.replace(/getRemainingDebtAmount\(item, overrides\)/g, 'getRemainingDebtAmount(item, overrides, exchangeRates)');
content = content.replace(/getDebtTotalPaid\(item, overrides\)/g, 'getDebtTotalPaid(item, overrides, exchangeRates)');

fs.writeFileSync('src/components/debts/DebtsView.tsx', content);
