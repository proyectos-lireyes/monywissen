const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

// Add calculated fields to chartDataMap before Object.values
code = code.replace(
  `  const chartData = Object.values(chartDataMap);`,
  `  Object.values(chartDataMap).forEach((d: any) => {
    d.totalEgresos = d.expense + d.debt;
    d.preIncomeBalance = d.balance - d.income;
  });
  const chartData = Object.values(chartDataMap);`
);

// ComposedChart: Remove expense, debt, balance. Add totalEgresos and preIncomeBalance
code = code.replace(
  `                    <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos+Deudas)" stroke="#f43f5e" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    
                    <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="Gastos" stroke="#ef4444" strokeWidth={2} strokeDasharray="2 2" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="Deudas" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2 2" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    
                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#ef4444" name="Déficit (Alerta)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#10b981" name="Optimizados (Adelantados)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#fbbf24" name="Optimizados (Atrasados)" barSize={10} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo (Liquidez Disponible)" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />`,
  `                    <Bar hide={hiddenLines["income"]} dataKey="income" stackId="flows" yAxisId="left" name="Ingresos" fill="#10b981" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["totalEgresos"]} dataKey="totalEgresos" stackId="opt" yAxisId="left" name="Egresos (Gastos+Deudas)" fill="#f43f5e" barSize={12} radius={[4,4,0,0]} />
                    
                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#991b1b" name="Déficit (Alerta)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#059669" name="Optimizados (Adelantados)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#d97706" name="Optimizados (Atrasados)" barSize={12} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["preIncomeBalance"]} type="monotone" dataKey="preIncomeBalance" yAxisId="left" name="Disponible Antes del Ingreso" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />`
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched dash chart");
