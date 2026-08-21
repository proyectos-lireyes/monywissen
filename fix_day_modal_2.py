import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

replacement = """                  <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.ref?.effectiveColor || '#94a3b8' }}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold flex items-center gap-1.5 truncate ${e.pulledEarly ? 'text-amber-900 dark:text-amber-100' : e.insufficientFunds && e.amt < 0 ? 'text-rose-900 dark:text-rose-100' : 'text-slate-900 dark:text-slate-100'}`}>
                        {e.label}
                        {e.pulledEarly && <span title="Adelantado automáticamente" className="text-amber-500">⚡</span>}
                        {e.insufficientFunds && e.amt < 0 && <span title="Alerta de Quiebre" className="text-rose-500">🚨</span>}
                        {e.isDelayed && !e.insufficientFunds && <span title="Retrasado" className="text-orange-500">⚠️</span>}
                      </p>
                      <p className={`text-[10px] ${e.pulledEarly ? 'text-amber-600/70 dark:text-amber-400/60' : e.insufficientFunds && e.amt < 0 ? 'text-rose-600/70 dark:text-rose-400/60' : 'text-slate-400'}`}>{e.type}</p>
                    </div>
                  </div>"""

pattern = re.compile(r'                  <div className="flex-1 min-w-0 pr-2">\s*<p className=\{\`text-xs font-bold flex items-center gap-1\.5 truncate.*?\s*\{e\.type\}<\/p>\s*<\/div>', re.DOTALL)

content = pattern.sub(replacement, content)

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
