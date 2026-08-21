import re

with open('src/components/settings/SettingsView.tsx', 'r') as f:
    content = f.read()

# Replace state variables
content = content.replace("const [delayDays, setDelayDays] = useState(settings.delayDays);", "const [delayDays, setDelayDays] = useState(settings.delayDays);\n  const [autoSaveThreshold, setAutoSaveThreshold] = useState(settings.autoSaveThreshold || 0);")

content = content.replace("draft.settings.notifTime = notifTime;", "draft.settings.notifTime = notifTime;\n      draft.settings.autoSaveThreshold = autoSaveThreshold;")

# Replace UI
ui_target = """            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Inicio del Plan</label>
                <input
                  type="date"
                  value={planStart}
                  onChange={e => {
                    setPlanStart(e.target.value);
                    setOpeningBalance(0);
                    showToast('Fecha de inicio ajustada. Tu saldo base se ha reiniciado a 0 para que ingreses el monto correcto para esa fecha.', '⚠️');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Fin del Plan</label>
                <input
                  type="date"
                  value={planEnd}
                  onChange={e => setPlanEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Saldo mínimo (Colchón)</label>
                <input
                  type="number"
                  value={minBalance}
                  onChange={e => setMinBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Retraso permitido (días)</label>
                <input
                  type="number"
                  value={delayDays}
                  onChange={e => setDelayDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Inicio base (Dinero Hoy)</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Hora de Notificación Diaria</label>
                <input
                  type="time"
                  value={notifTime}
                  onChange={e => setNotifTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>"""

ui_replacement = """            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Saldo mínimo (Colchón)</label>
                <input
                  type="number"
                  value={minBalance}
                  onChange={e => setMinBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Excedente para Ahorros</label>
                <input
                  type="number"
                  value={autoSaveThreshold}
                  onChange={e => setAutoSaveThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Retraso permitido (días)</label>
                <input
                  type="number"
                  value={delayDays}
                  onChange={e => setDelayDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Hora de Notificación Diaria</label>
                <input
                  type="time"
                  value={notifTime}
                  onChange={e => setNotifTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>"""

content = content.replace(ui_target, ui_replacement)

with open('src/components/settings/SettingsView.tsx', 'w') as f:
    f.write(content)

print("Success")
