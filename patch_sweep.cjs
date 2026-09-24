const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const replacement = `
    let sweptToday = false;
    for (const e of dayEvents) {
      if (!sweptToday && (e.amt || 0) > 0 && e.type === 'income' && e.ref?.id !== 'required_starting_fund') {
         if (balance > targetMin) {
           const excess = balance - targetMin;
           balance -= excess;
           savingsAccumulated += excess;
           plan.push({
             date: d,
             label: 'Ahorro Automático (Remanente)',
             type: 'savings',
             amt: -excess,
             ref: { id: 'auto_savings', name: 'Ahorro Automático', effectiveColor: '#10b981' },
             originalDate: d,
             targetDate: d,
             done: false,
             balance: balance,
             isDelayed: false,
             insufficientFunds: false,
             savingsAccumulated: savingsAccumulated,
             isGhost: false
           });
         }
         sweptToday = true;
      }

      balance += e.amt || 0;`;

code = code.replace(/for \(const e of dayEvents\) \{\s*balance \+= e\.amt \|\| 0;/, replacement);

fs.writeFileSync('src/utils/financialEngine.ts', code);
