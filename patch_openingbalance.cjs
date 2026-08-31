const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace('openingBalance: number;', 'openingBalance?: number;');
fs.writeFileSync('src/types/index.ts', code);

let ctxCode = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
ctxCode = ctxCode.replace('openingBalance: 0,', 'openingBalance: undefined,');
fs.writeFileSync('src/context/AppContext.tsx', ctxCode);

console.log("Patched openingBalance type");
