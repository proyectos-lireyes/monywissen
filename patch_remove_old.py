import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  // --- Auto-compensate start balance before first income ---
  let firstIncomeDate: string | null = null;
  for (const d of datesBetween(startD, endD)) {
    if ((map[d] || []).some(e => e.type === 'income' && e.amt > 0)) {
      firstIncomeDate = d;
      break;
    }
  }

  let tempBalance = balance;
  if (firstIncomeDate) {
    for (const d of datesBetween(startD, firstIncomeDate)) {
      if (d === firstIncomeDate) break;
      const dayEvents = map[d] || [];
      dayEvents.forEach(e => { tempBalance += e.amt; });
    }
  } else {
    // If no income in the whole period, just calculate based on start balance
  }

  const targetMin = settings.minBalance || 0;
  // We want: tempBalance + compensation = targetMin -> right before first income
  const compensation = targetMin - tempBalance;
  
  if (Math.abs(compensation) > 0.01) {
    if (!map[startD]) map[startD] = [];
    map[startD].unshift({
      label: 'Ajuste Inicial de Período',
      type: 'compensation',
      amt: compensation,
      ref: { id: `comp_${startD}`, name: 'Ajuste Inicial', effectiveColor: '#64748b' },
      originalDate: startD,
      done: startD <= todayStr(),
      plannedAmt: compensation,
      userPostponed: false
    });
  }"""

if target in content:
    content = content.replace(target, "")
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Removed old compensation logic")
else:
    print("Target not found")
