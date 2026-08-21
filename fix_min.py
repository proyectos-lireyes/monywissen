import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  const targetMin = settings.minBalance || 0;
  balance = expensesBeforeFirstIncome + targetMin;"""

replacement = """  const calculatedTargetMin = settings.minBalance || 0;
  balance = expensesBeforeFirstIncome + calculatedTargetMin;"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Fixed variable name conflict")
else:
    print("Target not found")
