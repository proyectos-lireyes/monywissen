const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

code = code.replace(
  `        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#2563eb' }}>
          <span className="font-bold">Liquidez Real (Saldo):</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>`,
  `        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#8b5cf6' }}>
          <span className="font-bold">Disponible Antes del Ingreso:</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.preIncomeBalance || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-xs mb-1" style={{ color: '#2563eb' }}>
          <span className="font-bold">Liquidez Final del Día:</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>`
);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
console.log("Patched tooltip");
