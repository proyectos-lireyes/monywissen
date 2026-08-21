import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target1 = """    remainingCandidates.forEach(e => {
      // If it's an expense or savings and it drops balance below minimum
      if (e.amt < 0 && pendingBal + e.amt < (settings.minBalance || 0)) {
        e.insufficientFunds = true;
        // Delay it to the next day, UNLESS it's already marked as done
        if (!e.done) {
            delayedItems.push(e);
        } else {
            applied.push(e);
            pendingBal += e.amt;
        }
      } else {
        applied.push(e);
        pendingBal += e.amt;
      }
    });"""

replacement1 = """    remainingCandidates.forEach(e => {
      // If it's an expense or savings and it drops balance below minimum
      if (e.amt < 0 && pendingBal + e.amt < (settings.minBalance || 0)) {
        e.insufficientFunds = true;
        // Delay it to the next day, UNLESS it's already marked as done
        if (!e.done) {
            e.delayCount = (e.delayCount || 0) + 1;
            if (e.delayCount > 3) {
                // If it has been delayed for more than 3 days, force apply it to trigger critical alert
                e.criticalDelay = true;
                applied.push(e);
                pendingBal += e.amt;
            } else {
                delayedItems.push(e);
            }
        } else {
            applied.push(e);
            pendingBal += e.amt;
        }
      } else {
        applied.push(e);
        pendingBal += e.amt;
      }
    });"""

target2 = """      plan.push({
        date: d,
        ...e,
        balance,
        isDelayed,
        insufficientFunds: e.insufficientFunds || false,
        criticalDelay: false,
        savingsAccumulated,
      });"""

replacement2 = """      plan.push({
        date: d,
        ...e,
        balance,
        isDelayed,
        insufficientFunds: e.insufficientFunds || false,
        criticalDelay: e.criticalDelay || false,
        savingsAccumulated,
      });"""

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Success 3 days")
else:
    print("Target not found")
    if target1 not in content: print("target1 failed")
    if target2 not in content: print("target2 failed")
