import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

chart_lines = """                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Optimizado" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />"""

new_lines = """                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Optimizado" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["netAvailable"]} type="monotone" dataKey="netAvailable" yAxisId="left" name="Flujo de Caja (Ingreso - Egreso)" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" dot={false} />"""

content = content.replace(chart_lines, new_lines)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
