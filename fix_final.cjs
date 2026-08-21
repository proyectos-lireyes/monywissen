const fs = require('fs');

let modalContent = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const lines = modalContent.split('\n');
let newLines = [];
let skip = false;
let foundStart = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("let sym = '")) {
    // found the bad line
    const fixedPart = `    let sym = '$';
    if (curr === 'EUR' || curr === 'EUR_BCV') sym = '€';
    else if (curr === 'BS') sym = 'Bs';
    else if (curr === 'COP') sym = '$';
    else if (curr === 'BRL') sym = 'R$';
    else if (curr === 'USDT') sym = 'USDT ';
    
    const raw = sym + (Math.round((amt || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    if (curr && curr !== 'USD_BCV') {
      const conv = convertAmount(amt, curr);
      if (conv !== amt) {
        return \\\`\${raw} (\${formatCurrency(conv)})\\\`;
      }
    }
    return raw;
  };
  const [name, setName] = useState('');`;
    // We replace the line with this, BUT we also have to fix it without backslash escaping for literal backslash.
    // Wait, in JS script we don't need triple backslash unless we use template literals.
    newLines.push(`    let sym = '$';
    if (curr === 'EUR' || curr === 'EUR_BCV') sym = '€';
    else if (curr === 'BS') sym = 'Bs';
    else if (curr === 'COP') sym = '$';
    else if (curr === 'BRL') sym = 'R$';
    else if (curr === 'USDT') sym = 'USDT ';
    
    const raw = sym + (Math.round((amt || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    if (curr && curr !== 'USD_BCV') {
      const conv = convertAmount(amt, curr);
      if (conv !== amt) {
        return \`\${raw} (\${formatCurrency(conv)})\`;
      }
    }
    return raw;
  };
  const [name, setName] = useState('');`);
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', newLines.join('\n'));

// Now DebtsView
let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');
const viewLines = viewContent.split('\n');
let newViewLines = [];

for (let i = 0; i < viewLines.length; i++) {
  if (viewLines[i].includes("let sym = '")) {
    newViewLines.push(`    let sym = '$';
    if (curr === 'EUR' || curr === 'EUR_BCV') sym = '€';
    else if (curr === 'BS') sym = 'Bs';
    else if (curr === 'COP') sym = '$';
    else if (curr === 'BRL') sym = 'R$';
    else if (curr === 'USDT') sym = 'USDT ';
    
    const raw = sym + (Math.round((amt || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    if (curr && curr !== 'USD_BCV') {
      const conv = convertAmount(amt, curr);
      if (conv !== amt) {
        return \`\${raw} (\${formatCurrency(conv)})\`;
      }
    }
    return raw;
  };
  const [subTab, setSubTab] = useState<'active' | 'settled' | 'types' | 'strategy'>('active');`);
  } else {
    newViewLines.push(viewLines[i]);
  }
}

fs.writeFileSync('src/components/debts/DebtsView.tsx', newViewLines.join('\n'));
console.log('Fixed syntax correctly');
