import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Replace: if (e.amt > 0 && e.type === 'income')
# With: if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation'))
content = content.replace("if (e.amt > 0 && e.type === 'income')", "if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation'))")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
