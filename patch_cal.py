import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

content = content.replace("{ev.label}", "{ev.pulledEarly ? '⚡ ' : ''}{ev.isDelayed ? '⚠️ ' : ''}{ev.label}")

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
