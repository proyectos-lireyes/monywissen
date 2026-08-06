import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

search_card = """      const pay = parseFloat(String(debt.minPay || debt.balance || 0));
      const maxOccurrences = debt.plan === 'full' ? 1 : (parseInt(String(debt.plan || '').split('-')[1], 10) || 9999);"""

replace_card = """      const pay = parseFloat(String(debt.minPay || debt.balance || 0));
      const maxOccurrences = debt.installments ? parseInt(String(debt.installments), 10) : (debt.plan === 'full' ? 1 : (parseInt(String(debt.plan || '').split('-')[1], 10) || 1));"""

content = content.replace(search_card, replace_card)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)
