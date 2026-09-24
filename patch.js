const fs = require('fs');
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');
code = code.replace(
`    if (isCard && i >= inst) break;`,
`    if (isCard && i >= inst) break;
    if (i >= inst && remainingPrincipal <= 0.01 && unallocatedPaid <= 0.01) break;`
);
fs.writeFileSync('src/utils/financialEngine.ts', code);
