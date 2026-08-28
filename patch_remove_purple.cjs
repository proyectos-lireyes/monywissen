const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

// Tooltip cleanup
code = code.replace(
  `        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#8b5cf6' }}>
          <span className="font-bold">Disponible Antes del Ingreso:</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.preIncomeBalance || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-xs mb-1" style={{ color: '#2563eb' }}>
          <span className="font-bold">Liquidez Final del Día:</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>`,
  `        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#3b82f6' }}>
          <span className="font-bold">Liquidez Final del Día (Saldo):</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>`
);

// Chart Line cleanup
code = code.replace(
  `                    <Line hide={hiddenLines["preIncomeBalance"]} type="monotone" dataKey="preIncomeBalance" yAxisId="left" name="Disponible Antes del Ingreso" stroke="#8b5cf6" strokeWidth={3} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Liquidez Final del Día" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />`,
  `                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Liquidez Final del Día" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />`
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched to remove purple line");
