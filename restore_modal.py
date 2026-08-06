import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

search_item = "      <ItemFormModal"

modal_str = """      {showCustomDebtModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl ">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {editingCustomDebt ? 'Editar Tipo de Deuda' : 'Nuevo Tipo de Deuda Personalizado'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configura o elige una plantilla.
                </p>
              </div>
              <button onClick={() => setShowCustomDebtModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  💡 Plantillas de Deudas Comunes:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {[
                    {
                      icon: '💳', label: 'Tarjeta de Crédito', desc: 'Pagos mensuales con cálculo de pago mínimo',
                      form: { name: 'Tarjeta de Crédito', freq: 'monthly', hasInterest: true, usePlan: false, color: '#1a73e8' }
                    },
                    {
                      icon: '🏦', label: 'Préstamo Bancario', desc: 'Cuotas fijas mensuales con tasa de interés',
                      form: { name: 'Préstamo Bancario / Personal', freq: 'monthly', hasInterest: true, usePlan: true, color: '#d93025' }
                    },
                    {
                      icon: '⭐', label: 'Financiamiento (BNPL)', desc: 'Cuotas quincenales sin interés',
                      form: { name: 'Financiamiento (BNPL)', freq: 'biweekly', hasInterest: false, usePlan: true, color: '#fbbc04' }
                    },
                    {
                      icon: '🚗', label: 'Crédito Vehicular', desc: 'Préstamo con interés',
                      form: { name: 'Crédito Vehicular', freq: 'monthly', hasInterest: true, usePlan: true, color: '#34a853' }
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustomDebtForm({ ...preset.form })}
                      className="text-left p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex items-start gap-2 shadow-sm"
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{preset.label}</p>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{preset.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">⚙️ Configuración Manual</p>
                <div>
                  <label className="text-xs font-bold text-slate-500">Nombre del Tipo</label>
                  <input
                    type="text" required
                    value={customDebtForm.name}
                    onChange={e => setCustomDebtForm({...customDebtForm, name: e.target.value})}
                    placeholder="Ej. Crédito Hipotecario"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Frecuencia Base</label>
                    <select
                      value={customDebtForm.freq}
                      onChange={e => setCustomDebtForm({...customDebtForm, freq: e.target.value as any})}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customDebtForm.hasInterest}
                        onChange={e => setCustomDebtForm({...customDebtForm, hasInterest: e.target.checked})}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Genera Interés</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customDebtForm.usePlan}
                      onChange={e => setCustomDebtForm({...customDebtForm, usePlan: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Es un plan de cuotas (BNPL, Vehículo)</span>
                  </label>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 block">Color Identificador</label>
                  <div className="flex flex-wrap gap-2">
                    {['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCustomDebtForm({...customDebtForm, color: col})}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${customDebtForm.color === col ? 'border-slate-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'}`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setShowCustomDebtModal(false)}
                className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveCustomDebt}
                className="flex-1 py-3 text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}\n"""

content = content.replace(search_item, modal_str + search_item)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)
