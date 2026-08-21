import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

target_frecuencia = """                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Frecuencia</label>"""

replacement_frecuencia = """                <label className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customDebtForm.isCreditCard}
                    onChange={e => {
                      const isCC = e.target.checked;
                      setCustomDebtForm({
                        ...customDebtForm, 
                        isCreditCard: isCC,
                        freq: isCC ? 'monthly' : customDebtForm.freq,
                        hasInterest: isCC ? true : customDebtForm.hasInterest,
                        usePlan: isCC ? true : customDebtForm.usePlan
                      });
                    }}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-600"
                  />
                  💳 Configurar como Tarjeta de Crédito (TDC)
                </label>

                {customDebtForm.isCreditCard && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Día Corte</label>
                      <input
                        type="number"
                        min="1" max="31"
                        value={customDebtForm.cutDay}
                        onChange={e => setCustomDebtForm({...customDebtForm, cutDay: e.target.value})}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Día Pago</label>
                      <input
                        type="number"
                        min="1" max="31"
                        value={customDebtForm.dueDay}
                        onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Límite</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={customDebtForm.creditLimit}
                        onChange={e => setCustomDebtForm({...customDebtForm, creditLimit: e.target.value})}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Frecuencia</label>"""

content = content.replace(target_frecuencia, replacement_frecuencia)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)

print("Success")
