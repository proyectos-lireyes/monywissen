import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add optimized: 0
content = content.replace("expense: 0,", "expense: 0,\n          optimized: 0,")
# Also to the types:
content = content.replace("items: any[]; balance?: number }>", "items: any[]; balance?: number; optimized?: number }>")

# Now for each aggregation map, add optimized amount
# dailyDataMap:
content = content.replace("dailyDataMap[e.date].items.push(e);", "dailyDataMap[e.date].items.push(e);\n      if (e.pulledEarly) dailyDataMap[e.date].optimized += Math.abs(e.amt);")

content = content.replace("biweeklyDataMap[prefix].items.push(e);", "biweeklyDataMap[prefix].items.push(e);\n      if (e.pulledEarly) biweeklyDataMap[prefix].optimized += Math.abs(e.amt);")

content = content.replace("weeklyDataMap[weekPrefix].items.push(e);", "weeklyDataMap[weekPrefix].items.push(e);\n      if (e.pulledEarly) weeklyDataMap[weekPrefix].optimized += Math.abs(e.amt);")

content = content.replace("monthlyDataMap[monthPrefix].items.push(e);", "monthlyDataMap[monthPrefix].items.push(e);\n      if (e.pulledEarly) monthlyDataMap[monthPrefix].optimized += Math.abs(e.amt);")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

