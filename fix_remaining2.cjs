const fs = require('fs');

let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

viewContent = viewContent.replace(
  /\{formatCurrency\(remaining\)\}/g,
  '{formatCurrencyExt(remaining, (item as any).currency)}'
);

viewContent = viewContent.replace(
  /\{formatCurrency\(monthlyInstallment\)\}/g,
  '{formatCurrencyExt(monthlyInstallment, (item as any).currency)}'
);

viewContent = viewContent.replace(
  /\{formatCurrency\(item\.balance\)\}/g,
  '{formatCurrencyExt(item.balance, (item as any).currency)}'
);

fs.writeFileSync('src/components/debts/DebtsView.tsx', viewContent);
console.log('Fixed remaining in DebtsView again');
