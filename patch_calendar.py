import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

target = """  const filterOccurrence = (e: any) => {
    const isOverdue = !e.done && e.originalDate < today;"""

replacement = """  const filterOccurrence = (e: any) => {
    if (e.type === 'opening_balance') return false;
    const isOverdue = !e.done && e.originalDate < today;"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/calendar/CalendarView.tsx', 'w') as f:
        f.write(content)
    print("Patched CalendarView")
else:
    print("Target not found")
