const fs = require('fs');

let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');
const brokenPart = "    let sym = '  const [strategyMode, setStrategyMode] = useState<'snowball' | 'avalanche'>('snowball');";
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
  const [subTab, setSubTab] = useState<'active' | 'settled' | 'types' | 'strategy'>('active');
  const [strategyMode, setStrategyMode] = useState<'snowball' | 'avalanche'>('snowball');`;
viewContent = viewContent.replace(brokenPart, fixedPart);
fs.writeFileSync('src/components/debts/DebtsView.tsx', viewContent);
console.log('Fixed syntax 3');
