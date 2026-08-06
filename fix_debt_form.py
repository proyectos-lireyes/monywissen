import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

start_marker = "{debtType === 'card' ? ("
end_marker = "{type === 'saving' ? ("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

# we want to replace everything between start_marker (inclusive) and end_marker (exclusive)
# minus some brackets for the outer ternary.
# Actually, the structure is:
# {debtType === 'card' ? (
#    ... card form ...
# ) : (
#    ... other form ...
# )}
# </>
# ) : (
# {type === 'saving' ? (

new_form = """{debtType === 'card' ? (
                    <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">💳 Configuración Tarjeta de Crédito</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Día de Corte</label>
                          <input
                            type="number" min="1" max="31" required
                            value={cutDay} onChange={e => setCutDay(e.target.value)}
                            placeholder="Ej. 5"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Día de Cobro</label>
                          <input
                            type="number" min="1" max="31" required
                            value={dueDay} onChange={e => setDueDay(e.target.value)}
                            placeholder="Ej. 25"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Monto de la Deuda</label>
                          <input
                            type="number" required
                            value={balance} onChange={e => setBalance(e.target.value)}
                            placeholder="Ej. 150"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Cuotas a Pagar (1 = Todo)</label>
                          <input
                            type="number" min="1" required
                            value={installments} onChange={e => setInstallments(e.target.value)}
                            placeholder="Ej. 1"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      
                      {parseInt(String(installments) || '1') > 1 && parseFloat(String(balance) || '0') > 0 && (
                         <div className="p-2 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl text-[10px] font-bold text-amber-900 dark:text-amber-200 text-center">
                            Pago estimado por cuota: {formatCurrency(parseFloat(String(balance)) / parseInt(String(installments)))}
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Monto Total (Deuda)</label>
                          <input
                            type="number" required
                            value={balance} onChange={e => setBalance(e.target.value)}
                            placeholder="Ej. 300"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Día de Pago (1-31)</label>
                          <input
                            type="number" min="1" max="31" required
                            value={dueDay} onChange={e => setDueDay(e.target.value)}
                            placeholder="Ej. 15"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Número de Cuotas</label>
                          <input
                            type="number" min="1" required
                            value={installments} onChange={e => setInstallments(e.target.value)}
                            placeholder="Ej. 6"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        {debtType === 'loan_interest' && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Tasa de Interés (%)</label>
                            <input
                              type="number" step="any" min="0" required
                              value={apr} onChange={e => setApr(e.target.value)}
                              placeholder="Ej. 5"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}
                      </div>
                      
                      {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                         <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">
                            {debtType === 'loan_interest' && parseFloat(String(apr) || '0') > 0
                              ? `Pago estimado por cuota (sin capitalizar): ${formatCurrency((parseFloat(String(balance)) * (1 + (parseFloat(String(apr))/100))) / parseInt(String(installments)))}`
                              : `Pago por cuota: ${formatCurrency(parseFloat(String(balance)) / parseInt(String(installments)))}`
                            }
                         </div>
                      )}
                    </div>
                  )}
                </>
              ) : """

# find the closing of type === 'debt'
# The structure is:
# {type === 'debt' ? (
#    ...
# ) : ( ...type === 'saving'...
# We just replace from start_marker to just before `                 {type === 'saving' ? (`

search_end_marker = "                  {type === 'saving' ? ("
end_idx_precise = content.find(search_end_marker)

new_content = content[:start_idx] + new_form + content[end_idx_precise:]

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(new_content)
