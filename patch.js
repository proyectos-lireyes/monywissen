const fs = require('fs');

let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /if \(customDef\) \{\s+const newFreq = customDef\.freq as any \|\| 'monthly';/,
  `if (customDef) {\n                                if (!name) setName(customDef.name);\n                                const newFreq = customDef.freq as any || 'monthly';`
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
