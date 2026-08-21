import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  balance = expensesBeforeFirstIncome + calculatedTargetMin;"""

replacement = """  balance = expensesBeforeFirstIncome + calculatedTargetMin;
  plan.push({
    date: startD,
    label: 'Saldo Inicial Base (Sistema)',
    type: 'opening_balance',
    amt: balance,
    ref: { id: 'opening_balance', name: 'Saldo Base', effectiveColor: '#94a3b8' },
    originalDate: startD,
    done: true,
    balance: balance,
    isDelayed: false,
    savingsAccumulated: 0
  });"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Re-added opening balance event")
else:
    print("Target not found")
