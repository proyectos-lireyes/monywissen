with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """        const item: DebtItem = {
          id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
          name,
          color: color || undefined,
          type: debtType,
          balance: bal,
          amount: calculatedAmount,
          minPay: calculatedAmount,
          installments: parseInt(String(installments), 10) || 1,
          start: date,
          currency: currency as any,
          cutDay: debtType === 'card' ? parseInt(String(cutDay), 10) || 5 : undefined,
          dueDay: finalDueDay,
          freq: debtType === 'card' ? 'monthly' : freq,
          apr: apr ? parseFloat(String(apr)) : undefined,
          amortized: parseFloat(String(amortized)) || undefined,
          hasInterest: (debtType === 'loan_interest' || debtType === 'card' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,
        };"""

replacement = """        const item: DebtItem = {
          id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
          name,
          color: color || undefined,
          type: debtType,
          balance: bal,
          amount: calculatedAmount,
          minPay: calculatedAmount,
          installments: actualInst,
          start: date,
          currency: currency as any,
          cutDay: isTdc ? (parseInt(String(cutDay), 10) || 5) : undefined,
          dueDay: finalDueDay,
          freq: freq,
          apr: apr ? parseFloat(String(apr)) : undefined,
          amortized: parseFloat(String(amortized)) || undefined,
          hasInterest: (debtType === 'loan_interest' || isTdc || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,
        };"""

content = content.replace(target, replacement)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

print('Success')
