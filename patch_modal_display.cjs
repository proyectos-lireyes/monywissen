const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const helper = `
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

if (!content.includes('formatCurrencyExt')) {
  content = content.replace(
    "const { profile, updateProfileData, showToast, validateTransaction, convertAmount } = useApp();",
    "const { profile, updateProfileData, showToast, validateTransaction, convertAmount } = useApp();\n" + helper
  );
}

content = content.replace(/<span>Cuota mensual: \{formatCurrency\(pmt\)\}<\/span>/g, "<span>Cuota mensual: {formatCurrencyExt(pmt, currency)}</span>");
content = content.replace(/Me falta: \{formatCurrency\(expectedCuotas\.reduce\(\(s, c\) => s \+ \(c\.requiredPay \|\| 0\), 0\)\)\}/g, "Me falta: {formatCurrencyExt(expectedCuotas.reduce((s, c) => s + (c.requiredPay || 0), 0), currency)}");

content = content.replace(/\{formatCurrency\(cuota\.paidAmount\)\} \{cuota\.paidCurrency\}/g, "{formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}");
content = content.replace(/\{formatCurrency\(cuota\.requiredPay\)\}/g, "{formatCurrencyExt(cuota.requiredPay, currency)}");

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
console.log('Display patched!');
