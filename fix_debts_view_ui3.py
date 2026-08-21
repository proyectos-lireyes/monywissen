import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

# 1. Add limitCurrency to initial state
state_target = "const [customDebtForm, setCustomDebtForm] = useState({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', isCreditCard: false });"
state_replacement = """const [customDebtForm, setCustomDebtForm] = useState({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', limitCurrency: 'USD_BCV', isCreditCard: false });
  const [showFormCutGrid, setShowFormCutGrid] = useState(false);
  const [showFormDueGrid, setShowFormDueGrid] = useState(false);"""
content = content.replace(state_target, state_replacement)

# 2. Add limitCurrency to handleAddCustomDebt
add_target = "setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', isCreditCard: false });"
add_replacement = "setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', limitCurrency: 'USD_BCV', isCreditCard: false });"
content = content.replace(add_target, add_replacement)

# 3. Add limitCurrency to handleEditCustomDebt
edit_target = """      creditLimit: cd.creditLimit ? String(cd.creditLimit) : '',
      isCreditCard: id.startsWith('tdc_') || cd.isCreditCard || false"""
edit_replacement = """      creditLimit: cd.creditLimit ? String(cd.creditLimit) : '',
      limitCurrency: cd.limitCurrency || 'USD_BCV',
      isCreditCard: id.startsWith('tdc_') || cd.isCreditCard || false"""
content = content.replace(edit_target, edit_replacement)

# 4. Replace the UI block
ui_target = """                {customDebtForm.isCreditCard && (
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
                )}"""

ui_replacement = """                {customDebtForm.isCreditCard && (
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2 relative">
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Día Corte</label>
                        <button
                          type="button"
                          onClick={() => { setShowFormCutGrid(!showFormCutGrid); setShowFormDueGrid(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                        >
                          <span>{customDebtForm.cutDay}</span>
                          <span className="text-[10px] text-slate-400">📅</span>
                        </button>
                        {showFormCutGrid && (
                          <div className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[220px]">
                            <div className="grid grid-cols-6 gap-1">
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                <button
                                  key={`cut-${d}`} type="button"
                                  onClick={() => { setCustomDebtForm({...customDebtForm, cutDay: String(d)}); setShowFormCutGrid(false); }}
                                  className={`text-[10px] py-1 rounded-md font-bold ${customDebtForm.cutDay == String(d) ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Día Pago</label>
                        <button
                          type="button"
                          onClick={() => { setShowFormDueGrid(!showFormDueGrid); setShowFormCutGrid(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                        >
                          <span>{customDebtForm.dueDay}</span>
                          <span className="text-[10px] text-slate-400">📅</span>
                        </button>
                        {showFormDueGrid && (
                          <div className="absolute top-full right-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[220px]">
                            <div className="grid grid-cols-6 gap-1">
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                <button
                                  key={`due-${d}`} type="button"
                                  onClick={() => { setCustomDebtForm({...customDebtForm, dueDay: String(d)}); setShowFormDueGrid(false); }}
                                  className={`text-[10px] py-1 rounded-md font-bold ${customDebtForm.dueDay == String(d) ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
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
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Moneda Límite</label>
                        <select
                          value={customDebtForm.limitCurrency || 'USD_BCV'}
                          onChange={e => setCustomDebtForm({...customDebtForm, limitCurrency: e.target.value})}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                        >
                          <option value="USD_BCV">USD (BCV)</option>
                          <option value="EUR_BCV">EUR (BCV)</option>
                          <option value="USDT">USDT</option>
                          <option value="BS">Bs</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}"""
content = content.replace(ui_target, ui_replacement)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)

print("Success")
