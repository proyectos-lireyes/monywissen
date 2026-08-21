import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    // Finalize applied events
    applied.forEach(e => {
      if (e.type === 'savings') {
        savingsAccumulated += Math.abs(e.amt);
      }
      plan.push({
        ...e,
        balance, // balance AFTER this event
        insufficientFunds: balance < targetMin,
        savingsAccumulated,
      });
    });
    


    // Auto-withdraw from savings if strict items broke the cushion
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
    }"""

# Actually, let's just use regex or split on "// Finalize applied events"
parts = content.split('    // Finalize applied events')
if len(parts) == 2:
    prefix = parts[0]
    rest = parts[1]
    
    # find where "if (d === endD && delayedItems.length > 0) {" is
    end_part_idx = rest.find('    if (d === endD && delayedItems.length > 0) {')
    if end_part_idx != -1:
        end_part = rest[end_part_idx:]
        
        replacement = """    // First, process savings accumulations so they are available for rescue
    applied.forEach(e => {
      if (e.type === 'savings' && e.amt < 0) {
        savingsAccumulated += Math.abs(e.amt);
      }
    });

    // Auto-withdraw from savings if strict items broke the cushion
    let rescueEvent = null;
    if (balance < targetMin && savingsAccumulated > 0) {
      const autowithdrawKey = `income_autowithdraw_${d}_${d}`;
      const isDiscarded = overrides[autowithdrawKey] && overrides[autowithdrawKey].discarded;
      
      if (!isDiscarded) {
          const deficit = targetMin - balance;
          const amountToWithdraw = Math.min(deficit, savingsAccumulated);
          balance += amountToWithdraw;
          savingsAccumulated -= amountToWithdraw;
          
          rescueEvent = {
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
          };
      }
    }

    // Finalize applied events WITH the post-rescue balance
    applied.forEach(e => {
      plan.push({
        ...e,
        balance, // balance AFTER this event (and after rescue)
        insufficientFunds: balance < targetMin,
        savingsAccumulated,
      });
    });

    if (rescueEvent) {
      plan.push(rescueEvent);
    }

"""
        
        content = prefix + replacement + end_part
        with open('src/utils/financialEngine.ts', 'w') as f:
            f.write(content)
        print("Patched rescue order (dynamic)")
    else:
        print("Could not find end of block")
else:
    print("Could not find '// Finalize applied events'")

