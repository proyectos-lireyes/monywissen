import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """                <div>
                  <label className="text-xs font-bold text-slate-500 block">Concepto / Vendedor</label>"""

replacement = """                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Fecha</label>
                    <input
                      type="date" required value={date} onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Divisa</label>
                    <select
                      value={currency} onChange={e => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="USD_BCV">Dólar BCV (Bs)</option>
                      <option value="USD">Dólar USD ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="COP">Peso Colombiano</option>
                      <option value="BRL">Real Brasileño</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block">Concepto / Vendedor</label>"""

target_remove = """                <div>
                  <label className="text-xs font-bold text-slate-500 block">Divisa</label>
                  <select
                    value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="USD_BCV">Dólar BCV (Bs)</option>
                    <option value="USD">Dólar USD ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="COP">Peso Colombiano</option>
                    <option value="BRL">Real Brasileño</option>
                  </select>
                </div>"""

if target in content and target_remove in content:
    content = content.replace(target_remove, "")
    content = content.replace(target, replacement)
    
    with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
        f.write(content)
    print("Patched ItemFormModal with date input for savings")
else:
    print("Target not found")
