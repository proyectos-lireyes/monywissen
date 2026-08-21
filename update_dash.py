import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# 1. We will completely replace the rendering of ComposedChart blocks.
# Let's find where the ResponsiveContainer starts and ends for the main chart.
# Actually it's better to just replace the whole main chart div.

# But first, I need to add deficit to the maps.
# Let's update the type
content = content.replace("optimized?: number }>", "optimized?: number; deficit?: number }>")

# Update the maps initializations
content = content.replace("optimized: 0,", "optimized: 0,\n          deficit: 0,")

# Update aggregation pushes
content = content.replace("if (e.pulledEarly) dailyDataMap[e.date].optimized += Math.abs(e.amt);", "if (e.pulledEarly) dailyDataMap[e.date].optimized += Math.abs(e.amt);\n      if (e.insufficientFunds && e.amt < 0) dailyDataMap[e.date].deficit += Math.abs(e.amt);")

content = content.replace("if (e.pulledEarly) biweeklyDataMap[prefix].optimized += Math.abs(e.amt);", "if (e.pulledEarly) biweeklyDataMap[prefix].optimized += Math.abs(e.amt);\n      if (e.insufficientFunds && e.amt < 0) biweeklyDataMap[prefix].deficit += Math.abs(e.amt);")

content = content.replace("if (e.pulledEarly) weeklyDataMap[weekPrefix].optimized += Math.abs(e.amt);", "if (e.pulledEarly) weeklyDataMap[weekPrefix].optimized += Math.abs(e.amt);\n      if (e.insufficientFunds && e.amt < 0) weeklyDataMap[weekPrefix].deficit += Math.abs(e.amt);")

content = content.replace("if (e.pulledEarly) monthlyDataMap[monthPrefix].optimized += Math.abs(e.amt);", "if (e.pulledEarly) monthlyDataMap[monthPrefix].optimized += Math.abs(e.amt);\n      if (e.insufficientFunds && e.amt < 0) monthlyDataMap[monthPrefix].deficit += Math.abs(e.amt);")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
