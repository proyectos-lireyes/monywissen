const fs = require('fs');
let code = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

code = code.replace(
  /<p className="text-\[10px\] text-slate-500 font-semibold">\n\s*\{isIncome \? 'Saldo posterior: ' : 'Saldo disponible: '\}\n\s*<span className=\{'font-extrabold ' \+ \(e\.balance < 0 \? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'\)\}>\{formatCurrency\(e\.balance\)\}<\/span>\n\s*<\/p>/,
  `{/* Saldo oculto en vista lista para evitar confusión visual */}`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', code);
