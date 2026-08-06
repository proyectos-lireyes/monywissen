import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

search = """export function advanceDateFreq(curr: Date, freq: string, dueDay?: string | number): void {
  if (freq === 'weekly') {
    curr.setDate(curr.getDate() + 7);
  } else if (freq === 'biweekly') {"""

replace = """export function advanceDateFreq(curr: Date, freq: string, dueDay?: string | number): void {
  if (freq === 'weekly') {
    curr.setDate(curr.getDate() + 7);
    if (dueDay !== undefined) {
      const targetDay = parseInt(String(dueDay), 10);
      if (!isNaN(targetDay) && targetDay >= 0 && targetDay <= 6) {
        const currentDay = curr.getDay();
        const diff = targetDay - currentDay;
        curr.setDate(curr.getDate() + diff);
      }
    }
  } else if (freq === 'biweekly') {"""

content = content.replace(search, replace)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)
