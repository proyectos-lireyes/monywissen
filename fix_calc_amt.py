import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search_calc = """        if (calculatedAmount === 0 && bal > 0) {
            if (debtType === 'loan_interest' && parseFloat(String(apr) || '0') > 0) {
                calculatedAmount = (bal * (1 + (parseFloat(String(apr))/100))) / inst;
            } else {
                calculatedAmount = bal / inst;
            }
        }"""

replace_calc = """        if (calculatedAmount === 0 && bal > 0) {
            const hasInt = debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
            if (hasInt && parseFloat(String(apr) || '0') > 0) {
                const r = (parseFloat(String(apr)) / 100) / 12;
                calculatedAmount = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
            } else {
                calculatedAmount = bal / inst;
            }
        }"""

content = content.replace(search_calc, replace_calc)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

