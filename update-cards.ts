import fs from 'fs';

let content = fs.readFileSync('src/components/savings/SavingsView.tsx', 'utf8');

const target = `        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
              Total Ahorrado
            </span>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(globalTotal)}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
              Total Digital
            </span>
            <p className="text-base font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(digitalTotal)}
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
              Físico (Efectivo)
            </span>
            <p className="text-base font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(physicalTotal)}
            </p>
          </div>
        </div>`;
const replacement = `        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
              Físico (Efectivo)
            </span>
            <p className="text-base font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(physicalTotal)}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
              Total Digital
            </span>
            <p className="text-base font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(digitalTotal)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
              Total Ahorrado
            </span>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(globalTotal)}
            </p>
          </div>
        </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/savings/SavingsView.tsx', content);
