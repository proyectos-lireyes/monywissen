import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# 1. Update Types
content = content.replace(
    'plannedEgresos: number; }>',
    'plannedEgresos: number; plannedNetFlow?: number; }>'
)
content = content.replace(
    'plannedEgresos?: number; }>',
    'plannedEgresos?: number; plannedNetFlow?: number; }>'
)

# 2. Update Object.values computations
content = content.replace(
    'Object.values(chartDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });',
    'Object.values(chartDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });'
)
content = content.replace(
    'Object.values(biweeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });',
    'Object.values(biweeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });'
)
content = content.replace(
    'Object.values(weeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });',
    'Object.values(weeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });'
)
content = content.replace(
    'Object.values(monthlyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });',
    'Object.values(monthlyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });'
)

# 3. Add the line to the chart
old_lines = """                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Optimizado" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />"""

new_lines = """                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Optimizado" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["plannedNetFlow"]} type="monotone" dataKey="plannedNetFlow" yAxisId="left" name="Flujo Planeado (Ingreso - Egreso)" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" dot={false} />"""

content = content.replace(old_lines, new_lines)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

