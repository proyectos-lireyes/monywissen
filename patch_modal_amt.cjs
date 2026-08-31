const fs = require('fs');
let code = fs.readFileSync('src/components/modals/OccurrenceDetailModal.tsx', 'utf8');

// Replace plannedUsdAmount = occurrence.plannedAmt;
// with plannedUsdAmount = occurrence.plannedAmt || Math.abs(occurrence.amt || 0);
code = code.replace(
  'plannedUsdAmount = occurrence.plannedAmt;',
  'plannedUsdAmount = occurrence.plannedAmt !== undefined ? occurrence.plannedAmt : Math.abs(occurrence.amt || 0);'
);

fs.writeFileSync('src/components/modals/OccurrenceDetailModal.tsx', code);
console.log("Patched plannedUsdAmount fallback");
