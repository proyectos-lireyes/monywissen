import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """       for (const e of candidates) {
          if (balance + e.amt >= targetMin) {
             if (e.originalDate > d) {
                 e.pulledEarly = true;
             } else if (e.originalDate < d) {
                 e.isDelayed = true;
             }
             e.optimizedFrom = e.originalDate;
             applied.push({ ...e, date: d });
             balance += e.amt;
          } else {
             // If we can't pay it, it waits. Only mark it delayed if its original date has passed or is today.
             if (e.originalDate <= d) {
                 e.isDelayed = true;
                 e.optimizedFrom = e.originalDate;
                 newDelayed.push(e);
             }
             // If it's in the future, we just leave it alone so it gets processed naturally.
          }
       }"""

replacement = """       for (const e of candidates) {
          const isDue = e.originalDate <= d;
          const available = isDue ? balance + savingsAccumulated : balance;

          if (available + e.amt >= targetMin) {
             if (e.originalDate > d) {
                 e.pulledEarly = true;
             } else if (e.originalDate < d) {
                 e.isDelayed = true;
             }
             e.optimizedFrom = e.originalDate;
             applied.push({ ...e, date: d });
             balance += e.amt;
          } else {
             // If we can't pay it, it waits. Only mark it delayed if its original date has passed or is today.
             if (isDue) {
                 e.isDelayed = true;
                 e.optimizedFrom = e.originalDate;
                 newDelayed.push(e);
             }
             // If it's in the future, we just leave it alone so it gets processed naturally.
          }
       }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched flexible rescue")
else:
    print("Target not found")
