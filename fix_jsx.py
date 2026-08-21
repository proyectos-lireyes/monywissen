import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# I will replace from `<div className="h-80 w-full relative">` to `{/* Upcoming 30-Day Timeline */}`

pattern = re.compile(r'<div className="h-80 w-full relative">.*?\{\/\* Upcoming 30-Day Timeline \*\/\}', re.DOTALL)

replacement = """<div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const activeData = chartMode === 5 ? dailyData : chartMode === 4 ? weeklyData : chartMode === 3 ? biweeklyData : (chartMode === 2 || chartMode === 1) ? monthlyData : chartData;
                return (
                  <ComposedChart data={activeData} onClick={(e) => { if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                    <Legend onClick={(e) => toggleLine(e.dataKey as string)} wrapperStyle={{ fontSize: '11px', paddingTop: '4px', cursor: 'pointer' }} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />
                    
                    <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" yAxisId="left" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" yAxisId="left" name="Deudas" stroke="#f59e0b" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos + Deudas)" stroke="#f43f5e" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Saldo Acumulado (Disponible)" stroke="#8b5cf6" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer', r: 6 }} />
                    <Bar hide={hiddenLines["optimized"]} dataKey="optimized" yAxisId="left" fill="#fbbf24" name="Optimizados (Adelantados)" barSize={10} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" yAxisId="left" fill="#ef4444" name="Déficit (Alerta de Quiebre)" barSize={10} radius={[4,4,0,0]} />
                  </ComposedChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
          
          <div className="h-40 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Acumulación de Ahorros</h4>
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const activeData = chartMode === 5 ? dailyData : chartMode === 4 ? weeklyData : chartMode === 3 ? biweeklyData : (chartMode === 2 || chartMode === 1) ? monthlyData : chartData;
                return (
                  <ComposedChart data={activeData}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} hide />
                    <YAxis stroke="#0ea5e9" fontSize={10} tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="savingsAccumulated" name="Ahorros" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  </ComposedChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming 30-Day Timeline */}"""

content = pattern.sub(replacement, content)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
