import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Replace e.stopPropagation(); in the Line activeDot props
content = re.sub(r'\(e: any, payload: any\) => \{ e\.stopPropagation\(\); setPeriodDetails\(payload\.payload\); \}', r'(props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }', content)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
