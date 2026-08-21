import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

content = content.replace("originalDate: d,\n        done: true,", "originalDate: d,\n        done: d <= todayStr(),")

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
