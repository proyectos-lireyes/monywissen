import re

with open('src/utils/financialEngine.ts', 'r') as f:
    code = f.read()

target = "    if (isCard && i >= inst) break;"
replacement = "    if (isCard && i >= inst) break;\n    if (i >= inst && remainingPrincipal <= 0.01 && unallocatedPaid <= 0.01) break;"

if target in code:
    code = code.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(code)
    print("Patched!")
else:
    print("Target not found")
