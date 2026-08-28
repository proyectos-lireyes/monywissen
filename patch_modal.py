import re

with open('src/components/modals/OccurrenceDetailModal.tsx', 'r') as f:
    content = f.read()

target = """    if (type === 'income') {
      targetItem = (profile.incomes || []).find(i => i.id === refId);
      if (targetItem) {
        itemTitle = targetItem.name;
        baseAmount = parseFloat(targetItem.amount || 0);
        itemCurrency = targetItem.currency || 'USD_BCV';
      }
    } else if (type === 'expense') {"""

replacement = """    if (type === 'income') {
      targetItem = (profile.incomes || []).find(i => i.id === refId);
      if (targetItem) {
        itemTitle = targetItem.name;
        baseAmount = parseFloat(targetItem.amount || 0);
        itemCurrency = targetItem.currency || 'USD_BCV';
      } else if (refId?.startsWith('autowithdraw_')) {
        const plan = calculateProjections(profile, exchangeRates);
        const occurrence = plan.find(p => p.ref.id === refId && p.type === 'income' && p.originalDate === originalDate);
        if (occurrence) {
           itemTitle = occurrence.label || 'Rescate de Ahorros';
           baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
           itemCurrency = 'USD_BCV';
        }
      }
    } else if (type === 'expense') {"""

target2 = """    } else if (type === 'income' && refId?.startsWith('autowithdraw_')) {
      const plan = calculateProjections(profile, exchangeRates);
      const occurrence = plan.find(p => p.ref.id === refId && p.type === 'income' && p.originalDate === originalDate);
      if (occurrence) {
         itemTitle = occurrence.label || 'Rescate de Ahorros';
         baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
         itemCurrency = 'USD_BCV';
      }
    } else if (type === 'compensation') {"""

replacement2 = """    } else if (type === 'compensation') {"""

if target in content and target2 in content:
    content = content.replace(target, replacement)
    content = content.replace(target2, replacement2)
    with open('src/components/modals/OccurrenceDetailModal.tsx', 'w') as f:
        f.write(content)
    print("Patched OccurrenceDetailModal")
else:
    print("Target not found")
