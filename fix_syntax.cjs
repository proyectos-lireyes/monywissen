const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

code = code.replace(/e\?\.pulledEarly = true;/g, 'if(e) e.pulledEarly = true;');
code = code.replace(/e\?\.isDelayed = true;/g, 'if(e) e.isDelayed = true;');

fs.writeFileSync('src/utils/financialEngine.ts', code);
