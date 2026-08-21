import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    if (applied.length > 0) {
      plan.push({
        date: d,
        balance,
        items: applied,
        savingsAccumulated,
      });
    }
  }

  return plan;"""

replacement = """    if (applied.length > 0) {
      plan.push({
        date: d,
        balance,
        items: applied,
        savingsAccumulated,
      });
    }
    
    // If it's the last day and we still have delayed items, force them into the plan so they aren't lost
    if (d === endD && delayedItems.length > 0) {
        delayedItems.forEach(e => {
            balance += e.amt; // they will break the cushion, but we must show them
        });
        plan.push({
            date: d,
            balance,
            items: delayedItems,
            savingsAccumulated
        });
    }
  }

  return plan;"""

if target in content:
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success Engine End")
else:
    print("Target not found in Engine End")
