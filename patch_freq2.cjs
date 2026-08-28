const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

// Undo the wrong patch
code = code.replace(
  /if \(freq === 'biweekly' && \(dueDay === 'exact_14' || dueDay === 'exact_15'\)\) return;\n  if \(freq === 'monthly'\) \{/,
  `if (freq === 'monthly') {`
);

code = code.replace(
  /\} else if \(freq === 'biweekly'\) \{\n    if \(dueDay === 'exact_14'\) \{\n      curr\.setDate\(curr\.getDate\(\) \+ 14\);\n      return;\n    \}\n    if \(dueDay === 'exact_15'\) \{\n      curr\.setDate\(curr\.getDate\(\) \+ 15\);\n      return;\n    }/,
  `} else if (freq === 'biweekly') {`
);

// Apply correct patch
// 1. snapDateFreq: Add return early if exact_14 or exact_15
code = code.replace(
  /export function snapDateFreq\(curr: Date, freq: string, dueDay\?: string \| number\): void \{\n  const d = curr\.getDate\(\);\n  const m = curr\.getMonth\(\);\n/,
  `export function snapDateFreq(curr: Date, freq: string, dueDay?: string | number): void {\n  const d = curr.getDate();\n  const m = curr.getMonth();\n\n  if (freq === 'biweekly' && (dueDay === 'exact_14' || dueDay === 'exact_15')) return;\n`
);

// 2. advanceDateFreq: Add +14 or +15
code = code.replace(
  /export function advanceDateFreq\(curr: Date, freq: string, dueDay\?: string \| number\): void \{\n  if \(freq === 'weekly'\) \{/,
  `export function advanceDateFreq(curr: Date, freq: string, dueDay?: string | number): void {\n  if (freq === 'biweekly' && dueDay === 'exact_14') {\n    curr.setDate(curr.getDate() + 14);\n    return;\n  }\n  if (freq === 'biweekly' && dueDay === 'exact_15') {\n    curr.setDate(curr.getDate() + 15);\n    return;\n  }\n  if (freq === 'weekly') {`
);

fs.writeFileSync('src/utils/financialEngine.ts', code);
