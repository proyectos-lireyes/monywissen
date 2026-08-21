import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """                                if (selected.startsWith('tdc_')) {
                                  if (customDef.cutDay) setCutDay(customDef.cutDay);
                                  if (customDef.dueDay) setDueDay(customDef.dueDay);
                                  else setDueDay('1');
                                }"""

replacement = """                                if (selected.startsWith('tdc_')) {
                                  if (customDef.cutDay) setCutDay(customDef.cutDay);
                                  if (customDef.dueDay) setDueDay(customDef.dueDay);
                                  else setDueDay('1');
                                  if (customDef.limitCurrency) setCurrency(customDef.limitCurrency);
                                }"""

content = content.replace(target, replacement)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

print("Success")
