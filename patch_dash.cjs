const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

code = code.replace(
  `const projectedBalance = lastOccurrence ? lastOccurrence.balance : profile.settings.openingBalance;`,
  `const projectedBalance = lastOccurrence ? lastOccurrence.balance : (plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0));`
);

code = code.replace(
  `let runningBalance = profile.settings.openingBalance;`,
  `let runningBalance = plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0);`
);

code = code.replace(
  `      balance: profile.settings.openingBalance, // Will be overridden`,
  `      balance: plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0), // Will be overridden`
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched dash");
