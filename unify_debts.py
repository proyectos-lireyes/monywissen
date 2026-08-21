import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

start_marker = "  // 3. Process Debts"
end_marker = "  // 4. Process Savings"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_block = """  // 3. Process Debts
  const customDebts = settings.customDebts || [];
  (profile.debts || []).forEach(debt => {
    const customDef = customDebts.find(c => c.id === debt.type);
    const effectiveColor = debt.color || (customDef ? customDef.color : (debt.type === 'fixed' ? '#1a73e8' : (debt.type === 'noloan' ? '#00897b' : '#d93025')));
    const debtRef = { ...debt, effectiveColor };

    if (!debt.start || !debt.amount) return;
    
    // Optional Cut day logic
    if ((debt.type === 'card' || debt.type.startsWith('tdc_')) && debt.cutDay) {
      const dStart = new Date((debt.start || startD) + 'T12:00:00');
      for (let y = dStart.getFullYear(); y <= endYear; y++) {
        for (let m = (y === dStart.getFullYear() ? dStart.getMonth() : 0); m <= (y === endYear ? endMonth : 11); m++) {
           const cutDate = getDateInMonth(y, m, debt.cutDay);
           if (cutDate >= (debt.start || startD) && cutDate <= endD) {
              addOccurrence(cutDate, `Corte: ${debt.name}`, 'debt_cut', 0, debtRef);
           }
        }
      }
    }

    const curr = new Date(debt.start + 'T12:00:00');
    const limitDate = debt.end ? new Date(debt.end + 'T12:00:00') : new Date(endD + 'T12:00:00');

    const plan = calculateAmortizationPlan(debt, overrides, customDebts, limitDate, exchangeRates);
    
    plan.forEach(cuota => {
      const expectedNative = cuota.expectedAmount;
      const requiredNative = cuota.requiredPay;

      if (cuota.isCoveredByExplicit) {
        addOccurrence(cuota.date, debt.name, 'debt', -convAmt(expectedNative, (debt as any).currency), debtRef);
      } else if (requiredNative > 0.01) {
        addOccurrence(cuota.date, debt.name, 'debt', -convAmt(requiredNative, (debt as any).currency), debtRef);
      }
    });
  });

"""

content = content[:start_idx] + new_block + content[end_idx:]

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
