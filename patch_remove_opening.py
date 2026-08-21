import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    const calculatedTargetMin = settings.minBalance || 0;
  balance = expensesBeforeFirstIncome + calculatedTargetMin;
  
  plan.push({
    date: startD,
    label: 'Saldo Inicial (Calculado)',
    type: 'opening_balance',
    amt: balance,
    ref: { id: 'opening_balance', name: 'Saldo Inicial', effectiveColor: '#64748b' },
    originalDate: startD,
    done: true,
    balance: balance,
    isDelayed: false,
    savingsAccumulated: 0
  });"""

replacement = """    const calculatedTargetMin = settings.minBalance || 0;
  balance = expensesBeforeFirstIncome + calculatedTargetMin;"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Removed opening balance event")
else:
    print("Target not found")
