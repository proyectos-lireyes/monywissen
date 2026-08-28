const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const replacement = `                           </div>
                        )}
                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && expectedCuotas && expectedCuotas.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-y-auto space-y-1 pr-1">
                            {expectedCuotas.map(c => (
                              <div key={c.key} className="flex justify-between items-center px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] border border-slate-200 dark:border-slate-700">
                                 <span className="text-slate-600 dark:text-slate-400 font-medium">Cuota {c.index}: {new Date(c.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                 <span className={c.requiredPay === 0 ? "text-emerald-500 font-bold" : "text-slate-900 dark:text-slate-100 font-bold"}>
                                   {c.requiredPay === 0 ? 'Pagado' : formatCurrencyExt(c.requiredPay, currency)}
                                 </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>`;

code = code.replace(/                           <\/div>\n                        \)\}\n                      <\/div>/, replacement);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
