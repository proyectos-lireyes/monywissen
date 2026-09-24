const fs = require('fs');
let code = fs.readFileSync('src/components/modals/OccurrenceDetailModal.tsx', 'utf8');

const target = `            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Fecha Prevista</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {formatDateStr(originalDate)}
              </p>
            </div>`;

const replacement = `            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Fecha Prevista</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {formatDateStr(originalDate)}
              </p>
            </div>
          </div>
          
          {/* Dynamic Projection Info */}
          {planDate && planDate !== originalDate && !isDone && (
             <div className={\`mt-3 p-3 rounded-xl border text-xs font-bold \${
                 planDate < originalDate 
                 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                 : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
             }\`}>
                 <div className="flex items-center gap-2">
                     <span className="text-[10px] uppercase opacity-70">Fecha Proyectada:</span>
                     <span>{formatDateStr(planDate)}</span>
                 </div>
                 <p className="text-[10px] mt-1 font-medium opacity-80">
                     {overrideRecord.userPostponed 
                         ? (planDate > originalDate ? "Pospuesto manualmente." : "Adelantado manualmente.")
                         : (planDate < originalDate ? "Adelantado automáticamente por el sistema (hay saldo a favor)." : "Retrasado automáticamente por el sistema (falta de liquidez).")
                     }
                 </p>
             </div>
          )}
          
          <div className="hidden">`; // We close the div we accidentally replaced

if (code.includes(target)) {
    code = code.replace(target, replacement);
    // Wait, the target didn't include the closing </div> of the flex container.
    // Let's do a better replace.
}
