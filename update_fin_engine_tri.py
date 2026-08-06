import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

search = """  } else if (freq === 'triweekly') {
    curr.setDate(curr.getDate() + 21);"""

replace = """  } else if (freq === 'triweekly') {
    // Treat as a specific week of the month (1, 2, 3, or 4) mapped to 7, 14, 21, 28
    const week = parseInt(String(dueDay || '1'), 10);
    const targetDay = week * 7;
    const m = curr.getMonth();
    curr.setMonth(m + 1, targetDay);
    if (curr.getMonth() !== (m + 1) % 12) {
      curr.setDate(0);
    }"""

content = content.replace(search, replace)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

