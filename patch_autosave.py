import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    let hasIncomeToday = futureEvents.some(e => e.originalDate === d && e.amt > 0 && e.type === 'income' && !e.pulledEarly);
    if (hasIncomeToday && balance > targetMin) {"""

replacement = """    let hasIncomeToday = futureEvents.some(e => e.originalDate === d && e.amt > 0 && e.type === 'income' && !e.pulledEarly);
    if (hasIncomeToday && balance > targetMin && d !== startD) {"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched autosave logic")
else:
    print("Target not found")
