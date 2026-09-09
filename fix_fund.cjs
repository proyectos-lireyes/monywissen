const fs = require('fs');
const p = 'src/utils/financialEngine.ts';
let txt = fs.readFileSync(p, 'utf8');
txt = txt.replace(
  /const key = `income_required_starting_fund_\$\{startD\}`;/,
  "const key = `income_required_starting_fund_initial`;"
).replace(
  /originalDate: startD,/,
  "originalDate: 'initial',"
);
fs.writeFileSync(p, txt);
