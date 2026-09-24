const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

code = code.replace(
  /\{type === "debt" && expectedCuotas\.length > 0 && \(/,
  '{(type === "debt" || type === "income" || type === "expense") && expectedCuotas.length > 0 && ('
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
