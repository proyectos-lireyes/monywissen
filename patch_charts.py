import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add <Bar hide={hiddenLines["optimized"]} dataKey="optimized" yAxisId="left" fill="#f59e0b" name="Optimizados (Adelantados)" barSize={20} /> before <Line ... />
content = content.replace('<Line hide={hiddenLines["income"]}', '<Bar hide={hiddenLines["optimized"]} dataKey="optimized" yAxisId="left" fill="#fbbf24" name="Optimizados (Adelantados)" barSize={10} radius={[4,4,0,0]} />\n                  <Line hide={hiddenLines["income"]}')


with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

