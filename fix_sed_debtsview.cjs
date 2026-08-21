const fs = require('fs');
let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

const regex = /let sym = '\s*const \[subTab, setSubTab\] = useState<'active' \| 'settled' \| 'types' \| 'strategy'>\('active'\);/m;
const replace = `let sym = '$';
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

viewContent = viewContent.replace(regex, replace);
fs.writeFileSync('src/components/debts/DebtsView.tsx', viewContent);
console.log('Fixed debts view with regex!');
