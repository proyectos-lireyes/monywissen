import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = "if (e.type === 'savings' && e.label !== 'Ahorro Automático (Excedente pre-ingreso)') {"
replacement = "if (e.type === 'savings') {"

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Cleaned up financialEngine.ts")

with open('src/components/modals/OccurrenceDetailModal.tsx', 'r') as f:
    content = f.read()

target_modal = """      } else if (refId?.startsWith('autosave_')) {
        const plan = calculateProjections(profile, exchangeRates);
        const occurrence = plan.find(p => p.ref.id === refId && p.type === 'savings' && p.originalDate === originalDate);
        if (occurrence) {
           itemTitle = occurrence.label || 'Ahorro Automático';
           baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
           itemCurrency = 'USD_BCV';
        }
      }"""

if target_modal in content:
    content = content.replace(target_modal, "      }")
    with open('src/components/modals/OccurrenceDetailModal.tsx', 'w') as f:
        f.write(content)
    print("Cleaned up OccurrenceDetailModal.tsx")

