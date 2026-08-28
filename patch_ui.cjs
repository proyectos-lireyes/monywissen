const fs = require('fs');
const file = 'src/components/dashboard/DashboardView.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempOpeningBalance === 0 ? '' : tempOpeningBalance}
                      onChange={(e) => setTempOpeningBalance(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>`;

const replacement = `                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempOpeningBalance === 0 ? '' : tempOpeningBalance}
                      onChange={(e) => setTempOpeningBalance(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Déjalo vacío (0) para que el sistema calcule el monto necesario para cubrir gastos previos a tu primer ingreso.</p>`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
console.log("UI Patched!");
