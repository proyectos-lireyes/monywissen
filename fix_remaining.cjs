const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

code = code.replace(
  /let totalDebt = parseFloat\(String\(debt\.balance \|\| 0\)\);/,
  `let totalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  totalDebt = Math.max(0, totalDebt - amort);`
);

fs.writeFileSync('src/utils/financialEngine.ts', code);
