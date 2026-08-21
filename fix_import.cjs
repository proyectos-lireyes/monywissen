const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');
if (!content.includes('calculateAmortizationPlan')) {
  content = content.replace("validateTransaction }", "validateTransaction, calculateAmortizationPlan }");
  fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
  console.log('Import added!');
} else {
  console.log('Already imported.');
}
