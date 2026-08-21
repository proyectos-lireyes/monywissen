import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# We have exactly these occurrences of Legend with the wrapper styles:
target1 = '<Legend onClick={(e) => toggleLine(e.dataKey as string)} wrapperStyle={{ cursor: \'pointer\' }} />'
replacement1 = target1 + '\n                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />'

target2 = '<Legend onClick={(e) => toggleLine(e.dataKey as string)} wrapperStyle={{ fontSize: \'11px\', paddingTop: \'4px\', cursor: \'pointer\' }} />'
replacement2 = target2 + '\n                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />'

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

