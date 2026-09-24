import fs from 'fs';

let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

// 1. Remove the Lookahead Savings rescue block
const lookaheadRescueStart = "        // 2. SAVINGS RESCUE\n        // Rescatamos dinero SOLO si el periodo actual";
const lookaheadRescueEnd = "        lastRescuePeriodEnd = nextIncomeDate;\n    }";

const startIndex = code.indexOf(lookaheadRescueStart);
if (startIndex !== -1) {
    const endIndex = code.indexOf("lastRescuePeriodEnd = nextIncomeDate;\n    }", startIndex) + "lastRescuePeriodEnd = nextIncomeDate;\n    }".length;
    code = code.substring(0, startIndex) + "\n        lastRescuePeriodEnd = nextIncomeDate;\n    }" + code.substring(endIndex);
}

// 2. Introduce JIT Rescue around where we apply candidates
const candidateLoopStart = "    for (const e of candidates) {";
const candidateLoopEnd = "    delayedItems = newDelayed;";

const newCandidateLoop = `    let dayRescueTotal = 0;
    const MAX_DAILY_RESCUE = 50;

    const executeRescue = (amt: number, reasonId: string) => {
        balance += amt;
        savingsAccumulated -= amt;
        dayRescueTotal += amt;
        
        applied.push({
            date: d,
            label: 'Rescate de Ahorros',
            type: 'rescate_ahorros',
            amt: amt,
            ref: { id: \`autowithdraw_\${d}_\${reasonId}\`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
            originalDate: d,
            done: true,
            runningBalance: balance,
            isDelayed: false,
            insufficientFunds: false,
            savingsAccumulated,
        });
    };

    // First check if strict expenses already put us in negative
    if (balance < targetMin && savingsAccumulated > 0) {
        const deficit = targetMin - balance;
        const availableCapacity = MAX_DAILY_RESCUE - dayRescueTotal;
        const amt = Math.min(deficit, savingsAccumulated, availableCapacity);
        if (amt > 0) {
            executeRescue(amt, 'strict');
        }
    }

    for (const e of candidates) {
       // Only apply if we have enough balance to cover it without dipping below targetMin
       const isIncome = (e.amt || 0) > 0;
       
       if (isIncome || balance + (e.amt || 0) >= targetMin) {
          if ((e.targetDate || e.originalDate) > d) {
             e.pulledEarly = true;
          } else if ((e.targetDate || e.originalDate) < d) {
             e.isDelayed = true;
          }
          e.optimizedFrom = e.originalDate;
          applyEvent(e);
       } else {
          // JIT Rescue for flexible expenses due today or earlier
          let paid = false;
          if ((e.targetDate || e.originalDate) <= d && savingsAccumulated > 0) {
              const deficit = targetMin - (balance + (e.amt || 0));
              const availableCapacity = MAX_DAILY_RESCUE - dayRescueTotal;
              
              if (deficit <= availableCapacity && deficit <= savingsAccumulated) {
                  // We can rescue enough to pay it!
                  executeRescue(deficit, e.ref.id);
                  
                  if ((e.targetDate || e.originalDate) < d) {
                     e.isDelayed = true;
                  }
                  e.optimizedFrom = e.originalDate;
                  applyEvent(e);
                  paid = true;
              }
          }
          
          if (!paid) {
              // If we can't pay it, and it's due (or overdue), keep it in the backlog
              if ((e.targetDate || e.originalDate) <= d) {
                  newDelayed.push(e);
              }
          }
       }
    }
    delayedItems = newDelayed;`;

const candStartIdx = code.indexOf(candidateLoopStart);
const candEndIdx = code.indexOf(candidateLoopEnd, candStartIdx) + candidateLoopEnd.length;

if (candStartIdx !== -1) {
    code = code.substring(0, candStartIdx) + newCandidateLoop + code.substring(candEndIdx);
}

fs.writeFileSync('src/utils/financialEngine.ts', code);
console.log("Patched JIT rescue");
