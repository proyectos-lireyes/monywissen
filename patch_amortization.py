import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

# Modify calculateAmortizationPlan to subtract amort from initialTotalDebt
# and NOT use it as unallocatedPaid

target = """  let initialTotalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  const inst = parseInt(String(debt.installments || 1), 10);
  const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
  
  let pay = initialTotalDebt / inst;
  let lifetimeTotal = initialTotalDebt;"""

replacement = """  let initialTotalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  const inst = parseInt(String(debt.installments || 1), 10);
  const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
  
  // Amortization (down payment) reduces the principal to be financed
  initialTotalDebt = Math.max(0, initialTotalDebt - amort);
  
  let pay = initialTotalDebt / inst;
  let lifetimeTotal = initialTotalDebt;"""

target2 = """  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  
  let unallocatedPaid = amort;
  let remainingPrincipal = lifetimeTotal - totalPaid;"""

replacement2 = """  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  
  let unallocatedPaid = 0; // Amortization is now a down payment, not a sequential payment over the installments
  let remainingPrincipal = lifetimeTotal - totalPaid;"""

if target in content and target2 in content:
    content = content.replace(target, replacement)
    content = content.replace(target2, replacement2)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched financialEngine.ts successfully.")
else:
    print("Target not found in financialEngine.ts.")
