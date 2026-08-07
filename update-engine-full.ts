import fs from 'fs';

let content = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

content = content.replace(
  'export function calculateProjections(profile: UserProfile): PlanOccurrence[] {',
  'export function calculateProjections(profile: UserProfile, exchangeRates: Record<string, number> = {}): PlanOccurrence[] {\n  const convAmt = (amt: number, currency?: string) => {\n    if (!currency || currency === \'USD_BCV\') return amt;\n    const rate = exchangeRates[currency];\n    return rate ? amt * rate : amt;\n  };\n'
);

// We replace `inc.amount` with `convAmt(inc.amount, (inc as any).currency)` in the income loop.
// Actually, JS regex allows doing this easily.
// For incomes
content = content.replace(/addOccurrence\(([^,]+), inc\.name, 'income', inc\.amount, inc\);/g, 'addOccurrence($1, inc.name, \'income\', convAmt(inc.amount, (inc as any).currency), inc);');

// For expenses
content = content.replace(/addOccurrence\(([^,]+), exp\.name, 'expense', -exp\.amount, exp\);/g, 'addOccurrence($1, exp.name, \'expense\', -convAmt(exp.amount, (exp as any).currency), exp);');

// For debts (around line 335)
// const pay = parseFloat(String(debt.amount || 0)); -> const pay = convAmt(parseFloat(String(debt.amount || 0)), (debt as any).currency);
// let totalDebt = parseFloat(String(debt.balance || 0)); -> let totalDebt = convAmt(parseFloat(String(debt.balance || 0)), (debt as any).currency);
// const amortized = parseFloat(String(debt.amortized || 0)); -> const amortized = convAmt(parseFloat(String(debt.amortized || 0)), (debt as any).currency);
content = content.replace(
  'const pay = parseFloat(String(debt.amount || 0));',
  'const pay = convAmt(parseFloat(String(debt.amount || 0)), (debt as any).currency);'
);
content = content.replace(
  'let totalDebt = parseFloat(String(debt.balance || 0));',
  'let totalDebt = convAmt(parseFloat(String(debt.balance || 0)), (debt as any).currency);'
);
content = content.replace(
  'const amortized = parseFloat(String(debt.amortized || 0));',
  'const amortized = convAmt(parseFloat(String(debt.amortized || 0)), (debt as any).currency);'
);
// Also for debt overrides `ov.amt` if it exists? Wait, overrides are manually input, assuming they are in the same currency as the debt? Yes, so they need conversion too!
// In debt loop:
// `effectivePayToAccumulate = parseFloat(String(ov.amt));`
// -> `effectivePayToAccumulate = convAmt(parseFloat(String(ov.amt)), (debt as any).currency);`
content = content.replace(
  'effectivePayToAccumulate = parseFloat(String(ov.amt));',
  'effectivePayToAccumulate = convAmt(parseFloat(String(ov.amt)), (debt as any).currency);'
);
content = content.replace(
  'const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + parseFloat(String(pt.amt || 0)), 0);',
  'const partialsSum = convAmt((ov.partials || []).reduce((sum: number, pt: any) => sum + parseFloat(String(pt.amt || 0)), 0), (debt as any).currency);'
);

// For savings
// addOccurrence(sav.date, `Divisa/Ahorro: ${sav.person}`, 'savings', -sav.amount, sav);
content = content.replace(
  /addOccurrence\(sav\.date, `Divisa\/Ahorro: \$\{sav\.person\}`\, 'savings', -sav\.amount, sav\);/g,
  'addOccurrence(sav.date, `Divisa/Ahorro: ${sav.person}`, \'savings\', -convAmt(sav.amount, (sav as any).currency), sav);'
);

fs.writeFileSync('src/utils/financialEngine.ts', content);
