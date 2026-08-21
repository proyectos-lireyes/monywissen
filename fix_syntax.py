import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    const calculatedTargetMin = settings.minBalance || 0;
  balance = expensesBeforeFirstIncome + calculatedTargetMin;
  });
  for (const d of datesBetween(startD, endD)) {"""

replacement = """    const calculatedTargetMin = settings.minBalance || 0;
  balance = expensesBeforeFirstIncome + calculatedTargetMin;

  for (const d of datesBetween(startD, endD)) {"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Fixed syntax error")
else:
    print("Target not found")
