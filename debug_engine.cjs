const fs = require('fs');
const p = 'src/utils/financialEngine.ts';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(
  'const requiredInitial = Math.abs(minSimBalance) + (settings.minBalance || 0);',
  `const requiredInitial = Math.abs(minSimBalance) + (settings.minBalance || 0);
   console.log("DEBUG DEFICIT:", { startD, firstIncomeDate, minSimBalance, requiredInitial });`
);

fs.writeFileSync(p, txt);
