const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf-8');

// Update Types
content = content.replace(/chartDataMap: Record<string, \{([^}]+)\}>/g, (match, p1) => {
    return match.replace(p1, p1.replace('netAvailable:', 'totalEgresos: number; netAvailable:'));
});

// Update Object.values mapping
content = content.replace(/Object\.values\(chartDataMap\)\.forEach\(d => \{ d\.netAvailable = d\.income - d\.expense - d\.debt; \}\);/g, 
    "Object.values(chartDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });");
content = content.replace(/Object\.values\(biweeklyDataMap\)\.forEach\(d => \{ d\.netAvailable = d\.income - d\.expense - d\.debt; \}\);/g, 
    "Object.values(biweeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });");
content = content.replace(/Object\.values\(weeklyDataMap\)\.forEach\(d => \{ d\.netAvailable = d\.income - d\.expense - d\.debt; \}\);/g, 
    "Object.values(weeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });");
content = content.replace(/Object\.values\(monthlyDataMap\)\.forEach\(d => \{ d\.netAvailable = d\.income - d\.expense - d\.debt; \}\);/g, 
    "Object.values(monthlyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });");

// Chart renders
// Find hiddenLines toggle buttons
const btnTarget = `<button onClick={() => toggleLine("balance")} className={\`px-2 py-1 rounded-md text-xs font-bold \${!hiddenLines["balance"] ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200" : "text-slate-400"}\`}><span className="text-violet-500 mr-1">⚬</span>Saldo Acumulado (Liquidez)</button>`;
const btnReplace = btnTarget + `
                <button onClick={() => toggleLine("totalEgresos")} className={\`px-2 py-1 rounded-md text-xs font-bold \${!hiddenLines["totalEgresos"] ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200" : "text-slate-400"}\`}><span className="text-rose-500 mr-1">⚬</span>Egresos (Gastos + Deudas)</button>
                <button onClick={() => toggleLine("netAvailable")} className={\`px-2 py-1 rounded-md text-xs font-bold \${!hiddenLines["netAvailable"] ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200" : "text-slate-400"}\`}><span className="text-blue-500 mr-1">⚬</span>Disponibilidad (Flujo Neto)</button>`;
content = content.replace(btnTarget, btnReplace);


const lineTarget = `<Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />`;
const lineReplace = lineTarget + `
                  <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos + Deudas)" stroke="#f43f5e" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["netAvailable"]} type="monotone" dataKey="netAvailable" yAxisId="left" name="Disponibilidad (Flujo Neto)" stroke="#3b82f6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />`;
content = content.replaceAll(lineTarget, lineReplace);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', content);
console.log("Patched!");
