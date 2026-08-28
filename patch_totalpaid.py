import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """export function getDebtTotalPaid(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {
  let paid = parseFloat(String(debt.amortized || 0));
  const defaultPay = parseFloat(String(debt.minPay || debt.amount || 0));"""

replacement = """export function getDebtTotalPaid(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {
  let paid = 0; // Amortization is now a down payment and reduces principal upfront, so we don't count it as paid installments
  const defaultPay = parseFloat(String(debt.minPay || debt.amount || 0));"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched getDebtTotalPaid.")
else:
    print("Target not found.")
