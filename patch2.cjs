const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /const handleDelete = \(\) => \{/,
  `const handleClose = () => {
    if (type === 'debt' && editIndex === null) {
      updateProfileData(draft => {
        if (draft.overrides) {
          Object.keys(draft.overrides).forEach(k => {
            if (k.startsWith('debt_preview_')) delete draft.overrides[k];
          });
        }
      });
    }
    onClose();
  };

  const handleDelete = () => {`
);

content = content.replace(
  /<button onClick=\{onClose\} className="p-1 text-slate-400 hover:text-slate-600">/g,
  `<button type="button" onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600">`
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
