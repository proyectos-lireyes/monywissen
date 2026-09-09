import fs from 'fs';

function patch(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    const oldStr = `    if (curr && curr !== 'USD_BCV') {
      const conv = convertAmount(amt, curr);
      if (conv !== amt) {
        return \`\${raw} (\${formatCurrency(conv)})\`;
      }
    }
    return raw;`;
    
    const newStr = `    const conv = convertAmount(amt, curr || 'USD_BCV');
    const globalFormatted = formatCurrency(conv);
    
    // Check if the global formatted string uses a different symbol or is clearly a different currency
    const isDifferentCurrency = 
      (globalFormatted.includes('Bs') && sym !== 'Bs') ||
      (globalFormatted.includes('€') && sym !== '€') ||
      (globalFormatted.includes('USDT') && sym !== 'USDT ') ||
      (globalFormatted.includes('$') && !globalFormatted.includes('Bs') && sym !== '$');

    if (isDifferentCurrency) {
        return \`\${raw} (~ \${globalFormatted})\`;
    }
    return raw;`;

    content = content.replace(oldStr, newStr);
    fs.writeFileSync(filename, content);
}

patch('src/components/debts/DebtsView.tsx');
patch('src/components/modals/ItemFormModal.tsx');
