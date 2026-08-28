const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

// Patch snapDateFreq
code = code.replace(
  /if \(freq === 'monthly'\) \{/,
  `if (freq === 'biweekly' && (dueDay === 'exact_14' || dueDay === 'exact_15')) return;\n  if (freq === 'monthly') {`
);

// Patch advanceDateFreq
code = code.replace(
  /\} else if \(freq === 'biweekly'\) \{/,
  `} else if (freq === 'biweekly') {\n    if (dueDay === 'exact_14') {\n      curr.setDate(curr.getDate() + 14);\n      return;\n    }\n    if (dueDay === 'exact_15') {\n      curr.setDate(curr.getDate() + 15);\n      return;\n    }`
);

fs.writeFileSync('src/utils/financialEngine.ts', code);
