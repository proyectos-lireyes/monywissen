import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

# in handleSave:
# const numAmt = parseFloat(String(amount)) || 0;
# we want to modify this or the debt section:
# const item: DebtItem = {
#    id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
#    name,
#    type: debtType,
#    balance: parseFloat(String(balance)) || numAmt,
#    amount: numAmt,

# replace:
replace_from = """      } else if (type === 'debt') {
        const finalDueDay = freq === 'biweekly' ? dueDay : (dueDay || day);
        const item: DebtItem = {"""

replace_to = """      } else if (type === 'debt') {
        const finalDueDay = freq === 'biweekly' ? dueDay : (dueDay || day);
        
        let calculatedAmount = numAmt;
        const bal = parseFloat(String(balance)) || numAmt;
        const inst = parseInt(String(installments), 10) || 1;
        
        if (calculatedAmount === 0 && bal > 0) {
            if (debtType === 'loan_interest' && parseFloat(String(apr) || '0') > 0) {
                calculatedAmount = (bal * (1 + (parseFloat(String(apr))/100))) / inst;
            } else {
                calculatedAmount = bal / inst;
            }
        }

        const item: DebtItem = {"""

content = content.replace(replace_from, replace_to)

replace_from_amount = """          amount: numAmt,
          minPay: numAmt,"""

replace_to_amount = """          amount: calculatedAmount,
          minPay: calculatedAmount,"""

content = content.replace(replace_from_amount, replace_to_amount)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
