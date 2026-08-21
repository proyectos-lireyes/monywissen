import re

# Patch ItemFormModal
with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target1 = """    const bal = parseFloat(String(balance)) || 0;
    const amort = parseFloat(String(amortized)) || 0;
    const principal = Math.max(0, bal - amort);
    const inst = parseInt(String(installments), 10) || 1;
    let pmt = principal / inst;"""

replacement1 = """    const bal = parseFloat(String(balance)) || 0;
    const principal = Math.max(0, bal);
    const inst = parseInt(String(installments), 10) || 1;
    let pmt = principal / inst;"""

if target1 in content:
    content = content.replace(target1, replacement1)
    with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
        f.write(content)
    print("Patched ItemFormModal")
else:
    print("Could not find target1 in ItemFormModal")

# Patch financialEngine
with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target2 = """  let initialTotalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  let totalDebt = Math.max(0, initialTotalDebt - amort);
  const inst = parseInt(String(debt.installments || 1), 10);
  const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
  let pay = totalDebt / inst;
  
  if (hasInt && debt.apr && parseFloat(String(debt.apr)) > 0) {
    const r = (parseFloat(String(debt.apr)) / 100) / 12;
    const isBiweekly = freq === 'biweekly';
    const instMonths = isBiweekly ? inst / 2 : inst;
    const monthlyPay = totalDebt * (r * Math.pow(1 + r, instMonths)) / (Math.pow(1 + r, instMonths) - 1);
    pay = isBiweekly ? monthlyPay / 2 : monthlyPay;
    totalDebt = pay * inst;
  }

  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  const overridesPaid = Math.max(0, totalPaid - amort);
  let unallocatedPaid = 0;
  let remainingPrincipal = totalDebt - overridesPaid;"""

replacement2 = """  let initialTotalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  const inst = parseInt(String(debt.installments || 1), 10);
  const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
  
  let pay = initialTotalDebt / inst;
  let lifetimeTotal = initialTotalDebt;
  
  if (hasInt && debt.apr && parseFloat(String(debt.apr)) > 0) {
    const r = (parseFloat(String(debt.apr)) / 100) / 12;
    const isBiweekly = freq === 'biweekly';
    const instMonths = isBiweekly ? inst / 2 : inst;
    const monthlyPay = initialTotalDebt * (r * Math.pow(1 + r, instMonths)) / (Math.pow(1 + r, instMonths) - 1);
    pay = isBiweekly ? monthlyPay / 2 : monthlyPay;
    lifetimeTotal = pay * inst;
  }

  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  let unallocatedPaid = 0;
  let remainingPrincipal = lifetimeTotal - totalPaid;"""

if target2 in content:
    content = content.replace(target2, replacement2)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched financialEngine")
else:
    print("Could not find target2 in financialEngine")
