const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

code = code.replace(
  /setFreq\(newFreq\);\s*if \(newFreq === 'biweekly'\) setDueDay\('15-30'\);\s*else if \(newFreq === 'weekly'\) setDueDay\('1'\);\s*else if \(newFreq === 'triweekly'\) setDueDay\('3'\);\s*else setDueDay\('1'\);/g,
  `setFreq(newFreq);
  if (type === 'debt') {
    if (newFreq === 'biweekly') setDueDay('15-30');
    else if (newFreq === 'weekly') setDueDay('1');
    else if (newFreq === 'triweekly') setDueDay('3');
    else setDueDay('1');
  } else {
    if (newFreq === 'biweekly') setDay('15-30');
    else if (newFreq === 'weekly') setDay(1);
    else setDay(1);
  }`
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
