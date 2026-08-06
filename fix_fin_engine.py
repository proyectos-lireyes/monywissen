import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

search_int = """      if (isStandardDebt && debt.hasInterest && debt.apr) {
        const months = debt.installments || 1;
        totalDebt += (totalDebt * debt.apr) * (months / 12);
      }"""

replace_int = """      // If this debt has an APR, we assume the `pay` amount already includes interest (calculated at creation).
      // Therefore, the true total debt is simply pay * installments.
      const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
      if (hasInt && debt.apr) {
        const inst = debt.installments || 1;
        totalDebt = pay * inst;
      }"""

content = content.replace(search_int, replace_int)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

