import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """      if (finalDate >= startD && finalDate <= endD) {
        if (!map[finalDate]) map[finalDate] = [];
        map[finalDate].push(occurrence);
      } else if (finalDate < startD && !done) {
        occurrence.originalDate = dateStr;
        if (!map[startD]) map[startD] = [];
        map[startD].push(occurrence);
      }"""

replacement = """      if (finalDate >= startD && finalDate <= endD) {
        if (!map[finalDate]) map[finalDate] = [];
        map[finalDate].push(occurrence);
      }"""

content = content.replace(target, replacement)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
