import fs from 'fs';

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove the broken formatCurrencyExt and replace it with a clean one
    const startIdx = content.indexOf('const formatCurrencyExt = (amt: number, curr?: string) => {');
    
    // Find the end of the broken formatCurrencyExt
    // In DebtsView, it might be right before "const [subTab"
    // In ItemFormModal, it might be right before "const [name"
    let endIdx = content.indexOf('const [subTab,', startIdx);
    if (endIdx === -1) {
        endIdx = content.indexOf('const [name,', startIdx);
    }
    
    if (startIdx !== -1 && endIdx !== -1) {
        const cleanFunction = `const formatCurrencyExt = (amt: number, curr?: string) => {
    let sym = '$';
    if (curr === 'EUR' || curr === 'EUR_BCV') sym = '€';
    else if (curr === 'BS') sym = 'Bs';
    else if (curr === 'COP') sym = '$';
    else if (curr === 'BRL') sym = 'R$';
    else if (curr === 'USDT') sym = 'USDT ';
    
    const raw = sym + (Math.round((amt || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    const conv = convertAmount(amt, curr || 'USD_BCV');
    const globalFormatted = formatCurrency(conv);
    
    const isDifferentCurrency = 
      (globalFormatted.includes('Bs') && sym !== 'Bs') ||
      (globalFormatted.includes('€') && sym !== '€') ||
      (globalFormatted.includes('USDT') && sym !== 'USDT ') ||
      (globalFormatted.includes('$') && !globalFormatted.includes('Bs') && sym !== '$');

    if (isDifferentCurrency) {
        return \`\${raw} (~ \${globalFormatted})\`;
    }
    return raw;
  };
  
  `;
        content = content.substring(0, startIdx) + cleanFunction + content.substring(endIdx);
        fs.writeFileSync(file, content);
    }
}

fixFile('src/components/debts/DebtsView.tsx');
fixFile('src/components/modals/ItemFormModal.tsx');
