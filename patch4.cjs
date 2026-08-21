const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /\}, \[isOpen, type, editIndex, forceOneTime, profile\]\);/g,
  `}, [isOpen, type, editIndex, forceOneTime]); // Removed profile to prevent reset on every profile update`
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
