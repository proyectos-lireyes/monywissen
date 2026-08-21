import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """      } else {
        applied.push(e);
        pendingBal += e.amt;
      }
    });"""

replacement = """      } else {
        e.insufficientFunds = false;
        applied.push(e);
        pendingBal += e.amt;
      }
    });"""

if target in content:
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success clear flag")
else:
    print("Target not found")
