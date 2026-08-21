import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """                             const customDef = profile.settings.customDebts?.find(d => d.id === selected);
                             if (customDef) {
                                if (!name) setName(customDef.name);
                                if (!color) setColor(customDef.color || '');
                                const newFreq = customDef.freq as any || 'monthly';
                                setFreq(newFreq);
                                let dDueDay = '1';
                                if (newFreq === 'biweekly') dDueDay = '15-30';
                                if (newFreq === 'triweekly') dDueDay = '3';
                                setDueDay(dDueDay);
                             } else {"""

replacement = """                             const customDef = profile.settings.customDebts?.find(d => d.id === selected);
                             if (customDef) {
                                if (!name) setName(customDef.name);
                                if (!color) setColor(customDef.color || '');
                                const newFreq = customDef.freq as any || 'monthly';
                                setFreq(newFreq);
                                
                                if (selected.startsWith('tdc_')) {
                                  if (customDef.cutDay) setCutDay(customDef.cutDay);
                                  if (customDef.dueDay) setDueDay(customDef.dueDay);
                                  else setDueDay('1');
                                } else {
                                  let dDueDay = customDef.dueDay || '1';
                                  if (!customDef.dueDay) {
                                    if (newFreq === 'biweekly') dDueDay = '15-30';
                                    if (newFreq === 'triweekly') dDueDay = '3';
                                  }
                                  setDueDay(dDueDay);
                                }
                             } else {"""

content = content.replace(target, replacement)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

print("Success")
