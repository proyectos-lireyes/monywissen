import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Replace 'optimized:' with 'optimizedAdelantados?: number; optimizedAtrasados?: number;' in Record types
content = re.sub(r'optimized\?: number;', r'optimizedAdelantados?: number; optimizedAtrasados?: number;', content)

# Replace 'optimized: 0,' with 'optimizedAdelantados: 0,\n          optimizedAtrasados: 0,' in init blocks
content = re.sub(r'optimized: 0,', r'optimizedAdelantados: 0,\n          optimizedAtrasados: 0,', content)

# Replace 'if (e.pulledEarly)' with the three conditions in the 4 loops (daily, biweekly, weekly, monthly)
# We can just match 'if (e.pulledEarly) [a-zA-Z0-9_\[\]\.]+ \+= Math.abs\(e.amt\);'
# Wait, let's use a regex that matches the assignment to .optimized
def replace_agg(match):
    prefix = match.group(1)
    return f"""if (e.pulledEarly) {prefix}.optimizedAdelantados += Math.abs(e.amt);
      if (e.isDelayed && !e.insufficientFunds) {prefix}.optimizedAtrasados += Math.abs(e.amt);"""

content = re.sub(r'if \(e\.pulledEarly\)\s+([a-zA-Z0-9_\[\]]+)\.optimized \+= Math\.abs\(e\.amt\);', replace_agg, content)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
