const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{/,
  `const hasCleanedPreview = React.useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasCleanedPreview.current = false;
    }`
);

content = content.replace(
  /if \(!isOpen \|\| !type\) return;/,
  `if (!isOpen || !type) return;

    if (type === 'debt' && editIndex === null && !hasCleanedPreview.current) {
      hasCleanedPreview.current = true;
      updateProfileData(draft => {
        if (draft.overrides) {
          Object.keys(draft.overrides).forEach(k => {
            if (k.startsWith('debt_preview_')) delete draft.overrides[k];
          });
        }
      });
    }`
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
