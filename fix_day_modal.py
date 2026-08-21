import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

replacement = """<div
                  key={idx}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    onOpenDetails(e.type, e.ref.id, e.originalDate, e.date);
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity border ${e.pulledEarly ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30' : e.insufficientFunds && e.amt < 0 ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30' : e.isDelayed ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/30' : 'bg-slate-50 border-transparent dark:bg-slate-800'}`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-xs font-bold flex items-center gap-1.5 truncate ${e.pulledEarly ? 'text-amber-900 dark:text-amber-100' : e.insufficientFunds && e.amt < 0 ? 'text-rose-900 dark:text-rose-100' : 'text-slate-900 dark:text-slate-100'}`}>
                      {e.label}
                      {e.pulledEarly && <span title="Adelantado automáticamente" className="text-amber-500">⚡</span>}
                      {e.insufficientFunds && e.amt < 0 && <span title="Alerta de Quiebre" className="text-rose-500">🚨</span>}
                      {e.isDelayed && !e.insufficientFunds && <span title="Retrasado" className="text-orange-500">⚠️</span>}
                    </p>
                    <p className={`text-[10px] ${e.pulledEarly ? 'text-amber-600/70 dark:text-amber-400/60' : e.insufficientFunds && e.amt < 0 ? 'text-rose-600/70 dark:text-rose-400/60' : 'text-slate-400'}`}>{e.type}</p>
                  </div>
                  <p className={`text-xs font-black ${e.pulledEarly ? 'text-amber-700 dark:text-amber-300' : e.insufficientFunds && e.amt < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100'}`}>
                    {formatCurrency(Math.abs(e.amt))}
                  </p>
                </div>"""

# Find the block inside the modal
pattern = re.compile(r'<div\s+key=\{idx\}\s+onClick=\{\(\) => \{\s+setSelectedDayEvents\(null\);\s+onOpenDetails\(e\.type, e\.ref\.id, e\.originalDate, e\.date\);\s+\}\}\s+className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-100"\s*>\s*<div>\s*<p className="text-xs font-bold text-slate-900 dark:text-slate-100">\{e\.label\}<\/p>\s*<p className="text-\[10px\] text-slate-400">\{e\.type\}<\/p>\s*<\/div>\s*<p className="text-xs font-black text-slate-900 dark:text-slate-100">\s*\{formatCurrency\(Math\.abs\(e\.amt\)\)\}\s*<\/p>\s*<\/div>', re.DOTALL)

content = pattern.sub(replacement, content)

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
