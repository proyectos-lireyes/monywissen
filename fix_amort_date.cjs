const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

code = code.replace(
  /if \(amort > 0\) \{\s*\/\/ If some is already amortized, advance cycle to skip past it\s*snapDateFreq\(curr, freq, dueDay\); \/\/ first snap to valid date\s*advanceDateFreq\(curr, freq, dueDay\); \/\/ then advance to next cycle\s*\} else \{\s*\/\/ Just snap to the nearest valid due date\s*snapDateFreq\(curr, freq, dueDay\);\s*\}/,
  `// Just snap to the nearest valid due date\n        snapDateFreq(curr, freq, dueDay);`
);

fs.writeFileSync('src/utils/financialEngine.ts', code);
