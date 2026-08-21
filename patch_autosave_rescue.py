import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target1 = "    // Current day's scheduled events (that haven't been pulled early)"
replacement1 = """    // Determine auto-saving first: sweep BEFORE applying today's income
    let hasIncomeToday = futureEvents.some(e => e.originalDate === d && e.amt > 0 && e.type === 'income' && !e.pulledEarly);
    if (hasIncomeToday && balance > targetMin) {
       const autosaveKey = `savings_autosave_${d}_${d}`;
       const isDiscarded = overrides[autosaveKey] && overrides[autosaveKey].discarded;
       
       if (!isDiscarded) {
           const excess = balance - targetMin;
           balance = targetMin;
           savingsAccumulated += excess;
           plan.push({
             date: d,
             label: 'Ahorro Automático (Excedente pre-ingreso)',
             type: 'savings',
             amt: -excess,
             ref: { id: `autosave_${d}`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
             originalDate: d,
             done: overrides[autosaveKey] ? !!overrides[autosaveKey].done : false,
             balance,
             isDelayed: false,
             savingsAccumulated,
           });
       }
    }

    // Current day's scheduled events (that haven't been pulled early)"""

target2 = "    if (d === endD && delayedItems.length > 0) {"
replacement2 = """    // Auto-withdraw from savings if strict items broke the cushion
    if (balance < targetMin && savingsAccumulated > 0) {
      const autowithdrawKey = `income_autowithdraw_${d}_${d}`;
      const isDiscarded = overrides[autowithdrawKey] && overrides[autowithdrawKey].discarded;
      
      if (!isDiscarded) {
          const deficit = targetMin - balance;
          const amountToWithdraw = Math.min(deficit, savingsAccumulated);
          balance += amountToWithdraw;
          savingsAccumulated -= amountToWithdraw;
          
          plan.push({
            date: d,
            label: 'Rescate de Ahorros',
            type: 'income',
            amt: amountToWithdraw,
            ref: { id: `autowithdraw_${d}`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
            originalDate: d,
            done: overrides[autowithdrawKey] ? !!overrides[autowithdrawKey].done : false,
            balance,
            isDelayed: false,
            insufficientFunds: false,
            savingsAccumulated,
          });
      }
    }

    if (d === endD && delayedItems.length > 0) {"""

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patch applied to financialEngine.ts successfully.")
else:
    print("Could not find targets")
