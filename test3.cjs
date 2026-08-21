const fs = require('fs');
let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

content = content.replace(
  /export function getRemainingDebtAmount\(debt: DebtItem, overrides: Record<string, any> = \{\}\): number \{/g,
  'export function getRemainingDebtAmount(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {'
);

content = content.replace(
  /const rem = totalDebt - getDebtTotalPaid\(debt, overrides\);/g,
  'const rem = totalDebt - getDebtTotalPaid(debt, overrides, exchangeRates);'
);

fs.writeFileSync('src/utils/financialEngine.ts', content);
