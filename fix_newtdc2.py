import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """                                  isCreditCard: true,
                                  creditLimit: parseFloat(String(balance)) || 0
                                };"""

replacement = """                                  isCreditCard: true,
                                  creditLimit: parseFloat(String(balance)) || 0,
                                  limitCurrency: currency
                                };"""

content = content.replace(target, replacement)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

print("Success")
