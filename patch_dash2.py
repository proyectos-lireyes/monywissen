import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = """    if (e.amt > 0 && e.type !== 'compensation') totalIncome += e.amt;"""
replacement = """    if (e.amt > 0 && e.type !== 'compensation' && e.type !== 'opening_balance') totalIncome += e.amt;"""

content = content.replace(target, replacement)

target2 = """      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation'))"""
replacement2 = """      if (e.amt > 0 && (e.type === 'income'))"""

content = content.replace(target2, replacement2)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Patched DashboardView metrics")
