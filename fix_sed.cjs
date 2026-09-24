const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');
code = code.replace(/console.log\("Before break.*?\\n/g, '');
fs.writeFileSync('src/utils/financialEngine.ts', code);
