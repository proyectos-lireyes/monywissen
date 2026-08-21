import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

# Change pulledEarly colors from amber to emerald
content = content.replace('bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30', 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30')
content = content.replace('text-amber-900 dark:text-amber-100', 'text-emerald-900 dark:text-emerald-100')
content = content.replace('text-amber-500', 'text-emerald-500')
content = content.replace('text-amber-600/70 dark:text-amber-400/60', 'text-emerald-600/70 dark:text-emerald-400/60')
content = content.replace('bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300', 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300')

# Change isDelayed colors from orange to amber (yellow)
content = content.replace('bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/30', 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30')
content = content.replace('text-orange-500', 'text-amber-500')
content = content.replace('bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300', 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300')

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
