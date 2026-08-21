import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

# Fix the calculateAmortizationPlan to break when debt is fully paid
old_code = """
    if (!isPaid && requiredPay <= 0) {
      if (isCard || i >= inst) {
        break; 
      }
    }
"""

new_code = """
    if (!isPaid && remainingPrincipal <= 0) {
      break; 
    }
    if (!isPaid && requiredPay <= 0) {
      if (isCard || i >= inst) {
        break; 
      }
    }
"""
content = content.replace(old_code, new_code)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)
