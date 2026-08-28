const fs = require('fs');
let code = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

code = code.replace(
  `  let mInc = 0;
  let mExp = 0;
  let mDebt = 0;
  const monthOutflowTypes = new Set<string>();`,
  `  let mInc = 0;
  let mExp = 0;
  let mDebt = 0;
  let mSav = 0;
  const monthOutflowTypes = new Set<string>();`
);

code = code.replace(
  `    } else if (e.type === 'savings') {
      monthOutflowTypes.add('savings');
    } else if (e.type === 'debt' ) {`,
  `    } else if (e.type === 'savings') {
      mSav += Math.abs(e.amt);
      monthOutflowTypes.add('savings');
    } else if (e.type === 'debt' ) {`
);

code = code.replace(
  `        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Ingresos</span>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(mInc)}</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Gastos</span>
            <p className="text-sm font-black text-blue-700 dark:text-blue-400">{formatCurrency(mExp)}</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Deudas</span>
            <p className="text-sm font-black text-amber-700 dark:text-amber-400">{formatCurrency(mDebt)}</p>
          </div>
        </div>`,
  `        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Ingresos</span>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(mInc)}</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Gastos</span>
            <p className="text-sm font-black text-blue-700 dark:text-blue-400">{formatCurrency(mExp)}</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Deudas</span>
            <p className="text-sm font-black text-amber-700 dark:text-amber-400">{formatCurrency(mDebt)}</p>
          </div>
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-sky-600 uppercase">Ahorro</span>
            <p className="text-sm font-black text-sky-700 dark:text-sky-400">{formatCurrency(mSav)}</p>
          </div>
        </div>`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', code);
console.log("Patched CalendarView savings card");
