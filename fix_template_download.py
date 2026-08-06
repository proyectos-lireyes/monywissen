import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

search = """        draft.settings.customDebts.push({
          id: `custom_${Date.now()}`,
          name: template.name,
          freq: template.freq,
          hasInterest: template.hasInterest,
          usePlan: template.usePlan,
          color: template.color
        });"""

replace = """        draft.settings.customDebts.push({
          id: `custom_${Date.now()}`,
          name: template.name,
          freq: template.freq,
          dueDay: template.dueDay || '1',
          hasInterest: template.hasInterest,
          usePlan: template.usePlan,
          color: template.color
        });"""

content = content.replace(search, replace)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)
