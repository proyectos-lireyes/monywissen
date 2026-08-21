const fs = require('fs');
const text = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const startStr = "{debtType === '' ? null : debtType === 'card' ? (";
const endStr = "                    ) : debtType === 'loan_interest' || debtType === 'loan_no_interest' ? (";

const startIndex = text.indexOf(startStr);
const endIndex = text.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("NOT FOUND");
} else {
  const replacement = `{debtType === '' ? null : debtType === 'card' ? (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-3">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">💳 Configuración Tarjeta de Crédito</span>
                        <div className="grid grid-cols-2 gap-2 relative">
                          <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Día de Corte</label>
                            <button
                              type="button"
                              onClick={() => { setShowCutGrid(!showCutGrid); setShowDueGrid(false); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                            >
                              <span>{cutDay}</span>
                              <span className="text-[10px] text-slate-400">📅</span>
                            </button>
                            {showCutGrid && (
                              <div className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[180px]">
                                <div className="grid grid-cols-5 gap-1">
                                  {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                    <button
                                      key={"cut-"+d} type="button"
                                      onClick={() => { setCutDay(d); setShowCutGrid(false); }}
                                      className={"text-[10px] py-1 rounded-md font-bold " + (cutDay == d ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300')}
                                    >
                                      {d}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Día de Cobro</label>
                            <button
                              type="button"
                              onClick={() => { setShowDueGrid(!showDueGrid); setShowCutGrid(false); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                            >
                              <span>{dueDay}</span>
                              <span className="text-[10px] text-slate-400">📅</span>
                            </button>
                            {showDueGrid && (
                              <div className="absolute top-full right-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[180px]">
                                <div className="grid grid-cols-5 gap-1">
                                  {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                    <button
                                      key={"due-"+d} type="button"
                                      onClick={() => { setDueDay(d); setShowDueGrid(false); }}
                                      className={"text-[10px] py-1 rounded-md font-bold " + (dueDay == d ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300')}
                                    >
                                      {d}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Monto Total</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Moneda</label>
                            <select
                              value={currency} onChange={e => setCurrency(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            >
                              <option value="USD_BCV">USD (BCV)</option>
                              <option value="EUR_BCV">EUR (BCV)</option>
                              <option value="USDT">USDT</option>
                              <option value="BS">Bs</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Cuotas (Meses)</label>
                            <select
                              required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-900 dark:text-slate-100"
                            >
                              {Array.from({ length: 6 }, (_, i) => i + 1).map(m => {
                                const info = calcInstallmentInfo(m);
                                return (
                                  <option key={m} value={m}>
                                    {m} mes{m > 1 ? 'es' : ''} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(info.cuota)}/c
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Tasa APR Anual (%)</label>
                            <input
                              type="number" step="any" min="0" value={apr} onChange={e => setApr(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!name) { alert('Ingresa el Nombre de la Tarjeta arriba primero'); return; }
                              const evt = new CustomEvent('save-tdc', { detail: {
                                name: name,
                                color: color || '#f59e0b',
                                cutDay: parseInt(String(cutDay), 10) || 5,
                                dueDay: dueDay,
                                apr: parseFloat(String(apr)) || 60
                              }});
                              window.dispatchEvent(evt);
                            }}
                            className="w-full text-[11px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold py-2 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-200 transition-colors"
                          >
                            💾 Guardar Perfil de TDC
                          </button>
                        </div>
                      </div>
`;
  
  const newText = text.substring(0, startIndex) + replacement + text.substring(endIndex);
  fs.writeFileSync('src/components/modals/ItemFormModal.tsx', newText);
  console.log("REPLACED");
}
