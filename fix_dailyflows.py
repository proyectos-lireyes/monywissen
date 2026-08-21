import re

with open('src/utils/financialIntegrity.ts', 'r') as f:
    content = f.read()

decl = """
  const dailyFlows: Record<string, number> = {};
  plan.forEach(item => {
    if (!dailyFlows[item.date]) dailyFlows[item.date] = 0;
    dailyFlows[item.date] += item.amt;
  });

  // Detect Delay Pay (liquidity breach or negative flow)"""

content = content.replace('// Detect Delay Pay (liquidity breach or negative flow)', decl)

with open('src/utils/financialIntegrity.ts', 'w') as f:
    f.write(content)
