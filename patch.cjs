const fs = require('fs');

let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /if \(customDef\) \{\s+const newFreq = customDef\.freq as any \|\| 'monthly';/,
  `if (customDef) {
                                if (!name) setName(customDef.name);
                                const newFreq = customDef.freq as any || 'monthly';`
);

content = content.replace(
  /if \(editIndex !== null\) draft\.debts\[editIndex\] = item;\n\s+else draft\.debts\.push\(item\);/,
  `if (editIndex !== null) draft.debts[editIndex] = item;
        else {
          draft.debts.push(item);
          if (draft.overrides) {
            Object.keys(draft.overrides).forEach(k => {
              if (k.startsWith('debt_preview_')) {
                const newKey = k.replace('debt_preview_', \`debt_\${item.id}_\`);
                draft.overrides[newKey] = draft.overrides[k];
                delete draft.overrides[k];
              }
            });
          }
        }`
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
