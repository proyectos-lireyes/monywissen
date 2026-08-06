import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

search_post = """        body: JSON.stringify({
          name: cd.name,
          freq: cd.freq,
          hasInterest: cd.hasInterest,
          usePlan: cd.usePlan,
          color: cd.color,
        })"""

replace_post = """        body: JSON.stringify({
          name: cd.name,
          freq: cd.freq,
          dueDay: cd.dueDay || '1',
          hasInterest: cd.hasInterest,
          usePlan: cd.usePlan,
          color: cd.color,
        })"""

content = content.replace(search_post, replace_post)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)
