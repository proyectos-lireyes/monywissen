const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const minBalance = plan.reduce((min, p) => p.balance < min ? p.balance : min, profile.settings.openingBalance || 0);`,
  `const minBalance = plan.reduce((min, p) => p.balance < min ? p.balance : min, plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0));`
);

code = code.replace(
  `            formatCurrency(profile.settings.openingBalance || 0),`,
  `            formatCurrency(plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0)),`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
