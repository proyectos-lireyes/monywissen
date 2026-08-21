const fs = require('fs');
let modalContent = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const brokenPart = `  const formatCurrencyExt = (amt: number, curr?: string) => {
    let sym = '  const [name, setName] = useState('');`;

const fixedPart = `  const formatCurrencyExt = (amt: number, curr?: string) => {
    let sym = '$';
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
  const [name, setName] = useState('');`;

modalContent = modalContent.replace(brokenPart, fixedPart);
fs.writeFileSync('src/components/modals/ItemFormModal.tsx', modalContent);
console.log('Fixed modal');
