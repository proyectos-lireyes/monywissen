const fs = require('fs');
const code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const target = `  // Auto-calculate Required Initial Balance
  let expensesBeforeFirstIncome = 0;
  let autoCalculatedStart = false;
   
  if (settings.openingBalance !== undefined && settings.openingBalance !== null && settings.openingBalance !== 0) {
    balance = settings.openingBalance;
  } else {
    autoCalculatedStart = true;
       
    // Find the date of the first income based on final dates (which are the keys in map)
    let firstIncomeFinalDate = endD;
    for (const d of allDatesList) {
      if ((map[d] || []).some(e => (e?.amt || 0) > 0 && e?.type !== 'compensation')) {
        firstIncomeFinalDate = d;
        break;
      }
    }
       
    // Sum all expenses whose original date is before the first income's final date
    expensesBeforeFirstIncome = futureEvents
      .filter(e => e?.originalDate < firstIncomeFinalDate && (e?.amt || 0) < 0 && e?.type !== 'savings')
      .reduce((sum, e) => sum + Math.abs(e.amt), 0);

    balance = expensesBeforeFirstIncome + (settings.minBalance || 0);
  }`;

const replacement = `  // Auto-calculate Required Initial Balance
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
  }`;

fs.writeFileSync('src/utils/financialEngine.ts', code.replace(target, replacement));
console.log("Patched!");
