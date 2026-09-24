import fs from 'fs';
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');
const repl = `        if (simBalance < minSimBalance) minSimBalance = simBalance;
        if (dayIncome > 0) break; `;
const newRepl = `        if (simBalance < minSimBalance) minSimBalance = simBalance;
        if (d === startD) {
            console.log('--- DEFICIT CALC ---');
            console.log('day:', d, 'dayIncome:', dayIncome, 'dayExpense:', dayExpense, 'simBalance:', simBalance, 'minSimBalance:', minSimBalance, 'settings.minBalance:', settings.minBalance);
        }
        if (dayIncome > 0) break; `;
code = code.replace(repl, newRepl);
fs.writeFileSync('src/utils/financialEngine.ts', code);
