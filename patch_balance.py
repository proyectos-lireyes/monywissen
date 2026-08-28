import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

# Fix incomes
content = re.sub(
    r'for \(const e of incomes\) {\s*applied\.push\(\{ \.\.\.e, date: d \}\);\s*balance \+= e\.amt;\s*}',
    r'for (const e of incomes) {\n        balance += e.amt;\n        applied.push({ ...e, date: d, runningBalance: balance });\n    }',
    content
)

# Fix strictOut
content = re.sub(
    r'for \(const e of strictOut\) {\s*applied\.push\(\{ \.\.\.e, date: d \}\);\s*balance \+= e\.amt;\s*}',
    r'for (const e of strictOut) {\n        balance += e.amt;\n        applied.push({ ...e, date: d, runningBalance: balance });\n    }',
    content
)

# Fix flexibleOut / candidates
content = re.sub(
    r'applied\.push\(\{ \.\.\.e, date: d \}\);\s*balance \+= e\.amt;',
    r'balance += e.amt;\n             applied.push({ ...e, date: d, runningBalance: balance });',
    content
)

# Fix finalization
target = """    // Finalize applied events WITH the post-rescue balance
    applied.forEach(e => {
      plan.push({
        ...e,
        balance, // balance AFTER this event (and after rescue)
        insufficientFunds: balance < targetMin,
        savingsAccumulated,
      });
    });"""

replacement = """    // Finalize applied events WITH running balance
    applied.forEach(e => {
      const stepBalance = e.runningBalance !== undefined ? e.runningBalance : balance;
      plan.push({
        ...e,
        balance: stepBalance,
        insufficientFunds: stepBalance < targetMin,
        savingsAccumulated,
      });
    });"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/utils/financialEngine.ts', 'w') as f:
        f.write(content)
    print("Patched balance logic successfully.")
else:
    print("Target not found for finalization.")

