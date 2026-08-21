import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

replacement = """                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#ef4444" name="Déficit (Alerta de Quiebre)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#10b981" name="Optimizados (Adelantados)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />"""

content = re.sub(r'<Bar hide=\{hiddenLines\["deficit"\].*?radius=\{\[4,4,0,0\]\} />\s*<Bar hide=\{hiddenLines\["optimized"\].*?radius=\{\[4,4,0,0\]\} />', replacement, content, flags=re.DOTALL)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
