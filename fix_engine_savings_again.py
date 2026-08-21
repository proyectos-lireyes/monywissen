import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  // 5. Day-by-Day Cash Flow Simulation with Liquidity Cushion
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];

  for (const d of datesBetween(startD, endD)) {"""

replacement = """  // 5. Day-by-Day Cash Flow Simulation with Liquidity Cushion
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];
  let savingsAccumulated = 0;

  for (const d of datesBetween(startD, endD)) {"""

content = content.replace(target, replacement)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
