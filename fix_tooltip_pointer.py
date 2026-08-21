import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("<Tooltip content={<CustomTooltip />} />", "<Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto' }} />")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
