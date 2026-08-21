import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  // 5. Day-by-Day Cash Flow Simulation with forward-first optimization model
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];
  let savingsAccumulated = 0;
  let futureEvents: any[] = [];
  for (const d of datesBetween(startD, endD)) {
     futureEvents.push(...(map[d] || []));
  }"""

replacement = """  // 5. Day-by-Day Cash Flow Simulation with forward-first optimization model
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];
  let savingsAccumulated = 0;
  let futureEvents: any[] = [];
  
  const allDatesList = datesBetween(startD, endD);
  for (const d of allDatesList) {
     futureEvents.push(...(map[d] || []));
  }

  // Auto-calculate Required Initial Balance
  let expensesBeforeFirstIncome = 0;
  for (const d of allDatesList) {
    const dayEvts = map[d] || [];
    const hasIncome = dayEvts.some(e => e.amt > 0 && e.type !== 'compensation');
    if (hasIncome) break;
    expensesBeforeFirstIncome += dayEvts.filter(e => e.amt < 0 && e.type !== 'savings').reduce((sum, e) => sum + Math.abs(e.amt), 0);
  }
  
  const targetMin = settings.minBalance || 0;
  balance = expensesBeforeFirstIncome + targetMin;
  
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

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched financialEngine plan generation")
else:
    print("Target not found Engine")

