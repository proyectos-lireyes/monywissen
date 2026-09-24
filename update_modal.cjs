const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const regex = /const dummyProfile = \{\s*settings: \{ planStart: todayStr\(\), openingBalance: 0 \},/;
code = code.replace(regex, `const dummyProfile = {
        settings: { 
          planStart: date || todayStr(), 
          planEnd: hasEndDate && endDate ? endDate : new Date(new Date(date || todayStr()).getTime() + 86400000 * 365 * 3).toISOString().slice(0, 10),
          openingBalance: 0 
        },`);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
