const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /if \(ov\.done && ov\.amt\) \{/g,
  'if (ov.done) {'
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
