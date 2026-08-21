import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    if (hasIncomeToday && balance > targetMin) {
       const excess = balance - targetMin;
       balance = targetMin;
       savingsAccumulated += excess;
       plan.push({
         date: d,
         label: 'Ahorro Automático (Excedente pre-ingreso)',
         type: 'savings',
         amt: -excess,
         ref: { id: `autosave_${d}`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
         originalDate: d,
         done: overrides[`savings_autosave_${d}_${d}`] ? !!overrides[`savings_autosave_${d}_${d}`].done : false,
         balance,
         isDelayed: false,
         savingsAccumulated,
       });
    }"""

replacement = """    if (hasIncomeToday && balance > targetMin) {
       const autosaveKey = `savings_autosave_${d}_${d}`;
       const isDiscarded = overrides[autosaveKey] && overrides[autosaveKey].discarded;
       
       if (!isDiscarded) {
           const excess = balance - targetMin;
           balance = targetMin;
           savingsAccumulated += excess;
           plan.push({
             date: d,
             label: 'Ahorro Automático (Excedente pre-ingreso)',
             type: 'savings',
             amt: -excess,
             ref: { id: `autosave_${d}`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
             originalDate: d,
             done: overrides[autosaveKey] ? !!overrides[autosaveKey].done : false,
             balance,
             isDelayed: false,
             savingsAccumulated,
           });
       }
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patch applied successfully.")
else:
    print("Could not find target block.")

