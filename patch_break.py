import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    if (!isPaid && remainingPrincipal <= 0) {
      break; 
    }
    if (!isPaid && requiredPay <= 0) {
      if (isCard || i >= inst) {
        break; 
      }
    }"""

replacement = """    if (!isPaid && expectedAmount <= 0) {
      break; 
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched break condition")
else:
    print("Could not find break condition")

