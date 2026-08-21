import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Fix weekly data netAvailable
content = content.replace(
    "const weeklyData = Object.values(weeklyDataMap);",
    "Object.values(weeklyDataMap).forEach(d => { d.netAvailable = d.income - d.expense - d.debt; });\n  const weeklyData = Object.values(weeklyDataMap);"
)

# Fix monthly data netAvailable
content = content.replace(
    "const monthlyData = Object.values(monthlyDataMap);",
    "Object.values(monthlyDataMap).forEach(d => { d.netAvailable = d.income - d.expense - d.debt; });\n  const monthlyData = Object.values(monthlyDataMap);"
)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
