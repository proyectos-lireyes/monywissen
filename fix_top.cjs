const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

code = code.replace("if (freq === 'monthly') {/**", "/**");

fs.writeFileSync('src/utils/financialEngine.ts', code);
