const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

code = code.replace(
  /const occurrences = plan\.filter\(p => p\.ref\?\.id === itemId\)\.slice\(0, 12\);/,
  'const occurrences = plan.filter(p => p.ref?.id === itemId).slice(0, 50);'
);

code = code.replace(
  /expectedAmount: Math\.abs\(c\.amt\),/g,
  'expectedAmount: parseFloat(String(c.ref?.amount || amount)) || 0,'
);

code = code.replace(
  /paidAmount: c\.done \? Math\.abs\(c\.amt\) : 0,/g,
  'paidAmount: c.done ? (parseFloat(String(c.ref?.amount || amount)) || 0) : 0,'
);

code = code.replace(
  /requiredPay: Math\.abs\(c\.amt\)/g,
  'requiredPay: parseFloat(String(c.ref?.amount || amount)) || 0'
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
