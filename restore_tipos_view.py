import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

search_str = """            </div>
          )
        
        ) : ("""

replace_str = """            </div>
          )
        ) : subTab === 'types' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Modelos Personalizados de Deuda
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5"
                >
                  <span className="text-base">🌐</span> Explorar
                </button>
                <button
                  onClick={handleAddCustomDebt}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
                >
                  + Crear Tipo
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {customDebts.map(cd => (
                <div key={cd.id} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: cd.color }}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {cd.name}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {cd.freq} • {cd.hasInterest ? 'Con interés' : 'Sin interés'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handlePublishCustomDebt(cd)} title="Publicar en MonyStore" className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded-lg font-medium hover:bg-indigo-100">🌐 Publicar</button>
                    <button onClick={() => handleEditCustomDebt(cd.id, cd)} className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-300">Editar</button>
                    <button onClick={() => handleDeleteCustomDebt(cd.id)} className="text-[10px] bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-200">X</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : ("""

content = content.replace(search_str, replace_str)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)
