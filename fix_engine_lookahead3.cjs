const fs = require('fs');
const p = 'src/utils/financialEngine.ts';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(
    /const wOut = wEvents\.filter\(e => \(e\?\.amt \|\| 0\) < 0 && !e\?\.done && !\(e\?\.type === 'savings' && wd < todayStr\(\)\)\);/g,
    "const wOut = wEvents.filter(e => (e?.amt || 0) < 0 && !(e?.type === 'savings' && wd < todayStr()));"
);

fs.writeFileSync(p, txt);
