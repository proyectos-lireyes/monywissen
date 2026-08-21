import re

with open('src/utils/financialIntegrity.ts', 'r') as f:
    content = f.read()

target = """  // Detect Delay Pay (liquidity breach)
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
  }"""

replacement = """  // Detect Delay Pay (liquidity breach)
  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    // Check if the balance after this payment drops below the cushion
    if (item.balance < minBalance && item.amt < 0 && !item.done) {
      const existing = suggestions.find(s => s.itemId === item.ref.id && s.originalDate === item.originalDate);
      if (!existing) {
        const nextIncome = incomes.find(inc => inc.date > item.date);
        let suggestedDate = nextIncome ? nextIncome.date : '';
        if (!suggestedDate) {
           // If no future income, suggest delaying by 15 days
           const d = new Date(item.date + 'T12:00:00Z');
           d.setUTCDate(d.getUTCDate() + 15);
           suggestedDate = d.toISOString().split('T')[0];
        }
        
        suggestions.push({
          id: `opt_delay_${item.ref.id}_${item.originalDate}`,
          originalDate: item.originalDate,
          suggestedDate,
          type: 'DELAY_PAY',
          itemId: item.ref.id,
          itemType: item.type === 'expense' ? 'expense' : 'debt',
          itemName: item.label,
          amount: Math.abs(item.amt),
          message: nextIncome 
            ? `Retrasa este pago al ${suggestedDate} (próximo ingreso) para evitar quebrar tu colchón de liquidez (Saldo caería a $${item.balance.toFixed(2)}).`
            : `Retrasa este pago al ${suggestedDate} para evitar quebrar tu colchón de liquidez (Saldo caería a $${item.balance.toFixed(2)}).`,
        });
      }
    }
  }
  
  // Detect if user wants to optimize based on Net Flow instead of Accumulated Balance
  // Since the user said "flujo de caja no caiga del colchon", we will ALSO check if the DAILY net flow is terrible
  const dailyFlows: Record<string, number> = {};
  plan.forEach(item => {
    if (!dailyFlows[item.date]) dailyFlows[item.date] = 0;
    dailyFlows[item.date] += item.amt;
  });
  
  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    if (item.amt < 0 && !item.done) {
      const dayFlow = dailyFlows[item.date];
      // If the day's flow is less than the negative cushion (e.g. -50) AND it wasn't already caught by balance breach
      if (dayFlow < -minBalance && item.balance >= minBalance) {
         const existing = suggestions.find(s => s.itemId === item.ref.id && s.originalDate === item.originalDate);
         if (!existing) {
            const nextIncome = incomes.find(inc => inc.date > item.date);
            if (nextIncome) {
              suggestions.push({
                id: `opt_flow_${item.ref.id}_${item.originalDate}`,
                originalDate: item.originalDate,
                suggestedDate: nextIncome.date,
                type: 'DELAY_PAY',
                itemId: item.ref.id,
                itemType: item.type === 'expense' ? 'expense' : 'debt',
                itemName: item.label,
                amount: Math.abs(item.amt),
                message: `El flujo neto de este día es muy negativo ($${dayFlow.toFixed(2)}). Retrásalo al ${nextIncome.date} para equilibrar tu flujo de caja.`,
              });
            }
         }
      }
    }
  }"""

content = content.replace(target, replacement)

with open('src/utils/financialIntegrity.ts', 'w') as f:
    f.write(content)

print("Success")
