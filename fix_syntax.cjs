const fs = require('fs');

let modalContent = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');
const brokenModalRegex = /let sym = '\s*const \[name, setName\] = useState\(''\);/g;
const fixedModalContent = `let sym = '$';
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
modalContent = modalContent.replace(brokenModalRegex, fixedModalContent);
fs.writeFileSync('src/components/modals/ItemFormModal.tsx', modalContent);

let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');
const brokenViewRegex = /let sym = '\s*const \[subTab, setSubTab\] = useState\<'active' \| 'settled' \| 'types' \| 'strategy'\>\('active'\);/g;
const fixedViewContent = `let sym = '$';
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
  const [subTab, setSubTab] = useState<'active' | 'settled' | 'types' | 'strategy'>('active');`;
viewContent = viewContent.replace(brokenViewRegex, fixedViewContent);
fs.writeFileSync('src/components/debts/DebtsView.tsx', viewContent);

console.log('Fixed syntax errors');
