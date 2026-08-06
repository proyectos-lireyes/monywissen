import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search_item = """        const item: DebtItem = {
          id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
          name,
          type: debtType,
          balance: parseFloat(String(balance)) || numAmt,
          amount: calculatedAmount,
          minPay: calculatedAmount,
          installments: parseInt(String(installments), 10) || 1,
          start: date,
          currency: currency as any,
          cutDay: debtType === 'card' ? parseInt(String(cutDay), 10) || 5 : undefined,
          dueDay: finalDueDay,
          freq: debtType === 'card' ? 'monthly' : freq,
          apr: apr ? parseFloat(String(apr)) : undefined,
        };"""

replace_item = """        const item: DebtItem = {
          id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
          name,
          type: debtType,
          balance: parseFloat(String(balance)) || numAmt,
          amount: calculatedAmount,
          minPay: calculatedAmount,
          installments: parseInt(String(installments), 10) || 1,
          start: date,
          currency: currency as any,
          cutDay: debtType === 'card' ? parseInt(String(cutDay), 10) || 5 : undefined,
          dueDay: finalDueDay,
          freq: debtType === 'card' ? 'monthly' : freq,
          apr: apr ? parseFloat(String(apr)) : undefined,
          hasInterest: (debtType === 'loan_interest' || debtType === 'card' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,
        };"""

content = content.replace(search_item, replace_item)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
