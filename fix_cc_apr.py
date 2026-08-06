import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search_cc_grid2 = """                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Monto de la Deuda</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Cuotas (1 = Todo)</label>
                            <input
                              type="number" min="1" required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>"""

replace_cc_grid2 = """                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Monto Total</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Cuotas (Meses)</label>
                            <input
                              type="number" min="1" required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Tasa APR (%)</label>
                            <input
                              type="number" step="any" min="0" value={apr} onChange={e => setApr(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>"""

content = content.replace(search_cc_grid2, replace_cc_grid2)

search_cc_est = """                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl text-[10px] font-bold text-amber-900 dark:text-amber-200 text-center">
                              Pago mensual sugerido: {formatCurrency(parseFloat(String(balance)) / parseInt(String(installments)))}
                           </div>
                        )}"""

replace_cc_est = """                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl text-[10px] font-bold text-amber-900 dark:text-amber-200 text-center">
                              {(() => {
                                 const bal = parseFloat(String(balance) || '0');
                                 const inst = parseInt(String(installments) || '1');
                                 let pmt = bal / inst;
                                 if (parseFloat(String(apr) || '0') > 0) {
                                    const r = (parseFloat(String(apr)) / 100) / 12;
                                    pmt = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
                                 }
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>Cuota mensual: {formatCurrency(pmt)}</span>
                                     <span className="opacity-70">Total pagado: {formatCurrency(pmt * inst)}</span>
                                   </div>
                                 );
                              })()}
                           </div>
                        )}"""

content = content.replace(search_cc_est, replace_cc_est)

# And let's update the other estimation (loan_interest) to also show the total
search_loan_est = """                              {(() => {
                                 const bal = parseFloat(String(balance) || '0');
                                 const inst = parseInt(String(installments) || '1');
                                 const hasInt = debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
                                 let pmt = bal / inst;
                                 if (hasInt && parseFloat(String(apr) || '0') > 0) {
                                    // standard amortization: r = annual rate / 12 (assuming monthly for simplicity here)
                                    const r = (parseFloat(String(apr)) / 100) / 12;
                                    if (r > 0) {
                                      pmt = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
                                    }
                                 }
                                 return `Pago estimado por cuota: ${formatCurrency(pmt)}`;
                              })()}"""

replace_loan_est = """                              {(() => {
                                 const bal = parseFloat(String(balance) || '0');
                                 const inst = parseInt(String(installments) || '1');
                                 const hasInt = debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
                                 let pmt = bal / inst;
                                 if (hasInt && parseFloat(String(apr) || '0') > 0) {
                                    // standard amortization: r = annual rate / 12
                                    const r = (parseFloat(String(apr)) / 100) / 12;
                                    if (r > 0) {
                                      pmt = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
                                    }
                                 }
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>Cuota mensual: {formatCurrency(pmt)}</span>
                                     <span className="opacity-70">Total a pagar: {formatCurrency(pmt * inst)}</span>
                                   </div>
                                 );
                              })()}"""
content = content.replace(search_loan_est, replace_loan_est)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
