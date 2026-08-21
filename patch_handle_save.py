import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("receiptImg: receiptImg || undefined,", "receiptImg: receiptImg || undefined,\n          strictDate,")

content = content.replace("hasInterest: (debtType === 'loan_interest' || isTdc || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,", "hasInterest: (debtType === 'loan_interest' || isTdc || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,\n          strictDate,")

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

