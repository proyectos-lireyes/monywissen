import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# I will add the lines back to the Recharts

chart_lines = """                    <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos+Deudas)" stroke="#f43f5e" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    
                    <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="Gastos (Desglose)" stroke="#ef4444" strokeWidth={2} strokeDasharray="2 2" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="Deudas (Desglose)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2 2" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    
                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#ef4444" name="Déficit (Alerta de Quiebre)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#10b981" name="Optimizados (Adelantados)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo (Liquidez Disponible)" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />"""

new_lines = """                    <Line hide={hiddenLines["plannedIncome"]} type="monotone" dataKey="plannedIncome" yAxisId="left" name="[Plan] Ingresos" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="[Real] Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    
                    <Line hide={hiddenLines["plannedEgresos"]} type="monotone" dataKey="plannedEgresos" yAxisId="left" name="[Plan] Egresos" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="[Real] Egresos" stroke="#f43f5e" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    
                    <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="[Real] Gastos" stroke="#ef4444" strokeWidth={2} strokeDasharray="2 2" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="[Real] Deudas" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2 2" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    
                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#ef4444" name="Déficit (Alerta)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#10b981" name="Optimizados (Adelantados)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Optimizado" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />"""

content = content.replace(chart_lines, new_lines)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

