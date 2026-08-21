import re
with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

match = re.search(r'(const addOccurrence = \(.*?\).*?)\n  \/\/ 1\. Process Incomes', content, re.DOTALL)
if match: print(match.group(1))
