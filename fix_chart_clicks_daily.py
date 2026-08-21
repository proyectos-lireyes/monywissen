import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = 'dot={false}'
replacement = "dot={false} activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }}"
content = content.replace(target, replacement)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
