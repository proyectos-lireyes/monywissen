import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

match = re.search(r'(export function calculateAmortizationPlan\(.*?\): AmortizationInstallment\[\] \{)(.*?)(^\})', content, re.DOTALL | re.MULTILINE)
if match:
    with open('amort_func.txt', 'w') as out:
        out.write(match.group(1) + match.group(2) + match.group(3))
else:
    print("Not found")
