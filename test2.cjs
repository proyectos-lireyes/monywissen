const fs = require('fs');
let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const getAmtStr = `export function getAmtInDebtCurrency(debt: DebtItem, amtUsd: number, rawAmt?: number, payCurr?: string, exchangeRates?: Record<string, number>): number {
  if (rawAmt !== undefined && (!payCurr || payCurr === debt.currency)) return parseFloat(String(rawAmt));
  if (exchangeRates && debt.currency && debt.currency !== 'USD_BCV') {
     const rate = exchangeRates[debt.currency];
     if (rate) return amtUsd / rate;
  }
  return amtUsd;
}`;

content = content.replace(
  /export function getDebtTotalPaid\(debt: DebtItem, overrides: Record<string, any> = \{\}, exchangeRates\?: Record<string, number>\): number \{/,
  getAmtStr + '\n\nexport function getDebtTotalPaid(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {'
);

content = content.replace(
  /  const getAmtInDebtCurrency = [\s\S]*?return amtUsd; \/\/ Fallback to USD \(old behavior\) or if debt is USD\n  \};\n/,
  ''
);

content = content.replace(
  /getAmtInDebtCurrency\(parseFloat\(String\(pt\.amt\)\) \|\| 0, pt\.rawAmt, pt\.currency\)/g,
  'getAmtInDebtCurrency(debt, parseFloat(String(pt.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates)'
);
content = content.replace(
  /getAmtInDebtCurrency\(amtUsd, ov\.rawPayAmount, ov\.payCurrency\)/g,
  'getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates)'
);

content = content.replace(
  /export function calculateAmortizationPlan\(\n  debt: any,\n  overrides: Record<string, any> = \{\},\n  customDebts: any\[\] = \[\],\n  limitDate\?: Date\n\): AmortizationInstallment\[\] \{/g,
  `export function calculateAmortizationPlan(
  debt: any,
  overrides: Record<string, any> = {},
  customDebts: any[] = [],
  limitDate?: Date,
  exchangeRates?: Record<string, number>
): AmortizationInstallment[] {`
);

content = content.replace(
  /const partialsSum = \(ov\.partials \|\| \[\]\)\.reduce\(\(sum: number, pt: any\) => sum \+ \(parseFloat\(String\(pt\.amt\)\) \|\| 0\), 0\);/g,
  `const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(debt, parseFloat(String(pt.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates), 0);`
);

content = content.replace(
  /const finalAmt = ov\.amt !== undefined \? parseFloat\(String\(ov\.amt\)\) : Math\.max\(0, pay - partialsSum\);/g,
  `const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
      const finalAmt = amtUsd !== undefined ? getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates) : Math.max(0, pay - partialsSum);`
);

fs.writeFileSync('src/utils/financialEngine.ts', content);
