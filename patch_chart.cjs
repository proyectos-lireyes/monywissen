const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

code = code.replace(
  `<ComposedChart data={activeData as any} onClick={(e) => { if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}>`,
  `<ComposedChart data={activeData.map((d: any) => ({ ...d, preIncomeBalance: (d.balance || 0) - (d.income || 0), totalEgresos: (d.expense || 0) + (d.debt || 0) })) as any} onClick={(e) => { if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}>`
);

code = code.replace(
  `                    <Bar hide={hiddenLines["income"]} dataKey="income" stackId="flows" yAxisId="left" name="Ingresos" fill="#10b981" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["totalEgresos"]} dataKey="totalEgresos" stackId="opt" yAxisId="left" name="Egresos (Gastos+Deudas)" fill="#f43f5e" barSize={12} radius={[4,4,0,0]} />
                    
                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#991b1b" name="Déficit (Alerta)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#059669" name="Optimizados (Adelantados)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#d97706" name="Optimizados (Atrasados)" barSize={12} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["preIncomeBalance"]} type="monotone" dataKey="preIncomeBalance" yAxisId="left" name="Disponible Antes del Ingreso" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />`,
  `                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#991b1b" name="Déficit (Alerta)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#059669" name="Optimizados (Adelantados)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#d97706" name="Optimizados (Atrasados)" barSize={12} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos+Deudas)" stroke="#f43f5e" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["preIncomeBalance"]} type="monotone" dataKey="preIncomeBalance" yAxisId="left" name="Disponible Antes del Ingreso" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Liquidez Final del Día" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />`
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched chart composition");
