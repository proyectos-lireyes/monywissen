import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

replacement = """
              const filteredPlan = plan
                .filter(e => searchQuery ? true : (e.date <= nextMonthEndStr))
                .filter(filterOccurrence);
"""

content = content.replace("""              const filteredPlan = plan
                .filter(e => e.date <= nextMonthEndStr)
                .filter(filterOccurrence);""", replacement)

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
