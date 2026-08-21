import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    remainingCandidates.forEach(e => {
      if (pendingBal + e.amt < (settings.minBalance || 0)) {
        e.insufficientFunds = true
      }
      applied.push(e);
      pendingBal += e.amt;
    });"""

replacement = """    remainingCandidates.forEach(e => {
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

if target in content:
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success Engine Delay")
else:
    print("Target not found in Engine")
