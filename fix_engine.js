import fs from 'fs';

let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

// Update AmortizationInstallment
content = content.replace(
  '  date: string;\n  key: string;',
  '  date: string;\n  originalDate: string;\n  key: string;'
);

// Update cuotas.push
content = content.replace(
  '      date: finalDate,\n      key,',
  '      date: finalDate,\n      originalDate: dateStr,\n      key,'
);

// Update plan.forEach call to addOccurrence
content = content.replace(
  /addOccurrence\(cuota\.date, debt\.name, 'debt'/g,
  "addOccurrence(cuota.originalDate, debt.name, 'debt'"
);

fs.writeFileSync('src/utils/financialEngine.ts', content);
