const fs = require('fs');

let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

viewContent = viewContent.replace(
  /<span className="font-bold text-slate-800 dark:text-slate-200">\{formatCurrency\(remaining\)\}<\/span>/g,
  '<span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrencyExt(remaining, item.currency)}</span>'
);

viewContent = viewContent.replace(
  /Monto Original: \{formatCurrency\(remaining\)\} \{\(item as any\)\.currency \|\| 'USD_BCV'\}/g,
  'Monto Original: {formatCurrencyExt(remaining, item.currency)}'
);

fs.writeFileSync('src/components/debts/DebtsView.tsx', viewContent);
console.log('Fixed remaining in DebtsView');
