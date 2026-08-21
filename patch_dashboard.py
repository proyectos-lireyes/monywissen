import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add datesBetween to imports
content = content.replace(
    'todayStr,',
    'todayStr,\n  datesBetween,'
)

# Modify chartDataMap initialization
old_init = """  // Prepare Recharts Data
  const chartDataMap: Record<string, { date: string; label: string; balance: number; income: number; expense: number; debt: number; totalEgresos: number; netAvailable: number; items: any[]; optimizedAdelantados?: number; optimizedAtrasados?: number; deficit?: number }> = {};

  plan.forEach(e => {"""

new_init = """  // Prepare Recharts Data
  const chartDataMap: Record<string, { date: string; label: string; balance: number; income: number; expense: number; debt: number; totalEgresos: number; netAvailable: number; items: any[]; optimizedAdelantados?: number; optimizedAtrasados?: number; deficit?: number; plannedIncome: number; plannedEgresos: number; }> = {};

  // Initialize all dates in range
  const allDates = datesBetween(profile.settings.planStart, profile.settings.planEnd);
  allDates.forEach(d => {
    chartDataMap[d] = {
      date: d,
      label: formatDateStr(d).substring(0, 5),
      balance: profile.settings.openingBalance, // Will be overridden
      income: 0,
      expense: 0,
      optimizedAdelantados: 0,
      optimizedAtrasados: 0,
      deficit: 0,
      debt: 0,
      totalEgresos: 0,
      netAvailable: 0,
      plannedIncome: 0,
      plannedEgresos: 0,
      items: [],
    };
  });

  let runningBalance = profile.settings.openingBalance;

  plan.forEach(e => {"""

content = content.replace(old_init, new_init)

# Add planned processing in the loop
old_loop = """      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) chartDataMap[e.date].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') chartDataMap[e.date].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) chartDataMap[e.date].debt += Math.abs(e.amt);
      chartDataMap[e.date].balance = e.balance;
      chartDataMap[e.date].items.push(e);
    }
  });"""

new_loop = """      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) chartDataMap[e.date].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') chartDataMap[e.date].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) chartDataMap[e.date].debt += Math.abs(e.amt);
      chartDataMap[e.date].balance = e.balance;
      runningBalance = e.balance;
      chartDataMap[e.date].items.push(e);
    }
    // Also track planned (original) amounts
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
         chartDataMap[e.originalDate].plannedIncome += e.amt;
      }
      if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
         chartDataMap[e.originalDate].plannedEgresos += Math.abs(e.amt);
      }
    }
  });
  
  // Backfill balances for days with no events
  let lastBal = profile.settings.openingBalance;
  allDates.forEach(d => {
    if (chartDataMap[d].items.length > 0) {
      lastBal = chartDataMap[d].balance;
    } else {
      chartDataMap[d].balance = lastBal;
    }
  });"""

content = content.replace(old_loop, new_loop)

# Add the Line component to the charts
old_chart = """                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />
                    
                                        <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />"""

new_chart = """                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />
                    
                    <Line hide={hiddenLines["plannedIncome"]} type="monotone" dataKey="plannedIncome" yAxisId="left" name="Ingresos Planeados" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    <Line hide={hiddenLines["plannedEgresos"]} type="monotone" dataKey="plannedEgresos" yAxisId="left" name="Egresos Planeados" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                                        <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />"""

content = content.replace(old_chart, new_chart)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
