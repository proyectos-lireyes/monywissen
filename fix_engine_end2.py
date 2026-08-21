import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    if (settings.autoSaveThreshold && settings.autoSaveThreshold > 0 && balance > settings.autoSaveThreshold && (hasIncomeTomorrow || isLastDay)) {
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
        done: overrides[`savings_autosave_${d}_${d}`] ? !!overrides[`savings_autosave_${d}_${d}`].done : false,
        balance,
        isDelayed: false,
        insufficientFunds: false,
        criticalDelay: false,
        savingsAccumulated,
      });
    }
  }

  return plan;"""

replacement = """    if (settings.autoSaveThreshold && settings.autoSaveThreshold > 0 && balance > settings.autoSaveThreshold && (hasIncomeTomorrow || isLastDay)) {
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
        done: overrides[`savings_autosave_${d}_${d}`] ? !!overrides[`savings_autosave_${d}_${d}`].done : false,
        balance,
        isDelayed: false,
        insufficientFunds: false,
        criticalDelay: false,
        savingsAccumulated,
      });
    }
    
    // If it's the last day and we still have delayed items, force them into the plan so they aren't lost
    if (isLastDay && delayedItems.length > 0) {
      delayedItems.forEach(e => {
        balance += e.amt; // they will break the cushion, but we must show them
        plan.push({
          date: d,
          ...e,
          balance,
          isDelayed: true,
          insufficientFunds: true,
          criticalDelay: true,
          savingsAccumulated
        });
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
