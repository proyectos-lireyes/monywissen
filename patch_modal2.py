import re

with open('src/components/modals/OccurrenceDetailModal.tsx', 'r') as f:
    content = f.read()

target_block = """      } else if (refId?.startsWith('autosave_')) {
        const plan = calculateProjections(profile, exchangeRates);
        const occurrence = plan.find(p => p.ref.id === refId && p.type === 'savings' && p.originalDate === originalDate);
        if (occurrence) {
           itemTitle = occurrence.label || 'Ahorro Automático';
           baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
           itemCurrency = 'USD_BCV';
        }
      }
    }
  }"""

new_block = """      } else if (refId?.startsWith('autosave_')) {
        const plan = calculateProjections(profile, exchangeRates);
        const occurrence = plan.find(p => p.ref.id === refId && p.type === 'savings' && p.originalDate === originalDate);
        if (occurrence) {
           itemTitle = occurrence.label || 'Ahorro Automático';
           baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
           itemCurrency = 'USD_BCV';
        }
      }
    } else if (type === 'compensation') {
      const plan = calculateProjections(profile, exchangeRates);
      const occurrence = plan.find(p => p.type === 'compensation' && p.originalDate === originalDate);
      if (occurrence) {
         itemTitle = occurrence.label;
         baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
         itemCurrency = 'USD_BCV';
      }
    }
  }"""

content = content.replace(target_block, new_block)

with open('src/components/modals/OccurrenceDetailModal.tsx', 'w') as f:
    f.write(content)
