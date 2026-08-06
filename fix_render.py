import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

# split content right at the `return (` line
parts = content.split("  return (")

if len(parts) == 2:
    new_render = """  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {editIndex !== null ? 'Editar Registro' : 'Nuevo Registro'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-3">
            {type === 'saving' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Tipo</label>
                    <select
                      value={savType}
                      onChange={e => setSavType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="physical">💵 Efectivo (Físico)</option>
                      <option value="digital">🏦 Digital (Bancos)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Monto</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="Ej. 100"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block">Concepto / Vendedor</label>
                  <input
                    type="text"
                    required
                    value={savPerson}
                    onChange={e => setSavPerson(e.target.value)}
                    placeholder="Ej. Cambio de efectivo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500">Nombre / Concepto</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={type === 'income' ? 'Ej. Quincena' : type === 'debt' ? 'Ej. Tarjeta de Crédito' : 'Ej. Compras del mes'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                {type === 'debt' ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Tipo de Deuda</label>
                      <select
                        value={debtType}
                        onChange={e => {
                          const selected = e.target.value;
                          setDebtType(selected);
                          setFreq('monthly');
                          if (selected === 'card') {
                            setInstallments(1);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 font-bold"
                      >
                        <option value="card">💳 Tarjeta de Crédito</option>
                        <option value="loan_interest">🏦 Préstamo con Interés</option>
                        <option value="loan_no_interest">🤝 Préstamo sin Interés</option>
                      </select>
                    </div>

                    {debtType === 'card' ? (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">💳 Configuración Tarjeta de Crédito</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Día de Corte</label>
                            <input
                              type="number" min="1" max="31" required
                              value={cutDay} onChange={e => setCutDay(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Día de Cobro</label>
                            <input
                              type="number" min="1" max="31" required
                              value={dueDay} onChange={e => setDueDay(e.target.value)}
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
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Cuotas (1 = Todo)</label>
                            <input
                              type="number" min="1" required
                              value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Monto Total</label>
                            <input
                              type="number" required
                              value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día de Pago (1-31)</label>
                            <input
                              type="number" min="1" max="31" required
                              value={dueDay} onChange={e => setDueDay(e.target.value)}
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
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          {debtType === 'loan_interest' && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 block">Interés (%)</label>
                              <input
                                type="number" step="any" min="0" required
                                value={apr} onChange={e => setApr(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block">Monto a Registrar</label>
                        <input
                          type="number"
                          required
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block">Divisa</label>
                        <select
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        >
                          <option value="USD_BCV">USD (BCV)</option>
                          <option value="EUR_BCV">EUR (BCV)</option>
                          <option value="USDT">USDT (Binance)</option>
                          <option value="BS">Bs (Bolívares)</option>
                        </select>
                      </div>
                    </div>
                    {forceOneTime ? (
                      <div>
                        <label className="text-xs font-bold text-slate-500 block">Fecha</label>
                        <input
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Frecuencia</label>
                            <select
                              value={freq}
                              onChange={e => setFreq(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            >
                              <option value="monthly">Mensual</option>
                              <option value="biweekly">Quincenal</option>
                              <option value="weekly">Semanal</option>
                            </select>
                          </div>
                          {freq === 'monthly' && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 block">Día del Mes</label>
                              <input
                                type="number" min="1" max="31"
                                value={day} onChange={e => setDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <div className="pt-2 flex gap-2">
              {editIndex !== null && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/50"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <CheckCircle className="w-5 h-5" /> {editIndex !== null ? 'Guardar Cambios' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
"""
    with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
        f.write(parts[0] + new_render)
