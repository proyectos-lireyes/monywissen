import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

# {item.type === 'card' ? '💳 Tarjeta de Crédito' : (item.type === 'cashea' ? '⭐ Cashea' : (item.type === 'quoota' ? '⭐ Quoota' : (item.type === 'fixed' ? '🏦 Préstamo Fijo' : '🤝 Sin Interés')))}
# Change to:
# {item.type === 'card' ? '💳 Tarjeta de Crédito' : (item.type === 'loan_interest' ? '🏦 Préstamo con Interés' : '🤝 Préstamo sin Interés')}

replace_from = "{item.type === 'card' ? '💳 Tarjeta de Crédito' : (item.type === 'cashea' ? '⭐ Cashea' : (item.type === 'quoota' ? '⭐ Quoota' : (item.type === 'fixed' ? '🏦 Préstamo Fijo' : '🤝 Sin Interés')))}"
replace_to = "{item.type === 'card' ? '💳 Tarjeta de Crédito' : (item.type === 'loan_interest' ? '🏦 Préstamo con Interés' : '🤝 Préstamo sin Interés')}"

content = content.replace(replace_from, replace_to)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)
