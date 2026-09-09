const fs = require('fs');
const p = 'src/utils/financialEngine.ts';
let txt = fs.readFileSync(p, 'utf8');
txt = txt.replace(/id: \`autowithdraw_\$\{d\}_\$\{applied\.length\}\`/, "id: \`autowithdraw_${d}\`");
fs.writeFileSync(p, txt);
