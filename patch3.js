import fs from 'fs';
let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

const target1 = `       if (!isDiscarded && !(d < todayStr() && !isDone)) {
           const excess = balance - targetMin;
           balance = targetMin;
           savingsAccumulated += excess;
           plan.push({
             date: d,
             label: 'Ahorro Automático (Excedente pre-ingreso)',
             type: 'savings',
             amt: -excess,
             ref: { id: \`autosave_\${d}\`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
             originalDate: d,
             done: overrides[autosaveKey] ? !!overrides[autosaveKey].done : false,
             balance,
             isDelayed: false,
             savingsAccumulated,
           });
       }`;

const repl1 = `       if (!isDiscarded) {
           const excess = balance - targetMin;
           
           if (d < todayStr() && !isDone) {
               balance = targetMin;
               plan.push({
                 date: d,
                 label: 'Ajuste: Excedente gastado (No ahorrado)',
                 type: 'expense',
                 amt: -excess,
                 ref: { id: \`missed_autosave_\${d}\`, name: 'Ajuste de Saldo', effectiveColor: '#f59e0b' },
                 originalDate: d,
                 done: true,
                 balance,
                 isDelayed: false,
                 savingsAccumulated,
               });
           } else {
               balance = targetMin;
               savingsAccumulated += excess;
               plan.push({
                 date: d,
                 label: 'Ahorro Automático (Excedente pre-ingreso)',
                 type: 'savings',
                 amt: -excess,
                 ref: { id: \`autosave_\${d}\`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
                 originalDate: d,
                 done: overrides[autosaveKey] ? !!overrides[autosaveKey].done : false,
                 balance,
                 isDelayed: false,
                 savingsAccumulated,
               });
           }
       }`;
       
const target2 = `    let strictOut = dayEvents.filter(e => e.amt < 0 && (e.done || (e.ref?.strictDate && e.type !== 'savings')));
    let flexibleOut = dayEvents.filter(e => e.amt < 0 && !e.done && !(e.ref?.strictDate && e.type !== 'savings'));
    
    const applied: any[] = [];
    
    for (const e of incomes) {
        balance += e.amt;
        applied.push({ ...e, date: d, runningBalance: balance });
    }
    for (const e of strictOut) {
        balance += e.amt;
        applied.push({ ...e, date: d, runningBalance: balance });
    }`;

const repl2 = `    let strictOut = dayEvents.filter(e => e.amt < 0 && (e.done || (e.ref?.strictDate && e.type !== 'savings')));
    let flexibleOut = dayEvents.filter(e => e.amt < 0 && !e.done && !(e.ref?.strictDate && e.type !== 'savings') && !(e.type === 'savings' && d < todayStr()));
    let missedSavings = dayEvents.filter(e => e.amt < 0 && !e.done && e.type === 'savings' && d < todayStr());
    
    const applied: any[] = [];
    
    for (const e of incomes) {
        balance += e.amt;
        applied.push({ ...e, date: d, runningBalance: balance });
    }
    for (const e of strictOut) {
        balance += e.amt;
        applied.push({ ...e, date: d, runningBalance: balance });
    }
    for (const e of missedSavings) {
        applied.push({ ...e, date: d, amt: 0, label: \`\${e.label} (Omitido)\`, runningBalance: balance, isDiscarded: true });
    }`;

code = code.replace(target1, repl1);
code = code.replace(target2, repl2);

fs.writeFileSync('src/utils/financialEngine.ts', code);
console.log("Patched successfully");
