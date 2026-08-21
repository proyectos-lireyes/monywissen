import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

# targetMin was declared before // 5. Day-by-Day. So I redeclared it.
content = content.replace("  const targetMin = settings.minBalance || 0;\n\n  let futureEvents: any[] = [];", "  let futureEvents: any[] = [];")

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)
