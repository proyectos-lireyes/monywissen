import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

target = "form: { name: 'Tarjeta de Crédito', freq: 'monthly', dueDay: '1', hasInterest: true, usePlan: false, color: '#1a73e8' }"
replacement = "form: { name: 'Tarjeta de Crédito', freq: 'monthly', dueDay: '15', cutDay: '5', creditLimit: '', isCreditCard: true, hasInterest: true, usePlan: false, color: '#1a73e8' }"

content = content.replace(target, replacement)

# We also need to fix `setCustomDebtForm({ ...preset.form })` so it merges or provides defaults for the omitted fields, 
# because if someone clicks a non-credit-card preset, we don't want it to lose the defaults.
# Actually, since `isCreditCard` will be undefined, it's falsy, which is fine, but it might be better to explicitly spread defaults.
target2 = "setCustomDebtForm({ ...preset.form });"
replacement2 = "setCustomDebtForm({ isCreditCard: false, cutDay: '5', creditLimit: '', ...preset.form });"

content = content.replace(target2, replacement2)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)

print("Success")
