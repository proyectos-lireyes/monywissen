const fs = require('fs');

// Patch ItemFormModal.tsx
let modalContent = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const helperStr = `
  const formatCurrencyExt = (amt, curr) => {
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

if (!modalContent.includes('formatCurrencyExt')) {
  modalContent = modalContent.replace(
    "const { profile, updateProfileData, showToast, validateTransaction, convertAmount } = useApp();",
    "const { profile, updateProfileData, showToast, validateTransaction, convertAmount } = useApp();\n" + helperStr
  );
}

// Ensure the UI uses formatCurrencyExt where needed:
modalContent = modalContent.replace(/<span>Cuota mensual: \{formatCurrency\(pmt\)\}<\/span>/g, "<span>Cuota mensual: {formatCurrencyExt(pmt, currency)}</span>");
modalContent = modalContent.replace(/Me falta: \{formatCurrency\(expectedCuotas\.reduce\(\(s, c\) => s \+ \(c\.requiredPay \|\| 0\), 0\)\)\}/g, "Me falta: {formatCurrencyExt(expectedCuotas.reduce((s, c) => s + (c.requiredPay || 0), 0), currency)}");

modalContent = modalContent.replace(/\{formatCurrency\(cuota\.paidAmount\)\} \{cuota\.paidCurrency\}/g, "{formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}");
modalContent = modalContent.replace(/\{formatCurrency\(cuota\.requiredPay\)\}/g, "{formatCurrencyExt(cuota.requiredPay, currency)}");

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', modalContent);
console.log('ItemFormModal Display patched!');


// Patch DebtsView.tsx
let viewContent = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

const viewHelperStr = `
  const formatCurrencyExt = (amt, curr) => {
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

if (!viewContent.includes('formatCurrencyExt')) {
  viewContent = viewContent.replace(
    "const { profile, updateProfileData, convertAmount } = useApp();",
    "const { profile, updateProfileData, convertAmount } = useApp();\n" + viewHelperStr
  );
}

// Replace formatCurrency(paid) and formatCurrency(original) inside individual item map
viewContent = viewContent.replace(/<span>Pagado: <strong className="text-emerald-600 dark:text-emerald-400">\{formatCurrency\(paid\)\}<\/strong><\/span>/g, '<span>Pagado: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrencyExt(paid, item.currency)}</strong></span>');
viewContent = viewContent.replace(/<span>Total: <strong>\{formatCurrency\(original\)\}<\/strong><\/span>/g, '<span>Total: <strong>{formatCurrencyExt(original, item.currency)}</strong></span>');
viewContent = viewContent.replace(/<span className="font-bold text-slate-800 dark:text-slate-200">\{formatCurrency\(remaining\)\}<\/span>/g, '<span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrencyExt(remaining, item.currency)}</span>');

fs.writeFileSync('src/components/debts/DebtsView.tsx', viewContent);
console.log('DebtsView Display patched!');
