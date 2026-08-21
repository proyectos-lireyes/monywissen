import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# 1. Add hiddenLines state
target_state = "  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);"
replacement_state = "  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);\n  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});\n\n  const toggleLine = (dataKey: string) => {\n    setHiddenLines(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));\n  };"
content = content.replace(target_state, replacement_state)

# 2. Update Daily chart aggregation
target_daily_agg = """  const chartDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }> = {};
  plan.forEach(e => {
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!chartDataMap[e.date]) {
        chartDataMap[e.date] = { label: e.date, income: 0, expense: 0, debt: 0, netAvailable: 0, items: [] };
      }
      if (e.amt > 0 && e.type === 'income') chartDataMap[e.date].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') chartDataMap[e.date].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) chartDataMap[e.date].debt += Math.abs(e.amt);
      chartDataMap[e.date].items.push(e);
      chartDataMap[e.date].balance = e.balance;
    }
  });"""
replacement_daily_agg = """  const chartDataMap: Record<string, { label: string; income: number; expense: number; debt: number; savingsAccumulated: number; items: any[]; balance?: number }> = {};
  plan.forEach(e => {
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!chartDataMap[e.date]) {
        chartDataMap[e.date] = { label: e.date, income: 0, expense: 0, debt: 0, savingsAccumulated: 0, items: [] };
      }
      if (e.amt > 0 && e.type === 'income') chartDataMap[e.date].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') chartDataMap[e.date].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) chartDataMap[e.date].debt += Math.abs(e.amt);
      chartDataMap[e.date].items.push(e);
      chartDataMap[e.date].balance = e.balance;
      chartDataMap[e.date].savingsAccumulated = e.savingsAccumulated || 0;
    }
  });"""
content = content.replace(target_daily_agg, replacement_daily_agg)
content = content.replace(
  "chartDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }>",
  "chartDataMap: Record<string, { label: string; income: number; expense: number; debt: number; savingsAccumulated: number; items: any[]; balance?: number }>"
)

# 3. Update Weekly aggregation
target_weekly_agg = """      if (e.amt > 0 && e.type === 'income') weeklyDataMap[weekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') weeklyDataMap[weekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].items.push(e);
      weeklyDataMap[weekPrefix].balance = e.balance; // Keep last balance of the week
    }
  });
  Object.values(weeklyDataMap).forEach(d => { d.netAvailable = d.income - d.expense - d.debt; });"""
replacement_weekly_agg = """      if (e.amt > 0 && e.type === 'income') weeklyDataMap[weekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') weeklyDataMap[weekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].items.push(e);
      weeklyDataMap[weekPrefix].balance = e.balance; // Keep last balance of the week
      weeklyDataMap[weekPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
  });"""
content = content.replace(target_weekly_agg, replacement_weekly_agg)
content = content.replace(
  "weeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }>",
  "weeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; savingsAccumulated?: number; items: any[]; balance?: number }>"
)

# 4. Update Biweekly aggregation
target_biweekly_agg = """      if (e.amt > 0 && e.type === 'income') biweeklyDataMap[prefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') biweeklyDataMap[prefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) biweeklyDataMap[prefix].debt += Math.abs(e.amt);
      biweeklyDataMap[prefix].items.push(e);
      biweeklyDataMap[prefix].balance = e.balance;
    }
  });
  Object.values(biweeklyDataMap).forEach(d => { d.netAvailable = d.income - d.expense - d.debt; });"""
replacement_biweekly_agg = """      if (e.amt > 0 && e.type === 'income') biweeklyDataMap[prefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') biweeklyDataMap[prefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) biweeklyDataMap[prefix].debt += Math.abs(e.amt);
      biweeklyDataMap[prefix].items.push(e);
      biweeklyDataMap[prefix].balance = e.balance;
      biweeklyDataMap[prefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
  });"""
content = content.replace(target_biweekly_agg, replacement_biweekly_agg)
content = content.replace(
  "biweeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }>",
  "biweeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; savingsAccumulated?: number; items: any[]; balance?: number }>"
)

# 5. Update Monthly aggregation
target_monthly_agg = """      if (e.amt > 0 && e.type === 'income') monthlyDataMap[monthPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].items.push(e);
      monthlyDataMap[monthPrefix].balance = e.balance;
    }
  });
  Object.values(monthlyDataMap).forEach(d => { d.netAvailable = d.income - d.expense - d.debt; });"""
replacement_monthly_agg = """      if (e.amt > 0 && e.type === 'income') monthlyDataMap[monthPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].items.push(e);
      monthlyDataMap[monthPrefix].balance = e.balance;
      monthlyDataMap[monthPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
  });"""
content = content.replace(target_monthly_agg, replacement_monthly_agg)
content = content.replace(
  "monthlyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }>",
  "monthlyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; savingsAccumulated?: number; items: any[]; balance?: number }>"
)

# 6. Update line elements (add hide={hiddenLines.something}, and the click handler on Legend)
target_custom_legend = "<Legend />"
replacement_custom_legend = "<Legend onClick={(e) => toggleLine(e.dataKey as string)} wrapperStyle={{ cursor: 'pointer' }} />"
content = content.replace("<Legend />", replacement_custom_legend)

# Specifically for the main daily chart (chartData), we need a custom right-side YAxis for savings
# Let's see how YAxis is structured for the daily chart

# Add savings to lines and hide logic
def replace_lines(block):
    block = block.replace(
        '<Line type="monotone" dataKey="income" name="Ingresos"',
        '<Line hide={hiddenLines["income"]} type="monotone" dataKey="income" name="Ingresos"'
    )
    block = block.replace(
        '<Line type="monotone" dataKey="expense" name="Gastos"',
        '<Line hide={hiddenLines["expense"]} type="monotone" dataKey="expense" name="Gastos"'
    )
    block = block.replace(
        '<Line type="monotone" dataKey="debt" name="Deudas"',
        '<Line hide={hiddenLines["debt"]} type="monotone" dataKey="debt" name="Deudas"'
    )
    block = block.replace(
        '<Line type="monotone" dataKey="balance" name="Saldo Acumulado (Liquidez)"',
        '<Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" name="Saldo Acumulado (Liquidez)"'
    )
    # Add savings
    block = block.replace(
        'strokeWidth={2} dot={true} />\n                </ComposedChart>',
        'strokeWidth={2} dot={true} />\n                  <Line hide={hiddenLines["savingsAccumulated"]} type="monotone" dataKey="savingsAccumulated" name="Ahorros" stroke="#0ea5e9" strokeWidth={2} dot={true} />\n                </ComposedChart>'
    )
    return block

content = replace_lines(content)

# For the complex chartData (chartMode===0), with left/right axis
daily_axes_target = """                  {showBalanceLine && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#2563eb"
                      fontSize={10}
                      tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                  )}"""
daily_axes_replacement = """                  {showBalanceLine && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#2563eb"
                      fontSize={10}
                      tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                  )}
                  <YAxis
                    yAxisId="rightSavings"
                    orientation="right"
                    stroke="#0ea5e9"
                    fontSize={10}
                    tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                  />"""
content = content.replace(daily_axes_target, daily_axes_replacement)

daily_legend_target = "<Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />"
daily_legend_replacement = "<Legend onClick={(e) => toggleLine(e.dataKey as string)} wrapperStyle={{ fontSize: '11px', paddingTop: '4px', cursor: 'pointer' }} />"
content = content.replace(daily_legend_target, daily_legend_replacement)

daily_lines_target = """                  {showFlowLines && (
                    <>
                      <Line yAxisId="left" type="monotone" dataKey="income" name="Ingresos (Eje Izq.)" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="expense" name="Gastos (Eje Izq.)" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="debt" name="Deudas (Eje Izq.)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </>
                  )}
                  {showBalanceLine && (
                    <Line
                      yAxisId={showFlowLines ? 'right' : 'left'}
                      type="monotone"
                      dataKey="balance"
                      name="Saldo Disponible (Eje Der.)"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                    />
                  )}"""
daily_lines_replacement = """                  {showFlowLines && (
                    <>
                      <Line hide={hiddenLines["income"]} yAxisId="left" type="monotone" dataKey="income" name="Ingresos (Eje Izq.)" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line hide={hiddenLines["expense"]} yAxisId="left" type="monotone" dataKey="expense" name="Gastos (Eje Izq.)" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line hide={hiddenLines["debt"]} yAxisId="left" type="monotone" dataKey="debt" name="Deudas (Eje Izq.)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </>
                  )}
                  {showBalanceLine && (
                    <Line
                      hide={hiddenLines["balance"]}
                      yAxisId={showFlowLines ? 'right' : 'left'}
                      type="monotone"
                      dataKey="balance"
                      name="Saldo Disponible (Eje Der.)"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                    />
                  )}
                  <Line hide={hiddenLines["savingsAccumulated"]} yAxisId="rightSavings" type="monotone" dataKey="savingsAccumulated" name="Ahorros (Eje Ahorro)" stroke="#0ea5e9" strokeWidth={3} dot={false} />"""

content = content.replace(daily_lines_target, daily_lines_replacement)

# Tooltip content modification
tooltip_target = """        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#2563eb' }}>
          <span className="font-bold">Liquidez Real (Saldo):</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>"""
tooltip_replacement = """        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#2563eb' }}>
          <span className="font-bold">Liquidez Real (Saldo):</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>
        <div className="flex justify-between items-center text-xs mb-1 pt-1" style={{ color: '#0ea5e9' }}>
          <span className="font-bold">Ahorros Automáticos:</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.savingsAccumulated || 0)}</span>
        </div>"""
content = content.replace(tooltip_target, tooltip_replacement)


# Finally, for the click issue (the tooltip jumping to another date because hovering continues)
# Recharts doesn't natively "freeze" easily unless we control `activeTooltipIndex` manually or disable pointer events on the modal background.
# Actually, the modal IS absolute/fixed. If it's fixed over everything, mouse movements over the chart shouldn't trigger anything unless the chart is rendering ON TOP of the modal.
# Let's ensure modal has high z-index (it already has z-[100]). 
# If the click isn't properly targeting `activePayload`, we can change the click handler on the ComposedChart.

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
