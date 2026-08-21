import re

with open('src/utils/financialIntegrity.ts', 'r') as f:
    content = f.read()

target = """  return {
    score,
    status,
    doubleEntryIssues,
    preventiveWarnings,
    contradictions,"""

replacement = """  const optimizations = detectOptimizations(profile, exchangeRates);
  return {
    score,
    status,
    doubleEntryIssues,
    preventiveWarnings,
    optimizations,
    contradictions,"""

content = content.replace(target, replacement)

with open('src/utils/financialIntegrity.ts', 'w') as f:
    f.write(content)

print("Success")
