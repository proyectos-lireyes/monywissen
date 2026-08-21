import re

with open('src/utils/financialIntegrity.ts', 'r') as f:
    content = f.read()

# I will replace the logic in detectOptimizations to better match their wording
new_logic = """
  // Detect Delay Pay (liquidity breach or negative flow)
  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    
    if (item.amt < 0 && !item.done) {
      const dayFlow = dailyFlows[item.date] || 0;
      
      // We flag if:
      // 1. The accumulated balance drops below the cushion (critical risk)
      // 2. The daily net flow drops below the negative cushion (huge expense spike)
      const dropsBelowCushion = item.balance < minBalance;
      const massiveNegativeFlow = dayFlow < -minBalance;
      
      if (dropsBelowCushion || massiveNegativeFlow) {
        const existing = suggestions.find(s => s.itemId === item.ref.id && s.originalDate === item.originalDate);
        if (!existing) {
          // Find the next available income
          const nextIncome = incomes.find(inc => inc.date > item.date);
          let suggestedDate = nextIncome ? nextIncome.date : '';
          
          if (!suggestedDate) {
             const d = new Date(item.date + 'T12:00:00Z');
             d.setUTCDate(d.getUTCDate() + 15);
             suggestedDate = d.toISOString().split('T')[0];
          }
          
          let reasonMsg = dropsBelowCushion 
            ? `Tu Saldo Acumulado caería a $${item.balance.toFixed(2)} (por debajo del colchón).`
            : `El Flujo Neto (Disponibilidad) de este día cae drásticamente a $${dayFlow.toFixed(2)}.`;
            
          suggestions.push({
            id: `opt_delay_${item.ref.id}_${item.originalDate}`,
            originalDate: item.originalDate,
            suggestedDate,
            type: 'DELAY_PAY',
            itemId: item.ref.id,
            itemType: item.type === 'expense' ? 'expense' : 'debt',
            itemName: item.label,
            amount: Math.abs(item.amt),
            message: `${reasonMsg} Nivelando: Reprográmalo para el ${suggestedDate} (próximo pico de ingresos).`,
          });
        }
      }
    }
  }
"""

# I need to replace the two existing loops with this unified loop.
# Find the start of "// Detect Delay Pay" and end before "// Detect Early Pay"
pattern = re.compile(r'// Detect Delay Pay \(liquidity breach\).*?// Detect Early Pay \(pay early if cash is sitting idle\)', re.DOTALL)
content = pattern.sub(new_logic + '\n  // Detect Early Pay (pay early if cash is sitting idle)', content)

with open('src/utils/financialIntegrity.ts', 'w') as f:
    f.write(content)

