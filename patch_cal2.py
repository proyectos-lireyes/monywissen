import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

badge_html = """
                          {!e.done && e.pulledEarly && (
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title={`Adelantado desde el ${e.optimizedFrom}`}>⚡ Auto-Adelanto</span>
                          )}
                          {!e.done && e.isDelayed && (
                            <span className="text-[9px] bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title={`Retrasado desde el ${e.optimizedFrom}`}>⚠️ Auto-Retraso</span>
                          )}
"""

content = content.replace('{!e.done && e.date < today && (', badge_html + '\n                          {!e.done && e.date < today && (')

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
