import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    lines = f.read().split('\n')

start_idx = -1
end_idx = -1

for i, l in enumerate(lines):
    if "{/* Date range inputs & series toggles */}" in l:
        start_idx = i
    if "{/* Upcoming 30-Day Timeline */}" in l:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    print(f"Replacing from {start_idx} to {end_idx}")
    
    # We will build the correct block with the user's requested order:
    # 1. Ingresos
    # 2. Deudas
    # 3. Gastos
    # 4. Egresos
    # 5. Disponibilidad
    # 6. Ahorros
    # 7. Saldo Acumulado
    
    lines_dot_true = """                  <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="Deudas" stroke="#f59e0b" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos + Deudas)" stroke="#f43f5e" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["netAvailable"]} type="monotone" dataKey="netAvailable" yAxisId="left" name="Disponibilidad (Flujo Neto)" stroke="#3b82f6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["savingsAccumulated"]} type="monotone" dataKey="savingsAccumulated" yAxisId="rightSavings" name="Ahorros" stroke="#0ea5e9" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />
                  <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6" strokeWidth={2} dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }} />"""

    lines_dot_false = lines_dot_true.replace("dot={true}", "dot={false}").replace("e.stopPropagation();", "if(payload && payload.payload)").replace("'pointer' }", "'pointer', r: 6 }")

    new_block = f"""          {{/* Date range inputs & series toggles */}}
          <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-between items-stretch sm:items-center">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Inicio Plan</label>
                <input
                  type="date"
                  value={{profile.settings.planStart}}
                  onChange={{e => handleUpdatePlanDates(e.target.value, profile.settings.planEnd)}}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fin Plan</label>
                <input
                  type="date"
                  value={{profile.settings.planEnd}}
                  onChange={{e => handleUpdatePlanDates(profile.settings.planStart, e.target.value)}}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <button
              onClick={{() => {{
                updateProfileData({{ settings: {{ ...profile.settings, forceRecalculate: Date.now() }} }});
                showToast('Recalculando proyecciones...');
              }}}}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recalcular
            </button>
          </div>

          {{/* Recharts Canvas */}}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {{chartMode === 3 ? (
                <ComposedChart data={{netFlowMonthlyData}} onClick={{(e) => {{ if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}}}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={{10}} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <YAxis yAxisId="rightSavings" orientation="right" stroke="#0ea5e9" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <Tooltip content={{<CustomTooltip />}} wrapperStyle={{{{ pointerEvents: 'none' }}}} />
                  <Legend onClick={{(e) => toggleLine(e.dataKey as string)}} wrapperStyle={{{{ cursor: 'pointer' }}}} />
                  <ReferenceLine y={{0}} stroke="#64748b" strokeDasharray="3 3" yAxisId="left" />
                  <Bar hide={{hiddenLines["netAvailable"]}} yAxisId="left" dataKey="netAvailable" name="Flujo Neto Mensual">
                    {{
                      netFlowMonthlyData.map((entry, index) => (
                        <Cell key={{`cell-${{index}}`}} fill={{entry.netAvailable >= 0 ? '#10b981' : '#ef4444'}} />
                      ))
                    }}
                  </Bar>
                </ComposedChart>
              ) : chartMode === 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={{expensePieData}}
                      cx="50%"
                      cy="50%"
                      innerRadius={{60}}
                      outerRadius={{80}}
                      paddingAngle={{5}}
                      dataKey="value"
                    >
                      {{expensePieData.map((entry, index) => (
                        <Cell key={{`cell-${{index}}`}} fill={{entry.color}} />
                      ))}}
                    </Pie>
                    <Tooltip content={{<CustomTooltip />}} wrapperStyle={{{{ pointerEvents: 'none' }}}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : chartMode === 4 ? (
                <ComposedChart data={{weeklyData}} onClick={{(e) => {{ if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}}}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={{10}} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <YAxis yAxisId="rightSavings" orientation="right" stroke="#0ea5e9" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <Tooltip content={{<CustomTooltip />}} wrapperStyle={{{{ pointerEvents: 'none' }}}} />
                  <Legend onClick={{(e) => toggleLine(e.dataKey as string)}} wrapperStyle={{{{ cursor: 'pointer' }}}} />
{lines_dot_true}
                </ComposedChart>
              ) : chartMode === 5 ? (
                <ComposedChart data={{biweeklyData}} onClick={{(e) => {{ if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}}}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={{10}} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <YAxis yAxisId="rightSavings" orientation="right" stroke="#0ea5e9" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <Tooltip content={{<CustomTooltip />}} wrapperStyle={{{{ pointerEvents: 'none' }}}} />
                  <Legend onClick={{(e) => toggleLine(e.dataKey as string)}} wrapperStyle={{{{ cursor: 'pointer' }}}} />
{lines_dot_true}
                </ComposedChart>
              ) : chartMode === 1 ? (
                <ComposedChart data={{monthlyData}} onClick={{(e) => {{ if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}}}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={{10}} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <YAxis yAxisId="rightSavings" orientation="right" stroke="#0ea5e9" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <Tooltip content={{<CustomTooltip />}} wrapperStyle={{{{ pointerEvents: 'none' }}}} />
                  <Legend onClick={{(e) => toggleLine(e.dataKey as string)}} wrapperStyle={{{{ cursor: 'pointer' }}}} />
{lines_dot_true}
                </ComposedChart>
              ) : (
                <ComposedChart data={{chartData}} onClick={{(e) => {{ if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}}}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={{10}} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <YAxis yAxisId="rightSavings" orientation="right" stroke="#0ea5e9" fontSize={{10}} tickFormatter={{val => `$${{val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}}`}} />
                  <Tooltip content={{<CustomTooltip />}} wrapperStyle={{{{ pointerEvents: 'none' }}}} />
                  <Legend onClick={{(e) => toggleLine(e.dataKey as string)}} wrapperStyle={{{{ fontSize: '11px', paddingTop: '4px', cursor: 'pointer' }}}} />
{lines_dot_false}
                </ComposedChart>
              )}}
            </ResponsiveContainer>
          </div>
        </div>
      </div>"""

    lines = lines[:start_idx] + [new_block] + lines[end_idx:]
    
    with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
        f.write('\n'.join(lines))
        
    print("Restore complete.")
else:
    print("Could not find start/end indices")

