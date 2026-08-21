const fs = require('fs');
let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const replacement = `export function getDebtTotalPaid(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {
  let paid = parseFloat(String(debt.amortized || 0));
  const defaultPay = parseFloat(String(debt.minPay || debt.amount || 0));
  
  const getAmtInDebtCurrency = (amtUsd: number, rawAmt?: number, payCurr?: string) => {
    if (rawAmt !== undefined && (!payCurr || payCurr === debt.currency)) return parseFloat(String(rawAmt));
    if (exchangeRates && debt.currency && debt.currency !== 'USD_BCV') {
       // amtUsd is in USD, we want it in debt.currency
       // USD / rate[debt.currency] ? No, if 1 EUR = 1.15 USD, amtUsd = 1.15. 1.15 / 1.15 = 1 EUR.
       const rate = exchangeRates[debt.currency];
       if (rate) return amtUsd / rate;
    }
    return amtUsd; // Fallback to USD (old behavior) or if debt is USD
  };

  Object.keys(overrides).forEach(k => {
    if (k.startsWith(\`debt_\${debt.id}_\`)) {
      const ov = overrides[k];
      const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(parseFloat(String(pt.amt)) || 0, pt.rawAmt, pt.currency), 0);
      
      if (ov.done || ov.discarded) {
        const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
        let finalAmt = 0;
        if (amtUsd !== undefined) {
           finalAmt = getAmtInDebtCurrency(amtUsd, ov.rawPayAmount, ov.payCurrency);
        } else {
           finalAmt = Math.max(0, defaultPay - partialsSum);
        }
        paid += (finalAmt + partialsSum);
      } else {
        paid += partialsSum;
      }
    }
  });
  return Math.round(paid * 100) / 100;
}
`

content = content.replace(/export function getDebtTotalPaid[\s\S]*?return Math\.round\(paid \* 100\) \/ 100;\n\}/, replacement);
fs.writeFileSync('src/utils/financialEngine.ts', content);
