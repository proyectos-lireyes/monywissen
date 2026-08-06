import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# remove customDebts initial array
replace_from = """          customDebts: [
            { id: 'cashea', name: 'Cashea', freq: 'biweekly', hasInterest: false, usePlan: true, color: '#fbbc04' },
            { id: 'quoota', name: 'Quoota', freq: 'biweekly', hasInterest: false, usePlan: true, color: '#e8710a' }
          ],"""

replace_to = """          customDebts: [],"""

content = content.replace(replace_from, replace_to)
with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
