import re

with open('src/components/modals/OccurrenceDetailModal.tsx', 'r') as f:
    content = f.read()

target = """      }
    } else if (type === 'compensation') {"""

replacement = """      } else if (refId?.startsWith('autosave_')) {
        const plan = calculateProjections(profile, exchangeRates);
        const occurrence = plan.find(p => p.ref.id === refId && p.type === 'savings' && p.originalDate === originalDate);
        if (occurrence) {
           itemTitle = occurrence.label || 'Ahorro Automático';
           baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
           itemCurrency = 'USD_BCV';
        }
      }
    } else if (type === 'income' && refId?.startsWith('autowithdraw_')) {
      const plan = calculateProjections(profile, exchangeRates);
      const occurrence = plan.find(p => p.ref.id === refId && p.type === 'income' && p.originalDate === originalDate);
      if (occurrence) {
         itemTitle = occurrence.label || 'Rescate de Ahorros';
         baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
         itemCurrency = 'USD_BCV';
      }
    } else if (type === 'compensation') {"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/modals/OccurrenceDetailModal.tsx', 'w') as f:
        f.write(content)
    print("Patched modal")
else:
    print("Target not found in modal")
