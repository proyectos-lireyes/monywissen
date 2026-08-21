import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("if (e.amt > 0 && e.type === 'income') chartDataMap[e.date].income += e.amt;", "if (e.amt > 0 && e.type === 'income') chartDataMap[e.date].income += e.amt;")
content = content.replace("if (e.amt > 0 && e.type === 'income') biweeklyDataMap[prefix].income += e.amt;", "if (e.amt > 0 && e.type === 'income') biweeklyDataMap[prefix].income += e.amt;")
content = content.replace("if (e.amt > 0 && e.type === 'income') weeklyDataMap[weekPrefix].income += e.amt;", "if (e.amt > 0 && e.type === 'income') weeklyDataMap[weekPrefix].income += e.amt;")
content = content.replace("if (e.amt > 0 && e.type === 'income') monthlyDataMap[monthPrefix].income += e.amt;", "if (e.amt > 0 && e.type === 'income') monthlyDataMap[monthPrefix].income += e.amt;")

# Wait, we changed the type to 'compensation' in financialEngine.ts, so e.type === 'income' already excludes 'compensation'! 
# Let me double check financialEngine.ts to be sure the type is actually 'compensation'.

