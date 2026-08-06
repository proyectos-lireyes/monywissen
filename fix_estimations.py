import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

# For Card:
replace_card = """                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Cuotas (1 = Todo)</label>
                            <input
                              type="number" min="1" required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>"""

to_card = """                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Cuotas (1 = Todo)</label>
                            <input
                              type="number" min="1" required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl text-[10px] font-bold text-amber-900 dark:text-amber-200 text-center">
                              Pago mensual sugerido: {formatCurrency(parseFloat(String(balance)) / parseInt(String(installments)))}
                           </div>
                        )}
                      </div>"""

content = content.replace(replace_card, to_card)

replace_other = """                            <div>
                              <label className="text-xs font-bold text-slate-500 block">Interés (%)</label>
                              <input
                                type="number" step="any" min="0" required value={apr} onChange={e => setApr(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          )}
                        </div>
                      </div>"""

to_other = """                            <div>
                              <label className="text-xs font-bold text-slate-500 block">Interés (%)</label>
                              <input
                                type="number" step="any" min="0" required value={apr} onChange={e => setApr(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          )}
                        </div>
                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">
                              {debtType === 'loan_interest' && parseFloat(String(apr) || '0') > 0
                                ? `Pago estimado por cuota: ${formatCurrency((parseFloat(String(balance)) * (1 + (parseFloat(String(apr))/100))) / parseInt(String(installments)))}`
                                : `Pago por cuota: ${formatCurrency(parseFloat(String(balance)) / parseInt(String(installments)))}`
                              }
                           </div>
                        )}
                      </div>"""

content = content.replace(replace_other, to_other)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
