import fs from 'fs';

let code = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');

// The section we want to replace starts at `// Determine auto-saving first: sweep BEFORE applying today's income`
// and ends after `// Period Lookahead for Savings Rescue` block.

const target = `    // Determine auto-saving first: sweep BEFORE applying today's income
    let hasIncomeToday = futureEvents.some(e => (e?.targetDate || e?.originalDate) === d && (e?.amt || 0) > 0 && e?.type === 'income' && !e?.pulledEarly);
    if (hasIncomeToday && balance > targetMin && d !== startD) {
       const autosaveKey = \`savings_autosave_\${d}_\${d}\`;
       const missedKey = \`expense_missed_autosave_\${d}_\${d}\`;
       const isDiscarded = (overrides[autosaveKey] && overrides[autosaveKey].discarded) || (overrides[missedKey] && overrides[missedKey].discarded);
       const isDone = (overrides[autosaveKey] && overrides[autosaveKey].done) || (overrides[missedKey] && overrides[missedKey].done);
       
       if (!isDiscarded) {
           // Calculate pending delayed expenses that we are about to pay today
           const pendingDelayed = delayedItems.reduce((acc, item) => acc + ((item?.amt || 0) < 0 ? item.amt : 0), 0); // only reserve for expenses
           
           // Also include flexible expenses that are scheduled for exactly today
           const todayFlexibleOut = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === d && !e?.pulledEarly && (e?.amt || 0) < 0 && !e?.done && !(e?.ref?.strictDate && e?.type !== 'savings') && !(e?.type === 'savings' && d < todayStr()));
           const todayPending = todayFlexibleOut.reduce((acc, item) => acc + (item?.amt || 0), 0);

           let excess = balance - targetMin + pendingDelayed + todayPending; // Reserve money for the pending delayed and today's flexible expenses
           if (excess < 0) excess = 0;
           
           if (excess === 0 && d >= todayStr()) {
               // Do nothing if there's no real excess (we need it for the delayed bills)
           } else if (d < todayStr() && !isDone) {
               balance -= excess;
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
               balance -= excess;
               savingsAccumulated += excess;
               plan.push({
                 date: d,
                 label: 'Ahorro Automático (Excedente pre-ingreso)',
                 type: 'savings',
                 amt: -excess,
                 ref: { id: \`autosave_\${d}\`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
                 originalDate: d,
                 done: !!isDone,
                 balance,
                 isDelayed: false,
                 savingsAccumulated,
               });
           }
       }
    }

    // Current day's scheduled events (that haven't been pulled early)
    let dayEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === d && !e?.pulledEarly);
    
    // 1. Process Incomes and Strict Expenses
    let incomes = dayEvents.filter(e => (e?.amt || 0) >= 0);
    let strictOut = dayEvents.filter(e => (e?.amt || 0) < 0 && (e?.done || (e?.ref?.strictDate && e?.type !== 'savings')));
    let flexibleOut = dayEvents.filter(e => (e?.amt || 0) < 0 && !e?.done && !(e?.ref?.strictDate && e?.type !== 'savings') && !(e?.type === 'savings' && d < todayStr()));
    let missedSavings = dayEvents.filter(e => (e?.amt || 0) < 0 && !e?.done && e?.type === 'savings' && d < todayStr());
    
    const applied: any[] = [];

    // Period Lookahead for Savings Rescue
    const nextIncomeObj = futureEvents.find(e => (e?.targetDate || e?.originalDate) > d && (e?.amt || 0) > 0 && e?.type === 'income');
    const nextIncomeDate = nextIncomeObj ? (nextIncomeObj?.targetDate || nextIncomeObj?.originalDate) : '9999-12-31';

    if (lastRescuePeriodEnd !== nextIncomeDate) {
        let simBalance = balance;
        let minSimBalance = simBalance;
        let simSavings = savingsAccumulated;

        // Apply backlog (immediate debt)
        for (const e of delayedItems) {
            simBalance += (e.amt || 0);
        }
        if (simBalance < minSimBalance) minSimBalance = simBalance;

        // Simulate days up to the next income (exclusive)
        let simDates = datesBetween(d, nextIncomeDate === '9999-12-31' ? endD : nextIncomeDate);
        if (nextIncomeDate !== '9999-12-31') {
           simDates = simDates.filter(sd => sd < nextIncomeDate);
        }

        for (const wd of simDates) {
            const wEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === wd && !e?.pulledEarly);
            const wIncomes = wEvents.filter(e => (e?.amt || 0) >= 0);
            const wOut = wEvents.filter(e => (e?.amt || 0) < 0 && !(e?.type === 'savings' && wd < todayStr()));

            for (const e of wIncomes) simBalance += (e.amt || 0);
            for (const e of wOut) {
                simBalance += (e.amt || 0);
                if (e.type === 'savings') simSavings += Math.abs(e.amt || 0);
            }
            if (simBalance < minSimBalance) minSimBalance = simBalance;
        }

        if (minSimBalance < targetMin && savingsAccumulated > 0) {
            const deficit = targetMin - minSimBalance;
            const amtToWithdraw = Math.min(deficit, savingsAccumulated);

            if (amtToWithdraw > 0) {
                const autowithdrawKey = \`rescate_ahorros_autowithdraw_\${d}_\${d}\`;
                const isDiscarded = overrides[autowithdrawKey] && overrides[autowithdrawKey].discarded;
                if (!isDiscarded) {
                    // Inject a single rescue transaction for this entire period
                    
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
                }
            }
        }
        lastRescuePeriodEnd = nextIncomeDate;
    }`;

const replacement = `    // Period Lookahead for Savings Rescue AND Smart Auto-Save
    const nextIncomeObj = futureEvents.find(e => (e?.targetDate || e?.originalDate) > d && (e?.amt || 0) > 0 && e?.type === 'income');
    const nextIncomeDate = nextIncomeObj ? (nextIncomeObj?.targetDate || nextIncomeObj?.originalDate) : '9999-12-31';
    
    let hasIncomeToday = futureEvents.some(e => (e?.targetDate || e?.originalDate) === d && (e?.amt || 0) > 0 && e?.type === 'income' && !e?.pulledEarly);

    if (lastRescuePeriodEnd !== nextIncomeDate || hasIncomeToday) {
        let simBalance = balance;
        let minSimBalance = simBalance;
        let simSavings = savingsAccumulated;

        // Apply backlog (immediate debt)
        for (const e of delayedItems) {
            simBalance += (e.amt || 0);
        }
        if (simBalance < minSimBalance) minSimBalance = simBalance;

        // Simulate days up to the next income (exclusive)
        let simDates = datesBetween(d, nextIncomeDate === '9999-12-31' ? endD : nextIncomeDate);
        if (nextIncomeDate !== '9999-12-31') {
           simDates = simDates.filter(sd => sd < nextIncomeDate);
        }

        for (const wd of simDates) {
            const wEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === wd && !e?.pulledEarly);
            const wIncomes = wEvents.filter(e => (e?.amt || 0) >= 0);
            const wOut = wEvents.filter(e => (e?.amt || 0) < 0 && !(e?.type === 'savings' && wd < todayStr()));

            for (const e of wIncomes) simBalance += (e.amt || 0);
            for (const e of wOut) {
                simBalance += (e.amt || 0);
                if (e.type === 'savings') simSavings += Math.abs(e.amt || 0);
            }
            if (simBalance < minSimBalance) minSimBalance = simBalance;
        }

        // 1. SMART AUTO-SAVE: If we are on an income day, and even at the lowest point of the upcoming period we have excess money, save it!
        if (hasIncomeToday && minSimBalance > targetMin && d !== startD) {
            const excess = minSimBalance - targetMin;
            
            const autosaveKey = \`savings_autosave_\${d}_\${d}\`;
            const missedKey = \`expense_missed_autosave_\${d}_\${d}\`;
            const isDiscarded = (overrides[autosaveKey] && overrides[autosaveKey].discarded) || (overrides[missedKey] && overrides[missedKey].discarded);
            const isDone = (overrides[autosaveKey] && overrides[autosaveKey].done) || (overrides[missedKey] && overrides[missedKey].done);
            
            if (!isDiscarded) {
                if (excess === 0 && d >= todayStr()) {
                    // Do nothing
                } else if (d < todayStr() && !isDone) {
                    balance -= excess;
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
                    balance -= excess;
                    savingsAccumulated += excess;
                    plan.push({
                        date: d,
                        label: 'Ahorro Automático (Excedente pre-ingreso)',
                        type: 'savings',
                        amt: -excess,
                        ref: { id: \`autosave_\${d}\`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
                        originalDate: d,
                        done: !!isDone,
                        balance,
                        isDelayed: false,
                        savingsAccumulated,
                    });
                }
            }
            
            // Adjust the simulation variables since we just swept money out
            minSimBalance -= excess;
        }

        // 2. SAVINGS RESCUE: If after all that (or if we didn't have income) we are projected to go negative, rescue money!
        if (minSimBalance < targetMin && savingsAccumulated > 0 && lastRescuePeriodEnd !== nextIncomeDate) {
            const deficit = targetMin - minSimBalance;
            const amtToWithdraw = Math.min(deficit, savingsAccumulated);

            if (amtToWithdraw > 0) {
                const autowithdrawKey = \`rescate_ahorros_autowithdraw_\${d}_\${d}\`;
                const isDiscarded = overrides[autowithdrawKey] && overrides[autowithdrawKey].discarded;
                if (!isDiscarded) {
                    balance += amtToWithdraw;
                    savingsAccumulated -= amtToWithdraw;
                    plan.push({
                        date: d,
                        label: 'Rescate de Ahorros',
                        type: 'rescate_ahorros',
                        amt: amtToWithdraw,
                        ref: { id: \`autowithdraw_\${d}\`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
                        originalDate: d,
                        done: overrides[autowithdrawKey] ? !!overrides[autowithdrawKey].done : false,
                        balance: balance,
                        isDelayed: false,
                        insufficientFunds: false,
                        savingsAccumulated,
                    });
                }
            }
        }
        
        lastRescuePeriodEnd = nextIncomeDate;
    }

    // Current day's scheduled events (that haven't been pulled early)
    let dayEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === d && !e?.pulledEarly);
    
    // 1. Process Incomes and Strict Expenses
    let incomes = dayEvents.filter(e => (e?.amt || 0) >= 0);
    let strictOut = dayEvents.filter(e => (e?.amt || 0) < 0 && (e?.done || (e?.ref?.strictDate && e?.type !== 'savings')));
    let flexibleOut = dayEvents.filter(e => (e?.amt || 0) < 0 && !e?.done && !(e?.ref?.strictDate && e?.type !== 'savings') && !(e?.type === 'savings' && d < todayStr()));
    let missedSavings = dayEvents.filter(e => (e?.amt || 0) < 0 && !e?.done && e?.type === 'savings' && d < todayStr());
    
    const applied: any[] = [];`;

if (code.includes('Determine auto-saving first: sweep BEFORE applying today')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/utils/financialEngine.ts', code);
    console.log("Patched successfully");
} else {
    console.log("Could not find target block");
}

