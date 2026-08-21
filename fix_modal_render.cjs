const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /Me falta: {formatCurrency\(expectedCuotas\.filter\(c => !c\.isPaid\)\.reduce\(\(s, c\) => s \+ c\.expectedAmount, 0\)\)}/g,
  "Me falta: {formatCurrency(expectedCuotas.reduce((s, c) => s + (c.requiredPay || 0), 0))}"
);

content = content.replace(
  /amount: String\(cuota\.expectedAmount\),/g,
  "amount: String(cuota.requiredPay > 0 ? cuota.requiredPay : cuota.expectedAmount),"
);

content = content.replace(
  /{!cuota\.isPaid && \([\s\S]*?{formatCurrency\(cuota\.expectedAmount\)}<\/span>[\s\S]*?\)}/g,
  "{!cuota.isPaid && ( <span className='text-xs font-bold text-slate-400'>{formatCurrency(cuota.requiredPay)}</span> )}"
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
console.log("Modal render patched");
