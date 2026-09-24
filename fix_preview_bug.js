import fs from 'fs';

let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const target = `  useEffect(() => {
    if (isOpen) {`;
const replacement = `  useEffect(() => {
    if (isOpen) {
      // Clean up any stuck preview overrides from past crashed sessions
      if (editIndex === null) {
        updateProfileData(draft => {
          let hasStuck = false;
          if (draft.overrides) {
            Object.keys(draft.overrides).forEach(k => {
              if (k.startsWith('debt_preview_')) {
                delete draft.overrides[k];
                hasStuck = true;
              }
            });
          }
          if (!hasStuck) return; // Prevent unnecessary render if clean
        });
      }
`;
content = content.replace(target, replacement);
fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
