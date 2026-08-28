import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """  const calculatedPmt = React.useMemo(() => {
    const bal = parseFloat(String(balance)) || 0;
    const principal = Math.max(0, bal);
    const inst = parseInt(String(installments), 10) || 1;
    let pmt = principal / inst;
    const hasInt = debtType === 'loan_interest' || debtType === 'card' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
    if (hasInt && parseFloat(String(apr) || '0') > 0) {
        const r = (parseFloat(String(apr)) / 100) / 12;
        pmt = principal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
    }
    return pmt;
  }, [balance, amortized, installments, apr, debtType, profile.settings.customDebts]);"""

replacement = """  const calculatedPmt = React.useMemo(() => {
    const bal = parseFloat(String(balance)) || 0;
    const amort = parseFloat(String(amortized)) || 0;
    // Amortization (down payment) reduces the principal to be financed
    const principal = Math.max(0, bal - amort);
    const inst = parseInt(String(installments), 10) || 1;
    let pmt = principal / inst;
    const hasInt = debtType === 'loan_interest' || debtType === 'card' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
    if (hasInt && parseFloat(String(apr) || '0') > 0) {
        const r = (parseFloat(String(apr)) / 100) / 12;
        pmt = principal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
    }
    return pmt;
  }, [balance, amortized, installments, apr, debtType, profile.settings.customDebts]);"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
        f.write(content)
    print("Patched ItemFormModal.tsx successfully.")
else:
    print("Target not found in ItemFormModal.tsx.")
