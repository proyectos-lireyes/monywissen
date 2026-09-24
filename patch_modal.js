import fs from 'fs';

let code = fs.readFileSync('src/components/modals/OccurrenceDetailModal.tsx', 'utf8');

const target = `            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Fecha Prevista</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {formatDateStr(originalDate)}
              </p>
            </div>
          </div>

          {/* Rate conversion info badge */}`;

const replacement = `            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Fecha Prevista</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {formatDateStr(originalDate)}
              </p>
            </div>
          </div>

          {/* Dynamic Projection Info */}
          {planDate && planDate !== originalDate && !isDone && (
             <div className={\`flex items-start gap-3 p-3 rounded-2xl border \${
                 planDate < originalDate 
                 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50' 
                 : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
             }\`}>
                <div className={\`p-1.5 rounded-full shrink-0 \${
                   planDate < originalDate 
                   ? 'bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
                   : 'bg-amber-200/50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                }\`}>
                   <Calendar className="w-4 h-4" />
                </div>
                <div>
                   <span className={\`text-[10px] font-bold uppercase block \${
                      planDate < originalDate ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'
                   }\`}>
                      Fecha Proyectada: {formatDateStr(planDate)}
                   </span>
                   <p className={\`text-xs mt-0.5 font-medium \${
                      planDate < originalDate ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
                   }\`}>
                       {overrideRecord.userPostponed 
                           ? (planDate > originalDate ? "Pospuesto manualmente a esta fecha." : "Adelantado manualmente a esta fecha.")
                           : (planDate < originalDate ? "El sistema planea pagar esto anticipadamente porque hay saldo disponible." : "El sistema ha retrasado esto temporalmente por falta de liquidez.")
                       }
                   </p>
                </div>
             </div>
          )}

          {/* Rate conversion info badge */}`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/modals/OccurrenceDetailModal.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Target not found!");
}
