const fs = require('fs');
let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

const viewHelperStr = `
  const formatCurrencyExt = (amt: number, curr?: string) => {
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
`;

if (!viewContent.includes('const formatCurrencyExt = ')) {
  viewContent = viewContent.replace(
    "const { profile, updateProfileData, showToast, convertAmount } = useApp();",
    "const { profile, updateProfileData, showToast, convertAmount } = useApp();\n" + viewHelperStr
  );
  fs.writeFileSync('src/components/debts/DebtsView.tsx', viewContent);
  console.log('DebtsView fixed!');
} else {
  console.log('Already has formatCurrencyExt');
}
