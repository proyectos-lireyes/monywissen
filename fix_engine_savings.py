import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  // 5. Day-by-Day Cash Flow Simulation with Liquidity Cushion
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];
  for (const d of datesBetween(startD, endD)) {"""

replacement = """  // 5. Day-by-Day Cash Flow Simulation with Liquidity Cushion
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];
  let savingsAccumulated = 0;
  for (const d of datesBetween(startD, endD)) {"""

content = content.replace(target, replacement)

target2 = """    applied.forEach(e => {
      balance += e.amt;
      const isDelayed = !!(e.originalDate && e.originalDate < d && !e.done);
      plan.push({
        date: d,
        ...e,
        balance,
        isDelayed,
        insufficientFunds: e.insufficientFunds || false,
        criticalDelay: false,
      });
    });
  }"""

replacement2 = """    applied.forEach(e => {
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
    });
    
    // Auto-save logic if balance exceeds threshold
    if (settings.autoSaveThreshold && settings.autoSaveThreshold > 0 && balance > settings.autoSaveThreshold) {
      const excess = balance - settings.autoSaveThreshold;
      balance = settings.autoSaveThreshold;
      savingsAccumulated += excess;
      plan.push({
        date: d,
        label: 'Ahorro Automático (Excedente)',
        type: 'savings',
        amt: -excess,
        ref: { id: `autosave_${d}`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
        originalDate: d,
        done: true,
        balance,
        isDelayed: false,
        insufficientFunds: false,
        criticalDelay: false,
        savingsAccumulated,
      });
    }
  }"""

content = content.replace(target2, replacement2)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
