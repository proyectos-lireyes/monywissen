import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Remove the duplicate one in chartMode 3.
content = content.replace('<ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />\n                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" yAxisId="left" />', '<ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" yAxisId="left" />')

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

