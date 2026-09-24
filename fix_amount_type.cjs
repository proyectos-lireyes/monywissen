const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

code = code.replace(/c\.ref\?\.amount/g, '(c.ref as any)?.amount');

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
