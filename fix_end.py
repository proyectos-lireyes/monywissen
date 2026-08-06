import os

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

# Add the closing saving part
append_str = """                  {type === 'saving' ? (
                    <>
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
                          <label className="text-xs font-bold text-slate-500 block">Divisa</label>
                          <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          >
                            <option value="USD_BCV">USD (Referencia)</option>
                            <option value="EUR_BCV">EUR (Referencia)</option>
                            <option value="USDT">USDT (Binance)</option>
                            <option value="BS">Bs (Bolívares)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : null}
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
    f.write(content + append_str)

