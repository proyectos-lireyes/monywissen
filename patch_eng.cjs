const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const startIdx = code.indexOf('// Auto-calculate Required Initial Balance');
if (startIdx === -1) throw new Error('not found');

const endStr = 'const targetMin = settings.minBalance || 0;';
const endIdx = code.indexOf(endStr, startIdx);

if (endIdx === -1) throw new Error('end not found');

const replacement = `// Auto-calculate Required Initial Balance
  let autoCalculatedStart = false;
   
  if (settings.openingBalance !== undefined && settings.openingBalance !== null && settings.openingBalance !== 0) {
    balance = settings.openingBalance;
  } else {
    autoCalculatedStart = true;
       
    let simBalance = 0;
    let minSimBalance = 0;
    
    for (const d of allDatesList) {
      const dayEvents = map[d] || [];
      let dayIncome = 0;
      let dayExpense = 0;
      
      for (const e of dayEvents) {
        if ((e?.amt || 0) > 0 && e?.type !== 'compensation') {
           dayIncome += e.amt;
        } else if ((e?.amt || 0) < 0 && e?.type !== 'savings') {
           dayExpense += e.amt;
        }
      }
      
      // Apply expenses first in this simulation to find the absolute lowest point
      simBalance += dayExpense;
      if (simBalance < minSimBalance) {
        minSimBalance = simBalance;
      }
      
      // Then apply income
      simBalance += dayIncome;
      
      // If we received income today, we stop calculating the deficit
      if (dayIncome > 0) {
        break;
      }
    }

    balance = Math.abs(minSimBalance) + (settings.minBalance || 0);
  }
  
  `;

const newCode = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/utils/financialEngine.ts', newCode);
console.log("Replaced!");
