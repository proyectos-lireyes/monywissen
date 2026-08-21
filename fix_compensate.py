import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  // 5. Day-by-Day Cash Flow Simulation with Liquidity Cushion"""

replacement = """  // --- Auto-compensate start balance before first income ---
  let firstIncomeDate: string | null = null;
  for (const d of datesBetween(startD, endD)) {
    if ((map[d] || []).some(e => e.type === 'income' && e.amt > 0)) {
      firstIncomeDate = d;
      break;
    }
  }

  const compensateUntil = firstIncomeDate || endD;
  
  let tempBalance = balance;
  let minTempBalance = balance;
  for (const d of datesBetween(startD, compensateUntil)) {
    if (d === firstIncomeDate) break;
    const dayEvents = map[d] || [];
    let dayNet = 0;
    dayEvents.forEach(e => { dayNet += e.amt; });
    tempBalance += dayNet;
    if (tempBalance < minTempBalance) minTempBalance = tempBalance;
  }
  
  const targetMin = settings.minBalance || 0;
  if (minTempBalance < targetMin) {
    const deficit = targetMin - minTempBalance;
    if (!map[startD]) map[startD] = [];
    map[startD].unshift({
      label: 'Fondo Inicial (Compensación)',
      type: 'income',
      amt: deficit,
      ref: { id: `comp_${startD}`, name: 'Fondo Inicial', effectiveColor: '#0ea5e9' },
      originalDate: startD,
      done: startD <= todayStr(),
      plannedAmt: deficit,
      userPostponed: false
    });
  }

  // 5. Day-by-Day Cash Flow Simulation with Liquidity Cushion"""

content = content.replace(target, replacement)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
