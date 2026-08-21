const fs = require('fs');
let content = fs.readFileSync('src/utils/financialIntegrity.ts', 'utf8');

content = content.replace(/getRemainingDebtAmount\(debt, profile\.overrides \|\| \{\}\)/g, 'getRemainingDebtAmount(debt, profile.overrides || {}, exchangeRates)');
content = content.replace(/getRemainingDebtAmount\(d, profile\.overrides \|\| \{\}\)/g, 'getRemainingDebtAmount(d, profile.overrides || {}, exchangeRates)');

fs.writeFileSync('src/utils/financialIntegrity.ts', content);
