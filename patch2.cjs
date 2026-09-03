const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const target1 = `         } else {
            current.done = false;
            current.amt = undefined;
            if (!current.partials || current.partials.length === 0) {
               delete draft.overrides[rec.key];
            }
         }`;

const repl1 = `         } else {
            current.done = false;
            current.amt = undefined;
            if (!current.partials || current.partials.length === 0) {
               if (!current.userPostponed) {
                 delete draft.overrides[rec.key];
               }
            }
         }`;

content = content.replace(target1, repl1);
fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
console.log('patched ItemFormModal.tsx');
