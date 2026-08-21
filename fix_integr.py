import re

with open('src/utils/financialIntegrity.ts', 'r') as f:
    content = f.read()

new_types = """export interface OptimizationSuggestion {
  id: string;
  originalDate: string;
  suggestedDate: string;
  type: 'EARLY_PAY' | 'DELAY_PAY';
  itemId: string;
  itemType: string;
  itemName: string;
  amount: number;
  message: string;
}

export interface IntegrityReport {"""

content = content.replace("export interface IntegrityReport {", new_types)

content = content.replace(
    "preventiveWarnings: PreventiveFlowWarning[];",
    "preventiveWarnings: PreventiveFlowWarning[];\n  optimizations: OptimizationSuggestion[];"
)

opt_code = """
/**
 * Generates smart date shifting recommendations to prevent liquidity issues or pay earlier.
 */
export function detectOptimizations(profile: UserProfile, exchangeRates: Record<string, number> = {}): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const plan = calculateProjections(profile, exchangeRates);
  const minBalance = profile.settings.minBalance || 0;
  
  const incomes = plan.filter(p => p.amt > 0 && p.type === 'income');
  
  // Detect Delay Pay (liquidity breach)
  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    if (item.balance < minBalance && item.amt < 0 && !item.done) {
      const nextIncome = incomes.find(inc => inc.date > item.date);
      if (nextIncome) {
        const existing = suggestions.find(s => s.itemId === item.ref.id && s.originalDate === item.originalDate);
        if (!existing) {
          suggestions.push({
            id: `opt_delay_${item.ref.id}_${item.originalDate}`,
            originalDate: item.originalDate,
            suggestedDate: nextIncome.date,
            type: 'DELAY_PAY',
            itemId: item.ref.id,
            itemType: item.type === 'expense' ? 'expense' : 'debt',
            itemName: item.label,
            amount: Math.abs(item.amt),
            message: `Retrasa este pago al ${nextIncome.date} (cuando recibes un ingreso) para evitar quebrar tu colchón de liquidez.`,
          });
        }
      }
    }
  }

  // Detect Early Pay (pay early if cash is sitting idle)
  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    if (item.amt < 0 && !item.done && item.balance >= minBalance) {
      const recentIncome = incomes.slice().reverse().find(inc => inc.date < item.date && (new Date(item.date).getTime() - new Date(inc.date).getTime()) <= 15 * 86400000);
      
      if (recentIncome) {
        const incIndex = plan.findIndex(p => p.date === recentIncome.date && p.label === recentIncome.label);
        let canAdvance = true;
        
        for (let k = incIndex; k < i; k++) {
           if (plan[k].balance - Math.abs(item.amt) < minBalance) {
               canAdvance = false;
               break;
           }
        }

        if (canAdvance) {
          const existing = suggestions.find(s => s.itemId === item.ref.id && s.originalDate === item.originalDate);
          if (!existing) {
            suggestions.push({
              id: `opt_early_${item.ref.id}_${item.originalDate}`,
              originalDate: item.originalDate,
              suggestedDate: recentIncome.date,
              type: 'EARLY_PAY',
              itemId: item.ref.id,
              itemType: item.type === 'expense' ? 'expense' : 'debt',
              itemName: item.label,
              amount: Math.abs(item.amt),
              message: `Recibes ingresos el ${recentIncome.date}. Tienes liquidez suficiente para adelantar este pago y salir de él antes.`,
            });
          }
        }
      }
    }
  }

  return suggestions;
}
"""

content = content.replace("export function validateFinancialIntegrity", opt_code + "\nexport function validateFinancialIntegrity")

eval_target = """  return {
    score: Math.max(0, 100 - scoreDeduction),
    status,
    doubleEntryIssues,
    preventiveWarnings,
    contradictions,"""
eval_replacement = """  const optimizations = detectOptimizations(profile, exchangeRates);
  return {
    score: Math.max(0, 100 - scoreDeduction),
    status,
    doubleEntryIssues,
    preventiveWarnings,
    optimizations,
    contradictions,"""

content = content.replace(eval_target, eval_replacement)

with open('src/utils/financialIntegrity.ts', 'w') as f:
    f.write(content)

print("Success")
