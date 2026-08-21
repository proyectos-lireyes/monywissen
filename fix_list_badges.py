import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

replacement = """                          {!e.done && e.pulledEarly && (
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title={`Adelantado desde el ${e.optimizedFrom}`}>⚡ Adelantado</span>
                          )}
                          {!e.done && e.isDelayed && !e.insufficientFunds && (
                            <span className="text-[9px] bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title={`Retrasado desde el ${e.optimizedFrom}`}>⚠️ Pospuesto</span>
                          )}
                          {!e.done && e.insufficientFunds && e.amt < 0 && (
                            <span className="text-[9px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title="Quiebre / Fondos insuficientes">🚨 Quiebre</span>
                          )}"""

pattern = re.compile(r'                          \{\!e\.done && e\.pulledEarly && \(\s*<span className="text-\[9px\] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title=\{\`Adelantado desde el \$\{e\.optimizedFrom\}\`\}>⚡ Auto-Adelanto<\/span>\s*\)\}\s*\{\!e\.done && e\.isDelayed && \(\s*<span className="text-\[9px\] bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title=\{\`Retrasado desde el \$\{e\.optimizedFrom\}\`\}>⚠️ Auto-Retraso<\/span>\s*\)\}', re.DOTALL)

content = pattern.sub(replacement, content)

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
