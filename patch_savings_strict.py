import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  // 4. Process Savings
  (profile.savingsList || []).forEach(sav => {
    if (sav.date >= startD && sav.date <= endD) {
      addOccurrence(sav.date, `Divisa/Ahorro: ${sav.person}`, 'savings', -convAmt(sav.amount, (sav as any).currency), sav);
    }
  });"""

replacement = """  // 4. Process Savings
  (profile.savingsList || []).forEach(sav => {
    if (sav.date >= startD && sav.date <= endD) {
      addOccurrence(sav.date, `Divisa/Ahorro: ${sav.person}`, 'savings', -convAmt(sav.amount, (sav as any).currency), { ...sav, strictDate: true });
    }
  });"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find target")

