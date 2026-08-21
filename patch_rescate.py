import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    // Auto-withdraw from savings if strict items broke the cushion
    if (balance < targetMin && savingsAccumulated > 0) {
      const deficit = targetMin - balance;
      const amountToWithdraw = Math.min(deficit, savingsAccumulated);
      balance += amountToWithdraw;
      savingsAccumulated -= amountToWithdraw;
      
      plan.push({
        date: d,
        label: 'Rescate de Ahorros',
        type: 'income',
        amt: amountToWithdraw,
        ref: { id: `autowithdraw_${d}`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
        originalDate: d,
        done: overrides[`income_autowithdraw_${d}_${d}`] ? !!overrides[`income_autowithdraw_${d}_${d}`].done : false,
        balance,
        isDelayed: false,
        insufficientFunds: false,
        savingsAccumulated,
      });
    }"""

if target in content:
    content = content.replace(target, "")
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patch applied to financialEngine.ts (Rescate)")
else:
    print("Could not find target in financialEngine.ts")

