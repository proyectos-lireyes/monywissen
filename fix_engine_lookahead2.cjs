const fs = require('fs');
const p = 'src/utils/financialEngine.ts';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(
    /applied\.push\(\{[\s\S]*?date: d,[\s\S]*?label: 'Rescate de Ahorros',[\s\S]*?\}\);/g,
    `
                    balance += amtToWithdraw;
                    savingsAccumulated -= amtToWithdraw;
                    applied.push({
                        date: d,
                        label: 'Rescate de Ahorros',
                        type: 'rescate_ahorros',
                        amt: amtToWithdraw,
                        ref: { id: \`autowithdraw_\${d}\`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
                        originalDate: d,
                        done: overrides[autowithdrawKey] ? !!overrides[autowithdrawKey].done : false,
                        runningBalance: balance,
                        isDelayed: false,
                        insufficientFunds: false,
                        savingsAccumulated,
                    });
    `
);

fs.writeFileSync(p, txt);
