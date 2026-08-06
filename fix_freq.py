import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

search_freq = """                    <select
                      value={customDebtForm.freq}
                      onChange={e => setCustomDebtForm({...customDebtForm, freq: e.target.value as any})}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="weekly">Semanal</option>
                    </select>"""

replace_freq = """                    <select
                      value={customDebtForm.freq}
                      onChange={e => setCustomDebtForm({...customDebtForm, freq: e.target.value as any})}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="weekly">Semanal</option>
                      <option value="triweekly">Cada 3 Semanas</option>
                      <option value="daily">Diario</option>
                    </select>"""

content = content.replace(search_freq, replace_freq)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search_due = """                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día de Pago (1-31)</label>
                            <input
                              type="number" min="1" max="31" required value={dueDay} onChange={e => setDueDay(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>"""

replace_due = """                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día de Pago</label>
                            <input
                              type="text" required value={dueDay} onChange={e => setDueDay(e.target.value)}
                              placeholder={freq === 'biweekly' ? "Ej: 15-30" : freq.includes('weekly') ? "Ej: 1 (Lunes), 5 (Viernes)" : "1-31"}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                               {freq === 'biweekly' ? "Usa formato DD-DD (Ej: 15-30)." : freq.includes('weekly') ? "Para semanal, usa 1=Lun, 2=Mar, etc." : "Día del mes (1-31)."}
                            </p>
                          </div>"""

content = content.replace(search_due, replace_due)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

