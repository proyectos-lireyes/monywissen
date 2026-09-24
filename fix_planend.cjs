const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

code = code.replace(
  /planEnd: hasEndDate && endDate \? endDate : new Date\(new Date\(date \|\| todayStr\(\)\)\.getTime\(\) \+ 86400000 \* 365 \* 3\)\.toISOString\(\)\.slice\(0, 10\),/,
  'planEnd: hasEndDate && endDate ? endDate : (profile.settings.planEnd || new Date(new Date(date || todayStr()).getTime() + 86400000 * 365 * 3).toISOString().slice(0, 10)),'
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
