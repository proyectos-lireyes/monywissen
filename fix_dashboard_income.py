import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("if (e.amt > 0) totalIncome += e.amt;", "if (e.amt > 0 && e.type !== 'compensation') totalIncome += e.amt;")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
