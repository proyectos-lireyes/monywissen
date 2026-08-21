import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  let unallocatedPaid = amort;
  let remainingPrincipal = lifetimeTotal - totalPaid;"""

replacement = """  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  
  // Calculate off-schedule payments to treat them as unallocated
  const expectedDates = new Set<string>();
  let tempCurr = new Date((debt.start || new Date().toISOString().slice(0, 10)) + 'T12:00:00');
  for (let i = 0; i < inst; i++) {
    expectedDates.add(tempCurr.toISOString().slice(0, 10));
    if (freq === 'weekly') {
      tempCurr.setDate(tempCurr.getDate() + 7);
    } else if (freq === 'triweekly') {
      tempCurr.setDate(tempCurr.getDate() + 21);
    } else if (freq === 'monthly') {
      let currentMonth = tempCurr.getMonth();
      tempCurr.setMonth(currentMonth + 1);
      const d1 = parseInt(String(debt.dueDay || 1), 10) || 1;
      tempCurr.setDate(d1);
    } else {
      const parts = String(debt.dueDay || "15-30").split('-');
      const d1 = parseInt(parts[0], 10) || 15;
      const d2 = parseInt(parts[1], 10) || 30;
      if (tempCurr.getDate() === d1) {
        tempCurr.setDate(d2);
      } else {
        tempCurr.setMonth(tempCurr.getMonth() + 1);
        tempCurr.setDate(d1);
      }
    }
  }

  let offSchedulePaid = 0;
  Object.keys(overrides).forEach(k => {
    if (k.startsWith(`debt_${debt.id}_`)) {
      const dateStr = k.split('_')[2];
      if (dateStr && !expectedDates.has(dateStr)) {
        const ov = overrides[k];
        const pSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(debt, parseFloat(String(pt.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates), 0);
        if (ov.done || ov.discarded) {
          const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
          let finalAmt = 0;
          if (amtUsd !== undefined) {
             finalAmt = getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates);
          } else {
             const defaultPay = parseFloat(String(debt.minPay || debt.amount || 0));
             finalAmt = Math.max(0, defaultPay - pSum);
          }
          offSchedulePaid += (finalAmt + pSum);
        } else {
          offSchedulePaid += pSum;
        }
      }
    }
  });

  let unallocatedPaid = amort + offSchedulePaid;
  let remainingPrincipal = lifetimeTotal - totalPaid;"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched calculateAmortizationPlan for unallocatedPaid")
else:
    print("Target not found")
