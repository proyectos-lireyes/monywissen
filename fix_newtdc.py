import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """                                const newTDC = {
                                  id: `tdc_${Date.now()}`,
                                  name: name,
                                  freq: freq,
                                  hasInterest: true,
                                  usePlan: true,
                                  color: color || '#f59e0b',
                                  cutDay: parseInt(String(cutDay), 10) || 5,
                                  dueDay: dueDay,
                                  apr: parseFloat(String(apr)) || 60
                                };"""

replacement = """                                const newTDC = {
                                  id: `tdc_${Date.now()}`,
                                  name: name,
                                  freq: freq,
                                  hasInterest: true,
                                  usePlan: true,
                                  color: color || '#f59e0b',
                                  cutDay: parseInt(String(cutDay), 10) || 5,
                                  dueDay: dueDay,
                                  apr: parseFloat(String(apr)) || 60,
                                  isCreditCard: true,
                                  creditLimit: parseFloat(String(balance)) || 0
                                };"""

content = content.replace(target, replacement)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

print("Success")
