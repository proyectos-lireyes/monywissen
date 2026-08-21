import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

optimizations_ui = """
        {/* Optimizations Banner */}
        {integrityReport.optimizations && integrityReport.optimizations.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-3xl border border-amber-200 dark:border-amber-800/40 shadow-sm mt-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                  Banderas de Optimización ({integrityReport.optimizations.length})
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
                  El sistema detectó que tu saldo (o flujo) caerá por debajo de tu colchón mínimo. Reprograma estos gastos al próximo ingreso disponible para nivelar tu liquidez.
                </p>
                <div className="space-y-2 mt-3">
                  {integrityReport.optimizations.map((opt: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{opt.itemName} <span className="font-black text-rose-600 ml-1">{formatCurrency(opt.amount)}</span></p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{opt.message}</p>
                      </div>
                      <button
                        onClick={() => handleAcceptOptimization(opt)}
                        className="shrink-0 px-4 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-xl transition-colors"
                      >
                        Reprogramar al {opt.suggestedDate}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
"""

# Insert it before {/* Projection Chart Header */}
content = content.replace('{/* Projection Chart Header */}', optimizations_ui + '\n        {/* Projection Chart Header */}')

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
