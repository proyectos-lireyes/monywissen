const fs = require('fs');
let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

content = content.replace(
  /const totalPaid = getDebtTotalPaid\(debt, overrides\);/g,
  'const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);'
);

fs.writeFileSync('src/utils/financialEngine.ts', content);
