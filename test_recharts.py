import re
with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Let's remove the activeDot onClick which is probably crashing the app when clicked.
# Because payload is undefined!

def replace_active_dot(m):
    return "activeDot={{ r: 6 }}"

# e.g., activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }}
# or activeDot={{ onClick: (e: any, payload: any) => { if(payload && payload.payload) setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }}

content = re.sub(r'activeDot=\{\{\s*onClick:[^\}]+\}\}', 'activeDot={{ r: 6 }}', content)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Replaced activeDots")
