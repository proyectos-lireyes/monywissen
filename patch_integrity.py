import re

with open('src/utils/financialIntegrity.ts', 'r') as f:
    content = f.read()

# I will return empty array for optimizations since Auto-Pilot does it directly on the plan.
new_func = """
export function detectOptimizations(profile: UserProfile, exchangeRates: Record<string, number> = {}): OptimizationSuggestion[] {
  return []; // Replaced by Engine Auto-Pilot
}
"""

pattern = re.compile(r'export function detectOptimizations.*?\n\}', re.DOTALL)
content = pattern.sub(new_func, content)

with open('src/utils/financialIntegrity.ts', 'w') as f:
    f.write(content)

