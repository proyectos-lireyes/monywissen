import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add items array to charts
content = content.replace(
    "netAvailable: number }>", 
    "netAvailable: number; items: any[] }>"
)

content = content.replace(
    "netAvailable: 0,", 
    "netAvailable: 0,\n          items: [],"
)

content = content.replace(
    "chartDataMap[e.date].balance = e.balance;", 
    "chartDataMap[e.date].balance = e.balance;\n      chartDataMap[e.date].items.push(e);"
)

content = content.replace(
    "weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);\n    }", 
    "weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);\n      weeklyDataMap[weekPrefix].items.push(e);\n    }"
)

content = content.replace(
    "monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);\n    }", 
    "monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);\n      monthlyDataMap[monthPrefix].items.push(e);\n    }"
)

# Custom Tooltip component
tooltip_comp = """
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg min-w-[200px]">
        <p className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{label}</p>
        
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center text-xs mb-1" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}:</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)}</span>
          </div>
        ))}
        
        {data.items && data.items.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Detalles del Período</p>
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
              {data.items.slice(0, 8).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{item.label}</span>
                  <span className={`font-semibold ${item.amt > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.amt > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amt)}
                  </span>
                </div>
              ))}
              {data.items.length > 8 && (
                <p className="text-[10px] text-slate-400 italic text-center pt-1">... y {data.items.length - 8} más</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};
"""

# Inject CustomTooltip
content = content.replace("const getWeekStart = (dateStr: string) => {", tooltip_comp + "\n\nconst getWeekStart = (dateStr: string) => {")

# Replace default Tooltip with CustomTooltip
content = content.replace("<Tooltip formatter={(value: number) => formatCurrency(value)} />", "<Tooltip content={<CustomTooltip />} />")

# Enhance Preventive Warnings to show recommendedAction
warnings_target = """{integrityReport.preventiveWarnings.slice(0, 2).map(w => (
                  <p key={w.id} className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-tight">
                    • {w.message}
                  </p>
                ))}"""
warnings_replacement = """{integrityReport.preventiveWarnings.slice(0, 2).map(w => (
                  <div key={w.id} className="mb-1.5 border-b border-amber-200/50 dark:border-amber-900/50 pb-1.5 last:border-0 last:pb-0 last:mb-0">
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-tight mb-1">
                      • {w.message}
                    </p>
                    {w.recommendedAction && (
                      <p className="text-[10.5px] text-amber-600 dark:text-amber-500 italic pl-3 leading-tight flex items-start gap-1">
                        <TrendingUp className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        Plan de acción: {w.recommendedAction}
                      </p>
                    )}
                  </div>
                ))}"""
content = content.replace(warnings_target, warnings_replacement)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print('Success')
