import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

# 1. Update initial state
search_state = "const [customDebtForm, setCustomDebtForm] = useState({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0' });"
replace_state = "const [customDebtForm, setCustomDebtForm] = useState({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1' });"
content = content.replace(search_state, replace_state)

# 2. Update reset when creating new
search_reset = "setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0' });"
replace_reset = "setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1' });"
content = content.replace(search_reset, replace_reset)

# 3. Add dueDay to the grid layout and handle specific dueDay configurations
search_freq = """                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Frecuencia de Cobro por Defecto</label>
                  <select
                    value={customDebtForm.freq}
                    onChange={e => setCustomDebtForm({...customDebtForm, freq: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="triweekly">Trisemanal (3 Semanas)</option>
                  </select>
                </div>"""

replace_freq = """                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Frecuencia</label>
                    <select
                      value={customDebtForm.freq}
                      onChange={e => {
                        const newFreq = e.target.value;
                        let defaultDueDay = '1';
                        if (newFreq === 'biweekly') defaultDueDay = '15-30';
                        if (newFreq === 'weekly') defaultDueDay = '1';
                        if (newFreq === 'triweekly') defaultDueDay = '1';
                        setCustomDebtForm({...customDebtForm, freq: newFreq, dueDay: defaultDueDay});
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="monthly">Mensual</option>
                      <option value="triweekly">Trisemanal (3 Semanas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      {customDebtForm.freq === 'weekly' ? 'Día de la semana' : customDebtForm.freq === 'biweekly' ? 'Quincenas' : customDebtForm.freq === 'triweekly' ? 'Semana del mes' : 'Día del mes'}
                    </label>
                    {customDebtForm.freq === 'weekly' ? (
                      <select
                        value={customDebtForm.dueDay}
                        onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
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
                    ) : customDebtForm.freq === 'biweekly' ? (
                      <select
                        value={customDebtForm.dueDay}
                        onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="15-30">15 y 30</option>
                        <option value="14-28">14 y 28</option>
                        <option value="13-27">13 y 27</option>
                        <option value="1-15">1 y 15</option>
                      </select>
                    ) : customDebtForm.freq === 'triweekly' ? (
                      <select
                        value={customDebtForm.dueDay}
                        onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="1">Semana 1</option>
                        <option value="2">Semana 2</option>
                        <option value="3">Semana 3</option>
                        <option value="4">Semana 4</option>
                      </select>
                    ) : (
                      <input
                        type="number" min="1" max="31"
                        value={customDebtForm.dueDay}
                        onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    )}
                  </div>
                </div>"""

content = content.replace(search_freq, replace_freq)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)

