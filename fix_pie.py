import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("fill={entry.color}", "fill={PIE_COLORS[index % PIE_COLORS.length]}")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
