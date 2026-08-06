import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search = """                          <div>
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

replace = """                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día de Pago</label>
                            {freq === 'weekly' ? (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="1">Lunes</option>
                                <option value="2">Martes</option>
                                <option value="3">Miércoles</option>
                                <option value="4">Jueves</option>
                                <option value="5">Viernes</option>
                                <option value="6">Sábado</option>
                                <option value="0">Domingo</option>
                              </select>
                            ) : freq === 'biweekly' ? (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="15-30">15 y 30</option>
                                <option value="14-28">14 y 28</option>
                                <option value="13-27">13 y 27</option>
                                <option value="1-15">1 y 15</option>
                              </select>
                            ) : freq === 'triweekly' ? (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="1">Semana 1</option>
                                <option value="2">Semana 2</option>
                                <option value="3">Semana 3</option>
                                <option value="4">Semana 4</option>
                              </select>
                            ) : (
                              <input
                                type="number" min="1" max="31" required value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                            )}
                          </div>"""

content = content.replace(search, replace)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
