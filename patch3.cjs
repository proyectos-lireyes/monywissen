const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

code = code.replace(/plan\.forEach\(e => \{/g, 'plan.forEach(e => { if(!e) return;');
code = code.replace(/Math\.abs\(opt\.amt\)/g, 'Math.abs(opt?.amt || 0)');
code = code.replace(/e\.amt/g, 'e?.amt');

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', code);
