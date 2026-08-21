const fs = require('fs');

let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /Cuota \{cuota\.index\} \{cuota\.isPaid && \`- \$\{formatCurrency\(cuota\.paidAmount\)\} \$\{cuota\.paidCurrency\}\`\}/g,
  "Cuota {cuota.index} {cuota.isPaid && `- ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}`}"
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
console.log('Fixed currency in ItemFormModal');
