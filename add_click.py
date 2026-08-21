import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add PeriodDetailsModal state
modal_state = """  const [pinnedTooltip, setPinnedTooltip] = useState<any>(null);
  const [periodDetails, setPeriodDetails] = useState<any>(null);"""
content = content.replace("  const [pinnedTooltip, setPinnedTooltip] = useState<any>(null);", modal_state)

# Add chart onClick handler
chart_click = """<ComposedChart data={chartData} onClick={(e) => { if (e && e.activePayload && e.activePayload[0]) setPeriodDetails(e.activePayload[0].payload); }}>"""
content = content.replace("<ComposedChart data={chartData}>", chart_click)
content = content.replace("<ComposedChart data={weeklyData}>", """<ComposedChart data={weeklyData} onClick={(e) => { if (e && e.activePayload && e.activePayload[0]) setPeriodDetails(e.activePayload[0].payload); }}>""")
content = content.replace("<ComposedChart data={biweeklyData}>", """<ComposedChart data={biweeklyData} onClick={(e) => { if (e && e.activePayload && e.activePayload[0]) setPeriodDetails(e.activePayload[0].payload); }}>""")
content = content.replace("<ComposedChart data={monthlyData}>", """<ComposedChart data={monthlyData} onClick={(e) => { if (e && e.activePayload && e.activePayload[0]) setPeriodDetails(e.activePayload[0].payload); }}>""")

# Add Period Details Modal component at the end of return statement
modal_ui = """
      {/* Period Details Modal */}
      {periodDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Detalles del Período: {periodDetails.label}
              </h2>
              <button
                onClick={() => setPeriodDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Ingresos</span>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(periodDetails.income)}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-800/30">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Gastos + Deudas</span>
                  <p className="text-lg font-black text-rose-700 dark:text-rose-300">{formatCurrency(periodDetails.expense + periodDetails.debt)}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Transacciones del Período</span>
                {periodDetails.items && periodDetails.items.length > 0 ? (
                  <div className="space-y-2">
                    {periodDetails.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.amt > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
                            item.type === 'debt' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' :
                            'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400'
                          }`}>
                            {item.amt > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                            <p className="text-[10px] font-medium text-slate-500">{item.date}</p>
                          </div>
                        </div>
                        <span className={`font-black ${
                          item.amt > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.amt > 0 ? '+' : ''}{formatCurrency(item.amt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">No hay transacciones en este período.</p>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setPeriodDetails(null)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace("    </div>\n  );\n};\n", modal_ui + "\n    </div>\n  );\n};\n")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
