import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    applied.forEach(e => {
      balance += e.amt;
      const isDelayed = !!(e.originalDate && e.originalDate < d && !e.done);
      plan.push({
        date: d,
        ...e,
        balance,
        isDelayed,
        insufficientFunds: e.insufficientFunds || false,
        criticalDelay: false,
        savingsAccumulated,
      });
    });"""

replacement = """    applied.forEach(e => {
      balance += e.amt;
      if (e.type === 'savings') {
        savingsAccumulated += Math.abs(e.amt);
      }
      const isDelayed = !!(e.originalDate && e.originalDate < d && !e.done);
      plan.push({
        date: d,
        ...e,
        balance,
        isDelayed,
        insufficientFunds: e.insufficientFunds || false,
        criticalDelay: false,
        savingsAccumulated,
      });
    });"""

content = content.replace(target, replacement)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
