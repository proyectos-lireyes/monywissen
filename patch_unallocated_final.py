import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  let unallocatedPaid = totalPaid;
  let remainingPrincipal = lifetimeTotal - totalPaid;"""

replacement = """  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  let unallocatedPaid = amort;
  let remainingPrincipal = lifetimeTotal - totalPaid;"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched unallocatedPaid final")
else:
    print("Could not find unallocatedPaid target final")

