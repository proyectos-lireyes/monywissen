const fs = require('fs');
let content = fs.readFileSync('src/utils/financialIntegrity.ts', 'utf8');

content = content.replace(/getRemainingDebtAmount\(debt, profile\.overrides \|\| \{\}, exchangeRates\)/g, 'getRemainingDebtAmount(debt, profile.overrides || {})');
content = content.replace(/getRemainingDebtAmount\(d, profile\.overrides \|\| \{\}, exchangeRates\)/g, 'getRemainingDebtAmount(d, profile.overrides || {})');

fs.writeFileSync('src/utils/financialIntegrity.ts', content);
