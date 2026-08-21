import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

replacement = """<div key={idx} 
                           onClick={() => onOpenDetails && onOpenDetails(opt.type, opt.ref?.id, opt.originalDate, opt.date)}
                           className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-800/30 flex items-center gap-2 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/40 transition-colors">"""

content = content.replace('<div key={idx} className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-800/30 flex items-center gap-2">', replacement)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
