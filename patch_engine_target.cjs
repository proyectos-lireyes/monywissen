const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

// Add targetDate to occurrence object
code = code.replace(
  `        originalDate: dateStr,
        done,`,
  `        originalDate: dateStr,
        targetDate: finalDate,
        done,`
);

// Replace e?.originalDate === d with e?.targetDate === d in the simulation loop
code = code.replace(
  `let dayEvents = futureEvents.filter(e => e?.originalDate === d && !e?.pulledEarly);`,
  `let dayEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === d && !e?.pulledEarly);`
);

code = code.replace(
  `let hasIncomeToday = futureEvents.some(e => e?.originalDate === d && (e?.amt || 0) > 0 && e?.type === 'income' && !e?.pulledEarly);`,
  `let hasIncomeToday = futureEvents.some(e => (e?.targetDate || e?.originalDate) === d && (e?.amt || 0) > 0 && e?.type === 'income' && !e?.pulledEarly);`
);

fs.writeFileSync('src/utils/financialEngine.ts', code);
console.log("Patched targetDate");
