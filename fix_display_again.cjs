const fs = require('fs');

let modalContent = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

modalContent = modalContent.replace(
  /\{formatCurrency\(cuota\.paidAmount\)\} \{cuota\.paidCurrency\}/g,
  "{formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}"
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', modalContent);
console.log('Fixed paidAmount');
