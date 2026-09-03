const fs = require('fs');
let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const target1 = `      if (ov.done || ov.discarded) {
        isPaid = true;
        isCoveredByExplicit = true;
        const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
        const finalAmt = amtUsd !== undefined ? getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates) : Math.max(0, pay - partialsSum);
        paidAmt = finalAmt + partialsSum;
        expectedAmount = Math.max(pay, paidAmt); 
      } else {`;

const repl1 = `      if (ov.done || ov.discarded) {
        isPaid = true;
        isCoveredByExplicit = true;
        const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
        const finalAmt = amtUsd !== undefined ? getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates) : Math.max(0, pay - partialsSum);
        paidAmt = finalAmt + partialsSum;
        expectedAmount = Math.max(pay, paidAmt);
        unallocatedPaid -= paidAmt;
      } else {`;

content = content.replace(target1, repl1);

fs.writeFileSync('src/utils/financialEngine.ts', content);
console.log('patched financialEngine.ts');
