import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    // Auto-save logic if balance exceeds threshold"""

replacement = """    // Auto-withdraw from savings if balance drops below minimum
    const targetMin = settings.minBalance || 0;
    if (balance < targetMin && savingsAccumulated > 0) {
      const deficit = targetMin - balance;
      const amountToWithdraw = Math.min(deficit, savingsAccumulated);
      
      balance += amountToWithdraw;
      savingsAccumulated -= amountToWithdraw;
      
      plan.push({
        date: d,
        label: 'Rescate de Ahorros (Fondo de Emergencia)',
        type: 'income', // Treated as income to boost balance back
        amt: amountToWithdraw,
        ref: { id: `autowithdraw_${d}`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
        originalDate: d,
        done: d <= todayStr(),
        balance,
        isDelayed: false,
        insufficientFunds: false,
        criticalDelay: false,
        savingsAccumulated,
      });
    }

    // Auto-save logic if balance exceeds threshold"""

content = content.replace(target, replacement)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
