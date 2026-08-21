import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = """{periodDetails.items.map((item: any, i: number) => ("""

replacement = """{periodDetails.items.filter((i: any) => i.type !== 'opening_balance').map((item: any, i: number) => ("""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
        f.write(content)
    print("Patched DashboardView details rendering")
else:
    print("Target not found")
